# Club-Küche – Premium-Magazin-Design

**Stand:** 10.11.2026 · Design-Branch \`magazin-premium-design-2026-11-10\`.

## Umsetzung

Die bestehende Magazinlogik in \`teile/magazin.js\` wird nicht verändert. Die zusätzliche Designschicht \`magazin/premium.css\` ist in \`index.html\` nach den bisherigen Styles eingebunden und in \`sw.js\` für den Offlinebetrieb vorgemerkt. Der Weihnachtsmarkt-Prospekt behält sein eigenes Titelblatt und seine eigenständige Gestaltung.

Gestalterische Änderungen:
- Großes typografisches Titelblatt in Burgunderrot mit klarer Heftmarke, Goldakzenten, visuellem Aufmacher und hierarchisch gestalteten Schlagzeilen. Das permanente Etikett „Entwurf · nur für den Admin sichtbar“ wird auf dem Titelblatt ausgeblendet, da es sonst auch erschienene Ausgaben verfälscht. **Die tatsächliche Veröffentlichungsfreigabe wird dadurch nicht geändert.**
- Überarbeiteter Satzspiegel für Heftkopf, Artikelüberschrift, Unterzeile und Fußzeile; heller warmer Papiergrund und konsistente Abstände.
- Modernisiertes, gut berührbares Inhaltsverzeichnis mit deutlicher Typohierarchie.
- Rezeptreportagen mit großem Verhältnisbild, klaren Zutaten- und Verarbeitungsschritten sowie strukturierter Faktenleiste. Vorhandene Rezeptdaten bleiben unangetastet.
- Redaktionelle Kästen, Zitate, Fotoserien und Bildunterschriften harmonisiert.
- Romanseiten mit etwas größeren Zeilenabständen, zurückhaltenden Kapiteltrennern und einem eigenständigen „Was bisher geschah“-Block. Keine Änderung an Romantext und Illustrationen.
- Mobile Anpassungen für kleine Bildschirme, Tastaturfokus, reduzierter Bewegung und erhöhter Kontrast.
- Druckfreundliche Regeln und lokale Farbvariablen auch für die bestehende A5-Broschürenerstellung.

## Wichtig: keine erfundenen Titelbilder

Die bisherigen Monatsausgaben besitzen noch **keine redaktionell freigegebenen echten Titelfotos**; das bisherige Feld enthält nur die Kochmütze und die Aufforderung, später ein Foto zu wählen. Die Premium-Fassung nutzt bis zur Foto-Freigabe einen bewusst **typografisch gestalteten, abstrakten Titelaufmacher** statt eines zufälligen Stockbilds oder eines für alle zwölf Ausgaben wiederverwendeten Rezeptfotos. Ein echter, abwechslungsreicher Foto-Cover pro Ausgabe ist ein separater **redaktioneller** Folgeschritt.

Für künftige Titelbilder empfehlen sich Hochformatbilder mit mindestens 1400 Pixel auf der langen Seite, authentische Club- oder Küchenmotive, geklärte Nutzungsrechte sowie Freiraum für ein kurzes Magazin-Titelthema. Keine unangekündigte Verwendung persönlicher Mitgliederfotos.

## Verifikation

- \`tests/magazin-premium.test.mjs\` kontrolliert Einbindung, Offline-Vorladen, nötige Designkomponenten, unveränderte Lesefunktionen und ausgewogene CSS-Blockklammern.
- Der Test ist in \`.github/workflows/tests.yml\` angemeldet. Bestehende Magazin-Tests und der Browser-Rundgang laufen weiterhin als Teil der GitHub-Actions-Pipeline.

**Vor Live-Veröffentlichung noch praktisch prüfen:**
1. Titelseite und eine Rezeptseite auf Android (schmal), iPad quer/hoch und Desktop; große Schrift und Zoom 160 %; keine horizontale Überbreite.
2. Eine komplette lange Romanfolge inklusive Skizzen und „Was bisher geschah“; saubere Abstände vor/nach Bildern, keine Überlagerungen.
3. Inhaltsverzeichnis und Blättern; alle Sprungbuttons tatsächlich anklickbar.
4. A5-Broschüre und A4-Druckbögen; Seitenumbruch, Bildauflösung, Dateigröße und Textschärfe überprüfen. Die vorhandene PDF-Implementierung rendert Seiten als Bilder.
5. Eine veröffentlichte und eine noch gesperrte Ausgabe im Mitglieds-/Admin-Modus vergleichen; keine sichtbaren Entwurfs- oder Platzhaltertexte in einer finalen Ausgabe.
6. **Sicherheitsproblem außerhalb des Designumfangs:** Unveröffentlichte Romanfolgen und das Finale liegen gegenwärtig im **öffentlichen Quellcode** des Clubs. Ein künftiges Erscheinungsdatum im Client schützt den Text nicht vor Einsicht. Vor der tatsächlichen Magazinfreigabe muss diese Auslieferungsarchitektur separat bereinigt werden; die Premium-CSS-Änderung löst das nicht.

## Deployment

Diese Änderung bleibt bis zur Abnahme im separaten GitHub-Branch. Für die Veröffentlichung den regulären KC-Club-App-Releaseprozess verwenden; App-Version, Service Worker, Cache und Pflichtprüfungen gegen die aktuellste \`main\`-Version abgleichen. Nicht nur die CSS-Datei isoliert nach \`main\` übernehmen, ohne die \`index.html\`-Einbindung und die Offline-Dateiliste zu berücksichtigen.
