import { API_BASE } from "../utils/api";
// src/api/orders.js
const API = API_BASE || "";

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
