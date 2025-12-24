// src/components/WalletHistory.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getWalletHistory } from "../api/wallet";

export default function WalletHistory() {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    async function load() {
      setLoading(true);
      const res = await getWalletHistory(user.id);

      if (res.ok && Array.isArray(res.list)) {
        setRows(res.list);
      } else {
        setRows([]);
      }
      setLoading(false);
    }

    load();
  }, [isLoggedIn, user?.id]);

  if (!isLoggedIn) {
    return (
      <div className="text-xs text-white/70">
        {t("wallet.mustLoginHistory", {
          defaultValue: "Cüzdan hareketlerini görmek için giriş yapmalısın.",
        })}
      </div>
    );
  }

  return (
    <div className="text-xs text-white/80 space-y-2">
      <h3 className="font-semibold text-sm mb-2">
        {t("wallet.historyTitle", { defaultValue: "Cüzdan Hareketleri" })}
      </h3>

      {/* Loading */}
      {loading && (
        <div className="text-white/60">
          {t("common.loading", { defaultValue: "Yükleniyor…" })}
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div className="text-white/60">
          {t("wallet.historyEmpty", {
            defaultValue: "Henüz kayıtlı bir cüzdan hareketin yok.",
          })}
        </div>
      )}

      {/* List */}
      {!loading && rows.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-auto pr-1">
          {rows.map((r) => (
            <div
              key={r._id}
              className="border border-white/10 rounded-md px-2 py-1 flex flex-col gap-1 bg-black/40"
            >
              {/* Type + Amount */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono">
                  {t(`wallet.txType.${r.type}`, {
                    defaultValue: r.type || "işlem",
                  })}
                </span>

                <span
                  className={
                    "text-[11px] font-semibold " +
                    (r.amount >= 0 ? "text-emerald-300" : "text-red-300")
                  }
                >
                  {r.amount >= 0 ? "+" : ""}
                  ₺{Math.abs(Number(r.amount || 0)).toFixed(2)}
                </span>
              </div>

              {/* Date + Order Link */}
              <div className="flex justify-between items-center text-[10px] text-white/60">
                <span>
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : t("wallet.txUnknownDate", { defaultValue: "Tarih yok" })}
                </span>

                {/* Order Ref (DOĞRU YER) */}
                {r.relatedOrderId && (
                  <span className="text-[10px] text-zinc-400">
                    {t("wallet.relatedOrder", {
                      defaultValue: "Sipariş:",
                    })}{" "}
                    <span className="font-mono">{r.relatedOrderId}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
