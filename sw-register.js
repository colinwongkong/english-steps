/* 注册 Service Worker：使网站可作为 PWA 安装到手机主屏并支持离线 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function (error) {
      console.warn('Service Worker 注册失败：', error);
    });
  });
}
