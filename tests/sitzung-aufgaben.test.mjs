// KC-CLUB-SITZUNG-FRIST + KC-CLUB-SITZUNG-AUFGABE-START (2.750.0) und KC-CLUB-SITZUNG-ABLAUF / -VORGABEN / -KONTROLLE / KC-CLUB-AENDERUNG-MELDUNG /
// KC-CLUB-CLUBABEND-ABSCHLUSS / KC-CLUB-AKTENTASCHE-MITNEHMEN / KC-CLUB-EINGANG-MAILANHANG (2.751.0, Wunsch Hansi 29.10.2026: „Im richtigen Leben erstellt man
// die Tagesordnung, nimmt die Vorschläge auf, schickt 3 Tage vorher die Einladungen raus. Dann bereitet man die Sitzung vor … als letztes packt man seine
// Aktentasche … auf dem gelben Zettel immer die nächsten Schritte, bei Fristen automatisch erinnern beim Programmstart, auch Kassenwart und Admin zur Kontrolle“).
// Verhaltensprüfung (offline, nachgebaute Daten). Aufruf: node tests/sitzung-aufgaben.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
import { sitzungsUmgebung } from "./sitzung-umgebung.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const A = sitzungsUmgebung(app);
const H = 3600000, T = 86400000, jetzt = Date.now(), iso = (ms) => new Date(jetzt + ms).toISOString();
const sitzung = (x) => ({ id: "S1", titel: "Clubsitzung", beginn: iso(5 * T), vorbereitet: false, einladung_am: null, erinnerung_am: null, unterlagen_am: null, geaendert_nach_einladung: false, aktentasche: null, ohne: 3, ...x });
const ids = (t) => A.buSchritteFuer(t).map((x) => x.id), st = (t, id) => A.buSchritteFuer(t).find((x) => x.id === id);

// --- 1) Reihenfolge wie im richtigen Leben
assert.deepEqual(ids(sitzung()), ["vorschlaege", "vorbereiten", "einladung", "erinnerung", "unterlagen", "aktentasche", "clubabend"], "Vorschläge → Tagesordnung → Einladung → Erinnern → Vorbereiten → Aktentasche → Clubabend");
assert.deepEqual(ids.call(null, sitzung()).filter((x) => x !== "aktentasche"), sitzungsUmgebung(app, { vorstand: false }).buSchritteFuer(sitzung()).map((x) => x.id), "Aktentasche nur für die Clubleitung");
assert.equal(A.buNaechster(sitzung()), "vorbereiten", "1. Tagesordnung festlegen");
assert.equal(st(sitzung(), "vorschlaege").frage, undefined, "Vorschläge sind Info, keine Frage");
assert.equal(A.buNaechster(sitzung({ vorbereitet: true })), "einladung", "2. einladen");
const eingeladen = sitzung({ vorbereitet: true, einladung_am: iso(-H) });
assert.equal(A.buNaechster(eingeladen), null, "direkt nach der Einladung ist nichts fällig (5 Tage vorher) …");
assert.match(A.buDran(eingeladen).text, /An die Antwort erinnern · ab /, "… aber der gelbe Zettel zeigt den nächsten Schritt mit „ab …“");
assert.equal(A.buDran(eingeladen).spaeter, true);
assert.equal(A.buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), beginn: iso(1.9 * T) })), "erinnerung", "3. erinnern (2 Tage vorher)");
const erinnert = { vorbereitet: true, einladung_am: iso(-3 * T), erinnerung_am: iso(-H), beginn: iso(1.5 * T) };
assert.equal(A.buNaechster(sitzung(erinnert)), "unterlagen", "4. Sitzung vorbereiten (ab 2 Tage vorher)");
assert.equal(A.buNaechster(sitzung({ ...erinnert, beginn: iso(3.5 * T) })), null, "Sitzung vorbereiten noch nicht 3,5 Tage vorher");
assert.equal(A.buNaechster(sitzung({ ...erinnert, unterlagen_am: iso(-H) })), "aktentasche", "5. zuletzt die Aktentasche");
assert.equal(sitzungsUmgebung(app, { vorstand: false }).buNaechster(sitzung({ ...erinnert, unterlagen_am: iso(-H) })), null, "ohne Clubleitung keine Aktentasche");
assert.equal(A.buNaechster(sitzung({ ...erinnert, unterlagen_am: iso(-H), aktentasche: { status: "vorlaeufig" } })), "aktentasche", "vorläufig gepackt ist noch nicht fertig");
assert.equal(A.buNaechster(sitzung({ ...erinnert, unterlagen_am: iso(-H), aktentasche: { status: "gepackt" } })), null, "gepackt → bis zum Abend nichts mehr");
assert.equal(A.buNaechster(sitzung({ ...erinnert, unterlagen_am: iso(-H), aktentasche: { status: "gepackt" }, beginn: iso(H) })), "clubabend", "6. am Abend Clubabend Live");
assert.equal(A.buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), beginn: iso(2.5 * T), ohne: 0 })), null, "alle haben geantwortet → nichts zu erinnern");

// --- 2) Fristen aus den Sitzungs-Vorgaben (Standard: Vorschläge 4 Tage vorher 17 Uhr, Einladung 3 Tage vorher)
assert.equal(A.buFristText({ beginn: "2026-10-30T16:00:00Z" }), "bis spätestens Di., 27.10.", "Sitzung Fr 30.10. → Einladung bis Di 27.10.");
assert.equal(A.vsSchluss({ beginn: "2026-10-30T17:00:00Z", art: "treffen" }).toISOString(), "2026-10-26T16:00:00.000Z", "Vorschläge bis Mo 26.10. 17 Uhr (Winterzeit)");
assert.equal(A.vsSchluss({ beginn: "2026-06-26T16:00:00Z", art: "treffen" }).toISOString(), "2026-06-22T15:00:00.000Z", "… und im Sommer 17 Uhr Ortszeit");
const B = sitzungsUmgebung(app, { vorgaben: { einladung_tage: 5, vorschlag_tage: 7, vorschlag_stunde: 12 } });
assert.equal(B.buFristText({ beginn: "2026-10-30T16:00:00Z" }), "bis spätestens So., 25.10.", "eingestellt: 5 Tage vorher");
assert.equal(B.vsSchluss({ beginn: "2026-10-30T17:00:00Z", art: "treffen" }).toISOString(), "2026-10-23T10:00:00.000Z", "eingestellt: 7 Tage vorher 12 Uhr (23.10. noch Sommerzeit)");
assert.equal(A.vsSchluss({ beginn: "2026-10-30T17:00:00Z", art: "veranstaltung" }), null, "nur für Sitzungen");

// --- 3) Knapp (rot) bei überschrittener Frist
assert.equal(st(sitzung({ beginn: iso(2 * T) }), "vorbereiten").knapp, true, "Tagesordnung fehlt 2 Tage vorher");
assert.equal(st(sitzung({ beginn: iso(2 * T), vorbereitet: true }), "einladung").knapp, true, "Einladung fehlt 2 Tage vorher");
assert.match(A.buSchritteHtml(sitzung({ beginn: iso(2 * T), vorbereitet: true })), /class="bu-schritt jetzt knapp".*⚠️ Knapp – die Mitglieder haben nur noch wenig Zeit/s, "rot markiert");
assert.equal(st(sitzung({ beginn: iso(2 * T), vorbereitet: true, einladung_am: iso(-5 * T), geaendert_nach_einladung: true }), "einladung").knapp, false, "Änderung nach rechtzeitiger Einladung ist nicht knapp");
const spaet = sitzung({ ...erinnert, beginn: iso(12 * H) });
assert.equal(st(spaet, "unterlagen").knapp, true, "Sitzung vorbereiten: Frist 1 Tag vorher überschritten");
assert.match(A.buSchritteHtml(spaet), /⚠️ Knapp – die Sitzung ist bald/);
assert.doesNotMatch(A.buSchritteHtml(sitzung()), /knapp/, "mit Zeit: nichts rot");

// --- 4) Frage beim Start: genau eine, die nächste offene Aufgabe; Ja / Nein / Später
assert.equal(A.buAufgabeFuer(sitzung({ beginn: iso(10 * T) }), {}), null, "mehr als 7 Tage vorher: noch nicht fragen");
assert.equal(A.buAufgabeFuer(null, {}), null);
let a = A.buAufgabeFuer(sitzung(), {});
assert.equal(a.id, "vorbereiten"); assert.match(a.f.q, /Vorschläge der Mitglieder aufnehmen/); assert.equal(a.los, "buSitzungOeffnen('S1', 'to')", "öffnet „Tagesordnung festlegen“");
a = A.buAufgabeFuer(sitzung({ vorbereitet: true }), {});
assert.equal(a.f.q, "Die Tagesordnung ist fertig. Sollen alle Mitglieder jetzt die Einladung bekommen?", "Hansis Frage wörtlich");
assert.equal(a.los, "buEinladung('S1', false)"); assert.deepEqual(a.f.nein, ["✏️ Nein, erst die Tagesordnung ändern", "buSitzungOeffnen('S1', 'to')"]);
a = A.buAufgabeFuer(sitzung({ vorbereitet: true, einladung_am: iso(-T), geaendert_nach_einladung: true }), {});
assert.equal(a.k, "S1:einladung:aenderung"); assert.match(a.f.q, /Sollen die Mitglieder informiert werden\?/, "Clubleitung entscheidet");
assert.equal(a.los, "buEinladung('S1', false, true)", "Ja → Sende-Menü mit Änderungsmeldung"); assert.deepEqual(a.f.nein, ["🙅 Nein, nicht informieren", "buInformierenNein('S1')"], "Nein → nicht senden");
a = A.buAufgabeFuer(sitzung(erinnert), {});
assert.equal(a.id, "unterlagen"); assert.equal(a.los, "buSitzungOeffnen('S1', 'vor')", "öffnet „Sitzung vorbereiten“");
const reif = sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), beginn: iso(1.5 * T) });
assert.equal(A.buAufgabeFuer(reif, {}).id, "erinnerung");
assert.equal(A.buAufgabeFuer(reif, { "S1:erinnerung": jetzt + 3 * H }).id, "unterlagen", "Erinnern auf später → nächste Aufgabe");
assert.equal(A.buAufgabeFuer(reif, { "S1:erinnerung": "nie", "S1:unterlagen": jetzt + H }), null, "Nein + Später → Ruhe");
assert.equal(A.buAufgabeFuer(reif, { "S1:erinnerung": jetzt - 1 }).id, "erinnerung", "Später abgelaufen → wieder fragen");
const speicher = {}, C = sitzungsUmgebung(app, { speicher });
C.buAufgabeMerken("S0:x", jetzt - 1); C.buAufgabeMerken("S0:y", "nie"); C.buAufgabeMerken("S1:z", jetzt + H);
assert.deepEqual(Object.keys(C.buAufgabeMerker()).sort(), ["S0:y", "S1:z"], "abgelaufene Merker werden weggeräumt");

// --- 5) Kontrolle: Aufgaben nur für den, der vorbereitet (Amt), die übrige Clubleitung nur bei überschrittener Frist
assert.equal(A.buIchBereite({ vorbereiter: ["P9"] }), false, "Kassenwart/Admin sind nicht der Clubsprecher");
assert.equal(A.buIchBereite({ vorbereiter: ["P1"] }), true);
assert.equal(A.buIchBereite({ vorbereiter: [] }), true, "niemand hat das Amt → wer im Büro schreiben darf");
assert.equal(sitzungsUmgebung(app, { schreiben: false }).buIchBereite({ vorbereiter: [] }), false);
assert.equal(A.buKontrolleFuer(sitzung(), {}), null, "alles im Plan → kein Hinweis");
const k = A.buKontrolleFuer(sitzung({ beginn: iso(2 * T), vorbereitet: true }), {});
assert.deepEqual(k.l.map((x) => x.id), ["einladung"], "Hinweis: Einladung überfällig"); assert.equal(k.k, "S1:kontrolle:einladung");
assert.equal(A.buKontrolleFuer(sitzung({ beginn: iso(2 * T), vorbereitet: true }), { "S1:kontrolle:einladung": "nie" }), null, "„für diese Frist nicht mehr“");
const kz = app.slice(app.indexOf("function buKontrolleZeigen("), app.indexOf("// KC-CLUB-BUERO-RAUM (1.65.0"));
assert.match(kz, /anschreiben<\/button>/); assert.match(kz, /if \(w === "schreiben"\) return direkt\(wer\.person_id\);/, "Clubsprecher anschreiben");
assert.match(kz, /if \(!MITGLIEDER\) try \{ await mitgliederHolen\(\); \} catch \{\}/, "2.753.0: Mitgliederliste laden – sonst fehlt „anschreiben“ (Fund beim Film)");
assert.match(app, /Vorschlag laut ⚙️ Sitzungs-Vorgaben: <b>letzter \$\{esc\(SV_WTAGE\[v\.wochentag\]/, "2.753.0: Live-Abstimmung nennt die Vorgaben");
assert.match(app, /if \(!buIchBereite\(r\)\) return \(ICH\?\.vorstand \|\| ICH\?\.admin\) && buKontrolleZeigen\(t, r, besetzt, versuch\);/, "Start: Kontrolle statt Aufgaben");
assert.match(server, /const \{ data: vbr \} = await db\.from\("kc_club_rollen"\)\.select\("person_id"\)\.contains\("aemter", \[SV\.vorbereiter_amt\]\);/, "Server: wer vorbereitet (Amt aus den Vorgaben)");

// --- 5b) Vertretung (KC-CLUB-SITZUNG-VERTRETUNG, Wunsch Hansi „wenn der Clubsprecher krank ist, muss es ja einer übernehmen“)
assert.equal(A.buIchBereite({ vorbereiter: ["P9"], sitzungen: [{ vorbereiter: ["P1"] }] }), true, "Vertretung übernommen → ich bereite vor (Fragen beim Start)");
assert.equal(A.buIchBereite({ vorbereiter: ["P1"], sitzungen: [{ vorbereiter: ["P9"] }] }), false, "Clubsprecher bei Vertretung → nur Kontrolle");
const VU = sitzungsUmgebung(app, { ich: { person_id: "P9", admin: true } });
const vt = (x) => VU.buSchritteHtml(sitzung({ vorbereiter: ["P1"], ...x }));
assert.match(vt({}), /🙋 Vorbereitung übernehmen<\/button>/, "Admin sieht „Vorbereitung übernehmen“");
assert.match(vt({ vertretung: { person_id: "P9", name: "Hansi" }, vorbereiter: ["P9"] }), /Vertretung: <b>du<\/b> bereitest diese Sitzung vor.*↩️ Zurückgeben/s, "… und kann zurückgeben");
assert.doesNotMatch(A.buSchritteHtml(sitzung({ vorbereiter: ["P1"] })), /übernehmen/, "Clubsprecher selbst sieht keinen Übernehmen-Knopf");
assert.match(sitzungsUmgebung(app, { schreiben: false }).buSchritteHtml(sitzung({ vertretung: { person_id: "P9", name: "Hansi" } })), /🙋 Vertretung: <b>Hansi<\/b> bereitet diese Sitzung vor/, "andere sehen, wer vertritt");
const sv = server.slice(server.indexOf('case "buero_vertretung"'), server.indexOf('case "buero_informieren_nein"'));
assert.match(sv, /nurBueroSchreiben\(ich\); nurLeitung\(ich\);/, "nur Clubleitung mit Büro-Schreibrecht");
assert.match(sv, /Zurückgeben kann nur, wer die Vertretung übernommen hat, der Clubsprecher oder der Admin\./);
assert.match(sv, /senden\("club_nachricht", an_,/, "Clubsprecher und Clubleitung bekommen Bescheid");
assert.match(server, /vorbereiter: p\?\.vertretung\?\.person_id \? \[p\.vertretung\.person_id\] : vorbereiter,/, "Server: Vertretung bereitet diese Sitzung vor");
assert.match(fs.readFileSync("supabase/migrations/20261029_kc_club_sitzung_ablauf.sql", "utf8"), /add column if not exists vertretung jsonb/);
assert.match(app, /data-w="uebernehmen">🙋 Ich übernehme die Vorbereitung \(Vertretung\)<\/button>/, "Kontroll-Hinweis: selbst übernehmen");

// --- 6) Änderung nach der Einladung: Server merkt die verschickte Tagesordnung, „Nein“ gilt für genau diesen Stand
const tg = server.slice(server.indexOf("const topStand = "), server.indexOf("function bueroTopListe(")).replace(/\(l: any\[\] \| null \| undefined\)/, "(l)").replace(/\(p: any\): boolean/, "(p)").replace(/\(x: any\)/g, "(x)");
const topGeaendert = new Function(tg + "; return topGeaendert;")();
const A1 = [{ t: "Begrüßung" }, { t: "Verschiedenes" }], A2 = [{ t: "Begrüßung" }, { t: "❗ Spende Tafel", id: "V4" }, { t: "Verschiedenes" }];
assert.equal(topGeaendert({ tagesordnung: A1, versandt_top: A1, einladung_am: "x" }), false, "unverändert");
assert.equal(topGeaendert({ tagesordnung: A2, versandt_top: A1 }), true, "Punkt dazu");
assert.equal(topGeaendert({ tagesordnung: A2, versandt_top: A1, informieren_nein_top: A2 }), false, "„Nein, nicht informieren“ für diesen Stand");
assert.equal(topGeaendert({ tagesordnung: [...A2, { t: "Neu" }], versandt_top: A1, informieren_nein_top: A2 }), true, "… danach wieder geändert → wieder fragen");
assert.equal(topGeaendert({ tagesordnung: A1, geaendert_am: "2026-10-28T10:49:00Z", einladung_am: "2026-10-28T15:22:00Z" }), false, "alte Einladung ohne Merker (Sitzung 30.10.)");
assert.match(server, /\.\.\.\(nurOffen \? \{\} : \{ versandt_top: prep\?\.tagesordnung \?\? \[\], informieren_nein_top: null \}\)/, "an alle verschickt → merken");
assert.match(server, /const unterlagen_am = p\.teil === "vor" \? stand : topNeu \? null : vorher\?\.unterlagen_am \?\? null;/, "Tagesordnung geändert → „Sitzung vorbereiten“ wieder offen (neu drucken)");
assert.match(server, /case "buero_informieren_nein": \{\s+nurBueroSchreiben\(ich\);/, "Nein merken (nur wer im Büro schreiben darf)");
assert.match(server, /informieren = !!prep\?\.einladung_am;/, "dringender Punkt nach der Einladung → App fragt");
assert.match(app, /if \(r\.ok && r\.informieren && r\.treffen_id && buSchreiben\(\)\) setTimeout\(\(\) => buInformierenFragen\(r\.treffen_id\), 400\);/);
assert.match(app, /if \(r\.informieren\) return buWeiterFragen\("✅ Gespeichert – Mitglieder informieren\?"/, "nach dem Speichern ebenso");

// --- 7) Änderungsmeldung: „Neu / Entfällt“ – App-Vorschau = Versand, Push-Zeile
const sB = server.slice(server.indexOf("// 2.751.0 KC-CLUB-AENDERUNG-MELDUNG (Wunsch Hansi 29.10.2026"), server.indexOf("const einladungZiel"))
  .replace(/\(alt: any\[\] \| null, neu: any\[\]\)/, "(alt, neu)").replace(/\(x: any\)/g, "(x)").replace(/\(df: ReturnType<typeof topDiff>\): string/, "(df)").replace(/: string\[\] = \[\]/g, " = []")
  .replace(/\(d: \{[^)]*?\}\)/, "(d)").replace(/\(iso: string\)/g, "(iso)");
const S = new Function("TZ", sB + "; return { topDiff, aenderungKurz, einladungBrief };")("Europe/Berlin");
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const Ap = new Function("TZ", "fZeit", app.slice(app.indexOf("const BRIEF_AMT_RE"), app.indexOf("function buBriefZeigen()")) + "; return { topDiff, einladungBrief };")("Europe/Berlin", fZeit);
const alt = [{ t: "Begrüßung", art: "fest" }, { t: "Ausflug Spargelhof", art: "vorschlag", id: "V3" }, { t: "Verschiedenes", art: "fest" }];
const neu = [{ t: "Begrüßung", art: "fest" }, { t: "❗ Spende an die Tafel Werne", art: "vorschlag", id: "V4" }, { t: "Termine 2027 festlegen", art: "eigen" }, { t: "Verschiedenes", art: "fest" }];
const df = S.topDiff(alt, neu);
assert.deepEqual(df, Ap.topDiff(alt, neu), "Vergleich in App und Server gleich");
assert.deepEqual(df.dazu.map((x) => [x.nr, x.dringend]), [[2, true], [3, false]]); assert.deepEqual(df.weg, ["Ausflug Spargelhof"]);
assert.equal(S.aenderungKurz(df), "2 Punkte dazugekommen (1 dringend) · 1 Punkt entfällt", "Push-Zeile");
assert.equal(S.aenderungKurz(S.topDiff(alt, [alt[1], alt[0], alt[2]])), "neue Reihenfolge");
assert.equal(S.topDiff(null, neu), null, "ohne verschickte Tagesordnung kein Vergleich");
const d = { vorname: "Marianne", titel: "Clubsitzung November", beginn: "2026-11-27T17:00:00Z", ort: "Hütte Anne", top: neu.map((x, i) => `${i + 1}. ${x.t}`), zusatz: "", url: "https://x", von: "Klaus", amt: "Clubsprecher", erinnerung: false, aenderung: true, diff: df };
assert.equal(Ap.einladungBrief(d), S.einladungBrief(d), "Vorschau = Versand");
assert.match(S.einladungBrief(d), /zu unserer Clubsitzung am Freitag, den 27\.11\.2026, um 18:00 Uhr – Hütte Anne hat sich die Tagesordnung geändert\.\n\nNeu:\n2\. ❗ Spende an die Tafel Werne\n3\. Termine 2027 festlegen\n\nEntfällt:\n– Ausflug Spargelhof\n\nDie vollständige Tagesordnung:\n1\. Begrüßung\n2\. ❗ Spende an die Tafel Werne 🆕\n3\. Termine 2027 festlegen 🆕\n4\. Verschiedenes/);
const nurDazu = S.topDiff(alt, [...alt.slice(0, 2), neu[1], alt[2]]);
assert.match(S.einladungBrief({ ...d, top: ["1. a"], diff: nurDazu }), /um 18:00 Uhr – Hütte Anne ist noch ein Punkt dazugekommen\./, "nur dazu (ein Punkt)");
assert.match(server, /kurz: `\$\{wann\(t\.beginn\)\}\$\{ort \? " · " \+ ort : ""\} · \$\{aenderungKurz\(diff\) \|\| `jetzt \$\{top\.length\} Tagesordnungspunkte`\}`/, "Push: was sich geändert hat");
assert.match(server, /const url = APP_URL \+ "#tag=" \+ berlinTag\(new Date\(t\.beginn\)\);/, "Push/Mail öffnen direkt den Tag der Sitzung");
assert.match(app, /else if \(\/\^#tag=\\d\{4\}-\\d\{2\}-\\d\{2\}\$\/\.test\(h\)\) zumTag\(h\.slice\(5\)\);/, "App: #tag=… öffnet den Kalendertag");
assert.match(S.einladungBrief({ ...d, aenderung: false, diff: null }), /\n\nDringende Vorschläge oder Änderungen können bis zur Sitzung noch dazukommen\./, "Satz in der Einladung");

// --- 8) Vorschlag für den nächsten Termin: letzter Freitag im Folgemonat, Dezember übersprungen, 18 Uhr
const berlinZuUtc = (y, m, d, h, mi) => { const p = new Date(Date.UTC(y, m - 1, d, h, mi)); const v = new Date(p.toLocaleString("en-US", { timeZone: "Europe/Berlin" })) - new Date(p.toLocaleString("en-US", { timeZone: "UTC" })); return new Date(p.getTime() - v); };
const nm = server.slice(server.indexOf("function sitzungNaechsterMonat("), server.indexOf("async function liveTerminStand("))
  .replace(/\(j: number, mo: number, hm: string, v: SitzungVorgaben = SV\): Date/, "(j, mo, hm, v)");
const naechst = new Function("berlinZuUtc", nm + "; return sitzungNaechsterMonat;")(berlinZuUtc);
const V = { wochentag: 5, ohne_monate: [12] };
assert.equal(naechst(2026, 10, "18:00", V).toISOString(), "2026-11-27T17:00:00.000Z", "Oktober → Fr 27.11. 18 Uhr");
assert.equal(naechst(2026, 11, "18:00", V).toISOString(), "2027-01-29T17:00:00.000Z", "November → Dezember übersprungen → Fr 29.01.2027");
assert.equal(naechst(2026, 12, "18:00", V).toISOString(), "2027-01-29T17:00:00.000Z", "Zusatzsitzung im Dezember → Januar");
assert.equal(naechst(2027, 2, "18:00", V).toISOString(), "2027-03-26T17:00:00.000Z", "Februar → Fr 26.03. (noch Winterzeit)");
assert.equal(naechst(2027, 3, "18:00", V).toISOString(), "2027-04-30T16:00:00.000Z", "März → Fr 30.04. (Sommerzeit)");
assert.match(server, /ort: SV\.ort \|\| letzt\?\.ort \|\| null/, "Ort aus den Vorgaben, sonst wie zuletzt");
const mig = fs.readFileSync("supabase/migrations/20261029_kc_club_sitzung_ablauf.sql", "utf8");
assert.match(mig, /"uhrzeit": "18:00", "ort": "Hütte Anne", "ohne_monate": \[12\]/, "Vorgaben laut Hansi");
assert.match(mig, /add column if not exists versandt_top jsonb/); assert.match(mig, /add column if not exists unterlagen_am timestamptz/);

// --- 9) Sitzungs-Vorgaben: Server prüft jeden Wert, nur die Clubleitung ändert
const pr = server.slice(server.indexOf("const SITZUNG_VORGABEN_STANDARD"), server.indexOf("let SV: SitzungVorgaben"))
  .replace(/ as string \| null/g, "").replace(/ as number\[\]/g, "").replace(/type SitzungVorgaben = typeof SITZUNG_VORGABEN_STANDARD;/, "").replace(/\(w: any\): SitzungVorgaben/, "(w)")
  .replace(/\(k: keyof SitzungVorgaben, min: number, max: number\)/, "(k, min, max)").replace(/ as number/g, "").replace(/new Set<number>/, "new Set").replace(/\(m: number\)/g, "(m)");
const svPruefen = new Function("txt", pr + "; return svPruefen;")((x, n) => String(x ?? "").trim().slice(0, n));
assert.equal(svPruefen(null).einladung_tage, 3); assert.equal(svPruefen({ einladung_tage: 99 }).einladung_tage, 3, "Unsinn → Standard");
assert.deepEqual(svPruefen({ ohne_monate: [12, 12, 13, "x", 7] }).ohne_monate, [7, 12]); assert.equal(svPruefen({ uhrzeit: "25:00" }).uhrzeit, null); assert.equal(svPruefen({ uhrzeit: "18:00" }).uhrzeit, "18:00");
assert.match(server, /case "sitzung_vorgaben_speichern": \{\s+nurLeitung\(ich\);\s+const w = svPruefen\(p\.vorgaben\);/);
assert.match(app, /\$\{L \? k\("vorgaben", "⚙️", "Sitzungs-Vorgaben"/, "Büro: Kachel ⚙️ Sitzungs-Vorgaben (Clubleitung)");

// --- 10) Zwei Seiten im Büro, Aktentasche mit Mitnehm-Liste, Clubabend: freigeben + „Zum Schluss“, PDF per E-Mail
assert.match(app, /BU\.teil = teil === "to" \|\| teil === "vor" \? teil : BU\.s\.vorbereitung\?\.tagesordnung\?\.length \? "vor" : "to";/);
assert.match(app, /\$\{VOR \? "✅ Fertig – vorbereitet" : "✅ Tagesordnung speichern"\}/);
assert.match(app, /teil: BU\.teil \}\);/, "Speichern sagt, welche Seite");
assert.match(server, /\} else if \(op === "mitnehmen"\) \{/); assert.match(app, /const r = await atAendern\(\{ op: "mitnehmen", titel \}, knopf\);/);
assert.match(app, /const druck = i\.art !== "mitnehmen";/, "Mitnehm-Liste wird nicht gedruckt");
assert.match(app, /📤 Unterlagen freigeben <small>/); assert.match(app, /await atOeffnen\(tr\.id\); if \(\$\("atBlatt"\)\) atFreigabeWahl\(\);/, "Clubabend: während der Sitzung freigeben");
const ca = app.slice(app.indexOf("const CA_ABSCHLUSS = ["), app.indexOf("function caAbschlussHtml("));
const caAbschluss = new Function(ca + "; return caAbschluss;")();
const r0 = { tagesordnung: [{ erledigt: true }, { erledigt: false }], abschluss: ["ab:fotos"] };
assert.deepEqual(caAbschluss(r0).map((x) => [x.id, x.ok]), [["top", false], ["anwesend", false], ["aufgaben", false], ["fotos", true], ["termin", false]], "Abschluss-Liste, nächster Termin als Letztes");
assert.equal(caAbschluss({ tagesordnung: [{ erledigt: true }], abschluss: [] })[0].ok, true, "Tagesordnung zählt von selbst");
assert.match(server, /abschluss: \[\.\.\.erledigt\]\.filter\(\(k\) => k\.startsWith\("ab:"\)\) \};/);
assert.match(server, /url: `\$\{APP_URL\}#archiv`, \.\.\.\(mAnl\.length \? \{ attachmentIds: mAnl\.map\(\(a\) => a\.id\) \} : \{\}\),/, "freigegebene Unterlagen: per E-Mail als Anhang");
assert.match(html, /\.bu-schritt\.knapp \{/, "rote Markierung im Stil");
console.log("sitzung-aufgaben: alle Prüfungen bestanden");
