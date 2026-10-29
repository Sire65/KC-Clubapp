// Gemeinsame Test-Umgebung für die Sitzungs-Schritte (KC-CLUB-SITZUNG-SCHRITTE 2.749.0, -AUFGABE-START 2.750.0, -ABLAUF 2.751.0):
// lädt den Baustein „Schritt für Schritt“ aus dem echten Programmtext mit nachgebauter Umgebung (Uhr = echte Uhr, Berliner Zeit).
// Kein Test für sich – wird von tests/sitzung-schritte.test.mjs und tests/sitzung-aufgaben.test.mjs benutzt.
export const TZ = "Europe/Berlin";
export const fTag = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" });
export const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const tagPlus = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const isoBerlin = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
export function sitzungsUmgebung(app, { vorstand = true, schreiben = true, vorgaben = null, ich = {}, speicher = {} } = {}) {
  const q = app.slice(app.indexOf("// KC-CLUB-SITZUNG-FRIST ("), app.indexOf("// KC-CLUB-BUERO-RAUM (1.65.0"));
  const ta = app.slice(app.indexOf("function taZeitpunkt("), app.indexOf("async function taSenden("));
  const vs = app.slice(app.indexOf("const vsSchluss = "), app.indexOf("const vsSchlussVorbei"));
  if ([q, ta, vs].some((x) => x.length < 40)) throw new Error("Baustein nicht gefunden");
  const localStorage = { getItem: (k) => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = String(v); }, removeItem: (k) => { delete speicher[k]; } };
  const BU = { start: vorgaben ? { vorgaben } : null };
  return new Function("ICH", "zeitKurz", "wann", "esc", "CA_VORHER_MIN", "CA_DAUER_STD", "fTag", "fZeit", "localStorage", "TZ", "tagPlus", "isoBerlin", "BU", "INIT", "buSchreiben", "buNachherTipp", "MITGLIEDER",
    ta + vs + q + "\nreturn { svWerte, buFrist, buFristText, buKnapp, buSchritteFuer, buNaechster, buSchritteHtml, buDran, buAufgabeFuer, buAufgabeMerken, buAufgabeMerker, buKontrolleFuer, buIchBereite, vsSchluss, BU };")(
    { vorstand, person_id: "P1", ...ich }, (x) => "am " + x.slice(0, 10), (x) => x, (x) => String(x), 120, 6, fTag, fZeit, localStorage, TZ, tagPlus, isoBerlin, BU, null, () => schreiben, () => null, []);
}
