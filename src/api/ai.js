// =============================================================
// src/api/ai.js — HERKÜL SÜRÜMÜ
// Mevcut işlev silinmedi, tamamı güçlendirildi
// =============================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

// XSS güvenliği + boşluk temizliği
function safe(q) {
  if (!q) return "";
  return String(q).replace(/[<>]/g, "").trim().slice(0, 240);
}

// Kullanıcının son 10 aramasını oku
function getHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem("ai_history") || "[]");
    return Array.isArray(raw) ? raw.map(safe) : [];
  } catch {
    return [];
  }
}

// Yeni arama geçmişe ekle (sıkıştırılmış model)
function saveHistory(query) {
  const clean = safe(query);
  if (!clean) return;

  const history = getHistory();
  history.unshift(clean);

  const compact = history
    .filter(Boolean)
    .slice(0, 6); // daha küçük ve daha kaliteli history

  localStorage.setItem("ai_history", JSON.stringify(compact));
}

// Ana AI isteği
export async function askAI(query, region = "TR") {
  const clean = safe(query);
  saveHistory(clean);

  const history = getHistory();
  const locale = navigator.language || "tr";

  try {
    const res = await fetch(`${BACKEND_URL}/api/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: clean,
        region,
        locale,
        context: history.join(" "),
      }),
    });

    return await res.json();
  } catch (e) {
    console.error("askAI hata:", e);
    return { answer: "AI yanıtı alınamadı." };
  }
}

// Context ekleyici
export function updateAIContext(query) {
  try {
    const clean = safe(query);
    const key = "fie_context";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [clean, ...prev].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

export function getAIContext() {
  try {
    const arr = JSON.parse(localStorage.getItem("fie_context") || "[]");
    return Array.isArray(arr) ? arr.join(", ") : "";
  } catch {
    return "";
  }
}
