// KC-CLUB-DB-EINSPIELEN: wird NUR während des GitHub-Ablaufs „Datenbank einspielen“ befüllt und danach wieder geleert.
// Im Repository bleibt diese Datei immer leer (Test prüft das) – ohne Auftrag antwortet die Funktion mit 410.
export const AUFTRAG: { name: string; migration: string; test: string; erwartet: string[]; nachpruefung: string } | null = null;
