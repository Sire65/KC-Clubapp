// KICC-F-110 (29.10.2026, Supabase-Egress): Spiegel-Blöcke auch nach Zeit für Tabellen ohne Ganzzahl-Schlüssel.
// Prüft, dass Datenbank (Migration) und Spiegel-Arbeiter Block-Nummer und Reihenfolge gleich rechnen und der alte Weg bleibt.
// Aufruf: node tests/spiegel-zeitbloecke.test.mjs (offline). Datenbank-Test mit zwei Datenbanken: tools/db-test/90_spiegel_zeitbloecke_test.py
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const mig = lies("supabase/migrations/20261029_kicc_f110_spiegel_zeitbloecke.sql"), w = lies("supabase/functions/kc-db-mirror-worker/index.ts");

// Datenbank: Zeitspalte nur ohne Ganzzahl-Schlüssel, nicht geschwärzt, Tagesblöcke, stabile Reihenfolge
assert.match(mig, /create function public\.kc_db_mirror_block_quelle\(p_table_name text, out pk text, out cols text, out zeit text\)/);
assert.match(mig, /if pk is null then -- KICC-F-110/);
assert.match(mig, /a\.attnotnull and a\.attname in \('created_at', 'erstellt_am'\)/);
assert.match(mig, /not exists \(select 1 from public\.kc_db_mirror_redaction r where r\.table_name = p_table_name and r\.column_name = a\.attname\)/);
assert.match(mig, /floor\(extract\(epoch from q\.%1\$I\) \/ 86400\)::bigint as b/);
assert.match(mig, /order by q\.%1\$I, row_to_json\(q\)::text collate "C"/);
assert.match(mig, /jsonb_build_object\('pk', null, 'zeit', v\.zeit, 'width', 86400, 'blocks', r\)/, "alter Spiegel-Arbeiter muss pk = null sehen (ganze Tabelle wie bisher)");
assert.match(mig, /where floor\(extract\(epoch from q\.%I\) \/ %s\)::bigint = any\(\$1\)/);
// Ganzzahl-Weg (KICC-F-109) unverändert
assert.match(mig, /select \(q\.%1\$I \/ %3\$s\)::bigint as b, count\(\*\) as n, md5\(string_agg\(row_to_json\(q\)::text, '''' order by q\.%1\$I\)\) as h/);
assert.match(mig, /where \(q\.%I \/ %s\)::bigint = any\(\$1\)/);
// Rechte: nur service_role
assert.match(mig, /revoke all on function public\.kc_db_mirror_block_quelle\(text\) from public, anon, authenticated;/);
assert.match(mig, /grant execute on function public\.kc_db_mirror_block_hashes\(text, bigint\) to service_role;/);
assert.match(mig, /grant execute on function public\.kc_db_mirror_block_rows\(text, bigint, bigint\[\]\) to service_role;/);
assert.ok(!/to (anon|authenticated)\b/.test(mig.replace(/from public, anon, authenticated/g, "")), "keine Rechte für anon/authenticated");

// Spiegel-Arbeiter rechnet in Neon dasselbe
assert.match(w, /if\(be\|\|!\(bh\?\.pk\|\|bh\?\.zeit\)\|\|!Array\.isArray\(bh\.blocks\)\)return null;/);
assert.match(w, /blk=bh\.pk\?`\(\$\{sp\}\/\$\{w\}\)::bigint`:`floor\(extract\(epoch from \$\{sp\}\)\/\$\{w\}\)::bigint`/);
assert.match(w, /ord=bh\.pk\?sp:`\$\{sp\}, row_to_json\(t\)::text collate "C"`/);
assert.match(w, /md5\(string_agg\(row_to_json\(t\)::text,'' order by \$\{ord\}\)\) h from \$\{q\} t group by 1/);
assert.match(w, /delete from \$\{q\} where \$\{blk\} = any\(\$1::bigint\[\]\)/);
assert.match(w, /if\(tc!==sc\|\|th!==sh\)return null;/, "danach Prüfung der ganzen Tabelle, sonst ganze Tabelle wie bisher");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/spiegel-zeitbloecke.test.mjs"), "läuft in der CI");
console.log("spiegel-zeitbloecke: ok");
