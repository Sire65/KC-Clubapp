// KC-CLUB-INSTALL-STAND + KC-CLUB-HILFE-INSTALL (Wunsch Hansi 04.11.2026). Aufruf: node tests/install-stand.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(app.includes("const r = await api(\"online\", { fenster: fensterKennung(), ...installStandMelden() });") && app.includes("if (INSTALL_STAND_GESENDET) return {};"), "einmal je Sitzung mitgeschickt");
assert.ok(srv.includes('const INSTALL_ARTEN = new Set(["app", "verknuepfung", "browser", "pc"]);') && srv.includes("if (alt?.art === art && Date.now() - Date.parse(alt.am || \"\") < 3 * 86400000) return;"), "nur bei Änderung geschrieben");
assert.ok(srv.includes('"klopf_verpasst", "app_stand"]') , "keine zusätzliche Leseabfrage (in der vorhandenen)");
const a = srv.slice(srv.indexOf('case "install_stand":'), srv.indexOf('case "install_stand":') + 400);
assert.ok(a.includes("nurAdmin(ich);"), "Liste nur Admin");
assert.ok(app.includes('["installiert", "📲", "Installiert?", "app"]') && app.includes('if (id === "installiert") return installStandListe();'), "Admin-Kachel");
assert.ok(app.includes("tippSenden({ an: [${jsArg(m.person_id)}], problem: 'App installieren' })"), "Tipp direkt aus der Liste");
for (const id of ["installieren", "installiert_pruefen", "laeuft_nicht_rund", "push_kommt_nicht", "neues_handy"]) assert.ok(app.includes(`{ id: "${id}", thema: "technik"`), "Hilfe " + id);
assert.ok(app.includes('knoepfe: Array.isArray(e.knoepfe) ? e.knoepfe : null') && app.includes('onclick="${fn}">${t}</button>'), "Hilfe-Karten mit Knöpfen");
console.log("install-stand: ok");
