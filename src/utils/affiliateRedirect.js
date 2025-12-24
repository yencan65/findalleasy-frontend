// ===============================================================
// FindAllEasy Frontend — Affiliate Redirect Helper (SAFE)
// ZERO-CRASH: No store imports, no hard dependencies.
//
// Contract (backend):
//   GET {VITE_BACKEND_URL}/api/aff/out/:provider?url=...&itemId=...&title=...&userId=...
// Backend will generate clickId, inject provider subId, store click, then 302.
// ===============================================================

function safeStr(v) {
  try {
    return String(v ?? "").trim();
  } catch {
    return "";
  }
}

function pickProviderKey(item) {
  return (
    item?.providerKey ||
    item?.raw?.providerKey ||
    item?.adapterSource ||
    item?.provider ||
    item?.source ||
    "unknown"
  );
}

function pickBestUrl(item) {
  return (
    item?.affiliateUrl ||
    item?.deeplink ||
    item?.finalUrl ||
    item?.originUrl ||
    item?.url ||
    null
  );
}

function readUserIdFromStorage() {
  try {
    // primary key used across your frontend
    const id = safeStr(localStorage.getItem("userId"));
    if (id) return id;

    // optional fallback: fae_user JSON (AuthContext)
    const raw = localStorage.getItem("fae_user");
    if (raw) {
      const u = JSON.parse(raw);
      return safeStr(u?._id || u?.id || "");
    }
  } catch {}
  return "";
}

/**
 * Build canonical affiliate OUT URL.
 * @param {object} item - search item
 * @param {string|null} userId - logged in user id (optional)
 * @param {object} extra - optional extra query fields
 */
export function buildAffiliateRedirectUrl(item, userId = null, extra = {}) {
  const url = pickBestUrl(item);
  if (!item || !url) return null;

  const backend = safeStr(import.meta?.env?.VITE_BACKEND_URL || "");
  const provider = safeStr(pickProviderKey(item));
  const uid = safeStr(userId || readUserIdFromStorage() || "");

  // Prefer canonical backend redirect path
  if (backend && provider && provider !== "unknown") {
    const params = new URLSearchParams();
    params.set("url", url);
    params.set("itemId", safeStr(item?.id || item?.productId || ""));
    if (item?.title) params.set("title", safeStr(item.title));
    if (uid) params.set("userId", uid);

    // Optional extras (safe)
    try {
      for (const [k, v] of Object.entries(extra || {})) {
        const kk = safeStr(k);
        const vv = safeStr(v);
        if (!kk || vv === "") continue;
        // don't allow overriding core fields
        if (["url", "itemId", "title", "userId"].includes(kk)) continue;
        params.set(kk, vv);
      }
    } catch {}

    return `${backend}/api/aff/out/${encodeURIComponent(provider)}?${params.toString()}`;
  }

  // Fallback: legacy redirect URL if backend is not configured
  const base = safeStr(import.meta?.env?.VITE_REDIRECT_URL || "");
  if (!base) return url;

  const token = safeStr(localStorage.getItem("fae_user_token") || "");
  const affId = safeStr(import.meta?.env?.VITE_FAE_AFFILIATE_ID || "FAE");
  const qp = new URLSearchParams();
  qp.set("aff_id", affId);
  qp.set("url", url);
  if (token) qp.set("token", token);
  if (uid) qp.set("userId", uid);

  return `${base}?${qp.toString()}`;
}
