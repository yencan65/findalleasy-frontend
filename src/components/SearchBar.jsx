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
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
      });
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
        setCalm(t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }), 2100);
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "empty", query: product?.title || product?.name || qr, items: [], source: "barcode" },
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
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
      });
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
        setCalm(t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }), 2100);
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "empty", query: product?.title || product?.name || qr, items: [], source: "barcode" },
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

    const backend = API_BASE || "";

    const buildItems = (product) => {
      const offers = [...(product?.offersTrusted || []), ...(product?.offersOther || [])];
      return offers
        .map((o) => {
          const p = parsePrice(o?.price ?? o?.finalPrice);
          const fp = parsePrice(o?.finalPrice ?? o?.price);
          return {
            ...o,
            title: o?.title || product?.title || product?.name || qr,
            image: o?.image || product?.image,
            price: p,
            finalPrice: fp ?? p,
            currency: o?.currency || product?.currency || "TRY",
          };
        })
        .filter((x) => typeof x.price === "number" && Number.isFinite(x.price) && x.price > 0);
    };

    const postLookup = async (allowPaid) => {
      const url = `${backend}/api/product-info/product?force=0&diag=0&paid=${allowPaid ? 1 : 0}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
      });
      const json = await resp.json().catch(() => null);
      if (!resp.ok) {
        const msg = json?.error || `HTTP_${resp.status}`;
        throw new Error(msg);
      }
      return json || {};
    };

    setLoading(true);
    setBusy(t("ai.analyzing", { defaultValue: "Analiz yapılıyor…" }));

    try {
      // 1) FREE-FIRST (paid kapalı)
      let json = await postLookup(false);
      let product = json?.product || {};
      let items = buildItems(product);

      // 2) Paid fallback (tek ek istek)
      if (!items.length) {
        json = await postLookup(true);
        product = json?.product || {};
        items = buildItems(product);
      }

      if (!items.length) {
        setCalm(t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }), 2100);
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: {
              status: "empty",
              query: product.title || product.name || qr,
              items: [],
              source: "barcode",
            },
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
        })
        .filter((x) => typeof x.price === "number" && Number.isFinite(x.price) && x.price > 0);
      return items;
    };

    const parsePrice = (val) => {
      if (typeof val === "number" && Number.isFinite(val)) return val;
      if (val == null) return null;
      let s = String(val).trim();
      if (!s) return null;
      s = s.replace(/[^0-9.,-]/g, "");
      if (!s) return null;
      const hasDot = s.includes(".");
      const hasComma = s.includes(",");
      if (hasDot && hasComma) {
        // TR style: 1.234,56
        s = s.replace(/\./g, "").replace(/,/g, ".");
      } else if (hasComma && !hasDot) {
        // 1234,56
        s = s.replace(/,/g, ".");
      } else {
        // 1234.56 OR 1234
        // keep dot
      }
      const n = Number.parseFloat(s);
      return Number.isFinite(n) ? n : null;
    };

    const requestOnce = async (allowPaid) => {
      const url = `${backend}/api/product-info/product?force=0&diag=0&paid=${allowPaid ? 1 : 0}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr, locale, allowPaid: !!allowPaid }),
      });
      const json = await resp.json().catch(() => null);
      const product = json?.product || {};
      const items = buildItems(product);
      return { ok: resp.ok && json?.ok !== false, json, product, items };
    };

    try {
      // 1) Free-first
      let r = await requestOnce(false);

      // 2) Paid fallback only if empty
      if (!r.items.length) {
        r = await requestOnce(true);
      }

      if (!r.ok) {
        throw new Error(r?.json?.error || "BARCODE_LOOKUP_FAILED");
      }

      if (!r.items.length) {
        setCalm(t("vitrine.noResults", { defaultValue: "Üzgünüm, sonuç bulunamadı." }), 2100);
        window.dispatchEvent(
          new CustomEvent("fae.vitrine.results", {
            detail: { status: "empty", query: r.product?.title || r.product?.name || qr, items: [], source: "barcode" },
          })
        );
        return;
      }

      const payload = {
        query: r.product?.title || r.product?.name || qr,
        items: r.items,
        source: "barcode",
        product: r.product,
        ok: true,
      };

      setBarcodeCache(qr, payload);
      injectVitrine(payload);
      setCalm(t("vitrine.resultsReady", { defaultValue: "Sonuçlar vitrinde hazır." }), 2100);
    } catch (e) {
      console.error("doBarcodeLookup error:", e);
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
    fileRef.current?.click();
  }


  // ============================================================
  // Kamera dosyası: Ücretsiz tespit (BarcodeDetector/TextDetector) → en son backend /api/vision
  // ============================================================
  const detectBarcodesFromFile = async (file) => {
    try {
      if (typeof window === "undefined") return [];
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

      // createImageBitmap yoksa <img> ile devam
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

      // Büyük görsellerde downscale ederek şansı artır
      const w = src?.width || src?.naturalWidth || 0;
      const h = src?.height || src?.naturalHeight || 0;
      let input = src;
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
      const vals = (codes || [])
        .map((c) => String(c?.rawValue || c?.value || "").trim())
        .filter(Boolean);

      // en iyi aday: sayısal barkod varsa onu öne al
      const compact = vals.map((v) => v.replace(/\s+/g, ""));
      const numeric = compact.find((v) => /^[0-9]{8,14}$/.test(v));
      if (numeric) return [numeric];
      return compact;
    } catch {
      return [];
    }
  };

  const detectTextFromFile = async (file) => {
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

      // En uzun metni seç (genelde en anlamlı)
      texts.sort((a, b) => b.length - a.length);
      let best = texts[0];
      best = best.replace(/\s+/g, " ").trim();
      if (best.length > 140) best = best.slice(0, 140);
      return best;
    } catch {
      return "";
    }
  };

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

	  try {
	    // 1) Ücretsiz: BarcodeDetector (barkod/QR)
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

	    // 2) Ücretsiz: TextDetector (varsa)
	    setStatus(STATUS_SRC, {
	      text: t("search.imageAnalyzing", { defaultValue: "Görsel analiz ediliyor…" }),
	      showDots: true,
	      tone: "gold",
	      priority: STATUS_PRIO,
	    });
	    const text = await detectTextFromFile(f);
	    if (text) {
	      setValue(text);
	      kickedSearch = true;
	      await doSearch(text, "camera");
	      return;
	    }

	    // 3) En son: Backend /api/vision (buradan ücretli fallback'ler çalışabilir)
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

	    const r = await fetch("/api/vision?diag=0&allowSerpLens=1", {
	      method: "POST",
	      headers: { "Content-Type": "application/json" },
	      body: JSON.stringify({ imageBase64: b64, locale: i18n?.language || "tr", allowSerpLens: true }),
	    });

	    const j = await r.json().catch(() => null);
	    const finalQuery = String(j?.query || "").trim();
	    const barcodeCandidate = String(
	      j?.barcode ||
	        (Array.isArray(j?.barcodes) ? j.barcodes[0] : "") ||
	        j?.qr ||
	        ""
	    ).trim();

	    // Vision'dan barkod çıkarsa: barcode->product-info hattına git (kredi yakmaz).
	    const bc = isLikelyBarcode(barcodeCandidate)
	      ? barcodeCandidate.replace(/\s+/g, "")
	      : null;
	    if (bc) {
	      kickedSearch = true;
	      await doBarcodeLookup(bc);
	      return;
	    }

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
	  const raw = String(result || "").trim();
	  const compact = raw.replace(/\s+/g, "");
	
	  try {
	    window?.localStorage?.setItem?.("lastQuery", raw);
	    window?.localStorage?.setItem?.("lastQuerySource", "qr");
	  } catch {}
	
	  setScannerOpen(false);
	
	  if (isLikelyBarcode(compact)) {
	    doBarcodeLookup(compact);
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
