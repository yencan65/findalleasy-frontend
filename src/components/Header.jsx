// ========================================================
//  🚀 HEADER — GÖRSEL OLARAK BİRİNCİ HEADER, BEYİN OLARAK İKİNCİ HEADER
//  Hiçbir işlev/fonksiyon silinmedi. Bütün backend bağlantıları, event dispatch,
//  güvenlik filtreleri ve kullanıcı yükleme mekanizması birebir korundu.
// ========================================================

import React, { useState, useEffect, useRef } from "react";
import { Wallet, User, Globe } from "lucide-react";
import WalletPanel from "./WalletPanel";
import AuthModal from "./AuthModal";
import { useTranslation } from "react-i18next";
import { sanitizeName } from "../i18n";

// ========================================================
// GÜVENLİ USERNAME — email'den önceki kısmı kullan, XSS temizle
function safeUserName(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";

  // Eğer e-posta ise, sadece @ öncesini al
  const base = s.includes("@") ? s.split("@")[0] : s;

  return base.replace(/[<>]/g, "").slice(0, 40);
}

// ========================================================
// SNAP ICON — daha “şıklatma” hissi veren, keskin ve okunaklı ikon
function SnapIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Thumb */}
      <path
        d="M18 43 C18 35, 24 30, 31 31 C38 32, 38 40, 31 45"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Index finger */}
      <path
        d="M34 55 V35 C34 28, 39 23, 48 20 C52 19, 56 18, 60 18"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Palm/base */}
      <path
        d="M18 55 C26 59, 40 59, 48 55"
        stroke="currentColor"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snap spark */}
      <path
        d="M50 8 L50 16"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M46 12 L54 12"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M56 10 L60 6"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ========================================================
// HEADER COMPONENT
// ========================================================
export default function Header() {
  const { t, i18n } = useTranslation();

  // STATE
  const [openLang, setOpenLang] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [user, setUser] = useState({ name: "", points: 0 });

  const langRef = useRef(null);

  // ========================================================
  // USER LOAD
  // ========================================================
  function loadUserFromStorage() {
    try {
      const rawName = localStorage.getItem("username") || "";
      const points = Number(localStorage.getItem("points") || "0") || 0;

      if (!rawName) return;

      setUser({
        name: safeUserName(rawName),
        points: points,
      });
    } catch (e) {
      console.warn("header loadUserFromStorage error:", e);
      setUser({ name: "", points: 0 });
    }
  }

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Storage Senkronizasyonu
  useEffect(() => {
    const sync = () => loadUserFromStorage();

    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("user-updated", sync);

    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("user-updated", sync);
    };
  }, []);

  // ========================================================
  // CLICK OUTSIDE
  // ========================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setOpenLang(false);
      }
      if (!e.target.closest("#user-menu")) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ========================================================
  // LANGUAGE LABELS
  // ========================================================
  const LANG_LABELS = { tr: "TR", en: "EN", fr: "FR", ru: "RU", ar: "AR" };

  const langRaw = String(i18n.resolvedLanguage || i18n.language || "tr").toLowerCase();
  const langKey = (langRaw.split("-")[0] || "tr").toLowerCase();
  const langLabel = LANG_LABELS[langRaw] || LANG_LABELS[langKey] || langKey.toUpperCase();

  function changeLanguage(lang) {
    try {
      i18n.changeLanguage(lang);
      localStorage.setItem("i18nextLng", lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      window.dispatchEvent(new Event("language-change"));
      window.dispatchEvent(new Event("fae.vitrine.refresh"));
      setOpenLang(false);
    } catch (err) {
      console.warn("Dil değişimi hatası:", err);
    }
  }

  // ========================================================
  // LOGOUT
  // ========================================================
  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("points");
    } catch {}

    setUser({ name: "", points: 0 });
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("fae.vitrine.refresh"));

    setUserOpen(false);
  }

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  // ========================================================
  //  RENDER (Birinci Header'ın tasarımı)
  // ========================================================
  return (
    <header
      className="
        w-full flex flex-row justify-between items-center flex-nowrap gap-2 sm:gap-3
        px-3 sm:px-6 py-3 sm:py-4 bg-[#d9d9d9]
        border-b border-[#d4af37]/20
        text-black font-sans backdrop-blur-xl
      "
      style={{
        boxShadow: "0 8px 28px rgba(212,175,55,0.07)",
      }}
    >
      {/* LOGO */}
      <button
        type="button"
        className="flex items-center flex-shrink-0 cursor-pointer select-none"
        onClick={() => window.dispatchEvent(new Event("fae.vitrine.refresh"))}
        aria-label="FindAllEasy"
        title="FindAllEasy"
      >
        <div
          className="
            flex items-center gap-1.5 sm:gap-2
            drop-shadow-[0_0_6px_rgba(212,175,55,0.35)]
            whitespace-nowrap
          "
        >
          <span
            className="
              font-extrabold tracking-tight leading-none
              text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px]
              max-w-[44vw] sm:max-w-none
              overflow-hidden text-ellipsis
            "
          >
            <span className="text-[#111]">Find</span>
            <span className="text-[#111]">All</span>
            <span className="text-[#111]">Easy</span>
          </span>

          <SnapIcon
            className="
              text-[#d4af37]
              w-5 h-5 sm:w-6 sm:h-6
              -translate-y-[1px]
              flex-shrink-0
            "
          />
        </div>
      </button>

      {/* RIGHT SIDE */}
      <div className="flex flex-nowrap items-center justify-end gap-2 sm:gap-4 flex-shrink-0">
        {/* 🌍 LANGUAGE PICKER */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setOpenLang(!openLang)}
            className="
              flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full
              border border-[#d4af37]/40 text-[#d4af37]
              bg-black/25 backdrop-blur-lg
              shadow-[inset_0_0_10px_rgba(255,255,255,0.10),0_0_6px_rgba(212,175,55,0.25)]
              transition-all duration-300
              hover:scale-[1.08]
              hover:shadow-[0_0_14px_rgba(212,175,55,0.45)]
              hover:bg-[#d4af37]/20 hover:text-black
              whitespace-nowrap
            "
          >
            <Globe size={18} />
            <span className="uppercase text-sm">{langLabel}</span>
          </button>

          {openLang && (
            <div
              className="
                absolute
                top-full mt-2 right-0
                sm:top-1/2 sm:-translate-y-1/2
                sm:right-full sm:mr-3 sm:mt-0
                bg-black/45 backdrop-blur-2xl
                border border-[#d4af37]/15
                rounded-3xl
                px-3 py-2
                flex flex-nowrap gap-2
                max-w-[88vw] sm:max-w-none
                overflow-y-auto overflow-x-hidden
                whitespace-nowrap
                [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                justify-start
                z-50 animate-fadeIn
              "
            >
              {Object.keys(LANG_LABELS).map((lng) => (
                <button
                  key={lng}
                  onClick={() => changeLanguage(lng)}
                  className={`
                    px-2.5 py-1 rounded-full text-[11px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold shrink-0
                    border border-[#d4af37]/25 text-[#d4af37]
                    hover:scale-[1.10]
                    hover:bg-[#d4af37] hover:text-black
                    transition-all
                    ${i18n.language === lng ? "bg-[#d4af37]/35 text-black" : ""}
                  `}
                >
                  {LANG_LABELS[lng]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 💰 WALLET */}
        <button
          onClick={() => setWalletOpen(true)}
          className="
            p-2 rounded-full border border-[#d4af37]/60
            text-[#d4af37] bg-black/20 backdrop-blur-lg
            hover:bg-[#d4af37]/20 hover:text-black
            transition-all
          "
        >
          <Wallet size={20} />
        </button>

        {/* 👤 USER MENU */}
        <div className="relative" id="user-menu">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="
              p-2 rounded-full
              border border-[#d4af37]/60 text-[#d4af37]
              bg-black/20 backdrop-blur-lg
              hover:bg-[#d4af37]/20 hover:text-black
              transition-all
            "
          >
            <User size={20} />
          </button>

          {userOpen && (
            <div
              className="
                absolute right-0 top-12
                bg-black/75 backdrop-blur-xl
                border border-[#d4af37]/35 rounded-2xl
                p-4 shadow-[0_0_18px_rgba(212,175,55,0.25)]
                text-sm w-56 z-50 animate-fadeIn
              "
            >
              {isLoggedIn ? (
                <>
                  <p className="text-[#d4af37] font-semibold mb-1">
                    {sanitizeName(user.name) || t("username")}
                  </p>
                  <p className="text-gray-300 mb-3">
                    {t("Puan")}: {user.points}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="
                      w-full border border-[#d4af37]/60 rounded-lg
                      text-[#d4af37] hover:bg-[#d4af37]/25 py-1 transition-all
                    "
                  >
                    {t("auth.logout")}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setUserOpen(false);
                    setOpenLang(false);
                    setShowAuth(true);
                  }}
                  className="
                    w-full border border-[#d4af37]/60 rounded-lg
                    text-[#d4af37] hover:bg-[#d4af37]/25 py-1 transition-all
                  "
                >
                  {t("auth.login")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WALLET PANEL */}
      {walletOpen && (
        <WalletPanel
          onClose={() => setWalletOpen(false)}
          className="relative z-[9999] border-2 border-[#d4af37]/80 shadow-[0_0_14px_rgba(212,175,55,0.5)]"
        />
      )}

      {/* LOGIN MODAL */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginSuccess={(name, points) => {
            setUser({ name, points });
            window.dispatchEvent(new Event("auth-changed"));
          }}
        />
      )}
    </header>
  );
}
