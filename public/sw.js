// public/sw.js - PWA Service Worker with Native Phone Notification Support & Smart Version Invalidation
const _CACHE_NAME = 'kps-cache-v2.6.0';

self.addEventListener('install', (_event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== _CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Handle native push event (Web Push API)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'แจ้งเตือนระบบ', body: event.data.text() };
    }
  }

  const title = data.title || 'โรงเรียนกุดจับประชาสรรค์';
  const options = {
    body: data.body || 'มีการแจ้งเตือนใหม่ในระบบจัดการชั้นเรียน',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'kps-general',
    renotify: true,
    data: data.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification tap / click on native phone
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
