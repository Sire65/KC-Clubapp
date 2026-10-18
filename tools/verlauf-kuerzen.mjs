// 2.481.0 KC-CLUB-VERLAUF-KURZ (TÜV 18.10.: version.json war 172 KB und wird bei jedem Start, jeder Rückkehr und alle 10 Min. geholt):
// version.json behält nur die neuesten VERLAUF_KURZ Einträge (Update-Prüfung, „Neu seit …“); der ganze Verlauf steht in verlauf.json,
// den nur „Club-App auf einen Blick“ lädt. Nach jedem Versions-Eintrag aufrufen:  node tools/verlauf-kuerzen.mjs
// Idempotent: neue Einträge aus version.json werden vorne in verlauf.json übernommen (gleiche Version = ersetzt), ältere verschoben.
import fs from "fs";
export const VERLAUF_KURZ = 40;
const pfad = (p) => new URL("../" + p, import.meta.url);
const v = JSON.parse(fs.readFileSync(pfad("version.json"), "utf8"));
let voll = []; try { voll = JSON.parse(fs.readFileSync(pfad("verlauf.json"), "utf8")).verlauf || []; } catch {}
const neu = v.verlauf || [], schon = new Set(neu.map((e) => e.version));
voll = [...neu, ...voll.filter((e) => !schon.has(e.version))];
v.verlauf = neu.slice(0, VERLAUF_KURZ); v.verlaufVoll = "verlauf.json";
fs.writeFileSync(pfad("version.json"), JSON.stringify(v, null, 2) + "\n");
fs.writeFileSync(pfad("verlauf.json"), JSON.stringify({ hinweis: "Ganzer Verlauf der Club-App (neueste zuerst). Wird von tools/verlauf-kuerzen.mjs gepflegt.", verlauf: voll }) + "\n");
console.log(`version.json: ${v.verlauf.length} Einträge · verlauf.json: ${voll.length} Einträge`);
