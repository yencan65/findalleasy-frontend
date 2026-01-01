import React, { useEffect, useState, useRef, useCallback } from "react";
import QrScanner from "qr-scanner";
import { API_BASE } from "../utils/api";

// ======================================================================
// QR + BARCODE SCANNER (Hybrid)
// - QR: qr-scanner (mevcut bağımlılık)
// - Barkod: BarcodeDetector API (destekleyen tarayıcılarda: Chrome/Edge/Android)
//   iOS Safari’de barkod desteği cihaz/versiyona göre gelmeyebilir.
// - Tek çağrı disiplini: Scanner sadece en iyi "query"yi üretir, aramayı üst bileşen yapar.
// ======================================================================

function safeDestroy(scanner) {
  try {
    if (!scanner) return;
    if (typeof scanner.stop === "function") scanner.stop().catch(() => {});
    if (typeof scanner.destroy === "function") scanner.destroy();
  } catch {}
}

function stopVideoStream(videoEl) {
  try {
    const stream = videoEl?.srcObject;
    if (!stream) return;
    const tracks = stream.getTracks?.() || [];
    tracks.forEach((t) => {
      try {
        t.stop();
      } catch {}
    });
    videoEl.srcObject = null;
  } catch {}
}

function supportsBarcodeDetector() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

function isProbablyBarcode(text) {
  return /^\d{8,14}$/.test(String(text || "").trim());
}

export default function QRScanner({ onDetect, onClose }) {
  const [error, setError] = useState("");
  const [active, setActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const barcodeDetectorRef = useRef(null);
  const barcodeIntervalRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  const backend = API_BASE || "";

  // ==========================================================
  //  Ürün adı çözümleme — backend
  // ==========================================================
  const fetchProductName = useCallback(
    async (raw) => {
      const qr = String(raw || "").trim();
      if (!qr) return "";

      try {
        // server/routes/product-info.js: /api/product-info/product
        const res = await fetch(`${backend}/api/product-info/product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json().catch(() => ({}));
        const name =
          String(data?.product?.name || data?.productName || "").trim() || "";
        return name || qr;
      } catch {
        // resolver çalışmazsa raw ile devam
        return qr;
      }
    },
    [backend]
  );

  // ==========================================================
  //  Kamera cihazı var mı?
  // ==========================================================
  const checkCameraPermissions = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      return videoDevices.length > 0;
    } catch {
      return false;
    }
  }, []);

  // ==========================================================
  //  Tek seferlik yakalama handler'ı
  // ==========================================================
  const handleDetected = useCallback(
    async (rawText) => {
      const now = Date.now();
      if (now - lastScanTimeRef.current < 900) return;
      lastScanTimeRef.current = now;

      const text = String(rawText || "").trim();
      if (!text) return;

      setLastScan(text);

      // Önce query'yi çöz
      const bestQuery = await fetchProductName(text);

      // Scanner'ı durdur
      setActive(false);

      // Parent aramayı yapsın
      onDetect?.(bestQuery || text);

      // Debug
      if (isProbablyBarcode(text)) {
        console.log("📦 Barkod okundu:", text, "→", bestQuery);
      } else {
        console.log("📸 QR okundu:", text, "→", bestQuery);
      }
    },
    [fetchProductName, onDetect]
  );

  // ==========================================================
  //  Scanner başlat
  // ==========================================================
  useEffect(() => {
    let isMounted = true;

    const stopBarcodeLoop = () => {
      try {
        if (barcodeIntervalRef.current) clearInterval(barcodeIntervalRef.current);
      } catch {}
      barcodeIntervalRef.current = null;
      barcodeDetectorRef.current = null;
    };

    const init = async () => {
      setError("");

      const cameraAvailable = await checkCameraPermissions();
      if (!cameraAvailable) {
        setHasCamera(false);
        setError("Kamera bulunamadı veya erişim izni verilmedi.");
        return;
      }

      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (window.location.protocol !== "https:" && !isLocalhost) {
        setError("Kamera için güvenli bağlantı (HTTPS) gerekli.");
        return;
      }

      if (!active || !isMounted) return;

      try {
        const videoEl = videoRef.current;
        if (!videoEl) {
          setError("Video elementi bulunamadı.");
          return;
        }

        // Önce temizlik
        stopBarcodeLoop();
        if (scannerRef.current) {
          safeDestroy(scannerRef.current);
          scannerRef.current = null;
        }
        stopVideoStream(videoEl);

        // QR scanner
        const scanner = new QrScanner(
          videoEl,
          (result) => {
            // qr-scanner result bazen string, bazen {data}
            const text =
              typeof result === "string"
                ? result
                : result?.data || result?.text || "";
            handleDetected(text);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            maxScansPerSecond: 4,
          }
        );

        scannerRef.current = scanner;

        await scanner.start();

        // Torch capability varsa initial state reset
        const track = scanner.$video?.srcObject?.getVideoTracks?.()?.[0];
        if (track?.getCapabilities?.().torch) setTorchOn(false);

        // Barkod loop (destek varsa)
        if (supportsBarcodeDetector()) {
          try {
            const formats = [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "itf",
              "data_matrix",
              "qr_code",
            ];

            // Bazı tarayıcılarda getSupportedFormats var
            let supported = formats;
            try {
              const got = await window.BarcodeDetector.getSupportedFormats?.();
              if (Array.isArray(got) && got.length) supported = got;
            } catch {}

            barcodeDetectorRef.current = new window.BarcodeDetector({
              formats: supported,
            });

            barcodeIntervalRef.current = setInterval(async () => {
              if (!isMounted || !active) return;
              const det = barcodeDetectorRef.current;
              const v = videoRef.current;
              if (!det || !v) return;
              try {
                const codes = await det.detect(v);
                if (codes && codes.length) {
                  const val = codes[0]?.rawValue || codes[0]?.rawValueText || "";
                  if (val) handleDetected(val);
                }
              } catch {
                // sessiz
              }
            }, 350);
          } catch (e) {
            console.warn("BarcodeDetector başlatılamadı:", e);
          }
        }
      } catch (e) {
        console.error("Kamera açılamadı:", e);
        if (isMounted) setError("Kamera erişimi reddedildi: " + e.message);
      }
    };

    init();

    return () => {
      isMounted = false;

      try {
        if (barcodeIntervalRef.current) clearInterval(barcodeIntervalRef.current);
      } catch {}
      barcodeIntervalRef.current = null;
      barcodeDetectorRef.current = null;

      if (scannerRef.current) {
        safeDestroy(scannerRef.current);
        scannerRef.current = null;
      }
      stopVideoStream(videoRef.current);
    };
  }, [active, checkCameraPermissions, handleDetected]);

  // ==========================================================
  //  Fener kontrolü
  // ==========================================================
  const toggleTorch = useCallback(async () => {
    try {
      if (!scannerRef.current) return;

      const track = scannerRef.current.$video?.srcObject?.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      if (!caps?.torch) {
        alert("Bu cihazda fener desteği yok.");
        return;
      }

      const next = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch (err) {
      console.warn("Fener değiştirilemedi:", err);
      setError("Fener kontrol edilemedi");
    }
  }, [torchOn]);

  // ==========================================================
  //  Kamera yeniden başlatma
  // ==========================================================
  const restartCamera = useCallback(async () => {
    setError("");
    setActive(false);
    await new Promise((r) => setTimeout(r, 120));
    setActive(true);
  }, []);

  // ==========================================================
  //  Kapatma
  // ==========================================================
  const handleClose = useCallback(() => {
    setActive(false);

    try {
      if (barcodeIntervalRef.current) clearInterval(barcodeIntervalRef.current);
    } catch {}
    barcodeIntervalRef.current = null;
    barcodeDetectorRef.current = null;

    if (scannerRef.current) {
      safeDestroy(scannerRef.current);
      scannerRef.current = null;
    }

    stopVideoStream(videoRef.current);

    onClose?.();
  }, [onClose]);

  // ==========================================================
  //  UI
  // ==========================================================
  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[9999]">
        <div className="bg-gray-800 p-6 rounded-xl max-w-md text-center">
          <h2 className="text-red-400 text-lg mb-4">Kamera Erişilemiyor</h2>
          <p className="text-white mb-4">
            Kamera bulunamadı veya erişim izni verilmedi.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[9999]">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-[320px] h-[240px] rounded-xl border-2 border-[#d4af37] object-cover"
          muted
          playsInline
        />

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
          <button
            onClick={restartCamera}
            className="px-4 py-1 text-sm bg-yellow-600 rounded-lg text-white"
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {lastScan && (
        <p className="text-[#d4af37] text-sm mt-3 text-center">
          Son okunan: <span className="font-semibold">{lastScan}</span>
        </p>
      )}

      {/* Kontrol butonları */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={toggleTorch}
          className={`px-4 py-2 rounded-xl border ${
            torchOn
              ? "bg-[#d4af37] text-black border-[#d4af37]"
              : "border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10"
          } transition-colors`}
        >
          {torchOn ? "🔦 Fener Kapat" : "🔦 Fener Aç"}
        </button>

        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl border border-red-500 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          ✕ Kapat
        </button>
      </div>

      {/* Yardım metni */}
      <p className="text-gray-400 text-xs mt-4 text-center max-w-xs">
        QR veya barkodu kare içine hizalayın. Otomatik olarak tarayacaktır.
        {!supportsBarcodeDetector() ? (
          <span className="block mt-1 text-yellow-400">
            Not: Bu tarayıcı barkod taramayı desteklemiyor; QR tarama çalışır.
          </span>
        ) : null}
      </p>
    </div>
  );
}
