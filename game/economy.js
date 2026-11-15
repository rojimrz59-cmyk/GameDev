/* Pigeon Express — economy config and pure maths.
 * Shared by the game (browser) and by sim.js / test.js (Node), so the numbers
 * that were tested are the numbers that run. No DOM access in this file. */
(function (root) {
  "use strict";

  // ---- Config -------------------------------------------------------------
  // Each route: price of next level = floor(baseCost * growth^owned).
  // Revenue per delivery = revenue * level * milestoneMult * globalMult.
  const ROUTES = [
    { id: "lettres", name: "Lettres",          parcel: "letter",  baseCost: 4,      growth: 1.12, revenue: 1,      time: 1.0,  manager: 100 },
    { id: "cartes",  name: "Cartes postales",  parcel: "card",    baseCost: 100,    growth: 1.13, revenue: 14,     time: 3.0,  manager: 2500 },
    { id: "colis",   name: "Colis express",    parcel: "box",     baseCost: 2500,   growth: 1.14, revenue: 150,    time: 6.0,  manager: 6e4 },
    { id: "pizzas",  name: "Pizzas volantes",  parcel: "pizza",   baseCost: 7e4,    growth: 1.15, revenue: 1900,   time: 12.0, manager: 1.6e6 },
    { id: "fleurs",  name: "Bouquets",         parcel: "flower",  baseCost: 2.2e6,  growth: 1.16, revenue: 26000,  time: 24.0, manager: 5e7 },
    { id: "bijoux",  name: "Bijoux précieux",  parcel: "gem",     baseCost: 8e7,    growth: 1.17, revenue: 380000, time: 48.0, manager: 1.8e9 },
  ];

  // Reaching these levels doubles that route's revenue and upgrades its loft art.
  const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400];

  // One-time coin upgrades. target: route id or "all". mult multiplies revenue.
  const UPGRADES = [
    { id: "u1",  name: "Sacoches en cuir",     target: "lettres", mult: 3, cost: 6000 },
    { id: "u2",  name: "Timbres collector",    target: "cartes",  mult: 3, cost: 1.2e5 },
    { id: "u3",  name: "Graines énergétiques", target: "all",     mult: 2, cost: 1.5e6 },
    { id: "u4",  name: "Ficelle renforcée",    target: "colis",   mult: 3, cost: 8e6 },
    { id: "u5",  name: "Boîtes isothermes",    target: "pizzas",  mult: 3, cost: 2e8 },
    { id: "u6",  name: "Rubans de soie",       target: "fleurs",  mult: 3, cost: 6e9 },
    { id: "u7",  name: "GPS à plumes",         target: "all",     mult: 2, cost: 5e10 },
    { id: "u8",  name: "Écrins sécurisés",     target: "bijoux",  mult: 3, cost: 4e11 },
    { id: "u9",  name: "Lunettes d'aviateur",  target: "all",     mult: 2, cost: 5e12 },
    { id: "u10", name: "Tour de contrôle",     target: "all",     mult: 3, cost: 1e14 },
  ];

  const PRESTIGE = {
    // feathers earned for a run = floor(sqrt(runEarnings / unit))
    unit: 4e7,
    bonusPerFeather: 0.05, // +5 % revenue per golden feather
    cityNames: ["Village", "Bourg", "Ville", "Cité", "Métropole", "Capitale", "Mégapole"],
  };

  const OFFLINE = { maxHours: 8, efficiency: 0.5 };

  const LEVELS = {
    // XP per delivery = route index + 1. XP needed for the next level grows 30 %.
    base: 25,
    growth: 1.3,
    gemsPerLevel: 5,
  };

  const GOLDEN = { minDelay: 70, maxDelay: 150, visible: 9, boostMult: 3, boostSeconds: 30, coinSeconds: 90 };
  const AD_BOOST = { mult: 2, minutes: 30, maxMinutes: 240 };
  const DAILY = [10, 10, 15, 15, 20, 25, 50]; // gems by streak day 1..7

  // Sequential objectives; three are shown at a time.
  const QUESTS = [
    { id: "q1",  text: "Envoie 10 lettres",                     type: "deliveries", route: "lettres", n: 10,  gems: 5 },
    { id: "q2",  text: "Passe Lettres au niveau 10",            type: "level",  route: "lettres", n: 10,  gems: 5 },
    { id: "q3",  text: "Engage le chef du pigeonnier Lettres",  type: "manager", route: "lettres", gems: 10 },
    { id: "q4",  text: "Ouvre la route Cartes postales",        type: "level",  route: "cartes", n: 1,    gems: 5 },
    { id: "q5",  text: "Attrape un pigeon doré",                type: "golden", n: 1,                     gems: 10 },
    { id: "q6",  text: "Gagne 10 K pièces au total",            type: "earned", n: 1e4,                   gems: 10 },
    { id: "q7",  text: "Ouvre la route Colis express",          type: "level",  route: "colis", n: 1,     gems: 10 },
    { id: "q8",  text: "Achète ta première amélioration",       type: "upgrades", n: 1,                   gems: 10 },
    { id: "q9",  text: "Passe Cartes postales au niveau 25",    type: "level",  route: "cartes", n: 25,   gems: 15 },
    { id: "q10", text: "Ouvre la route Pizzas volantes",        type: "level",  route: "pizzas", n: 1,    gems: 15 },
    { id: "q11", text: "Gagne 1 M pièces au total",             type: "earned", n: 1e6,                   gems: 20 },
    { id: "q12", text: "Engage 4 chefs de pigeonnier",          type: "managers", n: 4,                   gems: 20 },
    { id: "q13", text: "Passe Lettres au niveau 100",           type: "level",  route: "lettres", n: 100, gems: 20 },
    { id: "q14", text: "Ouvre la route Bouquets",               type: "level",  route: "fleurs", n: 1,    gems: 20 },
    { id: "q15", text: "Attrape 5 pigeons dorés",               type: "golden", n: 5,                     gems: 25 },
    { id: "q16", text: "Ouvre la route Bijoux précieux",        type: "level",  route: "bijoux", n: 1,    gems: 30 },
    { id: "q17", text: "Déménage vers une nouvelle ville",      type: "prestige", n: 1,                   gems: 50 },
    { id: "q18", text: "Gagne 1 B pièces au total",             type: "earned", n: 1e9,                   gems: 40 },
    { id: "q19", text: "Passe toutes les routes au niveau 50",  type: "allLevel", n: 50,                  gems: 50 },
    { id: "q20", text: "Déménage 3 fois",                       type: "prestige", n: 3,                   gems: 80 },
  ];

  // ---- Maths --------------------------------------------------------------
  function levelCost(route, owned) {
    return Math.floor(route.baseCost * Math.pow(route.growth, owned));
  }

  // Cost to buy `count` levels starting at `owned` (sum of floored prices).
  function bulkCost(route, owned, count) {
    let total = 0;
    for (let i = 0; i < count; i++) total += levelCost(route, owned + i);
    return total;
  }

  // Largest count affordable with `money`, capped (walks real prices).
  function maxAffordable(route, owned, money, cap) {
    cap = cap || 1000;
    let n = 0, total = 0;
    while (n < cap) {
      const p = levelCost(route, owned + n);
      if (total + p > money) break;
      total += p;
      n++;
    }
    return { count: n, cost: total };
  }

  function milestonesReached(level) {
    let k = 0;
    for (const m of MILESTONES) if (level >= m) k++;
    return k;
  }

  function nextMilestone(level) {
    for (const m of MILESTONES) if (level < m) return m;
    return null;
  }

  function upgradeMult(routeId, owned) {
    let m = 1;
    for (const u of UPGRADES) {
      if (owned && owned[u.id] && (u.target === routeId || u.target === "all")) m *= u.mult;
    }
    return m;
  }

  function featherMult(feathers) {
    return 1 + PRESTIGE.bonusPerFeather * Math.max(0, feathers || 0);
  }

  // Revenue of ONE delivery of a route.
  function deliveryRevenue(route, level, ctx) {
    if (level <= 0) return 0;
    return route.revenue * level * Math.pow(2, milestonesReached(level)) *
      upgradeMult(route.id, ctx.upgrades) * ctx.globalMult;
  }

  function perSecond(route, level, ctx) {
    return deliveryRevenue(route, level, ctx) / route.time;
  }

  function feathersFor(runEarnings) {
    if (!(runEarnings > 0)) return 0;
    return Math.floor(Math.sqrt(runEarnings / PRESTIGE.unit));
  }

  function offlineEarnings(awaySeconds, ratePerSecond, maxHours) {
    if (!(awaySeconds > 0) || !(ratePerSecond > 0)) return 0;
    const capped = Math.min(awaySeconds, (maxHours || OFFLINE.maxHours) * 3600);
    return Math.floor(capped * ratePerSecond * OFFLINE.efficiency);
  }

  function xpForLevel(level) { // XP needed to go from `level` to level+1
    return Math.floor(LEVELS.base * Math.pow(LEVELS.growth, level - 1));
  }

  // ---- Number formatting ----------------------------------------------------
  const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  function formatNumber(value, decimals) {
    if (!isFinite(value)) return "∞";
    if (value < 0) return "-" + formatNumber(-value, decimals);
    if (value < 1000) return String(Math.floor(value));
    decimals = decimals === undefined ? 2 : decimals;
    let tier = Math.floor(Math.log10(value) / 3);
    let raw = value / Math.pow(1000, tier);
    if (raw >= 1000) { tier++; raw /= 1000; } // log10 float error guard
    if (tier >= SUFFIXES.length) return value.toExponential(2).replace("+", "");
    // Truncate (never round up), so 999 999 shows "999 K" and not "1000 K".
    const d = raw >= 100 ? 0 : raw >= 10 ? 1 : decimals;
    const f = Math.pow(10, d);
    const shown = Math.floor(raw * f + 1e-9) / f;
    return shown.toFixed(d).replace(".", ",") + " " + SUFFIXES[tier];
  }

  function formatDuration(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h > 0) return h + " h " + String(m).padStart(2, "0");
    if (m > 0) return m + " min " + String(s).padStart(2, "0");
    return s + " s";
  }

  // ---- Save sanitizing ----------------------------------------------------
  function sanitizeAmount(v) {
    return typeof v === "number" && isFinite(v) && v > 0 ? v : 0;
  }
  function sanitizeInt(v, max) {
    const n = sanitizeAmount(v);
    return Math.min(Math.floor(n), max === undefined ? 1e9 : max);
  }

  root.ECON = {
    ROUTES, MILESTONES, UPGRADES, PRESTIGE, OFFLINE, LEVELS, GOLDEN, AD_BOOST, DAILY, QUESTS,
    levelCost, bulkCost, maxAffordable, milestonesReached, nextMilestone, upgradeMult, featherMult,
    deliveryRevenue, perSecond, feathersFor, offlineEarnings, xpForLevel,
    formatNumber, formatDuration, sanitizeAmount, sanitizeInt,
  };
})(typeof window !== "undefined" ? window : globalThis);
