// src/components/ForgotPassword.jsx
import React, { useState } from "react";
import { requestReset, resetPassword } from "../api/auth";

export default function ForgotPassword({ onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [err, setErr] = useState(null);

  async function handleRequest(e) {
    e.preventDefault();
    setErr(null);

    const res = await requestReset(email);
    if (!res.ok) {
      setErr(res.message || "Kod gönderilemedi");
      return;
    }

    setStep(2);
  }

  async function handleReset(e) {
    e.preventDefault();
    setErr(null);

    const res = await resetPassword(email, code, newPass);
    if (!res.ok) {
      setErr(res.message || "Şifre yenilenemedi");
      return;
    }

    onClose && onClose();
  }

  return (
    <div className="p-4 text-white">
      {step === 1 && (
        <>
          <h2 className="text-xl mb-4">Şifre Sıfırlama</h2>
          {err && <div className="text-red-400 mb-3">{err}</div>}

          <form onSubmit={handleRequest} className="flex flex-col gap-3">
            <input
              placeholder="E-posta"
              className="p-2 bg-white/10 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="bg-blue-500 p-2 rounded font-bold active:scale-95">
              Kod Gönder
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl mb-4">Kod ile Doğrula</h2>
          {err && <div className="text-red-400 mb-3">{err}</div>}

          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <input
              placeholder="Doğrulama kodu"
              className="p-2 bg-white/10 rounded"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              type="password"
              placeholder="Yeni şifre"
              className="p-2 bg-white/10 rounded"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />

            <button className="bg-green-500 p-2 rounded font-bold active:scale-95">
              Şifreyi Güncelle
            </button>
          </form>
        </>
      )}
    </div>
  );
}
