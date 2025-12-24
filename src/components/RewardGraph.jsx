
// src/components/RewardGraph.jsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const BURL = import.meta.env.VITE_BACKEND_URL;

export default function RewardGraph({ userId, onClose }){
  const ref = useRef(null);

  useEffect(()=>{
    let svg, sim;
    const w = Math.min(900, window.innerWidth*0.9);
    const h = Math.min(600, window.innerHeight*0.8);

    async function load(){
      const r = await fetch(`${BURL}/api/referral/tree/deep/${encodeURIComponent(userId)}`);
      const j = await r.json();
      if(!j.ok || !j.tree) return;

      const nodes = [];
      const links = [];
      function walk(n){
        nodes.push({ id: n.id, label: (n.name || (n.email ? n.email.split('@')[0] : 'Kullanıcı')), spent: n.totalSpent||0 });
        if(n.children) n.children.forEach(ch => { links.push({ source: n.id, target: ch.id }); walk(ch); });
      }
      walk(j.tree);

      svg = d3.select(ref.current).append("svg").attr("width", w).attr("height", h);
      const g = svg.append("g");

      // zoom & pan
      svg.call(d3.zoom().on("zoom", (ev)=>{ g.attr("transform", ev.transform); }));

      sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d=>d.id).distance(80).strength(0.6))
        .force("charge", d3.forceManyBody().strength(-120))
        .force("center", d3.forceCenter(w/2, h/2));

      const link = g.append("g").attr("stroke", "rgba(255,255,255,0.2)").selectAll("line").data(links).enter().append("line").attr("stroke-width", 1.2);

      const node = g.append("g").selectAll("g").data(nodes).enter().append("g").attr("cursor","pointer");

      node.append("circle")
        .attr("r", d => Math.max(8, Math.log10((d.spent||1)) * 6))
        .attr("fill", "#111")
        .attr("stroke", "#d4af37")
        .attr("stroke-width", 1.2);

      node.append("text")
        .text(d => d.label)
        .attr("x", 10).attr("y", 4)
        .attr("fill", "white").attr("font-size", 11);

      node.call(d3.drag()
        .on("start", (event, d) => { if(!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => { if(!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

      sim.on("tick", ()=>{
        link.attr("x1", d=>d.source.x).attr("y1", d=>d.source.y).attr("x2", d=>d.target.x).attr("y2", d=>d.target.y);
        node.attr("transform", d=>`translate(${d.x},${d.y})`);
      });
    }

    load();
    return ()=>{ if(svg) svg.remove(); if(sim) sim.stop(); };
  }, [userId]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-950 border border-[#d4af37]/40 rounded-2xl p-3 w-[95vw] max-w-[980px] max-h-[86vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-lg">Davet Ağı (Animasyonlu)</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div ref={ref} className="w-full h-[72vh] bg-neutral-900 rounded-xl border border-white/5" />
      </div>
    </div>
  );
}
