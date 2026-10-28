// KC-CLUB-CLUBABEND-ANWESEND + KC-CLUB-SITZUNG-LEER (2.744.0, Prüfung Clubabend-Ablauf, Hansi 28.10.2026): Verhaltensprüfung (offline).
// 1) Clubabend Live: Das erste Antippen darf die im Büro angehakten Anwesenden im Protokoll nicht überschreiben.
// 2) Einladung ohne Vorbereitung: Die Zeile nur mit Einladungsdatum gilt nicht als „vorbereitet“, und „Sitzung vorbereiten“ zeigt den üblichen Vorschlag.
// Aufruf: node tests/clubabend-anwesend.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");

// --- 1) Server: Startliste der Anwesenden am Clubabend (mit nachgebauter Datenbank)
const quelle = server.slice(server.indexOf("async function caAnwesendStart("), server.indexOf("async function clubabendStand("));
const js = quelle.replace(/\): Promise<string\[\]> \{/, ") {").replace(/(\w+): (string|any)\b/g, "$1");
const fakeDb = (daten) => ({ from: (tab) => { const q = { eq: () => q, limit: () => q, select: () => q, maybeSingle: async () => ({ data: daten[tab] ?? null }) }; return q; } });
const start = (daten, ca) => new Function("db", js + "\nreturn caAnwesendStart;")(fakeDb(daten))("T1", ca);
const elf = Array.from({ length: 11 }, (_, i) => "P" + i);
assert.deepEqual(await start({ kc_club_sitzungsprotokolle: { anwesend: elf } }, { anwesend: [] }), elf, "leere Clubabend-Liste → Anwesende aus dem Protokoll-Entwurf (Fall Donnerstag 30.10.)");
assert.deepEqual(await start({ kc_club_sitzungsprotokolle: { anwesend: elf } }, null), elf, "noch kein Clubabend-Eintrag → ebenso");
assert.deepEqual(await start({ kc_club_sitzungsprotokolle: null, kc_club_buero_sitzung: { anwesend: ["P1", "P2"] } }, null), ["P1", "P2"], "ohne Protokoll → Büro-Vorbereitung");
assert.deepEqual(await start({ kc_club_sitzungsprotokolle: { anwesend: elf } }, { anwesend: ["P3"] }), ["P3"], "am Abend schon eingetragen → dieser Stand gilt");
assert.deepEqual(await start({}, null), [], "nichts vorbereitet → leer");
// beide Wege benutzen die Startliste: Anzeige und Antippen
assert.match(server, /anwesend: string\[\] = await caAnwesendStart\(t\.id, ca\);/, "Anzeige am Clubabend");
assert.match(server, /anwesend = new Set<string>\(await caAnwesendStart\(tid, alt\)\);/, "Antippen ergänzt/streicht nur");
// Antippen schreibt weiter nur in den Entwurf
assert.match(server, /if \(typeof p\.anwesend === "string"\) await db\.from\("kc_club_sitzungsprotokolle"\)\.update\(\{ anwesend: \[\.\.\.anwesend\] \}\)\.eq\("treffen_id", tid\)\.eq\("status", "entwurf"\);/, "nur Entwurf");

// --- 2) Server: „vorbereitet“ nur mit gespeicherter Tagesordnung
assert.match(server, /select\("treffen_id,tagesordnung,einladung_am,erinnerung_am,geaendert_am"\)/, "Büro-Start liest die Tagesordnung mit");
assert.match(server, /vorbereitet: !!p && Array\.isArray\(p\.tagesordnung\) && p\.tagesordnung\.length > 0,/, "Zeile nur mit Einladungsdatum ist nicht „vorbereitet“");
assert.match(server, /: b\.vorbereitung\?\.tagesordnung\?\.length \? "Tagesordnung ist vorbereitet" :/, "Aktentasche-Begründung ebenso");

// --- 2) App: „Sitzung vorbereiten“ nach einer Einladung ohne Vorbereitung (mit nachgebautem Server)
const f = app.slice(app.indexOf("async function buSitzungLaden("), app.indexOf("async function buSitzungOeffnen("));
const laden = (antwort) => { const BU = {}; return new Function("BU", "api", f + "\nreturn buSitzungLaden;")(BU, async () => antwort)("T1").then(() => BU.f); };
const standard = { anwesend: ["P1", "P2"], tagesordnung: [{ t: "Begrüßung", art: "fest" }, { t: "Verschiedenes", art: "fest" }], zeilen: 5 };
let bf = await laden({ standard, anmerkungVorschlag: "Vorschlag", vorbereitung: { anwesend: [], anmerkung: null, tagesordnung: [], zeilen: 5, einladung_am: "2026-10-28T15:00:00Z" } });
assert.deepEqual([...bf.anwesend], ["P1", "P2"], "leere Vorbereitung → übliche Anwesende");
assert.deepEqual(bf.tagesordnung.map((x) => x.t), ["Begrüßung", "Verschiedenes"], "leere Vorbereitung → übliche Tagesordnung");
assert.equal(bf.anmerkung, "Vorschlag");
bf = await laden({ standard, anmerkungVorschlag: "", vorbereitung: { anwesend: ["P9"], anmerkung: "x", tagesordnung: [{ t: "Eigener Punkt", art: "eigen" }], zeilen: 3 } });
assert.deepEqual([...bf.anwesend], ["P9"], "echte Vorbereitung bleibt");
assert.deepEqual(bf.tagesordnung.map((x) => x.t), ["Eigener Punkt"]);
assert.equal(bf.zeilen, 3);

console.log("clubabend-anwesend: alle Prüfungen bestanden");
