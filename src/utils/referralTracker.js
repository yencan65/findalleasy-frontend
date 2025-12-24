// src/utils/referralTracker.js
// Referral kodunu URL'den yakala + tarayıcıya yaz + oku

const STORAGE_KEY = "fae_referral";

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const ref =
    params.get("ref") ||
    params.get("referral") ||
    params.get("invite") ||
    "";

  if (!ref) return;

  // Daha önce kayıtlı referral varsa, ilk gelen kazanır → dokunma
  const existing = getStoredReferral();
  if (existing?.code) return;

  const data = {
    code: String(ref).trim(),
    ts: Date.now(),
  };

  try {
    // localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // cookie (backend isterse header/cookie okuyabilir)
    const maxAge = 60 * 60 * 24 * 60; // 60 gün
    document.cookie = `fae_referral=${encodeURIComponent(
      data.code
    )};path=/;max-age=${maxAge}`;
  } catch {
    // sessiz geç
  }
}

export function getStoredReferral() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.code) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // cookie temizle
    document.cookie =
      "fae_referral=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
    // ignore
  }
}
