// KC-CLUB-KUNDENPREISLISTE (3.22.0): Kundenpreisliste Weihnachtsmarkt 2026 holt Preise und Kennzeichnung aus den Artikeldaten.
// Aufruf: node tests/kundenpreisliste.test.mjs – offline, ohne Server (Artikel wie vom PC-Manager veröffentlicht, Stand 23.11.2026, gekürzt).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const code = fs.readFileSync(new URL("../teile/kundenpreisliste.js", import.meta.url), "utf8");
const ctx = { esc: (s) => String(s).replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[z]) };
vm.createContext(ctx); vm.runInContext(code + ";this.kplModell=kplModell;this.kplHtml=kplHtml;this.kplKennzeichen=kplKennzeichen;", ctx);

const A = (id, name, preis, allergene, zusatz) => ({ id, name, preis, allergene, zusatz });
const SP = "Glutenhaltiges Getreide, Eier (Spuren möglich), Soja (Spuren möglich), Milch (Spuren möglich), Sellerie";
const artikel = [
  A("eier", "Eierlikörpunsch", 4.5, "Eier, Milch, Schwefeldioxid / Sulfite", null),
  A("roterfeger", "Roter Feger", 2.5, "Keine deklarationspflichtigen Allergene laut Etikett.", "Säuerungsmittel Citronensäure (laut Etikett)"),
  A("apfel", "Apfelpunsch", 2.5, "Keine deklarationspflichtigen Allergene laut Etikett.", "Ohne Farb- und Konservierungsstoffe (laut Etikett)"),
  A("schussrum", "Schuss Rum", 1, "Keine deklarationspflichtigen Big-14-Allergene.", "Keine deklarationspflichtigen Zusatzstoffe."),
  A("schussamaretto", "Schuss Amaretto", 1, null, null),
  A("grot", "Glühwein rot", 3.5, "Schwefeldioxid / Sulfite", "Konservierungsstoff und Antioxidationsmittel: Sulfite; Konservierungsstoff: Kaliumsorbat"),
  A("gweiss", "Glühwein weiß", 3.5, "Schwefeldioxid / Sulfite", "Konservierungsstoff und Antioxidationsmittel: Sulfite"),
  A("feuer", "Feuerzangenbowle", 5, "Schwefeldioxid / Sulfite", null),
  A("sauerkraut", "Sauerkrauteintopf", 5.5, SP + ", Senf (Spuren möglich)", "Konservierungsstoff, Antioxidationsmittel"),
  A("sauerkrautmett", "Sauerkrauteintopf + Mettwurst", 7, SP + ", Senf", "Konservierungsstoff, Antioxidationsmittel"),
  A("gruenkohl", "Grünkohl", 5.5, SP + ", Senf", "Konservierungsstoff, Antioxidationsmittel"),
  A("gruenkohlmett", "Grünkohl + Mettwurst", 7, SP + ", Senf", "Konservierungsstoff, Antioxidationsmittel"),
  A("hering", "Kartoffel mit Hering", 4.5, "Eier, Fisch, Milch, Senf, Schwefeldioxid / Sulfite (Spuren möglich)", null),
  A("knirpsecreme", "Kartoffel mit Kartoffelcreme", 3.5, "Eier, Milch, Senf", "Mit Konservierungsstoff (Kaliumsorbat, Natriumbenzoat)"),
  A("mettwurst", "Mettwurst", 1.5, "Sellerie (Spuren möglich), Senf", "Konservierungsstoff (Nitritpökelsalz), Antioxidationsmittel (Ascorbat)"),
  A("glasplus", "Glaspfand", 2, null, null), A("zangeplus", "Feuerzangenpfand", 2, null, null), A("becher", "Außer-Haus-Becher", 1, null, null),
];
const m = ctx.kplModell(artikel);
const alle = new Map(m.abschnitte.flatMap((s) => s.posten.flatMap((p) => (p.gruppe ? p.unter : [p]))).map((p) => [p.name, p]));
// gleiche Kennzeichnung wie auf den gedruckten Preislisten (Abstimmung 24.11.2026)
const soll = { "Roter Feger": "", "Winterapfel": "", "Adventsglühwein": "L, 2, 3", "Winzerglühwein": "L, 2, 3", "Eierlikörpunsch": "C, G, L", "Feuerzangenbowle": "L",
  "Extra Schuss": "", "Grünkohleintopf": "A, I, J, 2, 3", "Grünkohleintopf mit Mettendchen": "A, I, J, 2, 3", "Sauerkrauteintopf": "A, I, 2, 3",
  "Sauerkrauteintopf mit Mettendchen": "A, I, J, 2, 3", "mit Dip": "C, G, J, 2", "mit Heringsstip": "C, D, G, J", "Mettendchen": "J, 2, 3" };
for (const [n, kz] of Object.entries(soll)) { assert.ok(alle.has(n), "Posten " + n); assert.equal(alle.get(n).kz.join(", "), kz, "Kennzeichen " + n); }
const preise = { "Roter Feger": 2.5, "Adventsglühwein": 3.5, "Eierlikörpunsch": 4.5, "Feuerzangenbowle": 5, "Extra Schuss": 1, "Grünkohleintopf mit Mettendchen": 7, "mit Dip": 3.5, "Mettendchen": 1.5 };
for (const [n, p] of Object.entries(preise)) assert.equal(alle.get(n).preis, p, "Preis " + n);
assert.equal(alle.get("Adventsglühwein").stern, "*"); assert.equal(alle.get("Feuerzangenbowle").stern, "**"); assert.equal(alle.get("Grünkohleintopf").stern, "");
assert.deepEqual([m.glas, m.zange, m.becher], [2, 2, 1], "Pfand und Becher aus den Artikeln");
assert.ok(m.hinweise.some((h) => /Schuss Amaretto.*nicht erfasst/.test(h)), "fehlende Allergene werden gemeldet");
assert.equal(m.legende.join(" · "), "A Gluten · C Ei · D Fisch · G Milch · I Sellerie · J Senf · L Sulfite · 2 mit Konservierungsstoff · 3 mit Antioxidationsmittel");
// Preis ändert sich im PC-Manager → Liste folgt; Artikel fehlt → Hinweis, Posten fällt weg
const m2 = ctx.kplModell(artikel.map((a) => (a.id === "grot" ? { ...a, preis: 4 } : a)).filter((a) => a.id !== "mettwurst"));
const alle2 = new Map(m2.abschnitte.flatMap((s) => s.posten.flatMap((p) => (p.gruppe ? p.unter : [p]))).map((p) => [p.name, p]));
assert.equal(alle2.get("Adventsglühwein").preis, 4); assert.ok(!alle2.has("Mettendchen") && m2.hinweise.some((h) => /Mettendchen.*fehlt/.test(h)));
const html = ctx.kplHtml(m, 24);
assert.ok(html.includes("3,50 €") && html.includes("Nur Barzahlung") && html.includes("zzgl. 2,00 € Pfand") && html.includes("Thermobecher für Speisen zum Mitnehmen 1,00 €"));
// eingebunden: Teil, Drucker-Kachel, Druckart, Schriften, Hintergrund
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), buero = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
assert.ok(/kundenpreisliste: \{ einstieg: \["kplStart"\]/.test(app) && /kundenpreisliste: \{ bauen:/.test(app) && /"kplStart\(\)"/.test(buero));
for (const d of ["bilder/kundenpreisliste/hintergrund.jpg", "schriften/source-serif-4-latin-700-italic.woff2", "schriften/source-sans-3-latin-700-normal.woff2", "schriften/source-serif-4-OFL.txt"])
  assert.ok(fs.existsSync(new URL("../" + d, import.meta.url)), d);
console.log("OK – Kundenpreisliste: Preise, Pfand, Kennzeichnung und Legende aus den Artikeldaten, Hinweise bei Lücken");
