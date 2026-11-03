// KC-CLUB-START-VORAB (2.839.0, #44 F, Hansi „Startanfrage schneller, aber Vorsicht“): Sperrliste, Wartungsfenster und Sitzungs-Vorgaben
// werden gleichzeitig mit der Anmeldung gelesen; die Prüfungen danach bleiben unverändert. Aufruf: node tests/start-vorab.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const s = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const i0 = s.indexOf("const tAnm = Date.now();"), blk = s.slice(i0, s.indexOf("const anmeldungMs = Date.now() - tAnm;", i0));
assert.ok(i0 > 0 && blk.length < 4000, "Block gefunden");
const iV = blk.indexOf("const vorab ="), iA = blk.indexOf("const ich = await anmelden(req);"), iW = blk.indexOf("if (vorab) await vorab;"), iS = blk.indexOf("await sperreFuer(ich.person_id)"), iE = blk.indexOf("await einspielenLage()");
assert.ok(iV > 0 && iV < iA && iA < iW && iW < iS && iS < iE, "vorab starten → anmelden → vorab abwarten → Prüfungen wie bisher");
assert.ok(/START_VORAB\.has\(a\) && \/\^\[0-9a-f\]\{32,96\}\$\/\.test\(req\.headers\.get\("x-club-token"\) \?\? ""\)/.test(blk), "nur bekannte Aktionen und gültig aussehender Schlüssel");
assert.ok(/Promise\.all\(\[sperrenAktuell\(\)\.catch\(\(\) => null\), a === "init" \? einspielenLage\(\) : null, sitzungVorgaben\(\)\]\)/.test(blk), "die drei Lesungen, Fehler fangen");
assert.ok(/const START_VORAB = new Set\(\["init", "online", "unterhaltungen", "unterhaltung"\]\)/.test(s), "Registry der Aktionen");
// Die vorab gelesenen Werte bleiben im Speicher – sonst wäre es doppelte Arbeit
assert.ok(/SPERREN\.bis = Date\.now\(\) \+ 15_000/.test(s) && /EINSPIEL_MERK && Date\.now\(\) - EINSPIEL_MERK\.t < 15000/.test(s) && /Date\.now\(\) - SV_AM < 300000\) return SV/.test(s), "Merker: 15 s / 15 s / 5 Min.");
// werfen nie (sonst „unhandled rejection“, wenn die Anmeldung scheitert)
const fn = (n) => s.slice(s.indexOf(`async function ${n}(`), s.indexOf("\n}\n", s.indexOf(`async function ${n}(`)));
assert.ok(/try \{[^]*\} catch \{ \/\* im Zweifel nie aussperren \*\/ \}/.test(fn("einspielenLage")), "Wartungsfenster wirft nicht");
assert.ok(/try \{[^]*\}\s*catch \(e\) \{ console\.error\("sitzung_vorgaben"/.test(fn("sitzungVorgaben")), "Sitzungs-Vorgaben werfen nicht");
console.log("start-vorab: alle Prüfungen bestanden");
