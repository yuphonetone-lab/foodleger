/* 食帳 FOOD LEDGER — Service Worker（離線快取） */
const CACHE = "foodledger-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API 呼叫（AI 分析）永遠走網路，不快取
  if (url.hostname === "api.anthropic.com") return;
  // 其餘資源：快取優先、失敗才走網路（離線可用）
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((res) => {
          // 動態快取字型等靜態資源
          if (e.request.method === "GET" && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
    ).catch(() => caches.match("./index.html"))
  );
});
