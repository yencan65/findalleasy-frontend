// src/components/ProfileMenu.jsx
import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function ProfileMenu({
  onLoginClick,
  onRegisterClick,
  onInviteClick,
  onInviteTreeClick,
  onWalletClick,
}) {
  const { user, isLoggedIn, logout } = useAuth();

  // ------------------------------------------------------------
  // Kullanıcı adı güvenli seçici
  // email @ öncesi ASLA kullanılmıyor.
  // Kullanıcı kayıt ekranında hangi ismi girdiyse hep onu gösterir.
  // ------------------------------------------------------------
  const displayName =
    user?.name ||
    user?.profileName ||
    user?.displayName ||
    user?.username ||
    user?.fullname ||
    user?.firstName ||
    user?.email?.split("@")[0] || // fallback son çare
    "Kullanıcı";

  const points = Number.isFinite(Number(user?.points))
    ? Number(user?.points)
    : 0;

  return (
    <div
      className="
        absolute right-0 top-12 
        bg-black/80 backdrop-blur-xl 
        rounded-2xl 
        border border-white/15 
        shadow-xl 
        flex flex-col gap-1 
        w-56 max-w-[90vw]
        z-50 p-3
      "
    >
      {/* ================================
          GİRİŞ YAPMAMIŞ KULLANICI 
      =================================*/}
      {!isLoggedIn && (
        <>
          <button
            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => onLoginClick?.()}
          >
            Giriş Yap
          </button>

          <button
            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => onRegisterClick?.()}
          >
            Kayıt Ol
          </button>
        </>
      )}

      {/* ================================
          GİRİŞ YAPMIŞ KULLANICI
      =================================*/}
      {isLoggedIn && (
        <>
          {/* Kullanıcı Bilgisi */}
          <div className="px-3 py-2 text-[11px] text-white/70 border-b border-white/10 mb-1">
            <div className="font-semibold text-xs truncate max-w-[140px]">
              {displayName}
            </div>
            <div className="text-[11px]">{points.toFixed(0)} FAE</div>
          </div>

          {/* Cüzdan */}
          <button
            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => onWalletClick?.()}
          >
            Cüzdan & Ödüller
          </button>

          {/* Arkadaş daveti */}
          <button
            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => onInviteClick?.()}
          >
            Arkadaş Davet Et
          </button>

          {/* Davet ağı */}
          <button
            className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-white/10"
            onClick={() => onInviteTreeClick?.()}
          >
            Davet Ağacı
          </button>

          {/* Çıkış */}
          <button
            className="
              w-full text-left text-xs px-3 py-2 
              rounded-lg 
              hover:bg-red-500/20 
              text-red-300 mt-1
            "
            onClick={() => {
              try {
                logout();
              } catch {}
            }}
          >
            Çıkış Yap
          </button>
        </>
      )}
    </div>
  );
}
