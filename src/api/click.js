import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// src/api/click.js
// Click tracking — safe, additive, reviewer-friendly.
// ZERO-CRASH: never throw; return {ok:false} on failures.

const API = API_BASE || "";

function getToken() {
  try {
    return (
      localStorage.getItem("fae_user_token") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

function pickItemId(item) {
  return (
    item?.id ||
    item?.itemId ||
    item?.productId ||
    item?._id ||
    ""
  );
}

function pickProvider(item) {
  return (
    item?.providerKey ||
    item?.provider_key ||
    item?.provider ||
    item?.providerFamily ||
    "unknown"
  );
}

function pickUrl(item) {
  return item?.finalUrl || item?.originUrl || item?.url || "";
}

export async function sendClick({ item, source = "vitrin", user = null, extra = {} } = {}) {
  try {
    const deviceId = getDeviceId?.() || "";
    const token = getToken();

    const payload = {
      source,
      userId: user || undefined,
      deviceId,
      itemId: pickItemId(item),
      providerKey: pickProvider(item),
      url: pickUrl(item),
      title: item?.title || item?.name || undefined,
      price: item?.finalPrice ?? item?.optimizedPrice ?? item?.price ?? undefined,
      currency: item?.currency || undefined,
      ...((extra && typeof extra === "object") ? extra : {}),
    };

    const res = await fetch(`${API}/api/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const j = await res.json().catch(() => ({}));
    return j && typeof j === "object" ? j : { ok: res.ok };
  } catch (e) {
    console.warn("sendClick error:", e);
    return { ok: false };
  }
}
