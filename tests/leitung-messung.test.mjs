// 2.861.0 KC-CLUB-LEITUNG-MESSUNG + KC-CLUB-UPDATE-NUR-GEAENDERT (Wunsch Hansi 05.11.2026). Aufruf: node tests/leitung-messung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts"), sw = lies("sw.js");

// --- Messung der direkten Leitung: nur Zahlen, nur bei sichtbarer App, als eigene Art (kein Fehler) ---
const RT_STELLE = app.indexOf("function rtVerbinden()"), RTM_STELLE = app.indexOf("const RTM = {");
assert.ok(RT_STELLE > 0 && RTM_STELLE > RT_STELLE, "RTM steht nach rtVerbinden (wird erst zur Laufzeit gebraucht)");
assert.ok(app.includes('RTM.aufbauAb = document.hidden ? 0 : performance.now();'), "Aufbau-Dauer: Start gemerkt");
assert.ok(app.includes('RTM.herzRef = String(RT.ref); RTM.herzAb = document.hidden ? 0 : performance.now();'), "Herzschlag: Sendezeit gemerkt");
assert.ok(app.includes('if (d.topic === "phoenix" && d.event === "phx_reply" && d.ref === RTM.herzRef && RTM.herzAb) { if (!document.hidden) rtMessWert("rtt", performance.now() - RTM.herzAb); RTM.herzAb = 0; }'), "Herzschlag-Antwort gemessen");
assert.ok(app.includes('if (war && !RT.zu && !document.hidden) RTM.abbrueche++;'), "nur echte Abbrüche zählen");
assert.ok(/function rtMessTakt\(\) \{[\s\S]{0,600}if \(RT\.ok && j - \(RT\.letzte \|\| 0\) < RT_STILL_MS\) RTM\.steht \+= d;/.test(app), "„antwortet nicht“ zählt nicht als steht (Regel 11)");
assert.ok(app.includes("setInterval(() => { if (!document.hidden) { rtLedZeigen(); rtMessTakt(); } }, 3000);"), "Takt nur bei sichtbarer App, im vorhandenen 3-s-Takt");
const melden = app.slice(app.indexOf("function rtMessMelden()"), app.indexOf("document.addEventListener(\"visibilitychange\", () => { if (!document.hidden) return; rtMessMelden();"));
assert.ok(/fpNeu\("leitung", \{ sek: /.test(melden), "Meldung über das Geräte-Protokoll");
const felder = [...melden.matchAll(/\b([a-z_0-9]+): (?=[A-Za-z(nM])/g)].map((m) => m[1]);
for (const f of felder) assert.ok(["sek", "steht_pct", "rtt_n", "rtt_ms", "rtt_p90_ms", "rtt_max_ms", "aufbau_n", "aufbau_ms", "abbrueche", "signale", "netz", "sicht", "steht", "rtt", "aufbau", "signale0"].includes(f), `nur Zahlen/Netzart – unbekanntes Feld ${f}`);
assert.ok(!/text|thread|person|name|inhalt/i.test(melden.replace(/RT\.signale/g, "")), "keine Inhalte, keine Personen, keine Unterhaltungen");

// --- Server: eigene Art, kein Fehler, 60 Tage ---
assert.ok(server.includes('const FP_MESSUNG: Record<string, string> = { leitung: "leitung_messung" };') && server.includes("aktion: fpAktion(e?.art), details: { ...fpSauber(e), ua, version } })));"), "Server speichert leitung_messung");
assert.ok(server.includes('.replace(/^leitung_messung$/, "leitung") + "|" + x.z));'), "Doppel-Filter kennt die Art");
assert.ok(server.includes('FP_INFO.add("leitung");'), "Info, kein Fehler");
assert.ok(/const PROT_LAERM = \[[^\]]*"leitung_messung"/.test(server), "nach 60 Tagen aufgeräumt");

// --- Updates laden nur geänderte Teile (Adresse mit Kurz-Fingerabdruck) ---
assert.ok(/const TEILE = \{ [a-z]+: "[A-Za-z0-9_-]{16}"/.test(sw) && !/teile\/\$\{t\}\.js\?v=/.test(sw), "sw.js: Teile mit Kurz-Fingerabdruck statt Version");
assert.ok(app.includes("skriptLaden(`teile/${name}.js?h=${teilKennung(t.sri)}`, t.sri)") && !/teile\/\$\{name\}\.js\?v=/.test(app), "app.js lädt dieselbe Adresse, prüft den vollen Fingerabdruck");
assert.ok(lies("tools/teile-pruefsumme.mjs").includes('const swNeu = sw.replace(/const TEILE = \\{[^}]*\\};/'), "Werkzeug pflegt sw.js mit");
console.log("leitung-messung: ok");
