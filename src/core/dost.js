// The orchestrator. Every user message goes through the same pipeline:
//   1 safety rules (raw text) -> 2 redaction -> 3 AI turn (clean + understand + reply)
//   -> 4 care policy -> 5 retrieval & matching -> 6 AI explanation
// Each step emits an event, which powers the "How Dost decided" panel today and
// would feed analytics and audit logs in production.

import { CONFIG } from "../config.js";
import { CONCERNS } from "../data/catalog.js";
import { screenText } from "./safety.js";
import { redact } from "./privacy.js";
import { decideCare } from "./policy.js";
import { retrieveSelfHelp, matchCounsellors } from "./retrieval.js";
import { complete, parseJSON, getMode, providerLabel } from "../ai/provider.js";
import { turnPrompt, explainPrompt, PROMPT_VERSION } from "../ai/prompts.js";
import { fallbackTurn, fallbackExplain, cleanTranscript, durationLabel } from "../ai/fallback.js";

const DURATIONS = ["days", "weeks", "month_plus", "long_term"];

export function createSession(onEvent = () => {}) {
  return {
    history: [],
    userTurns: 0,
    slots: { concerns: [], duration: null, impact: null, preference: null, language_pref: null, gender_pref: "any", risk: "none" },
    excluded: [],
    options: null,
    emit(step, status, title, detail) { onEvent({ step, status, title, detail, at: Date.now() }); },
  };
}

function sanitize(ai, prev) {
  const concerns = Array.isArray(ai.concerns) ? ai.concerns.filter((c) => c in CONCERNS).slice(0, 2) : [];
  const impact = Number.isFinite(Number(ai.impact)) && ai.impact !== null ? Math.max(0, Math.min(10, Math.round(Number(ai.impact)))) : null;
  return {
    clean_text: typeof ai.clean_text === "string" ? ai.clean_text.trim() : "",
    reply: typeof ai.reply === "string" ? ai.reply.trim() : "",
    ready: !!ai.ready,
    risk: ["none", "elevated", "crisis"].includes(ai.risk) ? ai.risk : "none",
    confidence: Number(ai.confidence) || 0,
    slots: {
      concerns: concerns.length ? concerns : prev.concerns,
      duration: DURATIONS.includes(ai.duration) ? ai.duration : prev.duration,
      impact: impact ?? prev.impact,
      preference: ["talk", "self"].includes(ai.preference) ? ai.preference : prev.preference,
      language_pref: typeof ai.language_pref === "string" && ai.language_pref ? ai.language_pref : prev.language_pref,
      gender_pref: ["woman", "man"].includes(ai.gender_pref) ? ai.gender_pref : prev.gender_pref,
    },
  };
}

export async function handleMessage(s, { raw, source }) {
  // 1. Safety on the raw words
  const safety = screenText(raw);
  if (safety.crisis) {
    s.emit("safety", "flag", "Safety rules flagged risk", { matched: safety.matched, action: "Routed to on-duty crisis counsellor. AI skipped." });
    return { type: "crisis", userText: source === "voice" ? cleanTranscript(raw) : raw };
  }
  s.emit("safety", "ok", "Safety rules: no risk phrases", { checked: source === "voice" ? "raw transcript, before clean-up" : "typed text" });

  // 2. Redaction
  const { text, removed } = redact(raw);
  if (removed.length) s.emit("privacy", "info", `Removed ${removed.join(", ")} before sending to AI`, null);
  else s.emit("privacy", "ok", "Privacy: no personal identifiers found", null);

  s.userTurns += 1;
  const history = s.history.map((h) => `${h.role === "user" ? "User" : "Dost"}: ${h.text}`).join("\n");

  // 3. AI turn, with rule-based fallback
  let result;
  const mode = getMode();
  if (mode !== "demo") {
    try {
      const raw2 = await complete(turnPrompt({ history, message: text, source, slots: s.slots, userTurns: s.userTurns }), { tier: "quick" });
      const ai = sanitize(parseJSON(raw2), s.slots);
      result = { ...ai, userText: source === "voice" ? (ai.clean_text || cleanTranscript(text)) : raw };
      s.emit("ai", "ok", `AI understood the message (${providerLabel()}, ${PROMPT_VERSION})`, {
        cleaned: source === "voice" ? result.userText : "(typed, unchanged)",
        concerns: ai.slots.concerns, duration: ai.slots.duration, impact: ai.slots.impact,
        preference: ai.slots.preference, risk: ai.risk, ready: ai.ready, confidence: ai.confidence,
      });
    } catch (e) {
      s.emit("ai", "fallback", "AI unavailable for this turn: used rule-based understanding", { reason: String(e.message || e) });
    }
  }
  if (!result) {
    const fb = fallbackTurn(text, s.slots, s.userTurns);
    result = {
      userText: source === "voice" ? cleanTranscript(text) : raw,
      reply: fb.reply, ready: fb.ready, risk: fb.risk, confidence: 0.5,
      slots: { ...s.slots, concerns: fb.concerns, duration: fb.duration, impact: fb.impact, preference: fb.preference },
    };
    if (mode === "demo") s.emit("ai", "info", "Demo mode: rule-based understanding", {
      concerns: fb.concerns, duration: fb.duration, impact: fb.impact, risk: fb.risk, ready: fb.ready,
    });
  }

  s.slots = { ...result.slots, risk: result.risk };
  s.history.push({ role: "user", text: result.userText });

  // AI is the second safety layer
  if (result.risk === "crisis") {
    s.emit("safety", "flag", "AI flagged risk the rules missed", { action: "Routed to on-duty crisis counsellor." });
    return { type: "crisis", userText: result.userText };
  }

  // Code-level rule: once we know the concern plus duration or impact, stop asking,
  // even if the AI wanted one more question. No unnecessary questions.
  const enough = s.slots.concerns.length > 0 && (s.slots.duration != null || s.slots.impact != null);
  const ready = result.ready || enough || s.userTurns >= CONFIG.maxUserTurnsBeforeOptions;
  if (ready) result.reply = stripQuestions(result.reply); // never ask a question right before showing options
  if (ready && !result.ready) {
    s.emit("policy", "info", enough ? "Enough detail already: skipping further questions" : "Question limit reached: moving to options", null);
  }
  s.history.push({ role: "dost", text: result.reply });
  if (!ready) return { type: "reply", userText: result.userText, reply: result.reply };

  const options = await buildOptions(s);
  return { type: "options", userText: result.userText, reply: result.reply, options };
}

export async function buildOptions(s, refine = {}) {
  // Each refinement replaces the previous one, so filters never silently stack up.
  if (refine.gender_pref) { s.slots.gender_pref = refine.gender_pref; s.slots.language_pref = null; s.excluded = []; }
  if (refine.language_pref) { s.slots.language_pref = refine.language_pref; s.slots.gender_pref = "any"; s.excluded = []; }
  if (refine.excludeCurrent && s.options) s.excluded.push(s.options.match.counsellor.id);

  // 4. Policy
  const care = decideCare(s.slots);
  s.emit("policy", "ok", `Care policy: ${care.recommended === "expert" ? "expert" : "self-help"} recommended first`, { rules: care.reasons });

  // 5. Retrieval and matching
  const sh = retrieveSelfHelp(s.slots.concerns);
  const matches = matchCounsellors({
    concerns: s.slots.concerns, languagePref: s.slots.language_pref, genderPref: s.slots.gender_pref, exclude: s.excluded,
  });
  if (!matches.length) { s.excluded = []; return buildOptions(s, {}); }
  const selfHelp = sh[0].item, match = matches[0];
  s.emit("retrieval", "ok", `Matched ${match.counsellor.name} and "${selfHelp.title}"`, {
    top_counsellors: matches.slice(0, 3).map((m) => `${m.counsellor.name}: ${m.score} (${m.reasons.join("; ")})`),
    filters: { gender: s.slots.gender_pref, language: s.slots.language_pref || "any of the user's", window: `${CONFIG.availabilityWindowHours}h preferred` },
  });

  // 6. Explanation
  const summary = s.history.filter((h) => h.role === "user").map((h) => h.text).join(" ");
  let words;
  if (getMode() !== "demo") {
    try {
      const out = parseJSON(await complete(explainPrompt({ summary, selfHelp, match, recommended: care.recommended, policyReason: care.reasons[0] }), { tier: "quick" }));
      if (out.why_expert && out.why_self_help) {
        words = out;
        s.emit("explain", "ok", "AI wrote the explanations and the counsellor note", null);
      }
    } catch (e) {
      s.emit("explain", "fallback", "AI unavailable: used template explanations", { reason: String(e.message || e) });
    }
  }
  if (!words) words = fallbackExplain({ slots: s.slots, selfHelp, match, recommended: care.recommended });

  s.options = { recommended: care.recommended, selfHelp, match, words, summary };
  return s.options;
}

function stripQuestions(reply) {
  const kept = (String(reply).match(/[^.!?]+[.!?]+/g) || [reply]).filter((x) => !x.trim().endsWith("?")).join(" ").trim();
  return kept || "Thank you for telling me all of that.";
}

export function situationLine(slots) {
  const c = slots.concerns.map((k) => CONCERNS[k].toLowerCase()).join(" and ") || "not yet clear";
  return `${c}${slots.duration ? `, ${durationLabel(slots.duration)}` : ""}${slots.impact != null ? `, impact ${slots.impact}/10` : ""}`;
}
