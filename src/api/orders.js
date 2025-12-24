// src/api/orders.js
const API =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export async function getUserOrders(userId) {
  if (!userId) return { ok: false, orders: [] };

  try {
    const res = await fetch(`${API}/api/orders/user/${userId}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, orders: [] };
    return json;
  } catch (e) {
    console.warn("getUserOrders error:", e);
    return { ok: false, orders: [] };
  }
}
