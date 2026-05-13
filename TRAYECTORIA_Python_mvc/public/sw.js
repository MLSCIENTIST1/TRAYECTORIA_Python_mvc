// ═══════════════════════════════════════════════════════════════════════════════
// TuKomercio — Service Worker v1.0.0
// Estrategia: cache-first para assets estáticos, network-first para API/HTML
// ═══════════════════════════════════════════════════════════════════════════════

const SW_VERSION   = '1.2.0';
const CACHE_NAME   = `tukomercio-v${SW_VERSION}`;
const LOG          = (msg, ...args) => console.log(`[SW ${SW_VERSION}] ${msg}`, ...args);
const LOG_WARN     = (msg, ...args) => console.warn(`[SW ${SW_VERSION}] ⚠️ ${msg}`, ...args);
const LOG_ERROR    = (msg, ...args) => console.error(`[SW ${SW_VERSION}] ❌ ${msg}`, ...args);

// Assets que se pre-cachean en el install
const PRECACHE_ASSETS = [
    // ── Tienda pública ───────────────────────────────────────────
    '/assets/tienda/tienda.css',
    '/assets/tienda/product-detail.css',
    '/assets/tienda/tienda.js',
    '/assets/tienda/product-detail.js',
    // ── TuKomercio app (admin/tendero) ───────────────────────────
    '/tukomercio-manifest.json',
    '/login.html',
    '/assets/icons/pwa-192.svg',
    '/assets/icons/pwa-512.svg',
    '/assets/img/tuko-favicon.svg',
];

// Hosts de la API (nunca cachear, siempre red)
const API_HOSTS = [
    'trayectoria-rxdc1-8080.onrender.com',
    'onrender.com',
];

// ─────────────────────────────────────────────────────────────────────────────
// INSTALL: pre-cachear assets estáticos
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    LOG(`✅ Instalando (cache: ${CACHE_NAME})`);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                LOG(`📦 Pre-cacheando ${PRECACHE_ASSETS.length} assets estáticos...`);
                // addAll pero tolerante a fallos individuales
                return Promise.allSettled(
                    PRECACHE_ASSETS.map(url =>
                        cache.add(url).catch(err => {
                            LOG_WARN(`Pre-cache omitido (${url}): ${err.message}`);
                        })
                    )
                );
            })
            .then(results => {
                const ok  = results.filter(r => r.status === 'fulfilled').length;
                const bad = results.filter(r => r.status === 'rejected').length;
                LOG(`📦 Pre-cache completo — ${ok} OK, ${bad} omitidos`);
                return self.skipWaiting(); // activa inmediatamente
            })
            .catch(err => {
                LOG_ERROR(`Fallo en install: ${err.message}`);
                // No bloqueamos la instalación aunque falle el caché
                return self.skipWaiting();
            })
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATE: limpiar caches viejas
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    LOG(`🔄 Activando v${SW_VERSION}...`);

    event.waitUntil(
        caches.keys()
            .then(allKeys => {
                const old = allKeys.filter(k => k.startsWith('tukomercio-') && k !== CACHE_NAME);
                if (old.length === 0) {
                    LOG('✅ No hay caches viejas que limpiar');
                } else {
                    LOG(`🗑️ Limpiando ${old.length} cache(s) antigua(s): ${old.join(', ')}`);
                }
                return Promise.all(old.map(k => caches.delete(k)));
            })
            .then(() => {
                LOG('✅ Activate completo — tomando control de todas las tabs');
                return self.clients.claim();
            })
            .catch(err => {
                LOG_ERROR(`Fallo en activate: ${err.message}`);
                return self.clients.claim();
            })
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// FETCH: estrategia por tipo de recurso
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Solo interceptar GET
    if (req.method !== 'GET') return;

    // ── 1. LLAMADAS A LA API → siempre red, nunca caché ──────────────────────
    const esApi = API_HOSTS.some(host => url.hostname.includes(host))
               || url.pathname.startsWith('/api/');

    if (esApi) {
        // Dejar que el navegador maneje normalmente, sin interferir
        LOG(`🌐 [API - sin intercepción] ${url.pathname.slice(0, 60)}`);
        return;
    }

    // ── 2. ASSETS ESTÁTICOS → cache-first, red como fallback ─────────────────
    const esAsset = url.pathname.startsWith('/assets/')
                 || url.pathname.endsWith('.css')
                 || url.pathname.endsWith('.js')
                 || url.pathname.startsWith('/assets/icons/');

    if (esAsset) {
        event.respondWith(
            caches.match(req)
                .then(cached => {
                    if (cached) {
                        LOG(`📦 [cache-first HIT] ${url.pathname}`);
                        return cached;
                    }
                    LOG(`🌐 [cache-first MISS → red] ${url.pathname}`);
                    return fetch(req)
                        .then(response => {
                            if (!response || !response.ok) {
                                LOG_WARN(`Red respondió ${response?.status} para ${url.pathname}`);
                                return response;
                            }
                            // Guardar en caché para la próxima vez
                            const toCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(req, toCache))
                                .catch(e => LOG_WARN(`No se pudo guardar en caché ${url.pathname}: ${e.message}`));
                            return response;
                        })
                        .catch(err => {
                            LOG_ERROR(`Sin red y sin caché para ${url.pathname}: ${err.message}`);
                            // No podemos hacer nada más
                            throw err;
                        });
                })
                .catch(err => {
                    LOG_ERROR(`caches.match falló para ${url.pathname}: ${err.message}`);
                    return fetch(req);
                })
        );
        return;
    }

    // ── 3. PÁGINAS HTML → network-first, caché como offline fallback ──────────
    const esHtml = req.headers.get('accept')?.includes('text/html')
                || url.pathname.endsWith('.html')
                || url.pathname.endsWith('/');

    if (esHtml) {
        event.respondWith(
            fetch(req)
                .then(response => {
                    if (!response.ok) {
                        LOG_WARN(`HTML respondió ${response.status} para ${url.pathname}`);
                        return response;
                    }
                    // Guardar versión fresca para offline
                    const toCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(req, toCache))
                        .catch(e => LOG_WARN(`Caché HTML falló ${url.pathname}: ${e.message}`));
                    LOG(`✅ [network-first HTML] ${url.pathname}`);
                    return response;
                })
                .catch(err => {
                    LOG_WARN(`Sin red para HTML ${url.pathname} — intentando caché offline: ${err.message}`);
                    return caches.match(req)
                        .then(cached => {
                            if (cached) {
                                LOG(`📦 [offline fallback OK] ${url.pathname}`);
                                return cached;
                            }
                            LOG_ERROR(`Sin red y sin caché offline para ${url.pathname}`);
                            throw err;
                        });
                })
        );
        return;
    }

    // ── 4. Todo lo demás → red normal sin intercepción ───────────────────────
    // (fuentes de Google, CDN externos, imágenes externas)
});

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJE desde la página (para forzar update o limpiar caché)
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
    const { type } = event.data || {};
    LOG(`📨 Mensaje recibido: type=${type}`);

    if (type === 'SKIP_WAITING') {
        LOG('🔄 SKIP_WAITING solicitado — activando nueva versión');
        self.skipWaiting();
    }

    if (type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME)
            .then(ok => LOG(`🗑️ Cache limpiada (${CACHE_NAME}): ${ok}`))
            .catch(e => LOG_ERROR(`Error limpiando caché: ${e.message}`));
    }

    if (type === 'GET_VERSION') {
        event.source?.postMessage({ type: 'VERSION', version: SW_VERSION, cache: CACHE_NAME });
    }
});

LOG(`📋 Service Worker cargado — versión ${SW_VERSION}, cache: ${CACHE_NAME}`);
