export function detectCategory(query = "") {
  const q = query.toLowerCase();

  const rules = [
    { cat: "motor", keys: ["kask", "helmet", "motor", "motosiklet"] },
    { cat: "moda", keys: ["ayakkabı", "sneaker", "sandalet", "elbise", "gömlek"] },
    { cat: "elektronik", keys: ["telefon", "iphone", "samsung", "kamera", "laptop"] },
    { cat: "yemek", keys: ["pizza", "burger", "döner", "yemek"] },
    { cat: "tatil", keys: ["otel", "oda", "tatil", "konaklama"] },
    { cat: "emlak", keys: ["daire", "villa", "satılık", "kiralık"] },
    { cat: "etkinlik", keys: ["bilet", "konser", "tribün", "festival"] },
    { cat: "market", keys: ["süt", "ekmek", "su", "makarna", "yumurta"] }
  ];

  for (const r of rules) {
    if (r.keys.some(k => q.includes(k))) return r.cat;
  }

  return "genel"; // fallback
}
