// Version: 1.3 - should update this on every deployment
const CACHE_VERSION = 'makanplus-v1';
const CACHE_NAME = `makanplus-${CACHE_VERSION}`;

// Files to cache for offline use
const ASSETS = [
    '/',
    '/index.html',
    '/screens/home.html',
    '/screens/search.html',
    '/screens/profile.html',
    '/screens/camera.html',
    '/screens/forgot-password.html',
    '/css/main.css',
    '/css/login.css',
    '/css/home.css',
    '/css/search.css',
    '/css/profile.css',
    '/css/camera.css',
    '/css/forgot-password.css',
    '/js/app.js',
    '/js/login.js',
    '/js/home.js',
    '/js/search.js',
    '/js/profile.js',
    '/js/camera.js',
    '/js/forgot-password.js',
    '/assets/icons/logo-wordmark.png',
    '/assets/icons/icon-pwa.png',
    '/assets/icons/icons.svg',
    '/assets/fonts/Vazirmatn-Regular.woff2',
    '/assets/fonts/Vazirmatn-Medium.woff2',
    '/assets/fonts/Vazirmatn-Bold.woff2',
    '/assets/fonts/Vazirmatn-Light.woff2'
];

// Install - cache all assets
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate - clean up old caches
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys
                    .filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch - network first for HTML, cache first for assets
self.addEventListener('fetch', function(e) {
    // Skip API calls - always go to network for those
    if (e.request.url.includes('/api/')) return;

    const isHTML = e.request.headers.get('accept') &&
                   e.request.headers.get('accept').includes('text/html');

    if (isHTML){
        // Network first for HTML - always get fresh pages
        e.respondWith(
            fetch(e.request)
                .then(function(response) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                    return response;
                })
                .catch(function() {
                    return caches.match(e.request);
                })
        );
    } else {
        // Cache first for assets - CSS, JS, fonts, images
        e.respondWith (
            caches.match(e.request).then(function(cached){
                return cached || fetch(e.request).then(function(response) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                    return response;
                });
            })
        );
    }
});

// Listen for skip waiting message from app
self.addEventListener('message', function(e) {
    if (e.data === 'skipWaiting') {
        self.skipWaiting();
    }
});