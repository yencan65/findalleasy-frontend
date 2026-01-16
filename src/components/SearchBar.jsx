// src/components/SearchBar.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, Mic, Camera, QrCode } from "lucide-react";
import { runUnifiedSearch } from "../utils/searchBridge";
import { useTranslation } from "react-i18next";
import { useStatusBus } from "../context/StatusBusContext";
import QRScanner from "./QRScanner";
import { detectCategory } from "../utils/categoryExtractor";
export default function SearchBar({ onSearch, selectedRegion = "TR" }) {
  const { t, i18n } = useTranslation();

  const { setStatus, clearStatus, flash } = useStatusBus();
  const STATUS_SRC = "search";
  const STATUS_PRIO = 10;

  const setBusy = (text) =>
    setStatus(STATUS_SRC, { text, showDots: true, tone: "gold", priority: STATUS_PRIO });

  const setCalm = (text, ms = 900) =>
    setStatus(STATUS_SRC, { text, showDots: false, tone: "muted", priority: STATUS_PRIO, ttlMs: ms });

  const flashMsg = (text, ms = 1600, tone = "muted") =>
    flash(STATUS_SRC, text, ms, { tone, priority: STATUS_PRIO });


  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [micListening, setMicListening] = useState(false);
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
  const locale = (i18n?.language || "tr").toLowerCase();

  // =========================
  // Barkod helpers (15dk cache)
  // =========================
  const isLikelyBarcode = (s) => /^[0-9]{8,14}$/.test(String(s || "").trim());

  const barcodeCacheKey = (qr) => `fae.barcodeCache:${locale}:${qr}`;
  const getBarcodeCache = (qr) => {
    try {
      const raw = window?.localStorage?.getItem(barcodeCacheKey(qr));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || Date.now() - parsed.ts > 15 * 60 * 1000) return null; // 15dk TTL
      return parsed.payload || null;
    } catch {
      return null;
    }
  };

  const setBarcodeCache = (qr, payload) => {
    try {
      window?.localStorage?.setItem(
        barcodeCacheKey(qr),
        JSON.stringify({ ts: Date.now(), payload })
      );
    } catch {}
  };

  const injectVitrine = (payload) => {
    try {
      window.dispatchEvent(new CustomEvent("fae.vitrine.inject", { detail: payload }));
    } catch {}
  };

  const doBarcodeLookup = async (qrRaw) => {
    const qr = String(qrRaw || "").trim();
    if (!qr) return;

    setScannerOpen(false);

    const cached = getBarcodeCache(qr);
    if (cached) {
      injectVitrine(cached);
      return;
    }

    setLoading(true);
    setBusy(t("ai.analyzing", { defaultValue: "Analiz yapılıyor…" }));

    try {
      const resp = await fetch(`/api/product-info/product?force=0&diag=0&paid=0`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, locale, allowPaid: false }),
      });

      const json = await resp.json().catch(() => null);
      const product = json?.product || {};
      const offers = [...(product.offersTrusted || []), ...(product.offersOther || [])];

      // Fiyat zorunlu: price/finalPrice yoksa ele
      const items = offers
        .map((o) => ({
          ...o,
          title: o.title || product.title || product.name || qr,
          image: o.image || product.image,
          price: o.price ?? o.finalPrice,
          finalPrice: o.finalPrice ?? o.price,
          currency: o.currency || product.currency || "TRY",
        }))
        .filter((x) => typeof x.price === "number" && x.price > 0);

      if (!items.length) {
        setCalm(t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }), 2100);
        // App.jsx TTS + toast için
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "empty", query: product.title || product.name || qr, items: [], source: "barcode" },
          })
        );
        return;
      }

      const payload = {
        query: product.title || product.name || qr,
        items,
        source: "barcode",
        product,
        ok: true,
      };

      setBarcodeCache(qr, payload);
      injectVitrine(payload);

      setCalm(t("vitrine.resultsReady", { defaultValue: "Sonuçlar vitrinde hazır." }), 2100);
    } catch (e) {
      setCalm(t("vitrine.resultsError", { defaultValue: "Arama sırasında hata oluştu." }), 2100);
      window.dispatchEvent(
        new CustomEvent("fae.vitrine.results", {
          detail: { status: "error", query: qr, items: [], source: "barcode" },
        })
      );
    } finally {
      setLoading(false);
      clearStatus(STATUS_SRC);
    }
  };

  // =========================
  // Tek arama: dedupe + runUnifiedSearch
  // =========================
  const lastSearchRef = useRef({ q: "", t: 0 });

  const doSearch = useCallback(
    async (raw, source = "typed") => {
      const cleaned = String(raw ?? value).trim();
      if (!cleaned) return;

      // Aynı sorgu 1–1.5 sn içinde tekrar geldiyse ignore (double tetik avcısı)
      const now = Date.now();
      if (lastSearchRef.current.q === cleaned && now - lastSearchRef.current.t < 1200) return;
      lastSearchRef.current = { q: cleaned, t: now };

      setValue(cleaned);
      setScannerOpen(false);

      setLoading(true);
      setBusy(t("ai.analyzing", { defaultValue: "Analiz yapılıyor…" }));

      try {
        const category = detectCategory(cleaned, locale);
        await runUnifiedSearch(cleaned, { region: selectedRegion, category, locale, source });
      } finally {
        setLoading(false);
        clearStatus(STATUS_SRC);
      }
    },
    [value, selectedRegion, locale, runUnifiedSearch, t]
  );
}
}


  // 🔥 Voice Search
  async function startMic() {
    const Rec =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (!Rec) {
      flashMsg(
        t("search.voiceNotSupported", {
          defaultValue: "Tarayıcın ses tanımayı desteklemiyor!",
        }),
        2500
      );
      return;
    }

    const rec = new Rec();
    setMicListening(true);
    setStatus(STATUS_SRC, {
      text: t("search.voiceStarted", {
        defaultValue: "Sesli arama başladı — şimdi konuşabilirsin.",
      }),
      showDots: true,
      tone: "gold",
      priority: STATUS_PRIO,
    });
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
      setMicListening(false);
      flashMsg(
        t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }),
        800
      );
      setValue(text);
      doSearch(text, "mic");
    };

    rec.onerror = () => {
      setMicListening(false);
      flashMsg(t("search.voiceError", { defaultValue: "Sesli arama hatası." }), 2000, "danger");
      // hata sonrası durumun takılı kalmasını engelle
      setTimeout(() => clearStatus(STATUS_SRC), 2100);
    };

    rec.onend = () => {
      setMicListening(false);
      clearStatus(STATUS_SRC);
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

  // Aynı dosya tekrar seçilince de onChange tetiklensin
  try {
    e.target.value = "";
  } catch {}

  // Basit boyut kalkanı (backend de ayrıca clamp var)
  const MAX_BYTES = 6 * 1024 * 1024;
  if (f.size > MAX_BYTES) {
    flashMsg(
      t("cameraTooLarge", {
        defaultValue: "Fotoğraf çok büyük. Lütfen daha küçük bir görsel seç.",
      }),
      2400,
      "danger"
    );
    return;
  }

  setLoading(true);
  setStatus(STATUS_SRC, {
    text: t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor…" }),
    showDots: true,
    tone: "gold",
    priority: STATUS_PRIO,
  });

  let kickedSearch = false;

  try {
    const b64 = await new Promise((ok, bad) => {
      try {
        const r = new FileReader();
        r.onerror = () => bad(new Error("FILE_READ_ERROR"));
        r.onload = () => ok(String(r.result || ""));
        r.readAsDataURL(f);
      } catch (e2) {
        bad(e2);
      }
    });

    const r = await fetch("/api/vision?diag=0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: b64, locale: i18n?.language || "tr" }),
    });

    const j = await r.json().catch(() => null);
    const finalQuery = String(j?.query || "").trim();

    if (!r.ok || j?.ok === false || !finalQuery) {
      const msg = j?.error || `VISION_FAILED_HTTP_${r.status}`;
      throw new Error(msg);
    }

    setValue(finalQuery);

    flashMsg(
      t("search.imageDetected", {
        defaultValue: "Görüntüden anladığım: {{query}}",
        query: finalQuery,
      }),
      900,
      "muted"
    );

    setCalm(t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }), 600);

    kickedSearch = true;
    await doSearch(finalQuery, "camera");
  } catch (err) {
    console.error("Vision error:", err);
    flashMsg(
      t("cameraVisionDisabled", {
        defaultValue:
          "Kamera ile arama hattı hazır ama görsel tanıma kapalı görünüyor. Şimdilik metinle arayın; API anahtarı gelince kamera otomatik çalışır.",
      }),
      3500,
      "danger"
    );
  } finally {
    // Eğer arama hattına devrettiysek, loading'i doSearch yönetir.
    if (!kickedSearch) setLoading(false);
  }
}

function handleQRDetect(result) {
    if (!result) return;

    localStorage.setItem("lastQuery", result);
    setScannerOpen(false);
    doSearch(result, "qr");
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
          className="flex items-center bg-[rgba(255,255,255,0.16)] border border-black/35 rounded-full px-3 sm:px-4 py-2 
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

          {/* ✅ MOBILE: "Ara" butonu inputun içinde.  SM+ ekranda eski düzen korunur. */}
          <div className="relative flex-grow min-w-[120px]">
            <input
              key={"input-" + i18n.language}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={placeholders[index]}
              className="w-full bg-transparent outline-none text-black placeholder:text-black/40 text-base px-3 pr-24 sm:pr-3 min-w-[120px]"
            />


            <button
              type="button"
              onClick={() => doSearch()}
              disabled={loading}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-black/40 text-black/80 bg-transparent hover:bg-black/5 flex items-center justify-center shadow-sm transition disabled:opacity-60"
              aria-label={t("search.search")}
            >
              <Search size={18} />
            </button>
          </div>

          {/* ✅ MOBILE: Mic/Camera/QR, eskiden Ara'nın durduğu yere kayar */}
          <button
            type="button"
            onClick={startMic}
            className="ml-1 text-black/80 hover:text-black transition p-2 rounded-full"
            aria-label={t("search.voice", { defaultValue: "Sesli arama" })}
          >
            <Mic className={`w-5 h-5 ${micListening ? "animate-pulse" : ""}`} />
          </button>

          <button
            type="button"
            onClick={openCamera}
            className="text-black/80 hover:text-black transition p-2 rounded-full"
            aria-label={t("cameraSearch", { defaultValue: "Kamera ile ara" })}
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="text-black/80 hover:text-black transition p-2 rounded-full"
            aria-label={t("qrSearch", { defaultValue: "QR ile ara" })}
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* ✅ SM+ ekranda klasik Ara butonu (input dışı) */}
          <button
            onClick={() => doSearch()}
            disabled={loading}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border border-black/40 text-black/80 bg-transparent hover:bg-black/5 hover:text-black transition disabled:opacity-60"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Kullanıcı "mal mal" beklemesin: net durum göstergesi */}
      {scannerOpen && (
        <QRScanner
          onDetect={handleQRDetect}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </>
  );
}
