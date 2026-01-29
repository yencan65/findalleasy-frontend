import React, { useEffect, useRef } from "react";

/**
 * NeuralBackground — calm "AI neural web" that is NOT random scribbles on mobile.
 *
 * ✅ Mobile: structured short links (meaningful mesh), not meaningless long lines
 * ✅ Every page entry: starts from a corner and spreads across the page (soft reveal wave)
 * ✅ Corner rotates sequentially across 4 corners (session-based)
 * ✅ Stable over time: no lightning / no accumulation (full clear, dt clamp, pause on hidden)
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
  const linksRef = useRef([]); // [i, j]
  const metaRef = useRef({ w: 0, h: 0, tier: "desktop" });

  const introRef = useRef({
    startAt: 0,
    duration: 2200,
    active: true,
    cornerIdx: 0,
    origin: { x: 0, y: 0 },
  });

  const runningRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const smooth01 = (t) => t * t * (3 - 2 * t);
    const rand = (a, b) => a + Math.random() * (b - a);

    function getTier(w) {
      if (w < 640) return "mobile";
      if (w < 1024) return "tablet";
      return "desktop";
    }

    function pickNextCorner() {
      const key = "fae_neural_corner_idx";
      const raw = sessionStorage.getItem(key);
      let idx;
      if (raw == null) idx = Math.floor(Math.random() * 4);
      else idx = (parseInt(raw, 10) + 1) % 4;
      sessionStorage.setItem(key, String(idx));
      return idx;
    }

    function cornerOrigin(idx, w, h) {
      if (idx === 0) return { x: 0, y: 0 };       // TL
      if (idx === 1) return { x: w, y: 0 };       // TR
      if (idx === 2) return { x: w, y: h };       // BR
      return { x: 0, y: h };                      // BL
    }

    function patchHistoryOnce() {
      if (window.__faeHistoryPatched) return;
      window.__faeHistoryPatched = true;

      const fire = () => window.dispatchEvent(new Event("fae:navigation"));

      const wrap = (fn) =>
        function (...args) {
          const ret = fn.apply(this, args);
          try { fire(); } catch {}
          return ret;
        };

      try {
        history.pushState = wrap(history.pushState);
        history.replaceState = wrap(history.replaceState);
      } catch {}
    }

    function resetIntro(now = performance.now()) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      const idx = pickNextCorner();
      introRef.current.cornerIdx = idx;
      introRef.current.origin = cornerOrigin(idx, w, h);
      introRef.current.startAt = now;
      introRef.current.active = true;
      introRef.current.duration = prefersReduced ? 900 : 2200;
    }

    function buildMesh(w, h) {
      const tier = getTier(w);
      metaRef.current = { w, h, tier };

      const spacing = tier === "mobile" ? 92 : tier === "tablet" ? 80 : 72;
      const jitter = spacing * 0.26;

      const cols = Math.max(3, Math.floor(w / spacing) + 2);
      const rows = Math.max(3, Math.floor(h / spacing) + 2);
      const idx = (cx, cy) => cy * cols + cx;

      const nodes = [];
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const baseX = cx * spacing + rand(-jitter, jitter);
          const baseY = cy * spacing + rand(-jitter, jitter);
          nodes.push({
            bx: clamp(baseX, -40, w + 40),
            by: clamp(baseY, -40, h + 40),
            ph1: rand(0, Math.PI * 2),
            ph2: rand(0, Math.PI * 2),
            amp: tier === "mobile" ? 5.5 : 7.0,
            x: 0,
            y: 0,
          });
        }
      }

      const links = [];
      const add = (a, b) => {
        if (a < 0 || b < 0 || a >= nodes.length || b >= nodes.length) return;
        links.push([a, b]);
      };

      const diagLinks = tier === "mobile" ? 1 : 2;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const i = idx(cx, cy);

          if (cx + 1 < cols) add(i, idx(cx + 1, cy));
          if (cy + 1 < rows) add(i, idx(cx, cy + 1));

          if (diagLinks >= 1 && cx + 1 < cols && cy + 1 < rows) add(i, idx(cx + 1, cy + 1));
          if (diagLinks >= 2 && cx - 1 >= 0 && cy + 1 < rows) add(i, idx(cx - 1, cy + 1));
        }
      }

      nodesRef.current = nodes;
      linksRef.current = links;
    }

    function resizeAll() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildMesh(w, h);
      resetIntro(performance.now());
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
        lastTRef.current = 0;
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

      const { w, h, tier } = metaRef.current;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const links = linksRef.current;
      if (!nodes.length || !links.length) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const driftSpeed = prefersReduced ? 0.25 : tier === "mobile" ? 0.55 : tier === "tablet" ? 0.75 : 0.85;
      const tt = t / 1000;

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const ax = Math.sin((tt * driftSpeed) + p.ph1) * p.amp;
        const ay = Math.cos((tt * driftSpeed * 0.92) + p.ph2) * p.amp;
        p.x = p.bx + ax;
        p.y = p.by + ay;
      }

      const intro = introRef.current;
      const elapsed = t - intro.startAt;
      const dur = intro.duration;

      let revealK = 1;
      if (intro.active) {
        revealK = clamp(elapsed / dur, 0, 1);
        if (revealK >= 1) intro.active = false;
      }

      const diag = Math.hypot(w, h) * 1.15;
      const revealR = smooth01(revealK) * diag;
      const edge = tier === "mobile" ? 150 : 180;

      const ox = intro.origin.x;
      const oy = intro.origin.y;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const baseLine = tier === "mobile" ? 1.35 : 1.25;
      ctx.lineWidth = baseLine;

      // LINKS
      for (let k = 0; k < links.length; k++) {
        const pair = links[k];
        const a = nodes[pair[0]];
        const b = nodes[pair[1]];

        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        const d = Math.hypot(mx - ox, my - oy);

        const v = clamp((revealR - d) / edge, 0, 1);
        if (v <= 0) continue;

        const linkAlpha = tier === "mobile"
          ? opacity * (0.12 + 0.22 * v)
          : opacity * (0.08 + 0.18 * v);

        ctx.globalAlpha = linkAlpha;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // NODES
      ctx.fillStyle = color;
      const nodeR = tier === "mobile" ? 1.15 : 1.45;

      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i];
        const d = Math.hypot(p.x - ox, p.y - oy);
        const v = clamp((revealR - d) / edge, 0, 1);
        if (v <= 0) continue;

        const nodeAlpha = tier === "mobile"
          ? opacity * (0.10 + 0.12 * v)
          : opacity * (0.14 + 0.14 * v);

        ctx.globalAlpha = nodeAlpha;

        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    }

    patchHistoryOnce();
    resizeAll();
    start();

    const onResize = () => resizeAll();
    const onNav = () => resetIntro(performance.now());

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("fae:navigation", onNav);
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
    window.addEventListener("pageshow", onNav);

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("fae:navigation", onNav);
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
      window.removeEventListener("pageshow", onNav);
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
