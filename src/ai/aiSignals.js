// src/ai/aiSignals.js
// SONO AI SIGNAL MAP — AI → searchBridge → vitrin → UI (HERKÜL MODU)

export const AI_SIGNALS = Object.freeze({
  SEARCH: "ai.search",
  CHAT: "ai.chat",
  ACTION: "ai.action",
  PRODUCT: "ai.product",
});

/**
 * AI cevabından gelen veriyi kaba ama deterministik şekilde sınıflandırır.
 */
export function classifyAISignal(msg = "") {
  try {
    const t = String(msg || "").toLowerCase();

    if (!t.trim()) return AI_SIGNALS.CHAT;

    // Arama odaklı
    if (
      /\bara\b|\barama\b|\bsearch\b|\bfind\b/.test(t) ||
      t.includes("bakar mısın") ||
      t.includes("araştır") ||
      t.includes("bulur musun")
    ) {
      return AI_SIGNALS.SEARCH;
    }

    // Eylem / satın alma
    if (/\bal\b|\bsatın\b|\border\b|\bsipariş\b|\brezervasyon\b/.test(t)) {
      return AI_SIGNALS.ACTION;
    }

    // Ürün / fiyat odaklı
    if (/\bürün\b|\bfiyat\b|\bprice\b|\bmodel\b|\bmarka\b/.test(t)) {
      return AI_SIGNALS.PRODUCT;
    }

    return AI_SIGNALS.CHAT;
  } catch (err) {
    console.warn("classifyAISignal error:", err);
    return AI_SIGNALS.CHAT;
  }
}

function safeDispatch(eventName, detail) {
  try {
    if (typeof window === "undefined" || !eventName) return;

    window.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
      })
    );
  } catch (err) {
    console.warn("safeDispatch error:", err);
  }
}

/**
 * AI → Vitrin tetikleyicisi
 */
export function dispatchSearchSignal(query, extra = {}) {
  const q = String(query || "").trim();
  if (!q) return;
  safeDispatch("ai.search", { query: q, ...extra });
}

/**
 * AI → Chat UI sinyali
 */
export function dispatchChatSignal(text, extra = {}) {
  const msg = String(text || "").trim();
  if (!msg) return;
  safeDispatch("ai.chat", { text: msg, ...extra });
}

/**
 * [EKSTRA] Tek noktadan sinyal yönlendirici.
 * Backend'ten dönen { answer, detectedQuery } gibi objeyi alıp
 * hem chat'e hem vitrine uygun olana yollar.
 */
export function routeAISignals(payload = {}) {
  const { answer, detectedQuery } = payload || {};
  const intent = classifyAISignal(answer || "");

  // Chat balonu
  if (answer) {
    dispatchChatSignal(answer, { intent });
  }

  // Vitrin tetikleme
  if (detectedQuery && (intent === AI_SIGNALS.SEARCH || intent === AI_SIGNALS.PRODUCT)) {
    dispatchSearchSignal(detectedQuery, { intent, source: "ai-route" });
  }
}
