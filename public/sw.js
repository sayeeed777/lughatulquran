// @ts-check
/// <reference lib="webworker" />

/**
 * @typedef {{ tag?: string, waitUntil: (promise: Promise<any>) => void }} SyncEventLike
 */

/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const STATIC_CACHE = "quran-static-v1";
const API_CACHE = "quran-api-v1";
const API_CACHE_MAX_ENTRIES = 120;
const API_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html"
];

// Install event - cache static assets
sw.addEventListener("install", /** @param {ExtendableEvent} event */ (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[ServiceWorker] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener("activate", /** @param {ExtendableEvent} event */ (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE &&
              name !== API_CACHE
            );
          })
          .map((name) => {
            console.log("[ServiceWorker] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  sw.clients.claim();
});

// Fetch event - serve from cache, fallback to network
sw.addEventListener("fetch", /** @param {FetchEvent} event */ (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Do not cache recitation audio; stream directly from network.
  if (url.hostname === "everyayah.com") {
    return;
  }

  // Handle font requests
  if (url.hostname === "verses.quran.foundation") {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // Handle static assets (cache first, network fallback)
  event.respondWith(handleStaticRequest(request));
});

// Cache-first strategy for static assets
/** @param {Request} request */
/** @param {Request} request @returns {Promise<Response>} */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlinePage = await caches.match("/offline.html");
      if (offlinePage) {
        return offlinePage;
      }
    }
    throw error;
  }
}

// Network-first strategy for API requests with cache fallback
/** @param {Request} request */
/** @param {Request} request @returns {Promise<Response>} */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseForCache = networkResponse.clone();
      const cacheHeaders = new Headers(responseForCache.headers);
      cacheHeaders.set("x-sw-cache-time", String(Date.now()));
      const cacheableResponse = new Response(responseForCache.body, {
        status: responseForCache.status,
        statusText: responseForCache.statusText,
        headers: cacheHeaders
      });
      await cache.put(request, cacheableResponse);
      await trimApiCache(cache);
    }
    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cachedAt = Number(cachedResponse.headers.get("x-sw-cache-time") || "0");
      if (cachedAt > 0 && Date.now() - cachedAt > API_CACHE_MAX_AGE_MS) {
        await cache.delete(request);
      } else {
        return cachedResponse;
      }
    }
    const fallbackResponse = await caches.match(request);
    if (fallbackResponse) {
      console.log("[ServiceWorker] Serving API from cache:", url.pathname);
      return fallbackResponse;
    }
    
    // Return a JSON error response
    return new Response(
      JSON.stringify({ error: "You are offline. Please check your connection." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

/** @param {Cache} cache */
async function trimApiCache(cache) {
  const now = Date.now();
  const requests = await cache.keys();

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;
    const cachedAt = Number(response.headers.get("x-sw-cache-time") || "0");
    if (cachedAt > 0 && now - cachedAt > API_CACHE_MAX_AGE_MS) {
      await cache.delete(request);
    }
  }

  const remaining = await cache.keys();
  const overflow = remaining.length - API_CACHE_MAX_ENTRIES;
  if (overflow <= 0) return;

  for (let index = 0; index < overflow; index += 1) {
    const request = remaining[index];
    if (request) {
      await cache.delete(request);
    }
  }
}

// Cache fonts for offline use
/** @param {Request} request */
/** @param {Request} request @returns {Promise<Response>} */
async function handleFontRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Handle background sync for bookmarks/notes
/** @type {any} */ (sw).addEventListener("sync", /** @param {SyncEventLike} event */ (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(syncUserData());
  }
});

async function syncUserData() {
  // Future: sync bookmarks and notes to a backend
  console.log("[ServiceWorker] Syncing user data...");
}

// Handle push notifications (for future use)
sw.addEventListener("push", /** @param {PushEvent} event */ (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "New update available",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    event.waitUntil(
      sw.registration.showNotification(data.title || "OpenFurqan", options)
    );
  }
});

// Handle notification clicks
sw.addEventListener("notificationclick", /** @param {NotificationEvent} event */ (event) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.openWindow("/")
  );
});
