// KC-CLUB-ANKLOPFEN-VERPASST (2.567.0, 21.10.2026, Wunsch Hansi nach Fall Dieter): verpasstes Anklopfen + Stand der Mitteilung.
// Aufruf: node tests/anklopfen-verpasst.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { KV, klopfVerpasst, klopfVerpasstOhneKontakt, klopfPushStand } from "../supabase/functions/kc-club/anklopfen-verpasst.js";

const T = Date.parse("2026-10-21T15:10:00Z"), iso = (minVorher) => new Date(T - minVorher * 60000).toISOString(), ICH = "KC-P-M0008";
const z = (id, von, min, status, antwort = null) => ({ id, von, an: ICH, status, erstellt_am: iso(min), antwort });

// Fall Dieter: Hansi klopft 16:58 an, legt nach 52 s auf → beim nächsten Besuch ein Hinweis
{
  const l = klopfVerpasst([z("k1", "KC-P-002", 12, "abgebrochen")], ICH, T, 180, undefined);
  assert.deepEqual(l, [{ id: "k1", von: "KC-P-002", zeit: iso(12) }], "aufgelegtes Anklopfen gilt als verpasst");
}
// offen: erst nach Ablauf (180 s) verpasst – solange es klopft, zeigt die App das Anklopf-Fenster
assert.equal(klopfVerpasst([z("k1", "A", 2, "offen")], ICH, T, 180).length, 0, "klopft noch");
assert.equal(klopfVerpasst([z("k1", "A", 4, "offen")], ICH, T, 180).length, 1, "abgelaufen = verpasst");
// angenommen / Kurzantwort / „später“ ist nicht verpasst
assert.equal(klopfVerpasst([z("k1", "A", 5, "angenommen"), z("k2", "B", 5, "spaeter", "Gleich!"), z("k3", "C", 5, "abgebrochen", "x")], ICH, T, 180).length, 0, "beantwortet ist nicht verpasst");
// später doch angenommen → kein Hinweis für das frühere
assert.equal(klopfVerpasst([z("k1", "A", 30, "abgebrochen"), z("k2", "A", 10, "angenommen")], ICH, T, 180).length, 0, "danach angenommen");
// je Person nur das neueste, höchstens KV.max, neueste zuerst
{
  const l = klopfVerpasst([z("a1", "A", 50, "abgebrochen"), z("a2", "A", 20, "abgebrochen"), z("b", "B", 30, "offen"), z("c", "C", 40, "offen"), z("d", "D", 60, "offen")], ICH, T, 180);
  assert.deepEqual(l.map((x) => x.id), ["a2", "b", "c"], "je Person das neueste, höchstens 3");
  assert.equal(KV.max, 3);
}
// älter als 24 h oder schon gesehen → nicht mehr
assert.equal(klopfVerpasst([z("k1", "A", 25 * 60, "abgebrochen")], ICH, T, 180).length, 0, "älter als 24 h");
assert.equal(klopfVerpasst([z("k1", "A", 30, "abgebrochen")], ICH, T, 180, iso(20)).length, 0, "schon gesehen");
assert.equal(klopfVerpasst([z("k1", "A", 10, "abgebrochen")], ICH, T, 180, iso(20)).length, 1, "neuer als gesehen");
// eigenes / fremdes Anklopfen zählt nicht
assert.equal(klopfVerpasst([{ id: "x", von: ICH, an: "A", status: "abgebrochen", erstellt_am: iso(5) }, { id: "y", von: "A", an: "B", status: "abgebrochen", erstellt_am: iso(5) }], ICH, T, 180).length, 0, "nur an mich");

// danach telefoniert oder geschrieben → kein Hinweis
{
  const l = [{ id: "k1", von: "A", zeit: iso(30) }, { id: "k2", von: "B", zeit: iso(30) }, { id: "k3", von: "C", zeit: iso(30) }];
  const r = klopfVerpasstOhneKontakt(l, ICH, [{ von: ICH, an: "A", angenommen_am: iso(10) }, { von: "C", an: ICH, angenommen_am: iso(40) }], [{ von: "B", an: ICH, zeit: iso(5) }]);
  assert.deepEqual(r.map((x) => x.id), ["k3"], "A angerufen, B hat geschrieben; C nur vorher telefoniert");
  assert.deepEqual(klopfVerpasstOhneKontakt(l, ICH, [{ von: "A", an: "X", angenommen_am: iso(10) }], [{ von: "B", an: "X", zeit: iso(5) }]).length, 3, "Kontakt mit anderen zählt nicht");
}

// Stand der Mitteilung
{
  const ev = (...l) => l.map(([event_type, m]) => ({ event_type, created_at: iso(m) }));
  assert.equal(klopfPushStand(null), null);
  assert.deepEqual(klopfPushStand({ status: "displayed", kc_communication_delivery_events: ev(["processing", 3], ["sent", 3], ["displayed", 2]) }), { stand: "angezeigt", zeit: iso(2) }, "Fall Dieter: angezeigt");
  assert.deepEqual(klopfPushStand({ status: "opened", kc_communication_delivery_events: ev(["displayed", 2], ["opened", 1]) }), { stand: "geoeffnet", zeit: iso(1) });
  assert.equal(klopfPushStand({ status: "sent", kc_communication_delivery_events: ev(["sent", 3]) }).stand, "gesendet");
  assert.equal(klopfPushStand({ status: "failed" }).stand, "fehler");
  assert.equal(klopfPushStand({ status: "queued" }).stand, "unterwegs");
}

// Einbau im Server und in der App
{
  const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.ok(/from "\.\/anklopfen-verpasst\.js"/.test(server) && /case "anklopfen_verpasst_gesehen"/.test(server) && /"klopf_verpasst"\]\)/.test(server), "Server: Baustein, Aktion, Merker");
  assert.ok(/return json\(\{ ok: true, push: klopfPushStand\(req\?\.\[0\]\) \}\)/.test(server), "Auflegen meldet den Stand");
  assert.ok(/if \(kVerp\.length\) \{/.test(server) && /if \(wartend\.length\) \{/.test(server), "Zusatzabfragen nur bei Bedarf");
  assert.ok(/klopfVerpasstZeigen\(\(r\.klopfVerpasst \|\| \[\]\)/.test(app) && /api\("anklopfen_verpasst_gesehen", \{ bis \}\)/.test(app), "App: Hinweis + gesehen");
  assert.ok(/👋 Zurück anklopfen/.test(app) && /💬 Nachricht schreiben/.test(app) && /data-w="zu">Später/.test(app), "drei Wege");
  assert.ok(/melde\(z \? `📵 Aufgelegt – \$\{z\}` : "📵 Aufgelegt"\)/.test(app), "Aufgelegt mit Stand");
}
console.log("anklopfen-verpasst: alle Prüfungen bestanden");
