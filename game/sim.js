// Pacing simulator: an active player who always buys the best income-per-coin item.
// Usage: node game/sim.js [hours=3] [feathers=0]
"use strict";
require("./economy.js");
const E = globalThis.ECON;

function run(hours, feathers, quiet) {
  const dt = 0.25;
  const s = { coins: 0, earned: 0, lv: {}, mgr: {}, up: {}, xp: 0, level: 1, boostT: 0 };
  E.ROUTES.forEach(r => { s.lv[r.id] = 0; s.mgr[r.id] = false; });
  s.lv.lettres = 1; // start: the first loft is given
  const log = [];
  const ctx = () => ({ upgrades: s.up, globalMult: E.featherMult(feathers) * (s.boostT > 0 ? E.GOLDEN.boostMult : 1) });
  const routeRate = (r, lvl) => E.perSecond(r, lvl, { upgrades: s.up, globalMult: E.featherMult(feathers) }) * (s.mgr[r.id] ? 1 : 0.5);
  const income = () => E.ROUTES.reduce((a, r) => a + routeRate(r, s.lv[r.id]), 0);

  function candidates() {
    const out = [];
    for (const r of E.ROUTES) {
      const l = s.lv[r.id];
      const cost = E.levelCost(r, l);
      const unmanagedFactor = s.mgr[r.id] ? 1 : 0.5;
      const gain = (E.perSecond(r, l + 1, { upgrades: s.up, globalMult: 1 }) - E.perSecond(r, l, { upgrades: s.up, globalMult: 1 })) * unmanagedFactor;
      out.push({ kind: "lvl", r, cost, gain });
      if (l > 0 && !s.mgr[r.id]) out.push({ kind: "mgr", r, cost: r.manager, gain: E.perSecond(r, l, { upgrades: s.up, globalMult: 1 }) * 0.5 + 1e-9 });
    }
    for (const u of E.UPGRADES) {
      if (s.up[u.id]) continue;
      let gain = 0;
      for (const r of E.ROUTES) if (u.target === "all" || u.target === r.id) gain += routeRate(r, s.lv[r.id]) * (u.mult - 1);
      out.push({ kind: "up", u, cost: u.cost, gain: gain + 1e-12 });
    }
    return out;
  }

  let nextGolden = 110, t = 0;
  const end = hours * 3600;
  const checkpoints = [60, 300, 900, 1800, 3600, 7200, 10800, 14400, 21600].filter(c => c <= end);
  while (t < end) {
    // buy loop
    for (let guard = 0; guard < 50; guard++) {
      const c = candidates().sort((a, b) => b.gain / b.cost - a.gain / a.cost)[0];
      if (!c || c.cost > s.coins) break;
      s.coins -= c.cost;
      if (c.kind === "lvl") {
        if (s.lv[c.r.id] === 0) log.push([t, "route " + c.r.name]);
        s.lv[c.r.id]++;
      } else if (c.kind === "mgr") { s.mgr[c.r.id] = true; log.push([t, "chef " + c.r.name]); }
      else { s.up[c.u.id] = true; log.push([t, "amélioration " + c.u.name]); }
    }
    const inc = E.ROUTES.reduce((a, r) => a + E.perSecond(r, s.lv[r.id], ctx()) * (s.mgr[r.id] ? 1 : 0.5), 0);
    s.coins += inc * dt; s.earned += inc * dt;
    // xp: deliveries per second * (index+1)
    E.ROUTES.forEach((r, i) => { if (s.lv[r.id] > 0) s.xp += (dt / r.time) * (i + 1) * (s.mgr[r.id] ? 1 : 0.5); });
    while (s.xp >= E.xpForLevel(s.level)) { s.xp -= E.xpForLevel(s.level); s.level++; }
    if (s.boostT > 0) s.boostT -= dt;
    if (t >= nextGolden) { // player catches 70 % of golden pigeons; half are boosts, half coins
      if (Math.random() < 0.7) { if (Math.random() < 0.5) s.boostT = E.GOLDEN.boostSeconds; else { s.coins += income() * E.GOLDEN.coinSeconds; } }
      nextGolden = t + 110;
    }
    t += dt;
    if (checkpoints.length && t >= checkpoints[0]) {
      const c = checkpoints.shift();
      log.push([t, `== ${E.formatDuration(c)}: revenu ${E.formatNumber(income())}/s, gagné ${E.formatNumber(s.earned)}, niv joueur ${s.level}, plumes si déménagement ${E.feathersFor(s.earned)}, niveaux ${E.ROUTES.map(r => s.lv[r.id]).join("/")}`]);
    }
  }
  if (!quiet) for (const [tt, msg] of log) console.log(E.formatDuration(tt).padStart(10), msg);
  return s;
}

const hours = Number(process.argv[2] || 3), feathers = Number(process.argv[3] || 0);
Math.random = (() => { let x = 42; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();
run(hours, feathers);
