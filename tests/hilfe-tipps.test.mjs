// KC-CLUB-HILFE-TIPPS (Wunschliste #71), 2.826.0. Aufruf: node tests/hilfe-tipps.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), haupt = lies("app.js"), teil = lies("teile/hilfetipp.js"), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261103_kc_club_hilfe_tipps.sql");
// Programmteil: Senden/Übersicht nachladbar, Ansehen/Antworten im Hauptprogramm
assert.ok(haupt.includes('hilfetipp: { einstieg: ["tippSenden", "tippListe"]') && lies("sw.js").includes('"hilfetipp"'), "Teil eingetragen");
for (const f of ["tippZeigen", "tippAntwort", "tippLaufband", "tippMeine"]) assert.ok(new RegExp(`(async )?function ${f}\\(`).test(haupt), "im Hauptprogramm: " + f);
for (const f of ["tsSenden", "tsAnleitungWahl", "tsDateien", "tippErinnern", "tsVorlageNehmen"]) assert.ok(teil.includes(`function ${f}(`), "im Teil: " + f);
// Ampel grün → gelb → rot; bei rot „Jetzt antworten“ / „Möchte nicht antworten“; mit Rückmeldung nicht wegklickbar
assert.ok(haupt.includes('return h < 24 ? "gruen" : h < 72 ? "gold" : "rot";'), "Ampel");
assert.ok(haupt.includes('"Bitte gib eine Rückmeldung, ob dir dieser Tipp geholfen hat."') && haupt.includes('ohneAus: !!t.rueckmeldung'));
assert.ok(/st === "rot" \? \[\["💬 Jetzt antworten"[^\]]*\], \["🙅 Möchte nicht antworten", `tippAntwort\(\$\{jsArg\(t\.id\)\}, 'keine'\)`\]\]/.test(haupt), "rot: zwei Knöpfe");
assert.ok(haupt.includes("tippLaufband(add);") && haupt.includes('h.startsWith("#tipp=")'), "Laufband + Sprung aus der Benachrichtigung");
// auf läuft über new Function → JSON, kein esc()
assert.ok(haupt.includes("auf: `tippZeigen(${JSON.stringify(String(t.id))})`"));
// Server: nur Clubleitung sendet, Antworten geprüft, „Nein/anderes“ → offene Anfrage, Anlagen nur eigene oder Anleitungen, Bremse
const sv = server.slice(server.indexOf('case "tipp_vorlagen"'), server.indexOf('case "twinkey_daten"'));
assert.ok((sv.match(/nurLeitung\(ich\);/g) || []).length >= 5, "Leitung");
assert.ok(sv.includes('if (!(antwort in TIPP_ANTWORT))') && sv.includes('if (t && (antwort === "nein" || antwort === "anderes"))') && sv.includes('insert({ person_id: ich.person_id, punkte: [], text: zeile, kontakt: [] })'));
assert.ok(server.includes('String(att.object_path).startsWith(`club/${ich.person_id}/`)') && server.includes('if (!url.startsWith(basis) || !/^[a-z0-9-]{1,60}\\.pdf$/'), "Anlagen geprüft");
assert.ok(sv.includes('if ((count ?? 0) > 3) throw new Fehler("Gerade gingen schon mehrere Tipps raus'), "Bremse");
assert.ok(server.includes('// 2.826.0 KC-CLUB-HILFE-TIPPS: Anlage eines Tipps – Empfänger und Clubleitung'), "anlage_url");
assert.ok(server.includes("hilfeTipps: await pTipps"), "Startdaten");
// Datenbank: Rechte nur Server, gespiegelt
for (const t of ["kc_club_hilfe_tipp", "kc_club_hilfe_tipp_empfang", "kc_club_hilfe_vorlage"]) {
  assert.ok(mig.includes(`grant select, insert, update, delete on public.${t} to service_role;`) && mig.includes(`alter table public.${t} enable row level security;`) && mig.includes(`('${t}'), `) || mig.includes(`('${t}')`), t);
  assert.ok(new RegExp(`\\('${t}', 'Club-App', '(sensitive|normal)', false, true, true`).test(mig), "Spiegel " + t);
}
assert.match(mig, /check \(antwort in \('geholfen', 'nein', 'anderes', 'erledigt', 'keine'\)\)/);
assert.equal(lies("tools/db-test/106_erwartet.txt").trim().split("\n").length, 5);
// Kachel für die ganze Clubleitung, Anfragen nur Admin
assert.ok(haupt.includes('aktion: "uaAdmin()", nur: () => !!(ICH?.admin || ICH?.vorstand)') && haupt.includes('if (ICH?.admin) try { r = await api("unterstuetzung_liste"'));
assert.ok(!/\|\|=/.test(teil), "kein ||=");
console.log("hilfe-tipps: ok");
