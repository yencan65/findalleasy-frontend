import React, { useEffect, useMemo, useRef } from "react";

// A small, calm neural-web canvas used as a decorative strip (mobile vitrin top/bottom).
// - Deterministic motion (no random flicker)
// - dt clamped (prevents "lightning" after tab stutters)
// - Clears every frame (no trail accumulation)

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

export default function NeuralStrip({ className = "", tint = "#7A5CFF" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const nodesRef = useRef([]);

  const base = useMemo(() => {
    // Mobile can look "too busy" with strips; keep them calm.
    // If strips ever show on tablet/desktop, allow a touch more presence.
    return {
      maxDpr: 2,
      // tuned for strip size (short height)
      densityMobile: 0.00062,
      densityDesk: 0.00078,
      linkDistMobile: 120,
      linkDistDesk: 140,
      speed: 0.032,
      lineBaseMobile: 0.9,
      lineBaseDesk: 1.05,
      alphaMobile: 0.11,
      alphaDesk: 0.15,
      nodeAlphaMobile: 0.18,
      nodeAlphaDesk: 0.24,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, base.maxDpr);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = w < 640;
      const density = isMobile ? base.densityMobile : base.densityDesk;
      // (Re)seed nodes according to area.
      const count = clamp(Math.round(w * h * density), 14, isMobile ? 34 : 44);
      const nodes = [];
      for (let i = 0; i < count; i++) {
        // deterministic-ish initial placement based on i
        const fx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const fy = (Math.sin(i * 78.233) * 12345.6789) % 1;
        const x = (fx < 0 ? fx + 1 : fx) * w;
        const y = (fy < 0 ? fy + 1 : fy) * h;
        const a = i * 0.9;
        nodes.push({
          x,
          y,
          vx: Math.cos(a) * base.speed,
          vy: Math.sin(a) * base.speed,
          phase: a,
        });
      }
      nodesRef.current = nodes;
    };

    const hexToRgb = (hex) => {
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
    };
    const rgb = hexToRgb(tint);

    const tick = (t) => {
      if (document.hidden) {
        lastTRef.current = t;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;

      const last = lastTRef.current || t;
      const dtRaw = (t - last) / 1000;
      // Clamp dt so background never "spikes" after lag/tab switch.
      const dt = clamp(dtRaw, 0, 1 / 30);
      lastTRef.current = t;

      const nodes = nodesRef.current;

      // Clear every frame to avoid trail accumulation ("lightning" effect).
      ctx.clearRect(0, 0, w, h);

      // Motion: very gentle drift + tiny wave to feel alive.
      const drift = reduced ? 0.006 : 0.018;
      const damp = reduced ? 0.985 : 0.975;
      const maxV = reduced ? 0.045 : 0.075;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const waveX = Math.sin((t * 0.00035) + n.phase) * drift;
        const waveY = Math.cos((t * 0.00032) + n.phase * 1.3) * drift;

        n.vx = (n.vx + waveX) * damp;
        n.vy = (n.vy + waveY) * damp;
        n.vx = clamp(n.vx, -maxV, maxV);
        n.vy = clamp(n.vy, -maxV, maxV);

        n.x += n.vx * (dt * 60);
        n.y += n.vy * (dt * 60);

        // bounce
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

      const isMobile = w < 640;
      // Draw links
      const linkDist = isMobile ? base.linkDistMobile : base.linkDistDesk;
      const alphaBase = isMobile ? base.alphaMobile : base.alphaDesk;
      const lineBase = isMobile ? base.lineBaseMobile : base.lineBaseDesk;
      const nodeAlpha = isMobile ? base.nodeAlphaMobile : base.nodeAlphaDesk;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist * linkDist) continue;
          const d = Math.sqrt(d2);
          const k = 1 - d / linkDist;
          const alpha = alphaBase * k;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
          ctx.lineWidth = lineBase + k * (isMobile ? 0.9 : 1.1); // slightly less punch on mobile
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // subtle nodes
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${nodeAlpha})`;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, isMobile ? 1.1 : 1.25, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onVis = () => {
      // Reset timestamp so dt doesn't spike.
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
  }, [base, tint]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
