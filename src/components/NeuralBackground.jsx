import React, { useEffect, useRef } from "react";

/**
 * Calm, stable neural-web background (responsive density + subtle mobile rotation).
 *
 * Mobile goal (your request):
 *  - NOT crowded
 *  - links a bit more visible (nodes still subtle)
 *  - gentle movement + very light rotation
 */
export default function NeuralBackground({
  className = "",
  opacity = 0.55,
  color = "rgba(122, 92, 255, 1)",
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

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const rand = (a, b) => a + Math.random() * (b - a);

    function getTier(w) {
      if (w < 640) return "mobile";
      if (w < 1024) return "tablet";
      return "desktop";
    }

    function getParams(w, h) {
      const tier = getTier(w);
      const area = w * h;

      let nMin, nMax, divisor, maxLinksPerNode, maxDist;

      if (tier === "mobile") {
        // lighter density, but links slightly more visible
        nMin = 26;
        nMax = 64;
        divisor = 56000;
        maxLinksPerNode = 2;
        maxDist = 125;
      } else if (tier === "tablet") {
        nMin = 45;
        nMax = 120;
        divisor = 36000;
        maxLinksPerNode = 3;
        maxDist = 165;
      } else {
        nMin = 70;
        nMax = 185;
        divisor = 28000;
        maxLinksPerNode = 4;
        maxDist = 185;
      }

      const n = Math.max(nMin, Math.min(nMax, Math.round(area / divisor)));
      return { tier, n, maxLinksPerNode, maxDist };
    }

    function resizeAndSeed() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { n } = getParams(w, h);

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
      if (document.hidden) stop();
      else {
        lastTRef.current = 0; // avoid dt jump
        start();
      }
    }

    function tick(t) {
      if (!runningRef.current) return;

      const last = lastTRef.current || t;
      let dt = (t - last) / 1000;
      lastTRef.current = t;
      if (!Number.isFinite(dt) || dt <= 0) dt = 0.016;
      dt = Math.min(dt, 0.033);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // no trails
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      if (!nodes || nodes.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const { tier, maxLinksPerNode, maxDist } = getParams(w, h);
      const maxDist2 = maxDist * maxDist;

      const speed = prefersReduced ? 0.25 : 0.65;

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        p.x += p.vx * speed * (dt * 60);
        p.y += p.vy * speed * (dt * 60);

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // repulsion (mobile slightly stronger)
      const repelRadius = tier === "mobile" ? 62 : 55;
      const repelRadius2 = repelRadius * repelRadius;
      const repelStrength = tier === "mobile" ? 0.22 : 0.18;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 0 && d2 < repelRadius2) {
            const d = Math.sqrt(d2);
            const push = (repelRadius - d) / repelRadius;
            const ux = dx / d;
            const uy = dy / d;
            a.x -= ux * push * repelStrength;
            a.y -= uy * push * repelStrength;
            b.x += ux * push * repelStrength;
            b.y += uy * push * repelStrength;
          }
        }
      }

      // tiny mobile rotation: makes it feel alive without clutter
      const angle =
        tier === "mobile" && !prefersReduced ? Math.sin(t / 17000) * 0.03 : 0; // ~±1.7°

      ctx.save();
      if (angle) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate(angle);
        ctx.translate(-w / 2, -h / 2);
      }

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.lineWidth = tier === "mobile" ? 1.18 : 1.25;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // links: mobile more visible but fewer links
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        let links = 0;

        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < maxDist2) {
            const strength = 1 - d2 / maxDist2;

            // tuned alphas
            const baseAlpha = tier === "mobile" ? 0.075 : 0.06;
            const boost = tier === "mobile" ? 0.28 : 0.22;
            const alpha = Math.min(0.38, baseAlpha + boost * strength);

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

      // nodes stay subtle (links are the hero on mobile)
      const nodeAlpha = tier === "mobile" ? 0.22 : 0.35;
      const r = tier === "mobile" ? 1.2 : 1.6;
      ctx.globalAlpha = opacity * nodeAlpha;

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
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
        zIndex: 0,
      }}
    />
  );
}
