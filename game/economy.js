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
    { id: "pizzas",  name: "Pizzas volantes",  parcel: "pizza",   baseCost: 1.4e5,  growth: 1.15, revenue: 1900,   time: 12.0, manager: 3.2e6 },
    { id: "fleurs",  name: "Bouquets",         parcel: "flower",  baseCost: 3.5e6,  growth: 1.16, revenue: 26000,  time: 24.0, manager: 8e7 },
    { id: "bijoux",  name: "Bijoux précieux",  parcel: "gem",     baseCost: 1.2e8,  growth: 1.17, revenue: 380000, time: 48.0, manager: 3e9 },
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
    unit: 1e8,
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
  const DAILY_EGGS = { 4: "common", 7: "rare" }; // bonus egg on streak days 4 and 7

  // Sequential objectives; three are shown at a time. Reward: gems and/or an egg.
  const QUESTS = [
    { id: "q1",  text: "Envoie 10 lettres",                       type: "deliveries", route: "lettres", n: 10, gems: 5 },
    { id: "q2",  text: "Passe Lettres au niveau 10",              type: "level", route: "lettres", n: 10,  gems: 5 },
    { id: "q3",  text: "Engage le chef du pigeonnier Lettres",    type: "manager", route: "lettres",       gems: 10 },
    { id: "q4",  text: "Ouvre la route Cartes postales",          type: "level", route: "cartes", n: 1,    gems: 5 },
    { id: "q5",  text: "Réussis 5 tampons parfaits",              type: "stamps", n: 5,                    gems: 10 },
    { id: "q6",  text: "Attrape un pigeon doré",                  type: "golden", n: 1,                    gems: 10 },
    { id: "q7",  text: "Passe Lettres au niveau 25",              type: "level", route: "lettres", n: 25,  gems: 10 },
    { id: "q8",  text: "Fais éclore ton premier œuf",             type: "hatched", n: 1,                   gems: 10, egg: "common" },
    { id: "q9",  text: "Donne une route à un pigeon star",        type: "assigned", n: 1,                  gems: 10 },
    { id: "q10", text: "Ouvre la route Colis express",            type: "level", route: "colis", n: 1,     gems: 10 },
    { id: "q11", text: "Lis 2 lettres de clients",                type: "letters", n: 2,                   gems: 15 },
    { id: "q12", text: "Achète ta première amélioration",         type: "upgrades", n: 1,                  gems: 10 },
    { id: "q13", text: "Fais fuir le chat Moustache",             type: "cats", n: 1,                      gems: 15 },
    { id: "q14", text: "Fais un combo de 10 tampons parfaits",    type: "bestCombo", n: 10,                gems: 20, egg: "rare" },
    { id: "q15", text: "Ouvre la route Pizzas volantes",          type: "level", route: "pizzas", n: 1,    gems: 15 },
    { id: "q16", text: "Gagne 1 M pièces au total",               type: "earned", n: 1e6,                  gems: 20 },
    { id: "q17", text: "Réunis 4 pigeons stars différents",       type: "crew", n: 4,                      gems: 25 },
    { id: "q18", text: "Engage 4 chefs de pigeonnier",            type: "managers", n: 4,                  gems: 20 },
    { id: "q19", text: "Ouvre la route Bouquets",                 type: "level", route: "fleurs", n: 1,    gems: 20, egg: "rare" },
    { id: "q20", text: "Fais fuir 5 fois le chat Moustache",      type: "cats", n: 5,                      gems: 25 },
    { id: "q21", text: "Passe Lettres au niveau 100",             type: "level", route: "lettres", n: 100, gems: 20 },
    { id: "q22", text: "Ouvre la route Bijoux précieux",          type: "level", route: "bijoux", n: 1,    gems: 30 },
    { id: "q23", text: "Déménage vers une nouvelle ville",        type: "prestige", n: 1,                  gems: 50, egg: "legendary" },
    { id: "q24", text: "Lis 15 lettres de clients",               type: "letters", n: 15,                  gems: 30 },
    { id: "q25", text: "Réunis 8 pigeons stars différents",       type: "crew", n: 8,                      gems: 50 },
    { id: "q26", text: "Gagne 1 B pièces au total",               type: "earned", n: 1e9,                  gems: 40 },
    { id: "q27", text: "Passe toutes les routes au niveau 50",    type: "allLevel", n: 50,                 gems: 50, egg: "rare" },
    { id: "q28", text: "Réunis les 12 pigeons stars",             type: "crew", n: 12,                     gems: 100 },
    { id: "q29", text: "Déménage 3 fois",                         type: "prestige", n: 3,                  gems: 80, egg: "legendary" },
  ];

  // ---- Crew: star pigeons with a funny flaw that is also a strength ------
  // effect kinds: revenue (×value), speed (time ÷ value), sleepy (×value while awake),
  // lost (chance of a ×5 surprise), offline (×value while away), double (chance of 2 deliveries),
  // stamp (perfect window ×value), xp (×value), ninja (×value + cat-proof), golden (×value + golden pigeons ×2).
  const PIGEONS = [
    { id: "gerard",    name: "Gérard le Ronfleur",   rarity: "common",    effect: "sleepy",  value: 3,    quirk: "Livre ×3… quand il est réveillé. Touche-le quand il ronfle !" },
    { id: "paulette",  name: "Paulette la Pressée",  rarity: "common",    effect: "speed",   value: 1.5,  quirk: "Vole 50 % plus vite. N'a jamais le temps de dire bonjour." },
    { id: "bob",       name: "Bob le Costaud",       rarity: "common",    effect: "revenue", value: 2,    quirk: "Revenus ×2. Il porte le colis, la boîte aux lettres et parfois le facteur." },
    { id: "kevin",     name: "Kevin le Distrait",    rarity: "common",    effect: "lost",    value: 0.15, quirk: "Se trompe d'adresse 15 % du temps… et revient avec des cadeaux ×5." },
    { id: "mamie",     name: "Mamie Plume",          rarity: "common",    effect: "offline", value: 3,    quirk: "Livre ×3 pendant ton absence. Elle tricote en volant." },
    { id: "zizou",     name: "Zizou le Jongleur",    rarity: "rare",      effect: "double",  value: 0.3,  quirk: "30 % de chances de livrer deux colis d'un coup. Sans les mains." },
    { id: "lulu",      name: "Lulu la Chanteuse",    rarity: "rare",      effect: "stamp",   value: 2,    quirk: "Tampons parfaits deux fois plus faciles. Elle chante le bon moment." },
    { id: "prof",      name: "Professeur Bec",       rarity: "rare",      effect: "xp",      value: 3,    quirk: "XP ×3 sur sa route. A écrit 47 livres sur les miettes de pain." },
    { id: "ninja",     name: "Ninja Gris",           rarity: "rare",      effect: "ninja",   value: 2.5,  quirk: "Revenus ×2,5 et le chat ne le trouve jamais. Lui non plus, d'ailleurs." },
    { id: "capitaine", name: "Capitaine Roucoule",   rarity: "rare",      effect: "revenue", value: 3,    quirk: "Revenus ×3. Salue chaque nuage, un par un." },
    { id: "paillette", name: "Princesse Paillette",  rarity: "legendary", effect: "golden",  value: 4,    quirk: "Revenus ×4 et les pigeons dorés passent deux fois plus souvent." },
    { id: "turbo",     name: "Turbo",                rarity: "legendary", effect: "speed",   value: 3,    quirk: "Vole 3 fois plus vite. Il a doublé un avion. L'avion boude encore." },
  ];
  const MAX_STARS = 3;          // duplicates add a star (+50 % of the bonus each)
  const DUPLICATE_GEMS = 20;    // a duplicate past 3 stars turns into gems

  // Eggs are only EARNED (never sold for money): odds are shown in the game.
  const EGGS = {
    common:    { name: "Œuf tacheté",  hatchMinutes: 5,   gemSkip: 10, odds: { common: 80, rare: 18, legendary: 2 } },
    rare:      { name: "Œuf étoilé",   hatchMinutes: 30,  gemSkip: 25, odds: { common: 40, rare: 50, legendary: 10 } },
    legendary: { name: "Œuf doré",     hatchMinutes: 120, gemSkip: 60, odds: { common: 0,  rare: 40, legendary: 60 } },
  };
  // Route milestones that drop an egg (first time in each city).
  const MILESTONE_EGGS = { 25: "common", 100: "rare", 300: "legendary" };
  const INCUBATOR = { slots: 1, bonusSlotLevel: 12, maxStoredEggs: 6 };

  // Mister Moustache, the cat who naps on a lane. Tickle him 5 times.
  const CAT = { minLevel: 7, minDelay: 180, maxDelay: 360, taps: 5, stays: 30, coinSeconds: 45, eggChance: 0.15 };

  // Perfect stamp: tap the mailbox at the end of a flight.
  const STAMP = { window: 0.22, minTime: 1.5, mult: 3, comboEvery: 5, comboBoostSeconds: 30, comboBoostMult: 2 };

  // Funny customer letters.
  const LETTERS_CFG = { minLevel: 5, minDelay: 240, maxDelay: 420, maxWaiting: 3, coinSeconds: 120 };

  // Rewarded ads: always optional, only at reward or progression moments.
  const ADS = {
    dailyCap: 12,
    placements: {
      offline_x2: "Gains d'absence ×2",
      daily_x2: "Coffre du jour ×2",
      hatch_now: "Éclosion immédiate",
      route_party: "Fête d'ouverture : ×2 pendant 10 min",
      prestige_bonus: "Plumes d'or ×1,5",
      letter_x2: "Récompense de lettre ×2",
      boost_30: "Boost ×2 pendant 30 min",
    },
    routePartyMinutes: 10,
    prestigeMult: 1.5,
  };

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

  // ---- Crew maths ----------------------------------------------------------
  function starScale(stars) { return 1 + 0.5 * (Math.max(1, Math.min(MAX_STARS, stars || 1)) - 1); }
  // Multiplier-type bonus grows with stars: 1 + (value-1) * starScale.
  function crewMultValue(p, stars) { return 1 + (p.value - 1) * starScale(stars); }
  function crewChance(p, stars) { return Math.min(0.9, p.value * starScale(stars)); }
  // Revenue multiplier a pigeon gives its route right now (awake = Gérard not snoring).
  function crewRevenueMult(p, stars, awake) {
    if (!p) return 1;
    if (p.effect === "revenue" || p.effect === "ninja" || p.effect === "golden") return crewMultValue(p, stars);
    if (p.effect === "sleepy") return awake ? crewMultValue(p, stars) : 1;
    return 1;
  }
  function crewSpeedMult(p, stars) { return p && p.effect === "speed" ? crewMultValue(p, stars) : 1; }
  function crewOfflineMult(p, stars) { return p && p.effect === "offline" ? crewMultValue(p, stars) : 1; }
  function crewXpMult(p, stars) { return p && p.effect === "xp" ? crewMultValue(p, stars) : 1; }

  // Pick a rarity then a pigeon from one uniform number u in [0,1).
  function rollEgg(type, u) {
    const odds = EGGS[type].odds;
    const total = odds.common + odds.rare + odds.legendary;
    let x = u * total, rarity = "legendary";
    for (const r of ["common", "rare", "legendary"]) { if (x < odds[r]) { rarity = r; break; } x -= odds[r]; }
    const pool = PIGEONS.filter((p) => p.rarity === rarity);
    const inner = Math.min(pool.length - 1, Math.floor((x / odds[rarity]) * pool.length));
    return pool[Math.max(0, inner)].id;
  }
  function eggOddsText(type) {
    const o = EGGS[type].odds;
    return ["common", "rare", "legendary"].filter((r) => o[r] > 0)
      .map((r) => ({ common: "commun", rare: "rare", legendary: "légendaire" })[r] + " " + o[r] + " %").join(" · ");
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
    DAILY_EGGS, PIGEONS, MAX_STARS, DUPLICATE_GEMS, EGGS, MILESTONE_EGGS, INCUBATOR, CAT, STAMP, LETTERS_CFG, ADS,
    starScale, crewMultValue, crewChance, crewRevenueMult, crewSpeedMult, crewOfflineMult, crewXpMult, rollEgg, eggOddsText,
    levelCost, bulkCost, maxAffordable, milestonesReached, nextMilestone, upgradeMult, featherMult,
    deliveryRevenue, perSecond, feathersFor, offlineEarnings, xpForLevel,
    formatNumber, formatDuration, sanitizeAmount, sanitizeInt,
  };
})(typeof window !== "undefined" ? window : globalThis);
