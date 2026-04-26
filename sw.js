// Service Worker - 信用卡記帳 PWA
// 版本號：每次更新靜態檔案時遞增
var CACHE_NAME = 'credit-card-pwa-v1';

// 需要快取的靜態資源
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// 安裝：快取靜態資源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      // 立即接管頁面，不等待舊 SW 失效
      return self.skipWaiting();
    })
  );
});

// 啟用：清除舊快取
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 攔截請求：靜態資源用快取，Apps Script 請求直接走網路
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Apps Script 的請求不快取，直接走網路
  if (url.indexOf('script.google.com') !== -1 ||
      url.indexOf('googleapis.com') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他請求：先查快取，沒有再走網路
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // 成功取得後也存入快取
        var toCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, toCache);
        });
        return response;
      });
    }).catch(function() {
      // 完全離線時，回傳快取的首頁
      return caches.match('/index.html');
    })
  );
});
