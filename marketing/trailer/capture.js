// Films each trailer shot from the real game (Chromium screencast, 1080x1920 JPEG frames).
// Usage: node capture.js <framesDir> [shotId ...]
"use strict";
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const { SHOTS, W, H } = require("./plan.js");

const GAME = path.resolve(__dirname, "../../game");
const OUT = path.resolve(process.argv[2] || path.join(__dirname, "frames"));
const ONLY = process.argv.slice(3);
require(path.join(GAME, "story.js"));
// Story state shown in the trailer: chapter 6 done, so the banner reads like a game in progress.
const DONE_SCENES = globalThis.STORY.SCENES.filter((s) => s.kind === "moment" || ["prologue", "ch1", "ch2", "ch3", "ch4", "ch5", "ch6"].includes(s.id)).map((s) => s.id);

// ---------------------------------------------------------------- tiny static server
const wrap = (body) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{box-sizing:border-box}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
const server = http.createServer((q, s) => {
  const url = q.url.split("?")[0];
  if (url === "/") { s.writeHead(200, { "content-type": "text/html" }); s.end(wrap(fs.readFileSync(path.join(GAME, "index.html"), "utf8"))); return; }
  if (url === "/blank.html") { s.writeHead(200, { "content-type": "text/html" }); s.end("<!doctype html><title>b</title>"); return; }
  fs.readFile(path.join(GAME, path.basename(url)), (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { "content-type": "text/javascript" }); s.end(d); });
});

// ---------------------------------------------------------------- overlay styles (captions, taps, title/end cards)
const OVERLAY_CSS = `
#tcap{position:absolute;left:0;right:0;top:112px;display:grid;place-items:center;z-index:70;pointer-events:none}
#tcap div{font-family:"Lilita One",sans-serif;font-size:31px;line-height:1.1;color:#fff;-webkit-text-stroke:2px #2A1B3D;paint-order:stroke fill;text-shadow:0 4px 0 #2A1B3D;background:linear-gradient(135deg,#FF5A4E,#FFC93C 62%,#2DD4A7);border:4px solid #2A1B3D;border-radius:22px;padding:7px 18px 9px;box-shadow:0 6px 0 #2A1B3D;rotate:-3deg;max-width:90%;text-align:center;animation:tcapIn .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes tcapIn{from{scale:.2;opacity:0;rotate:-16deg}}
.tap-ripple{position:fixed;width:74px;height:74px;margin:-37px 0 0 -37px;border-radius:50%;border:6px solid #fff;box-shadow:0 0 0 3px #2A1B3D,inset 0 0 0 3px #2A1B3D;z-index:95;pointer-events:none;animation:rip .5s ease-out forwards}
@keyframes rip{from{scale:.25;opacity:1}to{scale:1.35;opacity:0}}
#tcard{position:absolute;inset:0;z-index:55;overflow:hidden;background:radial-gradient(circle at 50% 38%,#D6F1FF,#8FD6FF 55%,#5AB8F5);font-family:"Lilita One",sans-serif;color:#fff}
#tcard .rays{position:absolute;left:50%;top:36%;width:900px;height:900px;margin:-450px 0 0 -450px;background:repeating-conic-gradient(rgba(255,255,255,.28) 0 10deg,transparent 10deg 20deg);animation:tspin 14s linear infinite;border-radius:50%}
@keyframes tspin{to{rotate:360deg}}
#tcard .logo{position:absolute;left:0;right:0;top:25%;text-align:center;line-height:.95}
#tcard .logo span{display:block;font-size:76px;-webkit-text-stroke:3px #2A1B3D;paint-order:stroke fill;text-shadow:0 8px 0 #2A1B3D;animation:lIn .6s cubic-bezier(.2,1.7,.4,1) both}
#tcard .logo span:nth-child(2){font-size:68px;color:#FFC93C;animation-delay:.18s}
@keyframes lIn{from{scale:.1;rotate:-20deg;opacity:0}}
#tcard .sub{position:absolute;left:50%;top:51%;translate:-50% 0;white-space:nowrap;font-size:27px;color:#4A2A00;background:#FFC93C;border:4px solid #2A1B3D;border-radius:999px;padding:4px 22px;box-shadow:0 5px 0 #2A1B3D;animation:lIn .5s cubic-bezier(.2,1.7,.4,1) 1s both}
#tcard .bird{position:absolute;width:150px;height:140px;animation:fly 2.6s linear both}
#tcard .bird svg{width:100%;height:100%}
#tcard .b0{top:60%;animation-duration:2.4s}#tcard .b1{top:9%;width:90px;animation-delay:.2s;animation-duration:3s}#tcard .b2{top:72%;width:100px;animation-delay:.6s;animation-duration:2.8s}#tcard .b3{top:16%;width:70px;animation-delay:.9s;animation-duration:3.2s}
@keyframes fly{from{left:-170px;translate:0 30px}50%{translate:0 -20px}to{left:110%;translate:0 10px}}
#tcard .cast{position:absolute;left:0;right:0;top:44%;display:flex;justify-content:center;gap:2px}
#tcard .cast div{width:96px;height:90px;animation:lIn .5s cubic-bezier(.2,1.7,.4,1) both}
#tcard .cast div:nth-child(2){animation-delay:.15s}#tcard .cast div:nth-child(3){animation-delay:.3s}#tcard .cast div:nth-child(4){animation-delay:.45s}
#tcard .cast svg{width:100%;height:100%}
#tcard .tag{position:absolute;left:0;right:0;top:61%;text-align:center;font-size:29px;line-height:1.15;-webkit-text-stroke:2px #2A1B3D;paint-order:stroke fill;text-shadow:0 4px 0 #2A1B3D;animation:lIn .5s cubic-bezier(.2,1.7,.4,1) .7s both}
#tcard .badge{position:absolute;left:50%;top:76%;translate:-50% 0;white-space:nowrap;font-size:24px;color:#fff;background:#2A1B3D;border-radius:18px;padding:8px 20px;animation:lIn .5s cubic-bezier(.2,1.7,.4,1) 1.1s both}
#tcard .small{position:absolute;left:0;right:0;top:85%;text-align:center;font-family:Nunito,sans-serif;font-weight:900;font-size:16px;color:#2A1B3D;animation:lIn .5s ease 1.4s both}
`;

async function boot(browser, save) {
  const ctx = await browser.newContext({ viewport: { width: 405, height: 720 }, deviceScaleFactor: W / 405, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("  pageerror:", e.message));
  await page.goto("http://localhost:8790/blank.html");
  await page.evaluate((s) => localStorage.setItem("pigeon-express-save", JSON.stringify(s)), save);
  await page.goto("http://localhost:8790/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: OVERLAY_CSS });
  return { ctx, page };
}

function baseSave(extra) {
  const now = Date.now();
  return Object.assign({
    version: 2, birthYear: 1990, tutorial: 5, level: 8, gems: 120, coins: 5000, multi: "1",
    lv: { lettres: 12 }, mgr: {}, tips: { stamp: true, cat: true, egg: true },
    story: { done: DONE_SCENES, hearts: { capucine: 4, moustache: 2, bzzz: 2 }, flags: {} },
    musicVol: 0, sfxVol: 0, lastSeen: now, savedAt: now,
  }, extra || {});
}

// Page helpers -----------------------------------------------------------------
const caption = (page, text) => page.evaluate((t) => {
  let c = document.getElementById("tcap"); if (c) c.remove();
  c = document.createElement("div"); c.id = "tcap"; c.innerHTML = `<div>${t}</div>`; document.getElementById("app").appendChild(c);
}, text.replace(/ ([!?:;])/g, "\u00A0$1"));
// Tap an element: show a ripple where a finger would touch, then click it.
const tap = (page, sel, dx) => page.evaluate(([s, ox]) => {
  const el = typeof s === "string" ? document.querySelector(s) : null; if (!el) return false;
  const r = el.getBoundingClientRect();
  const x = r.left + (ox === undefined ? r.width / 2 : ox * r.width), y = r.top + r.height / 2;
  const d = document.createElement("div"); d.className = "tap-ripple"; d.style.left = x + "px"; d.style.top = y + "px";
  d.addEventListener("animationend", () => d.remove()); document.body.appendChild(d);
  el.click(); return true;
}, [sel, dx]);
const ev = (page, fn, arg) => page.evaluate(fn, arg);

// ---------------------------------------------------------------- shots
const SCRIPTS = {
  async title(page, at) {
    await ev(page, () => {
      const A = window.__pigeon.art, L = Object.values(A.STAR_LOOKS);
      const d = document.createElement("div"); d.id = "tcard";
      d.innerHTML = `<div class="rays"></div>
        <div class="bird b1">${A.pigeonSVG(L[3], "box", { flying: true })}</div><div class="bird b3">${A.pigeonSVG(L[10], "gem", { flying: true })}</div>
        <div class="logo"><span>PIGEON</span><span>EXPRESS</span></div><div class="sub">La Lettre d'Or</div>
        <div class="bird b0">${A.pigeonSVG(A.CAPUCINE_LOOK, "letter", { flying: true })}</div><div class="bird b2">${A.pigeonSVG(L[2], "pizza", { flying: true })}</div>`;
      document.getElementById("app").appendChild(d);
    });
    await at(1.25); await ev(page, () => window.__pigeon.burstAt(null, 140));
  },
  async story(page, at) {
    await at(0.15); await caption(page, "Une vraie histoire");
  },
  async tap(page, at) {
    await at(0.1); await tap(page, '[data-route="lettres"] .lane', 0.3);
    await at(0.15); await caption(page, "Envoie. Encaisse. Agrandis !");
    for (const t of [0.35, 0.8, 1.25, 1.7, 2.2]) { await at(t); await tap(page, '[data-route="lettres"] [data-act="buy"]'); }
    await at(1.35); await tap(page, '[data-route="lettres"] .lane', 0.3);
  },
  async grow(page, at) {
    await at(0.15); await caption(page, "6 routes à faire grandir");
    await at(0.3); await ev(page, () => window.__pigeon.burstAt(null, 50));
    await ev(page, () => { const m = document.getElementById("main"), t0 = performance.now(); const f = (t) => { const k = Math.min(1, (t - t0) / 1900); m.scrollTop = 980 * (k * k * (3 - 2 * k)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await at(2.25);
    await ev(page, () => {
      const b = [...document.querySelectorAll('#routes [data-act="buy"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 300 && r.bottom < 680; });
      if (b) b.id = "growBuy";
    });
    await tap(page, "#growBuy");
  },
  async stamp(page, at) {
    await at(0.15); await caption(page, "Tampon parfait = ×3 !");
    for (const t of [0.3, 0.75, 1.2, 1.65, 2.1]) {
      await at(t - 0.12);
      await ev(page, () => { const P = window.__pigeon; P.rt.running.cartes = true; P.rt.stamped.cartes = false; P.rt.prog.cartes = 0.86; });
      await at(t); await tap(page, '[data-route="cartes"] .lane', 0.9);
    }
  },
  async hatch(page, at) {
    await at(0.15); await caption(page, "12 pigeons stars à collectionner");
    await at(0.45); await tap(page, "[data-hatch='0']");
  },
  async cat(page, at) {
    await at(0.15); await caption(page, "Gare au chat Moustache !");
    await at(0.2);
    const route = await ev(page, () => { window.__pigeon.spawnCat(); const c = window.__pigeon.rt.cat; if (!c) return null; document.querySelector(`[data-route="${c.route}"]`).scrollIntoView({ block: "center" }); return c.route; });
    for (const t of [1.0, 1.2, 1.4, 1.6, 1.8]) { await at(t); if (route) await tap(page, `[data-route="${route}"] .cat`); }
  },
  async letter(page, at) {
    await at(0.15); await caption(page, "Des clients très… spéciaux");
    await at(0.3); await tap(page, "#letterChip");
    await at(1.7); await tap(page, "#sheet [data-ch='0']");
  },
  async golden(page, at) {
    await at(0.15); await caption(page, "Pigeons dorés et bonus !");
    await at(0.2); await ev(page, () => { window.__pigeon.spawnGolden(); const g = document.getElementById("golden"); if (g) { g.style.top = "260px"; g.style.setProperty("--dur", "3s"); } });
    await at(0.95); await tap(page, "#golden");
    await at(1.55); await ev(page, () => { window.__pigeon.banner("Niveau 12 !", "+5 gemmes"); window.__pigeon.burstAt(null, 80); });
  },
  async city(page, at) {
    await at(0.3); await tap(page, "#goPrestige");
  },
  async augustin(page, at) {
    await at(0.15); await caption(page, "Retrouve la Lettre d'Or");
    await at(1.45); await ev(page, () => { const d = document.getElementById("dlg"); d.click(); d.click(); });
  },
  async end(page, at) {
    await ev(page, () => {
      const A = window.__pigeon.art;
      const d = document.createElement("div"); d.id = "tcard";
      d.innerHTML = `<div class="rays"></div><div class="logo" style="top:9%"><span style="font-size:62px">PIGEON</span><span style="font-size:56px">EXPRESS</span></div>
        <div class="cast" style="top:34%"><div>${A.portraitSVG("moustache", "happy")}</div><div>${A.portraitSVG("capucine", "happy")}</div><div>${A.portraitSVG("augustin", "happy")}</div><div>${A.portraitSVG("bzzz", "happy")}</div></div>
        <div class="tag" style="top:53%">Rouvre la poste.<br>Retrouve la Lettre d'Or.</div>
        <div class="badge" style="top:71%">Bientôt sur iPhone et Android</div>
        <div class="small" style="top:81%">Jeu gratuit · Tout public dès 6 ans</div>`;
      document.getElementById("app").appendChild(d);
    });
    await at(0.25); await ev(page, () => window.__pigeon.burstAt(null, 150));
    await at(1.2); await ev(page, () => window.__pigeon.burstAt(null, 80));
  },
};

// State each shot starts from (before filming begins).
const SETUP = {
  title: { save: () => baseSave() },
  story: { save: () => baseSave(), async pre(page) {
    await ev(page, () => window.__pigeon.playScene(window.STORY.SCENES.find((s) => s.id === "prologue"), true));
    for (let k = 0; k < 4; k++) { await page.waitForTimeout(80); await ev(page, () => document.getElementById("dlg").click()); }
  } },
  tap: { save: () => baseSave({ lv: { lettres: 21, cartes: 5 }, mgr: { cartes: true } }) },
  grow: { save: () => baseSave({ coins: 8e9, multi: "max", lv: { lettres: 120, cartes: 90, colis: 60, pizzas: 30, fleurs: 12 }, mgr: { lettres: true, cartes: true, colis: true, pizzas: true, fleurs: true },
    up: { u1: true, u2: true, u3: true, u4: true, u5: true }, adBoostUntil: Date.now() + 9e5 }) },
  stamp: { save: () => baseSave({ lv: { lettres: 60, cartes: 50 }, mgr: { lettres: true, cartes: true } }), async pre(page) {
    await ev(page, () => document.querySelector('[data-route="cartes"]').scrollIntoView({ block: "center" }));
  } },
  hatch: { save: () => baseSave({ lv: { lettres: 40, cartes: 20 }, mgr: { lettres: true }, incubator: [{ type: "legendary", result: "turbo", start: Date.now() - 7.2e6, end: Date.now() - 1000 }] }),
    async pre(page) { await ev(page, () => window.__pigeon.switchTab("crew")); await page.waitForTimeout(500); } },
  cat: { save: () => baseSave({ level: 9, lv: { lettres: 40, cartes: 20, colis: 8 }, mgr: { lettres: true, cartes: true, colis: true } }) },
  letter: { save: () => baseSave({ level: 9, lv: { lettres: 40, cartes: 20 }, mgr: { lettres: true, cartes: true }, lettersWaiting: [1] }) },
  golden: { save: () => baseSave({ lv: { lettres: 60, cartes: 40 }, mgr: { lettres: true, cartes: true } }) },
  city: { save: () => baseSave({ runEarned: 4e10, earned: 4e10, lv: { lettres: 120, cartes: 80, colis: 50 }, mgr: { lettres: true, cartes: true, colis: true } }),
    async pre(page) { await ev(page, () => window.__pigeon.switchTab("empire")); await page.waitForTimeout(400); await tap(page, "#prestigeBtn"); await page.waitForTimeout(500); } },
  augustin: { save: () => baseSave(), async pre(page) {
    await ev(page, () => window.__pigeon.playScene(window.STORY.SCENES.find((s) => s.id === "ch12"), true));
    for (let k = 0; k < 4; k++) { await page.waitForTimeout(80); await ev(page, () => document.getElementById("dlg").click()); }
  } },
  end: { save: () => baseSave() },
};

async function film(page, shot) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => { frames.push({ ts: f.metadata.timestamp, data: f.data }); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now(), total = shot.dur + 0.3;
  const at = (sec) => new Promise((r) => setTimeout(r, Math.max(0, t0 + sec * 1000 - Date.now())));
  await SCRIPTS[shot.id](page, at);
  await at(total);
  await cdp.send("Page.stopScreencast");
  await new Promise((r) => setTimeout(r, 150));
  const dir = path.join(OUT, shot.id);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const base = frames[0].ts;
  let list = "";
  frames.forEach((f, i) => {
    const name = String(i).padStart(5, "0") + ".jpg";
    fs.writeFileSync(path.join(dir, name), Buffer.from(f.data, "base64"));
    const next = i + 1 < frames.length ? frames[i + 1].ts - base : total;
    const dur = Math.max(0.001, next - (f.ts - base) + (i === 0 ? 0 : 0));
    list += `file '${name}'\nduration ${dur.toFixed(4)}\n`;
  });
  list += `file '${String(frames.length - 1).padStart(5, "0")}.jpg'\n`;
  fs.writeFileSync(path.join(dir, "list.txt"), list);
  console.log(`  ${shot.id}: ${frames.length} frames over ${total.toFixed(1)} s (${(frames.length / total).toFixed(0)} fps)`);
}

(async () => {
  server.listen(8790);
  const browser = await chromium.launch();
  for (const shot of SHOTS) {
    if (ONLY.length && !ONLY.includes(shot.id)) continue;
    const setup = SETUP[shot.id];
    const { ctx, page } = await boot(browser, setup.save());
    if (setup.pre) await setup.pre(page);
    await film(page, shot);
    await ctx.close();
  }
  await browser.close(); server.close();
})();
