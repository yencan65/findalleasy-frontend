// src/api/auth.js
// ============================================================================
// AUTH API — aligned with backend routes
//
// Backend:
//   /api/auth/register
//   /api/auth/login
//   /api/auth/forgot-password
//   /api/auth/reset-password
//   /api/auth/profile/:id
//   /api/verify/send-code
//   /api/verify/verify-code
// ============================================================================

import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Backend base — prod-safe
const API = String(API_BASE || "").replace(/\/+$/, "");

async function readJson(res) {
  // Some proxies return HTML on errors; keep it safe.
  const ct = String(res?.headers?.get?.("content-type") || "");
  if (ct.includes("application/json") || ct.includes("+json")) {
    return res.json();
  }
  const text = await res.text().catch(() => "");
  return { ok: false, error: "NON_JSON_RESPONSE", status: res.status, body: text.slice(0, 500) };
}

export async function register(data) {
  const deviceId = getDeviceId();

  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, deviceId }),
  });

  return readJson(res);
}

export async function loginReq(data) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return readJson(res);
}

// Password reset flow (backend uses /forgot-password)
export async function requestReset(email) {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return readJson(res);
}

export async function resetPassword(email, code, newPassword) {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });
  return readJson(res);
}

// Email verification code flow (backend requires sessionId)
export async function sendVerifyCode(email) {
  const sessionId = getDeviceId();
  const res = await fetch(`${API}/api/verify/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, sessionId }),
  });
  return readJson(res);
}

export async function verifyCode(email, code) {
  const sessionId = getDeviceId();
  const res = await fetch(`${API}/api/verify/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, sessionId }),
  });
  return readJson(res);
}

export async function getProfile(id) {
  const res = await fetch(`${API}/api/auth/profile/${id}`);
  return readJson(res);
}
