// Care policy: deterministic, auditable rules. The AI informs these inputs
// (concern, duration, impact) but never overrides the outcome.
// Clinical teams would own and tune these thresholds (see config.js).

import { CONFIG } from "../config.js";

const LONG = ["month_plus", "long_term"];

export function decideCare(slots) {
  const { impact, duration, preference, risk } = slots;
  const reasons = [];

  if (risk === "crisis") return { route: "crisis", recommended: null, reasons: ["Risk detected"] };

  let recommended;
  if (risk === "elevated") {
    recommended = "expert"; reasons.push("Elevated risk signals: expert first");
  } else if (impact != null && impact >= CONFIG.expertFirstImpact) {
    recommended = "expert"; reasons.push(`Impact ${impact}/10 is at or above ${CONFIG.expertFirstImpact}: expert first`);
  } else if (impact != null && impact >= CONFIG.longDurationImpact && LONG.includes(duration)) {
    recommended = "expert"; reasons.push("Moderate impact lasting a month or more: expert first");
  } else if (preference === "talk") {
    recommended = "expert"; reasons.push("User prefers to talk to someone");
  } else if (preference === "self") {
    recommended = "self_help"; reasons.push("User prefers to start on their own");
  } else if (impact != null && impact <= CONFIG.selfHelpMaxImpact) {
    recommended = "self_help"; reasons.push(`Impact ${impact}/10 is low: self-help first, expert still offered`);
  } else if (LONG.includes(duration)) {
    recommended = "expert"; reasons.push("Going on for a while: expert first");
  } else {
    recommended = "self_help"; reasons.push("Recent and moderate: self-help first, expert still offered");
  }
  return { route: "options", recommended, reasons };
}
