import React, { useEffect, useRef } from "react";

/**
 * Calm, stable neural-web background.
 *
 * Fixes the common "screen disappeared" issue by ensuring:
 *  - canvas is fixed + behind everything (zIndex: -1)
 *  - pointerEvents: none
 *  - no trail accumulation (full clear each frame)
 *  - animation pauses when tab is hidden (no dt jump)
 */
export default function NeuralBackground({
  className = "",
  opacity = 0.55, // overall visibility (keep < 0.8)
  color = "rgba(122, 92, 255, 1)", // purple
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const nodesRef = useRef([]);
  const runningRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const rand = (a, b) => a + Math.random() * (b - a);

    function resizeAndSeed() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density based on area; cap to keep perf stable.
      const area = w * h;
      const base = Math.round(area / 26000);
      const n = Math.max(60, Math.min(180, base));

      const nodes = [];
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: rand(0, w),
          y: rand(0, h),
          vx: rand(-0.12, 0.12),
          vy: rand(-0.12, 0.12),
        });
      }
      nodesRef.current = nodes;
    }

    function stop() {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    function start() {
      runningRef.current = true;
      lastTRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }

    function onVisibility() {
      if (document.hidden) {
        stop();
      } else {
        // Reset timestamps to avoid dt jump → "lightning"
        lastTRef.current = 0;
        start();
      }
    }

    const maxDist = 170; // connection radius
    const maxDist2 = maxDist * maxDist;
    const maxLinksPerNode = 4; // prevents overdraw bursts

    function tick(t) {
      if (!runningRef.current) return;

      // dt in seconds; clamp to prevent speed spikes
      const last = lastTRef.current || t;
      let dt = (t - last) / 1000;
      lastTRef.current = t;
      if (!Number.isFinite(dt) || dt <= 0) dt = 0.016;
      dt = Math.min(dt, 0.033); // clamp ~30fps max step

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Full clear each frame (no trails)
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      if (!nodes || nodes.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Slow, calm speed
      const speed = prefersReduced ? 0.25 : 0.65;

      // Move + wrap + mild repulsion to avoid clustering
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        p.x += p.vx * speed * (dt * 60);
        p.y += p.vy * speed * (dt * 60);

        // Wrap edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // Repulsion pass (cheap)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < 55 * 55) {
            const d = Math.sqrt(d2);
            const push = (55 - d) / 55;
            const ux = dx / d;
            const uy = dy / d;
            a.x -= ux * push * 0.18;
            a.y -= uy * push * 0.18;
            b.x += ux * push * 0.18;
            b.y += uy * push * 0.18;
          }
        }
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1.25; // thicker but still premium
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Draw links with limit per node
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        // Find nearest neighbors (simple partial selection)
        let links = 0;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist2) {
            // draw closer first by quick thresholding
            const strength = 1 - d2 / maxDist2;
            // keep very faint far links
            const alpha = 0.06 + 0.22 * strength;
            ctx.globalAlpha = opacity * alpha;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            links++;
            if (links >= maxLinksPerNode) break;
          }
        }
      }

      // Draw nodes (subtle)
      ctx.globalAlpha = opacity * 0.35;
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    }

    const onResize = () => resizeAndSeed();

    resizeAndSeed();
    start();

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: "multiply",
        zIndex: 0, // show behind UI; content should render above by DOM order
      }}
    />
  );
}
