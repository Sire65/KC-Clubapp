# Auftrag an Codex: DP2 – Klappbereiche wie in der Club-App

Stand: 07.10.2026 · Wunsch/Freigabe: Hansi („beides machen“) · Feature-ID **KC-DP-KLAPPBEREICH**
Repository: **Sire65/dp3**, Zweig `codex/club-app-interface`, Ausgang **Build 262 RC (`d8976b9`)** → neu **Build 263 RC**.
Die Club-App hat Build 262 bereits unverändert übernommen (Club-App 2.41.0). Danach übernimmt Claude Build 263 wieder 1:1
(`tools/dp2-twinkey-uebernehmen.mjs`). **Bitte nur DP2-Code ändern** – keine Tabellen/RPCs, kein Datenformat.

## Ziel (ein Satz)
Alle auf-/zuklappbaren Bereiche in DP2 (zuerst Twinkey/Mitglieder-Eingabe, danach die übrigen DP2-Seiten) sehen aus und
funktionieren wie die Klappbereiche der Club-App – damit die Mitglieder **ein** Bedienmuster lernen.

## Ist-Zustand in Build 262 (Mitglieder-Eingabe)
`<details>` mit Browser-Dreieck ▶ ohne weitere Bedienung, z. B. `sw-helper-fold` „Twinkey hilft dir“, `sw-fold sw-days`
„📅 Tage (x von 13 erledigt)“, `sw-fold` „🕒 Zeitübersicht“ (`#swDayTimeline`), `sw-more`, `tw-display` „Anzeige einstellen“.
Kein Schloss, kein „Zuklappen“ unten, Zustand wird nicht gemerkt.

## Soll – die Regeln der Club-App (Vorbild: `kc-clubapp/app.js` Funktion `klappenMerken`, CSS `details.karte` in `index.html`)

1. **Kopfzeile (summary)**: Titel links, rechts **zwei Bedienelemente** in dieser Reihenfolge:
   - **Schloss**-Knopf 42×42 px: 🔓 = frei, 🔒 = festgestellt (gelblicher Hintergrund + goldene Umrandung).
     Titel/aria: „Antippen, um den Bereich so festzustellen“ bzw. „Festgestellt – antippen zum Lösen“.
   - **Pfeil ▾** 42×42 px (Markenrot), offen = ▾, zu = um −90° gedreht (▸), Übergang 0,2 s. Bei festgestelltem Bereich blass (Deckkraft 0,35).
   - Das Browser-Dreieck wird ausgeblendet (`summary::-webkit-details-marker { display:none }`, `list-style:none`).
2. **Antippen der Kopfzeile** klappt auf/zu – außer der Bereich ist **festgestellt**: dann bleibt er, wie er ist, und es kommt ein
   kurzer Hinweis „🔒 Dieser Bereich ist festgestellt – zum Lösen das Schloss antippen.“
3. **Schloss antippen** schaltet nur fest/frei (klappt nicht um) und meldet „🔒 Festgestellt – bleibt offen/zu“ bzw.
   „🔓 Gelöst – wieder auf- und zuklappbar“.
4. **Zustand merken** je Bereich und Gerät (offen/zu und fest/frei), eigener Schlüssel-Präfix z. B. `kc_dp_klappe_<name>` und
   `kc_dp_fest_<name>` (localStorage, alle Zugriffe in try/catch – darf nie die Bedienung stören). `<name>` stabil je Bereich
   (z. B. `data-klappe="tw-tage"`), nicht aus wechselnden Texten ableiten.
5. **Unten „▴ Zuklappen“** in jedem längeren Bereich (runder Knopf, mittig): klappt zu und scrollt sanft zur Kopfzeile.
   Bei festgestelltem Bereich nur der Hinweis aus Regel 2. Kurze Bereiche können ihn mit `data-ohne-unten` weglassen,
   verschachtelte innere Bereiche (`.innen`) bekommen ihn nie.
6. **Ablauf-Steuerung bleibt**: Twinkey darf Bereiche weiterhin selbst öffnen/schließen (z. B. „Tage“ nach der Tageswahl zu,
   „Tag ändern“ wieder auf). Ein **festgestellter** Bereich wird dabei **nicht** verändert. Ein vom Ablauf gesetzter Zustand
   wird nicht als Benutzerwahl gespeichert.
7. **Bedienbarkeit**: Kopfzeile und Knöpfe mind. 42 px hoch, Fokus sichtbar, `aria-expanded` passt, Schloss mit `aria-pressed`.
   Hell/Dunkel wie die übrigen DP2-Farben.
8. **Ein Baustein** (kein Parallel-Core): z. B. `src/ui/fold-sections.js` + `src/ui/fold-sections.css`, der alle
   `details[data-klappe]` einrichtet – auch nachträglich gezeichnete (MutationObserver oder Aufruf nach jedem `render()`),
   jeder Bereich nur einmal (`data-klappe-an`). Beide Dateien in `twinkey-test.html` einbinden, damit die Club-App-Übernahme sie mitnimmt.

## Nicht ändern
Datenformat, Speichern/Versand (`K.persistAll`, Build-258-Bestätigung), Texte der Fragen, Reihenfolge der Schritte,
Button-Logik (`member-button-logic.js`). Keine kostenpflichtigen Abhängigkeiten.

## Definition of Done
- Alle `details` in der Mitglieder-Eingabe nutzen den Baustein (Liste der Bereiche im CHANGELOG).
- Tests in DP2: Schloss verhindert Umklappen; Zustand nach Neuladen wieder da; „Zuklappen“ unten; Ablauf (Tage nach Wahl zu)
  funktioniert weiter und lässt festgestellte Bereiche in Ruhe; localStorage gesperrt → alles bedienbar, nur ohne Merken.
- Build-Nummer 263, CHANGELOG, RC. Danach Hansi Bescheid geben – Claude übernimmt Build 263 in die Club-App.
