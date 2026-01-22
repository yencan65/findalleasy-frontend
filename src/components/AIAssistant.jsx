// src/components/AIAssistant.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStatusBus } from "../context/StatusBusContext";
import { initSonoActionEngine } from "../engines/sonoActionEngine";
import { API_BASE } from "../utils/api";
/**
 * ------------------------------------------------------------------
 * YARDIMCI FONKSİYONLAR (VİTRİN TETİKLEYİCİLER)
 * ------------------------------------------------------------------
 */

// AI bir arama önerisi yaptığında vitrine yönlendirme (HERKÜL SÜRÜMÜ - GÜÇLENDİRİLMİŞ)
function pushQueryToVitrine(text, source = "ai") {
  const clean = String(text || "").trim();
  if (!clean) return;

  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("fae.vitrine.search", {
        detail: { query: clean, source },
      })
    );
  } catch (e) {
    console.warn("pushQueryToVitrine error:", e);
  }
}

// AI cevabı içinden tespit edilen sorguyu vitrine gönder
function triggerSearchFromAI(text) {
  if (!text) return;
  pushQueryToVitrine(text);
}

/**
 * ------------------------------------------------------------------
 * CONTEXT / PERSONA MOTORU (S12)
 * ------------------------------------------------------------------
 */

// S11 — Context Memory Engine (son 5 kullanıcı mesajını tutar)
const contextMemory = {
  history: [],

  add(userText) {
    this.history.push(userText);
    if (this.history.length > 5) this.history.shift();
  },

  getContext() {
    if (!this.history.length) return "";
    return this.history.join(" | ");
  },
};

// S12 — Persona Profili (yalın ama kullanışlı)
function getPersona(locale) {
  if (locale.startsWith("tr")) {
    return {
      name: "Sono",
      tone: "Samimi, net, lafı dolandırmayan.",
      hello:
        "Merhaba, Sono AI. İstersen hemen senin yerine vitrine bakmaya başlayabilirim.",
    };
  }
  if (locale.startsWith("fr")) {
    return {
      name: "Sono",
      tone: "Calme, précise, efficace.",
      hello:
        "Bonjour, je suis Sono AI. Dites-moi ce que vous cherchez, je fouille pour vous.",
    };
  }
  if (locale.startsWith("ru")) {
    return {
      name: "Sono",
      tone: "Спокойная, умная, без лишних слов.",
      hello: "Привет, я Sono AI. Просто скажите, что нужно найти.",
    };
  }
  if (locale.startsWith("ar")) {
    return {
      name: "Sono",
      tone: "هادئة، واضحة، مباشرة.",
      hello: "مرحباً، أنا Sono AI. أخبرني بما تريد وسأتولى الباقي.",
    };
  }
  return {
    name: "Sono",
    tone: "Friendly, sharp, no-nonsense.",
    hello: "Hi, I'm Sono AI. Tell me what you want, I’ll handle the hunting.",
  };
}

// S11 — Intent Engine (kullanıcı niyetini sınıflandırır)
function detectIntent(text, locale = "tr") {
  const raw = String(text || "").trim();
  const low = raw.toLowerCase();
  if (!low) return "info";

  const l = String(locale || "tr").toLowerCase();
  const lang = l.startsWith("en")
    ? "en"
    : l.startsWith("fr")
    ? "fr"
    : l.startsWith("ru")
    ? "ru"
    : l.startsWith("ar")
    ? "ar"
    : "tr";

  const wordCount = low.split(/\s+/).filter(Boolean).length;

  // Evidence-first overrides: market data / weather / news / travel etc are "info", not shopping
  const isWeatherish = /(hava durumu|weather|météo|погода|طقس)/i.test(low);
  const isNewsish = /(haber|news|actualité|новост|أخبار)/i.test(low);
  const isTravelish = /(gezi|rota|travel|itin(é|e)raire|путешеств|سفر)/i.test(
    low
  );
  const isRecipeish = /(tarif|recipe|recette|рецепт|وصفة)/i.test(low);
  const isPoiish = /(yakın(ımda)?|nearby|à proximité|рядом|بالقرب)/i.test(low);

  // FX / commodities (gold/silver) — treated as info (market data), unless user explicitly wants to buy
  const isFxish =
    /(d[öo]viz|kur|usd|eur|gbp|try|exchange rate|taux|курс|سعر الصرف)/i.test(
      low
    );
  const isMetalish =
    /(gram\s*alt(ı|i)n|alt(ı|i)n|g[uü]m[uü]ş|gold|silver|xau|xag|platin|platinum|palladyum|palladium|xpt|xpd)/i.test(
      low
    );

  const wantsToBuy =
    /(sat(ı|i)n\s*al|sipariş|nereden\s*al|link|buy|purchase|order|where\s*to\s*buy|acheter|où\s*acheter|купить|где\s*купить|اشتر|شراء|من\s*أين)/i.test(
      low
    ) ||
    /(hepsiburada|trendyol|n11|amazon|akakçe|cimri|epey|booking|expedia)/i.test(
      low
    );

  if (isWeatherish || isNewsish || isTravelish || isRecipeish || isPoiish)
    return "info";
  if ((isFxish || isMetalish) && !wantsToBuy) return "info";

  const hasNumber = /\d/.test(low);
  const hasCurrency = /(₺|tl|lira|\$|usd|€|eur|руб|₽|د\.?إ|ر\.?س|ج\.?م)/i.test(
    raw
  );
  const hasQuestionMark = /[?؟]/.test(raw);

  const includesAny = (items) =>
    items.some((x) =>
      x instanceof RegExp ? x.test(low) : low.includes(String(x))
    );

  // Strong product/service search signals (credits)
  const productSignals = {
    tr: [
      "fiyat",
      "en ucuz",
      "ucuz",
      "indirim",
      "kampanya",
      "satın",
      "satın al",
      "al",
      "nereden al",
      "bilet",
      "uçuş",
      "otel",
      "rezervasyon",
      "kirala",
      "kira",
      "sigorta",
      "teklif",
      "site",
      "link",
      "bul",
      "ara",
      "listele",
      "karşılaştır",
    ],
    en: [
      "price",
      "cheapest",
      "discount",
      "deal",
      "buy",
      "purchase",
      "order",
      "where to buy",
      "ticket",
      "flight",
      "hotel",
      "booking",
      "rent",
      "rental",
      "insurance",
      "quote",
      "search",
      "find",
      "look up",
      "show",
      "list",
      "compare",
    ],
    fr: [
      "prix",
      "moins cher",
      "promo",
      "promotion",
      "acheter",
      "où acheter",
      "billet",
      "vol",
      "hôtel",
      "réservation",
      "location",
      "assurance",
      "devis",
      "chercher",
      "trouver",
      "rechercher",
      "montrer",
      "liste",
      "comparer",
    ],
    ru: [
      "цена",
      "дешевле",
      "скидка",
      "акция",
      "купить",
      "где купить",
      "билет",
      "рейс",
      "отель",
      "бронь",
      "аренда",
      "страховка",
      "расчет",
      "найди",
      "поиск",
      "поищи",
      "покажи",
      "список",
      "сравни",
    ],
    ar: [
      "سعر",
      "الأرخص",
      "خصم",
      "عرض",
      "اشتر",
      "شراء",
      "من أين أشتري",
      "تذكرة",
      "رحلة",
      "فندق",
      "حجز",
      "استئجار",
      "تأمين",
      "عرض سعر",
      "ابحث",
      "بحث",
      "اعثر",
      "أرني",
      "قائمة",
      "قارن",
    ],
  };

  // Info / chat signals (no credits)
  const infoSignals = {
    tr: [
      "nedir",
      "ne demek",
      "bu ne",
      "açıkla",
      "anlat",
      "bilgi ver",
      "bilgi verir misin",
      "nasıl",
      "neden",
      "kim",
      "kimdir",
      "ne zaman",
      "nerede",
      "nasıl gidilir",
      "nasıl bulunur",
      "hakkında",
      "hakkinda",
      "tarihi",
      "gezilecek",
      "öner",
      "öneri",
    ],
    en: [
      "what is",
      "what's",
      "who",
      "who is",
      "where",
      "when",
      "why",
      "how",
      "how to",
      "explain",
      "tell me about",
      "information",
      "info",
      "guide",
      "history",
      "how do i get",
      "how to get",
      "places to visit",
      "things to do",
    ],
    fr: [
      "c'est quoi",
      "qu'est-ce",
      "quoi",
      "qui",
      "où",
      "quand",
      "pourquoi",
      "comment",
      "explique",
      "dis-moi",
      "parle-moi de",
      "informations",
      "guide",
      "histoire",
      "comment aller",
      "comment trouver",
      "à visiter",
      "que faire",
    ],
    ru: [
      "что",
      "что такое",
      "кто",
      "кто такой",
      "где",
      "когда",
      "почему",
      "зачем",
      "как",
      "объясни",
      "расскажи",
      "информация",
      "история",
      "гид",
      "как добраться",
      "как найти",
      "что посмотреть",
      "куда сходить",
    ],
    ar: [
      "ما",
      "ماذا",
      "من",
      "أين",
      "متى",
      "لماذا",
      "كيف",
      "كم",
      "أي",
      "اشرح",
      "عرّف",
      "عرفني",
      "معلومات",
      "حدثني عن",
      "دليل",
      "تاريخ",
      "كيف أذهب",
      "كيف أصل",
      "كيف أجد",
    ],
  };

  const productHit = includesAny(productSignals[lang] || []);
  const infoHit =
    includesAny(infoSignals[lang] || []) ||
    hasQuestionMark ||
    (/^\s*(what|who|where|when|why|how)\b/i.test(raw) && lang === "en") ||
    (/^\s*(qui|quoi|où|quand|pourquoi|comment)\b/i.test(raw) && lang === "fr") ||
    (/^\s*(что|кто|где|когда|почему|как)\b/i.test(raw) && lang === "ru") ||
    (/^\s*(ما|ماذا|من|أين|متى|لماذا|كيف)\b/i.test(raw) && lang === "ar");

  // Price-like patterns are almost always product search
  const priceLike = hasCurrency || (hasNumber && /(fiyat|price|prix|цена|سعر)/i.test(low));

  // Heuristic: long sentence => info, unless strong product signal exists
  const longSentenceInfo = wordCount >= 8 && !priceLike && !productHit;

  if (priceLike || productHit) return "product_search";
  if (infoHit || longSentenceInfo) return "info";

  // Short queries are typically product/service search
  if (wordCount <= 3) return "product_search";
  return "info";
}

export default function AIAssistant({ onSuggest, onProductSearch }) {
  const { t, i18n } = useTranslation();
  const locale = (i18n?.language || "tr").toLowerCase();
  const persona = getPersona(locale);

  // --- STATE TANIMLARI ---
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pendingVoice, setPendingVoice] = useState(null);

  // ✅ Input value (for clear button + controlled UX)
  const [inputValue, setInputValue] = useState("");

  // ✅ Sono Mode (search/chat) — kullanıcı seçer, localStorage’da saklanır
  const [sonoMode, setSonoMode] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("sono_mode") || "";
    } catch {
      return "";
    }
  });

  // ✅ Canlı ses yazımı (interim transcript)
  const [voiceLive, setVoiceLive] = useState("");

  // Global status bus: tüm async işler tek standart bildirim diliyle konuşsun
  const { setStatus, clearStatus } = useStatusBus();
  const STATUS_SRC = "assistant";
  const STATUS_PRIO = 20;

  const publishBusy = (text) =>
    setStatus(STATUS_SRC, {
      text,
      showDots: true,
      tone: "gold",
      priority: STATUS_PRIO,
    });

  // Backwards-compatible helper (bu dosyada bolca kullanılıyor)
  function flashMsg(text, ms = 0, tone = null) {
    const msg = String(text || "").trim();
    if (!msg) {
      clearStatus(STATUS_SRC);
      return;
    }

    // ms>0: kısa bilgilendirme
    if (ms > 0) {
      setStatus(STATUS_SRC, {
        text: msg,
        showDots: false,
        tone: tone || "muted",
        priority: STATUS_PRIO,
        ttlMs: ms,
      });
      return;
    }

    // ms=0: kalıcı "iş üstünde" modu
    publishBusy(msg);
  }

  // Unmount'ta takılı kalmasın
  useEffect(() => {
    return () => clearStatus(STATUS_SRC);
  }, [clearStatus]);

  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const greetedRef = useRef(false);

  // --- REF TANIMLARI ---
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const inputRef = useRef(null);
  const recRef = useRef(null);
  const micWarmedRef = useRef(false);
  const lastAssistantSearchRef = useRef({ ts: 0, query: "" });
  const micTapGuardRef = useRef(0);

  // İstek İptali için Ref (Anti-Race Condition)
  const abortControllerRef = useRef(null);

  // Request id (StrictMode / rapid-send race guard)
  const requestIdRef = useRef(0);

  // Otomatik Scroll için Ref
  const messagesEndRef = useRef(null);

  // Ses Sentezleyicisi
  const synthRef = useRef(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  // Warm up TTS voices early (first speak can be delayed on some browsers)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth || typeof synth.getVoices !== "function") return;

    const warmVoices = () => {
      try {
        synth.getVoices();
      } catch {}
    };

    warmVoices();
    const handler = () => warmVoices();

    try {
      synth.addEventListener?.("voiceschanged", handler);
    } catch {}

    return () => {
      try {
        synth.removeEventListener?.("voiceschanged", handler);
      } catch {}
    };
  }, []);

  // Warm up microphone permission early (reduces first-tap delay)
  useEffect(() => {
    if (!open) return;
    if (micWarmedRef.current) return;
    micWarmedRef.current = true;

    (async () => {
      try {
        if (typeof navigator === "undefined") return;
        const md = navigator.mediaDevices;
        if (!md || typeof md.getUserMedia !== "function") return;
        const stream = await md.getUserMedia({ audio: true });
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
      } catch {
        // ignore
      }
    })();
  }, [open]);

  // --- TEMİZLİK (CLEANUP) ---
  useEffect(() => {
    if (!window.__SONO_ACTION_INITED__) {
      window.__SONO_ACTION_INITED__ = true;
      initSonoActionEngine();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (recRef.current) {
        try {
          recRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // UnifiedSearch → AI mesajı (cooldown + spam koruma)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let last = 0;
    const onUnified = (e) => {
      const q = e.detail?.query;
      if (!q) return;

      const now = Date.now();
      if (now - last < 300) return;
      last = now;
    };

    window.addEventListener("fae.vitrine.search", onUnified);
    return () => window.removeEventListener("fae.vitrine.search", onUnified);
  }, []);

  // Vitrin sonuçları: assistant başlattıysa hem yazılı hem (gerekirse) sesli bilgilendir
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResults = (e) => {
      const last = lastAssistantSearchRef.current;
      if (!last || !last.ts) return;

      const now = Date.now();
      if (now - last.ts > 25000) return;

      const status = String(e?.detail?.status || "").toLowerCase();
      let msg = "";

      if (status === "success") {
        msg = t("vitrine.resultsReady", {
          defaultValue: "Sonuçlar vitrinde hazır. Teşekkürler.",
        });
      } else if (status === "empty") {
        msg = t("vitrine.noResults", {
          defaultValue: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin.",
        });
      } else if (status === "error") {
        msg = t("vitrine.resultsError", {
          defaultValue: "Arama sırasında hata oluştu. Lütfen tekrar deneyin.",
        });
      } else {
        return;
      }

      setMessages((m) => [...m, { from: "ai", text: msg }]);

      try {
        const lastSpokenAt = Number(window.__FAE_LAST_VITRIN_SPOKEN_AT || 0);
        if (!lastSpokenAt || Date.now() - lastSpokenAt > 1200) {
          speak(msg);
        }
      } catch {}

      flashMsg("", 450);
      setSearching(false);
      lastAssistantSearchRef.current = { ts: 0, query: "" };
    };

    window.addEventListener("fae.vitrine.results", onResults);
    return () => window.removeEventListener("fae.vitrine.results", onResults);
  }, [t, locale]);

  // Mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, thinking, open]);

  // CSS
  useEffect(() => {
    if (typeof document === "undefined") return;

    const ID = "sono-gold-style";
    if (document.getElementById(ID)) return;

    const s = document.createElement("style");
    s.id = ID;
    s.innerHTML = `
      @keyframes sono-breath {
        0% { transform: scale(1); opacity:.55; filter: blur(10px); }
        50% { transform: scale(1.12); opacity:.9; filter: blur(14px); }
        100% { transform: scale(1); opacity:.55; filter: blur(10px); }
      }

      .sono-gold-halo {
        position:absolute; inset:0; border-radius:9999px;
        background: radial-gradient(35% 35% at 50% 50%, rgba(212,170,55,.92),
        rgba(212,170,55,.25) 60%, rgba(0,0,0,0) 72%);
        animation: sono-breath 3.6s ease-in-out infinite;
        pointer-events:none;
      }

      @keyframes mic-breathe {
        0% { box-shadow: 0 0 6px rgba(212,175,55,0.45); transform: scale(1); }
        50% { box-shadow: 0 0 14px rgba(212,175,55,0.75); transform: scale(1.07); }
        100% { box-shadow: 0 0 6px rgba(212,175,55,0.45); transform: scale(1); }
      }
      .sono-mic-breath { animation: mic-breathe 2.4s ease-in-out infinite; }

      @keyframes speech-wave-1 { 0% { transform:scale(1);opacity:.8;} 100%{transform:scale(1.8);opacity:0;} }
      @keyframes speech-wave-2 { 0% { transform:scale(1);opacity:.6;} 100%{transform:scale(2.1);opacity:0;} }
      @keyframes speech-wave-3 { 0% { transform:scale(1);opacity:.4;} 100%{transform:scale(2.4);opacity:0;} }

      .speech-wave-base {
        position:absolute;
        inset:-10px;
        border:2px solid rgba(212,175,55,0.7);
        border-radius:9999px;
        pointer-events:none;
        z-index:5;
      }

      .speech-wave-1 { animation:speech-wave-1 1.5s ease-out infinite; }
      .speech-wave-2 { animation:speech-wave-2 1.5s ease-out .3s infinite; }
      .speech-wave-3 { animation:speech-wave-3 1.5s ease-out .6s infinite; }

      /* KONUMLANDIRMA */
      .sono-adjusted-position {
        bottom: calc(env(safe-area-inset-bottom, 0px) + 2.25rem) !important;
        right: 1.25rem !important;
      }
      @media (max-width: 768px) {
        .sono-adjusted-position {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 3.25rem) !important;
          right: 0.75rem !important;
        }
      }
      @media (max-width: 480px) {
        .sono-adjusted-position {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 3.75rem) !important;
          right: 0.75rem !important;
        }
      }

      /* MİKROFON STİLLERİ */
      .sono-mic-hover-gold:hover {
        background: rgba(212, 175, 55, 0.15) !important;
        border-color: rgba(212, 175, 55, 0.8) !important;
        box-shadow: 0 0 12px rgba(212, 175, 55, 0.4) !important;
        transform: scale(1.05);
        transition: all 0.2s ease-in-out;
      }

      .sono-mic-hover-gold:hover svg {
        color: #d4af37 !important;
        filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.6));
      }

      .sono-mic-listening {
        background: rgba(212, 175, 55, 0.2) !important;
        border-color: rgba(212, 175, 55, 0.9) !important;
        box-shadow: 0 0 16px rgba(212, 175, 55, 0.6) !important;
        animation: pulse-gold 1.5s ease-in-out infinite;
      }

      @keyframes pulse-gold {
        0% { box-shadow: 0 0 8px rgba(212, 175, 55, 0.4); }
        50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.8); }
        100% { box-shadow: 0 0 8px rgba(212, 175, 55, 0.4); }
      }

      /* SCROLLBAR */
      .custom-scrollbar { overscroll-behavior: contain; }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.5); border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.8); }

      /* Yüz modları */
      .sono-face-idle { transform: scale(1); filter: drop-shadow(0 0 4px rgba(212,175,55,0.4)); }
      .sono-face-thinking { transform: translateY(-1px) scale(1.02); filter: drop-shadow(0 0 8px rgba(212,175,55,0.7)); }
      .sono-face-listening { transform: translateY(-1px) scale(1.06); filter: drop-shadow(0 0 10px rgba(212,175,55,0.9)); }
    `;
    document.head.appendChild(s);
  }, []);

  // Vitrin motoru tetiklendiğinde timestamp güncelle
  useEffect(() => {
    const handler = () => {
      window.__FAE_LAST_VITRIN_TS = Date.now();
    };

    window.addEventListener("fae.vitrine.search", handler);
    return () => window.removeEventListener("fae.vitrine.search", handler);
  }, []);

  // DIŞ TIKLAMA → KAPAT
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) {
        setOpen(false);
        greetedRef.current = false;
        setTimeout(() => setMessages([]), 150);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pulseHalo = () => {
    if (!haloRef.current) return;
    haloRef.current.classList.remove("animate-ping-once");
    void haloRef.current.offsetWidth;
    haloRef.current.classList.add("animate-ping-once");
    setTimeout(() => haloRef.current?.classList.remove("animate-ping-once"), 900);
  };

  // KONUŞMA SENTEZİ (TTS)
  function speak(text) {
    try {
      if (!synthRef.current || typeof window === "undefined") return;
      const synth = synthRef.current;
      const u = new SpeechSynthesisUtterance(text);

      const lang =
        locale.startsWith("tr")
          ? "tr-TR"
          : locale.startsWith("fr")
          ? "fr-FR"
          : locale.startsWith("ru")
          ? "ru-RU"
          : locale.startsWith("ar")
          ? "ar-SA"
          : "en-US";

      u.lang = lang;

      try {
        const voices = synth.getVoices?.() || [];
        const lang2 = String(lang).toLowerCase();
        const short2 = lang2.slice(0, 2);
        const v =
          voices.find((x) => String(x?.lang || "").toLowerCase() === lang2) ||
          voices.find((x) => String(x?.lang || "").toLowerCase().startsWith(lang2)) ||
          voices.find((x) => String(x?.lang || "").toLowerCase().startsWith(short2));
        if (v) u.voice = v;
      } catch {}

      try {
        synth.cancel();
        synth.resume?.();
      } catch {}

      synth.speak(u);
    } catch {}
  }

  // SESLİ KOMUT (STT)
  function handleMicPointerDown(e) {
    try {
      e.preventDefault?.();
      e.stopPropagation?.();
    } catch {}
    const now = Date.now();
    if (now - (micTapGuardRef.current || 0) < 700) return;
    micTapGuardRef.current = now;

    const m = String(sonoMode || "").toLowerCase();
    if (!m) {
      flashMsg(
        t("ai.chooseModeToast", { defaultValue: "Devam etmek için mod seç." }),
        1400,
        "muted"
      );
      return;
    }
    captureOnce();
  }

  async function captureOnce() {
    if (typeof window === "undefined") return;

    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      alert(
        t("ai.noSpeech", {
          defaultValue: "Tarayıcınız sesli komutu desteklemiyor.",
        })
      );
      return;
    }

    setListening(true);
    flashMsg(t("ai.listening", { defaultValue: "Dinleniyorum…" }), 0);

    const rec = new Rec();
    rec.lang =
      locale.startsWith("tr")
        ? "tr-TR"
        : locale.startsWith("fr")
        ? "fr-FR"
        : locale.startsWith("ru")
        ? "ru-RU"
        : locale.startsWith("ar")
        ? "ar-SA"
        : "en-US";

    rec.interimResults = true;
    rec.continuous = true;

    const transcript = await new Promise((resolve) => {
      let finalText = "";
      let idle = null;
      let done = false;

      const finish = (text) => {
        if (done) return;
        done = true;
        try {
          clearTimeout(idle);
        } catch {}
        resolve(String(text || ""));
        try {
          rec.stop();
        } catch {}
      };

      rec.onresult = (e) => {
        try {
          let interim = "";
          let finals = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            const tr = r?.[0]?.transcript || "";
            if (r.isFinal) finals += tr + " ";
            else interim += tr + " ";
          }

          if (finals.trim()) finalText = (finalText + " " + finals).trim();
          const merged = (finalText || interim || "").trim();

          try {
            setInputValue(merged);
          } catch {}
          try {
            setVoiceLive(merged);
          } catch {}

          clearTimeout(idle);
          idle = setTimeout(() => {
            finish(merged);
          }, 550);
        } catch {}
      };

      rec.onerror = () => {
        if (!done) finish("");
      };

      rec.onend = () => {
        if (!done) finish(finalText);
      };

      try {
        rec.start();
        recRef.current = rec;
      } catch {
        finish("");
      }
    });

    setListening(false);
    recRef.current = null;

    const clean = transcript.trim();
    if (clean) {
      setPendingVoice(clean);
      setInputValue(clean);

      const toastKey =
        String(sonoMode || "").toLowerCase() === "chat"
          ? "ai.voiceConfirmToastChat"
          : "ai.voiceConfirmToast";

      flashMsg(
        t(toastKey, {
          defaultValue:
            String(sonoMode || "").toLowerCase() === "chat"
              ? "Duydum — göndermem için onay ver."
              : "Duydum — aramam için onay ver.",
        }),
        1600,
        "muted"
      );
    } else {
      flashMsg(t("ai.noSpeech", { defaultValue: "Ses algılanamadı." }), 1400);
    }
  }

  // ANA BEYİN – S12
  async function processQuery(text) {
    const low = text.toLowerCase();

    const thanksWords = [
      "teşekkür",
      "tesekkur",
      "sağ ol",
      "sag ol",
      "çok sağ ol",
      "cok sag ol",
      "thanks",
      "thank",
      "thx",
      "merci",
      "спасибо",
      "شكرا",
      "shukran",
      "gracias",
    ];

    if (thanksWords.some((w) => low.includes(w))) {
      let reply;
      if (locale.startsWith("tr"))
        reply = "Rica ederim efendim, her zaman buradayım.";
      else if (locale.startsWith("fr"))
        reply = "Avec plaisir, je suis toujours là pour vous.";
      else if (locale.startsWith("ru"))
        reply = "Пожалуйста, я всегда рядом, чтобы помочь.";
      else if (locale.startsWith("ar"))
        reply = "على الرحب والسعة سيدي، أنا هنا دائمًا لمساعدتك.";
      else reply = "You're very welcome, I'm always here for you.";

      setMessages((m) => [...m, { from: "ai", text: reply }]);
      speak(reply);
      return;
    }

    const mode = String(sonoMode || "").toLowerCase();

    if (!mode) {
      const msg = t("ai.chooseModeFirst", {
        defaultValue:
          "Önce bir mod seç: Ürün/Hizmet Ara veya Soru Sor/Bilgi Al.",
      });
      setMessages((m) => [...m, { from: "ai", text: msg }]);
      speak(msg);
      flashMsg(
        t("ai.chooseModeToast", { defaultValue: "Devam etmek için mod seç." }),
        1400,
        "muted"
      );
      return;
    }

    const inferred = detectIntent(text, locale);

    let effectiveMode = mode;
    if (mode === "chat" && inferred === "product_search") {
      effectiveMode = "search";
      setSonoMode("search");
      try {
        if (typeof window !== "undefined")
          localStorage.setItem("sono_mode", "search");
      } catch {}
      flashMsg(
        t("ai.autoSwitchedToSearch", {
          defaultValue:
            "Bu sorgu ürün/hizmet araması gibi — Ürün/Hizmet Ara moduna geçtim.",
        }),
        1400,
        "muted"
      );
    }

    const intent = effectiveMode === "search" ? "product_search" : inferred;
    contextMemory.add(text);

    if (intent === "product_search") {
      setSearching(true);
      lastAssistantSearchRef.current = { ts: Date.now(), query: text };

      setMessages((m) => {
        const updated = [
          ...m,
          { from: "user", text },
          { from: "ai", text: t("ai.searching", { defaultValue: "Arıyorum…" }) },
        ];
        queueMicrotask(() => {
          messagesRef.current = updated;
        });
        return updated;
      });

      flashMsg(t("ai.analyzing", { defaultValue: "Analiz ediliyor…" }), 0);

      try {
        if (typeof onProductSearch === "function") {
          await onProductSearch(text);
        } else if (typeof onSuggest === "function") {
          await onSuggest(text);
        } else {
          pushQueryToVitrine(text, "ai");
        }
      } catch (err) {
        console.warn("AI product_search trigger fail:", err?.message || err);
        flashMsg(
          t("ai.searchError", { defaultValue: "Arama sırasında bir hata oldu." }),
          1800,
          "danger"
        );
        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: t("ai.searchError", {
              defaultValue: "Arama sırasında bir hata oldu.",
            }),
          },
        ]);
        setSearching(false);
        lastAssistantSearchRef.current = { ts: 0, query: "" };
      }
      return;
    }

    setMessages((m) => {
      const updated = [...m, { from: "user", text }];
      queueMicrotask(() => {
        messagesRef.current = updated;
      });
      return updated;
    });

    const sensitive = [
      "şifre",
      "tc",
      "iban",
      "adres",
      "kredi kartı",
      "password",
      "card",
      "address",
    ];
    const silent = sensitive.some((k) => low.includes(k));

    if (!silent) {
      speak(t("ai.prepping", { defaultValue: "Yanıt hazırlıyorum..." }));
    }

    const analyzingText = t("ai.analyzing", { defaultValue: "Analiz ediliyor..." });
    const reqId = ++requestIdRef.current;

    pulseHalo();
    setThinking(true);
    flashMsg(analyzingText, 0);
    setMessages((m) => [...m, { from: "ai", text: analyzingText, rid: reqId }]);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const backend = API_BASE || "";
      const safeHistory = messagesRef.current.slice(-6).map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch(`${backend}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          context: contextMemory.getContext(),
          locale,
          region: localStorage.getItem("region") || "TR",
          city: typeof window !== "undefined" ? window.__FIE_CITY__ || "" : "",
          history: safeHistory,
          mode: "chat",
        }),
      });

      const j = await res.json();
      if (reqId !== requestIdRef.current) return;

      setMessages((prev) => {
        const arr = Array.isArray(prev) ? [...prev] : [];
        const idx =
          arr.findLastIndex?.((x) => x && x.from === "ai" && x.rid === reqId) ??
          -1;
        if (idx >= 0) arr.splice(idx, 1);

        const sources = Array.isArray(j?.sources) ? j.sources.slice(0, 5) : [];
        const trustScore =
          typeof j?.trustScore === "number"
            ? j.trustScore
            : typeof j?.meta?.trustScore === "number"
            ? j.meta.trustScore
            : null;

        arr.push({
          from: "ai",
          text:
            j?.answer ||
            t("ai.noAnswer", { defaultValue: "Şu an cevap alamadım." }),
          suggestions: Array.isArray(j?.suggestions)
            ? j.suggestions.slice(0, 4)
            : [],
          sources,
          trustScore,
          rid: reqId,
        });
        return arr;
      });

      if (!silent) speak(t("ai.chatReady", { defaultValue: "Cevap hazır." }));
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: t("ai.error", {
              defaultValue: "Bir hata oluştu, tekrar deneyiniz.",
            }),
          },
        ]);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setThinking(false);
        flashMsg("", 450);
        abortControllerRef.current = null;
      }
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const text = String(inputValue || "").trim();
    if (!text) return;
    setPendingVoice(null);
    setInputValue("");
    await processQuery(text);
  }

  function resetConversation(initialAiText) {
    const msg = String(initialAiText || "").trim();

    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    } catch {}
    abortControllerRef.current = null;

    setThinking(false);
    setSearching(false);
    setListening(false);
    setPendingVoice(null);
    setVoiceLive("");

    try {
      contextMemory.history = [];
    } catch {}

    const arr = [{ from: "ai", text: msg || persona?.hello || "" }];
    setMessages(arr);
    queueMicrotask(() => {
      messagesRef.current = arr;
    });

    if (msg) speak(msg);
  }

  function setMode(next) {
    const m = String(next || "").toLowerCase();
    if (m !== "search" && m !== "chat") return;

    setSonoMode(m);
    try {
      if (typeof window !== "undefined") localStorage.setItem("sono_mode", m);
    } catch {}

    const msg =
      m === "search"
        ? t("ai.modeSetSearch", {
            defaultValue: "Tamam — ürün/hizmet arama modundayım. Ne arıyoruz?",
          })
        : t("ai.modeSetChat", {
            defaultValue: "Tamam — bilgi modu aktif. Sor bakalım.",
          });

    resetConversation(msg);
  }

  function resetMode() {
    setSonoMode("");
    try {
      if (typeof window !== "undefined") localStorage.removeItem("sono_mode");
    } catch {}

    const msg = t("ai.modeReset", { defaultValue: "Mod seçimini sıfırladım." });
    resetConversation(msg);
    flashMsg(msg, 1200, "muted");
  }

  const greetNow = () => {
    const modeNow = String(sonoMode || "").toLowerCase();
    const greet = t("ai.hello", { defaultValue: persona.hello }) || persona.hello;

    const choose = t("ai.helloChoose", {
      defaultValue:
        "Merhaba, ben Sono. Ne yapmak istersin? Ürün/Hizmet Ara veya Soru Sor / Bilgi Al.",
    });

    const intro = !modeNow ? choose : greet;
    setMessages([{ from: "ai", text: intro }]);
    speak(intro);
  };

  useEffect(() => {
    if (open && messages.length === 0 && !greetedRef.current) {
      greetedRef.current = true;
      greetNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i18n.language]);

  const isRTL = locale.startsWith("ar");

  return (
    <div
      ref={wrapRef}
      className="fixed sono-adjusted-position z-[999]"
      style={{ contain: "layout paint" }}
      aria-live="polite"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* YÜZ + HALO */}
      <div className="relative grid place-items-center">
        <div
          ref={haloRef}
          className="absolute w-[84px] h-[84px] rounded-full blur-md opacity-70 pointer-events-none"
        >
          <span className="sono-gold-halo" />
        </div>

        <button
          onClick={() => {
            const willOpen = !open;
            setOpen(willOpen);
            pulseHalo();

            if (willOpen) {
              if (!greetedRef.current && messages.length === 0) {
                greetedRef.current = true;
                greetNow();
              }
              setTimeout(() => inputRef.current?.focus?.(), 60);
            } else {
              greetedRef.current = false;
              setTimeout(() => setMessages([]), 100);
            }
          }}
          aria-label={t("ai.sono", { defaultValue: "Sono AI" })}
          className="relative w-[56px] h-[56px] rounded-full bg-black/70 border border-[#d4af37]/60 shadow-lg 
          grid place-items-center hover:scale-[1.03] transition z-10"
        >
          <img
            src="/sono-assets/sono-face.svg"
            alt="Sono AI"
            draggable={false}
            className="w-[38px] h-[38px]"
          />
        </button>
      </div>

      {/* CHAT PENCERESİ */}
      {open && (
        <div
          className="mt-2 bg-black/85 text-white border border-[#d4af37]/50 
          rounded-2xl shadow-2xl backdrop-blur-md p-3
          w-[78vw] max-w-[290px] sm:max-w-[310px] md:max-w-[330px]
          flex flex-col
          max-h-[32vh] sm:max-h-[40vh] md:max-h-[45vh] lg:max-h-[50vh]
          overflow-hidden"
        >
          {/* Mode chooser / active mode badge */}
          {!sonoMode ? (
            <div className="mb-2 p-2 rounded-xl border border-[#d4af37]/30 bg-black/40">
              <div className="text-xs text-white/80">
                {t("ai.chooseModeTitle", {
                  defaultValue:
                    "Mod seç: Ürün/Hizmet Ara veya Soru Sor/Bilgi Al",
                })}
              </div>
              <div className="text-[11px] text-white/60 mt-1">
                {t("ai.chooseModeSubtitle", {
                  defaultValue:
                    "Seçtiğin moda göre Sono ya vitrine arama yapar ya da bilgi verir.",
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-semibold"
                  onClick={() => setMode("search")}
                >
                  {t("ai.modeSearch", { defaultValue: "Ürün/Hizmet Ara" })}
                </button>
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#d4af37]/50 text-[#d4af37] text-xs font-semibold"
                  onClick={() => setMode("chat")}
                >
                  {t("ai.modeChat", { defaultValue: "Soru Sor / Bilgi Al" })}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] px-2 py-1 rounded-full border border-[#d4af37]/30 text-white/80 bg-black/40">
                {String(sonoMode).toLowerCase() === "search"
                  ? t("ai.modeActiveSearch", {
                      defaultValue: "Mod: Ürün/Hizmet Arama",
                    })
                  : t("ai.modeActiveChat", {
                      defaultValue: "Mod: Bilgi / Sohbet",
                    })}
              </div>
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded-full border border-white/20 text-white/70 hover:bg-white/5 transition"
                onClick={resetMode}
              >
                {t("ai.changeMode", { defaultValue: "Mod değiştir" })}
              </button>
            </div>
          )}

          {/* Mesajlar */}
          <div className="mt-2 flex-1 min-h-[110px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className="space-y-1">
                <p
                  className={`${
                    m.from === "user"
                      ? "text-right text-[#d4af37]"
                      : "text-left text-gray-200"
                  } text-sm leading-snug whitespace-pre-line`}
                >
                  {m.text}
                </p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ✅ Sesli komut onayı (otomatik arama YOK) */}
          {pendingVoice ? (
            <div className="mt-2 p-2 rounded-xl border border-[#d4af37]/30 bg-black/40">
              <div className="text-xs text-white/70">
                {t("ai.voiceHeardPrefix", {
                  defaultValue: "Sesli komuttan anladığım:",
                })}{" "}
                <span className="text-[#d4af37] font-semibold">
                  {String(pendingVoice || "").trim()}
                </span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {t(
                  String(sonoMode || "").toLowerCase() === "chat"
                    ? "ai.voiceConfirmQuestionChat"
                    : "ai.voiceConfirmQuestion",
                  {
                    defaultValue:
                      String(sonoMode || "").toLowerCase() === "chat"
                        ? "Bunu göndereyim mi?"
                        : "Bunu mu arayayım?",
                  }
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg bg-[#d4af37] text-black text-xs font-semibold"
                  onClick={async () => {
                    const q = String(pendingVoice || "").trim();
                    if (!q) return;
                    setPendingVoice(null);
                    setInputValue("");
                    await processQuery(q);
                  }}
                >
                  {String(sonoMode || "").toLowerCase() === "chat"
                    ? t("ai.send", { defaultValue: "Gönder" })
                    : t("search.confirmSearch", { defaultValue: "Ara" })}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border border-[#d4af37]/50 text-[#d4af37] text-xs"
                  onClick={() => {
                    setPendingVoice(null);
                    setTimeout(() => {
                      try {
                        inputRef.current?.focus?.();
                      } catch {}
                    }, 0);
                  }}
                >
                  {t("search.editQuery", { defaultValue: "Düzenle" })}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border border-white/20 text-white/70 text-xs"
                  onClick={() => {
                    setPendingVoice(null);
                    setInputValue("");
                    flashMsg(t("search.cancel", { defaultValue: "İptal" }), 900, "muted");
                  }}
                >
                  {t("search.cancel", { defaultValue: "İptal" })}
                </button>
              </div>
            </div>
          ) : null}

          {/* INPUT */}
          <form onSubmit={handleFormSubmit} className="mt-2 flex items-center gap-2">
            {/* 🎙️ Mikrofon geri geldi */}
            <button
              type="button"
              onPointerDown={handleMicPointerDown}
              onClick={(e) => {
                try {
                  e.preventDefault?.();
                  e.stopPropagation?.();
                } catch {}
              }}
              disabled={!sonoMode}
              className={`sono-mic-glow sono-mic-hover-gold relative grid place-items-center
                w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#d4af37]/70 transition
                ${!sonoMode ? "opacity-40 cursor-not-allowed" : ""}
                ${listening ? "sono-mic-listening" : "hover:bg-[#d4af37]/10"}`}
              title={t("ai.listen", { defaultValue: "Dinle" })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-[#d4af37]">
                <path
                  fill="currentColor"
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
                />
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!sonoMode}
              enterKeyHint="send"
              autoComplete="off"
              placeholder={
                !sonoMode
                  ? t("ai.chooseModePlaceholder", { defaultValue: "Önce mod seç…" })
                  : String(sonoMode).toLowerCase() === "search"
                  ? t("ai.placeholderSearch", { defaultValue: "Ürün veya hizmet ara…" })
                  : t("ai.placeholderChat", { defaultValue: "Soru sor / bilgi al…" })
              }
              className="flex-grow bg-transparent outline-none border border-[#d4af37]/40 rounded-xl 
              px-2 py-2 text-white text-sm"
            />

            {inputValue?.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  try {
                    inputRef.current?.focus?.();
                  } catch {}
                }}
                className="px-2 text-white/40 hover:text-white/80 transition"
                aria-label={t("ai.clearInput", { defaultValue: "Temizle" })}
                title={t("ai.clearInput", { defaultValue: "Temizle" })}
                disabled={!sonoMode}
              >
                ×
              </button>
            )}

            <button
              type="submit"
              disabled={!sonoMode}
              className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#d4af37]/70 
              hover:bg-[#d4af37]/10 transition"
              title={
                String(sonoMode || "").toLowerCase() === "search"
                  ? t("search.search", { defaultValue: "Ara" })
                  : t("ai.send", { defaultValue: "Gönder" })
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-[#d4af37]">
                <path
                  fill="currentColor"
                  d="M3.4 20.4L21 12L3.4 3.6L3 10l11 2l-11 2z"
                />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
