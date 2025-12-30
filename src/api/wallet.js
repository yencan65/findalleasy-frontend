import { API_BASE } from "../utils/api";
// src/api/wallet.js
const API = API_BASE || "";

export async function getWalletHistory(userId) {
  try {
    const r = await fetch(
      `${API}/api/wallet/history?userId=${userId}`
    );
    const j = await r.json();
    return {
      ok: j.ok,
      list: j.items || []
    };
  } catch {
    return { ok: false, list: [] };
  }
}

