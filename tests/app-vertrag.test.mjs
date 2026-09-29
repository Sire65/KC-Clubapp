// Feature KC-CLUB-VERTRAG: statische Pruefung der Köcheclub-App (offline, ohne Server).
// Aufruf: node tests/app-vertrag.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const html = lies("index.html");
const sw = lies("sw.js");
const server = lies("supabase/functions/kc-club/index.ts");
const version = JSON.parse(lies("version.json"));
const manifest = JSON.parse(lies("manifest.webmanifest"));

// 1. Versionsvertrag: index.html, sw.js und version.json muessen gleich sein (atomares Update).
const appV = html.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const swV = sw.match(/const VERSION\s*=\s*"([^"]+)"/)?.[1];
assert.ok(appV, "APP_VERSION fehlt");
assert.equal(swV, appV, "sw.js VERSION ungleich APP_VERSION");
assert.equal(version.version, appV, "version.json ungleich APP_VERSION");
assert.match(appV, /^\d+\.\d+\.\d+$/, "Version nicht im Format x.y.z");

// 2. Jede Aktion, die die App aufruft, muss der Server kennen.
const aufrufe = new Set([...html.matchAll(/api\("([a-z_]+)"/g)].map((m) => m[1]));
const aktionen = new Set([...server.matchAll(/case "([a-z_]+)"/g)].map((m) => m[1]));
assert.ok(aufrufe.size >= 10, "zu wenige API-Aufrufe gefunden");
for (const a of aufrufe) assert.ok(aktionen.has(a), `Server kennt Aktion "${a}" nicht`);

// 3. Keine Geheimnisse im Browsercode.
for (const [name, text] of [["index.html", html], ["sw.js", sw]]) {
  assert.ok(!/service_role|SERVICE_ROLE|sb_secret_|eyJhbGciOi/.test(text), `${name}: Schluessel im Browsercode`);
  assert.ok(!/WEBDE_PASSWORD|cronSecret/.test(text), `${name}: Server-Geheimnis im Browsercode`);
}

// 4. Zugangslink: Token wird aus der Adresszeile entfernt; Server speichert nur den Hash.
assert.ok(html.includes("kc_club_key"), "Token-Speicher fehlt");
assert.ok(/history\.replaceState/.test(html), "Token wird nicht aus der URL entfernt");
assert.ok(/SHA-256/.test(server), "Server hasht den Zugangstoken nicht");

// 5. Branding: Weinrot/Beige, Name, Icons.
assert.equal(manifest.name, "Köcheclub Werne");
assert.equal(manifest.theme_color.toLowerCase(), "#741521");
assert.equal(manifest.background_color.toLowerCase(), "#f5eee3");
for (const i of manifest.icons) assert.ok(fs.existsSync(new URL("../" + i.src, import.meta.url)), `Icon fehlt: ${i.src}`);

// 6. Kernbereiche vorhanden; noch nicht fertige Bereiche sind sichtbar als „bald“ markiert.
for (const b of ["Termine", "Kommunikation", "Aktive Mitglieder", "Protokolle", "Dienstpl", "Vorschl"]) assert.ok(html.includes(b), `Bereich fehlt: ${b}`);
assert.ok(html.includes("bald"), "Kennzeichnung „bald“ fehlt");

// 7. Push/Warnton in den Einstellungen.
assert.ok(/Warnton/.test(html), "Warnton-Einstellung fehlt");
assert.ok(/addEventListener\("push"/.test(sw), "Push-Handler im Service Worker fehlt");

// 8. KC-CLUB-VORSCHLAG: geheime Stimmen ohne Person, RPC nicht öffentlich, Ergebnis erst nach Abschluss.
const mig2 = lies("supabase/migrations/20260928_kc_club_v02_vorschlaege.sql");
const geheimTabelle = mig2.slice(mig2.indexOf("create table if not exists kc_club_geheime_stimmen"), mig2.indexOf(");", mig2.indexOf("kc_club_geheime_stimmen")));
assert.ok(!/person_id|_am\b|timestamptz/.test(geheimTabelle), "geheime Stimmen dürfen weder Person noch Zeit speichern");
assert.ok(/revoke all on function kc_club_geheim_abstimmen[^;]+from public, anon, authenticated/.test(mig2), "RPC für geheime Stimmen ist öffentlich aufrufbar");
assert.ok(/!v\.geheim \|\| v\.status !== "offen"/.test(server), "geheimes Ergebnis wird vor Abschluss gezeigt");
assert.ok(/v\.geheim \? \{\} : \{ wahl/.test(server), "geheime Wahl landet im Protokoll");
assert.ok(/\["#termine", "#vorschlaege"/.test(html), "Sprungadresse #vorschlaege fehlt");

// 9. KC-CLUB-OHNEAPP: Mitglieder ohne App-Zugang bekommen nur Mail (eigene _mail-Regeln).
assert.ok(/eventKey \+ "_mail"/.test(server), "Versand an Mitglieder ohne App fehlt");
for (const k of ["club_nachricht", "club_treffen", "club_erinnerung", "club_vorschlag"]) assert.ok(mig2.includes(`'${k}_mail'`), `Mail-Regel ${k}_mail fehlt`);

// 10. KC-CLUB-DIENSTE: nur veröffentlichter Sollplan, andere nur mit Freigabe, keine verschlüsselten Sync-Daten.
assert.ok(/from\("kc_dp_plan_published"\)[\s\S]{0,200}\.eq\("status", "published"\)/.test(server), "Dienste müssen aus dem veröffentlichten Sollplan kommen");
assert.ok(!/kc_dp_sync_operations|kc_dp_entity_versions/.test(server), "verschlüsselte Dienstplan-Sync-Daten dürfen nicht gelesen werden");
assert.ok(/m\.person_id === ich\.person_id \|\| freigegeben\.has\(m\.person_id\)/.test(server), "Freigabe-Filter für fremde Dienstzeiten fehlt");
assert.ok(/\.filter\(\(id: string\) => erlaubt\.has\(id\)\)/.test(server), "gewählte Personen werden nicht gegen die Freigabe geprüft");
assert.ok(!/kc_dp_plan_sharing/.test(server), "Dienstplan-Freigabetabelle darf von der Club-App nicht verändert werden");
assert.ok(/dpStand/.test(html) && /Stand des Dienstplans/.test(html), "Datenstand der Dienstzeiten wird nicht angezeigt");

// 11. KC-CLUB-BENACHRICHTIGUNG: Auswahl je Bereich wird beim Versand beachtet; jede Kombination hat eine Regel.
const mig3 = lies("supabase/migrations/20260928_kc_club_v03_benachrichtigung.sql");
for (const k of ["club_nachricht", "club_treffen", "club_erinnerung", "club_vorschlag", "club_dienst"])
  for (const s of ["_push", "_beide"]) assert.ok(mig3.includes(`'${k}${s}'`), `Regel ${k}${s} fehlt`);
assert.ok(mig3.includes("'club_dienst_mail'") && mig3.includes("'club_dienst'"), "Dienst-Regeln fehlen");
assert.ok(/x\.push && x\.email \? eventKey \+ "_beide" : x\.push \? eventKey \+ "_push" : x\.email \? eventKey \+ "_mail" : null/.test(server), "Auswahl Push/E-Mail wird nicht ausgewertet");
assert.ok(/if \(!key\) continue;/.test(server), "„alles aus“ muss Versand unterdrücken");
assert.ok(/routerSenden\("club_nachricht_push"/.test(server), "Test-Push muss unabhängig von der Auswahl als Push gehen");
assert.ok(/id="wahlTabelle"/.test(html) && /benachrichtigung_setzen/.test(html), "Auswahltabelle fehlt");

// 12. KC-CLUB-DIENSTERINNERUNG: nur wer eingeschaltet hat, höchstens einmal je Tag.
assert.ok(/eq\("bereich", "dienste"\)\.or\("push\.eq\.true,email\.eq\.true"\)/.test(server), "Dienst-Erinnerung nur für Eingeschaltete");
assert.ok(server.includes('from("kc_club_dienst_erinnerung").upsert({ person_id: pid, datum: morgen }, { onConflict: "person_id,datum", ignoreDuplicates: true })'), "Doppelversand-Sperre fehlt");

// 13. KC-CLUB-ZURUECK + Kopf: Verlaufseinträge, Kennzahlen führen in Bereiche, kein Zahnrad im Kopf.
assert.ok(/history\.replaceState\(\{ basis: true \}/.test(html) && /addEventListener\("popstate"/.test(html), "Zurück-Steuerung fehlt");
assert.ok(/history\.pushState\(st,/.test(html), "Ansichten legen keinen Verlaufseintrag an");
for (const z of ["nachrichten", "mitglieder"]) assert.ok(html.includes(`<button class="mini" onclick="zeige('${z}')">`), `Kennzahl → ${z} fehlt`);
// 0.27.2: „Nächstes Treffen“ führt über zumTreffen() in Termine (Kalender, Tag ausgewählt)
assert.ok(html.includes(`<button class="mini" onclick="zumTreffen()">`) && /function zumTreffen\(\) \{[\s\S]{0,400}zeige\("termine"\)/.test(html), "Kennzahl → termine fehlt");
const kopfHtml = html.slice(html.indexOf('<section id="v-start">'), html.indexOf('id="heroInfo"'));
assert.ok(!kopfHtml.includes("⚙️"), "Zahnrad gehört nicht mehr in den Kopf");
assert.ok(/onclick="webseite\(\)"/.test(kopfHtml), "Kochmütze → Internetseite fehlt");
assert.ok((html.match(/<details class="karte" data-klappe=/g) || []).length >= 4, "Einstellungen nicht ausklappbar");

// 14. 0.4.0: Register wischbar mit Anzahl, Schloss je Klappbereich, Gruß unter den Kopf-Knöpfen.
assert.ok(/function registerWischen\(/.test(html) && /addEventListener\("touchend"/.test(html), "Wischen zwischen Registern fehlt");
assert.ok(/const da = kacheln\(r\)\.length, alle = kaSortiert\(r\)\.length;/.test(html) && /<span class="anz">\$\{da < alle/.test(html), "Anzahl der Kacheln am Register fehlt"); // ab 0.9.0: nur die Kacheln, die für mich gelten; ab 0.27.2 „sichtbar/gesamt“
assert.ok(/class="schloss"/.test(html) && /"fest_" \+ name/.test(html), "Schloss zum Feststellen fehlt");
const rechts = html.slice(html.indexOf('<div class="kopfrechts">'), html.indexOf('<div class="info" id="heroInfo">'));
assert.ok(rechts.indexOf('class="knopfreihe"') < rechts.indexOf('id="begruessung"'), "Gruß muss unter den Knöpfen stehen");

// 15. 0.5.0: Kachel „Update prüfen“ unter Programme mit Versionsnummer, Versions-Knopf neben Schnellzugriff.
const progr = html.slice(html.indexOf("  programme: ["), html.indexOf("],", html.indexOf("  programme: [")));
assert.ok(/t: "Update prüfen"/.test(progr) && /aktion: "updateKachel\(\)"/.test(progr), "Kachel „Update prüfen“ fehlt unter Programme");
assert.ok(/Installiert: v\$\{APP_VERSION\}/.test(progr), "Versionsnummer in der Kachel fehlt");
assert.ok(/id="versionMarke"[^>]*onclick="updateKachel\(\)"/.test(html), "Versions-Knopf fehlt");

// 16. KC-CLUB-KALENDER: Monats-/Jahres-Blättern, Farben je Art, Geburtstage nur Tag/Monat.
assert.ok(/onclick="kalBlaettern\(-12\)"/.test(html) && /onclick="kalBlaettern\(1\)"/.test(html) && /onclick="kalBlaettern\(12\)"/.test(html), "Blätterpfeile Monat/Jahr fehlen");
for (const k of ["treffen", "dienst", "frist", "geb"]) assert.ok(new RegExp(`\\.ktag\\.${k} \\{`).test(html), `Farbe für ${k} fehlt`);
assert.ok(/md: String\(m\.birth_date\)\.slice\(5, 10\)/.test(server), "Geburtstage dürfen nur als Tag/Monat an die App gehen");
assert.ok(!/birth_date: m\.birth_date|birth_date\s*[,}]\s*\)\)/.test(server.slice(server.indexOf('case "kalender"'), server.indexOf('case "benachrichtigung_setzen"'))), "Geburtsjahr darf nicht an die App gehen");
assert.ok(/\[\$\("kalGitter"\), kalBlaettern\]/.test(html), "Wischen im Kalender fehlt");

// 17. 0.6.2: Zu-/Absage-Hinweis in „Heute wichtig“ erst 7 Tage vor dem Treffen.
assert.ok(/ZUSAGE_TAGE_VORHER = 7/.test(html) && /new Date\(t\.beginn\) - Date\.now\(\) <= ZUSAGE_TAGE_VORHER \* 86400000/.test(html), "Zusage-Hinweis muss auf 7 Tage vorher begrenzt sein");

// 18. KC-CLUB-GEBURTSTAG-FREIGABE: nur freigegebene Geburtstage (eigener für sich selbst), Kästchen in den Einstellungen, Liste.
assert.ok(/frei\.has\(m\.person_id\) \|\| m\.person_id === ich\.person_id/.test(server), "Geburtstage müssen auf Freigabe gefiltert sein");
assert.ok(/case "geburtstag_freigabe"/.test(server) && /bereich: "geburtstag"/.test(server), "Aktion geburtstag_freigabe fehlt");
for (const stelle of ['case "kalender"', 'case "treffen_liste"']) {
  const abschnitt = server.slice(server.indexOf(stelle), server.indexOf("case ", server.indexOf(stelle) + 10));
  assert.ok(/geburtstageSichtbar\(ich\)/.test(abschnitt), `${stelle} muss geburtstageSichtbar nutzen`);
}
assert.ok(/id="setGeburtstag"/.test(html) && /Meinen Geburtstag anzeigen \(ohne Jahr\)/.test(html), "Kästchen „Meinen Geburtstag anzeigen“ fehlt");
assert.ok(/geburtstageListe\(geburtstage \|\| \[\], 30\)/.test(html), "Geburtstage in der Terminliste fehlen");
const mig7 = lies("supabase/migrations/20260928_kc_club_v07_geburtstag_freigabe.sql");
assert.ok(/'geburtstag'/.test(mig7), "Migration Geburtstag-Freigabe fehlt");

// 19. 0.8.0: kein „Vorstand“ in der Oberfläche/den Meldungen, Geburtstags-Push, Veranstaltungen.
assert.ok(!/Vorstand/.test(html), "Das Wort „Vorstand“ darf in der App nicht mehr vorkommen");
assert.ok(!/new Fehler\("[^"]*Vorstand/.test(server), "Server-Meldungen dürfen „Vorstand“ nicht enthalten");
assert.ok(/\["geburtstage", "🎂 Geburtstage \(2 Tage vorher und am Tag\)"\]/.test(html), "Einstellung Geburtstags-Push fehlt");
assert.ok(/club_geburtstag: "geburtstage"/.test(server) && /#gratulieren=\$\{m\.person_id\}/.test(server), "Geburtstags-Push fehlt");
assert.ok(/if \(!m\.birth_date \|\| !frei\.has\(m\.person_id\)\) continue;/.test(server), "Geburtstags-Push nur für freigegebene Geburtstage");
assert.ok(/\.filter\(\(id\) => id !== m\.person_id && mitApp\.has\(id\)\)/.test(server), "Geburtstags-Push nur an Mitglieder mit App, nicht an das Geburtstagskind");
assert.ok(/kc_club_geburtstag_hinweis"\)\.upsert/.test(server), "Doppelversand-Sperre Geburtstag fehlt");
assert.ok(/h\.startsWith\("#gratulieren="\)\) gratulieren\(/.test(html), "Sprung „gratulieren“ aus dem Push fehlt");
assert.ok(/\.eq\("art", "treffen"\)\.is\("erinnerung_gesendet_am", null\)/.test(server), "Vortags-Erinnerung nur für Club-Treffen");
assert.ok(/offen && !va \? `<div class="antworten">/.test(html), "Veranstaltungen ohne Zu-/Absage");
assert.ok(/t\.art === "veranstaltung" \? tag >= von && tag <= bis/.test(html), "Mehrtägige Veranstaltungen im Kalender fehlen");
const mig8 = lies("supabase/migrations/20260928_kc_club_v08_geburtstag_push_veranstaltung.sql");
for (const k of ["club_geburtstag", "club_geburtstag_push", "club_geburtstag_beide", "club_geburtstag_mail"]) assert.ok(mig8.includes(`'${k}'`), `Regel ${k} fehlt`);

// 20. 0.8.1: Feiertage NRW – berechnet, abschaltbar.
{
  const code = html.slice(html.indexOf("const FEIERTAGE_CACHE"), html.indexOf("function kalEintraege(tag)"));
  const tagPlus = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const feiertageNRW = new Function("tagPlus", code + ";return feiertageNRW;")(tagPlus);
  const erwartet = {
    2025: { "2025-04-18": "Karfreitag", "2025-04-21": "Ostermontag", "2025-05-29": "Christi Himmelfahrt", "2025-06-09": "Pfingstmontag", "2025-06-19": "Fronleichnam" },
    2026: { "2026-01-01": "Neujahr", "2026-04-03": "Karfreitag", "2026-04-06": "Ostermontag", "2026-05-01": "Tag der Arbeit", "2026-05-14": "Christi Himmelfahrt", "2026-05-25": "Pfingstmontag", "2026-06-04": "Fronleichnam", "2026-10-03": "Tag der Deutschen Einheit", "2026-11-01": "Allerheiligen", "2026-12-25": "1. Weihnachtstag", "2026-12-26": "2. Weihnachtstag" },
    2027: { "2027-03-26": "Karfreitag", "2027-03-29": "Ostermontag", "2027-05-06": "Christi Himmelfahrt", "2027-05-17": "Pfingstmontag", "2027-05-27": "Fronleichnam" },
  };
  for (const [jahr, tage] of Object.entries(erwartet)) {
    const f = feiertageNRW(+jahr);
    for (const [tag, name] of Object.entries(tage)) assert.equal(f[tag], name, `${name} ${jahr} falsch`);
  }
  assert.equal(Object.keys(feiertageNRW(2026)).length, 11, "NRW hat 11 gesetzliche Feiertage");
  assert.ok(/id="setFeiertage"/.test(html) && /einst\("feiertage", true\)/.test(html), "Schalter Feiertage NRW fehlt");
}

// 21. 0.9.0: Sitzungsprotokolle & Aufgaben (KC-CLUB-PROTOKOLLE, KC-CLUB-AUFGABEN).
{
  for (const a of ["protokolle_liste", "protokoll_vorlage", "protokoll_laden", "protokoll_speichern", "protokoll_anlage", "protokoll_veroeffentlichen",
    "protokoll_korrigieren", "protokoll_loeschen", "protokoll_einwand", "einwand_erledigt", "aufgabe_speichern", "aufgabe_erledigt", "aufgabe_loeschen"])
    assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  // Leserecht aus der Rollen-Registry (Aushilfen nein), nicht hart codiert im Server
  assert.ok(/protokolle: r \? r\.protokolle_lesen !== false : true/.test(server), "Protokoll-Recht aus kc_club_rollen fehlt");
  assert.ok(!/["'`]Aushilfe/.test(server), "Server darf das Amt „Aushilfe“ nicht hart codieren");
  assert.equal((server.match(/nurProtokolle\(ich\)/g) || []).length, 14, "jede Protokoll-/Aufgaben-Aktion prüft das Leserecht");
  // 7 Tage Einspruch; genehmigt erst nach Fristablauf ohne offene Einwände
  assert.ok(/const EINSPRUCH_TAGE = 7;/.test(server), "Einspruchsfrist 7 Tage fehlt");
  assert.ok(/if \(offeneEinwaende > 0\) return "einwand";/.test(server), "offener Einwand darf nicht als genehmigt gelten");
  // Entwürfe nur für Verfasser/Organisation; veröffentlichte Protokolle nicht löschbar; Korrektur sichert alte Fassung
  assert.ok(/pr\.status === "entwurf" && !bearb\) throw/.test(server), "Entwurf für andere sichtbar");
  // ab 0.11.0 (KC-CLUB-LOESCHEN): veröffentlichte Protokolle darf nur die Organisation löschen, Entwürfe auch der Verfasser
  assert.ok(/const darfProtokollLoeschen = \(ich: Ich, pr: any\) => ich\.vorstand \|\| \(pr\.verfasser === ich\.person_id && pr\.status === "entwurf" && pr\.version === 1\);/.test(server), "Löschrecht Protokolle falsch");
  assert.ok(/kc_club_sitzungsprotokoll_fassungen"\)\.upsert/.test(server), "alte Fassung wird nicht gesichert");
  // Anlagen: nur eigene Uploads verknüpfen; Leser dürfen Protokoll-Anlagen öffnen
  assert.ok(/kc_club_sitzungsprotokoll_anlagen"\)\.select\("protokoll_id"\)\.eq\("attachment_id", att\.id\)/.test(server), "anlage_url kennt Protokoll-Anlagen nicht");
  // Aufgaben: erst beim Veröffentlichen mitteilen, Erinnerung am Vortag nur einmal
  assert.ok(/if \(!pr \|\| pr\.status === "veroeffentlicht"\) await aufgabenMitteilen/.test(server), "Aufgaben aus Entwürfen würden zu früh verschickt");
  assert.ok(/update\(\{ erinnert_am: jetzt\(\) \}\)\.eq\("id", x\.id\)\.is\("erinnert_am", null\)/.test(server), "Doppelversand-Sperre Aufgaben-Erinnerung fehlt");
  assert.ok(/club_protokoll: "termine", club_aufgabe: "termine"/.test(server), "Benachrichtigungs-Bereich für Protokolle fehlt");
  // App: Foto vom Blatt (Kamera), Galerie, Datei (Word/PDF) über den Dateimanager
  // (seit 0.19.2 Kamera in der App statt fremder Kamera-App – siehe 37)
  assert.ok(html.includes("appKamera(protokollDateien)"), "Kamera für Protokoll fehlt");
  assert.ok(/id="prDok" accept="[^"]*\.docx[^"]*application\/pdf/.test(html), "Word/PDF-Auswahl fehlt");
  assert.ok(/async function anlageHochladen\(roh\)/.test(html) && /await anlageHochladen\(roh\)/.test(html), "gemeinsamer Upload-Helfer fehlt");
  assert.ok(/nur: \(\) => ICH\?\.protokolle !== false/.test(html), "Protokoll-Kachel für Aushilfen sichtbar");
  assert.ok(/h\.startsWith\("#protokoll="\)\) protokollOeffnen\(/.test(html), "Sprung zum Protokoll aus Push/Mail fehlt");
  assert.ok(/einmal\(this, protokollVeroeffentlichen\)/.test(html), "Doppel-Tipp-Sperre beim Veröffentlichen fehlt");
  assert.ok(!/Protokolle", u: "[^"]*", bald: true/.test(html), "Protokolle noch als „bald“ markiert");
  const mig9 = lies("supabase/migrations/20260928_kc_club_v09_sitzungsprotokolle.sql");
  for (const k of ["club_protokoll", "club_protokoll_push", "club_protokoll_beide", "club_protokoll_mail", "club_aufgabe", "club_aufgabe_push", "club_aufgabe_beide", "club_aufgabe_mail"])
    assert.ok(mig9.includes(`'${k}'`), `Regel ${k} fehlt`);
  assert.ok(/enable row level security/.test(mig9), "RLS fehlt");
}

// 22. 0.10.0: Aktionen / Ausflüge aus dem KC Manager (KC-CLUB-AKTIONEN).
{
  assert.ok(aktionen.has("aktionen_liste"), "Server-Aktion aktionen_liste fehlt");
  assert.ok(/const AKTIONEN_QUELLE = \{ tabelle: "kc_manager_state_sections", aktionen: "activities"/.test(server), "Aktionen müssen aus dem KC Manager gelesen werden (keine zweite Datenhaltung)");
  assert.ok(!/from\(AKTIONEN_QUELLE\.tabelle\)\.(update|insert|upsert|delete)/.test(server), "Club-App darf KC-Manager-Daten nicht ändern");
  // Datenschutz: Kosten/Reisebüro nur für Teilnehmende + Admin, Bemerkungen nur Admin
  assert.ok(/\.\.\.\(dabei \|\| ich\.admin \? \{\s*kosten:/.test(server), "Kosten für alle sichtbar");
  assert.ok(/\.\.\.\(ich\.admin \? \{ bemerkung:/.test(server), "Bemerkungen für alle sichtbar");
  // Reiseverlauf-Parser: Preiszeilen werden abgeschnitten
  const code = server.slice(server.indexOf("function reiseverlauf("), server.indexOf("async function aktionenRoh"));
  const txt = (v, max) => String(v ?? "").slice(0, max);
  const reiseverlauf = new Function("txt", code.replace(/\(beschreibung: unknown\)/, "(beschreibung)") + ";return reiseverlauf;")(txt);
  const v = reiseverlauf("11.05.2027 Bremerhaven - 12.05.2027 Seetag - 13.05.2027\nMolde (Moldefjord) - 14.05.2027 Nordfjordeid (Eidsfjord) -\n15.05.2027 Seetag - 16.05.2027 BremerhavenPRO-Tarif\n2 x Frühbucher 1,12 -100,00 € -200,00 €");
  assert.deepEqual(v.map((x) => x.ort), ["Bremerhaven", "Seetag", "Molde (Moldefjord)", "Nordfjordeid (Eidsfjord)", "Seetag", "Bremerhaven"], "Reiseverlauf falsch");
  assert.equal(v[0].datum, "2027-05-11");
  assert.ok(!JSON.stringify(v).includes("€"), "Preise im Reiseverlauf");
  // App: Kachel, Ansicht, Kalender, Datenstand sichtbar
  assert.ok(/t: "Aktionen", u: "Ausflüge & Reisen", v: "aktionen"/.test(html), "Kachel Aktionen fehlt");
  assert.ok(/id="v-aktionen"/.test(html) && /api\("aktionen_liste"\)/.test(html), "Ansicht Aktionen fehlt");
  assert.ok(/e\.push\(\{ art: "aktion", a \}\)/.test(html) && /\.ktag\.aktion/.test(html), "Aktionen im Kalender fehlen");
  assert.ok(/Stand unbekannt/.test(html), "Datenstand der Aktionen muss sichtbar sein (UNKNOWN nie als OK)");
}

// 23. 0.10.0: Empfänger-Schnellwahl setzt Häkchen; Test-Nachricht an mich selbst.
{
  assert.ok(/function gruppeWahl\(a\)/.test(html) && /const empfGruppe = \(a\) =>/.test(html), "Schnellwahl setzt keine Häkchen");
  assert.ok(/function testAnMich\(\)/.test(html), "„Test an mich“ fehlt");
  assert.ok(/aktion: "testAnMichStarten\(\)"/.test(html) && /onclick="testAnMichStarten\(\)"/.test(html), "„Test an mich“ nicht direkt erreichbar (Kachel/Kommunikation)");
  assert.ok(/const nurIch = /.test(server) && /if \(count === 1\) ziel\.push\(ich\.person_id\)/.test(server), "Server erlaubt keinen Test an sich selbst");
}

// 24. 0.11.0: Löschen überall (KC-CLUB-LOESCHEN) – mit Rechteprüfung, Sicherung vorher und Sicherheitsabfrage.
{
  for (const a of ["treffen_loeschen", "vorschlag_loeschen", "protokoll_loeschen", "einwand_loeschen", "aufgabe_loeschen", "nachricht_loeschen", "unterhaltung_ausblenden", "unterhaltung_loeschen"])
    assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  // jede Lösch-Aktion sichert vorher (Wiederherstellungspunkt) und die Sicherung muss vor dem delete stehen
  for (const a of ["treffen_loeschen", "vorschlag_loeschen", "protokoll_loeschen", "einwand_loeschen", "aufgabe_loeschen", "nachricht_loeschen", "unterhaltung_loeschen"]) {
    const block = server.slice(server.indexOf(`case "${a}"`), server.indexOf("return json", server.indexOf(`case "${a}"`)));
    const s1 = block.indexOf("await geloescht("), d1 = block.indexOf(".delete()");
    assert.ok(s1 > 0 && d1 > s1, `${a}: Sicherung fehlt oder kommt nach dem Löschen`);
  }
  assert.ok(/if \(error\) throw new Fehler\("Sicherung fehlgeschlagen – es wurde nichts gelöscht\."/.test(server), "Löschen ohne gelungene Sicherung");
  // Rechte
  assert.ok(/case "treffen_loeschen": \{[\s\S]{0,200}nurVorstand\(ich\)/.test(server), "Treffen löschen ohne Rechteprüfung");
  assert.ok(/case "unterhaltung_loeschen": \{[\s\S]{0,200}nurAdmin\(ich\)/.test(server), "Unterhaltung für alle löschen nur Admin");
  assert.ok(/m\.sender_person_id !== ich\.person_id && !ich\.admin\) throw/.test(server), "fremde Nachrichten löschbar");
  // geheime Abstimmung: Sicherung ohne Personen
  assert.ok(/stimmen: v\.geheim \? \[\] : st/.test(server), "geheime Stimmen mit Person gesichert");
  // App: Knöpfe mit Sicherheitsabfrage
  for (const [fn, api] of [["treffenLoeschen", "treffen_loeschen"], ["vorschlagLoeschen", "vorschlag_loeschen"], ["protokollLoeschen", "protokoll_loeschen"], ["einwandLoeschen", "einwand_loeschen"], ["nachrichtLoeschen", "nachricht_loeschen"]]) {
    const i = html.indexOf(`async function ${fn}(`);
    assert.ok(i > 0, `${fn} fehlt`);
    const body = html.slice(i, html.indexOf(`api("${api}"`, i));
    assert.ok(/confirm\(/.test(body), `${fn}: keine Sicherheitsabfrage vor dem Löschen`);
  }
  assert.ok(/id="chatBlatt"/.test(html) && /unterhaltung_ausblenden/.test(html), "Unterhaltung entfernen fehlt");
}

// 25. 0.12.0: Aktionen als Kacheln, Details erst nach Antippen.
{
  assert.ok(/function aktionKachel\(a\)/.test(html) && /class="raster">\$\{kommend\.map\(aktionKachel\)/.test(html), "Aktionen nicht als Kacheln");
  assert.ok(/id="v-aktion"/.test(html) && /async function aktionOeffnen\(id, ausHistorie\)/.test(html), "Detailansicht Aktion fehlt");
  assert.ok(/s\.v === "aktion" && s\.id\) aktionOeffnen\(s\.id, true\)/.test(html), "Zurück aus der Aktion fehlt");
  const f = new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
  const code = html.slice(html.indexOf("function aktionZeitraum(a)"), html.indexOf("function aktionKachel(a)"));
  const zr = new Function("fKurzJahr", code + ";return aktionZeitraum;")(f);
  assert.equal(zr({ von: "2027-05-11", bis: "2027-05-16" }), "11.–16.05.2027");
  assert.equal(zr({ von: "2026-12-30", bis: "2027-01-02" }), "30.12.2026 – 02.01.2027");
  assert.equal(zr({ von: "2027-05-11", bis: "2027-05-11" }), "11.05.2027");
}

// 26. 0.13.0: Mitglieder-Details (KC-CLUB-KONTAKT) – nur Freigegebenes, Admin alles, Aushilfen nichts.
{
  for (const a of ["mitglied_details", "kontakt_freigabe"]) assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  assert.ok(/const darf = \(f: string\) => selbst \|\| ich\.admin \|\| \(ich\.kontakte && frei\("kontakt_" \+ f\)\);/.test(server), "Sichtbarkeitsregel Kontaktdaten falsch");
  assert.ok(/kontakte: r \? r\.kontakte_sehen !== false : true/.test(server), "Recht „Kontakte sehen“ nicht aus der Rollen-Registry");
  assert.ok(/for \(const f of KONTAKT_FELDER\) if \(darf\(f\) && werte\[f\]\) kontakt\[f\] = werte\[f\];/.test(server), "nicht freigegebene Angaben würden ausgeliefert");
  assert.ok(/const festnetz = darf\("festnetz"\) \? await festnetzAusManager/.test(server), "Festnetz wird ohne Freigabe gelesen");
  assert.ok(!/from\(AKTIONEN_QUELLE\.tabelle\)\.(update|insert|upsert|delete)/.test(server), "KC-Manager-Daten dürfen nicht geändert werden");
  // Geburtsjahr nie an die App
  assert.ok(/geburtstag: pe\.birth_date && \(selbst \|\| frei\("geburtstag"\)\) \? String\(pe\.birth_date\)\.slice\(5, 10\)/.test(server), "Geburtsjahr/ungefreigebener Geburtstag ausgeliefert");
  // App
  for (const f of ["handy", "festnetz", "mail", "adresse"]) assert.ok(html.includes(`id="setKontakt_${f}"`), `Schalter ${f} fehlt`);
  assert.ok(/onclick="mitgliedOeffnen\('\$\{m\.person_id\}'\)"/.test(html), "Mitglied in der Liste nicht antippbar");
  assert.ok(/async function korrekturMelden\(\)/.test(html) && /x\.admin/.test(html), "Korrektur an Admin fehlt");
  assert.ok(/s\.v === "mitglied" && s\.id\) mitgliedOeffnen\(s\.id, true\)/.test(html), "Zurück aus Mitglied-Details fehlt");
  const code = html.slice(html.indexOf("const nurZiffern"), html.indexOf("const adresseText"));
  const waNummer = new Function(code + ";return waNummer;")();
  assert.equal(waNummer("0171 1234567"), "491711234567");
  assert.equal(waNummer("+49 171 1234567"), "491711234567");
  assert.equal(waNummer("0049 171 1234567"), "491711234567");
  const mig = lies("supabase/migrations/20260928_kc_club_v13_kontakt_freigabe.sql");
  assert.ok(/kontakt_handy/.test(mig) && /kontakte_sehen boolean not null default true/.test(mig), "Migration Kontakt fehlt");
}

// 27. 0.14.0: Terminfindung, Nachfassen, Mitfahren, Notfall, Handy-Kalender.
{
  for (const a of ["terminumfragen_liste", "terminumfrage_speichern", "terminumfrage_antwort", "terminumfrage_festlegen", "terminumfrage_loeschen",
    "mitfahrt_anbieten", "mitfahrt_platz", "mitfahrt_loeschen", "notfall_setzen", "kalender_abo"]) assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  // Terminfindung: nur Organisation startet; Festlegen übernimmt Antworten als Zu-/Absagen
  assert.ok(/case "terminumfrage_speichern": \{\s*nurVorstand\(ich\);/.test(server), "Terminfindung ohne Rechteprüfung");
  assert.ok(/kc_club_teilnahme"\)\.insert\(\(an \?\? \[\]\)\.map\(\(x: any\) => \(\{ treffen_id: t\.id, person_id: x\.person_id, antwort: x\.antwort/.test(server), "Antworten werden beim Festlegen nicht übernommen");
  // Nachfassen: nur 3 Tage vorher, nur ohne Antwort, höchstens einmal
  assert.ok(/const in3 = berlinTag\(new Date\(Date\.now\(\) \+ 3 \* 86400000\)\)/.test(server) && /\.filter\(\(id\) => !geantwortet\.has\(id\)\)/.test(server), "Nachfassen falsch");
  assert.ok(/update\(\{ nachfass_gesendet_am: jetzt\(\) \}\)\.eq\("id", t\.id\)\.is\("nachfass_gesendet_am", null\)/.test(server), "Nachfassen ohne Doppelversand-Sperre");
  // Mitfahren: Platzgrenze, Fahrer bekommt Bescheid, Löschen mit Sicherung
  assert.ok(/if \(\(count \?\? 0\) >= m\.plaetze\) throw new Fehler\("Leider sind schon alle Plätze vergeben\."/.test(server), "Plätze werden nicht begrenzt");
  // Notfall: nur selbst oder Organisation
  assert.ok(/selbst \|\| ich\.vorstand \? await db\.from\("kc_club_notfall"\)/.test(server), "Notfallkontakt zu breit sichtbar");
  // Kalender-Abo: nur Hash gespeichert, GET liefert iCalendar
  assert.ok(/token_hash: await sha256\(token\)/.test(server.slice(server.indexOf('case "kalender_abo"'))), "Kalender-Link nicht gehasht");
  assert.ok(/"Content-Type": "text\/calendar; charset=utf-8"/.test(server) && /if \(req\.method === "GET"\)/.test(server), "Kalender-Abo (GET/ICS) fehlt");
  const code = server.slice(server.indexOf("const icsText"), server.indexOf("async function kalenderIcs"));
  const f = new Function(code.replace(/: string\[\]/g, "").replace(/: unknown|: string/g, "") + ";return { icsText, icsFalten, tagDanach };")();
  assert.equal(f.icsText("a,b;c\nd"), "a\\,b\;c\\nd");
  assert.equal(f.tagDanach("2026-12-31"), "2027-01-01");
  assert.ok(f.icsFalten("X".repeat(200)).split("\r\n").every((z) => z.length <= 75), "ICS-Zeilen zu lang");
  // App
  assert.ok(/id="terminfindung"/.test(html) && /function umfrageKarte\(u\)/.test(html), "Terminfindung in der App fehlt");
  assert.ok(/mitfahrtBlock\("treffen", t\.id/.test(html) && /mitfahrtBlock\("aktion", a\.id/.test(html), "Mitfahren fehlt bei Treffen/Aktionen");
  assert.ok(/function inKalender\(id\)/.test(html) && /webcal:/.test(html), "Kalender-Knöpfe fehlen");
  assert.ok(/id="nfName"/.test(html) && /api\("notfall_setzen"/.test(html), "Notfallkontakt-Eingabe fehlt");
  const mig = lies("supabase/migrations/20260928_kc_club_v14_terminfindung_mitfahren.sql");
  for (const tab of ["kc_club_terminumfragen", "kc_club_mitfahrt", "kc_club_notfall", "kc_club_kalender_abo"]) assert.ok(mig.includes(`alter table ${tab} enable row level security`), `RLS ${tab} fehlt`);
}

// 28. 0.14.1: WhatsApp/Route öffnen die App direkt (kein Zwischenfenster), Meldungen lange genug lesbar.
{
  assert.ok(!/href="https:\/\/wa\.me\/\$\{[^"]*" target="_blank"/.test(html), "WhatsApp-Knopf öffnet wieder ein Zwischenfenster");
  // 0.17.2: Knöpfe laufen über extern() (mehrere Wege, Rückfall-Fenster, gemerkter Weg)
  assert.ok(/onclick="extern\('whatsapp', MD\.kontakt\.handy\)"/.test(html) && /onclick="extern\('route', adresseText\(MD\.kontakt\.adresse\)\)"/.test(html), "WhatsApp-/Route-Knopf nutzt nicht extern()");
  assert.ok(/id="externBlatt"/.test(html) && /externBlatt\(art, wege, wert, weg\.k\)/.test(html) && /externMerken\(art, weg\.k\)/.test(html), "Rückfall-Fenster fehlt");
  const code = html.slice(html.indexOf("const nurZiffern"), html.indexOf("const adresseText"));
  const mach = (ua) => new Function("navigator", code + ";return { waLink, routeLink };")({ userAgent: ua });
  const android = mach("Mozilla/5.0 (Linux; Android 14)"), iphone = mach("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), pc = mach("Mozilla/5.0 (X11; Linux)");
  assert.ok(android.waLink("0171 123 45").startsWith("intent://send?phone=4917112345#Intent;scheme=whatsapp;"), "WhatsApp Android falsch");
  assert.equal(iphone.waLink("+49 171 12345"), "whatsapp://send?phone=4917112345");
  assert.equal(iphone.waLink("+49 (0)171 12345"), "whatsapp://send?phone=4917112345", "+49 (0) falsch umgesetzt");
  assert.equal(pc.waLink("0171 12345"), "https://wa.me/4917112345");
  // 0.17.1: Android öffnet Google Maps direkt (Rückfall: Browser) statt „geo:“ (leeres Auswahlfenster)
  const r = android.routeLink("Markt 1, 59368 Werne");
  assert.ok(r.startsWith("intent://www.google.com/maps/dir/?api=1&destination=Markt%201%2C%2059368%20Werne#Intent;scheme=https;package=com.google.android.apps.maps;"), "Route Android falsch");
  assert.ok(decodeURIComponent(r.match(/S\.browser_fallback_url=([^;]+)/)[1]) === "https://www.google.com/maps/dir/?api=1&destination=Markt%201%2C%2059368%20Werne", "Route-Rückfall falsch");
  assert.ok(iphone.routeLink("Markt 1").startsWith("https://maps.apple.com/?daddr="), "Route iPhone falsch");
  assert.ok(/m\.onclick = \(\) => m\.remove\(\)/.test(html) && /Math\.min\(20000, \(4000 \+ String\(t\)\.length \* 70\)/.test(html), "Meldungen verschwinden zu schnell");
}

// 29. 0.15.0: Fotoalbum – Supabase-Dateispeicher über den Anlagen-Kern, Speicheranzeige, Papierkorb, Filter.
{
  for (const a of ["fotos_liste", "foto_hochladen", "foto_oeffnen", "foto_aendern", "foto_loeschen", "foto_wiederherstellen"]) assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  // ein Kern für Dateien: Anlagen und Fotos laufen über dateiAblegen (kein zweiter Upload-Weg)
  assert.equal((server.match(/storage\.from\(BUCKET\)\.upload\(/g) || []).length, 1, "mehr als ein Upload-Weg");
  assert.ok(/case "anlage_hochladen": \{\s*const r = await dateiAblegen\(/.test(server), "Anlagen nutzen nicht den gemeinsamen Kern");
  assert.ok(/dateiAblegen\(ich, p\.name, p\.mime, p\.daten, \/\^image\\\/\(jpeg\|png\|webp\)\$\/\)/.test(server), "Fotoalbum nimmt nicht nur Bilder an");
  // Speicher: Grenze kostenloser Plan, Stopp vor voll; Anzeige in der App
  assert.ok(/const SPEICHER_GRENZE = 1024 \* 1024 \* 1024;/.test(server) && /sp\.belegt >= SPEICHER_GRENZE \* FOTO_STOPP/.test(server), "Speicher-Stopp fehlt");
  // Löschen: Sicherung + Papierkorb; endgültig erst nach 30 Tagen in der Wartung; Wiederherstellen nur Admin
  const del = server.slice(server.indexOf('case "foto_loeschen"'), server.indexOf('case "foto_wiederherstellen"'));
  assert.ok(/await geloescht\(ich, "foto"/.test(del) && /geloescht_am: jetzt\(\)/.test(del) && !/dateienEntfernen/.test(del), "Foto wird sofort endgültig gelöscht");
  assert.ok(/lt\("geloescht_am", new Date\(Date\.now\(\) - PAPIERKORB_TAGE \* 86400000\)/.test(server), "Papierkorb wird nicht geleert");
  assert.ok(/case "foto_wiederherstellen": \{\s*nurAdmin\(ich\);/.test(server), "Wiederherstellen ohne Admin-Prüfung");
  assert.ok(/const darfFotoAendern = \(ich: Ich, f: any\) => f\.hochgeladen_von === ich\.person_id \|\| ich\.vorstand;/.test(server), "Foto-Rechte falsch");
  // App: Kachel, Ansicht, Filter, verkleinern mit Vorschau, EXIF-Datum, Zurück schließt Großansicht
  assert.ok(/t: "Fotoalbum"/.test(html) && /id="v-fotos"/.test(html) && /id="fotoBetrachter"/.test(html), "Fotoalbum in der App fehlt");
  assert.ok(/verkleinern\(roh, 1600, 0\.82\), klein = await verkleinern\(roh, 360, 0\.7\)/.test(html), "Fotos werden nicht verkleinert");
  assert.ok(/faFilterSetzen\('thema'/.test(html) && /faFilterSetzen\('jahr'/.test(html) && /faFilterSetzen\('bezug'/.test(html), "Filter fehlen");
  assert.ok(/if \(faZurueck\) \{ faZurueck = false; return; \}/.test(html) && /fotoSchliessen\(true\)/.test(html), "Zurück schließt die Großansicht nicht");
  // EXIF-Datum aus einem kleinen JPEG mit DateTimeOriginal lesen
  const code = html.slice(html.indexOf("async function exifDatum"), html.indexOf("async function fotosHochladen"));
  const exifDatum = new Function(code + ";return exifDatum;")();
  const tiff = [0x4d, 0x4d, 0, 42, 0, 0, 0, 8, 0, 1, 0x87, 0x69, 0, 4, 0, 0, 0, 1, 0, 0, 0, 26, 0, 0, 0, 0, 0, 1, 0x90, 0x03, 0, 2, 0, 0, 0, 20, 0, 0, 0, 44, 0, 0, 0, 0,
    ...[..."2027:05:11 18:30:00"].map((c) => c.charCodeAt(0)), 0];
  const app1 = [0xff, 0xe1, 0, 8 + tiff.length, 0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const blob = new Blob([new Uint8Array([0xff, 0xd8, ...app1, 0xff, 0xd9])]);
  assert.equal(await exifDatum(blob), "2027-05-11");
  assert.equal(await exifDatum(new Blob([new Uint8Array([1, 2, 3, 4])])), null);
  const mig = lies("supabase/migrations/20260928_kc_club_v15_fotoalbum.sql");
  assert.ok(mig.includes("alter table kc_club_fotos enable row level security") && /revoke all on function kc_club_speicher_belegt\(\) from public, anon, authenticated/.test(mig), "Fotoalbum-Tabelle/Funktion nicht abgesichert");
}

// 30. 0.16.0: Verbindungs-LEDs (Status/Datenverkehr), Verbindungstest mit Rundinstrumenten, Wartung über die App-Registry.
{
  for (const a of ["ping", "wartung_setzen"]) assert.ok(aktionen.has(a), `Server-Aktion ${a} fehlt`);
  assert.ok(/case "wartung_setzen": \{\s*nurAdmin\(ich\);/.test(server), "Wartung ohne Admin-Prüfung");
  assert.ok(/from\("kc_core_app_registry"\)/.test(server) && /const APP_ID = "KC_CLUBAPP";/.test(server), "Wartung nicht über die Registry");
  assert.ok(/Math\.min\(MAX_TESTDATEN,/.test(server) && /p\.last\.length/.test(server), "Testdaten nicht begrenzt");
  // Status und Datenverkehr getrennt; Datenverkehr nur bei echten Anfragen (api/Supabase-Dateien)
  assert.ok(/id="ledStatus"/.test(html) && /id="ledDaten"/.test(html), "LEDs fehlen");
  const api = html.slice(html.indexOf("async function api("), html.indexOf("// ---------- Eigener Status"));
  assert.ok(/vbStart\(\)/.test(api) && /vbEnde\(/.test(api), "api() meldet keinen Datenverkehr");
  assert.ok(!/setInterval\([^)]*vbBlinken/.test(html) && !/setInterval\([^)]*vbDatenLed/.test(html), "Datenverkehrs-LED blinkt ohne echte Daten");
  // UNKNOWN nie als OK: ohne Antwort grau, veraltet grau
  const code = html.slice(html.indexOf("const VB_VERALTET_MS"), html.indexOf("function vbStatusLed"));
  const f = new Function("navigator", "fZeit", code + ";return { VB, vbZustand };");
  const z = f({ onLine: true }, { format: () => "12:00" });
  z.VB.laufend = 0;
  assert.equal(z.vbZustand()[0], "grau", "ohne Antwort nicht grau");
  z.VB.letzteOk = Date.now(); assert.equal(z.vbZustand()[0], "gruen");
  z.VB.wartung = { an: true }; assert.equal(z.vbZustand()[0], "blau"); z.VB.wartung = null;
  z.VB.letzterFehler = Date.now() + 1; assert.equal(z.vbZustand()[0], "rot"); z.VB.letzterFehler = 0;
  z.VB.letzteOk = Date.now() - 4 * 60000; assert.equal(z.vbZustand()[0], "grau", "veraltete Verbindung als OK angezeigt");
  assert.equal(f({ onLine: false }, { format: () => "" }).vbZustand()[0], "rot", "offline nicht rot");
  assert.ok(/function rundinstrument\(/.test(html) && /onclick="verbindungTesten\(\)"/.test(html), "Rundinstrumente/Testknopf fehlen");
  const mig = lies("supabase/migrations/20260928_kc_club_v16_verbindung_wartung.sql");
  assert.ok(/add column if not exists wartung boolean not null default false/.test(mig) && /'KC_CLUBAPP'/.test(mig), "Registry-Migration fehlt");
}

// 31. 0.17.0: Communicator-LED – Zustand des KC Communicators (nur lesen), nie „grün“ ohne aktuelle Serververbindung.
{
  assert.ok(aktionen.has("communicator_status"), "Server-Aktion communicator_status fehlt");
  const cs = server.slice(server.indexOf("async function communicatorStatus"), server.indexOf("// ---------- Anmeldung"));
  assert.ok(!/\.(insert|update|upsert|delete)\(/.test(cs), "Communicator-Status darf nichts verändern");
  assert.ok(/kc_communication_health_snapshots/.test(cs) && /kc_communication_provider_routes/.test(cs) && /eq\("source_program", "kc-club"\)/.test(cs), "Quellen des Communicator-Status fehlen");
  assert.ok(/method: "OPTIONS"/.test(cs), "Erreichbarkeit wird nicht ohne Versand geprüft");
  assert.ok(/alterMin > COMM_BERICHT_VERALTET_MIN\) \{ farbe = "grau"/.test(cs), "veralteter Bericht wird nicht grau");
  assert.ok(/\.\.\.\(ich\.admin \? \{ wege:/.test(cs), "Versandwege nicht auf Admin beschränkt");
  assert.ok(/id="ledComm"/.test(html) && /communicator, notfall/.test(server), "Communicator-LED fehlt");
  const code = html.slice(html.indexOf("const VB_VERALTET_MS"), html.indexOf("function vbCommSetzen"));
  const f = new Function("navigator", "fZeit", code + ";return { VB, vbCommZustand };")({ onLine: true }, { format: () => "" });
  assert.equal(f.vbCommZustand()[0], "grau", "Communicator ohne Stand nicht grau");
  f.VB.comm = { farbe: "gruen", text: "ok" }; f.VB.commZeit = Date.now();
  assert.equal(f.vbCommZustand()[0], "grau", "Communicator grün ohne Serververbindung");
  f.VB.letzteOk = Date.now(); assert.equal(f.vbCommZustand()[0], "gruen");
  f.VB.commZeit = Date.now() - 4 * 60000; assert.equal(f.vbCommZustand()[0], "grau", "veralteter Communicator-Stand als OK");
}

// 32. 0.17.5: kurzes Aufblitzen ist kein Erfolg; sichere Wege in der App (Karte, Club-Nachricht)
{
  assert.ok(/const EXTERN_ERFOLG_MS = 3000;/.test(html) && /m\.zurueck_ms - m\.versteckt_ms < EXTERN_ERFOLG_MS/.test(html), "Aufblitzen wird als Erfolg gewertet");
  assert.ok(/"kc_club_weg_" \+ art/.test(html), "alter, falscher Speicher wird weiter benutzt");
  assert.ok(/k: "karte", t: "🗺️ Karte hier in der App zeigen", intern:/.test(html) && /output=embed/.test(html) && /id="karteBlatt"/.test(html), "Karte in der App fehlt");
  assert.ok(/k: "clubapp", t: "💬 Stattdessen Nachricht in der Club-App", intern:/.test(html), "Club-Nachricht als Weg fehlt");
}

// 33. 0.17.6: Teilen-Menü als Weg (Android-Auswahl wie beim Anrufen)
{
  assert.ok(/k: "teilen", t: "📤 Über „Teilen“ an WhatsApp/.test(html) && /k: "teilen", t: "📤 Adresse über „Teilen“ an Google Maps"/.test(html), "Teilen-Wege fehlen");
  assert.ok(/navigator\.share\(weg\.teilen\(\)\)/.test(html) && /id="karteTeilen"/.test(html), "Teilen wird nicht ausgelöst");
  // 0.17.7: Ausweichwege in der App werden nicht als Standard gemerkt
  const intern = html.slice(html.indexOf("if (weg.intern) {"), html.indexOf("if (weg.intern) {") + 200);
  assert.ok(!/externMerken/.test(intern) && /if \(wege\.find\(\(w\) => w\.k === g\)\?\.intern\) g = null;/.test(html), "Ausweichweg wird als Standard gemerkt");
}

// 34. 0.17.8: sicherer Kopier-Weg für Handys, die keine andere App offen lassen
{
  assert.ok(/k: "kopieren", t: "📋 Nummer kopieren und in WhatsApp einfügen", kopieren: true/.test(html) && /async function waKopierHilfe\(nr\)/.test(html), "Kopier-Weg fehlt");
  assert.ok(/if \(weg\.kopieren\) \{ clearTimeout\(externTimer\); externMerken\(art, weg\.k\); waKopierHilfe\(wert\); return; \}/.test(html), "Kopier-Weg wird nicht ausgeführt/gemerkt");
  assert.equal((html.match(/externGescheitert\(art, wege\);/g) || []).length, 2, "gescheiterter Weg schaltet nicht auf Kopieren um");
  assert.ok(!/then\(\(\) => \{ m\.erfolg = true; externMerken/.test(html) && /if \(g === "teilen"\) g = null;/.test(html), "Teilen wird weiter als Standard gemerkt");
  assert.ok(/id="karteKopiert"/.test(html) && /navigator\.clipboard\?\.writeText\(adr\)/.test(html), "Adresse wird bei der Karte nicht kopiert");
  const waNr = new Function(html.slice(html.indexOf("const nurZiffern"), html.indexOf("// WhatsApp/Route direkt")) + "return (t) => '+' + waNummer(t);")();
  assert.equal(waNr("0171 234567"), "+49171234567"); assert.equal(waNr("+49 (0)171 234567"), "+49171234567");
}

// 35. 0.18.0: Feedback-Kachel (Fragebogen vom Server, 3 Schritte, Auswertung nur Admin)
{
  assert.ok(/\{ id: "feedback", sym: "💭", t: "Feedback", u: "Deine Meinung zur App", v: "feedback" \}/.test(html) && /id="v-feedback"/.test(html), "Feedback-Kachel fehlt");
  assert.ok(/"fotos", "feedback", "gruppe", "mitglied"/.test(html) && /if \(v === "feedback"\) fbLaden\(\);/.test(html), "Feedback-Ansicht nicht eingebunden");
  for (const a of ["feedback_meins", "feedback_senden", "feedback_auswertung"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Feedback-Aktion ${a} fehlt`);
  const ausw = server.slice(server.indexOf('case "feedback_auswertung"'), server.indexOf('case "feedback_auswertung"') + 120);
  assert.ok(/nurAdmin\(ich\)/.test(ausw), "Auswertung nicht auf Admin beschränkt");
  assert.ok(/r\.anonym \? null/.test(server), "anonyme Antworten zeigen den Namen");
  // Server nimmt nur Antworten aus dem Fragebogen an
  // TypeScript-Anteile entfernen, dann Fragebogen + Prüfung wie im Server ausführen
  const von = server.indexOf("const FEEDBACK_BOGEN"), bis = server.indexOf("\n}", server.indexOf("function feedbackPruefen")) + 2;
  const js = server.slice(von, bis).replace(/type FbFrage = \{[^}]*\};/, "").replace(/: FbFrage\[\]/, "").replace("(roh: unknown)", "(roh)")
    .replace(/ as Record<string, unknown>, aus: Record<string, string \| string\[\]> = \{\}/, ", aus = {}").replace(" as string[];", ";").replace(/ as string\)/g, ")");
  const fb = new Function("FB_GRUND_MAX", js + "return { FEEDBACK_FRAGEN, feedbackPruefen };")(Number(/const FB_GRUND_MAX = (\d+)/.exec(server)[1]));
  // 0.26.0: Anordnen/Farben sind umgesetzt → stehen nicht mehr als Wunsch, sondern unter „Schon umgesetzt“
  assert.ok(fb.FEEDBACK_FRAGEN.some((f) => f.schritt === 2 && f.optionen.length >= 8) && /anordnen/.test(server.slice(server.indexOf("const FEEDBACK_UMGESETZT"), server.indexOf("const FEEDBACK_UMGESETZT") + 300)), "Wunschliste oder „Schon umgesetzt“ fehlt");
  assert.deepEqual(fb.feedbackPruefen({ gefallen: "👍 Ja", bedienung: "Quatsch", wuensche: ["🎂 Geburtstagsliste", "X", "🎂 Geburtstagsliste"], fremd: "a" }),
    { gefallen: "👍 Ja", wuensche: ["🎂 Geburtstagsliste"] });
  // 0.40.0: Begründung nur zur passenden Antwort, gekürzt
  assert.deepEqual(fb.feedbackPruefen({ dauerhaft: "👎 Nein", dauerhaft_grund: "  zu viele Apps  " }), { dauerhaft: "👎 Nein", dauerhaft_grund: "zu viele Apps" });
  assert.deepEqual(fb.feedbackPruefen({ dauerhaft: "👍 Ja", dauerhaft_grund: "egal" }), { dauerhaft: "👍 Ja" });
  assert.equal(fb.feedbackPruefen({ dauerhaft: "🤔 Vielleicht", dauerhaft_grund: "x".repeat(900) }).dauerhaft_grund.length, 500);
  const dh = fb.FEEDBACK_FRAGEN.find((f) => f.id === "dauerhaft");
  assert.ok(dh && dh.grund.pflicht.includes("👎 Nein") && /Warum nicht\?/.test(dh.grund.t), "Frage „dauerhaft einsetzen“ mit Begründung fehlt");
  assert.ok(/function fbGrundFehlt\(/.test(html) && /class="karte beta"/.test(html) && /Beta-Version/.test(html), "Pflicht-Begründung oder Beta-Hinweis fehlt in der App");
  assert.ok(/gruende \}\);/.test(server) && /r\.anonym \? null : leute\.get\(r\.person_id\)\?\.display_name \?\? r\.person_id, zeit: r\.geaendert_am, antwort/.test(server), "Begründungen fehlen in der Auswertung oder zeigen anonyme Namen");
}

// 36. 0.19.0: Startseite selbst anordnen (lange drücken → verschieben/ausblenden), Speicherung je Mitglied auf dem Server
{
  const ids = [...html.slice(html.indexOf("const KACHELN = {"), html.indexOf("const kachelnAlle")).matchAll(/\{ id: "([a-z0-9_-]+)", sym:/g)].map((m) => m[1]);
  const anzahl = (html.slice(html.indexOf("const KACHELN = {"), html.indexOf("const kachelnAlle")).match(/\{ (id: "[^"]+", )?sym:/g) || []).length;
  assert.equal(ids.length, anzahl, "Kachel ohne feste id (Anordnung würde verrutschen)");
  assert.equal(new Set(ids).size, ids.length, "doppelte Kachel-id");
  assert.ok(/b\(-sp, "▲", "nach oben"\) \+ b\(sp, "▼", "nach unten"\)/.test(html) && /id="kaAusHinweis"/.test(html), "▲▼ oder Hinweis auf ausgeblendete fehlt");
  assert.ok(/kaBearbeiten\(true, id\);[\s\S]{0,400}kaZiehenStart\(id, x0, y0\); \}, 600\)/.test(html) && /id="kachelLeiste"/.test(html), "lange drücken fehlt");
  assert.ok(aufrufe.has("einstellung_setzen") && /kacheln: \(w\) =>/.test(server) && server.includes("notfall: nf ?? null, einstellungen,"), "Server-Speicherung fehlt");
  // Reihenfolge/Ausblenden rechnen wie in der App
  const code = html.slice(html.indexOf("const kachelnAlle"), html.indexOf("function kaUebernehmen"));
  const K = { verein: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "neu" }] };
  const g = new Function("KACHELN", "localStorage", "ICH", code.replace("let KA =", "var KA =") + ";return { setze: (x) => { KA = x; }, kacheln, kaSortiert };")(K, { getItem: () => null }, {});
  g.setze({ reihenfolge: { verein: ["c", "a", "b"] }, aus: ["a"] });
  assert.deepEqual(g.kacheln("verein").map((k) => k.id), ["c", "b", "neu"], "Reihenfolge/Ausblenden falsch");
  assert.deepEqual(g.kaSortiert("verein").map((k) => k.id), ["c", "a", "b", "neu"], "neue Kachel nicht hinten");
}

// 37. 0.19.1: Kamera in der App (ohne fremde App) + Messung/Hinweis, wenn Galerie/Kamera nicht aufgehen
{
  assert.ok(/async function appKamera\(weiter, vorne = false\)/.test(html) && /getUserMedia\(/.test(html) && /id="appKamera"/.test(html), "Kamera in der App fehlt");
  for (const w of ["appKamera(faGewaehlt)", "appKamera(protokollDateien)", "appKamera(dateienGewaehlt)"]) assert.ok(html.includes(w), `Kamera in der App fehlt bei ${w}`);
  for (const w of ["dateiWahl('faGalerie', faGewaehlt)", "dateiWahl('prBild', protokollDateien)", "dateiWahl(id, dateienGewaehlt)"]) assert.ok(html.includes(w), `Auswahl ohne Messung: ${w}`);
  // 0.19.2: nur noch zwei Wege – Galerie und Kamera (Kamera = in der App, keine fremde App)
  assert.ok(!/Kamera in der App<\/button>/.test(html) && !/id="faKamera"|id="prKamera"|id="dateiKamera"/.test(html), "doppelte Kamera-Knöpfe");
  assert.ok(/melden\("nicht_geoeffnet"\); dateiWahlHilfe/.test(html), "kein Hinweis, wenn sich nichts öffnet");
}

// 38. 0.20.0: Installation erkennen/erklären, Fotos per „Teilen“ aus der Galerie empfangen
{
  assert.ok(manifest.share_target?.method === "POST" && manifest.share_target.params.files?.[0]?.name === "fotos" && manifest.share_target.action === "./teilen", "share_target fehlt");
  assert.ok(/url\.pathname\.endsWith\("\/teilen"\)/.test(sw) && /const GETEILT = "kcclub-geteilt"/.test(sw), "Service Worker nimmt Geteiltes nicht an");
  assert.ok(!/const GETEILT = "kc-club-/.test(sw), "Geteilt-Speicher würde beim Update gelöscht");
  assert.ok(/else if \(h === "#geteilt"\) geteiltEmpfangen\(\);/.test(html) && /caches\.open\("kcclub-geteilt"\)/.test(html), "App holt geteilte Fotos nicht ab");
  assert.ok(/const START_ART = /.test(html) && /org\\\.chromium\\\.webapk/.test(html) && /id="installStand"/.test(html), "Installations-Erkennung fehlt");
  // Unsicher darf nie als installiert gelten: Android-Vollbild ohne WebAPK-Kennung = Verknüpfung
  assert.ok(/: "verknuepfung";/.test(html) && /\["var\(--grau\)", "❔ Nicht erkennbar/.test(html), "unbekannt/Verknüpfung wird als OK angezeigt");
}

// 39. 0.20.1: persönlichen Link nur in die Zwischenablage (nie an den Server/Protokoll)
{
  const f = html.slice(html.indexOf("async function zugangKopieren"), html.indexOf("const APP_URL_CLUB"));
  assert.ok(/navigator\.clipboard\.writeText\(link\)/.test(f) && !/daten: \{[^}]*link/.test(f) && !/KEY[^;]*api\(/.test(f), "Zugangslink würde übertragen");
}

// 40. 0.21.0: Link verloren → neuer Link nur per Mail an die hinterlegte Adresse, vor der Anmeldung, mit Bremse
{
  const z = server.slice(server.indexOf('if (a === "zugang_anfordern")'), server.indexOf("const ich = await anmelden(req);"));
  assert.ok(z.length > 100 && server.indexOf('if (a === "zugang_anfordern")') < server.indexOf("const ich = await anmelden(req);"), "Anfordern fehlt oder braucht Anmeldung");
  assert.ok(/routerSenden\("club_nachricht_mail", \[pe\.person_id\]/.test(z) && !/json\(\{[^}]*link/.test(z), "Link würde nicht nur per Mail gehen");
  assert.ok(/gesamt \?\? 0\) >= 20/.test(z) && /kuerzlich \?\? 0\) > 0/.test(z) && /KC-P-TEST/.test(z), "Bremse/Testsperre fehlt");
  assert.ok(/zugangAnfordern\(\)/.test(html) && !/"x-club-token": KEY[^\n]*zugang_anfordern/.test(html), "Anfordern in der App fehlt");
}

// 41. 0.22.0: Route direkt in Google Maps (installierte App), App-Info ohne Zugangsdaten
{
  assert.ok(/START_ART === "app" && IST_ANDROID \? \[\{ k: "intent", t: "🧭 Route in Google Maps"/.test(html) && /id="karteMaps"/.test(html), "Route direkt fehlt");
  assert.ok(/Entwicklung &amp; Design: <b>Hans-Joachim Koch<\/b>/.test(html) && /async function appInfoDaten\(\)/.test(html), "App-Info fehlt");
  const k = html.slice(html.indexOf("async function appInfoKopieren"), html.indexOf("// Persönlichen Link kopieren"));
  assert.ok(!/KEY/.test(k) && !/KEY/.test(html.slice(html.indexOf("async function appInfoDaten"), html.indexOf("async function appInfoZeigen"))), "App-Info enthält den Zugang");
}

// 42. 0.23.0: Gruppen-Chats und Zustellwahl (Push/E-Mail/WhatsApp)
{
  for (const a of ["gruppe_anlegen", "gruppe_aendern", "gruppe_verlassen"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Gruppen-Aktion ${a} fehlt`);
  const ae = server.slice(server.indexOf('case "gruppe_aendern"'), server.indexOf('case "gruppe_verlassen"'));
  assert.ok(/if \(!darfVerwalten\) throw/.test(ae) && /\.filter\(\(id\) => id !== g\.erstellt_von\)/.test(ae), "Gruppe darf von jedem geändert werden / Ersteller entfernbar");
  assert.ok(/async function sendenGewaehlt/.test(server) && /const wege = zustellwege\(p\.wege\);/.test(server) && /eventKey \+ "_mail", ohne/.test(server), "Zustellwahl fehlt (oder Mitglieder ohne App ohne Mail)");
  assert.ok(/wege: \{ push: ps\.has/.test(server) && !/wege: \{[^}]*phone/.test(server), "Erreichbarkeit fehlt oder verrät Nummern");
  assert.ok(/const wegIcons = /.test(html) && /id="zustell"/.test(html) && /whatsappWeitergeben\(text,/.test(html) && /id="v-gruppe"/.test(html), "Oberfläche für Gruppen/Zustellwahl fehlt");
}

// 43. 0.24.0: fertige Farbdesigns (Tag/Nacht), Automatik, Standard, Ausgangstür
{
  const roh = html.slice(html.indexOf("const DESIGNS = ["), html.indexOf("];", html.indexOf("const DESIGNS = [")) + 2).replace("const DESIGNS =", "return");
  const designs = new Function(roh)();
  assert.ok(designs.length >= 5 && designs[0].id === "klassik", "Designs fehlen oder Standard ist nicht Klassik");
  const hell = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const kontrast = (a, b) => { const [x, y] = [hell(a), hell(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const schluessel = Object.keys(designs[0].tag).sort().join();
  for (const d of designs) for (const art of ["tag", "nacht"]) {
    const f = d[art];
    assert.equal(Object.keys(f).sort().join(), schluessel, `${d.id}/${art}: Farben unvollständig`);
    assert.ok(!("gruen" in f || "gelb" in f || "rotbg" in f), `${d.id}: Statusfarben dürfen sich nicht ändern`);
    assert.ok(kontrast(f.text, f.bg) >= 7 && kontrast(f.text, f.karte) >= 7, `${d.id}/${art}: Schrift schlecht lesbar`);
    assert.ok(kontrast("#ffffff", f.rot) >= 4.5, `${d.id}/${art}: weiße Schrift auf Knöpfen schlecht lesbar`);
    assert.ok(kontrast(f.grau, f.karte) >= 4.5, `${d.id}/${art}: Hinweistext schlecht lesbar`);
  }
  assert.ok(/id="modusWahl"/.test(html) && /modusWaehlen\('auto'\)/.test(html) && /modusWaehlen\('tag'\)/.test(html) && /modusWaehlen\('nacht'\)/.test(html), "Tag/Nacht-Auswahl fehlt");
  assert.ok(/function sonne\(/.test(html) && /AmbientLightSensor/.test(html) && /designStandard\(\)/.test(html), "Automatik oder Standard-Knopf fehlt");
  assert.ok(/design: \(w\) => \(\{/.test(server) && /\["auto", "tag", "nacht"\]\.includes\(w\?\.modus\)/.test(server), "Server speichert das Design nicht geprüft");
  assert.ok(/designUebernehmen\(INIT\.einstellungen\?\.design\)/.test(html), "Design wird nicht vom Server übernommen");
  assert.ok((html.match(/onclick="appSchliessen\(\)"/g) || []).length >= 2 && /window\.close\(\)/.test(html), "Ausgangstür fehlt");
}

// 44. 0.25.0: Pinnwand – höchstens 3 Zettel je Person, 200 Zeichen, wichtig beim Öffnen, gelesen/erledigt nur für Verfasser
{
  for (const a of ["pinnwand", "pinnwand_anheften", "pinnwand_erledigt", "pinnwand_abnehmen"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Pinnwand-Aktion ${a} fehlt`);
  assert.ok(/const PINNWAND_MAX = 3, PINNWAND_ZEICHEN = 200;/.test(server), "Grenzen fehlen");
  const an = server.slice(server.indexOf('case "pinnwand_anheften"'), server.indexOf('case "pinnwand_erledigt"'));
  assert.ok(/>= PINNWAND_MAX\) throw/.test(an) && /\.length > PINNWAND_ZEICHEN\) throw/.test(an) && /\.is\("entfernt_am", null\)/.test(an), "Server prüft 3 Zettel / 200 Zeichen nicht");
  const li = server.slice(server.indexOf('case "pinnwand":'), server.indexOf('case "pinnwand_anheften"'));
  assert.ok(/\.\.\.\(vonMir \|\| ich\.vorstand \? \{ leser:/.test(li), "Leserliste nicht auf Verfasser beschränkt");
  assert.ok(/person_id\.eq\.\$\{ich\.person_id\},fuer\.eq\.alle,personen\.cs\./.test(server), "Sichtbarkeit (mich/alle/Personen) fehlt");
  const ab = server.slice(server.indexOf('case "pinnwand_abnehmen"'), server.indexOf('case "pinnwand_abnehmen"') + 600);
  assert.ok(/z\.person_id !== ich\.person_id && !ich\.vorstand\) throw/.test(ab), "Fremde dürfen Zettel abnehmen");
  assert.ok(/id="v-pinnwand"/.test(html) && /id="pwZaehler"/.test(html) && /maxlength="200"/.test(html) && /\{ id: "pinnwand", sym: "📌"/.test(html), "Pinnwand-Oberfläche fehlt");
  assert.ok(/if \(!PW\.startGeprueft\) \{ PW\.startGeprueft = true; pwStart\(begruesst\); \}/.test(html) && /PW\.zettel\.some\(pwOffen\)/.test(html), "Wichtige Zettel erscheinen nicht beim Öffnen");
  assert.ok(/\.zettel::before/.test(html) && /rotate\(var\(--dreh/.test(html), "Zettel ohne Nadel/Schräge");
}

// 45. 0.26.0: Kacheln per Ziehen & Ablegen, Feedback-Wünsche ohne schon Umgesetztes
{
  assert.ok(/function kaZiehenStart\(/.test(html) && /function kaZiehenEnde\(/.test(html) && /kaBearbeiten\(true, id\);[\s\S]{0,400}kaZiehenStart\(id, x0, y0\); \}, 600\)/.test(html), "Ziehen nach langem Drücken fehlt");
  assert.ok(/class="kpfeil4"><i>▲<\/i><i>◀<\/i><i>▶<\/i><i>▼<\/i>/.test(html), "Pfeile in 4 Richtungen fehlen");
  assert.ok(/if \(ZIEHEN && e\.cancelable\) e\.preventDefault\(\); \}, \{ passive: false \}/.test(html) && /if \(ZIEHEN \|\| zogGerade( \|\| REGZ \|\| regZogGerade)?\) \{ ziel = null; return; \}/.test(html), "Ziehen scrollt/wischt mit");
  assert.ok(/onclick="kaSchieben\(/.test(html), "Pfeil-Knöpfe als Alternative entfernt");
  const w = server.slice(server.indexOf('{ id: "wuensche"'), server.indexOf("const FEEDBACK_UMGESETZT"));
  for (const x of ["Farben selbst", "Gruppen-Chats", "selbst anordnen", "Monatskalender"]) assert.ok(!w.includes(x), `Wunsch „${x}“ ist schon umgesetzt`);
  assert.ok(/umgesetzt: FEEDBACK_UMGESETZT/.test(server) && /Schon umgesetzt/.test(html), "„Schon umgesetzt“ fehlt");
}

// 46. 0.27.0: Treffen mit Auswahllisten (Titel/Ort, gemerkte Orte), kleinere Kacheln, kompakter Kalender
{
  assert.ok(/function comboFeld\(/.test(html) && /comboFeld\("tfTitel"/.test(html) && /comboFeld\("tfOrt", "Ort", \[\.\.\.ORT_VORSCHLAEGE, \.\.\.TR_ORTE\]/.test(html), "Auswahllisten fehlen");
  assert.ok(/const ORT_VORSCHLAEGE = \["Garten", "Hütte bei Anne"\]/.test(html) && /orteMerken\(treffen\)/.test(html), "Orte werden nicht gemerkt");
  assert.ok(/ort: \$\("tfOrt"\)\.value/.test(html) && /titel: \$\("tfTitel"\)\.value/.test(html), "Speichern liest die Felder nicht mehr");
  assert.ok(/\.ktag \{ height: 44px;/.test(html) && /min-height: 100px/.test(html), "Kalender/Kacheln nicht verkleinert");
}

// 47. 0.27.1: Feedback neu starten (eigene Antworten) / neue Runde (nur Admin) – immer erst Kopie ins Archiv, dann löschen
{
  for (const a of ["feedback_neu", "feedback_runde_neu"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Feedback-Aktion ${a} fehlt`);
  const rn = server.slice(server.indexOf('case "feedback_runde_neu"'), server.indexOf('case "feedback_auswertung"'));
  assert.ok(/nurAdmin\(ich\)/.test(rn), "neue Runde nicht auf Admin beschränkt");
  const fa = server.slice(server.indexOf("async function feedbackArchivieren"), server.indexOf("async function feedbackArchivieren") + 1400);
  assert.ok(fa.indexOf('from("kc_club_feedback_archiv").insert') > 0 && fa.indexOf('from("kc_club_feedback_archiv").insert') < fa.indexOf(".delete()") && /if \(fa\) throw/.test(fa), "Löschen ohne vorherige Sicherungskopie");
  const neu = server.slice(server.indexOf('case "feedback_neu"'), server.indexOf('case "feedback_runde_neu"'));
  assert.ok(/feedbackArchivieren\(ich, "neu_ausfuellen", ich\.person_id\)/.test(neu), "Mitglied könnte fremdes Feedback löschen");
  assert.ok(/onclick="fbNeu\(\)"/.test(html) && /fbRundeNeu\(/.test(html) && /confirm\(/.test(html.slice(html.indexOf("async function fbNeu"), html.indexOf("async function fbAuswertung"))), "Knöpfe/Rückfrage fehlen");
}

// 48. 0.27.2: „Nächstes Treffen“ öffnet den Kalender im richtigen Monat mit ausgewähltem Tag
{
  const z = html.slice(html.indexOf("function zumTreffen()"), html.indexOf("function kalHeute()"));
  assert.ok(/kalTagWahl = tag; termineArt = "kalender";/.test(z) && /kalM = \+tag\.slice\(5, 7\) - 1/.test(z), "Sprung zum Treffen-Tag fehlt");
  assert.ok(/onclick="zumTreffen\(\)"><b style="font-size:1\.05rem">\$\{bisTreffen\}/.test(html), "Kachel „Nächstes Treffen“ springt nicht zum Tag");
  assert.ok(/da < alle \? `\$\{da\}\/\$\{alle\}` : da/.test(html), "Register zeigen nicht „sichtbar/gesamt“");
}

// 49. 0.28.0: Begrüßung beim ersten Start – einmal je Mitglied (Server + Gerät), „Weiter“ führt in die Einstellungen
{
  assert.ok(/begruessung: \(w\) => \(\{ gesehen: !!w\?\.gesehen/.test(server), "Server speichert die Begrüßung nicht");
  const b = html.slice(html.indexOf("function begruessungPruefen()"), html.indexOf("// ---------- KC-CLUB-SCHLIESSEN"));
  assert.ok(/INIT\?\.einstellungen\?\.begruessung\?\.gesehen\) return false/.test(b) && /localStorage\.setItem\("kc_club_begruesst_"/.test(b), "Begrüßung käme mehrfach");
  assert.ok(/zeige\("einstellungen"\)/.test(b) && /data-klappe="\$\{START_ART === "app" \? "darstellung" : "install"\}"/.test(b), "„Weiter“ führt nicht in die Einstellungen");
  assert.ok(/Weiter zu den Einstellungen/.test(html) && /begruessungFertig\(false\)">Schließen/.test(html), "Knöpfe fehlen");
}

// 50. 0.29.0: Online-Anzeige (Standard an, abschaltbar, wer sich verbirgt sieht auch andere nicht) + Anklopfen
{
  for (const a of ["online", "anklopfen", "anklopfen_antwort"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Online-Aktion ${a} fehlt`);
  assert.ok(/online: \(w\) => \(\{ zeigen: w\?\.zeigen !== false \}\)/.test(server), "Einstellung „online“ fehlt oder Standard nicht an");
  const on = server.slice(server.indexOf('case "online": {'), server.indexOf('case "anklopfen": {'));
  assert.ok(/zeigen \? onlineJetzt\(\) : Promise\.resolve\(new Set/.test(on), "Wer sich verbirgt, sieht trotzdem andere");
  assert.ok(/filter\(\(id: string\) => zeigen\.get\(id\) !== false\)/.test(server), "Verborgene erscheinen als online");
  const aw = server.slice(server.indexOf('case "anklopfen_antwort"'), server.indexOf('case "anklopfen_antwort"') + 400);
  assert.ok(/\.eq\("an", ich\.person_id\)/.test(aw), "Fremde könnten ein Anklopfen beantworten");
  const ak = server.slice(server.indexOf('case "anklopfen": {'), server.indexOf('case "anklopfen_antwort"'));
  assert.ok(/routerSenden\("club_nachricht_push"/.test(ak) && !/_mail"/.test(ak), "Anklopfen soll nur per Push gehen");
  assert.ok(/id="setOnline"/.test(html) && /id="klopfBlatt"/.test(html) && /function chatTakt\(\)/.test(html) && /id="onlineLeiste"/.test(html), "Oberfläche für Online/Anklopfen fehlt");
  assert.ok(/if \(ONL\.zeigen/.test(html) || /ONL\.zeigen && ONL\.liste\.length/.test(html), "Online-Leiste beachtet die eigene Einstellung nicht");
}

// 51. 0.30.0: „Neu in Version …“ vor und nach dem Update (alle übersprungenen Versionen), 🟢 X online auf der Startseite
{
  const vj = JSON.parse(lies("version.json"));
  assert.ok(Array.isArray(vj.verlauf) && vj.verlauf[0].version === vj.version && vj.verlauf.every((e) => e.version && e.neu?.length), "version.json: Verlauf fehlt oder passt nicht zur Version");
  const code = html.slice(html.indexOf("function neuigkeitenSeit"), html.indexOf("function neuigkeitenZeigen"));
  const neuigkeitenSeit = new Function("versionNeuer", code + "return neuigkeitenSeit;")((a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; });
  assert.deepEqual(neuigkeitenSeit(vj, "0.27.2", "0.29.0").map((e) => e.version), ["0.29.0", "0.28.0", "0.27.4"], "Übersprungene Versionen fehlen");
  assert.ok(/if \(NEUE_VERSION\) updateFenster\(\);/.test(html) && /onclick="updateFenster\(\)">Was ist neu\?/.test(html), "Update zeigt kein Neuigkeiten-Fenster");
  assert.ok(/nachUpdatePruefen\(begruesst\)/.test(html) && /kc_club_version_gesehen/.test(html), "Neuigkeiten nach automatischem Update fehlen");
  assert.ok(/🟢 \$\{ONL\.liste\.length\} online/.test(html), "Startseite zeigt nicht, wie viele online sind");
  assert.ok(/onclick="event\.stopPropagation\(\); onlineBlatt\(\)"/.test(html) && /function onlineBlatt\(\)[\s\S]{0,900}anklopfen\('\$\{x\.person_id\}'\)[\s\S]{0,500}direkt\('\$\{x\.person_id\}'\)/.test(html), "„online“ antippen zeigt keine Liste mit Direktkontakt");
}

// 52. 0.31.0: Anruf per Ton (Test) – nur Anrufer/Angerufener sehen den Anruf, SDP nur an die Gegenseite, Klingeln begrenzt
{
  for (const a of ["anruf_start", "anruf_status", "anruf_annehmen", "anruf_ende"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Anruf-Aktion ${a} fehlt`);
  const ah = server.slice(server.indexOf("async function anrufHolen"), server.indexOf("async function anrufHolen") + 700);
  assert.ok(/a\.von !== ich\.person_id && a\.an !== ich\.person_id\)\) throw/.test(ah) && /ANRUF_KLINGEL_SEK \* 1000/.test(ah), "Anruf für Fremde sichtbar oder klingelt endlos");
  assert.ok(/\.\.\.\(ichRufe \? \{ antwort: a\.antwort \} : \{ angebot: a\.angebot \}\)/.test(server), "Verbindungsdaten gehen an die falsche Seite");
  const an = server.slice(server.indexOf('case "anruf_annehmen"'), server.indexOf('case "anruf_ende"'));
  assert.ok(/if \(a\.an !== ich\.person_id\) throw/.test(an), "Anrufer könnte selbst annehmen");
  assert.ok(/SDP_MAX = 20000/.test(server) && /startsWith\("v=0"\)/.test(server), "Verbindungsdaten ungeprüft");
  assert.ok(/id="anrufSchirm"/.test(html) && /function anrufFehlgeschlagen\(\)/.test(html) && /getUserMedia\(\{ audio:/.test(html) && /stun:stun\.l\.google\.com:19302/.test(html), "Anruf-Oberfläche fehlt");
  assert.ok(!/turn:/.test(html), "kostenpflichtiger TURN-Server eingebaut (Zero-Cost)");
}

// 53. 0.32.0: Videoanruf (Test) – Art wird geprüft, Annehmen mit Bild oder nur Ton, Kamera aus/wechseln
{
  assert.ok(/const art = p\.art === "video" \? "video" : "ton";/.test(server), "Anruf-Art ungeprüft");
  assert.ok(/onclick="anrufAnnehmen\(true\)">🎥/.test(html) && /onclick="anrufAnnehmen\(false\)">📞/.test(html), "Annehmen mit Bild/nur Ton fehlt");
  assert.ok(/function anrufKameraWechseln\(\)/.test(html) && /replaceTrack\(neu\)/.test(html) && /id="anrufVideo"/.test(html) && /id="anrufSelbst"/.test(html), "Video-Oberfläche fehlt");
  assert.ok(/\$\("anrufVideo"\)\.srcObject = null; \$\("anrufSelbst"\)\.srcObject = null;/.test(html), "Kamera bleibt nach dem Auflegen an");
}

// 54. 0.32.1: Push ausdrücklich gewählt → auch an Mitglieder ohne geöffnete App mit aktivem Push-Abo (zusätzlich zur Mail)
{
  const sg = server.slice(server.indexOf("async function sendenGewaehlt"), server.indexOf("const zustellwege"));
  assert.ok(/if \(ohne\.length && w\.includes\("push"\)\)/.test(sg) && /kc_member_push_subscriptions"\)\.select\("person_id"\)\.eq\("active", true\)/.test(sg), "Push an Mitglieder mit Abo, aber ohne App fehlt");
  assert.ok(/routerSenden\(eventKey \+ "_mail", ohne/.test(sg), "Mitglieder ohne App bekommen keine Mail mehr");
  const sn = server.slice(server.indexOf("async function senden("), server.indexOf("async function sendenGewaehlt"));
  assert.ok(!/kc_member_push_subscriptions/.test(sn), "Standardversand (ohne Wahl) darf an Mitglieder ohne App nur mailen");
}

// 55. 0.33.0: drehende Kochmütze bei längeren Anfragen – nicht bei Hintergrund-Abfragen, immer wieder ausgeblendet
{
  assert.ok(/id="warten"/.test(html) && /kc-kochmuetze-weiss\.webp" alt=""><\/div><b id="wartenText">/.test(html), "Kochmütze fehlt");
  assert.ok(/const warte = wartenStart\(action\);\s*try \{ return await apiRoh\(action, daten\); \} finally \{ if \(warte\) wartenEnde\(\); \}/.test(html), "Kochmütze wird bei Fehlern nicht ausgeblendet");
  for (const a of ["online", "anruf_status", "unterhaltung", "protokoll_speichern", "init"]) assert.ok(new RegExp(`WARTEN_STILL = new Set\\([^)]*"${a}"`).test(html), `Hintergrund-Abfrage ${a} ließe die Mütze flackern`);
  assert.ok(/nachricht_senden: "Nachricht wird gesendet …"/.test(html), "Text beim Senden fehlt");
}

// 56. 0.34.0: Push-Quittung (angezeigt/geöffnet) aus der Club-App an den Communicator, Anzeige unter eigenen Nachrichten
{
  const sw = lies("sw.js");
  assert.ok(/kc-communication-push-receipt/.test(sw) && /await quittung\(d\.data\?\.requestId, "displayed"\)/.test(sw) && /quittung\(e\.notification\.data\?\.requestId, "opened"\)/.test(sw), "Push-Quittung fehlt im Service Worker");
  assert.ok(/requestId: d\.data\?\.requestId \|\| ""/.test(sw), "Auftragsnummer wird nicht an der Benachrichtigung gemerkt");
  assert.ok(/zustellung: zustellung\(m\.id\)/.test(server) && /\.slice\(-60\)/.test(server), "Zustellung eigener Nachrichten fehlt");
  assert.ok(/function zustellText\(z\)/.test(html) && /🔔 geöffnet/.test(html), "Anzeige der Rückmeldung fehlt");
}

// 57. 0.34.1: Status farbig (Knopf „Mein Status“, Startseite, Mitgliederliste)
{
  for (const st of ["verfuegbar", "beschaeftigt", "urlaub", "krank", "abwesend"]) assert.ok(new RegExp(`\\.st-${st} \\{`).test(html), `Farbe für Status ${st} fehlt`);
  assert.ok(/id="meinStatusKnopf"/.test(html) && /function meinStatusZeigen\(\)/.test(html) && /meinStatusZeigen\(\);/.test(html), "„Mein Status“ zeigt den Status nicht");
  assert.ok(/<span class="stmarke st-\$\{statusArt\(m\.status\)\}">/.test(html), "Mitgliederliste zeigt den Status nicht farbig");
}

// 58. 0.35.0: ungültiger Link klar erklärt, Link einfügen (iPhone), iPhone-Start mit Schlüssel, Einladung mit Neu-anfordern-Weg
{
  assert.ok(/id="linkUngueltig"/.test(html) && /\$\("linkUngueltig"\)\.classList\.remove\("versteckt"\)/.test(html), "Hinweis „Link gilt nicht mehr“ fehlt");
  const code = html.slice(html.indexOf("function linkUebernehmen(text)"), html.indexOf("async function linkAusZwischenablage"));
  assert.ok(/\[\?&\]k=\(\[0-9a-f\]\{32,96\}\)/.test(code) && /localStorage\.setItem\("kc_club_key"/.test(code), "Link einfügen erkennt den Schlüssel nicht");
  assert.ok(/function iosStartMitSchluessel\(\)/.test(html) && /if \(!IST_IOS \|\| !KEY \|\| START_ART === "app"\) return;/.test(html) && /iosStartMitSchluessel\(\);/.test(html), "iPhone-Start mit Schlüssel fehlt");
  assert.ok(/Die Seite zeigt dann „Link verloren\?“ – dort deine E-Mail-Adresse eingeben/.test(html), "Einladung erklärt das Neu-Anfordern nicht");
}

// 59. 0.36.0: To-do-Liste (nur ich/für alle, abhaken, löschen nur Ersteller/Clubleitung) + Register per Ziehen umsortieren
{
  for (const a of ["todo_liste", "todo_anlegen", "todo_erledigt", "todo_loeschen"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `To-do-Aktion ${a} fehlt`);
  assert.ok(/\.or\(`person_id\.eq\.\$\{ich\.person_id\},fuer\.eq\.alle(,zustaendig\.eq\.\$\{ich\.person_id\})?`\)/.test(server), "To-do: fremde private Einträge sichtbar");
  const er = server.slice(server.indexOf('case "todo_erledigt"'), server.indexOf('case "todo_loeschen"'));
  assert.ok(/t\.person_id !== ich\.person_id && t\.fuer !== "alle"( && t\.zustaendig !== ich\.person_id)?\)\) throw/.test(er), "Fremde private Einträge abhakbar");
  const lo = server.slice(server.indexOf('case "todo_loeschen"'), server.indexOf('case "todo_loeschen"') + 500);
  assert.ok(/t\.person_id !== ich\.person_id && !ich\.vorstand\) throw/.test(lo), "Fremde dürfen löschen");
  assert.ok(/register: kaIds\(w\?\.register\)/.test(server) && /const registerReihe = /.test(html) && /function registerZiehen\(\)/.test(html), "Register-Reihenfolge fehlt");
  assert.ok(/data-m="todo" onclick="termineModus\('todo'\)"/.test(html) && /class="todotab"/.test(html), "To-do-Reiter fehlt");
}

// 60. 0.37.0: Sprachnachrichten (Aufnahme → Anhang → gleiche Empfänger) + To-do „wer soll es machen“
{
  assert.ok(/id="mikroKnopf"/.test(html) && /function spracheStart\(\)/.test(html) && /new MediaRecorder\(/.test(html) && /if \(s >= 180\)/.test(html), "Sprachnachricht-Aufnahme fehlt oder unbegrenzt");
  assert.ok(/const r = await anlageHochladen\(datei\);[\s\S]{0,300}await senden\(\);/.test(html), "Sprachnachricht geht nicht über den normalen Versand");
  assert.ok(/\/\^audio\\\/\/\.test\(a\.mime/.test(html) && /function spracheAbspielen\(/.test(html), "Abspielen im Chat fehlt");
  assert.ok(/s\.strom\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\)/.test(html), "Mikrofon bleibt nach der Aufnahme an");
  assert.ok(aktionen.has("todo_zuweisen") && aufrufe.has("todo_zuweisen"), "todo_zuweisen fehlt");
  assert.ok(/fuer\.eq\.alle,zustaendig\.eq\.\$\{ich\.person_id\}/.test(server) && /t\.zustaendig !== ich\.person_id\)\) throw/.test(server), "Zuständige sehen/abhaken ihre Aufgabe nicht");
  const zw = server.slice(server.indexOf('case "todo_zuweisen"'), server.indexOf('case "todo_loeschen"'));
  assert.ok(/t\.person_id !== ich\.person_id && !ich\.vorstand\) throw/.test(zw), "Fremde dürfen zuweisen");
  assert.ok(/senden\("club_aufgabe", \[an\]/.test(server), "Zuständige bekommen keinen Bescheid");
}

// 61. 0.38.0: Erstattung – Positionen geprüft und Summe im Server gerechnet, Empfänger aus Ämtern, BCC Antragsteller + Admin
{
  for (const a of ["erstattung_meine", "erstattung_senden"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Erstattungs-Aktion ${a} fehlt`);
  assert.ok(/kmSatzStandard: 0\.38/.test(server) && /empfaenger: \{ an: "Kassenwart", cc: "Clubsprecher" \}/.test(server), "Pauschale/Empfänger nicht in der Registry");
  const es = server.slice(server.indexOf('case "erstattung_senden"'), server.indexOf("// ----- Pinnwand (KC-CLUB-PINNWAND)"));
  assert.ok(/const summe = Math\.round\(pos\.reduce/.test(es), "Summe kommt nicht vom Server");
  assert.ok(/startsWith\(`club\/\$\{ich\.person_id\}\/`\)/.test(es), "fremde Belege anhängbar");
  assert.ok(/const bcc = \[\.\.\.new Set\(\[ich\.person_id, \.\.\.admins\]\)\]/.test(es) && /\{ cc, bcc \}\)/.test(es), "BCC an Antragsteller/Admin fehlt");
  assert.ok(/betrag: Math\.round\(km \* satz \* 100\) \/ 100/.test(server) && /betrag > 0 && betrag <= 5000/.test(server), "Beträge ungeprüft");
  assert.ok(/\.\.\.\(kopie\?\.bcc\?\.length \? \{ bcc:/.test(server), "Router bekommt keine Kopien");
  assert.ok(/\{ id: "erstattung", sym: "💶"/.test(html) && /id="v-erstattung"/.test(html) && /comboFeld\("ersGrund"/.test(html), "Erstattungs-Oberfläche fehlt");
}

// 62. 0.39.0: km-Satz mit „gilt ab“ (nur Admin), Fahrt nimmt den Satz ihres Datums – gleiche Regel in App und Server
{
  for (const a of ["km_satz_setzen", "km_satz_loeschen"]) { assert.ok(aktionen.has(a) && aufrufe.has(a), `${a} fehlt`); assert.ok(/nurAdmin\(ich\)/.test(server.slice(server.indexOf(`case "${a}"`), server.indexOf(`case "${a}"`) + 120)), `${a} nicht nur für Admin`); }
  const sf = server.slice(server.indexOf("const satzFuer"), server.indexOf("function erstattungPruefen"));
  const satzFuer = new Function("ERSTATTUNG", sf.replace(/: KmSatz\[\]/, "").replace(/: string\)/, ")").replace("const satzFuer =", "return"))({ kmSatzStandard: 0.38 });
  const S = [{ satz: 0.38, ab: "2026-01-01" }, { satz: 0.42, ab: "2026-10-01" }];
  assert.equal(satzFuer(S, "2025-12-31"), 0.38); assert.equal(satzFuer(S, "2026-09-30"), 0.38); assert.equal(satzFuer(S, "2026-10-01"), 0.42);
  const sa = html.slice(html.indexOf("const satzAm"), html.indexOf("\n", html.indexOf("const satzAm")));
  const satzAm = new Function("ERS", sa.replace("const satzAm =", "return"))({ standard: 0.38, saetze: S });
  for (const t of ["2025-12-31", "2026-09-30", "2026-10-01", "2027-05-05"]) assert.equal(satzAm(t), satzFuer(S, t), `App und Server rechnen am ${t} verschieden`);
  assert.ok(/id="adminErstattung"/.test(html) && /if \(ICH\?\.admin\) \{ \$\("adminErstattung"\)/.test(html), "Admin-Bereich fehlt");
}

// 63. 0.39.1: Belege per Kamera oder Datei-Explorer, höchstens so viele wie der Server je Position annimmt
{
  assert.ok(/id="ersFoto" accept="image\/\*" capture="environment"/.test(html) && /id="ersDatei" accept="image\/\*,application\/pdf" multiple/.test(html), "Kamera/Datei-Auswahl für Belege fehlt");
  const max = Number(/const BELEG_MAX = (\d+)/.exec(html)?.[1]), srv = Number(/x\.belege : \[\]\)\.map\(String\)\.slice\(0, (\d+)\)/.exec(server)?.[1]);
  assert.ok(max > 0 && max === srv, "Beleg-Grenze App ≠ Server");
  assert.ok(/ERS\.belege\.some\(\(b\) => b\.laedt\)/.test(html) && /function belegWeg\(/.test(html), "Belege: Warten aufs Hochladen/Entfernen fehlt");
}

console.log(`OK – Köcheclub-App ${appV}: ${aufrufe.size} API-Aktionen geprüft`);
