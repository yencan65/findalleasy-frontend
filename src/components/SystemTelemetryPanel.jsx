// src/components/SystemTelemetryPanel.jsx
import React, { useEffect, useState } from "react";

export default function SystemTelemetryPanel() {
  const [system, setSystem] = useState(null);
  const [engine, setEngine] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("wss://findalleasy.com/ws/telemetry");

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === "metrics") setSystem(data.system || null);
        if (data.type === "engine") setEngine(data.engine || null);

        setLastEvent({
          ts: new Date().toLocaleTimeString(),
          raw: data,
        });
      } catch (e) {
        console.warn("WS parse error:", e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">
        🔥 FindAllEasy — Backend System Telemetry
      </h1>

      <div className="mb-4">
        <span
          className={`px-3 py-1 rounded ${
            connected ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {connected ? "WS Connected" : "Disconnected"}
        </span>
      </div>

      {/* SYSTEM METRICS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">📡 System Metrics</h2>
        {!system && <div>Loading system metrics...</div>}

        {system && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded">
              <h3 className="text-lg text-yellow-300">Uptime</h3>
              <p>{system.uptime.toFixed(1)}s</p>
            </div>

            <div className="bg-white/10 p-4 rounded">
              <h3 className="text-lg text-yellow-300">CPU</h3>
              <pre className="text-xs mt-2">
                {JSON.stringify(system.cpu, null, 2)}
              </pre>
            </div>

            <div className="bg-white/10 p-4 rounded">
              <h3 className="text-lg text-yellow-300">Memory</h3>
              <pre className="text-xs mt-2">
                {JSON.stringify(system.memory, null, 2)}
              </pre>
            </div>

            <div className="bg-white/10 p-4 rounded">
              <h3 className="text-lg text-yellow-300">Mongo</h3>
              <p>{system.mongo ? "🟢 Connected" : "🔴 Offline"}</p>
            </div>
          </div>
        )}
      </section>

      {/* ENGINE / ADAPTER METRICS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">⚙️ Adapter Engine</h2>
        {!engine && <div>Adapter engine kayıtları bekleniyor...</div>}

        {engine && (
          <pre className="bg-white/10 text-xs p-4 rounded">
            {JSON.stringify(engine, null, 2)}
          </pre>
        )}
      </section>

      {/* LAST RAW EVENT */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          🧩 Last Telemetry Event (raw)
        </h2>

        {!lastEvent ? (
          <div>Henüz veri gelmedi...</div>
        ) : (
          <div className="bg-white/10 p-4 rounded">
            <div className="text-sm text-gray-400 mb-2">
              {lastEvent.ts}
            </div>
            <pre className="text-xs">
              {JSON.stringify(lastEvent.raw, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
