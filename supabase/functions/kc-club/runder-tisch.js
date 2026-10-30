// KC-CLUB-RUNDER-TISCH (2.760.0, Stufe RT1, 30.10.2026, Wunsch Hansi „Runder Tisch: jeder darf einladen, jeder darf dazukommen, höchstens 18“):
// Regeln für den Runden Tisch – Einladen, Platz nehmen, Verlängern, Aufräumen. Spezifikation: docs/RUNDER_TISCH.md.
// Ein Tisch hat Thema, Beginn, Dauer und Plätze; „am Tisch“ ist, wer Platz genommen hat und sich in den letzten frischSek gemeldet hat
// (Herzschlag der App alle 60 s). Wer länger nichts sagt, gibt den Platz frei; die Anzeige zeigt ihn vorher grau (Vertrag Regel 11).
// Rein (ohne Datenbank/Netz) – tests/runder-tisch.test.mjs.

export const RT = {
  plaetzeMin: 4, plaetzeMax: 18, plaetzeStandard: 18,
  dauern: [30, 60, 90], verlaengernMin: 30, verlaengernMax: 60,
  vorlaufMin: 15,           // so lange vor Beginn erscheint der Tisch und man kann Platz nehmen
  vorausTage: 60,           // so weit im Voraus darf eingeladen werden
  offenMax: 3,              // so viele kommende Tische darf eine Person gleichzeitig eingeladen haben
  themaMax: 80, beschreibungMax: 300,
  herzSek: 60,              // die App meldet sich so oft, solange der Tisch offen ist
  unsicherSek: 90,          // danach grau („unbekannt“)
  frischSek: 150,           // danach ist der Platz wieder frei
  medienTage: 7, textTage: 30, // Aufräumen nach Tischende (Wahl Hansi 30.10.2026)
  toMax: 12, toPunktMax: 120,  // Tagesordnung der Besprechung
  bestaetigungAnteil: 0.5,     // Teilnahmebestätigung ab der Hälfte der Seminarzeit
};
// 2.761.0 KC-CLUB-RUNDER-TISCH-ARTEN (Stufe RT1b, Wunsch Hansi „Unterscheidung Runder Tisch, Seminar bzw. Fortbildung, Besprechung – alle dürfen,
// Seminar mit Teilnahmebestätigung“): eine Technik, drei Arten. Jedes Mitglied darf jede Art ansetzen.
export const RT_ARTEN = {
  runder_tisch: { sym: "🪑", t: "Runder Tisch", leiter: "lädt ein", anmeldung: false, tagesordnung: false, bestaetigung: false },
  seminar: { sym: "🎓", t: "Seminar / Fortbildung", leiter: "Referent", anmeldung: true, tagesordnung: false, bestaetigung: true },
  besprechung: { sym: "🗂️", t: "Besprechung", leiter: "Moderation", anmeldung: false, tagesordnung: true, bestaetigung: false },
};
export const rtArt = (t) => RT_ARTEN[t?.art] || RT_ARTEN.runder_tisch;
const MIN = 60000, TAG = 86400000;

export const rtEndeMs = (t) => {
  const plan = Date.parse(t.beginn) + ((Number(t.dauer_min) || 0) + (Number(t.verlaengert_min) || 0)) * MIN;
  return t.geschlossen_am ? Math.min(plan, Date.parse(t.geschlossen_am)) : plan;
};

// Wo steht der Tisch gerade? abgesagt | geplant | gleich (Vorlauf, Platz nehmen geht) | offen | vorbei
export function rtPhase(t, jetzt) {
  if (!t) return "vorbei";
  if (t.status === "abgesagt") return "abgesagt";
  const b = Date.parse(t.beginn);
  if (jetzt >= rtEndeMs(t)) return "vorbei";
  if (jetzt >= b) return "offen";
  return b - jetzt <= RT.vorlaufMin * MIN ? "gleich" : "geplant";
}

// Einladung prüfen: e = { thema, beschreibung, beginnMs, dauer, plaetze }, meineKommenden = Anzahl eigener kommender Tische
export function rtAnlegenPruefen(e, jetzt, meineKommenden) {
  if (e?.art !== undefined && !Object.hasOwn(RT_ARTEN, e.art)) return "Bitte die Art wählen (Runder Tisch, Seminar oder Besprechung).";
  const to = e?.tagesordnung;
  if (to !== undefined && to !== null) {
    if (!Array.isArray(to) || to.some((x) => typeof x !== "string" || !x.trim())) return "Die Tagesordnung ist unvollständig.";
    if (to.length > RT.toMax) return `Höchstens ${RT.toMax} Punkte auf der Tagesordnung.`;
    if (to.some((x) => x.trim().length > RT.toPunktMax)) return `Ein Tagesordnungspunkt ist zu lang (höchstens ${RT.toPunktMax} Zeichen).`;
    if (e.art !== "besprechung" && to.length) return "Eine Tagesordnung gibt es nur bei der Besprechung.";
  }
  const thema = String(e?.thema ?? "").trim();
  if (!thema) return "Bitte ein Thema eingeben.";
  if (thema.length > RT.themaMax) return `Das Thema ist zu lang (höchstens ${RT.themaMax} Zeichen).`;
  if (String(e?.beschreibung ?? "").trim().length > RT.beschreibungMax) return `Die Beschreibung ist zu lang (höchstens ${RT.beschreibungMax} Zeichen).`;
  if (!Number.isFinite(e?.beginnMs)) return "Bitte Tag und Uhrzeit wählen.";
  if (e.beginnMs < jetzt - 5 * MIN) return "Der Beginn liegt in der Vergangenheit.";
  if (e.beginnMs > jetzt + RT.vorausTage * TAG) return `Bitte höchstens ${RT.vorausTage} Tage im Voraus einladen.`;
  if (!RT.dauern.includes(Number(e?.dauer))) return "Bitte eine Dauer wählen (30, 60 oder 90 Minuten).";
  const p = Number(e?.plaetze);
  if (!Number.isInteger(p) || p < RT.plaetzeMin || p > RT.plaetzeMax) return `Plätze: ${RT.plaetzeMin} bis ${RT.plaetzeMax}.`;
  if ((meineKommenden || 0) >= RT.offenMax) return `Du hast schon ${RT.offenMax} Tische eingeladen – bitte erst einen davon abhalten oder absagen.`;
  return null;
}

// Wer sitzt am Tisch? dabei = Zeilen { person_id, dabei_seit, zuletzt_da, verlassen_am }
export const rtSitzt = (z, jetzt) => !!(z && z.dabei_seit && !z.verlassen_am && z.zuletzt_da && jetzt - Date.parse(z.zuletzt_da) < RT.frischSek * 1000);
export const rtSicher = (z, jetzt) => rtSitzt(z, jetzt) && jetzt - Date.parse(z.zuletzt_da) < RT.unsicherSek * 1000;

// Darf ich Platz nehmen? (die Platzgrenze prüft die Datenbank noch einmal unter Sperre – kc_club_tisch_beitreten)
export function rtBeitretenPruefen(t, jetzt, zeilen, ich) {
  const ph = rtPhase(t, jetzt);
  if (ph === "abgesagt") return "Der Tisch wurde abgesagt.";
  if (ph === "vorbei") return "Der Tisch ist schon vorbei.";
  if (ph === "geplant") return `Platz nehmen geht ab ${RT.vorlaufMin} Minuten vor Beginn.`;
  const sitzen = (zeilen || []).filter((z) => rtSitzt(z, jetzt));
  if (sitzen.some((z) => z.person_id === ich)) return null;
  if (sitzen.length >= Number(t.plaetze)) return "Tisch voll – du bekommst einen Warteplatz.";
  return null;
}

// Seminar: anmelden geht nur, solange Plätze frei sind (angemeldet = Zusage „ja“; der Referent zählt nicht mit)
export function rtZusagePruefen(t, zusage, angemeldet, ich, jetzt) {
  const ph = rtPhase(t, jetzt);
  if (ph === "vorbei" || ph === "abgesagt") return ph === "abgesagt" ? "Der Tisch wurde abgesagt." : "Der Tisch ist schon vorbei.";
  if (zusage !== "ja" || !rtArt(t).anmeldung) return null;
  const andere = (angemeldet || []).filter((p) => p !== ich && p !== t.gastgeber);
  return andere.length >= Number(t.plaetze) ? "Das Seminar ist ausgebucht." : null;
}

// Teilnahmebestätigung (Seminar): anwesend von … bis …, mindestens die Hälfte der Seminarzeit
export function rtAnwesend(z, t) {
  if (!z?.dabei_seit || !z.zuletzt_da) return null;
  const b = Date.parse(t.beginn), e = rtEndeMs(t), von = Math.max(Date.parse(z.dabei_seit), b), bis = Math.min(Date.parse(z.zuletzt_da) + RT.herzSek * 1000, e);
  return bis > von ? { vonMs: von, bisMs: bis, min: Math.round((bis - von) / 60000) } : null;
}
export function rtBestaetigung(z, t) {
  if (!rtArt(t).bestaetigung || t.status === "abgesagt") return null;
  const a = rtAnwesend(z, t), dauer = (rtEndeMs(t) - Date.parse(t.beginn)) / 60000;
  return a && a.min >= Math.ceil(dauer * RT.bestaetigungAnteil) ? a : null;
}

// Gastgeber-Aktionen: absagen (vor Beginn), verlaengern (offen, höchstens verlaengernMax), schliessen (offen)
export function rtGastgeberPruefen(t, aktion, jetzt, darf) {
  if (!darf) return "Das darf nur, wer eingeladen hat.";
  const ph = rtPhase(t, jetzt);
  if (aktion === "absagen") return ph === "geplant" || ph === "gleich" ? null : ph === "abgesagt" ? "Der Tisch ist schon abgesagt." : "Ein laufender Tisch wird geschlossen, nicht abgesagt.";
  if (aktion === "verlaengern") {
    if (ph !== "offen") return "Verlängern geht nur, solange der Tisch läuft.";
    return (Number(t.verlaengert_min) || 0) + RT.verlaengernMin > RT.verlaengernMax ? `Höchstens ${RT.verlaengernMax} Minuten verlängern.` : null;
  }
  if (aktion === "schliessen") return ph === "offen" ? null : "Schließen geht nur, solange der Tisch läuft.";
  return "Unbekannte Aktion.";
}

// Was ist beim Aufräumen fällig? (nach Tischende bzw. Absage: Medien nach 7 Tagen, Text nach 30 Tagen)
export function rtAufraeumen(t, jetzt) {
  const ende = t.status === "abgesagt" ? Date.parse(t.beginn) : rtEndeMs(t);
  if (jetzt < ende) return { medien: false, text: false };
  return { medien: !t.medien_geloescht_am && jetzt - ende >= RT.medienTage * TAG, text: !t.text_geloescht_am && jetzt - ende >= RT.textTage * TAG };
}

// kurzer Text für Liste/Push: „Do 05.11. 20:00 Uhr · 60 Min.“
export function rtText(t, tz = "Europe/Berlin") { // (Art steht nicht im Text – die Anzeige setzt das Symbol davor)
  const ms = Date.parse(t.beginn), f = (o) => new Intl.DateTimeFormat("de-DE", { timeZone: tz, ...o }).format(new Date(ms));
  return `${f({ weekday: "short" })} ${f({ day: "2-digit", month: "2-digit" })} ${f({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })} Uhr · ${Number(t.dauer_min) + (Number(t.verlaengert_min) || 0)} Min.`;
}
