// KC-PRUEFREGISTER-ABGLEICH (18.11.2026, Wunsch Hansi „täglicher Abgleich, aber sparsam mit Abfragen“). Aufruf: node tests/pruefregister-abgleich.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const m = lies("supabase/migrations/20261118_kc_pruefregister_abgleich.sql"), srv = lies("supabase/functions/kc-club/index.ts");
assert.ok(/cron\.schedule\('kc-pruefregister-abgleich', '20 6 \* \* \*'/.test(m), "einmal am Tag 06:20 UTC");
const [h, mi] = [6, 20]; assert.ok(!(h >= 0 && h <= 3) && !(h === 4 && mi >= 5 && mi <= 45) && !(h >= 10 && h <= 11) && !(h >= 18 && h <= 19) && !(h === 6 && mi >= 30 && mi < 35), "nicht in Sicherung/Spiegelung/Prüfung/Einspiel-Fenstern");
assert.ok(/if jsonb_array_length\(v_funde\) = 0 then return 'ok'; end if;/.test(m), "alles in Ordnung: nichts schreiben");
assert.ok(/m\.version >= to_char\(now\(\) - interval '14 days', 'YYYYMMDD'\)/.test(m), "Herkunft nur aus den letzten 14 Tagen (sparsam)");
assert.ok(/raise exception 'Prüfregister fehlt für %'/.test(m), "Lauf endet mit Fehler und nennt Funktion + Migration");
assert.ok(!/net\.http|http_post/.test(m), "kein Netzaufruf");
assert.ok(/revoke all on function kc_internal\.kc_pruefregister_abgleich\(\) from public, anon, authenticated;/.test(m), "Rechte eng");
assert.ok(/'kc-club-db-last-30min','kc-pruefregister-abgleich'\]\)/.test(m), "Wächter-Lage kennt den Zeitplan");
assert.ok(/\{ id: "pruefregister", sym: "📋", name: "Prüfregister-Abgleich", job: "kc-pruefregister-abgleich" \}/.test(srv), "Wächter im Club-Server");
console.log("pruefregister-abgleich: ok");
