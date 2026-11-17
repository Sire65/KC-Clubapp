# Konzept: Fußball-Tippspiel im Köcheclub

Stand 17.11.2026 · Kennzeichen **KC-CLUB-TIPPSPIEL** · Wunschliste **#96** · Status: **Konzept – wartet auf Hansis Antworten**

Wunsch Hansi (16.11.2026): „Baue ein Fußball-Tippspiel ein zu verschiedenen Anlässen wie Bundesliga, EM, WM, Champions League, Nations League usw.
Wenn ein Spiel ansteht und man meldet sich an, Frage, ob man einen Tipp für das Spiel abgeben möchte. Wenn ja, dann in eine Tabelle eintragen.
Dann muss es eine Übersicht geben mit den Punkten. Es gibt solche Tippspiele ja schon im Internet.“

## 1. Idee in einem Satz
Hansi legt eine **Tipprunde** an (z. B. „WM 2026“ oder „Bundesliga Rückrunde“). Steht ein Spiel an, fragt die App beim Öffnen
„⚽ Deutschland – Frankreich heute 21 Uhr: Dein Tipp?“ – zwei Zahlen tippen, fertig. Nach dem Spiel gibt es Punkte und eine **Tabelle**.

## 2. Woher kommen Spiele und Ergebnisse? (kostenlos)
- **OpenLigaDB** (openligadb.de): frei, ohne Anmeldung, ohne Schlüssel, ohne Kosten. Hat 1./2. Bundesliga, DFB-Pokal und bei großen Turnieren meist EM/WM.
  Der Club-Server holt Spielplan und Ergebnisse 1× am Tag und kurz nach Spielende – die Handys fragen nie fremde Seiten.
- **Champions League / Nations League**: nicht zuverlässig kostenlos zu bekommen. Dafür: Hansi (oder ein „Tippmeister“) trägt Spiele und Ergebnisse
  **von Hand** ein – mit Auswahl statt Freitext (Mannschaften aus einer Liste), ein Ergebnis ist in 10 Sekunden eingetragen.
- Keine Wetten, kein Geld, keine Werbung, keine fremden Konten.

## 3. Ablauf
| Wann | Was passiert |
|---|---|
| Runde anlegen | Hansi: Wettbewerb wählen (Bundesliga / EM / WM / Pokal / „eigene Runde“), Zeitraum. Bei Bundesliga: alle Spiele oder nur ausgewählte (z. B. nur BVB, Schalke, Bayern – sonst sind es 9 Spiele je Spieltag). |
| Mitmachen | Jeder entscheidet einmal „⚽ Ich tippe mit“ (freiwillig). |
| Vor dem Spiel | Beim Öffnen der App eine kleine Zeile: „⚽ 2 Spiele heute – jetzt tippen“ → Liste, je Spiel zwei Zahlen. Tippen bis Anpfiff, danach gesperrt. Optional eine Erinnerung 2 Std. vor Anpfiff (Frage 5). |
| Nach dem Spiel | Ergebnis kommt automatisch (oder von Hand) → Punkte werden vergeben. |
| Tabelle | „🏆 Tipp-Tabelle“: Platz, Name, Punkte, Anzahl exakter Tipps. Je Spieltag ein „Tippkönig“. Sieger am Ende z. B. beim Weihnachtsessen ehren (Frage 7). |

## 4. Punkte (Vorschlag, wie bei den bekannten Tippspielen)
- **3 Punkte**: Ergebnis genau richtig (z. B. 2:1 getippt, 2:1 gespielt)
- **2 Punkte**: richtige Tordifferenz (2:1 getippt, 3:2 gespielt)
- **1 Punkt**: richtige Tendenz (Sieg/Unentschieden/Niederlage)
- Bei K.-o.-Spielen zählt das Ergebnis nach 90 Minuten (oder nach Verlängerung – Frage 4).

## 5. Fair und geheim
- Die Tipps der anderen sieht man **erst nach Anpfiff** (keiner schreibt ab).
- Nur Mitglieder (und auf Wunsch Aushilfen – Frage 2).

## 6. Technik (kurz)
- Tabellen: Runde, Spiel, Tipp (je Person und Spiel einer) – RLS an, nur der Club-Server, gespiegelt und gesichert.
- Server holt OpenLigaDB über einen Adapter (austauschbar, AGENTS Regel 18); fällt die Seite aus, geht Eintragen von Hand weiter.
- Neuer Baustein `teile/tippspiel.js` (lädt nur, wenn man ihn öffnet), Freigabe „tippspiel“ (erst Admin zum Testen, dann alle).
- Tests: Punkte-Rechnung, Sperre ab Anpfiff, Geheimhaltung bis Anpfiff, Rechte.

## 7. Fragen an Hansi
1. **Erste Runde**: Womit anfangen? Vorschlag: **WM 2026** (Juni/Juli) – vorher zum Ausprobieren ein paar **Bundesliga**-Spiele ab Januar.
2. **Wer darf tippen**: nur Mitglieder oder auch Aushilfen?
3. **Bundesliga**: alle 9 Spiele je Spieltag oder nur ausgewählte (welche Vereine)?
4. **Punkte** wie oben (3/2/1) – passt das? K.-o.-Spiele: nach 90 Minuten oder mit Verlängerung?
5. **Erinnerung**: nur eine Zeile beim Öffnen der App – oder auch eine Push 2 Stunden vor Anpfiff?
6. **Champions League / Nations League**: Spiele und Ergebnisse von Hand eintragen – machst du das, oder soll es ein „Tippmeister“ übernehmen?
7. **Gewinner**: Nur Ehre (🏆 in der App) – oder ein kleiner Preis beim Weihnachtsessen?
