// KC-CLUB-PUSH-NEU-FRAGEN (07.11.2026, Wunsch Hansi). Aufruf: node tests/push-neu-fragen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// wer nie Push hatte, wird gefragt (vorher: return); wer ein anderes Gerät mit Push hat, nicht
assert.ok(app.includes("if ((r.aktiv || 0) - altHier > 0) return; // ein anderes Gerät bekommt ihn") && app.includes("if (!r.frueher) return pushNeuFragen(r);"));
const f = app.slice(app.indexOf("function pushNeuFragen(r)"), app.indexOf("async function pushUmschalten()"));
assert.ok(f.includes("if (r?.kommAus || w.nie || (w.bis && Date.parse(w.bis) > Date.now())) return;"), "nie bei Kommunikation aus, nicht mehr fragen, Pause");
assert.ok(f.includes('lsLesen("kc_club_push_neu_gefragt") === heute'), "höchstens einmal am Tag");
assert.ok(f.includes("du hast noch nicht Push aktiviert. So erfährst du nicht zeitnah, wenn es etwas Neues in der Club-App gibt. Möchtest du jetzt einschalten?"), "Text von Hansi");
for (const k of ['data-w="ja">🔔 Ja, jetzt einschalten', 'data-w="nein">Nein', 'data-w="spaeter">Später', 'data-w="nie">Nicht mehr fragen']) assert.ok(f.includes(k), k);
assert.ok(f.includes('if (was === "ja") return pushEinschalten();') && f.includes("PUSH_NEU_NEIN_TAGE * 86400000") && f.includes("merken({ nie: true })"));
assert.ok(app.includes("const PUSH_NEU_NEIN_TAGE = 7;"));
// Server: Einstellung erlaubt, push_pruefen liefert Wahl + Kommunikation aus (Fehler → als aus behandeln = nicht fragen)
assert.ok(server.includes("push_frage: (w) => ({ nie: w?.nie === true, bis:"));
assert.ok(server.includes("kommunikationAus().then((s) => s.has(ich.person_id), () => true)") && server.includes("frage: pf?.wert ?? null, kommAus: ka"));
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/push-neu-fragen.test.mjs"), "läuft in der CI");
console.log("push-neu-fragen: ok");
