self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => new Response('offline', { status: 503 })));
});

const API_CACHE = 'fae-api-v1';
const SYNC_QUEUE = [];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Cache GET vitrine/referral-tree
  if(event.request.method === 'GET' && (url.pathname.includes('/api/vitrine') || url.pathname.includes('/api/referral/tree'))){
    event.respondWith(caches.open(API_CACHE).then(cache => fetch(event.request).then(r => { cache.put(event.request, r.clone()); return r; }).catch(()=>cache.match(event.request))));
    return;
  }
  // Queue POST for referral/coupons when offline
  if(event.request.method === 'POST' && (url.pathname.includes('/api/referral') || url.pathname.includes('/api/coupons'))){
    event.respondWith(fetch(event.request).catch(async ()=>{
      const body = await event.request.clone().text();
      SYNC_QUEUE.push({ url: event.request.url, body, headers: [...event.request.headers] });
      return new Response(JSON.stringify({ ok: true, queued: true }), { headers: { 'Content-Type':'application/json' } });
    }));
  }
});

async function flushQueue(){
  while(SYNC_QUEUE.length){
    const job = SYNC_QUEUE.shift();
    try{ await fetch(job.url, { method:'POST', headers: job.headers, body: job.body }); }catch(e){ /* keep trying later */ }
  }
}
self.addEventListener('sync', (e)=>{ if(e.tag==='faeSync') e.waitUntil(flushQueue()); });
self.addEventListener('online', flushQueue);
