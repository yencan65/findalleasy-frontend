import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../utils/api";

// ============================================================================
// NetworkStatusBanner
// - İnternet yoksa / backend'e ulaşılamıyorsa kullanıcıya NET uyarı verir.
// - Animasyon: nokta döngüsü + hafif pulse.
// - ZERO-DELETE: yeni bileşen, mevcut akışlara dokunmadan eklenir.
// ============================================================================

function withTimeout(promiseFactory, timeoutMs = 3500) {
  if (typeof AbortController === "undefined") {
    return promiseFactory(null);
  }

  const controller = new AbortController();
  const id = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  return Promise.resolve()
    .then(() => promiseFactory(controller.signal))
    .finally(() => clearTimeout(id));
}

async function pingBackend(signal) {
  const base = String(API_BASE || "").trim();
  if (!base) return true;
  const url = `/api/auth/health`;

  // GET (CORS zaten açık olmalı)
  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
    signal,
  });

  if (!res || !res.ok) return false;
  const j = await res.json().catch(() => ({}));
  return Boolean(j && j.ok);
}

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [backendOk, setBackendOk] = useState(true);
  const [dots, setDots] = useState("");

  const lastCheckAt = useRef(0);
  const checkingRef = useRef(false);

  const show = useMemo(() => !isOnline || !backendOk, [isOnline, backendOk]);

  // --- Online/offline eventleri
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => {
      setIsOnline(false);
      setBackendOk(false);
    };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // --- Online görünüyorsa backend'e kısa ping
  useEffect(() => {
    if (!isOnline) return;

    const now = Date.now();
    // spam ping olmasın
    if (now - lastCheckAt.current < 7000) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    lastCheckAt.current = now;

    withTimeout((signal) => pingBackend(signal), 3500)
      .then((ok) => setBackendOk(Boolean(ok)))
      .catch(() => setBackendOk(false))
      .finally(() => {
        checkingRef.current = false;
      });
  }, [isOnline]);

  // --- Animasyonlu nokta döngüsü
  useEffect(() => {
    if (!show) {
      setDots("");
      return;
    }

    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % 4;
      setDots(".".repeat(i));
    }, 420);

    return () => clearInterval(t);
  }, [show]);

  if (!show) return null;

  const msg = !isOnline
    ? "İnternet bağlantın yok"
    : "Bağlantı var ama sunucuya ulaşılamıyor";

  return (
    <div className="fixed top-[64px] sm:top-[76px] left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-[680px] pointer-events-none">
      <div
        className="
          px-4 py-2.5 rounded-2xl
          border border-red-500/30
          bg-black/70 backdrop-blur
          shadow-[0_10px_30px_rgba(0,0,0,0.35)]
          text-[12.5px] sm:text-sm
          flex items-center justify-between gap-3
          animate-pulse
        "
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-red-300">📡</span>
          <span className="text-white/95 font-medium truncate">{msg}{dots}</span>
        </div>

        <span className="text-white/60 text-[11px] sm:text-xs whitespace-nowrap">
          Offline mod
        </span>
      </div>
    </div>
  );
}
