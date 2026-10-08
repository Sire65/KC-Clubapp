// KC-CLUB-SCHACH-ELFENBEIN (2.123.0, Wunsch Hansi nach Bild): klassische Cburnett-Figuren (lib/schach, BSD) in Elfenbein/Tiefschwarz
// mit sanftem Verlauf – erzeugt lib/schach/elfenbein/*.svg. Formen unverändert, nur Füllfarben. Aufruf: node tools/schach/elfenbein.mjs
import fs from "node:fs";
const quelle = new URL("../../lib/schach/", import.meta.url), ziel = new URL("../../lib/schach/elfenbein/", import.meta.url);
fs.mkdirSync(ziel, { recursive: true });
const DEFS = {
  w: '<defs><linearGradient id="kcw" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="0.55" stop-color="#f3ecd8"/><stop offset="1" stop-color="#ddd1ae"/></linearGradient></defs>',
  b: '<defs><linearGradient id="kcb" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="#5b5b5b"/><stop offset="0.45" stop-color="#262626"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient></defs>',
};
for (const c of ["w", "b"]) for (const t of ["k", "q", "r", "b", "n", "p"]) {
  let s = fs.readFileSync(new URL(`${c}${t}.svg`, quelle), "utf8");
  s = s.replace(/(<svg[^>]*>)/, `$1\n  ${DEFS[c]}`);
  if (c === "w") s = s.replace(/fill:\s*#ffffff/gi, "fill:url(#kcw)").replace(/fill="#fff(fff)?"/gi, 'fill="url(#kcw)"').replace(/stroke:\s*#000000/gi, "stroke:#2a2620");
  else s = s.replace(/fill:\s*#000000/gi, "fill:url(#kcb)").replace(/fill="#000(000)?"/gi, 'fill="url(#kcb)"').replace(/(fill|stroke):\s*#ffffff/gi, "$1:#d9d9d9");
  fs.writeFileSync(new URL(`${c}${t}.svg`, ziel), s);
}
console.log("12 Figuren nach lib/schach/elfenbein geschrieben");
