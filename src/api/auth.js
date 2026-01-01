// src/api/auth.js
// ============================================================================
//  AUTH API CLIENT — S3 (BACKEND-ALIGNED + FALLBACK SAFE)
//  - Primary auth endpoints live under /api/auth (register/login/activate/...)
//  - Verification-code endpoints live under /api/verify (send-code/verify-code)
//  - Backward compatible fallbacks kept to avoid breaking older deployments.
// ============================================================================

const API_BASE = (import.meta.env.VITE_API_URL || "https://api.findalleasy.com").replace(/\/$/, "");

async function safeJson(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const data = await safeJson(r);

  if (!r.ok) {
    const err = new Error((data && (data.error || data.message)) || `HTTP ${r.status}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function postJsonTry(paths, body) {
  let lastErr = null;

  for (const p of paths) {
    try {
      return await postJson(p, body);
    } catch (e) {
      lastErr = e;

      // If endpoint doesn't exist, try next.
      // (Render/CF caches sometimes return 404/405 for missing routes.)
      if (e && (e.status === 404 || e.status === 405)) continue;

      // Other errors (401/429/500) are real; don't hide them.
      throw e;
    }
  }

  throw lastErr || new Error("Request failed");
}

// ---------------------------------------------------------------------------
// VERIFY (code) — primary: /api/verify/*  fallback: /api/auth/*
// ---------------------------------------------------------------------------
export async function sendVerifyCode(email) {
  return postJsonTry(
    ["/api/verify/send-code", "/api/auth/send-code"],
    { email }
  );
}

export async function verifyCode(email, code) {
  return postJsonTry(
    ["/api/verify/verify-code", "/api/auth/verify-code"],
    { email, code }
  );
}

// ---------------------------------------------------------------------------
// AUTH — primary: /api/auth/*  fallback: legacy routes if present
// ---------------------------------------------------------------------------
export async function register(username, email, password, referral) {
  // Backend expects { username, email, password, referral }
  return postJsonTry(
    ["/api/auth/register", "/api/auth/custom-signup"],
    { username, email, password, referral }
  );
}

export async function loginReq(email, password) {
  return postJson("/api/auth/login", { email, password });
}

export async function activate(email, code) {
  return postJson("/api/auth/activate", { email, code });
}

export async function requestReset(email) {
  // Current backend: /api/auth/forgot-password
  return postJsonTry(
    ["/api/auth/forgot-password", "/api/auth/request-reset"],
    { email }
  );
}

export async function resetPassword(email, code, newPassword) {
  // Current backend expects: { email, code, newPassword }
  return postJson("/api/auth/reset-password", { email, code, newPassword });
}

// Profile by id (public-ish) — matches backend /api/auth/profile/:id
export async function getProfile(userId) {
  const r = await fetch(`${API_BASE}/api/auth/profile/${encodeURIComponent(userId)}`);
  const data = await safeJson(r);

  if (!r.ok) {
    const err = new Error((data && (data.error || data.message)) || `HTTP ${r.status}`);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}
