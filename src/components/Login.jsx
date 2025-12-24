// src/components/Login.jsx
import React, { useState } from "react";
import { loginReq } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

export default function Login({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(null);

    const res = await loginReq({ email, password });

    if (!res.ok) {
      setErr(res.message || "Giriş yapılamadı");
      return;
    }

    login(res.user);
    onClose && onClose();
  }

  return (
    <div className="p-4 w-full">
      <h2 className="text-white text-xl mb-4">Giriş Yap</h2>

      {err && <div className="text-red-400 mb-3">{err}</div>}

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="E-posta"
          className="p-2 rounded bg-white/10 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Şifre"
          className="p-2 rounded bg-white/10 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="p-2 rounded bg-blue-500 text-white font-bold active:scale-95"
          type="submit"
        >
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
