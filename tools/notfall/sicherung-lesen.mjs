// KC-CORE-NOTFALL-LESEN (13.10.2026, Wunsch Hansi „wenn Supabase ausfällt: wie holen wir wichtige Daten zurück und können sie lesen –
// sie sind ja verschlüsselt? Und ein Wächter soll manchmal eine einzelne Tabelle zurücklesen und prüfen, ob sie lesbar ist“).
// Läuft OHNE Supabase: liest die verschlüsselten Tagessicherungen direkt auf Neon (kc_backup_snapshots) mit dem Sicherungsschlüssel aus
// einem Versteck AUSSERHALB von Supabase (GitHub-Secret KC_BACKUP_KEY = Kopie von Vault „kc_db_backup_key_v1“) – gleiche Entschlüsselung
// wie kc-db-backup-verify-v2: AES-GCM, Schlüssel = SHA-256 des Geheimnisses, payload {iv, ciphertext} in Base64.
//   modus=probe            : eine Tabelle (zufällig oder gewählt) aus der neuesten Sicherung entschlüsseln, Zeilenzahl + Prüfsumme prüfen.
//                            Ändert NICHTS (auch nicht kc_backup_verifications – der System Check liest dort nur den neuesten Eintrag und soll
//                            weiter die vollständige Tagesprüfung sehen). Ergebnis nur im GitHub-Lauf; Rot → GitHub schickt eine Fehlermail.
//   modus=wiederherstellen : gewählte (oder alle) Tabellen entschlüsselt in ein eigenes Schema notfall_JJJJMMTT auf Neon schreiben
//                            (je Tabelle eine Spalte „zeile“ jsonb – verlustfrei). public.* wird NIE verändert. Nur mit bestaetigen=JA.
// Gibt NIE Inhalte aus (öffentliches Repository → Protokolle sind öffentlich): nur Tabellennamen, Zahlen, ok/Fehler.
import postgres from "postgres";

const URL_NEON = process.env.KC_NEON_URL || "", GEHEIM = process.env.KC_BACKUP_KEY || "";
const MODUS = (process.env.MODUS || "probe").trim(), TABELLE = (process.env.TABELLE || "").trim(), BESTAETIGT = (process.env.BESTAETIGEN || "").trim() === "JA";
const zeile = []; const merke = (t) => { zeile.push(t); console.log(t); };

export const b64 = (s) => Uint8Array.from(Buffer.from(String(s), "base64"));
export async function entschluesseln(payload, geheim) {
  const p = typeof payload === "string" ? JSON.parse(payload) : payload;
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(geheim));
  const k = await crypto.subtle.importKey("raw", h, { name: "AES-GCM" }, false, ["decrypt"]);
  const klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(p.iv) }, k, b64(p.ciphertext));
  return new TextDecoder().decode(klar);
}

async function pruefsumme(sql, tabelle, text) { // gleiche Rechnung wie kc-db-backup-verify-v2 (in der Datenbank, mit dem Tabellentyp des Spiegels)
  const stabil = tabelle === "kc_dp_entity_versions" || tabelle === "kc_communication_templates";
  const basis = `jsonb_populate_recordset(null::public."${tabelle}",($1::text)::jsonb)`;
  const q = stabil
    ? `select count(*)::bigint n,md5(coalesce(string_agg(md5(to_jsonb(x)::text),'' order by md5(to_jsonb(x)::text) collate "C"),'')) h from ${basis} x`
    : `select count(*)::bigint n,md5(coalesce(string_agg(row_to_json(x)::text,'' order by row_to_json(x)::text),'')) h from ${basis} x`;
  const v = await sql.unsafe(q, [text]); return { n: Number(v[0]?.n || 0), h: String(v[0]?.h || "") };
}

async function main() {
  if (!URL_NEON || !GEHEIM) { merke("⚪ Noch nicht eingerichtet: GitHub-Secrets KC_NEON_URL und/oder KC_BACKUP_KEY fehlen – nichts geprüft (Anleitung: docs/NOTFALL_DATEN_ZURUECKHOLEN.md)."); return 0; }
  if (TABELLE && !/^[a-z0-9_]+$/.test(TABELLE)) throw new Error("Ungültiger Tabellenname");
  const sql = postgres(URL_NEON, { max: 1, prepare: false, ssl: /sslmode=disable/.test(URL_NEON) ? false : "require", connect_timeout: 30, onnotice: () => {} }); // Neon immer verschlüsselt (nur der lokale Test schaltet es ab)
  try {
    const [satz] = await sql`select s.backup_set, max(s.taken_at) as am, count(*)::int as tabellen from kc_backup_snapshots s
      group by s.backup_set having count(*) > 10 order by max(s.taken_at) desc limit 1`;
    if (!satz) throw new Error("Keine Sicherung auf Neon gefunden");
    merke(`Neueste Sicherung: ${satz.am.toISOString().slice(0, 16).replace("T", " ")} UTC · ${satz.tabellen} Tabellen`);
    if (MODUS === "probe") {
      const [s] = TABELLE
        ? await sql`select table_name, row_count, content_hash, payload, privacy_redacted from kc_backup_snapshots where backup_set = ${satz.backup_set} and table_name = ${TABELLE} limit 1`
        : await sql`select table_name, row_count, content_hash, payload, privacy_redacted from kc_backup_snapshots where backup_set = ${satz.backup_set} order by random() limit 1`;
      if (!s) throw new Error(`Tabelle ${TABELLE} nicht in der Sicherung`);
      let text;
      try { text = await entschluesseln(s.payload, GEHEIM); } // AES-GCM prüft die Echtheit: falscher Schlüssel oder veränderte Daten → Fehler
      catch {
        merke(`❌ ${s.table_name}: Entschlüsselung abgelehnt – der Schlüssel in KC_BACKUP_KEY passt nicht (oder die Sicherung ist beschädigt). Schlüssel-Kopie mit Supabase-Vault „kc_db_backup_key_v1“ vergleichen.`);
        return 1;
      }
      const arr = JSON.parse(text), zeilenOk = Array.isArray(arr) && arr.length === Number(s.row_count);
      let summeOk = null;
      try { const v = await pruefsumme(sql, s.table_name, text); summeOk = v.n === Number(s.row_count) && v.h === String(s.content_hash || ""); } catch { summeOk = null; } // Tabellentyp fehlt im Spiegel → nur Zeilenzahl
      const ok = zeilenOk && summeOk !== false;
      merke(`${ok ? "✅" : "❌"} ${s.table_name}: entschlüsselt, ${arr.length}/${s.row_count} Zeilen${summeOk === null ? " (Prüfsumme hier nicht vergleichbar)" : summeOk ? ", Prüfsumme gleich" : ", PRÜFSUMME ABWEICHEND"}`);
      return ok ? 0 : 1;
    }
    if (MODUS === "wiederherstellen") {
      if (!BESTAETIGT) throw new Error("Wiederherstellen nur mit bestaetigen = JA");
      const schema = "notfall_" + new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const liste = TABELLE ? [TABELLE] : (await sql`select table_name from kc_backup_snapshots where backup_set = ${satz.backup_set} order by table_name`).map((x) => x.table_name);
      await sql.unsafe(`create schema if not exists ${schema}`);
      let gut = 0, schlecht = 0;
      for (const t of liste) {
        try {
          const [s] = await sql`select row_count, payload from kc_backup_snapshots where backup_set = ${satz.backup_set} and table_name = ${t} limit 1`;
          const text = await entschluesseln(s.payload, GEHEIM);
          await sql.unsafe(`drop table if exists ${schema}."${t}"`);
          await sql.unsafe(`create table ${schema}."${t}" (zeile jsonb not null)`);
          await sql.unsafe(`insert into ${schema}."${t}"(zeile) select x from jsonb_array_elements(($1::text)::jsonb) x`, [text]);
          const [{ n }] = await sql.unsafe(`select count(*)::int n from ${schema}."${t}"`);
          if (n === Number(s.row_count)) gut++; else { schlecht++; merke(`❌ ${t}: ${n}/${s.row_count} Zeilen`); }
        } catch (e) { schlecht++; merke(`❌ ${t}: ${e?.code ? "Datenbankfehler " + e.code : e?.name === "OperationError" ? "Entschlüsselung abgelehnt (Schlüssel passt nicht)" : "Fehler " + (e?.name || "unbekannt")}`); } // keine Fehlertexte: die könnten Datenausschnitte enthalten
      }
      merke(`${schlecht ? "⚠️" : "✅"} Wiederhergestellt in Neon, Schema ${schema}: ${gut} Tabellen in Ordnung, ${schlecht} mit Fehler. Lesen in der Neon-Konsole → SQL Editor, z. B.: select zeile from ${schema}."kc_club_treffen";`);
      return schlecht ? 1 : 0;
    }
    throw new Error("Unbekannter Modus (probe | wiederherstellen)");
  } finally { await sql.end({ timeout: 5 }); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((c) => { if (process.env.GITHUB_STEP_SUMMARY) import("node:fs").then((fs) => { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, zeile.map((z) => `- ${z}`).join("\n") + "\n"); process.exit(c); }); else process.exit(c); })
    .catch((e) => { console.error("❌ " + String(e.message || e).slice(0, 200)); process.exit(1); });
}
