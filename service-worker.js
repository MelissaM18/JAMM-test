const CACHE_NAME = "jamm-cache-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

/* ================= INSTALL ================= */
self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("📦 Cacheando archivos estáticos");
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting();
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("🧹 Borrando caché viejo:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

/* ================= FETCH ================= */
self.addEventListener("fetch", e => {

    const request = e.request;

    // 🔥 IMPORTANTE: ignorar TODO lo que no sea de tu dominio
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    // Solo manejar GET
    if (request.method !== "GET") {
        return;
    }

    e.respondWith(
        fetch(request)
            .then(response => {

                // Guardar en cache solo si es válido
                if (response && response.status === 200) {
                    const clone = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Si no hay internet, usar cache
                return caches.match(request);
            })
    );
});