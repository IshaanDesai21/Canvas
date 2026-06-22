/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

/**
 * Offline service worker for the new-tab dashboard.
 *
 * Because every new tab loads this hosted page, it must survive having no
 * connection. On install we precache the entire app shell (built JS/CSS,
 * static files, and the prerendered HTML). Navigations and assets are then
 * served from cache when the network is unavailable, so a fresh tab still
 * opens instantly offline. Widgets that need live data (weather, etc.) fall
 * back to their own graceful "unavailable / last known" states.
 */
import { build, files, prerendered, version, base } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `canvas-cache-${version}`;

// The app itself + static files + prerendered HTML (the shell at `/`).
const PRECACHE = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      await sw.skipWaiting();
    })()
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous deployments.
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await sw.clients.claim();
    })()
  );
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === sw.location.origin;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      // Cache-first for our own precached build/static assets — they're
      // content-hashed, so a cache hit is always correct.
      if (sameOrigin && PRECACHE.includes(url.pathname)) {
        const hit = await cache.match(url.pathname);
        if (hit) return hit;
      }

      // Otherwise network-first, falling back to cache when offline.
      try {
        const response = await fetch(request);
        // Stash good same-origin responses so they're available offline next time.
        if (sameOrigin && response.ok && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;

        // For page navigations, serve the cached app shell so the dashboard
        // still boots with no connection.
        if (request.mode === 'navigate') {
          const shell =
            (await cache.match(`${base}/`)) ||
            (await cache.match('/')) ||
            (await cache.match(`${base}/index.html`));
          if (shell) return shell;
        }

        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })()
  );
});
