// ✅ src/App.jsx — TAMAMEN CERRAHİ OLARAK TEMİZLENMİŞ + GÜÇLENDİRİLMİŞ

import React, { useState, useEffect, useRef } from "react";
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
import { BrowserMultiFormatReader } from "@zxing/browser";
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
    // Any result => stop busy indicators
    try { setSearchBusy(false); } catch {}
    try { setVisionBusy(false); } catch {}
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
    const f = e.target?.files?.[0];
    if (!f) return;

    // Aynı dosyayı tekrar seçebilmek için input'u en başta sıfırla
    try { if (e.target) e.target.value = ""; } catch {}

    const backend = API_BASE || "";
    const locale = (i18n?.language || "tr").toLowerCase();

    // Kamera/galeri analizi sürecini kullanıcıya görünür yap
    setVisionBusy(true);
    showVoiceToast(
      t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor…" }),
      "info",
      1800
    );

    // ---------------------------
    // FREE-FIRST LOCAL DETECTION
    // 1) BarcodeDetector (native)
    // 2) ZXing fallback
    // 3) TextDetector (native)
    // 4) Backend /api/vision (last)
    // ---------------------------

    const detectBarcodeLocal = async (file) => {
      // Native BarcodeDetector
      try {
        if (typeof window !== "undefined" && "BarcodeDetector" in window) {
          const Det = window.BarcodeDetector;
          const det = new Det();
          const bmp = await createImageBitmap(file);
          const codes = await det.detect(bmp);
          try { bmp.close?.(); } catch {}
          if (codes && codes.length) {
            const raw = codes[0]?.rawValue || codes[0]?.rawValue?.text || codes[0]?.rawValue?.value;
            const txt = String(raw || "").trim();
            if (txt) return txt;
          }
        }
      } catch {}

      // ZXing fallback
      let url = null;
      try {
        const reader = new BrowserMultiFormatReader(undefined, 250);
        url = URL.createObjectURL(file);
        const r = await reader.decodeFromImageUrl(url);
        try { reader.reset(); } catch {}
        const txt = String(r?.getText?.() ?? r?.text ?? "").trim();
        return txt || null;
      } catch {
        return null;
      } finally {
        try { if (url) URL.revokeObjectURL(url); } catch {}
      }
    };

    const detectTextLocal = async (file) => {
      try {
        if (typeof window === "undefined") return null;
        if (!("TextDetector" in window)) return null;
        const Det = window.TextDetector;
        const det = new Det();
        const bmp = await createImageBitmap(file);
        const blocks = await det.detect(bmp);
        try { bmp.close?.(); } catch {}
        const txt = (blocks || [])
          .map((b) => String(b?.rawValue || "").trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        if (!txt) return null;
        // Çok uzun ve gürültülü metinler aramayı bozar
        return txt.slice(0, 160);
      } catch {
        return null;
      }
    };

    try {
      // 1) Barcode local
      const code = await detectBarcodeLocal(f);
      const compact = String(code || "").trim().replace(/\s+/g, "");
      if (isLikelyBarcode(compact)) {
        showVoiceToast(
          t("search.barcodeDetected", {
            defaultValue: "Barkod algılandı: {{code}}",
            code: compact,
          }),
          "ok",
          1800
        );

        try { localStorage.setItem("lastQuerySource", "camera"); } catch {}
        try { localStorage.setItem("lastQuery", compact); } catch {}

        setSearchBusy(true);
        const out = await barcodeLookupFlow(compact, {
          locale,
          allowPaidSecondStage: true,
          source: "camera",
        });
        setSearchBusy(false);
        setVisionBusy(false);

        const status = String(out?.status || "").trim();
        const qHuman = String(out?.query || "").trim();

        // Eğer barkod çözüm boş döndüyse ama insan-okunur sorgu varsa normal aramaya düş
        const qHumanCompact = qHuman.replace(/\s+/g, "");
        if (status === "empty" && qHuman && !isLikelyBarcode(qHumanCompact) && qHuman.length >= 3) {
          setValue(qHuman);
          doSearch(qHuman, { source: "camera" });
          return;
        }

        if (status === "empty") {
          showVoiceToast(
            t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin." }),
            "warn",
            2600
          );
        }
        return;
      }

      // 2) Text local
      const text = await detectTextLocal(f);
      const qText = String(text || "").trim();
      if (qText && qText.length >= 3) {
        showVoiceToast(
          t("search.textDetected", {
            defaultValue: "Metin algılandı: {{text}}",
            text: qText,
          }),
          "info",
          1800
        );
        setValue(qText);
        try { localStorage.setItem("lastQuerySource", "camera"); } catch {}
        try { localStorage.setItem("lastQuery", qText); } catch {}
        setVisionBusy(false);
        doSearch(qText, { source: "camera" });
        return;
      }

      // 3) Backend vision as last resort
      const b64 = await compressImageForVision(f);
      if (!b64) {
        showVoiceToast(t("search.cameraError", { defaultValue: "Görsel analizi başarısız. Lütfen tekrar dene." }), "error", 2200);
        return;
      }

      const r = await fetch(`${backend}/api/vision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: b64,
          locale: i18n.language,
          source: "camera",
        }),
      });

      // Backend artık hata olsa bile 200 döndürebilir (ok:false)
      const j = await r.json().catch(() => null);
      if (!j || j.ok === false) {
        const errCode = String(j?.error || "").toUpperCase();
        const msg =
          errCode === "NO_MATCH"
            ? t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin." })
            : t("search.cameraError", { defaultValue: "Görsel analizi başarısız. Lütfen tekrar dene." });
        showVoiceToast(msg, errCode === "NO_MATCH" ? "warn" : "error", 2600);
        return;
      }

      const q = String(j?.query || "").trim();
      if (!q) {
        showVoiceToast(
          t("vitrine.noResults", {
            defaultValue: "Üzgünüm, sonuç bulunamadı. Başka bir şey deneyin.",
          }),
          "warn",
          2600
        );
        return;
      }

      const used = String(j?.meta?.used || "").trim();
      const qLower = q.toLowerCase();
      const weak = qLower === "ürün" || qLower === "urun" || q.length < 3 || /^\[object\s+object\]$/i.test(q);

      setValue(q);

      // Serp lens gibi daha “tahmini” kaynaklarda kullanıcı onayı iste.
      if (weak || used.includes("serp_lens")) {
        setVisionConfirm({ query: q, used: used || null, weak });
        setTimeout(() => {
          try { searchInputRef.current?.focus?.(); } catch {}
        }, 0);
        return;
      }

      doSearch(q, { source: "camera" });
    } catch (err) {
      console.warn("Vision arama hatası:", err);
      showVoiceToast(t("search.cameraError", { defaultValue: "Görsel analizi başarısız. Lütfen tekrar dene." }), "error", 2600);
    } finally {
      setVisionBusy(false);
    }
  }

