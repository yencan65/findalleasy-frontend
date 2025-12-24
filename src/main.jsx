// 🌍 Dil sistemi (i18n)
import "./i18n";

// 🔧 Service Worker helper
import { registerSW } from "./registerSW";
registerSW();

// ⚛️ React & render
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import LanguageProvider from "./components/context/LanguageContext";

import "./index.css";

// 🎯 Referral kodu yakalama
import { captureReferralFromUrl } from "./utils/referralTracker";
captureReferralFromUrl(); // URL'deki ?ref= kodunu yakala

// 🚀 Uygulama render
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("⛔ root elementi bulunamadı! index.html içinde id='root' olmalı.");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  );
}

// 🧩 Dev ortamında SW kayıtlarını temizle (opsiyonel ama önerilir)
if (import.meta.env.DEV) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// 🔸 FAE PUSH: Bildirim & abone işlemi (opsiyonel, üretim modunda aktif edilir)
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker kaydedildi:", reg.scope);

      // 🔔 Bildirim izni
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        // ⚙️ VAPID devre dışı — prod ortamda aktif edebilirsin
        // const sub = await reg.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: window.VAPID_PUBLIC || null,
        // });

        // await fetch(import.meta.env.VITE_BACKEND_URL + "/api/push/register", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(sub),
        // });
      }
    } catch (e) {
      console.error("SW err:", e);
    }
  });
}
