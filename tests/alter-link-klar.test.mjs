// KC-CLUB-ALTER-LINK-KLAR (2.939.0, Wunsch Hansi 13.11.2026, Fall Marianne): ersetzter Link + neuerer gültiger Link →
// kurze, klare Anleitung (altes Symbol löschen, neuen Link aus WhatsApp nehmen). Der Server meldet nur ja/nein, nie den Link.
// Aufruf: node tests/alter-link-klar.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const hilfe = server.slice(server.indexOf("async function zugangHilfeInfo"), server.indexOf("async function neuenLinkMailen"));
assert.ok(/from\("kc_club_zugang"\)\.select\("aktiv,erstellt_am"\)/.test(hilfe), "prüft den aktuellen Zugang");
assert.ok(/return \{ art, vorname: vorname\(pe as Person\), seit, neuerLink,/.test(hilfe), "neuerLink in der Antwort");
assert.ok(!/token_hash[^)]*\)\s*;?\s*\n[^\n]*neuerLink/.test(hilfe) && !/neuerLink:\s*z\?\.token/.test(hilfe), "nie der Link selbst");
const zeigen = app.slice(app.indexOf("function zugangHilfeZeigen(h)"), app.indexOf("async function zugangHilfe(weg, knopf)"));
assert.ok(zeigen.indexOf('h.art === "alt" && h.neuerLink') > -1 && zeigen.indexOf('h.art === "alt" && h.neuerLink') < zeigen.indexOf('h.art === "alt" || h.art === "pausiert"'), "neuer Zweig vor dem alten");
for (const t of ["Dieses Köcheclub-Symbol ist veraltet", "löschen", "lange drücken", "Du hast schon einen neuen Link bekommen – per WhatsApp von Hansi", "Hansi Bescheid geben", "6-stelligen Code"])
  assert.ok(zeigen.includes(t), `Text fehlt: ${t}`);
// Die Anleitung erscheint wirklich: DOM-Probe mit kleinem Ersatz-Dokument
const el = { innerHTML: "", style: {} };
const fn = new Function("$", "esc", "zhStartSymbol", "TZ", "ZH", zeigen + "; return zugangHilfeZeigen;")((id) => (id === "linkUngueltig" ? el : null), (x) => String(x), () => true, "Europe/Berlin", null);
fn({ art: "alt", neuerLink: true, vorname: "Testperson", seit: "2026-10-09T20:30:00Z", mail: "t***@example.org" });
assert.ok(el.innerHTML.includes("Hallo Testperson!") && el.innerHTML.includes("per WhatsApp von Hansi") && el.innerHTML.includes("t***@example.org"));
fn({ art: "alt", neuerLink: false, vorname: "Testperson", seit: "2026-10-09T20:30:00Z" });
assert.ok(!el.innerHTML.includes("per WhatsApp von Hansi") && el.innerHTML.includes("gilt seit dem"), "ohne neueren Link: bisherige Erklärung");
console.log("alter-link-klar: ok");
