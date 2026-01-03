// src/components/GlobalStatusToast.jsx
import React from "react";
import StatusPill from "./StatusPill";
import { useStatusBus } from "../context/StatusBusContext";

/**
 * Single, consistent status UI for the whole app.
 * Sits above everything (including modals) and shows the highest-priority status.
 */
export default function GlobalStatusToast() {
  const { current } = useStatusBus();

  if (!current || !current.text) return null;

  const rightSlot =
    current.rightText && String(current.rightText).trim() ? (
      <span className="text-[11px] opacity-75">{String(current.rightText)}</span>
    ) : null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-[99999] pointer-events-none">
      <StatusPill
        text={current.text}
        tone={current.tone || "gold"}
        showDots={!!current.showDots}
        rightSlot={rightSlot}
        className="pointer-events-auto max-w-[92vw] shadow-lg"
      />
    </div>
  );
}
