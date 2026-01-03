// src/components/StatusPill.jsx
import React from "react";

/**
 * Küçük, şık bir durum etiketi.
 * - Gold border + blur
 * - İsteğe bağlı 3 nokta animasyonu
 */
export default function StatusPill({
  text,
  showDots = true,
  className = "",
  tone = "gold", // gold | muted | danger
  rightSlot = null,
}) {
  if (!text) return null;

  const toneCls =
    tone === "danger"
      ? "border-red-500/50 text-red-200"
      : tone === "muted"
      ? "border-white/15 text-gray-200"
      : "border-[#d4af37]/45 text-[#f7e7a8]";

  return (
    <div
      className={
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-black/55 backdrop-blur shadow-sm " +
        toneCls +
        " " +
        className
      }
      aria-live="polite"
    >
      <span className="text-[12px] leading-none">{text}</span>
      {showDots && (
        <span className="fae-dots" aria-hidden="true">
          <span className="fae-dot" />
          <span className="fae-dot" />
          <span className="fae-dot" />
        </span>
      )}
      {rightSlot}
    </div>
  );
}
