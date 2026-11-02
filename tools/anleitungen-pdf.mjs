// KC-CLUB-ANLEITUNGEN (Wunschliste #68, Wunsch Hansi 02.11.2026 „Ordner mit Anleitungen im Admin-Büro, mit Register – Push und E-Mail einstellen, installieren
// je Chrome, Samsung, Microsoft, Firefox, Opera … – bei Bedarf den Mitgliedern zur Verfügung stellen“; Entscheidung: „füllen“):
// erzeugt die eingebauten Anleitungs-Blätter als PDF aus den Texten der App selbst (Installieren: einrichtenSchritteRoh; Push & E-Mail: Erklär-Video RG_PUSH;
// Link & Code: Erklär-Video RG_INST_CODE und Hilfe) – so sagen Blatt und App immer dasselbe. Ausgabe: dokumente/anleitungen/*.pdf + liste.json.
// Aufruf (nach Änderungen an diesen Texten neu erzeugen und mit einspielen): node tools/anleitungen-pdf.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), ZIEL = path.join(WURZEL, "dokumente", "anleitungen");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const server = http.createServer((q, r) => { const p = path.join(WURZEL, decodeURIComponent(new URL(q.url, "http://x").pathname));
  if (!p.startsWith(WURZEL) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(r); });
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${server.address().port}`;
const INIT = { ok: true, ich: { person_id: "KC-P-ANLEITUNG", vorname: "Mitglied", name: "Mitglied", admin: false, vorstand: false, aemter: [], rollen: [] },
  einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, ansicht: { art: "erweitert", gewaehlt: true } }, mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {} };
const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 390, height: 844 } });
await seite.route("**/*", (r) => { const u = new URL(r.request().url()); if (u.origin === BASIS) return r.continue();
  if (/\/functions\/v1\//.test(u.pathname)) return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(/"init"/.test(r.request().postData() || "") ? INIT : { ok: true }) });
  return r.abort(); });
await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 });
// Texte aus der App holen
const daten = await seite.evaluate(async () => {
  await teilLaden("videos");
  const S = (t, x, bild) => ({ t, x, bild: bild || "" });
  const inst = (g) => einrichtenSchritteRoh(g, S);
  const pcFirefox = einrichtenSchritte({ pc: true, browser: "firefox" });
  // Begrüßung und Schluss des Videos („In diesem Video zeige ich dir …“, „Das war's …“) gehören nicht aufs Blatt
  const stat = (l) => l.map((s) => ({ t: s.t, x: typeof s.x === "function" ? s.x() : s.x })).filter((s) => s.t && s.x && !/^(in diesem video|das war|so, das|geschafft|fertig!)/i.test(String(s.x).trim()) && !/\bich (erkläre|zeige) dir\b/i.test(String(s.x).split(/[.!?]/)[0] + " " + (String(s.x).split(/[.!?]/)[1] || "")) && !/^👋/.test(s.t));
  const hilfe = (id) => { const h = HILFE.find((x) => x.id === id); return h ? { t: `${h.sym} ${h.t}`, x: typeof h.x === "function" ? h.x() : h.x } : null; };
  return {
    android: inst({ android: true, browser: "chrome" }), samsung: inst({ android: true, browser: "samsung" }), pc: inst({ pc: true, browser: "chrome" }),
    pcFirefox, iphone: inst({ ios: true, browser: "safari" }), ipad: inst({ ios: true, ipad: true, browser: "safari" }), iphoneChrome: inst({ ios: true, browser: "chrome_ios" }),
    push: stat(RG_PUSH), code: stat(RG_INST_CODES), hilfeLink: ["zugangslink", "code_geraet", "code_ipad"].map(hilfe).filter(Boolean),
    css: [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"),
  };
});
// Blätter: id, Register, Titel, Zweck (ein Satz „Darum geht's“), Abschnitte, „Gut zu wissen“ – jedes Blatt ist gleich aufgebaut (KC-CLUB-ANLEITUNGEN-DESIGN)
const BLAETTER = [
  { id: "push-und-email", reg: "Push & E-Mail", t: "🔔 Benachrichtigungen (Push) und E-Mail einstellen", zweck: "So kommen Nachrichten, Termine und Erinnerungen aus dem Club zuverlässig auf dein Handy – als Push, als E-Mail oder beides.",
    teile: [{ t: "Schritt für Schritt", s: daten.push }], gut: "Kommt nichts an? Unter ⚙️ → „🔔 Benachrichtigungen“ auf „🧪 Test an mich“ tippen. Kommt auch der Test nicht, die Erlaubnis im Handy prüfen (Einstellungen → Apps → Browser bzw. Köcheclub → Benachrichtigungen)." },
  { id: "installieren-chrome", reg: "Installieren", t: "📲 Installieren mit Google Chrome", zweck: "Die Köcheclub-App bekommt ein eigenes Symbol (die Kochmütze) und öffnet sich wie eine richtige App – schneller und mit Benachrichtigungen.",
    teile: [{ t: "Android-Handy oder -Tablet", s: daten.android }, { t: "PC oder Laptop", s: daten.pc }], gut: "Ab jetzt die App immer über die Kochmütze öffnen – nicht mehr über den Link im Browser." },
  { id: "installieren-samsung", reg: "Installieren", t: "📲 Installieren mit Samsung Internet", zweck: "Die Köcheclub-App bekommt ein eigenes Symbol (die Kochmütze) und öffnet sich wie eine richtige App – schneller und mit Benachrichtigungen.",
    teile: [{ t: "Samsung-Handy", s: daten.samsung }], gut: "Ab jetzt die App immer über die Kochmütze öffnen – nicht mehr über den Link im Browser." },
  { id: "installieren-edge", reg: "Installieren", t: "📲 Installieren mit Microsoft Edge", zweck: "Die Köcheclub-App bekommt ein eigenes Symbol (die Kochmütze) und öffnet sich wie eine richtige App – schneller und mit Benachrichtigungen.",
    teile: [{ t: "Android-Handy", s: daten.android }, { t: "PC oder Laptop", s: daten.pc }], gut: "Ab jetzt die App immer über die Kochmütze öffnen – nicht mehr über den Link im Browser." },
  { id: "installieren-firefox", reg: "Installieren", t: "📲 Installieren mit Firefox", zweck: "Die Köcheclub-App bekommt ein eigenes Symbol (die Kochmütze) und öffnet sich wie eine richtige App – schneller und mit Benachrichtigungen.",
    teile: [{ t: "Android-Handy", s: daten.android }, { t: "PC oder Laptop", s: daten.pcFirefox }], gut: "Am PC kann Firefox keine Web-Apps installieren – dort Chrome oder Edge nehmen oder die App einfach im Browser nutzen." },
  { id: "installieren-opera", reg: "Installieren", t: "📲 Installieren mit Opera", zweck: "Die Köcheclub-App bekommt ein eigenes Symbol (die Kochmütze) und öffnet sich wie eine richtige App – schneller und mit Benachrichtigungen.",
    teile: [{ t: "Android-Handy", s: daten.android }], gut: "Ab jetzt die App immer über die Kochmütze öffnen – nicht mehr über den Link im Browser." },
  { id: "installieren-iphone", reg: "Installieren", t: "📲 Installieren auf iPhone und iPad", zweck: "Die Köcheclub-App kommt als Kochmütze auf den Home-Bildschirm und öffnet sich wie eine richtige App – nur so gibt es auf dem iPhone Benachrichtigungen.",
    teile: [{ t: "iPhone mit Safari", s: daten.iphone }, { t: "iPad mit Safari", s: daten.ipad }, { t: "iPhone mit Chrome", s: daten.iphoneChrome }], gut: "Auf iPhone und iPad zuerst installieren, dann den Code eingeben. Den Code zeigt die App auf einem Gerät, auf dem du schon angemeldet bist (⚙️ → „📲 Code für ein anderes Gerät“)." },
  { id: "link-und-code", reg: "Link & Anmelden", t: "🔑 Persönlicher Link, Code und neues Gerät", zweck: "Wie du in die App kommst: mit deinem persönlichen Link, mit einem Code auf einem zweiten Gerät – und was zu tun ist, wenn der Link fehlt.",
    teile: [{ t: "Link, Code & Co.", s: daten.code }, { t: "Kurz erklärt", s: daten.hilfeLink }], gut: "Deinen Link bitte nicht weitergeben – wer ihn hat, ist in der App als du angemeldet. Neues Handy oder Link verloren? Einfach bei der Clubleitung melden." },
];
fs.mkdirSync(ZIEL, { recursive: true });
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stand = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
const version = fs.readFileSync(path.join(WURZEL, "app.js"), "utf8").match(/APP_VERSION = "([^"]+)"/)[1];
const AUTOR = "Hans-Joachim Koch";
// Fußzeile auf jeder Seite (Wunsch Hansi 02.11.2026): links „Köcheclub Werne“, Mitte „Seite 1/2“, rechts „Autor: Hans-Joachim Koch“
const FUSS = `<div style="width:100%;font-family:'Segoe UI',system-ui,sans-serif;font-size:8.5px;color:#555;padding:0 14mm;display:flex;justify-content:space-between;align-items:center;border-top:0.6px solid #741521;padding-top:3px;margin:0 0 0">
  <span style="flex:1;text-align:left;font-weight:700;color:#741521">Köcheclub Werne</span><span style="flex:1;text-align:center">Seite <span class="pageNumber"></span>/<span class="totalPages"></span></span><span style="flex:1;text-align:right">Autor: ${AUTOR}</span></div>`;
const druck = await browser.newPage(); await druck.emulateMedia({ media: "screen" }); // die Druck-Regeln der App blenden sonst alles außer ihrer eigenen Druckseite aus
const liste = [];
for (const b of BLAETTER) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><base href="${BASIS}/"><style>${daten.css}</style><style>
    html, body { background: #fff !important; color: #222 !important; font-family: "Segoe UI", system-ui, sans-serif; margin: 0; }
    .anl-kopf { display: grid; grid-template-columns: 52px 1fr auto; align-items: center; gap: 12px; border-bottom: 3px solid #741521; padding-bottom: 8px; }
    .anl-kopf img { width: 50px; height: 50px; } .anl-kopf .marke { color: #741521; font-size: 11.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .anl-kopf h1 { font-size: 21px; line-height: 1.2; margin: 2px 0 0; color: #222; } .anl-kopf .stand { font-size: 10px; color: #777; text-align: right; line-height: 1.4; }
    .zweck { margin: 12px 0 4px; padding: 9px 12px; background: #f6eef0; border-radius: 8px; font-size: 13px; line-height: 1.45; } .zweck b { color: #741521; }
    h2 { font-size: 15px; color: #741521; margin: 16px 0 4px; border-left: 4px solid #741521; padding-left: 8px; break-after: avoid; }
    ol { margin: 0; padding: 0; list-style: none; counter-reset: s; } li { counter-increment: s; display: grid; grid-template-columns: 30px 1fr; gap: 4px 10px; padding: 8px 0; border-bottom: 1px solid #eee; break-inside: avoid; }
    li::before { content: counter(s); width: 26px; height: 26px; border-radius: 50%; background: #741521; color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 13px; }
    li b.t { display: block; font-size: 14px; } li .x { font-size: 12.5px; line-height: 1.45; } li .bild { grid-column: 2; max-width: 300px; } li .bild .kc-code-gross, li .bild #erCodeInfo { display: none; }
    .gut { margin: 16px 0 0; padding: 10px 12px; border: 1.5px solid #741521; border-radius: 8px; font-size: 12.5px; line-height: 1.45; break-inside: avoid; } .gut b { color: #741521; }
  </style></head><body><div class="anl-kopf"><img src="kc-kochmuetze-weiss.webp" style="filter:brightness(0) saturate(100%) invert(14%) sepia(40%) saturate(4000%) hue-rotate(335deg)" alt="">
      <div><div class="marke">Köcheclub Werne · Anleitung · ${esc(b.reg)}</div><h1>${esc(b.t)}</h1></div><div class="stand">Version ${esc(version)}<br>Stand ${stand}</div></div>
    <div class="zweck"><b>Darum geht's:</b> ${esc(b.zweck)}</div>
    ${b.teile.map((teil) => `<h2>${esc(teil.t)}</h2><ol>${teil.s.map((x) => `<li><div class="t-x"><b class="t">${esc(x.t)}</b><div class="x">${x.x}</div></div>${x.bild ? `<div class="bild">${x.bild}</div>` : ""}</li>`).join("")}</ol>`).join("")}
    <div class="gut"><b>💡 Gut zu wissen:</b> ${esc(b.gut)}</div></body></html>`;
  await druck.setContent(html, { waitUntil: "load" });
  const datei = `${b.id}.pdf`;
  await druck.pdf({ path: path.join(ZIEL, datei), format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: FUSS,
    margin: { top: "14mm", bottom: "18mm", left: "14mm", right: "14mm" } });
  liste.push({ id: b.id, register: b.reg, titel: b.t, datei });
  console.log("✔", datei);
}
fs.writeFileSync(path.join(ZIEL, "liste.json"), JSON.stringify({ hinweis: "Erzeugt von tools/anleitungen-pdf.mjs – nicht von Hand ändern.", stand, version, blaetter: liste }, null, 2) + "\n");
await browser.close(); server.close();
