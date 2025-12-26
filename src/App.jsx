// ✅ src/App.jsx — TAMAMEN CERRAHİ OLARAK TEMİZLENMİŞ + GÜÇLENDİRİLMİŞ

import React, { useState, useEffect, useRef, useMemo } from "react";
import Header from "./components/Header.jsx";
import AIAssistant from "./components/AIAssistant.jsx";
import Vitrin from "./components/Vitrin.jsx";
import Footer from "./components/Footer.jsx";
import { useTranslation } from "react-i18next";
import * as ai from "./api/ai";
import "./components/AIAnimation.css";
import mic from "/sono-assets/mic.svg";
import camera from "/sono-assets/camera-apple.svg";
import sonoFace from "/sono-assets/sono-face.svg";
import { createUseRewards } from "./hooks/useRewards";
import QRScanner from "./components/QRScanner.jsx";
import { QrCode, Search as SearchIcon } from "lucide-react";
import TelemetryPanel from "./components/Admin/TelemetryPanel";
import SystemTelemetryPanel from "./components/SystemTelemetryPanel";
import { runUnifiedSearch } from "./utils/searchBridge";

// ✅ Legal pages (affiliate approvals / compliance)
import LegalShell from "./components/LegalShell.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import CookiePolicy from "./pages/legal/CookiePolicy.jsx";
import AffiliateDisclosure from "./pages/legal/AffiliateDisclosure.jsx";

// ✅ Site info pages (network reviews love these)
import About from "./pages/site/About.jsx";
import Contact from "./pages/site/Contact.jsx";
import HowItWorks from "./pages/site/HowItWorks.jsx";

// Kullanıcıya isimle hitap → email ile hitap etme, XSS koruması
// Davet linkindeki ?ref= kodunu yakala
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

if (ref) {
  console.log("REFERE KODU ALGILANDI:", ref);
  localStorage.setItem("referralCode", ref);
}

const safeDisplayName = (raw) => {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  if (/@/.test(s)) return ""; // email ile hitap etme
  return s.replace(/[<>]/g, "").slice(0, 40);
};

export default function App() {
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const useRewards = createUseRewards(import.meta.env.VITE_BACKEND_URL);

  // =========================================================================
  //  LEGAL ROUTES (NO ROUTER LIB)
  //  - Keep it simple: explicit pathname checks
  //  - Early return BEFORE hooks that trigger network calls
  // =========================================================================
  const __path = (typeof window !== "undefined" ? window.location.pathname : "/") || "/";
  const pathClean = __path.replace(/\/+$/, "") || "/";

  if (pathClean === "/privacy" || pathClean === "/privacy-policy") {
    return (
      <LegalShell>
        <PrivacyPolicy />
      </LegalShell>
    );
  }

  if (pathClean === "/cookies" || pathClean === "/cookie-policy") {
    return (
      <LegalShell>
        <CookiePolicy />
      </LegalShell>
    );
  }

  if (
    pathClean === "/affiliate-disclosure" ||
    pathClean === "/disclosure" ||
    pathClean === "/affiliate"
  ) {
    return (
      <LegalShell badgeText="Legal">
        <AffiliateDisclosure />
      </LegalShell>
    );
  }

  // ✅ About / Contact / How it works
  if (pathClean === "/about" || pathClean === "/hakkimizda") {
    return (
      <LegalShell badgeText="Info">
        <About />
      </LegalShell>
    );
  }

  if (pathClean === "/contact" || pathClean === "/iletisim") {
    return (
      <LegalShell badgeText="Info">
        <Contact />
      </LegalShell>
    );
  }

  if (
    pathClean === "/how-it-works" ||
    pathClean === "/how" ||
    pathClean === "/nasil-calisir"
  ) {
    return (
      <LegalShell badgeText="Info">
        <HowItWorks />
      </LegalShell>
    );
  }
  if (window.location.pathname === "/admin/system-telemetry") {
    return <SystemTelemetryPanel />;
  }

  if (window.location.pathname === "/admin/search-telemetry") {
    return <TelemetryPanel />;
  }
  
  useRewards(); // cüzdan & ödül hook’u — mevcut işlev KALDI

  // === Dil değişince vitrin yenile + placeholder reset ===
  useEffect(() => {
    if (i18n.language) {
      try {
        localStorage.setItem("appLang", i18n.language);
      } catch {
        // localStorage fail etse bile app çökmeyecek
      }
      setCurrentPlaceholder(0);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("fae.vitrine.refresh"));
      }
    }
  }, [i18n.language]);

  // === İlk yüklemede vitrin tetikle ===
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fae.vitrine.refresh"));
    }
  }, []);

  // === Placeholder'lar (dile göre dinamik) ===
  const placeholders_ = useMemo(
    () => [
      t("ph.searchProduct", { defaultValue: "Ürün ara..." }),
      t("ph.findHotel", { defaultValue: "Otel bul..." }),
      t("ph.compareFlight", { defaultValue: "Uçak biletini kıyasla..." }),
      t("ph.exploreElectronics", { defaultValue: "Elektroniği keşfet..." }),
      t("ph.findCarRental", {
        defaultValue: "Araç kiralama fırsatlarını bul...",
      }),
    ],
    [i18n.language, t]
  );

  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  useEffect(() => {
    if (!placeholders_ || placeholders_.length === 0) return;
    const id = setInterval(
      () => setCurrentPlaceholder((p) => (p + 1) % placeholders_.length),
      4000
    );
    return () => clearInterval(id);
  }, [placeholders_]);

  const [value, setValue] = useState("");
  const fileRef = useRef(null);

  // === Arama ===
 async function doSearch(q) {
  const raw = q ?? value;
  const query = String(raw || "").trim();
  if (!query) return;

  // 🔥 TEK BEYİN
  await runUnifiedSearch(query, { source: "input" });

    const region =
      (typeof window !== "undefined" &&
        window.localStorage &&
        localStorage.getItem("region")) ||
      "TR";
    const backend =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

    // Global state’e yaz + vitrin event’leri → Vitrin + Sono aynı hizada
    try {
      localStorage.setItem("lastQuery", query);
    } catch {
      // sessiz geç
    }
    if (typeof window !== "undefined") {
      // Direkt arama event’i (Vitrin dinliyor)
      window.dispatchEvent(
        new CustomEvent("fae.vitrine.search", {
          detail: { query },
        })
      );
      // Tam yenile
      window.dispatchEvent(new Event("fae.vitrine.refresh"));
    }

    try {
      const res = await fetch(`${backend}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
query,
q: query,
category: "product",
group: "product",
          region,
          locale: i18n.language || "tr",
        }),
      });

      if (!res.ok) {
        // Backend 4xx/5xx geldi ama UI patlamasın
        console.warn("Arama isteği başarısız:", res.status);
        return null;
      }

      const j = await res.json().catch(() => null);
      return j;
    } catch (err) {
      console.warn("Arama hatası:", err);
      return null;
    }
  }

  // === Sesli arama ===
  async function startMic() {
    if (typeof window === "undefined") return;

    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec)
      return alert(
        t("ai.noSpeech", {
          defaultValue: "Tarayıcın ses tanımayı desteklemiyor!",
        })
      );

    try {
      const rec = new Rec();
      rec.lang = i18n.language || "tr-TR";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = async (e) => {
  const text = e.results[0][0].transcript;
  const clean = text.trim();
  setValue(clean);

  // 🔥 TEK BEYİN
  await runUnifiedSearch(clean, { source: "voice" });

  doSearch(clean);
};


      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
      };

      rec.start();
    } catch (err) {
      console.warn("Speech recognition start error:", err);
    }
  }

  // === Görsel arama ===
  function openCamera() {
    fileRef.current?.click();
  }

  async function onPickFile(e) {
    const f = e.target?.files?.[0];
    if (!f) return;

    const b64 = await new Promise((ok, fail) => {
      try {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => fail(new Error("File read error"));
        r.readAsDataURL(f);
      } catch (err) {
        fail(err);
      }
    }).catch(() => null);

    if (!b64) return;

    const backend =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

    try {
      const r = await fetch(`${backend}/api/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: b64,
          locale: i18n.language,
        }),
      });

      if (!r.ok) {
        console.warn("Vision API hatası:", r.status);
        return;
      }

      const j = await r.json().catch(() => null);
      if (j?.query) {
        const q = String(j.query).trim();
        if (!q) return;
        setValue(q);
		 // 🔥 TEK BEYİN
  await runUnifiedSearch(q, { source: "camera" });
        doSearch(q);
      }
    } catch (err) {
      console.warn("Vision arama hatası:", err);
    } finally {
      // aynı dosyayı tekrar seçebilmek için input değerini sıfırla
      if (e.target) e.target.value = "";
    }
  }

  // === QR tarayıcı ===
  function startQRScanner() {
    setQrScanOpen(true);
  }

  // === Akıllı selam + tetikleyici ===
  const [trigger, setTrigger] = useState("");
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const triggers = [
      t("trigger.writeSono"),
      t("trigger.discoverDeals"),
      t("trigger.youTypeIFind"),
      t("trigger.readyToSave"), // "readyToSaveTime" yerine "readyToSave"
      t("trigger.aiWithYou"), // "findalleasyWithYou" yerine "aiWithYou"
      t("trigger.customShowcase"),
    ].filter(Boolean);

    if (triggers.length === 0) return;

    const changeTrigger = () => {
      setFade(false);
      setTimeout(() => {
        const idx = Math.floor(Math.random() * triggers.length);
        setTrigger(triggers[idx]);
        setFade(true);
      }, 300);
    };

    changeTrigger();
    const i = setInterval(changeTrigger, 9000);
    return () => clearInterval(i);
  }, [i18n.language, t]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#0b0e14] text-white font-sans overflow-x-hidden">
      <Header />

      <main
        className="flex-1 flex flex-col items-center justify-start w-full px-4 pt-10 sm:pt-14 pb-24"
      >
        {/* ◆ SLOGAN */}
        <h2 className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[18px] sm:text-[20px] md:text-[24px] lg:text-[29px] font-semibold text-center select-none px-2 leading-tight">
          <span className="text-white">{t("yazman yeterli,")}</span>
          <span className="text-[#d4af37]">{t("gerisini")}</span>

          <div
            className="relative group transition-transform duration-500 hover:scale-110"
            title="Sono AI"
          >
            <div
              className="absolute inset-0 rounded-full border-[2px] border-[#d4af37]
              shadow-[0_0_12px_#d4af37,0_0_24px_#d4af37] opacity-70
              group-hover:shadow-[0_0_20px_#d4af37,0_0_40px_#d4af37]
              transition-all duration-500 ease-in-out"
            ></div>
            <img
              src={sonoFace}
              alt="Sono"
              className="relative w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full drop-shadow-[0_0_4px_#d4af37]"
            />
          </div>

          <span className="text-[#d4af37]">{t("halleder.")}</span>
        </h2>

        {/* ◆ Arama Çubuğu (Responsive: tasarım korunur, taşma yok) */}
        <div className="w-full max-w-[760px] mt-3 sm:mt-4 mb-3">
          {/*
            Hedef: Desktop/tablet görünümü korunur.
            Mobilde: aynı stil, ama gerektiğinde otomatik wrap yapar.
            (Asla ekran dışına taşmasın.)
          */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={placeholders_[currentPlaceholder]}
              className="flex-1 min-w-[180px] sm:min-w-[320px] h-10 text-white placeholder:text-white/70 bg-transparent border border-white/40 rounded-md px-3 outline-none"
            />

            {/* Görsel arama input (hidden) */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className="hidden"
            />

            {/* Kontroller: tek satır dene, sığmazsa wrap */}
            <div className="flex flex-wrap items-center justify-end gap-2 basis-full sm:basis-auto sm:ml-auto">
              {/* Sesli arama */}
              <button
                onClick={startMic}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-[#d4af37]/60 hover:border-[#d4af37] transition"
                title={t("voiceSearch")}
              >
                <img src={mic} alt="Mic" className="w-5 h-5" />
              </button>

              {/* Görsel arama */}
              <button
                onClick={openCamera}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-[#d4af37]/60 hover:border-[#d4af37] transition"
                title={t("visualSearch")}
              >
                <img src={camera} alt="Camera" className="w-5 h-5" />
              </button>

              {/* QR */}
              <button
                onClick={startQRScanner}
                className="flex items-center justify-center w-10 h-10 rounded-md border border-[#d4af37]/60 hover:border-[#d4af37] transition"
                title={t("qrSearch")}
              >
                <QrCode size={20} className="text-[#d4af37]" />
              </button>

              {/* Ara */}
              <button
                onClick={() => doSearch()}
                className="h-10 bg-[#d4af37] text-black font-semibold px-4 sm:px-5 rounded-md hover:bg-[#e6c85b] transition flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <SearchIcon size={18} />
                <span className="text-[14px] sm:text-[15px]">{t("search.search", { defaultValue: "Ara" })}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ◆ Akıllı Selam */}
        {(() => {
          let rawName = "";
          try {
            rawName = localStorage.getItem("username") || "";
          } catch {
            rawName = "";
          }
          const name = safeDisplayName(rawName);
          const hour = new Date().getHours();

          let greeting = t("greeting.morning", {
            defaultValue: "Günaydın ☀️",
          });
          if (hour >= 12 && hour < 18)
            greeting = t("greeting.afternoon", {
              defaultValue: "İyi günler 🙂",
            });
          else if (hour >= 18 && hour < 23)
            greeting = t("greeting.evening", {
              defaultValue: "İyi akşamlar 🌙",
            });
          else if (hour >= 23 || hour < 5)
            greeting = t("greeting.night", {
              defaultValue: "İyi geceler 😴",
            });

          return (
          <div className="w-full flex justify-center mt-2 mb-2 select-none">
  <p className="text-[13px] sm:text-[14px] text-white/90 text-center flex items-center gap-2">
    <span>{greeting}</span>
    {name ? <span>{name}</span> : null}
    <span className="text-[#d4af37]">||</span>
    <span
      className={`transition-opacity duration-700 ease-in-out ${
        fade ? "opacity-100" : "opacity-0"
      }`}
    >
      {trigger}
    </span>
  </p>
</div>

          );
        })()}

        {/* ◆ VİTRİN */}
        <Vitrin />
      </main>

      {/* QR Scanner */}
{qrScanOpen && (
  <QRScanner
    onDetect={async (text) => {
      setQrScanOpen(false);

      const raw = String(text || "").trim();
      if (!raw) return;

      let q = raw;

      // JSON QR formatı (ör: {"query":"otel bodrum"})
      try {
        if (raw.startsWith("{")) {
          const obj = JSON.parse(raw);
          q = String(obj.query || raw || "").trim();
        }
      } catch {
        // JSON değilse düz metin olarak devam
      }

      if (!q) return;

      // 🔥 TEK BEYİN: AI unified pipeline
      await runUnifiedSearch(q, { source: "qr" });

      // 🔥 Global state
      try {
        localStorage.setItem("lastQuery", q);
      } catch {}

      // 🔥 Vitrin tetikleyicisi
      window.dispatchEvent(
        new CustomEvent("fae.vitrine.search", {
          detail: { query: q },
        })
      );
      window.dispatchEvent(new Event("fae.vitrine.refresh"));

      // 🔥 APP beynine arama
      doSearch(q);
    }}
    onClose={() => setQrScanOpen(false)}
  />
)}
  {/* ◆ SONO AI – region bilgisi burada gidiyor */}
     <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999]">
  <AIAssistant
    onSuggest={async (text) => {
      const q = String(text || value || "").trim();
      if (!q) return;

      // ⭐ TEK BEYİN
      await runUnifiedSearch(q, { source: "ai" });

      // ⭐ APP'in kendi arama hattını çağır
      doSearch(q);
    }}
    key={i18n.language}
  />
</div>

<div className="mt-auto text-center">
  <Footer />
</div>
{window.location.pathname === "/admin/telemetry" && <TelemetryPanel />}
</div>
);
}
