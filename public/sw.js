// @ts-check
/// <reference lib="webworker" />

/**
 * @typedef {{ tag?: string, waitUntil: (promise: Promise<any>) => void }} SyncEventLike
 */

/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

const CACHE_NAME = "quran-reader-v1";
const STATIC_CACHE = "quran-static-v1";
const DYNAMIC_CACHE = "quran-dynamic-v1";
const API_CACHE = "quran-api-v1";

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html"
];

// API routes to cache
const API_ROUTES = [
  "/api/surahs"
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
              name !== DYNAMIC_CACHE &&
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

  // Handle audio requests (cache with network first)
  if (url.hostname === "everyayah.com") {
    event.respondWith(handleAudioRequest(request));
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
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("[ServiceWorker] Serving API from cache:", url.pathname);
      return cachedResponse;
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

// Cache audio files for offline playback
/** @param {Request} request */
/** @param {Request} request @returns {Promise<Response>} */
async function handleAudioRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response("Audio unavailable offline", { status: 503 });
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
      sw.registration.showNotification(data.title || "Quran Reader", options)
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
