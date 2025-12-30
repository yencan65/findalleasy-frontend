import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";

export default function AuthPanel({ visible, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ?ref= yakala
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get("ref");
    if (ref) localStorage.setItem("ref", ref);
  }, []);

  // basit fingerprint
  const deviceFingerprint = useMemo(() => {
    const raw = (navigator.userAgent||"")+(navigator.language||"")+(screen?.width||"")+(screen?.height||"");
    let h=0; for(let i=0;i<raw.length;i++){ h=((h<<5)-h)+raw.charCodeAt(i); h|=0; }
    const fp = String(h);
    localStorage.setItem("deviceFingerprint", fp);
    return fp;
  }, []);

  function validate(){
    if(!email || !password) return setMsg("Lütfen e-posta ve şifre girin."), false;
    if(!/\S+@\S+\.\S+/.test(email)) return setMsg("Geçerli bir e-posta girin."), false;
    if(password.length<6) return setMsg("Şifre en az 6 karakter olmalı."), false;
    setMsg(""); return true;
  }

  async function submit(){
    if(!validate()) return;
    setLoading(true);
    const backend = API_BASE || "";
    const url = mode==="login" ? `${backend}/api/login` : `${backend}/api/register`;
    const body = mode==="login"
      ? { email, password }
      : { email, password, referralCodeUsed: localStorage.getItem("ref")||"", deviceFingerprint };
    try{
      const r = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if(!j.ok){ setMsg(j.msg||"İşlem başarısız."); setLoading(false); return; }
      localStorage.setItem("userEmail", email);
      onLoginSuccess && onLoginSuccess(j);
      setLoading(false); setMsg(""); onClose();
    }catch(e){ console.error(e); setMsg("Sunucuya ulaşılamadı."); setLoading(false); }
  }

  // Google için referral'ı state ile taşı
  const backend = API_BASE || "";
  const ref = localStorage.getItem("ref") || "";
  const state = btoa(JSON.stringify({ ref })); // base64 JSON

  if(!visible) return null;
  return (
    <div className="fixed top-16 z-50 left-3 right-3 sm:left-auto sm:right-6 w-auto sm:w-[340px] max-w-[92vw] bg-black/95 border border-[#d4af37]/60 rounded-xl p-4 shadow-lg max-h-[80dvh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#d4af37] font-semibold">{mode==="login"?"Giriş Yap":"Kayıt Ol"}</h3>
        <button onClick={onClose} className="text-sm text-white/70">Kapat</button>
      </div>

      {/* Kısa briefing */}
      <div className="bg-white/5 p-2 rounded mb-3 text-xs text-white/80">
        <b>FindAllEasy Ödül Ağı — Nasıl kazanırsın?</b>
        <div className="mt-1">
          Kayıt ol → <b>%1</b> indirim. Davet ettiklerinin ilk alışverişinde <b>%0.5</b>, sonraki her alışverişinde <b>%0.1</b>.
          Ödüller panelindeki <b>Ödül Ağacı</b>na otomatik yazılır. Giriş yapmadan alışverişte ödül <b>yoktur</b>.
        </div>
      </div>

      {msg && <div className="text-xs text-red-400 mb-2">{msg}</div>}

      <input className="w-full mb-2 p-2 rounded bg-transparent border border-[#d4af37]/40 text-white"
             placeholder="E-posta" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full mb-3 p-2 rounded bg-transparent border border-[#d4af37]/40 text-white"
             type="password" placeholder="Şifre (min 6)" value={password} onChange={e=>setPassword(e.target.value)} />

      <div className="flex gap-2 mb-3">
        <button onClick={submit}
                className="flex-1 bg-[#d4af37] text-black py-2 rounded font-semibold hover:bg-[#e6c85b]">
          {loading ? "Bekleyin…" : (mode==="login"?"Giriş Yap":"Kayıt Ol")}
        </button>
        <button onClick={()=>setMode(mode==="login"?"register":"login")}
                className="flex-1 border border-[#d4af37]/50 py-2 rounded text-sm">
          {mode==="login"?"Yeni misin? Kayıt Ol":"Zaten üye misin? Giriş"}
        </button>
      </div>

      {/* Google ile giriş (referral state ile) */}
      <div className="text-center mb-2">
        <a href={`${backend}/auth/google?state=${encodeURIComponent(state)}`}
           className="inline-block px-3 py-2 border border-white/10 rounded bg-white/5 text-sm">
          Google ile giriş
        </a>
      </div>

      <div className="text-[11px] text-white/60">
        Yanlış bilgi girersen nazikçe uyarırız; doğru bilgilerle tekrar deneyebilirsin.
      </div>
    </div>
  );
}