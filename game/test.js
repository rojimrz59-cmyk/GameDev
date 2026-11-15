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
console.log(fails ? `${fails} test(s) failed` : "all economy tests passed");
process.exit(fails ? 1 : 0);
