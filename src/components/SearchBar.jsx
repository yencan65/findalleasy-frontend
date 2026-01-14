// src/components/SearchBar.jsx
import React, {useEffect, useRef, useState, useMemo, useCallback} from "react";
import { Search, Mic, Camera, QrCode } from "lucide-react";
import { runUnifiedSearch } from "../utils/searchBridge";
import { API_BASE } from "../utils/api";
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

  // Double/triple tetik avcısı: aynı sorgu 1–1.5 sn içinde gelirse ignore
  const lastSearchRef = useRef({ q: "", t: 0 });

  const isLikelyBarcode = (s) => /^[0-9]{8,14}$/.test(String(s || "").trim());

  const barcodeCacheKey = (qr) => `fae.barcodeCache:${locale}:${qr}`;

  const getBarcodeCache = (qr) => {
    try {
      const raw = localStorage.getItem(barcodeCacheKey(qr));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || Date.now() - parsed.ts > 15 * 60 * 1000) return null; // 15 dk TTL
      return parsed.payload;
    } catch {
      return null;
    }
  };

  const setBarcodeCache = (qr, payload) => {
    try {
      localStorage.setItem(barcodeCacheKey(qr), JSON.stringify({ ts: Date.now(), payload }));
    } catch {}
  };

  const injectVitrine = (payload) => {
    try {
      window.dispatchEvent(new CustomEvent("fae.vitrine.inject", { detail: payload }));
    } catch {}
  };

  const toNumPrice = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const cleaned = v.replace(/[^0-9.,]/g, "").replace(",", ".");
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const doBarcodeLookup = useCallback(
    async (qrRaw) => {
      const qr = String(qrRaw || "").trim();
      if (!qr) return;

      // Cache (15 dk)
      const cached = getBarcodeCache(qr);
      if (cached) {
        injectVitrine(cached);
        setScannerOpen(false);
        setLoading(false);
        setCalm(t("vitrine.resultsReady", { defaultValue: "Sonuç vitrinde hazır." }), 900);
        return;
      }

      setLoading(true);
      setBusy(t("ai.analyzing", { defaultValue: "Analiz yapılıyor…" }));

      try {
        const resp = await fetch(`${API_BASE || ""}/api/product-info/product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr, locale }),
        });

        const json = await resp.json().catch(() => null);

        const product = json?.product || {};
        const offers = [
          ...(product.offersTrusted || []),
          ...(product.offersOther || []),
        ];

        // Fiyat zorunlu: offer’larda fiyat yoksa hiç yok say
        const items = offers
          .map((o) => {
            const priceNum = toNumPrice(o.price ?? o.finalPrice ?? o.optimizedPrice);
            const finalNum = toNumPrice(o.finalPrice ?? o.price ?? o.optimizedPrice);
            return {
              ...o,
              title: o.title || product.title || product.name || qr,
              image: o.image || product.image,
              summary:
                o.summary ||
                o.description ||
                product.summary ||
                product.description ||
                product.desc ||
                "",
              price: priceNum,
              finalPrice: finalNum ?? priceNum,
              currency: o.currency || product.currency || "TRY",
            };
          })
          .filter((x) => typeof x.price === "number" && x.price > 0);

        if (!items.length) {
          setScannerOpen(false);
          setLoading(false);
          flashMsg(
            t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }),
            2200,
            "danger"
          );
          return;
        }

        // En ucuz en üste (Vitrin sadece best[0] gösteriyor)
        items.sort((a, b) => (a.price || 9e15) - (b.price || 9e15));

        const payload = {
          query: product.title || product.name || items[0]?.title || qr,
          items,
          source: "barcode",
          product,
          ok: true,
        };

        try {
          localStorage.setItem("lastQuery", payload.query || qr);
        } catch {}

        setBarcodeCache(qr, payload);
        injectVitrine(payload);

        setScannerOpen(false);
        setLoading(false);
        setCalm(t("vitrine.resultsReady", { defaultValue: "Sonuç vitrinde hazır." }), 1000);
        clearStatus(STATUS_SRC);
      } catch (e) {
        setScannerOpen(false);
        setLoading(false);
        flashMsg(
          t("errors.network", { defaultValue: "Ağ hatası. Lütfen tekrar dene." }),
          2200,
          "danger"
        );
      }
    },
    [API_BASE, locale, t] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const doSearch = useCallback(
    async (raw, source = "typed") => {
      const cleaned = String(raw ?? value).trim();
      if (!cleaned) return;

      // Barkodsa: normal arama yerine product-info hattı
      if (isLikelyBarcode(cleaned)) {
        await doBarcodeLookup(cleaned);
        return;
      }

      // Aynı sorgu 1–1.5 sn içinde tekrar geldiyse ignore
      const now = Date.now();
      if (lastSearchRef.current.q === cleaned && now - lastSearchRef.current.t < 1200) return;
      lastSearchRef.current = { q: cleaned, t: now };

      setValue(cleaned);
      setScannerOpen(false);

      setLoading(true);
      setBusy(t("search.searching", { defaultValue: "Arama yapılıyor…" }));

      let hadError = false;

      try {
        // TEK ÇAĞRI: runUnifiedSearch zaten vitrine push + trigger yapıyor
        await runUnifiedSearch(cleaned, { locale, source });
      } catch (err) {
        console.warn("UnifiedSearch Error:", err);
        hadError = true;
        flashMsg(
          t("search.searchError", { defaultValue: "Arama başarısız. Lütfen tekrar dene." }),
          2000,
          "danger"
        );
      } finally {
        setLoading(false);
        if (!hadError) {
          setCalm("", 0);
          clearStatus(STATUS_SRC);
        }
      }
    },
    [value, locale, runUnifiedSearch, doBarcodeLookup] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
    // Ücretsiz: görselde barkod yakala (Chrome/Edge destekli)
    try {
      if ("BarcodeDetector" in window) {
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
        });
        const bmp = await createImageBitmap(f);
        const codes = await detector.detect(bmp);
        bmp.close?.();
        const rawValue = codes?.[0]?.rawValue;

        if (rawValue && isLikelyBarcode(rawValue)) {
          kickedSearch = true;
          await doBarcodeLookup(rawValue);
          return;
        }
      }
    } catch {}

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

    const r = await fetch(`${API_BASE || ""}/api/vision?diag=0`, {
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

async function handleQRDetect(result) {
    const raw = String(result || "").trim();
    if (!raw) return;

    try {
      localStorage.setItem("lastQuery", raw);
    } catch {}

    setScannerOpen(false);

    // Barkodsa: ürün-info
    if (isLikelyBarcode(raw)) {
      await doBarcodeLookup(raw);
      return;
    }

    // QR URL/Metinse: normal arama
    doSearch(raw, "qr");
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
          className="flex items-center bg-[#0d1117]/60 border border-gold rounded-full px-3 sm:px-4 py-2 
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
              className="w-full bg-transparent outline-none text-white text-base px-3 pr-24 sm:pr-3 min-w-[120px]"
            />


            <button
              type="button"
              onClick={() => doSearch()}
              disabled={loading}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-gold text-gold bg-transparent hover:bg-white/5 flex items-center justify-center shadow-sm transition disabled:opacity-60"
              aria-label={t("search.search")}
            >
              <Search size={18} />
            </button>
          </div>

          {/* ✅ MOBILE: Mic/Camera/QR, eskiden Ara'nın durduğu yere kayar */}
          <button
            type="button"
            onClick={startMic}
            className="ml-1 text-gold hover:text-white transition p-2 rounded-full"
            aria-label={t("search.voice", { defaultValue: "Sesli arama" })}
          >
            <Mic className={`w-5 h-5 ${micListening ? "animate-pulse" : ""}`} />
          </button>

          <button
            type="button"
            onClick={openCamera}
            className="text-gold hover:text-white transition p-2 rounded-full"
            aria-label={t("cameraSearch", { defaultValue: "Kamera ile ara" })}
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="text-gold hover:text-white transition p-2 rounded-full"
            aria-label={t("qrSearch", { defaultValue: "QR ile ara" })}
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* ✅ SM+ ekranda klasik Ara butonu (input dışı) */}
          <button
            onClick={() => doSearch()}
            disabled={loading}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full border border-gold text-gold bg-transparent hover:bg-white/5 hover:text-white transition disabled:opacity-60"
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
