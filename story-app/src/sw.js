const CACHE_NAME = 'storyapp-v1';
const DYNAMIC_CACHE = 'storyapp-dynamic-v1';


const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/images/logo.png',
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});


self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});


self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  
  if (url.hostname === 'story-api.dicoding.dev') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('tile.opentopomap.org') ||
    url.hostname.includes('arcgisonline.com')
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: true, message: 'Offline — data tidak tersedia', listStory: [] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}


self.addEventListener('push', (event) => {
  let data = {
    title: 'Story App',
    body: 'Ada cerita baru!',
    icon: '/images/logo.png',
    badge: '/favicon.png',
    storyId: null,
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/logo.png',
    badge: data.badge || '/favicon.png',
    vibrate: [100, 50, 100],
    data: { storyId: data.storyId, url: data.storyId ? `/#/` : '/' },
    actions: [
      {
        action: 'view',
        title: 'Lihat Cerita',
      },
      {
        action: 'dismiss',
        title: 'Tutup',
      },
    ],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});


self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drafts') {
    event.waitUntil(syncDrafts());
  }
});

async function syncDrafts() {
  
  const clientList = await clients.matchAll({ type: 'window' });
  clientList.forEach((client) => {
    client.postMessage({ type: 'SYNC_DRAFTS' });
  });
}
