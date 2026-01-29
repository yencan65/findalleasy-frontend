import React, { useEffect, useRef } from "react";

/**
 * NeuralBackground (Rubik Cycle) — more visible lines, slower expand/retract, still calm.
 *
 * Changes (per request):
 *  - Lines are more visible (slightly higher alpha + slightly thicker stroke)
 *  - Expansion and retraction are slower (no eye strain)
 *  - Still stable: dt clamp + pause on hidden + full clear, no trails/lightning
 */
export default function NeuralBackground({
  className = "",
  opacity = 0.55,
  color = "rgba(122, 92, 255, 1)",
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);

  const nodesRef = useRef([]); // {cx,cy,sx,sy,ph1,ph2}
  const linksCubeRef = useRef([]); // [a,b]
  const linksSpreadRef = useRef([]); // [a,b]
  const metaRef = useRef({ w: 0, h: 0, tier: "desktop", n: 27 });

  const cycleRef = useRef({
    startAt: 0,
    cornerIdx: 0,
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

    function cornerRubikAnchor(idx, w, h) {
      const insetX = Math.max(48, Math.min(90, w * 0.10));
      const insetY = Math.max(64, Math.min(110, h * 0.12));
      if (idx === 0) return { x: insetX, y: insetY };
      if (idx === 1) return { x: w - insetX, y: insetY };
      if (idx === 2) return { x: w - insetX, y: h - insetY };
      return { x: insetX, y: h - insetY };
    }

    function buildRubikCubePositions(w, h, tier, cornerIdx) {
      const dim = 3;
      const s = tier === "mobile" ? 18 : tier === "tablet" ? 22 : 26;

      const proj = (i, j, k) => {
        const x = i - (dim - 1) / 2;
        const y = j - (dim - 1) / 2;
        const z = k - (dim - 1) / 2;
        const px = (x - z) * s;
        const py = (x + z) * s * 0.55 + y * s * 0.9;
        return { px, py };
      };

      const anchor = cornerRubikAnchor(cornerIdx, w, h);
      const flipX = cornerIdx === 1 || cornerIdx === 2 ? -1 : 1;
      const flipY = cornerIdx === 2 || cornerIdx === 3 ? -1 : 1;

      const pts = [];
      for (let j = 0; j < dim; j++) {
        for (let i = 0; i < dim; i++) {
          for (let k = 0; k < dim; k++) {
            const { px, py } = proj(i, j, k);
            pts.push({
              x: anchor.x + px * flipX,
              y: anchor.y + py * flipY,
            });
          }
        }
      }
      return pts;
    }

    function buildRubikLinks() {
      const dim = 3;
      const idx = (i, j, k) => j * dim * dim + i * dim + k;
      const links = [];
      const add = (a, b) => links.push([Math.min(a, b), Math.max(a, b)]);

      for (let j = 0; j < dim; j++) {
        for (let i = 0; i < dim; i++) {
          for (let k = 0; k < dim; k++) {
            const a = idx(i, j, k);
            if (i + 1 < dim) add(a, idx(i + 1, j, k));
            if (j + 1 < dim) add(a, idx(i, j + 1, k));
            if (k + 1 < dim) add(a, idx(i, j, k + 1));
          }
        }
      }

      const seen = new Set();
      const out = [];
      for (const [a, b] of links) {
        const key = a + ":" + b;
        if (!seen.has(key)) {
          seen.add(key);
          out.push([a, b]);
        }
      }
      return out;
    }

    function buildSpreadPositions(w, h, n) {
      const marginX = Math.max(28, Math.min(64, w * 0.06));
      const marginY = Math.max(40, Math.min(82, h * 0.07));

      const cols = Math.max(3, Math.ceil(Math.sqrt((n * w) / h)));
      const rows = Math.max(3, Math.ceil(n / cols));

      const cellW = (w - marginX * 2) / (cols - 1);
      const cellH = (h - marginY * 2) / (rows - 1);

      const jitterX = Math.min(18, cellW * 0.14);
      const jitterY = Math.min(18, cellH * 0.14);

      const pts = [];
      let idx = 0;
      for (let r = 0; r < rows && idx < n; r++) {
        for (let c = 0; c < cols && idx < n; c++) {
          const x = marginX + c * cellW + (Math.random() * 2 - 1) * jitterX;
          const y = marginY + r * cellH + (Math.random() * 2 - 1) * jitterY;
          pts.push({ x, y });
          idx++;
        }
      }
      return pts;
    }

    function buildSpreadLinks(pts, tier) {
      const n = pts.length;
      const k = tier === "mobile" ? 2 : tier === "tablet" ? 3 : 4;
      const maxLen = tier === "mobile" ? 220 : tier === "tablet" ? 260 : 300;
      const maxLen2 = maxLen * maxLen;

      const pairs = new Set();

      for (let i = 0; i < n; i++) {
        const a = pts[i];
        const dists = [];
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const b = pts[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= maxLen2) dists.push([d2, j]);
        }
        dists.sort((u, v) => u[0] - v[0]);
        for (let t = 0; t < Math.min(k, dists.length); t++) {
          const j = dists[t][1];
          const a0 = Math.min(i, j);
          const b0 = Math.max(i, j);
          pairs.add(a0 + ":" + b0);
        }
      }

      const links = [];
      pairs.forEach((key) => {
        const [a, b] = key.split(":").map((x) => parseInt(x, 10));
        links.push([a, b]);
      });
      return links;
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

    function initCycle(now = performance.now()) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const tier = getTier(w);

      metaRef.current = { w, h, tier, n: 27 };

      const cornerIdx = pickNextCorner();
      cycleRef.current.cornerIdx = cornerIdx;
      cycleRef.current.startAt = now;

      const cube = buildRubikCubePositions(w, h, tier, cornerIdx);
      const spread = buildSpreadPositions(w, h, 27);

      const nodes = [];
      for (let i = 0; i < 27; i++) {
        nodes.push({
          cx: cube[i].x,
          cy: cube[i].y,
          sx: spread[i].x,
          sy: spread[i].y,
          ph1: Math.random() * Math.PI * 2,
          ph2: Math.random() * Math.PI * 2,
        });
      }
      nodesRef.current = nodes;

      linksCubeRef.current = buildRubikLinks();
      linksSpreadRef.current = buildSpreadLinks(spread, tier);
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

      initCycle(performance.now());
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
      if (!nodes || nodes.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Slower expand/retract (eyes-friendly)
      const cycle = cycleRef.current;
      const cycleMs = prefersReduced ? 6000 : 12000;   // slower overall
      const expandMs = prefersReduced ? 1700 : 4000;   // slow open
      const holdMs = prefersReduced ? 500 : 900;
      const retractMs = prefersReduced ? 1700 : 4000;  // slow close
      const restMs = Math.max(300, cycleMs - (expandMs + holdMs + retractMs));

      const e = t - cycle.startAt;
      let phaseT = 0;

      if (e < expandMs) {
        phaseT = smooth01(clamp(e / expandMs, 0, 1));
      } else if (e < expandMs + holdMs) {
        phaseT = 1;
      } else if (e < expandMs + holdMs + retractMs) {
        const k = clamp((e - expandMs - holdMs) / retractMs, 0, 1);
        phaseT = 1 - smooth01(k);
      } else if (e < expandMs + holdMs + retractMs + restMs) {
        phaseT = 0;
      } else {
        initCycle(t);
        phaseT = 0;
      }

      // tiny breathing drift (very subtle)
      const tt = t / 1000;
      const amp = prefersReduced ? 0 : tier === "mobile" ? 1.1 : tier === "tablet" ? 1.4 : 1.7;
      const driftSpeed = tier === "mobile" ? 0.26 : 0.32;

      const blend = phaseT;

      const linksA = linksCubeRef.current;
      const linksB = linksSpreadRef.current;

      // slightly thicker for readability, still calm
      const lw = tier === "mobile" ? 1.30 : tier === "tablet" ? 1.28 : 1.30;

      // Alphas: more visible, but capped to avoid glare
      const cubeAlphaBase = tier === "mobile" ? 0.28 : 0.22;   // rubik core is more readable
      const spreadAlphaBase = tier === "mobile" ? 0.14 : 0.11; // spread visible but calm

      const pos = (i) => {
        const p = nodes[i];
        const x = p.cx + (p.sx - p.cx) * blend + Math.sin(tt * driftSpeed + p.ph1) * amp;
        const y = p.cy + (p.sy - p.cy) * blend + Math.cos(tt * driftSpeed * 0.9 + p.ph2) * amp;
        return { x, y };
      };

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lw;

      // Cube links fade out as we expand
      const aAlpha = opacity * cubeAlphaBase * (1 - blend);
      if (aAlpha > 0.002) {
        ctx.globalAlpha = aAlpha;
        for (let k = 0; k < linksA.length; k++) {
          const [i, j] = linksA[k];
          const pi = pos(i);
          const pj = pos(j);
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
        }
      }

      // Spread links fade in as we expand (cap stays low)
      const bAlpha = opacity * spreadAlphaBase * blend;
      if (bAlpha > 0.002) {
        ctx.globalAlpha = bAlpha;
        for (let k = 0; k < linksB.length; k++) {
          const [i, j] = linksB[k];
          const pi = pos(i);
          const pj = pos(j);
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
        }
      }

      // Nodes (very subtle)
      const nodeR = tier === "mobile" ? 1.25 : 1.38;
      const nodeAlpha = opacity * (tier === "mobile" ? 0.11 : 0.12);
      ctx.globalAlpha = nodeAlpha;

      for (let i = 0; i < nodes.length; i++) {
        const p = pos(i);
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
    const onNav = () => initCycle(performance.now());

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
