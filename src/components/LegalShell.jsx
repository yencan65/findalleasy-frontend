import React from "react";
import { useTranslation } from "react-i18next";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

// ============================================================================
// LEGAL SHELL — minimalist layout for policy pages
// - No router dependency
// - Uses existing Header/Footer to look "first-class" in approvals
// ============================================================================

// Backward compatible: existing callers pass only children.
export default function LegalShell({
  children,
  badgeText,
  homeHref = "/",
  homeLabel,
}) {
  const { t } = useTranslation();
  const badge = (badgeText && String(badgeText).trim() !== "")
    ? badgeText
    : t("legal.badge", { defaultValue: "Info" });
  const home = (homeLabel && String(homeLabel).trim() !== "")
    ? homeLabel
    : t("legal.home", { defaultValue: "← Home" });
  return (
    <div className="min-h-screen w-full bg-transparent text-white">
      <Header />

      <main className="w-full px-4 py-10">
        <div
          className="mx-auto max-w-3xl rounded-3xl border border-[#d4af37]/15 bg-black/35 backdrop-blur-2xl p-6 md:p-10"
          style={{ boxShadow: "0 14px 50px rgba(0,0,0,0.35)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <a
              href={homeHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4af37]/35 text-[#d4af37] bg-black/20 hover:bg-[#d4af37]/20 hover:text-black transition-all"
            >
              {home}
            </a>
            <div className="text-xs text-[#d4af37]/70">FindAllEasy • {badge}</div>
          </div>

          <div className="legal-prose">{children}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
