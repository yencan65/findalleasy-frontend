// ✅ src/App.jsx — TAMAMEN CERRAHİ OLARAK TEMİZLENMİŞ + GÜÇLENDİRİLMİŞ

import React, { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { API_BASE } from "./utils/api";
import Header from "./components/Header.jsx";
import NetworkStatusBanner from "./components/NetworkStatusBanner.jsx";
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
import { QrCode, Search as SearchIcon, X } from "lucide-react";
import TelemetryPanel from "./components/Admin/TelemetryPanel";
import SystemTelemetryPanel from "./components/SystemTelemetryPanel";
import { runUnifiedSearch } from "./utils/searchBridge";
import { barcodeLookupFlow, isLikelyBarcode } from "./utils/barcodeLookup";

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

function mapSpeechLang(locale) {
  const l = String(locale || "").toLowerCase();
  if (l.startsWith("tr")) return "tr-TR";
  if (l.startsWith("fr")) return "fr-FR";
  if (l.startsWith("ru")) return "ru-RU";
  if (l.startsWith("ar")) return "ar-SA";
  if (l.startsWith("en")) return "en-US";
  return "en-US";
}


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
  const [value, setValue] = useState("");

  // === Sesli arama UI (kullanıcı ne olduğunu ANLASIN diye) ===
  const [voiceToast, setVoiceToast] = useState(null); // { msg, kind }
  const [voiceListening, setVoiceListening] = useState(false);
  const voiceRecRef = useRef(null);
  const voiceToastTimer = useRef(null);

  // === Search UX state ===
  // Kullanıcı arama yapılıyor mu bilmiyordu → artık net.
  const [searchBusy, setSearchBusy] = useState(false);
  const [visionBusy, setVisionBusy] = useState(false);
  const [visionConfirm, setVisionConfirm] = useState(null); // { query, used, weak }
  const [voiceConfirm, setVoiceConfirm] = useState(null); // { query }
  const [scanConfirm, setScanConfirm] = useState(null); // { kind: 'barcode'|'qr', isBarcode, code?, query?, source? }
  const searchInputRef = useRef(null);

  const showVoiceToast = (msg, kind = "info", ttl = 2200) => {
    try {
      if (voiceToastTimer.current) clearTimeout(voiceToastTimer.current);
    } catch {}
    setVoiceToast({ msg, kind });
    voiceToastTimer.current = setTimeout(() => setVoiceToast(null), ttl);
  };

const ttsLastRef = useRef({ msg: "", t: 0 });

function mapTtsLang(lang) {
  const l = String(lang || "tr").toLowerCase();
  if (l.startsWith("tr")) return "tr-TR";
  if (l.startsWith("en")) return "en-US";
  if (l.startsWith("de")) return "de-DE";
  if (l.startsWith("fr")) return "fr-FR";
  if (l.startsWith("ru")) return "ru-RU";
  if (l.startsWith("ar")) return "ar-SA";
  return "tr-TR";
}

function speak(text) {
  try {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const msg = String(text || "").trim();
    if (!msg) return;

    const now = Date.now();
    const last = ttsLastRef.current || { msg: "", t: 0 };

    // Aynı cümle kısa sürede tekrar gelirse sus (double event avcısı)
    if (last.msg === msg && now - last.t < 4000) return;

    // Çok hızlı ardışık çağrıları da kes
    if (now - last.t < 250) return;

    ttsLastRef.current = { msg, t: now };

    try { synth.cancel(); } catch {}

    const u = new SpeechSynthesisUtterance(msg);
    u.lang = mapTtsLang(i18n.language || "tr");
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;

    synth.speak(u);
  } catch {}
}

useEffect(() => {
  if (typeof window === "undefined") return;

  function onVitrineResults(e) {
    const d = e?.detail || {};
    const status = String(d.status || "").toLowerCase();
    const q = String(d.query || d.q || "").trim();

    // UI net olsun: event geldiyse artık "busy" bitmiştir.
    setSearchBusy(false);

    // İlk yüklemede (query boşken) vitrin "empty" dönebiliyor.
    // Kullanıcı arama yapmadıysa "sonuç yok" toast'ı göstermeyelim.
    if (!q) return;

    if (status === "success") {
      const msg = t("vitrine.resultsReady", {
        defaultValue: "Sonuçlar vitrinde hazır. Teşekkürler.",
      });
      showVoiceToast(msg, "success", 2200);
      speak(msg);
      return;
    }

    if (status === "empty") {
      const msg = t("vitrine.noResults", {
        defaultValue: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin.",
      });
      showVoiceToast(msg, "warn", 2600);
      speak(msg);
      return;
    }

    if (status === "error") {
      const msg = t("vitrine.resultsError", {
        defaultValue: "Arama sırasında hata oluştu. Lütfen tekrar deneyin.",
      });
      showVoiceToast(msg, "error", 2600);
      speak(msg);
    }
  }

  window.addEventListener("fae.vitrine.results", onVitrineResults);
  return () => window.removeEventListener("fae.vitrine.results", onVitrineResults);
}, [i18n.language, t]);

  const fileRef = useRef(null);

  // === Arama ===
  async function doSearch(q, opts = {}) {
    const raw = q ?? value;
    const query = String(raw ?? "").trim();
    if (!query) return null;

    // 🧯 Klasik JS bug: yanlışlıkla object yollanırsa "[object Object]" olur.
    if (/^\[object\s+Object\]$/i.test(query) || query.toLowerCase().includes("[object object]")) {
      showVoiceToast(
        t("search.badQuery", {
          defaultValue: 'Arama metni bozuldu ("[object Object]"). Lütfen tekrar deneyin.',
        }),
        "warn",
        2600
      );
      return null;
    }

    const source = String(opts?.source || "manual");

    setSearchBusy(true);
    // Kullanıcı arama yapıldığını UI'da net görsün.
    showVoiceToast(
      t("search.searching", { defaultValue: "Arama yapılıyor…" }),
      "info",
      1800
    );
    try {
      // ✅ TEK HAT: ne /api/search, ne çift event.
      const out = await runUnifiedSearch(query, {
        source,
        locale: i18n.language || "tr",
      });
      return out;
    } catch (err) {
      console.warn("Arama hatası:", err);
      setSearchBusy(false);
      showVoiceToast(
        t("search.searchError", {
          defaultValue: "Arama sırasında hata oluştu. Lütfen tekrar deneyin.",
        }),
        "error",
        2600
      );
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

    // Yeni bir dinleme başlatırken eski onayı kapat
    setVoiceConfirm(null);

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

      rec.lang = mapSpeechLang(i18n.language);
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
        setVoiceConfirm({ query: clean });
        showVoiceToast(
          t("search.voiceConfirmToast", {
            defaultValue: "Duydum — aramam için onay ver.",
          }),
          "info",
          1800
        );

        setTimeout(() => {
          try {
            searchInputRef.current?.focus?.();
          } catch {}
        }, 0);

        try {
          rec.stop();
        } catch {}
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
          }, 420);
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
    const file = e?.target?.files?.[0];
    // clear input so the same file can be re-picked
    try { if (e?.target) e.target.value = ""; } catch {}

    if (!file) return;

    // guard: very large images can hang mobile + uploads
    const MAX_MB = 10;
    if (file.size && file.size > MAX_MB * 1024 * 1024) {
      showVoiceToast(t("search.imageTooLarge", { defaultValue: "Görsel çok büyük. Daha küçük bir fotoğraf deneyin." }), "error");
      return;
    }

    setVisionBusy(true);
    showVoiceToast(t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor..." }), "info");

    const locale = (i18n?.language || "tr").slice(0, 2);

    // --- 1) FREE-FIRST: barcode detection (BarcodeDetector -> ZXing) ---
    const tryBarcodeDetector = async () => {
      if (!window?.BarcodeDetector) return "";
      try {
        const supported = typeof window.BarcodeDetector.getSupportedFormats === "function"
          ? await window.BarcodeDetector.getSupportedFormats()
          : null;
        const prefer = ["ean_13","ean_8","upc_a","upc_e","code_128","code_39","itf","qr_code","data_matrix","pdf417"];
        const formats = supported ? prefer.filter(f => supported.includes(f)) : prefer;
        const detector = new window.BarcodeDetector({ formats });
        const bmp = await createImageBitmap(file);
        const codes = await detector.detect(bmp);
        try { bmp.close?.(); } catch {}
        const raw = (codes && codes[0] && (codes[0].rawValue || codes[0].raw)) || "";
        return (raw || "").trim();
      } catch {
        return "";
      }
    };

    const tryZXing = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        const url = URL.createObjectURL(file);
        try {
          const res = await reader.decodeFromImageUrl(url);
          const txt = (res?.getText?.() || res?.text || "").trim();
          return txt;
        } finally {
          try { URL.revokeObjectURL(url); } catch {}
          try { reader.reset?.(); } catch {}
        }
      } catch {
        return "";
      }
    };

    try {
      let code = await tryBarcodeDetector();
      if (!code) code = await tryZXing();

      if (code && isLikelyBarcode(code)) {
        // ✅ User must confirm before search
        const compact = String(code).trim().replace(/\s+/g, "");
        setValue(compact);
        setVisionConfirm(null);
        setVoiceConfirm(null);
        setScanConfirm({ kind: "barcode", isBarcode: true, code: compact, source: "camera" });
        return;
      }

      // --- 2) FREE-FIRST: local text detection (TextDetector) ---
      if (window?.TextDetector) {
        try {
          const td = new window.TextDetector();
          const bmp = await createImageBitmap(file);
          const blocks = await td.detect(bmp);
          try { bmp.close?.(); } catch {}
          const txt = (blocks || []).map(b => (b?.rawValue || b?.text || "")).join(" ").replace(/\s+/g, " ").trim();
          if (txt && txt.length >= 3) {
            // trim to a sane query
            const q = txt.length > 120 ? txt.slice(0, 120) : txt;
            setValue(q);
            setVisionConfirm({ query: q, used: "text-local", weak: true });
            return;
          }
        } catch {
          // ignore
        }
      }

      // --- 3) BACKEND vision fallback (paid/official) ---
      const b64 = await compressImageForVision(file);
      const r = await fetch(`${API_BASE}/api/vision?diag=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, locale }),
      });

      const j = await r.json().catch(() => null);
      if (!j?.ok) {
        showVoiceToast(t("search.cameraError", { defaultValue: "Görsel analizi başarısız. Lütfen tekrar dene." }), "error");
        return;
      }

      const query = String(j.query || "").trim();
      if (!query) {
        showVoiceToast(t("search.cameraNoMatch", { defaultValue: "Görselde anlamlı bir şey bulunamadı." }), "info");
        return;
      }

      setValue(query);
      setVisionConfirm({ query, used: j.used || "vision", weak: !!j.weak });

    } catch (err) {
      console.error("onPickFile error", err);
      showVoiceToast(t("search.cameraError", { defaultValue: "Görsel analizi başarısız. Lütfen tekrar dene." }), "error");
    } finally {
      setVisionBusy(false);
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
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-white font-sans overflow-x-hidden">
      <Header />
      <NetworkStatusBanner />

      {voiceToast ? (
        <div className="fixed top-[108px] sm:top-[124px] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div
            className={`px-3 py-2 rounded-xl border bg-black/70 backdrop-blur text-xs shadow
              ${voiceToast.kind === "error" ? "border-red-500/30 text-red-100" : voiceToast.kind === "ok" ? "border-emerald-500/25 text-emerald-50" : "border-[#D9A441]/25 text-white"}`}>
            <span className="mr-2 text-[#D9A441]">🎤</span>
            {voiceToast.msg}
          </div>
        </div>
      ) : null}

      <main
        className="flex-1 flex flex-col items-center justify-start w-full px-4 pt-10 sm:pt-14 pb-28 sm:pb-8"
      >
        {/* ◆ SLOGAN */}
        <h2 className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[18px] sm:text-[20px] md:text-[24px] lg:text-[29px] font-semibold text-center select-none px-2 leading-tight text-black">
          <span className="text-black">{t("yazman yeterli,")}</span>
          <span className="text-black">{t("gerisini")}</span>

          <div
            className="relative group transition-transform duration-500 hover:scale-110"
            title="Sono AI"
          >
            <div
              className="absolute inset-0 rounded-full border-[2px] border-[#8b8b8b]
              shadow-[0_0_10px_rgba(120,120,120,0.45),0_0_22px_rgba(120,120,120,0.35)] opacity-70
              group-hover:shadow-[0_0_16px_rgba(120,120,120,0.55),0_0_34px_rgba(120,120,120,0.45)]
              transition-all duration-500 ease-in-out"
            ></div>
            <img
              src={sonoFace}
              alt="Sono"
              className="relative w-[24px] h-[24px] sm:w-[26px] sm:h-[26px] rounded-full drop-shadow-[0_0_4px_rgba(120,120,120,0.55)]"
            />
          </div>

          <span className="text-black">{t("halleder.")}</span>
        </h2>

        {/* ◆ Arama Çubuğu (mobil + desktop tek yapı: ikon solda, çerçevesiz; input çerçevesi altın) */}
        <div className="w-full max-w-[760px] mt-3 sm:mt-4 mb-3">
          <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:gap-3">
            {/* Input (ikon solda; clear X sağda) */}
            <div className="relative w-full md:flex-1">
              <input
                ref={searchInputRef}
                id="search-input"
                value={value}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue(v);
                  setVisionConfirm((prev) => (prev ? { ...prev, query: v } : prev));
                }}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={t("ph.searchProduct", { defaultValue: "Ürün veya hizmet ara" })}
                className="w-full h-11 sm:h-12 rounded-xl pl-9 sm:pl-11 pr-11 sm:pr-12 text-black placeholder:text-black/40 outline-none border border-black/35 focus:border-black/55 bg-[rgba(255,255,255,0.16)] backdrop-blur"
              />

              <button
                id="search-button"
                onClick={doSearch}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1 rounded-md bg-transparent hover:bg-white/5 active:scale-95 transition"
                aria-label={t("search.search")}
                title={t("search.search")}
              >
                <SearchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-black/80" aria-hidden />
              </button>

              {/* Tek dokunuşla temizle */}
              {String(value || "").trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setValue("");
                    setVisionConfirm(null);
                    try {
                      searchInputRef.current?.focus?.();
                    } catch {}
                  }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-transparent hover:bg-white/5 active:scale-95 transition"
                  aria-label={t("actions.clear", { defaultValue: "Temizle" })}
                  title={t("actions.clear", { defaultValue: "Temizle" })}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" aria-hidden />
                </button>
              ) : null}
            </div>

            {/* Ses / Kamera / QR → bir alt satır */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={startMic}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-black/35 bg-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.16)] flex items-center justify-center transition ${voiceListening ? "ring-2 ring-black/30 bg-black/5" : ""}`}
                title={t("search.voice")}
                aria-label={t("search.voice")}
              >
                <img
                  src={micIcon}
                  alt={t("search.voice")}
                  className={`w-[18px] h-[18px] sm:w-5 sm:h-5 opacity-90 filter brightness-0 ${voiceListening ? "animate-pulse" : ""}`}
                />
              </button>

              <button
                onClick={openCamera}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-black/35 bg-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.16)] flex items-center justify-center transition"
                title={t("search.camera")}
                aria-label={t("search.camera")}
              >
                <img src={camera} alt={t("search.camera")} className="w-[18px] h-[18px] sm:w-5 sm:h-5 opacity-90 filter brightness-0" />
              </button>

              <button
                onClick={startQRScanner}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-black/35 bg-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.16)] flex items-center justify-center transition"
                title={t("search.qr")}
                aria-label={t("search.qr")}
              >
                <QrCode className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-black/80" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* ◆ Arama / Kamera durum göstergesi (kullanıcıya net geri bildirim) */}
        <div className="w-full max-w-[760px] -mt-1 mb-2">
          {visionBusy ? (
            <div className="flex items-center justify-center gap-2 text-[12px] sm:text-[13px] text-white/80 select-none">
              <div className="w-3 h-3 rounded-full border border-[#D9A441] border-t-transparent animate-spin" />
              <span>{t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor..." })}</span>
            </div>
          ) : searchBusy ? (
            <div className="flex items-center justify-center gap-2 text-[12px] sm:text-[13px] text-white/80 select-none">
              <div className="w-3 h-3 rounded-full border border-[#D9A441] border-t-transparent animate-spin" />
              <span>{t("search.searching", { defaultValue: "Arama yapılıyor..." })}</span>
            </div>
			  ) : scanConfirm ? (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#D9A441]/35 bg-black/25 px-3 py-2">
				  <div className="text-[12px] sm:text-[13px] text-white/85">
				    {scanConfirm?.isBarcode ? (
				      <>
				        <span className="text-white/70">{t("search.barcodeDetected", { defaultValue: "Barkod algılandı: {{code}}", code: String(scanConfirm?.code || value || "").trim() })}</span>
				        <span className="text-white/70">{" "}— {t("search.confirmQuestion", { defaultValue: "Bu aramayı yapmak istiyor musunuz?" })}</span>
				      </>
				    ) : (
				      <>
				        <span className="text-white/70">{t("search.voiceHeardPrefix", { defaultValue: "Anladığım:" })}</span>{" "}
				        <span className="text-[#D9A441] font-semibold">{String(value || scanConfirm?.query || "").trim()}</span>
				        <span className="text-white/70">{" "}— {t("search.confirmQuestion", { defaultValue: "Bu aramayı yapmak istiyor musunuz?" })}</span>
				      </>
				    )}
				  </div>

				  <div className="flex items-center gap-2">
				    <button
				      onClick={async () => {
				        const src = String(scanConfirm?.source || "manual");
				        const isBc = !!scanConfirm?.isBarcode;
				        const q = String(value || scanConfirm?.query || scanConfirm?.code || "").trim();
				        const code = String(scanConfirm?.code || q || "").trim().replace(/\s+/g, "");
				        setScanConfirm(null);
				        if (!q) return;

				        if (isBc && isLikelyBarcode(code)) {
				          try { localStorage.setItem("lastQuerySource", src); } catch {}
				          setSearchBusy(true);
				          showVoiceToast(t("search.searching", { defaultValue: "Arama yapılıyor…" }), "info", 1800);
				          const locale = (i18n?.language || "tr").toLowerCase();
				          let out = null;
				          try {
				            out = await barcodeLookupFlow(code, {
				              locale,
				              allowPaidSecondStage: true,
				              source: src === "camera" ? "camera-barcode" : "barcode",
				            });
				          } catch (err) {
				            console.warn("barcodeLookupFlow error:", err);
				            setSearchBusy(false);
				            showVoiceToast(
				              t("search.searchError", {
				                defaultValue: "Arama sırasında hata oluştu. Lütfen tekrar deneyin.",
				              }),
				              "error",
				              2600
				            );
				            return;
				          }

				          // Eğer barkod hattı boş dönerse, ürün adını normal aramaya düşür.
			          const humanQ = String(out?.query || "").trim();
			          const status = String(out?.status || "").toLowerCase();
			          const isError = status === "error";
			          const isEmpty = status === "empty" || (Number(out?.itemsLen || 0) <= 0);

			          // ✅ Barkod çözülemediyse bile kullanıcı "Ara" dedi.
			          // O yüzden en azından vitrin aramasına düşür (affiliate→free→paid sırasını S200 yönetir).
			          if (!isError && isEmpty) {
			            const fallbackQ = (humanQ && humanQ !== code) ? humanQ : code;
			            try { setValue(fallbackQ); } catch {}
			            doSearch(fallbackQ, { source: "barcode-fallback" });
			          }
				          return;
				        }

				        // Normal QR text / manuel metin
				        doSearch(q, { source: src || "qr" });
				      }}
				      className="text-xs px-3 py-1 rounded-lg border border-[#D9A441]/60 text-[#f5d76e] hover:bg-[#D9A441]/10"
				    >
				      {t("search.confirmSearch", { defaultValue: "Ara" })}
				    </button>

				    <button
				      onClick={() => {
				        setTimeout(() => {
				          try { searchInputRef.current?.focus?.(); } catch {}
				        }, 0);
				      }}
				      className="text-xs px-3 py-1 rounded-lg border border-white/20 text-white/80 hover:bg-white/5"
				    >
				      {t("search.editQuery", { defaultValue: "Düzenle" })}
				    </button>

				    <button
				      onClick={() => setScanConfirm(null)}
				      className="text-xs px-3 py-1 rounded-lg border border-white/15 text-white/60 hover:bg-white/5"
				    >
				      {t("search.cancel", { defaultValue: "Vazgeç" })}
				    </button>
				  </div>
				</div>
			  ) : voiceConfirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[#D9A441]/35 bg-black/25 px-3 py-2">
              <div className="text-[12px] sm:text-[13px] text-white/85">
                <span className="text-white/70">
                  {t("search.voiceHeardPrefix", { defaultValue: "Sesli komuttan anladığım:" })}
                </span>{" "}
                <span className="text-[#D9A441] font-semibold">{voiceConfirm?.query}</span>
                <span className="text-white/70">
                  {" "}
                  — {t("search.voiceConfirmQuestion", { defaultValue: "Bunu mu arayayım?" })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const q = String(voiceConfirm?.query || value || "").trim();
                    setVoiceConfirm(null);
                    if (!q) return;
                    doSearch(q, { source: "voice" });
                  }}
                  className="text-xs px-3 py-1 rounded-lg border border-[#D9A441]/60 text-[#f5d76e] hover:bg-[#D9A441]/10"
                >
                  {t("search.confirmSearch", { defaultValue: "Ara" })}
                </button>

                <button
                  onClick={() => {
                    setVoiceConfirm(null);
                    setTimeout(() => {
                      try { searchInputRef.current?.focus?.(); } catch {}
                    }, 0);
                  }}
                  className="text-xs px-3 py-1 rounded-lg border border-white/20 text-white/80 hover:bg-white/5"
                >
                  {t("search.editQuery", { defaultValue: "Düzenle" })}
                </button>

                <button
                  onClick={() => setVoiceConfirm(null)}
                  className="text-xs px-3 py-1 rounded-lg border border-white/15 text-white/60 hover:bg-white/5"
                >
                  {t("search.cancel", { defaultValue: "Vazgeç" })}
                </button>
              </div>
            </div>
          ) : visionConfirm ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-[#D9A441]/35 bg-black/25 px-3 py-2">
              <div className="text-[12px] sm:text-[13px] text-white/85">
                <span className="text-white/70">
                  {visionConfirm?.weak
                    ? t("search.imageWeakGuess", { defaultValue: "Emin olamadım, ama şöyle görünüyor:" })
                    : t("search.imageDetectedPrefix", { defaultValue: "Görüntüden anladığım:" })}
                </span>{" "}
                <span className="text-[#D9A441] font-semibold">{String(value || visionConfirm?.query || "").trim() || t("search.search", { defaultValue: "Ara" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const q = String(value || visionConfirm?.query || "").trim();
                    setVisionConfirm(null);
                    if (q) doSearch(q, { source: "camera" });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#D9A441] text-black text-[12px] font-semibold hover:brightness-105 active:scale-95 transition"
                >
                  {t("search.confirmSearch", { defaultValue: "Ara" })}
                </button>
                <button
                  onClick={() => {
                    try {
                      searchInputRef.current?.focus?.();
                    } catch {}
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#D9A441]/45 text-white text-[12px] hover:bg-white/5 active:scale-95 transition"
                >
                  {t("search.editQuery", { defaultValue: "Düzenle" })}
                </button>
                <button
                  onClick={() => setVisionConfirm(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-white/80 text-[12px] hover:bg-white/5 active:scale-95 transition"
                >
                  {t("search.cancel", { defaultValue: "İptal" })}
                </button>
              </div>
            </div>
          ) : null}
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
  <p className="text-[13px] sm:text-[14px] text-black/80 text-center flex items-center gap-2">
    <span>{greeting}</span>
    {name ? <span>{name}</span> : null}
    <span className="text-black/50">||</span>
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

	      const compact = String(q || "").trim().replace(/\s+/g, "");
	      const isBarcode = isLikelyBarcode(compact);
	      if (!q) return;

	      // ✅ QR/BARKOD: kullanıcı onayı olmadan arama başlatma.
	      // Burada sadece query'i input'a yaz ve confirm barı aç.
	      try {
	        setVisionConfirm(null);
	        setVoiceConfirm(null);
	      } catch {}

	      if (isBarcode) {
	        try { setValue(compact); } catch {}
	        setScanConfirm({ kind: "barcode", isBarcode: true, code: compact, source: "qr" });
	        return;
	      }

	      try { setValue(q); } catch {}
	      setScanConfirm({ kind: "qr", isBarcode: false, query: q, source: "qr" });
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

      // ⭐ Tek arama: App'in kendi hattı
      doSearch(q, { source: "ai" });
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
