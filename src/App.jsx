// ✅ src/App.jsx — TAMAMEN CERRAHİ OLARAK TEMİZLENMİŞ + GÜÇLENDİRİLMİŞ

import React, { useState, useEffect, useRef, useMemo } from "react";
import { API_BASE } from "./utils/api";
import Header from "./components/Header.jsx";
import AIAssistant from "./components/AIAssistant.jsx";
import Vitrin from "./components/Vitrin.jsx";
import Footer from "./components/Footer.jsx";
import { useTranslation } from "react-i18next";
import * as ai from "./api/ai";
import "./components/AIAnimation.css";
import micIcon from "/sono-assets/mic.svg";
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

import TermsOfUse from "./pages/legal/TermsOfUse.jsx";
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
  const useRewards = createUseRewards(API_BASE);

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

  if (pathClean === "/terms" || pathClean === "/terms-of-use") {
    return (
      <LegalShell badgeText="Legal">
        <TermsOfUse />
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

  // === Sesli arama UI (kullanıcı ne olduğunu ANLASIN diye) ===
  const [voiceToast, setVoiceToast] = useState(null); // { msg, kind }
  const [voiceListening, setVoiceListening] = useState(false);
  const voiceRecRef = useRef(null);
  const voiceToastTimer = useRef(null);

  const showVoiceToast = (msg, kind = "info", ttl = 2200) => {
    try {
      if (voiceToastTimer.current) clearTimeout(voiceToastTimer.current);
    } catch {}
    setVoiceToast({ msg, kind });
    voiceToastTimer.current = setTimeout(() => setVoiceToast(null), ttl);
  };

  const fileRef = useRef(null);

  // === Arama ===
 async function doSearch(q, opts = {}) {
  const raw = q ?? value;
  const query = String(raw || "").trim();
  if (!query) return;

  const source = String(opts?.source || "input");
  const skipUnified = Boolean(opts?.skipUnified);

  // 🔥 TEK BEYİN
  if (!skipUnified) {
    await runUnifiedSearch(query, { source });
  }

    const region =
      (typeof window !== "undefined" &&
        window.localStorage &&
        localStorage.getItem("region")) ||
      "TR";
    const backend = API_BASE || "";

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
    if (!Rec) {
      showVoiceToast(
        t("search.voiceNotSupported", {
          defaultValue: "Tarayıcın ses tanımayı desteklemiyor!",
        }),
        "error",
        2600
      );
      return;
    }

    // Zaten dinliyorsak: tekrar basınca durdur
    if (voiceListening && voiceRecRef.current) {
      try {
        voiceRecRef.current.stop();
      } catch {}
      setVoiceListening(false);
      voiceRecRef.current = null;
      showVoiceToast(
        t("search.voiceStopped", { defaultValue: "Sesli arama durduruldu." }),
        "info",
        1600
      );
      return;
    }

    try {
      const rec = new Rec();
      voiceRecRef.current = rec;

      rec.lang = i18n.language || "tr-TR";
      rec.interimResults = true;       // ✅ daha hızlı tepki
      rec.continuous = true;           // ✅ kısa boşluklarda kesilmesin
      rec.maxAlternatives = 1;

      let finalText = "";
      let idleTimer = null;
      let committed = false;

      const commit = async (text) => {
        const clean = String(text || "").trim();
        if (!clean || committed) return;
        committed = true;

        try {
          clearTimeout(idleTimer);
        } catch {}

        setValue(clean);
        showVoiceToast(
          t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }),
          "ok",
          1400
        );

        try {
          await doSearch(clean, { source: "voice" });
        } finally {
          try {
            rec.stop();
          } catch {}
        }
      };

      rec.onstart = () => {
        setVoiceListening(true);
        showVoiceToast(
          t("search.voiceStarted", {
            defaultValue: "Sesli arama başladı — şimdi konuşabilirsin.",
          }),
          "info",
          2400
        );
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
          if (merged) setValue(merged);

          // ✅ Kullanıcı duraklayınca otomatik “tamam” kabul et
          clearTimeout(idleTimer);
          idleTimer = setTimeout(() => {
            const q = (finalText || interim || "").trim();
            if (q) commit(q);
          }, 550);
        } catch (err) {
          console.warn("Speech onresult error:", err);
        }
      };

      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setVoiceListening(false);
        voiceRecRef.current = null;
        showVoiceToast(
          t("search.voiceError", { defaultValue: "Sesli arama hatası." }),
          "error",
          2400
        );
      };

      rec.onend = () => {
        try {
          clearTimeout(idleTimer);
        } catch {}
        setVoiceListening(false);
        voiceRecRef.current = null;
      };

      rec.start();
    } catch (err) {
      console.warn("Speech recognition start error:", err);
      setVoiceListening(false);
      voiceRecRef.current = null;
      showVoiceToast(
        t("search.voiceError", { defaultValue: "Sesli arama hatası." }),
        "error",
        2400
      );
    }
  }

  // === Görsel arama ===
  function openCamera() {
    try {
      if (fileRef.current) fileRef.current.value = "";
    } catch (_) {}
    fileRef.current?.click();
  }

  // ✅ Kamera upload'unda base64 şişmesini kes: canvas ile resize+compress
  async function compressImageForVision(file, { maxSide = 1280, quality = 0.82 } = {}) {
    try {
      if (!file) return null;

      // Prefer createImageBitmap (faster)
      let bmp = null;
      try {
        if (typeof createImageBitmap === "function") {
          bmp = await createImageBitmap(file);
        }
      } catch {
        bmp = null;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return null;

      if (bmp) {
        const w = bmp.width || 0;
        const h = bmp.height || 0;
        if (!w || !h) return null;

        const scale = Math.min(1, maxSide / Math.max(w, h));
        const nw = Math.max(1, Math.round(w * scale));
        const nh = Math.max(1, Math.round(h * scale));

        canvas.width = nw;
        canvas.height = nh;
        ctx.drawImage(bmp, 0, 0, nw, nh);
        try { bmp.close?.(); } catch {}

        return canvas.toDataURL("image/jpeg", quality);
      }

      // Fallback: FileReader -> Image
      const dataUrl = await new Promise((ok, fail) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.onerror = () => fail(new Error("File read error"));
        r.readAsDataURL(file);
      });

      const img = await new Promise((ok, fail) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = () => fail(new Error("Image decode error"));
        im.src = String(dataUrl);
      });

      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const nw = Math.max(1, Math.round(w * scale));
      const nh = Math.max(1, Math.round(h * scale));

      canvas.width = nw;
      canvas.height = nh;
      ctx.drawImage(img, 0, 0, nw, nh);
      return canvas.toDataURL("image/jpeg", quality);
    } catch (err) {
      console.warn("compressImageForVision error:", err);
      return null;
    }
  }

  async function onPickFile(e) {
    const f = e.target?.files?.[0];
    if (!f) return;

    const b64 = await compressImageForVision(f);

    if (!b64) {
      console.warn("Vision image prepare failed");
      return;
    }

    const backend = API_BASE || "";

    try {
      const r = await fetch(`${backend}/api/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: b64,
          locale: i18n.language,
          source: "camera",
        }),
      });

      if (!r.ok) {
        console.warn("Vision API hatası:", r.status);
        showVoiceToast(t("search.cameraError", { defaultValue: "Kamera araması şu an çalışmadı." }), "error", 2200);
        return;
      }

      const j = await r.json().catch(() => null);
      if (!j || j.ok === false) {
        showVoiceToast(t("search.cameraError", { defaultValue: "Kamera araması sonucu alınamadı." }), "error", 2200);
        return;
      }
      if (j?.query) {
        const q = String(j.query).trim();
        if (!q) return;
        setValue(q);
		 // 🔥 TEK BEYİN
  await runUnifiedSearch(q, { source: "camera" });
        doSearch(q, { skipUnified: true });
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

      {voiceToast ? (
        <div className="fixed top-[72px] sm:top-[84px] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div
            className={`px-3 py-2 rounded-xl border bg-black/70 backdrop-blur text-xs shadow
              ${voiceToast.kind === "error" ? "border-red-500/30 text-red-100" : voiceToast.kind === "ok" ? "border-emerald-500/25 text-emerald-50" : "border-[#D9A441]/25 text-white"}`}>
            <span className="mr-2 text-[#D9A441]">🎤</span>
            {voiceToast.msg}
          </div>
        </div>
      ) : null}

      <main
        className="flex-1 flex flex-col items-center justify-start w-full px-4 pt-10 sm:pt-14 pb-8"
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

        {/* ◆ Arama Çubuğu (mobil + desktop tek yapı: ikon solda, çerçevesiz; input çerçevesi altın) */}
        <div className="w-full max-w-[760px] mt-3 sm:mt-4 mb-3">
          <div className="flex items-center gap-1 sm:gap-2 w-full flex-nowrap">
            {/* Input (ikon solda, çerçevesiz) */}
            <div className="relative flex-1 min-w-0">
              <input
                id="search-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={placeholders_[currentPlaceholder] || t("search.search")}
                className="w-full h-11 sm:h-12 rounded-xl pl-9 sm:pl-11 pr-4 text-white placeholder:text-white/40 outline-none border border-[#D9A441]/45 focus:border-[#D9A441]/70 bg-[#0B0E12]/45 backdrop-blur"
              />

              <button
                id="search-button"
                onClick={doSearch}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-transparent hover:bg-white/5 active:scale-95 transition"
                aria-label={t("search.search")}
                title={t("search.search")}
              >
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#D9A441]" aria-hidden />
              </button>
            </div>

            {/* Sağ aksiyonlar: Ses / Kamera / QR */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={startMic}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#D9A441]/45 bg-black/25 hover:bg-[#0B0E12]/75 flex items-center justify-center transition ${voiceListening ? "ring-2 ring-[#D9A441]/40 bg-[#D9A441]/10" : ""}`}
                title={t("search.voice")}
                aria-label={t("search.voice")}
              >
                <img
                  src={micIcon}
                  alt={t("search.voice")}
                  className={`w-[18px] h-[18px] sm:w-5 sm:h-5 opacity-90 ${voiceListening ? "animate-pulse" : ""}`}
                />
              </button>

              <button
                onClick={openCamera}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#D9A441]/45 bg-black/25 hover:bg-[#0B0E12]/75 flex items-center justify-center transition"
                title={t("search.camera")}
                aria-label={t("search.camera")}
              >
                <img src={camera} alt={t("search.camera")} className="w-[18px] h-[18px] sm:w-5 sm:h-5 opacity-90" />
              </button>

              <button
                onClick={startQRScanner}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-[#D9A441]/45 bg-black/25 hover:bg-[#0B0E12]/75 flex items-center justify-center transition"
                title={t("search.qr")}
                aria-label={t("search.qr")}
              >
                <QrCode className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#D9A441]" aria-hidden />
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
        {/* Hidden file input for camera capture (mobile) */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickFile}
          className="hidden"
        />

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
      doSearch(q, { skipUnified: true });
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
      doSearch(q, { skipUnified: true });
    }}
    key={i18n.language}
  />
</div>

<div className="mt-auto text-center">
  <Footer fixed />
</div>
{window.location.pathname === "/admin/telemetry" && <TelemetryPanel />}
</div>
);
}
