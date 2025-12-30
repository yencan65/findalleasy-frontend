// src/api/auth.js
import { API_BASE } from "../utils/api";
import { getDeviceId } from "../utils/device";

// Backend base — prod-safe (no localhost fallback)
const API = API_BASE || "";

export async function register(data) {
  const deviceId = getDeviceId();

  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, deviceId }),
  });

  return res.json();
}


export async function loginReq(data) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function requestReset(email) {
  const res = await fetch(`${API}/api/auth/request-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(email, code, newPassword) {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });
  return res.json();
}

export async function sendVerifyCode(email) {
  const res = await fetch(`${API}/api/auth/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyCode(email, code) {
  const res = await fetch(`${API}/api/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return res.json();
}

export async function getProfile(id) {
  const res = await fetch(`${API}/api/auth/profile/${id}`);
  return res.json();
}
