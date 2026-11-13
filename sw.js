// 사천성 머지 서비스 워커: 한 번 받은 그림은 저장해 두고, 화면과 코드는 새 것을 먼저 받는다
const V = 'scm-v1.0.0';
const CORE = ['./', 'art.js?v=34', 'paints.js?v=34', 'art/title.webp', 'art/pediment.png', 'art/sprig.png', 'manifest.webmanifest', 'icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)).catch(() => {}); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // 순위·협동은 늘 새로 받는다
  const same = url.origin === location.origin;
  const page = req.mode === 'navigate' || (same && /\.(html|js|webmanifest)$/.test(url.pathname)) || (same && url.pathname.endsWith('/'));
  if (page) { // 새 것 먼저, 안 되면 저장본
    e.respondWith(fetch(req).then(r => put(req, r)).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || caches.match('./'))));
    return;
  }
  if (same || /fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname)) { // 그림·글꼴·라이브러리: 저장본 먼저
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r))));
  }
});
