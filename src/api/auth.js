// src/api/auth.js
import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Backend base — prod-safe
const API = API_BASE || "";

// JSON güvenli okuma (404 HTML vs gelse bile patlamasın)
async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  try {
    const data = text ? JSON.parse(text) : {};
    if (data && typeof data === "object") {
      data._httpStatus = res.status;
      data._httpOk = res.ok;
    }
    return data;
  } catch {
    return { ok: false, error: "NON_JSON_RESPONSE", _httpStatus: res.status, raw: text.slice(0, 400) };
  }
}

async function postJson(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return readJsonSafe(res);
}

// Primary 404 ise fallback dener (deploy karmaşasında hayat kurtarır)
async function postJsonWithFallback(primaryPath, fallbackPath, body) {
  const r1 = await postJson(primaryPath, body);

  const notFoundLike =
    r1?._httpStatus === 404 ||
    r1?.error === "NOT_FOUND" ||
    r1?.error === "Not Found" ||
    r1?.error === "NON_JSON_RESPONSE";

  if (!notFoundLike) return r1;
  if (!fallbackPath) return r1;
  return postJson(fallbackPath, body);
}

export async function register(data) {
  const deviceId = getDeviceId();
  return postJson("/api/auth/register", { ...data, deviceId });
}

export async function loginReq(data) {
  return postJson("/api/auth/login", data);
}

// ✅ Password reset: DOĞRU endpoint
export async function requestReset(email) {
  // yeni: /forgot-password | eski fallback: /request-reset
  return postJsonWithFallback("/api/auth/forgot-password", "/api/auth/request-reset", { email });
}

export async function resetPassword(email, code, newPassword) {
  return postJson("/api/auth/reset-password", { email, code, newPassword });
}

// ✅ Activation: DOĞRU endpoint
export async function sendVerifyCode(email) {
  // yeni: /resend-activation | eski fallback: /send-code
  return postJsonWithFallback("/api/auth/resend-activation", "/api/auth/send-code", { email });
}

export async function verifyCode(email, code) {
  // yeni: /activate | eski fallback: /verify-code
  return postJsonWithFallback("/api/auth/activate", "/api/auth/verify-code", { email, code });
}

export async function getProfile(id) {
  const res = await fetch(`${API}/api/auth/profile/${id}`);
  return readJsonSafe(res);
}
