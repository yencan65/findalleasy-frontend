import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Service Worker caching can make deploy changes look "not applied".
// Keep it opt-in for now: set VITE_ENABLE_SW=1 to re-enable.
const ENABLE_SW = import.meta?.env?.VITE_ENABLE_SW === "1";

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
