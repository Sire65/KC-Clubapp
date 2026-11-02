// KC-CLUB-ORDNER-KENNUNG + KC-CLUB-REGISTER-UMBENENNEN (03.11.2026, Konzeptprüfung Ordner & Register, Wunsch Hansi „umbauen“).
// Aufruf: node tests/ordner-kennung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261103_kc_club_ordner_kennung.sql");

// Migration: nur Spalte + Kennung für feste Ordner, je Kennung/Jahr höchstens ein lebender Ordner, nur Vereinsordner, kein Löschen
assert.match(mig, /add column if not exists kennung text/);
assert.match(mig, /check \(kennung is null or besitzer is null\)/);
assert.match(mig, /create unique index if not exists kc_club_archiv_ordner_kennung on public\.kc_club_archiv_ordner \(kennung, jahr\)\s+where kennung is not null and geloescht_am is null/);
assert.doesNotMatch(mig, /\bdelete\b|drop table|create table/i, "nichts löschen, keine neue Tabelle");
assert.ok(fs.existsSync(new URL("../tools/db-test/105_ordner_kennung_test.sql", import.meta.url)), "Probelauf-Test vorhanden");

// Registry im Server – jede Kennung der Migration steht in FESTE_ORDNER (und umgekehrt)
const reg = srv.match(/const FESTE_ORDNER[^=]*= \{([\s\S]*?)\n\};/)[1];
const regK = [...reg.matchAll(/^\s+([a-z_]+): \{/gm)].map((m) => m[1]).sort();
const migK = [...mig.matchAll(/\('([a-z_]+)', '[^']+'\)/g)].map((m) => m[1]).sort();
assert.deepEqual(migK, regK, "Migration und Registry kennen dieselben festen Ordner");
const appK = Object.keys(Function(`return ${app.match(/const AR_FEST_TITEL = (\{[\s\S]*?\});/)[1]}`)()).sort();
assert.deepEqual(appK, regK, "App-Rückfall kennt dieselben festen Ordner");

// Server: Kennung ausliefern, Rückfall ohne Spalte, Dauerordner nie aus der Jahres-Wahl, Kennung nur aus der Registry
assert.match(srv, /kennung: ordnerKennung\(o\), dauerhaft: ordnerDauerhaft\(o\)/);
assert.match(srv, /"kennung" in o \? \(o\.kennung && FESTE_ORDNER\[o\.kennung\] \? o\.kennung : null\)/, "nach der Migration zählt nur die gespeicherte Kennung");
assert.match(srv, /o\.jahr >= jahr - 1 \|\| ordnerDauerhaft\(o\)/);
assert.match(srv, /const kennungNeu = !p\.id && p\.kennung && FESTE_ORDNER\[String\(p\.kennung\)\] \? String\(p\.kennung\) : null;/);
assert.match(srv, /ordnerKennung\(o\) === "personal"/);
assert.doesNotMatch(srv, /o\.titel === MITGLIEDER_ORDNER\.titel|o\.titel === DIENSTPLAN_ORDNER\.titel/, "keine Suche mehr nach Beschriftung");
assert.match(srv, /if \(spalteFehlt\(r\.error\)\) KENNUNG_SPALTE = false;/, "läuft auch vor der Migration");

// Register umbenennen: Dokumente + Freigaben ziehen mit, in beiden Ordner-Arten
assert.equal((srv.match(/await registerUmbenennen\(o\.id, registerUmbenennenPaare\(p\.umbenennen, o\.register \|\| \[\], /g) || []).length, 2);
assert.match(srv, /from\("kc_club_archiv_dokumente"\)\.update\(\{ register: neu, geaendert_am: jetzt\(\) \}\)\.eq\("ordner_id", ordnerId\)\.eq\("register", alt\)/);
assert.match(srv, /from\("kc_club_archiv_freigaben"\)\.update\(\{ register: neu \}\)\.eq\("ordner_id", ordnerId\)\.eq\("register", alt\)/);
assert.match(srv, /registerErsetzt: !!p\.register && String\(p\.register\) !== register/);

// Paar-Prüfung wie im Server nachgebaut
const paareSrc = srv.match(/function registerUmbenennenPaare[\s\S]*?\n\}/)[0].replace(/: unknown|: string\[\]|: \{ alt: string; neu: string \}\[\]/g, "").replace(/new Set<string>\(\)/g, "new Set()").replace(/\(x as any\)/g, "x");
const paare = Function("txt", `${paareSrc}; return registerUmbenennenPaare;`)((v, n) => String(v ?? "").trim().slice(0, n));
assert.deepEqual(paare([{ alt: "Preislisten", neu: "Preise" }], ["Preislisten", "Hinweise"], ["Preise", "Hinweise"]), [{ alt: "Preislisten", neu: "Preise" }]);
assert.deepEqual(paare([{ alt: "Gibtsnicht", neu: "Preise" }], ["Preislisten"], ["Preise"]), [], "alt muss vorher da sein");
assert.deepEqual(paare([{ alt: "Preislisten", neu: "Weg" }], ["Preislisten"], ["Preise"]), [], "neu muss nachher da sein");
assert.deepEqual(paare([{ alt: "A", neu: "B" }, { alt: "A", neu: "C" }], ["A"], ["B", "C"]), [{ alt: "A", neu: "B" }], "keine doppelten Paare");
assert.deepEqual(paare([{ alt: "A", neu: "B" }], ["A", "B"], ["A", "B"]), [], "alt bleibt bestehen → kein Umbenennen");

// App: feste Ordner über die Kennung, Umbenennen im Formular, Rückmeldung beim Ablegen
assert.match(app, /const arIstFest = \(o, kennung\) => !!o && !o\.besitzer && \("kennung" in o \? o\.kennung === kennung : o\.titel === AR_FEST_TITEL\[kennung\]\);/);
assert.match(app, /const SCH_ORDNER = "schilder";/);
assert.match(app, /arIstFest\(x, "protokolle"\) && Number\(x\.jahr\) === Number\(jahr\)/);
assert.match(app, /nur_vorstand: false, kennung: "protokolle" \}/);
assert.match(app, /fn: "arStartFest\('weihnachtsmarkt'\)"/);
assert.match(app, /fn: "arStartFest\('besprechungen'\)"/);
assert.doesNotMatch(app, /x\.titel === "Protokolle"/);
assert.match(app, /\.filter\(\(o\) => !o\.geloescht_am && arIstFest\(o, "anleitungen"\)\)/, "Anleitungen (2.822.0) über die Kennung");
assert.doesNotMatch(app, /o\.titel === "Anleitungen"/);
assert.equal((app.match(/umbenennen: arRegUm/g) || []).length, 2, "Vereins- und eigener Ordner");
assert.equal((app.match(/arRegStart\(o/g) || []).length, 2);
assert.match(app, /onclick="arRegUmbenennen\(\$\{i\}\)"/);
assert.match(app, /das gewählte gibt es nicht mehr/);
assert.match(app, /o\?\.dauerhaft \? o\.titel :/, "Dauerordner ohne Jahreszahl im Namen");

// Umbenennen-Logik der App nachgebaut (Kette A→B→C ergibt ein Paar A→C; neu angelegtes Register erzeugt kein Paar)
const logik = app.match(/let arRegUm = \[\], arRegVorher = \[\];[\s\S]*?function arRegEntfernen[^\n]*\n/)[0];
const lauf = Function("eingabe", "melde", "arRegZeigen", `let arReg = []; ${logik}; return { start: arRegStart, um: arRegUmbenennen, weg: arRegEntfernen, add: (r) => arReg.push(r), zustand: () => ({ arReg, arRegUm }) };`);
let antworten = [];
const t = lauf(async () => antworten.shift(), () => {}, () => {});
t.start(["A", "X"]); antworten = ["B"]; await t.um(0); antworten = ["C"]; await t.um(0);
assert.deepEqual(t.zustand(), { arReg: ["C", "X"], arRegUm: [{ alt: "A", neu: "C" }] });
t.add("N"); antworten = ["M"]; await t.um(2);
assert.deepEqual(t.zustand().arRegUm, [{ alt: "A", neu: "C" }], "neues Register: kein Paar");
antworten = ["A"]; await t.um(0);
assert.deepEqual(t.zustand().arRegUm, [], "zurück zum alten Namen: kein Paar");
antworten = ["Z"]; await t.um(0); t.weg(0);
assert.deepEqual(t.zustand(), { arReg: ["X", "M"], arRegUm: [] }, "entfernt: Paar weg");

assert.ok(lies(".github/workflows/tests.yml").includes("node tests/ordner-kennung.test.mjs"), "läuft in der CI");
console.log("ordner-kennung: ok");
