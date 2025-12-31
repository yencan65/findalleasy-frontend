// src/api/auth.js
// ============================================================================
// FAE FRONTEND AUTH API — aligns with backend routers:
// - /api/auth/*  (auth.js)
// - /api/verify/* (verify.js)
// ============================================================================

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || "").trim() ||
  "https://api.findalleasy.com";

async function postJson(path, body) {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body || {}),
  });

  let data = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }

  if (!r.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `HTTP ${r.status} ${r.statusText || ""}`.trim();
    throw new Error(msg);
  }
  return data;
}

// ✅ Register: /api/auth/register
export async function register({ username, email, password, referral }) {
  return postJson("/api/auth/register", { username, email, password, referral });
}

// ✅ Activate: /api/auth/activate
export async function activateAccount({ email, code }) {
  return postJson("/api/auth/activate", { email, code });
}

// ✅ Login: /api/auth/login
export async function login({ email, password }) {
  return postJson("/api/auth/login", { email, password });
}

// ✅ Resend activation: /api/auth/resend-activation
export async function resendActivation({ email }) {
  return postJson("/api/auth/resend-activation", { email });
}

// ✅ Forgot password: /api/auth/forgot-password
export async function forgotPassword({ email }) {
  return postJson("/api/auth/forgot-password", { email });
}

// ✅ Reset password: /api/auth/reset-password
export async function resetPassword({ email, code, newPassword }) {
  return postJson("/api/auth/reset-password", { email, code, newPassword });
}

// ✅ VERIFY ROUTER (email code flow) — /api/verify/*
export async function sendVerifyCode({ email }) {
  return postJson("/api/verify/send-code", { email });
}

export async function verifyCode({ email, code }) {
  return postJson("/api/verify/verify-code", { email, code });
}
