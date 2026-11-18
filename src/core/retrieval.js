// Retrieval layer: finds the services that fit the user's situation and hands them
// to the AI as context, so Dost can only ever suggest things that exist.
// Today: tag scoring over an in-memory catalogue. Tomorrow: the same interface
// backed by a search index / vector store over YourDOST's real catalogue.

import { COUNSELLORS, SELF_HELP, CONCERNS, USER } from "../data/catalog.js";
import { CONFIG } from "../config.js";

export function slotFor(counsellor, now = new Date()) {
  const t = new Date(now.getTime() + counsellor.hoursFromNow * 3600 * 1000);
  t.setMinutes(t.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (t.getMinutes() === 0) t.setHours(t.getHours() + 1);
  return t;
}

export function formatSlot(date, now = new Date()) {
  const day = new Date(now); day.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - day) / 86400000);
  const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow"
    : date.toLocaleDateString("en-IN", { weekday: "long" });
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" am", " am").replace(" pm", " pm");
  return `${label}, ${time}`;
}

export function retrieveSelfHelp(concerns = []) {
  const scored = SELF_HELP.map((s) => ({
    item: s,
    score: s.concerns.reduce((n, c) => n + (concerns.includes(c) ? (c === concerns[0] ? 3 : 2) : 0), 0),
  })).sort((a, b) => b.score - a.score);
  return scored;
}

// Hard filters first (gender preference, availability window), then a transparent score.
export function matchCounsellors({ concerns = [], languagePref = null, genderPref = "any", exclude = [] }, now = new Date()) {
  const langs = languagePref ? [languagePref] : USER.languages;
  const windowMs = CONFIG.availabilityWindowHours * 3600 * 1000;

  const candidates = COUNSELLORS
    .filter((c) => !exclude.includes(c.id))
    .filter((c) => genderPref === "any" || c.gender === genderPref)
    .map((c) => {
      const slot = slotFor(c, now);
      const concernHits = concerns.filter((x) => c.concerns.includes(x)); // user's priority order
      const sharedLang = c.languages.find((l) => l !== "English" && langs.includes(l))
        || (langs.includes("English") ? "English" : null);
      const soon = slot - now <= windowMs;
      let score = concernHits.length * 3 + (concernHits.includes(concerns[0]) ? 2 : 0);
      if (languagePref) score += c.languages.includes(languagePref) ? 4 : -10;
      else if (sharedLang && sharedLang !== "English") score += 2;
      score += soon ? 3 : -2;
      score += Math.max(0, 2 - (slot - now) / (12 * 3600 * 1000)); // sooner is slightly better
      const reasons = [];
      if (concernHits.length) reasons.push(`Works with ${concernHits.map((k) => CONCERNS[k].toLowerCase()).join(" and ")}`);
      if (sharedLang) reasons.push(`Speaks ${sharedLang}`);
      reasons.push(`${soon ? "Free" : "Next free"} ${formatSlot(slot, now).replace(/^(\w)/, (m) => m.toLowerCase())}`);
      return { counsellor: c, slot, soon, score: Math.round(score * 10) / 10, reasons };
    })
    .sort((a, b) => b.score - a.score);

  return candidates;
}
