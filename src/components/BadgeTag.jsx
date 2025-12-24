// FRONTEND/src/components/BadgeTag.jsx
// Zarif, Apple-style rozet etiketi

export default function BadgeTag({ label, type }) {
  // Renk haritası — backend aynı rozet isimlerini koruyor
  const colors = {
    editor_choice: "#111", 
    best_overall: "#0F62FE",
    top_pick: "#6C63FF",

    best_price: "#0CAF60",
    top_rated: "#FFB800",
    trusted_seller: "#3AA6B9",
    high_trust: "#00897B",

    fast_delivery: "#00A36C",
    on_time_delivery: "#2A7FFF",

    ai_discount: "#9457EB",
    dynamic_price_drop: "#E91E63",

    recommended: "#0071E3",
    smart_suggestion: "#444",

    good_quality: "#888",
    good_alternative: "#757575",

    big_savings: "#D81B60",
    nice_savings: "#26A69A",

    insurance_product: "#004AAD",
    relax_zone: "#AF6EBA",
    wellbeing: "#5FB49C",
    fitness_center: "#0EAD69",
    active_life: "#3E7CB1",
    legal_service: "#1A73E8",
    professional_help: "#6B5B95",
    travel_expert: "#3949AB",
    education_service: "#008ECC",
    skill_improvement: "#0097A7",
    info_only: "#9E9E9E",
  };

  const bg = colors[type] || "#333";

  return (
    <span
      style={{
        background: bg,
        color: "#fff",
        padding: "3px 8px",
        borderRadius: "8px",
        fontSize: "10px",
        fontWeight: 600,
        marginRight: "6px",
        marginBottom: "4px",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
