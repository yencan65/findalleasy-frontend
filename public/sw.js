// ============================================================================
// SW.KILL-SWITCH
// ----------------------------------------------------------------------------
// Why this exists:
// - Older deployments may have registered /sw.js.
// - If that SW cached an old index.html that points to now-missing hashed assets,
//   users see a blank page after deploy.
//
// Current stance:
// - We do NOT ship offline caching yet.
// - This SW self-destructs and clears caches, so the origin returns to normal.
// ============================================================================

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}

      try {
        await self.registration.unregister();
      } catch {}

      try {
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        clients.forEach((c) => {
          try {
            // Force a reload so the page is no longer controlled by a dead SW.
            c.navigate(c.url);
          } catch {}
        });
      } catch {}
    })()
  );
});
