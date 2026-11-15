/* Pigeon Express — audio: synthesized music and sound effects (Web Audio, no audio files).
 * Buses: music -> musicDuck -> master -> limiter -> out, sfx -> master.
 * Music is adaptive: intensity 0 (calm), 1 (play), 2 (boost) adds layers; each city changes key.
 * All melodies here are original. */
(function (root) {
  "use strict";
  const A = { ctx: null, out: null, master: null, music: null, duck: null, sfx: null, noise: null,
    musicVol: 0.6, sfxVol: 0.8, intensity: 1, transpose: 0, timer: null, nextTime: 0, step: 0, playing: false };

  // ---------------------------------------------------------------- graph
  function init(ctx) {
    if (A.ctx) return A.ctx;
    const C = ctx || new (root.AudioContext || root.webkitAudioContext)();
    A.ctx = C;
    const lim = C.createDynamicsCompressor(); // safety limiter: keeps peaks under 0 dBFS
    lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.2;
    A.master = C.createGain(); A.master.gain.value = 0.9;
    A.music = C.createGain(); A.duck = C.createGain(); A.sfx = C.createGain();
    const out = C.createGain(); out.gain.value = 0.75; // the compressor adds automatic makeup gain: trim after it
    A.music.connect(A.duck); A.duck.connect(A.master); A.sfx.connect(A.master); A.master.connect(lim); lim.connect(out); out.connect(C.destination);
    const len = Math.floor(C.sampleRate * 1), buf = C.createBuffer(1, len, C.sampleRate), d = buf.getChannelData(0);
    let seed = 1; for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741823.5 - 1; }
    A.noise = buf;
    applyVolumes();
    return C;
  }
  function applyVolumes() {
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    A.music.gain.setTargetAtTime(A.musicVol * A.musicVol * 3, t, 0.05); // slider squared: even loudness steps
    A.sfx.gain.setTargetAtTime(A.sfxVol * A.sfxVol * 4, t, 0.05);
  }
  function unlock() { // call from a touch/click handler (iOS needs a gesture)
    try {
      const C = init();
      if (root.navigator && navigator.audioSession) { try { navigator.audioSession.type = "ambient"; } catch (e) { /* older Safari */ } }
      if (C.state === "suspended") C.resume();
      if (A.musicVol > 0 && !A.playing) startMusic();
    } catch (e) { /* audio unavailable */ }
  }
  function setVolumes(music, sfx) {
    A.musicVol = Math.max(0, Math.min(1, music)); A.sfxVol = Math.max(0, Math.min(1, sfx));
    applyVolumes();
    if (A.ctx) { if (A.musicVol > 0 && !A.playing && A.ctx.state === "running") startMusic(); if (A.musicVol === 0) stopMusic(); }
  }
  // Duck the music (modal: -6 dB, ad: silent). Several reasons can stack; the deepest wins.
  const ducks = {};
  function duck(reason, on) {
    if (on) ducks[reason] = true; else delete ducks[reason];
    if (!A.ctx) return;
    const level = ducks.ad ? 0.0001 : ducks.modal ? 0.5 : ducks.stinger ? 0.45 : 1;
    A.duck.gain.setTargetAtTime(level, A.ctx.currentTime, 0.08);
  }
  function stinger(seconds) { duck("stinger", true); setTimeout(() => duck("stinger", false), seconds * 1000); }
  function suspend(hidden) {
    if (!A.ctx) return;
    if (hidden) A.ctx.suspend(); else A.ctx.resume().then(() => { A.nextTime = A.ctx.currentTime + 0.05; });
  }

  // ---------------------------------------------------------------- voices
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const vary = (semis) => Math.pow(2, ((Math.random() * 2 - 1) * semis) / 12);
  function tone(dest, at, o) {
    const C = A.ctx, osc = C.createOscillator(), g = C.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f, at);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, at + (o.glide || o.dur));
    if (o.vib) { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = o.vibRate || 6; lg.gain.value = o.vib; l.connect(lg).connect(osc.frequency); l.start(at); l.stop(at + o.dur + 0.05); }
    const atk = o.attack || 0.005, vol = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + atk); g.gain.exponentialRampToValueAtTime(0.0001, at + atk + o.dur);
    let node = osc;
    if (o.lp) { const f = C.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; node.connect(f); node = f; }
    node.connect(g).connect(dest);
    osc.start(at); osc.stop(at + atk + o.dur + 0.05);
  }
  function noise(dest, at, o) {
    const C = A.ctx, src = C.createBufferSource(), f = C.createBiquadFilter(), g = C.createGain();
    src.buffer = A.noise; src.loop = true;
    f.type = o.filter || "bandpass"; f.frequency.setValueAtTime(o.freq || 1000, at); f.Q.value = o.q || 1;
    if (o.freq2) f.frequency.exponentialRampToValueAtTime(o.freq2, at + o.dur);
    const vol = o.vol || 0.1, atk = o.attack || 0.003;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + atk); g.gain.exponentialRampToValueAtTime(0.0001, at + atk + o.dur);
    src.connect(f).connect(g).connect(dest);
    src.start(at, Math.random() * 0.5); src.stop(at + atk + o.dur + 0.05);
  }
  const notes = (dest, at, list, gap, o) => list.forEach((n, i) => tone(dest, at + i * gap, Object.assign({}, o, { f: midi(n) })));

  // ---------------------------------------------------------------- sound effects
  let buyStreak = 0, buyAt = 0;
  const SFX = {
    coin: (t, o) => { const k = Math.pow(2, ((o && o.route) || 0) * 2 / 12) * vary(0.6); tone(A.sfx, t, { f: 1318 * k, dur: 0.05, vol: 0.07 }); tone(A.sfx, t + 0.045, { f: 1976 * k, dur: 0.09, vol: 0.06 }); },
    send: (t) => { const k = vary(1.5); tone(A.sfx, t, { f: 340 * k, f2: 290 * k, dur: 0.16, vol: 0.12, vib: 18, vibRate: 22, lp: 1400 }); tone(A.sfx, t + 0.17, { f: 300 * k, f2: 250 * k, dur: 0.14, vol: 0.09, vib: 16, vibRate: 22, lp: 1400 }); },
    buy: (t) => { const n = performance.now(); buyStreak = n - buyAt < 1500 ? Math.min(buyStreak + 1, 12) : 0; buyAt = n; notes(A.sfx, t, [72, 76, 79].map((x) => x + buyStreak), 0.045, { type: "square", dur: 0.07, vol: 0.05, lp: 3000 }); },
    hire: (t) => { tone(A.sfx, t, { f: 1200, f2: 1700, dur: 0.12, vol: 0.07 }); tone(A.sfx, t + 0.16, { f: 1200, f2: 1900, dur: 0.16, vol: 0.07 }); notes(A.sfx, t + 0.3, [72, 76, 79, 84], 0.06, { type: "triangle", dur: 0.14, vol: 0.09 }); },
    upgrade: (t) => { tone(A.sfx, t, { type: "square", f: 220, f2: 1320, dur: 0.35, vol: 0.05, lp: 2600 }); notes(A.sfx, t + 0.3, [84, 91], 0.07, { dur: 0.2, vol: 0.07 }); },
    milestone: (t) => { notes(A.sfx, t, [67, 72, 76, 79, 84], 0.07, { type: "triangle", dur: 0.18, vol: 0.12 }); notes(A.sfx, t + 0.38, [88, 91, 96], 0.05, { dur: 0.25, vol: 0.05 }); },
    level: (t) => { notes(A.sfx, t, [72, 76, 79, 84, 79, 84, 88], 0.075, { type: "square", dur: 0.12, vol: 0.06, lp: 3200 }); tone(A.sfx, t + 0.55, { type: "triangle", f: midi(84), dur: 0.5, vol: 0.1 }); },
    stamp: (t, o) => { const c = Math.min((o && o.combo) || 1, 14); noise(A.sfx, t, { filter: "lowpass", freq: 500, dur: 0.07, vol: 0.25 }); tone(A.sfx, t, { f: 160, f2: 60, dur: 0.1, vol: 0.25 }); tone(A.sfx, t + 0.05, { f: 880 * Math.pow(2, c / 12), dur: 0.22, vol: 0.08 }); },
    combo: (t) => { notes(A.sfx, t, [79, 83, 86, 91, 95, 98], 0.04, { dur: 0.12, vol: 0.06 }); noise(A.sfx, t + 0.2, { filter: "highpass", freq: 6000, dur: 0.4, vol: 0.04 }); },
    miss: (t) => tone(A.sfx, t, { f: 320, f2: 140, dur: 0.28, vol: 0.1, vib: 25, vibRate: 14 }),
    meow: (t) => { const k = vary(2); tone(A.sfx, t, { type: "sawtooth", f: 520 * k, f2: 820 * k, glide: 0.12, dur: 0.32, vol: 0.05, lp: 1800, attack: 0.03 }); tone(A.sfx, t + 0.14, { type: "sawtooth", f: 820 * k, f2: 480 * k, glide: 0.2, dur: 0.2, vol: 0.04, lp: 1600 }); },
    tickle: (t) => { const k = vary(3); notes(A.sfx, t, [84, 88, 86].map((x) => x + Math.round(Math.log2(k) * 12)), 0.05, { type: "triangle", dur: 0.06, vol: 0.06 }); },
    catLeave: (t) => { noise(A.sfx, t, { freq: 300, freq2: 3000, dur: 0.4, vol: 0.12, q: 2 }); SFX.meow(t + 0.1); },
    goldenAppear: (t) => notes(A.sfx, t, [96, 100, 103, 108], 0.06, { dur: 0.25, vol: 0.04 }),
    goldenCatch: (t) => { notes(A.sfx, t, [84, 88, 91, 96, 100, 103], 0.045, { type: "triangle", dur: 0.2, vol: 0.09 }); SFX.cash(t + 0.3); },
    cash: (t) => { noise(A.sfx, t, { filter: "highpass", freq: 3000, dur: 0.06, vol: 0.08 }); tone(A.sfx, t + 0.05, { f: 2093, dur: 0.35, vol: 0.06 }); tone(A.sfx, t + 0.05, { f: 2637, dur: 0.35, vol: 0.05 }); },
    crack: (t) => noise(A.sfx, t, { filter: "highpass", freq: 2500, dur: 0.05, vol: 0.15 }),
    hatch: (t) => { SFX.crack(t); SFX.crack(t + 0.12); tone(A.sfx, t + 0.25, { f: 200, f2: 1100, dur: 0.15, vol: 0.12 }); notes(A.sfx, t + 0.4, [72, 76, 79, 84, 88], 0.08, { type: "triangle", dur: 0.25, vol: 0.11 }); },
    letter: (t) => { tone(A.sfx, t, { f: midi(88), dur: 0.6, vol: 0.09 }); tone(A.sfx, t + 0.35, { f: midi(84), dur: 0.8, vol: 0.09 }); },
    paper: (t) => { for (let i = 0; i < 4; i++) noise(A.sfx, t + i * 0.05, { freq: 2500 + Math.random() * 2000, dur: 0.04, vol: 0.06, q: 0.8 }); },
    snore: (t) => { noise(A.sfx, t, { filter: "lowpass", freq: 260, dur: 0.6, vol: 0.12, attack: 0.25 }); tone(A.sfx, t + 0.1, { f: 90, f2: 70, dur: 0.5, vol: 0.06, attack: 0.2 }); },
    wake: (t) => { tone(A.sfx, t, { f: 400, f2: 1400, dur: 0.3, vol: 0.08 }); notes(A.sfx, t + 0.3, [79, 76], 0.08, { type: "square", dur: 0.08, vol: 0.04, lp: 2500 }); },
    kevin: (t) => { tone(A.sfx, t, { f: 600, f2: 200, dur: 0.25, vol: 0.08, vib: 30, vibRate: 12 }); notes(A.sfx, t + 0.28, [79, 84], 0.1, { type: "triangle", dur: 0.2, vol: 0.09 }); },
    tab: (t) => tone(A.sfx, t, { f: 1800 * vary(0.5), dur: 0.02, vol: 0.03 }),
    open: (t) => noise(A.sfx, t, { freq: 600, freq2: 2400, dur: 0.18, vol: 0.2, q: 1.5 }),
    party: (t) => { tone(A.sfx, t, { type: "sawtooth", f: 330, f2: 660, glide: 0.25, dur: 0.4, vol: 0.05, lp: 2200, vib: 20, vibRate: 9 }); noise(A.sfx, t + 0.35, { filter: "highpass", freq: 4000, dur: 0.3, vol: 0.08 }); SFX.milestone(t + 0.45); },
    prestige: (t) => { notes(A.sfx, t, [60, 64, 67, 72, 67, 72, 76, 84], 0.11, { type: "square", dur: 0.18, vol: 0.06, lp: 2800 }); notes(A.sfx, t, [48, 55, 60], 0.33, { type: "triangle", dur: 0.4, vol: 0.12 }); noise(A.sfx, t + 0.9, { filter: "highpass", freq: 5000, dur: 0.9, vol: 0.06 }); },
    deny: (t) => notes(A.sfx, t, [64, 60], 0.09, { type: "square", dur: 0.1, vol: 0.04, lp: 900 }),
  };
  function sfx(name, opts) {
    if (!A.ctx || A.sfxVol <= 0 || A.ctx.state !== "running" || !SFX[name]) return;
    try { SFX[name](A.ctx.currentTime + 0.01, opts); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------- music (original, 116 BPM, 16 bars)
  const BPM = 116, STEP = 60 / BPM / 4, STEPS = 256;
  const PROG = ["C", "G", "Am", "F", "C", "G", "Am", "F", "F", "G", "Em", "Am", "F", "G", "C", "C"];
  const CH = { C: [48, [60, 64, 67]], G: [43, [59, 62, 67]], Am: [45, [57, 60, 64]], F: [41, [57, 60, 65]], Em: [40, [55, 59, 64]] };
  const MEL = [ // [step in bar, midi note, length in steps]
    [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 83, 2], [10, 79, 2], [12, 76, 4]],
    [[0, 74, 2], [2, 79, 2], [4, 83, 4], [8, 81, 2], [10, 79, 2], [12, 74, 4]],
    [[0, 72, 2], [2, 76, 2], [4, 81, 4], [8, 79, 2], [10, 76, 2], [12, 72, 2], [14, 76, 2]],
    [[0, 77, 4], [4, 81, 2], [6, 79, 2], [8, 77, 2], [10, 76, 2], [12, 74, 4]],
    [[0, 76, 2], [2, 79, 2], [4, 84, 2], [6, 86, 2], [8, 88, 4], [12, 84, 4]],
    [[0, 83, 2], [2, 81, 2], [4, 79, 4], [8, 74, 2], [10, 79, 2], [12, 83, 4]],
    [[0, 81, 2], [2, 84, 2], [4, 88, 4], [8, 86, 2], [10, 84, 2], [12, 81, 4]],
    [[0, 77, 2], [2, 81, 2], [4, 84, 4], [8, 83, 2], [10, 86, 2], [12, 79, 4]],
    [[0, 81, 3], [3, 79, 1], [4, 77, 2], [6, 81, 2], [8, 84, 6], [14, 81, 2]],
    [[0, 83, 3], [3, 81, 1], [4, 79, 2], [6, 83, 2], [8, 86, 6], [14, 83, 2]],
    [[0, 79, 2], [2, 83, 2], [4, 88, 4], [8, 86, 2], [10, 83, 2], [12, 79, 4]],
    [[0, 81, 2], [2, 84, 2], [4, 88, 2], [6, 84, 2], [8, 81, 4], [12, 76, 4]],
    [[0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 89, 2], [8, 88, 4], [12, 84, 4]],
    [[0, 86, 2], [2, 83, 2], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 89, 4]],
    [[0, 88, 4], [4, 86, 2], [6, 84, 2], [8, 79, 4], [12, 76, 4]],
    [[0, 84, 8], [12, 79, 2], [14, 83, 2]],
  ];
  const KEYS = [0, 2, 4, -3, -1, 1, 3]; // one key per city
  function kick(t, v) { tone(A.music, t, { f: 150, f2: 45, glide: 0.12, dur: 0.16, vol: v || 0.5 }); }
  function snare(t, v) { noise(A.music, t, { freq: 1800, dur: 0.12, vol: v || 0.14, q: 0.7 }); tone(A.music, t, { f: 210, f2: 160, dur: 0.06, vol: (v || 0.14) * 0.8 }); }
  function hat(t, v) { noise(A.music, t, { filter: "highpass", freq: 7500, dur: 0.03, vol: v }); }
  function playStep(s, t) {
    const bar = Math.floor(s / 16) % 16, b = s % 16, tr = A.transpose, I = A.intensity, ch = CH[PROG[bar]];
    if (b === 0 || b === 8) tone(A.music, t, { type: "triangle", f: midi(ch[0] + tr), dur: STEP * 3, vol: 0.22 });
    if (b === 6 || b === 14) tone(A.music, t, { type: "triangle", f: midi(ch[0] + 12 + tr), dur: STEP * 1.5, vol: 0.16 });
    if (b % 4 === 2) for (const n of ch[1]) tone(A.music, t, { type: "square", f: midi(n + tr), dur: 0.14, vol: 0.022, lp: 1800 });
    if (I >= 1) {
      if (b === 0 || b === 8 || (I >= 2 && (b === 10 || b === 3))) kick(t, I >= 2 ? 0.3 : 0.24);
      if (b === 4 || b === 12) snare(t, I >= 2 ? 0.14 : 0.08);
      if (b % 4 === 2) hat(t, 0.05); else if (I >= 2 && b % 2 === 1) hat(t, 0.025);
      for (const [at, n, len] of MEL[bar]) if (at === b) {
        tone(A.music, t, { type: "triangle", f: midi(n + tr), dur: len * STEP * 0.9, vol: 0.1, vib: 3, vibRate: 5.5 });
        tone(A.music, t, { type: "square", f: midi(n + tr - 12), dur: len * STEP * 0.6, vol: 0.016, lp: 2200 });
        if (I >= 2) tone(A.music, t, { type: "sine", f: midi(n + tr + 12), dur: len * STEP * 0.7, vol: 0.035 });
      }
    }
  }
  function scheduleUntil(until) {
    while (A.nextTime < until) { playStep(A.step, A.nextTime); A.nextTime += STEP; A.step = (A.step + 1) % STEPS; }
  }
  function startMusic() {
    if (!A.ctx || A.playing) return;
    A.playing = true; A.step = 0; A.nextTime = A.ctx.currentTime + 0.1;
    A.timer = setInterval(() => { if (A.ctx.state === "running") scheduleUntil(A.ctx.currentTime + 0.15); }, 25);
  }
  function stopMusic() { if (A.timer) clearInterval(A.timer); A.timer = null; A.playing = false; }
  function setIntensity(i) { A.intensity = i; }
  function setCity(c) { A.transpose = KEYS[((c % KEYS.length) + KEYS.length) % KEYS.length]; }

  root.AUDIO = { init, unlock, setVolumes, duck, stinger, suspend, sfx, setIntensity, setCity, startMusic, stopMusic,
    get state() { return A; }, _scheduleUntil: scheduleUntil, _SFX: Object.keys(SFX), _play: (n, at, o) => SFX[n](at, o) };
})(typeof window !== "undefined" ? window : globalThis);
