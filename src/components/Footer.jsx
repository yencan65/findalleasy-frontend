// src/components/Footer.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  // 🔄 Dil değişince yeniden render için
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const rerender = () => setTick((t) => t + 1);
    window.addEventListener("language-change", rerender);
    return () => window.removeEventListener("language-change", rerender);
  }, []);

  return (
    <footer className="py-4 sm:py-8 px-3 w-full">
      <hr className="footer-line" />
      <div className="phi-gap" />
      <p className="text-center text-sm text-mist">
        © 2025 <span className="text-gold font-medium">FindAllEasy</span> |{" "}
        {t("footerFull.left", {
          defaultValue: "Yapay zeka destekli global fiyat karşılaştırma asistanın.",
        })}{" "}
        {t("footerFull.mid", {
          defaultValue: "Zaman ve paradan tasarruf için parmak şıklatman yeter,",
        })}{" "}
        <span className="text-gold">
          {t("footerFull.right", { defaultValue: "gerisini O halleder." })}
        </span>
      </p>

      {/* ✅ Info + Legal links (reviewers want these) */}
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
        <a
          href="/about"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("site.about", { defaultValue: "Hakkımızda" })}
        </a>
        <span className="text-[#d4af37]/40">•</span>
        <a
          href="/how-it-works"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("site.how", { defaultValue: "Nasıl Çalışır?" })}
        </a>
        <span className="text-[#d4af37]/40">•</span>
        <a
          href="/contact"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("site.contact", { defaultValue: "İletişim" })}
        </a>
        <span className="text-[#d4af37]/40">•</span>
        <a
          href="/privacy"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("legal.privacy", { defaultValue: "Gizlilik" })}
        </a>
        <span className="text-[#d4af37]/40">•</span>
        <a
          href="/cookies"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("legal.cookies", { defaultValue: "Çerezler" })}
        </a>
        <span className="text-[#d4af37]/40">•</span>
        <a
          href="/affiliate-disclosure"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("legal.affiliate", { defaultValue: "Affiliate Açıklaması" })}
        </a>
      </nav>
</footer>
  );
} 