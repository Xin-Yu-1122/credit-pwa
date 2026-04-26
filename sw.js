// Service Worker - 信用卡記帳 PWA
// 修正：使用相對路徑，支援子目錄部署
var CACHE_NAME = 'credit-card-pwa-v2';

// 需要快取的靜態資源（相對路徑）
var STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// 安裝：快取靜態資源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 啟用：清除舊版快取
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

// 攔截請求
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Apps Script / Google API 不快取，直接走網路
  if (url.indexOf('script.google.com') !== -1 ||
      url.indexOf('googleapis.com') !== -1 ||
      url.indexOf('googleusercontent.com') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他請求：先查快取，沒有再走網路
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request).then(function(response) {
        // 只快取同源的成功回應
        if (response && response.status === 200 && response.type === 'basic') {
          var toCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, toCache);
          });
        }
        return response;
      });
    }).catch(function() {
      // 完全離線時回傳首頁
      return caches.match('./index.html');
    })
  );
});
