const CACHE_PREFIX = "engtojpn-saving-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;

const APP_FILES = [
  "./",
  "./index.html",
  "./script_saving_distribute.js?v-2",
  "./xlsx.full.min.js",
  "./favicon.png",
  "./commonwords.json",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(APP_FILES.map(async path => {
      const request = new Request(
        new URL(path, self.registration.scope),
        { cache: "reload" }
      );
      const response = await fetch(request);

      if (!response.ok) {
        throw new Error(`キャッシュ取得に失敗しました: ${path} (${response.status})`);
      }

      await cache.put(request, response);
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  })());
});