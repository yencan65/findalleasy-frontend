import React, { useEffect, useMemo, useRef } from "react";

// Animated neural-network background (purple) — visible but not noisy.
// Goals per request:
// - Thicker lines (more presence), still premium.
// - Slow motion (eye-friendly).
// - Dense coverage across the whole viewport (web everywhere).
// - Starts near logo (#fae-logo) and drifts toward search bar (#search-input).
// - Respects prefers-reduced-motion.

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
    reduce: false,
  });

  const palette = useMemo(() => {
    return {
      line: "122,92,255",  // #7A5CFF
      line2: "107,78,255", // #6B4EFF
      glow: "160,140,255",
      bg: "5,5,18",
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const detectReduceMotion = () => {
      try {
        return !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {
        return false;
      }
    };

    const resize = () => {
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const st = stateRef.current;
      st.w = w;
      st.h = h;
      st.dpr = dpr;
      st.reduce = detectReduceMotion();

      // Dense web across the whole viewport, but keep CPU sane.
      // Scale node count by screen area with caps.
      const area = w * h;
      const isSmall = w < 520;
      const baseN = isSmall
        ? clamp(Math.round(area / 18000), 46, 86)
        : clamp(Math.round(area / 15000), 80, 125);

      const nodes = [];
      for (let i = 0; i < baseN; i++) {
        const slow = isSmall ? 0.06 : 0.075;
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          // Slow drift only — no jitter
          vx: (Math.random() - 0.5) * slow,
          vy: (Math.random() - 0.5) * slow,
          r: isSmall ? 1.25 : 1.55,
        });
      }

      // "Stream" nodes along logo -> search bar
      const streamN = isSmall ? 12 : 18;
      const stream = [];
      for (let i = 0; i < streamN; i++) {
        stream.push({
          p: i / (streamN - 1),
          wig: (Math.random() - 0.5) * (isSmall ? 16 : 22),
          ph: Math.random() * Math.PI * 2,
        });
      }

      st.nodes = nodes;
      st.stream = stream;
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

      const a = getCenter(logo) || { x: w * 0.12, y: 44 };
      const b = getCenter(search) || { x: w * 0.5, y: h * 0.32 };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Subtle vignette to blend the web into the page (not to darken the whole UI)
      const g = ctx.createRadialGradient(
        w * 0.55,
        h * 0.25,
        40,
        w * 0.55,
        h * 0.25,
        Math.max(w, h) * 0.95
      );
      g.addColorStop(0, `rgba(${palette.bg},0.0)`);
      g.addColorStop(1, `rgba(${palette.bg},0.06)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Update background nodes (slow)
      const isSmall = w < 520;
      const reduce = !!st.reduce;

      // Keep motion slow; extra slow if reduce-motion is enabled.
      const speed = reduce ? 0.055 : isSmall ? 0.11 : 0.13;

      for (const n of st.nodes) {
        // Gentle pull toward the midline between anchors to make the web feel "directed"
        const midx = (a.x + b.x) / 2;
        const midy = (a.y + b.y) / 2;
        n.vx += (midx - n.x) * 0.000018;
        n.vy += (midy - n.y) * 0.000018;

        n.x += n.vx * dt * speed;
        n.y += n.vy * dt * speed;

        // wrap bounds
        if (n.x < -50) n.x = w + 50;
        if (n.x > w + 50) n.x = -50;
        if (n.y < -50) n.y = h + 50;
        if (n.y > h + 50) n.y = -50;
      }

      // Draw connections among nearby nodes
      // More coverage: larger distance threshold + thicker lines.
      const maxDist = reduce ? (isSmall ? 120 : 150) : (isSmall ? 150 : 190);

      for (let i = 0; i < st.nodes.length; i++) {
        const ni = st.nodes[i];
        for (let j = i + 1; j < st.nodes.length; j++) {
          const nj = st.nodes[j];
          const dx = ni.x - nj.x;
          const dy = ni.y - nj.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            const k = 1 - d / maxDist;

            // Presence without neon: keep alpha modest, but higher than before.
            const alpha = clamp(k * (reduce ? 0.10 : 0.14), 0.015, reduce ? 0.10 : 0.14);

            // Thicker lines, vary by proximity for depth.
            const lw = (isSmall ? 0.95 : 1.15) + k * (isSmall ? 0.70 : 0.85);

            ctx.strokeStyle = `rgba(${palette.line},${alpha})`;
            ctx.lineWidth = lw;
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
      const wigSpeed = reduce ? 0.14 : 0.22;

      const streamPts = [];
      for (const s of st.stream) {
        const wiggle =
          Math.sin(time * wigSpeed + s.ph) * (isSmall ? 6 : 9) +
          s.wig * 0.20;
        const x = a.x + sx * s.p + nx * wiggle;
        const y = a.y + sy * s.p + ny * wiggle;
        streamPts.push({ x, y });
      }

      // draw stream segments (slightly thicker + clearer)
      for (let i = 0; i < streamPts.length - 1; i++) {
        const p1 = streamPts[i];
        const p2 = streamPts[i + 1];
        ctx.strokeStyle = `rgba(${palette.line2},${reduce ? 0.14 : 0.18})`;
        ctx.lineWidth = isSmall ? 1.55 : 1.85;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // nodes (dots)
      for (const n of st.nodes) {
        const dx = n.x - b.x;
        const dy = n.y - b.y;
        const d = Math.hypot(dx, dy);
        const alpha = d < 260 ? (reduce ? 0.11 : 0.15) : (reduce ? 0.07 : 0.10);
        ctx.fillStyle = `rgba(${palette.glow},${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anchor highlights (logo + search) — minimal
      const drawAnchor = (p, a0) => {
        ctx.fillStyle = `rgba(${palette.glow},${a0})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSmall ? 4.5 : 5.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(${palette.line},${a0 * 0.78})`;
        ctx.lineWidth = isSmall ? 1.25 : 1.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSmall ? 12.5 : 15.5, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawAnchor(a, reduce ? 0.16 : 0.20);
      drawAnchor(b, reduce ? 0.14 : 0.18);

      rafRef.current = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // listen reduce-motion changes
    let mql;
    try {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      const onChange = () => {
        stateRef.current.reduce = detectReduceMotion();
      };
      if (mql && mql.addEventListener) mql.addEventListener("change", onChange);
      else if (mql && mql.addListener) mql.addListener(onChange);
    } catch {}

    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", resize);
      try {
        cancelAnimationFrame(rafRef.current);
      } catch {}
      try {
        if (mql && mql.removeEventListener) mql.removeEventListener("change", () => {});
      } catch {}
    };
  }, [palette]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        // visible through glass UI; keep behind main content layers
        mixBlendMode: "screen",
        opacity: 0.62,
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
