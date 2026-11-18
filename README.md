# Dost: an AI care coordinator for YourDOST (prototype)

Dost helps employees who don't know what support they need. They speak or type freely,
Dost listens and understands, then offers two concrete next steps (a matched self-help
programme or a matched, available counsellor). A crisis check runs on every message.

All people and data in this prototype are fictional.

## Run it

| Where | AI | How |
|---|---|---|
| claude.ai artifact | Live (Claude, no key needed) | Open the published link while signed in |
| Vercel | Live (Gemini or Claude API) | Deploy this folder, set `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) |
| Any static host / local file | Demo mode (rule-based) | Serve `dist/index.html` |

The app detects which one it's in and shows it in the "How Dost decided" panel.
Demo mode is clearly labelled, and the journey never breaks.

### Deploy to Vercel (live AI)
Build settings are in `vercel.json`, so nothing needs configuring in the dashboard except the key.

With the Vercel CLI (needs Node.js 18+):
```
npm install
npx vercel login
npx vercel                                  # first deploy, accept the defaults
npx vercel env add GEMINI_API_KEY production   # paste the key when asked
npx vercel --prod                           # redeploy so the key is picked up
```
Or push to GitHub, import the repo at vercel.com, add `GEMINI_API_KEY` under
Settings > Environment Variables, and deploy.

Check it: open `https://<your-app>.vercel.app/api/dost?check=1`. It should say
`"check":"passed"` with the model it used. The key never leaves the server.

Model choice: with Gemini the server tries Flash-Lite first (fast and reliable in testing),
then falls back through other Flash models if one is busy. Pin a model with `GEMINI_MODEL`.

### Static host (demo mode)
Drag `dist/` onto Netlify Drop, or publish it with GitHub Pages.

### Voice
One mic toggle: tap to start, tap again to finish and send (no transcript review, Wispr Flow style).
Three visible states: ready, listening while quiet (slow ripple), hearing speech (stronger ripple,
sound bars driven by the live mic level). After 5 s of silence Dost says it's still there; after
20 s it offers typing. Uses claude.ai dictation inside claude.ai, otherwise the browser's speech
recognition (best in Chrome or Edge). The live level meter is skipped on phones and wherever the
browser blocks it; the animation then reacts to recognised words instead.

## Architecture

```
src/
  config.js            policy thresholds and endpoints (remote config in production)
  data/catalog.js      fictional persona, counsellors, self-help, coverage, crisis protocol
  core/
    safety.js          layer 1 crisis rules on the raw transcript (English, Hinglish, Hindi)
    privacy.js         redacts phone numbers, emails, ID numbers before any AI call
    policy.js          stepped-care rules: which option is recommended first
    retrieval.js       grounding (RAG): self-help retrieval, counsellor matching + availability
    dost.js            orchestrator: safety -> redact -> AI turn -> policy -> retrieval -> explain
                       (moves to options as soon as concern + duration or impact are known)
  ai/
    provider.js        one interface over Claude in-app, Claude API proxy, or demo
    prompts.js         versioned prompts (dost-v1)
    fallback.js        rule-based stand-in for every AI step
  voice/speech.js      one interface over claude.ai dictation and Web Speech API
  ui/                  screens, Dost the elephant (SVG), design tokens
api/dost.js            serverless proxy (keeps the API key server-side)
scripts/build.mjs      bundles everything into one self-contained dist/index.html
```

### Why it scales
- **AI is behind one interface.** Swap models or vendors in `provider.js`; nothing else changes.
- **AI informs, rules decide.** Crisis routing, care level and matching are deterministic and
  auditable, and clinical teams can tune thresholds in `config.js` without touching prompts.
- **Retrieval is a seam.** `retrieval.js` today scores an in-memory catalogue; in production the
  same functions call YourDOST's directory, live availability and a search index over content.
- **Every step emits an event.** The evaluator panel reads them today; in production they feed
  analytics (funnel, match acceptance, fallback rate) and an audit log.
- **Graceful degradation.** Any AI failure or timeout falls back to rules for that turn.
- **Prompts are versioned data**, ready for review and A/B testing.

## Try these
Use the sample chips in the "How Dost decided" panel:
work and sleep in Hinglish (expert first), low for months (expert first),
mild stress (self-help first), and the crisis test (immediate human connection).
