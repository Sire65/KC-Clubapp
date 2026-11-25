// 3.25.0 KC-CLUB-DP-GRUSS (25.11.2026, Wunsch Hansi): „jedes Mitglied soll eine Pushnachricht bekommen am gleichen Morgen, wie der Dienst geplant ist
// lt. Solldienstplan. Wer kein Push hat, per E-Mail. Bei Dienstplanänderungen für das Mitglied sofort neu. Schreibe immer die Zeiten dazu …
// Aber erst senden, wenn der Plan freigegeben ist.“
// Reine Regeln (ohne Datenbank) – Grundlage ist der freigegebene Sollplan (kc_club_konfig „dp_plaene_frei“, plan.tage[].leute[]/ber[] mit p = person_id).
export const DPG = { ab: 8, bis: 22, aktion: "dp_soll_gruss", aenderung: "dp_soll_aenderung" }; // Morgengruß ab 8 Uhr (Nachzügler bis 22 Uhr, z. B. Freigabe am Tag)

const gueltig = (pid) => typeof pid === "string" && /^KC-P-[A-Z0-9-]{1,30}$/.test(pid) && !pid.startsWith("KC-P-TEST");
const spanne = (s) => (Array.isArray(s) && s.length === 2 && Number.isFinite(Number(s[0])) && Number.isFinite(Number(s[1])) && Number(s[1]) > Number(s[0]) ? [Number(s[0]), Number(s[1])] : null);
export const dpgUhr = (h) => { const m = Math.round(Number(h) * 60), hh = Math.floor(m / 60) % 24; return `${String(hh).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
export const dpgZeit = (s) => `${dpgUhr(s[0])} – ${dpgUhr(s[1])} Uhr`;
const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const dpgTag = (d) => { const [y, m, t] = String(d).split("-").map(Number); return `${TAGE[new Date(Date.UTC(y, m - 1, t)).getUTCDay()]} ${String(t).padStart(2, "0")}.${String(m).padStart(2, "0")}.`; };

// Je Tag und Person: Dienst und Bereitschaft (je eine Spanne oder null). Ergebnis: Map d → Map pid → { name, dienst, ber }
export function dpgPlan(plan) {
  const aus = new Map();
  for (const t of Array.isArray(plan?.tage) ? plan.tage : []) {
    const d = String(t?.d || ""); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const tag = aus.get(d) ?? new Map(); aus.set(d, tag);
    const eintrag = (x) => { const e = tag.get(x.p) ?? { name: String(x.n || ""), dienst: null, ber: null }; tag.set(x.p, e); return e; };
    for (const l of Array.isArray(t.leute) ? t.leute : []) { const s = spanne(l?.s); if (s && gueltig(l?.p)) eintrag(l).dienst = s; }
    for (const b of Array.isArray(t.ber) ? t.ber : []) { const s = spanne(b?.s); if (s && gueltig(b?.p)) eintrag(b).ber = s; }
  }
  return aus;
}
// Wer hat an diesem Tag Dienst oder Bereitschaft?
export function dpgHeute(plan, tag) { return dpgPlan(plan).get(String(tag)) ?? new Map(); }

// „Hallo Manfred, heute hast du Dienst von 17:00 – 23:00 Uhr. Wir wünschen dir einen angenehmen Dienst in der Weihnachtsmarkthütte. Liebe Grüße“
export function dpgMorgenText(vorname, e, ohneKasse = false) { // ohneKasse (3.29.0): Aufbau/Nachbereitung – Hinweis aufs Stempeln in der App
  const teile = [];
  if (e.dienst) teile.push(`Dienst von ${dpgZeit(e.dienst)}`);
  if (e.ber) teile.push(`Bereitschaft von ${dpgZeit(e.ber)}`);
  const wunsch = e.dienst ? "Wir wünschen dir einen angenehmen Dienst in der Weihnachtsmarkthütte." : "Wir melden uns, falls wir dich brauchen.";
  const kurz = `Heute ${teile.join(" und ")}`;
  return { titel: e.dienst ? "🗓️ Heute hast du Dienst" : "🛎️ Heute hast du Bereitschaft", kurz,
    text: `Hallo ${vorname || ""},\n\nheute hast du ${teile.join(" und ")}. ${wunsch}${ohneKasse && e.dienst ? "\n\nHeute gibt es keine Kasse: Bitte melde dich in der Club-App zum Dienst an und ab („🟢 Dienst beginnen“ / „🔴 Dienst beenden“)." : ""}\n\nLiebe Grüße\nKöcheclub Werne` };
}

// Änderungen je Person ab einem Tag (einschließlich): alter → neuer freigegebener Plan. Ergebnis: Map pid → { name, tage: [{ d, alt, neu }] }
const gleich = (a, b) => (!a && !b) || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);
export function dpgAenderungen(altPlan, neuPlan, abTag) {
  const alt = dpgPlan(altPlan), neu = dpgPlan(neuPlan), aus = new Map(), ab = String(abTag || "");
  const tage = [...new Set([...alt.keys(), ...neu.keys()])].filter((d) => d >= ab).sort();
  for (const d of tage) {
    const a = alt.get(d) ?? new Map(), n = neu.get(d) ?? new Map();
    for (const pid of new Set([...a.keys(), ...n.keys()])) {
      const x = a.get(pid) ?? { dienst: null, ber: null }, y = n.get(pid) ?? { dienst: null, ber: null };
      if (gleich(x.dienst, y.dienst) && gleich(x.ber, y.ber)) continue;
      const p = aus.get(pid) ?? { name: (n.get(pid) ?? a.get(pid))?.name || "", tage: [] };
      p.tage.push({ d, alt: { dienst: x.dienst, ber: x.ber }, neu: { dienst: y.dienst, ber: y.ber } }); aus.set(pid, p);
    }
  }
  return aus;
}
// „Hallo Manfred, dein Dienstplan hat sich geändert: …“ – je geändertem Tag die neue Zeit (und was vorher galt)
export function dpgAenderungText(vorname, tage) {
  const was = (z) => [z.dienst ? `Dienst ${dpgZeit(z.dienst)}` : "", z.ber ? `Bereitschaft ${dpgZeit(z.ber)}` : ""].filter(Boolean).join(" und ");
  const zeilen = tage.map((t) => { const jetzt = was(t.neu), vorher = was(t.alt);
    return `🗓️ ${dpgTag(t.d)}: ${jetzt ? `jetzt ${jetzt}` : "kein Dienst mehr"}${vorher ? ` (vorher ${vorher})` : " (neu)"}`; });
  const kurz = tage.length === 1 ? zeilen[0].replace(/^🗓️ /, "") : `${tage.length} Tage geändert – ${zeilen[0].replace(/^🗓️ /, "")} …`;
  return { titel: "🗓️ Dein Dienstplan hat sich geändert", kurz,
    text: `Hallo ${vorname || ""},\n\ndein Dienstplan für den Weihnachtsmarkt hat sich geändert:\n\n${zeilen.join("\n")}\n\nLiebe Grüße\nKöcheclub Werne` };
}
