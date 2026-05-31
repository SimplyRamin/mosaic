const { cache } = require("react");

const CACHE_NAME = 'makanplus-v1';

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
    self.skipWaiting();
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
        })
    );
    self.clients.claim();
});

// Fetch - serve from cache, fall back to network
self.addEventListener('fetch', function(e) {
    // Skip API calls - always go to network for those
    if (e.request.url.includes('/api/')) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then(function(cached) {
            return cached || fetch(e.request);
        })
    );
});