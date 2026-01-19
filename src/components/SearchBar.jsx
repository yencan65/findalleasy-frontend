// src/components/SearchBar.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, Mic, Camera, QrCode } from "lucide-react";
import { runUnifiedSearch } from "../utils/searchBridge";
import { useTranslation } from "react-i18next";
import { useStatusBus } from "../context/StatusBusContext";
import QRScanner from "./QRScanner";
import { API_BASE } from "../utils/api";
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
  // When a barcode cannot be resolved, we ask for a front photo.
  // In that case, skip barcode detection on the next pick to avoid an endless loop.
  const forceVisionNextRef = useRef(false);
  
  // Real camera modal (getUserMedia) — more reliable than <input capture> on many devices
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraCanvasRef = useRef(null);
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
  const isLikelyBarcode = (s) => /^[0-9]{8,18}$/.test(String(s || "").trim());

  const extractBarcodeLike = (input) => {
    try {
      const s = String(input || "");
      const m = s.match(/(\d{8,18})/);
      return m ? String(m[1] || "") : "";
    } catch {
      return "";
    }
  };

  // EAN/UPC checksum guard — prevents prices/phone numbers being mistaken as barcodes
  const isValidEan13 = (code) => {
    const s = String(code || "").replace(/\D/g, "");
    if (s.length !== 13) return false;
    const digits = s.split("").map((c) => parseInt(c, 10));
    if (digits.some((n) => !Number.isFinite(n))) return false;
    const check = digits[12];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    const calc = (10 - (sum % 10)) % 10;
    return calc === check;
  };

  const isValidUpcA = (code) => {
    const s = String(code || "").replace(/\D/g, "");
    if (s.length !== 12) return false;
    const digits = s.split("").map((c) => parseInt(c, 10));
    if (digits.some((n) => !Number.isFinite(n))) return false;
    const check = digits[11];
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    const calc = (10 - (sum % 10)) % 10;
    return calc === check;
  };

  const isValidEan8 = (code) => {
    const s = String(code || "").replace(/\D/g, "");
    if (s.length !== 8) return false;
    const digits = s.split("").map((c) => parseInt(c, 10));
    if (digits.some((n) => !Number.isFinite(n))) return false;
    const check = digits[7];
    let sum = 0;
    // EAN-8: positions 1,3,5,7 (0,2,4,6) weight 3; positions 2,4,6 weight 1
    for (let i = 0; i < 7; i++) sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    const calc = (10 - (sum % 10)) % 10;
    return calc === check;
  };

  const isProbablyBarcode = (code) => {
    const s = String(code || "").replace(/\D/g, "");
    if (!/^\d{8,18}$/.test(s)) return false;
    if (s.length === 13) return isValidEan13(s);
    if (s.length === 8) return isValidEan8(s);
    if (s.length === 12) return isValidUpcA(s);
    // Heuristic: TR GTIN often starts with 869; allow other GTIN lengths too
    if (s.startsWith("869")) return true;
    return s.length === 14 || s.length === 18 || s.length === 10 || s.length === 11;
  };

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

    const parsePrice = (val) => {
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (typeof val !== "string") return null;
      let s = val.trim();
      if (!s) return null;
      // strip currency + spaces
      s = s.replace(/[^0-9.,-]/g, "");
      if (!s) return null;
      const hasDot = s.includes(".");
      const hasComma = s.includes(",");
      if (hasDot && hasComma) {
        // TR style: 1.234,56
        s = s.replace(/\./g, "").replace(/,/g, ".");
      } else if (hasComma && !hasDot) {
        // 123,45
        s = s.replace(/,/g, ".");
      } else {
        // 1.234.56 -> keep last as decimal
        const parts = s.split(".");
        if (parts.length > 2) {
          const dec = parts.pop();
          s = parts.join("") + "." + dec;
        }
      }
      const n = Number.parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };

    const backend = API_BASE || "";

    const buildItems = (product) => {
      const offers = [...(product?.offersTrusted || []), ...(product?.offersOther || [])];
      return offers
        .map((o) => {
          const rawPrice = o?.price ?? o?.finalPrice;
          const rawFinal = o?.finalPrice ?? o?.price;
          const price = typeof rawPrice === "number" ? rawPrice : parsePrice(rawPrice);
          const finalPrice = typeof rawFinal === "number" ? rawFinal : parsePrice(rawFinal);
          return {
            ...o,
            title: o?.title || product?.title || product?.name || qr,
            image: o?.image || product?.image,
            price,
            finalPrice,
            currency: o?.currency || product?.currency || "TRY",
          };
        })
        .filter((x) => typeof x.price === "number" && Number.isFinite(x.price) && x.price > 0);
    };

    const postLookup = async (allowPaid) => {
      const url = `${backend}/api/product-info/product?force=0&diag=0&paid=${allowPaid ? 1 : 0}`;
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const to = controller ? setTimeout(() => controller.abort(), 9000) : null;
      const resp = await fetch(url, {
        signal: controller ? controller.signal : undefined,
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fae-allow-serp-lens": "1" },
        body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
      });
      if (to) clearTimeout(to);
      const json = await resp.json().catch(() => null);
      return { resp, json };
    };

    setLoading(true);
    setBusy(t("ai.analyzing", { defaultValue: "Analiz yapılıyor…" }));

    try {
      // 1) Free-first
      let { resp, json } = await postLookup(false);
      let product = json?.product || {};
      let items = buildItems(product);

      // 2) Paid fallback (only if empty)
      if ((!resp?.ok || json?.ok === false || !items.length) ) {
        ({ resp, json } = await postLookup(true));
        product = json?.product || product;
        items = buildItems(product);
      }

      if (!items.length) {
        // NO-JUNK POLICY:
        // - Raw barcode with generic search produces unrelated results.
        // - If backend says "needsImage", directly open camera upload.
        const needsImage = !!json?.needsImage || !!product?.needsImage;
        const msg = String(json?.message || "").trim();
        const suggested = String(product?.suggestedQuery || "").trim();

        // If we have a real product name hint, we can safely fall back to normal search.
        if (suggested && !/^\d{8,18}$/.test(suggested)) {
          setCalm(t("vitrine.noResults", { defaultValue: "Barkod okundu — ürün adından arıyorum." }), 1800);
          try { setValue(suggested); } catch {}
          await doSearch(suggested, "barcode-hint");
          return;
        }

        // Otherwise: ask user for a front photo (best identity source)
        flashMsg(
          msg || t("barcode.needsImage", { defaultValue: "Bu barkod için veri bulunamadı. Ürünün ön yüz fotoğrafını yükleyin." }),
          2600,
          needsImage ? "muted" : "danger"
        );
        setLoading(false);
        clearStatus(STATUS_SRC);
        try { forceVisionNextRef.current = true; } catch {}
        openCamera();
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "needsImage", query: qr, items: [], source: "barcode", product },
          })
        );
        return;
      }

      const payload = {
        query: product?.title || product?.name || qr,
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
        try {
          window?.localStorage?.setItem?.("lastQueryCategory", String(category || ""));
        } catch {}
        await runUnifiedSearch(cleaned, { region: selectedRegion, categoryHint: category, locale, source });
      } finally {
        setLoading(false);
        clearStatus(STATUS_SRC);
      }
    },
    [value, selectedRegion, locale, runUnifiedSearch, t]
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
    // Prefer real camera (getUserMedia) when available; fallback to file picker
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        setCameraModalOpen(true);
        return;
      }
    } catch {}

    fileRef.current?.click();
  }

  function closeCameraModal() {
    try {
      const s = streamRef.current;
      if (s && typeof s.getTracks === "function") {
        for (const tr of s.getTracks()) tr.stop();
      }
    } catch {}
    try {
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
    try {
      streamRef.current = null;
    } catch {}
    setCameraModalOpen(false);
  }

  useEffect(() => {
    if (!cameraModalOpen) return;
    let canceled = false;

    const start = async () => {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (canceled) {
          try { stream.getTracks().forEach((t) => t.stop()); } catch {}
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {}
        }
      } catch (e) {
        console.warn("getUserMedia failed; falling back to file picker:", e);
        closeCameraModal();
        setTimeout(() => {
          try { fileRef.current?.click(); } catch {}
        }, 0);
      }
    };

    start();

    return () => {
      canceled = true;
      try {
        const s = streamRef.current;
        if (s && typeof s.getTracks === "function") s.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        if (videoRef.current) videoRef.current.srcObject = null;
      } catch {}
      try {
        streamRef.current = null;
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraModalOpen]);

  async function captureFromCamera() {
    try {
      const v = videoRef.current;
      if (!v) throw new Error("NO_VIDEO");
      const w = v.videoWidth || 1280;
      const h = v.videoHeight || 720;

      let canvas = cameraCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        cameraCanvasRef.current = canvas;
      }

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(v, 0, 0, w, h);

      const blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("CAPTURE_BLOB_FAIL");

      const file = new File([blob], `camera_${Date.now()}.jpg`, {
        type: blob.type || "image/jpeg",
      });

      closeCameraModal();
      await processImageFile(file, { origin: "camera" });
    } catch (e) {
      console.error("captureFromCamera error:", e);
      flashMsg(
        t("cameraCaptureFail", {
          defaultValue: "Fotoğraf çekilemedi. Lütfen tekrar deneyin.",
        }),
        2200,
        "danger"
      );
    }
  }


  // ============================================================
  // Kamera dosyası: Ücretsiz tespit (BarcodeDetector/TextDetector) → en son backend /api/vision
  // ============================================================
  const detectBarcodesFromFile = async (file) => {
    if (typeof window === "undefined") return [];

    const normalizeCandidates = (vals) => {
      const compact = (vals || [])
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .map((v) => v.replace(/\s+/g, ""));
      const numeric = compact.find((v) => /^[0-9]{8,18}$/.test(v));
      return numeric ? [numeric] : compact;
    };

    const tryBarcodeDetector = async () => {
      try {
        const BD = window.BarcodeDetector;
        if (!BD) return [];

        const formats = [
          "qr_code",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "itf",
          "codabar",
          "data_matrix",
        ];

        const det = new BD({ formats });
        let src = null;

        try {
          if (typeof createImageBitmap === "function") {
            src = await createImageBitmap(file);
          }
        } catch {
          src = null;
        }

        if (!src) {
          src = await new Promise((resolve, reject) => {
            try {
              const url = URL.createObjectURL(file);
              const img = new Image();
              img.onload = () => {
                try { URL.revokeObjectURL(url); } catch {}
                resolve(img);
              };
              img.onerror = (e) => {
                try { URL.revokeObjectURL(url); } catch {}
                reject(e);
              };
              img.src = url;
            } catch (e) {
              reject(e);
            }
          });
        }

        const w = src?.width || src?.naturalWidth || 0;
        const h = src?.height || src?.naturalHeight || 0;
        let input = src;

        // Büyük görsellerde downscale ederek şansı artır
        if (w && h) {
          const maxDim = 1600;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          if (scale < 1 && typeof document !== "undefined") {
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(w * scale));
            canvas.height = Math.max(1, Math.round(h * scale));
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
              input = canvas;
            }
          }
        }

        const codes = await det.detect(input);
        const vals = (codes || []).map((c) => c?.rawValue || c?.value || "");
        return normalizeCandidates(vals);
      } catch {
        return [];
      }
    };

    const tryZXing = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const url = URL.createObjectURL(file);
        try {
          const result = await reader.decodeFromImageUrl(url);
          const txt = String(result?.getText ? result.getText() : result?.text || "").trim();
          return normalizeCandidates([txt]);
        } finally {
          try { URL.revokeObjectURL(url); } catch {}
          try { reader.reset?.(); } catch {}
        }
      } catch {
        return [];
      }
    };

    const a = await tryBarcodeDetector();
    if (a?.length) return a;
    return await tryZXing();
  };

  // OCR helpers: clean + pick best lines -> query
  const cleanOcrLine = (s) => {
    let t = String(s || "").replace(/\s+/g, " ").trim();
    t = t.replace(/[|_*#^~`]+/g, " ").replace(/\s+/g, " ").trim();
    // remove control chars
    t = t.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim();
    if (t.length < 3) return "";
    if (t.length > 220) t = t.slice(0, 220);
    return t;
  };

  const refineOcrQuery = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";

    const lines = s
      .split(/\r?\n/)
      .map(cleanOcrLine)
      .filter(Boolean);

    const candidates = lines.length ? lines : [cleanOcrLine(s)];

    const bad = /\b(kdv|try|tl|₺|usd|eur|kcal|net|sk[tı]|\bml\b|\bgr\b|\bg\b|\bkg\b|\bl\b|\badet\b|son\s*kullanma|u\.?\s*t\.?\s*t\.?|uretim|tarih|lot|parti)\b/i;

    const score = (ln) => {
      const l = ln.trim();
      let sc = 0;
      const hasLetters = /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(l);
      const hasDigits = /\d/.test(l);
      if (hasLetters) sc += 4;
      if (hasLetters && hasDigits) sc += 2;
      const len = l.length;
      if (len >= 6 && len <= 60) sc += 2;
      if (len > 90) sc -= 2;
      if (bad.test(l)) sc -= 4;
      if (/\bhttps?:\/\//i.test(l) || /\bwww\./i.test(l) || /\.(com|net|org)\b/i.test(l)) sc -= 3;
      if (/^[0-9]{8,18}$/.test(l)) sc += 6; // likely barcode
      return sc;
    };

    // unique + rank
    const uniq = [];
    const seen = new Set();
    for (const c of candidates) {
      const k = String(c || "").toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      uniq.push(String(c));
    }

    uniq.sort((a, b) => score(b) - score(a));

    const best = [];
    for (const ln of uniq) {
      if (best.length >= 2) break;
      if (score(ln) <= 0) continue;
      best.push(ln);
    }

    let out = best.join(" ").replace(/\s+/g, " ").trim();
    if (!out) out = uniq[0] ? cleanOcrLine(uniq[0]) : "";
    if (out.length > 90) out = out.slice(0, 90).trim();
    return out;
  };

  const detectTextFromFile = async (file) => {
    const tryTextDetector = async () => {
      try {
        if (typeof window === "undefined") return "";
        const TD = window.TextDetector;
        if (!TD) return "";

        const det = new TD();
        let src = null;
        try {
          if (typeof createImageBitmap === "function") src = await createImageBitmap(file);
        } catch {}
        if (!src) return "";

        const regions = await det.detect(src);
        const texts = (regions || [])
          .map((r) => String(r?.rawValue || r?.text || "").trim())
          .filter((x) => x && x.length >= 3);

        if (!texts.length) return "";
        return refineOcrQuery(texts.join("\n"));
      } catch {
        return "";
      }
    };

    const tryTesseract = async () => {
      try {
        if (typeof window === "undefined" || typeof document === "undefined") return "";
        const mod = await import("tesseract.js");
        const Tesseract = mod?.default || mod;

        const url = URL.createObjectURL(file);
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) return "";

          const maxDim = 1100;
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(w * scale));
          canvas.height = Math.max(1, Math.round(h * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return "";

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const tessLang = locale.startsWith("tr") ? "tur+eng" : "eng";
          const res = await Tesseract.recognize(canvas, tessLang, { logger: () => {} });
          const raw = String(res?.data?.text || "");
          return refineOcrQuery(raw);
        } finally {
          try { URL.revokeObjectURL(url); } catch {}
        }
      } catch {
        return "";
      }
    };

    const td = await tryTextDetector();
    if (td) return td;

    // tesseract pahalı; 10 sn içinde bir şey vermezse boş kabul et
    const out = await Promise.race([
      tryTesseract(),
      new Promise((resolve) => setTimeout(() => resolve(""), 10000)),
    ]);

    return refineOcrQuery(out);
  };

  async function processImageFile(f, { origin = "upload" } = {}) {
    if (!f) return;

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

    try {
      window?.localStorage?.setItem?.("lastQuerySource", "camera");
    } catch {}

    setStatus(STATUS_SRC, {
      text: t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor…" }),
      showDots: true,
      tone: "gold",
      priority: STATUS_PRIO,
    });

    let kickedSearch = false;
    const forceVision = !!(forceVisionNextRef?.current);
    try {
      forceVisionNextRef.current = false;
    } catch {}

    try {
      // 1) Ücretsiz: BarcodeDetector / ZXing (barkod/QR)
      //    Eğer önceki adım "needsImage" verdiyse, barkod detektörü döngü yaratmasın diye SKIP.
      if (!forceVision) {
        setStatus(STATUS_SRC, {
          text: t("qrScanner.scanning", { defaultValue: "Barkod/QR taranıyor…" }),
          showDots: true,
          tone: "gold",
          priority: STATUS_PRIO,
        });

        const codes = await detectBarcodesFromFile(f);
        const barcode = (Array.isArray(codes) ? codes : []).find((c) => isProbablyBarcode(c)) || "";
        if (barcode) {
          kickedSearch = true;
          await doBarcodeLookup(barcode);
          return;
        }
      }

      // 2) Ücretsiz: TextDetector/Tesseract (yerel OCR)
      setStatus(STATUS_SRC, {
        text: t("search.textDetecting", { defaultValue: "Yazı/etiket okunuyor…" }),
        showDots: true,
        tone: "gold",
        priority: STATUS_PRIO,
      });

      const localText = await detectTextFromFile(f);
      const maybeBar = extractBarcodeLike(localText);
      if (maybeBar && isProbablyBarcode(maybeBar)) {
        kickedSearch = true;
        await doBarcodeLookup(maybeBar);
        return;
      }

      const localQuery = refineOcrQuery(localText);
      if (localQuery && localQuery.length >= 3 && !/^\d{8,18}$/.test(localQuery)) {
        kickedSearch = true;
        try { setValue(localQuery); } catch {}
        doSearch(localQuery, "camera-ocr");
        return;
      }

      // 3) En son: Backend /api/vision (Cloud Vision / Gemini / Serp Lens)
      setStatus(STATUS_SRC, {
        text: t("search.cloudVision", { defaultValue: "Görsel analiz (bulut)…" }),
        showDots: true,
        tone: "gold",
        priority: STATUS_PRIO,
      });

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

      const backend = API_BASE || "";

      const r = await fetch(`${backend}/api/vision?diag=1&allowSerpLens=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fae-allow-serp-lens": "1" },
        body: JSON.stringify({ imageBase64: b64, locale: i18n?.language || "tr", allowSerpLens: true, origin }),
      });

      const j = await r.json().catch(() => ({}));

      const rawText = String(j?.rawText || "");
      const barcodeCandidate = String(
        j?.barcode ||
          (Array.isArray(j?.barcodes) ? j.barcodes[0] : "") ||
          j?.qr ||
          ""
      ).trim();

      // Vision'dan barkod çıkarsa: barcode->product-info hattına git (kredi yakmaz)
      const bcGuess = extractBarcodeLike(barcodeCandidate || rawText || j?.query || "");
      if (bcGuess && isProbablyBarcode(bcGuess)) {
        kickedSearch = true;
        await doBarcodeLookup(bcGuess);
        return;
      }

      const finalQuery = refineOcrQuery(String(j?.query || "").trim() || rawText);

      if (!r.ok || j?.ok === false || !finalQuery) {
        // NO_MATCH olsa bile rawText'den bir şey toparlayabildiysek arayalım
        if (finalQuery) {
          kickedSearch = true;
          try { setValue(finalQuery); } catch {}
          doSearch(finalQuery, "camera-vision-fallback");
          return;
        }
        const msg = j?.error || `VISION_FAILED_HTTP_${r.status}`;
        throw new Error(msg);
      }

      kickedSearch = true;
      try { setValue(finalQuery); } catch {}
      flashMsg(
        t("search.imageDetected", {
          defaultValue: "Görüntüden anladığım: {{query}}",
          query: finalQuery,
        }),
        900,
        "muted"
      );
      doSearch(finalQuery, "camera-vision");
    } catch (err) {
      console.error("Vision error:", err);
      if (!kickedSearch) {
        flashMsg(
          t("vitrine.noResults", {
            defaultValue: "Sonuç bulunamadı. Lütfen daha net/önden bir fotoğraf deneyin.",
          }),
          2600,
          "danger"
        );

        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "empty", query: "", items: [], source: "camera" },
          })
        );
      }
    } finally {
      setLoading(false);
      clearStatus(STATUS_SRC);
    }
  }

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { e.target.value = ""; } catch {}
    await processImageFile(f, { origin: "upload" });
  }



	function handleQRDetect(result) {
	  if (!result) return;
	  const raw = String(result || "").trim();
	  const compact = raw.replace(/\s+/g, "");
	
	  try {
	    window?.localStorage?.setItem?.("lastQuery", raw);
	    window?.localStorage?.setItem?.("lastQuerySource", "qr");
	  } catch {}
	
	  setScannerOpen(false);
	
	  const extracted = extractBarcodeLike(compact) || extractBarcodeLike(raw);
	  if (isLikelyBarcode(extracted)) {
	    doBarcodeLookup(extracted);
	    return;
	  }
	
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



      {cameraModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-white rounded-2xl overflow-hidden border border-black/30 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-semibold text-black">
                {t("camera.takePhoto", { defaultValue: "Fotoğraf çek" })}
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="w-9 h-9 rounded-full border border-black/30 text-black/70 hover:bg-black/5 flex items-center justify-center"
                aria-label={t("close", { defaultValue: "Kapat" })}
              >
                ✕
              </button>
            </div>

            <div className="bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-[360px] object-cover"
              />
            </div>

            <div className="flex gap-2 p-3">
              <button
                type="button"
                onClick={captureFromCamera}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-black/40 text-black bg-transparent hover:bg-black/5 transition disabled:opacity-60"
              >
                {t("camera.capture", { defaultValue: "Çek" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCameraModal();
                  try { fileRef.current?.click(); } catch {}
                }}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border border-black/40 text-black bg-transparent hover:bg-black/5 transition disabled:opacity-60"
              >
                {t("camera.upload", { defaultValue: "Yükle" })}
              </button>
            </div>
          </div>
        </div>
      )}
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