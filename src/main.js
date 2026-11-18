import "./ui/styles.css";
import { USER, COVERAGE, CRISIS_PROTOCOL, SETTLE } from "./data/catalog.js";
import { createSession, handleMessage, buildOptions, situationLine } from "./core/dost.js";
import { detectProvider, getMode, setForcedDemo, liveAvailable, providerLabel } from "./ai/provider.js";
import { initVoice, voiceAvailable, voiceEngine, startListening, startLevelMeter } from "./voice/speech.js";
import { elephant, heroScene } from "./ui/art.js";
import { formatSlot } from "./core/retrieval.js";

// ---------- icons ----------
const I = {
  mic: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`,
  send: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  back: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>`,
  compass: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>`,
  cal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>`,
  user: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
  moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>`,
  lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="flex:none;margin-top:2px"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  check: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg>`,
  phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
  stop: `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="3"/></svg>`,
  leaf: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>`,
  chevron: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
  chat: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>`,
  clip: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/></svg>`,
  group: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="9" r="3.2"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6M15 15.2c2.2-.3 4.2.9 5 3.3"/></svg>`,
  close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  keyboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>`,
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const firstName = (n) => n.split(" ")[0];
const initials = (n) => n.split(" ").map((p) => p[0]).join("").slice(0, 2);

// ---------- state ----------
const S = {
  screen: "login",
  otpSent: false,
  thread: [],
  typeMode: false,
  draft: "",
  busy: false,
  talkMore: false,
  options: null,
  booking: null,
  connect: null,
  breathe: null,
  log: [],
  panelOpen: false,
  voiceReady: false,
  langPicker: false,
  listen: null,   // { state: "ready" | "listening", prompt }
  sheet: null,    // "self" | "expert"
  starter: null,  // topic picked from the home starter chips
  upNext: null,   // { kind: "session" | "programme", title, meta }
};
const L = { meterStop: null, meterLive: false, level: 0, lastVoice: 0, tick: null, silence: 0 };
let session = newSession();
let listenSession = null;
let timers = [];

function newSession() {
  return createSession((ev) => { S.log.unshift(ev); renderPanel(); });
}

const phone = () => document.getElementById("phone");
const panel = () => document.getElementById("panel");

function go(screen) { clearTimers(); S.screen = screen; render(); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

function toast(msg) {
  const old = document.querySelector(".toast"); if (old) old.remove();
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  phone().appendChild(t); setTimeout(() => t.remove(), 2800);
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// ---------- screens ----------
function loginScreen() {
  return `<div class="screen"><div class="login">
    <div class="brand"><span class="brand-mark">Y</span>YourDOST</div>
    <div style="margin-top:18px">${elephant({ size: 96, state: "idle" })}</div>
    <div><h1>Welcome back</h1><p class="muted" style="margin-top:6px">Your support, private to you.</p></div>
    ${!S.otpSent ? `
      <label class="sr-only" for="ph">Mobile number</label>
      <div class="field"><span class="muted">+91</span><input id="ph" inputmode="numeric" value="${USER.phone}" /></div>
      <button class="btn btn-primary btn-block" data-action="send-otp">Send code</button>
    ` : `
      <div><p>Enter the 4-digit code sent to +91 ${USER.phone}</p><p class="small muted" style="margin-top:4px">Prototype: any 4 digits work.</p></div>
      <div class="otp">${["1", "2", "3", "4"].map((d, i) => `<input aria-label="Digit ${i + 1}" inputmode="numeric" maxlength="1" value="${d}"/>`).join("")}</div>
      <button class="btn btn-primary btn-block" data-action="verify">Verify and continue</button>
    `}
    <p class="small muted" style="margin-top:auto">All people and data in this prototype are fictional.</p>
  </div></div>`;
}

function homeScreen() {
  return `<div class="screen"><div class="scroll">
    <div class="home-top">
      <div><p class="muted small">${greeting()}</p><h1>Hi, ${USER.firstName}</h1></div>
      <div style="display:flex;gap:8px"><button class="icon-btn" data-action="theme" aria-label="Switch light or night mode">${I.moon}</button><span class="avatar" aria-hidden="true">A</span></div>
    </div>
    <section class="hero" aria-labelledby="hero-q">
      <div class="hero-copy"><h2 id="hero-q">How are you feeling today?</h2>
        <p>Tell Dost in your own words.</p></div>
      ${heroScene()}
      <div class="hero-actions">
        <button class="btn btn-primary btn-block" data-action="talk">${I.mic} Tap and talk to Dost</button>
        <button class="btn btn-ghost hero-type" data-action="type-start">${I.keyboard} or type instead</button>
      </div>
    </section>
    <p class="privacy-line">${I.lock}<span>Only you see this. Your employer never sees what you share.</span></p>
    <div class="section-head"><h3>Not sure how to start?</h3></div>
    <div class="chips">${STARTERS.map((t, i) => `<button class="chip starter" data-action="starter" data-i="${i}">${esc(t.label)}</button>`).join("")}</div>
    ${S.upNext ? `<div class="section-head"><h3>Up next</h3></div>
      <button class="upnext" data-action="upnext">
        <span class="tile-icon">${S.upNext.kind === "session" ? I.cal : I.leaf}</span>
        <span style="flex:1"><strong>${esc(S.upNext.title)}</strong><span class="small muted" style="display:block">${esc(S.upNext.meta)}</span></span>
        <span class="tile-go">${I.chevron}</span></button>` : ""}
    <div class="section-head"><h3>Know what you need?</h3></div>
    <div class="tiles">
      ${[["Talk to an expert", "Choose your counsellor and book", I.chat, "--purple-tint-2"],
         ["Self-help", "Short guided programmes", I.leaf, "--orange-tint"],
         ["Assessments", "3-minute check-ins", I.clip, "--orange-tint"],
         ["Workshops", "Live group sessions", I.group, "--purple-tint-2"]].map(([t, d, ic, bg]) =>
        `<button class="tile" style="background:var(${bg})" data-action="existing" aria-label="${t}: ${d}">
          <span class="tile-icon">${ic}</span><h3>${t}</h3><p>${d}</p><span class="tile-go" aria-hidden="true">${I.chevron}</span></button>`).join("")}
    </div>
  </div>${nav("home")}</div>`;
}

function nav(active) {
  return `<nav class="nav" aria-label="Main">
    <button ${active === "home" ? 'aria-current="page"' : ""} data-action="home">${I.home}Home</button>
    <button data-action="existing">${I.compass}Explore</button>
    <button class="nav-mic" data-action="talk" aria-label="Talk to Dost">${I.mic}</button>
    <button data-action="existing">${I.cal}Sessions</button>
    <button data-action="existing">${I.user}Profile</button>
  </nav>`;
}

function chatScreen() {
  const items = S.thread.map(threadItem).join("");
  const showComposer = !S.options || S.talkMore;
  return `<div class="screen">
    <div class="topbar">
      <button class="icon-btn" data-action="home" aria-label="Back to home">${I.back}</button>
      <div class="title">Dost <span class="ai-tag">AI guide</span></div>
      <button class="pill-human" data-action="human">Talk to a person</button>
    </div>
    <div class="scroll" id="chat-scroll"><div class="thread" aria-live="polite">${items}</div></div>
    ${showComposer ? composer() : `<div class="composer"><button class="btn btn-ghost" data-action="talk-more">Neither feels right? Talk a bit more</button></div>`}
  </div>`;
}

function threadItem(it) {
  if (it.who === "user") return `<div class="msg-user">${esc(it.text)}</div>`;
  if (it.who === "dost") return `<div class="msg-dost">${elephant({ size: 40, state: "still" })}<p>${esc(it.text)}</p></div>`;
  if (it.who === "typing") return `<div class="msg-dost">${elephant({ size: 40, state: "thinking" })}<span class="typing" aria-label="Dost is thinking"><i></i><i></i><i></i></span></div>`;
  if (it.who === "options") return optionsBlock();
  return "";
}

function composer() {
  if (!S.typeMode) {
    return `<div class="composer">
      <button class="mic" data-action="talk" aria-label="Talk to Dost">${I.mic}</button>
      <button class="btn btn-ghost" data-action="type-mode">${I.keyboard} Type instead</button>
    </div>`;
  }
  return `<div class="composer"><div class="row">
      <button class="icon-btn" data-action="talk" aria-label="Speak instead">${I.mic}</button>
      <label class="sr-only" for="draft">Message to Dost</label>
      <textarea id="draft" rows="1" placeholder="Say what's on your mind" ${S.busy ? "disabled" : ""}>${esc(S.draft)}</textarea>
      <button class="send" data-action="send" aria-label="Send" ${S.busy ? "disabled" : ""}>${I.send}</button>
    </div></div>`;
}

function optionsBlock() {
  const o = S.options; if (!o) return "";
  const { selfHelp, match, words, recommended } = o;
  const c = match.counsellor;
  const mins = (selfHelp.length.match(/(\d+) min/) || [])[1];
  const selfCard = `<article class="opt self ${recommended === "self_help" ? "recommended" : ""}" aria-label="Self-help option">
    ${recommended === "self_help" ? `<span class="badge">Recommended</span>` : ""}
    <span class="opt-icon" aria-hidden="true">${I.leaf}</span>
    <span class="kind">Self-help</span>
    <h3>${esc(selfHelp.title)}</h3>
    <p class="meta">${mins ? `${mins} min, ` : ""}start right now</p>
    <button class="btn ${recommended === "self_help" ? "btn-primary" : "btn-soft"}" data-action="start-self">Start</button>
    <button class="link why-link" data-action="sheet" data-s="self">Why this?</button>
  </article>`;
  const expertCard = `<article class="opt expert ${recommended === "expert" ? "recommended" : ""}" aria-label="Talk to an expert option">
    ${recommended === "expert" ? `<span class="badge">Recommended</span>` : ""}
    <span class="opt-icon" aria-hidden="true">${initials(c.name)}</span>
    <span class="kind">Talk to an expert</span>
    <h3>${esc(c.name)}</h3>
    <p class="meta">${esc(formatSlot(match.slot))}</p>
    <button class="btn ${recommended === "expert" ? "btn-primary" : "btn-soft"}" data-action="book">Book</button>
    <button class="link why-link" data-action="sheet" data-s="expert">Why ${esc(firstName(c.name))}?</button>
  </article>`;
  return `<div class="msg-dost" id="opts">${elephant({ size: 40, state: "still" })}<p>${esc(words.intro)}</p></div>
    <div class="opt-grid">${recommended === "expert" ? expertCard + selfCard : selfCard + expertCard}</div>`;
}

function sheetView() {
  const o = S.options; if (!o || !S.sheet) return "";
  const { selfHelp, match, words, recommended } = o, c = match.counsellor;
  const body = S.sheet === "self" ? `
    <div class="sheet-head"><span class="kind">Self-help${recommended === "self_help" ? ", recommended for you" : ""}</span>
      <button class="icon-btn" data-action="sheet-close" aria-label="Close">${I.close}</button></div>
    <h2>${esc(selfHelp.title)}</h2>
    <p class="muted small">${esc(selfHelp.length)}</p>
    <p>${esc(selfHelp.summary)}</p>
    <div class="card"><p class="small muted" style="margin-bottom:4px">Why this fits you</p><p class="why">${esc(words.why_self_help)}</p></div>
    <p class="covered">Included for ${esc(COVERAGE.employer)} employees</p>
    <button class="btn btn-primary btn-block" data-action="start-self">Start now</button>`
  : `
    <div class="sheet-head"><span class="kind">Talk to an expert${recommended === "expert" ? ", recommended for you" : ""}</span>
      <button class="icon-btn" data-action="sheet-close" aria-label="Close">${I.close}</button></div>
    <div class="person"><span class="initials" aria-hidden="true">${initials(c.name)}</span>
      <div><h2 style="font-size:19px">${esc(c.name)}</h2><p class="small muted">${esc(c.title)}, ${c.years} years</p></div></div>
    <div class="tags">${match.reasons.map((r) => `<span class="tag">${esc(r)}</span>`).join("")}</div>
    <div class="card"><p class="small muted" style="margin-bottom:4px">Why ${esc(firstName(c.name))}</p><p class="why">${esc(words.why_expert)}</p></div>
    <p class="covered">Covered by ${esc(COVERAGE.employer)}</p>
    <button class="btn btn-primary btn-block" data-action="book">Book this session</button>
    <div>
      <p class="small muted" style="margin-bottom:8px">Prefer someone else?</p>
      <div class="chips">
        <button class="chip" data-action="refine" data-g="woman" aria-pressed="${o.genderPref === "woman"}">A woman</button>
        <button class="chip" data-action="refine" data-g="man" aria-pressed="${o.genderPref === "man"}">A man</button>
        <button class="chip" data-action="lang-picker" aria-expanded="${S.langPicker}">Another language</button>
        <button class="chip" data-action="refine" data-next="1">Someone else</button>
      </div>
      ${S.langPicker ? `<div class="chips" style="margin-top:8px">${["Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Bengali"].map((l) =>
        `<button class="chip" data-action="refine" data-l="${l}">${l}</button>`).join("")}</div>` : ""}
    </div>`;
  return `<div class="sheet-backdrop" data-action="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Option details"><div class="handle" aria-hidden="true"></div>${body}</div>`;
}

function bookScreen() {
  const o = S.options, b = S.booking, c = o.match.counsellor;
  if (b.confirmed) {
    return `<div class="screen"><div class="scroll" style="display:flex;flex-direction:column;gap:18px">
      <div style="text-align:center;margin-top:20px"><div class="check" style="color:var(--ok)">${I.check}</div>
        <h1 style="margin-top:16px">You're booked with ${esc(firstName(c.name))}</h1>
        <p class="muted" style="margin-top:6px">${esc(formatSlot(o.match.slot))}, ${b.format.toLowerCase()} session</p></div>
      <div class="card"><p>We'll remind you 30 minutes before.${b.share ? ` ${esc(firstName(c.name))} will read your note beforehand, so you won't have to start from zero.` : ""}</p></div>
      <div class="card" style="background:var(--orange-tint)"><h3>While you wait</h3>
        <p class="small" style="margin:4px 0 12px">A 1-minute settle can take the edge off until then.</p>
        <button class="btn btn-soft btn-block" data-action="settle">Try the 1-minute settle</button></div>
      <button class="btn btn-ghost" data-action="home">Back to home</button>
    </div></div>`;
  }
  return `<div class="screen">
    <div class="topbar"><button class="icon-btn" data-action="back-chat" aria-label="Back">${I.back}</button><div class="title">Confirm your session</div></div>
    <div class="scroll" style="display:flex;flex-direction:column;gap:16px">
      <div class="card"><div class="person"><span class="initials" aria-hidden="true">${initials(c.name)}</span>
        <div><h3>${esc(c.name)}</h3><p class="small muted">${esc(c.title)}</p></div></div>
        <p style="margin-top:12px"><strong>${esc(formatSlot(o.match.slot))}</strong></p>
        <p class="covered" style="margin-top:2px">Covered by ${esc(COVERAGE.employer)}</p></div>
      <div><p style="margin-bottom:8px">How would you like to talk?</p>
        <div class="chips">${["Video", "Audio", "Chat"].map((f) => `<button class="chip" data-action="format" data-f="${f}" aria-pressed="${b.format === f}">${f}</button>`).join("")}</div></div>
      <div class="card"><div class="toggle-row">
        <div style="flex:1"><h3>Share a short note with ${esc(firstName(c.name))}</h3>
          <p class="small muted" style="margin-top:4px">So you don't have to repeat yourself. Off unless you turn it on.</p></div>
        <button class="switch" role="switch" aria-checked="${b.share}" aria-label="Share note with counsellor" data-action="share"></button></div>
        ${b.share ? `<div class="note"><p class="small" style="font-weight:600;margin-bottom:4px">What ${esc(firstName(c.name))} will see</p>${esc(o.words.handover_note)}</div>` : ""}
      </div>
      <button class="btn btn-primary btn-block" data-action="confirm">Confirm booking</button>
    </div></div>`;
}

function breatheScreen() {
  const st = S.breathe;
  if (st.phase === "done") {
    return `<div class="screen"><div class="breathe">
      ${elephant({ size: 110, state: "idle" })}
      <h2>How do you feel now?</h2>
      <div class="chips" style="justify-content:center">
        <button class="chip" data-action="feel" data-v="calmer">A little calmer</button>
        <button class="chip" data-action="feel" data-v="same">About the same</button>
        <button class="chip" data-action="feel" data-v="worse">Worse</button></div>
      ${st.feel ? feelFollowUp(st.feel) : ""}
    </div></div>`;
  }
  return `<div class="screen"><div class="breathe">
    <p class="small" style="font-weight:600">${esc(st.title)}</p>
    <div class="bubble-box"><div class="bubble ${st.inhale ? "in" : ""}" id="bubble">${elephant({ size: 70, state: "still" })}</div></div>
    <p class="cue" aria-live="polite" id="cue">${st.phase === "ready" ? "Ready when you are" : esc(st.cue)}</p>
    ${st.phase === "ready"
      ? `<button class="btn btn-primary" data-action="breathe-go">Begin</button>`
      : `<p class="muted small" id="left">${st.left}s left</p><button class="btn btn-ghost" data-action="breathe-skip">Finish early</button>`}
  </div></div>`;
}

function feelFollowUp(v) {
  if (v === "worse") return `<div class="card" style="text-align:left;max-width:320px"><p>Thanks for telling me. Would you like to talk to someone?</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
      <button class="btn btn-primary" data-action="human">Talk to someone now</button>
      ${S.options ? `<button class="btn btn-soft" data-action="book">Book with ${esc(firstName(S.options.match.counsellor.name))}</button>` : ""}</div></div>`;
  const next = S.breathe.programme;
  return `<div class="card" style="text-align:left;max-width:320px"><p>${v === "calmer" ? "Good. Small resets add up." : "That's okay. It often takes a few tries."}</p>
    ${next ? `<p class="small muted" style="margin-top:6px">Next in your plan: ${esc(next.title)}, tomorrow evening. I'll send a gentle reminder.</p>` : ""}
    <button class="btn btn-soft btn-block" style="margin-top:12px" data-action="home">Back to home</button></div>`;
}

function crisisScreen() {
  return `<div class="screen crisis"><div class="scroll" style="display:flex;flex-direction:column;gap:18px">
    <div style="margin-top:8px">${elephant({ size: 56, state: "still" })}</div>
    <h1>I'm really glad you told me.</h1>
    <p style="font-size:18px">You don't have to handle this alone. A counsellor can talk with you right now.</p>
    <button class="btn btn-primary btn-block" data-action="connect-crisis">Connect me to a counsellor now</button>
    <p class="small muted">Or call, free and any time:</p>
    ${CRISIS_PROTOCOL.helplines.map((h) => `<a class="helpline" href="tel:${h.number}"><span>${esc(h.label)}</span><strong>${I.phone} ${h.number}</strong></a>`).join("")}
    <p class="small muted">If you're in immediate danger, please call 112 or go to the nearest hospital.</p>
  </div></div>`;
}

function connectScreen() {
  const cx = S.connect, p = CRISIS_PROTOCOL.onDuty;
  return `<div class="screen ${cx.crisis ? "crisis" : ""}">
    <div class="topbar"><div class="title">${cx.joined ? `${esc(p.name)}, ${esc(p.title.toLowerCase())}` : "Connecting you"}</div></div>
    <div class="scroll" style="display:flex;flex-direction:column;gap:16px">
      ${!cx.joined ? `<div class="card" style="display:flex;gap:12px;align-items:center"><span class="typing"><i></i><i></i><i></i></span>
        <p>Connecting you to a counsellor who's on duty now${cx.crisis ? ". Stay with me, it's usually under a minute." : "."}</p></div>`
      : `<div style="display:flex;gap:10px;align-items:flex-end"><span class="initials" aria-hidden="true">${initials(p.name)}</span>
        <div class="human-msg">${cx.crisis
          ? `Hi ${USER.firstName}, I'm ${p.name}, a counsellor with YourDOST. I'm here with you now. Before anything else, are you somewhere safe right now?`
          : `Hi ${USER.firstName}, I'm ${p.name}, a counsellor with YourDOST. I'm here and I have time. What's on your mind?`}</div></div>
        <p class="small muted">Prototype: this is a simulated counsellor message. In the product this opens a live chat or call.</p>`}
      ${cx.crisis ? CRISIS_PROTOCOL.helplines.map((h) => `<a class="helpline" href="tel:${h.number}"><span>${esc(h.label)}</span><strong>${I.phone} ${h.number}</strong></a>`).join("") : ""}
      ${cx.joined ? `<button class="btn btn-ghost" data-action="home">Back to home</button>` : ""}
    </div></div>`;
}

function listenPrompt() {
  if (S.thread.some((t) => t.who === "user")) {
    const lastDost = [...S.thread].reverse().find((t) => t.who === "dost");
    const q = lastDost && (lastDost.text.match(/[^.!?]*\?/g) || []).pop();
    if (q) {
      const t = q.trim();
      return t.length < 60 && !t.includes(USER.firstName) ? t.replace(/\?$/, `, ${USER.firstName}?`) : t;
    }
    return `Tell me a bit more, ${USER.firstName}.`;
  }
  const h = new Date().getHours();
  if (h >= 22 || h < 5) return `Still up, ${USER.firstName}? What's on your mind?`;
  if (h < 12) return `What brings you here this morning, ${USER.firstName}?`;
  if (h < 17) return `What's on your mind today, ${USER.firstName}?`;
  return `How was your day, ${USER.firstName}?`;
}

function listenStatus() {
  const st = S.listen;
  if (!st || st.state === "ready") return "Tap the mic when you're ready. English, Hindi or a mix, all fine.";
  if (L.silence >= 1) return `I'm still here, ${USER.firstName}. Take your time.`;
  return "Listening…";
}

function listenOverlay() {
  const st = S.listen, on = st.state === "listening";
  return `<div class="listen ${st.state}" id="listen" role="dialog" aria-label="Talk to Dost">
    <div class="listen-top"><button class="icon-btn" data-action="listen-back" aria-label="Go back">${I.back}</button></div>
    <div class="listen-body">
      <div class="halo">${elephant({ size: 150, state: on ? "listening" : "idle" })}</div>
      <div class="bars" aria-hidden="true">${[0.5, 0.8, 1, 0.75, 0.55].map((m) => `<i style="--m:${m}"></i>`).join("")}</div>
      <h2>${esc(st.prompt)}</h2>
      <p class="muted listen-status" id="listen-status" aria-live="polite">${esc(listenStatus())}</p>
      <button class="link" id="listen-type" data-action="listen-type" ${on && L.silence >= 2 ? "" : "hidden"}>Prefer to type instead?</button>
    </div>
    <div class="listen-foot">
      <button class="mic-toggle" data-action="listen-toggle" aria-pressed="${on}" aria-label="${on ? "Stop and send" : "Start talking"}">
        <span class="ring r1"></span><span class="ring r2"></span>${on ? I.stop : I.mic}</button>
      <p class="small muted">${on ? "Tap to finish" : "Tap to start talking"}</p>
    </div>
  </div>`;
}

// ---------- render ----------
function render() {
  const map = { login: loginScreen, home: homeScreen, chat: chatScreen, book: bookScreen, breathe: breatheScreen, crisis: crisisScreen, connect: connectScreen };
  phone().innerHTML = map[S.screen]() + (S.screen === "chat" ? sheetView() : "") + (S.listen ? listenOverlay() : "");
  if (S.screen === "chat") {
    const sc = document.getElementById("chat-scroll");
    const anchor = S.scrollToOptions && document.getElementById("opts");
    if (anchor && sc) { sc.scrollTop = anchor.offsetTop - 12; S.scrollToOptions = false; }
    else if (sc) sc.scrollTop = sc.scrollHeight;
    const ta = document.getElementById("draft"); if (ta && !S.busy) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
  }
}

function renderPanel() {
  const mode = getMode();
  const label = mode === "demo" ? "Demo mode: rule-based" : `Live AI: ${providerLabel()}`;
  panel().innerHTML = `
    <h2>How Dost decided</h2>
    <p class="small muted" style="margin:4px 0 12px">For evaluators. Users never see this panel.</p>
    <span class="mode ${mode === "demo" ? "demo" : ""}">${label}</span>
    <p class="small muted" style="margin-top:8px">Voice: ${esc(voiceEngine())}${voiceAvailable() ? "" : " (typing only in this browser)"}</p>
    ${liveAvailable() ? `<div class="switch-row"><span>Force demo mode (shows the fallback)</span>
      <button class="switch" role="switch" aria-checked="${mode === "demo"}" data-action="force-demo" aria-label="Force demo mode"></button></div>` : ""}
    <ol class="pipeline">
      <li>Safety rules check the raw words</li><li>Personal details removed</li><li>AI cleans, understands and replies</li>
      <li>Care policy picks what comes first</li><li>Retrieval matches real services and slots</li><li>AI explains the match</li>
    </ol>
    <h3 style="font-size:15px">Try a sample message</h3>
    <div class="samples">
      <button class="chip" data-action="sample" data-i="0">Work and sleep (Hinglish)</button>
      <button class="chip" data-action="sample" data-i="1">Low for months</button>
      <button class="chip" data-action="sample" data-i="2">Mild stress</button>
      <button class="chip" data-action="sample" data-i="3">Crisis test</button>
    </div>
    <p class="small muted">Situation so far: ${esc(situationLine(session.slots))}</p>
    <div class="log">${S.log.map((e) => `<div class="log-item ${e.status}"><b>${esc(e.title)}</b>${e.detail ? `<pre>${esc(typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail, null, 2))}</pre>` : ""}</div>`).join("") || `<p class="small muted">Steps appear here as you talk to Dost.</p>`}</div>
    ${S.log.length ? `<button class="btn btn-ghost" data-action="reset">Start over</button>` : ""}`;
}

// Starter chips send a ready-made first message, so the user lands straight on Dost's follow-up.
const STARTERS = [
  { label: "Work stress", concern: "work_stress", message: "I've been feeling really stressed about work." },
  { label: "Can't sleep", concern: "sleep", message: "I haven't been sleeping well lately." },
  { label: "Feeling low", concern: "low_mood", message: "I've been feeling low." },
  { label: "Just want to talk", concern: null, message: "I just want to talk to someone." },
];

const SAMPLES = [
  "Yaar kaam ka pressure bahut zyada hai, my manager keeps scheduling late night calls and main 3 baje tak so nahi paata. It's been like this for over a month.",
  "I've been feeling low and kind of empty for months now. I go to work, come back, and nothing feels interesting anymore.",
  "Bit stressed this week with a release deadline. It's manageable, I just want to unwind better.",
  "Honestly I don't want to live like this anymore.",
];

// ---------- conversation ----------
function ensureIntro() {
  if (!S.thread.length) S.thread.push({ who: "dost", text: `Hi ${USER.firstName}, I'm Dost, an AI guide. I'm here to listen and help you find the right support. What's been on your mind?` });
}

async function send(text, source) {
  text = String(text || "").trim();
  if (!text || S.busy) return;
  S.busy = true; S.draft = "";
  if (S.screen !== "chat") { S.screen = "chat"; ensureIntro(); }
  if (source === "typed") S.thread.push({ who: "user", text });
  S.thread.push({ who: "typing" });
  render();
  let res;
  try { res = await handleMessage(session, { raw: text, source }); }
  catch (e) { res = { type: "reply", userText: text, reply: "Sorry, something went wrong on my side. Could you say that again?" }; }
  S.thread = S.thread.filter((t) => t.who !== "typing");
  if (source === "voice") S.thread.push({ who: "user", text: res.userText });
  S.busy = false;
  if (res.type === "crisis") { renderPanel(); go("crisis"); return; }
  S.thread.push({ who: "dost", text: res.reply });
  if (res.type === "options") {
    S.thread = S.thread.filter((t) => t.who !== "options");
    S.options = { ...res.options, genderPref: session.slots.gender_pref };
    S.talkMore = false; S.langPicker = false;
    S.thread.push({ who: "options" });
    S.scrollToOptions = true;
  }
  render(); renderPanel();
}

function openListen() {
  if (!voiceAvailable()) {
    S.typeMode = true;
    if (S.screen !== "chat") { S.screen = "chat"; ensureIntro(); }
    render(); toast("Voice isn't available in this browser. You can type instead.");
    return;
  }
  if (S.screen !== "chat") { S.screen = "chat"; ensureIntro(); }
  S.sheet = null;
  S.listen = { state: "ready", prompt: listenPrompt() };
  render();
}

function setLevel(v) {
  L.level = L.level * 0.55 + v * 0.45;
  const el = document.getElementById("listen"); if (!el) return;
  el.style.setProperty("--lvl", L.level.toFixed(3));
  el.classList.toggle("loud", L.level > 0.14);
}

function updateListenUI() {
  const st = document.getElementById("listen-status"); if (st) st.textContent = listenStatus();
  const ty = document.getElementById("listen-type"); if (ty) ty.hidden = !(L.silence >= 2);
}

// Must run synchronously inside the tap (browsers require a user gesture to open the mic).
function startRecording() {
  L.level = 0; L.meterLive = false; L.silence = 0; L.lastVoice = Date.now();
  listenSession = startListening({
    onActivity: () => { L.lastVoice = Date.now(); if (!L.meterLive) setLevel(0.75); },
    onError: (code) => {
      stopMeters(); listenSession = null; S.listen = null; S.typeMode = true; render();
      toast(code === "not-allowed" || code === "not_granted" ? "Microphone access is off. You can type instead." : "Voice stopped working. You can type instead.");
    },
  });
  L.meterStop = startLevelMeter((v) => { L.meterLive = true; if (v > 0.1) L.lastVoice = Date.now(); setLevel(v); });
  L.tick = setInterval(() => {
    if (!L.meterLive) setLevel(0);                       // decay when we only get word events
    const quiet = Date.now() - L.lastVoice;
    const s = quiet >= 20000 ? 2 : quiet >= 5000 ? 1 : 0;
    if (s !== L.silence) { L.silence = s; updateListenUI(); }
  }, 120);
  S.listen.state = "listening";
  render();
}

function stopMeters() {
  clearInterval(L.tick); L.tick = null;
  if (L.meterStop) { L.meterStop(); L.meterStop = null; }
}

async function finishRecording() {
  const ls = listenSession; stopMeters();
  listenSession = null; S.listen = null; render();
  if (!ls) return;
  const text = await ls.stop();
  if (!text) { toast("I didn't catch that. Tap the mic and try again, or type instead."); return; }
  send(text, "voice");
}

function closeListen() {
  stopMeters();
  if (listenSession) { listenSession.cancel(); listenSession = null; }
  S.listen = null; render();
}

// ---------- breathing ----------
function startBreathe(programme) {
  S.breathe = { phase: "ready", title: programme ? `${programme.title}: session 1 opens with a ${SETTLE.title.toLowerCase()}` : SETTLE.title, programme, left: 60, inhale: false, cue: "" };
  go("breathe");
}

function runBreathe() {
  const st = S.breathe; st.phase = "run"; st.left = 60; render();
  const steps = [["Breathe in", true], ["Hold", true], ["Breathe out", false]];
  let i = 0;
  const tick = () => {
    if (S.screen !== "breathe" || st.phase !== "run") return;
    const [cue, inhale] = steps[i % 3];
    st.cue = cue; st.inhale = inhale;
    const b = document.getElementById("bubble"), c = document.getElementById("cue");
    if (b) b.classList.toggle("in", inhale); if (c) c.textContent = cue;
    i++; later(tick, 4000);
  };
  const countdown = () => {
    if (S.screen !== "breathe" || st.phase !== "run") return;
    st.left -= 1; const l = document.getElementById("left"); if (l) l.textContent = `${st.left}s left`;
    if (st.left <= 0) { st.phase = "done"; render(); return; }
    later(countdown, 1000);
  };
  tick(); later(countdown, 1000);
}

// ---------- events ----------
document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-action]"); if (!el) return;
  const a = el.dataset.action;
  switch (a) {
    case "send-otp": S.otpSent = true; render(); break;
    case "verify": go("home"); break;
    case "home": if (S.listen) closeListen(); S.sheet = null; go("home"); break;
    case "theme": {
      const r = document.documentElement;
      const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      r.dataset.theme = dark ? "light" : "dark"; break;
    }
    case "existing": toast("That's the existing YourDOST flow, outside this prototype."); break;
    case "talk": openListen(); break;
    case "starter": {
      const t = STARTERS[Number(el.dataset.i)];
      if (S.busy) break;
      // Each chip starts a fresh conversation (a booked session or started programme in "Up next" is kept).
      clearTimers(); if (S.listen) closeListen();
      session = newSession();
      Object.assign(S, { thread: [], options: null, booking: null, talkMore: false, log: [], typeMode: false, draft: "", sheet: null, langPicker: false });
      if (t.concern) session.slots.concerns = [t.concern];
      session.emit("action", "info", `Starter chip: ${t.label}`, { sent_as_first_message: t.message }); renderPanel();
      S.typeMode = false; S.sheet = null;
      send(t.message, "typed"); break;
    }
    case "upnext":
      if (S.upNext.kind === "programme") startBreathe(S.options ? S.options.selfHelp : null);
      else toast("Your session link opens 10 minutes before the start time.");
      break;
    case "listen-toggle": if (S.listen && S.listen.state === "listening") finishRecording(); else if (S.listen) startRecording(); break;
    case "listen-back": closeListen(); break;
    case "listen-type": closeListen(); S.typeMode = true; render(); break;
    case "sheet": S.sheet = el.dataset.s; S.langPicker = false; render(); break;
    case "sheet-close": S.sheet = null; render(); break;
    case "type-start": S.typeMode = true; S.screen = "chat"; ensureIntro(); render(); break;
    case "type-mode": S.typeMode = true; render(); break;
    case "send": { const ta = document.getElementById("draft"); send(ta ? ta.value : "", "typed"); break; }
    case "human": S.connect = { crisis: false, joined: false }; go("connect"); later(() => { S.connect.joined = true; render(); }, 2200); break;
    case "connect-crisis": S.connect = { crisis: true, joined: false }; go("connect"); later(() => { S.connect.joined = true; render(); }, 2200); break;
    case "talk-more": S.talkMore = true; S.typeMode = false; render(); break;
    case "lang-picker": S.langPicker = !S.langPicker; render(); break;
    case "refine": {
      if (S.busy) break;
      S.busy = true; S.langPicker = false;
      const opts = el.dataset.g ? { gender_pref: el.dataset.g } : el.dataset.l ? { language_pref: el.dataset.l } : { excludeCurrent: true };
      const o = await buildOptions(session, opts);
      S.options = { ...o, genderPref: session.slots.gender_pref };
      S.busy = false; render(); renderPanel();
      toast(`Matched with ${firstName(o.match.counsellor.name)}`);
      break;
    }
    case "book": S.sheet = null; S.booking = { format: "Video", share: false, confirmed: false }; go("book"); break;
    case "back-chat": go("chat"); break;
    case "format": S.booking.format = el.dataset.f; render(); break;
    case "share": S.booking.share = !S.booking.share; render(); break;
    case "confirm":
      S.booking.confirmed = true;
      S.upNext = { kind: "session", title: `Session with ${firstName(S.options.match.counsellor.name)}`, meta: `${formatSlot(S.options.match.slot)}, ${S.booking.format.toLowerCase()}` };
      session.emit("action", "ok", `Booked ${S.options.match.counsellor.name}`, { format: S.booking.format, note_shared: S.booking.share });
      render(); renderPanel(); break;
    case "start-self":
      S.sheet = null;
      S.upNext = { kind: "programme", title: `Continue: ${S.options.selfHelp.title}`, meta: "Next session tonight, about 10 minutes" };
      session.emit("action", "ok", `Started self-help: ${S.options.selfHelp.title}`, null); renderPanel();
      startBreathe(S.options.selfHelp); break;
    case "settle": startBreathe(null); break;
    case "breathe-go": runBreathe(); break;
    case "breathe-skip": S.breathe.phase = "done"; clearTimers(); render(); break;
    case "feel": S.breathe.feel = el.dataset.v; session.emit("action", el.dataset.v === "worse" ? "flag" : "ok", `After the exercise: ${el.dataset.v}`, null); renderPanel(); render(); break;
    case "force-demo": setForcedDemo(getMode() !== "demo"); renderPanel(); break;
    case "sample": {
      S.panelOpen = false; panel().classList.remove("open");
      if (S.screen === "login") S.screen = "home";
      if (S.options && !S.talkMore) S.talkMore = true;
      if (S.listen) closeListen(); S.sheet = null;
      S.typeMode = true; send(SAMPLES[Number(el.dataset.i)], "typed"); break;
    }
    case "reset":
      clearTimers(); if (S.listen) closeListen(); session = newSession(); Object.assign(S, { thread: [], options: null, booking: null, talkMore: false, log: [], typeMode: false, draft: "", sheet: null, starter: null, upNext: null });
      go("home"); renderPanel(); break;
    case "panel": S.panelOpen = !S.panelOpen; panel().classList.toggle("open", S.panelOpen); break;
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "draft") { S.draft = e.target.value; e.target.style.height = "auto"; e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"; }
  if (e.target.closest && e.target.closest(".otp") && e.target.value) { const n = e.target.nextElementSibling; if (n) n.focus(); }
});
document.addEventListener("keydown", (e) => {
  if (e.target.id === "draft" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e.target.value, "typed"); }
  if (e.key === "Escape" && S.listen) closeListen();
  else if (e.key === "Escape" && S.sheet) { S.sheet = null; render(); }
});

// ---------- boot ----------
render(); renderPanel();
Promise.all([detectProvider(), initVoice()]).then(() => renderPanel());
