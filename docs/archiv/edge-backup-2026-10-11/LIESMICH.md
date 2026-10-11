# Sicherung alter Test-/Einmal-Funktionen (11.10.2026)

Recovery-Punkt vor dem Abschalten (Wunsch Hansi, Freigabe 11.10.2026). Je Funktion der letzte Code (`<slug>/index.ts`),
Metadaten (Version, verify_jwt, Prüfsumme) in `_metadata.tsv`. Keine Geheimnisse im Code (geprüft).

Abgeschaltet = Inhalt ersetzt durch eine Sperre (HTTP 410, nur mit Anmeldung). Rückweg: den gesicherten `index.ts`
mit dem alten `verify_jwt`-Wert erneut als Funktion gleichen Namens einspielen.
