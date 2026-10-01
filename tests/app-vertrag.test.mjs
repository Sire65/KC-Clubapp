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
// 0.59.0: Lesen erlaubt (Twinkey zeigt DP2-Freigaben), Schreiben weiterhin verboten
assert.ok(!/from\("kc_dp_plan_sharing"\)\s*\.(insert|update|upsert|delete)\(/.test(server) && (server.match(/kc_dp_plan_sharing/g) || []).length === 1, "Dienstplan-Freigabetabelle darf von der Club-App nicht verändert werden");
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
  const code = html.slice(html.indexOf("const FEIERTAGE_CACHE"), html.indexOf("function kalEintraege(tag"));
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
  const code = html.slice(html.indexOf("async function exifLesen"), html.indexOf("async function fotosHochladen"));
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
  // 0.62.0: gerechnet wird die erweiterte Ansicht (einfach() = false) – die einfache prüft Test 84
  const g = new Function("KACHELN", "localStorage", "ICH", "einfach", code.replace("let KA =", "var KA =") + ";return { setze: (x) => { KA = x; }, kacheln, kaSortiert };")(K, { getItem: () => null }, {}, () => false);
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
  assert.ok(/const PINNWAND_MAX = 4, PINNWAND_ZEICHEN = 200;/.test(server), "Grenzen fehlen"); // 0.60.0: 4 statt 3 (Freigabe Hansi)
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
  assert.ok(/\.\.\.\(ichRufe \? \{ antwort: a\.antwort(, kurzantwort: a\.kurzantwort \?\? null)? \} : \{ angebot: a\.angebot \}\)/.test(server), "Verbindungsdaten gehen an die falsche Seite");
  const an = server.slice(server.indexOf('case "anruf_annehmen"'), server.indexOf('case "anruf_ende"'));
  assert.ok(/if \(a\.an !== ich\.person_id\) throw/.test(an), "Anrufer könnte selbst annehmen");
  assert.ok(/SDP_MAX = 20000/.test(server) && /startsWith\("v=0"\)/.test(server), "Verbindungsdaten ungeprüft");
  assert.ok(/id="anrufSchirm"/.test(html) && /function anrufFehlgeschlagen\(\)/.test(html) && /getUserMedia\(\{ audio:/.test(html) && /stun:stun\.l\.google\.com:19302/.test(html), "Anruf-Oberfläche fehlt");
  assert.ok(!/turn:/.test(html), "kostenpflichtiger TURN-Server eingebaut (Zero-Cost)");
}

// 53. 0.32.0: Videoanruf (Test) – Art wird geprüft, Annehmen mit Bild oder nur Ton, Kamera aus/wechseln
{
  assert.ok(/const art = p\.art === "video"( && !konferenz)? \? "video" : "ton";/.test(server), "Anruf-Art ungeprüft");
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
  assert.ok(/const warte = wartenStart\(action, opt\.warten\);\s*try \{ return await apiRoh\(action, daten\); \}\s*(catch \(e\) \{[^}]*\}[^\n]*\n\s*)?finally \{ if \(warte\) wartenEnde\(\); \}/ /* 0.93.0: catch nur zum Protokollieren, wirft weiter */.test(html), "Kochmütze wird bei Fehlern nicht ausgeblendet");
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
  assert.ok(/\.or\(`person_id\.eq\.\$\{ich\.person_id\},fuer\.eq\.alle(,zustaendig\.eq\.\$\{ich\.person_id\})?(,zustaendige\.cs\.\{\$\{ich\.person_id\}\})?`\)/.test(server), "To-do: fremde private Einträge sichtbar");
  const er = server.slice(server.indexOf('case "todo_erledigt"'), server.indexOf('case "todo_loeschen"'));
  assert.ok(/t\.person_id !== ich\.person_id && t\.fuer !== "alle"( && t\.zustaendig !== ich\.person_id)?( && !\(t\.zustaendige \?\? \[\]\)\.includes\(ich\.person_id\))?\)\) throw/.test(er), "Fremde private Einträge abhakbar");
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
  assert.ok(/fuer\.eq\.alle,zustaendig\.eq\.\$\{ich\.person_id\}/.test(server) && /t\.zustaendig !== ich\.person_id( && !\(t\.zustaendige \?\? \[\]\)\.includes\(ich\.person_id\))?\)\) throw/.test(server), "Zuständige sehen/abhaken ihre Aufgabe nicht");
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
  assert.ok(/id="adminErstattung"/.test(html) && /if \(ICH\?\.admin\) \{[^\n]{0,160}\$\("adminErstattung"\)\.classList\.remove/.test(html), "Admin-Bereich fehlt");
}

// 63. 0.39.1: Belege per Kamera oder Datei-Explorer, höchstens so viele wie der Server je Position annimmt
{
  assert.ok(/id="ersFoto" accept="image\/\*" capture="environment"/.test(html) && /id="ersDatei" accept="image\/\*,application\/pdf" multiple/.test(html), "Kamera/Datei-Auswahl für Belege fehlt");
  const max = Number(/const BELEG_MAX = (\d+)/.exec(html)?.[1]), srv = Number(/x\.belege : \[\]\)\.map\(String\)\.slice\(0, (\d+)\)/.exec(server)?.[1]);
  assert.ok(max > 0 && max === srv, "Beleg-Grenze App ≠ Server");
  assert.ok(/ERS\.belege\.some\(\(b\) => b\.laedt\)/.test(html) && /function belegWeg\(/.test(html), "Belege: Warten aufs Hochladen/Entfernen fehlt");
}

// 64. 0.41.0: Chatliste – einmal tippen = auswählen (entfernen), doppelt tippen = öffnen; Entfernen nur für mich
{
  assert.ok(/onclick="unterhTipp\('\$\{u\.id\}'\)"/.test(html) && !/class="unterh" onclick="chatOeffnen/.test(html), "Chatliste öffnet noch beim ersten Tippen");
  const tipp = html.slice(html.indexOf("function unterhTipp"), html.indexOf("function unterhZeichnen"));
  assert.ok(/jetzt - lt\.t < DOPPELTIPP_MS/.test(tipp) && /return chatOeffnen\(id\)/.test(tipp), "Doppeltippen öffnet nicht");
  const weg = html.slice(html.indexOf("async function unterhEntfernen"), html.indexOf("async function unterhEntfernen") + 900);
  assert.ok(/if \(!confirm\(/.test(weg) && /fuerAlle \? "unterhaltung_loeschen" : "unterhaltung_ausblenden"/.test(weg), "Entfernen ohne Rückfrage");
  assert.ok(/ICH\?\.admin \? `<button class="knopf klein" onclick="unterhEntfernen\('\$\{u\.id\}', true\)"/.test(html), "„Für alle löschen“ nicht auf Admin beschränkt");
}

// 65. 0.42.0: Info-Feld blätterbar (Registry, Pfeile, Punkte, Wischen) + Wetter (Adapter/Registry, nur Admin stellt ein, Rule 11)
{
  const ids = [...html.slice(html.indexOf("const INFO_ALLE = ["), html.indexOf("];", html.indexOf("const INFO_ALLE = ["))).matchAll(/id: "([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["treffen", "schnellstart", "wetter", "fuerdich", "demnaechst", "fotos", "zentrale", "admin"], "Info-Felder falsch (1.8.1: + schnellstart)");
  assert.ok(/class="ipfeil links"[^>]*onclick="infoBlaettern\(-1\)"/.test(html) && /onclick="infoBlaettern\(1\)"/.test(html) && /class="ipunkt\$\{i === INFO_I \? " an" : ""\}"/.test(html), "Pfeile/Punkte fehlen");
  assert.ok(/\[\$\("heroInfo"\), infoBlaettern\]/.test(html), "Wischen im Info-Feld fehlt");
  assert.ok(!/setInterval\([^)]*infoBlaettern/.test(html), "Info-Feld darf nicht automatisch blättern");
  for (const a of ["wetter", "wetter_konfig", "wetter_ort_suchen", "wetter_setzen"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `${a} fehlt`);
  // 0.74.0: wetter_ort_suchen auch für Mitglieder (eigener Wetterort, Test 95) – Konfig und Club-Vorgabe bleiben Admin
  for (const a of ["wetter_konfig", "wetter_setzen"]) assert.ok(/nurAdmin\(ich\)/.test(server.slice(server.indexOf(`case "${a}"`), server.indexOf(`case "${a}"`) + 80)), `${a} nicht nur für Admin`);
  assert.ok(/const WETTER_QUELLEN: Record</.test(server) && /const WETTER_APPS: Record</.test(server) && !/api\.open-meteo\.com/.test(html), "Wetter nicht über Registry/Server");
  assert.ok(/if \(!r\.daten\) return `<h2>❔ Wetter gerade nicht verfügbar/.test(html) && /WETTER_VERALTET_MIN/.test(html) && /⚠️ veraltet/.test(html), "Rule 11: fehlendes/veraltetes Wetter nicht markiert");
  assert.ok(/prefers-reduced-motion: reduce\) \{ \.wszene/.test(html), "Animation ohne Rücksicht auf „weniger Bewegung“");
  const wa = new Function(html.slice(html.indexOf("const WETTER_CODES"), html.indexOf("const grad =")) + "return wetterArt;")();
  assert.equal(wa(0).szene, "sonne"); assert.equal(wa(63).szene, "regen"); assert.equal(wa(73).szene, "schnee"); assert.equal(wa(95).szene, "gewitter"); assert.equal(wa(45).szene, "nebel");
  assert.equal(wa(42).text, "Wetter unbekannt", "unbekannter Code wird als Wetter ausgegeben");
}

// 66. 0.43.0: Info-Karten „Demnächst“ (aus dem Kalender, sortiert, nur Zukunft) und „Neueste Fotos“ (schlanke Server-Aktion)
{
  assert.ok(aktionen.has("fotos_neueste") && aufrufe.has("fotos_neueste"), "fotos_neueste fehlt");
  const fn = server.slice(server.indexOf('case "fotos_neueste"'), server.indexOf('case "fotos_liste"'));
  assert.ok(/\.is\("geloescht_am", null\)/.test(fn) && /Math\.min\(6,/.test(fn) && /createSignedUrls\(pfade, 3600\)/.test(fn), "fotos_neueste: Papierkorb/Grenze/Links");
  const src = html.slice(html.indexOf("function demnaechstListe"), html.indexOf("function infoDemnaechst"));
  const heute = new Date().toISOString().slice(0, 10), plus = (n) => { const d = new Date(heute + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const liste = new Function("heuteIso", "tagPlus", "berlinIso", "fZeit", "DEMNAECHST_TAGE", src + "return demnaechstListe;")(() => heute, (i, n) => plus(n), (iso) => iso.slice(0, 10), { format: () => "19:00" }, 56)({
    treffen: [{ beginn: plus(9) + "T17:00:00Z", titel: "Clubabend" }, { beginn: plus(3) + "T17:00:00Z", titel: "Abgesagt", status: "abgesagt" }],
    dienste: [{ datum: plus(2), start: "10:00", bereich: "Bude" }], fristen: [{ frist: plus(5) + "T20:00:00Z", titel: "Grillfest", offen: true }, { frist: plus(4) + "T20:00:00Z", titel: "zu", offen: false }],
    geburtstage: [{ md: plus(1).slice(5), name: "Klaus" }, { md: plus(-3).slice(5), name: "Vorbei" }], aktionen: [{ von: plus(-1), titel: "Reise läuft" }] });
  assert.deepEqual(liste.map((x) => x.text), ["Reise läuft", "Klaus hat Geburtstag", "Mein Dienst · Bude", "Abstimmung endet: Grillfest", "Clubabend"], "Demnächst falsch sortiert/gefiltert");
}

// 67. 0.44.0: Kommunikationszentrale als Info-Karte, Start-Karte wählbar, „Alle“ darf jeder (eine Stelle), Pfeile am Rahmen
{
  assert.ok(/const KOMMUNIKATION = \{ alleDarfJeder: true \}/.test(server) && /if \(!KOMMUNIKATION\.alleDarfJeder\) nurVorstand\(ich\)/.test(server), "„Alle“-Recht nicht an einer Stelle");
  assert.ok(/infofeld: \(w\) => \(\{ start:/.test(server) && /id="setInfoStart"/.test(html) && /infoStartUebernehmen\(INIT\.einstellungen\?\.infofeld\)/.test(html), "Start-Karte nicht einstellbar");
  const z = html.slice(html.indexOf("function infoZentrale"), html.indexOf("let zeUhrTimer"));
  for (const k of ["📞", "🎥", "✊", "🎤", "💬"]) assert.ok(z.includes(`knopf("${k}"`), `Zentrale: Knopf ${k} fehlt`);
  for (const w of ["push", "email", "whatsapp"]) assert.ok(z.includes(`weg("${w}"`), `Zentrale: Weg ${w} fehlt`);
  assert.ok(/zeWahl\('alle'\)/.test(z) && /zeWahl\('online'\)/.test(z) && /zeWahl\('keiner'\)/.test(z) && /zeBlatt\(\)/.test(z), "Zentrale: Auswahl Alle/Online/Keiner/Auswahl fehlt");
  const zs = html.slice(html.indexOf("async function zeSenden"), html.indexOf("// Feld 4 (0.43.0)"));
  assert.ok(/api\("nachricht_senden"/.test(zs) && /n >= ZE_RUECKFRAGE_AB && !confirm/.test(zs), "Zentrale sendet nicht über den vorhandenen Weg oder ohne Rückfrage");
  assert.ok(/\.ipfeil\.links \{ left: -17px; \}/.test(html) && /id="infoPunkte"/.test(html) && !/class="inav"/.test(html), "Pfeile nicht am Rahmen / Punkte nicht unter dem Feld");
  assert.ok(/chip\("\*", "👥 Alle Mitglieder"\)/.test(html) && !/ICH\.vorstand \? chip\("\*"/.test(html), "„Alle Mitglieder“ nicht für alle");
}

// 68. 0.45.0: Foto-Details – EXIF aus dem Original (Zeit, Kamera, Belichtung, Größe, GPS), Ort nur mit Erlaubnis, Server begrenzt
{
  const code = html.slice(html.indexOf("async function exifLesen"), html.indexOf("async function fotosHochladen"));
  const exifLesen = new Function(code + ";return exifLesen;")();
  const w16 = (v) => [(v >> 8) & 255, v & 255], w32 = (v) => [(v >>> 24) & 255, (v >> 16) & 255, (v >> 8) & 255, v & 255];
  const ascii = (s) => [...[...s].map((c) => c.charCodeAt(0)), 0], rat = (...p) => p.flatMap(([z, n]) => [...w32(z), ...w32(n)]);
  function tiff(ifd0, exif, gps) {
    const len = (n) => 2 + n * 12 + 4, oE = 8 + len(ifd0.length + 2), oG = oE + len(exif.length); let daten = oG + len(gps.length); const teil = [];
    const baue = (es) => { const out = [...w16(es.length)]; for (const [tag, typ, anz, wert] of es) { out.push(...w16(tag), ...w16(typ), ...w32(anz)); if (wert.length <= 4) out.push(...wert, ...Array(4 - wert.length).fill(0)); else { out.push(...w32(daten)); teil.push(...wert); daten += wert.length; } } out.push(0, 0, 0, 0); return out; };
    const e0 = baue([...ifd0, [0x8769, 4, 1, w32(oE)], [0x8825, 4, 1, w32(oG)]]), eE = baue(exif), eG = baue(gps);
    return [0x4d, 0x4d, 0, 42, ...w32(8), ...e0, ...eE, ...eG, ...teil];
  }
  const ti = tiff([[0x010f, 2, 8, ascii("samsung")], [0x0110, 2, 9, ascii("SM-S911B")]],
    [[0x9003, 2, 20, ascii("2026:09:26 18:42:07")], [0x829d, 5, 1, rat([18, 10])], [0x829a, 5, 1, rat([1, 120])], [0x8827, 3, 1, w16(100)], [0x920a, 5, 1, rat([54, 10])], [0x9209, 3, 1, w16(0)], [0xa002, 4, 1, w32(4000)], [0xa003, 4, 1, w32(3000)]],
    [[1, 2, 2, ascii("N")], [2, 5, 3, rat([51, 1], [39, 1], [5220, 100])], [3, 2, 2, ascii("E")], [4, 5, 3, rat([7, 1], [38, 1], [312, 100])]]);
  const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe1, ...w16(8 + ti.length), 0x45, 0x78, 0x69, 0x66, 0, 0, ...ti, 0xff, 0xd9])], "IMG_1.jpg", { type: "image/jpeg" });
  const m = await exifLesen(jpg);
  assert.equal(m.aufnahme, "2026-09-26T18:42:07"); assert.equal(m.kamera, "samsung SM-S911B");
  assert.equal(m.blende, 1.8); assert.equal(m.belichtung, "1/120"); assert.equal(m.iso, 100); assert.equal(m.brennweite, 5.4); assert.equal(m.blitz, false);
  assert.equal(m.breite, 4000); assert.equal(m.hoehe, 3000); assert.equal(m.datei, "IMG_1.jpg");
  assert.ok(Math.abs(m.gps.lat - 51.6645) < 1e-6 && Math.abs(m.gps.lon - 7.6342) < 1e-6, "GPS falsch gelesen");
  assert.deepEqual(Object.keys(await exifLesen(new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" }))).sort(), ["datei", "groesse", "typ"], "ohne EXIF wird etwas erfunden");
  // Server: Ort nur mit Erlaubnis, gerundet; Unsinn fliegt raus
  const sf = server.slice(server.indexOf("function fotoMetaPruefen"), server.indexOf("// Ortsname zu GPS-Daten"));
  const fmp = new Function("txt", sf.replace("(roh: any, mitOrt: boolean)", "(roh, mitOrt)").replace("(v: unknown, min: number, max: number)", "(v, min, max)").replace(": Record<string, unknown>", "") + "return fotoMetaPruefen;")((v, n) => String(v ?? "").trim().slice(0, n));
  const roh = { ...m, gps: { lat: 51.664512, lon: 7.634187 }, iso: -5, belichtung: "<b>" };
  assert.deepEqual(fmp(roh, true).gps, { lat: 51.6645, lon: 7.6342 }); assert.equal(fmp(roh, false).gps, undefined, "Ort gespeichert, obwohl nicht erlaubt");
  assert.equal(fmp(roh, true).iso, undefined); assert.equal(fmp(roh, true).belichtung, undefined);
  assert.ok(aktionen.has("foto_ort") && aufrufe.has("foto_ort"), "foto_ort fehlt");
  const fo = server.slice(server.indexOf('case "foto_ort"'), server.indexOf('case "foto_aendern"'));
  assert.ok(/if \(!darfFotoAendern\(ich, f\)\) throw/.test(fo) && /1100/.test(fo) && /"User-Agent"/.test(server), "Ort entfernen ungeschützt / Nominatim-Regeln");
  assert.ok(/onclick="fotoDetails\(\)"/.test(html) && /id="faOrt" checked/.test(html) && /mitOrt: \$\("faOrt"\)\?\.checked !== false/.test(html), "Details/Ort-Erlaubnis fehlen in der App");
}

// 69. 0.46.0: Wetter-Tage – antippen wechselt die Anzeige, lange drücken zeigt Tagesdetails (Server liefert Stunden + Tageswerte)
{
  assert.ok(/precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunshine_duration/.test(server) && /&hourly=temperature_2m,weather_code,precipitation_probability,is_day/.test(server), "Tagesdetails werden nicht abgerufen");
  assert.ok(/const WETTER_STUNDEN = \[6, 9, 12, 15, 18, 21\], WETTER_STUNDEN_TAGE = 7/.test(server), "Stunden-Auswahl fehlt");
  const w = html.slice(html.indexOf("function infoWetter"), html.indexOf("function wetterApp"));
  assert.ok(/onpointerdown="wtDruck\(event, \$\{i\}\)"/.test(w) && /onpointerup="wtLos\(\$\{i\}\)"/.test(w), "Tag antippen/lange drücken fehlt");
  assert.ok(/if \(WET\.tag === 0\)/.test(w) && /wetterTagWahl\(0\)/.test(w), "gewählter Tag ändert die Anzeige nicht / kein Zurück");
  assert.ok(/WT_DRUCK\.lang = true;[^\n]*wetterTagDetails\(i\)/.test(w) && /if \(!abbruch && !w\.lang && w\.i === i\) wetterTagWahl\(i\)/.test(w), "Lange drücken löst zusätzlich den Tipp aus");
  assert.ok(/id="wetterBlatt"/.test(html) && /e\.target\.closest\?\.\("\.wtage"\) \? null/.test(html), "Detailblatt fehlt / Tagesleiste blättert das Info-Feld");
}

// 70. 0.47.0: Admin-Zentrale – nur Admin (Server und Karte), Programme aus Registry, unbekannt/alt nie grün
{
  assert.ok(aktionen.has("admin_lage") && aufrufe.has("admin_lage"), "admin_lage fehlt");
  assert.ok(/case "admin_lage": \{\s*nurAdmin\(ich\);/.test(server), "Admin-Lage ohne Rechteprüfung");
  assert.ok(/const ADMIN_PROGRAMME: /.test(server) && /id: "kc-pc-manager"/.test(server) && /id: "kc-dp2"/.test(server) && /from\("kicc_program_heartbeats"\)/.test(server), "Programme nicht über Registry/Lebenszeichen");
  assert.ok(/id: "admin", [^\n]*nur: \(\) => !!ICH\?\.admin/.test(html) && /INFO_FELDER = INFO_ALLE\.filter\(\(f\) => !f\.nur \|\| f\.nur\(\)\)/.test(html), "Admin-Karte nicht auf Admin beschränkt");
  const src = html.slice(html.indexOf("const ADMIN_LAEUFT_MIN"), html.indexOf("function adminBalken"));
  const farbe = new Function(src + "return adminProgrammFarbe;")();
  const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
  assert.equal(farbe({ letzte: null })[0], "grau"); assert.equal(farbe({ letzte: vor(5), status: "ok" })[0], "gruen");
  assert.equal(farbe({ letzte: vor(3 * 1440) })[0], "gelb"); assert.equal(farbe({ letzte: vor(30 * 1440) })[0], "grau", "uraltes Lebenszeichen als OK");
  assert.ok(/kc_club_db_groesse/.test(lies("supabase/migrations/20260929_kc_club_v47_db_groesse.sql")) && /revoke all on function kc_club_db_groesse\(\) from public, anon, authenticated/.test(lies("supabase/migrations/20260929_kc_club_v47_db_groesse.sql")), "DB-Größe-Funktion offen");
}

// 71. 0.48.0: Admin – Neon-Spiegel und Backup (nur lesen); pausiert nie grün, altes Backup rot
{
  const sp = server.slice(server.indexOf("async function adminSpiegel"), server.indexOf("// ---------- Anmeldung ----------"));
  assert.ok(/from\("kc_db_mirror_policies"\)/.test(sp) && /from\("kc_neon_compute_policy"\)/.test(sp) && !/\.(update|insert|delete|upsert)\(/.test(sp), "Spiegel-Prüfung liest nicht nur");
  const src = html.slice(html.indexOf("const BACKUP_OK_STD"), html.indexOf("function adminBalken"));
  const f = new Function("seitText", "fKurz", src + "return adminSpiegelFarben;")(() => "vor …", { format: () => "20.09." });
  const vor = (std) => new Date(Date.now() - std * 3600000).toISOString();
  const pausiert = f({ neon: { aktiv: false, lagSek: 720, letzter: vor(200), regeln: [] }, backup: { aktiv: false, letztes: vor(200) }, pause: { zeit: vor(220), text: "x" }, compute: { modus: "maintenance", bis: new Date(Date.now() + 86400000).toISOString() } });
  assert.equal(pausiert.neon[0], "gelb", "pausierter Spiegel nicht gelb"); assert.ok(/pausiert/.test(pausiert.neon[1]) && /Wartung bis/.test(pausiert.neon[1]));
  assert.equal(pausiert.backup[0], "rot", "Backup vor 8 Tagen nicht rot");
  const gut = f({ neon: { aktiv: true, lagSek: 720, letzter: vor(0.05), regeln: [] }, backup: { aktiv: true, letztes: vor(3) }, pause: null, compute: null });
  assert.equal(gut.neon[0], "gruen"); assert.equal(gut.backup[0], "gruen");
  assert.equal(f({ neon: { aktiv: true, lagSek: 720, letzter: vor(5), regeln: [] }, backup: { aktiv: true, letztes: null } }).neon[0], "rot", "hängender Spiegel nicht rot");
  assert.equal(f(null).neon[0], "grau", "unbekannt nicht grau");
  for (const k of ["neon", "backup", "abdeckung", "watchdog"]) assert.equal(f(null)[k]?.[0], "grau", `Spiegel unbekannt: ${k} fehlt/nicht grau (Absturz der Admin-Karte)`);
  // 0.49.0: Sparmodus alle 6 Std. – 3 Std. alt ist aktuell, 9 Std. verzögert, 20 Std. hängt
  const spar = (std) => f({ neon: { aktiv: true, lagSek: 23400, letzter: vor(std), regeln: [] }, backup: { aktiv: true, letztes: vor(3) } }).neon[0];
  assert.equal(spar(3), "gruen"); assert.equal(spar(9), "gelb"); assert.equal(spar(20), "rot");
  assert.ok(aktionen.has("admin_spiegeln") && aufrufe.has("admin_spiegeln") && /case "admin_spiegeln": \{\s*nurAdmin\(ich\);/.test(server), "Notfall-Spiegel fehlt oder ungeschützt");
  assert.ok(/async function adminSpiegeln\(\) \{\s*if \(!confirm\(/.test(html), "Notfall-Spiegel ohne Rückfrage");
  // 0.50.0: Abdeckung (Tabellen ohne Regel) und Watchdog – fehlende Tabellen nie grün, stummer Watchdog grau
  const basis = { neon: { aktiv: true, lagSek: 23400, letzter: vor(1), regeln: [] }, backup: { aktiv: true, letztes: vor(3) } };
  assert.equal(f({ ...basis, abdeckung: { tabellen: 195, ohne: 118, liste: [] } }).abdeckung[0], "gelb", "fehlende Tabellen nicht gemeldet");
  assert.equal(f({ ...basis, abdeckung: { tabellen: 195, ohne: 0, liste: [] } }).abdeckung[0], "gruen");
  assert.equal(f({ ...basis, watchdog: { zeit: vor(5), status: "ok" } }).watchdog[0], "grau", "Watchdog ohne Meldung seit 5 Std. nicht grau");
  assert.equal(f({ ...basis, watchdog: { zeit: vor(0.2), status: "ok" } }).watchdog[0], "gruen");
  assert.ok(/db\.rpc\("kc_db_mirror_abdeckung"\)/.test(server) && /kc_db_mirror_abdeckung_check/.test(lies("supabase/migrations/20260929_kc_core_mirror_sparmodus_abdeckung.sql")), "Abdeckungs-Prüfung fehlt");
}

// 72. 0.51.0: Kochmütze auch bei „stillen“ Abfragen, wenn das Mitglied selbst etwas antippt (Hintergrund bleibt still)
{
  assert.ok(/function wartenStart\(action, erzwingen\) \{\s*if \(WARTEN_STILL\.has\(action\) && !erzwingen\) return false;/.test(html), "Erzwingen der Kochmütze fehlt");
  assert.ok(/async function api\(action, daten = \{\}, opt = \{\}\) \{\s*const warte = wartenStart\(action, opt\.warten\);/.test(html), "api reicht warten nicht durch");
  assert.ok(/api\("init", \{\}, \{ warten: !!vonHand \}\)/.test(html), "Aktualisieren ohne Kochmütze");
  assert.ok(/api\("wetter", \{\}, \{ warten: !!sichtbar \}\)/.test(html) && /wetterLaden\(erzwingen\)/.test(html), "Wetter ohne Kochmütze");
  assert.ok(/infoDatenLaden\(f, erzwingen\)/.test(html) && /const warte = sichtbar && wartenStart\(f\.id, true\)/.test(html) && /finally \{ if \(warte\) wartenEnde\(\); \}/.test(html), "Info-Karten ohne Kochmütze");
  assert.ok(/infoDatenLaden\(INFO_FELDER\[INFO_I\], true\)/.test(html), "Admin „Neu prüfen“ ohne Kochmütze");
  for (const a of ["pinnwand", "unterhaltungen", "kalender"]) assert.ok(new RegExp(`api\\("${a}"[^)]*\\{ warten: true \\}\\)`).test(html), `${a}: Öffnen ohne Kochmütze`);
  // Hintergrund-Takt bleibt still: online-Ping ohne warten
  assert.ok(/const r = await api\("online"\);/.test(html), "Online-Takt zeigt Kochmütze");
  for (const k of ["init", "wetter", "admin_lage", "admin", "fotos", "demnaechst"]) assert.ok(new RegExp(`\\b${k}: "`).test(html.slice(html.indexOf("const WARTEN_TEXT"), html.indexOf("let wartenZahl"))), `Warte-Text für ${k} fehlt`);
}

// 73. 0.52.0: To-do – mehrere Zuständige (sehen, abhaken, Bescheid nur an neu Hinzugekommene), Auswahl per Häkchen
{
  assert.ok(/zustaendige\.cs\.\{\$\{ich\.person_id\}\}/.test(server), "Mit-Zuständige sehen die Aufgabe nicht");
  const er = server.slice(server.indexOf('case "todo_erledigt"'), server.indexOf('case "todo_zuweisen"'));
  assert.ok(/\(t\.zustaendige \?\? \[\]\)\.includes\(ich\.person_id\)/.test(er), "Mit-Zuständige können nicht abhaken");
  const zw = server.slice(server.indexOf('case "todo_zuweisen"'), server.indexOf('case "todo_loeschen"'));
  assert.ok(/const neu = zustaendige\.filter\(\(id\) => id !== ich\.person_id && !vorher\.includes\(id\)\)/.test(zw), "Bescheid geht auch an bisherige Zuständige");
  assert.ok(/zustaendig: zustaendige\[0\] \?\? null, zustaendige/.test(zw) && /t\.person_id !== ich\.person_id && !ich\.vorstand\) throw/.test(zw), "altes Feld nicht mitgeschrieben / Rechte");
  const src = server.slice(server.indexOf("const TODO_MAX_ZUSTAENDIGE"), server.indexOf("async function todoBenachrichtigen"));
  assert.ok(/\[\.\.\.new Set\(roh\)\]\.slice\(0, TODO_MAX_ZUSTAENDIGE\)/.test(src) && /ids\.some\(\(id\) => !aktiv\.has\(id\)\)/.test(src), "Zuständige nicht geprüft/begrenzt");
  assert.ok(/id="personenBlatt"/.test(html) && /async function todoZuweisen\(id\) \{ return todoWerWaehlen\(id\); \}/.test(html) && /function todoWerWaehlen\(id\)[\s\S]{0,600}personenWaehlen\(/.test(html) && !/Nummer eingeben/.test(html), "Auswahl per Häkchen fehlt");
  assert.ok(/zust\(x\)\.some\(\(z\) => z\.ich\)/.test(html), "Filter „Mir“ kennt nur einen Zuständigen");
  assert.ok(/zustaendige text\[\]/.test(lies("supabase/migrations/20260929_kc_club_v52_todo_mehrere.sql")), "Migration fehlt");
}

// 74. 0.53.0: Drucken (Kalender Tag/Woche/Monat/Jahr, To-do, Teilnehmerliste, Protokoll, Erstattung) + Protokoll-Aufgaben für mehrere
{
  for (const art of ["termine", "treffen", "protokoll", "erstattung"]) assert.ok(new RegExp(`\\b${art}: \\{[^\\n]*bauen:`).test(html), `Druckart ${art} fehlt`);
  for (const id of ["druckTermine", "druckProtokoll", "druckErstattung"]) assert.ok(new RegExp(`class="druckknopf"[^>]*id="${id}"`).test(html), `Druckknopf ${id} fehlt`);
  assert.ok(/druckKnopf\(`druckStarten\('treffen','\$\{t\.id\}'\)`, "klein"\)/.test(html), "Druckknopf an der Treffen-Karte fehlt");
  assert.ok(/button\.druckknopf:empty"\)\.forEach\(\(b\) => \(b\.innerHTML = DRUCK_ICON\)\)/.test(html), "feste Druckknöpfe ohne Symbol");
  assert.ok(/id="druckBlatt"/.test(html) && /<\/nav>\n<\/div>\n<!--[^\n]*-->\n<div id="druck"><\/div>\n\n<script>/.test(html), "Druckfenster/Druckseite fehlt");
  const pr = html.slice(html.indexOf("@media print {"), html.indexOf("@media print {") + 800);
  assert.ok(/body > \*:not\(#druck\) \{ display: none !important; \}/.test(pr) && /#druck \{ display: block !important;/.test(pr), "Druck zeigt die App statt der Druckseite");
  assert.ok(/#druck \{ display: none; \}/.test(html), "Druckseite am Bildschirm sichtbar");
  // 0.61.0 (Wunsch Hansi): ohne Auswahl direkt die Vorschau – gedruckt wird erst dort
  assert.ok(/if \(!d\.optionen\) return druckVorschau\(\);/.test(html), "ohne Auswahl sollte direkt die Vorschau kommen");
  // Zeiträume des Kalenderdrucks
  const zeitraum = html.slice(html.indexOf("async function druckKalender(o)"), html.indexOf("const daten = await kalenderDaten(von, bis);"));
  const f = new Function("tagPlus", "montag", "kwVon", "dz", "fTagLang", "MONATE", "o", zeitraum.replace("async function druckKalender(o) {", "") + " return { von, bis, titel };");
  const tagPlus = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const montag = (iso) => tagPlus(iso, -((new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7));
  const M = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const r = (art, datum) => f(tagPlus, montag, () => 1, (x) => x, { format: () => "" }, M, { art, datum, inhalte: ["treffen"] });
  assert.deepEqual([r("tag", "2026-10-07").von, r("tag", "2026-10-07").bis], ["2026-10-07", "2026-10-07"]);
  assert.deepEqual([r("woche", "2026-10-07").von, r("woche", "2026-10-07").bis], ["2026-10-05", "2026-10-11"]);
  assert.deepEqual([r("monat", "2026-02-10").von, r("monat", "2026-02-10").bis], ["2026-02-01", "2026-02-28"]);
  assert.deepEqual([r("monat", "2026-12-24").von, r("monat", "2026-12-24").bis], ["2026-12-01", "2026-12-31"]);
  assert.deepEqual([r("jahr", "2026-05-01").von, r("jahr", "2026-05-01").bis], ["2026-01-01", "2026-12-31"]);
  assert.ok(/function kalEintraege\(tag, Q = KAL, mitFeiertagen = einst\("feiertage", true\)\)/.test(html) && !/KAL\.treffen\) \{/.test(html.slice(html.indexOf("function kalEintraege"), html.indexOf("function kalZeichnen"))), "kalEintraege nutzt nicht die übergebene Quelle");
  assert.ok(/antraege: r\.antraege \|\| \[\]/.test(html), "gesendete Anträge nicht druckbar");
  // Server: Anträge mit Positionen; Aufgaben für mehrere mit gemeinsamer Gruppe
  assert.ok(/positionen: a\.positionen \|\| \[\], bemerkung: a\.bemerkung \?\? null/.test(server), "Antrags-Positionen fehlen");
  const auf = server.slice(server.indexOf('case "aufgabe_speichern"'), server.indexOf('case "aufgabe_erledigt"'));
  assert.ok(/p\.person_ids/.test(auf) && /\.slice\(0, 10\)/.test(auf) && /personen_\.some\(\(x\) => !aktiv\.has\(x\)\)/.test(auf), "Personen nicht geprüft/begrenzt");
  assert.ok(/const gruppe = personen_\.length > 1 \? crypto\.randomUUID\(\) : null;/.test(auf) && /insert\(personen_\.map\(/.test(auf), "keine gemeinsame Gruppe");
  assert.ok(/gruppe: a\.gruppe \?\? null/.test(server), "Gruppe wird nicht geliefert");
  assert.ok(/person_ids: AUF_WER/.test(html) && /id="aufWer"/.test(html), "Protokoll-Aufgabe: Mehrfachauswahl fehlt");
  assert.ok(/gruppe uuid/.test(lies("supabase/migrations/20260929_kc_club_v53_aufgaben_gruppe.sql")), "Migration v53 fehlt");
}

// 75. KC-SPIEGEL-ALLE (29.09.2026, ohne App-Build): alle Tabellen mit Spiegel-Regel, Geheimnis-Spalten geschwärzt, Pakete statt fester Listen
{
  const m = lies("supabase/migrations/20260929_kc_core_mirror_alle_tabellen.sql"), n = lies("supabase/neon/20260929_neon_spiegel_alle_tabellen.sql");
  assert.ok(/create table if not exists public\.kc_db_mirror_redaction/.test(m) && /enable row level security/.test(m), "Schwärzungs-Registry fehlt");
  for (const [t, c] of [["kc_external_credentials", "secret"], ["kc_dp_sync_keys", "key_material"], ["kc_communication_push_devices", "auth_key"], ["kc_member_push_subscriptions", "subscription"]])
    assert.ok(m.includes(`('${t}', '${c}'`), `Geheimnis ${t}.${c} nicht geschwärzt`);
  assert.ok(/format\('null::%s as %I'/.test(m), "Schwärzung nicht typgleich (Prüfsumme)");
  assert.ok(!/v_tables\[51:75\]/.test(m) && /c_max_tabellen constant int := 25/.test(m) && / z record;/.test(m), "Takt noch mit fester 75er-Grenze / Variablenkonflikt");
  assert.ok(!/'expected_total',36/.test(m) && /'expected_total',v_total/.test(m), "Backup noch mit fester 36er-Liste");
  assert.equal((n.match(/^create table if not exists/gm) || []).length, 117, "Neon-Zieltabellen unvollständig");
  assert.ok(!/drop |delete from|truncate/i.test(n), "Neon-Skript darf nur anlegen");
  const c = lies("supabase/migrations/20260929_kc_core_mirror_hash_collate_c.sql");
  assert.equal((c.match(/collate "C"\)/g) || []).length, 10, "Prüfsumme noch abhängig von der Sortierregel");
  assert.ok(/kc_communication_health_snapshots/.test(lies("supabase/migrations/20260929_kc_core_mirror_messwerte_ausnahme.sql")), "Ausnahme Messwerte fehlt");
  assert.ok(/kc-neon-backup-verify', '15 0 \* \* \*'/.test(lies("supabase/migrations/20260929_kc_core_backup_spaltenreihenfolge.sql")), "Restore-Test nach dem Backup nicht eingeplant");
}

// 76. 0.54.0: „schreibt …“ (KC-CLUB-TIPPT) und Neon-Füllstand (KC-CLUB-NEON-GROESSE)
{
  const ti = server.slice(server.indexOf('case "tippen"'), server.indexOf('case "nachricht_senden"'));
  assert.ok(/await binTeilnehmer\(id, ich\.person_id\)/.test(ti) && /TIPPT_SEK \* 1000/.test(ti) && /p\.aus/.test(ti), "tippen: Teilnehmer-Prüfung/Ablauf fehlt");
  assert.ok(/\.neq\("person_id", ich\.person_id\)\.gt\("bis", jetzt\(\)\)/.test(server) && /betreff: t\?\.subject \?\? "", tippt,/.test(server), "unterhaltung liefert tippt nicht (oder mich selbst)");
  assert.ok(/kc_club_tippen"\)\.delete\(\)\.eq\("thread_id", threadId\)/.test(server), "Senden beendet „schreibt …“ nicht");
  assert.ok(/if \(!chatId \|\| !ONL\.zeigen\) return;/.test(html) && /abstand = live \? 1000 : 3000/.test(html) && /Date\.now\(\) - TIPP\.zuletzt < abstand/.test(html), "Tipp-Meldung ohne Privatsphäre/Drosselung");
  assert.ok(/tippenMelden\(\)"><\/textarea>/.test(html) && /id="tipptAnzeige"/.test(html) && /"tippen"(, "[a-z_]+")*\]\);/.test(html), "Anzeige/Eingabe/WARTEN_STILL fehlt");
  assert.ok(/tipptZeigen\(u\.tippt \|\| \[\], u\.entwurf \|\| \[\]\);\n    if \(u\.tippt\?\.length && andere\.length === 1\)[^\n]*\n    const stand = /.test(html), "Anzeige muss vor dem frühen Ausstieg aktualisiert werden");
  assert.ok(/if \(chatTakt\.laeuft\) return;/.test(html) && !/setInterval\(chatTakt, 4000\)/.test(html), "Chat-Takt überlappt / alter Takt");
  assert.ok(/if \(v !== "chat" && TIPP\.id\) tippenAus\(\);/.test(html), "Verlassen beendet „schreibt …“ nicht");
  assert.ok(/mirror_enabled, backup_enabled, note, updated_at\)\nvalues \('kc_club_tippen', 'Club-App', 'sensitive', false, false, false/.test(lies("supabase/migrations/20260929_kc_club_v54_tippen.sql")), "Spiegel-Regel für kc_club_tippen fehlt");
  // Neon-Größe
  assert.ok(/eq\("run_type", "neon_groesse"\)\.eq\("status", "ok"\)/.test(server) && /groesse: ng \? \{ bytes:/.test(server) && /const NEON_GRENZE = 512 \* 1024 \* 1024;/.test(server), "Server liefert Neon-Größe nicht");
  const w = lies("supabase/functions/kc-db-mirror-worker/index.ts");
  assert.ok(/if\(neon\)\{try\{/.test(w) && /pg_database_size\(current_database\(\)\)/.test(w) && /30\*60000/.test(w), "Worker misst Neon-Größe nicht (nur bei offener Verbindung, gedrosselt)");
  assert.ok(/adminBalken\("🪞 Neon-Spiegel", r\.spiegel\?\.groesse\?\.bytes \?\? null/.test(html) && /alt \? "grau"/.test(html) && /⚠️ veraltet/.test(html), "Neon-Balken/Veraltet-Markierung fehlt");
}

// 77. 0.55.0: Netzart beim Verbindungstest (KC-CLUB-NETZART) + Neon-Neuaufbau PC-Manager
{
  assert.ok(/const NETZARTEN = \{ wlan: "📶 WLAN", mobil: "📱 Mobilfunk", unbekannt: "❔ weiß nicht" \};/.test(html), "Netzarten-Registry fehlt");
  assert.ok(/t === "wifi" \|\| t === "ethernet" \? "wlan" : t === "cellular" \? "mobil" : null/.test(html), "Erkennung Netzart fehlt");
  assert.ok(/name="vbNetz"/.test(html) && /onchange="vbNetzWahl\('\$\{k\}'\)"/.test(html), "Auswahl im Verbindungsblatt fehlt");
  assert.ok(/vbVerlaufMerken\(\{ zeit: VB\.test\.zeit, netz: VB\.test\.netz/.test(html) && /api\("diagnose", \{ art: "verbindung"/.test(html), "Ergebnis wird nicht gemerkt/gemeldet");
  assert.ok(/Tempo-Klasse \$\{esc\(String\(c\.effectiveType\)/.test(html) && !/`\$\{c\?\.effectiveType \? ` · \$\{esc\(String\(c\.effectiveType\)\.toUpperCase\(\)\)\}` : ""\}/.test(html), "„4G“ wird noch als Netzart ausgegeben");
  assert.ok(/try \{ localStorage\.setItem\("kc_club_vbtests"/.test(html), "Verlauf ohne try/catch");
  const nb = lies("supabase/neon/20260929_neon_pcmanager_spaltenreihenfolge.sql");
  assert.ok(nb.indexOf("rename to kc_manager_serving_materials_alt") < nb.indexOf("drop table public.kc_manager_serving_materials_alt"), "Neuaufbau ohne Rückfallpunkt");
}

// 78. 0.56.0: Anmelde-Zwischenspeicher (KC-CLUB-ANMELDECACHE) + freiwilliges Live-Tippen (KC-CLUB-LIVETIPPEN)
{
  const an = server.slice(server.indexOf("const ANMELDUNG_CACHE_MS"), server.indexOf("// „vorstand“ ist intern"));
  assert.ok(/const ANMELDUNG_CACHE_MS = 60_000, ZULETZT_TAKT_MS = 30_000/.test(an) && /ANMELDUNGEN\.get\(hash\)/.test(an) && !/ANMELDUNGEN\.(get|set)\(token/.test(an), "Speicher nicht über den Token-Hash");
  assert.ok(/c\.bis > jetztMs/.test(an) && /return \{ \.\.\.c\.ich, aemter: \[\.\.\.c\.ich\.aemter\] \}/.test(an), "abgelaufene Einträge / geteiltes Objekt");
  assert.ok(/db\.rpc\("kc_club_anmeldung", \{ p_hash: hash, p_version: version \}\)/.test(an) && /if \(!a\) throw new Fehler\("Kein Zugang/.test(an) && /if \(!p\?\.active\) throw/.test(an), "Datenbank-Prüfung beim Nachladen fehlt");
  const rpc = lies("supabase/migrations/20260929_kc_club_v57_anmeldung_rpc.sql");
  assert.ok(/where token_hash = p_hash and aktiv/.test(rpc) && /revoke all on function public\.kc_club_anmeldung\(text, text\) from public, anon, authenticated;/.test(rpc), "Anmelde-RPC prüft nicht aktiv / ist öffentlich");
  assert.equal((server.match(/anmeldungenVergessen\(\);/g) || []).length, 3, "Zugang/Rollen ändern leert den Speicher nicht");
  assert.ok(/serverMs: Date\.now\(\) - t0Anfrage/.test(server) && /Server gesamt \$\{t\.srv\} ms/.test(html), "Server-Zeit im Verbindungstest fehlt");
  // Live-Tippen
  assert.ok(/live_tippen: \(w\) => \(\{ an: w\?\.an === true \}\)/.test(server), "Einstellung nicht standardmäßig aus");
  const ti = server.slice(server.indexOf('case "tippen"'), server.indexOf('case "nachricht_senden"'));
  assert.ok(/eq\("schluessel", "live_tippen"\)/.test(ti) && /e\?\.wert\?\.an === true\) text = /.test(ti) && /slice\(-LIVE_TIPPEN_ZEICHEN\)/.test(ti), "Server speichert Entwurf ohne Zustimmung/Begrenzung");
  assert.ok(/entwurf = \(tippen \?\? \[\]\)\.filter\(\(x: any\) => x\.text\)/.test(server) && /tippt, entwurf,/.test(server), "Entwurf wird nicht geliefert");
  assert.ok(/\.\.\.\(live \? \{ text:/.test(html) && /id="setLiveTippen"/.test(html) && /id="liveHinweis"/.test(html), "App: Entwurf nur bei eingeschaltetem Live-Tippen / Hinweis fehlt");
  assert.ok(/'\*\/5 \* \* \* \*', \$\$delete from public\.kc_club_tippen where bis < now\(\)\$\$/.test(lies("supabase/migrations/20260929_kc_club_v56_live_tippen.sql")), "Entwürfe bleiben zu lange liegen");
}

// 79. 0.57.0: Pinnwand live + Push (KC-CLUB-PINNWAND-LIVE)
{
  const neu = server.slice(server.indexOf('case "pinnwand_neu"'), server.indexOf('case "pinnwand_gesehen"'));
  assert.ok(neu.length > 50 && !/pinnwand_gelesen"\)\.upsert/.test(neu) && !/\.insert\(|\.update\(/.test(neu), "Live-Abfrage darf nichts als gesehen markieren");
  assert.ok(/const pinnwandPrivat = \(z: \{ fuer: string; personen\?: string\[\] \| null \}\) => z\.fuer === "personen" && \(z\.personen \?\? \[\]\)\.length === 1;/.test(server), "„privat“ nur bei genau einem Empfänger");
  const h = new Function("von", "privat", "wichtig", "return `Du hast ein neues ${wichtig ? \"wichtiges \" : \"\"}${privat ? \"privates \" : \"\"}Post-it von ${von} bekommen`;");
  assert.ok(server.includes("`Du hast ein neues ${wichtig ? \"wichtiges \" : \"\"}${privat ? \"privates \" : \"\"}Post-it von ${von} bekommen`"), "Hinweistext geändert");
  assert.equal(h("Klaus", true, false), "Du hast ein neues privates Post-it von Klaus bekommen");
  assert.equal(h("Klaus", false, false), "Du hast ein neues Post-it von Klaus bekommen");
  const an = server.slice(server.indexOf('case "pinnwand_anheften"'), server.indexOf('case "pinnwand_neu"'));
  assert.ok(/senden\("club_pinnwand", an,/.test(an) && /club-pinnwand:\$\{z\.id\}/.test(an) && /not\("zuletzt_gesehen", "is", null\)/.test(an), "Push beim Anheften fehlt / auch an Mitglieder ohne App");
  assert.ok(/club_pinnwand: "pinnwand"/.test(server) && /"geburtstage", "pinnwand"\]/.test(server) && /pinnwand: \{ push: true, email: false \}/.test(server), "Bereich Pinnwand fehlt");
  const mig = lies("supabase/migrations/20260929_kc_club_v58_pinnwand_push.sql");
  assert.ok(/'club_pinnwand','Club-App – Pinnwand \(nur Push\)', array\['push'\]/.test(mig) && /'pinnwand'\]\)\);/.test(mig), "Regeln/Bereich in der Datenbank fehlen");
  assert.ok(/setInterval\(pwLive, PW_LIVE_MS\)/.test(html) && /api\("pinnwand_neu"\)/.test(html) && /"pinnwand_neu"(, "[a-z_]+")*\]\);/.test(html) && /\["pinnwand", "📌 Neue Post-its an der Pinnwand"\]/.test(html), "App: Live-Abfrage/Einstellung fehlt");
  assert.ok(/else if \(h === "#pinnwand"\) zeige\("pinnwand"\);/.test(html), "Push-Sprung zur Pinnwand fehlt");
}

// 80. 0.58.0: Zettel geht direkt als Post-it-Fenster auf (KC-CLUB-PINNWAND-DIREKT)
{
  const g = server.slice(server.indexOf('case "pinnwand_gesehen"'), server.indexOf('case "pinnwand_erledigt"'));
  assert.ok(/pinnwandSichtbar\(ich\)\)\.filter\(\(x: any\) => ids\.has\(x\.id\) && x\.person_id !== ich\.person_id\)/.test(g) && /\.slice\(0, 20\)/.test(g), "gesehen nur für sichtbare fremde Zettel");
  assert.ok(/text: z\.text, zeit: z\.erstellt_am/.test(server), "pinnwand_neu liefert den Text nicht");
  assert.ok(/function pwFenster\(neu\)/.test(html) && /pwFenster\(neu\);/.test(html) && !/pwBanner/.test(html), "Fenster statt Banner fehlt");
  assert.ok(/api\("pinnwand_gesehen", \{ ids: liste\.map\(\(z\) => z\.id\) \}\)/.test(html) && /\$\{esc\(z\.text \|\| ""\)\}/.test(html), "Gelesen/Text im Fenster fehlt");
  const st = html.slice(html.indexOf("async function pwStart("), html.indexOf("async function pwStart(") + 900);
  assert.ok(st.indexOf('api("pinnwand_neu")') > 0 && st.indexOf('api("pinnwand_neu")') < st.indexOf('api("pinnwand")'), "App-Start zeigt neue Zettel nicht vor dem Markieren");
}

// 81. 0.59.0: Dienstwünsche mit Twinkey aus DP2 – unverändert (KC-CLUB-DIENSTWUNSCH)
{
  const { createHash } = await import("node:crypto");
  const q = JSON.parse(lies("dp2/QUELLE.json"));
  assert.ok(q.repository === "Sire65/dp3" && /^[0-9a-f]{40}$/.test(q.commit) && q.dp2Version, "Herkunft der DP2-Dateien fehlt");
  const dateien = Object.entries(q.dateien);
  assert.ok(dateien.length > 50 && q.reihenfolge.every((f) => q.dateien[f]), "Dateiliste unvollständig");
  for (const [f, h] of dateien) assert.equal(createHash("sha256").update(fs.readFileSync(new URL("../dp2/" + f, import.meta.url))).digest("hex"), h, `DP2-Datei verändert: ${f}`);
  assert.ok(!q.reihenfolge.some((f) => /twinkey-test-(data|boot)\.js$/.test(f)), "DP2-Beispieldaten dürfen nicht geladen werden");
  const seite = lies("dienstwunsch.html"), lader = lies("dp2-club/lader.js"), daten = lies("dp2-club/daten.js");
  assert.ok(/<base href="dp2\/">/.test(seite) && /script-src 'self';/.test(seite) && !/<script>/.test(seite) && /id="kcdpUxRoot"/.test(seite), "Seite: Basis/CSP/Wurzel fehlt");
  assert.ok(/if \(f === "src\/core\/model\.js"\) reihe\.push\("\.\.\/dp2-club\/daten\.js/.test(lader) && /if \(f === "src\/ui\/original-brand\.js"\) reihe\.push\("\.\.\/dp2-club\/start\.js/.test(lader), "Ladereihenfolge wie DP2 fehlt");
  assert.ok(/APP_VERSION = "([^"]+)"/.exec(lader)[1] === appV && seite.includes(`lader.js?v=${appV}`), "Lader-Version passt nicht");
  assert.ok(/K\.persistAll = async/.test(daten) && /KC_CLUB_DW_API\("dienstwunsch_speichern", s\)/.test(daten) && /if \(j === zuletzt\) return true;/.test(daten), "Speichern nur bei Änderung fehlt");
  assert.ok(/completedSignature/.test(daten) && /vorlagen\.has\(kanon\(x\)\)/.test(daten), "Twinkey-Tagesstatus geht beim Neuladen verloren");
  const sp = server.slice(server.indexOf('case "dienstwunsch_speichern"'), server.indexOf('return json({ ok: true, revision: r.data.revision'));
  assert.ok(/if \(phase\?\.status !== "open"\) throw new Fehler\([^)]*409\)/.test(sp), "Speichern bei geschlossener Wunschphase möglich");
  assert.ok(/DW\.typen\.includes\(e\.wishType\)/.test(sp) && /!\(e\.end > e\.start\)/.test(sp) && /e\.scope === "day" && e\.wishType !== "unavailable"/.test(sp) && /DW\.maxEintraege/.test(sp), "Prüfung der Einträge fehlt");
  assert.ok(/source: "club_app", status: "offen"/.test(sp) && /revision: alt\.revision \+ 1/.test(sp) && /protokoll\(ich\.person_id, "dienstwunsch_gespeichert"/.test(sp), "Eingang/Revision/Protokoll fehlt");
  assert.ok(/typen: \["available", "preferred", "if_needed", "unavailable"\]/.test(server), "Wunscharten nicht wie DP2");
  const mig = lies("supabase/migrations/20260929_kc_dp_wunsch_eingang_v1.sql");
  assert.ok(/kc_dp_wish_inbox_ack/.test(mig) && /kc_dp_days_publish/.test(mig) && /'KC_CLUBAPP'/.test(mig), "Datenbankvertrag fehlt");
  assert.ok(/\{ id: "dienstwunsch", sym: "📝", t: "Dienstwünsche"[^}]*aktion: "dwOeffnen\(\)" \}/.test(html) && /src="dienstwunsch\.html\?v=\$\{APP_VERSION\}"/.test(html), "Kachel/Fenster fehlt");
  assert.ok(/if \(e\.origin !== location\.origin/.test(html) && /e\.data === "dienstwunsch-zu"/.test(html) && /else if \(h === "#dienstwunsch"\) dwOeffnen\(\);/.test(html), "Nachrichten aus dem Fenster ungeprüft / Sprung fehlt");
}

// 82. 0.60.0: Post-it antworten, 4 Farben, farbige Namenskreise (KC-CLUB-PINNWAND-ANTWORT / -FARBEN / KC-CLUB-KREISE)
{
  const an = server.slice(server.indexOf('case "pinnwand_anheften"'), server.indexOf('case "pinnwand_neu"'));
  assert.ok(/const farbe = \[1, 2, 3, 4\]\.find\(\(n\) => !belegt\.has\(n\)\)/.test(an) && /personen: empf, farbe \}/.test(an) && /23505/.test(an), "Feste Farbe / kleinste freie fehlt");
  const mig = lies("supabase/migrations/20260929_kc_club_v60_pinnwand_farben.sql");
  assert.ok(/check \(farbe between 1 and 4\)/.test(mig) && /unique index if not exists kc_club_pinnwand_farbe_frei on public\.kc_club_pinnwand \(person_id, farbe\) where entfernt_am is null/.test(mig), "Datenbank schützt Farben nicht");
  assert.ok(/add column if not exists farbe smallint/.test(lies("supabase/neon/20260929_neon_pinnwand_farbe.sql")), "Neon-Spiegelspalte fehlt");
  assert.ok(/\.zettel\.f1 \{ background: #fff27a; \} \.zettel\.f2 \{ background: #ffb8d1; \} \.zettel\.f3 \{ background: #c6f2a2; \} \.zettel\.f4 \{ background: #aeddf7; \}/.test(html), "Post-it-Farben gelb/rosé/hellgrün/hellblau fehlen");
  assert.ok(/vonId: z\.person_id, farbe: z\.farbe \?\? 1/.test(server) && /data-antw=/.test(html) && /pwAntworten\(z\.id, z\.vonId, z\.von\)/.test(html), "Antworten im Post-it-Fenster fehlt");
  assert.ok(/if \(antwort\) \{ PW\.form\.personen = \[antwort\.personId\]; pwFuer\("personen"\); \}/.test(html) && /id="pwFuer"[\s\S]{0,200}data-f="alle"/.test(html), "Antwort: privat vorausgewählt / „für alle“ wählbar");
  assert.ok(/function pwVoll\(\)/.test(html) && /pwAbnehmen\('\$\{z\.id\}', true\)/.test(html), "Volle Plätze: Abnehmen im Formular fehlt");
  // Kreise: Registry, Rot nur Admin (Server liefert fehler nur im Admin-Zweig), Unbekannt nie OK
  assert.ok(/const KREIS_ARTEN = \[/.test(html) && /art: "fehler"[^\n]*nurAdmin: true, gilt: \(m\) => ICH\?\.admin && !!m\.fehler/.test(html), "Rot nicht auf Admin beschränkt");
  assert.ok(/\.\.\.\(ich\.admin \? \{[^\n]*fehler: fehler\.get\(m\.person_id\) \?\? null[,}]/.test(server) && /if \(ich\.admin\) \{[\s\S]{0,600}const \{ data: fx \}/.test(server), "Server gibt Fehler an Nicht-Admins");
  assert.ok(/verborgen: m\.person_id !== ich\.person_id && \(!ichZeige \|\| zeigen\.get\(m\.person_id\) === false\)/.test(server) && /heute: ichZeige && /.test(server), "Online-Privatsphäre bei heute/verborgen nicht beachtet");
  assert.ok(/\.avatar\.k-unbekannt \{ background: transparent;[^}]*dashed/.test(html) && /return k \|\| \{ art: "unbekannt"/.test(html), "Unbekannt wird nicht als unbekannt gezeigt");
  assert.ok((html.match(/[{:] ?kreis\((m|\{|MITGLIEDER)/g) || []).length >= 4 && /kreisLegende\(\) \+ (MITGLIEDER|liste)\.map/.test(html), "Kreise nicht in allen Listen / Legende fehlt");
}

// 83. 0.61.0: Druckvorschau vor jedem Ausdruck (KC-CLUB-DRUCKVORSCHAU)
{
  assert.ok(!/window\.print\(\)/.test(html.replace("function druckJetzt() { setTimeout(() => window.print(), 60); }", "")), "Gedruckt wird nur aus der Vorschau");
  assert.ok(/onclick="druckJetzt\(\)">🖨️ Drucken \/ als PDF<\/button>/.test(html) && /id="druckVorschau"/.test(html) && /id="druckVorschauRahmen"/.test(html), "Vorschau mit Druckknopf fehlt");
  assert.ok(/onclick="druckVorschau\(\)">👁️ Vorschau ansehen<\/button>/.test(html) && !/druckLos/.test(html), "Auswahlfenster druckt noch direkt");
  assert.ok(/rahmen\.srcdoc = druckHtml\(true\)/.test(html) && /const html = druckHtml\(false\);/.test(html), "Vorschau/Teilen nicht aus derselben Druckseite");
}

// 84. 0.62.0: einfache/erweiterte Ansicht + Kurzanleitung (KC-CLUB-ANSICHT / KC-CLUB-KURZANLEITUNG)
{
  assert.ok(/ansicht: \(w\) => \(\{ art: w\?\.art === "erweitert" \? "erweitert" : "einfach", gewaehlt: w\?\.gewaehlt === true/.test(server), "Server speichert die Ansicht nicht (Standard einfach)");
  assert.ok(/ansicht: ansicht\.get\(m\.person_id\) \?\? null \} : \{\}\)/.test(server), "Ansicht je Mitglied nur für den Admin");
  assert.ok(/const begruesst = ansichtPruefen\(\) \|\| begruessungPruefen\(\);/.test(html) && /INIT\?\.einstellungen\?\.ansicht\?\.gewaehlt\) return false/.test(html), "Frage beim Start fehlt / käme mehrfach");
  assert.ok(/id="ansichtBlatt" onclick="if\(event\.target===this\)ansichtSetzen\('einfach', true\)"/.test(html) && /Du kannst jederzeit umschalten/.test(html), "Überspringen = einfach / Umschalt-Hinweis fehlt");
  assert.ok(/const EINFACH_KACHELN = \["termine", "kommunikation", "pinnwand", "meindienst", "mitglieder"(, "dokumente")?(, "sos")?\];/.test(html) && /const kacheln = \(r\) => einfach\(\) \? einfachKacheln\(\) : kaSortiert/.test(html), "Einfache Startseite fehlt");
  const alle = [...html.matchAll(/\{ id: "([a-z]+)", sym:/g)].map((m) => m[1]);
  for (const id of ["termine", "kommunikation", "pinnwand", "meindienst", "mitglieder", "dokumente"]) assert.ok(alle.includes(id), `Kachel ${id} fehlt in der Registry`);
  assert.ok(/id="ansichtKnopf"[^>]*onclick="ansichtWechseln\(\)"/.test(html) && /onclick="ansichtSetzen\('einfach'\)"/.test(html) && /onclick="ansichtSetzen\('erweitert'\)"/.test(html), "Umschalter fehlt");
  assert.ok(/body\.einfach #v-einstellungen > details\[data-klappe\]:not\(\[data-einfach\]\) \{ display: none; \}/.test(html) && /data-klappe="install" data-einfach/.test(html), "Einstellungen der einfachen Ansicht");
  assert.ok(/function neuWahlSetzen\(art\)/.test(html) && /for \(const \[b\] of WAHL_BEREICHE\)/.test(html) && /CriOS\|FxiOS/.test(html), "Neuigkeiten-Frage / Safari-Hinweis fehlt");
  assert.ok(/const DIENSTWUNSCH_EINFACH = false;/.test(html), "Dienstwünsche erst nach DP2-Umbau in „Einfach“");
  assert.ok(/anleitung: \{ bauen: \(\) => druckAnleitung\(\) \}/.test(html) && /Köcheclub-App in 3 Schritten/.test(html) && /onclick="druckStarten\('anleitung'\)"/.test(html), "Kurzanleitung fehlt");
}

// 85. 0.63.0: Name/Zeit oben auf dem Zettel, Antworten sichtbar (KC-CLUB-PINNWAND-NAME)
{
  assert.ok(/const pwKopf = \(name, iso\) => `<div class="zkopf">von <b>/.test(html) && /angepinnt am \$\{fKurz\.format\(d\)\}/.test(html), "Kopfzeile „von … angepinnt am …“ fehlt");
  assert.ok(/pwKopf\(z\.vonMir \? ICH\?\.vorname \|\| "mir" : z\.von\.vorname, z\.erstellt_am\)/.test(html) && /\$\{pwKopf\(z\.von, z\.zeit\)\}/.test(html), "Name fehlt auf Wand oder im Fenster");
  const w = html.slice(html.indexOf("const knoepfe = [];"), html.indexOf("function pwForm("));
  assert.ok(w.indexOf("✍️ Antworten") > 0 && w.indexOf("✍️ Antworten") < w.indexOf("✓ erl."), "Antworten nicht als erster Knopf an fremden Zetteln");
  assert.ok(/\.zettel \.zknoepfe button\.antw \{ background: #741521; color: #fff;/.test(html), "Antworten-Knopf nicht hervorgehoben");
  assert.ok(/const PINNWAND_MAX = 4,/.test(server), "Grenze geändert");
}

// 86. 0.64.0: Erinnerung an eigene alte Zettel beim Öffnen (KC-CLUB-PINNWAND-ERINNERUNG)
{
  assert.ok(/pinnwand_erinnert: \(w\) => \(\{ bis: Object\.fromEntries/.test(server) && /\/\^\[0-9a-f-\]\{36\}\$\/\.test\(id\)/.test(server), "Server speichert „hängen lassen“ nicht geprüft");
  // 0.65.0: Fristen vom Admin (Server), ohne Wert 3 / 7 Tage
  assert.ok(/const PW_FRISTEN_STANDARD = \{ erinnernTage: 3, pauseTage: 7 \};/.test(html) && /if \(!gezeigt && !nurZaehlen && !pwErinnern\(\)( && !einstiegPruefen\(\)\) tippDesTages\(\);|\) einstiegPruefen\(\);)/.test(html), "Erinnerung beim Start fehlt");
  const e = html.slice(html.indexOf("function pwErinnern()"), html.indexOf("async function pwLaden()"));
  assert.ok(/z\.vonMir && jetzt - new Date\(z\.erstellt_am\)\.getTime\(\) >= PW_ERINNERN_TAGE \* 86400000/.test(e) && /bis\[z\.id\]/.test(e), "nur eigene, alte, nicht zurückgestellte Zettel");
  assert.ok(/hängt noch an der Pinnwand\./.test(e) && /Möchtest du \$\{liste\.length === 1 \? "es" : "sie"\} abnehmen\?/.test(e) && /api\("pinnwand_abnehmen"/.test(e), "Text/Abnehmen fehlt");
  assert.ok(/document\.querySelector\("\.blatt:not\(\.versteckt\)"\)\) return/.test(e), "Erinnerung könnte über anderen Fenstern aufgehen");
}

// 87. 0.65.0: Admin-Einstellungen als Klappbereich mit Schloss + Pinnwand-Fristen (KC-CLUB-ADMIN-EINSTELLUNGEN / -PINNWAND-FRISTEN)
{
  const bereich = html.slice(html.indexOf('id="adminBereich"'), html.indexOf('data-klappe="app"'));
  for (const k of ["admin_pinnwand", "admin_erstattung", "admin_wetter"]) assert.ok(bereich.includes(`data-klappe="${k}"`), `Admin-Klappbereich ${k} fehlt im Admin-Bereich`);
  assert.ok(/<details class="karte versteckt" data-klappe="admin" data-einfach id="adminBereich">/.test(html) && /\$\("adminBereich"\)\.classList\.remove\("versteckt"\)/.test(html), "Admin-Bereich (auch einfach, nur Admin) fehlt");
  assert.ok(/document\.querySelectorAll\("details\[data-klappe\]"\)/.test(html) && /details\.karte:not\(\[open\]\) > summary \.pfeil/.test(html), "Schloss/Pfeil je Bereich");
  const fs = server.slice(server.indexOf('case "pinnwand_fristen_setzen"'), server.indexOf('case "wetter_setzen"'));
  assert.ok(/nurAdmin\(ich\);/.test(fs) && /protokoll\(ich\.person_id, "pinnwand_fristen_gesetzt"/.test(fs) && /PINNWAND_FRISTEN_GRENZEN = \{ erinnernTage: \[1, 30\], pauseTage: \[1, 60\] \}/.test(server), "Fristen: nur Admin, Grenzen, Protokoll");
  assert.ok(/pinnwandFristen: pwFristen[,}]/.test(server) && /const pwFristen = \(\) => \(\{ \.\.\.PW_FRISTEN_STANDARD, \.\.\.\(INIT\?\.pinnwandFristen \|\| \{\}\) \}\);/.test(html), "Fristen kommen nicht vom Server");
}

// 88. 0.66.0: aktive Ansicht hinter „Schnellzugriff“ (KC-CLUB-ANSICHT-NAME)
{
  // 0.69.0: Ansichtsname ist ein Knopf und schaltet auf die andere Ansicht
  assert.ok(/<h3>Schnellzugriff <button type="button" class="ansichtname ein" onclick="ansichtWechseln\(\)"[^>]*>\(Einfache Ansicht\)<\/button><button type="button" class="ansichtname erw" onclick="ansichtWechseln\(\)"[^>]*>\(Erweiterte Ansicht\)<\/button><\/h3>/.test(html), "Ansichtsname fehlt / schaltet nicht um");
  assert.ok(/body\.einfach \.ansichtname\.erw, body:not\(\.einfach\) \.ansichtname\.ein \{ display: none; \}/.test(html), "zeigt nicht nur die aktive Ansicht");
}

// 89. 0.67.0: A/T/N am Tag/Nacht-Knopf (KC-CLUB-MODUS-ANZEIGE)
{
  assert.ok(/const MODUS_ZEICHEN = \{ auto: \["A", "Automatik"\], tag: \["T", "Immer Tag"\], nacht: \["N", "Immer Nacht"\] \}/.test(html) && /<span class="modusbuchstabe" aria-hidden="true">\$\{mz\[0\]\}<\/span>/.test(html), "A/T/N-Anzeige fehlt");
}

// 90. 0.68.0: Tag/Nacht-Knopf reihum A → T → N (KC-CLUB-MODUS-REIHUM)
{
  const code = html.slice(html.indexOf("const MODUS_REIHE"), html.indexOf("setInterval(() => { if (DS.modus === \"auto\")"));
  const gesetzt = [];
  const g = new Function("designSpeichern", "melde", "istNacht", "let DS = { modus: 'auto' };" + code + "; return { tipp: dunkelUmschalten, modus: () => DS.modus, setze: (m) => { DS = { modus: m }; } };")(() => gesetzt.push(1), () => {}, () => false);
  const folge = []; for (let i = 0; i < 4; i++) { g.tipp(); folge.push(g.modus()); }
  assert.deepEqual(folge, ["tag", "nacht", "auto", "tag"], "Reihenfolge A → T → N stimmt nicht");
  g.setze("unbekannt"); g.tipp(); assert.equal(g.modus(), "auto", "unbekannter Modus → Automatik");
  assert.equal(gesetzt.length, 5, "Einstellung wird nicht gespeichert");
}

// 91. 0.70.0: Tipps nach und nach statt vieler Fragen beim Einstieg (KC-CLUB-EINSTIEG)
{
  assert.ok(/einstieg: \(w\) => \(\{ schritte:/.test(server) && /\["farbe", "privat", "erweitert"(, "feedback")?(, "geraete")?\]\.includes\(k\)/.test(server) && /\["ja", "nein", "spaeter"\]\.includes/.test(server), "Server prüft die Einstiegs-Antworten nicht");
  // 0.71.0: Nutzungstage (verschiedene Tage mit App-Start, Europe/Berlin) statt Starts
  assert.ok(/eq\("aktion", "diagnose_start"\)/.test(server) && /einstieg: \{ tage: new Set\(\(starts\.data \?\? \[\]\)\.map\(\(x: any\) => new Date\(x\.zeit\)\.toLocaleDateString\("sv-SE", \{ timeZone: "Europe\/Berlin" \}\)\)\)\.size/.test(server), "Nutzungstage/erster Start fehlen");
  const code = html.slice(html.indexOf("const EINSTIEG_ABSTAND_TAGE"), html.indexOf("function einstiegMerken"));
  assert.ok(/const EINSTIEG_ABSTAND_TAGE = 1;/.test(code) && /const EINSTIEG_STANDARD = \{ aktiv: true, farbeTage: 3, privatTage: 3, erweitertTage: 14, spaeterTage: 3, feedbackTage: 28(, geraeteTage: 21)? \};/.test(code) && /tageSeit\(x\.am\) < EINSTIEG_ABSTAND_TAGE\)\) return false/.test(code), "höchstens ein Tipp je Tag");
  for (const id of ["farbe", "privat", "erweitert"]) assert.ok(code.includes(`{ id: "${id}"`), `Schritt ${id} fehlt`);
  assert.ok(/id: "farbe", faellig: \(e, s\) => e\.tage >= eiF\(\)\.farbeTage/.test(code) && /id: "erweitert", faellig: \(e\) => einfach\(\) && tageSeit\(e\.ersterStart\) >= eiF\(\)\.erweitertTage/.test(code), "Zeitpunkte der Tipps");
  assert.ok(/ansichtSetzen\("erweitert"\); setTimeout\(\(\) => einstiegHinweis\(\), 400\)/.test(code) && /Zurück zur einfachen Ansicht kommst du jederzeit/.test(html), "Hinweis zum Zurückschalten fehlt");
  assert.ok(/data-klappe="privat" data-einfach/.test(html) && /id="designWahlE"/.test(html), "Ziel der Tipps in der einfachen Ansicht nicht erreichbar");
  // Reihenfolge/Bedingungen nachrechnen
  const lauf = (einst, schritte, istEinfach = true, design = null) => {
    const f = new Function("INIT", "einfach", "document", "$", "ansichtSetzen", "einstiegHin", "einstiegHinweis", code + "; return EINSTIEG_SCHRITTE;");
    const S = f({}, () => istEinfach, {}, () => ({}), () => {}, () => {}, () => {});
    const tageSeit = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 86400000 : 0);
    const erl = { farbe: !!design && design !== "klassik", erweitert: !istEinfach };
    const offen = (x) => !schritte[x.id] || (schritte[x.id].antwort === "spaeter" && tageSeit(schritte[x.id].am) >= 3);
    return S.find((x) => !erl[x.id] && offen(x) && x.faellig(einst, schritte, erl))?.id || null;
  };
  const vor = (tage) => new Date(Date.now() - tage * 86400000).toISOString();
  assert.equal(lauf({ tage: 1, ersterStart: vor(0) }, {}), null, "am ersten Nutzungstag kein Tipp");
  assert.equal(lauf({ tage: 3, ersterStart: vor(1) }, {}), "farbe", "ab dem 3. Nutzungstag Farbe");
  assert.equal(lauf({ tage: 6, ersterStart: vor(4) }, { farbe: { antwort: "ja", am: vor(1) } }), null, "Privatsphäre erst ein paar Tage nach der Farbe");
  assert.equal(lauf({ tage: 6, ersterStart: vor(6) }, { farbe: { antwort: "nein", am: vor(3) } }), "privat", "Privatsphäre ein paar Tage später");
  assert.equal(lauf({ tage: 6, ersterStart: vor(6) }, {}, true, "wald"), "privat", "Farbe selbst gewählt → trotzdem weiter");
  assert.equal(lauf({ tage: 9, ersterStart: vor(15) }, { farbe: { antwort: "ja", am: vor(10) }, privat: { antwort: "nein", am: vor(5) } }), "erweitert", "nach 2 Wochen erweitert");
  assert.equal(lauf({ tage: 9, ersterStart: vor(15) }, { farbe: { antwort: "ja", am: vor(10) }, privat: { antwort: "nein", am: vor(5) } }, false), null, "schon erweitert → nicht fragen");
}

// 92. 0.71.0: Einstiegs-Tipps vom Admin einstellbar (KC-CLUB-EINSTIEG-FRISTEN)
{
  const fs = server.slice(server.indexOf('case "einstieg_fristen_setzen"'), server.indexOf('case "wetter_setzen"'));
  assert.ok(/nurAdmin\(ich\);/.test(fs) && /protokoll\(ich\.person_id, "einstieg_fristen_gesetzt"/.test(fs), "nur Admin / Protokoll");
  assert.ok(/EINSTIEG_GRENZEN = \{ farbeTage: \[1, 20\], privatTage: \[1, 30\], erweitertTage: \[1, 90\], spaeterTage: \[1, 30\], feedbackTage: \[1, 180\](, geraeteTage: \[1, 120\])? \}/.test(server) && /fristen: eiFristen[,}]/.test(server), "Grenzen / Übergabe an die App");
  assert.ok(/data-klappe="admin_einstieg"/.test(html.slice(html.indexOf('id="adminBereich"'), html.indexOf('data-klappe="app"'))) && /id="eiAktiv"/.test(html), "Admin-Klappbereich fehlt");
  assert.ok(/!eiF\(\)\.aktiv \|\|/.test(html) && /tageSeit\(s\[x\.id\]\.am\) >= eiF\(\)\.spaeterTage/.test(html), "Ausschalter / „Später“-Frist nicht wirksam");
}

// 93. 0.72.0: Mitgliederliste „Alle | Nur online“ (KC-CLUB-ONLINEFILTER)
{
  assert.ok(/id="mgFilter"/.test(html) && /onclick="mgFilterSetzen\('alle'\)">👥 Alle<\/button><button data-f="online" onclick="mgFilterSetzen\('online'\)">/.test(html), "Umschalter fehlt");
  assert.ok(/nurOnline = MG_FILTER === "online" && sichtbar/.test(html) && /MITGLIEDER\.filter\(\(m\) => m\.online\)/.test(html) && /ONLINE_SICHTBAR = r\.onlineSichtbar !== false/.test(html), "Filter / Online-Privatsphäre");
  assert.ok(/Gerade ist niemand online\./.test(html), "leere Liste ohne Hinweis");
}

// 94. 0.73.0: Meine Dokumente + Feedback-Frage nach 4 Wochen (KC-CLUB-DOKUMENTE / KC-CLUB-EINSTIEG-FEEDBACK)
{
  const fs2 = await import("node:fs");
  const doks = [...html.matchAll(/\{ id: "([a-z0-9-]+)", sym: "[^"]+", t: "([^"]+)", u: "[^"]*", datei: (null|"([^"]+)") \}/g)];
  assert.ok(doks.length >= 2 && doks.some((d) => d[2] === "Anleitung Club-App"), "Dokumente-Registry fehlt");
  for (const d of doks) if (d[4]) assert.ok(fs2.existsSync(new URL("../" + d[4], import.meta.url)) && /^dokumente\/[\w.-]+\.pdf$/.test(d[4]), `PDF fehlt: ${d[4]}`);
  assert.ok(/\{ id: "dokumente", sym: "📚", t: "Meine Dokumente"[^}]*v: "dokumente" \}/.test(html) && /id="v-dokumente"/.test(html) && /\["start", "dokumente",/.test(html) && /if \(v === "dokumente"\) dokumenteZeigen\(\);/.test(html), "Kachel/Ansicht fehlt");
  assert.ok(/id: "feedback", faellig: \(e\) => !e\.feedbackAbgegeben && tageSeit\(e\.ersterStart\) >= eiF\(\)\.feedbackTage/.test(html) && /ja: \(\) => zeige\("feedback"\)/.test(html), "Feedback-Tipp fehlt");
  assert.ok(/from\("kc_club_feedback"\)\.select\("person_id", \{ count: "exact", head: true \}\)\.eq\("person_id", ich\.person_id\)/.test(server) && /feedbackAbgegeben: \(fbAnzahl \?\? 0\) > 0/.test(server) && /"erweitert", "feedback"(, "geraete")?\]\.includes\(k\)/.test(server), "Server prüft abgegebenes Feedback nicht");
}

// 95. 0.74.0: eigener Wetterort je Mitglied (KC-CLUB-WETTERORT)
{
  assert.ok(/wetterort: \(w\) => \(\{ ort: w\?\.ort \? wetterOrtPruefen\(w\.ort\) : null \}\)/.test(server), "Server prüft den eigenen Ort nicht");
  const wc = server.slice(server.indexOf('case "wetter": {'), server.indexOf('case "wetter_konfig"'));
  assert.ok(/eq\("person_id", ich\.person_id\)\.eq\("schluessel", "wetterort"\)/.test(wc) && /schl = `\$\{k\.quelle\}:\$\{k\.ort\.lat\},\$\{k\.ort\.lon\}`/.test(wc) && /eigenerOrt: eigen/.test(wc), "eigener Ort wird nicht benutzt / Zwischenspeicher nicht je Ort");
  const suA = server.indexOf('case "wetter_ort_suchen"'), su = server.slice(suA, server.indexOf('      case "', suA + 10));
  assert.ok(!/nurAdmin/.test(su) && /ich\.admin && WETTER_QUELLEN\[/.test(su), "Suche für Mitglieder / Datenquelle nur Admin");
  for (const o of ["Werne", "Unna", "Bergkamen", "Kamen"]) assert.ok(html.includes(`{ name: "${o}", lat:`), `Ort ${o} fehlt in der Schnellauswahl`);
  assert.ok(/id="meinWetterort"/.test(html) && /api\("einstellung_setzen", \{ schluessel: "wetterort", wert \}\)/.test(html) && /meinWetterortZeigen\(\);/.test(html), "Auswahl in den Einstellungen fehlt");
}

// 96. 0.75.0: Designs Disko (Schwarzlicht) und Regenbogen (KC-CLUB-DESIGN-DISKO/REGENBOGEN)
{
  const ds = html.slice(html.indexOf("const DESIGNS = ["), html.indexOf("// Gewählt: Design + Modus"));
  const D = new Function(ds.replace("const DESIGNS =", "return"))();
  const ids = D.map((d) => d.id);
  for (const id of ["klassik", "kuechengruen", "nordsee", "schiefer", "lagune", "kontrast", "disko", "regenbogen"]) assert.ok(ids.includes(id), `Design ${id} fehlt`);
  assert.equal(new Set(ids).size, ids.length, "doppelte Design-id");
  const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const k = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const id of ["disko", "regenbogen"]) { const d = D.find((x) => x.id === id);
    for (const m of ["tag", "nacht"]) { const f = d[m];
      for (const key of ["rot", "rot2", "rot3", "gold", "hero1", "hero4", "bg", "karte", "karte2", "linie", "text", "grau"]) assert.ok(/^#[0-9a-fA-F]{6}$/.test(f[key]), `${id}.${m}.${key} fehlt`);
      assert.ok(k("#ffffff", f.rot) >= 4.5, `${id} ${m}: weiße Schrift auf Knopf zu schwach`);
      assert.ok(k(f.text, f.bg) >= 7 && k(f.grau, f.karte) >= 4.5, `${id} ${m}: Text schlecht lesbar`);
      assert.ok(/^linear-gradient\(/.test(d.verlauf[m]), `${id} ${m}: Verlauf fehlt`); } }
  assert.ok(D.find((x) => x.id === "disko").schwarzlicht === true && /w\.classList\.toggle\("schwarzlicht", !!dv\.schwarzlicht\)/.test(html) && /:root\.schwarzlicht \.kachel \{ box-shadow:/.test(html), "Schwarzlicht fehlt");
  assert.ok(/var\(--heroverlauf, linear-gradient\(135deg, var\(--hero1\)/.test(html) && /w\.style\.removeProperty\("--heroverlauf"\)/.test(html), "Standard-Verlauf der anderen Designs geändert");
}

// 97. 0.76.0: kurzer Supabase-Aussetzer (503) wird einmal still wiederholt (KC-CLUB-AUSSETZER)
{
  const code = html.slice(html.indexOf("const AUSSETZER_PAUSE_MS"), html.indexOf("// ---------- Verbindung zum Server (KC-CLUB-VERBINDUNG)"));
  let aufrufe = 0; const antworten = [];
  const setze = (liste) => { antworten.length = 0; antworten.push(...liste); aufrufe = 0; };
  const fetchT = async () => { aufrufe++; const a = antworten.shift(); return { status: a.s, ok: a.s < 300, json: async () => { if (a.j === undefined) throw 0; return a.j; } }; };
  const run = (liste) => { setze(liste); return new Function("fetch", "performance", "vbStart", "vbEnde", "API", "KEY", "APP_VERSION", "$", "setTimeout", code + "; return apiRoh('init');")(fetchT, { now: () => 0 }, () => {}, () => {}, "x", "k", "v", () => ({ classList: { add() {}, remove() {} } }), (f) => f()); };
  const ok1 = await run([{ s: 503 }, { s: 200, j: { ok: 1 } }]);
  assert.ok(ok1.ok === 1 && aufrufe === 2, "503 ohne Antwort wird nicht wiederholt");
  await run([{ s: 503 }, { s: 503 }]).then(() => assert.fail("zweimal 503 muss Fehler sein"), (e) => assert.ok(/kurz nicht erreichbar/.test(e.message) && aufrufe === 2, "höchstens ein Wiederholversuch / Meldung"));
  await run([{ s: 502 }, { s: 200, j: {} }]).then(() => assert.fail("502 darf nicht wiederholt werden"), () => assert.equal(aufrufe, 1, "502 wiederholt"));
  await run([{ s: 503, j: { error: "Wartung" } }]).then(() => assert.fail(), (e) => assert.ok(e.message === "Wartung" && aufrufe === 1, "Programm-503 (mit Meldung) wiederholt"));
}

// 98. 0.77.0: Linkschutz + Tablet/PC-Tipp (KC-CLUB-LINKSCHUTZ / KC-CLUB-GERAETE-TIPP)
{
  const mig = lies("supabase/migrations/20260930_kc_club_zugangslinks_schwaerzen.sql");
  assert.ok(/create or replace function public\.kc_club_zugangslinks_schwaerzen\(\)/.test(mig) && /'\?k=\[entfernt\]'/.test(mig) && /cron\.schedule\('kc-club-zugangslinks-schwaerzen', '\*\/15 \* \* \* \*'/.test(mig), "Schwärzung/Zeitplan fehlt");
  assert.ok(/status in \('sent',/.test(mig) && /values \('kc_communication_requests', 'variables'/.test(mig) && /r\.muster is not null/.test(mig), "nur fertige Mails / Spiegel-Muster");
  const za = server.slice(server.indexOf('if (a === "zugang_anfordern")'), server.indexOf("const tAnm = Date.now();"));
  assert.ok(/db\.rpc\("kc_club_zugangslinks_schwaerzen"\)/.test(za), "„Link verloren?“ schwärzt nicht");
  const lm = server.slice(server.indexOf('case "zugang_link_mailen"'), server.indexOf('case "pinnwand_fristen_setzen"'));
  assert.ok(/req\.headers\.get\("x-club-token"\)/.test(lm) && /eq\("person_id", ich\.person_id\)/.test(lm) && /seit15/.test(lm) && /db\.rpc\("kc_club_zugangslinks_schwaerzen"\)/.test(lm) && !/zufall\(\)/.test(lm), "Link-Mail: nur eigener Link an eigene Adresse, Sperre, Schwärzung, kein neuer Schlüssel");
  assert.ok(!/protokoll\([^;]*schluessel/.test(lm) && !/protokoll\([^;]*[{,]\s*(link|url)\b/.test(lm), "Link darf nicht ins Protokoll");
  assert.ok(/id: "geraete", faellig: \(e\) => !!e\.mailMaske && tageSeit\(e\.ersterStart\) >= eiF\(\)\.geraeteTage/.test(html) && /api\("zugang_link_mailen"/.test(html) && /id="eiGeraeteTage"/.test(html), "Tablet/PC-Tipp fehlt");
  assert.ok(/mailMaske: pm\?\.email \? String\(pm\.email\)\.replace\(/.test(server), "Adresse nur teilweise");
}

// 99. 0.78.0: eigener Link per E-Mail aus den Einstellungen (KC-CLUB-LINK-MAIL)
{
  assert.ok(/id="zugangMailKnopf"[^>]*onclick="zugangMailen\(\)"/.test(html) && /async function zugangMailen\(\) \{\s*try \{ const r = await api\("zugang_link_mailen"/.test(html), "Knopf „Per E-Mail an mich“ fehlt");
  assert.ok(/id: "geraete"[\s\S]{0,1200}ja: \(\) => zugangMailen\(\)/.test(html) && (html.match(/api\("zugang_link_mailen"/g) || []).length === 1, "Tipp und Knopf müssen denselben Weg nutzen");
  assert.ok(/\$\("zugangMailKnopf"\)\.classList\.toggle\("versteckt", !INIT\?\.einstieg\?\.mailMaske\)/.test(html), "Knopf nur mit hinterlegter Adresse");
}

// 100. 0.79.0: Club-App auf einen Blick – aktualisiert sich selbst (KC-CLUB-UEBERBLICK)
{
  assert.ok(/id="v-ueberblick"/.test(html) && /"erstattung", "ueberblick"(, "[a-z]+")*\]\.forEach/ /* 0.92.0: weitere Ansichten (z. B. standort) erlaubt */.test(html) && /if \(v === "ueberblick"\) ueberblickZeigen\(\)/.test(html), "Ansicht/Routing fehlt");
  assert.ok(/\{ id: "ueberblick",[^}]*v: "ueberblick" \}/.test(html) && /if \(d\.v\) return zeige\(d\.v\)/.test(html), "Eintrag unter Meine Dokumente fehlt");
  const ue = html.slice(html.indexOf("function ueberblickHtml("), html.indexOf("async function ueberblickLaden()"));
  assert.ok(/kachelnAlle\(r\)/.test(ue) && /ueNeuigkeiten\(v\)/.test(ue), "Inhalt muss aus Registry + version.json kommen");
  assert.ok(/ICH\?\.admin \|\| !\/admin\/i\.test\(x\)/.test(html) && /!versionNeuer\(e\.version, APP_VERSION\)/.test(html), "Admin-Neuerungen / künftige Versionen ausblenden");
  assert.ok(/ueberblick: \{ bauen: \(\) => druckUeberblick\(\) \}/.test(html) && /ueberblickHtml\(await ueberblickLaden\(\), true\)/.test(html), "Druck aus derselben Quelle");
}

// 101. 0.80.0: gleichzeitige Anrufe + Anruf-Takt ohne Push (KC-CLUB-GEGENANRUF / KC-CLUB-ANRUF-TAKT)
{
  const st = server.slice(server.indexOf('case "anruf_start"'), server.indexOf('case "anruf_status"'));
  assert.ok(/eq\("von", an\)\.eq\("an", ich\.person_id\)\.eq\("status", "klingelt"\)/.test(st) && /gegenanruf: gegen\[0\]\.id/.test(st) && st.indexOf("gegenanruf") < st.indexOf('from("kc_club_anruf").insert'), "Server: Gegenanruf vor dem Anlegen prüfen");
  assert.ok(/if \(r\.gegenanruf\) \{ anrufAufraeumen\(\); return gegenanrufAnnehmen\(r\.gegenanruf, mitBild\); \}/.test(html), "App: Gegenanruf annehmen");
  assert.ok(/RUF\.gegen\?\.person_id === ruf\.von\?\.person_id && ICH\?\.person_id > ruf\.von\.person_id/.test(html), "Fallback: feste Regel, wer nachgibt");
  assert.ok(/ONL\.wartet \? 4000 : PUSH_AKTIV \? 60000 : 15000/.test(html) && html.indexOf("let PUSH_AKTIV") < html.indexOf("let ONL ="), "Takt ohne Push 15 s (vor Nutzung deklariert)");
}

// 102. 0.81.0: Anrufe – Kurzantwort, zweiter Anruf, verpasst (KC-CLUB-ANRUF-KURZANTWORT / -ZWEIT / -VERPASST)
{
  const mig = lies("supabase/migrations/20260930_kc_club_anruf_kurzantwort.sql");
  assert.ok(/add column if not exists kurzantwort text/.test(mig) && /add column if not exists verpasst_gesehen_am timestamptz/.test(mig) && !/drop column|delete from|truncate/i.test(mig), "Migration nur additiv");
  const aw = server.slice(server.indexOf('case "anruf_antwort"'), server.indexOf('case "anruf_verpasst_gesehen"'));
  assert.ok(/a\.an !== ich\.person_id/.test(aw) && /status: "abgelehnt"/.test(aw) && /zweierGespraech\(ich\.person_id, a\.von\)/.test(aw) && /senden\("club_nachricht", \[a\.von\]/.test(aw), "Kurzantwort: nur Angerufener, ablehnen, Nachricht an Anrufer");
  assert.ok(/kurzantwort: a\.kurzantwort \?\? null \} : \{ angebot: a\.angebot \}/.test(server), "Kurzantwort nur an den Anrufer");
  assert.ok(/schluessel", "anruf_antworten"/.test(server) && /case "anruf_antworten_setzen": \{\s*nurAdmin\(ich\)/.test(server) && /anrufAntworten: anrufAntw/.test(server), "Schnellantworten als Admin-Registry");
  assert.ok(/verpasst: verp\.map/.test(server) && /is\("verpasst_gesehen_am", null\)/.test(server), "verpasste Anrufe");
  assert.ok(/anrufAntwortBereich\(art === "eingehend"\)/.test(html) && /api\("anruf_antwort", \{ id, text \}\)/.test(html), "App: mit Text ablehnen");
  assert.ok(/else if \(ruf && RUF && !ZWEIT && ruf\.id !== RUF\.id && !\(RUF\.rolle === "rufer"/.test(html) && /function zweitAnnehmen\(\)/.test(html) && /if \(ZWEIT\) \{ const z = ZWEIT; zweitWeg\(\); setTimeout\(\(\) => anrufEingehend\(z\.id\)/.test(html), "App: zweiter Anruf");
  assert.ok(/id="verpasstBlatt"/.test(html) && /api\("anruf_verpasst_gesehen"/.test(html) && /id="anrufAntwortenFeld"/.test(html), "App: verpasst + Admin");
  assert.ok(!/prompt\(/.test(html.slice(html.indexOf("KC-CLUB-ANRUF-KURZANTWORT (0.81.0): mit Text"), html.indexOf("KC-CLUB-GEGENANRUF (0.80.0): Wer selbst"))), "eigener Text ohne prompt()");
}

// 103. 0.82.0: Konferenz (KC-CLUB-KONFERENZ)
{
  const mig = lies("supabase/migrations/20260930_kc_club_anruf_konferenz.sql");
  assert.ok(/add column if not exists konferenz_id uuid/.test(mig) && /add column if not exists automatisch boolean not null default false/.test(mig) && !/drop column|delete from|truncate/i.test(mig), "Migration nur additiv");
  assert.ok(/const KONFERENZ_MAX = 4;/.test(server) && /case "konferenz_dazu"/.test(server) && /case "konferenz_status"/.test(server) && /case "konferenz_bein"/.test(server), "Konferenz-Aktionen");
  const ks = server.slice(server.indexOf('case "konferenz_status"'), server.indexOf('case "konferenz_bein"'));
  assert.ok(/b\.an === ich\.person_id && b\.status === "klingelt" \? \{ angebot/.test(ks) && /b\.von === ich\.person_id && b\.status === "angenommen" \? \{ antwort/.test(ks) && /return json\(\{ dabei: false \}\)/.test(ks), "Verbindungsdaten nur an die andere Seite / nur Teilnehmer");
  assert.ok(/\.eq\("status", "klingelt"\)\.eq\("automatisch", false\)\.gte/.test(server) && /eq\("an", ich\.person_id\)\.eq\("automatisch", false\)\.is\("angenommen_am", null\)/.test(server), "automatische Verbindungen klingeln nie / nie verpasst");
  assert.ok(/eq\("von", ich\.person_id\)\.eq\("status", "klingelt"\)\.eq\("automatisch", false\);/.test(server), "eigener neuer Anruf beendet keine Konferenz-Verbindungen");
  assert.ok(/p\.art === "video" && !konferenz \? "video" : "ton"/.test(server), "Konferenz nur Ton");
  assert.ok(/function konfTakt\(\)/.test(html) && /ich > t\.person_id/.test(html) && /api\("konferenz_bein"/.test(html) && /onclick="zweitDazu\(\)"/.test(html) && /onclick="konfWahl\(\)"/.test(html), "App: Takt, Querverbindung, Dazuholen, ➕");
  assert.ok(/const konfBeine = RUF\.konf \? \[\.\.\.RUF\.konf\.beine\.keys\(\)\]/.test(html), "Auflegen beendet alle eigenen Verbindungen");
}

// 104. 0.83.0: Freigegebene Programme + Bilderrechner-Anleitung (KC-CLUB-PROGRAMME)
{
  assert.ok(/\{ id: "programme", sym: "💻", t: "Freigegebene Programme", u: "[^"]*", v: "programme" \}/.test(html) && /id="v-programme"/.test(html) && /"ueberblick", "programme"(, "[a-z]+")*\]\.forEach/.test(html), "Kachel/Ansicht Programme");
  assert.ok(/const PROGRAMME = \[\s*\{ id: "kasse-schulung",[^}]*url: "https:\/\/sire65\.github\.io\/Kasse\/schulung\/" \}/.test(html), "Kassen-Schulung in der Registry");
  assert.ok(/datei: "dokumente\/Kurzanleitung_Bilderrechner_V3\.pdf"/.test(html) && fs.existsSync(new URL("../dokumente/Kurzanleitung_Bilderrechner_V3.pdf", import.meta.url)), "Bilderrechner-PDF fehlt");
}

// 105. 0.84.0: Lebenszeichen (KC-CLUB-HEARTBEAT) – über den eigenen Server an den gemeinsamen KICC-Empfänger, kein Schlüssel im Browser
{
  const lz = server.slice(server.indexOf('case "lebenszeichen"'), server.indexOf('case "anruf_verpasst_gesehen"'));
  assert.ok(/programId: "kc-clubapp"/.test(lz) && /schema: "kicc\.remote-program-heartbeat\.v1"/.test(lz) && /nonce: crypto\.randomUUID\(\)/.test(lz) && /functions\/v1\/kicc-program-heartbeat/.test(lz), "Weiterleitung im KICC-Format fehlt");
  assert.ok(!/kicc_program_heartbeats/.test(lz), "nicht an der Prüfung des Empfängers vorbei direkt in die Tabelle schreiben");
  assert.ok(/apiRoh\("lebenszeichen", \{ geraet: herzGeraet\(\), sichtbar:/.test(html) && /id="herzKnopf"/.test(html) && /max: 15/.test(html) && /@keyframes herzschlag/.test(html), "Herz / letzte 15");
  assert.ok(/if \(document\.visibilityState !== "hidden"\) herzSenden\(\)/.test(html), "nur senden, wenn die App sichtbar ist");
}

// 106. 0.85.0: Empfängerfehler färben die Versand-LED nicht (KC-CLUB-LED-EMPFAENGER)
{
  assert.ok(/const COMM_EMPFAENGER_FEHLER = \/\^\(PUSH_NO_ACTIVE_SUBSCRIPTION\|PUSH_SUBSCRIPTION_NOT_FOUND\|PUSH_USER_RECIPIENT_MISSING\|EMAIL_RECIPIENT_MISSING\)\//.test(server), "Liste wie im Communicator");
  const cs = server.slice(server.indexOf("async function communicatorStatus"), server.indexOf("// ----- KC-CLUB-ADMINLAGE (0.47.0)"));
  assert.ok(!/bericht\?\.failed \?\? 0\) > 0/.test(cs) && /systemFehler24 > 0 \|\| club\.fehler24 > 0/.test(cs) && /fehler24: liste\.filter\(\(x: any\) => commSystemFehler\(x\)/.test(cs), "nur Systemfehler zählen");
  assert.ok(/push\.zustand === "stoerung" \|\| email\.zustand === "stoerung"/.test(cs) && /Number\(bericht\?\.success_rate \?\? 100\) < 90/.test(cs), "echte Störungen bleiben gelb");
  const f = (s, c) => /^(failed|dead_lettered|error)$/.test(s) && !/^(PUSH_NO_ACTIVE_SUBSCRIPTION|PUSH_SUBSCRIPTION_NOT_FOUND|PUSH_USER_RECIPIENT_MISSING|EMAIL_RECIPIENT_MISSING)/.test(c || "");
  assert.ok(!f("failed", "PUSH_NO_ACTIVE_SUBSCRIPTION") && f("failed", "PUSH_ALL_FAILED:410") && f("dead_lettered", null) && !f("sent", null), "Beispiele");
}

// 107. 0.86.0: Kalender-Auswahl + Terminliste (KC-CLUB-KALENDER-WAHL)
{
  assert.ok(!/\.map\(treffenKarte\)/.test(html), "treffenKarte nie direkt an map übergeben (Index würde „vorbei“)");
  assert.ok(/function kalGoogle\(id\)/.test(html) && /calendar\.google\.com\/calendar\/render\?/.test(html) && /function kalOutlook\(id\)/.test(html) && /outlook\.live\.com\/calendar\/0\/deeplink\/compose\?/.test(html) && /function kalIcs\(id\)/.test(html), "Auswahl Google/Outlook/Handy");
  assert.ok(/calendar\.google\.com\/calendar\/r\?cid=/.test(html) && /outlook\.live\.com\/calendar\/0\/addfromweb\?url=/.test(html), "Abo-Knöpfe Google/Outlook");
  assert.ok(/id="kalWahlBlatt"/.test(html), "Auswahlfenster fehlt");
}

// 108. 0.87.0: Mitfahrgelegenheit suchen/anbieten/buchen (KC-CLUB-MITFAHRT-SUCHE)
{
  const mig = lies("supabase/migrations/20260930_kc_club_mitfahrt_suche.sql");
  assert.ok(/create table if not exists public\.kc_club_mitfahrt_suche/.test(mig) && /enable row level security/.test(mig) && /kc_db_mirror_table_rules/.test(mig), "Tabelle mit RLS + Spiegelregel");
  assert.ok(/case "mitfahrt_suchen"/.test(server) && /async function mitfahrtErlaubt/.test(server) && /tn\?\.antwort !== "ja"/.test(server), "Suche + Zusage-Pflicht");
  const pl = server.slice(server.indexOf('case "mitfahrt_platz"'), server.indexOf('case "mitfahrt_suchen"'));
  assert.ok(/await mitfahrtErlaubt\(ich, m\.bezug_art, m\.bezug_id\)/.test(pl) && /kc_club_mitfahrt_suche"\)\.delete\(\)/.test(pl), "Buchen nur nach Zusage, Suche entfällt");
  assert.ok(/if \(antwort !== "ja"\) await db\.from\("kc_club_mitfahrt_suche"\)\.delete\(\)/.test(server), "Absage beendet Suche");
  assert.ok(/mitfahrtBlock\("treffen", t\.id, t\.mitfahrten \|\| \[\], offen, t\.mitfahrtSuche \|\| \[\], va \|\| t\.meine === "ja"\)/.test(html), "Treffen: erst nach Zusage");
  assert.ok(/Ich suche eine Mitfahrgelegenheit/.test(html) && /Ich biete eine Mitfahrgelegenheit/.test(html) && /Soll ich den gebuchten Platz wieder freigeben\?/.test(html), "Knöpfe + Frage bei Absage");
}

// 109. 0.88.0: Lebenszeichen mit Mindestabstand (KC-CLUB-HERZ-ABSTAND)
{
  const hz = html.slice(html.indexOf("async function herzSenden()"), html.indexOf("function herzStarten()"));
  assert.ok(/abstand: 20/.test(html) && /herzSenden\.laeuft \|\| jetzt - \(herzSenden\.zuletzt \|\| 0\) < HERZ\.abstand \* 1000\) return/.test(hz) && /finally \{ herzSenden\.laeuft = false; \}/.test(hz), "Mindestabstand fehlt");
}

// 110. 0.89.0: Datenstrom der Club-App im KC System Check (KC-CLUB-DATENSTROM)
{
  assert.ok(/if \(action !== "lebenszeichen"\) verkehrZaehlen\(\);/.test(html) && /function verkehrStand\(\)/.test(html) && /verkehr: verkehrStand\(\)/.test(html), "App zählt Datenabrufe (ohne Lebenszeichen) und meldet den Stand");
  const lz = server.slice(server.indexOf('case "lebenszeichen"'), server.indexOf('case "lebenszeichen"') + 2500);
  assert.ok(/Number\.isSafeInteger\(p\.verkehr\) && p\.verkehr >= 0 \? p\.verkehr : null/.test(lz) && /trafficTx: verkehr/.test(lz) && /sourceId: "kc-clubapp"/.test(lz), "Server gibt Zähler als trafficTx weiter");
}

// 111. 0.90.0: Antwort auf einen Termin zurücknehmen (KC-CLUB-ANTWORT-ZURUECK)
{
  const ta = server.slice(server.indexOf('case "treffen_antwort"'), server.indexOf('case "vorschlaege_liste"'));
  assert.ok(/\["ja", "nein", "vielleicht", "keine"\]/.test(ta) && /if \(antwort === "keine"\) await db\.from\("kc_club_teilnahme"\)\.delete\(\)\.eq\("treffen_id", t\.id\)\.eq\("person_id", ich\.person_id\)/.test(ta) && /if \(antwort !== "ja"\) await db\.from\("kc_club_mitfahrt_suche"\)\.delete\(\)/.test(ta), "Server: zurücknehmen löscht nur die eigene Zeile");
  assert.ok(/if \(bisher && bisher === a\) \{ if \(!confirm\(/.test(html) && /a = "keine";/.test(html) && /if \(a === "nein" \|\| a === "keine"\)/.test(html) && /Nochmal auf deine Antwort tippen = zurücknehmen/.test(html), "App: nochmal tippen nimmt zurück, Platzfrage");
}

// 130. DB: Kollegenfreigabe beim Übernehmen + Übernahmebeleg (KC-DP-WUNSCH-FREIGABE)
{
  const mig = lies("supabase/migrations/20260930_kc_dp_wunsch_eingang_freigabe.sql");
  const ack = mig.slice(mig.indexOf("create or replace function public.kc_dp_wish_inbox_ack"), mig.indexOf("create or replace function public.kc_dp_wish_inbox_receipt"));
  const beleg = mig.slice(mig.indexOf("create or replace function public.kc_dp_wish_inbox_receipt"));
  assert.ok(/returning org_id, person_id, share_with_colleagues into v_org, v_person, v_share/.test(ack) && /select v_org, v_person, k, v_share, false/.test(ack), "Freigabe nur für die Person aus dem Eingang");
  assert.ok(/if v_n = 1 and p_status = 'uebernommen' and v_share is not null then/.test(ack), "Freigabe nur bei erfolgreicher Übernahme mit Angabe");
  assert.ok(/allow_copy = case when excluded\.allow_view then public\.kc_dp_plan_sharing\.allow_copy else false end/.test(ack), "Nein schaltet Kopieren ab");
  for (const f of [ack, beleg]) assert.ok(/m\.role in \('admin', 'planner', 'duty_manager'\)/.test(f) && /raise exception 'Keine aktive dp2-Planungsberechtigung'/.test(f), "Rollenprüfung fehlt");
  assert.ok(/stable\s+security definer/.test(beleg) && !/\b(insert|update|delete)\b/i.test(beleg.replace(/comment on[\s\S]*$/, "")), "Beleg nur lesend");
  assert.ok(/revoke all on function public\.kc_dp_wish_inbox_ack\(uuid, integer, text, jsonb\) from public, anon;/.test(mig) && /revoke all on function public\.kc_dp_wish_inbox_receipt\(uuid\) from public, anon;/.test(mig), "Rechte nicht eingeschränkt");
}

// 131. DB/Spiegel: neue Tabellen und Spalten automatisch in den Neon-Spiegel (KC-SPIEGEL-AUTO)
{
  const mig = lies("supabase/migrations/20261001_kc_core_spiegel_auto_aufnahme.sql");
  const w = lies("supabase/functions/kc-db-mirror-worker/index.ts");
  assert.ok(/_vor_autoaufnahme\(/.test(mig), "Wiederherstellungspunkt fehlt");
  assert.ok(/create or replace function public\.kc_db_mirror_spalten/.test(mig) && /revoke all on function public\.kc_db_mirror_spalten\(text\) from public, anon, authenticated;/.test(mig) && /grant execute on function public\.kc_db_mirror_spalten\(text\) to service_role;/.test(mig), "Spaltenliste nur für den Arbeiter");
  assert.ok(/token\|secret\|geheim\|passw/.test(mig) && /latitude\|longitude\|gps\|standort/.test(mig) && /'AUTO-HALT %s: wartet auf Admin-Freigabe/.test(mig) && /values \(t, v_bereich, 'sensitive', false, false, false,/.test(mig), "Verdächtige Spalten → nicht spiegeln, Freigabe nötig");
  assert.ok(/values \(t, v_bereich, 'sensitive', false, true, true,/.test(mig) && /insert into public\.kc_neon_resume_tables \(table_name\) values \(t\)/.test(mig), "Unauffällige Tabelle → gespiegelt + im 6-h-Lauf");
  assert.ok(/when cardinality\(v_wartet\) > 0 then format\('Spiegel-Abdeckung WARNING/.test(mig), "Wartende Tabellen bleiben sichtbar (WARNING)");
  assert.ok(/'kc_club_standort_live', 'Club-App', 'sensitive', false, false, false/.test(mig), "Standort live bewusst nicht gespiegelt");
  assert.ok(/const schemaAbgleich=async\(table:string\)/.test(w) && /create table if not exists \$\{q\}/.test(w) && /alter table \$\{q\} add column if not exists/.test(w), "Arbeiter legt Tabelle/Spalten an");
  assert.ok(!/drop (table|column)|alter column|alter table [^`]*type /i.test(w), "Arbeiter löscht oder ändert nie");
  assert.ok(/if\(redactedTables\.has\(table\)\)\{fehlend\.push\(s\.name\);continue\}/.test(w), "Datenschutz-Tabellen: neue Spalten nur melden");
  assert.ok(/const schema=await schemaAbgleich\(table\);/.test(w.slice(w.indexOf("try{\n        const schema"))), "Abgleich vor dem Kopieren");
}

// 132. 1.5.0: persönliche Archiv-Ordner mit Freigabe auf Zeit (KC-CLUB-ARCHIV-PERSOENLICH)
{
  const mig = lies("supabase/migrations/20261001_kc_club_v150_persoenliche_ordner.sql");
  assert.ok(/add column if not exists besitzer text references kc_core_people/.test(mig) && /create table if not exists kc_club_archiv_freigaben/.test(mig) && /alter table kc_club_archiv_freigaben enable row level security/.test(mig), "Tabellen/Spalten");
  assert.ok(/bis timestamptz not null/.test(mig) && /\(an_person is null\) <> \(an_gruppe is null\)/.test(mig), "Freigabe immer befristet, genau ein Empfänger");
  assert.ok(/o\.besitzer is null or o\.besitzer = p_person/.test(mig) && /f\.bis > now\(\)/.test(mig), "Suche respektiert persönliche Ordner");
  const ho = server.slice(server.indexOf("async function archivOrdnerHolen"), server.indexOf("async function archivDokHolen"));
  assert.ok(/if \(o\.besitzer\) \{/.test(ho) && /o\.besitzer === ich\.person_id/.test(ho) && /archivKeinZugriff\(ich, o, "den Ordner"\)/.test(ho) && !/ich\.admin/.test(ho), "Nur Besitzer + Freigabe – kein Admin-Zugriff");
  assert.ok(/async function archivFremdversuch/.test(server) && /"archiv_fremdzugriff"/.test(server) && /await adminIds\(\)/.test(server.slice(server.indexOf("async function archivFremdversuch"))), "Fremdversuch → Besitzer + Admins");
  assert.ok(/Deine Freigabe für diesen Ordner ist abgelaufen/.test(server), "Abgelaufene Freigabe: Hinweis statt Alarm");
  assert.ok(/Dieses Dokument ist für dich nicht freigegeben\./.test(server), "Freigabe ohne dieses Dokument: Hinweis statt „abgelaufen“");
  const au = server.slice(server.indexOf('case "anlage_url"'), server.indexOf('case "anlage_url"') + 4000);
  assert.ok(/darfDokSehen\(ich, o, x, fr\)/.test(au) && /archivKeinZugriff\(ich, fremd, "ein Dokument"\)/.test(au), "Datei-Link geschützt");
  assert.ok(/case "archiv_freigeben"/.test(server) && /FREIGABE_MAX_TAGE \* 86400_000/.test(server) && /case "archiv_freigabe_beenden"/.test(server), "Freigabe auf Zeit");
  const hl = server.slice(server.indexOf('case "archiv_hochladen"'), server.indexOf('case "archiv_pruefung"'));
  assert.ok(/status: einreichung \? "pruefung" : "ok"/.test(hl) && /Neues Dokument zur Prüfung/.test(hl) && /PERSOENLICH_GRENZE/.test(hl), "Einreichung zur Prüfung + Bescheid + 50 MB");
  assert.ok(/case "archiv_pruefung"/.test(server) && /archiv_einreichung_abgelehnt/.test(server) && /dateienEntfernen\(\[d\.attachment_id\]\)/.test(server), "Annehmen/Ablehnen");
  assert.ok(/function arFreigabeForm/.test(html) && /function arPruefung/.test(html) && /👤 Mein Ordner/.test(html) && /🤝 Mit mir geteilt/.test(html), "Oberfläche");
}

// 133. 1.6.0: Klappbereiche unten zu, Wischen im Chat, SOS-Kachel, Tipp des Tages
{
  assert.ok(/class="klappe-unten"/.test(html) && /d\.open = false; s\.scrollIntoView/.test(html), "Zuklappen unten fehlt");
  assert.ok(/function naWischenEinrichten\(\)/.test(html) && /naAntworten\(id\)/.test(html.slice(html.indexOf("function naWischenEinrichten"))) && /naLoeschenFragen\(id\)/.test(html.slice(html.indexOf("function naWischenEinrichten"))), "Wischen: rechts antworten, links löschen");
  assert.ok(/Nur für mich löschen/.test(html) && /case "nachricht_ausblenden"/.test(server) && /kc_communication_message_hidden/.test(server.slice(server.indexOf('case "unterhaltung"'), server.indexOf('case "unterhaltung"') + 2500)), "Für mich löschen + ausgeblendet");
  const sos = html.slice(html.indexOf("function sosAnrufen"), html.indexOf("function sosAnrufen") + 600);
  assert.ok(/ECHTER ANRUF – KEIN TEST/.test(sos) && /if \(!confirm\(/.test(sos), "Notruf nur nach Sicherheitsabfrage");
  assert.ok(!/href="tel:(112|110)/.test(html) && /nr: "112"/.test(html) && /nr: "110"/.test(html), "Notruf nie als direkter Link");
  assert.ok(/id: "sos", sym: "🆘"/.test(html) && /klasse: "sos"/.test(html) && /"sos"\];/.test(html) && /\.kachel\.sos \{ background: #c0392b/.test(html), "Rote SOS-Kachel (auch einfache Ansicht)");
  const sk = server.slice(server.indexOf('case "sos_kontakte"'), server.indexOf('case "geburtstag_freigabe"'));
  assert.ok(/ich\.vorstand \? db\.from\("kc_club_notfall"\)/.test(sk) && /ich\.kontakte && frei\(m\.person_id, f\)/.test(sk), "SOS: nur freigegebene Kontakte, Notfallkontakte nur Clubleitung");
  assert.ok(/const TIPPS = \[/.test(html) && /function tippDesTages\(\)/.test(html) && /Keine Tipps mehr anzeigen/.test(html) && /id="setTipps" checked/.test(html) && /tipps: \(w\) =>/.test(server), "Tipp des Tages + Schalter (Standard an)");
}

// 134. 1.7.0: SOS „Wo bin ich?“ + Notfallpass (KC-CLUB-SOS-WO, KC-CLUB-NOTFALLPASS)
{
  const so = server.slice(server.indexOf('case "sos_ort"'), server.indexOf('case "geburtstag_freigabe"'));
  assert.ok(so && /ortsnameHolen\([\s\S]{0,200}messung : true\)/.test(so) && /sosOrtZuletzt/.test(so) && /ortsnameZuletzt < 1100/.test(so), "sos_ort: Adapter (genau), Bremse je Person und 1/s");
  assert.ok(!/\.(insert|update|upsert)\(/.test(so) && /protokoll\(ich\.person_id, "sos_wo_bin_ich", \{\}\)/.test(so), "sos_ort: nichts speichern, keine Koordinaten ins Protokoll");
  assert.ok(/nominatim: async \(lat, lon, genau\)/.test(server) && /if \(genau\) \{/.test(server), "Ortsnamen-Adapter: Option genau (Fotos unverändert)");
  assert.ok(/photon: async \(lat, lon, genau\)/.test(server) && /const ORTSNAME_QUELLEN = \["photon", "nominatim"\]/.test(server), "1.7.1: Photon zuerst, Nominatim als Ausweichweg");
  assert.ok(/typeof genau === "number" && a\.housenumber/.test(server) && /oder Nachbarhaus Nr\./.test(server), "1.7.2: Nachbarhäuser im GPS-Umkreis");
  assert.ok(/function sosWoBinIch\(\)/.test(html) && /api\("sos_ort", \{ lat: w\.lat, lon: w\.lon, genau: w\.genau \}/.test(html) && /notrufe \+ sosWoKarte\(\) \+ nfpKarte\(\)/.test(html), "App: Wo bin ich im SOS-Bereich");
  const nfp = html.slice(html.indexOf("// ---------- KC-CLUB-NOTFALLPASS"), html.indexOf("// ---------- KC-CLUB-WISCHEN"));
  assert.ok(/const NFP_FELDER = \[/.test(nfp) && /"kc_club_notfallpass_" \+ \(ICH\?\.person_id/.test(nfp), "Notfallpass: Registry + Speicher je Person");
  assert.ok(!/api\(/.test(nfp), "Notfallpass: Gesundheitsdaten nie an den Server");
  assert.ok(/confirm\("Notfallpass auf diesem Gerät löschen\?"\)/.test(nfp) && /id="nfpBlatt"/.test(html), "Notfallpass: Löschen mit Rückfrage, Blatt vorhanden");
}

// 135. 1.8.0: Schnellstart, Anklopfen erlauben, Kurzantworten, Anklopfton
{
  assert.ok(/const SCHNELL = \[/.test(html) && /const SCHNELL_STANDARD = \["schreiben", "termin", "zettel", "foto", "standort", "dienst", "suchen", "sos"\]/.test(html), "Schnellstart: Registry + 8 Grund-Symbole");
  assert.ok(/\{ id: "schnellstart", t: "Schnellstart", html: \(\) => infoSchnellstart\(\), nur: \(\) => !einfach\(\) && schnellStand\(\)\.an !== false/.test(html), "1.8.1: Schnellstart als Karte im farbigen Info-Feld, nur erweiterte Ansicht");
  assert.ok(!/id="schnellstart"/.test(html), "1.8.1: keine extra Kachel mehr unter dem Info-Feld");
  assert.ok(/ids\.length >= 8\) return melde/.test(html) && /schnellstart: \(w\) =>[\s\S]{0,250}\.slice\(0, 8\)/.test(server), "Schnellstart: höchstens 8 (App + Server)");
  assert.ok(/!x\.kachel \|\| kachelDa\(x\.kachel\)/.test(html), "Schnellstart: nur Symbole, für die das Mitglied Rechte hat");
  const ak = server.slice(server.indexOf('case "anklopfen":'), server.indexOf('case "anklopfen_antwort"'));
  assert.ok(/anklopfenErlaubtMap\(\[an\]\)\)\.get\(an\) === false/.test(ak) && ak.indexOf("anklopfenErlaubtMap") < ak.indexOf('.insert('), "Anklopfen aus: Server lehnt vor dem Anlegen ab");
  assert.ok(/anklopfen: \(w\) => \(\{ erlaubt: w\?\.erlaubt !== false/.test(server) && /id="setAnklopfen" checked/.test(html), "Anklopfen erlauben (Standard an)");
  const aa = server.slice(server.indexOf('case "anklopfen_antwort"'), server.indexOf('case "anruf_start"'));
  assert.ok(/KLOPF_ANTWORTEN\[p\.antwort\]/.test(aa) && /status: "spaeter"/.test(aa), "Kurzantwort nur aus der Registry, beendet das Anklopfen");
  assert.ok(/const KLOPF_ANTWORTEN: Record<string, string> = \{/.test(server) && /antwort: x\.antwort \?\? null/.test(server), "Kurzantwort an den Anklopfenden");
  const mig = lies("supabase/migrations/20261001_kc_club_v180_anklopfen_antwort.sql");
  assert.ok(/add column if not exists antwort text/.test(mig) && /char_length\(antwort\) <= 80/.test(mig), "Migration Spalte antwort");
  assert.ok(/function klopfKurz\(/.test(html) && /id="klopfKacheln"/.test(html) && /onclick="klopfAntwort\(false\)">⏳ Später/.test(html), "App: Kurzantwort-Kacheln, „Später“ bleibt");
  assert.ok(/const KLOPF_TOENE = \[/.test(html) && /id="setKlopfTon"/.test(html) && /▶ Testton/.test(html) && /klopfTonSpielen\(klopfStand\(\)\.ton\)/.test(html), "Anklopfton wählbar mit Testton, spielt beim Anklopfen");
}

// 136. 1.8.2: Nachricht kopieren (KC-CLUB-KOPIEREN)
{
  assert.ok(/naKopieren\('\$\{id\}'\)">📋 Kopieren/.test(html) && /async function naKopieren\(id\)/.test(html), "Kopieren im Antipp-Menü");
  assert.ok(/navigator\.clipboard\.writeText\(t\)/.test(html.slice(html.indexOf("async function naKopieren"))) && /execCommand\("copy"\)/.test(html), "Kopieren mit Rückfall");
  assert.ok(/weiterleitenBlatt\('\$\{id\}'\)">↪️ Weiterleiten/.test(html), "Weiterleiten bleibt");
}

// 137. 1.8.3: Pfeil + blaues i neben der Nachricht (KC-CLUB-NA-SEITE)
{
  assert.ok(/<div class="na-seite"><button class="na-pfeil"[^>]*onclick="naPfeilMenue\('\$\{m\.id\}'\)"/.test(html) && /class="na-info"[^>]*onclick="nachrichtInfo\('\$\{m\.id\}'\)">i<\/button>/.test(html), "Pfeil und i neben jeder Nachricht");
  const pm = html.slice(html.indexOf("function naPfeilMenue"), html.indexOf("// KC-CLUB-KOPIEREN (1.8.2"));
  assert.ok(/weiterleitenBlatt\('\$\{id\}'\)/.test(pm) && /naKopieren\('\$\{id\}'\)/.test(pm), "Pfeil-Menü: Weiterleiten + Kopieren (vorhandene Funktionen)");
  assert.ok(/\.na-seite \.na-info \{ background: #1e88e5/.test(html), "i ist blau");
}

// 138. 1.9.0: Bearbeiten, Stummschalten, Suche im Chat
{
  const nb = server.slice(server.indexOf('case "nachricht_bearbeiten"'), server.indexOf('case "nachricht_ausblenden"'));
  assert.ok(/m\.sender_person_id !== ich\.person_id\) throw/.test(nb) && /BEARBEITEN_MIN \* 60000\) throw/.test(nb), "Bearbeiten: nur eigene, nur 15 Min.");
  assert.ok(!/sendenGewaehlt|routerSenden/.test(nb) && /protokoll\(ich\.person_id, "nachricht_bearbeitet", \{ nachricht: m\.id, thread: m\.thread_id \}\)/.test(nb), "Bearbeiten: keine Benachrichtigung, Protokoll ohne Text");
  const mig = lies("supabase/migrations/20261001_kc_club_v190_nachricht_bearbeitet.sql");
  assert.ok(/create table if not exists kc_club_nachricht_bearbeitet/.test(mig) && /enable row level security/.test(mig) && !/alter table kc_communication_messages/.test(mig), "Migration: eigene Tabelle, Kern-Tabelle unverändert");
  const ns = server.slice(server.indexOf('case "nachricht_senden"'), server.indexOf('case "privattermin_speichern"'));
  assert.ok(ns.indexOf("stummFuer(") > 0 && ns.indexOf("stummFuer(") < ns.indexOf('sendenGewaehlt("club_nachricht", ziel'), "Stumm: vor dem Versand herausfiltern");
  assert.ok(ns.indexOf("versandErw = await sendenGewaehlt") < ns.indexOf("stummFuer("), "Stumm: @Erwähnung kommt trotzdem");
  assert.ok(/stumm: \(w\) =>/.test(server) && /ungelesenLaut/.test(server) && /const laut = INIT\?\.ungelesenLaut \?\? n/.test(html), "Stumm: Einstellung + kein Ton");
  assert.ok(/id="chatSuchKnopf"[^>]*onclick="chatSucheAuf\(\)"/.test(html) && /function chatSucheJetzt\(neu\)/.test(html) && /suNorm\(`\$\{m\.text \|\| ""\} \$\{m\.von \|\| ""\}`\)/.test(html), "Chat-Suche (Umlaut-tolerant)");
  assert.ok(/naBearbeiten\('\$\{id\}'\)">✏️ Bearbeiten/.test(html) && /class="bearb"/.test(html), "App: Bearbeiten im Menü + Kennzeichen");
}

// 139. 1.10.0: Anheften, Merken, Abstimmung im Chat, Kontakt teilen
{
  const mig = lies("supabase/migrations/20261001_kc_club_v1100_nachrichten_extras.sql");
  for (const t of ["kc_club_angeheftet", "kc_club_gemerkt", "kc_club_chat_umfrage", "kc_club_chat_stimme", "kc_club_chat_kontakt"])
    assert.ok(new RegExp(`create table if not exists ${t}`).test(mig) && new RegExp(`alter table ${t} enable row level security`).test(mig), "Tabelle + RLS: " + t);
  assert.ok(!/alter table kc_communication_messages/.test(mig) && !/phone|email|telefon/.test(mig.slice(mig.indexOf("create table if not exists kc_club_chat_kontakt"), mig.indexOf("alter table kc_club_angeheftet"))), "Kern-Tabelle unverändert, Kontaktkarte ohne Kontaktdaten");
  const ah = server.slice(server.indexOf('case "nachricht_anheften"'), server.indexOf('case "nachricht_merken"'));
  assert.ok(/binTeilnehmer\(m\.thread_id, ich\.person_id\)/.test(ah) && /\.slice\(3\)/.test(ah), "Anheften: nur Teilnehmer, höchstens 3");
  const gm = server.slice(server.indexOf('case "gemerkte_nachrichten"'), server.indexOf('case "chat_umfrage_stimmen"'));
  assert.ok(/eq\("person_id", ich\.person_id\)/.test(gm) && /darf\.has\(x\.thread_id\) && !versteckt\.has\(x\.id\)/.test(gm), "Merken: nur eigene, nur aus eigenen Chats");
  const st = server.slice(server.indexOf('case "chat_umfrage_stimmen"'), server.indexOf('case "nachricht_ausblenden"'));
  assert.ok(/binTeilnehmer\(m\.thread_id, ich\.person_id\)/.test(st) && /if \(!u\.mehrfach\) wahl = wahl\.slice\(0, 1\)/.test(st), "Abstimmen: nur Teilnehmer, Einfachwahl");
  assert.ok(/Abstimmungen und Kontaktkarten lassen sich nicht bearbeiten/.test(server), "Abstimmung/Kontakt nicht bearbeitbar");
  assert.ok(/onclick="mitgliedOeffnen\('\$\{k\.person_id\}'\)">📇 Kontakt ansehen/.test(html), "Kontaktkarte nutzt vorhandene Mitglieder-Ansicht (Freigaben)");
  assert.ok(/anlageMenue\(\);cuForm\(\)">📊 Abstimmung/.test(html) && /anlageMenue\(\);kontaktWahl\(\)">👤 Kontakt teilen/.test(html) && /onclick="gemerktZeigen\(\)"/.test(html) && /id="chatAngeheftet"/.test(html), "App: Einstiege vorhanden");
}

console.log(`OK – Köcheclub-App ${appV}: ${aufrufe.size} API-Aktionen geprüft`);

// 112. 0.91.0: Pinnwand-Knopf bleibt „＋ Zettel“, Stand klein daneben, bei vollen Plätzen Erklärung (KC-CLUB-PINNWAND-KNOPF)
{
  assert.ok(/\$\("pwNeuKnopf"\)\.innerHTML = `＋ Zettel <span class="pwStand/.test(html), "Pinnwand-Knopf heißt nicht immer „＋ Zettel“");
  assert.ok(!/\$\("pwNeuKnopf"\)\.textContent = PW\.meine >= PW\.max \? `\$\{PW\.max\}\/\$\{PW\.max\} Zettel`/.test(html), "alter Knopftext „4/4 Zettel“ ist noch da");
  assert.ok(/<div id="pwVollHinweis"><\/div>/.test(html) && /Für einen neuen erst einen eigenen abnehmen/.test(html), "Erklärung bei vollen Plätzen fehlt");
}

// 113. 0.92.0: Terminanfrage – jeder an jeden, mehrere oder Gruppe (KC-CLUB-TERMINANFRAGE)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v92_terminanfrage_standort.sql");
  assert.ok(/create table if not exists kc_club_terminanfragen/.test(mig) && /create table if not exists kc_club_terminanfrage_empfaenger/.test(mig), "Tabellen Terminanfrage fehlen");
  assert.ok(/alter table kc_club_terminanfragen enable row level security/.test(mig) && /alter table kc_club_terminanfrage_empfaenger enable row level security/.test(mig), "RLS Terminanfrage fehlt");
  const fall = (name) => server.slice(server.indexOf(`case "${name}"`), server.indexOf("case \"", server.indexOf(`case "${name}"`) + 10));
  assert.ok(!/nurVorstand/.test(fall("terminanfrage_senden")), "Terminanfrage muss für jedes Mitglied gehen");
  assert.ok(/zielPersonen\(ich, p\.an\)/.test(fall("terminanfrage_senden")), "Empfänger (Personen/Gruppe) werden nicht aufgelöst");
  assert.ok(/binTeilnehmer\(gruppe, ich\.person_id\)/.test(server), "Gruppe nur, wenn man selbst drin ist");
  assert.ok(/erstellt_von !== ich\.person_id\) throw/.test(fall("terminanfrage_absagen")), "Absagen nur durch den Absender");
  assert.ok(/\.eq\("person_id", ich\.person_id\)\.maybeSingle\(\)/.test(fall("terminanfrage_antwort")), "Antworten nur als Empfänger");
  // private Anfragen nie in der Treffen-Tabelle (sonst sähen alle sie)
  assert.ok(!/from\("kc_club_treffen"\)\.insert[^;]*anlass/.test(server), "Anfrage darf nicht in kc_club_treffen landen");
  assert.ok(/anfragen: anfragen\.filter/.test(server) && /UID:anfrage-/.test(server), "Kalender/Kalender-Abo ohne Anfragen");
  assert.ok(/club-terminanfrage-erinnerung/.test(server) && /club-terminanfrage-nachfass/.test(server), "Erinnerung am Vortag fehlt");
  assert.ok(/id="neuAnfrageKnopf"/.test(html) && /function taForm\(/.test(html) && /function taAntwort\(/.test(html), "App: Anfrage-Formular/Antwort fehlt");
  assert.ok(/knopf\("📨", "Termin"/.test(html), "Kommunikationszentrale: Knopf Termin fehlt");
  assert.ok(/"keine" : w/.test(html), "Antwort zurücknehmen (nochmal tippen) fehlt");
}

// 114. 0.92.0: Standort teilen – einmal oder live, nur an Gewählte, begrenzt, löschbar (KC-CLUB-STANDORT)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v92_terminanfrage_standort.sql");
  assert.ok(/create table if not exists kc_club_standort_live/.test(mig) && /alter table kc_club_standort_live enable row level security/.test(mig), "Tabelle/RLS Standort fehlt");
  assert.ok(/const STANDORT_MAX_MIN = 480;/.test(server), "Höchstdauer 8 Std. fehlt");
  const liste = server.slice(server.indexOf('case "standort_liste"'), server.indexOf('case "standort_liste"') + 900);
  assert.ok(/\.gt\("bis", jetzt\(\)\)/.test(liste) && /empfaenger\.cs\./.test(liste), "Standort-Liste: nur laufende und nur für Empfänger");
  assert.ok(/case "standort_ende": \{\s*await db\.from\("kc_club_standort_live"\)\.delete\(\)/.test(server), "Beenden muss sofort löschen");
  assert.ok(/from\("kc_club_standort_live"\)\.delete\(\)\.lt\("bis", jetzt\(\)\)/.test(server), "Wartung löscht abgelaufene Standorte nicht");
  assert.ok(!/protokoll\([^)]*standort[^)]*lat/.test(server), "Koordinaten dürfen nicht ins Protokoll");
  assert.ok(/knopf\("📍", "Standort"/.test(html) && /id="v-standort"/.test(html) && /function stBeenden\(/.test(html) && /id = "stBalken"/.test(html), "App: Standort-Knopf/Ansicht/Balken fehlt");
  assert.ok(/openstreetmap\.org/.test(html) && !/maps\.googleapis|api\.mapbox/.test(html), "Karte muss kostenlos (OpenStreetMap) sein");
  assert.ok(/h === "#standort"/.test(html), "Sprungziel #standort fehlt");
}

// 115. 0.92.0: Warte-Anzeige kennt die neuen Aktionen, Hintergrund-Abfragen bleiben still
{
  const still = /WARTEN_STILL = new Set\(\[([^\]]*)\]/.exec(html)?.[1] || "";
  assert.ok(["standort_update", "standort_liste", "terminanfragen_liste"].every((x) => still.includes(`"${x}"`)), "Hintergrund-Abfragen würden flackern");
}

// 116. 0.93.0: Fehlerprotokoll – Fänger ganz oben (ES5), anonym + angemeldet, Hilfe-Schritte, Problem melden, Admin-Ansicht
{
  const kopf = html.slice(0, html.indexOf("</head>"));
  const fp = (/<script>\s*\/\* KC-CLUB-FEHLERPROTOKOLL[\s\S]*?<\/script>/.exec(kopf) || [""])[0];
  assert.ok(fp, "Fehlerfänger muss im <head> vor der App stehen");
  assert.ok(html.indexOf("KC-CLUB-FEHLERPROTOKOLL (0.93.0) – läuft VOR") < html.indexOf('const API = "https://'), "Fehlerfänger muss vor dem App-Skript laufen");
  assert.ok(!/=>|\blet\b|\bconst\b|`/.test(fp.replace(/\/\*[\s\S]*?\*\//g, "")), "Fehlerfänger muss altes JavaScript (ES5) sein, sonst läuft er auf alten Geräten nicht");
  assert.ok(/window\.onerror/.test(fp) && /unhandledrejection/.test(fp) && /addEventListener\("error"[\s\S]*?, true\)/.test(fp), "Fehlerarten fehlen");
  assert.ok(/mehrfachstart/.test(fp) && /start_haengt/.test(fp) && /start_kaputt/.test(fp) && /speicher/.test(fp), "Start-Beobachtung fehlt");
  assert.ok(/fehler_anonym/.test(fp) && /fehler_melden/.test(fp), "anonym/angemeldet senden fehlt");
  assert.ok(/if \(a === "fehler_anonym"\)/.test(server) && server.indexOf('if (a === "fehler_anonym")') < server.indexOf("const ich = await anmelden(req);"), "anonyme Meldung muss vor der Anmeldung angenommen werden");
  assert.ok(/FP_ANONYM_JE_STUNDE/.test(server) && /FP_GERAET_JE_STUNDE/.test(server), "Grenzen gegen Missbrauch fehlen");
  assert.ok(/token\|key\|schluessel\|passwort/.test(server) && /\[\?&\]k=/.test(server), "Zugangsdaten müssen herausgefiltert werden");
  assert.ok(/case "hilfe_anfordern"/.test(server) && /case "fehlerprotokoll": \{\s*nurAdmin\(ich\)/.test(server), "Hilfe/Adminansicht auf dem Server fehlt");
  assert.ok(/catch \(e\) \{ fpApiFehler\(action, e\); throw e; \}/.test(html), "Serverfehler werden nicht protokolliert");
  assert.ok(/id: "ios_fremd"/.test(html) && /id: "ios_chrome"/.test(html) && !/nur in <b>Safari<\/b> richtig/.test(html) && /Teilen □↑/.test(html) && /id: "inapp"/.test(html) && /id: "privat"/.test(html) && /id: "mehrfach"/.test(html), "Hilfe-Schritte fehlen");
  assert.ok(/fpProblemMelden\(\)/.test(html) && /onclick="fpAdmin\(\)"/.test(html), "Problem melden / Admin-Knopf fehlt");
  assert.ok(/fpNeu\("alte_version"/.test(html) && /Jetzt aktualisieren<\/button>/.test(html), "alte Version: protokollieren + direkt aktualisieren");
}

// 117. 0.94.0: Nachricht antippen → Info-Fenster (KC-CLUB-NACHRICHT-INFO)
{
  const f = server.slice(server.indexOf('case "nachricht_details"'), server.indexOf('case "nachricht_details"') + 3200);
  assert.ok(/await binTeilnehmer\(m\.thread_id, ich\.person_id\)/.test(f), "Details nur für Teilnehmer der Unterhaltung");
  assert.ok(/darfWege = eigen \|\| ich\.admin/.test(f) && /if \(darfWege\)/.test(f), "Zustellwege nur für Absender/Admin");
  assert.ok(!/email: x\.email|x\?\.email \}/.test(f) && /"E-Mail-Empfänger"/.test(f), "Mail-Adressen dürfen nicht herausgegeben werden");
  // 0.97.0: Antippen öffnet das Nachrichten-Menü, „ℹ️ Details“ darin öffnet das Info-Fenster
  assert.ok(/nachrichtMenue\('\$\{m\.id\}'\)/.test(html) && /closest\('button,img,a,audio,video,\.sprache[^']*'\)/.test(html) && /nachrichtInfo\('\$\{id\}'\)">ℹ️ Details/.test(html), "Antippen → Menü → Details (nicht bei Bild/Knopf)");
  assert.ok(/function nachrichtInfo\(/.test(html) && /NI_SCHRITT/.test(html) && /meldet ein Postfach nicht zurück/.test(html), "Info-Fenster fehlt");
}

// 118. 0.95.0: Emoji-Auswahl im Chat (KC-CLUB-EMOJI)
{
  assert.ok(/id="emoKnopf"[^>]*onclick="emoUmschalten\(\)"/.test(html) && /id="emoFeld"/.test(html), "Emoji-Knopf/Feld fehlt");
  const gr = [...html.matchAll(/\{ sym: "[^"]+", name: "([^"]+)", liste: "([^"]+)"\.split\(" "\) \}/g)];
  assert.ok(gr.length === 7 && gr.every((g) => g[2].split(" ").length === 24), "7 Gruppen mit je 24 Emojis erwartet (übersichtlich)");
  assert.ok(/function emoEinfuegen\(/.test(html) && /selectionStart/.test(html) && /kc_club_emoji_zuletzt/.test(html), "Einfügen an der Schreibstelle / Zuletzt fehlt");
  assert.ok(/async function senden\(\) \{\s*emoUmschalten\(false\)/.test(html), "Senden schließt die Auswahl nicht");
}

// 119. 0.95.1: Neustart durch Update ist kein „mehrfach geöffnet“
{
  assert.ok(/localStorage\.setItem\("kc_club_neustart_update", "1"\)/.test(html) && /if \(!durchUpdate\) st\.push\(jetzt\)/.test(html), "Update-Neustart zählt als Mehrfachstart (Fehlalarm)");
}

// 120. 0.96.0: vierte LED „jemand online“ (KC-CLUB-ONLINE-LED), die drei Verbindungs-LEDs bleiben
{
  assert.ok(/<i class="led grau" id="ledStatus"><\/i><i class="led grau" id="ledComm"><\/i><i class="led daten" id="ledDaten"><\/i><i class="led-trenner"[^>]*><\/i><i class="led grau led-online" id="ledOnline"/.test(html), "vierte LED unter den drei vorhandenen fehlt");
  assert.ok(/event\.stopPropagation\(\);onlineBlatt\(\)/.test(html), "Antippen muss „Gerade online“ öffnen, nicht das Verbindungsfenster");
  assert.ok(/const an = ONL\.zeigen && frisch && n > 0;/.test(html) && /ONL\.stand = Date\.now\(\)/.test(html), "LED darf nur bei frischem Stand grün sein");
  assert.ok(/function onlineLeisteZeigen\(\) \{\s*onlineLedZeigen\(\);/.test(html), "LED wird bei jedem Online-Abgleich aktualisiert");
}
{
  assert.ok(/<i class="online-punkt versteckt" id="fussOnline"/.test(html) && /fu\.classList\.toggle\("versteckt", !an\)/.test(html), "Online-Punkt in der unteren Leiste (jede Ansicht) fehlt");
}

// 121. 0.97.0: Reaktionen, Antworten mit Zitat, @Erwähnungen (WhatsApp-Vergleich ⭐⭐⭐)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v97_reaktionen_erwaehnungen.sql");
  assert.ok(/create table if not exists kc_club_reaktionen/.test(mig) && /primary key \(message_id, person_id\)/.test(mig) && /on delete cascade/.test(mig), "Tabelle Reaktionen (eine je Person) fehlt");
  assert.ok(/create table if not exists kc_club_erwaehnungen/.test(mig) && /enable row level security/.test(mig), "Tabelle Erwähnungen/RLS fehlt");
  const rk = server.slice(server.indexOf('case "reaktion_setzen"'), server.indexOf('case "nachricht_loeschen"'));
  assert.ok(/await binTeilnehmer\(m\.thread_id, ich\.person_id\)/.test(rk) && /alt\?\.emoji === emoji/.test(rk), "Reaktion: nur Teilnehmer, gleiche nochmal = weg");
  assert.ok(/reply_to_message_id: antwortAuf/.test(server) && /b\.thread_id === threadId/.test(server), "Antwort nur auf Nachricht derselben Unterhaltung (vorhandene Spalte nutzen)");
  assert.ok(/filter\(\(id\) => id !== ich\.person_id && tnIds\.has\(id\)\)/.test(server) && /club-nachricht:\$\{m\.id\}:erwaehnt/.test(server), "Erwähnung: nur Teilnehmer, eigene Meldung");
  assert.ok(/reaktionen: reaktionen\(m\.id\)/.test(server) && /antwortAuf: bezug \?/.test(server) && /erwaehntMich:/.test(server), "Unterhaltung liefert Reaktionen/Zitat/Erwähnung nicht");
  assert.ok(/nachrichtMenue\('\$\{m\.id\}'\)/.test(html) && /const NA_SCHNELL = \["👍", "❤️", "😂", "😮", "😢", "🙏"\]/.test(html), "Menü mit Schnell-Reaktionen fehlt");
  assert.ok(/function naAntworten\(/.test(html) && /id="antwortLeiste"/.test(html) && /antwort_auf: NA\.antwort\.id/.test(html), "Antworten fehlt");
  assert.ok(/function naErwPruefen\(/.test(html) && /id="erwVorschlag"/.test(html) && /erwaehnt: naErwaehnteIds\(text\)/.test(html), "@Erwähnen fehlt");
  assert.ok(/function naText\(t\) \{[^\n]*\n\s*return esc\(t\)/.test(html), "Nachrichtentext muss weiter sicher (esc) ausgegeben werden");
}

// 122. 0.98.0: Weiterleiten, Nicht stören, Meine Geräte
{
  assert.ok(/if \(p\.weiterleiten_von\)[\s\S]{0,300}await binTeilnehmer\(q\.thread_id, ich\.person_id\)/.test(server) && /!ausQuelle\.has\(x\.id\)/.test(server), "Weiterleiten: Anhänge nur aus sichtbarer Quell-Nachricht");
  assert.ok(/function weiterleitenBlatt\(/.test(html) && /weiterleiten_von: m\.id/.test(html) && /↪️ Weitergeleitet/.test(html), "Weiterleiten in der App fehlt");
  assert.ok(/ruhezeit: \(w\) =>/.test(server) && /function inRuhezeit\(/.test(server) && /const ruhe = await ruhendePersonen\(personIds\.filter/.test(server) && /await ruhendePersonen\(personIds, !!opt\.erwaehnung\)/.test(server), "Ruhezeit muss in senden() und sendenGewaehlt() gelten");
  assert.ok(/club-ruhezeit:/.test(server) && /ruhezeit_verpasst/.test(server), "Sammelmeldung nach der Ruhezeit fehlt");
  assert.ok(!/async function routerSenden[\s\S]{0,400}ruhendePersonen/.test(server), "Ruhezeit darf Anrufe (routerSenden direkt) nicht blockieren");
  assert.ok(/\{ erwaehnung: true \}\)/.test(server), "@Erwähnungen dürfen die Ruhezeit (wenn eingestellt) durchbrechen");
  assert.ok(/id="ruheAn"/.test(html) && /function ruheSpeichern\(/.test(html), "Einstellung Nicht stören fehlt");
  assert.ok(/case "geraet_entfernen":[\s\S]{0,300}\.eq\("person_id", ich\.person_id\)/.test(server) && /function geraeteBlatt\(/.test(html), "Meine Geräte: nur eigene entfernen");
}
{
  const einfach = html.slice(html.indexOf('data-klappe="einfach" data-einfach'), html.indexOf('data-klappe="einfach" data-einfach') + 2500);
  assert.ok(/id="ruheAnE"/.test(einfach) && /geraeteBlatt\(\)/.test(einfach), "Nicht stören / Meine Geräte auch in der einfachen Ansicht");
}

// 123. 0.98.1: normaler Betrieb (30 s nach Anmeldung) setzt den Mehrfachstart-Zähler zurück
{
  assert.ok(/setTimeout\(\(\) => \{ try \{ localStorage\.setItem\("kc_club_starts", "\[\]"\); \} catch \{\} \}, 30000\)/.test(html), "Mehrfachstart-Zähler wird bei normalem Betrieb nicht zurückgesetzt (Fehlalarm)");
}

// 124. 0.99.0: Nutzungsstatistik ohne Namen (KC-CLUB-NUTZUNG)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v99_nutzung_ohne_namen.sql");
  const tab = /create table if not exists kc_club_nutzung \(([\s\S]*?)\);/.exec(mig)?.[1] || "";
  assert.ok(tab && !/person|geraet|user|ip/i.test(tab), "Tabelle darf keine Person/Gerät enthalten");
  assert.ok(/revoke all on function kc_club_nutzung_zaehlen[^;]*from public, anon, authenticated/.test(mig), "Zählen nur über den Server");
  const f = server.slice(server.indexOf('case "nutzung_melden"'), server.indexOf('case "nutzung_statistik"'));
  assert.ok(f && !/protokoll\(|ich\.person_id/.test(f), "Beim Zählen darf nicht gespeichert werden, wer");
  assert.ok(/NUTZUNG_BEREICHE\.has/.test(f) && /Math\.min\(200/.test(f), "nur bekannte Bereiche, gedeckelt");
  assert.ok(/case "nutzung_statistik": \{\s*nurAdmin\(ich\)/.test(server), "Statistik nur für den Admin");
  assert.ok(/nzZaehlen\(v\)/.test(html) && /function nzAdmin\(/.test(html), "App: Zählen/Ansicht fehlt"); // 0.99.2: Hinweissatz auf Wunsch entfernt
}

// 125. 1.0.0: private Kalendereinträge (KC-CLUB-PRIVATTERMIN)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v100_privattermine.sql");
  assert.ok(/create table if not exists kc_club_privattermine/.test(mig) && /enable row level security/.test(mig), "Tabelle/RLS private Termine fehlt");
  const f = (n) => server.slice(server.indexOf(`case "${n}"`), server.indexOf("case \"", server.indexOf(`case "${n}"`) + 10));
  assert.ok(/\.eq\("person_id", ich\.person_id\)/.test(f("privattermin_speichern")) && /person_id: ich\.person_id/.test(f("privattermin_speichern")), "Speichern nur eigene");
  assert.ok(/\.eq\("person_id", ich\.person_id\)/.test(f("privattermin_loeschen")), "Löschen nur eigene");
  assert.ok(!/nurVorstand/.test(f("privattermin_speichern")) && !/protokoll\(/.test(f("privattermin_speichern")), "jeder darf, ohne Inhalts-Protokoll");
  { const pl = server.slice(server.indexOf("async function privatListe("), server.indexOf("async function privatListe(") + 1400);
    assert.ok((pl.match(/from\("kc_club_privattermine"\)\.select\(felder\)\.eq\("person_id", ich\.person_id\)/g) || []).length === 2, "Liste nur eigene Einträge (Einzel und Reihen)"); }
  assert.ok(/privatListe\(ich, zeitraum\.von, zeitraum\.bis\)/.test(server) && /UID:privat-/.test(server) && /club-privat:/.test(server), "Kalender/Abo/Erinnerung fehlt");
  assert.ok(/onclick="neuTermin\(\)"/.test(html) && /function privatForm\(/.test(html) && /🔒 Privat<\/b> – nur ich sehe diesen Termin/.test(html), "App: Neu mit Häkchen Privat fehlt");
  assert.ok(/\$\("neuTreffenKnopf"\)\.classList\.remove\("versteckt"\)/.test(html), "„＋ Neu“ muss für alle sichtbar sein");
}

// 126. 1.1.0: Termine wiederholen (KC-CLUB-WIEDERHOLUNG)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v101_wiederholung.sql");
  assert.ok(/add column if not exists wiederholung text/.test(mig) && /ausnahmen date\[\]/.test(mig) && /erinnert_bis/.test(mig), "Spalten für Wiederholung fehlen");
  assert.ok(/function wiederholungen\(/.test(server) && /function berlinZuUtc\(/.test(server), "Wiederholungs-Rechnung (Ortszeit) fehlt");
  assert.ok(/privatListe[\s\S]{0,1500}wiederholungen\(r\.beginn/.test(server), "Reihen werden in der Liste nicht ausgerechnet");
  assert.ok(/nur_tag/.test(server) && /RRULE:/.test(server) && /EXDATE/.test(server), "Nur-diesen-Termin / Kalender-Abo-Regel fehlt");
  assert.ok(/const wdh = !p\.id && WDH\.includes/.test(server) && /club-treffen-reihe:/.test(server) && /höchstens ein Jahr/.test(server), "Club-Terminreihe mit Sammel-Einladung fehlt");
  assert.ok(/function wdhFelder\(/.test(html) && /wiederholung: \$\("ptWdh"\)\.value/.test(html) && /wiederholung: \$\("tfWdh"\)\.value/.test(html), "App: Auswahl Wiederholen fehlt");
  assert.ok(/function privatLoeschenReihe\(/.test(html), "App: nur diesen / ganze Reihe löschen fehlt");
}

// 127. 1.2.0: Archiv mit Ordnern, Registern und Jahreszahl (KC-CLUB-ARCHIV)
{
  const mig = lies("supabase/migrations/20260930_kc_club_v120_archiv.sql");
  assert.ok(/create table if not exists kc_club_archiv_ordner/.test(mig) && /create table if not exists kc_club_archiv_dokumente/.test(mig), "Archiv-Tabellen fehlen");
  assert.ok((mig.match(/enable row level security/g) || []).length === 2 && !/create policy/i.test(mig), "RLS an, keine Policies");
  assert.ok(/const darfArchivPflegen = \(ich: Ich\) => ich\.admin \|\| ich\.aemter\.includes\("Clubsprecher"\)/.test(server), "Pflegen: nur Clubsprecher und Admin");
  assert.ok(/const darfOrdnerSehen = \(ich: Ich, o: any\) => !o\.nur_vorstand \|\| ich\.vorstand/.test(server), "Vorstandsordner nur für Clubsprecher/Kassenwart/Admin");
  const f = (n) => server.slice(server.indexOf(`case "${n}"`), server.indexOf("case \"", server.indexOf(`case "${n}"`) + 10));
  // 1.5.0 (KC-CLUB-ARCHIV-PERSOENLICH): Pflege-Prüfung für Vereinsordner zentral in archivOrdnerHolen(…, "pflegen"/"hochladen")
  // (persönliche Ordner: nur der Besitzer) – jede Aktion prüft entweder selbst oder über diese Funktion.
  const holen = server.slice(server.indexOf("async function archivOrdnerHolen"), server.indexOf("async function archivDokHolen"));
  assert.ok(/if \(recht !== "lesen"\) nurArchivPflege\(ich\);/.test(holen), "archivOrdnerHolen: Pflege-Prüfung für Vereinsordner fehlt");
  for (const n of ["archiv_ordner_speichern", "archiv_ordner_loeschen", "archiv_hochladen", "archiv_aendern", "archiv_loeschen", "archiv_wiederherstellen"])
    assert.ok(/nurArchivPflege\(ich\)/.test(f(n)) || /archiv(Ordner|Dok)Holen\([^)]*"(pflegen|hochladen)"\)/.test(f(n)), `${n}: Rechteprüfung fehlt`);
  assert.ok(/const meins = \(o: any\) => o\.besitzer \? o\.besitzer === ich\.person_id : pflege && darfOrdnerSehen\(ich, o\)/.test(f("archiv_papierkorb")), "archiv_papierkorb: Rechteprüfung fehlt");
  assert.ok(/: darfOrdnerSehen\(ich, o\)\)/.test(f("archiv_liste")), "Liste muss Vorstandsordner filtern");
  assert.ok(/KC-CLUB-ARCHIV: Dokument in einem Ordner, den ich sehen darf/.test(server), "anlage_url: Archiv-Dokumente fehlen");
  assert.ok(/kc_club_archiv_ordner"\)\.update\(\{ geloescht_am: jetzt\(\)/.test(server) && /archiv_endgueltig_entfernt/.test(server), "Papierkorb/Wartung fehlt");
  assert.ok(/async function archivAuto\(ich: Ich\)/.test(server) && /if \(!ich\.protokolle\) return;/.test(server.slice(server.indexOf("async function archivAuto"))), "Automatischer Teil: Protokolle nur mit Recht");
  assert.ok(/\{ id: "archiv", sym: "🗄️", t: "Archiv"/.test(html) && /id="v-archiv"/.test(html) && /"standort", "archiv"(, "[a-z]+")*\]\.forEach/.test(html), "App: Kachel/Ansicht fehlt");
  assert.ok(/function arRuecken\(/.test(html) && /class="ar-register"/.test(html) && /class="schild"><span class="jahr">/.test(html), "App: Ordnerrücken mit Jahreszahl / Register fehlt");
  assert.ok(/id="arSuche"/.test(html) && /AR\.jahr=this\.value/.test(html) && /chip\("vorstand", "🔒 Nur Clubleitung"\)/.test(html), "App: Suche/Filter fehlt");
}

// 128. 1.3.0: Gruppen löschen (KC-CLUB-GRUPPE-LOESCHEN)
{
  const f = server.slice(server.indexOf('case "gruppe_loeschen"'), server.indexOf('case "gruppe_verlassen"'));
  assert.ok(/const \{ g, darfVerwalten \} = await gruppeHolen\(ich, p\.id\);\s*if \(!darfVerwalten\) throw/.test(f), "Löschen nur für Verwalter der Gruppe");
  assert.ok(f.indexOf('await geloescht(ich, "gruppe"') > 0 && f.indexOf('await geloescht(ich, "gruppe"') < f.indexOf('.delete()'), "Sicherung vor dem Löschen");
  assert.ok(/id="chatGruppeWeg" onclick="gruppeLoeschen\(\)"/.test(html) && /\$\("chatGruppeWeg"\)\.classList\.toggle\("versteckt", !g\?\.darfVerwalten\)/.test(html), "App: Knopf Gruppe löschen fehlt");
  assert.ok(/async function gruppeLoeschen\(\)[\s\S]{0,300}confirm\(/.test(html), "App: Rückfrage vor dem Löschen fehlt");
}

// 129. 1.4.0: globale Suche (KC-CLUB-SUCHE)
{
  const mig = lies("supabase/migrations/20261001_kc_club_v130_suche.sql");
  assert.ok(/create or replace function kc_club_norm/.test(mig) && /create or replace function kc_club_suche/.test(mig), "Suchfunktionen fehlen");
  assert.ok(/revoke all on function kc_club_suche\([^)]*\) from public, anon, authenticated/.test(mig), "Suche nur über den Server");
  assert.ok(/kc_communication_thread_participants tp on tp\.thread_id = m\.thread_id and tp\.person_id = p_person/.test(mig), "Nachrichten nur aus eigenen Unterhaltungen");
  assert.ok(/where pt\.person_id = p_person/.test(mig) && /\(not o\.nur_vorstand or p_vorstand\)/.test(mig) && /p_protokolle and not p_anhang/.test(mig), "Rechte: privat/Archiv/Protokolle");
  const f = server.slice(server.indexOf('case "suche"'), server.indexOf('case "', server.indexOf('case "suche"') + 10));
  assert.ok(f && /p_person: ich\.person_id, p_protokolle: ich\.protokolle, p_vorstand: ich\.vorstand/.test(f) && !/protokoll\(/.test(f), "Server: Rechte übergeben, Suchbegriff nie protokollieren");
  assert.ok(/length < 2\) return json\(\{ bereiche: \[\] \}\)/.test(f), "erst ab 2 Zeichen");
  assert.ok(/class="su-klein" id="suLupe" onclick="sucheAuf\(\)"[^>]*>🔍/.test(html) && /suLupenEinbauen\(\);/.test(html) && !/id: "suche"/.test(html), "App: kleine Lupe (keine Kachel)");
  assert.ok(/SU\.timer = setTimeout\(suJetzt, 300\)/.test(html) && /function suFilterZeigen\(/.test(html) && /Wo suchen\?/.test(html), "App: Live-Suche/Filter fehlt");
}

// 130. 1.4.1: Archiv-Suche live (KC-CLUB-ARCHIV-SUCHE)
{
  assert.ok(/if \(arSuchLang\(q\)\) return arSuchErgebnis\(q\);/.test(html) && /const arSuchLang = \(q\) => suNorm\(q\)\.replace\(\/\\s\/g, ""\)\.length >= 2;/.test(html), "Archiv: Live-Suche ab 2 Buchstaben");
  assert.ok(/function arPasstAlle\(q, \.\.\.felder\) \{ const n = suNorm\(/.test(html), "Archiv: Umlaut-tolerant wie globale Suche");
  assert.ok(/id="arOrdnerSuche"[^>]*oninput="AR\.ordnerSuche=this\.value;arOrdnerListe\(\)"/.test(html), "Archiv: Suche im Ordner fehlt");
  assert.ok(/t\.split\(muster\)\.map\(\(teil, i\) => i % 2 \? `<mark>\$\{esc\(teil\)\}<\/mark>` : esc\(teil\)\)/.test(html), "Markierung muss vor dem Escapen teilen");
}
