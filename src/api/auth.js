// src/api/auth.js
import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Prod-safe API base:
// - Prefer VITE_API_BASE (API_BASE)
// - If missing in production, fall back to https://api.findalleasy.com
const API =
  API_BASE ||
  (import.meta?.env?.PROD ? "https://api.findalleasy.com" : "");

// Small helper: always returns JSON-ish object
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";

  let data = null;
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    data = { ok: false, error: text || `HTTP_${res.status}`, status: res.status };
  }

  // normalize
  if (!res.ok && data && typeof data === "object" && data.ok !== true) {
    data.ok = false;
    if (!data.error) data.error = `HTTP_${res.status}`;
  }
  return data ?? { ok: res.ok, status: res.status };
}

function post(path, body) {
  return fetchJson(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

export async function register(data) {
  const deviceId = getDeviceId();
  return post("/api/auth/register", { ...(data || {}), deviceId });
}

export async function loginReq(data) {
  return post("/api/auth/login", data || {});
}

// Password reset flow (backend: forgot-password -> reset-password)
export async function requestReset(email) {
  return post("/api/auth/forgot-password", { email });
}

export async function resetPassword(email, code, newPassword) {
  return post("/api/auth/reset-password", { email, code, newPassword });
}

// Email verification flow (backend: resend-activation -> activate)
export async function sendVerifyCode(email) {
  return post("/api/auth/resend-activation", { email });
}

export async function verifyCode(email, code) {
  return post("/api/auth/activate", { email, code });
}

export async function getProfile(id) {
  return fetchJson(`${API}/api/auth/profile/${id}`, { method: "GET" });
}
