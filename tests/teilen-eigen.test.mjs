// KC-CLUB-TEILEN-AN-SICH-SELBST (2.791.0, Fund Hansi 31.10.) und -UEBERALL (2.826.0, Fund Hansi 02.11. „Mein Wunschbogen“):
// Teilen aus der Club-App an die eigene Club-App. Android gibt dabei nur Titel/Text weiter – die App nimmt dann die vorher
// beiseitegelegten Dateien und öffnet „Neue Nachricht“.
// Aufruf: node tests/teilen-eigen.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (von, bis) => { const i = app.indexOf(von); assert.ok(i >= 0, von); return app.slice(i, app.indexOf(bis, i)); };

// 1. Jede Stelle, die Dateien teilt, geht über den gemeinsamen Weg (auch der Wunschbogen und das Büro-Teil)
assert.equal((app.match(/navigator\.share\(\{ files/g) || []).length, 0, "keine Datei-Teilen-Stelle ohne Rückfall");
assert.ok((app.match(/teilenMitRueckfall\(\{ files/g) || []).length >= 12, "alle Datei-Teilen-Stellen nutzen teilenMitRueckfall");
assert.ok(/await teilenMitRueckfall\(\{ files: \[datei\], title: "Mein Wunschbogen" \}\)/.test(app), "Wunschbogen (Fund 02.11.)");
assert.ok(/await teilenMitRueckfall\(\{ files: \[datei\], title: DRUCK\.titel \}\)/.test(app), "Druckvorschau (Fund 31.10.)");
// Beiseitelegen blockiert das Teilen nicht (frischer Tipp nötig) und wird bei Fehler nicht gelöscht
const weg = stueck("function teilenMitRueckfall(daten)", "\n}\n");
assert.ok(/\{[^\n]*\n  eigenTeilenMerken\(daten\.files \|\| \[\], daten\.title, daten\.text\);\n  return navigator\.share\(daten\);/.test(weg), "nebenher merken, sofort teilen");
assert.ok(!/eigenTeilenVergessen\(\); if \(e\?\.name === "AbortError"\)/.test(app), "kein Löschen beim Fehler des Teilens");

// 2. Empfang: sobald keine Datei ankam – vor allen „nichts angekommen“-Meldungen und dem Ablagekorb; Grund geht in die Diagnose
const rx = stueck("async function geteiltEmpfangen()", "\n}\n");
const i = rx.indexOf("eigenTeilenHolen(info.titel, info.text)");
assert.ok(i > 0 && /if \(!dateien\.length\) \{/.test(rx) && /if \(eigen\.dateien\.length\) return eigenTeilenEmpfangen\(eigen\.dateien\);/.test(rx), "Rückfall ohne Datei");
assert.ok(/api\("diagnose", \{ art: "teilen_eigen", daten: \{ grund: eigen\.grund, anzahl: eigen\.dateien\.length \} \}\)/.test(rx), "Diagnose nur Grund und Anzahl");
assert.ok(i < rx.indexOf("Es ist nichts angekommen") && i < rx.indexOf("ablkAblegen("), "vor Fehlermeldung und Ablagekorb");

// 3. „In der Club-App senden“ und der Rückfall nutzen denselben Weg in „Neue Nachricht“
assert.ok(/druckVorschauZu\(\);\n    await anlageInNeueNachricht\(\[\{ r, name \}\]\);/.test(app), "Druckvorschau nutzt den gemeinsamen Weg");
assert.ok(/liste\.push\(\{ r: await anlageHochladen\(d\), name: d\.name \}\); await anlageInNeueNachricht\(liste\);/.test(app), "Rückfall nutzt den gemeinsamen Weg");

// 4. Verhalten mit nachgebautem Zwischenspeicher
const code = ["async function eigenTeilenMerken(", "function eigenTeilenVergessen(", "async function eigenTeilenHolen("].map((f) => stueck(f, "\n}\n") + "\n}\n").join("\n");
const speicher = new Map();
const caches = { open: async (n) => ({ put: async (k, r) => speicher.set(n + "|" + k, r), match: async (k) => speicher.get(n + "|" + k)?.clone() }),
  delete: async (n) => { for (const k of [...speicher.keys()]) if (k.startsWith(n + "|")) speicher.delete(k); return true; } };
let jetzt = 1_000_000;
const { eigenTeilenMerken, eigenTeilenHolen } = new Function("caches", "Date", `${code}; return { eigenTeilenMerken, eigenTeilenHolen };`)(caches, { now: () => jetzt });
const datei = (n, t, b = 4) => new File([new Uint8Array(b)], n, { type: t });
const warte = () => new Promise((r) => setTimeout(r, 5));

await eigenTeilenMerken([datei("Wunschbogen.pdf", "application/pdf")], "Mein Wunschbogen"); jetzt += 60000;
let e = await eigenTeilenHolen("Mein Wunschbogen", "");
assert.ok(e.grund === "ok" && e.dateien.length === 1 && e.dateien[0].name === "Wunschbogen.pdf" && e.dateien[0].type === "application/pdf", "Wunschbogen kommt zurück");
await warte(); assert.equal((await eigenTeilenHolen("Mein Wunschbogen", "")).grund, "nichts_gemerkt", "nur einmal");

await eigenTeilenMerken([datei("a.jpg", "image/jpeg"), datei("b.jpg", "image/jpeg", 7)], undefined, "Schöne Fotos");
e = await eigenTeilenHolen(undefined, "Schöne Fotos");
assert.ok(e.grund === "ok" && e.dateien.length === 2 && e.dateien[1].size === 7, "mehrere Fotos mit Text (ohne Titel)");

await eigenTeilenMerken([datei("x.pdf", "application/pdf")], "Köcheclub-Treffen");
assert.equal((await eigenTeilenHolen("Etwas anderes", "")).grund, "anderes_teilen", "anderer Titel → nichts");
assert.equal((await eigenTeilenHolen("Köcheclub-Treffen", "fremder Text")).grund, "anderes_teilen", "anderer Text → nichts");
assert.equal((await eigenTeilenHolen("Köcheclub-Treffen", "")).grund, "ok", "fremdes Teilen löscht das Beiseitegelegte nicht");

await eigenTeilenMerken([datei("x.pdf", "application/pdf")], "Köcheclub-Treffen"); jetzt += 5 * 60000 + 1;
assert.equal((await eigenTeilenHolen("Köcheclub-Treffen", "")).grund, "zu_alt", "älter als 5 Min. → nichts");
await warte(); assert.equal((await eigenTeilenHolen("Köcheclub-Treffen", "")).grund, "nichts_gemerkt", "zu alt → weggeräumt");

console.log("teilen-eigen: alle Prüfungen bestanden");
