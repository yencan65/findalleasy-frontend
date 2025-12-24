// src/components/Register.jsx
import React, { useState } from "react";
import { register, sendVerifyCode, verifyCode } from "../api/auth";

export default function Register({ onClose }) {
  const [step, setStep] = useState(1); // 1: register, 2: verify
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    referralCode: "",
  });

  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [err, setErr] = useState(null);

  async function handleRegister(e) {
    e.preventDefault();
    setErr(null);

    // 1) önce email’e kod gönder
    const send = await sendVerifyCode(form.email);
    if (!send.success) {
      setErr("Doğrulama kodu gönderilemedi");
      return;
    }

    setStep(2);
  }

  async function handleVerify(e) {
    e.preventDefault();
    const v = await verifyCode(form.email, verifyCodeInput);

    if (!v.verified) {
      setErr("Kod yanlış veya süresi dolmuş");
      return;
    }

    // Backend’e kayıt isteği
    const res = await register(form);
    if (!res.ok) {
      setErr(res.message || "Kayıt yapılamadı");
      return;
    }

    onClose && onClose();
  }

  return (
    <div className="p-4 text-white">
      {step === 1 && (
        <>
          <h2 className="text-xl mb-4">Kayıt Ol</h2>
          {err && <div className="mb-3 text-red-300">{err}</div>}

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <input
              placeholder="İsim Soyisim"
              className="p-2 rounded bg-white/10"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
            />
            <input
              placeholder="E-posta"
              className="p-2 rounded bg-white/10"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Şifre"
              className="p-2 rounded bg-white/10"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <input
              placeholder="Referans Kodu (opsiyonel)"
              className="p-2 rounded bg-white/10"
              value={form.referralCode}
              onChange={(e) =>
                setForm({ ...form, referralCode: e.target.value })
              }
            />

            <button className="bg-blue-500 p-2 rounded font-bold active:scale-95">
              Devam Et (Doğrulama Kodu Al)
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl mb-4">E-posta Doğrulama</h2>
          {err && <div className="mb-3 text-red-300">{err}</div>}

          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <input
              placeholder="6 Haneli Kod"
              className="p-2 rounded bg-white/10"
              value={verifyCodeInput}
              onChange={(e) => setVerifyCodeInput(e.target.value)}
            />
            <button className="bg-green-500 p-2 rounded font-bold active:scale-95">
              Hesabı Oluştur
            </button>
          </form>
        </>
      )}
    </div>
  );
}
