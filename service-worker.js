const CACHE_NAME = "jamm-cache-v1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/app.js",
    "/manifest.json"
];

// INSTALACIÓN
self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

// ACTIVACIÓN
self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// FETCH (modo offline)
self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request)
            .then(response => response || fetch(e.request))
    );
});