# Corporate Design Köcheclub Werne (KC-CLUB-CD, ab 2.130.0)

Festgelegt von Hansi am 09.10.2026. **Alles Gedruckte sieht gleich aus.**

| Element | Festlegung |
|---|---|
| Logo | Kochmütze (`kc-kochmuetze-weiss.webp`) weiß im weinroten Kreis |
| Schriftzug | „Köcheclub Werne“ (Georgia/Serif, fett, weinrot), darunter „Gemeinsam kochen · feiern · helfen“ |
| Farben | Weinrot `#741521` (Linien, Überschriften, Logo-Kreis), Beige `#f3e9dc` (Tabellenköpfe, Kästen); Text schwarz auf Weiß |
| Kopf | Logo + Schriftzug links, Titel/Datum rechts, weinrote Linie darunter |
| Fußzeile Briefbogen | „Köcheclub Werne · Clubsprecher · <aktueller Clubsprecher>“ (aus den Ämtern; Vorgabe Klaus Zander) |
| Fußzeile sonst | „Köcheclub Werne“ + Druckvermerk (Datum, wer, App-Version) |

## Regel
- Briefbögen, Protokolle, Listen, Einladungen, To-do-Listen usw. benutzen **nur** `cdKopf()` / `cdFuss()` aus `KC_CD` (app.js) –
  über den zentralen Druckrahmen (`druckSeiteBauen`) oder, wo ein eigenes Layout nötig ist (Brief), direkt.
- Kein Ausdruck baut einen eigenen Kopf, eigene Farben oder ein anderes Logo. Ausnahmen nur für Originaldokumente,
  die als Bild gedruckt werden (PDF-Seiten, Wunschbogen).
- Der Vertragstest (`tests/app-vertrag.test.mjs`, Abschnitt KC-CLUB-CD) bricht den Build ab, wenn das verletzt wird.
