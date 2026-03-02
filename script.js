// ===============================
// PWA OFFLINE SERVICE WORKER
// ===============================

function showOfflineBanner() {
  let banner = document.getElementById("offlineBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "offlineBanner";
    banner.className = "fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50";
    banner.innerText = "Offline Mode Active";
    document.body.appendChild(banner);
  }
}

function hideOfflineBanner() {
  const banner = document.getElementById("offlineBanner");
  if (banner) banner.remove();
}

window.addEventListener("online", hideOfflineBanner);
window.addEventListener("offline", showOfflineBanner);

if (!navigator.onLine) {
  showOfflineBanner();
}

// Register Service Worker dynamically
if ("serviceWorker" in navigator) {
  const swCode = `
    const CACHE_NAME = "ai-workspace-cache-v1";
    const urlsToCache = [
      "/",
      "https://cdn.tailwindcss.com",
      "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
      "https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf/dist/jspdf.umd.min.js"
    ];

    self.addEventListener("install", event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => cache.addAll(urlsToCache))
      );
      self.skipWaiting();
    });

    self.addEventListener("activate", event => {
      event.waitUntil(
        caches.keys().then(keys =>
          Promise.all(
            keys.filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
          )
        )
      );
      self.clients.claim();
    });

    self.addEventListener("fetch", event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            return response || fetch(event.request)
              .then(fetchResponse => {
                return caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                  });
              })
              .catch(() => {
                return new Response("Offline and resource not cached.", {
                  status: 503,
                  statusText: "Offline"
                });
              });
          })
      );
    });
  `;

  const blob = new Blob([swCode], { type: "application/javascript" });
  const swUrl = URL.createObjectURL(blob);

  navigator.serviceWorker.register(swUrl)
    .then(() => {
      console.log("Service Worker Registered");
    })
    .catch(err => {
      console.error("SW registration failed:", err);
    });
}
