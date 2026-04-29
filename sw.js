// 信用卡記帳 PWA Service Worker (redirect version)
const CACHE_NAME = 'credit-pwa-redirect-v1.0';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))),
      self.clients.claim()
    ])
  );
});

// 只快取本站資源（icon、index.html、manifest）
// Apps Script 不快取，永遠走網路
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  
  if (req.method !== 'GET') return;
  // 只處理同源請求
  if (url.origin !== self.location.origin) return;
  
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
