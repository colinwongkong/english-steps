/* English Steps Service Worker
 * 缓存策略：
 * - HTML 页面：网络优先（保证文章更新即时可见），离线时回退缓存
 * - JS/CSS/图片/音频：缓存优先 + 后台更新（stale-while-revalidate）
 * - 跨域请求（在线词典接口）：直接走网络，不缓存
 *
 * 发布新内容后如需强制刷新缓存，请递增下方 CACHE_VERSION。
 */
const CACHE_VERSION = 'english-steps-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './article.html',
  './site.css',
  './articles.js',
  './new-articles.js',
  './home.js',
  './article.js',
  './article-audio.js',
  './generated-article-audio.js',
  './manifest.json',
  './images/icons/icon-192.png',
  './images/icons/icon-512.png',
  './images/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // 跨域请求（如在线词典 API）：只走网络，不缓存
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 导航请求（打开页面）：网络优先，离线回退缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：缓存优先 + 后台更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
