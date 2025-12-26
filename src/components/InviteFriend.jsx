// src/components/InviteFriend.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchWalletAndRewards } from "../api/rewards";


// =========================================================
//   🔥 InviteFriend — Herkül Sürümü (Silme yok, güçlendirildi)
// =========================================================

export default function InviteFriend({ onClose }) {
  const { user } = useAuth();

  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [qr, setQR] = useState("");
  const [copied, setCopied] = useState(false);

  // =========================================================
  //   🔥 Kullanıcının davet kodu (wallet üzerinden çekilir)
  // =========================================================
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    fetchWalletAndRewards(user.id)
      .then((res) => {
        if (cancelled) return;

        const code =
          res?.inviteCode ||
          res?.referralCode ||
          res?.ref ||
          res?.code ||
          "";

        if (code) {
          setInviteCode(code);
        } else {
          setInviteCode("");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user]);

  // =========================================================
  //   🔥 Davet linki oluşturma (güçlendirilmiş)
  // =========================================================
  useEffect(() => {
    if (!inviteCode) return;

    try {
      const origin = window?.location?.origin || "https://findalleasy.com";

      const link = `${origin}/?ref=${encodeURIComponent(inviteCode)}`;
      setInviteLink(link);

      // QR kod üretimi
      QRCode.toDataURL(link).then((img) => setQR(img));
    } catch {
      const fallback = `https://findalleasy.com/?ref=${encodeURIComponent(
        inviteCode
      )}`;
      setInviteLink(fallback);

      QRCode.toDataURL(fallback).then((img) => setQR(img));
    }
  }, [inviteCode]);

  // =========================================================
  //   🔥 Link kopyalama
  // =========================================================
  async function copy() {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const disabled = !inviteLink;

  // =========================================================
  //   🔥 Instagram paylaşımı mobil fallback
  // =========================================================
  const instagramShare = inviteLink
    ? `instagram://story-camera#fallback=${encodeURIComponent(
        `https://www.instagram.com/?url=${encodeURIComponent(inviteLink)}`
      )}`
    : "";

  // =========================================================
  //   🔥 Sosyal medya paylaşım linkleri
  // =========================================================
  const shareTargets = inviteLink
    ? [
        {
          id: "whatsapp",
          label: "WhatsApp",
          href: `https://wa.me/?text=${encodeURIComponent(
            `FindAllEasy'de fırsatları keşfetmek için davetimi kullan: ${inviteLink}`
          )}`,
        },
        {
          id: "telegram",
          label: "Telegram",
          href: `https://t.me/share/url?url=${encodeURIComponent(
            inviteLink
          )}&text=${encodeURIComponent("FindAllEasy ile fiyat karşılaştır!")}`,
        },
        {
          id: "x",
          label: "X (Twitter)",
          href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            inviteLink
          )}&text=${encodeURIComponent(
            "FindAllEasy ile en uygun fiyatları keşfet!"
          )}`,
        },
        {
          id: "instagram",
          label: "Instagram",
          href: instagramShare,
        },
        {
          id: "facebook",
          label: "Facebook",
          href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            inviteLink
          )}`,
        },
      ]
    : [];

  // =========================================================
  //   🔥 UI — Modern, sade, güçlü
  // =========================================================
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-[420px] rounded-2xl bg-[#0a0a0f] border border-white/15 p-4 sm:p-6 shadow-[0_0_30px_rgba(0,0,0,0.7)] text-white relative animate-scale-in mt-12 sm:mt-16 max-h-[92dvh] overflow-y-auto">

        {/* BAŞLIK */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold tracking-wide text-[#d4af37]">
            Davet Et
          </h2>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* AÇIKLAMA */}
        <p className="text-xs text-white/70 leading-relaxed mb-4">
          Davet linkini arkadaşlarınla paylaş. Onlar alışveriş yaptıkça senin
          cüzdanına ödül eklensin.
        </p>

        {/* DAVET LİNKİ */}
        <div>
          <div className="text-xs text-white/60 mb-1">Davet Linkin</div>
          <div className="flex gap-2 items-center">
            <input
              readOnly
              className="flex-1 p-2 rounded bg-white/10 text-xs text-white border border-white/10"
              value={inviteLink || "Davet linkin hazırlanıyor..."}
            />
            <button
              onClick={copy}
              disabled={disabled}
              className="px-3 py-2 rounded bg-blue-500 disabled:bg-blue-500/40 text-xs font-bold active:scale-95 transition"
            >
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
        </div>

        {/* DAVET KODU */}
        {inviteCode && (
          <div className="mt-3 text-xs opacity-80">
            Davet kodun:{" "}
            <span className="font-mono bg-white/10 px-2 py-1 rounded border border-white/10">
              {inviteCode}
            </span>
          </div>
        )}

        {/* QR KOD */}
        {qr && (
          <div className="mt-4 flex justify-center">
            <img
              src={qr}
              alt="QR"
              className="w-32 h-32 rounded-xl border border-white/10 shadow"
            />
          </div>
        )}

        {/* SOSYAL MEDYA PAYLAŞIMI */}
        {shareTargets.length > 0 && (
          <div className="mt-5">
            <div className="text-xs opacity-70 mb-2">Sosyal Medyada Paylaş</div>

            <div className="flex flex-wrap gap-2">
              {shareTargets.map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    px-3 py-1.5 rounded-full border border-white/15 
                    text-[11px] hover:bg-white/10 transition
                  "
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
