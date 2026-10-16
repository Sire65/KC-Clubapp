// 2.431.0 KC-CLUB-ELTERN: eigener kleiner Service Worker der Elternseite (Bereich eltern/) – nur Hinweise anzeigen, nichts speichern.
// Er sieht nie Nachrichten oder Chats: der Server schickt nur Titel + einen kurzen Satz (z. B. „Morgen Köcheclub – Lena“).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const titel = String(d.title || "Köcheclub Werne").slice(0, 140);
  e.waitUntil(self.registration.showNotification(titel, { body: String(d.body || "").slice(0, 300), icon: "../icon-192.png", badge: "../icon-192.png", tag: "kc-eltern-" + Date.now(), data: { url: "./" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const liste = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const offen = liste.find((c) => new URL(c.url).pathname.includes("/eltern/"));
    if (offen) return offen.focus();
    return self.clients.openWindow(new URL("./", self.registration.scope).href);
  })());
});
