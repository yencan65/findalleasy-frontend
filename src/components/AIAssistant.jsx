// src/components/AIAssistant.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { runUnifiedSearch } from "../utils/searchBridge";
import { initSonoActionEngine } from "../engines/sonoActionEngine";
import { API_BASE } from "../utils/api";

/**
 * ------------------------------------------------------------------
 * YARDIMCI FONKSİYONLAR (VİTRİN TETİKLEYİCİLER)
 * ------------------------------------------------------------------
 */

// AI bir arama önerisi yaptığında vitrine yönlendirme (HERKÜL SÜRÜMÜ - GÜÇLENDİRİLMİŞ)
function pushQueryToVitrine(text) {
  const clean = String(text || "").trim();
  if (!clean) return;

  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    localStorage.setItem("lastQuery", clean);

    if (window.__ai_to_vitrine_lock) return;
    window.__ai_to_vitrine_lock = true;
    setTimeout(() => (window.__ai_to_vitrine_lock = false), 120);


    // Modern event (yeni sistem)
    window.dispatchEvent(
      new CustomEvent("fae.vitrine.search", { detail: { query: clean } })
    );

    // Legacy event (eski sistem)
    window.dispatchEvent(
      new CustomEvent("vitrine-search", { detail: { query: clean } })
    );

    // Universal event (AI → vitrine JSON)
    window.dispatchEvent(
      new CustomEvent("fie:vitrin", { detail: { query: clean } })
    );

    // Refresh event
    window.dispatchEvent(new Event("fae.vitrine.refresh"));
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
      hello: "Merhaba, Sono AI. İstersen hemen senin yerine vitrine bakmaya başlayabilirim.",
    };
  }
  if (locale.startsWith("fr")) {
    return {
      name: "Sono",
      tone: "Calme, précise, efficace.",
      hello: "Bonjour, je suis Sono AI. Dites-moi ce que vous cherchez, je fouille pour vous.",
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
function detectIntent(text) {
  const low = text.toLowerCase();

  // ÜRÜN / FİYAT / OTEL / ETKİNLİK ARAMA
  if (
    low.includes("ara") ||
    low.includes("bul") ||
    low.includes("fiyat") ||
    low.includes("otel") ||
    low.includes("uçak") ||
    low.includes("bilet") ||
    low.includes("etkinlik")
  ) {
    return "product_search";
  }

  // SİSTEM / AKSİYON / DEĞİŞTİRME
  if (
    low.includes("dili değiştir") ||
    low.includes("şehri değiştir") ||
    low.includes("şehir") ||
    low.includes("qr")
  ) {
    return "action";
  }

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
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const greetedRef = useRef(false);

  // --- REF TANIMLARI ---
  const wrapRef = useRef(null);
  const haloRef = useRef(null);
  const inputRef = useRef(null);
  const recRef = useRef(null);

  // İstek İptali için Ref (Anti-Race Condition)
  const abortControllerRef = useRef(null);

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
  // Some browsers populate voices async
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


  // --- TEMİZLİK (CLEANUP) ---
 // Action engine sadece 1 kere çalışacak
useEffect(() => {
  if (!window.__SONO_ACTION_INITED__) {
	    window.__SONO_ACTION_INITED__ = true; 
    initSonoActionEngine();
  }
}, []);


// Cleanup ise tamamen ayrı olmalı
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
      if (now - last < 300) return; // 300ms içinde gelen tekrar sinyallerini yok say
      last = now;
    };

    window.addEventListener("fae.vitrine.search", onUnified);
    return () => window.removeEventListener("fae.vitrine.search", onUnified);
  }, []);

  // Mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, thinking, open]);


  // ALTIN HALO + MİKROFON NEFESİ + KONUŞMA DALGALARI (CSS)
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
        /* Bubble footer'ın üstünde kalsın (mobil safe-area dahil) */
        bottom: calc(env(safe-area-inset-bottom, 0px) + 2.25rem) !important;
        right: 1.25rem !important;
      }
      @media (max-width: 768px) {
        .sono-adjusted-position {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 5.75rem) !important;
          right: 0.75rem !important;
        }
      }
      @media (max-width: 480px) {
        .sono-adjusted-position {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 6.25rem) !important;
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

      /* [YENİ] ÖZEL SCROLLBAR ve OVERSCROLL FIX */
      .custom-scrollbar {
         overscroll-behavior: contain;
      }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.5); border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.8); }

      /* S12: Yüz modları (duygu simülasyonu) */
      .sono-face-idle {
        transform: scale(1);
        filter: drop-shadow(0 0 4px rgba(212,175,55,0.4));
      }
      .sono-face-thinking {
        transform: translateY(-1px) scale(1.02);
        filter: drop-shadow(0 0 8px rgba(212,175,55,0.7));
      }
      .sono-face-listening {
        transform: translateY(-1px) scale(1.06);
        filter: drop-shadow(0 0 10px rgba(212,175,55,0.9));
      }
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

      // 🎙️ Voice seçimi (bazı tarayıcılarda ilk TTS gecikmesini azaltır)
      try {
        const voices = synth.getVoices?.() || [];
        const lang2 = String(lang).toLowerCase();
        const short2 = lang2.slice(0, 2);
        const v =
          voices.find((x) => String(x?.lang || "").toLowerCase() === lang2) ||
          voices.find((x) =>
            String(x?.lang || "").toLowerCase().startsWith(lang2)
          ) ||
          voices.find((x) =>
            String(x?.lang || "").toLowerCase().startsWith(short2)
          );
        if (v) u.voice = v;
      } catch {
        // ignore
      }

      // Bazı tarayıcılarda synth "paused" kalabiliyor
      try {
        synth.cancel();
        synth.resume?.();
      } catch {
        // ignore
      }

      synth.speak(u);

      u.onend = () => {
        const micBtn = document.querySelector(".sono-mic-glow");
        if (micBtn) {
          micBtn.classList.remove("sono-mic-breath");
          void micBtn.offsetWidth;
          micBtn.classList.add("sono-mic-breath");
        }
      };
    } catch {
      // sessiz fail
    }
  }

  // SESLİ KOMUT (STT)
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

    // ✅ interim+debounce: daha hızlı yakala
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

          // kullanıcı duraklayınca yakala
          clearTimeout(idle);
          idle = setTimeout(() => {
            finish(merged);
          }, 550);
        } catch {
          // ignore
        }
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
    if (clean) processQuery(clean);
  }

  // ANA BEYİN – S12
  async function processQuery(text) {
    const low = text.toLowerCase();

    // 1) Teşekkür Algılama
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

    // 2) Intent & Context
    const intent = detectIntent(text);
    contextMemory.add(text);

    // Intent bazlı vitrin tetikleyici
    if (intent === "product_search") {
      pushQueryToVitrine(text);
    } else if (intent === "action") {
      // S12: aksiyon niyeti için event fırlatıyoruz (ileride başka yerde yakalanabilir)
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("fie:action", {
              detail: {
                raw: text,
                locale,
                context: contextMemory.getContext(),
              },
            })
          );
        }
		
      } catch (e) {
        console.warn("fie:action event error:", e);
      }
    }
// 🔥 TEK BEYİN — tüm AI mesajları vitrine unified olarak gider
await runUnifiedSearch(text, { source: "ai" });

triggerSearchFromAI(text);
    // 3) Kullanıcı mesajını ekle + history senkron
    setMessages((m) => {
  const updated = [...m, { from: "user", text }];
  
  // 🔥 Yeni: SENKRON KORUMA — StrictMode çift render bug fix
  queueMicrotask(() => { 
    messagesRef.current = updated; 
  });

  return updated;
});


    // 4) Hassas veri filtresi
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
      speak(
        t("ai.prepping", {
          defaultValue:
            "Gerçek AI tavsiyelerini vitrine getiriyorum...",
        })
      );
    }

    pulseHalo();
    setThinking(true);

    // 5) Önceki istek abort
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 6) Unified Search — Vitrin Beyni
	  
   


	  
// Unified search çağrısından sonra vitrin tetiklenmiş mi kontrol e

      // 7) onSuggest / onProductSearch override
      if (typeof onProductSearch === "function") {
  await onProductSearch(text);
} else if (typeof onSuggest === "function") {
  await onSuggest(text);
} else {
        // 8) Backend Chat / AI API Çağrısı
        const backend = API_BASE || "";

        // Kullanıcı + AI geçmişi: backend'e güvenli formatta gönderilir
        const safeHistory = messagesRef.current
          .slice(-6)
          .map((m) => ({
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

        if (j?.detectedQuery) triggerSearchFromAI(j.detectedQuery);

        if (j?.cards) {
          try {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("fie:vitrin", {
                  detail: { cards: j.cards || [], model: j.provider || "ai" },
                })
              );
            }
          } catch (e) {
            console.warn("fie:vitrin dispatch error:", e);
          }
        }

        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text:
              j?.answer ||
              t("ai.noAnswer", { defaultValue: "Şu an cevap alamadım." }),
          },
        ]);
      }

      if (!silent) {
        speak(
          t("ai.ready", {
            defaultValue: "Hazır. Vitrinden kontrol edebilirsiniz.",
          })
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages((m) => [
          ...m,
          {
            from: "ai",
            text: t("ai.error", { defaultValue: "Bir hata oluştu, tekrar deneyiniz." }),
          },
        ]);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setThinking(false);
        abortControllerRef.current = null;
      }
    }
  }

  // FORM HANDLER (MOBİL İÇİN ENTER DESTEĞİ)
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!inputRef.current) return;

    const val = inputRef.current.value;
    const text = String(val || "").trim();

    if (!text) return;
    inputRef.current.value = "";
    await processQuery(text);
  }

  // Eski kullanım için handler (gerekirse)
  async function handleSend(txt) {
    const text = String(txt || "").trim();
    if (!text) return;
    if (inputRef.current) inputRef.current.value = "";
    await processQuery(text);
  }

  // Açıldığında ilk selamlama + persona
const greetNow = () => {
  const greet =
    t("ai.hello", {
      defaultValue: persona.hello,
    }) || persona.hello;

  const intro = `${greet}`;
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

  // Yüz modu
  const faceMode = listening ? "listening" : thinking ? "thinking" : "idle";
  const faceClass =
    faceMode === "listening"
      ? "sono-face-listening"
      : faceMode === "thinking"
      ? "sono-face-thinking"
      : "sono-face-idle";

  // RENDER
  return (
    <div
      ref={wrapRef}
      className="fixed sono-adjusted-position z-[999]"
      style={{ contain: "layout paint" }}
      aria-live="polite"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* YÜZ + HALO + DALGALAR */}
      <div className="relative grid place-items-center">
        {listening && (
          <>
            <div className="speech-wave-base speech-wave-1" />
            <div className="speech-wave-base speech-wave-2" />
            <div className="speech-wave-base speech-wave-3" />
          </>
        )}

        <div
          ref={haloRef}
          className="absolute w-[84px] h-[84px] rounded-full blur-md opacity-70 pointer-events-none"
        >
          <span className={`sono-gold-halo ${listening ? "fast" : ""}`} />
        </div>

        <button
          onClick={() => {
            const willOpen = !open;
            setOpen(willOpen);
            pulseHalo();

            if (willOpen) {
              // Speak immediately (avoid waiting for useEffect re-render)
              if (!greetedRef.current && messages.length === 0) {
                greetedRef.current = true;
                greetNow();
              }
              setTimeout(() => inputRef.current?.focus(), 60);
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
            className={`w-[38px] h-[38px] transition-all duration-500 ${faceClass}`}
          />
        </button>
      </div>

      {/* CHAT PENCERESİ */}
      {open && (
        <div
          className="mt-2 bg-black/85 text-white border border-[#d4af37]/50 
          rounded-2xl shadow-2xl backdrop-blur-md p-3 w-[calc(100vw-32px)] max-w-[380px] md:w-[340px] md:max-w-[340px]"
        >
          <div className="overflow-auto max-h-[220px] my-2 space-y-2 pr-1 custom-scrollbar">
            {messages.map((m, i) => (
              <p
                key={i}
                className={`${
                  m.from === "user"
                    ? "text-right text-[#d4af37]"
                    : "text-left text-gray-200"
                } text-sm leading-snug`}
              >
                {m.text}
              </p>
            ))}
            {thinking && (
              <p className="text-xs text-gray-300">
                {t("ai.analyzing", {
                  defaultValue: "Analiz ediliyor, vitrine hazırlanıyor...",
                })}
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT ALANI - FORM YAPISI */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={captureOnce}
              className={`sono-mic-glow sono-mic-hover-gold relative grid place-items-center w-9 h-9 rounded-full border 
              border-[#d4af37]/70 transition ${
                listening ? "sono-mic-listening" : "hover:bg-[#d4af37]/10"
              }`}
              title={t("ai.listen", { defaultValue: "Dinle" })}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="text-[#d4af37]"
              >
                <path
                  fill="currentColor"
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
                />
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              enterKeyHint="send"
              autoComplete="off"
              placeholder={t("ai.placeholder", {
                defaultValue: "Mesaj yaz...",
              })}
              className="flex-grow bg-transparent outline-none border border-[#d4af37]/40 rounded-xl 
              px-2 py-2 text-white text-sm"
            />

            <button
              type="submit"
              className="grid place-items-center w-9 h-9 rounded-full border border-[#d4af37]/70 
              hover:bg-[#d4af37]/10 transition"
              title={t("ai.send", { defaultValue: "Gönder" })}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="text-[#d4af37]"
              >
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