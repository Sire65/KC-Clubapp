# Konzept: „Gelesen per E-Mail“ (KC-CLUB-MAIL-GELESEN) – vorbereitet 21.11.2026, NICHT gebaut

Wunsch Hansi 21.11.: sehen, ob Mitglieder eine Rundmail (z. B. Dienstplan) gelesen haben – „persönlicher Link“, dazu ein Zählbild.
Befund: 14/16 Mails gehen über web.de (SMTP, keine Öffnungs-Meldung), 2 über Brevo (keine Rückmelde-Adresse eingerichtet);
in kc_communication_delivery_events gibt es seit 60 Tagen nur „sent“, nie „opened“.

## 1. Persönlicher Link (zuverlässig – Hauptweg)
- Jede Mail einer Chat-Nachricht/Rundschreibens bekommt je Empfänger einen Knopf „📄 Nachricht öffnen“ (bei Anlage: „📄 Dienstplan öffnen“).
- Link: `https://sire65.github.io/KC-Clubapp/#gelesen=<code>` – `code` = zufälliger, nicht erratbarer Einmal-Code (≥ 128 Bit),
  gespeichert nur als Hash in neuer Tabelle `kc_club_mail_gelesen (code_hash, person_id, thread_id, message_id, erstellt_am, geklickt_am, bild_am)`
  (Grants service_role, RLS an, revoke public/anon/authenticated – KC-SUPABASE-GRANTS).
- Klick → Club-Server-Aktion `mail_gelesen` (ohne Anmeldung, nur mit Code): setzt `geklickt_am`, markiert die Nachricht für diese Person als gelesen
  (`last_read_at` im Thread nur vorwärts), öffnet danach den Chat bzw. die Anlage (mit Anmeldung wie gewohnt; ohne Zugang auf dem Gerät: Hinweis + Anlage nur, wenn freigegeben).
- Code gilt 30 Tage, nur für diese eine Nachricht; mehrfacher Klick ändert nur die erste Zeit. Keine Inhalte im Link.

## 2. Zählbild (unsicher – nur Hinweis)
- Unsichtbares 1×1-Bild `…/functions/v1/kc-club?action=mail_bild&c=<code>` → setzt `bild_am` (nur erste Öffnung), antwortet mit transparentem GIF.
- Anzeige ausdrücklich als „👁️ vermutlich geöffnet“ (grau), NIE als „gelesen“:
  Apple Mail lädt Bilder vorab (falsch „geöffnet“), viele Programme blockieren Bilder (falsch „nicht geöffnet“).
- Datenschutz: kurzer Satz im Mail-Fuß („Diese Mail enthält einen Lese-Hinweis für den Absender“) + Ausschalter je Mitglied in den Einstellungen.

## 3. Anzeige für den Absender
- In der Nachricht „ⓘ Wer hat gelesen?“ (Sendebericht KC-CLUB-SENDEBERICHT erweitern): je Empfänger
  ✅ gelesen in der App (Zeit) · ✅ gelesen per Mail-Link (Zeit) · 👁️ vermutlich geöffnet (Zählbild) · ⏳ noch nicht.

## Bausteine / Orte
- Mail-Aufbau liegt im Communicator (Repo kc-communication, Vorlagen/Router) – Platzhalter `{{gelesen_link}}`/`{{gelesen_bild}}` je Empfänger.
- Club-Server (supabase/functions/kc-club/index.ts): Code erzeugen beim Versand (nachricht_senden → sendenGewaehlt), Aktionen `mail_gelesen`, `mail_bild`.
- Migration + Grants; Test (Code-Hash, Ablauf, kein Inhalt im Link, Zählbild nie als „gelesen“).

## Aufwand / Risiken
- Mittel (Club-Server + Communicator-Vorlage + kleine App-Anzeige). Zwei Repos → gemeinsam einspielen.
- Weitergeleitete Mail: wer weitergeleitet bekommt und klickt, markiert den ursprünglichen Empfänger → in der Anzeige „per Mail-Link“ kennzeichnen.
- Egress minimal (Zählbild ~50 Byte je Öffnung).
