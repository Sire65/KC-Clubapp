# Änderungen

## 3.53.0 – 2026-11-27 – ↪️ Nachrichten automatisch weiterleiten (KC-CLUB-WEITERLEITUNG) · Server 3.53.0
Wunsch Hansi 27.11.2026: „Kannst du bei Nachrichten eine Autoweiterleitung einbauen, z. B. an eine andere E-Mail-Adresse oder einen anderen Chat?“ – „Alle sollen es haben, an andere E-Mail oder anderen Chat.“
- ⚙️ → 🔔 Benachrichtigungen → „↪️ Automatisch weiterleiten“: Ziel andere E-Mail-Adresse (einmal mit 6-stelligem Code aus einer Mail bestätigt, 30 Min. gültig, höchstens 3 Codes je Stunde, 5 Versuche) oder der Einzelchat mit einem anderen Mitglied; „auch Gruppen“ wählbar (sonst nur Einzelchats); Zeitraum von–bis freiwillig (sonst bis auf Widerruf).
- Weitergeleitet wird eine Kopie – die Nachricht bleibt beim Empfänger. Chat-Kopie: „↪️ Weitergeleitet – von …“ im Namen des Empfängers (mit Anlagen); E-Mail über den Versanddienst (Regel `club_nachricht_mail`, direkte Adresse).
- Nie weitergeleitet: Weiterleitungen (keine Schleife), SOS-Probe, Autoantworten; 🔒 verschlüsselte, ⏳ selbstlöschende Nachrichten und Einmal-Fotos nur als Hinweis ohne Inhalt. NOT-AUS hält sie an.
- Der Absender sieht im Chat „↪️ … leitet Nachrichten gerade weiter (an eine andere E-Mail-Adresse / an einen anderen Chat)“ – nie die Adresse oder das Ziel.
- Protokoll nur „weiterleitung_*“ mit Art – nie Text oder Adresse. Code nur als Prüfsumme gespeichert, nie im Start-Paket.
- Test `tests/weiterleitung.test.mjs` (CI).

## 3.52.0 – 2026-11-27 – 📄 Mein Einzelplan aus DP2 (KC-CLUB-DP2-EIN-STAND) · Server 3.52.0
Hansi 27.11.2026: „Erst prüfen, ob alle Ansichten und PDF richtig sind.“ Prüfung aller Dienstplan-Ansichten gegen DP2 (125 Dienste): Mein Dienst, Wochen-Dienstpläne, Dienstplan-PDF, Morgengruß, Morgen-Check, Stempeln lesen DP2 – stimmen. Fund: **„📄 Mein Einzelplan“** las noch den selbst gerechneten Vorschlag.
- Server `dp_einzelplan`: Dienstzeiten aus DP2 (`dp2Plan`), Stunden aus den DP2-Zeiten, Stand = DP2-Stand. Regelzeit, Wünsche, Bereitschaft weiter aus dem Gerüst.
- Prüfung in `tests/dp2-ein-stand.test.mjs`.

## 3.51.0 – 2026-11-27 – 🧑‍🍳 Einzel-Freischaltungen lesbar · 🗓️ DP2-Erkennung läuft (KC-CLUB-ZUGANG-LISTE, KC-CLUB-DP2-EIN-STAND) · Server 3.51.0
Fund Hansi 27.11.2026 (Bildschirmfoto „Überlappen??“): In 🎖️ Ämter und Rechte → „Einzeln für diese Person“ standen zwei Spalten, die Beschreibung neben dem Namen – auf dem Handy überlappend.
- Jetzt eine Spalte, je Zeile Häkchen, Name fett und die Beschreibung klein darunter.
- 🗓️ Fehler in 3.49.0: Die Erkennung neuer DP2-Stände merkte sich ihren Stand unter `kc_club_konfig` „dp2_gesehen“ – die Tabelle erlaubt nur `^[a-z_]{2,40}$` (keine Ziffern), das Merken schlug fehl, darum lief sie nicht (die Schutzregel verhinderte doppelte Nachrichten). Jetzt „dpzwei_gesehen“; Test prüft alle kc_club_konfig-Schlüssel auf das erlaubte Format.

## 3.50.0 – 2026-11-27 – 🗓️ Mein Dienst: alle kommenden Dienste aufklappbar (KC-CLUB-DIENSTE-ALLE) · Server 3.50.0
Hansi 27.11.2026 (Bildschirmfoto „Mein Dienst“): „Warum nur ein paar Tage angezeigt, wie kann man den Zeitraum ändern?“
- Server `mein_dienst`: alle kommenden Dienste (bis 60) statt nur der nächsten 5. App: die nächsten 5 wie bisher, darunter „▾ Alle 11 Dienste anzeigen“ zum Aufklappen.
- Karte „📄 Pläne Weihnachtsmarkt“: statt „freigegeben 25.11.“ jetzt „Dienstzeiten aus DP2 – wie oben“ (KC-CLUB-DP2-EIN-STAND).
- Test `tests/dienste-alle.test.mjs` (CI).

## 3.49.0 – 2026-11-27 – 📅 Termin-Vorschlag mit rotem ✕ · 🧑‍🍳 Aushilfen einzeln freischalten · 🗓️ nur noch ein Dienstplan (DP2) (KC-CLUB-NT-AUS, KC-CLUB-ZUGANG-EINZELN, KC-CLUB-DP2-EIN-STAND) · Server 3.49.0
Wunsch Hansi 27.11.2026: „Wenn in Nachrichten ein Termin genannt wird, zeigst du ihn als Übernahme-Vorschlag. Daneben in die Zeile ein kleines rotes Kreuz, um in dem Moment die Funktion auszuschalten.“
- Neben „📅 … – eintragen“ an der Nachricht ein rotes ✕: schaltet die Termin-Vorschläge sofort aus (alle verschwinden, Hinweis, wie man sie wieder einschaltet).
- ⚙️ → ✨ Kluge Helfer: neuer Schalter „📅 Termin-Vorschlag an Nachrichten“ (Vorgabe an, je Gerät). Von Hand geht es weiter: Nachricht antippen → „📅 Als Termin übernehmen“.
- Hilfe ergänzt, Test `tests/nt-aus.test.mjs` (CI).
- 🧑‍🍳 **Aushilfen/Gäste einzeln freischalten** (Wunsch Hansi 27.11.2026 „für Aushilfen einige bestimmte Funktionen freischalten bzw. sperren“): Admin-Zentrale → Mitglieder → 🎖️ Ämter und Rechte, bei Aushilfe/Gast „Einzeln für diese Person“. ➕ zusätzlich erlauben: 🚗 Fahrten & Abrechnung, 💶 Erstattung, 🚙 Mitfahrt, ⬆️ Fotos hochladen, 📖 Rezeptbuch, 📰 Club-Küche, 🗳️ Vorschläge & Abstimmungen, 📄 Protokolle lesen, 📇 Kontaktdaten. ➖ wegnehmen: 🎲 Spiele, 🎄 Tippspiel & Advent, 📷 Fotoalbum, 🔁 Diensttausch. Gespeichert in `kc_club_person_einstellung` „zugang_extra“ (keine Migration), Server prüft (`ZUGANG_EXTRA`, `zugangPruefen`), neue Aktion `zugang_extra_laden` (nur Admin). Test `tests/zugang-einzeln.test.mjs` (CI).
- 🗓️ **Nur noch ein Dienstplan** (Hansi 27.11.2026: „Auf jeden Fall dürfen nicht zwei verschiedene Stände existieren“): Druckansicht (`dp_plaene`), Morgengruß und „Dein Dienstplan hat sich geändert“ nehmen die Dienstzeiten aus dem in DP2 veröffentlichten Plan (`kc_dp_plan_published` mit bestätigten Tauschen – wie „Mein Dienst“); der freigegebene Club-Stand liefert nur noch Tage, Bedarf, Wünsche und Bereitschaft. Neue DP2-Stände erkennt der Zeitplaner (`dp2AenderungLauf`, nach 5 Min. Ruhe, gemerkt in `kc_club_konfig` „dp2_gesehen“): Betroffene bekommen ihre neuen Zeiten, die Admins einen Hinweis „🗓️ Neuer Dienstplan aus DP2“. Die Freigabe in der Club-App verschickt keine Dienständerungen mehr. Erster Lauf vergleicht mit dem bisher freigegebenen Stand (1 Person, 1 Tag weicht ab → bekommt einmal die richtige Zeit). Test `tests/dp2-ein-stand.test.mjs` (CI).
