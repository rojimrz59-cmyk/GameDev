// Pigeon Express — 30 s trailer plan. Shared by capture.js (images), audio.js (sound) and build.js (edit).
// Each shot: duration in seconds (before the crossfade overlap), caption shown in the shot,
// transition INTO the next shot (ffmpeg xfade name), and sound cues relative to the shot start.
"use strict";
const XFADE = 0.3; // seconds of overlap between two shots

const SHOTS = [
  { id: "title", dur: 2.6, caption: null, out: "circleopen",
    sfx: [[0.15, "open"], [0.35, "party"], [1.25, "milestone"]] },
  { id: "story", dur: 3.2, caption: "Une vraie histoire", out: "slideleft",
    sfx: [[0.1, "open"], ...Array.from({ length: 30 }, (_, k) => [0.25 + k * 0.09, "voice", { who: "capucine" }])] },
  { id: "tap", dur: 3.0, caption: "Envoie. Encaisse. Agrandis !", out: "slideup",
    sfx: [[0.35, "buy"], [0.8, "buy"], [1.25, "buy"], [1.7, "buy"], [1.72, "milestone"], [2.2, "buy"], [0.5, "coin"], [1.0, "coin"], [1.5, "coin"], [2.0, "coin"], [2.5, "coin"]] },
  { id: "grow", dur: 3.0, caption: "6 routes à faire grandir", out: "wipeleft",
    sfx: [[0.3, "upgrade"], [1.2, "coin", { route: 3 }], [1.6, "coin", { route: 4 }], [2.0, "coin", { route: 5 }], [2.2, "buy"]] },
  { id: "stamp", dur: 2.6, caption: "Tampon parfait = ×3 !", out: "radial",
    sfx: [[0.3, "stamp", { combo: 1 }], [0.75, "stamp", { combo: 2 }], [1.2, "stamp", { combo: 3 }], [1.65, "stamp", { combo: 4 }], [2.1, "stamp", { combo: 5 }], [2.15, "combo"]] },
  { id: "hatch", dur: 3.0, caption: "12 pigeons stars à collectionner", out: "slideright",
    sfx: [[0.45, "crack"], [0.55, "hatch"]] },
  { id: "cat", dur: 2.6, caption: "Gare au chat Moustache !", out: "circleclose",
    sfx: [[0.25, "meow"], [1.0, "tickle"], [1.2, "tickle"], [1.4, "tickle"], [1.6, "tickle"], [1.8, "tickle"], [1.85, "catLeave"]] },
  { id: "letter", dur: 2.6, caption: "Des clients très… spéciaux", out: "slidedown",
    sfx: [[0.05, "letter"], [0.4, "paper"], [1.75, "cash"]] },
  { id: "golden", dur: 2.4, caption: "Pigeons dorés et bonus !", out: "wiperight",
    sfx: [[0.2, "goldenAppear"], [0.95, "goldenCatch"], [1.55, "level"]] },
  { id: "city", dur: 2.6, caption: null, out: "fadewhite",
    sfx: [[0.3, "prestige"]] },
  { id: "augustin", dur: 2.6, caption: "Retrouve la Lettre d'Or", out: "circleopen",
    sfx: [...Array.from({ length: 12 }, (_, k) => [0.15 + k * 0.1, "voice", { who: "augustin" }]), [1.45, "heart"], ...Array.from({ length: 8 }, (_, k) => [1.6 + k * 0.09, "voice", { who: "capucine" }])] },
  { id: "end", dur: 3.1, caption: null, out: null,
    sfx: [[0.2, "party"], [0.9, "level"]] },
];

// Start time of each shot in the final 30 s timeline.
const starts = [];
let acc = 0;
for (const s of SHOTS) { starts.push(acc); acc += s.dur - XFADE; }
const TOTAL = acc + XFADE;

module.exports = { SHOTS, XFADE, starts, TOTAL, W: 1080, H: 1920 };
