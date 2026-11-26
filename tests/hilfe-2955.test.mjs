// KC-CLUB-HILFE-2955 (Wunschliste #92, Hansi 15.11.2026 „Alle Hilfetexte, Video-Filme, Lupe, Twinkey an die neueste Version anpassen – ja alles neu aufbauen“).
// Prüft (offline): neue/geänderte Hilfetexte, Admin-Hilfen nur mit Rolle, Erklär-Videos ohne verwaiste Stationen, Lupe und Twinkey.
// Aufruf: node tests/hilfe-2955.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const videos = readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
const hilfe = readFileSync(new URL("../teile/hilfe.js", import.meta.url), "utf8");
const buero = readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
const programm = programmText();

// --- HILFE: Einträge als Zeilen ---
const h0 = app.indexOf("const HILFE = ["), HILFE = app.slice(h0, app.indexOf("\n];", h0));
const zeile = (id) => HILFE.split("\n").find((z) => z.includes(`{ id: "${id}",`)) || "";
const ids = new Set([...HILFE.matchAll(/\{ id: "([a-z_0-9]+)",/g)].map((m) => m[1]));

// neue Einträge (🆕 über seit) – Admin/Clubleitung nur mit „nur“
const neu = ["kopf_knopf", "ka_kopf_toggle", "sprache_flagge", "netz_balken", "frist_erinnerung", "offline_push", "ta_aendern", "ta_tagesordnung", "ta_protokoll", "gegenvorschlag_thema"];
const leitung = ["buchungsliste", "preis_etiketten"]; /* Wunsch Hansi 26.11.2026: keine Admin-Funktionen in den allgemeinen Hilfen – Eintrag entfernt */
for (const id of ["einsatzplan", "advent_wer_was", "wege_dienst"]) assert.ok(!ids.has(id) && !hilfe.includes(`"h:${id}"`), "keine Admin-Hilfe " + id);
for (const id of [...neu, ...leitung]) assert.ok(/seit: "2\.955\.0"/.test(zeile(id)), `Hilfe ${id} mit seit 2.955.0`);
for (const id of leitung) assert.ok(/nur: \(\) => !!(\(ICH\?\.vorstand \|\| ICH\?\.admin\)|ICH\?\.admin)/.test(zeile(id)), `Hilfe ${id} nur für Admin/Clubleitung`);
for (const id of neu.filter((x) => x !== "ka_kopf_toggle")) assert.ok(!/nur: \(\) => !!\(?ICH/.test(zeile(id)), `Hilfe ${id} für alle`);
assert.ok(/versionNeuer\(x\.seit, st\.stand\)/.test(app), "seit markiert Neues (Tipp des Tages / 🆕)");

// geänderte Einträge: alte Bedienung nicht mehr beschrieben
assert.ok(!/⌃⌃/.test(zeile("kopf_effekte")) && /vier Punkten/.test(zeile("kopf_effekte")), "kopf_effekte: ein Knopf statt ⌃/⌃⌃");
assert.ok(/vier Punkten/.test(zeile("kopf_knopf")) && /Lange drücken/.test(zeile("kopf_knopf")) && /4×/.test(zeile("kopf_knopf")), "kopf_knopf: vier Stufen, lange drücken");
assert.ok(/👀 Nur ausgeblendete zeigen/.test(zeile("kachel_aus")) && /🙈/.test(zeile("kachel_aus")), "kachel_aus: 👀/🙈");
assert.ok(!/„✅ Erstattet“/.test(zeile("eingangskorb")) && /📄 Antrag als PDF ansehen/.test(zeile("eingangskorb")) && /✅ Als erstattet markieren …/.test(zeile("eingangskorb")), "eingangskorb: PDF statt Erstattet");
assert.ok(/6\.12\./.test(zeile("adventskalender")) && /20\.12\./.test(zeile("adventskalender")) && /🎁 Ja, den nehme ich/.test(zeile("adventskalender")) && !/Adventssonntagen wartet/.test(zeile("adventskalender")), "adventskalender: Preis-Türchen");
assert.ok(/eine von 20 Pflanzen/.test(zeile("mein_garten")) && /📖 Rezept ansehen/.test(zeile("mein_garten")), "mein_garten: 20 Pflanzen, Kräuterernte");
assert.ok(!/<b>Vorschlag einreichen<\/b>\. Dabei/.test(zeile("erklaervideos")) && /über 60 Videos/.test(zeile("erklaervideos")), "erklaervideos: allgemein, nicht nur 5");
const bf = app.split("\n").find((z) => z.includes('{ id: "b-bildschirmfoto",')) || "";
assert.ok(/🆘 Als Problem an …/.test(bf) && /💾 Aufs Handy speichern \/ teilen/.test(bf) && /💬 In einen Chat schicken/.test(bf), "Bildschirmfoto: Knöpfe wie im Programm");

// die genannten Knöpfe gibt es wirklich
for (const k of ["✏️ Ändern / ergänzen", "📋 <b>Als Tagesordnung übernehmen</b>", "🗂️ Besprechungsvorlage", "Protokoll schreiben", "📧 Kopie der E-Mail an mich", "🔄 Gegenvorschlag erlauben", "↔️ Gegenvorschlag", "👀 Nur ausgeblendete zeigen", "📋 Wer bekommt was", "📋 Einsatzplan – je Tag eine Seite", "📒 Buchungsliste", "⏳ Erinnerung vor Fristen", "💾 Aufs Handy speichern / teilen"])
  assert.ok(programm.includes(k) || readFileSync(new URL("../index.html", import.meta.url), "utf8").includes(k), "Knopf im Programm: " + k);
assert.ok(buero.includes('["📄 Antrag als PDF ansehen"') && buero.includes('"✅ Als erstattet markieren …"'), "Eingang: Erstattungs-Knöpfe");

// --- Erklär-Videos ---
const ob0 = videos.indexOf("const RG_OBERFLAECHE = ["), OB = videos.slice(ob0, videos.indexOf("\n];", ob0));
const obTitel = new Set([...OB.matchAll(/ t: "([^"]+)"/g)].map((m) => m[1]));
const rgOb = [...videos.matchAll(/rgOb\("([^"]+)"/g)].map((m) => m[1]);
assert.ok(rgOb.length >= 10, "Stationen aus „Oberfläche“ wiederverwendet");
for (const t of rgOb) assert.ok(obTitel.has(t), `rgOb("${t}") findet seine Station (sonst fällt sie still weg)`);
assert.ok(!rgOb.includes("⌃ Halb einrollen") && !rgOb.includes("⌃⌃ Ganz einrollen"), "Versteckte Helfer: keine alten Pfeil-Stationen");
const sp0 = videos.indexOf("const RG_SPEZIAL = ["), SP = videos.slice(sp0, videos.indexOf("\n];", sp0));
assert.ok(/rgOb\("⌃ Der Knopf oben"\)/.test(SP), "Versteckte Helfer zeigt den Kopf-Knopf");
assert.ok(/sel: \["#kaKopfKnoepfe \.ka-kopf-k"\][^\n]*mussSel: true, t: "👀 Der runde Knopf oben"/.test(OB) && /kaNurAus\(true\)[^\n]*kaNurAus\(false\)/.test(OB.slice(OB.indexOf("👀 Der runde Knopf oben"))), "Oberfläche: 👀/🙈 oben (ausgelassen, wenn kein Platz)");
assert.ok(!/mit den Pfeilen ein/.test(videos.slice(videos.indexOf("const RG_EFFEKTE"), videos.indexOf("const RG_EFFEKTE") + 3000)), "Effekte: Knopf statt Pfeile");
const tf0 = videos.indexOf("const RG_TERMINFINDEN = ["), TF = videos.slice(tf0, videos.indexOf("\n];", tf0));
for (const t of ["🔄 Gegenvorschlag erlauben?", "✏️ Ändern / ergänzen", "📋 Als Tagesordnung übernehmen", "📝 Protokoll schreiben"]) assert.ok(TF.includes(`t: "${t}"`), "Termin-Video: " + t);
assert.ok(/\$\("rgTfBespr"\)\?\.remove\(\); rgTerminfindenUmfrage\(\)/.test(TF), "Beispiel-Besprechung verschwindet wieder");
assert.ok(/function rgTerminfindenBespr\(stufe\)/.test(videos) && /k\.inert = true/.test(videos), "Beispiel nur Anzeige (inert, nichts gemerkt)");
const vs0 = videos.indexOf("const RG_VORSCHLAG = ["), VS = videos.slice(vs0, videos.indexOf("\n];", vs0));
assert.ok(VS.includes('t: "↔️ Gegenvorschlag"'), "Vorschlag-Video: Gegenvorschlag");
for (const [id, st] of [["oberflaeche", "4"], ["spezial", "2"], ["terminfinden", "2"], ["vorschlag", "2"], ["effekte", "4"]])
  assert.ok(new RegExp(`\\{ id: "${id}", stand: "${st}"`).test(app), `Video ${id}: neue Fassung ${st} (Bewertungen getrennt)`);

// --- Lupe und Twinkey ---
for (const id of ["kopf_knopf", "ka_kopf_toggle", "sprache_flagge", "netz_balken", "offline_push", "kontakt_extern", "ta_aendern", "ta_tagesordnung", "ta_protokoll", "gegenvorschlag_thema", "buchungsliste", "preis_etiketten"])
  assert.ok(hilfe.includes(`hzZuEintrag("h:${id}")`) || hilfe.includes(`"h:${id}")`), "Lupe/Twinkey führt zu " + id);
for (const m of hilfe.matchAll(/hzZuEintrag\("h:([a-z_0-9]+)"\)/g)) assert.ok(ids.has(m[1]), "Lupe/Twinkey: Hilfe h:" + m[1] + " gibt es");
for (const id of ["kopf-einrollen", "ausgeblendete-kacheln", "sprache-englisch", "verbindungs-balken", "frist-erinnerung", "kontakt-extern", "terminanfrage-aendern", "tagesordnung", "besprechung-protokoll", "gegenvorschlag-erlauben", "gegenvorschlag-thema", "offline-meldung"])
  assert.ok(hilfe.includes(`{ id: "${id}",`), "Twinkey-Frage " + id);
assert.ok(/\{ id: "buchungsliste", [^\n]*nur: \(\) => !!\(ICH\?\.vorstand \|\| ICH\?\.admin\)/.test(hilfe), "Twinkey: Buchungsliste nur Clubleitung");
assert.ok(!/\(ICH\?\.admin \? \[\[/.test(hilfe), "Lupe: keine Admin-Einträge (Wunsch Hansi 26.11.2026)");
console.log("hilfe-2955: ok");
