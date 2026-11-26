// KC-CLUB-DRUCKORDNER: Druckordner Weihnachtsmarkt (Büro → Drucker → 🗂️ Druckordner). Aufruf: node tests/druckordner.test.mjs – offline, ohne Server.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const lies = (d) => fs.readFileSync(new URL("../" + d, import.meta.url), "utf8");
const ctx = { esc: (s) => String(s).replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]), location: { href: "https://x/" }, URL,
  KC_CD: { name: "Köcheclub Werne", zeile: "Gemeinsam kochen, gemeinsam helfen", logo: "kc-kochmuetze-weiss.webp" } };
vm.createContext(ctx);
vm.runInContext(lies("teile/kundenpreisliste.js") + "\n" + lies("teile/etiketten.js") + "\n" + lies("teile/druckordner.js") +
  ";this.t={PE,DO,doSet,doGet,doMplGruppen,doMplHtml,doAllergenStatus,doAllergenHtml,doVerkauf,doPfandArt,doKassenCodes};", ctx);
const { t } = ctx; const J = (x) => JSON.parse(JSON.stringify(x)); // Werte aus dem vm-Kontext vergleichbar machen
const A = (id, name, preis, kategorie, pfand = [], x = {}) => ({ id, name, preis, kategorie, nummer: "0" + Math.abs(preis * 100 + id.length), pfand, ...x });
const G = [{ name: "Glaspfand", betrag: 2 }];
t.PE.artikel = [A("eier", "Eierlikörpunsch", 4.5, "Getränke", G, { alkohol: true, allergene: "Eier, Milch, Schwefeldioxid / Sulfite" }), A("grot", "Glühwein rot", 3.5, "Getränke", G, { alkohol: true }),
  A("feuer", "Feuerzangenbowle", 5, "Getränke", [...G, { name: "Feuerzangenpfand", betrag: 2 }]), A("schussrum", "Schuss Rum", 1, "Getränke", [], { alkohol: true }), A("schussamaretto", "Schuss Amaretto", 1, "Getränke"),
  A("roterfeger", "Roter Feger", 2.5, "Getränke", G), A("gruenkohl", "Grünkohl", 5.5, "Speisen", [], { allergene: "Glutenhaltiges Getreide, Eier (Spuren möglich), Sellerie, Senf", zusatz: "Konservierungsstoff, Antioxidationsmittel" }),
  A("glasplus", "Glaspfand", 2, "Pfand"), A("zangeplus", "Feuerzangenpfand", 2, "Pfand"), A("glasminus", "Glasrückgabe", -2, "Pfand"),
  { id: "cmd-bar", name: "BAR – bezahlen", nummer: "CMD-CHECKOUT", kategorie: "Kassen-Codes", spezial: "bar", preis: 0, pfand: [] }];
// Interne Preisliste: Gruppen und Beträge inkl. Pfand
const g = t.doMplGruppen();
assert.deepEqual(J(g.map((x) => x.t)), ["Getränke mit Alkohol", "Alkoholfreie Getränke", "Speisen"]);
assert.deepEqual(J(g[0].z.map((z) => [z.name, z.preis])), [["Eierlikörpunsch", 6.5], ["Glühwein rot", 5.5], ["Feuerzangenbowle", 9], ["+ Schuss Rum / Amaretto", 1]]);
assert.equal(g[0].z[2].unter, "inkl. 4,00 € Pfand (Glas + Feuerzange)"); assert.equal(g[0].z[0].unter, "inkl. 2,00 € Glaspfand");
assert.deepEqual(J(g[1].z.map((z) => z.preis)), [4.5]); assert.deepEqual(J(g[2].z.map((z) => z.preis)), [5.5]);
const html = t.doMplHtml();
assert.ok(/Interne Preisliste \d{4}/.test(html) && html.includes("13,00") && html.includes("90,00") && html.includes("Nur für Mitarbeiter") && html.includes("Nur Barzahlung"));
// Allergen-Aushang: enthalten / Spuren / nicht erfasst
const st = t.doAllergenStatus(t.PE.artikel.find((a) => a.id === "gruenkohl"));
assert.deepEqual([[...st.drin].sort().join(""), [...st.spur].join(""), st.zusatz.join(",")], ["AIJ", "C", "2,3"]);
assert.equal(t.doAllergenStatus(t.PE.artikel.find((a) => a.id === "schussamaretto")).fehlt, true);
assert.ok(t.doAllergenHtml().includes("Allergene &amp; Zusatzstoffe"));
// Auswahl: Anzahl 0 = aus, ＋ = an
t.doSet("karte", "cmd-bar", 3, "BAR"); assert.deepEqual(J([t.doGet("karte", "cmd-bar").n, t.doGet("karte", "cmd-bar").an]), [3, true]);
t.doSet("karte", "cmd-bar", 0); assert.equal(t.doGet("karte", "cmd-bar").an, false);
assert.deepEqual(J(t.doPfandArt().map((a) => a.id)), ["glasplus", "zangeplus", "glasminus"]);
// Pfand-/Kassen-Etiketten (eigene Größe): Pfandartikel und BAR; Scheckkarten nur für „Kasse verbinden“ (Admin)
assert.deepEqual(J(t.doKassenCodes().map((a) => a.id)), ["glasplus", "zangeplus", "glasminus", "cmd-bar"]);
// eingebunden: Teil, Abhängigkeiten, Druckart, Kachel, Server nimmt die neuen Teile an
const app = lies("app.js"), buero = lies("teile/buero.js"), server = lies("supabase/functions/kc-club/index.ts");
assert.ok(/druckordner: \{ einstieg: \["doStart"\]/.test(app) && /druckordner: \["kundenpreisliste", "etiketten"\]/.test(app) && /druckordner: \{ bauen: \(\) => doDruckSeite\(\) \}/.test(app));
assert.ok(/"doStart\(\)"/.test(buero) && /SCHILD_PAKET_TYP = \["schild", "vorlage", "archiv", "live", "etikett", "karte", "etformat"\]/.test(server) && /\.slice\(0, 150\)/.test(server));
// 3.43.0 KC-CLUB-DRUCKORDNER-KONTRAST (Fund Hansi 26.11.2026): im dunklen Design keine feste helle Zeilenfarbe – Designfarben nutzen
{
  const t = fs.readFileSync(new URL("../teile/druckordner.js", import.meta.url), "utf8");
  assert.ok(t.includes("#doBlatt .do-z.an{background:var(--karte2,#fbf6ee)}") && t.includes("color:var(--text,#2b1a1c)") && t.includes("#doBlatt .do-gk h4{margin:4px 0;color:var(--textRot,#741521)}"), "Druckordner nimmt die Designfarben");
}
console.log("OK – Druckordner: interne Preisliste inkl. Pfand, Allergen-Aushang aus den Daten, Auswahl, Einbindung");
const quelle = lies("teile/druckordner.js");
assert.ok(/admin_qr_kassen/.test(quelle) && /Kasse verbinden/.test(quelle) && /formatK: 5/.test(quelle) && /if \(a\.spezial !== "bar"\) return peEtikett/.test(quelle), "Kassen-Karten nur Verbinden-QR, BAR als Etikett, Größe 5 cm vorgegeben");
