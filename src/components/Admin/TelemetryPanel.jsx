import React, { useEffect, useState } from "react";

export default function TelemetryPanel() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    try {
      document.documentElement.classList.add("fae-allow-scroll");
      document.body.classList.add("fae-allow-scroll");
    } catch {}
    return () => {
      try {
        document.documentElement.classList.remove("fae-allow-scroll");
        document.body.classList.remove("fae-allow-scroll");
      } catch {}
    };
  }, []);


  useEffect(() => {
    function handle(e) {
      const detail = e.detail || {};
      const ts = new Date().toLocaleTimeString();

      setEvents((prev) => [
        {
          ts,
          query: detail.query,
          source: detail.source || e.type,
          locale: detail.locale,
          region: detail.region,
          category: detail.categoryHint,
        },
        ...prev.slice(0, 99),
      ]);
    }

    window.addEventListener("sono:search", handle);
    window.addEventListener("fae.vitrine.search", handle);

    return () => {
      window.removeEventListener("sono:search", handle);
      window.removeEventListener("fae.vitrine.search", handle);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4" style={{ color: "#d4af37" }}>
        📊 FindAllEasy — Canlı Arama Telemetrisi
      </h1>

      <div className="space-y-3">
        {events.map((ev, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-lg p-3"
          >
            <div className="text-sm text-gray-300">{ev.ts}</div>

            <div className="text-lg font-semibold text-yellow-300">
              "{ev.query}"
            </div>

            <div className="text-xs text-gray-400 mt-1 flex gap-3">
              <span>Kaynak: {ev.source}</span>
              <span>Dil: {ev.locale || "?"}</span>
              <span>Region: {ev.region || "?"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
