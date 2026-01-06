import React, { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const ONLINE_TOAST_MS = 2200;

export default function NetworkStatusBanner() {
  const { t } = useTranslation();

  const initialOnline =
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;

  const [isOnline, setIsOnline] = useState(initialOnline);
  const [visible, setVisible] = useState(!initialOnline); // offline ise ilk anda görün
  const [mode, setMode] = useState(initialOnline ? "online" : "offline"); // 'offline' | 'online'

  const timerRef = useRef(null);
  const prevOnlineRef = useRef(initialOnline);

  useEffect(() => {
    function onOnline() {
      setIsOnline(true);
    }
    function onOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const prev = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    // Timer temizle
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isOnline) {
      // İnternet yok: KIRMIZI, kalıcı
      setMode("offline");
      setVisible(true);
      return;
    }

    // İnternet var:
    // Eğer offline'dan online'a döndüyse yeşil toast göster, sonra kaybol
    if (prev === false && isOnline === true) {
      setMode("online");
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
      }, ONLINE_TOAST_MS);
      return;
    }

    // Normalde online iken görünmesin
    setVisible(false);
  }, [isOnline]);

  if (!visible) return null;

  const offline = mode === "offline";

  // Sono FAB genelde sağ altta; balonu onun üstüne koyuyoruz
  const boxStyle = {
    position: "fixed",
    right: 16,
    bottom: 96,
    zIndex: 9999,
    maxWidth: 320,
  };

  const bg = offline ? "rgba(220,38,38,0.95)" : "rgba(22,163,74,0.95)";
  const border = offline ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.22)";

  return (
    <div style={boxStyle}>
      <div
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 14,
          padding: "10px 12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          color: "#fff",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.18)",
          }}
        >
          {offline ? <WifiOff size={18} /> : <Wifi size={18} />}
        </div>

        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>
            {offline
              ? (t("net.offlineTitle", "İnternet bağlantınız yok") || "İnternet bağlantınız yok")
              : (t("net.onlineTitle", "İnternet bağlantınız geldi") || "İnternet bağlantınız geldi")}
          </div>
          <div style={{ fontSize: 12, opacity: 0.92 }}>
            {offline
              ? (t("net.offlineDesc", "Lütfen bağlantınızı kontrol edin. İnternet gelene kadar bu uyarı kapanmaz.")
                  || "Lütfen bağlantınızı kontrol edin. İnternet gelene kadar bu uyarı kapanmaz.")
              : (t("net.onlineDesc", "Devam edebilirsiniz.")
                  || "Devam edebilirsiniz.")}
          </div>
        </div>
      </div>
    </div>
  );
}
