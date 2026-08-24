/*
 * Forge's service worker. The engine already runs with no network call; this makes the shell
 * honest about it. Two rules only:
 *
 * 1. Hashed build assets (/_next/static/) are immutable, so they are cached first-hit and served
 *    cache-first forever. A new deploy has new hashes, so nothing here can go stale.
 * 2. Pages are network-first: the network wins when it is there, and the last good copy of a
 *    visited page answers when it is not. A route never visited while online stays honest and
 *    fails: this worker caches what you used, it does not pretend to have what you never fetched.
 */
const ASSETS = 'forge-assets-v1';
const PAGES = 'forge-pages-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([ASSETS, PAGES]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // A prefetch the page abandoned rejects here; turning that into a worker error would make
        // an aborted hint look like a broken script, so the failure passes through untouched.
        const fresh = await fetch(event.request);
        if (fresh.ok) {
          const cache = await caches.open(ASSETS);
          try {
            await cache.put(event.request, fresh.clone());
          } catch {
            // A full or evicted cache is not a reason to fail the page.
          }
        }
        return fresh;
      })().catch(() => fetch(event.request)),
    );
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname.endsWith('.txt')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request);
          if (fresh.ok) {
            const cache = await caches.open(PAGES);
            await cache.put(event.request, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          throw new Error('offline, and this page was never visited');
        }
      })(),
    );
  }
});
