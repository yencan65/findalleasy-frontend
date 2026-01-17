import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useStatusBus } from "../context/StatusBusContext";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { API_BASE } from "../utils/api";

export default function QRScanner({ onDetect, onClose }) {
  const { t, i18n } = useTranslation();
  const { setStatus, clearStatus } = useStatusBus();
  const STATUS_SRC = "qr";
  const STATUS_PRIO = 30;

  const [error, setError] = useState("");
  const [active, setActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [phase, setPhase] = useState("starting"); // starting | scanning | detected | normalizing | handoff
  const [countdown, setCountdown] = useState(null);

  const videoRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const countdownRef = useRef(null);

  // ==========================================================
  // Global status toast
  // ==========================================================
  useEffect(() => {
    const rightText =
      countdown != null
        ? t("qrScanner.countdown", { defaultValue: "{{count}}sn", count: countdown })
        : null;

    const base = { showDots: true, tone: "gold", priority: STATUS_PRIO, rightText };

    if (phase === "starting") {
      setStatus(STATUS_SRC, { text: t("qrScanner.starting", { defaultValue: "Kamera açılıyor…" }), ...base });
      return;
    }
    if (phase === "scanning") {
      setStatus(STATUS_SRC, { text: t("qrScanner.scanning", { defaultValue: "Barkod/QR taranıyor…" }), ...base });
      return;
    }
    if (phase === "detected") {
      setStatus(STATUS_SRC, { text: t("qrScanner.detected", { defaultValue: "Kod tespit edildi…" }), ...base });
      return;
    }
    if (phase === "normalizing") {
      setStatus(STATUS_SRC, { text: t("qrScanner.analyzing", { defaultValue: "Analiz ediliyor…" }), ...base });
      return;
    }
    if (phase === "handoff") {
      setStatus(STATUS_SRC, { text: t("qrScanner.startingSearch", { defaultValue: "Arama başlatılıyor…" }), ...base });
      return;
    }

    clearStatus(STATUS_SRC);
  }, [phase, countdown, t, setStatus, clearStatus]);

  // Clear on unmount
  useEffect(() => {
    return () => clearStatus(STATUS_SRC);
  }, [clearStatus]);

  // ==========================================================
  //  QR / Barkod → ürün adı normalize (backend)
  // ==========================================================
  const fetchProductInfoFromCode = useCallback(
    async (code) => {
      const backend = API_BASE || "";
      const safe = String(code || "").trim();
      if (!safe) return "";

      try {
        const res = await fetch(`${backend}/api/product-info/product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr: safe, locale: i18n?.language || "tr" }),
        });

        if (!res.ok) return safe;

        const data = await res.json().catch(() => ({}));
        const productName = data?.product?.name || data?.product?.title || data?.productName || "";
        return String(productName || safe).trim();
      } catch {
        return safe;
      }
    },
    [i18n?.language]
  );

  // ==========================================================
  //  KAMERA KONTROLÜ
  // ==========================================================
  const checkCameraAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      return videoDevices.length > 0;
    } catch {
      return false;
    }
  }, []);

  // ==========================================================
  //  KAPATMA
  // ==========================================================
  const handleClose = useCallback(() => {
    try {
      if (countdownRef.current) clearInterval(countdownRef.current);
    } catch {}
    countdownRef.current = null;
    setCountdown(null);
    setPhase("starting");

    setActive(false);

    // video stream temizle
    try {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((tt) => tt.stop());
        videoRef.current.srcObject = null;
      }
    } catch {}

    onClose?.();
  }, [onClose]);

  // ==========================================================
  //  Barkod/QR canlı tarama (Native BarcodeDetector → ZXing fallback)
  // ==========================================================
  useEffect(() => {
    let isMounted = true;
    let controls = null;
    let rafId = null;
    let fallbackTimer = null;

    const reader = new BrowserMultiFormatReader(undefined, 250);

    const stopAll = () => {
      try { if (fallbackTimer) clearTimeout(fallbackTimer); } catch {}
      fallbackTimer = null;

      try { if (rafId) cancelAnimationFrame(rafId); } catch {}
      rafId = null;

      try { controls?.stop?.(); } catch {}
      controls = null;

      try { reader.reset(); } catch {}

      try {
        if (videoRef.current?.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach((tt) => tt.stop());
          videoRef.current.srcObject = null;
        }
      } catch {}
    };

    const processDetectedValue = async (rawValue) => {
      if (!isMounted) return;
      if (!active) return;

      const now = Date.now();
      if (now - lastScanTimeRef.current < 1200) return; // debounce
      lastScanTimeRef.current = now;

      const text = String(rawValue || "").trim();
      if (!text) return;

      setLastScan(text);
      setPhase("detected");
      setActive(false);

      // küçük kapanış sayacı
      try { if (countdownRef.current) clearInterval(countdownRef.current); } catch {}
      let left = 2;
      setCountdown(left);
      countdownRef.current = setInterval(() => {
        left -= 1;
        setCountdown(left);
        if (left <= 0) {
          try { clearInterval(countdownRef.current); } catch {}
          countdownRef.current = null;
        }
      }, 800);

      const raw = String(text || "").trim();
      const compact = raw.replace(/\s+/g, "");
      const isBarcode = /^\d{8,18}$/.test(compact);
      let query = isBarcode ? compact : raw;

      // Barcode: FE'de isim çözümleme yapma. Backend barcode two-stage bunu yönetiyor.
      if (!isBarcode) {
        setPhase("normalizing");
        try {
          const normalized = await fetchProductInfoFromCode(raw);
          if (normalized) query = normalized;
        } catch {}
      }

      setPhase("handoff");
      try { onDetect?.(query); } catch {}

      setTimeout(() => {
        try { handleClose(); } catch {}
      }, 1400);
    };

    const startZXing = async () => {
      if (!active || !isMounted) return;

      try {
        setPhase("starting");
        setError("");

        const videoEl = videoRef.current;
        if (!videoEl) {
          setError(t("qrScanner.videoNotFound", "Video elementi bulunamadı."));
          return;
        }

        controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoEl,
          (result, err) => {
            if (result) {
              const txt = String(result?.getText?.() ?? result?.text ?? "").trim();
              if (txt) processDetectedValue(txt);
            }
            // err is ignored (NotFound etc.)
          }
        );

        if (isMounted) setPhase("scanning");

        // Torch state reset if supported
        try {
          const track = videoEl?.srcObject?.getVideoTracks?.()[0];
          if (track?.getCapabilities?.().torch) setTorchOn(false);
        } catch {}
      } catch (err) {
        if (!isMounted) return;
        setError(
          t("qrScanner.cameraDenied", {
            defaultValue: "Kamera erişimi reddedildi: {{msg}}",
            msg: err?.message || String(err),
          })
        );
      }
    };

    const startNative = async () => {
      if (!active || !isMounted) return false;
      const videoEl = videoRef.current;
      if (!videoEl) return false;

      // BarcodeDetector yoksa direkt ZXing'e düş
      if (typeof window === "undefined" || !("BarcodeDetector" in window)) return false;

      try {
        setPhase("starting");
        setError("");

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        videoEl.srcObject = stream;
        try { await videoEl.play(); } catch {}

        const detector = new window.BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "itf",
            "qr_code",
          ],
        });

        if (isMounted) setPhase("scanning");

        // Native çalışmazsa 6.5sn sonra ZXing fallback
        fallbackTimer = setTimeout(() => {
          if (!isMounted) return;
          if (!active) return;
          stopAll();
          startZXing();
        }, 6500);

        const loop = async () => {
          if (!isMounted) return;
          if (!active) return;
          try {
            const codes = await detector.detect(videoEl);
            if (codes && codes.length) {
              const raw = codes[0]?.rawValue || codes[0]?.rawValue || "";
              const txt = String(raw).trim();
              if (txt) {
                processDetectedValue(txt);
                return;
              }
            }
          } catch (e) {
            // Native fail -> ZXing'e geç
            stopAll();
            startZXing();
            return;
          }
          rafId = requestAnimationFrame(loop);
        };

        rafId = requestAnimationFrame(loop);
        return true;
      } catch (err) {
        return false;
      }
    };

    const start = async () => {
      const cameraAvailable = await checkCameraAvailability();
      if (!cameraAvailable) {
        setError(t("qrScanner.noCameraBody", "Kamera bulunamadı veya erişim izni verilmedi."));
        setHasCamera(false);
        return;
      }

      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (window.location.protocol !== "https:" && !isLocalhost) {
        setError(t("qrScanner.httpsRequired", "Kamera için güvenli bağlantı (HTTPS) gerekli."));
        return;
      }

      if (!active || !isMounted) return;

      // 1) Native dene
      const ok = await startNative();
      if (ok) return;

      // 2) ZXing fallback
      await startZXing();
    };

    start();

    return () => {
      isMounted = false;
      stopAll();
    };
  }, [active, t, onDetect, handleClose, fetchProductInfoFromCode, checkCameraAvailability]);

  // ==========================================================
  //  FENER KONTROLÜ
  // ==========================================================
  const toggleTorch = useCallback(async () => {
    try {
      const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
      if (!track) return;

      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) {
        alert(t("qrScanner.torchNotSupported", "Bu cihazda fener desteği yok."));
        return;
      }

      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setError(t("qrScanner.torchError", "Fener kontrol edilemedi"));
    }
  }, [torchOn, t]);

  // ==========================================================
  //  KAMERA YENİDEN BAŞLATMA
  // ==========================================================
  const restartCamera = useCallback(async () => {
    setError("");
    setActive(false);
    await new Promise((r) => setTimeout(r, 120));
    setActive(true);
  }, []);

  // ==========================================================
  //  UI
  // ==========================================================
  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[9999]">
        <div className="bg-gray-800 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-red-400 text-lg mb-4">{t("qrScanner.noCameraTitle", "Kamera Erişilemiyor")}</h2>
          <p className="text-white mb-4">{t("qrScanner.noCameraBody", "Kamera bulunamadı veya erişim izni verilmedi.")}</p>
          <button onClick={handleClose} className="px-6 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700">
            {t("actions.close", "Kapat")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[9999]">
      <div className="relative">
        <video ref={videoRef} className="w-[92vw] max-w-[560px] h-[320px] sm:h-[380px] rounded-xl border-2 border-[#d4af37] object-cover" muted playsInline />

        {/* Tarama çerçevesi */}
        <div className="absolute inset-0 border-2 border-transparent">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-[#d4af37] rounded-lg">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]"></div>
          </div>
        </div>
      </div>

      {/* Durum mesajları */}
      {error && (
        <div className="mt-4 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={restartCamera} className="px-4 py-1 text-sm bg-yellow-600 rounded-lg text-white">
            {t("qrScanner.retry", "Yeniden Dene")}
          </button>
        </div>
      )}

      {lastScan && (
        <p className="text-[#d4af37] text-sm mt-3 text-center">
          {t("qrScanner.lastRead", "Son okunan:")} <span className="font-semibold">{lastScan}</span>
        </p>
      )}

      {/* Kontrol butonları */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={toggleTorch}
          className={`px-4 py-2 rounded-xl border ${
            torchOn ? "bg-[#d4af37] text-black border-[#d4af37]" : "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
          } transition-colors`}
        >
          {torchOn ? t("qrScanner.torchTurnOff", "🔦 Fener Kapat") : t("qrScanner.torchTurnOn", "🔦 Fener Aç")}
        </button>

        <button onClick={handleClose} className="px-4 py-2 rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 transition-colors">
          ✕ {t("actions.close", "Kapat")}
        </button>
      </div>

      {/* Yardım metni */}
      <p className="text-gray-400 text-xs mt-4 text-center max-w-xs">
        {t("qrScanner.help", "QR veya barkodu kare içine hizalayın. Algıladığında otomatik arama tetiklenir.")}
      </p>
    </div>
  );
}
