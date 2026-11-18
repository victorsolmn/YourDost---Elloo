// One interface, swappable backends. The rest of the app calls complete(prompt)
// and never knows which model or vendor answered.
//   claude: inside claude.ai, via the artifact runtime (no API key needed)
//   api:    any host with the /api/dost proxy (API key stays on the server)
//   demo:   no AI available; the orchestrator uses rule-based fallbacks

import { CONFIG } from "../config.js";

let sample = null;
let mode = "demo";
let forced = false;
let apiProvider = null;

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

export async function detectProvider() {
  try {
    if (window.claude && typeof window.claude.use === "function") {
      const s = await withTimeout(window.claude.use("sample"), 6000).catch(() => null);
      if (s) { sample = s; mode = "claude"; return mode; }
    }
  } catch (_) { /* not inside claude.ai */ }
  try {
    const r = await withTimeout(fetch(CONFIG.apiEndpoint, { method: "GET" }), 3000);
    if (r.ok) {
      const j = await r.json();
      if (j && j.live) { mode = "api"; apiProvider = j.provider; return mode; }
    }
  } catch (_) { /* no server proxy */ }
  mode = "demo";
  return mode;
}

export function getMode() { return forced ? "demo" : mode; }
export function setForcedDemo(v) { forced = !!v; }
export function liveAvailable() { return mode !== "demo"; }
export function providerLabel() {
  const m = getMode();
  if (m === "claude") return "Claude in claude.ai";
  if (m === "api") return apiProvider === "gemini" ? "Gemini API" : "Claude API";
  return null;
}

export async function complete(prompt, { tier = "quick" } = {}) {
  const m = getMode();
  if (m === "claude") {
    const r = await withTimeout(sample(prompt, { modelTier: tier, cache: false }), CONFIG.aiTimeoutMs);
    return r.text;
  }
  if (m === "api") {
    const r = await withTimeout(fetch(CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, tier }),
    }), CONFIG.aiTimeoutMs);
    if (!r.ok) throw new Error(`api ${r.status}`);
    const j = await r.json();
    return j.text;
  }
  throw new Error("demo");
}

export function parseJSON(text) {
  const s = String(text || "").replace(/```json|```/g, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("no json");
  return JSON.parse(s.slice(a, b + 1));
}
