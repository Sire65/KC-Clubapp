// KC-STAND-PRUEFREGISTER (16.11.2026, Freigabe Hansi): Stand-Brücke im Prüfregister, Datenleck-Wächter liest das Prüfregister.
// Aufruf: node tests/stand-pruefregister.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const m = fs.readFileSync(new URL("../supabase/migrations/20261116_kc_stand_pruefregister.sql", import.meta.url), "utf8");
for (const f of ["kc_stand_melden", "kc_stand_auftrag_erledigt"]) assert.ok(new RegExp(`\\('${f}', 'security_definer_anon_execute'`).test(m), `${f}: anon-Ausnahme mit Begründung`);
for (const f of ["kc_stand_anlegen", "kc_stand_liste", "kc_stand_abmelden", "kc_stand_auftrag", "kc_stand_auftrag_anlegen", "kc_stand_spiegel", "kc_stand_ereignisse"])
  assert.ok(new RegExp(`\\('${f}', 'security_definer_authenticated_execute'`).test(m), `${f}: im Prüfregister`);
assert.ok(/and not exists \(select 1 from public\.kc_security_reviewed_exceptions r\s+where r\.object_schema = 'public' and r\.object_name = v\.name and r\.finding_code = v\.code and r\.active\)/.test(m), "wiederholbar");
assert.ok(/r\.finding_code = 'security_definer_anon_execute' and r\.decision = 'accepted_required' and r\.active/.test(m), "Datenleck-Wächter liest das Prüfregister");
assert.ok(/revoke all on function public\.kc_club_waechter_lage\(\) from public, anon, authenticated;\s*grant execute on function public\.kc_club_waechter_lage\(\) to service_role;/.test(m), "Rechte des Wächters eng");
for (const t of ["'ohne_rls'", "'weit_offen'", "'club_direkt'", "'speicher_oeffentlich'", "'jobs'", "'spiegel'", "'sicherheit'", "'versionen_jetzt'"]) assert.ok(m.includes(t), `Wächter-Lage vollständig (${t})`);
console.log("stand-pruefregister: ok");
