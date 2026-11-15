// Unit tests for economy.js. Usage: node game/test.js (exit 1 on failure)
"use strict";
require("./economy.js");
const E = globalThis.ECON;
let fails = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || (typeof want === "number" && Math.abs(got - want) < 1e-9);
  if (!ok) { fails++; console.log("FAIL", name, "got", got, "want", want); }
}
const L = E.ROUTES[0];
eq("first price", E.levelCost(L, 0), 4);
eq("price lvl 10", E.levelCost(L, 10), Math.floor(4 * Math.pow(1.12, 10)));
eq("bulk 3", E.bulkCost(L, 0, 3), 4 + 4 + 5);
eq("maxAffordable 0 money", E.maxAffordable(L, 0, 0).count, 0);
eq("maxAffordable 13", E.maxAffordable(L, 0, 13).count, 3);
eq("maxAffordable cap", E.maxAffordable(L, 0, 1e300, 50).count, 50);
eq("milestones 9", E.milestonesReached(9), 0);
eq("milestones 25", E.milestonesReached(25), 2);
eq("next milestone 25", E.nextMilestone(25), 50);
eq("revenue lvl0", E.deliveryRevenue(L, 0, { upgrades: {}, globalMult: 1 }), 0);
eq("revenue lvl10", E.deliveryRevenue(L, 10, { upgrades: {}, globalMult: 1 }), 20);
eq("revenue with upgrade", E.deliveryRevenue(L, 1, { upgrades: { u1: true, u3: true }, globalMult: 1 }), 6);
eq("feathers none", E.feathersFor(0), 0);
eq("feathers NaN", E.feathersFor(NaN), 0);
eq("feathers 4 units", E.feathersFor(4 * E.PRESTIGE.unit), 2);
eq("offline negative", E.offlineEarnings(-50, 10), 0);
eq("offline 100s", E.offlineEarnings(100, 10), 500);
eq("offline capped", E.offlineEarnings(1e9, 1), Math.floor(E.OFFLINE.maxHours * 3600 * E.OFFLINE.efficiency));
eq("format 999", E.formatNumber(999), "999");
eq("format 1500", E.formatNumber(1500), "1,50 K");
eq("format rollover", E.formatNumber(999999.9), "999 K");
eq("format 1e6", E.formatNumber(1e6), "1,00 M");
eq("format 12.3M", E.formatNumber(12345678), "12,3 M");
eq("format inf", E.formatNumber(Infinity), "∞");
eq("sanitize NaN", E.sanitizeAmount(NaN), 0);
eq("sanitize neg", E.sanitizeAmount(-5), 0);
eq("sanitize str", E.sanitizeAmount("12"), 0);
eq("sanitizeInt", E.sanitizeInt(12.9, 10), 10);
eq("quest ids unique", new Set(E.QUESTS.map(q => q.id)).size, E.QUESTS.length);
eq("upgrade targets valid", E.UPGRADES.every(u => u.target === "all" || E.ROUTES.some(r => r.id === u.target)), true);
eq("quest routes valid", E.QUESTS.every(q => !q.route || E.ROUTES.some(r => r.id === q.route)), true);
// crew & eggs
const P = (id) => E.PIGEONS.find((p) => p.id === id);
eq("star scale 1", E.starScale(1), 1);
eq("star scale 3", E.starScale(3), 2);
eq("star scale clamp", E.starScale(9), 2);
eq("bob x2", E.crewRevenueMult(P("bob"), 1, true), 2);
eq("bob 3 stars", E.crewRevenueMult(P("bob"), 3, true), 3);
eq("gerard asleep", E.crewRevenueMult(P("gerard"), 1, false), 1);
eq("gerard awake", E.crewRevenueMult(P("gerard"), 1, true), 3);
eq("speed turbo", E.crewSpeedMult(P("turbo"), 1), 3);
eq("speed none", E.crewSpeedMult(P("bob"), 1), 1);
eq("kevin chance", E.crewChance(P("kevin"), 1), 0.15);
eq("roll common low", E.rollEgg("common", 0), "gerard");
eq("roll common high", E.rollEgg("common", 0.9999), "turbo");
eq("roll legendary never common", ["common"].includes(E.PIGEONS.find((p) => p.id === E.rollEgg("legendary", 0)).rarity), false);
let counts = { common: 0, rare: 0, legendary: 0 };
for (let i = 0; i < 10000; i++) counts[P(E.rollEgg("common", (i + 0.5) / 10000)).rarity]++;
eq("odds common 80%", Math.round(counts.common / 100), 80);
eq("odds rare 18%", Math.round(counts.rare / 100), 18);
eq("every pigeon reachable", new Set(Array.from({ length: 1000 }, (_, i) => E.rollEgg("common", (i + 0.5) / 1000))).size, 12);
eq("quest eggs valid", E.QUESTS.every((q) => !q.egg || E.EGGS[q.egg]), true);
require("./content.js");
const C = globalThis.CONTENT;
eq("letters have 2 choices", C.LETTERS.every((l) => l.choices.length === 2 && l.choices.every((c) => c.reward && c.outcome)), true);
eq("letter eggs valid", C.LETTERS.every((l) => l.choices.every((c) => !c.reward.egg || E.EGGS[c.reward.egg])), true);
// story graph validation
require("./story.js");
const STORY = globalThis.STORY;
const whoOk = (w) => w === "narr" || STORY.CHARACTERS[w] || E.PIGEONS.some((p) => p.id === w);
const heartWho = (h) => Object.keys(h || {}).every((w) => STORY.CHARACTERS[w] && STORY.CHARACTERS[w].hearts);
const TRIG = ["start", "manager", "level", "hatched", "prestige", "hearts"];
const SKIN_IDS = ["capucine", "augustin"]; // story skins declared in game.js SKINS
const sceneIds = STORY.SCENES.map((s) => s.id);
eq("scene ids unique", new Set(sceneIds).size, sceneIds.length);
for (const sc of STORY.SCENES) {
  const N = sc.nodes, ids = Object.keys(N), errs = [];
  if (!N[sc.start]) errs.push("start missing");
  if (!TRIG.includes(sc.trigger.type)) errs.push("bad trigger " + sc.trigger.type);
  if (sc.trigger.route && !E.ROUTES.some((r) => r.id === sc.trigger.route)) errs.push("bad trigger route");
  if (sc.trigger.after && !sceneIds.includes(sc.trigger.after)) errs.push("bad after");
  if (sc.kind === "main" && !sc.goal) errs.push("main scene without goal");
  const targets = (nd) => [nd.next, ...(nd.choices || []).map((c) => c.to), ...(nd.branch || []).map((b) => b.to)].filter(Boolean);
  for (const id of ids) {
    const nd = N[id];
    const exits = [!!nd.next, !!nd.choices, !!nd.branch, !!nd.end].filter(Boolean).length;
    if (exits !== 1) errs.push(id + ": needs exactly one exit");
    for (const to of targets(nd)) if (!N[to]) errs.push(id + " -> missing " + to);
    if (!nd.end && !nd.branch && (!nd.text || !whoOk(nd.who))) errs.push(id + ": bad speaker/text");
    if (nd.branch && nd.branch[nd.branch.length - 1].if) errs.push(id + ": branch needs a final fallback");
    for (const e of [nd.effect, ...(nd.choices || []).map((c) => c.effect)]) if (e) {
      if (!heartWho(e.hearts)) errs.push(id + ": bad hearts target");
      if (e.skin && !SKIN_IDS.includes(e.skin)) errs.push(id + ": bad skin");
    }
    for (const c of nd.choices || []) if (c.if && !heartWho(c.if.hearts)) errs.push(id + ": bad choice condition");
    if (nd.choices && !nd.choices.some((c) => !c.if)) errs.push(id + ": every choice is conditional (possible dead end)");
  }
  const seen = new Set([sc.start]), stack = [sc.start];
  while (stack.length) { const nd = N[stack.pop()]; if (!nd) continue; for (const to of targets(nd)) if (!seen.has(to)) { seen.add(to); stack.push(to); } }
  for (const id of ids) if (!seen.has(id)) errs.push(id + ": unreachable");
  if (!ids.some((id) => N[id].end && seen.has(id))) errs.push("no reachable end");
  eq("story " + sc.id + " valid " + errs.join("; "), errs.length, 0);
}
console.log(fails ? `${fails} test(s) failed` : "all economy tests passed");
process.exit(fails ? 1 : 0);
