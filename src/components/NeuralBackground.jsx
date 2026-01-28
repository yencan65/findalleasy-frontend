import React, { useEffect, useMemo, useRef } from "react";

// Lightweight animated neural-network background.
// - Purple network, subtle motion.
// - "Starts" near logo (#fae-logo) and drifts toward search bar (#search-input).
// - Covers full viewport; pointer-events disabled.
// - Responsive: fewer nodes on small screens.

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function getCenter(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export default function NeuralBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({
    w: 0,
    h: 0,
    dpr: 1,
    nodes: [],
    stream: [],
    t0: 0,
  });

  const palette = useMemo(() => {
    // Purple, not neon. Adjust alphas in draw loop.
    return {
      line: "122,92,255",     // #7A5CFF
      line2: "107,78,255",    // #6B4EFF
      glow: "160,140,255",
      // Match app background (slightly brighter) so the vignette doesn't darken the page too much.
      bg: "10,9,32",
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    const resize = () => {
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      stateRef.current.w = w;
      stateRef.current.h = h;
      stateRef.current.dpr = dpr;

      // (Re)seed nodes based on viewport size
      const isSmall = w < 520;
      const baseN = isSmall ? 34 : w < 900 ? 54 : 74;
      const nodes = [];
      for (let i = 0; i < baseN; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          // Slow drift only — premium feel (no jitter)
          vx: (Math.random() - 0.5) * (isSmall ? 0.05 : 0.08),
          vy: (Math.random() - 0.5) * (isSmall ? 0.05 : 0.08),
          r: isSmall ? 1.1 : 1.35,
        });
      }

      // "Stream" nodes along logo -> search bar
      const streamN = isSmall ? 10 : 14;
      const stream = [];
      for (let i = 0; i < streamN; i++) {
        stream.push({
          p: i / (streamN - 1),
          wig: (Math.random() - 0.5) * 18,
          ph: Math.random() * Math.PI * 2,
        });
      }

      stateRef.current.nodes = nodes;
      stateRef.current.stream = stream;
    };

    const step = (t) => {
      const st = stateRef.current;
      const w = st.w || window.innerWidth || 1;
      const h = st.h || window.innerHeight || 1;
      const dpr = st.dpr || 1;

      if (!st.t0) st.t0 = t;
      const dt = Math.min(32, t - st.t0);
      st.t0 = t;

      // Resolve anchors each frame (DOM can move with responsive layout)
      const logo = document.getElementById("fae-logo");
      const search = document.getElementById("search-input");

      const a = getCenter(logo) || { x: w * 0.12, y: 42 };
      const b = getCenter(search) || { x: w * 0.5, y: h * 0.32 };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Very subtle vignette to blend the network
      const g = ctx.createRadialGradient(w * 0.55, h * 0.25, 40, w * 0.55, h * 0.25, Math.max(w, h) * 0.9);
      g.addColorStop(0, `rgba(${palette.bg},0.0)`);
      g.addColorStop(1, `rgba(${palette.bg},0.12)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Update background nodes
      // Global speed control: keep it slow & easy on the eyes.
      // Slower, calmer motion (no "hyper" background).
      const speed = reduceMotion ? 0.04 : (w < 520 ? 0.10 : 0.12);
      for (const n of st.nodes) {
        // Gentle drift + tiny pull toward midline between a and b
        const midx = (a.x + b.x) / 2;
        const midy = (a.y + b.y) / 2;
        const pullx = (midx - n.x) * 0.00002;
        const pully = (midy - n.y) * 0.00002;

        n.vx += pullx;
        n.vy += pully;

        n.x += n.vx * dt * speed;
        n.y += n.vy * dt * speed;

        // soft bounds
        if (n.x < -40) n.x = w + 40;
        if (n.x > w + 40) n.x = -40;
        if (n.y < -40) n.y = h + 40;
        if (n.y > h + 40) n.y = -40;
      }

      // Draw connections among nearby nodes
      const maxDist = w < 520 ? 95 : 120;
      for (let i = 0; i < st.nodes.length; i++) {
        const ni = st.nodes[i];
        for (let j = i + 1; j < st.nodes.length; j++) {
          const nj = st.nodes[j];
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            const a1 = (1 - d / maxDist)  * 0.06; // extra subtle
            ctx.strokeStyle = `rgba(${palette.line},${a1})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(ni.x, ni.y);
            ctx.lineTo(nj.x, nj.y);
            ctx.stroke();
          }
        }
      }

      // Stream line (logo -> search) with gentle wiggle
      const sx = b.x - a.x;
      const sy = b.y - a.y;
      const len = Math.max(1, Math.hypot(sx, sy));
      const nx = -sy / len;
      const ny = sx / len;

      const time = t * 0.001;
      const streamPts = [];
      for (const s of st.stream) {
        const wiggle = Math.sin(time * 0.45 + s.ph) * (w < 520 ? 5 : 7) + s.wig * 0.14;
        const x = a.x + sx * s.p + nx * wiggle;
        const y = a.y + sy * s.p + ny * wiggle;
        streamPts.push({ x, y });
      }

      // draw stream segments
      for (let i = 0; i < streamPts.length - 1; i++) {
        const p1 = streamPts[i];
        const p2 = streamPts[i + 1];
        const a2 = 0.12;
        ctx.strokeStyle = `rgba(${palette.line2},${a2})`;
        ctx.lineWidth = w < 520 ? 0.9 : 1.0;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // nodes (small dots) + slight glow near stream
      for (const n of st.nodes) {
        const dx = n.x - b.x;
        const dy = n.y - b.y;
        const d = Math.hypot(dx, dy);
        const alpha = d < 240 ? 0.12 : 0.07;
        ctx.fillStyle = `rgba(${palette.glow},${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anchor highlights (logo + search) — minimal
      const drawAnchor = (p, a0) => {
        ctx.fillStyle = `rgba(${palette.glow},${a0})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, w < 520 ? 4.2 : 5.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(${palette.line},${a0 * 0.75})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, w < 520 ? 12 : 14, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawAnchor(a, 0.18);
      drawAnchor(b, 0.16);

      rafRef.current = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      try {
        cancelAnimationFrame(rafRef.current);
      } catch {}
    };
  }, [palette]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        // keep it behind UI layers but visible through transparent/glass
        mixBlendMode: "screen",
        opacity: 0.75,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
