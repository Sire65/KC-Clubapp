// KC-CLUB-TEILE (2.726.0): das ganze Programm für die Prüfungen – app.js plus alle nachladbaren Teile (teile/*.js, alphabetisch).
// So finden die Tests eine Stelle, egal ob sie im Hauptprogramm oder in einem Teil steht.
import fs from "node:fs";

export function programmText() {
  const u = (p) => new URL("../" + p, import.meta.url);
  const teile = fs.existsSync(u("teile")) ? fs.readdirSync(u("teile")).filter((f) => f.endsWith(".js")).sort() : [];
  return [fs.readFileSync(u("app.js"), "utf8"), ...teile.map((f) => fs.readFileSync(u("teile/" + f), "utf8"))].join("\n");
}
