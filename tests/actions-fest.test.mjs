// KC-CLUB-ACTIONS-FEST (29.10.2026, Wunsch Hansi „Updates prüfen – bau ein“): Jeder fremde Baustein in den GitHub-Abläufen ist auf eine geprüfte
// Fassung (Commit, 40 Zeichen) festgeschrieben – ein verschobener Tag oder Zweig beim Anbieter ändert nicht heimlich, was beim Einspielen läuft.
// Neue Fassung: Commit beim Anbieter nachsehen (git ls-remote https://github.com/<besitzer>/<baustein> refs/tags/<tag>), eintragen, Tag als Kommentar.
// Aufruf: node tests/actions-fest.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const ordner = new URL("../.github/workflows/", import.meta.url);
let n = 0;
for (const f of fs.readdirSync(ordner).filter((x) => /\.ya?ml$/.test(x))) {
  for (const zeile of fs.readFileSync(new URL(f, ordner), "utf8").split("\n")) {
    const m = zeile.match(/^\s*-?\s*uses:\s*([^\s#]+)/); if (!m || m[1].startsWith("./")) continue;
    n++;
    assert.ok(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/.test(m[1]), `${f}: „${m[1]}“ ist nicht auf einen Commit festgeschrieben`);
    assert.ok(/#\s*v\d/.test(zeile), `${f}: „${m[1]}“ ohne Versions-Kommentar (z. B. # v4)`);
  }
}
assert.ok(n >= 30, "Abläufe gefunden");
console.log(`actions-fest: ok (${n} Bausteine festgeschrieben)`);
