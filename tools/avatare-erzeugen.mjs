// KC-CLUB-AVATAR-DATEIEN (2.414.0): schreibt jede hochwertige Figur als eigenständige SVG-Datei – aus derselben Zeichnung wie die App.
// Aufruf: node tools/avatare-erzeugen.mjs  → avatare/premium/<id>.svg + avatare/premium/index.json
// Jede Datei besteht aus einzelnen Bausteinen (Haare, Gesicht, Brille, Schmuck …) und kann frei weiterverwendet werden.
import fs from "node:fs";
import { avatarLaden } from "./avatar-lader.mjs";
export function premiumDateien(A = avatarLaden()) {
  return A.lese("AV_PREMIUM").map((p) => ({ ...p, datei: `${p.id}.svg`,
    svg: A.svg(p.code, 256).replace('<svg viewBox="0 0 64 64"', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"').replace(' role="img" aria-hidden="true">', ` role="img" aria-label="${p.name}"><title>${p.name} – KC-Club-Avatar ${p.id} (${p.code})</title>`) + "\n" }));
}
if (process.argv[1]?.endsWith("avatare-erzeugen.mjs")) {
  const ziel = new URL("../avatare/premium/", import.meta.url); fs.mkdirSync(ziel, { recursive: true });
  const d = premiumDateien();
  for (const x of d) fs.writeFileSync(new URL(x.datei, ziel), x.svg);
  fs.writeFileSync(new URL("index.json", ziel), JSON.stringify({ hinweis: "Erzeugt mit tools/avatare-erzeugen.mjs – nicht von Hand ändern. code = gespeicherter Bild-Code (im Baukasten anpassbar).", figuren: d.map(({ id, name, code, frau, datei }) => ({ id, name, code, art: frau ? "köchin" : "koch", datei })) }, null, 1) + "\n");
  console.log(d.length, "Figuren geschrieben");
}
