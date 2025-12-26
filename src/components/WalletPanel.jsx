// src/components/WalletPanel.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { Lock, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import InviteFriend from "./InviteFriend";
import OrderHistory from "./OrderHistory"; // 🆕 Siparişlerim sekmesi için

// =================================================================
// GLOBAL ANIMATION – ONLY ONCE
// =================================================================
(function injectAnimationOnce() {
  if (typeof document === "undefined") return;
  if (document.getElementById("fae-wallet-anim")) return;

  const style = document.createElement("style");
  style.id = "fae-wallet-anim";
  style.innerHTML = `
    @keyframes scale-in {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
    .animate-scale-in {
      animation: scale-in 0.25s ease-out;
    }
  `;
  document.head.appendChild(style);
})();

// =================================================================
// WALLET HISTORY (HAREKETLER) – Basit log bile olsa sekme dolu dursun
// =================================================================
function WalletHistory({ userId, backend, t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        // Backend tarafında /api/wallet/history yoksa 404 döner → try/catch ile yumuşatıyoruz
        const res = await fetch(
          `${backend}/api/wallet/history?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) {
          setErr(
            t("wallet.historyUnavailable", {
              defaultValue:
                "Hareket geçmişi henüz hazır değil veya sistemde kayıt bulunamadı.",
            })
          );
          setRows([]);
          setLoading(false);
          return;
        }

        const j = await res.json().catch(() => ({}));
        if (j.ok && Array.isArray(j.items)) {
          setRows(j.items);
        } else {
          setRows([]);
        }
      } catch (e) {
        setErr(
          t("wallet.historyError", {
            defaultValue:
              "Hareket geçmişi yüklenirken bir hata oluştu. Biraz sonra tekrar dene.",
          })
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId, backend, t]);

  if (!userId) {
    return (
      <div className="text-xs text-white/70">
        {t("wallet.mustLoginHistory", {
          defaultValue: "Hareketlerini görmek için giriş yapmalısın.",
        })}
      </div>
    );
  }

  return (
    <div className="text-xs text-white/80 space-y-2 mt-2">
      <h3 className="font-semibold text-sm mb-1">
        {t("wallet.historyTitle", { defaultValue: "Cüzdan Hareketleri" })}
      </h3>

      {loading && (
        <div className="text-white/60">
          {t("common.loading", { defaultValue: "Yükleniyor…" })}
        </div>
      )}

      {!loading && err && (
        <div className="text-red-300 bg-red-900/20 rounded-md px-2 py-1">
          {err}
        </div>
      )}

      {!loading && !err && rows.length === 0 && (
        <div className="text-white/60">
          {t("wallet.historyEmpty", {
            defaultValue: "Henüz kayıtlı bir cüzdan hareketin yok.",
          })}
        </div>
      )}

      {!loading && !err && rows.length > 0 && (
        <div className="space-y-1 max-h-56 overflow-auto pr-1">
          {rows.map((h) => (
            <div
              key={h._id || `${h.type}-${h.createdAt}`}
              className="border border-white/10 rounded-md px-2 py-1 flex flex-col gap-1 bg-black/40"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[11px]">
                  {h.typeLabel ||
                    t(`wallet.txType.${h.type}`, {
                      defaultValue: h.type || "işlem",
                    })}
                </span>
                <span
                  className={`text-[11px] ${
                    h.amount >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {h.amount >= 0 ? "+" : "-"}
                  ₺{Math.abs(Number(h.amount || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-white/60">
                <span>
                  {h.createdAt
                    ? new Date(h.createdAt).toLocaleString()
                    : t("wallet.txUnknownDate", { defaultValue: "Tarih yok" })}
                </span>
                {h.meta?.orderId && (
                  <span className="italic">
                    {t("wallet.txOrderRef", {
                      defaultValue: "Sipariş:",
                    })}{" "}
                    {h.meta.orderId}
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

export default function WalletPanel({ onClose }) {
  // Modal açıkken body scroll'u kilitle (arkadaki sayfa kaymasın, scrollbar görünmesin).
  // Not: Component sadece açıkken render ediliyor → cleanup otomatik.
  useEffect(() => {
    try {
      const body = document.body;
      const prevOverflow = body.style.overflow;
      const prevPaddingRight = body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

      return () => {
        body.style.overflow = prevOverflow;
        body.style.paddingRight = prevPaddingRight;
      };
    } catch {
      return undefined;
    }
  }, []);

  const { t } = useTranslation();
  const { user } = useAuth();

  const [locked, setLocked] = useState(true);
  const [rewards, setRewards] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeemMsg, setRedeemMsg] = useState("");
  const [err, setErr] = useState(null);

  const [shareUrl, setShareUrl] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false); // ileride InviteFriend için hazır

  const [activeTab, setActiveTab] = useState("wallet"); // 🆕 Cüzdan | Hareketler | Siparişler

  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

  // =================================================================
  // DATA LOAD
  // =================================================================
  const load = useCallback(async () => {
    setErr(null);
    setRedeemMsg("");
    setLoading(true);

    if (!user || !user.id) {
      setErr(
        t("wallet.needLogin", {
          defaultValue: "Cüzdanı görmek için lütfen giriş yap.",
        })
      );
      setLoading(false);
      return;
    }

    try {
      const [statRes, rewRes, badgeRes] = await Promise.allSettled([
        fetch(`${backend}/api/orders/stats?userId=${user.id}`),
        fetch(`${backend}/api/rewards?userId=${user.id}`),
        fetch(`${backend}/api/badges?userId=${user.id}`),
      ]);

      // orders/stats
      if (statRes.status === "fulfilled") {
        try {
          const sj = await statRes.value.json();
          if (sj && sj.ok) setLocked(!(sj.completedCount > 0));
        } catch {
          // sessiz geç
        }
      }

      // rewards
      if (rewRes.status === "fulfilled") {
        try {
          const rj = await rewRes.value.json();
          const val = Number(rj.rewards || 0);
          setRewards(Number.isFinite(val) ? val : 0);
        } catch {
          setRewards(0);
        }
      } else {
        setRewards(0);
      }

      // badges
      if (badgeRes.status === "fulfilled") {
        try {
          const bj = await badgeRes.value.json();
          setBadges(Array.isArray(bj.badges) ? bj.badges : []);
        } catch {
          setBadges([]);
        }
      } else {
        setBadges([]);
      }
    } catch {
      setErr(
        t("wallet.errorGeneric", {
          defaultValue: "Cüzdan bilgileri yüklenirken bir hata oluştu.",
        })
      );
    }

    setLoading(false);
  }, [backend, user, t]);

  useEffect(() => {
    load();
  }, [load]);

  // =================================================================
  // INVITE LINK
  // =================================================================
  async function createInvite() {
    setRedeemMsg("");
    setErr(null);

    if (!user || !user.id) {
      setRedeemMsg(
        t("wallet.mustLoginInvite", {
          defaultValue: "Davet oluşturmak için giriş yapmalısın.",
        })
      );
      return;
    }

    try {
      const r = await fetch(`${backend}/api/referral/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.code) {
        setRedeemMsg(
          j.error ||
            t("wallet.inviteError", {
              defaultValue: "Davet oluşturulamadı.",
            })
        );
        return;
      }

      let origin = "https://findalleasy.com";
      try {
        origin = window?.location?.origin || origin;
      } catch {
        // SSR vb. durumlarda fallback
      }

      const url = `${origin}?ref=${j.code}`;

      try {
        await navigator.clipboard.writeText(url);
        setRedeemMsg(
          `${t("wallet.inviteCopied", {
            defaultValue: "Davet linkin kopyalandı:",
          })} ${url}`
        );
      } catch {
        setRedeemMsg(
          `${t("wallet.inviteReady", {
            defaultValue: "Davet linkin hazır:",
          })} ${url}`
        );
      }

      setShareUrl(url);
      setShowShare(true);
    } catch (e) {
      setRedeemMsg(
        e?.message ||
          t("wallet.inviteError", {
            defaultValue: "Davet oluşturulamadı.",
          })
      );
    }
  }

  // =================================================================
  // COUPON CREATION
  // =================================================================
  async function createCoupon() {
    setRedeemMsg("");
    setErr(null);

    if (!user || !user.id) {
      setRedeemMsg(
        t("wallet.mustLoginCoupon", {
          defaultValue: "Kupon oluşturmak için giriş yapmalısın.",
        })
      );
      return;
    }

    if (!rewards || rewards <= 0) {
      setRedeemMsg(
        t("wallet.noRewardsForCoupon", {
          defaultValue: "Kupon oluşturmak için yeterli ödül yok.",
        })
      );
      return;
    }

    const amtStr = prompt(
      `${t("wallet.couponAmount", {
        defaultValue: "Kupon tutarını gir",
      })} ₺`,
      "50"
    );

    const amount = Number(amtStr || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;

    if (amount > rewards) {
      setRedeemMsg(
        t("wallet.couponTooHigh", {
          defaultValue: "Kupon tutarı bakiyeden yüksek olamaz.",
        })
      );
      return;
    }

    try {
      const r = await fetch(`${backend}/api/coupons/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || !j.code) {
        setRedeemMsg(
          j.error ||
            t("wallet.couponError", {
              defaultValue: "Kupon oluşturulamadı.",
            })
        );
        return;
      }

      setRedeemMsg(
        `${t("wallet.couponCreated", {
          defaultValue: "Kupon oluşturuldu:",
        })} ${j.code} (${t("wallet.expires", {
          defaultValue: "Son kullanma",
        })} ${new Date(j.expiresAt).toLocaleDateString()})`
      );

      load();
    } catch (e) {
      setRedeemMsg(
        e?.message ||
          t("wallet.couponError", {
            defaultValue: "Kupon oluşturulurken hata oluştu.",
          })
      );
    }
  }

  // =================================================================
  // DISCOUNT APPLY
  // =================================================================
  async function handleRedeem() {
    setRedeemMsg("");
    setErr(null);

    if (!user || !user.id) {
      setRedeemMsg(
        t("wallet.mustLoginRedeem", {
          defaultValue: "İndirim kullanmak için giriş yapmalısın.",
        })
      );
      return;
    }

    if (locked) {
      setRedeemMsg(
        t("wallet.lockedText", {
          defaultValue:
            "İlk alışveriş tamamlanmadan indirim kullanamazsın.",
        })
      );
      return;
    }

    const amt = Math.floor((rewards || 0) * 100) / 100;
    if (amt <= 0) {
      setRedeemMsg(
        t("wallet.noBalance", {
          defaultValue: "Kullanılabilir ödül bakiyen yok.",
        })
      );
      return;
    }

    try {
      const r = await fetch(`${backend}/api/rewards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: amt }),
      });

      const j = await r.json().catch(() => ({}));

      if (j.ok) {
        setRedeemMsg(
          `✔ ${amt}₺ ${t("wallet.discountApplied", {
            defaultValue: "indirim olarak uygulandı.",
          })}`
        );
        load();
      } else {
        setRedeemMsg(
          j.error ||
            t("wallet.redeemError", {
              defaultValue: "İndirim uygulanamadı.",
            })
        );
      }
    } catch (e) {
      setRedeemMsg(
        e?.message ||
          t("wallet.redeemError", {
            defaultValue: "İndirim uygulanırken hata oluştu.",
          })
      );
    }
  }

  // =================================================================
  // OVERLAY CLICK – SİYAH EKRAN BUGFIX
  // =================================================================
  function handleOverlayClick(e) {
    // Sadece arka plana tıklayınca kapansın, içerdeki karta tıklayınca kapanmasın
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }

  // =================================================================
  // UI
  // =================================================================
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-start justify-center p-3 sm:p-6 allow-scroll"
      onClick={handleOverlayClick}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative animate-scale-in mt-12 sm:mt-16
          bg-[#0b0b0b]/85
          border border-[#d4af37]/40
          rounded-2xl p-6 max-h-[92dvh] allow-scroll
          w-full
          max-w-[420px]
          sm:max-w-[380px]
          shadow-[0_0_25px_rgba(212,175,55,0.35)]
          backdrop-blur-2xl
        "
      >
        {/* TITLE + INFO */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <h2 className="text-lg text-[#d4af37] font-bold">
            {t("wallet.title", { defaultValue: "Cüzdanın" })}
          </h2>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            className="w-6 h-6 rounded-full border border-white/40 text-[11px] text-white/80 flex items-center justify-center bg-black/30 hover:bg-white/10"
            aria-label={t("wallet.infoAria", {
              defaultValue: "Cüzdan hakkında bilgi",
            })}
          >
            i
          </button>
        </div>

        {/* INFO BOX */}
        {showInfo && (
          <div className="mb-3 text-[11.2px] text-white/75 bg-black/40 border border-white/10 rounded-xl px-3 py-2 space-y-1">
            <div className="font-semibold text-[#ffd700]">
              {t("wallet.infoTitle", {
                defaultValue: "Bu cüzdan nasıl çalışır?",
              })}
            </div>
            <p>
              {t("wallet.infoWallet", {
                defaultValue:
                  "Bu cüzdan, FindAllEasy üzerinden yaptığın alışverişlerden ve davet ödüllerinden biriken cashback (ödül bakiyesi) tutarını gösterir. Bu bakiye gerçek para transferi değildir ve IBAN'a çekilemez.",
              })}
            </p>
            <p>
              {t("wallet.infoCoupon", {
                defaultValue:
                  "İstersen bu bakiyenin bir kısmını kupona dönüştürebilirsin. Kupon, uygun bir alışverişe uyguladığında, sipariş tamamlandıktan sonra tutarın cashback olarak tekrar cüzdanına eklenmesini sağlar.",
              })}
            </p>
            <p>
              {t("wallet.infoDiscount", {
                defaultValue:
                  "Kupon, satıcıdaki ürün fiyatını düşürmez; indirim FindAllEasy tarafından sana ödül olarak yansıtılır. Tüm süreç şeffaf ve platform içi ödül mantığına dayanır.",
              })}
            </p>
            <p>
              {t("wallet.infoReferral", {
                defaultValue:
                  "Arkadaşlarını davet ettiğinde, onların ilk ve sonraki alışverişlerinden de belirli oranlarda ödül kazanırsın. Böylece hem onlar kazanır, hem senin cüzdanın büyür.",
              })}
            </p>
          </div>
        )}

        {/* PREMIUM WALLET MOTTO */}
        <div
          className="text-[13px] text-white/75 leading-snug mb-3 italic px-1"
          dangerouslySetInnerHTML={{
            __html: t("wallet.motto", {
              defaultValue:
                "<span style='color:#FFD700;'>Davet et →</span> onlar alışveriş yapsın <span style='color:#FFD700;'>→ sen kazan.</span> Kazancını kupona dönüştür, her alışverişte anında indirime çevir.",
            }),
          }}
        />

        {/* TABS: Cüzdan | Hareketler | Siparişler */}
        <div className="flex mb-3 rounded-full bg-black/40 border border-[#d4af37]/40 p-1 text-[11px]">
  {[
    {
      id: "wallet",
      label: t("wallet.walletTabs.wallet", { defaultValue: "Cüzdan" }),
    },
    {
      id: "history",
      label: t("wallet.walletTabs.actions", { defaultValue: "Hareketler" }),
    },
    {
      id: "orders",
      label: t("wallet.walletTabs.orders", { defaultValue: "Siparişler" }),
    },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 py-1 rounded-full mx-[2px] transition-all ${
        activeTab === tab.id
          ? "bg-[#d4af37] text-black font-semibold shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          : "text-white/70 hover:bg-white/5"
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

        {loading ? (
          <div className="text-[#d4af37]">
            {t("common.loading", { defaultValue: "Yükleniyor..." })}
          </div>
        ) : (
          <>
            {/* ======================= TAB: CÜZDAN ======================= */}
            {activeTab === "wallet" && (
              <>
                {/* BALANCE */}
                <div className="text-white text-2xl font-bold mb-4">
                  💎 {Number(rewards || 0).toFixed(2)} ₺
                </div>

                {/* LOCK STATE */}
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                    {locked ? <Lock size={18} /> : <Unlock size={18} />}
                    <span className="text-white/70">
                      {locked
                        ? t("wallet.locked", {
                            defaultValue:
                              "Cüzdan kilitli – ilk alışveriş gerekli.",
                          })
                        : t("wallet.unlockedText", {
                            defaultValue:
                              "Cüzdan aktif – ödül durumunu görüntüleyebilirsin.",
                          })}
                    </span>
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={locked || rewards <= 0}
                    className={`px-3 py-1 rounded-md border text-xs sm:text-sm ${
                      locked || rewards <= 0
                        ? "border-white/20 text-white/30 cursor-not-allowed"
                        : "border-[#d4af37] bg-[#d4af37] text-black hover:opacity-90"
                    }`}
                  >
                    {t("wallet.useDiscount", {
                      defaultValue: "İndirimi Kullan",
                    })}
                  </button>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={createInvite}
                    className="flex-1 py-2 rounded-xl border border-[#d4af37]/60 text-[#d4af37] hover:bg-[#d4af37]/15 text-xs transition"
                  >
                    {t("wallet.invite", { defaultValue: "Davet Et" })}
                  </button>

                  <button
                    onClick={createCoupon}
                    className="flex-1 py-2 rounded-xl border border-emerald-400/50 text-emerald-300 hover:bg-emerald-300/20 text-xs transition"
                  >
                    {t("wallet.createCoupon", {
                      defaultValue: "Kupon (Yakında)",
                    })}
                  </button>
                </div>

                {/* SHARE BLOCK */}
                {showShare && shareUrl && (
                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-[#d4af37]/40 text-xs space-y-2">
                    <div className="font-semibold text-[#d4af37]">
                      {t("wallet.shareWithFriends", {
                        defaultValue: "Linki Paylaş",
                      })}
                    </div>

                    <div className="break-all text-white/70 text-[11px]">
                      {shareUrl}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          shareUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg border border-green-400/60 text-[11px]"
                      >
                        WhatsApp
                      </a>

                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(
                          shareUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg border border-sky-400/60 text-[11px]"
                      >
                        Telegram
                      </a>

                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                          shareUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg border border-sky-500/60 text-[11px]"
                      >
                        X (Twitter)
                      </a>

                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          shareUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg border border-blue-500/60 text-[11px]"
                      >
                        Facebook
                      </a>

                      <a
                        href={`https://www.instagram.com/?url=${encodeURIComponent(
                          shareUrl
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded-lg border border-pink-400/60 text-[11px]"
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                )}

                {/* HATA / BİLGİ */}
                {err && !redeemMsg && (
                  <div className="mt-3 text-xs text-red-300 bg-red-900/20 p-2 rounded-lg">
                    {err}
                  </div>
                )}

                {redeemMsg && (
                  <div className="mt-3 text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded-lg">
                    {redeemMsg}
                  </div>
                )}

                {/* BADGES */}
                <div className="mt-4 text-white/80 text-sm mb-1">
                  {t("wallet.myBadges", { defaultValue: "Rozetlerin" })}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {badges.length === 0 ? (
                    <div className="text-white/50 text-xs">
                      {t("wallet.noBadges", {
                        defaultValue: "Henüz rozetin yok.",
                      })}
                    </div>
                  ) : (
                    badges.map((b, i) => (
                      <div
                        key={i}
                        className="px-2 py-1 text-xs text-[#d4af37] rounded-full border border-[#d4af37]/40"
                      >
                        {b.name}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* ======================= TAB: HAREKETLER ======================= */}
            {activeTab === "history" && (
              <WalletHistory userId={user?.id} backend={backend} t={t} />
            )}

            {/* ======================= TAB: SİPARİŞLER ======================= */}
            {activeTab === "orders" && <OrderHistory />}
          </>
        )}

        {/* CLOSE – Her sekmede ortak */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-[#d4af37] text-black rounded-xl py-2 font-semibold hover:opacity-90"
        >
          {t("actions.close", { defaultValue: "Kapat" })}
        </button>
      </div>
    </div>
  );
}
