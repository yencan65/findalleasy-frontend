// src/boot/trinklinkBoot.js
// TrinkLink integration (ReklamAction) - CSP-friendly (no inline JS).
// Sets global config then injects remote script.
// Notes:
// - trnk_aff_sub: optional subid (we use a stable pseudonymous session id)
// - trnk_source: optional traffic source label
// - trnk_excluded: optional offer ids to exclude, e.g. [43222, 24333]

(function trinklinkBoot() {
  try {
    // 1) Stable pseudonymous subId (no PII)
    const KEY = "fae_trnk_sub";
    let sid = "";
    try {
      sid = localStorage.getItem(KEY) || "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(KEY, sid);
      }
    } catch (_) {
      sid = "";
    }

    // 2) Global TrinkLink vars (must exist BEFORE trinklink.js loads)
    window.trnk_aff_id = 40801;          // your affiliate id (from TrinkLink panel)
    window.trnk_aff_sub = sid;           // optional: sub id
    window.trnk_source = "findalleasy";  // optional: source label
    window.trnk_excluded = [];           // optional: excluded offer ids

    // 3) Inject remote TrinkLink library
    const s = document.createElement("script");
    s.src = "https://trinklink1.s3.amazonaws.com/trinklink.js";
    s.async = true;
    s.onload = () => (window.__FAE_TRNK_READY = true);
    s.onerror = () => console.warn("[TrinkLink] script failed to load (blocked or network issue).");
    document.head.appendChild(s);
  } catch (e) {
    console.warn("[TrinkLink] boot error:", e);
  }
})();
