// Assembles the trailer: each shot from its frames, xfade transitions between shots, soundtrack, 30 s MP4.
// Usage: node build.js <framesDir> <audio.wav> <out.mp4>
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
const { SHOTS, XFADE, starts, TOTAL, W, H } = require("./plan.js");

const FR = path.resolve(process.argv[2]), WAV = path.resolve(process.argv[3]), OUT = path.resolve(process.argv[4]);
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });

// 1. One clip per shot, constant 30 fps, exact length.
const clips = SHOTS.map((s) => {
  const clip = path.join(FR, s.id + ".mp4");
  ff(["-f", "concat", "-safe", "0", "-i", path.join(FR, s.id, "list.txt"),
    "-vf", `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, "-t", s.dur.toFixed(3),
    "-c:v", "libx264", "-preset", "fast", "-crf", "14", clip]);
  return clip;
});

// 2. Chain the shots with xfade transitions, then add the soundtrack.
const inputs = clips.flatMap((c) => ["-i", c]);
let graph = "", last = "[0:v]";
for (let i = 1; i < SHOTS.length; i++) {
  const lbl = i === SHOTS.length - 1 ? "[vout]" : `[v${i}]`;
  graph += `${last}[${i}:v]xfade=transition=${SHOTS[i - 1].out}:duration=${XFADE}:offset=${starts[i].toFixed(3)}${lbl};`;
  last = lbl;
}
graph = graph.replace(/;$/, "");
ff([...inputs, "-i", WAV, "-filter_complex", graph, "-map", "[vout]", "-map", `${SHOTS.length}:a`,
  "-af", "loudnorm=I=-14:TP=-1.5:LRA=9", "-ar", "48000", "-t", TOTAL.toFixed(2), "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
  "-profile:v", "high", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]);
console.log("trailer:", OUT);
