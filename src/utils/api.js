// src/utils/api.js
// Simple API helper: single source of truth for backend URL + fetch wrappers.
// Conservative defaults; no breaking changes.

function resolveApiBase() {
  // 1) Explicit env override (preferred)
  const env =
    (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
    (import.meta?.env?.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
    "";
  if (env) return env.replace(/\/$/, "");

  // 2) Browser hostname heuristic (safe + reviewer-friendly)
  try {
    if (typeof window !== "undefined" && window.location) {
      const h = String(window.location.hostname || "").toLowerCase();

      // Local dev
      if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8080";

      // Production: main site (and any subdomain) -> API subdomain
      if (h === "findalleasy.com" || h === "www.findalleasy.com" || h.endsWith(".findalleasy.com")) {
        return "https://api.findalleasy.com";
      }

      // ✅ IMPORTANT:
      // Many preview/staging hosts (render/vercel/netlify/cloudflare pages) are NOT the API.
      // If VITE_BACKEND_URL is not set, default to the real API to avoid silent same-origin 404s.
      return "https://api.findalleasy.com";
    }
  } catch {}

  return "";
}

export const API_BASE = resolveApiBase();

export function getApiBase() {
  return API_BASE;
}

export function withTimeout(promise, ms = 15000) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function apiJson(path, { method = "GET", headers = {}, body, timeoutMs = 15000 } = {}) {
  const base = API_BASE || "";
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const h = { "Content-Type": "application/json", ...headers };

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const signal = controller?.signal;

  const res = await withTimeout(fetch(url, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body ?? {}),
    signal
  }), timeoutMs);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
