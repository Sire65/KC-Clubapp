// KC-CLUB-GESPRAECHE (Stufe 1 Telefonate, 30.10.2026, Wunsch Hansi „sehen, wer gerade mit wem spricht, und anklopfen – die anderen können
// mich ins Gespräch aufnehmen“): laufende Telefonate aus den angenommenen Anruf-Beinen bilden und entscheiden, was andere davon sehen dürfen.
// Sichtbar ist nur, DASS gesprochen wird, nie was. Namen nur, wenn ALLE Beteiligten online sichtbar sind (nicht Inkognito/unsichtbar) und
// „Gespräche zeigen“ an haben (Einstellung anklopfen.gespraeche, Standard an) – sonst zählt das Gespräch nur anonym.
// Rein (ohne Datenbank und Netz) – getestet in tests/gespraeche.test.mjs.

export const GS = { max: 4, cacheMs: 15000, alterMs: 6 * 3600000 };

// beine: angenommene Anruf-Beine {id,von,an,art,konferenz_id,automatisch,angenommen_am}. Ein Gespräch = alle Beine derselben Konferenz,
// sonst das einzelne Bein. id = das älteste nicht automatische Bein (daran klopft man an), seit = frühestes angenommen_am.
export function gespraecheBilden(beine) {
  const gruppen = new Map();
  for (const b of beine || []) {
    if (!b || !b.von || !b.an || !b.angenommen_am) continue;
    const key = b.konferenz_id || b.id;
    const g = gruppen.get(key) ?? { key, id: null, idZeit: Infinity, art: "ton", teilnehmer: new Set(), seit: Infinity };
    g.teilnehmer.add(b.von); g.teilnehmer.add(b.an);
    const t = Date.parse(b.angenommen_am);
    if (t < g.seit) g.seit = t;
    if (!b.automatisch && t < g.idZeit) { g.id = b.id; g.idZeit = t; }
    if (b.art === "video") g.art = "video";
    gruppen.set(key, g);
  }
  return [...gruppen.values()].filter((g) => g.id && g.teilnehmer.size >= 2)
    .map((g) => ({ id: g.id, konferenz: g.key !== g.id ? g.key : null, art: g.art, teilnehmer: [...g.teilnehmer].sort(), seit: new Date(g.seit).toISOString() }));
}

// on: Set der online sichtbaren Personen; klopfEinst: Map person_id → Wert der Einstellung „anklopfen“; t: jetzt (ms)
// Ergebnis: liste (mit Namen sichtbar) und anonym (Anzahl ohne Namen). klopfbar: Telefonat (kein Video), nicht voll, ich nicht drin und
// mindestens ein Beteiligter hat Anklopfen erlaubt.
export function gespraecheSichtbar(gespraeche, on, klopfEinst, ich, t) {
  const liste = []; let anonym = 0;
  for (const g of gespraeche || []) {
    const zeigen = g.teilnehmer.every((id) => on.has(id) && klopfEinst?.get(id)?.gespraeche !== false);
    const ichDrin = g.teilnehmer.includes(ich);
    if (!zeigen && !ichDrin) { anonym++; continue; }
    if (!zeigen) continue; // eigenes Gespräch, aber nicht alle wollen gesehen werden → mir selbst nicht als Kachel zeigen
    const voll = g.teilnehmer.length >= GS.max;
    const darf = g.teilnehmer.some((id) => klopfEinst?.get(id)?.erlaubt !== false);
    liste.push({ id: g.id, art: g.art, teilnehmer: g.teilnehmer, seitSek: Math.max(0, Math.round((t - Date.parse(g.seit)) / 1000)),
      ichDrin, voll, klopfbar: g.art === "ton" && !voll && !ichDrin && darf });
  }
  return { liste: liste.sort((a, b) => b.seitSek - a.seitSek), anonym };
}

// Anklopfen „dazukommen“: an wen geht die Frage? Alle Beteiligten, die Anklopfen erlaubt haben (Anrufbeantworter-Einstellung zählt hier nicht).
export function dazuEmpfaenger(teilnehmer, klopfEinst, ich) {
  return (teilnehmer || []).filter((id) => id !== ich && klopfEinst?.get(id)?.erlaubt !== false);
}

// Stand eines Dazukommen-Anklopfens aus meinen Zeilen (eine je Beteiligtem): angenommen, sobald einer aufnimmt; nein, wenn keiner mehr offen ist.
export function dazuStand(zeilen) {
  const z = zeilen || [];
  const an = z.find((x) => x.status === "angenommen");
  if (an) return { status: "angenommen", von: an.an };
  if (z.length && z.every((x) => x.status !== "offen")) return { status: "nein" };
  return { status: "offen" };
}
