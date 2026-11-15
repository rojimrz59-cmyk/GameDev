/* Pigeon Express — game state, loop, saving and UI. Economy numbers live in economy.js. */
(() => {
  "use strict";
  const E = window.ECON;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = (n) => E.formatNumber(n);
  const SAVE_KEY = "pigeon-express-save";
  const SAVE_VERSION = 1;

  const ROUTE_COLORS = [["#FF6B5A", "#D9483A"], ["#FFAA33", "#D9861A"], ["#22B59A", "#178A75"],
    ["#FF7EA0", "#D95A7E"], ["#8B6CFF", "#6A4DDB"], ["#3D7BFF", "#2A5BD1"]];
  const CITY_TINTS = ["rgba(0,0,0,0)", "rgba(46,196,166,.10)", "rgba(255,170,51,.10)", "rgba(255,126,160,.10)",
    "rgba(139,108,255,.12)", "rgba(61,123,255,.12)", "rgba(255,194,61,.14)"];
  const SKINS = [
    { id: "classique", name: "Classique", cost: 0, body: "#9AA5B8", wing: "#7C879C", neck: "#5FB3A1", acc: null },
    { id: "facteur", name: "Facteur", cost: 60, body: "#A9B2C3", wing: "#7C879C", neck: "#4FA3D9", acc: "cap" },
    { id: "aviateur", name: "Aviateur", cost: 120, body: "#C9A47E", wing: "#94704C", neck: "#E0B15A", acc: "gog" },
    { id: "royal", name: "Royal", cost: 200, body: "#F4F1FA", wing: "#C9BEE8", neck: "#B79CFF", acc: "crown" },
    { id: "flamboyant", name: "Flamboyant", cost: 300, body: "#FF8A6B", wing: "#E0563B", neck: "#FFC845", acc: "scarf" },
  ];
  const IAP = [
    { id: "starter", name: "Pack de démarrage", desc: "300 gemmes + skin Facteur + boost ×2 pendant 24 h", price: "1,99 €" },
    { id: "gems500", name: "Sac de 500 gemmes", desc: "Pour les sauts temporels et les skins", price: "4,99 €" },
    { id: "premium", name: "Pass Premium", desc: "Revenus ×2 en permanence, hors ligne 12 h, bonus sans pub", price: "4,99 € / mois" },
  ];

  // ---------------------------------------------------------------- state
  function freshState() {
    const s = {
      version: SAVE_VERSION, coins: 4, earned: 0, runEarned: 0, gems: 0, feathers: 0, prestiges: 0,
      lv: {}, mgr: {}, up: {}, deliveries: {}, xp: 0, level: 1, questsClaimed: [], golden: 0,
      daily: { last: "", streak: 0 }, skin: "classique", skinsOwned: ["classique"],
      adBoostUntil: 0, goldBoostUntil: 0, lastSeen: Date.now(), savedAt: 0, tutorial: 0, sound: true, multi: "1",
    };
    for (const r of E.ROUTES) { s.lv[r.id] = 0; s.mgr[r.id] = false; s.deliveries[r.id] = 0; }
    s.lv.lettres = 1;
    return s;
  }

  function repair(o) {
    if (!o || typeof o !== "object") return null;
    const v = Number(o.version) || 1;
    if (v > SAVE_VERSION) return null; // save from a newer build: refuse rather than half-load
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
    s.adBoostUntil = A(o.adBoostUntil); s.goldBoostUntil = A(o.goldBoostUntil);
    s.lastSeen = A(o.lastSeen) || Date.now(); s.savedAt = A(o.savedAt);
    s.tutorial = I(o.tutorial, 99); s.sound = o.sound !== false;
    s.multi = ["1", "10", "100", "max"].includes(o.multi) ? o.multi : "1";
    return s;
  }

  function parse(raw) { try { return repair(JSON.parse(raw)); } catch (e) { return null; } }

  let S = freshState();
  const rt = { prog: {}, running: {}, lastWall: Date.now(), lastUi: 0, lastSave: Date.now(), lastCloud: Date.now(),
    goldenAt: Date.now() + 40000, popAt: {}, tier: {}, coinSoundAt: 0, tab: "routes" };
  for (const r of E.ROUTES) { rt.prog[r.id] = 0; rt.running[r.id] = false; rt.popAt[r.id] = 0; }

  // ---------------------------------------------------------------- saving
  function serialize() { S.lastSeen = Date.now(); S.savedAt = S.lastSeen; return JSON.stringify(S); }
  function saveLocal() {
    try {
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) localStorage.setItem(SAVE_KEY + ".bak", prev);
      localStorage.setItem(SAVE_KEY, serialize());
    } catch (e) { /* storage blocked: cloud save still works */ }
  }
  function loadLocal() {
    try {
      return parse(localStorage.getItem(SAVE_KEY)) || parse(localStorage.getItem(SAVE_KEY + ".bak"));
    } catch (e) { return null; }
  }

  const cloud = { doc: null, busy: false, status: "local" };
  function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), ms))]); }
  async function initCloud() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    try {
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      const doc = db.doc("data/users/" + id + "/save");
      const snap = await withTimeout(doc.get(), 10000);
      cloud.doc = doc; cloud.status = "sync";
      if (snap.exists) {
        const d = snap.data();
        const remote = typeof d.json === "string" ? parse(d.json) : null;
        if (remote && remote.savedAt > S.savedAt + 2000) { // newer progress from another device
          S = remote; afterLoad(true); toast("Partie récupérée depuis le cloud");
        }
      }
      pushCloud();
    } catch (e) { cloud.status = "local"; }
  }
  async function pushCloud() {
    if (!cloud.doc || cloud.busy) return;
    cloud.busy = true;
    try { const json = serialize(); await cloud.doc.set({ json, savedAt: S.savedAt }); cloud.status = "sync"; }
    catch (e) {
      if (e && ["invalid_argument", "revoked", "not_granted", "capability_disabled", "quota_exceeded"].includes(e.code)) { cloud.doc = null; }
      cloud.status = "local";
    } finally { cloud.busy = false; }
  }
  function saveAll() { saveLocal(); pushCloud(); }

  // ---------------------------------------------------------------- economy helpers
  const now = () => Date.now();
  const ctxFull = () => ({ upgrades: S.up, globalMult: E.featherMult(S.feathers) * (S.adBoostUntil > now() ? E.AD_BOOST.mult : 1) * (S.goldBoostUntil > now() ? E.GOLDEN.boostMult : 1) });
  const ctxBase = () => ({ upgrades: S.up, globalMult: E.featherMult(S.feathers) });
  const managedRate = (ctx) => E.ROUTES.reduce((a, r) => a + (S.mgr[r.id] ? E.perSecond(r, S.lv[r.id], ctx) : 0), 0);
  const routeIndex = (id) => E.ROUTES.findIndex((r) => r.id === id);
  function earn(x) { S.coins += x; S.earned += x; S.runEarned += x; }
  function buyCount(r) {
    const owned = S.lv[r.id];
    if (S.multi === "max") {
      const m = E.maxAffordable(r, owned, S.coins, 1000);
      return m.count > 0 ? m : { count: 1, cost: E.levelCost(r, owned) };
    }
    const n = Number(S.multi);
    return { count: n, cost: E.bulkCost(r, owned, n) };
  }

  // ---------------------------------------------------------------- actions
  function send(id) {
    if (S.lv[id] <= 0 || S.mgr[id] || rt.running[id]) return;
    rt.running[id] = true; rt.prog[id] = 0;
    sfx("send");
    if (S.tutorial === 0) setTutorial(1);
  }

  function complete(r, i, n) {
    const gain = E.deliveryRevenue(r, S.lv[r.id], ctxFull()) * n;
    earn(gain);
    S.deliveries[r.id] += n;
    S.xp += (i + 1) * n;
    while (S.xp >= E.xpForLevel(S.level)) {
      S.xp -= E.xpForLevel(S.level); S.level++; S.gems += E.LEVELS.gemsPerLevel;
      toast(`Niveau ${S.level} ! +${E.LEVELS.gemsPerLevel} gemmes`); sfx("level");
    }
    const t = now();
    if (t - rt.popAt[r.id] > 180 && !reducedMotion) { rt.popAt[r.id] = t; coinPop(r.id, gain); }
    if (t - rt.coinSoundAt > 140) { rt.coinSoundAt = t; sfx("coin"); }
    if (S.tutorial === 1) setTutorial(2);
  }

  function buy(id) {
    const r = E.ROUTES[routeIndex(id)];
    const { count, cost } = buyCount(r);
    if (count <= 0 || cost > S.coins) return;
    const before = E.milestonesReached(S.lv[id]);
    const wasLocked = S.lv[id] === 0;
    S.coins -= cost; S.lv[id] += count;
    const after = E.milestonesReached(S.lv[id]);
    if (wasLocked) toast(`Nouvelle route : ${r.name} !`);
    else if (after > before) toast(`${r.name} : revenus ×${Math.pow(2, after - before)} !`);
    sfx("buy");
    if (S.tutorial === 2 && S.lv.lettres >= 2) setTutorial(3);
    refreshCards(true);
  }

  function hire(id) {
    const r = E.ROUTES[routeIndex(id)];
    if (S.mgr[id] || S.lv[id] <= 0 || S.coins < r.manager) return;
    S.coins -= r.manager; S.mgr[id] = true; rt.running[id] = true;
    toast(`Chef engagé : ${r.name} livre tout seul`); sfx("level");
    if (S.tutorial === 3) setTutorial(4);
    refreshCards(true);
  }

  function buyUpgrade(id) {
    const u = E.UPGRADES.find((x) => x.id === id);
    if (!u || S.up[id] || S.coins < u.cost) return;
    S.coins -= u.cost; S.up[id] = true; sfx("buy");
    toast(`${u.name} : ${u.target === "all" ? "toutes les routes" : E.ROUTES[routeIndex(u.target)].name} ×${u.mult}`);
    renderTab();
  }

  // ---------------------------------------------------------------- quests, daily, prestige
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
      default: return [0, 1];
    }
  }
  const activeQuests = () => E.QUESTS.filter((q) => !S.questsClaimed.includes(q.id)).slice(0, 3);
  const questReady = (q) => { const [c, n] = questProgress(q); return c >= n; };
  function claimQuest(id) {
    const q = E.QUESTS.find((x) => x.id === id);
    if (!q || S.questsClaimed.includes(id) || !questReady(q)) return;
    S.questsClaimed.push(id); S.gems += q.gems; sfx("level");
    toast(`Objectif atteint : +${q.gems} gemmes`); renderTab();
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
    const d = dailyInfo();
    if (!d.can) return;
    const g = E.DAILY[d.next - 1] * (double ? 2 : 1);
    S.gems += g; S.daily = { last: d.today, streak: d.next };
    toast(`Coffre du jour ${d.next} : +${g} gemmes`); sfx("level"); renderTab();
  }

  function prestigeGain() { return E.feathersFor(S.runEarned); }
  function doPrestige() {
    const gain = prestigeGain();
    if (gain < 1) return;
    S.feathers += gain; S.prestiges++;
    S.coins = 4; S.runEarned = 0;
    for (const r of E.ROUTES) { S.lv[r.id] = 0; S.mgr[r.id] = false; rt.running[r.id] = false; rt.prog[r.id] = 0; }
    S.lv.lettres = 1;
    for (const u of E.UPGRADES) S.up[u.id] = false;
    applyCity(); buildRoutes(); closeModal(); switchTab("routes");
    toast(`Bienvenue à ${cityName()} ! +${gain} plumes d'or`); sfx("level"); saveAll();
  }
  const cityName = () => E.PRESTIGE.cityNames[Math.min(S.prestiges, E.PRESTIGE.cityNames.length - 1)] + (S.prestiges >= E.PRESTIGE.cityNames.length ? " " + (S.prestiges - E.PRESTIGE.cityNames.length + 2) : "");
  function applyCity() {
    $("#cityName").textContent = cityName();
    document.body.style.setProperty("--tint", CITY_TINTS[S.prestiges % CITY_TINTS.length]);
  }

  // ---------------------------------------------------------------- golden pigeon & ads
  function spawnGolden() {
    if ($("#golden") || S.tutorial < 5 || document.hidden || !$("#modal").hidden) return;
    const b = document.createElement("button");
    b.id = "golden"; b.setAttribute("aria-label", "Attraper le pigeon doré");
    b.style.setProperty("--dur", E.GOLDEN.visible + "s");
    b.style.top = (130 + Math.random() * 180) + "px";
    b.innerHTML = pigeonSVG("gem", true);
    b.addEventListener("click", () => { b.remove(); catchGolden(); });
    b.addEventListener("animationend", () => b.remove());
    $("#app").appendChild(b);
  }
  function catchGolden() {
    S.golden++; sfx("level");
    if (Math.random() < 0.5) {
      S.goldBoostUntil = now() + E.GOLDEN.boostSeconds * 1000;
      toast(`Pigeon doré : revenus ×${E.GOLDEN.boostMult} pendant ${E.GOLDEN.boostSeconds} s !`);
    } else {
      const coins = Math.max(50, Math.floor(totalRate() * E.GOLDEN.coinSeconds));
      earn(coins); toast(`Pigeon doré : +${fmt(coins)} pièces !`);
    }
  }
  function totalRate() { // coins per second right now (managed + routes in flight)
    const c = ctxFull();
    return E.ROUTES.reduce((a, r) => a + (S.mgr[r.id] || rt.running[r.id] ? E.perSecond(r, S.lv[r.id], c) : 0), 0);
  }

  function showAd(onReward) { // MVP: simulated rewarded ad. Replace with the ad SDK in the native build.
    let left = 3;
    openModal(`<h2>Publicité</h2><div class="ad-box" id="adBox">Publicité simulée (version test)<br>La récompense arrive dans <b id="adLeft">3</b> s</div><p class="note">Dans la version App Store, une vraie publicité vidéo récompensée s'affiche ici.</p>`, false);
    const iv = setInterval(() => {
      left--; const el = $("#adLeft"); if (el) el.textContent = left;
      if (left <= 0) { clearInterval(iv); closeModal(); onReward(); }
    }, 1000);
    rt.adTimer = iv;
  }
  function adBoost() {
    showAd(() => {
      const base = Math.max(S.adBoostUntil, now());
      S.adBoostUntil = Math.min(base + E.AD_BOOST.minutes * 60000, now() + E.AD_BOOST.maxMinutes * 60000);
      toast(`Boost ×${E.AD_BOOST.mult} actif`); renderTab();
    });
  }

  // ---------------------------------------------------------------- loop
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame() {
    const t = now();
    let dt = (t - rt.lastWall) / 1000;
    rt.lastWall = t;
    if (dt > 5) { handleAway(dt); dt = 0; }
    if (dt > 0) step(dt);
    drawLanes();
    if (t - rt.lastUi > 120) { rt.lastUi = t; updateUi(); }
    if (t - rt.lastSave > 3000) { rt.lastSave = t; saveLocal(); }
    if (t - rt.lastCloud > 30000) { rt.lastCloud = t; pushCloud(); }
    if (t > rt.goldenAt) { rt.goldenAt = t + (E.GOLDEN.minDelay + Math.random() * (E.GOLDEN.maxDelay - E.GOLDEN.minDelay)) * 1000; spawnGolden(); }
    requestAnimationFrame(frame);
  }
  function step(dt) {
    E.ROUTES.forEach((r, i) => {
      if (S.lv[r.id] <= 0) return;
      if (S.mgr[r.id]) rt.running[r.id] = true;
      if (!rt.running[r.id]) return;
      rt.prog[r.id] += dt / r.time;
      if (rt.prog[r.id] >= 1) {
        const n = S.mgr[r.id] ? Math.floor(rt.prog[r.id]) : 1;
        complete(r, i, n);
        if (S.mgr[r.id]) rt.prog[r.id] -= n; else { rt.prog[r.id] = 0; rt.running[r.id] = false; }
      }
    });
  }
  function handleAway(seconds, fromSave) {
    const rate = managedRate(ctxBase());
    const gain = E.offlineEarnings(seconds, rate, E.OFFLINE.maxHours);
    if (gain <= 0) return;
    if (seconds < 60 && !fromSave) { earn(gain); return; }
    const capped = seconds > E.OFFLINE.maxHours * 3600;
    openModal(`<h2>Bon retour !</h2>
      <p>Pendant ton absence (${E.formatDuration(Math.min(seconds, E.OFFLINE.maxHours * 3600))}${capped ? ", maximum atteint" : ""}), tes chefs ont livré :</p>
      <div class="row" style="justify-content:center"><svg width="34" height="34" viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="big-stat num">+${fmt(gain)}</span></div>
      <div class="btns"><button class="btn btn-ghost" id="offOk">Récupérer</button><button class="btn btn-sun" id="offAd">×2<small><svg viewBox="0 0 24 24"><use href="#i-play"/></svg>Regarder une pub</small></button></div>`, false);
    $("#offOk").onclick = () => { earn(gain); closeModal(); sfx("coin"); };
    $("#offAd").onclick = () => showAd(() => { earn(gain * 2); toast(`+${fmt(gain * 2)} pièces`); sfx("level"); });
  }

  // ---------------------------------------------------------------- art
  const PARCELS = {
    letter: '<rect x="23" y="37" width="14" height="9" rx="1.5" fill="#fff" stroke="#14213D"/><path d="M23.5 37.5 30 42.5l6.5-5" fill="none" stroke="#14213D"/>',
    card: '<rect x="22" y="37" width="16" height="10" rx="1.5" fill="#FFF4DA" stroke="#14213D"/><rect x="32" y="38.5" width="4.5" height="4.5" fill="#FF5E4D"/>',
    box: '<rect x="22" y="36" width="15" height="11" rx="1.5" fill="#C98B4E" stroke="#7A4F24"/><path d="M29.5 36v11" stroke="#F2D29B" stroke-width="2"/>',
    pizza: '<path d="M21 37h18l-9 11z" fill="#FFC23D" stroke="#C97A12"/><circle cx="27" cy="39.5" r="1.6" fill="#E23D2E"/><circle cx="32" cy="41.5" r="1.6" fill="#E23D2E"/>',
    flower: '<path d="M30 38v10" stroke="#16B394" stroke-width="1.6"/><circle cx="30" cy="38" r="3" fill="#FF7EA0"/><circle cx="26" cy="40" r="2.6" fill="#FFC23D"/><circle cx="34" cy="40" r="2.6" fill="#8B6CFF"/>',
    gem: '<path d="M24 39l4-3.5h4l4 3.5-6 8z" fill="#7FD3FF" stroke="#2A5BD1"/>',
  };
  function pigeonSVG(parcel, flying) {
    return `<svg class="pigeon${flying ? " flying" : ""}" viewBox="0 0 64 52" aria-hidden="true"><g class="body-g">
      <path d="M5 27l14-5v11z" style="fill:var(--pg-wing)"/>
      <g class="parcel">${PARCELS[parcel] || ""}</g>
      <ellipse cx="30" cy="28" rx="16" ry="11" style="fill:var(--pg-body)"/>
      <ellipse cx="40" cy="23" rx="7" ry="6.5" style="fill:var(--pg-neck)"/>
      <circle cx="46" cy="16" r="7" style="fill:var(--pg-body)"/>
      <path d="M52.5 14.5 60 17l-7.5 2.5z" fill="#F2A33A"/>
      <circle cx="48.2" cy="14.6" r="1.7" fill="#14213D"/>
      <path d="M35 20q6 6 12 1l1 3q-7 6-14-1zM44 23l3 9-4-1z" fill="#FF5E4D" style="opacity:var(--acc-scarf)"/>
      <path d="M39.5 11.5Q46 2.5 52.5 10l3.5 1.6-16.5 1z" fill="#2D5BD8" style="opacity:var(--acc-cap)"/>
      <g style="opacity:var(--acc-gog)"><path d="M39 12h14" stroke="#5A3B00" stroke-width="2"/><circle cx="48.2" cy="14.4" r="3.4" fill="#BFE7FF" stroke="#5A3B00" stroke-width="1.6"/></g>
      <path d="M40 10l1.5-6.5 3 4 2-5.5 2 5.5 3-4 1 6.5z" fill="#FFC23D" stroke="#C98A00" stroke-width=".8" style="opacity:var(--acc-crown)"/>
      <path class="wing" d="M22 25Q30 4 44 17q-9 10-22 8z" style="fill:var(--pg-wing)"/>
    </g></svg>`;
  }
  function loftSVG(i, tier) {
    const [c, d] = ROUTE_COLORS[i];
    const floors = 1 + (tier >= 2 ? 1 : 0) + (tier >= 5 ? 1 : 0);
    const base = 62, top = base - 20 - (floors - 1) * 13;
    let s = `<svg viewBox="0 0 72 72" aria-hidden="true"><ellipse cx="36" cy="65" rx="27" ry="4" fill="var(--ground)"/>`;
    s += `<rect x="15" y="${top}" width="42" height="${base - top}" rx="4" fill="${c}"/>`;
    for (let f = 0; f < floors; f++) {
      const y = base - 12 - f * 13 - (f > 0 ? 3 : 0);
      const holes = f === 0 ? [21, 51] : tier >= 1 ? [24, 36, 48] : [30, 42];
      for (const x of holes) s += `<circle cx="${x}" cy="${y}" r="3.4" fill="#14213D" opacity=".75"/><path d="M${x - 4.5} ${y + 4.2}h9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
      if (f > 0) s += `<path d="M15 ${base - 20 - (f - 1) * 13}h42" stroke="${d}" stroke-width="2"/>`;
    }
    s += `<rect x="30.5" y="${base - 13}" width="11" height="13" rx="5.5" fill="${d}"/>`;
    const roof = tier >= 4 ? "#FFC23D" : d;
    s += `<path d="M10 ${top + 2} 36 ${top - 15} 62 ${top + 2}z" fill="${roof}" stroke="${tier >= 4 ? "#E09A00" : d}" stroke-width="2" stroke-linejoin="round"/>`;
    if (tier >= 1) s += `<path d="M36 ${top - 15}v-10" stroke="#14213D" stroke-width="1.6"/><path d="M36 ${top - 25}l10 3-10 3z" fill="#FFC23D"/>`;
    if (tier >= 3) s += `<circle cx="36" cy="${top - 5}" r="3.2" fill="#fff" stroke="#14213D"/>`;
    if (tier >= 6) for (const [x, y] of [[8, top - 8], [64, top - 2], [60, top - 16]]) s += `<path d="M${x} ${y - 4}l1.2 2.8 2.8 1.2-2.8 1.2L${x} ${y + 4}l-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#FFC23D"/>`;
    if (tier >= 7) for (let x = 19; x <= 53; x += 6) s += `<circle cx="${x}" cy="${base - 21}" r="1.5" fill="${x % 12 === 7 ? "#FFC23D" : "#fff"}"/>`;
    return s + "</svg>";
  }
  const DEST = '<svg class="dest" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="16" height="10" rx="5" fill="var(--ink-soft)"/><path d="M11 17v6" stroke="var(--ink-soft)" stroke-width="2.2"/><path d="M15 3v7" stroke="var(--ink)" stroke-width="1.5"/><path d="M15 3h5v3h-5" fill="var(--coral)"/></svg>';

  function applySkin() {
    const k = SKINS.find((x) => x.id === S.skin) || SKINS[0];
    const st = $("#app").style;
    st.setProperty("--pg-body", k.body); st.setProperty("--pg-wing", k.wing); st.setProperty("--pg-neck", k.neck);
    for (const a of ["cap", "gog", "crown", "scarf"]) st.setProperty("--acc-" + a, k.acc === a ? "1" : "0");
  }

  // ---------------------------------------------------------------- route cards
  const cards = {};
  function buildRoutes() {
    const host = $("#routes");
    host.innerHTML = "";
    E.ROUTES.forEach((r, i) => {
      const el = document.createElement("article");
      el.className = "route"; el.dataset.route = r.id;
      el.innerHTML = `<div class="art"></div>
        <div class="head"><span class="name">${r.name}</span><span class="lvl num"></span></div>
        <div class="lane" role="button" tabindex="0" aria-label="Envoyer un pigeon ${r.name}">${pigeonSVG(r.parcel, false)}${DEST}<div class="hint"></div></div>
        <div class="ms"><span class="ms-t num"></span><div class="bar"><i></i></div><span class="gain num"></span></div>
        <div class="actions"><button class="btn btn-mgr" data-act="hire"></button><button class="btn btn-buy" data-act="buy"></button></div>`;
      const c = { el, art: $(".art", el), lvl: $(".lvl", el), gain: $(".gain", el), lane: $(".lane", el), pigeon: $(".pigeon", el),
        hint: $(".hint", el), msT: $(".ms-t", el), msBar: $(".bar i", el), mgr: $('[data-act="hire"]', el), buy: $('[data-act="buy"]', el), tier: -1 };
      const tapSend = () => send(r.id);
      c.lane.addEventListener("click", tapSend);
      c.art.addEventListener("click", tapSend);
      c.lane.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tapSend(); } });
      c.buy.addEventListener("click", () => buy(r.id));
      c.mgr.addEventListener("click", () => hire(r.id));
      cards[r.id] = c;
      host.appendChild(el);
    });
    refreshCards(true);
  }
  function refreshCards(force) {
    const ctx = ctxFull();
    let prevUnlocked = true;
    E.ROUTES.forEach((r, i) => {
      const c = cards[r.id]; if (!c) return;
      const lv = S.lv[r.id], locked = lv === 0;
      c.el.hidden = locked && !prevUnlocked; // show only the next locked route
      prevUnlocked = !locked;
      c.el.classList.toggle("locked", locked);
      const tier = E.milestonesReached(lv);
      if (tier !== c.tier) { const first = c.tier === -1; c.tier = tier; c.art.innerHTML = loftSVG(i, tier); if (!first && !reducedMotion) { c.art.classList.remove("pop"); void c.art.offsetWidth; c.art.classList.add("pop"); } }
      c.lvl.textContent = locked ? "à ouvrir" : "niv " + lv;
      const g = locked ? "" : `+${fmt(E.deliveryRevenue(r, lv, ctx))} / ${r.time} s`;
      if (c.gain._g !== g) { c.gain.textContent = g; c.gain._g = g; }
      const nm = E.nextMilestone(lv);
      if (locked) { c.msT.textContent = `Rapporte ${fmt(r.revenue)} pièces toutes les ${r.time} s`; c.msBar.style.setProperty("--f", 0); }
      else if (nm) { const prevM = [0, ...E.MILESTONES].filter((m) => m <= lv).pop(); c.msT.textContent = `Niv ${nm} → ×2`; c.msBar.style.setProperty("--f", ((lv - prevM) / (nm - prevM)).toFixed(3)); }
      else { c.msT.textContent = "Pigeonnier au maximum"; c.msBar.style.setProperty("--f", 1); }
      // buy button
      const { count, cost } = locked ? { count: 1, cost: E.levelCost(r, 0) } : buyCount(r);
      const label = locked ? "Ouvrir" : `+${count} niveau${count > 1 ? "x" : ""}`;
      const html = `${label}<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="num">${fmt(cost)}</span></small>`;
      if (c.buy._html !== html) { c.buy.innerHTML = html; c.buy._html = html; }
      c.buy.disabled = cost > S.coins;
      // manager
      if (S.mgr[r.id]) {
        if (c.mgr.tagName === "BUTTON") { const b = document.createElement("div"); b.className = "badge"; b.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-cap"/></svg>Chef au travail'; c.mgr.replaceWith(b); c.mgr = b; }
      } else {
        if (c.mgr.tagName !== "BUTTON") { const b = document.createElement("button"); b.className = "btn btn-mgr"; b.addEventListener("click", () => hire(r.id)); c.mgr.replaceWith(b); c.mgr = b; }
        const mh = `Engager un chef<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg><span class="num">${fmt(r.manager)}</span></small>`;
        if (c.mgr._html !== mh) { c.mgr.innerHTML = mh; c.mgr._html = mh; }
        c.mgr.disabled = locked || S.coins < r.manager;
        c.mgr.hidden = locked;
      }
      // hint
      const hint = locked ? "" : S.mgr[r.id] ? "" : rt.running[r.id] ? "" : "<span>Touche pour <b>envoyer</b></span>";
      if (c.hint._h !== hint) { c.hint.innerHTML = hint; c.hint._h = hint; }
    });
  }
  function drawLanes() {
    if (rt.tab !== "routes") return;
    for (const r of E.ROUTES) {
      const c = cards[r.id]; if (!c || c.el.hidden) continue;
      if (!c.laneW) c.laneW = c.lane.clientWidth;
      const fly = rt.running[r.id] || S.mgr[r.id];
      const p = fly ? Math.min(rt.prog[r.id], 1) : 0;
      c.pigeon.style.setProperty("--x", (p * Math.max(0, c.laneW - 74)).toFixed(1) + "px");
      if (c._fly !== fly) { c._fly = fly; c.pigeon.classList.toggle("flying", fly); }
    }
  }
  function coinPop(id, amount) {
    const c = cards[id]; if (!c || rt.tab !== "routes" || c.el.hidden) return;
    const s = document.createElement("span");
    s.className = "coin-pop num"; s.textContent = "+" + fmt(amount);
    s.addEventListener("animationend", () => s.remove());
    c.lane.appendChild(s);
  }
  window.addEventListener("resize", () => { for (const id in cards) cards[id].laneW = 0; });

  // ---------------------------------------------------------------- HUD & tabs
  function updateUi() {
    $("#coins").textContent = fmt(S.coins);
    $("#rate").textContent = fmt(totalRate());
    $("#gems").textContent = fmt(S.gems);
    $("#level").textContent = S.level;
    $("#xpRing").setAttribute("stroke-dashoffset", (94.2 * (1 - Math.min(1, S.xp / E.xpForLevel(S.level)))).toFixed(1));
    const t = now();
    const ab = $("#boostAd"), gb = $("#boostGold");
    ab.hidden = S.adBoostUntil <= t; if (!ab.hidden) ab.textContent = `×${E.AD_BOOST.mult} · ${E.formatDuration((S.adBoostUntil - t) / 1000)}`;
    gb.hidden = S.goldBoostUntil <= t; if (!gb.hidden) gb.textContent = `×${E.GOLDEN.boostMult} · ${E.formatDuration((S.goldBoostUntil - t) / 1000)}`;
    if (rt.tab === "routes") refreshCards(false); else refreshTab();
    $("#dot-empire").hidden = !(activeQuests().some(questReady) || dailyInfo().can || prestigeGain() >= 3);
    $("#dot-upgrades").hidden = !E.UPGRADES.some((u) => !S.up[u.id] && S.coins >= u.cost);
    if (S.tutorial > 0 && S.tutorial < 5) placeCoach();
  }

  function switchTab(name) {
    rt.tab = name;
    for (const b of document.querySelectorAll(".tabbar button")) b.setAttribute("aria-selected", String(b.dataset.tab === name));
    for (const t of ["routes", "upgrades", "empire", "shop"]) $("#tab-" + t).hidden = t !== name;
    $("#main").scrollTop = 0;
    if (name !== "routes") renderTab(); else { for (const id in cards) cards[id].laneW = 0; refreshCards(true); }
    if (name === "empire" && S.tutorial === 4) setTutorial(5);
  }

  function renderTab() {
    if (rt.tab === "upgrades") renderUpgrades();
    else if (rt.tab === "empire") renderEmpire();
    else if (rt.tab === "shop") renderShop();
    else refreshCards(true);
  }
  // Light refresh (keeps buttons in place so taps are never lost).
  function refreshTab() {
    const host = $("#tab-" + rt.tab);
    for (const b of host.querySelectorAll("[data-cost]")) b.disabled = S.coins < Number(b.dataset.cost);
    for (const b of host.querySelectorAll("[data-gems]")) b.disabled = S.gems < Number(b.dataset.gems);
    for (const el of host.querySelectorAll("[data-quest]")) {
      const q = E.QUESTS.find((x) => x.id === el.dataset.quest); const [c, n] = questProgress(q);
      $(".bar i", el).style.setProperty("--f", Math.min(1, c / n).toFixed(3));
      $(".qv", el).textContent = `${fmt(Math.min(c, n))} / ${fmt(n)}`;
      $("button", el).disabled = c < n;
    }
    const pg = host.querySelector("#prestigeGain"); if (pg) pg.textContent = "+" + prestigeGain();
  }

  function renderUpgrades() {
    const items = E.UPGRADES.map((u) => {
      const target = u.target === "all" ? "Toutes les routes" : E.ROUTES[routeIndex(u.target)].name;
      const right = S.up[u.id] ? `<span class="done"><svg width="16" height="16" viewBox="0 0 24 24"><use href="#i-check"/></svg>Acquis</span>`
        : `<button class="btn btn-buy" data-up="${u.id}" data-cost="${u.cost}" ${S.coins < u.cost ? "disabled" : ""}>Acheter<small><svg viewBox="0 0 24 24"><use href="#i-coin"/></svg>${fmt(u.cost)}</small></button>`;
      return `<div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-feather"/></svg></div><div class="grow"><div class="title">${u.name}</div><div class="sub">${target} : revenus ×${u.mult}</div></div>${right}</div>`;
    }).join("");
    $("#tab-upgrades").innerHTML = `<div class="panel"><h2>Améliorations</h2><p>Des achats uniques qui multiplient les revenus. Ils sont remis à zéro quand tu déménages.</p></div><div class="panel list">${items}</div>`;
    for (const b of $("#tab-upgrades").querySelectorAll("[data-up]")) b.addEventListener("click", () => buyUpgrade(b.dataset.up));
  }

  function renderEmpire() {
    const d = dailyInfo();
    const streak = E.DAILY.map((g, i) => `<div class="${i < d.shownStreak ? "got" : ""} ${d.can && i === d.next - 1 ? "today" : ""}">J${i + 1}<b class="num">${g}</b></div>`).join("");
    const quests = activeQuests().map((q) => {
      const [c, n] = questProgress(q);
      return `<div class="row" data-quest="${q.id}"><div class="grow"><div class="title">${q.text}</div><div class="row" style="gap:8px"><div class="bar"><i style="--f:${Math.min(1, c / n).toFixed(3)}"></i></div><span class="sub qv num">${fmt(Math.min(c, n))} / ${fmt(n)}</span></div></div>
        <button class="btn btn-sun" data-claim="${q.id}" ${c < n ? "disabled" : ""}>+${q.gems}<small><svg viewBox="0 0 24 24"><use href="#i-gem"/></svg>Récupérer</small></button></div>`;
    }).join("") || `<p>Tous les objectifs sont terminés. De nouveaux arrivent dans la prochaine mise à jour.</p>`;
    const gain = prestigeGain();
    const next = E.xpForLevel(S.level);
    $("#tab-empire").innerHTML = `
      <div class="panel"><div class="row"><div class="grow"><h2>Niveau ${S.level}</h2><p class="num">${fmt(S.xp)} / ${fmt(next)} XP · chaque niveau rapporte ${E.LEVELS.gemsPerLevel} gemmes</p></div></div><div class="bar"><i style="--f:${(S.xp / next).toFixed(3)};background:var(--lilac)"></i></div></div>
      <div class="panel"><h2>Coffre du jour</h2><p>Reviens chaque jour : la série monte jusqu'au jour 7.</p><div class="streak">${streak}</div>
        <div class="btns row"><button class="btn btn-sun grow" id="dailyBtn" ${d.can ? "" : "disabled"}>${d.can ? "Ouvrir le coffre" : "Reviens demain"}</button>${d.can ? '<button class="btn btn-ghost grow" id="dailyAd">×2<small><svg viewBox="0 0 24 24"><use href="#i-play"/></svg>avec une pub</small></button>' : ""}</div></div>
      <div class="panel"><h2>Objectifs</h2><div class="list">${quests}</div></div>
      <div class="panel"><h2>${cityName()}</h2>
        <p>Déménage dans une ville plus grande : tu repars de zéro, mais chaque plume d'or ajoute +${Math.round(E.PRESTIGE.bonusPerFeather * 100)} % à tous tes revenus, pour toujours.</p>
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-feather"/></svg></div><div class="grow"><div class="title num">${S.feathers} plume${S.feathers > 1 ? "s" : ""} · +${Math.round(S.feathers * E.PRESTIGE.bonusPerFeather * 100)} %</div><div class="sub">À gagner en déménageant : <b id="prestigeGain" class="num">+${gain}</b></div></div>
        <button class="btn btn-buy" id="prestigeBtn">Déménager</button></div></div>
      <div class="panel"><h2>Statistiques</h2><p class="num">Pièces gagnées au total : ${fmt(S.earned)}<br>Pigeons dorés attrapés : ${S.golden}<br>Déménagements : ${S.prestiges}</p></div>`;
    for (const b of $("#tab-empire").querySelectorAll("[data-claim]")) b.addEventListener("click", () => claimQuest(b.dataset.claim));
    const db = $("#dailyBtn"); if (db) db.addEventListener("click", () => claimDaily(false));
    const da = $("#dailyAd"); if (da) da.addEventListener("click", () => showAd(() => claimDaily(true)));
    $("#prestigeBtn").addEventListener("click", confirmPrestige);
  }
  function confirmPrestige() {
    const gain = prestigeGain();
    if (gain < 1) {
      openModal(`<h2>Pas encore</h2><p>Il faut gagner au moins ${fmt(E.PRESTIGE.unit)} pièces dans cette ville pour obtenir une première plume d'or. Continue à développer tes routes.</p><div class="btns"><button class="btn btn-ghost" data-close>D'accord</button></div>`);
      return;
    }
    const nextCity = E.PRESTIGE.cityNames[Math.min(S.prestiges + 1, E.PRESTIGE.cityNames.length - 1)];
    openModal(`<h2>Déménager vers ${nextCity} ?</h2>
      <p>Tu gagnes <b>+${gain} plumes d'or</b> : tes revenus passent de +${Math.round(S.feathers * E.PRESTIGE.bonusPerFeather * 100)} % à <b>+${Math.round((S.feathers + gain) * E.PRESTIGE.bonusPerFeather * 100)} %</b>, pour toujours.</p>
      <p>Tu repars avec 0 pièce, la seule route Lettres, sans chef ni amélioration. Tu gardes tes gemmes, ton niveau, tes skins et tes plumes.</p>
      <div class="btns"><button class="btn btn-ghost" data-close>Rester ici</button><button class="btn btn-buy" id="goPrestige">Déménager</button></div>`);
    $("#goPrestige").addEventListener("click", doPrestige);
  }

  function renderShop() {
    const adActive = S.adBoostUntil > now();
    const skins = SKINS.map((k) => {
      const owned = S.skinsOwned.includes(k.id), on = S.skin === k.id;
      const st = `--pg-body:${k.body};--pg-wing:${k.wing};--pg-neck:${k.neck};--acc-cap:${k.acc === "cap" ? 1 : 0};--acc-gog:${k.acc === "gog" ? 1 : 0};--acc-crown:${k.acc === "crown" ? 1 : 0};--acc-scarf:${k.acc === "scarf" ? 1 : 0}`;
      const btn = on ? `<button class="btn btn-ghost" disabled>Équipé</button>` : owned ? `<button class="btn btn-ghost" data-equip="${k.id}">Équiper</button>`
        : `<button class="btn btn-sun" data-skin="${k.id}" data-gems="${k.cost}" ${S.gems < k.cost ? "disabled" : ""}><span class="row" style="gap:4px"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-gem"/></svg>${k.cost}</span></button>`;
      return `<div class="skin ${on ? "on" : ""}" style="${st}">${pigeonSVG("letter", false)}<div class="title">${k.name}</div>${btn}</div>`;
    }).join("");
    const warpGain = managedRate(ctxBase()) * 3600;
    $("#tab-shop").innerHTML = `
      <div class="panel"><h2>Bonus gratuits</h2>
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24" style="color:var(--ink)"><use href="#i-play"/></svg></div><div class="grow"><div class="title">Boost ×${E.AD_BOOST.mult} pendant ${E.AD_BOOST.minutes} min</div><div class="sub">${adActive ? "Actif : " + E.formatDuration((S.adBoostUntil - now()) / 1000) + " restantes (max 4 h)" : "Regarde une courte pub"}</div></div><button class="btn btn-sun" id="adBoostBtn">Regarder</button></div></div>
      <div class="panel"><h2>Avec des gemmes</h2><div class="list">
        <div class="row"><div class="ico"><svg viewBox="0 0 24 24" style="color:var(--ink)"><use href="#i-clock"/></svg></div><div class="grow"><div class="title">Saut temporel d'1 h</div><div class="sub num">+${fmt(warpGain)} pièces tout de suite (selon tes chefs)</div></div><button class="btn btn-sun" id="warpBtn" data-gems="30" ${S.gems < 30 ? "disabled" : ""}><span class="row" style="gap:4px"><svg width="14" height="14" viewBox="0 0 24 24"><use href="#i-gem"/></svg>30</span></button></div>
      </div></div>
      <div class="panel"><h2>Skins de pigeons</h2><p>Purement esthétiques : tous tes pigeons changent de tenue.</p><div class="skins">${skins}</div></div>
      <div class="panel"><h2>Offres</h2><div class="list">${IAP.map((p) => `<div class="row"><div class="ico"><svg viewBox="0 0 24 24"><use href="#i-gem"/></svg></div><div class="grow"><div class="title">${p.name}</div><div class="sub">${p.desc}</div></div><button class="btn btn-ghost" data-iap="${p.id}">${p.price}</button></div>`).join("")}</div>
        <p class="note">Version test : les achats intégrés sont désactivés. Le jeu se termine entièrement sans payer.</p></div>`;
    $("#adBoostBtn").addEventListener("click", adBoost);
    $("#warpBtn").addEventListener("click", () => {
      if (S.gems < 30) return;
      const g = managedRate(ctxBase()) * 3600;
      if (g <= 0) { toast("Engage d'abord un chef : le saut temporel utilise leurs livraisons"); return; }
      S.gems -= 30; earn(g); toast(`+${fmt(g)} pièces`); sfx("level"); renderTab();
    });
    for (const b of $("#tab-shop").querySelectorAll("[data-skin]")) b.addEventListener("click", () => {
      const k = SKINS.find((x) => x.id === b.dataset.skin);
      if (!k || S.gems < k.cost) return;
      S.gems -= k.cost; S.skinsOwned.push(k.id); S.skin = k.id; applySkin(); toast(`Skin ${k.name} équipé`); sfx("level"); renderTab(); saveAll();
    });
    for (const b of $("#tab-shop").querySelectorAll("[data-equip]")) b.addEventListener("click", () => { S.skin = b.dataset.equip; applySkin(); renderTab(); });
    for (const b of $("#tab-shop").querySelectorAll("[data-iap]")) b.addEventListener("click", () => toast("Achats désactivés dans la version test"));
  }

  // ---------------------------------------------------------------- modal, toast, settings
  function openModal(html, closable = true) {
    $("#sheet").innerHTML = html;
    $("#modal").hidden = false;
    $("#modal").dataset.closable = closable ? "1" : "";
    for (const b of $("#sheet").querySelectorAll("[data-close]")) b.addEventListener("click", closeModal);
  }
  function closeModal() { $("#modal").hidden = true; $("#sheet").innerHTML = ""; if (rt.adTimer) { clearInterval(rt.adTimer); rt.adTimer = null; } }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" && $("#modal").dataset.closable) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden && $("#modal").dataset.closable) closeModal(); });

  function toast(msg) {
    const host = $("#toasts");
    while (host.children.length > 2) host.firstChild.remove();
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    t.addEventListener("animationend", () => t.remove());
    host.appendChild(t);
  }

  function openSettings() {
    openModal(`<h2>Réglages</h2>
      <div class="row"><div class="grow"><div class="title">Sons</div><div class="sub">Petits bruitages de pièces et d'achats</div></div><button class="btn btn-ghost" id="sndBtn">${S.sound ? "Activés" : "Coupés"}</button></div>
      <div class="row"><div class="grow"><div class="title">Sauvegarde</div><div class="sub">${cloud.doc ? "Automatique, sur cet appareil et dans ton compte Claude" : "Automatique, sur cet appareil"}</div></div></div>
      <div class="row"><div class="grow"><div class="title">Revoir le tutoriel</div></div><button class="btn btn-ghost" id="tutoBtn">Relancer</button></div>
      <div class="row"><div class="grow"><div class="title">Recommencer à zéro</div><div class="sub">Efface toute la progression</div></div><button class="btn btn-ghost" id="resetBtn">Effacer</button></div>
      <p class="note">Pigeon Express · version test (MVP). Publicités et achats simulés.</p>
      <div class="btns"><button class="btn btn-sun" data-close>Fermer</button></div>`);
    $("#sndBtn").addEventListener("click", (e) => { S.sound = !S.sound; e.currentTarget.textContent = S.sound ? "Activés" : "Coupés"; if (S.sound) sfx("buy"); });
    $("#tutoBtn").addEventListener("click", () => { closeModal(); switchTab("routes"); setTutorial(S.mgr.lettres ? 4 : 0); });
    $("#resetBtn").addEventListener("click", () => {
      openModal(`<h2>Tout effacer ?</h2><p>Pièces, routes, gemmes, skins et plumes seront perdus. Impossible d'annuler.</p><div class="btns"><button class="btn btn-ghost" data-close>Annuler</button><button class="btn btn-buy" id="resetGo">Tout effacer</button></div>`);
      $("#resetGo").addEventListener("click", () => {
        S = freshState(); S.savedAt = Date.now();
        for (const r of E.ROUTES) { rt.running[r.id] = false; rt.prog[r.id] = 0; }
        saveAll(); closeModal(); afterLoad(false); toast("Nouvelle partie");
      });
    });
  }

  // ---------------------------------------------------------------- tutorial coach
  const STEPS = {
    0: { target: () => cards.lettres && cards.lettres.lane, text: "Touche la piste pour envoyer ton premier pigeon postal." },
    1: { target: () => cards.lettres && cards.lettres.lane, text: "Il livre la lettre… chaque livraison rapporte des pièces." },
    2: { target: () => cards.lettres && cards.lettres.buy, text: "Achète un niveau : plus de pigeons, plus de pièces par livraison." },
    3: { target: () => cards.lettres && cards.lettres.mgr, text: () => S.coins >= E.ROUTES[0].manager ? "Engage un chef : il envoie les pigeons à ta place, même quand tu n'es pas là." : `Continue d'envoyer et d'acheter des niveaux. À ${fmt(E.ROUTES[0].manager)} pièces, engage un chef.` },
    4: { target: () => $('.tabbar [data-tab="empire"]'), text: "Tes objectifs et ton coffre du jour t'attendent dans Empire. Bonne livraison !" },
  };
  function setTutorial(n) { S.tutorial = n; const c = $("#coach"); if (n >= 5) { c.hidden = true; c.innerHTML = ""; return; } c.hidden = false; c.innerHTML = '<svg class="hand" viewBox="0 0 48 48"><use href="#i-hand"/></svg><div class="bubble"><span></span><button id="skipTuto">Passer</button></div>'; $("#skipTuto").addEventListener("click", () => setTutorial(5)); placeCoach(); }
  function placeCoach() {
    const st = STEPS[S.tutorial]; const c = $("#coach"); if (!st || c.hidden) return;
    const el = st.target(); if (!el) return;
    const app = $("#app").getBoundingClientRect(), r = el.getBoundingClientRect();
    const hand = $(".hand", c), bubble = $(".bubble", c);
    hand.style.left = (r.left - app.left + r.width / 2 - 8) + "px";
    hand.style.top = (r.top - app.top + r.height / 2 - 6) + "px";
    $("span", bubble).textContent = typeof st.text === "function" ? st.text() : st.text;
    if (r.top - app.top > 150) { bubble.style.top = ""; bubble.style.bottom = (app.bottom - r.top + 12) + "px"; }
    else { bubble.style.top = (r.bottom - app.top + 46) + "px"; bubble.style.bottom = ""; }
  }
  $("#main").addEventListener("scroll", () => { if (S.tutorial < 5) placeCoach(); }, { passive: true });

  // ---------------------------------------------------------------- sound (tiny synth, starts after first touch)
  let ac = null;
  function sfx(kind) {
    if (!S.sound) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      const notes = { coin: [[1320, .05]], send: [[520, .06]], buy: [[660, .06], [990, .08]], level: [[660, .07], [880, .07], [1320, .12]] }[kind] || [];
      let t = ac.currentTime;
      for (const [f, d] of notes) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === "send" ? "triangle" : "sine"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === "coin" ? 0.025 : 0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.8;
      }
    } catch (e) { /* audio unavailable */ }
  }

  // ---------------------------------------------------------------- boot
  function afterLoad(fromCloud) {
    applySkin(); applyCity(); buildRoutes();
    for (const b of document.querySelectorAll("[data-multi]")) b.setAttribute("aria-pressed", String(b.dataset.multi === S.multi));
    const away = (Date.now() - S.lastSeen) / 1000;
    if (S.savedAt > 0 && away > 5) handleAway(away, true);
    rt.lastWall = Date.now();
    setTutorial(S.tutorial);
    if (fromCloud) switchTab(rt.tab);
  }

  document.querySelectorAll("[data-multi]").forEach((b) => b.addEventListener("click", () => {
    S.multi = b.dataset.multi;
    for (const x of document.querySelectorAll("[data-multi]")) x.setAttribute("aria-pressed", String(x === b));
    refreshCards(true);
  }));
  document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#gemChip").addEventListener("click", () => switchTab("shop"));
  $("#levelChip").addEventListener("click", () => switchTab("empire"));
  $("#settingsBtn").addEventListener("click", openSettings);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveAll(); });
  window.addEventListener("pagehide", saveAll);

  S = loadLocal() || freshState();
  afterLoad(false);
  requestAnimationFrame(frame);
  initCloud();

  // Test hook for automated checks (no effect on play).
  window.__pigeon = { get state() { return S; }, step, E };
})();
