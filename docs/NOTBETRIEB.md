# Notbetrieb der Club-App (KC-CLUB-NOTBETRIEB)

Fällt Supabase aus, läuft die Club-App über einen Ersatz-Server bei Cloudflare weiter (kostenloser Tarif, `notbetrieb/`).
KICC/Supabase bleiben die Quelle; der Ersatz-Server rechnet nichts selbst und ist kein zweiter Regel-Kern.

## Stufe 1 – Ansehen (1.52.0)
- Der Club-Server baut alle 15 Min. (Zeitplaner `kc-club-notpaket-15min`, nur bei Änderung laut Fingerabdruck) für jedes
  Mitglied dieselben Antworten wie im Normalbetrieb (`aktionAusfuehren` mit `nurLesen`) und legt sie gzip + Ed25519-signiert
  beim Ersatz-Server ab. Der private Schlüssel bleibt in `kc_club_notbetrieb` (nie gespiegelt), der öffentliche steht in
  `notbetrieb/pruefschluessel.json`.
- Die App schaltet nach 2 Verbindungsfehlern (oder wenn schon der Start scheitert) um, zeigt das orange Band und kehrt nach
  2 erfolgreichen Antworten des Club-Servers zurück. Handschalter: `notbetrieb.json` (`auto`/`an`/`aus`); Admin-Probe nur auf
  einem Gerät.

## Stufe 2 – Schreiben (1.54.0)
- Im Notbetrieb nimmt der Ersatz-Server an: **Nachricht in einem bestehenden Chat** (nur Text, ❗ und Push/Mail-Wahl bleiben),
  **Zu-/Absage**, **Status**, **Pinnwand-Zettel**. Er führt nichts aus, sondern legt jeden Eintrag in seinen Eingang (KV `e:…`,
  höchstens 40 je Mitglied; die `notId` der App verhindert Doppelte).
- Die App merkt sich, was wartet (`localStorage kc_club_notwartet`): ⏳-Blase im Chat, „📨 N warten“ im orangen Band.
- Zurück im Normalbetrieb ruft die App `notbetrieb_nachtragen` auf; zusätzlich trägt der Zeitplaner (alle 15 Min.) nach.
  Der Club-Server holt den Eingang **signiert** ab (`/eingang/abholen`, Zeitstempel ≤ 5 Min.), merkt sich jeden Eintrag genau
  einmal in `kc_club_notbetrieb_eingang` und führt ihn über die **normale Aktion** aus (gleiche Prüfungen und Rechte,
  Push/Mail wie sonst; Nachrichten bekommen den Hinweis „🟠 im Notbetrieb geschrieben um HH:MM Uhr“). Danach wird der Eintrag
  beim Ersatz-Server gelöscht (`/eingang/quittieren`).
- Was nicht mehr passt (z. B. Treffen inzwischen abgesagt), wird **nicht still verworfen**: Status „abgelehnt“ mit Grund →
  Meldung an das Mitglied und Zeile in der Tagesinfo des Admins. Technische Fehler → beim nächsten Lauf erneut; ein
  unterbrochener Eintrag (> 10 Min. offen) wird nicht blind wiederholt, sondern als „bitte prüfen“ gemeldet.
- Nicht im Notbetrieb: neue Unterhaltungen, Fotos/Anlagen, Abstimmungen, Anrufe/Anklopfen, Büro, Admin-Funktionen.
  Notrufnummern (112 usw.) gehen immer – sie sind fest in der App.

## Rückweg
- Stufe 2 aus: Worker-Version 1.53 einspielen (Schreiben → 409), App-Version davor; Tabelle `kc_club_notbetrieb_eingang` kann bleiben.
- Ganz aus: `notbetrieb.json` → `"modus": "aus"`.
