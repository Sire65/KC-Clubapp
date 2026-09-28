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
for (const z of ["nachrichten", "mitglieder", "termine"]) assert.ok(html.includes(`<button class="mini" onclick="zeige('${z}')">`), `Kennzahl → ${z} fehlt`);
const kopfHtml = html.slice(html.indexOf('<section id="v-start">'), html.indexOf('id="heroInfo"'));
assert.ok(!kopfHtml.includes("⚙️"), "Zahnrad gehört nicht mehr in den Kopf");
assert.ok(/onclick="webseite\(\)"/.test(kopfHtml), "Kochmütze → Internetseite fehlt");
assert.ok((html.match(/<details class="karte" data-klappe=/g) || []).length >= 4, "Einstellungen nicht ausklappbar");

console.log(`OK – Köcheclub-App ${appV}: ${aufrufe.size} API-Aktionen geprüft`);
