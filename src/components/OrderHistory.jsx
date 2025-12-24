// src/components/OrderHistory.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { getUserOrders } from "../api/orders";

export default function OrderHistory() {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    async function load() {
      setLoading(true);
      const res = await getUserOrders(user.id);
      if (res.ok && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
      setLoading(false);
    }

    load();
  }, [isLoggedIn, user?.id]);

  if (!isLoggedIn) {
    return (
      <div className="text-xs text-white/70">
        {t("orders.mustLogin", {
          defaultValue: "Siparişlerini görmek için giriş yapmalısın.",
        })}
      </div>
    );
  }

  return (
    <div className="text-xs text-white/80 space-y-2">
      <h3 className="font-semibold text-sm mb-2">
        {t("orders.title", { defaultValue: "Siparişlerim" })}
      </h3>

      {loading && (
        <div className="text-white/60">
          {t("common.loading", { defaultValue: "Yükleniyor…" })}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="text-white/60">
          {t("orders.empty", {
            defaultValue:
              "Henüz sistem üzerinden takip edilen bir siparişin yok.",
          })}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-auto pr-1">
          {orders.map((o) => (
            <div
              key={o._id}
              className="border border-white/10 rounded-md px-2 py-1 flex flex-col gap-1 bg-black/40"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[11px]">
                  {o.provider || "Platform"}
                </span>
                <span className="text-[11px] text-[#f5d76e]">
                  ₺{o.amount?.toFixed ? o.amount.toFixed(2) : o.amount}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/60">
                <span>{new Date(o.createdAt).toLocaleString()}</span>
                <span>
                  {t(`orders.status.${o.status}`, {
                    defaultValue: o.status || "bilinmiyor",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
