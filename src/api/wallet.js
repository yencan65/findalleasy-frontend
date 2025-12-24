// src/api/wallet.js
const API =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

export async function getWalletHistory(userId) {
  try {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/wallet/history?userId=${userId}`
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

