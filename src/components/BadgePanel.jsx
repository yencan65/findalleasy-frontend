// src/components/BadgePanel.jsx
import BadgeTag from "./BadgeTag";
import { BADGE_LABELS } from "../utils/badgeMap";

export default function BadgePanel({ badges = [], open }) {
  if (!open) return null;

  return (
    <div
      className="
        absolute left-2 right-2 bottom-2
        bg-black/80 border border-[#d4af37]/30 
        rounded-lg p-3 backdrop-blur-lg 
        shadow-[0_0_12px_rgba(0,0,0,0.5)]
        z-50 animate-fadeIn
      "
    >
      <div className="text-[#f5d76e] text-xs mb-2 font-semibold">
        Tüm Rozetler
      </div>

      <div className="flex flex-wrap gap-1">
        {badges.map((b, i) => (
          <BadgeTag key={i} type={b} label={BADGE_LABELS[b] || b} />
        ))}
      </div>
    </div>
  );
}
