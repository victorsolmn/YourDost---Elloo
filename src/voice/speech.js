// Voice capture with one interface over two engines:
//   - claude.ai dictation (when running inside claude.ai)
//   - the browser's Web Speech API (Chrome, Edge, Android)
// start() must be called directly from a tap, with nothing awaited first.
// The transcript is never shown for review: it goes straight to Dost (Wispr Flow style).

let dictation = null;
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export async function initVoice() {
  try {
    if (window.claude && typeof window.claude.use === "function") {
      dictation = await Promise.race([window.claude.use("dictation"), new Promise((r) => setTimeout(() => r(null), 6000))]);
    }
  } catch (_) { dictation = null; }
  return voiceAvailable();
}

export function voiceAvailable() { return !!dictation || !!SR; }
export function voiceEngine() { return dictation ? "claude.ai dictation" : SR ? "browser speech recognition" : "none"; }

// Returns a session: { stop(): Promise<string>, cancel() }. onActivity fires as words arrive.
export function startListening({ onActivity = () => {}, onError = () => {} } = {}) {
  if (dictation) return startDictation(onActivity, onError);
  if (SR) return startBrowser(onActivity, onError);
  onError("unavailable");
  return { stop: async () => "", cancel() {} };
}

function startDictation(onActivity, onError) {
  let finals = [], partial = "";
  const offP = dictation.onPartial(({ text }) => { partial = text; onActivity(); });
  const offF = dictation.onFinal(({ text }) => { finals.push(text); partial = ""; onActivity(); });
  dictation.start().catch((e) => onError(e && e.code ? e.code : "failed"));
  const cleanup = () => { try { offP && offP(); offF && offF(); } catch (_) {} };
  return {
    async stop() {
      try { await dictation.stop(); } catch (_) {}
      cleanup();
      return [...finals, partial].join(" ").trim();
    },
    cancel() { try { dictation.stop(); } catch (_) {} cleanup(); },
  };
}

function startBrowser(onActivity, onError) {
  const rec = new SR();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  let finals = [], interim = "", active = true, ended;
  const done = new Promise((r) => (ended = r));
  rec.onresult = (e) => {
    interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finals.push(r[0].transcript); else interim += r[0].transcript;
    }
    onActivity();
  };
  rec.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") { active = false; onError(e.error); } };
  rec.onend = () => { if (active) { try { rec.start(); } catch (_) { ended(); } } else ended(); };
  try { rec.start(); } catch (e) { onError("failed"); }
  return {
    async stop() {
      active = false;
      try { rec.stop(); } catch (_) {}
      await Promise.race([done, new Promise((r) => setTimeout(r, 1500))]);
      return [...finals, interim].join(" ").trim();
    },
    cancel() { active = false; try { rec.abort(); } catch (_) {} },
  };
}

// Live voice level (0..1) from the microphone, used only to animate the listening screen.
// Skipped on phones, where opening a second mic stream can interrupt speech recognition.
// If the browser blocks it (e.g. inside an embedded frame), the UI falls back to
// reacting when words are recognised.
export function startLevelMeter(onLevel) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!AC || mobile || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return () => {};
  let ctx, stream, raf, stopped = false;
  try { ctx = new AC(); } catch (_) { return () => {}; }
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    .then((s) => {
      if (stopped) { s.getTracks().forEach((t) => t.stop()); return; }
      stream = s;
      const an = ctx.createAnalyser(); an.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(an);
      const buf = new Uint8Array(an.fftSize);
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
        onLevel(Math.min(1, Math.sqrt(sum / buf.length) * 7));
        raf = requestAnimationFrame(loop);
      };
      loop();
    })
    .catch(() => {});
  return () => {
    stopped = true; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (ctx) ctx.close().catch(() => {});
  };
}
