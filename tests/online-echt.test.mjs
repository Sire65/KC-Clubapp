// KC-CLUB-ONLINE-ECHT (Wunsch Hansi 05.11.2026: „Wenn sie bei mir als online angezeigt wird und ich klopfe an, sollte sie auch wirklich online sein“).
// Aufruf: node tests/online-echt.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts");

// --- Regel „weg“: gilt, wenn „weg“ nach dem letzten sichtbaren Online-Ping gemeldet wurde ---
const zeile = /const istWeg = \(w: any\) => ([^\n]+);/.exec(server);
assert.ok(zeile, "istWeg im Server");
const istWeg = new Function("w", "return " + zeile[1].replace(/;$/, ""));
const t = (s) => new Date(Date.UTC(2026, 10, 5, 18, 0, s)).toISOString();
assert.equal(istWeg(null), false, "ohne Eintrag: nicht weg");
assert.equal(istWeg({ seit: t(0), zuletzt: t(10) }), false, "ohne „weg“: nicht weg (alte App)");
assert.equal(istWeg({ seit: t(0), zuletzt: t(10), weg: t(20) }), true, "weg nach dem letzten Ping: weg");
assert.equal(istWeg({ seit: t(0), zuletzt: t(30), weg: t(20) }), false, "wieder da nach dem Weglegen: online");
assert.equal(istWeg({ weg: t(20) }), true, "nur „weg“: weg");

// --- Server: überall angewandt ---
assert.ok(/const erg = \{ on: new Set\(ids\.filter\(\(id\) => [^\n]*&& !istWeg\(einst\.get\("online_seit"\)\?\.get\(id\)\)\)\), einst \};/.test(server), "Online-Paket nimmt „weg“ heraus");
assert.ok(/return \{ on: new Set\(ids\.filter\(\(id\) => [^\n]*&& !istWeg\(einst\.get\("online_seit"\)\?\.get\(id\)\)\)\), einst \};/.test(server), "Gegenprobe gleich");
assert.ok(server.includes('if (!weitere.includes("online_seit")) weitere = [...weitere, "online_seit"];'), "online_seit wird immer mitgelesen");
assert.ok(server.includes("&& !weg.has(id))); // KC-CLUB-ONLINE-ECHT"), "onlineJetzt (z. B. „an alle Online“)");
assert.ok(server.includes("return new Set(drin.filter((id) => !weg.has(id)));"), "Push wieder, wenn die App weggelegt ist");
assert.ok(/case "weg": \{[^}]*if \(!ich\.nurLesen\) await wegMerken\(ich\.person_id\);\s*return json\(\{ ok: true \}\);/.test(server), "Aktion „weg“");
const merken = server.slice(server.indexOf("async function onlineSeitMerken("), server.indexOf("// KC-CLUB-PUSH-NUR-OFFLINE"));
assert.ok(merken.includes("if (w > 0 && jetztMs - w < ONLINE_WEG_TOLERANZ_MS) return;") && merken.includes("|| warWeg; // nach „weg“ beginnt eine neue Sitzung"), "verspäteter Ping hebt „weg“ nicht auf, neuer sichtbarer Ping schon");
assert.ok(/const ONLINE_WEG_TOLERANZ_MS = 3000;/.test(server) && /const ONLINE_SEK = 150,/.test(server), "Zeiten");

// --- App: beim Weglegen melden und auf der Leitung austragen, beim Zurückkommen wieder eintragen ---
const a = app.slice(app.indexOf("let ONL_WEG_AM = 0;"), app.indexOf('window.addEventListener("pagehide", () => onlineWegMelden(true));') + 80);
assert.ok(a.includes("keepalive: true") && a.includes('body: JSON.stringify({ action: "weg" })') && a.includes('"x-club-token": KEY'), "„weg“ mit keepalive");
assert.ok(a.includes("if (!KEY || !ICH || ICH.gast || NOT.an || (!schliessen && !document.hidden) || Date.now() - ONL_WEG_AM < 2000) return;"), "nicht für Tischgäste, Notbetrieb, sichtbare App; nicht doppelt");
assert.ok(a.includes('{ type: "presence", event: "untrack" }') && a.includes('{ type: "presence", event: "track", payload: { t: 1 } }'), "Leitung: austragen/eintragen");
assert.ok(a.includes("if (document.hidden) return onlineWegMelden();") && a.includes("rtAnwesenheit(true);") && a.includes("setTimeout(onlinePing, 4000)"), "Zurückkommen");
assert.ok(/async function onlinePing\(\) \{\n  if \(!KEY \|\| !ICH \|\| document\.hidden\) return;/.test(app), "Online-Ping nur bei sichtbarer App (sonst wäre „weg“ wertlos)");

// --- KC-CLUB-SPUR-START-SERVER: „geöffnet“ im Verlauf auch ohne Schritte vom Handy (Fund Hansi: Thomas online, Verlauf leer) ---
const sl = server.slice(server.indexOf('case "spur_liste": {'), server.indexOf("if (!pid) {", server.indexOf('case "spur_liste": {')));
assert.ok(sl.includes('.eq("aktion", "diagnose_start")') && sl.includes("if (pid) q = q.eq(\"person_id\", pid);"), "Starts des Tages (auch für eine Person)");
assert.ok(sl.includes("if (d.zugang_kopiert || d.zugang_pc || !p0.startsWith(\"KC-P-\")"), "nur echte Starts von Mitgliedern");
assert.ok(sl.includes('Math.abs(x.t - t) < SPUR_START_FENSTER_MS && (x.w === "geoeffnet" || /^wieder_/.test(x.w))'), "nicht doppelt, wenn das Handy den Schritt selbst geschickt hat");
assert.ok(sl.includes('schritte.push({ p: p0, t, w: "geoeffnet", mit: null });') && !/mit: (d|z)\./.test(sl), "nur Uhrzeit, kein „mit wem“");
assert.ok(/const SPUR_START_VERZUG_MS = 1500, SPUR_START_FENSTER_MS = 3 \* 60000;/.test(server), "Zeiten");
assert.ok(app.includes('setTimeout(() => api("diagnose", { art: "start", daten: { start: START_ART, referrer: (document.referrer || "").slice(0, 80) } }).catch(() => {}), 1500);'), "App meldet den Start 1,5 s nach dem Öffnen (einmal je Sitzung)");
// Gäste und Aushilfen dürfen nur Aktionen aus ZUGANG_AKTIONEN – „weg“ muss dabei sein, sonst bleiben sie bis zu 150 s „online“
for (const [q, n] of [[app, "app.js"], [server, "Server"]]) { const i = q.indexOf("const ZUGANG_AKTIONEN"); assert.ok(/basis: \[[^\]]*"weg"/.test(q.slice(i, q.indexOf("};", i))), `${n}: „weg“ für Gäste/Aushilfen erlaubt`); }
console.log("online-echt: ok");
