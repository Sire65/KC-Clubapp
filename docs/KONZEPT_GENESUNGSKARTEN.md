# Konzept: Genesungskarten-Baukasten (mehrere Motive, eigener Text)

Stand 16.11.2026 · Kennzeichen **KC-CLUB-GENESUNGSKARTEN** · baut auf **KC-CLUB-GENESUNGSKARTE** (2.965.0, Blumenstrauß) auf · Status: **Konzept – wartet auf Hansis Antworten**
Entwurf der Motive: [genesungskarten-entwurf.jpg](genesungskarten-entwurf.jpg)

Wunsch Hansi (16.11.2026): „Baue mehrere verschiedene Genesungskarten ein mit der Möglichkeit, einen eigenen Text zu verfassen für die Karte … auch verschiedene
Motive. Vielleicht eine süße Maus oder Kaninchen oder Bär. Mach mal Konzept.“

## 1. Idee in einem Satz

Beim Mitglied auf **„💐 Gute-Besserung-Karte“** tippen → **Motiv wählen** (wischen), **Text wählen oder selbst schreiben**, Absender wählen → Vorschau → **„💬 In den Chat legen“** → ➤.

## 2. Motive (alle in der App gezeichnet – keine fremden Bilder, keine Lizenzen, keine Kosten)

| Motiv | Bild | passender Vorschlags-Text |
|---|---|---|
| 💐 Blumenstrauß | wie heute (2.965.0) | „Werde schnell wieder gesund – wir freuen uns auf dich!“ |
| 🐭 Maus | kuschelt unter einer Decke, daneben eine Tasse Tee | „Kuschel dich ein und werde schnell wieder gesund.“ |
| 🐰 Kaninchen | hält eine Blume | „Wir denken an dich und schicken dir eine Blume.“ |
| 🧸 Bär | Teddy mit Herz-Luftballon | „Eine dicke Umarmung von uns allen!“ |
| 🍲 Suppentopf | weinroter Topf mit Hühnersuppe und Kochmütze – passt zum Köcheclub | „Die beste Medizin: eine Suppe vom Köcheclub!“ |
| ☀️ Sonne (Vorschlag) | lachende Sonne mit Regenbogen | „Bald scheint wieder die Sonne für dich!“ |

Alle Karten im gleichen Rahmen: Beige, weinroter Rand, unten das Band mit **Kochmütze und „Köcheclub Werne“** (Corporate Design, AGENTS Regel 19).
Neue Motive später = ein Eintrag in einer Liste (Registry `GK_MOTIVE`: Name, Zeichnen, Vorschlags-Texte) – nichts sonst muss geändert werden.

## 3. Text

- **Überschrift** zur Wahl: „Gute Besserung, Karla!“ (Standard) · „Werde schnell gesund, Karla!“ · „Wir denken an dich, Karla!“. Der Vorname kommt automatisch.
- **Text**: je Motiv 2–3 Vorschläge zum Antippen **oder „✏️ Eigener Text“** – ein Feld für höchstens 120 Zeichen; die App bricht die Zeilen von selbst um
  und macht die Schrift kleiner, wenn es lang wird (passt immer auf die Karte). Vorschau ändert sich beim Tippen.
- **Absender** (Unterschrift auf der Karte): „Dein Köcheclub“ (Standard) · „Hansi und der ganze Club“ (mit eigenem Vornamen) · „Von Hansi“ · ✏️ eigener.
- Auf der Karte steht **nie ein Grund** (keine Krankheit, keine OP) – Gesundheitsdaten werden nicht gespeichert.

## 4. Bedienung

1. Mitglied antippen → **„💐 Gute-Besserung-Karte“** (wie heute; auch in Büro → Freud & Leid bei Krankheit/Unfall).
2. Oben die Karte groß. Darunter eine Reihe kleiner Motive (💐 🐭 🐰 🧸 🍲 ☀️) – antippen oder auf der Karte nach links/rechts wischen.
3. Überschrift · Text (Vorschläge oder ✏️ eigener) · Absender.
4. **„💬 In Karlas Chat legen“** → Karte liegt als Bild im Chat, ein kurzer Gruß ist vorgeschrieben → ➤ tippt man selbst.
5. Die App merkt sich das zuletzt gewählte Motiv und den Absender (nur auf diesem Gerät).

## 5. Stufe 2 (nur wenn Hansi möchte): gemeinsame Karte vom ganzen Club

Hansi (oder die Clubleitung) startet „💐 Gemeinsame Karte für Karla“. Alle Mitglieder sehen einen Hinweis und **unterschreiben mit einem Tipp**
(Vorname erscheint klein auf der Karte, wie handschriftlich). Nach z. B. 2 Tagen oder per Knopf geht die Karte mit allen Namen in Karlas Chat.
Braucht eine kleine Tabelle (wer hat unterschrieben) – darum eigene Stufe.

## 6. Technik (kurz)

- Nur App (`app.js`), kein neuer Serverweg: Bild wie heute über `anlage_hochladen`, Chat über `direkt()`.
- Registry `GK_MOTIVE` = { id, sym, name, zeichnen(g, x, y), texte[] }; gemeinsamer Rahmen `gkRahmen()`; Textumbruch `gkUmbruch()`.
- „Bewegung verringern“: kein Wisch-Effekt, nur Wechsel.
- Tests: jedes Motiv zeichnet ohne Fehler, eigener Text wird gekürzt (120 Zeichen) und umbrochen, kein Grund-Wort auf den Vorlagen, CD-Farben, nichts wird automatisch gesendet.
- Später auch für andere Anlässe nutzbar (Geburtstag, Glückwunsch, Danke) – derselbe Baukasten mit anderen Motiven.

## 7. Fragen an Hansi

1. **Motive:** Passen 🐭 Maus, 🐰 Kaninchen, 🧸 Bär und 🍲 Suppentopf (Entwurf)? Dazu ☀️ Sonne – ja oder nein? Noch ein Wunsch-Motiv?
2. **Eigener Text:** Reichen 120 Zeichen (etwa 2–3 Zeilen)?
3. **Absender:** Standard „Dein Köcheclub“ – oder lieber immer mit eigenem Namen („Hansi und der ganze Club“)?
4. **Für alle Mitglieder** wie heute – ja?
5. **Stufe 2 (gemeinsame Karte, alle unterschreiben)** – gleich mitbauen, später oder gar nicht?
