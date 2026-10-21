// KC-CLUB-ANRUFBEANTWORTER (2.568.0, 21.10.2026, Wunsch Hansi): aufsprechen, anhören, löschen, Quittung „abgehört“.
// Aufruf: node tests/anrufbeantworter.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { AB, abSekOk, abStand, abAnlageOk } from "../supabase/functions/kc-club/anrufbeantworter.js";

// Länge: 2 Min. (Admin 15 Min.), kleine Toleranz
assert.equal(AB.maxSek, 120); assert.equal(AB.maxSekAdmin, 900);
assert.ok(abSekOk(1, false) && abSekOk(120, false) && abSekOk(124, false) && !abSekOk(130, false), "Mitglied: höchstens 2 Min.");
assert.ok(abSekOk(900, true) && !abSekOk(1000, true) && !abSekOk(0, true) && !abSekOk(NaN, false), "Admin bis 15 Min., nie 0");

// Stand: neue an mich (neueste zuerst), Quittungen meiner abgehörten Nachrichten (älteste zuerst)
{
  const ICH = "KC-P-002", D = "KC-P-M0008";
  const rows = [
    { id: "a", von: D, an: ICH, erstellt_am: "2026-10-21T15:00:00Z" },
    { id: "b", von: D, an: ICH, erstellt_am: "2026-10-21T16:00:00Z" },
    { id: "c", von: D, an: ICH, erstellt_am: "2026-10-21T14:00:00Z", gehoert_am: "2026-10-21T14:05:00Z" },
    { id: "d", von: D, an: ICH, erstellt_am: "2026-10-21T13:00:00Z", geloescht_am: "2026-10-21T13:01:00Z" },
    { id: "e", von: ICH, an: D, erstellt_am: "2026-10-21T15:10:00Z", gehoert_am: "2026-10-21T17:40:00Z" },
    { id: "f", von: ICH, an: D, erstellt_am: "2026-10-21T15:20:00Z", gehoert_am: "2026-10-21T17:30:00Z" },
    { id: "g", von: ICH, an: D, erstellt_am: "2026-10-21T15:30:00Z", gehoert_am: "2026-10-21T17:30:00Z", quittung_am: "2026-10-21T17:31:00Z" },
    { id: "h", von: ICH, an: D, erstellt_am: "2026-10-21T15:40:00Z" },
  ];
  const st = abStand(rows, ICH);
  assert.equal(st.neu, 2, "zwei neue (ungehört, nicht gelöscht)");
  assert.deepEqual(st.neuIds, ["b", "a"], "neueste zuerst");
  assert.deepEqual(st.quittungen.map((q) => q.id), ["f", "e"], "Quittungen: abgehört, noch nicht gezeigt, in Abhör-Reihenfolge");
  assert.deepEqual(st.quittungen[1], { id: "e", an: D, gesprochen: "2026-10-21T15:10:00Z", gehoert: "2026-10-21T17:40:00Z" });
  assert.deepEqual(abStand([], ICH), { neu: 0, neuIds: [], quittungen: [] });
}

// nur eigene Tonaufnahmen
assert.ok(abAnlageOk({ object_path: "club/KC-P-002/x.webm", mime_type: "audio/webm" }, "KC-P-002"));
assert.ok(!abAnlageOk({ object_path: "club/KC-P-003/x.webm", mime_type: "audio/webm" }, "KC-P-002"), "fremde Anlage");
assert.ok(!abAnlageOk({ object_path: "club/KC-P-002/x.pdf", mime_type: "application/pdf" }, "KC-P-002"), "kein Ton");
assert.ok(!abAnlageOk(null, "KC-P-002"));

// Migration, Server, App
{
  const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
  const mig = lies("supabase/migrations/20261021_kc_club_v2568_anrufbeantworter.sql"), server = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js"), html = lies("index.html");
  assert.ok(/'abgebrochen', 'anrufbeantworter'/.test(mig) && /grant select, insert, update, delete on public\.kc_club_anrufbeantworter to service_role/.test(mig)
    && /revoke all on public\.kc_club_anrufbeantworter from public, anon, authenticated/.test(mig) && /enable row level security/.test(mig), "Migration: Status, Rechte, RLS");
  assert.ok(/kc_club_rt_klingeln\(array\[new\.an\], 'ab'\)/.test(mig) && /kc_club_rt_klingeln\(array\[new\.von\], 'ab'\)/.test(mig) && !/drop table|truncate|delete from/i.test(mig.replace(/--[^\n]*/g, "")), "Signal an Empfänger/Absender, nichts gelöscht");
  for (const a of ["ab_aufsprechen", "ab_liste", "ab_anhoeren", "ab_loeschen", "ab_stand", "ab_quittung_gesehen"]) assert.ok(server.includes(`case "${a}"`), "Server-Aktion " + a);
  assert.ok(/\.eq\("status", "anrufbeantworter"\)\s*\n?\s*\.gte\("beantwortet_am"/.test(server), "Aufsprechen nur nach eingeschaltetem Anrufbeantworter (15 Min.)");
  assert.ok(/if \(!p\.annehmen && p\.antwort === "ab"\)/.test(server) && /ab: await pAb,/.test(server) && /if \(error\) return null;/.test(server), "Anklopfen → Anrufbeantworter; init liefert Stand, fehlende Tabelle stört nicht");
  assert.ok(/📼 Anrufbeantworter einschalten/.test(app) && /else if \(a\.status === "anrufbeantworter"\) abAngebot\(a\.an, a\.id\)/.test(app) && /if \(s\.art === "ab"\) \{ abStandHolen\(\); return; \}/.test(app), "App: Knopf, Angebot, Signal");
  assert.ok(/const AB_MAX_SEK = \(\) => \(ICH\?\.admin \? 900 : 120\);/.test(app) && /if \(rest <= 0\)/.test(app), "Uhr läuft rückwärts, stoppt bei 0");
  assert.ok(/◀ Neuere/.test(app) && /Ältere ▶/.test(app) && /🗑️ Löschen/.test(app) && /wurde am \$\{esc\(fTag\.format/.test(app) && /id="abMerker"/.test(html), "Blättern, Löschen, Quittung, Merker");
  const tests = lies(".github/workflows/tests.yml"); assert.ok(tests.includes("node tests/anrufbeantworter.test.mjs"), "läuft in der CI");
}
console.log("anrufbeantworter: alle Prüfungen bestanden");
