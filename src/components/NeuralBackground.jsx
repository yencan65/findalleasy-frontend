import React, { useEffect, useMemo, useRef } from "react";

// Full-page calm neural web background.
// Goals:
// - Always slow and "alive" without spikes.
// - Never turns into "lightning" over time (dt clamp + full clear every frame).
// - Covers the whole page like a spider web.
// - Purple tint only (or close), but subdued.

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

export default function NeuralBackground({
  tint = "#7A5CFF",
  className = "",
  style,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const nodesRef = useRef([]);
  const rgb = useMemo(() => hexToRgb(tint), [tint]);

  const cfg = useMemo(() => {
    return {
      maxDpr: 2,
      // Node count is derived from area; clamp to keep perf sane.
      density: 0.00022, // nodes per px^2
      minNodes: 42,
      maxNodes: 120,
      linkDist: 180,
      // speed is intentionally tiny; we scale by dt below.
      speed: 0.03,
      alpha: 0.10,
      nodeAlpha: 0.18,
      baseLine: 0.85,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    const reseed = (w, h) => {
      const count = clamp(Math.round(w * h * cfg.density), cfg.minNodes, cfg.maxNodes);
      const nodes = [];
      for (let i = 0; i < count; i++) {
        // Deterministic seeding (no per-frame random). This prevents sporadic flashes.
        const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const fy = (Math.sin(i * 78.233) * 12345.6789) % 1;
        const x = (fx < 0 ? fx + 1 : fx) * w;
        const y = (fy < 0 ? fy + 1 : fy) * h;
        const a = i * 0.55;
        nodes.push({
          x,
          y,
          vx: Math.cos(a) * cfg.speed,
          vy: Math.sin(a) * cfg.speed,
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
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reseed(w, h);
    };

    const tick = (t) => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;

      const last = lastTRef.current || t;
      const dtRaw = (t - last) / 1000;
      // Clamp dt: avoids huge jumps after tab switch / lag causing "aggressive" motion.
      const dt = clamp(dtRaw, 0, 1 / 30);
      lastTRef.current = t;

      // Clear every frame to avoid trails becoming "lightning".
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      if (!nodes || !nodes.length) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Gentle drift. Scales by dt*60 so motion stays consistent.
      const drift = reduced ? 0.006 : 0.016;
      const damp = reduced ? 0.986 : 0.976;
      const maxV = reduced ? 0.05 : 0.08;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        // A tiny deterministic wave to keep it alive without chaos.
        const waveX = Math.sin(t * 0.00025 + n.phase) * drift;
        const waveY = Math.cos(t * 0.00022 + n.phase * 1.37) * drift;
        n.vx = (n.vx + waveX) * damp;
        n.vy = (n.vy + waveY) * damp;
        n.vx = clamp(n.vx, -maxV, maxV);
        n.vy = clamp(n.vy, -maxV, maxV);
        n.x += n.vx * (dt * 60);
        n.y += n.vy * (dt * 60);

        // Soft bounce.
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

      // Draw links (simple O(n^2), clamped node count keeps this safe).
      const linkDist = cfg.linkDist;
      const linkDist2 = linkDist * linkDist;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist2) continue;
          const d = Math.sqrt(d2);
          const k = 1 - d / linkDist;
          const alpha = cfg.alpha * k;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
          // Thicker lines overall, but still calm: thicker when closer.
          ctx.lineWidth = cfg.baseLine + k * 1.35;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nodes: subtle, not sparkly.
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${cfg.nodeAlpha})`;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onVis = () => {
      // Reset timestamp so dt doesn't spike after hidden->visible.
      lastTRef.current = 0;
    };

    resize();
    lastTRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      try {
        cancelAnimationFrame(rafRef.current);
      } catch {}
    };
  }, [cfg, rgb]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none w-full h-full ${className}`}
      style={{ display: "block", ...style }}
    />
  );
}
