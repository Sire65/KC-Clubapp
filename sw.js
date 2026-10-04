// KC Club-App – Service Worker: Seite zuerst aus dem Netz (offline aus dem Speicher), Push-Benachrichtigungen, Update.
// VERSION muss bei jeder neuen Version mit version.json und APP_VERSION in index.html übereinstimmen.
const VERSION = "2.23.20";
const CACHE = "kc-club-" + VERSION;
const DATEIEN = ["./", "index.html", "manifest.webmanifest", "kc-kochmuetze-weiss.webp", "icon-192.png", "icon-512.png"];

// KC-CLUB-UPDATE-SICHER (1.97.0): beim Einrichten die Dateien am Browser-Zwischenspeicher VORBEI holen (cache: "reload") –
// sonst kann ein neuer Speicher noch die alte Seite enthalten (Mischstand alt/neu, AGENTS Regel 16)
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN.map((u) => new Request(u, { cache: "reload" }))))); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("kc-club-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "jetzt-aktivieren") self.skipWaiting(); });
// KC-CLUB-TEILEN: Fotos aus der Galerie über „Teilen → Köcheclub“ (nur bei richtig installierter App).
// Die Fotos werden kurz im Speicher „kcclub-geteilt“ abgelegt (nicht „kc-club-…“, sonst löscht ein Update sie), dann öffnet die App.
const GETEILT = "kcclub-geteilt";
async function geteiltAnnehmen(req) {
  const f = await req.formData(), c = await caches.open(GETEILT);
  for (const k of await c.keys()) await c.delete(k);
  const dateien = f.getAll("fotos").filter((x) => x && typeof x === "object" && x.size).slice(0, 50);
  for (let i = 0; i < dateien.length; i++)
    await c.put(`geteilt/${i}`, new Response(dateien[i], { headers: { "content-type": dateien[i].type || "application/octet-stream", "x-name": encodeURIComponent(dateien[i].name || `Datei_${i + 1}`) } }));
  // 1.22.0 (KC-CLUB-TEILEN-ALLES): auch Text aus WhatsApp & Co. (bis 4000 Zeichen), Titel und Link; Dateien jeder Art
  await c.put("geteilt/info", new Response(JSON.stringify({ anzahl: dateien.length, text: String(f.get("text") || "").slice(0, 4000), titel: String(f.get("titel") || "").slice(0, 200), url: String(f.get("url") || "").slice(0, 500), zeit: Date.now() })));
  return Response.redirect("./#geteilt", 303);
}
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.origin === location.origin && url.pathname.endsWith("/teilen")) { e.respondWith(geteiltAnnehmen(e.request).catch(() => Response.redirect("./#geteilt", 303))); return; }
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("version.json")) return;
  // KC-CLUB-UPDATE-SICHER (1.97.0): Seitenaufrufe immer frisch beim Server nachfragen (no-cache); nichts mit persönlichem Schlüssel
  // (?k=…) oder Notbetrieb-Schalter speichern; Speichern im waitUntil; offline nur bei Seitenaufrufen die Startseite liefern
  const navi = e.request.mode === "navigate", merken = !url.searchParams.has("k") && !url.pathname.endsWith("notbetrieb.json");
  e.respondWith(fetch(navi ? new Request(e.request, { cache: "no-cache" }) : e.request).then((r) => {
    if (r.ok && merken) { const k = r.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(navi ? url.origin + url.pathname : e.request, k)).catch(() => {})); }
    return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (navi ? caches.match("index.html") : Response.error()))));
});

// Push vom KC Communicator: { title, body, data: { url } }
// KC-CLUB-QUITTUNG (0.34.0): dem KC Communicator melden, dass der Push angezeigt bzw. geöffnet wurde
// (Auftragsnummer kommt im Push mit; die eigene Push-Adresse ordnet die Meldung dem Empfänger zu). Fehler stören nie die Anzeige.
const QUITTUNG_URL = "https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-communication-push-receipt";
async function quittung(requestId, state) {
  if (!requestId) return;
  let endpoint = ""; try { endpoint = (await self.registration.pushManager.getSubscription())?.endpoint || ""; } catch {}
  try { await fetch(QUITTUNG_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, state, endpoint }) }); } catch {}
}
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : "" }; }
  const titel = d.title || "Köcheclub Werne";
  e.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // KC-CLUB-ONLINE-ANSAGE-PUSH (1.64.0): „🟢 X ist jetzt online“ bei offener, sichtbarer App → Ton/Ansage in der App statt Mitteilung
    const online = /^🟢 (.+) ist jetzt online$/.exec(titel), sichtbar = fenster.filter((c) => c.visibilityState === "visible");
    if (online && sichtbar.length) { sichtbar.forEach((c) => c.postMessage({ typ: "online-ansage", name: online[1] })); await quittung(d.data?.requestId, "displayed"); return; }
    // KC-CLUB-SPRACHANSAGEN (1.71.0): Text und Link mitgeben – die offene App sagt an, was das Mitglied ausgewählt hat
    fenster.forEach((c) => c.postMessage({ typ: "push", titel, text: d.body || d.text || "", url: d.data?.url || "" }));
    if (self.navigator.setAppBadge) try { await self.navigator.setAppBadge(); } catch {}
    await self.registration.showNotification(titel, {
      body: d.body || d.text || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.data?.url || "kc-club",
      renotify: true, silent: false, vibrate: [120, 60, 120], data: { url: d.data?.url || "./", requestId: d.data?.requestId || "" },
    });
    await quittung(d.data?.requestId, "displayed");
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ziel = e.notification.data?.url || "./";
  e.waitUntil((async () => {
    quittung(e.notification.data?.requestId, "opened");
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of fenster) { if ("focus" in c) { await c.navigate(ziel).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(ziel);
  })());
});
