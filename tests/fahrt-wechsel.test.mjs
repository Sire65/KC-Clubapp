// KC-CLUB-FAHRT-WECHSEL (Fund Hansi 27.11.2026): Fahrrad → Auto → Fahrrad → Auto … muss jedes Mal sichtbar wechseln.
// Aufruf: node tests/fahrt-wechsel.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const t = fs.readFileSync(new URL("../teile/fahrten.js", import.meta.url), "utf8");
const code = t.slice(t.indexOf("function fsArtZeigen("), t.indexOf("async function fsProfilSpeichern("));
function knopf() { const k = new Set(), a = {}; return { classList: { toggle: (n, an) => (an ? k.add(n) : k.delete(n)), has: (n) => k.has(n) }, setAttribute: (n, v) => { a[n] = v; }, a }; }
function lauf(gespeichert) {
  const knoepfe = [knopf(), knopf()], zeile = knopf(); zeile.classList.toggle("versteckt", gespeichert !== "auto");
  const gesp = [];
  const env = { FSS: { profil: { art: gespeichert } }, $: (id) => (id === "fsKmZeile" ? zeile : id === "fsKm" ? { focus() {} } : null),
    document: { querySelectorAll: () => knoepfe }, fsProfilSpeichern: (art) => gesp.push(art) };
  const f = new Function(...Object.keys(env), code + "; return fsArt;")(...Object.values(env));
  const gewaehlt = () => (knoepfe[1].classList.has("an") ? "auto" : knoepfe[0].classList.has("an") ? "keine" : "?");
  return { f, gewaehlt, zeile, gesp, knoepfe };
}
// gespeichert: Fahrrad – hin und her, nichts gespeichert (Auto erst mit km und 💾)
{
  const x = lauf("keine");
  for (const art of ["auto", "keine", "auto", "keine", "auto"]) {
    x.f(art);
    assert.equal(x.gewaehlt(), art, "Anzeige wechselt auf " + art);
    assert.equal(x.zeile.classList.has("versteckt"), art !== "auto", "km-Zeile nur bei Auto");
    assert.equal(x.knoepfe[art === "auto" ? 1 : 0].a["aria-checked"], "true");
  }
  assert.deepEqual(x.gesp, [], "nichts gespeichert, solange Fahrrad gespeichert ist");
}
// gespeichert: Auto – Tipp auf Fahrrad speichert „keine“ und zeigt Fahrrad
{
  const x = lauf("auto");
  x.f("keine"); assert.equal(x.gewaehlt(), "keine"); assert.deepEqual(x.gesp, ["keine"]);
}
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/fahrt-wechsel.test.mjs"), "läuft in der CI");
console.log("fahrt-wechsel: ok");
