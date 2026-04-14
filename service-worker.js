const CACHE_NAME = "jamm-cache-v5";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {

    const request = e.request;

    // ❌ Ignorar cosas externas (chrome extensions, etc)
    if (!request.url.startsWith("http")) return;

    // Solo GET
    if (request.method !== "GET") return;

    e.respondWith(
        fetch(request)
            .then((response) => {

                if (response && response.status === 200) {
                    const clone = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }

                return response;
            })
            .catch(() => caches.match(request))
    );
});