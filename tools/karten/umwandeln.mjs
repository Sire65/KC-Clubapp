import fs from "fs";
const ATTR_BEHALTEN = new Set(["viewBox", "preserveAspectRatio", "patternUnits", "gradientUnits", "gradientTransform", "patternTransform", "clipPathUnits"]);
const attr = (k) => k === "xmlnsXlink" ? "xmlns:xlink" : k === "className" ? "class" : k === "xlinkHref" ? "xlink:href" : k === "xmlSpace" ? "xml:space" : ATTR_BEHALTEN.has(k) ? k : k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
globalThis.FakeReact = { createElement(tag, props, ...kids) {
  if (typeof tag === "function") return tag({ ...(props || {}), children: kids });
  const p = Object.entries(props || {}).filter(([k, v]) => v != null && v !== false && !["children", "title", "titleId", "aria-labelledby"].includes(k)).map(([k, v]) => ` ${attr(k)}="${esc(v)}"`).join("");
  const inner = kids.flat(9).filter((x) => x != null && x !== false).join("");
  return `<${tag}${p}${inner ? `>${inner}</${tag}>` : "/>"}`;
} };
const deck = await import("./karten.mjs");
fs.mkdirSync("out", { recursive: true });
const F = { C: "kr", S: "pi", H: "he", D: "ka" }, W = { A: "A", "10": "10", K: "K", Q: "D", J: "B", "9": "9", "8": "8", "7": "7" };
const exportName = (f, w) => f + (w.length === 1 && isNaN(+w) ? w.toLowerCase() : w);
let summe = 0;
for (const f of "CSHD") for (const w of ["A", "10", "K", "Q", "J", "9", "8", "7"]) {
  const svg = deck[exportName(f, w)]({}); if (!svg.startsWith("<svg")) throw new Error(f + w);
  const datei = `${F[f]}-${W[w]}.svg`; fs.writeFileSync("out/" + datei, svg); summe += svg.length;
}
fs.writeFileSync("out/rueck.svg", deck.B2({}));
console.log("32 Karten, Bytes gesamt:", summe);
