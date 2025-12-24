// src/components/SonoBubble.jsx
import React, { useState } from "react";
import { askAI } from "../api/ai";
import { triggerVitrineSearch } from "../utils/vitrineEvent"; // ✅ vitrin senkronizasyonu

export default function SonoBubble() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

  // 🔹 Hafıza (AI geçmişi)
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem("ai_history") || "[]");
    } catch {
      return [];
    }
  }

  function saveHistory(text) {
    const history = getHistory();
    history.unshift(text);
    if (history.length > 10) history.pop();
    localStorage.setItem("ai_history", JSON.stringify(history));
  }

  // 🔸 Ana işlem
  async function handleSonoSpeak(text) {
    setLoading(true);
    try {
      const region = localStorage.getItem("region") || "TR";
      saveHistory(text);
      const context = getHistory().join(" | ");

      const res = await fetch(`${BACKEND_URL}/api/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, region, context }),
      });
      const data = await res.json();

      // ✅ AI yanıtını bubble’da göster
      setMessages((prev) => [
        ...prev,
        { from: "user", text },
        { from: "ai", text: data.answer || data.text || "..." },
      ]);

      // ✅ Vitrine de gönder (senkron)
      if (data?.cards || data?.suggestions || data?.text) {
        const vitrinData = {
          cards: data.cards || [
            {
              title: "AI Önerisi",
              desc: data.text || data.answer || text,
            },
            {
              title: "Kullanıcı isteği",
              desc: text,
            },
            {
              title: "Alternatifler",
              desc: "Benzer ürünler aranıyor...",
            },
          ],
          model: "sono",
        };
        window.dispatchEvent(new CustomEvent("fie:vitrin", { detail: vitrinData }));
        triggerVitrineSearch(text);
      }
    } catch (err) {
      console.error("Sono AI hata:", err);
    } finally {
      setLoading(false);
    }
  }

  // 🔸 Görsel yapı
  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-2 z-50">
      <div className="bg-black/80 text-white px-4 py-2 rounded-2xl border border-gold shadow-xl w-64 min-h-[48px]">
        {loading
          ? "Sono düşünüyor..."
          : messages.length
          ? messages[messages.length - 1].text
          : "Merhaba 👋 Ben Sono. Yazman yeterli, gerisini ben hallederim."}
      </div>

      <button
        onClick={() => handleSonoSpeak("Bugün bana ne önerirsin?")}
        className="bg-gold text-black px-4 py-2 rounded-full hover:opacity-90 transition font-semibold"
      >
        Konuş
      </button>
    </div>
  );
}
