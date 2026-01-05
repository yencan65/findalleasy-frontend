import React, { useEffect, useState } from "react";

// ============================================================================
// NetworkStatusBanner
// ✅ KURAL: Sadece internet bağlantısı yoksa uyarı göster.
// İnternet varsa (backend yanıt vermese bile) hiçbir uyarı gösterme.
// ============================================================================

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);

    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-[64px] sm:top-[76px] left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-[680px] pointer-events-none">
      <div
        className="px-4 py-2.5 rounded-2xl border border-red-500/30 bg-black/70 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.35)] text-[12.5px] sm:text-sm flex items-center gap-2 animate-pulse"
        role="status"
        aria-live="polite"
      >
        <span className="text-red-300">📡</span>
        <span className="text-white/95 font-medium truncate">
          İnternet bağlantınız yok, kontrol edin.
        </span>
      </div>
    </div>
  );
}
