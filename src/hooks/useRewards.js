import React from "react";
import { API_BASE } from "../utils/api";

/**
 * useRewards – check user rewards on mount and notify Sono AI
 * Additive: import and call in App.jsx without breaking layout
 *
 * Usage:
 *   const useRewards = createUseRewards(import.meta.env.VITE_BACKEND_URL);
 *   useRewards();
 */
export function createUseRewards(BACKEND_URL) {
  const BASE = (BACKEND_URL && String(BACKEND_URL).trim()) || (API_BASE || "");
  return function useRewards() {
    React.useEffect(() => {
      async function run() {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          const r = await fetch(`${BASE}/api/rewards?userId=${userId}
`);
          const j = await r.json();
          if (j?.nearExpiry && j.message) {
            window.dispatchEvent(new CustomEvent("sono:notify", { detail: j.message }));
          }
        } catch {}
      }
      run();
    }, []);
  };
}
