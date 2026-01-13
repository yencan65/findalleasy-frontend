// src/components/Vitrin.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProviderIconFinal } from "../utils/providerIcons";
import { sendClick } from "../api/click";
import { buildAffiliateRedirectUrl } from "../utils/affiliateRedirect";
import { useAuth } from "../hooks/useAuth";
import { getDeviceId } from "../utils/device";
import { smartVitrinProcess } from "../utils/vitrinSmartCore";
import { getLastQuery } from "../utils/searchBridge";
import { pickImportantBadges } from "../utils/badgeSelect";
import BadgePanel from "./BadgePanel";
import VerifiedBadge from "./VerifiedBadge";
import "./Vitrin.css";
import sonoIcon from "../sono-assets/sono-face.svg";
import { runUnifiedSearch } from "../utils/searchBridge";
import { API_BASE } from "../utils/api";

// Yeni ama şu an UI’de zorunlu olmayan etiket sistemi
import BadgeTag from "./BadgeTag";
import { BADGE_LABELS } from "../utils/badgeMap";

// ✅ Vitrin.jsx — ₺0 utancını kapat (minimal, güvenli patch)
//
// 1) getFinalPrice: 0 veya negatifse null dön
export function getFinalPrice(item) {
  const v = item?.optimizedPrice ?? item?.finalPrice ?? item?.price ?? null;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v ?? "").replace(/[^0-9.,]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

// 2) Provider label: providerFamily || provider || providerKey (UNKNOWN'u kes)
export function getProviderLabel(item) {
  const raw = String(
    item?.providerFamily ||
      item?.provider ||
      item?.providerKey ||
      item?.provider_key ||
      ""
  ).trim();
  if (!raw) return "";
  if (raw.toLowerCase() === "unknown") return "";
  return raw;
}

// ============================================================
// 🔥 Evrensel Herkül Click Redirect Handler (korunuyor)
// ============================================================
async function handleAffiliateRedirect(item, source = "unknown", user = null) {
  try {
    if (!item) return;

    // ✅ New canonical redirect path (S16/S200): backend generates clickId, injects subid, stores click, then 302.
    // ZERO DELETE: eski sendClick + direct url fallback korunuyor.
    // ✅ No-price items (seed-only / price-on-seller): go direct to provider page
    const price = getFinalPrice(item);
    if (price == null) {
      const direct =
        item?.affiliateUrl ||
        item?.deeplink ||
        item?.finalUrl ||
        item?.originUrl ||
        item?.url;
      if (direct) {
        window.open(direct, "_blank", "noopener,noreferrer");
        // fire-and-forget internal click analytics (if enabled)
        try {
          await sendClick({ item, source, user: user?.id || null });
        } catch {}
        return;
      }
    }

    const outUrl = buildAffiliateRedirectUrl(item, user?.id || null);
    if (outUrl) {
      window.open(outUrl, "_blank", "noopener,noreferrer");
      // fire-and-forget internal click analytics (if enabled)
      try {
        await sendClick({ item, source, user: user?.id || null });
      } catch {}
      return;
    }

    // ---- Fallback (legacy) ----
    await sendClick({ item, source, user: user?.id || null });

    const affiliateBase = item.affiliateUrl || item.deeplink || item.finalUrl || item.originUrl;
    const targetUrl = affiliateBase || item.url;
    if (!targetUrl) return;

    // Eski yöntem: merchant url’e click_id eklemeye çalışır (her merchant desteklemez)
    const clickId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
    const url = new URL(targetUrl, window.location.origin);
    url.searchParams.set("click_id", clickId);

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error("Affiliate redirect error:", err);
    // last resort
    try {
      const u = item?.affiliateUrl || item?.deeplink || item?.finalUrl || item?.originUrl || item?.url;
      if (u) window.open(u, "_blank", "noopener,noreferrer");
    } catch {}
  }
}

// ============================================================
// 🧠 Relevance Guard (frontend) — yanlış kartları ekrandan kes
// ============================================================

const TR_STOP = new Set([
  "ve",
  "ile",
  "için",
  "icin",
  "en",
  "çok",
  "cok",
  "uygun",
  "ucuz",
  "fiyat",
  "kampanya",
  "indirim",
  "orijinal",
  "resmi",
  "satıcı",
  "satici",
  "ürün",
  "urun",
  "hizmet",
  "satın",
  "satin",
  "al",
  "alma",
  "almak",
  "bul",
  "bulun",
  "bana",
  "lütfen",
  "lutfen",
]);

function normText(s) {
  try {
    return String(s || "")
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function tokenize(s) {
  const n = normText(s);
  if (!n) return [];
  const parts = n.split(" ").filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (p.length <= 1) continue;
    if (TR_STOP.has(p)) continue;
    out.push(p);
  }
  return out.slice(0, 16);
}

function itemHaystack(item) {
  try {
    return normText(
      [
        item?.title,
        item?.name,
        item?.provider,
        item?.providerKey,
        item?.providerFamily,
        item?.source,
        item?.category,
        item?.type,
        item?.desc,
        item?.description,
        Array.isArray(item?.tags) ? item.tags.join(" ") : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  } catch {
    return "";
  }
}

function isRelevantItem(item, q) {
  if (!item) return false;
  const qNorm = normText(q);
  if (!qNorm) return true;

  const hay = itemHaystack(item);
  if (!hay) return false;

  if (hay.includes(qNorm)) return true;

  const qTokens = tokenize(qNorm);
  if (!qTokens.length) return true;

  const tTokens = new Set(tokenize(hay));
  let hit = 0;
  for (const qt of qTokens) if (tTokens.has(qt)) hit++;

  if (qTokens.length === 1) return hay.includes(qTokens[0]);

  const ratio = hit / Math.max(1, qTokens.length);
  return ratio >= 0.4;
}

function filterItemsForQuery(items, q) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : items ? [items] : [];
  if (!arr.length) return arr;

  const out = arr.filter((it) => isRelevantItem(it, q));
  return out; // Hepsi giderse boş dönmek, alakasız göstermemekten iyidir.
}

// ============================================================
// 🔥 ANA VİTRİN BİLEŞENİ
// ============================================================
export default function Vitrin() {
  const { t, i18n } = useTranslation();
  const { user, isLoggedIn } = useAuth();

  const [best, setBest] = useState([]);
  const [smart, setSmart] = useState([]);
  const [others, setOthers] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);

  const initialLastQuery =
    getLastQuery() ||
    ((typeof window !== "undefined" &&
      window.localStorage &&
      window.localStorage.getItem("lastQuery")) ||
      "");

  const [lastQuery, setLastQuery] = useState(initialLastQuery);
  const [highlight, setHighlight] = useState(false);

  const [smartIndex, setSmartIndex] = useState(0);
  const [otherIndex, setOtherIndex] = useState(0);
  const [hoverSmart, setHoverSmart] = useState(false);
  const [hoverOther, setHoverOther] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [activeCouponCode, setActiveCouponCode] = useState("");
  const [couponApplyMsg, setCouponApplyMsg] = useState("");

  // ============================================================
  // 🔒 Session / UUID helpers (ZERO-CRASH)
  // ============================================================
  function safeUUID() {
    try {
      const c = typeof window !== "undefined" ? window.crypto : null;
      if (c && typeof c.randomUUID === "function") return c.randomUUID();
    } catch {}
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getSessionId() {
    try {
      const k = "fae_session_id";
      if (typeof window === "undefined" || !window.localStorage) return "";
      let sid = window.localStorage.getItem(k);
      if (!sid) {
        const base = String(getDeviceId() || "anon").slice(0, 64);
        sid = `s_${base}_${safeUUID()}`.slice(0, 96);
        window.localStorage.setItem(k, sid);
      }
      return String(sid).slice(0, 128);
    } catch {
      return "";
    }
  }

  function getBackendBase() {
    // Single source of truth (prod-safe)
    return API_BASE || "";
  }

  function getOptionalAuthHeader() {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      const token =
        window.localStorage.getItem("token") ||
        window.localStorage.getItem("jwt") ||
        window.localStorage.getItem("access_token") ||
        window.localStorage.getItem("fae_jwt") ||
        null;
      if (!token) return null;
      return `Bearer ${String(token).trim()}`;
    } catch {
      return null;
    }
  }

  function getOptionalApiKey() {
    try {
      const apiKey = import.meta.env.VITE_API_KEY || "";
      return apiKey ? String(apiKey) : "";
    } catch {
      return "";
    }
  }

  // ============================================================
  // ✅ Headers (tek kaynak) — x-api-key + session + client + locale (+ auth)
  // ============================================================
  function buildHeaders(extra = {}) {
    const apiKey = import.meta.env.VITE_API_KEY || "";
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      "x-session-id": getSessionId(),
      "x-client-id": String(getDeviceId() || "").slice(0, 64),
      "x-locale": String(i18n.language || "tr").slice(0, 10),
      ...extra,
    };

    const auth = getOptionalAuthHeader();
    if (auth) headers["authorization"] = auth;

    return headers;
  }

  // ============================================================
  // Provider resolver — backend bazen provider yerine providerKey yolluyor.
  // UI'de UNKNOWN görmek, güveni öldürür. Burada toparlıyoruz.
  // ============================================================
  function resolveProvider(item) {
    const p =
      item?.provider ||
      item?.providerKey ||
      item?.providerFamily ||
      item?.source ||
      item?.adapterSource ||
      "unknown";
    return String(p || "unknown").toLowerCase().trim() || "unknown";
  }

  // ============================================================
  // Kupon Uygulama (mantık korunuyor)
  // ============================================================
  async function applyCouponGlobal() {
    setCouponApplyMsg("");

    const code = (couponCodeInput || "").trim().toUpperCase();
    if (!code) {
      setCouponApplyMsg(t("wallet.enterCoupon", { defaultValue: "Lütfen bir kupon kodu gir." }));
      return;
    }

    if (!isLoggedIn || !user || !user.id) {
      setCouponApplyMsg(
        t("wallet.mustLoginCoupon", { defaultValue: "Kupon kullanmak için giriş yapmalısın." })
      );
      return;
    }

    try {
      const BASE = getBackendBase();
      const r = await fetch(`${BASE}/api/coupons/apply`, {
        method: "POST",
        headers: buildHeaders({}),
        body: JSON.stringify({ code, userId: user.id }),
      });

      const j = await r.json().catch(() => ({}));

      if (!j.ok || !j.valid) {
        setActiveCouponCode("");
        try {
          localStorage.removeItem("activeCoupon");
        } catch {}
        setCouponApplyMsg(
          j.message || t("wallet.couponInvalid", { defaultValue: "Kupon geçersiz veya kullanılamaz." })
        );
        return;
      }

      setActiveCouponCode(j.code);
      try {
        localStorage.setItem("activeCoupon", j.code);
      } catch {}

      setCouponApplyMsg(
        t("wallet.couponAppliedCashback", {
          defaultValue:
            "Kupon uygulandı. Bu tıklama sonrasında alışverişi tamamlarsan tutar cashback olarak cüzdanına eklenecek.",
        })
      );
    } catch (e) {
      setActiveCouponCode("");
      try {
        localStorage.removeItem("activeCoupon");
      } catch {}
      setCouponApplyMsg(
        e?.message ||
          t("wallet.couponError", { defaultValue: "Kupon doğrulanırken bir hata oluştu." })
      );
    }
  }

  // ============================================================
  //   🔥 Rezervasyon Motoru — S10.2 Affiliate Redirect Standardı
  // ============================================================
  async function reserve(item, source = "unknown") {
    try {
      if (!item) return;

      // ✅ canonical URL picker + backend click-id injection
      const redirectUrl = buildAffiliateRedirectUrl(item, user?.id || user?._id || null, {
        source,
      });

      if (!redirectUrl) {
        console.warn("reserve: redirectUrl üretilemedi", item);
        return;
      }

      // Popup blocked? -> fallback same-tab
      const w = window.open(redirectUrl, "_blank", "noopener,noreferrer");
      if (!w) {
        window.location.href = redirectUrl;
      }

      try {
        window.dispatchEvent(
          new CustomEvent("fie:click", {
            detail: {
              provider: resolveProvider(item),
              price: item.optimizedPrice || item.finalPrice || item.price,
              source,
              query: localStorage.getItem("lastQuery") || "",
            },
          })
        );
      } catch {}
    } catch (e) {
      console.error("reserve hata:", e);
    }
  }

  // ============================================================
  //   🔥 Global arama tetikleyicisi
  // ============================================================
  useEffect(() => {
    async function unifiedHandleSearch(e) {
      const q = e.detail?.query?.trim();
      if (!q) return;

      // 🔒 Dedupe: aynı sorgu üst üste gelirse (çift event / çift tetik) tek sefer çalışsın
      const now = Date.now();
      try {
        if (typeof window !== "undefined") {
          const lastQ = window.__fae_lastHandledQuery || "";
          const lastAt = Number(window.__fae_lastHandledAt || 0);
          if (lastQ === q && now - lastAt < 1500) return;
          window.__fae_lastHandledQuery = q;
          window.__fae_lastHandledAt = now;
        }
      } catch {}

      try {
        if (typeof window !== "undefined") {
          if (window.localStorage) window.localStorage.setItem("lastQuery", q);
          window.__fae_last_query = q;
        }
      } catch {}

      setLastQuery(q);
      loadVitrine(true);
    }

    function handleFIE(e) {
      const cards = e.detail?.cards || {};
      if (!cards) return;

      const bestArr = normalizeArray(
        cards.best ||
          (Array.isArray(cards.best_list) ? cards.best_list[0] : null) ||
          cards.best_list
      );
      const smartArr = []; // HARD: kapalı
      const othersArr = []; // HARD: kapalı

      setBest(bestArr);
      setSmart([]);
      setOthers(othersArr);
    }

    const refreshHandler = () => loadVitrine(true);

    if (typeof window !== "undefined") {
      window.addEventListener("fae.vitrine.search", unifiedHandleSearch);
      window.addEventListener("fae.vitrine.refresh", refreshHandler);
      window.addEventListener("fie:vitrin", handleFIE);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("fae.vitrine.search", unifiedHandleSearch);

        window.removeEventListener("fae.vitrine.refresh", refreshHandler);
        window.removeEventListener("fie:vitrin", handleFIE);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Helper fonksiyonlar
  // ============================================================
  function safeNumber(value, fallback = null) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeArray(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return [raw];
  }

  function getSafeTrust(item) {
    const v =
      typeof item?.trustScore === "number" && item.trustScore >= 0
        ? item.trustScore
        : 0.75;
    return Math.round(Math.min(1, Math.max(0, v)) * 100);
  }

  function getSafeRating(item) {
    const v =
      typeof item?.rating === "number" && item.rating > 0
        ? Math.min(5, item.rating)
        : null;
    return v !== null ? Math.round(v * 10) / 10 : null;
  }

  function getSafeQuality5(item) {
    const v =
      typeof item?.qualityScore5 === "number" && item.qualityScore5 > 0
        ? Math.min(5, item.qualityScore5)
        : null;
    return v !== null ? Math.round(v * 10) / 10 : null;
  }

  function getSummaryText(item) {
    if (!item) return "";
    const pick = (...vals) => {
      for (const v of vals) {
        if (typeof v === "string" && v.trim()) return v.trim();
        if (Array.isArray(v)) {
          const s = v
            .map((x) => (typeof x === "string" ? x.trim() : ""))
            .filter(Boolean)
            .join(" • ");
          if (s) return s;
        }
      }
      return "";
    };

    const raw = item?.raw || item?._raw || item?.meta || null;

    let s = pick(
      item?.summary,
      item?.description,
      item?.desc,
      item?.snippet,
      raw?.snippet,
      raw?.description,
      raw?.summary,
      raw?.about_this_result?.snippet,
      raw?.about_this_result?.description,
      raw?.rich_snippet?.top?.extensions,
      raw?.extensions,
      raw?.highlights
    );

    s = String(s || "").replace(/\s+/g, " ").trim();
    if (!s) return "";
    if (s.length > 240) s = s.slice(0, 237).trim() + "…";
    return s;
  }



  // ✅ (patch) İçeride isim çakışmasın diye alias
  function getFinalPriceLegacy(item) {
    return getFinalPrice(item);
  }

  function resolveImage(item) {
    if (!item) return null;

    const keys = [
      "image",
      "imageUrl",
      "imageURL",
      "img",
      "imgUrl",
      "imgURL",
      "thumbnail",
      "thumbnailUrl",
      "thumb",
      "photo",
      "photoUrl",
      "photoURL",
      "picture",
      "pictureUrl",
      "productImage",
      "productImageURL",
      "productImg",
      "mediaUrl",
      "mediaURL",
    ];

    for (const k of keys) {
      if (typeof item[k] === "string" && item[k].trim()) return item[k];
    }

    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (Array.isArray(item.photos) && item.photos.length > 0) return item.photos[0];

    if (item.media) {
      if (typeof item.media.image === "string") return item.media.image;
      if (Array.isArray(item.media.images) && item.media.images.length)
        return item.media.images[0];
    }

    return null;
  }

  function Tag({ children }) {
    return (
      <div className="px-2 py-1 text-xs rounded-xl border border-[#d4af37]/40 text-[#f9e7a5] bg-black/30 backdrop-blur-[3px]">
        {children}
      </div>
    );
  }

  // ============================================================
  //   🔥 VİTRİN MOTORU — stabil dinamik vitrin
  // ============================================================
  async function loadVitrine(reset = false) {
    if (typeof window !== "undefined" && window.__vitrineLoading) return;
    if (typeof window !== "undefined") window.__vitrineLoading = true;

    const OTHERS_ENABLED = false; // HARD

    try {
      setLoading(true);

      const queryForBody = getLastQuery() || lastQuery || "";

      const dispatchVitrineResults = (status, extra = {}) => {
        try {
          if (typeof window === "undefined") return;
          window.dispatchEvent(
            new CustomEvent("fae.vitrine.results", {
              detail: {
                status,
                query: queryForBody,
                ...extra,
              },
            })
          );
        } catch {}
      };

      const body = {
        query: queryForBody,
      q: queryForBody,
        region:
          (typeof window !== "undefined" &&
            window.localStorage &&
            window.localStorage.getItem("region")) ||
          "TR",
        locale: i18n.language || "tr",
        cursor: reset ? 0 : cursor,
        sessionId: getSessionId(),
      };

      const BASE = getBackendBase();

      const headers = buildHeaders({});

      const r = await fetch(`${BASE}/api/vitrin/dynamic`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setBest([]);
        setSmart([]);
        setOthers([]);
        dispatchVitrineResults("error", { httpStatus: r.status });
        return;
      }

      // Health mode gibi özel payload’lar varsa en azından boş kalmasın
      if (j && j.ok && j.mode === "health" && Array.isArray(j.items)) {
        const items = filterItemsForQuery(j.items, body.query);
        const bestOne = items[0] ? [items[0]] : [];
        if (reset) {
          setBest(bestOne);
          setSmart([]);
          setOthers([]);
          setCursor(0);
        } else {
          setBest((p) => (p.length ? p : bestOne));
        }
        dispatchVitrineResults(bestOne.length ? "success" : "empty", {
          count: items.length,
          bestCount: bestOne.length,
          mode: "health",
        });
        return;
      }

      if (j && j.ok) {
        const ensureArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

        // ✅ cards varsa sadece ona bakma → merge et (top-level + cards)
        const src =
          j && j.cards && typeof j.cards === "object" && !Array.isArray(j.cards)
            ? { ...j.cards, ...j }
            : j;

        // ✅ best boşsa best_list’ten doldur
        let bestArr = ensureArray(src.best);
        if (!bestArr.length && Array.isArray(src.best_list) && src.best_list.length)
          bestArr = ensureArray(src.best_list[0]);
        if (!bestArr.length) bestArr = ensureArray(src.best_list);

        let smartArr = []; // 🔒 smart devredışı
        let othersArr = OTHERS_ENABLED ? ensureArray(src.others) : [];

        // 🔥 alaka filtresi
        bestArr = filterItemsForQuery(bestArr, body.query);
        smartArr = filterItemsForQuery(smartArr, body.query);
        othersArr = filterItemsForQuery(othersArr, body.query);

        try {
          const fallbackItems = ensureArray(src.items || src.results);
        const allItems = [...bestArr, ...fallbackItems].filter(Boolean);
          const allFiltered = filterItemsForQuery(allItems, body.query);

          const processed = smartVitrinProcess({
            query: body.query,
            results: allFiltered,
          });

          if (processed && Array.isArray(processed.results) && processed.results.length) {
            const [pBest, ...rest] = processed.results;

            const smartCount = smartArr.length || 4;
            const pSmart = rest.slice(0, smartCount);

            const bestCandidate = pBest && isRelevantItem(pBest, body.query) ? pBest : null;
            if (bestCandidate) bestArr = [bestCandidate];

            if (pSmart.length) smartArr = filterItemsForQuery(pSmart, body.query);

            if (OTHERS_ENABLED) {
              const pOthers = rest.slice(smartCount);
              if (pOthers.length) othersArr = filterItemsForQuery(pOthers, body.query);
            }
          }
        } catch (e) {
          console.warn("smartVitrinProcess hata:", e);
        }

        if (reset) {
          setBest(bestArr);
          setSmart([]);
          setOthers([]);
          setCursor(0);
        } else {
          setBest((p) => (p.length ? p : bestArr));
          setSmart((p) => (p.length ? p : smartArr));
          setOthers([]);
        }

        const totalCount = (bestArr?.length || 0) + (smartArr?.length || 0) + (othersArr?.length || 0);
        dispatchVitrineResults(totalCount ? "success" : "empty", {
          count: totalCount,
          bestCount: bestArr?.length || 0,
          smartCount: smartArr?.length || 0,
          othersCount: othersArr?.length || 0,
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sono:best-updated", {
              detail: { best: bestArr[0], query: body.query },
            })
          );
        }

        if (j.nextCursor !== undefined) setCursor(j.nextCursor);
      } else {
        setBest([]);
        setSmart([]);
        setOthers([]);
        dispatchVitrineResults("empty", { count: 0 });
      }
    } catch (err) {
      console.error("Vitrin yüklenirken hata:", err);
      setBest([]);
      setSmart([]);
      setOthers([]);
      dispatchVitrineResults("error", { error: String(err?.message || err) });
    } finally {
      if (typeof window !== "undefined") window.__vitrineLoading = false;
      setLoading(false);
    }
  }

  // ============================================================
  //   🔥 Global yenileme
  // ============================================================
  useEffect(() => {
    const handler = () => loadVitrine(true);
    if (typeof window !== "undefined") window.addEventListener("fae.vitrine.refresh", handler);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("fae.vitrine.refresh", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVitrine(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVitrine(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Interaction logger
  async function logInteraction(type, item) {
    try {
      const BASE = getBackendBase();
      await fetch(`${BASE}/api/vitrin/interactions`, {
        method: "POST",
        headers: buildHeaders({}),
        body: JSON.stringify({
          userId:
            (typeof window !== "undefined" &&
              window.localStorage &&
              window.localStorage.getItem("userId")) ||
            "anon",
          query:
            (typeof window !== "undefined" &&
              window.localStorage &&
              window.localStorage.getItem("lastQuery")) ||
            "",
          cardType: type,
          category: item?.category || "",
          region:
            (typeof window !== "undefined" &&
              window.localStorage &&
              window.localStorage.getItem("region")) ||
            "TR",
        }),
      });
    } catch {}
  }

  function InnerCard({ item, onClick }) {
    if (!item) return null;

    const safeTitle =
      typeof item?.title === "string" && item.title.trim() ? item.title : "—";

    // icon için normalize provider key
    const providerKey = resolveProvider(item);

    // ✅ (patch) ekranda gösterilecek provider label (UNKNOWN kesilir)
    const prov = getProviderLabel(item);

    // ✅ (patch) fiyat: 0/negatif/null => gösterme
    const price = getFinalPriceLegacy(item);

    const icon = getProviderIconFinal(providerKey);
    const img = resolveImage(item);

    const rating = getSafeRating(item);
    const q5 = getSafeQuality5(item);
    const trust = getSafeTrust(item);

    const summary = getSummaryText(item);

    return (
      <div
        onClick={onClick}
        className="
          w-full
          max-w-[670px]
          mx-auto
          bg-black/40 rounded-2xl p-3 sm:p-5
          border border-[#d4af37]/35
          shadow-[0_0_22px_rgba(212,175,55,0.25)]
          backdrop-blur-xl
          transition-all duration-300
          hover:bg-black/55 hover:border-[#d4af37]/70
          hover:shadow-[0_0_40px_rgba(212,175,55,0.45)]
          cursor-pointer
          flex flex-row gap-3 sm:gap-5 items-center
        "
      >
        <div className="w-[96px] h-[96px] sm:w-[160px] sm:h-[160px] rounded-xl overflow-hidden flex-none bg-black/40 flex items-center justify-center">
          {img ? (
            <img src={img} alt={safeTitle} className="w-full h-full object-contain" />
          ) : (
            <span className="text-white/25 text-sm">
              {t("common.noImage", { defaultValue: "Görsel yok" })}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex flex-row justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[1rem] font-medium text-white/95 leading-tight">
                {safeTitle}
              </div>

              {(icon || prov) ? (
                <div className="mt-2 flex items-center gap-2 text-[0.75rem] text-white/60">
                  {icon && <img src={icon} className="w-4 h-4" alt="" />}
                  {prov ? <span className="uppercase tracking-wide">{prov}</span> : null}
                </div>
              ) : null}

              <div
                className="mt-2 text-[12px] sm:text-[13px] text-white/70 leading-snug"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {summary || t("common.summaryFallback", { defaultValue: "Özet bilgi yok" })}
              </div>
            </div>

            {price != null ? (
              <div className="flex flex-col items-end min-w-[80px]">
                <span className="text-[#f5d76e] font-semibold text-[1.1rem]">
                  ₺{price.toLocaleString("tr-TR")}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-end min-w-[80px]">
                <span className="text-white/35 text-[0.85rem]">{t("common.noPrice", { defaultValue: "Fiyat satıcıda" })}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-[0.75rem] text-[#f9e7a5] mt-4">
            <VerifiedBadge />
            {rating !== null && <span>⭐ {rating}/5</span>}
            {q5 !== null && <span>✔ {q5}/5</span>}
            <span>🛡 {trust}/100</span>
          </div>
        </div>
      </div>
    );
  }

  const bestItem = best && best.length ? best[0] : null;

  return (
    <section className="w-full flex justify-center mt-0 mb-6 px-2 sm:px-3 lg:px-0">
      <div className="w-full max-w-6xl flex justify-center">
        <div className="flex flex-col h-full md:-translate-y-[5%] transition-all duration-300">
          <h2
            className={`
              text-sm sm:text-base font-semibold text-[#f9e7a5]
              flex items-center gap-2 mb-3 fae-title-offset
              ${highlight ? "animate-pulse-soft" : ""}
            `}
          >
            {/* Başlık bilerek boş; sadece alt kart öne çıkacak */}
          </h2>

          {bestItem ? (
            <InnerCard
              item={bestItem}
              compact={true}
              onClick={() => {
                logInteraction("best", bestItem);
                reserve(bestItem, "best");
              }}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 text-xs text-white/40 p-4 flex items-center justify-center h-full min-h-[160px]">
              {t("trigger.customShowcase", { defaultValue: "Kişisel vitrinini hazırlıyorum..." })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
