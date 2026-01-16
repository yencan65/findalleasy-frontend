// src/components/Footer.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Footer({ fixed = false }) {
  const { t } = useTranslation();

  // 🔄 Dil değişince yeniden render için
  const [, forceRerender] = useState(0);
  useEffect(() => {
    const rerender = () => forceRerender((n) => n + 1);
    window.addEventListener("language-change", rerender);
    return () => window.removeEventListener("language-change", rerender);
  }, []);

  return (
    <footer className={`py-2 sm:py-3 px-3 w-full border-t border-[#d4af37]/20 ${fixed ? "fixed bottom-0 left-0 z-[60] bg-black/45 backdrop-blur-xl" : ""}`}>
      <hr className="footer-line" />
      <div className="phi-gap text-[11px] md:text-sm" />
      {/* ✅ Info + Legal links (reviewers want these) */}
      <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
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
          href="/terms"
          className="text-[#d4af37]/90 hover:text-[#d4af37] underline underline-offset-4 whitespace-nowrap"
        >
          {t("legal.terms", { defaultValue: "Kullanım Şartları" })}
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
