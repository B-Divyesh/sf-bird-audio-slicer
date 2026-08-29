const CACHE = 'nightjar-shell-v4';
const SHELL = ['/', '/demo/', '/demo/index.html', '/privacy/', '/terms/', '/404.html', '/examples/nightjar-demo.wav', '/nightjar-tape.webp', '/nightjar-social.webp', '/nightjar-mark.svg', '/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const pages = await Promise.all(['/', '/demo/', '/privacy/', '/terms/', '/404.html'].map((path) => fetch(path).then((response) => response.text())));
    const assets = new Set(pages.flatMap((html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])));
    await cache.addAll([...assets]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  const routeFallback = url.pathname.startsWith('/demo') ? '/demo/index.html' : '/';
  event.respondWith((async () => {
    const cached = await caches.match(url.pathname);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(url.pathname, response.clone());
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return caches.match(routeFallback);
      throw error;
    }
  })());
});
