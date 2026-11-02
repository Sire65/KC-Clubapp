// KC-CLUB-PROTOKOLL-VERTAGT / -AUFGABEN-STAND / -JAHR / KC-CLUB-VORSCHLAG-BEHANDELT (2.802.0, Wunsch #50 Hansi): statische Prüfung (offline).
// Aufruf: node tests/protokoll-archiv.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const mig = fs.readFileSync("supabase/migrations/20261102_kc_club_protokoll_vertagt.sql", "utf8");
// DB: nur Ergänzungen
assert.ok(/add column if not exists vertagt text\[\] not null default '\{\}'/.test(mig) && /add column if not exists behandelt_in uuid references public\.kc_club_sitzungsprotokolle\(id\) on delete set null/.test(mig) && !/drop |delete from|truncate/i.test(mig), "Migration ergänzt nur");
// vertagt: Haken je TOP, gespeichert, im nächsten Büro als „Offen aus dem letzten Protokoll“
assert.ok(/vertagt: prVertagtListe\(\), \/\/ 2\.802\.0/.test(app) && /data-vt="\$\{esc\(t\)\}"/.test(app), "Haken je TOP");
assert.ok(/if \(Array\.isArray\(p\.vertagt\)\) upd\.vertagt = zeilen\(p\.vertagt\)\.filter\(\(x\) => upd\.tagesordnung\.includes\(x\)\);/.test(server), "Server speichert nur echte TOPs");
assert.ok(/const VERTAGT_VORSATZ = "Offen aus dem letzten Protokoll: ";/.test(server) && /\.\.\.BUERO_TOP_VORNE\.slice\(1\)\.map\(\(x\) => \(\{ t: x, art: "fest" \}\)\), \.\.\.vertagt, /.test(server), "nächste Tagesordnung");
// vor dem Veröffentlichen: TOPs ohne Text → vertagt oder behandelt
assert.ok(/const ohne = prTopsOhneText\(\);/.test(app) && /⏭️ Als vertagt markieren/.test(app), "Rückfrage");
// Vorschläge: behandelt beim Veröffentlichen (nur Themen), vertagte bleiben offen
const vb = server.slice(server.indexOf("async function vorschlaegeBehandelt("), server.indexOf("async function protokollHolen("));
assert.ok(/status: "abgeschlossen", abgeschlossen_am: jetzt\(\), abgeschlossen_von: ich\.person_id, behandelt_in: pr\.id/.test(vb) && /\.eq\("art", "thema"\)\.eq\("status", "offen"\)/.test(vb) && /update\(\{ treffen_id: null \}\)/.test(vb), "Vorschläge behandelt / vertagt");
assert.ok(/if \(pr\.treffen_id\) await vorschlaegeBehandelt\(ich, pr\)\.catch/.test(server), "beim Veröffentlichen, Fehler stoppen nichts");
// Aufgaben: im Folgeprotokoll erledigt/offen, auf der Vorlage erledigte kurz
assert.ok(/\(a\.erledigt_am \? "✓ erledigt – " : "☐ offen – "\)/.test(server) && /\.\.\.\(aufStand \? \{ kurzfassung: aufStand \} : \{\}\)/.test(server), "Folgeprotokoll");
assert.ok(/Erledigt seit dem letzten Protokoll:/.test(app), "Vorlage");
assert.ok(/tagesordnung: \(prep\?\.tagesordnung \?\? \[\]\)\.length \?/.test(server), "Protokoll übernimmt die Büro-Tagesordnung");
// Liste: Monate einklappbar; Jahr abschließen ohne Mitglieder-Kopien, doppelt-sicher
assert.ok(/<details class="pr-monat" data-klappe="pr_monat_/.test(app) && /details\.pr-monat > summary\.pr-monat-titel/.test(html), "Monate einklappbar");
const j = app.slice(app.indexOf("async function prJahrAbschliessen("), app.indexOf("function protokollFilter()"));
assert.ok(/api\("archiv_hochladen", \{ ordner_id: o\.id,/.test(j) && !/archiv_eingang_verteilen|archiv_kopieren/.test(j), "nur Büro-Ordner, keine Mitglieder-Kopien");
assert.ok(/if \(schon\.has\(marke\(p\.id\)\)\) \{ ueber\+\+; continue; \}/.test(j) && /\(\) => "p-" \+ String\(id\)\.slice\(0, 24\)|const marke = \(id\) => "p-" \+ String\(id\)\.slice\(0, 24\)/.test(j), "kein doppeltes Ablegen");
assert.ok(/await frage\(/.test(j) && /\(ICH\?\.admin \|\| ICH\?\.vorstand\)/.test(app.slice(app.indexOf("const prJahrKnopf"), app.indexOf("const prJahrKnopf") + 300)), "nur Clubleitung, mit Rückfrage");
console.log("protokoll-archiv: alle Prüfungen bestanden");
