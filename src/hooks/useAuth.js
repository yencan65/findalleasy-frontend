import { useEffect, useState } from "react";

/* ============================================================
   GÜVENLİ METİN — XSS temizliği + maksimum uzunluk
============================================================ */
function safe(v) {
  if (!v) return "";
  try {
    return String(v).replace(/[<>]/g, "").trim().slice(0, 80);
  } catch {
    return "";
  }
}

/* ============================================================
   LOCALSTORAGE → Kullanıcıyı güvenli okuma
   (bozuk token / eksik field / XSS tamamen bloklanır)
============================================================ */
function readUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token || token.length < 10) {
      // Bozuk token varsa komple sıfırla (güvenlik)
      localStorage.removeItem("token");
      return { isLoggedIn: false, user: null };
    }

    const id = safe(localStorage.getItem("userId") || "");
    const username = safe(localStorage.getItem("username") || "");
    const points = Number(localStorage.getItem("points") || 0);

    // İsim mutlaka kayıt esnasında gelen "name" olmalı
    const name =
      username ||
      safe(localStorage.getItem("name") || "") || // opsiyonel destek
      "";

    return {
      isLoggedIn: true,
      user: {
        id,
        name,
        username: name,
        token,
        points,
      },
    };
  } catch (e) {
    console.warn("readUser hata:", e);
    return { isLoggedIn: false, user: null };
  }
}

/* ============================================================
   useAuth — Uygulamanın merkezi oturum motoru
============================================================ */
export function useAuth() {
  const [state, setState] = useState(readUser());

  /* ----------------------------------------------------------
     GLOBAL Auth Senkronizasyonu
     Arka plandaki değişiklikleri (login, logout, profil update)
     otomatik olarak algılar
  ---------------------------------------------------------- */
  useEffect(() => {
    let timeout = null;

    const sync = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const newState = readUser();
        setState(newState);

        // Vitrine yeni kullanıcı bilgisi gelsin
        window.dispatchEvent(new Event("fae.vitrine.refresh"));

        // Sono AI kullanıcı hafızasını sıfırlasın
        window.dispatchEvent(new Event("sono.resetUser"));
      }, 40);
    };

    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("user-updated", sync);

    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("user-updated", sync);
    };
  }, []);

  /* ============================================================
     LOGIN — Her bileşenden çağrılabilir
     Kullanıcı adını "kayıt esnasındaki name" olarak yazar.
============================================================ */
  function login({ token, userId, username, name, points }) {
    try {
      if (token) localStorage.setItem("token", token);

      // Güvenli kullanıcı ID
      if (userId) localStorage.setItem("userId", safe(userId));

      // Kayıt formundan gelen gerçek isim
      if (name) {
        localStorage.setItem("username", safe(name));
        localStorage.setItem("name", safe(name));
      } else if (username) {
        // Geriye dönük destek
        localStorage.setItem("username", safe(username));
      }

      if (points !== undefined && points !== null) {
        localStorage.setItem("points", String(points));
      }
    } catch (e) {
      console.warn("login storage hatası:", e);
    }

    // Uygulamanın tamamını haberdar et
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("fae.vitrine.refresh"));
    window.dispatchEvent(new Event("sono.resetUser"));

    setState(readUser());
  }

  /* ============================================================
     LOGOUT — Tüm oturumu temizler, AI ve vitrin resetlenir
============================================================ */
  function logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("name");
      localStorage.removeItem("points");
    } catch (e) {
      console.warn("logout storage hatası:", e);
    }

    // Global olaylar
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("fae.vitrine.refresh"));
    window.dispatchEvent(new Event("sono.resetUser"));

    setState({ isLoggedIn: false, user: null });
  }

  /* ============================================================
     DIŞA AÇILAN API
============================================================ */
  return {
    user: state.user,
    isLoggedIn: state.isLoggedIn,
    login,
    logout,
  };
}
