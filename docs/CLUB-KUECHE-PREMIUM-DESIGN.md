# Club-Küche – Premium-Magazindesign

**Stand:** 10.11.2026 · **nur Arbeitszweig** \`magazin-premium-design-2026-11-10\` · **nicht live gestellt**.

## Ziel

Die bestehende Clubzeitschrift erhält einen hochwertigeren Editorial-Look, ohne die gut funktionierende Magazinstruktur zu ersetzen. Der Redaktionsentwurf bleibt bis zur gesonderten Freigabe auf diesem Branch. Der Weihnachtsmarkt-Prospekt bleibt grün und behält seinen eigenen Stil.

## Implementiert

- **Titelseite:** bessere Hierarchie zwischen Magazinmarke, Ausgabedatum, Hauptthema und Teasern; hochwertige weinrot-goldene Gestaltung mit originalem Club-Logo und bewusst abstraktem Editorial-Aufmacher, solange die Redaktion noch kein echtes Titelbild ausgewählt hat. **Keine fremden oder erfundenen Fotos.**
- **Seiten:** ruhiger cremefarbener Papierhintergrund, neu abgestimmte Kopf-/Fußzeilen und Rubriküberschriften mit feiner goldener Linie.
- **Inhaltsverzeichnis:** größere klickbare Registerzeilen, klare Seitenzahlen und gut sichtbare Fokus-Markierung für Tastaturbedienung.
- **Rezepte:** großformatige vorhandene Gerichtfotos, klare Zutaten-/Arbeitsschritte und ruhig gesetzte Fakten. Vorhandene Rezeptdaten bleiben unverändert.
- **Weitere Artikel:** harmonisierte Vorspänne, Zitate, Hervorhebungen, Infokästen, mehr Bildraum.
- **Roman:** großzügige, einspaltige Buchtypografie; Hervorhebung von „Was bisher geschah“; Kapitel- und Illustrationsabstände. Die Texte, Figuren und Bildzuordnungen werden **nicht** geändert.
- **Mobil:** Einspaltensatz für schmale Displays, etwas geringere Abstände, gut bedienbares Inhaltsverzeichnis.
- **Barrierearme Darstellung:** keine unnötigen Animationen, deutlichere Fokusdarstellung, kontrastreichere Metadaten bei entsprechendem Systemwunsch.
- **Broschüre:** A5- und A4-Druckwerkzeug bleibt bestehen. Die PDF-Routine sammelt die \`.mag-\`-Regeln aus dem neuen Stylesheet zusammen mit der bisherigen Gestaltung ein. Der bestehende Drucksatz setzt zusätzliche A5-Regeln. Ein **echter PDF-Render-/Drucktest** ist vor Veröffentlichung erforderlich.
- **Offline:** \`magazin/premium.css\` in den Service-Worker-Vorladebestand aufgenommen.
- **Abgrenzung:** ergänzende Rückfallregeln stellen sicher, dass \`wm-seite\` weiter die bewährte grüne Weihnachtsmarkt-Darstellung nutzt.

## Dateien

| Datei | Änderung |
|---|---|
| \`magazin/premium.css\` | neue CSS-Designebene (keine externen Schriftarten, keine privaten Daten) |
| \`index.html\` | eingebundene Designebene im \`<head>\` |
| \`sw.js\` | CSS im Offline-Vorladebestand |
| \`tests/magazin-premium.test.mjs\` | Struktur- und Regressionskontrollen |
| \`docs/CLUB-KUECHE-PREMIUM-DESIGN.md\` | diese Abnahme- und Übergabedokumentation |

Das ca. 477 KB große Magazinmodul \`teile/magazin.js\` und sämtliche Romaninhalte bleiben **unverändert**. Daher sind keine neuen Teil-SRI-Fingerabdrücke nötig.

## Prüfliste vor Übernahme

1. **Nur isoliert testen.** Keine Tests mit einem echten oder ausgedachten Mitgliederschlüssel gegen den laufenden Club-Server. Für Browserläufe die vollständige Abschirmung und Netzsperre aus \`AGENTS.md\` umsetzen.
2. **Desktop:** Titel, Inhaltsverzeichnis, Rezept-, Tipps-, Roman- und Impressumsseite öffnen. Seitenränder, Schriftgrößen und Umbrüche kontrollieren.
3. **Handy 360–430 px:** keine horizontalen Überläufe, klare Titel, einspaltiger Text, funktionierende Zoom- und Blätterfunktion.
4. **Tablet 768–1024 px:** großzügige Zeilenlängen, Grafikbreiten, genug Raum zwischen Rubriken.
5. **Weihnachtsmarkt-Prospekt:** grüner Kopf, unveränderte Platzhalter und Seitenfolge; Premium-CSS verändert sein Layout nicht.
6. **Roman:** Illustrationen korrekt platziert, lesbare Absätze, keine inhaltliche Veränderung.
7. **A5-PDF/A4-Broschürendruck:** auf Handy und PC erzeugen, 4er-Seitenzahl, durchgehende und korrekte Bilddarstellung, Seitenumbruch an Überschriften, keine abgeschnittenen Sätze.
8. **Offline:** Seite einmal online laden, dann ohne Internet erneut starten und Magazin öffnen. CSS und Bildquellen müssen sich zuverlässig verhalten.
9. **Freigaben:** Ausgaben dürfen nur nach Erscheinungsdatum und Redaktionseinwilligung angezeigt werden. Achtung: Diese Browser-Abfrage schützt **nicht** vor Rohtext im öffentlichen Repository.

## Was redaktionell bewusst noch fehlt

**Echte Titelbilder:** Das alte Titelmotiv war nur die Club-Kochmütze mit dem Hinweis „Titelfoto – wählt die Redaktion“. Ein neues CSS-Design allein kann keine authentischen Weihnachtsmarkt-, Vereins- oder Rezeptfotos liefern. Für professionelles Cover-Fotodesign brauchen wir eine **pro Ausgabe wählbare, rechtlich freigegebene Fotodatei** und einen echten Bildpfad im Titel-Datensatz. Das ist eine **separate funktionale Erweiterung**, die auch \`teile/magazin.js\` und dessen SRI/Offline-Vertrag betrifft; sie gehört nicht zur reinen Layout-Runde. Die erste Ausgabe sollte vor Veröffentlichung unbedingt ein reales Foto statt des abstrakten Übergangsmotivs erhalten.

**Redaktion:** Noch offene Fotoeinwilligungen, Zitate, Marktkennzahlen und Verantwortlichkeitsangaben in einzelnen Heften müssen von der Redaktion geprüft und ergänzt werden. Kein Design ersetzt Faktenprüfung und Korrektorat.

**Vertraulicher Romanabschluss:** Die früheren Folgen und das Finale sind bereits im öffentlich sichtbaren Repository \`Sire65/KC-Clubapp\` enthalten. Eine künftige sichere Auslieferung muss unveröffentlichte Kapitel aus dem öffentlichen Client-Code und dessen öffentlicher Versionshistorie heraushalten. **Dieser Design-Branch verändert den bestehenden Spoilerschutz nicht**.

## Beim späteren Einspielen

\`AGENTS.md\` beachten: zum vorgesehenen Bündeltermin, nur bei ruhigem System, Tests grün, neue App-Version mit konsistenter Versionskennung in \`version.json\`, \`app.js\`, \`index.html\` und \`sw.js\`. Bis dahin diesen Branch nicht in \`main\` übernehmen. Codeänderungen im Magazinmodul nur mit anschließendem \`node tools/teile-pruefsumme.mjs\`.

**Stand dieses Branches:** Premium-CSS implementiert, statische Strukturprüfungen bestanden; echter Browser-/PDF-Test und Freigabe noch ausstehend.
