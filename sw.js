/* ==========================================================================
   sw.js — the service worker that makes the app work offline
   --------------------------------------------------------------------------
   The first time you open the app, this saves a copy of every file it needs.
   After that, the app loads from that copy, with or without internet.

   When you change any app file, bump CACHE_VERSION so phones fetch the
   new files instead of keeping the old copy.
   ========================================================================== */

const CACHE_VERSION = 'moonlit-v2';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/data.js',
  './js/storage.js',
  './js/icons.js',
  './js/screens.js',
  './js/app.js',
  './assets/lily.jpg',
  './assets/grass.jpg',
  './assets/meadow.jpg',
  './assets/fonts/cormorant-garamond-latin-300-italic.woff2',
  './assets/fonts/cormorant-garamond-latin-300-normal.woff2',
  './assets/fonts/cormorant-garamond-latin-400-italic.woff2',
  './assets/fonts/cormorant-garamond-latin-400-normal.woff2',
  './assets/fonts/cormorant-garamond-latin-500-italic.woff2',
  './assets/fonts/cormorant-garamond-latin-500-normal.woff2',
  './assets/fonts/cormorant-garamond-latin-600-normal.woff2',
  './assets/fonts/nunito-sans-latin-400-normal.woff2',
  './assets/fonts/nunito-sans-latin-600-normal.woff2',
  './assets/fonts/nunito-sans-latin-700-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// 1. Install: save every file
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

// 2. Activate: delete copies from older versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// 3. Fetch: answer from the saved copy first; fall back to the network
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(saved => {
      if (saved) return saved;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
