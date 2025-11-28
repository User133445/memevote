// Service Worker for PWA
const CACHE_NAME = "memevote-v2";
const urlsToCache = [
  "/",
  "/feed",
  "/leaderboard",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add URLs to cache, but don't fail if one doesn't exist
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // Skip caching for Next.js internal files and API routes
  if (
    event.request.url.includes("/_next/") ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("?v=")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch((err) => {
        console.warn("Fetch failed:", err);
        // Return a basic response for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        throw err;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  const options = {
    body: event.data?.text() || "Nouvelle notification",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification("MemeVote.fun", options)
  );
});

