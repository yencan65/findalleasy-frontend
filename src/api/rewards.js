import { API_BASE } from "../utils/api";
// src/api/rewards.js

// BE backend base URL
const API = API_BASE || "";

// ---------------------------------------------
//  Kullanıcı cüzdan + ödül özeti (ESKİ KOD)
// ---------------------------------------------
export async function fetchWalletAndRewards(userId) {
  const res = await fetch(`${API}/api/rewards/${userId}`);
  return res.json();
}

// ---------------------------------------------
//  Kullanıcı davet ağacı (ESKİ KOD)
// ---------------------------------------------
export async function fetchInviteTree(userId) {
  const res = await fetch(`${API}/api/rewards/tree/${userId}`);
  return res.json();
}

// ---------------------------------------------
//  S9 — CLICK REVENUE KAYDI  (YENİ EKLENDİ)
//  reserve() fonksiyonu çağırıyor
// ---------------------------------------------
export async function recordClickRevenue({ provider, url, price }) {
  try {
    const res = await fetch(`${API}/api/revenue/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, url, price }),
    });
    return res.json();
  } catch (err) {
    console.warn("recordClickRevenue API error:", err);
    return { ok: false };
  }
}

// ---------------------------------------------
//  S9 — ORDER REVENUE / CONVERSION KAYDI (OPSİYONEL)
//  Eğer ileride satın alma dönüşümü ekleyecek olursak burada kullanırız
// ---------------------------------------------
export async function recordConversionRevenue({
  provider,
  amount,
  commissionRate,
  userId,
  orderId,
}) {
  try {
    const res = await fetch(`${API}/api/revenue/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        amount,
        commissionRate,
        userId,
        orderId,
      }),
    });
    return res.json();
  } catch (err) {
    console.warn("recordConversionRevenue API error:", err);
    return { ok: false };
  }
}
// ======================================================
//  S9 — FULL INTELLIGENCE RESERVE()
//  (affiliate + click + revenueMemory + event dispatch)
// ======================================================

export async function reserve(item, source = "unknown") {
  try {
    if (!item || !item.url) return;

    // 1) Affiliate redirect önce
    let finalUrl = null;
    try {
      const maybeUrl = handleAffiliateRedirect(item, source);
      if (typeof maybeUrl === "string" && maybeUrl.length > 5) {
        finalUrl = maybeUrl;
      } else {
        finalUrl = item.url;
      }
    } catch (e) {
      console.warn("reserve → handleAffiliateRedirect hata:", e);
      finalUrl = item.url;
    }

    // 2) Eski sendClick (login ise)
    if (isLoggedIn) {
      try {
        await sendClick({
          userId: user.id,
          productId: item.id || item.productId || null,
          provider: item.provider,
          price:
            item.optimizedPrice ||
            item.finalPrice ||
            item.price ||
            0,
          source,
        });
      } catch (e) {
        console.warn("reserve → sendClick hata:", e);
      }
    }

    // 3) NEW: S9 Revenue Memory API
    try {
      await recordClickRevenue({
        provider: item.provider,
        url: finalUrl,
        price:
          item.optimizedPrice ||
          item.finalPrice ||
          item.price ||
          0,
      });
    } catch (e) {
      console.warn("recordClickRevenue API hata:", e);
    }

    // 4) Event dispatch (orijinal kod)
    try {
      window.dispatchEvent(
        new CustomEvent("fie:click", {
          detail: {
            provider: item.provider,
            price: item.price,
            source,
            query: localStorage.getItem("lastQuery") || "",
          },
        })
      );
    } catch (e) {
      console.warn("reserve → dispatch hata:", e);
    }

    // 5) Tek tab aç
    window.open(finalUrl, "_blank", "noopener");
  } catch (e) {
    console.error("reserve hata:", e);
  }
}
