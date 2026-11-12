// KC-CLUB-DIENSTWUNSCH: Twinkey (Mitglieder-Wunschführung aus KC DP2) 1:1 in die Club-App übernehmen.
// Kopiert GENAU die Dateien, die DP2s eigenständige Twinkey-Seite (twinkey-test.html) lädt – ohne deren Beispieldaten
// (twinkey-test-data.js) und Start (twinkey-test-boot.js) – plus die benutzten Bilder/Sprachdateien nach dp2/ und schreibt
// dp2/QUELLE.json (Repository, Commit, DP2-Version, SHA-256 je Datei). Der Vertragstest prüft, dass nichts verändert wurde.
// Aufruf: node tools/dp2-twinkey-uebernehmen.mjs /pfad/zu/dp3
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const QUELLE = process.argv[2];
if (!QUELLE || !existsSync(join(QUELLE, "twinkey-test.html"))) { console.error("Bitte Pfad zum DP2-Repository (dp3) angeben."); process.exit(1); }
const ZIEL = fileURLToPath(new URL("../dp2/", import.meta.url));
const seite = readFileSync(join(QUELLE, "twinkey-test.html"), "utf8");
const ausSeite = [...seite.matchAll(/(?:href|src)="(src\/[a-z0-9/_.-]+\.(?:css|js))(?:\?[^"]*)?"/g)].map((m) => m[1]);
const weg = new Set(["src/ui/twinkey-test-data.js", "src/ui/twinkey-test-boot.js"]);
const code = [...new Set(ausSeite)].filter((f) => !weg.has(f));
// Bilder/Töne, auf die der übernommene Code verweist
const assets = new Set();
for (const f of code) for (const m of readFileSync(join(QUELLE, f), "utf8").matchAll(/assets\/[A-Za-z0-9_.-]+\.(?:png|svg|webp)/g)) assets.add(m[0]);
for (const a of readdirSync(join(QUELLE, "assets/twinkey/audio"))) assets.add("assets/twinkey/audio/" + a);
const alle = [...code, ...[...assets].sort()];

const git = (...args) => execFileSync("git", ["-C", QUELLE, ...args], { encoding: "utf8" }).trim();
const commit = git("rev-parse", "HEAD");
const commitDatum = git("log", "-1", "--format=%cI");

rmSync(ZIEL, { recursive: true, force: true });
const dateien = {};
for (const f of alle) {
  mkdirSync(dirname(join(ZIEL, f)), { recursive: true });
  if (/\.(?:js|css)$/.test(f)) {
    writeFileSync(join(ZIEL, f), readFileSync(join(QUELLE, f), "utf8").replace(/\r\n/g, "\n"));
  } else {
    copyFileSync(join(QUELLE, f), join(ZIEL, f));
  }
  dateien[f] = createHash("sha256").update(readFileSync(join(ZIEL, f))).digest("hex");
}
const version = JSON.parse(readFileSync(join(QUELLE, "package.json"), "utf8")).version;
writeFileSync(join(ZIEL, "QUELLE.json"), JSON.stringify({
  hinweis: "Unverändert aus KC DP2 übernommen – NICHT hier bearbeiten. Änderungen in DP2 machen und neu übernehmen (tools/dp2-twinkey-uebernehmen.mjs).",
  repository: "Sire65/dp3", commit, commitDatum, dp2Version: version,
  vorlage: "twinkey-test.html (ohne twinkey-test-data.js, twinkey-test-boot.js)",
  reihenfolge: code, dateien,
}, null, 2) + "\n");
console.log(`${alle.length} Dateien übernommen (DP2 ${version}, ${code.length} Code/Stil, ${assets.size} Bilder/Töne).`);
