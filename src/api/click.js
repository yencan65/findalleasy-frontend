import { getDeviceId } from "../utils/device";

// src/api/click.js
const API =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";   // 🔥 5000 → 8080

/**
 * Ürün tıklama kaydı gönderir.
 * - Device Fingerprint EKLENDİ
 * - Token otomatik ekleniyor
 * - Ağ hatasına dayanıklı
 * - Fraud modülü ile uyumlu
 */
export async function sendClick(data = {}) {
  try {
    const token = localStorage.getItem("token") || "";
    const deviceId = getDeviceId(); // 🔥 kritik

    const payload = {
      ...data,
      deviceId,
    };

    const res = await fetch(`${API}/api/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    


    // Güvenli JSON parse
    const json = await res.json().catch(() => ({
      ok: false,
      message: "Geçersiz yanıt",
    }));

    return json;
  } catch (err) {
    console.warn("sendClick hata:", err);
    return { ok: false, message: "Sunucu hatası" };
  }
}
