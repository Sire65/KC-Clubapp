// KC-CLUB-REZEPT-WEIHNACHT (2.730.0, 28.10.2026, Wunschliste #45, Wunsch Hansi „vorsichtig mit Weihnachtsbäckerei anfangen“):
// Themen im Rezeptbuch (Saison je Thema) und Sterne/„nachgebacken“ je Rezept.
// Rein (ohne Datenbank/Netz) – tests/rezept-weihnacht.test.mjs.

// Saison je Thema als MM-TT (deutsche Zeit), beide Tage eingeschlossen
export const REZEPT_THEMEN = { weihnachtsbaeckerei: { von: "11-01", bis: "12-26" } };
// Durchschnitt erst ab 3 Stimmen zeigen – ein einzelnes „2 Sterne“ unter dem Rezept eines Mitglieds soll nicht wehtun
export const REZEPT_STERNE_AB = 3;

// tagIso = Kalendertag in deutscher Zeit, z. B. "2026-11-15"
export function rzThemaSaison(thema, tagIso) {
  const s = REZEPT_THEMEN[thema], md = String(tagIso || "").slice(5);
  return !!s && md >= s.von && md <= s.bis;
}

// zeilen: { rezept_id, person_id, sterne (1–5 oder null), nachgebacken } – liefert je Rezept-ID
// { sterne: Schnitt mit einer Nachkommastelle oder null, stimmen, nachgebacken, meine: { sterne, nachgebacken } | null }
export function rzBewertungen(zeilen, ichId) {
  const m = new Map();
  for (const b of zeilen || []) {
    const e = m.get(b.rezept_id) ?? { summe: 0, stimmen: 0, nachgebacken: 0, meine: null };
    m.set(b.rezept_id, e);
    if (b.sterne >= 1 && b.sterne <= 5) { e.summe += b.sterne; e.stimmen++; }
    if (b.nachgebacken) e.nachgebacken++;
    if (b.person_id === ichId) e.meine = { sterne: b.sterne ?? null, nachgebacken: !!b.nachgebacken };
  }
  return (id) => {
    const e = m.get(id);
    return { sterne: e && e.stimmen >= REZEPT_STERNE_AB ? Math.round((e.summe / e.stimmen) * 10) / 10 : null,
      stimmen: e?.stimmen ?? 0, nachgebacken: e?.nachgebacken ?? 0, meine: e?.meine ?? null };
  };
}

// Prüft eine Bewertung von einem Mitglied: null = in Ordnung, sonst der Fehlertext
export function rzBewertungPruefen(sterne, eigenesRezept) {
  if (sterne !== null && !(Number.isInteger(sterne) && sterne >= 1 && sterne <= 5)) return "Bitte 1 bis 5 Sterne wählen.";
  if (sterne !== null && eigenesRezept) return "Das eigene Rezept kannst du nicht mit Sternen bewerten.";
  return null;
}
