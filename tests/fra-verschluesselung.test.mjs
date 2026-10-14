// KC-CLUB-FRA-VERSCHLUESSELT (Server 2.369.0): Dateien nach Frankfurt sind verschlüsselt und mit der Notfall-Kopie des Schlüssels lesbar.
// Aufruf: node tests/fra-verschluesselung.test.mjs (offline; verschlüsselt wie der Server: KCE1 + IV + AES-256-GCM, Schlüssel = SHA-256 des Geheimnisses)
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { kceEntschluesseln, fraDateiOeffnen } from "../tools/notfall/fra-entschluesseln.mjs";

async function wieServer(b, geheim) {
  const k = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(geheim)), { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, b));
  const aus = new Uint8Array(16 + ct.length); aus.set(new TextEncoder().encode("KCE1")); aus.set(iv, 4); aus.set(ct, 16); return aus;
}
const zeilen = [{ id: 1, name: "Test" }, { id: 2, name: "Zwei" }];
const enc = await wieServer(new Uint8Array(gzipSync(Buffer.from(JSON.stringify(zeilen)))), "GEHEIM");

// 1) mit dem richtigen Schlüssel: gleiche Zeilen zurück
assert.deepEqual(JSON.parse(new TextDecoder().decode(await fraDateiOeffnen(enc, "GEHEIM", "x.json.gz.enc"))), zeilen);
// 2) kein Klartext in der Datei
assert.ok(!Buffer.from(enc).includes(Buffer.from("Test")) && !Buffer.from(enc).subarray(0, 4).equals(Buffer.from([0x1f, 0x8b, 8, 0]).subarray(0, 4)), "Datei enthält Klartext/gzip");
// 3) falscher Schlüssel → abgelehnt (AES-GCM prüft die Echtheit)
await assert.rejects(() => kceEntschluesseln(enc, "FALSCH"));
// 4) verändertes Byte → abgelehnt
const kaputt = enc.slice(); kaputt[kaputt.length - 1] ^= 1;
await assert.rejects(() => kceEntschluesseln(kaputt, "GEHEIM"));
// 5) alte Klartext-Datei (gzip) wird nicht als verschlüsselt angenommen
await assert.rejects(() => kceEntschluesseln(gzipSync(Buffer.from("[]")), "GEHEIM"), /KCE1/);
// 6) Archiv-Datei (ohne gzip) kommt unverändert zurück
const pdf = new TextEncoder().encode("%PDF-1.7 test");
assert.deepEqual(await fraDateiOeffnen(await wieServer(pdf, "GEHEIM"), "GEHEIM", "archiv/a/b.enc"), pdf);
console.log("fra-verschluesselung: 6 Prüfungen ok");
