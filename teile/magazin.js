// KC-CLUB-MAGAZIN-GERUEST (#45 Stufe 2, Wunsch Hansi 03.11.2026 „Das Blätter-Prospekt und das Club-Magazin alles sauber vorbereiten. In der nächsten
// Clubsitzung frage ich, ob so ein Magazin gewünscht wird und wer redaktionell mitarbeiten möchte. Baue schon mal das Gerüst mit Titelblatt, Kopf, Ausgabe-Nr.,
// Titelfoto, Inhaltsverzeichnis, Rubriken, Impressum usw. Blätterfunktion.“) – dazu KC-CLUB-WM-PROSPEKT (Weihnachtsmarkt-Prospekt zum Blättern).
// Beides nur Gerüst: bis zur Freigabe (⚙️ Funktionen freigeben → „magazin“ / „wm_prospekt“) sieht es nur der Admin. Geblättert wird mit dem gemeinsamen
// Baustein blOeffnen (mit Umblättern, KC-CLUB-UMBLAETTERN). Was es schon gibt, füllt sich von selbst (Termine des Monats, Rezept, Saisonkalender, Impressum);
// alles, was später die Redaktion schreibt, steht als sichtbarer Platzhalter da. Nichts wird gespeichert, nichts verschickt.
// Nach jeder Änderung: node tools/teile-pruefsumme.mjs

// Ausgabe Nr. 1 = Januar 2027 (KC-CLUB-MAGAZIN-NR1, Wunsch Hansi 06.11.2026 „die erste Ausgabe soll im Januar 2027 erscheinen mit der Nachlese und
// Impressionen vom Weihnachtsmarkt“; vorher Dezember 2026), danach jeden Monat eine Nummer weiter
const MAG_START = { jahr: 2027, monat: 1 };
const MAG_MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const magNummer = (j, m) => Math.max(1, (j - MAG_START.jahr) * 12 + (m - MAG_START.monat) + 1);
// Rubriken in Heft-Reihenfolge (Registry): sym, Titel, Kurztext fürs Inhaltsverzeichnis, Platzhalter für die Redaktion; auto = füllt die App selbst
const MAG_RUBRIKEN = [
  { id: "rezept", sym: "🍲", t: "Rezept des Monats", u: "Ein Lieblingsrezept aus dem Club – mit Foto", platz: "Hier steht das Rezept des Monats: Zutaten, Zubereitung, Foto und wer es eingereicht hat.", auto: true },
  { id: "backstube", sym: "🥐", t: "Backstube", u: "Gebäck passend zur Jahreszeit", platz: "Plätzchen, Kuchen, Brot – Rezepte aus der Backstube der Mitglieder." },
  { id: "saison", sym: "🧺", t: "Saisonkalender", u: "Was jetzt frisch ist", auto: true },
  { id: "tipp", sym: "💡", t: "Küchentipp", u: "Ein Kniff aus der Profiküche", platz: "Ein kurzer Tipp aus der Küche – zum Beispiel, wie Saucen nicht gerinnen oder Messer lange scharf bleiben." },
  { id: "witz", sym: "😄", t: "Küchenwitz des Monats", u: "Zum Schmunzeln", platz: "Hier steht der Küchenwitz des Monats – eingesandt von Mitgliedern." },
  { id: "rueckblick", sym: "📸", t: "Rückblick", u: "Fotos und Eindrücke vom Clubleben", platz: "Bilder und ein paar Sätze vom letzten Clubabend, von Ausflügen und vom Weihnachtsmarkt." },
  { id: "portraet", sym: "🧑‍🍳", t: "Mitglied im Porträt", u: "Wer kocht da eigentlich?", platz: "Ein Mitglied stellt sich vor: Foto, Werdegang, Lieblingsgericht – nur mit Zustimmung des Mitglieds." },
  { id: "termine", sym: "📅", t: "Termine im Monat", u: "Was im Club ansteht", auto: true },
  { id: "hobby", sym: "🧶", t: "Hobbyecke", u: "Garten, Heimwerken, Stricken & Co. (später)", platz: "Später: Garten, Heimwerken, Stricken und Häkeln – was Mitglieder neben der Küche gerne machen." },
  { id: "links", sym: "🔗", t: "Linktipps", u: "Gefunden und empfohlen (später)", platz: "Später: empfehlenswerte Seiten und Videos. Gesundheitsthemen nur als Link." },
];
// KC-CLUB-MAGAZIN-NR1: Heftinhalt je Ausgabe (Registry Nr. → Rubrik-ID → Inhalt). Was hier steht, ersetzt den Platzhalter der Rubrik; alles andere bleibt
// Platzhalter für die Redaktion. Offene Angaben (Zahlen, Zitate, Fotos) als { platz: "…" } – nie erfundene Ergebnisse eintragen.
const MAG_AUSGABEN = {
  1: {
    schlagzeilen: [["📸", "Nachlese: unser Weihnachtsmarkt 2026"], ["😄", "Der Witz vom Pass"], ["💡", "Aus der Trickkiste: Jus und Beurre blanc"]],
    rueckblick: {
      titel: "Elf Tage Grünkohl, Glühwein und gute Laune", vorspann: "Weihnachtsmarkt Werne vom 2. bis 14. Dezember 2026: zwei Tage Aufbau, elf Markttage – Rückblick auf unseren Stand.",
      fakten: [["Zeitraum", "02.–14.12."], ["Markttage", "11"], ["Helfende", null], ["Portionen Eintopf", null]],
      abschnitte: [
        ["", "Am 2. und 3. Dezember wurde aufgebaut, ab dem 4. Dezember war unser Stand geöffnet.", "Ein bis zwei Sätze zur Stimmung am Eröffnungstag."],
        ["Was auf den Tisch kam", "Das Herzstück war wieder der Grünkohleintopf nach Köcheclub-Rezept, daneben Sauerkrauteintopf mit Kassler und Speck, Kartoffelknirpse mit Dip oder Hering und die Mettwurst, die wir für unsere Gäste aufgeschnitten haben.", "Was lief am besten? War etwas ausverkauft?"],
        ["Hinter dem Tresen", "Ohne Dienstplan geht auf so einem Markt nichts.", "Wie viele Mitglieder haben mitgemacht, wie viele Stunden kamen zusammen? Wer ist eingesprungen, als es eng wurde?"],
        ["Unterm Strich", "", "Ergebnis in einem Satz und wofür der Erlös verwendet wird."],
      ],
      angebot: [["Grünkohleintopf", "5,50"], ["Sauerkrauteintopf", "5,50"], ["Kartoffelknirpse mit Dip", "3,50"], ["… mit Hering", "4,50"], ["Mettwurst", "1,50"], ["Glühwein rot oder weiß", "5,50"], ["Eierlikörpunsch", "6,50"], ["Feuerzangenbowle", "9,00"], ["Roter Feger, Winterapfel", "4,50"]],
      danke: "An alle, die Dienste übernommen, geschnippelt, ausgeschenkt und abends noch gespült haben.",
      zitat: null,
      fotos: ["Der Stand am Abend", "Grünkohl im Kessel", "Aufbau am 2. Dezember", "Team hinter dem Tresen", "Feuerzangenbowle", "Letzter Abend"],
    },
    witz: { titel: "Niedrigtemperatur", zeilen: [["Souschef", "„Chef, wir arbeiten heute ausschließlich mit Niedrigtemperatur!“"], ["Küchenchef", "„Sehr gut. Dann fangen wir gleich mit der Stimmung in der Küche an.“"]] },
    tipp: [
      { titel: "Die Jus ist konzentriert, schmeckt aber flach",
        kniff: "Kurz vor dem Servieren ein paar Tropfen Verjus oder einen milden Essig einarbeiten. Schmecken soll man die Säure nicht, nur ihre Wirkung. Das Salz erst ganz am Ende einstellen.",
        warum: "Eine Reduktion bündelt Gelatine und Umami, aber ohne Säure fehlt der Sauce die Spannung. Säure hebt die Aromen voneinander ab. Salz konzentriert sich mit jedem Liter, der verdampft – darum gehört die finale Würzung ans Ende.",
        merke: "Was vor der Reduktion richtig gesalzen ist, ist danach fast immer zu salzig." },
      { titel: "Die Beurre blanc ist gebrochen, und der Pass wartet", kasten: true,
        schritte: ["Sauce sofort vom Herd nehmen.", "In einem zweiten Topf mit einem Löffel Reduktion aus Weißwein, Essig und Schalotte neu beginnen – alternativ etwas Sahne, notfalls lauwarmes Wasser.", "Die gebrochene Sauce nach und nach unter kräftigem Schlagen einarbeiten."],
        warum: "Butter ist selbst eine Emulsion. Wird sie zu heiß, trennen sich Fett und Wasser. In einer kleinen, mäßig warmen Wasserphase lassen sich die Fetttröpfchen wieder fein verteilen; mit Reduktion oder Sahne bleibt die Sauce aromatisch stabiler als mit reinem Wasser.",
        werte: [["50–60 °C", "Wohlfühlbereich der Emulsion"], ["ab ~65 °C", "Fett und Wasser trennen sich"], ["kalt", "Butter würfeln, portionsweise einschlagen"]] },
    ],
  },
};
// Bausteine für die Heftseiten (Klassen in index.html: mag-spalten, mag-kasten, mag-bon, mag-fakten, mag-merke, mag-fotos)
const magOffen = (t) => `<span class="mag-offen">✍️ ${esc(t)}</span>`;
function magHeftHtml(id, x) {
  if (id === "witz") return `<div class="mag-bon" role="note"><div class="mag-bon-kopf"><span>Bon ${String(magNummer(MAG.jahr, MAG.monat)).padStart(4, "0")}</span><span>Pass</span></div>
    <div class="mag-bon-titel">${esc(x.titel)}</div>${x.zeilen.map(([wer, was], i) => `<p><small>${esc(wer)}</small>${i === x.zeilen.length - 1 ? `<b>${esc(was)}</b>` : esc(was)}</p>`).join("")}
    <div class="mag-bon-fuss"><span>1× Pointe</span><span>sofort raus</span></div></div>${magPlatz("Euer Küchenwitz für die nächste Ausgabe?", "witz")}`;
  if (id === "tipp") return x.map((t) => t.kasten
    ? `<section class="mag-kasten"><small class="mag-marke-klein">Aus der Trickkiste des Küchenmeisters</small><h3>${esc(t.titel)}</h3><div class="mag-spalten"><p class="mag-warum">Der Kniff</p><ol>${t.schritte.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
       <p class="mag-warum">Warum es funktioniert</p><p>${esc(t.warum)}</p></div>${t.werte ? `<dl class="mag-merke">${t.werte.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>` : ""}</section>`
    : `<section class="mag-artikel"><h3>${esc(t.titel)}</h3><div class="mag-spalten"><p class="mag-warum">Der Kniff</p><p>${esc(t.kniff)}</p>${t.merke ? `<blockquote class="mag-zitatzeile">${esc(t.merke)}</blockquote>` : ""}
       <p class="mag-warum">Warum es funktioniert</p><p>${esc(t.warum)}</p></div></section>`).join("") + magPlatz("Euer Kniff aus der Küche für die nächste Ausgabe?", "tipp");
  if (id === "rueckblick") return `<h3 class="mag-schlag">${esc(x.titel)}</h3><p class="mag-lead">${esc(x.vorspann)}</p>
    <div class="mag-fakten">${x.fakten.map(([k, v]) => `<div><small>${esc(k)}</small><b>${v == null ? "✍️ __" : esc(v)}</b></div>`).join("")}</div>
    <div class="mag-spalten">${x.abschnitte.map(([h, t, offen]) => `${h ? `<h4>${esc(h)}</h4>` : ""}<p>${t ? esc(t) + " " : ""}${offen ? magOffen(offen) : ""}</p>`).join("")}</div>
    <section class="mag-kasten mag-kasten-wein"><small class="mag-marke-klein">Unser Angebot am Stand</small><ul class="mag-preise">${x.angebot.map(([n, p]) => `<li><span>${esc(n)}</span><i></i><b>${esc(p)} €</b></li>`).join("")}</ul></section>
    <blockquote class="mag-zitat">${x.zitat ? esc(x.zitat) : magOffen("Zitat eines Mitglieds oder Gastes vom Stand, mit Name und Rolle")}</blockquote>
    <div class="mag-danke"><b>Danke!</b> ${esc(x.danke)} ${magOffen("ggf. Partner, Sponsoren oder die Stadt Werne nennen")}</div>
    <h4 class="mag-h4">📸 Impressionen</h4><div class="mag-fotos">${x.fotos.map((f) => `<figure><div class="mag-foto-platz">📷</div><figcaption>${esc(f)}</figcaption></figure>`).join("")}</div>
    ${magPlatz("Fotos vom Weihnachtsmarkt bitte über „Beitrag einsenden“ schicken – nur mit Einverständnis der abgebildeten Personen.", "rueckblick")}`;
  return "";
}
// Saisonkalender (Deutschland, Freiland/Lager) – je Monat Gemüse, Obst, Kräuter
const MAG_SAISON = [
  ["Grünkohl, Rosenkohl, Lauch, Wirsing, Pastinaken, Schwarzwurzeln", "Äpfel und Birnen (Lager)", "Petersilie (Topf)"],
  ["Grünkohl, Rosenkohl, Feldsalat, Chicorée, Rote Bete", "Äpfel und Birnen (Lager)", "Schnittlauch (Topf)"],
  ["Spinat, Bärlauch, Feldsalat, Lauch, Chicorée", "Äpfel (Lager)", "Bärlauch, Kresse"],
  ["Spargel, Radieschen, Spinat, Rhabarber, Frühlingszwiebeln", "Rhabarber", "Bärlauch, Schnittlauch"],
  ["Spargel, Kohlrabi, Salate, Radieschen, Erbsen", "Erdbeeren, Rhabarber", "Schnittlauch, Petersilie, Dill"],
  ["Spargel (bis 24. Juni), Zucchini, Erbsen, Bohnen, Blumenkohl", "Erdbeeren, Kirschen, Johannisbeeren", "Basilikum, Dill, Minze"],
  ["Tomaten, Gurken, Zucchini, Bohnen, Paprika", "Himbeeren, Heidelbeeren, Kirschen, Aprikosen", "Basilikum, Thymian, Rosmarin"],
  ["Tomaten, Mais, Paprika, Auberginen, Bohnen", "Pflaumen, Brombeeren, Mirabellen, Birnen", "Basilikum, Oregano, Salbei"],
  ["Kürbis, Mais, Brokkoli, Rotkohl, Pilze", "Äpfel, Birnen, Pflaumen, Trauben", "Petersilie, Salbei"],
  ["Kürbis, Rotkohl, Rosenkohl, Rote Bete, Pilze", "Äpfel, Birnen, Quitten, Walnüsse", "Petersilie, Rosmarin"],
  ["Grünkohl, Rosenkohl, Pastinaken, Wirsing, Steckrüben", "Äpfel, Birnen, Quitten", "Petersilie (Topf)"],
  ["Grünkohl, Rosenkohl, Feldsalat, Rotkohl, Schwarzwurzeln", "Äpfel, Birnen (Lager), Nüsse", "Petersilie, Rosmarin (Topf)"],
];
const MAG = { jahr: 0, monat: 0 };
// gemeinsamer Seitenrahmen: Kopf „CLUB-KÜCHE · Nr. 1 · Dezember 2026“, Inhalt, Fuß mit Seitenzahl
const magKopf = () => `<div class="mag-kopf"><b>CLUB-KÜCHE</b><span>Nr. ${magNummer(MAG.jahr, MAG.monat)} · ${MAG_MONATE[MAG.monat - 1]} ${MAG.jahr}</span></div>`;
const magSeite = (inhalt, nr) => `<div class="mag-seite">${magKopf()}<div class="mag-rumpf">${inhalt}</div><div class="mag-fuss"><span>Köcheclub Werne</span><span>${nr}</span></div></div>`;
const MAG_RUBRIK_ART = { rezept: "rezept", backstube: "backstube", tipp: "tipp", witz: "witz", rueckblick: "rueckblick", portraet: "portraet", hobby: "hobby", links: "link" };
const magPlatz = (t, rubrik) => `<div class="mag-platz">✍️ <b>Platzhalter für die Redaktion</b><br>${esc(t)}${rubrik && MAG_RUBRIK_ART[rubrik] ? `<br><button type="button" class="knopf klein mag-einsenden" onclick="blZu();magEinsenden(${jsArg(MAG_RUBRIK_ART[rubrik])})">✉️ Beitrag dafür einsenden</button>` : ""}</div>`;
async function magStart(jahr, monat) {
  if (!frei("magazin")) return melde("Das Club-Magazin ist noch nicht freigegeben.", true);
  const h = heuteIso(); MAG.jahr = jahr || +h.slice(0, 4); MAG.monat = monat || +h.slice(5, 7);
  if (!jahr && magNummer(MAG.jahr, MAG.monat) === 1 && (MAG.jahr < MAG_START.jahr || (MAG.jahr === MAG_START.jahr && MAG.monat < MAG_START.monat))) Object.assign(MAG, { jahr: MAG_START.jahr, monat: MAG_START.monat }); // vor dem Start: Ausgabe Nr. 1 zeigen
  melde("📰 Das Magazin wird zusammengestellt …");
  const von = `${MAG.jahr}-${String(MAG.monat).padStart(2, "0")}-01`, bis = tagPlus(`${MAG.monat === 12 ? MAG.jahr + 1 : MAG.jahr}-${String(MAG.monat === 12 ? 1 : MAG.monat + 1).padStart(2, "0")}-01`, -1);
  const [kal, rz] = await Promise.allSettled([api("kalender", { von, bis }, { still: true }), frei("rezepte") ? api("rezepte_liste", {}, { still: true }) : Promise.reject(new Error("aus"))]);
  let termine = null; try { if (kal.status === "fulfilled") termine = demnaechstListe(kal.value).filter((x) => x.tag >= von && x.tag <= bis); } catch {}
  const rezepte = rz.status === "fulfilled" ? rz.value.rezepte || [] : [];
  const rezept = rezepte.filter((r) => r.foto).sort((a, b) => (b.bewertung?.schnitt || 0) - (a.bewertung?.schnitt || 0) || String(b.erstellt_am).localeCompare(String(a.erstellt_am)))[0] || rezepte[0] || null;
  const seiten = magSeiten({ termine, rezept });
  blOeffnen(`📰 Club-Küche Nr. ${magNummer(MAG.jahr, MAG.monat)} · ${MAG_MONATE[MAG.monat - 1]} ${MAG.jahr}`, seiten, ["Titel", "Inhalt", ...MAG_RUBRIKEN.map((r) => r.t), "Impressum"]);
}
function magSeiten({ termine, rezept }) {
  const nr = magNummer(MAG.jahr, MAG.monat), mon = `${MAG_MONATE[MAG.monat - 1]} ${MAG.jahr}`;
  const seiten = [];
  // Titelblatt: Kopf, Ausgabe-Nr., Titelfoto (Platzhalter bis die Redaktion eins wählt), drei Schlagzeilen
  const heft = MAG_AUSGABEN[nr] || {}, schlag = heft.schlagzeilen ? heft.schlagzeilen.map(([sym, t]) => ({ sym, t })) : MAG_RUBRIKEN.filter((r) => !/später/.test(r.u)).slice(0, 3);
  seiten.push({ art: "html", register: "Titel", titel: "", html: `<div class="mag-titel">
    <div class="mag-titel-kopf"><span class="mag-marke">CLUB-KÜCHE</span><span class="mag-unter">Das Magazin des Köcheclubs Werne</span>
      <span class="mag-ausgabe">Ausgabe Nr. ${nr} · ${mon}</span></div>
    <div class="mag-titelfoto" role="img" aria-label="Titelfoto (Platzhalter)"><img src="kc-kochmuetze-weiss.webp" alt=""><small>Titelfoto – wählt die Redaktion</small></div>
    <ul class="mag-schlagzeilen">${schlag.map((r) => `<li><span>${r.sym}</span> ${esc(r.t)}</li>`).join("")}</ul>
    <div class="mag-entwurf">Entwurf · nur für den Admin sichtbar</div></div>` });
  // Inhaltsverzeichnis (antippen springt zur Seite)
  const start = 2; // 0 Titel, 1 Inhalt, ab 2 die Rubriken
  seiten.push({ art: "html", register: "Inhalt", titel: "", html: magSeite(`<h2 class="mag-h">Inhalt</h2><ol class="mag-inhalt">${MAG_RUBRIKEN.map((r, i) => `<li><button type="button" onclick="blGehe(${start + i})"><span class="mag-sym">${r.sym}</span><span><b>${esc(r.t)}</b><small>${esc(r.u)}</small></span><span class="mag-seitenzahl">${start + i + 1}</span></button></li>`).join("")}
      <li><button type="button" onclick="blGehe(${start + MAG_RUBRIKEN.length})"><span class="mag-sym">§</span><span><b>Impressum</b><small>Wer das Magazin macht</small></span><span class="mag-seitenzahl">${start + MAG_RUBRIKEN.length + 1}</span></button></li></ol>`, 2) });
  // Rubriken
  MAG_RUBRIKEN.forEach((r, i) => {
    let inhalt = "";
    if (r.id === "saison") { const [g, o, k] = MAG_SAISON[MAG.monat - 1]; inhalt = `<p class="mag-lead">Was im ${MAG_MONATE[MAG.monat - 1]} frisch aus der Region kommt:</p><dl class="mag-saison"><dt>🥬 Gemüse</dt><dd>${esc(g)}</dd><dt>🍎 Obst</dt><dd>${esc(o)}</dd><dt>🌿 Kräuter</dt><dd>${esc(k)}</dd></dl>`; }
    else if (r.id === "termine") inhalt = termine == null ? '<p class="hinweis">Die Termine konnten gerade nicht geladen werden.</p>' : termine.length
      ? `<ul class="mag-termine">${termine.slice(0, 14).map((x) => `<li><b>${esc(fTagDp.format(new Date(x.tag + "T12:00:00Z")))}${x.zeit ? ", " + esc(x.zeit) : ""}</b> ${x.sym} ${esc(x.text)}</li>`).join("")}</ul>` : `<p class="mag-lead">Im ${MAG_MONATE[MAG.monat - 1]} steht noch nichts im Kalender.</p>`;
    else if (r.id === "rezept" && rezept) inhalt = `<div class="mag-rezept">${rezept.foto ? `<img class="oa-bild mag-foto" data-anlage="${esc(rezept.foto)}" alt="${esc(rezept.titel)}">` : ""}<h3>${esc(rezept.titel)}</h3>
        <p class="hinweis">${esc([rezept.kategorie, rezept.portionen ? rezept.portionen + " Portionen" : "", rezept.vonName ? "von " + rezept.vonName : ""].filter(Boolean).join(" · "))}</p>
        ${Array.isArray(rezept.zutaten) && rezept.zutaten.length ? `<h4>Zutaten</h4><ul>${rezept.zutaten.slice(0, 14).map((z) => `<li>${esc(typeof z === "string" ? z : [z.menge, z.einheit, z.name].filter(Boolean).join(" "))}</li>`).join("")}</ul>` : ""}
        ${rezept.zubereitung ? `<h4>Zubereitung</h4><p>${esc(String(rezept.zubereitung)).slice(0, 900).replace(/\n/g, "<br>")}</p>` : ""}<p class="hinweis">Vorschlag aus dem Rezeptbuch – die Redaktion wählt später das Rezept des Monats.</p></div>`;
    else if (heft[r.id]) inhalt = magHeftHtml(r.id, heft[r.id]);
    else inhalt = magPlatz(r.platz || "Hier kommt der Beitrag der Redaktion hin.", r.id);
    seiten.push({ art: "html", register: r.t, titel: "", html: magSeite(`<h2 class="mag-h"><span>${r.sym}</span> ${esc(r.t)}</h2><p class="mag-unterzeile">${esc(r.u)}</p>${inhalt}`, start + i + 1) });
  });
  // Impressum (Angaben aus dem Impressum der App, Redaktion noch offen)
  const I = typeof IMPRESSUM !== "undefined" ? IMPRESSUM : null;
  seiten.push({ art: "html", register: "Impressum", titel: "", html: magSeite(`<h2 class="mag-h">§ Impressum</h2><dl class="mag-impressum">
      <dt>Herausgeber</dt><dd>${esc(I?.anbieter || "Köcheclub Werne")}${I?.rechtsform ? `<br><small>${esc(I.rechtsform)}</small>` : ""}</dd>
      ${I?.anschrift ? `<dt>Anschrift</dt><dd>${esc(I.anschrift).replace(/\n/g, "<br>")}</dd>` : ""}
      <dt>Redaktion</dt><dd>${magPlatz("Wird in der nächsten Clubsitzung gefragt: Wer hat Lust, redaktionell mitzuarbeiten?")}</dd>
      <dt>Verantwortlich für den Inhalt</dt><dd>${I?.vertreten ? esc(I.vertreten) : "wird festgelegt"}</dd>
      <dt>Erscheinungsweise</dt><dd>monatlich, nur für Mitglieder in der Club-App</dd>
      <dt>Fotos und Rezepte</dt><dd>von Mitgliedern, mit ihrer Zustimmung</dd></dl>`, start + MAG_RUBRIKEN.length + 1) });
  return seiten;
}

// ---------- KC-CLUB-WM-PROSPEKT: Weihnachtsmarkt-Prospekt zum Blättern ----------
// Deckblatt, Angebot (Speisen, Getränke), Seiten aus dem Club-Ordner „Weihnachtsmarkt“ (Register mit „Prospekt“ im Namen, z. B. die Preisliste von Thomas),
// „Wer wir sind“, Rückseite. Ein öffentlicher Link für Besucher kommt erst nach der Entscheidung in der Clubsitzung.
async function wmProspekt() {
  if (!frei("wm_prospekt")) return melde("Der Weihnachtsmarkt-Prospekt ist noch nicht freigegeben.", true);
  const jahr = +heuteIso().slice(0, 4);
  let ordnerSeiten = [];
  try {
    const r = await api("archiv_liste", {}, { still: true }), o = (r.ordner || []).find((x) => !x.besitzer && !x.geloescht_am && (x.kennung === "weihnachtsmarkt" || /^weihnachtsmarkt$/i.test(x.titel || "")));
    if (o) { const b = await api("archiv_blaettern", { ordner_id: o.id }, { still: true });
      ordnerSeiten = (b.seiten || []).filter((x) => /prospekt/i.test(x.register || "")).map((x) => ({ ...x, register: "Prospekt", art: /^image\//.test(x.mime || "") ? "bild" : /pdf/.test(x.mime || "") ? "pdf" : "datei" })); }
  } catch {}
  const I = typeof IMPRESSUM !== "undefined" ? IMPRESSUM : null;
  const platz = (t) => `<div class="mag-platz">✍️ <b>Platzhalter</b><br>${esc(t)}</div>`;
  const seite = (inhalt) => `<div class="mag-seite wm-seite"><div class="mag-kopf"><b>🎄 WEIHNACHTSMARKT ${jahr}</b><span>Köcheclub Werne</span></div><div class="mag-rumpf">${inhalt}</div></div>`;
  const seiten = [
    { art: "html", register: "Titel", titel: "", html: `<div class="mag-titel wm-titel"><div class="mag-titel-kopf"><span class="mag-marke">Weihnachtsmarkt Werne ${jahr}</span><span class="mag-unter">Der Stand des Köcheclubs</span></div>
      <div class="mag-titelfoto wm-foto" role="img" aria-label="Foto vom Stand (Platzhalter)"><span>🎄</span><small>Foto vom Stand – folgt</small></div>
      <ul class="mag-schlagzeilen"><li><span>🍲</span> Hausgemacht von Berufsköchinnen und -köchen</li><li><span>🍷</span> Glühwein & Punsch</li><li><span>❤️</span> Für einen guten Zweck</li></ul>
      <div class="mag-entwurf">Entwurf · nur für den Admin sichtbar</div></div>` },
    { art: "html", register: "Angebot", titel: "", html: seite(`<h2 class="mag-h">🍲 Speisen</h2>${platz("Gerichte mit Preisen – zum Beispiel aus der neuen Preisliste von Thomas. Liegt die Preisliste im Club-Ordner „Weihnachtsmarkt“ im Register „Prospekt“, erscheint sie hier automatisch als eigene Seite.")}`) },
    { art: "html", register: "Angebot", titel: "", html: seite(`<h2 class="mag-h">🍷 Getränke</h2>${platz("Glühwein, Punsch, Kinderpunsch, alkoholfreie Getränke – mit Preisen.")}`) },
    ...ordnerSeiten,
    { art: "html", register: "Über uns", titel: "", html: seite(`<h2 class="mag-h">👨‍🍳 Wer wir sind</h2><p class="mag-lead">${esc(I?.rechtsform || "Ein Zusammenschluss von Berufsköchinnen und Berufsköchen")} aus Werne.</p>${platz("Ein paar Sätze über den Club, den Spendenzweck in diesem Jahr und wann der Stand geöffnet ist.")}`) },
  ];
  blOeffnen(`🎄 Weihnachtsmarkt-Prospekt ${jahr}`, seiten, ["Titel", "Angebot", "Prospekt", "Über uns"]);
}

// ---------- KC-CLUB-MAGAZIN-POSTFACH (Wunsch Hansi 03.11.2026 „ein eigenes Postfach, z. B. Redaktion, um dort Beiträge wie Fotos, Rezepte, Texte, Küchenwitz des Monats,
// Porträt ‚X stellt sich vor‘ usw. einzusenden“) ----------
// Kachel „Club-Küche“ → kleines Menü: Ausgabe lesen · Beitrag einsenden · Meine Beiträge · (Redaktion) Postfach. Redaktion = Admin, später Amt „Redaktion“.
// Gleiche Liste wie MAG_ARTEN im Server.
const MAG_EINSENDEN = [["rezept", "🍲 Rezept"], ["foto", "📸 Foto"], ["text", "✍️ Text / Bericht"], ["witz", "😄 Küchenwitz des Monats"], ["portraet", "🧑‍🍳 Porträt – ich stelle mich vor"],
  ["tipp", "💡 Küchentipp"], ["backstube", "🥐 Backstube"], ["rueckblick", "🗓️ Rückblick"], ["hobby", "🧶 Hobbyecke"], ["link", "🔗 Linktipp"]];
const MAG_STAND = { neu: "🆕 neu", angenommen: "✅ angenommen", abgelehnt: "❌ abgelehnt", erschienen: "📰 erschienen" };
const istMagRedaktion = () => !!ICH?.admin || (ICH?.aemter || []).some((a) => /^redaktion/i.test(a));
const MAGP = { art: "rezept", anlagen: [], filter: "neu", liste: [] };
function magMenue() {
  if (!frei("magazin")) return melde("Das Club-Magazin ist noch nicht freigegeben.", true);
  const h = heuteIso(), j = +h.slice(0, 4), m = +h.slice(5, 7), nr = (j < MAG_START.jahr || (j === MAG_START.jahr && m < MAG_START.monat)) ? 1 : magNummer(j, m);
  blattAuf("magMenueBlatt", `<h3 style="margin:0">📰 Club-Küche</h3><p class="hinweis" style="margin:2px 0 10px">Das Magazin des Köcheclubs – Ausgabe Nr. ${nr}${nurTest("magazin") ? " · 🔒 Entwurf, nur für dich" : ""}</p>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">
      <button class="knopf haupt" style="min-height:52px" onclick="fensterZu($('magMenueBlatt'));magStart()">📖 Ausgabe lesen</button>
      <button class="knopf" style="min-height:48px" onclick="fensterZu($('magMenueBlatt'));magEinsenden()">✉️ Beitrag einsenden</button>
      <button class="knopf" onclick="fensterZu($('magMenueBlatt'));magMeine()">📬 Meine Beiträge</button>
      ${istMagRedaktion() ? `<button class="knopf" onclick="fensterZu($('magMenueBlatt'));magPostfach()">📥 Redaktions-Postfach</button>` : ""}
      <button class="knopf" onclick="fensterZu($('magMenueBlatt'))">Schließen</button></div>`);
}
function magEinsenden(art) {
  if (!frei("magazin")) return melde("Das Club-Magazin ist noch nicht freigegeben.", true);
  Object.assign(MAGP, { art: MAG_EINSENDEN.some(([a]) => a === art) ? art : "rezept", anlagen: [] });
  blattAuf("magEinBlatt", `<h3 style="margin:0">✉️ Beitrag für die Club-Küche</h3><p class="hinweis" style="margin:2px 0 8px">Geht ins Postfach der Redaktion. Sie meldet sich, wenn er ins Heft kommt.</p>
    <div class="hl-frage">Was möchtest du einsenden?</div><div class="hl-chips" id="magArten" role="radiogroup" aria-label="Art des Beitrags">${MAG_EINSENDEN.map(([a, t]) => `<button type="button" class="chip" role="radio" data-art="${a}" onclick="magArt('${a}')">${t}</button>`).join("")}</div>
    <label class="feld" style="margin-top:8px">Überschrift<input id="magTitel" maxlength="120" autocomplete="off"></label>
    <label class="feld">Text<textarea id="magText" rows="6" maxlength="4000"></textarea></label>
    <div class="knoepfe" style="margin:4px 0"><button type="button" class="knopf klein" onclick="$('magDatei').click()">📷 Foto / 📄 Datei anhängen</button><small class="hinweis">höchstens 6</small></div>
    <input type="file" id="magDatei" accept="image/*,application/pdf" multiple hidden onchange="magDateien(this)"><div id="magAnlagen"></div>
    <label class="zeile" style="margin-top:8px"><input type="checkbox" id="magZust"> <span>Ich bin einverstanden, dass mein Beitrag mit Fotos und Namen im Magazin erscheint.</span></label>
    <div class="knoepfe bs-fuss"><button class="knopf haupt" id="magLos" onclick="magSenden(this)">✉️ An die Redaktion senden</button><button class="knopf" onclick="fensterZu($('magEinBlatt'))">Abbrechen</button></div>`);
  magArt(MAGP.art); magAnlagenZeigen();
}
const MAG_HILFE = { rezept: ["z. B. Omas Rotkohl", "Zutaten (mit Mengen) und Zubereitung …"], foto: ["Was ist auf dem Foto?", "Ein, zwei Sätze zum Foto …"], text: ["Überschrift", "Dein Bericht …"],
  witz: ["Küchenwitz", "Kommt ein Koch in die Küche …"], portraet: ["… stellt sich vor", "Wie bist du zum Kochen gekommen? Wo hast du gelernt und gearbeitet? Dein Lieblingsgericht? Was machst du gerne außerhalb der Küche?"],
  tipp: ["Küchentipp", "Der Kniff in ein paar Sätzen …"], backstube: ["z. B. Spritzgebäck", "Zutaten und Zubereitung …"], rueckblick: ["z. B. Clubabend im November", "Was war los? Fotos anhängen …"],
  hobby: ["Mein Hobby", "Erzähl davon …"], link: ["Linktipp", "Adresse der Seite und warum sie sich lohnt …"] };
function magArt(a) {
  MAGP.art = a; document.querySelectorAll("#magArten [data-art]").forEach((b) => { const an = b.dataset.art === a; b.classList.toggle("an", an); b.setAttribute("aria-checked", String(an)); });
  const [t, x] = MAG_HILFE[a] || ["Überschrift", "Text …"]; if ($("magTitel")) $("magTitel").placeholder = a === "portraet" && ICH?.vorname ? `${ICH.vorname} stellt sich vor` : t; if ($("magText")) $("magText").placeholder = x;
  if (a === "portraet" && $("magTitel") && !$("magTitel").value && ICH?.name) $("magTitel").value = `${ICH.name} stellt sich vor`;
}
function magAnlagenZeigen() { const el = $("magAnlagen"); if (el) el.innerHTML = MAGP.anlagen.map((a, i) => `<div class="tipp-anl"><span>${oaSym(a.mime)} ${esc(a.name)}</span><button type="button" class="knopf klein" aria-label="Entfernen" onclick="MAGP.anlagen.splice(${i},1);magAnlagenZeigen()">✕</button></div>`).join(""); }
async function magDateien(inp) {
  const l = [...(inp.files || [])]; inp.value = "";
  for (const d of l) {
    if (MAGP.anlagen.length >= 6) { melde("Höchstens 6 Anhänge.", true); break; }
    if (!/^image\/|^application\/pdf$/.test(d.type || "")) { melde(`${d.name}: bitte ein Foto oder ein PDF.`, true); continue; }
    try { melde(`⏫ ${d.name} wird hochgeladen …`); const r = await anlageHochladen(d); MAGP.anlagen.push({ id: r.id, name: r.name || d.name, mime: d.type }); magAnlagenZeigen(); } catch (e) { meldeFehler(e); }
  }
}
async function magSenden(knopf) {
  const titel = ($("magTitel")?.value || "").trim(), text = ($("magText")?.value || "").trim(), zustimmung = !!$("magZust")?.checked;
  if (!text && !MAGP.anlagen.length) return melde("Bitte etwas schreiben oder ein Foto anhängen.", true);
  if (MAGP.art === "portraet" && !zustimmung) return melde("Für das Porträt bitte unten zustimmen, dass es im Magazin erscheinen darf.", true);
  knopf.disabled = true;
  try { await api("magazin_einreichen", { art: MAGP.art, titel, text, anlagen: MAGP.anlagen.map((a) => a.id), zustimmung }, { warten: true }); fensterZu($("magEinBlatt")); melde("✉️ Danke! Dein Beitrag ist bei der Redaktion."); }
  catch (e) { meldeFehler(e); knopf.disabled = false; }
}
async function magMeine() {
  let r; try { r = await api("magazin_meine", {}, { warten: true }); } catch (e) { return meldeFehler(e); }
  const l = r.beitraege || [], A = r.arten || {};
  blattAuf("magMeineBlatt", `<h3 style="margin:0 0 6px">📬 Meine Beiträge</h3>${l.length ? l.map((b) => `<div class="tipp-zeile" style="cursor:default"><b>${esc(b.titel)}</b><small class="hinweis">${esc(A[b.art] || b.art)} · ${esc(wann(b.erstellt_am))} · ${esc(MAG_STAND[b.status] || b.status)}${b.ausgabe ? ` · Ausgabe Nr. ${b.ausgabe}` : ""}</small></div>`).join("")
    : '<p class="hinweis">Noch nichts eingesandt.</p>'}<div class="knoepfe"><button class="knopf haupt" onclick="fensterZu($('magMeineBlatt'));magEinsenden()">✉️ Beitrag einsenden</button><button class="knopf" onclick="fensterZu($('magMeineBlatt'))">Schließen</button></div>`);
}
async function magPostfach() {
  if (!istMagRedaktion()) return melde("Das Postfach sieht nur die Redaktion.", true);
  let r; try { r = await api("magazin_postfach", {}, { warten: true }); } catch (e) { return meldeFehler(e); }
  MAGP.liste = r.beitraege || []; MAGP.arten = r.arten || {}; magPostfachZeigen();
}
function magPostfachZeigen() {
  const A = MAGP.arten || {}, f = MAGP.filter, l = MAGP.liste.filter((b) => f === "alle" || b.status === f), zahl = (s) => MAGP.liste.filter((b) => b.status === s).length;
  const h = heuteIso(), hj = +h.slice(0, 4), hm = +h.slice(5, 7), naechste = hj < MAG_START.jahr || (hj === MAG_START.jahr && hm < MAG_START.monat) ? 1 : magNummer(hj, hm) + 1; // vor dem Start: Nr. 1
  const karte = (b) => `<div class="ua-karte ua-${b.status === "neu" ? "offen" : b.status === "abgelehnt" ? "erledigt" : "in_arbeit"}"><div class="ua-kopf"><b>${esc(b.titel)}</b><span class="ua-stand">${esc(MAG_STAND[b.status] || b.status)}${b.ausgabe ? ` · Nr. ${b.ausgabe}` : ""}</span></div>
      <small class="hinweis">${esc(A[b.art] || b.art)} · von ${esc(b.name)} · ${esc(wann(b.erstellt_am))}${b.zustimmung ? " · ✔ Zustimmung" : " · ohne Zustimmung"}</small>
      ${b.text ? `<details${b.status === "neu" ? " open" : ""}><summary>Text</summary><div style="white-space:pre-wrap;margin-top:4px">${esc(b.text)}</div></details>` : ""}${oaAnzeige(b.anlagen || [])}
      <div class="knoepfe" style="margin-top:6px">${b.status !== "angenommen" ? `<button class="knopf klein" onclick="magStand(${jsArg(b.id)}, 'angenommen', ${naechste})">✅ Annehmen (Nr. ${naechste})</button>` : ""}
        ${b.status !== "erschienen" && b.status === "angenommen" ? `<button class="knopf klein" onclick="magStand(${jsArg(b.id)}, 'erschienen', ${b.ausgabe || "null"})">📰 Erschienen</button>` : ""}
        ${b.status !== "abgelehnt" ? `<button class="knopf klein" onclick="magStand(${jsArg(b.id)}, 'abgelehnt', null)">❌ Ablehnen</button>` : ""}${b.status !== "neu" ? `<button class="knopf klein" onclick="magStand(${jsArg(b.id)}, 'neu', null)">↩️ Wieder neu</button>` : ""}</div></div>`;
  blattAuf("magPostBlatt", `<h3 style="margin:0">📥 Redaktions-Postfach</h3><p class="hinweis" style="margin:2px 0 8px">Beiträge der Mitglieder für die Club-Küche. Annehmen und Ablehnen sagt dem Mitglied kurz Bescheid.</p>
    <div class="hl-chips">${[["neu", "🆕 Neu"], ["angenommen", "✅ Angenommen"], ["erschienen", "📰 Erschienen"], ["abgelehnt", "❌ Abgelehnt"], ["alle", "Alle"]].map(([k, t]) => `<button type="button" class="chip${f === k ? " an" : ""}" onclick="MAGP.filter='${k}';magPostfachZeigen()">${t}${k !== "alle" ? ` <small>(${zahl(k)})</small>` : ""}</button>`).join("")}</div>
    ${l.length ? l.map(karte).join("") : '<p class="hinweis" style="margin-top:10px">Hier ist gerade nichts.</p>'}<div class="knoepfe"><button class="knopf" onclick="fensterZu($('magPostBlatt'))">Schließen</button></div>`);
}
async function magStand(id, status, ausgabe) {
  try { await api("magazin_beitrag_setzen", { id, status, ausgabe }, { warten: true }); const b = MAGP.liste.find((x) => x.id === id); if (b) Object.assign(b, { status, ausgabe });
    melde(status === "angenommen" ? "✅ Angenommen – das Mitglied bekommt Bescheid" : status === "abgelehnt" ? "❌ Abgelehnt – das Mitglied bekommt einen freundlichen Dank" : status === "erschienen" ? "📰 Als erschienen vermerkt" : "↩️ Wieder neu"); magPostfachZeigen(); }
  catch (e) { meldeFehler(e); }
}
