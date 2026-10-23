// KC-CLUB-DIENST-TAUSCH (2.606.0, 22.10.2026, Wunsch Hansi „Dienst-Tausch-Börse hört sich gut an“): Regeln für die Tauschbörse.
// Ablauf: Mitglied bietet einen geplanten Dienst an („Ich kann nicht“) → ein anderes Mitglied tippt „Ich übernehme“ → der Planer (Admin)
// bestätigt oder lehnt ab. Der Dienstplan (kc_dp_plan_published) bleibt unverändert, bis DP3 die Übergabe übernimmt (Codex-Auftrag);
// bis dahin rechnet die Club-App bestätigte Übernahmen selbst ein (Mein Dienst, Dienst-Anmeldung).
// Rein (ohne Datenbank/Netz) – tests/dienst-tausch.test.mjs.

export const DT = { vorlaufStd: 2, nachrichtMax: 300, grundMax: 200, offenMax: 10 };
export const DT_STATUS = ["offen", "uebernommen", "bestaetigt", "abgelehnt", "zurueckgezogen"];
const STD = 3600000;

// Darf dieser Dienst noch angeboten werden? (mindestens 2 Std. vor Beginn – später direkt den Planer anrufen)
export function dtAnbietenPruefen(dienst, t, offeneEigene) {
  if (!dienst || !Number.isFinite(dienst.startMs)) return "Dienst nicht gefunden.";
  if (dienst.startMs - t < DT.vorlaufStd * STD) return "Der Dienst beginnt zu bald – bitte direkt den Planer anrufen.";
  if ((offeneEigene || []).some((a) => a.dienst_ref === dienst.ref && (a.status === "offen" || a.status === "uebernommen"))) return "Diesen Dienst hast du schon angeboten.";
  if ((offeneEigene || []).filter((a) => a.status === "offen" || a.status === "uebernommen").length >= DT.offenMax) return "Du hast schon viele Dienste angeboten – bitte mit dem Planer sprechen.";
  return null;
}

// überschneiden sich zwei Dienste? (Millisekunden, Ende exklusiv)
export const dtUeberlapp = (a, b) => a.startMs < b.endeMs && b.startMs < a.endeMs;

// Darf ich übernehmen? meine = eigene geplante Dienste (inkl. schon übernommener), t = jetzt
export function dtUebernehmenPruefen(angebot, ich, meine, t) {
  if (!angebot) return "Angebot nicht gefunden.";
  if (angebot.status !== "offen") return angebot.status === "uebernommen" ? "Jemand anderes war schneller." : "Das Angebot ist nicht mehr offen.";
  if (angebot.von_person === ich) return "Das ist dein eigener Dienst.";
  if (angebot.startMs <= t) return "Der Dienst hat schon begonnen.";
  const k = (meine || []).find((d) => dtUeberlapp(d, angebot));
  if (k) return "Du hast zu dieser Zeit schon Dienst.";
  return null;
}

// Zustandswechsel: wer darf was? rolle: "anbieter" | "uebernehmer" | "planer" | "andere"
const WEGE = {
  uebernehmen: { von: ["offen"], nach: "uebernommen", rollen: ["andere", "planer"] },
  zurueckziehen: { von: ["offen"], nach: "zurueckgezogen", rollen: ["anbieter", "planer"] },
  zuruecktreten: { von: ["uebernommen"], nach: "offen", rollen: ["uebernehmer", "planer"] }, // vor der Bestätigung doch nicht
  bestaetigen: { von: ["uebernommen"], nach: "bestaetigt", rollen: ["planer"] },
  ablehnen: { von: ["offen", "uebernommen"], nach: "abgelehnt", rollen: ["planer"] },
};
export function dtWechsel(status, aktion, rollen) {
  const w = Object.hasOwn(WEGE, aktion) ? WEGE[aktion] : null;
  if (!w) return { fehler: "Unbekannte Aktion." };
  if (!w.von.includes(status)) return { fehler: status === "bestaetigt" ? "Die Übergabe ist schon bestätigt." : "Das geht in diesem Stand nicht mehr." };
  if (!w.rollen.some((r) => (rollen || []).includes(r))) return { fehler: "Das darfst du hier nicht." };
  return { nach: w.nach };
}
export function dtRollen(angebot, ich, planer) {
  const r = [];
  if (angebot.von_person === ich) r.push("anbieter");
  if (angebot.an_person && angebot.an_person === ich) r.push("uebernehmer");
  if (planer) r.push("planer");
  if (angebot.von_person !== ich) r.push("andere");
  return r;
}

// Wem gehört der Dienst jetzt? (für Mein Dienst und Dienst-Anmeldung): bestätigte Übergaben verschieben den Dienst
// plan: [{ref, person, …}], tausch: [{dienst_ref, von_person, an_person, status}] → plan mit person = Übernehmer, getauscht: true
export function dtPlanMitTausch(plan, tausch) {
  const m = new Map((tausch || []).filter((x) => x && x.status === "bestaetigt" && x.an_person).map((x) => [`${x.dienst_ref}|${x.von_person}`, x]));
  return (plan || []).map((d) => {
    const x = m.get(`${d.ref}|${d.person}`);
    return x ? { ...d, person: x.an_person, getauscht: true, vorher: d.person } : d;
  });
}

// kurzer Text für Push/Liste: „Sa 06.12. 16:00–20:00 Uhr · Küche“
export function dtText(a, tz = "Europe/Berlin") {
  const f = (ms, o) => new Intl.DateTimeFormat("de-DE", { timeZone: tz, ...o }).format(new Date(ms));
  return `${f(a.startMs, { weekday: "short" })} ${f(a.startMs, { day: "2-digit", month: "2-digit" })} ${f(a.startMs, { hour: "2-digit", minute: "2-digit" })}–${f(a.endeMs, { hour: "2-digit", minute: "2-digit" })} Uhr${a.bereich ? ` · ${a.bereich}` : ""}`;
}
