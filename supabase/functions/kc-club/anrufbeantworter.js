// KC-CLUB-ANRUFBEANTWORTER (2.568.0, 21.10.2026, Wunsch Hansi): Wer angeklopft wird, kann „📼 Anrufbeantworter einschalten“ – der
// Anklopfende spricht dann gleich eine Nachricht auf (höchstens 2 Min., Admin bis 15 Min.). Der Empfänger bekommt sofort bzw. beim nächsten
// Start „Du hast x neue Nachrichten auf deinem Anrufbeantworter“, hört sie an (neueste zuerst, blättern, löschen), der Absender erfährt,
// wann seine Nachricht abgehört wurde. Rein (ohne Datenbank und Netz) – getestet in tests/anrufbeantworter.test.mjs.

export const AB = { maxSek: 120, maxSekAdmin: 900, toleranzSek: 5, jeStunde: 10, liste: 50 };

// darf diese Länge aufgesprochen werden? (die Aufnahme stoppt in der App selbst; Toleranz für Rundung/Verzug)
export const abSekOk = (sek, admin) => Number.isFinite(sek) && sek >= 1 && sek <= (admin ? AB.maxSekAdmin : AB.maxSek) + AB.toleranzSek;

// Zeilen (an mich ungehört + von mir abgehört, Quittung noch nicht gezeigt) → was die App zeigen soll
export function abStand(rows, ich) {
  const l = (rows || []).filter(Boolean);
  const neu = l.filter((x) => x.an === ich && !x.gehoert_am && !x.geloescht_am).sort((a, b) => String(b.erstellt_am).localeCompare(String(a.erstellt_am)));
  const quittungen = l.filter((x) => x.von === ich && x.gehoert_am && !x.quittung_am).sort((a, b) => String(a.gehoert_am).localeCompare(String(b.gehoert_am)))
    .map((x) => ({ id: x.id, an: x.an, gesprochen: x.erstellt_am, gehoert: x.gehoert_am }));
  return { neu: neu.length, neuIds: neu.slice(0, 20).map((x) => x.id), quittungen: quittungen.slice(0, 10) };
}

// ist die hochgeladene Anlage meine eigene Tonaufnahme?
export const abAnlageOk = (att, ich) => !!att && String(att.object_path || "").startsWith(`club/${ich}/`) && /^audio\//.test(String(att.mime_type || ""));
