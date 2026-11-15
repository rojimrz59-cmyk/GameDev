/* Pigeon Express v2 — state, loop, saving, mechanics and UI.
 * Numbers: economy.js · Writing: content.js · Ads & purchases: ads.js */
(() => {
  "use strict";
  const E = window.ECON, C = window.CONTENT, M = window.Monet;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = (n) => E.formatNumber(n);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const now = () => Date.now();
  const SAVE_KEY = "pigeon-express-save";
  const SAVE_VERSION = 2;
  const LINE = "#2A1B3D";
  const O = `stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"`;
  const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const ROUTE_COLORS = [["#FF6B5A", "#D9483A"], ["#FFB23F", "#D98A1A"], ["#2DD4A7", "#16A383"],
    ["#FF8FB1", "#E0628C"], ["#A27BFF", "#7B55E0"], ["#4D8DFF", "#2F66D6"]];
  const CITY_TINTS = ["rgba(0,0,0,0)", "rgba(45,212,167,.12)", "rgba(255,178,63,.12)", "rgba(255,143,177,.14)",
    "rgba(162,123,255,.14)", "rgba(77,141,255,.14)", "rgba(255,201,60,.16)"];
  const SKINS = [
    { id: "classique", name: "Classique", cost: 0, look: { body: "#A7B3C9", wing: "#7F8BA6", belly: "#E3E9F4", acc: [] } },
    { id: "facteur", name: "Facteur", cost: 60, look: { body: "#AEB8CC", wing: "#7F8BA6", belly: "#E3E9F4", acc: ["cap"] } },
    { id: "aviateur", name: "Aviateur", cost: 120, look: { body: "#D3AE85", wing: "#A07A50", belly: "#F3E3CF", acc: ["gog"] } },
    { id: "royal", name: "Royal", cost: 200, look: { body: "#F6F2FC", wing: "#CFC2EE", belly: "#FFFFFF", acc: ["crown"] } },
    { id: "flamboyant", name: "Flamboyant", cost: 300, look: { body: "#FF8A6B", wing: "#E0563B", belly: "#FFD9CC", acc: ["scarf"] } },
    { id: "capucine", name: "Casquette de Capucine", cost: null, look: { body: "#E4DAF7", wing: "#B9A6E8", belly: "#FFFFFF", acc: ["postcap", "satchel"] } },
    { id: "augustin", name: "Facteur doré", cost: null, look: { body: "#FFE7A3", wing: "#E8B84A", belly: "#FFF6D6", acc: ["oldcap", "mustache"] } },
  ];
  const STAR_LOOKS = {
    gerard: { body: "#B9C2D6", wing: "#8E98B3", belly: "#EEF1F8", acc: ["nightcap"] },
    paulette: { body: "#FFB5C8", wing: "#FF8FB1", belly: "#FFE3EC", acc: ["bow"] },
    bob: { body: "#9FAEC6", wing: "#76859F", belly: "#DCE3EE", acc: ["band"], big: true },
    kevin: { body: "#C7E8A0", wing: "#95C760", belly: "#EEF8E1", acc: ["propeller"] },
    mamie: { body: "#E5DDF5", wing: "#C4B5E8", belly: "#F6F2FC", acc: ["shawl", "glasses"] },
    zizou: { body: "#FFD08A", wing: "#FFB347", belly: "#FFF0D6", acc: ["balls"] },
    lulu: { body: "#FFC2E2", wing: "#FF8CC6", belly: "#FFE8F4", acc: ["bow", "note"] },
    prof: { body: "#C9B79C", wing: "#A08A6A", belly: "#EFE6D8", acc: ["glasses", "mortarboard"] },
    ninja: { body: "#5C6378", wing: "#3E4457", belly: "#8A91A6", acc: ["mask"] },
    capitaine: { body: "#9EC9F0", wing: "#6FA6D9", belly: "#E3F1FC", acc: ["captain"] },
    paillette: { body: "#FFE27A", wing: "#FFC93C", belly: "#FFF6CF", acc: ["tiara"] },
    turbo: { body: "#FF7A59", wing: "#E0503A", belly: "#FFD9CC", acc: ["helmet"] },
  };
  const CAPUCINE_LOOK = { body: "#E4DAF7", wing: "#B9A6E8", belly: "#FFFFFF", acc: ["postcap", "satchel"] };
  const AUGUSTIN_LOOK = { body: "#E3E6EE", wing: "#B7BCCB", belly: "#FFFFFF", acc: ["oldcap", "glasses", "mustache"] };
  const GOLD_LOOK = { body: "#FFD54A", wing: "#F2A900", belly: "#FFF2B8", acc: ["crown"] };
  const RARITY_FR = { common: "Commun", rare: "Rare", legendary: "Légendaire" };
  const IAP = [
    { key: "starter", name: "Pack de démarrage", desc: "300 gemmes, skin Facteur et boost ×2 pendant 24 h" },
    { key: "gems500", name: "Sac de 500 gemmes", desc: "Pour les skins, les sauts temporels et les éclosions" },
    { key: "gems1500", name: "Coffre de 1 500 gemmes", desc: "Le meilleur rapport gemmes / prix" },
    { key: "premium", name: "Pass Premium", desc: "Revenus ×2, absence 12 h, une couveuse en plus et tous les bonus sans pub" },
  ];

  // ================================================================ state
  function freshState() {
    const s = {
      version: SAVE_VERSION, coins: 4, earned: 0, runEarned: 0, gems: 0, feathers: 0, prestiges: 0,
      lv: {}, mgr: {}, up: {}, deliveries: {}, xp: 0, level: 1, questsClaimed: [], golden: 0,
      daily: { last: "", streak: 0 }, skin: "classique", skinsOwned: ["classique"],
      adBoostUntil: 0, goldBoostUntil: 0, comboBoostUntil: 0, lastSeen: Date.now(), savedAt: 0, tutorial: 0, musicVol: 0.6, sfxVol: 0.8, multi: "1",
      // v2
      owned: {}, crew: {}, eggs: [], incubator: [], dropped: {}, hatched: 0, stamps: 0, bestCombo: 0, cats: 0,
      lettersRead: 0, lettersWaiting: [], lettersSeen: [], tips: {}, birthYear: 0, kid: false, pauseReminder: false,
      premium: false, ads: { day: "", n: 0 },
      story: { done: [], hearts: {}, flags: {}, catDay: { day: "", n: 0 } },
    };
    for (const r of E.ROUTES) { s.lv[r.id] = 0; s.mgr[r.id] = false; s.deliveries[r.id] = 0; }
    s.lv.lettres = 1;
    return s;
  }

  function repair(o) {
    if (!o || typeof o !== "object") return null;
    const v = Number(o.version) || 1;
    if (v > SAVE_VERSION) return null; // a save from a newer build: refuse rather than half-load
    const s = freshState();
    const A = E.sanitizeAmount, I = E.sanitizeInt;
    s.coins = A(o.coins); s.earned = A(o.earned); s.runEarned = A(o.runEarned);
    s.gems = I(o.gems); s.feathers = I(o.feathers); s.prestiges = I(o.prestiges, 1000);
    for (const r of E.ROUTES) {
      s.lv[r.id] = I(o.lv && o.lv[r.id], 5000);
      s.mgr[r.id] = !!(o.mgr && o.mgr[r.id]) && s.lv[r.id] > 0;
      s.deliveries[r.id] = I(o.deliveries && o.deliveries[r.id], 1e15);
    }
    if (s.lv.lettres < 1) s.lv.lettres = 1;
    for (const u of E.UPGRADES) s.up[u.id] = !!(o.up && o.up[u.id]);
    s.xp = A(o.xp); s.level = Math.max(1, I(o.level, 999));
    const qids = new Set(E.QUESTS.map((q) => q.id));
    s.questsClaimed = Array.isArray(o.questsClaimed) ? o.questsClaimed.filter((id) => qids.has(id)) : [];
    s.golden = I(o.golden, 1e9);
    if (o.daily && typeof o.daily.last === "string") s.daily = { last: o.daily.last.slice(0, 10), streak: I(o.daily.streak, 7) };
    const skinIds = new Set(SKINS.map((k) => k.id));
    s.skinsOwned = Array.isArray(o.skinsOwned) ? o.skinsOwned.filter((id) => skinIds.has(id)) : [];
    if (!s.skinsOwned.includes("classique")) s.skinsOwned.unshift("classique");
    s.skin = s.skinsOwned.includes(o.skin) ? o.skin : "classique";
    s.adBoostUntil = A(o.adBoostUntil); s.goldBoostUntil = A(o.goldBoostUntil); s.comboBoostUntil = A(o.comboBoostUntil);
    s.lastSeen = A(o.lastSeen) || Date.now(); s.savedAt = A(o.savedAt);
    s.tutorial = I(o.tutorial, 99);
    const vol = (v, d) => (typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
    s.musicVol = o.sound === false ? 0 : vol(o.musicVol, 0.6); s.sfxVol = o.sound === false ? 0 : vol(o.sfxVol, 0.8);
    s.multi = ["1", "10", "100", "max"].includes(o.multi) ? o.multi : "1";
    // v2 fields (absent in v1 saves: defaults apply)
    const pids = new Set(E.PIGEONS.map((p) => p.id));
    if (o.owned && typeof o.owned === "object") for (const id in o.owned) if (pids.has(id)) s.owned[id] = Math.max(1, I(o.owned[id], E.MAX_STARS));
    if (o.crew && typeof o.crew === "object") for (const rid in o.crew) if (s.lv[rid] > 0 && s.owned[o.crew[rid]]) s.crew[rid] = o.crew[rid];
    const eggTypes = new Set(Object.keys(E.EGGS));
    s.eggs = Array.isArray(o.eggs) ? o.eggs.filter((t) => eggTypes.has(t)).slice(0, E.INCUBATOR.maxStoredEggs) : [];
    s.incubator = Array.isArray(o.incubator) ? o.incubator.filter((x) => x && eggTypes.has(x.type) && pids.has(x.result)).slice(0, 3)
      .map((x) => ({ type: x.type, result: x.result, start: A(x.start), end: A(x.end) })) : [];
    if (o.dropped && typeof o.dropped === "object") for (const k in o.dropped) if (/^[a-z]+:\d+$/.test(k)) s.dropped[k] = true;
    s.hatched = I(o.hatched); s.stamps = I(o.stamps, 1e12); s.bestCombo = I(o.bestCombo, 1e6); s.cats = I(o.cats, 1e9);
    s.lettersRead = I(o.lettersRead, 1e9);
    const nL = C.LETTERS.length;
    s.lettersWaiting = Array.isArray(o.lettersWaiting) ? o.lettersWaiting.filter((i) => Number.isInteger(i) && i >= 0 && i < nL).slice(0, E.LETTERS_CFG.maxWaiting) : [];
    s.lettersSeen = Array.isArray(o.lettersSeen) ? o.lettersSeen.filter((i) => Number.isInteger(i) && i >= 0 && i < nL).slice(-8) : [];
    if (o.tips && typeof o.tips === "object") for (const k in o.tips) if (/^[a-z]+$/.test(k)) s.tips[k] = true;
    const y = new Date().getFullYear();
    s.birthYear = I(o.birthYear, y); if (s.birthYear && s.birthYear < y - 120) s.birthYear = 0;
    s.kid = s.birthYear ? y - s.birthYear <= 13 : false;
    s.pauseReminder = !!o.pauseReminder; s.premium = !!o.premium;
    const st = o.story && typeof o.story === "object" ? o.story : {};
    const sceneIds = new Set(window.STORY.SCENES.map((x) => x.id));
    s.story.done = Array.isArray(st.done) ? st.done.filter((id) => sceneIds.has(id)) : [];
    if (st.hearts && typeof st.hearts === "object") for (const w in window.STORY.CHARACTERS) if (st.hearts[w]) s.story.hearts[w] = I(st.hearts[w], window.STORY.MAX_HEARTS);
    if (st.flags && typeof st.flags === "object") for (const f of ["partner", "guardian", "ending"]) if (st.flags[f]) s.story.flags[f] = true;
    if (st.catDay && typeof st.catDay.day === "string") s.story.catDay = { day: st.catDay.day.slice(0, 10), n: I(st.catDay.n, 99) };
    if (o.ads && typeof o.ads.day === "string") s.ads = { day: o.ads.day.slice(0, 10), n: I(o.ads.n, 999) };
    return s;
  }
  function parse(raw) { try { return repair(JSON.parse(raw)); } catch (e) { return null; } }

  let S = freshState();
  const rt = { prog: {}, running: {}, stamped: {}, awake: {}, lastWall: Date.now(), lastUi: 0, lastSave: Date.now(), lastCloud: Date.now(),
    goldenAt: Date.now() + 40000, catAt: Date.now() + 120000, letterAt: Date.now() + 60000, popAt: {}, coinSoundAt: 0, kevinAt: 0,
    tab: "routes", combo: 0, cat: null, shown: 0, sessionStart: Date.now(), lastCheck: 0 };
  for (const r of E.ROUTES) { rt.prog[r.id] = 0; rt.running[r.id] = false; rt.popAt[r.id] = 0; }

  // ================================================================ saving
  function serialize() { S.lastSeen = Date.now(); S.savedAt = S.lastSeen; return JSON.stringify(S); }
  function saveLocal() {
    try {
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(SAVE_KEY + ".bak", prev);
      localStorage.setItem(SAVE_KEY, serialize());
    } catch (e) { /* storage blocked: cloud save still works */ }
  }
  function loadLocal() {
    try { return parse(localStorage.getItem(SAVE_KEY)) || parse(localStorage.getItem(SAVE_KEY + ".bak")); } catch (e) { return null; }
  }
  const cloud = { doc: null, busy: false };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]);
  async function initCloud() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    try {
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      const doc = db.doc("data/users/" + id + "/save");
      const snap = await withTimeout(doc.get(), 10000);
      cloud.doc = doc;
      if (snap.exists) {
        const d = snap.data();
        const remote = typeof d.json === "string" ? parse(d.json) : null;
        if (remote && remote.savedAt > S.savedAt + 2000) { S = remote; afterLoad(true); toast("Partie récupérée depuis ton compte"); }
      }
      pushCloud();
    } catch (e) { /* local save only */ }
  }
  async function pushCloud() {
    if (!cloud.doc || cloud.busy) return;
    cloud.busy = true;
    try { const json = serialize(); await cloud.doc.set({ json, savedAt: S.savedAt }); }
    catch (e) { if (e && ["invalid_argument", "revoked", "not_granted", "capability_disabled", "quota_exceeded"].includes(e.code)) cloud.doc = null; }
    finally { cloud.busy = false; }
  }
  function saveAll() { saveLocal(); pushCloud(); }

  // ================================================================ economy helpers
  const pigeonOf = (rid) => { const id = S.crew[rid]; return id ? E.PIGEONS.find((p) => p.id === id) : null; };
  const starsOf = (pid) => S.owned[pid] || 0;
  const crewOn = (pid) => Object.keys(S.crew).find((rid) => S.crew[rid] === pid);
  const isAwake = (rid) => !(pigeonOf(rid) && pigeonOf(rid).effect === "sleepy") || now() < (rt.awake[rid] || 0);
  const premiumMult = () => (S.premium ? 2 : 1);
  function storyMult() {
    const f = S.story.flags;
    return (1 + 0.02 * (S.story.hearts.capucine || 0)) * (f.partner ? 1.15 : 1) * (f.ending ? 1.25 : 1);
  }
  function globalMult() {
    const t = now();
    return E.featherMult(S.feathers) * premiumMult() * storyMult() * (S.adBoostUntil > t ? E.AD_BOOST.mult : 1) *
      (S.goldBoostUntil > t ? E.GOLDEN.boostMult : 1) * (S.comboBoostUntil > t ? E.STAMP.comboBoostMult : 1);
  }
  const ctxFull = () => ({ upgrades: S.up, globalMult: globalMult() });
  const ctxBase = () => ({ upgrades: S.up, globalMult: E.featherMult(S.feathers) * premiumMult() * storyMult() });
  const routeIndex = (id) => E.ROUTES.findIndex((r) => r.id === id);
  const routeById = (id) => E.ROUTES[routeIndex(id)];
  function effTime(r) { const p = pigeonOf(r.id); return r.time / E.crewSpeedMult(p, p && starsOf(p.id)); }
  function crewRev(rid) { const p = pigeonOf(rid); return E.crewRevenueMult(p, p && starsOf(p.id), isAwake(rid)); }
  function deliveryValue(r, ctx) { return E.deliveryRevenue(r, S.lv[r.id], ctx || ctxFull()) * crewRev(r.id); }
  function routeRate(r, ctx) { return deliveryValue(r, ctx) / effTime(r); }
  function totalRate() {
    const c = ctxFull();
    return E.ROUTES.reduce((a, r) => a + (S.lv[r.id] > 0 && (S.mgr[r.id] || rt.running[r.id]) && !(rt.cat && rt.cat.route === r.id) ? routeRate(r, c) : 0), 0);
  }
  function offlineRate() { // managed routes while away: Gérard snores, Mamie Plume works triple
    const c = ctxBase();
    return E.ROUTES.reduce((a, r) => {
      if (!S.mgr[r.id] || S.lv[r.id] <= 0) return a;
      const p = pigeonOf(r.id), st = p && starsOf(p.id);
      return a + E.deliveryRevenue(r, S.lv[r.id], c) * E.crewRevenueMult(p, st, false) * E.crewOfflineMult(p, st) / effTime(r);
    }, 0);
  }
  const offlineHours = () => (S.premium ? 12 : E.OFFLINE.maxHours);
  function earn(x) { S.coins += x; S.earned += x; S.runEarned += x; }
  function buyCount(r) {
    const owned = S.lv[r.id];
    if (S.multi === "max") { const m = E.maxAffordable(r, owned, S.coins, 1000); return m.count > 0 ? m : { count: 1, cost: E.levelCost(r, owned) }; }
    const n = Number(S.multi);
    return { count: n, cost: E.bulkCost(r, owned, n) };
  }
  const slotCount = () => E.INCUBATOR.slots + (S.level >= E.INCUBATOR.bonusSlotLevel ? 1 : 0) + (S.premium ? 1 : 0);

  // ================================================================ core actions
  function laneTap(id) {
    const r = routeById(id);
    if (S.lv[id] <= 0) return;
    if (rt.cat && rt.cat.route === id) { tickleCat(); return; }
    if (!isAwake(id)) { rt.awake[id] = now() + 45000; toast("Gérard se réveille en sursaut. « J'étais pas du tout en train de dormir ! »"); sfx("wake"); return; }
    if (!rt.running[id] && !S.mgr[id]) { send(id); return; }
    if (rt.running[id]) tryStamp(r);
  }
  function send(id) {
    rt.running[id] = true; rt.prog[id] = 0; rt.stamped[id] = false;
    sfx("send");
    if (S.tutorial === 0) setTutorial(1);
  }
  function stampWindow(r) {
    const p = pigeonOf(r.id);
    return E.STAMP.window * (p && p.effect === "stamp" ? E.crewMultValue(p, starsOf(p.id)) : 1);
  }
  const canStamp = (r) => effTime(r) >= E.STAMP.minTime;
  function tryStamp(r) {
    if (!canStamp(r) || rt.stamped[r.id]) return;
    const c = cards[r.id];
    if (rt.prog[r.id] >= 1 - stampWindow(r)) {
      rt.stamped[r.id] = true; rt.combo++; S.stamps++;
      if (rt.combo > S.bestCombo) S.bestCombo = rt.combo;
      stampFx(c, rt.combo >= 2 ? `PARFAIT ×${rt.combo}` : "TAMPONNÉ !", false); sfx("stamp", { combo: rt.combo });
      if (rt.combo % E.STAMP.comboEvery === 0) {
        S.comboBoostUntil = Math.max(S.comboBoostUntil, now()) + E.STAMP.comboBoostSeconds * 1000;
        toast(`Super combo ! Revenus ×${E.STAMP.comboBoostMult} pendant ${E.STAMP.comboBoostSeconds} s`); burstAt(c && c.lane, 30); sfx("combo"); shake(false);
      }
    } else { rt.combo = 0; stampFx(c, "Trop tôt !", true); sfx("miss"); }
  }

  function complete(r, i, n) {
    const p = pigeonOf(r.id), st = p && starsOf(p.id);
    let mult = 1;
    if (rt.stamped[r.id]) { mult *= E.STAMP.mult; rt.stamped[r.id] = false; }
    else if (canStamp(r) && rt.combo > 0 && !S.mgr[r.id]) rt.combo = 0; // missed the mailbox on a hand-sent flight
    if (p && p.effect === "double" && Math.random() < E.crewChance(p, st)) n += 1;
    if (p && p.effect === "lost" && Math.random() < E.crewChance(p, st)) {
      mult *= 5;
      if (now() - rt.kevinAt > 25000) { rt.kevinAt = now(); toast(pick(C.KEVIN)); sfx("kevin"); }
    }
    const gain = deliveryValue(r) * n * mult;
    earn(gain);
    S.deliveries[r.id] += n;
    S.xp += (i + 1) * n * E.crewXpMult(p, st);
    while (S.xp >= E.xpForLevel(S.level)) {
      S.xp -= E.xpForLevel(S.level); S.level++; S.gems += E.LEVELS.gemsPerLevel;
      banner(`Niveau ${S.level} !`, `+${E.LEVELS.gemsPerLevel} gemmes`); sfx("level"); stinger(1.2); burstAt($("#levelChip"), 30);
      if (S.level === E.INCUBATOR.bonusSlotLevel) toast("Nouvelle place dans la couveuse !");
    }
    const t = now(), c = cards[r.id];
    if (c && t - rt.popAt[r.id] > 180 && !reducedMotion && rt.tab === "routes") {
      rt.popAt[r.id] = t; coinPop(c, gain, mult >= 3);
      c.lane.classList.add("delivered"); setTimeout(() => c.lane.classList.remove("delivered"), 260);
      const d = c.lane.querySelector(".dest").getBoundingClientRect();
      if (d.bottom > 0 && d.top < window.innerHeight) burstXY(d.left + d.width / 2, d.top + d.height / 2, mult >= 3 ? 14 : 5, [ROUTE_COLORS[i][0], "#FFC93C", "#FFFFFF"]);
      if (mult >= 3) coinFly(c.lane, 4);
    }
    if (t - rt.coinSoundAt > 120) { rt.coinSoundAt = t; sfx("coin", { route: i }); }
    if (S.tutorial === 1) setTutorial(2);
  }

  function buy(id) {
    const r = routeById(id), i = routeIndex(id);
    const { count, cost } = buyCount(r);
    if (count <= 0 || cost > S.coins) return;
    const before = S.lv[id], wasLocked = before === 0;
    S.coins -= cost; S.lv[id] += count;
    const gained = E.milestonesReached(S.lv[id]) - E.milestonesReached(before);
    sfx("buy");
    if (gained > 0 && !wasLocked) { toast(`${r.name} : revenus ×${Math.pow(2, gained)} ! ${pick(C.MILESTONE_JOKES)}`); burstAt(cards[id] && cards[id].art, 40); sfx("milestone"); stinger(1); shake(false); }
    for (const m in E.MILESTONE_EGGS) {
      const key = id + ":" + m;
      if (before < +m && S.lv[id] >= +m && !S.dropped[key]) { S.dropped[key] = true; addEgg(E.MILESTONE_EGGS[m], `${r.name} niveau ${m}`); }
    }
    if (S.tutorial === 2 && S.lv.lettres >= 2) setTutorial(3);
    refreshCards(true);
    if (wasLocked && i > 0) setTimeout(() => routeParty(r, i), 150);
  }

  function hire(id) {
    const r = routeById(id);
    if (S.mgr[id] || S.lv[id] <= 0 || S.coins < r.manager) return;
    S.coins -= r.manager; S.mgr[id] = true; rt.running[id] = true;
    toast(`Chef engagé : ${r.name} livre tout seul !`); sfx("hire"); burstAt(cards[id] && cards[id].actions, 20);
    if (S.tutorial === 3) setTutorial(4);
    refreshCards(true);
  }

  function buyUpgrade(id) {
    const u = E.UPGRADES.find((x) => x.id === id);
    if (!u || S.up[id] || S.coins < u.cost) return;
    S.coins -= u.cost; S.up[id] = true; sfx("upgrade"); burstAt(null, 40);
    toast(`${u.name} : ${u.target === "all" ? "toutes les routes" : routeById(u.target).name} ×${u.mult} !`);
    renderTab();
  }

  function routeParty(r, i) {
    if (!$("#modal").hidden || rt.dlg) return;
    burstAt(null, 80); sfx("party"); stinger(1.5); shake(false);
    openModal(`<div class="hero">${raysSVG()}${loftSVG(i, 0)}</div><h2>Nouvelle route : ${r.name} !</h2>
      <p style="text-align:center">Les pigeons ont mis leurs plus beaux chapeaux pour l'inauguration.</p>
      <div class="btns"><button class="btn btn-ghost" data-close>Super !</button>${adButton("partyAd", `Fête : ×2 pendant ${E.ADS.routePartyMinutes} min`)}</div>`);
    $("#partyAd").addEventListener("click", () => watchAd("route_party", () => {
      S.adBoostUntil = Math.max(S.adBoostUntil, now()) + E.ADS.routePartyMinutes * 60000;
      closeModal(); toast(`C'est la fête ! Revenus ×2 pendant ${E.ADS.routePartyMinutes} min`); burstAt(null, 50);
    }));
  }

  // ================================================================ eggs & crew
  function addEgg(type, reason) {
    const free = S.incubator.length < slotCount();
    if (free) startEgg(type);
    else if (S.eggs.length < E.INCUBATOR.maxStoredEggs) S.eggs.push(type);
    else { S.gems += 5; toast("Couveuse pleine : l'œuf devient 5 gemmes"); return; }
    toast(`Tu gagnes un ${E.EGGS[type].name} ! (${reason})`); sfx("goldenAppear");
    firstTime("egg", `<div class="hero">${raysSVG()}${eggSVG(type, 0)}</div><h2>Un œuf !</h2><p>Les œufs éclosent dans la couveuse (onglet Équipage) et donnent des <b>pigeons stars</b>. Chacun a un défaut rigolo… qui est aussi un super pouvoir. Donne-lui une route pour l'utiliser.</p><div class="btns"><button class="btn btn-buy" id="goCrew">Voir la couveuse</button></div>`,
      () => $("#goCrew").addEventListener("click", () => { closeModal(); switchTab("crew"); }));
  }
  function startEgg(type) {
    const t = now();
    S.incubator.push({ type, result: E.rollEgg(type, Math.random()), start: t, end: t + E.EGGS[type].hatchMinutes * 60000 });
  }
  function fillIncubator() { while (S.incubator.length < slotCount() && S.eggs.length) startEgg(S.eggs.shift()); }
  const eggReady = (x) => now() >= x.end;
  function speedEgg(i, how) {
    const x = S.incubator[i]; if (!x || eggReady(x)) return;
    const go = () => { x.end = now(); renderTab(); toast("L'œuf tremble… il va éclore !"); };
    if (how === "ad") watchAd("hatch_now", go);
    else { const cost = E.EGGS[x.type].gemSkip; if (S.gems < cost) return; S.gems -= cost; go(); }
  }
  function hatch(i) {
    const x = S.incubator[i]; if (!x || !eggReady(x)) return;
    S.incubator.splice(i, 1); S.hatched++;
    const p = E.PIGEONS.find((q) => q.id === x.result);
    let line;
    if (!S.owned[p.id]) { S.owned[p.id] = 1; line = "Nouveau pigeon star !"; }
    else if (S.owned[p.id] < E.MAX_STARS) { S.owned[p.id]++; line = `Encore lui ! ${p.name} gagne une étoile : son pouvoir grandit.`; }
    else { S.gems += E.DUPLICATE_GEMS; line = `${p.name} est déjà au maximum : +${E.DUPLICATE_GEMS} gemmes.`; }
    fillIncubator(); sfx("hatch"); stinger(1.6); shake(true); burstAt(null, 100);
    const canAssign = !crewOn(p.id) && E.ROUTES.some((r) => S.lv[r.id] > 0);
    openModal(`<div class="hero">${raysSVG()}${pigeonSVG(STAR_LOOKS[p.id], null, { cls: "hatchling" })}</div>
      <h2>${p.name}</h2><p style="text-align:center"><span class="rarity ${p.rarity}">${RARITY_FR[p.rarity]}</span> <span class="stars">${"★".repeat(S.owned[p.id])}</span></p>
      <p style="text-align:center"><b>${line}</b><br>${p.quirk}</p>
      <div class="btns"><button class="btn btn-ghost" data-close>Génial !</button>${canAssign ? '<button class="btn btn-buy" id="assignNew">Lui donner une route</button>' : ""}</div>`);
    if (canAssign) $("#assignNew").addEventListener("click", () => openAssign(p.id));
    renderTab();
  }
  function assign(pid, rid) {
    for (const k of Object.keys(S.crew)) if (S.crew[k] === pid) delete S.crew[k];
    if (pid) S.crew[rid] = pid; else delete S.crew[rid];
    if (pid === "gerard") rt.awake[rid] = now() + 45000;
    if (pid) { const p = E.PIGEONS.find((q) => q.id === pid); toast(`${p.name} prend la route ${routeById(rid).name} !`); sfx("buy"); }
    closeModal(); refreshCards(true); renderTab();
  }
  function openAssign(pid) {
    const p = E.PIGEONS.find((q) => q.id === pid);
    const rows = E.ROUTES.filter((r) => S.lv[r.id] > 0).map((r) => {
      const cur = pigeonOf(r.id);
      return `<div class="row"><div class="grow"><div class="title">${r.name}</div><div class="sub">${cur ? "Actuellement : " + cur.name : "Pas de pigeon star"}</div></div><button class="btn btn-buy" data-rid="${r.id}" ${cur && cur.id === pid ? "disabled" : ""}>${cur && cur.id === pid ? "Déjà là" : "Choisir"}</button></div>`;
    }).join("");
    openModal(`<h2>Quelle route pour ${p.name} ?</h2><p style="text-align:center">${p.quirk}</p><div class="list">${rows}</div><div class="btns"><button class="btn btn-ghost" data-close>Annuler</button></div>`);
    for (const b of $("#sheet").querySelectorAll("[data-rid]")) b.addEventListener("click", () => assign(pid, b.dataset.rid));
  }
  function openPick(rid) {
    const owned = E.PIGEONS.filter((p) => S.owned[p.id]);
    if (!owned.length) { toast("Pas encore de pigeon star : gagne des œufs en franchissant les paliers 25, 100 et 300"); return; }
    const cur = pigeonOf(rid);
    const rows = owned.map((p) => {
      const where = crewOn(p.id);
      return `<div class="row"><div style="width:58px;flex:none">${pigeonSVG(STAR_LOOKS[p.id], null, { w: 58 })}</div><div class="grow"><div class="title">${p.name} <span class="stars" style="font-size:13px">${"★".repeat(starsOf(p.id))}</span></div><div class="sub">${p.quirk}${where && where !== rid ? " · sur " + routeById(where).name : ""}</div></div><button class="btn btn-buy" data-pid="${p.id}" ${cur && cur.id === p.id ? "disabled" : ""}>${cur && cur.id === p.id ? "Ici" : "Choisir"}</button></div>`;
    }).join("");
    openModal(`<h2>Pigeon star pour ${routeById(rid).name}</h2><div class="list">${rows}</div><div class="btns">${cur ? '<button class="btn btn-ghost" id="unassign">Retirer</button>' : ""}<button class="btn btn-ghost" data-close>Fermer</button></div>`);
    for (const b of $("#sheet").querySelectorAll("[data-pid]")) b.addEventListener("click", () => assign(b.dataset.pid, rid));
    const u = $("#unassign"); if (u) u.addEventListener("click", () => assign(null, rid));
  }

  // ================================================================ cat, letters, golden pigeon
  function spawnCat() {
    if (rt.cat || rt.dlg || S.level < E.CAT.minLevel || document.hidden || !$("#modal").hidden || S.tutorial < 5 || !S.story.done.includes("ch3")) return;
    const routes = E.ROUTES.filter((r) => S.lv[r.id] > 0 && !(pigeonOf(r.id) && pigeonOf(r.id).effect === "ninja"))
      .sort((a, b) => routeRate(b) - routeRate(a)).slice(0, 3);
    if (!routes.length) return;
    const r = pick(routes);
    rt.cat = { route: r.id, taps: 0, until: now() + E.CAT.stays * 1000 };
    if (guardian()) { drawCat(); toast("Moustache, le gardien, passe faire sa ronde. Touche-le !"); sfx("meow"); return; }
    drawCat(); toast(pick(C.CAT_ARRIVE)); sfx("meow"); shake(false);
    firstTime("cat", `<div class="hero">${catSVG()}</div><h2>Le chat Moustache !</h2><p>Il s'installe sur une piste et bloque les livraisons. Touche-le ${E.CAT.taps} fois pour le chatouiller : il s'enfuit en laissant tomber des pièces (et parfois un œuf).</p><div class="btns"><button class="btn btn-buy" data-close>Je m'en occupe !</button></div>`);
  }
  function drawCat() {
    const c = rt.cat && cards[rt.cat.route];
    if (!c || c.cat) return;
    const d = document.createElement("div"); d.className = "cat"; d.innerHTML = catSVG(guardian()) + `<span class="cat-n num">${guardian() ? "♥" : E.CAT.taps - rt.cat.taps}</span>`;
    c.lane.appendChild(d); c.cat = d;
  }
  function tickleCat() {
    const cat = rt.cat; if (!cat) return;
    cat.taps++; sfx("tickle");
    const el = cards[cat.route] && cards[cat.route].cat;
    if (el) { el.classList.remove("tickle"); void el.offsetWidth; el.classList.add("tickle"); const n = $(".cat-n", el); if (n) n.textContent = Math.max(0, E.CAT.taps - cat.taps); }
    if (cat.taps >= E.CAT.taps || guardian()) catLeave(true);
  }
  function catLeave(won) {
    const cat = rt.cat; if (!cat) return;
    rt.cat = null; rt.catAt = now() + (E.CAT.minDelay + Math.random() * (E.CAT.maxDelay - E.CAT.minDelay)) * 1000;
    const c = cards[cat.route];
    if (c && c.cat) { const el = c.cat; c.cat = null; el.classList.add("leave"); setTimeout(() => el.remove(), 650); }
    if (won) {
      S.cats++;
      const coins = Math.max(100, Math.floor(totalRate() * E.CAT.coinSeconds * (guardian() ? 1.5 : 1)));
      earn(coins); toast(`${guardian() ? "Moustache t'apporte un cadeau en ronronnant !" : pick(C.CAT_LEAVE)} +${fmt(coins)} pièces`);
      if (S.story.done.includes("ch3")) { const dk = dayKey(new Date()); if (S.story.catDay.day !== dk) S.story.catDay = { day: dk, n: 0 }; if (S.story.catDay.n < 2) { S.story.catDay.n++; addHearts("moustache", 1); } } sfx("catLeave"); shake(false);
      if (c) { coinFly(c.lane, 8); burstAt(c.lane, 24); }
      if (Math.random() < E.CAT.eggChance) addEgg("common", "cadeau de Moustache");
    } else toast(pick(C.CAT_BORED));
  }

  function newLetter() {
    if (S.level < E.LETTERS_CFG.minLevel || S.lettersWaiting.length >= E.LETTERS_CFG.maxWaiting) return;
    const pool = C.LETTERS.map((_, i) => i).filter((i) => !S.lettersSeen.includes(i) && !S.lettersWaiting.includes(i));
    const i = pool.length ? pick(pool) : Math.floor(Math.random() * C.LETTERS.length);
    S.lettersWaiting.push(i); sfx("letter");
    toast("Du courrier ! Un client t'a écrit.");
  }
  function letterReward(rw) {
    if (rw.coins) return { kind: "coins", amount: Math.max(100, Math.floor(Math.max(totalRate(), offlineRate()) * E.LETTERS_CFG.coinSeconds * rw.coins)) };
    if (rw.gems) return { kind: "gems", amount: rw.gems };
    if (rw.egg) return { kind: "egg", egg: rw.egg };
    return { kind: "boost", minutes: rw.boost };
  }
  function giveReward(rw, x2) {
    const k = x2 ? 2 : 1;
    if (rw.kind === "coins") { earn(rw.amount * k); coinFly($("#sheet"), 10); return `+${fmt(rw.amount * k)} pièces`; }
    if (rw.kind === "gems") { S.gems += rw.amount * k; return `+${rw.amount * k} gemmes`; }
    if (rw.kind === "egg") { addEgg(rw.egg, "courrier"); return `Un ${E.EGGS[rw.egg].name} !`; }
    S.adBoostUntil = Math.max(S.adBoostUntil, now()) + rw.minutes * 60000 * k; return `Boost ×2 pendant ${rw.minutes * k} min`;
  }
  function openLetter() {
    if (!S.lettersWaiting.length) return;
    const idx = S.lettersWaiting[0], L = C.LETTERS[idx];
    sfx("paper");
    openModal(`<h2>Courrier des clients</h2><div class="letter"><div class="from">De : ${L.from}</div><p>${L.text}</p></div>
      <div class="list">${L.choices.map((ch, j) => `<button class="btn ${j ? "btn-sun" : "btn-buy"}" data-ch="${j}">${ch.label}</button>`).join("")}</div>`);
    for (const b of $("#sheet").querySelectorAll("[data-ch]")) b.addEventListener("click", () => {
      const ch = L.choices[+b.dataset.ch];
      S.lettersWaiting.shift(); S.lettersSeen = [...S.lettersSeen, idx].slice(-8); S.lettersRead++;
      const rw = letterReward(ch.reward);
      const label = giveReward(rw, false); sfx("cash"); burstAt(null, 40);
      const doublable = rw.kind === "coins" || rw.kind === "gems";
      openModal(`<h2>${ch.label}</h2><div class="letter"><p>${ch.outcome}</p></div><p style="text-align:center"><b class="big-stat" style="font-size:24px">${label}</b></p>
        <div class="btns"><button class="btn btn-ghost" data-close>Merci !</button>${doublable ? adButton("letterAd", "Récompense ×2") : ""}</div>`);
      if (doublable) $("#letterAd").addEventListener("click", () => watchAd("letter_x2", () => { const l2 = giveReward(rw, false); closeModal(); toast(`Bonus : ${l2}`); }));
      updateUi();
    });
  }

  function spawnGolden() {
    if ($("#golden") || rt.dlg || S.tutorial < 5 || document.hidden || !$("#modal").hidden) return;
    const b = document.createElement("button");
    b.id = "golden"; b.setAttribute("aria-label", "Attraper le pigeon doré");
    b.style.setProperty("--dur", E.GOLDEN.visible + "s");
    b.style.top = (150 + Math.random() * 200) + "px";
    b.innerHTML = pigeonSVG(GOLD_LOOK, "gem", { flying: true });
    b.addEventListener("click", () => { const r = b.getBoundingClientRect(); b.remove(); catchGolden(r); });
    b.addEventListener("animationend", () => b.remove());
    $("#app").appendChild(b); sfx("goldenAppear");
  }
  function catchGolden(rect) {
    S.golden++; sfx("goldenCatch"); shake(false); burstXY(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
    if (Math.random() < 0.5) {
      S.goldBoostUntil = now() + E.GOLDEN.boostSeconds * 1000;
      toast(`Pigeon doré : revenus ×${E.GOLDEN.boostMult} pendant ${E.GOLDEN.boostSeconds} s !`);
    } else {
      const coins = Math.max(50, Math.floor(totalRate() * E.GOLDEN.coinSeconds));
      earn(coins); toast(`Pigeon doré : +${fmt(coins)} pièces !`); coinFlyXY(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
    }
  }
  const goldenFactor = () => (Object.values(S.crew).includes("paillette") ? 0.5 : 1);

  // ================================================================ ads, purchases, parental gate
  function adsLeft() { const d = dayKey(new Date()); if (S.ads.day !== d) S.ads = { day: d, n: 0 }; return E.ADS.dailyCap - S.ads.n; }
  function adButton(id, label) {
    const tag = S.premium ? "Bonus Premium" : adsLeft() > 0 ? "Regarder une pub" : "Plus de pub aujourd'hui";
    return `<button class="btn btn-sun" id="${id}" ${!S.premium && adsLeft() <= 0 ? "disabled" : ""}>${label}<small><svg viewBox="0 0 24 24"><use href="#i-play"/></svg>${tag}</small></button>`;
  }
  async function watchAd(placement, reward) {
    if (S.premium) { reward(); return; }
    if (adsLeft() <= 0) { toast("Plus de pub aujourd'hui. Reviens demain !"); return; }
    if (AU) AU.duck("ad", true);
    const ok = await M.rewarded(placement);
    if (AU) AU.duck("ad", false);
    if (ok) { S.ads.n++; reward(); } else toast("Pas de récompense cette fois : la pub n'a pas été regardée jusqu'au bout.");
  }
  function simulatedAd(placement) { // web build only: a 3-second stand-in for a real rewarded ad
    return new Promise((resolve) => {
      let left = 3;
      openModal(`<h2>Publicité</h2><div class="ad-box">Publicité simulée (version web)<br>« ${E.ADS.placements[placement] || "Bonus"} »<br>Récompense dans <b id="adLeft" class="num">3</b> s</div>
        <p class="note" style="text-align:center">Dans l'app iPhone et Android, une vraie vidéo récompensée s'affiche ici.</p><div class="btns"><button class="btn btn-ghost" id="adStop">Arrêter</button></div>`, false);
      const iv = setInterval(() => {
        left--; const el = $("#adLeft"); if (el) el.textContent = left;
        if (left <= 0) { clearInterval(iv); rt.adTimer = null; closeModal(); resolve(true); }
      }, 1000);
      rt.adTimer = iv;
      $("#adStop").addEventListener("click", () => { clearInterval(iv); rt.adTimer = null; closeModal(); resolve(false); });
    });
  }
  function parentalGate() {
    return new Promise((resolve) => {
      const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
      openModal(`<h2>Demande à un adulte</h2><p style="text-align:center">Un adulte doit répondre pour continuer : combien font <b>${a} × ${b}</b> ?</p>
        <div class="gate"><input id="gateIn" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Réponse"></div>
        <div class="btns"><button class="btn btn-ghost" id="gateNo">Annuler</button><button class="btn btn-buy" id="gateOk">Valider</button></div>`, false);
      $("#gateOk").addEventListener("click", () => { const ok = Number($("#gateIn").value) === a * b; closeModal(); if (!ok) { toast("Ce n'est pas la bonne réponse."); sfx("deny"); } resolve(ok); });
      $("#gateNo").addEventListener("click", () => { closeModal(); resolve(false); });
    });
  }
  async function buyIap(key) {
    if (!M.native) { toast("Les achats arrivent avec l'app iPhone et Android."); return; }
    if (S.kid && !(await parentalGate())) return;
    const r = await M.purchase(key);
    if (r.ok) grantIap(key);
    else if (r.reason !== "cancel") toast("Achat impossible pour le moment. Réessaie plus tard.");
  }
  function grantIap(key) {
    if (key === "starter") { S.gems += 300; if (!S.skinsOwned.includes("facteur")) S.skinsOwned.push("facteur"); S.skin = "facteur"; S.adBoostUntil = Math.max(S.adBoostUntil, now()) + 24 * 3600000; applySkin(); }
    if (key === "gems500") S.gems += 500;
    if (key === "gems1500") S.gems += 1500;
    if (key === "premium") { S.premium = true; fillIncubator(); }
    toast("Merci ! Achat reçu."); burstAt(null, 80); sfx("cash"); stinger(1); saveAll(); renderTab();
  }

  // ================================================================ quests, daily, prestige
  function questProgress(q) {
    switch (q.type) {
      case "deliveries": return [S.deliveries[q.route], q.n];
      case "level": return [S.lv[q.route], q.n];
      case "manager": return [S.mgr[q.route] ? 1 : 0, 1];
      case "golden": return [S.golden, q.n];
      case "earned": return [S.earned, q.n];
      case "upgrades": return [Object.values(S.up).filter(Boolean).length, q.n];
      case "managers": return [Object.values(S.mgr).filter(Boolean).length, q.n];
      case "prestige": return [S.prestiges, q.n];
      case "allLevel": return [Math.min(...E.ROUTES.map((r) => S.lv[r.id])), q.n];
      case "stamps": return [S.stamps, q.n];
      case "bestCombo": return [S.bestCombo, q.n];
      case "hatched": return [S.hatched, q.n];
      case "assigned": return [Object.keys(S.crew).length, q.n];
      case "letters": return [S.lettersRead, q.n];
      case "cats": return [S.cats, q.n];
      case "crew": return [Object.keys(S.owned).length, q.n];
      default: return [0, 1];
    }
  }
  const activeQuests = () => E.QUESTS.filter((q) => !S.questsClaimed.includes(q.id)).slice(0, 3);
  const questReady = (q) => { const [c, n] = questProgress(q); return c >= n; };
  function claimQuest(id) {
    const q = E.QUESTS.find((x) => x.id === id);
    if (!q || S.questsClaimed.includes(id) || !questReady(q)) return;
    S.questsClaimed.push(id); S.gems += q.gems; sfx("cash"); burstAt(null, 40);
    toast(`Objectif réussi : +${q.gems} gemmes`);
    if (q.egg) addEgg(q.egg, "objectif");
    renderTab();
  }
  function dayKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dailyInfo() {
    const today = dayKey(new Date());
    const y = new Date(); y.setDate(y.getDate() - 1);
    const can = S.daily.last !== today;
    const next = S.daily.last === dayKey(y) ? (S.daily.streak % 7) + 1 : 1;
    return { can, next, today, shownStreak: can ? next - 1 : S.daily.streak };
  }
  function claimDaily(double) {
    const d = dailyInfo(); if (!d.can) return;
    const g = E.DAILY[d.next - 1] * (double ? 2 : 1);
    S.gems += g; S.daily = { last: d.today, streak: d.next };
    if (S.story.done.includes("prologue")) addHearts("capucine", 1);
    toast(`Coffre du jour ${d.next} : +${g} gemmes`); sfx("milestone"); stinger(1); shake(false); burstAt(null, 70);
    if (E.DAILY_EGGS[d.next]) addEgg(E.DAILY_EGGS[d.next], `coffre du jour ${d.next}`);
    renderTab();
  }
  const prestigeGain = () => E.feathersFor(S.runEarned);
  function doPrestige(mult) {
    const gain = Math.floor(prestigeGain() * (mult || 1));
    if (gain < 1) return;
    S.feathers += gain; S.prestiges++;
    S.coins = 4; S.runEarned = 0; S.dropped = {};
    for (const r of E.ROUTES) { S.lv[r.id] = 0; S.mgr[r.id] = false; rt.running[r.id] = false; rt.prog[r.id] = 0; }
    S.lv.lettres = 1;
    for (const u of E.UPGRADES) S.up[u.id] = false;
    if (rt.cat) rt.cat = null;
    closeModal();
    const card = document.createElement("div"); card.className = "city-card";
    card.innerHTML = `<div><small>Bienvenue à</small>${cityName()}<small>+${gain} plumes d'or</small></div>`;
    document.body.appendChild(card); setTimeout(() => card.remove(), 2300);
    applyCity(); buildRoutes(); switchTab("routes"); sfx("prestige"); stinger(2.4); setTimeout(() => { burstAt(null, 140); shake(true); }, 600); saveAll();
  }
  const cityName = () => E.PRESTIGE.cityNames[Math.min(S.prestiges, E.PRESTIGE.cityNames.length - 1)] + (S.prestiges >= E.PRESTIGE.cityNames.length ? " " + (S.prestiges - E.PRESTIGE.cityNames.length + 2) : "");
  function applyCity() {
    $("#cityName").textContent = cityName();
    document.body.style.setProperty("--tint", CITY_TINTS[S.prestiges % CITY_TINTS.length]);
    $("#skyline").innerHTML = skylineSVG(S.prestiges);
    if (AU) AU.setCity(S.prestiges);
  }

  // ================================================================ loop
  function frame() {
    const t = now();
    let dt = (t - rt.lastWall) / 1000;
    rt.lastWall = t;
    if (dt > 5) { handleAway(dt, false); dt = 0; }
    if (dt > 0) step(dt);
    tweenWallet(dt);
    drawLanes();
    if (t - rt.lastUi > 120) { rt.lastUi = t; updateUi(); }
    if (t - rt.lastSave > 3000) { rt.lastSave = t; saveLocal(); }
    if (t - rt.lastCloud > 30000) { rt.lastCloud = t; pushCloud(); }
    if (t - rt.lastCheck > 1000) { rt.lastCheck = t; periodic(t); }
    requestAnimationFrame(frame);
  }
  function periodic(t) {
    musicIntensity();
    storyCheck();
    if (t > rt.goldenAt) { rt.goldenAt = t + (E.GOLDEN.minDelay + Math.random() * (E.GOLDEN.maxDelay - E.GOLDEN.minDelay)) * 1000 * goldenFactor(); spawnGolden(); }
    if (!rt.cat && t > rt.catAt) { rt.catAt = t + 60000; spawnCat(); }
    if (rt.cat && t > rt.cat.until) catLeave(false);
    if (t > rt.letterAt) { rt.letterAt = t + (E.LETTERS_CFG.minDelay + Math.random() * (E.LETTERS_CFG.maxDelay - E.LETTERS_CFG.minDelay)) * 1000; newLetter(); }
    if (S.pauseReminder && t - rt.sessionStart > 45 * 60000 && $("#modal").hidden && !rt.dlg) {
      rt.sessionStart = t;
      openModal(`<div class="hero">${pigeonSVG(STAR_LOOKS.gerard, null, { sleepy: true })}</div><h2>Pause goûter !</h2><p style="text-align:center">${C.PAUSE_TEXT}</p><div class="btns"><button class="btn btn-buy" data-close>D'accord</button></div>`);
    }
    if (rt.tab === "crew") refreshTab();
  }
  function step(dt) {
    E.ROUTES.forEach((r, i) => {
      if (S.lv[r.id] <= 0) return;
      if (rt.cat && rt.cat.route === r.id && !guardian()) return; // Moustache naps on the lane
      if (S.mgr[r.id] && !rt.running[r.id]) { rt.running[r.id] = true; rt.stamped[r.id] = false; }
      if (!rt.running[r.id]) return;
      rt.prog[r.id] += dt / effTime(r);
      if (rt.prog[r.id] >= 1) {
        const n = S.mgr[r.id] ? Math.floor(rt.prog[r.id]) : 1;
        complete(r, i, n);
        if (S.mgr[r.id]) rt.prog[r.id] -= n; else { rt.prog[r.id] = 0; rt.running[r.id] = false; }
      }
    });
  }
  function handleAway(seconds, fromSave) {
    const gain = E.offlineEarnings(seconds, offlineRate(), offlineHours());
    if (seconds > 300) rt.sessionStart = now();
    if (gain <= 0) return;
    if ((seconds < 60 || !$("#modal").hidden) && !fromSave) { earn(gain); if (seconds >= 60) toast(`Pendant ton absence : +${fmt(gain)} pièces`); return; }
    const capped = seconds > offlineHours() * 3600;
    openModal(`<div class="hero">${raysSVG()}${pigeonSVG(skinLook(), "box", { flying: true })}</div><h2>Bon retour !</h2>
      <p style="text-align:center">${pick(C.OFFLINE_JOKES)}<br>Absence : ${E.formatDuration(Math.min(seconds, offlineHours() * 3600))}${capped ? " (maximum atteint)" : ""}</p>
      <div class="row" style="justify-content:center"><svg width="38" height="38" viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="big-stat num">+${fmt(gain)}</span></div>
      <div class="btns"><button class="btn btn-ghost" id="offOk">Récupérer</button>${adButton("offAd", "×2")}</div>`, false);
    $("#offOk").addEventListener("click", () => { earn(gain); closeModal(); coinFly($("#wallet"), 8); sfx("cash"); });
    $("#offAd").addEventListener("click", () => watchAd("offline_x2", () => { earn(gain * 2); closeModal(); toast(`+${fmt(gain * 2)} pièces`); burstAt(null, 60); sfx("cash"); }));
  }

  // ================================================================ art
  const PARCELS = {
    letter: `<rect x="20" y="46" width="15" height="10" rx="2" fill="#fff" ${O}/><path d="M20.5 46.5 27.5 52l7-5.5" fill="none" ${O}/>`,
    card: `<rect x="19" y="46" width="17" height="11" rx="2" fill="#FFF4DA" ${O}/><rect x="29.5" y="47.5" width="5" height="5" fill="#FF5A4E" ${O}/>`,
    box: `<rect x="19" y="45" width="16" height="12" rx="2" fill="#D9A066" ${O}/><path d="M27 45v12" stroke="#FFE7B8" stroke-width="2.4"/>`,
    pizza: `<path d="M18 46h19l-9.5 12z" fill="#FFC93C" ${O}/><circle cx="24" cy="48.5" r="1.8" fill="#E23D2E"/><circle cx="30" cy="50.5" r="1.8" fill="#E23D2E"/>`,
    flower: `<path d="M27 47v10" stroke="#16A383" stroke-width="2"/><circle cx="27" cy="47" r="3.4" fill="#FF8FB1" ${O}/><circle cx="22.5" cy="49.5" r="3" fill="#FFC93C" ${O}/><circle cx="31.5" cy="49.5" r="3" fill="#A27BFF" ${O}/>`,
    gem: `<path d="M21 48l4-3.5h5l4 3.5-6.5 9z" fill="#7FD3FF" ${O}/>`,
  };
  const ACC = {
    cap: `<path d="M33 15Q36 4 46 4q8 1 9 9l6 2q-13 2-28 0z" fill="#2D6BFF" ${O}/>`,
    gog: `<path d="M33 15 56 13" stroke="#5A3B00" stroke-width="3"/><circle cx="47.5" cy="17.5" r="5.4" fill="#BFE7FF" fill-opacity=".55" ${O}/>`,
    crown: `<path d="M37 11 38 2l4 5 3-7 3 7 4-5 1 9z" fill="#FFC93C" ${O}/>`,
    scarf: `<path d="M34 26q10 7 20 0l1 4q-11 8-22 0zM37 30l-3 11 6-2z" fill="#FF5A4E" ${O}/>`,
    nightcap: `<path d="M34 13Q38 0 52 4q8 4 10 14l-6-6q-8-3-22 1z" fill="#6C8CFF" ${O}/><circle cx="62" cy="18" r="3.4" fill="#fff" ${O}/>`,
    bow: `<path d="M38 8l-7-5v10zM38 8l7-5v10z" fill="#FF5A9E" ${O}/><circle cx="38" cy="8" r="2.6" fill="#FF5A9E" ${O}/>`,
    band: `<path d="M33.5 14q10.5-5 21 -1l.3 4q-10.8-4-21.4 1z" fill="#FF5A4E" ${O}/>`,
    propeller: `<path d="M36 12q8-8 16 0z" fill="#2DD4A7" ${O}/><path d="M44 8V3" stroke="${LINE}" stroke-width="2"/><ellipse class="prop" cx="44" cy="3" rx="7" ry="2" fill="#FFC93C" ${O}/>`,
    glasses: `<circle cx="47.5" cy="18" r="5.6" fill="none" stroke="${LINE}" stroke-width="2"/><path d="M42 17l-7-2" stroke="${LINE}" stroke-width="2"/>`,
    shawl: `<path d="M18 26q12 14 28 2l-2 8q-14 10-27-3z" fill="#B46BD6" ${O}/>`,
    balls: `<circle cx="35" cy="5" r="3" fill="#FF5A4E" ${O}/><circle cx="44" cy="2.5" r="3" fill="#2DD4A7" ${O}/><circle cx="53" cy="5" r="3" fill="#FFC93C" ${O}/>`,
    note: `<path d="M59 2v9" stroke="${LINE}" stroke-width="2"/><ellipse cx="57" cy="11" rx="3" ry="2.2" fill="${LINE}"/><path d="M59 2q4 1 4 4" fill="none" stroke="${LINE}" stroke-width="2"/>`,
    mortarboard: `<path d="M32 9 45 4l13 5-13 4z" fill="${LINE}"/><path d="M38 11v3h14v-3" fill="${LINE}"/><path d="M58 9v7" stroke="#FFC93C" stroke-width="2"/>`,
    mask: `<path d="M33.5 14q11.5-3 22 0v7q-10.5-3-22 1z" fill="${LINE}"/><path d="M34 16l-7-3M34 19l-7 2" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>`,
    captain: `<path d="M33 14Q36 3 47 3q9 1 9 10z" fill="#fff" ${O}/><path d="M31 14h27" stroke="${LINE}" stroke-width="3.5" stroke-linecap="round"/><circle cx="45" cy="8" r="2.2" fill="#FFC93C" ${O}/>`,
    tiara: `<path d="M37 10l2-6 3 4 3-6 3 6 3-4 2 6z" fill="#FFC93C" ${O}/><circle cx="45" cy="6" r="1.6" fill="#FF5A9E"/>`,
    postcap: `<path d="M33 15Q35 4 46 4q9 1 9 9l6 2q-14 2-28 0z" fill="#FF5A4E" ${O}/><circle cx="45.5" cy="9.5" r="2.4" fill="#FFC93C" ${O}/>`,
    satchel: `<path d="M20 22l17 18" stroke="#8B4A2B" stroke-width="3"/><rect x="31" y="35" width="13" height="10" rx="2.5" fill="#E0503A" ${O}/><path d="M31 38.5h13" stroke="${LINE}" stroke-width="1.2"/>`,
    oldcap: `<path d="M33 15Q35 4 46 4q9 1 9 9l6 2q-14 2-28 0z" fill="#3E5BA9" ${O}/><path d="M42 8h7" stroke="#FFC93C" stroke-width="2"/>`,
    mustache: `<path d="M53 24q4 4 9 1-3 5-9 2-5 3-9-2 5 3 9-1z" fill="#fff" ${O}/>`,
    helmet: `<path d="M32.5 19Q33 6 46 6q10 1 10 10l-8 1q-8-1-15.5 2z" fill="#E0503A" ${O}/><path d="M38 9q8-2 15 1" stroke="#fff" stroke-width="2.5" fill="none"/>`,
  };
  function pigeonSVG(look, parcel, opts) {
    opts = opts || {};
    const l = look || SKINS[0].look;
    const acc = l.acc || [];
    const mood = opts.sleepy ? "sleepy" : opts.mood;
    const eye = mood === "sleepy" ? `<path d="M43.5 18.5q4 3 8 0" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>`
      : mood === "happy" ? `<path d="M43.5 19q4-5 8 0" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/>`
      : mood === "surprised" ? `<ellipse cx="47.5" cy="17" rx="5" ry="6.2" fill="#fff" ${O}/><circle cx="48.2" cy="17.4" r="1.8" fill="${LINE}"/><path d="M43 8.5q4.5-3 9 0" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>`
      : `<ellipse cx="47.5" cy="17.5" rx="4.4" ry="5" fill="#fff" ${O}/><circle cx="48.6" cy="18.2" r="2.4" fill="${LINE}"/><circle cx="49.4" cy="17" r=".9" fill="#fff"/>`
        + (mood === "sad" ? `<path d="M43 10.5l9 2.6" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/><path d="M51 23.5q1.6 3 0 4.4-1.6-1.4 0-4.4z" fill="#7FD3FF" stroke="${LINE}" stroke-width=".8"/>` : "");
    const head = acc.filter((a) => !["mask", "scarf", "shawl", "satchel"].includes(a)).map((a) => ACC[a] || "").join("");
    const w = opts.w ? ` width="${opts.w}"` : "";
    return `<svg class="pigeon${opts.flying ? " flying" : ""}${opts.cls ? " " + opts.cls : ""}"${w} viewBox="0 0 64 60" aria-hidden="true"><g class="body-g"${l.big ? ' transform="translate(-3 -3) scale(1.1)"' : ""}>
      <path d="M12 30 2 24l2 12 9 2z" fill="${l.wing}" ${O}/>
      ${parcel ? PARCELS[parcel] || "" : ""}
      <path d="M24 43l-1 4M31 44l1 4" stroke="#FFA62B" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="28" cy="32" rx="17" ry="13" fill="${l.body}" ${O}/>
      <ellipse cx="32" cy="37" rx="10" ry="7" fill="${l.belly}"/>
      ${acc.includes("shawl") ? ACC.shawl : ""}
      <circle cx="44" cy="20" r="11" fill="${l.body}" ${O}/>
      ${acc.includes("scarf") ? ACC.scarf : ""}${acc.includes("satchel") ? ACC.satchel : ""}
      <ellipse cx="49" cy="24.5" rx="3" ry="1.8" fill="#FF8FB1" opacity=".85"/>
      <path d="M54 18l8 3-8 3.5z" fill="#FFA62B" ${O}/>
      ${acc.includes("mask") ? ACC.mask : ""}${eye}${head}
      <path class="wing" d="M16 30q8-18 24-6-10 12-24 6z" fill="${l.wing}" ${O}/>
    </g></svg>`;
  }
  function loftSVG(i, tier) {
    const [c, d] = ROUTE_COLORS[i];
    const floors = 1 + (tier >= 2 ? 1 : 0) + (tier >= 5 ? 1 : 0);
    const base = 66, top = base - 22 - (floors - 1) * 14;
    let s = `<svg class="loft" viewBox="0 0 76 76" aria-hidden="true"><ellipse cx="38" cy="70" rx="28" ry="4.5" fill="var(--ground)"/>`;
    s += `<rect x="14" y="${top}" width="48" height="${base - top}" rx="6" fill="${c}" stroke="${LINE}" stroke-width="2.6"/>`;
    for (let f = 0; f < floors; f++) {
      const y = base - 14 - f * 14 - (f > 0 ? 2 : 0);
      const holes = f === 0 ? [22, 54] : tier >= 3 ? [24, 38, 52] : [30, 46];
      holes.forEach((x, k) => {
        s += `<circle cx="${x}" cy="${y}" r="4.6" fill="${LINE}"/>`;
        if (tier >= 1 && (k + f) % 2 === 0) s += `<circle cx="${x}" cy="${y - 1}" r="3" fill="#C8D0E0"/><circle cx="${x + 1}" cy="${y - 2}" r=".9" fill="${LINE}"/><path d="M${x + 2.6} ${y - 1}l2 .8-2 .8z" fill="#FFA62B"/>`;
        s += `<path d="M${x - 5.5} ${y + 5}h11" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`;
      });
      if (f > 0) s += `<path d="M14 ${base - 22 - (f - 1) * 14}h48" stroke="${LINE}" stroke-width="2"/>`;
    }
    s += `<path d="M31 ${base}v-8a7 7 0 0 1 14 0v8z" fill="${d}" stroke="${LINE}" stroke-width="2.4"/><circle cx="41" cy="${base - 5}" r="1.2" fill="${LINE}"/>`;
    const roof = tier >= 4 ? "#FFC93C" : d;
    s += `<path d="M7 ${top + 4} 38 ${top - 17} 69 ${top + 4}z" fill="${roof}" stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round"/>`;
    s += `<path d="M20 ${top - 4}l4 6M32 ${top - 12}l4 8M46 ${top - 10}l4 8M56 ${top - 2}l3 5" stroke="${LINE}" stroke-width="1.4" opacity=".45"/>`;
    if (tier >= 1) s += `<path d="M38 ${top - 17}v-12" stroke="${LINE}" stroke-width="2"/><path class="flagw" d="M38 ${top - 29}l13 4-13 4z" fill="#FFC93C" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`;
    if (tier >= 3) s += `<circle cx="38" cy="${top - 5}" r="4" fill="#fff" stroke="${LINE}" stroke-width="1.8"/><path d="M38 ${top - 7.5}v2.5l1.8 1" stroke="${LINE}" stroke-width="1.2" fill="none"/>`;
    if (tier >= 6) for (const [x, y] of [[6, top - 10], [70, top - 4], [64, top - 20]]) s += `<path d="M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#FFC93C" stroke="${LINE}" stroke-width="1"/>`;
    if (tier >= 7) { s += `<path d="M14 ${base - 23}q24 8 48 0" fill="none" stroke="${LINE}" stroke-width="1.2"/>`; for (let x = 18; x <= 58; x += 8) s += `<circle cx="${x}" cy="${base - 21 + (x === 38 ? 2.5 : x === 30 || x === 46 ? 1.8 : 0.8)}" r="2" fill="${x % 16 === 2 ? "#FFC93C" : "#FF5A9E"}" stroke="${LINE}" stroke-width=".8"/>`; }
    if (tier >= 8) s += `<path d="M30 ${top - 30}l2-7 4 4 2-6 2 6 4-4 2 7z" fill="#FFC93C" stroke="${LINE}" stroke-width="1.6"/>`;
    return s + "</svg>";
  }
  function eggSVG(type, crack) {
    const col = { common: ["#FFF6E0", "#6EC6FF"], rare: ["#EADFFF", "#FF8FB1"], legendary: ["#FFD54A", "#FFFFFF"] }[type];
    let s = `<svg class="egg" viewBox="0 0 40 50" aria-hidden="true"><path d="M20 3c11 0 17 19 17 29s-8 16-17 16S3 42 3 32 9 3 20 3z" fill="${col[0]}" stroke="${LINE}" stroke-width="2.4"/>`;
    s += type === "rare" ? `<path d="M12 18l1.5 3 3 .4-2.2 2 .6 3-2.9-1.5-2.8 1.5.5-3-2.2-2 3-.4zM27 30l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="${col[1]}" stroke="${LINE}" stroke-width=".8"/>`
      : type === "legendary" ? `<path d="M14 16l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM27 28l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#fff"/>`
      : `<circle cx="14" cy="20" r="3" fill="${col[1]}"/><circle cx="26" cy="30" r="4" fill="${col[1]}"/><circle cx="15" cy="37" r="2.2" fill="${col[1]}"/>`;
    if (crack >= 1) s += `<path d="M8 27l5-4 4 5 5-5 4 4 5-3" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>`;
    if (crack >= 2) s += `<path d="M10 36l6 2 5-4 6 3 4-2" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>`;
    return s + "</svg>";
  }
  function catSVG(awake) {
    return `<svg viewBox="0 0 80 56" aria-hidden="true">
      <path class="tail" d="M60 42q16-4 12-20" fill="none" stroke="${LINE}" stroke-width="8" stroke-linecap="round"/><path class="tail" d="M60 42q16-4 12-20" fill="none" stroke="#FFA94D" stroke-width="4.5" stroke-linecap="round"/>
      <ellipse cx="44" cy="40" rx="22" ry="12" fill="#FFA94D" stroke="${LINE}" stroke-width="2.4"/>
      <path d="M40 29v8M48 29v9M56 32v7" stroke="#E07B1F" stroke-width="3" stroke-linecap="round"/>
      <path d="M9 23 10 9l9 9zM24 18l7-9 2 13z" fill="#FFA94D" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="20" cy="31" r="13" fill="#FFA94D" stroke="${LINE}" stroke-width="2.4"/>
      ${awake ? `<ellipse cx="15" cy="29" rx="3" ry="3.6" fill="#C8F07A" stroke="${LINE}" stroke-width="1.4"/><ellipse cx="26" cy="29" rx="3" ry="3.6" fill="#C8F07A" stroke="${LINE}" stroke-width="1.4"/><path d="M15 26.5v5M26 26.5v5" stroke="${LINE}" stroke-width="1.6"/>` : `<path d="M12 30q3-3 6 0M23 30q3-3 6 0" fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round"/>`}
      <path d="M19.5 34.5l1.5 1.6 1.6-1.6z" fill="#FF8FB1" stroke="${LINE}" stroke-width="1"/>
      <path d="M21 36.5q-2 3-4 1M21 36.5q2 3 4 1" fill="none" stroke="${LINE}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M8 34H1M8 37l-6 2M33 34h7M33 37l6 2" stroke="${LINE}" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="30" cy="50" rx="6" ry="3.5" fill="#FFA94D" stroke="${LINE}" stroke-width="2"/>
      ${awake ? `<path d="M58 6l2-4 2 4-2 3z" fill="#FFC93C" stroke="${LINE}"/>` : '<text x="56" y="14" font-family="Lilita One, sans-serif" font-size="11" fill="#8B5CF6">zzz</text>'}</svg>`;
  }
  function raysSVG() {
    let s = '<svg class="rays" viewBox="0 0 200 200" aria-hidden="true">';
    for (let k = 0; k < 12; k++) s += `<path d="M100 100 L${100 + 120 * Math.cos(k * Math.PI / 6)} ${100 + 120 * Math.sin(k * Math.PI / 6)} L${100 + 120 * Math.cos(k * Math.PI / 6 + 0.22)} ${100 + 120 * Math.sin(k * Math.PI / 6 + 0.22)}z" fill="#FFC93C"/>`;
    return s + "</svg>";
  }
  function skylineSVG(level) {
    const n = 5 + Math.min(14, level * 2);
    let seed = 7, s = '<svg viewBox="0 0 400 64" preserveAspectRatio="xMidYMax slice" aria-hidden="true">';
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const cols = ["#BFE3FF", "#CFC2EE", "#FFD9CC", "#C8F2E4", "#FFE7A8"];
    for (let k = 0; k < n; k++) {
      const w = 22 + rnd() * 26, x = (k / n) * 400 + rnd() * 10 - 6, h = 18 + rnd() * (20 + level * 4);
      s += `<rect x="${x.toFixed(1)}" y="${(64 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${cols[k % cols.length]}" stroke="${LINE}" stroke-width="2" opacity=".85"/>`;
      for (let wy = 64 - h + 6; wy < 58; wy += 10) s += `<rect x="${(x + 6).toFixed(1)}" y="${wy.toFixed(1)}" width="5" height="5" fill="${LINE}" opacity=".25"/>`;
    }
    return s + "</svg>";
  }
  const DEST = `<svg class="dest" viewBox="0 0 32 32" aria-hidden="true"><path d="M15 21v10" stroke="${LINE}" stroke-width="3"/><rect x="3" y="9" width="22" height="13" rx="6.5" fill="#4D8DFF" stroke="${LINE}" stroke-width="2.2"/><path d="M8 13h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/><g class="flag"><path d="M24 15V5" stroke="${LINE}" stroke-width="2"/><path d="M24 5h6v4h-6z" fill="#FF5A4E" stroke="${LINE}" stroke-width="1.6"/></g></svg>`;
  const skinLook = () => (SKINS.find((k) => k.id === S.skin) || SKINS[0]).look;
  function applySkin() { buildRoutes(); }

  // ================================================================ fx: confetti, coin flights, wallet tween
  const fx = { canvas: null, ctx: null, parts: [], running: false };
  function burstXY(x, y, n, palette) {
    if (reducedMotion) return;
    const app = $("#app").getBoundingClientRect();
    if (!fx.canvas) { fx.canvas = $("#fx"); fx.ctx = fx.canvas.getContext("2d"); }
    const dpr = window.devicePixelRatio || 1;
    if (fx.canvas.width !== Math.round(app.width * dpr)) { fx.canvas.width = Math.round(app.width * dpr); fx.canvas.height = Math.round(app.height * dpr); }
    const cols = palette || ["#FF5A4E", "#FFC93C", "#2DD4A7", "#8B5CF6", "#FF8FB1", "#4D8DFF"];
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 6;
      fx.parts.push({ x: (x - app.left) * dpr, y: (y - app.top) * dpr, vx: Math.cos(a) * v * dpr, vy: (Math.sin(a) * v - 5) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, w: (5 + Math.random() * 5) * dpr, h: (3 + Math.random() * 3) * dpr, c: pick(cols), life: 70 + Math.random() * 40 });
    }
    if (!fx.running) { fx.running = true; requestAnimationFrame(fxLoop); }
  }
  function burstAt(el, n) {
    if (!el) { const a = $("#app").getBoundingClientRect(); burstXY(a.left + a.width / 2, a.top + a.height * 0.35, n); return; }
    const r = el.getBoundingClientRect(); burstXY(r.left + r.width / 2, r.top + r.height / 2, n);
  }
  function fxLoop() {
    const c = fx.ctx; c.clearRect(0, 0, fx.canvas.width, fx.canvas.height);
    fx.parts = fx.parts.filter((p) => p.life > 0);
    for (const p of fx.parts) {
      p.vy += 0.25 * (window.devicePixelRatio || 1); p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.min(1, p.life / 30); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
    }
    if (fx.parts.length) requestAnimationFrame(fxLoop); else { fx.running = false; c.clearRect(0, 0, fx.canvas.width, fx.canvas.height); }
  }
  function coinFlyXY(x, y, n) {
    if (reducedMotion) return;
    const app = $("#app").getBoundingClientRect(), w = $("#wallet svg").getBoundingClientRect();
    const tx = w.left + w.width / 2 - app.left, ty = w.top + w.height / 2 - app.top;
    for (let k = 0; k < n; k++) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      el.setAttribute("viewBox", "0 0 24 24"); el.setAttribute("class", "fly-coin"); el.innerHTML = '<use href="#i-coin"/>';
      const sx = x - app.left - 13 + (Math.random() - .5) * 30, sy = y - app.top - 13 + (Math.random() - .5) * 20;
      el.style.left = sx + "px"; el.style.top = sy + "px";
      $("#app").appendChild(el);
      const dx = tx - sx - 13, dy = ty - sy - 13;
      const anim = el.animate([{ transform: "translate(0,0) scale(.5)" }, { transform: `translate(${dx * 0.3 + (Math.random() - .5) * 60}px, ${dy * 0.3 - 40}px) scale(1.15)` }, { transform: `translate(${dx}px, ${dy}px) scale(.7)` }],
        { duration: 650 + k * 50, easing: "cubic-bezier(.5,0,.6,1)" });
      anim.onfinish = () => { el.remove(); const wl = $("#wallet"); wl.classList.remove("bump"); void wl.offsetWidth; wl.classList.add("bump"); };
    }
  }
  function coinFly(el, n) { if (!el) return; const r = el.getBoundingClientRect(); coinFlyXY(r.left + r.width / 2, r.top + r.height / 2, n); }
  function tweenWallet(dt) {
    if (S.coins < rt.shown || dt <= 0 && rt.shown === 0) rt.shown = S.coins;
    else rt.shown += (S.coins - rt.shown) * Math.min(1, dt * 9);
    if (S.coins - rt.shown < 0.5) rt.shown = S.coins;
    const txt = fmt(rt.shown);
    if (rt.walletTxt !== txt) { rt.walletTxt = txt; $("#coins").textContent = txt; }
  }
  function stampFx(c, text, miss) {
    if (!c) return;
    const s = document.createElement("span"); s.className = "stamp" + (miss ? " miss" : ""); s.textContent = text;
    s.addEventListener("animationend", () => s.remove()); c.lane.appendChild(s);
  }
  function coinPop(c, amount, big) {
    const s = document.createElement("span"); s.className = "coin-pop num" + (big ? " big" : ""); s.textContent = "+" + fmt(amount);
    s.addEventListener("animationend", () => s.remove()); c.lane.appendChild(s);
  }

  // ================================================================ route cards
  const cards = {};
  function buildRoutes() {
    const host = $("#routes"); host.innerHTML = "";
    for (const k in cards) delete cards[k];
    E.ROUTES.forEach((r, i) => {
      const el = document.createElement("article");
      el.className = "route card"; el.dataset.route = r.id; el.style.setProperty("--rc", ROUTE_COLORS[i][0]);
      el.innerHTML = `<div class="art"><div class="loft-host"></div><button class="crew-btn" aria-label="Pigeon star de ${r.name}"></button></div>
        <div class="head"><span class="name">${r.name}</span><span class="lvl num"></span></div>
        <div class="lane" role="button" tabindex="0" aria-label="Piste ${r.name}">${pigeonSVG(skinLook(), r.parcel)}${DEST}<div class="hint"></div></div>
        <div class="ms"><span class="ms-t num"></span><div class="bar"><i></i></div><span class="gain num"></span></div>
        <div class="actions"><button class="btn btn-mgr" data-act="hire"></button><button class="btn btn-buy" data-act="buy"></button></div>`;
      const c = { el, art: $(".art", el), loft: $(".loft-host", el), crewBtn: $(".crew-btn", el), lvl: $(".lvl", el), gain: $(".gain", el), lane: $(".lane", el),
        pigeon: $(".lane .pigeon", el), hint: $(".hint", el), msT: $(".ms-t", el), msBar: $(".bar i", el), actions: $(".actions", el),
        mgr: $('[data-act="hire"]', el), buy: $('[data-act="buy"]', el), tier: -1, crewId: undefined };
      c.lane.addEventListener("click", () => laneTap(r.id));
      c.loft.addEventListener("click", () => laneTap(r.id));
      c.lane.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); laneTap(r.id); } });
      c.crewBtn.addEventListener("click", (e) => { e.stopPropagation(); openPick(r.id); });
      c.buy.addEventListener("click", () => buy(r.id));
      c.mgr.addEventListener("click", () => hire(r.id));
      cards[r.id] = c; host.appendChild(el);
    });
    if (rt.cat) drawCat();
    refreshCards(true);
  }
  function refreshCards() {
    const ctx = ctxFull();
    let prevUnlocked = true;
    const anyOwned = Object.keys(S.owned).length > 0;
    E.ROUTES.forEach((r, i) => {
      const c = cards[r.id]; if (!c) return;
      const lv = S.lv[r.id], locked = lv === 0;
      c.el.hidden = locked && !prevUnlocked;
      prevUnlocked = !locked;
      c.el.classList.toggle("locked", locked);
      const tier = E.milestonesReached(lv);
      if (tier !== c.tier) { const first = c.tier === -1; c.tier = tier; c.loft.innerHTML = loftSVG(i, tier); if (!first && !reducedMotion) { c.art.classList.remove("pop"); void c.art.offsetWidth; c.art.classList.add("pop"); } }
      const cid = S.crew[r.id] || "";
      if (c.crewId !== cid + "|" + anyOwned + locked) {
        c.crewId = cid + "|" + anyOwned + locked;
        c.crewBtn.hidden = locked || (!cid && !anyOwned);
        c.crewBtn.classList.toggle("empty", !cid);
        c.crewBtn.innerHTML = cid ? pigeonSVG(STAR_LOOKS[cid], null) : "+";
        c.pigeon.outerHTML = pigeonSVG(cid ? STAR_LOOKS[cid] : skinLook(), r.parcel, { flying: c._fly });
        c.pigeon = $(".lane .pigeon", c.el); c._fly = undefined;
      }
      c.lvl.textContent = locked ? "à ouvrir" : "niv " + lv;
      const et = effTime(r);
      const g = locked ? "" : `+${fmt(deliveryValue(r, ctx))} / ${String(et >= 10 ? Math.round(et) : Math.round(et * 10) / 10).replace(".", ",")} s`;
      if (c.gain._g !== g) { c.gain.textContent = g; c.gain._g = g; }
      const nm = E.nextMilestone(lv);
      if (locked) { c.msT.textContent = `Rapporte ${fmt(r.revenue)} toutes les ${r.time} s`; c.msBar.style.setProperty("--f", 0); }
      else if (nm) { const prevM = [0, ...E.MILESTONES].filter((m) => m <= lv).pop(); c.msT.textContent = `Niv ${nm} → ×2${E.MILESTONE_EGGS[nm] && !S.dropped[r.id + ":" + nm] ? " + œuf" : ""}`; c.msBar.style.setProperty("--f", ((lv - prevM) / (nm - prevM)).toFixed(3)); }
      else { c.msT.textContent = "Pigeonnier au maximum !"; c.msBar.style.setProperty("--f", 1); }
      const { count, cost } = locked ? { count: 1, cost: E.levelCost(r, 0) } : buyCount(r);
      const html = `${locked ? "Ouvrir" : `+${count} niveau${count > 1 ? "x" : ""}`}<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="num">${fmt(cost)}</span></small>`;
      if (c.buy._html !== html) { c.buy.innerHTML = html; c.buy._html = html; }
      c.buy.disabled = cost > S.coins;
      c.buy.classList.toggle("ready", !c.buy.disabled && (locked || nm && lv + count >= nm));
      if (S.mgr[r.id]) {
        if (c.mgr.tagName === "BUTTON") { const b = document.createElement("div"); b.className = "mgr-badge"; b.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-cap"/></svg>Chef au travail'; c.mgr.replaceWith(b); c.mgr = b; }
      } else {
        if (c.mgr.tagName !== "BUTTON") { const b = document.createElement("button"); b.className = "btn btn-mgr"; b.addEventListener("click", () => hire(r.id)); c.mgr.replaceWith(b); c.mgr = b; }
        const mh = `Engager un chef<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="num">${fmt(r.manager)}</span></small>`;
        if (c.mgr._html !== mh) { c.mgr.innerHTML = mh; c.mgr._html = mh; }
        c.mgr.disabled = locked || S.coins < r.manager; c.mgr.hidden = locked;
        c.mgr.classList.toggle("ready", !c.mgr.disabled);
      }
      let hint = "";
      if (!locked) {
        if (rt.cat && rt.cat.route === r.id) hint = "";
        else if (!isAwake(r.id)) hint = "<span>Gérard ronfle… <b>touche pour le réveiller</b></span>";
        else if (!S.mgr[r.id] && !rt.running[r.id]) hint = "<span>Touche pour <b>envoyer</b></span>";
      }
      if (c.hint._h !== hint) {
        c.hint.innerHTML = hint; c.hint._h = hint;
        const asleep = !isAwake(r.id);
        if (asleep && c._asleep === false) sfx("snore");
        c._asleep = asleep;
        const z = $(".zzz", c.lane);
        if (!isAwake(r.id) && !z) { const s = document.createElement("span"); s.className = "zzz"; s.textContent = "Zzz"; c.lane.appendChild(s); }
        if (isAwake(r.id) && z) z.remove();
      }
    });
  }
  function drawLanes() {
    if (rt.tab !== "routes") return;
    const boostNow = hasBoost();
    for (const r of E.ROUTES) {
      const c = cards[r.id]; if (!c || c.el.hidden) continue;
      if (!c.laneW) c.laneW = c.lane.clientWidth;
      const fly = (rt.running[r.id] || S.mgr[r.id]) && isAwake(r.id) && !(rt.cat && rt.cat.route === r.id && !guardian());
      const p = rt.running[r.id] || S.mgr[r.id] ? Math.min(rt.prog[r.id], 1) : 0;
      c.pigeon.style.setProperty("--x", (p * Math.max(0, c.laneW - 86)).toFixed(1) + "px");
      c.pigeon.style.setProperty("--y", (fly ? -Math.sin(p * Math.PI) * 7 : 0).toFixed(1) + "px");
      const boosted = boostNow && fly;
      if (c._boost !== boosted) { c._boost = boosted; c.lane.classList.toggle("boosted", boosted); }
      if (c._fly !== fly) { c._fly = fly; c.pigeon.classList.toggle("flying", fly); }
      const win = rt.running[r.id] && canStamp(r) && !rt.stamped[r.id] && p >= 1 - stampWindow(r);
      if (c._win !== win) { c._win = win; c.lane.classList.toggle("window", win); if (win && !S.tips.stamp && S.tutorial >= 5 && $("#modal").hidden) stampTip(r); }
    }
  }
  function stampTip() {
    firstTime("stamp", `<div class="hero">${raysSVG()}<svg viewBox="0 0 32 32" width="90" height="90">${DEST.replace(/<svg[^>]*>|<\/svg>/g, "")}</svg></div><h2>Tampon parfait !</h2><p>Quand la boîte aux lettres <b>brille</b>, touche la piste : la livraison rapporte <b>×${E.STAMP.mult}</b>. Enchaîne ${E.STAMP.comboEvery} tampons parfaits pour un <b>super combo</b>. Trop tôt, et le combo retombe à zéro !</p><div class="btns"><button class="btn btn-buy" data-close>Compris !</button></div>`);
  }
  window.addEventListener("resize", () => { for (const id in cards) cards[id].laneW = 0; });

  // ================================================================ HUD & tabs
  const TABS = ["routes", "upgrades", "crew", "empire", "shop"];
  function updateUi() {
    $("#rate").textContent = fmt(totalRate());
    $("#gems").textContent = fmt(S.gems);
    $("#level").textContent = S.level;
    $("#xpRing").setAttribute("stroke-dashoffset", (88 * (1 - Math.min(1, S.xp / E.xpForLevel(S.level)))).toFixed(1));
    const t = now();
    const pill = (id, until, txt) => { const el = $(id); el.hidden = until <= t; if (!el.hidden) el.textContent = `${txt} · ${E.formatDuration((until - t) / 1000)}`; };
    pill("#boostAd", S.adBoostUntil, `×${E.AD_BOOST.mult}`); pill("#boostGold", S.goldBoostUntil, `×${E.GOLDEN.boostMult}`); pill("#comboPill", S.comboBoostUntil, "Combo ×2");
    if (S.comboBoostUntil <= t && rt.combo >= 2) { $("#comboPill").hidden = false; $("#comboPill").textContent = `Combo ${rt.combo}`; }
    const lc = $("#letterChip"); lc.hidden = !S.lettersWaiting.length; $("#letterCount").textContent = S.lettersWaiting.length; lc.classList.toggle("bounce", S.lettersWaiting.length > 0);
    if (rt.tab === "routes") refreshCards(); else refreshTab();
    $("#dot-empire").hidden = !(activeQuests().some(questReady) || dailyInfo().can || prestigeGain() >= 3);
    $("#dot-upgrades").hidden = !E.UPGRADES.some((u) => !S.up[u.id] && S.coins >= u.cost);
    $("#dot-crew").hidden = !S.incubator.some(eggReady);
    if (S.tutorial > 0 && S.tutorial < 5) placeCoach();
    refreshStoryBar();
  }
  function switchTab(name) {
    const from = TABS.indexOf(rt.tab), to = TABS.indexOf(name);
    rt.tab = name;
    for (const b of document.querySelectorAll(".tabbar button")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
    for (const t of TABS) $("#tab-" + t).hidden = t !== name;
    const sec = $("#tab-" + name);
    if (!reducedMotion && from !== to) { sec.classList.remove("in-r", "in-l"); void sec.offsetWidth; sec.classList.add(to > from ? "in-r" : "in-l"); }
    $("#main").scrollTop = 0;
    if (name !== "routes") renderTab(); else { for (const id in cards) cards[id].laneW = 0; refreshCards(); }
    if (name === "empire" && S.tutorial === 4) setTutorial(5);
    sfx("tab");
  }
  function renderTab() {
    if (rt.tab === "upgrades") renderUpgrades();
    else if (rt.tab === "crew") renderCrew();
    else if (rt.tab === "empire") renderEmpire();
    else if (rt.tab === "shop") renderShop();
    else refreshCards();
  }
  function refreshTab() { // light refresh that keeps buttons in place, so taps are never lost
    const host = $("#tab-" + rt.tab);
    for (const b of host.querySelectorAll("[data-cost]")) b.disabled = S.coins < Number(b.dataset.cost);
    for (const b of host.querySelectorAll("[data-gems]")) b.disabled = S.gems < Number(b.dataset.gems);
    for (const el of host.querySelectorAll("[data-quest]")) {
      const q = E.QUESTS.find((x) => x.id === el.dataset.quest); const [c, n] = questProgress(q);
      $(".bar i", el).style.setProperty("--f", Math.min(1, c / n).toFixed(3));
      $(".qv", el).textContent = `${fmt(Math.min(c, n))} / ${fmt(n)}`;
      $("button", el).disabled = c < n;
    }
    for (const el of host.querySelectorAll("[data-slot]")) {
      const x = S.incubator[+el.dataset.slot]; if (!x) continue;
      const ready = eggReady(x), left = (x.end - now()) / 1000, frac = 1 - Math.max(0, left) / ((x.end - x.start) / 1000 || 1);
      if (el._ready !== ready) { el._ready = ready; el.classList.toggle("ready", ready); for (const b of el.querySelectorAll(".wait")) b.hidden = ready; for (const b of el.querySelectorAll(".go")) b.hidden = !ready; }
      const crack = ready ? 2 : frac > 0.5 ? 1 : 0;
      if (el._crack !== crack) { if (el._crack !== undefined && crack > el._crack) sfx("crack"); el._crack = crack; $(".egg-host", el).innerHTML = eggSVG(x.type, crack); }
      $(".t", el).textContent = ready ? "Prêt à éclore !" : E.formatDuration(left);
    }
    const pg = host.querySelector("#prestigeGain"); if (pg) pg.textContent = "+" + prestigeGain();
  }

  function renderUpgrades() {
    const items = E.UPGRADES.map((u) => {
      const target = u.target === "all" ? "Toutes les routes" : routeById(u.target).name;
      const right = S.up[u.id] ? `<span class="done"><svg width="18" height="18" viewBox="0 0 24 24"><use href="#i-check"/></svg>Acquis</span>`
        : `<button class="btn btn-buy" data-up="${u.id}" data-cost="${u.cost}" ${S.coins < u.cost ? "disabled" : ""}>Acheter<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg>${fmt(u.cost)}</small></button>`;
      return `<div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-feather"/></svg></div><div class="grow"><div class="title">${u.name}</div><div class="sub">${target} : revenus ×${u.mult}</div></div>${right}</div>`;
    }).join("");
    $("#tab-upgrades").innerHTML = `<div class="card panel"><h2>Boosts</h2><p>Des achats uniques qui multiplient les revenus. Ils repartent à zéro quand tu déménages.</p></div><div class="card panel list">${items}</div>`;
    for (const b of $("#tab-upgrades").querySelectorAll("[data-up]")) b.addEventListener("click", () => buyUpgrade(b.dataset.up));
  }

  function renderCrew() {
    const slots = [];
    for (let i = 0; i < slotCount(); i++) {
      const x = S.incubator[i];
      if (!x) { slots.push(`<div class="slot"><div class="sub">Place libre</div><p class="note">Gagne des œufs aux paliers 25, 100 et 300, avec les objectifs, le coffre du jour et le courrier.</p></div>`); continue; }
      const eg = E.EGGS[x.type];
      slots.push(`<div class="slot" data-slot="${i}"><div class="egg-host">${eggSVG(x.type, 0)}</div><div class="title">${eg.name}</div><div class="sub t num"></div>
        <button class="btn btn-buy go" data-hatch="${i}" hidden>Faire éclore !</button>
        <button class="btn btn-sun wait" data-adhatch="${i}" ${!S.premium && adsLeft() <= 0 ? "disabled" : ""}>Éclore maintenant<small><svg viewBox="0 0 24 24"><use href="#i-play"/></svg>${S.premium ? "Premium" : "Pub"}</small></button>
        <button class="btn btn-grape wait" data-gemhatch="${i}" data-gems="${eg.gemSkip}" ${S.gems < eg.gemSkip ? "disabled" : ""}><span class="row" style="gap:4px"><svg width="15" height="15" viewBox="0 0 24 24"><use href="#i-gem"/></svg>${eg.gemSkip}</span></button></div>`);
    }
    const stored = S.eggs.length ? `<div class="eggs-row">${S.eggs.map((t) => eggSVG(t, 0)).join("")}</div>` : `<p class="note">Aucun œuf en attente.</p>`;
    const album = E.PIGEONS.map((p) => {
      const own = S.owned[p.id];
      if (!own) return `<div class="tile unknown">${pigeonSVG(STAR_LOOKS[p.id], null)}<div class="title">???</div><span class="rarity ${p.rarity}">${RARITY_FR[p.rarity]}</span></div>`;
      const where = crewOn(p.id);
      return `<div class="tile ${where ? "on" : ""}">${pigeonSVG(STAR_LOOKS[p.id], null, { flying: !!where })}<div class="title">${p.name}</div><div><span class="rarity ${p.rarity}">${RARITY_FR[p.rarity]}</span> <span class="stars">${"★".repeat(own)}</span></div>
        <div class="sub">${p.quirk}</div><div class="note">${where ? "Route : " + routeById(where).name : "Sur le banc"}</div><button class="btn btn-buy" data-assign="${p.id}">${where ? "Changer de route" : "Choisir sa route"}</button></div>`;
    }).join("");
    $("#tab-crew").innerHTML = `
      <div class="card panel"><h2>Couveuse</h2><div class="incubator">${slots.join("")}</div>
        <div class="row"><div class="grow"><div class="title">Œufs en attente (${S.eggs.length}/${E.INCUBATOR.maxStoredEggs})</div></div><button class="btn btn-ghost" id="oddsBtn" style="min-width:auto">Chances</button></div>${stored}
        ${S.level < E.INCUBATOR.bonusSlotLevel ? `<p class="note">Une 2e place se débloque au niveau ${E.INCUBATOR.bonusSlotLevel}.</p>` : ""}</div>
      <div class="card panel"><h2>Album des pigeons stars <span class="num" style="font-size:16px">${Object.keys(S.owned).length}/${E.PIGEONS.length}</span></h2><p>Un seul pigeon star par route. Les doublons ajoutent une étoile (jusqu'à 3) et renforcent le pouvoir.</p><div class="album">${album}</div></div>`;
    const host = $("#tab-crew");
    for (const b of host.querySelectorAll("[data-hatch]")) b.addEventListener("click", () => hatch(+b.dataset.hatch));
    for (const b of host.querySelectorAll("[data-adhatch]")) b.addEventListener("click", () => speedEgg(+b.dataset.adhatch, "ad"));
    for (const b of host.querySelectorAll("[data-gemhatch]")) b.addEventListener("click", () => speedEgg(+b.dataset.gemhatch, "gems"));
    for (const b of host.querySelectorAll("[data-assign]")) b.addEventListener("click", () => openAssign(b.dataset.assign));
    $("#oddsBtn").addEventListener("click", () => openModal(`<h2>Chances d'éclosion</h2><div class="list">${Object.keys(E.EGGS).map((t) => `<div class="row"><div style="width:40px">${eggSVG(t, 0)}</div><div class="grow"><div class="title">${E.EGGS[t].name} · ${E.EGGS[t].hatchMinutes >= 60 ? E.EGGS[t].hatchMinutes / 60 + " h" : E.EGGS[t].hatchMinutes + " min"}</div><div class="sub">${E.eggOddsText(t)}</div></div></div>`).join("")}</div><p class="note">Les œufs se gagnent uniquement en jouant : ils ne s'achètent jamais avec de l'argent.</p><div class="btns"><button class="btn btn-ghost" data-close>Fermer</button></div>`));
    refreshTab();
  }

  function renderEmpire() {
    const d = dailyInfo();
    const streak = E.DAILY.map((g, i) => `<div class="${i < d.shownStreak ? "got" : ""} ${d.can && i === d.next - 1 ? "today" : ""}">J${i + 1}<b class="num">${g}</b>${E.DAILY_EGGS[i + 1] ? `<span class="egg-mark">${eggSVG(E.DAILY_EGGS[i + 1], 0)}</span>` : ""}</div>`).join("");
    const quests = activeQuests().map((q) => {
      const [c, n] = questProgress(q);
      return `<div class="row" data-quest="${q.id}"><div class="grow"><div class="title">${q.text}</div><div class="row" style="gap:8px"><div class="bar"><i style="--f:${Math.min(1, c / n).toFixed(3)}"></i></div><span class="sub qv num">${fmt(Math.min(c, n))} / ${fmt(n)}</span></div></div>
        <button class="btn btn-sun" data-claim="${q.id}" ${c < n ? "disabled" : ""}>+${q.gems}${q.egg ? " + œuf" : ""}<small><svg viewBox="0 0 24 24"><use href="#i-gem"/></svg>Récupérer</small></button></div>`;
    }).join("") || `<p>Tous les objectifs sont réussis. Bravo, grand chef des pigeons !</p>`;
    const next = E.xpForLevel(S.level);
    $("#tab-empire").innerHTML = storyPanelHTML() + `
      <div class="card panel"><h2>Niveau ${S.level}</h2><p class="num">${fmt(S.xp)} / ${fmt(next)} XP · chaque niveau rapporte ${E.LEVELS.gemsPerLevel} gemmes</p><div class="bar"><i style="--f:${(S.xp / next).toFixed(3)};background:var(--grape)"></i></div></div>
      <div class="card panel"><h2>Coffre du jour</h2><p>Reviens chaque jour : la série monte jusqu'au jour 7, avec un œuf les jours 4 et 7.</p><div class="streak">${streak}</div>
        <div class="row"><button class="btn btn-buy grow" id="dailyBtn" ${d.can ? "" : "disabled"}>${d.can ? "Ouvrir le coffre" : "Reviens demain"}</button>${d.can ? adButton("dailyAd", "×2") : ""}</div></div>
      <div class="card panel"><h2>Objectifs</h2><div class="list">${quests}</div></div>
      <div class="card panel"><h2>Déménager : ${cityName()}</h2>
        <p>Pars vers une ville plus grande : tu repars de zéro, mais chaque plume d'or ajoute +${Math.round(E.PRESTIGE.bonusPerFeather * 100)} % à tous tes revenus, pour toujours. Tes pigeons stars te suivent !</p>
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-feather"/></svg></div><div class="grow"><div class="title num">${S.feathers} plume${S.feathers > 1 ? "s" : ""} · +${Math.round(S.feathers * E.PRESTIGE.bonusPerFeather * 100)} %</div><div class="sub">À gagner : <b id="prestigeGain" class="num">+${prestigeGain()}</b></div></div>
        <button class="btn btn-buy" id="prestigeBtn">Déménager</button></div></div>
      <div class="card panel"><h2>Statistiques</h2><p class="num">Pièces gagnées : ${fmt(S.earned)}<br>Tampons parfaits : ${S.stamps} · meilleur combo : ${S.bestCombo}<br>Pigeons dorés : ${S.golden} · chat chassé : ${S.cats} fois<br>Lettres lues : ${S.lettersRead} · œufs éclos : ${S.hatched}</p></div>`;
    const host = $("#tab-empire");
    for (const b of host.querySelectorAll("[data-claim]")) b.addEventListener("click", () => claimQuest(b.dataset.claim));
    const db = $("#dailyBtn"); if (db) db.addEventListener("click", () => claimDaily(false));
    const da = $("#dailyAd"); if (da) da.addEventListener("click", () => watchAd("daily_x2", () => claimDaily(true)));
    $("#prestigeBtn").addEventListener("click", confirmPrestige);
    for (const b of host.querySelectorAll("[data-replay]")) b.addEventListener("click", () => playScene(ST.SCENES.find((s) => s.id === b.dataset.replay), true));
  }
  function confirmPrestige() {
    const gain = prestigeGain();
    if (gain < 1) {
      openModal(`<h2>Pas encore !</h2><p style="text-align:center">Gagne au moins ${fmt(E.PRESTIGE.unit)} pièces dans cette ville pour obtenir ta première plume d'or.</p><div class="btns"><button class="btn btn-ghost" data-close>D'accord</button></div>`);
      return;
    }
    const nextCity = E.PRESTIGE.cityNames[Math.min(S.prestiges + 1, E.PRESTIGE.cityNames.length - 1)];
    const bonus = Math.floor(gain * E.ADS.prestigeMult);
    openModal(`<div class="hero">${raysSVG()}<svg viewBox="0 0 24 24" width="90" height="90" style="position:relative"><use href="#i-feather"/></svg></div><h2>Déménager vers ${nextCity} ?</h2>
      <p style="text-align:center">Tu gagnes <b>+${gain} plumes d'or</b> : revenus +${Math.round((S.feathers + gain) * E.PRESTIGE.bonusPerFeather * 100)} % pour toujours.</p>
      <p style="text-align:center">Tu repars avec la seule route Lettres. Tu gardes gemmes, niveau, skins, plumes et pigeons stars.</p>
      <div class="btns"><button class="btn btn-ghost" data-close>Rester</button><button class="btn btn-buy" id="goPrestige">Déménager</button></div>
      ${adButton("goPrestigeAd", `Déménager avec ${bonus} plumes`)}`);
    $("#goPrestige").addEventListener("click", () => doPrestige(1));
    $("#goPrestigeAd").addEventListener("click", () => watchAd("prestige_bonus", () => doPrestige(E.ADS.prestigeMult)));
  }

  function renderShop() {
    const adActive = S.adBoostUntil > now();
    const skins = SKINS.map((k) => {
      const owned = S.skinsOwned.includes(k.id), on = S.skin === k.id;
      if (k.cost === null && !owned) return `<div class="tile">${pigeonSVG(k.look, "letter")}<div class="title">${k.name}</div><button class="btn btn-ghost" disabled>Débloqué par l'histoire</button></div>`;
      const btn = on ? `<button class="btn btn-ghost" disabled>Équipé</button>` : owned ? `<button class="btn btn-ghost" data-equip="${k.id}">Équiper</button>`
        : `<button class="btn btn-grape" data-skin="${k.id}" data-gems="${k.cost}" ${S.gems < k.cost ? "disabled" : ""}><span class="row" style="gap:4px"><svg width="15" height="15" viewBox="0 0 24 24"><use href="#i-gem"/></svg>${k.cost}</span></button>`;
      return `<div class="tile ${on ? "on" : ""}">${pigeonSVG(k.look, "letter", { flying: on })}<div class="title">${k.name}</div>${btn}</div>`;
    }).join("");
    const warp = offlineRate() * 3600;
    $("#tab-shop").innerHTML = `
      <div class="card panel"><h2>Bonus gratuit</h2>
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-play"/></svg></div><div class="grow"><div class="title">Boost ×${E.AD_BOOST.mult} pendant ${E.AD_BOOST.minutes} min</div><div class="sub">${adActive ? "Actif : encore " + E.formatDuration((S.adBoostUntil - now()) / 1000) : "Cumulable jusqu'à 4 h"}</div></div>${adButton("adBoostBtn", "Activer")}</div>
        <p class="note">${S.premium ? "Premium : tous les bonus sans pub." : `Pubs facultatives, ${Math.max(0, adsLeft())} restantes aujourd'hui.`}</p></div>
      <div class="card panel"><h2>Avec des gemmes</h2><div class="list">
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-clock"/></svg></div><div class="grow"><div class="title">Saut temporel d'1 h</div><div class="sub num">+${fmt(warp)} pièces tout de suite (selon tes chefs)</div></div><button class="btn btn-grape" id="warpBtn" data-gems="30" ${S.gems < 30 ? "disabled" : ""}><span class="row" style="gap:4px"><svg width="15" height="15" viewBox="0 0 24 24"><use href="#i-gem"/></svg>30</span></button></div>
      </div></div>
      <div class="card panel"><h2>Skins de pigeons</h2><p>Juste pour le style : tous tes pigeons (sauf les stars) changent de tenue.</p><div class="skins">${skins}</div></div>
      <div class="card panel"><h2>Offres</h2><div class="list">${IAP.map((p) => `<div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="${p.key === "premium" ? "#i-feather" : "#i-gem"}"/></svg></div><div class="grow"><div class="title">${p.name}${p.key === "premium" && S.premium ? " · actif" : ""}</div><div class="sub">${p.desc}</div></div><button class="btn btn-buy" data-iap="${p.key}" ${p.key === "premium" && S.premium ? "disabled" : ""}>${M.PRODUCTS[p.key].price}</button></div>`).join("")}</div>
        ${M.native ? '<button class="btn btn-ghost" id="restoreBtn">Restaurer mes achats</button>' : '<p class="note">Les achats arrivent avec l\'app iPhone et Android. Tout le jeu se termine sans payer.</p>'}</div>`;
    const host = $("#tab-shop");
    $("#adBoostBtn").addEventListener("click", () => watchAd("boost_30", () => {
      S.adBoostUntil = Math.min(Math.max(S.adBoostUntil, now()) + E.AD_BOOST.minutes * 60000, now() + E.AD_BOOST.maxMinutes * 60000);
      toast(`Boost ×${E.AD_BOOST.mult} actif !`); burstAt(null, 40); renderTab();
    }));
    $("#warpBtn").addEventListener("click", () => {
      const g = offlineRate() * 3600;
      if (S.gems < 30) return;
      if (g <= 0) { toast("Engage d'abord un chef : le saut temporel utilise ses livraisons."); return; }
      S.gems -= 30; earn(g); toast(`Saut temporel : +${fmt(g)} pièces`); coinFly($("#warpBtn"), 10); sfx("cash"); renderTab();
    });
    for (const b of host.querySelectorAll("[data-skin]")) b.addEventListener("click", () => {
      const k = SKINS.find((x) => x.id === b.dataset.skin);
      if (!k || S.gems < k.cost) return;
      S.gems -= k.cost; S.skinsOwned.push(k.id); S.skin = k.id; applySkin(); toast(`Nouveau look : ${k.name} !`); burstAt(b, 40); sfx("milestone"); renderTab(); saveAll();
    });
    for (const b of host.querySelectorAll("[data-equip]")) b.addEventListener("click", () => { S.skin = b.dataset.equip; applySkin(); renderTab(); });
    for (const b of host.querySelectorAll("[data-iap]")) b.addEventListener("click", () => buyIap(b.dataset.iap));
    const rb = $("#restoreBtn"); if (rb) rb.addEventListener("click", async () => { const ok = await M.restore(); if (ok && await M.hasPremium()) { S.premium = true; renderTab(); } toast(ok ? "Achats restaurés" : "Rien à restaurer"); });
  }

  // ================================================================ modal, toast, settings, age gate
  function openModal(html, closable = true) {
    const wasOpen = !$("#modal").hidden;
    $("#sheet").innerHTML = html;
    $("#modal").hidden = false;
    if (AU) AU.duck("modal", true);
    if (!wasOpen) sfx("open");
    $("#modal").dataset.closable = closable ? "1" : "";
    for (const b of $("#sheet").querySelectorAll("[data-close]")) b.addEventListener("click", closeModal);
  }
  function closeModal() { $("#modal").hidden = true; $("#sheet").innerHTML = ""; if (AU) AU.duck("modal", false); if (rt.adTimer) { clearInterval(rt.adTimer); rt.adTimer = null; } }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" && $("#modal").dataset.closable) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden && $("#modal").dataset.closable) closeModal(); });
  function toast(msg) {
    const host = $("#toasts");
    while (host.children.length > 2) host.firstChild.remove();
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    t.addEventListener("animationend", () => t.remove()); host.appendChild(t);
  }
  function firstTime(key, html, onMount) {
    if (S.tips[key]) return;
    S.tips[key] = true;
    const show = () => { if (!$("#modal").hidden || rt.dlg) { setTimeout(show, 1500); return; } openModal(html); if (onMount) onMount(); };
    show();
  }

  function openSettings() {
    openModal(`<h2>Réglages</h2>
      <div class="row"><div class="grow"><label class="title" for="musVol">Musique</label><input type="range" id="musVol" class="slider" min="0" max="100" value="${Math.round(S.musicVol * 100)}"></div></div>
      <div class="row"><div class="grow"><label class="title" for="sfxVol">Bruitages</label><input type="range" id="sfxVol" class="slider" min="0" max="100" value="${Math.round(S.sfxVol * 100)}"></div></div>
      <p class="note">Sur iPhone, le bouton silencieux coupe aussi le son du jeu.</p>
      <div class="row"><div class="grow"><div class="title">Rappel de pause</div><div class="sub">Un petit message après 45 min de jeu</div></div><button class="btn btn-ghost" id="pauseBtn">${S.pauseReminder ? "Activé" : "Coupé"}</button></div>
      <div class="row"><div class="grow"><div class="title">Sauvegarde</div><div class="sub">${cloud.doc ? "Automatique, sur cet appareil et dans ton compte" : "Automatique, sur cet appareil"}</div></div></div>
      <div class="row"><div class="grow"><div class="title">Âge</div><div class="sub">${S.kid ? "Mode enfant : pubs non personnalisées, achats protégés" : "Mode standard"}</div></div><button class="btn btn-ghost" id="ageBtn">Modifier</button></div>
      <div class="row"><div class="grow"><div class="title">Revoir le tutoriel</div></div><button class="btn btn-ghost" id="tutoBtn">Relancer</button></div>
      <div class="row"><div class="grow"><div class="title">Recommencer à zéro</div><div class="sub">Efface toute la progression</div></div><button class="btn btn-ghost" id="resetBtn">Effacer</button></div>
      <p class="note">Pigeon Express · version ${SAVE_VERSION}.0 · ${M.native ? "app" : "web : pubs simulées, achats dans l'app"}</p>
      <div class="btns"><button class="btn btn-buy" data-close>Fermer</button></div>`);
    const vols = () => { S.musicVol = $("#musVol").value / 100; S.sfxVol = $("#sfxVol").value / 100; if (AU) { AU.unlock(); AU.setVolumes(S.musicVol, S.sfxVol); } };
    $("#musVol").addEventListener("input", vols);
    $("#sfxVol").addEventListener("input", vols);
    $("#sfxVol").addEventListener("change", () => sfx("coin", { route: 2 }));
    $("#pauseBtn").addEventListener("click", (e) => { S.pauseReminder = !S.pauseReminder; e.currentTarget.textContent = S.pauseReminder ? "Activé" : "Coupé"; });
    $("#ageBtn").addEventListener("click", async () => { closeModal(); if (await parentalGate()) ageGate(() => {}); });
    $("#tutoBtn").addEventListener("click", () => { closeModal(); switchTab("routes"); setTutorial(S.mgr.lettres ? 4 : 0); });
    $("#resetBtn").addEventListener("click", () => {
      openModal(`<h2>Tout effacer ?</h2><p style="text-align:center">Pièces, routes, gemmes, skins, plumes et pigeons stars seront perdus. Impossible d'annuler.</p><div class="btns"><button class="btn btn-ghost" data-close>Annuler</button><button class="btn btn-buy" id="resetGo">Tout effacer</button></div>`);
      $("#resetGo").addEventListener("click", () => {
        const keep = { birthYear: S.birthYear, kid: S.kid, pauseReminder: S.pauseReminder, premium: S.premium };
        S = Object.assign(freshState(), keep); S.savedAt = Date.now();
        for (const r of E.ROUTES) { rt.running[r.id] = false; rt.prog[r.id] = 0; }
        rt.cat = null; saveAll(); closeModal(); afterLoad(false); toast("Nouvelle partie !");
      });
    });
  }
  function ageGate(done) {
    const y = new Date().getFullYear();
    let opts = '<option value="">Choisir…</option>';
    for (let k = y - 3; k >= y - 100; k--) opts += `<option value="${k}">${k}</option>`;
    openModal(`<div class="hero">${raysSVG()}${pigeonSVG(SKINS[1].look, "letter", { flying: true })}</div><h2>Bienvenue chez Pigeon Express !</h2>
      <p style="text-align:center">Pour régler le jeu, indique ton année de naissance.</p>
      <select id="ageSel" aria-label="Année de naissance">${opts}</select>
      <div class="btns"><button class="btn btn-buy" id="ageOk" disabled>C'est parti !</button></div>`, false);
    const sel = $("#ageSel"), ok = $("#ageOk");
    sel.addEventListener("change", () => { ok.disabled = !sel.value; });
    ok.addEventListener("click", () => {
      S.birthYear = Number(sel.value); S.kid = y - S.birthYear <= 13;
      if (S.kid) S.pauseReminder = true;
      closeModal(); initMonet(); saveAll(); done();
    });
  }
  function initMonet() {
    M.init({ childDirected: S.kid, simulate: simulatedAd }).then(() => M.hasPremium()).then((p) => { if (p) S.premium = true; }).catch(() => {});
  }

  // ================================================================ story (data in story.js)
  const ST = window.STORY;
  const frTypo = (s) => String(s).replace(/ ([!?:;»])/g, "\u00A0$1").replace(/« /g, "«\u00A0");
  const guardian = () => !!S.story.flags.guardian;
  const heartsOf = (w) => S.story.hearts[w] || 0;
  const charName = (w) => (ST.CHARACTERS[w] ? ST.CHARACTERS[w].name : (E.PIGEONS.find((p) => p.id === w) || {}).name || "");
  function storyCond(c) {
    if (!c) return true;
    if (c.hearts) for (const w in c.hearts) if (heartsOf(w) < c.hearts[w]) return false;
    if (c.flag && !S.story.flags[c.flag]) return false;
    return true;
  }
  function addHearts(w, n) {
    const before = heartsOf(w), after = Math.min(ST.MAX_HEARTS, before + n);
    if (after <= before) return;
    S.story.hearts[w] = after;
    toast(`${charName(w)} : +${after - before} cœur${after - before > 1 ? "s" : ""} (${after}/${ST.MAX_HEARTS})`); sfx("heart");
    if (!reducedMotion) for (let k = 0; k < 3 * (after - before); k++) {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      h.setAttribute("viewBox", "0 0 24 24"); h.setAttribute("class", "heart-fly"); h.innerHTML = '<use href="#i-heart"/>';
      h.style.left = (35 + Math.random() * 30) + "%"; h.style.animationDelay = (k * 0.12) + "s";
      h.addEventListener("animationend", () => h.remove()); $("#app").appendChild(h);
    }
  }
  function storyEffect(e) {
    if (!e || (rt.dlg && rt.dlg.replay)) return;
    if (e.hearts) for (const w in e.hearts) addHearts(w, e.hearts[w]);
    if (e.flag && !S.story.flags[e.flag]) {
      S.story.flags[e.flag] = true;
      if (e.flag === "partner") toast("Partenariat Bzzz & Pigeons : revenus +15 % pour toujours !");
      if (e.flag === "guardian") toast("Moustache devient Gardien de la poste !");
      if (e.flag === "ending") toast("Bénédiction de Papi Augustin : revenus +25 % pour toujours !");
    }
    if (e.gems) { S.gems += e.gems; toast(`+${e.gems} gemmes`); }
    if (e.skin && !S.skinsOwned.includes(e.skin)) { S.skinsOwned.push(e.skin); toast(`Nouveau skin : ${(SKINS.find((k) => k.id === e.skin) || {}).name} (Boutique)`); }
  }
  function triggerMet(tr) {
    switch (tr.type) {
      case "start": return true;
      case "manager": return !!S.mgr[tr.route];
      case "level": return S.lv[tr.route] >= tr.n;
      case "hatched": return S.hatched >= tr.n;
      case "prestige": return S.prestiges >= tr.n;
      case "hearts": return heartsOf(tr.who) >= tr.n && (!tr.after || S.story.done.includes(tr.after)) && (!tr.notFlag || !S.story.flags[tr.notFlag]);
      default: return false;
    }
  }
  const MAIN = ST.SCENES.filter((s) => s.kind === "main");
  const nextMain = () => MAIN.find((s) => !S.story.done.includes(s.id));
  const lastMain = () => [...MAIN].reverse().find((s) => S.story.done.includes(s.id));
  function storyCheck() {
    if (rt.dlg || !$("#modal").hidden || !S.birthYear || document.hidden) return;
    const m = nextMain();
    if (m && triggerMet(m.trigger)) { playScene(m); return; }
    if (S.tutorial < 5) return; // friendship moments wait for the end of the tutorial
    const mo = ST.SCENES.find((s) => s.kind === "moment" && !S.story.done.includes(s.id) && triggerMet(s.trigger));
    if (mo) playScene(mo);
  }
  function playScene(sc, replay) {
    rt.dlg = { sc, replay: !!replay, fast: false, who: null };
    const d = $("#dlg"); d.hidden = false; d.classList.remove("out");
    $("#coach").hidden = true;
    if (AU) AU.duck("modal", true);
    $("#dlgTitle").textContent = sc.kind === "main" ? `${sc.chapter ? "Chapitre " + sc.chapter : "Prologue"} · ${sc.title}` : `Moment d'amitié · ${sc.title}`;
    sfx("open");
    goNode(sc.start);
  }
  function goNode(id) {
    const dl = rt.dlg; if (!dl) return;
    const node = dl.sc.nodes[id];
    dl.node = node;
    if (node.branch) { const b = node.branch.find((x) => storyCond(x.if)); goNode(b.to); return; }
    if (node.end) { storyEffect(node.effect); endScene(); return; }
    storyEffect(node.effect);
    if (dl.fast && node.next) { goNode(node.next); return; }
    const who = node.who, box = $("#dlg .dlg-box"), ch = ST.CHARACTERS[who] || { color: "#8B5CF6" };
    box.classList.toggle("narr", who === "narr");
    if (dl.who !== who + (node.mood || "")) {
      const pf = $("#dlgPortrait");
      pf.innerHTML = who === "narr" ? "" : portraitSVG(who, node.mood);
      if (dl.who === null || dl.who.indexOf(who) !== 0) { pf.classList.remove("enter"); void pf.offsetWidth; pf.classList.add("enter"); }
      dl.who = who + (node.mood || "");
    }
    const nm = $("#dlgName"); nm.hidden = who === "narr"; nm.textContent = charName(who); nm.style.background = ch.color;
    $("#dlgChoices").innerHTML = ""; $("#dlgNext").hidden = true;
    typeText(frTypo(node.text), who, () => showAfter(node));
  }
  function typeText(text, who, done) {
    const dl = rt.dlg, el = $("#dlgText");
    clearInterval(dl.timer);
    if (dl.fast || reducedMotion) { el.textContent = text; done(); return; }
    let i = 0; el.textContent = ""; dl.typing = { text, done };
    $("#dlgPortrait").classList.add("talking");
    dl.timer = setInterval(() => {
      i = Math.min(text.length, i + 1); el.textContent = text.slice(0, i);
      if (i % 3 === 1 && /\S/.test(text[i - 1])) sfx("voice", { who });
      if (i >= text.length) finishTyping();
    }, 26);
  }
  function finishTyping() {
    const dl = rt.dlg; if (!dl || !dl.typing) return;
    clearInterval(dl.timer); $("#dlgText").textContent = dl.typing.text; $("#dlgPortrait").classList.remove("talking");
    const done = dl.typing.done; dl.typing = null; done();
  }
  function showAfter(node) {
    const dl = rt.dlg;
    if (node.choices) {
      dl.fast = false;
      const host = $("#dlgChoices");
      host.innerHTML = node.choices.map((c, k) => storyCond(c.if) ? `<button class="btn ${k ? "btn-sun" : "btn-buy"}" data-k="${k}">${frTypo(c.text)}</button>` : "").join("");
      for (const b of host.querySelectorAll("[data-k]")) b.addEventListener("click", (ev) => {
        ev.stopPropagation(); const c = node.choices[+b.dataset.k]; sfx("buy"); storyEffect(c.effect); goNode(c.to);
      });
    } else $("#dlgNext").hidden = false;
  }
  function dlgTap() {
    const dl = rt.dlg; if (!dl) return;
    if (dl.typing) { finishTyping(); return; }
    if (dl.node && dl.node.next) { sfx("tab"); goNode(dl.node.next); }
  }
  function endScene() {
    const dl = rt.dlg; rt.dlg = null;
    clearInterval(dl.timer);
    const d = $("#dlg"); d.classList.add("out"); setTimeout(() => { d.hidden = true; d.classList.remove("out"); }, 260);
    if (AU) AU.duck("modal", false);
    if (!dl.replay && !S.story.done.includes(dl.sc.id)) {
      S.story.done.push(dl.sc.id); saveAll();
      if (dl.sc.kind === "main" && dl.sc.goal) toast(`Nouvel objectif : ${dl.sc.goal}`);
      if (dl.sc.id === "ch12") { banner("Fin du chapitre 12 !", "La Lettre d'Or est livrée"); burstAt(null, 160); sfx("prestige"); }
    }
    if (S.tutorial < 5) setTutorial(S.tutorial);
    renderTab(); refreshStoryBar();
  }
  $("#dlg").addEventListener("click", dlgTap);
  $("#dlgSkip").addEventListener("click", (ev) => { ev.stopPropagation(); if (!rt.dlg) return; rt.dlg.fast = true; finishTyping(); if (rt.dlg && rt.dlg.node && rt.dlg.node.next) goNode(rt.dlg.node.next); });

  function portraitSVG(who, mood) {
    if (who === "capucine") return pigeonSVG(CAPUCINE_LOOK, null, { mood });
    if (who === "augustin") return pigeonSVG(AUGUSTIN_LOOK, null, { mood });
    if (who === "moustache") return catFace(mood);
    if (who === "bzzz") return waspSVG(mood);
    if (STAR_LOOKS[who]) return pigeonSVG(STAR_LOOKS[who], null, { mood });
    return "";
  }
  function catFace(mood) {
    const eyes = mood === "happy" ? `<path d="M20 31q4-5 8 0M36 31q4-5 8 0" fill="none" stroke="${LINE}" stroke-width="2.6" stroke-linecap="round"/>`
      : mood === "sad" ? `<path d="M19 30q5 3 9 0M36 30q5 3 9 0" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/><path d="M24 33q1.8 3.4 0 5-1.8-1.6 0-5z" fill="#7FD3FF" stroke="${LINE}" stroke-width=".8"/>`
      : `<ellipse cx="24" cy="30" rx="${mood === "surprised" ? 5 : 4}" ry="${mood === "surprised" ? 6 : 4.6}" fill="#C8F07A" stroke="${LINE}" stroke-width="1.8"/><ellipse cx="40" cy="30" rx="${mood === "surprised" ? 5 : 4}" ry="${mood === "surprised" ? 6 : 4.6}" fill="#C8F07A" stroke="${LINE}" stroke-width="1.8"/><path d="M24 26v8M40 26v8" stroke="${LINE}" stroke-width="2"/>`;
    return `<svg class="pigeon" viewBox="0 0 64 60" aria-hidden="true">
      <path d="M12 26 10 4l16 12zM52 26l2-22-16 12z" fill="#FFA94D" stroke="${LINE}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 20l-1-10 8 7zM50 20l1-10-8 7z" fill="#FF8FB1"/>
      <ellipse cx="32" cy="34" rx="22" ry="19" fill="#FFA94D" stroke="${LINE}" stroke-width="2.4"/>
      <path d="M26 16l2 7M32 15v8M38 16l-2 7" stroke="#E07B1F" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="32" cy="43" rx="10" ry="7" fill="#FFE2C2"/>${eyes}
      <path d="M30 38h4l-2 2.4z" fill="#FF8FB1" stroke="${LINE}" stroke-width="1"/>
      <path d="M32 40.5q-2 3.5-5 1.5M32 40.5q2 3.5 5 1.5" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M18 38H5M18 41l-12 3M46 38h13M46 41l12 3" stroke="${LINE}" stroke-width="1.3" stroke-linecap="round"/></svg>`;
  }
  function waspSVG(mood) {
    const mouth = mood === "sad" ? `<path d="M14 40q4-3 8 0" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>`
      : mood === "surprised" ? `<ellipse cx="18" cy="39" rx="2.2" ry="2.8" fill="${LINE}"/>`
      : `<path d="M13 38q5 4 10 0" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>`;
    return `<svg class="pigeon" viewBox="0 0 64 60" aria-hidden="true">
      <ellipse class="wing" cx="34" cy="14" rx="9" ry="13" fill="#DDF4FF" fill-opacity=".85" stroke="${LINE}" stroke-width="1.8" transform="rotate(-25 34 14)"/>
      <ellipse class="wing" cx="44" cy="16" rx="8" ry="12" fill="#DDF4FF" fill-opacity=".85" stroke="${LINE}" stroke-width="1.8" transform="rotate(20 44 16)"/>
      <path d="M57 38l6 2-6 3z" fill="${LINE}"/>
      <ellipse cx="40" cy="38" rx="17" ry="13" fill="#FFC93C" stroke="${LINE}" stroke-width="2.4"/>
      <path d="M34 26q-3 12 0 24M42 25.5q-3 12.5 0 25M50 28q-2 10 0 20" stroke="${LINE}" stroke-width="4" fill="none"/>
      <circle cx="18" cy="32" r="12" fill="#FFC93C" stroke="${LINE}" stroke-width="2.4"/>
      <path d="M14 21q-4-9 2-12M22 21q2-9 9-10" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="9" r="2" fill="${LINE}"/><circle cx="31" cy="11" r="2" fill="${LINE}"/>
      <rect x="8" y="26" width="9" height="6" rx="2.5" fill="${LINE}"/><rect x="19" y="26" width="9" height="6" rx="2.5" fill="${LINE}"/><path d="M17 28h2" stroke="${LINE}" stroke-width="2"/>
      ${mouth}<path d="M21 44l4 3-4 4-3-4z" fill="#FF5A4E" stroke="${LINE}" stroke-width="1.4"/></svg>`;
  }
  function refreshStoryBar() {
    const bar = $("#storyBar"); if (!bar) return;
    const last = lastMain(), next = nextMain();
    const key = (last ? last.id : "") + "|" + S.birthYear;
    if (bar._k === key) return; bar._k = key;
    bar.hidden = !last;
    if (!last) return;
    bar.innerHTML = `<span class="face">${pigeonSVG(CAPUCINE_LOOK, null, { mood: "happy" })}</span><span class="grow"><span class="t1">${last.chapter ? "Chapitre " + last.chapter : "Prologue"} · ${last.title}</span><span class="t2">${next ? "Objectif : " + last.goal : "Histoire terminée. Merci d'avoir joué !"}</span></span>`;
  }
  $("#storyBar").addEventListener("click", () => switchTab("empire"));
  function storyPanelHTML() {
    const hearts = (w) => { let s = ""; for (let k = 0; k < ST.MAX_HEARTS; k++) s += `<svg viewBox="0 0 24 24" class="hrt${k < heartsOf(w) ? " on" : ""}"><use href="#i-heart"/></svg>`; return s; };
    const met = { capucine: S.story.done.includes("prologue"), moustache: S.story.done.includes("ch3"), bzzz: S.story.done.includes("ch5") };
    const rels = ["capucine", "moustache", "bzzz"].filter((w) => met[w]).map((w) => {
      const c = ST.CHARACTERS[w];
      const status = w === "capucine" ? `+${heartsOf(w) * 2} % de revenus` : w === "moustache" ? (guardian() ? "Gardien de la poste" : "Gagne des cœurs en le chatouillant (2 par jour)") : (S.story.flags.partner ? "Partenaire : +15 %" : "Pas encore partenaire");
      return `<div class="row rel"><span class="rel-face">${portraitSVG(w, "happy")}</span><div class="grow"><div class="title">${c.name} <span class="sub">· ${c.role}</span></div><div class="hearts">${hearts(w)}</div><div class="sub">${c.perk}. ${status}.</div></div></div>`;
    }).join("");
    const chapters = ST.SCENES.filter((s) => S.story.done.includes(s.id)).map((s) => `<button class="btn btn-ghost chap" data-replay="${s.id}">${s.kind === "main" ? (s.chapter ? "Ch. " + s.chapter : "Prologue") : "Moment"} · ${s.title}</button>`).join("");
    const next = nextMain(), last = lastMain();
    return `<div class="card panel"><h2>Notre histoire</h2><p>${next ? `<b>Objectif :</b> ${last ? last.goal : "Commence ta partie"}` : "Tu as livré la Lettre d'Or. Bravo !"}</p>
      <div class="list">${rels || '<p class="note">Tes amis apparaîtront ici.</p>'}</div>
      ${chapters ? `<details><summary class="title">Revoir les chapitres (${S.story.done.length})</summary><div class="chaps">${chapters}</div></details>` : ""}</div>`;
  }

  // ================================================================ tutorial coach
  const STEPS = {
    0: { target: () => cards.lettres && cards.lettres.lane, text: "Capucine : Touche la piste pour envoyer notre tout premier pigeon !" },
    1: { target: () => cards.lettres && cards.lettres.lane, text: "Capucine : Il vole, il vole… et chaque livraison nous rapporte des pièces !" },
    2: { target: () => cards.lettres && cards.lettres.buy, text: "Capucine : Achète un niveau : plus de pigeons, plus de pièces par livraison !" },
    3: { target: () => cards.lettres && cards.lettres.mgr, text: () => S.coins >= E.ROUTES[0].manager ? "Capucine : Engage un chef ! Il enverra les pigeons à ta place, même quand tu dors." : `Capucine : Continue d'envoyer et d'acheter. À ${fmt(E.ROUTES[0].manager)} pièces, on pourra engager un chef !` },
    4: { target: () => $('.tabbar [data-tab="empire"]'), text: "Capucine : Nos objectifs, le coffre du jour et notre histoire sont dans Empire. À tout de suite !" },
  };
  function setTutorial(n) {
    S.tutorial = n; const c = $("#coach");
    if (n >= 5) { c.hidden = true; c.innerHTML = ""; return; }
    c.hidden = false;
    c.innerHTML = '<svg class="hand" viewBox="0 0 48 48"><use href="#i-hand"/></svg><div class="bubble"><i class="coach-face">' + pigeonSVG(CAPUCINE_LOOK, null, { mood: "happy" }) + '</i><span></span><button id="skipTuto">Passer</button></div>';
    if (rt.dlg) c.hidden = true;
    $("#skipTuto").addEventListener("click", () => setTutorial(5));
    placeCoach();
  }
  function placeCoach() {
    const st = STEPS[S.tutorial]; const c = $("#coach"); if (!st || c.hidden || rt.dlg) return;
    const el = st.target(); if (!el) return;
    const app = $("#app").getBoundingClientRect(), r = el.getBoundingClientRect();
    const hand = $(".hand", c), bubble = $(".bubble", c);
    hand.style.left = (r.left - app.left + r.width / 2 - 8) + "px";
    hand.style.top = (r.top - app.top + r.height / 2 - 6) + "px";
    $("span", bubble).textContent = typeof st.text === "function" ? st.text() : st.text;
    if (r.top - app.top > 170) { bubble.style.top = ""; bubble.style.bottom = (app.bottom - r.top + 12) + "px"; }
    else { bubble.style.top = (r.bottom - app.top + 46) + "px"; bubble.style.bottom = ""; }
  }
  $("#main").addEventListener("scroll", () => { if (S.tutorial < 5) placeCoach(); }, { passive: true });

  // ================================================================ sound (audio.js: music + effects)
  const AU = window.AUDIO;
  function sfx(name, opts) { if (AU) AU.sfx(name, opts); }
  function stinger(sec) { if (AU) AU.stinger(sec || 1.2); }
  function shake(big) {
    if (reducedMotion) return;
    const a = $("#app"); a.classList.remove("shake-s", "shake-l"); void a.offsetWidth; a.classList.add(big ? "shake-l" : "shake-s");
  }
  function banner(text, sub) {
    if (reducedMotion) { toast(text); return; }
    const b = document.createElement("div"); b.className = "banner";
    b.innerHTML = `<div>${text}${sub ? `<small>${sub}</small>` : ""}</div>`;
    b.addEventListener("animationend", () => b.remove()); $("#app").appendChild(b);
  }
  const hasBoost = () => { const t = now(); return S.adBoostUntil > t || S.goldBoostUntil > t || S.comboBoostUntil > t; };
  function musicIntensity() { if (AU) AU.setIntensity(!S.birthYear ? 0 : hasBoost() ? 2 : 1); }

  // ================================================================ boot
  function afterLoad(fromCloud) {
    applyCity(); buildRoutes();
    for (const b of document.querySelectorAll("[data-multi]")) b.setAttribute("aria-pressed", String(b.dataset.multi === S.multi));
    for (const rid in S.crew) if (S.crew[rid] === "gerard") rt.awake[rid] = now() + 45000;
    fillIncubator();
    rt.shown = S.coins;
    const away = (Date.now() - S.lastSeen) / 1000;
    const welcome = () => { if (S.savedAt > 0 && away > 5) handleAway(away, true); setTutorial(S.tutorial); storyCheck(); };
    rt.lastWall = Date.now();
    if (!S.birthYear) ageGate(welcome); else welcome();
    if (fromCloud) switchTab(rt.tab);
  }
  document.querySelectorAll("[data-multi]").forEach((b) => b.addEventListener("click", () => {
    S.multi = b.dataset.multi;
    for (const x of document.querySelectorAll("[data-multi]")) x.setAttribute("aria-pressed", String(x === b));
    refreshCards(); sfx("tab");
  }));
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#gemChip").addEventListener("click", () => switchTab("shop"));
  $("#levelChip").addEventListener("click", () => switchTab("empire"));
  $("#letterChip").addEventListener("click", openLetter);
  $("#settingsBtn").addEventListener("click", openSettings);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveAll(); if (AU) AU.suspend(document.hidden); });
  const unlockAudio = () => { if (AU) { AU.setVolumes(S.musicVol, S.sfxVol); AU.unlock(); musicIntensity(); } };
  for (const ev of ["pointerdown", "touchend", "keydown"]) document.addEventListener(ev, unlockAudio, { capture: true, passive: true });
  window.addEventListener("pagehide", saveAll);

  S = loadLocal() || freshState();
  if (S.birthYear) initMonet();
  afterLoad(false);
  requestAnimationFrame(frame);
  initCloud();

  // Test hook for automated checks (no effect on play).
  window.__pigeon = { get state() { return S; }, rt, step, E, addEgg, spawnCat, newLetter, laneTap, periodic, banner, shake, storyCheck, playScene, addHearts,
    spawnGolden, burstAt, switchTab, art: { pigeonSVG, portraitSVG, loftSVG, eggSVG, catSVG, CAPUCINE_LOOK, AUGUSTIN_LOOK, STAR_LOOKS, GOLD_LOOK } };
})();
