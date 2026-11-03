// KC-CLUB-SYSTEMCHECK-GRUEN (03.11.2026, Wunsch Hansi): System-Check-Verlauf schlank halten, geprüfte SECURITY-DEFINER-Funktionen im Register.
// Aufruf: node tests/systemcheck-gruen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const m = lies("supabase/migrations/20261103_kc_club_systemcheck_gruen.sql");
const fn = m.slice(m.indexOf("create or replace function public.kc_club_db_aufraeumen"), m.indexOf("revoke all on function public.kc_club_db_aufraeumen"));
// Löschen nur technischer Protokolle, wie bisher
assert.deepEqual([...fn.matchAll(/delete from ([a-z_.]+)/g)].map((x) => x[1]), ["public.kc_system_check_history", "public.kc_communication_health_snapshots"], "nur technische Protokolle");
assert.ok(fn.includes("v_check_tage integer := least(v_tage, 40);") && fn.includes("checked_at < now() - make_interval(days => v_check_tage)"), "Verlauf höchstens 40 Tage");
assert.ok(fn.includes("x.checked_at < now() - interval '3 days'") && fn.includes("limit 2000);"), "nach 3 Tagen ausgedünnt");
assert.ok(fn.includes("jsonb_build_object('id', e->'id', 'name', e->'name', 'status', e->'status', 'health', e->'health')"), "Kernfelder bleiben");
assert.ok(fn.includes("greatest(coalesce(p_tage, 90), 60)") && fn.includes("kc_lebenszeichen_aufraeumen(30)") && fn.includes("interval '30 days'"), "übrige Regeln unverändert");
// kc_system_check_usage wertet 31 Tage aus → 40 reicht
assert.ok(40 > 31);
assert.ok(/revoke all on function public\.kc_club_db_aufraeumen\(integer\) from public, anon, authenticated;/.test(m) && /grant execute on function public\.kc_club_db_aufraeumen\(integer\) to service_role;/.test(m), "nur der Server");
assert.ok(m.includes("autovacuum_vacuum_scale_factor = 0.02") && m.includes("toast.autovacuum_vacuum_scale_factor = 0.02"), "Autovacuum früher");
// Prüfregister: 26 Funktionen, nur authenticated, Wiedervorlage, wiederholbar
const namen = [...m.matchAll(/^    \('([a-z_0-9]+)', '/gm)].map((x) => x[1]);
assert.equal(namen.length, 26, "26 Funktionen"); assert.equal(new Set(namen).size, 26, "keine doppelt");
assert.ok(m.includes("'security_definer_authenticated_execute', 'accepted_required'") && m.includes("now() + interval '6 months'") && m.includes("where not exists"));
assert.ok(!/security_definer_anon_execute/.test(m.slice(m.indexOf("insert into public.kc_security_reviewed_exceptions"))), "keine neue anon-Ausnahme");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/systemcheck-gruen.test.mjs"), "läuft in der CI");
console.log("systemcheck-gruen: ok");
