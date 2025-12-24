// src/utils/badgeSelect.js
// Kart üzerinde gösterilecek en önemli rozetleri seçer.
// Backend rozetleri bozulmaz – sadece frontend gösterimi filtrelenir.

export function pickImportantBadges(badges = [], category = "", provider = "") {
  if (!Array.isArray(badges)) return [];

  const t = (category || "").toLowerCase();
  const p = (provider || "").toLowerCase();

  // Öncelik sırası (evrensel)
  const PRIORITY = [
    "editor_choice",
    "best_overall",
    "best_price",
    "top_rated",
    "trusted_seller",
    "high_trust",
    "community_favorite",
    "ai_discount",
    "dynamic_price_drop",
  ];

  // Kategori bazlı özel rozetler
  const CATEGORY_SPECIAL = {
    insurance: [
      "insurance_product",
      "tss",
      "saglik",
      "dask",
      "konut",
      "seyahat",
    ],
    hotel: ["travel_expert"],
    tourism: ["travel_expert"],
    gym: ["fitness_center", "active_life"],
    wellness: ["relax_zone", "wellbeing"],
    lawyer: ["legal_service", "professional_help"],
    education: ["education_service", "skill_improvement"],
  };

  // Kategori belirleme
  let type = "generic";

  if (p.includes("sigorta") || t.includes("sigorta")) type = "insurance";
  if (p.includes("hotel") || t.includes("otel")) type = "hotel";
  if (t.includes("tur") || t.includes("tour")) type = "tourism";
  if (t.includes("spor") || p.includes("gym")) type = "gym";
  if (t.includes("spa") || t.includes("masaj")) type = "wellness";
  if (t.includes("hukuk") || t.includes("avukat")) type = "lawyer";
  if (t.includes("eğitim") || t.includes("kurs")) type = "education";

  const important = [];

  // Öncelik rozetlerini al
  for (const key of PRIORITY) {
    if (badges.includes(key)) important.push(key);
  }

  // Kategoriye özel rozetleri ekle
  if (CATEGORY_SPECIAL[type]) {
    for (const key of CATEGORY_SPECIAL[type]) {
      if (badges.includes(key)) important.push(key);
    }
  }

  // Gereksiz uzunluğu kırp → Max 4 rozet
  const limited = Array.from(new Set(important)).slice(0, 4);

  return limited;
}
