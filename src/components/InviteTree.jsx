// src/components/InviteTree.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchInviteTree } from "../api/rewards";

export default function InviteTree({ onClose }) {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    setErr(null);

    fetchInviteTree(user.id)
      .then((res) => {
        if (!res?.ok) {
          setErr(res?.message || "Davet ağacı alınamadı");
          return;
        }
        setData(res);
      })
      .catch(() => setErr("Sunucu hatası"))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="p-4 text-white">
        Davet ağacını görmek için giriş yapmalısın.
      </div>
    );
  }

  return (
    <div className="p-4 text-white min-w-[320px] max-w-[420px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Davet Ağacı</h2>
        {onClose && (
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            Kapat
          </button>
        )}
      </div>

      {loading && <div>Yükleniyor...</div>}
      {err && <div className="text-red-400 mb-3">{err}</div>}

      {data && (
        <>
          <div className="text-sm opacity-85 mb-3">
            Sen: {data.username || data.email}
            {data.inviteCode && (
              <span className="block text-xs opacity-60 mt-1">
                Davet kodun: {data.inviteCode}
              </span>
            )}
          </div>

          <div className="border-t border-white/10 pt-3 text-sm max-h-64 overflow-auto">
            {(!data.referrals || data.referrals.length === 0) && (
              <div className="opacity-60 text-xs">
                Henüz kimseyi davet etmemişsin. İlk davetlerinle pasif gelir
                ağacını oluşturabilirsin.
              </div>
            )}

            {data.referrals?.map((f) => (
              <div
                key={f.id}
                className="py-2 border-b border-white/5 flex flex-col gap-1"
              >
                <div className="font-semibold">{f.username || f.email}</div>
                <div className="text-xs opacity-70">{f.email}</div>
                <div className="text-xs opacity-60">
                  Tahmini toplam harcama: ₺
                  {(Number(f.totalSpent) || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
