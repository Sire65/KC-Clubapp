// KC Club-App – Service Worker: Seite zuerst aus dem Netz (offline aus dem Speicher), Push-Benachrichtigungen, Update.
// VERSION muss bei jeder neuen Version mit version.json, APP_VERSION in app.js und app.js?v= in index.html übereinstimmen.
const VERSION = "2.729.0";
const CACHE = "kc-club-" + VERSION;
const DATEIEN = ["./", "index.html", "app.js?v=" + VERSION, "manifest.webmanifest", "kc-kochmuetze-weiss.webp", "icon-192.png", "icon-512.png", "badge-anruf.png", "badge-video.png", "badge-muetze.png", "kuckuck-ruf.mp3"]; // 2.406.0: Kuckucksruf (CC0-Aufnahme) // 2.237.0: Statusleisten-Symbole für laufende Gespräche
// KC-CLUB-SCHNELLSTART-DATEI (2.24.8): das Programm app.js?v=<Version> ändert sich nie unter derselben Adresse → aus dem Speicher
// dieser Version liefern (schnell, vom Handy fertig übersetzt); fehlt es dort, aus dem Netz holen und merken.
// 2.728.0 KC-CLUB-TEILE (Prüfbericht C): nachladbare Programmteile teile/<name>.js?v=<Version> – gleiche Namen wie TEILE_LISTE in app.js.
// Sie gehören zum Programm dieser Version: beim Einrichten mit in den Speicher (alles oder nichts), danach aus dem Speicher wie app.js.
const TEILE = ["probe", "videos"];
DATEIEN.push(...TEILE.map((t) => `teile/${t}.js?v=${VERSION}`));
const istProgramm = (url) => url.pathname.endsWith("/app.js") && url.searchParams.get("v") === VERSION;
const istTeil = (url) => /\/teile\/[a-z0-9-]+\.js$/.test(url.pathname) && url.searchParams.get("v") === VERSION;

// KC-CLUB-UPDATE-SICHER (1.97.0): beim Einrichten die Dateien am Browser-Zwischenspeicher VORBEI holen (cache: "reload") –
// sonst kann ein neuer Speicher noch die alte Seite enthalten (Mischstand alt/neu, AGENTS Regel 16)
// 2.481.0 KC-CLUB-UPDATE-SPARSAM (TÜV 18.10.: jedes Update lud app.js 2× und index.html 3× ≈ 3,1 MB): das Programm app.js?v=VERSION ist unter
// seiner Adresse unveränderlich – liegt es schon in einem Speicher (die Seite hat es eben geladen), wird es übernommen statt neu geholt.
// Alles andere wird beim Server nachgefragt („no-cache“: 304 ohne Neuübertragung, wenn unverändert) – nie ungeprüft aus dem Browser-Speicher.
// Alles-oder-nichts wie addAll: fehlt eine Datei, bricht die Einrichtung ab (kein halber Speicher).
// Beim allerersten Start liegt es noch in keinem Speicher, aber im Browser-Zwischenspeicher (eben geladen) – „default“ nimmt es von dort.
// „./“ und „index.html“ sind dieselbe Seite: einmal holen, unter beiden Namen merken.
const einrichtenHolen = (u) => u === "app.js?v=" + VERSION || u.startsWith("teile/")
  ? caches.match(u).then((r) => r || fetch(new Request(u, { cache: "default" })))
  : fetch(new Request(u, { cache: "no-cache" }));
self.addEventListener("install", (e) => {
  e.waitUntil(Promise.all(DATEIEN.filter((u) => u !== "index.html").map((u) => einrichtenHolen(u).then((r) => { if (!r.ok) throw new Error("Einrichten: " + u + " " + r.status);
    // Seite muss genau zu diesem Programm passen (sonst lieber gar nicht einrichten – nie Mischstand, Regel 16)
    return u === "./" ? r.clone().text().then((t) => { if (!t.includes("app.js?v=" + VERSION)) throw new Error("Einrichten: Seite passt nicht zu " + VERSION); return [u, r]; }) : [u, r]; })))
    .then((liste) => caches.open(CACHE).then((c) => Promise.all(liste.flatMap(([u, r]) => u === "./" ? [c.put(u, r.clone()), c.put("index.html", r)] : [c.put(u, r)])))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("kc-club-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "jetzt-aktivieren") self.skipWaiting(); });
// KC-CLUB-TEILEN: Fotos aus der Galerie über „Teilen → Köcheclub“ (nur bei richtig installierter App).
// Die Fotos werden kurz im Speicher „kcclub-geteilt“ abgelegt (nicht „kc-club-…“, sonst löscht ein Update sie), dann öffnet die App.
const GETEILT = "kcclub-geteilt";
// 2.522.0 KC-CLUB-TEILEN-FEHLER (Fund Hansi 20.10.: „Es ist nichts angekommen“, Diagnose leer – das Annehmen war abgebrochen, der Fehlerweg
// öffnete die App ohne jede Spur): Fehler werden jetzt in „geteilt/info“ vermerkt (nur Art und Größe, keine Inhalte), eine Datei, die nicht in den
// Speicher passt, wird übersprungen statt alles abzubrechen.
const geteiltInfo = (c, info) => c.put("geteilt/info", new Response(JSON.stringify({ ...info, sw: VERSION, zeit: Date.now() }))).catch(() => {});
async function geteiltAnnehmen(req) {
  const c = await caches.open(GETEILT);
  for (const k of await c.keys()) await c.delete(k);
  let f; try { f = await req.formData(); } catch (e) { await geteiltInfo(c, { anzahl: 0, fehler: "formdata:" + (e?.name || "Fehler") + ":" + String(e?.message || "").slice(0, 120), groesse: Number(req.headers.get("content-length")) || null }); return Response.redirect("./#geteilt", 303); }
  // 2.514.0 KC-CLUB-TEILEN-ALLE-DATEIEN (Fund Hansi „eine Datei aus dem Datenspeicher konnte ich nicht teilen“ – es kam nichts an): jede
  // mitgeschickte Datei nehmen, egal unter welchem Feldnamen (manche Dateimanager), und die Teilen-Liste nimmt jetzt alle Dateitypen an (manifest */*)
  const dateien = [...f.values()].filter((x) => x && typeof x === "object" && typeof x.size === "number" && x.size).slice(0, 50);
  const fehler = [];
  for (let i = 0; i < dateien.length; i++)
    try { await c.put(`geteilt/${i}`, new Response(dateien[i], { headers: { "content-type": dateien[i].type || "application/octet-stream", "x-name": encodeURIComponent(dateien[i].name || `Datei_${i + 1}`) } })); }
    catch (e) { fehler.push(`${i}:${e?.name || "Fehler"}:${dateien[i].type || "?"}:${dateien[i].size}`); }
  // 1.22.0 (KC-CLUB-TEILEN-ALLES): auch Text aus WhatsApp & Co. (bis 4000 Zeichen), Titel und Link; Dateien jeder Art
  // 2.515.0 Diagnose: welche Felder/Dateitypen das Handy wirklich geschickt hat (nur Name des Feldes, Typ und Größe – keine Inhalte)
  const felder = [...f.entries()].slice(0, 20).map(([k, v]) => typeof v === "object" ? `${k}:${v.type || "?"}:${v.size}` : `${k}:text:${String(v).length}`);
  // 2.535.0 KC-CLUB-TEILEN-GROESSE: immer festhalten, wie groß die Sendung vom Handy war (leer angekommen trotz großer Datei?)
  await c.put("geteilt/info", new Response(JSON.stringify({ sw: VERSION, felder, anzahl: dateien.length, groesse: Number(req.headers.get("content-length")) || null, ...(fehler.length ? { fehler: fehler.join(" | ") } : {}), text: String(f.get("text") || "").slice(0, 4000), titel: String(f.get("titel") || "").slice(0, 200), url: String(f.get("url") || "").slice(0, 500), zeit: Date.now() })));
  return Response.redirect("./#geteilt", 303);
}
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.origin === location.origin && url.pathname.endsWith("/teilen")) { e.respondWith(geteiltAnnehmen(e.request).catch(async (x) => { await geteiltInfo(await caches.open(GETEILT), { anzahl: 0, fehler: "abbruch:" + (x?.name || "Fehler") + ":" + String(x?.message || "").slice(0, 120) }); return Response.redirect("./#geteilt", 303); })); return; }
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("version.json")) return;
  if (url.pathname.includes("/eltern/")) return; // 2.431.0 KC-CLUB-ELTERN: Elternseite hat ihren eigenen Service Worker – nichts merken, nichts dazwischen
  if (url.pathname.includes("/film/")) return; // 2.417.0 KC-CLUB-WERBEFILM-SEITE: Filmseite + 20-MB-Film nicht merken, Abspielen (Range) direkt übers Netz
  if (url.pathname.includes("/lib/ocr/")) return; // 2.669.0 KC-CLUB-ERKENNUNG-DATEI: Texterkennung (ca. 5 MB) nicht je Version neu merken – der Browser hält sie selbst
  if (url.pathname.includes("/stimmen/")) return; // 2.348.0 KC-CLUB-VIDEO-STIMMEN-DOWNLOAD: große Stimm-Dateien nicht doppelt merken – die Stimme hat ihren eigenen Speicher
  // KC-CLUB-UPDATE-SICHER (1.97.0): Seitenaufrufe immer frisch beim Server nachfragen (no-cache); nichts mit persönlichem Schlüssel
  // (?k=…) oder Notbetrieb-Schalter speichern; Speichern im waitUntil; offline nur bei Seitenaufrufen die Startseite liefern
  if (istProgramm(url) || istTeil(url)) { // 2.728.0 KC-CLUB-TEILE: Teile wie das Programm aus dem Speicher dieser Version
    e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((r) => r || fetch(e.request).then((n) => { if (n.ok) e.waitUntil(c.put(e.request, n.clone()).catch(() => {})); return n; }))));
    return;
  }
  const navi = e.request.mode === "navigate", merken = !url.searchParams.has("k") && !url.pathname.endsWith("notbetrieb.json");
  if (navi) { e.respondWith(seiteHolen(e, url, merken)); return; }
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && merken) { const k = r.clone(); e.waitUntil(caches.open(CACHE).then((c) => c.put(e.request, k)).catch(() => {})); }
    return r; })
    // 2.209.0 (Gesamtprüfung 5): das Programm nie „ungefähr“ liefern – app.js?v=NEU darf offline nicht mit app.js?v=ALT beantwortet werden
    .catch(() => caches.match(e.request, { ignoreSearch: !url.pathname.endsWith("/app.js") && !url.pathname.includes("/teile/") }).then((r) => r || Response.error())));
});
// 2.209.0 KC-CLUB-SW-SEITE (Gesamtprüfung 5): Seitenaufruf frisch aus dem Netz; antwortet das Netz nicht binnen NAVI_WARTEN_MS,
// die gemerkte Seite DIESER Version (schneller Start bei schwachem Netz). Gemerkt wird eine Seite nur, wenn sie zu dieser Version
// passt (app.js?v=VERSION) – so landet nie eine neue Seite im alten Speicher (kein Mischstand alt/neu, AGENTS Regel 16).
const NAVI_WARTEN_MS = 4000;
function seiteMerken(url, r) {
  return r.text().then((t) => t.includes("app.js?v=" + VERSION)
    ? caches.open(CACHE).then((c) => c.put(url.origin + url.pathname, new Response(t, { headers: { "content-type": r.headers.get("content-type") || "text/html; charset=utf-8" } })))
    : null).catch(() => {});
}
function seiteHolen(e, url, merken) {
  // 2.425.0 KC-CLUB-GENERALCHECK: die Startseite nur als Ersatz für die App selbst – sonst lief im Dienstwunsch-Fenster bei schlechtem Netz die ganze App ein zweites Mal
  const istApp = url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  const ausSpeicher = () => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (istApp ? caches.match("index.html") : undefined));
  return new Promise((fertig, fehler) => {
    let erledigt = false; const gib = (r) => { if (!erledigt && r) { erledigt = true; fertig(r); return true; } return false; };
    const uhr = setTimeout(() => ausSpeicher().then(gib).catch(() => {}), NAVI_WARTEN_MS);
    fetch(new Request(e.request, { cache: "no-cache" })).then((r) => {
      if (r.ok && merken) e.waitUntil(seiteMerken(url, r.clone()));
      clearTimeout(uhr); gib(r);
    }, () => { clearTimeout(uhr); ausSpeicher().then((r) => { if (!gib(r) && !erledigt) fehler(new Error("offline")); }).catch(fehler); });
  });
}

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
  // 2.623.0 KC-CLUB-PUSH-DEKLARATIV: versteht auch das neue Apple-Format (Declarative Web Push, { web_push: 8030, notification: {…} }) –
  // so kann der Versender später umgestellt werden, ohne dass Android/PC etwas verlieren
  if (d && d.web_push === 8030 && d.notification) { const n = d.notification; d = { title: n.title, body: n.body, data: { url: n.navigate || "./", requestId: n.data?.requestId || "" } }; }
  let titel = d.title || "Köcheclub Werne";
  e.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // KC-CLUB-ONLINE-ANSAGE-PUSH (1.64.0): „🟢 X ist jetzt online“ bei offener, sichtbarer App → Ton/Ansage in der App statt Mitteilung
    // 2.390.0 KC-CLUB-ONLINE-PUSH-ZEIT: „🟢 X ist jetzt online (19:05 Uhr)“ – kommt die Mitteilung mehr als 10 Min. später an (z. B. PC war aus),
    // steht im Titel „war um 19:05 Uhr online“ und die App sagt nichts an. Ohne Uhrzeit (älterer Server) wie bisher.
    const online = /^🟢 (.+?) ist jetzt online(?: \((\d\d):(\d\d) Uhr\))?$/.exec(titel), sichtbar = fenster.filter((c) => c.visibilityState === "visible");
    let alt = false;
    if (online && online[2]) { const j = new Date(), t = new Date(j); t.setHours(+online[2], +online[3], 0, 0); let min = (j - t) / 60000; if (min < -5) min += 1440; alt = min > 10; }
    if (alt) titel = `🟢 ${online[1]} war um ${online[2]}:${online[3]} Uhr online`;
    if (online && sichtbar.length && !alt) { sichtbar.forEach((c) => c.postMessage({ typ: "online-ansage", name: online[1] })); await quittung(d.data?.requestId, "displayed"); return; }
    // KC-CLUB-SPRACHANSAGEN (1.71.0): Text und Link mitgeben – die offene App sagt an, was das Mitglied ausgewählt hat
    fenster.forEach((c) => c.postMessage({ typ: "push", titel, text: d.body || d.text || "", url: d.data?.url || "" }));
    if (self.navigator.setAppBadge) try { await self.navigator.setAppBadge(); } catch {}
    await self.registration.showNotification(titel, {
      body: d.body || d.text || "", icon: "icon-192.png", badge: "badge-muetze.png", /* 2.572.0 KC-CLUB-PUSH-MUETZE: Kochmütze statt Viereck oben in der Leiste (Android zeigt nur die Form); 2.575.0: aus dem Club-Logo (kc-kochmuetze-weiss.webp) */ tag: d.data?.url || "kc-club",
      // KC-CLUB-ERINNERUNG-WAHL (2.23.22): Erinnerungen (⏰) bleiben stehen, bis man sie antippt, und vibrieren kräftiger
      renotify: true, silent: false, requireInteraction: /^⏰/.test(titel), vibrate: /^⏰/.test(titel) ? [400, 200, 400, 200, 400] : /^👋/.test(titel) ? [350, 150, 350, 150, 600] /* 2.647.0 KC-CLUB-ANKLOPFEN-VIBRATION */ : [120, 60, 120], data: { url: d.data?.url || "./", requestId: d.data?.requestId || "" },
    });
    await quittung(d.data?.requestId, "displayed");
  })());
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const ziel = e.notification.data?.url || "./";
  e.waitUntil((async () => {
    const q = quittung(e.notification.data?.requestId, "opened"); // 2.209.0: im waitUntil abwarten, sonst geht die Quittung verloren
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // 2.209.0 KC-CLUB-PUSH-SPRUNG: App schon offen → Ziel an die App schicken (Sprung ohne Neuladen) und nach vorn holen
    const offen = fenster.find((c) => "focus" in c);
    const fertig = offen ? (offen.postMessage({ typ: "oeffnen", url: ziel }), offen.focus()) : self.clients.openWindow(ziel);
    await Promise.allSettled([q, fertig]);
  })());
});
