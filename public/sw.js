// @ts-check
/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const serviceWorkerUrl = new URL(sw.location.href);
const CACHE_VERSION = serviceWorkerUrl.searchParams.get("v") || "dev";
const SHELL_CACHE = `quran-shell-${CACHE_VERSION}`;
const FONT_CACHE = `quran-fonts-${CACHE_VERSION}`;
const ASSET_CACHE = `quran-assets-${CACHE_VERSION}`;
const ACTIVE_CACHES = [SHELL_CACHE, FONT_CACHE, ASSET_CACHE];
const AUDIO_HOSTS = new Set(["everyayah.com", "audio.qurancdn.com"]);
const FONT_HOSTS = new Set(["verses.quran.foundation", "cdn.jsdelivr.net"]);
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

sw.addEventListener("install", /** @param {ExtendableEvent} event */ (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

sw.addEventListener("activate", /** @param {ExtendableEvent} event */ (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("quran-") && !ACTIVE_CACHES.includes(name))
        .map((name) => caches.delete(name))
    );
    await sw.clients.claim();
  })());
});

sw.addEventListener("message", /** @param {ExtendableMessageEvent} event */ (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void sw.skipWaiting();
  }
});

sw.addEventListener("fetch", /** @param {FetchEvent} event */ (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (!url.protocol.startsWith("http")) {
    return;
  }

  if (AUDIO_HOSTS.has(url.hostname)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (FONT_HOSTS.has(url.hostname) || request.destination === "font") {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  if (isCacheableShellAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (isImmutableBuildAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});

/** @param {Request} request */
async function handleNavigationRequest(request) {
  try {
    return await fetch(request);
  } catch {
    const offlineResponse = await caches.match("/offline.html");
    if (offlineResponse) {
      return offlineResponse;
    }

    return new Response("Offline", {
      status: 503,
      statusText: "Offline"
    });
  }
}

/**
 * @param {Request} request
 * @param {string} cacheName
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok || networkResponse.type === "opaque") {
    await cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

/** @param {URL} url */
function isImmutableBuildAsset(url) {
  return url.origin === sw.location.origin && url.pathname.startsWith("/_next/static/");
}

/** @param {URL} url */
function isCacheableShellAsset(url) {
  if (url.origin !== sw.location.origin) {
    return false;
  }

  return (
    url.pathname === "/manifest.json"
    || url.pathname === "/offline.html"
    || url.pathname === "/apple-touch-icon.png"
    || url.pathname === "/favicon.ico"
    || url.pathname.startsWith("/favicon-")
    || url.pathname.startsWith("/icons/")
  );
}
