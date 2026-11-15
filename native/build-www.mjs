// Builds native/www from ../game: wraps index.html in a full document and adds capacitor.js.
// Usage: node build-www.mjs (run by `npm run sync`).
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const game = join(here, "..", "game");
const www = join(here, "www");
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const f of ["economy.js", "content.js", "ads.js", "game.js"]) copyFileSync(join(game, f), join(www, f));

const capJs = join(here, "node_modules", "@capacitor", "core", "dist", "capacitor.js");
if (!existsSync(capJs)) { console.error("Run `npm install` first: @capacitor/core is missing."); process.exit(1); }
copyFileSync(capJs, join(www, "capacitor.js"));

const body = readFileSync(join(game, "index.html"), "utf8")
  .replace('<script src="economy.js"></script>', '<script src="capacitor.js"></script>\n<script src="economy.js"></script>');
const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);box-sizing:border-box}body{margin:0}[hidden]{display:none!important}</style>
</head><body>
${body}
</body></html>`;
writeFileSync(join(www, "index.html"), page);
console.log("www/ ready:", ["index.html", "capacitor.js", "economy.js", "content.js", "ads.js", "game.js"].join(", "));
