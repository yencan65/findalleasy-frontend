// src/utils/vitrinSmartCore.js
// SONO SMART VITRIN ENGINE — AI aware search optimizer (HERKÜL MODU)

/**
 * Vitrin.jsx içinde çağrılır.
 * Arama terimini güvenli ve idempotent şekilde optimize eder.
 */
export function optimizeQuery(raw = "") {
  try {
    const q = String(raw || "").trim();
    if (!q) return "";

    // Basit normalization
    let clean = q.toLowerCase();

    // Gereksiz kelimeleri temizle (global & word-boundary)
    const stopPhrases = [
      "en ucuz",
      "fiyat",
      "fiyatı",
      "satın al",
      "satın",
      "al",
      "bul",
      "ara",
      "ucuz",
      "kampanya",
      "indirim",
    ];

    stopPhrases.forEach((phrase) => {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "gi");
      clean = clean.replace(re, " ");
    });

    // Fazla boşlukları temizle
    clean = clean.replace(/\s+/g, " ").trim();

    return clean || q; // Tamamen boşaldıysa orijinali geri ver
  } catch (err) {
    console.warn("optimizeQuery error:", err);
    // Her durumda string dön; vitrin patlamasın
    return String(raw || "").trim();
  }
}

/**
 * Provider sırasını AI niyetine göre düzenler.
 * Komisyonlu provider'ları öne çeker.
 * Listeyi MUTATE ETMEZ, yeni array döner.
 */
export function optimizeProviderRanking(list = []) {
  try {
    if (!Array.isArray(list) || list.length === 0)
      return Array.isArray(list) ? list.slice() : [];

    const commissionList = [];
    const normalList = [];

    for (const rawItem of list) {
      const item = rawItem || {};
      const rate = Number(item.commissionRate ?? item.commission_rate ?? 0);

      if (!isFinite(rate) || rate <= 0) {
        normalList.push(item);
      } else {
        commissionList.push(item);
      }
    }

    // Komisyonlular kendi içinde yüksekten düşüğe
    commissionList.sort((a, b) => {
      const ra = Number(a.commissionRate ?? a.commission_rate ?? 0) || 0;
      const rb = Number(b.commissionRate ?? b.commission_rate ?? 0) || 0;
      return rb - ra;
    });

    return [...commissionList, ...normalList];
  } catch (err) {
    console.warn("optimizeProviderRanking error:", err);
    return Array.isArray(list) ? list.slice() : [];
  }
}

/**
 * Vitrin sonuçlarını AI için optimize eder.
 * Hata durumunda bile sağlam bir shape döner.
 */
export function smartVitrinProcess({ query, results } = {}) {
  try {
    const safeResults = Array.isArray(results) ? results : [];
    const q = optimizeQuery(query);
    const ordered = optimizeProviderRanking(safeResults);

    return {
      query: q,
      results: ordered,
    };
  } catch (err) {
    console.error("smartVitrinProcess error:", err);
    return {
      query: String(query || "").trim(),
      results: Array.isArray(results) ? results.slice() : [],
    };
  }
}
