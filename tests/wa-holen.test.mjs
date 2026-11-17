// KC-CLUB-WA-HOLEN (Wunsch Hansi 16.11.2026: „Wie kriegen wir WhatsApp-Nachrichten in die Club-App – direkt oder über Umwege?“ → Weg 2 Teilen/Einfügen, „Ja“).
// Aufruf: node tests/wa-holen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teil = (a, b) => { const i = app.indexOf(a); assert.ok(i >= 0, a); return app.slice(i, app.indexOf(b, i)); };
const aufb = teil("const WA_TEL =", "function waEinsetzen("), zu = teil("function waMitgliedZuName(", "function waEinfuegenAuto(");
const lade = (MITGLIEDER = [], ICH = { person_id: "ICH", name: "Hansi H", vorname: "Hansi" }) => new Function("MITGLIEDER", "ICH", aufb + zu + "; return { waAufbereiten, waMitgliedZuName };")(MITGLIEDER, ICH);
const M = [{ person_id: "M", vorname: "Marianne", name: "Marianne Muster" }, { person_id: "A", vorname: "Anne", name: "Anne Alt" }, { person_id: "A2", vorname: "Anne", name: "Anne Neu" }, { person_id: "ICH", vorname: "Hansi", name: "Hansi H" }];
const { waAufbereiten: u, waMitgliedZuName: z } = lade(M);
// WhatsApp-Kopie (Android „[hh:mm, Datum] Name:“ und Export „Datum, hh:mm - Name:“) wird erkannt, Namen kommen mit
const a = u("[21:03, 16.11.2026] Marianne Muster: Hallo Hansi\n[21:04, 16.11.2026] Marianne Muster: Ruf an: 0171 1234567");
assert.equal(a.wa, true); assert.deepEqual(a.namen, ["Marianne Muster"]);
assert.ok(a.text.startsWith("📋 Aus WhatsApp:\nMarianne (21:03): Hallo Hansi") && a.text.includes("[Nummer entfernt]"), "aufbereitet, Nummer entfernt");
assert.equal(u("16.11.26, 21:03 - Anne Neu: Moin").wa, true);
// normaler Text: kein WhatsApp → beim Einfügen bleibt alles wie es ist
assert.ok(!u("Hallo zusammen, morgen 18 Uhr").wa);
// Mitglied zum Namen – nur eindeutig, ich selbst zählt nicht
assert.equal(z(["Marianne"])?.person_id, "M", "Vorname");
assert.equal(z(["Marianne Muster", "Hansi H"])?.person_id, "M", "ganzer Name");
assert.equal(z(["Anne"]), null, "zwei Annes → kein Vorschlag");
assert.equal(z(["Anne Neu"])?.person_id, "A2", "ganzer Name eindeutig");
assert.equal(z(["Mama"]), null);
assert.equal(z(["Marianne", "Anne Neu"]), null, "zwei Personen → kein Vorschlag");
// Einbau
assert.ok(/<textarea id="text" [^>]*onpaste="waEinfuegenAuto\(event\)"/.test(html), "normales Einfügen ins Schreibfeld erkennt WhatsApp-Text (kein neuer Knopf)");
assert.ok(/if \(!w\?\.wa\) return;\n  e\.preventDefault\(\);/.test(app), "nur WhatsApp-Text wird umgewandelt, sonst normales Einfügen");
assert.ok(/if \(!dateien\.length && text\) return waTeilenWahl\(text\);/.test(app), "geteilter Text: selbst wählen (Chat oder Ablagekorb)");
assert.ok(/waTeilenKorb\(\)">📥 In den Ablagekorb/.test(app), "Ablagekorb bleibt wählbar");
assert.ok(/if \(!text \|\| WA_HOLEN\.aus \|\|/.test(app) && /waLieberJetzt\(text\); WA_HOLEN\.aus = false;/.test(app), "übernommener Text öffnet nicht wieder WhatsApp");
console.log("✅ wa-holen: alle Prüfungen bestanden");
