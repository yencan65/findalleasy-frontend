import React, { useEffect, useState, useRef, useCallback } from "react";
import QrScanner from "qr-scanner";
import { pushQueryToVitrine, runUnifiedSearch } from "../utils/searchBridge";
import { API_BASE } from "../utils/api";

// ⭐ Güvenli destroy fonksiyonu
function safeDestroy(scanner) {
  try {
    if (!scanner) return;
    
    // Önce stop et
    if (typeof scanner.stop === "function") {
      scanner.stop().catch(() => {});
    }
    
    // Sonra destroy et
    if (typeof scanner.destroy === "function") {
      scanner.destroy();
    }
  } catch (e) {
    console.warn("⚠ Destroy sırasında hata:", e);
  }
}

export default function QRScanner({ onDetect, onClose }) {
  const [error, setError] = useState("");
  const [active, setActive] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [hasCamera, setHasCamera] = useState(true);

  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  

  // ==========================================================
  //  Ürün bilgisi → backend
  // ==========================================================
  const fetchProductInfoFromQR = useCallback(async (qrData) => {
  try {
    const backend = API_BASE || "";

    const res = await fetch(`${backend}/api/product-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr: qrData }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json().catch(() => ({}));
    const productName = data?.product?.name || data?.productName || qrData || "";

    // Backend’e telemetri — Vitrin tetikleme YOK
  // Backend’e telemetri — Vitrin tetikleme YOK
await fetch(`${backend}/api/search`, {
  method: "POST",
  // Telemetry-only: do not trigger SerpApi fallback / credit burn
  headers: { "Content-Type": "application/json", "x-fae-skip-fallback": "1" },
  body: JSON.stringify({
    query: productName,
    region: localStorage.getItem("region") || "TR",
    locale: localStorage.getItem("appLang") || "tr",
  }),
}).catch(() => {});

console.log("QR → Ürün bulundu:", productName);

return productName;   // ✔ TEK RETURN — doğru

} catch (err) {
  console.error("Ürün bilgisi alınamadı:", err);
  throw err;
}
}, []);


// ==========================================================
  //  KAMERA KONTROLÜ
  // ==========================================================
  const checkCameraPermissions = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      return videoDevices.length > 0;
    } catch (err) {
      console.warn("Kamera cihazları listelenemedi:", err);
      return false;
    }
  }, []);

  // ==========================================================
  //  SCANNER BAŞLATMA
  // ==========================================================
  useEffect(() => {
    let scanner;
    let isMounted = true;

    const initializeScanner = async () => {
      // Kamera kontrolü
      const cameraAvailable = await checkCameraPermissions();
      if (!cameraAvailable) {
        setError("Kamera bulunamadı veya erişim izni verilmedi.");
        setHasCamera(false);
        return;
      }

      // HTTPS kontrolü
      const isLocalhost = window.location.hostname === "localhost" || 
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

        // Önceki scanner'ı temizle
        if (scannerRef.current) {
          safeDestroy(scannerRef.current);
          scannerRef.current = null;
        }

        // Yeni scanner oluştur
        scanner = new QrScanner(
          videoEl,
          async (result) => {
            if (!isMounted || !active || !result?.data) return;

            const now = Date.now();
            if (now - lastScanTimeRef.current < 1000) return; // Debouncing
            lastScanTimeRef.current = now;

            try {
              const text = String(result.data).trim();
              if (!text) return;

              console.log("📸 QR Taranan:", text);
              setActive(false);
              setLastScan(text);

              // Vitrin'i güncelle
             // 🔥 TEK BEYİN
await runUnifiedSearch(text, { source: "qr" });
pushQueryToVitrine(text);   // ✔ yeterli
onDetect?.(text);           // ✔ UI için


              // Ürün bilgisi al
              try {
                const productName = await fetchProductInfoFromQR(text);
                alert(`✅ "${productName}" bulundu, vitrin güncellendi.`);
              } catch {
                // QR direkt arama olarak işlensin
                alert("QR tanımlandı, arama yapılıyor...");
              }
            } catch (e) {
              console.error("⚠️ Tarama işleme hatası:", e);
              setError("QR işlenirken hata oluştu");
            }
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5, // Daha düşük tarama hızı
            preferredCamera: "environment", // Arka kamerayı tercih et
            returnDetailedScanResult: true
          }
        );

        scannerRef.current = scanner;
        

        await scanner.start();
        console.log("🎥 Kamera başlatıldı");

        // Fener kontrolü
        const track = scanner.$video?.srcObject?.getVideoTracks?.()[0];
        if (track?.getCapabilities?.().torch) {
          setTorchOn(false);
        }

      } catch (err) {
        console.error("Kamera açılamadı:", err);
        if (isMounted) {
          setError("Kamera erişimi reddedildi: " + err.message);
        }
      }
    };

    initializeScanner();

    // ==========================================================
    //  CLEANUP — Güvenli temizlik
    // ==========================================================
    return () => {
      isMounted = false;

      // Scanner'ı güvenli şekilde durdur ve temizle
      if (scanner) {
        safeDestroy(scanner);
      }
      
      // Video stream'ini temizle
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
      }
      
      scannerRef.current = null;
    };
  }, [active, onDetect, fetchProductInfoFromQR, checkCameraPermissions]);

  // ==========================================================
  //  FENER KONTROLÜ
  // ==========================================================
  const toggleTorch = useCallback(async () => {
    try {
      if (!scannerRef.current) return;

      const track = scannerRef.current.$video?.srcObject?.getVideoTracks?.()[0];
      if (!track) return;

      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) {
        alert("Bu cihazda fener desteği yok.");
        return;
      }

      const torchState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: torchState }],
      });
      setTorchOn(torchState);
    } catch (err) {
      console.warn("Fener değiştirilemedi:", err);
      setError("Fener kontrol edilemedi");
    }
  }, [torchOn]);

  // ==========================================================
  //  KAMERA YENİDEN BAŞLATMA
  // ==========================================================
  const restartCamera = useCallback(async () => {
    setError("");
    setActive(false);
    
    // Kısa bekleme
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setActive(true);
  }, []);

  // ==========================================================
  //  KAPATMA İŞLEMİ
  // ==========================================================
  const handleClose = useCallback(() => {
    setActive(false);
    
    // Temizlik yap
    if (scannerRef.current) {
      safeDestroy(scannerRef.current);
      scannerRef.current = null;
    }
    
    // Video stream'ini temizle
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
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
        QR kodu kare içine hizalayın. Otomatik olarak tarayacaktır.
      </p>
    </div>
  );
}