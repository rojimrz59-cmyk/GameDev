// Renders the trailer soundtrack with the game's own audio engine (game/audio.js) in an OfflineAudioContext.
// Usage: node audio.js <out.wav>
"use strict";
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const { SHOTS, starts, TOTAL } = require("./plan.js");

const OUT = path.resolve(process.argv[2] || path.join(__dirname, "trailer-audio.wav"));
const engine = fs.readFileSync(path.resolve(__dirname, "../../game/audio.js"), "utf8");

// Absolute cue list: [time, sfx name, options]
const cues = [];
SHOTS.forEach((s, i) => {
  for (const [t, name, opts] of s.sfx) cues.push([starts[i] + t, name, opts || {}]);
  if (i > 0) cues.push([starts[i] - 0.12, "open", {}]); // whoosh on every transition
});

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent("<!doctype html><title>audio</title>");
  await page.addScriptTag({ content: engine });
  const b64 = await page.evaluate(async ({ cues, total }) => {
    const rate = 44100, len = Math.ceil(rate * (total + 0.2));
    const ctx = new OfflineAudioContext(2, len, rate);
    const AU = window.AUDIO;
    AU.setVolumes(0.6, 0.65);
    AU.init(ctx);
    const A = AU.state;
    AU.setIntensity(2); AU.setCity(0);
    A.step = 0; A.nextTime = 0.05;
    AU._scheduleUntil(total + 0.2);
    for (const [t, name, opts] of cues) AU._play(name, Math.max(0.01, t), opts);
    // Final fade-out.
    const m = A.master.gain;
    m.setValueAtTime(0.7, 0); m.setValueAtTime(0.7, total - 1.6); m.linearRampToValueAtTime(0.0001, total);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = buf.length;
    const out = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => { for (let k = 0; k < s.length; k++) out.setUint8(o + k, s.charCodeAt(k)); };
    w(0, "RIFF"); out.setUint32(4, 36 + n * 4, true); w(8, "WAVE"); w(12, "fmt "); out.setUint32(16, 16, true);
    out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, rate, true); out.setUint32(28, rate * 4, true);
    out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, "data"); out.setUint32(40, n * 4, true);
    let peak = 0;
    for (let i = 0; i < n; i++) {
      const l = Math.max(-1, Math.min(1, L[i])), r = Math.max(-1, Math.min(1, R[i]));
      peak = Math.max(peak, Math.abs(l), Math.abs(r));
      out.setInt16(44 + i * 4, l * 32767, true); out.setInt16(46 + i * 4, r * 32767, true);
    }
    const bytes = new Uint8Array(out.buffer); let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { wav: btoa(s), peak };
  }, { cues, total: TOTAL });
  fs.writeFileSync(OUT, Buffer.from(b64.wav, "base64"));
  console.log(`audio: ${OUT} (${cues.length} cues, peak ${(20 * Math.log10(b64.peak)).toFixed(1)} dBFS)`);
  await browser.close();
})();
