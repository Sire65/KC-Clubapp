// KC-CLUB-SICHERHEIT-WAECHTER (2.726.0, 28.10.2026, Wunsch Hansi „ein Security-Wächter, der alles überwacht, was mit Sicherheit zu tun hat:
// falsche Links, Angriffsversuche, Datenlecks, App zu lange ungenutzt offen …“ – „Alles bauen“).
// Reine Regeln (ohne Datenbank und Netz) – getestet in tests/sicherheit.test.mjs. Dieselbe Link-Prüfung steht in app.js (naLinkVerdacht);
// der Test prüft, dass beide gleich urteilen.

// Grenzen. Bremsen greifen erst ab SI.bremsenAb – bis dahin wird nur beobachtet und gemeldet („hätte gebremst“), damit niemand aus Versehen
// ausgebremst wird (Stufe 2 aus dem Konzept: erst ein paar Tage zuschauen).
export const SI = {
  bremsenAb: "2026-11-04T00:00:00Z",
  bremseMin: 60,
  anfragenProMin: 240, // je Mitglied und Server-Instanz – normale Nutzung liegt weit darunter (Start ≈ 20 Anfragen)
  unbekanntProStd: 20, // unbekannte Befehle von einem Zugang/Gerät: Abtasten
  // Absaug-Wächter: so viele Abrufe je Mitglied und Stunde (je Server-Instanz) sind auffällig
  absaug: { mitglied_details: 60, foto_oeffnen: 400, anlage_url: 200, buero_mitgliederliste: 10, buero_adressen: 20, meine_daten: 30 },
  linkTagGelb: 1, linkTagRot: 3,
  gesperrtTagRot: 3,
  geraetMaxBekannt: 8,
};

// Geräteklasse ohne Versionsnummern („Android · Chrome“, „iPhone · Safari“, „Mac · Safari“) – ändert sich nicht bei jedem Update
export function siGeraetKlasse(ua) {
  const u = String(ua || "");
  if (!u) return "unbekannt";
  if (/\b(curl|wget|python|go-http-client|okhttp|java|node-fetch|axios|postman|insomnia|httpie|libwww|scrapy|bot|crawler|spider|scan)\b/i.test(u)) return "Programm";
  const sys = /Android/.test(u) ? "Android" : /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Windows/.test(u) ? "Windows-PC"
    : /Macintosh|Mac OS X/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux-PC" : "unbekannt";
  const br = /SamsungBrowser/.test(u) ? "Samsung-Browser" : /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Firefox\//.test(u) ? "Firefox"
    : /CriOS|Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "";
  return br ? `${sys} · ${br}` : sys;
}

// Neues Gerät? bekannte = [{ k, erst, zuletzt }]. Ergebnis: { neu, frage, liste } – frage nur, wenn es schon ein anderes bekanntes Gerät gibt
// (beim allerersten Gerät gibt es niemanden zu fragen) und es kein „Programm“ ist (das meldet der Angriffs-Wächter).
export function siGeraetMerken(bekannte, klasse, jetztIso) {
  const l = Array.isArray(bekannte) ? bekannte.filter((x) => x && typeof x.k === "string").slice(0, 20) : [];
  const da = l.find((x) => x.k === klasse);
  if (da) { da.zuletzt = jetztIso; return { neu: false, frage: false, liste: l }; }
  const liste = [...l, { k: klasse, erst: jetztIso, zuletzt: jetztIso }].sort((a, b) => String(b.zuletzt).localeCompare(String(a.zuletzt))).slice(0, SI.geraetMaxBekannt);
  return { neu: true, frage: l.length > 0 && klasse !== "Programm" && klasse !== "unbekannt", liste };
}

// Link-Prüfer: Gründe, warum ein Link verdächtig ist (leer = unauffällig). Nur Regeln, kein fremder Dienst.
const KURZ = /^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|ow\.ly|buff\.ly|cutt\.ly|rebrand\.ly|shorturl\.at|tiny\.cc|rb\.gy|s\.id|v\.gd)$/i;
const ECHT = ["koecheclub", "sire65", "supabase", "github", "paypal", "google", "microsoft", "amazon", "whatsapp"]; // „apple“/„dhl“ zu kurz; Sparkasse/Volksbank haben echte Regional-Adressen (sparkasse-werne.de)
export function siLinkGruende(url) {
  let u; try { u = new URL(String(url)); } catch { return []; }
  const g = [], host = u.hostname.toLowerCase();
  if (u.protocol === "http:") g.push("ohne Verschlüsselung (http)");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) g.push("Zahlen-Adresse statt Name");
  if (host.split(".").some((t) => t.startsWith("xn--"))) g.push("versteckte Sonderzeichen im Namen");
  if (KURZ.test(host)) g.push("Kurz-Link – Ziel unsichtbar");
  if (u.username || u.password || /@/.test(u.href.split("//")[1]?.split("/")[0] || "")) g.push("Adresse mit @ – führt woanders hin");
  // Doppelgänger: Name enthält eine bekannte Marke (auch mit 0 statt o / 1 statt l), ist aber nicht deren echte Adresse – oder ist nur 1 Buchstabe daneben
  const teile = host.replace(/^www\./, "").split("."), name = (teile.length > 1 ? teile[teile.length - 2] : teile[0]), norm = name.replace(/0/g, "o").replace(/1/g, "l");
  if (!siEchteDomain(host)) for (const e of ECHT) if (norm.includes(e) || (norm.length >= 5 && siAbstand(norm, e) === 1)) { g.push(`sieht aus wie „${e}“, ist es aber nicht`); break; }
  if (/(passwort|password|login|anmelden|konto-?bestaetig|verify|bestaetigen|pin|tan)\b/i.test(u.pathname + u.search) && !siEchteDomain(host)) g.push("fragt vermutlich nach Passwort/Daten");
  // wichtigster Grund zuerst (er steht sichtbar am Link): Doppelgänger, @-Trick, Passwort-Seite, Zahlen-Adresse, Sonderzeichen, Kurz-Link, http
  const rang = (x) => ["sieht aus", "Adresse mit @", "Passwort", "Zahlen", "Sonderzeichen", "Kurz-Link", "ohne Verschl"].findIndex((w) => x.includes(w));
  return g.sort((a, b) => rang(a) - rang(b));
}
const ECHTE_DOMAINS = ["sire65.github.io", "github.com", "githubusercontent.com", "supabase.co", "supabase.com", "paypal.com", "paypal.de", "paypal.me", "sparkasse.de",
  "volksbank.de", "google.com", "google.de", "googleusercontent.com", "googleapis.com", "apple.com", "apple.de", "icloud.com", "microsoft.com", "microsoftonline.com", "office.com",
  "live.com", "amazon.de", "amazon.com", "dhl.de", "dhl.com", "whatsapp.com", "wa.me", "koecheclub-werne.de"];
function siEchteDomain(host) { return ECHTE_DOMAINS.some((d) => host === d || host.endsWith("." + d)); }
export function siAbstand(a, b) { // Levenshtein, klein gehalten
  const m = a.length, n = b.length; if (Math.abs(m - n) > 3) return 9;
  let v = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const w = [i]; for (let j = 1; j <= n; j++) w[j] = Math.min(v[j] + 1, w[j - 1] + 1, v[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); v = w; }
  return v[n];
}
export const SI_LINK_RE = /\bhttps?:\/\/[^\s<>"'„“]+/gi;
export function siLinksVerdacht(text) { // [{ url, gruende }] nur verdächtige
  return [...String(text || "").matchAll(SI_LINK_RE)].map((m) => ({ url: m[0].replace(/[.,;:!?)]+$/, ""), gruende: siLinkGruende(m[0].replace(/[.,;:!?)]+$/, "")) })).filter((x) => x.gruende.length);
}
