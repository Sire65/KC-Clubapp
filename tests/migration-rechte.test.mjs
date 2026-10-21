// KC-SUPABASE-GRANTS (21.10.2026): ab 30.10.2026 bekommen neue Tabellen in „public“ keine Rechte mehr von selbst.
// Jede Migration ab 21.10.2026, die eine Tabelle in public anlegt, muss sie dem Club-Server (service_role) ausdrücklich freigeben.
// Aufruf: node tests/migration-rechte.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const ordner = new URL("../supabase/migrations/", import.meta.url);
const ab = "20261021";
let geprueft = 0;
for (const datei of fs.readdirSync(ordner).filter((f) => f.endsWith(".sql") && f.slice(0, 8) >= ab).sort()) {
  const sql = fs.readFileSync(new URL(datei, ordner), "utf8").replace(/--[^\n]*/g, "");
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?\s*\(/gi)) {
    const t = m[1];
    if (/create\s+table\s+(?:if\s+not\s+exists\s+)?(?!public\.)[a-z0-9_]+\.[a-z0-9_]+/i.test(m[0])) continue; // anderes Schema
    const grant = new RegExp(`grant\\s+[^;]*\\bon\\s+(?:table\\s+)?(?:public\\.)?"?${t}"?[^;]*\\bto\\s+[^;]*\\bservice_role\\b`, "i");
    assert.ok(grant.test(sql), `${datei}: Tabelle ${t} braucht „grant … on public.${t} to service_role“ (KC-SUPABASE-GRANTS)`);
    assert.ok(new RegExp(`alter\\s+table\\s+(?:public\\.)?"?${t}"?\\s+enable\\s+row\\s+level\\s+security`, "i").test(sql), `${datei}: Tabelle ${t} braucht RLS`);
    geprueft++;
  }
}
// Selbstprüfung der Regel an einem Beispiel
const ohne = "create table public.x_probe (id int);\nalter table public.x_probe enable row level security;";
assert.ok(!/grant\s+[^;]*\bon\s+(?:table\s+)?(?:public\.)?"?x_probe"?[^;]*\bto\s+[^;]*\bservice_role\b/i.test(ohne), "Regel erkennt fehlendes grant");
console.log(`migration-rechte: ${geprueft} neue Tabelle(n) geprüft – ok`);
