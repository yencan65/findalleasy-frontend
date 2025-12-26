// ============================================================================
// FindAllEasy Service Worker — SAFE MODE
// Goal: NEVER break the site after a new deploy (no stale index.html lock-in).
// Strategy:
//  - Navigation: NETWORK-FIRST (fallback to cached index/offline)
//  - Static assets: CACHE-FIRST (hashed /assets/* is safe)
//  - Always cleanup old caches on activate
// ============================================================================

const CACHE_PREFIX = "findalleasy-sw";
const SW_VERSION = "2025-12-26"; // bump manually when you change SW behavior
const NAV_CACHE = `${CACHE_PREFIX}-nav-${SW_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}-asset-${SW_VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    self.skipWaiting();

    const cache = await caches.open(NAV_CACHE);
    try {
      await cache.addAll([OFFLINE_URL, "/manifest.json", "/manifest.webmanifest"]);
    } catch {
      // ignore
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && ![NAV_CACHE, ASSET_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

function isAssetRequest(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        const cache = await caches.open(NAV_CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(NAV_CACHE);
        return (
          (await cache.match(req)) ||
          (await cache.match("/")) ||
          (await cache.match(OFFLINE_URL)) ||
          new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
        );
      }
    })());
    return;
  }

  if (isAssetRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;

      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // default: passthrough (do NOT cache API)
});
