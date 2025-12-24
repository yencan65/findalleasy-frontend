import { useEffect, useState } from "react";
import { login, register } from "../api/auth";

export default function LoginPopup() {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const op = () => setVisible(true);
    window.addEventListener("openLogin", op);
    return () => window.removeEventListener("openLogin", op);
  }, []);

  const afterAuth = (data) => {
    if (!data.ok) return alert(data.msg || "İşlem başarısız");
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userId", data.user._id);
    localStorage.setItem("token", data.token);
    if (data.user.referralCode) localStorage.setItem("referralCode", data.user.referralCode);
    setVisible(false);
    location.reload();
  };

  const doLogin = async () => {
    const data = await login(email, password);
    afterAuth(data);
  };

  const doRegister = async () => {
    const url = new URL(window.location.href);
    const referral = url.searchParams.get("ref") || localStorage.getItem("ref") || "";
    const data = await register(email, password, referral);
    afterAuth(data);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-2xl w-80 shadow-xl">
        <div className="flex gap-4 mb-4">
          <button className={tab==='login'?'font-bold':''} onClick={()=>setTab('login')}>Giriş</button>
          <button className={tab==='register'?'font-bold':''} onClick={()=>setTab('register')}>Kayıt</button>
        </div>

        <input
          type="email" placeholder="E-posta"
          className="border w-full mb-2 px-2 py-1 rounded"
          value={email} onChange={e=>setEmail(e.target.value)}
        />
        <input
          type="password" placeholder="Şifre"
          className="border w-full mb-4 px-2 py-1 rounded"
          value={password} onChange={e=>setPassword(e.target.value)}
        />

        {tab==='login' ? (
          <button onClick={doLogin} className="w-full bg-gold text-black rounded py-2 hover:opacity-90">
            Giriş Yap
          </button>
        ) : (
          <button onClick={doRegister} className="w-full bg-gold text-black rounded py-2 hover:opacity-90">
            Kayıt Ol
          </button>
        )}
      </div>
    </div>
  );
}
