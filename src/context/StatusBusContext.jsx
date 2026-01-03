// src/context/StatusBusContext.jsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";

/**
 * GLOBAL STATUS BUS (single source of truth)
 *
 * Goals:
 *  - Every async action (search/vision/qr/assistant/etc.) can publish a status
 *  - UI shows one consistent toast (StatusPill) with optional dots + tone
 *  - Multiple sources can publish; highest priority wins
 *
 * Status shape:
 *  {
 *    text: string,
 *    tone?: "gold" | "muted" | "danger",
 *    showDots?: boolean,
 *    rightText?: string | null,
 *    priority?: number,        // higher wins
 *    ttlMs?: number,           // auto-clear after ttl
 *  }
 */

const StatusBusContext = createContext(null);

export function StatusBusProvider({ children }) {
  const [bySource, setBySource] = useState({}); // { [source]: {..status, updatedAt} }
  const timersRef = useRef({}); // { [source]: timeoutId }

  const clearTimer = (source) => {
    try {
      const t = timersRef.current?.[source];
      if (t) clearTimeout(t);
    } catch {}
    if (timersRef.current) timersRef.current[source] = null;
  };

  const clearStatus = (source) => {
    if (!source) return;
    clearTimer(source);
    setBySource((prev) => {
      if (!prev?.[source]) return prev;
      const next = { ...prev };
      delete next[source];
      return next;
    });
  };

  const setStatus = (source, status) => {
    if (!source) source = "global";
    const text = String(status?.text || "").trim();
    if (!text) {
      clearStatus(source);
      return;
    }

    const nextStatus = {
      text,
      tone: status?.tone || "gold",
      showDots: status?.showDots !== false,
      rightText: status?.rightText ?? null,
      priority: Number.isFinite(status?.priority) ? Number(status.priority) : 0,
      ttlMs: Number.isFinite(status?.ttlMs) ? Number(status.ttlMs) : 0,
      updatedAt: Date.now(),
    };

    // Update store
    setBySource((prev) => ({ ...(prev || {}), [source]: nextStatus }));

    // TTL management
    clearTimer(source);
    if (nextStatus.ttlMs > 0) {
      timersRef.current[source] = setTimeout(() => {
        // Only clear if this status is still the latest for the source
        setBySource((prev) => {
          const cur = prev?.[source];
          if (!cur) return prev;
          if (cur.updatedAt !== nextStatus.updatedAt) return prev;
          const n = { ...prev };
          delete n[source];
          return n;
        });
      }, nextStatus.ttlMs);
    }
  };

  const flash = (source, text, ms = 1500, opts = {}) => {
    setStatus(source, {
      text,
      showDots: false,
      ttlMs: ms,
      tone: opts?.tone || "muted",
      priority: Number.isFinite(opts?.priority) ? Number(opts.priority) : 0,
      rightText: opts?.rightText ?? null,
    });
  };

  const current = useMemo(() => {
    const arr = Object.entries(bySource || {})
      .map(([source, s]) => ({ source, ...(s || {}) }))
      .filter((s) => String(s?.text || "").trim() !== "");

    if (arr.length === 0) return null;

    arr.sort((a, b) => {
      const pa = Number.isFinite(a.priority) ? a.priority : 0;
      const pb = Number.isFinite(b.priority) ? b.priority : 0;
      if (pb !== pa) return pb - pa;
      const ta = Number.isFinite(a.updatedAt) ? a.updatedAt : 0;
      const tb = Number.isFinite(b.updatedAt) ? b.updatedAt : 0;
      return tb - ta;
    });

    return arr[0] || null;
  }, [bySource]);

  const api = useMemo(
    () => ({
      setStatus,
      clearStatus,
      flash,
      current,
      all: bySource,
    }),
    [current, bySource]
  );

  return <StatusBusContext.Provider value={api}>{children}</StatusBusContext.Provider>;
}

export function useStatusBus() {
  const ctx = useContext(StatusBusContext);
  if (!ctx) {
    throw new Error("useStatusBus must be used within <StatusBusProvider />");
  }
  return ctx;
}
