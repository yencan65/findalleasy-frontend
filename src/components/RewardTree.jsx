
// src/components/RewardTree.jsx
import React, { useEffect, useState } from "react";

const BURL = import.meta.env.VITE_BACKEND_URL;

function Node({node}){
  return (
    <li className='ml-4 my-2'>
      <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/60 border border-white/5 text-white text-sm'>
        <span>{node.name || (node.email ? node.email.split('@')[0] : 'Kullanıcı')}</span>
        {typeof node.totalSpent==='number' && <span className='text-white/60 text-xs'>· {(node.totalSpent||0).toFixed(2)} ₺</span>}
      </div>
      {node.children && node.children.length>0 && (
        <ul className='border-l border-white/10 ml-4 pl-4 mt-2'>
          {node.children.map(ch => <Node key={ch.id} node={ch} />)}
        </ul>
      )}
    </li>
  );
}


export default function RewardTree({ userId, onClose }){
  const [items, setItems] = useState([]);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(()=>{
    async function load(){
      try{
        const r = await fetch(`${BURL}/api/referral/tree/${encodeURIComponent(userId)}`);
        const j = await r.json();
        if(j.ok){ setItems(j.invited || []); setTree(j.tree||null); }
        else setErr(j.error || "Hata");
      }catch(e){ setErr(e.message); } finally { setLoading(false); }
    }
    if(userId) load();
  },[userId]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-neutral-900 border border-[#d4af37]/40 rounded-2xl p-4 w-[92vw] max-w-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-lg">Davet Ağacı</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        {loading ? <p className="text-white/70">Yükleniyor…</p> :
        err ? <p className="text-red-400">{err}</p> :
        (!tree || !tree.children || tree.children.length===0) ? <p className="text-white/70">Henüz davet ettiğin kimse yok.</p> :
        <ul className="space-y-2 max-h-[60vh] overflow-auto pr-2">
          {/* hierarchical tree */}
          <ul className='mt-2'>
            <Node node={tree} />
          </ul>
          {/* flat fallback */}
          {items.map((u)=> (
            <li key={u.id} className="p-3 rounded-xl bg-neutral-800/60 border border-white/5">
              <div className="text-white">{u.name || (u.email ? u.email.split("@")[0] : "Kullanıcı")}</div>
              <div className="text-white/60 text-sm">Toplam harcama: {(u.totalSpent||0).toFixed(2)} ₺</div>
            </li>
          ))}
        </ul>}
      </div>
    </div>
  );
}
