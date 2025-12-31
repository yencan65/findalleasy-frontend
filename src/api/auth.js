// src/api/auth.js
import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Backend base — prod-safe (no localhost fallback)
const API = API_BASE || "";

// localStorage key helper (verify session)
function verifySessionKey(email) {
  return `fae_verify_sessionId:${String(email || "").trim().toLowerCase()}`;
}

async function safeJson(res) {
  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text || "{}");
  } catch {
    return { ok: false, error: "NON_JSON_RESPONSE", status: res.status, raw: text?.slice?.(0, 400) || "" };
  }
}

export async function register(data) {
  const deviceId = getDeviceId();

  // Backend expects: username, email, password, (optional) referral
  const payload = {
    username: data?.username || data?.name || "",
    email: data?.email || "",
    password: data?.password || "",
    referral: data?.referral || data?.referralCode || "",
    deviceId,
    // extra fields are tolerated
    ...data,
  };

  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return safeJson(res);
}

export async function loginReq(data) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data?.email || "",
      password: data?.password || "",
      ...data,
    }),
  });

  return safeJson(res);
}

// Backend: POST /api/auth/forgot-password  { email }
export async function requestReset(email) {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return safeJson(res);
}

// Backend: POST /api/auth/reset-password  { email, code, newPassword }
export async function resetPassword(email, code, newPassword) {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });

  return safeJson(res);
}

// Backend: POST /api/verify/send-code  { email }  -> returns sessionId
export async function sendVerifyCode(email) {
  const res = await fetch(`${API}/api/verify/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const out = await safeJson(res);
  if (out?.ok && out?.sessionId) {
    try {
      localStorage.setItem(verifySessionKey(email), String(out.sessionId));
    } catch {}
  }
  return out;
}

// Backend: POST /api/verify/verify-code { email, code, sessionId }
export async function verifyCode(email, code) {
  let sessionId = "";
  try {
    sessionId = localStorage.getItem(verifySessionKey(email)) || "";
  } catch {}

  const res = await fetch(`${API}/api/verify/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, sessionId }),
  });

  const out = await safeJson(res);
  if (out?.verified) {
    try {
      localStorage.removeItem(verifySessionKey(email));
    } catch {}
  }
  return out;
}

export async function getProfile(id) {
  const res = await fetch(`${API}/api/auth/profile/${id}`);
  return safeJson(res);
}
