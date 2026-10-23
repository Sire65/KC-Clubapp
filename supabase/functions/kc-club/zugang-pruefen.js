// KC-CLUB-ZUGANG-AUFRAEUMEN (2.607.0, 23.10.2026, Wunsch Hansi „Sicherheit Punkt 6: alte Zugangslinks aufräumen“):
// Welche persönlichen Links sind ein Risiko? Nie benutzte Links liegen irgendwo in WhatsApp/Mail; lange ruhende Links gehören vielleicht
// zu einem verlorenen Handy. Die App schlägt nur vor – abschalten entscheidet der Admin (wer wieder will, bekommt einen neuen Link).
// Rein (ohne Datenbank/Netz) – tests/zugang-pruefen.test.mjs.

export const ZG = { nieTage: 21, ruheTage: 60 };
const TAG = 86400000;

// z: { aktiv, erstellt_am, zuletzt_gesehen }, mitglied: { active } | null, t = jetzt → { stufe, text }
// stufe: "aus" (abgeschaltet) | "ausgetreten" | "nie" | "ruht" | "ok"
export function zgBewerten(z, mitglied, t) {
  if (!z?.aktiv) return { stufe: "aus", text: "Link abgeschaltet" };
  if (!mitglied?.active) return { stufe: "ausgetreten", text: "Kein aktives Mitglied mehr – der Link funktioniert noch" };
  const seit = (iso) => Math.floor((t - Date.parse(iso)) / TAG);
  if (!z.zuletzt_gesehen) {
    const alt = z.erstellt_am ? seit(z.erstellt_am) : null;
    return alt != null && alt > ZG.nieTage ? { stufe: "nie", text: `Link seit ${alt} Tagen nie benutzt` } : { stufe: "ok", text: alt != null ? `neu (vor ${alt} Tagen erstellt)` : "noch nie benutzt" };
  }
  const ruhe = seit(z.zuletzt_gesehen);
  return ruhe > ZG.ruheTage ? { stufe: "ruht", text: `seit ${ruhe} Tagen nicht mehr in der App` } : { stufe: "ok", text: ruhe < 1 ? "heute in der App" : `vor ${ruhe} Tag${ruhe === 1 ? "" : "en"} in der App` };
}
export const zgAuffaellig = (stufe) => stufe === "nie" || stufe === "ruht" || stufe === "ausgetreten";
// Reihenfolge der Liste: Auffällige zuerst (ausgetreten, nie, ruht), dann ok, dann abgeschaltet
export const ZG_REIHE = ["ausgetreten", "nie", "ruht", "ok", "aus"];
