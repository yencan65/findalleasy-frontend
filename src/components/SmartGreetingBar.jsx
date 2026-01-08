// src/components/SmartGreetingBar.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const greetIconByHour = () => {
  const h = new Date().getHours();
  if (h < 11) return "🌅";
  if (h < 18) return "🙂";
  if (h < 22) return "🌙";
  return "😴";
};

export default function SmartGreetingBar({ name = "Efendim" }) {
  const { t, i18n } = useTranslation();

  // Used only if a translation key is missing
  const fallback = {
    t1: "Ürün/hizmet detayını yaz — en uygun ve güvenilir seçenekleri getiriyoruz.",
    t2: "🎙 Sesli arama: konuş, aramayı ben tamamlayayım.",
    t3: "📷 Kamera & 🔳 QR/Barkod: tara, ürünü anında bul.",
    t4: "Sono AI sonuçları özetler ve en güvenilir satıcıyı öne çıkarır.",
  };

  const triggers = useMemo(() => {
    const arr = [
      t("smartGreeting.trigger1", { defaultValue: fallback.t1 }),
      t("smartGreeting.trigger2", { defaultValue: fallback.t2 }),
      t("smartGreeting.trigger3", { defaultValue: fallback.t3 }),
      t("smartGreeting.trigger4", { defaultValue: fallback.t4 }),
    ]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);

    // If i18next returns raw keys, filter them out.
    const cleaned = arr.filter((v) => !/^smartGreeting\.trigger[1-4]$/.test(v));

    return cleaned.length ? cleaned : [fallback.t1];
  }, [t, i18n.language]);

  const [currentTrigger, setCurrentTrigger] = useState(0);
  const [fade, setFade] = useState(true);

  // Reset when language changes
  useEffect(() => {
    setCurrentTrigger(0);
    setFade(true);
  }, [i18n.language]);

  useEffect(() => {
    if (triggers.length <= 1) return;

    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTrigger((v) => (v + 1) % triggers.length);
        setFade(true);
      }, 250);
    }, 7000);

    return () => clearInterval(id);
  }, [triggers.length]);

  return (
    <div className="w-full max-w-6xl mx-auto mb-2 mt-4">
      <div className="flex items-center gap-3 text-sm">
        {/* Greeting (fixed width) */}
        <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 min-w-[200px] flex items-center gap-2 overflow-hidden">
          <span aria-hidden="true">{greetIconByHour()}</span>
          <span
            className="block overflow-hidden text-ellipsis"
            style={{
              whiteSpace: "nowrap",
            }}
          >
            {t("smartGreeting.hello", { name, defaultValue: "Merhaba {{name}}" })}
          </span>
        </div>

        {/* Guidance line (ONE LINE, NO JUMP) */}
        <div className="flex-1 h-5 overflow-hidden" aria-live="polite">
          <span
            className={`block text-white/90 transition-opacity duration-500 ease-in-out leading-5 ${fade ? "opacity-100" : "opacity-0"}`}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={triggers[currentTrigger]}
          >
            {triggers[currentTrigger]}
          </span>
        </div>
      </div>

      {/* Thin separator under bar */}
      <div className="mt-2 h-px w-full bg-white/10" />
    </div>
  );
}
