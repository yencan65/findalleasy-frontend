// src/components/SmartGreetingBar.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const greetIconByHour = () => {
  const h = new Date().getHours();
  if (h < 11) return "🌅"; 
  if (h < 18) return "🙂"; 
  if (h < 22) return "🌙"; 
  return "😴";
};

export default function SmartGreetingBar({ name = "Efendim" }) {
  const { t } = useTranslation();
  
  const rawTriggers = [
    t("smartGreeting.trigger1"),
    t("smartGreeting.trigger2"),
    t("smartGreeting.trigger3"),
    t("smartGreeting.trigger4"),
  ];

  // i18n anahtarları yoksa i18next bazen anahtarı geri döndürür; onları filtrele.
  const triggers = rawTriggers
    .map(v => (typeof v === "string" ? v.trim() : ""))
    .filter(v => v && !/^smartGreeting\.trigger[1-4]$/.test(v));

  // Son çare: vitrin placeholder metni
  if (!triggers.length) triggers.push(t("trigger.customShowcase"));


  const [currentTrigger, setCurrentTrigger] = useState(0);
  const [fade, setFade] = useState(true);
  
  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTrigger(v => (v + 1) % triggers.length);
        setFade(true);
      }, 300);
    }, 8000);
    
    return () => clearInterval(id);
  }, [triggers.length]);

  return (
    <div className="w-full max-w-6xl mx-auto mb-2 mt-4">
      <div className="flex items-center gap-3 text-sm">
        {/* Sabit selamlama kutusu - VİTRİN İLE AYNI GENİŞLİKTE */}
        <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 min-w-[200px] flex items-center gap-2 overflow-hidden">
          {greetIconByHour()}
            <span className="truncate">{t("smartGreeting.hello", { name })}</span>
        </div>
        
        {/* Dinamik tetikleyici cümle - SABİT ALAN */}
        <div className="flex-1 min-h-[20px]">
          <span
            className={`text-white/90 transition-opacity duration-500 ease-in-out truncate block w-full leading-5 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {triggers[currentTrigger]}
          </span>
        </div>
      </div>
      
      {/* Vitrin ile ince ayırıcı çizgi - DAHA İNCE */}
      <div className="h-px bg-white/10 mt-3"></div>
    </div>
  );
}
