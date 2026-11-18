// Rule-based stand-ins for every AI step, used in demo mode or when an AI call
// fails or times out. The journey never breaks; quality degrades gracefully.

import { CONCERNS } from "../data/catalog.js";

const CONCERN_WORDS = {
  work_stress: /work|deadline|manager|boss|office|workload|overwhelm|pressure|kaam|project|sprint|appraisal|meetings?/i,
  burnout: /burn(t|ed)? ?out|exhaust|drained|no energy|tired all the time|thak/i,
  anxiety: /anxi|panic|worr|nervous|tension|overthink|ghabra|restless/i,
  low_mood: /\bsad\b|low|empty|numb|cry|hopeless|down|udaas|nothing feels|lost interest/i,
  sleep: /sleep|insomnia|awake|neend|3 ?am|night/i,
  relationships: /partner|girlfriend|boyfriend|husband|wife|break ?up|marriage|relationship|fight with/i,
  family: /parent|family|mother|father|mom|dad|in-?laws|ghar|sibling/i,
  career: /career|promotion|layoff|switch jobs?|job search|growth|stuck in my role/i,
  grief: /passed away|died|death|loss|grief|lost my/i,
  loneliness: /alone|lonely|no friends|new city|isolat|akela/i,
};

export function detectConcerns(text) {
  return Object.entries(CONCERN_WORDS)
    .map(([k, re]) => [k, (String(text).match(new RegExp(re, "gi")) || []).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);
}

function detectDuration(t) {
  if (/year|years|always|long time|for ages|since college|kaafi time/i.test(t)) return "long_term";
  if (/month|months|since (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|mahine/i.test(t)) return "month_plus";
  if (/week|weeks|hafte/i.test(t)) return "weeks";
  if (/day|days|yesterday|today|recently|kal|aaj/i.test(t)) return "days";
  return null;
}

function detectImpact(t) {
  const n = t.match(/\b(10|[0-9])\s*(\/|out of)\s*10\b/i);
  if (n) return Number(n[1]);
  if (/can'?t (sleep|work|focus|function|eat)|every (day|night)|unbearable|falling apart|too much|bahut zyada/i.test(t)) return 8;
  if (/affect|hard to|struggl|difficult|mushkil/i.test(t)) return 6;
  if (/a bit|little|slightly|manageable|thoda/i.test(t)) return 3;
  return null;
}

function detectPreference(t) {
  if (/talk to (someone|a person|a counsell?or)|need someone|baat karni/i.test(t)) return "talk";
  if (/on my own|myself first|self[- ]help|don'?t want to talk/i.test(t)) return "self";
  return null;
}

export function cleanTranscript(raw) {
  let t = String(raw || "")
    .replace(/\b(um+|uh+|hmm+|erm|like,|you know,|basically|i mean,)\s*/gi, "")
    .replace(/\b(\w+)( \1\b)+/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "";
  t = t.replace(/\bi\b/g, "I").replace(/\bi'(m|ve|ll|d)\b/gi, (m, x) => `I'${x}`);
  t = t[0].toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

const REFLECT = {
  work_stress: "That sounds like a lot of pressure from work, and it's clearly weighing on you.",
  burnout: "It sounds like you've been running on empty for a while.",
  anxiety: "It sounds like your mind hasn't been getting much rest from the worry.",
  low_mood: "That sounds really heavy to carry.",
  sleep: "Not sleeping well makes everything else harder. That sounds exhausting.",
  relationships: "Relationship stuff can take up so much space in your head. That sounds hard.",
  family: "Family situations can be some of the hardest to carry. Thank you for sharing it.",
  career: "Feeling unsure about where work is going can be really unsettling.",
  grief: "I'm so sorry. Loss like that changes everything for a while.",
  loneliness: "Feeling alone with things is hard, and it took something to say it.",
};

export function fallbackTurn(text, slots, userTurns) {
  const concerns = detectConcerns(text);
  const next = {
    concerns: concerns.length ? concerns : slots.concerns,
    duration: detectDuration(text) || slots.duration,
    impact: detectImpact(text) ?? slots.impact,
    preference: detectPreference(text) || slots.preference,
    risk: /hopeless|panic attack|haven'?t (eaten|slept) (in|for) days/i.test(text) ? "elevated" : "none",
  };
  const main = next.concerns[0];
  let reply = main ? REFLECT[main] : "Thank you for telling me. I'm listening.";
  let ready = (next.concerns.length > 0 && (next.duration || next.impact != null)) || userTurns >= 3;
  if (!ready) {
    reply += next.concerns.length
      ? " How long has this been going on, and how much is it affecting your day-to-day?"
      : " Could you tell me a little more about what's been going on?";
  }
  return { reply, ready, ...next };
}

export function fallbackExplain({ slots, selfHelp, match, recommended }) {
  const label = slots.concerns[0] ? CONCERNS[slots.concerns[0]].toLowerCase() : "what you're going through";
  return {
    intro: recommended === "expert"
      ? "From what you've shared, talking it through with someone could really help. Here are two ways to start."
      : "Here are two ways to start. You can begin right now, or talk to someone.",
    why_self_help: `Built for ${label}. You can start now, in a few minutes, wherever you are.`,
    why_expert: `${match.counsellor.name.split(" ")[0]} works with people dealing with ${label}, and is free soon.`,
    handover_note: `Ananya would like support with ${label}${slots.duration ? `, going on for ${durationLabel(slots.duration)}` : ""}${slots.impact != null ? `, affecting daily life (${slots.impact}/10)` : ""}. Shared through Dost with her consent.`,
  };
}

export function durationLabel(d) {
  return { days: "a few days", weeks: "a few weeks", month_plus: "over a month", long_term: "a long time" }[d] || "a while";
}
