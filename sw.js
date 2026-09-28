// KC Club-App – Service Worker: Seite zuerst aus dem Netz (offline aus dem Speicher), Push-Benachrichtigungen, Update.
// VERSION muss bei jeder neuen Version mit version.json und APP_VERSION in index.html übereinstimmen.
const VERSION = "0.12.0";
const CACHE = "kc-club-" + VERSION;
const DATEIEN = ["./", "index.html", "manifest.webmanifest", "kc-kochmuetze-weiss.webp", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("kc-club-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "jetzt-aktivieren") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("version.json")) return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const k = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, k)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});

// Push vom KC Communicator: { title, body, data: { url } }
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const titel = d.title || "Köcheclub Werne";
  e.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    fenster.forEach((c) => c.postMessage({ typ: "push", titel }));
    if (self.navigator.setAppBadge) try { await self.navigator.setAppBadge(); } catch {}
    await self.registration.showNotification(titel, {
      body: d.body || d.text || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.data?.url || "kc-club",
      renotify: true, silent: false, vibrate: [120, 60, 120], data: { url: d.data?.url || "./" },
    });
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ziel = e.notification.data?.url || "./";
  e.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of fenster) { if ("focus" in c) { await c.navigate(ziel).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(ziel);
  })());
});
