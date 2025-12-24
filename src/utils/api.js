// src/utils/api.js
// Simple API helper: single source of truth for backend URL + fetch wrappers.
// Conservative defaults; no breaking changes.

export const API_BASE =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "http://localhost:8080";

export function withTimeout(promise, ms = 15000) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function apiGet(path, { timeoutMs = 15000, headers = {}, signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await withTimeout(fetch(url, { method: "GET", headers, signal }), timeoutMs);
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

export async function apiPost(path, body, { timeoutMs = 20000, headers = {}, signal } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await withTimeout(fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
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
