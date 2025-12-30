// src/lib/aiBridge.js
import { API_BASE } from "../utils/api";
const BACKEND = API_BASE || "";

export async function aiSearch(q, region, locale){
  const r = await fetch(`${BACKEND}/api/search`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ query:q, region, locale })
  });
  const j = await r.json();
  const cards = Array.isArray(j.cards) ? j.cards : [];
  // vitrine push
  window.dispatchEvent(new CustomEvent('vitrin:update', { detail:{ cards }}));
  return cards;
}

export async function aiVision(imageBase64, locale){
  const r = await fetch(`${BACKEND}/api/vision`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ imageBase64, locale })
  });
  const j = await r.json();
  if (j?.query) window.dispatchEvent(new CustomEvent('ai:search', { detail:{ q:j.query }}));
  return j;
}

export async function aiSuggest(seed='', region='', locale=''){
  const r = await fetch(`${BACKEND}/api/ai/suggest`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ seed, region, locale })
  });
  const j = await r.json();
  const cards = j?.cards || [];
  window.dispatchEvent(new CustomEvent('ai:suggest', { detail:{ cards }}));
  return cards;
}
