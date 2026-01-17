// src/utils/vitrinSmartCore.js
// VITRIN SMART CORE — kural tabanlı sıralama (masrafsız, deterministik)
//
// Temel kural:
// - Ürün ise: FİYAT zorunlu (kartta görünmeli) -> en düşük fiyat öne
// - Hizmet ise: Trusted Score/Provider Score öne -> fiyat varsa bonus, yoksa sorun değil
//
// NOT: Bu dosya sadece frontend sıralama/filtreleme yapar. Ağ çağrısı yok.

// ------------------------------------------------------------
// Query normalization (hafif)
// ------------------------------------------------------------
const STOP_PHRASES = [
  "en ucuz",
  "en uygun",
  "fiyat",
  "fiyatı",
  "fiyati",
  "satın al",
  "satin al",
  "satın",
  "satin",
  "al",
  "bul",
  "ara",
  "kampanya",
  "indirim",
];

export function optimizeQuery(raw = "") {
  try {
    const q0 = String(raw || "").trim();
    if (!q0) return "";

    // Barkod ise sakın kurcalama
    if (/^\d{8,18}$/.test(q0.replace(/\s+/g, ""))) return q0.replace(/\s+/g, "");

    let q = q0;
    for (const phrase of STOP_PHRASES) {
      const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      q = q.replace(new RegExp(`\\b${esc}\\b`, "gi"), " ");
    }
    q = q.replace(/\s+/g, " ").trim();
    return q || q0;
  } catch {
    return String(raw || "").trim();
  }
}

// ------------------------------------------------------------
// Helpers: price / trust / provider
// ------------------------------------------------------------
function toNumber(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  // "1.234,56" / "1,234.56" / "1234" gibi
  const cleaned = s
    .replace(/[^0-9.,-]/g, "")
    .replace(/(\.|,)(?=.*(\.|,))/g, "") // son ayırıcı hariç diğerlerini sil
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getPrice(item) {
  const v =
    item?.optimizedPrice ??
    item?.finalPrice ??
    item?.price ??
    item?.amount ??
    item?.bestOffer?.price ??
    item?.bestOffer?.finalPrice;
  const n = toNumber(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function getTrust(item) {
  const v =
    item?.trustScore ??
    item?.trustedScore ??
    item?.providerScore ??
    item?.provider_score ??
    item?.score ??
    item?.confidenceScore ??
    item?.confidence;

  const n = toNumber(v);
  if (!Number.isFinite(n)) return 0;

  // 0..1 aralığı gelirse 0..100'e çek
  if (n > 0 && n <= 1) return Math.round(n * 100);
  return Math.max(0, n);
}

function normProvider(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "");
}

const PRODUCT_PROVIDERS = new Set([
  "trendyol",
  "hepsiburada",
  "n11",
  "amazon",
  "amazontr",
  "akakce",
  "cimri",
  "epey",
  "google_shopping",
  "shopping",
  "barcode",
]);

function isHardProduct(item) {
  try {
    const qr = String(item?.qrCode || item?.barcode || item?.gtin || "").replace(/\s+/g, "");
    if (/^\d{8,18}$/.test(qr)) return true;

    const p = normProvider(item?.providerFamily || item?.providerKey || item?.provider || item?.source);
    for (const key of PRODUCT_PROVIDERS) {
      if (p.includes(key)) return true;
    }

    const cat = normProvider(item?.category || item?.type || item?.vertical || "");
    if (/(product|shopping|ecommerce|market|urun|ürün|niche)/i.test(cat)) return true;

    return false;
  } catch {
    return false;
  }
}

function getLastCategoryHint() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return "";
    return String(window.localStorage.getItem("lastQueryCategory") || "").trim();
  } catch {
    return "";
  }
}

function inferMode(query, results) {
  // 1) SearchBar'ın bıraktığı ipucu
  const hint = normProvider(getLastCategoryHint());
  if (hint) {
    if (/(product|shopping|niche|electronics|electronic)/i.test(hint)) return "product";
    if (/(travel|hotel|car|insurance|estate|health|education)/i.test(hint)) return "service";
  }

  // 2) Barkod: ürün
  const q = String(query || "").replace(/\s+/g, "").trim();
  if (/^\d{8,18}$/.test(q)) return "product";

  // 3) Query heuristics
  const ql = String(query || "").toLowerCase();
  if (/(otel|uçak|ucak|bilet|sigorta|kasko|rent|kirala|kira|emlak|konut|hastane|doktor|eğitim|egitim)/i.test(ql)) {
    return "service";
  }

  // 4) Results heuristics (çok hafif)
  const arr = Array.isArray(results) ? results : [];
  if (arr.length) {
    const hardProductCount = arr.filter(isHardProduct).length;
    if (hardProductCount / arr.length >= 0.5) return "product";
  }

  // Default: service daha güvenli (fiyatı olmayan hizmetleri boşaltmayız)
  return "service";
}

// ------------------------------------------------------------
// Sorting
// ------------------------------------------------------------
function sortProduct(a, b) {
  const pa = getPrice(a);
  const pb = getPrice(b);
  // fiyatı olmayan zaten filtrelenmiş olmalı, ama yine de güvenlik
  if (pa == null && pb == null) return getTrust(b) - getTrust(a);
  if (pa == null) return 1;
  if (pb == null) return -1;
  if (pa !== pb) return pa - pb;
  return getTrust(b) - getTrust(a);
}

function sortService(a, b) {
  const ta = getTrust(a);
  const tb = getTrust(b);
  if (ta !== tb) return tb - ta;

  // Trust eşitse: fiyatı varsa küçük olan öne (varsa)
  const pa = getPrice(a);
  const pb = getPrice(b);
  if (pa == null && pb == null) return 0;
  if (pa == null) return 1;
  if (pb == null) return -1;
  if (pa !== pb) return pa - pb;
  return 0;
}

/**
 * Geriye dönük uyumluluk: eski isim korunuyor.
 * (Artık komisyon bazlı sıralama YOK.)
 */
export function optimizeProviderRanking(list = []) {
  return Array.isArray(list) ? list.slice() : [];
}

/**
 * Vitrin.jsx burayı çağırır.
 */
export function smartVitrinProcess({ query, results } = {}) {
  try {
    const safeResults = Array.isArray(results) ? results.filter(Boolean) : [];
    const q = optimizeQuery(query);

    // Ürün kuralı: hard-product ise fiyat yoksa gösterme
    const cleaned = safeResults.filter((it) => {
      if (!isHardProduct(it)) return true;
      return getPrice(it) != null;
    });

    const mode = inferMode(q || query, cleaned);

    const ranked = cleaned.slice();
    if (mode === "product") {
      // Ürün modunda fiyat zorunlu: (hard-product filtre zaten yaptı) + fiyatı olanları öne
      ranked.sort(sortProduct);

      // Ürün modunda da hiç fiyatlı item kalmadıysa: boş dön (kural gereği)
      const anyPriced = ranked.some((it) => getPrice(it) != null);
      if (!anyPriced) {
        return { query: q, results: [] };
      }
    } else {
      ranked.sort(sortService);
    }

    return { query: q, results: ranked };
  } catch (err) {
    console.warn("smartVitrinProcess error:", err);
    return {
      query: String(query || "").trim(),
      results: Array.isArray(results) ? results.slice() : [],
    };
  }
}
