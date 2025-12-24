// src/utils/searchBridge.js
// SONO SEARCH BRIDGE — Tek merkezden vitrin tetikleyici (HERKÜL MODU)

// Backend tabanı — diğer yerlerle aynı mantık
const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// =============================
// EKLENDİ → Vitrin API endpoint
// =============================
const VITRINE_ENDPOINT = "/api/vitrine";



// Eğer sende /vitrine/search ise buraya yaz:
// const VITRINE_ENDPOINT = "/vitrine/search";

// Mikro kilit süresi
const LOCK_MS = 400;

// localStorage key’leri
const LAST_QUERY_KEY = "lastQuery";
const LAST_SOURCE_KEY = "lastQuerySource";
const LAST_AT_KEY = "lastQueryAt"; // ek: son arama zamanı (ms)

// ------------------------------------------------------------
//  Yardımcılar
// ------------------------------------------------------------
function normalizeQuery(q) {
  const clean = String(q || "").trim();
  return clean || "";
}

function setLastQuery(query, source) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const q = normalizeQuery(query);
    if (!q) return;

    window.localStorage.setItem(LAST_QUERY_KEY, q);
    window.localStorage.setItem(LAST_AT_KEY, String(Date.now()));

    if (source) {
      window.localStorage.setItem(LAST_SOURCE_KEY, String(source));
    }
  } catch {
    // localStorage patlarsa da sistem çökmemeli
  }
}

function getLockFlag() {
  if (typeof window === "undefined") return false;
  return !!window.__vitrineSearchLock;
}

function setLockFlag() {
  if (typeof window === "undefined") return;
  window.__vitrineSearchLock = true;
  setTimeout(() => {
    try {
      window.__vitrineSearchLock = false;
    } catch {}
  }, LOCK_MS);
}

// fetch’e timeout ekleyen ufak yardımcı
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {  
  // =============================
  // EKLENDİ → Timeout 25s yapıldı
  // =============================

  if (typeof AbortController === "undefined") {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const id = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    // =============================================
    // EKLENDİ → AbortError UI'yı kırmayacak şekilde
    // =============================================
    const msg = String(err?.message || "").toLowerCase();
    const isAbort =
      err?.name === "AbortError" ||
      msg.includes("abort") ||
      msg.includes("canceled");

    if (isAbort) {
      console.warn("fetchWithTimeout → Abort (timeout) — devam ediliyor.");
      return { ok: false, aborted: true };
    }

    throw err;
  } finally {
    clearTimeout(id);
  }
}

/**
 * AI / ses / manuel arama / QR nereden gelirse gelsin
 * vitrin motoruna tek kapıdan gider.
 *
 * Not: Hiçbir eski davranış bozulmuyor.
 * Sadece ekstra opsiyonlar eklendi (region, city, meta vs.).
 */
export async function runUnifiedSearch(
  query,
  {
    source = "manual",
    locale = "tr",
    userId = null,

    region = null,
    city = null,
    categoryHint = null,
    meta = null,

    skipVitrin = false,
    skipAI = false,
  } = {}
) {
  const clean = normalizeQuery(query);
  if (!clean) return null;

  // 1) Vitrine query gönder (mevcut davranış KORUNUYOR)
  if (!skipVitrin) {
    pushQueryToVitrine(clean, source);
  }

  // Sadece vitrin tetiklemek için kullanılıyorsa
  if (skipAI) return null;

  // 2) AI pipeline'a gönder (mevcut davranış)
  let aiData = null;

  try {
    const body = {
      message: clean,
      locale,
      userId,
    };

    if (region) body.region = region;
    if (city) body.city = city;
    if (categoryHint) body.categoryHint = categoryHint;
    if (meta && typeof meta === "object") body.meta = meta;

    const res = await fetchWithTimeout(`${API}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res?.ok) {
      aiData = await res.json().catch(() => null);
    }

    if (aiData?.cards?.length) {
      pushCardsToVitrine(aiData.cards, "sono-ai");
    }

    if (aiData?.explanation) {
      try {
        window.dispatchEvent(
          new CustomEvent("sono:explanation", {
            detail: {
              query: clean,
              explanation: aiData.explanation,
              intent: aiData.intent || "chat",
              source,
            },
          })
        );
      } catch {}
    }

    try {
      window.dispatchEvent(
        new CustomEvent("sono:search", {
          detail: {
            query: clean,
            source,
            locale,
            region: region || null,
            city: city || null,
            categoryHint: categoryHint || null,
          },
        })
      );
    } catch {}
  } catch (err) {
    console.warn("runUnifiedSearch (AI) hata:", err);
  }

  // =============================================================
  // 3) EKLENDİ → ASIL VİTRİN API ÇAĞRISI
  // =============================================================
  let vitrinData = null;

  try {
    const res = await fetchWithTimeout(
      `${API}${VITRINE_ENDPOINT}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean, locale }),
      },
      25000 // yavaş adapter için uzun timeout
    );

    if (res?.ok) {
      vitrinData = await res.json().catch(() => null);
    }
  } catch (err) {
    console.warn("Vitrin API hata:", err);
  }
  // =============================================
// YENİ → VİTRİN DATA'YI GERÇEK VİTRİNE YOLLA
// =============================================
try {
  if (vitrinData?.items?.length) {
    pushCardsToVitrine(vitrinData.items, "vitrin-api");
  }
} catch (err) {
  console.warn("pushCardsToVitrine hata:", err);
}


  // ===========================
  // 4) Birleşik final output
  // ===========================
  return {
    ai: aiData || null,
    vitrin: vitrinData || null,
  };
}

// ------------------------------------------------------------
//  Vitrin tarafı — event köprüsü
// ------------------------------------------------------------
export function pushQueryToVitrine(query, source = "unknown") {
  const clean = normalizeQuery(query);
  if (!clean) return;
  if (typeof window === "undefined") return;

  if (getLockFlag()) return;
  setLockFlag();

  setLastQuery(clean, source);

  const detail = { query: clean, source };

  try {
    window.dispatchEvent(new CustomEvent("fae.vitrine.search", { detail }));
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("vitrine-search", { detail }));
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("fie:vitrin", { detail }));
  } catch {}
}

export function getLastQuery() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return "";
    return window.localStorage.getItem(LAST_QUERY_KEY) || "";
  } catch {
    return "";
  }
}

export function getLastQuerySource() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return "unknown";
    return window.localStorage.getItem(LAST_SOURCE_KEY) || "unknown";
  } catch {
    return "unknown";
  }
}

export function getLastQueryAt() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const v = window.localStorage.getItem(LAST_AT_KEY);
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function pushCardsToVitrine(cards, source = "unknown") {
  if (typeof window === "undefined") return;
  const detail = { source, cards: cards || [] };

  try {
    window.dispatchEvent(new CustomEvent("fie:vitrin", { detail }));
  } catch {}
}

export const SEARCH_LOCK_MS = LOCK_MS;
