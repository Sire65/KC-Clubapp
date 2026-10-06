// Feature KC-CLUB-VERTRAG: statische Pruefung der Köcheclub-App (offline, ohne Server).
// Aufruf: node tests/app-vertrag.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const html = lies("index.html");
// 242. 1.66.0: Das App-Skript muss sich übersetzen lassen (z. B. kein doppelt vergebener Name wie „const SPR“) – sonst startet die App nicht
{
  const vm = await import("node:vm");
  const bloecke = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.ok(bloecke.length >= 1, "Skript-Blöcke gefunden");
  bloecke.forEach((code, i) => { try { new vm.Script(code, { filename: `index.html#script${i}` }); } catch (e) { assert.fail(`Skript ${i} lässt sich nicht übersetzen: ${e.message}`); } });
}

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
assert.ok(/history\.pushState\((st|\{ \.\.\.st, tiefe: tiefe \+ 1 \}),/.test(html), "Ansichten legen keinen Verlaufseintrag an"); // 1.98.0: mit Tiefe (Test 279)
for (const z of ["nachrichten", "mitglieder"]) assert.ok(html.includes(`<button class="mini" onclick="zeige('${z}')">`) || (z === "mitglieder" && html.includes(`<button class="mini" onclick="mgNurOnline()">`)) || (z === "nachrichten" && html.includes(`<button class="mini\${n ? " mini-neu" : ""}" onclick="zeige('nachrichten')">`)), `Kennzahl → ${z} fehlt`); // 1.22.0: orange bei Neuem // 1.91.0: Mitglieder-Kachel → Seite nur online (mgNurOnline zeigt „mitglieder“, Test 271)
// 0.27.2: „Nächstes Treffen“ führt über zumTreffen() in Termine (Kalender, Tag ausgewählt)
assert.ok((html.includes(`<button class="mini" onclick="zumTreffen()">`) || html.includes(`<button class="mini\${frist ? " mini-frist frist-" + frist : ""}" onclick="zumTreffen()">`)) && /function zumTreffen\(mitfahrt\) \{[\s\S]{0,400}zeige\("termine"\)/.test(html), "Kennzahl → termine fehlt");
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
    assert.ok(/frage\(/.test(body), `${fn}: keine Sicherheitsabfrage vor dem Löschen`);
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
  assert.ok(/case "anlage_hochladen": \{[\s\S]{0,500}?const r = await dateiAblegen\(/.test(server) /* 2.0.0: davor Speicher-Prüfung */, "Anlagen nutzen nicht den gemeinsamen Kern");
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
  assert.deepEqual(fb.feedbackPruefen({ gefallen: "👍 Ja", bedienung: "Quatsch", wuensche: ["🍲 Rezepte-Sammlung vom Club", "X", "🍲 Rezepte-Sammlung vom Club"], fremd: "a" }),
    { gefallen: "👍 Ja", wuensche: ["🍲 Rezepte-Sammlung vom Club"] }); // 1.73.0: Geburtstage sind umgesetzt → anderer Wunsch
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
  assert.ok(/onclick="fbNeu\(\)"/.test(html) && /fbRundeNeu\(/.test(html) && /frage\(/.test(html.slice(html.indexOf("async function fbNeu"), html.indexOf("async function fbAuswertung"))), "Knöpfe/Rückfrage fehlen");
}

// 48. 0.27.2: „Nächstes Treffen“ öffnet den Kalender im richtigen Monat mit ausgewähltem Tag
{
  const z = html.slice(html.indexOf("function zumTreffen(mitfahrt)"), html.indexOf("function kalHeute()"));
  assert.ok(/kalTagWahl = tag; termineArt = "kalender";/.test(z) && /kalM = \+tag\.slice\(5, 7\) - 1/.test(z), "Sprung zum Treffen-Tag fehlt");
  assert.ok(/onclick="zumTreffen\(\)">(?:\$\{frist \? '<svg class="ameisen" aria-hidden="true"><rect width="100%" height="100%" rx="16"\/><\/svg>' : ""\})?<b style="font-size:1\.05rem">\$\{bisTreffen\}/.test(html), "Kachel „Nächstes Treffen“ springt nicht zum Tag"); // 1.53.6: optional Ameisenstraße davor
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
  // 2.3.0: zusätzlich ohne Inkognito-Admin (KC-CLUB-INKOGNITO)
  assert.ok(/filter\(\(id: string\) => zeigen\.get\(id\) !== false(\)| && !inko\.has\(id\)\)| && \(mitInkognito \|\| !inko\.has\(id\)\)\)\))/.test(server), "Verborgene erscheinen als online");
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
  // 1.91.0 (KC-CLUB-ONLINE-SEITE, Wunsch Hansi): die Zahl im Kopf öffnet die Mitglieder-Seite nur online (dort 💬/👋 je Mitglied);
  // das Online-Fenster mit Anklopfen/Direkt bleibt über Schnellzugriff „👋 Online“ und die Suche
  assert.ok(/onclick="event\.stopPropagation\(\); (onlineBlatt|mgNurOnline)\(\)"/.test(html) && /function onlineBlatt\(\)[\s\S]{0,900}anklopfen\('\$\{x\.person_id\}'\)[\s\S]{0,500}direkt\('\$\{x\.person_id\}'\)/.test(html), "„online“ antippen zeigt keine Liste mit Direktkontakt");
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
  assert.ok(/const warte = wartenStart\(action, opt\.warten\);\s*try \{[^]{0,1400}\n  finally \{ if \(warte\) wartenEnde\(\); \}/ /* 2.0.0: api() etwas länger (Notbetrieb nur Lesen) */ /* 0.93.0: catch nur zum Protokollieren, wirft weiter */.test(html), "Kochmütze wird bei Fehlern nicht ausgeblendet");
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
  assert.ok(/if \(!\(await frage\(/.test(weg) && /fuerAlle \? "unterhaltung_loeschen" : "unterhaltung_ausblenden"/.test(weg), "Entfernen ohne Rückfrage");
  assert.ok(/ICH\?\.admin \? `<button class="knopf klein" onclick="unterhEntfernen\('\$\{u\.id\}', true\)"/.test(html), "„Für alle löschen“ nicht auf Admin beschränkt");
}

// 65. 0.42.0: Info-Feld blätterbar (Registry, Pfeile, Punkte, Wischen) + Wetter (Adapter/Registry, nur Admin stellt ein, Rule 11)
{
  const ids = [...html.slice(html.indexOf("const INFO_ALLE = ["), html.indexOf("];", html.indexOf("const INFO_ALLE = ["))).matchAll(/id: "([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["treffen", "schnellstart", "wetter", "fuerdich", "demnaechst", "fotos", "zentrale", "admin"], "Info-Felder falsch (1.8.1: + schnellstart)");
  assert.ok(/class="ipfeil links( mit-sprung)?"[^>]*onclick="infoBlaettern\(-1\)"/.test(html) && /onclick="infoBlaettern\(1\)"/.test(html) && /class="ipunkt\$\{i === INFO_I \? " an" : ""\}"/.test(html), "Pfeile/Punkte fehlen");
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
  assert.ok(/api\("nachricht_senden"/.test(zs) && /n >= ZE_RUECKFRAGE_AB && !\(await frage/.test(zs), "Zentrale sendet nicht über den vorhandenen Weg oder ohne Rückfrage");
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
  assert.ok(/async function adminSpiegeln\(\) \{\s*if \(!\(await frage\(/.test(html), "Notfall-Spiegel ohne Rückfrage");
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
  assert.ok(/api\("init", \{[^}]*\}, \{ warten: !!vonHand \}\)/.test(html), "Aktualisieren ohne Kochmütze"); // 2.22.12: init bekommt fotosSeit/dienstSeit
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
  assert.ok(/tippenMelden\(\)(;entwurfMerken\(\))?(;entwurfMarkeZeigen\(\))?"><\/textarea>/.test(html) && /id="tipptAnzeige"/.test(html) && /"tippen"(, "[a-z_]+")*\]\);/.test(html), "Anzeige/Eingabe/WARTEN_STILL fehlt");
  assert.ok(/tipptZeigen\(u\.tippt \|\| \[\], u\.entwurf \|\| \[\](, u\.spricht \|\| \[\])?\);( chatAbstand\(\);)?\n    if \(u\.tippt\?\.length && andere\.length === 1\)[^\n]*\n    const stand = /.test(html), "Anzeige muss vor dem frühen Ausstieg aktualisiert werden");
  assert.ok(/if \(chatTakt\.laeuft( \|\| document\.hidden)?\) return;/.test(html) && !/setInterval\(chatTakt, 4000\)/.test(html), "Chat-Takt überlappt / alter Takt");
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
  assert.equal((server.match(/anmeldungenVergessen\(\);/g) || []).length, 5, "Zugang/Rollen/Büro-Rechte ändern leert den Speicher nicht"); // 1.96.0: +1 Übernahme des vorgemerkten Links
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
  assert.ok(/setInterval\(pwLive, PW_LIVE_MS\)/.test(html) && /api\("pinnwand_neu"\)/.test(html) && /"pinnwand_neu"(, "[a-z_]+")*\]\);/.test(html) && /\["pinnwand", "📌 Neue (Post-its|Zettel) an der Pinnwand"\]/.test(html), "App: Live-Abfrage/Einstellung fehlt");
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
  assert.ok(/\.\.\.\(ich\.admin \? \{[^\n]*fehler: fehler\.get\(m\.person_id\) \?\? null[,}]/.test(server) && /if \(ich\.admin\) \{[\s\S]{0,1400}\{ data: fx \}/.test(server), "Server gibt Fehler an Nicht-Admins");
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
  assert.ok(/const EINFACH_KACHELN = \["termine", "kommunikation", "pinnwand", "meindienst", "mitglieder"(, "dokumente")?(, "spiele")?(, "sos")?\];/.test(html) && /const kacheln = \(r\) => einfach\(\) \? einfachKacheln\(\) : kaSortiert/.test(html), "Einfache Startseite fehlt");
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
  assert.ok(/const PW_FRISTEN_STANDARD = \{ erinnernTage: 3, pauseTage: 7 \};/.test(html) && /if \(!gezeigt && !nurZaehlen && !pwErinnern\(\)( && !einstiegPruefen\(\)( && !einrichtenEinmal\(\))?\) tippDesTages\(\);|\) einstiegPruefen\(\);)/.test(html), "Erinnerung beim Start fehlt"); // 1.87.0: Einrichtungs-Assistent (einmal je Gerät) vor dem Tipp des Tages
  const e = html.slice(html.indexOf("function pwErinnern()"), html.indexOf("async function pwLaden()"));
  assert.ok(/z\.vonMir && jetzt - new Date\(z\.erstellt_am\)\.getTime\(\) >= PW_ERINNERN_TAGE \* 86400000/.test(e) && /bis\[z\.id\]/.test(e), "nur eigene, alte, nicht zurückgestellte Zettel");
  assert.ok(/hängt noch an der Pinnwand\./.test(e) && /Möchtest du \$\{liste\.length === 1 \? "(es|ihn)" : "sie"\} abnehmen\?/.test(e) /* 1.98.0: „Zettel“ → ihn */ && /api\("pinnwand_abnehmen"/.test(e), "Text/Abnehmen fehlt");
  assert.ok(/document\.querySelector\("\.blatt:not\(\.versteckt\)"\)\) return/.test(e), "Erinnerung könnte über anderen Fenstern aufgehen");
}

// 87. 0.65.0: Admin-Einstellungen als Klappbereich mit Schloss + Pinnwand-Fristen (KC-CLUB-ADMIN-EINSTELLUNGEN / -PINNWAND-FRISTEN)
{
  const bereich = html.slice(html.indexOf('id="adminBereich"'), html.indexOf('data-klappe="app"'));
  for (const k of ["admin_pinnwand", "admin_erstattung", "admin_wetter"]) assert.ok(bereich.includes(`data-klappe="${k}"`), `Admin-Klappbereich ${k} fehlt im Admin-Bereich`);
  assert.ok(/<details class="karte versteckt" data-klappe="admin" data-einfach id="adminBereich">/.test(html) && /\$\("adminBereich"\)\.classList\.remove\("versteckt"\)/.test(html), "Admin-Bereich (auch einfach, nur Admin) fehlt");
  assert.ok(/wurzel\.querySelectorAll\("details\[data-klappe\]:not\(\[data-klappe-an\]\)"\)/.test(html) && /function klappenMerken\(wurzel = document\)/.test(html) && /details\.karte:not\(\[open\]\) > summary \.pfeil/.test(html), "Schloss/Pfeil je Bereich");
  const fs = server.slice(server.indexOf('case "pinnwand_fristen_setzen"'), server.indexOf('case "wetter_setzen"'));
  assert.ok(/nurAdmin\(ich\);/.test(fs) && /protokoll\(ich\.person_id, "pinnwand_fristen_gesetzt"/.test(fs) && /PINNWAND_FRISTEN_GRENZEN = \{ erinnernTage: \[1, 30\], pauseTage: \[1, 60\] \}/.test(server), "Fristen: nur Admin, Grenzen, Protokoll");
  assert.ok(/pinnwandFristen: pwFristen[,}]/.test(server) && /const pwFristen = \(\) => \(\{ \.\.\.PW_FRISTEN_STANDARD, \.\.\.\(INIT\?\.pinnwandFristen \|\| \{\}\) \}\);/.test(html), "Fristen kommen nicht vom Server");
}

// 88. 0.66.0: aktive Ansicht hinter „Schnellzugriff“ (KC-CLUB-ANSICHT-NAME)
{
  // 0.69.0: Ansichtsname ist ein Knopf und schaltet auf die andere Ansicht
  assert.ok(/<h3>(?:Schnellzugriff|<button type="button" class="sz-link"[^>]*>Schnellzugriff<\/button>) <button type="button" class="ansichtname ein" onclick="ansichtWechseln\(\)"[^>]*>&gt; Einfache Ansicht &lt;<\/button><button type="button" class="ansichtname erw" onclick="ansichtWechseln\(\)"[^>]*>&lt; Erweiterte Ansicht &gt;<\/button><\/h3>/.test(html), "Ansichtsname fehlt / schaltet nicht um");
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
  assert.ok(/nurOnline = (\(MG_EINMAL \|\| MG_FILTER\)|MG_FILTER) === "online" && sichtbar/.test(html) && /MITGLIEDER\.filter\(\(m\) => m\.online\)/.test(html) && /ONLINE_SICHTBAR = r\.onlineSichtbar !== false/.test(html), "Filter / Online-Privatsphäre");
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
  const run = (liste) => { setze(liste); return new Function("fetch", "performance", "vbStart", "vbEnde", "API", "KEY", "APP_VERSION", "$", "setTimeout", "notErnstfall", code + "; REGION_AUS_BIS = " + (globalThis.__mitRegion ? 0 : 1e15) + "; return apiRoh('init');")(fetchT, { now: () => 0 }, () => {}, () => {}, "x", "k", "v", () => ({ classList: { add() {}, remove() {} } }), (f) => f(), () => false); }; // 1.54.1: keine Ernstfall-Simulation
  const ok1 = await run([{ s: 503 }, { s: 200, j: { ok: 1 } }]);
  assert.ok(ok1.ok === 1 && aufrufe === 2, "503 ohne Antwort wird nicht wiederholt");
  await run([{ s: 503 }, { s: 503 }]).then(() => assert.fail("zweimal 503 muss Fehler sein"), (e) => assert.ok(/kurz nicht erreichbar/.test(e.message) && aufrufe === 2, "höchstens ein Wiederholversuch / Meldung"));
  await run([{ s: 502 }, { s: 200, j: {} }]).then(() => assert.fail("502 darf nicht wiederholt werden"), () => assert.equal(aufrufe, 1, "502 wiederholt"));
  await run([{ s: 503, j: { error: "Wartung" } }]).then(() => assert.fail(), (e) => assert.ok(e.message === "Wartung" && aufrufe === 1, "Programm-503 (mit Meldung) wiederholt"));
  // 1.16.0 KC-CLUB-NAHE-REGION: über die Region ein 502 → genau ein Versuch über den Standardweg (danach wie bisher)
  globalThis.__mitRegion = true;
  const ok2 = await run([{ s: 502 }, { s: 200, j: { ok: 2 } }]); assert.ok(ok2.ok === 2 && aufrufe === 2, "Region gestört: Standardweg");
  globalThis.__mitRegion = false;
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
  assert.ok(/datei: "dokumente\/Kurzanleitung_Bilderrechner_V4\.pdf"/.test(html) && fs.existsSync(new URL("../dokumente/Kurzanleitung_Bilderrechner_V4.pdf", import.meta.url)), "Bilderrechner-PDF fehlt");
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
  assert.ok(/push\.zustand === "stoerung" \|\| email\.zustand === "stoerung"/.test(cs) && /bericht\?\.success_rate != null && Number\(bericht\.success_rate\) < 90/.test(cs), "echte Störungen bleiben gelb"); // 1.97.0: fehlende Quote ≠ 100 % (Test 278)
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
  assert.ok(/if \(bisher && bisher === a\) \{ if \(!\(await frage\(/.test(html) && /a = "keine";/.test(html) && /if \(a === "nein" \|\| a === "keine"\)/.test(html) && /Nochmal auf deine Antwort tippen = zurücknehmen/.test(html), "App: nochmal tippen nimmt zurück, Platzfrage");
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
  assert.ok(/ECHTER ANRUF – KEIN TEST/.test(sos) && /if \(!\(await frage\(/.test(sos), "Notruf nur nach Sicherheitsabfrage");
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
  const nfp = html.slice(html.indexOf("// ---------- KC-CLUB-NOTFALLPASS"), html.indexOf("// ---------- KC-CLUB-NOTFALLPASS-ARCHIV")); // 1.17.0: Kopie ins Archiv nur auf ausdrücklichen Wunsch (Abschnitt 147)
  assert.ok(/const NFP_FELDER = \[/.test(nfp) && /"kc_club_notfallpass_" \+ \(ICH\?\.person_id/.test(nfp), "Notfallpass: Registry + Speicher je Person");
  assert.ok(!/api\(/.test(nfp), "Notfallpass: Gesundheitsdaten nie an den Server");
  assert.ok(/frage\("Notfallpass auf diesem Gerät löschen\?"\)/.test(nfp) && /id="nfpBlatt"/.test(html), "Notfallpass: Löschen mit Rückfrage, Blatt vorhanden");
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
  assert.ok(/\.na-seite \.na-info \{ background: #(1e88e5|1565c0)/.test(html), "i ist blau"); // 1.22.2: dunkleres Blau für Kontrast
}

// 138. 1.9.0: Bearbeiten, Stummschalten, Suche im Chat
{
  const nb = server.slice(server.indexOf('case "nachricht_bearbeiten"'), server.indexOf('case "', server.indexOf('case "nachricht_bearbeiten"') + 10)); // 1.22.1: nur dieser Abschnitt
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

// 140. 1.11.0: Abstand unten, Wellen-Punkte, Sprachaufnahme-Anzeige mit Oszilloskop
{
  assert.ok(/padding: 8px 0 var\(--chatUnten, 160px\)/.test(html) && /function chatAbstand\(\)/.test(html) && /new ResizeObserver\(chatAbstand\)/.test(html), "Abstand unten gemessen");
  assert.ok(/@keyframes tippWelle/.test(html) && /\.punkte3 i \{ width: 9px; height: 9px/.test(html), "Punkte größer + Welle");
  const ti = server.slice(server.indexOf('case "tippen"'), server.indexOf('case "nachricht_senden"'));
  assert.ok(/const art = p\.sprache \? "sprache" : "text"/.test(ti) && /text: art === "sprache" \? null : text, art/.test(ti), "Server: Sprachaufnahme ohne Text");
  assert.ok(/const spricht = \(tippen \?\? \[\]\)\.filter\(\(x: any\) => x\.art === "sprache"\)/.test(server), "Server liefert spricht");
  assert.ok(/function sprichtMelden\(\) \{\n  if \(!SPR \|\| !chatId \|\| !ONL\.zeigen\) return;/.test(html) && /getByteTimeDomainData/.test(html) && /osziStopp\(\); if \(s\.meldeId\) api\("tippen", \{ id: s\.meldeId, aus: true \}\)/.test(html), "App: melden nur bei Online-Status, echtes Oszilloskop, Ende meldet ab");
  const mig = lies("supabase/migrations/20261001_kc_club_v1110_spricht.sql");
  assert.ok(/add column if not exists art text not null default 'text'/.test(mig), "Migration additiv");
}

// 141. 1.12.0: ruhige Eingabe, Neue-Nachrichten-Linie, Entwurf, ⬇️, Sprachtempo
{
  assert.ok(/<div class="zustell versteckt" id="zustell"><\/div>/.test(html) && /id="zustellKnopf"[^>]*onclick="zustellUmschalten\(\)">🔔/.test(html), "Benachrichtigen-Leiste hinter 🔔");
  assert.ok(/gelesenBis = \(tn \?\? \[\]\)\.find\(\(x: any\) => x\.person_id === ich\.person_id\)\?\.last_read_at/.test(server) && server.indexOf("const gelesenBis") > server.indexOf('update({ last_read_at: jetzt() }).eq("thread_id", id)'), "Server: Lesestand vor dem Öffnen (aus der vorher geladenen Liste)");
  assert.ok(/class="neu-trenner" id="neuTrenner"/.test(html) && /NA\.trennerSprung = !!NA\.trennerVor/.test(html), "Linie + Sprung");
  assert.ok(/function entwurfMerken\(\)/.test(html) && /tippenMelden\(\);entwurfMerken\(\)(;entwurfMarkeZeigen\(\))?"/.test(html) && /if \(chatId\) entwurfWeg\(chatId\)/.test(html), "Entwurf merken/löschen");
  assert.ok(/neuVonAnderen && !weitOben\(\)/.test(html) && /id="nachUnten"/.test(html), "⬇️ + kein Herunterreißen");
  assert.ok(/const SPRACH_TEMPI = \[1, 1\.5, 2\]/.test(html) && /a\.playbackRate = t/.test(html), "Sprachtempo");
  assert.ok(/m\.umfrage\?\.optionen\.map\(\(o\) => o\.stimmen/.test(html) && /NA\.idStand !== idStand/.test(html), "Neuzeichnen bei Stimmen/Bearbeitung, Ton nur bei neuen Nachrichten");
}

// 142. 1.13.0: DP2 Build 251 Button-Logik (unverändert übernommen) + offene Club-App-Angaben zählen als eigene Daten
{
  const q = JSON.parse(lies("dp2/QUELLE.json"));
  assert.ok(/^(f893f5d|c0d279a|d50ed58|3945960|ae349c0|51518cc|37bd067)/.test(q.commit) && /^0\.20\.0-build25[134567]$/.test(q.dp2Version) && q.reihenfolge.includes("src/ui/member-button-logic.js"), "DP2 Build 251 (ab 1.17.2: Build 253 RC) mit Button-Logik übernommen");
  const d = lies("dp2-club/daten.js");
  assert.ok(/status: "confirmed", source: "club_app"/.test(d) && /K\.wishes = \[\.\.\.\(D\.meine\?\.entries \|\| \[\]\)\.map/.test(d), "Eingangs-Angaben (auch Status offen) zählen in DP2 als eigene aktive Wünsche");
}

// 143. 1.14.0: Sicherheits-Check (KC-CLUB-SICHERHEIT)
{
  const mig = lies("supabase/migrations/20261001_kc_club_v1140_sicherheit.sql");
  assert.ok(/revoke all on function public\.kc_club_sicherheit_status\(\) from public, anon, authenticated/.test(mig) && /grant execute on function public\.kc_club_sicherheit_status\(\) to service_role/.test(mig), "SQL-Funktion nur für den Server");
  const sp = server.slice(server.indexOf('case "sicherheit_pruefen"'), server.indexOf('case "nachricht_ausblenden"'));
  assert.ok(/if \(error \|\| !s0\)[^\n]*schutz: null, spiegel: null/.test(sp) && /typeof min === "number" \? min <= grenze : null/.test(sp), "Server: fehlende Werte = null (nie OK)");
  assert.ok(!/supabase|neon|postgres|backblaze|amazon|aws/i.test(html.slice(html.indexOf("const SICHERHEIT_PRUEFUNGEN"), html.indexOf("const SI_UHREN"))), "Keine Datenbank-/Anbieternamen in der Prüfreihe");
  assert.ok(/!schlecht && !offen\n      \? `<div class="si-ergebnis si-gut"><span class="gross">✅<\/span><div><b>Alle Systeme laufen einwandfrei/.test(html), "„Alle Systeme laufen einwandfrei“ nur wenn nichts schlecht und nichts offen");
  assert.ok(/w === false \? "Achtung" : "nicht geprüft"/.test(html), "Unbekannt wird als „nicht geprüft“ angezeigt");
  assert.ok(/\{ id: "sicherheit", sym: "🛡️", t: "Sicherheits-Check"/.test(html) && /"sos", "sicherheit"[,\]]/.test(html), "Kachel im Reiter Programme + Ansicht");
}

// 144. 1.15.0: Sicherheits-Check an Admin senden
{
  const sm = server.slice(server.indexOf('case "sicherheit_melden"'), server.indexOf('case "nachricht_ausblenden"'));
  assert.ok(/db\.rpc\("kc_club_sicherheit_status"\)/.test(sm) && /await adminIds\(\)/.test(sm) && /"fehler_sicherheit"/.test(sm) && /\(count \?\? 0\) >= 3\) throw/.test(sm), "Server prüft neu, an Admins, Fehlerprotokoll, Bremse");
  assert.ok(/onclick="sicherheitMelden\(\)">📨 Ergebnis an (Hansi|\$\{adminName\(\)\}) \(Admin\) senden/.test(html) /* 1.99.0: Admin-Name */, "Knopf vorhanden");
}

// 145. 1.16.0: Server neben der Datenbank (mit Rückweg) + paralleles Zählen
{
  assert.ok(/const SERVER_REGION = "eu-west-2"/.test(html) && /forceFunctionRegion=\$\{SERVER_REGION\}/.test(html), "Region festgelegt");
  assert.ok(/if \(mitRegion && navigator\.onLine\) \{ REGION_AUS_BIS = Date\.now\(\) \+ REGION_PAUSE_MS;[^\n]*return apiRoh\(/.test(html) && /mitRegion && r\.status >= 502 && r\.status <= 504/.test(html), "Rückweg bei Region-Störung (Regel 12)");
  const l = lies("dp2-club/lader.js");
  assert.ok(/forceFunctionRegion=eu-west-2/.test(l) && /if \(!r\) r = await anfrage\(API\)/.test(l), "Dienstwunsch-Lader mit Rückweg");
  assert.ok(/const zahlen = await Promise\.all\(\(teil \?\? \[\]\)\.map/.test(server), "init zählt gleichzeitig");
}

// 146. 1.16.1: DP2-Nachtrag + Cache-Schlüssel mit Commit
{
  assert.ok(/^(c0d279a|d50ed58|3945960|ae349c0|51518cc|37bd067)/.test(JSON.parse(lies("dp2/QUELLE.json")).commit), "Nachtrag c0d279a übernommen (ab 1.17.2 im gemeinsamen Stand d50ed58 enthalten)");
  assert.ok(/quelle\.dp2Version \+ "-" \+ String\(quelle\.commit \|\| ""\)\.slice\(0, 7\)/.test(lies("dp2-club/lader.js")), "Cache-Schlüssel mit Commit");
}

// 147. 1.17.0: Notfallpass ins eigene Archiv kopieren (KC-CLUB-NOTFALLPASS-ARCHIV)
{
  const f = html.slice(html.indexOf("async function nfpArchivWahl()"), html.indexOf("async function nfpArchivKopieren()") + 1200);
  assert.ok(/onclick="nfpArchivWahl\(\)">🗄️ In mein Archiv kopieren/.test(html), "Knopf in der Notfallpass-Anzeige fehlt");
  assert.ok(/if \(!\(await frage\("🗄️ Notfallpass ins Archiv kopieren\?[^"]*Server[^"]*Spiegel[^"]*Sicherungen/.test(f), "Warnhinweis Server/Spiegel/Sicherung vor dem Kopieren");
  assert.ok(f.indexOf("frage(") < f.indexOf('api("archiv_liste")'), "erst Rückfrage, dann Server");
  assert.ok(/const nfpEigeneOrdner = \(d\) => \(d\?\.ordner \|\| \[\]\)\.filter\(\(o\) => o\.besitzer && o\.eigen\)/.test(html), "nur eigene Ordner als Ziel");
  assert.ok(/<select id="nfpArOrdner"/.test(f) && /<select id="nfpArReg">/.test(f), "Ordner und Register per Auswahl (kein Freitext)");
  assert.ok(/api\("archiv_hochladen", \{ ordner_id, titel: `Notfallpass \(Stand \$\{stand\}\)`[\s\S]{0,200}mime: "image\/png"/.test(f), "vorhandener Upload-Weg als PNG");
  assert.ok(!/case "notfallpass/.test(server), "kein eigener Serverweg");
  const ar = html.slice(html.indexOf("// ---------- KC-CLUB-NOTFALLPASS-ARCHIV"), html.indexOf("// ---------- KC-CLUB-WISCHEN"));
  assert.deepEqual([...ar.matchAll(/api\("(\w+)"/g)].map((m) => m[1]), ["archiv_liste", "archiv_hochladen"], "Archiv-Kopie: nur Liste + Upload, sonst nichts an den Server");
  assert.ok(!/localStorage\.(setItem|removeItem)/.test(f), "Pass auf dem Gerät bleibt unverändert");
}

// 148. 1.17.1: Kochmütze auf dem Archiv-Ordner (KC-CLUB-ARCHIV-MUETZE)
{
  const r = html.slice(html.indexOf("function arRuecken(o)"), html.indexOf("const arBisText"));
  assert.ok(/<img class="muetze" src="kc-kochmuetze-weiss\.webp" alt=""><span class="loch"><\/span><\/button>/.test(r), "Kochmütze auf jedem Ordnerrücken");
  assert.ok(/<div class="ar-kopf"[\s\S]{0,400}<img class="muetze" src="kc-kochmuetze-weiss\.webp" alt="">/.test(html), "Kochmütze im Ordnerkopf");
  assert.ok(/"kc-kochmuetze-weiss\.webp"/.test(lies("sw.js")), "Bild im Offline-Speicher");
}

// 149. 1.17.2: DP2 Build 253 RC (dp3 d50ed58) – gemeinsamer Stand aus Club-App-Schnittstelle und PDF-/QR-Korrekturen
{
  const q = JSON.parse(lies("dp2/QUELLE.json"));
  assert.ok(/^(d50ed58|3945960|ae349c0|51518cc|37bd067)/.test(q.commit) && /^0\.20\.0-build25[34567]$/.test(q.dp2Version), "DP2 Build 253 RC (d50ed58) oder neuer übernommen");
  for (const f of ["src/core/document-identity.js", "src/vendor/qrcode-generator.js", "src/core/personalized-forms.js", "src/adapters/pdf.js", "src/ui/member-button-logic.js"])
    assert.ok(q.reihenfolge.includes(f), `${f} fehlt in der DP2-Übernahme`);
  assert.ok(q.reihenfolge.indexOf("src/adapters/pdf.js") < q.reihenfolge.indexOf("src/ui/original-brand.js") || !q.reihenfolge.includes("src/ui/original-brand.js"), "PDF-Baustein vor dem Abschluss geladen");
  assert.ok(/kc-original-kochmuetze\.png/.test(lies("dp2/src/adapters/pdf.js")) && Object.keys(q.dateien).includes("assets/kc-original-kochmuetze.png"), "Original-Kochmütze für die Papiermatrix mitgeliefert");
}

// 150. 1.18.0: Archiv-Ablage nach Erstattung + wirbelnde Kochmütze im Sicherheits-Check
{
  const f = html.slice(html.indexOf("// ---------- KC-CLUB-ARCHIV-ABLAGE"), html.indexOf("// ----- KC-CLUB-ARCHIV-PERSOENLICH"));
  assert.ok(/const ARCHIV_ABLAGE_ARTEN = \{\s*erstattung: \{ sym: "💶", register: \["Rechnungen", "Sonstiges"\]/.test(f), "Registry der Ablage-Anlässe");
  // 1.19.0: dazu nur lesende, vorhandene Wege für Dateien aus Nachrichten/Protokollen (anlage_url) und Fotos (foto_oeffnen)
  assert.ok([...f.matchAll(/api\("(\w+)"/g)].every((m) => ["archiv_liste", "archiv_hochladen", "anlage_url", "foto_oeffnen"].includes(m[1])), "nur vorhandene Archiv-/Lese-Wege");
  assert.ok(/const ordner = nfpEigeneOrdner\(d\)/.test(f) && /<select id="ablOrdner"/.test(f) && /<select id="ablReg">/.test(f), "nur eigene Ordner, Auswahl statt Freitext");
  assert.ok(/onclick="einmal\(this, ablAblegen\)">🗄️ \$\{esc\(ja \|\| "Ja, ablegen"\)\}/.test(f) && /onclick="ablNein\(\)">\$\{esc\(nein \|\| "Nein, danke"\)\}/.test(f), "Rückfrage mit Ja/Nein (1.19.0: Texte je Anlass)");
  const s = html.slice(html.indexOf("async function erstattungSenden()"), html.indexOf("// KC-CLUB-KMSATZ (0.39.0): Admin"));
  assert.ok(s.indexOf('api("erstattung_senden"') < s.indexOf("erstattungAblageFragen(kopie, r)"), "Ablage erst nach erfolgreichem Versand");
  assert.ok(/positionen: ERS\.pos\.map\(\(\{ belegNamen, belegDateien, satz, \.\.\.x \}\) => x\)/.test(s), "Beleg-Dateien gehen nicht mit dem Antrag an den Server");
  // 1.19.0 (Hinweis Hansi „hakt, zu unruhig“): zwei Ebenen statt Achsen-Sprünge, langsamer, Phase läuft beim Neuzeichnen weiter
  assert.ok(/\.si-muetze \{[^}]*animation: siAchse 14s linear infinite; animation-delay: var\(--si2/.test(html) && /\.si-muetze > span \{[^}]*animation: siKippen 5s linear infinite; animation-delay: var\(--si1/.test(html), "Kochmütze: Kippen + wandernde Achse, ruhig");
  assert.ok(!/siWirbel|rotate3d/.test(html), "keine harten Achsen-Sprünge mehr");
  // Hinweis Hansi „obere Mütze ruckelt“: Bereiche statt Komplett-Neuzeichnen – laufende Mützen bleiben unangetastet
  assert.ok(/if \(\$\("siKopf"\)\.dataset\.key !== kopfKey\)/.test(html) && /if \(lis\[i\]\.dataset\.key !== z\.key\)/.test(html), "Sicherheits-Check: nur Geändertes neu zeichnen");
  assert.ok(/const siMuetze = [\s\S]{0,120}performance\.now\(\)[\s\S]{0,120}--si1:-\$\{\(t % 5\)/.test(html) && /\$\{siMuetze\("", "Prüfung läuft"\)\}/.test(html) && !/si-dreht/.test(html), "Sicherheits-Check: Mütze statt Sanduhr, ohne Neustart");
}

// 153. 1.19.0: Doppelpfeil im Kopfbereich – « erste, » letzte Karte (KC-CLUB-INFO-SPRUNG)
{
  assert.ok(/aria-label="Zur ersten Karte"[^>]*onclick="infoSpringen\(-1\)">«/.test(html) && /aria-label="Zur letzten Karte"[^>]*onclick="infoSpringen\(1\)">»/.test(html), "Doppelpfeile fehlen");
  assert.ok(/function infoSpringen\(d\) \{ if \(einfach\(\)\) return; const ziel = d < 0 \? 0 : INFO_FELDER\.length - 1;/.test(html), "Sprung zur ersten/letzten Karte");
  assert.ok(/body\.einfach #infoPunkte, body\.einfach \.ipfeil/.test(html), "einfache Ansicht: Pfeile aus");
}

// 154. 1.19.0: Chats/Dateien/Fotos/Protokolle ins Archiv, Frage vor dem Löschen, Löschen im Archiv (KC-CLUB-ARCHIV-ABLAGE, KC-CLUB-ARCHIV-LOESCHEN)
{
  for (const k of ["chat", "anlage", "foto", "protokoll"]) assert.ok(new RegExp(`\\n  ${k}: \\{ sym:`).test(html), `Ablage-Anlass ${k} fehlt`);
  assert.ok(/onclick="chatInsArchiv\(\)">🗄️ Chat in mein Archiv legen/.test(html), "Chat-Menü: selbst ablegen");
  for (const f of ["unterhaltungWeg", "gruppeLoeschen", "gruppeVerlassen"]) {
    const t = html.slice(html.indexOf(`async function ${f}(`), html.indexOf(`async function ${f}(`) + 700);
    assert.ok(/if \(!gefragt && await chatAblageFragen\(\{ frage: "Vorher in dein persönliches Archiv ablegen\?"/.test(t) || /!gefragt && await chatAblageFragen\(\{ frage: "Vorher in dein persönliches Archiv ablegen\?"/.test(t), `${f}: vorher fragen`);
    assert.ok(t.indexOf("chatAblageFragen") < t.indexOf("api("), `${f}: erst fragen, dann ausführen`);
  }
  const ab = html.slice(html.indexOf("async function ablAblegen()"), html.indexOf("// ----- 1.19.0: Chat als Textdatei"));
  assert.ok(/if \(fehler\) \{[\s\S]*if \(danach && \(await frage\(/.test(ab), "Ablage fehlgeschlagen → Löschen nur nach Rückfrage");
  assert.ok(/if \(!ARCHIV_TYP_OK\(f\.mime\)\) \{ uebersprungen\+\+; continue; \}/.test(ab), "nicht erlaubte Dateitypen überspringen");
  assert.ok(/naAnlagenArchiv\(id, "Wichtig\? Die Datei auch in dein Archiv legen\?"\)/.test(html), "Merken mit Datei → fragen");
  assert.ok(/onclick="fotoInsArchiv\(\)">🗄️ Archiv/.test(html) && /onclick="protokollInsArchiv\(\)">🗄️ In mein Archiv legen/.test(html), "Foto/Protokoll-Knöpfe");
  assert.ok(/const textDatei = \(text\) => new Blob\(\["\\ufeff" \+ text\], \{ type: "text\/plain" \}\)/.test(html), "Text als UTF-8 mit BOM");
  assert.ok(/onclick="event\.stopPropagation\(\);arDokLoeschen\('\$\{x\.id\}'\)" title="Löschen"/.test(html), "🗑️ direkt am Dokument");
  assert.ok(/function arRegisterLoeschen\(\)/.test(html) && /if \(!rest\.length\) return melde\(/.test(html), "Register löschen, letztes bleibt");
  assert.ok(/api\("archiv_endgueltig", was\)/.test(html) && /ENDGÜLTIG löschen\?/.test(html) && /❌ Papierkorb leeren/.test(html), "App: endgültig löschen mit Rückfrage");
  const e = server.slice(server.indexOf('case "archiv_endgueltig"'), server.indexOf('case "ping"'));
  assert.ok(/archivOrdnerHolen\(ich, p\.ordner, true, "pflegen"\)/.test(e) && /archivDokHolen\(ich, p\.id, "pflegen"\)/.test(e), "Server: gleiche Rechte wie Wiederherstellen");
  assert.ok(/if \(!o\.geloescht_am\) throw/.test(e) && /if \(!d\.geloescht_am\) throw/.test(e), "Server: nur aus dem Papierkorb");
  assert.ok(e.indexOf("await geloescht(ich") < e.indexOf(".delete()") && /protokoll\(ich\.person_id, "archiv_dokument_endgueltig"/.test(e), "Server: Sicherung + Protokoll");
}

// 151. 1.18.1: DP2 Build 254 RC (dp3 3945960) – Meine Angaben ausdrucken (PDF mit QR, Abfrage, Vorschau) + Sperrtag ohne V/H/B
{
  const q = JSON.parse(lies("dp2/QUELLE.json"));
  assert.ok(/^(3945960|ae349c0|51518cc|37bd067)/.test(q.commit) && /^0\.20\.0-build25[4567]$/.test(q.dp2Version), "DP2 Build 254 RC (3945960) oder neuer übernommen");
  assert.ok(q.reihenfolge.includes("src/ui/wish-print.js") && q.reihenfolge.includes("src/ui/wish-print.css"), "Ausdruck-Baustein fehlt in der Übernahme");
  assert.ok(/frame-src blob:/.test(lies("dienstwunsch.html")) && !/frame-src 'none'/.test(lies("dienstwunsch.html")), "PDF-Vorschau braucht frame-src blob: (nur selbst erzeugte PDFs)");
  assert.ok(/window\.confirm\(FRAGE\)/.test(lies("dp2/src/ui/wish-print.js")) && /filledPdf/.test(lies("dp2/src/core/personalized-forms.js")), "Sicherheitsabfrage/ausgefüllter Bogen fehlt");
}

// 152. 1.18.2: DB – Reservierung je Wunsch-Eingang gegen zwei gleichzeitig importierende DP2-PCs (KC-DP-WUNSCH-SPERRE)
{
  const mig = lies("supabase/migrations/20261001_kc_dp_wunsch_eingang_sperre.sql");
  const teil = (name) => mig.slice(mig.indexOf(`create or replace function public.${name}(`), mig.indexOf("$function$;", mig.indexOf(`create or replace function public.${name}(`)));
  const claim = teil("kc_dp_wish_inbox_claim"), ackC = teil("kc_dp_wish_inbox_ack_claimed"), ack = teil("kc_dp_wish_inbox_ack"), rel = teil("kc_dp_wish_inbox_release");
  assert.ok(/add column if not exists claim_token uuid/.test(mig) && !/drop column|drop table/i.test(mig), "nur additive Spalten");
  assert.ok(/where id = p_id for update;/.test(claim) && /v_aktiv and not v_meine/.test(claim) && /least\(30, coalesce\(p_minutes, 10\)\)/.test(claim), "Reservierung atomar, fremde aktive Reservierung gewinnt, höchstens 30 Min.");
  assert.ok(/claimed_revision = v\.revision/.test(claim), "Reservierung gilt nur für die reservierte Revision");
  assert.ok(/where id = p_id for update;/.test(ackC) && /claim_token is distinct from p_claim_token/.test(ackC) && /'claim_lost'/.test(ackC), "Quittierung nur mit eigener Reservierung");
  assert.ok(/and not \(claim_token is not null and claimed_until > now\(\) and claimed_revision = revision\)/.test(ack) && /'stale', false, 'claimed', true/.test(ack), "bisherige Quittierung respektiert fremde Reservierung, ohne stale zu melden");
  assert.ok(/claim_token = p_claim_token/.test(rel), "Freigeben nur mit eigenem Token");
  for (const f of [claim, ackC, ack, rel]) assert.ok(/m\.role in \('admin', 'planner', 'duty_manager'\)/.test(f) && /raise exception 'Keine aktive dp2-Planungsberechtigung'/.test(f), "Rollenprüfung fehlt");
  assert.ok(/allow_copy = case when excluded\.allow_view then public\.kc_dp_plan_sharing\.allow_copy else false end/.test(mig) && /revoke all on function public\.kc_dp_wish_inbox_sharing_apply\(text, text, boolean\) from public, anon, authenticated;/.test(mig), "Kollegenfreigabe unverändert, Hilfsfunktion nicht direkt aufrufbar");
  for (const s of ["kc_dp_wish_inbox_claim\\(uuid, integer, text, integer\\)", "kc_dp_wish_inbox_release\\(uuid, uuid\\)", "kc_dp_wish_inbox_ack_claimed\\(uuid, integer, text, jsonb, uuid\\)"])
    assert.ok(new RegExp(`revoke all on function public\\.${s} from public, anon;`).test(mig), `Rechte ${s}`);
  assert.ok(/'claimActive'/.test(teil("kc_dp_wish_inbox_pending")) && /'submittedAt', i\.submitted_at/.test(teil("kc_dp_wish_inbox_pending")), "Abholen: bisherige Felder + Reservierungsstand");
  assert.ok(/stable\s+security definer/.test(teil("kc_dp_wish_inbox_receipt")), "Beleg bleibt lesend");
  assert.ok(/kc_dp_wish_inbox_claim/.test(lies("docs/DP2_CODEX_AUFTRAG_BUILD255_SPERRE.md")), "Codex-Auftrag Build 255 fehlt");
}

// 155. 1.20.0: „Zuletzt da“ (KC-CLUB-ZULETZT-DA)
{
  assert.ok(/zuletzt: \(w\) => \(\{ zeigen: w\?\.zeigen !== false \}\)/.test(server), "Einstellung zuletzt, Standard an");
  const f = server.slice(server.indexOf("async function zuletztDaMap("), server.indexOf("async function onlineJetzt("));
  // 2.3.0: + „inkognito“ (verbirgt nur den Admin selbst, nicht gegenseitig)
  assert.ok(/\.in\("schluessel", \["online", "zuletzt"(, "inkognito")?\]\)/.test(f) && /if \(verborgen\(ich\.person_id(, true)?\)\) return aus;/.test(f), "gegenseitig (online oder zuletzt verborgen)");
  assert.ok(/zeit: tag === heute \?/.test(f) && /lange: true/.test(f) && /pid\.startsWith\("KC-P-TEST"\)/.test(f), "grob: Uhrzeit nur heute, alt = länger nicht da, Testpersonen nie");
  assert.ok(/zuletztDa: zd\.get\(m\.person_id\) \?\? null/.test(server) && /zuletztDa: selbst \? null : \(await zuletztDaMap\(ich, \[pid\]\)\)/.test(server) && /partnerDa = andere\.length === 1/.test(server), "Server: alle drei Stellen");
  assert.ok(/id="setZuletzt" onchange="zuletztZeigen\(this\.checked\)"/.test(html) && /function zuletztText\(z\)/.test(html), "App: Schalter + Text");
  assert.ok(/m\.zuletztDa \? ` · 🕒 \$\{esc\(zuletztText\(m\.zuletztDa\)\)\}`/.test(html) && /Zuletzt in der App:/.test(html) && /\[zuletztText\(u\.partnerDa\), st\]/.test(html), "App: Liste, Seite, Chat-Kopf");
}

// 156. 1.20.1: Chat-Kopfzeile bleibt oben (KC-CLUB-CHAT-KOPF)
{
  assert.ok(/<div class="chat-kopf" id="chatKopf">\s*<div class="kopf2"><button class="zurueck" onclick="(zeige|zurueck)\('nachrichten'\)"( aria-label="Zurück")?>‹<\/button><h2 id="chatTitel">/.test(html), "Kopf im eigenen Bereich");
  const k = html.slice(html.indexOf('id="chatKopf"'), html.indexOf('<div class="chat" id="chat">'));
  assert.ok(/id="chatSuchKnopf"/.test(k) && /id="chatSuchLeiste"/.test(k) && /id="chatTeilnehmer"/.test(k) && /id="chatAngeheftet"/.test(k), "Lupe, Suche, Untertitel, Angeheftetes im Kopf");
  assert.ok(/\.chat-kopf \{ position: sticky; top: 0;/.test(html) && /#chat > \* \{ scroll-margin-top: var\(--chatKopfHoehe/.test(html), "sticky + Sprungabstand");
}

// 157. 1.21.0: größeres Schreibfeld + „Entwurf“ (KC-CLUB-EINGABE-GROSS, KC-CLUB-ENTWURF-ANZEIGE)
{
  assert.ok(/\.eingabe \.innen > #text \{ grid-row: 1; grid-column: 1 \/ [78]; min-height: 56px;/.test(html) && /\.eingabe \.innen > \.rund:not\(#sendenKnopf\) \{ grid-row: 2;/.test(html), "Schreibfeld oben volle Breite, Knöpfe darunter");
  for (const id of ["mikroKnopf", "emoKnopf", "zustellKnopf", "sendenKnopf"]) assert.ok(new RegExp(`id="${id}"`).test(html), `Knopf ${id} bleibt`);
  assert.ok(/id="entwurfMarke">✏️ Entwurf – noch nicht gesendet/.test(html) && /entwurfMerken\(\);entwurfMarkeZeigen\(\)/.test(html) && /\$\("text"\)\.value = ""; \$\("text"\)\.style\.height = "auto"; entwurfMarkeZeigen\(\);/.test(html), "Entwurf-Hinweis an/aus");
  assert.ok(/entwurfAlle\(\)\[u\.id\]\?\.trim\(\) \? `<span class="entwurf-marke">✏️ Entwurf:<\/span>/.test(html), "Chatliste zeigt Entwurf");
}

// 158. 1.21.1: Farben je Absender im Gruppen-Chat (KC-CLUB-GRUPPE-FARBEN)
{
  assert.ok(/const GRUPPEN_FARBEN = \[\["#1f618d", "#82b8ff"\]/.test(html) && /function gruppenFarbe\(name\)/.test(html), "Farb-Registry");
  assert.ok(/\$\{!m\.eigen && andere\.length > 1 \? " farbig" : ""\}"\$\{!m\.eigen && andere\.length > 1 \? ` style="\$\{gruppenFarbe\(m\.von\)\}"` : ""\}/.test(html), "nur fremde Nachrichten in Gruppen");
  assert.ok(/\.blase\.farbig \{ border-left: 4px solid var\(--pf\); \} \.blase\.farbig \.von \{ color: var\(--pf\);/.test(html) && /:root\.dunkel \.blase\.farbig \.von \{ color: var\(--pfd\); \}/.test(html), "Tag/Nacht lesbar");
}

// 159. 1.21.2: spontane Runde mit allen Online (KC-CLUB-ONLINE-RUNDE)
{
  assert.ok(/a === "@online" \? \(m\.online \|\| ONL\.ids\.has\(m\.person_id\)\)/.test(html) && /chip\("@online", "🟢 Alle gerade online"\)/.test(html), "Schnellwahl Alle online");
  assert.ok(/onclick="onlineRunde\(\)">💬 Mit allen \$\{ONL\.liste\.length\} schreiben/.test(html) && /async function onlineRunde\(\) \{[\s\S]{0,160}gruppeWahl\("@online"\)/.test(html), "Knopf auf der Startseite");
}

// 160. 1.21.3: WA-Knopf (KC-CLUB-WA-SENDEN)
{
  assert.ok(/id="waKnopf" onclick="waSenden\(\)">WA<\/button>/.test(html), "Knopf WA");
  const f = html.slice(html.indexOf("async function waSenden()"), html.indexOf("async function whatsappWeitergeben("));
  assert.ok(/if \(!text\) return melde\(/.test(f) && /navigator\.clipboard\?\.writeText\(text\)/.test(f), "leer → Hinweis; Text kopieren");
  assert.ok(/wege\?\.whatsapp\) return whatsappWeitergeben\(text, ids\)/.test(f) && /window\.open\(web, "_blank", "noopener"\)/.test(f), "Einzel-Chat direkt, PC neuer Tab");
  assert.ok(!/\$\("text"\)\.value = ""/.test(f), "Text bleibt im Feld");
}

// 161. 1.21.4: Nachrichten-Kachel farbig bei Neuem (KC-CLUB-NEU-KACHEL)
{
  assert.ok(/id: "kommunikation",[^\n]*neuFarbe: true/.test(html) && /\$\{k\.neuFarbe && z \? " neu-da" : ""\}/.test(html), "Kachel-Merkmal + Klasse");
  assert.ok(/\.kachel\.neu-da \{ background: linear-gradient/.test(html) && /:root\.dunkel \.kachel\.neu-da/.test(html), "Farbe Tag/Nacht");
  assert.ok(/k\.classList\.toggle\("neu-da", n > 0\)/.test(html), "Zähler zieht die Farbe mit");
}

// 162. 1.21.5: Schreib-Punkte immer als Welle (KC-CLUB-TIPPT-WELLE)
{
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ \.punkte3 i \{ animation-duration: 2\.2s; \}/.test(html) && !/\.punkte3 i, \.oszi \.lauf, \.oszi \.hub \{ animation: none/.test(html), "reduzierte Bewegung: langsam statt Stillstand");
  assert.ok(/if \(e\.dataset\.stand !== html\) \{ e\.innerHTML = html; e\.dataset\.stand = html; \}/.test(html), "nur bei Änderung neu zeichnen");
}

// 163. 1.22.0: Teilen → Köcheclub für Text/Dateien + orange „Neue Nachr.“ (KC-CLUB-TEILEN-ALLES, KC-CLUB-NEU-ORANGE)
{
  const m = JSON.parse(lies("manifest.webmanifest")).share_target;
  assert.ok(m.params.text === "text" && m.params.url === "url" && m.params.files[0].accept.includes("application/pdf") && m.params.files[0].accept.includes(".zip"), "Manifest nimmt Text, Links, Dateien");
  const sw = lies("sw.js");
  assert.ok(/text: String\(f\.get\("text"\) \|\| ""\)\.slice\(0, 4000\)/.test(sw) && /const GETEILT = "kcclub-geteilt";/.test(sw), "SW: Text bis 4000, eigener Zwischenspeicher");
  assert.ok(/function teilenWahl\(text, dateien\)/.test(html) && /onclick="teilenChatWahl\(\)">💬 In einen Club-Chat/.test(html) && /onclick="teilenArchiv\(\)">🗄️ In mein Archiv/.test(html), "Auswahl nach dem Teilen");
  const f = html.slice(html.indexOf("async function teilenInChat("), html.indexOf("function teilenArchiv("));
  assert.ok(!/api\("nachricht_senden"/.test(f) && /melde\("📥 Eingefügt – prüfen und mit ➤ senden"\)/.test(f), "nichts wird ungefragt gesendet");
  assert.ok(/<button class="mini\$\{n \? " mini-neu" : ""\}" onclick="zeige\('nachrichten'\)">/.test(html) && /\.mini\.mini-neu \.ameisen rect \{ fill: none; stroke: #ff9800;/.test(html), "Neue Nachr. orange (ab 1.53.3 als orange Ameisenstraße)");
}

// 164. 1.22.1: Sicherheits-Bericht erreicht den Admin sicher + Ablage „Admin <Jahr>“ (KC-CLUB-SICHERHEIT-ZUSTELLUNG/-ARCHIV)
{
  const f = server.slice(server.indexOf('case "sicherheit_melden"'), server.indexOf('return json({ ok: true, probleme, versand, abgelegt });'));
  assert.ok(/sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\], \{/.test(f), "immer Push und E-Mail");
  assert.ok(/await sicherheitAblegen\(ich,[\s\S]{0,200}\.catch\(\(e\) => \{ console\.error\("sicherheit ablegen"/.test(f), "Ablage stoppt die Meldung nicht");
  assert.ok(/const ADMIN_ORDNER = \{ art: "sonstiges", titel: "Admin", farbe: 8, register: \["Sicherheitscheck", "Sonstiges"\] \}/.test(server) && /nur_vorstand: true, erstellt_von: admin/.test(server), "Ordner Admin (nur Clubleitung)");
  assert.ok(/register: "Sicherheitscheck",/.test(server) && /dateiAblegen\(ich, name, "text\/plain", btoa\(b\), ARCHIV_DATEITYPEN\)/.test(server), "Register + Textdatei");
}

// 165. 1.22.2: Kontrast – Nacht-Design lesbar (KC-CLUB-KONTRAST)
{
  assert.ok(/:root\.dunkel \.sos-nr\.haupt \{ background: #4a1f22; color: #fff2ef; \}/.test(html), "SOS 112/110 nachts dunkel mit heller Schrift");
  assert.ok(/--textRot: #741521; --textGruen: #17663a; --textOrange: #8a5200; --textNotruf: #c0392b;/.test(html) && /:root\.dunkel \{ --textRot: #ff9fae; --textGruen: #7bd88f; --textOrange: #ffbe5c; --textNotruf: #ff8a7a;/.test(html), "zentrale Schriftfarben Tag/Nacht");
  assert.ok(/:root\.dunkel \.umschalter button\.an, :root\.dunkel \.fuss-leiste button\.an[^{]*\{ color: var\(--textRot\);/.test(html), "gewählte Reiter nachts hell");
}

// 166. 1.23.0: Ausleihen – Anfrage an die Clubleitung, eine Zusage genügt, Ablage Verein + persönlich (KC-CLUB-LEIHEN)
{
  for (const a of ["leihen_liste", "leihen_anfrage", "leihen_entscheiden", "leihen_status", "leihen_gegenstand"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Leihen-Aktion ${a} fehlt`);
  const mig = lies("supabase/migrations/20261001_kc_club_v1230_helfen_leihen.sql");
  for (const [n, z] of [["Stehtische", 8], ["Bierzeltgarnitur", 4], ["Pavillon", 2], ["Zapfanlage", 1], ["Glühweintopf", 2], ["Kühlbox", 3], ["Gastrobräter", 1], ["Warmhaltebehälter", 4], ["Kabeltrommel", 3]])
    assert.ok(new RegExp(`\\('${n}', '[^']+', ${z}, \\d+\\)`).test(mig), `Startbestand ${n} = ${z}`);
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_leih_gegenstaende, kc_club_ausleihen, kc_club_hilfe_aufrufe, kc_club_hilfe_antworten from anon, authenticated/.test(mig), "RLS an, kein Direktzugriff");
  assert.ok(/kc_db_mirror_table_rules/.test(mig) && /kc_neon_resume_tables/.test(mig), "Spiegel/Sicherung wie die übrigen Club-Tabellen");
  const an = server.slice(server.indexOf('case "leihen_anfrage"'), server.indexOf('case "leihen_entscheiden"'));
  assert.ok(/await leihFreiPruefen\(positionen, von, bis\)/.test(an), "nie mehr als frei");
  assert.ok(/const ziel = \(await leitungIds\(\)\)\.filter/.test(an) && /sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\]/.test(an), "Anfrage an Clubsprecher, Kassenwart, Admin per Push + Mail");
  assert.ok(/or\("ist_vorstand\.eq\.true,ist_admin\.eq\.true"\)/.test(server) && /!id\.startsWith\("KC-P-TEST"\)/.test(server.slice(server.indexOf("async function leitungIds"), server.indexOf("async function leihBelegung"))), "Clubleitung ohne Testpersonen");
  assert.ok(/await leihAblegen\(ich, a, "Antrag"\)/.test(an), "Antrag wird abgelegt");
  const ab = server.slice(server.indexOf("async function leihAblegen"), server.indexOf("async function leihenListe"));
  assert.ok(/adminOrdner\(jahr, "Ausleihe"\), "Ausleihe"/.test(ab) && /persoenlicherOrdner\(a\.person_id, wer, jahr, "Ausleihe"\)/.test(ab), "Ablage: Admin <Jahr> + persönlicher Ordner, Register Ausleihe");
  // 2.22.10: adminOrdner() → vereinsOrdner(ADMIN_ORDNER, …) – gleiche Regel für alle Vereinsordner
  assert.ok(/register: \[\.\.\.new Set\(\[register, \.\.\.def\.register\]\)\]/.test(server) && /const adminOrdner = \(jahr: number, register: string\) => vereinsOrdner\(ADMIN_ORDNER, jahr, register\);/.test(server), "neuer Admin-Ordner hat das gewünschte Register");
  const en = server.slice(server.indexOf('case "leihen_entscheiden"'), server.indexOf('case "leihen_status"'));
  assert.ok(/nurVorstand\(ich\)/.test(en) && /\.eq\("id", a\.id\)\.eq\("status", "angefragt"\)/.test(en), "eine Zusage genügt (nur wer zuerst entscheidet)");
  assert.ok(/Über die eigene Anfrage entscheidet jemand anderes/.test(en) && /await leihAblegen\(ich, neu, "Bescheid"\)/.test(en), "nicht über eigene Anfrage; Bescheid abgelegt");
  assert.ok(/const leiheErinnert = await leihErinnern\(\)/.test(server), "Rückgabe-Erinnerung in der Wartung");
  assert.ok(/belegungen: [^\n]*positionen: \(a\.positionen \?\? \[\]\)\.map\(\(x: any\) => \(\{ id: x\.id, anzahl: x\.anzahl \}\)\)/.test(server), "Belegung ohne Namen");
  assert.ok(/function leihFormHtml\(\)/.test(html) && /hlStepper\(n, 0, frei,/.test(html) && /hlTageWahl\("abholung", f\.abholung\)/.test(html), "Auswahl per Kachel + Stepper");
}

// 167. 1.23.0: Wer kann helfen? (KC-CLUB-HELFEN) + eine Kachel im Register Verein
{
  for (const a of ["hilfe_liste", "hilfe_aufruf", "hilfe_antwort", "hilfe_schliessen"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Hilfe-Aktion ${a} fehlt`);
  const h = server.slice(server.indexOf('case "hilfe_aufruf"'), server.indexOf('case "hilfe_antwort"'));
  assert.ok(/if \(!HILFE_ARTEN\[art\]\) throw/.test(h) && /slotWahl\(p\.slot\)/.test(h), "Auswahl aus Registry, kein Freitext-Typ");
  assert.ok(/ziel === "online" \? \[\.\.\.await onlineJetzt\((true)?\)\]/.test(h) && /\.filter\(\(id\) => id !== ich\.person_id\)/.test(h), "an alle oder alle gerade online, nie an sich selbst");
  assert.ok(/is\("voll_gemeldet_am", null\)/.test(server), "„genug Helfer“ nur einmal");
  const k = html.slice(html.indexOf("const KACHELN = {"), html.indexOf("  mein: ["));
  assert.ok(/\{ id: "helfen", sym: "🤝", t: "Helfen & Leihen", u: "Wer kann helfen\? · Ausleihen", aktion: "hlStart\(\)" \}/.test(k), "Kachel 🤝 im Register Verein");
  assert.ok(/id="v-helfen"/.test(html) && /"sicherheit", "helfen"[,\]]/.test(html) && /"#archiv", "#helfen"\]\.includes\(h\)/.test(html), "Ansicht + Sprung #helfen");
  assert.ok(/onclick="hlTab\('helfen'\)">🙋 Wer kann helfen\?/.test(html) && /onclick="hlTab\('leihen'\)">📦 Ausleihen/.test(html), "zwei Bereiche");
  assert.ok(/const hlJs = \(v\) => JSON\.stringify\(v\)\.replace\(\/&\/g, "&amp;"\)\.replace\(\/'\/g, "&#39;"\)/.test(html), "Werte im onclick sicher maskiert");
}

// 168. 1.23.0: Spendenprojekte in Vorschlägen (KC-CLUB-SPENDE)
{
  const mig = lies("supabase/migrations/20261001_kc_club_v1230_helfen_leihen.sql");
  assert.ok(/check \(art in \('thema', 'abstimmung', 'spende'\)\)/.test(mig) && /jsonb_array_length\(spenden\) between 1 and 10/.test(mig), "Art spende + 1–10 Projekte");
  assert.ok(/const SPENDEN_VORSCHLAEGE = \["Kinderhospiz Lünen\/Werne"\]/.test(server), "Kinderhospiz als Vorschlag");
  const sp = server.slice(server.indexOf('case "vorschlag_speichern"'), server.indexOf('case "vorschlag_stimme"'));
  assert.ok(/p\.art === "spende" \? "spende"/.test(sp) && /spendenPruefen\(p\.spenden\)/.test(sp) && /if \(art === "abstimmung"\) nurVorstand\(ich\)/.test(sp), "Spende darf jedes Mitglied vorschlagen, Abstimmung weiter nur Leitung");
  assert.ok(/x\.betrag > 0 && x\.betrag <= SPENDE_MAX/.test(server), "Betrag geprüft");
  assert.ok(/const unterstuetzbar = \(art: string\) => art === "thema" \|\| art === "spende"/.test(server) && /if \(unterstuetzbar\(v\.art\)\) \{/.test(server), "Spende wie Thema unterstützen");
  assert.ok(/in\("art", \["thema", "spende"\]\)/.test(server), "Spende erscheint beim Treffen");
  assert.ok(/onclick="vorschlagForm\('spende'\)">💝 Spende/.test(html) && /function vfSpZeigen\(\)/.test(html) && /＋ weiteres Spendenprojekt/.test(html), "Formular: mehrere Projekte per Kachel");
  assert.ok(/<div class="summe"><span>Zusammen<\/span>/.test(html), "Summe sichtbar");
}

// 169. 1.23.1: kleine Kacheln + großes Info-Fenster (KC-CLUB-MINIKACHELN)
{
  assert.ok(/\.mini-kacheln \{ display: grid; grid-template-columns: repeat\(auto-fill, minmax\(150px, 1fr\)\)/.test(html), "Kacheln nebeneinander");
  assert.ok(/<div class="mini-kacheln">\$\{spenden\.map\(spendeKachel\)\.join\(""\)\}<\/div>/.test(html) && /onclick="vorschlagInfo\('\$\{v\.id\}'\)"/.test(html), "Spenden als Kacheln → Info");
  assert.ok(/blattAuf\("vorschlagInfo", `<div class="info-gross">\$\{vorschlagKarte\(v\)\}/.test(html) && /blattAuf\("leihInfo", `<div class="info-gross">\$\{leihKarte\(a,/.test(html), "Info-Fenster mit voller Karte und Knöpfen");
  assert.ok(/leihKachel\(a, true\)/.test(html) && /leihKachel\(a, false\)/.test(html) && /map\(bestandKachel\)/.test(html), "Ausleihen + Bestand als Kacheln");
  assert.ok(/\.info-gross \{ font-size: 1\.12rem; \}/.test(html), "große Schrift im Info-Fenster");
}

// 170. 1.23.2: Hilfe-Aufrufe als kleine Kacheln (KC-CLUB-MINIKACHELN)
{
  assert.ok(/l\.map\(hilfeKachel\)/.test(html) && /onclick="hilfe(Info|Oeffnen)\('\$\{a\.id\}'\)"/.test(html), "Hilfe-Aufrufe als Kacheln"); // 1.92.0: hilfeOeffnen → Info oder Formular (Test 272)
  assert.ok(/blattAuf\("hilfeInfo", `<div class="info-gross">\$\{hilfeKarte\(a\)\}/.test(html), "Info-Fenster mit Ich komme / Kann nicht");
}

// 171. 1.23.3: Schnellstart, ergänzte Auswahl, Suche (KC-CLUB-HELFEN, KC-CLUB-LEIHEN)
{
  assert.ok(/\{ id: "hilfe", sym: "🙋", t: "Hilfe suchen", kachel: "helfen", los: \(\) => \{ hlStart\("helfen"\); hilfeNeu\(\); \} \}/.test(html) && /\{ id: "ausleihen", sym: "📦", t: "Ausleihen", kachel: "helfen"/.test(html), "Schnellstart Hilfe/Ausleihen");
  assert.ok(/tragen: "🪑 Tische tragen"/.test(server) && /verkauf: "🏪 Verkauf am Stand"/.test(server) && /nachbarschaft: "🏡 Nachbarschaftsfest"/.test(server), "Auswahl wie besprochen");
  for (const k of ["kochen", "aufbau", "abbau", "einkauf", "fahren", "service", "spuelen", "sonstiges"]) assert.ok(new RegExp(`\\b${k}: "`).test(server.slice(server.indexOf("const HILFE_ARTEN"), server.indexOf("const LEIH_STATUS"))), `alter Schlüssel ${k} bleibt`);
  assert.ok(/"Wobei: " \+ f\.artText\.trim\(\)/.test(html) && /"Wofür: " \+ f\.zweckText\.trim\(\)/.test(html), "Sonstiges-Feld");
  assert.ok(/\["📦", "Etwas ausleihen", "ausleihen leihen/.test(html) && /\["💝", "Spendenprojekt vorschlagen"/.test(html), "Suche");
  assert.ok(/!HL\.leihen && \(HL\.edit \|\| HL\.form\)/.test(html), "Formular wartet auf Daten");
}

// 172. 1.24.0: Bildschirmfoto mit Auslöser (KC-CLUB-BILDSCHIRMFOTO)
{
  assert.ok(/\{ id: "bildschirmfoto", sym: "📸", t: "Bildschirmfoto", los: \(\) => bfStart\(\) \}/.test(html), "Schnellstart-Symbol");
  assert.ok(/const BF_BIB = "lib\/html2canvas\.min\.js\?v=1\.4\.1"/.test(html) && !/cdn\.jsdelivr\.net\/npm\/html2canvas|unpkg\.com\/html2canvas/.test(html), "Bibliothek liegt lokal");
  const lib = lies("lib/html2canvas.min.js");
  assert.ok(/html2canvas 1\.4\.1/.test(lib.slice(0, 200)) && /Released under MIT License/.test(lib.slice(0, 300)), "html2canvas 1.4.1, MIT");
  assert.ok(/ignoreElements: \(el\) => el\.id === "bfAusloeser"/.test(html), "Auslöser nicht mit auf dem Bild");
  const w = html.slice(html.indexOf("async function bfWeiter("), html.indexOf("// ---------- Datei-/Fotoauswahl (KC-CLUB-KAMERA)"));
  assert.ok(!/api\("nachricht_senden"/.test(w) && /teilenChatWahl\(\)/.test(w) && /teilenArchiv\(\)/.test(w), "nichts wird ungefragt gesendet; vorhandene Wege");
}

// 173. 1.24.1: nach Zusage Themenvorschlag anbieten (KC-CLUB-THEMA-FRAGE)
{
  assert.ok(/if \(a === "ja" && bisher !== "ja" && TREFFEN_IDX\.get\(id\)\?\.art !== "veranstaltung"\) themaFragen\(id\)/.test(html), "Frage nur bei neuer Zusage zum Club-Treffen");
  assert.ok(/Deine Vorschläge sind immer willkommen!/.test(html) && /zeige\("vorschlaege"\); VS_ZIEL = id;/.test(html), "Hinweis + Vorschläge");
  assert.ok(/VS_ZIEL && VORSCHLAG_TREFFEN\.some\(\(t\) => t\.id === VS_ZIEL\) \? VS_ZIEL/.test(html), "Sitzung vorgewählt");
}

// 174. 1.25.0: Büro für die Clubleitung (KC-CLUB-BUERO)
{
  for (const a of ["buero_start", "buero_sitzung", "buero_speichern", "buero_einladung"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Büro-Aktion ${a} fehlt`);
  for (const a of ["buero_start", "buero_speichern", "buero_einladung"]) {
    const c = server.slice(server.indexOf(`case "${a}"`), server.indexOf(`case "${a}"`) + 200);
    assert.ok(/nurVorstand\(ich\)|nurBuero(Lesen|Schreiben)\(ich\)/.test(c), `${a} nur mit Büro-Recht (1.37.0)`);
  }
  assert.ok(/case "buero_sitzung": nurBueroLesen\(ich\);/.test(server), "buero_sitzung nur mit Büro-Recht (1.37.0)");
  assert.ok(/const BUERO_TOP_VORNE = \["Begrüßung", "Genehmigung des letzten Protokolls", "Bericht des Kassenwarts"\]/.test(server) && /const BUERO_TOP_HINTEN = \["Verschiedenes"\]/.test(server), "feste Tagesordnungspunkte");
  const sp = server.slice(server.indexOf('case "buero_speichern"'), server.indexOf('case "buero_einladung"'));
  assert.ok(/pr\.status === "entwurf" && pr\.version === 1 && new Date\(t\.beginn\)\.getTime\(\) > Date\.now\(\)/.test(sp), "veröffentlichte Protokolle / Entwürfe nach Sitzungsbeginn unberührt");
  const ei = server.slice(server.indexOf('case "buero_einladung"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/nurOffen \? alle\.filter\(\(id\) => !geantwortet\.has\(id\)\) : alle\)\.filter\(\(id\) => id !== ich\.person_id\)/.test(ei), "Erinnerung nur an Mitglieder ohne Antwort");
  assert.ok(/if \(!\(await frage\(`\$\{x\.nurOffen \? "Erinnerung" : "Einladung"\} jetzt an \$\{anzahl\} Mitglieder senden\?`\)\)\) return;/.test(html), "Senden erst nach Bestätigung");
  assert.ok(/\{ id: "buero", sym: "🗂️", t: "Büro",[^\n]*nur: \(\) => !!ICH\?\.buero \}/.test(html), "Kachel nur mit Büro-Freigabe (1.37.0)");
  assert.ok(/if \(!ICH\?\.vorstand \|\| !buDarf\(\)\) return;/.test(html) && /sessionStorage\.getItem\("kc_buero_gefragt"\)/.test(html) && /if \(!h \|\| h === "#"\) setTimeout\(\(\) => buGrussFragen\(\), 1500\)/.test(html), "Begrüßung einmal je Start, nur Clubleitung, nicht nach Sprung");
  assert.ok(/sitzung: \{ bauen: \(\) => druckSitzung\(\) \}/.test(html) && /Anmerkung zum letzten Protokoll/.test(html) && /TOP \$\{i \+ 1\}/.test(html), "Druckvorlage");
  const mig = lies("supabase/migrations/20261002_kc_club_v1250_buero.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_buero_sitzung from anon, authenticated/.test(mig) && /kc_db_mirror_table_rules/.test(mig), "RLS + Spiegel");
}

// 175. 1.26.0: Büro-Eingang + Briefbogen (KC-CLUB-BUERO-EINGANG, KC-CLUB-BRIEFBOGEN)
{
  assert.ok(/function buEingangHtml\(\)/.test(html) && /api\("leihen_liste"\), api\("vorschlaege_liste"\), api\("hilfe_liste"\)/.test(html), "Eingang nutzt vorhandene Listen");
  assert.ok((html.match(/buEingangAuffrischen\(\); \/\/ KC-CLUB-BUERO-EINGANG/g) || []).length === 2, "Eingang frischt sich nach Aktionen auf");
  assert.ok(/brief: \{ bauen: \(\) => druckBrief\(\) \}/.test(html) && /\$\("druck"\)\.innerHTML = s\.ohneRahmen \? s\.html :/.test(html), "Briefdruck mit eigenem Kopf");
  for (const k of ["leer", "spende", "dank", "einladung", "glueckwunsch"]) assert.ok(new RegExp(`\\b${k}: \\{ sym:`).test(html.slice(html.indexOf("const BRIEF_VORLAGEN"), html.indexOf("const BRIEF_ANREDEN"))), `Briefvorlage ${k}`);
  assert.ok(/briefbogen: \(w\) => \(\{ absender: txt\(w\?\.absender, 200\)/.test(server), "Einstellung briefbogen geprüft");
  assert.ok(/src="icon-192\.png"[^>]*style="width:22mm/.test(html) && /Köcheclub Werne<\/div>/.test(html), "Logo + Name im Briefkopf");
}

// 176. 1.27.0: Büro – Termine bearbeiten, Mitglieder kontaktieren (KC-CLUB-BUERO-TERMINE, KC-CLUB-BUERO-KONTAKT)
{
  assert.ok(/k\("termine", "📅", "Termine bearbeiten", "anlegen · ändern · absagen", "buTermine\(\)"\)/.test(html) && /k\("kontakt", "👥", "Mitglieder kontaktieren"/.test(html), "Kacheln im Büro");
  assert.ok(/function buTerminAendern\(id\)[^\n]*treffenForm\(buTerminObj\(t\)\)/.test(html), "Ändern nutzt vorhandenes Formular");
  const k = html.slice(html.indexOf("async function buKSchreiben()"), html.indexOf("function buKBrief()"));
  assert.ok(/await neueNachricht\(\); empfWahl\.personen = ids; empfListe\(\);/.test(k) && !/api\("nachricht_senden"/.test(k), "Schreiben über vorhandene Neue Nachricht, nichts automatisch");
  const kh = html.slice(html.indexOf("function buKontaktHtml()"), html.indexOf("async function buKSchreiben()"));
  assert.ok(!/telefon|email|\.mail\b/i.test(kh.replace(/E-Mail/g, "")) && /mitgliedOeffnen\(/.test(kh), "keine zusätzlichen Kontaktdaten im Büro");
}

// 177. 1.28.0: Büro nach der Sitzung – Foto, Aufgaben (KC-CLUB-BUERO-NACHHER)
{
  for (const a of ["buero_nachher", "buero_aufgaben_mitteilen"]) {
    assert.ok(aktionen.has(a) && aufrufe.has(a), `Aktion ${a} fehlt`);
    assert.ok(/nurVorstand\(ich\)|nurBuero(Lesen|Schreiben)\(ich\)/.test(server.slice(server.indexOf(`case "${a}"`), server.indexOf(`case "${a}"`) + 150)), `${a} nur mit Büro-Recht (1.37.0)`);
  }
  const m = server.slice(server.indexOf('case "buero_aufgaben_mitteilen"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/filter\(\(a: any\) => !a\.mitgeteilt_am && !a\.erledigt_am\)/.test(m) && /await aufgabenMitteilen\(offen, ich, pr\.titel\)/.test(m), "nur noch nicht mitgeteilte, vorhandene Mitteilung");
  assert.ok(/api\("aufgabe_speichern", \{ protokoll_id: prId, person_ids: \[\.\.\.BU_N\.wer\]/.test(html), "vorhandene Aufgaben-Aktion");
  assert.ok(/dateiWahl\('buFotoKamera', buNachherDateien\)/.test(html) && /id="buFotoKamera" accept="image\/\*" capture="environment"/.test(html), "Kamera direkt");
  assert.ok(/if \(!\(await frage\("Die eingetragenen Aufgaben jetzt an die Mitglieder schicken\?"\)\)\) return;/.test(html), "Mitteilen nur nach Bestätigung");
}

// 178. 1.29.0: Büro – Geburtstage & Jubiläen (KC-CLUB-BUERO-FESTE)
{
  assert.ok(aktionen.has("buero_feste") && aufrufe.has("buero_feste"), "Aktion buero_feste fehlt");
  const f = server.slice(server.indexOf('case "buero_feste"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/nurVorstand\(ich\)|nurBuero(Lesen|Schreiben)\(ich\)/.test(f.slice(0, 120)), "nur mit Büro-Recht (1.37.0)");
  // 1.30.0: zusätzlich freiwillige Freigabe „runde Geburtstage“ (Test 179) – ohne sie weiterhin nur mit Geburtstags-Freigabe
  assert.ok(/if \(!frei\.has\(m\.person_id\) && m\.person_id !== ich\.person_id && !rund\) \{ ohneFreigabe\+\+; continue; \}/.test(f), "Geburtstag nur mit Freigabe");
  assert.ok(/geburtstage\.push\(\{ person_id: m\.person_id, name: m\.display_name, vorname: vorname\(m\), datum: d, tage: t, \.\.\.\(rund \? \{ rund: true, alter \} : \{\}\) \}\)/.test(f), "Alter nur bei Freigabe für runde Geburtstage");
  assert.ok(/m\?\.joinedAt/.test(f) && /namensSchluessel\(m\.firstName, m\.lastName\)/.test(f), "Jubiläum aus KC Manager, gleiche Zuordnung");
  assert.ok(/feste: \{ bauen: \(\) => druckFeste\(\) \}/.test(html) && /function buFestNachricht/.test(html) && !/api\("nachricht_senden"/.test(html.slice(html.indexOf("async function buFestNachricht"), html.indexOf("function buFestBrief"))), "Gratulieren nur vorbereitet");
}

// 179. 1.30.0: runde Geburtstage nur mit eigener Freigabe (KC-CLUB-RUNDER-GEBURTSTAG)
{
  assert.ok(aktionen.has("runder_geburtstag_freigabe") && aufrufe.has("runder_geburtstag_freigabe"), "Schalter-Aktion fehlt");
  const c = server.slice(server.indexOf('case "runder_geburtstag_freigabe"'), server.indexOf('case "dienst_freigabe"'));
  assert.ok(/person_id: ich\.person_id, bereich: "runder_geburtstag"/.test(c), "nur die eigene Freigabe");
  const f = server.slice(server.indexOf('case "buero_feste"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/const rund = ich\.vorstand && rundFrei\.has\(m\.person_id\) && rundesAlter\(alter\);/.test(f) && /\.\.\.\(rund \? \{ rund: true, alter \} : \{\}\)/.test(f), "Alter nur mit Freigabe und nur rund");
  assert.ok(/nurVorstand\(ich\)|nurBuero(Lesen|Schreiben)\(ich\)/.test(f.slice(0, 120)), "nur mit Büro-Recht (1.37.0)");
  const g = server.slice(server.indexOf("async function geburtstageSichtbar"), server.indexOf("// ---------- Treffen ----------"));
  assert.ok(!/runder_geburtstag|alter/.test(g), "öffentliche Geburtstage weiter ohne Jahr");
  assert.ok(/id="setRundGeburtstag" onchange="runderGeburtstagFreigabe\(this\.checked\)"/.test(html), "Schalter in den Einstellungen");
  assert.ok(/'runder_geburtstag'/.test(lies("supabase/migrations/20261002_kc_club_v1300_runder_geburtstag.sql")), "Migration");
}

// 180. 1.31.0: Büro – Mitgliederliste drucken (KC-CLUB-BUERO-MITGLIEDERLISTE)
{
  assert.ok(aktionen.has("buero_mitgliederliste") && aufrufe.has("buero_mitgliederliste"), "Aktion fehlt");
  const f = server.slice(server.indexOf('case "buero_mitgliederliste"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/nurVorstand\(ich\)/.test(f.slice(0, 120)), "nur Clubleitung");
  assert.ok(/const darf = \(f: string\) => m\.person_id === ich\.person_id \|\| ich\.admin \|\| \(ich\.kontakte && frei\("kontakt_" \+ f\)\);/.test(f), "gleiche Kontakt-Regeln wie Mitglieder-Seite");
  assert.ok(/if \(darf\(f\)\) kontakt\[f\] = werte\[f\]; else verborgen\+\+;/.test(f) && /await protokoll\(ich\.person_id, "buero_mitgliederliste"/.test(f), "Verborgenes nur gezählt, Abruf protokolliert");
  assert.ok(!/birth_date\)\.slice\(0, 4\)/.test(f), "kein Geburtsjahr");
  for (const k of ["uebersicht", "telefon", "adressen", "unterschrift", "abhaken"]) assert.ok(new RegExp(`\\b${k}: \\{ sym:`).test(html.slice(html.indexOf("const ML_ARTEN"), html.indexOf("const ML_SPALTEN"))), `Listenart ${k}`);
  assert.ok(/mitgliederliste: \{ bauen: \(\) => druckMitgliederliste\(\) \}/.test(html) && /Vertraulich – nur für Vereinszwecke/.test(html), "Druck mit Vertraulich-Hinweis");
}

// 181. 1.32.0: Freud & Leid (KC-CLUB-FREUD-LEID)
{
  for (const a of ["fl_liste", "fl_anlegen", "fl_aendern", "fl_informieren", "fl_abschliessen"]) {
    assert.ok(aktionen.has(a) && aufrufe.has(a), `Aktion ${a} fehlt`);
    assert.ok(/nurVorstand\(ich\)/.test(server.slice(server.indexOf(`case "${a}"`), server.indexOf(`case "${a}"`) + 140)), `${a} nur Clubleitung`);
  }
  assert.ok(/tod_mitglied: \{ sym: "🕊️", t: "Tod eines Mitglieds", gruppe: "leid", betrag: 100,/.test(server) && /tod_angehoeriger: \{[^\n]*betrag: 100,/.test(server), "100 € bei Todesfall");
  const inf = server.slice(server.indexOf('case "fl_informieren"'), server.indexOf('case "fl_abschliessen"'));
  assert.ok(/if \(leid && p\.abgesprochen !== true\) throw/.test(inf) && /\(!leid \|\| id !== f\.person_id\)/.test(inf), "Leid: nur nach Absprache, Betroffene nicht");
  assert.ok(/art: "abordnung"/.test(inf) && /abordnung: "🕊️ Abordnung \/ Begleitung"/.test(server), "Abordnung als Hilfe-Aufruf");
  assert.ok(/Gedenken an \$\{totNamen\.join\(", "\)\} \(Schweigeminute\)/.test(server), "Schweigeminute in der Tagesordnung");
  assert.ok(/adminOrdner\(jahr, "Freud & Leid"\), "Freud & Leid"/.test(server), "Archiv-Ablage");
  for (const k of ["beileid", "genesung", "geburt", "hochzeit"]) assert.ok(new RegExp(`\\b${k}: \\{ sym:`).test(html.slice(html.indexOf("const BRIEF_VORLAGEN"), html.indexOf("const BRIEF_ANREDEN"))), `Briefvorlage ${k}`);
  assert.ok(/if \(leid && !\$\("flIOK"\)\?\.checked\) return melde/.test(html) && /if \(!\(await frage\("Nachricht jetzt an alle Mitglieder senden\?"\)\)\) return;/.test(html), "Senden nur nach Bestätigung");
  const mig = lies("supabase/migrations/20261002_kc_club_v1320_freud_leid.sql");
  assert.ok(/revoke all on kc_club_fl_faelle, kc_club_fl_schritte from anon, authenticated/.test(mig) && /kc_db_mirror_table_rules/.test(mig), "RLS + Spiegel");
}

// 182. 1.32.1: „＋ Neu“ immer sichtbar, Kopfzeilen brechen um (KC-CLUB-KOPFZEILE)
{
  assert.ok(/<h2>💬 (Kommunikation|Nachrichten)<\/h2>(<button[^>]*id="naSosKnopf"[^>]*>🚨 SOS<\/button>)?<button class="knopf haupt klein" onclick="neueNachricht\(\)">＋ Neu<\/button><\/div>/.test(html), "＋ Neu direkt in der Kopfzeile"); // 2.22.0: davor nur beim Admin 🚨 SOS
  assert.ok(/⭐ Gemerkt<\/button>/.test(html) && /\.kopf2 \{ display: flex; align-items: center; gap: 10px; margin: 6px 0 4px; flex-wrap: wrap; \}/.test(html), "Stern beschriftet, Kopfzeile bricht um");
}

// 183. 1.32.2: Bildschirmfoto-Knopf im Chat (KC-CLUB-BILDSCHIRMFOTO)
{
  assert.ok(/id="waKnopf"[\s\S]{0,700}?<button class="rund bf-chat-knopf"[^>]*id="bfChatKnopf" onclick="bfAusChat\(\)">📸<\/button>/.test(html), "📸 neben WA");
  assert.ok(/const zielChat = BF\.chat;/.test(html) && /return teilenInChat\(zielChat\.id\)/.test(html), "Foto zurück in denselben Chat (nur eingefügt, nicht gesendet)");
}

// 184. 1.33.0: Tages-Übersicht beim Start (KC-CLUB-TAGESINFO)
{
  assert.ok(aktionen.has("tagesinfo") && aufrufe.has("tagesinfo"), "Aktion tagesinfo fehlt");
  const f = server.slice(server.indexOf('case "tagesinfo"'), server.indexOf('case "leihen_liste"'));
  assert.ok(/nurVorstand\(ich\)/.test(f.slice(0, 120)), "nur Clubleitung");
  assert.ok(/if \(ich\.admin\) \{/.test(f) && /const kassenwart = ich\.admin \|\| \(ich\.aemter \|\| \[\]\)\.some/.test(f), "Technik nur Admin, Kasse nur Kassenwart/Admin");
  assert.ok(!/\.insert\(|\.update\(|\.delete\(|senden\(/.test(f), "liest nur, sendet nichts");
  assert.ok(/const DB_GRENZE_BYTES = 500 \* 1024 \* 1024;/.test(server), "Grenze Free-Tarif");
  assert.ok(/const tiAmpel = \(wert, gelb, rot\) => \(wert === null \|\| wert === undefined \|\| Number\.isNaN\(wert\) \? "⚪"/.test(html), "fehlender Wert = ⚪, nie grün");
  assert.ok(/tiAmpel\(t\.db\?\.prozent \?\? null, 70, 90\)/.test(html), "Datenbank-Ampel 70/90");
  assert.ok(/revoke all on function public\.kc_club_db_groesse\(\) from public, anon, authenticated;/.test(lies("supabase/migrations/20261002_kc_club_v1330_tagesinfo.sql")), "Funktion nur service_role");
}

// 185. 1.33.1: Gruppen in „Neue Nachricht“ (KC-CLUB-GRUPPEN-WAHL)
{
  assert.ok(/zeige\("neu"\); empfListe\(\); neuGruppenZeigen\("neuGruppen", true\);/.test(html) && /<div id="neuGruppen"><\/div>/.test(html), "Gruppen-Bereich");
  assert.ok(/const gruppen = \(liste \|\| \[\]\)\.filter\(\(u\) => u\.gruppe\);/.test(html) && /onclick="chatOeffnen\('\$\{u\.id\}'\)"/.test(html), "vorhandene Gruppe öffnen");
}

// 186. 1.33.2: vorhandene Gruppen auch auf „👥 Gruppe“ (Neue Gruppe)
{
  assert.ok(/<div id="grVorhanden"><\/div>/.test(html) && /if \(GR\.id\) \$\("grVorhanden"\)\.innerHTML = ""; else neuGruppenZeigen\("grVorhanden", true\);/.test(html), "Gruppenliste auf der Gruppen-Seite");
  assert.ok(/async function neuGruppenZeigen\(ziel = "neuGruppen", frisch = false\)/.test(html), "Liste frisch holbar");
}

// 187. 1.34.0: Gruppen-Filter in „Aktive Mitglieder“ + „Mein Status“ (KC-CLUB-MG-GRUPPEN)
{
  assert.ok(/<div id="mgGruppen"><\/div>/.test(html) && /function mgGruppeSetzen\(id\)/.test(html), "Gruppen-Filter");
  assert.ok(/\.filter\(\(m\) => !gr \|\| gr\.personen\.includes\(m\.person_id\)\)/.test(html), "nur Mitglieder der Gruppe");
  assert.ok(/\.filter\(\(u\) => u\.gruppe && Array\.isArray\(u\.personen\)\)/.test(html), "nur Gruppen, in denen ich bin (Server-Liste)");
  assert.ok(/\.\.\.\(gruppe\.has\(t\.id\) \? \{ personen: /.test(server), "Server liefert person_ids nur bei Gruppen");
  assert.ok(/<small class="st-titel">Mein Status<\/small>\$\{esc\(statusKurz\(s\)\)\}/.test(html), "„Mein Status“ im Knopf");
}

// 188. 1.35.0: Büro-Bereiche klappbar mit Pfeil und Schloss (KC-CLUB-BUERO-KLAPPE)
{
  assert.ok(/function buZeigen\(\) \{ buZeigenRoh\(\); klappenMerken\(\$\("buInhalt"\)\); \}/.test(html), "Klappen nach jedem Zeichnen einrichten");
  assert.ok(/const buBereich = \(name, titel, inhalt\) => `<details class="karte bu-bereich" data-klappe="buero_\$\{name\}" data-ohne-unten open>/.test(html), "Bereich = Klappkarte");
  for (const b of ["sitzung", "nachher", "mitglieder", "schreiben", "eingang"]) assert.ok(html.includes(`buBereich("${b}"`), `Büro-Bereich ${b} klappbar`);
  assert.ok(/d\.dataset\.klappeAn = "1";/.test(html), "kein doppeltes Schloss");
}

// 189. 1.36.0: Aus WhatsApp einfügen (KC-CLUB-WA-EINFUEGEN)
{
  assert.ok(/id="waEinfKnopf" onclick="waEinfuegen\(\)">📋<\/button>/.test(html), "📋-Knopf im Chat");
  assert.ok(/function waAufbereiten\(roh\)/.test(html) && /function waOhneNummer|const waOhneNummer = /.test(html), "Aufbereiten + Nummern entfernen");
  assert.ok(/"\[Nummer entfernt\]"/.test(html) && /return "Mitglied";/.test(html), "keine Telefonnummern – auch nicht als Absender");
  assert.ok(/Promise\.race\(\[navigator\.clipboard\.readText\(\)/.test(html) && /id="waEinfFeld"/.test(html), "Zwischenablage mit Zeitlimit, sonst Einfügefeld");
  const f = html.slice(html.indexOf("function waEinsetzen("), html.indexOf("async function waEinfuegen("));
  assert.ok(!/senden\(\)/.test(f) && /\$\("text"\)/.test(f), "nie automatisch senden – nur ins Schreibfeld");
  assert.ok(/grid-template-columns: auto auto auto auto auto (auto )?1fr auto;/.test(html) && /#sendenKnopf \{ grid-row: 1; grid-column: [78];/.test(html), "Leiste mit 7 Spalten (ab 1.53.0 mit ❗: 8)");
}

// 190. 1.37.0: Büro-Freigaben je Mitglied (KC-CLUB-BUERO-RECHTE) + Kontrast der Chat-Knöpfe (KC-CLUB-EINGABE-KONTRAST)
{
  const mig = lies("supabase/migrations/20261002_kc_club_v1370_buero_rechte.sql");
  assert.ok(/check \(buero_recht is null or buero_recht in \('lesen', 'schreiben'\)\)/.test(mig) && /update kc_club_rollen set buero_recht = 'schreiben' where ist_vorstand and buero_recht is null;/.test(mig), "Migration: Recht + bisherige Clubleitung behält Zugang");
  assert.ok(/buero: r\?\.ist_admin \? "schreiben" :/.test(server), "Admin immer schreiben");
  for (const a of ["buero_start", "buero_sitzung", "buero_nachher", "buero_feste"]) assert.ok(new RegExp(`case "${a}"[^]{0,80}nurBueroLesen\\(ich\\);`).test(server), `${a} braucht Leserecht`);
  for (const a of ["buero_speichern", "buero_einladung", "buero_aufgaben_mitteilen"]) assert.ok(new RegExp(`case "${a}"[^]{0,80}nurBueroSchreiben\\(ich\\);`).test(server), `${a} braucht Schreibrecht`);
  for (const a of ["buero_mitgliederliste", "fl_liste", "fl_anlegen", "tagesinfo", "treffen_loeschen"]) assert.ok(new RegExp(`case "${a}"[^]{0,200}nurVorstand\\(ich\\);`).test(server), `${a} bleibt Clubleitung`);
  assert.ok(/case "buero_rechte":[^]{0,40}nurAdmin\(ich\);/.test(server) && /case "buero_rechte_setzen":[^]{0,40}nurAdmin\(ich\);/.test(server), "Verwaltung nur Admin");
  assert.ok(/const rund = ich\.vorstand && rundFrei\.has/.test(server), "Alter nur Clubleitung");
  assert.ok(/const buDarf = \(\) => !!ICH\?\.buero;/.test(html) && /nur: \(\) => !!ICH\?\.buero \}/.test(html), "Büro-Kachel nach Recht");
  assert.ok(/<fieldset class="bu-fs"\$\{buSchreiben\(\) \? "" : " disabled"\}>/.test(html), "Lesemodus gesperrt");
  assert.ok(/function buRechteHtml\(\)/.test(html) && /1️⃣ Was soll gelten\?/.test(html) && /2️⃣ Für wen\?/.test(html), "erst WAS, dann WER");
  assert.ok(/\.eingabe \.innen > #mikroKnopf\.rund:not\(#sendenKnopf\) \{ background: #fff !important; border: 3px solid/.test(html), "Mikrofon gut erkennbar");
}

// 191. 1.38.0: Tages-Übersicht nochmal aufrufen (KC-CLUB-TAGESINFO-MANUELL)
{
  assert.ok(/id="tiKnopfStart"[^>]*onclick="tagesinfoZeigen\(true\)">📋 Übersicht<\/button>/.test(html) && /\$\("tiKnopfStart"\)\?\.classList\.toggle\("versteckt", !ICH\?\.vorstand\)/.test(html), "Knopf bei „Heute wichtig“ nur Clubleitung");
  // 1.83.0: Knöpfe stehen in der Knopfreihe (ohne margin-left) – Prüfung angepasst
  assert.ok(/\$\{ICH\?\.vorstand \? '<button class="knopf klein"( style="margin-left:auto")? onclick="tagesinfoZeigen\(true\)">📋 Übersicht<\/button>' : ""\}/.test(html), "Knopf im Büro");
  assert.ok(/async function tagesinfoZeigen\(manuell = false\) \{\s*if \(!ICH\?\.vorstand\) return;/.test(html) && /if \(!manuell\) try \{ localStorage\.setItem\(TI_SEIT/.test(html), "manuell verschiebt den Merkpunkt nicht");
}

// 192. 1.39.0: Mitfahrt mit echten Sitzplätzen (KC-CLUB-MITFAHRT-SITZE)
{
  assert.ok(/const zeilen = liste\.map\(\(m\) => mfAutoHtml\(m, art, bezugId, aktiv, offen, ichDabei\)\)\.join\(""\);/.test(html), "Block nutzt die Sitzplatz-Ansicht");
  const f = html.slice(html.indexOf("function mfAutoHtml("), html.indexOf("async function mfSitzBuchen("));
  assert.ok(/Array\.from\(\{ length: m\.plaetze \}/.test(f) && /for \(let i = 1; i < sitze\.length; i \+= 3\)/.test(f), "so viele Sitze wie angeboten, Kleinbus-Reihen");
  assert.ok(/const waehlbar = aktiv && !m\.eigen && !ichDabei;/.test(f) && /mf-sitz mf-belegt" role="img"/.test(f), "frei nur wählbar, wenn erlaubt; belegt nie anwählbar");
  assert.ok(/if \(!\(await frage\(`🚗 Diesen Platz bei \$\{fahrer\} für dich reservieren\?/.test(html) && /if \(!\(await frage\(`Deinen Platz bei \$\{fahrer\} wieder freigeben\?/.test(html), "Buchen/Freigeben mit Rückfrage");
}

// 193. 1.40.0: Twinkey-Ladeanzeige mit sichtbarer drehender Kochmütze (KC-CLUB-DIENSTWUNSCH)
{
  const seite = lies("dienstwunsch.html");
  assert.ok(/<div class="muetze"><img src="\.\.\/kc-kochmuetze-weiss\.webp" alt=""><\/div>Twinkey wird geladen/.test(seite) && /#dwLaden \.muetze\{[^}]*background:linear-gradient\(135deg,#4d0c16,#741521\)[^}]*animation:dwDreh/.test(seite), "weiße Mütze auf dunkelrotem Kreis, dreht sich");
  assert.ok(!/filter:invert\(\.2\) sepia/.test(seite), "keine fast unsichtbare blasse Mütze mehr");
  assert.ok(/<div class="warten an"[^>]*><div class="muetze"><img src="kc-kochmuetze-weiss\.webp" alt=""><\/div><b>Twinkey wird geladen …<\/b><\/div>/.test(html) && /onload="this\.previousElementSibling\?\.remove\(\);/.test(html), "Mütze schon während die Seite lädt, danach weg");
}

// 194. 1.41.0: „Keine Mitfahrgelegenheit – soll ich Bescheid geben?“ (KC-CLUB-MITFAHRT-BESCHEID)
{
  assert.ok(/onclick="mfSuchenFragen\('\$\{art\}', '\$\{esc\(bezugId\)\}', \$\{liste\.some\(\(m\) => !m\.eigen && m\.frei > 0\)\}\)">🙋 Ich suche eine Mitfahrgelegenheit/.test(html), "Suchen-Knopf fragt, wenn nichts frei ist");
  assert.ok(/Zurzeit gibt es noch keine Mitfahrgelegenheit/.test(html) && /Soll ich das für dich im Auge behalten und dich informieren, sobald eine neue Gelegenheit eingestellt wird\?/.test(html), "Text wie gewünscht");
  assert.ok(/async function mfBescheidJa\(art, bezugId\) \{[^]{0,120}api\("mitfahrt_suchen", \{ bezug_art: art, bezug_id: bezugId, an: true \}/.test(html), "Ja = Suche eintragen (vorhandene Benachrichtigung)");
  assert.ok(/titel: "🚗 Mitfahrgelegenheit gefunden"/.test(server), "Server benachrichtigt Suchende bei neuer Fahrt");
  assert.ok(/\{ id: "mitfahrt", sym: "🚗", t: "Mitfahrt", los: \(\) => zumTreffen\(true\) \}/.test(html) && /if \(!darf \|\| mf\.some\(\(m\) => m\.eigen \|\| m\.dabei \|\| m\.frei > 0\)/.test(html), "Schnellstart prüft – nur nach Zusage, nur ohne freie Fahrt");
}

// 195. 1.42.0: „🤲 Ich biete Hilfe an“ (KC-CLUB-HILFE-ANGEBOT)
{
  for (const a of ["hilfe_angebot_speichern", "hilfe_angebot_beenden"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Aktion ${a} fehlt`);
  const mig = lies("supabase/migrations/20261002_kc_club_v1420_hilfe_angebote.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_hilfe_angebote from anon, authenticated/.test(mig) && /kc_db_mirror_table_rules/.test(mig) && /kc_neon_resume_tables/.test(mig), "RLS + Spiegel");
  const sp = server.slice(server.indexOf('case "hilfe_angebot_speichern"'), server.indexOf('case "hilfe_aufruf"'));
  // 2.23.44 (Wunsch Hansi, KC-CLUB-HILFE-KANAELE): verschickt nur, wenn beim Einstellen Push/E-Mail gewählt wurde – nie nach Voreinstellung
  assert.ok(!/[^.]senden\(/.test(sp) && /if \(wege\.length\) \{[^]*sendenGewaehlt\("club_nachricht", empf, wege,/.test(sp), "Anlegen verschickt nur auf Wunsch");
  assert.ok(/a\.von !== ich\.person_id && !ich\.vorstand/.test(sp), "Ändern/Beenden nur eigenes (oder Clubleitung)");
  assert.ok(/🤲 Ich biete Hilfe an<\/button>/.test(html) && /function angebotKachel\(a\)/.test(html), "Knopf + Kacheln");
  assert.ok(/await taForm\(\{ personen: \[a\.von\.person_id\] \}\);/.test(html) && /await direkt\(a\.von\.person_id\);/.test(html), "Termin anfragen (Terminanfrage) oder Nachricht");
  const na = html.slice(html.indexOf("async function angebotNachricht("), html.indexOf("function angebotNeu("));
  assert.ok(!/senden\(\)/.test(na), "Nachricht wird nur vorbereitet, nicht gesendet");
}

// 196. 1.42.1: Bild-Links laufen nicht mehr ab (KC-CLUB-BILD-LINK)
{
  const f = html.slice(html.indexOf("const bildCache = {}"), html.indexOf("async function anlageOeffnen("));
  assert.ok(/BILD_LINK_MS = 8 \* 60 \* 1000/.test(f) && /c\.bis < Date\.now\(\)/.test(f), "Link höchstens 8 Minuten wiederverwenden");
  assert.ok(/addEventListener\("error", \(\) => \{ if \(!img\.dataset\.nochmal\)/.test(f) && /bildLaden\(img, true\)/.test(f), "bei Ladefehler einmal frisch nachladen");
  assert.ok(/createSignedUrl\(att\.object_path, 600,/.test(server), "Server-Link 10 Minuten (Cache muss kürzer sein)");
}

// 197. 1.43.0: Club-Börse (KC-CLUB-BOERSE)
{
  for (const a of ["boerse_liste", "boerse_speichern", "boerse_status"]) assert.ok(aktionen.has(a) && aufrufe.has(a), `Aktion ${a} fehlt`);
  const mig = lies("supabase/migrations/20261002_kc_club_v1430_boerse.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_boerse, kc_club_boerse_treffer from anon, authenticated/.test(mig) && /kc_neon_resume_tables/.test(mig), "RLS + Spiegel");
  assert.ok(/jsonb_array_length\(fotos\) <= 3/.test(mig), "höchstens 3 Fotos");
  assert.ok(/const BOERSE_TAGE = 30, BOERSE_ERINNERN_TAGE = 3/.test(server), "30 Tage, 3 Tage vorher erinnern");
  assert.ok(/laeuft_bis: tagDazu\(berlinTag\(new Date\(\)\), BOERSE_TAGE\)/.test(server) && /erinnert_am: null/.test(server), "Laufzeit + Verlängern setzt Erinnerung zurück");
  assert.ok(/kc_club_boerse_treffer"\)\.insert\(\{ anzeige_id: id, gegen_id: g\.id \}\)/.test(server) && /if \(dopp\) continue;/.test(server), "Treffer nur einmal melden");
  const sp = server.slice(server.indexOf('case "boerse_speichern"'), server.indexOf('case "boerse_status"'));
  assert.ok(!/aktiveMitglieder\(\)/.test(sp) && /senden\("club_nachricht", \[g\.von\]/.test(sp), "kein Versand an alle – nur passende Gegen-Anzeigen");
  assert.ok(/startsWith\(`club\/\$\{ich\.person_id\}\/`\) && \/\^image\\\/\/\.test/.test(sp), "nur eigene Bilder als Fotos");
  assert.ok(/from\("kc_club_boerse"\)\.select\("id"\)\.eq\("status", "aktiv"\)\.contains\("fotos", JSON\.stringify\(\[att\.id\]\)\)/.test(server), "Fotos aktiver Anzeigen für Mitglieder sichtbar");
  assert.ok(/const boerse = await boerseWartung\(\)/.test(server), "Wartung: Erinnerung/Ablauf");
  assert.ok(/<button data-t="boerse" onclick="hlTab\('boerse'\)">🛍️ Börse<\/button>/.test(html) && /h\.startsWith\("#boerse="\)/.test(html), "Reiter + Sprung aus Push");
  assert.ok(/Auslaufen lassen/.test(html) && /⏳ Verlängern bis …/.test(html), "Verlängern bis … oder auslaufen lassen");
}

// 198. 1.44.0: Termine-Liste als kleine Kacheln (KC-CLUB-TERMIN-KACHELN)
{
  assert.ok(/kommend\.map\(\(t\) => treffenKachel\(t\)\)/.test(html) && /vorbei\.map\(\(t\) => treffenKachel\(t, true\)\)/.test(html), "Liste als Kacheln");
  assert.ok(/function treffenInfo\(id, vorbei\)/.test(html) && /treffenKarte\(t, vorbei\)/.test(html), "antippen öffnet den vollständigen Termin (alle Knöpfe bleiben)");
  assert.ok(/offen\.innerHTML = html; return;/.test(html), "Auffrischen tauscht nur den Inhalt (kein Überdecken anderer Fenster)");
  assert.ok(/👉 Antwort fehlt/.test(html), "fehlende Antwort sichtbar");
}

// 199. 1.44.1: DP2 Build 255 RC (dp3 ae349c0) – Reservierung je PC beim Club-App-Wunscheingang (KC-DP-WUNSCH-SPERRE)
{
  const q = JSON.parse(lies("dp2/QUELLE.json"));
  assert.ok(/^(ae349c0|51518cc|37bd067)/.test(q.commit) && /^0\.20\.0-build25[567]$/.test(q.dp2Version), "DP2 Build 255 RC (ae349c0) oder neuer übernommen");
  assert.ok(q.reihenfolge.includes("src/ui/wish-print.js") && q.reihenfolge.includes("src/ui/member-button-logic.js"), "Build-254-Bausteine (Ausdruck, Button-Logik) bleiben enthalten");
  assert.ok(/kc_dp_wish_inbox_claim/.test(lies("supabase/migrations/20261001_kc_dp_wunsch_eingang_sperre.sql")), "Datenbankseite der Reservierung vorhanden");
}

// 200. 1.45.0: Mitglieder als Kacheln oder Liste – jeder wählt selbst (KC-CLUB-MG-KACHELN)
{
  assert.ok(/id="mgAnsichtWahl"/.test(html) && /function mgAnsichtSetzen\(a\)/.test(html) && /localStorage\.setItem\("kc_club_mg_ansicht", MG_ANSICHT\)/.test(html), "Einstellung unter Darstellung (je Gerät)");
  assert.ok(/if \(MG_ANSICHT === "kacheln"\) \{ \$\("mitgliederListe"\)\.innerHTML = mgKachelnHtml\(liste\); return; \}/.test(html), "Kachel-Ansicht; Liste bleibt unverändert");
  assert.ok(/onclick="mitgliedOeffnen\('\$\{m\.person_id\}'\)"/.test(html) && /ICH\?\.admin \? `<div class="knoepfe"><button class="knopf" onclick="linkTeilen\(/.test(html), "Antippen → Details; Admin: 🔗/🎖️ in den Details");
}

// 201. 1.45.1: DP2 Build 256 RC (dp3 51518cc) – Twinkey einfacher und fehlersicher (KC-DP-TWINKEY-EINFACH)
{
  const q = JSON.parse(lies("dp2/QUELLE.json")), sw = lies("dp2/src/ui/simple-wish-assistant.js");
  assert.ok(/^(51518cc|37bd067)/.test(q.commit) && /^0\.20\.0-build25[67]$/.test(q.dp2Version), "DP2 Build 256 RC (51518cc) oder neuer übernommen");
  assert.ok(/id="swProgress"/.test(sw) && /id="swNextOpen"/.test(sw) && /id="swNextDay"/.test(sw), "Fortschritt und nächster offener Tag");
  assert.ok(/function confirmOpenDays\(\)/.test(sw) && /if\(confirmOpenDays\(\)\)finishOverview\(false\)/.test(sw), "Rückfrage vor „Fertig“ bei offenen Tagen");
  assert.ok(/if\(!can\.length\)can=\[\{start:null,end:null,wishZone:'B'\}\];/.test(sw) && /id="swWholeDay"/.test(sw), "Kann-Zeit nicht vorausgefüllt, ganze Zeit nur per Knopf");
  assert.ok(/!times\.length&&!wishChosen\?\['Bitte zuerst wählen/.test(sw), "Wunschzeit erst nach bewusster Wahl");
}

// 202. 1.46.0: einheitliches Bedienkonzept (KC-CLUB-DIALOG, KC-CLUB-NEU-EINHEITLICH, KC-CLUB-PROTOKOLL-KACHELN, Begriffe, Klappbereiche)
{
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  assert.ok(!/[^.\w]confirm\(/.test(code) && !/[^.\w]prompt\(/.test(code) && !/[^.\w]confirm\(|[^.\w]prompt\(/.test(html.replace(/<script>[\s\S]*?<\/script>/g, "")), "keine grauen Handy-Abfragen mehr (confirm/prompt)");
  assert.ok(/function frage\(text, opt = \{\}\)/.test(html) && /function eingabe\(text, wert = "", opt = \{\}\)/.test(html) && /\.blatt\.dlg-blatt \{ z-index: 5000; \}/.test(html), "App-Fenster über allem");
  assert.ok(/function rolleBearbeiten\(pid\)[^]{0,1500}class="roAmt"/.test(html) && /function mitfahrtAnbieten\([^]{0,1500}Wie viele freie Plätze\?/.test(html), "Amt & Rechte und Mitfahrt in je einem Fenster");
  assert.ok(/onclick="termineNeuWahl\(\)"[^>]*>＋ Neu<\/button>/.test(html) && !/id="neuAnfrageKnopf"/.test(html) && /onclick="hlNeuWahl\(\)">＋ Neu<\/button>/.test(html), "ein ＋ Neu oben rechts");
  assert.ok(/protokolle\.length \? `<div class="mini-kacheln">\$\{protokolle\.map\(protokollKarte\)/.test(html) && /data-klappe="pr_aufgaben"/.test(html), "Protokolle als Kacheln, Aufgaben klappbar");
  assert.ok(/data-klappe="tm_umfragen"/.test(html) && /data-klappe="tm_anfragen"/.test(html) && /data-klappe="tm_privat"/.test(html), "Termine-Bereiche klappbar");
  assert.ok(!/>Zurzeit ist kein Treffen geplant\.</.test(html) && /<span>Nächster Termin<\/span>\$\{mpfeil\("termin"/.test(html), "Begriffe: Termin / Sitzung / Veranstaltung");
}

// 203. 1.46.1: Themen und Abstimmungen als kleine Kacheln (KC-CLUB-VORSCHLAG-KACHELN)
{
  assert.ok(/function vorschlagKachel\(v\)[^]{0,1500}onclick="vorschlagInfo\('\$\{v\.id\}'\)"/.test(html), "Kachel öffnet Info-Fenster");
  assert.ok(/themen\.length \? `<div class="mini-kacheln">\$\{themen\.map\(vorschlagKachel\)/.test(html) && /abst\.map\(vorschlagKachel\)/.test(html) && /fertig\.map\(vorschlagKachel\)/.test(html), "Themen, Abstimmungen, Erledigtes als Kacheln");
}

// 204. 1.47.0: Mitglieder-Umschalter oben, Online als LED + Zahl, aufgeräumter Kopf in der einfachen Ansicht
{
  assert.ok(/id="mgAnsichtOben"[^]{0,200}mgAnsichtSetzen\('kacheln'\)[^]{0,200}mgAnsichtSetzen\('liste'\)/.test(html) && /querySelectorAll\("#mgAnsichtWahl button, #mgAnsichtOben button"\)/.test(html), "Kacheln | Liste oben in der Mitgliederübersicht");
  assert.ok(/function onlineZahlHtml\(\)[^]{0,600}frisch \? n : "\?"/.test(html) && !/keiner online/.test(html), "Online nur als LED + Zahl, unbekannt = grau mit ?");
  assert.ok(/body\.einfach #modusKnopf, body\.einfach #aktualisierenKnopf, body\.einfach #herzKnopf \{ display: none; \}/.test(html), "einfache Ansicht ohne Mond, Aktualisieren, Herz");
  assert.ok(/body\.einfach #leds:not\(:has\(\.led\.rot, \.led\.gelb\)\) \{ display: none; \}/.test(html), "LEDs in der einfachen Ansicht nur bei Störung");
}

// 205. 1.47.1: DP2 Build 257 RC (dp3 37bd067) – Twinkey übersichtlicher (KC-DP-TWINKEY-EINFACH)
{
  const q = JSON.parse(lies("dp2/QUELLE.json")), sw = lies("dp2/src/ui/simple-wish-assistant.js"), tw = lies("dp2/src/ui/twinkey.js");
  assert.ok(q.commit.startsWith("37bd067") && q.dp2Version === "0.20.0-build257", "DP2 Build 257 RC (37bd067) übernommen");
  assert.ok(/id="swNoBlock"/.test(sw) && /!blockChosen&&blockMode==='none'\?\['Bitte zuerst wählen/.test(sw), "Sperren als klare Antwort, Weiter ohne Antwort gesperrt");
  assert.ok(!/id="swBackTop"/.test(sw) && /\(step==='wish'\?teamButton\(\):''\)/.test(sw), "ein Zurück je Schritt, Besetzung nur bei der Wunschzeit");
  assert.ok(/<details class="sw-more">/.test(sw) && /sw-day-tile/.test(sw) && /\(Kann-Zeit\)/.test(sw) && /\(Wunschzeit\)/.test(sw), "kurze Zusammenfassung, Kacheln, Begriffe in Klammern wie Papier/Excel");
  assert.ok(!/id="twSkip"/.test(tw), "doppeltes „Überspringen“ entfernt");
}

// 206. 1.47.2: Online-Zahl größer (KC-CLUB-ONLINE-ZAHL)
{
  assert.ok(/\.onzahl \{[^}]*font-size: 1\.3rem/.test(html) && /\.onzahl \.led \{ width: 13px; height: 13px; \}/.test(html), "Online-Zahl gut lesbar");
}

// 207. 1.47.3: Pfeile der drei Startfelder rechts mittig auf dem Rand (KC-CLUB-MINI-PFEIL)
{
  assert.ok((html.match(/\$\{mpfeil\("(nachrichten|mitglieder|termin)", [^\n]*?\)\}<\/button>/g) || []).length === 3 && /return '<span class="mpfeil" aria-hidden="true">›<\/span>';/.test(html) && !/Nachr\. ›|Mitglieder ›<|Termin ›</.test(html), "drei Randpfeile, keine kleinen Pfeile im Text");
  assert.ok(/\.kacheln3 \.mini \.mpfeil \{[^}]*transform: translate\(50%, -50%\)/.test(html), "Pfeil mittig auf dem rechten Rand");
}

// 208. 1.48.0: Kacheln auch in der einfachen Ansicht verschieben – eigene Reihenfolge, nur oben/unten (KC-CLUB-EINFACH-ANORDNEN)
{
  assert.ok(!/Kacheln anordnen geht in der erweiterten Ansicht/.test(html) && !/body\.einfach #kaAusHinweis, body\.einfach #kachelLeiste/.test(html), "Anordnen in der einfachen Ansicht erlaubt");
  assert.ok(/const kaSchluessel = \(\) => einfach\(\) \? "einfach" : reg;/.test(html) && /KA\.reihenfolge\.einfach \|\| \[\]/.test(html), "eigene Reihenfolge der einfachen Ansicht (getrennt von der erweiterten)");
  assert.ok(/kaSchieben\('\$\{alle\[i\]\.id\}',\$\{d\}\)/.test(html) && /b\(i, -1, "▲", "nach oben"\)\}\$\{b\(i, 1, "▼", "nach unten"\)\}/.test(html), "nur ▲ / ▼, kein Ausblenden");
  assert.ok(/\[kaSchluessel\(\)\]: neu/.test(html) && /\[kaSchluessel\(\)\]: liste/.test(html), "Ziehen und Pfeile speichern in die richtige Reihenfolge");
}

// 209. 1.49.0: SOS – Mitglieder als Kacheln, Notfallkontakt rot (nur Clubleitung), Kacheln | Liste (KC-CLUB-SOS-KACHELN)
{
  assert.ok(/zeigNf = d\.siehtNotfall \|\| m\.selbst, nfJa = zeigNf && m\.notfall/.test(html), "rote Markierung nur, wenn die Clubleitung Notfallkontakte sieht (oder beim eigenen)");
  assert.ok(/function sosInfo\(id\)/.test(html) && /onclick="sosInfo\('\$\{m\.id\}'\)"/.test(html), "Kachel öffnet Fenster mit Anrufen/SMS/WhatsApp");
  assert.ok(/id="sosAnsicht"/.test(html) && /if \(aktuelleAnsicht === "sos"\) sosZeigen\(\);/.test(html), "Umschalter Kacheln | Liste im SOS-Bereich (gleiche Einstellung)");
  assert.ok(/Den Notfallkontakt sieht nur die Clubleitung \(Clubsprecher, Kassenwart, Admin\)/.test(html), "Hinweis für Mitglieder bleibt");
}

// 210. 1.49.1: SOS – eigene Kachel „(du)“ mit eigenem Notfallkontakt, neutrale Kreise (KC-CLUB-SOS-KACHELN)
{
  assert.ok(/zeigNf = d\.siehtNotfall \|\| m\.selbst/.test(html) && /const ich = d\.mitglieder\.find\(\(m\) => m\.selbst/.test(html), "eigene Kachel, eigener Notfallkontakt für jeden sichtbar");
  assert.ok(/if \(m\.selbst\) return blattAuf\("sosInfo"[^]{0,1200}einstiegHin\('privat','nfName'\)/.test(html), "eigenes Fenster mit Ändern/Eintragen statt Anrufen");
  assert.ok(/\.sos-k \.sos-av \{ background: #6b7577; \}/.test(html), "Kreise im SOS neutral (Rot = Notfallkontakt)");
}

// 211. 1.49.2: Zustellfehler nur rot, wenn danach nichts mehr ankam; „kein Push, keine Mail“ als Hinweis statt rot (KC-CLUB-ZUSTELLFEHLER)
{
  assert.ok(/zuletztOk\.get\(id \+ "\|" \+ x\.channel\)! > x\.created_at\) continue;/.test(server), "alter Fehler wird durch spätere Zustellung aufgehoben");
  assert.ok(!/Nicht erreichbar: kein Push und keine E-Mail/.test(server) && /unerreichbar: !ps\.has\(m\.person_id\) && !m\.email/.test(server), "kein Push/keine Mail nicht mehr als roter Fehler");
  assert.ok(/m\.unerreichbar \? "📵 nicht erreichbar – kein Push, keine Mail"/.test(html) && /ICH\.admin && m\.unerreichbar \? '<span class="mk-unter"/.test(html), "Hinweis in Liste und Kachel (nur Admin)");
}

// 212. 1.50.0: Status zeigt die eigene Ruhezeit; Status-Pfeil auf dem Rand (KC-CLUB-STATUS-RUHE, KC-CLUB-STATUS-PFEIL)
{
  assert.ok(/async function statusMap\(ids\?: string\[\], mitRuhe = false\)/.test(server) && /inRuhezeit\(\(x as any\)\.wert\) && \(!alt \|\| alt\.status === "verfuegbar"\)/.test(server), "Server: Ruhezeit nur statt „verfügbar“, Urlaub/krank haben Vorrang");
  assert.ok(/statusMap\(undefined, true\)/.test(server) && /statusMap\(\[pid\], true\)/.test(server) && !/case "status_setzen"[^]{0,300}"ruhe"/.test(server), "andere sehen die Ruhezeit; nicht speicherbar");
  assert.ok(/function inRuheJetzt\(r\)/.test(html) && /function eigenerStatus\(\)/.test(html) && /filter\(\(\[k\]\) => STATUS_WAEHLBAR\.includes\(k\)\)/.test(html), "eigener Status live, Ruhezeit nicht wählbar");
  assert.ok(/<span class="stpfeil" aria-hidden="true">›<\/span>/.test(html) && /\.statuschip \.stpfeil \{[^}]*rotate\(90deg\)/.test(html), "Pfeil auf dem Rand");
  assert.ok(/!\["verfuegbar", "ruhe"\]\.includes\(statusArt\(m\.status\)\)/.test(html), "Ruhezeit macht den Kreis nicht orange (abwesend)");
}

// 213. 1.51.0: Anklopfen mit Sekunden-Uhr + Begrüßung neuer Mitglieder (KC-CLUB-ANKLOPFEN-WARTEN, KC-CLUB-BEGRUESSUNG)
{
  assert.ok(/const KLOPF_WARTEN_SEK = 60;/.test(html) && /👋 Klopfe gerade an bei \$\{esc\(KW\.name\)\}/.test(html) && /class="kw-uhr"/.test(html), "Knopf „Klopfe gerade an bei X“ mit Sekunden-Uhr");
  assert.ok(/👋 Weiter anklopfen/.test(html) && /Nachricht senden: „Melde dich doch mal bei mir“/.test(html) && /📵 Auflegen/.test(html) && /`Melde dich doch mal bei mir\. Gruß \$\{/.test(html), "nach 1 Minute: weiter, Nachricht oder auflegen");
  assert.ok(/case "anklopfen_abbrechen"/.test(server) && /status: "abgebrochen"/.test(server) && /hat aufgelegt/.test(html), "Auflegen schließt die Frage beim Gegenüber");
  assert.ok(/aus\.neuDa = /.test(server) && /if \(ich\.admin\) \{\s*const \[\{ data: neu \}/.test(server) && /case "begruessung_vermerken"/.test(server), "Tagesinfo: heute zum ersten Mal da (nur Admin), einmal begrüßen");
  assert.ok(/Herzlich willkommen \$\{vorname\}\. Schön, dass du da bist\. Viel Spaß mit der Köcheclub-App\. Wenn etwas nicht klappt, melde dich gerne bei mir\. Gruß/.test(html) && /wege: \["push"\]/.test(html), "Begrüßung als Nachricht mit Push");
  const mig = lies("supabase/migrations/20261002_kc_club_v1510_erstmals.sql");
  assert.ok(/erstmals_gesehen = coalesce\(erstmals_gesehen, now\(\)\)/.test(mig) && /'abgebrochen'/.test(mig), "Migration: erster Besuch + Status abgebrochen");
}

// 214. 1.52.0: Notbetrieb bei Supabase-Ausfall – Ersatz-Server bei Cloudflare (KC-CLUB-NOTBETRIEB)
{
  const worker = lies("notbetrieb/worker.js"), wf = lies(".github/workflows/notbetrieb-hochladen.yml"), mig = lies("supabase/migrations/20261002_kc_club_v1520_notbetrieb.sql");
  // Server: eine Regel – dieselben Aktionen intern, nur lesend; Paket nur bei Änderung, signiert
  assert.ok(/async function aktionAusfuehren\(a: string, p: any, ich: Ich, req: Request/.test(server) && /(return await|const antwort = await) aktionAusfuehren\(a, p, ich, req, t0Anfrage, anmeldungMs\);/.test(server), "Aktionen in einer Funktion (auch intern nutzbar)");
  assert.ok(/nurLesen: true/.test(server) && /if \(!ich\.nurLesen\) await protokoll\(ich\.person_id, "sos_geoeffnet"/.test(server) && /fremd\.length && !ich\.nurLesen/.test(server) && /if \(!ich\.nurLesen\) await db\.from\("kc_communication_thread_participants"\)\.update/.test(server), "Paket-Bau schreibt nichts");
  assert.ok(/st\.fingerabdruck === fp/.test(server) && /name: "Ed25519"/.test(server) && /if \(!st\.url\) return \{ ok: true, aus:/.test(server), "nur bei Änderung, signiert, aus solange nicht eingerichtet");
  assert.ok(/'secret', false, false, false/.test(mig) && /cron\.schedule\('kc-club-notpaket-15min'/.test(mig), "Schlüssel nie gespiegelt, Lauf alle 15 Min.");
  // Ersatz-Server: nur lesen, Signatur prüfen, keine Geheimnisse
  assert.ok(/const LESEN = new Set\(\["init", "mitglieder", "treffen_liste", "sos_kontakte", "pinnwand", "unterhaltungen", "todo_liste", "dienste", "unterhaltung"\]\)/.test(worker) && /if \(!LESEN\.has\(a\)\) return antwort\(env, \{ error: NICHT_MOEGLICH/.test(worker), "Ersatz-Server nur lesend");
  assert.ok(/signaturOk\(env, roh, req\.headers\.get\("x-kc-signatur"\)\)/.test(worker) && /String\(p\.erstellt\) <= String\(alt\.erstellt\)/.test(worker) && !/service_role|SUPABASE_SERVICE/.test(worker), "Paket nur signiert und neuer, keine Geheimnisse");
  assert.ok(/CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/.test(wf) && /Cloudflare noch nicht eingerichtet/.test(wf), "Hochladen nur mit Secrets, sonst still");
  // App: Umschalten, Band, Rückkehr, Probe, Handschalter
  assert.ok(/if \(NOT\.an\) return await notApi\(action, daten\);/.test(html) && /e\?\.leitung && \(\+\+NOT\.fehler >= NOT_FEHLER_GRENZE \|\| action === "init"\)/.test(html), "automatisch umschalten");
  assert.ok(/Ansehen geht(, Ändern, Fotos und Push gerade nicht\.|\. Nachrichten, Zu-\/Absagen, Status und Zettel werden später übertragen\. Fotos und Push gerade nicht\.)/.test(html) && /if \(\+\+NOT\.ok >= 2\) notAus\(/.test(html) && /id="notProbeKnopf"/.test(html) && /k\?\.modus === "an"/.test(html), "Band, Rückkehr, Probe, Handschalter");
  const nb = JSON.parse(lies("notbetrieb.json")); assert.ok(["auto", "an", "aus"].includes(nb.modus), "notbetrieb.json gültig");
}

// 215. 1.52.1: Notbetrieb-Band verdeckt keine Meldungen (KC-CLUB-NOTBETRIEB)
{
  assert.match(html, /\.meldung \{[^}]*top: calc\(14px \+ var\(--notH, 0px\)\)/, "Meldungen rutschen unter das Notbetrieb-Band");
  assert.match(html, /#stBalken \{[^}]*var\(--notH, 0px\)/, "SOS-Balken rutscht unter das Notbetrieb-Band");
  assert.match(html, /function notBandHoehe\(el\)[\s\S]{0,300}setProperty\("--notH"/, "Bandhöhe wird gesetzt");
  assert.match(html, /notBand"\)\?\.remove\(\);[^\n]*removeProperty\("--notH"\)/, "beim Ausschalten zurückgesetzt");
}

// 216. 1.52.2: Status-Pfeil auf der Unterkante, Feld-Pfeile einheitlich (Wunsch Hansi)
{
  assert.match(html, /\.statuschip \.stpfeil \{[^}]*left: 50%; bottom: 0; transform: translate\(-50%, 50%\) rotate\(90deg\)/, "Status-Pfeil mittig auf der Unterkante");
  assert.match(html, /body:not\(\.einfach\) \.kacheln3 \.mini \.mpfeil \{ top: 74%; \}/, "Feld-Pfeile in der erweiterten Ansicht einheitlich");
  assert.doesNotMatch(html, /\.mini:last-child \.mpfeil \{ top: auto; bottom: 8px/, "rechter Pfeil nicht mehr unten im Text");
}

// 217. 1.53.0: Wichtige Nachricht (KC-CLUB-WICHTIG)
{
  const srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261002_kc_club_v1530_wichtig.sql");
  assert.match(html, /id="wichtigKnopf" onclick="wichtigUmschalten\(\)">❗<\/button>/, "❗-Knopf unter dem Schreibfeld");
  assert.match(html, /\.\.\.\(WICHTIG \? \{ wichtig: true \} : \{\}\)/, "senden schickt wichtig nur wenn an");
  assert.match(html, /wichtigUmschalten\(false\); \/\/ KC-CLUB-ENTWURF \/ -RUHIGE-EINGABE \/ -WICHTIG/, "nach dem Senden wieder normal");
  assert.match(html, /\$\{m\.wichtig \? " wichtig" : ""\}/, "Blase bekommt Klasse wichtig");
  assert.match(html, /\.blase\.wichtig \{ border: 3px solid #ff9800/, "wichtige Nachricht orange umrandet");
  assert.match(html, /u\.wichtigNeu \? " wichtig-neu" : ""/, "Chat-Liste markiert ungelesene wichtige Nachricht");
  assert.match(srv, /const wichtig = \(!!p\.wichtig( \|\| notfall)?\) && !umfrage && !kontaktPid;|const wichtig = !!p\.wichtig && !umfrage && !kontaktPid;/, "Server: nur normale Nachrichten"); // 2.21.0: Notfall ist immer wichtig
  assert.match(srv, /from\("kc_club_nachricht_wichtig"\)\.insert\(\{ message_id: m\.id, person_id: ich\.person_id \}\)/, "Server speichert Kennzeichen");
  assert.match(srv, /if \(we\) \{ await db\.from\("kc_communication_messages"\)\.delete\(\)\.eq\("id", m\.id\)/, "kein halber Zustand");
  assert.match(srv, /wichtig: wichtigIds\.has\(m\.id\)/, "Chat liefert wichtig");
  assert.match(srv, /wichtigNeu: m\.filter/, "Liste liefert wichtigNeu");
  assert.match(srv, /titel: (notfall \? `🚨 NOTFALL(\$\{probe \? "-PROBE" : ""\})? – \$\{ich\.vorname\}` : )?wMarke \+ \(grp/, "Push-Titel mit ❗"); // 2.21.0: Notfall eigener Titel
  assert.match(mig, /references kc_communication_messages\(id\) on delete cascade/, "hängt an der Nachricht");
  assert.match(mig, /enable row level security/, "RLS an");
  assert.match(mig, /revoke all on kc_club_nachricht_wichtig from anon, authenticated/, "kein Direktzugriff");
}

// 218. 1.53.1: Wichtig auch in den Nachricht-Infos (KC-CLUB-WICHTIG)
{
  const srv = lies("supabase/functions/kc-club/index.ts");
  assert.match(srv, /wegeSichtbar: darfWege, wichtig: !!wi \}/, "nachricht_details liefert wichtig");
  assert.match(html, /\$\{r\.wichtig \? '<div class="ni-zeile ni-wichtig">❗ ?<span>|\$\{r\.wichtig \? '<div class="ni-zeile ni-wichtig"><span>❗ <b>Wichtige Nachricht<\/b><\/span><span>Wichtigkeit: hoch<\/span>/, "Info zeigt Wichtigkeit hoch");
  assert.match(srv, /const stumm = await stummFuer\(/, "stumm bleibt stumm (auch bei ❗)");
}

// 219. 1.53.2: Reiter „Meins“, „✏️ … schreibt“ mit Welle
{
  assert.match(html, /\["mein", "Meins"\]/, "Reiter heißt Meins");
  assert.doesNotMatch(html, /\["mein", "Mein Bereich"\]/, "alter Name weg");
  assert.match(html, /<span class="punkte3"><i><\/i><i><\/i><i><\/i><\/span><span>✏️ \$\{esc\(wer\)\}/, "Stift + Welle bleiben");
}

// 220. 1.53.3/1.53.4: „Neue Nachr.“ mit laufender orange Ameisenstraße (KC-CLUB-NEU-AMEISEN)
{
  assert.match(html, /\$\{n \? '<svg class="ameisen" aria-hidden="true"><rect width="100%" height="100%" rx="16"\/><\/svg>' : ""\}/, "Rand als echtes SVG im Feld, nur bei Neuem");
  assert.match(html, /\.mini\.mini-neu \.ameisen rect \{ fill: none; stroke: #ff9800; stroke-width: 6; stroke-dasharray: 9 6; animation: ameisenLauf 1s linear infinite; \}/, "laufender orange Rand");
  assert.match(html, /@keyframes ameisenLauf \{ to \{ stroke-dashoffset: -15; \} \}/, "Lauf");
  assert.match(html, /prefers-reduced-motion: reduce\) \{ \.mini\.mini-neu \.ameisen rect \{ animation-duration: 3s; \} \}/, "reduzierte Bewegung: langsam statt Stillstand");
  assert.doesNotMatch(html, /\.mini\.mini-neu::before/, "kein Hintergrundbild-Rand mehr");
  assert.doesNotMatch(html, /\.mini\.mini-neu \{ background: linear-gradient\(135deg, #f39c12/, "Feld nicht mehr ganz orange");
}

// 221. 1.53.6: „Nächster Termin“ mit Ameisenstraße je nach Tagen bis zum Termin (KC-CLUB-FRIST-AMEISEN)
{
  const def = html.match(/const fristStufe = \(tage\) => [^;]+;/)?.[0];
  assert.ok(def, "fristStufe fehlt");
  const fristStufe = new Function(`${def} return fristStufe;`)();
  const erwartet = [[0, "rot"], [1, "rot"], [2, "orange"], [3, "orange"], [4, "gruen"], [5, "gruen"], [6, ""], [30, ""]];
  for (const [tage, stufe] of erwartet) assert.equal(fristStufe(tage), stufe, `${tage} Tage → ${stufe || "kein Rand"}`);
  assert.match(html, /frist = fristStufe\(tage\);/, "Stufe aus derselben Tageszahl wie die Anzeige");
  assert.match(html, /<button class="mini\$\{frist \? " mini-frist frist-" \+ frist : ""\}" onclick="zumTreffen\(\)">\$\{frist \? '<svg class="ameisen"/, "Rand nur bei Stufe, als SVG im Feld");
  assert.match(html, /\.mini\.frist-gruen \{ --frist-lauf: 2\.4s; \} \.mini\.frist-gruen \.ameisen rect \{ stroke: #a5e887; \}/, "hellgrün langsam");
  assert.match(html, /\.mini\.frist-orange \{ --frist-lauf: 1\.4s; \} \.mini\.frist-orange \.ameisen rect \{ stroke: #ff9800; \}/, "orange");
  assert.match(html, /\.mini\.frist-rot \{ --frist-lauf: \.8s; \} \.mini\.frist-rot \.ameisen rect \{ stroke: #ff4d4d; \}/, "rot schnell");
  assert.match(html, /prefers-reduced-motion: reduce\) \{ \.mini\.mini-frist \.ameisen rect \{ animation-duration: 3s; \} \}/, "reduzierte Bewegung: langsam");
}

// 222. 1.54.0: Notbetrieb Stufe 2 – Schreiben im Notbetrieb, Nachtragen (KC-CLUB-NOTBETRIEB-STUFE2)
{
  const srv = lies("supabase/functions/kc-club/index.ts"), wk = lies("notbetrieb/worker.js"), mig = lies("supabase/migrations/20261002_kc_club_v1540_notbetrieb_stufe2.sql");
  // Worker: nur vier Schreib-Aktionen, Eingang statt Ausführen, Abholen/Quittieren nur signiert mit Zeitstempel
  for (const a of ["nachricht_senden", "treffen_antwort", "status_setzen", "pinnwand_anheften"]) assert.match(wk, new RegExp(`\\n  ${a}: \\(p`), `Worker nimmt ${a} an`);
  assert.match(wk, /if \(SCHREIBEN\[a\]\) return await eingangLegen\(env, hash, m, a, p, nb\);/, "Schreiben → Eingang");
  assert.match(wk, /Neue Chats gehen im Notbetrieb nicht – bitte einen Chat aus der Liste öffnen und dort schreiben\./, "keine neuen Unterhaltungen");
  assert.match(wk, /if \(!\(await env\.PAKET\.get\(schluessel\)\)\)/, "gleiche notId nicht doppelt");
  assert.match(wk, /EINGANG_JE_MITGLIED = 40/, "Grenze je Mitglied");
  assert.match(wk, /j\?\.zweck !== zweck \|\| Math\.abs\(Date\.now\(\) - Date\.parse\(j\.zeit\)\) > SIGNATUR_ZEIT_MS/, "signiert + Zeitstempel");
  // Server: genau einmal, normale Aktion, Ablehnung mit Grund, erst danach quittieren
  assert.match(srv, /upsert\(\{ schluessel, not_id:[\s\S]{0,300}\{ onConflict: "schluessel", ignoreDuplicates: true \}\)/, "Merkzettel: jeder Eintrag einmal");
  assert.match(srv, /const r = await aktionAusfuehren\(e\.aktion, daten, ich, new Request\(APP_URL/, "über die normale Aktion");
  assert.match(srv, /if \(x instanceof Fehler\) \{ await ablehnen\(x\.message, zg\.person_id\); continue; \}/, "Ablehnung mit Grund");
  assert.match(srv, /await notSigniert\("\/eingang\/quittieren"/, "danach quittieren");
  assert.match(srv, /const nachtrag = await notEingangLauf\(\)/, "Zeitplaner trägt nach");
  assert.match(srv, /case "notbetrieb_nachtragen": \{/, "App kann sofort nachtragen lassen");
  assert.match(srv, /aus\.notNachtrag = /, "Tagesinfo Admin");
  assert.match(mig, /check \(status in \('offen', 'erledigt', 'abgelehnt'\)\)/, "Zustände");
  assert.match(mig, /revoke all on public\.kc_club_notbetrieb_eingang from public, anon, authenticated/, "kein Direktzugriff");
  // App
  assert.match(html, /const NOT_SCHREIBEN = \["nachricht_senden", "treffen_antwort", "status_setzen", "pinnwand_anheften"\]/, "App kennt die vier");
  assert.match(html, /if \(schreiben\) daten = \{ \.\.\.daten, notId: notNeueId\(\) \};/, "notId je Eintrag");
  assert.match(html, /\.join\(""\) \+ notWartendeHtml\(chatId\)/, "⏳-Blasen im Chat");
  assert.match(html, /setTimeout\(notNachtragen, 1500\); \/\/ KC-CLUB-NOTBETRIEB-STUFE2/, "nach Rückkehr nachtragen");
  assert.match(html, /\$\{w > 1 \? "warten" : "wartet"\}/, "Zahl im Band");
  assert.ok(lies("docs/NOTBETRIEB.md").includes("Stufe 2"), "Doku");
}

// 223. 1.54.1: Ernstfall-Simulation nur auf diesem Gerät (KC-CLUB-NOTBETRIEB-ERNSTFALL)
{
  const roh = html.slice(html.indexOf("async function apiRoh("), html.indexOf("async function apiRoh(") + 600);
  assert.match(roh, /if \(notErnstfall\(\)\) \{[^\n]*throw Object\.assign\(new Error\("Keine Verbindung zum Server – bitte gleich nochmal versuchen\."\), \{ leitung: true \}\); \}/, "simuliert genau den Verbindungsfehler");
  assert.match(html, /id="notErnstfallKnopf" onclick="notErnstfallSetzen\(!notErnstfall\(\)\)"/, "Admin-Knopf");
  const f0 = html.indexOf("function notErnstfallSetzen("), f = html.slice(f0, html.indexOf("\n}\n", f0));
  assert.doesNotMatch(f, /notEinschalten\(/, "kein Umschalten von Hand – die App muss es selbst erkennen");
  assert.match(html, /if \(FP_LEISE\.has\(action\) \|\| notErnstfall\(\)( \|\| NOT\.an)?\) return;/, "Simulation nicht im Fehlerprotokoll");
  assert.match(html, /notErnstfall\(\) \? ` <button onclick="notErnstfallSetzen\(false\)">Simulation beenden<\/button>`/, "Beenden im Band");
}

// 224. 1.55.0: Haken wie WhatsApp (KC-CLUB-HAKEN)
{
  const srv = lies("supabase/functions/kc-club/index.ts");
  assert.match(srv, /select\("correlation_id,channel,status,recipient_refs"\)/, "Push-Rückmeldung je Empfänger");
  assert.match(srv, /\(x\.last_read_at && x\.last_read_at >= m\.created_at\) \|\| pushDa\.get\(m\.id\)\?\.has\(x\.person_id\) \|\| \(zuletztDa\.get\(x\.person_id\) \?\? ""\) >= m\.created_at/, "angekommen: gelesen, Push angezeigt oder App danach online");
  assert.match(srv, /haken: andere\.length > 0 && gelesenVon\.length === andere\.length \? "gelesen" : andere\.length > 0 && angekommenBei\(m\) === andere\.length \? "angekommen" : "gesendet"/, "drei Stufen, Gruppe erst wenn alle");
  const f = html.slice(html.indexOf("function hakenHtml("), html.indexOf("function zustellText("));
  const f2 = html.slice(html.indexOf("const HAKEN_EINS"), html.indexOf("function hakenHtml("));
  const hk = new Function(`${f2}; ${f}; return hakenHtml;`)();
  assert.match(hk({ haken: "gesendet" }, 1), /^<span class="haken" title="gesendet[^"]*" aria-label="gesendet"><svg viewBox="0 0 13 11"/, "ein Haken");
  assert.match(hk({ haken: "angekommen" }, 1), /^<span class="haken" title="auf dem Handy[^"]*" aria-label="angekommen"><svg viewBox="0 0 19 11"/, "zwei graue Haken");
  assert.match(hk({ haken: "gelesen" }, 1), /^<span class="haken blau" title="gelesen" aria-label="gelesen"><svg viewBox="0 0 19 11"/, "zwei blaue Haken");
  assert.match(hk({ haken: "angekommen", gelesenVon: ["A", "B"] }, 5), /2\/5<\/small>$/, "Gruppe: Teil gelesen");
  assert.match(html, /\.haken\.blau, \.blase\.eigen \.haken\.blau \{ color: #5fd3ff;/, "blau wie WhatsApp (heller, gut sichtbar auf Rot)");
  assert.match(html, /\[m\.id, m\.gelesenVon\?\.length, m\.haken,/, "Chat zeichnet bei neuem Haken neu");
}

// 225. 1.56.0: Ansage „… ist jetzt online“, Admin-Ton (KC-CLUB-ONLINE-ANSAGE)
{
  const code = html.slice(html.indexOf("const ANSAGE = "), html.indexOf("function sprechen("));
  const gesagt = [], toene = [];
  const run = new Function("ICH", "INIT", "document", "inRuheJetzt", "localStorage", "setTimeout", "sprechen", "anmeldeTon",
    `${code}; return { onlineAnsagen, OA };`);
  const speicher = { kc_club_online_ansage: "1" };
  const ls = { getItem: (k) => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = v; } };
  const { onlineAnsagen, OA } = run({ person_id: "ICH", admin: true }, {}, { hidden: false }, () => false, ls, (f) => f(), (t) => gesagt.push(t), () => toene.push(1));
  onlineAnsagen([{ person_id: "ICH" }, { person_id: "A", vorname: "Klaus" }]);
  assert.equal(gesagt.length, 0, "erste Liste: niemand wird angesagt");
  onlineAnsagen([{ person_id: "ICH" }, { person_id: "A", vorname: "Klaus" }, { person_id: "B", vorname: "Dieter" }]);
  assert.deepEqual(gesagt, ["Dieter ist jetzt online"], "Neuer wird angesagt, ich selbst nie");
  assert.equal(toene.length, 1, "Admin: Ton");
  onlineAnsagen([{ person_id: "A", vorname: "Klaus" }]); onlineAnsagen([{ person_id: "A", vorname: "Klaus" }, { person_id: "B", vorname: "Dieter" }]);
  assert.equal(gesagt.length, 1, "kurz weg und wieder da: keine zweite Ansage");
  onlineAnsagen([{ person_id: "A" }, { person_id: "B" }, { person_id: "C", vorname: "Steven" }, { person_id: "D", vorname: "Willfried" }]);
  assert.equal(gesagt[1], "Steven und Willfried sind jetzt online", "mehrere zusammen");
  assert.match(html, /id="setAnsage" onchange="ansageSchalter\(this\.checked\)"/, "Schalter in den Einstellungen");
  assert.match(html, /id="setAnmeldeTonZeile"[^\n]*id="setAnmeldeTon"/, "Admin-Ton-Schalter");
  // 1.64.0: Prüfung „Hintergrund/Ruhezeit“ sitzt in onlineAnsageSprechen (gemeinsam für Online-Takt und Admin-Push)
  assert.match(code, /if \(!neu\.length \|\| document\.hidden\) return;/, "im Hintergrund nichts");
  assert.match(code, /function onlineAnsageSprechen\(namen\) \{\n  if \(document\.hidden \|\| inRuheJetzt\(INIT\?\.einstellungen\?\.ruhezeit\)\) return;/, "nicht in Ruhezeit / im Hintergrund");
  assert.match(html, /onlineAnsagen\(ONL\.liste\); \/\/ KC-CLUB-ONLINE-ANSAGE/, "an der vorhandenen Online-Liste");
}

// 226. 1.57.0: Push an Admin, wenn jemand online kommt (KC-CLUB-ONLINE-PUSH)
{
  const srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261003_kc_club_v1570_online_push.sql");
  assert.match(srv, /if \(!a\.vorher \|\| Date\.now\(\) - Date\.parse\(a\.vorher\) >= ONLINE_PUSH_PAUSE_MS\)/, "nur nach ≥ 10 Min. Pause");
  assert.match(srv, /const ONLINE_PUSH_PAUSE_MS = 10 \* 60000;/, "10 Minuten");
  const f = srv.slice(srv.indexOf("async function onlinePushMelden("), srv.indexOf("async function onlineJetzt("));
  assert.match(f, /\.get\(wer\.person_id\) === false\) return;/, "unsichtbar → keine Meldung");
  // 2.22.17 (Wunsch Hansi, KC-CLUB-ONLINE-PUSH-ALLE): Admins (Standard an) + Mitglieder, die es selbst einschalten – nie an sich selbst
  assert.match(f, /eq\("ist_admin", true\)/, "Admins bekommen die Meldung");
  assert.match(f, /filter\(\(x: any\) => x\.wert\?\.an === true\)/, "andere nur, wenn selbst eingeschaltet");
  assert.match(f, /filter\(\(id\) => id !== wer\.person_id && aktivIds\.has\(id\)/, "nie an sich selbst, nur aktive");
  // 1.64.0 (Fund Hansi): auch bei offener App senden – jedes Gerät entscheidet (sichtbar → Ansage in der App, sonst Mitteilung)
  assert.match(f, /ids = ids\.filter\(\(id\) => !aus\.has\(id\) && !ruhe\.has\(id\)\);/, "abschaltbar, Ruhezeit");
  assert.match(f, /routerSenden\("club_online"/, "über den Communicator");
  assert.match(mig, /'vorher', v_vorher/, "Anmeldung liefert vorher");
  assert.match(mig, /'club_online', [^\n]*array\['push'\]/, "nur Push");
  assert.match(html, /id="setOnlinePushZeile"[^\n]*id="setOnlinePush" onchange="onlinePushSchalter\(this\.checked\)"/, "Admin-Schalter");
}

// 227. 1.57.1: Ansage-Schalter in beiden Ansichten sichtbar
{
  const k0 = html.indexOf('<details class="karte" data-klappe="ansagen" data-einfach open>'), k1 = html.indexOf("</details>", k0);
  assert.ok(k0 > 0, "eigener Kasten mit data-einfach (einfache Ansicht) – kein data-klappe=\"einfach\" (sonst in der erweiterten weg)");
  const kasten = html.slice(k0, k1);
  for (const id of ["setAnsage", "setAnmeldeTon", "setOnlinePush"]) assert.ok(kasten.includes(`id="${id}"`), `${id} im Kasten`);
  const e0 = html.indexOf('data-klappe="einfach"'), e1 = html.indexOf("</details>", e0);
  assert.ok(!html.slice(e0, e1).includes('id="setAnsage"'), "nicht mehr nur in der einfachen Ansicht");
}

// 228. 1.58.0: Fehlerprotokoll einstufen, leeren, überwachen (KC-CLUB-FP-UEBERWACHUNG)
{
  const srv = lies("supabase/functions/kc-club/index.ts");
  const def = srv.slice(srv.indexOf("const FP_SCHWER"), srv.indexOf("async function fpZaehlen(")).replace(/: "schwer" \| "hinweis" \| "info"/, "").replace(/\(aktion: string, d: any\)/, "(aktion, d)");
  const fpStufe = new Function(`${def}; return fpStufe;`)();
  assert.equal(fpStufe("hilferuf", {}), "schwer"); assert.equal(fpStufe("fehler_anonym_start_kaputt", {}), "schwer");
  assert.equal(fpStufe("fehler_skript", { text: "Script error." }), "hinweis", "Safari ohne Einzelheiten nur Hinweis");
  assert.equal(fpStufe("fehler_skript", { text: "x is not defined" }), "schwer");
  assert.equal(fpStufe("fehler_sicherheit", { probleme: [] }), "info"); assert.equal(fpStufe("fehler_sicherheit", { probleme: ["a"] }), "schwer");
  for (const a of ["fehler_alte_version", "fehler_update_getippt", "diagnose_start", "fehler_umgebung"]) assert.equal(fpStufe(a, {}), "info", a);
  assert.equal(fpStufe("fehler_api", { text: "x" }), "hinweis");
  const leeren = srv.slice(srv.indexOf('case "fehlerprotokoll_leeren"'), srv.indexOf('case "fehlerprotokoll_leeren"') + 1600);
  assert.ok(leeren.indexOf('aktion: "fp_geleert"') > 0 && leeren.indexOf('aktion: "fp_geleert"') < leeren.indexOf(".delete()"), "erst Sicherung, dann löschen");
  assert.match(leeren, /nurAdmin\(ich\);/, "nur Admin");
  assert.match(srv, /await fpUeberwachen\(\)\.catch/, "Wartung überwacht");
  assert.match(srv, /routerSenden\("club_fehler", an,/, "Push an den Admin");
  assert.match(srv, /if \(fz\.anzahl >= FP_VOLL\) aus\.fpVoll = fz;/, "Tagesinfo fragt bei vollem Protokoll");
  assert.doesNotMatch("fp_geleert", /^fehler/, "Sicherung fällt nicht selbst unter das Fehlerprotokoll");
  assert.match(html, /onclick="fpLeeren\(\$\{r\.gesamt\.anzahl\}, \$\{r\.gesamt\.schwer\}\)">🗑️ Protokoll leeren<\/button>/, "Knopf");
  assert.match(html, /<b>Soll ich das Fehlerprotokoll leeren\?<\/b> Es sind \$\{d\.fpVoll\.anzahl\} Einträge drin/, "Frage in der Tagesinfo");
  assert.match(html, /notErnstfall\(\) \|\| NOT\.an\) return;/, "Notbetrieb nicht ins Protokoll");
  assert.match(lies("notbetrieb/worker.js"), /pinnwand_neu: \(\) => \(\{ neu: \[\] \}\)/, "Ersatz-Server still");
}

// 229. 1.58.1: Tipp des Tages in beiden Ansichten
{
  const k0 = html.indexOf('<details class="karte" data-klappe="ansagen" data-einfach open>'), kasten = html.slice(k0, html.indexOf("</details>", k0));
  assert.ok(kasten.includes('id="setTipps"'), "Tipp-Schalter im Kasten für beide Ansichten");
  assert.equal((html.match(/id="setTipps"/g) || []).length, 1, "nur einmal");
}

// 230. 1.58.2: Update-Meldung passt immer zur aktuellen Version (kein alter Text bei jedem Update)
{
  const vj = JSON.parse(lies("version.json"));
  assert.equal(vj.verlauf[0].version, vj.version, "neuester Verlaufseintrag = aktuelle Version");
  assert.deepEqual(vj.neu, vj.verlauf[0].neu, "„neu“ (Update-Meldung) = Text der aktuellen Version");
  const f = html.slice(html.indexOf("function neuigkeitenSeit("), html.indexOf("function neuigkeitenZeigen("));
  const neuigkeitenSeit = new Function("versionNeuer", `${f}; return neuigkeitenSeit;`)((a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; });
  assert.deepEqual(neuigkeitenSeit({ version: "2.0.1", neu: ["ALT"], verlauf: [{ version: "2.0.0", neu: ["x"] }] }, "2.0.0", "2.0.1"), [], "kein Verlaufseintrag im Bereich → kein alter Text");
}

// 231. 1.59.0: Vorlesen, Tipps mit „Zeig mir wo“, runde Knöpfe mittig
{
  const code = html.slice(html.indexOf('const VORLESEN = "kc_club_vorlesen"'), html.indexOf("function naVorlesen("));
  const gesagt = []; const speicher = { kc_club_vorlesen: "1" };
  const run = new Function("lsLesen", "sprechen", "document", "env", `let chatId = null; ${code}; return { vorlesenNeue, setChat: (c) => { chatId = c; } };`);
  const { vorlesenNeue, setChat } = run((k) => speicher[k] ?? null, (t) => gesagt.push(t), { hidden: false });
  setChat("c1"); vorlesenNeue([{ id: "1", von: "Klaus Zander", text: "Alt" }]);
  assert.equal(gesagt.length, 0, "beim Öffnen nichts vorlesen");
  vorlesenNeue([{ id: "1", von: "Klaus Zander", text: "Alt" }, { id: "2", von: "Klaus Zander", text: "Kommst du?" }, { id: "3", eigen: true, von: "Du", text: "Ja" }]);
  assert.deepEqual(gesagt, ["Klaus: Kommst du?"], "nur Neues von anderen");
  vorlesenNeue([{ id: "4", von: "Dieter X", text: "Achtung", wichtig: true }]);
  assert.equal(gesagt[1], "Dieter, wichtig: Achtung", "wichtig wird angesagt");
  assert.match(html, /id="chatVorlesenKnopf"[^>]*onclick="vorlesenSchalter\(!vorlesenAn\(\)\)">🔇<\/button>/, "Lautsprecher im Chat");
  assert.match(html, /naVorlesen\('\$\{id\}'\)">🔊 Vorlesen<\/button>/, "Menüeintrag");
  assert.match(html, /id: "sprachansage"[^\n]*ja: "👉 Ja, zeig mir wo", nein: "⏰ Nein, später", neinSpaeter: true, nur: \(\) => !ansageAn\(\), testen: \(\) => einstiegHin\("ansagen", "setSprAnsZeile"\)/, "Tipp Sprachansage führt genau hin"); // 1.75.0: Zeile „Sprachansagen“ (Online-Ansage dort zusammengefasst)
  assert.match(html, /id: "vorlesen"[^\n]*testen: \(\) => einstiegHin\("ansagen", "setVorlesenZeile"\)/, "Tipp Vorlesen");
  assert.match(html, /\$\("tdtKenne"\)\.onclick = tipp\.neinSpaeter \? \(\) => \$\("tdtSpaeter"\)\.onclick\(\)/, "Nein = später");
  assert.match(html, /\.rund \{[^}]*display: inline-flex; align-items: center; justify-content: center; padding: 0;/, "Symbole mittig");
}

// 232. 1.60.0: Bedienungsanleitung Club-App (PDF wie Kasse) in „Meine Dokumente“
{
  // 1.81.0: Eintrag zeigt Version 2 (V1-Datei bleibt unverändert im Repo – Release-Artefakte sind unveränderlich)
  assert.ok(/\{ id: "bedienung-club-app-v[2345]", sym: "📖", t: "Bedienungsanleitung Club-App"[^}]*datei: "dokumente\/Koecheclub-App_Anleitung_V[2345]\.pdf"(, neuBis: "[\d-]+")? \}/.test(html), "Eintrag Bedienungsanleitung fehlt"); // 2.1.2: Version 3 (V1/V2 bleiben unverändert im Repo)
  assert.ok(/datei: "dokumente\/Koecheclub-App_Kurzanleitung\.pdf"/.test(html), "Kurzanleitung muss bleiben");
  const pdf = fs.readFileSync(new URL("../dokumente/Koecheclub-App_Anleitung_V1.pdf", import.meta.url));
  assert.ok(pdf.subarray(0, 5).toString() === "%PDF-" && pdf.length < 8e6, "Anleitung-PDF fehlt oder zu groß");
  const werkzeug = ["basis", "demo", "fotos", "inhalt", "bau"].map((n) => fs.readFileSync(new URL(`../tools/anleitung/${n}.mjs`, import.meta.url), "utf8")).join("\n");
  assert.ok(!/ptblnpiroqftcvlsrhac|service_role|eyJ[A-Za-z0-9_-]{20}/.test(werkzeug), "Bau-Werkzeug darf keine echten Zugänge enthalten");
}

// 233. 1.61.0: neues Dokument leise anzeigen (eine Zeile, kein Fenster/Push), weg nach Öffnen/✕/Ablauf
{
  const code = html.slice(html.indexOf('const DOK_GESEHEN = "kc_club_dok_gesehen"'), html.indexOf("function dokOeffnen("));
  const speicher = {}; let heute = "2026-10-03";
  const run = new Function("DOKUMENTE", "lsLesen", "localStorage", "heuteIso", "INIT", `${code}; return { dokNeu, dokHinweis, dokErledigt };`);
  const DOKS = [{ id: "a", datei: "dokumente/a.pdf", neuBis: "2026-10-31" }, { id: "b", datei: "dokumente/b.pdf", neuBis: "2026-10-31" }, { id: "c", datei: "dokumente/c.pdf" }];
  const { dokNeu, dokHinweis, dokErledigt } = run(DOKS, (k) => speicher[k] ?? null, { setItem: (k, v) => { speicher[k] = v; } }, () => heute, null);
  assert.equal(dokHinweis()?.id, "a", "höchstens ein Hinweis, der erste neue");
  assert.equal(dokNeu(DOKS[2]), false, "ohne neuBis nie neu");
  dokErledigt("a"); assert.equal(dokHinweis()?.id, "b", "nach Öffnen/✕ verschwindet der Hinweis");
  heute = "2026-11-01"; assert.equal(dokHinweis(), null, "nach neuBis kein Hinweis mehr");
  assert.ok(/neuBis: "20\d\d-\d\d-\d\d" \}/.test(html) /* 2.1.2: V3 bis 15.11. als neu */ && /if \(dokNeu\(d\)\) dokErledigt\(id\);/.test(html), "Anleitung als neu markiert / Öffnen merkt sich");
  const ruhig = html.slice(html.indexOf("// KC-CLUB-DOK-NEU (1.61.0"), html.indexOf("function dokOeffnen("));
  assert.ok(!/api\(|pushSenden|blattZeigen|melde\(|sprechen\(|Notification/.test(ruhig), "kein Push, kein Fenster, keine Ansage");
}

// 234. 1.62.0: PDFs in der App anzeigen (Zurück, Drucken, Teilen), pdf.js lokal
{
  assert.ok(/id="v-dokansicht"/.test(html) && /"start", "dokumente", "dokansicht",/.test(html), "Ansicht dokansicht fehlt");
  const v = html.slice(html.indexOf('<section id="v-dokansicht"'), html.indexOf("</section>", html.indexOf('<section id="v-dokansicht"')));
  assert.ok(/onclick="zeige\('dokumente'\)"/.test(v) && /onclick="dokDrucken\(\)"/.test(v) && /onclick="dokTeilen\(\)"/.test(v) && /onclick="dokExtern\(\)"/.test(v), "Zurück/Drucken/Teilen/Extern fehlen");
  assert.ok(/  dokAnzeigen\(d, ausHistorie\);/.test(html) && /function dokExtern\(\) \{ const d = dokAktuell\(\); if \(d\) extOeffnen\(dokUrl\(d\)\); \}/.test(html), "Anzeige in der App bzw. alter Weg fehlt");
  assert.ok(/dokument: \{ bauen: \(\) => dokDruckSeite\(\) \}/.test(html) && /s\.randlos \? " margin: 0;" : ""/.test(html), "Druck über den Druck-Kern fehlt");
  assert.ok(/isEvalSupported: false/.test(html) && /PDFJS_BIB = "lib\/pdfjs\/pdf\.min\.js\?v=4\.10\.38"/.test(html), "pdf.js lokal und ohne eval");
  for (const f of ["pdf.min.js", "pdf.worker.min.js", "LICENSE"]) assert.ok(fs.existsSync(new URL("../lib/pdfjs/" + f, import.meta.url)), "lib/pdfjs/" + f + " fehlt");
  assert.ok(fs.readFileSync(new URL("../lib/pdfjs/pdf.min.js", import.meta.url), "utf8").includes('4.10.38'), "falsche pdf.js-Version");
  assert.ok(/if \(vorher === "dokansicht" && v !== "dokansicht"\) dokAufraeumen\(\);/.test(html) && /h\.startsWith\("#dokument="\)/.test(html) && /s\.v === "dokansicht" && s\.id/.test(html), "Zurück/Link/Speicher freigeben fehlt");
}

// 235. 1.63.0: Fotoalben (Auswahl, Name, privat/alle, Archiv-Regal)
{
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261003_kc_club_v1630_foto_alben.sql", import.meta.url), "utf8");
  assert.ok(/create table if not exists kc_club_foto_alben/.test(mig) && /sichtbar in \('privat', 'alle'\)/.test(mig) && /foto_id uuid not null references kc_club_fotos\(id\) on delete cascade/.test(mig) && /enable row level security/.test(mig), "Migration Alben fehlt");
  for (const a of ["foto_album_speichern", "foto_album_fotos", "foto_album_loeschen", "foto_alben_papierkorb", "foto_album_wiederherstellen"]) assert.ok(server.includes(`case "${a}"`), "Server-Aktion fehlt: " + a);
  assert.ok(/const darfAlbumSehen = \(ich: Ich, a: any\) => !a\.geloescht_am && \(a\.besitzer === ich\.person_id \|\| a\.sichtbar === "alle"\)/.test(server), "privat nur für Besitzer");
  assert.ok(/const darfAlbumAendern = \(ich: Ich, a: any\) => a\.besitzer === ich\.person_id \|\| \(a\.sichtbar === "alle" && ich\.vorstand\)/.test(server), "Ändern nur Besitzer/Clubleitung");
  assert.ok(/a\.besitzer !== ich\.person_id && sichtbar !== a\.sichtbar/.test(server), "Sichtbarkeit nur der Besitzer");
  assert.ok(/const album = p\.album_id \? await albumHolen\(ich, p\.album_id\) : null;/.test(server) && /auto, persoenlich, alben,/.test(server), "Album-Filter / Archiv-Alben fehlen");
  assert.ok(/geloescht\(ich, "foto_album"/.test(server), "Album löschen nur mit Sicherung (Papierkorb)");
  assert.ok(/id="fotoAlben"/.test(html) && /id="faLeiste"/.test(html) && /faWaehlen\(\$\{!FAW\.an\}\)/.test(html) && /FAW\.an \? `faWahl\('\$\{f\.id\}', this\)` : `fotoAnsehen\(\$\{i\}\)`/.test(html), "Auswahl im Fotoalbum fehlt");
  assert.ok(/name="faASicht" value="privat"/.test(html) && /name="faASicht" value="alle"/.test(html) && /placeholder="z\. B\. Weihnachtsmarkt 2026"/.test(html), "Album-Formular fehlt");
  assert.ok(/function arAlbumRuecken\(a\)/.test(html) && /albumOeffnen\('\$\{a\.id\}', 'archiv'\)/.test(html) && /arAlben\(true\)\.map\(arAlbumRuecken\)/.test(html) && /chip\("alben", "📸 Fotoalben"\)/.test(html), "Alben im Archiv-Regal fehlen");
  assert.ok(/if \(her === "archiv"\) return zeige\("archiv"\);/.test(html), "Zurück ins Archiv fehlt");
}

// 236. 1.64.0: Clubchronik (Einreichen mit Prüfung) + Blättern
{
  assert.ok(/chronik: \{ t: "Chronik", sym: "📖", register: \["Gründung", "Presse", "Rekorde & Höhepunkte", "Feste & Jubiläen", "Mitglieder im Wandel", "In Gedenken", "Ehrungen & Urkunden", "Sonstiges"\] \}/.test(server), "Chronik-Register fehlen");
  assert.ok(/if \(!o\.besitzer\) return darfOrdnerSehen\(ich, o\) && \(d\.status !== "pruefung" \|\| d\.hochgeladen_von === ich\.person_id \|\| darfArchivPflegen\(ich\)\)/.test(server), "Einreichung erst nach Prüfung sichtbar");
  assert.ok(/recht === "hochladen" && o\.einreichen && !darfArchivPflegen\(ich\)\) return \{ \.\.\.o, _eigen: false, _freigaben: \[\] as any\[\], _einreichung: true \}/.test(server), "Einreichen nur bei einreichen-Ordnern");
  assert.ok(/status: einreichung \? "pruefung" : "ok"/.test(server) && /const einreichung = \(!!o\.besitzer && !o\._eigen\) \|\| vereinEinreichung;/.test(server), "Einreichung landet zur Prüfung");
  assert.ok(/o\.besitzer \? !o\._eigen : !darfArchivPflegen\(ich\)/.test(server), "Prüfen im Vereinsordner nur Archiv-Pflege");
  assert.ok(/\} else if \(darfDokSehen\(ich, o, x, \[\]\) && /.test(server), "Link zu fremder Einreichung gesperrt");
  const bl = server.slice(server.indexOf('case "archiv_blaettern"'), server.indexOf('case "archiv_pruefung"'));
  assert.ok(/archivOrdnerHolen\(ich, p\.ordner_id, false, "lesen"\)/.test(bl) && /\.eq\("status", "ok"\)/.test(bl) && /darfDokSehen\(ich, o, d, o\._freigaben\)/.test(bl), "Blättern nur Sichtbares");
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261003_kc_club_v1640_chronik.sql", import.meta.url), "utf8");
  assert.ok(/add column if not exists einreichen boolean not null default false/.test(mig) && /add column if not exists beschreibung text not null default ''/.test(mig), "Migration Chronik fehlt");
  assert.ok(/id="blaettern"/.test(html) && /function blOrdner\(id\)/.test(html) && /function blAlbum\(\)/.test(html) && /onclick="blOrdner\('\$\{o\.id\}'\)"/.test(html) && /onclick="blAlbum\(\)"/.test(html), "Blättern fehlt");
  assert.ok(/if \(BL\.offen\) \{ blZu\(true\); return; \}/.test(html), "Zurück-Taste schließt Blättern");
  assert.ok((html.match(/await pdfSeiteAlsBild\(pdf, n, breite\)/g) || []).length >= 2 && (html.match(/async function pdfSeiteAlsBild\(/g) || []).length === 1, "ein gemeinsamer PDF-Helfer");
  assert.ok(/function arChronikAnlegen\(\)/.test(html) && /const CHRONIK_ANLEITUNG = /.test(html) && /nur mit Einverständnis der Familie/.test(html) && /keine Gründe/.test(html), "Chronik anlegen / Anleitung fehlt");
  assert.ok(/📥 Beitrag einreichen/.test(html) && /id="arEinreichen"/.test(html) && /id="arDokBeschr"/.test(html), "Einreichen/Beschreibung in der App fehlt");
}

// 237. 1.64.0: Online-Push auch bei offener App – sichtbares Gerät sagt an, sonst Mitteilung; je Name nur einmal in 10 Min.
{
  const sw = lies("sw.js");
  assert.match(sw, /const online = \/\^🟢 \(\.\+\) ist jetzt online\$\/\.exec\(titel\), sichtbar = fenster\.filter\(\(c\) => c\.visibilityState === "visible"\);/, "SW erkennt Online-Push");
  assert.match(sw, /if \(online && sichtbar\.length\) \{ sichtbar\.forEach\(\(c\) => c\.postMessage\(\{ typ: "online-ansage", name: online\[1\] \}\)\);/, "sichtbare App bekommt die Ansage");
  assert.match(html, /if \(e\.data\?\.typ === "online-ansage"\) onlineAnsageSprechen\(\[e\.data\.name\]\);/, "App sagt an");
  const code = html.slice(html.indexOf("const ANSAGE = "), html.indexOf("function sprechen("));
  const gesagt = [];
  const run = new Function("ICH", "INIT", "document", "inRuheJetzt", "localStorage", "setTimeout", "sprechen", "anmeldeTon", `${code}; return { onlineAnsagen, onlineAnsageSprechen };`);
  const ls = { getItem: (k) => ({ kc_club_online_ansage: "1" })[k] ?? null, setItem() {} };
  const { onlineAnsagen, onlineAnsageSprechen } = run({ person_id: "ICH", admin: true }, {}, { hidden: false }, () => false, ls, (f) => f(), (t) => gesagt.push(t), () => {});
  onlineAnsageSprechen(["Steven"]);
  onlineAnsagen([{ person_id: "ICH" }]); onlineAnsagen([{ person_id: "ICH" }, { person_id: "S", vorname: "Steven" }]);
  assert.deepEqual(gesagt, ["Steven ist jetzt online"], "Push und Online-Takt: nur eine Ansage");
}

// 238. 1.64.1: Blättern auch im Vereinsleben (ohne Dateien → Karten-Seiten)
{
  assert.ok(/\$\{\(o\.auto \? eintraege\.length : o\.art === "chronik" \|\| eintraege\.some\(\(x\) => x\.status === "ok"\)\) \? `<button/.test(html), "Blättern-Knopf auch bei Vereinsleben");
  assert.ok(/if \(String\(id\)\.startsWith\("auto:"\)\) return blVereinsleben\(id\);/.test(html) && /function blVereinsleben\(id\)/.test(html), "Vereinsleben blättern");
}

// 239. 1.64.2: Entfernen im Vereinsleben (nur für mich ausblenden; eigene Chat-Anlage auch im Chat löschen)
{
  assert.ok(/case "archiv_ausblenden"/.test(server) && /schluessel: "archiv_ausgeblendet"/.test(server) && /const auto = autoAlle\.filter\(\(x: any\) => !ausgeblendet\.has\(`\$\{x\.art\}:\$\{x\.id\}`\)\);/.test(server), "Ausblenden auf dem Server");
  assert.ok(/nachricht: m\.id, vonMir: m\.sender_person_id === ich\.person_id/.test(server), "Anlage weiß, ob sie von mir ist");
  assert.ok(/onclick="event\.stopPropagation\(\);arAusblenden\(/.test(html) && /async function arAusblenden\(x\)/.test(html) && /api\("nachricht_loeschen", \{ id: x\.nachricht \}\)/.test(html), "🗑️ in jeder Vereinsleben-Zeile");
  assert.ok(/function arEinblenden\(art, id\)/.test(html) && /Aus dem (Vereins|Club)leben entfernt/.test(html), "Zurückholen im Papierkorb");
}

// 240. 1.65.0: Büro als Raum (Regal + Schreibtisch) über den vorhandenen Büro-Funktionen
{
  assert.ok(/const BU_REGAL = \[/.test(html) && /function buRaumHtml\(\)/.test(html) && /function buStartHtml\(\) \{ return buRaumAn\(\) \? buRaumHtml\(\) : buStartListeHtml\(\); \}/.test(html), "Raum + Liste");
  const reg = html.slice(html.indexOf("const BU_REGAL = ["), html.indexOf("const buRecht = "));
  for (const id of ["sitzung", "protokolle", "feste", "fl", "liste", "chronik", "archiv"]) assert.ok(reg.includes(`id: "${id}"`), "Ordner fehlt: " + id);
  assert.ok(/id: "fl"[^}]*recht: "L"/.test(reg) && /id: "liste"[^}]*recht: "L"/.test(reg) && /id: "verwaltung"[^}]*recht: "A"/.test(reg), "Rechte im Regal");
  assert.ok(/tmp\.querySelector\(`\[data-klappe="buero_\$\{o\.bereich\}"\]`\)/.test(html), "Ordner zeigt den vorhandenen Bereich (keine zweite Oberfläche)");
  assert.ok(/href="tel:\$\{esc\(nurZiffern\(nr\)\)\}"/.test(html) && /async function buTelefon\(\)/.test(html) && /api\("mitglied_details", \{ person_id: pid \}/.test(html), "Telefon wählt wirklich (nur freigegebene Nummer)");
  assert.ok(/function buFueller\(\)/.test(html) && /function buDrucker\(\)/.test(html) && /function arStartArt\(art\)/.test(html), "Füller/Drucker/Chronik");
  assert.ok(/onclick="buAnsichtWechseln\(\)">☰ Liste/.test(html) && /onclick="buAnsichtWechseln\(\)">🗄️ Büro-Raum/.test(html), "Umschalter in beiden Ansichten");
}

// 241. 1.66.0: Büro – Nachricht (App/Mail/WhatsApp) + Sprachsteuerung
{
  assert.ok(/async function buPersonWahl\(/.test(html) && /function buTelefon\(\) \{ return buPersonWahl\(/.test(html), "gemeinsame Personenwahl");
  assert.ok(/href="mailto:\$\{esc\(k\.mail\)\}"/.test(html) && /extern\("whatsapp", k\.handy\)/.test(html) && /direkt\(pid\)/.test(html) && /buKontakt\(\)/.test(html), "App / Mail / WhatsApp / mehrere");
  const code = html.slice(html.indexOf("const BU_SPRACHE = ["), html.indexOf("async function buSprechen("));
  const BU_REGAL = [{ id: "protokolle", t: "Protokolle", fn: "zeige('protokolle')" }, { id: "sitzung", t: "Sitzung", bereich: "sitzung" }, { id: "fl", t: "Freud & Leid", fn: "buFreudLeid()", recht: "L" }, { id: "chronik", t: "Chronik", fn: "arStartArt('chronik')" }];
  const suNorm = (t) => String(t ?? "").toLowerCase().replace(/[äöü]/g, (c) => ({ ä: "a", ö: "o", ü: "u" })[c]);
  const { deuten } = new Function("BU_REGAL", "suNorm", `${code}; return { deuten: buSprachDeuten };`)(BU_REGAL, suNorm);
  const leute = [{ person_id: "P2", name: "Erika Beispiel" }, { person_id: "P3", name: "Klaus Zander" }];
  assert.equal(deuten("Öffne Ordner Protokolle", leute)?.fn, "zeige('protokolle')");
  assert.equal(deuten("Sitzung", leute)?.fn, "buOrdner('sitzung')");
  assert.equal(deuten("Anrufen Erika", leute)?.fn, "buTelPerson('P2')");
  assert.equal(deuten("ruf mal an", leute)?.fn, "buTelefon()");
  assert.equal(deuten("Nachricht an Klaus", leute)?.fn, "buNachrichtPerson('P3')");
  assert.equal(deuten("Zeig mir die Chronik", leute)?.fn, "arStartArt('chronik')");
  assert.equal(deuten("Eingang", leute)?.fn, "buEingang()");
  assert.equal(deuten("Wetter morgen", leute), null, "Unbekanntes → nichts tun");
  assert.ok(deuten("Freud und Leid", leute, (x) => x.recht !== "L")?.verboten, "Rechte gelten auch per Sprache");
  assert.ok(/const BSPR = \{ geht: !!\(window\.SpeechRecognition \|\| window\.webkitSpeechRecognition\)/.test(html) && /\$\{BSPR\.geht \? '<button class="bu-mikro"/.test(html), "Mikrofon nur, wenn das Gerät es kann");
}

// 243. 1.67.0: mitlaufende A4-Vorschau beim Bearbeiten (Sitzung, Brief, Mitgliederliste) über den Druck-Kern
{
  assert.ok(/const LV_ARTEN = \{ sitzung: "sitzung", brief: "brief", liste: "mitgliederliste" \};/.test(html), "Registry der Live-Vorschau");
  assert.ok(/: buStartHtml\(\); lvNachZeigen\(\); \}/.test(html), "nach jedem Zeichnen auffrischen (Ende von buZeigenRoh)");
  const lv = html.slice(html.indexOf("async function lvJetzt()"), html.indexOf("function lvGross()"));
  assert.ok(/await druckSeiteBauen\(\)/.test(lv) && /druckHtml\(true\)/.test(lv) && /finally \{ DRUCK = alt; \}/.test(lv), "nutzt den Druck-Kern und stellt DRUCK wieder her");
  assert.ok((html.match(/\$\{lvKasten\(\)\}/g) || []).length >= 2 && /\$\{d \? lvKasten\(\) : vorschau\}/.test(html), "in Sitzung, Brief und Mitgliederliste");
  assert.ok(/BU\.f\.anmerkung=this\.value;lvAuffrischen\(\)/.test(html) && /function briefFeld\(k, el\) \{ BRIEF\[k\] = el\.value; briefMerken\(\); lvAuffrischen\(\); \}/.test(html) && /function buAnw\(id, an\) \{[^}]*lvAuffrischen\(\); \}/.test(html), "Tippen erneuert die Vorschau");
}

// 244. 1.68.0: Mikrofon im Chat – Sprachnachricht oder Diktieren (Sprache → Text)
{
  assert.ok(/id="mikroKnopf" onclick="mikroWahl\(\)"/.test(html) && /function mikroWahl\(\) \{\n  if \(!DIKTAT_GEHT\) return spracheStart\(\);/.test(html), "Wahl, ohne Erkennung wie bisher");
  const code = html.slice(html.indexOf("function diktatSatz("), html.indexOf("const DT = {"));
  const satz = new Function(`${code}; return diktatSatz;`)();
  assert.equal(satz("hallo klaus komma kommst du morgen fragezeichen"), "Hallo klaus, kommst du morgen?");
  assert.equal(satz("ich bringe den Glühwein mit punkt bis dann ausrufezeichen"), "Ich bringe den Glühwein mit. Bis dann!");
  assert.equal(satz("erste zeile neue zeile zweite"), "Erste zeile\nZweite");
  assert.ok(/if \(was === "senden"\) \{ if \(!feld\.value\) return melde\([^)]*\); return senden\(\); \}/.test(html), "Senden über den normalen Weg");
  assert.ok(/if \(was === "weg"\) \{ feld\.value = DT\.basis;/.test(html), "Verwerfen stellt den alten Text her");
  assert.ok(/id="setMikro" onchange="mikroArtSetzen\(this\.value\)"/.test(html), "Einstellung");
}

// 245. 1.69.0: Bestätigung der eigenen Eingaben (Dienstwünsche per Knopf, Erstattung beim Senden)
{
  const me = server.slice(server.indexOf('case "meine_eingaben"'), server.indexOf('case "dienstwunsch_laden"'));
  assert.ok(/\.eq\("person_id", ich\.person_id\)/.test(me) && /dienstwunschAufstellung\(ich\)/.test(me), "nur eigene Eingaben");
  assert.ok(/routerSenden\("club_nachricht_beide", \[ich\.person_id\]/.test(me) && /aktion", "dienstwunsch_bestaetigt"\)\.gte\("zeit", new Date\(Date\.now\(\) - 120_000\)/.test(me), "App + Mail nur an mich, höchstens 1× je 2 Min.");
  assert.ok(/const url = `\$\{APP_URL\}#bestaetigung=erstattung:\$\{a\.id\}`/.test(server) && /routerSenden\("club_nachricht_push", \[ich\.person_id\], erstattungBestaetigung\(/.test(server), "Erstattung: App-Nachricht an den Antragsteller");
  assert.ok(/data-k="fertig"[^>]*>✅ Fertig – Bestätigung<\/button>/.test(html) && /bestaetigung: \{ bauen: \(\) => druckBestaetigung\(\) \}/.test(html) && /h\.startsWith\("#bestaetigung="\)/.test(html), "Knopf, Druckart, Link");
  assert.ok(/quer: true, fuss: "Bestätigung aus der Köcheclub-App"/.test(html) && /return druckErstattung\(\{ antrag: b\.antrag\.id \}\)/.test(html), "Querformat / vorhandener Antrags-Ausdruck");
}

// 246. 1.69.1: Postausgang (Wartung verschickt, Audit) + „Unter Vorbehalt“ in jeder Erstattungs-Bestätigung
{
  const mig = lies("supabase/migrations/20261003_kc_club_v1691_postausgang.sql");
  assert.ok(/create table if not exists kc_club_postausgang/.test(mig) && /veranlasst_von text not null/.test(mig) && /enable row level security/.test(mig) && /revoke all on kc_club_postausgang from anon, authenticated/.test(mig), "Tabelle nur für den Server");
  assert.ok(/await postausgangLauf\(\)\.catch/.test(server) && /a\.person_id !== o\.person_id/.test(server) && /update\(\{ gesendet_am: jetzt\(\), ergebnis \}\)/.test(server), "nur an den Antragsteller, Ergebnis festgehalten");
  assert.ok(/const ERSTATTUNG_VORBEHALT = "Unter Vorbehalt: Dein Antrag wird vom Kassenwart geprüft/.test(server) && /\$\{ERSTATTUNG_VORBEHALT\}/.test(server), "Vorbehalt im Text");
}

// 247. 1.69.2: Aufstellungen ins persönliche Archiv – fremd abgelegt nur „zur Prüfung“
{
  const f = server.slice(server.indexOf("async function eingabenArchivieren("), server.indexOf("// KC-CLUB-POSTAUSGANG (1.69.1): beim Wartungslauf"));
  assert.ok(/const selbst = von === besitzer\.person_id;/.test(f) && /status: selbst \? "ok" : "pruefung"/.test(f), "fremd → zur Prüfung");
  assert.ok(/a\.person_id !== besitzer\.person_id\) continue;/.test(f), "nur eigener Antrag");
  assert.ok(/const ABLAGE_REGISTER: Record<string, string> = \{ erstattung: "Rechnungen", dienstwunsch: "Dienstplan" \};/.test(server), "Register-Zuordnung");
  assert.ok(/case "eingaben_ablegen"/.test(server) && /eingabenArchivieren\(ich, \[teil\], ich\.person_id\)/.test(server), "eigene Ablage nur in den eigenen Ordner");
  assert.ok(/check \(art in \('erstattung_bestaetigung', 'archiv_ablage'\)\)/.test(lies("supabase/migrations/20261003_kc_club_v1692_postausgang_archiv.sql")), "Postausgang-Art");
}

// 248. 1.69.3: Hinweis „deine Wünsche – Abstimmung erfolgt noch“ in Bestätigung, Aufstellung und Archiv
{
  assert.ok(/const DW_HINWEIS = \(name: string\) => `Vielen Dank für die Übermittlung deiner Dienstzeiten für den \$\{name\}\. Bitte beachte, dass es sich um deine Wünsche handelt – eine Abstimmung mit allen Clubmitgliedern erfolgt noch\.`;/.test(server), "Wortlaut");
  assert.ok(/hinweis: DW_HINWEIS\(DW\.name\)/.test(server) && /\$\{a\.hinweis\}\\n\\nDeine Dienstwünsche/.test(server) && /\$\{auf\.hinweis\}/.test(server) && /\$\{b\.hinweis \?/.test(html), "an allen drei Stellen");
}

// 249. 1.70.0: Tippfehler rot unterstreichen (KC-CLUB-RECHTSCHREIBUNG)
{
  assert.ok(/<textarea id="text" rows="2" spellcheck="true" lang="de" autocapitalize="sentences"/.test(html), "Chat-Schreibfeld ohne Rechtschreibprüfung");
  assert.ok(/<textarea id="naBearbText" spellcheck="true" lang="de"/.test(html), "Bearbeiten-Feld ohne Rechtschreibprüfung");
  assert.ok(/document\.addEventListener\("focusin", \(e\) => rsAn\(e\.target\)\)/.test(html) && /const RS_AUS = new Set\(\["email", "password", "tel", "number"/.test(html), "alle Schreibfelder, aber nicht E-Mail/Telefon/Zahl/Passwort");
  assert.ok(/onclick="rsBlatt\(\)">Prüfen<\/button>/.test(html) && /id: "rechtschreibung", sym: "🖍️"/.test(html), "Einstellung/Tipp fehlt");
  for (const g of ["android", "samsung", "ios", "pc"]) assert.ok(new RegExp(`\\n  ${g}: "<b>`).test(html), "Anleitung " + g);
  assert.ok(!/languagetool|spellcheck.*api\./i.test(html), "kein Fremddienst für die Prüfung");
}
// 250. 1.71.0: Sprachansagen (KC-CLUB-SPRACHANSAGEN)
{
  const sw = lies("sw.js");
  assert.ok(/c\.postMessage\(\{ typ: "push", titel, text: d\.body \|\| d\.text \|\| "", url: d\.data\?\.url \|\| "" \}\)/.test(sw), "Service Worker gibt Text/Link weiter");
  assert.ok(/if \(chatId\) chatLaden\(false\); ansageAusPush\(e\.data\);( if \(aktuelleAnsicht === "spiele"[^}]*)? \}/.test(html), "Push → Ansage"); // 2.7.0: + Spiel auffrischen
  assert.ok(/klopfTonSpielen\(klopfStand\(\)\.ton\);\n  ansageMelden\(\{ art: "anklopfen"/.test(html), "Anklopfen wird angesagt");
  for (const id of ["nachricht", "anklopfen", "pinnwand", "helfen", "mitfahrt", "standort", "termine"]) assert.ok(new RegExp(`\\{ id: "${id}", sym: "[^"]+", t: "[^"]+",[^\\n]*bsp: "`).test(html), "Ansage-Art " + id);
  assert.ok(/\{ id: "nachricht",[^\n]*an: true \}/.test(html) && /\{ id: "anklopfen",[^\n]*an: true \}/.test(html) && !/\{ id: "pinnwand",[^\n]*an: true/.test(html), "Standard nur Nachrichten + Anklopfen");
  assert.ok(/onclick="ansBlatt\(\)">Auswählen<\/button>/.test(html) && /aria-label="Beispiel anhören"/.test(html), "eine Zeile + ▶ Beispiel");
  assert.ok(/!ansAn\(x\.art\.split\("-"\)\[0\]\) \|\| inRuheJetzt\(INIT\?\.einstellungen\?\.ruhezeit\)/.test(html), "Auswahl + Ruhezeit");
  assert.ok(/aktuelleAnsicht === "chat" && !document\.hidden\) return null; \/\/ Chat ist offen/.test(html) && /q\.length >= 3\) return sprechen\(`\$\{q\.length\} neue Meldungen/.test(html), "offener Chat still, Sammelansage");
  assert.ok(/Luftlinie/.test(html) && !/api\("standort_(start|update)"[^\n]*ansMeinOrt/.test(html), "Entfernung nur lokal (eigener Ort wird nicht gesendet)");
  // Server-Titel, auf die sich die Deutung stützt (Vertrag: werden sie geändert, muss ansageDeuten mit)
  for (const t of ["`💬 ${ich.name}`", "hat dich erwähnt", "`📌 ${kopf}`", "Post-it von ${von} bekommen", "\"✋ Zusage\"", "\"🚗 Neue Mitfahrt\"", "\"🚗 Mitfahrgelegenheit gefunden\"", "`📍 ${ich.name}`", "`👋 ${ich.vorname} klopft an`"]) assert.ok(server.includes(t), "Server-Titel fehlt: " + t);
}
// 251. 1.72.0: Register „Club“/„Technik“, dezente Blätter-Pfeile
{
  assert.ok(/const REGISTER_ALLE = \[\["verein", "Club"\], \["mein", "Meins"\], \["programme", "Technik"\](\]|, \["admin", "Admin"\]\])/.test(html), "Register-Namen"); // 2.20.0: + Admin (nur Admins)
  assert.ok(!/rgba\(90,15,25,\.72\)/.test(html) && /\.ipfeil \{[^}]*background: rgba\(255,255,255,\.16\)/.test(html), "Info-Pfeile ohne festes Weinrot");
  assert.ok(/\.bl-pfeil \{[^}]*border-radius: 50%; background: rgba\(255,255,255,\.82\)[^}]*color: var\(--grau\)/.test(html), "Blätter-Pfeile dezent");
}
// 252. 1.73.0: Feedback-Bogen gekürzt und an den Stand angepasst
{
  const f = server.slice(server.indexOf("const FEEDBACK_FRAGEN"), server.indexOf("const FEEDBACK_UMGESETZT"));
  const u = server.slice(server.indexOf("const FEEDBACK_UMGESETZT"), server.indexOf("const FB_TEXT_MAX"));
  assert.ok(/const FEEDBACK_BOGEN = "2026-3"/.test(server), "neue Bogen-Kennung"); // 2.23.13
  assert.equal((f.match(/schritt: 1,/g) || []).length, 7, "Schritt 1 hat genau 7 Fragen (2.23.13: + Hilfe)");
  for (const x of ["Sprache", "Geburtstag", "Schulung", "Fahrgemeinschaft", "Dokumente (Satzung"]) assert.ok(!f.includes(x), `„${x}“ ist umgesetzt und steht noch als Wunsch`);
  for (const x of ["Sprachansagen", "Tippfehler", "Fotoalben", "Clubchronik", "Club-Börse", "Helfen & Leihen"]) assert.ok(u.includes(x), `„${x}“ fehlt unter „Schon umgesetzt“`);
  assert.ok(/<details class="hinweis"[^>]*><summary[^>]*><b>✅ Schon umgesetzt \(\$\{FB\.umgesetzt\.length\}\)/.test(html), "„Schon umgesetzt“ zum Aufklappen");
}
// 253. 1.74.0: Büro – zwei Zettel mit Pinnnadel, Eingang als Liste, Archiv-Zählung nur Vereinsordner
{
  assert.ok(/<div class="bu-zettelreihe">/.test(html) && /class="bu-zettel blau" onclick="buEingang\(\)"/.test(html) && /\.bu-zettel::before \{[^}]*radial-gradient/.test(html), "zwei Zettel mit Nadel");
  assert.ok(/function buEingangPosten\(\)/.test(html) && /onclick="buEinPosten\(\$\{i\}\)"/.test(html), "Eingang als Liste");
  assert.ok(/✏️ Öffnen &amp; bearbeiten/.test(html) && /📥 Zurück in den Eingang/.test(html) && /Zum Ordner „/.test(html), "Knöpfe bearbeiten / zurück / Ordner");
  assert.ok(/if \(!o \|\| o\.besitzer\) continue;/.test(html), "persönliche Ordner nicht im Eingang der Clubleitung");
  const be = server.slice(server.indexOf("async function bueroEingang"), server.indexOf("function bueroTopListe"));
  assert.ok(/from\("kc_club_archiv_ordner"\)\.select\("id"\)\.in\("id", ids\)\.is\("besitzer", null\)/.test(be), "Server zählt nur Vereinsordner");
}
// 254. 1.75.0: Online-Ansage in der Liste „Sprachansagen“ (gleiche Einstellung wie bisher)
{
  assert.ok(/\{ id: "online", sym: "🟢", t: "Jemand kommt online", k: "Online",[^\n]*bsp: "/.test(html), "Online-Ansage in der Liste");
  assert.ok(/online: ansageAn\(\) \}; \}/.test(html) && /if \(id === "online"\) \{ lsSetzen\(ANSAGE, an \? "1" : "0"\)/.test(html), "nutzt den bisherigen Schalter");
  assert.ok(/<div class="schalter versteckt" id="setAnsageZeile">/.test(html) && /id="setAnsage" onchange="ansageSchalter\(this\.checked\)"/.test(html), "alte Zeile nur ausgeblendet, Schalter bleibt");
}
// 255. 1.75.1: Emoji-Tipp beschreibt die richtige Stelle
assert.ok(/id: "emoji",[^\n]*unter dem Schreibfeld<\/b> auf <b>😊<\/b>/.test(html) && !/neben dem Schreibfeld gibt es eine kleine Emoji-Auswahl/.test(html), "Emoji-Tipp: unter dem Schreibfeld");
// 256. 1.76.0: weitere Farbschemen in eigener Klappzone, Tipps aktualisiert
{
  const ds = html.slice(html.indexOf("const DESIGNS = ["), html.indexOf("// Gewählt: Design + Modus"));
  const D = new Function(ds.replace("const DESIGNS =", "return"))();
  const mehr = D.filter((d) => d.mehr);
  assert.ok(mehr.length >= 8 && D.filter((d) => !d.mehr).length === 8, "8 Grund-Designs + weitere in der Klappzone");
  const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const k = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const d of mehr) for (const m of ["tag", "nacht"]) assert.ok(k("#ffffff", d[m].rot) >= 4.5 && k(d[m].grau, d[m].karte) >= 4.5, `${d.id} ${m}: Kontrast`);
  assert.ok(/<details class="ds-mehr" id="designMehrKlappe"><summary>🎨 Weitere Farbschemen/.test(html) && /DESIGNS\.filter\(\(d\) => !d\.mehr\)/.test(html), "eigene Klappzone");
  for (const id of ["diktieren", "fotoalben", "chronik", "helfen_leihen"]) assert.ok(new RegExp(`\\{ id: "${id}", sym:`).test(html), "Tipp " + id);
  assert.ok(!/Google- oder Outlook-Kalender übernehmen/.test(html), "Kalender-Tipp veraltet");
}
// 257. 1.77.0: Tipp „neue Farbschemen“ – persönlich, zuerst, drei Wahlmöglichkeiten
{
  const t = html.slice(html.indexOf("const TIPPS = ["), html.indexOf("const tippStand"));
  assert.ok(t.indexOf('id: "farbschemen_neu"') > 0 && t.indexOf('id: "farbschemen_neu"') < t.indexOf('id: "sprachansage"'), "Farbschemen-Tipp steht vorne");
  assert.ok(/id: "farbschemen_neu"[^]*?Hallo \$\{ICH\?\.vorname[^]*?ja: "🎨 Jetzt einstellen", nein: "🙈 Nicht mehr anzeigen", nur: \(\) => !DESIGNS\.find/.test(t), "persönlich, Knöpfe, nur ohne neues Schema");
  assert.ok(/\$\{esc\(typeof tipp\.t === "function" \? tipp\.t\(\) : tipp\.t\)\}/.test(html) && /id="designMehrKlappeE"/.test(html), "Titel-Funktion + Klappzone in der einfachen Ansicht");
}
// 258. 1.78.0: ausgefallene Farbschemen (mit Verlauf) in eigener Klappzone
{
  const ds = html.slice(html.indexOf("const DESIGNS = ["), html.indexOf("// Gewählt: Design + Modus"));
  const D = new Function(ds.replace("const DESIGNS =", "return"))();
  const bunt = D.filter((d) => d.bunt);
  assert.ok(bunt.length >= 6 && bunt.every((d) => d.mehr && d.verlauf?.tag && d.verlauf?.nacht), "ausgefallene Schemen mit Verlauf");
  assert.ok(/id="designBuntKlappe"><summary>✨ Ausgefallene Farbschemen/.test(html) && /id="designBuntKlappeE"/.test(html) && /DESIGNS\.filter\(\(d\) => d\.mehr && !d\.bunt\)/.test(html), "eigene Klappzone");
}
// 259. 1.79.0: Ameisenlauf beim Registerwechsel, Farbschemen-Tipp mit allen neuen Schemen
{
  // 1.80.0: Rahmen als SVG genau auf der Kante (Klassen umbenannt: reg-rahmen / reg-lauf) – Prüfung angepasst
  assert.ok(/\.register \.reg-rahmen rect \{[^}]*stroke: color-mix\(in srgb, var\(--rot\) 40%, #fff\)/.test(html), "Rahmen im Design-Ton");
  assert.ok(/const neu = r !== reg; reg = r;[^\n]*\n  if \(neu\) \{[^\n]*classList\.add\("reg-lauf"\); setTimeout\(\(\) => b\.classList\.remove\("reg-lauf"\), 1600\)/.test(html), "nur beim Wechsel, kurz");
  assert.ok(/unsere \$\{DESIGNS\.filter\(\(d\) => d\.mehr\)\.length\} neuen Farbschemen/.test(html) && /"designMehrKlappe", "designBuntKlappe"/.test(html), "Tipp zählt alle neuen Schemen");
}
// 260. 1.80.0: Register-Rahmen als SVG auf der Kante, danach ruhig
{
  assert.ok(/'<svg class="reg-rahmen" aria-hidden="true"><rect><\/rect><\/svg>'/.test(html) && /function regRahmenMessen\(\)/.test(html) && /addEventListener\("resize", regRahmenMessen\)/.test(html), "Rahmen gemessen auf der Kante");
  assert.ok(/\.register button\.reg-lauf \.reg-rahmen rect \{ stroke-dasharray: 9 6; animation: ameisenLauf/.test(html) && !/reduce\) \{ \.register/.test(html), "läuft (gleiche Animation), auch bei reduzierter Bewegung");
}
// 261. 1.81.0: Bedienungsanleitung Version 2
{
  const v2 = fs.readFileSync(new URL("../dokumente/Koecheclub-App_Anleitung_V2.pdf", import.meta.url));
  assert.ok(v2.subarray(0, 5).toString() === "%PDF-" && v2.length < 8e6, "Anleitung V2 fehlt oder zu groß");
  assert.ok(fs.existsSync(new URL("../dokumente/Koecheclub-App_Anleitung_V1.pdf", import.meta.url)), "V1 muss unverändert bleiben");
  const inh = fs.readFileSync(new URL("../tools/anleitung/inhalt.mjs", import.meta.url), "utf8"), f2 = fs.readFileSync(new URL("../tools/anleitung/fotos2.mjs", import.meta.url), "utf8");
  assert.ok(/anleitung: [2345]/.test(inh) && /10\. Fotos & Alben/.test(inh) && /11\. Archiv & Chronik/.test(inh) && /<b>Club<\/b> = alles rund um den Club/.test(inh) && !/Programme<\/b> = Dienstplan/.test(inh), "Inhalt V2");
  assert.ok(!/ptblnpiroqftcvlsrhac|service_role|eyJ[A-Za-z0-9_-]{20}/.test(f2), "fotos2 ohne echte Zugänge");
}
// 262. 1.82.0: Protokoll-Vorlage – Protokollführer, Ort, Entschuldigt bzw. fehlend, Gäste, Nächster Termin
{
  const v = html.slice(html.indexOf("function druckSitzung()"), html.indexOf("// Einladung / Erinnerung"));
  for (const t of ['zeile("Protokollführer"', 'zeile("Ort"', "<b>Entschuldigt bzw. fehlend:</b>", "<b>Gäste:</b>", "<b>Nächster Termin:</b>"]) assert.ok(v.includes(t), "Vorlage: " + t);
  assert.ok(/const weiter = \(BU\.start\?\.sitzungen \|\| \[\]\)\.find\(\(x\) => x\.id !== s\.treffen\.id && new Date\(x\.beginn\) > new Date\(s\.treffen\.beginn\)\)/.test(v), "nächster Termin vorbelegt");
}
// 263. 1.83.0: Büro – Begrüßung in der Kopfzeile, Knöpfe nebeneinander, Ordner gleich hoch
assert.ok(/<h2>🗂️ Büro<\/h2><span class="bu-kopfgruss" id="buKopfGruss"><\/span>/.test(html) && /\$\("buKopfGruss"\)\.textContent = `\$\{buTageszeit\(\)\}, /.test(html)
  && (html.match(/<div class="bu-knopfreihe">/g) || []).length === 2 && !/\.bu-ordner:nth-child\(3n\) \{ height/.test(html), "Büro-Kopf und gleich hohe Ordner");
// 264. 1.84.0: „Nächster Termin“ im digitalen Protokoll
{
  assert.ok(/naechster_termin: txt\(p\.naechster_termin, 200\) \|\| null/.test(server) && /naechster_termin: pr\.naechster_termin \?\? null/.test(server) && /async function protokollNaechsterVorschlag\(pr: any\)/.test(server), "Server speichert/liefert, schlägt vor");
  assert.ok(/<input id="prN" maxlength="200"/.test(html) && /naechster_termin: \$\("prN"\)\?\.value \?\? ""/.test(html), "Formular");
  assert.ok(/<b>📅 Nächster Termin:<\/b> \$\{esc\(p\.naechster_termin\)\}/.test(html) && /<b>Nächster Termin:<\/b> \$\{esc\(p\.naechster_termin\)\}<\/p>` : ""\}\n      <div class="unterschrift">/.test(html), "Ansicht und Ausdruck");
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261003_kc_club_v1840_protokoll_naechster_termin.sql", import.meta.url), "utf8");
  assert.ok(/add column if not exists naechster_termin text/.test(mig) && /Rückweg:/.test(mig), "Migration");
}
// 265. 1.85.0: Zoom beim Öffnen
{
  assert.ok(/@keyframes zoomOeffnen/.test(html) && /const ZOOM_ZIELE = "\.kachel, \.mini-kachel, \.bu-ordner, \.bu-ding, \.kacheln3 \.mini, \.ordner";/.test(html), "Zoom-Ziele");
  assert.ok(/if \(!el \|\| el\.dataset\.zoomLos \|\| e\.defaultPrevented \|\| el\.disabled \|\| kaBearb \|\| ZIEHEN \|\| zogGerade\) return;/.test(html), "nicht beim Anordnen/Ziehen");
  assert.ok(html.indexOf("const ZOOM_ZIELE") > html.indexOf('document.addEventListener("click", (e) => { if (unterdruecken'), "Zoom-Abfang nach den Zieh-Sperren registriert");
}
// 266. 1.86.0: Einleitung für Vereinsordner (Chronik)
{
  assert.ok(/einleitung: o\.besitzer \? null : o\.einleitung \?\? null/.test(server) && /\(werte as any\)\.einleitung = String\(p\.einleitung/.test(server), "Server liefert/speichert Einleitung (nicht für persönliche Ordner)");
  assert.ok(/function arEinleitungHtml\(t\)/.test(html) && /<textarea id="arEinleitung"/.test(html) && /\.\.\.\(r\.ordner\.einleitung \? \[\{ art: "html", titel: r\.ordner\.einleitung\.trim\(\)\.split/.test(html), "Ordner-Ansicht, Formular, Blättern");
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261003_kc_club_v1860_ordner_einleitung.sql", import.meta.url), "utf8");
  assert.ok(/add column if not exists einleitung text/.test(mig) && /Rückweg:/.test(mig), "Migration");
}
// 267. 1.87.0: Kurzcode-Anmeldung + Einrichtungs-Assistent
{
  assert.ok(/if \(a === "kurzcode_einloesen"\)/.test(server) && server.indexOf('if (a === "kurzcode_einloesen")') < server.indexOf("const ich = await anmelden(req);"), "Einlösen ohne Anmeldung");
  assert.ok(/case "kurzcode_erzeugen":/.test(server) && /schluessel_enc: await kurzcodeVerschluesseln\(token\)/.test(server) && /name: "AES-GCM"/.test(server), "Schlüssel nur verschlüsselt");
  assert.ok(/KURZCODE_MIN = 15, KURZCODE_FEHL_NETZ = 8, KURZCODE_FEHL_GESAMT = 60/.test(server) && /delete\(\)\.eq\("code_hash", z\.code_hash\); \/\/ nur einmal gültig/.test(server), "Gültigkeit, Bremse, einmalig");
  assert.ok(/eq\("token_hash", await sha256\(k\)\)/.test(server), "Code eines älteren Links wird abgelehnt");
  assert.ok(!/protokoll\([^)]*code[,: ][^)]*\)/.test(server.slice(server.indexOf('case "kurzcode_erzeugen"'), server.indexOf('case "init"'))), "Code nicht im Protokoll");
  assert.ok(/<input id="kcCode" class="kc-code" inputmode="numeric" autocomplete="one-time-code"/.test(html) && /function kurzcodeEinloesen\(\)/.test(html), "Code-Feld auf dem Anmeldebildschirm");
  for (const g of ["g.ios", "g.android && g.browser === \"samsung\"", "g.android"]) assert.ok(html.includes(`if (${g}`), "Assistent: " + g);
  assert.ok(/function einrichtenEinmal\(\)/.test(html) && /lsSetzen\("kc_club_einrichten_gezeigt", "1"\)/.test(html) && /if \(START_ART !== "app"\) return einrichtenAssistent\(\);/.test(html), "einmal von selbst, sonst über installHilfe");
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261003_kc_club_v1870_kurzcode.sql", import.meta.url), "utf8");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_kurzcodes from anon, authenticated/.test(mig), "Tabelle nur für den Server");
}
// 268. 1.88.0: Einrichtungskarte (QR) und „hat die Club-App verlassen“
{
  assert.ok(/einrichtungskarte: \{ bauen: \(o, param\) => druckEinrichtungskarte\(param\) \}/.test(html) && /sc\.src = "lib\/qrcode\/qrcode\.js"/.test(html), "Druckart + QR lokal");
  assert.ok(fs.existsSync(new URL("../lib/qrcode/qrcode.js", import.meta.url)) && /MIT/.test(fs.readFileSync(new URL("../lib/qrcode/README.txt", import.meta.url), "utf8")), "QR-Baustein mit Lizenzhinweis");
  const k = html.slice(html.indexOf("async function einrichtungskarte("), html.indexOf("async function linkTeilen("));
  assert.ok(/if \(m\.app && !\(await frage\(/.test(k) && /api\("link_erzeugen"/.test(k) && !/kurzcode/.test(k.slice(k.indexOf("function druckEinrichtungskarte"))), "Rückfrage bei aktivem Link, kein Code auf Papier");
  assert.ok(/onclick="einrichtungskarte\('\$\{m\.person_id\}'\)">🖨️ Einrichtungskarte<\/button>/.test(html), "Knopf beim Mitglied");
  assert.ok(/\{ id: "verlassen", sym: "🚪"/.test(html) && !/\{ id: "verlassen",[^\n]*an: true/.test(html) && /hat die Club-App verlassen\.` \}\);/.test(html), "Verlassen-Ansage, Standard aus");
}
// 269. 1.89.0: KC-CLUB-NUTZUNG-BEREICHE – jede Ansicht und jeder gezählte Teilbereich hat einen Namen und ist im Server erlaubt
{
  const erlaubt = new Set([...server.slice(server.indexOf("const NUTZUNG_BEREICHE"), server.indexOf("]);", server.indexOf("const NUTZUNG_BEREICHE"))).matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
  const nzN = html.slice(html.indexOf("const NZ_NAMEN = {"), html.indexOf("};", html.indexOf("const NZ_NAMEN = {")));
  const namen = new Set([...nzN.matchAll(/(?:^|[{,\s])([a-z_]+): "/g)].map((m) => m[1]));
  const ansichten = [...html.matchAll(/<section id="v-([a-z]+)"/g)].map((m) => m[1]);
  for (const v of ansichten) assert.ok(namen.has(v) && erlaubt.has(v), `Ansicht ohne Nutzungs-Namen/Server-Freigabe: ${v}`);
  const gezaehlt = [...html.matchAll(/nzZaehlen\("([a-z_]+)"\)/g)].map((m) => m[1]);
  for (const k of [...gezaehlt, ...[...namen]]) assert.ok(erlaubt.has(k), `Server verwirft Nutzungs-Schlüssel: ${k}`);
  for (const k of ["buero_eingang", "buero_fl", "helfen_boerse", "chronik", "fotoalbum"]) assert.ok(namen.has(k), `Teilbereich fehlt: ${k}`);
  assert.ok(/function buNzZaehlen\(\) \{[^\n]*k === BU\.nzSicht\) return;/.test(html) && /if \(v !== "buero" && typeof BU !== "undefined"\) BU\.nzSicht = null;/.test(html), "Büro-Fächer einmal je Öffnen zählen");
  assert.ok(/class="nz-zeile\$\{unter \? " nz-unter" : ""\}"/.test(html), "Teilbereiche eingerückt");
}
// 270. 1.90.0: Hilfe-Aufruf an der Pinnwand, „nach Absprache“, größeres Textfeld
{
  const mig = lies("supabase/migrations/20261003_kc_club_v1900_hilfe_absprache.sql");
  assert.ok(/add column if not exists nach_absprache boolean not null default false/.test(mig) && /char_length\(notiz\) <= 1000/.test(mig) && /Rückweg/.test(mig), "Migration Absprache/Textlänge");
  const auf = server.slice(server.indexOf('case "hilfe_aufruf": {'), server.indexOf('case "hilfe_antwort": {'));
  assert.ok(/const datum = absprache \? tagDazu\(heute, HILFE_ABSPRACHE_TAGE\)/.test(auf) && /nach_absprache: absprache/.test(auf) && /txt\(p\.notiz, HILFE_NOTIZ_ZEICHEN\)/.test(auf) && /wann2 = hilfeWann\(h\)/.test(auf), "Server: Absprache + 1000 Zeichen");
  assert.ok(/const hilfeWann = \(h: any\) => h\.nach_absprache \? "nach Absprache"/.test(server) && !/leihTag\(h\.datum, h\.slot\)/.test(server.slice(server.indexOf('case "hilfe_antwort": {'), server.indexOf('case "hilfe_schliessen": {'))), "Zusage-Meldung mit hilfeWann");
  const pw = server.slice(server.indexOf('case "pinnwand": {'), server.indexOf('case "pinnwand_anheften": {'));
  assert.ok(/hilfe: await hilfeListe\(ich\)/.test(pw) && /\.catch\(\(\) => null\)/.test(pw), "Pinnwand liefert Aufrufe aus dem vorhandenen Kern, Fehler bricht die Pinnwand nicht");
  assert.ok(/function pwAushangHtml\(\)/.test(html) && /onclick="hilfeVonPinnwand\('\$\{a\.id\}'\)"/.test(html) && /function hilfeVonPinnwand\(id\) \{[^\n]*(HL\.oeffnen = id; (return )?hlStart\("helfen"\)|hilfeDirekt\(id\))/.test(html), "Aushang führt zum Aufruf"); // 1.93.0: Kurzansicht bzw. Formular (Test 274)
  assert.ok(/if \(HL\.tab === "helfen" && HL\.oeffnen\)/.test(html), "Aufruf nach Laden öffnen");
  assert.ok(/PW\.offen = PW\.zettel\.filter\(\(z\) => !z\.vonMir && !z\.erledigt\)\.length \+ pwHilfeNeu\(\)\.length/.test(html) && /PW_GEMELDET\.has\("hilfe:" \+ a\.id\)/.test(html), "Zählen + Start-Hinweis einmal je Aufruf");
  assert.ok(/hlSetze\('absprache', true\)">🤝 Nach Absprache/.test(html) && /absprache: false, datum: hlTag\(0\)/.test(html) && /absprache: !!f\.absprache/.test(html), "Formular Absprache, Standard bestimmter Tag");
  assert.ok(/<textarea id="hfNotiz" data-diktat class="hl-notiz" rows="6" maxlength="900"/.test(html) && /\.slice\(0, 1000\)/.test(html), "großes Textfeld");
  assert.ok(!/🗓️ \$\{esc\(hlTagName\(a\.datum\)\)\}/.test(html) && /hlWann\(a\)/.test(html), "Anzeige überall über hlWann");
}
// 271. 1.91.0: KC-CLUB-ONLINE-SEITE – Kopf-Kachel öffnet Mitglieder nur online, ohne gemerkte Wahl zu ändern
{
  assert.ok(/<button class="mini" onclick="mgNurOnline\(\)">/.test(html) && /onclick="event\.stopPropagation\(\); mgNurOnline\(\)"/.test(html), "Kachel + Zahl → Online-Seite");
  assert.ok(/function mgNurOnline\(\) \{ MG_EINMAL = "online"; zeige\("mitglieder"\); \}/.test(html) && /nurOnline = \(MG_EINMAL \|\| MG_FILTER\) === "online" && sichtbar/.test(html), "einmaliger Filter");
  assert.ok(html.indexOf("let MG_EINMAL = null;") < html.indexOf("function zeige(") && /if \(v !== "mitglieder" && v !== "mitglied"\) MG_EINMAL = null;/.test(html) && /function mgFilterSetzen\(f\) \{ MG_EINMAL = null;/.test(html), "zurücksetzen, gemerkte Wahl bleibt");
  assert.ok(/\{ id: "online", sym: "👋", t: "Online", los: \(\) => onlineBlatt\(\) \}/.test(html), "Online-Fenster bleibt erreichbar");
}
// 272. 1.92.0: Hilfe-Aufruf ändern + „egal wie viele“
{
  const mig = lies("supabase/migrations/20261003_kc_club_v1920_hilfe_ohne_grenze.sql");
  assert.ok(/alter column anzahl drop not null/.test(mig) && /anzahl is null or anzahl between 1 and 20/.test(mig) && /Rückweg/.test(mig), "Migration ohne Grenze");
  const ae = server.slice(server.indexOf('case "hilfe_aendern": {'), server.indexOf('case "hilfe_schliessen": {'));
  assert.ok(/h\.von !== ich\.person_id && !ich\.vorstand\) throw new Fehler\("Ändern kann nur/.test(ae) && /h\.geschlossen_am \|\| h\.datum < heute/.test(ae) && /protokoll\(ich\.person_id, "hilfe_geaendert"/.test(ae), "Rechte, offen, Audit");
  assert.ok(/\.eq\("antwort", "komme"\)/.test(ae) && !/aktiveMitglieder/.test(ae), "nur Zugesagte benachrichtigen, kein Rundruf");
  assert.ok(/const voll = !!h\.anzahl && \(count \?\? 0\) >= h\.anzahl;/.test(server) && /const hilfeAnzahl = \(v: unknown\) => v === null/.test(server), "ohne Grenze nie voll");
  assert.ok(/function hilfeOeffnen\(id\) \{[^\n]*hilfeInfo\(id\)/.test(html) && /onclick="\$\('hilfeInfo'\)\?\.remove\(\);hilfeBearbeiten\('\$\{a\.id\}'\)">✏️ Ändern<\/button>/.test(html) /* 1.95.0: erst Kurzansicht, dort ✏️ Ändern (Test 276) */ && /class="mini-kachel[^\n]*onclick="hilfeOeffnen\('\$\{a\.id\}'\)"/.test(html), "Kachel → Formular für Berechtigte");
  assert.ok(/api\("hilfe_aendern", \{ id: f\.id, \.\.\.daten \}\)/.test(html) && /anzahl: f\.ohne \? null : f\.anzahl/.test(html) && /♾️ Egal wie viele/.test(html), "Formular speichert Änderung / ohne Grenze");
  assert.ok(!/komme\.length < [ax]\.anzahl/.test(html) && !/\$\{n\} von \$\{a\.anzahl\}/.test(html), "überall hlVoll/hlStand");
}
// 273. 1.92.1: nach dem Speichern bleibt der Aufruf sichtbar offen
assert.ok(/HL\.infoNach = f\.id; melde\(r\.benachrichtigt \? "💾 Gespeichert – der Aufruf bleibt offen/.test(html) && /if \(HL\.tab === "helfen" && HL\.infoNach\)/.test(html) && /: " · 🟢 offen"\}<\/div>/.test(html), "Speichern zeigt offenen Aufruf");
// 274. 1.93.0: KC-CLUB-HILFE-KURZ – Zusammenfassung + drei Antworten, Sprung per #hilfe=
{
  const k = html.slice(html.indexOf("function hilfeKurzHtml(a) {"), html.indexOf("async function hilfeKurzAntwort("));
  assert.ok(/✋ Ja, ich kann helfen/.test(k) && /🙅 Dabei kann ich nicht helfen/.test(k) && /❓ Ich brauche noch mehr Details/.test(k) && !/<input|<textarea|hlChips|hlStepper/.test(k), "Kurzansicht ohne Eingabefelder, drei Antworten");
  assert.ok(/if \(a\.offen( && !a\.eigen && !a\.darfSchliessen)?\) return hilfeKurzHtml\(a\);/.test(html), "offene Aufrufe → Kurzansicht"); // 1.95.0: auch eigene (Test 276)
  assert.ok(/async function hilfeDetails\(id\)[\s\S]{0,400}await direkt\(a\.von\.person_id\)/.test(html), "Details → Nachricht an Suchenden");
  assert.ok(/else if \(h\.startsWith\("#hilfe="\)\) hilfeDirekt\(/.test(html) && /url: APP_URL \+ "#hilfe=" \+ h\.id/.test(server), "Push/Mail-Sprung");
  assert.ok(/function hilfeVonPinnwand\(id\) \{[^\n]*hilfeDirekt\(id\)/.test(html), "Pinnwand → Kurzansicht");
}
// 275. 1.94.0: KC-CLUB-PINNWAND-EMOJI – Emojis auf Zetteln über den vorhandenen Emoji-Kern (kein zweiter Kern)
{
  assert.ok(/const EMO_ORTE = \{ text: \{ feld: "emoFeld"[^\n]*pwText: \{ feld: "pwEmoFeld"/.test(html) && (html.match(/const EMO_GRUPPEN = \[/g) || []).length === 1, "ein Kern, zwei Orte");
  assert.ok(/id="pwEmoSchnell"/.test(html) && /id="pwEmoFeld"/.test(html) && /onclick="emoEinfuegen\('\$\{e\}', 'pwText'\)"/.test(html) && /onclick="emoUmschalten\(undefined, 'pwText'\)">😊 Mehr/.test(html), "Schnellreihe + volle Auswahl am Zettel");
  assert.ok(/const PW_EMO_SCHNELL = \["🤒", "💐", "🍀"/.test(html), "Besserungs-Emojis vorne");
  assert.ok(/t\.maxLength > 0 && t\.value\.length \+ e\.length > t\.maxLength/.test(html) && /pwText: \{[^\n]*nachher: \(\) => pwZaehlen\(\)/.test(html), "Zeichengrenze + Zähler");
  const chatFeld = html.slice(html.indexOf('<textarea id="text" rows="2"'), html.indexOf("</textarea>", html.indexOf('<textarea id="text" rows="2"')));
  assert.ok(!/emoStelleMerken\(\)/.test(chatFeld) && /emoStelleMerken\('text'\)/.test(chatFeld), "Chat-Feld merkt sein eigenes Ziel");
}
// 276. 1.95.0: eigener Aufruf zuerst als Kurzansicht; Online-Ansage gesammelt, ab 4 Personen ohne Namen
{
  assert.ok(/if \(a\.offen\) return hilfeKurzHtml\(a\);/.test(html) && /Dein Aufruf – so sehen ihn die Mitglieder/.test(html) && /Noch niemand hat zugesagt/.test(html), "eigene Kurzansicht mit Stand");
  const k = html.slice(html.indexOf("function hilfeKurzHtml(a) {"), html.indexOf("async function hilfeKurzAntwort("));
  assert.ok(/\$\{eigen \? `<div class="hk-knoepfe"><button class="knopf haupt" onclick="\$\('hilfeInfo'\)\?\.remove\(\);hilfeBearbeiten/.test(k), "eigener Aufruf: Ändern/Schließen statt Antworten");
  assert.ok(/const ANSAGE_SAMMEL_MS = 1500, ANSAGE_NAMEN_MAX = 3;/.test(html) && /n\.length > ANSAGE_NAMEN_MAX\) return `\$\{n\.length\} Clubkameradinnen und Kameraden sind gerade online`/.test(html), "ab 4 zusammenfassen");
  assert.ok(/OA\.warte = \[\.\.\.new Set\(\[\.\.\.\(OA\.warte \|\| \[\]\), \.\.\.n\]\)\];/.test(html) && /clearTimeout\(OA\.sammelTimer\)/.test(html), "kurz nacheinander → eine Ansage");
}
// 277. 1.96.0: Sicherheitspaket
{
  const kc = server.slice(server.indexOf('if (a === "kurzcode_einloesen") {'), server.indexOf('if (a === "fehler_anonym") {'));
  assert.ok(kc.indexOf('protokoll(null, "kurzcode_versuch"') > 0 && kc.indexOf('protokoll(null, "kurzcode_versuch"') < kc.indexOf('from("kc_club_kurzcodes").select'), "Versuch vor der Prüfung zählen");
  assert.ok(/fehlGesamt \?\? 0\) > KURZCODE_FEHL_GESAMT\) \{ await db\.from\("kc_club_kurzcodes"\)\.delete\(\)/.test(kc), "Überlauf → offene Codes ungültig");
  assert.ok(/\^\(\?:\\p\{Extended_Pictographic\}\|\\p\{Emoji_Component\}/.test(server) && /onclick="reagieren\('\$\{m\.id\}',\$\{esc\(JSON\.stringify\(x\.emoji\)\)\}\)">\$\{esc\(x\.emoji\)\}/.test(html), "Reaktion nur Emoji, maskiert");
  const za = server.slice(server.indexOf('if (a === "zugang_anfordern") {'), server.indexOf('if (a === "kurzcode_einloesen") {'));
  assert.ok(/neu_token_hash: await sha256\(token\), neu_bis:/.test(za) && /bisher\?\.aktiv/.test(za), "Link verloren nur vormerken"); // 2.1.1: als Bedingungsausdruck
  assert.ok(/\.eq\("neu_token_hash", hash\)\.gt\("neu_bis", jetzt\(\)\)\.eq\("aktiv", true\)/.test(server) && /"zugang_uebernommen"/.test(server), "Übernahme beim ersten Öffnen");
  assert.ok(/aktiv\.has\(id\) && \(id !== ich\.person_id \|\| g\.erstellt_von === ich\.person_id\)/.test(server), "kein Selbst-Hinzufügen in fremde Gruppen");
  const mig = lies("supabase/migrations/20261003_kc_club_v1960_zugang_vormerken.sql");
  assert.ok(/add column if not exists neu_token_hash text/.test(mig) && /Rückweg/.test(mig), "Migration Vormerken");
}
// 278. 1.97.0: Updates & Ausfallsicherheit
{
  const sw = lies("sw.js");
  assert.ok(/c\.addAll\(DATEIEN\.map\(\(u\) => new Request\(u, \{ cache: "reload" \}\)\)\)/.test(sw) && /cache: "no-cache"/.test(sw) && /url\.searchParams\.has\("k"\)/.test(sw) && /e\.waitUntil\(caches\.open\(CACHE\)/.test(sw) && /navi \? caches\.match\("index\.html"\) : Response\.error\(\)/.test(sw), "Service Worker sicher");
  assert.ok(!/self\.addEventListener\("install"[^\n]*skipWaiting/.test(sw), "kein Sofort-Umschalten beim Einrichten (Mischstand)");
  const ja = html.slice(html.indexOf("async function jetztAktualisieren() {"), html.indexOf("function updateRuhig() {"));
  assert.ok(/addEventListener\("controllerchange", neu, \{ once: true \}\)/.test(ja) && /sw\.addEventListener\("statechange"/.test(ja) && !/setTimeout\(\(\) => location\.reload\(\), 400\)/.test(ja), "Update wartet auf Einrichtung + Übernahme");
  assert.ok(/updatePruefen\(false\)\.then\(updateSelbst\)/.test(html) && (/z\.v === NEUE_VERSION && Date\.now\(\) - z\.t < 10 \* 60000/.test(html) || /UPDATE_PAUSE_MS = 10 \* 60000/.test(html) && /nochmal && Date\.now\(\) - z\.t < \(z\.misslungen \? UPDATE_MISSLUNGEN_MS : UPDATE_PAUSE_MS\)/.test(html)), "Selbst-Update beim Zurückholen, mit Schleifenschutz"); // 2.6.1: + 6-Std.-Pause nach misslungenem Versuch
  assert.ok(/signal: (AbortSignal\.timeout\?\.|zeitSignal)\(zeitMs\)/.test(html) /* 2.6.1: zeitSignal (auch ältere iPhones) */ && /fe\?\.name === "TimeoutError"/.test(html) && /if \(API_LESEN\.test\(action\)\) return apiRoh/.test(html), "Zeitgrenze + nur Lesen wiederholen");
  assert.ok(/if \(NEU_LADEN_LAUF && !vonHand\) return (NEU_LADEN_LAUF;|NEU_LADEN_FOLGE \|\|)/.test(html) /* 2.1.1: mit Folge-Laden */ && /if \(fuer !== chatId\) return;/.test(html) && /clearInterval\(chatTimer\); if \(chatId === offenId/.test(html), "Laden/Chat nicht doppelt");
  assert.ok(/todoAnlegen = nurEinmal\("todoAnlegen", todoAnlegen\)/.test(html) && /erstattungSenden = nurEinmal/.test(html), "Doppeltippen gesperrt");
  assert.ok(/else if \(push\.zustand !== "ok" \|\| email\.zustand !== "ok"\) \{ farbe = "grau"/.test(server) && /ok: r\.status < 400/.test(server) && /if \(teilFehler\) throw new Fehler/.test(server), "unbekannt nie grün");
}
// 279. 1.98.0: Bedienung – Zurück, Fenster, Rückfragen, Begriffe, große Schrift, Mini-Browser
{
  assert.ok(/function zurueck\(ziel\) \{ if \(\(history\.state\?\.tiefe \|\| 0\) > 1\) history\.back\(\); else zeige\(ziel \|\| "start"\); \}/.test(html), "zurueck()");
  assert.ok(!/<button class="zurueck" onclick="zeige\(/.test(html), "kein ‹ legt mehr einen neuen Eintrag an");
  assert.equal((html.match(/<button class="zurueck"[^>]*>‹<\/button>/g) || []).filter((b) => !/aria-label=/.test(b)).length, 0, "‹ ohne aria-label");
  assert.ok(/history\.pushState\(\{ v: "start", tiefe: 1 \}/.test(html) && /pushState\(\{ \.\.\.st, tiefe: tiefe \+ 1 \}/.test(html), "Tiefe im Verlauf");
  assert.ok(/if \(offen\.length && VERLAUF\.state\) \{/.test(html) && /f\.dataset\.dyn = "1"; f\._zu = beiZu;/.test(html) && /history\.pushState\(VERLAUF\.state, "", VERLAUF\.url\); return;/.test(html), "Zurück schließt nur das Fenster");
  assert.ok(/function frageVerb\(text\)/.test(html) && /gefahr \? frageVerb\(text\) : "✅ Ja"/.test(html) && /f\.querySelector\(gefahr \? "\[data-w='0'\]"/.test(html), "sprechender Gefahr-Knopf, Fokus Abbrechen");
  assert.ok(/<h2>💬 Nachrichten<\/h2>/.test(html) && !/Vereinsarchiv|Vereinsordner/.test(html) && /"🤖 Clubleben"/.test(html), "Begriffe");
  assert.ok(/:root\.gross \.fuss-leiste button \{ font-size: 10px;/.test(html) && /\.knopf\.klein \{ min-height: 40px; \}/.test(html), "große Schrift / Tippflächen");
  assert.ok(/const inapp = \/; wv\\\)\|FBAN\|FBAV\|Instagram\|Line\\\/\|GSA\\\/\/\.test\(ua\);/.test(html) && /Erst in Chrome öffnen/.test(html) && /Erst in Safari öffnen/.test(html), "Mini-Browser im Assistenten");
  assert.ok(/iPhone\/iPad: in Safari öffnen, Android: in Chrome/.test(server), "Mail nennt Safari/Chrome");
}
// 280. 1.99.0: Admin-Name statt fest „Hansi“, „bald“-Kacheln ausgeblendet, Manifest-Symbole getrennt
{
  assert.ok(/const adminName = \(\) => INIT\?\.adminName \|\| "Hansi";/.test(html) && /ICH = INIT\.ich; adminNamenSetzen\(\);/.test(html), "Admin-Name aus init");
  assert.ok(/adminName: await adminVorname\(\)/.test(server) && /async function adminVorname\(\)/.test(server) && /bitte kurz \$\{await adminVorname\(\)\} Bescheid/.test(server), "Server liefert Admin-Namen");
  assert.ok(/Gebaut von Hansi für uns alle/.test(html) && /„Hansi hat die Club-App verlassen“/.test(html), "Urheberschaft/Beispiel bleiben");
  assert.ok(!/bitte Hansi Bescheid|bei Hansi angekommen|Korrektur an Hansi melden/.test(html), "keine festen Ansprechpartner mehr");
  assert.ok(/const kachelnAlle = \(r\) => KACHELN\[r\]\.filter\(\(k\) => !k\.bald && /.test(html) && /Kommt bald: /.test(html), "bald-Kacheln aus, Überblick nennt sie");
  const man = JSON.parse(lies("manifest.webmanifest"));
  assert.ok(man.icons.every((i) => i.purpose === "any" || i.purpose === "maskable") && man.icons.filter((i) => i.purpose === "maskable").length === 2, "Symbole getrennt");
}
// 281. 2.0.0: Restpunkte der Gesamtprüfung
{
  assert.ok(/async function routerSenden\([^)]*\) \{\n  try \{ return await routerSendenRoh\(/.test(server) && /catch \(e\) \{ console\.error\("routerSenden"/.test(server), "Versand stürzt nicht ab");
  assert.ok(/schonGemeldet = \(c \?\? 0\) > 0 \|\| \(cAlle \?\? 0\) >= 3;/.test(server) && /ohneLinks\(txt\(alarm\.text, 120\)\)/.test(server), "Alarm gedrosselt, ohne Links");
  assert.ok(/ende: p\.ende \? isoZeitOderFehler\(p\.ende, "Ende"\)/.test(server) && /Fehler-Nr\. \$\{nr\}/.test(server) && /\|html\|svg\|xml\)\/i\.test\(mime\)/.test(server), "Server-Härtung");
  assert.ok(/case "anlage_hochladen": \{[\s\S]{0,300}speicherStand\(\)/.test(server) && !/satzFuer\(saetze, new Date\(\)\.toISOString/.test(server), "Speicher-Grenze, Berliner Datum");
  assert.ok(/var appDa = typeof window\.zeige === "function" && !leer;/.test(html) && /window\.KCFP_leeren = function/.test(html), "Start-Wächter mit Speicher leeren");
  assert.ok(html.indexOf('navigator.serviceWorker.register("sw.js")') < html.indexOf("if (!KEY) {") && (html.match(/serviceWorker\.register\("sw\.js"\)/g) || []).length === 1, "Service Worker früh, einmal");
  assert.ok(/if \(API_LESEN\.test\(action\)\) try \{ return await notApi\(action, daten\); \}/.test(html), "Notbetrieb nur Lesen automatisch");
  assert.ok(!/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(html), "kein UTC-Tag mehr");
}
// 282. 2.1.0: Offline-Warteschlange, Offline-Stand, einfacher Kopf, Fenster-Kern
{
  assert.ok(/if \(!navigator\.onLine && chatId && !anlagen\.length && text\) \{/.test(html) && /async function owSenden\(\)/.test(html) && /window\.addEventListener\("online", \(\) => \{[^\n]*owSenden\(\)/.test(html), "Nachrichten ohne Netz vormerken + senden");
  assert.ok(/function offlineStandLaden\(e\)/.test(html) && /g\.schluessel !== KEY\.slice\(-8\)/.test(html) && /📴 <b>Kein Netz – das ist dein Stand von/.test(html) && /if \(!INIT \|\| INIT\._offline\) return;/.test(html), "Offline-Stand markiert, nur eigener, nie zurückgespeichert");
  assert.ok(/body:not\(\.ist-admin\) #ledComm, body:not\(\.ist-admin\) #ledDaten, body:not\(\.ist-admin\) #herzKnopf \{ display: none; \}/.test(html) && /if \(!ICH\?\.admin\) \{ vbEinfachZeigen\(\);/.test(html) && /function vbEinfachZeigen\(\) \{/.test(html), "einfacher Kopf für Mitglieder"); // 2.1.1: eigene Funktion
  assert.ok(/function fensterZu\(b\) \{ if \(b\._zu\) b\._zu\(\); else if \(b\.dataset\.fest\) b\.classList\.add\("versteckt"\); else b\.remove\(\); \}/.test(html) && /offen\.forEach\(fensterZu\);/.test(html) && /e\.key !== "Escape"/.test(html), "ein Fenster-Kern");
}
// 283. 2.1.1: Funde der Nachprüfung
{
  assert.equal((html.match(/history\.replaceState\(\{ v: "chat", id(: r\.id)?, tiefe: history\.state\?\.tiefe \}/g) || []).length, 2, "Chat behält Tiefe");
  assert.ok(/const zeitMs = API_LESEN\.test\(action\) \? 25000 : 140000;/.test(html) && !/\|\.\*_start\|/.test(html) && /if \(e\?\.zeit\) \{ owSchreiben/.test(html), "Zeitgrenzen / Lesen");
  assert.ok(/eq\("aktion", "kurzcode_fehlversuch"\)\.eq\("details->>netz", netz\)/.test(server) && /if \(KC_LAEUFT\) return;/.test(html), "Kurzcode-Bremse fair");
  assert.ok(/if \(RUF \|\| SPR \|\| wartenZahl\) return false;/.test(html) && /ICH\?\.admin \? vbBlattZeigen\(\) : vbEinfachZeigen\(\)/.test(html), "Update ruhig / einfache Ansicht bleibt");
  assert.ok(/NEU_LADEN_FOLGE = NEU_LADEN_LAUF\.catch/.test(html) && /if \(e\.key === "Escape"\) \{ e\.preventDefault\(\); zu\(null\); \}/.test(html) && /String\(text\)\.split\(\/\[\?\\n\]\/\)\[0\]/.test(html), "Laden/Escape/Verb");
  assert.ok(/if \(zf\) \{ console\.error\("zugang_anfordern"/.test(server) && /zaehlUnsicher = true; return \{ t, n: 0 \}/.test(server) && /ungelesenUnsicher: zaehlUnsicher/.test(server), "Server-Funde");
}
// 284. 2.1.2: Bedienungsanleitung Version 3
{
  const v3 = fs.readFileSync(new URL("../dokumente/Koecheclub-App_Anleitung_V3.pdf", import.meta.url));
  assert.ok(v3.subarray(0, 5).toString() === "%PDF-" && v3.length < 9e6, "Anleitung V3 fehlt oder zu groß");
  for (const v of [1, 2]) assert.ok(fs.existsSync(new URL(`../dokumente/Koecheclub-App_Anleitung_V${v}.pdf`, import.meta.url)), `V${v} muss unverändert bleiben`);
  const inh = fs.readFileSync(new URL("../tools/anleitung/inhalt.mjs", import.meta.url), "utf8"), f3 = fs.readFileSync(new URL("../tools/anleitung/fotos3.mjs", import.meta.url), "utf8");
  assert.ok(/anleitung: [345]/.test(inh) && /12\. Helfen & Leihen/.test(inh) && /13\. Bedienen, Anmelden & ohne Netz/.test(inh) && /Mit Code anmelden/.test(inh) && !/"s-herz"/.test(inh), "Inhalt V3");
  assert.ok(!/ptblnpiroqftcvlsrhac|service_role|eyJ[A-Za-z0-9_-]{20}/.test(f3), "fotos3 ohne echte Zugänge");
  assert.ok(/datei: "dokumente\/Koecheclub-App_Anleitung_V[345]\.pdf"/.test(html), "Anleitung in Meine Dokumente"); // 2.23.33: V4 löst V3 ab
}
// 285. 2.2.0: Vertretung des Admins vorbereitet
{
  assert.ok(/schalter\("roAdmin", "🛡️ Admin \(Vertretung\)"/.test(html) && /ICH\?\.admin && pid !== ICH\.person_id \? schalter\("roAdmin"/.test(html), "Admin-Schalter nur für Admin, nicht für sich selbst");
  assert.ok(/if \(adminSchalter && admin && !m\?\.admin && !\(await frage\(/.test(html) && /kontakte: \$\("roKontakte"\)\.checked, admin, aemter/.test(html), "Rückfrage + senden");
  const rs = server.slice(server.indexOf('case "rolle_setzen": {'), server.indexOf('return json({ ok: true });', server.indexOf('case "rolle_setzen": {')));
  assert.ok(/nurAdmin\(ich\)/.test(rs) && /pid === ich\.person_id( \|\| typeof p\.admin !== "boolean")? \? null : (!!)?p\.admin/.test(rs) && /"admin_recht_geaendert"/.test(rs), "Server: Admin-Recht protokolliert, nicht für sich selbst");
  assert.ok(/admins: await adminAnzahl\(\)/.test(server) && /r\.admins != null && r\.admins < 2/.test(html), "Admin-Zentrale warnt");
  assert.ok(/await adminAbwesendPruefen\(\)\.catch/.test(server) && /eq\("aktion", "admin_abwesend_gemeldet"\)\.gte\("zeit", new Date\(Date\.now\(\) - 7 \* 86400000\)/.test(server), "Hinweis an Clubleitung gedrosselt");
  assert.ok(/\{ id: "vertretung", sym: "🛡️"[^\n]*nur: \(\) => !!ICH\?\.admin \}/.test(html) && /DOKUMENTE\.filter\(\(d\) => !d\.nur \|\| d\.nur\(\)\)/.test(html), "Dokument nur für Admins");
  const pdf = fs.readFileSync(new URL("../dokumente/Vertretung_Admin_V1.pdf", import.meta.url)), werkzeug = fs.readFileSync(new URL("../tools/vertretung/bau.mjs", import.meta.url), "utf8");
  assert.ok(pdf.subarray(0, 5).toString() === "%PDF-" && !/ptblnpiroqftcvlsrhac|service_role|eyJ[A-Za-z0-9_-]{20}|passwort:/i.test(werkzeug), "Vertretungs-PDF da, Werkzeug ohne Geheimnisse");
  assert.ok(!/OK = per WhatsApp schicken\\nAbbrechen = in die Zwischenablage kopieren/.test(html) && /data-w="kopie">📋 Kopieren/.test(html), "Link-Fenster mit echten Knöpfen");
}
// 286. 2.3.0: Inkognito-Hauptschalter (nur Admin, nicht gegenseitig)
{
  assert.ok(/inkognito: \(w\) => \(\{ an: w\?\.an === true \}\)/.test(server) && /schluessel === "inkognito" && !ich\.admin( && \(wert as any\)\.an)?\) throw new Fehler\("Nur für den Admin\.", 403\)/.test(server), "nur Admin darf Inkognito setzen");
  assert.ok(/zeigen\.get\(id\) !== false && \(mitInkognito \|\| !inko\.has\(id\)\)/.test(server), "onlineJetzt ohne Inkognito-Admin"); // 2.6.1: außer als Empfänger
  assert.ok(/if \(\(await inkognitoSet\(\[wer\.person_id\]\)\)\.has\(wer\.person_id\)\) return;/.test(server), "kein Online-Push bei Inkognito");
  assert.ok(/x\.schluessel === "inkognito" \? !selbst && x\.wert\?\.an === true/.test(server) && /verborgen\(ich\.person_id, true\)/.test(server), "zuletzt da: verbirgt nur den Admin selbst");
  assert.ok(/zeigen\.get\(m\.person_id\) !== false && !inko\.has\(m\.person_id\)/.test(server), "kein „heute da“ bei Inkognito");
  assert.ok(/"inkognito_geaendert"/.test(server), "Audit");
  assert.ok(/id="setInkognitoZeile"/.test(html) && /body:not\(\.ist-admin\) #setInkognitoZeile/.test(html) && /const inkognitoAn = \(\) => !!\(ICH\?\.admin &&/.test(html), "Schalter nur für Admin");
  assert.ok(/onclick="inkognitoSetzen\(!inkognitoAn\(\)\)"/.test(html) && /class="inko-marke"/.test(html), "Hauptschalter Admin-Zentrale + Marke");
}
// 287. 2.3.1: Inkognito-Knopf in der Kopfleiste
{
  assert.ok(/id="inkoKnopf"[^>]*onclick="inkognitoSetzen\(!inkognitoAn\(\)\)"/.test(html) && /body:not\(\.ist-admin\) #inkoKnopf/.test(html) && /k\.classList\.toggle\("an", inkognitoAn\(\)\)/.test(html), "Kopf-Knopf nur Admin, zeigt Zustand");
  assert.ok(/classList\.toggle\("ist-admin", !!ICH\?\.admin\); inkognitoZeigen\(\);/.test(html), "Zustand nach dem Laden");
}
// 288. 2.3.2: Updates automatisch beim Start und alle 10 Min. auf der Startseite
{
  assert.ok(/updatePruefen\(false\)\.then\(\(\) => setTimeout\(updateSelbst, 4000\)\);/.test(html), "Selbst-Update beim Start");
  assert.ok(/aktuelleAnsicht === "start" && !chatId\) updatePruefen\(false\)\.then\(updateSelbst\); \}, UPDATE_TAKT_MS\)/.test(html) && /const UPDATE_TAKT_MS = 10 \* 60000;/.test(html), "Selbst-Update im Takt nur auf der Startseite");
  assert.ok(/if \(!NEUE_VERSION \|\| !updateRuhig\(\)( \|\| !ICH[^)]*\)[^\n]*)?\) return;/.test(html) && (/Date\.now\(\) - z\.t < 10 \* 60000\) return;/.test(html) || /UPDATE_PAUSE_MS = 10 \* 60000/.test(html)), "Schutz bleibt"); // 2.6.1: als Konstante
}
// 289. 2.3.3: Gegenprobe vor dem automatischen Notbetrieb
{
  assert.ok(/\(await notGegenprobe\(\)\) && \(await notEinschalten(Einmal)?\("auto"\)\)/.test(html), "Gegenprobe vor dem Umschalten");
  const g = html.slice(html.indexOf("function notGegenprobe()"), html.indexOf("async function notEinschalten("));
  assert.ok(/if \(notErnstfall\(\)\) return Promise\.resolve\(true\)/.test(g) && /if \(!navigator\.onLine\) return Promise\.resolve\(false\)/.test(g), "Simulation schaltet, offline nicht");
  assert.ok(/fetch\(API, \{/.test(g) && /action: "ping"/.test(g) && /if \(!weg\) NOT\.fehler = 0;/.test(g) && /notGegenLauf \|\| \(notGegenLauf =/.test(g), "direkte Probe, gemeinsam, Zähler zurück");
}
// 290. 2.4.0: Einweisung beim ersten Öffnen (KC-CLUB-EINWEISUNG)
{
  const ids = [...html.slice(html.indexOf("const EINWEISUNG = ["), html.indexOf("const einwStand")).matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 15 && ids.every((id) => html.includes(`<section id="v-${id}"`)), "jede Einweisung gehört zu einer echten Ansicht");
  assert.ok(/einwZeigen\(v\); \/\/ KC-CLUB-EINWEISUNG/.test(html) && /inkognitoZeigen\(\); einwZeigen\(aktuelleAnsicht\);/.test(html), "beim Öffnen und nach dem Laden");
  assert.ok(/onclick="einwVerstanden\('\$\{v\}'\)">👍 Verstanden/.test(html) && /onclick="einwAlleAus\(\)">Keine Einweisungen mehr/.test(html), "zwei Knöpfe");
  assert.ok(/id="setEinw" checked onchange="einwSchalter\(this\.checked\)"/.test(html) && /onclick="einwZuruecksetzen\(\)"/.test(html), "Einstellungen");
  assert.ok(/if \(einwOffen\("start"\)\) return false;/.test(html), "Tipp wartet");
  assert.ok(/einweisung: \(w\) => \(\{ an: w\?\.an !== false, gesehen:/.test(server) && /KA_ID\.test\(id\)[^\n]*\.slice\(0, 40\)/.test(server), "Server prüft Einstellung");
  const z = server.slice(server.indexOf("async function einweisungZahlen("), server.indexOf("async function adminAbwesendPruefen("));
  assert.ok(!/name|display_name/.test(z.replace("einweisungZahlen", "")) && /einweisung: await einweisungZahlen\(\)/.test(server), "Admin-Zahlen ohne Namen");
}
// 291. 2.4.1: Inkognito – schwarzer Rahmen + Ameisen beim Einschalten
{
  // 2.4.2: Farbe gelb statt schwarz (im dunklen Design unsichtbar)
  assert.ok(/body\.inkognito #v-start \.hero \{ box-shadow: 0 0 0 4px #(000|f1c40f)/.test(html) && /document\.body\.classList\.toggle\("inkognito", inkognitoAn\(\)\)/.test(html), "schwarzer Rahmen solange an");
  assert.ok(/if \(an\) inkoAmeisen\(\);/.test(html) && /\.hero \.inko-ameisen rect \{[^}]*animation: ameisenLauf/.test(html) && /const INKO_AMEISEN_MS = 4000;/.test(html), "Ameisen beim Einschalten, dann aus");
}
// 292. 2.4.2: Programmfehler aus catch-Blöcken protokollieren und verständlich zeigen (KC-CLUB-FEHLER-FANG)
{
  assert.ok(!/melde\(e\.message, true\)/.test(html), "alle catch-Meldungen über meldeFehler");
  assert.ok(/function meldeFehler\(e\) \{/.test(html) && /e instanceof TypeError \|\| e instanceof ReferenceError/.test(html) && /window\.KCFP\?\.neu\("gefangen", \{ text: t, stack: fehlerStapel\(e\?\.stack\) \}\)/.test(html), "mit Stapel ins Protokoll");
  assert.ok(/if \(fehler && JS_FEHLER\.test\(String\(t\)\)\)/.test(html), "auch direkte Meldungen");
}
// 293. 2.5.0: Vorlesen bei Einweisung und Tipp des Tages (KC-CLUB-VORLESEN-HILFE)
{
  assert.ok(/<div class="einw-kopf">🎓 Kurz erklärt \$\{VORLESE_KNOPF\}/.test(html) && /<div class="tdt-kopf">💡 Tipp des Tages \$\{VORLESE_KNOPF\}/.test(html), "Knopf in beiden Karten");
  const f = html.slice(html.indexOf("let VORLESE = null;"), html.indexOf("const VORLESE_KNOPF"));
  // 2.6.1: eigene Ausgabe, Knopf wechselt auf „⏹ Aufhören“
  assert.ok(/if \(VORLESE\?\.knopf === knopf\) return vorlesenStopp\(\);/.test(f) && /speechSynthesis\.speak\(u\)/.test(f) && !/fetch\(/.test(f), "an/aus, nur Handy-Sprache");
}
// 294. 2.6.0: Nutzung – verschiedene Mitglieder ohne Namen (KC-CLUB-NUTZUNG-PERSONEN)
{
  const mig = lies("supabase/migrations/20261003_kc_club_v2600_nutzung_geraete.sql");
  assert.ok(/create table if not exists kc_club_nutzung_geraete/.test(mig) && /enable row level security/.test(mig) && !/person_id/.test(mig) && /revoke all on function kc_club_nutzung_geraete_zahlen/.test(mig), "Tabelle ohne Person, RLS, Funktion gesperrt");
  const f = server.slice(server.indexOf('case "nutzung_melden": {'), server.indexOf('case "nutzung_statistik": {'));
  assert.ok(/from\("kc_club_nutzung_geraete"\)\.upsert\(\[\.\.\.new Set\(heute\)\]\.map\(\(bereich\) => \(\{ tag, bereich, geraet \}\)\)/.test(f) && !/person_id/.test(f.slice(f.indexOf("KC-CLUB-NUTZUNG-PERSONEN"))), "Server speichert keine Person");
  assert.ok(/kc_club_nutzung_geraete"\)\.delete\(\)\.lt\("tag", berlinTag\(new Date\(Date\.now\(\) - 100 \* 86400000\)\)\)/.test(server), "100 Tage Aufbewahrung");
  assert.ok(/crypto\.getRandomValues\(a\)/.test(html) && /localStorage\.getItem\("kc_club_nz_geraet"\)/.test(html) && /geraet: NZ_GERAET, heute/.test(html), "zufällige Geräte-Kennung");
  assert.ok(/class="nz-wer/.test(html) && /🚫 Nie geöffnet in/.test(html), "Anzeige");
}
// 295. 2.6.1: Gesamtprüfung 2 – Start-Bereitschaft, Update-Schutz, Notbetrieb, Inkognito dichter
{
  assert.ok(/if \(!ICH && !ZEIGE_OHNE_ICH\.has\(v\)\) \{/.test(html) && /if \(ICH\) startBereitLoesen\(\); \/\/ KC-CLUB-START-BEREIT/.test(html) && /offlineStandZeigen\(true\); if \(ICH\) startBereitLoesen\(\);/.test(html), "Bereiche warten auf die Anmeldung");
  assert.ok(/!ICH \|\| aktuelleAnsicht !== "start" \|\| chatId \|\| RUF/.test(html) && /if \(localStorage\.getItem\("kc_club_auto_update"\) !== neu\) return; \} catch \{ return; \}/.test(html) && /fpNeu\("update_misslungen"/.test(html), "Selbst-Update nur ruhig, mit Speicher, mit Rückzug");
  assert.ok(/if \(!k\?\.url \|\| k\.modus === "aus"\) \{ NOT\.fehler = 0; return false; \}/.test(html) && /notEinschaltenEinmal\("auto"\)/.test(html) && /function zeitSignal\(ms\)/.test(html) && !/AbortSignal\.timeout\?\./.test(html), "Notbetrieb: Probe nur wenn sinnvoll, einmal, Zeitgrenzen");
  assert.ok(/ICH = INIT\.ich; einstOffenAnwenden\(\); \/\*[^*]*\*\/ adminNamenSetzen\(\); document\.body\.classList\.toggle\("ist-admin", !!ICH\?\.admin\); inkognitoZeigen\(\);/.test(html) /* nie per //-Kommentar den Rest der Zeile abschneiden */ && /body\.einfach \.kacheln3 \.mini \.mpfeil \{ display: none; \}/.test(html), "Einstellungen gewinnen gegen init; einfache Ansicht ohne Randpfeile");
  assert.ok(/\.from\("kc_club_rollen"\)\.select\("person_id"\)\.eq\("ist_admin", true\)\.in\("person_id", an\)/.test(server) && /!inkoAndere\.has\(z\.person_id\)/.test(server) && /mzS\.filter/.test(server), "Inkognito nur für Admins, nicht über Haken/Admin-Zentrale");
  assert.ok(/typeof p\.admin !== "boolean" \? null : p\.admin/.test(server) && /if \(re\) throw new Fehler\("Die Rolle konnte nicht gespeichert werden/.test(server), "Rolle: alte App entzieht nichts, Fehler bricht ab");
  assert.ok(/<div class="gruss"><button id="inkoKnopf"[^>]*>🕶️<\/button><span id="begruessung">/.test(html), "🕶️ vor dem Gruß, nicht in der vollen Knopfreihe");
  assert.ok(/\n\s+anmeldungenVergessen\(\); \/\/ KC-CLUB-ANMELDECACHE: alter Link sofort ungültig/.test(server) && /if \(e3 \|\| count === null \|\| count > 0\) return;/.test(server), "Link-Cache, kein Fehlalarm");
}
// 296. 2.6.2: Vorlese-Stimme – beste deutsche Stimme statt der ersten, wählbar (KC-CLUB-STIMME)
{
  assert.ok(/function deStimme\(\)/.test(html) && /STIMME_SCHLECHT\.test\(v\.name\) \? -20/.test(html) && /const u = sprechAusgabe\(t\);/.test(html), "eine Stelle für die Stimme, Spaßstimmen raus");
  assert.ok(!/getVoices\(\)\.find\(\(\w\) => \/\^de\/i\.test/.test(html), "nirgends mehr „erste deutsche Stimme“");
  assert.ok(/id="setStimme" onchange="stimmeSetzen\(this\.value\)"/.test(html) && /onclick="stimmeProbe\(\)"/.test(html), "Wahl + Probe in den Einstellungen");
}
// 297. 2.7.0: Spiele – Köcheclub Edition, Tic-Tac-Toe (KC-CLUB-SPIELE)
{
  const mig = lies("supabase/migrations/20261003_kc_club_v2700_spiele.sql");
  assert.ok(/create table if not exists kc_club_spiele/.test(mig) && /enable row level security/.test(mig) && /check \(groesse in \(3, 4\)\)/.test(mig) && /check \(von <> an\)/.test(mig), "Tabelle mit RLS und Prüfungen");
  const zug = server.slice(server.indexOf('case "spiel_zug": {'), server.indexOf('case "spiel_aufgeben": {'));
  assert.ok(/g\.dran !== ich\.person_id\) throw/.test(zug) && /Number\(p\.zuege\) !== g\.zuege\) throw/.test(zug) && /g\.brett\[feld\] !== "\."/.test(zug) && /\.eq\("zuege", g\.zuege\)\.eq\("status", "laeuft"\)/.test(zug), "Server prüft Zug, Reihenfolge, Doppelzug");
  assert.ok(/spielBereitMap\(\[an\]\)\)\.get\(an\) \?\? \[\]\)\.includes\(art\)\) throw/.test(server) /* 2.8.0: je Spiel */ && /spiele: \(w\) => \(\{ herausforderung: w\?\.herausforderung === true/.test(server), "nur wer es erlaubt (Standard aus)");
  assert.ok(/Date\.now\(\) - Date\.parse\(z\.zuletzt_gesehen\) < 45000\) return;/.test(server) && /ruhendePersonen\(\[an\]\)\)\.has\(an\)\) return;/.test(server), "Push nicht bei offener App/Ruhezeit");
  assert.ok(/\{ id: "spiele", sym: "🎲", t: "Spiele"/.test(html) && /<section id="v-spiele"/.test(html) && /Köcheclub Edition/.test(html) && /id="setSpiele"/.test(html) && /<div id="mdSpiel"><\/div>/.test(html), "Kachel, Ansicht, Einstellung, Mitgliederseite");
  // Computer: 3×3 schwer verliert nie (Stichprobe gegen Zufall)
  const code = html.slice(html.indexOf("function spLinien(n)"), html.indexOf("// ----- Ansicht -----"));
  const { spComputerZug, spAuswerten } = new Function(code + "; return { spComputerZug, spAuswerten };")();
  for (let k = 0; k < 40; k++) { let b = ".........", x = k % 2 === 0;
    for (;;) { const frei = [...b].map((c, i) => c === "." ? i : -1).filter((i) => i >= 0); const i = x ? frei[Math.floor(Math.random() * frei.length)] : spComputerZug(b, 3, "schwer");
      b = b.slice(0, i) + (x ? "x" : "o") + b.slice(i + 1); const a = spAuswerten(b, 3); if (a.sieger || a.voll) { assert.ok(a.sieger !== "x", "Computer (schwer, 3×3) hat verloren: " + b); break; } x = !x; } }
  assert.ok(spAuswerten("xxxx............", 4).sieger === "x" && spAuswerten("xxx.............", 4).sieger === null && spAuswerten("o....o....o....o", 4).sieger === "o", "4×4: vier in einer Reihe");
}
// 298. 2.7.1: Pokal des Monats (KC-CLUB-SPIELE-POKAL)
{
  assert.ok(/monat: \{ name: monatName\(jetztM\), liste: diesen\.slice\(0, 5\) \}, pokalVormonat: \{ name: monatName\(vorM\), sieger: pokal\(vorher\) \}/.test(server) && /const monatVon = \(d: Date\) => berlinTag\(d\)\.slice\(0, 7\)/.test(server), "Monat in deutscher Zeit, Vormonat vergeben");
  assert.ok(/function spPokalHtml\(L\)/.test(html) && /\$\{spPokalHtml\(L\)\}/.test(html), "Pokal-Karte");
}
// 299. 2.8.0: Schach – Köcheclub Edition (KC-CLUB-SCHACH)
{
  const mig = lies("supabase/migrations/20261003_kc_club_v2800_spiele_schach.sql");
  assert.ok(/spiel in \('ttt', 'schach'\)/.test(mig) && /spiel = 'schach' and groesse = 8/.test(mig) && /add column if not exists letzter_zug/.test(mig), "DB kennt Schach");
  assert.ok(/import \{ Chess \} from "\.\/chess\.js";/.test(server) && fs.existsSync(new URL("../supabase/functions/kc-club/chess.js", import.meta.url)) && fs.existsSync(new URL("../lib/chess/chess.js", import.meta.url)) && /BSD|Redistribution/.test(lies("lib/chess/LICENSE")), "chess.js lokal mit Lizenz");
  const zug = server.slice(server.indexOf('case "spiel_zug": {'), server.indexOf('case "spiel_aufgeben": {'));
  assert.ok(/if \(ch\.turn\(\) !== farbe\) throw/.test(zug) && /try \{ m = ch\.move\(\{ from: von, to: nach, promotion: umw \}\); \} catch \{ m = null; \}/.test(zug) && /sieg = ch\.isCheckmate\(\); remis = !sieg && ch\.isDraw\(\);/.test(zug), "Server prüft Schachzüge");
  assert.ok(/import\("\.\/lib\/chess\/chess\.js\?v=1\.4\.0"\)/.test(html) && /function schComputerZug\(ch, staerke\)/.test(html) && /onclick="spArtWahl\('schach'\)"/.test(html) && /function schUmwandlung\(farbe\)/.test(html), "Schach in der App");
  // Computer findet Matt in 1 (Stichprobe mit der echten Bibliothek)
  const { Chess } = await import(new URL("../lib/chess/chess.js", import.meta.url));
  const code = html.slice(html.indexOf("const SCH_FIG"), html.indexOf("// ----- Brett -----"));
  const { schComputerZug } = new Function("Chess", code + "; return { schComputerZug };")(Chess);
  assert.equal(schComputerZug(new Chess("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1"), "mittel").san, "Rd8#", "Computer findet Matt in 1 nicht");
}
// 300. 2.9.0: Bauernskat gegen den Computer (KC-CLUB-BAUERNSKAT)
{
  const code = html.slice(html.indexOf("const BSK_FARBEN"), html.indexOf("// ----- Ansicht (gegen den Computer) -----"));
  const E = new Function(code + "; return { bskNeu, bskErlaubt, bskSpielen, bskStichAbschliessen, bskErgebnis, bskZugComputer, bskAnsageWahl, bskSichtbarAnsage, bskStichGewinner };")();
  assert.ok(E.bskStichGewinner([{ s: 0, k: "he-A" }, { s: 1, k: "ka-B" }], "kr") === 1 && E.bskStichGewinner([{ s: 0, k: "pi-B" }, { s: 1, k: "kr-B" }], "grand") === 1
    && E.bskStichGewinner([{ s: 0, k: "he-7" }, { s: 1, k: "pi-A" }], "kr") === 0 && E.bskStichGewinner([{ s: 0, k: "ka-B" }, { s: 1, k: "kr-A" }], "kr") === 0, "Stichregeln");
  for (let n = 0; n < 30; n++) { const z = E.bskNeu(n % 2); z.trumpf = E.bskAnsageWahl(E.bskSichtbarAnsage(z, z.vorhand)); z.phase = "spiel"; z.amZug = z.vorhand; let i = 0;
    while (z.phase !== "ende") { const s = z.amZug, k = E.bskZugComputer(z, s, n % 3 ? "mittel" : "leicht"); assert.ok(E.bskErlaubt(z, s).includes(k), "unerlaubte Karte"); if (E.bskSpielen(z, s, k)) E.bskStichAbschliessen(z); assert.ok(++i < 40, "Schleife"); }
    const e = E.bskErgebnis(z); assert.equal(e.augen[0] + e.augen[1], 120, "Augen ≠ 120"); assert.equal(e.gewinner, e.augen[e.ansager] >= 61 ? e.ansager : 1 - e.ansager, "61-Regel"); }
  assert.ok(/onclick="spArtWahl\('bsk'\)"/.test(html) && /function bskPcZeigen\(\)/.test(html), "Bauernskat in der App");
}
// 301. 2.9.1: Termin zu einer Partie (KC-CLUB-SPIEL-TERMIN) – über die vorhandene Terminanfrage
{
  const mig = lies("supabase/migrations/20261003_kc_club_v2910_spiel_termin.sql");
  assert.ok(/add column if not exists spiel_id uuid references kc_club_spiele\(id\) on delete set null/.test(mig) && /erinnerung_min in \(0, 30, 60, 120\)/.test(mig), "Spalten");
  const ts = server.slice(server.indexOf('case "terminanfrage_senden": {'), server.indexOf('case "terminanfragen_liste": {'));
  assert.ok(/sg\.von !== ich\.person_id && sg\.an !== ich\.person_id\)\) throw/.test(ts) && /ziel = \[sg\.von === ich\.person_id \? sg\.an : sg\.von\]/.test(ts), "nur eigene Partie, nur an das Gegenüber");
  assert.ok(/\.gt\("erinnerung_min", 0\)\.is\("kurz_erinnert_am", null\)/.test(server) && /if \(!zu\.length\) continue;/.test(server), "Erinnerung kurz vorher nur nach Zusage");
  assert.ok(/function spTerminBlatt\(id\)/.test(html) && /api\("terminanfrage_senden", \{ anlass:/.test(html) && /spiel_id: g\.id, erinnerung_min: 60 \}/.test(html) /* 2.23.22: jeder stellt seine Erinnerung selbst ein */ && /\$\{spTerminHtml\(g\)\}/.test(html), "App: Termin an der Partie");
}
// 302. 2.9.2: Karten wie französisches Blatt
{
  assert.ok(/function bskKartenbild\(c\)/.test(html) && /const BSK_FIGUR = \{ B: "👨‍🍳", D: "👸", K: "🤴" \};/.test(html) && /"10": \[\[25, 8\]/.test(html) && /\.bsk-ecke\.unten \{[^}]*rotate\(180deg\)/.test(html), "Eckzeichen, Pips, Bildkarten");
}
// 303. 2.9.3: echte Kartenbilder (KC-CLUB-KARTEN-ECHT) – CC0, mit Fallback auf gezeichnete Karte
{
  const karten = ["kr", "pi", "he", "ka"].flatMap((f) => ["A", "10", "K", "D", "B", "9", "8", "7"].map((w) => `${f}-${w}.svg`));
  for (const k of [...karten, "rueck.svg"]) assert.ok(lies("lib/karten/" + k).startsWith("<svg"), "Kartenbild fehlt: " + k);
  assert.ok(/CC0/.test(lies("lib/karten/LICENSE")), "Lizenz CC0");
  assert.ok(!/<text/.test(lies("lib/karten/pi-A.svg")), "Pik-Ass ohne Fremdtext");
  assert.ok(/class="bsk-bildkarte" src="lib\/karten\/\$\{k\}\.svg\?v=1"[^>]*onerror="this\.remove\(\)"/.test(html) && /bskKartenbild\(c\) \+/.test(html), "Bild mit Fallback");
}
// 304. 2.10.0: Bauernskat gegen Mitglieder (KC-CLUB-BAUERNSKAT-MG) – Server hält verdeckte Karten, Regeln = Kopie aus index.html
{
  const kopie = lies("supabase/functions/kc-club/bauernskat.js"), a = html.indexOf("const BSK_FARBEN = "), b = html.indexOf("// ----- Computer -----", a);
  assert.ok(kopie.includes(html.slice(a, b).trimEnd()), "bauernskat.js weicht von index.html ab – node tools/bauernskat/server-kopie.mjs");
  assert.ok(/import \{ bskNeu, bskErlaubt, bskSpielen, bskStichAbschliessen, bskErgebnis \} from "\.\/bauernskat\.js"/.test(server), "Server nutzt die Kopie");
  const mig = lies("supabase/migrations/20261003_kc_club_v2100_bauernskat_mitglieder.sql");
  assert.ok(/add column if not exists bsk jsonb/.test(mig) && /spiel in \('ttt', 'schach', 'bsk'\)/.test(mig), "Migration");
  const sicht = server.slice(server.indexOf("function bskSicht("), server.indexOf("const spielSicht"));
  assert.ok(/i === s \? \(ansage \? \[\.\.\.z\.sp\[i\]\.hand\.slice\(0, 4\), null, null, null, null\] : z\.sp\[i\]\.hand\) : z\.sp\[i\]\.hand\.map\(\(\) => null\)/.test(sicht) && /unten: p\.unten \? true : null/.test(sicht), "fremde Hand + verdeckte Bauern bleiben geheim");
  assert.ok(/bsk: g\.spiel === "bsk" \? bskSicht\(g\.bsk, g\.spieler_x === ich \? 0 : 1\) : null/.test(server) && !/bsk: g\.bsk[,\s}]/.test(server), "nur die Sicht verlässt den Server");
  const zug = server.slice(server.indexOf('case "spiel_zug": {'), server.indexOf('case "spiel_aufgeben": {'));
  assert.ok(/if \(!bskErlaubt\(z, s\)\.includes\(k\)\) throw/.test(zug) && /z\.vorhand !== s \|\| !BSK_TRUMPF\.has/.test(zug) && /gewinner: sieg \? ich\.person_id : niederlage \? gegner/.test(zug), "Zugprüfung + Wertung");
  assert.ok(/function bskSpielZeigen\(g\)/.test(html) && /api\("spiel_zug", \{ id: g\.id, zug, zuege: g\.zuege \}\)/.test(html) && /\["bsk", "🃏 Bauernskat"\](, \[[^\]]*\])*\], "spHerausArt"/.test(html), "App: Ansicht + Herausfordern");
  // ganze Partien mit der Server-Kopie: 120 Augen, nur erlaubte Karten
  const E = await import(new URL("../supabase/functions/kc-club/bauernskat.js", import.meta.url));
  for (let n = 0; n < 30; n++) { const z = E.bskNeu(0); z.trumpf = ["kr", "pi", "he", "ka", "grand"][n % 5]; z.phase = "spiel"; z.amZug = 0; let i = 0;
    while (z.phase !== "ende") { const s = z.amZug, e = E.bskErlaubt(z, s), k = e[n % e.length]; if (E.bskSpielen(z, s, k)) E.bskStichAbschliessen(z); assert.ok(++i < 40); }
    const r = E.bskErgebnis(z); assert.equal(r.augen[0] + r.augen[1], 120); }
}
// 305. 2.11.0: Spiele als Kacheln (KC-CLUB-SPIELE-KACHELN) + Schach-Küchenbrigade (KC-CLUB-SCHACH-BRIGADE)
{
  assert.ok(/let SP = \{ tab: "pc", art: null,/.test(html) && /function spKachelnZeigen\(\)/.test(html) && /onclick="spArtWahl\('\$\{a\}'\)"/.test(html), "Übersicht mit Kacheln");
  assert.ok(/onclick="spZurueck\(\)"/.test(html) && /else if \(SP\.art\) \{ SP\.art = null; spZeigen\(\); \}/.test(html), "‹ führt zur Übersicht");
  assert.ok(/SP\.offen = \(await api\("spiel_holen", \{ id \}, \{ warten: true \}\)\)\.spiel; SP\.art = SP\.offen\.spiel;/.test(html), "Push öffnet das richtige Spiel");
  assert.ok(/SCH_BRIGADE_NAME = \{ k: "Küchenchef", q: "Kaltmamsell", r: "Souschef", b: "Patissier", n: "Springer", p: "Praktikant" \}/.test(html) && /function schStilWechseln\(\)/.test(html) && /\$\{schStilHtml\(\)\}/.test(html), "Küchenbrigade umschaltbar");
  assert.ok(!/SCH_FIG\[f\.type\]/.test(html), "Brett zeichnet über schFigHtml");
}
// 306. 2.12.0: Spiel-Einladung beim Start (KC-CLUB-SPIEL-EINLADUNG)
{
  assert.ok(/spiel_einladung: \(w\) => \(\{ an: w\?\.an !== false \}\)/.test(server), "Einstellung am Konto, Standard an");
  assert.ok(/function spEinladung\(versuch = 0\)/.test(html) && /localStorage\.getItem\(SPE_TAG\) === heuteIso\(\)/.test(html) && /classList\.contains\("im-notbetrieb"\)/.test(html), "einmal am Tag, nie im Notbetrieb");
  for (const k of ["'ja'", "'spaeter'", "'nein'", "'aus'"]) assert.ok(html.includes(`spEinlAntwort(${k})`), "Knopf " + k);
  assert.ok(/if \(!h \|\| h === "#"\) setTimeout\(\(\) => spEinladung\(\), 4000\)/.test(html) && /id="setSpielEinl"/.test(html), "beim Start + Schalter in Einstellungen");
}
// 307. 2.13.0: Pinnwand-Zettel nachträglich wichtig (KC-CLUB-PINNWAND-WICHTIG-NACHTRAEGLICH)
{
  const pw = server.slice(server.indexOf('case "pinnwand_wichtig": {'), server.indexOf('case "pinnwand_abnehmen": {'));
  assert.ok(/if \(z\.person_id !== ich\.person_id\) throw/.test(pw), "nur der Verfasser");
  assert.ok(/if \(wichtig && !z\.wichtig && p\.bescheid && z\.fuer !== "ich"\)/.test(pw) && /!fertig\.has\(id\)/.test(pw) && /senden\("club_pinnwand"/.test(pw), "Bescheid nur auf Wunsch, nur an noch nicht Erledigte");
  assert.ok(/if \(z\.vonMir\) knoepfe\.push\(`<button onclick="pwWichtig\(/.test(html) && /api\("pinnwand_wichtig", \{ id, wichtig: an, bescheid \}/.test(html), "App: Knopf");
}
// 308. 2.14.0: Küchenterror – Küchenquiz auf Zeit (KC-CLUB-KUECHENTERROR)
{
  const quelle = lies("lib/kuechenterror/fragen.js");
  assert.equal(lies("supabase/functions/kc-club/kt-fragen.js"), quelle, "Server-Kopie der Fragen weicht ab – node tools/kuechenterror/server-kopie.mjs");
  const { KT_FRAGEN } = await import(new URL("../lib/kuechenterror/fragen.js", import.meta.url));
  assert.ok(KT_FRAGEN.length >= 100, "mindestens 100 Fragen");
  assert.equal(new Set(KT_FRAGEN.map((q) => q.id)).size, KT_FRAGEN.length, "ids eindeutig");
  for (const q of KT_FRAGEN) assert.ok(/^k\d{3}$/.test(q.id) && q.f && q.r && q.e && q.x.length === 3 && new Set([q.r, ...q.x]).size === 4, "Frage unvollständig: " + q.id);
  assert.ok(/const KT_MS = 10000, KT_GNADE_MS = 800;/.test(server) && /\[\[0, \[0, 1, 2\]\], \[1, \[0, 1, 2, 3, 4, 5\]\], \[0, \[3, 4, 5, 6, 7, 8\]\], \[1, \[6, 7, 8, 9, 10, 11\]\], \[0, \[9, 10, 11\]\]\]/.test(server), "10 s, Runden abwechselnd");
  const kz = server.slice(server.indexOf("async function ktZug("), server.indexOf("// ---------- Hauptprogramm ----------"));
  assert.ok(/p = \(ok \? 100 \+ Math\.round\(100 \* \(1 - zeit \/ LIM\)\) : 0\) \* \(f\?\.m \? 2 : 1\)/.test(kz) && /seit: Date\.now\(\)/.test(kz) && /if \(!q\.offen\) \{/.test(kz), "Server misst Zeit, Neuladen setzt sie nicht zurück");
  assert.ok(/a: q\.offen\.perm\.map\(\(k: number\) => alle\[k\]\)/.test(kz) && !/frage = \{[^}]*richtig/.test(kz), "Frage ohne Lösung");
  assert.ok(/quiz: g\.spiel === "kt" \? ktSicht\(g\.quiz,/.test(server) && /if \(g\.spiel === "kt"\) return await ktZug\(g, ich, p\.zug \?\? \{\}\);/.test(server), "nur Sicht verlässt den Server");
  assert.ok(/function ktPcZeigen\(\)/.test(html) && /function ktSpielZeigen\(g\)/.test(html) && /\["kt", "🔪", "Küchenterror"/.test(html) && /KTM\.frage \|\| KTM\.aufl\) return;/.test(html), "App: Kachel, Computer, Mitglieder, kein Neuzeichnen mitten in der Frage");
}
// 309. 2.15.0: Meisterfrage (doppelt) + wichtige Hilfe-Aufrufe (KC-CLUB-KUECHENTERROR-MEISTER, KC-CLUB-HILFE-WICHTIG)
{
  const { KT_FRAGEN } = await import(new URL("../lib/kuechenterror/fragen.js", import.meta.url));
  assert.ok(KT_FRAGEN.filter((q) => q.m).length >= 30, "mindestens 30 Meisterfragen");
  assert.ok(/filter\(\(q\) => !q\.m\)[^\n]*slice\(0, 11\), ktMischen\(\(KT_FRAGEN as any\[\]\)\.filter\(\(q\) => q\.m\)/.test(server), "Server: 11 normale + 1 Meisterfrage");
  assert.ok(/\* \(f\?\.m \? 2 : 1\); \/\/ Meisterfrage doppelt/.test(server) && /mal = f\?\.m \? 2 : 1/.test(html), "doppelte Punkte (Server + Computer-Spiel)");
  const hw = server.slice(server.indexOf('case "hilfe_wichtig": {'), server.indexOf('case "hilfe_antwort": {'));
  assert.ok(/if \(h\.von !== ich\.person_id && !ich\.vorstand\) throw/.test(hw) && /if \(wichtig && !h\.wichtig && p\.bescheid\)/.test(hw) && /!schon\.has\(id\)/.test(hw), "Hilfe wichtig: nur Ersteller/Clubleitung, Bescheid nur auf Wunsch an Unbeantwortete");
  assert.ok(/wichtig: !!x\.wichtig/.test(server) && /onclick="hilfeWichtig\(/.test(html) && /\.zettel\.aushang\.wichtig \{/.test(html), "Aushang zeigt und schaltet wichtig");
}
// 310. 2.16.0: Küchenterror-Zeitstufen + Chat vorlesen mit zwei Stimmen (KC-CLUB-KUECHENTERROR-ZEIT, KC-CLUB-CHAT-VORLESEN)
{
  assert.ok(/const KT_STUFEN: Record<string, number> = \{ leicht: 20000, mittel: 15000, schwer: KT_MS \};/.test(server) && /const LIM = ktLimit\(q\)/.test(server), "Server: Zeit je Stufe");
  assert.ok(/spielStart\(art, groesse, \{ stufe: p\.stufe \}\)/.test(server) && /stufe: p\.stufe \?\? g\.quiz\?\.stufe/.test(server), "Stufe beim Herausfordern und bei der Revanche");
  assert.ok(/const KT_ZEIT = \{ leicht: 20000, mittel: 15000, schwer: KT_MS \};/.test(html) && /"spHerausStufe"/.test(html), "App: Stufe wählbar");
  assert.ok(/vonId: m\.sender_person_id/.test(server) && /vorlesestimme: \(w\) => \(\{ art: w\?\.art === "m" \|\| w\?\.art === "w" \? w\.art : null \}\)/.test(server) && /case "vorlese_stimmen": \{/.test(server), "Server: Sender-ID + eigene Stimme");
  for (const k of ["chatVorlesenStart('neu')", "chatVorlesenStart('alles')", "chatVorlesenStart('${id}')", 'id="setStimmeM"', 'id="setStimmeW"', 'id="setMeineStimme"']) assert.ok(html.includes(k), "fehlt: " + k);
  assert.ok(/if \(v !== "chat" && CV\.an\) chatVorlesenStopp\(true\);/.test(html) && /const stimmeGuete = /.test(html), "Stopp beim Verlassen, Güte sichtbar");
}
// 311. 2.17.0: Zeit-Wächter statt Animation + 3-2-1 Lesezeit (KC-CLUB-KUECHENTERROR-WAECHTER)
{
  assert.ok(/function ktUhrStart\(lesenMs, restMs, lim, beiEnde\)/.test(html) && /KTU\.t = setInterval\(tick, 100\)/.test(html) && /const rest = Math\.max\(0, KTU\.ende - now\)/.test(html), "Wächter rechnet mit fester Endzeit");
  assert.ok(!/animation-name: ktZeit/.test(html) && !/@keyframes ktZeit/.test(html), "keine Balken-Animation mehr");
  assert.ok(/const KT_LESEN_MS = 3000;/.test(html) && /if \(!vonUhr && Date\.now\(\) < \(z\.lesenBis \|\| z\.seit\)\) return;/.test(html) && /if \(wahl >= 0 && ktLiest\(\)\) return;/.test(html), "App: Lesezeit, kein Antippen davor");
  assert.ok(/const KT_LESEN_MS = 3000;/.test(server) && /seit: Date\.now\(\) \+ KT_LESEN_MS/.test(server) && /lesenMs: Math\.max\(0, q\.offen\.seit - Date\.now\(\)\)/.test(server), "Server: Uhr startet nach der Lesezeit");
}
// 312. 2.17.1: Antworten frei antippbar (KC-CLUB-KUECHENTERROR-FREI)
{
  assert.ok(/body\.kt-aktiv \.su-klein, body\.kt-aktiv #fuss \{ display: none; \}/.test(html) && /function ktBildFrei\(an, schluessel\)/.test(html), "Fußleiste/Lupe während der Frage weg");
  assert.ok(/document\.body\.classList\.remove\("kt-aktiv"\); \/\* 2\.17\.1/.test(html) && /function spZeigen\(\) \{\n  document\.body\.classList\.remove\("kt-aktiv"\);/.test(html), "danach wieder da");
}
// 313. 2.17.2: Tipp zählt beim Aufsetzen (KC-CLUB-KUECHENTERROR-TIPP)
{
  assert.ok(/onpointerdown="ktTipp\(this, \$\{i\}, '\$\{klick\}'\)" onclick="ktTipp\(this, \$\{i\}, '\$\{klick\}'\)"/.test(html) && /function ktTipp\(btn, i, fn\)/.test(html), "pointerdown + Klick über ktTipp");
  assert.ok(/document\.querySelector\("\.kt-antwort\.getippt"\)\) return;/.test(html) && /touch-action: manipulation/.test(html), "genau einmal, ohne Verzögerung");
}
// 314. 2.17.3: App startet auch auf älteren Browsern (KC-CLUB-ALTGERAETE) – Fund: „App startet nicht bei einem Mitglied“,
// Protokoll: „SyntaxError: Unexpected token '='“ (||=) → ganze App lief nicht an. Im App-Code nur Sprachstand ES2020 (?. und ?? ja),
// keine logischen Zuweisungen (||= ??= &&=), kein .at(), kein structuredClone.
{
  const skripte = [...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n") + lies("dp2-club/lader.js") + lies("sw.js");
  for (const [re, was] of [[/\|\|=|\?\?=|&&=/, "logische Zuweisung (||= ??= &&=)"], [/\.at\(-?\d/, ".at()"], [/structuredClone\(/, "structuredClone"], [/[^\w"'.]\d+_\d{3}\b/, "Zahl mit _"]])
    assert.ok(!re.test(skripte), `Zu neue Schreibweise im App-Code: ${was} – ältere Handys starten dann gar nicht`);
}
// 315. 2.18.0: Pause / Weiter in jedem Spiel (KC-CLUB-SPIELE-PAUSE)
{
  assert.ok(/id="spPause"/.test(html) && /function spPausieren\(\)/.test(html) && /function spWeiter\(\)/.test(html) && /#v-spiele\.pausiert #spInhalt \{ filter: blur/.test(html), "Leiste + verschwommen");
  for (const f of ["spPcComputer", "schPcComputerStart", "bskPcComputer"]) assert.ok(html.includes(`spPauseHalt(${f})`), "Computer wartet in der Pause: " + f);
  assert.ok(/function ktPcPausieren\(\)/.test(html) && /z\.seit = z\.lesenBis - z\.pausiert\.verbraucht/.test(html) && /if \(SP\.pause\) return ktUhrStopp\(\);/.test(html), "Quiz-Uhr hält an, Restzeit bleibt");
  assert.ok(/if \(!KTM\.pause && g\?\.ichDran/.test(html), "gegen Mitglieder: Pause nach der Frage");
}
// 316. 2.18.1: Küchenterror gegen den Computer – jede Frage antippbar, Computer rät gleichzeitig (KC-CLUB-KUECHENTERROR-GLEICHZEITIG)
{
  const pc = html.slice(html.indexOf("async function ktPcZeigen()"), html.indexOf("const ktPcStaerke = (w) =>"));
  assert.ok(!/z\.i % 2/.test(pc), "keine Fragen mehr nur für den Computer");
  assert.ok(/klick: z\.phase === "frage" \? "ktPcAntwort" : ""/.test(pc) && /function ktPcNeueFrage\(z\)/.test(pc) && /z\.punkte\[0\] \+= p; z\.punkte\[1\] \+= pcP;/.test(pc), "du antwortest immer, Computer zählt mit");
}
// 317. 2.18.2: keine Variable verdeckt eine zentrale Hilfsfunktion (KC-CLUB-LEIHEN-STORNO) – Fund: „const frage = …; await frage(frage)“
{
  const m = html.match(/\b(const|let|var) (frage|melde|api|zeige|meldeFehler|blattAuf|sprechen) = (?![^;\n]*=>)(?!\s*(async\s+)?function)/g);
  assert.ok(!m, "Variable verdeckt Hilfsfunktion: " + (m || []).join(", "));
  assert.ok(/if \(!\(await frage\(text\)\)\) return;/.test(html.slice(html.indexOf("async function leihStatus("), html.indexOf("async function leihStatus(") + 400)), "Storno fragt mit text");
}
// 318. 2.18.3: Diktat ohne Wiederholungen (KC-CLUB-DIKTAT-DOPPELT) – Zusammenführen mit der echten Funktion prüfen
{
  const a = html.indexOf("const dtNorm = "), b = html.indexOf("\n}", html.indexOf("function diktatMerge(")) + 2;
  const { diktatMerge } = new Function(html.slice(a, b) + "; return { diktatMerge };")();
  const kum = ["kannst du", "kannst du deinen Text", "kannst du deinen Text einsprechen", "kannst du deinen Text einsprechen der dann aber trotzdem"].reduce((l, t) => diktatMerge(l, t, true), []);
  assert.equal(kum.join(" "), "kannst du deinen Text einsprechen der dann aber trotzdem", "kumulative Android-Stücke nicht doppelt");
  assert.equal(["hallo zusammen", "wer kommt morgen"].reduce((l, t) => diktatMerge(l, t, true), []).join(" "), "hallo zusammen wer kommt morgen", "normale Stücke");
  assert.equal(["ja", "ja"].reduce((l, t) => diktatMerge(l, t), []).join(" "), "ja ja", "kurze Wiederholung zwischen Runden bleibt");
  const st = ["Hi", "hi", "hi Steven", "hi Steven das ist seine neue", "hi Steven das ist eine neue Funktion"].reduce((l, t) => diktatMerge(l, t, true), []);
  assert.equal(st.join(" "), "hi Steven das ist eine neue Funktion", "gleiche Runde: Wiederholung und Nachbesserung zusammengeführt");
  assert.ok(/e\.continuous = !DIKTAT_ANDROID;/.test(html) && /for \(let i = 0; i < ev\.results\.length; i\+\+\)/.test(html), "Android Satz für Satz, Runde neu zusammensetzen");
}
// 319. 2.19.0: „Was ist los?“ + Server-Diagnose (KC-CLUB-NOTBETRIEB-INFO, KC-CLUB-SERVER-DIAGNOSE)
{
  assert.ok(/<button onclick="notInfo\(\)">ℹ️ Was ist los\?<\/button>/.test(html) && /function notInfo\(\)/.test(html) && /nicht an deinem Handy/.test(html), "Info-Knopf für Mitglieder");
  const d = html.slice(html.indexOf("async function serverDiagnose()"), html.indexOf("async function diagKopieren()"));
  for (const k of ["netz", "server", "db", "not", "anbieter"]) assert.ok(d.includes(`erg.${k} =`), "Diagnose-Schritt fehlt: " + k);
  assert.ok(/setze\("db", "⚪"/.test(d) && /setze\("anbieter", "⚪"/.test(d) && !/fetch\([^)]*method: "(PUT|DELETE)"/.test(d), "nicht Geprüftes ⚪, nur lesend");
  assert.ok(/onclick="serverDiagnose\(\)">🩺 Server-Diagnose/.test(html), "Admin-Knopf in den Einstellungen");
}
// 320. Spiegel-Wächter von außen (KC-CORE-SPIEGEL-EXTERN): GitHub stößt nur bei überfälligem Spiegel an
{
  const wf = lies(".github/workflows/spiegel-waechter.yml");
  assert.ok(/schedule:\s*\n\s*- cron: "41 \* \* \* \*"/.test(wf) && /"aktion":"extern_pruefen"/.test(wf), "stündlicher Zeitplan ruft extern_pruefen");
  assert.ok(!/secrets\./.test(wf) && /permissions: \{\}/.test(wf), "Wächter braucht keine Secrets und keine Rechte");
  const w = lies("supabase/functions/kc-db-mirror-worker/index.ts");
  const ext = w.slice(w.indexOf('if(body?.aktion==="extern_pruefen")'), w.indexOf("mirror worker authentication failed"));
  assert.ok(ext.length > 100 && ext.includes('sb.rpc("kc_db_mirror_extern_plan")') && ext.includes('plan.status!=="angestossen"'), "Arbeiter handelt nur nach Datenbank-Plan");
  assert.ok(!/JSON\.stringify\(\{[^}]*expectedToken/.test(ext) && ext.includes("EdgeRuntime.waitUntil"), "Schlüssel nie in der Antwort, Pakete im Hintergrund");
  const sql = lies("supabase/migrations/20261004_kc_core_spiegel_extern.sql");
  assert.ok(/interval '390 minutes'/.test(sql) && /interval '60 minutes'/.test(sql) && /pg_advisory_xact_lock/.test(sql) && /maintenance_until/.test(sql), "Fenster, Sperre, Wartung");
  assert.ok(/v_pakete := public\.kc_db_mirror_pakete_vorbereiten\(\);[\s\S]*kc_db_mirror_dispatch/.test(sql.slice(sql.indexOf("function public.kc_neon_low_compute_cycle()"))), "Cron-Lauf nutzt dieselbe Paketbildung (kein Parallel-Kern)");
  for (const f of ["kc_db_mirror_pakete_vorbereiten", "kc_db_mirror_extern_plan"]) assert.ok(new RegExp(`revoke all on function public\\.${f}\\(\\) from public, anon, authenticated;[\\s\\S]*grant execute on function public\\.${f}\\(\\) to service_role;`).test(sql), "nur service_role: " + f);
}
// 321. 2.20.0: Register „Admin“ (KC-CLUB-ADMIN-REGISTER) – nur für Admins, Lämpchen nie grün ohne Messung, keine Schlüssel in der App
{
  assert.ok(/REGISTER_ALLE\.filter\(\(r\) => r\[0\] !== "admin" \|\| !!ICH\?\.admin\)/.test(html), "Register Admin nur für Admins");
  assert.ok(/KACHELN\.admin = AD_KACHELN\.map\([^\n]*nur: \(\) => !!ICH\?\.admin/.test(html), "jede Admin-Kachel nur für Admins (auch in Suche/Schnellstart)");
  const ad = html.slice(html.indexOf("// ---------- KC-CLUB-ADMIN-REGISTER (2.20.0"), html.indexOf("// Feld 4 (0.43.0): Demnächst"));
  assert.ok(ad.length > 5000 && /const gemessen = \(z\) => \(!r \? \["grau"[^\n]*: alt \? \["grau", "⚠️ veraltet · "/.test(ad), "unbekannt/veraltet = grau, nie grün");
  for (const k of ["lage", "notfall", "server", "supabase", "neon", "backup", "b2", "not", "comm", "mail", "push", "kasse", "programme", "versionen", "fehler", "nutzung", "zugang", "wartung", "inkognito"])
    assert.ok(ad.includes(`["${k}", `), "Kachel fehlt: " + k);
  for (const d of ["supabase", "neon", "cloudflare", "github", "b2", "brevo", "kicc"]) assert.ok(new RegExp(`\\n  ${d}: \\{ sym:`).test(ad), "Direktsprung fehlt: " + d);
  assert.ok(!/(sb_secret_|service_role|SUPABASE_ACCESS_TOKEN|apikey|Bearer )/i.test(ad), "keine Schlüssel im Admin-Register");
  assert.ok(/rel="noopener"/.test(ad) && /async function adNeustart\(\) \{\s*const z = adZustand\("supabase"\);\s*if \(!\(await frage\(/.test(ad), "Neustart nur nach Rückfrage, Verwaltung in neuem Fenster");
  assert.ok(/case "admin_eingriff": \{\s*nurAdmin\(ich\);[\s\S]{0,200}\["neustart_geoeffnet"[^\]]*\]\.includes\(art\)[\s\S]{0,200}protokoll\(ich\.person_id, "admin_eingriff"/.test(server), "Eingriff nur Admin, feste Arten, protokolliert");
  assert.ok(/b2: b2 \?\? null/.test(server) && /from\("kc_backup_machine_telemetry"\)\.select\(/.test(server), "B2-Stand nur lesend in admin_lage");
  assert.ok(/#raster\.ad-raster \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(html) && /\.register\.vier \{ grid-template-columns: repeat\(4/.test(html), "3 Kacheln je Reihe, 4 Register in einer Reihe");
}
// 322. 2.21.0: Notfall-Meldung an alle (KC-CLUB-NOTFALL-MELDUNG) – nur Admin, Push + Mail, auch stumm/Ruhezeit, Marke nicht fälschbar
{
  const ns = server.slice(server.indexOf('case "nachricht_senden": {'), server.indexOf('case "privattermin_speichern"'));
  assert.ok(/if \(notfall\) \{\s*if \(!ich\.admin && !\(await sosFuerAlle\(\)\)\) throw new Fehler\("Notfall-Meldungen an alle darf nur der Admin senden\.", 403\);/.test(ns), "nur Admin");
  assert.ok(/\} else if \(NOTFALL_RE\.test\(text\)\) text = text\.replace\(NOTFALL_RE, ""\)/.test(ns), "Marke bei anderen entfernt");
  assert.ok(/if \(notfall\) stumm\.clear\(\);/.test(ns) && /const wege = notfall \? \["push", "email"\]/.test(ns) && /\{ notfall \}\);/.test(ns), "an alle, Push + Mail, auch stumm");
  assert.ok(/if \(w\.includes\("push"\) && !opt\.notfall\)/.test(server), "auch in der Ruhezeit");
  assert.ok(/async function notfallUnterhaltung\(ich: Ich\)/.test(server) && /return json\(\{ alarm, /.test(server), "eine Notfall-Unterhaltung, Alarm beim Start");
  assert.ok(/function notfallSenden\(\)[\s\S]{0,400}await frage\(/.test(html) && /api\("nachricht_senden", \{ notfall: true, text, empfaenger: \{ alle: true \} \}/.test(html), "einmal bestätigen, dann senden");
  assert.ok(/\.blase\.notfall \{ border: 4px solid #d50000/.test(html) && /istNotfall\(m\) \? " notfall" : ""/.test(html), "roter Rand im Chat");
  assert.ok(/alarmPruefen\(\); \/\* KC-CLUB-NOTFALL-MELDUNG \*\//.test(html) && /localStorage\.setItem\("kc_club_alarm_gesehen", a\.id\)/.test(html), "Alarm-Fenster einmal je Meldung");
  assert.ok(/\["alarm", "🚨", "Alarm an alle", "not"\]/.test(html) && /sosDarf\(\) \? `<button class="knopf alarm-knopf"[^`]*onclick="notfallMeldung\(\)"/.test(html), "Knopf im Admin-Register und auf der SOS-Seite (Admin bzw. bei Freigabe alle)");
}
// 323. 2.22.0: SOS im Nachrichten-Kopf (KC-CLUB-NOTFALL-KANAELE) – nur Admin, einsprechen, danach WhatsApp/SMS mit einem Tipp
{
  assert.ok(/<h2>💬 Nachrichten<\/h2><button class="knopf klein alarm-knopf" id="naSosKnopf" onclick="notfallMeldung\(\)"/.test(html) && /body:not\(\.ist-admin\):not\(\.sos-frei\) #naSosKnopf \{ display: none; \}/.test(html), "SOS neben ＋ Neu, nur Admin");
  assert.ok(/diktatStart\(\\'notfallText\\', notfallSenden\)/.test(html) && /function diktatStart\(ziel, nachSenden(, opt = \{\})?\)/.test(html) && /if \(was === "senden" && DT\.nachSenden\)[^\n]*return DT\.nachSenden\(\); \}/.test(html), "Einsprechen über das vorhandene Diktat");
  assert.ok(/href="https:\/\/wa\.me\/\?text=\$\{t\}"/.test(html) && /href="sms:\?&body=\$\{t\}"/.test(html), "WhatsApp und SMS mit fertigem Text");
  assert.ok(/"notfall_whatsapp", "notfall_sms"/.test(server), "Weitergabe wird protokolliert");
  assert.ok(/#alarmBlatt\.blatt \{ z-index: 9990; \}/.test(html), "nur das Empfänger-Alarmfenster liegt über allem (Rückfragen/Diktat bleiben bedienbar)");
}
// 324. 2.22.1: SOS-Probe nur an mich (KC-CLUB-NOTFALL-PROBE)
{
  assert.ok(/probe = notfall && !!p\.probe;[^\n]*\n\s*if \(probe\) \{ p\.empfaenger = \{ personen: \[ich\.person_id\] \}; p\.betreff = "🧪 SOS-Probe"; p\.id = ""; \}/.test(server), "Probe geht nur an mich");
  assert.ok(/let threadId = notfall && !probe \? await notfallUnterhaltung\(ich\)/.test(server) && /probe \? "notfall_probe"/.test(server), "Probe nicht in die Notfall-Unterhaltung, eigenes Protokoll");
  assert.ok(/onclick="notfallProbe\(\)">🧪 Probe nur an mich/.test(html) && /api\("nachricht_senden", \{ notfall: true, probe: true, text \}/.test(html), "Knopf im SOS-Fenster");
}
// 325. 2.22.2: SOS-Fenster – Senden oben, Standort anhängen, Notrufe (KC-CLUB-NOTFALL-ORT-RUF)
{
  const nf = html.slice(html.indexOf("function notfallMeldung() {"), html.indexOf("async function notfallStandort("));
  assert.ok(nf.indexOf('id="notfallText"') < nf.indexOf("JETZT AN ALLE SENDEN") && nf.indexOf("JETZT AN ALLE SENDEN") < nf.indexOf("Notruf direkt anrufen"), "Senden direkt unter dem Textfeld");
  assert.ok(/onclick="sosAnrufen\('\$\{x\.nr\}'\)"/.test(nf) && /ruf\("112"\)\}\$\{ruf\("110"\)/.test(nf), "112/110 über die vorhandene Rückfrage");
  assert.ok(/async function notfallStandort\(knopf\)[\s\S]{0,400}stPositionWarten\(\)[\s\S]{0,400}api\("sos_ort"/.test(html), "Standort wie „Wo bin ich?“");
}
// 326. 2.22.3: SOS-Textfeld lesbar in Tag- und Nachtmodus (Fund Hansi)
assert.ok(/#notfallText \{[^}]*background: var\(--bg\); color: var\(--text\);/.test(html) && /#notfallText::placeholder \{ color: var\(--grau\)/.test(html), "SOS-Textfeld: Farben aus dem Design (Kontrast)");
// 327. 2.22.4: Notfall-Meldung sofort vorlesen (KC-CLUB-NOTFALL-VORLESEN)
{
  assert.ok(/onclick="alarmGelesen\(false\)">✅ Gelesen<\/button><\/div>`\)\.classList\.add\("alarm-blatt"\);\s*alarmVorlesen\(a, true\);/.test(html), "Alarm-Fenster liest sofort vor");
  assert.ok(/function alarmVorlesen\(a, automatisch\)[\s\S]{0,300}sprechAusgabe\(alarmSprechText\(a\)\)/.test(html) && /document\.addEventListener\("pointerdown", nachTipp, true\)/.test(html), "vorhandene Stimme, sonst beim ersten Antippen");
  assert.ok(/function alarmGelesen\(oeffnen\) \{\s*try \{ speechSynthesis\.cancel\(\); \} catch \{\}/.test(html), "Gelesen beendet das Vorlesen");
  const f = new Function(html.slice(html.indexOf("function alarmSprechText(a) {"), html.indexOf("function alarmVorlesen(")) + "; return alarmSprechText;")();
  assert.equal(f({ von: "Hansi", text: "Unfall!\n\n📍 Mein Standort (07:00 Uhr): Bahnhofstraße 1, 59368 Werne – 51.66380, 7.63360 – Karte: https://www.openstreetmap.org/?mlat=51" }), "Achtung, Notfall-Meldung von Hansi. Unfall! Mein Standort (07:00 Uhr): Bahnhofstraße 1, 59368 Werne", "Link und Koordinaten werden nicht vorgelesen");
}
// 328. 2.22.5: SOS für alle freigeben (KC-CLUB-SOS-FREIGABE) – nur der Admin schaltet, gespeichert als Club-Einstellung
{
  assert.ok(/case "sos_freigabe_setzen": \{\s*nurAdmin\(ich\);[\s\S]{0,300}schluessel: "sos", wert: \{ alle \}/.test(server) && /protokoll\(ich\.person_id, "sos_freigabe"/.test(server), "Freigabe nur Admin, protokolliert");
  assert.ok(/sosFuerAlle: await sosFuerAlle\(\)/.test(server) && /classList\.toggle\("sos-frei", !!INIT\?\.sosFuerAlle\)/.test(html), "App kennt die Freigabe");
  assert.ok(/\$\{ICH\?\.admin \? `<label[^`]*onchange="sosFreigabe\(this\.checked, this\)"/.test(html) && /async function sosFreigabe\(alle, feld\)[\s\S]{0,600}await frage\(/.test(html), "Schalter nur beim Admin, mit Rückfrage");
}
// 329. 2.22.6: Ameisenrahmen um die Gruppe „Innovation“ beim Öffnen von Nachrichten (KC-CLUB-GRUPPE-AMEISEN)
assert.ok(/const UH_HERVOR = \["Innovation"\];/.test(html) && /function uhAmeisen\(\)[\s\S]{0,900}setTimeout\(\(\) => \{ el\.classList\.remove\("uh-ameisen"\)/.test(html) && /\.unterh \.uh-rahmen rect \{[^}]*animation: ameisenLauf/.test(html), "kurzer Ameisenrahmen, danach ruhig");
// 330. 2.22.6: Herausforderung live + sofort nur online, sonst Person suchen → Terminanfrage (KC-CLUB-SPIEL-LIVE)
{
  assert.ok(/spielAnfragen: \(spAn \?\? \[\]\)\.map/.test(server) && /from\("kc_club_spiele"\)\.select\("id,von,spiel,groesse,uhr,erstellt_am"\)\.eq\("an", ich\.person_id\)\.eq\("status", "angefragt"\)/.test(server), "online liefert frische Herausforderungen an mich");
  assert.ok(/spielLive\(r\.spielAnfragen\); \/\/ KC-CLUB-SPIEL-LIVE/.test(html) && /ONL\.erledigt\.add\("s" \+ a\.id\)/.test(html), "Fenster je Anfrage einmal");
  assert.ok(/const on = b\.filter\(\(m\) => ONL\?\.ids\?\.has\(m\.person_id\)\)/.test(html) && /spHerausTermin\('\$\{m\.person_id\}'\)">📅 Terminanfrage/.test(html) && /spTerminBlatt\(r\.spiel\.id\)/.test(html), "sofort nur online, sonst suchen + Termin");
}
// 331. 2.22.6: Termine der Stadt Werne in den Clubkalender übernehmen (KC-CLUB-STADT-TERMINE)
{
  assert.ok(/basis: "https:\/\/www\.werne\.de\/de\/veranstaltungen\/kalender-abonnement\/"/.test(server) && /auslassen: \[\/wochenmarkt\/i\]/.test(server), "Quellen-Register der Stadt / Wochenmarkt-Ausschluss fehlt");
  for (const a of ["stadt_termine", "stadt_termine_uebernehmen", "stadt_termine_einstellen"])
    assert.ok(new RegExp(`case "${a}": \\{\\s*nurAdmin\\(ich\\);`).test(server), `${a}: nur Admin`);
  // still übernehmen: Veranstaltung, kein senden(), Doppelschutz über „uebernommen“
  const ueb = server.slice(server.indexOf("async function stadtUebernehmen"), server.indexOf("async function stadtAutoLauf"));
  assert.ok(/art: "veranstaltung"/.test(ueb) && !/senden\(/.test(ueb) && /filter\(\(t\) => !k\.uebernommen\[t\.key\]\)/.test(ueb), "Stadt-Termine: still, als Veranstaltung, ohne Doppelte");
  assert.ok(/await stadtAutoLauf\(\)\.catch/.test(server) && /if \(!k\.auto \|\| \(k\.autoZuletzt && Date\.now\(\) - new Date\(k\.autoZuletzt\)\.getTime\(\) < 7 \* 86400000\)\) return null;/.test(server), "Wochenlauf nur wenn eingeschaltet");
  assert.ok(/if \(!r\.ok \|\| \(text\.trim\(\) && !text\.includes\("BEGIN:VCALENDAR"\)\)\)/.test(server), "leerer Stadt-Kalender ist kein Fehler");
  assert.ok(/\["stadt", "🏙️", "Stadt-Termine", "app"\]/.test(html) && /if \(id === "stadt"\) return stadtTermine\(\);/.test(html) && /api\("stadt_termine_uebernehmen", \{ keys \}\)/.test(html), "Admin-Kachel Stadt-Termine");
}
// 332. 2.22.7: Meine Daten haben sich geändert (KC-CLUB-AENDERUNG)
{
  const mig = lies("supabase/migrations/20261004_kc_club_v2227_aenderungen.sql");
  assert.ok(/create table if not exists kc_club_aenderungen/.test(mig) && /enable row level security/.test(mig) && /revoke all on table kc_club_aenderungen from anon, authenticated/.test(mig), "Tabelle nur für den Server");
  for (const art of ["anschrift", "name", "handy", "festnetz", "mail", "bank", "geburtstag", "notfall", "kleidung", "mitgliedschaft", "sonstiges"])
    assert.ok(new RegExp(`\\{ id: "${art}", sym:`).test(server) && mig.includes(`'${art}'`), `Art ${art} fehlt (Server oder Datenbank)`);
  assert.ok(!/allergie/i.test(server.slice(server.indexOf("const AENDERUNG = {"), server.indexOf("proTag:"))), "keine Allergien (Wunsch Hansi)");
  assert.ok(/\{ k: "kochjacke", t: "Kochjacke"/.test(server) && /\{ k: "kochhose", t: "Kochhose"/.test(server), "Kleidergröße Kochjacke/Kochhose");
  assert.ok(/ibanOk\("DE89370400440532013000"\)|function ibanOk/.test(server) && /r === 1 \?/.test(server), "IBAN-Prüfung");
  // Mail/Push nennen nur die Art, keine Inhalte
  const senden = server.slice(server.indexOf('case "aenderung_senden"'), server.indexOf('case "aenderung_zurueckziehen"'));
  assert.ok(/Die Einzelheiten stehen aus Datenschutzgründen nur in der App/.test(senden) && !/\$\{neu\.iban\}/.test(senden), "keine Inhalte in Mail/Push");
  assert.ok(/const anAlle = !!art\.alle && p\.an_alle === true;/.test(senden), "„allen Bescheid“ nur bei erlaubten Arten");
  // Eingang: nur eigene Empfänger (Admin alles); Bank nach Erledigt gekürzt
  assert.ok(/case "aenderungen_liste": \{\s*if \(!ich\.vorstand && !ich\.admin\)/.test(server) && /if \(!ich\.admin\) q = q\.contains\("empfaenger", \[ich\.person_id\]\);/.test(server), "Eingang nur für Empfänger");
  assert.ok(/const neu = x\.art === "bank" \? aeKurz/.test(server) && /iban: "…" \+ String/.test(server), "IBAN nach Erledigt gekürzt");
  assert.ok(/\{ id: "aenderung", sym: "✏️", t: "Meine Daten geändert\?"/.test(html) && /📬 Änderungsmeldungen\$\{AE\.offen/.test(html) && /h === "#aenderungen"/.test(html), "Kachel, Büro-Ordner, Link");
  assert.ok(/api\("aenderung_senden", \{/.test(html) && /api\("aenderung_freigeben", \{ id \}\)/.test(html), "App ruft die Aktionen"); // 2.23.9: „Erledigt“ ist seit 2.22.19 die Freigabe
}
// 333. 2.22.8: Änderungsmeldungen im Büro-Posteingang + Archiv (Register „Meldungen“)
{
  assert.ok(/async function bueroEingang\(ich\?: Ich\)/.test(server) && /return \{ count: \(data \?\? \[\]\)\.filter\(\(x: any\) => aeWartetAufMich\(ich, x\)\)\.length \};/.test(server) && /return \{ ausleihen, vorschlaege, hilfe, archiv, aufgaben, entwuerfe, aenderungen, erstattungen: ek\.erst, dienstzeiten: ek\.dw \};/.test(server), "Posteingang zählt Änderungsmeldungen");
  assert.ok(/const AE_REGISTER = "Meldungen";/.test(server) && /await vereinsOrdner\(MITGLIEDER_ORDNER, jahr, AE_REGISTER\)/.test(server) && /await persoenlicherOrdner\(x\.person_id, wer, jahr, AE_REGISTER\)/.test(server), "Ablage Admin-Ordner + persönlicher Ordner, Register Meldungen");
  const abl = server.slice(server.indexOf("async function aeDoku"), server.indexOf("const aeKurz ="));
  assert.ok(/const neu = x\.art === "bank" \? aeKurz\(\{ \.\.\.x, status: "erledigt" \}\)/.test(abl) && /const alt = |alt = x\.art === "bank" \? \{\}/.test(abl), "Bank im Archiv gekürzt");
  assert.ok(/await aeAblegen\(ich, voll, "Meldung"\)/.test(server) && /await aeAblegen\(ich, \{ \.\.\.x, status: "erledigt"/.test(server), "Ablage beim Melden und Erledigen");
  assert.ok(/\["✏️", "Änderungsmeldungen", e\.aenderungen \|\| 0, "aeEingang\(\)"\]/.test(html) && /gruppe: "Änderungsmeldung – bitte ansehen"/.test(html), "Büro-Posteingang zeigt Meldungen");
}
// 334. 2.22.9: fehlende Erklärungsfenster ergänzt (KC-CLUB-EINWEISUNG, auch in Fenstern)
{
  const reg = html.slice(html.indexOf("const EINWEISUNG = ["), html.indexOf("const einwStand ="));
  for (const id of ["erstattung", "feedback", "sos", "programme", "sicherheit", "standort", "b-aenderung", "b-aenderungen", "b-stadt", "b-admin", "b-notfall"])
    assert.ok(reg.includes(`{ id: "${id}",`), `Einweisung ${id} fehlt`);
  assert.ok(/function einwHtml\(v\) \{\s*if \(!einwOffen\(v\)\) return "";/.test(html) && /\$\{VORLESE_KNOPF\}/.test(html.slice(html.indexOf("function einwHtml"))), "Fenster-Einweisung mit Vorlesen");
  for (const id of ["b-aenderung", "b-aenderungen", "b-stadt", "b-admin", "b-notfall"]) assert.ok(html.includes(`einwHtml("${id}")`), `${id} nicht eingebaut`);
  // jede Ansicht mit eigener Seite (außer Unterseiten) hat eine Einweisung
  const ohne = ["chat", "mitglied", "aktion", "protokoll", "dokansicht", "neu", "gruppe", "ueberblick"];
  for (const v of [...html.matchAll(/<section id="v-([a-z_-]+)"/g)].map((m) => m[1]).filter((v) => !ohne.includes(v)))
    assert.ok(reg.includes(`{ id: "${v}",`), `Bereich ${v} hat keine Einweisung`);
}
// 335. 2.22.10: Änderungsmeldungen → Eingangskorb + Büro-Ordner „Mitglieder“; Archiv-Ordner „Mitglieder <Jahr>“ statt „Admin“
{
  assert.ok(/const MITGLIEDER_ORDNER = \{ art: "sonstiges", titel: "Personal", farbe: 3, register: \["Meldungen", "Sonstiges"\] \};/.test(server) && /const adminOrdner = \(jahr: number, register: string\) => vereinsOrdner\(ADMIN_ORDNER, jahr, register\);/.test(server), "Vereinsordner Mitglieder, Admin-Ordner unverändert nutzbar");
  assert.ok(!/id: "aenderungen", sym: "📬", t: "Änderungen", farbe/.test(html), "kein eigener Regal-Ordner mehr");
  assert.ok(/const zahl = \{ fl: flOffen, feste: fest\.length, nachher: nt \? 1 : 0, liste: AE\.offen \};/.test(html) && /ordner: \["📇", "Mitglieder", "buListe\(\)"\]/.test(html), "Zahl am Ordner Mitglieder, Eingangskorb führt dorthin");
}
// 336. 2.22.11: Hilfe-Aufrufe – wer hat ihn gesehen (KC-CLUB-HILFE-GESEHEN)
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22211_hilfe_gesehen.sql");
  assert.ok(/create table if not exists kc_club_hilfe_gesehen/.test(mig) && /primary key \(aufruf_id, person_id\)/.test(mig) && /revoke all on table kc_club_hilfe_gesehen from anon, authenticated/.test(mig), "Tabelle nur für den Server");
  const hl = server.slice(server.indexOf("async function hilfeListe"), server.indexOf("const HILFE_ANGEBOT_SYMBOLE"));
  assert.ok(/x\.von !== ich\.person_id/.test(hl) && /!ich\.nurLesen/.test(hl) && /ignoreDuplicates: true/.test(hl), "eigene zählen nicht, Notfall-Paket schreibt nicht, erste Zeit bleibt");
  assert.ok(/x\.von === ich\.person_id \|\| ich\.vorstand/.test(hl) && /\.\.\.\(lesbar\.includes\(x\.id\) \? hilfeLeser\(/.test(hl), "Leser nur für Verfasser und Clubleitung");
  assert.ok(/function hilfeLeserHtml\(a\)/.test(html) && (html.match(/\$\{hilfeLeserHtml\(a\)\}/g) || []).length === 2, "Anzeige im Aufruf (offen + vorbei)");
}
// 337. 2.22.11: Pinnwand – Verfasser entscheidet über den Antwort-Knopf (KC-CLUB-PINNWAND-ANTWORTKNOPF)
{
  assert.ok(/add column if not exists antworten boolean not null default true/.test(lies("supabase/migrations/20261004_kc_club_v22211_pinnwand_antworten.sql")), "Spalte mit Standard wie bisher");
  assert.ok(/insert\(\{ antworten: p\.antworten !== false,/.test(server) && /fuer: z\.fuer, antworten: z\.antworten !== false,/.test(server) && /zeit: z\.erstellt_am, antworten: z\.antworten !== false \}/.test(server), "Server speichert und liefert die Wahl");
  assert.ok(/if \(!z\.vonMir && z\.antworten !== false\) knoepfe\.push\(`<button class="antw"/.test(html) && /z\.vonId && z\.antworten !== false \? `<div class="zknoepfe">/.test(html), "Knopf nur, wenn erlaubt (Wand + Fenster)");
  assert.ok(/antworten: PW\.form\.antworten !== false,/.test(html) && /id="pwAntw"/.test(html), "Auswahl beim Anheften");
}
// 338. 2.22.12: Zahlen auf weiteren großen Kacheln, nur erweiterte Ansicht (KC-CLUB-KACHEL-ZAHLEN)
{
  assert.ok(/async function kachelZahlen\(ich: Ich, p: any\)/.test(server) && /return \{ termine, helfen, buero, fotos, dienste \};/.test(server) && /const kz = await kachelZahlen\(ich, p\)\.catch\(\(\) => null\);/.test(server), "Server rechnet die Zahlen");
  assert.ok(/catch \(e\) \{ console\.error\("kachel zahl", String\(e\)\); return null; \}/.test(server), "Fehler → null, keine falsche 0");
  assert.ok(/const kzZahl = \(k, plus = 0\) => \(einfach\(\) \|\| INIT\?\.kz\?\.\[k\] == null \? 0 :/.test(html), "nur erweiterte Ansicht, unbekannt → keine Zahl");
  assert.ok(/for \(const k of KACHELN\.verein\) if \(KZ_KACHELN\[k\.id\] && !k\.zahl\) k\.zahl = KZ_KACHELN\[k\.id\];/.test(html) && /termine: .*helfen: .*buero: [\s\S]{0,60}fotos: .*dienste:/.test(html), "fünf Kacheln");
  assert.ok(/kzGesehen\(v\); \/\/ KC-CLUB-KACHEL-ZAHLEN/.test(html) && /api\("init", \{ fotosSeit: kzSeit\("fotos"\), dienstSeit: kzSeit\("dienste"\) \}/.test(html), "zuletzt geöffnet");
}
// 339. 2.22.12: Mikrofon-Freigabe vor dem Diktieren (KC-CLUB-MIKRO-FREIGABE)
{
  assert.ok(/async function diktatStart\(ziel, nachSenden(, opt = \{\})?\) \{[\s\S]{0,400}frei = await mikroFreigabe\(\);[\s\S]{0,120}if \(!frei \|\| DT\.aktiv\) return;/.test(html), "erst Freigabe, dann Diktat");
  const mf = html.slice(html.indexOf("async function mikroFreigabe"), html.indexOf("function mikroHilfe"));
  assert.ok(/if \(zustand === "granted"\) return true;/.test(mf) && /catch \{ return true; \}/.test(mf) && /onerror = \(ev\) => \{ if \(ev\.error === "not-allowed"[\s\S]{0,700}mikroHilfe\((weiter(, \{ sprache: ev\.error \})?)?\)/.test(html) && /await frage\("🎙️ Zum Diktieren braucht die App dein Mikrofon/.test(mf) && /getUserMedia\(\{ audio: true \}\)/.test(mf) && /forEach\(\(x\) => x\.stop\(\)\)/.test(mf), "Erklärung, Abfrage, Mikrofon sofort wieder aus");
}
// 340. 2.22.13: Herausforderungen standardmäßig an, Hinweis wo man es abstellt (KC-CLUB-SPIELE-STANDARD-AN)
{
  const bm = server.slice(server.indexOf("async function spielBereitMap"), server.indexOf("async function spielPush"));
  assert.ok(/new Map<string, string\[\]>\(alle\.map\(\(id\) => \[id, \[\.\.\.SPIEL_ARTEN\]\]\)\)/.test(bm) && /x\.wert\?\.herausforderung === true \?[\s\S]{0,140}: \[\]\);/.test(bm), "ohne Einstellung alle Spiele, eigenes Aus bleibt aus");
  assert.ok(/const spHerausAn = \(\) => \{ const w = INIT\?\.einstellungen\?\.spiele; return w \? w\.herausforderung === true : true; \};/.test(html) && /const an = spHerausAn\(\), l = spMeineArten\(\);/.test(html), "Schalter zeigt Standard an");
  assert.ok(/const spHinweisFaellig = \(\) => !INIT\?\.einstellungen\?\.spiele && lsLesen\(SP_HINWEIS\) !== "1";/.test(html) && /setTimeout\(spHinweisEinmal, 600\)/.test(html) && /einstiegHin\("privat", "setSpiele"\)/.test(html) && /Privatsphäre“ → „🎲 Andere dürfen mich zu Spielen herausfordern“/.test(html), "Hinweis beim ersten Mal mit Weg zum Abstellen");
}
// 341. 2.22.13 (Fehler aus 2.22.12): nach dem Laden muss ICH gesetzt werden – kein Zeilenkommentar darf den Rest der Zeile verschlucken
{
  const z = html.split("\n").find((l) => l.includes('INIT = await api("init"')) || "";
  assert.ok(/ICH = INIT\.ich;/.test(z) && !/\/\/[^\n]*ICH = INIT\.ich/.test(z), "ICH = INIT.ich wird ausgeführt (nicht auskommentiert)");
}
// 342. 2.22.14: Kachel-Zahl oben rechts (verdeckt keinen Text)
assert.ok(/\.kachel \.zahl \{ position: absolute; right: 12px; top: 12px;/.test(html), "Kachel-Zahl oben rechts");
// 343. 2.22.15: Erklärung Termine nennt den Handy-Kalender (nur eine Richtung)
assert.ok(/\{ id: "termine", sym: "📅", t: "Termine", x: "[^"]*📲 Termine im Handy-Kalender[^"]*leider nicht umgekehrt/.test(html), "Termine-Erklärung: Handy-Kalender");
// 344. Schutz (Fehler 2.22.12 / 2.22.16-Entwurf): ein „// KC-…“-Kommentar darf in keiner Zeile Code hinter sich verschlucken
for (const [name, txt] of [["index.html", html], ["kc-club", server]]) {
  const schlecht = txt.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => { const m = /\/\/ KC-[A-Z0-9-]+[^\n]*$/.exec(l); if (!m) return false;
    const rest = l.slice(m.index); return /[;{}]\s*(if|else|try|const|let|return|await|[A-Za-z_$][\w$.]*\()/.test(rest.replace(/„[^“]*“|"[^"]*"|`[^`]*`/g, "")); });
  assert.ok(!schlecht.length, `${name}: Kommentar verschluckt Code in Zeile ${schlecht.map((x) => x[0]).join(", ")}`);
}
// 345. 2.22.16: Spiele ansagen lassen (KC-CLUB-SPIEL-ANSAGE)
{
  assert.ok(/function spSag\(art, text, schluessel, vorrang = false\) \{\s*if \(!spAnsageAn\(art\) \|\| !text \|\| aktuelleAnsicht !== "spiele"\) return;/.test(html), "Ansage nur wenn eingeschaltet und in den Spielen");
  assert.ok(/function schZugAnsage\(m, ch, ich\)/.test(html) && /hat gerade \$\{fem\(o\) \? "deine" : "deinen"\} \$\{schFigAkk\(o\)\} geschlagen/.test(html), "Schach: Züge und Schlagen");
  assert.ok((html.match(/spAnsageKnopf\("schach"\)/g) || []).length === 2 && (html.match(/spAnsageKnopf\("kt"\)/g) || []).length >= 3 && (html.match(/spAnsageKnopf\("bsk"\)/g) || []).length === 2 && (html.match(/spAnsageKnopf\("ttt"\)/g) || []).length === 2 && !/spSag\("ttt"/.test(html), "Schalter bei Schach, Küchenterror, Bauernskat; Tic-Tac-Toe nur Töne (2.22.22), keine Sprache");
  assert.ok(/spSag\("kt", ktFrageSprache\(fr, z\.i \+ 1\)/.test(html) && /spSag\("bsk", `Der Computer spielt \$\{bskKarteWort\(kc\)\}\.`\)/.test(html), "Küchenterror-Frage, Bauernskat-Karte");
  const regeln = html.slice(html.indexOf("const BSK_FARBEN = "), html.indexOf("// ----- Computer -----", html.indexOf("const BSK_FARBEN = ")));
  assert.ok(!/bskKarteWort|BSK_WNAME/.test(regeln), "Ansage-Helfer nicht in den Regeln (Server-Kopie bleibt gleich)");
}
// 346. 2.22.17: Rochade über den Turm, Online-Push für alle wählbar
{
  assert.ok(/function schRochade\(ch, von, feld\)/.test(html) && (html.match(/const r = schRochade\(ch, SCHM?\.auswahl, feld\)/g) || []).length === 2 && (html.match(/= schZieleMitRochade\(ch, feld\)/g) || []).length === 2, "Rochade über den Turm (Computer + Mitglieder)");
  assert.ok(/\$\("setOnlinePushZeile"\)\?\.classList\.remove\("versteckt"\)/.test(html) && /checked = ICH\?\.admin \? INIT\?\.einstellungen\?\.online_push\?\.an !== false : INIT\?\.einstellungen\?\.online_push\?\.an === true;/.test(html), "Online-Push-Schalter für alle, Standard je Rolle");
}
// 347 KC-CLUB-AENDERUNG-FREIGABE (2.22.19): Kenntnis → Freigabe → Übergabe an KC-Programme über DB-Funktionen
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22219_aenderung_freigabe.sql");
  assert.ok(/function public\.kc_core_person_aenderungen_offen\(p_org_id text\)/.test(mig) && /function public\.kc_core_person_aenderung_quittieren\(p_id uuid, p_status text, p_programm text, p_ergebnis jsonb default null\)/.test(mig), "Übergabe-Funktionen fehlen");
  assert.ok((mig.match(/kc_private\.kc_core_is_admin\([^)]*\) or kc_private\.kc_core_has_app_access\([^,]+, 'KC_MANAGER', array\['manager', 'admin'\]\)/g) || []).length === 2, "Rechteprüfung in beiden Funktionen");
  assert.ok(/where id = p_id and status = 'freigegeben'/.test(mig) && /p_status not in \('uebernommen', 'abgelehnt'\)/.test(mig), "Quittieren nur aus freigegeben");
  assert.ok(/revoke all on function public\.kc_core_person_aenderungen_offen\(text\) from public, anon;/.test(mig) && /revoke all on function public\.kc_core_person_aenderung_quittieren\(uuid, text, text, jsonb\) from public, anon;/.test(mig), "anon darf nicht");
  assert.ok(!/kc_core_people/.test(server.slice(server.indexOf("function aeUebergabe"), server.indexOf("const aeKurz ="))), "Club-App schreibt kc_core_people nicht selbst");
  assert.ok(/id: "bank"[^\n]*aus: true/.test(server) && /if \(\(art as any\)\.aus\) throw new Fehler/.test(server) && /a\.aus \? `<button class="knopf" disabled/.test(html), "Bank ausgegraut");
  assert.ok(!/case "bank":/.test(server.slice(server.indexOf("function aeUebergabe"), server.indexOf("const aeDarfFreigeben"))), "Bank keine Übergabe");
  assert.ok(/x\.art === "bank" \? \/\^kassenwart\/i : \/\^clubsprecher\/i/.test(server), "Bank nur Kassenwart");
  for (const a of ["aenderung_kenntnis", "aenderung_freigeben", "aenderung_rueckfrage"]) assert.ok(server.includes(`case "${a}":`) && html.includes(`api("${a}"`), `Aktion ${a}`);
  assert.ok(/\.eq\("status", "offen"\)\.select\("id"\);\s*\n\s*if \(!ok\?\.length\) throw new Fehler\("Die Meldung ist schon bearbeitet\.", 409\);\s*\n\s*const ablage = await aeAblegen\(ich, \{ \.\.\.x, \.\.\.upd \}, "Freigegeben"\);/.test(server), "Freigabe atomar + Ablage Personal");
  assert.ok(/await aeUebernahmeMelden\(\)\.catch/.test(server) && /\.is\("mitglied_informiert_am", null\)\.select\("id"\)/.test(server), "Rückmeldung einmalig");
}
// 348 KC-CLUB-BUERO-NEU-NACHRICHT (2.22.20): Hinweis im Büro bei neuer Nachricht, Tippen öffnet die Unterhaltung an der ersten ungelesenen
{
  assert.ok(/<div id="buNeuNachr" class="bnn versteckt" aria-live="polite"><\/div>\s*<div id="buInhalt">/.test(html), "Hinweis-Platz im Büro außerhalb von buInhalt");
  assert.ok(/if \(letzteUngelesen !== null && laut > letzteUngelesen && aktuelleAnsicht === "buero"\) buNeuPruefen\(\);/.test(html), "bei neuer Nachricht im Büro prüfen");
  assert.ok(/if \(aktuelleAnsicht === "buero" && !PUSH_AKTIV && Date\.now\(\) - BNN\.zuletzt > 55000\) buNeuPruefen\(\);/.test(html), "ohne Push selbst nachsehen");
  assert.ok(/u\.ungelesen && u\.letzte && u\.letzte\.von !== "Du" && !stummAn\(u\.id\)/.test(html), "nur fremde, nicht stumme Unterhaltungen");
  assert.ok(/function buNeuOeffnen\(\) \{[^}]*chatOeffnen\(u\.id\);/.test(html), "Tippen öffnet die Unterhaltung");
  assert.ok(/<span><b>Neue Nachricht von \$\{esc\(von\)\}<\/b><small>\$\{esc\(u\.letzte\.text/.test(html), "Text escaped");
}
// 355 KC-CLUB-EINGANGSKORB (2.23.6): Erstattungen + Dienstzeiten im Eingang, alle drei der Clubleitung, Ablage in mehrere Ordner
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22221_eingangskorb.sql");
  assert.ok(/create table if not exists kc_club_eingang_stand/.test(mig) && /revoke all on table kc_club_eingang_stand from anon, authenticated;/.test(mig) && !/kc_dp_wish_inbox\s+add/.test(mig), "Stand-Tabelle, DP-Vertrag unverändert");
  for (const a of ["eingang_korb", "eingang_dienstwunsch", "eingang_kenntnis", "erstattung_erledigen", "eingang_ablage_ziele", "eingang_ablegen"]) {
    assert.ok(server.includes(`case "${a}":`) && html.includes(`api("${a}"`), `Aktion ${a}`);
    const block = server.slice(server.indexOf(`case "${a}":`), server.indexOf(`case "${a}":`) + 400);
    assert.ok(/nurLeitung\(ich\)|ekPruefen\(ich, art, id\)/.test(block), `${a}: nur Clubleitung`);
  }
  assert.ok(/const nurLeitung = \(ich: Ich\) => \{ if \(!ich\.vorstand && !ich\.admin\) throw/.test(server), "Clubleitung = Vorstand oder Admin");
  assert.ok(/\.eq\("id", String\(p\.id \|\| ""\)\)\.eq\("status", "eingereicht"\)\.select/.test(server), "Erstattung nur einmal erledigen");
  assert.ok(/if \(status === "abgelehnt" && !antwort\) throw/.test(server), "Ablehnen braucht Grund");
  assert.ok(/!o \|\| o\.besitzer \|\| o\.geloescht_am \|\| !darfOrdnerSehen\(ich, o\)/.test(server), "nur sichtbare Club-Ordner als Ziel");
  assert.ok(/if \(p\.mitglied && doku\.person_id && doku\.person_id !== ich\.person_id\) await persoenlich\(doku\.person_id/.test(server), "Ordner des Mitglieds");
  assert.ok(/\.lt\("updated_at", new Date\(Date\.now\(\) - 10 \* 60000\)\.toISOString\(\)\)/.test(server) && /await ekDienstwunschMelden\(\)\.catch/.test(server), "Dienstzeiten erst nach 10 Min. Ruhe melden");
  assert.ok(/: await leitungIds\(\); \/\/ KC-CLUB-EINGANGSKORB/.test(server) && /`club-erstattung-eingang:\$\{a\.id\}`/.test(server), "alle drei bekommen Meldung");
  assert.ok(/ekPosten\(P\);/.test(html) && /data-o="\$\{esc\(o\.id\)\}"/.test(html) && /localStorage\.setItem\(EK_WAHL_KEY\(art\)/.test(html), "Eingang + Mehrfach-Ablage im Client");
  assert.ok(/else if \(h === "#eingang" && ICH\?\.buero\)/.test(html), "#eingang");
}
// 356 KC-CLUB-INKO-BLINKEN + KC-CLUB-TTT-TOENE (2.23.6)
{
  assert.ok(/#inkoKnopf\.an \{[^}]*animation: inkoBlink 1\.2s ease-in-out infinite; \}/.test(html) && /@keyframes inkoBlink \{[^}]*\} 50% \{ background: #d32f2f;/.test(html), "Brille blinkt rot, solange Inkognito an");
  assert.ok(/if \(!spAnsageAn\("ttt"\) \|\| aktuelleAnsicht !== "spiele"\) return;/.test(html), "Töne nur mit Schalter und nur im Spiel");
  assert.ok(/if \(!spPcEnde\(\)\) \{ spTttTon\("ich"\);/.test(html) && /if \(!spPcEnde\(\) && i !== undefined\) spTttTon\("gegner"\);/.test(html) && /spTttTon\(a\.sieger === "x" \? "sieg"/.test(html), "Computer: Zug + Ende");
  assert.ok(/spTttTonMg\(g\); \/\/ KC-CLUB-TTT-TOENE/.test(html) && /if \(neu >= 0\) spTttTon\(g\.brett\[neu\] === g\.ichBin \? "ich" : "gegner"\);/.test(html), "Mitglieder: Zug + Ende");
  assert.ok(/if \(art === "ttt"\) \{ if \(an\) spTttTon\("sieg"\); return melde/.test(html), "TTT-Schalter spricht nicht");
}
// 358. 2.23.8: Hilfen zu den Neuerungen aus 2.23.6
{
  for (const id of ["eingangskorb", "ablage_mehrere", "buero_neue_nachricht", "ttt_toene", "inkognito_blinkt"]) assert.ok(new RegExp(`\\{ id: "${id}", thema: "(club|privat)",[^\\n]*seit: "2\\.23\\.8" \\}`).test(html), `Hilfe ${id}`);
  assert.ok(/\{ id: "inkognito_blinkt",[^\n]*nur: \(\) => !!ICH\?\.admin/.test(html) && /\{ id: "eingangskorb",[^\n]*nur: \(\) => !!\(ICH\?\.vorstand \|\| ICH\?\.admin\)/.test(html), "Clubleitung/Admin-Hilfen nur für sie");
}
// 359. 2.23.9: Spar-Takt (KC-CLUB-SPARTAKT) – weniger Server-Aufrufe, damit die kostenlose Grenze sicher hält
{
  assert.ok(/if \(chatTakt\.laeuft \|\| document\.hidden\) return;/.test(html), "Chat im Hintergrund nicht nachfragen");
  assert.ok(/const frisch = Date\.now\(\) - CHAT_AKTIV < 90000, ruhig = PUSH_AKTIV \? 10 : 6;/.test(html) && /CHAT\?\.tippt\?\.length \|\| \(jemandDa && ONL\.takt % \(frisch \? 2 : 4\) === 0\)/.test(html), "Tippen bleibt sofort, sonst seltener");
  assert.ok(/NA\.idStand = idStand; CHAT_AKTIV = Date\.now\(\);/.test(html), "neue Nachricht → wieder schnell");
  assert.ok(/if \(SP\.offen\.ichDran \? SPT_TAKT\.n % 5 : SPT_TAKT\.ruhig > 40 && !SP\.offen\.uhr\?\.laeuft && SPT_TAKT\.n % 3\) return;/.test(html) && /SPT_TAKT\.ruhig = 0; const warDran/.test(html), "Spiele-Takt");
  assert.ok(!/function aeErledigt/.test(html), "alter Knopf „Im KC Manager eingetragen“ entfernt");
}
// 360. 2.23.10: Datenbank-Zeitgrenze (KC-CLUB-DB-ZEITGRENZE) – nach dem nächtlichen Ausfall am 04.10.
{
  assert.ok(/const DB_ZEIT_MS = 15000;/.test(server) && /if \(!url\.includes\("\/rest\/v1\/"\)\) return fetch\(input, init\);/.test(server), "nur Datenbank-Abfragen, Dateien unverändert");
  assert.ok(/global: \{ fetch: dbFetch \}/.test(server) && /if \(zeit\.aborted\) \{ DB_AUS\.n\+\+;/.test(server), "Client nutzt Zeitgrenze, Abbruch wird gezählt");
  assert.ok(/return DB_AUS\.n !== dbAusVorher \? dbWeg\(\) : antwort;/.test(server) && /if \(DB_AUS\.n !== dbAusVorher\) return dbWeg\(\);/.test(server), "nie halbes Ergebnis");
  assert.ok(/json\(\{ error: "Die Datenbank antwortet gerade nicht[^"]*", db: "weg" \}, 503\)/.test(server) && /const leitungKaputt = \(r\.status >= 502 && r\.status <= 504\)/.test(html), "503 → App wertet als Leitung gestört (Notbetrieb)");
  assert.ok(/if \(DB_AUS\.n !== dbVorher\) throw new Error\("Datenbank antwortet nicht – Notfall-Paket bleibt/.test(server), "Notfall-Paket wird nicht durch lückenhaftes ersetzt");
}
// 361. 2.23.11: gelber Inkognito-Rahmen blinkt im Takt der Brille
{
  assert.ok(/body\.inkognito #v-start \.hero \{ box-shadow: 0 0 0 4px #f1c40f, 0 12px 30px var\(--heroschatten\); animation: inkoRandBlink 1\.2s ease-in-out infinite; \}/.test(html) && /@keyframes inkoRandBlink \{[^\n]*50% \{ box-shadow: 0 0 0 4px #d32f2f/.test(html), "Rahmen blinkt gelb/rot");
}
// 362. 2.23.13: Feedback-Bogen 2026-3 – neue Bereiche, Hilfe-Frage, „Schon umgesetzt“ ergänzt
{
  const f = server.slice(server.indexOf("const FEEDBACK_FRAGEN"), server.indexOf("const FEEDBACK_UMGESETZT"));
  const u = server.slice(server.indexOf("const FEEDBACK_UMGESETZT"), server.indexOf("const FB_TEXT_MAX"));
  for (const x of ["🎲 Spiele", "❓ Hilfe-Zentrum", "🏙️ Termine der Stadt", "💶 Erstattung", "✏️ Meine Daten geändert", "🎤 Diktieren / Mikrofon", "🔔 Weniger Benachrichtigungen"]) assert.ok(f.includes(x), `Fragebogen: ${x}`);
  assert.ok(/\{ id: "hilfe", schritt: 1, art: "eins", t: "Hilft dir die Hilfe/.test(f) && !f.includes("Auch ohne Internet lesen"), "Hilfe-Frage, Umgesetztes nicht mehr als Wunsch");
  for (const x of ["Spiele (Tic-Tac-Toe", "Hilfe-Zentrum", "Einfache Ansicht", "Termine der Stadt", "Änderungsmeldung", "Erstattung", "ohne Internet"]) assert.ok(u.includes(x), `Schon umgesetzt: ${x}`);
}
// 368. 2.23.20: ✕ oben rechts in langen Fenstern (KC-CLUB-BLATT-X)
{
  assert.ok(/function blattXPruefen\(\)/.test(html) && /sc\.innen\.querySelector\("\.blatt-x"\)\.onclick = \(e\) => \{ e\.stopPropagation\(\); fensterZu\(b\); \};/.test(html), "✕ schließt wie Zurück");
  assert.ok(/const BLATT_X_OHNE = new Set\(\["alarmBlatt"\]\);/.test(html) && /if \(da \|\| blattHatObenX\(sc\.innen\)\) continue;/.test(html), "nicht doppelt, nie beim Notfall-Fenster");
  assert.ok(/\.blatt-x-leiste \{ position: sticky;[^}]*background: var\(--karte\)/.test(html), "Leiste mit Hintergrund – verdeckt nichts");
}
// 369. 2.23.21: Ameisenrahmen um die Gruppen-Knöpfe (KC-CLUB-GRUPPEN-AMEISEN)
{
  assert.ok(/if \(v === "mitglieder"\) \{ MG_AMEISEN\.bis = 0; MG_AMEISEN\.neu = true;/.test(html) && /const MG_AMEISEN = \{ bis: 0, neu: false, t: 0, MS: 4000 \};/.test(html), "beim Öffnen 4 s");
  assert.ok(/<small>\(\$\{x\.personen\.length\}\)<\/small>\$\{ameisen\}<\/button>/.test(html) && /\.mg-gruppen \.ameisen rect \{[^}]*animation: ameisenLauf/.test(html), "Rahmen um jeden Gruppen-Knopf");
}
// 370. 2.23.22: eigene Erinnerung zu jeder Terminanfrage (KC-CLUB-ERINNERUNG-WAHL)
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22322_erinnerungen.sql");
  assert.ok(/create table if not exists kc_club_erinnerungen/.test(mig) && /on delete cascade/.test(mig) && /revoke all on table kc_club_erinnerungen from anon, authenticated;/.test(mig), "Tabelle");
  assert.ok(server.includes('case "erinnerung_setzen":') && html.includes('api("erinnerung_setzen"'), "Aktion");
  assert.ok(/a\.erstellt_von !== ich\.person_id \? await db\.from\("kc_club_terminanfrage_empfaenger"\)/.test(server), "nur Absender oder Empfänger");
  assert.ok(/const an = \[x\.erstellt_von, \.\.\.zu\]\.filter\(\(pid\) => !eigeneErin\.has\(x\.id \+ "\|" \+ pid\)\);/.test(server), "Standard nur ohne eigene Einstellung");
  assert.ok(/\.eq\("vortag", false\)/.test(server) && /sendenGewaehlt\("club_erinnerung", \[r\.person_id\], r\.wege/.test(server), "Vortag abwählbar, Weg nach Wahl");
  assert.ok(/if \(antwort === "ja" \|\| antwort === "vielleicht"\) erinAnfrage\(id\);/.test(html) && /TA\.markiert = r\.id; await taLaden\(\); erinAnfrage\(r\.id\);/.test(html), "fragt nach Zusage und nach dem Vorschlagen");
  assert.ok(/1 · Wann möchtest du erinnert werden\?/.test(html) && /2 · Wie\?/.test(html) && /"TRIGGER:-PT\$\{minuten\}M"|`TRIGGER:-PT\$\{minuten\}M`/.test(html), "gegliedertes Fenster, Kalender-Alarm");
  assert.ok(/requireInteraction: \/\^⏰\/\.test\(titel\)/.test(lies("sw.js")), "Erinnerungs-Push bleibt stehen");
}
// 371. 2.23.23: „since 1991“ auf der Rückseite der drehenden Kochmütze (KC-CLUB-MUETZE-SINCE)
{
  assert.ok(html.includes('.warten .muetze::after, .si-muetze:not(.klein) > span::after { content: "since\\A 1991";') && /content: "since[^"]*1991";[^}]*transform: rotateY\(180deg\); backface-visibility: hidden;/.test(html), "Rückseite mit Spruch");
  assert.ok(/\.warten \.muetze img, \.si-muetze:not\(\.klein\) > span img \{ backface-visibility: hidden;/.test(html), "Mütze nur vorne");
}
// 372. 2.23.24: alles Anklickbare pulsiert kurz beim Antippen (KC-CLUB-TIPP-PULS)
{
  assert.ok(/const TIPP_ZIEL = 'button, \[role="button"\], \[role="tab"\]/.test(html) && /\(function tippPuls\(\) \{/.test(html), "zentrale Stelle");
  assert.ok(/try \{ return z\.animate\(\[\{ scale: "1", boxShadow: `0 0 0 0 \$\{ring\}\$\{ra\}\)` \}/.test(html) && /Math\.hypot\(e\.clientX - x0, e\.clientY - y0\) > 10\) \{ try \{ lauf\.a\?\.cancel\(\); \}/.test(html) && /if \(vorher\.isConnected && vorher\.getClientRects\(\)\.length\) \{/.test(html) && /if \(!tastatur\) \{ const z = finden\(document\.elementFromPoint\(x, y\)\); if \(z && z !== vorher\) pulsen\(z\); \}/.test(html), "Puls beim Aufsetzen, Abbruch beim Scrollen, neu gezeichnete Reiter");
  assert.ok(/const schreiben = \(t\) => t\.matches\?\.\('input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\), textarea, select, \[contenteditable="true"\]'\);/.test(html) && /if \(schreiben\(e\.target\)\) return;/.test(html), "Eingabefelder nie");
}
// 373. 2.23.25: offene Herausforderung erreichbar (KC-CLUB-SPIEL-SCHON-OFFEN)
{
  assert.ok(/\["laeuft", "beendet", "angefragt"\]\.includes\(g\.status\) \? `style="cursor:pointer" onclick="if\(!event\.target\.closest\('button'\)\)spOeffnen/.test(html), "offene Herausforderung antippbar");
  assert.ok(/async function spSchonOffen\(e, an, f, mitTermin\)/.test(html) && /catch \(e\) \{ if \(!\(await spSchonOffen\(e, an, f, true\)\)\) meldeFehler\(e\); \}/.test(html) && /catch \(e\) \{ if \(!\(await spSchonOffen\(e, an, f, false\)\)\) meldeFehler\(e\); \}/.test(html), "statt Fehlermeldung zur offenen Herausforderung");
}
// 374. 2.23.28: Chats archivieren / wieder aktivieren / bei mir komplett löschen (KC-CLUB-CHAT-ARCHIV)
{
  const ua = server.slice(server.indexOf('case "unterhaltung_archivieren"'), server.indexOf('case "unterhaltung_loeschen"'));
  assert.ok(/await binTeilnehmer\(id, ich\.person_id\);[\s\S]*if \(p\.zurueck\) delete archiv\[id\]; else archiv\[id\] = jetzt\(\);/.test(ua), "Archivieren nur als Teilnehmer, zurück = wieder aktivieren");
  assert.ok(/case "unterhaltung_leeren"[\s\S]*await binTeilnehmer\(id, ich\.person_id\);[\s\S]*kc_communication_message_hidden"\)\.upsert\(ms\.map\(\(m: any\) => \(\{ person_id: ich\.person_id/.test(ua), "Komplett löschen nur für mich (message_hidden)");
  assert.ok(!/\.delete\(\)/.test(ua), "Archivieren/Leeren löscht nichts für andere");
  assert.ok(/\.\.\.\(archiv\[t\.id\] \? \{ archiviert: archiv\[t\.id\] \} : \{\}\)/.test(server), "Liste liefert archiviert");
  assert.ok(/const zeigen = unterhaltungen\.filter\(\(u\) => !!u\.archiviert === !!UH\.archivAnsicht\)/.test(html) && /📦 Archiviert/.test(html), "Liste trennt Archiv");
  assert.ok(/u\.archiviert \? "📤 Wieder aktivieren" : "📦 Archivieren"/.test(html) && /onclick="chatKomplettLoeschen\('\$\{u\.id\}'\)"/.test(html), "Aktionen in der Liste");
  const kl = html.slice(html.indexOf("async function chatKomplettLoeschen"), html.indexOf("async function chatKomplettLoeschen") + 1400);
  assert.ok(/if \(!\(await frage\(/.test(kl) && /api\("unterhaltung_leeren"/.test(kl), "Komplett löschen nur nach Rückfrage");
  assert.ok(/id="chatArchivKnopf"/.test(html) && /id="chatKomplettKnopf"/.test(html) && /onclick="unterhaltungWeg\(false\)">🙈 Nur bei mir entfernen/.test(html), "Chat-Menü: neu + Bestehendes bleibt");
}
// 375. 2.23.28: leerer persönlicher Wunschbogen (DP2-Matrix, QR = Mitglieds-ID) drucken / an mich mailen (KC-CLUB-WUNSCHBOGEN)
{
  const daten = fs.readFileSync(new URL("../dp2-club/daten.js", import.meta.url), "utf8");
  assert.ok(/K\.people = \(K\.people \|\| \[\]\)\.map\(\(p\) => \(p\.personId === ich \? \{ \.\.\.p, formProfileId: ich \} : p\)\);/.test(daten), "QR-Profil = Mitglieds-ID");
  assert.ok(/await F\.downloadPdf\("matrix", ich\);/.test(daten) && /finally \{ P\.download = herunterladen; \}/.test(daten), "DP2s eigener Druckteil (Matrix), Download zurückgesetzt");
  assert.ok(/e\.origin !== location\.origin \|\| e\.source !== parent/.test(daten), "nur Anfragen der Club-App");
  const wm = server.slice(server.indexOf('case "wunschbogen_mailen"'), server.indexOf('case "eingaben_ablegen"'));
  assert.ok(/daten\.startsWith\("JVBERi"\)/.test(wm) && /\/\^application\\\/pdf\$\//.test(wm), "nur PDF");
  assert.ok(/routerSenden\("club_nachricht_mail", \[ich\.person_id\]/.test(wm) && /attachmentIds: \[datei\.id\]/.test(wm), "nur an mich, als Anhang");
  assert.ok(/"wunschbogen_gemailt"\)\.gte\("zeit", new Date\(Date\.now\(\) - 120_000\)/.test(wm), "Bremse 2 Minuten");
  assert.ok(/data-k="bogen"/.test(html) && /function wbStart\(\)/.test(html) && /wunschbogen: \{ bauen: \(\) => wbDruckSeite\(\) \}/.test(html) && /api\("wunschbogen_mailen"/.test(html), "Club-App: Knopf, Druck, Mail");
  assert.ok(/#druck img\.dseite\.quer \{ width: 297mm; height: 209mm; \}/.test(html), "Querformat randlos");
}
// 376. 2.23.29: Puls-Ring kontrastreich in allen Farbdesigns, auch nachts (KC-CLUB-PULS-KONTRAST)
{
  assert.ok(/--pulsRing: 208, 2, 27; --pulsRingA: \.55;/.test(html) && /:root\.dunkel \{ --pulsRing: 255, 77, 94; --pulsRingA: \.9; \}/.test(html), "Ringfarbe je Tag/Nacht");
  assert.ok(/@keyframes vsPuls \{[^}]*rgba\(var\(--pulsRing\), var\(--pulsRingA\)\)/.test(html) && !/rgba\(208, 2, 27/.test(html), "keine fest eingebaute Ringfarbe mehr");
  assert.ok(/const ringFarbe = \(z\) => \{/.test(html) && /bg\[i\] \* \(1 - a\)\), bg\) >= 2\.5\)/.test(html), "Kontrast zum echten Hintergrund geprüft");
  // alle Designs: Nacht-Ring auf bg/karte/karte2 mindestens 3:1
  const blk = html.slice(html.indexOf("const DESIGNS = ["), html.indexOf("\n];", html.indexOf("const DESIGNS = [")));
  const lum = (c) => { const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const kr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const nacht = [...blk.matchAll(/nacht: \{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(nacht.length >= 20, "Designs gefunden");
  assert.ok(/\.su-klein \{[^}]*border: 2px solid var\(--textRot, var\(--rot\)\);/.test(html) && /\.hz-frage \{[^}]*border: 2px solid var\(--textRot, var\(--rot\)\);/.test(html), "Lupe und ? mit Kontrastring");
  for (const n of nacht) for (const [, hex] of n.matchAll(/(?:bg|karte|karte2): "#([0-9a-fA-F]{6})"/g)) {
    const bg = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16)), ring = [255, 77, 94].map((v, i) => v * 0.9 + bg[i] * 0.1);
    assert.ok(kr(ring, bg) >= 3, "Nacht-Ring zu schwach auf #" + hex);
  }
}
// 377. 2.23.29: Spiel-Herausforderung zurückgezogen/abgelehnt → ihre Terminanfrage wird mit abgesagt (KC-CLUB-SPIEL-TERMIN-ABSAGE)
{
  assert.ok(/async function anfrageAbsagen\(ich: Ich, a: any, grund: string, benachrichtigen: boolean\)/.test(server) && /\.eq\("id", a\.id\)\.eq\("status", "offen"\)\.select\("id"\)/.test(server), "eine Stelle zum Absagen");
  assert.ok(/return json\(\{ ok: true, versand: await anfrageAbsagen\(ich, a, txt\(p\.grund, 300\), true\) \}\);/.test(server), "„Absagen“ nutzt sie");
  assert.ok(/if \(g\.status === "angefragt"\) await spielTerminAbsagen\(ich, g\.id, "Herausforderung zurückgezogen", true\);/.test(server), "Zurückziehen sagt Termin ab");
  assert.ok(/if \(!p\.annehmen\) await spielTerminAbsagen\(ich, g\.id, "Herausforderung abgelehnt", false\);/.test(server), "Ablehnen sagt Termin ab");
  assert.ok(/anfragen: anfragen\.filter\(\(x: any\) => x\.status !== "abgesagt"/.test(server), "Kalender zeigt Abgesagtes nicht");
}
// 378. 2.23.29: Twinkey-Fenster – Mütze hinten „since 1991“, Kopf in zwei Reihen, Meldungen sichtbar, Mail-Bestätigung im Fenster
{
  const dw = fs.readFileSync(new URL("../dienstwunsch.html", import.meta.url), "utf8");
  assert.ok(/#dwLaden \.muetze::after\{content:"since\\A 1991"/.test(dw) && /#dwLaden \.muetze img\{backface-visibility:hidden/.test(dw), "Twinkey-Ladeseite: Rückseite since 1991");
  assert.ok(/<div class="dw-kopf"><div class="dw-reihe">/.test(html) && /\.dw-aktionen \{ display: grid; grid-template-columns: 1fr 1fr;/.test(html), "Kopf in zwei Reihen");
  assert.ok(/\.meldung \{[^}]*z-index: 2300;/.test(html), "Meldungen über Vollbild-Fenstern");
  assert.ok(/Die E-Mail wurde an dich geschickt\./.test(html) && /id="wbStatus" role="status"/.test(html), "Mail-Bestätigung im Fenster");
}
// 379. 2.23.30: abgesagte Terminanfrage – keine Zahl, keine Antwortzeile (KC-CLUB-TERMINANFRAGE)
{
  assert.ok(/kommend\.filter\(\(a\) => a\.status !== "abgesagt"\)\.length/.test(html), "Zahl ohne Abgesagte");
  assert.ok(/\$\{ab \? "" : `<details style="margin-top:8px"/.test(html), "keine Antwortzeile bei Absage");
}
// 380. 2.23.31: Tagesübersicht „Heute nicht mehr anzeigen“ (KC-CLUB-TAGESINFO-HEUTE-AUS)
{
  assert.ok(/onclick="tiHeuteAus\(\)">🌙 Heute nicht mehr anzeigen<\/button>/.test(html) && /localStorage\.setItem\(TI_HEUTE_AUS, heuteIso\(\)\)/.test(html), "Knopf merkt den Tag");
  assert.ok(/localStorage\.getItem\(TI_HEUTE_AUS\) === heuteIso\(\)\) return;/.test(html), "beim Start heute nicht mehr");
  assert.ok(/Auf diesem Gerät nicht mehr beim Start zeigen/.test(html), "dauerhafter Schalter bleibt");
}
// 381. 2.23.32: Über die App – Entwickler mit Passbild (KC-CLUB-ENTWICKLER)
{
  assert.ok(fs.existsSync(new URL("../entwickler-hans-joachim-koch.webp", import.meta.url)), "Foto liegt in der App");
  const foto = fs.readFileSync(new URL("../entwickler-hans-joachim-koch.webp", import.meta.url));
  assert.ok(foto.slice(8, 12).toString() === "WEBP" && !foto.includes("Exif") && foto.length < 60000, "WebP, klein, ohne Kameradaten");
  assert.ok(/function entwicklerZeigen\(\)/.test(html) && /onclick="entwicklerZeigen\(\)">👨‍🍳 Über den Entwickler<\/button>/.test(html), "Fenster + Knopf in App-Info");
  assert.ok(/\{ id: "entwickler", thema: "technik"/.test(html) && /\["👨‍🍳", "Über die App \(Entwickler\)"/.test(html), "Hilfe + Suche");
}
// 382. 2.23.33: Bedienungsanleitung Version 4 (KC-CLUB-ANLEITUNG-V4)
{
  const v4 = fs.readFileSync(new URL("../dokumente/Koecheclub-App_Anleitung_V4.pdf", import.meta.url));
  assert.ok(v4.subarray(0, 5).toString() === "%PDF-" && v4.length < 9e6, "Anleitung V4 fehlt oder zu groß");
  for (const v of [1, 2, 3]) assert.ok(fs.existsSync(new URL(`../dokumente/Koecheclub-App_Anleitung_V${v}.pdf`, import.meta.url)), `V${v} muss unverändert bleiben`);
  const inh = fs.readFileSync(new URL("../tools/anleitung/inhalt.mjs", import.meta.url), "utf8"), f4 = fs.readFileSync(new URL("../tools/anleitung/fotos4.mjs", import.meta.url), "utf8");
  assert.ok(/anleitung: [45]/.test(inh) && /14\. Spiele/.test(inh) && /15\. Hilfe & Tipps/.test(inh) && /16\. Dienstwünsche/.test(inh) && /17\. Meine Daten haben sich geändert/.test(inh), "Inhalt V4");
  assert.ok(!/ptblnpiroqftcvlsrhac|service_role|eyJ[A-Za-z0-9_-]{20}|KC-P-\d/.test(f4), "fotos4 nur Demodaten, ohne echte Zugänge/IDs");
  // 2.23.42: in „Meine Dokumente“ steht jetzt V5 (Test 391); die V4-Datei bleibt unverändert liegen
}
// 383. 2.23.34: „Hat dir das weitergeholfen?“ unter jeder Hilfe (KC-CLUB-HILFE-BEWERTUNG)
{
  assert.ok(/\$\{VORLESE_KNOPF\}<\/div>\$\{hzBewHtml\(e\.id\)\}<\/div>`;/.test(html) && /Hat dir das weitergeholfen\?/.test(html), "unter jeder Hilfe");
  assert.ok(/if \(wert < 0\) \{ const r = await eingabe\("Was hat gefehlt/.test(html) && /api\("hilfe_bewerten", \{ id, wert, notiz \}\)/.test(html), "Nein fragt freiwillig nach");
  const hb = server.slice(server.indexOf('case "hilfe_bewerten"'), server.indexOf('case "wunschbogen_mailen"'));
  assert.ok(/\^\[a-z\]:\[a-z0-9_-\]\{1,48\}\$/.test(hb) && /onConflict: "person_id,hilfe_id"/.test(hb) && /nurAdmin\(ich\);/.test(hb), "Server: prüfen, je Person eine Zeile, Auswertung nur Admin");
  assert.ok(!/person_id/.test(hb.slice(hb.indexOf('case "hilfe_bewertungen"'), hb.indexOf("return json({ bewertungen"))) || /select\("hilfe_id,wert,notiz,geaendert_am"\)/.test(hb), "Auswertung ohne Namen");
  const mig = fs.readFileSync(new URL("../supabase/migrations/20261004_kc_club_v22334_hilfe_bewertung.sql", import.meta.url), "utf8");
  assert.ok(/enable row level security/.test(mig) && /revoke all on table kc_club_hilfe_bewertung from anon, authenticated/.test(mig), "RLS an, kein Direktzugriff");
}
// 384. 2.23.35: „Schnellzugriff“ → Schnellstart-Karte oben (KC-CLUB-SCHNELLZUGRIFF-LINK)
{
  assert.ok(/<h3><button type="button" class="sz-link" onclick="schnellstartOben\(\)"[^>]*>Schnellzugriff<\/button>/.test(html), "Wort ist antippbar");
  const f = html.slice(html.indexOf("async function schnellstartOben"), html.indexOf("function infoBlaettern(d)"));
  assert.ok(/INFO_FELDER\.findIndex\(\(f\) => f\.id === "schnellstart"\)/.test(f) && /infoGehe\(i\)/.test(f) && /window\.scrollTo\(\{ top: 0/.test(f), "springt zur Karte");
  assert.ok(/if \(einfach\(\)\) \{/.test(f) && /await ansichtSetzen\("erweitert"\)/.test(f) && /data-klappe="schnellstart"/.test(f), "einfache Ansicht / ausgeschaltet bedacht");
}
// 385. 2.23.36: Protokolle filtern (KC-CLUB-PROTOKOLL-FILTER)
{
  assert.ok(/id="prFilterKnopf" onclick="prFilterUmschalten\(\)"/.test(html) && /id="prfJahr"/.test(html) && /id="prfMonat"/.test(html) && /id="prfOrt"/.test(html) && /id="prfWer"/.test(html), "Symbol + vier Felder");
  assert.ok(/\.pr-filter-raster \{ display: grid; grid-template-columns: 1fr 1fr;/.test(html), "zwei Spalten");
  const f = html.slice(html.indexOf("function prFilterAnwenden()"), html.indexOf("function prFilterLeeren()"));
  assert.ok(/!q \|\| k\.dataset\.suche\.includes\(q\)/.test(f) && /d\.slice\(0, 4\) === PRF\.jahr/.test(f) && /d\.slice\(5, 7\) === PRF\.monat/.test(f) && /p\?\.verfasser\?\.name === PRF\.wer/.test(f), "Suche + Jahr/Monat/Ort/Protokollführer");
  assert.ok(/function protokollFilter\(\) \{ prFilterAnwenden\(\); \}/.test(html) && /data-id="\$\{p\.id\}" data-suche=/.test(html), "Suchfeld wirkt mit");
}
// 386. 2.23.37: Schließkreuz oben rechts im Filterfenster (KC-CLUB-PROTOKOLL-FILTER-ZU)
{
  const feld = html.slice(html.indexOf('id="prFilterFeld"'), html.indexOf('class="pr-filter-raster"'));
  assert.ok(/class="pr-filter-zu" onclick="prFilterUmschalten\(false\)" aria-label="Filter schließen"[^>]*>✕<\/button>/.test(feld), "Kreuz schließt den Filter");
  assert.ok(/\.pr-filter-zu \{ position: absolute; top: 6px; right: 6px; min-width: 40px; min-height: 40px;/.test(html), "oben rechts, groß genug");
}
// 387. 2.23.38: Schachuhr (KC-CLUB-SCHACH-UHR) + aufgeräumtes Schachfenster (KC-CLUB-SCHACH-AUFGERAEUMT)
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22338_schach_uhr.sql");
  assert.ok(/add column if not exists uhr jsonb/.test(mig) && /uhr is null or \(spiel = 'schach'/.test(mig) && /in \(5, 10, 15\)/.test(mig), "Migration: Spalte uhr nur für Schach");
  assert.ok(/const SCHACH_UHR_MIN = \[5, 10, 15\], SCHACH_UHR_GNADE_MS = 1500;/.test(server) && /function schachKannMatt\(fen: string, farbe: "w" \| "b"\)/.test(server) && /async function schachUhrPruefen\(g: any\)/.test(server), "Server: Uhr, Material, Zeitprüfung");
  const zp = server.slice(server.indexOf("async function schachUhrPruefen"), server.indexOf("// ---------- Eigener Status"));
  assert.ok(/remis = !schachKannMatt\(g\.brett, s === "x" \? "b" : "w"\)/.test(zp) && /gewinner: remis \? "remis" : gewinner/.test(zp) && /\.eq\("zuege", g\.zuege\)\.eq\("status", "laeuft"\)/.test(zp), "Zeit abgelaufen: verloren oder Remis (FIDE 6.9), ohne Doppel-Ende");
  const zug = server.slice(server.indexOf('case "spiel_zug": {'), server.indexOf('case "spiel_aufgeben": {'));
  assert.ok(/const g = await schachUhrPruefen\(g0\);/.test(zug) && /seit: !sieg && !remis && g\.zuege \+ 1 >= 2 \? jetzt\(\) : null/.test(zug), "Zug hält eigene Uhr an, startet die des Gegners (erste Züge frei)");
  assert.ok(/uhr: art === "schach" \? schachUhrNeu\(p\.uhr\) : null/.test(server) && /uhr: g\.spiel === "schach" && g\.uhr \? schachUhrNeu\(g\.uhr\.min\) : null/.test(server) && /const g = await schachUhrPruefen\(g0\); \/\/ KC-CLUB-SCHACH-UHR: Zeit abgelaufen/.test(server), "Herausfordern/Revanche/Holen");
  // Material-Regel mit echten Stellungen prüfen (gleiche Logik wie im Server)
  const kann = (fen, farbe) => { const fig = [...fen.split(" ")[0]].filter((c) => /[a-z]/i.test(c) && c !== "k" && c !== "K" && (farbe === "w" ? c === c.toUpperCase() : c === c.toLowerCase())).map((c) => c.toLowerCase()); return fig.some((c) => c === "p" || c === "q" || c === "r") || fig.length >= 2; };
  assert.ok(!kann("8/8/8/4k3/8/8/8/4K2N w - - 0 1", "w") && kann("8/8/8/4k3/8/8/8/4K2R w - - 0 1", "w") && !kann("8/8/8/4k3/8/8/8/4K3 w - - 0 1", "w") && kann("8/8/8/4k3/8/8/8/2B1K1N1 w - - 0 1", "w"), "Material-Regel");
  assert.ok(/function schKannMatt\(ch, farbe\)/.test(html) && /function schUhrTakt\(\)/.test(html) && /function schPcUhrAbgleich\(\)/.test(html) && /SCH\.uhr \? "" : `<button class="knopf klein" onclick="schPcZurueck\(\)"/.test(html), "App: Uhr gegen den Computer, kein Zurücknehmen mit Uhr");
  assert.ok(/class="sch-tisch\$\{st \? " mit-uhr" : ""\}"/.test(html) && /grid-template-areas: "links mitte rechts"/.test(html) && /\.sch-leiste \{ display: flex; flex-wrap: wrap; justify-content: center;/.test(html) && /<div class="sch-einst">/.test(html), "Brett mittig, Uhren links/rechts, schmale Knöpfe");
  assert.ok(/spWahl\("Uhr", uhr, \[\["0", "📨 Fern"\]/.test(html) && /\.\.\.\(art === "schach" && uhr !== "0" \? \{ uhr: Number\(uhr\) \} : \{\}\)/.test(html), "Herausfordern mit Uhr");
}
// 388. 2.23.39: Eingang filtern (KC-CLUB-EINGANG-FILTER), Dienstzeiten-Übersicht (KC-CLUB-DIENST-UEBERSICHT), Ablage (KC-CLUB-DIENST-ABLAGE)
{
  assert.ok(/onclick="ekfUmschalten\(\)" title="Eingang filtern/.test(html) && /class="pr-filter-zu" onclick="ekfUmschalten\(false\)"/.test(html) && /const ekfPasst = \(x\) =>/.test(html) && /zeig\.map\(\(\[x, i\]\) =>/.test(html), "Filter mit 🔽, ✕ und gefilterter Liste (Index bleibt)");
  assert.ok(/📅 Jahr\$\{wahl\("jahr"/.test(html) && /🗓️ Monat\$\{wahl\("monat"/.test(html) && /🏷️ Art\$\{wahl\("art"/.test(html) && /👤 Name\$\{wahl\("wer"/.test(html), "Jahr, Monat, Art, Name");
  assert.ok((html.match(/P\.push\(\{ wer: /g) || []).length >= 10, "Einträge tragen Name + Datum");
  assert.ok(/case "dienst_uebersicht": \{\s*nurLeitung\(ich\);/.test(server) && /case "dienst_ablegen": \{\s*nurLeitung\(ich\);/.test(server), "nur Clubleitung");
  const ab = server.slice(server.indexOf('case "dienst_ablegen": {'), server.indexOf('case "eingang_dienstwunsch": {'));
  assert.ok(/vereinsOrdner\(DIENSTPLAN_ORDNER, jahr, DIENST_REG\.wunsch\)/.test(ab) && /persoenlicherOrdner\(r\.person_id, doku\.wer, jahr, DIENST_REG\.persoenlich\)/.test(ab) && /if \(schon\.has\(/.test(ab) && /startsWith\("KC-P-TEST"\)/.test(ab), "Ordner des Mitglieds + Büro, nichts doppelt, ohne Testpersonen");
  assert.ok(/persoenlich: "Dienstpläne"/.test(server) && /titel: "Dienstpläne", farbe: 5, register: \["Wünsche", "Gesamtplan", "Sonstiges"\]/.test(server), "Register Dienstpläne / Büro-Ordner Dienstpläne");
  assert.ok(/dienstuebersicht: \{ bauen: \(\) => druckDienstUebersicht\(\) \}/.test(html) && /quer: true, html: dvLegende\(\) \+ dvGanttHtml\(\)/.test(html) && /api\("archiv_hochladen", \{ ordner_id: r\.ordner_id, register: r\.register/.test(html), "Druck A4 quer über den Druck-Kern + Gesamtplan ins Büro");
  assert.ok(/#druck \.dv-gantt, \.dv-gantt \{/.test(html), "Druck-CSS auch fürs Teilen am iPhone");
}
// 389. 2.23.40: Einstellungen – „Alle auf / Alle zu“ (KC-CLUB-KLAPPEN-ALLE)
{
  assert.ok(/<div class="klappen-alle-zeile"><button type="button" class="knopf klein klappen-alle" data-wurzel="v-einstellungen" onclick="klappenAlle\(this\)"/.test(html), "Umschalter oben in den Einstellungen");
  const f = html.slice(html.indexOf("function klappenAlle(b)"), html.indexOf("function installHilfe()"));
  assert.ok(/filter\(\(d\) => !klappeFest\(d\)\)/.test(f) && /l\.forEach\(\(d\) => \(d\.open = auf\)\)/.test(f), "öffnet/schließt alle, Festgestellte bleiben");
  assert.ok(/!d\.parentElement\.closest\("details\[data-klappe\]"\)/.test(html) && /d\.offsetParent !== null/.test(html), "nur sichtbare oberste Bereiche");
}
// 390. 2.23.41: Neue Gruppe – Bereiche mit Pfeil und Schloss (KC-CLUB-GRUPPE-KLAPPEN)
{
  const v = html.slice(html.indexOf('<section id="v-gruppe"'), html.indexOf('<section id="v-neu"'));
  assert.ok(/<details class="karte" data-klappe="gr_name" data-ohne-unten open><summary>✏️ Name &amp; Symbol<\/summary>/.test(v) && /<details class="karte" data-klappe="gr_wer" open><summary>👤 Wer ist dabei\?<\/summary>/.test(v), "Name/Symbol + Wer ist dabei klappbar");
  assert.ok(/data-klappe="gruppen_\$\{ziel\}" data-ohne-unten open><summary>👥 Deine Gruppen<\/summary>/.test(html) && /klappenMerken\(z\); \/\/ 2\.23\.41/.test(html), "Deine Gruppen klappbar (auch bei Neue Nachricht)");
}
// 391. 2.23.42: Kurz erklärt, Tagestipp, Hilfe und Anleitung V5 zu „Alle auf/zu“ und Neue Gruppe (KC-CLUB-ANLEITUNG-V5)
{
  assert.ok(/oder alle auf einmal mit <b>„▾ Alle auf“<\/b>/.test(html) && /\{ id: "gruppe", sym: "👥", t: "Neue Gruppe", x: /.test(html), "Kurz erklärt: Einstellungen + Neue Gruppe");
  assert.ok(/\{ id: "alle_klappen", sym: "▾"/.test(html) && /jetzt auch bei <b>👥 Neue Gruppe<\/b>/.test(html), "Tagestipps");
  assert.ok(/\{ id: "klappen_alle", thema: "start"/.test(html) && /\{ id: "gruppe_bereiche", thema: "nachrichten"/.test(html) && /"gruppe": \["e:gruppe", "h:gruppe_bereiche"/.test(html), "Hilfe-Zentrum + ?-Zuordnung");
  const v5 = fs.readFileSync(new URL("../dokumente/Koecheclub-App_Anleitung_V5.pdf", import.meta.url));
  assert.ok(v5.subarray(0, 5).toString() === "%PDF-" && v5.length < 9e6, "Anleitung V5 fehlt oder zu groß");
  for (const v of [1, 2, 3, 4]) assert.ok(fs.existsSync(new URL(`../dokumente/Koecheclub-App_Anleitung_V${v}.pdf`, import.meta.url)), `V${v} muss unverändert bleiben`);
  const inh = fs.readFileSync(new URL("../tools/anleitung/inhalt.mjs", import.meta.url), "utf8");
  assert.ok(/anleitung: 5/.test(inh) && /▾ Alle auf \/ ▴ Alle zu/.test(inh) && /titel: "Neue Gruppe"/.test(inh), "Inhalt V5");
  assert.ok(/\{ id: "bedienung-club-app-v5",[^}]*datei: "dokumente\/Koecheclub-App_Anleitung_V5\.pdf"/.test(html) && !/bedienung-club-app-v4/.test(html), "V5 in Meine Dokumente");
}
// 392. 2.23.43: Start-Hinweis bei mehr als 5 Sachen im Eingangskorb (KC-CLUB-EINGANG-HINWEIS)
{
  assert.ok(/case "eingang_zahlen": nurLeitung\(ich\); return json\(await bueroEingang\(ich\)\);/.test(server), "Server: nur Clubleitung, nur Zahlen");
  const f = html.slice(html.indexOf("async function ekHinweisPruefen"), html.indexOf("function ekHinweisOeffnen"));
  assert.ok(/EKH_AB = 6/.test(html) && /if \(summe < EKH_AB\) return;/.test(f) && /catch \{ return; \}/.test(f), "erst ab 6, ohne Verbindung kein Hinweis");
  assert.ok(/✅ Ja, jetzt bearbeiten/.test(f) && /⏰ Später/.test(f) && /🌙 Heute nicht mehr/.test(f) && /localStorage\.setItem\(EKH_HEUTE, heuteIso\(\)\)/.test(f), "Ja / Später / Heute nicht mehr");
  assert.ok(/document\.querySelector\("\.blatt:not\(\.versteckt\)"\) \|\| aktuelleAnsicht !== "start"/.test(f) && /setTimeout\(\(\) => ekHinweisPruefen\(\), 3000\)/.test(html), "beim Start, nicht über andere Fenster");
  assert.ok(/\["dienstzeiten", "📅", "Dienstplan", "Dienstpläne", "Dienstzeiten"\]/.test(html) && /ekHinweisOeffnen\(b\.dataset\.art\)/.test(f) && /Object\.assign\(EKF, \{ jahr: "", monat: "", wer: "", art: art \|\| "", offen: !!art \}\); buStart\(\); buEingang\(\);/.test(html), "Zeile öffnet den Eingangskorb mit Filter");
}
// 393. 2.23.44: Hilfe-Aufruf/Angebot – „Wie veröffentlichen?“ + Anfrage mit Betreff (KC-CLUB-HILFE-KANAELE)
{
  const mig = lies("supabase/migrations/20261005_kc_club_v22344_hilfe_kanaele.sql");
  assert.ok(/kc_club_hilfe_aufrufe add column if not exists kanaele text\[\]/.test(mig) && /kc_club_hilfe_angebote add column if not exists kanaele text\[\]/.test(mig) && /<@ array\['pinnwand', 'push', 'email'\]/.test(mig), "Migration");
  const auf = server.slice(server.indexOf('case "hilfe_aufruf": {'), server.indexOf('case "hilfe_wichtig": {'));
  assert.ok(/kanaele = hilfeKanaele\(p\.kanaele\)/.test(auf) && /\(wege && !wege\.length\) \? \{ gesendet: 0 \}/.test(auf) && /sendenGewaehlt\("club_nachricht", empf, wege,/.test(auf), "Aufruf: nur gewählte Wege, nichts gewählt = nichts senden");
  assert.ok(/function hkHtml\(wo\)/.test(html) && /📣 Wie möchtest du es veröffentlichen\?/.test(html) && /\["pinnwand", "📌 Pinnwand"\], \["push", "🔔 Push"\], \["email", "✉️ E-Mail"\]/.test(html), "Auswahl mehrfach");
  assert.ok(/\$\{hkHtml\("form"\)\}/.test(html) && /\$\{f\.id \? "" : hkHtml\("angebotForm"\)\}/.test(html) && /📣 Angebot veröffentlichen/.test(html) && /📣 Aufruf veröffentlichen/.test(html), "bei Aufruf und Angebot");
  assert.ok(/const pwAufrufAnPinnwand = \(a\) => !a\.kanaele \|\| a\.kanaele\.includes\("pinnwand"\)/.test(html) && /🤲 HILFE ANGEBOTEN/.test(html) && /onclick="angebotDirekt\('\$\{a\.id\}'\)"/.test(html), "Pinnwand: nur gewählt, antippbar");
  assert.ok(/const angebotBetreff = \(a\) => `Dein Angebot „\$\{a\.titel\}“\$\{a\.erstellt_am \? " vom "/.test(html) && /t\.value = `Betreff: \$\{angebotBetreff\(a\)\}/.test(html) && /h\.startsWith\("#angebot="\)/.test(html), "Anfrage mit Betreff + Sprung #angebot=");
}
// 394. 2.23.45: Tipp des Tages „Club-App auch auf Tablet oder PC?“ (KC-CLUB-TIPP-TABLET-PC)
{
  const t = html.slice(html.indexOf('{ id: "tablet_pc"'), html.indexOf('{ id: "farbschemen_neu"'));
  assert.ok(html.indexOf('{ id: "tablet_pc"') < html.indexOf('{ id: "farbschemen_neu"') && /seit: "2\.23\.45"/.test(t), "ganz vorne, gilt als neu");
  assert.ok(/🔢 Mit Code anmelden/.test(t) && /APP_URL_CLUB/.test(t) && /Zum Startbildschirm hinzufügen/.test(t) && /App installieren/.test(t) && /bitte nicht weitergeben/.test(t), "Schritte: Code, Adresse, Startbildschirm, Hinweis");
  assert.ok(/ja: "🔢 Code holen"/.test(t) && /testen: \(\) => kurzcodeBlatt\(\)/.test(t) && /tablet_pc: "technik"/.test(html), "Code holen + Hilfe-Kapitel");
}
// 395. 2.23.46: Clubleitung beim Start – Tages-Übersicht und Eingang-Hinweis an/aus (KC-CLUB-LEITUNG-START-SCHALTER)
{
  assert.ok(/<details class="karte versteckt" data-klappe="leitung_start" id="leitungStart">/.test(html) && /id="setTagesinfo" onchange="leitungStartSetzen\('tagesinfo', this\.checked\)"/.test(html) && /id="setEkHinweis" onchange="leitungStartSetzen\('eingang', this\.checked\)"/.test(html), "zwei Schalter");
  assert.ok(/const key = was === "tagesinfo" \? "kc_buero_frage_aus" : EKH_AUS;/.test(html) && /localStorage\.getItem\("kc_buero_frage_aus"\)/.test(html), "Tages-Übersicht nutzt den vorhandenen Merker (kein zweiter)");
  assert.ok(/!buDarf\(\) \|\| ekhLies\(EKH_AUS\) === "1"\) return;/.test(html) && /if \(v === "einstellungen"\) \{ leitungStartZeigen\(\);/.test(html) && /k\.classList\.toggle\("versteckt", !darf\)/.test(html), "Hinweis respektiert Aus; nur Clubleitung sieht den Bereich");
}
// 396. 2.23.47: 🎤 Diktieren in Feldern (KC-CLUB-DIKTAT-FELD)
{
  for (const id of ["suEingabe", "hzSuche", "pwText", "hfNotiz", "afText"]) assert.ok(new RegExp(`id="${id}"[^>]*data-diktat|data-diktat[^>]*id="${id}"|id="${id}" data-diktat`).test(html), `🎤 an ${id}`);
  assert.ok(/id="suEingabe" data-diktat="einmal"/.test(html) && /id="hzSuche" data-diktat="einmal"/.test(html), "Suchfelder: nach dem ersten Satz fertig");
  const f = html.slice(html.indexOf("function diktatAnbauen("), html.indexOf("// ---------- KC-CLUB-SPRACHE (0.37.0)"));
  assert.ok(/if \(!DIKTAT_GEHT\) return;/.test(f) && /diktatStart\(feld\.id, null, \{ einmal: feld\.dataset\.diktat === "einmal" \}\)/.test(f) && /new MutationObserver/.test(f), "ein Baustein über den vorhandenen Diktier-Kern, nur wenn das Gerät kann");
  assert.ok(/\$\{!ziel \|\| nachSenden \? '<button class="knopf haupt" data-d="senden">📤 Senden<\/button>' : ""\}/.test(html) && /if \(DT\.aktiv && DT\.einmal && DT\.vorher\.length\) return diktatEnde\("fertig"\);/.test(html), "kein Senden in Feldern, Suche endet von selbst");
  assert.ok(/#diktatBlatt\.blatt \{ z-index: 9000; \}/.test(html) && /\{ id: "diktat_feld", thema: "start"/.test(html), "über der Suche + Hilfe");
}
// 397. 2.23.48 → 2.23.49: „🧑‍🍳 Frag Twinkey“ (früher „Frag den Küchenchef“) – Fragen in eigenen Worten (KC-CLUB-TWINKEY)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-TWINKEY (2.23.49"), html.indexOf("// ---------- KC-CLUB-DIKTAT-FELD"));
  assert.ok(k.length > 1000 && /twIndex\(\)/.test(k) && /hzEintraege\(\)/.test(k) && !/fetch\(/.test(k), "Hilfen als Grundlage, keine fremde KI, keine Kosten");
  assert.ok(/const TW_SYN = \[/.test(k) && /function twAbstand\(a, b\)/.test(k) && /zusammengesetzte Wörter/.test(k), "Synonyme, Tippfehler, zusammengesetzte Wörter");
  assert.ok((k.match(/^  \{ id: "[a-z-]+", sym: /gm) || []).length >= 30, "mindestens 30 eigene Fragen + Antworten (TW_FAQ)");
  assert.ok(/id="twFrage" data-diktat="einmal"/.test(k) && /👉 Zeig es mir/.test(k) && /\$\{VORLESE_KNOPF\}/.test(k) && /Oder meintest du:/.test(k), "sprechen, zeigen, vorlesen, Alternativen");
  assert.ok(/\{ id: "twinkey", sym: "🧑‍🍳", t: "Frag Twinkey"/.test(html) && /onclick="twFrageStart\(\)">🧑‍🍳 Frag Twinkey/.test(html) && /\{ id: "frag_twinkey", sym: "🧑‍🍳"/.test(html), "Kachel, Knopf im Hilfe-Zentrum, Tagestipp");
  assert.ok(!/kcFrageStart|kcAnHansi|Frag den Küchenchef"/.test(html), "alter Name „Küchenchef“ ist weg");
}
// 398. 2.23.49: Unbekannte Fragen gehen an den Admin, Antwort per Push/E-Mail/Club-App, Twinkey lernt (KC-CLUB-TWINKEY-FRAGEN)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-TWINKEY (2.23.49"), html.indexOf("// ---------- KC-CLUB-DIKTAT-FELD"));
  assert.ok(/Das ist eine gute Frage\./.test(k) && /Ich werde recherchieren und dir bei Gelegenheit eine Antwort zukommen lassen\./.test(k), "Twinkeys Antwort auf unbekannte Fragen");
  const aw = k.slice(k.indexOf("function twAntworten("), k.indexOf("function twNichtGefunden"));
  assert.ok(/if \(gefragt\) twWeitergeben\(fr\)/.test(aw) && /TW_TAKT=setTimeout\(twAntworten,450\)/.test(k), "weitergegeben wird nur nach ausdrücklichem „Fragen“, nicht beim Tippen");
  assert.ok(/api\("twinkey_frage", \{ frage: fr \}\)/.test(k) && /api\("twinkey_daten"\)/.test(k) && /api\("twinkey_antworten", \{ id, antwort, kanaele/.test(k), "App ruft die Twinkey-Aktionen");
  assert.ok(/TW_WEGE = \[\["app", "📱 In der Club-App"\], \["push", "🔔 Push"\], \["email", "✉️ E-Mail"\]\]/.test(k) && /🧠 Twinkey merkt sich das/.test(k), "Wege + Lernen");
  assert.ok(/id: "w:" \+ w\.id/.test(k) && /esc\(t\)\.replace\(\/\\n\/g, "<br>"\)/.test(k), "Gelerntes kommt in den Index, Antworttext wird maskiert");
  assert.ok(/h === "#twinkey"/.test(html) && /twAntwortPruefen\(\), 6000/.test(html), "Sprung aus Push/Mail + Hinweis beim Start");
  const t = server.slice(server.indexOf('case "twinkey_daten"'), server.indexOf('case "hilfe_angebot_speichern"'));
  assert.ok(/case "twinkey_antworten": \{\n\s+nurAdmin\(ich\);/.test(t) && /case "twinkey_verwerfen": \{\n\s+nurAdmin\(ich\);/.test(t), "Antworten/Verwerfen nur Admin");
  assert.ok(/if \(ich\.admin\) \{/.test(t) && /\.eq\("von", ich\.person_id\)/.test(t), "offene Fragen nur für den Admin, eigene Fragen nur die eigenen");
  assert.ok(/sendenGewaehlt\("club_nachricht", \[f\.von\], wege/.test(t) && /kanaele\.filter\(\(k\) => k !== "app"\)/.test(t), "Antwort nur an die fragende Person, nur auf gewählten Wegen");
  assert.ok(/protokoll\(ich\.person_id, "twinkey_frage", \{ frage_id: neu\.id, versand \}\)/.test(t) && !/protokoll\([^)]*antwort[,:]/.test(t), "Protokoll ohne Inhalte");
  assert.ok(/TWINKEY_OFFEN_MAX/.test(t) && /429\)/.test(t) && !/\.delete\(\)/.test(t), "Bremse gegen Flut, nichts wird gelöscht");
  const mig = lies("supabase/migrations/20261005_kc_club_v22349_twinkey_fragen.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_twinkey_fragen from anon, authenticated/.test(mig) && !/create policy/i.test(mig), "Tabelle nur über den Server");
}
// 399. 2.23.50: Terminanfrage zeigt „Anfrage an …“ und den Stand je Empfänger, Gegenvorschlag (KC-CLUB-TERMINANFRAGE-STATUS)
{
  const st = html.slice(html.indexOf("function taStatus(a, e)"), html.indexOf("const taVWann"));
  for (const w of ["angefragt", "gelesen", "bestätigt", "vielleicht", "abgelehnt", "Gegenvorschlag", "abgelaufen"]) assert.ok(st.includes(`"${w}`), "Stand fehlt: " + w);
  assert.ok(st.indexOf("abgelaufen") < st.indexOf('"gelesen"') && st.indexOf('"bestätigt"') < st.indexOf("abgelaufen"), "Antwort vor abgelaufen, abgelaufen vor gelesen");
  assert.ok(/<b>Anfrage an \$\{esc\(taAnWen\(a\)\)\}<\/b>/.test(html) && /"Anfrage an " \+ esc\(taAnWen\(x\.x\)\)/.test(html), "„Anfrage an …“ in Liste und Kalender");
  assert.ok(/api\("terminanfrage_gelesen", \{ ids: ungelesen \}\)/.test(html) && /!a\.vonMir && !a\.meinGelesen/.test(html), "gelesen nur vom Empfänger gemeldet");
  const g = server.slice(server.indexOf('case "terminanfrage_gelesen"'), server.indexOf('case "erinnerung_setzen"'));
  assert.ok(/\.eq\("person_id", ich\.person_id\)\.in\("anfrage_id", ids\)\.is\("gelesen_am", null\)/.test(g), "gelesen nur eigene Zeilen, nur einmal");
  assert.ok(/if \(a\.spiel_id\) throw/.test(g) && /if \(a\.erstellt_von !== ich\.person_id\) throw new Fehler\("Entscheiden kann nur, wer angefragt hat\.", 403\)/.test(g), "Gegenvorschlag: nicht bei Spielen, entscheiden nur der Absender");
  assert.ok(/erinnerung_gesendet_am: null, kurz_erinnert_am: null/.test(g) && /kc_club_erinnerungen"\)\.update\(\{ gesendet_am: null \}\)/.test(g), "nach dem Verlegen laufen Erinnerungen neu");
  assert.ok(/vorschlag_beginn: null, vorschlag_ende: null \}\) \/\/ Antwort ersetzt einen Gegenvorschlag/.test(server), "Antwort räumt den Gegenvorschlag weg");
  const mig = lies("supabase/migrations/20261005_kc_club_v22350_terminanfrage_status.sql");
  assert.ok(/add column if not exists gelesen_am timestamptz/.test(mig) && /add column if not exists vorschlag_beginn timestamptz/.test(mig) && !/drop column|delete|truncate/i.test(mig.replace(/^--.*$/gm, "")), "nur Spalten ergänzt");
}
// 400. 2.23.51: „👥 Ein Mitglied fragen“ – an alle/einzelne/mehrere, Weg wählen, Antwort-Knöpfe (KC-CLUB-MITGLIEDER-FRAGEN)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-MITGLIEDER-FRAGEN (2.23.51"), html.indexOf("// Admin: offene Fragen beantworten"));
  assert.ok(/👥 Alle Mitglieder/.test(k) && /type="checkbox"/.test(k) && /id="mfSuche"/.test(k) && /TW_WEGE\.map/.test(k), "alle / einzelne / mehrere + Weg");
  for (const t of ["✍️ Antworten", "🔎 Ich recherchiere und antworte dir", "🤷 Ich weiß es nicht", "🚫 Bitte nicht mehr fragen", "Wieder fragen lassen"]) assert.ok(k.includes(t), "Knopf fehlt: " + t);
  assert.ok(/api\("mf_senden", \{ frage: text, an_alle: MF\.alle/.test(k) && /einmal\(this, mfSenden\)/.test(k), "Senden nur mit Knopf, nur einmal");
  assert.ok(/onclick="mfFormular\(/.test(html) && /h === "#mfrage"/.test(html) && /mfNeu/.test(html), "Einstieg bei Twinkey, Sprung aus Push/Mail, Hinweis beim Start");
  const t = server.slice(server.indexOf('case "mf_senden"'), server.indexOf('case "hilfe_angebot_speichern"'));
  assert.ok(/filter\(\(id\) => id !== ich\.person_id && !id\.startsWith\("KC-P-TEST"\)\)/.test(t) && /filter\(\(id\) => aktiv\.includes\(id\)\)/.test(t), "nur aktive Mitglieder, nicht man selbst, keine Testpersonen");
  assert.ok(/mfAusgenommen\(gewaehlt\)/.test(t) && /schluessel: "mitfragen", wert: \{ aus: true \}/.test(t), "„nicht mehr fragen“ wird beachtet und gespeichert");
  assert.ok(/sendenGewaehlt\("club_nachricht", ziel, wege/.test(t) && /kanaele\.filter\(\(k\) => k !== "app"\)/.test(t) && /MF_TAG_MAX/.test(t), "nur gewählte Wege, Bremse");
  assert.ok(/\.eq\("frage_id", f\.id\)\.eq\("person_id", ich\.person_id\)/.test(t) && /\.eq\("von", ich\.person_id\)\.eq\("status", "offen"\)/.test(t), "antworten nur eigene Zeile, schließen nur eigene Frage");
  assert.ok(/protokoll\(ich\.person_id, "mitfrage_antwort", \{ frage_id: f\.id, art, versand \}\)/.test(t) && !/\.delete\(\)/.test(t), "Protokoll ohne Inhalt, nichts wird gelöscht");
  const mig = lies("supabase/migrations/20261005_kc_club_v22351_mitglieder_fragen.sql");
  assert.ok((mig.match(/enable row level security/g) || []).length === 2 && !/create policy/i.test(mig), "Tabellen nur über den Server");
}
// 401. 2.23.52: Hinweis „📨 Du hast eine neue Terminanfrage“ beim Öffnen und zwischendurch (KC-CLUB-TERMINANFRAGE-HINWEIS)
{
  const k = html.slice(html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"), html.indexOf("async function taAntwort("));
  for (const t of ["👀 Ja, jetzt ansehen", "⏰ Später", "🌙 Heute nicht mehr fragen"]) assert.ok(k.includes(t), "Knopf fehlt: " + t);
  assert.ok(/!a\.vonMir && !a\.spiel && a\.status === "offen" && !a\.meine && !a\.meinVorschlag/.test(k), "nur unbeantwortete Anfragen an mich");
  assert.ok(/setInterval\(\(\) => taHinweisPruefen\(9\), TAH_TAKT_MS\)/.test(k) && /visibilitychange/.test(k) && /taHinweisPruefen\(\), 5000\)/.test(html) && /setTimeout\(\(\) => taHinweisPruefen\(9\), 1500\)/.test(html), "beim Start, zurück in der App, nach Push, alle 5 Min.");
  assert.ok(/document\.querySelector\("\.blatt:not\(\.versteckt\)"\)/.test(k) && /if \(still && !neu\.length\) return/.test(k), "drängt sich nicht über Fenster, neue Anfrage durchbricht „später“");
}
// 402. 2.23.53: „Mikrofon ist gesperrt“ – sofort freischalten und weiter diktieren (KC-CLUB-MIKRO-SOFORT)
{
  const k = html.slice(html.indexOf("// KC-CLUB-MIKRO-SOFORT (2.23.53"), html.indexOf("async function diktatStart("));
  for (const t of ["🎙️ Jetzt freischalten", "🔄 Nochmal probieren", "⌨️ Weiter tippen"]) assert.ok(k.includes(t), "Knopf fehlt: " + t);
  assert.ok(/getUserMedia\(\{ audio: true \}\)/.test(k) && /s\.getTracks\(\)\.forEach\(\(x\) => x\.stop\(\)\)/.test(k), "fragt das Handy erneut und gibt das Mikrofon gleich wieder frei");
  assert.ok(/diktatStart\(w\.ziel, w\.nachSenden, \{ einmal: w\.einmal \}\)/.test(k) && /mikroHilfe\(weiter[,)]/.test(html), "danach geht das Diktat im selben Feld weiter");
  assert.ok(/st\.onchange = /.test(k) && /#mikroHilfe\.blatt \{ z-index: 9100; \}/.test(html), "Erlaubnis aus den Einstellungen wird erkannt, Fenster liegt oben");
}
// 403. 2.23.54: Diktieren fragt das Handy direkt – auch bei Stand „gesperrt“ (KC-CLUB-MIKRO-WIE-CHAT)
{
  const mf = html.slice(html.indexOf("async function mikroFreigabe"), html.indexOf("// KC-CLUB-MIKRO-SOFORT (2.23.53"));
  assert.ok(!/if \(zustand === "denied"\) return true;/.test(mf), "„gesperrt“ überspringt die Handy-Abfrage nicht mehr");
  assert.ok(/zustand !== "denied" && !erklaert && !\(await frage\(/.test(mf) && /getUserMedia\(\{ audio: true \}\)/.test(mf), "Erklärung nur beim ersten Mal, dann immer Handy-Abfrage");
}
// 404. 2.23.55: Diktieren – Mikrofon der App vs. Spracherkennung von Google unterscheiden (KC-CLUB-MIKRO-URSACHE)
{
  const k = html.slice(html.indexOf("// KC-CLUB-MIKRO-URSACHE (2.23.55"), html.indexOf("async function diktatStart("));
  assert.ok(/if \(MIKRO_DIAG\.stand === "granted" && IST_ANDROID\) return mikroHilfeGoogle\(\);/.test(k) && /Apps<\/b> → <b>Google<\/b> → <b>Berechtigungen<\/b> → <b>Mikrofon<\/b>/.test(k), "Google-Spracherkennung als Ursache mit Anleitung");
  assert.ok(/🎤 Tastatur-Mikrofon nutzen/.test(k) && /NotReadable\|Abort\|TrackStart/.test(k), "Tastatur-Mikrofon als sicherer Weg, belegt ≠ gesperrt");
  assert.ok(/api\("diagnose", \{ art: "mikro", daten: \{ sprache: MIKRO_DIAG\.sprache/.test(k), "Ursache als Code ins Fehlerprotokoll");
  assert.ok(/if \(zweiter && IST_ANDROID\)[^\n]*mikroHilfeGoogle\(\)/.test(html) && /e\.onresult = \(ev\) => \{ DT\.zweiter = false;/.test(html), "nach erfolgreicher Freigabe erneut gesperrt → Google-Anleitung");
}
// 405. 2.23.56: sichtbarer „🔍 Suchen“-Knopf im Hilfe-Zentrum und in der Lupe (KC-CLUB-SUCHEN-KNOPF)
{
  assert.ok(/id="hzSuche"[^>]*><button type="button" class="knopf haupt such-knopf" onclick="hzSucheKnopf\(\)">🔍 Suchen<\/button>/.test(html), "Knopf im Hilfe-Zentrum");
  assert.ok(/onclick="suSucheKnopf\(\)">🔍 Suchen<\/button>/.test(html), "Knopf in der Lupe-Suche");
  assert.ok(/function hzSucheKnopf\(\)[\s\S]{0,300}hzSuchen\(q\); f\.blur\(\)/.test(html) && /function suSucheKnopf\(\)[\s\S]{0,300}SU\.q = q; f\.blur\(\); suJetzt\(\)/.test(html), "sucht und schließt die Tastatur");
  assert.ok(/onclick="twAntworten\(null,true\)">➤ Fragen<\/button>/.test(html), "Twinkey hat seinen Knopf");
}
// 406. 2.23.57: Gegenvorschlag unter Vorbehalt annehmen, mit kurzem Text (KC-CLUB-ANFRAGE-VORBEHALT)
{
  for (const x of ["✅ Neue Zeit annehmen", "🤔 Unter Vorbehalt", "❌ Passt nicht"]) assert.ok(html.includes(x), "Knopf fehlt: " + x);
  assert.ok(/api\("terminanfrage_vorschlag_entscheiden", \{ id, person_id: pid, annehmen: wahl !== "nein", vorbehalt: wahl === "vorbehalt", text \}\)/.test(html) && /class="ta-vorbehalt"/.test(html), "App schickt Vorbehalt + Text und zeigt ihn an");
  const g = server.slice(server.indexOf('case "terminanfrage_vorschlag_entscheiden"'), server.indexOf('case "erinnerung_setzen"'));
  assert.ok(/if \(vorbehalt && !zusatz\) throw/.test(g) && /vorbehalt: vorbehalt \? zusatz : null/.test(g) && /mitText: !!zusatz \}\)/.test(g), "Vorbehalt braucht Text, wird gespeichert, Protokoll ohne Inhalt");
  assert.ok(/vorbehalt: a\.vorbehalt \?\? null/.test(server) && /add column if not exists vorbehalt text/.test(lies("supabase/migrations/20261005_kc_club_v22357_anfrage_vorbehalt.sql")), "Liste + Migration");
}
// 407. 2.23.58: Terminanfrage im Handy-Kalender, Hinweis nach Verlegen/Absage (KC-CLUB-ANFRAGE-KALENDER)
{
  const k = html.slice(html.indexOf("// KC-CLUB-ANFRAGE-KALENDER (2.23.58"), html.indexOf("function erinKalender("));
  assert.ok(/kal && kal !== a\.beginn/.test(k) && /📅 Neuen Termin eintragen/.test(k) && /löschen 🗑️/.test(k), "verlegt → neuen Termin eintragen + alten löschen");
  assert.ok(/if \(ab\) return kal \?/.test(k) && /📅 \$\{kal \? "Nochmal in den Handy-Kalender" : "In meinen Handy-Kalender"\}/.test(k), "Absage-Hinweis, Knopf");
  assert.ok(/taKalMerken\(t\.id, t\.beginn\)/.test(html) && /UID:anfrage-\$\{t\.id\}@koecheclub-werne/.test(html) && /\(unter Vorbehalt\)/.test(html), "gleiche UID, gemerkte Zeit, Vorbehalt im Titel");
  assert.ok(/x\.vorbehalt \? " – unter Vorbehalt" : ""/.test(server) && /x\.meine === "vielleicht" \|\| x\.vorbehalt \? "TENTATIVE"/.test(server), "Kalender-Abo kennt den Vorbehalt");
}
// 408. 2.23.59: Schulungstermine aus dem Termin-Programm im Club-Kalender (KC-CLUB-SCHULUNGSTERMINE)
{
  const f = server.slice(server.indexOf("async function schulungenListe"), server.indexOf("// ---------- KC-CLUB-SCHULUNG-ADMIN (2.23.60"));
  assert.ok(f.length > 200 && !/\.(insert|update|upsert|delete)\(/.test(f), "nur lesend – das Termin-Programm bleibt führend");
  assert.ok(/eq\("ist_test", false\)/.test(f) && /in\("status", \["vorgemerkt", "bestaetigt"\]\)/.test(f) && /ich\.admin \|\| \(x\.e\.person_ids \?\? \[\]\)\.includes\(ich\.person_id\)/.test(f), "nur gebuchte, keine Tests, Mitglieder nur eigene");
  assert.ok(!/email|phone|telefon/i.test(f), "keine Kontaktdaten");
  assert.ok(/schulungen,\n\s+\}\);/.test(server) && /UID:schulung-\$\{x\.id\}@koecheclub-werne/.test(server), "Kalender + Abo");
  assert.ok(/for \(const x of Q\.schulungen \|\| \[\]\)/.test(html) && /x\.art === "schulung"/.test(html) && /for \(const x of k\.schulungen \|\| \[\]\)/.test(html), "App zeigt sie im Kalender und in Demnächst");
}
// 409. 2.23.60: „🎓 Schulungen“ – Termin-Programm als Admin-Bereich, ein Kern (KC-CLUB-SCHULUNG-ADMIN)
{
  const g = server.slice(server.indexOf('case "schulung"'), server.indexOf('// KC-CLUB-TWINKEY-FRAGEN (2.23.49): Wissen für alle'));
  assert.ok(/nurAdmin\(ich\);/.test(g) && /SCHULUNG_AKTIONEN\.has\(a\)/.test(g), "nur Admin, nur erlaubte Aktionen");
  const f = server.slice(server.indexOf("async function schulungAufruf"), server.indexOf("// ---------- Handy-Kalender (KC-CLUB-KALENDERABO)"));
  assert.ok(/kc_termine_admin_token/.test(f) && /functions\/v1\/kc-termine/.test(f) && /test: false/.test(f), "vorhandener Termin-Baustein, Schlüssel aus dem Vault");
  // 2.23.65: Kalender-Schlüssel ist jetzt erlaubt (Admin, wie im alten Programm – Test 414); Mitglieder-Aktionen bleiben draußen
  assert.ok(!/m_waehlen|m_absagen|m_gegenvorschlag/.test(server.slice(server.indexOf("const SCHULUNG_AKTIONEN"), server.indexOf("async function schulungAufruf"))), "keine Mitglieder-Aktionen");
  assert.ok(/protokoll\(ich\.person_id, "schulung_" \+ a\.slice\(2\), \{\}\)/.test(g), "Club-Protokoll ohne Inhalte");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-SCHULUNG-ADMIN (2.23.60"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  assert.ok(/\{ id: "schulung_admin", sym: "🎓", t: "Schulungen"[^\n]*nur: \(\) => !!ICH\?\.admin/.test(html) && /if \(!ICH\?\.admin\) return;/.test(k), "Kachel und Bereich nur für den Admin");
  for (const x of ["⏳ Wartet auf dich", "➕ Termin anbieten", "📅 Meine Termine", "✉️ Mitglieder einladen", "📨 Einladungen", "📜 Ablauf", "🔗 Link"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  assert.ok(!/\bconfirm\(|\bprompt\(/.test(k), "App-eigene Rückfragen statt Browser-Fenster");
}
// 410. 2.23.61: Besuchsprotokoll in der Club-App (KC-CLUB-BESUCHE)
{
  const g = server.slice(server.indexOf('case "besuch"'), server.indexOf('// KC-CLUB-SCHULUNG-ADMIN (2.23.60): nur Admin'));
  assert.ok(/case "besuch": \{\n\s+nurAdmin\(ich\);/.test(g), "nur Admin");
  assert.ok(!/auswerten|anthropic|ANTHROPIC/i.test(g + server.slice(server.indexOf("// ---------- KC-CLUB-BESUCHE"), server.indexOf("// ---------- Handy-Kalender"))), "keine kostenpflichtige Foto-Auswertung");
  assert.ok(/for \(const f of BESUCH_FELDER\) if \(f in d\)/.test(g) && /schulungAufruf\("t_besuch_termin"/.test(g), "nur erlaubte Felder, Termin über den einen Termin-Baustein");
  const v = server.slice(server.indexOf("async function besuchVersand"), server.indexOf("// ---------- Handy-Kalender"));
  assert.ok(/\{ bcc: \[ich\.person_id\] \}/.test(v) && /persoenlicherOrdner\(l\.person_id/.test(v) && /if \(!da\) await archivTextAblegen/.test(v), "BCC an Hansi, Kopie einmal in den Ordner des Mitglieds");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-BESUCHE (2.23.61"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  for (const x of ["➕ Neuer Besuch", "📅 Geplant", "Gesprächspunkte", "📷 Foto vom Papierprotokoll", "Speichern & senden", "Stunden", "km gesamt"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  assert.ok(!/auswerten/i.test(k) && /\["termine", "📅 Termine & Einladungen"\], \["besuche", "📝 Besuche"\]/.test(html), "ohne Auswertung, zweiter Reiter");
}
// 411. 2.23.62: „🎓 Meine Schulung“ – Mitglieder wählen ihren Termin in der Club-App (KC-CLUB-SCHULUNG-MITGLIED)
{
  const g = server.slice(server.indexOf('case "schulung_meine"'), server.indexOf('// KC-CLUB-BESUCHE (2.23.61): Besuchsprotokoll – nur Admin'));
  assert.ok(/contains\("person_ids", \[ich\.person_id\]\)/.test(g) && /eq\("ist_test", false\)/.test(g), "nur eigene, echte Einladungen");
  assert.ok(/if \(!e \|\| !\(e\.person_ids \?\? \[\]\)\.includes\(ich\.person_id\)\) throw/.test(g) && /person_id: ich\.person_id/.test(g), "Antwort nur für die eigene Einladung");
  assert.ok(/waehlen: "m_waehlen", gegenvorschlag: "m_gegenvorschlag", absagen: "m_absagen", aendern: "m_aendern"/.test(g), "nur die Mitglieder-Aktionen");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-SCHULUNG-MITGLIED (2.23.62"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  for (const x of ["✅ Diesen Termin nehmen", "💬 Kein Termin passt", "✖ Zurzeit kein Besuch", "🔄 Anders wählen", "📅 In meinen Handy-Kalender", "👀 Ja, Termin aussuchen", "🌙 Heute nicht mehr fragen"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  assert.ok(/\{ id: "schulungen", sym: "🎓", t: "Meine Schulung", u: "Termin aussuchen · Zusammenfassungen", aktion: "smStart\(\)"/.test(html) && /smHinweisPruefen\(\), 7000/.test(html), "Kachel aktiv, Hinweis beim Start");
}
// 412. 2.23.63: Schulungen nach Prüfung – kein doppelter Besuch, Stand unbekannt sichtbar, Formular schließt nicht aus Versehen
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-SCHULUNG-ADMIN (2.23.60"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  assert.ok(/scWartet\(\); scTabs\(\);/.test(k) && /function scTabs\(\)/.test(k), "Reiter-Zahl nach dem Zählen");
  assert.ok(/F\.id = r\.besuch\.besuch_id;/.test(k) && /while \(F\.neueFotos\.length\)/.test(k) && /!F\.terminRaus/.test(k), "zweiter Versuch bearbeitet statt neu anzulegen");
  assert.ok((k.match(/f\.onclick = null;/g) || []).length >= 2, "Formulare schließen nicht beim Tippen daneben");
  assert.ok(/SM\.fehler = true/.test(k) && /Nochmal versuchen/.test(k), "Stand unbekannt wird angezeigt");
  const g = server.slice(server.indexOf('case "schulung_meine"'), server.indexOf('case "schulung_antwort"'));
  assert.ok(/catch \{ unvollstaendig = true; \}/.test(g) && /json\(\{ einladungen: liste, unvollstaendig \}\)/.test(g), "Server meldet unvollständigen Stand");
}
// 413. 2.23.64: Admin-Knopf „Schulungen verwalten“ in „Meine Schulung“ (KC-CLUB-SCHULUNG-MITGLIED)
{
  assert.ok(/onclick="\$\('smBlatt'\)\.remove\(\);scStart\(\)">🎓 Schulungen verwalten/.test(html), "Admin kommt aus „Meine Schulung“ zur Verwaltung");
}
// 414. 2.23.65: alles aus dem alten Besuchsprotokoll/Termin-Programm übernommen (Kalender verbinden, Entwurf, Sprung, Ablauf)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-SCHULUNG-ADMIN (2.23.60"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  for (const x of ["Google-Kalender verbinden", "Schlüssel kopieren", "Skript kopieren", "KC_KALENDER_SCHLUESSEL", "Entwurf verwerfen", "Geänderten Termin erneut bestätigen", "✅ Termin bestätigt", "erst nach dem Besuch.", "Mail-Link aktuell", "Technische Linkprüfung"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  assert.ok(/scApi\("t_kalender_schluessel"\)/.test(k) && /"t_kalender_schluessel"\]\);/.test(server), "Kalender-Schlüssel nur über die Admin-Aktion");
  assert.ok(/h\.startsWith\("#besuch="\)\) bsDirekt\(/.test(html) && /async function bsDirekt\(id\) \{ \/\/ #besuch=B-…\n  if \(!ICH\?\.admin\) return;/.test(k), "Sprung #besuch= nur für Admin");
  assert.ok(/lsSetzen\(BS_ENTWURF, ""\); \/\/ Entwurf erledigt/.test(k), "Entwurf wird nach dem Speichern gelöscht");
  assert.ok(/\.sc-blatt \.knoepfe \.knopf, \.sc-blatt \.knopf\.klein \{ width: auto; flex: 0 1 auto;/.test(html) && /class="knoepfe bs-fuss"/.test(k), "schmale Knöpfe nebeneinander, Speichern|Abbrechen in einer Zeile");
}
// 415. 2.23.66: „📅 Festen Termin geben“ – abgesprochener Termin direkt bei den Terminen (KC-CLUB-SCHULUNG-FEST)
{
  const k = html.slice(html.indexOf("// ----- KC-CLUB-SCHULUNG-FEST (2.23.66"), html.indexOf("// ----- Einladungen -----"));
  assert.ok(/id="scFest" onclick="scFestStart\(\)">📅 Festen Termin geben/.test(html), "Knopf bei „Mitglieder einladen“");
  assert.ok(/api\("besuch", \{ a: "speichern", daten, termin_senden: true, termin_abgleich: false \}/.test(k) && /status: "geplant"/.test(k), "gleicher Kern wie geplanter Besuch + Terminbestätigung");
  assert.ok(/await frage\(`Termin fest geben\?/.test(k) && /pids\.length > 3/.test(k) && /in der Vergangenheit/.test(k), "Rückfrage, höchstens 3, nicht in der Vergangenheit");
}
// 416. 2.23.67: 📞 / 🎥 bei jedem Namen in der Mitgliederliste (KC-CLUB-ANRUF-LISTE)
{
  assert.ok(/function mgAnrufKnoepfe\(m\)/.test(html) && /\$\{mgAnrufKnoepfe\(m\)\}/.test(html), "Anruf-Knöpfe in der Liste");
  const f = html.slice(html.indexOf("function mgAnrufKnoepfe(m)"), html.indexOf("function mitgliederZeichnen()"));
  assert.ok(/on \? `anrufen\('\$\{m\.person_id\}'\)` : aus/.test(f) && /on \? `anrufen\('\$\{m\.person_id\}', true\)` : aus/.test(f), "nur online wird angerufen, sonst Erklärung");
  assert.ok(/<div class="mg-akt\$\{ICH\.admin \? " mg-akt3" : ""\}">/.test(html) && /title="App-Link" onclick="linkTeilen/.test(html), "kompakter Block, Admin-Knöpfe bleiben");
}
// 417. 2.23.68: Hinweise zu Schulungsterminen für den Admin (KC-CLUB-SCHULUNG-HINWEIS)
{
  const g = server.slice(server.indexOf('case "schulung_hinweis"'), server.indexOf('case "schulung_meine"'));
  assert.ok(/nurAdmin\(ich\);/.test(g) && /schulungStand\(ich, seit\)/.test(g), "nur Admin, nur lesend");
  assert.ok(/\(kz as any\)\.schulung = await schulungStand\(ich, null\)\.then\(\(x\) => x\.wartet\.length\)\.catch\(\(\) => null\)/.test(server) && /KZ_KACHELN\.schulung_admin = \(\) => kzZahl\("schulung"\)/.test(html), "Zahl auf der Kachel, Fehler → keine Zahl");
  const k = html.slice(html.indexOf("// KC-CLUB-SCHULUNG-HINWEIS (2.23.68, Wunsch Hansi): beim Start"), html.indexOf("// KC-CLUB-TERMINANFRAGE-HINWEIS (2.23.52"));
  for (const x of ["Wartet auf dich", "📅 Steht an", "Neu seit dem letzten Mal", "👀 Jetzt ansehen", "⏰ Später", "🌙 Heute nicht mehr"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  assert.ok(/if \(!ICH\?\.admin \|\| document\.querySelector\("\.blatt:not\(\.versteckt\)"\)\) return;/.test(k) && /scHinweisPruefen\(\), 9000/.test(html), "nur Admin, nicht über offenen Fenstern");
  assert.ok(/^[0-9a-f]{40}$/m.test(lies(".github/deploy/kc-termine.ref").split("\n").filter(Boolean).pop()), "kc-termine-Stand vorgemerkt");
}
// 418. 2.23.69: Schulungstermine rund (Protokoll fehlt, Verschieben, Terminauswahl, 1 Platz, Reihenfolge)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-SCHULUNG-ADMIN (2.23.60"), html.indexOf("// ---------- KC-CLUB-BESUCHE (2.23.61"));
  assert.ok(/📝 Termin war – Protokoll fehlt/.test(k) && /bsAusTermin\('\$\{b\.id\}'\)">📝 Besuch eintragen/.test(k), "Protokoll fehlt mit Knopf");
  assert.ok(/async function scVerschieben\(bid\)/.test(k) && /termin_senden: true, termin_abgleich: true/.test(k) && /mehrere Einladungen/.test(k), "Verschieben über den gleichen Kern, Schutz bei mehreren");
  assert.ok(/slot_ids: SC\.angebot && auswahl\.length < alleFrei\.length \? auswahl\.map/.test(k) && /Diese Termine anbieten:/.test(k), "Terminauswahl beim Einladen");
  assert.ok(/plaetze: 1, gewaehlt: \[\]/.test(k), "1 Platz vorbelegt");
  assert.ok(k.indexOf('data-k="termine"') < k.indexOf('data-k="einladen"') && k.indexOf('data-k="einladen"') < k.indexOf('data-k="anbieten"') && k.indexOf('data-k="anbieten"') < k.indexOf('data-k="einladungen"'), "Reihenfolge");
  assert.ok(/async function schulungProtokollFehlt\(\)/.test(server) && /art: "protokoll"/.test(server), "Server zählt fehlende Protokolle");
}
// 419. 2.23.70: abgesagte Termine in der Besuchsliste getrennt, nichts gelöscht (KC-CLUB-BESUCH-TERMINSTAND)
{
  assert.ok(/\(b as any\)\.termin = st\.includes\("bestaetigt"\) \? "bestaetigt" : st\.includes\("vorgemerkt"\) \? "vorgemerkt" : st\.includes\("storniert"\) \? "abgesagt" : null;/.test(server), "Server liefert Terminstand je Besuch");
  assert.ok(/const abgesagt = \(b\) => b\.status === "geplant" && b\.termin === "abgesagt";/.test(html) && /✖ Abgesagte Termine \(\$\{weg\.length\}\)/.test(html) && /📝 Protokoll fehlt<\/b>/.test(html), "abgesagt unten zugeklappt, Protokoll fehlt sichtbar");
  const g = server.slice(server.indexOf('if (a === "liste") {'), server.indexOf('if (a === "speichern") {'));
  assert.ok(!/delete\(/.test(g), "Liste löscht nichts");
}
// 420. 2.23.71: Besuchsliste – erledigte Besuche zugeklappt über den abgesagten
{
  assert.ok(/🗂️ Vergangene Termine \(\$\{vorbei\.length\}\)/.test(html) && html.indexOf("🗂️ Vergangene Termine") < html.indexOf("✖ Abgesagte Termine"), "Vergangene über Abgesagte");
  assert.ok(/oben = bs\.filter\(\(b\) => b\.status === "geplant"\)/.test(html), "oben nur Geplantes/Protokoll fehlt");
  assert.ok(/<span>🗂️ Besuche \(vergangen\)<\/span>/.test(html) && /<b>\$\{nGeplant\}<\/b><span>📅 geplant<\/span>/.test(html) && /<b>\$\{weg\.length\}<\/b><span>✖ abgesagt<\/span>/.test(html), "Anzahl geplant/vergangen/abgesagt in den Kacheln");
}
// 421. 2.23.71: Pinnwand-Kachel zeigt die Anzahl der Zettel (alle sichtbaren · eigene) – rote Zahl bleibt „neu für mich“
{
  assert.ok(/u: \(\) => PW\.geladen \? `📌 \$\{PW\.zettel\.length\} Zettel · \$\{PW\.meine\} von dir` : "Kurze Zettel · wichtig & erledigt", v: "pinnwand", zahl: \(\) => PW\.offen \|\| 0/.test(html), "Anzahl auf der Kachel, rote Zahl unverändert");
}
// 422. 2.23.72: Mikrofon-Assistent Schritt für Schritt, für mehrere Browser (KC-CLUB-MIKRO-ASSISTENT)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-MIKRO-ASSISTENT (2.23.72"), html.indexOf("async function maPruefen"));
  for (const x of ["WhatsApp öffnen", "Geht in WhatsApp", "Jedes Mal fragen", "sire65.github.io", "Spracherkennung", "Erledigt – jetzt prüfen", "Hansi Bescheid geben"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  for (const b of ["chrome", "samsung", "firefox", "opera", "edge", "safari", "chrome_ios"]) assert.ok(new RegExp("\\b" + b + ": ").test(k), "Browser fehlt: " + b);
  assert.ok(/onclick="\$\('mikroHilfe'\)\.remove\(\);mikroAssistent\(\)">🧭 Schritt für Schritt helfen/.test(html) && /h === "#mikrofon"\) mikroAssistent\(\)/.test(html) && /zeig: \(\) => mikroAssistent\(\)/.test(html), "erreichbar aus Mikrofon-Fenster, Hilfe und Sprung");
}
// 423. 2.23.73: Abstimmung an alle, eine Gruppe oder eine Auswahl (KC-CLUB-ABSTIMMUNG-ZIEL)
{
  assert.ok(/chip\("alle", "👥 Alle"\)\}\$\{chip\("gruppe", "🧑‍🤝‍🧑 Gruppe"\)\}\$\{chip\("auswahl", "☑️ Auswahl"\)\}/.test(html) && /async function vfAuswahl\(\)/.test(html), "Auswahl alle / Gruppe / einzelne");
  assert.ok(/daten\.ziel = \{ art: "gruppe", name: g\.gruppe\.name, ids: g\.personen \}/.test(html) && /daten\.ziel = \{ art: "auswahl", ids: VF_ZIEL\.ids \}/.test(html), "App schickt das Ziel");
  assert.ok(/zielIds = \[\.\.\.new Set<string>\(\[\.\.\.\(Array\.isArray\(p\.ziel\.ids\)/.test(server) && /filter\(\(id: string\) => aktiv\.has\(id\)\), ich\.person_id\]/.test(server), "Server: nur aktive Mitglieder, ich immer dabei");
  assert.ok(/v\.ziel_ids && !v\.ziel_ids\.includes\(ich\.person_id\)\) throw new Fehler\("Diese Abstimmung ist nur für eine bestimmte Gruppe\.", 403\)/.test(server), "nur Zielgruppe stimmt ab");
  assert.ok(/!v\.ziel_ids \|\| v\.ziel_ids\.includes\(ich\.person_id\) \|\| v\.erstellt_von === ich\.person_id \|\| ich\.admin/.test(server), "nur Zielgruppe sieht sie");
  assert.ok(/const ziel = v\.ziel_ids \?\? \(await aktiveMitglieder\(\)\)/.test(server) && /zielIds \?\? \(await aktiveMitglieder\(\)\)/.test(server), "Benachrichtigung + Ergebnis nur an Zielgruppe");
}
// 424. 2.23.74: Küchenterror – die richtige Antwort darf nicht am längsten Text erkennbar sein (KC-CLUB-KUECHENTERROR-FAIR)
{
  const { KT_FRAGEN } = await import(new URL("../lib/kuechenterror/fragen.js", import.meta.url));
  let laengste = 0; const zuLang = [];
  for (const q of KT_FRAGEN) { const lx = Math.max(...q.x.map((x) => x.length)); if (q.r.length > lx) laengste++; if (q.r.length > lx * 1.15) zuLang.push(q.id); }
  assert.ok(laengste / KT_FRAGEN.length <= 0.3, `richtige Antwort zu oft die längste: ${laengste} von ${KT_FRAGEN.length}`);
  assert.deepEqual(zuLang, [], "richtige Antwort deutlich länger als alle falschen");
}
// 425. 2.23.74: „🗓️ Mein Dienst“ – Wunsch → Soll → Ist in einer Kachel (KC-CLUB-MEIN-DIENST)
{
  assert.ok(/\{ id: "mein_dienst", sym: "🗓️", t: "Mein Dienst", u: \(\) => mdUnter\(\), aktion: "mdStart\(\)", nur: \(\) => !einfach\(\) \}/.test(html), "eine Kachel in der erweiterten Ansicht");
  assert.ok(/\{ id: "meindienst", sym: "🗓️", t: "Mein Dienstplan", u: "Meine Dienste", nur: \(\) => einfach\(\), aktion: "dpNurIch\(\)" \}/.test(html), "einfache Ansicht unverändert");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-MEIN-DIENST (2.23.74"), html.indexOf("// ---------- KC-CLUB-MEIN-DIENST (2.23.74") + 6000);
  for (const x of ["📝 Wunschplan", "📅 Sollplan", "⏱️ Istplan", "Noch keine Ist-Zeiten", "dwOeffnen()", "dpNurIch()"]) assert.ok(k.includes(x), "Teil fehlt: " + x);
  const g = server.slice(server.indexOf('case "mein_dienst"'), server.indexOf('case "dienstwunsch_laden"'));
  assert.ok(!/\.(insert|update|upsert|delete)\(/.test(g), "mein_dienst schreibt nichts (DP2 pflegt den Plan)");
}
// 426. 2.23.75: Sperrzeit – Beispiel im Dienstwunsch-Fenster + Prüfung nach jedem gespeicherten Tag (KC-CLUB-SPERRZEIT-PRUEFUNG)
{
  const d = lies("dp2-club/daten.js");
  assert.ok(/sperrePruefen\(s\.entries\);/.test(d) && /kann\.some\(\(k\) => sp\.start < k\.end && sp\.end > k\.start\)\) continue;/.test(d), "Prüfung nach dem Speichern: nur Sperren außerhalb der Kann-Zeit");
  assert.ok(/gemeldet\.has\(schluessel\)/.test(d) && /art: "dw-sperre"/.test(d), "je Tag einmal, Meldung an die Club-App");
  const f = d.slice(d.indexOf("function sperrePruefen"), d.indexOf("K.persistAll = async"));
  assert.ok(!/K\.wishes\s*=|\.splice\(|persistAll\(/.test(f), "Prüfung ändert keine Angaben");
  // Rechenprobe wie im Code: Kann 10–14 + Sperre 14–22 = unnötig; Arzt 12–13 in Kann 10–18 = sinnvoll
  const noetig = (sp, kann) => kann.some((k) => sp.start < k.end && sp.end > k.start);
  assert.ok(!noetig({ start: 14, end: 22 }, [{ start: 10, end: 14 }]) && noetig({ start: 12, end: 13 }, [{ start: 10, end: 18 }]), "Rechenprobe");
  assert.ok(/<p class="dw-tipp">💡 <b>Sperrzeit nur, wenn du innerhalb deiner Kann-Zeit kurz weg musst\.<\/b> Beispiel: Kann 10–18 Uhr, Arzt 13–14 Uhr → Sperrzeit 13–14 Uhr\./.test(html), "Beispiel im Fenster");
  assert.ok(/if \(e\.data\?\.art === "dw-sperre"\) return dwSperreHinweis\(e\.data\.funde\);/.test(html) && /function dwSperreHinweis\(funde\)/.test(html) && /„Sperren ändern“ → „✓ Ich kann an diesem Tag“/.test(html), "Hinweis mit Weg zum Ändern");
}
// 427. 2.23.76: LED-Fenster drucken + Ergebnis an Admin per Push und E-Mail (KC-CLUB-VERBINDUNG-MELDEN)
{
  assert.ok(/onclick="druckStarten\('verbindung'\)">🖨️ Drucken<\/button><button class="knopf" onclick="verbindungMelden\(this\)">📨 An Admin senden/.test(html), "Knöpfe im Admin-Fenster");
  assert.ok(/onclick="verbindungMelden\(this\)">📨 Ergebnis an \$\{esc\(adminName\(\)\)\} senden/.test(html), "Knopf für Mitglieder");
  assert.ok(/verbindung: \{ bauen: \(\) => druckVerbindung\(\) \}/.test(html) && /api\("verbindung_melden", \{ werte, probleme, notiz \}/.test(html), "Druck + Meldung aus einer Quelle (vbBericht)");
  const b = html.slice(html.indexOf("function vbBericht()"), html.indexOf("function druckVerbindung()"));
  assert.ok(/"nicht gemessen"/.test(b) && /: "unbekannt"/.test(b) && !/"OK"|"in Ordnung"/.test(b), "unbekannt nie als OK");
  const g = server.slice(server.indexOf('case "verbindung_melden"'), server.indexOf('case "sicherheit_melden"'));
  assert.ok(/sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\]/.test(g) && /const ziel = await adminIds\(\)/.test(g), "Push und E-Mail an die Admins");
  assert.ok(/"verbindung_gemeldet"\)\.gte\("zeit"/.test(g) && /\(count \?\? 0\) >= 3\) throw/.test(g) && /\.slice\(0, 30\)/.test(g) && /txt\(w\[1\], 200\)/.test(g), "Bremse und Längengrenzen");
}
// 428. 2.23.77: einzelne Personen sperren – Hinweisfenster Wartung / nicht erreichbar (KC-CLUB-PERSON-SPERRE)
{
  assert.ok(/const gesperrt = ich\.admin \? null : await sperreFuer\(ich\.person_id\);[^\n]*\n\s*if \(gesperrt\) return json\(\{ error: SPERRE_TEXT\[gesperrt\.art\] \|\| SPERRE_TEXT\.wartung, gesperrt: gesperrt\.art, bis: gesperrt\.bis \}, 423\);/.test(server), "Server sperrt nach der Anmeldung, nie Admins");
  assert.ok(/Zur Zeit führen wir für Sie Wartungsarbeiten durch\. Bitte versuchen Sie es später nochmals\. Wir bitten um Verständnis\./.test(server), "Wortlaut Wartung");
  assert.ok(/if \(!error\) \{ SPERREN\.zeilen = /.test(server), "Lesefehler sperren nie alle");
  const g = server.slice(server.indexOf('case "sperre_liste"'), server.indexOf('case "wartung_setzen"'));
  assert.equal((g.match(/nurAdmin\(ich\);/g) || []).length, 4, "alle Sperr-Aktionen nur Admin (2.23.79: + sperre_stumm)");
  assert.ok(/x !== ich\.person_id && !admins\.has\(x\)/.test(g) && /aktiv: false, aufgehoben_am: jetzt\(\)/.test(g) && /"person_gesperrt"/.test(g) && /"person_entsperrt"/.test(g), "nicht sich selbst/Admins, Aufheben ohne Löschen, Protokoll");
  assert.ok(/if \(r\.status === 423 && j\?\.gesperrt\) \{ sperreZeigen\(j\.gesperrt, j\.error, j\.bis\);/.test(html) && /function sperreZeigen\(art, text, bis\)/.test(html), "App zeigt das Hinweisfenster");
  assert.ok(/adKnopf\("🔒 Personen sperren", "sperreAuswahl\(\)", true\)/.test(html) && /api\("sperre_setzen", \{ personen: \[\.\.\.gew\]\.map/.test(html) && /api\("sperre_aufheben"/.test(html), "Verwaltung im Wartungs-Blatt");
  const rs = server.slice(server.indexOf("async function routerSendenRoh"), server.indexOf("const r = await fetch(`${SUPA}/functions/v1/kc-communication-router`"));
  assert.ok(/const stumm = \(await sperrenAktuell\(\)\)\.stumm;/.test(rs) && /personIds = personIds\.filter\(\(id\) => !stumm\.has\(id\)\)/.test(rs), "Benachrichtigungen aus: zentral im Versandweg gefiltert");
  assert.ok(/data-s="\$\{esc\(m\.person_id\)\}"/.test(html), "2.23.79: je Person 🔔/📵 zum Anklicken");
  const mig = lies("supabase/migrations/20261005_kc_club_v22377_person_sperre.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_person_sperre from anon, authenticated/.test(mig) && /check \(art in \('wartung', 'stoerung'\)\)/.test(mig), "Tabelle geschützt");
}
// 429. 2.23.78: grüner ✓ oben in langen Fenstern – tippt den einen Bestätigungs-Knopf an (KC-CLUB-BLATT-HAKEN)
{
  const k = html.slice(html.indexOf("const BLATT_HAKEN_WORT"), html.indexOf("let blattXPlan = 0;"));
  assert.ok(/return k\.length === 1 \? k\[0\] : null;/.test(k), "nur bei genau einem Kandidaten");
  assert.ok(/übernehmen\|ok\|okay\|speichern\|fertig\|bestätigen\|anwenden\|verstanden/.test(k) && !/lösch|senden|sperren/i.test(k.slice(0, k.indexOf("function blattHakenZiel"))), "nur Bestätigen – nie Löschen/Senden/Sperren");
  assert.ok(/if \(BLATT_X_OHNE\.has\(b\.id\) \|\| b\.dataset\.ohneX\) continue;/.test(k) && /const sc = blattScroller\(b\); if \(!sc\?\.innen\) continue;/.test(k), "nur lange Fenster, nie Notfall");
  assert.ok(/if \(z && !z\.disabled\) z\.click\(\);/.test(k) && /h\.disabled = z\.disabled;/.test(k), "tippt den echten Knopf an, gesperrt bleibt gesperrt");
  assert.ok(/try \{ blattXPruefen\(\); \} catch \{\} try \{ blattHakenPruefen\(\); \} catch \{\}/.test(html), "im selben Fenster-Kern wie das ✕");
  assert.ok(/\.blatt-haken \{ margin-right: auto;/.test(html), "links in der Leiste, ✕ bleibt rechts");
}
// 430. 2.23.79: Sperren in drei Schritten, bis Uhrzeit, 🔔/📵 je Person (KC-CLUB-PERSON-SPERRE Stufe 2)
{
  const k = html.slice(html.indexOf("async function sperreAuswahl()"), html.indexOf("async function sperreAufheben("));
  const i1 = k.indexOf("① Was sehen die Gesperrten?"), i2 = k.indexOf("② Bis wann?"), i3 = k.indexOf("③ Wer?");
  assert.ok(i1 > 0 && i2 > i1 && i3 > i2, "Reihenfolge ① Was → ② Bis wann → ③ Wer");
  assert.ok(/\["frei", "🔓 Bis ich freigebe"\], \["zeit", "🕘 Bis Uhrzeit"\]/.test(k) && /muss in der Zukunft liegen/.test(k), "Uhrzeit wählbar und geprüft");
  assert.ok(/gew\.set\(id, !\(gew\.get\(id\) === true\)\)/.test(k), "Symbol schaltet je Person und kreuzt mit an");
  assert.ok(/const sperreGilt = \(x: \{ bis: string \| null \}\) => !x\.bis \|\| Date\.parse\(x\.bis\) > Date\.now\(\);/.test(server), "abgelaufene Sperre gilt sofort nicht mehr");
  const g = server.slice(server.indexOf('case "sperre_setzen"'), server.indexOf('case "sperre_aufheben"'));
  assert.ok(/t > Date\.now\(\) \+ 30 \* 86400000/.test(g) && /stumm: wahl\.get\(id\) === true, bis/.test(g) && /case "sperre_stumm"/.test(g) && /"person_sperre_stumm"/.test(g), "Server: bis ≤ 30 Tage, stumm je Person, umschaltbar mit Protokoll");
  assert.ok(/onclick="sperreStumm\('\$\{esc\(x\.person_id\)\}', \$\{!x\.stumm\}, this\)"/.test(html), "in der Liste umschaltbar");
  assert.ok(/Voraussichtlich wieder erreichbar: /.test(html), "Sperrfenster nennt die Uhrzeit");
  assert.ok(/data-q="alle">👥 Alle</.test(k) && /MG_GRUPPEN\.map\(\(g, i\) => `<button type="button" class="chip" data-q="g\$\{i\}">/.test(k) && /data-q="leise"/.test(k), "Schnellwahl Alle / Gruppe / alle ohne Push");
  assert.ok(/add column if not exists bis timestamptz/.test(lies("supabase/migrations/20261005_kc_club_v22379_sperre_bis.sql")), "Migration");
}
// 431. 2.23.80: Pfeil an der Nachricht – Ausschneiden, Archivieren, Löschen (KC-CLUB-PFEIL-MENUE)
{
  const k = html.slice(html.indexOf("function naPfeilMenue(id)"), html.indexOf("async function naKopieren(id)"));
  for (const x of ["weiterleitenBlatt(", "naKopieren(", "naAusschneiden(", "naInsArchiv(", "naLoeschenFragen("]) assert.ok(k.includes(x), "Pfeil-Menü: " + x);
  assert.ok(/async function naAusschneiden\(id\) \{ await naKopieren\(id\); naLoeschenFragen\(id\); \}/.test(html), "Ausschneiden = kopieren + gewohnte Lösch-Rückfrage");
  assert.ok(/archivAblageFragen\("nachricht", /.test(html) && /nachricht: \{ sym: "💬", register: \["Chats", "Sonstiges"\]/.test(html), "Archiv über den Ablage-Kern");
  assert.ok(/\.na-pfeil-knoepfe \{ display: grid; grid-template-columns: 1fr 1fr;/.test(html), "schmal nebeneinander");
  assert.ok(/m\.eigen \|\| ICH\?\.admin \? `<button class="knopf" onclick="\$\{zu\}naWichtig\(/.test(k), "❗ Wichtig nur eigene / Admin");
  const w = server.slice(server.indexOf('case "nachricht_wichtig"'), server.indexOf('case "gemerkte_nachrichten"'));
  assert.ok(/m\.sender_person_id !== ich\.person_id && !ich\.admin\) throw/.test(w) && !/senden|routerSenden/.test(w), "Server: nur Verfasser/Admin, keine Benachrichtigung");
  assert.ok(/druckStarten\('chat'\)">🖨️ Ausdrucken/.test(html) && /chatKopieren\(\)">📋 Kopieren/.test(html) && /chat: \{ bauen: \(\) => druckChat\(\) \}/.test(html), "Ganzer Chat: kopieren + drucken im ⋮-Menü");
}
// 432. 2.23.81: Wochenbericht für die Admins – montags automatisch, Vorschau + jetzt senden (KC-CLUB-WOCHENBERICHT)
{
  const w = server.slice(server.indexOf("async function wochenberichtBauen()"), server.indexOf("async function adminIds(): Promise<string[]> {"));
  assert.ok(/sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\]/.test(w) && /ziel = await adminIds\(\)/.test(w), "Push + E-Mail an die Admins");
  assert.ok(/if \(tag !== "Mon" \|\| berlinStunde\(new Date\(\)\) < 8\) return;/.test(w) && /x\.details\?\.erzwungen === false/.test(w), "montags ab 8 Uhr, einmal");
  assert.ok(/"❔ unbekannt"/.test(w) && /"unbekannt"/.test(w), "unbekannt nie als OK");
  assert.ok(!/\.text\b.*nachricht|message_text|\.inhalt/.test(w), "keine Inhalte");
  assert.ok(/await wochenberichtLauf\(\)\.catch/.test(server), "läuft im Zeitplaner");
  const c = server.slice(server.indexOf('case "wochenbericht"'), server.indexOf('case "communicator_status"'));
  assert.ok(/nurAdmin\(ich\);/.test(c) && /\(count \?\? 0\) >= 3\) throw/.test(c), "nur Admin, Bremse");
  assert.ok(/adKnopf\("📊 Wochenbericht", "wbAnsehen\(\)", true\)/.test(html) && /api\("wochenbericht", \{ senden: true \}/.test(html), "Knöpfe im Admin-Register");
}
// 433. 2.23.82: „🔐 Meine Daten“ in Meins – nur eigene Daten, ansehen, drucken, als Datei sichern (KC-CLUB-MEINE-DATEN)
{
  assert.ok(/\{ id: "meinedaten", sym: "🔐", t: "Meine Daten", u: "Was ist über mich gespeichert\?", aktion: "mdatStart\(\)" \}/.test(html), "Kachel in Meins");
  const c = server.slice(server.indexOf('case "meine_daten"'), server.indexOf('case "aenderung_start"'));
  assert.ok(!/\.(insert|update|upsert|delete)\(/.test(c.replace(/await protokoll\([^)]*\)/, "")), "nur lesend");
  assert.ok(!/token|endpoint|subscription"|neu_token/.test(c) && /const pid = ich\.person_id/.test(c), "keine Schlüssel/Geräte-Adressen, nur die eigene Person");
  assert.ok(!/p\.(person|id|pid)\b/.test(c), "keine fremde Person abfragbar");
  assert.ok(/meinedaten: \{ bauen: \(\) => druckMeineDaten\(\) \}/.test(html) && /function mdatSichern\(\)/.test(html) && /aeStart\(\)">✏️ Änderung melden/.test(html), "drucken, sichern, Änderung melden");
}
// 434. 2.23.83: Club-Rezeptbuch – Portionen umrechnen, Einkaufsliste, drucken, teilen (KC-CLUB-REZEPTBUCH)
{
  assert.ok(/\{ id: "rezepte", sym: "📖", t: "Rezeptbuch",[^\n]*aktion: "rzStart\(\)"/.test(html), "Kachel im Verein");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-REZEPTBUCH (2.23.83"), html.indexOf("// ---------- KC-CLUB-MEINE-DATEN (2.23.82"));
  // Zutaten-Zeilen lesen und umrechnen (wie im Code)
  const rzZahl = new Function("return " + k.slice(k.indexOf("function rzZahl"), k.indexOf("function rzZeileLesen")).trim())();
  const RZ_EINHEIT = new Function("return " + /const RZ_EINHEIT = (\/[^\n]*\/i);/.exec(k)[1])();
  const rzZeileLesen = new Function("rzZahl", "RZ_EINHEIT", "return " + k.slice(k.indexOf("function rzZeileLesen"), k.indexOf("function rzMenge")).trim())(rzZahl, RZ_EINHEIT);
  assert.deepEqual(rzZeileLesen("500 g Mehl"), { m: 500, e: "g", n: "Mehl" });
  assert.deepEqual(rzZeileLesen("1 1/2 EL Öl"), { m: 1.5, e: "EL", n: "Öl" });
  assert.deepEqual(rzZeileLesen("½ TL Salz"), { m: 0.5, e: "TL", n: "Salz" });
  assert.deepEqual(rzZeileLesen("2 Eier"), { m: 2, e: "", n: "Eier" });
  assert.deepEqual(rzZeileLesen("Salz und Pfeffer"), { m: null, e: "", n: "Salz und Pfeffer" });
  assert.ok(/RZ\.port \/ r\.portionen/.test(k) && /function rzEinkauf\(id\)/.test(k) && /rezept: \{ bauen: \(o, id\) => druckRezept\(id\) \}/.test(html), "umrechnen, Einkaufsliste, Drucken");
  const s = server.slice(server.indexOf('case "rezepte_liste"'), server.indexOf('case "boerse_liste"'));
  assert.ok(/alt\.von !== ich\.person_id && !ich\.admin\) throw new Fehler\("Ändern darf nur/.test(s) && /alt\.von !== ich\.person_id && !ich\.admin\) throw new Fehler\("Löschen darf nur/.test(s), "ändern/löschen nur eigene (Admin alle)");
  assert.ok(/geloescht_am: jetzt\(\)/.test(s) && !/\.delete\(\)/.test(s) && !/senden\(|routerSenden/.test(s), "nichts löschen, nichts an alle schicken");
  assert.ok(/startsWith\(`club\/\$\{ich\.person_id\}\/`\)/.test(s), "nur eigene Fotos");
  assert.ok(/from\("kc_club_rezepte"\)\.select\("id"\)\.eq\("foto", att\.id\)\.is\("geloescht_am", null\)/.test(server), "Rezeptfotos für alle sichtbar");
  const mig = lies("supabase/migrations/20261005_kc_club_v22383_rezeptbuch.sql");
  assert.ok(/enable row level security/.test(mig) && /revoke all on kc_club_rezepte from anon, authenticated/.test(mig), "Tabelle geschützt");
}
// 435. 2.23.84: Gesamtprüfung 3 – nichts breiter als der Bildschirm, lange Wörter sauber getrennt, kein Absturz bei unvollständiger Antwort
{
  assert.ok(/\.modus3 \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/.test(html) && /\.umschalter button \{ min-width: 0;/.test(html), "Umschalter passen auch bei großer Schrift");
  assert.ok(/\.hz-inhalt button > span:nth-child\(3\) \{ flex: 1; min-width: 0;/.test(html), "Hilfe-Inhalt ragt nicht über den Rand");
  assert.ok(/:root\.gross \.mg-schalter \.umschalter button \{ white-space: normal;/.test(html), "Mitglieder-Umschalter bei großer Schrift");
  const trennen = new Function("return " + /const kachelTrennen = (\(t\) => [^\n]*);/.exec(html)[1])();
  assert.equal(trennen("Bedienungsanleitung Club-App"), "Bedienungs­anleitung Club-App");
  assert.equal(trennen("Schnellanleitung Bilderrechner"), "Schnell­anleitung Bilder­rechner");
  assert.ok(/const w = MD_D\?\.wunsch \|\| \{\}/.test(html) && /d = \{ \.\.\.d, rollen: d\?\.rollen \|\| \{\}/.test(html), "Mein Dienst / Meine Daten stürzen nicht ab");
}
// 436. 2.23.85: 30 Koch-Figuren als Mitgliederbild (KC-CLUB-AVATAR)
{
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-AVATAR (2.23.85"), html.indexOf("// ---------- KC-CLUB-KREISE (0.60.0)"));
  const AV = new Function("const AV_HAAR_X = 0;" + k + "; return { AV_FIGUREN, avatarSvg, avTeile };")();
  const codes = Object.keys(AV.AV_FIGUREN);
  assert.equal(codes.length, 30, "30 Figuren"); assert.equal(codes.filter((c) => c[0] === "w").length, 15, "15 Köchinnen");
  for (const c of codes) assert.ok(/^<svg viewBox="0 0 64 64"/.test(AV.avatarSvg(c)) && !/<image|href=|url\(/.test(AV.avatarSvg(c)), "selbst gezeichnet, keine fremden Bilder: " + c);
  assert.equal(AV.avatarSvg("x99"), "", "unbekannter Code → nichts");
  assert.ok(/avGueltig\(fig\) \? avatarSvg\(fig, groesse - 8\) \+ abz : esc\(initialen\(name\)\)/.test(html), "Kreis zeigt Figur, sonst Buchstaben");
  assert.ok(/\{ id: "avatar", sym: "🧑‍🍳", t: "Mein Bild",/.test(html) && /api\("einstellung_setzen", \{ schluessel: "avatar", wert: \{ figur \} \}\)/.test(html), "Auswahl in Meins");
  assert.ok(/avatar: \(w\) => \(\{ figur: typeof w\?\.figur === "string" && \(\/\^\[wm\]\(0\[1-9\]\|1\[0-5\]\)\$\/\.test\(w\.figur\)/.test(server) && /avatar: avatar\.get\(m\.person_id\) \?\? null/.test(server), "Server prüft den Code, liefert ihn in der Mitgliederliste");
}
// 437. 2.23.86: Freigaben für neue Funktionen + Figur selbst zusammenstellen (KC-CLUB-FREIGABE, KC-CLUB-AVATAR-BAUKASTEN)
{
  assert.ok(/rezepte: \{ t: "📖 Rezeptbuch",[^\n]*standard: "admin" \}/.test(server) && /avatar: \{ t: "🧑‍🍳 Mein Bild[^\n]*standard: "alle" \}/.test(server) && /avatar_baukasten: \{[^\n]*standard: "admin" \}/.test(server), "Rezeptbuch + Baukasten erst Test, Figuren frei");
  for (const c of ['case "rezepte_liste": {', 'case "rezept_speichern": {', 'case "rezept_loeschen": {']) assert.ok(server.includes(c + '\n        await nurWennFrei("rezepte", ich, "Das Rezeptbuch");'), "Server sperrt Rezeptbuch ohne Freigabe: " + c);
  const fg = server.slice(server.indexOf('case "freigaben_liste"'), server.indexOf('case "communicator_status"'));
  assert.equal((fg.match(/nurAdmin\(ich\);/g) || []).length, 2, "Freigaben nur Admin"); assert.ok(/"funktion_freigabe"/.test(fg), "Protokoll");
  assert.ok(/freigaben: await freigaben\(\),/.test(server) && /const frei = \(id\) => !!ICH\?\.admin \|\| INIT\?\.freigaben\?\.\[id\] === "alle";/.test(html), "App blendet nicht Freigegebenes aus");
  assert.ok(/aktion: "rzStart\(\)", nur: \(\) => frei\("rezepte"\) \}/.test(html) && /aktion: "avWahl\(\)", nur: \(\) => frei\("avatar"\) \}/.test(html), "Kacheln hängen an der Freigabe");
  assert.ok(/\["freigaben", "🚦", "Freigaben", "app"\]/.test(html) && /api\("freigabe_setzen", \{ funktion: id, fuer \}/.test(html), "Admin-Kachel Freigaben");
  assert.ok(/fig\.startsWith\("b"\) \? "avatar_baukasten" : "avatar"/.test(server), "Baukasten-Figur nur mit Freigabe speicherbar");
  const k = html.slice(html.indexOf("// ---------- KC-CLUB-AVATAR (2.23.85"), html.indexOf("// KC-CLUB-FREIGABE (2.23.86, Wunsch Hansi): neue Funktionen nur sichtbar"));
  const AV = new Function(k + "; return { avTeile, avatarSvg };")();
  assert.ok(AV.avTeile("b012300000") && /^<svg/.test(AV.avatarSvg("b482311b71")), "Baukasten-Code wird gezeichnet");
  assert.equal(AV.avTeile("bz00000000"), null, "ungültiger Code → nichts"); assert.equal(AV.avTeile("b0000000002"), null, "zu lang → nichts");
}
// 438. 2.23.87: 📞/🎥 auf der Mitglieder-Kachel (aktiv bei online) + Startseiten-Kacheln klein, 3 nebeneinander (Einstellung)
{
  const k = html.slice(html.indexOf("function mgKachelnHtml(liste)"), html.indexOf("// KC-CLUB-MG-GRUPPEN (1.34.0"));
  assert.ok(/\$\{mgAnrufKnoepfe\(m\)\}<\/span>/.test(k), "Kachel nutzt denselben Anruf-Baustein wie die Liste");
  assert.ok(/const on = !!m\.online[\s\S]{0,400}mg-aus/.test(html.slice(html.indexOf("function mgAnrufKnoepfe"))), "aktiv nur bei online, sonst blass");
  assert.ok(/\$\("raster"\)\.classList\.toggle\("klein3", reg !== "admin" && !einfach\(\) && kachelKlein\(\)\)/.test(html), "klein nur in der erweiterten Ansicht");
  assert.ok(/#raster\.klein3, #raster\.ad-raster \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/.test(html), "gleiche Regeln wie das Admin-Register (kein zweites Raster)");
  assert.ok(/id="kachelGroesseWahl"/.test(html) && /localStorage\.setItem\("kc_club_kachelgroesse", g\)/.test(html) && /try \{ return localStorage\.getItem\("kc_club_kachelgroesse"\) === "klein"; \} catch \{ return false; \}/.test(html), "Einstellung je Gerät, sicher ohne Speicher");
}
// 439. 2.23.88: Wege der Mitglieder – was geöffnet, mit wem, Uhrzeit; nie Inhalte; 30 Tage; nur Admin (KC-CLUB-SPUR)
{
  const f = server.slice(server.indexOf('case "spur_melden"'), server.indexOf('case "spur_liste"'));
  assert.ok(/SPUR_WAS\.test\(String\(x\[1\]/.test(f) && /SPUR_MIT\.test\(String\(x\[2\]\)\)/.test(f) && /\.slice\(0, 200\)/.test(f) && /protokoll\(ich\.person_id, "spur", \{ s \}\)/.test(f), "nur Kürzel + Kennungen, gedeckelt, je Person");
  assert.ok(/const SPUR_WAS = \/\^\[a-z\]\[a-z0-9_\]\{0,29\}\$\/;/.test(server) && /const SPUR_MIT = \/\^\(KC-P-/.test(server), "kein freier Text möglich");
  const l = server.slice(server.indexOf('case "spur_liste"'), server.indexOf("// ----- KC-CLUB-NUTZUNG (0.99.0)"));
  assert.ok(/^case "spur_liste": \{\s+nurAdmin\(ich\);/.test(l), "lesen nur der Admin");
  assert.ok(!/body|text/.test(l.replace(/Fehler\([^)]*\)/g, "")), "keine Nachrichteninhalte in der Liste");
  assert.ok(/\.eq\("aktion", "spur"\)\.lt\("zeit", new Date\(Date\.now\(\) - SPUR_TAGE \* 86400000\)/.test(server) && /const SPUR_TAGE = 30;/.test(server), "30 Tage, Wartung löscht");
  const n = server.slice(server.indexOf('case "nutzung_melden"'), server.indexOf('case "nutzung_statistik"'));
  assert.ok(!/protokoll\(|spur/.test(n.split("\n").filter((z) => !z.trim().startsWith("//")).join("\n")), "namenlose Nutzung bleibt ohne Namen");
  const c = html.slice(html.indexOf("const SPUR_MAX"), html.indexOf("const SPW = {"));
  assert.ok(/api\("spur_melden", \{ s: teil \}\)/.test(c) && /SPUR\.slice\(-SPUR_MAX\)/.test(c), "App schickt Pakete, begrenzt");
  assert.ok(/spur\("mitglied", pid\)/.test(html) && /spur\("chat", id\)/.test(html) && /spur\(daten\.anlagen\.length \? "gesendet_anlage" : "gesendet", r\?\.id \|\| chatId\)/.test(html)
    && /spur\(mitBild \? "video" : "anruf", pid\)/.test(html) && /spur\("anklopfen", pid\)/.test(html) && /spur\('telefon', mitgliedId\)/.test(html), "Mitglied, Chat, gesendet, Anruf, Anklopfen, Telefon");
  assert.ok(!/spur\([^)]*(text|\$\("text"\))/.test(html), "nie Text in der Spur");
  assert.ok(/onclick="spurAdmin\(heuteIso\(\), null\)">👣 Wege der Mitglieder/.test(html), "Admin: Nutzung → Wege der Mitglieder");
  assert.ok(/id: "was_gespeichert", thema: "privat"[^\n]*30 Tage lang[^\n]*ohne Inhalte[^\n]*nur der Admin/.test(html), "Satz in der Hilfe");
  assert.ok(!/was_gespeichert|spurAdmin/.test(html.slice(html.indexOf("function mdatAbschnitte"), html.indexOf("function mdatAbschnitte") + 4000)), "nicht in „Meine Daten“");
}

// 440. 2.23.89: Abzeichen am Bild, Anwesenheitstafel, Bild groß, eigenes Foto (KC-CLUB-AVATAR-ABZEICHEN, -ANWESENHEIT, -AVATAR-FOTO)
{
  assert.ok(/k\.art !== "unbekannt" \? `<i class="k-abz a-\$\{k\.art\}"/.test(html) && /\.k-abz\.a-online \{ background: #1e8449; \}/.test(html), "Abzeichen, nie bei unbekannt");
  assert.ok(/const MG_ANSICHTEN = \["kacheln", "liste", "tafel"\];/.test(html) && /function mgTafelHtml\(liste\)/.test(html) && /if \(MG_ANSICHT === "tafel"\) \{ \$\("mitgliederListe"\)\.innerHTML = mgTafelHtml\(liste\); return; \}/.test(html), "Tafel als dritte Ansicht");
  const t = html.slice(html.indexOf("function mgTafelHtml"), html.indexOf("function mgKachelnHtml"));
  assert.ok(/onclick="mitgliedOeffnen\(/.test(t) && !/anrufen|anklopfen|nachricht/i.test(t.replace(/\/\/[^\n]*/g, "")) && /class="mg-led l-\$\{k\.art\}"/.test(t), "nur Name + LED, antippen öffnet das Mitglied");
  assert.ok(/data-a="tafel" onclick="mgAnsichtSetzen\('tafel'\)"/.test(html), "Umschalter 📋");
  assert.ok(/kreis\(mm, m\.name, 96, avGueltig\(avFigurVon\(mm\)\) \? `onclick="avGross\(/.test(html) && /function avGross\(pid\)/.test(html), "Bild oben auf der Mitglieds-Seite, antippen = groß");
  assert.ok(/avfWaehlen\('selfie'\)/.test(html) && /i\.setAttribute\("capture", "user"\)/.test(html) && /avfWaehlen\('galerie'\)/.test(html) && /avfWaehlen\('datei'\)/.test(html), "Selfie, Galerie, Datei");
  assert.ok(/c\.width = c\.height = 256/.test(html) && /url\.length > 70000/.test(html), "App verkleinert auf 256×256, begrenzt");
  const f = server.slice(server.indexOf('case "avatar_foto_setzen"'), server.indexOf('case "einstellung_setzen"'));
  assert.ok(/await nurWennFrei\("avatar_foto"/.test(f) && f.includes("data:image\\/jpeg;base64,\\/9j\\/") && /bild\.length > AVF_MAX/.test(f) && /\(count \?\? 0\) >= 10/.test(f), "Server: nur freigegeben, nur JPEG, Größe, Bremse");
  assert.ok(/case "avatar_foto_entfernen": \{\s+nurAdmin\(ich\);/.test(f), "Entfernen nur Admin");
  assert.ok(/avatar_foto: \{ t: "📷 Eigenes Foto als Bild"[^\n]*standard: "admin" \}/.test(server), "erst nur für den Admin (Freigabe)");
  assert.ok(/if \(!fig \|\| !AVF_CODE\.test\(fig\)\) await db\.from\("kc_club_person_einstellung"\)\.delete\(\)\.eq\("person_id", ich\.person_id\)\.eq\("schluessel", "avatar_foto"\)/.test(server), "anderes Bild gewählt → Foto gelöscht");
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
  assert.ok(/los: \(\) => taForm\(\)/.test(html) && /function taForm\(/.test(html) && /function taAntwort\(/.test(html), "App: Anfrage-Formular/Antwort fehlt");
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
  assert.ok(/catch \(e\) \{[^]{0,1000}fpApiFehler\(action, e\); throw e; \/\/ KC-CLUB-FEHLERPROTOKOLL\n  \}/ /* 2.0.0: länger */.test(html), "Serverfehler werden nicht protokolliert");
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
  assert.ok(/id="emoKnopf"[^>]*onclick="emoUmschalten\((undefined, 'text')?\)"/.test(html) /* 1.94.0: Ziel ausdrücklich (Test 275) */ && /id="emoFeld"/.test(html), "Emoji-Knopf/Feld fehlt");
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
  assert.ok(/los: \(\) => neuTermin\(\)/.test(html) && /function privatForm\(/.test(html) && /🔒 Privat<\/b> – nur ich sehe diesen Termin/.test(html), "App: Neu mit Häkchen Privat fehlt");
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
  assert.ok(/async function gruppeLoeschen\((gefragt)?\)[\s\S]{0,700}frage\(/.test(html), "App: Rückfrage vor dem Löschen fehlt");
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
  assert.ok(/class="su-klein" id="suLupe" onclick="sucheAuf\(\)"[^>]*>🔍/.test(html) && /suLupenEinbauen(\(\);|\])/.test(html) && !/id: "suche"/.test(html), "App: kleine Lupe (keine Kachel)"); // 2.0.0: Startschritte einzeln abgesichert
  assert.ok(/SU\.timer = setTimeout\(suJetzt, 300\)/.test(html) && /function suFilterZeigen\(/.test(html) && /Wo suchen\?/.test(html), "App: Live-Suche/Filter fehlt");
}

// 130. 1.4.1: Archiv-Suche live (KC-CLUB-ARCHIV-SUCHE)
{
  assert.ok(/if \(arSuchLang\(q\)\) return arSuchErgebnis\(q\);/.test(html) && /const arSuchLang = \(q\) => suNorm\(q\)\.replace\(\/\\s\/g, ""\)\.length >= 2;/.test(html), "Archiv: Live-Suche ab 2 Buchstaben");
  assert.ok(/function arPasstAlle\(q, \.\.\.felder\) \{ const n = suNorm\(/.test(html), "Archiv: Umlaut-tolerant wie globale Suche");
  assert.ok(/id="arOrdnerSuche"[^>]*oninput="AR\.ordnerSuche=this\.value;arOrdnerListe\(\)"/.test(html), "Archiv: Suche im Ordner fehlt");
  assert.ok(/t\.split\(muster\)\.map\(\(teil, i\) => i % 2 \? `<mark>\$\{esc\(teil\)\}<\/mark>` : esc\(teil\)\)/.test(html), "Markierung muss vor dem Escapen teilen");
}

// 349. 2.23.0: Hilfe-Zentrum (KC-CLUB-HILFEZENTRUM) – alle Tipps/Hinweise nach Themen, Kachel im Register Technik, passt sich selbst an
{
  const block = (start, ende = "\n];") => { const i = html.indexOf(start); assert.ok(i >= 0, `${start} fehlt`); return html.slice(i, html.indexOf(ende, i)); };
  const themen = new Set([...block("const HILFE_THEMEN = [").matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]));
  assert.ok(themen.size >= 8 && themen.has("weitere") && themen.has("bereiche"), "Themen fehlen (inkl. Auffang „weitere“ und „bereiche“)");
  const zuordnung = Object.fromEntries([...block("const HILFE_TIPP_THEMA = {", "\n};").matchAll(/([a-z_]+): "([a-z]+)"/g)].map((m) => [m[1], m[2]]));
  // jeder Tipp des Tages hat ein bekanntes Thema – neue Tipps landen sonst nur unter „Weitere Tipps“
  for (const m of block("const TIPPS = [").matchAll(/\n  \{ id: "([a-z_]+)"(?:, thema: "([a-z]+)")?/g)) {
    const th = m[2] || zuordnung[m[1]];
    assert.ok(th && themen.has(th), `Tipp „${m[1]}“ hat kein Hilfe-Thema (HILFE_TIPP_THEMA ergänzen)`);
  }
  const hilfe = [...block("const HILFE = [").matchAll(/\n  \{ id: "([^"]+)", thema: "([^"]+)", sym: "[^"]+", t: "[^"]+", x: /g)];
  assert.ok(hilfe.length >= 25, "zu wenige Hilfetexte");
  assert.equal(new Set(hilfe.map((m) => m[1])).size, hilfe.length, "Hilfe-IDs doppelt");
  for (const [, id, th] of hilfe) { assert.match(id, /^[a-z_]+$/, `Hilfe-ID „${id}“ (wird in onclick verwendet)`); assert.ok(themen.has(th), `Hilfe „${id}“: Thema „${th}“ unbekannt`); }
  assert.ok(/kachel_lang", thema: "start"[^\n]*lange/.test(html) && /id: "farbe", thema: "darstellung"[^\n]*Darstellung/.test(html), "Beispiele aus dem Wunsch: Lang-Drücken und Farbe einstellen");
  // gesammelt zur Laufzeit aus allen drei Registries (nichts doppelt gepflegt), Anzahl je Thema berechnet
  const f = html.slice(html.indexOf("function hzEintraege()"), html.indexOf("const hzGesehen"));
  assert.ok(/\.\.\.HILFE\.filter/.test(f) && /\.\.\.TIPPS\.map/.test(f) && /\.\.\.EINWEISUNG\.filter/.test(f), "Hilfe muss TIPPS, EINWEISUNG und HILFE sammeln");
  assert.ok(/hzThemaId\(/.test(f) && /\(HILFE_THEMEN\.some\(\(x\) => x\.id === t\) \? t : "weitere"\)/.test(html), "unbekanntes Thema → „Weitere Tipps“");
  assert.ok(/📖 Inhalt\$\{anz\(alle\.length\)\}/.test(html) && /<ul class="hz-inhalt">\$\{themen\.map/.test(html) && /onclick="hzThema\('\$\{t\.id\}'\)"/.test(html), "Deckblatt mit Inhalt, Anzahl und Link je Thema");
  assert.ok(/\{ id: "hilfezentrum", sym: "❓", t: "Hilfe & Tipps"[^\n]*aktion: "hzStart\(\)"/.test(block("  programme: [", "\n  ],")), "Kachel im Register Technik");
  assert.ok(/<section id="v-hilfezentrum"/.test(html) && /"spiele", "hilfezentrum"\]\.forEach/.test(html) && /if \(v === "hilfezentrum"\) hzOeffnen\(\);/.test(html), "Ansicht fehlt");
  assert.ok(/h === "#hilfezentrum" \|\| h\.startsWith\("#hilfezentrum="\)/.test(html), "Sprung #hilfezentrum fehlt");
  assert.ok(/onclick="hzStart\(\)">Öffnen<\/button>/.test(html), "Link in den Einstellungen fehlt");
}

// 350. 2.23.1: Hilfe-Zentrum erweitert – abwechslungsreich formuliert, wechselnde Einleitungen, nichts drängt sich auf
{
  const b = html.slice(html.indexOf("const HILFE = ["), html.indexOf("\n];", html.indexOf("const HILFE = [")));
  const es = [...b.matchAll(/\n  \{ id: "([^"]+)",[^\n]*? t: "([^"]+)", x: (?:\(\) => `|")([^"`]+)/g)].map((m) => ({ id: m[1], t: m[2], anfang: m[3].replace(/<[^>]+>/g, "").split(/\s+/).slice(0, 3).join(" ") }));
  assert.ok(es.length >= 80, "zu wenige Hilfetexte");
  assert.equal(new Set(es.map((e) => e.t)).size, es.length, "Hilfe-Titel doppelt");
  const anf = {}; for (const e of es) (anf[e.anfang] ||= []).push(e.id);
  for (const [a, ids] of Object.entries(anf)) assert.ok(ids.length === 1, `Hilfetexte beginnen gleich („${a}“): ${ids.join(", ")} – bitte abwechslungsreich formulieren`);
  assert.ok(/const HZ_GRUSS = \[/.test(html) && /const HZ_THEMA_EINL = \[/.test(html) && /function hzOeffnen\(\) \{[^\n]*hzNeuerGruss\(\);/.test(html) && /if \(t !== HZ\.thema( \|\| HZ\.sicht)?\) hzNeuerGruss\(\);/.test(html), "wechselnde Einleitungen fehlen");
  assert.ok(!/function hzSuchen\(q\) \{[^}]*hzNeuerGruss/.test(html), "beim Suchen darf die Einleitung nicht wechseln");
  assert.ok(/id: "buero_sprache"[^\n]*nur: \(\) => !!ICH\?\.buero/.test(html), "Büro-Hilfe nur für die Clubleitung");
  // nicht aufdringlich: das Hilfe-Zentrum öffnet keine Fenster und meldet nichts von selbst
  // Ausnahme (2.23.5): Rückmeldung, nachdem man das „?“ selbst aus-/eingeschaltet hat
  const hz = html.slice(html.indexOf("const HZ = {"), html.indexOf("// ---------- KC-CLUB-ONLINE-ANSAGE")).replace(/function hzFrageSchalter\(an\) \{[\s\S]*?\n\}/, "")
    .replace(/async function hzBewerten\(id, wert\) \{[\s\S]*?\n\}/, "").replace(/async function hzBewertungenZeigen\(\) \{[\s\S]*?\n\}/, ""); // 2.23.34: nur nach eigenem Tippen (👍/👎, 📊)
  assert.ok(!/melde\(|blattAuf\(|\.classList\.remove\("versteckt"\)/.test(hz), "Hilfe-Zentrum darf sich nicht aufdrängen");
}

// 351. 2.23.2: Hilfe-Zentrum – deutliches Suchfeld, Kapitel mit Nummern, Zurück-Leiste nach „Zeig mir wo“, Ausdruck/PDF
{
  assert.ok(/<label class="hz-suchfeld" for="hzSuche"><span class="hz-such-titel">🔍 Wonach suchst du\?<\/span>/.test(html) && /\.hz-suche \{[^}]*border: 2px solid var\(--rot\)/.test(html), "Suchfeld deutlich");
  assert.ok(/function hzGliederung\(alle\)/.test(html) && /nr\[e\.id\] = `\$\{t\.nr\}\.\$\{i \+ 1\}`/.test(html) && /<div class="hz-kap-nr">Kapitel \$\{th\.nr\}<\/div>/.test(html), "Kapitel/Nummern fehlen");
  assert.ok(/\.karte\.hz-eintrag \{ margin-top: 20px;/.test(html), "Abstand zwischen den Abschnitten");
  const los = html.slice(html.indexOf("function hzLos(id)"), html.indexOf("function hzKarte("));
  assert.ok(/HZ\.unterwegs = \{ id, thema: HZ\.q \? null : HZ\.thema,( sicht: HZ\.q \? null : HZ\.sicht,)? q: HZ\.q/.test(los) && /e\.los\(\); hzLeiste\(\);/.test(los), "Leiste nach „Zeig mir wo“");
  assert.ok(/↩️ Zurück zur Hilfe<\/button>/.test(los) && /onclick="hzLeisteZu\(\)"[^>]*>✕ Abbrechen<\/button>/.test(los), "Knöpfe Zurück/Abbrechen");
  assert.ok(/document\.querySelectorAll\("\.blatt:not\(\.versteckt\)"\)\.forEach\(fensterZu\)/.test(los) && /#hzInhalt \[data-hz="\$\{u\.id\}"\]/.test(los), "Zurück: Fenster schließen, an dieselbe Stelle");
  assert.ok(/\.hz-leiste \{ position: fixed; top: calc\(env\(safe-area-inset-top, 0px\) \+ 8px\); right: 8px;/.test(html), "Leiste oben rechts");
  assert.ok(/function hzOeffnen\(\) \{ \$\("hzLeiste"\)\?\.remove\(\);/.test(html), "Leiste weg, wenn die Hilfe wieder offen ist");
  assert.ok(/hilfe: \{ titel: "🖨️ Hilfe drucken \/ als PDF", optionen: \(\) => hzDruckOptionen\(\), bauen: \(o\) => hzDruck\(o\) \}/.test(html) && /onclick="druckStarten\('hilfe'\)"/.test(html), "Druck/PDF fehlt");
  assert.ok(/#druck \.hz-d-kap \{ break-before: page; \}/.test(html) && /<table class="hz-d-inhalt">/.test(html), "Druck: Inhaltsverzeichnis, Kapitel je Seite");
}

// 352. 2.23.3: Kapitel 1 „Erste Schritte“ (Text Hansi) – ganz vorne, fünf Schritte, Gruß von Hansi
{
  assert.ok(/const HILFE_THEMEN = \[\n  \{ id: "erste", sym: "👋", t: "Erste Schritte"/.test(html), "„Erste Schritte“ muss Kapitel 1 sein");
  const ids = [...html.matchAll(/\n  \{ id: "([a-z_]+)", thema: "erste"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["willkommen", "erst_einstellungen", "erst_einfach", "erst_hilfetexte", "erst_feedback"], "Schritte/Reihenfolge");
  assert.ok(/id: "erst_feedback"[^\n]*Register <b>„Club“<\/b>[^\n]*Liebe Grüße<br><b>Hansi<\/b>/.test(html) && /id: "erst_einstellungen"[^\n]*Zahnrad ⚙️/.test(html), "Inhalt nach Hansis Text");
}

// 353. 2.23.4: „?“ in jeder Ansicht – jede Ansicht hat ein Hilfe-Kapitel (neue Ansichten in HZ_SICHT_THEMA eintragen)
{
  const liste = html.match(/\[("start", "dokumente", "dokansicht"[^\]]*)\]\.forEach\(\(x\) => \$\("v-" \+ x\)/)?.[1];
  assert.ok(liste, "Ansichtenliste in zeige() nicht gefunden");
  const ansichten = [...liste.matchAll(/"([a-z]+)"/g)].map((m) => m[1]);
  const map = html.slice(html.indexOf("const HZ_SICHT_THEMA = {"), html.indexOf("};", html.indexOf("const HZ_SICHT_THEMA = {")));
  const zuordnung = Object.fromEntries([...map.matchAll(/([a-z]+): ("([a-z]+)"|null)/g)].map((m) => [m[1], m[3] || null]));
  const themen = new Set([...html.slice(html.indexOf("const HILFE_THEMEN = ["), html.indexOf("\n];", html.indexOf("const HILFE_THEMEN = ["))).matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]));
  for (const v of ansichten) {
    assert.ok(v in zuordnung, `Ansicht „${v}“ hat kein Hilfe-Kapitel (HZ_SICHT_THEMA ergänzen)`);
    if (zuordnung[v]) assert.ok(themen.has(zuordnung[v]), `Ansicht „${v}“: Kapitel „${zuordnung[v]}“ unbekannt`);
  }
  assert.ok(/hzFrageEinsetzen\(v\); \/\/ KC-CLUB-HILFEZENTRUM/.test(html) && /class="hz-frage" id="hzFrage"[^>]*>\?<\/button>/.test(html) && /k\.addEventListener\("click", \(\) => \{ if \(lang\) \{ lang = false; return; \} hzFrage\(k\.dataset\.v\); \}\)/.test(html), "„?“ fehlt");
  assert.ok(/\.hz-frage \{ position: fixed;[^}]*bottom: calc\(84px/.test(html) && !/body\.einfach[^{]*\.hz-frage/.test(html), "„?“ unten rechts, auch in der einfachen Ansicht");
  assert.ok(/onclick="\$\('chatBlatt'\)\.classList\.add\('versteckt'\);hzFrage\('chat'\)">❓ Hilfe zum Chat<\/button>/.test(html), "Chat: Hilfe im ⋮-Menü");
  assert.ok(/else if \(HZ\.herkunft\?\.chat\) \{ const c = HZ\.herkunft\.chat; HZ\.herkunft = null; chatOeffnen\(c\); \}/.test(html), "Zurück in den Chat");
}

// 354. 2.23.5: „?“ per Lang-Drücken ausblenden, Rückfrage erklärt den Rückweg, Schalter in beiden Ansichten
{
  assert.ok(/const HZ_FRAGE_AUS = "kc_club_hz_frage_aus"[^\n]*HZ_LANG_MS = 600;/.test(html) && /k\.addEventListener\("pointerdown"[^\n]*hzFrageLang\(\); \}, HZ_LANG_MS\)/.test(html), "Lang-Drücken fehlt");
  assert.ok(/async function hzFrageLang\(\) \{\n  if \(!\(await frage\("❓ Fragezeichen ausblenden\?[^"]*Zurückholen kannst du es jederzeit unter ⚙️ Einstellungen → „❓ Fragezeichen unten rechts“/.test(html), "Rückfrage mit Rückweg");
  assert.ok(/k\.classList\.toggle\("versteckt", !HZ_SICHT_THEMA\[v\] \|\| hzFrageAus\(\)\)/.test(html), "ausgeblendet bleibt ausgeblendet");
  for (const id of ["setHzFrage", "setHzFrageE"]) assert.ok(new RegExp(`id="${id}" checked onchange="hzFrageSchalter\\(this\\.checked\\)"`).test(html), `Schalter ${id} fehlt`);
  const einfachKlappe = html.slice(html.indexOf('data-klappe="einfach"'), html.indexOf('data-klappe="schnellstart"')); // bis zum nächsten Bereich (innen gibt es geschachtelte <details>)
  assert.ok(einfachKlappe.includes('id="setHzFrageE"'), "Schalter muss in der einfachen Ansicht erreichbar sein");
  assert.ok(/id: "frage_knopf", thema: "start"/.test(html), "Hilfe-Eintrag zum Fragezeichen");
}

// 355. 2.23.7: „?“ zeigt genau die Hilfen zum Bereich – jede Ansicht hat eine Liste, jede ID existiert, Kurz-Erklärung vorne
{
  const liste = html.match(/\[("start", "dokumente", "dokansicht"[^\]]*)\]\.forEach\(\(x\) => \$\("v-" \+ x\)/)[1];
  const ansichten = [...liste.matchAll(/"([a-z]+)"/g)].map((m) => m[1]).filter((v) => v !== "hilfezentrum");
  const block = (start, ende = "\n];") => html.slice(html.indexOf(start), html.indexOf(ende, html.indexOf(start)));
  const ids = new Set([
    ...[...block("const HILFE = [").matchAll(/\n  \{ id: "([a-z_]+)", thema:/g)].map((m) => "h:" + m[1]),
    ...[...block("const TIPPS = [").matchAll(/\n  \{ id: "([a-z_]+)"/g)].map((m) => "t:" + m[1]),
    ...[...block("const EINWEISUNG = [").matchAll(/\n  \{ id: "([a-z-]+)"/g)].map((m) => "e:" + m[1]),
  ]);
  const map = block("const HZ_SICHT_HILFEN = {", "\n};");
  const zu = Object.fromEntries([...map.matchAll(/\n  "([a-z]+)": \[([^\]]*)\]/g)].map((m) => [m[1], [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1])]));
  const einw = new Set([...block("const EINWEISUNG = [").matchAll(/\n  \{ id: "([a-z]+)"/g)].map((m) => m[1]));
  for (const v of ansichten) {
    assert.ok(zu[v]?.length, `Ansicht „${v}“: keine Hilfen für das „?“ (HZ_SICHT_HILFEN ergänzen)`);
    for (const id of zu[v]) assert.ok(ids.has(id), `Ansicht „${v}“: Hilfe „${id}“ gibt es nicht`);
    assert.equal(new Set(zu[v]).size, zu[v].length, `Ansicht „${v}“: Hilfe doppelt`);
    if (einw.has(v)) assert.equal(zu[v][0], "e:" + v, `Ansicht „${v}“: Kurz-Erklärung des Bereichs gehört nach vorne`);
  }
  assert.ok(/HZ\.sicht = HZ_SICHT_HILFEN\[v\] \? v : null;/.test(html) && /<div class="hz-kap-nr">Hilfe zu diesem Bereich<\/div>/.test(html), "Bereichsseite fehlt");
  assert.ok(/sicht: HZ\.q \? null : HZ\.sicht/.test(html) && /HZ\.sicht = u\.sicht \|\| null;/.test(html), "Zurück zur Hilfe → Bereichsseite");
}

// 356. 2.23.12: Tipp des Tages auch aus dem Hilfe-Zentrum – Themen wechseln, Neues zuerst, „Mehr dazu“, Server speichert die Schlüssel
{
  const t = html.slice(html.indexOf("function tippDesTages()"), html.indexOf("// ---------- KC-CLUB-HILFEZENTRUM (2.23.0"));
  assert.ok(/const tipp = tippWaehlen\(st\);/.test(t) && !/TIPPS\.find\(/.test(t), "Tipp des Tages muss aus dem gemeinsamen Vorrat wählen");
  assert.ok(/\.\.\.alt, \.\.\.neu/.test(t) && /HILFE\.filter\(\(x\) => x\.thema !== "erste" && \(!x\.nur \|\| x\.nur\(\)\)\)/.test(t), "Vorrat: TIPPS + HILFE (ohne Erste Schritte, nur was für mich gilt)");
  assert.ok(/const alt = TIPPS\.map\(\(x\) => \(\{ \.\.\.x, key: x\.id,/.test(t), "alte Tipps behalten ihre Schlüssel (Kenne ich/Später bleiben gültig)");
  assert.ok(/const th = ordnung\[\(ab \+ i \+ ordnung\.length\) % ordnung\.length\], x = reihe\.find\(\(y\) => y\.thema === th\)/.test(t) && /\[\.\.\.frei\.filter\(istNeu\), \.\.\.frei\.filter\(\(x\) => !istNeu\(x\)\)\]/.test(t), "reihum durch die Kapitel, Neues zuerst");
  assert.ok(/id="tdtMehr"[^>]*>❓ Mehr dazu<\/button>/.test(t) && /hzZuEintrag\(tipp\.hz\)/.test(t), "„Mehr dazu“ fehlt");
  assert.ok(/st\.zuletzt && new Date\(st\.zuletzt\)[^\n]*=== heute\) return false; \/\/ einer je Tag/.test(t), "weiter höchstens einer je Tag");
  const sv = server.slice(server.indexOf("  tipps: (w) => {"), server.indexOf("  einstieg: (w) =>"));
  assert.ok(/\/\^\[a-z0-9_:-\]\{1,40\}\$\//.test(sv) && /\.slice\(0, 400\)/.test(sv) && /stand:/.test(sv) && /letztesThema:/.test(sv), "Server muss h:-Schlüssel, mehr Einträge, stand und letztesThema speichern");
}

// 363. 2.23.14: „Kurz erklärt“ auch in den einzelnen Schritten von „Meine Daten haben sich geändert“ (KC-CLUB-EINWEISUNG)
{
  const reg = html.slice(html.indexOf("const EINWEISUNG = ["), html.indexOf("const einwStand ="));
  assert.ok(/\{ id: "b-aenderung-schritt", blatt: true, sym: "✏️", t: "Änderung eintragen", x: \(\) =>/.test(reg), "Einweisung b-aenderung-schritt fehlt");
  for (const art of ["anschrift", "name", "handy", "festnetz", "mail", "geburtstag", "notfall", "kleidung", "mitgliedschaft", "sonstiges"])
    assert.ok(new RegExp(`\\n      ${art}: "`).test(reg), `Text für ${art} fehlt`);
  assert.ok(/html = `\$\{einwHtml\("b-aenderung-schritt"\)\}<h3 style="margin:0">\$\{art\.sym\} \$\{esc\(art\.t\)\}<\/h3>/.test(html), "Karte oben im Schritt fehlt");
  assert.ok("b-aenderung-schritt".length <= 30, "Server speichert nur IDs bis 30 Zeichen (KA_ID)");
}

// 364. 2.23.15: „Kurz erklärt“ in allen Arbeitsfenstern (KC-CLUB-EINWEISUNG, Wunsch Hansi „alle Unterpunkte mit Karte“)
{
  const reg = html.slice(html.indexOf("const EINWEISUNG = ["), html.indexOf("const einwStand ="));
  const fenster = { "b-ablage": "ablageBlatt", "b-bildschirmfoto": "bfBlatt", "b-bu-drucker": "buDruckerBlatt", "b-bu-eingang": "buEinBlatt",
    "b-bu-einladung": "buEinladung", "b-bu-schreiben": "buFuellerBlatt", "b-bu-person": "buTelBlatt", "b-abstimmung": "cuFenster",
    "b-ek-ablage": "ekAblageBlatt", "b-ek-dienstzeiten": "ekDwBlatt", "b-ek-erstattung": "ekErstBlatt", "b-fa-album-wahl": "faAlbumBlatt",
    "b-fa-album": "faAlbumForm", "b-fl-angaben": "flAng", "b-fl-informieren": "flInfo", "b-gemerkt": "gmFenster", "b-kontakt-teilen": "kwFenster",
    "b-link": "linkBlatt", "b-mitfahrt": "mfAnbieten", "b-mikro-wahl": "mikroWahlBlatt", "b-neu-wahl": "neuWahlBlatt", "b-rolle": "rolleBlatt",
    "b-sp-herausfordern": "spHerausBlatt", "b-sp-termin": "spTerminBlatt", "b-teilen": "teilenBlatt", "b-bu-sitzung": "buWahl" };
  for (const [id, blatt] of Object.entries(fenster)) {
    assert.ok(reg.includes(`{ id: "${id}", blatt: true,`), `Einweisung ${id} fehlt`);
    assert.ok(new RegExp(`blattAuf\\("${blatt}", \`[^\`]{0,80}\\$\\{einwHtml\\("${id}"\\)\\}`).test(html), `Karte ${id} nicht oben im Fenster ${blatt}`);
    assert.ok(id.length <= 30, `${id} zu lang für den Server (KA_ID)`);
  }
  for (const id of ["b-bu-drucker", "b-bu-eingang", "b-ek-erstattung", "b-fl-informieren", "b-bu-sitzung"]) assert.ok(new RegExp(`\\{ id: "${id}"[^\\n]*nur: \\(\\) => !!ICH\\?\\.buero \\},`).test(reg), `${id}: nur fürs Büro`);
  for (const id of ["b-link", "b-rolle"]) assert.ok(new RegExp(`\\{ id: "${id}"[^\\n]*nur: \\(\\) => !!ICH\\?\\.admin \\},`).test(reg), `${id}: nur für den Admin`);
}

// 365. 2.23.17: Nutzung nach Uhrzeit (KC-CLUB-NUTZUNG-UHRZEIT, Wunsch Hansi „zu welchen Uhrzeiten am meisten genutzt“)
{
  const mig = lies("supabase/migrations/20261004_kc_club_v22317_nutzung_stunden.sql");
  const tab = /create table if not exists kc_club_nutzung_stunden \(([\s\S]*?)\);/.exec(mig)?.[1] || "";
  assert.ok(tab && !/person|geraet|bereich|user|ip/i.test(tab) && /stunde smallint not null check \(stunde between 0 and 23\)/.test(tab), "Stunden-Tabelle: nur Tag, Stunde, Anzahl");
  assert.ok(/enable row level security/.test(mig) && /revoke all on function kc_club_nutzung_stunden_zaehlen[^;]*from public, anon, authenticated/.test(mig), "nur über den Server");
  const f = server.slice(server.indexOf('case "nutzung_melden"'), server.indexOf('case "nutzung_statistik"'));
  assert.ok(/kc_club_nutzung_stunden_zaehlen/.test(f) && /\^\(\[01\]\?\\d\|2\[0-3\]\)\$/.test(f) && /Math\.min\(200/.test(f), "Server: nur Stunden 0–23, gedeckelt");
  assert.ok(/from\("kc_club_nutzung_stunden"\)\.select\("tag,stunde,anzahl"\)/.test(server) && /stunden: fs \? null : sz \?\? \[\]/.test(server), "Statistik liefert Stunden");
  assert.ok(/nzStdPuffer\[st\] = \(nzStdPuffer\[st\] \|\| 0\) \+ 1/.test(html) && /stunden: std/.test(html), "App zählt die Stunde beim Antippen und schickt sie mit");
  assert.ok(/function nzZeitHtml\(r\)/.test(html) && /\$\{nzZeitHtml\(r\)\}/.test(html) && /🕐 Zu welchen Uhrzeiten wird die App genutzt\?/.test(html) && /📅 An welchen Wochentagen\?/.test(html), "Anzeige Uhrzeit/Wochentage");
}

// 366. 2.23.18: Randpfeile farbig, bei Neuem 5× blinken, dann ruhig farbig (KC-CLUB-MINI-PFEIL-BLINK)
{
  const f = html.slice(html.indexOf("function mpfeil("), html.indexOf("// KC-CLUB-FRIST-AMEISEN (1.53.6)"));
  assert.ok(/const MP_BLINK_MS = 5 \* 800/.test(html) && /\.mpfeil\.mp-blink \{ animation: mpBlink \.8s ease-in-out 5; \}/.test(html), "5× blinken (5 × 0,8 s)");
  assert.ok(/typeof stand === "number" \? stand > alt\.stand : stand !== alt\.stand/.test(f) && /animation-delay:-\$\{lauf\}ms/.test(f), "nur bei Neuem blinken, beim Neuzeichnen weiterlaufen");
  assert.ok(/mpfeil\("nachrichten", n > 0, n\)/.test(html) && /mpfeil\("mitglieder", ONL\.zeigen && mpOnline\(\) > 0, mpOnline\(\)\)/.test(html) && /mpfeil\("termin", !!t,/.test(html), "drei Felder: Nachricht, online, Termin");
  assert.ok(/\.mpfeil\.mp-nachrichten \{ color:/.test(html) && /\.mpfeil\.mp-mitglieder \{ color:/.test(html) && /\.mpfeil\.mp-termin \{ color:/.test(html), "Farben");
}

// 367. 2.23.19: Online-Mitglieder – Namenskreis mit hellgrünem Rand, pulsiert leicht (KC-CLUB-MG-ONLINE-PULS)
{
  assert.ok(/\.mg-kacheln \.mg-online \.avatar, #mitgliederListe \.zeile\.mg-online \.avatar \{[^}]*#6ee87a[^}]*animation: mgOnlinePuls 2\.4s ease-in-out infinite;/.test(html), "hellgrüner Rand + Pulsieren (Kacheln und Liste)");
  assert.ok(/@keyframes mgOnlinePuls \{/.test(html) && /@keyframes mgOnlinePulsKlein \{/.test(html) && /prefers-reduced-motion: reduce\) \{ \.mg-kacheln \.mg-online \.avatar, #mitgliederListe \.zeile\.mg-online \.avatar \{ animation: none; \}/.test(html), "Keyframes, ruhig bei „Bewegung reduzieren“");
  assert.ok(/liste\.map\(\(m\) => `<div class="zeile\$\{m\.online \? " mg-online" : ""\}">/.test(html) && /class="mini-kachel mg-kachel\$\{on \? " mg-online" : ""\}"/.test(html), "beide Ansichten markieren online");
}
