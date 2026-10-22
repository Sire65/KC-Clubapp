// KC-CLUB-FREMDZUGRIFF (2.579.0, 22.10.2026, Wunsch Hansi „Fremde Anmeldeversuche: wann, mit welchem Schlüssel, Vermutung wer“):
// Regeln für das Protokoll abgelehnter Anmeldungen – Gerät erkennen, Vermutung bilden, wann Hansi Bescheid bekommt.
// Rein (ohne Datenbank und Netz) – getestet in tests/fremdzugriff.test.mjs.

export const FZ = { gleichMin: 10, alarmAnzahl: 5, alarmFensterMin: 15, alarmPauseMin: 60, netzMin: 60, aufbewahrenTage: 90, proStunde: 60 };

// Gerät/Browser in Worten („Android 10 · Chrome 155“, „iPhone iOS 18 · Safari“, „Programm (curl)“)
export function fzGeraet(ua) {
  const u = String(ua || "");
  if (!u) return "unbekanntes Gerät";
  const prog = /\b(curl|wget|python-requests|python|go-http-client|okhttp|java|node-fetch|axios|postman|insomnia|httpie|libwww|scrapy)\b/i.exec(u) || /\b(bot|crawler|spider|scan)\b/i.exec(u);
  if (prog) return `Programm/Bot (${prog[1].toLowerCase()})`;
  const sys = /Android (\d+)/.exec(u) ? `Android ${/Android (\d+)/.exec(u)[1]}`
    : /iPhone|iPad/.test(u) ? `${/iPad/.test(u) ? "iPad" : "iPhone"}${/OS (\d+)_/.exec(u) ? " iOS " + /OS (\d+)_/.exec(u)[1] : ""}`
    : /Windows/.test(u) ? "Windows-PC" : /Macintosh|Mac OS X/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux-PC" : "unbekanntes System";
  const br = /SamsungBrowser\/(\d+)/.exec(u) ? `Samsung-Browser ${/SamsungBrowser\/(\d+)/.exec(u)[1]}`
    : /Edg\/(\d+)/.exec(u) ? `Edge ${/Edg\/(\d+)/.exec(u)[1]}` : /OPR\/(\d+)/.exec(u) ? `Opera ${/OPR\/(\d+)/.exec(u)[1]}`
    : /Firefox\/(\d+)/.exec(u) ? `Firefox ${/Firefox\/(\d+)/.exec(u)[1]}` : /CriOS\/(\d+)|Chrome\/(\d+)/.exec(u) ? `Chrome ${(/CriOS\/(\d+)|Chrome\/(\d+)/.exec(u)).slice(1).find(Boolean)}`
    : /Safari\//.test(u) ? "Safari" : "";
  return br ? `${sys} · ${br}` : sys;
}

// Vermutung: gesperrte Person (sicher) > alter Link (sicher) > gleiche Internetverbindung kurz vorher > gleiches Gerät früher gesehen
// hinweise: { gesperrt?: {person}, alt?: {person, am, grund}, netz?: {person, minVorher}, geraet?: {person} }; namen: Map person_id → Name
export function fzVermutung(h, namen) {
  const n = (id) => (namen && namen.get && namen.get(id)) || id;
  if (h?.gesperrt?.person) return { person: h.gesperrt.person, text: `${n(h.gesperrt.person)} – Zugang ist gesperrt/abgeschaltet, der Schlüssel ist aber der richtige`, sicher: true };
  if (h?.alt?.person) return { person: h.alt.person, text: `${n(h.alt.person)} – alter Link (${h.alt.grund === "abgeschaltet" ? "abgeschaltet" : "ersetzt"} am ${h.alt.am || "?"})`, sicher: true };
  if (h?.netz?.person) return { person: h.netz.person, text: `vermutlich ${n(h.netz.person)} – gleiche Internetverbindung, dort ${h.netz.minVorher <= 1 ? "gerade eben" : `vor ${h.netz.minVorher} Min.`} angemeldet`, sicher: false };
  if (h?.geraet?.person) return { person: h.geraet.person, text: `vielleicht ${n(h.geraet.person)} – genau dieses Gerät/dieser Browser war schon bei ${n(h.geraet.person)} in Gebrauch`, sicher: false };
  return { person: null, text: "unbekannt – kein Treffer bei alten Links, Internetverbindung oder Gerät", sicher: false };
}

// Hansi bekommt Bescheid: ab FZ.alarmAnzahl Versuchen in FZ.alarmFensterMin Minuten, höchstens einmal je FZ.alarmPauseMin;
// sofort (einmal je Stunde) bei Programmen/Bots, weil die nie ein Versehen sind
export function fzAlarm(anzahlFenster, letzterAlarmMs, t, bot) {
  if (t - (letzterAlarmMs || 0) < FZ.alarmPauseMin * 60000) return false;
  return anzahlFenster >= FZ.alarmAnzahl || !!bot;
}

// Kurzkennung des Schlüssels (aus seinem SHA-256): gleicher Wert = gleicher Schlüssel, der Schlüssel selbst bleibt geheim
export const fzKennung = (hash) => (/^[0-9a-f]{12,}$/.test(String(hash || "")) ? String(hash).slice(0, 12) : null);
