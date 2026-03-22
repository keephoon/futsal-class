// Minimal service worker — enables PWA installability on Android
const CACHE = 'futsal-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  // network-first: just pass through
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})
