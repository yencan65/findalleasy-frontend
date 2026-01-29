import React, { useEffect, useRef } from "react";

// Calm "neural web" background with corner-cycling wave.
// - Wave expands from a corner across the page, then retracts back.
// - Corners rotate in order: TL -> TR -> BR -> BL.
// - Designed to stay calm forever: dt clamped, no trails, limited links.
// - Responsive density: mobile lighter, tablet/desktop a bit denser.
//
// NOTE: This component fills its parent. Put it in a fixed/absolute wrapper
// behind your content (e.g. <div className="fixed inset-0 -z-10">...).

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function prefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function cornerPoint(idx, w, h, m) {
  // idx: 0 TL, 1 TR, 2 BR, 3 BL
  switch (idx % 4) {
    case 0:
      return { x: m, y: m };
    case 1:
      return { x: w - m, y: m };
    case 2:
      return { x: w - m, y: h - m };
    default:
      return { x: m, y: h - m };
  }
}

function profileForWidth(w) {
  // Mobile: not crowded.
  if (w < 640) {
    return {
      areaDiv: 15000,
      minNodes: 22,
      maxNodes: 60,
      linkDist: 140,
      maxLinksPerNode: 2,
      lineWidth: 0.9,
      nodeRadius: 1.05,
      nodeAlpha: 0.22,
      linkAlphaMin: 0.04,
      linkAlphaGain: 0.16,
      driftAmp: 5,
    };
  }
  // Tablet: a bit denser.
  if (w < 1024) {
    return {
      areaDiv: 32000,
      minNodes: 52,
      maxNodes: 160,
      linkDist: 175,
      maxLinksPerNode: 3,
      lineWidth: 1.05,
      nodeRadius: 1.2,
      nodeAlpha: 0.26,
      linkAlphaMin: 0.045,
      linkAlphaGain: 0.19,
      driftAmp: 7,
    };
  }
  // Desktop: slightly more presence.
  return {
    areaDiv: 26000,
    minNodes: 78,
    maxNodes: 220,
    linkDist: 190,
    maxLinksPerNode: 4,
    lineWidth: 1.1,
    nodeRadius: 1.3,
    nodeAlpha: 0.28,
    linkAlphaMin: 0.05,
    linkAlphaGain: 0.2,
    driftAmp: 8,
  };
}

function buildTargets(w, h, count) {
  // Jittered grid gives even coverage.
  const area = w * h;
  const step = Math.sqrt(area / Math.max(1, count));
  const cols = Math.max(1, Math.ceil(w / step));
  const rows = Math.max(1, Math.ceil(h / step));

  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) cells.push({ x, y });
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  const out = [];
  for (let i = 0; i < count; i++) {
    const c = cells[i % cells.length];
    const px = (c.x + (0.15 + Math.random() * 0.7)) * step;
    const py = (c.y + (0.15 + Math.random() * 0.7)) * step;
    out.push({
      x: clamp(px, 0, w),
      y: clamp(py, 0, h),
    });
  }
  return out;
}

function buildSeeds(count) {
  const seeds = [];
  for (let i = 0; i < count; i++) {
    seeds.push({
      p1: Math.random() * Math.PI * 2,
      p2: Math.random() * Math.PI * 2,
      f1: 0.9 + Math.random() * 1.4,
      f2: 0.9 + Math.random() * 1.4,
      a: 0.65 + Math.random() * 0.55,
    });
  }
  return seeds;
}

function keepBestK(best, cand, k) {
  // best: array of {j, d2} sorted asc by d2
  if (best.length === 0) {
    best.push(cand);
    return;
  }
  if (best.length >= k && cand.d2 >= best[best.length - 1].d2) return;

  let idx = best.length;
  for (let i = 0; i < best.length; i++) {
    if (cand.d2 < best[i].d2) {
      idx = i;
      break;
    }
  }
  best.splice(idx, 0, cand);
  if (best.length > k) best.length = k;
}

export default function NeuralBackground({
  className = "",
  opacity = 0.55,
  color = "rgba(122, 92, 255, 1)",
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const stateRef = useRef({
    dpr: 1,
    w: 1,
    h: 1,
    profile: profileForWidth(1024),
    targets: [],
    seeds: [],
    cornerIndex: 0,
    cycleStart: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // Timing: slow and calm.
    const T_EXPAND = reduced ? 12.0 : 10.0;
    const T_HOLD = 1.8;
    const T_RETRACT = reduced ? 12.0 : 10.0;
    const T_REST = 1.4;
    const T_TOTAL = T_EXPAND + T_HOLD + T_RETRACT + T_REST;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width || window.innerWidth || 1));
      const h = Math.max(1, Math.floor(rect.height || window.innerHeight || 1));
      return { w, h };
    };

    const ensureSize = (force = false) => {
      const { w, h } = measure();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const s = stateRef.current;
      const need =
        force ||
        s.w !== w ||
        s.h !== h ||
        s.dpr !== dpr ||
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr);

      if (!need) return;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const P = profileForWidth(w);
      const area = w * h;
      const base = Math.round(area / P.areaDiv);
      const n = clamp(base, P.minNodes, P.maxNodes);

      s.dpr = dpr;
      s.w = w;
      s.h = h;
      s.profile = P;
      s.targets = buildTargets(w, h, n);
      s.seeds = buildSeeds(n);
      s.cycleStart = 0;

      ctx.clearRect(0, 0, w, h);
    };

    const onVis = () => {
      // Prevent any "jump" on tab/app switches.
      lastTRef.current = 0;
      stateRef.current.cycleStart = 0;
    };

    const tick = (tMs) => {
      if (document.hidden) {
        lastTRef.current = tMs;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ensureSize(false);

      const s = stateRef.current;
      const w = s.w;
      const h = s.h;
      const P = s.profile;

      // Clamp dt to kill spikes.
      const last = lastTRef.current || tMs;
      const dtRaw = (tMs - last) / 1000;
      const dt = clamp(dtRaw, 0, 1 / 30);
      lastTRef.current = tMs;

      // Cycle time & corner changes.
      if (!s.cycleStart) s.cycleStart = tMs;
      let elapsed = (tMs - s.cycleStart) / 1000;
      if (elapsed >= T_TOTAL) {
        s.cornerIndex = (s.cornerIndex + 1) % 4;
        s.cycleStart = tMs;
        elapsed = 0;
      }

      // Progress p (0..1) with hold/rest.
      let p = 0;
      if (elapsed < T_EXPAND) {
        p = smoothstep(0, 1, elapsed / T_EXPAND);
      } else if (elapsed < T_EXPAND + T_HOLD) {
        p = 1;
      } else if (elapsed < T_EXPAND + T_HOLD + T_RETRACT) {
        const u = (elapsed - (T_EXPAND + T_HOLD)) / T_RETRACT;
        p = smoothstep(0, 1, 1 - u);
      } else {
        p = 0;
      }

      // Wave mask settings.
      const diag = Math.hypot(w, h) || 1;
      const margin = 26;
      const origin = cornerPoint(s.cornerIndex, w, h, margin);
      const band = w < 640 ? 0.09 : 0.075; // mobile a bit softer

      // Fade in/out near the very beginning/end so the corner doesn't "flash".
      const pVis = smoothstep(0.05, 0.22, p);

      // Clear each frame (no trails).
      ctx.clearRect(0, 0, w, h);

      const targets = s.targets;
      const seeds = s.seeds;
      const n = targets.length;
      if (!n) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Build positions + visibility factors.
      const pos = new Array(n);
      const vis = new Array(n);
      const driftBase = (reduced ? 0.55 : 1) * P.driftAmp;

      for (let i = 0; i < n; i++) {
        const base = targets[i];
        const sd = seeds[i];

        const amp = driftBase * sd.a;
        const dx = Math.sin(tMs * 0.00022 * sd.f1 + sd.p1) * amp;
        const dy = Math.cos(tMs * 0.00019 * sd.f2 + sd.p2) * amp;

        const x = base.x + dx;
        const y = base.y + dy;
        pos[i] = { x, y };

        const d = Math.hypot(x - origin.x, y - origin.y) / diag;
        const inside = 1 - smoothstep(p, p + band, d); // 1 inside wave radius
        vis[i] = clamp(inside * pVis, 0, 1);
      }

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = P.lineWidth;

      const maxD2 = P.linkDist * P.linkDist;

      // Links: nearest-K within distance, scaled by visibility.
      for (let i = 0; i < n; i++) {
        if (vis[i] <= 0.02) continue;
        const a = pos[i];
        const best = [];

        for (let j = 0; j < n; j++) {
          if (i === j || vis[j] <= 0.02) continue;
          const b = pos[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= maxD2) continue;
          keepBestK(best, { j, d2 }, P.maxLinksPerNode);
        }

        for (let k = 0; k < best.length; k++) {
          const { j, d2 } = best[k];
          const strength = 1 - d2 / maxD2;
          const aVis = Math.min(vis[i], vis[j]);
          const alpha = (P.linkAlphaMin + P.linkAlphaGain * strength) * aVis;
          if (alpha <= 0.001) continue;
          ctx.globalAlpha = opacity * alpha;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
      }

      // Nodes (subtle)
      for (let i = 0; i < n; i++) {
        const aVis = vis[i];
        if (aVis <= 0.02) continue;
        ctx.globalAlpha = opacity * P.nodeAlpha * aVis;
        const a = pos[i];
        ctx.beginPath();
        ctx.arc(a.x, a.y, P.nodeRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Keep ticking.
      rafRef.current = requestAnimationFrame(tick);
    };

    ensureSize(true);

    // Extra mobile safety: VisualViewport changes when address bar shows/hides.
    const vv = window.visualViewport;
    const vvHandler = () => ensureSize(true);
    const onResize = () => ensureSize(true);

    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener("resize", onResize, { passive: true });
    if (vv) {
      vv.addEventListener("resize", vvHandler, { passive: true });
      vv.addEventListener("scroll", vvHandler, { passive: true });
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (vv) {
        vv.removeEventListener("resize", vvHandler);
        vv.removeEventListener("scroll", vvHandler);
      }
      try {
        cancelAnimationFrame(rafRef.current);
      } catch {}
    };
  }, [opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none select-none w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
