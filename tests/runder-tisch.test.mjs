// KC-CLUB-RUNDER-TISCH (2.762.0, Stufe RT1): Regeln des Runden Tisches.
// Aufruf: node tests/runder-tisch.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
import { RT_GAST, rtGastFenster, rtGastEinladenPruefen, rtGastPid, rtIstGast } from "../supabase/functions/kc-club/runder-tisch.js";
import { RT, RT_ARTEN, rtArt, rtEndeMs, rtPhase, rtAnlegenPruefen, rtSitzt, rtSicher, rtBeitretenPruefen, rtGastgeberPruefen, rtAufraeumen, rtText, rtZusagePruefen, rtAnwesend, rtBestaetigung, rtKonflikte, rtKonfliktText, rtTreffenBis, RT_TASCHE, rtTascheArt, rtTascheLegenPruefen, rtTascheSchieben } from "../supabase/functions/kc-club/runder-tisch.js";

const M = 60000, T = 86400000, B = Date.parse("2026-11-05T19:00:00Z"); // Do 20:00 Berlin
const tisch = { beginn: new Date(B).toISOString(), dauer_min: 60, verlaengert_min: 0, plaetze: 18, status: "geplant" };

// Phasen
assert.equal(rtPhase(tisch, B - 20 * M), "geplant");
assert.equal(rtPhase(tisch, B - 15 * M), "gleich", "15 Min. vorher erscheint der Tisch");
assert.equal(rtPhase(tisch, B), "offen");
assert.equal(rtPhase(tisch, B + 60 * M), "vorbei");
assert.equal(rtPhase({ ...tisch, verlaengert_min: 30 }, B + 60 * M), "offen", "verlängert");
assert.equal(rtPhase({ ...tisch, geschlossen_am: new Date(B + 10 * M).toISOString() }, B + 11 * M), "vorbei", "früher geschlossen");
assert.equal(rtPhase({ ...tisch, status: "abgesagt" }, B), "abgesagt");
assert.equal(rtEndeMs(tisch), B + 60 * M);

// Einladen
const e = { thema: "Club-Song", beginnMs: B, dauer: 60, plaetze: 18 };
assert.equal(rtAnlegenPruefen(e, B - T, 0), null);
assert.match(rtAnlegenPruefen({ ...e, thema: "  " }, B - T, 0), /Thema/);
assert.match(rtAnlegenPruefen({ ...e, thema: "x".repeat(RT.themaMax + 1) }, B - T, 0), /zu lang/);
assert.match(rtAnlegenPruefen(e, B + 10 * M, 0), /Vergangenheit/);
assert.match(rtAnlegenPruefen(e, B - (RT.vorausTage + 1) * T, 0), /im Voraus/);
assert.match(rtAnlegenPruefen({ ...e, dauer: 45 }, B - T, 0), /Dauer/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 19 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 3 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 4.5 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen(e, B - T, RT.offenMax), /schon 3 Tische/);
assert.equal(RT.plaetzeMax, 18, "Wahl Hansi: höchstens 18");

// Wer sitzt? frisch / unsicher / weg
const z = (pid, vorSek) => ({ person_id: pid, dabei_seit: new Date(B - 600000).toISOString(), zuletzt_da: new Date(B - vorSek * 1000).toISOString(), verlassen_am: null });
assert.ok(rtSitzt(z("a", 10), B) && rtSicher(z("a", 10), B));
assert.ok(rtSitzt(z("a", 100), B) && !rtSicher(z("a", 100), B), "nach 90 s grau, aber noch am Platz");
assert.ok(!rtSitzt(z("a", RT.frischSek + 1), B), "nach 150 s ist der Platz frei");
assert.ok(!rtSitzt({ ...z("a", 10), verlassen_am: new Date(B).toISOString() }, B), "verlassen");
assert.ok(!rtSitzt({ person_id: "a", dabei_seit: null, zuletzt_da: null }, B), "nur zugesagt ist nicht am Tisch");

// Platz nehmen: Vorlauf, voll, schon da
assert.match(rtBeitretenPruefen(tisch, B - 20 * M, [], "a"), /ab 15 Minuten/);
assert.equal(rtBeitretenPruefen(tisch, B - 10 * M, [], "a"), null);
const voll = Array.from({ length: 18 }, (_, i) => z("p" + i, 5));
assert.match(rtBeitretenPruefen(tisch, B + M, voll, "neu"), /voll/);
assert.equal(rtBeitretenPruefen(tisch, B + M, voll, "p3"), null, "wer schon sitzt, darf bleiben");
assert.equal(rtBeitretenPruefen(tisch, B + M, [...voll.slice(1), z("weg", 999)], "neu"), null, "abgelaufener Platz ist frei");
assert.match(rtBeitretenPruefen({ ...tisch, status: "abgesagt" }, B, [], "a"), /abgesagt/);
assert.match(rtBeitretenPruefen(tisch, B + 61 * M, [], "a"), /vorbei/);

// Gastgeber
assert.match(rtGastgeberPruefen(tisch, "absagen", B - T, false), /nur, wer eingeladen/);
assert.equal(rtGastgeberPruefen(tisch, "absagen", B - T, true), null);
assert.match(rtGastgeberPruefen(tisch, "absagen", B + M, true), /geschlossen, nicht abgesagt/);
assert.equal(rtGastgeberPruefen(tisch, "verlaengern", B + M, true), null);
assert.equal(rtGastgeberPruefen({ ...tisch, verlaengert_min: 30 }, "verlaengern", B + M, true), null);
assert.match(rtGastgeberPruefen({ ...tisch, verlaengert_min: 60 }, "verlaengern", B + M, true), /Höchstens 60/);
assert.match(rtGastgeberPruefen(tisch, "verlaengern", B - M, true), /solange der Tisch läuft/);
assert.equal(rtGastgeberPruefen(tisch, "schliessen", B + M, true), null);
assert.match(rtGastgeberPruefen(tisch, "constructor", B + M, true), /Unbekannte/);

// Aufräumen (Wahl Hansi: Medien 7 Tage, Text 30 Tage)
const ende = B + 60 * M;
assert.deepEqual(rtAufraeumen(tisch, ende + 6 * T), { medien: false, text: false });
assert.deepEqual(rtAufraeumen(tisch, ende + 7 * T), { medien: true, text: false });
assert.deepEqual(rtAufraeumen(tisch, ende + 30 * T), { medien: true, text: true });
assert.deepEqual(rtAufraeumen({ ...tisch, medien_geloescht_am: "x" }, ende + 30 * T), { medien: false, text: true });
assert.deepEqual(rtAufraeumen({ ...tisch, status: "abgesagt" }, B + 7 * T), { medien: true, text: false }, "abgesagt: ab dem geplanten Beginn gerechnet");
assert.deepEqual(rtAufraeumen(tisch, B), { medien: false, text: false }, "laufender Tisch nie");

assert.equal(rtText(tisch), "Do 05.11. 20:00 Uhr · 60 Min.");

// Migration: Tabellen mit Rechten, Platzgrenze unter Sperre, Funktion nur für den Club-Server
const sql = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2762_runder_tisch.sql", import.meta.url), "utf8");
assert.match(sql, /plaetze integer not null[^,]*check \(plaetze between 4 and 18\)/);
assert.match(sql, /for update/, "Platzgrenze unter Zeilensperre");
assert.match(sql, /revoke all on function public\.kc_club_tisch_beitreten\([^)]*\) from public, anon, authenticated;/);
assert.match(sql, /grant execute on function public\.kc_club_tisch_beitreten\([^)]*\) to service_role;/);
assert.match(sql, /set search_path = public/);

// Server und App: dieselben Grenzen, Zugang nur für Mitglieder, Freigabe erst „nur Admin“
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.match(server, /runder_tisch: \{ t: "🪑 Runder Tisch", [^}]*standard: "admin" \}/, "erst Hansi testet");
for (const a of ["tisch_liste", "tisch_anlegen", "tisch_zusage", "tisch_platz", "tisch_verlassen", "tisch_gastgeber", "tisch_seminare_meine", "tisch_zeit_pruefen", "tisch_tasche", "tisch_tasche_legen", "tisch_tasche_aendern"]) {
  assert.ok(server.includes(`case "${a}":`), "Server-Aktion fehlt: " + a);
  assert.ok(app.includes(`"${a}"`), "App ruft nicht: " + a);
  assert.ok(!server.slice(server.indexOf("const ZUGANG_AKTIONEN"), server.indexOf("const ZUGANG_ERLAUBT")).includes(`"${a}"`), "Gäste/Aushilfen dürfen nicht: " + a);
}
assert.match(app, /const RT_HERZ_TISCH_MS = 60000;/, "Herzschlag alle 60 s (KC-DB-SPARSAM)");
assert.match(server, /tischWartung\(stuendlich\)/, "Erinnerung und Aufräumen in der Wartung");

// 2.762.0 KC-CLUB-RUNDER-TISCH-ARTEN (RT1b): drei Arten, Seminar mit Anmeldung und Teilnahmebestätigung, Besprechung mit Tagesordnung
assert.deepEqual(Object.keys(RT_ARTEN), ["runder_tisch", "seminar", "besprechung"]);
assert.equal(rtArt({}).t, "Runder Tisch", "alte Tische ohne Art = Runder Tisch");
assert.match(rtAnlegenPruefen({ ...e, art: "konferenz" }, B - T, 0), /Art/);
assert.equal(rtAnlegenPruefen({ ...e, art: "besprechung", tagesordnung: ["Begrüßung", "Weihnachtsmarkt"] }, B - T, 0), null);
assert.match(rtAnlegenPruefen({ ...e, art: "besprechung", tagesordnung: Array(13).fill("x") }, B - T, 0), /12 Punkte/);
assert.match(rtAnlegenPruefen({ ...e, art: "besprechung", tagesordnung: ["x".repeat(121)] }, B - T, 0), /zu lang/);
assert.match(rtAnlegenPruefen({ ...e, art: "seminar", tagesordnung: ["x"] }, B - T, 0), /nur bei der Besprechung/);
assert.equal(rtAnlegenPruefen({ ...e, art: "seminar", tagesordnung: [] }, B - T, 0), null);
const sem = { ...tisch, art: "seminar", plaetze: 4, gastgeber: "REF" };
assert.equal(rtZusagePruefen(sem, "ja", ["REF", "a", "b", "c"], "d", B - T), null, "Referent zählt nicht mit");
assert.match(rtZusagePruefen(sem, "ja", ["REF", "a", "b", "c", "d"], "e", B - T), /ausgebucht/);
assert.equal(rtZusagePruefen(sem, "ja", ["a", "b", "c", "d"], "d", B - T), null, "schon angemeldet");
assert.equal(rtZusagePruefen(sem, null, ["a", "b", "c", "d"], "e", B - T), null, "abmelden geht immer");
assert.equal(rtZusagePruefen({ ...tisch, plaetze: 4 }, "ja", ["a", "b", "c", "d"], "e", B - T), null, "Runder Tisch: Zusage unbegrenzt (Plätze zählen erst am Tisch)");
assert.match(rtZusagePruefen(sem, "ja", [], "e", B + 61 * M), /vorbei/);
// Teilnahmebestätigung: mindestens die Hälfte der Zeit (60 Min. → 30 Min.)
const da = (von, bis) => ({ dabei_seit: new Date(B + von * M).toISOString(), zuletzt_da: new Date(B + bis * M).toISOString() });
assert.ok(rtBestaetigung(da(0, 59), sem), "ganz dabei");
assert.equal(rtBestaetigung(da(0, 59), sem).min, 60, "letzter Herzschlag zählt bis zur nächsten Minute, höchstens bis zum Ende");
assert.ok(rtBestaetigung(da(-10, 29), sem), "vorher Platz genommen zählt ab Beginn: 30 Min.");
assert.equal(rtBestaetigung(da(0, 20), sem), null, "zu kurz");
assert.equal(rtBestaetigung(da(0, 59), tisch), null, "nur beim Seminar");
assert.equal(rtBestaetigung(da(0, 59), { ...sem, status: "abgesagt" }), null);
assert.equal(rtBestaetigung({ dabei_seit: null }, sem), null);
assert.equal(rtAnwesend(da(70, 80), sem), null, "nach dem Ende zählt nicht");
// App und Server: dieselben Arten; Migration nur additiv, Seminar nur mit Anmeldung
const appArten = new Function(app.slice(app.indexOf("const RUND_ARTEN = {"), app.indexOf("const RUND_ART_TEXT")) + "\nreturn RUND_ARTEN;")();
assert.deepEqual(appArten, RT_ARTEN, "RUND_ARTEN (App) = RT_ARTEN (Server)");
const sql2 = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2762_tisch_arten.sql", import.meta.url), "utf8");
assert.ok(!/drop\s+table|drop\s+column/i.test(sql2.replace(/--[^\n]*/g, "")), "nur additiv");
assert.match(sql2, /if v_t\.art = 'seminar' and p_person <> v_t\.gastgeber and \(not found or coalesce\(v_z\.zusage, ''\) <> 'ja'\) then return 'anmeldung'; end if;/);
assert.match(server, /if \(rtArt\(x\)\.bestaetigung\) await db\.from\("kc_club_tisch_teilnahme"\)\.delete\(\)\.eq\("tisch_id", x\.id\)\.is\("dabei_seit", null\);/, "Seminar: Anwesende bleiben für die Bestätigung");
assert.match(app, /tischbestaetigung: \{ bauen: \(o, p\) => druckTischBestaetigung\(p\) \}/, "Bestätigung über den Druck (Briefbogen, PDF)");
assert.match(app, /<div id="smSeminare"><\/div>/, "in „Meine Schulung“");

// 2.762.0 KC-CLUB-RUNDER-TISCH-PLATZ: Größe aus dem echten Platz (Messung 30.10.2026, Tischbreite W = 288 px bei 320 px Handy … 420 px)
const rundGroesse = new Function(app.slice(app.indexOf("const RUND_PLATZ = {"), app.indexOf("const rundBreite")) + "\nreturn rundGroesse;")();
const G = (W, n) => { const g = rundGroesse(W, n); return `${g.d}${g.figur ? "F" : "B"}${g.namen ? "N" : ""}`; };
assert.equal(G(288, 8), "46FN"); assert.equal(G(288, 10), "46F"); assert.equal(G(288, 16), "40F"); assert.equal(G(288, 18), "35B", "kleinstes Handy, 18 Personen: nur Buchstaben");
assert.equal(G(328, 18), "40F", "ab 360 px Handy passen 18 Koch-Figuren"); assert.equal(G(358, 10), "56FN"); assert.equal(G(358, 12), "56F"); assert.equal(G(420, 18), "53F");
for (const W of [288, 328, 358, 380, 398, 420]) for (let n = 2; n <= 18; n++) {
  const g = rundGroesse(W, n), s2 = 2 * 0.41 * W * Math.sin(Math.PI / n);
  assert.ok(g.d <= s2 - 6 && g.d <= 0.16 * W && g.d <= 56, `Kreise überlappen nicht und bleiben in der Fläche (W ${W}, n ${n})`);
}
// 2.762.0 KC-CLUB-RUNDER-TISCH-GRUPPE: Tische einer Gruppe nur für ihre Mitglieder
const sql3 = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2762_tisch_gruppe.sql", import.meta.url), "utf8");
assert.match(sql3, /if v_t\.gruppe_id is not null and p_person <> v_t\.gastgeber\s+and not exists \(select 1 from public\.kc_communication_thread_participants where thread_id = v_t\.gruppe_id and person_id = p_person\) then return 'gruppe'; end if;/);
assert.match(sql3, /return 'anmeldung'/, "Seminar-Regel bleibt");
assert.match(server, /const ts = \(alle \?\? \[\]\)\.filter\(\(x: any\) => \(gast \? x\.id === ich\.tischgast!\.tisch : rtSichtbar\(x, ich, gr\)\)\);/, "Liste: Gruppen-Tische nur für Mitglieder (2.776.0: Tischgast nur sein Tisch)");
assert.match(server, /if \(gruppeId && !gruppe\) throw new Fehler\("Diese Gruppe gibt es nicht oder du bist nicht darin\.", 403\);/, "nur für eigene Gruppe einladen");
assert.equal((server.match(/rtTischHolen\(p\.id, ich\)/g) || []).length, 7, "Zusage, Verlassen, Leiten, die drei Tasche-Aktionen und Gast einladen (2.776.0) prüfen die Gruppe");

// 2.764.0 KC-CLUB-RUNDER-TISCH-ZEITCHECK: kein Clubabend, immer nur ein Tisch; andere Termine nur mit Rückfrage
const I = (m) => new Date(B + m * M).toISOString(), Z = (a, b) => ({ vonMs: B + a * M, bisMs: B + b * M });
const andererTisch = { id: "x", art: "seminar", thema: "Kasse", beginn: I(0), ende: I(60), status: "geplant", sichtbar: true };
assert.equal(rtKonflikte(Z(30, 90), [andererTisch], []).sperre[0].was, "tisch", "überschneidet sich → gesperrt");
assert.ok(rtKonflikte(Z(60, 120), [andererTisch], []).frei, "direkt danach geht");
assert.ok(rtKonflikte(Z(-60, 0), [andererTisch], []).frei, "direkt davor geht");
assert.ok(rtKonflikte(Z(30, 90), [{ ...andererTisch, status: "abgesagt" }], []).frei, "abgesagt zählt nicht");
assert.ok(rtKonflikte(Z(30, 90), [andererTisch], [], "x").frei, "beim Verlängern zählt der eigene Tisch nicht");
assert.equal(rtKonflikte(Z(30, 90), [{ ...andererTisch, sichtbar: false }], []).sperre[0].thema, null, "fremder Gruppen-Tisch: ohne Thema");
assert.match(rtKonfliktText(rtKonflikte(Z(30, 90), [andererTisch], []).sperre[0]), /schon ein Seminar \(„Kasse“\), 20:00–21:00 Uhr\. Es geht immer nur einer gleichzeitig/);
const abend = { titel: "Clubabend", beginn: I(0), ende: null, art: "treffen", status: "geplant", zusagen: 12 };
assert.equal(rtTreffenBis(abend), B + 3 * 60 * M, "Clubabend ohne Ende = 3 Std. (wie Kalender-Export)");
assert.equal(rtKonflikte(Z(150, 210), [], [abend]).sperre[0].was, "clubabend", "Clubabend gleichzeitig → gesperrt");
assert.match(rtKonfliktText(rtKonflikte(Z(150, 210), [], [abend]).sperre[0]), /Clubabend \(„Clubabend“, 20:00–23:00 Uhr, 12 haben zugesagt\) – dann bitte keinen Tisch/);
assert.ok(rtKonflikte(Z(180, 240), [], [abend]).frei, "nach dem Clubabend geht");
assert.ok(rtKonflikte(Z(150, 210), [], [{ ...abend, status: "abgesagt" }]).frei);
const markt = { titel: "Weihnachtsmarkt", beginn: I(-2 * 24 * 60), ende: I(2 * 24 * 60), art: "veranstaltung", status: "geplant" };
const km = rtKonflikte(Z(0, 60), [], [markt]);
assert.ok(km.frei && km.hinweis.length === 1, "Veranstaltung: nur Hinweis mit Rückfrage");
assert.match(rtKonfliktText(km.hinweis[0]), /Weihnachtsmarkt“ \(\d\d\.\d\d\.–\d\d\.\d\d\.\)/, "mehrtägig mit Datum");
const sql4 = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2764_tisch_nur_einer.sql", import.meta.url), "utf8");
assert.match(sql4, /exclude using gist \(tstzrange\(beginn, ende, '\[\)'\) with &&\) where \(status = 'geplant'\)/, "Datenbank: nie zwei Tische gleichzeitig");
assert.match(server, /if \(zl\.sperre\.length\) throw new Fehler\(zl\.sperre\[0\], 409\);/, "Einladen prüft vorher");
assert.match(server, /error\?\.code === "23P01" \? new Fehler\(RT_DOPPELT, 409\)/, "gleichzeitig eingeladen → verständliche Meldung");
assert.match(app, /if \(los\) los\.disabled = !!r\.sperre\.length;/, "Einladen gesperrt, solange die Zeit belegt ist");

// 2.766.0 KC-CLUB-RUNDER-TISCH-LIVE: Ton, Kamera, Bildschirm, Unterlagen zeigen (teile/tischlive.js) – Regeln und Sicherungen
const tl = fs.readFileSync(new URL("../teile/tischlive.js", import.meta.url), "utf8");
const L = new Function(tl.slice(0, tl.indexOf("const tlTisch")) + "\nreturn { tlRegeln, tlKbit, TL_FREI, TL_WEG_MS };")();
assert.equal(L.TL_FREI, 6, "offenes Gespräch bis 6 Personen");
assert.ok(L.tlRegeln({ liveAnzahl: 6, ich: "b", gastgeber: "a", stab: null }).darfSprechen, "bis 6 reden alle");
assert.ok(!L.tlRegeln({ liveAnzahl: 7, ich: "b", gastgeber: "a", stab: null }).darfSprechen, "ab 7: nur mit Redestab");
assert.ok(L.tlRegeln({ liveAnzahl: 18, ich: "a", gastgeber: "a", stab: null }).darfSprechen, "die Leitung spricht immer");
assert.ok(L.tlRegeln({ liveAnzahl: 18, ich: "b", gastgeber: "a", stab: "b" }).darfSprechen, "mit Redestab");
assert.equal(L.tlRegeln({ liveAnzahl: 18, ich: "b", gastgeber: "a", stab: "c" }).modus, "stab");
assert.equal(L.tlKbit(1), 1000, "ein Empfänger: höchstens 1000 kbit/s Bild");
assert.equal(L.tlKbit(17), 150, "17 Empfänger: 150 kbit/s je Empfänger (Handy schafft das)");
assert.ok(L.TL_WEG_MS <= 45000, "nach 45 s ohne Lebenszeichen: grau (unbekannt)");
assert.match(server, /if \(ergebnis === "ok" \|\| ergebnis === "da"\) return json\(\{ ok: true, ergebnis, lage, live: await rtLiveLeitung\(id\) \}\);/, "Live-Leitung nur für Sitzende");
assert.match(server, /async function rtLiveLeitung\(tischId: string\)[\s\S]{0,400}HMAC[\s\S]{0,600}kc-fh-/, "Kanal/Schlüssel abgeleitet (HMAC), Format wie Fernhilfe");
assert.ok(!/rtLiveLeitung/.test(server.slice(server.indexOf('case "tisch_liste"'), server.indexOf('case "tisch_platz"'))), "Liste verrät die Leitung nicht");
assert.match(tl, /TL\.L = fhLeitung\(RUND\.live, tlEmpfang/, "Leitung = Fernhilfe-Technik (verschlüsselt)");
assert.match(tl, /new RTCPeerConnection\(\{ iceServers: await rufIce\(\) \}\)/, "Wege wie beim App-Anruf (inkl. Umleitung)");
assert.match(tl, /if \(d\.an && d\.an !== TL\.ich\) return;/, "Nachrichten an andere werden ignoriert");
assert.match(tl, /if \(d\.typ === "stab" && vomLeiter\)/, "Redestab nur von der Leitung");
assert.match(tl, /api\("nachricht_senden", \{ id: t\.chat, text: `📎 Unterlage: \$\{datei\.name\}`, anlagen: \[a\.id\]/, "Unterlagen gehen in den Tisch-Chat (Zugriff prüft der Server)");
assert.match(tl, /if \(typeof z\.a !== "string" \|\| !\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(z\.a\)\) return;/, "gezeigte Unterlage nur als Kennung");
assert.ok(!/MediaRecorder/.test(tl), "keine Aufzeichnung");
assert.match(tl, /const k = TL\.iceVorab\.get|TL\.iceVorab\.get\(k\)/, "früh ankommende Wege werden gesammelt (2.773.0)");
assert.match(tl, /TL\.baue\.add\(an\)/, "nie zwei Verbindungen gleichzeitig für dieselbe Person");
assert.match(tl, /if \(von !== TL\.ich && t\?\.gastgeber !== TL\.ich\) return "";/, "📸 Ins Album nur Zeigender oder Leitung");
assert.match(tl, /if \(datei\.size > 8 \* 1024 \* 1024\) return melde\(art === "video"/, "🎬 Video höchstens 8 MB");
assert.match(tl, /api\("nachricht_senden", \{ id: t\.chat, text: `\$\{art === "video" \? "🎬 Video" : "🎵 Musik"\} für alle: \$\{datei\.name\}`, anlagen: \[a\.id\]/, "🎵/🎬 Lied und Video gehen in den Tisch-Chat (2.767.0/2.773.0)");
assert.match(tl, /if \(typeof m\.a !== "string" \|\| !\/\^\[0-9a-f-\]\{36\}\$\/i\.test\(m\.a\)/, "🎵 nur Kennung über die Leitung");
assert.ok(!/["'`][\w./-]*\/[\w.-]+\.(mp3|m4a|ogg|wav)["'`]/.test(tl) && !/new Audio\(/.test(tl), "🎵 kein Lied fest eingebaut (keine Datei-Pfade)");
assert.match(app, /if \(rundLiveAn\(id\)\) tlStopp\(true\); const r = await api\("tisch_verlassen"/, "Verlassen beendet Live");

// 2.774.0 KC-CLUB-TISCH-TASCHE: jeder packt seine eigene Tasche (PDF, Foto, Musik), die Leitung markiert „vorab für alle“
assert.equal(rtTascheArt("Ablauf.PDF", ""), "pdf"); assert.equal(rtTascheArt("x", "image/jpeg"), "foto"); assert.equal(rtTascheArt("Club-Song.mp3", "application/octet-stream"), "musik");
assert.equal(rtTascheArt("tabelle.xlsx", "application/vnd.ms-excel"), null, "nur PDF, Foto, Musik");
assert.equal(rtTascheLegenPruefen(tisch, B - T, 0, "pdf"), null, "vorher packen geht");
assert.equal(rtTascheLegenPruefen(tisch, B + M, 3, "musik"), null, "während des Tisches auch");
assert.match(rtTascheLegenPruefen(tisch, B + 61 * M, 0, "pdf"), /vorbei/);
assert.match(rtTascheLegenPruefen(tisch, B - T, RT_TASCHE.max, "pdf"), /Höchstens 20/);
assert.match(rtTascheLegenPruefen(tisch, B - T, 0, null), /PDFs, Fotos und Musik/);
const teile = [{ id: "a", pos: 1 }, { id: "b", pos: 2 }, { id: "c", pos: 5 }];
assert.deepEqual(rtTascheSchieben(teile, "c", "hoch"), [{ id: "c", pos: 2 }, { id: "b", pos: 5 }]);
assert.deepEqual(rtTascheSchieben(teile, "a", "hoch"), [], "oben bleibt oben");
assert.deepEqual(rtTascheSchieben(teile, "c", "runter"), []);
const sql5 = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2774_tisch_tasche.sql", import.meta.url), "utf8");
assert.match(sql5, /references public\.kc_club_tisch\(id\) on delete cascade/); assert.match(sql5, /art in \('pdf', 'foto', 'musik'\)/);
assert.match(server, /if \(!\(x\.gastgeber === ich\.person_id \|\| ich\.admin\)\) throw new Fehler\("„Vorab für alle“ markiert, wer den Tisch leitet\.", 403\);/, "vorab nur die Leitung");
assert.match(server, /if \(!att \|\| !String\(att\.object_path\)\.startsWith\(`club\/\$\{ich\.person_id\}\/`\)\)/, "nur eigene Dateien einpacken");
assert.match(server, /\.or\(`person_id\.eq\.\$\{ich\.person_id\},vorab\.eq\.true`\)/, "fremde Taschen nur, was vorab ist");
assert.match(server, /if \(!erlaubt\) erlaubt = await rtTascheVorabErlaubt\(ich, att\.id\)/, "Vorab-Dateien öffnen dürfen alle, die den Tisch sehen");
assert.match(server, /await db\.from\("kc_club_tisch_tasche"\)\.delete\(\)\.eq\("tisch_id", x\.id\); await rtTascheDateienWeg/, "Aufräumen nach 7 Tagen");
// 2.776.0 KC-CLUB-RUNDER-TISCH-GAST (RT4): externe Tischgäste – Regeln und Sicherungen
{
  const t0 = { beginn: new Date(B).toISOString(), dauer_min: 60, verlaengert_min: 0, status: "geplant" };
  assert.match(rtGastFenster(t0, B - 31 * M), /erst ab 30 Minuten vor Beginn/, "Link gilt nicht früher als 30 Min. vorher");
  assert.equal(rtGastFenster(t0, B - 30 * M), null, "ab 30 Min. vorher");
  assert.equal(rtGastFenster(t0, B + 59 * M), null, "bis zum Ende");
  assert.match(rtGastFenster(t0, B + 60 * M), /vorbei/, "nach dem Ende ungültig");
  assert.match(rtGastFenster({ ...t0, verlaengert_min: 30 }, B + 60 * M) ?? "ok", /ok/, "verlängert → gilt weiter");
  assert.match(rtGastFenster({ ...t0, status: "abgesagt" }, B), /abgesagt/);
  assert.match(rtGastFenster(null, B), /gibt es nicht/);
  assert.equal(rtGastEinladenPruefen(t0, 0, "Dr. Weber", B - 60 * M), null, "einladen geht");
  assert.match(rtGastEinladenPruefen(t0, RT_GAST.max, "Dr. Weber", B - 60 * M), /höchstens 2 Gäste/, "höchstens 2 Gäste");
  assert.match(rtGastEinladenPruefen(t0, 0, " ", B - 60 * M), /Namen/, "Name nötig");
  assert.match(rtGastEinladenPruefen(t0, 0, "Dr. Weber", B + 61 * M), /vorbei/, "nicht für vorbei");
  assert.ok(rtIstGast(rtGastPid("x")) && !rtIstGast("KC-P-002"), "Gast-Kennung unterscheidbar");
  // Server: eigener Anmeldeweg, nur der Fingerabdruck des Links, ein Gerät, nur Erlaubtes, nur der eigene Tisch
  assert.match(server, /if \(\/\^tg_\[0-9a-f\]\{48\}\$\/\.test\(token\)\) return await anmeldenTischgast\(req, token\);/, "Gast-Link eigener Anmeldeweg");
  assert.ok(server.indexOf("return await anmeldenTischgast(req, token);") < server.indexOf('if (!/^[0-9a-f]{32,96}$/.test(token)) { if (token) fremdMerken(req, "kaputt"'), "vor der Mitglieder-Anmeldung");
  const ag = server.slice(server.indexOf("async function anmeldenTischgast("), server.indexOf("async function rtGastAnlageErlaubt("));
  assert.match(ag, /eq\("link_hash", hash\)/, "nur über den Fingerabdruck gesucht");
  assert.match(ag, /rtGastFenster\(t, Date\.now\(\)\)/, "Zeitfenster geprüft");
  assert.match(ag, /zurueckgezogen_am/, "zurückgezogen = ungültig");
  assert.match(ag, /\.is\("geraet_hash", null\)/, "Gerät wird nur beim ersten Öffnen gebunden (atomar)");
  assert.match(ag, /if \(g\.geraet_hash !== gh\)/, "anderes Gerät abgelehnt");
  assert.match(ag, /admin: false, vorstand: false, aemter: \[\], protokolle: false, kontakte: false, buero: null/, "Gast hat keine Rechte");
  assert.ok(!/kc_core_people|kc_club_rollen|kc_club_zugang/.test(ag), "Gast berührt keine Mitglieder-Tabellen");
  const tga = server.match(/const TISCHGAST_AKTIONEN = \[([^\]]*)\]/)[1].match(/"[a-z_]+"/g).map((x) => x.slice(1, -1)).sort();
  assert.deepEqual(tga, ["anlage_url", "anruf_wege", "diagnose", "ping", "tisch_platz", "tisch_verlassen", "tischgast_init"], "Gast darf nur diese Aktionen");
  assert.match(server, /tischgast: new Set<string>\(TISCHGAST_AKTIONEN\)/, "zugangPruefen nutzt die Liste");
  const tl = fs.readFileSync(new URL("./tisch-live.browser.mjs", import.meta.url), "utf8");
  assert.deepEqual(tl.match(/const GAST_ERLAUBT = new Set\(\[([^\]]*)\]\)/)[1].match(/"[a-z_]+"/g).map((x) => x.slice(1, -1)).sort(), tga, "Browser-Test prüft dieselbe Liste");
  assert.match(server, /if \(ich\.zugang === "tischgast" && id !== ich\.tischgast!\.tisch\) throw new Fehler/, "Platz nur am eigenen Tisch");
  assert.match(server, /if \(ich\.zugang === "tischgast" && String\(p\.id \|\| ""\) !== ich\.tischgast!\.tisch\) throw new Fehler/, "Verlassen nur am eigenen Tisch");
  assert.match(server, /if \(ich\.zugang === "tischgast"\) \{ erlaubt = await rtGastAnlageErlaubt\(ich, att\.id\); if \(!erlaubt\) throw new Fehler\("Anlage nicht gefunden\.", 404\); \}/, "Anlagen nur aus dem eigenen Tisch-Chat – sonst nichts");
  assert.match(server, /if \(ich\.zugang !== "tischgast"\) throw new Fehler\("Nur für Tischgäste\.", 403\);/, "tischgast_init nur für Gäste");
  const lg = server.slice(server.indexOf("async function rtLage("), server.indexOf("// 2.764.0 KC-CLUB-RUNDER-TISCH-ZEITCHECK: was ist an diesem Tag"));
  assert.match(lg, /gast \? x\.id === ich\.tischgast!\.tisch : rtSichtbar\(x, ich, gr\)/, "Gast sieht nur seinen Tisch");
  assert.match(lg, /gast \? vorname\(pm\.get\(id\)\)/, "Gast sieht nur Vornamen");
  assert.match(lg, /chat: gast \|\| x\.text_geloescht_am \? null/, "Gast bekommt keinen Chat");
  assert.match(lg, /zusagen: gast \? \[\]/, "Gast bekommt keine Zusagen-Liste");
  assert.match(lg, /gaeste: gast \? \[\]/, "Gast sieht keine anderen Gast-Einladungen");
  const ein = server.slice(server.indexOf('case "tisch_gast_einladen"'), server.indexOf('case "tisch_gast_zurueckziehen"'));
  assert.match(ein, /link_hash: await sha256\(token\)/, "nur der Fingerabdruck wird gespeichert");
  assert.ok(!/\b(senden|rtSenden|routerSenden|mailSenden)\(/.test(ein.replace(/\/\/[^\n]*/g, "")), "der Link geht nie vom Server per Push/Mail raus");
  assert.match(ein, /rtTischHolen\(p\.id, ich\)/, "nur wer den Tisch sieht, lädt ein (Gruppen-Tische)");
  assert.match(server.slice(server.indexOf('case "tisch_gast_zurueckziehen"'), server.indexOf('case "tisch_verlassen"')), /g\.eingeladen_von === ich\.person_id \|\| x\.gastgeber === ich\.person_id \|\| ich\.admin/, "zurückziehen: Einladende, Leitung, Admin");
  assert.match(server, /await db\.from\("kc_club_tisch_gast"\)\.delete\(\)\.eq\("tisch_id", x\.id\)/, "Gäste 7 Tage nach Ende gelöscht");
  const sql = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2776_tisch_gast.sql", import.meta.url), "utf8");
  assert.match(sql, /link_hash text not null unique check \(link_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/, "Datenbank nimmt nur Fingerabdrücke");
  assert.ok(!/thread_participants\s*\(/.test(sql.slice(sql.indexOf("create or replace function"))), "Gast wird nie Teilnehmer des Tisch-Chats");
  assert.match(sql, /for update;/, "Platzgrenze unter Zeilensperre");
  // App: eigener Start, Link nie als Mitglieder-Link gespeichert, Geräte-Kennung mitgeschickt
  assert.match(app, /if \(g && \/\^tg_\[0-9a-f\]\{48\}\$\/\.test\(g\)\) \{ url\.searchParams\.delete\("g"\); history\.replaceState\(null, "", url\.pathname\); return gastStart\(g\); \}/, "Gast-Start vor allem anderen");
  const gs = app.slice(app.indexOf("async function gastStart("), app.indexOf("// ---------- Start der App ----------"));
  assert.ok(!/kc_club_key/.test(gs) && /sessionStorage\.setItem\("kc_tischgast", token\)/.test(gs), "Gast-Link nur in der Sitzung, nie als Mitglieder-Link");
  assert.match(app, /\.\.\.\(TG_GERAET \? \{ "x-tg-geraet": TG_GERAET \} : \{\}\)/, "Geräte-Kennung geht mit");
}

// 2.778.0 KC-CLUB-RUNDER-TISCH-UHR: Countdown bis Beginn und Restzeit – Anzeige-Formate (zählt nur auf dem Gerät, keine Abfrage)
const rundUhrText = new Function(app.slice(app.indexOf("function rundUhrText(rest) {"), app.indexOf("function rundUhrHtml(")) + "\nreturn rundUhrText;")();
assert.equal(rundUhrText(754000), "12:34"); assert.equal(rundUhrText(59000), "0:59"); assert.equal(rundUhrText(1), "0:01", "angefangene Sekunde zählt mit");
assert.equal(rundUhrText(0), "0:00"); assert.equal(rundUhrText(-5000), "0:00", "nie negativ");
assert.equal(rundUhrText(3600000), "1 Std. 00 Min."); assert.equal(rundUhrText(2 * 3600000 + 5 * 60000), "2 Std. 05 Min.");
assert.equal(rundUhrText(86400000), "1 Tag"); assert.equal(rundUhrText(3 * 86400000 + 5000), "3 Tagen");
assert.match(app, /setInterval\(\(\) => \{\n  if \(document\.hidden\) return;\n  let um = false;/, "Uhr tickt nur, wenn die App sichtbar ist");
// 2.779.0 KC-CLUB-RUNDER-TISCH-WIEDERHOLEN: nächster gleicher Wochentag, gleiche Uhrzeit (Berlin, auch über die Zeitumstellung)
const rundWiederholenTag = new Function(app.slice(app.indexOf("function rundWiederholenTag("), app.indexOf("function rundWiederholen(id)")) + "\nreturn rundWiederholenTag;")();
assert.deepEqual(rundWiederholenTag("2026-10-29T19:00:00Z", Date.parse("2026-10-30T14:00:00Z")), { datum: "2026-11-05", uhr: "20:00" }, "Do 20 Uhr → nächster Do");
assert.deepEqual(rundWiederholenTag("2026-10-01T18:00:00Z", Date.parse("2026-10-30T14:00:00Z")), { datum: "2026-11-05", uhr: "20:00" }, "Sommerzeit 20 Uhr bleibt 20 Uhr, mehrere Wochen weiter");
assert.deepEqual(rundWiederholenTag("2026-11-12T19:00:00Z", Date.parse("2026-10-30T14:00:00Z")), { datum: "2026-11-12", uhr: "20:00" }, "abgesagt, noch nicht dran: gleicher Tag");
assert.match(app, /t\.phase === "vorbei" \|\| \(t\.phase === "abgesagt" && t\.darfLeiten\)\) knoepfe\.push\(k\(`rundWiederholen/, "Knopf auf der Karte");
console.log("OK – Runder Tisch: Regeln geprüft");
