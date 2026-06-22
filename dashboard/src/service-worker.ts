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

  // Cross-origin (weather/IP APIs, remote images): straight to network, with a
  // cache fallback so anything we happened to store still works offline.
  if (!sameOrigin) {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(request)) || Response.error())
    );
    return;
  }

  // Same-origin: serve from cache FIRST so a new tab paints instantly, then
  // refresh the cache in the background (stale-while-revalidate). Build/static
  // assets are content-hashed and the precache is version-keyed, so the cached
  // shell and its assets always match.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const isNav = request.mode === 'navigate';

      const cached =
        (await cache.match(request)) ||
        (isNav ? (await cache.match(`${base}/`)) || (await cache.match('/')) : undefined);

      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => undefined);

      // Don't block paint on the revalidation when we have a cache hit.
      if (cached) {
        event.waitUntil(network.then(() => undefined));
        return cached;
      }
      return (await network) || new Response('Offline', { status: 503, statusText: 'Offline' });
    })()
  );
});
