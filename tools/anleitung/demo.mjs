// Beispieldaten für die Anleitung – erfundene Personen, keine echten Mitgliederdaten
const T = (tage, h = 18, m = 0) => { const d = new Date(); d.setDate(d.getDate() + tage); d.setHours(h, m, 0, 0); return d.toISOString(); };
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
export const ICH = { person_id: "P1", name: "Max Mustermann", vorname: "Max", admin: false, vorstand: false, aemter: [], protokolle: true, kontakte: true, buero: null };
const LEUTE = [
  ["P1", "Max Mustermann", "Max", [], "verfuegbar"], ["P2", "Erika Beispiel", "Erika", ["Clubsprecher"], "verfuegbar"], ["P3", "Paul Probe", "Paul", ["Kassenwart"], "beschaeftigt"],
  ["P4", "Klara Koch", "Klara", [], "urlaub"], ["P5", "Otto Muster", "Otto", [], "verfuegbar"], ["P6", "Rita Sommer", "Rita", [], "krank"],
  ["P7", "Uwe Winter", "Uwe", [], "verfuegbar"], ["P8", "Lena Herbst", "Lena", [], null],
];
const treffen = { id: "T1", titel: "Clubabend Oktober", beginn: T(5, 18, 30), ende: null, ort: "Vereinsheim", beschreibung: "Planung Weihnachtsmarkt", status: "geplant", art: "treffen", ganztaegig: false, gastgeber: null,
  teilnahme: [{ person_id: "P2", name: "Erika Beispiel", antwort: "ja", notiz: null }, { person_id: "P3", name: "Paul Probe", antwort: "vielleicht", notiz: "komme später" }, { person_id: "P5", name: "Otto Muster", antwort: "nein", notiz: "Urlaub" }, { person_id: "P1", name: "Max Mustermann", antwort: "ja", notiz: null }],
  ja: 7, nein: 1, vielleicht: 2, meine: "ja", mitfahrten: [], mitfahrtSuche: [] };
const treffen2 = { ...treffen, id: "T2", titel: "Weihnachtsmarkt Aufbau", beginn: T(19, 9, 0), ort: "Marktplatz", beschreibung: null, art: "veranstaltung", ja: 4, nein: 0, vielleicht: 3, meine: null, teilnahme: [] };
export const msg = (id, eigen, von, text, min, extra = {}) => ({ id, eigen, von, text, zeit: vor(min), anlagen: [], reaktionen: [], antwortAuf: null, erwaehnt: [], erwaehntMich: false, bearbeitet: null, gemerkt: false, angeheftet: false, umfrage: null, kontakt: null, wichtig: false,
  ...(eigen ? { gelesenVon: [], gelesenAlle: false, zustellung: null, haken: "gesendet" } : {}), ...extra });
export const ANTWORTEN = {
  init: { ich: ICH, status: { status: "verfuegbar", hinweis: null, bis: null }, server: "1.59.0", ungelesen: 2, ungelesenLaut: 2, offeneAbstimmungen: 1, naechsterDienst: null,
    benachrichtigung: { termine: { push: true, email: true }, nachrichten: { push: true, email: false }, vorschlaege: { push: true, email: false }, dienste: { push: true, email: false }, geburtstage: { push: true, email: false }, pinnwand: { push: true, email: false } },
    hatMail: true, geburtstageHeute: [], geburtstagFreigabe: false, runderGeburtstagFreigabe: false, hatGeburtstag: false, kontaktFreigabe: { handy: true, festnetz: false, mail: true, adresse: false },
    terminfindungOffen: [], wartung: { an: false, hinweis: null, seit: null }, communicator: { farbe: "gruen", text: "KC Communicator: läuft" },
    notfall: { name: "Anna Mustermann", telefon: "0170 0000000", beziehung: "Ehefrau" },
    einstellungen: { ansicht: { art: "einfach", gewaehlt: true }, begruessung: { gesehen: true }, tipps: { an: false }, design: { design: "klassik", modus: "tag" } },
    kalenderAbo: null, meineAufgaben: [], protokolleUngelesen: 0, naechstesTreffen: treffen, mitgliederAnzahl: 18, vapidPublicKey: null,
    pinnwandFristen: { erinnernTage: 3, pauseTage: 7, geaendertAm: null }, anrufAntworten: { texte: ["⏳ Bin gerade beschäftigt"], geaendertAm: null } },
  online: { zeigen: true, online: [{ person_id: "P2", name: "Erika Beispiel", vorname: "Erika", klopfbar: true }, { person_id: "P5", name: "Otto Muster", vorname: "Otto", klopfbar: true }], verpasst: [], klopfen: [], antworten: [], anrufe: [] },
  mitglieder: { aemter: ["Clubsprecher", "Kassenwart"], onlineSichtbar: true, mitglieder: LEUTE.map(([id, name, vn, aemter, st], i) => ({ person_id: id, name, vorname: vn, vorstand: aemter.length > 0, aemter, admin: false,
    status: st ? { status: st, hinweis: st === "urlaub" ? "bis Sonntag" : null, bis: null } : null, online: id === "P2" || id === "P5", zuletztDa: id === "P2" || id === "P5" ? { online: true } : { online: false, tag: new Date().toISOString().slice(0, 10), zeit: "09:1" + i }, verborgen: false, heute: true,
    wege: { push: true, mail: true, whatsapp: i % 2 === 0 }, aktiv: true })) },
  treffen_liste: { treffen: [treffen, treffen2], geburtstage: [{ person_id: "P4", name: "Klara Koch", vorname: "Klara", md: (() => { const d = new Date(); d.setDate(d.getDate() + 9); return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })() }] },
  terminumfragen_liste: { umfragen: [] }, terminanfragen_liste: { anfragen: [] }, privattermine_liste: { privat: [] },
  unterhaltungen: { unterhaltungen: [
    { id: "C1", betreff: "", teilnehmer: ["Erika Beispiel"], anzahl: 2, gruppe: null, letzte: { von: "Erika", text: "Denkst du an die Schürzen?", zeit: vor(12) }, ungelesen: 1, wichtigNeu: 1, aktualisiert: vor(12) },
    { id: "C2", betreff: "", teilnehmer: ["Paul Probe", "Erika Beispiel", "Otto Muster"], anzahl: 6, gruppe: { name: "Küchenteam", symbol: "🍳" }, personen: ["P1", "P2", "P3", "P5"], letzte: { von: "Paul", text: "Einkaufsliste steht 👍", zeit: vor(55) }, ungelesen: 1, wichtigNeu: 0, aktualisiert: vor(55) },
    { id: "C3", betreff: "", teilnehmer: ["Otto Muster"], anzahl: 2, gruppe: null, letzte: { von: "Du", text: "Danke dir!", zeit: vor(300) }, ungelesen: 0, wichtigNeu: 0, aktualisiert: vor(300) },
  ] },
  unterhaltung: { id: "C1", betreff: "", tippt: [], entwurf: [], spricht: [], angeheftet: [], gelesenBis: vor(1), partnerDa: { online: true }, gruppe: null,
    teilnehmer: [{ person_id: "P1", name: "Max Mustermann" }, { person_id: "P2", name: "Erika Beispiel" }],
    nachrichten: [
      msg("M1", false, "Erika Beispiel", "Hallo Max, kommst du am Donnerstag zum Clubabend?", 70),
      msg("M2", true, "Du", "Klar, bin dabei 👍", 66, { haken: "gelesen", gelesenAlle: true, gelesenVon: ["Erika"], reaktionen: [{ emoji: "❤️", namen: ["Erika"], meine: false, anzahl: 1 }] }),
      msg("M3", false, "Erika Beispiel", "Denkst du an die Schürzen? Die brauchen wir unbedingt!", 12, { wichtig: true }),
      msg("M4", true, "Du", "Ja, bringe ich mit.", 10, { haken: "angekommen", antwortAuf: { id: "M3", von: "Erika", text: "Denkst du an die Schürzen?" } }),
      msg("M5", true, "Du", "Und die Messer auch.", 1, { haken: "gesendet" }),
    ] },
  pinnwand: { max: 4, zeichen: 200, meine: 1, zettel: [
    { id: "Z1", text: "Schürzen bitte bis Freitag in der Küche abgeben", wichtig: false, fuer: "alle", erstellt_am: vor(600), vonMir: false, farbe: 1, von: { person_id: "P2", vorname: "Erika" }, empfaenger: [], erledigt: null },
    { id: "Z2", text: "Wer hat meinen Messerkoffer?", wichtig: false, fuer: "alle", erstellt_am: vor(200), vonMir: true, farbe: 3, von: { person_id: "P1", vorname: "Max" }, empfaenger: [], erledigt: null, leser: [{ name: "Erika Beispiel", gesehen: vor(100), erledigt: null }], offen: ["Paul Probe"], anzahl: 2 },
    { id: "Z3", text: "Einkauf für Samstag übernehme ich", wichtig: false, fuer: "alle", erstellt_am: vor(90), vonMir: false, farbe: 2, von: { person_id: "P3", vorname: "Paul" }, empfaenger: [], erledigt: null } ] },
  pinnwand_neu: { neu: [] },
  sos_kontakte: { siehtNotfall: false, mitglieder: [
    { id: "P1", name: "Max Mustermann", selbst: true, aemter: [], leitung: false, kontakt: { handy: "0170 0000001" }, notfall: { name: "Anna Mustermann", telefon: "0170 0000000", beziehung: "Ehefrau" } },
    { id: "P2", name: "Erika Beispiel", selbst: false, aemter: ["Clubsprecher"], leitung: true, kontakt: { handy: "0170 0000002", mail: "erika@example.de" }, notfall: null },
    { id: "P3", name: "Paul Probe", selbst: false, aemter: ["Kassenwart"], leitung: true, kontakt: { handy: "0170 0000003" }, notfall: null },
    { id: "P5", name: "Otto Muster", selbst: false, aemter: [], leitung: false, kontakt: { handy: "0170 0000005" }, notfall: null } ] },
  kalender: { treffen: [treffen, treffen2], dienste: [], fristen: [], geburtstage: [], aktionen: [], anfragen: [], privat: [] },
  lebenszeichen: { ok: true, grund: null }, standort_liste: { standorte: [] }, wetter: { daten: null, fehler: "Testmodus" },
  ping: { ok: true, server: "1.59.0", zeit: new Date().toISOString(), dbMs: 5, wartung: { an: false } },
};
