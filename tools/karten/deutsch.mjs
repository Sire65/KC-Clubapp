import fs from "fs";
const NEU = { B: "M-250-460V460h300a245 245 0 0 0 0-490h-300m280 0a215 215 0 0 0 0-430h-280", D: "M-250-460V460h150a350 460 0 0 0 0-920z" };
for (const f of ["kr", "pi", "he", "ka"]) for (const w of ["B", "D"]) {
  const datei = `out/${f}-${w}.svg`; let s = fs.readFileSync(datei, "utf8");
  // das Eckzeichen ist das Symbol mit viewBox -500…500 und einer Linie der Stärke 80
  const re = /(<symbol id="[^"]+" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMinYMid"><path d=")([^"]+)(" stroke="#000" stroke-width="80")/;
  const re2 = /(<symbol id="[^"]+" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMinYMid"><path d=")([^"]+)(" stroke="red" stroke-width="80")/;
  const n = s.match(re) || s.match(re2); if (!n) throw new Error("kein Eckzeichen in " + datei);
  s = s.replace(n[0], n[1] + NEU[w] + n[3]); fs.writeFileSync(datei, s);
}
console.log("ok");
// Pik-Ass: Werbe-QR-Code und Schrift der Quelle entfernen (sonst wie ein normales Pik-Ass)
{ const d = "out/pi-A.svg"; let s = fs.readFileSync(d, "utf8"); const vor = s.length;
  s = s.replace(/<path fill="#fff" d="m0-34\.098[^"]*"\/>/, "").replace(/<text[^>]*>.*?<\/text>/g, "");
  if (s.length === vor || /<text/.test(s)) throw new Error("Pik-Ass nicht bereinigt"); fs.writeFileSync(d, s); console.log("Pik-Ass bereinigt"); }
