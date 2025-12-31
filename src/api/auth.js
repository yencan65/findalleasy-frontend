// src/api/auth.js
import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Backend base — prod-safe
const API = API_BASE || "";

/**
 * JSON güvenli okuma:
 * - CDN/404 HTML dönse bile app patlamasın
 * - status/ok bilgisi response objesine _http* olarak eklenir (debug için)
 */
async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      ok: false,
      error: "NON_JSON_RESPONSE",
      raw: text.slice(0, 500),
    };
  }

  // debug meta (UI kırmasın diye isimler underscore)
  if (data && typeof data === "object" && !Array.isArray(data)) {
    data._httpStatus = res.status;
    data._httpOk = res.ok;
  }
  return data;
}

async function postJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return readJsonSafe(res);
}

/**
 * Primary endpoint 404 / NOT_FOUND ise fallback dener.
 * ÖNEMLİ: Primary başarılıysa fallback çalışmaz (çift mail atmasın diye).
 */
async function postJsonWithFallback(primaryPath, fallbackPath, body) {
  const primary = await postJson(primaryPath, body);

  const looksNotFound =
    primary?._httpStatus === 404 ||
    primary?.error === "NOT_FOUND" ||
    primary?.error === "Not Found" ||
    primary?.error === "Cannot POST" ||
    primary?.error === "NON_JSON_RESPONSE"; // CDN 404 HTML vs.

  if (!looksNotFound) return primary;
  if (!fallbackPath) return primary;

  return postJson(fallbackPath, body);
}

export async function register(data) {
  const deviceId = getDeviceId();
  return postJson("/api/auth/register", { ...data, deviceId });
}

export async function loginReq(data) {
  return postJson("/api/auth/login", data);
}

// =========================
// Password reset flow
// =========================
export async function requestReset(email) {
  // Yeni: /forgot-password | Eski fallback: /request-reset
  return postJsonWithFallback(
    "/api/auth/forgot-password",
    "/api/auth/request-reset",
    { email }
  );
}

export async function resetPassword(email, code, newPassword) {
  // Yeni: /reset-password (genelde aynı kalır)
  return postJson("/api/auth/reset-password", { email, code, newPassword });
}

// =========================
// Activation flow
// =========================
export async function sendVerifyCode(email) {
  // Yeni: /resend-activation | Eski fallback: /send-code
  return postJsonWithFallback(
    "/api/auth/resend-activation",
    "/api/auth/send-code",
    { email }
  );
}

export async function verifyCode(email, code) {
  // Yeni: /activate | Eski fallback: /verify-code
  return postJsonWithFallback(
    "/api/auth/activate",
    "/api/auth/verify-code",
    { email, code }
  );
}

export async function getProfile(id) {
  const res = await fetch(`${API}/api/auth/profile/${id}`);
  return readJsonSafe(res);
}
