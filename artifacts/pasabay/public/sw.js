const CACHE_NAME = "pasabay-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith("http://") && !e.request.url.startsWith("https://")) return;
  if (e.request.url.startsWith("chrome-extension://")) return;
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(e.request, response.clone());
        return response;
      });
    }).catch(() => caches.match(e.request)))
  );
});
