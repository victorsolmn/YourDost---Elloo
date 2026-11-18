// Server-side AI proxy for hosted deployments (Vercel serverless function).
// The API key lives only in Vercel's environment variables and never reaches the browser.
//
// Supported providers (set ONE key in Vercel > Settings > Environment Variables):
//   GEMINI_API_KEY      Google Gemini   (optional GEMINI_MODEL to pin one model; default picks Flash-Lite)
//   ANTHROPIC_API_KEY   Anthropic Claude (optional DOST_MODEL_QUICK, DOST_MODEL)
//
// GET  /api/dost           -> { ok, live, provider }
// GET  /api/dost?check=1   -> also makes a tiny test call, reports the model used or the error
// POST /api/dost {prompt}  -> { text }

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
let geminiList = null; // ordered fallback list, discovered once per instance

function provider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

// Builds an ordered list of Flash models this key can use. If one is busy or missing,
// the next is tried, so a temporary spike on one model doesn't break the experience.
async function geminiModels(key) {
  if (geminiList) return geminiList;
  const r = await fetch(`${GEMINI_BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || `model list failed (${r.status})`);
  const names = (j.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
    .map((m) => m.name.replace(/^models\//, ""));
  const skip = /(image|tts|audio|live|embedding|thinking|exp|preview|omni|banana|customtools)/;
  const byNewest = (a, b) => b.localeCompare(a, undefined, { numeric: true });
  const flash = names.filter((n) => /^gemini-[\d.]+-flash$/.test(n)).sort(byNewest);
  const lite = names.filter((n) => /^gemini-[\d.]+-flash-lite$/.test(n)).sort(byNewest);
  // Flash-Lite first: Dost's tasks are light, and in testing Lite answered in about a second
  // while full Flash models were often overloaded. Full Flash stays as a last resort.
  const list = [process.env.GEMINI_MODEL, lite[0], "gemini-flash-lite-latest", lite[1], flash[0], "gemini-flash-latest"]
    .filter((n, i, arr) => n && !skip.test(n) && (n === process.env.GEMINI_MODEL || names.includes(n)) && arr.indexOf(n) === i);
  if (!list.length) throw new Error("no usable Gemini model for this key");
  geminiList = list;
  return list;
}

async function geminiOnce(key, model, prompt) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
      method: "POST", signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: "application/json" },
      }),
    });
    const j = await r.json();
    if (!r.ok) { const e = new Error((j.error && j.error.message) || `Gemini error ${r.status}`); e.status = r.status; throw e; }
    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const text = parts.filter((p) => !p.thought).map((p) => p.text || "").join("");
    if (!text) { const e = new Error("Gemini returned no text"); e.status = 500; throw e; }
    return text;
  } finally { clearTimeout(timer); }
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const list = await geminiModels(key);
  let last;
  for (const model of list) {
    try {
      const text = await geminiOnce(key, model, prompt);
      if (list[0] !== model) geminiList = [model, ...list.filter((m) => m !== model)]; // remember what works
      return { text, model };
    } catch (e) {
      last = e;
      const retryable = !e.status || [404, 429, 500, 503].includes(e.status) || e.name === "AbortError";
      if (!retryable) throw e; // e.g. a bad key: no point trying other models
    }
  }
  throw last;
}

async function callAnthropic(prompt, tier) {
  const model = tier === "default" ? (process.env.DOST_MODEL || "claude-sonnet-5-5") : (process.env.DOST_MODEL_QUICK || "claude-haiku-5-5");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || `Anthropic error ${r.status}`);
  return { text: (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join(""), model };
}

const complete = (prompt, tier) => (provider() === "gemini" ? callGemini(prompt) : callAnthropic(prompt, tier));

export default async function handler(req, res) {
  const p = provider();
  if (req.method === "GET") {
    const out = { ok: true, live: !!p, provider: p };
    if (p && req.query && req.query.check) {
      try { const r = await complete('Reply with exactly this JSON: {"ok":true}', "quick"); out.check = "passed"; out.model = r.model; }
      catch (e) { out.check = "failed"; out.error = String(e.message || e); }
    }
    return res.status(200).json(out);
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  if (!p) return res.status(503).json({ error: "live AI not configured" });

  const { prompt, tier } = req.body || {};
  if (typeof prompt !== "string" || !prompt || prompt.length > 20000) return res.status(400).json({ error: "invalid prompt" });
  try {
    const { text } = await complete(prompt, tier);
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
}
