// Bump this version whenever the offline document changes.
const OFFLINE_CACHE = "text-adventures-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) =>
    cache.add(new Request(OFFLINE_URL, { cache: "reload" })),
  ));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) =>
      name.startsWith("text-adventures-offline-") && name !== OFFLINE_CACHE,
    ).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isGamePage = url.pathname === "/" || url.pathname === "/index.html" ||
    /^\/game\/[^/]+$/.test(url.pathname);

  // Game data, actions, WebSockets, and application bundles always use the network.
  if (request.method !== "GET" || request.mode !== "navigate" ||
      url.origin !== self.location.origin || !isGamePage) return;

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(OFFLINE_CACHE);
      return await cache.match(OFFLINE_URL) || Response.error();
    }
  })());
});
