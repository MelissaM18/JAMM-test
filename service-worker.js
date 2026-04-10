const CACHE_NAME = "jamm-cache-v2"; // Incrementamos la versión para forzar actualización

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// INSTALACIÓN: Guarda los archivos esenciales
self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("Cache abierto. Guardando archivos estáticos...");
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting(); // Fuerza al SW a activarse de inmediato
});

// ACTIVACIÓN: Limpia versiones antiguas de caché
self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("Borrando caché antiguo:", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Toma control de las pestañas abiertas de inmediato
});

// FETCH: Estrategia Flexible (Red primero, si falla usa Caché)
self.addEventListener("fetch", e => {
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Si la respuesta es válida, hacemos una copia en el caché
                // Esto asegura que los nuevos recursos se guarden para uso offline
                if (e.request.method === "GET") {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, resClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si falla la red (offline), buscamos en el caché
                return caches.match(e.request);
            })
    );
});