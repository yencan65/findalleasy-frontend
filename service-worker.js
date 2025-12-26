// ============================================================================
// SERVICE WORKER (KILL-SWITCH)
// ----------------------------------------------------------------------------
// This project intentionally keeps Service Worker OFF in production for now.
// Historically, a caching SW could trap users on an old index.html that references
// hashed assets that no longer exist after a deploy, causing a blank screen.
//
// If a previous deployment registered this SW, this script self-unregisters and
// clears caches to recover the site.
// ============================================================================

self.addEventListener("install", (event) => {
  // Activate immediately so we can clean up ASAP.
  event.waitUntil(self.skipWaiting());
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
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const c of clients) {
          // Trigger a reload so the page detaches from the old SW.
          try { c.navigate(c.url); } catch {}
        }
      } catch {}

      try {
        await self.clients.claim();
      } catch {}
    })()
  );
});

// No fetch handler on purpose.
