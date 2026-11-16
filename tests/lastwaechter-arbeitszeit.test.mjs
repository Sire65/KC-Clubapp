// KC-LASTWAECHTER-ARBEITSZEIT (16.11.2026, Wunsch Hansi „Warnungen schlauer machen, aber trotzdem gut aufpassen auf alles“)
// Aufruf: node tests/lastwaechter-arbeitszeit.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const m = fs.readFileSync(new URL("../supabase/migrations/20261116_kc_traffic_guard_arbeitszeit.sql", import.meta.url), "utf8");
assert.ok(/SUM\(total_exec_time\),0\) INTO v_calls, v_exec FROM extensions\.pg_stat_statements/.test(m), "misst die Arbeitszeit der Datenbank");
assert.ok(/IF v_exec15 IS NULL THEN\s+v_level:=v_aufrufe_level;/.test(m), "ohne Vergleichswert wie bisher");
assert.ok(/ELSIF v_per15>=20000 OR v_exec15>=450000 THEN\s+v_level:='critical';/.test(m), "ROT: 20.000 Aufrufe oder 50 % Arbeitszeit");
assert.ok(/ELSIF v_exec15>=180000 THEN\s+v_level:='warning';/.test(m), "GELB ab 20 % Arbeitszeit – auch bei wenigen Aufrufen");
assert.ok(/ELSIF v_aufrufe_level<>'normal' AND v_exec15>=60000 THEN\s+v_level:=v_aufrufe_level;/.test(m), "viele Aufrufe nur auffällig, wenn die Datenbank auch arbeitet");
assert.ok(/Viele kurze Aufrufe/.test(m), "Hinweis statt Warnung bei vielen kurzen Aufrufen");
assert.ok(/revoke all on function public\.kc_traffic_guard_sample\(\) from public, anon, authenticated;\s*grant execute on function public\.kc_traffic_guard_sample\(\) to service_role;/.test(m), "Rechte eng");
// Nachgerechnet mit echten Werten: 16.11. 18:18 (6132 Aufrufe, ≈ 14 s) → normal; 15.11. 22:45 (≈ 195 s je 15 Min.) → GELB
const stufe = (aufrufe, base, execMs) => { const a = aufrufe >= 20000 || (aufrufe >= 9000 && aufrufe >= base * 3) ? "critical" : aufrufe >= 10000 || (aufrufe >= 4000 && aufrufe >= base * 2.5) ? "warning" : "normal";
  return aufrufe >= 20000 || execMs >= 450000 ? "critical" : execMs >= 180000 ? "warning" : a !== "normal" && execMs >= 60000 ? a : "normal"; };
assert.equal(stufe(6132, 2406, 14000), "normal", "App-Starts gleichzeitig: keine Warnung");
assert.equal(stufe(3363, 2400, 195000), "warning", "echte Langsamkeit (15.11. abends): GELB");
assert.equal(stufe(25000, 2400, 5000), "critical", "Schleife: ROT");
assert.equal(stufe(1500, 2400, 500000), "critical", "Datenbank voll beschäftigt: ROT");
console.log("lastwaechter-arbeitszeit: ok");
