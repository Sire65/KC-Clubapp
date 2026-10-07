/**
 * KC Termine → Google-Kalender  (Feature KC-BES-TERMINE; seit Club-App 2.28.0 im Repo KC-Clubapp; 2.31.1: Gäste bekommen keine Mails)
 *
 * Holt alle 5 Minuten die Änderungen aus dem KC Besuchsprotokoll und trägt sie in Hansis
 * Google-Kalender ein: geplant (grau), vorgemerkt (gelb), gebucht (grün),
 * Vorschlag eines Mitglieds (orange), abgesagt (rot).
 *
 * Einrichtung: siehe google/ANLEITUNG.md
 * Der Schlüssel steht NICHT hier im Code, sondern in den Skripteigenschaften
 * (KC_KALENDER_SCHLUESSEL). Optional: KC_KALENDER_ID für einen anderen Kalender als den Hauptkalender.
 * Der Schlüssel erlaubt nur den Kalender-Abgleich – sonst nichts.
 */
const KC_API = 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-termine';
const KC_FARBEN = {
  geplant: CalendarApp.EventColor.GRAY,
  vorgemerkt: CalendarApp.EventColor.YELLOW,
  gebucht: CalendarApp.EventColor.GREEN,
  vorschlag: CalendarApp.EventColor.ORANGE,
  abgesagt: CalendarApp.EventColor.RED,
};

/** Einmal von Hand ausführen: legt den 5-Minuten-Zeitplan an und gleicht sofort ab. */
function einrichten() {
  schluessel_();
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'abgleichen'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('abgleichen').timeBased().everyMinutes(5).create();
  const n = abgleichen();
  Logger.log('Eingerichtet. Erster Abgleich: ' + n + ' Eintrag/Einträge. Ab jetzt alle 5 Minuten automatisch.');
}

/**
 * Läuft automatisch alle 5 Minuten.
 * KC-KALENDER-STILL (Club-App 2.31.1, Fall Thomas 07.10.2026): Hat ein Kalendereintrag GÄSTE (z. B. ein Mitglied von Hand eingeladen),
 * schickt Google bei jeder Änderung jedem Gast eine Mail „Aktualisierte Einladung“ – bei Thomas kamen so 4 Mails.
 * Grundsatz (Wunsch Hansi): Google verschickt NIE Mails – Benachrichtigungen kommen nur aus der Köcheclub-App.
 * Deshalb: Einträge mit Gästen werden nur noch STILL geändert und die Gäste dabei still entfernt
 * (erweiterter Dienst „Google Calendar API“, sendUpdates = none).
 * Ist dieser Dienst nicht eingeschaltet, bleiben Einträge mit Gästen unverändert – nie wieder Mails an Mitglieder.
 * Ohne Gäste: nur das ändern, was sich wirklich geändert hat.
 */
function abgleichen() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 0;
  try {
    const kal = kalender_();
    const antwort = aufruf_('kalender_abgleich', {});
    const ergebnisse = [];
    (antwort.eintraege || []).forEach(function (e) {
      try {
        let ev = e.event_id ? holen_(kal, e.event_id) : null;
        const gaeste = ev ? ev.getGuestList().length > 0 : false;
        if (e.geloescht) {
          if (ev && gaeste) {
            if (!still_()) { ergebnisse.push({ uid: e.uid, fehler: 'Eintrag hat Gäste – nicht gelöscht (sonst bekämen sie eine Mail)' }); return; }
            Calendar.Events.remove(kal.getId(), ev.getId().replace(/@google\.com$/, ''), { sendUpdates: 'none' });
          } else if (ev) ev.deleteEvent();
          ergebnisse.push({ uid: e.uid, event_id: null, hash: e.hash });
          return;
        }
        const beginn = new Date(e.beginn), ende = new Date(e.ende);
        if (!ev) {
          ev = kal.createEvent(e.titel, beginn, ende, { location: e.ort || '', description: e.beschreibung || '' });
          if (KC_FARBEN[e.farbe]) ev.setColor(KC_FARBEN[e.farbe]);
        } else if (gaeste) {
          if (!still_()) { ergebnisse.push({ uid: e.uid, fehler: 'Eintrag hat Gäste – nicht geändert (sonst bekämen sie eine Mail)' }); return; }
          // Gäste werden dabei STILL entfernt: Mails an Mitglieder kommen nur aus der Köcheclub-App, nie aus Google (Wunsch Hansi)
          Calendar.Events.patch({ summary: e.titel, location: e.ort || '', description: e.beschreibung || '',
            start: { dateTime: beginn.toISOString() }, end: { dateTime: ende.toISOString() },
            colorId: KC_FARBEN[e.farbe] ? String(KC_FARBEN[e.farbe]) : undefined, attendees: [] },
            kal.getId(), ev.getId().replace(/@google\.com$/, ''), { sendUpdates: 'none' });
        } else {
          if (ev.getTitle() !== e.titel) ev.setTitle(e.titel);
          if (ev.getStartTime().getTime() !== beginn.getTime() || ev.getEndTime().getTime() !== ende.getTime()) ev.setTime(beginn, ende);
          if (ev.getLocation() !== (e.ort || '')) ev.setLocation(e.ort || '');
          if (ev.getDescription() !== (e.beschreibung || '')) ev.setDescription(e.beschreibung || '');
          if (KC_FARBEN[e.farbe] && ev.getColor() !== String(KC_FARBEN[e.farbe])) ev.setColor(KC_FARBEN[e.farbe]);
        }
        ergebnisse.push({ uid: e.uid, event_id: ev.getId(), hash: e.hash });
      } catch (f) {
        ergebnisse.push({ uid: e.uid, fehler: String((f && f.message) || f) });
      }
    });
    aufruf_('kalender_gemeldet', { ergebnisse: ergebnisse });
    return ergebnisse.length;
  } finally {
    lock.releaseLock();
  }
}

/** true, wenn der erweiterte Dienst „Google Calendar API“ (Kennung Calendar) eingeschaltet ist – dann Änderungen ohne Mails. */
function still_() {
  return typeof Calendar !== 'undefined' && !!Calendar.Events;
}

function holen_(kal, id) {
  try { return kal.getEventById(id); } catch (f) { return null; }
}

function kalender_() {
  const id = PropertiesService.getScriptProperties().getProperty('KC_KALENDER_ID');
  const k = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
  if (!k) throw new Error('Kalender nicht gefunden: ' + id);
  return k;
}

function schluessel_() {
  const s = PropertiesService.getScriptProperties().getProperty('KC_KALENDER_SCHLUESSEL');
  if (!s) throw new Error('Bitte zuerst in den Projekteinstellungen die Skripteigenschaft KC_KALENDER_SCHLUESSEL mit dem Schlüssel aus der App anlegen.');
  return s.trim();
}

function aufruf_(action, daten) {
  const r = UrlFetchApp.fetch(KC_API, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-kalender-key': schluessel_() },
    payload: JSON.stringify(Object.assign({ action: action }, daten)),
    muteHttpExceptions: true,
  });
  const code = r.getResponseCode();
  if (code === 401) throw new Error('Schlüssel ungültig – in der App (Termine → Google-Kalender) einen neuen erzeugen und in den Skripteigenschaften ersetzen.');
  if (code !== 200) throw new Error('KC Besuchsprotokoll antwortet mit ' + code + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}
