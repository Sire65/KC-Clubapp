// KC-CLUB-IST-RUECKFRAGE (Wunsch Hansi 08.11.2026): Ist-Zeiten nach dem Dienst selbst bestätigen – Abgleich mit Kasse (QR) und App-Buchungen, DP2 liest mit.
// Aufruf: node tests/ist-rueckfrage.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), teil = lies("teile/istzeit.js"), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html"), sw = lies("sw.js");
const mig = lies("supabase/migrations/20261108_kc_dp_dienst_rueckmeldung.sql");

// --- Datenbank ---
assert.ok(/unique \(org_id, dienst_ref, person_id\)/.test(mig), "eine Zeile je Person und Dienst");
assert.ok(/ergebnis text check \(ergebnis in \('passt', 'geaendert', 'nicht_da', 'korrektur'\)\)/.test(mig) && /ist_ende - ist_start <= interval '16 hours'/.test(mig), "Ergebnis und Grenzen in der Datenbank");
assert.ok(/revoke all on public\.kc_dp_dienst_rueckmeldung from public, anon, authenticated;/.test(mig) && /grant select, insert, update, delete on public\.kc_dp_dienst_rueckmeldung to service_role;/.test(mig), "Tabelle nur Club-Server");
for (const f of ["kc_dp_rueckmeldungen_liste(text, date, date)", "kc_dp_rueckmeldung_entscheiden(uuid, text, text)"]) {
  assert.ok(mig.includes(`revoke all on function public.${f} from public, anon;`) && mig.includes(`grant execute on function public.${f} to authenticated, service_role;`), "DP2-Funktion: " + f);
}
assert.equal((mig.match(/if \(select auth\.uid\(\)\) is null then raise exception 'Anmeldung erforderlich'; end if;/g) || []).length, 2, "beide Funktionen nur angemeldet");
assert.ok(/m\.role in \('admin', 'planner', 'duty_manager'\)/.test(mig) && /\(v_planer or r\.person_id = v_person\)/.test(mig), "Planer alle, sonst nur die eigenen");
assert.ok(/p_status = 'abgelehnt' and coalesce\(length\(trim\(p_grund\)\), 0\) = 0 then raise exception/.test(mig), "Ablehnen nur mit Grund");

// --- Server: Regeln (Typen entfernt, echte Funktionen) ---
const st = (a, b) => server.slice(server.indexOf(a), server.indexOf(b, server.indexOf(a)));
const code = (st("const IR = {", "const IR_GRUENDE") + st("function irErfasst(", "// Die Stechuhr der Kasse") + st("// Zustand eines Dienstes", "async function irLage("))
  .replace("(d: any, buch: any[])", "(d, buch)").replace("(d: any, r: any, e: any, t: number, zu: boolean)", "(d, r, e, t, zu)").replace("(a: number, b: number, pause: number)", "(a, b, pause)");
const R = new Function(code + "; return { IR, irErfasst, irZustand, irMin };")();
const H = 3600000, t0 = Date.UTC(2026, 11, 5, 10, 0), d = { ref: "S1", person: "KC-P-1", startMs: t0, endeMs: t0 + 4 * H, pause: 0 };
const b = (art, ms, quelle = "kasse", ref = null) => ({ person_id: "KC-P-1", art, zeit: new Date(ms).toISOString(), quelle, dienst_ref: ref, storniert_am: null, pause_min: art === "out" ? 15 : null });
assert.equal(R.irErfasst(d, []), null, "nichts erfasst");
let e = R.irErfasst(d, [b("in", t0 + 2 * 60000), b("out", t0 + 4 * H + 10 * 60000)]);
assert.ok(e.komplett && e.quelle === "kasse" && e.pause === 15, "Kasse Kommen + Gehen");
e = R.irErfasst(d, [b("in", t0 - 5 * 60000, "app")]); assert.ok(!e.komplett && e.kommen && !e.gehen && e.quelle === "app", "nur Kommen (App)");
assert.equal(R.irErfasst(d, [b("in", t0 - 5 * H)]), null, "weit außerhalb des Dienstes zählt nicht");
assert.ok(R.irErfasst(d, [b("in", t0 - 5 * H, "kasse", "S1"), b("out", t0 + 9 * H, "kasse", "S1")]).komplett, "gleicher Dienst (dienst_ref) zählt immer");
assert.equal(R.irErfasst(d, [b("in", t0, "app"), b("out", t0 + 4 * H, "kasse")]).quelle, "kasse", "Rangfolge: Kasse vor App");
assert.equal(R.irErfasst(d, [{ ...b("in", t0), storniert_am: "x" }]), null, "Storniertes zählt nicht");
const ende = d.endeMs;
assert.equal(R.irZustand(d, null, null, ende - 2 * H, false), "spaeter", "vor dem Ende noch nicht");
assert.equal(R.irZustand(d, null, null, ende - 20 * 60000, false), "offen", "ab 30 Min. vor Ende eintragbar (sofort manuell)");
assert.equal(R.irZustand(d, null, { komplett: true }, ende + H, false), "erfasst", "Kasse erfasst → nicht fragen");
assert.equal(R.irZustand(d, { ergebnis: "korrektur" }, { komplett: true }, ende + H, false), "beantwortet");
assert.equal(R.irZustand(d, null, { kommen: "x", gehen: null }, ende + H, false), "halb");
assert.equal(R.irZustand(d, { ergebnis: "passt" }, null, ende + H, false), "beantwortet");
assert.equal(R.irZustand(d, null, null, ende + 8 * 24 * H, false), "zu", "nach 7 Tagen zu");
assert.equal(R.irZustand(d, null, null, ende + H, true), "zu", "Tag abgeschlossen → zu");
assert.equal(R.irMin(t0, t0 + 4 * H, 30), 210);

// Stechuhr der Kasse (kc_dp_timeclock_actuals) zählt wie eine Kassen-Buchung – auch über Mitternacht
const kb = st("function irKasseBuchungen(", "const irKasseLesen").replace("(rows: any[])", "(rows)").replace(/\(x: any\)/g, "(x)");
const dsMs = (tag, uhr) => { const [h, m] = String(uhr).split(":").map(Number); return Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10), h - 1, m); };
const KB = new Function("dsMs", kb + "; return irKasseBuchungen;")(dsMs);
const z = KB([{ person_id: "KC-P-1", work_date: "2026-12-05", start_time: "18:00:00", end_time: "01:30:00", break_minutes: 15, status: "recorded" }, { person_id: "KC-P-1", work_date: "2026-12-05", start_time: "10:00", end_time: "12:00", status: "voided" }]);
assert.equal(z.length, 2, "storniert (voided) zählt nicht");
assert.ok(z[0].art === "in" && z[1].art === "out" && Date.parse(z[1].zeit) - Date.parse(z[0].zeit) === 7.5 * H && z[1].pause_min === 15 && z[0].quelle === "kasse", "über Mitternacht, Quelle Kasse");
assert.ok(server.includes("const buch = [...(buch0 ?? []), ...kasse];") && (server.match(/irKasseLesen\(/g) || []).length >= 3, "überall mitgeprüft (Lage, Erinnerung, Antwort)");

// --- Server: Ablauf ---
const ant = st('case "ist_antworten": {', 'case "ist_aenderungen": {');
assert.ok(ant.includes('await nurWennFrei("ist_rueckfrage", ich, "Ist-Zeiten bestätigen");') && ant.includes("if (ich.nurLesen) throw"), "Freigabe, nicht nur-lesend");
assert.ok(ant.includes('.find((x) => x.ref === ref);') && ant.includes("irDienste(Array.from({ length: IR.fristTage + 2 }"), "nur eigener Dienst der letzten 7 Tage");
assert.ok(ant.includes('if (e?.komplett && ergebnis !== "korrektur") throw') && ant.includes('if (ergebnis === "nicht_da" && e?.kommen) throw'), "keine Konflikte mit Kasse/App-Buchung");
assert.ok(ant.includes('if (zustand === "zu") throw') && ant.includes('if (zustand === "spaeter") throw'), "abgeschlossen / noch nicht vorbei");
assert.ok(ant.includes("if (start % (IR.schrittMin * 60000) || ende % (IR.schrittMin * 60000)) throw") && ant.includes("if (ende > t + 5 * 60000) throw"), "5-Minuten-Raster, nicht in der Zukunft");
assert.ok(ant.includes('const planerStatus = ergebnis === "passt" || (ergebnis === "geaendert" && abweichung < IR.abweichMin) ? "automatisch" : "zu_bestaetigen";'), "laut Plan automatisch, ab 15 Min. / nicht da / Korrektur der Planer");
assert.ok(ant.includes('.eq("id", alt.id).eq("version", alt.version)'), "Änderung nur auf dem gelesenen Stand");
assert.ok(ant.includes('if (ergebnis !== "passt" && !(ergebnis === "geaendert" && abweichung === 0)) {') && ant.includes("nebenbei(irBescheid(ich, text)"), "Bescheid bei Änderung, nicht bei „passt“");
assert.ok(ant.includes('if (ergebnis === "korrektur" && !grund) throw'), "Korrektur braucht einen Grund, sonst freiwillig");
const bes = st("async function irBescheid(", "async function irErinnern(");
assert.ok(bes.includes('.overlaps("aemter", ["Clubsprecher", "Kassenwart"])') && bes.includes("adminIds()") && bes.includes("id !== ich.person_id") && bes.includes("IR.bescheidMin * 60000"), "Clubsprecher, Kassenwart, Admin; nicht an sich selbst; gebündelt");
const eri = st("async function irErinnern(", "async function nurWennFrei(");
assert.ok(eri.includes("t >= d.endeMs + IR.nachMin * 60000") && /const IR = \{ nachMin: 15, erinnerStd: 3, fristTage: 7, abweichMin: 15/.test(server), "Push 15 Min. nach Dienstende, Erinnerung nach 3 Std., 7 Tage, 15 Min.");
assert.ok(eri.includes('std >= IR.vonStd && std < IR.bisStd') && eri.includes('if (r?.ergebnis || e?.komplett || (e?.kommen && !e?.gehen && e.quelle === "app")) continue;'), "Erinnerung nur 9–20 Uhr; nicht bei Antwort, Kasse oder Live-Anmeldung");
assert.ok(eri.includes("// erst merken, dann senden – nie doppelt") && eri.includes('sendenGewaehlt("club_dienst", [d.person], ["push"]'), "höchstens Frage + Erinnerung");
assert.ok(server.includes("const irErin = await irErinnern().catch("), "läuft im Zeitplaner");
assert.ok(server.includes('"dienst_tausch_aktion", "dp_einzelplan", "ist_offen", "ist_antworten", "ist_feedback"]') && app.includes('"dienst_tausch_aktion", "dp_einzelplan", "ist_offen", "ist_antworten", "ist_feedback"]'), "auch für Aushilfen (alle im Plan)");
assert.ok(/ist_rueckfrage: \{ t: "✅ Ist-Zeiten nach dem Dienst bestätigen",[^\n]*standard: "admin" \}/.test(server), "erst nur Admin (Test), Freigabe für alle per Schalter");
const ae = st('case "ist_aenderungen": {', "// Admin: wer ist heute im Dienst");
assert.ok(ae.includes('if (!ich.admin && !ich.aemter.some((a) => a === "Clubsprecher" || a === "Kassenwart")) throw'), "Änderungsliste nur Leitung");

// --- Wunsch Hansi 08.11.: Zufriedenheit (3 Gesichter) und Besetzung – freiwillig, für die Planung ---
assert.ok(/zufrieden smallint check \(zufrieden between 1 and 3\)/.test(mig) && /besetzung text check \(besetzung in \('zu_wenig', 'passt', 'zu_viel'\)\)/.test(mig) && mig.includes("'zufrieden', r.zufrieden, 'besetzung', r.besetzung"), "Datenbank + DP2-Liste");
const fbS = st('case "ist_feedback": {', 'case "ist_aenderungen": {');
assert.ok(fbS.includes('await nurWennFrei("ist_rueckfrage"') && fbS.includes("[1, 2, 3].includes(Number(p.zufrieden))") && fbS.includes('["zu_wenig", "passt", "zu_viel"].includes(String(p.besetzung))') && fbS.includes("t > d.endeMs + IR.fristTage * 86400000"), "Server prüft Werte, eigener Dienst, 7 Tage");
assert.ok(teil.includes('const IR_GESICHT = [[1, "😀", "gut"], [2, "🙂", "geht so"], [3, "☹️", "nicht gut"]]') && teil.includes("Waren die Schichten richtig besetzt?") && teil.includes('IR_BESETZT = [["zu_wenig", "Zu wenig"], ["passt", "Genau richtig"], ["zu_viel", "Zu viele"]]'), "3 Gesichter + Besetzung");
assert.ok(teil.includes('d.antwort?.ergebnis !== "nicht_da" && Date.now() <= Date.parse(d.frist) ? irFeedbackHtml(d)'), "nach der Antwort (bzw. Kassen-Erfassung) anbieten, nicht bei „nicht da“");
assert.ok(server.includes("stimmung: [...je.values()]"), "Leitung sieht Stimmung & Besetzung je Tag/Bereich (nur Anzahlen)");

assert.ok(server.includes('x.status === "closed" || x.ist === "closed"') && server.includes('tg?.status === "closed" || (tg as any)?.ist === "closed"'), "Tagesabschluss aus DP2 (payload.istStatus) beendet das Fragen");
// --- App ---
assert.ok(/istzeit: \{ einstieg: \["irOeffnen", "irAenderungen"\], sri: "sha384-/.test(app) && /istzeit: "[A-Za-z0-9_-]{16}"/.test(sw), "Teil mit Fingerabdruck");
assert.ok(html.includes('<div id="irKarte"></div>') && app.includes('else if (h === "#istzeit") irOeffnen();') && app.includes('else if (h === "#istaenderungen") irAenderungen();'), "Startkarte und Links aus dem Push");
assert.ok(app.includes("setTimeout(() => { try { irLaden(); } catch {} }, 3000); /* KC-CLUB-IST-RUECKFRAGE */") && app.includes('if (!INIT || !frei("ist_rueckfrage") || zugang() === "gast") return;'), "laden nur mit Freigabe");
assert.ok(/id: "ist_zeiten", thema: "termine"/.test(app) && /irBlatt: "🗓️ Meine Ist-Zeiten"/.test(app) && app.includes("🗓️ Meine Ist-Zeiten bestätigen"), "Hilfe, Fenstername, Mein Dienst");
assert.ok(teil.includes('class="knopf ir-aus" aria-disabled="true" onclick="melde(') && html.includes(".knopf.ir-aus {"), "nicht passende Knöpfe ausgegraut, antippen erklärt");
assert.ok(teil.includes('irKnopf("❌ War nicht da", nichtDaGeht') && teil.includes('const nichtDaGeht = (z === "offen" || z === "beantwortet") && !er?.kommen;'), "„nicht da“ nur ohne Kommen");
assert.ok(teil.includes('irKnopf("🧾 Korrektur melden", z === "erfasst" || (z === "beantwortet" && !!er?.komplett)'), "Korrektur nur bei Kassen-/App-Buchung");
assert.ok(teil.includes('if (!fehler && !korr && gleichPlan) fehler = "Gleiche Zeiten wie geplant – dann einfach „✅ Ja, stimmt“.";') && teil.includes('k.classList.toggle("ir-aus", !!fehler);'), "Speichern grau, solange nichts geändert ist");
const dauer = new Function(teil.slice(teil.indexOf("function irDauer("), teil.indexOf("const IR_STATUS")) + "; return irDauer;")();
assert.equal(dauer(240), "4 Std."); assert.equal(dauer(285), "4 Std. 45 Min."); assert.equal(dauer(30), "30 Min."); assert.equal(dauer(0), "0 Min.");
console.log("ist-rueckfrage: ok");
