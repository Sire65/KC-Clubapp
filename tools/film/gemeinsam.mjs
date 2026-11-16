// KC-CLUB-FILME-NEU (15.11.2026, Wunsch Hansi „Ja alles neu aufbauen, damit es passt“): gemeinsame Werkzeuge für die Erklärfilme
// „Der Kopf der Club-App“ (tools/film/kopffilm) und „Deine App – so, wie du sie willst“ (tools/film/ansichtfilm).
// Die Bilder kommen aus der ECHTEN App (index.html + app.js dieses Ordners) mit erfundenen Beispieldaten – nie mit echten Mitgliederdaten,
// nie gegen den echten Club-Server (AGENTS.md KC-TESTS-OHNE-ECHTSERVER): Netzsperre beim Start, jede Anfrage abgeschirmt, Club-Server-Aufrufe
// werden im Browser mit Testdaten beantwortet (r.fulfill), alles Fremde abgebrochen, keine direkte Leitung (WebSocket).
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module"; import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright");
export const WURZEL = path.resolve(new URL("../..", import.meta.url).pathname);
export const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const CHROME = process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
export const PORT = Number(process.env.FILM_PORT || 8851);

// ---------- kleiner Web-Server für die App (nur localhost) ----------
const TYP = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg",
  ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
export function serverStarten() {
  return http.createServer((q, a) => {
    const f = path.join(WURZEL, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
    const ziel = f.startsWith(WURZEL) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(WURZEL, "index.html");
    fs.readFile(ziel, (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": TYP[path.extname(ziel)] || "application/octet-stream" }); a.end(d); });
  }).listen(PORT);
}
export const browserStarten = () => chromium.launch({ executablePath: CHROME, args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });

// ---------- Beispieldaten (erfunden) ----------
const T = (tage, h = 18, m = 0) => { const d = new Date(); d.setDate(d.getDate() + tage); d.setHours(h, m, 0, 0); return d.toISOString(); };
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
const tagIso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const ICH = { person_id: "P1", name: "Hans Test", vorname: "Hans", admin: false, vorstand: false, aemter: [], protokolle: true, kontakte: true, buero: null };
const LEUTE = [["P1", "Hans Test", "Hans", "verfuegbar"], ["P2", "Erika Beispiel", "Erika", "verfuegbar"], ["P3", "Paul Probe", "Paul", "beschaeftigt"], ["P4", "Klara Koch", "Klara", "urlaub"],
  ["P5", "Otto Muster", "Otto", "verfuegbar"], ["P6", "Rita Sommer", "Rita", "krank"], ["P7", "Uwe Winter", "Uwe", "verfuegbar"], ["P8", "Lena Herbst", "Lena", null]];
const treffen = { id: "T1", titel: "Clubabend", beginn: T(2, 19, 0), ende: null, ort: "Clubraum", beschreibung: "Planung Weihnachtsmarkt", status: "geplant", art: "treffen", ganztaegig: false, gastgeber: null,
  teilnahme: [{ person_id: "P2", name: "Erika Beispiel", antwort: "ja", notiz: null }, { person_id: "P3", name: "Paul Probe", antwort: "vielleicht", notiz: null }],
  ja: 12, nein: 1, vielleicht: 2, meine: "ja", mitfahrten: [], mitfahrtSuche: [] };
const treffen2 = { ...treffen, id: "T2", titel: "Weihnachtsmarkt Aufbau", beginn: T(9, 9, 0), ort: "Marktplatz", art: "veranstaltung", ja: 4, vielleicht: 3, meine: null, teilnahme: [] };
const treffen3 = { ...treffen, id: "T3", titel: "Clubsitzung", beginn: T(16, 19, 0), ort: "Clubraum", ja: 6, vielleicht: 1, meine: null, teilnahme: [] };
const wcodes = [61, 3, 2, 0, 1, 63, 3];
const WETTER = { ort: { name: "Werne", region: "NRW" }, eigenerOrt: false, quelle: { id: "openmeteo", name: "Open-Meteo" }, app: { name: "Wetter-App", url: "about:blank" }, stand: new Date().toISOString(), fehler: null,
  daten: { jetzt: { temp: 9, gefuehlt: 7, code: 61, wind: 14, boeen: 25, regen: 0.4, tag: true },
    tage: wcodes.map((code, i) => ({ datum: tagIso(i), code, max: [9, 8, 10, 11, 9, 7, 8][i], min: [5, 4, 3, 5, 6, 3, 2][i], regenWkt: [80, 40, 10, 5, 20, 85, 30][i], sonnenauf: "07:45", sonnenunter: "16:40",
      regenMm: [6, 1, 0, 0, 0.5, 8, 1][i], windMax: 25, boeenMax: 48, uv: 1, sonneStd: [1, 3, 5, 6, 4, 0, 2][i],
      ...(i < 2 ? { stunden: Array.from({ length: 8 }, (_, k) => { const h = k * 3; return { zeit: `${String(h).padStart(2, "0")}:00`, code: h > 6 && h < 18 ? code : 3, temp: [4, 3, 4, 7, 9, 8, 6, 5][k], regenWkt: [20, 20, 30, 60, 80, 50, 30, 20][k], tag: h > 7 && h < 17 }; }) } : {}) })) } };
// Beispielfotos als kleine Bilder (Emoji auf Farbfläche) – keine echten Fotos
const fotoBild = (emoji, farbe) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${farbe}"/><text x="100" y="130" font-size="110" text-anchor="middle">${emoji}</text></svg>`);
const FOTOS = [["🍲", "#c98a3c"], ["🥂", "#b7892e"], ["🎄", "#2f6b3a"], ["👨‍🍳", "#d9cbb8"]].map(([e, f], i) => ({ id: "F" + i, thema: "Clubabend", datum: tagIso(-3), beschreibung: "Beispielfoto", vorschau: fotoBild(e, f) }));
const unterhaltungen = [
  { id: "C1", betreff: "", teilnehmer: ["Erika Beispiel"], anzahl: 2, gruppe: null, letzte: { von: "Erika", text: "Denkst du an die Schürzen?", zeit: vor(12) }, ungelesen: 1, wichtigNeu: 0, aktualisiert: vor(12) },
  { id: "C2", betreff: "", teilnehmer: ["Paul Probe", "Erika Beispiel", "Otto Muster"], anzahl: 6, gruppe: { name: "Küchenteam", symbol: "🍳" }, personen: ["P1", "P2", "P3", "P5"], letzte: { von: "Paul", text: "Einkaufsliste steht 👍", zeit: vor(55) }, ungelesen: 2, wichtigNeu: 0, aktualisiert: vor(55) },
  { id: "C3", betreff: "", teilnehmer: ["Otto Muster"], anzahl: 2, gruppe: null, letzte: { von: "Du", text: "Danke dir!", zeit: vor(300) }, ungelesen: 0, wichtigNeu: 0, aktualisiert: vor(300) }];
const KAL = { treffen: [treffen, treffen2, treffen3], dienste: [], fristen: [], geburtstage: [], aktionen: [], anfragen: [], privat: [] };
export function antworten(o = {}) {
  const einst = { ansicht: { art: o.ansicht || "erweitert", gewaehlt: true }, begruessung: { gesehen: true }, tipps: { an: false }, unterstuetzung: "normal", design: { design: "klassik", modus: "tag" },
    einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false },
    filme: Object.fromEntries(["clubsitzungablauf", "sicherheitsfilm", "ansichtfilm", "kopffilm"].map((id) => [id, { wie: "ende", z: "2026-11-01T10:00:00Z" }])), ...(o.einstellungen || {}) };
  return {
    init: { ok: true, ich: ICH, status: { status: "verfuegbar", hinweis: null, bis: null }, server: "2.954.0", ungelesen: 3, ungelesenLaut: 3, offeneAbstimmungen: 1, naechsterDienst: null,
      benachrichtigung: { termine: { push: true, email: true }, nachrichten: { push: true, email: false }, vorschlaege: { push: true, email: false }, dienste: { push: true, email: false }, geburtstage: { push: true, email: false }, pinnwand: { push: true, email: false } },
      hatMail: true, geburtstageHeute: [], geburtstagFreigabe: false, runderGeburtstagFreigabe: false, hatGeburtstag: false, kontaktFreigabe: { handy: true, festnetz: false, mail: true, adresse: false },
      terminfindungOffen: [], wartung: { an: false, hinweis: null, seit: null }, communicator: { farbe: "gruen", text: "läuft" }, notfall: null,
      einstellungen: einst, kalenderAbo: null, meineAufgaben: [], protokolleUngelesen: 0, naechstesTreffen: treffen, mitgliederAnzahl: 18, vapidPublicKey: null,
      pinnwandFristen: { erinnernTage: 3, pauseTage: 7, geaendertAm: null }, anrufAntworten: { texte: ["⏳ Bin gerade beschäftigt"], geaendertAm: null } },
    online: { zeigen: true, online: [{ person_id: "P2", name: "Erika Beispiel", vorname: "Erika", klopfbar: true }, { person_id: "P5", name: "Otto Muster", vorname: "Otto", klopfbar: true }, { person_id: "P7", name: "Uwe Winter", vorname: "Uwe", klopfbar: true }], verpasst: [], klopfen: [], antworten: [], anrufe: [] },
    mitglieder: { aemter: [], onlineSichtbar: true, mitglieder: LEUTE.map(([id, name, vn, st], i) => ({ person_id: id, name, vorname: vn, vorstand: false, aemter: [], admin: false,
      status: st ? { status: st, hinweis: null, bis: null } : null, online: ["P2", "P5", "P7"].includes(id), zuletztDa: { online: ["P2", "P5", "P7"].includes(id) }, verborgen: false, heute: true, wege: { push: true, mail: true, whatsapp: i % 2 === 0 }, aktiv: true })) },
    treffen_liste: { treffen: [treffen, treffen2, treffen3], geburtstage: [] }, terminumfragen_liste: { umfragen: [] }, terminanfragen_liste: { anfragen: [] }, privattermine_liste: { privat: [] },
    unterhaltungen: { unterhaltungen }, kalender: KAL, wetter: WETTER, fotos_neueste: { fotos: FOTOS, anzahl: 42 },
    lebenszeichen: { ok: true, grund: null }, standort_liste: { standorte: [] }, pinnwand: { max: 4, zeichen: 200, meine: 0, zettel: [] }, pinnwand_neu: { neu: [] },
    ping: { ok: true, server: "2.954.0", zeit: new Date().toISOString(), dbMs: 5, wartung: { an: false } },
    ...(o.antworten || {}),
  };
}

// ---------- eine App-Seite mit Testdaten öffnen ----------
export async function appSeite(browser, o = {}) {
  const ctx = await browser.newContext({ viewport: { width: o.w || 390, height: o.h || 760 }, deviceScaleFactor: 2, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin", reducedMotion: "no-preference", permissions: ["notifications"] });
  const seite = await ctx.newPage(); seite.fehler = []; seite.on("pageerror", (e) => seite.fehler.push(String(e).slice(0, 200)));
  const antw = antworten(o);
  // KC-TESTS-OHNE-ECHTSERVER: zuerst alles abschirmen – eigene Seite durch, alles andere abbrechen; die Regel darunter beantwortet den Club-Server mit Testdaten
  await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort()));
  await seite.routeWebSocket(/.*/, (ws) => ws.close()); // keine direkte Leitung (Realtime)
  await seite.route("**/functions/v1/**", async (r) => {
    let a = "", q = {}; try { q = JSON.parse(r.request().postData() || "{}"); a = q.action; } catch {}
    const body = typeof antw[a] === "function" ? antw[a](q) : antw[a] ?? { ok: true };
    await r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(body) });
  });
  await seite.route("**/notbetrieb.json*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"modus":"aus","url":""}' }));
  await seite.addInitScript(() => { try { localStorage.setItem("kc_club_key", "a".repeat(32)); localStorage.setItem("kc_club_begruesst_P1", "1"); localStorage.setItem("kc_club_version_gesehen", "9.9.9");
    sessionStorage.setItem("kc_buero_gefragt", "1"); sessionStorage.setItem("kc_club_start_gemeldet", "1"); localStorage.setItem("kc_club_kuckuck", "0"); } catch {} });
  await seite.goto(`http://localhost:${PORT}/index.html`); await seite.waitForTimeout(3000);
  await seite.addStyleTag({ content: "body > .meldung { display: none !important; } #updateBanner { display: none !important; } #suLupe, #hzFrage, #klickZeigenKnopf, #rgHinweis { display: none !important; }" }); // schwebende Hilfe-Knöpfe und Film-Angebot verdecken sonst das Bild
  await aufraeumen(seite);
  return seite;
}
// Fenster, Meldungen und Startangebote wegnehmen, die das Bild verdecken würden
export const aufraeumen = (seite) => seite.evaluate(() => {
  try { bwEinSetzen({ aus: true }); } catch {} // keine Bühnen-Einladung
  document.querySelectorAll(".meldung, .blatt[data-dyn]").forEach((e) => e.remove());
  try { IL.halt = Date.now() + 3600000; IL.uhr = 0; const j = IL.liste.findIndex((m) => m.id === "treffen"); if (j >= 0 && IL.i !== j) { IL.i = j; IL.html = ""; ilZeigen(); } } catch {} // Info-Laufschrift steht auf dem Treffen
  document.querySelectorAll(".blatt:not(.versteckt)").forEach((x) => x.classList.add("versteckt")); document.body.classList.remove("blatt-offen");
  for (const b of document.querySelectorAll("body > *")) if (b.id !== "app" && /Welche Stimme soll dir|Film jetzt ansehen/.test(b.textContent || "") && getComputedStyle(b).position === "fixed") b.remove();
});
// Mittelpunkt eines Elements in Prozent des Bildschirms (für den Finger im Film)
export const lage = (seite, sel) => seite.evaluate((s) => { const e = typeof s === "string" ? document.querySelector(s) : null; if (!e) return null; const r = e.getBoundingClientRect();
  return { x: (r.left + r.width / 2) / innerWidth * 100, y: (r.top + r.height / 2) / innerHeight * 100, w: r.width / innerWidth * 100, h: r.height / innerHeight * 100, l: r.left / innerWidth * 100, t: r.top / innerHeight * 100 }; }, sel);

// ---------- Filmbild: Kopfleiste, Etikett, Handy mit App-Bild, Finger, Untertitel ----------
export function rahmenHtml() {
  const muetze = "data:image/webp;base64," + fs.readFileSync(path.join(WURZEL, "kc-kochmuetze-weiss.webp")).toString("base64");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0} html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:#f3ead9;font-family:Inter,"Noto Color Emoji",sans-serif;color:#2b1d14;position:relative}
  .kopf{position:absolute;inset:0 0 auto 0;height:118px;background:#7d1424;display:flex;align-items:center;gap:22px;padding:0 36px;color:#fff}
  .kopf .logo{width:72px;height:72px;border-radius:50%;background:#9b2233;display:grid;place-items:center;border:2px solid rgba(255,255,255,.35)} .kopf .logo img{width:50px}
  .kopf b{font-size:38px;display:block;font-weight:700} .kopf span{font-size:24px;opacity:.85}
  .etikett{position:absolute;left:50%;top:134px;transform:translateX(-50%);background:#7d1424;color:#fff;font-weight:700;font-size:34px;padding:10px 30px;border-radius:40px;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.18);z-index:5}
  .handy{position:absolute;left:50%;top:206px;transform:translateX(-50%);width:640px;height:1228px;background:#1d1414;border-radius:76px;padding:20px;box-shadow:0 30px 60px rgba(60,20,10,.35)}
  .schirm{position:relative;width:600px;height:1188px;border-radius:58px;overflow:hidden;background:#fff}
  .schirm img.app{display:block;width:600px;height:1188px;object-fit:cover;object-position:top}
  .finger{position:absolute;font-size:96px;transform:translate(-42%,-4%);filter:drop-shadow(0 6px 8px rgba(0,0,0,.35));z-index:3}
  .ring{position:absolute;border:6px solid #f2b705;border-radius:24px;box-shadow:0 0 0 6px rgba(242,183,5,.25);z-index:2}
  .tipp{position:absolute;width:70px;height:70px;border-radius:50%;background:rgba(242,183,5,.45);transform:translate(-50%,-50%);z-index:2}
  .text{position:absolute;left:44px;right:44px;bottom:44px;height:400px;background:#fff;border-radius:32px;box-shadow:0 10px 30px rgba(80,40,20,.15);display:flex;align-items:center;padding:34px 44px;font-size:37px;line-height:1.36;font-weight:500}
  .titel{position:absolute;inset:118px 0 470px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:30px}
  .titel .rund{width:230px;height:230px;border-radius:50%;background:#7d1424;display:grid;place-items:center;box-shadow:0 14px 30px rgba(125,20,36,.35)} .titel .rund img{width:150px}
  .titel h1{font-size:76px;color:#7d1424;line-height:1.1;font-weight:800} .titel .dauer{font-size:40px;border:4px solid #7d1424;color:#7d1424;border-radius:50px;padding:8px 34px;font-weight:700}
  .titel .zeile{font-size:40px;color:#5a463a}
  .karten{position:absolute;inset:200px 70px 520px 70px;display:flex;flex-direction:column;justify-content:center;gap:34px}
  .karten div{background:#fff;border-radius:28px;padding:30px 36px;font-size:40px;font-weight:600;box-shadow:0 8px 20px rgba(80,40,20,.12);display:flex;gap:26px;align-items:center}
  .karten div small{display:block;font-size:28px;font-weight:400;color:#7a6658;margin-top:6px} .karten div .sym{font-size:64px}
  </style></head><body>
  <div class="kopf"><div class="logo"><img src="${muetze}"></div><div><b>Köcheclub Werne</b><span id="unter"></span></div></div>
  <div id="buehne"></div><div class="text" id="text"></div>
  <script>window.MUETZE=${JSON.stringify(muetze)};
  window.zeige=(o)=>{document.getElementById("unter").textContent=o.unter||"";const t=document.getElementById("text");t.textContent=o.text||"";t.style.fontSize=(o.text||"").length>260?"33px":(o.text||"").length>200?"35px":"37px";
    const b=document.getElementById("buehne");b.innerHTML="";
    if(o.art==="titel"){b.innerHTML='<div class="titel"><div class="rund"><img src="'+MUETZE+'"></div><h1>'+o.titel+'</h1>'+(o.dauer?'<div class="dauer">⏱️ '+o.dauer+'</div>':'')+(o.zeilen||[]).map(z=>'<div class="zeile">'+z+'</div>').join("")+'</div>';return;}
    if(o.art==="karten"){b.innerHTML='<div class="karten">'+o.karten.map(k=>'<div><span class="sym">'+k[0]+'</span><span>'+k[1]+(k[2]?'<small>'+k[2]+'</small>':'')+'</span></div>').join("")+'</div>';return;}
    const z=o.zoom||{x:50,y:50,f:1},X=(p)=>(z.x+(p-z.x)*z.f)*6,Y=(p)=>(z.y+(p-z.y)*z.f)*11.88;
    let h='<div class="handy"><div class="schirm"><img class="app" src="'+o.bild+'" style="transform-origin:'+z.x+'% '+z.y+'%;transform:scale('+z.f+')">';
    for(const r of o.ringe||[])h+='<div class="ring" style="left:'+(X(r.l)-8)+'px;top:'+(Y(r.t)-8)+'px;width:'+(r.w*6*z.f+16)+'px;height:'+(r.h*11.88*z.f+16)+'px"></div>';
    if(o.finger){if(o.finger.tipp)h+='<div class="tipp" style="left:'+X(o.finger.x)+'px;top:'+Y(o.finger.y)+'px"></div>';h+='<div class="finger" style="left:'+X(o.finger.x)+'px;top:'+Y(o.finger.y)+'px">👆</div>';}
    h+='</div></div>';if(o.etikett)h+='<div class="etikett">'+o.etikett+'</div>';b.innerHTML=h;};
  </script></body></html>`;
}

// ---------- Stimme (Piper, thorsten-medium) ----------
export const AUSSPRACHE = [[/\bApp\b/g, "Äpp"], [/\bApps\b/g, "Äpps"], [/\bClub-App\b/g, "Klub-Äpp"], [/\bChat\b/g, "Tschätt"], [/\bEnglish\b/g, "Inglisch"], [/\bWhatsApp\b/g, "Wotts-Äpp"],
  [/\bPush\b/g, "Pusch"], [/\bLED\b/g, "E-L-E-D"], [/\bSOS\b/g, "S-O-S"], [/\bLEDs\b/g, "E-L-E-Ds"], [/\bE-Mail\b/g, "E-Mehl"], [/\bWLAN\b/g, "W-Lan"], [/\bQR\b/g, "Q-R"], [/„|“|‹|›|«|»/g, ""]];
export const sprechText = (t) => AUSSPRACHE.reduce((s, [re, neu]) => s.replace(re, neu), t);
export function stimmeErzeugen(ordner, szenen) {
  fs.mkdirSync(path.join(ordner, "vo"), { recursive: true });
  const liste = szenen.map((s, i) => ({ datei: path.join(ordner, "vo", String(i).padStart(2, "0") + ".wav"), text: sprechText(s.sprich ?? s.text) }));
  fs.writeFileSync(path.join(ordner, "vo", "liste.json"), JSON.stringify(liste));
  const r = spawnSync("python3", [path.join(WURZEL, "tools/film/stimme.py"), path.join(ordner, "vo", "liste.json")], { stdio: "inherit" });
  if (r.status) throw new Error("Stimme fehlgeschlagen");
  return liste.map((l) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", l.datei]).stdout.toString().trim()));
}
