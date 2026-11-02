// KC-CLUB-DISCO (2.809.0, 02.11.2026, Wunschliste #58). Aufruf: node tests/disco.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html");
// Thema, Szene, Deko, Hilfe
assert.ok(app.includes('{ id: "disco", sym: "🪩", name: "Disco", design: "disko", jz: "disco"'), "Thema Disco");
assert.ok(/const JZB_ARTEN = \[[^\]]*"disco"\];/.test(app) && /const JZB_FESTE = \[[^\]]*"disco"\];/.test(app) && app.includes("disco: [\"lichter\", \"bunt\"]"));
assert.ok(app.includes('if (J.saison === "disco") return jzbDsSchritt(F, dt);') && app.includes('if (J.saison === "disco") jzbDsMalen(c, F);'));
assert.ok(app.includes('{ id: "disco", thema: "darstellung", sym: "🪩", t: "Thema Disco"'), "Hilfe");
// Ablauf: 4 Tänzer, Twinkey-Solo, Nebel; sparsam (24 Lichtpunkte, 12 Nebelwolken, kein shadowBlur)
assert.ok(app.includes("const DISCO_DAUER = 60, DISCO_SOLO = [16, 28], DISCO_NEBEL = [38, 50]"));
assert.equal((app.match(/\{ x: \.\d+, f: "#[0-9a-f]{6}", haut:/g) || []).length, 4, "4 Tänzer");
assert.ok(app.includes("Array.from({ length: 24 }") && app.includes("Array.from({ length: 12 }, () => ({ x: 0, y: 0, r: 0"));
const block = app.slice(app.indexOf("// ---------- 2.809.0 KC-CLUB-DISCO"));
assert.ok(!/c\.shadowBlur/.test(block.slice(0, block.indexOf("function jzbDsSchritt"))), "kein shadowBlur (Strom)");
// Automatik: Clubabend-Tag und Silvester, alle 2 Minuten im Wechsel; Sim-Jü geht vor
assert.ok(app.includes("const DISCO_WECHSEL_MIN = 2;") && app.includes('if (jahreszeitArt(d) === "silvester") return true;'));
assert.ok(app.includes('(jzSimJueZeit(d) ? "kirmes" : discoJetzt(d) ? "disco" :'));
// Bühne: bei Disco-Liedern hinter Twinkey, Solo übersprungen, beim Verlassen aus
const rs = lies("teile/rueckseite.js");
assert.ok(rs.includes('if (s.stil === "Disco" && !H.pause) teilLaden("szenen").then(() => { if ($("bwHoer") === bh) discoBuehneAn(bh); })'));
assert.ok(rs.includes('if (typeof discoBuehneAus === "function") discoBuehneAus(); // 2.809.0 KC-CLUB-DISCO'));
assert.ok(html.includes(".ds-buehne { position: absolute;"));
// Automatik rein geprüft
const jzArt = (d) => { const m = d.getMonth() + 1, t = d.getDate(); return (m === 12 && t === 31) || (m === 1 && t === 1) ? "silvester" : "herbst"; };
const wechsel = (d) => Math.floor(d.getTime() / 120000) % 2 === 0;
assert.equal(jzArt(new Date(2026, 11, 31, 20)), "silvester");
assert.notEqual(wechsel(new Date(Date.UTC(2026, 11, 31, 19, 0))), wechsel(new Date(Date.UTC(2026, 11, 31, 19, 2))), "wechselt alle 2 Minuten");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/disco.test.mjs"), "läuft in der CI");
console.log("disco: ok");
