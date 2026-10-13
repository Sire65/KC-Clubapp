// KC-CORE-NOTFALL-ZWEITKOPIE (13.10.2026, Sicherheits-Abgleich, Wunsch Hansi „Lücken schließen, aber nicht zu kompliziert“):
// Wer das Datenbank-Passwort von Neon hätte, könnte die Lösch-Sperre der Tagessicherungen dort abschalten. Darum liegt wöchentlich
// eine ZWEITE Kopie der neuesten verschlüsselten Sicherung bei Cloudflare (KV-Speicher „kc-notfall-zweitkopie“, kostenlos) –
// dort kommt man mit dem Neon-Passwort nicht hin. Die Daten bleiben verschlüsselt (gleiche Payloads wie auf Neon).
//   MODUS=packen  : neueste Sicherung von Neon lesen → gzip-Datei ZIEL (Standard /tmp/zweitkopie.json.gz) + Prüfsumme ausgeben
//   MODUS=pruefen : Datei DATEI lesen, eine zufällige Tabelle mit KC_BACKUP_KEY entschlüsseln, Zeilenzahl vergleichen
// Gibt NIE Inhalte aus (öffentliches Repository).
import { gzipSync, gunzipSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { entschluesseln } from "./sicherung-lesen.mjs";

const MODUS = (process.env.MODUS || "").trim();
const sha = (b) => createHash("sha256").update(b).digest("hex");

export function packen(satz, zeilen) {
  const inhalt = { art: "kc-sicherung-zweitkopie", version: 1, backup_set: satz.backup_set, taken_at: satz.am, tabellen: zeilen.map((z) => ({ table_name: z.table_name, row_count: Number(z.row_count), content_hash: z.content_hash, privacy_redacted: !!z.privacy_redacted, payload: z.payload })) };
  return gzipSync(Buffer.from(JSON.stringify(inhalt)), { level: 9 });
}
export function auspacken(buf) {
  const j = JSON.parse(gunzipSync(buf).toString("utf8"));
  if (j.art !== "kc-sicherung-zweitkopie" || !Array.isArray(j.tabellen)) throw new Error("Keine Zweitkopie");
  return j;
}
export async function probe(j, geheim, tabelle = "") {
  const t = tabelle ? j.tabellen.find((x) => x.table_name === tabelle) : j.tabellen[Math.floor(Math.random() * j.tabellen.length)];
  if (!t) throw new Error("Tabelle nicht in der Zweitkopie");
  const text = await entschluesseln(t.payload, geheim);
  const n = JSON.parse(text).length;
  return { tabelle: t.table_name, ok: n === t.row_count, n, soll: t.row_count };
}

async function main() {
  if (MODUS === "packen") {
    const { default: postgres } = await import("postgres");
    const url = process.env.KC_NEON_URL || "";
    if (!url) throw new Error("KC_NEON_URL fehlt");
    const sql = postgres(url, { max: 1, prepare: false, ssl: /sslmode=disable/.test(url) ? false : "require", connect_timeout: 30, onnotice: () => {} });
    try {
      const [satz] = await sql`select backup_set, max(taken_at) as am, count(*)::int as tabellen from kc_backup_snapshots group by backup_set having count(*) > 10 order by max(taken_at) desc limit 1`;
      if (!satz) throw new Error("Keine Sicherung auf Neon gefunden");
      const zeilen = await sql`select table_name, row_count, content_hash, privacy_redacted, payload from kc_backup_snapshots where backup_set = ${satz.backup_set} order by table_name`;
      const gz = packen({ backup_set: satz.backup_set, am: satz.am.toISOString() }, zeilen);
      writeFileSync(process.env.ZIEL || "/tmp/zweitkopie.json.gz", gz);
      console.log(`Gepackt: Sicherung ${satz.am.toISOString().slice(0, 16).replace("T", " ")} UTC · ${zeilen.length} Tabellen · ${(gz.length / 1048576).toFixed(1)} MB · SHA-256 ${sha(gz).slice(0, 16)}…`);
      if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `sha=${sha(gz)}\ndatum=${satz.am.toISOString().slice(0, 10)}\n`, { flag: "a" });
    } finally { await sql.end({ timeout: 5 }); }
    return 0;
  }
  if (MODUS === "pruefen") {
    const buf = readFileSync(process.env.DATEI || "/tmp/zweitkopie-zurueck.json.gz");
    if (process.env.SOLL_SHA && sha(buf) !== process.env.SOLL_SHA) { console.log("❌ Zurückgelesene Kopie weicht ab (Prüfsumme)"); return 1; }
    const j = auspacken(buf), r = await probe(j, process.env.KC_BACKUP_KEY || "");
    console.log(`${r.ok ? "✅" : "❌"} Zweitkopie lesbar: ${j.tabellen.length} Tabellen, Probe ${r.tabelle} entschlüsselt (${r.n}/${r.soll} Zeilen)`);
    return r.ok ? 0 : 1;
  }
  throw new Error("MODUS packen | pruefen");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((c) => process.exit(c)).catch((e) => { console.error("❌ " + (e?.name === "OperationError" ? "Entschlüsselung abgelehnt (Schlüssel passt nicht)" : String(e?.message || e).slice(0, 160))); process.exit(1); });
}
