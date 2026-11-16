// KC-CLUB-FEHLERKATALOG + KC-CLUB-HAENGER-URSACHE (16.11.2026, Wunsch Hansi „Hänger-Meldung genauer, damit der User weiß, woran es liegt –
// auf Dauer eine Tabelle mit Fehler-ID, Fehlername, Ursache, Lösung“). Aufruf: node tests/fehlerkatalog.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const mig = lies("supabase/migrations/20261116_kc_club_fehler_katalog.sql"), srv = lies("supabase/functions/kc-club/index.ts"), app = programmText();
// Tabelle: Rechte eng, Texte von Hansi werden nie überschrieben
assert.ok(/create table if not exists public\.kc_club_fehler_katalog/.test(mig) && /enable row level security/.test(mig), "Tabelle mit RLS");
assert.ok(/revoke all on public\.kc_club_fehler_katalog from public, anon, authenticated;/.test(mig) && /grant select, insert, update, delete on public\.kc_club_fehler_katalog to service_role;/.test(mig), "nur service_role");
assert.ok(/on conflict \(schluessel\) do nothing;/.test(mig), "geänderte Texte bleiben");
const zeilen = [...mig.matchAll(/^\('([a-z_]+)',\s*'(KC-F-\d{3})'/gm)].map((m) => [m[1], m[2]]);
assert.ok(zeilen.length >= 25, "alle Arten im Katalog");
assert.equal(new Set(zeilen.map((z) => z[1])).size, zeilen.length, "Fehler-IDs eindeutig");
assert.equal(new Set(zeilen.map((z) => z[0])).size, zeilen.length, "Schlüssel eindeutig");
// eingebaute Texte der App = gleiche IDs wie die Tabelle
const ein = app.slice(app.indexOf("const FEHLER_KATALOG_EINGEBAUT"), app.indexOf("let FEHLER_KATALOG = null"));
for (const [s, id] of zeilen.filter((z) => z[0].startsWith("haenger"))) assert.ok(new RegExp(`${s}: \\{ fehler_id: "${id}"`).test(ein), `App kennt ${s} = ${id}`);
// Hänger: Ursache wird gemessen und mitgeschickt
assert.ok(/PerformanceObserver\.supportedEntryTypes\?\.includes\("longtask"\)/.test(app), "lange Aufgaben messen");
assert.ok(/messbar && appMs >= luecke \* 0\.5 \? "haenger_app" : voll > 0\.85 \? "haenger_speicher" : !fokus \? "haenger_hintergrund" : messbar \? "haenger_geraet" : "haenger"/.test(app), "Reihenfolge der Ursachen");
assert.ok(/KCFP\?\.neu\("haenger", \{ text: `App reagierte \$\{s\} s nicht – \$\{k\.name\} \(\$\{k\.fehler_id\}\)`/.test(app), "Text mit Ursache und ID");
assert.ok(/u\.ursache !== "haenger_hintergrund"\) fehlerFenster\(k, /.test(app), "Hintergrund: kein Fenster");
// Mitglied sieht ein Fenster mit Fehler-ID, Name, Ursache und Lösung (höchstens 1× in 10 Minuten)
assert.ok(/function fehlerFenster\(k, vorweg\)/.test(app) && /blattAuf\("fkBlatt"/.test(app) && /<b>Ursache:<\/b>/.test(app) && /<b>Lösung:<\/b>/.test(app) && /Fehler-ID: <b>/.test(app), "Fenster mit ID, Ursache, Lösung");
assert.ok(/Date\.now\(\) - FEHLER_FENSTER_ZULETZT < 600000/.test(app), "nicht öfter als alle 10 Minuten");
assert.ok(/ursache: k\.ursache, mitglied_text: k\.mitglied_text/.test(srv), "Server liefert Ursache für das Fenster");
// Häufigkeit je Fehler-ID
assert.ok(/FP_ADMIN\.zaehl = new Map\(\)/.test(app) && /die häufigsten oben/.test(app), "Fehler werden gezählt");
// Server: Katalog-Aktion, kein Alarm bei Hintergrund, Mail mit ID/Ursache/Lösung, Fehlerprotokoll liefert den Katalog
assert.ok(/case "fehler_katalog": return json\(\{ katalog:/.test(srv), "Aktion fehler_katalog");
assert.ok(/"fehler_melden", "fehler_katalog", "hilfe_anfordern"/.test(srv) && /"fehler_melden", "fehler_katalog", "hilfe_anfordern"/.test(app), "für alle Zugänge (Server und App gleich)");
assert.ok(/txt\(e\?\.ursache, 30\) !== "haenger_hintergrund"/.test(srv), "kein Alarm bei Hintergrund");
assert.ok(/Fehler-ID: \$\{fk\.fehler_id\} – \$\{fk\.name\}\\nUrsache: \$\{fk\.ursache\}\\nLösung: \$\{fk\.loesung\}/.test(srv), "Alarm-Mail mit Ursache und Lösung");
assert.ok(/katalog: await fehlerKatalog\(\)\.catch\(\(\) => \[\]\), eintraege:/.test(srv), "Fehlerprotokoll mit Katalog");
assert.ok(/function fpKatalog\(\)/.test(app) && /📖 Fehlerkatalog/.test(app), "Katalog im Admin");
console.log("fehlerkatalog: ok");
