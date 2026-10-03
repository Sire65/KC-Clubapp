// KC-CLUB-KUECHENTERROR (2.14.0): kopiert die Fragen (eine Quelle: lib/kuechenterror/fragen.js) wörtlich in den Server-Ordner,
// damit der Server die richtigen Antworten kennt und prüft. Aufruf: node tools/kuechenterror/server-kopie.mjs
import fs from "node:fs";
fs.copyFileSync(new URL("../../lib/kuechenterror/fragen.js", import.meta.url), new URL("../../supabase/functions/kc-club/kt-fragen.js", import.meta.url));
console.log("kt-fragen.js kopiert");
