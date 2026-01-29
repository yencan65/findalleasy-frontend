// src/components/SearchBar.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, Mic, Camera, QrCode } from "lucide-react";
import { runUnifiedSearch } from "../utils/searchBridge";
import { useTranslation } from "react-i18next";
import { useStatusBus } from "../context/StatusBusContext";
import QRScanner from "./QRScanner";
import { API_BASE } from "../utils/api";
import { detectCategory } from "../utils/categoryExtractor";
import { analyzeImageLocal } from "../utils/localVision";

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
    const id = setInterval(() => setIndex((p) => (p + 1) % placeholders.length), 3000);
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
      window?.localStorage?.setItem(barcodeCacheKey(qr), JSON.stringify({ ts: Date.now(), payload }));
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

    // Paid sources are ONLY a last resort.
    // Paid sources (Serp/Lens) burn credits -> explicit opt-in only (VITE_FAE_ALLOW_PAID_FALLBACK=1).
    const allowPaidFallback = (() => {
      // Paid sources (Serp/Lens) burn credits -> explicit opt-in only
      const v = String(import.meta.env.VITE_FAE_ALLOW_PAID_FALLBACK ?? "").trim();
      return v === "1";
    })();

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

    // When nothing can be priced/resolved, keep the UX alive with merchant search links.
    const saveFallbackLinksForQuery = (product, q) => {
      try {
        const links = Array.isArray(product?.searchLinks) ? product.searchLinks : [];
        if (!links.length || !q) {
          localStorage.removeItem("faeFallbackLinks");
          return;
        }

        const img = product?.image || "";
        const items = links.map((sl, idx) => {
          const merchant = String(sl?.merchant || "").trim();
          const url = String(sl?.url || "").trim();
          return {
            title: `${merchant ? merchant.toUpperCase() : "MARKET"} - ${q}`,
            merchant: merchant || "market",
            url,
            image: img,
            provider: "link",
            providerKey: `link_${merchant || idx}`,
            providerFamily: "link",
            currency: "TRY",
            price: null,
            finalPrice: null,
            rank: Math.max(1, 60 - idx),
            confidence: "low",
            isFallbackLink: true,
          };
        }).filter((x) => x.url);

        if (!items.length) {
          localStorage.removeItem("faeFallbackLinks");
          return;
        }

        localStorage.setItem("faeFallbackLinks", JSON.stringify({ q, items }));
      } catch {
        // ignore
      }
    };

    const postLookup = async (allowPaid) => {
      // NOTE: force=1 barkod tarafında gereksiz yere "boş" döndürüp UX'i öldürüyor.
      // Cache/hint kullanmak ücretsiz ve daha stabil.
      const strictFreeQ = allowPaid ? "" : "&strictFree=hard&purgeWeak=1";
      const url = `${backend}/api/product-info/product?diag=0&paid=${allowPaid ? 1 : 0}&preferAffiliate=1&paidLastResort=1${strictFreeQ}`;

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
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
      if (allowPaidFallback && (!resp?.ok || json?.ok === false || !items.length)) {
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

        // ✅ (2) suggestedCategory yakala
        const suggestedCategory = String(
          json?.suggestedCategory || product?.suggestedCategory || json?.categoryHint || ""
        ).trim();

        // If we have a real product name hint, we can safely fall back to normal search.
        if (suggested && !/^\d{8,18}$/.test(suggested)) {
          setCalm(t("vitrine.noResults", { defaultValue: "Barkod okundu — ürün adından arıyorum." }), 1800);
          try {
            setValue(suggested);
          } catch {}

          // Keep merchant search links as a safety net in case unified search returns empty.
          saveFallbackLinksForQuery(product, suggested);

          // ✅ (2) category override ile gönder
          await doSearch(suggested, "barcode-hint", { categoryHint: suggestedCategory });
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

        try {
          forceVisionNextRef.current = true;
        } catch {}

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
    // ✅ (3) opts parametresi eklendi
    async (raw, source = "typed", opts = {}) => {
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
        // ✅ (3) category override
        const forcedCategory = String(opts?.categoryHint || "").trim();
        const category = forcedCategory || detectCategory(cleaned, locale);

        try {
          window?.localStorage?.setItem?.("lastQueryCategory", String(category || ""));
        } catch {}

        await runUnifiedSearch(cleaned, {
          region: selectedRegion,
          categoryHint: category,
          locale,
          source,
        });
      } finally {
        setLoading(false);
        clearStatus(STATUS_SRC);
      }
    },
    [value, selectedRegion, locale, t]
  );

  // 🔥 Voice Search
  async function startMic() {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

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
      text: t("search.voiceStarted", { defaultValue: "Sesli arama başladı — şimdi konuşabilirsin." }),
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
      flashMsg(t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }), 800);
      setValue(text);
      doSearch(text, "mic");
    };

    rec.onerror = () => {
      setMicListening(false);
      flashMsg(t("search.voiceError", { defaultValue: "Sesli arama hatası." }), 2000, "danger");
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
                try {
                  URL.revokeObjectURL(url);
                } catch {}
                resolve(img);
              };
              img.onerror = (e) => {
                try {
                  URL.revokeObjectURL(url);
                } catch {}
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
          try {
            URL.revokeObjectURL(url);
          } catch {}
          try {
            reader.reset?.();
          } catch {}
        }
      } catch {
        return [];
      }
    };

    const a = await tryBarcodeDetector();
    if (a?.length) return a;
    return await tryZXing();
  };

  const detectTextFromFile = async (file) => {
    const cleanCandidate = (s) => {
      let t2 = String(s || "").replace(/\s+/g, " ").trim();
      t2 = t2.replace(/[|_*#^~`]+/g, " ").replace(/\s+/g, " ").trim();
      if (t2.length < 3) return "";
      if (/^[0-9]{8,18}$/.test(t2)) return "";
      if (t2.length > 140) t2 = t2.slice(0, 140);
      return t2;
    };

    const tryTextDetector = async () => {
      try {
        if (typeof window === "undefined") return "";
        const TD = window.TextDetector;
        if (!TD) return "";

        const det = new TD();
        let src = null;
        try {
          if (typeof createImageBitmap === "function") {
            src = await createImageBitmap(file);
          }
        } catch {
          src = null;
        }
        if (!src) return "";

        const regions = await det.detect(src);
        const texts = (regions || [])
          .map((r) => String(r?.rawValue || r?.text || "").trim())
          .filter((x) => x && x.length >= 3);

        if (!texts.length) return "";
        texts.sort((a, b) => b.length - a.length);
        return cleanCandidate(texts[0]);
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

          const lang = String(locale || "tr").startsWith("tr") ? "tur+eng" : "eng";
          const res = await Tesseract.recognize(canvas, lang, { logger: () => {} });
          const raw = String(res?.data?.text || "");

          const lines = raw
            .split(/\r?\n/)
            .map((x) => cleanCandidate(x))
            .filter(Boolean);

          if (!lines.length) return "";
          lines.sort((a, b) => b.length - a.length);
          return lines[0] || "";
        } finally {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
      } catch {
        return "";
      }
    };

    const td = await tryTextDetector();
    if (td) return td;

    // Local Tesseract OCR is expensive on weak devices.
    // Default: OFF. Enable only if you really want client-side OCR.
    const LOCAL_OCR_ENABLED = (() => {
      try {
        const v = String(import.meta.env.VITE_FAE_ENABLE_LOCAL_OCR ?? "").trim();
        return v === "1";
      } catch {
        return false;
      }
    })();
    if (!LOCAL_OCR_ENABLED) return "";

    const OCR_TIMEOUT_MS = (() => {
      const n = Number(import.meta.env.VITE_FAE_LOCAL_OCR_TIMEOUT_MS || 4500);
      return Number.isFinite(n) ? Math.max(1200, Math.min(16000, n)) : 4500;
    })();

    const out = await Promise.race([
      tryTesseract(),
      new Promise((resolve) => setTimeout(() => resolve(""), OCR_TIMEOUT_MS)),
    ]);

    return cleanCandidate(out);
  };

  async function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      e.target.value = "";
    } catch {}

    const MAX_BYTES = 6 * 1024 * 1024;
    if (f.size > MAX_BYTES) {
      flashMsg(
        t("cameraTooLarge", { defaultValue: "Fotoğraf çok büyük. Lütfen daha küçük bir görsel seç." }),
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
    const forceVision = !!forceVisionNextRef?.current;
    try {
      forceVisionNextRef.current = false;
    } catch {}

    try {
      if (!forceVision) {
        setStatus(STATUS_SRC, {
          text: t("qrScanner.scanning", { defaultValue: "Barkod/QR taranıyor…" }),
          showDots: true,
          tone: "gold",
          priority: STATUS_PRIO,
        });

        const codes = await detectBarcodesFromFile(f);
        if (codes?.length) {
          kickedSearch = true;
          await doBarcodeLookup(codes[0]);
          return;
        }
      }

      setStatus(STATUS_SRC, {
        text: t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor…" }),
        showDots: true,
        tone: "gold",
        priority: STATUS_PRIO,
      });


      // LOCAL (no-key) vision: run a conservative on-device classifier first.
      // This avoids sending the image anywhere and prevents junk OCR from triggering wrong searches.
      const localVisionEnabled = (() => {
        const v = String(import.meta.env.VITE_FAE_LOCAL_VISION ?? "1").trim();
        return v !== "0";
      })();

      if (localVisionEnabled) {
        try {
          let lastPct = -1;
          const lv = await analyzeImageLocal(f, {
            locale: i18n?.language || "tr",
            onProgress: (p) => {
              const loaded = Number(p?.loaded ?? 0);
              const total = Number(p?.total ?? 0);
              const pct = total > 0 ? Math.round((loaded / total) * 100) : null;
              if (pct != null && pct !== lastPct) {
                lastPct = pct;
                setStatus(STATUS_SRC, {
                  text: t("search.modelDownloading", { defaultValue: "Model indiriliyor… %{{pct}}", pct }),
                  showDots: true,
                  tone: "gold",
                  priority: STATUS_PRIO,
                });
              }
            },
          });

          const qlv = String(lv?.query || "").trim();
          const conf = Number(lv?.confidence ?? 0);

          if (qlv && conf >= 0.55) {
            setValue(qlv);
            flashMsg(
              t("search.imageDetected", { defaultValue: "Görüntüden anladığım: {{query}}", query: qlv }),
              900,
              "muted"
            );
            setCalm(t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }), 600);
            kickedSearch = true;
            await doSearch(qlv, "camera");
            return;
          }
        } catch {
          // ignore, fall through
        }
      }

      const text = await detectTextFromFile(f);
      if (text) {
        setValue(text);
        kickedSearch = true;
        await doSearch(text, "camera");
        return;
      }

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

      // Paid sources are ONLY a last resort.
      // Paid sources (Serp/Lens) burn credits -> explicit opt-in only (VITE_FAE_ALLOW_PAID_FALLBACK=1).
      const allowPaidFallback = (() => {
        const v = String(import.meta.env.VITE_FAE_ALLOW_PAID_FALLBACK ?? "").trim();
        if (v === "1") return true;
        if (v === "0") return false;
        try {
          const h = String(window.location.hostname || "").toLowerCase();
          return h.endsWith("findalleasy.com") || h.endsWith("tikbul.com") || h.includes("mizrak");
        } catch {
          return false;
        }
      })();

      try {
        let rf = null;
        const apiKey = (import.meta?.env?.VITE_API_KEY && String(import.meta.env.VITE_API_KEY).trim()) || "";
        const freeController = typeof AbortController !== "undefined" ? new AbortController() : null;
        const freeTimeoutMs = (() => {
          const n = Number(import.meta.env.VITE_FAE_VISION_FREE_TIMEOUT_MS || 8500);
          return Number.isFinite(n) ? Math.max(1500, Math.min(20000, n)) : 8500;
        })();
        const freeTO = freeController ? setTimeout(() => freeController.abort(), freeTimeoutMs) : null;

        try {
          rf = await fetch(`${backend}/api/vision/free?diag=0`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-fae-use-free-vision": "1",
              ...(apiKey ? { "x-api-key": apiKey } : {}),
            },
            body: JSON.stringify({ imageBase64: b64, locale: i18n?.language || "tr" }),
            signal: freeController?.signal,
          });
        } finally {
          if (freeTO) clearTimeout(freeTO);
        }

        const jf = await rf.json().catch(() => null);
        const qf = String(jf?.query || "").trim();
        const bcf = String(jf?.barcode || (Array.isArray(jf?.barcodes) ? jf.barcodes[0] : "") || jf?.qr || "").trim();

        const bcGuessF = extractBarcodeLike(bcf || jf?.rawText || qf || "");
        const bcF = isLikelyBarcode(bcGuessF) ? bcGuessF.replace(/\s+/g, "") : null;

        if (bcF) {
          kickedSearch = true;
          await doBarcodeLookup(bcF);
          return;
        }

        if (rf.ok && jf?.ok !== false && qf) {
          setValue(qf);
          flashMsg(
            t("search.imageDetected", { defaultValue: "Görüntüden anladığım: {{query}}", query: qf }),
            900,
            "muted"
          );
          setCalm(t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }), 600);
          kickedSearch = true;
          await doSearch(qf, "camera");
          return;
        }
      } catch {
        // ignore; paid fallback below
      }

      const apiKey = (import.meta?.env?.VITE_API_KEY && String(import.meta.env.VITE_API_KEY).trim()) || "";
      const visionController = typeof AbortController !== "undefined" ? new AbortController() : null;
      const visionTimeoutMs = (() => {
        const n = Number(import.meta.env.VITE_FAE_VISION_TIMEOUT_MS || 9000);
        return Number.isFinite(n) ? Math.max(1500, Math.min(20000, n)) : 9000;
      })();
      const visionTO = visionController ? setTimeout(() => visionController.abort(), visionTimeoutMs) : null;

      const visionUrl = allowPaidFallback
        ? `${backend}/api/vision?diag=0&allowSerpLens=1`
        : `${backend}/api/vision?diag=0`;

      const r = await fetch(visionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
          ...(allowPaidFallback ? { "x-fae-allow-serp-lens": "1" } : {}),
        },
        body: JSON.stringify({
          imageBase64: b64,
          locale: i18n?.language || "tr",
          ...(allowPaidFallback ? { allowSerpLens: true } : {}),
        }),
        signal: visionController?.signal,
      }).finally(() => {
        if (visionTO) clearTimeout(visionTO);
      });

      const j = await r.json().catch(() => null);
      const finalQuery = String(j?.query || "").trim();

      const barcodeCandidate = String(j?.barcode || (Array.isArray(j?.barcodes) ? j.barcodes[0] : "") || j?.qr || "").trim();
      const bcGuess = extractBarcodeLike(barcodeCandidate || j?.rawText || j?.query || "");
      const bc = isLikelyBarcode(bcGuess) ? bcGuess.replace(/\s+/g, "") : null;

      if (bc) {
        kickedSearch = true;
        await doBarcodeLookup(bc);
        return;
      }

      if (String(j?.error || "") === "NO_MATCH") {
        flashMsg(
          t("search.imageNoMatch", {
            defaultValue: "Görselden net bir ürün çıkaramadım. Daha yakından/ışıkta veya ön yüz fotoğrafıyla tekrar dene.",
          }),
          2800,
          "muted"
        );
        setLoading(false);
        clearStatus(STATUS_SRC);
        return;
      }

      if (String(j?.error || "") === "VISION_DISABLED") {
        flashMsg(
          t("cameraVisionDisabled", {
            defaultValue:
              "Kamera ile arama hattı hazır ama görsel tanıma kapalı görünüyor. Şimdilik metinle arayın; API anahtarı gelince kamera otomatik çalışır.",
          }),
          3500,
          "danger"
        );
        setLoading(false);
        clearStatus(STATUS_SRC);
        return;
      }

      if (!r.ok || j?.ok === false || !finalQuery) {
        const msg = j?.error || `VISION_FAILED_HTTP_${r.status}`;
        throw new Error(msg);
      }

      setValue(finalQuery);
      flashMsg(
        t("search.imageDetected", { defaultValue: "Görüntüden anladığım: {{query}}", query: finalQuery }),
        900,
        "muted"
      );

      setCalm(t("search.voiceDone", { defaultValue: "Tamam — arıyorum." }), 600);
      kickedSearch = true;
      await doSearch(finalQuery, "camera");
    } catch (err) {
      // ✅ (5) her hataya “vision disabled” basma
      console.error("Vision error:", err);
      flashMsg(
        t("search.imageProcessError", {
          defaultValue: "Görsel işlenirken hata oluştu. Daha net bir fotoğrafla tekrar dene.",
        }),
        2800,
        "danger"
      );
    } finally {
      // ✅ (5) status temizle
      if (!kickedSearch) {
        setLoading(false);
        clearStatus(STATUS_SRC);
      }
    }
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
      <div key={"searchbar-" + tick} className="search-bar-wrapper flex justify-center w-full">
        <div
          className="flex items-center
                     bg-[var(--field-surface)]
                     border border-[rgba(212,175,55,0.55)]
                     shadow-[0_0_18px_rgba(212,175,55,0.16)]
                     rounded-full px-3 sm:px-4 py-2
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

          <div className="relative flex-grow min-w-[120px]">
            <input
              key={"input-" + i18n.language}
              id="search-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder={placeholders[index]}
              className="w-full bg-transparent outline-none
                         text-white/95 placeholder:text-white/45
                         text-base px-3 pr-24 sm:pr-3 min-w-[120px]"
            />

            <button
              type="button"
              onClick={() => doSearch()}
              disabled={loading}
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2
                         w-9 h-9 rounded-full
                         border border-[rgba(212,175,55,0.55)]
                         text-[#D9A441] bg-transparent hover:bg-[#D9A441]/10 hover:text-[#D9A441]
                         flex items-center justify-center shadow-sm transition disabled:opacity-60"
              aria-label={t("search.search")}
            >
              <Search size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={startMic}
            className="ml-1 text-[#D9A441] hover:text-[#D9A441] transition p-2 rounded-full hover:bg-[#D9A441]/10"
            aria-label={t("search.voice", { defaultValue: "Sesli arama" })}
          >
            <Mic className={`w-5 h-5 ${micListening ? "animate-pulse" : ""}`} />
          </button>

          <button
            type="button"
            onClick={openCamera}
            className="text-[#D9A441] hover:text-[#D9A441] transition p-2 rounded-full hover:bg-[#D9A441]/10"
            aria-label={t("cameraSearch", { defaultValue: "Kamera ile ara" })}
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="text-[#D9A441] hover:text-[#D9A441] transition p-2 rounded-full hover:bg-[#D9A441]/10"
            aria-label={t("qrSearch", { defaultValue: "QR ile ara" })}
          >
            <QrCode className="w-5 h-5" />
          </button>

          <button
            onClick={() => doSearch()}
            disabled={loading}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full
                       border border-[rgba(212,175,55,0.55)]
                       text-[#D9A441] bg-transparent hover:bg-[#D9A441]/10 hover:text-[#D9A441]
                       transition disabled:opacity-60"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      {scannerOpen && <QRScanner onDetect={handleQRDetect} onClose={() => setScannerOpen(false)} />}
    </>
  );
}
