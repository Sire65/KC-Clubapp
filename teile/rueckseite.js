// KC-CLUB-TEILE Stufe 3 (Prüfbericht C, Wunsch Hansi 28.10.2026): Rückseite des Kopfs – Rätsel, Spiegel, Diashow, Tafel, Flipchart, Bühne mit Musik und Club-Song.
// Wird geladen, wenn auf der Rückseite ein Reiter geöffnet wird (esTab) oder ein Erklär-Video sie vorführt (Videos brauchen die Rückseite).
// Im Hauptprogramm bleiben: Eselsohr, Umdrehen und Aufrollen, große Uhr mit Wecker, Bewegungs-Einladung mit Twinkeys Figur, Zustand ES/BW.
// Nach jeder Änderung hier: node tools/teile-pruefsumme.mjs
// ----- 🧩 2.339.0 KC-CLUB-RAETSEL (Wunsch Hansi „Spiel auf der Rückseite: Wie gut kennst du …? In Abständen kommen Pixel dazu, man muss erkennen, was
// auf dem Bild ist (z. B. Rathaus Werne). Roter Buzzer, dann 6 Tipps zur Auswahl, jeder falsche Tipp kostet Punkte, ein Zeitbalken läuft“) -----
// Bild startet grob verpixelt und wird in 8 Stufen scharf (30 s). Punkte starten bei 1000 und laufen mit der Zeit herunter; Buzzer hält die Uhr an,
// 6 Antworten (1 richtig, 5 aus derselben Gruppe); falsch = −150 und es geht weiter. Wochen-Rätsel: alle bekommen dieselben 5 Bilder (aus der
// Kalenderwoche errechnet), der erste Durchgang zählt für die Club-Bestenliste. Bilder: freie Fotos von Wikimedia Commons (Nachweis nach dem
// Auflösen und unter „📜 Bildnachweise“, Lizenztexte in raetsel/) und eigene Fotos aus dem Club-Album (Admin wählt sie aus).
const QZ_SEK = 30, QZ_STUFEN = [26, 18, 12, 8, 5, 3, 2, 1], QZ_START = 1000, QZ_FALSCH = 150, QZ_RUNDE = 5;
// 2.340.0 (Fund Hansi „die Fotos sind zu lange unkenntlich – sonst hat man nie Chancen auf höhere Punkte“): feinere Pixel von Anfang an, die ersten Stufen
// kommen schneller (Start der Stufen in Sekunden), nach 22 s ist das Bild scharf; Punkte fallen nur noch bis 250 statt bis 0 (+ Abzüge).
const QZ_ZEITEN = [0, 2, 4.5, 7, 10, 13, 17, 22], QZ_ENDE = 250;
const QZ_KAT = { werne: ["🏛️", "Werne"], kueche: ["🥕", "Küche"], club: ["📸", "Köcheclub"] };
const QZ_LIZ = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/deed.de", "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/deed.de",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/deed.de", "GFDL 1.2": "raetsel/GFDL-1.2.txt", "gemeinfrei": "",
  "CC BY-SA 2.5": "https://creativecommons.org/licenses/by-sa/2.5/deed.de", "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/deed.de",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/deed.de", "FAL": "https://artlibre.org/licence/lal/de1-3/" }; // 2.641.0
// [Datei, Gruppe, Lösung, Satz nach dem Auflösen, Fotograf, Lizenz, Commons-Datei]
const QZ_MOTIVE = [
  ["altes-rathaus", "werne", "Altes Rathaus", "Das Alte Rathaus am Markt – mit seinen Arkaden das Wahrzeichen von Werne.", "Vincent van Zeijst", "CC BY-SA 4.0", "Germany, Nordrhein-Westfalen, Kreis Unna, Werne, Markt, old town hall.jpg"],
  ["christophorus", "werne", "St.-Christophorus-Kirche", "St. Christophorus – die Stadtkirche mitten in Werne.", "Creosoph", "CC BY-SA 4.0", "St. Christophorus 2024-03-14 Werne-1202052.jpg"],
  ["kirchhof", "werne", "Kirchhof", "Der Kirchhof – Fachwerkhäuser rund um St. Christophorus.", "Vincent van Zeijst", "CC BY-SA 4.0", "Germany, Nordrhein-Westfalen, Kreis Unna, Werne, Kirchhof (2).jpg"],
  ["steinhaus", "werne", "Steinhaus", "Das Steinhaus – ein historisches Bürgerhaus mit prächtigem Giebel.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7603-Steinhaus.jpg"],
  ["kloster", "werne", "Kapuzinerkloster", "Die Kirche des Kapuzinerklosters.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7723-Kloster.jpg"],
  ["stadtmuseum", "werne", "Stadtmuseum", "Das Karl-Pollender-Stadtmuseum.", "Mbdortmund", "GFDL 1.2", "Werne-Stadtmuseum-20070522 7055-DSC 7055.jpg"],
  ["stadthaus", "werne", "Stadthaus", "Das Stadthaus – hier sitzt die Stadtverwaltung.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7755-Stadthaus.jpg"],
  ["bahnhof", "werne", "Bahnhof Werne", "Der Bahnhof Werne – hier hält der Zug.", "Christian Alexander Tietgen", "CC BY 4.0", "Bahnhof Werne (a d Lippe) 01.jpg"],
  ["simjue", "werne", "Sim-Jü", "Sim-Jü – die große Kirmes Ende Oktober.", "Mbdortmund", "CC BY-SA 3.0", "Werne-Sim-Jü-09 0001.JPG"],
  ["turmkater", "werne", "Turmkater", "Der bunte Turmkater – ein Kunstwerk von Otmar Alt.", "Mbdortmund", "GFDL 1.2", "Werne-20090522-Alt-Katze-Werne-DSC 7776.jpg"],
  ["ausrufer", "werne", "Der Ausrufer", "Der Ausrufer – eine Bronzefigur an den Rathaus-Arkaden.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7684-Rathaus-Skulptur.jpg"],
  ["sprichwort", "werne", "Sprichwörterbrunnen", "Der Sprichwörterbrunnen – mit Figuren zu bekannten Redensarten.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7637-Brunnen.jpg"],
  ["moormann", "werne", "Moormann-Brunnen", "Der Moormann-Brunnen in der Fußgängerzone.", "Tasto", "CC BY-SA 3.0", "Werne-Moormann-Brunnen-IMG 8251.jpg"],
  ["ziegenhirten", "werne", "Ziegenhirte mit Ziege", "Die Bronzefigur mit der Ziege in der Innenstadt.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7697-Skulptur-Ziegenhirten.jpg"],
  ["rochus", "werne", "Rochuskapelle", "Die kleine Rochuskapelle an der Lünener Straße.", "Icy2008", "CC BY-SA 4.0", "Rochus-Kapelle (1).jpg"],
  ["antonius", "werne", "Antoniuskapelle", "Die Antoniuskapelle in Langern.", "Icy2008", "CC BY-SA 4.0", "Antoniuskapelle Langern 28 (1) 00001.jpg"],
  ["hardenberg", "werne", "Haus Hardenberg", "Haus Hardenberg mit seiner Gräfte.", "Solon de Gordion", "CC BY-SA 3.0", "Haus Hardenberg Werne 9.JPG"],
  ["gersteinwerk", "werne", "Kraftwerk Gersteinwerk", "Das Gersteinwerk in Stockum – die Kühltürme sieht man von weit her.", "Icy2008", "CC BY-SA 4.0", "Gersteinwerk in Werne.jpg"],
  ["wildschweine", "werne", "Wildgehege Buschkämpken", "Das Wildgehege im Buschkämpken – mit Wildschweinen und Damwild.", "Fitti (Panoramio)", "CC BY-SA 3.0", "Wildschweine - panoramio.jpg"],
  ["horne", "werne", "Hornebach", "Der Hornebach mit der alten Bogenbrücke.", "Mbdortmund", "GFDL 1.2", "Werne-Horne-20070522 7030-DSC 7030.jpg"],
  ["sternanis", "kueche", "Sternanis", "Sternanis – das Gewürz für Glühwein und Lebkuchen.", "Sanjay Acharya", "CC BY-SA 4.0", "Dried Star Anise Fruit Seeds.jpg"],
  ["pfeffer", "kueche", "Pfefferkörner", "Schwarze Pfefferkörner – der König der Gewürze.", "Hubertl", "CC BY 4.0", "Black Pepper IMG 4866 - 02.jpg"],
  ["nelken", "kueche", "Gewürznelke", "Eine Gewürznelke – die getrocknete Blütenknospe des Nelkenbaums.", "Sanjay Acharya", "CC BY-SA 4.0", "Clove close up.jpg"],
  ["safran", "kueche", "Safran", "Safran – die Fäden der Krokusblüte, das teuerste Gewürz der Welt.", "Rainer Zenz", "gemeinfrei", "Iran saffron threads.jpg"],
  ["muskat", "kueche", "Muskatnuss", "Die Muskatnuss in der Frucht – mit dem roten Samenmantel, der Muskatblüte.", "Terrence Coombes", "CC BY-SA 4.0", "Nutmeg ready.jpg"],
  ["ingwer", "kueche", "Ingwer", "Ingwer – scharf und frisch, toll im Tee und in der asiatischen Küche.", "Sanjay Acharya", "CC BY-SA 4.0", "Ginger Root.jpg"],
  ["rosmarin", "kueche", "Rosmarin", "Rosmarin – passt prima zu Kartoffeln und Lamm.", "T137", "CC BY-SA 3.0", "Rosmarinus officinalis (1).jpg"],
  ["romanesco", "kueche", "Romanesco", "Romanesco – der Blumenkohl mit den Spitztürmchen.", "George Chernilevsky", "CC BY 4.0", "Romanesco broccoli 2025 G2.jpg"],
  ["artischocke", "kueche", "Artischocken", "Artischocken – gegessen werden die zarten Blattenden und der Boden.", "Toby Hudson", "CC BY-SA 3.0", "Artichoke stack.JPG"],
  ["kohlrabi", "kueche", "Kohlrabi", "Kohlrabi – roh knackig, gekocht mild.", "Coyau", "CC BY-SA 3.0", "Chou-rave 04.jpg"],
  ["zitrone", "kueche", "Zitrone", "Zitrone – sauer macht lustig!", "Ivar Leidus", "CC BY-SA 4.0", "Lemon - whole and split.jpg"],
  ["reibe", "kueche", "Käsereibe", "Eine Käsereibe mit Kurbel – frischer Parmesan, bitte!", "Clément Bucco-Lechat", "CC BY-SA 3.0", "Râpe à fromage - endroit.jpg"],
  ["kochloeffel", "kueche", "Kochlöffel", "Der Kochlöffel – das wichtigste Werkzeug in jeder Küche.", "Clément Bucco-Lechat", "CC BY-SA 3.0", "Cuiller en bois - dessus.jpg"],
  ["zwiebel", "kueche", "Rote Zwiebel", "Die rote Zwiebel – mild und süßlich, schön im Salat.", "Colin", "CC BY-SA 3.0", "Red Onion on White.JPG"],
  ["paprika", "kueche", "Paprika", "Rote Paprika – süß und voller Vitamin C.", "AntanO", "CC BY-SA 4.0", "Red bell pepper.jpg"],
  // 2.641.0 KC-CLUB-RAETSEL-ABWECHSLUNG (Wunschliste #30): 15 weitere Werne- und 14 Küchen-Motive (freie Fotos von Wikimedia Commons)
  ["fachwerk-kirchplatz", "werne", "Fachwerkhaus am Kirchplatz", "Ein Fachwerkhaus am Kirchplatz – mit grüner Haustür.", "Mbdortmund", "CC BY-SA 3.0", "Kirchplatz-Werne-DSC 0056.JPG"],
  ["juedischer-friedhof", "werne", "Jüdischer Friedhof", "Die Mauer am alten jüdischen Friedhof.", "smial", "FAL", "Werne am jued friedhof IMGP0297 wp.jpg"],
  ["zeche", "werne", "Zeche Werne", "Die frühere Zeche Werne – hier wurde früher Steinkohle gefördert.", "smial", "FAL", "Zeche Werne Schacht 3 IMGP2179 smial wp.jpg"],
  ["amazon", "werne", "Amazon-Logistikzentrum", "Das große Amazon-Logistikzentrum in Werne.", "Icy2008", "CC BY-SA 4.0", "Amazon Logistikzentrum Werne.jpg"],
  ["marktplatz", "werne", "Marktplatz", "Der Marktplatz mit dem Alten Rathaus und dem Turm von St. Christophorus.", "Vincent van Zeijst", "CC BY-SA 4.0", "Germany, Nordrhein-Westfalen, Kreis Unna, Werne, Markt (2).jpg"],
  ["ickhorn", "werne", "Hotel Ickhorn", "Das Hotel Ickhorn in der Innenstadt.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7692-Hotel-Ickhorn.jpg"],
  ["sparkasse", "werne", "Sparkasse", "Die Sparkasse in der Innenstadt.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7715-Sparkasse.jpg"],
  ["feuerwache", "werne", "Feuerwache", "Die Feuerwache der Werner Feuerwehr.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7762-Feuerwehr.jpg"],
  ["kino", "werne", "Kino", "Das Kino in der Innenstadt.", "Mbdortmund", "GFDL 1.2", "Werne-20090522-Kino-DSC 7134.jpg"],
  ["roggenmarkt", "werne", "Roggenmarkt", "Ein altes Backsteinhaus am Roggenmarkt.", "LAV02", "CC BY-SA 4.0", "Wohnhaus, Roggenmarkt 12, Werne.jpg"],
  ["busbahnhof", "werne", "Busbahnhof", "Der Busbahnhof – im Hintergrund der Turm von St. Christophorus.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7760-Skyline.jpg"],
  ["christusfigur", "werne", "Kreuz an St. Christophorus", "Das Steinkreuz mit Christusfigur an der St.-Christophorus-Kirche.", "Mbdortmund", "CC BY-SA 2.5", "Christusfigur, St. Christophorus-Kirche, Werne.jpg"],
  ["fussgaengerzone", "werne", "Fußgängerzone", "Die Fußgängerzone mit ihren Geschäften.", "Mbdortmund", "GFDL 1.2", "Werne-12-07-08 110.JPG"],
  ["giebel", "werne", "Geschnitzter Giebel", "Alte Schnitzereien an einem Fachwerkgiebel.", "smial", "FAL", "Werne giebelverzierung IMGP0289 wp.jpg"],
  ["teigelkoetter", "werne", "Haus Teigelkötter", "Das Fachwerkhaus Teigelkötter mit der großen Uhr.", "Mbdortmund", "GFDL 1.2", "Werne-070602 7636-Teigelkötter.jpg"],
  ["zimt", "kueche", "Zimtstangen", "Zimtstangen – die gerollte Rinde des Zimtbaums.", "Fumikas Sagisavas", "gemeinfrei", "Cinnamon sticks (1).jpg"],
  ["vanille", "kueche", "Vanilleschoten", "Vanilleschoten – die getrockneten Früchte einer Orchidee.", "B.navez (bearbeitet: Andrzej 22)", "CC BY-SA 3.0", "Vanilla 6beans (rot. 90 deg.).JPG"],
  ["lorbeer", "kueche", "Lorbeerblätter", "Getrocknete Lorbeerblätter – gehören in Suppe und Sauerbraten.", "Fumikas Sagisavas", "gemeinfrei", "Dried bay leaves (20240502).jpg"],
  ["basilikum", "kueche", "Basilikum", "Basilikum – das Kraut für Tomate-Mozzarella und Pesto.", "Paul Goyette", "CC BY-SA 2.0", "Basil leaves.jpg"],
  ["rotebete", "kueche", "Rote Bete", "Rote Bete – färbt alles schön rot.", "Evan-Amos", "gemeinfrei", "Beets-Bundle.jpg"],
  ["kuerbis", "kueche", "Hokkaido-Kürbis", "Der Hokkaido-Kürbis – die Schale kann man mitessen.", "unbekannt", "gemeinfrei", "Pumpkin hokaido still life.jpg"],
  ["fenchel", "kueche", "Fenchel", "Gemüsefenchel – schmeckt leicht nach Anis.", "Mauro Cateb", "CC BY-SA 4.0", "Fennel bulb from Brazil.jpg"],
  ["nudelholz", "kueche", "Nudelholz", "Das Nudelholz – zum Ausrollen von Teig.", "Fructibus", "gemeinfrei", "Rolling pin 2017.jpg"],
  ["moerser", "kueche", "Mörser", "Mörser und Stößel – zum Zerstoßen von Gewürzen.", "Jacek Halicki", "CC BY-SA 4.0", "2023 Moździerz ceramiczny (1).jpg"],
  ["kardamom", "kueche", "Kardamom", "Grüne Kardamomkapseln – typisch für Spekulatius und Chai.", "Misterneedlemouse", "gemeinfrei", "Green Cardamom Pods.jpg"],
  ["steinpilz", "kueche", "Steinpilz", "Der Steinpilz – einer der beliebtesten Speisepilze.", "Holger Krisp", "CC BY 3.0", "(Gemeine Steinpilz) Boletus edulis.jpg"],
  ["granatapfel", "kueche", "Granatapfel", "Ein aufgebrochener Granatapfel – voller roter Kerne.", "Ivar Leidus", "CC BY-SA 4.0", "Pomegranate (opened).jpg"],
  ["lauch", "kueche", "Lauch", "Lauch (Porree) auf dem Feld.", "Rasbak", "CC BY-SA 3.0", "Allium ampeloprasum var. porrum 'Farinto' (1).jpg"],
  ["radieschen", "kueche", "Radieschen", "Ein Bund Radieschen – knackig und scharf.", "TeWeBs", "CC BY-SA 4.0", "A Bunch of Radishes.JPG"],
].map(([id, kat, a, info, autor, liz, datei]) => ({ id, kat, a, info, autor, liz, datei, src: `raetsel/${id}.webp` }));
// Zusätzliche, gut klingende falsche Antworten je Gruppe (damit die 6 Tipps abwechslungsreich sind)
const QZ_EXTRA = { werne: ["Marktplatz", "Natur-Solebad", "Gradierwerk", "Lippeaue", "Stadtpark", "Lippebrücke", "Alte Post"],
  kueche: ["Kardamom", "Vanille", "Lorbeer", "Thymian", "Fenchel", "Brokkoli", "Wirsing", "Pastinake", "Kurkuma", "Muskatreibe", "Spätzlepresse", "Knoblauchpresse"],
  club: ["Weihnachtsmarkt", "Clubabend", "Grillfest", "Kochkurs", "Sommerfest", "Jahreshauptversammlung", "Ausflug"] };
const QZ = { stand: null, spiel: null, uhr: 0, eigene: [] };
function qzWoche(d = new Date()) { // ISO-Kalenderwoche in deutscher Zeit – gleich wie auf dem Server (raetselWoche)
  const [y, m, t] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(d).split("-").map(Number);
  const u = new Date(Date.UTC(y, m - 1, t)), tag = u.getUTCDay() || 7; u.setUTCDate(u.getUTCDate() + 4 - tag);
  const j = u.getUTCFullYear(); return `${j}-W${String(Math.ceil(((+u - Date.UTC(j, 0, 1)) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}
function qzZufall(saat) { let h = 2166136261; for (const c of String(saat)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); // fester Zufall für das Wochen-Rätsel
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const qzMischen = (l, z = Math.random) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(z() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const qzAlle = () => [...QZ_MOTIVE, ...QZ.eigene];
// 2.641.0 KC-CLUB-RAETSEL-ABWECHSLUNG: Motive, die auf dem Bild des anderen mit zu sehen sind, nie gemeinsam als Tipps (sonst zwei richtige Antworten)
const QZ_AEHNLICH = [["Marktplatz", "Altes Rathaus"], ["Marktplatz", "St.-Christophorus-Kirche"], ["Kreuz an St. Christophorus", "St.-Christophorus-Kirche"],
  ["Busbahnhof", "St.-Christophorus-Kirche"], ["Fachwerkhaus am Kirchplatz", "Kirchhof"], ["Marktplatz", "Der Ausrufer"], ["Sparkasse", "Fußgängerzone"]];
const qzAehnlich = (a, b) => QZ_AEHNLICH.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
function qzTipps(m, z = Math.random) { // 1 richtige + 5 falsche aus derselben Gruppe (ohne doppelte)
  const andere = [...new Set([...qzAlle().filter((x) => x.kat === m.kat && x.a !== m.a).map((x) => x.a), ...(QZ_EXTRA[m.kat] || [])])].filter((a) => a !== m.a && !qzAehnlich(m.a, a));
  return qzMischen([m.a, ...qzMischen(andere, z).slice(0, 5)], z);
}
async function qzStandHolen() {
  try { QZ.stand = await api("raetsel_stand", {}); QZ.eigene = (QZ.stand.motive || []).map((x) => ({ id: "c-" + x.id, mid: x.id, kat: "club", a: x.antwort, info: x.info || "", foto: x.foto_id, autor: "Köcheclub Werne", liz: "", datei: "" })); }
  catch (e) { QZ.stand = QZ.stand || null; }
}
function qzStop() { clearInterval(QZ.uhr); QZ.uhr = 0; if (QZ.spiel) QZ.spiel.aus = true; }
async function esRaetselZeigen(f) {
  qzStop(); QZ.spiel = null;
  f.innerHTML = `<div class="qz"><div class="qz-start"><div class="qz-titel">🧩 Wie gut kennst du …?</div><div class="qz-unter">Das Bild wird nach und nach schärfer. Erkannt? Drück den <b style="color:#ff6b6b">roten Buzzer</b>!</div>
    <div class="qz-wahl" id="qzWahl"><div class="qz-laedt">⏳ Einen Moment …</div></div>
    <div class="es-leiste qz-leiste"><button type="button" class="es-k" onclick="qzBestenliste()">🏆 Bestenliste</button><button type="button" class="es-k" onclick="qzNachweise()">📜 Bildnachweise</button>${ICH?.admin ? '<button type="button" class="es-k" onclick="qzEigeneVerwalten()">📸 Eigene Bilder</button>' : ""}</div></div></div>`;
  await qzStandHolen(); if (!$("qzWahl")) return;
  const s = QZ.stand, w = qzWoche(), clubN = QZ.eigene.length;
  $("qzWahl").innerHTML = `<button type="button" class="qz-gross${s?.meins ? " gespielt" : ""}" onclick="qzStart('woche')"><span>🏆</span><b>Wochen-Rätsel ${w.slice(-2).replace(/^0/, "")}. Woche</b><small>${s?.meins ? `✅ Gespielt: ${s.meins.punkte} Punkte (${s.meins.richtig} von ${QZ_RUNDE}) – nochmal zum Üben` : "5 Bilder · zählt für die Club-Bestenliste"}</small></button>
    <div class="qz-reihe"><button type="button" class="qz-klein" onclick="qzStart('werne')">🏛️ Werne üben</button><button type="button" class="qz-klein" onclick="qzStart('kueche')">🥕 Küche üben</button>${clubN ? `<button type="button" class="qz-klein" onclick="qzStart('club')">📸 Köcheclub (${clubN})</button>` : ""}</div>
    ${s ? "" : '<p class="qz-hinweis">Die Bestenliste ist gerade nicht erreichbar – Üben geht trotzdem.</p>'}`;
}
// 2.641.0 KC-CLUB-RAETSEL-ABWECHSLUNG (Wunschliste #30, Wunsch Hansi „Mehr Bilder – wenn man mehrmals spielt, erkennt man die Bilder zu schnell“):
// Übungsrunden nehmen zuerst Bilder, die man auf diesem Gerät noch nicht hatte (gemerkt nur hier, nichts geht an den Server); sind alle durch,
// zuerst die am längsten nicht gesehenen. Jedes Bild kommt mit wechselndem Ausschnitt (etwas herangezoomt, andere Stelle, manchmal gespiegelt) –
// beim Wochen-Rätsel für alle gleich (fester Zufall). Aufgelöst wird immer mit dem ganzen, ungespiegelten Bild.
const QZ_GESEHEN_KEY = "kc_club_raetsel_gesehen", QZ_ZOOM = [1.2, 1.65];
function qzGesehen() { try { return JSON.parse(localStorage.getItem(QZ_GESEHEN_KEY) || "{}") || {}; } catch (e) { return {}; } }
function qzGesehenMerken(id) { try { const g = qzGesehen(); g[id] = Date.now(); localStorage.setItem(QZ_GESEHEN_KEY, JSON.stringify(g)); } catch (e) { /* ohne Speicher nur Zufall */ } }
function qzUngesehenZuerst(liste) { const g = qzGesehen(); return [...liste.filter((m) => !g[m.id]), ...liste.filter((m) => g[m.id]).sort((a, b) => g[a.id] - g[b.id])]; } // stabil: Ungesehene bleiben gemischt
const qzAusschnitt = (z) => ({ zoom: QZ_ZOOM[0] + z() * (QZ_ZOOM[1] - QZ_ZOOM[0]), fx: z(), fy: z(), spiegel: z() < 0.4 });
function qzStart(art) {
  const woche = art === "woche", z = woche ? qzZufall("kc-raetsel-" + qzWoche()) : Math.random, alle = qzAlle();
  let bilder;
  if (woche) { const w = qzMischen(alle.filter((m) => m.kat === "werne"), z), k = qzMischen(alle.filter((m) => m.kat === "kueche"), z), c = qzMischen(alle.filter((m) => m.kat === "club"), z);
    bilder = qzMischen([...w.slice(0, c.length ? 2 : 3), ...k.slice(0, 2), ...c.slice(0, 1)], z); }
  else bilder = qzUngesehenZuerst(qzMischen(alle.filter((m) => m.kat === art), z)).slice(0, QZ_RUNDE); // 2.641.0 KC-CLUB-RAETSEL-ABWECHSLUNG
  if (!bilder.length) return melde("Für diese Gruppe gibt es noch keine Bilder.", true);
  QZ.spiel = { art, zaehlt: woche && !QZ.stand?.meins && !!QZ.stand, woche: qzWoche(), bilder: bilder.map((m) => ({ m, tipps: qzTipps(m, z), aus: qzAusschnitt(z) })), i: 0, punkte: 0, richtig: 0 };
  qzBild();
}
async function qzBildLaden(m) {
  if (m.img) return m.img;
  let src = m.src; if (m.foto) { try { src = (await api("foto_oeffnen", { id: m.foto })).url; } catch (e) { return null; } }
  return new Promise((ok) => { const im = new Image(); im.onload = () => { m.img = im; ok(im); }; im.onerror = () => ok(null); im.src = src; });
}
async function qzBild() {
  const S = QZ.spiel, f = $("hrFlaeche"); if (!S || !f) return; const B = S.bilder[S.i];
  f.innerHTML = `<div class="qz qz-spiel"><div class="qz-kopf"><span>${QZ_KAT[B.m.kat][0]} Bild ${S.i + 1} von ${S.bilder.length}</span><b id="qzPunkte">${QZ_START}</b><span>Gesamt: ${S.punkte}</span></div>
    <div class="qz-bildfeld"><canvas id="qzBild" aria-label="Rätselbild"></canvas><div class="qz-tipps versteckt" id="qzTipps"></div><div class="qz-loesung versteckt" id="qzLoesung"></div></div>
    <div class="qz-balken"><i id="qzBalken"></i></div>
    <div class="qz-unten" id="qzUnten"><button type="button" class="qz-buzzer" id="qzBuzzer" onclick="qzBuzz()" aria-label="Buzzer – ich weiß es"><span>BUZZ</span></button></div></div>`;
  const im = await qzBildLaden(B.m); if (!$("qzBild") || QZ.spiel !== S) return;
  if (!im) { melde("Das Bild konnte nicht geladen werden – nächstes Bild.", true); return qzWeiter(true); }
  qzGesehenMerken(B.m.id);
  Object.assign(S, { t: 0, lauf: true, falsch: 0, stufe: -1, letzt: performance.now(), fertig: false });
  qzMalen(); clearInterval(QZ.uhr); QZ.uhr = setInterval(qzTakt, 100);
}
function qzPunkteJetzt(S) { return Math.max(0, Math.round(QZ_START - (QZ_START - QZ_ENDE) * S.t / QZ_SEK - S.falsch * QZ_FALSCH)); }
function qzTakt() {
  const S = QZ.spiel; if (!S || S.aus || !$("qzBild")) return qzStop();
  const jetzt = performance.now(), dt = (jetzt - S.letzt) / 1000; S.letzt = jetzt;
  if (!S.lauf || !esSichtbar()) return;
  S.t = Math.min(QZ_SEK, S.t + dt); qzMalen();
  $("qzPunkte").textContent = qzPunkteJetzt(S); const b = $("qzBalken"), r = 1 - S.t / QZ_SEK;
  b.style.width = `${r * 100}%`; b.style.background = r > .5 ? "#2ecc71" : r > .2 ? "#f1c40f" : "#e74c3c";
  if (S.t >= QZ_SEK) qzAufloesen(false, true);
}
function qzMalen() { // nur neu malen, wenn eine neue Schärfe-Stufe erreicht ist (spart Akku)
  const S = QZ.spiel, cv = $("qzBild"), B = S?.bilder[S.i]; if (!cv || !B?.m.img) return;
  const st = S.fertig ? QZ_STUFEN.length - 1 : Math.max(0, QZ_ZEITEN.findLastIndex((z) => S.t >= z)); if (st === S.stufe && cv.width) return; S.stufe = st;
  const box = cv.parentElement.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), W = Math.max(50, Math.round(box.width * dpr)), H = Math.max(50, Math.round(box.height * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  // 2.641.0 KC-CLUB-RAETSEL-ABWECHSLUNG: bis zum Auflösen nur ein Ausschnitt (sw × sh ab sx/sy), evtl. gespiegelt
  const im = B.m.img, A = !S.fertig && B.aus ? B.aus : null, zoom = A ? A.zoom : 1, sw = im.width / zoom, sh = im.height / zoom;
  const sx = A ? A.fx * (im.width - sw) : 0, sy = A ? A.fy * (im.height - sh) : 0;
  const s = Math.min(W / sw, H / sh), w = sw * s, h = sh * s, x = (W - w) / 2, y = (H - h) / 2, c = cv.getContext("2d");
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#1b1b1b"; c.fillRect(0, 0, W, H);
  if (A?.spiegel) c.setTransform(-1, 0, 0, 1, W, 0);
  const blk = QZ_STUFEN[st] * dpr;
  if (blk <= 1.5) { c.imageSmoothingEnabled = true; c.drawImage(im, sx, sy, sw, sh, x, y, w, h); c.setTransform(1, 0, 0, 1, 0, 0); return; }
  const kw = Math.max(2, Math.round(w / blk)), kh = Math.max(2, Math.round(h / blk)), k = (QZ.klein = QZ.klein || document.createElement("canvas")); k.width = kw; k.height = kh;
  const kc = k.getContext("2d"); kc.imageSmoothingEnabled = true; kc.drawImage(im, sx, sy, sw, sh, 0, 0, kw, kh);
  c.imageSmoothingEnabled = false; c.drawImage(k, 0, 0, kw, kh, x, y, w, h); c.setTransform(1, 0, 0, 1, 0, 0);
}
function qzTon(art) { try { const A = (QZ.ac = QZ.ac || new (window.AudioContext || window.webkitAudioContext)()), o = A.createOscillator(), g = A.createGain(), t = A.currentTime;
  if (!einst("ton", true)) return; o.connect(g); g.connect(A.destination);
  if (art === "buzz") { o.type = "square"; o.frequency.setValueAtTime(110, t); g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .45); o.start(t); o.stop(t + .46); }
  else if (art === "richtig") { o.type = "triangle"; o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(880, t + .12); o.frequency.setValueAtTime(1320, t + .24); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.001, t + .6); o.start(t); o.stop(t + .62); }
  else { o.type = "sawtooth"; o.frequency.setValueAtTime(200, t); o.frequency.linearRampToValueAtTime(110, t + .35); g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); o.start(t); o.stop(t + .42); } } catch (e) { /* ohne Ton */ } }
function qzBuzz() {
  const S = QZ.spiel; if (!S || !S.lauf || S.fertig) return; S.lauf = false; qzTon("buzz"); try { navigator.vibrate?.(60); } catch (e) {}
  const B = S.bilder[S.i], t = $("qzTipps");
  t.innerHTML = `<div class="qz-frage">Was ist auf dem Bild?</div><div class="qz-tipp-gitter">${B.tipps.map((a, i) => `<button type="button" class="qz-tipp${B.weg?.includes(a) ? " falsch" : ""}" ${B.weg?.includes(a) ? "disabled" : ""} onclick="qzTipp(${i})">${esc(a)}</button>`).join("")}</div>`;
  t.classList.remove("versteckt"); $("qzBuzzer").disabled = true;
}
function qzTipp(i) {
  const S = QZ.spiel; if (!S || S.fertig) return; const B = S.bilder[S.i], a = B.tipps[i];
  if (a === B.m.a) return qzAufloesen(true);
  S.falsch++; (B.weg = B.weg || []).push(a); qzTon("falsch"); try { navigator.vibrate?.([40, 60, 40]); } catch (e) {}
  const pk = $("qzPunkte"); if (pk) { pk.classList.remove("minus"); void pk.offsetWidth; pk.classList.add("minus"); pk.dataset.minus = `−${QZ_FALSCH}`; } // ❌ blinkt rot im Spiel (keine Meldung oben)
  if (qzPunkteJetzt(S) <= 0) return qzAufloesen(false);
  $("qzTipps").classList.add("versteckt"); $("qzBuzzer").disabled = false; $("qzPunkte").textContent = qzPunkteJetzt(S); S.letzt = performance.now(); S.lauf = true;
}
function qzAufloesen(ok, zeit) {
  const S = QZ.spiel; if (!S || S.fertig) return; S.fertig = true; S.lauf = false; clearInterval(QZ.uhr); QZ.uhr = 0;
  const B = S.bilder[S.i], p = ok ? qzPunkteJetzt(S) : 0; S.punkte += p; if (ok) S.richtig++;
  qzTon(ok ? "richtig" : "falsch"); S.stufe = -1; qzMalen(); $("qzTipps")?.classList.add("versteckt"); if ($("qzBalken")) $("qzBalken").style.width = "0";
  const nachweis = B.m.liz ? `Foto: ${esc(B.m.autor)} · ${B.m.liz === "gemeinfrei" ? "gemeinfrei" : `<a href="${QZ_LIZ[B.m.liz]}" target="_blank" rel="noopener">${esc(B.m.liz)}</a>`} · <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(B.m.datei.replace(/ /g, "_"))}" target="_blank" rel="noopener">Wikimedia Commons</a>` : "Foto: Köcheclub Werne";
  const l = $("qzLoesung"); l.innerHTML = `<div class="qz-ergebnis ${ok ? "gut" : "schade"}">${ok ? `🎉 Richtig! +${p} Punkte` : zeit ? "⏰ Die Zeit ist um!" : "😕 Diesmal nicht"}</div><b>${esc(B.m.a)}</b>${B.m.info ? `<span>${esc(B.m.info)}</span>` : ""}<small>${nachweis}</small>`;
  l.classList.remove("versteckt"); if (ok) try { const r = $("qzBild").getBoundingClientRect(); konfetti(r.left + r.width / 2, r.top + r.height / 2, 60); } catch (e) {}
  $("qzUnten").innerHTML = `<button type="button" class="es-k es-haupt qz-weiter" onclick="qzWeiter()">${S.i < S.bilder.length - 1 ? "▶ Nächstes Bild" : "🏁 Ergebnis"}</button><button type="button" class="es-k" onclick="esRaetselZeigen($('hrFlaeche'))">✖ Ende</button>`;
}
async function qzWeiter(ueberspringen) {
  const S = QZ.spiel; if (!S) return;
  if (S.i < S.bilder.length - 1) { S.i++; return qzBild(); }
  qzStop(); const f = $("hrFlaeche"); if (!f) return;
  const max = S.bilder.length * QZ_START, q = S.punkte / max;
  const spruch = q > .7 ? (S.art === "kueche" ? "Sterneköchin oder Sternekoch! 👨‍🍳" : "Echte Wernerin, echter Werner! 🏆") : q > .4 ? "Gut gemacht – da kennt sich jemand aus! 👍" : q > .15 ? "Nicht schlecht – öfter mal genau hinschauen! 😉" : "Da musst du öfter mal raus! 😄";
  let info = S.zaehlt ? "⏳ Ergebnis wird eingetragen …" : S.art === "woche" ? "Übungsrunde – zählt nicht für die Bestenliste." : "Übungsrunde.";
  f.innerHTML = `<div class="qz"><div class="qz-start qz-ende"><div class="qz-titel">🏁 ${S.punkte} Punkte</div><div class="qz-unter">${S.richtig} von ${S.bilder.length} richtig erkannt</div><div class="qz-spruch">${spruch}</div><p class="qz-hinweis" id="qzEndeInfo">${info}</p>
    <div class="qz-reihe"><button type="button" class="qz-klein" onclick="qzBestenliste()">🏆 Bestenliste</button><button type="button" class="qz-klein" onclick="esRaetselZeigen($('hrFlaeche'))">🔁 Nochmal</button></div></div></div>`;
  if (S.zaehlt) {
    try { await api("raetsel_ergebnis", { woche: S.woche, punkte: S.punkte, richtig: S.richtig, bilder: S.bilder.map((b) => b.m.id) }); info = "✅ Eingetragen in die Club-Bestenliste der Woche!"; }
    catch (e) { info = "⚠️ " + fehlerText(e, "Das Ergebnis konnte nicht eingetragen werden."); }
    if ($("qzEndeInfo")) $("qzEndeInfo").textContent = info; await qzStandHolen();
  }
}
async function qzBestenliste() {
  qzStop(); const f = $("hrFlaeche"); if (!f) return;
  f.innerHTML = '<div class="qz"><div class="qz-start"><div class="qz-laedt">⏳ Bestenliste wird geladen …</div></div></div>';
  await qzStandHolen(); const s = QZ.stand; if (!$("hrFlaeche")) return;
  const zeile = (r, i, wert) => `<li class="${r.ich ? "ich" : ""}"><span>${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1 + "."}</span><b>${esc(r.name)}</b><em>${wert}</em></li>`;
  f.innerHTML = `<div class="qz"><div class="qz-start qz-liste"><div class="qz-titel">🏆 Club-Bestenliste</div>
    ${s ? `<h4>Diese Woche (${esc(s.woche.slice(-2).replace(/^0/, ""))}. KW)</h4><ol>${s.woche_liste.length ? s.woche_liste.map((r, i) => zeile(r, i, `${r.punkte} · ${r.richtig}/${QZ_RUNDE} ✓`)).join("") : "<li class='leer'>Noch niemand – sei die oder der Erste!</li>"}</ol>
    <h4>Gesamt (alle Wochen)</h4><ol>${s.gesamt.length ? s.gesamt.map((r, i) => zeile(r, i, `${r.punkte} · ${r.wochen} Wo.`)).join("") : "<li class='leer'>Noch keine Ergebnisse.</li>"}</ol>` : '<p class="qz-hinweis">Die Bestenliste ist gerade nicht erreichbar.</p>'}
    <div class="qz-reihe"><button type="button" class="qz-klein" onclick="esRaetselZeigen($('hrFlaeche'))">↩ Zurück</button></div></div></div>`;
}
function qzNachweise() {
  qzStop(); const f = $("hrFlaeche"); if (!f) return;
  f.innerHTML = `<div class="qz"><div class="qz-start qz-liste qz-nachweis"><div class="qz-titel">📜 Bildnachweise</div><p class="qz-hinweis">Freie Fotos von Wikimedia Commons – vielen Dank an die Fotografinnen und Fotografen! Die Bilder wurden verkleinert und werden im Spiel zunächst verpixelt gezeigt. Texte der Lizenzen: <a href="raetsel/GFDL-1.2.txt" target="_blank" rel="noopener">GFDL 1.2</a>, Creative Commons über die Links.</p>
    <ul>${QZ_MOTIVE.map((m) => `<li><b>${esc(m.a)}</b>: ${esc(m.autor)}, ${m.liz === "gemeinfrei" ? "gemeinfrei" : `<a href="${QZ_LIZ[m.liz]}" target="_blank" rel="noopener">${esc(m.liz)}</a>`}, <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(m.datei.replace(/ /g, "_"))}" target="_blank" rel="noopener">Quelle</a></li>`).join("")}</ul>
    <div class="qz-reihe"><button type="button" class="qz-klein" onclick="esRaetselZeigen($('hrFlaeche'))">↩ Zurück</button></div></div></div>`;
}
async function qzEigeneVerwalten() { // nur Admin: Fotos aus dem Club-Album als Rätselbilder
  qzStop(); const f = $("hrFlaeche"); if (!f || !ICH?.admin) return;
  f.innerHTML = '<div class="qz"><div class="qz-start"><div class="qz-laedt">⏳ Club-Album wird geladen …</div></div></div>';
  let fotos = []; try { fotos = (await api("fotos_liste", {})).fotos || []; } catch (e) { return meldeFehler(e); }
  await qzStandHolen(); if (!$("hrFlaeche")) return; const schon = new Set(QZ.eigene.map((m) => String(m.foto)));
  f.innerHTML = `<div class="qz"><div class="qz-start qz-liste"><div class="qz-titel">📸 Eigene Rätselbilder</div>
    <h4>Im Rätsel (${QZ.eigene.length})</h4><ul class="qz-eigene">${QZ.eigene.map((m) => `<li><b>${esc(m.a)}</b><button type="button" class="es-k" aria-label="Eigene Frage löschen" title="Löschen" onclick="qzEigenesWeg('${m.mid}')">🗑️</button></li>`).join("") || "<li class='leer'>Noch keine – unten ein Foto antippen.</li>"}</ul>
    <h4>Foto aus dem Club-Album antippen</h4><div class="qz-album">${fotos.filter((x) => x.vorschau && !schon.has(String(x.id))).slice(0, 120).map((x) => `<button type="button" onclick="qzEigenesNeu('${esc(String(x.id))}')"><img src="${esc(x.vorschau)}" alt="" loading="lazy"></button>`).join("") || "<p class='qz-hinweis'>Keine Fotos im Album.</p>"}</div>
    <div class="qz-reihe"><button type="button" class="qz-klein" onclick="esRaetselZeigen($('hrFlaeche'))">↩ Zurück</button></div></div></div>`;
}
async function qzEigenesNeu(fotoId) {
  const antwort = await eingabe("🧩 Was ist auf dem Foto? (die richtige Lösung, z. B. „Weihnachtsmarkt 2025“)", ""); if (!antwort || antwort.trim().length < 2) return;
  const info = await eingabe("Ein Satz nach dem Auflösen? (freiwillig)", ""); 
  try { await api("raetsel_motiv_neu", { foto_id: fotoId, antwort: antwort.trim(), info: (info || "").trim() }, { warten: true }); melde("🧩 Rätselbild hinzugefügt"); } catch (e) { return meldeFehler(e); }
  qzEigeneVerwalten();
}
async function qzEigenesWeg(id) {
  if (!await frage("🗑️ Dieses Rätselbild entfernen? (Das Foto im Album bleibt.)", { ja: "🗑️ Entfernen", nein: "Abbrechen" })) return;
  try { await api("raetsel_motiv_weg", { id }); } catch (e) { return meldeFehler(e); }
  qzEigeneVerwalten();
}
// ----- 🪞 2.314.0 KC-CLUB-SPIEGEL (Wunsch Hansi „die Fläche wie einen großen Spiegel, Kamerabild von sich selbst – etwas dicker, mit Pausbäckchen“) -----
// Die Kamera läuft nur nach Antippen und nur, solange der Spiegel zu sehen ist. Das Bild bleibt im Gerät: nichts wird gespeichert oder gesendet.
// Pausbäckchen: jedes Bild wird über eine einmal berechnete Verzerrungs-Tabelle gezogen (breiter + Wangen aufgeblasen) – schnell genug fürs Handy.
const ES_SPIEGEL = { stream: null, video: null, raf: 0, karte: null, w: 0, h: 0, dick: true, klein: null };
function esSpiegelZeigen(f) {
  esSpiegelAus();
  f.innerHTML = `<div class="es-spiegel"><div class="es-spiegel-rahmen"><canvas id="esSpiegelBild" aria-label="Spiegel"></canvas>
      <div class="es-spiegel-start" id="esSpiegelStart"><div class="es-spiegel-glanz"></div><b>🪞 Spieglein, Spieglein …</b><span>Tippe auf „Kamera an“ – dann siehst du dich hier wie in einem Spiegel. Das Bild bleibt nur auf deinem Gerät, nichts wird gespeichert oder verschickt.</span>
        <button type="button" class="es-k es-haupt" onclick="esSpiegelAn()">📷 Kamera an</button></div>
      <div class="es-spiegel-blase versteckt" id="esSpiegelBlase">Na, wir sollten mal wieder mit Twinkey eine Bewegungseinheit machen! 😉</div></div>
    <div class="es-leiste"><button type="button" class="es-k" id="esSpiegelDick" onclick="esSpiegelDick()">${ES_SPIEGEL.dick ? "🐹 Pausbäckchen" : "🙂 Normal"}</button>
      <button type="button" class="es-k es-haupt" onclick="esTab('buehne')">🎭 Zur Bühne</button><button type="button" class="es-k" onclick="esSpiegelAus(true)">📷 Aus</button></div></div>`;
}
async function esSpiegelAn() {
  const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.setAttribute("playsinline", "");
  try { ES_SPIEGEL.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }); }
  catch (e) { return melde(e?.name === "NotAllowedError" ? "📷 Die Kamera ist nicht erlaubt – bitte in den Einstellungen des Handys für diese App freigeben." : "📷 Die Kamera lässt sich auf diesem Gerät nicht öffnen."); }
  if (!$("esSpiegelBild")) return esSpiegelAus(); // inzwischen weggetippt
  v.srcObject = ES_SPIEGEL.stream; ES_SPIEGEL.video = v; try { await v.play(); } catch (e) { /* manche Geräte starten erst mit dem ersten Bild */ }
  $("esSpiegelStart")?.classList.add("versteckt");
  setTimeout(() => $("esSpiegelBlase")?.classList.remove("versteckt"), 1800);
  const male = () => { ES_SPIEGEL.raf = requestAnimationFrame(male); esSpiegelBild(); }; male();
}
function esSpiegelKarte(w, h) { // für jeden Zielpunkt: woher im Kamerabild (gespiegelt, breiter, Wangen aufgeblasen)
  const k = new Int32Array(w * h), wangen = [[.33, .6], [.67, .6]], r = w * .26;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sx = w / 2 + (x - w / 2) / 1.16, sy = y; // etwas breiter
    for (const [cx0, cy0] of wangen) { const cx = cx0 * w, cy = cy0 * h, dx = sx - cx, dy = sy - cy, d = Math.hypot(dx, dy);
      if (d < r && d > 0) { const f = Math.pow(d / r, .45); sx = cx + dx * f; sy = cy + dy * f; } } // Pausbacke: Mitte vergrößert
    const qx = Math.min(w - 1, Math.max(0, Math.round(w - 1 - sx))), qy = Math.min(h - 1, Math.max(0, Math.round(sy))); // gespiegelt wie ein Spiegel
    k[y * w + x] = qy * w + qx;
  }
  return k;
}
function esSpiegelBild() {
  const v = ES_SPIEGEL.video, c = $("esSpiegelBild"); if (!v || !c) return esSpiegelAus(); if (!esSichtbar()) return; if (!v.videoWidth) return;
  const w = 240, h = Math.round(w * v.videoHeight / v.videoWidth); // klein rechnen, groß zeigen
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; ES_SPIEGEL.karte = null; }
  if (!ES_SPIEGEL.klein) ES_SPIEGEL.klein = document.createElement("canvas");
  const q = ES_SPIEGEL.klein; if (q.width !== w || q.height !== h) { q.width = w; q.height = h; }
  const qg = q.getContext("2d", { willReadFrequently: true }); qg.drawImage(v, 0, 0, w, h);
  const g = c.getContext("2d");
  if (!ES_SPIEGEL.dick) { g.save(); g.translate(w, 0); g.scale(-1, 1); g.drawImage(q, 0, 0); g.restore(); return; }
  if (!ES_SPIEGEL.karte || ES_SPIEGEL.w !== w || ES_SPIEGEL.h !== h) { ES_SPIEGEL.karte = esSpiegelKarte(w, h); ES_SPIEGEL.w = w; ES_SPIEGEL.h = h; }
  const ein = new Uint32Array(qg.getImageData(0, 0, w, h).data.buffer), aus = g.createImageData(w, h), a32 = new Uint32Array(aus.data.buffer), k = ES_SPIEGEL.karte;
  for (let i = 0; i < k.length; i++) a32[i] = ein[k[i]];
  g.putImageData(aus, 0, 0);
}
function esSpiegelDick() { ES_SPIEGEL.dick = !ES_SPIEGEL.dick; const b = $("esSpiegelDick"); if (b) b.textContent = ES_SPIEGEL.dick ? "🐹 Pausbäckchen" : "🙂 Normal"; }
function esSpiegelAus(zeigen) {
  cancelAnimationFrame(ES_SPIEGEL.raf); ES_SPIEGEL.raf = 0;
  try { ES_SPIEGEL.stream?.getTracks().forEach((t) => t.stop()); } catch (e) { /* schon aus */ }
  ES_SPIEGEL.stream = null; if (ES_SPIEGEL.video) ES_SPIEGEL.video.srcObject = null; ES_SPIEGEL.video = null;
  if (zeigen && $("esSpiegelBild")) esSpiegelZeigen($("hrFlaeche"));
}
document.addEventListener("visibilitychange", () => { if (document.hidden && ES_SPIEGEL.stream) esSpiegelAus(true); }); // Handy weggelegt → Kamera sofort aus

// ----- 🖼️ Diashow: Fotos aus dem Fotoalbum (alle oder ein Album), sanft überblendet, langsam gezoomt -----
async function esDiaZeigen(f) {
  const d = ES.dia;
  f.innerHTML = `<div class="es-dia" onclick="if (event.target.tagName === 'IMG' || event.target === this || event.target.id === 'esDiaHinter') this.classList.toggle('ohne-leiste')"><div class="es-dia-hinter" id="esDiaHinter"></div><img class="es-dia-bild" alt=""><img class="es-dia-bild" alt=""><div class="es-dia-text" id="esDiaText">Fotos werden geladen …</div>
    <div class="es-leiste es-dia-leiste"><select id="esDiaAlbum" aria-label="Welche Fotos?" onchange="esDiaAlbum(this.value)"><option value="">📷 Alle</option></select>
      <button type="button" class="es-k" onclick="esDiaSchritt(-1)" aria-label="Voriges Foto">◀</button><button type="button" class="es-k" id="esDiaPause" onclick="esDiaPause()" aria-label="Pause">⏸</button><button type="button" class="es-k" onclick="esDiaSchritt(1)" aria-label="Nächstes Foto">▶</button>${esDiaMusikKnopf()}${document.fullscreenEnabled ? '<button type="button" class="es-k" onclick="esDiaVollbild()" aria-label="Vollbild">⛶</button>' : ""}</div></div>`;
  esDiaMusikStart(); // 2.453.0: noch im Antippen starten (Handys erlauben Ton nur nach einer Berührung)
  if (!d.fotos && !d.laedt) await esDiaLaden(esLies("album", ""));
  esDiaAlbenZeigen();
  if (!d.fotos?.length) { $("esDiaText").textContent = d.fehler ? "⚠️ " + d.fehler : "Noch keine Fotos im Fotoalbum."; return; }
  esDiaBild(d.i, true); esDiaTakt();
}
async function esDiaLaden(album) {
  const d = ES.dia; d.laedt = true; d.fehler = "";
  try { const r = await api("fotos_liste", album ? { album_id: album } : {}); d.fotos = (r.fotos || []).filter((x) => x.vorschau); d.alben = r.alben || []; d.album = album; d.i = 0; d.urls.clear(); }
  catch (e) { d.fotos = []; d.fehler = e.message || "Fotos gerade nicht erreichbar"; }
  d.laedt = false;
}
function esDiaAlbenZeigen() {
  const s = $("esDiaAlbum"); if (!s) return;
  s.innerHTML = `<option value="">📷 Alle</option>` + ES.dia.alben.map((a) => `<option value="${esc(a.id)}"${a.id === ES.dia.album ? " selected" : ""}>📸 ${esc(a.name || a.titel || "Album")}</option>`).join("");
  $("esDiaPause").textContent = ES.dia.laeuft ? "⏸" : "▶︎";
}
async function esDiaAlbum(id) { esSchreib("album", id); esStop(); await esDiaLaden(id); if (ES.offen && $("hrFlaeche")?.classList.contains("hr-dia")) esTab("dia"); }
async function esDiaUrl(foto) { // große Fassung nachladen (einmal je Foto), sonst die Vorschau
  const d = ES.dia; if (d.urls.has(foto.id)) return d.urls.get(foto.id);
  try { const r = await api("foto_oeffnen", { id: foto.id }); d.urls.set(foto.id, r.url); return r.url; } catch (e) { return foto.vorschau; }
}
async function esDiaBild(i, sofort) {
  const d = ES.dia, n = d.fotos?.length || 0; if (!n) return;
  d.i = ((i % n) + n) % n; const foto = d.fotos[d.i], tok = ++d.seite;
  const bilder = document.querySelectorAll("#hrFlaeche .es-dia-bild"); if (bilder.length < 2) return;
  const neu = [...bilder].find((b) => !b.classList.contains("an")) || bilder[0], alt = [...bilder].find((b) => b !== neu);
  neu.onload = () => { if (tok !== d.seite) return; neu.classList.remove("zoom"); void neu.offsetWidth; neu.classList.add("an", "zoom"); alt?.classList.remove("an"); };
  neu.src = foto.vorschau; // sofort die Vorschau, dann die große Fassung
  const hi = $("esDiaHinter"); if (hi) hi.style.backgroundImage = `url("${foto.vorschau}")`; // 2.295.0: weichgezeichneter Hintergrund statt schwarzer Balken
  const t = $("esDiaText"); if (t) t.textContent = [foto.thema, foto.datum ? fTagDe(foto.datum) : "", foto.von?.name ? "📷 " + foto.von.name : ""].filter(Boolean).join(" · ") + `  (${d.i + 1}/${n})`;
  const gross = await esDiaUrl(foto); if (tok === d.seite && gross && gross !== foto.vorschau) { const v = new Image(); v.onload = () => { if (tok === d.seite) neu.src = gross; }; v.src = gross; }
  if (n > 1) esDiaUrl(d.fotos[(d.i + 1) % n]); // das nächste schon vorbereiten
  if (sofort) neu.classList.add("an");
}
// 2.295.0: Foto antippen blendet Leiste und Text aus (fast Vollbild); ⛶ schaltet echtes Vollbild, wo das Handy es kann
function esDiaVollbild() { const f = $("hrFlaeche"); try { if (document.fullscreenElement) document.exitFullscreen(); else f?.requestFullscreen?.(); } catch (e) { /* ohne Vollbild */ } }
function esDiaTakt() { clearInterval(ES.timer); ES.timer = 0; if (!ES.dia.laeuft) return; ES.timer = setInterval(() => { if (!esSichtbar()) return; esDiaBild(ES.dia.i + 1); }, 6500); }
function esDiaSchritt(r) { esDiaBild(ES.dia.i + r); esDiaTakt(); }
function esDiaPause() { ES.dia.laeuft = !ES.dia.laeuft; $("esDiaPause").textContent = ES.dia.laeuft ? "⏸" : "▶︎"; esDiaTakt(); esDiaMusikTick(); melde(ES.dia.laeuft ? "▶︎ Diashow läuft" : "⏸ Diashow angehalten"); }
function esDiaMusikKnopf() { const an = esDiaMusikGewuenscht(); return `<button type="button" class="es-k${an ? " an" : ""}" id="esDiaMusik" onclick="esDiaMusikSchalten()" aria-pressed="${an}" aria-label="Musik zur Diashow: Club-Song ${an ? "aus" : "an"}schalten" title="Club-Song zur Diashow">${an ? "🎵" : "🔇"}</button>`; }
function esDiaMusikSchalten() {
  const an = !esDiaMusikGewuenscht(); esSchreib("diaMusik", an ? "1" : "");
  const k = $("esDiaMusik"); if (k) k.outerHTML = esDiaMusikKnopf();
  if (an) esDiaMusikStart(); else esDiaMusikAus();
  melde(an ? "🎵 Club-Song zur Diashow an" : "🔇 Diashow ohne Musik");
}
function esDiaMusikStart() {
  if (!esDiaMusikGewuenscht()) return; const d = ES.dia;
  if (BWM.stueck?.id !== "clubsong" || !d.musik) { const s = BW_STUECKE.find((x) => x.id === "clubsong"); if (!s) return; BWM.stueck = s; BWM.gesamt = 0; BWM.schritt = 0; BWM.stufe = 2; }
  d.musik = true; if (d.laeuft) bwMusik(true);
  clearInterval(d.musikTakt); d.musikTakt = setInterval(esDiaMusikTick, 1000);
}
function esDiaMusikTick() {
  const d = ES.dia; if (!d.musik) return;
  if (!$("esDiaMusik")) return esDiaMusikAus(); // Diashow nicht mehr zu sehen
  if (!esSichtbar() || !d.laeuft) { if (BWM.laeuft) bwMusik(false); return; }
  if (!BWM.laeuft) bwMusik(true);
  if (BWM.stueck && Math.floor((BWM.gesamt || 0) / 16) >= bwmTakte(BWM.stueck)) { BWM.gesamt = 0; BWM.schritt = 0; BWM.zeit += 1; BWM.start = BWM.zeit; } // von vorn, kurze Atempause
}
function esDiaMusikAus() {
  const d = ES.dia; clearInterval(d.musikTakt); d.musikTakt = 0; if (!d.musik) return; d.musik = false;
  if (!BW.lauf && !BW.hoeren) { bwMusik(false); BWM.stueck = null; }
}

// ----- 🖍️ Tafel und 📋 Flipchart: mit dem Finger skizzieren (gemeinsamer Zeichen-Kern) -----
// Striche werden als Linien gemerkt (0…1, auf diesem Gerät) – so passt das Bild auch nach dem Drehen des Handys, und ↶ nimmt den letzten zurück.
// Tafel: Kreidefarben, drei Stiftdicken, 🧽 Schwamm, 🧹 alles abwischen (Schwamm fährt im Zickzack).
// 2.295.0 KC-CLUB-FLIPCHART (Wunsch Hansi „großes Flipboard zum Skizzieren; ist das Blatt voll, nach hinten klappen – auch speichern, versenden“):
// weißes Papier am Ständer, Marker, Radierer; „⤴ Umblättern“ klappt das Blatt nach hinten über die Leiste (neues oder nächstes Blatt),
// „⤵ Zurück“ holt das vorige wieder nach vorn, „✂️ Abreißen“ entfernt ein Blatt. 📤 Sichern gilt immer für das sichtbare Blatt.
const ES_MARKER = [["#212529", "Schwarz"], ["#1c7ed6", "Blau"], ["#e03131", "Rot"], ["#2f9e44", "Grün"], ["#f08c00", "Orange"], ["#7048e8", "Lila"]];
const ES_MARKER_DICKEN = [[3, "fein"], [6, "mittel"], [12, "dick"]];
const ES_PAPIER = "#fcfbf7";
ES.flip = { blaetter: null, i: 0, farbe: "#212529", dicke: 1, werkzeug: "stift", zeichnet: null };
const ES_ZF = {
  tafel: { id: "esTafel", farben: ES_FARBEN, dicken: ES_DICKEN, radier: ES_SCHWAMM, radierW: 34, kreide: true, name: "Skizze", radierName: "Schwamm – mit dem Finger über die Tafel wischen" },
  flip: { id: "esFlip", farben: ES_MARKER, dicken: ES_MARKER_DICKEN, radier: ES_PAPIER, radierW: 26, kreide: false, name: "Flipchart", radierName: "Radierer – mit dem Finger über das Blatt wischen" },
};
const esZ = (art) => art === "flip" ? ES.flip : ES.tafel;
function esFlipLaden() { const f = ES.flip; if (f.blaetter) return; try { const d = JSON.parse(esLies("flip", "null")); f.blaetter = Array.isArray(d?.b) && d.b.length ? d.b : [[]]; f.i = Math.min(Math.max(0, d?.i || 0), f.blaetter.length - 1); } catch (e) { f.blaetter = [[]]; f.i = 0; } }
function esZfStriche(art) {
  if (art === "flip") { esFlipLaden(); return ES.flip.blaetter[ES.flip.i]; }
  const t = ES.tafel; if (!t.striche) { try { t.striche = JSON.parse(esLies("tafel", "[]")) || []; } catch (e) { t.striche = []; } } return t.striche;
}
function esZfMerken(art) {
  if (art === "flip") { const f = ES.flip; let n = 0; for (const b of f.blaetter) for (const x of b) n += x.p.length; if (n < 60000) esSchreib("flip", JSON.stringify({ b: f.blaetter, i: f.i })); return; }
  const s = esZfStriche("tafel"); let n = 0; for (const x of s) n += x.p.length; if (n < 30000) esSchreib("tafel", JSON.stringify(s));
}
const esTafelStriche = () => esZfStriche("tafel"), esTafelMerken = () => esZfMerken("tafel");
function esZfZeigen(f, art) {
  const z = esZ(art), cfg = ES_ZF[art], flip = art === "flip";
  if (flip) esFlipLaden();
  f.innerHTML = `<div class="es-zf es-${art}"><div class="es-zf-papier">${flip ? '<div class="es-flip-stapel"></div>' : ""}<canvas id="${cfg.id}" aria-label="${flip ? "Flipchart" : "Tafel"} zum Zeichnen"></canvas>
    ${flip ? '<div class="es-flip-leiste-oben"><i></i><i></i></div><div class="es-flip-nr" id="esFlipNr"></div>' : '<div class="es-tafel-rand"></div>'}</div>
    <div class="es-leiste es-zf-leiste">
      <span class="es-gruppe">${cfg.farben.map(([c, n]) => `<button type="button" class="es-farbe" data-c="${c}" style="--c:${c}" title="${n}" aria-label="Farbe ${n}" onclick="esZfFarbe('${art}','${c}')"></button>`).join("")}</span>
      <span class="es-gruppe">${cfg.dicken.map(([w, n], i) => `<button type="button" class="es-dicke" data-i="${i}" title="Stift ${n}" aria-label="Stift ${n}" onclick="esZfDicke('${art}',${i})"><i style="--w:${w}px"></i></button>`).join("")}
        <button type="button" class="es-k es-schwamm" id="esRadier" title="${flip ? "Radierer" : "Schwamm"}" aria-label="${flip ? "Radierer" : "Schwamm"}" onclick="esZfWerkzeug('${art}','radier')">🧽</button>
        <button type="button" class="es-k" title="Letzten Strich zurück" aria-label="Rückgängig" onclick="esZfZurueck('${art}')">↶</button></span>
      <span class="es-gruppe">${flip ? `<button type="button" class="es-k" id="esFlipZurueck" title="Voriges Blatt nach vorn holen" aria-label="Voriges Blatt" onclick="esFlipBlaettern(-1)">⤵</button><button type="button" class="es-k" title="Blatt nach hinten umklappen" onclick="esFlipBlaettern(1)">⤴ Umblättern</button><button type="button" class="es-k" title="Blatt abreißen" aria-label="Blatt abreißen" onclick="esFlipAbreissen()">✂️</button><button type="button" class="es-k" id="esFlipMuster" title="Papier: blanko, kariert oder liniert – antippen schaltet weiter" onclick="esFlipMusterWeiter()">${ES_FLIP_MUSTER.find(([k]) => k === esFlipMuster())[1]}</button>`
        : `<button type="button" class="es-k" title="Alles abwischen" aria-label="Alles abwischen" onclick="esTafelAbwischen()">🧹</button>`}
        <button type="button" class="es-k es-haupt" title="Speichern oder verschicken" onclick="esZfTeilen('${art}')">📤 Sichern</button></span></div></div>`;
  const c = $(cfg.id);
  c.addEventListener("pointerdown", (e) => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (er) { /* alte Browser */ }
    const p = esZfPunkt(c, e), s = z.werkzeug === "radier" ? { s: 1, w: cfg.radierW / Math.max(1, c.clientWidth), p: [p] } : { c: z.farbe, w: cfg.dicken[z.dicke][0] / Math.max(1, c.clientWidth), p: [p] };
    esZfStriche(art).push(s); z.zeichnet = s; esZfStrich(c.getContext("2d"), s, c, 0, art); });
  c.addEventListener("pointermove", (e) => { const s = z.zeichnet; if (!s) return; e.preventDefault();
    for (const ev of e.getCoalescedEvents ? e.getCoalescedEvents() : [e]) s.p.push(esZfPunkt(c, ev));
    esZfStrich(c.getContext("2d"), s, c, Math.max(0, s.p.length - 6), art); });
  const fertig = () => { if (!z.zeichnet) return; const war = z.zeichnet; z.zeichnet = null; esZfMerken(art); if (flip && war.s) esZfMalen(art); }; // Flipchart: Linien unter dem Radierer wieder zeigen
  c.addEventListener("pointerup", fertig); c.addEventListener("pointercancel", fertig); c.addEventListener("pointerleave", fertig);
  esZfGroesse(art); esZfLeiste(art);
  if (!z.ro && window.ResizeObserver) z.ro = new ResizeObserver(() => { if ($(cfg.id)) esZfGroesse(art); });
  z.ro?.observe(c);
}
const esTafelZeigen = (f) => esZfZeigen(f, "tafel"), esFlipZeigen = (f) => esZfZeigen(f, "flip");
function esZfPunkt(c, e) { const r = c.getBoundingClientRect(); return [Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * 10000) / 10000, Math.round(((e.clientY - r.top) / Math.max(1, r.height)) * 10000) / 10000]; }
function esZfGroesse(art) {
  const c = $(ES_ZF[art].id); if (!c) return; const dpr = Math.min(2.5, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  esZfMalen(art);
}
function esTafelGrund(g, c) {
  g.save(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.shadowBlur = 0; g.fillStyle = ES_TAFEL_GRUND; g.fillRect(0, 0, c.width, c.height);
  const v = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * .2, c.width / 2, c.height / 2, Math.max(c.width, c.height) * .75);
  v.addColorStop(0, "rgba(255,255,255,.05)"); v.addColorStop(1, "rgba(0,0,0,.28)"); g.fillStyle = v; g.fillRect(0, 0, c.width, c.height); g.restore();
}
// 2.296.0 KC-CLUB-FLIPCHART-MUSTER (Wunsch Hansi): ▢ blanko → ▦ kariert → ☰ liniert – ein Knopf schaltet weiter; Linien leicht grau
const ES_FLIP_MUSTER = [["blanko", "▢ Blanko"], ["kariert", "▦ Kariert"], ["liniert", "☰ Liniert"]];
const esFlipMuster = () => { const m = esLies("flipmuster", "blanko"); return ES_FLIP_MUSTER.some(([k]) => k === m) ? m : "blanko"; };
function esFlipMusterWeiter() {
  const i = ES_FLIP_MUSTER.findIndex(([k]) => k === esFlipMuster()), n = ES_FLIP_MUSTER[(i + 1) % ES_FLIP_MUSTER.length];
  esSchreib("flipmuster", n[0]); const b = $("esFlipMuster"); if (b) b.textContent = n[1]; esZfMalen("flip");
}
function esFlipGrund(g, c) {
  g.save(); g.globalAlpha = 1; g.shadowBlur = 0; g.fillStyle = ES_PAPIER; g.fillRect(0, 0, c.width, c.height);
  const m = esFlipMuster(); if (m !== "blanko") {
    g.strokeStyle = "rgba(110,120,130,.26)"; g.lineWidth = Math.max(1, c.width / 420); g.beginPath();
    const st = m === "kariert" ? c.width / 22 : c.width / 13;
    for (let y = m === "kariert" ? st : st * 1.3; y < c.height; y += st) { g.moveTo(0, Math.round(y) + .5); g.lineTo(c.width, Math.round(y) + .5); }
    if (m === "kariert") for (let x = st; x < c.width; x += st) { g.moveTo(Math.round(x) + .5, 0); g.lineTo(Math.round(x) + .5, c.height); }
    g.stroke();
  }
  g.restore();
}
function esZfMalen(art, c, striche) { // ohne c/striche: das sichtbare Blatt neu zeichnen
  c = c || $(ES_ZF[art].id); if (!c) return; const g = c.getContext("2d");
  (art === "flip" ? esFlipGrund : esTafelGrund)(g, c);
  if (art === "flip") { // Striche auf eigener Ebene: der Radierer nimmt nur Striche weg, die Karos/Linien bleiben
    const e = ES.flipEbene || (ES.flipEbene = document.createElement("canvas")); e.width = c.width; e.height = c.height; const eg = e.getContext("2d");
    for (const s of striche || esZfStriche(art)) esZfStrich(eg, s, e, 0, art, true); g.drawImage(e, 0, 0);
  } else for (const s of striche || esZfStriche(art)) esZfStrich(g, s, c, 0, art);
  if (art === "flip" && !striche) esFlipNr();
}
function esZfStrich(g, s, c, ab, art, ebene) {
  const W = c.width, H = c.height, b = Math.max(1, s.w * W), cfg = ES_ZF[art || "tafel"];
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = b;
  if (s.s && ebene) { g.globalCompositeOperation = "destination-out"; g.strokeStyle = "#000"; }
  else if (s.s) { g.strokeStyle = cfg.radier; g.shadowBlur = 0; } else { g.strokeStyle = s.c; if (cfg.kreide) { g.shadowColor = s.c; g.shadowBlur = Math.min(4, b * .35); g.globalAlpha = .93; } }
  const p = s.p; g.beginPath();
  if (p.length === 1) { g.fillStyle = g.strokeStyle; g.arc(p[0][0] * W, p[0][1] * H, b / 2, 0, Math.PI * 2); g.fill(); g.restore(); return; }
  g.moveTo(p[ab][0] * W, p[ab][1] * H);
  for (let i = ab + 1; i < p.length; i++) { const m = [(p[i - 1][0] + p[i][0]) / 2, (p[i - 1][1] + p[i][1]) / 2]; g.quadraticCurveTo(p[i - 1][0] * W, p[i - 1][1] * H, m[0] * W, m[1] * H); }
  g.lineTo(p[p.length - 1][0] * W, p[p.length - 1][1] * H); g.stroke(); g.restore();
}
const esTafelStrich = (g, s, c, ab) => esZfStrich(g, s, c, ab, "tafel"), esTafelMalen = () => esZfMalen("tafel");
function esZfLeiste(art) {
  const z = esZ(art);
  document.querySelectorAll("#hrFlaeche .es-farbe").forEach((b) => b.classList.toggle("an", z.werkzeug === "stift" && b.dataset.c === z.farbe));
  document.querySelectorAll("#hrFlaeche .es-dicke").forEach((b) => b.classList.toggle("an", z.werkzeug === "stift" && Number(b.dataset.i) === z.dicke));
  $("esRadier")?.classList.toggle("an", z.werkzeug === "radier");
}
function esZfFarbe(art, c) { const z = esZ(art); z.farbe = c; z.werkzeug = "stift"; esZfLeiste(art); }
function esZfDicke(art, i) { const z = esZ(art); z.dicke = i; z.werkzeug = "stift"; esZfLeiste(art); }
function esZfWerkzeug(art, w) { const z = esZ(art); z.werkzeug = z.werkzeug === w ? "stift" : w; esZfLeiste(art); if (z.werkzeug === "radier") melde("🧽 " + ES_ZF[art].radierName); }
function esZfZurueck(art) { const s = esZfStriche(art); if (!s.length) return melde(art === "flip" ? "Das Blatt ist schon leer." : "Die Tafel ist schon leer."); s.pop(); esZfMerken(art); esZfMalen(art); }
// KC-CLUB-RC-PRUEFUNG (20.10.2026): esTafelFarbe/-Dicke/-Werkzeug/-Zurueck entfernt – nirgends benutzt
async function esTafelAbwischen() {
  const s = esTafelStriche(), c = $("esTafel"); if (!c) return;
  if (!s.length) return melde("Die Tafel ist schon sauber. ✨");
  if (!esOhneAnim()) { // der Schwamm fährt im Zickzack über die Tafel und nimmt alles mit
    const f = c.parentElement, sw = document.createElement("span"); sw.className = "es-schwamm-flug"; sw.textContent = "🧽"; f.appendChild(sw);
    const g = c.getContext("2d"), bahn = [], reihen = Math.max(3, Math.min(9, Math.ceil(c.height / Math.max(1, c.width) / .2)));
    for (let r = 0; r <= reihen; r++) { const y = (r + .5) / (reihen + 1); bahn.push(r % 2 ? [1.02, y] : [-.02, y], r % 2 ? [-.02, y] : [1.02, y]); }
    const dauer = 1400, t0 = performance.now(), wisch = { s: 1, w: .26, p: [] };
    await new Promise((fertig) => { const schritt = (jetzt) => {
      const q = Math.min(1, Math.max(0, (jetzt - t0) / dauer)), pos = q * (bahn.length - 1), i = Math.min(bahn.length - 2, Math.floor(pos)), u = pos - i;
      const x = bahn[i][0] + (bahn[i + 1][0] - bahn[i][0]) * u, y = bahn[i][1] + (bahn[i + 1][1] - bahn[i][1]) * u;
      wisch.p.push([x, y]); esTafelStrich(g, wisch, c, Math.max(0, wisch.p.length - 3));
      sw.style.left = (x * 100) + "%"; sw.style.top = (y * 100) + "%";
      if (q < 1) requestAnimationFrame(schritt); else fertig(); }; requestAnimationFrame(schritt); });
    sw.remove();
  }
  ES.tafel.striche = []; esTafelMerken(); esTafelMalen(); melde("🧽 Alles abgewischt");
}
// ----- 📋 Flipchart: umblättern (nach hinten über die Leiste), zurückblättern, abreißen -----
function esFlipNr() { const f = ES.flip, n = $("esFlipNr"); if (n) n.textContent = `Blatt ${f.i + 1} von ${f.blaetter.length}`; const z = $("esFlipZurueck"); if (z) z.disabled = f.i === 0; }
function esFlipBild(striche) { // ein Blatt als Bild (für die Klapp-Animation)
  const c = $("esFlip"), t = document.createElement("canvas"); t.width = c.width; t.height = c.height; esZfMalen("flip", t, striche); return t.toDataURL("image/png");
}
async function esFlipKlappen(bild, richtung) { // richtung 1: Blatt klappt nach hinten weg · -1: voriges Blatt klappt nach vorn
  const c = $("esFlip"); if (!c || esOhneAnim()) return;
  const k = document.createElement("div"); k.className = "es-flip-klapp " + (richtung > 0 ? "weg" : "her"); k.style.backgroundImage = `url(${bild})`;
  k.style.left = c.offsetLeft + "px"; k.style.top = c.offsetTop + "px"; k.style.width = c.offsetWidth + "px"; k.style.height = c.offsetHeight + "px";
  c.parentElement.appendChild(k); await new Promise((ok) => setTimeout(ok, 720)); k.remove();
}
async function esFlipBlaettern(r) {
  const f = ES.flip; esFlipLaden(); if (f.dreht) return;
  if (r > 0) {
    if (!esZfStriche("flip").length) return melde("Das Blatt ist noch leer – erst etwas skizzieren. ✏️");
    const bild = $("esFlip").toDataURL("image/png"); f.i++; if (f.i >= f.blaetter.length) f.blaetter.push([]);
    esZfMerken("flip"); esZfMalen("flip"); f.dreht = true; await esFlipKlappen(bild, 1); f.dreht = false;
    melde(f.blaetter[f.i].length ? `📋 Blatt ${f.i + 1}` : "📋 Neues Blatt – das alte ist nach hinten geklappt");
  } else {
    if (f.i === 0) return melde("Das ist das erste Blatt.");
    const bild = esFlipBild(f.blaetter[f.i - 1]); f.dreht = true; await esFlipKlappen(bild, -1); f.dreht = false;
    f.i--; esZfMerken("flip"); esZfMalen("flip");
  }
}
async function esFlipAbreissen() {
  const f = ES.flip; esFlipLaden();
  if (!(await frage(`Blatt ${f.i + 1} abreißen?\n\nEs ist danach weg. Vorher sichern? Dann „Abbrechen“ und 📤 Sichern tippen.`, { ja: "✂️ Abreißen", nein: "Abbrechen" }))) return;
  const c = $("esFlip");
  if (c && !esOhneAnim()) { const k = document.createElement("div"); k.className = "es-flip-klapp ab"; k.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
    k.style.left = c.offsetLeft + "px"; k.style.top = c.offsetTop + "px"; k.style.width = c.offsetWidth + "px"; k.style.height = c.offsetHeight + "px"; c.parentElement.appendChild(k); setTimeout(() => k.remove(), 900); }
  f.blaetter.splice(f.i, 1); if (!f.blaetter.length) f.blaetter.push([]); f.i = Math.min(f.i, f.blaetter.length - 1);
  esZfMerken("flip"); esZfMalen("flip"); melde("✂️ Blatt abgerissen");
}
// ----- 📤 Sichern: das sichtbare Blatt als Bild – als Nachricht oder ins Archiv -----
async function esTafelDatei(art) {
  const cfg = ES_ZF[art || "tafel"], c = $(cfg.id); if (!c) return null;
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png")); if (!blob) return null;
  const hm = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Berlin" }).format(new Date()).replace(":", ""), name = `${cfg.name}-${heuteIso()}-${hm}.png`;
  try { return new File([blob], name, { type: "image/png" }); } catch (e) { blob.name = name; return blob; } // sehr alte Browser: Blob mit Namen
}
function esZfTeilen(art) {
  if (!esZfStriche(art).length) return melde(art === "flip" ? "Das Blatt ist noch leer – erst etwas skizzieren. ✏️" : "Die Tafel ist noch leer – erst etwas skizzieren. 🖍️");
  blattAuf("esTafelBlatt", `<h3 style="margin-top:0">📤 ${art === "flip" ? "Flipchart-Blatt" : "Skizze"} sichern</h3><p class="hinweis" style="margin:0 0 8px">${art === "flip" ? "Gesichert wird das Blatt, das du gerade siehst." : "Die Tafel bleibt danach, wie sie ist."}</p>
    <div class="knoepfe" style="flex-direction:column;align-items:stretch">
      <button class="knopf haupt" onclick="esTafelNach('chat','${art}')">💬 Als Nachricht senden</button>
      <button class="knopf" onclick="esTafelNach('archiv','${art}')">🗄️ Im Archiv speichern</button>
      <button class="knopf" onclick="$('esTafelBlatt').remove()">Abbrechen</button></div>`);
}
// KC-CLUB-RC-PRUEFUNG (20.10.2026): esTafelTeilen entfernt – nirgends benutzt
async function esTafelNach(wohin, art) {
  art = art || "tafel"; $("esTafelBlatt")?.remove();
  const d = await esTafelDatei(art); if (!d) return melde("Das Bild konnte gerade nicht erstellt werden – bitte nochmal versuchen.", true);
  if (wohin === "chat") { TEILEN = { text: "", dateien: [d] }; return teilenChatWahl(); } // gleicher Weg wie „Teilen → Köcheclub“: Chat wählen, man drückt selbst ➤
  const heute = heuteIso(), titel = `${art === "flip" ? `Flipchart (Blatt ${ES.flip.i + 1})` : "Skizze"} vom ${heute.split("-").reverse().join(".")}`;
  const ok = await archivAblageFragen("skizze", { titel, datum: heute, hinweis: art === "flip" ? "vom Flipchart (Rückseite des Kopfes)" : "von der Tafel (Rückseite des Kopfes)", frage: "Wohin mit der Skizze?", ja: "Im Archiv ablegen", nein: "Abbrechen",
    dateien: async () => [{ titel, name: d.name, mime: "image/png", blob: d }] });
  if (!ok) melde("Das Archiv ist gerade nicht erreichbar (oder es gibt noch keinen eigenen Archiv-Ordner) – bitte später nochmal oder als Nachricht senden.", true);
}
// ---------- KC-CLUB-BEWEGUNGSBUEHNE (2.293.0, Wunsch Hansi): 🎭 Bühne für Bewegung auf der Rückseite des Kopfes ----------
// Twinkey (mit Schweißstirnband statt Kochmütze) turnt auf der Bühne vor – im Sitzen, im Stehen oder mit Küchenhelfern (großer Schneebesen,
// Kochlöffel, Nudelholz, Wasserflaschen, Topfdeckel, Geschirrtuch). Dazu Musik (im Handy erzeugt, keine Datei, kein Internet) und Ansagen
// wie beim Fitnesstrainer. Nur auf diesem Gerät, nichts wird gespeichert oder gesendet. Läuft nur, solange man die Bühne sieht.
// 2.294.0 KC-CLUB-BEWEGUNGSBUEHNE-2 (Wunsch Hansi „Bewegungen natürlicher, rote Turnschuhe mit Streifen, bessere Musik, mehr Sprüche“):
// eigene Figur mit Schulter, Ellbogen, Hüfte und Knie (Gelenke bewegen sich leicht versetzt, schwingen nach, der Körper wippt im Takt);
// Bewegungen laufen im Takt der Musik (Dauer in Schlägen, --b) und starten auf dem Schlag (--ph). Musik: Pop-Arrangement mit Hook-Melodie,
// Disco-Bass, Akkorden, Fill alle 8 Takte, Riser vor dem Start und Becken auf „Los!“; Tempo nach den Empfehlungen für Seniorenkurse
// (um 120 Schläge/Min., im Sitzen etwas ruhiger). Ansagen: Einzählen „fünf, sechs, sieben, acht“, je Übung eigene Sprüche, Lob, Endspurt,
// „noch 3, noch 2, noch 1“, ausschütteln – der gesprochene Satz steht zusätzlich als Sprechblase da (auch ohne Ton lesbar).
// Übungs-Registry: neue Übung = neuer Eintrag (Bewegung „a“ = CSS-Klasse bw-a-…, Küchenhelfer „p“ = BW_HELFER, eigene Sprüche „c“).
const BW_UEBUNGEN = [
  { id: "armkreis", t: "Arme kreisen", g: "sitzen", a: "armkreis", um: 1, sitz: 1, h: "Arme zur Seite und große Kreise machen.", w: "Und jetzt andersherum!", c: ["Große Kreise – wie ein Windrad!", "Schön groß, die Schultern werden warm!"] },
  { id: "schulter", t: "Schultern hochziehen", g: "sitzen", a: "schulter", sitz: 1, h: "Schultern hoch zu den Ohren – und locker fallen lassen.", c: ["Hoch – und fallen lassen. Herrlich!", "Alle Sorgen von den Schultern!"] },
  { id: "sitzmarsch", t: "Marschieren im Sitzen", g: "sitzen", a: "marsch", sitz: 1, h: "Knie abwechselnd anheben, Arme schwingen mit.", c: ["Wir marschieren zum Wochenmarkt!", "Knie hoch – und die Arme schwingen mit!"] },
  { id: "faeuste", t: "Fäuste machen", g: "sitzen", a: "kneten", sitz: 1, h: "Arme nach vorn, Hände fest zur Faust – und weit auf.", c: ["Fest zu – und weit auf!", "Wie beim Teigkneten – kräftig!"] },
  // 2.303.0 KC-CLUB-BUEHNE-BEWEGUNG-2 (Wunsch Hansi): Hinsetzen und Aufstehen – Twinkey von der Seite, Arme lang nach vorn
  { id: "aufstehen", t: "Aufstehen und hinsetzen", g: "sitzen", a: "aufstehen", seite: 1, sitz: 1, h: "Arme lang nach vorn, Oberkörper leicht vor – langsam aufstehen und langsam wieder hinsetzen. Stuhl an die Wand stellen!", c: ["Hoch – und ganz langsam wieder runter!", "Die Arme helfen beim Gleichgewicht!"] },
  // 2.309.0 KC-CLUB-BUEHNE-BEREIT (Wunsch Hansi): Übungen mit Luftballon und Wasserflaschen-Hanteln
  { id: "ballonsitz", t: "Luftballon hochtippen", g: "sitzen", a: "ballon", ding: "ballon", sitz: 1, h: "Den Luftballon abwechselnd mit der linken und der rechten Hand nach oben tippen – nicht runterfallen lassen!", c: ["Hoch damit – der Ballon darf nicht landen!", "Links – und rechts – schön abwechseln!"] },
  { id: "hantelsitz", t: "Hanteln über den Kopf", g: "sitzen", a: "hochdruecken", p: "flaschen", sitz: 1, h: "In jeder Hand eine Wasserflasche – nach oben drücken und langsam zurück bis zu den Schultern.", c: ["Unsere Hanteln aus der Küche!", "Hoch – und ganz langsam zurück!"] },
  { id: "beine", t: "Beine strecken", g: "sitzen", a: "bein", sitz: 1, h: "Abwechselnd ein Bein lang machen, Fußspitze zu dir ziehen.", c: ["Bein lang – Fußspitze zu dir!", "Schön abwechseln – links, rechts!"] },
  // 2.297.0 KC-CLUB-BUEHNE-KUECHE (Wunsch Hansi): mehr Übungen aus der Küche
  { id: "suppe", t: "Suppe umrühren", g: "sitzen", a: "suppe", p: "loeffel", ding: "topf", um: 1, sitz: 1, h: "Beide Hände am großen Kochlöffel – große Kreise, als ob du im großen Suppentopf rührst.", w: "Und jetzt andersherum rühren!", c: ["Die Suppe darf nicht anbrennen!", "Schön große Kreise!"] },
  { id: "kniehoch", t: "Treppe vom Lager hoch", g: "sitzen", a: "treppe", sitz: 1, h: "Abwechselnd die Knie hoch, als ob du die Treppe vom Lager hochsteigst.", c: ["Stufe für Stufe nach oben!", "Gleich sind wir oben im Lager!"] },
  { id: "kopfneigen", t: "Kopf zur Seite neigen", g: "sitzen", a: "kopfneigen", sitz: 1, h: "Ohr langsam zur Schulter, halten – und zur anderen Seite. Schultern bleiben unten.", c: ["Ganz langsam – und halten.", "Schultern locker lassen!"] },
  { id: "nackenstark", t: "Nacken stärken", g: "sitzen", a: "nackenstark", sitz: 1, h: "Hände an den Hinterkopf, Kopf sanft gegen die Hände drücken – halten – und lösen.", c: ["Sanft drücken – nicht ruckeln!", "Das macht den Nacken stark!"] },
  { id: "abwischen", t: "Tisch abwischen", g: "sitzen", a: "abwischen", sitz: 1, h: "Mit der Hand große Bögen über den Tisch wischen – schön weit.", w: "Und jetzt die andere Hand!", c: ["Blitzblank soll er werden!", "Schön weit ausholen!"] },
  { id: "seitheben", t: "Arme seitlich heben", g: "sitzen", a: "seitheben", sitz: 1, h: "Arme seitlich bis auf Schulterhöhe – und langsam wieder runter.", c: ["Fliegen wie ein Adler!", "Langsam runter – nicht fallen lassen!"] },
  { id: "marsch", t: "Auf der Stelle gehen", g: "stehen", a: "marsch", h: "Knie heben, Arme schwingen. Wer mag, hält sich an der Stuhllehne fest.", c: ["Wir gehen zum Kühlhaus – Tempo!", "Knie hoch, Arme mit!"] },
  // 2.303.0 KC-CLUB-BUEHNE-BEWEGUNG-2 (Wunsch Hansi): hüpfen, Storch, im Kreis gehen, um den Stuhl, Aufstehen von der Seite
  { id: "huepfen", t: "Kleine Hüpfer", g: "stehen", a: "huepfen", h: "Ganz kleine Hüpfer im Takt – wer mag, wippt nur auf den Fußballen.", c: ["Hopp, hopp – wie Popcorn in der Pfanne!", "Ganz locker in den Knien landen!"] },
  { id: "storch", t: "Der Storch", g: "stehen", a: "storch", a2: "storch2", h: "Auf einem Bein stehen, das andere Knie im Takt hoch und runter – der Fuß bleibt in der Luft. Wer mag, hält sich am Stuhl fest.", w: "Und jetzt das andere Bein!", c: ["Wie ein Storch auf der Wiese!", "Fuß bleibt oben – nicht absetzen!"] },
  { id: "seit", t: "Seitschritt", g: "stehen", a: "seit", h: "Ein Schritt zur Seite und zurück – locker in den Knien.", w: "Und jetzt zur anderen Seite!", c: ["Wie in der engen Küche – ausweichen!", "Schön locker in den Knien!"] },
  // 2.304.0 KC-CLUB-BUEHNE-BEWEGUNG-3 (Wunsch Hansi nach Recherche: Seniorentanz/Line-Dance-Grundschritte, Sturzprophylaxe – kleine Schritte, Stuhl zum Festhalten)
  { id: "ruecktipp", t: "Fuß nach hinten", g: "stehen", a: "ruecktipp", profil: 1, h: "Einen Fuß nach hinten tippen und zurück – dann der andere. Arme schieben dabei nach vorn. Wer mag, hält sich am Stuhl fest.", c: ["Hinten antippen – und zurück!", "Schön aufrecht bleiben!"] },
  { id: "steptouch", t: "Tanzschritt: Seit-Tipp", g: "stehen", a: "steptouch", h: "Schritt zur Seite, den anderen Fuß dazutippen und klatschen – dann zur anderen Seite.", c: ["Wie beim Tanztee – Schritt, tipp, klatsch!", "Und rüber – und klatsch!"] },
  { id: "vorzurueck", t: "Vor und zurück", g: "stehen", a: "vorzurueck", profil: 1, h: "Abwechselnd: ein Fuß tippt vorn, dann hinten – dann das andere Bein. Arme schwingen gegengleich mit.", c: ["Vor – und zurück – wie ein Pendel!", "Schön im Takt der Musik!"] },
  { id: "kreis", t: "Im Kreis gehen", g: "stehen", a: "marsch", weg: "kreis", h: "Im Takt eine kleine Runde gehen – Knie hoch, Arme schwingen mit.", w: "Und jetzt die Runde andersherum!", c: ["Eine Runde durch die Küche!", "Schön im Takt – links, rechts!"] },
  { id: "knie", t: "Kniebeuge am Stuhl", g: "stehen", a: "knie", h: "Hände an die Lehne, Po nach hinten – nur so tief, wie es angenehm ist.", c: ["Als ob du dich setzen willst – und hoch!", "Nur so tief, wie es guttut!"] },
  { id: "zehen", t: "Auf die Zehen", g: "stehen", a: "zehen", h: "Langsam hoch auf die Zehen – und wieder runter.", c: ["Ans oberste Regal – hoch!", "Und sanft wieder runter!"] },
  { id: "hampel", t: "Hampelmann ohne Hüpfen", g: "stehen", a: "hampel", h: "Ein Bein zur Seite tippen und dabei die Arme über den Kopf – zurück, und die andere Seite. Ohne zu hüpfen!", c: ["Hampelmann für Genießer – ganz ohne Springen!", "Arme hoch – wie bei einem Tor!"] },
  // 2.308.0 KC-CLUB-BUEHNE-REIFEN-SEIL (Wunsch Hansi): echter Hula-Hoop-Reifen (kreist um die Hüfte, hinten verdeckt) und Seilspringen
  { id: "hulahoop", t: "Hula-Hoop mit Reifen", g: "stehen", a: "hulahoop", a2: "hulahoop2", ding: "hoop", h: "Arme hoch und den Reifen mit kleinen Hüftbewegungen kreisen lassen – ohne Reifen geht es genauso.", w: "Und jetzt andersherum kreisen!", c: ["Der Reifen fliegt – und du bist der Star!", "Locker aus der Hüfte – vor und zurück!"] },
  { id: "seilspringen", t: "Seilspringen", g: "stehen", a: "seilspringen", ding: "seil", h: "Ganz kleine Sprünge im Takt – wer mag, wippt nur auf den Fußballen und kreist die Hände wie mit einem Seil.", c: ["Hopp – und hopp – wie auf dem Schulhof!", "Ganz leicht landen, schön in den Knien federn!"] },
  { id: "ballon", t: "Luftballon hochtippen", g: "stehen", a: "ballon", ding: "ballon", h: "Den Luftballon abwechselnd links und rechts nach oben tippen – er darf den Boden nicht berühren!", c: ["Wie beim Volleyball – nur sanfter!", "Augen auf den Ballon – und tipp!"] },
  { id: "hantelseit", t: "Hanteln seitlich heben", g: "stehen", a: "seitheben", p: "flaschen", h: "In jeder Hand eine Wasserflasche – Arme seitlich bis Schulterhöhe heben und langsam senken.", c: ["Fliegen mit Gewicht – stark!", "Langsam runter – nicht fallen lassen!"] },
  { id: "anfersen", t: "Fersen zum Po", g: "stehen", a: "anfersen", h: "Abwechselnd eine Ferse Richtung Po heben – die Arme ziehen dabei nach unten.", c: ["Ferse hoch – und runter!", "Locker im Takt bleiben!"] },
  { id: "armkreisst", t: "Arme kreisen", g: "stehen", a: "armkreis", um: 1, h: "Arme zur Seite und große Kreise machen – Füße fest auf dem Boden.", w: "Und jetzt andersherum!", c: ["Große Kreise – wie ein Windrad!", "Die Schultern werden schön warm!"] },
  { id: "stuhlrunde", t: "Um den Stuhl laufen", g: "stehen", a: "marsch", weg: "stuhl", h: "Einmal gemütlich um den Stuhl herumgehen – im Takt der Musik.", c: ["Reise nach Jerusalem – nur ohne Drängeln!", "Schön gleichmäßig weitergehen!"] },
  { id: "aufstehst", t: "Aufstehen und hinsetzen", g: "stehen", a: "aufstehen", seite: 1, h: "Vom Stuhl aufstehen und langsam wieder hinsetzen – Arme lang nach vorn. Stuhl an die Wand stellen!", c: ["Hoch – und ganz langsam wieder runter!", "Die Beine machen die Arbeit!"] },
  { id: "strecken", t: "Nach oben strecken", g: "stehen", a: "strecken", h: "Abwechselnd einen Arm weit nach oben – als holst du den großen Topf vom Regal.", c: ["Ganz lang machen – nach den Sternen greifen!", "Links – und rechts – schön lang!"] },
  { id: "treppe", t: "Treppe vom Lager hoch", g: "stehen", a: "treppe", h: "Knie hoch wie auf der Treppe vom Lager – die Arme schwingen mit. Wer mag, hält sich fest.", c: ["Hoch die Knie – Stufe für Stufe!", "Gleich sind wir oben!"] },
  { id: "hula", t: "Hula-Hoop in der Küche", g: "stehen", a: "hula", um: 1, ding: "reifen", h: "Hände in die Hüften und das Becken kreisen lassen – wie mit dem Hula-Hoop-Reifen.", w: "Und jetzt andersherum kreisen!", c: ["Hula-Hoop in der Küche – herrlich!", "Locker aus der Hüfte!"] },
  { id: "suppest", t: "Suppe umrühren", g: "stehen", a: "suppe", p: "loeffel", ding: "topf", um: 1, h: "Beide Hände am großen Kochlöffel – große Kreise im großen Suppentopf.", w: "Und jetzt andersherum rühren!", c: ["Die Suppe darf nicht anbrennen!", "Schön große Kreise!"] },
  { id: "rumpf", t: "Oberkörper drehen", g: "stehen", a: "rumpf", h: "Aufrecht bleiben und ruhig nach links und rechts drehen.", c: ["Zum Kollegen am Nachbarposten schauen!", "Ruhig drehen, schön aufrecht!"] },
  { id: "ruehren", t: "Großen Teig rühren", g: "kueche", a: "ruehren", p: "schneebesen", ding: "schuessel", um: 1, sitz: 1, h: "Mit dem großen Schneebesen kräftig im Kreis rühren.", w: "Und jetzt die andere Richtung!", c: ["Kräftig rühren – der Teig wird fluffig!", "Das wird der beste Kuchen der Welt!"] },
  { id: "besenhoch", t: "Schneebesen in die Luft", g: "kueche", a: "hochdruecken", p: "schneebesen2", sitz: 1, h: "Schneebesen mit beiden Händen nach oben drücken – und wieder runter.", c: ["Hoch damit – wie ein Pokal!", "Und runter bis zu den Schultern!"] },
  { id: "trommeln", t: "Topf-Trommeln", g: "kueche", a: "trommeln", p: "loeffel2", ding: "topf", sitz: 1, h: "Mit zwei Kochlöffeln auf den Topf trommeln – schön im Takt!", c: ["Im Takt der Musik – bumm, bumm!", "Die Küchenband legt los!"] },
  { id: "seitbeuge", t: "Kochlöffel zur Seite", g: "kueche", a: "seitbeuge", p: "loeffel2", h: "Kochlöffel über den Kopf und sanft zur Seite neigen.", w: "Und jetzt zur anderen Seite!", c: ["Wie ein Baum im Wind!", "Schön lang machen an der Seite!"] },
  { id: "flaschen", t: "Wasserflaschen heben", g: "kueche", a: "seitheben", p: "flaschen", sitz: 1, h: "In jeder Hand eine Flasche – Arme seitlich heben und senken.", c: ["Unsere Hanteln aus der Küche!", "Langsam und kontrolliert!"] },
  { id: "deckel", t: "Deckel-Klatschen", g: "kueche", a: "becken", p: "deckel", sitz: 1, h: "Zwei Topfdeckel vor der Brust zusammen – wie ein Becken!", c: ["Tschingderassabum!", "Klatsch – auf den Schlag!"] },
  { id: "nudelholz", t: "Nudelholz rollen", g: "kueche", a: "rollen", ding: "nudel", sitz: 1, h: "Arme nach vorn und den Teig kräftig ausrollen.", c: ["Der Pizzateig wird hauchdünn!", "Vor – und zurück!"] },
  { id: "pfanne", t: "Pfanne schwenken", g: "kueche", a: "pfanne", p: "pfanne", ding: "pfannkuchen", sitz: 1, h: "Pfanne vor dir und den Pfannkuchen hochwerfen – aus dem Handgelenk!", w: "Und jetzt die andere Hand!", c: ["Hopp – und gefangen!", "Wie ein Sternekoch!"] },
  { id: "tuch", t: "Geschirrtuch-Dehnung", g: "kueche", a: "hochhalten", p: "tuch", h: "Geschirrtuch mit beiden Händen hoch über den Kopf und lang machen.", c: ["Ganz lang machen – und atmen!", "Herrlich, das tut gut!"] },
  // 2.313.0 KC-CLUB-BUEHNE-KARTON (Wunsch Hansi „mehr verschiedene Übungen, damit man jedes Mal andere macht“)
  { id: "karton", t: "Karton-Steigen", g: "stehen", a: "karton", profil: 1, h: "Einen stabilen Karton vor dich auf den Boden: einen Fuß drauf, wieder runter – dann der andere Fuß. Wer mag, hält sich an der Stuhllehne fest.", c: ["So kriegen wir das Fett weg!", "Fuß drauf – und runter!"] },
  { id: "kartonkueche", t: "Karton aus dem Lager", g: "kueche", a: "karton", profil: 1, h: "Ein Karton vom Lieferanten steht auf dem Boden: abwechselnd einen Fuß draufstellen und wieder runter.", c: ["So kriegen wir das Fett weg!", "Wie die Treppe ins Lager – nur kürzer!"] },
  { id: "gewuerzregal", t: "Ans Gewürzregal", g: "kueche", a: "zehen", h: "Auf die Zehenspitzen – oben steht das Gewürz. Langsam hoch und wieder runter.", c: ["Ganz oben steht der Muskat!", "Hoch – und sanft runter!"] },
  { id: "vorratsschrank", t: "Zum Vorratsschrank", g: "kueche", a: "marsch", h: "Auf der Stelle gehen, als läufst du zum Vorratsschrank – Knie hoch, Arme schwingen.", c: ["Mehl holen – Tempo!", "Knie hoch, wir haben Hunger!"] },
  { id: "unterschrank", t: "Topf aus dem Unterschrank", g: "kueche", a: "knie", h: "Hände an die Arbeitsplatte oder Stuhllehne, Po nach hinten – als holst du den großen Topf von unten.", c: ["Der Bräter ist ganz hinten – runter!", "Nur so tief, wie es guttut!"] },
  { id: "oberregal", t: "Ins Oberregal greifen", g: "sitzen", a: "strecken", sitz: 1, h: "Im Sitzen abwechselnd einen Arm weit nach oben – oben stehen die Teller.", c: ["Ganz lang machen!", "Links – und rechts!"] },
  { id: "teigsitz", t: "Teig ausrollen", g: "sitzen", a: "rollen", ding: "nudel", sitz: 1, h: "Im Sitzen beide Arme nach vorn und den Teig kräftig ausrollen.", c: ["Der Strudelteig muss dünn werden!", "Vor – und zurück!"] },
  // 2.314.0 KC-CLUB-BUEHNE-RECHERCHE (Wunsch Hansi „im Internet recherchieren, welche Übungen wir noch einbauen können“ – Stuhlgymnastik/Seniorengymnastik)
  { id: "salzstreuer", t: "Zum Salzstreuer greifen", g: "sitzen", a: "seitbeuge", sitz: 1, h: "Im Sitzen seitlich neigen, als greifst du nach dem Salzstreuer – dann die andere Seite.", c: ["Salz rechts – Pfeffer links!", "Schön lang machen!"] },
  { id: "flaschensitz", t: "Wasserflaschen seitlich heben", g: "sitzen", a: "seitheben", p: "flaschen", sitz: 1, h: "In jeder Hand eine kleine Wasserflasche: Arme seitlich bis knapp unter Schulterhöhe heben und langsam senken.", c: ["Wie ein Adler über der Küche!", "Hoch – und langsam runter!"] },
  { id: "applaus", t: "Applaus für den Koch", g: "sitzen", a: "klatschen", sitz: 1, h: "Kräftig in die Hände klatschen – im Takt der Musik.", c: ["Applaus, Applaus!", "Der Koch verbeugt sich schon!"] },
  { id: "wandstuetz", t: "Liegestütz an der Arbeitsplatte", g: "stehen", a: "liegestuetz", profil: 1, h: "Hände auf eine feste Arbeitsplatte oder Tischkante, ein Schritt zurück – Körper gerade nach vorn neigen und wieder wegdrücken.", c: ["Stark wie ein Bäcker!", "Rücken schön gerade!"] },
  { id: "arbeitsplatte", t: "Arbeitsplatten-Liegestütz", g: "kueche", a: "liegestuetz", profil: 1, h: "Hände an die Arbeitsplatte, Körper gerade halten, nach vorn neigen – und wieder hoch drücken.", c: ["So kriegen wir das Fett weg!", "Die Arbeitsplatte hält – du auch!"] },
  { id: "brotteig", t: "Brotteig kneten", g: "kueche", a: "kneten", sitz: 1, h: "Fäuste machen und kräftig kneten – der Brotteig muss geschmeidig werden.", c: ["Kneten, kneten, kneten!", "Das wird ein Bauernbrot!"] },
];
const BW_MODI = [["sitzen", "🪑 Im Sitzen"], ["stehen", "🧍 Im Stehen"], ["kueche", "🥄 Küchenhelfer"], ["kette", "🔥 Power-Kette"]];
// ---------- 2.370.0 KC-CLUB-BUEHNE-POWERKETTE (Wunsch Hansi): neue Übung im Stehen – sieben Bewegungen als Kette, immer wieder von vorn ----------
// Knie rechts hoch, Knie links hoch, Schritt nach links, Schritt nach rechts, Kniebeuge mit Armen nach vorn, Hula-Hoop-Hüfte, Sprung in die Luft.
// Je Bewegung 4 Schläge (2 s bei 120 Schlägen/Min.), eine Kette 16 s (2.438.0: 8 Bewegungen), ein Durchgang 4 Ketten (64 s); 3 Durchgänge mit Verschnaufpause.
// Twinkey turnt spiegelbildlich vor (wie ein Vorturner): „rechts“ ist auf deiner rechten Seite. Dazu markige Ansagen und viel Lob.
const BW_KETTE_TAKT = 2; // Sekunden je Bewegung
const BW_KETTE_SCHRITTE = [
  // 2.399.0 KC-CLUB-BUEHNE-KETTE-TAKT (Fund Hansi „Ablauf stimmt nicht mit den Texten“): jedes Kommando ist in unter 2 s gesprochen –
  // so passt es immer genau zur Bewegung (vorher bis 5 s lang: das nächste Kommando fiel aus oder kam erst bei einer anderen Bewegung)
  { a: "kette-knie-r", t: "Knie hoch – rechts", k: "Knie rechts", s: ["Rechtes Knie hoch!", "Knie rechts – hoch!", "Rechts – Knie hoch!", "Knie rechts – zack!"] },
  { a: "kette-knie-l", t: "Knie hoch – links", k: "Knie links", s: ["Linkes Knie hoch!", "Knie links – hoch!", "Und links – zack!", "Knie links – Power!"] },
  { a: "kette-schritt-l", t: "Schritt nach links", k: "Schritt links", s: ["Schritt nach links!", "Ab nach links!", "Links rüber!", "Und nach links!"] },
  { a: "kette-schritt-r", t: "Schritt nach rechts", k: "Schritt rechts", s: ["Schritt nach rechts!", "Rüber nach rechts!", "Rechts rüber!", "Und nach rechts!"] },
  { a: "kette-hocke", t: "Kniebeuge – Arme nach vorn", k: "Hocke", s: ["Hocke – Arme vor!", "Runter – Arme lang!", "Po nach hinten!", "Tief – Arme vor!"] },
  { a: "kette-hula", t: "Hula-Hoop-Hüfte", k: "Hüfte kreisen", s: ["Hüfte kreisen!", "Hula-Hula!", "Hüfte schwingen!", "Kreisen lassen!"] },
  // 2.438.0 KC-CLUB-BUEHNE-KETTE-HAMPELMANN (Wunsch Hansi „Hampelmann in die Power-Kette“): 8. Bewegung vor dem Sprung – zwei Hampelmänner je 2 s
  { a: "kette-hampel", t: "Hampelmann", k: "Hampelmann", s: ["Hampelmann!", "Hampelmann – los!", "Arme hoch, Beine auf!", "Und hampeln!"] },
  { a: "kette-sprung", t: "Sprung in die Luft", k: "Sprung", s: ["Sprung – hopp!", "Und hopp!", "Abheben – hopp!", "Springen – hopp!"] },
];
const BW_KETTE_H = "Im Stehen, immer der Reihe nach: rechtes Knie hoch, linkes Knie hoch, ein Schritt nach links, ein Schritt nach rechts, Kniebeuge mit den Armen nach vorn, Hüfte kreisen wie beim Hula-Hoop, zwei Hampelmänner, ein Sprung in die Luft – und wieder von vorn. Wer mag, hält sich an der Stuhllehne fest und hüpft nur ganz klein.";
const BW_KETTE_START = "Hallo! Heute machen wir die Power-Kette: drei Durchgänge mit je acht Bewegungen. Rechtes Knie, linkes Knie, Schritt links, Schritt rechts, Hocke mit Armen nach vorn, Hüfte kreisen, Hampelmann, Sprung. Mach nur so viel, wie dir guttut!";
const BW_KETTE = { id: "powerkette", t: "Power-Kette", g: "kette", a: "kette-knie-r", kette: 1, sek: 64, pause: 15, h: BW_KETTE_H };
const BW_KETTE_RUNDE = {
  1: { h: BW_KETTE_H, start: "Durchgang 1 von 3 – wir legen los!", ende: "Toll gemacht! Durchgang 1 ist geschafft. Kurz verschnaufen und ausschütteln!" },
  2: { h: "Gleiche Kette wie eben: Knie rechts, Knie links, Schritt links, Schritt rechts, Hocke mit Armen nach vorn, Hula-Hüfte, Hampelmann, Sprung.", start: "Durchgang 2 – gleiches Spiel, gleiche Power!", ende: "Super Einsatz von dir! Kurz durchatmen – na komm, eine Runde geht noch!" },
  3: { h: "Letzte Runde! Knie rechts, Knie links, Schritt links, Schritt rechts, Hocke, Hula-Hüfte, Hampelmann, Sprung.", start: "Letzter Durchgang – jetzt nicht nachlassen!", ende: "Geschafft! Drei Durchgänge Power-Kette – das war ganz große Klasse!" },
};
const BW_KETTE_LOB = ["Toll gemacht!", "Super Einsatz von dir!", "Ja, so geht’s gut – weiter so!", "Weiter so, auch wenn’s brennt in den Beinen!", "Jetzt nicht nachlassen!",
  "Genau so – du ziehst das durch!", "Stark – dranbleiben!", "Klasse Rhythmus – weiter!", "Na komm, eine Kette geht noch!", "Das sieht richtig sportlich aus!"];
const BW_KETTE_MARKIG = ["Wer bremst, verliert – weiter geht’s!", "Hier wird nicht geschlichen, hier wird gerockt!", "Die Beine brennen? Das ist das Fett, das um Gnade bittet!",
  "Zähne zusammen – du schaffst das!", "Aufgeben ist was für Suppenhühner!", "Jetzt zeigen wir der Couch, wer hier der Chef ist!", "Schweiß ist nur Fett, das weint – also weiter!",
  "Mehr Power – die Küche bebt!", "Wir sind doch nicht zum Kaffeekränzchen hier – Tempo!", "Wer jetzt durchhält, hat sich den Nachtisch verdient!"];
const bwKetteJetzt = (L) => { const u = L && L.plan[L.i]; return u && u.kette && L.phase === "uebung" ? BW_KETTE_SCHRITTE[Math.floor(Math.max(0, bwSekU(u) - L.rest) / BW_KETTE_TAKT) % BW_KETTE_SCHRITTE.length] : null; };
function bwKetteTick(L, u) { // 2.399.0: genau beim Bewegungswechsel ein kurzes Kommando (unterbricht Laufendes – nie verspätet); Lob kurz zur Hula-Hüfte,
  // längere Sprüche nur in der Sprechblase; „noch 10“ und der letzte Sprung hängen am Kommando statt es zu ersetzen
  const e = bwSekU(u) - L.rest, n = BW_KETTE_SCHRITTE.length, k = e % (BW_KETTE_TAKT * n), nr = Math.floor(e / (BW_KETTE_TAKT * n)), s = bwKetteJetzt(L);
  if (s && s.a !== L.ketteA) { L.ketteA = s.a; bwLaufZeigen(); }
  if (!s || k % BW_KETTE_TAKT !== 0 || e === 0 || L.rest <= 0) return; // e = 0: das erste Kommando kommt mit dem Start; rest 0: Durchgang ist vorbei
  const nrS = k / BW_KETTE_TAKT;
  if (L.rest <= BW_KETTE_TAKT) return bwSag("Letzter Sprung – hopp!", true);
  if (L.rest === 10) return bwSag(`${s.k} – noch 10!`, true);
  if (nrS === 0) return bwSag(`Von vorn – ${s.k}!`, true);
  if (s.a === "kette-hula") { const lang = nr % 2 ? bwNimm(BW_KETTE_MARKIG, L, "ketteMarkig") : bwNimm(BW_KETTE_LOB, L, "ketteLob"); return bwSag(`${s.s[nr % s.s.length]} ${bwZufall(BW_KURZ, L)}`, true, lang); }
  bwSag(s.s[nr % s.s.length], true);
}
const BW_DAUER = [5, 10, 15];
const BW_TEMPO = { sitzen: 112, stehen: 120, kueche: 116, kette: 120 }; // Schläge/Min. (Seniorenkurse um 120, im Sitzen ruhiger); 2.370.0: Power-Kette 120 = 4 Schläge in 2 s
const BW_LOB = ["Super machst du das!", "Spitze – weiter so!", "Schön weiteratmen – ein und aus!", "Lächeln nicht vergessen!", "Du bist heute der Star auf der Bühne!",
  "Das sieht richtig sportlich aus!", "Mit Schwung – die Küche rockt!", "Wer rastet, der rostet – wer rührt, der glänzt!", "Prima, ganz in deinem Tempo!",
  "Spürst du, wie es warm wird?", "Toll – ich bin stolz auf dich!", "Und weiter – du schaffst das!", "Schultern locker, schön aufrecht!", "Bravo! Das macht Spaß, oder?",
  "Besser als jede Bratkartoffel!", "Jawoll – so sieht Bewegung aus!", "Klasse – genau so!", "Tip top – das sitzt!",
  "Weiter so und nicht aufgeben – die neue Kochjacke soll doch passen!",
  // 2.307.0 KC-CLUB-BUEHNE-SPRUECHE (Wunsch Hansi): mehr Motivation
  "Jede Bewegung zählt – und du bist mittendrin!", "Dein Körper sagt gerade Danke!", "Du wirst mit jeder Runde besser!", "Atmen nicht vergessen – ganz ruhig weiter!",
  "Das Herz freut sich über jede Minute!", "Du hältst prima mit – wie ein echter Profi!", "Schritt für Schritt – genau richtig so!", "Heute bist du schneller als die Nudeln im Topf!",
  "Gemeinsam schaffen wir das!", "Was du heute bewegst, trägt dich morgen!", "Du machst das richtig gut – ich sehe das genau!", "Aufrecht, locker und mit einem Lächeln – perfekt!",
  "Lieber langsam als gar nicht – genau richtig!", "Bleib dran – das sieht schon richtig gut aus!", "Tu heute etwas, worauf du morgen stolz bist!"]; // 2.314.0
// 2.299.0 (Wunsch Hansi): Sprüche mit Augenzwinkern – bei jeder Übung einer (nach 9 Sekunden)
const BW_FRECH = ["Hättest du nicht so viel am Pudding genascht, bräuchten wir das jetzt nicht machen!", "Wie gefallen dir meine Beinstulpen? Die habe ich mir von Nena ausgeliehen!",
  "Ich lade dich gerne mal zum Essen ein – die Möhren habe ich schon geschält. Sonst gibt’s nichts!", "Nächstes Mal weniger Nudeln – dann schwingen die Hüften auch besser mit!",
  "Alles, was du isst, muss ich zum Glück nicht auf meinen Hüften tragen!", "Wer heimlich vom Teig nascht, rührt jetzt doppelt!", "Die Sahnetorte von gestern winkt gerade zum Abschied!",
  "Jede Bewegung – ein Gummibärchen weniger auf den Hüften!", "Die Bratwurst von gestern läuft gerade wieder weg!", "Wer beim Abschmecken nicht spart, muss beim Turnen ran!",
  "Kalorien sind kleine Tierchen, die nachts die Kleider enger nähen – die jagen wir jetzt!", "Der Kühlschrank kann warten – erst wird geturnt!",
  "Das zweite Stück Kuchen war lecker, oder? Na also – weiter geht’s!", "So schnell war die Schwarzwälder Kirschtorte noch nie verbrannt!",
  "Ich bin ja nicht zu dick – ich bin nur zu klein für mein Gewicht!",
  // 2.307.0 KC-CLUB-BUEHNE-SPRUECHE (Wunsch Hansi): mehr Augenzwinkern
  "Wer jetzt aufhört, muss nachher den Abwasch machen!", "Das Sofa hat angerufen – es vermisst dich. Sag ihm, es muss noch warten!", "Mein Bauch heißt nicht Bauch – das ist mein Vorrat für den Winter!",
  "Sport ist Mord? Nein – Sport ist Pudding-Abbau!", "Wer schwitzt, braucht nachher eine Extraportion Nachtisch – kleiner Scherz!", "Die Schürze sitzt schon wieder lockerer, oder?",
  "Tanzen wie keiner zuschaut – nur ich, und ich verrate nichts!", "Die Waage wird morgen staunen!", "Bewegung ist wie Würzen – ein bisschen mehr geht immer!",
  "Wenn das der Chefkoch sehen könnte – der würde glatt mitturnen!", "Kein Rezept ohne Zutaten, kein Muskel ohne Training!", "Die Küchenband spielt nur für dich – also zeig, was du kannst!",
  // 2.314.0 (Recherche Fitness-Sprüche, Wunsch Hansi): noch mehr Augenzwinkern
  "Ich trainiere nur, damit ich nachher mehr essen kann!", "Schweiß ist nur Fett, das weint!", "Muskelkater ist der Beweis, dass wir fleißig waren!",
  "Wer jetzt schwitzt, spart sich die Sauna!", "Jede Wiederholung – ein Löffel Sahne weniger!", "Mein Sixpack versteckt sich noch unter dem Sonntagsbraten!",
  "Lieber jetzt schwitzen als nachher die Hose weiter machen!", "Wir verbrennen gerade mehr Kalorien als der Herd auf Stufe neun!", "Der Gürtel bekommt bald ein neues Loch – nach innen!",
  "So kriegen wir das Fett weg!"];
// 2.628.0 (Wunschliste #31, Hansi: „bei ‚noch 10‘ müssten noch 10 Übungen kommen – kurz danach kommt schon ‚noch 3‘“): gezählt werden Sekunden – das sagt Twinkey jetzt immer dazu
const BW_ENDSPURT = ["Noch 10 Sekunden – gleich gibt’s Applaus!", "Noch 10 Sekunden – gib nochmal alles!", "Endspurt – noch 10 Sekunden!", "Die letzten 10 Sekunden – du schaffst das!", "Noch 10 Sekunden – zeig, was du kannst!"];
const BW_SCHUETTELN_SAG = ["Und jetzt ausschütteln!", "Super! Locker ausschütteln!", "Prima! Arme und Beine ausschütteln!", "Geschafft – und schön ausschütteln!"];
const BW_SEK = 30, BW_SCHUETTELN = 6, BW_BEREIT = 7;
const bwWahl = () => { try { return { modus: "sitzen", dauer: 5, musik: true, ansage: true, ...JSON.parse(esLies("bw", "{}")) }; } catch (e) { return { modus: "sitzen", dauer: 5, musik: true, ansage: true }; } };
function bwWahlSetzen(teil, still) { esSchreib("bw", JSON.stringify({ ...bwWahl(), ...teil })); if (!still && !BW.lauf) esBuehneZeigen($("hrFlaeche")); }
// ----- 2.303.0 KC-CLUB-BUEHNE-BEWEGUNG-2: Figur passend zur Übung – Seitenansicht (Aufstehen) oder auf einem Weg (Kreis, um den Stuhl) -----
function bwBuehneFigur(u, phase, anim, sitz, farbe) {
  const uebt = phase === "uebung", b = bwSchlag(), ph = u.kette ? 0 : bwPhase(); // 2.370.0: Kette – jede Bewegung beginnt beim Wechsel von vorn
  if (u.seite && phase !== "schuetteln") return bwFigurSeite(uebt ? anim : "ruhe", b, ph, farbe); // Vorbereiten: sitzt schon seitlich auf dem Stuhl
  if (u.profil && phase !== "schuetteln") return bwFigurProfil(uebt ? anim : "ruhe", b, ph, farbe); // 2.304.0: stehend von der Seite (Schritte vor/zurück)
  const fig = bwFigur(anim, sitz, phase === "schuetteln" ? (anim === "stirn" ? "tuch" : "") : u.p, phase === "schuetteln" ? "" : u.ding, b, ph, farbe);
  if (!uebt || !u.weg) return fig;
  const stuhl = u.weg === "stuhl" ? `<svg class="bw-weg-stuhlbild" viewBox="0 0 60 80" aria-hidden="true"><rect x="6" y="2" width="48" height="30" rx="4" fill="#8a6440"/><rect x="10" y="6" width="40" height="22" rx="3" fill="#a0784e"/><rect x="2" y="40" width="56" height="9" rx="3" fill="#b88a5a"/><rect x="5" y="32" width="5" height="46" fill="#7a5634"/><rect x="50" y="32" width="5" height="46" fill="#7a5634"/><rect x="13" y="49" width="4" height="29" fill="#6b4a2c"/><rect x="43" y="49" width="4" height="29" fill="#6b4a2c"/></svg>` : "";
  return `<div class="bw-weg bw-weg-${u.weg}" style="--b:${b}s;--ph:${ph}s">${stuhl}<div class="bw-weg-fig">${fig}</div></div>`;
}
// Twinkey im Profil (Blick nach rechts), Glieder als Kette Fuß → Schienbein → Oberschenkel → Oberkörper → Arm; hinteres Bein/Arm dunkler dahinter
function bwFigurSeite(a, b, ph, farbe) {
  const [fj, fs, fb] = BW_FARBEN[((farbe || 0) % BW_FARBEN.length + BW_FARBEN.length) % BW_FARBEN.length], o = (x, y) => `style="transform-origin:${x}px ${y}px"`;
  const arm = (hinten) => `<g class="s-arm${hinten ? " hinten" : ""}" ${o(70, 61)}><rect x="65.6" y="58" width="8.8" height="20" rx="4.4" class="bw-jacke"/><rect x="66" y="74" width="8" height="18" rx="4" class="bw-jacke"/><rect x="65.4" y="86" width="9.2" height="4.4" rx="2" class="bw-band"/><circle cx="70" cy="94" r="4.6" class="bw-haut"/></g>`;
  const bein = (hinten) => `<g class="s-sb${hinten ? " hinten" : ""}" ${o(70, 150)}><rect x="65.5" y="122" width="9" height="28" rx="4.5" class="bw-hose"/><rect x="64.6" y="137" width="10.8" height="12" rx="3.4" class="s-stulpe"/>
      <g class="s-ob" ${o(70, 124)}><rect x="64.5" y="96" width="11" height="31" rx="5.5" class="bw-hose"/>
        <g class="s-ok" ${o(70, 98)}>${hinten ? "" : `${arm(true)}<path d="M60 100 Q58 78 62 60 Q70 54 79 60 Q83 78 81 100 Z" class="bw-jacke"/>${[66, 74, 82, 90].map((y) => `<circle cx="78.4" cy="${y}" r="1.3" class="bw-knopf"/>`).join("")}
          <rect x="66.5" y="49" width="8" height="9" class="bw-haut"/><g class="bw-kopf" ${o(71, 50)}><circle cx="71" cy="41" r="11.5" class="bw-haut"/><circle cx="82.2" cy="42.5" r="2.6" class="bw-haut"/>
          <circle cx="76.5" cy="39" r="1.5" class="bw-auge"/><path d="M75 46.5 Q78.5 48.5 80.5 46" class="bw-mund"/><circle cx="75.5" cy="44" r="2" fill="#f4a3a3" opacity=".55"/>
          <path d="M59.5 41 Q59 29 71 29 Q80 29.5 82 35 Q72 33 63 37 Q61 42 59.5 41Z" fill="#6b4226"/><rect x="59.6" y="33.6" width="23" height="5" rx="2.4" class="bw-band" transform="rotate(-6 71 36)"/><path d="M60 35 l-6 -3 l1 4 z M60 37 l-6 2 l3 2 z" class="bw-band"/></g>${arm(false)}`}</g></g></g>`;
  const schuh = (x, hinten) => `<g class="s-schuh${hinten ? " hinten" : ""}"><path d="M${x - 6} 150 Q${x - 6} 143.5 ${x} 143.5 L${x + 6} 144.5 Q${x + 13} 146 ${x + 13} 150.5 Z" fill="#e03131"/><rect x="${x - 6.5}" y="149.6" width="20" height="3" rx="1.4" fill="#fff"/><path d="M${x - 1} 145 l2 3.6 M${x + 2.4} 145 l2 3.6 M${x + 5.8} 145.4 l2 3.4" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g>`;
  const stuhl = `<g class="bw-stuhl"><rect x="27" y="84" width="5" height="70" rx="2"/><rect x="27" y="128" width="35" height="6" rx="2"/><rect x="56" y="134" width="4.5" height="20"/><rect x="29" y="134" width="4.5" height="20"/></g>`;
  return `<svg class="bw-figur bw-seite bw-s-${a}" viewBox="0 0 120 170" style="--b:${b || .5}s;--ph:${ph || 0}s;--jacke:${fj};--stulpe:${fs};--band:${fb}" role="img" aria-label="Twinkey von der Seite: aufstehen und hinsetzen">
    ${stuhl}${schuh(67, true)}${bein(true)}${bein(false)}${schuh(70, false)}</svg>`;
}
// 2.313.0 KC-CLUB-BUEHNE-KARTON: Pappkarton vor Twinkey auf dem Boden (Profil) – der Fuß landet genau oben drauf
const BW_KARTON = `<g class="bw-karton"><rect x="76" y="139" width="32" height="13" rx="1.2" fill="#c8955a" stroke="#8a5a2b" stroke-width=".8"/><rect x="76" y="139" width="32" height="2.4" fill="#b07c45"/><rect x="88" y="139" width="8" height="13" fill="#e8d2a6" opacity=".75"/><path d="M80 146 h4 M80 148.5 h6" stroke="#8a5a2b" stroke-width=".7"/></g>`;
// 2.314.0: Arbeitsplatte vor Twinkey (Liegestütz) – die Hände liegen vorn auf der Kante
const BW_PLATTE = `<g class="bw-platte"><rect x="88" y="90" width="34" height="62" rx="1.5" fill="#a47148"/><rect x="85" y="86" width="37" height="6" rx="1.5" fill="#d9b382"/><rect x="92" y="98" width="26" height="20" rx="2" fill="#8b5e3c"/><circle cx="105" cy="108" r="1.4" fill="#e9ecef"/></g>`;
// 2.304.0: Twinkey stehend im Profil – Beine hängen an der Hüfte (Oberschenkel → Unterschenkel → Fuß), damit Schritte nach vorn/hinten sichtbar sind
function bwFigurProfil(a, b, ph, farbe) {
  const [fj, fs, fb] = BW_FARBEN[((farbe || 0) % BW_FARBEN.length + BW_FARBEN.length) % BW_FARBEN.length], o = (x, y) => `style="transform-origin:${x}px ${y}px"`;
  const bein = (k) => `<g class="p-bein ${k}"><g class="p-ob" ${o(60, 99)}><rect x="54.5" y="96" width="11" height="31" rx="5.5" class="bw-hose"/>
      <g class="p-ub" ${o(60, 124)}><rect x="55.5" y="122" width="9" height="28" rx="4.5" class="bw-hose"/><rect x="54.6" y="137" width="10.8" height="12" rx="3.4" class="s-stulpe"/>
        <path d="M54 150 Q54 143.5 60 143.5 L66 144.5 Q73 146 73 150.5 Z" fill="#e03131"/><rect x="53.5" y="149.6" width="20" height="3" rx="1.4" fill="#fff"/><path d="M59 145 l2 3.6 M62.4 145 l2 3.6 M65.8 145.4 l2 3.4" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/></g></g></g>`;
  const arm = (k) => `<g class="p-arm ${k}" ${o(60, 61)}><rect x="55.6" y="58" width="8.8" height="20" rx="4.4" class="bw-jacke"/><rect x="56" y="74" width="8" height="18" rx="4" class="bw-jacke"/><rect x="55.4" y="86" width="9.2" height="4.4" rx="2" class="bw-band"/><circle cx="60" cy="94" r="4.6" class="bw-haut"/></g>`;
  const oben = `<g class="p-oben" ${o(60, 98)}><path d="M50 100 Q48 78 52 60 Q60 54 69 60 Q73 78 71 100 Z" class="bw-jacke"/>${[66, 74, 82, 90].map((y) => `<circle cx="68.4" cy="${y}" r="1.3" class="bw-knopf"/>`).join("")}
      <rect x="56.5" y="49" width="8" height="9" class="bw-haut"/><g class="bw-kopf" ${o(61, 50)}><circle cx="61" cy="41" r="11.5" class="bw-haut"/><circle cx="72.2" cy="42.5" r="2.6" class="bw-haut"/>
      <circle cx="66.5" cy="39" r="1.5" class="bw-auge"/><path d="M65 46.5 Q68.5 48.5 70.5 46" class="bw-mund"/><circle cx="65.5" cy="44" r="2" fill="#f4a3a3" opacity=".55"/>
      <path d="M49.5 41 Q49 29 61 29 Q70 29.5 72 35 Q62 33 53 37 Q51 42 49.5 41Z" fill="#6b4226"/><rect x="49.6" y="33.6" width="23" height="5" rx="2.4" class="bw-band" transform="rotate(-6 61 36)"/><path d="M50 35 l-6 -3 l1 4 z M50 37 l-6 2 l3 2 z" class="bw-band"/></g></g>`;
  return `<svg class="bw-figur bw-profil bw-p-${a}" viewBox="0 0 120 170" style="--b:${b || .5}s;--ph:${ph || 0}s;--jacke:${fj};--stulpe:${fs};--band:${fb}" role="img" aria-label="Twinkey von der Seite: Schritte">
    ${a === "karton" ? BW_KARTON : ""}<g class="p-ganz" ${o(60, 150)}>${arm("hinten")}${bein("hinten")}${oben}${bein("vorn")}${arm("vorn")}</g>${a === "liegestuetz" ? BW_PLATTE : ""}</svg>`;
}
// 2.313.0 (Wunsch Hansi „jedes Mal andere Übungen“): zufällige Reihenfolge; was beim letzten Mal dran war, kommt zuletzt;
// nie zweimal dieselbe Bewegung direkt hintereinander. Gemerkt wird nur auf diesem Gerät.
function bwPlan(modus, dauer) {
  if (modus === "kette") return [1, 2, 3].map((r) => ({ ...BW_KETTE, runde: r, t: `${BW_KETTE.t} – Durchgang ${r} von 3`, h: BW_KETTE_RUNDE[r].h })); // 2.370.0: feste 3 Durchgänge
  const passt = BW_UEBUNGEN.filter((u) => u.g === modus), n = Math.max(4, Math.round((dauer * 60) / (BW_SEK + BW_SCHUETTELN + BW_BEREIT)));
  let zuletzt = []; try { zuletzt = JSON.parse(esLies("bw_zuletzt_" + modus, "[]")); } catch (e) { zuletzt = []; }
  const misch = (l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; } return a; };
  const plan = []; let vorrat = [];
  while (plan.length < n) {
    if (!vorrat.length) vorrat = [...misch(passt.filter((u) => !zuletzt.includes(u.id))), ...misch(passt.filter((u) => zuletzt.includes(u.id)))];
    const k = Math.max(0, vorrat.findIndex((u) => u.a !== plan[plan.length - 1]?.a));
    plan.push(vorrat.splice(k, 1)[0]);
  }
  esSchreib("bw_zuletzt_" + modus, JSON.stringify(plan.map((u) => u.id)));
  return plan;
}
const bwSchlag = () => 60 / (BW_TEMPO[bwWahl().modus] || 116);
function bwPhase() { // Bewegung startet auf dem Schlag der Musik: Versatz innerhalb von 8 Schlägen
  const b = bwmSchlag(); if (!BWM.ctx || !BWM.laeuft) return 0;
  const seit = BWM.ctx.currentTime - BWM.start; return -(((seit % (8 * b)) + 8 * b) % (8 * b));
}
// ----- Bühne zeigen (Auswahl) -----
function esBuehneZeigen(f) {
  if (!f) return;
  if (BW.lauf) return bwLaufZeigen();
  if (BW.hoeren) return bwHoerZeigen(); // 2.302.0
  if (BW.vorher) return bwVorher(); // 2.309.0: Bereitlegen-Liste bleibt beim Zurückkehren
  const w = bwWahl(), hinweis = !fiLs(FI_HINWEIS_KEY, false), vorne = { sitzen: [1, ""], stehen: [0, ""], kueche: [1, "schneebesen"], kette: [0, ""] }[w.modus] || [0, ""];
  f.innerHTML = `<div class="bw-buehne"><div class="bw-licht"></div><div class="bw-vorhang links halb"></div><div class="bw-vorhang rechts halb"></div><div class="bw-boden"></div>
    <div class="bw-mitte">${bwFigur("winken", vorne[0], vorne[1], 0, bwSchlag())}</div>
    <div class="bw-wahl">
      <div class="bw-titel">🎭 Bühne frei für Bewegung!</div>
      ${hinweis ? `<div class="bw-hinweis">🩺 Mach nur so viel, wie es dir angenehm ist. Bei Schmerzen, Schwindel oder Atemnot sofort aufhören.<button type="button" class="es-k es-haupt" onclick="fiLsSetzen(FI_HINWEIS_KEY, true);esBuehneZeigen($('hrFlaeche'))">👍 Verstanden</button></div>` : ""}
      <div class="bw-schritt">① Wie möchtest du üben?</div><!-- 2.628.0 KC-CLUB-BUEHNE-ORDNUNG (Wunschliste #31): Schritte beschriftet, ein großer Start-Knopf, Nebensachen klein -->
      <div class="bw-reihe">${BW_MODI.map(([k, t]) => `<button type="button" class="es-k${w.modus === k ? " an" : ""}" onclick="bwWahlSetzen({modus:'${k}'})">${t}</button>`).join("")}</div>
      <div class="bw-schritt">② Wie lange – und mit Musik und Ansage?</div>
      <div class="bw-reihe">${w.modus === "kette" ? `<span class="es-k an bw-kette-info">🔁 3 Durchgänge · ca. 4 Min.</span>` : BW_DAUER.map((d) => `<button type="button" class="es-k${w.dauer === d ? " an" : ""}" onclick="bwWahlSetzen({dauer:${d}})">${d} Min.</button>`).join("")}
        <button type="button" class="es-k${w.musik ? " an" : ""}" onclick="bwWahlSetzen({musik:${!w.musik}})" aria-label="Musik ${w.musik ? "aus" : "an"}">${w.musik ? "🎵 Musik" : "🔇 Musik"}</button>
        <button type="button" class="es-k${w.ansage ? " an" : ""}" onclick="bwWahlSetzen({ansage:${!w.ansage}})" aria-label="Ansage ${w.ansage ? "aus" : "an"}">${w.ansage ? "🔊 Ansage" : "🔈 Ansage"}</button></div>
      <div class="bw-reihe bw-start"><button type="button" class="es-k es-haupt bw-los" ${hinweis ? "disabled" : ""} onclick="bwVorher()">▶️ Vorhang auf!</button></div>
      <div class="bw-reihe bw-neben"><span>Außerdem:</span><button type="button" class="es-k bw-hoeren-los" onclick="bwClubSong()">🎤 Club-Song</button><button type="button" class="es-k bw-hoeren-los" onclick="bwHoeren()">🎶 Nur Musik hören</button></div></div></div>`;
  bwTrainingKnoepfe(true); // 2.628.0: die schwebenden Knöpfe 👆 ❓ 🔍 lagen auf „Nur Musik hören“ – auf der Bühne ausgeblendet wie im Training // 2.302.0 KC-CLUB-BUEHNE-MUSIK
}
// ----- 2.309.0 KC-CLUB-BUEHNE-BEREIT (Wunsch Hansi „vorher ansagen: lege dir bereit …“; „mit Weiter eine Übung überspringen“) -----
// Vor dem Start zeigt und sagt Twinkey, was für DIESEN Durchgang gebraucht wird (aus den Übungen abgeleitet: Hand-Helfer p, Dinge ding, bedarf).
// Fehlt etwas: die Übung mit „⏭ Weiter“ einfach überspringen – auch schon in der Vorbereitung.
const BW_DINGE = { stuhl: ["🪑", "einen Stuhl"], seil: ["🪢", "ein Springseil"], flaschen: ["💧", "2 Wasserflaschen als Hanteln"], ballon: ["🎈", "einen Luftballon"],
  schneebesen2: ["🥄", "2 Schneebesen"], schneebesen: ["🥄", "einen Schneebesen"], loeffel2: ["🥄", "2 Kochlöffel"], topf: ["🍲", "einen Topf"], deckel: ["🥘", "2 Topfdeckel"],
  nudelholz: ["🪵", "ein Nudelholz"], pfanne: ["🍳", "eine Pfanne"], tuch: ["🧻", "ein Geschirrtuch"], schuessel: ["🥣", "eine Rührschüssel"], hoop: ["⭕", "einen Hula-Hoop-Reifen (wer hat)"] };
const BW_DING_AUS = { nudel: "nudelholz", seil: "seil", ballon: "ballon", topf: "topf", schuessel: "schuessel", hoop: "hoop" }; // ding → Bedarf (Bühnen-Deko wie „reifen“ zählt nicht)
function bwBedarf(u) { const l = [...(u.bedarf || [])]; if (BW_DINGE[u.p]) l.push(u.p); if (BW_DING_AUS[u.ding] && (u.ding !== "topf" || u.g === "kueche")) l.push(BW_DING_AUS[u.ding]); return [...new Set(l)]; }
function bwBereitListe(plan) { // Stuhl immer (zum Sitzen bzw. Festhalten), Reihenfolge wie BW_DINGE; 2 Schneebesen ersetzen einen
  const alle = new Set(["stuhl", ...plan.flatMap(bwBedarf)]); if (alle.has("schneebesen2")) alle.delete("schneebesen");
  return Object.keys(BW_DINGE).filter((k) => alle.has(k));
}
const bwAufzaehlen = (l) => l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} und ${l[l.length - 1]}`;
const bwNimmDinge = (u) => bwBedarf(u).map((k) => [BW_DINGE[k][0], BW_DINGE[k][1].replace(/ \(wer hat\)$/, "")]);
function bwVorher() { // statt sofort zu starten: Bereitlegen-Liste zeigen und ansagen
  const w = bwWahl(), plan = BW.vorher || bwPlan(w.modus, w.dauer), liste = bwBereitListe(plan), f = $("hrFlaeche"); if (!f) return;
  const neu = !BW.vorher; BW.vorher = plan;
  f.innerHTML = `<div class="bw-buehne"><div class="bw-licht"></div><div class="bw-vorhang links halb"></div><div class="bw-vorhang rechts halb"></div><div class="bw-boden"></div>
    <div class="bw-mitte">${bwFigur("winken", 0, "", 0, bwSchlag())}</div>
    <div class="bw-wahl bw-bereit"><div class="bw-titel">🧺 Lege dir bitte bereit:</div>
      <ul class="bw-bereit-liste">${liste.map((k) => `<li><span>${BW_DINGE[k][0]}</span>${esc(BW_DINGE[k][1])}</li>`).join("")}</ul>
      <p class="bw-bereit-tipp">Fehlt etwas? Kein Problem – die Übung dann mit <b>⏭ Weiter</b> einfach überspringen.</p>
      <div class="bw-reihe"><button type="button" class="es-k es-haupt bw-los" onclick="bwLos()">▶️ Alles bereit – los!</button><button type="button" class="es-k" onclick="BW.vorher=null;esBuehneZeigen($('hrFlaeche'))">‹ Zurück</button></div></div></div>`;
  if (neu && w.ansage) { try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) { /* ohne Sprache */ } bwSprechen(`Lege dir bitte bereit: ${bwAufzaehlen(liste.map((k) => BW_DINGE[k][1].replace(/ \(wer hat\)$/, ", wer einen hat")))}. Fehlt etwas? Kein Problem – dann überspringst du die Übung einfach mit Weiter.`); }
}
// ----- Training -----
const BW_BEGRUESSUNG = "Hallo! Lass uns ein bisschen Bewegung in den Alltag einbauen. Mach nur so viel, wie dir guttut. Los geht’s!";
async function bwLos() {
  const w = bwWahl(), plan = BW.vorher || bwPlan(w.modus, w.dauer); BW.vorher = null; // 2.309.0: derselbe Plan wie in der Bereitlegen-Liste
  try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) { /* ohne Sprache */ } // 2.306.0: Sprachausgabe frisch starten (hing sie, blieb Twinkey stumm)
  if (BW.hoeren) bwStopp(false); BWM.stueck = bwTrainingsStueck(w.modus); BWM.gesamt = 0; // 2.303.0: jedes Training ein anderes Disco-Stück (im Tempo der Übungen)
  BW.lauf = { plan, i: 0, phase: "bereit", rest: BW_BEREIT, pause: false, musik: w.musik, ansage: w.ansage, sek: 0, lob: Math.floor(Math.random() * BW_LOB.length), sprueche: 0, farbe: Math.floor(Math.random() * BW_FARBEN.length), warte: 0, gezaehlt: false, zeit: 0 };
  try { BW.wach = await navigator.wakeLock?.request("screen"); } catch (e) { BW.wach = null; }
  if (w.musik) bwMusik(true);
  // 2.299.2 (Wunsch Hansi): kurze Begrüßung vorweg – die erste Vorbereitung dauert dafür etwas länger
  BW.lauf.rest = BW_BEREIT + 6;
  BWM.stufe = 1; bwLaufZeigen(true); const nimm0 = bwNimmDinge(plan[0]);
  if (plan[0].kette) bwSag(BW_KETTE_START, false, "Hallo! Gleich geht’s los mit der Power-Kette – 3 Durchgänge, je 8 Bewegungen."); // 2.399.0: ~15 s statt ~32 s
  else bwSag(`${BW_BEGRUESSUNG} Als Erstes: ${plan[0].t}.${nimm0.length ? ` Nimm ${bwAufzaehlen(nimm0.map((x) => x[1]))}.` : ""} ${plan[0].h}`, false, BW_BEGRUESSUNG);
  clearInterval(BW.takt); BW.takt = setInterval(bwTick, 1000);
}
// 2.296.0 (Wunsch Hansi „beim Abzählen wird der Text vom Erklären abgeschnitten“): Ansagen schneiden sich nicht mehr gegenseitig ab.
// sofort = darf Laufendes unterbrechen (nur „noch 3/2/1“ und „ausschütteln“); „nebenbei“ = nur sprechen, wenn gerade niemand spricht.
const bwSpricht = () => { try { return !!(speechSynthesis.speaking || speechSynthesis.pending) && !sprachHaengt(); } catch (e) { return false; } }; // 2.306.0: hängende Sprache zählt nicht als „spricht“
function bwSag(t, sofort, blase, nebenbei) { // blase: kürzerer Text für die Sprechblase (sonst der gesprochene)
  const L = BW.lauf; if (nebenbei && L?.ansage && bwSpricht()) return;
  if (L) L.lobZuletzt = [...bwLobWorte(t), ...(L.lobZuletzt || [])].slice(0, 5); // gerade benutzte Lobwörter merken
  const z = $("bwSprech"); BW.sprechZeit = Date.now(); BW.blase = blase || t;
  if (z) { z.textContent = BW.blase; z.classList.remove("an"); void z.offsetWidth; z.classList.add("an"); }
  if (!L?.ansage) return; try { if (sofort) speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } bwSprechen(t);
}
// 2.297.0 (Wunsch Hansi „Musik noch lauter, die Stimme ist zu dominant“): Twinkey spricht auf der Bühne etwas leiser
// 2.307.0 (Wunsch Hansi „Küchenband englisch aussprechen wie bänd“): nur fürs Sprechen umschreiben – die Sprechblase zeigt die normale Schreibweise
const BW_AUSSPRACHE = [[/(Küchen|Disco|Rock|Schlager)-?[Bb]a?ä?nd\b/g, "$1-Bänd"], [/\bBand\b(?! )/g, "Bänd"], [/Hula-Hoop/g, "Hula-Hupp"]];
const bwAussprache = (t) => BW_AUSSPRACHE.reduce((x, [re, neu]) => x.replace(re, neu), String(t));
function bwSprechen(t) { t = bwAussprache(t); try { if (!("speechSynthesis" in window) || bwStimmeStumm()) return; const u = sprechAusgabe(t); u.volume = bwLautWert("stimme"); speechSynthesis.speak(u); } catch (e) { /* ohne Sprache */ } }
const BW_KURZ = ["Super!", "Klasse!", "Weiter so!", "Prima!", "Tip top!", "Spitze!", "Jawoll!", "Stark!", "Nicht aufgeben!"];
// 2.299.4 (Wunsch Hansi „prima kommt zu kurz hintereinander“): Lobwörter wechseln sich ab – ein Wort kommt erst wieder, wenn 5 andere dran waren
const BW_LOBWORTE = ["Prima", "Klasse", "Super", "Spitze", "Tip top", "Toll", "Bravo", "Jawoll", "Stark"];
const bwLobWorte = (t) => BW_LOBWORTE.filter((w) => String(t).toLowerCase().includes(w.toLowerCase()));
function bwNimm(liste, L, zaehler) { // nächster Spruch der Reihe, der kein gerade benutztes Lobwort enthält
  const start = L[zaehler] || 0, frei = (t) => !bwLobWorte(t).some((w) => (L.lobZuletzt || []).includes(w));
  for (let k = 0; k < liste.length; k++) { const t = liste[(start + k) % liste.length]; if (frei(t)) { L[zaehler] = start + k + 1; return t; } }
  L[zaehler] = start + 1; return liste[start % liste.length];
}
const bwZufall = (liste, L) => bwNimm(liste, L, "sprueche");
function bwTick() {
  const L = BW.lauf; if (!L) return clearInterval(BW.takt);
  if (!$("bwLauf")) return bwStopp();
  if (!esSichtbar()) { if (!L.pause) { L.pause = true; bwMusik(false); bwLaufZeigen(); } return; } // nicht zu sehen → Pause
  if (L.pause) return;
  L.zeit = (L.zeit || 0) + 1; // 2.317.0: Trainingsuhr (vergangene Zeit ohne Pausen)
  const u = L.plan[L.i];
  // Einzählen erst, wenn die Erklärung fertig ist: solange Twinkey noch spricht, wartet der Zähler (höchstens 10 s)
  if (L.phase === "bereit" && L.rest <= 4 && !L.gezaehlt) {
    if (L.ansage && bwSpricht() && L.warte < 20) { L.warte++; return bwZahl(); } // 2.399.0: 20 statt 10 s – Erklärung wird nie vom Einzählen überholt
    L.gezaehlt = true; L.rest = 4; bwSag("Und fünf, sechs, sieben, acht!", false); BWM.riser = true; return bwZahl();
  }
  L.rest--;
  if (L.phase === "uebung" && u.kette) { L.sek++; bwKetteTick(L, u); } // 2.370.0 Power-Kette: eigene Ansagen
  else if (L.phase === "uebung") { // Sprüche gleichmäßig verteilt: 27 · 21 · 15 · 10 · 6 · 3-2-1
    L.sek++;
    if ((u.a2 || u.um) && L.rest === Math.floor(BW_SEK / 2)) bwLaufZeigen(); // 2.303.0: Seitenwechsel (z. B. Storch: anderes Bein); 2.310.0: um = jetzt andersherum
    if (L.rest === 27) bwSag(u.c?.[0] || bwNimm(BW_LOB, L, "lob"), false, "", true);
    else if (L.rest === 21) bwSag(BW_FRECH[(L.lob + L.i) % BW_FRECH.length], false, "", true);
    else if (L.rest === 15) bwSag(u.w || u.c?.[1] || bwNimm(BW_LOB, L, "lob"), false, "", !u.w);
    else if (L.rest === 10) bwSag(bwZufall(BW_ENDSPURT, L), false, "", true);
    else if (L.rest === 6) bwSag(bwZufall(BW_KURZ, L), false, "", true);
    else if (L.rest >= 1 && L.rest <= 3) bwSag(L.rest === 3 ? "Noch 3 Sekunden" : L.rest === 2 ? "zwei" : "eins", true);
  }
  if (L.phase === "schuetteln" && L.wisch && L.rest === 3) bwLaufZeigen(); // 2.311.0: Stirn ist trocken – jetzt ausschütteln
  if (L.rest > 0) return bwZahl();
  if (L.phase === "bereit") { L.phase = "uebung"; L.rest = bwSekU(u); L.ketteA = ""; BWM.stufe = 2; BWM.becken = true; bwSag(u.kette ? BW_KETTE_SCHRITTE[0].s[0] : "Los geht’s!", !!u.kette); } // 2.399.0: Kette – sofort das erste Kommando
  else if (L.phase === "uebung") { // 2.311.0 KC-CLUB-BUEHNE-STIRN: ab und zu (jede dritte Übung) erst mit dem Schweißtuch die Stirn abwischen
    L.phase = "schuetteln"; L.rest = bwPauseU(u); BWM.stufe = 1; L.wisch = L.i % 3 === 1 && L.i < L.plan.length - 1;
    bwSag(u.kette ? BW_KETTE_RUNDE[u.runde]?.ende || "Toll gemacht!" : L.i >= L.plan.length - 1 ? "Und ausschütteln! Geschafft!" : L.wisch ? "Puh! Erst mal den Schweiß abwischen – und dann ausschütteln!" : bwZufall(BW_SCHUETTELN_SAG, L), true);
  }
  else if (L.phase === "schuetteln") {
    if (L.i >= L.plan.length - 1) return bwFertig();
    L.i++; L.phase = "bereit"; L.rest = BW_BEREIT; L.warte = 0; L.gezaehlt = false; const n = L.plan[L.i];
    const extra = n.kette ? `${BW_KETTE_RUNDE[n.runde]?.start || ""} ` : L.i === Math.floor(L.plan.length / 2) ? "Halbzeit – du bist spitze! " : L.i % 3 === 0 ? "Trinken nicht vergessen! " : ""; // 2.399.0: Kette – Durchgangs-Ansage vor dem Einzählen
    const nimm = bwNimmDinge(n); // 2.309.0: Twinkey sagt, was man dafür in die Hand nimmt
    bwSag(`${extra}Als Nächstes: ${n.t}.${nimm.length ? ` Nimm ${bwAufzaehlen(nimm.map((x) => x[1]))}.` : ""} ${n.h}`, false, `${extra}Als Nächstes: ${n.t}${nimm.length ? ` ${nimm.map((x) => x[0]).join("")}` : ""}`);
  }
  bwLaufZeigen();
}
// 2.317.0 KC-CLUB-BUEHNE-UHR (Wunsch Hansi): große Uhr neben Twinkey – wie lange das Training schon läuft und wie lange noch
const bwUhrText = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
// 2.370.0: Dauer je Übung (Power-Kette: längerer Durchgang, längere Verschnaufpause) – sonst wie bisher 30 s + 6 s
const bwSekU = (u) => (u && u.sek) || BW_SEK, bwPauseU = (u) => (u && u.pause) || BW_SCHUETTELN;
function bwRestZeit(L) { // noch übrige Sekunden: aktuelle Phase + restliche Phasen dieser Übung + alle folgenden Übungen
  const u = L.plan[L.i], danach = L.phase === "bereit" ? bwSekU(u) + bwPauseU(u) : L.phase === "uebung" ? bwPauseU(u) : 0;
  let s = L.rest + danach; for (let k = L.i + 1; k < L.plan.length; k++) s += BW_BEREIT + bwSekU(L.plan[k]) + bwPauseU(L.plan[k]);
  return s;
}
function bwUhr() { const L = BW.lauf; if (!L) return; const a = $("bwUhrAb"), n = $("bwUhrNoch"); if (a) a.textContent = bwUhrText(L.zeit || 0); if (n) n.textContent = bwUhrText(bwRestZeit(L)); }
function bwZahl() { const L = BW.lauf, z = $("bwZahl"); if (!L || !z) return; z.textContent = L.rest; z.classList.toggle("knapp", L.phase === "uebung" && L.rest <= 3); bwUhr();
  const b = $("bwBalken"); if (b) { const ges = L.phase === "uebung" ? bwSekU(L.plan[L.i]) : L.phase === "schuetteln" ? bwPauseU(L.plan[L.i]) : BW_BEREIT; b.style.width = `${Math.max(0, 100 - (L.rest / ges) * 100)}%`; } }
function bwLaufZeigen(vorhangAuf) {
  const L = BW.lauf, f = $("hrFlaeche"); if (!L || !f) return; bwTrainingKnoepfe(true);
  const u = L.plan[L.i], ks = bwKetteJetzt(L), anim = ks ? ks.a : L.phase === "uebung" ? (u.a2 && L.rest <= BW_SEK / 2 ? u.a2 : u.a) : L.phase === "schuetteln" ? (L.wisch && L.rest > 3 ? "stirn" : "schuetteln") : "ruhe", sitz = bwWahl().modus !== "stehen" && !!u.sitz; // 2.303.0: a2 = zweite Hälfte (anderes Bein)
  const text = L.phase === "bereit" ? "Gleich:" : L.phase === "schuetteln" ? "Ausschütteln!" : "Jetzt:", alt = BW.blase || "";
  f.innerHTML = `<div class="bw-buehne an${L.pause ? " angehalten" : ""}" id="bwLauf"><div class="bw-licht"></div><div class="bw-vorhang links${vorhangAuf ? " oeffnet" : " offen"}"></div><div class="bw-vorhang rechts${vorhangAuf ? " oeffnet" : " offen"}"></div><div class="bw-boden"></div>
    <div class="bw-kopf"><div><small>${text} · ${u.kette ? `Durchgang ${L.i + 1} von ${L.plan.length}${ks ? ` · Bewegung ${BW_KETTE_SCHRITTE.indexOf(ks) + 1} von ${BW_KETTE_SCHRITTE.length}` : ""}` : `Übung ${L.i + 1} von ${L.plan.length}`}</small><b>${esc(L.phase === "schuetteln" ? (u.kette ? "Verschnaufen und ausschütteln" : "Arme und Beine locker ausschütteln") : ks ? ks.t : u.t)}</b></div><div class="bw-zahl" id="bwZahl">${L.rest}</div></div>
    <div class="bw-balken-bahn"><div class="bw-balken" id="bwBalken"></div></div>
    <div class="bw-sprech" id="bwSprech" aria-live="polite">${esc(alt)}</div>
    <div class="bw-mitte">${bwBuehneFigur(u, L.phase, anim, sitz, L.farbe + L.i)}</div>
    <div class="bw-uhr" aria-label="Trainingsuhr"><div><small>⏱ schon</small><b id="bwUhrAb">0:00</b></div><div class="noch"><small>⏳ noch</small><b id="bwUhrNoch">0:00</b></div></div>
    ${bwLautRegler("musik")}${bwLautRegler("stimme")}
    <div class="bw-unten"><div class="bw-tipp">${esc(L.phase === "schuetteln" ? "Gut gemacht! 👏" : u.h)}</div><!-- 2.628.0 KC-CLUB-BUEHNE-ORDNUNG: Erklärung lag auf den Knöpfen -->
    <div class="es-leiste"><button type="button" class="es-k es-haupt" onclick="bwPause()">${L.pause ? "▶︎ Weiter" : "⏸ Pause"}</button><button type="button" class="es-k" onclick="bwWeiter()" aria-label="Übung überspringen">⏭ Weiter</button>
      <button type="button" class="es-k bw-mini${L.musik ? " an" : ""}" onclick="bwMusikSchalten()" aria-label="Musik an oder aus">${L.musik ? "🎵" : "🔇"}</button><button type="button" class="es-k bw-mini${L.ansage ? " an" : ""}" onclick="bwAnsageSchalten()" aria-label="Ansage an oder aus">${L.ansage ? "🔊" : "🔈"}</button>
      <button type="button" class="es-k" onclick="bwStopp(true)">✖ Ende</button></div></div></div>`;
  if (u.um && L.phase === "uebung" && L.rest <= BW_SEK / 2) f.querySelector(".bw-figur")?.classList.add("bw-um"); // 2.310.0 KC-CLUB-BUEHNE-ECHT: „Und jetzt andersherum!“ wirklich andersherum
  if (alt && Date.now() - (BW.sprechZeit || 0) < 4000) $("bwSprech").classList.add("an"); // gerade Gesagtes bleibt lesbar
  bwZahl();
}
function bwPause() { const L = BW.lauf; if (!L) return; L.pause = !L.pause; try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } bwMusik(!L.pause && L.musik); bwLaufZeigen(); }
function bwWeiter() { // 2.309.0: auch in der Vorbereitung wird die kommende Übung ganz übersprungen (vorher startete sie dann sofort)
  const L = BW.lauf; if (!L) return; L.pause = false; L.phase = "schuetteln"; L.rest = 1; try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } bwTick();
}
function bwMusikSchalten() { const L = BW.lauf; if (!L) return; L.musik = !L.musik; bwWahlSetzen({ musik: L.musik }, true); bwMusik(L.musik && !L.pause); bwLaufZeigen(); }
function bwAnsageSchalten() { const L = BW.lauf; if (!L) return; L.ansage = !L.ansage; bwWahlSetzen({ ansage: L.ansage }, true); if (!L.ansage) try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } bwLaufZeigen(); }
function bwStopp(zeigen) {
  clearInterval(BW.takt); BW.takt = 0; bwMusik(false); try { BW.wach?.release(); } catch (e) { /* ohne Wachhalten */ } BW.wach = null;
  if (BW.lauf) { try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } }
  BW.lauf = null; BW.hoeren = null; BW.vorher = null; BWM.stueck = null; BW.blase = ""; bwTrainingKnoepfe(false); if (zeigen && $("hrFlaeche")?.classList.contains("hr-buehne")) esBuehneZeigen($("hrFlaeche")); // 2.302.0: auch „Nur Musik“
}
// 2.313.0 (Wunsch Hansi): Twinkeys Schlusswort nach dem Sport
const BW_SCHLUSS = "Nach dieser Plackerei habe ich mir einen Eierpunsch und eine Portion Grünkohl mit doppelt Mettwurst am Köcheclub-Stand verdient. Die kochen dort extra warm!";
function bwFertig() {
  const L = BW.lauf; if (!L) return; const sek = L.sek, n = L.plan.length, kette = !!L.plan[0]?.kette; bwStopp(false);
  if (bwWahl().ansage) { try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } bwSprechen(`Geschafft! Das war super – Applaus für dich! ${BW_SCHLUSS}`); }
  const f = $("hrFlaeche"); if (!f) return;
  f.innerHTML = `<div class="bw-buehne an"><div class="bw-licht"></div><div class="bw-vorhang links schliesst"></div><div class="bw-vorhang rechts schliesst"></div><div class="bw-boden"></div>
    <div class="bw-mitte">${bwFigur("jubel", 0, "", 0, bwSchlag(), 0, n)}</div><div class="bw-applaus" aria-hidden="true">👏 🎉 👏</div>
    <div class="bw-wahl"><div class="bw-titel">🏅 Geschafft – Applaus für dich!</div><div class="bw-tipp" style="position:static">🍲 ${esc(BW_SCHLUSS)}</div><div class="bw-tipp" style="position:static">${kette ? `${n} Durchgänge Power-Kette` : `${n} Übungen`} · ${Math.floor(sek / 60)} Min. ${sek % 60} s Bewegung</div>
      <button type="button" class="es-k es-haupt bw-los" onclick="esBuehneZeigen($('hrFlaeche'))">🔁 Nochmal</button></div></div>`;
}
// ----- 2.298.0 KC-CLUB-BUEHNE-LAUTSTAERKE (Wunsch Hansi): Regler rechts für die Musik – Keil unten dünn, nach oben (lauter) dicker -----
// 2.299.0 KC-CLUB-BUEHNE-STIMME (Wunsch Hansi): gleicher Regler links für Twinkeys Stimme; unten aufs Symbol tippen = stumm (nochmal = wieder an)
const BW_LAUT_STANDARD = { musik: .8, stimme: .7 };
const BW_LAUT_FELD = { musik: "laut", stimme: "stimme" }; // Name in den gemerkten Einstellungen
const BW_LAUT_SYM = { musik: ["🔊", "🎵", "🔇"], stimme: ["📣", "🗣️", "🤐"] }; // oben, unten, unten bei stumm
const bwLautWert = (art = "musik") => { const z = BW["laut_" + art], v = typeof z === "number" ? z : Number(bwWahl()[BW_LAUT_FELD[art]]); return v >= 0 && v <= 1 ? v : BW_LAUT_STANDARD[art]; };
const bwLautGain = (v) => v <= .02 ? 0 : .15 * Math.pow(30, v); // 0 % stumm · 50 % ≈ 0,8 · 80 % ≈ 2,3 · 100 % = 4,5
const bwStimmeStumm = () => bwLautWert("stimme") <= .02;
function bwLautKeil(p) { const h = 2 + 13 * p / 100; return `${15 - 2},100 ${15 + 2},100 ${(15 + h).toFixed(1)},${100 - p} ${(15 - h).toFixed(1)},${100 - p}`; }
function bwLautRegler(art = "musik") {
  const p = Math.round(bwLautWert(art) * 100), [oben, unten, stumm] = BW_LAUT_SYM[art], name = art === "musik" ? "der Musik" : "der Stimme";
  return `<div class="bw-laut ${art}" id="bwLaut_${art}" role="slider" tabindex="0" aria-label="Lautstärke ${name}" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" onpointerdown="bwLautGriff(event, '${art}')" onkeydown="bwLautTaste(event, '${art}')">
    <span class="bw-laut-sym oben" aria-hidden="true">${oben}</span><div class="bw-laut-feld"><svg viewBox="0 0 30 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="13,100 17,100 30,0 0,0" class="bw-laut-bahn"/><polygon id="bwLautFuell_${art}" points="${bwLautKeil(p)}" class="bw-laut-fuell"/></svg><i class="bw-laut-knopf" id="bwLautKnopf_${art}" style="bottom:${p}%"></i></div><button type="button" class="bw-laut-sym unten${p <= 2 ? " stumm" : ""}" id="bwLautStumm_${art}" data-sym="${unten}" data-stumm="${stumm}" aria-label="${name.replace("der ", "")} stumm oder wieder an">${p <= 2 ? stumm : unten}</button></div>`;
}
function bwLautSetzen(v, merken, art = "musik") {
  v = Math.min(1, Math.max(0, v)); if (v <= .02) v = 0; BW["laut_" + art] = v; const p = Math.round(v * 100);
  $("bwLautFuell_" + art)?.setAttribute("points", bwLautKeil(p)); const k = $("bwLautKnopf_" + art); if (k) k.style.bottom = `${p}%`; $("bwLaut_" + art)?.setAttribute("aria-valuenow", p);
  const s = $("bwLautStumm_" + art); if (s) { s.classList.toggle("stumm", !p); s.textContent = p ? s.dataset.sym : s.dataset.stumm; }
  if (art === "musik") { try { BWM.voll?.gain.setTargetAtTime(bwLautGain(v), BWM.ctx.currentTime, .05); } catch (e) { /* ohne Ton */ } }
  else if (!p) { try { speechSynthesis.cancel(); } catch (e) { /* ohne Sprache */ } } // stumm: sofort still
  if (merken) bwWahlSetzen({ [BW_LAUT_FELD[art]]: Math.round(v * 100) / 100 }, true);
}
function bwLautStumm(art) { // unten aufs Symbol tippen: stumm – nochmal tippen: zurück auf den vorigen Wert
  const v = bwLautWert(art); if (v > 0) { BW["vorher_" + art] = v; bwLautSetzen(0, true, art); } else bwLautSetzen(BW["vorher_" + art] || BW_LAUT_STANDARD[art], true, art);
}
function bwLautGriff(e, art = "musik") {
  const el = e.currentTarget, feld = el.querySelector(".bw-laut-feld"); e.preventDefault(); e.stopPropagation();
  if (e.target.closest?.(".bw-laut-sym.unten")) return bwLautStumm(art);
  try { el.setPointerCapture(e.pointerId); } catch (x) { /* ohne Fangen */ }
  const setz = (ev) => { const r = feld.getBoundingClientRect(); bwLautSetzen(1 - (ev.clientY - r.top) / r.height, false, art); };
  setz(e); el.onpointermove = (ev) => { ev.stopPropagation(); setz(ev); };
  el.onpointerup = el.onpointercancel = () => { el.onpointermove = null; el.onpointerup = el.onpointercancel = null; bwLautSetzen(bwLautWert(art), true, art); };
}
function bwLautTaste(e, art = "musik") { const d = e.key === "ArrowUp" || e.key === "ArrowRight" ? .05 : e.key === "ArrowDown" || e.key === "ArrowLeft" ? -.05 : 0; if (!d) return; e.preventDefault(); bwLautSetzen(bwLautWert(art) + d, true, art); }
// ----- Musik: im Handy erzeugt (Web Audio) – Pop/Disco-Arrangement, leiser, solange Twinkey spricht -----
// Stufe 1 (Vorbereiten/Ausschütteln): Bass-Trommel, Hi-Hats, Disco-Bass, Flächen. Stufe 2 (Übung): + Klatschen, Akkord-Stöße, Hook-Melodie mit Echo.
// Alle 8 Takte ein Trommelwirbel; vor dem Start ein Riser, auf „Los!“ ein Becken.
const BWM = { ctx: null, aus: null, voll: null, hall: null, laeuft: false, zeit: 0, schritt: 0, timer: 0, rauschen: null, start: 0, stufe: 1, riser: false, becken: false, stueck: null, gesamt: 0 }; // 2.302.0: stueck = gewähltes Stück („Nur Musik“), null = Trainingsmusik
const BWM_AKKORDE = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]; // Am – F – C – G
const BWM_BASS = [45, 41, 48, 43];
const BWM_HOOK = { 0: 76, 3: 74, 6: 72, 8: 69, 10: 72, 12: 74, 16: 79, 19: 76, 22: 74, 24: 72, 26: 74, 28: 76, 30: 72 }; // 2 Takte, A-Moll-Pentatonik
const BWM_LAUT = .75, BWM_LEISE = .26; // 2.297.0: lauter; beim Sprechen nur noch auf gut ein Drittel (Musik bleibt präsent)
const bwHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function bwMusik(an) {
  if (!an) { BWM.laeuft = false; clearInterval(BWM.timer); BWM.timer = 0; try { BWM.aus?.gain.setTargetAtTime(0, BWM.ctx.currentTime, .05); } catch (e) { /* ohne Ton */ } return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    if (!BWM.ctx) {
      // 2.296.0 (Wunsch Hansi „Musik lauter, beim Sprechen absenken“): lauter, mit Kompressor (kein Übersteuern); beim Sprechen deutlich leiser
      BWM.ctx = new C(); BWM.aus = BWM.ctx.createGain(); const komp = BWM.ctx.createDynamicsCompressor(); komp.threshold.value = -16; komp.ratio.value = 6; komp.attack.value = .01; komp.release.value = .2;
      // 2.298.0 (Wunsch Hansi „Musik immer noch zu leise“): hinter dem Kompressor die Lautstärke vom Regler (bis gut 4-fach), davor ein Begrenzer gegen Übersteuern
      BWM.voll = BWM.ctx.createGain(); BWM.voll.gain.value = bwLautGain(bwLautWert("musik")); const grenze = BWM.ctx.createDynamicsCompressor(); grenze.threshold.value = -2; grenze.knee.value = 0; grenze.ratio.value = 20; grenze.attack.value = .002; grenze.release.value = .1;
      BWM.aus.connect(komp); komp.connect(BWM.voll); BWM.voll.connect(grenze); grenze.connect(BWM.ctx.destination);
      BWM.hall = BWM.ctx.createDelay(1); BWM.hall.delayTime.value = .375; const fb = BWM.ctx.createGain(); fb.gain.value = .28; const hg = BWM.ctx.createGain(); hg.gain.value = .35;
      BWM.hall.connect(fb); fb.connect(BWM.hall); BWM.hall.connect(hg); hg.connect(BWM.aus);
      const n = BWM.ctx.sampleRate, buf = BWM.ctx.createBuffer(1, n, BWM.ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; BWM.rauschen = buf;
    }
    BWM.ctx.resume?.(); BWM.aus.gain.setTargetAtTime(BWM_LAUT, BWM.ctx.currentTime, .1);
    if (BWM.laeuft) return; BWM.laeuft = true; BWM.zeit = BWM.ctx.currentTime + .1; BWM.start = BWM.zeit; BWM.schritt = 0;
    BWM.timer = setInterval(bwMusikPlanen, 50);
  } catch (e) { BWM.laeuft = false; }
}
function bwMusikPlanen() {
  const c = BWM.ctx; if (!c || !BWM.laeuft) return;
  try { const spricht = bwSpricht(); BWM.aus.gain.setTargetAtTime(spricht ? BWM_LEISE : BWM_LAUT, c.currentTime, spricht ? .04 : .35); } catch (e) { /* ohne Sprache */ } // schnell runter, sanft wieder hoch
  const sech = bwmSchlag() / 4; // 2.302.0: Tempo des gewählten Stücks
  if (BWM.riser) { BWM.riser = false; bwRiser(c.currentTime + .05, 2.6); }
  if (BWM.becken) { BWM.becken = false; bwRauschen(c.currentTime + .02, 1.4, .3, 5000, "highpass"); }
  while (BWM.zeit < c.currentTime + .25) { if (BWM.stueck?.spiel) BWM.stueck.spiel(BWM.gesamt, BWM.zeit); else bwMusikSchritt(BWM.schritt, BWM.zeit); BWM.zeit += sech; BWM.schritt = (BWM.schritt + 1) % 128; BWM.gesamt = (BWM.gesamt || 0) + 1; }
}
function bwTon(typ, hz, t, dauer, laut, filterHz, hall) {
  const c = BWM.ctx, o = c.createOscillator(), g = c.createGain(); o.type = typ; o.frequency.setValueAtTime(hz, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(laut, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + dauer);
  let kette = o; if (filterHz) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filterHz; o.connect(f); kette = f; }
  kette.connect(g); g.connect(BWM.aus); if (hall) g.connect(BWM.hall); o.start(t); o.stop(t + dauer + .02); return o;
}
function bwRauschen(t, dauer, laut, filterHz, art) {
  const c = BWM.ctx, q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); q.buffer = BWM.rauschen; f.type = art; f.frequency.value = filterHz;
  g.gain.setValueAtTime(laut, t); g.gain.exponentialRampToValueAtTime(.0005, t + dauer); q.connect(f); f.connect(g); g.connect(BWM.aus); q.start(t); q.stop(t + dauer + .02);
}
function bwRiser(t, dauer) { // Rauschen, das ansteigt – Spannung vor „Los!“
  const c = BWM.ctx, q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); q.buffer = BWM.rauschen; q.loop = true; f.type = "bandpass"; f.Q.value = 3;
  f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(6000, t + dauer); g.gain.setValueAtTime(.0005, t); g.gain.exponentialRampToValueAtTime(.18, t + dauer); g.gain.linearRampToValueAtTime(0, t + dauer + .05);
  q.connect(f); f.connect(g); g.connect(BWM.aus); q.start(t); q.stop(t + dauer + .1);
}
function bwMusikSchritt(s, t) {
  const im = s % 16, takt = Math.floor(s / 16), akk = BWM_AKKORDE[takt % 4], voll = BWM.stufe >= 2, fill = takt === 7 && im >= 8;
  if (im % 4 === 0) { const o = bwTon("sine", 140, t, .26, 1); o.frequency.exponentialRampToValueAtTime(44, t + .18); } // Bass-Trommel auf jeden Schlag
  bwRauschen(t, im % 4 === 2 ? .13 : .035, im % 4 === 2 ? .16 : .05, 8000, "highpass"); // Hi-Hats: 16tel, offen auf dem Off-Beat
  if (voll && (im === 4 || im === 12)) { bwRauschen(t, .16, .4, 1500, "bandpass"); bwTon("triangle", 190, t, .09, .25); } // Klatschen auf 2 und 4
  if (fill) bwRauschen(t, .08, .1 + (im - 8) * .04, 1800, "bandpass"); // Trommelwirbel am Ende von 8 Takten
  if (im % 2 === 0) bwTon("sawtooth", bwHz(BWM_BASS[takt % 4] + (im % 4 === 2 ? 12 : 0)), t, .16, .22, 700); // Disco-Bass (Oktaven)
  if (im === 0) akk.forEach((m) => bwTon("sawtooth", bwHz(m - 12), t, 1.7, .025, 900)); // Fläche
  if (voll && im % 4 === 2) akk.forEach((m) => bwTon("square", bwHz(m), t, .14, .035, 2400)); // Akkord-Stöße auf dem Off-Beat
  if (voll && takt % 4 < 2) { const n = BWM_HOOK[(takt % 2) * 16 + im]; if (n) bwTon("square", bwHz(n), t, .22, .06, 3200, true); } // Hook-Melodie mit Echo
  if (voll && takt % 4 >= 2 && im % 2 === 0) bwTon("triangle", bwHz(akk[(im / 2) % 3] + 24), t, .1, .03, 0, true); // Glitzer-Arpeggio
  bwKuechenTakt(im, t);
}
function bwKuechenTakt(im, t) { // 2.299.3 (Wunsch Hansi): Küchen-Geräusche passend zur Bewegung – genau auf dem Takt, auf dem Twinkey schlägt (2.303.0: eigener Baustein)
  const L = BW.lauf, u = L && L.phase === "uebung" && !L.pause ? L.plan[L.i] : null;
  if (u?.a === "trommeln" && im % 2 === 0) bwTopf(t, im % 4 === 0); // Kochlöffel abwechselnd links/rechts auf jede Achtel
  if (u?.a === "becken" && (im === 4 || im === 12)) bwBecken(t); // Deckel zusammen auf 2 und 4 – 2.311.0: genau dann treffen sich die Deckel vor der Brust
}
function bwTopf(t, betont) { // Kochlöffel auf Metalltopf: kurzer Anschlag, blecherne (unharmonische) Obertöne, dumpfer Bauch
  const l = betont ? 1 : .7;
  bwRauschen(t, .05, .32 * l, 2600, "bandpass");
  [[330, .16], [527, .1], [811, .07], [1243, .04]].forEach(([hz, v]) => bwTon("triangle", hz, t, .26, v * l));
  const o = bwTon("sine", 190, t, .14, .45 * l); o.frequency.exponentialRampToValueAtTime(95, t + .12);
}
function bwBecken(t) { // zwei Topfdeckel wie Orchester-Becken: heller Krach mit langem Nachklingen
  bwRauschen(t, 1.3, .42, 4200, "highpass"); bwRauschen(t, .5, .3, 7500, "bandpass"); bwRauschen(t, .03, .4, 1800, "bandpass");
  [[1480, .035], [2231, .03], [3170, .025], [4405, .02]].forEach(([hz, v]) => bwTon("square", hz, t, .7, v, 0, true));
}
// ----- 2.302.0 KC-CLUB-BUEHNE-MUSIK (Wunsch Hansi „auf der Bühne nur Musik anhören – mehr verschiedene Stücke, auch Reggae“) -----
// „🎶 Nur Musik hören“: Twinkey tanzt, die Stücke laufen nacheinander (je ca. 2½ Min.), antippen wählt ein Stück. Alles im Handy erzeugt
// (Web Audio wie die Trainingsmusik – keine Datei, kein Internet, kostenlos). Gleicher Musik-Regler wie beim Training. Die Trainingsmusik
// bleibt unverändert (BWM.stueck = null). Ansicht verlassen → Pause.
const bwmKick = (t, v = 1) => { const o = bwTon("sine", 140, t, .26, v); o.frequency.exponentialRampToValueAtTime(44, t + .18); };
const bwmSnare = (t, v = .35) => { bwRauschen(t, .16, v, 1500, "bandpass"); bwTon("triangle", 190, t, .09, v * .6); };
const bwmRim = (t, v = .3) => { bwRauschen(t, .04, v, 3000, "bandpass"); bwTon("square", 820, t, .03, v * .12); };
const bwmHat = (t, offen, v = .05) => bwRauschen(t, offen ? .13 : .035, offen ? v * 3 : v, 8000, "highpass");
const bwmAkk = (akk, t, dauer, laut, typ = "square", filter = 2400, hall = false, okt = 0) => akk.forEach((m) => bwTon(typ, bwHz(m + okt), t, dauer, laut, filter, hall));
const bwmBass = (m, t, dauer = .24, laut = .3, filter = 600) => { bwTon("sine", bwHz(m), t, dauer, laut * .9); bwTon("triangle", bwHz(m), t, dauer, laut * .5, filter); };
function bwmDisco(im, t, voll, takt) { // Disco-Schlagzeug: Bass-Trommel auf jeden Schlag, offene Hi-Hat auf dem Nachschlag, Klatschen auf 2 und 4, Wirbel alle 8 Takte
  if (im % 4 === 0) bwmKick(t, 1); bwmHat(t, im % 4 === 2, im % 4 === 2 ? .045 : .03);
  if (voll && (im === 4 || im === 12)) { bwRauschen(t, .16, .4, 1500, "bandpass"); bwTon("triangle", 190, t, .09, .25); }
  if (takt % 8 === 7 && im >= 8) bwRauschen(t, .08, .1 + (im - 8) * .04, 1800, "bandpass");
}
const bwmFill = (im, t) => { if (im >= 8 && im % 2 === 0) bwmSnare(t, .1 + (im - 8) * .035); };
// Melodie: Schritt (0–31 über 2 Takte) → Ton; Teil A in Takt 0–1, Teil B in Takt 2–3 jedes 4-Takt-Blocks
const bwmMel = (a, b, takt, im) => (takt % 4 < 2 ? a : b)[(takt % 2) * 16 + im];
const BW_STUECKE = [
  { id: "disco", t: "Küchen-Disco", stil: "Disco", sym: "🪩", bpm: 116, tanz: ["klatschen", "marsch", "hula", "jubel"] }, // die Trainingsmusik
  // 2.303.0 KC-CLUB-BUEHNE-DISCO (Wunsch Hansi „mehr Disco-Lieder in einem schönen Rhythmus“): vier weitere Disco-Stücke – laufen auch beim Training
  // (dort im Tempo der Übungen). Stufe 1 (Vorbereiten/Ausschütteln) schlanker, Stufe 2 (Übung) voll. Four-on-the-floor, offene Hi-Hat auf dem Nachschlag.
  { id: "disco2", t: "Spiegelkugel-Fieber", stil: "Disco", sym: "✨", bpm: 120, tanz: ["klatschen", "seit", "marsch", "jubel"],
    spiel(g, t) { const im = g % 16, takt = Math.floor(g / 16), voll = BWM.stufe >= 2, akk = [[62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]][takt % 4], root = [38, 43, 36, 45][takt % 4];
      bwmDisco(im, t, voll, takt); if (im % 2 === 0) bwmBass(root + (im % 4 === 2 ? 12 : 0), t, .15, .3, 800);
      if (im === 0) bwmAkk(akk, t, 1.8, .018, "sawtooth", 3000, true); if (voll && (im === 6 || im === 14)) bwmAkk(akk, t, .12, .03, "square", 2600);
      if (voll) { const n = bwmMel({ 0: 74, 2: 77, 4: 81, 6: 79, 8: 77, 10: 76, 12: 74, 14: 72, 16: 74, 20: 76, 22: 77, 24: 76, 28: 72 }, { 0: 69, 4: 72, 6: 74, 8: 76, 12: 79, 16: 77, 20: 76, 24: 74, 28: 72 }, takt, im); if (n) bwTon("square", bwHz(n), t, .2, .05, 3400, true); }
      bwKuechenTakt(im, t); } },
  { id: "disco3", t: "Nachtschicht-Boogie", stil: "Disco", sym: "🌙", bpm: 112, tanz: ["schulter", "klatschen", "hula", "marsch"],
    spiel(g, t) { const im = g % 16, takt = Math.floor(g / 16), voll = BWM.stufe >= 2, am = takt % 4 < 2, akk = am ? [64, 67, 69, 72] : [62, 66, 69, 72, 76], root = am ? 45 : 50;
      bwmDisco(im, t, voll, takt); const b = { 0: 0, 3: 12, 4: 0, 6: 10, 8: 0, 10: 12, 11: 7, 14: 10 }[im]; if (b !== undefined) bwmBass(root + b, t, .14, .34, 900);
      if ([2, 6, 10, 14].includes(im)) bwmAkk(akk, t, .07, voll ? .03 : .02, "square", 2400); if (voll && (im === 3 || im === 11)) bwmAkk(akk, t, .05, .02, "square", 3000, false, 12);
      if (voll && takt % 8 >= 4) { const n = bwmMel({ 0: 81, 3: 79, 6: 76, 8: 79, 10: 81, 12: 84, 16: 81, 19: 79, 22: 76, 24: 74, 28: 76 }, { 0: 76, 2: 79, 4: 81, 8: 79, 12: 76, 16: 74, 20: 72, 24: 69 }, takt, im); if (n) bwTon("sawtooth", bwHz(n), t, .18, .04, 2600, true); }
      bwKuechenTakt(im, t); } },
  { id: "disco4", t: "Samstagnacht im Kochclub", stil: "Disco", sym: "🕺", bpm: 124, tanz: ["jubel", "seit", "klatschen", "hula"],
    spiel(g, t) { const im = g % 16, takt = Math.floor(g / 16), voll = BWM.stufe >= 2, akk = [[65, 68, 72], [58, 61, 65], [63, 67, 70], [56, 60, 63]][takt % 4], root = [41, 46, 39, 44][takt % 4];
      bwmDisco(im, t, voll, takt); if (im % 2 === 0) bwmBass(root + (im % 4 === 2 ? 12 : 0), t, .14, .32, 850);
      if (im % 4 === 2) bwmAkk(akk, t, .1, voll ? .035 : .022, "sawtooth", 2800); // Streicher-Stöße auf dem Nachschlag
      if (voll) { const n = bwmMel({ 0: 84, 2: 82, 4: 80, 6: 79, 8: 77, 12: 75, 16: 77, 18: 79, 20: 80, 24: 79, 28: 75 }, { 0: 80, 4: 79, 6: 77, 8: 75, 12: 77, 16: 72, 20: 75, 24: 77 }, takt, im); if (n) { bwTon("sawtooth", bwHz(n), t, .22, .035, 3600, true); bwTon("sawtooth", bwHz(n) * 1.005, t, .22, .02, 3600); } }
      bwKuechenTakt(im, t); } },
  { id: "disco5", t: "Euro-Disco Knödel", stil: "Disco", sym: "🥟", bpm: 126, tanz: ["marsch", "jubel", "seit", "klatschen"],
    spiel(g, t) { const im = g % 16, takt = Math.floor(g / 16), voll = BWM.stufe >= 2, akk = [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]][takt % 4], root = [40, 36, 43, 38][takt % 4];
      bwmDisco(im, t, voll, takt); bwmBass(root + (im % 2 ? 12 : 0), t, .1, .2, 700 + (im % 4) * 150); // pumpender 16tel-Bass
      if (voll || im % 2 === 0) bwTon("sawtooth", bwHz(akk[im % 3] + 12 + (im >= 8 ? 12 : 0)), t, .09, .017, 1800 + im * 120, true); // Arpeggio, Filter öffnet sich
      if (voll && takt % 4 < 2) { const n = bwmMel({ 0: 79, 4: 78, 6: 76, 8: 74, 12: 76, 16: 79, 20: 83, 22: 81, 24: 79, 28: 78 }, { 0: 76, 4: 74, 8: 72, 12: 74, 16: 76 }, takt, im); if (n) bwTon("square", bwHz(n), t, .26, .05, 3000, true); }
      bwKuechenTakt(im, t); } },
  { id: "reggae1", t: "Reggae am Kochtopf", stil: "Reggae", sym: "🌴", bpm: 76, tanz: ["seit", "schulter", "kopfneigen", "hula"],
    spiel(g, t) { // One Drop: Bass-Trommel + Rand nur auf der 3, Gitarren-Skank auf den Nachschlägen, Orgel-„Bubble“, Melodica
      const im = g % 16, takt = Math.floor(g / 16), akk = [[57, 60, 64], [57, 62, 66], [57, 60, 64], [55, 59, 64]][takt % 4], root = [45, 50, 45, 40][takt % 4], intro = takt < 2;
      if (im === 8) { bwmKick(t, .95); bwmRim(t, .32); }
      if (im % 2 === 0) bwmHat(t, im === 14, .035);
      if (im % 4 === 2) bwmAkk(akk, t, .1, .045, "square", 2000, true); // Skank
      if (!intro && im % 4 === 3) bwmAkk(akk, t, .08, .022, "triangle", 1400, false, -12); // Bubble
      const b = { 2: 0, 4: 0, 6: 7, 8: 10, 10: 12, 12: 10, 14: 7 }[im]; if (b !== undefined) bwmBass(root + b, t, .26, .34, 500);
      if (!intro && takt % 8 < 6) { const n = bwmMel({ 0: 76, 2: 76, 4: 74, 6: 72, 8: 74, 12: 69, 16: 72, 18: 74, 20: 76, 22: 79, 24: 76, 28: 74 }, { 0: 72, 4: 74, 8: 72, 10: 69, 12: 67, 16: 69, 24: 69 }, takt, im); if (n) bwTon("sawtooth", bwHz(n), t, .36, .045, 1800, true); }
      if (takt % 8 === 7) bwmFill(im, t);
    } },
  { id: "reggae2", t: "Sonnenschein-Reggae", stil: "Reggae", sym: "☀️", bpm: 84, tanz: ["schulter", "seit", "klatschen", "winken"],
    spiel(g, t) { // Steppers: Bass-Trommel auf jeden Schlag, Rand auf 2 und 4, Skank, gepfiffene Melodie in G-Dur
      const im = g % 16, takt = Math.floor(g / 16), akk = [[55, 59, 62], [60, 64, 67], [62, 66, 69], [60, 64, 67]][takt % 4], root = [43, 48, 50, 48][takt % 4], intro = takt < 2;
      if (im % 4 === 0) bwmKick(t, .85); if (im === 4 || im === 12) bwmRim(t, .3);
      if (im % 2 === 1) bwmHat(t, false, .03);
      if (im % 4 === 2) bwmAkk(akk, t, .09, .045, "square", 2200, true);
      if (!intro && im % 4 === 2) bwmAkk(akk, t + .06, .06, .02, "triangle", 1600, false, 12); // Doppel-Skank
      const b = { 0: 0, 3: 0, 4: 7, 6: 12, 8: 0, 11: 4, 12: 7, 14: 9 }[im]; if (b !== undefined) bwmBass(root + b, t, .2, .32, 520);
      if (!intro) { const n = bwmMel({ 0: 74, 2: 76, 4: 79, 8: 76, 10: 74, 12: 71, 16: 74, 20: 76, 22: 74, 24: 71, 28: 67 }, { 0: 71, 2: 74, 4: 76, 6: 74, 8: 71, 12: 69, 16: 67, 20: 71, 24: 74 }, takt, im); if (n) { bwTon("sine", bwHz(n + 12), t, .3, .06, 0, true); bwTon("sine", bwHz(n + 12) * 1.004, t, .3, .02); } }
      if (takt % 8 === 7) bwmFill(im, t);
    } },
  { id: "funk", t: "Funky Schneebesen", stil: "Funk", sym: "🕺", bpm: 104, tanz: ["marsch", "klatschen", "schulter", "jubel"],
    spiel(g, t) { // Funk: synkopierte Bass-Trommel, Ghost-Notes, 16tel-Hi-Hats, Slap-Bass, Clavinet, Bläser-Stöße
      const im = g % 16, takt = Math.floor(g / 16), m7 = takt % 4 < 2, akk = m7 ? [64, 67, 71, 74] : [69, 73, 76, 79], root = m7 ? 40 : 45, intro = takt < 2;
      if (im === 0 || im === 6 || im === 10) bwmKick(t, .95);
      if (im === 4 || im === 12) bwmSnare(t, .4); if (im === 7 || im === 15) bwmSnare(t, .07);
      bwmHat(t, im === 14, im % 2 ? .03 : .05);
      const b = { 0: 0, 3: 12, 6: 0, 7: 10, 10: 7, 11: 10, 13: 12, 14: 3 }[im]; if (b !== undefined) { bwmBass(root + b, t, .14, .36, 900); if (b === 12) bwTon("square", bwHz(root + b), t, .05, .05, 2500); }
      if (!intro && [2, 5, 8, 11, 14].includes(im)) bwmAkk(akk, t, .06, .025, "square", 3000);
      if (!intro && takt % 4 === 3 && (im === 12 || im === 14)) bwmAkk(akk, t, .18, .04, "sawtooth", 2600, true, 12); // Bläser
      if (!intro && takt % 8 >= 4) { const n = bwmMel({ 0: 71, 2: 74, 3: 76, 6: 74, 8: 71, 10: 69, 12: 67, 14: 64 }, { 0: 76, 3: 79, 6: 76, 8: 74, 12: 71 }, takt, im); if (n) bwTon("sawtooth", bwHz(n), t, .16, .045, 2200, true); }
      if (takt % 8 === 7) bwmFill(im, t);
    } },
  { id: "samba", t: "Samba in der Pfanne", stil: "Samba", sym: "💃", bpm: 100, tanz: ["hula", "seit", "klatschen", "jubel"],
    spiel(g, t) { // Samba: Surdo auf der 2 (schwer), Shaker, Agogo-Glocken, Gitarre synkopiert, Flöte
      const im = g % 16, takt = Math.floor(g / 16), akk = [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62, 65]][takt % 4], root = [48, 45, 50, 43][takt % 4], intro = takt < 1;
      if (im === 4 || im === 12) { const o = bwTon("sine", 95, t, .4, 1); o.frequency.exponentialRampToValueAtTime(60, t + .3); } else if (im === 0 || im === 8) bwTon("sine", 85, t, .12, .45);
      bwRauschen(t, .05, im % 4 === 3 ? .09 : .045, 6000, "highpass"); // Shaker
      if ([0, 3, 6, 10, 12].includes(im)) bwTon("triangle", [0, 6, 12].includes(im) ? 1180 : 880, t, .12, .07);
      if (!intro && [0, 3, 6, 10, 13].includes(im)) bwmAkk(akk, t, .12, .03, "triangle", 2600);
      const b = { 0: 0, 6: 7, 8: 0, 12: 7, 14: 12 }[im]; if (b !== undefined) bwmBass(root + b, t, .22, .3, 600);
      if (!intro && takt >= 2) { const n = bwmMel({ 0: 79, 2: 77, 4: 76, 6: 74, 8: 76, 12: 72, 16: 74, 18: 76, 20: 77, 22: 79, 24: 81, 28: 79 }, { 0: 76, 3: 77, 6: 76, 8: 74, 12: 72, 16: 71, 18: 72, 20: 74, 24: 72 }, takt, im); if (n) bwTon("sine", bwHz(n), t, .28, .07, 0, true); }
      if (takt % 8 === 7 && im >= 8) bwTon("triangle", 1180, t, .05, .05);
    } },
  { id: "ballade", t: "Abendrot-Ballade", stil: "Ballade", sym: "🌅", bpm: 70, tanz: ["kopfneigen", "seit", "winken", "armkreis"],
    spiel(g, t) { // ruhig: Klavier-Arpeggio mit Hall, warme Fläche, weiche Bass-Trommel, Besen, langsame Melodie
      const im = g % 16, takt = Math.floor(g / 16), akk = [[65, 69, 72], [64, 67, 72], [62, 65, 69], [62, 65, 70]][takt % 4], root = [41, 36, 38, 34][takt % 4], intro = takt < 2;
      if (im === 0) { bwmAkk(akk, t, 3, .02, "sawtooth", 700, false, -12); bwmBass(root, t, 1.4, .3, 400); } if (im === 8) bwmBass(root + 7, t, 1, .22, 400);
      if (im % 2 === 0) bwTon("triangle", bwHz(akk[(im / 2) % 3] + (im >= 8 ? 12 : 0)), t, .9, .05, 0, true);
      if (!intro && (im === 0 || im === 10)) bwmKick(t, .55); if (!intro && (im === 4 || im === 12)) bwRauschen(t, .22, .06, 2500, "bandpass");
      if (!intro) { const n = bwmMel({ 0: 77, 4: 76, 8: 74, 12: 72, 16: 74, 24: 72 }, { 0: 72, 4: 74, 8: 76, 12: 77, 16: 79, 24: 77 }, takt, im); if (n) { bwTon("sine", bwHz(n), t, 1.1, .07, 0, true); bwTon("triangle", bwHz(n + 12), t, .6, .012); } }
    } },
  { id: "polka", t: "Biergarten-Polka", stil: "Polka", sym: "🍺", bpm: 120, tanz: ["marsch", "klatschen", "treppe", "jubel"],
    spiel(g, t) { // Humpta: Bass auf dem Schlag (Grundton/Quinte im Wechsel), Akkord auf dem „ta“, Akkordeon-Melodie
      const im = g % 16, takt = Math.floor(g / 16), c = takt % 4 === 0 || takt % 4 === 3, akk = c ? [60, 64, 67] : [55, 59, 62, 65], root = c ? 36 : 43, intro = takt < 1;
      if (im % 4 === 0) { bwmBass(root + (im % 8 ? 7 : 0), t, .2, .38, 700); bwmKick(t, .5); }
      if (im % 4 === 2) { bwmAkk(akk, t, .1, .035, "square", 2200); bwRauschen(t, .05, .08, 5000, "highpass"); }
      if (!intro) { const n = bwmMel({ 0: 72, 2: 76, 4: 79, 6: 76, 8: 72, 10: 76, 12: 79, 14: 84, 16: 83, 18: 79, 20: 74, 22: 77, 24: 83, 26: 79, 28: 74, 30: 71 },
        { 0: 74, 2: 77, 4: 83, 6: 79, 8: 74, 10: 77, 12: 79, 14: 77, 16: 76, 18: 79, 20: 84, 22: 79, 24: 72, 28: 72 }, takt, im);
        if (n) { bwTon("square", bwHz(n), t, .2, .035, 2600); bwTon("square", bwHz(n) * 1.006, t, .2, .025, 2600); bwTon("square", bwHz(n - 12), t, .2, .015, 1800); } }
      if (takt % 8 === 7 && im >= 12) bwmSnare(t, .12);
    } },
  // ----- 2.307.0 KC-CLUB-BUEHNE-RICHTUNGEN (Wunsch Hansi): Kacheln je Musikrichtung, zu jeder Richtung mehrere Lieder -----
  { id: "ska", t: "Ska-Kartoffel", stil: "Ska", sym: "🥔", bpm: 152, tanz: ["marsch", "klatschen", "schulter", "jubel"],
    spiel(g, t) { bwmSka(g, t, { roots: [48, 45, 41, 43], akk: [[60, 64, 67], [57, 60, 64], [57, 60, 65], [55, 59, 62]],
      a: { 0: 79, 2: 79, 4: 76, 6: 79, 8: 81, 12: 79, 16: 77, 18: 76, 20: 74, 24: 72, 28: 74 }, b: { 0: 72, 2: 74, 4: 76, 8: 79, 12: 76, 16: 74, 20: 71, 24: 67 } }); } },
  { id: "funk2", t: "Funky Fritteuse", stil: "Funk", sym: "🍟", bpm: 100, tanz: ["schulter", "hula", "klatschen", "marsch"],
    spiel(g, t) { bwmFunk(g, t, { roots: [43, 43, 48, 48], akk: [[55, 58, 62, 65], [55, 58, 62, 65], [60, 64, 67, 70], [60, 64, 67, 70]], bass: { 0: 0, 3: 12, 5: 10, 7: 0, 10: 7, 12: 10, 14: 12 },
      a: { 0: 79, 3: 77, 6: 74, 8: 77, 12: 74, 14: 70 }, b: { 0: 82, 3: 79, 6: 77, 8: 74, 12: 79 } }); } },
  { id: "soul", t: "Soul-Suppe", stil: "Soul", sym: "🍲", bpm: 92, tanz: ["schulter", "seit", "kopfneigen", "winken"],
    spiel(g, t) { bwmFunk(g, t, { roots: [38, 38, 43, 43], akk: [[62, 65, 69, 72, 76], [62, 65, 69, 72, 76], [55, 59, 64, 65, 69], [55, 59, 64, 65, 69]], bass: { 0: 0, 6: 7, 8: 12, 11: 10, 14: 7 }, weich: true,
      a: { 0: 77, 4: 76, 6: 74, 8: 72, 12: 74, 16: 69, 20: 72, 24: 74 }, b: { 0: 81, 4: 79, 8: 77, 12: 76, 16: 74, 24: 72 } }); } },
  { id: "rock1", t: "Pfannen-Rock", stil: "Rock", sym: "🎸", bpm: 128, tanz: ["marsch", "jubel", "seit", "klatschen"],
    spiel(g, t) { bwmRock(g, t, { roots: [52, 55, 57, 52], kick: [6], a: { 0: 76, 2: 79, 4: 81, 6: 79, 8: 76, 12: 74, 16: 76, 18: 79, 20: 83, 22: 81, 24: 79, 28: 76 },
      b: { 0: 74, 2: 76, 4: 79, 8: 76, 10: 74, 12: 71, 16: 74, 20: 72, 24: 71 } }); } },
  { id: "rock2", t: "Küchen-Highway", stil: "Rock", sym: "🛣️", bpm: 140, tanz: ["marsch", "seit", "jubel", "klatschen"],
    spiel(g, t) { bwmRock(g, t, { roots: [57, 62, 64, 62], kick: [10], lang: true, a: { 0: 76, 4: 78, 6: 76, 8: 73, 12: 76, 16: 81, 20: 78, 24: 76, 28: 73 },
      b: { 0: 74, 2: 76, 4: 78, 8: 76, 12: 73, 16: 71, 24: 69 } }); } },
  { id: "rocknroll", t: "Rock'n'Roll im Kühlhaus", stil: "Rock'n'Roll", sym: "🧊", bpm: 168, tanz: ["marsch", "klatschen", "hula", "jubel"],
    spiel(g, t) { bwmBoogie(g, t); } },
  { id: "ballade2", t: "Kerzenschein am Herd", stil: "Ballade", sym: "🕯️", bpm: 66, tanz: ["kopfneigen", "winken", "seit", "armkreis"],
    spiel(g, t) { bwmBallade(g, t, { roots: [36, 43, 45, 41], akk: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]],
      a: { 0: 76, 4: 74, 8: 72, 12: 74, 16: 76, 24: 79 }, b: { 0: 77, 4: 76, 8: 74, 12: 72, 16: 71, 24: 72 } }); } },
  { id: "ballade3", t: "Abschied vom Weihnachtsmarkt", stil: "Ballade", sym: "🎄", bpm: 72, tanz: ["winken", "kopfneigen", "seit", "armkreis"],
    spiel(g, t) { bwmBallade(g, t, { roots: [43, 40, 36, 38], akk: [[59, 62, 67], [59, 64, 67], [60, 64, 67], [62, 66, 69]], streicher: true,
      a: { 0: 74, 4: 71, 8: 72, 12: 74, 16: 76, 20: 74, 24: 71 }, b: { 0: 72, 4: 74, 8: 76, 12: 79, 16: 78, 24: 74 } }); } },
  { id: "chacha", t: "Cha-Cha-Champignon", stil: "Cha-Cha-Cha", sym: "🍄", bpm: 118, tanz: ["hula", "seit", "klatschen", "schulter"],
    spiel(g, t) { bwmLatin(g, t, { art: "chacha", roots: [45, 50], akk: [[57, 60, 64], [57, 60, 62, 66]],
      a: { 0: 76, 2: 76, 4: 77, 6: 76, 8: 74, 10: 72, 12: 74, 16: 72, 20: 71, 24: 69 }, b: { 0: 69, 4: 72, 6: 74, 8: 76, 12: 79, 16: 77, 20: 76, 24: 74 } }); } },
  { id: "bossa", t: "Bossa am Backofen", stil: "Bossa Nova", sym: "🌊", bpm: 132, tanz: ["seit", "schulter", "kopfneigen", "hula"],
    spiel(g, t) { bwmLatin(g, t, { art: "bossa", roots: [38, 43, 36, 45], akk: [[62, 65, 69, 72], [59, 62, 65, 67], [60, 64, 67, 71], [61, 64, 67, 69]],
      a: { 0: 77, 3: 76, 6: 74, 8: 72, 12: 74, 16: 76, 22: 74, 24: 72 }, b: { 0: 72, 4: 71, 6: 72, 8: 74, 12: 76, 16: 77, 24: 76 } }); } },
  { id: "walzer", t: "Walzer im Weinkeller", stil: "Walzer", sym: "🍷", bpm: 160, tanz: ["seit", "winken", "armkreis", "schulter"],
    spiel(g, t) { bwmWalzer(g, t); } },
  { id: "schlager", t: "Schunkel-Schlager", stil: "Schlager", sym: "🎤", bpm: 124, tanz: ["klatschen", "seit", "schulter", "jubel"],
    spiel(g, t) { const im = g % 16, takt = Math.floor(g / 16), akk = [[60, 64, 67], [57, 60, 64], [57, 60, 65], [55, 59, 62]][takt % 4], root = [36, 45, 41, 43][takt % 4];
      bwmDisco(im, t, true, takt); if (im % 2 === 0) bwmBass(root + (im % 4 === 2 ? 7 : 0), t, .16, .3, 800); if (im === 0) bwmAkk(akk, t, 1.9, .02, "sawtooth", 2600, true); if (im % 4 === 2) bwmAkk(akk, t, .08, .022, "square", 2400);
      if (takt >= 2) { const n = bwmMel({ 0: 79, 2: 77, 4: 76, 6: 74, 8: 76, 12: 72, 16: 72, 18: 74, 20: 76, 24: 77, 28: 76 }, { 0: 74, 2: 76, 4: 77, 8: 79, 12: 81, 16: 79, 20: 77, 24: 76, 28: 74 }, takt, im); if (n) { bwTon("square", bwHz(n), t, .24, .045, 3000, true); bwTon("triangle", bwHz(n + 12), t, .2, .015); } } } },
  // 2.316.0 KC-CLUB-SONG (Wunsch Hansi „Köcheclub-Song mit Text und Melodie im Helene-Fischer-Stil“): feste Liedfolge, Gesangsmelodie + Karaoke-Text
  { id: "clubsong", t: "Seit einundneunzig", stil: "Club-Song", sym: "🎤", bpm: 124, takte: 0, tanz: ["klatschen", "seit", "jubel", "schulter"],
    spiel(g, t) { ksSpiel(g, t); } },
];
// ----- 2.316.0 KC-CLUB-SONG „Seit einundneunzig (Köcheclub Werne)“ – Text: Hansi & Claude, nach der Clubchronik (Mai 1991 Gaststätte Ickorn,
// seit 1995 Weihnachtsmarkt, Erlöse für soziale Zwecke). Disco-Fox (124 BPM) wie bei Helene Fischer: Bass-Trommel auf jeden Schlag, Oktav-Bass,
// Streicher-Fläche, Klatschen auf 2 und 4, Becken zum Refrain, im Schluss-Refrain einen Ganzton höher (Rückung). Jede Textzeile = 2 Takte;
// die Silben liegen auf Achteln, die letzte wird gehalten. Die Gesangsstimme ist ein Synthesizer – Twinkey tanzt, der Text läuft als Karaoke mit.
const KS_AKK = { C: [[60, 64, 67], 36], G: [[59, 62, 67], 43], Am: [[57, 60, 64], 45], F: [[57, 60, 65], 41], Em: [[59, 64, 67], 40], Dm: [[57, 62, 65], 38] };
const KS_HOOK = [67, 67, 69, 72, 72, 72, 71, 69, 67, 64]; // „Seit ein-und-neun-zig – Kö-che-club Wer-ne“: hoch zur „neun“, dann runter
// Schreibweise: Leerzeichen trennt Wörter, „-“ trennt Silben (jede Silbe bekommt einen Ton). Satzzeichen hängen an der Silbe.
const KS_TEXT = {
  s1: [["Im Mai ein-und-neun-zig, beim Ick-orn am Tisch,", [64, 64, 64, 62, 64, 67, 65, 64, 62, 64, 60]],
    ["da sa-ßen ein paar Kö-che – die I-dee war noch frisch.", [62, 62, 64, 65, 65, 67, 65, 64, 64, 62, 60, 62, 64]],
    ["Vom Kran-ken-haus, vom Al-ten-heim, mit Herz und mit Hand,", [64, 64, 64, 67, 67, 69, 69, 67, 65, 67, 65, 64, 62]],
    ["und kei-ner von uns ahn-te, was da gra-de ent-stand.", [60, 62, 64, 64, 65, 67, 67, 65, 64, 62, 64, 62, 60]]],
  s2: [["Dann kam fünf-und-neun-zig, der Weih-nachts-markt rief,", [64, 64, 64, 62, 64, 67, 65, 64, 62, 64, 60]],
    ["es duf-te-te nach Grün-kohl, der Ei-er-punsch, der lief.", [62, 62, 64, 65, 65, 67, 65, 64, 64, 62, 60, 62, 64]], // 2.613.0 (Wunsch Hansi): Eierpunsch statt Glühwein
    ["Am Sonn-tag in Rot und un-ter der Wo-che in Weiß,", /* 2.613.0 (Wunsch Hansi): Sonntag statt Freitag */ [64, 64, 64, 67, 67, 69, 69, 67, 65, 67, 65, 64, 62]],
    ["und was wir ver-die-nen, das ge-ben wir wei-ter – mit Fleiß.", [60, 62, 64, 64, 64, 65, 67, 67, 65, 64, 62, 64, 62, 60]]],
  pre: [["Ein Löf-fel, ein Topf und ein Traum –", [65, 65, 64, 65, 67, 69, 67, 72]],
    ["wer hät-te das ge-dacht? Man glaubt es kaum …", [65, 65, 64, 65, 67, 69, 72, 71, 69, 71]]],
  ref: [["Seit ein-und-neun-zig – Kö-che-club Wer-ne!", KS_HOOK, true],
    ["Wir ko-chen mit Herz, und das tun wir so ger-ne!", [64, 65, 67, 69, 69, 72, 72, 69, 67, 65, 67, 65]],
    ["Ob Grün-kohl, ob Punsch, ob die Ja-cke rot o-der weiß –", [67, 67, 69, 72, 72, 71, 69, 71, 72, 74, 72, 71, 72]],
    ["wir rüh-ren zu-sam-men, der Kes-sel bleibt heiß!", [69, 69, 69, 67, 65, 65, 67, 69, 71, 72, 74]], // 2.613.0 (Wunsch Hansi „unser Preis – andere Idee?“): „der Kessel bleibt heiß“
    ["Seit ein-und-neun-zig – da glüht un-ser Herd,", KS_HOOK, true], // 2.417.0 (Wunsch Hansi): „glüht“ statt „brennt“
    ["weil Freund-schaft im-mer da-zu ge-hört!", [65, 65, 67, 69, 72, 71, 67, 64, 60]]], // 2.417.0 (Wunsch Hansi): neuer Text, Melodie auf 9 Silben gekürzt (gleicher Bogen, Schluss auf dem Grundton)
  bridge: [["Man-che sind ge-gan-gen, doch sie sind noch da-bei,", [69, 69, 67, 65, 65, 64, 64, 65, 67, 69, 67, 65]],
    ["in je-dem Re-zept und bei je-der Schlem-me-rei.", [64, 64, 65, 67, 67, 64, 64, 65, 67, 69, 67, 64]], // 2.613.0 (Wunsch Hansi): „Schlemmerei“ statt „Feierei“
    ["Und kommt mal ein Neu-er, dann rü-cken wir zu-samm' –", [69, 69, 69, 72, 72, 69, 67, 69, 71, 72, 74, 72]],
    ["ein Platz an der Ta-fel ist im-mer noch frei – na komm!", [72, 72, 71, 69, 71, 72, 74, 72, 71, 69, 71, 74, 76]]],
};
// Zeile → Silben (mit Leerzeichen am Wortende, für die Anzeige); „–“ und „…“ hängen am vorigen Wort
const ksSilben = (zeile) => zeile.replace(/ ([–…])/g, "\u00a0$1").split(" ").flatMap((w) => { const t = w.split("-"); t[t.length - 1] += " "; return t; });
const KS_REF_AKK = ["C", "G", "Am", "F", "C", "G", "F", "G", "C", "G", "F", "C"];
const KS_ABLAUF = [["intro", ["C", "G", "Am", "F"], null, 0], ["s1", ["Am", "F", "C", "G", "Am", "F", "C", "G"], "s1", 0], ["pre", ["F", "G", "F", "G"], "pre", 0],
  ["ref", KS_REF_AKK, "ref", 0], ["s2", ["Am", "F", "C", "G", "Am", "F", "C", "G"], "s2", 0], ["pre", ["F", "G", "F", "G"], "pre", 0], ["ref", KS_REF_AKK, "ref", 0],
  ["bridge", ["F", "G", "Em", "Am", "F", "G", "Dm", "G"], "bridge", 0], ["ref", KS_REF_AKK, "ref", 2], ["ref", KS_REF_AKK, "ref", 2], ["outro", ["C", "C"], null, 2]];
const KS_TAKTE = KS_ABLAUF.flatMap(([teil, akk, text, hoch], a) => akk.map((name, k) => {
  const z = text && k % 2 === 0 ? KS_TEXT[text][k / 2] : null;
  return { teil, name, hoch, neu: k === 0, abschnitt: a, letzter: k === akk.length - 1, zeile: z ? { silben: ksSilben(z[0]), noten: z[1], klatsch: !!z[2] } : null };
}));
BW_STUECKE.find((x) => x.id === "clubsong").takte = KS_TAKTE.length;
function ksSpiel(g, t) {
  const im = g % 16, b = Math.floor(g / 16), T = KS_TAKTE[b]; if (!T) return; // Liedende: Stille, dann geht es zum nächsten Stück
  const [akk0, root] = KS_AKK[T.name], tr = T.hoch, akk = akk0.map((m) => m + tr), sanft = T.teil === "bridge" || T.teil === "intro" && b < 2;
  if (T.teil === "outro") { if (b === KS_TAKTE.length - 2 && im === 0) { bwmAkk(akk, t, 3.2, .03, "sawtooth", 2400, true); bwmBass(root + tr, t, 2.4, .35, 500); bwmKick(t, 1); bwRauschen(t, 2.2, .3, 5000, "highpass"); } return; }
  bwmDisco(im, t, !sanft, b); // Disco-Fox: Bass-Trommel auf jeden Schlag, offene Hi-Hat auf dem Nachschlag, Klatschen auf 2 und 4
  if (im % 2 === 0) bwmBass(root + tr + (im % 4 === 2 ? 12 : 0), t, .15, .3, 800); // Oktav-Bass
  if (im === 0) bwmAkk(akk, t, 1.9, sanft ? .014 : .02, "sawtooth", 2600, true); // Streicher-Fläche
  if (!sanft && im % 4 === 2) bwmAkk(akk, t, .08, .02, "square", 2400); // Akkord-Stoß auf dem Nachschlag
  if (T.neu && im === 0 && T.teil === "ref") bwRauschen(t, 1.6, .28, 5000, "highpass"); // Becken zum Refrain
  if (T.letzter && (T.teil === "pre" || T.teil === "bridge" || T.teil === "ref" && KS_TAKTE[b + 1]?.hoch !== T.hoch) && im >= 8 && im % 2 === 0) bwmSnare(t, .12 + (im - 8) * .04); // Wirbel vor dem Refrain / der Rückung
  if (T.teil === "intro" && im === 0 && b % 2 === 0) ksSingen(b === 0 ? KS_TEXT.ref[0] : KS_TEXT.ref[5], t, 0, true); // Intro: die Melodie vom Refrain, ohne Text
  if (T.zeile && im === 0) ksSingen(T.zeile, t, tr, false, b);
}
const KS = { zeilen: [] }; // gesungene Zeilen (mit Zeiten) für die Karaoke-Anzeige
function ksSingen(z, t, tr, nurMelodie, takt) {
  const silben = Array.isArray(z) ? ksSilben(z[0]) : z.silben, noten = Array.isArray(z) ? z[1] : z.noten, n = silben.length, sech = bwmSchlag() / 4, zeiten = [];
  for (let k = 0; k < n; k++) {
    const st = k * 2, dauer = (k === n - 1 ? Math.max(4, 30 - st) : 2) * sech * .92, hz = bwHz(noten[Math.min(k, noten.length - 1)] + tr), tt = t + st * sech; zeiten.push(tt);
    bwTon("sawtooth", hz, tt, dauer, nurMelodie ? .03 : .04, 2000, true); bwTon("sine", hz, tt, dauer, nurMelodie ? .05 : .07); bwTon("triangle", hz * 2, tt, dauer * .6, .01); // „Stimme“: warm, mit Hall
  }
  if (!nurMelodie && (z.klatsch || (Array.isArray(z) && z[2]))) [24, 26].forEach((st) => bwmSnare(t + st * sech, .38)); // 👏👏 nach „Köcheclub Werne!“
  if (!nurMelodie) { KS.zeilen.push({ silben, zeiten, ende: t + 32 * sech, takt }); KS.zeilen = KS.zeilen.slice(-4); }
}
function ksNaechsteZeile(takt) { for (let b = takt + 1; b < KS_TAKTE.length; b++) if (KS_TAKTE[b].zeile) return KS_TAKTE[b].zeile.silben.join("").trim(); return ""; }
function ksKaraoke() { // Text zum Mitsingen: die laufende Zeile, gesungene Silben leuchten, darunter die nächste
  const k = $("bwKaraoke"); if (!k) { clearInterval(KS.uhr); KS.uhr = 0; return; }
  if (!BWM.ctx || BWM.stueck?.id !== "clubsong") return;
  const jetzt = BWM.ctx.currentTime, z = [...KS.zeilen].reverse().find((x) => x.zeiten[0] - .35 <= jetzt && jetzt < x.ende + .2);
  const b = Math.floor((BWM.gesamt || 0) / 16), naechste = z ? ksNaechsteZeile(z.takt) : (KS_TAKTE.slice(0, b + 1).some((x) => x.zeile) ? "" : ksNaechsteZeile(-1));
  const zeile = z ? z.silben.map((s, i) => `<span class="${jetzt >= z.zeiten[i] ? (i === z.silben.length - 1 || jetzt < (z.zeiten[i + 1] || 9e9) ? "jetzt" : "war") : ""}">${esc(s)}</span>`).join("")
    : `<span class="bw-k-warte">${b >= KS_TAKTE.length - 2 ? "👏 Applaus für den Köcheclub!" : "🎤 Gleich geht’s los – sing mit!"}</span>`;
  const html = `<div class="bw-k-zeile">${zeile}</div>${naechste ? `<div class="bw-k-naechste">${esc(naechste)}</div>` : ""}`;
  if (k.innerHTML !== html) k.innerHTML = html;
}
function bwClubSong() { bwWahlSetzen({ stueck: "clubsong" }, true); bwHoeren(); } // 🎤 direkt aus der Bühnen-Auswahl
// Musikrichtungen als Kacheln (Stil → Richtung); Reihenfolge = Kacheln
const BW_RICHTUNGEN = [["club", "🎤", "Club-Song", ["Club-Song"]], ["disco", "🪩", "Disco", ["Disco"]], ["reggae", "🌴", "Reggae", ["Reggae", "Ska"]], ["funk", "🕺", "Funky", ["Funk", "Soul"]], ["rock", "🎸", "Rock", ["Rock", "Rock'n'Roll"]],
  ["ballade", "🌅", "Ballade", ["Ballade"]], ["latin", "💃", "Latin", ["Samba", "Cha-Cha-Cha", "Bossa Nova"]], ["volk", "🍺", "Schlager & Polka", ["Polka", "Walzer", "Schlager"]]];
const bwmRichtung = (s) => (BW_RICHTUNGEN.find((r) => r[3].includes(s?.stil)) || BW_RICHTUNGEN[0])[0];
const bwmImRichtung = (gr) => BW_STUECKE.map((x, k) => [x, k]).filter(([x]) => bwmRichtung(x) === gr).map(([, k]) => k);
function bwmNachbar(i, schritt) { const l = bwmImRichtung(bwmRichtung(BW_STUECKE[i])), p = l.indexOf(i); return l[((p + schritt) % l.length + l.length) % l.length]; } // innerhalb der Richtung blättern
// 2.307.0 KC-CLUB-BUEHNE-RICHTUNGEN: Bausteine je Musikrichtung (Lieder geben nur Akkorde, Bass und Melodie vor)
function bwmRock(g, t, o) { // Rock: Bass-Trommel 1 und 3, Snare 2 und 4, Becken alle 4 Takte, Powerchords in Achteln, Lead-Gitarre
  const im = g % 16, takt = Math.floor(g / 16), r = o.roots[takt % o.roots.length], intro = takt < 2;
  if (im === 0 || im === 8 || (o.kick || []).includes(im)) bwmKick(t, 1); if (im === 4 || im === 12) bwmSnare(t, .45);
  bwmHat(t, false, im % 2 ? .02 : .045); if (im === 0 && takt % 4 === 0) bwRauschen(t, 1.2, .22, 5000, "highpass");
  if (im % 2 === 0) { const d = o.lang && im % 8 === 0 ? .45 : .12; [0, 7, 12].forEach((iv) => { bwTon("sawtooth", bwHz(r + iv), t, d, .028, 1800); bwTon("square", bwHz(r + iv) * 1.01, t, d, .014, 1400); }); bwmBass(r - 12, t, .14, .32, 700); }
  if (!intro) { const n = bwmMel(o.a, o.b, takt, im); if (n) { bwTon("square", bwHz(n), t, .26, .045, 2600, true); bwTon("sawtooth", bwHz(n) * 1.004, t, .26, .02, 2200); } }
  if (takt % 8 === 7 && im >= 12) bwmSnare(t, .2); bwKuechenTakt(im, t);
}
function bwmBoogie(g, t) { // Rock'n'Roll: 12-Takt-Blues in C, Boogie-Bass mit Swing, Klavier-Stöße, Saxofon-Riff
  const im = g % 16, takt = Math.floor(g / 16), folge = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7], r = 36 + folge[takt % 12], sw = im % 4 === 2 ? 60 / 168 / 4 * .35 : 0, intro = takt < 1;
  if (im === 0 || im === 8) bwmKick(t, .95); if (im === 4 || im === 12) bwmSnare(t, .45); if (im % 2 === 0) bwmHat(t + sw, false, .04);
  if (im % 2 === 0) bwmBass(r + [0, 4, 7, 9, 10, 9, 7, 4][im / 2], t + sw, .16, .34, 900);
  if (!intro && (im === 2 || im === 6 || im === 10 || im === 14)) bwmAkk([r + 24, r + 28, r + 31, r + 34], t + sw, .1, .02, "triangle", 3000);
  if (!intro && takt % 12 >= 4) { const n = { 0: 72, 2: 75, 4: 76, 8: 79, 12: 76 }[im]; if (n && takt % 2 === 0) bwTon("sawtooth", bwHz(n + folge[takt % 12]), t + sw, .2, .04, 2400, true); }
  bwKuechenTakt(im, t);
}
function bwmFunk(g, t, o) { // Funk/Soul: synkopierte Bass-Trommel, Ghost-Notes, 16tel-Hats, Slap-Bass, Clavinet bzw. weiches E-Piano
  const im = g % 16, takt = Math.floor(g / 16), r = o.roots[takt % o.roots.length], akk = o.akk[takt % o.akk.length], intro = takt < 2;
  if (im === 0 || im === 7 || im === 10) bwmKick(t, .95); if (im === 4 || im === 12) bwmSnare(t, .4); if (im === 9 || im === 15) bwmSnare(t, .06);
  bwmHat(t, im === 14, im % 2 ? .025 : .045);
  const b = o.bass[im]; if (b !== undefined) bwmBass(r + b, t, .14, .34, o.weich ? 600 : 900);
  if (!intro) { if (o.weich) { if (im === 0 || im === 10) { akk.forEach((m) => { bwTon("triangle", bwHz(m), t, .9, .022, 0, true); bwTon("sine", bwHz(m), t, .9, .016); }); } }
    else if ([2, 5, 8, 11, 14].includes(im)) bwmAkk(akk, t, .06, .024, "square", 3000); }
  if (!intro && takt % 4 >= 2) { const n = bwmMel(o.a, o.b, takt, im); if (n) bwTon("sawtooth", bwHz(n), t, .2, .04, 2400, true); }
  if (takt % 8 === 7) bwmFill(im, t); bwKuechenTakt(im, t);
}
function bwmSka(g, t, o) { // Ska: schnelle Offbeat-Gitarre, laufender Bass, Bläser-Melodie
  const im = g % 16, takt = Math.floor(g / 16), r = o.roots[takt % 4], akk = o.akk[takt % 4];
  if (im === 0 || im === 8) bwmKick(t, .9); if (im === 4 || im === 12) bwmSnare(t, .35); if (im % 2 === 0) bwmHat(t, false, .03);
  if (im % 4 === 2) bwmAkk(akk, t, .07, .04, "square", 3200, true);
  if (im % 4 === 0) bwmBass(r + [0, 4, 7, 9][im / 4], t, .2, .32, 700);
  if (takt >= 2) { const n = bwmMel(o.a, o.b, takt, im); if (n) { bwTon("sawtooth", bwHz(n), t, .2, .035, 2600, true); bwTon("square", bwHz(n - 12), t, .2, .02, 1800); } }
  if (takt % 8 === 7) bwmFill(im, t); bwKuechenTakt(im, t);
}
function bwmBallade(g, t, o) { // Ballade: Klavier-Arpeggio mit Hall, Fläche, weiche Trommel, langsame Melodie (auf Wunsch mit Streichern)
  const im = g % 16, takt = Math.floor(g / 16), r = o.roots[takt % 4], akk = o.akk[takt % 4], intro = takt < 2;
  if (im === 0) { bwmAkk(akk, t, 3, o.streicher ? .028 : .02, "sawtooth", o.streicher ? 1400 : 700, o.streicher, -12); bwmBass(r, t, 1.4, .3, 400); } if (im === 8) bwmBass(r + 7, t, 1, .22, 400);
  if (im % 2 === 0) bwTon("triangle", bwHz(akk[(im / 2) % akk.length] + (im >= 8 ? 12 : 0)), t, .9, .05, 0, true);
  if (!intro && (im === 0 || im === 10)) bwmKick(t, .5); if (!intro && (im === 4 || im === 12)) bwRauschen(t, .22, .06, 2500, "bandpass");
  if (!intro) { const n = bwmMel(o.a, o.b, takt, im); if (n) { bwTon("sine", bwHz(n), t, 1.1, .07, 0, true); bwTon("triangle", bwHz(n + 12), t, .6, .012); } }
}
function bwmLatin(g, t, o) { // Cha-Cha-Cha (Kuhglocke, Guiro, Congas, Montuno) bzw. Bossa Nova (Rand-Clave, weiche Gitarre, Flöte)
  const im = g % 16, takt = Math.floor(g / 16), r = o.roots[takt % o.roots.length], akk = o.akk[takt % o.akk.length], intro = takt < 1;
  if (o.art === "chacha") {
    if (im === 0 || im === 8) bwmKick(t, .8); if (im % 4 === 0) bwTon("triangle", 820, t, .09, .07); if (im === 12 || im === 14) bwTon("triangle", 640, t, .08, .06);
    if (im === 0 || im === 1 || im === 2) bwRauschen(t, .05, .05, 3500, "bandpass"); if (im === 6 || im === 7 || im === 14) bwTon("sine", im === 7 ? 260 : 200, t, .14, .2);
    if (!intro && [0, 3, 6, 8, 11, 14].includes(im)) bwmAkk(akk, t, .1, .025, "triangle", 2800); if (im === 6 || im === 12) bwmBass(r + (im === 12 ? 7 : 0), t, .3, .32, 600);
  } else {
    if (im === 0 || im === 6 || im === 8) bwmKick(t, .45); if ([0, 6, 12].includes(im) && takt % 2 === 0 || [4, 10].includes(im) && takt % 2 === 1) bwmRim(t, .22);
    bwRauschen(t, .04, .025, 7000, "highpass"); if (!intro && [0, 3, 6, 10, 12].includes(im)) bwmAkk(akk, t, .18, .022, "triangle", 2200);
    if (im === 0 || im === 6 || im === 8 || im === 14) bwmBass(r + (im === 6 || im === 14 ? 7 : 0), t, .3, .28, 500);
  }
  if (!intro && takt >= 2) { const n = bwmMel(o.a, o.b, takt, im); if (n) bwTon("sine", bwHz(n), t, .32, .07, 0, true); }
  bwKuechenTakt(im, t);
}
function bwmWalzer(g, t) { // Walzer im 3/4-Takt (12 Schritte = 3 Viertel): Humm-ta-ta, Akkordeon-Melodie aus den Akkordtönen
  const im = g % 12, takt = Math.floor(g / 12), fdur = [1, 1, 0, 0, 0, 0, 1, 1][takt % 8], akk = fdur ? [65, 69, 72] : [64, 67, 70, 72], r = fdur ? 41 : 36;
  if (im === 0) { bwmBass(r + (takt % 2 ? 7 : 0), t, .3, .44, 600); bwmKick(t, .6); } if (im === 4 || im === 8) bwmAkk(akk, t, .14, .042, "square", 2200);
  if (takt >= 2 && im % 4 === 0) { const toene = fdur ? [72, 77, 81] : [70, 76, 79], n = toene[(takt % 2 ? [2, 1, 0] : [0, 1, 2])[im / 4]]; bwTon("square", bwHz(n), t, .3, .046, 2600, true); bwTon("square", bwHz(n) * 1.006, t, .3, .028, 2600); }
}

function bwTrainingsStueck(modus) { // Disco-Stücke reihum; das erste ist die bisherige Trainingsmusik (null = eingebaute Fassung mit Stufen und Küchengeräuschen)
  const disco = BW_STUECKE.filter((x) => x.stil === "Disco"); let i = 0; try { i = (+esLies("bwDisco", "0") || 0) % disco.length; esSchreib("bwDisco", String(i + 1)); } catch (e) { i = 0; }
  const s = disco[i]; return s?.spiel ? { ...s, bpm: BW_TEMPO[modus] || 116 } : null;
}
const bwmSchlag = () => BWM.stueck ? 60 / BWM.stueck.bpm : bwSchlag();
const bwmTakte = (s) => s.takte || Math.max(32, Math.round(150 / (240 / s.bpm) / 8) * 8); // ca. 2½ Min., ganze 8-Takt-Blöcke
function bwmStueck(i) { // Stück wechseln, laufende Musik übernimmt nahtlos (kurze Atempause)
  const n = BW_STUECKE.length; i = ((i % n) + n) % n; const s = BW_STUECKE[i]; BWM.stueck = s; BWM.gesamt = 0; BWM.schritt = 0; BWM.stufe = 2; KS.zeilen = [];
  if (BW.hoeren) { BW.hoeren.i = i; BW.hoeren.tanz = 0; } bwWahlSetzen({ stueck: s.id }, true);
  if (BWM.ctx && BWM.laeuft) { BWM.zeit = Math.max(BWM.zeit, BWM.ctx.currentTime + .1) + .35; BWM.start = BWM.zeit; }
}
async function bwHoeren() {
  bwStopp(false); const w = bwWahl(), i = Math.max(0, BW_STUECKE.findIndex((s) => s.id === w.stueck));
  BW.hoeren = { i, pause: false, tanz: 0, farbe: Math.floor(Math.random() * BW_FARBEN.length) };
  try { BW.wach = await navigator.wakeLock?.request("screen"); } catch (e) { BW.wach = null; }
  bwMusik(true); bwmStueck(i); bwHoerZeigen(true);
  clearInterval(BW.takt); BW.takt = setInterval(bwHoerTick, 1000);
}
function bwHoerTick() {
  const H = BW.hoeren; if (!H) return clearInterval(BW.takt);
  if (!$("bwHoer")) return bwStopp();
  if (!esSichtbar()) { if (!H.pause) { H.pause = true; bwMusik(false); bwHoerZeigen(); } return; }
  if (H.pause || !BWM.stueck) return;
  const takt = Math.floor((BWM.gesamt || 0) / 16), ges = bwmTakte(BWM.stueck);
  if (takt >= ges) { bwmStueck(bwmNachbar(H.i, 1)); return bwHoerZeigen(); } // 2.307.0: nächstes Lied derselben Richtung
  const tanz = Math.floor(takt / 8); if (tanz !== H.tanz) { H.tanz = tanz; return bwHoerZeigen(); } // alle 8 Takte ein anderer Tanzschritt
  const b = $("bwBalken"); if (b) b.style.width = `${Math.min(100, takt / ges * 100)}%`;
}
function bwHoerZeigen(vorhangAuf) {
  const H = BW.hoeren, f = $("hrFlaeche"); if (!H || !f) return;
  const s = BW_STUECKE[H.i], tanz = s.tanz[H.tanz % s.tanz.length], takt = Math.floor((BWM.gesamt || 0) / 16), ges = bwmTakte(s), gr = bwmRichtung(s);
  f.innerHTML = `<div class="bw-buehne an bw-hoeren${H.pause ? " angehalten" : ""}" id="bwHoer"><div class="bw-licht"></div><div class="bw-vorhang links${vorhangAuf ? " oeffnet" : " offen"}"></div><div class="bw-vorhang rechts${vorhangAuf ? " oeffnet" : " offen"}"></div><div class="bw-boden"></div>
    <div class="bw-kopf"><div><small>🎶 Nur Musik · ${esc(s.stil)} · Lied ${bwmImRichtung(gr).indexOf(H.i) + 1} von ${bwmImRichtung(gr).length}</small><b>${s.sym} ${esc(s.t)}</b></div></div>
    <div class="bw-balken-bahn"><div class="bw-balken" id="bwBalken" style="width:${Math.min(100, takt / ges * 100)}%"></div></div>
    <div class="bw-mitte">${bwFigur(H.pause ? "ruhe" : tanz, 0, "", 0, bwmSchlag(), H.pause ? 0 : bwPhase(), H.farbe + H.i)}</div>
    ${s.id === "clubsong" ? '<div class="bw-karaoke" id="bwKaraoke" aria-live="off"></div>' : ""}
    <div class="bw-liste"><div class="bw-richtungen" role="group" aria-label="Musikrichtung">${BW_RICHTUNGEN.map(([k, sym, name]) => `<button type="button" class="es-k bw-richtung${k === gr ? " an" : ""}" onclick="bwHoerRichtung('${k}')" aria-pressed="${k === gr}"><span>${sym}</span>${esc(name)}</button>`).join("")}</div>
      <div class="bw-titel-liste" role="list">${bwmImRichtung(gr).map((k) => { const x = BW_STUECKE[k]; return `<button type="button" role="listitem" class="es-k${k === H.i ? " an" : ""}" onclick="bwHoerWahl(${k})" aria-label="${esc(x.t)} (${esc(x.stil)}) abspielen">${x.sym} ${esc(x.t)}</button>`; }).join("")}</div></div>${bwLautRegler("musik")}
    <div class="es-leiste"><button type="button" class="es-k" onclick="bwHoerWahl(bwmNachbar(${H.i}, -1))" aria-label="Voriges Lied">⏮</button><button type="button" class="es-k es-haupt" onclick="bwHoerPause()">${H.pause ? "▶︎ Weiter" : "⏸ Pause"}</button><button type="button" class="es-k" onclick="bwHoerWahl(bwmNachbar(${H.i}, 1))" aria-label="Nächstes Lied">⏭</button>
      <button type="button" class="es-k" onclick="bwStopp(true)">✖ Ende</button></div></div>`;
  ksKaraokeStart(); // 2.316.0 KC-CLUB-SONG
}
function ksKaraokeStart() { if (BW_STUECKE[BW.hoeren?.i]?.id === "clubsong" && !KS.uhr) { KS.uhr = setInterval(ksKaraoke, 90); } ksKaraoke(); }
function bwHoerWahl(i) { const H = BW.hoeren; if (!H) return; bwmStueck(i); if (H.pause) { H.pause = false; bwMusik(true); } bwHoerZeigen(); }
function bwHoerRichtung(gr) { const l = bwmImRichtung(gr); if (l.length) bwHoerWahl(l[0]); } // Kachel: erstes Lied der Richtung spielt
function bwHoerPause() { const H = BW.hoeren; if (!H) return; H.pause = !H.pause; bwMusik(!H.pause); bwHoerZeigen(); }
