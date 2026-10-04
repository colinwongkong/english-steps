/* English Steps Service Worker
 * 缓存策略：
 * - HTML 页面：网络优先（保证文章更新即时可见），离线时回退缓存
 * - JS/CSS/图片/音频：缓存优先 + 后台更新（stale-while-revalidate）
 *
 * 发布新内容后如需强制刷新缓存，请递增下方 CACHE_VERSION。
 */
const CACHE_VERSION = 'english-steps-v18';
const CORE_ASSETS = [
  './',
  './index.html',
  './article.html',
  './music.html',
  './music-player.html',
  './guide.html',
  './site.css',
  './articles.js',
  './new-articles.js',
  './home.js',
  './article.js',
  './article-audio.js',
  './generated-article-audio.js',
  './dictionary-a1.js',
  './dictionary-a2.js',
  './dictionary-b1.js',
  './dictionary-b2.js',
  './dictionary-c1.js',
  './dictionary-c2.js',
  './music-data.js',
  './music.js',
  './music-player.js',
  './manifest.json',
  './images/icons/icon-192.png',
  './images/icons/icon-512.png',
  './images/icons/icon-maskable-512.png',
  './fonts/fonts.css',
  './fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6h9Q.woff2',
  './fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2',
  './fonts/cY9AfjOCX1hbuyalUrK439HyjJBG.woff2',
  './fonts/cY9AfjOCX1hbuyalUrK439DyjJBG.woff2',
  './fonts/cY9AfjOCX1hbuyalUrK4397yjA.woff2',
  './images/hero-banner.png',
  './images/hub-reading.png',
  './images/hub-music.png',
  './images/hub-guide.png',
  './images/home-promo.png',
  './images/music-hero.png',
  './images/guide-hero.png',
  './images/song-covers/you-and-me.png',
  './images/song-covers/keep-going.png',
  './images/song-covers/a1-sunny-day.png',
  './images/song-covers/a1-my-family.png',
  './images/song-covers/a2-bright-city.png',
  './images/song-covers/a2-sunday-pancakes.png',
  './images/song-covers/a2-best-friends.png',
  './images/song-covers/b1-summer-trip.png',
  './images/song-covers/b1-my-first-job.png',
  './images/song-covers/b2-who-i-am.png',
  './images/song-covers/b2-seasons-change.png',
  './images/song-covers/b2-second-chances.png',
  './images/song-covers/c1-beyond-the-sky.png',
  './images/song-covers/c1-memories-in-the-rain.png',
  './images/song-covers/c1-a-better-world.png',
  './images/song-covers/c2-fading-sunset.png',
  './images/song-covers/c2-the-quiet-battle.png',
  './images/song-covers/c2-threads-of-tomorrow.png',
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

  // 跨域请求：只走网络，不缓存
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

  // 音频（整首 mp3）：网络优先，失败回退缓存。不预缓存、不对流式 Range 请求缓存，避免缓存损坏。
  if (url.pathname.match(/\.mp3$/)) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
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
