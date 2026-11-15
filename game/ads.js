/* Pigeon Express — monetization layer.
 * Native app (Capacitor): real rewarded ads through AdMob (@capacitor-community/admob)
 * and in-app purchases through RevenueCat (@revenuecat/purchases-capacitor).
 * Web / Claude artifact: ads are simulated by the game, purchases are disabled.
 *
 * Rules built in (store policies for a game played by children):
 * - Only REWARDED ads, always opt-in: never an ad the player did not ask for.
 * - Players under 13: child-directed + non-personalized ads, purchases behind a parental gate.
 * - No paid random items: money buys gems, skins and the premium pass, never eggs.
 *
 * NOT TESTED ON A DEVICE YET: the native branch needs a Mac (iOS) or Android Studio build.
 */
(function (root) {
  "use strict";

  // Replace the test ad units and API keys with yours (see native/README.md).
  const CONFIG = {
    testing: true,
    admobRewarded: {
      ios: "ca-app-pub-3940256099942544/1712485313",     // Google's official TEST rewarded unit
      android: "ca-app-pub-3940256099942544/5224354917", // Google's official TEST rewarded unit
    },
    revenuecatKey: { ios: "", android: "" },             // appl_xxx / goog_xxx from RevenueCat
    premiumEntitlement: "premium",
  };

  // Products configured in App Store Connect / Play Console and RevenueCat.
  const PRODUCTS = {
    starter: { storeId: "pe_starter_pack", price: "1,99 €" },
    gems500: { storeId: "pe_gems_500", price: "4,99 €" },
    gems1500: { storeId: "pe_gems_1500", price: "9,99 €" },
    premium: { storeId: "pe_premium_monthly", price: "4,99 € / mois" },
  };

  let native = false, platform = "web", AdMob = null, Purchases = null, child = false, simulate = null, ready = false;

  function isNative() {
    try { return !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform()); } catch (e) { return false; }
  }

  async function init(opts) {
    child = !!(opts && opts.childDirected);
    simulate = opts && opts.simulate;
    native = isNative();
    if (!native) { ready = true; return; }
    platform = root.Capacitor.getPlatform();
    const cap = root.Capacitor, plugins = cap.Plugins || {};
    const get = (name) => plugins[name] || (typeof cap.registerPlugin === "function" ? cap.registerPlugin(name) : null);
    AdMob = get("AdMob");
    Purchases = get("Purchases");
    if (AdMob) {
      try {
        await AdMob.initialize({ initializeForTesting: CONFIG.testing, tagForChildDirectedTreatment: child, tagForUnderAgeOfConsent: child });
        // GDPR consent (EEA/UK) through Google's UMP form configured in AdMob.
        const info = await AdMob.requestConsentInfo();
        if (info && info.isConsentFormAvailable && info.status === "REQUIRED") await AdMob.showConsentForm();
      } catch (e) { /* ads stay unavailable; rewards stay reachable another way */ }
    }
    if (Purchases && CONFIG.revenuecatKey[platform]) {
      try { await Purchases.configure({ apiKey: CONFIG.revenuecatKey[platform] }); } catch (e) { Purchases = null; }
    } else { Purchases = null; }
    ready = true;
  }

  // Resolves true only when the player watched the ad to the end.
  async function rewarded(placement) {
    if (!native) return simulate ? simulate(placement) : false;
    if (!AdMob) return false;
    try {
      await AdMob.prepareRewardVideoAd({ adId: CONFIG.admobRewarded[platform], isTesting: CONFIG.testing, npa: child });
      const reward = await AdMob.showRewardVideoAd();
      return !!reward;
    } catch (e) { return false; }
  }

  // Resolves { ok, reason }. reason: "web" | "unavailable" | "cancel" | "error".
  async function purchase(key) {
    const p = PRODUCTS[key];
    if (!p) return { ok: false, reason: "error" };
    if (!native) return { ok: false, reason: "web" };
    if (!Purchases) return { ok: false, reason: "unavailable" };
    try {
      const res = await Purchases.getProducts({ productIdentifiers: [p.storeId] });
      const product = res && res.products && res.products[0];
      if (!product) return { ok: false, reason: "unavailable" };
      await Purchases.purchaseStoreProduct({ product });
      return { ok: true };
    } catch (e) { return { ok: false, reason: e && (e.userCancelled || e.code === "1") ? "cancel" : "error" }; }
  }

  async function hasPremium() {
    if (!native || !Purchases) return false;
    try { const r = await Purchases.getCustomerInfo(); return !!(r && r.customerInfo && r.customerInfo.entitlements.active[CONFIG.premiumEntitlement]); }
    catch (e) { return false; }
  }

  async function restore() {
    if (!native || !Purchases) return false;
    try { await Purchases.restorePurchases(); return true; } catch (e) { return false; }
  }

  root.Monet = { init, rewarded, purchase, hasPremium, restore, PRODUCTS,
    get native() { return native; }, get ready() { return ready; }, get childDirected() { return child; } };
})(typeof window !== "undefined" ? window : globalThis);
