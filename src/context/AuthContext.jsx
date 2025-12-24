// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { getProfile } from "../api/auth";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // İlk açılışta localStorage’dan kullanıcıyı yükle
  useEffect(() => {
    const saved = localStorage.getItem("fae_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);

      // Backend’den güncel profil çek
      getProfile(u.id)
        .then((res) => {
          if (res?.ok && res?.user) {
            setUser(res.user);
            localStorage.setItem("fae_user", JSON.stringify(res.user));
          }
        })
        .catch(() => {});
    }

    setLoading(false);
  }, []);

  function login(userData) {
    setUser(userData);
    localStorage.setItem("fae_user", JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("fae_user");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
