// KC-CLUB-TA-PROTOKOLL (13.11.2026): Besprechungs-Protokoll aus der Terminanfrage
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const mig = fs.readFileSync(new URL("../supabase/migrations/20261113_kc_club_terminanfrage_protokoll.sql", import.meta.url), "utf8");
assert.match(mig, /alter table public\.kc_club_terminanfragen add column if not exists protokoll jsonb;/, "nur eine Spalte, keine neue Tabelle");
const c = server.slice(server.indexOf('case "terminanfrage_protokoll"'), server.indexOf("// ----- KC-CLUB-STANDORT (0.92.0) -----"));
assert.match(c, /if \(a\.erstellt_von !== ich\.person_id\) throw new Fehler\("Das Protokoll schreibt, wer angefragt hat\.", 403\);/, "nur wer angefragt hat");
assert.match(c, /Date\.parse\(a\.beginn\) > Date\.now\(\) \+ 2 \* 3600000/, "erst ab kurz vor der Besprechung");
assert.match(c, /status: senden \|\| alt\?\.status === "gesendet" \? "gesendet" : "entwurf"/, "Entwurf oder gesendet");
assert.match(c, /sendenGewaehlt\("club_treffen", ziel, \["push", "email"\]/, "Push und E-Mail an die Angefragten");
assert.match(c, /protokoll\(ich\.person_id, "terminanfrage_protokoll", \{ anfrage: a\.id, tops: tops\.length, status: prot\.status, gesendet: senden, an, versand, pdf: !!pdf, kopie: senden && p\.kopie === true \}\)/, "Protokoll ohne Inhalte");
assert.match(server, /protokoll: a\.protokoll && \(a\.erstellt_von === ich\.person_id \|\| a\.protokoll\.status === "gesendet"\) \? a\.protokoll : null/, "Angefragte sehen es erst, wenn verschickt");
assert.match(app, /onclick="\$\{a\.vonMir \? "taProtokoll" : "taProtokollLesen"\}\('\$\{a\.id\}'\)"/, "Knopf an der Anfrage");
assert.match(app, /taprotokoll: \{ ablegen: \{ register: \["Besprechungen", "Protokolle", "Sonstiges"\]/, "Druck mit Ablegen");
assert.match(app, /api\("todo_anlegen", \{ text: `\$\{a\.anlass\}: \$\{x\.t\}/, "To-dos aus Wer?/Bis wann?");
assert.match(app, /\|\| a\.id === TA\.markiert/, "aus dem Kalender angetippte Anfrage sichtbar");
// Foto-Text auf die Punkte verteilen
const m = /function taPrFotoVerteilen\(text, n\) \{[^\n]*\n([\s\S]*?)\n\}/.exec(app); assert.ok(m);
const verteilen = new Function("text", "n", m[1]);
const r = verteilen("Köcheclub Werne\nProtokollführer: Hansi\nTOP 1: Dienstplan\nEntwurf bis Sonntag\n_____\nTOP 2: Metallschilder\n20 Stück A5\nTOP 3: Termine\nBeschlüsse / Sonstiges\nKaffee kaufen\nNächster Termin: 27.11.", 3);
assert.deepEqual(r.tops, ["Entwurf bis Sonntag", "20 Stück A5", ""]);
assert.equal(r.rest, "Kaffee kaufen");
// KC-CLUB-TA-PROTOKOLL-PDF / -KOPIE (13.11.2026)
assert.match(c, /objAnlagenSetzen\(ich, "terminanfrage", a\.id, \[pdfNeu\]\)/, "PDF hängt an der Terminanfrage");
assert.match(c, /if \(p\.kopie === true\) await sendenGewaehlt\("club_treffen", \[ich\.person_id\], \["email"\]/, "Kopie nur per E-Mail an mich");
assert.match(app, /const up = await anlageHochladen\(new File\(\[await druckPdfBlob\(\)\], name, \{ type: "application\/pdf" \}\)\)/, "App erzeugt das PDF im Club-Design");
assert.match(app, /👁️ So sieht \$\{esc\(/, "Ansicht wie der Empfänger");
console.log("ta-protokoll: ok");
