// KC-CLUB-ANKLOPFEN-VERPASST (2.567.0, 21.10.2026, Wunsch Hansi nach Fall Dieter): verpasstes Anklopfen beim nächsten Besuch zeigen
// („Hansi hat angeklopft – möchtest du ihn jetzt erreichen?“) und dem Anklopfenden sagen, ob die Mitteilung auf dem Handy angekommen ist.
// Ob ein Handy stumm ist, verrät kein Browser – sicher wissen wir nur „angezeigt“ bzw. „geöffnet“ (Quittung des Service Workers).
// Rein (ohne Datenbank und Netz) – getestet in tests/anklopfen-verpasst.test.mjs.

export const KV = { fensterMs: 24 * 3600000, max: 3 };

// rows: Anklopfen an mich (beliebiger Status), t: jetzt (ms), offenSek: so lange gilt ein offenes Anklopfen, gesehenBis: ISO (Hinweis schon gezeigt bis)
// Ergebnis: je Anklopfendem das neueste verpasste Anklopfen (nicht angenommen, keine Kurzantwort), neueste zuerst, höchstens KV.max
export function klopfVerpasst(rows, ich, t, offenSek, gesehenBis) {
  const ms = (x) => Date.parse(x), ab = Math.max(t - KV.fensterMs, ms(gesehenBis) || 0);
  const alle = [...(rows || [])].filter((x) => x && x.an === ich && x.von && x.von !== ich).sort((a, b) => ms(b.erstellt_am) - ms(a.erstellt_am));
  const verp = alle.filter((x) => ms(x.erstellt_am) > ab && !x.antwort
    && (x.status === "abgebrochen" || (x.status === "offen" && t - ms(x.erstellt_am) > offenSek * 1000)));
  const raus = [], gesehen = new Set();
  for (const v of verp) {
    if (gesehen.has(v.von)) continue; gesehen.add(v.von);
    // später doch zusammengekommen (Anklopfen angenommen/beantwortet) → kein Hinweis
    if (alle.some((y) => y.von === v.von && ms(y.erstellt_am) > ms(v.erstellt_am) && (y.status === "angenommen" || y.status === "spaeter"))) continue;
    raus.push({ id: v.id, von: v.von, zeit: v.erstellt_am });
  }
  return raus.slice(0, KV.max);
}

// nach dem Anklopfen miteinander telefoniert oder geschrieben? anrufe: [{ von, an, angenommen_am }], nachrichten: [{ von, an, zeit }]
// (an = die andere Person im Zweiergespräch)
export function klopfVerpasstOhneKontakt(liste, ich, anrufe, nachrichten) {
  const ms = (x) => Date.parse(x);
  const paar = (a, b, v) => (a === ich && b === v) || (a === v && b === ich);
  return (liste || []).filter((v) => !(anrufe || []).some((s) => s.angenommen_am && paar(s.von, s.an, v.von) && ms(s.angenommen_am) > ms(v.zeit))
    && !(nachrichten || []).some((n) => paar(n.von, n.an, v.von) && ms(n.zeit) > ms(v.zeit)));
}

// Stand der Mitteilung aus dem Versandauftrag (kc_communication_requests + delivery_events): geoeffnet > angezeigt > gesendet > fehler
export function klopfPushStand(req) {
  if (!req) return null;
  const ev = Array.isArray(req.kc_communication_delivery_events) ? req.kc_communication_delivery_events : [];
  const zeit = (typ) => ev.filter((e) => e?.event_type === typ).map((e) => e.created_at).sort()[0] || null;
  const st = String(req.status || "");
  if (st === "opened" || zeit("opened")) return { stand: "geoeffnet", zeit: zeit("opened") || zeit("displayed") };
  if (st === "displayed" || zeit("displayed")) return { stand: "angezeigt", zeit: zeit("displayed") };
  if (/fail|dead|error|rejected|expired/.test(st)) return { stand: "fehler", zeit: null };
  if (st === "sent" || st === "delivered" || zeit("sent")) return { stand: "gesendet", zeit: zeit("sent") };
  return { stand: "unterwegs", zeit: null };
}
