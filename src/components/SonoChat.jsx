// src/components/SonoChat.jsx
import React, { useEffect, useState, useCallback } from "react";

export default function SonoChat() {
  const [messages, setMessages] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const pushMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!voiceEnabled) return;
      if (!window.speechSynthesis) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "tr-TR";
      window.speechSynthesis.speak(utter);
    },
    [voiceEnabled]
  );

  useEffect(() => {
    function handleAutoExplain(e) {
      const text = e.detail?.text;
      if (!text) return;

      // Sohbet balonuna yaz
      pushMessage({
        from: "sono",
        text,
        type: "auto-explain-best",
        ts: Date.now(),
      });

      // Sesli oku
      speak(text);
    }

    window.addEventListener("sono:autoExplainBest", handleAutoExplain);
    return () => {
      window.removeEventListener("sono:autoExplainBest", handleAutoExplain);
    };
  }, [pushMessage, speak]);

  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-[60vh] bg-black/80 text-white rounded-2xl border border-[#d4af37]/40 shadow-lg flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#f5d76e]">
          Sono AI
        </span>
        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          className="text-[10px] px-2 py-1 rounded-full border border-white/20"
        >
          {voiceEnabled ? "🔊 Ses Açık" : "🔇 Sessiz"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[90%] rounded-xl px-2 py-1 ${
              m.from === "sono"
                ? "bg-[#d4af37]/10 border border-[#d4af37]/40 self-start"
                : "bg-white/10 border border-white/20 self-end"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
