// KC-CLUB-FRA-VERSCHLUESSELT (Server 2.369.0, 14.10.2026): Dateien der Frankfurt-Sicherung (datenbank/…/*.json.gz.enc) und der
// Archiv-Kopie (archiv/…/*.enc) OHNE Supabase öffnen. Schlüssel = Notfall-Kopie von Vault „kc_db_backup_key_v1“ (GitHub-Secret KC_BACKUP_KEY
// bzw. Cloudflare-Tresor kc-notfall-tresor) – gleiche Ableitung wie die Neon-Sicherung: AES-256-GCM, Schlüssel = SHA-256 des Geheimnisses.
// Dateiformat: "KCE1" (4 Byte) + IV (12 Byte) + Chiffretext mit Prüfmarke.
// Aufruf: KC_BACKUP_KEY=… node tools/notfall/fra-entschluesseln.mjs <eingabe.enc> <ausgabe>
//   *.json.gz.enc → entpacktes JSON; sonst die Originaldatei (z. B. PDF). Gibt NIE Inhalte aus, nur Größe und Zeilenzahl.
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

export async function kceEntschluesseln(bytes, geheim) {
  const b = new Uint8Array(bytes);
  if (b.length < 32 || new TextDecoder().decode(b.subarray(0, 4)) !== "KCE1") throw new Error("Datei ist nicht im Format KCE1");
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(geheim)));
  const k = await crypto.subtle.importKey("raw", h, { name: "AES-GCM" }, false, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.subarray(4, 16) }, k, b.subarray(16)));
}

export async function fraDateiOeffnen(bytes, geheim, name = "") {
  const klar = await kceEntschluesseln(bytes, geheim);
  return name.endsWith(".json.gz.enc") ? new Uint8Array(gunzipSync(klar)) : klar;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [ein, aus] = process.argv.slice(2), geheim = process.env.KC_BACKUP_KEY || "";
  if (!ein || !aus || !geheim) { console.error("Aufruf: KC_BACKUP_KEY=… node tools/notfall/fra-entschluesseln.mjs <eingabe.enc> <ausgabe>"); process.exit(2); }
  try {
    const daten = await fraDateiOeffnen(fs.readFileSync(ein), geheim, ein);
    fs.writeFileSync(aus, daten);
    let zeilen = "";
    if (ein.endsWith(".json.gz.enc")) { const j = JSON.parse(new TextDecoder().decode(daten)); zeilen = Array.isArray(j) ? `, ${j.length} Zeilen` : ""; }
    console.log(`✅ entschlüsselt: ${daten.length} Byte${zeilen} → ${aus}`);
  } catch (e) {
    console.error(`❌ nicht lesbar: ${String(e?.message || e)} (falscher Schlüssel oder beschädigte Datei – Schlüssel-Kopie mit Vault „kc_db_backup_key_v1“ vergleichen)`);
    process.exit(1);
  }
}
