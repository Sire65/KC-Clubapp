// KC-CLUB-CLOUDFLARE-UMZUG (Vorbereitung, 07.10.2026, Wunsch Hansi): baut das Veröffentlichungs-Paket für Cloudflare Pages.
// NUR BAUEN – veröffentlicht nichts. Ins Paket kommt nur, was die App im Browser braucht; Server-Code (supabase/), Tests, Werkzeuge,
// Dokumentation und Notbetrieb-Quellen bleiben draußen (sie wären nach dem Umzug in einem PRIVATEN Repository).
// Aufruf: node tools/cloudflare/paket-bauen.mjs [Zielordner, Standard: dist-cloudflare]
import fs from "node:fs"; import path from "node:path"; import { createHash } from "node:crypto";
const wurzel = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../.."), ziel = path.resolve(wurzel, process.argv[2] || "dist-cloudflare");
// Positivliste (Registry): neue öffentliche Datei/Ordner = hier eintragen. Alles andere bleibt privat.
const OEFFENTLICH = ["index.html", "app.js", "sw.js", "version.json", "manifest.webmanifest", "termin.html", "dienstwunsch.html", "notbetrieb.json",
  "icon-192.png", "icon-512.png", "kc-kochmuetze-weiss.webp", "entwickler-hans-joachim-koch.webp", "lib", "dp2", "dp2-club", "dokumente"];
const NIE = [/^supabase\//, /^tests\//, /^tools\//, /^docs\//, /^google\//, /^notbetrieb\//, /\.md$/i, /\.sql$/i, /(^|\/)\./];
fs.rmSync(ziel, { recursive: true, force: true }); fs.mkdirSync(ziel, { recursive: true });
const liste = [];
function kopiere(rel) {
  const q = path.join(wurzel, rel); if (!fs.existsSync(q)) throw new Error("fehlt: " + rel);
  if (fs.statSync(q).isDirectory()) { for (const n of fs.readdirSync(q)) kopiere(path.join(rel, n)); return; }
  if (NIE.some((r) => r.test(rel))) return;
  fs.mkdirSync(path.dirname(path.join(ziel, rel)), { recursive: true }); fs.copyFileSync(q, path.join(ziel, rel));
  liste.push([rel, fs.statSync(q).size, createHash("sha256").update(fs.readFileSync(q)).digest("hex").slice(0, 16)]);
}
OEFFENTLICH.forEach(kopiere);
// Cloudflare-Kopfzeilen: Service Worker, Version und Seite nie lange zwischenspeichern (atomares Update, AGENTS Regel 16), Sicherheits-Kopfzeilen
fs.writeFileSync(path.join(ziel, "_headers"), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: interest-cohort=()
/sw.js
  Cache-Control: no-cache
/version.json
  Cache-Control: no-store
/notbetrieb.json
  Cache-Control: no-store
/index.html
  Cache-Control: no-cache
/
  Cache-Control: no-cache
`);
const v = JSON.parse(fs.readFileSync(path.join(wurzel, "version.json"), "utf8")).version;
fs.writeFileSync(path.join(ziel, "PAKET.txt"), `Köcheclub-App ${v} – Paket für Cloudflare Pages (nur gebaut, nicht veröffentlicht)\n${liste.length} Dateien\n\n${liste.map((x) => x.join("  ")).join("\n")}\n`);
const mb = liste.reduce((s, x) => s + x[1], 0) / 1048576;
console.log(`OK – Paket ${v}: ${liste.length} Dateien, ${mb.toFixed(1)} MB → ${path.relative(wurzel, ziel)}`);
