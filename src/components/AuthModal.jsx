// ===========================================================
// src/components/AuthModal.jsx
// HERKÜL MODU — Aktivasyon, Login, Register, Forgot, Reset
// İşlev silme YOK — sadece güçlendirme ve doğru akış
// ===========================================================

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

import { API_BASE } from "../utils/api";
import { getStoredReferral, clearStoredReferral } from "../utils/referralTracker";

const BASE = API_BASE || "";

// -----------------------------------------------------------
// Güvenli username (XSS + temizleme)
// -----------------------------------------------------------
function safeName(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";
  return s.replace(/[<>]/g, "").slice(0, 40);
}

export default function AuthModal({ onClose, onLoggedIn, onLoginSuccess }) {
  const { t } = useTranslation();

  // ===========================================================
  // FULLSCREEN MODAL QUALITY
  // - Body scroll lock (no page scrolling behind)
  // - ESC to close
  // - Render via Portal (never gets stuck inside header/layout)
  // ===========================================================
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      document.body.classList.add("fae-modal-open");
    }

    const onKey = (e) => {
      if (e?.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        document.body.classList.remove("fae-modal-open");
      } catch {}
    };
  }, [onClose]);

  // ===========================================================
  // STATE
  // ===========================================================
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referral, setReferral] = useState("");

  const [forgotStep, setForgotStep] = useState(0);
  const [resetCode, setResetCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Aktivasyon state
  const [pendingEmail, setPendingEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // ===========================================================
  // Ortak login bildirimi
  // ===========================================================
  function notifyLoggedIn(payload) {
    try {
      onLoggedIn?.(payload);
      onLoginSuccess?.(payload.name, payload.points);
    } catch (err) {
      console.warn("notifyLoggedIn error:", err);
    }
  }

  // ===========================================================
  // LOGIN
  // ===========================================================
  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);

      const r = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(data.message || data.error || t("auth.loginFailed"));
        return;
      }

      const backendUser = data.user || null;

      const userId =
        data.userId || backendUser?.id || backendUser?._id || "";

      const rawName =
        data.name ||
        data.username ||
        backendUser?.username ||
        backendUser?.name ||
        email.split("@")[0];

      const safeUsername = safeName(rawName);

      const rewardsTotal =
        typeof data.rewards === "number"
          ? data.rewards
          : typeof data.points === "number"
          ? data.points
          : 0;

      const token =
        data.token ||
        `local-${userId || email}-${Date.now().toString(36)}`;

      // ===== Local Storage =====
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      const finalName =
        backendUser?.username ||
        backendUser?.name ||
        safeUsername ||
        username ||
        email.split("@")[0];

      localStorage.setItem("username", finalName);
      localStorage.setItem("points", String(rewardsTotal));

      window.dispatchEvent(new Event("auth-changed"));

      notifyLoggedIn({
        userId,
        name: finalName,
        points: rewardsTotal,
      });

      onClose?.();
    } catch (err) {
      alert(`${t("networkError")} → ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================
  // REGISTER
  // ===========================================================
  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert(t("fillAllFields"));
      return;
    }

    const safeUser = safeName(username);

    const storedRef = getStoredReferral();
    const cleanReferral =
      (referral || "").trim() || storedRef?.code || null;

    try {
      setLoading(true);

      const r = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: safeUser,
          email,
          password,
          referral: cleanReferral,
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || data.error) {
        alert(data.error || t("auth.registerFailed"));
        return;
      }

      const targetEmail = data.email || email;

      if (data.requiresActivation !== false) {
        setPendingEmail(targetEmail);
        setActivationCode("");
        setTab("activate");

        alert(t("auth.activationMailSent"));
      } else {
        alert(t("auth.registerSuccess"));
        setTab("login");
      }

      setPassword("");
      setReferral("");

      localStorage.setItem("last_registered_email", targetEmail);
      window.dispatchEvent(new Event("auth-changed"));
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  // ===========================================================
  // AKTİVASYON SUBMIT
  // ===========================================================
  async function handleActivationSubmit() {
    if (!pendingEmail || !activationCode.trim()) {
      alert(t("auth.activationCodeRequired"));
      return;
    }

    try {
      setActivationLoading(true);

      const r = await fetch(`${BASE}/api/auth/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: activationCode.trim(),
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data.ok) {
        alert(
          data.error || t("auth.activationFailed")
        );
        return;
      }

      alert(t("auth.activationSuccess"));

      clearStoredReferral();
      setTab("login");
    } catch {
      alert(t("networkError"));
    } finally {
      setActivationLoading(false);
    }
  }

  // ===========================================================
  // AKTİVASYON TEKRAR GÖNDER
  // ===========================================================
  async function handleResendActivation() {
    if (!pendingEmail) {
      alert(t("auth.emailRequired"));
      return;
    }

    try {
      setResendLoading(true);

      const r = await fetch(`${BASE}/api/auth/resend-activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data.ok) {
        alert(data.error || t("auth.resendFailed"));
        return;
      }

      alert(t("auth.resendSuccess"));
    } catch {
      alert(t("networkError"));
    } finally {
      setResendLoading(false);
    }
  }

  // ===========================================================
  // FORGOT PASSWORD
  // ===========================================================
  async function handleForgotStart() {
    if (!email.trim()) {
      alert(t("emailRequired"));
      return;
    }

    try {
      setForgotLoading(true);

      const r = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(data.error || t("processFailed"));
        return;
      }

      alert(t("resetCodeSent"));
      setForgotStep(1);
    } catch {
      alert(t("networkError"));
    } finally {
      setForgotLoading(false);
    }
  }

  // ===========================================================
  // RESET PASSWORD
  // ===========================================================
  async function handleSaveNewPwd() {
    if (!resetCode.trim() || !newPwd.trim()) {
      alert(t("missingFields"));
      return;
    }

    try {
      setResetLoading(true);

      const r = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: resetCode.trim(),
          newPassword: newPwd,
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert(data.error || t("updateFailed"));
        return;
      }

      alert(t("passwordUpdated"));

      setTab("login");
      setForgotStep(0);
      setPassword("");
    } catch {
      alert(t("networkError"));
    } finally {
      setResetLoading(false);
    }
  }

  // ===========================================================
  // UI
  // ===========================================================
  const modal = (
    <div
      id="auth-bg"
      role="dialog"
      aria-modal="true"
      className="
        fixed inset-0 z-[99999]
        bg-black/55 backdrop-blur-md
        flex items-center justify-center
        p-3 sm:p-6 overflow-hidden
      "
      onClick={(e) => {
        if (e.target?.id === "auth-bg") onClose?.();
      }}
    >
      <div
        className="
          relative w-full max-w-[420px]
          rounded-2xl border border-[#d4af37]/40
          bg-[#0f1116] p-5 sm:p-6 shadow-2xl
          max-h-[calc(100dvh-24px)] overflow-y-auto
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          animate-scale-in
        "
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-300 hover:text-white transition"
        >
          <X size={22} />
        </button>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-md ${
              tab === "login"
                ? "bg-[#d4af37] text-black"
                : "bg-black/40 text-gray-300"
            }`}
            onClick={() => setTab("login")}
          >
            {t("auth.login")}
          </button>

          <button
            className={`px-3 py-1.5 rounded-md ${
              tab === "register" || tab === "activate"
                ? "bg-[#d4af37] text-black"
                : "bg-black/40 text-gray-300"
            }`}
            onClick={() => setTab("register")}
          >
            {t("auth.register")}
          </button>

          <button
            className="ml-auto text-xs text-gray-300 underline-offset-4 hover:underline"
            onClick={() => setTab("forgot")}
          >
            {t("auth.forgotPassword")}
          </button>
        </div>

        {/* LOGIN UI */}
        {tab === "login" && (
          <form className="space-y-3" onSubmit={handleLogin}>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-2 rounded-md 
                bg-[#d4af37] text-black 
                hover:bg-[#e9c335] 
                disabled:opacity-60
              "
            >
              {loading ? t("loading") : t("auth.login")}
            </button>
          </form>
        )}

        {/* REGISTER UI */}
        {tab === "register" && (
          <div className="space-y-3">
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.nameSurname")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="email"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="text"
              className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
              placeholder={t("auth.inviteCode")}
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
            />

            <button
              disabled={loading}
              onClick={handleRegister}
              className="
                w-full py-2 rounded-md 
                bg-[#d4af37] text-black 
                hover:bg-[#e9c335] 
                disabled:opacity-60
              "
            >
              {loading ? t("loading") : t("auth.register")}
            </button>
          </div>
        )}

        {/* ACTIVATION UI */}
        {tab === "activate" && (
          <div className="space-y-3">
            <div className="text-sm text-gray-200">
              <div className="font-semibold mb-1">
                {t("auth.activateTitle")}
              </div>
              <div className="text-xs text-gray-400">
                {pendingEmail
                  ? `${pendingEmail} → ${t("auth.activationInfoEmail")}`
                  : t("auth.activationInfoNoEmail")}
              </div>
            </div>

            <input
              type="text"
              className="
                w-full px-3 py-2 rounded-md 
                bg-black/40 border border-[#444] 
                text-sm text-white tracking-[0.3em] text-center
              "
              placeholder={t("auth.activationCode")}
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              maxLength={6}
              required
            />

            <button
              disabled={activationLoading}
              onClick={handleActivationSubmit}
              className="
                w-full py-2 rounded-md 
                bg-[#d4af37] text-black 
                hover:bg-[#e9c335] 
                disabled:opacity-60
              "
            >
              {activationLoading ? t("loading") : t("auth.activateAccount")}
            </button>

            <button
              disabled={resendLoading}
              onClick={handleResendActivation}
              className="
                w-full py-2 rounded-md 
                bg-transparent text-xs text-gray-300 
                underline-offset-4 hover:underline
                disabled:opacity-60
              "
            >
              {resendLoading ? t("loading") : t("auth.resendCode")}
            </button>
          </div>
        )}

        {/* FORGOT PASSWORD UI */}
        {tab === "forgot" && (
          <div className="space-y-3">
            {forgotStep === 0 && (
              <>
                <input
                  type="email"
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button
                  disabled={forgotLoading}
                  onClick={handleForgotStart}
                  className="
                    w-full py-2 rounded-md 
                    bg-[#d4af37] text-black 
                    hover:bg-[#e9c335]
                  "
                >
                  {t("auth.sendResetCode")}
                </button>
              </>
            )}

            {forgotStep === 1 && (
              <>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
                  placeholder={t("auth.enterResetCode")}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />

                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-md bg-black/40 border border-[#444] text-sm text-white"
                  placeholder={t("auth.newPassword")}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                />

                <button
                  disabled={resetLoading}
                  onClick={handleSaveNewPwd}
                  className="
                    w-full py-2 rounded-md 
                    bg-[#d4af37] text-black 
                    hover:bg-[#e9c335]
                  "
                >
                  {t("auth.saveNewPassword")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Portal ile body'ye bas: sticky header/overflow/transform etkilerinden kurtul.
  if (!mounted) return null;
  try {
    return createPortal(modal, document.body);
  } catch {
    return modal;
  }
}