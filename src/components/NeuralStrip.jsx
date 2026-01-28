import React, { useEffect, useMemo, useRef } from "react";

// Decorative calm neural-web strip (used on mobile above/below vitrin).
// Same stability logic as full background: pause on hidden, dt clamp, no trails, capped links.

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 122, g: 92, b: 255 };
}

function insertNearest(arr, item, maxLen) {
  let k = arr.length;
  while (k > 0 && arr[k - 1].d2 > item.d2) k--;
  arr.splice(k, 0, item);
  if (arr.length > maxLen) arr.length = maxLen;
}

export default function NeuralStrip({ className = "", tint = "#7A5CFF" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastTRef = useRef(0);
  const nodesRef = useRef([]);
  const rgb = useMemo(() => hexToRgb(tint), [tint]);

  const cfg = useMemo(
    () => ({
      maxDpr: 2,
      density: 0.0010,
      minNodes: 18,
      maxNodes: 52,
      linkDist: 150,
      maxLinksPerNode: 3,

      baseSpeed: 0.02,
      drift: 0.010,
      damp: 0.982,
      maxV: 0.055,

      repelDist: 22,
      repelStrength: 0.016,

      alpha: 0.16,
      nodeAlpha: 0.22,
      baseLine: 1.15,
      nodeRadius: 1.25,
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const state = { w: 1, h: 1 };

    const reseed = (w, h) => {
      const count = clamp(Math.round(w * h * cfg.density), cfg.minNodes, cfg.maxNodes);
      const nodes = [];
      for (let i = 0; i < count; i++) {
        const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const fy = (Math.sin(i * 78.233) * 12345.6789) % 1;
        const x = (fx < 0 ? fx + 1 : fx) * w;
        const y = (fy < 0 ? fy + 1 : fy) * h;
        const a = i * 0.9;
        nodes.push({
          x,
          y,
          vx: Math.cos(a) * cfg.baseSpeed,
          vy: Math.sin(a) * cfg.baseSpeed,
          phase: a,
        });
      }
      nodesRef.current = nodes;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, cfg.maxDpr);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      state.w = w;
      state.h = h;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      reseed(w, h);
    };

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) {
        try {
          cancelAnimationFrame(rafRef.current);
        } catch {}
        rafRef.current = 0;
      }
    };

    const start = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      lastTRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    };

    const tick = (t) => {
      if (!runningRef.current) return;

      const w = state.w || canvas.clientWidth || 1;
      const h = state.h || canvas.clientHeight || 1;

      const last = lastTRef.current || t;
      const dtRaw = (t - last) / 1000;
      const dt = clamp(dtRaw, 0, 1 / 30);
      lastTRef.current = t;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      if (!nodes || !nodes.length) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const drift = reduced ? cfg.drift * 0.5 : cfg.drift;
      const damp = reduced ? 0.988 : cfg.damp;
      const maxV = reduced ? cfg.maxV * 0.7 : cfg.maxV;
      const repelStrength = reduced ? cfg.repelStrength * 0.6 : cfg.repelStrength;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const waveX = Math.sin(t * 0.00026 + n.phase) * drift;
        const waveY = Math.cos(t * 0.00024 + n.phase * 1.3) * drift;
        n.vx = (n.vx + waveX) * damp;
        n.vy = (n.vy + waveY) * damp;
        n.vx = clamp(n.vx, -maxV, maxV);
        n.vy = clamp(n.vy, -maxV, maxV);
      }

      const linkDist2 = cfg.linkDist * cfg.linkDist;
      const repelDist2 = cfg.repelDist * cfg.repelDist;
      const neighbors = Array.from({ length: nodes.length }, () => []);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;

          if (d2 <= linkDist2) {
            insertNearest(neighbors[i], { j, d2 }, cfg.maxLinksPerNode);
            insertNearest(neighbors[j], { j: i, d2 }, cfg.maxLinksPerNode);
          }

          if (d2 > 0 && d2 < repelDist2) {
            const d = Math.sqrt(d2);
            const k = (cfg.repelDist - d) / cfg.repelDist;
            const push = k * repelStrength;
            const ux = dx / d;
            const uy = dy / d;
            a.vx += ux * push;
            a.vy += uy * push;
            b.vx -= ux * push;
            b.vy -= uy * push;
          }
        }
      }

      const step = dt * 60;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * step;
        n.y += n.vy * step;

        if (n.x < 0) {
          n.x = 0;
          n.vx *= -1;
        } else if (n.x > w) {
          n.x = w;
          n.vx *= -1;
        }
        if (n.y < 0) {
          n.y = 0;
          n.vy *= -1;
        } else if (n.y > h) {
          n.y = h;
          n.vy *= -1;
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const list = neighbors[i];
        for (let k = 0; k < list.length; k++) {
          const j = list[k].j;
          if (j <= i) continue;
          const b = nodes[j];
          const d = Math.sqrt(list[k].d2);
          const strength = 1 - d / cfg.linkDist;
          const alpha = cfg.alpha * strength;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
          ctx.lineWidth = cfg.baseLine + strength * 1.1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${cfg.nodeAlpha})`;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, cfg.nodeRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    start();

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [cfg, rgb]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
