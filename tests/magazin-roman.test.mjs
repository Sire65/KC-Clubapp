// KC-CLUB-MAGAZIN-ROMAN (06.11.2026): Fortsetzungsroman „Hinter dem Pass“ – Folge 1 von 12 in Club-Küche Nr. 1. Aufruf: node tests/magazin-roman.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), html = lies("index.html");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("const MAG = {")) + "; const MAG = { jahr: 2027, monat: 1 };"
  + teil.slice(teil.indexOf("const MAG_RUBRIK_ART"), teil.indexOf("async function magStart"));
const { MAG_AUSGABEN, MAG_RUBRIKEN, magHeftHtml } = new Function("esc", "jsArg", code + "; return { MAG_AUSGABEN, MAG_RUBRIKEN, magHeftHtml };")(esc, JSON.stringify);
assert.ok(MAG_RUBRIKEN.some((r) => r.id === "roman" && r.t === "Fortsetzungsroman"), "Rubrik Fortsetzungsroman im Inhaltsverzeichnis");
const r = MAG_AUSGABEN[1].roman;
// Kopf wie in der Übergabe
assert.equal(r.reihe, "HINTER DEM PASS"); assert.equal(r.unter, "Ein Roman aus der Welt der Profiküche"); assert.equal(r.folge, 1); assert.equal(r.von, 12); assert.equal(r.titel, "Die Neue");
// vollständig: alle Zwischenüberschriften, Anfang und Schluss, Trüffelbestände 240 / 180 / 60
const h = r.text.filter(([a]) => a === "h").map(([, t]) => t);
assert.deepEqual(h, ["Ein Morgen voller Erwartungen", "Hinter den Kulissen", "Der junge Mann mit dem schiefen Lächeln", "Die erste gemeinsame Stunde", "Ein Blick, der Fragen aufwarf", "Wenn der Bondrucker erwacht", "Ein kleiner Fehler", "Ein Gespräch nach Feierabend", "Sechzig Gramm"]);
const alles = r.text.filter(([a]) => a === "p").map(([, t]) => t).join("\n");
assert.ok(alles.startsWith("Um sieben Minuten vor sieben stand Lena Hartmann") && /eine entscheidende Rolle spielen sollte\.$/.test(alles), "Anfang und Schluss");
assert.ok(alles.includes("**Burgunder-Trüffel – 240 Gramm.**") && alles.includes("**180 Gramm.**") && alles.includes("Sechzig Gramm fehlten."), "Trüffelbestände");
assert.equal(r.text.length, 182, "nicht gekürzt: 9 Zwischenüberschriften + 173 Absätze (sanft überarbeitet 11.11.2026)"); assert.equal(alles.split(/\s+/).length, 2694, "nicht gekürzt: Wortzahl (sanfte Überarbeitung 11.11.2026)");
assert.equal(r.ende[0], "**Fortsetzung in der nächsten Ausgabe**");
// Kein internes Material (Figurenbibel, Handlungsbogen, Täterakte, Zeitachse) im Programm. Alle 12 Folgen sind beauftragt; Folge 12 (Finale, mit Auflösungen)
// freigegeben von Hansi 09.11.2026 („Spiele auch Folge 12 ein in das Heft mit Zeichnungen“ / „Ja, heute mit einspielen“) – Spoiler daher nur noch in Folge 12 erlaubt.
// Verena Falk, Karl Luttermann und Mara Seifert treten ab Folge 9 in der veröffentlichten Handlung auf; ihre geheimen Pläne (Dossiers) bleiben draußen.
for (const w of [/ehemalige Partnerin/i, /Figurenbibel\.md|handlungsbogen|zeitachse-folgen|Geheimakte/i, /"folge":\s*1[3-9]\b/]) assert.ok(!w.test(teil.replace("interne Planung (Figurenbibel, Handlungsbogen)", "")), "verboten: " + w);
// Auflösungen nur in Folge 12 (Reimers Feinkost taucht als Lieferant schon früher auf – gewollte Spur; die Aufklärung erst im Finale)
for (let n = 1; n <= 11; n++) assert.ok(!/Dann Konrad Reimers\.|zusätzlichen kleinen Kühltasche|\bLuca\b/.test(JSON.stringify(MAG_AUSGABEN[n].roman)), "Spoiler vor Folge 12 in Heft " + n);
// Darstellung: Bilder mit Alt-Text, fehlende Datei als Bildplatz, Ende abgesetzt
const out = magHeftHtml("roman", r);
assert.equal(r.bilder.length, 4); assert.ok(r.bilder.every((b) => b.alt && /^magazin\/roman\/0[1-5]-.+\.webp$/.test(b.datei)));
for (const b of r.bilder) assert.ok(out.includes(esc(b.alt.replace(/^Bleistiftskizze: /, ""))) || out.includes(esc(b.alt)), "Bild " + b.wo);
for (const b of r.bilder.filter((x) => x.da)) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); assert.ok(out.includes(`src="${b.datei}"`) && out.includes('loading="lazy"')); }
assert.ok(r.bilder.every((b) => b.da), "alle vier Skizzen eingesetzt");
assert.ok(out.includes('class="mag-roman-ende"') && out.includes("<b>Fortsetzung in der nächsten Ausgabe</b>"));
assert.ok(!/<p><\/p>/.test(out));
for (const k of [".mag-roman ", ".mag-roman-text ", ".mag-roman-bild ", ".mag-roman-ende "]) assert.ok(html.includes(k), "CSS " + k);
// Lektorat 09.11.2026 (Wunsch Hansi): Sprach- und Logikkorrekturen, danach Handlungs-Ungereimtheiten behoben („Texte ein bisschen umbauen“) – Wortzahlen danach; Absatzzahlen unverändert (nichts gekürzt)
// Folge 2 in Heft 2 (Neufassung „Ein Abend, der alles verändert“), vollständig; Heft 1 unverändert
const r2 = MAG_AUSGABEN[2].roman;
assert.equal(MAG_AUSGABEN[2].erscheint, "2027-02-01"); assert.equal(r2.folge, 2); assert.equal(r2.titel, "Die verschwundenen Trüffel"); assert.equal(r2.untertitel, "Ein Abend, der alles verändert");
assert.deepEqual(r2.text.filter(([a]) => a === "h").map(([, t]) => t), ["Achtundzwanzig Teller – und kein Ofen", "Ein Morgen mit offenen Fragen", "Der Mann mit dem Brotkorb", "Ein Platz am Pass", "Sophie weiß mehr", "Der Abend beginnt", "Die Entscheidung", "Ein Kompliment – und ein Blick", "Was Lena nicht hören sollte"]);
assert.equal(r2.text.filter(([a]) => a === "p").length, 204, "Folge 2 nicht gekürzt (sanft überarbeitet 11.11.2026)"); assert.equal(r2.text.filter(([a]) => a === "s").length, 5, "Szenenwechsel");
const alles2 = r2.text.filter(([a]) => a === "p").map(([, t]) => t).join("\n");
assert.ok(/sechs Wochen/.test(alles2) && !alles2.includes("Es war erst ihr zweiter Arbeitstag.") && !/am zweiten Tag/.test(alles2), "Folge 2: Zeitachse sechs Wochen, nicht der zweite Arbeitstag");
assert.ok(r2.vorspann.startsWith("Sechs Wochen nach ihrem Ausbildungsbeginn") && r2.bilder.some((b) => b.wo === "absatz:199"), "Folge 2: neuer Vorspann, Schlussbild hinter Absatz 199");
assert.ok(alles2.startsWith("„Das darf jetzt nicht wahr sein!“") && alles2.endsWith("schon lange vor ihrem ersten Arbeitstag begonnen hatte."), "Anfang und Schluss Folge 2");
assert.ok(alles2.includes("„Du kannst nicht so tun, als hätte es uns beide nie gegeben.“") && alles2.includes("achtundzwanzig vorgewärmte Teller") && alles2.includes("Kartoffeltaler"), "Neufassung, nicht die verworfene");
assert.ok(r2.bisher.startsWith("Lena Hartmann hat ihre Ausbildung") && r2.ende.includes("**Folge 3 – Alte Geschichten**"));
const out2 = magHeftHtml("roman", r2);
assert.ok(out2.includes('class="mag-roman-bisher"') && out2.includes('class="mag-roman-untertitel"') && (out2.match(/mag-roman-pause/g) || []).length === 5);
assert.equal(r2.bilder.length, 3); assert.ok(r2.bilder.every((b) => !b.da && /^magazin\/roman\/f2-/.test(b.datei)) && !/<img/.test(out2), "Folge 2: noch keine Zeichnungen → Bildplatz, kein kaputtes Bild");
for (const k of [".mag-roman-bisher ", ".mag-roman-pause ", ".mag-roman-untertitel "]) assert.ok(html.includes(k), "CSS " + k);
// Folge 3 in Heft 3 (Entwurf): vollständig nach folgen/03-alte-geschichten.md, Bildplätze statt fehlender Zeichnungen
{ const r = MAG_AUSGABEN[3].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[3].erscheint, "2027-03-01"); assert.equal(r.folge, 3); assert.equal(r.titel, "Alte Geschichten"); assert.equal(r.untertitel, "Als die Alte Mühle plötzlich stillstand");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Wo ist Lena?", "Ein Satz, der blieb", "Was einmal gewesen war", "Der Mann, der schweigt", "Fünf Wochen, die etwas veränderten", "Der große Abend", "Der Geruch", "Jemand fehlt", "Die Alte Mühle bleibt dunkel", "Der Bäcker mit dem Schlüssel", "Was wirklich zählt", "Ein Kuss im Schatten"]);
  assert.equal(p.length, 191, "Folge 3 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 3394, "Folge 3 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "„Alle raus! Sofort!“"); assert.equal(p.at(-1), "Und plötzlich wurde ihm klar, dass dieser Abend, an dem die Alte Mühle stillgestanden hatte, ihn vielleicht noch etwas ganz anderes kosten würde.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 4 – Ein Kuss zu viel**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.da && b.datei.startsWith("magazin/roman/f3-") && b.alt.startsWith("Bleistiftskizze: ")));
  assert.ok(!/Kuss/.test(r.bilder.map((b) => b.alt).join(" ")), "Bildtexte verraten nichts");
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 3, "Folge 3: alle drei Zeichnungen"); }
// Folge 4 in Heft 4 (Entwurf): vollständig nach folgen/04-ein-kuss-zu-viel.md, Bildplätze statt fehlender Zeichnungen
{ const r = MAG_AUSGABEN[4].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[4].erscheint, "2027-04-01"); assert.equal(r.folge, 4); assert.equal(r.titel, "Ein Kuss zu viel"); assert.equal(r.untertitel, "Der falsche Schnitt");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Ein Bild, das nicht verschwinden wollte", "Zwei Wochen später", "Kartoffeln sind keine Strafe", "Zwischen Jonas und Sophie", "Der zweite Montag", "Der falsche Schnitt", "Zwanzig Minuten", "Die Regionalbahn", "In der Notaufnahme", "Der Mann im Porsche"]);
  assert.equal(p.length, 179, "Folge 4 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 3000, "Folge 4 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "Am Morgen nach dem Brand sah die Alte Mühle aus, als habe jemand ihr den Atem genommen."); assert.equal(p.at(-1), "Jetzt fragte sie sich, ob sie morgen überhaupt noch dorthin zurückkehren durfte.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 5 – Die rote Marzipanrose**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.datei.startsWith("magazin/roman/f4-") && b.alt.startsWith("Bleistiftskizze: ")));
  assert.ok(!/Kuss/.test(r.bilder.map((b) => b.alt).join(" ")), "Bildtexte verraten nichts");
  // KC-CLUB-MAGAZIN-ZEICHNUNGEN (08.11.2026): nur der Bahnübergang ist eingesetzt; Gemüseposten (Jonas/Mike nicht nach Figurenreferenz) und Klinik (Küchenleute im Hintergrund) zurückgehalten
  assert.deepEqual(r.bilder.map((b) => b.da), [false, true, false]);
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 1 && (o.match(/mag-roman-bild/g) || []).length === 3); }
// Folge 5 in Heft 5 (Mai 2027, Entwurf): vollständig nach folgen/05-die-rote-marzipanrose.md, Bildplätze statt fehlender Zeichnungen
const r5 = MAG_AUSGABEN[5].roman;
assert.equal(MAG_AUSGABEN[5].erscheint, "2027-05-01"); assert.equal(r5.folge, 5); assert.equal(r5.von, 12); assert.equal(r5.titel, "Die rote Marzipanrose"); assert.equal(r5.untertitel, "Was ein Wort anrichten kann");
assert.equal(r5.reihe, "HINTER DEM PASS"); assert.equal(r5.unter, "Ein Roman aus der Welt der Profiküche");
assert.deepEqual(r5.text.filter(([a]) => a === "h").map(([, t]) => t), ["Das Wort, das blieb", "Die Tür bleibt offen", "Drei Aussagen", "Ein Teller ohne Hunger", "Was der Vater nicht hören wollte",
  "Ein Brief, der nicht abgeschickt wurde", "Die schwerste Entschuldigung", "Die Stelle, an der nichts mehr gesagt werden musste", "Die Rose", "Nicht alles gehört jemandem",
  "Zwei Teller und ein unausgesprochener Satz", "Die andere Liste"]);
const alles5 = r5.text.filter(([a]) => a === "p").map(([, t]) => t);
assert.equal(alles5.length, 251, "Folge 5 nicht gekürzt: Absätze"); assert.equal(alles5.join(" ").split(/\s+/).length, 4216, "Folge 5 nicht gekürzt: Wortzahl des Lesetexts (gezählt im Manuskript)");
assert.equal(alles5[0], "„Fristlos.“"); assert.ok(alles5.at(-1).endsWith("warum ich diesen Eintrag nicht unterschrieben habe.“"), "Anfang und Schluss Folge 5");
assert.ok(alles5.some((t) => t.includes("18.42 Uhr. Rücknahme Mehrwegkisten.")) && alles5.some((t) => t.includes("Marzipan")), "Cliffhanger und Marzipanrose");
assert.ok(r5.bisher.startsWith("Seit rund drei Monaten macht Lena Hartmann ihre Ausbildung") && r5.vorspann.startsWith("Lena soll schuld sein"));
assert.deepEqual(r5.ende.slice(0, 2), ["**Fortsetzung in der nächsten Ausgabe**", "**Folge 6 – Die Kündigung**"]);
assert.ok(!JSON.stringify(r5).includes("<!--") && !/BILD \d/.test(JSON.stringify(r5)), "Bildhinweise der Vorlage nicht als Lesetext");
const out5 = magHeftHtml("roman", r5);
assert.equal(r5.bilder.length, 2); assert.ok(r5.bilder.every((b) => b.da && /^magazin\/roman\/f5-/.test(b.datei) && b.alt.startsWith("Bleistiftskizze: ")) && (out5.match(/<img /g) || []).length === 2, "Folge 5: beide Zeichnungen");
assert.ok(out5.includes('class="mag-roman-bisher"') && (out5.match(/mag-roman-bild/g) || []).length === 2);
// alle eingesetzten Zeichnungen aller Hefte: Datei da, klein, Graustufen-WebP; Figurenreferenz/Kontaktbogen nie im Programm
for (const [nr, h] of Object.entries(MAG_AUSGABEN)) for (const b of (h.roman?.bilder || []).filter((x) => x.da)) {
  const f = new URL("../" + b.datei, import.meta.url), st = fs.statSync(f), kopf = fs.readFileSync(f).subarray(0, 12).toString("latin1");
  assert.ok(st.size > 5000 && st.size < 200000 && kopf.startsWith("RIFF") && kopf.endsWith("WEBP"), `Heft ${nr}: ${b.datei}`); }
assert.ok(!fs.readdirSync(new URL("../magazin/roman/", import.meta.url)).some((n) => /referenz|kontakt/i.test(n)), "keine internen Bilder");
// Folge 6 in Heft 6 (Entwurf): vollständig nach folgen/06-die-kuendigung.md
{ const r = MAG_AUSGABEN[6].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[6].erscheint, "2027-06-01"); assert.equal(r.folge, 6); assert.equal(r.titel, "Die Kündigung"); assert.equal(r.untertitel, "Was in einer Küche verloren gehen kann");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Die Tür zum Nebenflur", "Was eine Küche zusammenhält", "Der Mann mit den guten Händen", "Die Auswertung", "Achtunddreißig Gäste", "Ein Service, der nicht auseinanderfiel", "Ein Gespräch, das keiner hören sollte", "Die Kündigung", "Der leere Posten", "Die Rechnung des nächsten Tages", "Zehn nach sechs"]);
  assert.equal(p.length, 209, "Folge 6 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 3442, "Folge 6 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "Matthias Voss wartete."); assert.equal(p.at(-1), "„Herr Voss liegt im Krankenhaus.“");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 7 – Am Limit: Die Küche ohne Chef**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 2 && r.bilder.every((b) => b.datei.startsWith("magazin/roman/f6-") && b.alt.startsWith("Bleistiftskizze: ")));
  for (const b of r.bilder) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(b.da && st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); }
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 2 && o.includes('loading="lazy"'), "Folge 6: beide Zeichnungen eingesetzt"); }
// Folge 7 in Heft 7 (Entwurf): vollständig nach folgen/07-am-limit-die-kueche-ohne-chef.md
{ const r = MAG_AUSGABEN[7].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[7].erscheint, "2027-07-01"); assert.equal(r.folge, 7); assert.equal(r.titel, "Am Limit: Die Küche ohne Chef"); assert.equal(r.untertitel, "Ein Wochenende, das keiner vergessen wird");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Zehn nach sechs", "Die Liste an der Wand", "Herr Bertram zieht die Kochjacke an", "Die Kunst des Weglassens", "Freitag, sechzehn Uhr einundvierzig", "Der Pass", "Ein Satz aus dem Krankenhaus", "Samstag: Die andere Rechnung", "Die Gesellschaft, die man absagte", "Sonntag: Der letzte Topf", "Das, was niemand nachkochen kann", "Der Umschlag"]);
  assert.equal(p.length, 242, "Folge 7 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 4277, "Folge 7 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "„Was heißt, er liegt im Krankenhaus?“"); assert.equal(p.at(-1), "Und blieb stehen.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 8 – Der letzte freie Platz**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.datei.startsWith("magazin/roman/f7-") && b.alt.startsWith("Bleistiftskizze: ")));
  // Zeichnungen 07-01 bis 07-03 aus dem Übergabe-Zweig (09.11.2026), Gesichter geprüft
  assert.ok(r.bilder.every((b) => b.da)); for (const b of r.bilder.filter((x) => x.da)) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); } const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 3, "Folge 7: alle drei Zeichnungen"); }
// Folge 8 in Heft 8 (Entwurf): vollständig nach folgen/08-der-letzte-freie-platz.md
{ const r = MAG_AUSGABEN[8].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[8].erscheint, "2027-08-01"); assert.equal(r.folge, 8); assert.equal(r.titel, "Der letzte freie Platz"); assert.equal(r.untertitel, "Was man nicht aufgeben darf");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Der Knopf", "Der Mut, jemanden um etwas zu bitten", "Die Nachricht aus Portugal", "Die Frau, die keine Unordnung mochte", "Ein Teller, der etwas beweist", "Der Mann am Meer", "Dreiundvierzig Minuten zu spät", "Nicht die Heldin, nicht der Held", "Der zweite Versuch", "Eine Frage der Fahrt", "Was in einer Tasche Platz hat", "Die Nachricht"]);
  assert.equal(p.length, 242, "Folge 8 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 3832, "Folge 8 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "Auf dem Bildschirm standen nur zwei Wörter."); assert.equal(p.at(-1), "Eigentlich.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 9 – Auf Messers Schneide**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.datei.startsWith("magazin/roman/f8-") && b.alt.startsWith("Bleistiftskizze: ")));
  // 08-01 und 08-03 eingesetzt; 08-02 (Videogespräch) zurückgehalten: Jonas dort mit dunklen Locken statt sandblond (Figurenvorgabe)
  assert.deepEqual(r.bilder.map((b) => b.da), [true, false, true], "Folge 8: Verena und Abfahrt da, Schuster-Bild zurückgehalten"); for (const b of r.bilder.filter((x) => x.da)) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); } const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 2 && (o.match(/mag-roman-bild/g) || []).length === 3); }
// Folge 6: Timo ist kein überführter Dieb – gekündigt wird wegen dokumentierter Pflichtverletzungen
assert.ok(MAG_AUSGABEN[6].roman.text.some(([, x]) => x.includes("Wir können Ihnen keinen Diebstahl nachweisen")), "Folge 6 ohne Diebstahlsbehauptung");
// Folge 9 in Heft 9 (September 2027, Entwurf): vollständig nach folgen/09-auf-messers-schneide.md, Bildplätze statt fehlender Zeichnungen
{ const r = MAG_AUSGABEN[9].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[9].erscheint, "2027-09-01"); assert.equal(r.folge, 9); assert.equal(r.titel, "Auf Messers Schneide"); assert.equal(r.untertitel, "Kein Koch lässt einen Kollegen im Regen stehen");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Fünf Uhr morgens", "Ein Knall", "Beinahe", "Sieben Uhr achtundfünfzig", "Zwölf Plätze", "Ein Fehler, der nicht kleiner wurde", "Neunzig Minuten", "Die andere Küche", "Der Geschmack der Entscheidung", "Drei Namen", "Der Anruf", "Etwas zu feiern", "Eine Frage in der Bäckerei", "Eine kleine Trattoria", "Jemand am Fenster"]);
  assert.equal(p.length, 290, "Folge 9 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 4940, "Folge 9 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "„Du siehst aus, als hättest du die Nacht durchgearbeitet.“"); assert.equal(p.at(-1), "Noch nicht.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 10 – Gerüchte und Gezeiten**");
  assert.ok(p.some((t) => t.includes("Zander")) && !p.some((t) => t.includes("Rehrücken")), "Wettbewerbsgericht Zander, kein Rehrücken");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 2 && r.bilder.every((b) => b.da && b.datei.startsWith("magazin/roman/f9-") && b.alt.startsWith("Bleistiftskizze: "))); for (const b of r.bilder.filter((x) => x.da)) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); }
  assert.deepEqual(r.bilder.map((b) => b.wo), ["h:Fünf Uhr morgens", "h:Neunzig Minuten"], "Bildstellen laut Einbauanweisung");
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 2, "Folge 9: beide Zeichnungen"); }
// Folge 10 in Heft 10 (Oktober 2027, Entwurf): vollständig nach folgen/10-geruechte-und-gezeiten.md, beide Zeichnungen
{ const r = MAG_AUSGABEN[10].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[10].erscheint, "2027-10-01"); assert.equal(r.folge, 10); assert.equal(r.titel, "Gerüchte und Gezeiten"); assert.equal(r.untertitel, "Der Preis eines Traums");
  assert.deepEqual(r.text.filter(([a]) => a === "h").map(([, t]) => t), ["Ein Satz bekommt Beine", "Nicht jeder muss alles wissen", "Ein Gespräch im Lager", "Die zweite Handschrift", "Ein ungewohnter Platz für einen Küchenchef", "Ein Angebot, das noch keines ist", "Eine andere Perspektive", "Kino ohne Hintergedanken", "Die Rechnung auf der anderen Seite", "Die Besprechung"]);
  assert.equal(p.length, 192, "Folge 10 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 3869, "Folge 10 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "„Na, war die Pasta gut?“"); assert.equal(p.at(-1), "Und plötzlich klang es, als könnte es jederzeit verstummen.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der nächsten Ausgabe**" && r.ende[1] === "**Folge 11 – Zwischen den Ufern**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 2 && r.bilder.every((b) => b.da && b.alt.startsWith("Bleistiftskizze: ")));
  assert.deepEqual(r.bilder.map((b) => b.wo), ["h:Eine andere Perspektive", "h:Kino ohne Hintergedanken"], "Bildstellen laut Einbauanweisung");
  for (const b of r.bilder) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); }
  assert.equal(r.bilder[1].datei, MAG_AUSGABEN[5].roman.bilder.find((b) => b.wo === "h:Die Rose").datei, "Erinnerungsbild = dieselbe Datei wie in Folge 5");
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 2); }
// Folge 11 in Heft 11 (November 2027, Entwurf): vollständig nach folgen/11-zwischen-den-ufern.md, drei Zeichnungen
{ const r = MAG_AUSGABEN[11].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t), h = r.text.filter(([a]) => a === "h").map(([, t]) => t);
  assert.equal(MAG_AUSGABEN[11].erscheint, "2027-11-01"); assert.equal(r.folge, 11); assert.equal(r.titel, "Zwischen den Ufern"); assert.equal(r.untertitel, "Wenn Bleiben nicht dasselbe ist wie Festhalten");
  assert.deepEqual(h, ["Der Tisch, an dem niemand aufstand", "Ein Blatt Papier gegen die Angst", "Die Frau, die Tisch sechs kannte", "Die Nacht der alten Rezepte", "Ein Abend mit vier Gängen", "Was ein guter Teller nicht beweist", "Die Rechnung am nächsten Morgen", "Der Anruf aus der Heimat", "Eine andere Art von Verantwortung", "Der Abschied, der keiner war", "Der Satz, den Jonas zurückwünschte", "Zwei Menschen an einem Bahnhof", "Das Zimmer mit der offenen Tür", "Zwischen zwei Leben", "Die Frage, die niemand hören sollte", "Zwei Nachrichten"]);
  assert.ok(h.indexOf("Der Abschied, der keiner war") < h.indexOf("Der Satz, den Jonas zurückwünschte") && h.indexOf("Der Satz, den Jonas zurückwünschte") < h.indexOf("Zwei Menschen an einem Bahnhof"), "Lektorat: Abschied vor dem Satz und vor der Bahnfahrt");
  assert.equal(p.length, 262, "Folge 11 nicht gekürzt: Absätze"); assert.equal(p.join(" ").split(/\s+/).length, 4860, "Folge 11 nicht gekürzt: Wortzahl des Lesetexts");
  assert.equal(p[0], "Als Bertram zu Ende gesprochen hatte, blieb es im Gastraum still."); assert.equal(p.at(-1), "Und schrieb eine Antwort, die Lena erst am Abend lesen würde.");
  assert.ok(r.bisher && r.ende[0] === "**Fortsetzung in der letzten Ausgabe**" && r.ende[1] === "**Folge 12 – Alle Sterne dieser Welt**");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.da && b.datei.startsWith("magazin/roman/f11-") && b.alt.startsWith("Bleistiftskizze: ")));
  assert.deepEqual(r.bilder.map((b) => b.wo), ["absatz:47",  "absatz:160",  "absatz:188"], "Bildstellen laut Manuskript");
  for (const b of r.bilder) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); }
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 3); }
// Folge 12 in Heft 12 (Dezember 2027, Finale): vollständig nach folgen/12-alle-sterne-dieser-welt.md, drei Zeichnungen, Lektorat 09.11.2026
{ const r = MAG_AUSGABEN[12].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t), h = r.text.filter(([a]) => a === "h").map(([, t]) => t), a = p.join(" ");
  assert.equal(MAG_AUSGABEN[12].erscheint, "2027-12-01"); assert.equal(r.folge, 12); assert.equal(r.von, 12); assert.equal(r.titel, "Alle Sterne dieser Welt"); assert.equal(r.untertitel, "Was bleibt, wenn alles auf dem Spiel stand");
  assert.deepEqual(h, ["Die Nachricht, die keiner hörte", "Der Preis der Freiheit", "Drei Wochen, in denen nichts sicher war", "Die Zahlen hinter den Trüffeln", "Der Mann, dem niemand geglaubt hatte", "Ein Haus bekommt eine zweite Chance", "Die schwere Kunst, nicht alles allein zu tragen", "Ein Besucher mit einer Rezeptkarte", "Was Paul verlor", "Eine Frau, die weitergeht", "Die Insel und die Frau im Wind", "Ein letzter Versuch", "Der Tag der Prüfung", "Die Entscheidung von damals", "Wieder an der Mühle", "Alle Sterne dieser Welt"]);
  assert.equal(p.length, 288, "Folge 12 nicht gekürzt: Absätze"); assert.equal(a.split(/\s+/).length, 5715, "Folge 12 nicht gekürzt: Wortzahl des Lesetexts (nach Lektorat)");
  assert.ok(p[0].startsWith("*Du musst heute nichts entscheiden.")); assert.equal(p[p.length - 1], "Und hinter dem Pass begann das Leben.");
  assert.ok(r.bisher && r.ende[0] === "**Ende des Romans „Hinter dem Pass“**");
  // Lektorat: Voss ist zu Hause (Folge 11), beim Timo-Gespräch nur telefonisch da; eine Mappe mit zwei Blättern (Folge 11); Wettbewerb wie Folge 9
  assert.ok(!/Voss im Krankenhaus|Voss schloss kurz die Augen|Voss lächelte traurig|beiden Mappen|zweite Mappe|verschwundene Gemüse|jetzigen Küchenchef/.test(a), "Ungereimtheiten Folge 12");
  assert.ok(!JSON.stringify(r).includes("<!--") && r.bilder.length === 3 && r.bilder.every((b) => b.da && b.datei.startsWith("magazin/roman/f12-") && b.alt.startsWith("Bleistiftskizze: ")));
  assert.deepEqual(r.bilder.map((b) => b.wo), ["absatz:92",  "absatz:243",  "absatz:288"], "Bildstellen laut Einbauanweisung");
  for (const b of r.bilder) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); }
  const o = magHeftHtml("roman", r); assert.ok((o.match(/<img /g) || []).length === 3); }
console.log("magazin-roman: ok");
// KC-CLUB-MAGAZIN-STAFFEL-2 (11.11.2026, Wunsch Hansi „Ja mach Lektorat und einbauen“ / „Alle 12 jetzt“): Staffel 2 „Was der Mühlbach weiß“ in den Heften 13–24 (2028), Entwurf
{ const titel = ["Das Wasser am Mühlrad", "Ein Kanister im Schnee", "Schaum am Wehr", "Silberne Bäuche", "Was das Labor sagt", "Ralles Geheimnis", "Die Fabrik am Oberlauf", "Ein Gast mit Notizbuch", "Die Pacht", "Der Sack im Schuppen", "Die Liste", "Forelle Mühlbach"];
  for (let i = 1; i <= 12; i++) {
    const h = MAG_AUSGABEN[12 + i], r = h.roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t), o = magHeftHtml("roman", r), js = JSON.stringify(r);
    assert.equal(h.erscheint, `2028-${String(i).padStart(2, "0")}-01`, "Heft " + (12 + i) + " erscheint");
    assert.equal(r.reihe, "HINTER DEM PASS"); assert.equal(r.staffel, "Staffel 2 – Was der Mühlbach weiß"); assert.equal(r.folge, i); assert.equal(r.von, 12); assert.equal(r.titel, titel[i - 1]);
    assert.ok(r.vorspann && r.bisher && r.untertitel && p.length > 80 && p.join(" ").split(/\s+/).length > 2500, "Folge " + i + " vollständig");
    assert.ok(r.notiz && o.includes('class="mag-roman-notiz"') && o.includes('class="mag-roman-staffel"') && o.includes("Story by Hans-Joachim Koch"), "Notizbuch, Staffel, Nachweis");
    assert.ok(!/<!--|BILD \d|zeitachse|freigabe:|status:/.test(js) && !/<p><\/p>/.test(o), "keine Redaktionshinweise");
    assert.ok(r.ende[0] === (i === 12 ? "**Ende der zweiten Staffel**" : i === 11 ? "**Fortsetzung in der letzten Ausgabe**" : "**Fortsetzung in der nächsten Ausgabe**"));
    if (i < 12) assert.equal(r.ende[1], `**Folge ${i + 1} – ${titel[i]}**`);
    // Auflösung (Geständnis, Täter) erst in Folge 12
    if (i < 12) assert.ok(!/räumte Gerd Hollmann|Hollmann gesteht|die Tat ein/.test(js), "Spoiler vor Folge 12 (Staffel 2) in Heft " + (12 + i));
  }
  const r = MAG_AUSGABEN[24].roman, o = magHeftHtml("roman", r);
  assert.ok(r.rezept && o.includes('class="mag-roman-rezept"') && o.includes("Gefüllte Bachforelle „Mühlbach“") && !/Meerrettich/.test(JSON.stringify(r.rezept)), "Rezept Forelle Mühlbach, ohne Meerrettich");
  assert.ok(!/Ralle hat es mir erlaubt/.test(r.notiz) && /Voss hat es mir erlaubt/.test(r.notiz), "Rezept gehört Voss");
  for (const k of [".mag-roman-notiz ", ".mag-roman-rezept ", ".mag-roman-staffel "]) assert.ok(html.includes(k), "CSS " + k);
  // internes Material der Staffel 2 nie im Programm
  assert.ok(!/handlungsentwurf|stilprobe|kontinuitaet-staffel|AUFTRAG-L|lektorat-\d/i.test(teil), "keine internen Staffel-2-Dateien"); }
console.log("magazin-roman Staffel 2: ok");
// KC-CLUB-MAGAZIN-STAFFEL-1-SANFT (11.11.2026, Wunsch Hansi „Ja, überarbeite Staffel 1 sanft“): Rhythmus wie Staffel 2 (längere Absätze), Lenas Notizbuch in jeder Folge
for (let n = 1; n <= 12; n++) { const r = MAG_AUSGABEN[n].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t), w = p.join(" ").split(/\s+/).length, o = magHeftHtml("roman", r);
  assert.ok(w / p.length >= 15, "Folge " + n + ": Absätze zusammengeführt (Ø ≥ 15 Wörter)"); assert.ok(r.notiz && r.notiz.length > 80 && o.includes('class="mag-roman-notiz"') && !r.staffel, "Folge " + n + ": Lenas Notizbuch, keine Staffelzeile"); }
console.log("magazin-roman Staffel 1 sanft: ok");
// Antworten Hansi 11.11.2026: Folge 2 – Jonas brät den Zander, Voss hält den Pass; Folge 3 – Walnussbrot-Probierscheibe vertrocknet; Folge 6/7 – dritter Gast heißt Kegelclub „Gut Holz“;
// Staffel 2 – Leon ist Sous-Chef (wie am Ende von Staffel 1)
{ const t = (n) => JSON.stringify(MAG_AUSGABEN[n].roman);
  assert.ok(!/Voss trat selbst an den Fischposten/.test(t(2)) && /legte Jonas die Zanderfilets/.test(t(2)), "Folge 2: wer brät den Zander");
  assert.ok(/Probierscheibe von damals/.test(t(3)) && !/noch keine Minute, es zu probieren/.test(t(3)), "Folge 3: Walnussbrot");
  assert.ok(!/Jagdclub/.test(t(6) + t(7)) && /Kegelclub „Gut Holz“/.test(t(6)) && /Kegelclub/.test(t(7)), "Folge 6/7: Kegelclub");
  assert.ok(/Leon als Sous-Chef/.test(t(13)) && !/Leon als erfahrener Geselle/.test(t(13)), "Staffel 2: Leon Sous-Chef"); }
console.log("magazin-roman Antworten Hansi: ok");
// KC-CLUB-MAGAZIN-STAFFEL-2-BILDER (11.11.2026, Wunsch Hansi „Bau die fertigen Bilder schon mit ein“): geprüfte Zeichnungen Staffel 2, Graustufen-WebP
{ const b14 = MAG_AUSGABEN[14].roman.bilder, b15 = MAG_AUSGABEN[15].roman.bilder;
  assert.deepEqual(b14.map((b) => b.wo), ["absatz:1", "h:Vierzig Kilo"]); assert.deepEqual(b15.map((b) => b.wo), ["absatz:27"]);
  assert.ok(MAG_AUSGABEN[15].roman.text.filter(([a]) => a === "p")[26][1].startsWith("Sie stellte die Tonne ab"), "Schaum-Bild hinter dem Foto-Absatz");
  for (const b of [...b14, ...b15]) { assert.ok(b.da && /^magazin\/roman\/s2-0[23]-/.test(b.datei) && b.alt.startsWith("Bleistiftskizze: "));
    const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "klein: " + b.datei); }
  assert.ok(magHeftHtml("roman", MAG_AUSGABEN[14].roman).includes("Skizzen by KI") && (magHeftHtml("roman", MAG_AUSGABEN[14].roman).match(/<img /g) || []).length === 2); }
{ const r = MAG_AUSGABEN[16].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.deepEqual(r.bilder.map((b) => b.wo), ["h:Sechzig kleine Fische", "absatz:41", "absatz:65", "h:Herr Akın"]); assert.equal(p[64], "Ralle hob immer alles auf."); assert.ok(p[40].startsWith("Die Kinder hatten die Telefone") && !p.some((t) => /zwei halbwüchsigen Söhnen|Die Söhne hatten/.test(t)), "Folge 4: Bild Ostern bei Kerzenlicht, Familie mit Junge und Mädchen");
  for (const b of r.bilder) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, b.datei); } assert.ok(p.some((t) => t.includes("dann hockte Lena sich unten ans Ufer"))); }
{ const r = MAG_AUSGABEN[17].roman, p = r.text.filter(([a]) => a === "p").map(([, t]) => t);
  assert.deepEqual(r.bilder.map((b) => b.wo), ["absatz:28"]); assert.ok(p[27].startsWith("Dann stand er auf") && p[25].startsWith("Lena setzte sich neben ihn") && p.includes("Ralle sah nicht hin. Nach einer Weile sagte er: „Zwanzig Jahre hab ich die gefüttert.“"), "Folge 5: neuer Absatz Mauer am Teich, Bild dahinter");
  const st = fs.statSync(new URL("../" + r.bilder[0].datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000); }
console.log("magazin-roman Staffel-2-Bilder: ok");
