import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";


import { themeBoot } from "./boot/themeBoot.js";

themeBoot();

// Service Worker caching can make deploy changes look "not applied".
// Keep it opt-in for now: set VITE_ENABLE_SW=1 to re-enable.
const ENABLE_SW = import.meta?.env?.VITE_ENABLE_SW === "1";

// ⚠️ IMPORTANT: older builds may have registered /sw.js or /service-worker.js.
// Even if we stop registering, the old SW can keep controlling the page and
// serve a cached index.html that points to missing hashed assets -> blank screen.
//
// Default behavior: uninstall any existing SW + clear Cache Storage.
// (This is per-origin; it won't touch other sites.)
if (!ENABLE_SW && "serviceWorker" in navigator) {
  // Fire-and-forget. If it fails (no perms), the page still loads normally.
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {});

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
}

if (ENABLE_SW && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
