// KC-CLUB-DIENST-STEMPEL (2.590.0, 22.10.2026, Wunsch Hansi „zum Dienst anmelden und abmelden – auch in der App, mit Vorschlag aus dem
// Dienstplan“, Konzept „Dienst-Anmeldung in der Club-App“): Regeln für Kommen/Gehen. Ein gemeinsames Buchungsbuch (kc_dp_stempel) für
// Club-App und – später – Kasse; Format wie die Stechuhr der Kasse (KC_TIME_CLOCK_V1: Kommen/Gehen, gebuchte Zeit, Zeit der Eingabe, Grund).
// Entscheidungen Hansi (22.10.): Ort nur markieren (300 m), Zeitfenster ±2 Std., Grund ab 15 Min., selbst korrigieren 24 Std.,
// „spontan mithelfen“ erlaubt (Planer bestätigt), Aushilfen dürfen auch. Rein (ohne Datenbank/Netz) – tests/dienst-stempel.test.mjs.

export const DS = { vorMin: 120, nachMin: 120, gehenMaxStd: 12, grundMin: 15, korrekturStd: 24, radiusM: 300, karteVorMin: 30, planNaheMin: 30,
  zukunftMin: 5, erinnerVorMin: 15, vergessenMin: 60, schrittMin: 5 };
export const DS_GRUENDE = ["Länger geblieben", "Früher entlassen", "Später gekommen", "Früher gekommen", "Krank geworden", "Eigener Wunsch", "Abbau", "Notfall", "Spontan mitgeholfen"]; // wie die Kasse + Kommen
const MIN = 60000;

// letzte gültige Buchung → angemeldet? (Buchungen beliebiger Reihenfolge; stornierte zählen nicht)
export function dsStand(buchungen) {
  const l = (buchungen || []).filter((b) => b && !b.storniert_am).sort((a, b) => Date.parse(a.zeit) - Date.parse(b.zeit) || Date.parse(a.erfasst_am || 0) - Date.parse(b.erfasst_am || 0));
  const letzte = l.at(-1);
  if (letzte?.art === "in") return { angemeldet: true, seit: letzte.zeit, quelle: letzte.quelle || "app", id: letzte.id, dienst: letzte.dienst_ref || null, naechste: "out" };
  return { angemeldet: false, seit: null, quelle: null, id: null, dienst: null, naechste: "in", zuletzt: letzte?.zeit || null };
}

// welcher geplante Dienst ist jetzt dran? dienste: [{ref, startMs, endeMs, …}] (heute/gestern), t = jetzt (ms)
// angemeldet → der Dienst der Anmeldung bzw. der laufende; sonst der nächste, dessen Fenster (Beginn −2 Std. … Beginn +2 Std.) offen ist,
// oder der bald beginnt (Karte ab 30 Min. vorher)
export function dsDienstJetzt(dienste, t, stand) {
  const l = (dienste || []).filter((d) => d && Number.isFinite(d.startMs) && Number.isFinite(d.endeMs)).sort((a, b) => a.startMs - b.startMs);
  if (stand?.angemeldet) {
    const seit = Date.parse(stand.seit);
    return l.find((d) => d.ref && d.ref === stand.dienst) || l.find((d) => seit >= d.startMs - DS.vorMin * MIN && seit <= d.endeMs) || null;
  }
  return l.find((d) => t >= d.startMs - DS.vorMin * MIN && t <= d.startMs + DS.nachMin * MIN && t < d.endeMs) || null;
}
// soll die Karte auf der Startseite stehen? (angemeldet immer; sonst ab 30 Min. vor Beginn bis Fenster-Ende)
export const dsKarteZeigen = (dienst, t, stand) => !!stand?.angemeldet || (!!dienst && t >= dienst.startMs - DS.karteVorMin * MIN && t <= dienst.startMs + DS.nachMin * MIN);

// auf 5 Minuten runden
export const dsRund = (ms) => Math.round(ms / (DS.schrittMin * MIN)) * DS.schrittMin * MIN;
// Vorschlag: nahe am Plan (±30 Min.) → die geplante Zeit, sonst die echte Uhrzeit (gerundet)
export function dsVorschlag(art, dienst, t) {
  const plan = dienst ? (art === "in" ? dienst.startMs : dienst.endeMs) : null;
  return plan != null && Math.abs(t - plan) <= DS.planNaheMin * MIN ? plan : dsRund(t);
}
// Pause: aus dem Plan, sonst nach der Pausenregel (über 6 Std. 30 Min., über 9 Std. 45 Min.)
export function dsPause(kommenMs, gehenMs, planPause) {
  if (Number.isFinite(planPause) && planPause > 0) return planPause;
  const std = (gehenMs - kommenMs) / 3600000;
  return std > 9 ? 45 : std > 6 ? 30 : 0;
}
export const dsMinuten = (kommenMs, gehenMs, pause) => Math.max(0, Math.round((gehenMs - kommenMs) / MIN) - (Number(pause) || 0));
export const dsDauerText = (min) => `${Math.floor(min / 60)} Std.${min % 60 ? ` ${min % 60} Min.` : ""}`;

// braucht die Buchung einen Grund? (mehr als 15 Min. vom Plan weg, oder ohne Plan)
export function dsGrundNoetig(art, zeitMs, dienst) {
  if (!dienst) return true;
  const plan = art === "in" ? dienst.startMs : dienst.endeMs;
  return Math.abs(zeitMs - plan) > DS.grundMin * MIN;
}

// Prüfen einer Buchung – Text der Ablehnung oder null. o: {art, zeitMs, t, dienst, stand, spontan, grund}
export function dsPruefen(o) {
  const { art, zeitMs, t, dienst, stand, spontan } = o || {};
  if (!Number.isFinite(zeitMs)) return "Bitte eine Uhrzeit wählen.";
  if (zeitMs > t + DS.zukunftMin * MIN) return "Die Zeit liegt in der Zukunft – bitte erst dann buchen.";
  if (art === "in") {
    if (stand?.angemeldet) return "Du bist schon angemeldet.";
    if (!dienst && !spontan) return "Für jetzt ist kein Dienst geplant. Hilfst du spontan mit? Dann „Ich helfe spontan mit“ wählen.";
    if (dienst && !spontan && (zeitMs < dienst.startMs - DS.vorMin * MIN || zeitMs > dienst.startMs + DS.nachMin * MIN)) return "Die Zeit liegt außerhalb deines Dienstes (2 Std. vor bis 2 Std. nach Beginn).";
    if (t - zeitMs > DS.gehenMaxStd * 60 * MIN) return "So weit zurück geht nicht – bitte beim Admin nachtragen lassen.";
  } else if (art === "out") {
    if (!stand?.angemeldet) return "Du bist nicht angemeldet.";
    const seit = Date.parse(stand.seit);
    if (zeitMs <= seit) return "Gehen muss nach dem Kommen liegen.";
    if (zeitMs - seit > DS.gehenMaxStd * 60 * MIN) return "Mehr als 12 Std. – bitte beim Admin nachtragen lassen.";
  } else return "Kommen oder Gehen?";
  if (dsGrundNoetig(art, zeitMs, dienst) && !String(o.grund || "").trim()) return "Bitte einen Grund antippen (mehr als 15 Min. vom Plan entfernt).";
  return null;
}
// darf das Mitglied seine Buchung noch selbst ändern? (24 Std. nach der Eingabe)
export const dsKorrekturErlaubt = (buchung, t) => !!buchung && !buchung.storniert_am && t - Date.parse(buchung.erfasst_am) <= DS.korrekturStd * 3600000;

// Entfernung in Metern (Haversine) und „vor Ort“: true/false, null = kein Standort oder keine Orte eingerichtet
export function dsMeter(a, b) {
  const r = (x) => (x * Math.PI) / 180, R = 6371000;
  const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function dsVorOrt(pos, orte) {
  if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon) || !(orte || []).length) return null;
  const ungenau = Number.isFinite(pos.genau) ? Math.min(pos.genau, 500) : 0; // GPS-Ungenauigkeit zählt zugunsten des Mitglieds (höchstens 500 m)
  return orte.some((o) => Number.isFinite(o.lat) && Number.isFinite(o.lon) && dsMeter(pos, o) <= (o.radius || DS.radiusM) + ungenau);
}

// Paare für die Übersicht (Kommen + Gehen); offene Kommen = noch angemeldet, Gehen ohne Kommen = fehlender Beginn
export function dsPaare(buchungen) {
  const l = (buchungen || []).filter((b) => b && !b.storniert_am).sort((a, b) => Date.parse(a.zeit) - Date.parse(b.zeit));
  const out = []; let offen = null;
  for (const b of l) {
    if (b.art === "in") { if (offen) out.push({ kommen: offen, gehen: null }); offen = b; }
    else if (b.art === "out") { out.push({ kommen: offen, gehen: b }); offen = null; }
  }
  if (offen) out.push({ kommen: offen, gehen: null });
  return out;
}
