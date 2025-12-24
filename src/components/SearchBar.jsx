// src/components/SearchBar.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Search, Mic, Camera, QrCode } from "lucide-react";
import { triggerVitrineSearch } from "../utils/vitrineEvent";
import { pushQueryToVitrine, runUnifiedSearch } from "../utils/searchBridge";
import { useTranslation } from "react-i18next";
import QRScanner from "./QRScanner";
import { detectCategory } from "../utils/categoryExtractor";

export default function SearchBar({ onSearch, selectedRegion = "TR" }) {
  const { t, i18n } = useTranslation();

  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const fileRef = useRef(null);

  // Dil değişiminde placeholder reset
  useEffect(() => {
    const rerender = () => setTick((x) => x + 1);
    window.addEventListener("language-change", rerender);
    return () => window.removeEventListener("language-change", rerender);
  }, []);

  const placeholders = useMemo(
    () => [
      t("placeholder.hotel"),
      t("placeholder.car"),
      t("placeholder.food"),
      t("placeholder.tour"),
      t("placeholder.insurance"),
      t("placeholder.estate"),
      t("placeholder.electronic"),
    ],
    [i18n.language]
  );

  useEffect(() => setIndex(0), [i18n.language]);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((p) => (p + 1) % placeholders.length),
      3000
    );
    return () => clearInterval(id);
  }, [placeholders]);

  // ============================================================
  // 🔥 MASTER SEARCH PIPELINE (Tekleştirilmiş + Stabil)
  // ============================================================
 async function doSearch(q = value, source = "input") {
  const cleaned = (q || "").trim();
  if (!cleaned) return;

  setLoading(true);

  try {
    // 🔥 1 — TEK BEYİN: AI Unified Search
    await runUnifiedSearch(cleaned, { source });

    // 🔥 2 — Vitrin tetikleyicisi
    pushQueryToVitrine(cleaned);
    triggerVitrineSearch(cleaned);

  } catch (err) {
    console.warn("UnifiedSearch Error:", err);
  } finally {
    setLoading(false);
  }
}


  // 🔥 Voice Search
  async function startMic() {
    const Rec =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!Rec) return alert(t("search.voiceNotSupported"));

    const rec = new Rec();

    rec.lang =
      i18n.language === "tr"
        ? "tr-TR"
        : i18n.language === "en"
        ? "en-US"
        : i18n.language === "fr"
        ? "fr-FR"
        : i18n.language === "ru"
        ? "ru-RU"
        : "en-US";

    rec.interimResults = false;

    rec.onresult = (e) => {
  const text = e.results[0][0].transcript;
  setValue(text);
  doSearch(text, "mic");
};


    rec.start();
  }

  // 🔥 Camera Vision Search
  function openCamera() {
    fileRef.current?.click();
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    setLoading(true);

    const b64 = await new Promise((ok) => {
      const r = new FileReader();
      r.onloadend = () => ok(r.result);
      r.readAsDataURL(f);
    });

    try {
      const r = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64, locale: i18n.language }),
      });

      const j = await r.json();
      const finalQuery = j?.query?.trim() || "ürün";

    setValue(finalQuery);
doSearch(finalQuery, "camera");

    } catch (e) {
      console.error("Vision error:", e);
     setValue("ürün");
doSearch("ürün", "camera");

    } finally {
      setLoading(false);
    }
  }

  // 🔥 QR Search
  function handleQRDetect(result) {
  if (!result) return;

  localStorage.setItem("lastQuery", result);
  setScannerOpen(false);

  doSearch(result, "qr"); // sadece bu yeterli
}


  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div
        key={"searchbar-" + tick}
        className="search-bar-wrapper flex justify-center w-full"
      >
        <div
          className="flex items-center bg-[#0d1117]/60 border border-gold rounded-full px-4 py-2 
                     w-[520px] max-w-[92%] sm:w-[420px] md:w-[500px] lg:w-[520px]
                     transition-all duration-300 ease-in-out"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPickFile}
          />

          <input
            key={"input-" + i18n.language}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder={placeholders[index]}
            className="flex-grow bg-transparent outline-none text-white text-base px-3 min-w-[120px]"
          />

          <Mic
            className="text-gold mx-1 cursor-pointer hover:scale-110 transition"
            size={20}
            onClick={startMic}
          />

          <Camera
            className="text-gold mx-1 cursor-pointer hover:scale-110 transition"
            size={20}
            onClick={openCamera}
          />

          <QrCode
            className="text-gold mx-1 cursor-pointer hover:scale-110 transition"
            size={20}
            onClick={() => setScannerOpen(true)}
          />

          <button
            onClick={() => doSearch()}
            disabled={loading}
            className="text-gold font-semibold px-3 hover:text-white transition flex items-center gap-1 disabled:opacity-60"
          >
            <Search size={16} />
            {t("search.search")}
          </button>
        </div>
      </div>

      {scannerOpen && (
        <QRScanner onDetect={handleQRDetect} onClose={() => setScannerOpen(false)} />
      )}
    </>
  );
}
