### ✍️ Aufgabe erledigt: Bemerkung ist freiwillig (KC-CLUB-AUFGABE-BEMERKUNG-FREI, Wunsch Hansi 19.11. „beim Bestätigen Protokoll-Aufgaben kein Pflichtfeld, sondern freiwillige Angabe“)
- Beim Abhaken einer Aufgabe („✔ Erledigt“ im Protokoll und im Büro) und in der Startmeldung „📌 Wie steht's mit deiner Aufgabe?“ (✅ erledigt und 🔶 teilweise) ist der Text jetzt **freiwillig** – leer lassen und melden geht.
- Ohne Bemerkung bekommt, wer die Aufgabe eingetragen hat, den Bescheid ohne leeres „…“ bzw. ohne Zeile „Bemerkung:“.

### 📎 Anlagen im Chat besser sichtbar (KC-CLUB-CHAT-ANLAGEN-SICHTBAR, Wunsch Hansi 19.11. „wenn dort eine Anlage drin liegt, muss die besser gekennzeichnet sein, z. B. durch eine blinkende Büroklammer“)
- Hängt an einer Nachricht eine Datei (z. B. ein PDF) oder mehrere Fotos, steht darunter jetzt ein **umrandeter Kasten „📎 2 Anlagen: …“** mit großen Knöpfen – antippen öffnet die Datei wie bisher (Öffnen / Teilen / Speichern). Ein Punkt **•** heißt: noch nicht geöffnet. Fotos zeigen weiter ihr Vorschaubild.
- Bei **neuen Nachrichten mit Anlage** wackelt die 📎 kurz (3×, etwa 1,5 Sekunden) – nicht, wenn „✨ Animierte Knöpfe“ aus ist oder das Handy „weniger Bewegung“ eingestellt hat.
- In der **Chat-Übersicht** steht rechts **„📎2“**, wenn in dem Chat Dateien anderer liegen, die du noch nicht geöffnet hast. Das merkt sich nur dein Gerät – dafür gibt es **keine zusätzliche Abfrage** beim Server.
- Im Chat oben **⋮ → „📎 Alle Anlagen (Fotos & Dateien)“**: alle Fotos als Kacheln und alle Dateien als Zeilen (Name, Zeit, Absender); antippen öffnet, **„↪ zur Nachricht“** springt hin und lässt sie kurz aufleuchten. „✓ Alle als geöffnet merken“ nimmt die Punkte weg.
- Neuer Tipp in der Hilfe („Anlagen im Chat nicht übersehen“).

### ✔ „Erledigt am … von …“ an Aufgaben (KC-CLUB-AUFGABE-ERLEDIGT-VON, Wunsch Hansi 19.11.)
- Erledigte Aufgaben im Protokoll zeigen unter dem (durchgestrichenen) Text jetzt **„✔ erledigt am 19.11. von Frank“** – bei älteren Erledigungen, bei denen das noch nicht festgehalten wurde, nur „✔ erledigt am …“.
- Im Abschnitt **„Stand der Aufgaben“** und im **Ausdruck/PDF** steht es ebenso („✅ erledigt am 21.11. von Frank – …“).
- Server: `protokoll_laden` gibt dafür nur den Vornamen dessen heraus, der abgehakt hat (`erledigt_von_name`) – keine neue Datenbank-Spalte.
