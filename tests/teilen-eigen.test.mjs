// KC-CLUB-TEILEN-AN-SICH-SELBST (2.791.0, Fund Hansi 31.10.): Teilen aus der Druckvorschau an die eigene Club-App.
// Android gibt dabei nur den Titel weiter – die App nimmt dann das vorher beiseitegelegte PDF und öffnet „Neue Nachricht“.
// Aufruf: node tests/teilen-eigen.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (von, bis) => { const i = app.indexOf(von); assert.ok(i > 0, von); return app.slice(i, app.indexOf(bis, i)); };

// 1. Druckvorschau: PDF vor dem Teilen beiseitelegen, bei Abbruch/Fehler wieder vergessen
const pdf = stueck("async function druckPdf()", "async function druckInAppSenden()");
assert.ok(/await eigenTeilenMerken\(datei, DRUCK\.titel\); await navigator\.share\(\{ files: \[datei\], title: DRUCK\.titel \}\)/.test(pdf), "vor dem Teilen beiseitelegen");
assert.ok(/catch \(e\) \{ eigenTeilenVergessen\(\); if \(e\?\.name === "AbortError"\) return; \}/.test(pdf), "Abbruch: vergessen");

// 2. Empfang: nur wenn nichts ankam (keine Datei, kein Text) – vor allen „nichts angekommen“-Meldungen
const rx = stueck("async function geteiltEmpfangen()", "\n}\n");
const i = rx.indexOf("eigenTeilenHolen(info.titel)");
assert.ok(i > 0 && /if \(!dateien\.length && !text\) \{ const eigen = await eigenTeilenHolen\(info\.titel\); if \(eigen\) return eigenTeilenEmpfangen\(eigen\); \}/.test(rx), "Rückfall nur ohne Datei und Text");
assert.ok(i < rx.indexOf("Es ist nichts angekommen") && i < rx.indexOf("ablkAblegen("), "vor Fehlermeldung und Ablagekorb");

// 3. „In der Club-App senden“ und der Rückfall nutzen denselben Weg in „Neue Nachricht“
assert.ok(/druckVorschauZu\(\);\n    await anlageInNeueNachricht\(r, name\);/.test(app), "Druckvorschau nutzt den gemeinsamen Weg");
assert.ok(/await anlageInNeueNachricht\(await anlageHochladen\(datei\), datei\.name\)/.test(app), "Rückfall nutzt den gemeinsamen Weg");

// 4. Verhalten mit nachgebautem Zwischenspeicher: Titel muss passen, höchstens 5 Minuten, danach weg
const code = ["async function eigenTeilenMerken(", "function eigenTeilenVergessen(", "async function eigenTeilenHolen("].map((f) => stueck(f, "\n}\n") + "\n}\n").join("\n");
const speicher = new Map();
const caches = { open: async (n) => ({ put: async (k, r) => speicher.set(n + k, r), match: async (k) => speicher.get(n + k)?.clone() }), delete: async (n) => { for (const k of [...speicher.keys()]) if (k.startsWith(n)) speicher.delete(k); return true; } };
let jetzt = 1_000_000;
const D = { now: () => jetzt };
const { eigenTeilenMerken, eigenTeilenHolen } = new Function("caches", "Date", `${code}; return { eigenTeilenMerken, eigenTeilenHolen };`)(caches, D);
const pdfDatei = new File([new Uint8Array([37, 80, 68, 70])], "Köcheclub-Treffen.pdf", { type: "application/pdf" });
const warte = () => new Promise((r) => setTimeout(r, 5));

await eigenTeilenMerken(pdfDatei, "Köcheclub-Treffen"); jetzt += 60000;
const da = await eigenTeilenHolen("Köcheclub-Treffen");
assert.ok(da && da.name === "Köcheclub-Treffen.pdf" && da.type === "application/pdf" && da.size === 4, "passender Titel innerhalb 5 Min. → PDF zurück");
await warte(); assert.equal(await eigenTeilenHolen("Köcheclub-Treffen"), null, "nur einmal");

await eigenTeilenMerken(pdfDatei, "Köcheclub-Treffen");
assert.equal(await eigenTeilenHolen("Etwas anderes"), null, "anderer Titel → nichts (fremdes Teilen bleibt unberührt)");
await warte(); assert.equal(await eigenTeilenHolen("Köcheclub-Treffen"), null, "danach weggeräumt");

await eigenTeilenMerken(pdfDatei, "Köcheclub-Treffen"); jetzt += 5 * 60000 + 1;
assert.equal(await eigenTeilenHolen("Köcheclub-Treffen"), null, "älter als 5 Min. → nichts");
assert.equal(await eigenTeilenHolen(undefined), null, "leerer Speicher → nichts");

console.log("teilen-eigen: alle Prüfungen bestanden");
