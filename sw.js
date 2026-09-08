// Offline sau lần tải đầu. Không dùng thư viện, không tệp ảnh, không tệp âm thanh.
const CACHE = 'game-quy-dao-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(new Request('./', { cache: 'reload' }))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('game-quy-dao-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('./', c)); return r })
        .catch(() => caches.match('./').then((r) => r || Response.error())),
    )
    return
  }
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c))
      }
      return r
    }).catch(() => Response.error())),
  )
})
