// KC-CLUB-TEILE Stufe 1 (Prüfbericht C, Wunsch Hansi 28.10.2026): Erklär-Videos – Abspieler, Drehbücher, Stimmen, Bewertung.
// Wird erst geladen, wenn ein Video startet (Einstiege: erklaerVideos, rgListeAbspielen, rundgangStart, stimmenWahl – Platzhalter in app.js).
// Im Hauptprogramm bleiben: Zustand RG, Video-Katalog RUNDGAENGE, Hinweis „Warum diese App?“, Browser-Liste fürs Installieren, rgSichtbar.
// Nach jeder Änderung hier: node tools/teile-pruefsumme.mjs
// ---------- KC-CLUB-RUNDGANG (2.241.0, Wunsch Hansi): vertonter Rundgang durch die App – jeder spielt ihn auf seinem Handy ab ----------
// Zeigt nacheinander die echten Bereiche, hebt das Erklärte hervor (Rest abgedunkelt) und liest einen kurzen Text mit der
// Sprachausgabe des Handys vor (kostenlos, nichts geht nach außen). Blättert selbst weiter; Pause, Zurück, Weiter, Beenden.
// Während des Rundgangs ist die App gesperrt (nichts wird versehentlich angetippt). Stationen = Registry RUNDGANG:
// v = Ansicht (zeige), sel = Kandidaten (das erste sichtbare wird hervorgehoben; keins sichtbar → nur Text; mussSel → Station auslassen).
const RUNDGANG = [
  { v: "start", t: "👋 Willkommen", x: "Willkommen zum Rundgang durch die Köcheclub-App! In ein paar Minuten zeige ich dir, wie die App aussieht und was sie alles kann. Du musst nichts antippen – ich blättere selbst weiter. Mit Pause hältst du an." },
  { v: "start", sel: [".hero .kopfzeile"], puls: ["#v-start .kopfzeile .logo", "#modusKnopf", "#aktualisierenKnopf"], video: "anpassen", t: "🧑‍🍳 Der Kopf", x: "Ganz oben der Kopf der App. Die Kochmütze führt zur Internetseite des Clubs, darunter steht die Version. Rechts schaltest du zwischen hellen und dunklen Farben um oder frischst die App auf." },
  { v: "start", sel: ["#statusChip"], t: "🟢 Dein Status", x: "Hier stellst du deinen Status ein – zum Beispiel verfügbar oder im Urlaub. Die anderen Mitglieder sehen ihn bei deinem Namen." },
  { v: "start", sel: ["#infoLaufband", "#heroInfo"], t: "📣 Das Info-Laufband", x: "Im farbigen Infofeld läuft das Info-Laufband: Alle paar Sekunden kommt die nächste Meldung – zuerst das nächste Treffen, dazu was ansteht, zum Beispiel ein Dokument im Eingangskorb oder ein Geburtstag. Rot heißt: bitte erledigen. Fehlt deine Antwort zum Treffen noch, sagst du mit Zusagen gleich zu; der Knopf blinkt fünf Tage vorher gelb, zwei Tage vorher rot." },
  { v: "start", sel: ["#heroInfo .kacheln3", "#heroInfo"], puls: ["#heroInfo .kacheln3 > .mini"], t: "🔢 Drei kleine Felder", x: "Darunter drei kleine Felder: deine neuen Nachrichten, wie viele Mitglieder gerade in der App sind, und wie lange es noch bis zum nächsten Treffen ist. Antippen öffnet den passenden Bereich. Wischen im Laufband blättert, mit den Pfeilen kommst du zu weiteren Info-Karten." },
  { v: "start", sel: [".ansichtname.ein", ".ansichtname.erw"], t: "🔀 Zwei Ansichten", x: "Die App gibt es in zwei Ansichten: die einfache Ansicht mit wenigen großen Knöpfen – und die erweiterte Ansicht mit allen Funktionen. Hier schaltest du jederzeit um." },
  { v: "start", sel: ["#register"], puls: ['#register [data-r="verein"]', '#register [data-r="mein"]', '#register [data-r="programme"]'], mussSel: true, t: "🗂️ Die Register", x: "In der erweiterten Ansicht sortieren Register die Kacheln: Club – alles rund um den Verein. Meins – deine eigenen Sachen wie Dokumente, Erstattung und deine Daten. Technik – Programme, Sicherheits-Check und Hilfe. Hinten am Register steht, wie viele Kacheln darin sind. Steht dort zum Beispiel 10 von 12, sind 10 Kacheln sichtbar und 2 ausgeblendet – die kannst du jederzeit wieder einblenden." },
  { v: "start", sel: ["#raster"], kacheln: ["kommunikation", "termine", "pinnwand"], video: "oberflaeche", puls: ["#raster .kachel[data-id] > .zahl"], t: "🔲 Die Kacheln", x: "Jede Kachel öffnet einen Bereich. Auf manchen Kacheln steht oben in der Ecke eine Zahl: Sie zeigt, was auf dich wartet – zum Beispiel ungelesene Nachrichten, Termine, auf die du noch nicht geantwortet hast, oder offene Zettel an der Pinnwand. Hast du alles angesehen, verschwindet die Zahl. Hältst du eine Kachel lange gedrückt, kannst du die Kacheln umsortieren." }, // 2.275.0 KC-CLUB-VIDEO-ZAHLEN-2
  { v: "start", sel: ["#fuss"], puls: ["#fuss button"], t: "⬇️ Die Leiste unten", x: "Die Leiste unten ist immer da: Start, Termine, Nachrichten, Mitglieder und Mehr. Damit kommst du von überall mit einem Tipp zurück." },
  { v: "nachrichten", tippVor: `#fuss [onclick="zeige('nachrichten')"]`, sel: ["#v-nachrichten .kopf2", "#v-nachrichten"], video: "nachricht", t: "💬 Nachrichten", x: "Nachrichten: Hier schreibst du anderen Mitgliedern – einzeln oder in Gruppen, mit Fotos und Sprachnachrichten. Mit Plus Neu beginnst du eine Unterhaltung." },
  { v: "termine", tippVor: `#fuss [onclick="zeige('termine')"]`, sel: ["#v-termine .umschalter", "#v-termine .kopf2"], video: "zusagen", t: "📅 Termine", x: "Termine: alle Clubtermine als Liste, als Kalender oder als To-do. Mit Ich komme, Vielleicht oder Kann nicht antwortest du. Danach kannst du eine Mitfahrt suchen oder anbieten." },
  { v: "pinnwand", sel: ["#v-pinnwand .kopf2", "#v-pinnwand"], t: "📌 Pinnwand", x: "Die Pinnwand ist das schwarze Brett des Clubs. Mit Plus Zettel hängst du etwas für alle auf – Glückwünsche, Hinweise oder eine Bitte um Hilfe. Auf Zettel antwortest du mit einem Emoji." },
  { v: "mitglieder", tippVor: `#fuss [onclick="zeige('mitglieder')"]`, sel: ["#v-mitglieder .mg-kachel.mg-online", "#v-mitglieder .mg-kachel", "#v-mitglieder .kopf2"], t: "👥 Mitglieder", x: "Mitglieder: alle aktiven Clubmitglieder. Ein grüner Punkt heißt: gerade in der App. Von hier aus schreibst du, klopfst an oder rufst über die App an." },
  { v: "einstellungen", tippVor: `#fuss [onclick="zeige('einstellungen')"]`, sel: ["#v-einstellungen .kopf2", "#v-einstellungen"], video: "einstellungen", t: "⚙️ Mehr", x: "Unter Mehr findest du die Einstellungen: Benachrichtigungen, Töne, Farben und große Schrift. Hier kannst du auch diesen Rundgang jederzeit wieder starten." },
  { v: "start", sel: ["#raster"], kacheln: ["fotos", "archiv", "protokolle", "helfen", "spiele", "sos"], t: "✨ Und noch viel mehr", x: () => einfach() // 2.346.0: in der einfachen Ansicht gibt es die meisten dieser Kacheln nicht – Text passend zum Bild
    ? "Hier siehst du die Spiele – Schach, Bauernskat und Mensch ärgere dich nicht – und den SOS-Bereich für den Notfall. In der erweiterten Ansicht gibt es außerdem das Fotoalbum, das Archiv mit der Clubchronik, die Protokolle, Helfen und Leihen und die Erstattung von Auslagen."
    : "Außerdem gibt es hier im Club das Fotoalbum, das Archiv mit der Clubchronik, die Protokolle, Helfen und Leihen, Spiele wie Schach, Bauernskat und Mensch ärgere dich nicht – und den SOS-Bereich für den Notfall. Die Erstattung von Auslagen findest du unter Meins." },
  { v: "start", vor: () => { if (!einfach() && reg !== "programme") { const alt = reg; register("programme"); RG.zurueck.push(() => register(alt)); } }, // KC-CLUB-ERKLAERVIDEOS (2.244.0)
    sel: ['#raster .kachel[data-id="erklaer"]', "#hzFrage"], t: "🎬 Weitere Erklär-Videos", x: () => "Zu fast jedem Bereich gibt es ein eigenes Erklär-Video – nach Themen sortiert. Du kannst mehrere anhaken, dann laufen sie nacheinander. " + (einfach() ? "Du findest sie in Hilfe und Tipps – über das Fragezeichen unten rechts – und unter Mehr." : "Du findest sie im Register Technik unter Erklär-Videos – und in Hilfe und Tipps.") },
  { v: "start", sel: ["#hzFrage", "#suLupe"], video: "hilfe", t: "❓ Hilfe", x: "Und wenn du mal nicht weiterweißt: Das Fragezeichen unten rechts öffnet die Hilfe zum Bereich, die Lupe findet jede Funktion. Oder du fragst Twinkey – einfach tippen oder sprechen." },
  { v: "start", t: "🎉 Fertig", x: "Das war der Rundgang. Probier einfach alles aus – kaputt machen kannst du nichts. Viel Spaß mit der Köcheclub-App!" },
];
// ---------- KC-CLUB-ERKLAERVIDEOS (2.244.0, Wunsch Hansi „Teil 2: einzelne Möglichkeiten genau erklären – zuerst alle Einstellungen,
// dann Nachricht schreiben, Termin eintragen, Zettel anhängen, Vorschlag einreichen; Beispiele zeigen, z. B. ‚so sieht deine App jetzt aus‘“) ----------
// Registry RUNDGAENGE: jeder Eintrag ist ein „Erklär-Video“ (Rundgang mit Ton). Neue Videos = neuer Eintrag. Stationen wie RUNDGANG, dazu:
//   vor()  – vorbereiten (z. B. Bereich aufklappen, Formular mit Beispiel öffnen); nach() – wieder schließen (immer, auch bei ✕ Beenden)
//   demo   – vorübergehend zeigen, nichts speichern: { design: "kuechengruen" } / { nacht: true } / { gross: true }
//   sel    – CSS-Wähler oder Funktion, die das Element liefert. Es wird NIE etwas gesendet oder gespeichert.
const rgFeld = (id) => () => $(id)?.closest(".feld, .schalter, label") || $(id);
// KC-CLUB-ERKLAERVIDEOS-PULS (2.247.0, Wunsch Hansi): Knöpfe und Felder, die erwähnt werden, pulsieren nacheinander – man sieht sofort, was gemeint ist.
// Station: puls = [Wähler | Funktion → Element(e)]; ohne Liste pulst ein kleines Ziel selbst kurz. Wähler finden nur Sichtbares.
const rgOn = (teil, hoch) => () => { const e = [...document.querySelectorAll("[onclick]")].find((x) => x.getAttribute("onclick").includes(teil) && rgSichtbar(x)); return hoch && e ? e.closest(hoch) || e : e; };
function rgPulsStart(s) {
  rgPulsStop();
  let els = (s.puls || (s.kacheln || []).map(rgKachel)).flatMap((q) => { try { return typeof q === "function" ? [q()].flat().filter(Boolean) : [...document.querySelectorAll(q)]; } catch { return []; } }).filter(rgSichtbar);
  if (!els.length && RG.ziel && RG.ziel.getBoundingClientRect().height < 120) els = [RG.ziel];
  if (!els.length) return;
  const worte = String(rgText(s)).split(/\s+/).length, takt = Math.max(1300, Math.min(2600, ((2500 + worte * 400) / (els.length + 0.5)) | 0));
  let i = 0; const schritt = () => { if (!RG.an) return rgPulsStop(); els.forEach((e) => e.classList.remove("rg-puls")); const e = els[i++ % els.length]; void e.offsetWidth; e.classList.add("rg-puls"); };
  RG.pulsUhr = setTimeout(function los() { schritt(); RG.pulsUhr = setTimeout(los, takt); }, 500); // kurz nach dem Hinblättern beginnen
}
function rgPulsStop() { clearTimeout(RG.pulsUhr); document.querySelectorAll(".rg-puls").forEach((e) => e.classList.remove("rg-puls")); }
const rgKlappe = (name) => `#v-einstellungen details[data-klappe="${name}"]`;
// Bereich aufklappen und beim Ende wieder in den alten Zustand bringen (auch das gemerkte Auf/Zu)
function rgAuf(...namen) { for (const n of namen) { const d = document.querySelector(rgKlappe(n)); for (let x = d; x; x = x.parentElement?.closest("details")) if (!x.open) { const y = x; y.open = true; RG.zurueck.push(() => { y.open = false; }); } } } // 2.469.0: auch den Hauptbereich (KC-CLUB-EINST-GRUPPEN)
const rgDatum = (n) => tagPlus(heuteIso(), n);
const RG_EINSTELLUNGEN = [
  { v: "einstellungen", sel: ["#v-einstellungen .kopf2"], t: "⚙️ Alle Einstellungen", x: "In diesem Video zeige ich dir alle Einstellungen und was sie bedeuten. Du findest sie unten unter Mehr. Ein Tipp auf eine Überschrift klappt den Bereich auf und zu. Keine Sorge: Ich verstelle nichts – alles bleibt, wie du es eingestellt hast." },
  { v: "einstellungen", sel: [rgKlappe("einfach")], mussSel: true, vor: () => rgAuf("einfach"), t: "⚙️ Das Wichtigste", x: "In der einfachen Ansicht steht alles Wichtige in einem Bereich: wie du Neuigkeiten bekommst – aufs Handy, per E-Mail oder beides. Nicht stören, damit nachts kein Push kommt. Deine Lieblingsfarbe, große Schrift, das Fragezeichen für die Hilfe – und der Knopf, mit dem du alle Funktionen einschaltest." },
  { v: "einstellungen", sel: [rgKlappe("benachrichtigung")], mussSel: true, vor: () => rgAuf("benachrichtigung"), t: "🔔 Benachrichtigungen", x: "Benachrichtigungen: Push schaltet die Mitteilungen auf diesem Handy ein – auch wenn die App zu ist. Bei Nicht stören legst du eine Ruhezeit fest; Anrufe kommen trotzdem durch, danach gibt es eine Sammelmeldung. Und wer dich mit @ direkt anspricht, erreicht dich auf Wunsch auch dann." },
  { v: "einstellungen", sel: ["#designWahl", "#designWahlE"], mussSel: true, vor: () => rgAuf("darstellung", "einfach"), live: async (L) => { await L.warte(1800); await L.tipp(rgSichtbarer(`[onclick="designWaehlen('kuechengruen')"]`)); rgDemo({ design: "kuechengruen" }); }, video: "anpassen", t: "🎨 Farbe – so sieht's aus", x: "Unter Darstellung wählst du das Farbdesign. Schau mal: Ich stelle zum Ausprobieren Küchengrün ein. So sieht deine App jetzt aus! Es gibt viele weitere Farben, auch ausgefallene. Keine Sorge – gleich ist deine Farbe wieder da." },
  { v: "start", sel: ["#v-start .hero"], demo: { design: "kuechengruen" }, t: "🎨 Die Startseite in Küchengrün", x: "Und so sieht die Startseite in Küchengrün aus. Antippen genügt – die App färbt sich sofort um und merkt sich deine Wahl auf allen deinen Geräten." },
  { v: "einstellungen", sel: ["#modusWahl"], mussSel: true, vor: () => rgAuf("darstellung"), live: async (L) => { await L.warte(3500); await L.tipp('#modusWahl [data-m="nacht"]'); rgDemo({ nacht: true }); }, t: "🌗 Tag und Nacht", x: "Tag und Nacht: Automatisch wechselt die App nach Sonnenstand. Oder immer hell, oder immer dunkel. So sieht der Nachtmodus aus – angenehm am Abend. Umschalten geht auch oben auf der Startseite mit dem Mond." },
  { v: "einstellungen", sel: [rgFeld("setGross"), rgFeld("setGrossE")], mussSel: true, vor: () => rgAuf("darstellung", "einfach"), live: async (L) => { await L.tipp(rgSichtbarer("#setGross, #setGrossE")); rgDemo({ gross: true }); }, t: "🔠 Große Schrift", x: "Große Schrift macht alle Texte und Knöpfe größer – so wie jetzt. Gut, wenn man ohne Brille liest." },
  { v: "einstellungen", sel: [rgKlappe("darstellung")], mussSel: true, vor: () => rgAuf("darstellung"), t: "🎨 Weiteres zur Darstellung", x: "Außerdem in der Darstellung: Chat-Farben ändern deine Sprechblasen und den Hintergrund in allen Chats. Der Sparmodus hilft bei schwachem Netz oder älteren Handys – dann ist alles ruhiger. Und das Warte-Bild ist das, was beim Laden erscheint." },
  { v: "einstellungen", sel: [rgKlappe("effekte")], mussSel: true, vor: () => rgAuf("effekte"), video: "effekte", t: "✨ Effekte", x: "Effekte machen die App lebendig: Jahreszeiten im Kopf wie Herbstlaub oder Schnee, ein Effekt beim Wechsel der Register und beim Senden – zum Beispiel Papierflieger oder Brieftaube –, Kacheln umdrehen per Doppeltipp und der Reißwolf beim Löschen. Alles ist einzeln abschaltbar." },
  { v: "einstellungen", sel: [rgKlappe("ansagen")], mussSel: true, vor: () => rgAuf("ansagen"), t: "🗣️ Tipps & Hilfe", x: "Ansagen, Töne und Tipps, Teil eins – die Hilfen: der Tipp des Tages, was neu ist, und das Fragezeichen unten rechts. Viel Hilfe schaltet alles auf einmal ein. Die Schritt-Unterstützung zeigt mit rotem Rahmen, was als Nächstes kommt, und die Einweisung erklärt jeden Bereich beim ersten Öffnen." },
  { v: "einstellungen", sel: [rgKlappe("ansagen")], mussSel: true, vor: () => rgAuf("ansagen"), video: "sprache", t: "🎙️ Sprache & Ansagen", x: "Teil zwei – Sprache: Mit der Sprachsteuerung sagst du, was du tun möchtest – zum Beispiel Nachricht an Klaus. Das Handy kann ansagen, wer online kommt, und neue Nachrichten vorlesen. Und das Mikrofon im Chat nimmt Sprachnachrichten auf oder schreibt mit." },
  { v: "einstellungen", sel: [rgKlappe("privat")], mussSel: true, vor: () => rgAuf("privat"), t: "🔒 Privatsphäre – was andere sehen", x: "Privatsphäre, Teil eins: Ob andere deinen Geburtstag sehen – nur Tag und Monat. Ob die Clubleitung bei runden Geburtstagen dein Alter sehen darf. Ob andere sehen, wann du zuletzt da warst – und ob du gerade online bist. Wichtig: Wer das ausschaltet, sieht es auch bei den anderen nicht." },
  { v: "einstellungen", sel: [rgKlappe("privat")], mussSel: true, vor: () => rgAuf("privat"), t: "🔒 Privatsphäre – Spiele & Kontakt", x: "Teil zwei: Ob andere dich zu Spielen herausfordern dürfen, und ob die Spiel-Einladung beim Start kommt. Ob andere bei dir anklopfen dürfen. Ob andere live sehen, was du gerade tippst. Und welche Kontaktdaten andere Mitglieder sehen: Handynummer, Festnetz, E-Mail, Adresse und dein Notfallkontakt." },
  { v: "einstellungen", sel: [rgKlappe("handykalender")], mussSel: true, vor: () => rgAuf("handykalender"), t: "📆 Termine im Handy-Kalender", x: "Termine im Handy-Kalender: Einmal verbinden – dann stehen alle Sitzungen, Veranstaltungen, Aktionen und freigegebenen Geburtstage automatisch in deinem normalen Kalender und bleiben aktuell." },
  { v: "einstellungen", sel: [rgKlappe("schnellstart")], mussSel: true, vor: () => rgAuf("schnellstart"), t: "⚡ Schnellstart", x: "Schnellstart: eine große Kachel auf der Startseite mit bis zu acht Symbolen – ein Tipp, und es geht sofort los. Du bestimmst, welche Symbole darauf sind." },
  { v: "einstellungen", sel: [rgKlappe("startseite")], mussSel: true, vor: () => rgAuf("startseite"), video: "oberflaeche", t: "🧩 Startseite & Ansicht", x: "Startseite und Ansicht: Die Rollkartei blättert lange Listen wie Karteikarten. Beim Countdown oben wählst du, was mitläuft. Und hier wechselst du zwischen einfacher und erweiterter Ansicht und ordnest die Kacheln – wie das geht, zeigt das Video Oberfläche nach Wunsch." },
  { v: "einstellungen", sel: [rgKlappe("install")], mussSel: true, vor: () => rgAuf("install"), t: "📲 App-Installation", x: "Hier steht Schritt für Schritt, wie du die App richtig installierst – auf Android, iPhone, Tablet oder PC." },
  { v: "einstellungen", t: "✅ Fertig", x: "Das waren alle Einstellungen. Deine eigenen Einstellungen sind unverändert – probier in Ruhe aus, was dir gefällt. Weitere Erklär-Videos findest du im Register Technik und in Hilfe und Tipps." },
];
const RG_NACHRICHT = [
  { v: "nachrichten", sel: ["#v-nachrichten .kopf2 .knopf.haupt"], t: "💬 Neue Nachricht", x: "So schreibst du eine neue Nachricht: In Nachrichten tippst du oben rechts auf Plus Neu." },
  { v: "neu", tippVor: "#v-nachrichten .kopf2 .knopf.haupt", vor: () => { empfWahl = { personen: [], aemter: [], alle: false, vorstand: false }; $("neuBetreff").value = ""; $("empfSuche").value = "";
      (MITGLIEDER ? Promise.resolve() : mitgliederHolen()).then(() => empfListe()).catch(() => {}); neuGruppenZeigen("neuGruppen", true); },
    sel: ["#empfWahlBereich"], puls: ["#schnellEmpf", "#empfSuche", "#neuGruppen .knopf"], t: "👤 An wen?", x: "Jetzt wählst du, an wen die Nachricht geht. Oben die Schnellwahl: alle, die gerade online sind, alle Mitglieder oder ein Amt wie den Clubsprecher. Darunter suchst du einen Namen – zum Beispiel Anne – und hakst ihn an; auch mehrere gehen. Deine Gruppen stehen ganz oben – antippen, und du schreibst direkt hinein." },
  { v: "neu", sel: [rgFeld("neuBetreff")], puls: ["#neuBetreff", rgOn("neuWeiter()")], t: "✏️ Betreff", x: "Ein Betreff ist freiwillig – praktisch bei Gruppen. Schreibst du nur einer Person und ohne Betreff, geht es gleich in euren bisherigen Chat. Mit Betreff beginnt ein eigener Chat zu diesem Thema. Dann tippst du auf Weiter zum Schreiben." },
  { v: "neu", tippVor: rgOn("neuWeiter()"), vor: () => { $("eingabe").classList.remove("versteckt"); RG.zurueck.push(() => { if (aktuelleAnsicht !== "chat") $("eingabe").classList.add("versteckt"); }); },
    sel: ["#eingabe"], puls: ["#eingabe textarea", '#eingabe [title="Senden"]', '#eingabe [title="Anlage"]', '#eingabe [title^="Mikrofon"]', '#eingabe [title="Emoji einfügen"]', '#eingabe [title^="Wie benachrichtigen"]', "#versandLeiste", '#eingabe [title^="Nachricht löscht"]', '#eingabe [title="Mit WhatsApp senden"]', "#spaeterKnopf"], t: "⌨️ Schreiben und senden", x: "Unten schreibst du deine Nachricht, der Pfeil sendet sie. Sobald du schreibst, steht darüber der Versand: Normal ist schon angehakt – du kannst stattdessen Wichtig oder Express anhaken, auch beides. Unter dem Feld: die Büroklammer für Fotos und Dateien, das Mikrofon für eine Sprachnachricht oder zum Diktieren, Emojis, die Glocke – wie benachrichtigt wird, zum Beispiel per Push oder E-Mail – und die Sanduhr für eine Nachricht, die sich selbst löscht. Mit WA geht sie auch über WhatsApp." },
  // 2.396.0 KC-CLUB-HILFE-NEUHEITEN: Express mit Zähler, Später senden, Zurückholen, Favoriten
  { v: "neu", sel: ["#expressKnopf"], t: "🏎️ Express", x: "Eilt es wirklich? Dann hakst du über dem Schreibfeld Express an: Die Nachricht kommt sofort an – auch nachts. Unter deiner Nachricht siehst du später, wann sie angekommen ist und wann sie gelesen wurde. Pro Tag gehen fünf Express-Sendungen. Neben Express steht, wie viele du heute schon hattest – zum Beispiel zwei von fünf." },
  { v: "neu", sel: ["#spaeterKnopf"], t: "⏰ Später senden", x: "Mit dem Wecker schickst du die Nachricht später – zum Beispiel morgen früh um acht, oder jeden Montag. Und hast du dich vertippt: Solange noch niemand die Nachricht gelesen hat, tippst du sie an und holst sie mit Zurückholen und ändern wieder in dein Schreibfeld." },
  { v: "nachrichten", sel: ["#v-nachrichten .kom-leiste"], puls: ["#v-nachrichten .kom-leiste .knopf"], t: "👥 Gruppe & mehr", x: "Mit Gruppe legst du eine eigene Gruppe an, zum Beispiel fürs Küchenteam. Gemerkt zeigt Nachrichten, die du dir mit dem Stern gemerkt hast. Mit dem Stern Favoriten siehst du nur deine Lieblings-Chats: In Mitglieder beim Mitglied auf den Stern tippen – oder hier rechts am Chat auf die drei Punkte tippen und Als Favorit wählen. Es ist derselbe Stern. Dazu kommen automatisch die fünf Chats, in denen du am meisten schreibst. Und Test schickt dir selbst eine Probe – so prüfst du, ob Push und E-Mail ankommen." },
  // 2.671.0 KC-CLUB-HILFE-NACHTRAG-5: „Wie verschicken?“ – nur ein Beispielbild, es wird nichts gesendet
  { v: "nachrichten", vor: () => rgSim(`<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin:0 0 8px">📤 Wie verschicken?</h3>
      <div class="hl-chips" style="flex-wrap:wrap">${VW_ARTEN.map(([k, t]) => `<span class="chip${k === "eingestellt" ? " an" : ""}" data-s="${k}">${t}</span>`).join("")}</div>
      <p class="hinweis" style="margin:10px 0" data-s="was">✉️ 15 bekommen eine E-Mail mit Anhang · 🔔 Push nach Einstellung</p><span class="knopf haupt" data-s="los">📤 Jetzt senden</span></div></div>`, "ueber"),
    nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="mail"]', '#rgSim [data-s="app"]', '#rgSim [data-s="was"]', '#rgSim [data-s="los"]'], t: "📤 Wie verschicken?",
    x: "Schreibst du an mehrere oder hängst etwas an, geht die Nachricht so raus, wie du es in den Einstellungen festgelegt hast – ohne Nachfrage. Die Wege sind: nur E-Mail, dann hängen Fotos und Dateien an der Mail, nur Push, WhatsApp, alles, nur in der App oder wie jeder es eingestellt hat. Über dem Schreibfeld zeigt das Feld mit dem Briefkasten, wie es rausgeht; antippen ändert es nur für diese Nachricht oder merkt es für den Chat. Wer lieber jedes Mal gefragt wird, bekommt dieses Fenster." },
  { v: "nachrichten", t: "✅ Fertig", x: "Das war's: Plus Neu, Empfänger wählen, schreiben, senden. Probier es aus – zum Beispiel mit einer Nachricht an dich selbst über Test." },
];
const RG_TERMIN = [
  { v: "termine", sel: ["#neuTreffenKnopf"], t: "📅 Neuer Termin", x: "So trägst du einen Termin ein: In Termine tippst du oben rechts auf Plus Neu." },
  { v: "termine", tippVor: "#neuTreffenKnopf", vor: () => { neuWahlFenster("＋ Neu bei Termine", [{ sym: "📅", t: "Privater Termin", u: "nur für dich sichtbar", los: () => {} },
      { sym: "📨", t: "Terminanfrage", u: "Einzelne, mehrere oder eine Gruppe fragen – Ja / Vielleicht / Nein", los: () => {} }]); $("neuWahlBlatt")?.classList.add("rg-zeigen"); RG.zurueck.push(() => $("neuWahlBlatt")?.remove()); },
    nach: () => $("neuWahlBlatt")?.remove(), sel: ["#neuWahlBlatt .wahl"], t: "📋 Was möchtest du?", x: "Jetzt wählst du: Ein privater Termin – den siehst nur du. Oder eine Terminanfrage: Damit fragst du einzelne Mitglieder oder eine Gruppe, ob sie Zeit haben – sie antworten mit Ja, Vielleicht oder Nein." },
  { v: "termine", tippVor: "#neuWahlBlatt .wahl button", vor: () => { if (!$("ptTitel")) { privatForm({ titel: "Zahnarzt", _datum: rgDatum(5), _zeit: "10:30" }); RG.zurueck.push(() => $("treffenForm")?.classList.add("versteckt")); } },
    sel: ["#treffenForm"], puls: ["#ptTitel", "#ptDatum", "#ptZeit", "#ptBisDatum", "#ptGanz", "#ptOrt", "#ptNotiz"], t: "✏️ Das Formular", x: "Im Formular trägst du ein: den Titel – zum Beispiel Zahnarzt –, Datum und Uhrzeit, auf Wunsch bis wann, oder ganztägig. Dazu Ort und eine Notiz, wenn du magst." },
  { v: "termine", vor: () => { if (!$("ptTitel")) privatForm({ titel: "Zahnarzt", _datum: rgDatum(5), _zeit: "10:30" }); }, sel: [rgFeld("ptWdh")], t: "🔁 Wiederholen", x: "Bei Wiederholen wählst du zum Beispiel jede Woche oder jeden Monat – dann trägst du den Termin nur einmal ein." },
  { v: "termine", vor: () => { if (!$("ptTitel")) privatForm({ titel: "Zahnarzt", _datum: rgDatum(5), _zeit: "10:30" }); if ($("ptStart")) $("ptStart").checked = true; }, sel: [rgFeld("ptStart")], t: "📌 Auf der Startseite", x: "Mit dem Häkchen Auf der Startseite läuft der Termin oben im Countdown mit – zum Beispiel: noch 5 Tage bis zum Zahnarzt." },
  { v: "termine", vor: () => { if (!$("ptTitel")) privatForm({ titel: "Zahnarzt", _datum: rgDatum(5), _zeit: "10:30" }); }, sel: [rgFeld("ptErinnerung")], t: "⏰ Erinnerung", x: "Bei Erinnerung wählst du, wann dich das Handy vorher erinnert – zum Beispiel einen Tag vorher. Zum Schluss tippst du auf Speichern. Hier speichere ich nichts – das Beispiel verschwindet gleich wieder." },
  { v: "termine", vor: () => $("treffenForm")?.classList.add("versteckt"), sel: ["#v-termine .antworten", "#v-termine .umschalter"], video: "zusagen", t: "✅ Zu- und absagen", x: "Bei Club-Terminen antwortest du mit Ich komme, Vielleicht oder Kann nicht. Nochmal antippen nimmt die Antwort zurück. Oben wechselst du zwischen Liste, Kalender und To-do." },
  { v: "termine", t: "✅ Fertig", x: "So einfach ist das: Plus Neu, ausfüllen, speichern. Deine privaten Termine siehst nur du." },
];
const RG_PINNWAND = [
  { v: "pinnwand", sel: ["#pwNeuKnopf"], t: "📌 Zettel anhängen", x: "So hängst du einen Zettel an die Pinnwand: oben rechts auf Plus Zettel tippen." },
  { v: "pinnwand", tippVor: "#pwNeuKnopf", vor: () => { if ($("pwForm").classList.contains("versteckt")) { pwForm(true); $("pwText").blur(); RG.zurueck.push(() => { $("pwText").value = ""; pwForm(false); }); } $("pwText").value = "Wer hilft am Samstag beim Aufbau? 🙂"; pwZaehlen(); },
    sel: [rgFeld("pwText")], puls: ["#pwText", "#pwZaehler", () => $("pwText")?.closest(".feld")?.querySelector(".diktat-feld")], t: "✏️ Kurze Nachricht", x: "Schreib eine kurze Nachricht – höchstens 200 Zeichen, zum Beispiel: Wer hilft am Samstag beim Aufbau? Mit dem Mikrofon kannst du auch diktieren." },
  { v: "pinnwand", sel: ["#pwWichtig"], puls: ["#pwWichtig button"], t: "❗ Wie wichtig?", x: "Normal oder Hoch: Ein wichtiger Zettel erscheint bei allen beim Öffnen der App." },
  { v: "pinnwand", sel: ["#pwFuer"], puls: ["#pwFuer button"], t: "👥 Für wen?", x: "Für wen ist der Zettel? Nur für dich – als Merkzettel –, für alle, oder für bestimmte Mitglieder, die du auswählst." },
  { v: "pinnwand", sel: ["#pwAntwZeile"], t: "✍️ Antworten erlauben", x: "Und ob andere direkt auf deinen Zettel antworten können." },
  { v: "pinnwand", sel: ["#pwSpeichernKnopf"], t: "📌 Anheften", x: "Mit Anheften hängt der Zettel an der Pinnwand. Ich hefte hier nichts an – das Beispiel verschwindet gleich wieder." },
  { v: "pinnwand", vor: () => { $("pwText").value = ""; pwForm(false); }, t: "✅ Fertig", x: "Auf die Zettel der anderen antwortest du mit einem Emoji. Probier es aus – zum Beispiel mit einem Merkzettel nur für dich." },
];
const RG_VORSCHLAG = [
  { v: "vorschlaege", sel: ["#vorschlagNeuKnopf"], t: "🗳️ Vorschlag einreichen", x: "Du hast eine Idee für den Club? In Vorschläge tippst du oben rechts auf Plus Neu." },
  { v: "vorschlaege", tippVor: "#vorschlagNeuKnopf", vor: () => { vorschlagForm("thema"); $("vfTitel").value = "Grillabend im Mai"; RG.zurueck.push(() => $("vorschlagForm")?.classList.add("versteckt")); },
    sel: ["#vorschlagForm .artwahl"], puls: ["#vorschlagForm .artwahl button"], t: "💡 Was für ein Vorschlag?", x: "Zuerst wählst du die Art: ein Thema für die Sitzung oder ein Spendenprojekt." },
  { v: "vorschlaege", vor: () => { if ($("vfTitel") && !$("vfTitel").value) $("vfTitel").value = "Grillabend im Mai"; }, sel: [rgFeld("vfTitel")], puls: ["#vfTitel", "#vfBeschr"], t: "✏️ Thema", x: "Dann das Thema, zum Beispiel Grillabend im Mai – und wenn du magst, eine Beschreibung darunter." },
  { v: "vorschlaege", sel: [rgFeld("vfTreffen")], t: "📅 Für welchen Termin?", x: "Hier wählst du, auf welcher Sitzung darüber gesprochen werden soll – oder allgemein." },
  { v: "vorschlaege", sel: [rgFeld("vfInfo")], puls: ["#vfInfo", () => $("vorschlagForm")?.querySelector(".knopf.haupt[onclick^='vorschlagSpeichern']")], t: "📨 Abschicken", x: "Clubsprecher und Kassenwart bekommen Bescheid. Mit Vorschlagen schickst du ihn ab – ich schicke hier nichts ab." },
  { v: "vorschlaege", vor: () => $("vorschlagForm")?.classList.add("versteckt"), t: "✅ Fertig", x: "Die anderen sehen deinen Vorschlag und können abstimmen. So einfach bringst du deine Ideen in den Club." },
];
// KC-CLUB-ERKLAERVIDEOS-ROLLEN (2.245.0, Wunsch Hansi „nichts von Admin-Funktionen erklären oder zeigen; eigene Videos für die Clubleitung
// (Büro, Einstellungen nur für die Leitung) und für Admin-Funktionen“): ziel = "alle" | "leitung" | "admin". Während eines Videos für alle
// sind Admin- und Leitungs-Elemente ausgeblendet (rgRollenAnsicht), die Leitungs-/Admin-Videos sieht nur, wer die Rolle hat.
const RG_LEITUNG = [
  { v: "buero", nur: () => !!ICH?.buero, vor: () => { if (!buRaumAn()) { lsSetzen(BU_ANSICHT, "raum"); RG.zurueck.push(() => { lsSetzen(BU_ANSICHT, "liste"); if (aktuelleAnsicht === "buero") buZeigen(); }); buZeigen(); } },
    sel: ["#v-buero .bu-gruss", "#buInhalt"], t: "🗂️ Das Büro", x: "Dieses Video ist nur für die Clubleitung. Im Büro erledigst du die Club-Arbeit. Oben: die Tages-Übersicht, der Wechsel zwischen Raum und Liste – und die Sprachsteuerung. Sag zum Beispiel: Öffne Ordner Protokolle." },
  { v: "buero", nur: () => !!ICH?.buero, sel: ["#v-buero .bu-regal", "#buInhalt"], t: "📚 Das Regal", x: "Im Regal stehen die Ordner – von Sitzung, Protokollen und Freud und Leid über Mitglieder, Adressbuch und Briefe bis zu Chronik und Archiv. Antippen schlägt einen Ordner auf." },
  { v: "buero", nur: () => !!ICH?.buero, sel: ["#v-buero .bu-zettelreihe", "#buInhalt"], t: "📝 Nächster Schritt", x: "Auf dem Schreibtisch sagt dir der Zettel Nächster Schritt, was als Nächstes dran ist – zum Beispiel Sitzung vorbereiten, Einladung senden oder Mitglieder erinnern. Daneben siehst du, was im Eingang wartet." },
  { v: "buero", nur: () => !!ICH?.buero, sel: ["#v-buero .bu-korb", "#buInhalt"], t: "📥 Eingangskorb", x: "Im Eingangskorb liegt alles, was auf euch wartet: Erstattungen, gemeldete Dienstzeiten, Vorschläge und Änderungen der Mitglieder. Es bleibt dort, bis es erledigt ist." },
  { v: "buero", nur: () => !!ICH?.buero, sel: ["#v-buero .bu-fueller", "#buInhalt"], t: "✒️ Schreiben", x: "Mit dem Füller schreibst du: einen Brief mit Briefkopf, die Einladung zur Sitzung, ein Protokoll, eine Nachricht an Mitglieder, ein Schild, einen Glückwunsch oder einen Zettel an die Pinnwand." },
  { v: "buero", nur: () => !!ICH?.buero, sel: ["#v-buero .bu-dinge", "#buInhalt"], t: "☎️ Telefon, Post & Drucker", x: "Das Telefon ruft Mitglieder an, die Post schickt Nachricht und E-Mail, der Kalender zeigt die nächste Sitzung, der Drucker druckt Vorlagen und Listen, und mit Einlesen scannst du Unterlagen ins Archiv." },
  { v: "termine", vor: () => { termineNeuWahl(); $("neuWahlBlatt")?.classList.add("rg-zeigen"); RG.zurueck.push(() => $("neuWahlBlatt")?.remove()); }, nach: () => $("neuWahlBlatt")?.remove(),
    sel: ["#neuWahlBlatt .wahl"], t: "📅 Termine für alle", x: "In Termine kannst du als Clubleitung Termine für alle eintragen – Sitzungen und Veranstaltungen. Außerdem die Live-Abstimmung auf der Sitzung und die Terminfindung, bei der alle über mehrere Termine abstimmen." },
  { v: "vorschlaege", vor: () => { vorschlagForm("abstimmung"); RG.zurueck.push(() => $("vorschlagForm")?.classList.add("versteckt")); }, nach: () => $("vorschlagForm")?.classList.add("versteckt"),
    sel: ["#vorschlagForm"], t: "🗳️ Abstimmung", x: "Bei Vorschlägen startest du eine Abstimmung: Frage und Antworten eingeben, auf Wunsch geheim und mit Frist, und wählen, wer abstimmen darf – alle, eine Gruppe oder eine Auswahl." },
  { v: "einstellungen", sel: [rgKlappe("leitung_start")], mussSel: true, vor: () => rgAuf("leitung_start"), t: "⚙️ Einstellungen der Clubleitung", x: "In den Einstellungen gibt es für dich den Bereich Clubleitung beim Start: eine Tages-Übersicht mit Eingang, Aufgaben, Geburtstagen und nächster Sitzung – und ein Hinweis, wenn viel im Eingangskorb liegt." },
  { v: "einstellungen", t: "✅ Fertig", x: "Das war das Video für die Clubleitung. Probier das Büro in Ruhe aus – angezeigt und gedruckt wird nur, was du darfst." },
];
const RG_ADMIN = [
  { v: "start", nur: () => !einfach(), vor: () => { if (!einfach() && reg !== "admin") { const alt = reg; register("admin"); RG.zurueck.push(() => register(alt)); } }, sel: ["#register"], t: "🛠️ Das Admin-Register", x: "Dieses Video ist nur für Admins. Im Register Admin steht dein Leitstand: kleine Kacheln mit Lämpchen – grün gut, gelb aufpassen, rot Problem, grau unbekannt. Grau ist nie in Ordnung." },
  { v: "start", nur: () => einfach(), t: "🛠️ Erweiterte Ansicht", x: "Dieses Video ist nur für Admins. Das Admin-Register gibt es nur in der erweiterten Ansicht. Schalte unter Mehr auf alle Funktionen um – dann siehst du es neben Club, Meins und Technik." },
  { v: "start", sel: ['#raster .kachel[data-id="ad-alarm"]'], mussSel: true, t: "🚨 Notfall", x: "Ganz vorn die Notfall-Kacheln: Alarm an alle schickt sofort eine Meldung an alle Mitglieder, und Notfall bündelt alle Werkzeuge für den Ernstfall. Im Ernstfall zuerst Notfall öffnen." },
  { v: "start", sel: ['#raster .kachel[data-id="ad-lage"]'], mussSel: true, t: "📊 Überwachung", x: "Lage zeigt alles auf einen Blick. Dazu Server, Supabase – mit dem Neustart-Knopf –, Neon-Spiegel, Backups, B2-Backup, Notbetrieb und die direkte Leitung." },
  { v: "start", sel: ['#raster .kachel[data-id="ad-comm"]'], mussSel: true, t: "📨 Dienste", x: "Die Dienste: Communicator, Mail über Brevo, Push, die Kasse mit dem Gateway und die KC-Programme. Jede Kachel öffnet Einzelheiten und die passenden Werkzeuge." },
  { v: "start", sel: ['#raster .kachel[data-id="ad-versionen"]'], mussSel: true, t: "📱 App", x: "Zur App: die Versionen der Mitglieder, Fehler, Nutzung, Zugänge, Wartung, Freigaben für neue Funktionen, Inkognito und die Stadt-Termine. Am Ende Direktsprünge in die Verwaltung der Anbieter – angemeldet wird dort." },
  { v: "start", sel: ["#v-start .statusleiste"], t: "💡 Lämpchen oben", x: "Oben in der Statusleiste siehst nur du die Lämpchen für Verbindung, Communicator, Datenverkehr und wer online ist, dazu das Herz mit den letzten Lebenszeichen und die Brille für Inkognito." },
  { v: "einstellungen", sel: ["#adminBereich"], mussSel: true, vor: () => rgAuf("admin"), t: "⚙️ Admin-Einstellungen", x: "In den Einstellungen gibt es den Bereich Admin-Einstellungen: Erinnerung an alte Zettel an der Pinnwand, Schnellantworten für Anrufe, Tipps nach und nach für den Einstieg, der Kilometer-Satz für Erstattungen und Ort und Wetter-App." },
  { v: "einstellungen", t: "✅ Fertig", x: "Das war das Admin-Video. Das Admin-Register und diese Einstellungen sehen nur Admins – in den Videos für alle Mitglieder kommen sie nicht vor." },
];
// KC-CLUB-ERKLAERVIDEOS-3 (2.247.0, Wunsch Hansi „weitere schöne, logische Erklär-Videos“): Mitglieder, Zu-/Absagen, Fotos, Erstattung,
// Hilfe & Twinkey, SOS, Helfen & Leihen. Nur zeigen und erklären – es wird nichts angerufen, gesendet, hochgeladen oder gespeichert.
const rgTreffenZeigen = (n = 0) => { if ($("treffenInfo") || !RG.an) return; const k = document.querySelector("#v-termine .tr-kachel"), id = /treffenInfo\('([^']+)'/.exec(k?.getAttribute("onclick") || "")?.[1];
  if (!id) { if (n < 16) setTimeout(() => rgTreffenZeigen(n + 1), 250); return; } // Terminliste lädt noch – kurz warten
  treffenInfo(id, false); $("treffenInfo")?.classList.add("rg-zeigen"); RG.zurueck.push(() => $("treffenInfo")?.remove());
  setTimeout(() => { if (!RG.an) return; RG.ziel = rgZiel(RG.st[RG.i]) || RG.ziel; rgHin(); rgLage(); rgPulsStart(RG.st[RG.i]); }, 120); };
const RG_MITGLIEDER = [
  { v: "mitglieder", sel: [() => $("v-mitglieder")?.querySelector(".zk")?.parentElement], puls: ["#v-mitglieder .zk"], t: "👥 Mitglieder anzeigen", x: "In Mitglieder siehst du alle aktiven Clubmitglieder. Oben wählst du die Ansicht – Kacheln oder Liste – und ob alle angezeigt werden oder nur die, die gerade online sind." },
  { v: "mitglieder", sel: ["#v-mitglieder .mg-kachel.mg-online", "#v-mitglieder .mg-kachel"], t: "🪪 Die Kachel", x: "Jede Kachel zeigt Bild, Name, Amt und Status – zum Beispiel verfügbar oder im Urlaub. Ein grüner Punkt heißt: gerade in der App. Antippen öffnet Telefon, Adresse und mehr – so weit das Mitglied es freigegeben hat." },
  { v: "mitglieder", sel: ["#v-mitglieder .mg-kachel.mg-online .mg-knoepfe", "#v-mitglieder .mg-knoepfe"], puls: [() => [...(document.querySelector("#v-mitglieder .mg-kachel.mg-online .mg-knoepfe, #v-mitglieder .mg-knoepfe")?.children || [])]],
    t: "📞 Schreiben, anklopfen, anrufen", x: "Darunter die Knöpfe: Die Sprechblase schreibt eine Nachricht. Die Hand klopft an. Der Hörer ruft über die App an – und die Kamera mit Bild. Anklopfen und Anrufen geht, wenn das Mitglied gerade online ist. Beim Anklopfen wählst du: schreiben oder sprechen. Ist die Hand blass, geht es gerade nicht – antippen sagt dir warum." },
  { v: "mitglieder", sel: [rgOn("mgGruppeSetzen", ".knoepfe, div")], mussSel: true, puls: [() => [...document.querySelectorAll("#v-mitglieder [onclick^='mgGruppe']")].filter(rgSichtbar)], t: "🍳 Gruppen", x: "Mit den Gruppen-Knöpfen zeigst du nur eine Gruppe – zum Beispiel das Küchenteam. Übersicht zeigt alle Gruppen auf einen Blick." },
  { v: "mitglieder", sel: ["#meinStatusKnopf"], video: "status", t: "🟢 Dein Status", x: "Und oben rechts stellst du deinen eigenen Status ein – so wissen die anderen, ob du gerade erreichbar bist." },
  { v: "mitglieder", t: "✅ Fertig", x: "So findest du jeden im Club: anschauen, schreiben, anklopfen oder anrufen." },
];
const RG_ZUSAGEN = [
  { v: "termine", sel: ["#v-termine .tr-kachel", "#v-termine .kopf2"], t: "📅 Ein Termin", x: "In Termine stehen alle Clubtermine. Tippst du einen Termin an, öffnen sich alle Einzelheiten." },
  { v: "termine", tippVor: "#v-termine .tr-kachel", vor: () => rgTreffenZeigen(), sel: ["#treffenInfo .antworten", "#treffenInfo"], puls: ["#treffenInfo .antworten button"], t: "✅ Zu- oder absagen", x: "Hier antwortest du: Ich komme, Vielleicht oder Kann nicht. Nochmal antippen nimmt die Antwort zurück. Solange du nicht geantwortet hast, blinkt der Hinweis auf der Startseite." },
  { v: "termine", vor: () => rgTreffenZeigen(), sel: [rgOn("mfSuchenFragen", ".knoepfe")], puls: [rgOn("mfSuchenFragen"), rgOn("mitfahrtAnbieten")], t: "🚗 Mitfahren", x: "Du suchst eine Mitfahrgelegenheit – oder bietest eine an. Wer passt, bekommt Bescheid." },
  { v: "termine", vor: () => rgTreffenZeigen(), sel: [rgOn("inKalender(")], t: "📲 In den Kalender", x: "Mit In meinen Kalender kommt der Termin in den Kalender deines Handys. Noch bequemer: Mit dem Handy-Knopf oben in den Terminen verbindest du deinen Kalender einmal – dann kommen alle Termine von selbst." },
  { v: "termine", vor: () => $("treffenInfo")?.remove(), sel: [() => $("v-termine")?.querySelector(".zk")], t: "🗓️ Liste, Kalender, To-do", x: "Oben wechselst du die Ansicht: Liste, Kalender oder To-do. Im Kalender siehst du den ganzen Monat auf einen Blick." },
  { v: "termine", t: "✅ Fertig", x: "Kurz zusagen hilft der Planung – und du wirst nicht unnötig erinnert." },
];
const RG_FOTOS = [
  { v: "fotos", sel: ["#v-fotos .kopf2 .knopf.haupt"], t: "📷 Fotoalbum", x: "Im Fotoalbum stehen die Bilder aus dem Clubleben. Mit Plus Neu lädst du eigene Fotos hoch." },
  { v: "fotos", tippVor: "#v-fotos .kopf2 .knopf.haupt", vor: () => { if ($("fotoForm").classList.contains("versteckt")) { fotoForm(); RG.zurueck.push(() => $("fotoForm")?.classList.add("versteckt")); } }, sel: ["#fotoForm"],
    puls: [rgOn("faGalerie"), () => [...document.querySelectorAll("#fotoForm .knoepfe .knopf.haupt")][1], "#faThema", "#faAnlass"], t: "🖼️ Fotos hinzufügen", x: "Du wählst Bilder aus der Galerie oder machst sie gleich mit der Kamera. Dazu ein Thema und, wenn du magst, den Anlass – dann Hochladen. Hier lade ich nichts hoch." },
  { v: "fotos", vor: () => $("fotoForm")?.classList.add("versteckt"), sel: ["#fotoFilter", "#fotoListe"], puls: ["#fotoFilter select", rgOn("faWaehlen(")], t: "🔎 Suchen & Alben", x: "Oben filterst du nach Thema, Jahr oder Anlass. Mit Auswählen hakst du Bilder an und legst sie in ein eigenes Album – zum Beispiel Weihnachtsmarkt." },
  { v: "fotos", t: "✅ Fertig", x: "Ein Foto antippen zeigt es groß – dort kannst du blättern, es teilen oder speichern." },
];
const RG_ERSTATTUNG = [
  { v: "erstattung", sel: [rgOn("erstattungArt(", "div")], puls: [() => [...document.querySelectorAll("#v-erstattung [onclick^='erstattungArt']")].filter(rgSichtbar)], t: "💶 Was hast du ausgelegt?", x: "Hier bekommst du Geld zurück, das du für den Club ausgelegt hast. Zuerst die Art: Fahrtkosten – die Kilometer rechnet die App aus –, Einkauf vorgestreckt, Parkgebühren, Kraftstoff, Kaution oder Sonstiges. Bei jeder Position sagst du, ob ein Bon da ist." },
  { v: "erstattung", sel: [rgOn("erstattungHinzu")], t: "➕ Mehrere Posten", x: "Mehrere Posten passen in einen Antrag – mit Position hinzufügen." },
  { v: "erstattung", sel: [() => $("v-erstattung")?.querySelector(".zk")], t: "🏦 Wie ausgezahlt?", x: "Dann wählst du, wie du das Geld bekommst: per Überweisung oder bar." },
  { v: "erstattung", sel: [rgFeld("ersBemerkung")], t: "✏️ Bemerkung", x: "Eine Bemerkung ist freiwillig – zum Beispiel ein Hinweis für den Kassenwart." },
  { v: "erstattung", sel: ["#ersSendenKnopf"], t: "📨 Antrag senden", x: "Mit Antrag senden geht alles an den Kassenwart, und du bekommst eine Bestätigung. Hier sende ich nichts." },
  { v: "erstattung", t: "✅ Fertig", x: "So einfach bekommst du dein Geld zurück." },
];
const RG_HILFE = [
  { v: "hilfezentrum", sel: ["#v-hilfezentrum .tw-chef-knopf"], t: "🧑‍🍳 Frag Twinkey", x: "In Hilfe und Tipps fragst du Twinkey: Tippe deine Frage in eigenen Worten oder sprich sie – zum Beispiel: Wie schicke ich eine Nachricht verschlüsselt? Twinkey zeigt die Antwort, auf Wunsch genau die Stelle – und bietet passende Erklär-Videos an." },
  { v: "hilfezentrum", sel: ["#v-hilfezentrum .hz-suchfeld"], puls: ["#hzSuche", "#v-hilfezentrum .hz-suchfeld .diktat-feld", "#v-hilfezentrum .such-knopf"], t: "🔍 Suchen", x: "Oder du suchst nach einem Wort, zum Beispiel Farbe oder Ton – tippen oder mit dem Mikrofon sagen, dann Suchen." },
  { v: "hilfezentrum", sel: ["#hzRegister"], puls: ["#hzRegister button"], t: "📖 Alle Themen", x: "Darunter alle Themen von Erste Schritte bis Notfall. Antippen springt hin. Bei vielen Tipps steht Zeig mir wo – dann führt dich die App direkt an die Stelle." },
  { v: "start", vor: () => sucheZu(true), sel: ["#hzFrage", "#suLupe"], puls: ["#hzFrage", "#suLupe"], t: "❓ Immer zur Hand", x: "Und überall unten rechts: Das Fragezeichen öffnet die Hilfe zu genau dem Bereich, in dem du bist. Die Lupe findet jede Funktion und jede Einstellung." },
  // 2.533.0 KC-CLUB-HILFE-NACHTRAG-4: die Lupe in Aktion (nur lokale Treffer – ohne „Suchen“ fragt sie den Server nicht) und die Sprachsuche
  { v: "start", vor: rgHilfeLupe, sel: ["#suFenster .su-innen"], mussSel: true, puls: ["#suEingabe"], t: "🔍 Die Lupe findet alles",
    x: "Die Lupe sucht in Nachrichten, Terminen, Archiv und Pinnwand – und in allen Funktionen der App. Hier steht zum Beispiel verschlüsselt im Feld: Ganz oben erscheinen gleich die passenden Funktionen, ein Tipp führt direkt hin. Schon ab zwei Buchstaben, und kleine Tippfehler verzeiht sie." },
  { v: "start", nur: () => DIKTAT_GEHT, vor: rgHilfeLupe, sel: ["#suFenster .su-kopf"], mussSel: true, puls: ["#suFenster .diktat-feld"], t: "🎤 Suchen mit der Stimme",
    x: "Lieber sprechen als tippen? Rechts im Suchfeld sitzt ein Mikrofon. Antippen, zum Beispiel Schlüsselbund sagen – nach dem ersten Satz sucht die Lupe von selbst. Ist die Sprachsteuerung an, geht es auch ohne Lupe: Sag einfach Suche Glühwein oder Diashow." },
  { v: "start", vor: () => sucheZu(true), t: "✅ Fertig", x: "Du musst dir nichts merken – Hilfe ist immer nur einen Tipp entfernt: das Fragezeichen, die Lupe mit Mikrofon, Twinkey und Erklär-Videos wie dieses." },
];
function rgHilfeLupe() { // 2.533.0: Lupe mit Beispielwort öffnen – Tastatur bleibt zu, damit man die Treffer sieht
  // SU.offen vorher setzen: kein eigener Verlaufseintrag (sonst beendet „zurück“ beim Schließen das Video) und keine Nutzungs-Zählung
  if (!$("suFenster") || $("suFenster").classList.contains("versteckt")) { SU.offen = true; sucheAuf(""); SU.q = $("suEingabe").value = "verschlüsselt"; SU.ergebnis = []; suZeigen(); } // nur Treffer unter den App-Funktionen – der Server wird nicht gefragt
  setTimeout(() => $("suEingabe")?.blur(), 120);
  if (!RG.hilfeLupeZu) { RG.hilfeLupeZu = true; RG.zurueck.push(() => { RG.hilfeLupeZu = false; sucheZu(true); }); }
}
const RG_SOS = [
  { v: "sos", vor: () => { if (!$("sosInhalt")?.innerHTML.trim()) { SOS.suche = ""; SOS.offen = null; sosZeigen(); sosLaden(); } }, sel: ["#sosInhalt .sos-nummern"], puls: ["#sosInhalt .sos-nr"], t: "🆘 Notrufnummern", x: "Im Notfall-Bereich stehen oben die wichtigen Nummern: 112 für Rettung und Feuerwehr, 110 für die Polizei, der ärztliche Bereitschaftsdienst, Giftnotruf und mehr. Antippen ruft direkt an." },
  { v: "sos", sel: [rgOn("sosWoBinIch", ".karte")], t: "📍 Wo bin ich?", x: "Mit Wo bin ich zeigt dir die App deinen Standort und die Adresse – zum Durchsagen am Telefon." },
  { v: "sos", sel: [rgOn("nfp", ".karte")], mussSel: true, t: "🪪 Notfallpass", x: "Im Notfallpass trägst du freiwillig Allergien, Medikamente und Blutgruppe ein – zum Vorzeigen für Helfer und Rettungsdienst." },
  { v: "sos", sel: ["#sosInhalt .sos-kopf"], mussSel: true, t: "👥 Mitglieder erreichen", x: "Darunter erreichst du die Mitglieder im Notfall – mit den Nummern, die sie freigegeben haben. Deinen eigenen Notfallkontakt trägst du in den Einstellungen unter Privatsphäre ein." },
  { v: "sos", t: "✅ Fertig", x: "Hoffentlich brauchst du das nie – aber gut zu wissen, wo es ist." },
];
const RG_HELFEN = [
  { v: "helfen", sel: ["#hlTabs"], puls: ["#hlTabs button"], t: "🤝 Drei Bereiche", x: "Helfen und Leihen hat drei Bereiche: Wer kann helfen – Helfer suchen oder selbst Hilfe anbieten. Ausleihen – Club-Sachen wie den Pavillon reservieren. Und die Börse – privat etwas anbieten oder suchen." },
  { v: "helfen", sel: ["#v-helfen .kopf2 .knopf.haupt"], t: "＋ Neu", x: "Mit Plus Neu legst du etwas an – eine Bitte um Hilfe, eine Reservierung oder ein Angebot in der Börse." },
  { v: "helfen", sel: ["#hlInhalt"], t: "🙋 Mitmachen", x: "Bei einer Bitte um Hilfe tippst du einfach an, dass du kommst – wer gefragt hat, bekommt Bescheid." },
  { v: "helfen", t: "✅ Fertig", x: "So hilft man sich im Club gegenseitig." },
];
// KC-CLUB-ERKLAERVIDEOS-4 (2.254.0, Wunsch Hansi „Videos für Spiele und Archiv – Erklärung und Bild müssen genau übereinstimmen; dazu ein
// Einleitungs-Video ‚Warum diese App‘, motivierend und einfach, als Erstes anbieten“). Gesagt wird nur, was im Bild gerade zu sehen ist.
// Nur zeigen: kein Spielzug, keine Herausforderung, kein Ordner wird angelegt; Spiel-, Archiv- und Register-Stand werden am Ende zurückgestellt.
const rgRegister = (r) => { if (!einfach() && reg !== r) { const alt = reg; register(r); RG.zurueck.push(() => register(alt)); } };
const rgKachel = (id) => `#raster .kachel[data-id="${id}"]`;
const RG_WARUM = [
  { v: "start", t: "👋 Warum diese App?", x: "Schön, dass du da bist! In drei Minuten erzähle ich dir, warum es diese App gibt – und was du davon hast. Du musst nichts antippen, ich blättere selbst weiter." },
  // 2.345.0 (Wunsch Hansi „Warum diese App: das Clubleben anzeigen und organisieren – alles in einer App; vereinfachen, besser organisieren,
  // Hilfestellung geben, aber auch Spaß machen und neugierig machen, was die App alles kann; sie erinnert an Termine u. v. m.“)
  { v: "start", vor: () => rgKopf("offen"), sel: ["#v-start .hero"], t: "🧑‍🍳 Unser Clubleben in einer App",
    x: "Die App hat ein Ziel: unser Clubleben zeigen und organisieren – alles in einer einzigen App. Was gerade im Club los ist, wer dabei ist, was als Nächstes ansteht: Du siehst es hier auf einen Blick." },
  { v: "start", sel: ["#raster"], kacheln: ["termine", "kommunikation", "pinnwand", "mitglieder", "fotos"], t: "🏠 Alles an einem Ort", x: "Alles, was unseren Köcheclub betrifft, steckt jetzt in einem einzigen Programm – immer dabei auf deinem Handy. Kein Suchen mehr in Zetteln, E-Mails und vielen Gruppen. Jede Kachel ist ein Bereich des Clubs." },
  { v: "start", sel: ["#raster"], kacheln: ["termine", "fotos", "protokolle", "archiv"], t: "🧩 Einfacher und besser organisiert",
    x: "Die App soll vieles einfacher machen: Dienstwünsche statt Zettelwirtschaft, eine gemeinsame To-do-Liste, Erstattungen mit Foto vom Beleg, Fotos und Protokolle an einem Platz, das Archiv mit der Clubchronik. So weiß jeder Bescheid – und nichts geht verloren." },
  { v: "nachrichten", tippVor: `#fuss [onclick="zeige('nachrichten')"]`, sel: ["#v-nachrichten .kopf2"], t: "💬 Nachrichten", x: "Hier schreibst du den Mitgliedern – einzeln oder in Gruppen, mit Fotos und Sprachnachrichten. Fast wie bei WhatsApp – aber nur unter uns im Club." },
  { v: "termine", tippVor: `#fuss [onclick="zeige('termine')"]`, sel: ["#v-termine .tr-kachel", "#v-termine .kopf2"], t: "📅 Termine", x: "Alle Clubtermine auf einen Blick. Mit einem Tipp sagst du zu oder ab – und die App erinnert dich rechtzeitig." },
  { v: "termine", sel: ["#v-termine .tr-kachel", "#v-termine .kopf2"], t: "⏰ Die App denkt mit",
    x: "Die App erinnert dich: an Termine, an deine Dienste, an Geburtstage im Club und an Aufgaben aus der To-do-Liste. Neue Nachrichten und Wichtiges kommen als Benachrichtigung aufs Handy – auch wenn die App gerade zu ist. Und auf Wunsch landen die Clubtermine in deinem Handy-Kalender." },
  { v: "fotos", sel: ["#v-fotos .kopf2"], t: "📷 Fotos", x: "Die schönsten Momente aus dem Clubleben – im Fotoalbum für alle Mitglieder. Eigene Fotos lädst du mit einem Tipp dazu." },
  { v: "aktionen", sel: ["#aktionListe .aktkachel", "#v-aktionen .kopf2"], t: "🧳 Aktionen", x: "Unsere Ausflüge und Reisen: wann es losgeht, alle Einzelheiten – und ob du dabei bist." },
  { v: "start", nur: () => !einfach(), vor: () => rgRegister("mein"), sel: [rgKachel("mein_dienst")], mussSel: true, puls: [rgKachel("mein_dienst")], video: "dienst", t: "🗓️ Dienstplan",
    x: "Deine Dienstwünsche gibst du direkt in der App ein – hier unter Mein Dienst. Auf Wunsch führt dich Twinkey, unser Assistent, Tag für Tag durch. Und du siehst hier auch deine nächsten Dienste." },
  { v: "start", nur: () => einfach(), sel: [rgKachel("meindienst")], mussSel: true, video: "dienst", t: "🗓️ Dienstplan", x: "Unter Mein Dienstplan siehst du deine Dienste. Deine Dienstwünsche gibst du in der erweiterten Ansicht unter Mein Dienst ein – auf Wunsch führt dich Twinkey, unser Assistent, Tag für Tag durch." },
  { v: "start", sel: [".ansichtname.ein", ".ansichtname.erw"], video: "anpassen", t: "👍 Ganz einfach", x: "Alles ist so gebaut, dass es leicht geht: große Knöpfe und klare Wege. Wer mag, nimmt die einfache Ansicht mit wenigen großen Kacheln – hier schaltest du um. Schrift und Farben stellst du dir in den Einstellungen so ein, wie es dir gefällt." },
  { v: "start", sel: ["#hzFrage", "#suLupe"], puls: ["#hzFrage", "#suLupe"], video: "hilfe", t: "❓ Viel Hilfe", x: "Und du bist nie allein: Das Fragezeichen erklärt jeden Bereich, die Lupe findet jede Funktion, Twinkey beantwortet deine Fragen – und es gibt Erklär-Videos wie dieses." },
  { v: "start", nur: () => !einfach(), vor: () => rgRegister("programme"), sel: [rgKachel("sicherheit")], t: "🔒 Deine Daten sind sicher",
    x: () => "Deine Daten sind geschützt: Die Verbindung ist verschlüsselt, gespeichert wird verschlüsselt, und jeder sieht nur, was er sehen darf. Deinen eigenen Archiv-Ordner siehst nur du."
      + (rgSichtbar(document.querySelector(rgKachel("sicherheit"))) ? " Mit dem Sicherheits-Check hier im Register Technik prüfst du das jederzeit selbst." : "") },
  { v: "start", nur: () => einfach(), t: "🔒 Deine Daten sind sicher", x: "Deine Daten sind geschützt: Die Verbindung ist verschlüsselt, gespeichert wird verschlüsselt, und jeder sieht nur, was er sehen darf. Deinen eigenen Archiv-Ordner siehst nur du." },
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, sel: ["#v-start .eselsohr", "#v-start .hero"], puls: ["#v-start .eselsohr"], video: "rueckseite", t: "🎉 Spaß und Neugier",
    x: "Und die App soll Spaß machen und neugierig machen, was sie alles kann! Oben im Kopf zeigt sich die Jahreszeit mit kleinen Besuchern. Hinter dem Eselsohr warten die Bühne mit Twinkey zum Mitturnen, unser Club-Song zum Mitsingen, das Werne-Rätsel mit Bestenliste und vieles mehr. Dazu Spiele gegen andere Mitglieder – und Themen, mit denen du die App ganz nach deinem Geschmack gestaltest." },
  { v: "start", t: "🎉 Los geht's", x: "Probier einfach alles aus – kaputt machen kannst du nichts. Gleich danach kann ich dir im Rundgang zeigen, wie die App aufgebaut ist. Viel Freude mit unserer Köcheclub-App!" },
];
// Spiele: Übersicht → Tic-Tac-Toe als Beispiel (gegen den Computer, ohne Zug) → gegen Mitglieder (ohne Herausforderung) → Stand zurück
function rgSpielAuf(art, tab) {
  if (!RG.spAlt) { RG.spAlt = { art: SP.art, tab: SP.tab, offen: SP.offen, pause: SP.pause };
    RG.zurueck.push(() => { const a = RG.spAlt; RG.spAlt = null; if (!a) return; SP.art = a.art; SP.tab = a.tab; SP.offen = a.offen; SP.pause = a.pause; if (aktuelleAnsicht === "spiele") spZeigen(); }); }
  SP.tab = tab || "pc"; SP.offen = null;
  if (!art) { SP.art = null; spZeigen(); return; }
  spArtWahl(art); if (SP.tab === "mg") spLaden(true).then(rgNeuZielen); // Liste kommt vom Server – danach den Knopf zeigen
}
function rgNeuZielen() { if (!RG.an || RG.frage) return; const s = RG.st[RG.i]; RG.ziel = rgZiel(s) || RG.ziel; rgHin(); rgLage(); rgPulsStart(s); }
const rgSpielNamen = () => [...document.querySelectorAll("#spInhalt .sp-kachel b")].map((b) => b.textContent.trim());
const RG_SPIELE = [
  { v: "spiele", vor: () => rgSpielAuf(null), sel: ["#spInhalt .sp-kacheln"], puls: ["#spInhalt .sp-kachel"], t: "🎲 Spiele – Köcheclub Edition",
    x: () => { const n = rgSpielNamen(); return `Hier suchst du dir ein Spiel aus${n.length > 1 ? ": " + n.slice(0, -1).join(", ") + " und " + n[n.length - 1] : ""}. Antippen öffnet das Spiel.`; } },
  { v: "spiele", vor: () => rgSpielAuf(null), sel: ['#spInhalt .sp-kachel[onclick="spArtWahl(\'ttt\')"]'], mussSel: true, t: "👆 Ein Spiel öffnen", x: "Als Beispiel öffne ich Tic-Tac-Toe." },
  { v: "spiele", tippVor: '#spInhalt .sp-kachel[onclick="spArtWahl(\'ttt\')"]', vor: () => rgSpielAuf("ttt", "pc"), sel: ["#spTabs"], puls: ["#spTabs button"], t: "🤖 Gegen wen?", x: "Oben wählst du: gegen den Computer – oder gegen Mitglieder aus dem Club." },
  { v: "spiele", vor: () => rgSpielAuf("ttt", "pc"), sel: ["#spInhalt .sp-karte"], puls: ["#spInhalt .sp-wahl button"], mussSel: true, t: "⚙️ Wie schwer?",
    x: "Gegen den Computer stellst du ein: die Feldgröße, wie stark der Computer spielt – leicht, mittel oder schwer – und wer anfängt." },
  { v: "spiele", vor: () => rgSpielAuf("ttt", "pc"), sel: ["#spInhalt .sp-brett"], mussSel: true, t: "🍅 Spielen", x: "Dann tippst du einfach auf ein freies Feld. Wer zuerst drei in einer Reihe hat, gewinnt – waagerecht, senkrecht oder schräg." },
  { v: "spiele", vor: () => rgSpielAuf("ttt", "pc"), sel: ["#spInhalt .sp-leiste"], puls: [rgOn("spPcNeu("), rgOn("spPausieren(")], mussSel: true, t: "⏸ Neu oder Pause",
    x: "Mit Neues Spiel fängst du von vorn an. Mit Pause hältst du an – mit Weiter geht es später weiter." },
  { v: "spiele", tippVor: '#spTabs button[data-t="mg"]', vor: () => rgSpielAuf("ttt", "mg"), sel: [rgOn("spHerausfordernBlatt("), '#spTabs button[data-t="mg"]'], puls: [rgOn("spHerausfordernBlatt(")], t: "👥 Gegen Mitglieder",
    x: "Unter Gegen Mitglieder forderst du jemanden aus dem Club heraus. Ihr zieht abwechselnd – und du bekommst Bescheid, wenn du dran bist. Hier fordere ich niemanden heraus." },
  { v: "spiele", vor: () => rgSpielAuf(null), sel: ["#v-spiele .kopf2 .zurueck"], t: "✅ Fertig", x: "Mit dem Pfeil oben links kommst du aus jedem Spiel zurück zur Übersicht. Viel Spaß beim Spielen!" },
];
// Archiv: Regal ohne Filter zeigen; einen Clubleben-Ordner öffnen (ohne Verlaufseintrag); Filter, Ordner und Register am Ende zurück
function rgArchivAuf(ordner) {
  if (!RG.arAlt) { RG.arAlt = { ordner: AR.ordner, register: AR.register, korb: AR.korb, suche: AR.suche, jahr: AR.jahr, art: AR.art };
    RG.zurueck.push(() => { const a = RG.arAlt; RG.arAlt = null; if (!a) return; Object.assign(AR, a); if (aktuelleAnsicht === "archiv") arZeigen(); }); }
  Object.assign(AR, { ordner: ordner || null, register: "", korb: false, suche: "", jahr: "", art: "" });
  if (Array.isArray(AR.daten?.ordner)) try { arZeigen(); } catch (e) { console.warn("rundgang archiv", e); } // wie arLaden: unvollständige Antwort nicht abstürzen lassen
}
const rgArchivWarten = (n = 0) => { if (!RG.an || aktuelleAnsicht !== "archiv") return; if (!Array.isArray(AR.daten?.ordner)) { if (n < 16) setTimeout(() => rgArchivWarten(n + 1), 250); return; }
  rgArchivAuf(RG.st[RG.i]?.arOrdner?.()); setTimeout(() => { if (!RG.an) return; RG.ziel = rgZiel(RG.st[RG.i]) || RG.ziel; rgHin(); rgLage(); rgPulsStart(RG.st[RG.i]); }, 120); };
const rgArAbschnitt = (wort) => { const h = [...document.querySelectorAll("#arListe .abschnitt h3")].find((x) => x.textContent.includes(wort)); return h?.closest(".abschnitt")?.nextElementSibling; };
const rgArClubleben = () => { const j = [...new Set((AR.daten?.auto || []).map((x) => arJahr(x.datum)))].sort().pop(); return j ? "auto:" + j : null; };
const RG_ARCHIV = [
  { v: "archiv", vor: () => rgArchivWarten(), live: async (L) => { await L.warte(3500); await L.tipp(`#arInhalt .ar-chips .chip[onclick^="AR.art='auto'"]`); AR.art = "auto"; arZeigen(); await L.warte(2000);
      await L.tipp(`#arInhalt .ar-chips .chip[onclick^="AR.art=''"]`); AR.art = ""; arZeigen(); }, sel: ["#arInhalt .ar-filter"], puls: ["#arSuche", "#arInhalt .ar-filter select", '#arInhalt .ar-chips .chip[onclick^="AR.art=\'auto\'"]'], t: "🗄️ Das Archiv",
    x: "Das Archiv ist das Regal unseres Clubs. Oben suchst du nach einem Wort, wählst ein Jahr – oder tippst auf eine Art, zum Beispiel Clubleben." },
  { v: "archiv", vor: () => rgArchivWarten(), sel: [() => rgArAbschnitt("Mein Ordner"), "#arListe .ar-pers"], puls: [rgOn("arNeuesJahr(")], mussSel: true, t: "👤 Mein Ordner",
    x: () => (AR.daten?.ordner || []).some((o) => o.eigen) ? "Oben im Regal steht dein eigener Ordner. Den siehst nur du – auch der Admin nicht. Mit Plus weiteres Jahr legst du einen neuen Jahrgang an."
      : "Oben im Regal ist Platz für deinen eigenen Ordner – mit Plus weiteres Jahr legst du ihn an. Den siehst nur du, auch der Admin nicht." },
  { v: "archiv", vor: () => rgArchivWarten(), sel: [() => rgArAbschnitt("Clubchronik")], mussSel: true, t: "📖 Die Clubchronik", x: "Die Clubchronik ist ein Ordner für alle Jahre – die Geschichte unseres Clubs." },
  { v: "archiv", vor: () => rgArchivWarten(), sel: ['#arListe button.ordner[onclick^="arOrdnerOeffnen(\'auto:"]'], mussSel: true, t: "🤖 Clubleben",
    x: "Clubleben füllt sich von selbst: Was vorbei ist – Termine, Protokolle, Abstimmungen, Aktionen und mehr – landet hier, nach Jahren geordnet." },
  { v: "archiv", arOrdner: rgArClubleben, tippVor: () => rgArClubleben() && document.querySelector(`#arListe button.ordner[onclick="arOrdnerOeffnen('${rgArClubleben()}')"]`), vor: () => rgArchivWarten(), sel: ["#arInhalt .ar-register"], puls: ["#arInhalt .ar-register button", "#arInhalt .ar-blaettern"], mussSel: true, t: "📂 Ein Ordner",
    x: "Tippst du einen Ordner an, öffnet er sich – mit Registern wie ein echter Ordner. Mit Blättern liest du ihn Seite für Seite wie ein Buch." },
  { v: "archiv", vor: () => rgArchivWarten(), sel: [rgOn("ivAnsicht(")], puls: [rgOn("ivAnsicht(")], t: "🗂️ Inhaltsverzeichnis", x: "Mit Inhaltsverzeichnis siehst du alles auf einen Blick – und kannst es auch ausdrucken." },
  { v: "archiv", vor: () => rgArchivWarten(), t: "✅ Fertig", x: "So findest du alles wieder – von heute bis zu den ersten Tagen des Clubs." },
];
// KC-CLUB-ERKLAERVIDEOS-OBERFLAECHE (2.258.0, Wunsch Hansi „Video, wie ich die Oberfläche anpassen kann: die beiden Pfeile oben, Pfeile rechts/links,
// Kacheln verschieben, verbergen, umdrehen, verborgene anzeigen, Register anordnen, Wischen“). Alles wird nur vorgeführt und NICHT gespeichert:
// Kopf, Info-Feld, Anordnen, ausgeblendete Kachel, Register-Reihenfolge und umgedrehte Kachel werden am Ende genau zurückgestellt.
function rgKopf(stand) {
  if (!RG.kopfAlt) { RG.kopfAlt = kopfRolloStand(); RG.zurueck.push(() => { const a = RG.kopfAlt; RG.kopfAlt = null; if (a) kopfRolloSetzen(a); }); }
  kopfRolloSetzen(stand || RG.kopfAlt); scrollTo(0, 0);
}
function rgInfo(schritt) {
  if (RG.infoAlt === undefined || RG.infoAlt === null) { RG.infoAlt = INFO_I; RG.zurueck.push(() => { const a = RG.infoAlt; RG.infoAlt = null; if (a !== null && a !== INFO_I) infoGehe(a, -1); }); }
  if (schritt) infoBlaettern(schritt);
}
function rgAnordnen(an) { // „Anordnen“ ohne Speichern ein- und ausschalten (kaBearbeiten(false) würde speichern)
  if (an && !kaBearb) { if (!RG.anordnenZurueck) { RG.anordnenZurueck = true; RG.zurueck.push(() => { RG.anordnenZurueck = false; rgAnordnen(false); }); } kaBearb = true; kaFrisch = null; KA_NUR_AUS = false; $("kachelLeiste").classList.remove("versteckt"); registerZeigen(); kachelnZeigen(); }
  else if (!an && kaBearb) { kaBearb = false; kaFrisch = null; $("kachelLeiste").classList.add("versteckt"); registerZeigen(); kachelnZeigen(); }
}
function rgAusDemo(an) { // eine Kachel nur auf dem Bildschirm ausblenden (KA wird nicht gespeichert) – am Ende wieder da
  if (an && !RG.ausId) { const id = rgAusKandidat(); if (!id) return; RG.ausId = id; KA.aus = [...KA.aus, id];
    RG.zurueck.push(() => rgAusDemo(false)); }
  else if (!an && RG.ausId) { const id = RG.ausId; RG.ausId = null; KA.aus = KA.aus.filter((x) => x !== id); KA_NUR_AUS = false; }
  registerZeigen(); kachelnZeigen();
}
function rgRegisterTausch(an) { // Register-Reihenfolge zurück (an = false); Vorführen geht über rgRegisterReihe – nie gespeichert
  if (an) return;
  if (RG.regAlt) { const alt = RG.regAlt.reihe; RG.regAlt = null; rgRegisterFlip(() => { KA.register = alt; registerZeigen(); }); }
  else registerZeigen();
}
// KC-CLUB-VIDEO-LIVE-2 (2.262.0, Fund Hansi „das Verschieben der 3 Register wird nicht gut gezeigt“): die anderen Register rücken sichtbar nach
function rgRegisterFlip(aendern) {
  const vor = new Map([...document.querySelectorAll("#register button")].map((b) => [b.dataset.r, b.getBoundingClientRect().left]));
  aendern();
  for (const b of document.querySelectorAll("#register button")) { const x = vor.get(b.dataset.r); if (x === undefined) continue; const dx = x - b.getBoundingClientRect().left;
    if (dx) try { b.animate([{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }], { duration: 420, easing: "cubic-bezier(.3,.1,.2,1)" }); } catch {} }
}
function rgRegisterReihe(reihe) {
  if (!RG.regAlt) { RG.regAlt = { reihe: KA.register }; RG.zurueck.push(() => rgRegisterTausch(false)); }
  rgRegisterFlip(() => { KA.register = reihe; registerZeigen(); });
}
// Register festhalten, Abbild hebt sich, Stück für Stück nach rechts ziehen – bei jedem Register, das es überquert, rückt das andere nach links
const rgRegSichtbar = () => [...document.querySelectorAll("#register button")].filter(rgSichtbar);
const rgRegNamen = () => rgRegSichtbar().map((b) => REGISTER.find((x) => x[0] === b.dataset.r)?.[1] || b.dataset.r);
async function rgFregisterZiehen(tok) {
  const r = rgRegSichtbar()[0]?.dataset.r, knopf = () => document.querySelector(`#register button[data-r="${r}"]`), n = rgRegSichtbar().length; if (!r || n < 2) return;
  const a = await rgFpunkt(knopf(), tok); await rgFzu(a.x, a.y, 650, tok); rgFdruck(true); rgFring(a.x, a.y, true); knopf().classList.add("rg-gedrueckt"); await rgFwarte(800, tok);
  const el = knopf(), g = el.cloneNode(true); g.id = "rgGeist"; g.removeAttribute("onclick"); g.querySelectorAll("svg").forEach((x) => x.remove());
  const cs = getComputedStyle(el); for (const k of ["background", "color", "font", "borderRadius", "border", "padding", "display", "alignItems", "justifyContent", "gap", "boxSizing", "textAlign", "whiteSpace", "lineHeight"]) g.style[k] = cs[k];
  g.classList.remove("rg-gedrueckt", "rg-puls", "zieht", "rg-zieht-weg", "an"); g.classList.add("an"); g.className += " rg-geist"; Object.assign(g.style, { left: a.r.left + "px", top: a.r.top + "px", width: a.r.width + "px", height: a.r.height + "px", transform: "scale(1.12) rotate(-3deg)" }); document.body.appendChild(g);
  el.classList.remove("rg-gedrueckt"); let gx = 0;
  const geistZu = async (x, ms) => { const von = gx; gx = x - a.x; try { g.animate([{ transform: `translateX(${von}px) scale(1.12) rotate(-3deg)` }, { transform: `translateX(${gx}px) scale(1.12) rotate(-3deg)` }], { duration: ms, easing: "ease-in-out", fill: "forwards" }); } catch {} await rgFzu(x, a.y, ms, tok); };
  for (let k = 1; k < n; k++) {
    knopf()?.classList.add("rg-zieht-weg");
    const sicht = rgRegSichtbar(), ziel = sicht[k]?.getBoundingClientRect(); if (!ziel) break;
    await geistZu(ziel.left + ziel.width / 2, 900);
    const nach = sicht[k].dataset.r, reihe = [...document.querySelectorAll("#register button")].map((b) => b.dataset.r).filter((x) => x !== r); reihe.splice(reihe.indexOf(nach) + 1, 0, r);
    rgRegisterReihe(reihe); knopf()?.classList.add("rg-zieht-weg"); await rgFwarte(450, tok);
  }
  rgFdruck(false); await rgFwarte(150, tok); g.remove(); knopf()?.classList.remove("rg-zieht-weg");
  const b = knopf(); b?.classList.add("zieht"); await rgFwarte(500, tok); b?.classList.remove("zieht");
}
const rgDrehKachel = () => [...document.querySelectorAll("#raster > .kachel")].find((k) => krAktionen(k.dataset.id).length && rgSichtbar(k));
const rgPinnwandKachel = () => { const k = document.querySelector('#raster > .kachel[data-id="pinnwand"]'); return k && rgSichtbar(k) && krAktionen("pinnwand").length ? k : rgDrehKachel(); };
async function rgFdrehen(id, tok, zurueck) { // sichtbar drehen: bis zur Kante, Inhalt wechseln, wieder nach vorn (eigene Animation, unabhängig von der Handy-Einstellung)
  const q = () => document.querySelector(`#raster > .kachel[data-id="${id}"]`); let el = q(); if (!el) return;
  let h; try { h = el.animate([{ transform: "perspective(600px) rotateY(0deg)" }, { transform: "perspective(600px) rotateY(90deg)" }], { duration: 450, easing: "ease-in", fill: "forwards" }); } catch {}
  await rgFwarte(460, tok);
  if (zurueck) rgDrehen(false); else rgDrehen(true, el);
  await rgFwarte(220, tok); try { h?.cancel(); } catch {} el = q();
  try { el?.animate([{ transform: "perspective(600px) rotateY(-90deg)" }, { transform: "perspective(600px) rotateY(0deg)" }], { duration: 450, easing: "ease-out" }); } catch {}
  await rgFwarte(470, tok);
}
function rgDrehen(an, kachel) {
  const offen = document.querySelector("#raster > .kachel.kr-hinten");
  if (!an) { if (offen) krUmdrehen(offen, true); return; }
  if (offen) return; const k = kachel || rgDrehKachel(); if (!k) return;
  krUmdrehen(k); if (!RG.drehZurueck) { RG.drehZurueck = true; RG.zurueck.push(() => { RG.drehZurueck = false; rgDrehen(false); }); }
  setTimeout(() => { clearTimeout(KR.zu); RG.ziel = document.querySelector("#raster > .kachel.kr-hinten") || RG.ziel; rgLage(); }, 300); // bleibt offen, solange erzählt wird
}
// KC-CLUB-RC-PRUEFUNG (20.10.2026): rgRegName entfernt – nirgends benutzt
function rgKaSchieben(id, d) { // wie kaSchieben, aber nur auf dem Bildschirm (nicht gespeichert); Reihenfolge am Ende zurück
  if (!RG.reihAlt) { RG.reihAlt = { r: JSON.parse(JSON.stringify(KA.reihenfolge || {})) }; RG.zurueck.push(() => { if (RG.reihAlt) { KA.reihenfolge = RG.reihAlt.r; RG.reihAlt = null; kaFrisch = null; kachelnZeigen(); } }); }
  const liste = kaListe().map((k) => k.id), i = liste.indexOf(id), j = i + d;
  if (i < 0 || j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
  KA.reihenfolge = { ...KA.reihenfolge, [kaSchluessel()]: liste }; kaFrisch = id; kachelnZeigen();
}
const rgKa = (i) => document.querySelectorAll("#raster > .kachel")[i] || null;
const rgKaId = (i) => rgKa(i)?.dataset.id || "";
const rgAusKandidat = () => kacheln(reg).filter((x) => !x.bald).pop()?.id || "";
const RG_OBERFLAECHE = [
  { v: "start", vor: () => { rgKopf("offen"); rgAnordnen(false); if (!einfach() && !RG.regStart) { RG.regStart = reg; RG.zurueck.push(() => { const a = RG.regStart; RG.regStart = null; if (a && reg !== a) register(a); }); } }, t: "🎨 Deine Wunsch-Oberfläche",
    x: "So gestaltest du dir die Startseite selbst – ganz nach deinen Bedürfnissen. Ich mache dir alles vor; gespeichert wird nichts, und am Ende ist alles wieder wie vorher." },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#kopfPfeilHalb", "#kopfPfeil"], puls: ["#kopfPfeilHalb", "#kopfPfeil"], t: "⌃ Die beiden Pfeile oben",
    x: "Ganz oben siehst du zwei Pfeile. Damit rollst du den farbigen Kopf ein wie eine Jalousie – dann ist mehr Platz für die Kacheln." },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#v-start .hero"], t: "⌃ Halb einrollen", x: "Ich tippe auf den linken Pfeil: Der Kopf rollt halb ein – die Zeile mit deinem Status bleibt stehen.",
    live: async (L) => { await L.tipp("#kopfPfeilHalb"); await kopfRolloFahren("halb"); } },
  { v: "start", vor: () => rgKopf("halb"), sel: ["#v-start .hero"], t: "⌃⌃ Ganz einrollen", x: "Jetzt der rechte Pfeil: Der Kopf rollt ganz ein, nur die oberste Zeile bleibt. Nochmal antippen – und er rollt wieder aus.",
    live: async (L) => { await L.tipp("#kopfPfeil"); await kopfRolloFahren("ganz"); await L.warte(1800); await L.tipp("#kopfPfeil"); await kopfRolloFahren("offen"); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("offen"); rgInfo(); }, sel: ["#heroInfo"], mussSel: true, t: "‹ › Pfeile links und rechts",
    x: "Im farbigen Info-Feld blätterst du mit den Pfeilen links und rechts durch den nächsten Termin, das Wetter und Neues für dich. Ich blättere einmal weiter – und wieder zurück.",
    live: async (L) => { await L.tipp("#heroInfo .ipfeil.rechts"); rgInfo(1); await L.warte(2200); await L.tipp("#heroInfo .ipfeil.links"); rgInfo(-1); } },
  { v: "start", nur: () => einfach(), sel: [".ansichtname.ein"], puls: [".ansichtname.ein"], t: "🔀 Erweiterte Ansicht",
    x: "Die meisten Möglichkeiten gibt es in der erweiterten Ansicht: Register, Kacheln verbergen und umdrehen, Wischen. Hier schaltest du um – danach zeigt dir dieses Video noch einmal alles." },
  { v: "start", nur: () => einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(false); }, sel: ["#raster"], mussSel: true, t: "↕️ Kacheln anordnen",
    x: "In der einfachen Ansicht änderst du die Reihenfolge so: Kachel lange drücken – dann schiebst du sie mit den Pfeilen nach unten oder oben. Mit Fertig ist es gespeichert.",
    live: async (L) => { const id = rgKaId(0); await L.tipp(() => rgKa(0), "lang"); rgAnordnen(true); await L.warte(700);
      await L.tipp(`#raster .kachel.bearb[data-id="${id}"] .kstrg button[onclick$=",1)"]`); rgKaSchieben(id, 1); await L.warte(1500);
      await L.tipp(`#raster .kachel.bearb[data-id="${id}"] .kstrg button[onclick$=",-1)"]`); rgKaSchieben(id, -1); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(false); }, sel: ["#raster"], t: "👆 Lange drücken",
    x: "Jetzt zu den Kacheln. Ich drücke eine Kachel lange – gut eine halbe Sekunde. Schon öffnet sich das Anordnen: Jede Kachel bekommt Pfeile und ein Kreuz.",
    live: async (L) => { await L.tipp(() => rgKa(0), "lang"); rgAnordnen(true); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(true); }, sel: ["#raster"], mussSel: true, t: "✋ Verschieben",
    x: "Eine Kachel festhalten, an den neuen Platz ziehen und loslassen – so. Oder du tippst die Pfeile an: links, oben, unten oder rechts. Mit dem Pfeil schiebe ich sie wieder zurück.",
    live: async (L) => { const id = rgKaId(0); if (await L.ziehen(() => rgKa(0), () => rgKa(1))) rgKaSchieben(id, 1); await L.warte(1500);
      await L.tipp(`#raster .kachel.bearb[data-id="${id}"] .kstrg button[title="nach links"]`); rgKaSchieben(id, -1); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(true); rgAusDemo(false); }, sel: ["#raster .kachel.bearb.aus", () => document.querySelector(`#raster .kachel.bearb[data-id="${rgAusKandidat()}"]`)], mussSel: true, t: "✕ Verbergen",
    x: () => `Oben an jeder Kachel ist ein Kreuz. Ich tippe es bei ${kaSortiert(reg).find((k) => k.id === rgAusKandidat())?.t || "dieser Kachel"} an: Die Kachel ist jetzt verborgen und steht blass an ihrem Platz. Deine Daten bleiben erhalten.`,
    live: async (L) => { await L.tipp(`#raster .kachel.bearb[data-id="${rgAusKandidat()}"] .kweg`); rgAusDemo(true); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(true); rgAusDemo(true); }, sel: ["#raster .kachel.bearb.aus"], mussSel: true, t: "👁️ Einblenden",
    x: "Mit Einblenden holst du sie zurück – schon ist sie wieder da.",
    live: async (L) => { await L.tipp("#raster .kachel.bearb.aus .ein"); rgAusDemo(false); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAusDemo(false); rgAnordnen(true); }, sel: ["#kachelLeiste"], puls: ['#kachelLeiste [onclick^="kaStandard"]'], mussSel: true, t: "✅ Fertig",
    x: "Bist du zufrieden, tippst du auf Fertig – dann merkt sich die App deine Startseite, auch auf deinen anderen Geräten. Mit Standard ist alles wieder wie am Anfang.",
    live: async (L) => { await L.warte(2500); await L.tipp('#kachelLeiste [onclick^="kaBearbeiten(false)"]'); rgAnordnen(false); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(false); rgAusDemo(true); }, sel: ["#kaAusHinweis"], mussSel: true, t: "👀 Verborgene anzeigen",
    x: "Sind Kacheln verborgen, steht das unter den Kacheln. Mit Nur ausgeblendete zeigen holst du sie zum Benutzen hervor – und mit dem Knopf verschwinden sie wieder.",
    live: async (L) => { await L.tipp("#kaAusHinweis .ka-nuraus"); kaNurAus(true); L.ziel(); await L.warte(2200); await L.tipp("#kaAusHinweis .ka-nuraus.an"); kaNurAus(false); } },
  // 2.274.0 KC-CLUB-VIDEO-ZAHLEN (Wunsch Hansi): die Zahlen hinten am Register (z. B. 10/12) und auf den Kacheln erklären.
  // Gesprochen wird „10 von 12“ – „10/12“ läsen manche Stimmen als Datum vor.
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgAnordnen(false); kaNurAus(false); rgAusDemo(true); }, sel: ["#register button.an"], puls: ["#register button.an .anz"], mussSel: true, t: "🔢 Die Zahl am Register",
    x: () => { const b = document.querySelector("#register button.an"), m = b?.querySelector(".anz")?.textContent.match(/^(\d+)\/(\d+)$/), name = REGISTER.find(([r]) => r === b?.dataset.r)?.[1] || "dem Register", weg = m ? m[2] - m[1] : 0;
      return (m ? `Hinten an ${name} steht jetzt eine Zahl mit Schrägstrich: ${m[1]} von ${m[2]}. Das heißt: ${m[1]} Kacheln sind sichtbar, ${weg} ${weg === 1 ? "ist" : "sind"} ausgeblendet. `
        : "Hinten an jedem Register steht eine Zahl – so viele Kacheln sind darin. ") + "Steht dort zum Beispiel 10 von 12, sind 10 Kacheln sichtbar und 2 ausgeblendet. Die ausgeblendeten kannst du jederzeit wieder einblenden – so wie eben gezeigt. Steht nur eine Zahl da, ist nichts ausgeblendet."; } },
  { v: "start", vor: () => { rgKopf("ganz"); rgAnordnen(false); rgAusDemo(false); if (!einfach() && REGISTER.some(([x]) => x === "verein")) rgRegister("verein"); },
    sel: [() => document.querySelector("#raster .kachel[data-id] > .zahl")?.parentElement || null, "#raster"], puls: ["#raster .kachel[data-id] > .zahl"], t: "🔴 Zahlen auf den Kacheln",
    x: () => { const n = document.querySelectorAll("#raster .kachel[data-id] > .zahl").length;
      return `Auf manchen Kacheln steht eine Zahl. Sie zeigt dir, was auf dich wartet – zum Beispiel ungelesene Nachrichten, Termine, auf die du noch nicht geantwortet hast, oder offene Zettel an der Pinnwand. ${n ? "Ich lasse die Zahlen gerade aufleuchten. " : "Gerade wartet hier nichts auf dich – deshalb siehst du keine Zahl. "}Hast du alles angesehen, wird die Zahl kleiner und verschwindet.`; } },
  { v: "start", nur: () => !einfach() && krAn(), vor: () => { rgKopf("ganz"); rgAusDemo(false); rgDrehen(false); if (REGISTER.some(([x]) => x === "verein")) rgRegister("verein"); },
    sel: ["#raster > .kachel.kr-hinten", () => rgPinnwandKachel(), "#v-pinnwand .kopf2"], t: "🔄 Kachel umdrehen",
    x: () => { const k = rgPinnwandKachel(), a = k ? krAktionen(k.dataset.id).map((x) => x[1]) : [], name = kaSortiert(reg).find((x) => x.id === k?.dataset.id)?.t || "eine Kachel";
      return `Hier im Register Club tippe ich zweimal schnell auf ${name === "Pinnwand" ? "die Kachel Pinnwand" : name} – sie dreht sich um. Hinten stehen Abkürzungen${a.length ? ": " + a.join(" und ") : ""}. Ich tippe auf ${a[a.length - 1] || "eine davon"} – und schon ist sie offen.`; },
    live: async (L) => { const k = rgPinnwandKachel(); if (!k) return; const id = k.dataset.id, akt = krAktionen(id), letzte = akt.length - 1;
      await L.tipp(() => k, "doppelt"); await rgFdrehen(id, RG.liveTok); L.ziel(); await L.warte(2600);
      await L.tipp(`#raster > .kachel.kr-hinten [data-kr="${letzte}"]`); rgDrehen(false); try { akt[letzte]?.[2](); } catch {} await L.warte(300); L.ziel(); await L.warte(2200); } },
  { v: "start", nur: () => !einfach() && REGISTER.length > 1, vor: () => { rgDrehen(false); rgKopf("ganz"); rgRegisterTausch(false); }, sel: ["#register"], mussSel: true, t: "🗂️ Register anordnen",
    x: () => { const n = rgRegNamen(), neu = [...n.slice(1), n[0]];
      return `Die Register oben kannst du selbst anordnen. Ich halte ${n[0]} fest, bis es sich hebt, und ziehe es nach rechts – ${n.length > 2 ? `${n.slice(1).join(" und ")} rücken` : `${n[1]} rückt`} dabei nach links. Loslassen – jetzt ist die Reihenfolge ${neu.join(", ")}. Die App merkt sich das.`; },
    live: async () => { await rgFregisterZiehen(RG.liveTok); } },
  { v: "start", nur: () => !einfach() && REGISTER.length > 1, vor: () => { rgRegisterTausch(false); rgKopf("ganz"); rgRegister(rgRegSichtbar()[0]?.dataset.r || REGISTER[0][0]); }, sel: ["#raster"], puls: [".wischhinweis", "#register button.an"], t: "👆 Wischen",
    x: () => { const n = rgRegNamen(); return `Am schnellsten wechselst du die Register mit dem Finger: Ich wische über die Kacheln nach links – schon bin ich in ${n[1]}. Nach rechts gewischt geht es zurück zu ${n[0]}.`; },
    live: async (L) => { const v = rgRegSichtbar().map((x) => x.dataset.r), a = v[0], b = v[1]; if (!b) return; await L.wischen("#raster", 1); register(b, 1); await L.warte(2000); await L.wischen("#raster", -1); register(a, -1); } },
  // 2.264.0 KC-CLUB-VIDEO-LIVE-3 (Wunsch Hansi): kurz vor Schluss auf die vielen weiteren Einstellungen hinweisen – live: Meins → Einstellungen antippen
  { v: "start", vor: () => { rgKopf("offen"); rgAnordnen(false); rgRegisterTausch(false); }, sel: [() => (aktuelleAnsicht === "einstellungen" ? document.querySelector("#v-einstellungen .kopf2") : null), rgKachel("einstellungen"), '#register button[data-r="mein"]', `#fuss [onclick="zeige('einstellungen')"]`], video: "anpassen", t: "⚙️ Noch viel mehr Möglichkeiten",
    x: () => `Es gibt noch viele weitere Möglichkeiten, deine Oberfläche anzupassen – zum Beispiel mit anderen Farben oder Spezialeffekten. Die Einstellungen findest du ${einfach() || !REGISTER.some(([r]) => r === "mein") ? "unten unter Mehr" : "im Register Meins unter Meine Einstellungen"}. Dort ist noch sehr viel individuell einstellbar. Probier es gerne aus und stell alles nach deinen Vorlieben und Bedürfnissen ein. Zu den Einstellungen gibt es auch eigene Erklär-Videos.`,
    live: async (L) => { await L.warte(1500); if (!einfach() && REGISTER.some(([r]) => r === "mein")) { if (reg !== "mein") { await L.tipp('#register button[data-r="mein"]'); rgRegister("mein"); await L.warte(900); L.ziel(); await L.warte(400); } await L.tipp(rgKachel("einstellungen")); }
      else await L.tipp(`#fuss [onclick="zeige('einstellungen')"]`); zeige("einstellungen", true); scrollTo(0, 0); L.ziel(); await L.warte(2500); } },
  { v: "start", vor: () => { rgKopf(); rgAnordnen(false); }, t: "✅ Fertig", x: () => einfach() ? "Das war's: Kopf einrollen und Kacheln anordnen. In der erweiterten Ansicht kannst du noch viel mehr – schau dir das Video dort noch einmal an. Probier es einfach aus!"
    : "Das war's: Kopf einrollen, blättern, Kacheln verschieben, verbergen und umdrehen, die Zahlen verstehen, Register anordnen und wischen. So gestaltest du dir deine Wunsch-Oberfläche – probier es einfach aus!" },
];
// KC-CLUB-ERKLAERVIDEOS-5 (2.269.0, Wunsch Hansi „prüfen, ob noch Schulungsvideos fehlen, und weiter erstellen“): Mein Dienst & Dienstplan,
// Mein Status, Protokolle & Dokumente, Meine Daten & Änderungen melden. Nur vorgeführt – nichts gespeichert, gemeldet oder als gelesen markiert;
// geöffnete Fenster gehen am Ende wieder zu, das Register wird zurückgestellt.
function rgReg(r) { if (!einfach() && reg !== r) { const alt = reg; register(r); RG.zurueck.push(() => { if (reg !== alt) register(alt); }); } }
function rgBlatt(id, oeffnen) { // dynamisches Fenster (blattAuf) für das Video öffnen – am Ende wieder zu
  for (const x of ["mdBlatt", "mdatBlatt", "aeBlatt", "rzBlatt", "smBlatt", "fiBlatt", "studioBlatt", "sbListeBlatt", "sbtBlatt"]) if (x !== id && $(x)) fensterZu($(x)); // 2.271.0: fensterZu – Fenster mit eigenem Schließen
  if (!$(id)) { oeffnen(); RG.zurueck.push(() => { if ($(id)) fensterZu($(id)); }); }
  $(id)?.classList.add("rg-zeigen");
}
function rgStatus(wahl) { // festes Fenster „Mein Status“ zeigen, auf Wunsch mit Beispiel – nie speichern
  if (!RG.stZurueck) { RG.stZurueck = true; RG.zurueck.push(() => { RG.stZurueck = false; $("statusBlatt").classList.add("versteckt"); $("statusBlatt").classList.remove("rg-zeigen"); }); }
  if ($("statusBlatt").classList.contains("versteckt")) statusBlatt();
  $("statusBlatt").classList.add("rg-zeigen");
  if (wahl) { statusWahl = wahl; statusBlatt2(); $("stBis").value = rgDatum(7); $("stHinweis").value = "Ab Montag bin ich wieder da"; }
}
const rgStatusZu = () => { $("statusBlatt")?.classList.add("versteckt"); $("statusBlatt")?.classList.remove("rg-zeigen"); };
const RG_DIENST = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="mein_dienst"]'], mussSel: true, t: "🗓️ Mein Dienst",
    x: "Alles zu deinem Dienst – zum Beispiel am Weihnachtsmarkt – findest du im Register Meins unter Mein Dienst.", live: async (L) => { await L.tipp('#raster .kachel[data-id="mein_dienst"]'); } },
  { v: "start", nur: () => einfach(), vor: () => rgKopf("ganz"), sel: ['#raster .kachel[data-id="meindienst"]', '#raster .kachel[data-id="dienstwunsch"]'], t: "🗓️ Dein Dienst",
    x: "In der einfachen Ansicht findest du deinen Dienstplan und die Dienstwünsche direkt als Kacheln auf der Startseite." },
  { v: "start", nur: () => !einfach(), vor: () => rgBlatt("mdBlatt", mdStart), sel: ["#mdBlatt .blatt-innen"], t: "1️⃣ 2️⃣ 3️⃣ In drei Schritten",
    x: "Hier steht alles auf einen Blick, in drei Schritten: Erst gibst du deine Wünsche ab. Dann plant der Planer den Dienstplan. Und am Ende zählt, was du wirklich gearbeitet hast." },
  { v: "start", nur: () => !einfach(), vor: () => rgBlatt("mdBlatt", mdStart), sel: ["#mdInhalt > .karte:nth-of-type(1)", "#mdBlatt"], t: "📝 Wünsche eintragen",
    x: "Mit Wünsche eintragen öffnet sich Twinkey und fragt dich Tag für Tag: Wann kannst du, wann lieber nicht? Zum Schluss tippst du auf Fertig – dann bekommst du eine Bestätigung mit allen Eingaben per E-Mail. Das ist deine Wunschplanung, noch nicht der fertige Dienstplan. Hier trage ich nichts ein.",
    live: async (L) => { await L.tipp("#mdInhalt > .karte:nth-of-type(1) .knopf.haupt"); } },
  { v: "start", nur: () => !einfach(), vor: () => rgBlatt("mdBlatt", mdStart), sel: ["#mdInhalt > .karte:nth-of-type(2)", "#mdBlatt"], t: "📅 Deine nächsten Dienste",
    x: "Darunter stehen deine nächsten Dienste, sobald der Planer sie veröffentlicht hat. Und ganz unten, was du gearbeitet hast – die Zeiten kommen von der Stempeluhr." },
  { v: "dienste", vor: () => { $("mdBlatt")?.remove(); }, sel: ["#v-dienste .dpnav"], t: "🗓️ Der Dienstplan",
    x: "Im Dienstplan blätterst du mit Woche vor und Woche zurück. Heute springt wieder zur aktuellen Woche.",
    live: async (L) => { await L.tipp("#v-dienste .dpnav .knopf:last-child"); dpWoche(1); await L.warte(1800); await L.tipp("#v-dienste .dpnav .knopf:first-child"); dpWoche(-1); } },
  { v: "dienste", sel: ["#dpPersonen", 'details[data-klappe="dp_wer"]'], t: "👥 Zeiten vergleichen", // 2.411.0: zugeklappt → Kopf des Klappbereichs
    x: "Oben tippst du Namen an, um Dienstzeiten zu vergleichen – gold heißt: gleichzeitig im Dienst. Andere sehen deine Zeiten nur, wenn du das ganz unten erlaubst." },
  { v: "dienste", sel: ["#dpUebersicht"], puls: ["#dpUebersicht"], mussSel: true, nach: () => $("dvBlatt")?.remove(), t: "📊 Wer kann wann?", // 2.508.0
    x: "Oben rechts der Knopf mit dem Balkendiagramm: die Dienstzeiten-Übersicht. Vorne die Namen, oben die Tage, farbige Balken – wann jemand kann, lieber möchte oder gesperrt ist. Du siehst deine Zeiten und die der Mitglieder, die sie freigegeben haben. Den Knopf gibt es auch bei Mein Dienst und in den Dienstwünschen.",
    live: async (L) => { await L.tipp("#dpUebersicht"); dvStart(); await L.warte(3500); $("dvBlatt")?.remove(); } },
  { v: "dienste", t: "✅ Fertig", x: "Das war's: Wünsche abgeben, Dienstplan ansehen, Zeiten vergleichen und die Übersicht. Fragen zum Dienst? Frag einfach Twinkey." },
];
const RG_STATUS = [
  { v: "start", vor: () => { rgKopf("offen"); rgStatusZu(); }, sel: ["#statusChip"], puls: ["#statusChip"], t: "🟢 Dein Status",
    x: "Oben im Kopf steht dein Status – zum Beispiel verfügbar. So sehen die anderen, ob du gerade erreichbar bist. Antippen, und du kannst ihn ändern.",
    live: async (L) => { await L.tipp("#statusChip"); rgStatus(); L.ziel(); } },
  { v: "start", vor: () => rgStatus(), sel: ["#statusBlatt .liste"], t: "📋 Was passt gerade?",
    x: "Wähle, was gerade passt: verfügbar, beschäftigt, im Urlaub, krank oder nicht erreichbar." },
  { v: "start", vor: () => rgStatus("urlaub"), sel: ["#stExtra", "#statusBlatt .liste"], t: "🏖️ Zum Beispiel Urlaub",
    x: "Bei Urlaub gibst du auf Wunsch ein, bis wann – und einen kurzen Hinweis, zum Beispiel: Ab Montag bin ich wieder da. Die anderen sehen das bei deinem Namen.",
    live: async (L) => { await L.tipp(() => [...document.querySelectorAll("#statusBlatt .liste .knopf")].find((b) => /Urlaub/.test(b.textContent))); } },
  { v: "start", vor: () => rgStatus("urlaub"), sel: ['#statusBlatt [onclick="statusSpeichern()"]'], t: "💾 Speichern",
    x: "Mit Speichern ist dein Status gesetzt. Hier speichere ich nichts – dein Status bleibt, wie er ist." },
  { v: "start", vor: () => rgStatusZu(), sel: ["#statusChip"], t: "✅ Fertig",
    x: "Ist der Urlaub vorbei, stellst du einfach wieder verfügbar ein. Das geht auch unter Meins, Kachel Mein Status." },
];
const RG_LESEN = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("verein"); }, sel: ['#raster .kachel[data-id="protokolle"]'], mussSel: true, t: "📄 Protokolle",
    x: "Die Protokolle der Clubsitzungen findest du im Register Club unter Protokolle.", live: async (L) => { await L.tipp('#raster .kachel[data-id="protokolle"]'); } },
  { v: "protokolle", sel: ["#protokollListe"], t: "📄 Nachlesen",
    x: "Hier stehen alle Protokolle. Neue sind markiert, bis du sie geöffnet hast. Antippen öffnet ein Protokoll – zum Lesen und Drucken. Hier öffne ich keins." },
  { v: "protokolle", sel: ["#prFilterKnopf", "#prAnsichtKnopf"], puls: ["#prAnsichtKnopf", "#prFilterKnopf"], t: "🔎 Ansicht und Filter",
    x: "Oben wechselst du zwischen Liste und Kacheln. Mit dem Filter suchst du nach Jahr, Monat, Ort oder Protokollführer. Ältere Protokolle stehen auch im Archiv." },
  { v: "dokumente", sel: ["#dokRaster"], t: "📚 Meine Dokumente",
    x: "Unter Meine Dokumente liegen Anleitungen – zum Beispiel die Bedienungsanleitung der App. Antippen, ansehen, drucken oder teilen. Mit dem Pfeil oben links geht es zurück." },
  { v: "dokumente", t: "✅ Fertig", x: "Protokolle zum Nachlesen, Anleitungen zum Ausdrucken – alles an einem Ort, und nichts geht verloren." },
];
const RG_DATEN = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="meinedaten"]'], mussSel: true, t: "🔐 Meine Daten",
    x: "Was der Club über dich gespeichert hat, siehst du im Register Meins unter Meine Daten.", live: async (L) => { await L.tipp('#raster .kachel[data-id="meinedaten"]'); } },
  { v: "start", vor: () => rgBlatt("mdatBlatt", mdatStart), sel: ["#mdatBlatt .blatt-innen"], t: "👀 Alles auf einen Blick",
    x: "Hier steht alles, was über dich gespeichert ist – nur du siehst diese Übersicht. Du kannst sie drucken oder als Datei sichern." },
  { v: "start", vor: () => rgBlatt("mdatBlatt", mdatStart), sel: ["#mdatInhalt .na-pfeil-knoepfe"], t: "✏️ Stimmt etwas nicht?",
    x: "Hat sich etwas geändert, tippst du auf Änderung melden.", live: async (L) => { await L.tipp("#mdatInhalt .na-pfeil-knoepfe .knopf.haupt"); rgBlatt("aeBlatt", aeStart); L.ziel(); } },
  { v: "start", vor: () => rgBlatt("aeBlatt", aeStart), sel: ["#aeBlatt .ae-wahl", "#aeBlatt .blatt-innen"], t: "📮 Was hat sich geändert?",
    x: "Tippe an, was sich geändert hat – zum Beispiel Anschrift, Telefon, E-Mail oder Kleidergröße. Die Meldung geht automatisch an die Richtigen im Club. Hier melde ich nichts." },
  { v: "start", vor: () => rgBlatt("aeBlatt", aeStart), t: "✅ Fertig",
    x: "Unter Meine letzten Meldungen siehst du, was daraus geworden ist. Hast du Rückfragen, schreibst du direkt dem, der deine Meldung bearbeitet." },
];
// KC-CLUB-ERKLAERVIDEOS-6 (2.270.0, Wunsch Hansi „weiter mit Rezeptbuch, Schulung und Feedback“). Nur vorgeführt: kein Rezept angelegt,
// keine Portionen gemerkt, kein Schulungstermin gewählt, kein Feedback geschickt; Fenster und Feedback-Schritt am Ende zurück.
function rgRezept(an) { // Rezeptbuch öffnen; an = erstes Rezept aufschlagen (Portionen nur angezeigt, nicht gespeichert)
  rgBlatt("rzBlatt", rzStart);
  if (an) { const id = RZ.liste?.[0]?.id; if (id && RZ.offen !== id) rzZeigen(id); } else if (RZ.offen && $("rzInhalt")) rzListeZeigen();
}
function rgFeedback(schritt) { // Feedback-Schritt nur anzeigen (Antworten bleiben, wie sie sind) – am Ende zurück
  if (typeof FB === "undefined" || !FB || !$("feedbackInhalt")) return;
  if (RG.fbAlt === undefined || RG.fbAlt === null) { RG.fbAlt = FB.schritt; RG.zurueck.push(() => { if (FB && RG.fbAlt !== null) { FB.schritt = RG.fbAlt; if ($("feedbackInhalt")) fbZeigen(); } RG.fbAlt = null; }); }
  if (FB.schritt !== schritt) { FB.schritt = schritt; fbZeigen(); }
}
const RG_REZEPTE = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("verein"); }, sel: ['#raster .kachel[data-id="rezepte"]'], mussSel: true, t: "📖 Das Club-Rezeptbuch",
    x: "Im Register Club findest du das Rezeptbuch – die Rezepte aus dem Köcheclub, zum Nachkochen und Teilen.", live: async (L) => { await L.tipp('#raster .kachel[data-id="rezepte"]'); } },
  { v: "start", vor: () => rgRezept(false), sel: ["#rzInhalt .rz-liste", "#rzBlatt .blatt-innen"], t: "🔍 Suchen und stöbern",
    x: "Oben suchst du nach einem Rezept oder einer Zutat – zum Beispiel Kürbis. Mit den Knöpfen darunter wählst du eine Art, etwa Vorspeisen oder Desserts." },
  { v: "start", vor: () => rgRezept(true), sel: ["#rzInhalt .ps-schritt", "#rzBlatt .blatt-innen"], mussSel: true, t: "🍽️ Für wie viele?",
    x: "Ein Rezept antippen – schon steht es da. Bei Portionen stellst du ein, für wie viele du kochst: Die Mengen rechnen sich von selbst um. Ich stelle einmal auf zehn.",
    live: async (L) => { const r = RZ.liste?.[0]; await L.tipp(() => [...document.querySelectorAll("#rzInhalt .hl-chips .chip")].find((c) => c.textContent.trim() === "10")); if (r && RZ.offen === r.id) { RZ.port = 10; rzZeigen(r.id); } } },
  { v: "start", vor: () => rgRezept(true), sel: ["#rzInhalt .ps-schritt:nth-of-type(2)", "#rzBlatt .blatt-innen"], mussSel: true, t: "🧺 Zutaten abhaken",
    x: "Beim Kochen tippst du jede Zutat an, die du schon hast – sie wird durchgestrichen. Darunter steht die Zubereitung." },
  { v: "start", vor: () => rgRezept(true), sel: ["#rzInhalt .na-pfeil-knoepfe:last-child", "#rzBlatt .blatt-innen"], mussSel: true, t: "🛒 Einkaufsliste, Drucken, Teilen",
    x: "Mit Einkaufsliste kommen die Zutaten auf deinen Einkaufszettel. Du kannst das Rezept auch drucken oder per WhatsApp teilen." },
  { v: "start", vor: () => rgRezept(false), sel: ['#rzInhalt [onclick="rzForm()"]', "#rzBlatt .blatt-innen"], t: "＋ Eigenes Rezept",
    x: "Und mit Neues Rezept trägst du dein eigenes ein – mit Foto, Zutaten und Zubereitung. Dann haben alle im Club etwas davon. Hier lege ich nichts an." },
];
const RG_SCHULUNG = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="schulungen"]'], mussSel: true, t: "🎓 Meine Schulung",
    x: "Hansi zeigt dir die App gern persönlich. Unter Meins, Kachel Meine Schulung, findest du deine Einladung.", live: async (L) => { await L.tipp('#raster .kachel[data-id="schulungen"]'); } },
  { v: "start", vor: () => rgBlatt("smBlatt", smStart), sel: ["#smInhalt", "#smBlatt .blatt-innen"], t: "📅 Termin aussuchen",
    x: "Lädt Hansi dich ein, stehen hier freie Termine. Du suchst dir einen aus – bei dir zu Hause oder bei Hansi. Wer zuerst wählt, bekommt den Termin. Hier wähle ich nichts." },
  { v: "start", vor: () => rgBlatt("smBlatt", smStart), sel: ["#smInhalt", "#smBlatt .blatt-innen"], t: "💬 Kein Termin passt?",
    x: "Passt keiner, tippst du auf Kein Termin passt und schlägst selbst einen vor. Hansi bestätigt deinen Termin, und du bekommst Bescheid." },
  { v: "start", vor: () => rgBlatt("smBlatt", smStart), sel: ['#smBlatt .tw-nicht', "#smBlatt .blatt-innen"], t: "📄 Zusammenfassung",
    x: "Nach der Schulung bekommst du eine Zusammenfassung zum Nachlesen. Du findest sie hier unten – und im Archiv." },
];
const RG_FEEDBACK = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("verein"); }, sel: ['#raster .kachel[data-id="feedback"]'], mussSel: true, t: "💭 Deine Meinung zählt",
    x: "Was gefällt dir, was stört, was fehlt? Im Register Club unter Feedback sagst du es Hansi – das hilft, die App besser zu machen.", live: async (L) => { await L.tipp('#raster .kachel[data-id="feedback"]'); } },
  { v: "feedback", vor: () => rgFeedback(1), sel: ["#feedbackInhalt", "#v-feedback"], t: "👆 Einfach antippen",
    x: "In drei kurzen Schritten tippst du deine Antworten an. Alles ist freiwillig – du kannst auch Fragen auslassen.", live: async (L) => { await L.warte(500); rgFeedback(1); L.ziel(); } }, // Fragen kommen evtl. erst vom Server
  { v: "feedback", vor: () => rgFeedback(3), sel: ["#fbIdee", "#fbMitteilung", "#feedbackInhalt"], t: "💡 Ideen und Wünsche",
    x: "Im letzten Schritt schreibst du deine Ideen oder eine Mitteilung an Hansi – gern auch mit dem Mikrofon gesprochen.", live: async (L) => { await L.warte(500); rgFeedback(3); L.ziel(); } },
  { v: "feedback", vor: () => rgFeedback(3), sel: [() => $("fbAnonym")?.closest("label") || $("fbAnonym"), "#feedbackInhalt"], t: "🕶️ Auch ohne Namen",
    x: "Möchtest du lieber unerkannt bleiben, hakst du ohne Namen an. Mit Absenden ist es bei Hansi – und du kannst deine Antworten später jederzeit ändern. Hier schicke ich nichts.", live: async (L) => { await L.warte(500); rgFeedback(3); L.ziel(); } },
  { v: "feedback", t: "✅ Danke!", x: "Jede Rückmeldung hilft. Was schon umgesetzt wurde, siehst du auch hier im Feedback." },
];
// KC-CLUB-ERKLAERVIDEOS-7 (2.271.0, Wunsch Hansi „mach die restlichen Videos auch noch“): Aktionen & Reisen, Fit bleiben, Studio, Technik
// (Update, Sicherheits-Check, Test an mich, Programme). Nur vorgeführt: keine Anmeldung, kein Training gestartet, kein Live-Zeigen,
// keine Test-Nachricht; Fenster am Ende zu (mit ihrem eigenen Schließen), Register zurück.
const RG_AKTIONEN = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("verein"); }, sel: ['#raster .kachel[data-id="aktionen"]'], mussSel: true, t: "🧳 Aktionen & Reisen",
    x: "Ausflüge und Reisen des Clubs findest du im Register Club unter Aktionen.", live: async (L) => { await L.tipp('#raster .kachel[data-id="aktionen"]'); } },
  { v: "aktionen", sel: ["#aktionListe"], t: "🗺️ Was steht an?",
    x: "Hier stehen die kommenden Aktionen – mit Datum und wie viele Tage es noch sind. Ist eine vorbei, findest du sie mit ihren Fotos im Archiv." },
  { v: "aktionen", sel: ["#aktionListe"], t: "👆 Alle Einzelheiten",
    x: "Tippst du eine Aktion an, siehst du alles: den Reiseverlauf, wer dabei ist, den Preis pro Person und den Veranstalter mit Telefonnummer. Dazu deine eigene Reise-Checkliste zum Abhaken und die Fotos." },
  { v: "aktionen", t: "✅ Fertig", x: "So bist du bei jedem Ausflug gut vorbereitet. Fragen zur Reise? Schreib einfach der Clubleitung." },
];
const RG_FIT = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="fitness"]'], mussSel: true, t: "🏋️ Fit bleiben",
    x: "Ein paar Minuten Bewegung am Tag tun gut. Unter Meins, Fit bleiben, macht Twinkey dir die Übungen vor.", live: async (L) => { await L.tipp('#raster .kachel[data-id="fitness"]'); } },
  { v: "start", vor: () => rgBlatt("fiBlatt", () => fiStart("training")), sel: [".fi-hinweis", "#fiInhalt"], t: "🩺 Bitte kurz lesen",
    x: "Ganz wichtig: Mach nur so viel, wie es dir angenehm ist. Bei Schmerzen, Schwindel oder Atemnot sofort aufhören. Erst wenn du den Hinweis mit Verstanden bestätigt hast, geht es los." },
  { v: "start", vor: () => rgBlatt("fiBlatt", () => fiStart("training")), sel: ["#fiInhalt .ps-schritt", "#fiInhalt"], t: "⚙️ Stufe und Dauer",
    x: "Wähle eine Stufe – Sanft, ganz im Sitzen, Mittel oder Fordernd – und wie lange du trainieren möchtest. Twinkey sagt die Übungen auf Wunsch an." },
  { v: "start", vor: () => rgBlatt("fiBlatt", () => fiStart("training")), sel: [".fi-los", "#fiInhalt"], t: "▶️ Los geht's",
    x: "Mit Los geht's turnt Twinkey dir jede Übung vor – schau hin und mach in deinem Tempo mit. Hier starte ich kein Training." },
  { v: "start", vor: () => rgBlatt("fiBlatt", () => fiStart("training")), sel: ["#fiTabs"], t: "📊 Auswertung",
    x: "Unter Auswertung siehst du, wie oft du schon trainiert hast. Das sieht nur du.", live: async (L) => { await L.tipp(() => [...document.querySelectorAll("#fiTabs .chip")].find((c) => /Auswertung/.test(c.textContent))); } },
];
const RG_STUDIO = [
  { v: "start", nur: () => !einfach() && !ICH?.admin, vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="studio"]'], mussSel: true, t: "🎬 Das Studio",
    x: "Mit dem Studio zeigst du einem anderen Mitglied live deine App – zum Beispiel, um etwas zu erklären. Du findest es unter Meins.", live: async (L) => { await L.tipp('#raster .kachel[data-id="studio"]'); } },
  { v: "start", vor: () => rgBlatt("studioBlatt", () => stOeffnen()), sel: ["#stdInhalt", "#studioBlatt .blatt-innen"], t: "👥 Mitglied wählen",
    x: "Zuerst suchst du das Mitglied aus, dem du etwas zeigen möchtest. Dann tippst du auf Live zeigen – dein Gegenüber muss zustimmen." },
  { v: "start", vor: () => rgBlatt("studioBlatt", () => stOeffnen()), sel: ["#studioBlatt .blatt-innen"], t: "🙈 Sicher zeigen",
    x: "Dein Gegenüber sieht dann live, was du in der Club-App machst. Chats, Nachrichten und das Büro sind dabei automatisch verdeckt. Mit dem Vorhang verdeckst du jederzeit kurz alles. Nach höchstens 30 Minuten ist Schluss – und beide können vorher beenden. Hier starte ich nichts." },
];
const RG_TECHNIK = [
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("programme"); }, sel: ['#raster .kachel[data-id="update"]'], mussSel: true, t: "🔄 Update prüfen",
    x: "Im Register Technik steht, welche Version du hast. Neue Versionen holt die App beim Öffnen von selbst. Steht hier Neu, tippst du einfach darauf.", live: async (L) => { await L.tipp('#raster .kachel[data-id="update"]'); } },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#kopfVersion"], puls: ["#kopfVersion"], t: "🔢 Version oben",
    x: "Auch oben unter der Kochmütze steht die Versionsnummer. Antippen prüft ebenfalls, ob es etwas Neues gibt." },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("programme"); }, sel: ['#raster .kachel[data-id="sicherheit"]'], mussSel: true, t: "🛡️ Sicherheits-Check",
    x: "Der Sicherheits-Check prüft, ob deine Verbindung sicher und schnell ist.", live: async (L) => { await L.tipp('#raster .kachel[data-id="sicherheit"]'); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("programme"); }, sel: ['#raster .kachel[data-id="sicherheit"]'], mussSel: true, t: "✅ Alles sicher?",
    x: "Tippst du darauf, prüft die App Schritt für Schritt: verschlüsselte Verbindung, dein Zugang, der Server – und wie schnell alles antwortet. Grün heißt: alles in Ordnung. Hier starte ich keine Prüfung." },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: ['#raster .kachel[data-id="test"]'], mussSel: true, t: "🧪 Test an mich",
    x: "Mit Test an mich schickst du dir selbst eine Probe-Nachricht. So siehst du, ob Push und E-Mail bei dir ankommen. Hier schicke ich nichts." },
  { v: "programme", sel: ["#progRaster"], t: "💻 Freigegebene Programme",
    x: "Unter Freigegebene Programme stehen weitere Programme des Clubs – zum Beispiel die Kassen-Schulung. Antippen öffnet sie in einem neuen Fenster." },
  { v: "programme", t: "✅ Fertig", x: "Das war die Technik. Läuft mal etwas nicht rund, hilft oft schon: App ganz schließen und neu öffnen – oder frag Twinkey." },
];
// KC-CLUB-ERKLAERVIDEOS-8 (2.272.0, Wunsch Hansi): Spezial-Video „Versteckte Helfer“ (Sonderfunktionen, die man leicht übersieht),
// „Kommunikationszentrale“ und „Sprachsteuerung komplett“. Nur vorgeführt: nichts gespeichert, gesendet, angerufen oder eingeschaltet;
// Kopf, Info-Feld, Nacht-Vorschau, „Was kann ich antippen?“ und geöffnete Fenster werden am Ende zurückgestellt.
const rgOb = (titel, n = 0) => RG_OBERFLAECHE.filter((s) => s.t === titel)[n] || null; // Stationen aus „Oberfläche nach Wunsch“ wiederverwenden
function rgInfoKarte(id) { rgInfo(); const i = INFO_FELDER.findIndex((f) => f.id === id); if (i >= 0 && INFO_I !== i) infoGehe(i); }
function rgKlick(an) { // „👆 Was kann ich antippen?“ nur vorführen – am Ende aus
  if (an && !RG.klickZurueck) { RG.klickZurueck = true; RG.zurueck.push(() => { RG.klickZurueck = false; if (document.body.classList.contains("klick-zeigen")) klickZeigen(false); }); }
  if (document.body.classList.contains("klick-zeigen") !== !!an) klickZeigen(!!an);
}
function rgFest(id, an) { // festes Fenster (z. B. Verbindung) für das Video zeigen bzw. schließen
  const f = $(id); if (!f) return;
  if (an && !RG["fest_" + id]) { RG["fest_" + id] = true; RG.zurueck.push(() => { RG["fest_" + id] = false; f.classList.add("versteckt"); f.classList.remove("rg-zeigen"); }); }
  if (an) f.classList.add("rg-zeigen"); else { f.classList.add("versteckt"); f.classList.remove("rg-zeigen"); }
}
function rgKachelDemo(stufe) { // nur vorgeführt: Kachelgröße am Raster zeigen (stufe null = wieder wie eingestellt); gespeichert wird nichts
  if (stufe && !RG.kachelDemo) RG.zurueck.push(() => { RG.kachelDemo = null; try { kachelnZeigen(); } catch (e) { /* nur Anzeige */ } });
  RG.kachelDemo = stufe || null; // kachelnZeigen() nimmt während des Videos diese Größe statt der gespeicherten
  try { kachelnZeigen(); } catch (e) { /* nur Anzeige */ }
}
const RG_SPEZIAL = [
  { v: "start", vor: () => { rgKopf("offen"); rgKlick(false); }, t: "🔎 Versteckte Helfer",
    x: "In der App stecken viele kleine Helfer, die man leicht übersieht. Ich zeige sie dir der Reihe nach. Alles ist nur ein Angebot – nichts davon musst du benutzen." },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#v-start .kopflogo .logo"], puls: ["#v-start .kopflogo .logo"], t: "👨‍🍳 Die Kochmütze",
    x: "Die Kochmütze oben links führt zur Internetseite des Köcheclubs. Die gibt es zurzeit noch nicht – sobald sie fertig ist, kommst du hier mit einem Tipp hin.", live: async (L) => { await L.tipp("#v-start .kopflogo .logo"); } },
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("offen"), sel: ["#modusKnopf"], puls: ["#modusKnopf"], video: "anpassen", t: "🌙 Tag und Nacht",
    x: "Rechts oben der Mond- und Sonnen-Knopf: Jeder Tipp schaltet reihum. A heißt Automatik – abends wird die App von selbst dunkel. T heißt immer Tag, N immer Nacht. Das kleine Schild am Knopf zeigt, was gerade gilt." },
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("offen"), demo: { nacht: true }, sel: ["#v-start .hero"], t: "🌙 So sieht Nacht aus",
    x: "So sieht die App bei Nacht aus – angenehm für die Augen im Dunkeln. Ich schalte gleich wieder zurück; deine Einstellung bleibt, wie sie ist.", live: async (L) => { await L.tipp("#modusKnopf"); } },
  rgOb("⌃ Halb einrollen"), rgOb("⌃⌃ Ganz einrollen"), rgOb("‹ › Pfeile links und rechts"),
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("offen"); rgInfo(); }, sel: ["#heroInfo"], mussSel: true, t: "« » Ganz an den Anfang oder ans Ende",
    x: "Unter den einfachen Pfeilen sitzt jeweils ein Doppelpfeil. Damit springst du sofort zur ersten oder zur letzten Karte im Info-Feld.",
    live: async (L) => { await L.tipp("#heroInfo .ipfeil.rechts.sprung"); infoSpringen(1); L.ziel(); await L.warte(2000); await L.tipp("#heroInfo .ipfeil.links.sprung"); infoSpringen(-1); L.ziel(); } },
  { v: "start", vor: () => { rgKopf("offen"); rgInfo(); }, sel: ["#infoPunkte"], mussSel: true, t: "🟡 Die Pünktchen darunter",
    x: "Unter dem Info-Feld stehen kleine Pünktchen. Das gelbe zeigt, wo du gerade bist. Tippst du ein anderes an, springst du direkt zu dieser Karte.",
    live: async (L) => { await L.tipp("#infoPunkte .ipunkt:nth-child(2)"); infoGehe(1); L.ziel(); await L.warte(1500); await L.tipp("#infoPunkte .ipunkt:nth-child(1)"); infoGehe(0); } },
  { v: "start", vor: () => { rgKopf("offen"); rgInfo(); }, sel: ["#heroInfo"], mussSel: true, t: "👆 Im Kopf wischen",
    x: "Statt der Pfeile kannst du auch einfach über das Info-Feld wischen – nach links für die nächste Karte, nach rechts für die vorige.",
    live: async (L) => { await L.wischen("#heroInfo", 1); rgInfo(1); L.ziel(); await L.warte(1500); await L.wischen("#heroInfo", -1); rgInfo(-1); } },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#leds", "#v-start .statusleiste"], mussSel: true, t: "💡 Das Lämpchen",
    x: "In der Statusleiste zeigt ein Lämpchen, ob die App Verbindung hat – grün heißt alles gut. Antippen öffnet die Anzeige mit einem kurzen Test.",
    live: async (L) => { await L.tipp("#leds"); if (!ICH?.admin) { vbEinfachZeigen(); $("verbindungBlatt").classList.remove("versteckt"); rgFest("verbindungBlatt", true); L.ziel(); } },
    nach: () => rgFest("verbindungBlatt", false) },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#sparZeichen", "#v-start .statusleiste"], t: "🐌 🐢 Kleine Zeichen",
    x: "Manchmal tauchen oben kleine Tiere auf. Eine Schnecke heißt: Das Netz ist gerade langsam – bitte etwas Geduld und nicht mehrfach tippen. Eine Schildkröte heißt: Der Sparmodus ist an, die App spart Akku. Antippen erklärt beides." },
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("ganz"), sel: [".sz-link"], puls: [".sz-link"], t: "⚡ Das Wort „Schnellzugriff“",
    x: "Das Wort Schnellzugriff über den Kacheln ist selbst ein Knopf: Antippen zeigt oben im Info-Feld deine Schnellstart-Symbole – ein Tipp, und es geht sofort los.",
    live: async (L) => { await L.tipp(".sz-link"); rgKopf("offen"); rgInfoKarte("schnellstart"); L.ziel(); } },
  // 2.292.0 KC-CLUB-ESELSOHR: Eselsohr zeigen, Rückseite vorführen (danach wieder vorne)
  { v: "start", nur: () => esAn(), vor: () => { rgKopf("offen"); esEinsetzen(); }, sel: ["#eselsohr"], mussSel: true, puls: ["#eselsohr"], video: "rueckseite", t: "📄 Das Eselsohr",
    x: "Unten rechts am Kopf ist eine Ecke umgeknickt – das Eselsohr. Tippst du doppelt darauf, dreht sich der ganze Kopf um wie ein Blatt Papier. Nach links ziehen geht auch.",
    live: async (L) => { await L.wischen("#eselsohr", 1); } },
  { v: "start", nur: () => esAn(), vor: () => { rgKopf("offen"); if (!RG.esZurueck) { RG.esZurueck = true; RG.zurueck.push(() => { RG.esZurueck = false; esDrehen(false, true); }); } esDrehen(true, true).then(() => esTab("uhr")); },
    sel: ["#heroRueck"], mussSel: true, t: "🕰️ Die Rückseite",
    x: "Auf der Rückseite ist viel Platz: eine Diashow mit den Fotos aus dem Fotoalbum, eine Tafel und ein Flipchart zum Skizzieren – mit Umblättern, Speichern und Verschicken –, eine große Uhr in vier Stilen und die Bühne, auf der Twinkey mit Musik Bewegungsübungen vormacht, mit Reglern für Musik und Stimme. Alles genau zeigt das eigene Video „Die Rückseite“. Doppelt aufs Eselsohr tippen dreht den Kopf zurück.",
    live: async (L) => { await L.tipp('#heroRueck [data-tab="tafel"]'); esTab("tafel"); L.ziel(); await L.warte(2000); await L.tipp('#heroRueck [data-tab="dia"]'); esTab("dia"); L.ziel(); await L.warte(2000); await L.tipp("#heroRueck .eselsohr", "doppelt"); },
    nach: () => esDrehen(false, true) },
  rgOb("👆 Lange drücken"), rgOb("✋ Verschieben"), rgOb("✅ Fertig", 0), rgOb("🔄 Kachel umdrehen"), rgOb("🗂️ Register anordnen"), rgOb("👆 Wischen"),
  // 2.291.0 KC-CLUB-VIDEO-KACHELGROESSE (Wunsch Hansi): Kachelgröße 3 × 3 / 4 × 4 – Einstellung zeigen, dann auf der Startseite vorführen
  { v: "einstellungen", nur: () => !einfach(), vor: () => rgAuf("startseite"), tippVor: () => { const d = document.querySelector(rgKlappe("startseite")); return d && !d.open ? d.querySelector(":scope > summary") : null; },
    sel: ["#kachelGroesseWahl"], mussSel: true, puls: ['#kachelGroesseWahl [data-g="klein"]', '#kachelGroesseWahl [data-g="mini"]'], t: "🔲 Kacheln: 2, 3 oder 4 nebeneinander",
    x: "Wie groß die Kacheln auf der Startseite sind, stellst du in den Einstellungen unter Startseite und Ansicht ein: Normal – zwei nebeneinander, Klein – drei nebeneinander, also 3 mal 3, oder Sehr klein – vier nebeneinander, also 4 mal 4. So passen mehr Kacheln auf einen Blick. Das gilt in der erweiterten Ansicht und nur für dieses Gerät.",
    live: async (L) => { await L.tipp('#kachelGroesseWahl [data-g="klein"]'); await L.warte(1500); await L.tipp('#kachelGroesseWahl [data-g="mini"]'); } },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgKachelDemo("klein"); }, sel: ["#raster"], mussSel: true, t: "▦ So sieht 3 × 3 aus",
    x: "Mit Klein stehen drei Kacheln nebeneinander – mit Symbol, Name und einer kurzen Zeile darunter." },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgKachelDemo("mini"); }, sel: ["#raster"], mussSel: true, t: "▪ So sieht 4 × 4 aus",
    x: "Mit Sehr klein stehen vier nebeneinander – nur noch Symbol und Name. Per Sprache geht es auch: Kachelgröße 4 mal 4. Ich stelle gleich zurück, deine Einstellung bleibt, wie sie ist.",
    nach: () => rgKachelDemo(null) },
  { v: "start", vor: () => { rgKopf("ganz"); rgDrehen(false); }, sel: ["#ansichtKnopf", ".ansichtname"], puls: ["#ansichtKnopf"], t: "🔧 Erweiterte Ansicht",
    x: "Ganz unten auf der Startseite steht der Knopf Erweiterte Ansicht – damit siehst du alle Funktionen. Zurück geht es genauso mit Einfache Ansicht. Oben neben Schnellzugriff steht, welche Ansicht gerade gilt; antippen wechselt ebenfalls." },
  { v: "start", vor: () => { rgKopf("ganz"); rgKlick(false); }, sel: ["#suLupe"], puls: ["#suLupe"], t: "🔍 Die Lupe",
    x: "Die Lupe unten rechts findet alles: Nachrichten, Termine, Archiv, Pinnwand – schon ab zwei Buchstaben. Mit Filter suchst du gezielter.", live: async (L) => { await L.tipp("#suLupe"); } },
  { v: "start", vor: () => rgKlick(false), sel: ["#klickZeigenKnopf"], puls: ["#klickZeigenKnopf"], t: "👆 Was kann ich antippen?",
    x: "Die Hand über dem Fragezeichen zeigt dir alles, was man antippen kann – es wird rot umrandet. Antippen funktioniert dabei ganz normal. Nochmal auf die Hand, und es ist wieder aus.",
    live: async (L) => { await L.tipp("#klickZeigenKnopf"); rgKlick(true); await L.warte(3500); await L.tipp("#klickZeigenKnopf"); rgKlick(false); } },
  { v: "start", vor: () => rgKlick(false), sel: ["#hzFrage"], puls: ["#hzFrage"], t: "❓ Das Fragezeichen",
    x: "Das Fragezeichen öffnet die Hilfe genau zu dem Bereich, in dem du gerade bist. Stört es dich, hältst du es lange fest – dann kannst du es ausblenden und in den Einstellungen jederzeit zurückholen.",
    live: async (L) => { await L.tipp("#hzFrage", "lang"); } },
  { v: "einstellungen", vor: () => rgAuf("schnellstart"), tippVor: () => { const d = document.querySelector(rgKlappe("schnellstart")); return d && !d.open ? d.querySelector(":scope > summary") : null; },
    sel: [rgKlappe("schnellstart")], mussSel: true, t: "⚙️ Schnellstart einrichten",
    x: "Welche Symbole im Schnellstart stehen, bestimmst du in den Einstellungen unter Schnellstart: bis zu acht antippen – die Reihenfolge ist die Reihenfolge des Antippens. Nochmal tippen entfernt eins wieder." },
  { v: "start", vor: () => { rgKopf("offen"); rgKlick(false); }, t: "✅ Fertig",
    x: "Das waren die versteckten Helfer. Noch mehr gibt es in den Videos Kommunikationszentrale, Sprachsteuerung und Effekte und Wetter. Und denk dran: Alles nur Möglichkeiten – nutze, was dir gefällt." },
].filter(Boolean);
function rgZe(an) { // Kommunikationszentrale zeigen; Auswahl und Text nur vorgeführt, am Ende wie vorher
  if (an && !RG.zeAlt) { RG.zeAlt = JSON.parse(JSON.stringify({ personen: ZE.personen, gruppe: ZE.gruppe, text: ZE.text, wege: ZE.wege }));
    RG.zurueck.push(() => { const a = RG.zeAlt; RG.zeAlt = null; Object.assign(ZE, a); if (INFO_FELDER[INFO_I]?.id === "zentrale") heroZeigen(0); }); }
  rgKopf("offen"); rgInfoKarte("zentrale");
}
const rgZeAn = () => INFO_FELDER.some((f) => f.id === "zentrale");
// ---------- 2.300.0 KC-CLUB-VIDEO-RUECKSEITE (Wunsch Hansi „eigenes Video über die Rückseite des grünen Kopfbereichs“) ----------
// Der Kopf bleibt während des ganzen Videos umgedreht (Zurückdrehen erst am Ende über RG.zurueck); die Bühne wird nur als Bild gezeigt –
// ohne Musik, ohne Ansage, ohne Uhrwerk (BW.lauf wird nach jeder Station wieder geleert, sonst würde esStop() die Video-Stimme abbrechen).
function rgRueck(tab) {
  rgKopf("offen"); esEinsetzen();
  if (!RG.esZurueck) { RG.esZurueck = true; RG.zurueck.push(() => { RG.esZurueck = false; BW.lauf = null; esDrehen(false, true); }); }
  if (!ES.offen) esDrehen(true, true); // „sofort“ läuft ohne Warten durch – die Station findet ihr Ziel gleich danach
  if (tab) esTab(tab);
}
function rgBuehneVorfuehren() { // laufende Bühne nur zeigen: Küchen-Übung, Regler, Leiste – nichts läuft, nichts wird gespeichert
  rgRueck("buehne"); { const plan = bwPlan("kueche", 5);
    BW.lauf = { plan, i: 0, phase: "uebung", rest: 18, pause: false, musik: false, ansage: false, sek: 0, lob: 0, sprueche: 0, farbe: 2, warte: 0 };
    BW.blase = "Hättest du nicht so viel am Pudding genascht, bräuchten wir das jetzt nicht machen!"; BW.sprechZeit = Date.now(); bwLaufZeigen(); BW.lauf = null; }
  if (!RG.bwZurueck) { RG.bwZurueck = true; RG.zurueck.push(() => { RG.bwZurueck = false; bwTrainingKnoepfe(false); }); } // 2.348.0: Lupe, ? und Mikro nach dem Video wieder da
}
function rgUhrVorfuehren(L) { // alle vier Uhren kurz zeigen, danach wieder die eigene
  const alt = esLies("uhr", "digital"); let i = 0;
  return (async () => { try { for (const [k] of ES_UHREN) { esSchreib("uhr", k); esUhrZeigen($("hrFlaeche")); L.ziel(); await L.warte(i++ ? 1700 : 1200); } } finally { esSchreib("uhr", alt); esUhrZeigen($("hrFlaeche")); } })();
}
const RG_RUECKSEITE = [
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, sel: ["#eselsohr"], mussSel: true, puls: ["#eselsohr"], t: "📄 Das Eselsohr",
    x: "Unten rechts im grünen Kopf ist eine kleine Ecke umgeknickt – das Eselsohr. Tippst du doppelt darauf, dreht sich der ganze Kopf um wie ein Blatt Papier. Nach links ziehen geht auch. Auf der Rückseite warten fünf Dinge auf dich." },
  { v: "start", vor: () => rgRueck("uhr"), sel: ["#heroRueck .hr-tabs"], mussSel: true, t: "🗂️ Sieben Reiter",
    x: "Oben stehen sieben Reiter nebeneinander: Diashow, Tafel, Flipchart, Uhr, Bühne, Spiegel und Rätsel. Ein Tipp wechselt dorthin. Die Rückseite nutzt den ganzen Bildschirm bis zur Leiste unten.",
    live: async (L) => { await L.tipp('#heroRueck [data-tab="dia"]'); esTab("dia"); L.ziel(); } },
  { v: "start", vor: () => rgRueck("dia"), sel: [".es-dia-leiste", "#hrFlaeche"], mussSel: true, t: "🖼️ Diashow",
    x: "Die Diashow zeigt die Fotos aus dem Fotoalbum – sanft überblendet. Unten wählst du ein Album, blätterst vor und zurück oder hältst an. Mit dem Noten-Knopf läuft der Club-Song dazu. Tippst du aufs Foto, verschwinden Leiste und Text – fast wie im Vollbild. Mit dem Vollbild-Knopf wird es ganz groß." },
  { v: "start", vor: () => rgRueck("tafel"), sel: [".es-zf-leiste", "#hrFlaeche"], mussSel: true, t: "🖍️ Tafel",
    x: "Die Tafel ist zum Skizzieren mit dem Finger: Kreide in sieben Farben, drei Stiftdicken, der Schwamm wischt einzelne Stellen weg, der Besen die ganze Tafel. Der Pfeil nimmt den letzten Strich zurück." },
  { v: "start", vor: () => rgRueck("flip"), sel: [".es-zf-leiste", "#hrFlaeche"], mussSel: true, t: "📋 Flipchart",
    x: "Das Flipchart ist wie im Seminar: Marker in Farben, Radierer, und wenn das Blatt voll ist, klappst du es mit Umblättern nach hinten. Der andere Pfeil holt das vorige Blatt zurück, die Schere reißt ein Blatt ab. Ein Knopf schaltet das Papier um: blanko, kariert oder liniert." },
  { v: "start", vor: () => rgRueck("flip"), sel: [".es-zf-leiste .es-haupt"], mussSel: true, puls: [".es-zf-leiste .es-haupt"], t: "📤 Sichern & verschicken",
    x: "Mit Sichern legst du die Skizze ins Archiv oder schickst sie als Nachricht. Das geht bei der Tafel genauso. Hier sichere ich nichts." },
  { v: "start", vor: () => rgRueck("uhr"), sel: [".es-uhr-leiste", "#hrFlaeche"], mussSel: true, t: "🕰️ Große Uhr",
    x: "Die große Uhr gibt es in vier Stilen: digital in Grün, als Fallblatt-Uhr mit Datum, als Bahnhofsuhr und groß und klar. Unten wählst du den Stil – die App merkt ihn sich. Oben schaltest du auf Wecker, Stoppuhr oder Timer um – dazu gibt es ein eigenes Video.", live: (L) => rgUhrVorfuehren(L) },
  { v: "start", vor: () => rgRueck("buehne"), sel: [".bw-wahl", "#hrFlaeche"], mussSel: true, t: "🎭 Die Bühne",
    x: "Auf der Bühne macht Twinkey Bewegungsübungen vor. Du wählst: im Sitzen, im Stehen oder mit Küchenhelfern wie Schneebesen, Kochlöffel oder Pfanne – dazu die Dauer und ob Musik und Ansage dabei sind. Mit Vorhang auf geht es los. Mach nur so viel, wie dir guttut." },
  { v: "start", vor: () => rgBuehneVorfuehren(), sel: ["#bwLauf .bw-mitte", "#bwLauf"], mussSel: true, t: "🕺 Twinkey turnt vor",
    x: "Twinkey turnt im Achtziger-Look mit Stirnband, Stulpen und roten Turnschuhen – bei jeder Übung in anderen Farben. Er zählt ein, feuert an, sagt noch drei, zwei, eins und macht auch mal einen frechen Spruch. Oben läuft die Zeit, unten steht, worauf du achten sollst." },
  { v: "start", vor: () => rgBuehneVorfuehren(), sel: ["#bwLaut_musik", "#bwLaut_stimme"], mussSel: true, puls: ["#bwLaut_musik", "#bwLaut_stimme"], t: "🎚️ Zwei Regler",
    x: "Rechts regelst du die Musik, links Twinkeys Stimme: nach oben ziehen wird lauter, nach unten leiser. Tippst du unten auf das Symbol, ist es sofort stumm – nochmal tippen, und es ist wieder da. Die App merkt sich beides." },
  { v: "start", vor: () => rgBuehneVorfuehren(), sel: ["#bwLauf .es-leiste"], mussSel: true, t: "⏸ Pause & Ende",
    x: "Unten hältst du an, springst zur nächsten Übung, schaltest Musik oder Ansage ganz ab oder beendest das Training. Wechselst du die Ansicht, macht die Bühne von selbst Pause." },
  { v: "start", vor: () => rgRueck("spiegel"), sel: [".es-spiegel-rahmen", "#hrFlaeche"], mussSel: true, t: "🪞 Spiegel", // 2.314.0 – die Kamera wird im Video nicht eingeschaltet
    x: "Der Spiegel zeigt dich selbst über die Kamera – auf Wunsch mit Pausbäckchen. Dann meint Twinkey: Wir sollten mal wieder eine Bewegungseinheit machen! Die Kamera läuft nur, wenn du sie antippst, und das Bild bleibt auf deinem Gerät." },
  { v: "start", vor: () => rgRueck("raetsel"), sel: [".qz-start", "#hrFlaeche"], mussSel: true, t: "🧩 Rätsel", // 2.344.0 – im Video wird nur die Auswahl gezeigt, kein Spiel gestartet
    x: "Im Rätsel wird ein Foto Pixel für Pixel schärfer. Wer es erkennt, drückt den roten Buzzer und wählt aus sechs Tipps – je früher, desto mehr Punkte. Beim Wochen-Rätsel bekommen alle dieselben fünf Bilder, und es gibt eine Club-Bestenliste. Üben geht mit Werne oder Küche." },
  { v: "start", vor: () => rgRueck(null), sel: ["#heroRueck .eselsohr"], mussSel: true, puls: ["#heroRueck .eselsohr"], t: "↩️ Zurückdrehen",
    x: "Zum Schluss tippst du wieder doppelt aufs Eselsohr – dann dreht sich der Kopf zurück. Wer das Eselsohr nicht braucht, blendet es in den Einstellungen unter Startseite und Ansicht aus.",
    live: async (L) => { await L.tipp("#heroRueck .eselsohr", "doppelt"); }, nach: () => { BW.lauf = null; esDrehen(false, true); } },
];
const RG_ZENTRALE = [
  { v: "start", nur: () => !rgZeAn(), t: "📡 Kommunikationszentrale",
    x: "Die Kommunikationszentrale ist eine Karte im Info-Feld oben. Ist sie bei dir ausgeblendet, holst du sie in den Einstellungen unter Startseite und Ansicht, beim Info-Feld, zurück." }, // ohne Zentrale-Karte: nur Hinweis (am Anfang, damit das Video mit 👍/👎 endet)
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), sel: ["#heroInfo .zdisplay", "#heroInfo"], mussSel: true, t: "📡 Die Kommunikationszentrale",
    x: "Im farbigen Info-Feld oben gibt es eine Karte nur fürs Schreiben und Anrufen: die Kommunikationszentrale. Oben die Uhr, wie viele gerade online sind, wie viele Nachrichten neu sind und ob Push an ist. Darunter läuft ein Ticker mit den letzten Nachrichten." },
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), sel: ["#heroInfo .zwer"], mussSel: true, t: "👥 An wen?",
    x: "Zuerst wählst du, an wen: an alle, an alle, die gerade online sind, oder mit Auswahl an bestimmte Mitglieder. Darunter steht, wer gerade gewählt ist.",
    live: async (L) => { await L.tipp("#heroInfo .zwer .zchip:nth-child(2)"); await L.warte(900); await L.tipp("#heroInfo .zwer .zchip:nth-child(4)"); } },
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), sel: ["#heroInfo .zpult"], mussSel: true, t: "🎛️ Das Pult",
    x: "Mit dem Pult rufst du an oder startest einen Videoanruf, klopfst an, schickst eine Sprachnachricht oder schreibst im Chat. Dazu teilst du deinen Standort oder fragst einen Termin an. Anrufen, Video und Anklopfen gehen mit genau einer Person – Video und Anklopfen nur, wenn sie gerade online ist. Graue Knöpfe sagen dir beim Antippen, warum." },
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), sel: ["#heroInfo .zwege"], mussSel: true, t: "🔔 Zusätzlich",
    x: "Soll die Nachricht zusätzlich als Push, per E-Mail oder über WhatsApp ankommen, tippst du das hier an." },
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), sel: ["#heroInfo .zsenden"], mussSel: true, t: "📨 Schnell eine Nachricht",
    x: "Ganz unten schreibst du eine kurze Nachricht, zum Beispiel: Bin in zehn Minuten da. Mit dem Brief-Knopf geht sie raus – hier sende ich nichts. Danach zeigt dir die Zentrale, ob sie angekommen und geöffnet ist.",
    live: async (L) => { await L.tipp("#zeText"); const e = $("zeText"); if (e) { e.value = "Bin in zehn Minuten da"; ZE.text = e.value; } await L.warte(1200); await L.tipp("#heroInfo .zsendknopf"); } },
  { v: "start", nur: rgZeAn, vor: () => rgZe(true), t: "✅ Fertig",
    x: "So erreichst du alle schnell, ohne erst in die Nachrichten zu gehen. Zur Zentrale kommst du jederzeit, indem du im Info-Feld oben weiterblätterst." },
];
const RG_SPRACHE = [
  { v: "start", vor: () => rgKopf("offen"), t: "🎙️ Die App hört aufs Wort",
    x: "Mit der Sprachsteuerung sagst du der App, was sie tun soll – zum Beispiel: Nachricht an Klaus, Nächster Termin oder Startseite. Zugehört wird nur, wenn du auf das Mikrofon tippst. Und gesendet wird nie von selbst – das tust immer du." },
  { v: "einstellungen", vor: () => rgAuf("ansagen"), tippVor: () => { const d = document.querySelector(rgKlappe("ansagen")); return d && !d.open ? d.querySelector(":scope > summary") : null; },
    sel: [() => $("setSprache")?.closest(".schalter") || null], puls: ["#setSprache"], mussSel: true, t: "⚙️ Einschalten",
    x: "Eingeschaltet wird sie in den Einstellungen unter Sprache und Ansagen: Sprachsteuerung anhaken. Dein Handy wandelt das Gesprochene in Text um." },
  { v: "start", nur: () => sbAn(), vor: () => rgKopf("offen"), sel: ["#sbKnopf"], puls: ["#sbKnopf"], mussSel: true, t: "🎙️ Das Mikrofon unten links",
    x: "Ist sie an, sitzt unten links ein Mikrofon. Antippen, dann erscheint Ich höre zu – und du sagst, was du möchtest.", live: async (L) => { await L.tipp("#sbKnopf"); } },
  { v: "start", nur: () => !sbAn(), vor: () => rgKopf("offen"), t: "🎙️ Das Mikrofon unten links",
    x: "Ist sie an, sitzt unten links ein Mikrofon. Antippen, dann erscheint Ich höre zu – und du sagst, was du möchtest." },
  { v: "start", nur: () => sbAn(), vor: () => rgKopf("offen"), sel: ["#sbKnopf"], mussSel: true, t: "✋ Lange drücken",
    x: "Hältst du das Mikrofon lange gedrückt, fragt die App, ob du die Sprachsteuerung ausschalten möchtest. Kurz tippen hört wie immer zu.", live: async (L) => { await L.tipp("#sbKnopf", "lang"); } },
  { v: "einstellungen", vor: () => { rgAuf("ansagen"); rgBlatt("sbListeBlatt", sbListe); }, sel: ["#sbListeInhalt", "#sbListeBlatt .blatt-innen"], mussSel: true, t: "📋 Alle Befehle",
    x: "Was du sagen kannst, steht in der Liste aller Sprachbefehle – oben mit Suche. Antippen führt den Befehl gleich aus, als hättest du ihn gesagt. Über diese Liste schaltest du das Mikrofon auch stumm und wieder an." },
  { v: "einstellungen", vor: () => { rgAuf("ansagen"); rgBlatt("sbListeBlatt", sbListe); }, sel: [() => [...document.querySelectorAll("#sbListeInhalt .sb-befehl")].find((b) => /Nachricht an Klaus“/.test(b.textContent)), "#sbListeInhalt"], t: "✍️ Nachricht an Klaus – und weiter diktieren",
    x: "Sagst du Nachricht an Klaus, öffnet die App den Chat mit Klaus und fragt: Soll ich das Diktieren gleich einschalten? Sagst du ja, sprichst du einfach weiter – dein Text erscheint im Feld. Abschicken tust du selbst. Sagst du gleich Nachricht an Klaus: Bin gleich da, steht der Text schon drin." },
  { v: "einstellungen", vor: () => { rgAuf("ansagen"); rgBlatt("sbListeBlatt", sbListe); }, sel: ["#sbListeInhalt"], t: "💡 Noch mehr Befehle",
    x: "Ein paar Beispiele: Nächster Termin sagt den Termin an. Ich komme zum Clubabend sagt zu – die App fragt vorher. Lies mir die neuen Nachrichten vor. Was steht auf der Pinnwand? Ruf Klaus an. Zettel an die Pinnwand. Und Startseite bringt dich immer zurück, wenn du nicht weiterweißt." },
  { v: "einstellungen", vor: () => { rgAuf("ansagen"); rgBlatt("sbtBlatt", sbtStart); }, sel: ["#sbtBlatt .sbt-wahl", "#sbtBlatt .blatt-innen"], mussSel: true, t: "🎓 Sprach-Training",
    x: "Beim Sprach-Training lernt die App deine Aussprache: Du siehst einen Satz, tippst aufs Mikrofon und sprichst ihn nach. Kurz-Training, deine Namen oder alles. Ausgeführt wird dabei nichts, und gespeichert werden nur kurze Texte, keine Tonaufnahmen." },
  { v: "einstellungen", vor: () => { $("sbtBlatt") && fensterZu($("sbtBlatt")); rgAuf("ansagen"); }, sel: [() => $("setSprache")?.closest(".schalter") || null], t: "🧠 Die App lernt dazu",
    x: "Kennt die App einen Satz nicht, fragt sie, was du meinst – und merkt sich deine Antwort. In der Befehlsliste stehen diese Sätze unter Von dir beigebracht; mit Vergessen nimmst du einen wieder heraus." },
  { v: "start", vor: () => rgKopf("offen"), t: "🎤 Diktieren überall",
    x: "Und unabhängig davon: Überall, wo im Eingabefeld ein Mikrofon steht, kannst du statt zu tippen einfach sprechen – im Chat, an der Pinnwand, bei der Suche oder bei Twinkey." },
  { v: "start", vor: () => rgKopf("offen"), t: "✅ Fertig",
    x: "Das war die Sprachsteuerung. Probier es aus: Mikrofon antippen und Startseite sagen. Gefällt sie dir nicht, schaltest du sie in den Einstellungen einfach wieder aus." },
];
// KC-CLUB-ERKLAERVIDEOS-EFFEKTE (2.265.0, Wunsch Hansi „Erklär-Video mit den Spezial-Effekten: Kacheln einschweben, Herbst mit Igel, Laub, Besen,
// Schnee, Frühling und Sommer – kurz zeigen, wo und wie man sie einstellt; dazu die Wetter-Kacheln: antippen und lange festhalten. Darauf
// hinweisen, dass das nur Möglichkeiten sind, die man jederzeit wieder abschalten kann“). Nur vorgeführt: Jahreszeit-Vorschau, gewählter
// Wetter-Tag und Wetter-Fenster werden am Ende zurückgestellt; Einstellungen bleiben unverändert.
function rgJz(art, extra, bis, maxSek = 90) { // Jahreszeit im Kopf zeigen und im Zeitraffer bis zur gewünschten Stelle vorspulen
  if (!RG.jzZurueck) { const alt = [JZB.vorschau, JZB.extra]; RG.jzZurueck = true; RG.zurueck.push(() => { RG.jzZurueck = false; JZB.vorschau = alt[0]; JZB.extra = alt[1]; jahreszeitKopf(); }); }
  JZB.vorschau = art; JZB.extra = extra || ""; jahreszeitKopf();
  if (!JZB.cv) return; jzbGroesse();
  for (let i = 0; i < maxSek * 20 && !(bis && JZB.w && bis(JZB)); i++) {
    if ((JZB.extraPruef -= .05) <= 0) { JZB.extraPruef = 30; jzbExtrasBestimmen(); }
    JZB.T += .05; JZB.pt += .05; jzbSchritt(.05);
  }
  jzbMalen();
}
const rgJzAn = () => fxAn() && einst("jahreszeit", true);
const rgSchalter = (id) => () => $(id)?.closest(".schalter") || null;
function rgWetterFeld() { // Info-Feld auf das Wetter blättern (am Ende zurück) – Tag „heute“
  rgInfo(); const i = INFO_FELDER.findIndex((f) => f.id === "wetter");
  if (!RG.wetterZurueck) { RG.wetterZurueck = true; RG.zurueck.push(() => { RG.wetterZurueck = false; $("wetterBlatt")?.classList.add("versteckt"); $("wetterBlatt")?.classList.remove("rg-zeigen"); if (WET.tag) { WET.tag = 0; heroZeigen(0); } }); }
  if (i >= 0 && INFO_I !== i) infoGehe(i);
}
const RG_EFFEKTE = [
  { v: "start", vor: () => rgKopf("offen"), t: "✨ Effekte & Wetter",
    x: "Die App kann ein bisschen zaubern: Kacheln schweben herein, oben im Kopf zeigt sich die Jahreszeit, und das Wetter verrät dir mehr, als man denkt. Das sind alles nur Möglichkeiten – gefällt dir etwas nicht, schaltest du es jederzeit wieder ab. Ich zeige dir auch, wo." },
  { v: "start", nur: () => !einfach() && fxAn(), vor: () => rgKopf("ganz"), sel: ["#register", "#raster"], t: "🪟 Kacheln schweben herein",
    x: "Wechselst du oben zwischen Club, Meins und Technik, schweben die Kacheln herein. Als Jalousie, als Kartenstapel, sie drehen sich um, wirbeln herein, rollen wie ein Spielautomat, steigen als Seifenblasen auf, fliegen wie vom Magnet auseinander werden wie Pfannkuchen gewendet, fliegen aus allen Richtungen ein, drehen sich waagerecht oder senkrecht herein oder klappen wie eine Fallblatt-Uhr am Bahnhof. Ich zeige dir einige.",
    live: async (L) => { for (const art of ["jalousie", "wirbel", "walze", "blasen", "magnet", "pfanne"]) { await L.tipp(`#register button[data-r="${reg}"]`); regEffekt(1, art); await L.warte(1500); } } },
  // 2.508.0 KC-CLUB-HILFE-NACHTRAG-3: Kopf-Effekte und Geburtstags-Vogel – nur vorgeführt (kopfRolloFahren mit festem Effekt), die Einstellung bleibt
  { v: "start", nur: () => fxAn(), vor: () => rgKopf("offen"), sel: ["#v-start .hero"], t: "🎪 Der Kopf geht auf und zu",
    x: "Oben am Kopf rollst du ihn mit den Pfeilen ein – normal wie eine Jalousie. Du kannst aber auch etwas anderes wählen: einen weinroten Theatervorhang, eine silberne Servierglocke oder die Holzklappe einer Marktbude. Schau mal.",
    live: async (L) => { for (const e of ["theater", "glocke", "bude"]) { await kopfRolloFahren("ganz", e); await L.warte(500); await kopfRolloFahren("offen", e); await L.warte(700); } } },
  { v: "start", nur: () => fxAn(), vor: () => rgKopf("offen"), sel: ["#v-start .hero"], t: "🎁 Geburtstag im Kopf",
    x: "Hat jemand aus dem Club Geburtstag, kommt ein Vogel mit einem Geschenk. Unten platzt das Paket – ein Blumenstrauß springt heraus, und bunt steht da: Happy Birthday.",
    live: async (L) => { gbvFlug([ICH?.vorname || "dir"]); await L.warte(9000); } },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("herbst", "igel", (J) => J.liegt.length >= 14); JZB.igelUhr = 1.5; }, sel: ["#v-start .hero"], t: "🍂 Herbst im Kopf",
    x: "Oben im Kopf zeigt sich die Jahreszeit. Im Herbst fallen bunte Blätter und bleiben unten als Laubschicht liegen. Und ab und zu raschelt ein Igel durchs Laub. Ist genug Laub zusammen, kommt der Wind, Twinkey mit dem Besen – oder ein Mann mit Laubbläser pustet alles weg. Zwischen den Blättern liegen Eicheln und Haselnüsse: Ab und an flitzt ein Eichhörnchen herbei, stopft sich eine dicke Nuss in die Backe und saust wieder davon. Manchmal bringt es eine Nuss und legt daraus Buchstabe für Buchstabe deinen Vornamen – ist er fertig, sitzt es stolz daneben, und später holt es sich die Nüsse wieder. Unten wachsen Pilze – auch Fliegenpilze –, die der Laubbläser durch die Luft wirbelt." },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("herbst", "twinkey", (J) => J.phase === "besuch", 180); if (JZB.cv && JZB.phase === "fallen") jzbBesuchStart("fegen"); }, sel: ["#v-start .hero"], t: "🧹 Wind oder Twinkey",
    x: "Liegt genug Laub, kommt ein Windstoß – mal von links, mal von rechts – und weht es weg. Oder Twinkey kommt mit dem Besen vorbei, fegt und sagt einen Spruch. Schau mal." },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("winter", "", (J) => J.phase === "stehen", 150); }, sel: ["#v-start .hero"], t: "⛄ Winter",
    x: "Im Winter fällt Schnee und bleibt liegen. Jedes dritte Mal wird daraus ein lachender Schneemann – mit Kochmütze und weinrotem Schal, im Advent mit Weihnachtsmütze. Nach einer Weile geht links die Sonne auf und er schmilzt – Wassertropfen rinnen herunter, nur sein Schal bleibt liegen, bis ihn der Wind mit dem Schnee davonwirbelt. Abwechselnd mit dem Schneemann baut ein Eskimo Block für Block ein Iglu und geht hinein; dann kommt der Schlittenmann mit seinen Huskies heim – er wohnt dort. Kommt die Sonne, fahren beide mit dem Gespann davon, und das Iglu schmilzt. Sonst kommt gleich der Wind, oder Twinkey schippt den Schnee beiseite. Ab und zu fährt ein Hundeschlitten mit Huskies vorbei, oder es sausen zwei Kinder mit Bommelmützen auf dem Schlitten vorbei, oder ein paar Kinder machen eine Schneeballschlacht und werfen sich Schneebälle zu. Ab und an glättet eine rote Schneeraupe mit Blinklicht die Schneehügel, und ein paar Minuten später wedeln zwei Skifahrer in bunten Anzügen über die frische Piste. Im tiefen Winter hängen dazu Eiszapfen an der Leiste mit den Lämpchen – ab und an tropft es, und unten bildet sich langsam eine Pfütze." },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("fruehling", "", (J) => J.pt > 26); }, sel: ["#v-start .hero"], t: "🌱 Frühling",
    x: "Im Frühling wächst Gras mit den ersten Blumen, Blüten schweben herab und Schmetterlinge fliegen vorbei. Zu Ostern liegen bunte Eier im Gras – tippst du eins an, schlüpft ein Küken." },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("sommer", "", (J) => !!J.besuch && J.besuch.x > 0 && J.besuch.x < J.w); }, sel: ["#v-start .hero"], t: "🌻 Sommer",
    x: "Im Sommer wächst eine Sonnenblume, und Twinkey kommt mit der Gießkanne. Und übers Jahr gibt es Extras: am Nikolaustag einen Stiefel, am Treffen-Tag einen dampfenden Kochtopf – und regnet es wirklich, Pfützen." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), tippVor: () => { const d = document.querySelector(rgKlappe("effekte")); return d && !d.open ? d.querySelector(":scope > summary") : null; },
    sel: [rgKlappe("effekte")], mussSel: true, video: "anpassen", t: "⚙️ Wo stelle ich das ein?",
    x: "Eingestellt wird das alles in den Einstellungen, im Bereich Effekte. Ein Tipp auf die Überschrift klappt ihn auf." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setJahreszeit")], puls: ["#setJahreszeit"], mussSel: true, t: "🍂 Jahreszeiten im Kopf",
    x: "Hier schaltest du die Jahreszeiten im Kopf ein oder aus. Haken raus – und der Kopf ist wieder ruhig. Darunter kannst du dir jede Jahreszeit und die Extras als Vorschau ansehen.",
    live: async (L) => { await L.tipp("#setJahreszeit"); await L.warte(900); await L.tipp(() => [...document.querySelectorAll(`${rgKlappe("effekte")} .chip`)].find((c) => /Herbst/.test(c.textContent))); } },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("regEffektWahl"), "#regEffektWahl"], mussSel: true, t: "🪟 Kacheln und Senden",
    x: "Hier wählst du, wie die Kacheln hereinschweben – Jalousie, Kartenstapel, Umdrehen, Hereindrehen, Spielautomat, Seifenblasen, Magnet, Pfanne, Einfliegen, Horizontal drehen, Vertikal drehen, Fallblatt-Uhr, Kachel-Zug, Abwechselnd (jedes Mal ein anderer), Zufall – oder Aus. Darunter: Kacheln beim Öffnen, Welle beim Antippen, Neues wackelt und Abschied beim Abmelden. Darunter der Effekt beim Senden: Papierflieger, Brieftaube, Uhu mit Posttasche oder Postauto.",
    live: async (L) => { await L.tipp(() => [...document.querySelectorAll("#regEffektWahl .chip")].find((c) => /Aus/.test(c.textContent))); } },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setAnimiert")], puls: ["#setAnimiert"], mussSel: true, t: "✨ Der Hauptschalter",
    x: "Ganz oben der Hauptschalter: Animierte Knöpfe. Ist er aus, ist alles ruhig – auch die Jahreszeiten und alle Effekte. Nichts davon ist Pflicht, und du kannst alles jederzeit wieder einschalten." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setKopfEffekt"), rgSchalter("setGbVogel")], puls: ["#setKopfEffekt", "#setGbVogel"], mussSel: true, t: "🎪 Kopf und Geburtstag",
    x: "Hier wählst du den Effekt für den Kopf – mit Ausprobieren siehst du ihn sofort. Und hier schaltest du den Geburtstags-Vogel ein oder aus; mit Vorschau kommt er gleich angeflogen." },
  // 2.671.0 KC-CLUB-HILFE-NACHTRAG-5: Schatten und Ecken der Kacheln (nur gezeigt, nichts wird umgestellt)
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setSchatten"), ".kr-zeile"], puls: ["#setSchatten", "#setKachelEcken", "#kachelEckenStandard"], mussSel: true, t: "🌗 Schatten und Ecken",
    x: "Darunter zwei Dinge fürs Aussehen: Schatten gibt Knöpfen, Kacheln und dem Kopf Tiefe – Stärke, Farbe und Position klappst du darunter auf, dazu den Schatten im Kopf und mehr Kontrast bei Nacht. Und mit dem Regler Ecken der Kacheln machst du die Kacheln eckig oder fast rund; Standard stellt sie zurück." },
  { v: "start", nur: () => INFO_FELDER.some((f) => f.id === "wetter"), vor: () => { rgKopf("offen"); rgWetterFeld(); }, sel: ["#infoFeld .wtage", "#heroInfo"], mussSel: true, t: "🌦️ Das Wetter im Info-Feld",
    x: "Jetzt das Wetter. Im farbigen Info-Feld oben blätterst du zum Wetter: groß das Wetter von jetzt, darunter die nächsten Tage als kleine Kacheln. Sie lassen sich zur Seite wischen." },
  { v: "start", nur: () => INFO_FELDER.some((f) => f.id === "wetter"), vor: () => { rgKopf("offen"); rgWetterFeld(); }, sel: ["#infoFeld .wtage"], mussSel: true, t: "👆 Einen Tag antippen",
    x: "Tippst du einen Tag kurz an, zeigt das große Feld oben das Wetter für diesen Tag – mit passender Animation. Tippst du wieder auf heute, siehst du das Wetter von jetzt.",
    live: async (L) => { await L.tipp("#infoFeld .wtag:nth-child(2)"); wetterTagWahl(1); L.ziel(); await L.warte(2600); await L.tipp("#infoFeld .wtag:nth-child(1)"); wetterTagWahl(0); L.ziel(); } },
  { v: "start", nur: () => INFO_FELDER.some((f) => f.id === "wetter"), vor: () => { rgKopf("offen"); rgWetterFeld(); }, nach: () => { $("wetterBlatt")?.classList.add("versteckt"); $("wetterBlatt")?.classList.remove("rg-zeigen"); },
    sel: ["#wetterBlatt:not(.versteckt) .blatt-innen", "#infoFeld .wtage"], mussSel: true, t: "✋ Lange festhalten",
    x: "Hältst du einen Tag lange fest, öffnen sich alle Einzelheiten: Höchst- und Tiefstwerte, Regen, Wind und Böen, Sonnenstunden, Sonnenauf- und -untergang, der UV-Index und der Verlauf über den Tag.",
    live: async (L) => { await L.tipp("#infoFeld .wtag:nth-child(2)", "lang"); wetterTagDetails(1); $("wetterBlatt")?.classList.add("rg-zeigen"); L.ziel(); } },
  { v: "start", vor: () => rgKopf("offen"), t: "✅ Alles nur Möglichkeiten",
    x: "Das waren die Effekte und das Wetter. Denk dran: Das sind alles nur Möglichkeiten. Gefällt dir etwas nicht, schaltest du es in den Einstellungen unter Effekte einfach ab – und jederzeit wieder ein." },
];
// 2.344.0 KC-CLUB-VIDEO-ANPASSEN (Wunsch Hansi „ein extra Video nur zu Themen, Farben, Jahreszeiten usw. – wie kann ich meine App anpassen,
// es sind inzwischen so viele Möglichkeiten“): ein Rundgang durch alle Einstellungen fürs Aussehen. Vorgeführt wird nur – nichts wird umgestellt;
// die Jahreszeiten-Vorschau wird am Ende zurückgestellt (rgJz).
const RG_ANPASSEN = [
  { v: "start", vor: () => rgKopf("offen"), t: "🎨 Meine App – so wie ich sie mag",
    x: "In der Club-App kannst du vieles nach deinem Geschmack einstellen: ein Thema, die Farben, Tag und Nacht, die Schrift, das Bild der Jahreszeit oben im Kopf, eine Deko, die Effekte – und wie ruhig oder lebendig alles sein soll. Ich zeige dir, wo du was findest. Alles sind nur Möglichkeiten – du kannst jederzeit zurück." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: ["#themaWahl"], mussSel: true, t: "🎭 Themen – alles mit einem Tipp",
    x: "Am einfachsten geht es mit einem Thema, in den Einstellungen unter Darstellung. Ein Thema ist ein fertiges Paket: Farbe, Bild im Kopf, Effekt beim Senden und eine passende Schrift – zum Beispiel Weihnachten, Indian Summer, Oktoberfest, Sim-Jü, Karneval, Ostern, Halloween, Karibik, Unterwasserwelt, Weltraum, Bauernhof oder Kegelabend. Mit Nach Kalender wechselt das Thema von selbst. Mit Kein Thema gelten wieder deine eigenen Einstellungen." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: [rgSchalter("themaSchriftAn")], puls: ["#themaSchriftAn"], t: "✍️ Schrift des Themas",
    x: "Die Begrüßung oben erscheint in der Schrift des Themas – zum Oktoberfest in Fraktur, zu Halloween gruselig. Gefällt dir das nicht, nimmst du hier den Haken raus." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: ["#designWahl"], mussSel: true, t: "🎨 Farbdesign",
    x: "Lieber nur eine andere Farbe? Hier im Farbdesign tippst du eine Farbe an – die App färbt sich sofort um. Darunter gibt es noch weitere und ausgefallene Farbschemen." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: ["#modusWahl"], mussSel: true, t: "🌗 Tag und Nacht",
    x: "Tag und Nacht: Automatisch richtet sich nach dem Sonnenstand in Werne. Oder immer hell, oder immer dunkel. Abends ist dunkel angenehmer für die Augen." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: [rgSchalter("setGross")], puls: ["#setGross"], t: "🔠 Große Schrift",
    x: "Ist dir die Schrift zu klein? Hier einschalten – alles wird etwas größer." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setJahreszeit"), "#jzWahl"], mussSel: true, video: "effekte", t: "🍂 Das Bild der Jahreszeit",
    x: "Weiter im Bereich Effekte. Oben im Kopf zeigt sich die Jahreszeit – von selbst nach dem Kalender, oder fest eingestellt. Mit dem Haken schaltest du das Bild ganz ein oder aus. Darunter kannst du dir jede Jahreszeit als Vorschau ansehen." },
  { v: "start", nur: rgJzAn, vor: () => { rgKopf("offen"); rgJz("herbst", "hoernchen", (J) => !!J.hoernchen && J.hoernchen.phase === "hin", 240); }, sel: ["#v-start .hero"], t: "🐿️ Besuch im Kopf",
    x: "So sieht das im Herbst aus: Laub fällt, ein Eichhörnchen holt sich Nüsse – und legt manchmal deinen Vornamen aus Nüssen – bis der Laubbläser ihn aufwirbelt. Im Winter entsteht dein Name aus Eis, bis die Schneeraupe ihn wegschiebt und er zerspringt. Und Skifahrer wedeln vorbei. Das alles passiert nur auf deinem Gerät." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("jzDekoWahl"), "#jzDekoWahl"], mussSel: true, t: "🎏 Deko an der Leiste",
    x: "An der Leiste mit den Lämpchen kann eine Deko hängen: Wimpel, Lichterkette oder Laternen. Automatisch passt sie zur Jahreszeit – im Herbst Laternen, im Advent warmweiße Lichter. Oder du wählst selbst, oder schaltest sie aus." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("regEffektWahl"), "#regEffektWahl", "#sendeEffektWahl"], mussSel: true, t: "🪟 Kacheln und Senden",
    x: "Hier wählst du, wie die Kacheln hereinschweben – als Jalousie, Kartenstapel, sie drehen sich um, wirbeln herein, rollen wie ein Spielautomat, steigen als Seifenblasen auf, kommen wie vom Magnet oder aus der Pfanne, fliegen aus allen Richtungen ein, drehen sich horizontal oder vertikal herein, klappen wie eine Fallblatt-Uhr – oder abwechselnd jedes Mal anders. Und was beim Senden einer Nachricht losfliegt: Papierflieger, Brieftaube, Uhu mit Posttasche oder Postauto. Auch wie der Kopf auf- und zugeht, stellst du hier ein – vom Theatervorhang bis zur Servierglocke." },
  { v: "einstellungen", vor: () => rgAuf("effekte"), sel: [rgSchalter("setAnimiert")], puls: ["#setAnimiert"], mussSel: true, t: "✨ Ruhig oder lebendig",
    x: "Der Hauptschalter: Animierte Knöpfe. Ist er aus, ist alles ruhig – keine Bewegungen, kein Jahreszeiten-Bild, keine Effekte. Ideal, wenn dich das ablenkt." },
  { v: "einstellungen", vor: () => rgAuf("darstellung"), sel: [rgSchalter("sparWahl"), "#sparWahl"], mussSel: true, t: "🐢 Sparmodus und Akku",
    x: "Der Sparmodus hilft bei schwachem Netz oder älteren Handys und spart Akku: dann ruhen alle Effekte. Automatisch schaltet er sich bei Bedarf selbst ein. Bewegt sich oben einmal nichts, liegt es oft daran – die App sagt dir dann den Grund." },
  { v: "einstellungen", vor: () => rgAuf("startseite"), sel: [rgSchalter("setEselsohr")], puls: ["#setEselsohr"], video: "rueckseite", t: "📄 Eselsohr und Startseite",
    x: "Unter Startseite und Ansicht blendest du das Eselsohr ein oder aus – das ist die Ecke unten rechts am Kopf mit Diashow, Uhr, Bühne, Spiegel und Rätsel auf der Rückseite. Hier stellst du auch ein, welche Kacheln du siehst und wie die Mitglieder angezeigt werden." },
  { v: "start", vor: () => rgKopf("offen"), t: "✅ Probier es aus",
    x: "Das waren alle Möglichkeiten, deine App anzupassen. Probier ruhig aus, was dir gefällt – nichts geht kaputt. Und wenn du zurück willst: Thema auf Kein Thema, Farbe zurück auf das Köcheclub-Rot, und die Effekte wieder einschalten. Viel Spaß mit deiner ganz eigenen Club-App!" },
];
// KC-CLUB-ERKLAERVIDEOS-FIGUR (2.248.0, Wunsch Hansi „Erklär-Videos, wie man sich eine Figur zuordnet und bearbeitet“):
// Koch-Figur aussuchen (Mein Bild) und eigene Figur im Baukasten zusammenstellen. Vorgeführt wird nur – nichts wird gespeichert;
// die Fenster gehen am Ende wieder zu. Foto, Baukasten und Jacken-Schalter erscheinen nur, wenn sie für das Mitglied freigegeben sind.
function rgAvAuf(wahl) { // „Mein Bild“ öffnen (und auf Wunsch eine Figur zeigen, ohne sie zu übernehmen)
  $("avbBlatt")?.remove();
  if (!$("avBlatt")) { avWahl(); RG.zurueck.push(() => $("avBlatt")?.remove()); }
  $("avBlatt")?.classList.add("rg-zeigen");
  if (wahl !== undefined && AVW.wahl !== wahl) { const k = wahl && document.querySelector(`#avBlatt .av-raster button[onclick*="'${wahl}'"]`); if (k) rgKlappeAuf(k.closest("details")?.dataset.klappe); avWaehlen(wahl, k); }
}
// 2.415.0 KC-CLUB-AVATAR-HILFE: Klappbereich fürs Video öffnen – danach wieder so wie vorher (auch der gemerkte Zustand)
function rgKlappeAuf(name) {
  const d = name && document.querySelector(`details[data-klappe="${name}"]`); if (!d || d.open) return;
  d.open = true; RG.zurueck.push(() => { if (d.isConnected) d.open = false; });
}
function rgAvbAuf(teile) { // Baukasten mit einer Beispiel-Figur öffnen; teile = { Teil-Nr: Wert } wird vorgeführt (oben sofort sichtbar)
  $("avBlatt")?.remove();
  if (!$("avbBlatt")) { avBauen("m05"); RG.zurueck.push(() => $("avbBlatt")?.remove()); }
  $("avbBlatt")?.classList.add("rg-zeigen");
  if (teile && AVB) { for (const [i, w] of Object.entries(teile)) { if (i === "stil") AVB_P = !!w; else AVB[i] = w; } avbZeigen(); } // 2.415.0: stil = hochwertiger Stil an/aus
}
const rgAvTeil = (n) => `#avbInhalt [data-teil="${n}"]`;
const RG_FIGUR = [
  { v: "start", nur: () => !einfach(), vor: () => { if (!einfach() && reg !== "mein") { const alt = reg; register("mein"); RG.zurueck.push(() => register(alt)); } },
    sel: ['#raster .kachel[data-id="avatar"]'], mussSel: true, t: "🧑‍🍳 Mein Bild", x: "So bekommst du ein Bild statt deiner Buchstaben: Im Register Meins tippst du auf die Kachel Mein Bild." },
  { v: "start", nur: () => einfach(), t: "🧑‍🍳 Mein Bild", x: "Die Kachel Mein Bild findest du in der erweiterten Ansicht im Register Meins. Ich öffne sie dir jetzt." },
  // 2.415.0 KC-CLUB-AVATAR-HILFE: „Mein Bild“ hat jetzt die Bereiche Bisherige Avatare, Hochwertige Avatare und Individuell anpassen
  { v: "start", tippVor: '#raster .kachel[data-id="avatar"]', vor: () => { rgAvAuf(); rgKlappeAuf("av_alt"); }, sel: ['#avBlatt details[data-klappe="av_alt"]'], t: "🙂 Einfache Figuren", x: "Unter Einfache Figuren findest du die 40 bekannten Koch-Figuren: oben die Köchinnen, darunter die Köche. Wer schon eine hat, behält sie. Einen Bereich klappst du mit einem Tipp auf seinen Kopf auf und zu." },
  { v: "start", nur: () => frei("avatar_premium"), vor: () => { rgAvAuf(); rgKlappeAuf("av_neu"); }, sel: ['#avBlatt details[data-klappe="av_neu"]'], mussSel: true, t: "👑 Hochwertige Figuren", x: "Darunter die Hochwertigen Figuren: 36 neue Köchinnen und Köche mit Licht und Schatten – jung und älter, mit Schmuck, Brillen, Mützen und vielen Kochjacken." },
  { v: "start", tippVor: '#avBlatt .av-raster button[aria-label="Figur w03"]', vor: () => rgAvAuf("w03"), sel: ["#avWahlVorschau"], t: "👆 Figur antippen", x: "Tippe eine Figur an, zum Beispiel diese Köchin. Oben siehst du sie dann groß. Tippst du auf das große Bild, siehst du sie noch größer." },
  { v: "start", vor: () => rgAvAuf("w03"), sel: ["#avWahlVorschau .av-vorschau-knoepfe"], t: "✅ Übernehmen", x: "Gefällt sie dir, tippst du auf Übernehmen – dann ist sie dein Bild. Alle sehen es bei den Mitgliedern, im Chat und bei Wer ist online. Mit Bearbeiten veränderst du sie vorher noch. Hier übernehme ich nichts." },
  { v: "start", nur: () => frei("avatar_premium"), vor: () => rgAvAuf(AV_PREMIUM[0].code), sel: ["#avWahlVorschau"], t: "✨ Auch hochwertig anpassbar", x: "Eine hochwertige Figur tippst du genauso an. Mit Bearbeiten änderst du sie im Baukasten – zum Beispiel Frisur, Ohrringe oder Kochjacke. Hier übernehme ich nichts." },
  { v: "start", nur: () => frei("avatar_baukasten"), vor: () => rgAvAuf(), sel: ["#avWahlVorschau .av-vorschau-rechts .knopf.haupt"], mussSel: true, t: "🧩 Ganz eigene Figur", x: "Mit Selbst zusammenstellen baust du dir eine ganz eigene Figur – Haare, Bart, Brille, Mütze, Schmuck, Kochjacke und vieles mehr. Wie das geht, zeigt das Video Eigene Figur zusammenstellen." },
  { v: "start", nur: () => frei("avatar_baukasten"), vor: () => { rgAvAuf(); rgKlappeAuf("av_bau"); }, sel: ['#avBlatt details[data-klappe="av_bau"]'], mussSel: true, t: "🧩 Individuell anpassen", x: "Bei Individuell anpassen führen dich die Kacheln direkt zur passenden Stelle im Baukasten – etwa Frisur, Brille, Bart, Ohrringe oder Kochjacke." },
  { v: "start", nur: () => frei("avatar_baukasten"), vor: () => rgAvAuf(), sel: ["#avJackeAuto"], mussSel: true, t: "🔄 Kochjacke wechselt", x: "Hast du schon ein Bild, kannst du hier einschalten, dass deine Kochjacke jeden Tag eine andere Farbe hat – von Montag bis Sonntag." },
  { v: "start", nur: () => frei("avatar_foto"), vor: () => rgAvAuf(), sel: ["#avWahlVorschau .av-vorschau-rechts"], mussSel: true, t: "📷 Eigenes Foto", x: "Lieber ein Foto? Rechts neben dem Bild machst du ein Selfie, nimmst ein Foto aus der Galerie oder eine Datei." },
  { v: "start", vor: () => rgAvAuf(), t: "✅ Fertig", x: "Das war's: Mein Bild öffnen, Figur antippen, übernehmen. Dein Bild kannst du jederzeit wieder ändern – oder mit Kein Bild zu deinen Buchstaben zurück." },
];
const RG_FIGUR_BAU = [
  { v: "start", vor: () => rgAvAuf(), sel: ["#avWahlVorschau .av-vorschau-rechts .knopf.haupt"], t: "🧩 Selbst zusammenstellen", x: "So stellst du dir eine eigene Figur zusammen: In Mein Bild tippst du auf Selbst zusammenstellen. Oder du tippst erst eine fertige Figur an und dann auf Bearbeiten – dann fängst du mit ihr an." },
  { v: "start", vor: () => rgAvbAuf(), sel: ["#avbInhalt > div:first-child"], t: "👀 Oben die Vorschau", x: "Oben siehst du deine Figur groß. Jede Änderung siehst du dort sofort. Mit Zufall würfelt die App dir eine Figur als Anfang." },
  { v: "start", vor: () => rgAvbAuf(), sel: ['#avbInhalt details[data-klappe="av_bau_kacheln"]'], t: "🧩 Was möchtest du ändern?", x: "Die Kacheln darunter bringen dich mit einem Tipp genau zur richtigen Stelle – Frisur, Brille, Bart, Ohrringe, Kochjacke und so weiter. Du kannst aber auch einfach nach unten wischen." },
  { v: "start", nur: () => frei("avatar_premium"), vor: () => rgAvbAuf({ stil: true }), sel: ['#avbInhalt .ps-schritt[data-teil="stil"]'], mussSel: true, t: "👑 Klassisch oder hochwertig", x: "Beim Stil wählst du klassisch – wie die einfachen Figuren – oder hochwertig mit Licht und Schatten. Alles andere bleibt gleich." },
  { v: "start", vor: () => rgAvbAuf({ 8: 0 }), sel: [rgAvTeil(8)], t: "👨‍🍳 Koch oder Köchin", x: "Darunter wählst du Teil für Teil – einfach antippen. Zuerst: Koch oder Köchin." },
  { v: "start", vor: () => rgAvbAuf({ 1: 4 }), sel: [rgAvTeil(1), rgAvTeil(0)], t: "💇 Haut und Haare", x: "Dann Hautton, Kopfform, Frisur und Haarfarbe – hier zum Beispiel Locken. Bei Frisur, Kopfbedeckung, Bart, Brille und Schmuck siehst du jede Auswahl gleich als kleines Bild an deiner Figur." },
  { v: "start", vor: () => rgAvbAuf({ 3: 11, 16: 3 }), sel: [rgAvTeil(3)], t: "🧢 Auf dem Kopf", x: "Was trägst du auf dem Kopf? Kochmütze, hohe Chefmütze, Kappe, Kopftuch, Beanie, Barett, Turban, Nikolausmütze, Cowboyhut, Zylinder, Krone – oder nichts. Darunter wählst du Farbe und Muster dazu." },
  { v: "start", vor: () => rgAvbAuf({ 8: 0, 4: 2 }), sel: [rgAvTeil(4)], t: "🧔 Bart", x: "Auch Bärte gibt es – vom Schnurrbart über Spitzbart und Koteletten bis zum langen Vollbart." },
  { v: "start", vor: () => rgAvbAuf({ 9: 1, 11: 1 }), sel: [rgAvTeil(9), rgAvTeil(11)], t: "🙂 Das Gesicht", x: "Fürs Gesicht wählst du Augen, Augenfarbe, Nase, Ohren, Augenbrauen, Mund, Wangen und auf Wunsch Falten – hier lachende Augen und ein breites Lachen." },
  { v: "start", vor: () => rgAvbAuf({ 5: 1, 13: 2 }), sel: [rgAvTeil(5)], t: "👓 Brille", x: "Eine Brille? Rund, eckig, randlos, Panto, Sonnenbrille und viele mehr – dazu Farbe und auf Wunsch etwas Glitzer. Deine eigene Brille ist nicht dabei? Schick Hansi ein Foto davon, dann wird sie nachgezeichnet." },
  { v: "start", vor: () => rgAvbAuf({ 26: 3, 27: 1 }), sel: [rgAvTeil(26), rgAvTeil(27), rgAvTeil(28)], t: "💎 Schmuck", x: "Neu sind Ohrringe, Halsketten und Piercings – hier Creolen und eine Goldkette." },
  { v: "start", vor: () => rgAvbAuf({ 14: 3 }), sel: [rgAvTeil(14)], t: "🧥 Kochjacke", x: "Die Kochjacke: Farbe, Schnitt (zweireihig, schräg geknöpft, mit Schürze), Muster, Kragen und Knöpfe – hier weinrot wie unser Club. Mit täglich wechselnd hat sie jeden Tag eine andere Farbe." },
  { v: "start", vor: () => rgAvbAuf({ 6: 1, 7: 1 }), sel: [rgAvTeil(6), rgAvTeil(7)], t: "🎨 Hintergrund & Halstuch", x: "Zum Schluss Hintergrund und Halstuch." },
  { v: "start", vor: () => rgAvbAuf(), sel: ["#avbBlatt .av-info-knopf"], mussSel: true, t: "ⓘ Wie viele Figuren?", x: "Der kleine i-Knopf oben verrät, wie viele verschiedene Figuren möglich sind – es sind unvorstellbar viele. Deine ist also einzigartig." },
  { v: "start", vor: () => rgAvbAuf(), sel: ["#avbInhalt .bs-fuss"], t: "💾 Speichern", x: "Fertig? Ganz unten tippst du auf Speichern – dann ist die Figur dein Bild. Mit Abbrechen bleibt alles, wie es war. Hier speichere ich nichts." },
  { v: "start", vor: () => rgAvAuf(), t: "✏️ Später ändern", x: "Ändern kannst du deine Figur jederzeit: Mein Bild öffnen und direkt unter deinem Bild auf Bearbeiten tippen. Und unter Zuletzt benutzt holst du ein früheres Bild mit einem Tipp zurück. Viel Spaß beim Zusammenstellen!" },
];
const RG_INST_CODE = "482 913"; // nur ein Beispiel – echte Codes erzeugt der Server
const simAdr = () => APP_URL_CLUB.replace(/^https?:\/\//, "").replace(/\/$/, "");
function rgSim(html, art = "handy") {
  let z = $("rgSim");
  if (!z) { document.body.insertAdjacentHTML("beforeend", '<div id="rgSim" aria-hidden="true"></div>'); z = $("rgSim"); RG.zurueck.push(rgSimWeg); }
  z.className = "rg-sim rg-sim-" + art; z.innerHTML = `<div class="sim-band">🎬 Beispielbild – so sieht es aus</div>${html}`; return z;
}
function rgSimWeg() { $("rgSim")?.remove(); }
const simStatus = () => `<div class="sim-status"><span>9:41</span><span>📶 🔋</span></div>`;
// Köcheclub-Seite, wie sie im Browser erscheint (Farben und Logo der App)
const simApp = () => `<div class="sim-app"><div class="sim-hero"><img src="kc-kochmuetze-weiss.webp" alt=""><div><small>KÖCHECLUB WERNE</small><b>Hallo!</b></div></div>
  <div class="sim-kacheln"><div>📅<b>Termine</b></div><div>💬<b>Nachrichten</b></div><div>📌<b>Pinnwand</b></div><div>👥<b>Mitglieder</b></div></div></div>`;
const simKn = (s, t, kl = "") => `<span class="sim-kn ${kl}" data-s="${s}">${t}</span>`;
const simDialog = (titel, knoepfe, extra = "") => `<div class="sim-dialog-hg"><div class="sim-dialog"><b class="sim-dtitel">${titel}</b>
  <div class="sim-appicon"><img src="icon-192.png" alt=""><div><b>Köcheclub</b><small>${esc(simAdr())}</small></div></div>${extra}<div class="sim-dkn">${knoepfe}</div></div></div>`;
const simMenue = (punkte, ziel, unten) => `<div class="sim-menue${unten ? " unten" : ""}">${punkte.map((p) => `<div${p === ziel ? ' data-s="ziel"' : ""}>${p}</div>`).join("")}</div>`;
const simGitter = (punkte, ziel) => `<div class="sim-blatt"><div class="sim-griff"></div><div class="sim-gitter">${punkte.map(([i, t]) => `<div${t === ziel ? ' data-s="ziel"' : ""}><i>${i}</i>${t}</div>`).join("")}</div></div>`;
// Browser-Bild: Leisten oben/unten wie im Original, darüber Menü, Blatt oder Rückfrage
function simBrowser(b, z = {}) {
  const adr = `<span class="sim-adr">🔒 ${esc(simAdr())}</span>`;
  const L = {
    chrome: { oben: `${simKn("home", "⌂")}${adr}${simKn("tabs", "1", "sim-tabs")}${simKn("menue", "⋮")}` },
    firefox: { oben: `${simKn("home", "⌂")}${adr}${simKn("tabs", "1", "sim-tabs")}${simKn("menue", "⋮")}` },
    edge: { oben: adr, unten: `${simKn("home", "⌂")}${simKn("cop", "◎")}${simKn("neu", "＋")}${simKn("tabs", "1", "sim-tabs")}${simKn("menue", "≡")}` },
    samsung: { oben: adr, unten: `${simKn("zur", "‹")}${simKn("vor", "›")}${simKn("home", "⌂")}${simKn("lz", "☆")}${simKn("tabs", "1", "sim-tabs")}${simKn("menue", "≡")}` },
    safari: { unten: `${simKn("zur", "‹")}<span class="sim-adr mitte">${esc(simAdr().split("/")[0])}</span>${simKn("menue", "⋯")}` },
    mini: { oben: `${simKn("zu", "✕")}<span class="sim-adr klein">Köcheclub<small>${esc(simAdr())}</small></span>${simKn("menue", "⋮")}` },
  }[b];
  return `${simStatus()}${L.oben ? `<div class="sim-leiste ${b}">${L.oben}</div>` : ""}<div class="sim-seite">${simApp()}${z.ueber || ""}</div>${L.unten ? `<div class="sim-leiste unten ${b}">${L.unten}</div>` : ""}`;
}
// Startbildschirm mit Apps – die Kochmütze kommt dazu
const simHome = (mit = true, art = "handy") => `${art === "pc" ? "" : simStatus()}<div class="sim-home${art === "pc" ? " pc" : ""}">${[["📞", "Telefon"], ["💬", "Nachrichten"], ["📷", "Kamera"], ["🖼️", "Galerie"], ["🗺️", "Karten"], ["⏰", "Uhr"], ["✉️", "E-Mail"]]
  .map(([i, t]) => `<div><i>${i}</i>${t}</div>`).join("")}${mit ? `<div data-s="icon" class="sim-neu"><img src="icon-192.png" alt="">Köcheclub</div>` : ""}</div>`;
const simWhatsApp = () => `${simStatus()}<div class="sim-wa-kopf"><span>‹</span><span class="sim-wa-bild">🧑‍🍳</span><div><b>Köcheclub Admin</b><small>online</small></div></div>
  <div class="sim-wa"><div class="sim-blase" data-s="blase">Hallo! Hier ist dein persönlicher Link zur Köcheclub-App. Bitte nicht weitergeben 🙂<br>
  <span class="sim-link" data-s="link">https://${esc(simAdr())}/?k=4f9c2e7a1b8d…</span><small>10:12</small></div></div>`;
const simMail = () => `${simStatus()}<div class="sim-mail-kopf"><span>‹ Posteingang</span></div><div class="sim-mail"><b>Dein persönlicher Zugang zur Köcheclub-App</b>
  <small>Von: Köcheclub Werne</small><p>Hallo,<br>mit diesem Link öffnest du die Köcheclub-App. Er ist nur für dich – bitte nicht weitergeben.</p>
  <span class="sim-link knopfig" data-s="link">🔗 Köcheclub-App öffnen</span></div>`;
// Anmeldeseite: echte Karten aus #gesperrt (ohne IDs und Aktionen), je Karte data-s nach ihrer Überschrift
function simGesperrt(mitUngueltig) {
  const o = $("gesperrt"); if (!o) return "";
  const c = o.cloneNode(true); c.removeAttribute("id"); c.className = "seite sim-gesperrt";
  c.querySelectorAll("[id]").forEach((e) => e.removeAttribute("id"));
  c.querySelectorAll("[onclick],[oninput],[onkeydown]").forEach((e) => { e.removeAttribute("onclick"); e.removeAttribute("oninput"); e.removeAttribute("onkeydown"); });
  c.querySelectorAll("input").forEach((e) => { e.readOnly = true; e.tabIndex = -1; e.removeAttribute("autocomplete"); });
  const art = { "⚠️": "ungueltig", "🔢": "code", "🔑": "noetig", "✉️": "verloren", "📋": "einfuegen" };
  c.querySelectorAll(":scope > .karte").forEach((k) => { const h = k.querySelector("h3")?.textContent.trim() || ""; const a = Object.keys(art).find((x) => h.startsWith(x)); if (a) k.dataset.s = art[a]; if (art[a] === "ungueltig") k.classList.toggle("versteckt", !mitUngueltig); });
  return c.outerHTML;
}
const simAnmeldung = (rahmen, mitUngueltig) => `${rahmen === "handy" ? simStatus() : ""}<div class="sim-seite hell">${simGesperrt(mitUngueltig)}</div>`;
const simCodeBlatt = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte"><h3 style="margin-top:0">🔢 Code für ein anderes Gerät</h3>
  <p style="margin:0 0 6px">Auf dem anderen Gerät die Köcheclub-App öffnen, bei <b>„🔢 Mit Code anmelden“</b> eintippen:</p><div class="kc-code-gross" data-s="code">${RG_INST_CODE}</div>
  <p class="hinweis" style="text-align:center">gilt 15 Minuten · nur einmal · nicht weitergeben</p><div class="knoepfe"><span class="knopf">↻ Neuer Code</span><span class="knopf haupt">Fertig</span></div></div></div>`;
// PC: Fenster mit Adresszeile und Installieren-Zeichen ⊕ bzw. Schreibtisch mit Symbol
const simPc = (z = {}) => `<div class="sim-pc"><div class="sim-fenster"><div class="sim-tabs-pc"><span>🧑‍🍳 Köcheclub</span><span class="sim-pc-x">— ▢ ✕</span></div>
  <div class="sim-leiste pc">${simKn("zur", "←")}${simKn("neu", "↻")}<span class="sim-adr">🔒 ${esc(simAdr())}${simKn("plus", "⊕", "sim-plus")}</span>${simKn("menue", "⋮")}</div>
  <div class="sim-seite">${z.seite || simApp()}${z.ueber || ""}</div></div></div>`;
const simTablet = (inhalt) => `<div class="sim-tablet"><div class="sim-tablet-innen">${inhalt}</div></div>`;
// Ziffern nacheinander ins Code-Feld der geklonten Anmeldeseite tippen
async function rgSimCodeTippen(L) {
  const f = document.querySelector('#rgSim [data-s="code"] input'); if (!f) return;
  await L.tipp(f); f.value = "";
  for (const z of RG_INST_CODE) { f.value += z; await L.warte(z === " " ? 60 : 300); }
  await L.warte(500);
}
const rgSimNeu = (html, art) => () => rgSim(typeof html === "function" ? html() : html, art); // vor: Bild der Station aufbauen
const rgSimTipp = (q, danach, art) => async (L) => { await L.tipp(`#rgSim ${q}`); await L.warte(250); rgSim(danach(), art); L.ziel(); };
const RG_INST_ENDE = (b) => [
  { v: "start", vor: rgSimNeu(() => simHome()), sel: ['#rgSim [data-s="icon"]'], t: "🧑‍🍳 Die Kochmütze ist da",
    x: `Fertig! Die Köcheclub-Kochmütze liegt jetzt auf deinem Startbildschirm${b === "safari" ? "" : " – meistens auch in der App-Liste"}. Ab jetzt öffnest du die App immer über die Kochmütze.`,
    live: b === "safari" ? null : rgSimTipp('[data-s="icon"]', () => `${simStatus()}<div class="sim-seite">${simApp()}</div>`) },
];
const RG_INST_CHROME = [
  { v: "start", vor: rgSimNeu(() => simBrowser("chrome")), sel: ['#rgSim [data-s="menue"]'], puls: ['#rgSim [data-s="menue"]'], t: "🔵 Chrome: das Menü",
    x: "Du hast deinen Link in Chrome geöffnet. Oben rechts siehst du drei Punkte untereinander – die tippe ich an.",
    live: rgSimTipp('[data-s="menue"]', () => simBrowser("chrome", { ueber: simMenue(["Neuer Tab", "Neuer Inkognito-Tab", "Verlauf", "Downloads", "Lesezeichen", "Teilen …", "Auf Seite suchen", "📲 App installieren", "Desktopwebsite", "Einstellungen"], "📲 App installieren") })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("chrome", { ueber: simMenue(["Neuer Tab", "Neuer Inkognito-Tab", "Verlauf", "Downloads", "Lesezeichen", "Teilen …", "Auf Seite suchen", "📲 App installieren", "Desktopwebsite", "Einstellungen"], "📲 App installieren") })),
    sel: ['#rgSim [data-s="ziel"]'], t: "📲 App installieren",
    x: "Im Menü tippst du auf App installieren. Steht dort nur Zum Startbildschirm hinzufügen, nimm das – und wähle im nächsten Fenster Installieren, nicht Verknüpfung erstellen.",
    live: rgSimTipp('[data-s="ziel"]', () => simBrowser("chrome", { ueber: simDialog("App installieren", simKn("ab", "Abbrechen") + simKn("ok", "Installieren")) })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("chrome", { ueber: simDialog("App installieren", simKn("ab", "Abbrechen") + simKn("ok", "Installieren")) })), sel: ['#rgSim [data-s="ok"]'], t: "✅ Installieren",
    x: "Chrome fragt nach: Tippe auf Installieren. Fragt das Handy danach, ob etwas auf den Startbildschirm darf, tippst du auf Zulassen.",
    live: rgSimTipp('[data-s="ok"]', () => simHome()) },
  ...RG_INST_ENDE("chrome"),
];
const EDGE_MENUE = [["☆", "Favoriten"], ["🕘", "Verlauf"], ["⬇", "Downloads"], ["⊞", "Apps"], ["📲", "Zum Telefon hinzufügen"], ["↗", "Teilen"], ["🔍", "Auf Seite suchen"], ["⚙", "Einstellungen"]];
const RG_INST_EDGE = [
  { v: "start", vor: rgSimNeu(() => simBrowser("edge")), sel: ['#rgSim [data-s="menue"]'], puls: ['#rgSim [data-s="menue"]'], t: "🌊 Edge: das Menü",
    x: "In Edge ist das Menü unten in der Leiste: drei Striche übereinander. Die tippe ich an.",
    live: rgSimTipp('[data-s="menue"]', () => simBrowser("edge", { ueber: simGitter(EDGE_MENUE, "Zum Telefon hinzufügen") })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("edge", { ueber: simGitter(EDGE_MENUE, "Zum Telefon hinzufügen") })), sel: ['#rgSim [data-s="ziel"]'], t: "📲 Zum Telefon hinzufügen",
    x: "Es öffnet sich ein Feld mit vielen Symbolen. Tippe auf Zum Telefon hinzufügen. Heißt es bei dir App installieren oder Zum Startbildschirm hinzufügen, nimm das – manchmal musst du dafür im Feld zur Seite wischen.",
    live: rgSimTipp('[data-s="ziel"]', () => simBrowser("edge", { ueber: simDialog("App installieren", simKn("ab", "Abbrechen") + simKn("ok", "Installieren")) })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("edge", { ueber: simDialog("App installieren", simKn("ab", "Abbrechen") + simKn("ok", "Installieren")) })), sel: ['#rgSim [data-s="ok"]'], t: "✅ Installieren",
    x: "Edge fragt nach: Tippe auf Installieren. Fragt das Handy noch einmal, tippst du auf Hinzufügen oder Zulassen.",
    live: rgSimTipp('[data-s="ok"]', () => simHome()) },
  ...RG_INST_ENDE("edge"),
];
const SAMSUNG_MENUE = [["🔖", "Lesezeichen"], ["🕘", "Verlauf"], ["⬇", "Downloads"], ["➕", "Seite hinzufügen zu"], ["🛡", "Werbeblocker"], ["🌙", "Dunkler Modus"], ["🔍", "Auf Seite suchen"], ["⚙", "Einstellungen"]];
const SAMSUNG_ZIEL = `<div class="sim-blatt"><div class="sim-griff"></div><b class="sim-btitel">Seite hinzufügen zu</b><div class="sim-liste"><div>🔖 Lesezeichen</div><div>⚡ Schnellzugriff</div><div data-s="ziel">📱 Startbildschirm</div></div></div>`;
const RG_INST_SAMSUNG = [
  { v: "start", vor: rgSimNeu(() => simBrowser("samsung")), sel: ['#rgSim [data-s="menue"]'], puls: ['#rgSim [data-s="menue"]'], t: "🟣 Samsung Internet: das Menü",
    x: "Im Samsung-Browser Internet tippst du unten rechts auf die drei Striche übereinander.",
    live: rgSimTipp('[data-s="menue"]', () => simBrowser("samsung", { ueber: simGitter(SAMSUNG_MENUE, "Seite hinzufügen zu") })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("samsung", { ueber: simGitter(SAMSUNG_MENUE, "Seite hinzufügen zu") })), sel: ['#rgSim [data-s="ziel"]'], t: "➕ Seite hinzufügen zu",
    x: "Im Menü tippst du auf Seite hinzufügen zu.", live: rgSimTipp('[data-s="ziel"]', () => simBrowser("samsung", { ueber: SAMSUNG_ZIEL })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("samsung", { ueber: SAMSUNG_ZIEL })), sel: ['#rgSim [data-s="ziel"]'], t: "📱 Startbildschirm",
    x: "Jetzt Startbildschirm antippen.",
    live: rgSimTipp('[data-s="ziel"]', () => simBrowser("samsung", { ueber: simDialog("Zum Startbildschirm hinzufügen", simKn("ab", "Abbrechen") + simKn("ok", "Hinzufügen")) })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("samsung", { ueber: simDialog("Zum Startbildschirm hinzufügen", simKn("ab", "Abbrechen") + simKn("ok", "Hinzufügen")) })), sel: ['#rgSim [data-s="ok"]'], t: "✅ Hinzufügen",
    x: "Zum Schluss auf Hinzufügen tippen. Fragt das Handy noch einmal nach, nochmals Hinzufügen.", live: rgSimTipp('[data-s="ok"]', () => simHome()) },
  ...RG_INST_ENDE("samsung"),
];
const SAFARI_MENUE = `<div class="sim-menue unten rechts">${["☆ Zu Favoriten", "📖 Zur Leseliste", "🔖 Lesezeichen hinzufügen"].map((p) => `<div>${p}</div>`).join("")}<div data-s="ziel">↗ Teilen</div></div>`;
const SAFARI_TEILEN = `<div class="sim-blatt hoch"><div class="sim-griff"></div><div class="sim-teilen-apps"><span><i>📡</i>AirDrop</span><span><i>💬</i>Nachrichten</span><span><i>✉️</i>Mail</span><span><i>🟢</i>WhatsApp</span></div>
  <div class="sim-liste"><div>📋 Kopieren</div><div>👓 Zur Leseliste hinzufügen</div><div>🔖 Lesezeichen hinzufügen</div><div>☆ Zu Favoriten hinzufügen</div><div data-s="ziel">⊞ Zum Home-Bildschirm</div><div>🔍 Auf der Seite suchen</div></div></div>`;
const SAFARI_HINZU = () => `${simStatus()}<div class="sim-ios-kopf">${simKn("ab", "Abbrechen")}<b>Zum Home-Bildschirm</b>${simKn("ok", "Hinzufügen")}</div><div class="sim-seite hell sim-ios-hinzu">
  <div class="sim-appicon gross"><img src="icon-192.png" alt=""><div><b>Köcheclub</b><small>${esc(simAdr())}</small></div></div>
  <div class="sim-schalter" data-s="webapp"><span>Als Web-App öffnen</span><i></i></div></div>`;
const RG_INST_SAFARI = [
  { v: "start", vor: rgSimNeu(() => simBrowser("safari")), sel: ['#rgSim [data-s="menue"]'], puls: ['#rgSim [data-s="menue"]'], t: "🧭 Safari: die drei Punkte",
    x: "Auf dem iPhone öffnest du deinen Link in Safari. Unten rechts tippst du auf die drei Punkte. Bei älteren iPhones steht unten gleich das Teilen-Zeichen, ein Quadrat mit Pfeil nach oben – am iPad oben rechts.",
    live: rgSimTipp('[data-s="menue"]', () => simBrowser("safari", { ueber: SAFARI_MENUE })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("safari", { ueber: SAFARI_MENUE })), sel: ['#rgSim [data-s="ziel"]'], t: "↗ Teilen",
    x: "Im Menü tippst du auf Teilen.", live: rgSimTipp('[data-s="ziel"]', () => simBrowser("safari", { ueber: SAFARI_TEILEN })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("safari", { ueber: SAFARI_TEILEN })), sel: ['#rgSim [data-s="ziel"]'], t: "⊞ Zum Home-Bildschirm",
    x: "In der Liste etwas nach unten wischen und Zum Home-Bildschirm antippen.",
    live: rgSimTipp('[data-s="ziel"]', SAFARI_HINZU) },
  { v: "start", vor: rgSimNeu(SAFARI_HINZU), sel: ['#rgSim [data-s="ok"]'], puls: ['#rgSim [data-s="webapp"]'], t: "✅ Hinzufügen",
    x: "Als Web-App öffnen bleibt eingeschaltet. Oben rechts tippst du auf Hinzufügen.", live: rgSimTipp('[data-s="ok"]', () => simHome()) },
  { v: "start", vor: rgSimNeu(() => simHome()), sel: ['#rgSim [data-s="icon"]'], t: "🧑‍🍳 Die Kochmütze antippen",
    x: "Die Kochmütze liegt jetzt auf dem Home-Bildschirm. Ich tippe sie an.", live: rgSimTipp('[data-s="icon"]', () => simAnmeldung("handy")) },
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy")), sel: ['#rgSim [data-s="code"]'], t: "🔢 Einmal den Code eingeben",
    x: "Das iPhone gibt der neuen App einen eigenen Speicher – deshalb fragt sie einmal nach einem 6-stelligen Code. Den zeigt dir die App vorher in Safari: Einstellungen, App-Installation, Schritt für Schritt einrichten. Code eintippen – fertig.",
    live: async (L) => { await rgSimCodeTippen(L); rgSim(`${simStatus()}<div class="sim-seite">${simApp()}</div>`); } },
  ...RG_INST_ENDE("safari"),
];
const FIREFOX_MENUE = ["Neuer Tab", "Lesezeichen", "Verlauf", "Downloads", "📲 Zum Startbildschirm hinzufügen", "Teilen", "Auf Seite suchen", "Einstellungen"];
const RG_INST_FIREFOX = [
  { v: "start", vor: rgSimNeu(() => simBrowser("firefox")), sel: ['#rgSim [data-s="menue"]'], puls: ['#rgSim [data-s="menue"]'], t: "🦊 Firefox: das Menü",
    x: "In Firefox tippst du auf die drei Punkte untereinander – je nach Einstellung oben rechts oder unten rechts.",
    live: rgSimTipp('[data-s="menue"]', () => simBrowser("firefox", { ueber: simMenue(FIREFOX_MENUE, "📲 Zum Startbildschirm hinzufügen") })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("firefox", { ueber: simMenue(FIREFOX_MENUE, "📲 Zum Startbildschirm hinzufügen") })), sel: ['#rgSim [data-s="ziel"]'], t: "📲 Zum Startbildschirm hinzufügen",
    x: "Im Menü tippst du auf Zum Startbildschirm hinzufügen. Bei manchen Versionen heißt es Installieren.",
    live: rgSimTipp('[data-s="ziel"]', () => simBrowser("firefox", { ueber: simDialog("Zum Startbildschirm hinzufügen", simKn("ab", "Abbrechen") + simKn("ok", "Hinzufügen")) })) },
  { v: "start", vor: rgSimNeu(() => simBrowser("firefox", { ueber: simDialog("Zum Startbildschirm hinzufügen", simKn("ab", "Abbrechen") + simKn("ok", "Hinzufügen")) })), sel: ['#rgSim [data-s="ok"]'], t: "✅ Hinzufügen",
    x: "Der Name Köcheclub ist schon eingetragen. Tippe auf Hinzufügen. Fragt das Handy noch einmal, tippst du auf Hinzufügen oder Automatisch hinzufügen.",
    live: rgSimTipp('[data-s="ok"]', () => simHome()) },
  ...RG_INST_ENDE("firefox"),
  { v: "start", vor: rgSimNeu(() => simPc()), sel: ["#rgSim .sim-fenster"], t: "💻 Am PC",
    x: "Gut zu wissen: Am PC kann Firefox keine Apps installieren. Dort nimmst du Chrome oder Edge – wie das geht, zeigt das Video Weiteres Gerät." },
];
const RG_INST_START = [
  { v: "start", vor: rgSimNeu(simWhatsApp), sel: ['#rgSim [data-s="blase"]'], t: "📲 So kommst du zur App",
    x: "Die Köcheclub-App holst du dir nicht aus dem App-Store. Du bekommst vom Admin einen persönlichen Link – per WhatsApp oder per E-Mail." },
  { v: "start", vor: rgSimNeu(simWhatsApp), sel: ['#rgSim [data-s="link"]'], t: "🔗 Den Link antippen",
    x: "So sieht der Link aus: eine lange Adresse mit vielen Buchstaben und Zahlen. Die tippst du einfach an.",
    live: rgSimTipp('[data-s="link"]', () => simBrowser("chrome")) },
  { v: "start", vor: rgSimNeu(simMail), sel: ['#rgSim [data-s="link"]'], t: "✉️ Oder per E-Mail",
    x: "Kommt der Link per E-Mail, tippst du genauso in der Mail auf den Link.", live: rgSimTipp('[data-s="link"]', () => simBrowser("chrome")) },
  { v: "start", vor: rgSimNeu(simWhatsApp), sel: ['#rgSim [data-s="link"]'], puls: ['#rgSim [data-s="link"]'], t: "🔒 Nur für dich",
    x: "Ganz wichtig: Der Link ist dein persönlicher Schlüssel. Wer ihn hat, ist in der App als du angemeldet. Gib ihn deshalb nie weiter – auch nicht an andere Mitglieder." },
  { v: "start", vor: rgSimNeu(() => simBrowser("chrome")), sel: ["#rgSim .sim-app"], t: "🌐 Die App öffnet sich im Browser",
    x: "Der Link öffnet die App zuerst im Browser – du bist schon angemeldet. Damit sie wie eine richtige App auf dem Startbildschirm liegt, installierst du sie jetzt." },
  { v: "start", vor: rgSimNeu(() => simBrowser("mini")), sel: ['#rgSim [data-s="menue"]'], t: "⚠️ Kleines Fenster aus WhatsApp?",
    x: "Öffnet sich der Link in einem kleinen Fenster innerhalb von WhatsApp, kann man dort nicht installieren. Tippe oben rechts auf die drei Punkte und dann auf Im Browser öffnen – beim iPhone auf das Kompass-Zeichen.",
    live: async (L) => { await L.tipp('#rgSim [data-s="menue"]'); rgSim(simBrowser("mini", { ueber: simMenue(["Neu laden", "Link kopieren", "🌐 Im Browser öffnen"], "🌐 Im Browser öffnen") })); L.ziel(); await L.warte(900);
      await L.tipp('#rgSim [data-s="ziel"]'); await L.warte(250); rgSim(simBrowser("chrome")); L.ziel(); } },
  { v: "start", vor: rgSimNeu(() => `${simStatus()}<div class="sim-seite hell"><div class="sim-browserwahl">${RG_INST_BROWSER.map((b) => `<div data-s="${b.id}"${b.id === rgInstErkannt() ? ' class="an"' : ""}><i>${b.sym}</i><b>${b.n}</b><small>${b.wo}</small></div>`).join("")}</div></div>`),
    sel: ["#rgSim .sim-browserwahl"], puls: ["#rgSim .sim-browserwahl .an"], t: "🧭 Welcher Browser?",
    x: () => { const e = RG_INST_BROWSER.find((b) => b.id === rgInstErkannt());
      return `Wie das Installieren geht, hängt vom Browser ab: Chrome, Edge, Samsung Internet, Safari oder Firefox. ${e ? `Dein Gerät nutzt gerade ${e.n}. ` : ""}Am Ende dieses Videos wählst du deinen Browser – dann siehst du genau die Schritte, die du brauchst.`; } },
  { v: "start", vor: rgSimNeu(() => simHome()), sel: ['#rgSim [data-s="icon"]'], t: "🧑‍🍳 Das Ziel: die Kochmütze",
    x: "Am Ende liegt die Köcheclub-Kochmütze auf deinem Startbildschirm – wie jede andere App. Ab dann öffnest du die App immer über die Kochmütze." },
  { v: "start", vor: rgSimNeu(() => simPc()), sel: ["#rgSim .sim-fenster"], t: "💻 Tablet und PC",
    x: "Für weitere Geräte wie Tablet oder PC brauchst du keinen neuen Link – dafür gibt es einen 6-stelligen Code. Auch dazu gibt es ein eigenes Video. Jetzt wähle deinen Browser!" },
];
const PC_DIALOG = `<div class="sim-pc-pop"><b>App installieren?</b><div class="sim-appicon"><img src="icon-192.png" alt=""><div><b>Köcheclub</b><small>${"{adr}"}</small></div></div><div class="sim-dkn">${simKn("ok", "Installieren", "voll")}${simKn("ab", "Abbrechen")}</div></div>`;
const simPcDialog = () => PC_DIALOG.replace("{adr}", esc(simAdr()));
const RG_INST_GERAET = [
  { v: "start", vor: rgSimNeu(() => simTablet(simAnmeldung("tablet")), "tablet"), sel: ["#rgSim .sim-tablet"], t: "💻 Noch ein Gerät",
    x: "Du nutzt die App schon auf dem Handy und möchtest sie auch auf dem Tablet oder am PC? Dafür brauchst du keinen neuen Link – ein 6-stelliger Code reicht." },
  { v: "einstellungen", vor: () => { rgSimWeg(); const d = document.querySelector('#v-einstellungen details[data-klappe="install"]'); if (d && !d.open) { d.open = true; RG.zurueck.push(() => { d.open = false; }); } },
    sel: ['#v-einstellungen [onclick="kurzcodeBlatt()"]'], mussSel: true, t: "⚙️ Auf dem Handy: Code holen",
    x: "Auf dem Handy öffnest du die Einstellungen und dort App-Installation. Tippe auf Code für ein anderes Gerät.",
    live: async (L) => { await L.tipp('#v-einstellungen [onclick="kurzcodeBlatt()"]'); await L.warte(250); rgSim(simCodeBlatt(), "ueber"); RG.ziel = document.querySelector('#rgSim [data-s="code"]'); rgLage(); } },
  { v: "start", vor: rgSimNeu(simCodeBlatt, "ueber"), sel: ['#rgSim [data-s="code"]'], t: "🔢 Dein Code",
    x: "Die App zeigt dir einen 6-stelligen Code. Er gilt eine Viertelstunde und nur einmal – und ist genauso persönlich wie dein Link. Ist er abgelaufen, holst du dir mit Neuer Code einfach einen frischen." },
  { v: "start", vor: rgSimNeu(() => simTablet(simAnmeldung("tablet")), "tablet"), sel: ['#rgSim [data-s="code"]'], t: "🌐 Auf dem anderen Gerät",
    x: () => `Auf dem Tablet oder PC öffnest du den Browser und gibst oben die Adresse der App ein: ${simAdr()}. Es erscheint die Seite Willkommen mit Mit Code anmelden. Dort tippst du die 6 Ziffern ein – nach der sechsten meldet sich die App von selbst an.`,
    live: async (L) => { await rgSimCodeTippen(L); rgSim(simTablet(`<div class="sim-seite">${simApp()}</div>`), "tablet"); L.ziel(); } },
  { v: "start", vor: rgSimNeu(() => simPc(), "pc"), sel: ['#rgSim [data-s="plus"]'], puls: ['#rgSim [data-s="plus"]'], t: "💻 Am PC installieren",
    x: "Am PC in Chrome oder Edge: Rechts in der Adresszeile erscheint ein kleines Installieren-Zeichen. Das klickst du an und dann Installieren. In Edge geht es auch über die drei Punkte, Apps, Diese Website als App installieren.",
    live: async (L) => { await L.tipp('#rgSim [data-s="plus"]'); rgSim(simPc({ ueber: simPcDialog() }), "pc"); L.ziel(); await L.warte(1200); await L.tipp('#rgSim [data-s="ok"]'); await L.warte(250); rgSim(simHome(true, "pc"), "pc"); L.ziel(); } },
  { v: "start", vor: rgSimNeu(() => simHome(true, "pc"), "pc"), sel: ['#rgSim [data-s="icon"]'], t: "🧑‍🍳 Kochmütze auf dem Desktop",
    x: "Jetzt liegt die Kochmütze auf dem Desktop und im Startmenü. Am Tablet installierst du wie am Handy – das Video für deinen Browser zeigt es dir." },
  { v: "start", vor: rgSimNeu(() => simTablet(simHome()), "tablet"), sel: ["#rgSim .sim-tablet"], t: "🍎 Beim iPad",
    x: "Beim iPad gilt: Zuerst in Safari die Kochmütze auf den Home-Bildschirm legen und den Code erst dort eintippen – dann brauchst du nur einen Code." },
];
const RG_INST_CODES = [
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy")), sel: ["#rgSim .sim-gesperrt"], t: "🔑 Link, Code und Co.",
    x: "Rund um die Anmeldung gibt es ein paar Begriffe: Link, Code, Link verloren. Ich erkläre dir kurz, was was ist – damit nichts schiefgeht." },
  { v: "start", vor: rgSimNeu(simWhatsApp), sel: ['#rgSim [data-s="link"]'], t: "🔗 Der persönliche Link",
    x: "Der lange Link vom Admin ist dein dauerhafter Schlüssel zur App. Er gilt so lange, bis ein neuer Link für dich verschickt wird. Nicht weitergeben!" },
  { v: "start", vor: rgSimNeu(simCodeBlatt, "ueber"), sel: ['#rgSim [data-s="code"]'], t: "🔢 Der 6-stellige Code",
    x: "Der Code ist kurz und nur für den Moment: eine Viertelstunde lang und nur einmal. Du holst ihn dir selbst in der App – für ein weiteres Gerät oder für die App auf dem iPhone. Holst du einen neuen Code, gilt der alte nicht mehr." },
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy")), sel: ['#rgSim [data-s="code"]'], t: "✅ Mit Code anmelden",
    x: "Diese Seite zeigt ein Gerät, das noch nicht angemeldet ist. Bei Mit Code anmelden tippst du den Code ein." },
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy")), sel: ['#rgSim [data-s="verloren"]'], t: "✉️ Link verloren?",
    x: "Hast du deinen Link nicht mehr? Hier gibst du die E-Mail-Adresse ein, die im Club hinterlegt ist – dann kommt sofort ein neuer Link per Mail. Achtung: Der alte Link gilt danach nicht mehr. Geräte, die damit angemeldet waren, brauchen den neuen Link oder einen Code." },
  { v: "start", vor: rgSimNeu(() => `${simStatus()}<div class="sim-seite hell"><div class="karte" data-s="mich"><b>💻 Auch am PC oder Tablet nutzen</b><p class="hinweis">Schick dir deinen Link selbst und öffne ihn am anderen Gerät.</p>
      <div class="knoepfe"><span class="knopf klein">📧 Meinen eigenen Link mailen</span><span class="knopf klein">📤 Meinen Link an mich schicken</span><span class="knopf klein">📋 Meinen Link kopieren</span></div></div></div>`),
    sel: ['#rgSim [data-s="mich"]'], t: "📤 Meinen Link an mich schicken",
    x: "In den Einstellungen unter App-Installation kannst du dir deinen eigenen Link mailen, schicken oder kopieren – zum Beispiel, um ihn am PC zu öffnen. Dabei bleibt dein Link gleich, nichts wird ungültig." },
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy")), sel: ['#rgSim [data-s="einfuegen"]'], t: "📋 Link einfügen",
    x: "Öffnet sich die App auf dem iPhone nicht mit deinem Link? Dann den Link in der Mail oder in WhatsApp lange drücken, Kopieren wählen und hier einfügen." },
  { v: "start", vor: rgSimNeu(() => simAnmeldung("handy", true)), sel: ['#rgSim [data-s="ungueltig"]'], t: "⚠️ Dieser Link gilt nicht mehr",
    x: "Steht oben Dieser Link gilt nicht mehr, wurde inzwischen ein neuerer Link für dich verschickt. Nimm immer den neuesten – oder fordere bei Link verloren einen neuen an." },
  { v: "start", vor: rgSimWeg, t: "✅ Kurz gesagt",
    x: "Der Link ist dauerhaft, kommt vom Admin und wird nie weitergegeben. Der Code ist kurz, gilt eine Viertelstunde und ist für ein weiteres Gerät. Und bei Link verloren kommt ein neuer Link per Mail – der alte gilt dann nicht mehr." },
];
// nach der Einführung bis zum Ende: Browser wählen – nur dieses Video ansehen
function rgInstWahl() {
  if (RG.an) return;
  const e = rgInstErkannt();
  const f = dlgOeffnen(`<h3 style="margin-top:0">🧭 Welchen Browser nutzt du?</h3><p class="hinweis" style="margin:0 0 8px">Tippe deinen Browser an – dann zeige ich dir genau diese Schritte.</p>
    <div class="rg-inst-wahl">${RG_INST_BROWSER.map((b) => `<button type="button" class="knopf${b.id === e ? " haupt" : ""}" data-v="${b.video}">${b.sym} ${b.n} <small>${b.wo}${b.id === e ? " · dein Gerät" : ""}</small></button>`).join("")}
    <button type="button" class="knopf" data-v="inst_geraet">💻 Weiteres Gerät <small>Tablet oder PC mit Code</small></button></div>
    <div class="knoepfe"><button type="button" class="knopf klein" data-zu="1">Schließen</button></div>`, () => f.remove());
  f.querySelectorAll("[data-v]").forEach((k) => k.addEventListener("click", () => { f.remove(); rundgangStart(false, k.dataset.v); }));
  f.querySelector("[data-zu]").onclick = () => f.remove();
}
// KC-CLUB-VIDEO-LIVE: Stationen, die einen Einstellungs-Bereich aufklappen, tippen vorher dessen Überschrift an (nur wenn er zu und zu sehen ist)
for (const liste of [RG_EINSTELLUNGEN, RG_LEITUNG, RG_ADMIN]) for (const x of liste) {
  const m = typeof x.sel?.[0] === "string" && /details\[data-klappe="([^"]+)"\]$/.exec(x.sel[0]);
  if (m && !x.tippVor) x.tippVor = () => { const d = document.querySelector(rgKlappe(m[1])); return d && !d.open ? d.querySelector(":scope > summary") : null; };
}
// Während eines Videos nur zeigen, was zur Zielgruppe passt: für alle ohne Admin- und Leitungs-Elemente, für die Leitung ohne Admin-Elemente
function rgRollenAnsicht(ziel) {
  const b = document.body, an = !!ziel;
  b.classList.toggle("rg-ohne-admin", an && ziel !== "admin"); b.classList.toggle("rg-ohne-leitung", an && ziel === "alle");
  b.classList.toggle("ist-admin", !!ICH?.admin && (!an || ziel === "admin")); // Admin-Lämpchen, Herz, Brille nur im Admin-Video
  try { if (RK.einst?.an) rkAufbauen(RK.einst); } catch {} // Rollkartei der Einstellungen ohne ausgeblendete Karten neu legen
}
// KC-CLUB-VIDEO-THEMEN (2.256.0, Wunsch Hansi „bei vielen Videos in Themen-Kacheln unterteilen, auf der Kachel anzeigen, wie viele es gibt;
// Kästchen zum Anhaken – alle angehakten automatisch nacheinander abspielen“). Registry RG_THEMEN: Video-IDs je Thema; ein Video, das in
// keinem Thema steht (z. B. neu dazugekommen), landet unter „✨ Weitere“ – es geht keins verloren. Wenige Videos: eine Liste ohne Kacheln.
const RG_THEMEN = [
  { id: "einstieg", sym: "🚀", t: "Einstieg", videos: ["warum", "ueberblick", "einfach", "spezial", "hilfe", "probleme", "schulung", "feedback"] },
  { id: "installieren", sym: "📲", t: "App installieren", videos: ["installieren", "inst_chrome", "inst_edge", "inst_samsung", "inst_safari", "inst_firefox", "inst_geraet", "inst_codes"] }, // 2.276.0 KC-CLUB-VIDEO-INSTALL
  { id: "kontakt", sym: "💬", t: "Schreiben & Kontakt", videos: ["zentrale", "sprache", "nachricht", "chatprofi", "geheim", "gruppen", "mitglieder", "pinnwand"] },
  { id: "termine", sym: "📅", t: "Termine & Dienst", videos: ["termin", "terminfinden", "zusagen", "todo", "dienst"] },
  { id: "club", sym: "🗄️", t: "Club & Archiv", videos: ["fotos", "lesen", "rezepte", "aktionen", "archiv", "vorschlag", "helfen", "erstattung"] },
  { id: "ich", sym: "👤", t: "Ich & meine App", videos: ["status", "meinedaten", "push", "privat", "einstellungen", "oberflaeche", "effekte", "rueckseite", "wecker", "anpassen", "figur", "figurbau", "technik", "studio"] },
  { id: "freizeit", sym: "🎲", t: "Spiele, Fitness & Notfall", videos: ["spiele", "raetsel", "buehne", "fit", "sos"] },
  { id: "leitung", sym: "🗂️", t: "Für die Clubleitung", videos: ["leitung", "buero"] },
  { id: "admin", sym: "🛠️", t: "Für Admins", videos: ["admin"] },
];
// ---------- 2.348.0 KC-CLUB-VIDEO-PUSH (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-PUSH (Wunsch Hansi „Benachrichtigungen richtig einrichten“): nur vorgeführt – Push wird nicht ein- oder ausgeschaltet,
// kein Test geschickt, kein Häkchen gesetzt. „Meine Geräte“ liest nur die Liste; Fenster, Beispielbilder und Aufgeklapptes gehen am Ende wieder zu.
const rgPushTipp = (n) => () => { const d = document.querySelector(rgKlappe(n)); return d && !d.open ? d.querySelector(":scope > summary") : null; }; // 2.348.0 KC-CLUB-VIDEO-PUSH
function rgPushAuf(n) { // 2.348.0 KC-CLUB-VIDEO-PUSH: Bereich aufklappen; in der Rollkartei gleich die richtige Karte nach vorn (sonst überholen sich zwei Blätter-Läufe)
  rgAuf(n); const z = RK.einst, d = document.querySelector(rgKlappe(n)), i = z?.an ? z.karten.indexOf(d) : -1;
  if (i < 0) return;
  if (RG.pushRkAlt == null) { RG.pushRkAlt = z.i; RG.zurueck.push(() => { const a = RG.pushRkAlt; RG.pushRkAlt = null; if (RK.einst?.an && a != null && RK.einst.i !== a) { RK.einst.i = a; rkStellen(RK.einst); } }); }
  if (z.i !== i) { z.i = i; rkStellen(z); }
}
function rgPushGeraete(an) { // 2.348.0 KC-CLUB-VIDEO-PUSH: Fenster „Meine Geräte mit Push“ zeigen (nur lesen) – am Ende wieder zu
  if (!an) { $("geFenster")?.remove(); return; }
  if (!RG.pushGeZurueck) { RG.pushGeZurueck = true; RG.zurueck.push(() => { RG.pushGeZurueck = false; $("geFenster")?.remove(); }); }
  if ($("geFenster")) { $("geFenster").classList.add("rg-zeigen"); return; }
  const s = RG.st[RG.i];
  geraeteBlatt().then(() => { const f = $("geFenster"); if (!f) return; if (!RG.an || RG.st[RG.i] !== s) return f.remove(); f.classList.add("rg-zeigen"); rgNeuZielen(); }).catch(() => {});
}
// Beispielbild des Fensters, das die App höchstens einmal am Tag zeigt, wenn das Handy die Erlaubnis verloren hat (Text wie in pushPruefen)
const rgPushWiederBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🔔 Deine Benachrichtigungen sind aus</h3>
  <p style="margin:0 0 8px">Dein Handy hat die Benachrichtigungen für die Club-App verloren – das passiert z. B. nach einer Neuinstallation oder wenn das Handy aufräumt.
  Darum bekommst du gerade <b>kein Anklopfen</b> und <b>keine Hinweise auf neue Nachrichten</b>, solange die App zu ist.</p>
  <div class="knoepfe"><span class="knopf haupt" data-s="an">🔔 Jetzt wieder einschalten</span><span class="knopf" data-s="spaeter">Später</span></div></div></div>`; // 2.348.0 KC-CLUB-VIDEO-PUSH
const RG_PUSH = [
  { v: "einstellungen", sel: ["#v-einstellungen .kopf2"], t: "👋 Benachrichtigungen",
    x: "In diesem Video zeige ich dir, wie Nachrichten aus dem Club zuverlässig auf dein Handy kommen: Push einschalten, für jeden Bereich wählen, ausprobieren – und was du tust, wenn nichts ankommt. Keine Sorge: Ich schalte nichts um und verschicke nichts." },
  // 1. Push einschalten – erweiterte Ansicht
  { v: "einstellungen", nur: () => !einfach(), tippVor: rgPushTipp("benachrichtigung"), vor: () => rgPushAuf("benachrichtigung"), sel: [rgOn("pushUmschalten()", ".schalter")], mussSel: true,
    puls: ["#pushKnopf", "#pushStatus"], t: "📲 Push auf diesem Handy",
    x: "Das Wichtigste zuerst: Unter Mehr, Benachrichtigungen steht Push auf diesem Handy. Tippst du auf Einschalten, fragt dein Handy, ob die Club-App Benachrichtigungen schicken darf – das erlaubst du. Darunter steht dann Eingeschaltet." },
  // 1. Push einschalten – einfache Ansicht
  { v: "einstellungen", nur: () => einfach(), tippVor: rgPushTipp("einfach"), vor: () => rgPushAuf("einfach"), sel: ["#neuWahl"], mussSel: true, puls: ["#neuWahl .knopf"], t: "📲 Aufs Handy",
    x: "In der einfachen Ansicht wählst du unter Das Wichtigste, wie du Neuigkeiten bekommst: Aufs Handy, Per E-Mail oder Beides. Bei Aufs Handy fragt dein Handy einmal, ob die Club-App Benachrichtigungen schicken darf – das erlaubst du." },
  // 2. je Bereich
  { v: "einstellungen", nur: () => !einfach(), vor: () => rgPushAuf("benachrichtigung"), sel: [() => document.querySelector(rgKlappe("benachrichtigung"))?.querySelector(".wahltabelle")], mussSel: true,
    puls: [() => [...document.querySelectorAll(`${rgKlappe("benachrichtigung")} .wahltabelle th`)]], t: "📋 Für jeden Bereich",
    x: "In der Tabelle legst du für jeden Bereich fest, ob du einen Push, eine E-Mail, beides oder nichts bekommst – zum Beispiel bei neuen Nachrichten, Sitzungen, der Erinnerung an deinen Dienst, Geburtstagen und neuen Zetteln an der Pinnwand. Ist nur Push angehakt und er kommt nicht an, schicken wir automatisch eine E-Mail." },
  // 3. Nicht stören
  { v: "einstellungen", vor: () => rgPushAuf(einfach() ? "einfach" : "benachrichtigung"), sel: [rgFeld("ruheAn"), rgFeld("ruheAnE")], mussSel: true,
    puls: ["#ruheAn", "#ruheVon", "#ruheBis", "#ruheErw", "#ruheAnE"], t: "🌙 Nachts Ruhe",
    x: () => einfach() ? "Mit Nicht stören kommt nachts kein Push – Anrufe kommen trotzdem durch, danach gibt es eine Sammelmeldung." : "Bei Nicht stören legst du eine Ruhezeit fest, zum Beispiel von 22 bis 7 Uhr. In dieser Zeit kommt kein Push – Anrufe kommen trotzdem durch, danach gibt es eine Sammelmeldung." },
  // 4. Test an mich – Kachel nur zeigen
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("ganz"), sel: [rgKachel("test")], mussSel: true, kacheln: ["test"], t: "🧪 Test an mich",
    x: "Ob alles ankommt, probierst du im Register Meins mit Test an mich aus: Es öffnet sich eine Unterhaltung nur mit dir, und mit dem Pfeil schickst du dir eine Probe – als Push oder E-Mail, so wie du es eingestellt hast. Danach kurz die App schließen, dann siehst du den Push. Hier schicke ich nichts." },
  // 5. Meine Geräte
  { v: "einstellungen", vor: () => rgPushAuf(einfach() ? "einfach" : "benachrichtigung"), sel: [rgOn("geraeteBlatt()", ".knoepfe")], mussSel: true,
    puls: [rgOn("geraeteBlatt()"), rgOn("pushTest()")], t: "📱 Auf welchen Geräten?",
    x: () => einfach() ? "Kommt auf dem Tablet nichts an? Meine Geräte zeigt, welche deiner Handys und Tablets Benachrichtigungen bekommen." : "Kommt auf dem Tablet nichts an? Meine Geräte zeigt, welche deiner Handys und Tablets Benachrichtigungen bekommen. Daneben schickt Test-Push senden eine Probe – hier schicke ich keine." },
  { v: "einstellungen", vor: () => { rgPushAuf(einfach() ? "einfach" : "benachrichtigung"); rgPushGeraete(true); }, nach: () => rgPushGeraete(false),
    sel: ["#geFenster .blatt-innen", rgOn("geraeteBlatt()", ".knoepfe")], t: "📱 Meine Geräte mit Push",
    x: "Hier stehen alle Geräte, die deine Push-Meldungen bekommen – das Handy, das du gerade benutzt, ist mit dieses Gerät markiert. Fehlt eins, schalte auf diesem Gerät Push ein. Ein altes Handy kannst du hier entfernen." },
  // 6. Anklopfton
  { v: "einstellungen", tippVor: rgPushTipp("privat"), vor: () => rgPushAuf("privat"), sel: [rgFeld("setKlopfTon")], mussSel: true,
    puls: ["#setKlopfTon", rgOn("klopfTonSpielen(")], t: "🔔 Der Anklopfton",
    x: "Welcher Ton erklingt, wenn jemand bei dir anklopft – Holz-Klopfen, Ding-Dong, Gong oder Glöckchen –, suchst du dir unter Privatsphäre beim Anklopfton aus. Mit Testton hörst du ihn vorher." },
  // 7. Ansagen bei offener App
  { v: "einstellungen", tippVor: rgPushTipp("ansagen"), vor: () => rgPushAuf("ansagen"), sel: ["#setSprAnsZeile"], mussSel: true, puls: ["#setSprAnsZeile .knopf"], t: "🗣️ Ansagen bei offener App",
    x: "Solange die App offen ist, kann dein Handy auch ansagen, was dich betrifft – zum Beispiel, wer gerade online kommt. Das wählst du unter Ansagen, Töne und Tipps bei Sprachansagen. Ist die App zu, kommt der normale Push mit Ton." },
  // 8. Push repariert sich selbst
  { v: "einstellungen", nur: () => !einfach(), vor: () => rgPushAuf("benachrichtigung"), sel: [rgOn("pushUmschalten()", ".schalter")], mussSel: true, puls: ["#pushStatus"], t: "🩹 Push repariert sich selbst",
    x: "Ist der Push-Zugang auf deinem Gerät kaputt, obwohl das Handy Benachrichtigungen erlaubt, richtet die App ihn beim Öffnen von selbst neu ein. Du musst dafür nichts tun." },
  { v: "einstellungen", vor: rgSimNeu(rgPushWiederBild, "ueber"), nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="an"]', '#rgSim [data-s="spaeter"]'], t: "🔔 Deine Benachrichtigungen sind aus",
    x: "Hat das Handy die Erlaubnis verloren und du bekommst auf keinem Gerät mehr etwas, zeigt die App höchstens einmal am Tag dieses Fenster. Dann tippst du auf Jetzt wieder einschalten." },
  // 9. Wenn nichts ankommt
  { v: "einstellungen", nur: () => !einfach(), vor: () => rgPushAuf("benachrichtigung"), sel: [rgOn("pushUmschalten()", ".schalter")], mussSel: true, puls: ["#pushStatus"], t: "🤔 Es kommt nichts an",
    x: "Kommt nichts an, schau zuerst hier. Steht unter Push auf diesem Handy Im Browser blockiert, hat das Handy die Benachrichtigungen gesperrt. Dann in den Handy-Einstellungen unter Apps, Chrome oder Club-App, Benachrichtigungen wieder einschalten und die App neu öffnen." },
  { v: "einstellungen", nur: () => einfach(), vor: () => rgPushAuf("einfach"), sel: ["#neuWahl"], mussSel: true, puls: ["#neuWahl .knopf"], t: "🤔 Nichts kommt an",
    x: "Kommt nichts an, schau zuerst hier, ob Aufs Handy oder Beides gewählt ist. Hat das Handy die Benachrichtigungen gesperrt, schaltest du sie in den Handy-Einstellungen unter Apps, Chrome oder Club-App, Benachrichtigungen wieder ein und öffnest die App neu." },
  { v: "einstellungen", vor: () => rgPushAuf(einfach() ? "einfach" : "benachrichtigung"), sel: [rgFeld("ruheAn"), rgFeld("ruheAnE")], mussSel: true, puls: ["#ruheAn", "#ruheAnE"], t: "🌙 Gerade Ruhezeit?",
    x: "Prüfe auch die Ruhezeit: Ist Nicht stören eingeschaltet, kommt in dieser Zeit kein Push, sondern danach eine Sammelmeldung. Und ist am Handy selbst Nicht stören oder ein Ruhemodus an, bleibt es ebenfalls still." },
  { v: "einstellungen", tippVor: rgPushTipp("install"), vor: () => rgPushAuf("install"), sel: [rgKlappe("install")], mussSel: true, puls: [rgOn("einrichtenAssistent()")], video: "installieren", t: "📲 Ist die App installiert?",
    x: "Auf dem iPhone geht Push nur, wenn die App auf dem Home-Bildschirm liegt. Wie du die App richtig installierst, steht hier unter App-Installation – Schritt für Schritt." },
  { v: "einstellungen", t: "✅ Fertig",
    x: () => (einfach() ? "Das war's: Aufs Handy wählen, Benachrichtigungen erlauben und bei Meine Geräte nachsehen." : "Das war's: Push auf diesem Handy einschalten, für jeden Bereich wählen, mit Test an mich ausprobieren und bei Meine Geräte nachsehen.") + ` Kommt trotzdem nichts an, frag Twinkey oder ${adminName()}.` },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-PRIVAT (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-PRIVAT (Wunsch Hansi „Privatsphäre & Handy weitergeben“): nur vorgeführt – kein Schalter umgelegt, nichts gespeichert,
// nicht abgemeldet, kein Code geholt. Beispielbilder (Link, Anmeldeseite) und „Meine Daten“ gehen am Ende wieder weg, die Rollkartei steht wie vorher.
function rgPrivatAuf(n) { // 2.348.0 KC-CLUB-VIDEO-PRIVAT: Bereich aufklappen; in der Rollkartei gleich die richtige Karte nach vorn (sonst überholen sich zwei Blätter-Läufe)
  rgAuf(n); const z = RK.einst, d = document.querySelector(rgKlappe(n)), i = z?.an ? z.karten.indexOf(d) : -1;
  if (i < 0) return;
  if (RG.privatRkAlt == null) { RG.privatRkAlt = z.i; RG.zurueck.push(() => { const a = RG.privatRkAlt; RG.privatRkAlt = null; if (RK.einst?.an && a != null && RK.einst.i !== a) { RK.einst.i = a; rkStellen(RK.einst); } }); }
  if (z.i !== i) { z.i = i; rkStellen(z); }
}
const rgPrivatTipp = (n) => () => { const d = document.querySelector(rgKlappe(n)); return d && !d.open ? d.querySelector(":scope > summary") : null; }; // 2.348.0 KC-CLUB-VIDEO-PRIVAT
const rgPrivat = (felder) => ({ v: "einstellungen", vor: () => rgPrivatAuf("privat"), mussSel: true, ...felder }); // 2.348.0 KC-CLUB-VIDEO-PRIVAT: Station im Bereich Privatsphäre
const RG_PRIVAT = [
  { v: "einstellungen", sel: ["#v-einstellungen .kopf2"], t: "👋 Deine Privatsphäre",
    x: "In diesem Video zeige ich dir, was andere Mitglieder von dir sehen und wie du das selbst bestimmst. Danach: was du tust, wenn du dein Handy weitergibst oder deinen Link verloren hast. Keine Sorge: Ich verstelle nichts." },
  rgPrivat({ tippVor: rgPrivatTipp("privat"), sel: [rgKlappe("privat")], t: "🔒 Wo finde ich das?",
    x: "Alles dazu steht unter Mehr, Einstellungen, Privatsphäre. Ich gehe die Schalter der Reihe nach mit dir durch." }),
  rgPrivat({ sel: [rgFeld("setGeburtstag")], puls: ["#setGeburtstag", "#setRundGeburtstag"], t: "🎂 Mein Geburtstag",
    x: "Mein Geburtstag anzeigen: Andere sehen dann nur Tag und Monat – im Kalender, in der Terminliste und unter Heute wichtig. Darunter erlaubst du, dass die Clubleitung bei runden Geburtstagen dein Alter sieht, damit der Club gratulieren kann." }),
  rgPrivat({ sel: [rgFeld("setOnline")], puls: ["#setOnline"], t: "🟢 Bin ich online?",
    x: "Anderen zeigen, wann ich online bin: Dann sehen andere einen grünen Punkt bei dir und können anklopfen. Schaltest du es aus, siehst du auch selbst nicht, wer online ist." }),
  rgPrivat({ sel: [rgFeld("setZuletzt")], puls: ["#setZuletzt"], t: "🕒 Zuletzt da",
    x: "Wie bei WhatsApp: Anderen zeigen, wann ich zuletzt da war – heute mit Uhrzeit, sonst nur grob, zum Beispiel gestern. Ausgeschaltet siehst du es auch bei den anderen nicht." }),
  rgPrivat({ sel: [rgFeld("setAnklopfen")], puls: ["#setAnklopfen"], t: "👋 Anklopfen",
    x: "Anklopfen erlauben: Andere dürfen bei dir anklopfen, wenn du online bist. Ist es aus, schreiben sie dir stattdessen eine Nachricht." }),
  rgPrivat({ sel: [rgFeld("setLiveTippen")], puls: ["#setLiveTippen"], t: "👁️ Sieht man mein Tippen?",
    x: "Sehen andere, was ich tippe? Nein – solange du es nicht willst. Andere sehen live, was ich tippe ist von Haus aus aus; dann sehen die anderen nur: schreibt. Schaltest du es ein, können die anderen – wenn sie mögen – sogar deine Tastenanschläge hören." }),
  rgPrivat({ sel: [rgFeld("setKontakt_mail")], puls: ["#setKontakt_handy", "#setKontakt_festnetz", "#setKontakt_mail", "#setKontakt_adresse", rgOn("mitgliedOeffnen(ICH.person_id)")], t: "📱 Meine Kontaktdaten",
    x: "Darunter bestimmst du, was andere Mitglieder sehen: deine Handynummer, Festnetznummer, E-Mail-Adresse und Adresse. Mit So sehen mich die anderen prüfst du das Ergebnis." }),
  rgPrivat({ sel: [rgFeld("nfName")], puls: ["#nfName", "#nfTel", "#nfBez"], t: "🆘 Mein Notfallkontakt",
    x: "Beim Notfallkontakt trägst du eine andere Person ein, die im Notfall benachrichtigt werden soll – zum Beispiel deine Frau oder einen Nachbarn. Den sehen nur Clubsprecher, Kassenwart und Admin." }),
  rgPrivat({ sel: [rgOn("geraetAbmelden()", ".schalter")], puls: [rgOn("geraetAbmelden()")], t: "🚪 Handy weitergeben",
    x: "Gibst du ein Handy oder Tablet weiter, tippe vorher ganz unten bei Von diesem Gerät abmelden auf Abmelden. Dann sind dein Zugang und alle Club-Daten auf diesem Gerät gelöscht – auch Notfallpass und Entwürfe. Auf deinen anderen Geräten bleibt alles; hier tippe ich natürlich nicht." }),
  { v: "einstellungen", vor: rgSimNeu(simWhatsApp), nach: rgSimWeg, sel: ['#rgSim [data-s="link"]'], mussSel: true, t: "🔗 Dein persönlicher Link",
    x: () => `Die App öffnest du über deinen persönlichen Link – so wie hier im Beispiel. Gib ihn bitte nicht weiter: Wer ihn hat, ist in der App als du angemeldet. Neues Handy oder Link verloren? ${adminName()} erzeugt dir einen neuen.` },
  { v: "einstellungen", vor: rgSimNeu(() => simAnmeldung("handy")), nach: rgSimWeg, sel: ['#rgSim [data-s="verloren"]'], mussSel: true, video: "inst_codes", t: "✉️ Link verloren?",
    x: "Hast du deinen Link nicht mehr, hilft auf der Anmeldeseite Link verloren: E-Mail-Adresse eingeben, und ein neuer persönlicher Link kommt per Mail. Dein alter Link gilt danach nicht mehr." },
  { v: "einstellungen", tippVor: rgPrivatTipp("install"), vor: () => rgPrivatAuf("install"), sel: [rgOn("kurzcodeBlatt()")], mussSel: true, puls: [rgOn("kurzcodeBlatt()")], t: "🔢 Zweites Gerät mit Code",
    x: "Für ein zweites Gerät brauchst du keinen Link: Unter App-Installation holst du dir mit Code für ein anderes Gerät einen 6-stelligen Code und tippst ihn auf dem neuen Gerät ein. Hier hole ich keinen Code." },
  { v: "start", nur: () => !einfach(), vor: () => { rgKopf("ganz"); rgReg("mein"); }, sel: [rgKachel("meinedaten")], mussSel: true, kacheln: ["meinedaten"], t: "🔐 Meine Daten",
    x: "Was weiß die App über dich? Das zeigt die Kachel Meine Daten im Register Meins.", live: async (L) => { await L.tipp(rgKachel("meinedaten")); rgBlatt("mdatBlatt", mdatStart); L.ziel(); } },
  { v: "start", vor: () => rgBlatt("mdatBlatt", mdatStart), sel: ["#mdatBlatt .blatt-innen"], video: "meinedaten", t: "👀 Alles auf einen Blick",
    x: "Hier steht alles, was über dich gespeichert ist: deine Angaben, dein Zugang, deine Rechte und Benachrichtigungen. Nur du siehst diese Übersicht." },
  { v: "start", vor: () => rgBlatt("mdatBlatt", mdatStart), nach: () => { if ($("mdatBlatt")) fensterZu($("mdatBlatt")); }, sel: ["#mdatInhalt .na-pfeil-knoepfe", "#mdatBlatt .blatt-innen"],
    puls: ["#mdatInhalt .na-pfeil-knoepfe .knopf"], t: "🖨️ Drucken oder melden",
    x: "Unten kannst du die Übersicht drucken oder als Datei sichern. Stimmt etwas nicht, tippst du auf Änderung melden – hier melde ich nichts." },
  { v: "einstellungen", t: "✅ Fertig",
    x: "Das war's: Unter Privatsphäre bestimmst du, was andere sehen. Vor dem Weitergeben eines Handys meldest du dich dort ab. Deinen Link gibst du nie weiter – und bei Link verloren kommt ein neuer per Mail." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-PROBLEME (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-PROBLEME (Wunsch Hansi „Wenn etwas nicht klappt“): nur vorgeführt – kein Update, keine Prüfung, nichts gesendet oder gemeldet,
// die App wird nicht geschlossen. Schnecke und Lade-Leiste werden nur gezeigt; Verbindungs-Fenster, Beispielbilder und Kopf stehen am Ende wie vorher.
function rgProblemeAuf(n) { // 2.348.0 KC-CLUB-VIDEO-PROBLEME: Bereich aufklappen; in der Rollkartei gleich die richtige Karte nach vorn
  rgAuf(n); const z = RK.einst, d = document.querySelector(rgKlappe(n)), i = z?.an ? z.karten.indexOf(d) : -1;
  if (i < 0) return;
  if (RG.problemeRkAlt == null) { RG.problemeRkAlt = z.i; RG.zurueck.push(() => { const a = RG.problemeRkAlt; RG.problemeRkAlt = null; if (RK.einst?.an && a != null && RK.einst.i !== a) { RK.einst.i = a; rkStellen(RK.einst); } }); }
  if (z.i !== i) { z.i = i; rkStellen(z); }
}
function rgProblemeVb(an) { // 2.348.0 KC-CLUB-VIDEO-PROBLEME: Fenster „Verbindung“ (wie für Mitglieder) zeigen – es wird nichts geprüft oder gesendet
  if (an) { vbEinfachZeigen(); $("verbindungBlatt").classList.remove("versteckt"); }
  rgFest("verbindungBlatt", an);
}
function rgProblemeSchnecke(an) { // 2.348.0 KC-CLUB-VIDEO-PROBLEME: Schnecke oben nur zeigen (schon ein Stück im Bild); danach wieder so, wie die App gerade misst
  const weg = () => { $("schnecke")?.querySelectorAll(".sn-zug, .sn-spur").forEach((e) => (e.style.animationDelay = "")); schneckeZeigen(); };
  if (!an) return weg();
  if (!RG.problemeSchnecke) { RG.problemeSchnecke = true; RG.zurueck.push(() => { RG.problemeSchnecke = false; weg(); }); }
  schneckeZeigen(); const z = $("schnecke"); if (!z) return;
  z.querySelectorAll(".sn-zug, .sn-spur").forEach((e) => (e.style.animationDelay = "-9s")); z.classList.remove("versteckt");
}
const RG_PROBLEME_LADE = { action: "rg_vorfuehrung", lesen: true, langsam: true, ab: new AbortController(), wunsch: "", timer: 0 }; // 2.348.0 KC-CLUB-VIDEO-PROBLEME: nur zum Zeigen
function rgProblemeLade(an) { // 2.348.0 KC-CLUB-VIDEO-PROBLEME: Leiste „Laden dauert zu lange“ zeigen – es lädt nichts, nichts wird abgebrochen
  if (an) {
    if (!RG.problemeLade) { RG.problemeLade = true; RG.zurueck.push(() => { RG.problemeLade = false; LADE.laufe.delete(RG_PROBLEME_LADE); ladeZeigen(); }); }
    RG_PROBLEME_LADE.ab = new AbortController(); LADE.laufe.add(RG_PROBLEME_LADE); LADE.zu = false;
  } else LADE.laufe.delete(RG_PROBLEME_LADE);
  ladeZeigen();
}
// Beispielbilder (Texte wie in zweiFensterMelden und mikroHilfe)
const rgProblemeZweiBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🪟 Die Club-App ist schon offen</h3>
  <p style="margin:0 0 8px">Die Club-App ist in diesem Browser noch in einem <b>anderen Fenster oder Tab</b> offen. Zwei Fenster gleichzeitig machen die App langsamer und können bei Nachrichten durcheinanderbringen.</p>
  <div class="knoepfe"><span class="knopf haupt" data-s="hier">✅ Hier weitermachen</span><span class="knopf" data-s="zu">✖ Dieses Fenster schließen</span></div></div></div>`;
const rgProblemeMikroBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🎙️ Mikrofon ist gesperrt</h3>
  <p style="margin:0 0 8px">Die Köcheclub-App darf dein Mikrofon gerade nicht benutzen. Tippe auf <b>„🎙️ Jetzt freischalten“</b> und dann bei deinem Handy auf <b>„Zulassen“</b> bzw. <b>„Erlauben“</b> – danach geht es gleich weiter.</p>
  <div style="display:grid;gap:8px"><span class="knopf haupt" data-s="frei">🎙️ Jetzt freischalten</span><span class="knopf" data-s="assistent">🧭 Schritt für Schritt helfen</span><span class="knopf" data-s="tippen">⌨️ Weiter tippen</span></div></div></div>`;
const RG_PROBLEME = [
  { v: "start", vor: () => rgKopf("offen"), t: "👋 Wenn etwas nicht klappt",
    x: () => `Manchmal hängt die App, lädt lange oder das Mikrofon will nicht. In diesem Video zeige ich dir, was du selbst tun kannst – und wann du am besten ${adminName()} fragst. Ich tippe dabei nichts an.` },
  { v: "start", vor: () => rgKopf("ganz"), sel: [rgOn("appSchliessen()")], mussSel: true, puls: [rgOn("appSchliessen()")], t: "🚪 Ganz schließen und neu öffnen",
    x: "Hängt die App oder zeigt sie Altes? Dann zuerst die App ganz schließen und neu öffnen. Dafür gibt es ganz unten auf der Startseite den Knopf App schließen." },
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("ganz"), sel: [rgKachel("update")], mussSel: true, kacheln: ["update"], video: "technik", t: "🔄 Update holen",
    x: "Hilft das nicht, tippe im Register Technik auf Update prüfen. Steht dort Neu, lädt die App die neue Version komplett und startet neu. Meist macht sie das auch von selbst." },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#kopfVersion"], mussSel: true, puls: ["#kopfVersion"], t: "🔢 Welche Version habe ich?",
    x: "Welche Version du hast, steht oben klein unter der Kochmütze. Antippen prüft ebenfalls, ob es etwas Neues gibt." },
  { v: "start", vor: () => rgKopf("offen"), sel: ["#leds", "#v-start .statusleiste"], mussSel: true, puls: ["#leds"], t: "🟢 Das Lämpchen oben",
    x: "Oben im Kopf zeigt ein Lämpchen, ob die App Verbindung hat – grün heißt alles gut. Im Zweifel einfach antippen.",
    live: async (L) => { await L.tipp("#leds"); rgProblemeVb(true); L.ziel(); }, nach: () => rgProblemeVb(false) },
  { v: "start", vor: () => { rgKopf("offen"); rgProblemeVb(true); }, nach: () => rgProblemeVb(false), sel: ["#vbInhalt", "#verbindungBlatt .blatt-innen"], mussSel: true,
    puls: ["#vbInhalt .vb-status", "#vbInhalt [onclick*='verbindungMelden']"], t: "📨 Ergebnis senden",
    x: () => `Im Fenster steht zum Beispiel Verbindung in Ordnung. Hakt etwas, schickst du mit Ergebnis an ${adminName()} senden die Messwerte – nur Technik-Werte, keine Inhalte. Hier schicke ich nichts.` },
  { v: "start", vor: () => { rgKopf("offen"); rgProblemeSchnecke(true); }, nach: () => rgProblemeSchnecke(false), sel: ["#schnecke"], mussSel: true, t: "🐌 Die Schnecke",
    x: "Erscheint oben eine kleine Schnecke, ist das Netz gerade langsam. Alles funktioniert weiter, dauert aber länger: bitte etwas Geduld und nicht mehrfach tippen. Ist das Netz wieder schnell, verschwindet sie von selbst." },
  { v: "start", vor: () => rgProblemeLade(true), nach: () => rgProblemeLade(false), sel: ["#ladeHilfe"], mussSel: true, puls: ["#ladeHilfe .lh-ja", "#ladeHilfe .lh-nein"], t: "⏳ Laden dauert zu lange",
    x: "Dauert das Laden länger als 12 Sekunden, erscheint unten diese Leiste: Nochmal versuchen lädt neu, Abbrechen beendet das Warten. Beim Senden wird dagegen nie abgebrochen oder doppelt geschickt. Auch bei Twinkey kommt dann Nochmal versuchen." },
  { v: "start", vor: rgSimNeu(rgProblemeZweiBild, "ueber"), nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="hier"]', '#rgSim [data-s="zu"]'], t: "🪟 Die App ist zweimal offen",
    x: "Läuft die Club-App auf demselben Gerät zweimal, meldet sie das. Hier weitermachen legt das andere Fenster schlafen, Dieses Fenster schließen schließt dieses." },
  { v: "start", vor: rgSimNeu(rgProblemeMikroBild, "ueber"), nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="frei"]', '#rgSim [data-s="assistent"]'], t: "🎤 Mikrofon klappt nicht",
    x: "Klappt Diktieren oder die Sprachnachricht nicht, darf die App meist das Mikrofon nicht benutzen. Dann tippst du in diesem Fenster auf Jetzt freischalten und beim Handy auf Zulassen. Hilft das nicht, führt dich Schritt für Schritt helfen durch den Mikrofon-Assistenten." },
  { v: "start", nur: () => !einfach(), vor: () => rgKopf("ganz"), sel: [rgKachel("sicherheit")], mussSel: true, kacheln: ["sicherheit"], t: "🛡️ Sicherheits-Check",
    x: "Ein gutes Gefühl mit einem Tipp: Der Sicherheits-Check im Register Technik prüft, ob die App auf deinem Gerät sicher und richtig läuft. Grüne Haken heißen alles gut; sonst steht dabei, was zu tun ist. Hier starte ich keine Prüfung." },
  { v: "einstellungen", nur: () => !einfach(), vor: () => rgProblemeAuf("app"), sel: [rgOn("fpProblemMelden()", ".knoepfe")], mussSel: true, puls: [rgOn("fpProblemMelden()"), rgOn("appInfoKopieren()")], t: "🙋 Problem melden",
    x: () => `Bleibt das Problem, sag ${adminName()} Bescheid: Unter Mehr, App-Info tippst du auf Problem melden – ${adminName()} sieht dann automatisch, welches Handy, welcher Browser und welche Version du hast. Infos kopieren legt diese Angaben bereit, zum Einfügen in eine Nachricht.` },
  { v: "einstellungen", nur: () => einfach(), vor: () => rgProblemeAuf("einfach"), sel: [rgOn("zeige('feedback')", ".schalter")], mussSel: true, puls: [rgOn("zeige('feedback')")], t: "🙋 Feedback schreiben",
    x: () => `Bleibt das Problem, schreib ${adminName()} kurz, was passiert ist: unter Mehr bei Feedback auf Schreiben tippen.` },
  { v: "start", vor: () => rgKopf("offen"), t: "✅ Fertig",
    x: () => `Kurz gesagt: App ganz schließen und neu öffnen, Update holen, aufs Lämpchen schauen – und bei der Schnecke etwas Geduld haben. Hilft das alles nicht, frag Twinkey oder ${adminName()}.` },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-CHATPROFI (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-CHATPROFI: Beispiel-Chat nur auf dem Bildschirm. Die echte Chat-Anzeige (chatLaden) zeichnet ihn; dafür beantwortet
// eine vorübergehende Weiche vor api() NUR Aufrufe für die Beispiel-Unterhaltung selbst (nichts davon geht an den Server). Alles andere läuft
// unverändert durch. Am Ende (RG.zurueck) kommen api, Chat, Schreibfeld und Fenster in den alten Stand – gespeichert oder gesendet wird nichts.
const RG_CP_ID = "rg-chatprofi-beispiel";
function rgChatprofiDaten() {
  const vor = (min) => new Date(Date.now() - min * 60000).toISOString(), ich = ICH?.person_id || "ich", ichName = ICH?.name || "Du";
  const a = { von: "Anne Beispiel", vonId: "rg-cp-anne" }, k = { von: "Klaus Muster", vonId: "rg-cp-klaus" }, du = { von: ichName, vonId: ich, eigen: true };
  const m = (n, wer, min, x = {}) => ({ id: "rg-cp-" + n, ...wer, eigen: !!wer.eigen, zeit: vor(min), text: "", anlagen: [], reaktionen: [], gelesenVon: [], ...x });
  const nachrichten = [
    m(1, a, 190, { text: "Hallo zusammen! Grillabend am Samstag um 18 Uhr bei mir im Garten.", angeheftet: true }),
    m(2, k, 175, { text: "Wer bringt was mit?" }),
    m(3, a, 160, { text: "📎", anlagen: [{ id: "rg-cp-sprache", name: "Sprachnachricht.webm", mime: "audio/webm" }] }),
    m(4, k, 150, { text: "📊 Grillen oder Pizza?", umfrage: { frage: "Grillen oder Pizza?", mehrfach: false, gesamt: 3, optionen: [
      { text: "Grillen", stimmen: 2, meine: true, namen: ["Du", "Anne"] }, { text: "Pizza", stimmen: 1, meine: false, namen: ["Klaus"] }] } }),
    m(5, a, 120, { text: "Denkt bitte an Teller und Besteck!", gemerkt: true, reaktionen: [{ emoji: "👍", anzahl: 2, meine: true, namen: ["Du", "Klaus"] }] }),
    m(6, k, 60, { text: "Code für das Gartentor: 4711", loeschtAm: new Date(Date.now() + 179 * 60000).toISOString() }),
    m(7, du, 40, { text: "Super, ich bin dabei!", haken: "gelesen" }),
    m(8, du, 30, { text: "Ich bringe Brot und Kräuterbutter mit.", haken: "angekommen", antwortAuf: { id: "rg-cp-2", von: "Klaus Muster", text: "Wer bringt was mit?" } }),
    m(9, du, 5, { text: "Bitte gebt bis Donnerstag Bescheid, wer kommt!", haken: "gesendet", wichtig: true }),
  ];
  return { id: RG_CP_ID, betreff: "Grillabend", teilnehmer: [{ person_id: ich, name: ichName }, { person_id: a.vonId, name: a.von }, { person_id: k.vonId, name: k.von }],
    nachrichten, angeheftet: [{ id: "rg-cp-1", von: "Anne Beispiel", text: nachrichten[0].text }], selbstloeschen: 0, gelesenBis: nachrichten[3].zeit, tippt: [], entwurf: [], spricht: [] };
}
function rgChatprofiAuf() {
  if (RG.cpAn) { if (chatId !== RG_CP_ID || !$("msg-rg-cp-1")) { chatId = RG_CP_ID; chatStand = ""; NA.trennerChat = null; chatLaden(true).then(() => { if (RG.an && RG.cpAn) rgNeuZielen(); }); } return; }
  RG.cpAn = true;
  const alt = { api, CHAT, chatId, na: NA.nachrichten, text: $("text").value, empf: { ...EMPF }, vl: VL.chat, stand: chatStand, trenner: NA.trennerChat };
  api = async (a, d = {}, o) => (d && (d.id === RG_CP_ID || d.chat === RG_CP_ID || String(d.id || "").startsWith("rg-cp-")) ? (a === "unterhaltung" ? rgChatprofiDaten() : {}) : alt.api(a, d, o));
  RG.zurueck.push(() => {
    RG.cpAn = false; api = alt.api; $("naMenue")?.remove(); $("chatBlatt").classList.add("versteckt"); $("anlageBlatt").classList.add("versteckt");
    if (chatId === RG_CP_ID) chatId = alt.chatId; CHAT = alt.CHAT; NA.nachrichten = alt.na; chatStand = alt.stand; NA.trennerChat = alt.trenner; NA.trennerVor = null;
    EMPF.chat = alt.empf.chat; EMPF.letzte = alt.empf.letzte; VL.chat = alt.vl;
    $("chat").innerHTML = ""; $("chatAngeheftet").innerHTML = ""; $("text").value = alt.text; entwurfMarkeZeigen();
  });
  EMPF.chat = RG_CP_ID; EMPF.letzte = "rg-cp-6"; // kein Ankunfts-Effekt beim Zeichnen
  chatId = RG_CP_ID; chatStand = ""; NA.trennerChat = null; chatLaden(true).then(() => { if (RG.an && RG.cpAn) rgNeuZielen(); });
}
const rgChatprofiBlase = (n) => () => $("msg-rg-cp-" + n);
const rgChatprofiKnopf = (wurzel, anfang) => () => [...document.querySelectorAll(wurzel + " button")].find((b) => b.textContent.trim().startsWith(anfang) && rgSichtbar(b)) || null;
function rgChatprofiMenue(id, pfeil) { // Menü an einer Nachricht nur zeigen – die Knöpfe tippt niemand an
  rgChatprofiAuf(); (pfeil ? naPfeilMenue : nachrichtMenue)(id); $("naMenue")?.classList.add("rg-zeigen");
}
function rgChatprofiBlatt(id) { rgChatprofiAuf(); if (id === "chatBlatt") chatMenue(); else $(id).classList.remove("versteckt"); rgFest(id, true); }
function rgChatprofiTempo() { // so sieht die Sprachnachricht nach „anhören“ aus: Player + Tempo-Knopf (spielt nichts ab)
  const k = document.querySelector("#msg-rg-cp-3 .sprache > button"); if (!k) return;
  const a = document.createElement("audio"); a.controls = true; a.preload = "none";
  const t = document.createElement("button"); t.type = "button"; t.className = "tempo"; t.title = "Abspiel-Tempo"; t.textContent = String(sprachTempo()).replace(".", ",") + "×";
  k.replaceWith(a); a.after(t);
}
function rgChatprofiTempoWeiter() { const t = document.querySelector("#msg-rg-cp-3 .tempo"); if (!t) return; const i = SPRACH_TEMPI.findIndex((x) => String(x).replace(".", ",") + "×" === t.textContent); t.textContent = String(SPRACH_TEMPI[(i + 1) % SPRACH_TEMPI.length]).replace(".", ",") + "×"; }
const RG_CHATPROFI = [
  { v: "chat", vor: rgChatprofiAuf, sel: ["#chatKopf"], t: "👋 Mehr aus dem Chat holen", x: "In diesem Video zeige ich dir an einem Beispiel-Chat, was du im Chat noch alles machen kannst: Nachrichten anheften, merken und weiterleiten, die Haken verstehen, abstimmen, vorlesen lassen und vieles mehr. Keine Sorge – der Chat ist nur ein Beispiel, ich sende und speichere nichts." },
  { v: "chat", vor: rgChatprofiAuf, sel: ["#neuTrenner"], t: "⬇️ Wo hatte ich aufgehört?", x: "Öffnest du einen Chat, zeigt die App sofort die neueste Nachricht. Die Linie Neue Nachrichten markiert, ab wo es für dich Neues gibt." },
  { v: "chat", vor: () => rgChatprofiMenue("rg-cp-2"), nach: () => $("naMenue")?.remove(), tippVor: "#msg-rg-cp-2 .txt", sel: ["#naMenue .na-menue"],
    puls: ["#naMenue .na-schnell", rgChatprofiKnopf("#naMenue", "↩️ Antworten"), rgChatprofiKnopf("#naMenue", "📌 Oben anheften"), rgChatprofiKnopf("#naMenue", "⭐ Merken"), rgChatprofiKnopf("#naMenue", "📋 Kopieren")],
    t: "👆 Nachricht antippen", x: "Tippst du eine Nachricht an, öffnet sich dieses Menü. Oben reagierst du schnell mit einem Bild, zum Beispiel Daumen hoch. Darunter: Antworten, Oben anheften, Merken und Kopieren – der Text liegt dann in der Zwischenablage, zum Beispiel für eine E-Mail." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(8)], puls: ["#msg-rg-cp-8 .zitat"], t: "↩️ Antworten mit Zitat", x: "Mit Antworten steht die Nachricht, auf die du dich beziehst, als Zitat oben in deiner Antwort. So weiß jeder sofort, worum es geht." },
  { v: "chat", vor: rgChatprofiAuf, sel: ["#chatAngeheftet"], puls: ["#chatAngeheftet .pin-zeile"], t: "📌 Oben angeheftet", x: "Eine angeheftete Nachricht bleibt oben über dem Chat stehen und rutscht nicht weg – bis zu drei Stück. Antippen springt zur Nachricht." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(5)], puls: ['#msg-rg-cp-5 .fuss span[title="gemerkt"]', "#msg-rg-cp-5 .reaktionen"], t: "⭐ Gemerkt", x: "Eine gemerkte Nachricht bekommt einen Stern – so findest du sie später schnell wieder. Darunter siehst du auch die Reaktionen, hier zweimal Daumen hoch." },
  { v: "chat", vor: () => rgChatprofiMenue("rg-cp-7", true), nach: () => $("naMenue")?.remove(), tippVor: "#msg-rg-cp-7 .na-pfeil", sel: ["#naMenue .na-menue"],
    puls: [rgChatprofiKnopf("#naMenue", "↪️ Weiterleiten"), rgChatprofiKnopf("#naMenue", "📋 Kopieren"), rgChatprofiKnopf("#naMenue", "✂️ Ausschneiden"), rgChatprofiKnopf("#naMenue", "🗄️ Archivieren"), rgChatprofiKnopf("#naMenue", "❗ Wichtig"), rgChatprofiKnopf("#naMenue", "🗑️ Löschen")],
    t: "➡️ Der kleine Pfeil", x: "Am kleinen Pfeil neben einer Nachricht gibt es noch mehr: Weiterleiten an eine andere Person oder Unterhaltung, Kopieren, Ausschneiden, Archivieren in deinen eigenen Archiv-Ordner und Löschen. Bei deinen eigenen Nachrichten kommt Wichtig dazu." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(9)], puls: ["#msg-rg-cp-9 .wichtig-marke", "#msg-rg-cp-9 .na-pfeil"], t: "❗ Nachträglich wichtig", x: "Vergessen, beim Senden Wichtig anzuhaken? Dann wählst du am Pfeil deiner Nachricht Wichtig. Sie bekommt den orangefarbenen Rahmen für alle im Chat – eine neue Benachrichtigung geht dabei nicht raus." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(9)], puls: ["#msg-rg-cp-9 .haken", "#msg-rg-cp-8 .haken", "#msg-rg-cp-7 .haken", "#msg-rg-cp-9 .na-info"], t: "✔️ Was die Haken bedeuten", x: "Die Haken an deinen Nachrichten: ein grauer Haken heißt gesendet, zwei graue Haken heißen auf dem Handy angekommen – sie kommen, sobald die Mitteilung auf dem anderen Handy erscheint oder seine App die Nachricht geladen hat –, zwei blaue Haken heißen gelesen. Tippst du die Haken an, siehst du genau, wer gelesen hat, bei wem sie angekommen ist und bei wem noch nicht – mit Uhrzeit. Weitere Einzelheiten stehen unter dem kleinen i neben der Nachricht." },
  { v: "chat", vor: () => { rgChatprofiAuf(); setTimeout(rgChatprofiTempo, 60); }, sel: [rgChatprofiBlase(3)], puls: ["#msg-rg-cp-3 .sprache"],
    live: async (L) => { await L.warte(2500); await L.tipp("#msg-rg-cp-3 .tempo"); rgChatprofiTempoWeiter(); await L.warte(1500); await L.tipp("#msg-rg-cp-3 .tempo"); rgChatprofiTempoWeiter(); },
    t: "⏩ Sprachnachricht schneller hören", x: "Lange Sprachnachrichten kannst du schneller hören: Der kleine Tempo-Knopf sitzt direkt an der Sprachnachricht. Einmal tippen für 1,5-fach, nochmal für doppelt so schnell. Deine Wahl merkt sich das Handy." },
  { v: "chat", vor: () => rgChatprofiBlatt("chatBlatt"), nach: () => rgFest("chatBlatt", false), tippVor: "#chatMenueKnopf", sel: [rgChatprofiKnopf("#chatBlatt", "🔊 Vorlesen ab")],
    puls: [rgChatprofiKnopf("#chatBlatt", "🔊 Vorlesen ab"), rgChatprofiKnopf("#chatBlatt", "🔊 Ganzen Chat")], t: "🔊 Chat vorlesen lassen", x: "Hände voll, zum Beispiel beim Kochen? Oben über die drei Punkte wählst du Vorlesen ab den neuen Nachrichten oder Ganzen Chat vorlesen. Das Handy liest vor, du hörst einfach zu." },
  { v: "chat", vor: () => rgChatprofiBlatt("anlageBlatt"), nach: () => rgFest("anlageBlatt", false), tippVor: '#eingabe [title="Anlage"]', sel: ["#anlageBlatt .blatt-innen"],
    puls: [rgChatprofiKnopf("#anlageBlatt", "📊 Abstimmung")], t: "📊 Schnell abstimmen", x: "Grillen oder Pizza? Unten unter dem Schreibfeld tippst du auf die Büroklammer und dann auf Abstimmung. Du stellst eine Frage mit zwei bis acht Antworten." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(4)], puls: ["#msg-rg-cp-4 .cu-opt"], t: "🗳️ Die Abstimmung im Chat", x: "So sieht die Abstimmung im Chat aus. Antippen genügt, und deine Stimme zählt. Alle sehen gleich, wie es gerade steht und wer was gewählt hat." },
  { v: "chat", vor: () => rgChatprofiBlatt("chatBlatt"), nach: () => rgFest("chatBlatt", false), tippVor: "#chatMenueKnopf", sel: ["#chatSlKnopf"], t: "⏳ Selbstlöschen im ganzen Chat",
    x: "Über die drei Punkte und Selbstlöschen stellst du ein, dass alle neuen Nachrichten in diesem Chat nach einer Stunde, 24 Stunden oder 7 Tagen verschwinden – bei allen." },
  { v: "chat", vor: rgChatprofiAuf, sel: [rgChatprofiBlase(6)], puls: ["#msg-rg-cp-6 .sl-marke", "#ablaufKnopf"], t: "⏳ Nur eine Nachricht", x: "Nur für eine einzelne Nachricht tippst du beim Schreiben unten auf die Sanduhr. Solche Nachrichten zeigen, wie lange sie noch da sind – hier noch 3 Stunden. Push und E-Mail enthalten dann keinen Text." },
  { v: "chat", vor: () => { rgChatprofiAuf(); $("text").value = "Ich bringe noch einen Nachtisch mit"; entwurfMarkeZeigen(); }, nach: () => { $("text").value = ""; entwurfMarkeZeigen(); },
    sel: ["#eingabe"], puls: ["#entwurfMarke", "#text"], t: "✏️ Angefangen, nicht gesendet", x: "Mitten im Schreiben klingelt es an der Tür? Kein Problem: Dein angefangener Text bleibt in diesem Chat auf deinem Handy liegen. Der Hinweis Entwurf, noch nicht gesendet, erinnert dich später daran." },
  { v: "chat", vor: () => { rgChatprofiAuf(); if (!$("rgCpWarte")) $("chat").insertAdjacentHTML("beforeend", '<div class="ow-warte" id="rgCpWarte"><div class="ow-blase">Bin im Keller und hole die Grillkohle.<small>⏳ wartet auf Netz – wird automatisch gesendet</small></div></div>'); },
    nach: () => $("rgCpWarte")?.remove(), sel: ["#rgCpWarte"], t: "📵 Schreiben ohne Netz", x: "Im Keller oder unterwegs kein Empfang? Schreib ruhig trotzdem. Die Nachricht zeigt wartet auf Netz und geht von ganz allein raus, sobald wieder Verbindung da ist." },
  // 2.362.0 KC-CLUB-SPAETER-SENDEN: ⏰ später senden, auch mit Wiederholung
  { v: "chat", vor: () => { rgChatprofiAuf(); if (!$("rgCpGeplant")) $("chat").insertAdjacentHTML("beforeend", '<div class="gp-warte" id="rgCpGeplant"><div class="gp-blase">Guten Morgen! Denkt an den Einkauf für Samstag.<small>⏰ wird gesendet Mo um 8:00 Uhr · 🔁 jeden Montag<br><i>Nur du siehst das – antippen zum Ändern</i></small></div></div>'); },
    nach: () => $("rgCpGeplant")?.remove(), sel: ["#rgCpGeplant", "#spaeterKnopf"], puls: ["#spaeterKnopf"], t: "⏰ Später senden",
    x: "Soll eine Nachricht erst später ankommen? Schreib sie wie immer und tippe dann unten auf den Wecker. Du wählst die Zeit, zum Beispiel morgen früh um acht, und wie oft: nur einmal oder zum Beispiel jeden Montag. Bis dahin steht sie blass unten im Chat – nur du siehst sie. Antippen, und du kannst sie gleich senden, die Zeit ändern oder löschen. Gesendet wird auch, wenn dein Handy aus ist." },
  { v: "chat", vor: () => rgChatprofiBlatt("chatBlatt"), nach: () => rgFest("chatBlatt", false), tippVor: "#chatMenueKnopf", sel: [() => $("chatBlatt")?.querySelector(".na-pfeil-knoepfe")],
    puls: [rgChatprofiKnopf("#chatBlatt .na-pfeil-knoepfe", "📋 Kopieren"), rgChatprofiKnopf("#chatBlatt .na-pfeil-knoepfe", "🖨️ Ausdrucken"), rgChatprofiKnopf("#chatBlatt", "🗄️ Chat in mein Archiv")],
    t: "🖨️ Den ganzen Chat", x: "Unter den drei Punkten steht auch Ganzer Chat: Kopieren, zum Beispiel für eine E-Mail, Ausdrucken und Chat in mein Archiv legen." },
  { v: "chat", vor: () => rgChatprofiBlatt("chatBlatt"), nach: () => rgFest("chatBlatt", false), sel: ["#chatArchivKnopf"], puls: ["#chatArchivKnopf", "#chatKomplettKnopf"], t: "📦 Chat archivieren",
    x: "Chat archivieren räumt ihn aus deiner Liste. Er bleibt dort, auch wenn jemand schreibt, und du kannst ihn jederzeit wieder aktivieren. Bei mir komplett löschen entfernt den Chat nur bei dir – die anderen behalten ihn." },
  { v: "nachrichten", sel: [rgChatprofiKnopf("#v-nachrichten .kom-leiste", "⭐ Gemerkt")], t: "⭐ Alles Gemerkte", x: "Zurück in der Übersicht der Nachrichten: Unter Gemerkt findest du alle Nachrichten, die du dir gemerkt hast. Diese Liste siehst nur du." },
  { v: "nachrichten", mussSel: true, sel: [".uh-archiv-zeile", ".uh-archiv-kopf"], t: "📦 Archivierte Chats", x: "Archivierte Chats stehen oben unter Archiviert. Dort tippst du einen Chat an und holst ihn mit Wieder aktivieren zurück." },
  // 2.533.0 KC-CLUB-HILFE-NACHTRAG-4: „… schreibt dir gerade“ außerhalb des Chats – nur ein Bild des Hinweises (Antippen öffnet nichts)
  { v: "nachrichten", vor: () => { if ($("schreibtHinweis")) return; const el = document.createElement("div"); el.id = "schreibtHinweis"; el.className = "schreibt-hinweis"; el.innerHTML = '<span class="punkte3"><i></i><i></i><i></i></span> ✍️ <b>Anne</b> schreibt dir gerade …'; document.body.appendChild(el); },
    nach: () => $("schreibtHinweis")?.remove(), sel: ["#schreibtHinweis"], mussSel: true, puls: ["#schreibtHinweis"], t: "✍️ Anne schreibt dir gerade",
    x: "Schreibt dir jemand im Zweier-Chat, während du woanders in der App bist, steht oben kurz: Anne schreibt dir gerade. Oder: diktiert dir gerade eine Nachricht, oder: nimmt gerade eine Sprachnachricht für dich auf. So weißt du, dass gleich etwas kommt. Antippen öffnet den Chat, mit der Nachricht verschwindet der Hinweis. Bei stumm geschalteten Chats bleibt es still." },
  // 2.671.0 KC-CLUB-HILFE-NACHTRAG-5: Senden ohne Warten, jederzeit ändern, weitere Empfänger – Beispielbilder, es wird nichts gesendet oder geändert
  { v: "nachrichten", vor: rgSimNeu(() => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin:0 0 10px">⏳ Senden ohne Warten</h3>
      <div class="blase meine" style="margin:0 0 8px auto;max-width:85%" data-s="warte">Bin um sieben da 👍 <small>⏳</small></div>
      <div class="blase meine" style="margin:0 0 8px auto;max-width:85%" data-s="fehler">Bringst du den Kuchen mit? <small>⚠️</small><div style="margin-top:6px"><span class="knopf klein">🔄 Nochmal</span> <span class="knopf klein">🗑️ Löschen</span></div></div></div></div>`, "ueber"),
    nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="warte"]', '#rgSim [data-s="fehler"]'], t: "⏳ Senden ohne Warten",
    x: "Nach dem Senden steht deine Nachricht sofort im Chat, mit einer kleinen Sanduhr – und du kannst gleich weiterschreiben. Die App schickt alles der Reihe nach los, Express überholt. Klappt es einmal nicht, steht ein Warnzeichen daran: Nochmal oder Löschen." },
  { v: "nachrichten", vor: rgSimNeu(() => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin:0 0 10px">✏️ Jederzeit ändern</h3>
      <div class="knoepfe" style="flex-direction:column;align-items:stretch"><span class="knopf" data-s="bearb">✏️ Bearbeiten</span><span class="knopf" data-s="unter">✏️ Unterschrift ändern</span></div>
      <p class="hinweis" style="margin:10px 0 0">Die anderen sehen „bearbeitet“ – ohne neue Benachrichtigung.</p></div></div>`, "ueber"),
    nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="bearb"]', '#rgSim [data-s="unter"]'], t: "✏️ Jederzeit ändern",
    x: "Eigene Nachrichten änderst du jederzeit: antippen und Bearbeiten. Bei Fotos und Dateien heißt der Knopf Unterschrift hinzufügen oder Unterschrift ändern. Die anderen sehen bearbeitet – eine neue Benachrichtigung gibt es nicht." },
  { v: "nachrichten", vor: rgSimNeu(() => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin:0 0 10px">➕ Auch an weitere</h3>
      <div class="hinweis" data-s="zeile" style="padding:8px 10px;border-radius:10px;background:var(--karte2)">➕ auch an: <b>Klaus, Dieter</b> <small>– daraus wird eine Runde mit allen</small></div></div></div>`, "ueber"),
    nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="zeile"]'], t: "➕ Auch an weitere",
    x: "Soll eine Nachricht auch an andere gehen, tippst du in der kleinen Zeile über der Tastatur auf das Plus und wählst Mitglieder. Über dem Schreibfeld steht dann: auch an Klaus und Dieter. Beim Senden wird daraus eine Runde mit allen – euer bisheriger Verlauf bleibt privat." },
  { v: "nachrichten", t: "✅ Fertig", x: "Das war der Chat für Fortgeschrittene: antippen für Antworten, Anheften und Merken, der Pfeil für Weiterleiten und Wichtig, die Haken, Sprachtempo, Vorlesen, Abstimmung, Selbstlöschen, Entwurf, die drei Punkte für den ganzen Chat und der Hinweis, wenn dir jemand gerade schreibt. Wie du geheim schreibst, zeigt dir das Video Geheim schreiben. Probier es in Ruhe aus!" },
];


// 2.671.0 KC-CLUB-VIDEO-WECKER (Hilfe-Nachtrag 5): die Uhr der Kopf-Rückseite mit Wecker, Stoppuhr und Timer. Es wird nichts gestellt und nichts an den
// Server geschickt (Wecker und Timer nur gezeigt, das Klingel-Fenster ist ein Beispielbild); die Stoppuhr läuft kurz zur Vorführung – am Ende sind
// Stoppuhr-Stand und gewählte Anzeige wie vorher.
function rgWk(modus) {
  rgRueck("uhr");
  if (!RG.wkZurueck) { RG.wkZurueck = true; const altModus = esLies("uhrmodus", "uhr"); let altStand = null; try { altStand = localStorage.getItem(WK_KEY); } catch {}
    RG.zurueck.push(() => { RG.wkZurueck = false; try { if (altStand === null) localStorage.removeItem(WK_KEY); else localStorage.setItem(WK_KEY, altStand); } catch {}
      esSchreib("uhrmodus", altModus); try { wkChip(); if (ES.offen && $("hrFlaeche")) esUhrZeigen($("hrFlaeche")); } catch {} }); }
  if (modus && wkModus() !== modus) wkModusSetzen(modus);
}
const rgWkKlingelBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg" style="text-align:center"><div style="font-size:2.6rem;line-height:1">⏰</div>
  <h3 style="margin:6px 0 10px">⏰ Wecker 7:00 Uhr</h3><p style="margin:0 0 10px">Kuchen aus dem Ofen</p><span class="knopf haupt" data-s="ton" style="display:block;margin-bottom:8px">🔊 Antippen für Ton</span>
  <div class="knoepfe" style="display:flex;gap:8px"><span class="knopf haupt" data-s="aus" style="flex:1">🔕 Aus</span><span class="knopf" data-s="mehr" style="flex:1">💤 Schlummern<br><small>${WK_SCHLUMMER_MIN} Min. später</small></span></div></div></div>`;
const RG_WECKER = [
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, sel: ["#eselsohr"], mussSel: true, puls: ["#eselsohr"], t: "📄 Über das Eselsohr",
    x: "Wecker, Stoppuhr und Timer stecken in der großen Uhr auf der Rückseite des Kopfes. Dorthin kommst du mit dem Eselsohr unten rechts im Kopf: doppelt tippen, und der Kopf dreht sich um." },
  { v: "start", vor: () => rgWk("uhr"), sel: [".wk-modi"], mussSel: true, puls: [() => [...document.querySelectorAll(".wk-modi .es-k")]], t: "🗂️ Uhr, Wecker, Stoppuhr, Timer",
    x: "Auf der Rückseite tippst du oben auf den Reiter Uhr. Darunter wählst du: Uhr, Wecker, Stoppuhr oder Timer. Alles erscheint im Stil deiner großen Uhr – digital, Fallblatt, Bahnhofsuhr oder groß und klar.",
    live: async (L) => { for (const m of ["wecker", "stopp", "timer", "uhr"]) { await L.tipp(`.wk-modi .es-k[onclick*="'${m}'"]`); wkModusSetzen(m); L.ziel(); await L.warte(1300); } } },
  { v: "start", vor: () => rgWk("wecker"), sel: ["#wkSteuer"], mussSel: true, puls: ["#wkUm", "#wkText", '#wkSteuer [onclick^="wkWeckerStellen"]'], t: "⏰ Wecker stellen",
    x: "Beim Wecker stellst du die Uhrzeit ein und schreibst auf Wunsch dazu, wofür – zum Beispiel: Kuchen aus dem Ofen. Dann Wecker stellen. Oben steht, wann er klingelt. Hier stelle ich keinen." },
  { v: "start", vor: () => rgWk("stopp"), sel: ["#wkSteuer", "#esUhr"], mussSel: true, puls: ['#wkSteuer [onclick="wkStopp(\'los\')"]', '#wkSteuer [onclick="wkStopp(\'runde\')"]'], t: "⏱️ Stoppuhr mit Runden",
    x: "Die Stoppuhr zählt mit Zehnteln. Start, und mit Runde merkst du dir Zwischenzeiten – zum Beispiel beim Eierkochen oder bei einer Übung. Pause hält an, Zurück stellt sie auf null.",
    live: async (L) => { await L.tipp('#wkSteuer [onclick="wkStopp(\'los\')"]'); wkStopp("los"); L.ziel(); await L.warte(2200);
      await L.tipp('#wkSteuer [onclick="wkStopp(\'runde\')"]'); wkStopp("runde"); L.ziel(); await L.warte(1800);
      await L.tipp('#wkSteuer [onclick="wkStopp(\'runde\')"]'); wkStopp("runde"); L.ziel(); await L.warte(1500);
      await L.tipp('#wkSteuer [onclick="wkStopp(\'los\')"]'); wkStopp("los"); L.ziel(); await L.warte(1500);
      await L.tipp('#wkSteuer [onclick="wkStopp(\'null\')"]'); wkStopp("null"); L.ziel(); } },
  { v: "start", vor: () => rgWk("timer"), sel: ["#wkSteuer"], mussSel: true, puls: [() => [...document.querySelectorAll('#wkSteuer [onclick^="wkTimerStart"]')]], t: "⏲️ Timer",
    x: "Beim Timer tippst du einfach auf eine, drei, fünf, zehn oder fünfzehn Minuten – oder trägst eine eigene Zeit ein. Jede volle Minute kommt ein kurzer Ton, die letzten fünf Sekunden zählt er hörbar herunter und sind rot. Läuft etwas, zeigt die Startseite oben ein kleines Feld mit der Zeit; antippen bringt dich hierher." },
  { v: "start", vor: rgSimNeu(rgWkKlingelBild, "ueber"), nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="aus"]', '#rgSim [data-s="mehr"]'], t: "🔔 Wenn es klingelt",
    x: "Ist es so weit, klingelt die App mit deiner Stundenuhr – zum Beispiel dem Kuckuck. Aus beendet das Klingeln. Daneben beim Wecker die Schlummertaste: zehn Minuten später klingelt er noch einmal. Beim Timer heißt der Knopf plus eine Minute. Ist die App zu, kommt eine Benachrichtigung." },
  { v: "start", vor: rgSimNeu(rgWkKlingelBild, "ueber"), nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="ton"]'], t: "🔊 Antippen für Ton",
    x: "Hast du die App gerade erst geöffnet und noch nirgends getippt, lässt das Handy noch keinen Ton zu. Dann steht oben im Fenster: Antippen für Ton. Ein Tipp – und es klingelt hörbar." },
  { v: "start", vor: () => rgWk(null), t: "✅ Fertig",
    x: "Das waren Wecker, Stoppuhr und Timer. Zum Schluss dreht sich der Kopf wieder zurück – deine Uhr ist so eingestellt wie vorher." },
];
// ---------- 2.533.0 KC-CLUB-VIDEO-GEHEIM (Wunsch Hansi „Hilfen neu aufbauen … Video auch mit Verschlüsselung“) ----------
// Zeigt an einem Beispiel-Zweierchat mit „Anne Beispiel“, wie 🔒 verschlüsselt schreiben, Rückfrage, Schlüssel, Geheimagent und 🔑 Schlüsselbund
// aussehen – nur auf dem Bildschirm. Es wird nichts verschlüsselt, gesendet oder gespeichert: Die Weiche vor api() beantwortet nur Aufrufe für den
// Beispiel-Chat, die „verschlüsselten“ Blasen sind Platzhalter (kein echter Schlüssel), Fenster sind Beispielbilder, der Schlüsselbund-Knopf wird
// nie angetippt. Am Ende (RG.zurueck) kommen api, Chat, Schloss und Schreibfeld in den alten Stand.
const RG_GH_ID = "rg-geheim-beispiel";
const rgGeheimZu = () => VN_PRE + "UmVpbiBCZWlzcGllbCBmdWVyIGRhcyBFcmtsYWVyLVZpZGVvIC0ga2VpbiBlY2h0ZXIgR2VoZWltdGV4dC4="; // Platzhalter, lässt sich nicht öffnen
const rgGeheimAuf2 = () => VN_PRE + "QXVjaCBkYXMgaXN0IG51ciBlaW4gQmVpc3BpZWwgZnVlciBkYXMgVmlkZW8u";
function rgGeheimDaten() {
  const vor = (min) => new Date(Date.now() - min * 60000).toISOString(), ich = ICH?.person_id || "ich", ichName = ICH?.name || "Du";
  const a = { von: "Anne Beispiel", vonId: "rg-gh-anne" }, du = { von: ichName, vonId: ich, eigen: true };
  const m = (n, wer, min, x = {}) => ({ id: "rg-gh-" + n, ...wer, eigen: !!wer.eigen, zeit: vor(min), text: "", anlagen: [], reaktionen: [], gelesenVon: [], ...x });
  const nachrichten = [
    m(1, a, 30, { text: "Ich schicke dir gleich den Code fürs Gartentor – verschlüsselt." }),
    m(2, a, 28, { text: rgGeheimZu() }),
    m(3, du, 20, { text: rgGeheimAuf2(), haken: "gelesen" }),
  ];
  return { id: RG_GH_ID, betreff: "", gruppe: false, teilnehmer: [{ person_id: ich, name: ichName }, { person_id: a.vonId, name: a.von }],
    nachrichten, angeheftet: [], selbstloeschen: 0, gelesenBis: nachrichten[2].zeit, tippt: [], entwurf: [], spricht: [] };
}
function rgGeheimAuf() {
  if (RG.ghAn) { if (chatId !== RG_GH_ID || !$("msg-rg-gh-1")) { chatId = RG_GH_ID; chatStand = ""; NA.trennerChat = null; chatLaden(true).then(() => { if (RG.an && RG.ghAn) rgNeuZielen(); }); } return; }
  RG.ghAn = true;
  const alt = { api, CHAT, chatId, na: NA.nachrichten, text: $("text").value, empf: { ...EMPF }, stand: chatStand, trenner: NA.trennerChat, vn: VN.an, vnChat: VN.chat };
  VN.klar.set(rgGeheimAuf2(), "Danke! Ist angekommen – ich habe ihn mir aufgeschrieben."); // nur diese eine Beispiel-Blase zeigt „geöffnet“
  api = async (a, d = {}, o) => (d && (d.id === RG_GH_ID || d.chat === RG_GH_ID || d.thread === RG_GH_ID || String(d.id || "").startsWith("rg-gh-")) ? (a === "unterhaltung" ? rgGeheimDaten() : {}) : alt.api(a, d, o));
  RG.zurueck.push(() => {
    RG.ghAn = false; api = alt.api; $("chatBlatt").classList.add("versteckt"); VN.klar.delete(rgGeheimAuf2());
    if (chatId === RG_GH_ID) chatId = alt.chatId; CHAT = alt.CHAT; NA.nachrichten = alt.na; chatStand = alt.stand; NA.trennerChat = alt.trenner; NA.trennerVor = null;
    EMPF.chat = alt.empf.chat; EMPF.letzte = alt.empf.letzte; VN.an = alt.vn; VN.chat = alt.vnChat;
    const k = $("vnKnopf"); k?.classList.toggle("an", VN.an); k?.setAttribute("aria-pressed", String(VN.an));
    $("chat").innerHTML = ""; $("text").value = alt.text; $("text").placeholder = VN.an ? "🔒 Verschlüsselte Nachricht schreiben …" : "Nachricht schreiben …"; entwurfMarkeZeigen();
  });
  EMPF.chat = RG_GH_ID; EMPF.letzte = "rg-gh-3"; // kein Ankunfts-Effekt beim Zeichnen
  chatId = RG_GH_ID; chatStand = ""; NA.trennerChat = null; chatLaden(true).then(() => { if (RG.an && RG.ghAn) rgNeuZielen(); });
}
function rgGeheimSchloss(an) { // nur das Aussehen des Schlosses (vnUmschalten würde beim Zweierchat das Schlüsselbund-Fenster öffnen)
  const k = $("vnKnopf"); k?.classList.toggle("an", an); k?.setAttribute("aria-pressed", String(an));
  const t = $("text"); if (t) t.placeholder = an ? "🔒 Verschlüsselte Nachricht schreiben …" : "Nachricht schreiben …";
}
function rgGeheimMenue() { rgGeheimAuf(); chatMenue(); rgFest("chatBlatt", true); }
const rgGeheimFrageBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🔒 Verschlüsselt senden ist eingeschaltet</h3>
  <p style="margin:0 0 8px">Das Schloss am Schreibfeld ist an. Soll diese Nachricht wirklich verschlüsselt werden? Dann braucht der Empfänger einen Schlüssel, den du ihm persönlich sagst.</p>
  <div class="knoepfe"><span class="knopf haupt" data-s="ja">🔒 Ja, mit Schlüssel</span><span class="knopf" data-s="normal">✉️ Normal senden</span></div></div></div>`;
const rgGeheimSchluesselBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🔒 Schlüssel für diese Nachricht</h3>
  <p style="margin:0 0 8px">Mindestens ${VN_MIN} Zeichen, z. B. „Kochmütze7“. Der Empfänger braucht denselben Schlüssel – sag ihn ihm persönlich, am Telefon oder per SMS, nicht über die Club-App.</p>
  <div data-s="feld" style="border:2px solid var(--gruen,#2e6b3a);border-radius:10px;padding:10px 12px;margin:0 0 10px;font-size:1.1em">Kochmütze7</div>
  <div class="knoepfe"><span class="knopf haupt" data-s="ok">OK</span><span class="knopf">Abbrechen</span></div></div></div>`;
const rgGeheimBundBild = () => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🔑 Schlüsselbund mit Anne</h3>
  <p style="margin:0 0 8px">Mit einem Schlüsselbund müsst ihr keinen Schlüssel mehr eintippen: ${VB_ANZAHL} zufällige Schlüssel liegen auf beiden Handys. Beim Senden nimmt die App einen davon, beim Empfang probiert sie alle durch – passt keiner, kommt eine Fehlermeldung. Die Schlüssel gehen per Datei direkt an Anne, nie über den Club-Server.</p>
  <div style="display:grid;gap:8px"><span class="knopf haupt" data-s="neu">🔑 Anlegen und Anne schicken</span><span class="knopf" data-s="einlesen">📥 Datei von Anne einlesen</span><span class="knopf">Schließen</span></div></div></div>`;
// 2.543.0 KC-CLUB-VIDEO-GEHEIM-2 (Wunsch Hansi „Wie sieht z. B. Klaus die verschlüsselte, wenn sie ankommt – mit Schlüsselbund oder Einmal-Schlüssel?“):
// Empfänger-Seite – Mitteilung aufs Handy, Ankunft des Agenten, Schlüssel eingeben (auch falsch), mit Schlüsselbund von selbst offen. Nur Beispielbilder.
const rgGeheimPushBild = () => `<div class="sim-dialog-hg" style="align-items:flex-start;padding-top:70px"><div class="sim-dialog karte" data-s="push" style="border-radius:18px">
  <div style="display:flex;gap:10px;align-items:center"><span style="font-size:1.6em">👨‍🍳</span><div><b>Köcheclub Werne · Anne Beispiel</b><div class="hinweis" style="font-size:.85em">jetzt</div></div></div>
  <p style="margin:8px 0 0">🔒 Verschlüsselte Nachricht – in der Club-App mit dem Schlüssel öffnen</p></div></div>`;
const rgGeheimEingebenBild = (falsch) => `<div class="sim-dialog-hg"><div class="sim-dialog karte" data-s="dlg"><h3 style="margin-top:0">🔒 Schlüssel eingeben</h3>
  <p style="margin:0 0 8px">Den Schlüssel hat dir der Absender persönlich, am Telefon oder per SMS gesagt. Nutzt ihr einen Schlüsselbund, fehlt er auf diesem Handy: oben ⋮ → „🔑 Schlüsselbund“ → „Datei einlesen“.</p>
  <div data-s="feld" style="border:2px solid ${falsch ? "var(--rot,#741521)" : "var(--gruen,#2e6b3a)"};border-radius:10px;padding:10px 12px;margin:0 0 10px;font-size:1.1em">${falsch ? "Kochmuetze" : "Kochmütze7"}</div>
  ${falsch ? '<p data-s="falsch" style="margin:0 0 10px;color:var(--rot,#741521);font-weight:800">❌ Falscher Schlüssel – bitte nochmal versuchen.</p>' : ""}
  <div class="knoepfe"><span class="knopf haupt" data-s="ok">OK</span><span class="knopf">Abbrechen</span></div></div></div>`;
const RG_GEHEIM = [
  { v: "chat", vor: rgGeheimAuf, sel: ["#chatKopf"], t: "🕵️ Geheim schreiben",
    x: "Manches soll nur der Empfänger lesen – zum Beispiel ein Code fürs Gartentor. Dafür kannst du Nachrichten verschlüsseln. Ich zeige es dir an einem Beispiel-Chat mit Anne. Keine Sorge: Ich verschlüssele, sende und speichere nichts." },
  { v: "chat", vor: rgGeheimAuf, sel: [".eg-griffe"], puls: ["#egKlapp", "#egTast", "#egTon", "#vnKnopf"], t: "🔒 Die kleine Zeile über dem Schreibfeld",
    x: "Über dem Schreibfeld steht eine kleine Zeile: der Pfeil klappt den Schreibbereich ein, die Tastatur blendet die Handy-Tastatur ein und aus, der Lautsprecher schaltet die Tippgeräusche an und aus – und ganz rechts das Schloss: verschlüsselt senden." },
  { v: "chat", vor: () => { rgGeheimAuf(); $("text").value = "Bis Samstag!"; rgGeheimSchloss(true); }, nach: () => { rgGeheimSchloss(false); $("text").value = ""; }, sel: ["#vnKnopf", "#text"], puls: ["#vnKnopf"], t: "🔒 Schloss an",
    x: "Tippst du auf das Schloss, wird es grün, und im Schreibfeld steht Verschlüsselte Nachricht schreiben. Jetzt schreibst du ganz normal und tippst auf Senden. Beim Wechsel in einen anderen Chat geht das Schloss von selbst wieder aus.",
    live: async (L) => { await L.tipp("#vnKnopf"); await L.warte(2500); } },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimFrageBild(), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="ja"]', '#rgSim [data-s="normal"]'], t: "❓ Erst die Rückfrage",
    x: "Weil man das Schloss schnell aus Versehen antippt, fragt die App vor dem Senden nach: Ja, mit Schlüssel – oder Normal senden. Normal senden schaltet das Schloss aus und schickt die Nachricht wie immer. So landet niemand versehentlich bei einer Schlüssel-Frage." },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimSchluesselBild(), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="feld"]'], t: "🔑 Den Schlüssel festlegen",
    x: "Mit Ja legst du einen Schlüssel fest – mindestens sechs Zeichen, zum Beispiel Kochmütze7. Eins, zwei, drei, vier wäre in Sekunden geknackt. Ganz wichtig: Den Schlüssel sagst du dem Empfänger auf einem anderen Weg – persönlich, am Telefon oder per SMS. Nicht über die Club-App." },
  { v: "chat", vor: rgGeheimAuf, sel: ['#eingabe [title="Senden"]'], puls: ['#eingabe [title="Senden"]'], t: "🕵️ Der Geheimagent",
    x: "Beim Senden dreht sich am Senden-Knopf kurz ein goldener Schlüssel wie im Schloss. Dann bringt ein Geheimagent mit Hut, Sonnenbrille und Aktenkoffer die Nachricht weg – egal, welchen Boten du sonst gewählt hast. Nur Express geht vor: Da kommt der Rennwagen.",
    live: async (L) => { const k = document.querySelector('#eingabe [title="Senden"]'); if (!k) return; vnSchluesselZeigen(k); await L.warte(1300); if (fxAn()) sendeFahrzeug(k.getBoundingClientRect(), "agent"); await L.warte(3200); } },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimPushBild(), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="push"]'], mussSel: true, t: "📲 Beim Empfänger: die Mitteilung",
    x: "Jetzt die andere Seite – zum Beispiel bei Klaus. Auf seinem Handy erscheint die Mitteilung: Verschlüsselte Nachricht, in der Club-App mit dem Schlüssel öffnen. Vom Inhalt steht da kein Wort – auch nicht in der E-Mail." },
  { v: "chat", vor: rgGeheimAuf, sel: [() => $("msg-rg-gh-2")], mussSel: true, t: "🕵️ Der Agent liefert ab",
    x: "Öffnet er den Chat, kommt der Geheimagent von rechts, bleibt bei der Nachricht stehen, der Koffer klickt auf und ein Schlüssel dreht sich. Dann schleicht er weiter.",
    live: async (L) => { const el = $("msg-rg-gh-2"); if (el && fxAn()) ankunftEffekt(el, "agent").catch(() => {}); await L.warte(4200); } },
  { v: "chat", vor: rgGeheimAuf, sel: [() => document.querySelector("#msg-rg-gh-2 .vn-zu")], mussSel: true, puls: [() => document.querySelector("#msg-rg-gh-2 .vn-zu")], t: "📩 So kommt sie an",
    x: "Beim Empfänger steht nur: Verschlüsselte Nachricht – antippen und Schlüssel eingeben. Auch in der Chat-Liste, in der Mitteilung aufs Handy und in der E-Mail steht kein Wort vom Inhalt. Wer den falschen Schlüssel eintippt, bekommt Falscher Schlüssel." },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimEingebenBild(false), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="feld"]'], t: "🔑 Einmal-Schlüssel: eintippen",
    x: "Hast du einen Schlüssel eingetippt, tippt Klaus auf die Nachricht. Es kommt das Fenster Schlüssel eingeben. Er gibt den Schlüssel ein, den du ihm persönlich, am Telefon oder per SMS gesagt hast – zum Beispiel Kochmütze7 – und tippt auf OK." },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimEingebenBild(true), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="falsch"]'], t: "❌ Falscher Schlüssel",
    x: "Vertippt er sich – hier fehlt die Sieben und das ü ist falsch –, steht da: Falscher Schlüssel, bitte nochmal versuchen. Er kann es so oft probieren, wie er will. Ohne den richtigen Schlüssel kann niemand die Nachricht lesen – auch der Server nicht." },
  { v: "chat", vor: rgGeheimAuf, sel: [() => $("msg-rg-gh-3")], mussSel: true, puls: [() => document.querySelector("#msg-rg-gh-3 .vn-auf")], t: "🔓 Geöffnet",
    x: "Mit dem richtigen Schlüssel erscheint der Text, mit einem offenen Schloss davor. Das Handy merkt sich den Schlüssel für diesen Chat und öffnet weitere Nachrichten damit gleich mit. Verschlüsselt wird auf deinem Handy – niemand dazwischen kann mitlesen, auch nicht der Server." },
  { v: "chat", vor: rgGeheimMenue, nach: () => rgFest("chatBlatt", false), tippVor: "#chatMenueKnopf", sel: ["#chatVbKnopf"], mussSel: true, puls: ["#chatVbKnopf"], t: "🔑 Bequemer: der Schlüsselbund",
    x: "Schreibt ihr öfter geheim, geht es bequemer – im Zweier-Chat oben über die drei Punkte: Schlüsselbund mit Anne." },
  { v: "chat", vor: () => { rgGeheimAuf(); rgSim(rgGeheimBundBild(), "ueber"); }, nach: rgSimWeg, sel: ['#rgSim [data-s="dlg"]'], mussSel: true, puls: ['#rgSim [data-s="neu"]', '#rgSim [data-s="einlesen"]'], t: "🔑 Fünf Schlüssel als Datei",
    x: "Die App legt fünf zufällige Schlüssel an und gibt sie als Datei weiter – am besten per WhatsApp oder Signal, nicht per E-Mail. Anne tippt die Datei an, wählt Teilen und dann die Club-App, oder hier Datei einlesen. Danach geht alles ohne Eintippen: Schloss an, senden – und bei Anne öffnet sich die Nachricht von selbst. Passt kein Schlüssel, kommt eine Fehlermeldung." },
  { v: "chat", vor: rgGeheimAuf, sel: [() => $("msg-rg-gh-3")], mussSel: true, puls: [() => document.querySelector("#msg-rg-gh-3 .vn-auf")], t: "🔑 Mit Schlüsselbund: öffnet sich von selbst",
    x: "Habt ihr einen Schlüsselbund, muss Klaus gar nichts tun: Der Agent bringt die Nachricht, die App probiert die Schlüssel durch und zeigt den Text gleich mit dem offenen Schloss. Passt ausnahmsweise keiner – etwa bei einem älteren Schlüsselbund –, sagt die App das, und er kann den Schlüssel eintippen." },
  { v: "chat", vor: rgGeheimAuf, sel: [".eg-griffe", "#vnKnopf"], t: "⚠️ Gut zu wissen",
    x: "Auch Fotos und Dateien werden verschlüsselt – wähle sie einfach aus, während das Schloss an ist; ohne Schlüssel sieht man nur ein Schloss. Ein verschlüsselter Text darf etwa zweitausendachthundert Zeichen lang sein. Und: Wer den Schlüssel vergisst, kann die Nachricht nicht mehr lesen – dann kann niemand mehr helfen." },
  { v: "chat", vor: rgGeheimAuf, t: "✅ Fertig", x: "Das war's: Schloss antippen, Rückfrage mit Ja beantworten, Schlüssel festlegen und auf anderem Weg weitersagen – oder einmal einen Schlüsselbund anlegen. Der Geheimagent bringt die Nachricht, und nur ihr beide könnt sie lesen." },
];
// ---------- 2.348.0 KC-CLUB-VIDEO-GRUPPEN (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-GRUPPEN: zeigt das Formular „Neue Gruppe“ mit einem Beispiel (Küchenteam) und einen Beispiel-Gruppenchat – nur auf dem
// Bildschirm. „Gruppe anlegen“, „Gruppe löschen“ usw. werden NIE angetippt; die Weiche vor api() beantwortet nur Aufrufe für den Beispiel-Chat
// selbst. Am Ende (RG.zurueck) kommen Formular, Klapp-Stand, api, Chat und Terminanfrage in den alten Stand – angelegt oder gespeichert wird nichts.
const RG_GR_ID = "rg-gruppen-beispiel";
const rgGruppenAndere = () => (MITGLIEDER || []).filter((m) => m.person_id !== ICH?.person_id).slice(0, 2);
const rgGruppenDemo = () => ({ id: RG_GR_ID, name: "Küchenteam", symbol: "👨‍🍳", anzahl: rgGruppenAndere().length + 1 });
function rgGruppenForm(stufe) { // stufe 0: leer · 1: Name & Symbol · 2: + Mitglieder · 3: + Gruppen-Admin
  if (!RG.grAn) {
    RG.grAn = true;
    const lies = (k) => { try { return localStorage.getItem("kc_club_" + k); } catch { return null; } };
    const d = (n) => document.querySelector(`#v-gruppe details[data-klappe="${n}"]`);
    const alt = { GR, name: $("grName").value, such: $("grSuche").value, titel: $("grTitel").textContent, knopf: $("grKnopf").textContent, vorh: $("grVorhanden").innerHTML,
      offen: ["gr_name", "gr_wer"].map((n) => [n, d(n)?.open, lies("klappe_" + n)]) };
    RG.zurueck.push(() => {
      RG.grAn = false; GR = alt.GR; $("grName").value = alt.name; $("grSuche").value = alt.such; $("grTitel").textContent = alt.titel; $("grKnopf").textContent = alt.knopf; $("grVorhanden").innerHTML = alt.vorh;
      $("grListe").innerHTML = ""; $("grGewaehlt").textContent = "nur du";
      for (const [n, o] of alt.offen) if (d(n) && o !== undefined) d(n).open = o;
      setTimeout(() => { for (const [n, , v] of alt.offen) try { v === null ? localStorage.removeItem("kc_club_klappe_" + n) : localStorage.setItem("kc_club_klappe_" + n, v); } catch {} }, 50); // Klapp-Stand wie vorher
    });
    $("grTitel").textContent = "👥 Neue Gruppe"; $("grKnopf").textContent = "👥 Gruppe anlegen"; $("grSuche").value = "";
    for (const n of ["gr_name", "gr_wer"]) if (d(n)) d(n).open = true;
    try { klappenMerken($("v-gruppe")); } catch {} // Pfeil und Schloss (sind beim Start schon da – nur zur Sicherheit)
    rgGruppenListe("grVorhanden");
  }
  const los = () => {
    const andere = rgGruppenAndere().map((m) => m.person_id);
    GR = { id: null, name: "", symbol: stufe >= 1 ? "👨‍🍳" : "👥", personen: stufe >= 2 ? andere : [], vorher: [], ersteller: ICH.person_id, admins: stufe >= 3 ? andere.slice(-1) : [] };
    $("grName").value = stufe >= 1 ? "Küchenteam" : ""; grSymbole(); grListe();
  };
  if (MITGLIEDER) los(); else mitgliederHolen().then(() => { if (RG.an && RG.grAn) { los(); rgNeuZielen(); } }).catch(() => {});
}
// „👥 Deine Gruppen“: die echten Gruppen – hat man noch keine, steht dort zum Zeigen das Beispiel (Knopf ohne Wirkung)
function rgGruppenListe(ziel) {
  neuGruppenZeigen(ziel, true).then(() => {
    const z = $(ziel); if (!RG.an || !z || z.innerHTML.trim()) return rgNeuZielen();
    const g = rgGruppenDemo();
    z.innerHTML = `<details class="karte" data-klappe="gruppen_${ziel}" data-ohne-unten open data-rg-beispiel="1"><summary>👥 Deine Gruppen</summary><p class="hinweis" style="margin:0 0 6px">Antippen – du schreibst direkt in die Gruppe.</p>
      <div class="knoepfe"><button class="knopf" type="button">${g.symbol} ${g.name} <small>· ${g.anzahl} Mitgl.</small></button></div>${ziel === "grVorhanden" ? '<p class="hinweis" style="margin:8px 0 0">Oder lege unten eine <b>weitere</b> Gruppe an.</p>' : ""}</details>`;
    rgNeuZielen();
  }).catch(() => {});
}
function rgGruppenChat() {
  const daten = () => { const ich = ICH.person_id, andere = rgGruppenAndere().length ? rgGruppenAndere() : [{ person_id: "rg-gr-anne", name: "Anne Beispiel" }, { person_id: "rg-gr-klaus", name: "Klaus Muster" }];
    return { id: RG_GR_ID, gruppe: { name: "Küchenteam", symbol: "👨‍🍳", erstellt_von: ich, admins: andere.slice(-1).map((m) => m.person_id), darfVerwalten: true },
      teilnehmer: [{ person_id: ich, name: ICH.name }, ...andere.map((m) => ({ person_id: m.person_id, name: m.name }))], angeheftet: [], selbstloeschen: 0, tippt: [], entwurf: [], spricht: [],
      nachrichten: [{ id: "rg-gr-1", eigen: true, von: ICH.name, vonId: ich, zeit: new Date(Date.now() - 600000).toISOString(), text: "Hallo Küchenteam! Schön, dass ihr dabei seid.", anlagen: [], reaktionen: [], gelesenVon: [], haken: "gesendet" }] }; };
  if (!RG.grChat) {
    RG.grChat = true;
    const alt = { api, CHAT, chatId, na: NA.nachrichten, stand: chatStand, trenner: NA.trennerChat, empf: { ...EMPF }, vl: VL.chat };
    api = async (a, d = {}, o) => (d && (d.id === RG_GR_ID || d.chat === RG_GR_ID) ? (a === "unterhaltung" ? daten() : {}) : alt.api(a, d, o));
    RG.zurueck.push(() => {
      RG.grChat = false; api = alt.api; $("chatBlatt").classList.add("versteckt");
      if (chatId === RG_GR_ID) chatId = alt.chatId; CHAT = alt.CHAT; NA.nachrichten = alt.na; chatStand = alt.stand; NA.trennerChat = alt.trenner; NA.trennerVor = null;
      EMPF.chat = alt.empf.chat; EMPF.letzte = alt.empf.letzte; VL.chat = alt.vl; $("chat").innerHTML = ""; $("chatAngeheftet").innerHTML = "";
    });
    EMPF.chat = RG_GR_ID; EMPF.letzte = null;
  }
  if (chatId !== RG_GR_ID || !$("msg-rg-gr-1")) { chatId = RG_GR_ID; chatStand = ""; NA.trennerChat = null; return chatLaden(true).then(() => { if (RG.an && RG.grChat) rgNeuZielen(); }); }
  return Promise.resolve();
}
function rgGruppenMenue() { // mit Gruppen-Knöpfen ist das Menü höher als ein kleines Handy – fürs Video im Fenster blätterbar (danach wie vorher)
  const i = $("chatBlatt").querySelector(".blatt-innen");
  if (i && !RG.grBlatt) { RG.grBlatt = true; const alt = i.style.cssText; i.style.maxHeight = "88vh"; i.style.overflowY = "auto"; RG.zurueck.push(() => { RG.grBlatt = false; i.style.cssText = alt; i.scrollTop = 0; }); }
  const p = rgGruppenChat(); const auf = () => { chatMenue(); rgFest("chatBlatt", true); }; if (CHAT?.id === RG_GR_ID) auf(); else p.then(() => { if (RG.an && RG.grChat) { auf(); rgNeuZielen(); } }); }
function rgGruppenAnfrage() { // Formular „Terminanfrage“ nur zeigen, Gruppe vorgewählt – „Anfrage senden“ tippt niemand an
  if (!RG.grTa) {
    RG.grTa = true; const altGr = TA.gruppen;
    RG.zurueck.push(() => { RG.grTa = false; const f = $("terminanfrageForm"); if (f) { f.classList.add("versteckt"); f.innerHTML = ""; } TA.wahl = { personen: [], gruppe: null }; if (TA.gruppen.some((g) => g.id === RG_GR_ID)) TA.gruppen = altGr; });
  }
  taForm().then(() => {
    if (!RG.an || !RG.grTa || !$("taGruppen")) return;
    if (!TA.gruppen.length) TA.gruppen = [rgGruppenDemo()];
    TA.wahl = { personen: [], gruppe: TA.gruppen[0] }; taEmpfListe(); rgNeuZielen();
  }).catch(() => {});
}
const rgGruppenKnopf = (wurzel, anfang) => () => [...document.querySelectorAll(wurzel + " button")].find((b) => b.textContent.trim().startsWith(anfang) && rgSichtbar(b)) || null;
const rgGruppenSumm = (n) => `#v-gruppe details[data-klappe="${n}"] > summary`;
const RG_GRUPPEN = [
  { v: "nachrichten", sel: ["#v-nachrichten .kom-leiste"], t: "👋 Eigene Gruppen", x: "In diesem Video zeige ich dir, wie du eine eigene Gruppe anlegst – zum Beispiel fürs Küchenteam –, wer sie verwaltet, wie du sie nutzt und wieder auflöst. Keine Sorge: Ich lege nichts an und lösche nichts." },
  { v: "nachrichten", sel: [rgGruppenKnopf("#v-nachrichten .kom-leiste", "👥 Gruppe")], t: "👥 Der Knopf Gruppe", x: "Los geht es in Nachrichten: Oben tippst du auf Gruppe." },
  { v: "gruppe", tippVor: rgGruppenKnopf("#v-nachrichten .kom-leiste", "👥 Gruppe"), vor: () => rgGruppenForm(0), sel: ["#grVorhanden details", "#v-gruppe .kopf2"], t: "📋 Deine Gruppen",
    x: "Das Fenster Neue Gruppe öffnet sich. Ganz oben stehen deine Gruppen – antippen, und du schreibst direkt hinein. Darunter legst du eine weitere Gruppe an." },
  { v: "gruppe", vor: () => rgGruppenForm(1), sel: ['#v-gruppe details[data-klappe="gr_name"]'], puls: ["#grName", "#grSymbole button.an"], t: "✏️ Name und Symbol",
    x: "Unter Name und Symbol gibst du der Gruppe einen Namen, zum Beispiel Küchenteam, und tippst ein passendes Symbol an." },
  { v: "gruppe", vor: () => rgGruppenForm(2), sel: ['#v-gruppe details[data-klappe="gr_wer"]'], puls: ["#grSuche", () => [...document.querySelectorAll("#grListe input:checked")].map((i) => i.closest("label")), "#grGewaehlt"], t: "👤 Wer ist dabei?",
    x: "Unter Wer ist dabei suchst du die Mitglieder, zum Beispiel mit einem Namen, und hakst sie an. Die kleinen Zeichen zeigen, ob jemand per Push, E-Mail oder WhatsApp erreichbar ist. Unten steht, wer dabei ist." },
  { v: "gruppe", vor: () => rgGruppenForm(3), sel: [() => document.querySelector("#grListe .gr-krone.an")?.closest("label"), '#v-gruppe details[data-klappe="gr_wer"]'], puls: ["#grListe .gr-krone"], t: "👑 Gruppen-Admin bestimmen",
    x: "Wer die Gruppe anlegt, ist ihr Gruppen-Admin. Tippst du neben einem Mitglied auf die Krone, darf es die Gruppe mit verwalten." },
  { v: "gruppe", vor: () => rgGruppenForm(3), sel: ["#v-gruppe details[data-klappe=\"gr_name\"] > summary", "#v-gruppe .kopf2"], puls: [`${rgGruppenSumm("gr_name")} .pfeil`, `${rgGruppenSumm("gr_name")} .schloss`, `${rgGruppenSumm("gr_wer")} .pfeil`, `${rgGruppenSumm("gr_wer")} .schloss`],
    live: async (L) => { const d = document.querySelector('#v-gruppe details[data-klappe="gr_name"]'); if (!d) return; await L.warte(1500); await L.tipp(`${rgGruppenSumm("gr_name")} .pfeil`); d.open = false; await L.warte(1800); await L.tipp(`${rgGruppenSumm("gr_name")} .pfeil`); d.open = true; },
    t: "🔽 Bereiche auf- und zuklappen", x: "Jeder Bereich hat rechts einen Pfeil zum Auf- und Zuklappen – so behältst du den Überblick. Mit dem Schloss stellst du einen Bereich fest; er bleibt dann so, wie er ist, und die App merkt es sich." },
  { v: "gruppe", vor: () => rgGruppenForm(3), sel: ["#grKnopf"], puls: ["#grKnopf", "#grGewaehlt"], t: "✅ Gruppe anlegen",
    x: "Zum Schluss tippst du auf Gruppe anlegen. Die Mitglieder werden benachrichtigt, und der Gruppenchat öffnet sich. Hier lege ich natürlich nichts an." },
  { v: "chat", vor: rgGruppenChat, sel: ["#chatKopf"], puls: ["#chatTitel", "#chatTeilnehmer"], t: "💬 Der Gruppenchat",
    x: "So sieht ein Gruppenchat aus: Oben stehen Name und Symbol der Gruppe und wer dabei ist. Was du hier schreibst, bekommen alle in der Gruppe." },
  { v: "chat", vor: rgGruppenMenue, nach: () => rgFest("chatBlatt", false), tippVor: "#chatMenueKnopf", sel: ["#chatGruppeInfo"], puls: ["#chatGruppeInfo", "#chatGruppeBearb", "#chatGruppeRaus"], t: "⋮ Gruppe verwalten",
    x: "Oben unter den drei Punkten siehst du alle Mitglieder – die Krone zeigt die Gruppen-Admins. Mit Gruppe bearbeiten änderst du Name und Mitglieder und bestimmst weitere Admins. Mit Gruppe verlassen steigst du aus; hast du sie angelegt, wählst du vorher, wer sie weiterführt." },
  { v: "chat", vor: rgGruppenMenue, nach: () => rgFest("chatBlatt", false), sel: ["#chatGruppeWeg"], t: "🗑️ Gruppe auflösen",
    x: "Wird die Gruppe nicht mehr gebraucht, tippt ein Gruppen-Admin hier auf Gruppe löschen, für alle. Vorher fragt die App lieber noch einmal nach – und die anderen bekommen einen kurzen Hinweis." },
  { v: "neu", vor: () => { if (MITGLIEDER) empfListe(); rgGruppenListe("neuGruppen"); }, sel: ["#neuGruppen details", "#empfWahlBereich"], puls: ["#neuGruppen .knoepfe .knopf"], t: "✉️ Gruppe in einer Nachricht",
    x: "Bei einer neuen Nachricht stehen deine Gruppen ganz oben. Ein Tipp auf die Gruppe, und du schreibst direkt hinein." },
  { v: "termine", vor: rgGruppenAnfrage, nach: () => { $("terminanfrageForm")?.classList.add("versteckt"); }, sel: ["#taGruppen", "#terminanfrageForm"], puls: [() => document.querySelector("#taGruppen .knopf.haupt"), "#taWer"], t: "📨 Gruppe in der Terminanfrage",
    x: "Auch bei einer Terminanfrage unter Termine wählst du bei An wen deine Gruppe mit einem Tipp. Dann werden alle in der Gruppe gefragt und antworten mit Ja, Vielleicht oder Nein." },
  { v: "nachrichten", t: "✅ Fertig", x: "Das war's: In Nachrichten auf Gruppe tippen, Name und Symbol, Mitglieder anhaken, auf Wunsch weitere Admins mit der Krone – und Gruppe anlegen. Verwalten und auflösen geht im Gruppenchat unter den drei Punkten." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Termin mit anderen ausmachen – vertieft das Video „Termin eintragen“ (RG_TERMIN), ohne es zu doppeln.
// Alles nur gezeigt: Formulare mit Beispiel, Beispiel-Karten (inert, nicht antippbar) – es wird nichts gesendet, beantwortet oder gespeichert.
// Am Ende ist alles wieder zu: Formulare versteckt, Beispiel-Karten und Fenster weg, Auswahl (TA.wahl, PT.vorkommen) und Termine-Ansicht wie vorher.

// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Ziel neu suchen, wenn Inhalt erst nach dem Laden kommt (wie rgTreffenZeigen)
const rgTerminfindenZielen = () => { if (!RG.an) return; const s = RG.st[RG.i]; RG.ziel = rgZiel(s) || RG.ziel; rgHin(); rgLage(); rgPulsStart(s); };
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Termine immer als Liste zeigen (in der To-do-Ansicht sind Anfragen und Terminfindung versteckt) – ohne zu speichern
function rgTerminfindenListe() {
  if (termineArt === "liste") return;
  const alt = termineArt; termineArt = "liste"; treffenLaden();
  RG.zurueck.push(() => { termineArt = alt; if (aktuelleAnsicht === "termine") treffenLaden(); });
}
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: eigener Kasten für Beispiel-Karten direkt vor einem Bereich (die echten Lader überschreiben ihn nicht)
function rgTerminfindenKasten(id, vorId, html) {
  let k = $(id);
  if (!k) { const vor = $(vorId); if (!vor) return null; k = document.createElement("div"); k.id = id; k.inert = true; k.className = "rg-tf-beispiel"; vor.before(k); RG.zurueck.push(() => $(id)?.remove()); }
  k.innerHTML = html; return k;
}
const rgTerminfindenZeit = (n, uhr) => taZeitpunkt(rgDatum(n), uhr);
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Beispiel – deine eigene Anfrage an vier Mitglieder mit verschiedenem Stand
const rgTerminfindenMeine = () => ({
  id: "rg-tf-meine", vonMir: true, status: "offen", anlass: "Einkauf für den Grillabend", beginn: rgTerminfindenZeit(4, "10:00"), ende: null, ort: "Parkplatz Markt", notiz: "",
  frist: rgTerminfindenZeit(2, "23:59"), von: { name: ICH?.name || "", vorname: ICH?.vorname || "" }, erinnerung: null,
  empfaenger: [
    { person_id: "rg-tf-a", name: "Klaus", vorname: "Klaus", antwort: "ja" },
    { person_id: "rg-tf-b", name: "Anne", vorname: "Anne", gelesen_am: new Date().toISOString() },
    { person_id: "rg-tf-c", name: "Maria", vorname: "Maria", antwort: "vielleicht" },
    { person_id: "rg-tf-d", name: "Peter", vorname: "Peter", vorschlag: { beginn: rgTerminfindenZeit(5, "10:00"), ende: null }, notiz: "vormittags geht es bei mir nicht" },
  ],
});
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Beispiel – eine Anfrage, die du bekommen hast
const rgTerminfindenFremde = () => ({
  id: "rg-tf-fremd", vonMir: false, status: "offen", anlass: "Kochen für das Sommerfest", beginn: rgTerminfindenZeit(6, "17:00"), ende: null, ort: "", notiz: "",
  von: { name: "Klaus", vorname: "Klaus" }, meine: null, empfaenger: [{ person_id: ICH?.person_id || "ich", name: ICH?.name || "", vorname: ICH?.vorname || "" }],
});
function rgTerminfindenAnfragen(art) { // art: "meine" | "beide"
  const karten = art === "beide" ? [rgTerminfindenMeine(), rgTerminfindenFremde()] : [rgTerminfindenMeine()];
  const k = rgTerminfindenKasten("rgTfAnfragen", "terminanfragen", `<details class="karte tm-klappe" open><summary>📨 Terminanfragen – Beispiel</summary>${karten.map(taKarte).join("")}</details>`);
  k?.querySelectorAll('.erin-zeile, .ta-kal-alt, [onclick^="taKalender"]').forEach((e) => e.remove()); // Beispiel kurz halten: Erinnerung/Handy-Kalender gehören nicht hierher
}
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Terminfindung – die echte Klappe, sonst ein Beispiel
function rgTerminfindenUmfrage() {
  const echt = document.querySelector('#terminfindung details[data-klappe="tm_umfragen"]');
  if (echt) { if (!echt.open) { echt.open = true; RG.zurueck.push(() => { echt.open = false; }); } return; }
  const fr = rgDatum(10), tag = new Date(fr + "T12:00:00Z").getUTCDay(), bisFr = (5 - tag + 7) % 7; // nächster Freitag ab in 10 Tagen
  const u = { id: "rg-tf-u", titel: "Grillabend im Sommer", von: "Klaus", antwortende: 3, frist: rgTerminfindenZeit(7, "23:59"), ort: "", beschreibung: "", darfFestlegen: false, darfLoeschen: false,
    optionen: [
      { id: "rg-tf-o1", beginn: rgTerminfindenZeit(10 + bisFr, "18:00"), ja: ["Klaus", "Anne"], vielleicht: ["Peter"], nein: [], meine: "ja" },
      { id: "rg-tf-o2", beginn: rgTerminfindenZeit(11 + bisFr, "18:00"), ja: ["Anne"], vielleicht: [], nein: ["Klaus", "Peter"], meine: null },
      { id: "rg-tf-o3", beginn: rgTerminfindenZeit(17 + bisFr, "18:00"), ja: ["Peter"], vielleicht: ["Klaus"], nein: ["Anne"], meine: null },
    ] };
  rgTerminfindenKasten("rgTfUmfrage", "terminfindung", `<details class="karte tm-klappe" data-rg-klappe="tm_umfragen" open><summary>🗓️ Terminfindung – Beispiel <span class="marke">1</span></summary>${umfrageKarte(u)}</details>`);
}
const rgTerminfindenUmfrageZiel = () => document.querySelector('#terminfindung details[data-klappe="tm_umfragen"]') || $("rgTfUmfrage")?.querySelector("details");
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Formular „Terminanfrage“ mit Beispiel öffnen (ohne Senden); zu: Formular versteckt, Auswahl leer
function rgTerminfindenFormZu() { $("terminanfrageForm")?.classList.add("versteckt"); TA.wahl = { personen: [], gruppe: null }; }
function rgTerminfindenForm() {
  if (!RG.tfForm) { RG.tfForm = true; RG.zurueck.push(() => { RG.tfForm = false; rgTerminfindenFormZu(); }); }
  if ($("taAnlass") && !$("terminanfrageForm").classList.contains("versteckt")) return;
  $("neuWahlBlatt")?.remove();
  taForm().then(() => {
    if (!RG.an || !$("taAnlass")) return;
    const andere = (MITGLIEDER || []).filter((m) => m.person_id !== ICH?.person_id);
    if (andere[0]) taPerson(andere[0].person_id, true); // Beispiel: ein Mitglied angehakt – nur auf dem Bildschirm
    if ($("taAnlassWahl")) { $("taAnlassWahl").value = "Einkauf"; comboWahl("taAnlass"); }
    $("taDatum").value = rgDatum(4); $("taZeit").value = "10:00"; $("taFrist").value = rgDatum(2); $("taNotiz").value = "Bitte Einkaufstaschen mitbringen";
    setTimeout(rgTerminfindenZielen, 120);
  }).catch(() => {});
}
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Fenster „Gegenvorschlag – Unter Vorbehalt“ mit Beispiel-Text (Senden wird nicht getippt)
function rgTerminfindenVorbehalt() {
  if ($("taVkBlatt")) return $("taVkBlatt").classList.add("rg-zeigen");
  const a = rgTerminfindenMeine(); TA.liste.push(a);
  try { taVorschlagBlatt(a.id, "rg-tf-d", "vorbehalt"); } finally { TA.liste = TA.liste.filter((x) => x.id !== a.id); }
  const f = $("taVkBlatt"); if (!f) return;
  f.classList.add("rg-zeigen"); $("taVkText").value = "falls ich rechtzeitig von der Arbeit wegkomme";
  RG.zurueck.push(() => $("taVkBlatt")?.remove());
}
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Beispiel-Formular für eine Terminreihe (privater Termin, jede Woche) – wird nicht gespeichert
function rgTerminfindenReihe() {
  if (!RG.tfReihe) { RG.tfReihe = true; RG.zurueck.push(() => { RG.tfReihe = false; $("treffenForm")?.classList.add("versteckt"); }); }
  if ($("ptTitel") && !$("treffenForm").classList.contains("versteckt")) return;
  const d = new Date(rgDatum(1) + "T12:00:00Z"), di = (2 - d.getUTCDay() + 7) % 7; // nächster Dienstag
  privatForm({ titel: "Chorprobe", _datum: rgDatum(1 + di), _zeit: "19:00", wiederholung: "woechentlich" });
}
// 2.348.0 KC-CLUB-VIDEO-TERMINFINDEN: Rückfrage „nur diesen Termin oder die ganze Reihe?“ zeigen – gelöscht wird nichts
function rgTerminfindenReiheLoeschen() {
  if ($("ptLoeschFenster")) return $("ptLoeschFenster").classList.add("rg-zeigen");
  const alt = PT.vorkommen; PT.vorkommen = $("ptDatum")?.value || rgDatum(7);
  privatLoeschenReihe("rg-tf-reihe"); $("ptLoeschFenster")?.classList.add("rg-zeigen");
  RG.zurueck.push(() => { $("ptLoeschFenster")?.remove(); PT.vorkommen = alt; });
}
const rgTerminfindenWahlKnopf = (re) => () => [...document.querySelectorAll("#neuWahlBlatt .wahl button")].find((b) => re.test(b.textContent)) || null;

const RG_TERMINFINDEN = [
  { v: "termine", vor: () => rgTerminfindenListe(), sel: ["#v-termine .kopf2"], t: "👋 Termin mit anderen ausmachen",
    x: "In diesem Video zeige ich dir, wie du mit anderen einen Termin ausmachst: eine Terminanfrage stellen, sehen, wie sie steht, auf einen Gegenvorschlag antworten, einen Tag finden, der allen passt – und Termine, die immer wiederkommen. Keine Sorge: Ich sende und speichere nichts." },
  { v: "termine", tippVor: "#neuTreffenKnopf", vor: () => { rgTerminfindenListe(); termineNeuWahl(); $("neuWahlBlatt")?.classList.add("rg-zeigen"); RG.zurueck.push(() => $("neuWahlBlatt")?.remove()); },
    nach: () => $("neuWahlBlatt")?.remove(), sel: ["#neuWahlBlatt .wahl"], puls: [rgTerminfindenWahlKnopf(/Terminanfrage/)], t: "📨 Plus Neu, dann Terminanfrage",
    x: "Oben rechts tippst du auf Plus Neu und wählst Terminanfrage. Damit fragst du einzelne Mitglieder, mehrere oder eine ganze Gruppe, ob sie Zeit haben – statt lange hin und her zu schreiben." },
  { v: "termine", tippVor: rgTerminfindenWahlKnopf(/Terminanfrage/), vor: () => rgTerminfindenForm(), sel: [() => $("taGruppen")?.closest(".feld"), "#terminanfrageForm"],
    puls: ["#taGruppen button", "#taSuche", "#taListe", "#taWer"], t: "👥 An wen?",
    x: "Zuerst wählst du, wen du fragst: oben eine deiner Gruppen oder Alle – oder du suchst einen Namen und hakst ihn an, auch mehrere. Darunter steht, an wen die Anfrage geht." },
  { v: "termine", vor: () => rgTerminfindenForm(), sel: [() => $("taDatum")?.closest(".zwei"), "#terminanfrageForm"],
    puls: ["#taAnlassWahl", "#taDatum", "#taZeit", "#taBis"], t: "✏️ Anlass, Tag und Uhrzeit",
    x: "Dann der Anlass – zum Beispiel Einkauf –, Datum und Uhrzeit, und auf Wunsch bis wann." },
  { v: "termine", vor: () => rgTerminfindenForm(), sel: [() => $("taOrtWahl")?.closest(".feld"), "#terminanfrageForm"],
    puls: ["#taFrist", "#taOrtWahl", "#taNotiz"], t: "⏳ Antwort bis, Ort und Notiz",
    x: "Bei Antwort bis legst du fest, bis wann die anderen antworten sollen. Dazu der Ort und eine Notiz, wenn du magst – zum Beispiel: Bitte Einkaufstaschen mitbringen." },
  { v: "termine", vor: () => rgTerminfindenForm(), sel: [rgOn("taSenden", ".knoepfe")], puls: [rgOn("taSenden"), () => $("terminanfrageForm")?.querySelector(".knoepfe .knopf:not(.haupt)")], t: "📨 Anfrage senden",
    x: "Mit Anfrage senden geht sie los, und alle Gefragten bekommen Bescheid. Mit Abbrechen machst du das Formular wieder zu. Ich sende hier nichts – das Beispiel verschwindet gleich wieder." },
  { v: "termine", vor: () => { rgTerminfindenFormZu(); rgTerminfindenAnfragen("meine"); }, sel: ["#ta-rg-tf-meine"],
    puls: ["#rgTfAnfragen .ta-st", () => $("rgTfAnfragen")?.querySelector('[onclick^="taAbsagen"]')], t: "📊 Wie steht meine Anfrage?",
    x: "Deine Anfrage steht dann oben in Termine – mit Anfrage an. Bei jedem steht der Stand: angefragt, gelesen, bestätigt, vielleicht oder abgelehnt. Kommt bis zur Frist keine Antwort, steht dort abgelaufen. Mit Absagen nimmst du die ganze Anfrage zurück." },
  { v: "termine", vor: () => { rgTerminfindenFormZu(); rgTerminfindenAnfragen("beide"); }, sel: ["#ta-rg-tf-fremd"],
    puls: ["#ta-rg-tf-fremd .ta-antw button", '#ta-rg-tf-fremd [onclick^="taGegenvorschlag"]'], t: "🙋 Wenn du gefragt wirst",
    x: "Wirst du selbst angefragt, antwortest du mit Ja, Vielleicht oder Nein. Nochmal auf deine Antwort tippen nimmt sie zurück. Passt die Zeit nicht, tippst du auf Andere Zeit vorschlagen." },
  { v: "termine", vor: () => { $("taVkBlatt")?.remove(); rgTerminfindenAnfragen("meine"); }, sel: ["#rgTfAnfragen .ta-vk", "#ta-rg-tf-meine"],
    puls: ["#rgTfAnfragen .ta-vk button"], t: "🔄 Ein Gegenvorschlag",
    x: "Schlägt dir jemand eine andere Zeit vor, steht bei ihm Gegenvorschlag mit der neuen Zeit. Du entscheidest: Neue Zeit annehmen, Unter Vorbehalt oder Passt nicht." },
  { v: "termine", tippVor: () => $("rgTfAnfragen")?.querySelector('.ta-vk [onclick*="vorbehalt"]'), vor: () => { rgTerminfindenAnfragen("meine"); rgTerminfindenVorbehalt(); },
    sel: ["#taVkWahl"], puls: ['#taVkWahl [data-w="vorbehalt"]'], t: "🤔 Unter Vorbehalt annehmen",
    x: "Unter Vorbehalt heißt: Ja, die neue Zeit passt – aber es hängt noch an etwas." },
  { v: "termine", vor: () => { rgTerminfindenAnfragen("meine"); rgTerminfindenVorbehalt(); }, nach: () => $("taVkBlatt")?.remove(), sel: ["#taVkLabel"], puls: ["#taVkText", "#taVkOk"], t: "✍️ Woran hängt es?",
    x: "Schreib kurz dazu, woran es noch hängt – zum Beispiel: falls ich rechtzeitig von der Arbeit wegkomme. Mit Senden sieht der andere es sofort. Ich sende hier nichts." },
  { v: "termine", vor: () => { $("taVkBlatt")?.remove(); $("rgTfAnfragen")?.remove(); rgTerminfindenUmfrage(); }, sel: [rgTerminfindenUmfrageZiel], puls: [() => rgTerminfindenUmfrageZiel()?.querySelector("summary")], t: "🗓️ Einen Tag finden, der allen passt",
    x: () => (ICH?.vorstand
      ? "Sucht ihr einen gemeinsamen Tag, schlägt die Clubleitung mehrere Termine zur Auswahl vor – wie du sie anlegst, zeigt das Video für die Clubleitung. Alle finden sie hier in Termine unter Terminfindung und kreuzen an, was bei ihnen geht."
      : "Sucht ihr einen gemeinsamen Tag, schlägt die Clubleitung mehrere Termine zur Auswahl vor. Du findest sie hier in Termine unter Terminfindung.") },
  { v: "termine", vor: () => rgTerminfindenUmfrage(), sel: [() => rgTerminfindenUmfrageZiel()?.querySelector(".karte .zeile"), rgTerminfindenUmfrageZiel],
    puls: [() => [...(rgTerminfindenUmfrageZiel()?.querySelector(".karte .zeile")?.querySelectorAll("button") || [])], () => rgTerminfindenUmfrageZiel()?.querySelector(".marke.gruen")],
    t: "✅ Ankreuzen, was passt",
    x: "Bei jedem Termin tippst du an: Haken heißt passt, Fragezeichen vielleicht, Kreuz passt nicht. Nochmal antippen nimmt es zurück. Der Termin mit den meisten Stimmen ist als beste Wahl markiert." },
  { v: "termine", vor: () => rgTerminfindenUmfrage(), sel: [() => rgTerminfindenUmfrageZiel()?.querySelector(".karte details > summary"), rgTerminfindenUmfrageZiel], t: "👥 Wer hat was angekreuzt?",
    x: "Unter Wer hat was angekreuzt? siehst du alle Antworten. Am Ende legt die Clubleitung den Termin fest – wer passt angekreuzt hat, ist dann schon zugesagt." },
  { v: "termine", vor: () => { $("rgTfUmfrage")?.remove(); rgTerminfindenReihe(); }, sel: [() => $("ptWdh")?.closest(".zwei"), "#treffenForm"], puls: ["#ptWdh", "#ptWdhBis"], video: "termin", t: "🔁 Termine, die immer wiederkommen",
    x: "Kommt ein Termin immer wieder, wählst du beim privaten Termin unter Wiederholen zum Beispiel wöchentlich – oder täglich, werktags, alle 2 Wochen, monatlich oder jährlich. Bei bis legst du fest, wann die Reihe endet. Dann trägst du ihn nur einmal ein." },
  { v: "termine", vor: () => rgTerminfindenReihe(), sel: [() => [...($("treffenForm")?.querySelectorAll("p.hinweis") || [])].find((p) => /Terminreihe/.test(p.textContent)), "#treffenForm"], t: "📝 Eine Reihe ändern",
    x: "Bei einer Terminreihe gelten Änderungen für alle Termine der Reihe. Ich speichere hier nichts – das Beispiel verschwindet gleich wieder." },
  { v: "termine", vor: () => { rgTerminfindenReihe(); rgTerminfindenReiheLoeschen(); }, nach: () => $("ptLoeschFenster")?.remove(), sel: ["#ptLoeschFenster .blatt-innen"],
    puls: ["#ptLoeschFenster .blatt-innen .knopf"], t: "🗑️ Nur diesen Termin oder die ganze Reihe?",
    x: "Löschst du später einen Termin aus einer Reihe, fragt die App: Nur den Termin an diesem Tag – oder die ganze Reihe. Mit Abbrechen bleibt alles, wie es ist. Ich lösche hier nichts." },
  { v: "termine", vor: () => { $("ptLoeschFenster")?.remove(); $("treffenForm")?.classList.add("versteckt"); }, sel: ["#neuTreffenKnopf"], t: "✅ Fertig",
    x: "Das war's: Mit Plus Neu und Terminanfrage fragst du andere, oben siehst du, wie die Anfrage steht, und auf einen Gegenvorschlag antwortest du mit Annehmen, Unter Vorbehalt oder Passt nicht. Bei der Terminfindung kreuzt du an, was passt – und Termine, die immer wiederkommen, trägst du nur einmal ein." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-TODO (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-TODO: die gemeinsame To-do-Liste. Nur gezeigt: Beispieltext im Feld (nie „Eintragen“), Beispiel-Zeilen nur auf dem
// Bildschirm (TODO.eintraege wird zurückgestellt), Häkchen-Fenster ohne „Fertig“, Beispiel-Aufgaben aus dem Protokoll (inert).
// Am Ende: Feld leer, rote Umrandung weg, Fenster zu, Termine-Ansicht (termineArt) wie vorher, „Heute wichtig“ wie vorher.

// 2.348.0 KC-CLUB-VIDEO-TODO: To-do-Ansicht zeigen, ohne die Wahl zu speichern (termineModus würde sie merken)
function rgTodoAn() {
  if (termineArt === "todo" && $("todoText")) return;
  if (!RG.todoArt) { RG.todoArt = { alt: termineArt }; RG.zurueck.push(() => { const a = RG.todoArt?.alt; RG.todoArt = null; termineArt = a || "liste"; if (aktuelleAnsicht === "termine") treffenLaden(); }); }
  termineArt = "todo"; treffenLaden();
}
// 2.348.0 KC-CLUB-VIDEO-TODO: Feld „Was ist zu tun?“ mit Beispieltext – NICHT eintragen; am Ende leer
function rgTodoBeispiel(text = "Getränke einkaufen") {
  rgTodoAn(); const f = $("todoText"); if (!f) return;
  if (!RG.todoFeld) { RG.todoFeld = true; RG.zurueck.push(() => { RG.todoFeld = false; const t = $("todoText"); if (t) { t.value = ""; t.classList.remove("todo-leer"); } }); }
  f.classList.remove("todo-leer"); f.value = text;
}
// 2.348.0 KC-CLUB-VIDEO-TODO: Beispiel-Zeilen in der Liste (nur Anzeige) – danach wieder die echte Liste
function rgTodoZeilen() {
  rgTodoAn();
  if (!RG.todoAlt) { RG.todoAlt = { e: TODO.eintraege }; RG.zurueck.push(() => { const a = RG.todoAlt; RG.todoAlt = null; if (a) TODO.eintraege = a.e; if ($("todoTabelle")) todoZeigen(); }); }
  const ich = ICH?.vorname || "du";
  TODO.eintraege = [
    { id: "rg-todo-1", text: "Getränke einkaufen", kategorie: "", fuer: "alle", faellig: rgDatum(3), zustaendige: [{ person_id: "rg-a", vorname: "Klaus" }], darfZuweisen: true, vonMir: true, von: ich },
    { id: "rg-todo-2", text: "Tischdecken waschen", kategorie: "", fuer: "alle", faellig: rgDatum(-1), zustaendige: [{ person_id: ICH?.person_id || "ich", vorname: ich, ich: true }], darfZuweisen: false, vonMir: false, von: "Anne" },
    { id: "rg-todo-3", text: "Kuchen bestellen", kategorie: "", fuer: "alle", faellig: null, zustaendige: [], darfZuweisen: true, vonMir: false, von: "Peter" },
    { id: "rg-todo-4", text: "Grill reinigen", kategorie: "", fuer: "alle", faellig: null, zustaendige: [{ person_id: "rg-b", vorname: "Anne" }], erledigt: new Date().toISOString(), erledigtVon: "Anne", vonMir: false, von: "Anne" },
  ];
  todoZeigen(); $("todoTabelle")?.closest(".karte")?.setAttribute("data-rg-beispiel", "1");
}
// 2.348.0 KC-CLUB-VIDEO-TODO: Fenster „Wer soll es machen?“ zeigen – ohne „Fertig“; am Ende zu
function rgTodoWer() {
  if (!RG.todoWer) { RG.todoWer = true; RG.zurueck.push(() => { RG.todoWer = false; $("personenBlatt").classList.add("versteckt"); $("personenBlatt").classList.remove("rg-zeigen"); PW_AUSWAHL = null; }); }
  $("personenBlatt").classList.add("rg-zeigen");
  if (!$("personenBlatt").classList.contains("versteckt")) return;
  todoWerWaehlen(null); // öffnet das Fenster (lädt die Mitglieder ggf. nach) – danach Ziel neu suchen
  for (const ms of [150, 600, 1500]) setTimeout(() => { if (!RG.an || !$("personenBlatt") || $("personenBlatt").classList.contains("versteckt")) return; RG.ziel = rgZiel(RG.st[RG.i]) || RG.ziel; rgHin(); rgLage(); if (ms === 150) rgPulsStart(RG.st[RG.i]); }, ms);
}
const rgTodoWerZu = () => { $("personenBlatt")?.classList.add("versteckt"); $("personenBlatt")?.classList.remove("rg-zeigen"); PW_AUSWAHL = null; };
// 2.348.0 KC-CLUB-VIDEO-TODO: Aufgaben aus dem Protokoll – die echte Klappe „Offene Aufgaben“, sonst ein Beispiel (inert)
function rgTodoProtokoll() {
  const echt = document.querySelector('#protokollListe details[data-klappe="pr_aufgaben"]');
  if (echt) { if (!echt.open) { echt.open = true; RG.zurueck.push(() => { echt.open = false; }); } return; }
  if ($("rgTodoPr")) return;
  const vor = $("protokollListe"); if (!vor) return;
  const k = document.createElement("div"); k.id = "rgTodoPr"; k.inert = true;
  const a = { id: "rg-pr-1", text: "Angebot für den Weihnachtsmarkt einholen", name: ICH?.name || "", faellig: rgDatum(5), protokoll: { titel: "Sitzung – Beispiel" } };
  k.innerHTML = `<details class="karte" open><summary>📌 Offene Aufgaben <span class="marke gelb">1</span> – Beispiel</summary>${aufgabeZeile(a, true, false)}</details>`;
  vor.before(k); RG.zurueck.push(() => $("rgTodoPr")?.remove());
}
const rgTodoPrZiel = () => document.querySelector('#protokollListe details[data-klappe="pr_aufgaben"]') || $("rgTodoPr")?.querySelector("details");
// 2.348.0 KC-CLUB-VIDEO-TODO: „Heute wichtig“ mit einer Beispiel-Aufgabe (nur, wenn keine eigene bald fällig ist) – danach wie vorher.
// Die Startseite lädt beim Öffnen neu (neuLaden ersetzt INIT) – danach wird das Beispiel noch einmal eingesetzt.
function rgTodoWichtig() {
  if (!INIT) return;
  const s = RG.st[RG.i];
  const anwenden = () => {
    if (!RG.an || !INIT || RG.todoWichtig?.init === INIT) return;
    const in7 = tagPlus(heuteIso(), 7);
    if ((INIT.meineAufgaben || []).some((x) => x.faellig && x.faellig <= in7)) return; // echte Aufgabe da → die zeigen
    if (!RG.todoWichtig) RG.zurueck.push(rgTodoWichtigZu);
    RG.todoWichtig = { init: INIT, alt: INIT.meineAufgaben };
    INIT.meineAufgaben = [...(INIT.meineAufgaben || []), { id: "rg-pr-1", text: "Angebot für den Weihnachtsmarkt einholen", faellig: rgDatum(2) }];
    wichtigZeigen(); $("wichtig").inert = true;
  };
  anwenden();
  const lauf = NEU_LADEN_FOLGE || NEU_LADEN_LAUF;
  if (lauf) lauf.catch(() => {}).then(() => setTimeout(() => { if (!RG.an || RG.st[RG.i] !== s) return; anwenden(); RG.ziel = rgZiel(s) || RG.ziel; rgHin(); rgLage(); rgPulsStart(s); }, 80));
}
function rgTodoWichtigZu() { // Beispiel-Aufgabe wieder weg (nach der Station und beim Ende; doppelt schadet nicht)
  const a = RG.todoWichtig; if (!a) return; RG.todoWichtig = null;
  if (a.init === INIT) INIT.meineAufgaben = a.alt;
  $("wichtig").inert = false; if (INIT) wichtigZeigen();
}
const rgTodoWichtigZeile = () => [...document.querySelectorAll("#wichtig .zeile")].find((z) => z.querySelector('[onclick^="aufgabeErledigt"]')) || null;

const RG_TODO = [
  { v: "termine", sel: ["#v-termine .kopf2"], t: "👋 Die gemeinsame To-do-Liste",
    x: "In diesem Video zeige ich dir die gemeinsame To-do-Liste: Aufgaben eintragen, verteilen und abhaken – zum Beispiel für Einkäufe oder Bestellungen. Und wo du deine Aufgaben aus den Protokollen findest. Ich trage nichts ein und hake nichts ab." },
  { v: "termine", sel: ["#v-termine > .umschalter"], puls: ["#v-termine > .umschalter > .zk", '#v-termine > .umschalter [data-m="todo"]'], t: "🔀 Umschalten auf To-do",
    x: "Die To-do-Liste findest du in Termine. Oben bei Ansicht schaltest du um: Jeder Tipp wechselt der Reihe nach zwischen Liste, Kalender und To-do. Lange drücken zeigt alle drei zur Auswahl." },
  { v: "termine", tippVor: () => rgSichtbarer('#v-termine > .umschalter [data-m="todo"]')() || rgSichtbarer("#v-termine > .umschalter > .zk")(), vor: () => rgTodoBeispiel(), sel: ["#todoBereich .todoform"], puls: ["#todoText", "#todoKat", "#todoFaellig"], t: "✏️ Was ist zu tun?",
    x: "Oben ins Feld Was ist zu tun? schreibst du die Aufgabe – zum Beispiel Getränke einkaufen. Darunter wählst du die Art der Aufgabe und, wenn du magst, das Datum, bis wann sie erledigt sein soll." },
  { v: "termine", vor: () => { rgTodoWerZu(); rgTodoBeispiel(); }, sel: ["#todoWer"], t: "👉 Wer soll es machen?",
    x: "Mit Wer soll es machen? verteilst du die Aufgabe. Wählst du niemanden, bleibt sie offen." },
  { v: "termine", tippVor: "#todoWer", vor: () => { rgTodoBeispiel(); rgTodoWer(); }, nach: () => rgTodoWerZu(), sel: ["#personenBlatt .blatt-innen"], puls: ["#personenListe", "#personenZahl", '#personenBlatt [onclick="personenFertig()"]'], t: "☑️ Einen oder mehrere anhaken",
    x: "Hier hakst du an, wer es machen soll – dich selbst oder andere, auch mehrere, bis zu zehn. Mit Fertig ist die Auswahl übernommen. Die Zuständigen bekommen Bescheid, sobald die Aufgabe eingetragen ist." },
  { v: "termine", vor: () => { rgTodoWerZu(); rgTodoBeispiel(); }, sel: ["#todoFuer"], puls: ["#todoFuer button"], t: "👥 Nur für mich oder für alle",
    x: "Bei Für wen tippst du um: Nur für mich – als eigener Merkzettel – oder Für alle, dann steht die Aufgabe auf der gemeinsamen Liste." },
  { v: "termine", vor: () => rgTodoBeispiel(), sel: [rgOn("todoAnlegen()")], t: "➕ Eintragen",
    x: "Mit Plus Eintragen kommt die Aufgabe auf die Liste. Ich trage hier nichts ein – das Beispiel verschwindet gleich wieder." },
  { v: "termine", vor: () => rgTodoBeispiel(), sel: ["#todoText"], t: "🔴 Feld noch leer?",
    live: async (L) => { await L.warte(600); const f = $("todoText"); if (f) f.value = ""; await L.warte(700); await L.tipp(rgOn("todoAnlegen()"));
      const g = $("todoText"); if (g) { g.classList.remove("todo-leer"); void g.offsetWidth; g.classList.add("todo-leer"); } await L.warte(2600); L.ziel(); },
    x: "Tippst du auf Plus Eintragen, solange das Feld noch leer ist, wird es rot umrandet – und du kannst gleich hineinschreiben." },
  { v: "termine", vor: () => { rgTodoBeispiel(""); rgTodoZeilen(); }, sel: ["#todoTabelle"], puls: ["#todoTabelle tr:first-child input[type=checkbox]", () => $("todoErledigte")?.closest(".schalter")], t: "✔️ Abhaken",
    x: "In der Liste steht jede Aufgabe mit einem Kästchen davor. Ist sie geschafft, setzt du einfach den Haken – alle sehen dann, wer sie wann erledigt hat. Mit Erledigte anzeigen siehst du auch die abgehakten." },
  { v: "termine", vor: () => rgTodoZeilen(), sel: ["#todoTabelle"], puls: ["#todoTabelle .meta b", "#todoTabelle .meta a", "#todoFilter button"], t: "👉 Wer übernimmt was?",
    x: "Bei jeder Aufgabe steht, wer zuständig ist – steht dort du, ist es deine. Ist noch niemand eingetragen, steht dort zuweisen. Oben bei Zeigen wechselst du der Reihe nach: Alle, nur was Mir zugeteilt ist, Meine eigenen oder die Für alle." },
  { v: "termine", vor: () => rgTodoZeilen(), sel: ["#todoTabelle"], puls: ["#todoTabelle .meta span.spaet", "#todoTabelle .meta span[class='']"], t: "⏰ Erinnerung an die Frist",
    x: "Hat eine Aufgabe ein Datum, steht dort fällig. Die App erinnert fünf Tage vorher und am Tag selbst – die Zuständigen, sonst den, der sie aufgeschrieben hat. Ist die Frist vorbei, steht dort überfällig. Deine Fristen siehst du auch im Kalender." },
  { v: "protokolle", vor: () => rgTodoProtokoll(), sel: [rgTodoPrZiel], video: "lesen", t: "📌 Aufgaben aus dem Protokoll",
    x: "Steht in einem Sitzungsprotokoll eine Aufgabe für dich, bekommst du Bescheid. In Protokolle steht sie oben unter Offene Aufgaben – mit dem Datum, bis wann sie erledigt sein soll." },
  { v: "protokolle", vor: () => rgTodoProtokoll(), sel: [() => rgTodoPrZiel()?.querySelector(".zeile"), rgTodoPrZiel], puls: [() => rgTodoPrZiel()?.querySelector('.zeile [onclick^="aufgabeErledigt"]')], t: "☐ Als erledigt markieren",
    x: "Ist die Aufgabe geschafft, tippst du auf das Kästchen davor – dann ist sie erledigt." },
  { v: "start", vor: () => rgTodoWichtig(), nach: () => rgTodoWichtigZu(), sel: [rgTodoWichtigZeile, "#wichtig"], puls: [() => rgTodoWichtigZeile()?.querySelector('[onclick^="aufgabeErledigt"]')], t: "🏠 Auf der Startseite",
    x: "Wird eine Aufgabe aus dem Protokoll bald fällig, steht sie auch auf der Startseite unter Heute wichtig – mit dem Knopf erledigt." },
  { v: "termine", vor: () => rgTodoAn(), sel: ["#v-termine > .umschalter"], puls: ["#v-termine > .umschalter > .zk", '#v-termine > .umschalter [data-m="todo"]'], t: "✅ Fertig",
    x: "Das war's: In Termine auf To-do umschalten, Aufgabe hineinschreiben, verteilen, eintragen – und abhaken, wenn sie geschafft ist. Aufgaben aus den Protokollen findest du in Protokolle unter Offene Aufgaben." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-EINFACH (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-EINFACH (Wunsch Hansi „ruhiges, langsames Video über die einfache Ansicht – für Mitglieder, die wenig mit Handys machen“).
// Die Ansicht wird NUR auf dem Bildschirm vorgeführt: ansichtSetzen() würde auf dem Server und im Gerät speichern – deshalb rgEinfachDemo().
// Am Ende stellt RG.zurueck ANSICHT, die body-Klasse, Register, Kacheln und Info-Feld genau wie vorher wieder her.
function rgEinfachAnwenden() { // wie ansichtAnwenden(), aber ohne Speichern und ohne „Anordnen“ zu beenden (kaBearbeiten(false) würde speichern)
  document.body.classList.toggle("einfach", einfach());
  if ($("ansichtKnopf")) $("ansichtKnopf").textContent = einfach() ? "🔧 Erweiterte Ansicht" : "🟢 Einfache Ansicht";
  ansichtInfo();
  if (INIT) { registerZeigen(); kachelnZeigen(); infoFelderAktualisieren(); heroZeigen(0); }
  try { if (RK.einst && (RK.einst.an || rkAn("einst"))) rkAufbauen(RK.einst); } catch {} // Einstellungen als Rollkartei: Karten der jeweiligen Ansicht neu legen; 2.482.0: einfach ↔ erweitert wechselt Liste/Kartei mit
}
function rgEinfachDemo(an) { // an = true: einfache Ansicht zeigen, an = false: erweiterte Ansicht zeigen – nie gespeichert
  if (!RG.einfachAlt) {
    const orig = ansichtUebernehmen;
    RG.einfachAlt = { ansicht: ANSICHT, info: INFO_FELDER[INFO_I]?.id, infoI: INFO_I };
    // Während des Videos lädt die App im Hintergrund neu (z. B. beim Wechsel zur Startseite) und würde die gespeicherte Ansicht
    // wieder anwenden. Dann nur merken, welche Ansicht wirklich gilt – angezeigt bleibt die Vorführung; am Ende gilt genau diese.
    ansichtUebernehmen = (w) => { if (!RG.einfachAlt) return orig(w); if (w?.gewaehlt) RG.einfachAlt.ansicht = w.art === "erweitert" ? "erweitert" : "einfach"; };
    RG.zurueck.push(() => {
      ansichtUebernehmen = orig;
      const a = RG.einfachAlt; RG.einfachAlt = null; if (!a) return;
      if (ANSICHT !== a.ansicht) { ANSICHT = a.ansicht; rgEinfachAnwenden(); }
      const i = INFO_FELDER.findIndex((f) => f.id === a.info); INFO_I = i >= 0 ? i : a.infoI; heroZeigen(0);
    });
  }
  const soll = an ? "einfach" : "erweitert";
  if (ANSICHT !== soll || document.body.classList.contains("einfach") !== an) { ANSICHT = soll; rgEinfachAnwenden(); }
}
function rgEinfachRkZu(id) { // Einstellungen als Rollkartei: beim ersten Öffnen springt die Kartei nach dem Aufbauen auf Karte 1 – dann zur richtigen Karte nachblättern
  for (const ms of [500, 1200]) setTimeout(() => { const e = $(id), z = RK.einst; if (RG.an && e && z?.an && z.karten[z.i] && !z.karten[z.i].contains(e)) rkZu(z, e); }, ms);
}
const RG_EINFACH = [
  { v: "start", vor: () => { rgEinfachDemo(true); rgKopf("offen"); }, t: "👋 Die einfache Ansicht",
    x: "Schön, dass du da bist. In diesem Video zeige ich dir in Ruhe die einfache Ansicht – mit wenigen, großen Knöpfen. Du musst nichts antippen, ich blättere langsam selbst weiter. Und keine Sorge: An deiner App verstelle ich nichts." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [".ansichtname.ein"], mussSel: true, puls: [".ansichtname.ein"], t: "🟢 Daran erkennst du sie",
    x: "Über den Kacheln steht in grüner Schrift: Einfache Ansicht. Daran erkennst du, dass sie gerade eingeschaltet ist." },
  { v: "start", vor: () => { rgEinfachDemo(true); rgKopf("offen"); }, sel: ["#infoLaufband", "#heroInfo"], t: "📅 Oben: das nächste Treffen",
    x: "Oben im farbigen Feld läuft das Info-Laufband. Der erste Punkt ist immer das nächste Treffen – mit Datum, Ort und ob du schon zu- oder abgesagt hast. Fehlt deine Antwort, sagst du dort gleich zu oder ab." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("termine")], mussSel: true, puls: [rgKachel("termine")], video: "zusagen", t: "📅 Kachel Termine",
    x: "Jetzt die großen Kacheln, eine nach der anderen. Termine: Hier stehen alle Clubtermine. Mit Ich komme, Vielleicht oder Kann nicht gibst du Bescheid." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("kommunikation")], mussSel: true, puls: [rgKachel("kommunikation")], video: "nachricht", t: "💬 Kachel Nachrichten",
    x: "Nachrichten: Hier liest du, was dir andere Mitglieder schreiben, und schreibst selbst zurück. Steht oben in der Ecke eine Zahl, wartet etwas Neues auf dich." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("pinnwand")], mussSel: true, puls: [rgKachel("pinnwand")], t: "📌 Kachel Pinnwand",
    x: "Die Pinnwand ist das schwarze Brett des Clubs. Dort hängen kurze Zettel für alle – Glückwünsche, Hinweise oder eine Bitte um Hilfe." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("meindienst")], mussSel: true, puls: [rgKachel("meindienst")], t: "🗓️ Kachel Mein Dienst",
    x: "Mein Dienst zeigt dir den Dienstplan – nur mit deinen eigenen Diensten. So siehst du gleich, wann du dran bist." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("mitglieder")], mussSel: true, puls: [rgKachel("mitglieder")], t: "👥 Kachel Mitglieder",
    x: "Mitglieder: alle aktiven Clubmitglieder. Ein grüner Punkt heißt: gerade in der App. Von dort aus schreibst du jemandem oder rufst an." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("dokumente")], mussSel: true, puls: [rgKachel("dokumente")], t: "📚 Kachel Meine Dokumente",
    x: "Meine Dokumente: Anleitungen und wichtige Unterlagen zum Lesen – zum Beispiel die Bedienungsanleitung der App. Du kannst sie auch drucken." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("spiele")], mussSel: true, puls: [rgKachel("spiele")], t: "🎲 Kachel Spiele",
    x: "Spiele: zum Beispiel Schach, Bauernskat oder Mensch ärgere dich nicht – gegen den Computer oder gegen andere Mitglieder." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: [rgKachel("sos")], mussSel: true, puls: [rgKachel("sos")], t: "🆘 Kachel SOS",
    x: "Die rote Kachel SOS ist für den Notfall: Dort stehen die Notrufnummern zum direkten Anrufen, mit Wo bin ich siehst du deinen Standort, und darunter die Notfallkontakte." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: ["#fuss"], puls: ["#fuss button"], t: "⬇️ Die Leiste ganz unten",
    x: "Ganz unten ist immer die Leiste: Start, Termine, Nachrichten, Mitglieder und Mehr. Mit Start kommst du von überall mit einem Tipp zurück zur Startseite." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: ["#hzFrage"], mussSel: true, puls: ["#hzFrage"], video: "hilfe", t: "❓ Das Fragezeichen",
    x: "Unten rechts sitzt das runde Fragezeichen. Es öffnet die Hilfe zu genau dem Bereich, in dem du gerade bist. So bist du nie allein." },
  { v: "einstellungen", tippVor: `#fuss [onclick="zeige('einstellungen')"]`, vor: () => { rgEinfachDemo(true); rgAuf("einfach"); }, sel: [rgKlappe("einfach")], mussSel: true, t: "⚙️ Unter Mehr: Das Wichtigste",
    x: "Unter Mehr gibt es in der einfachen Ansicht nur einen Bereich: Das Wichtigste. Dort wählst du, wie du Neuigkeiten bekommst, deine Lieblingsfarbe, große Schrift und ob das Fragezeichen zu sehen ist." },
  { v: "einstellungen", vor: () => { rgEinfachDemo(true); rgAuf("einfach"); }, sel: [rgOn("ansichtSetzen('erweitert')", ".schalter")], mussSel: true, puls: [rgOn("ansichtSetzen('erweitert')")], t: "🔧 Erweiterte Ansicht einschalten",
    x: "Möchtest du irgendwann mehr sehen, tippst du hier bei Einfache Ansicht auf Erweiterte Ansicht. Dann siehst du alle Funktionen. Ich tippe hier nicht – ich zeige es dir nur." },
  { v: "start", vor: () => rgEinfachDemo(true), sel: ["#ansichtKnopf"], mussSel: true, puls: ["#ansichtKnopf"], t: "🔧 Oder ganz unten auf der Startseite",
    x: "Das geht auch auf der Startseite: Ganz unten, unter den Kacheln, steht der Knopf Erweiterte Ansicht." },
  { v: "start", vor: () => { rgEinfachDemo(false); rgKopf("offen"); }, sel: ["#register"], mussSel: true, puls: ['#register [data-r="verein"]', '#register [data-r="mein"]', '#register [data-r="programme"]'], video: "ueberblick", t: "🗂️ So sieht die erweiterte Ansicht aus",
    x: "So sieht die erweiterte Ansicht aus: Oben stehen Register – Club, Meins und Technik –, darunter viele kleinere Kacheln mit allen Funktionen. Das zeige ich dir nur – bei dir bleibt alles, wie es war." },
  { v: "start", vor: () => rgEinfachDemo(false), sel: [".ansichtname.erw", ".ansichtname.ein"], mussSel: true, puls: [".ansichtname.erw"], t: "🟢 Und wieder zurück",
    x: "Zurück geht es genauso leicht: Über den Kacheln steht jetzt in roter Schrift Erweiterte Ansicht. Tippst du darauf, kommt die einfache Ansicht wieder.",
    live: async (L) => { await L.warte(2500); await L.tipp(".ansichtname.erw"); rgEinfachDemo(true); L.ziel(); } },
  { v: "einstellungen", vor: () => { rgEinfachDemo(false); rgAuf("startseite"); rgEinfachRkZu("setInfoStart"); }, sel: [rgOn("ansichtSetzen('einfach')", ".schalter")], mussSel: true, puls: [rgOn("ansichtSetzen('einfach')")], t: "⚙️ Zurück über Mehr",
    x: "Oder unter Mehr, im Bereich Startseite und Ansicht: bei Einfache Ansicht auf Einschalten tippen. Deine Wahl gilt dann auf allen deinen Geräten." },
  { v: "start", vor: () => { rgEinfachDemo(true); rgKopf("offen"); }, t: "✅ Fertig",
    x: () => "Das war die einfache Ansicht: oben das nächste Treffen, darunter die großen Kacheln" + (hzFrageAus() ? " und unten die Leiste." : ", unten die Leiste und rechts das Fragezeichen.") + " Umschalten kannst du jederzeit – es geht dabei nichts verloren." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-RAETSEL (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-RAETSEL (Wunsch Hansi „eigenes Video zum Rätsel auf der Rückseite – vom Eselsohr bis zur Bestenliste“).
// Nur vorgeführt: Eine Übungsrunde „Werne“ wird angezeigt und eingefroren (keine Uhr, kein Ton, kein Konfetti); Buzzer, Tipps und Auflösung
// werden nur nachgebildet. Übungsrunden tragen nie etwas ein (nur das Wochen-Rätsel – das wird im Video nicht gestartet). Am Ende: Runde weg,
// gemerkter Reiter der Rückseite wie vorher, Kopf zurückgedreht (rgRueck).
function rgQzAuf() {
  if (RG.qzZurueck) return;
  const tab = esLies("tab", null); RG.qzZurueck = true;
  RG.zurueck.push(() => { RG.qzZurueck = false; RG.qzSoll = null; RG.qzWahlHtml = null; qzStop(); QZ.spiel = null;
    if (tab === null) { try { localStorage.removeItem("kc_club_es_tab"); } catch {} } else esSchreib("tab", tab); });
}
function rgQzWahl() { // Auswahl: Wochen-Rätsel, Werne üben, Küche üben, Bestenliste … – einmal geladen, danach sofort wieder da (kein Warten auf den Server)
  rgQzAuf(); const f = $("hrFlaeche");
  if (ES.offen && RG.qzWahlHtml && f?.classList.contains("hr-raetsel")) { rgRueck(null); qzStop(); QZ.spiel = null; if (!$("qzWahl")?.querySelector(".qz-gross")) f.innerHTML = RG.qzWahlHtml; return; }
  rgRueck("raetsel");
  let n = 0; const merken = () => { if (!RG.an) return; if ($("qzWahl")?.querySelector(".qz-gross")) RG.qzWahlHtml = $("hrFlaeche").innerHTML; else if (n++ < 80) setTimeout(merken, 100); }; merken();
}
function rgQzSpiel(sek, art) { // Übungsrunde Werne zeigen: sek = so weit ist die Zeit gelaufen; art: "" | "tipps" | "falsch" | "richtig"
  rgQzAuf(); RG.qzSoll = { sek, art: art || "" };
  if (QZ.spiel?.rg && $("qzBild")) { rgRueck(null); return rgQzStellen(); }
  rgRueck("raetsel"); qzStart("werne"); const S = QZ.spiel; if (!S) return; S.rg = true;
  let n = 0; const warte = () => { if (QZ.spiel !== S || !RG.an) return; if (S.t === undefined && n++ < 60) return setTimeout(warte, 100); rgQzStellen(); }; warte();
}
function rgQzStellen() {
  const S = QZ.spiel, s = RG.qzSoll; if (!S || !s || !$("qzBild") || S.t === undefined) return;
  const B = S.bilder[S.i], falsch = B.tipps.find((a) => a !== B.m.a);
  Object.assign(S, { lauf: false, fertig: false, t: s.sek, falsch: s.art === "falsch" ? 1 : 0, stufe: -1 }); B.weg = s.art === "falsch" ? [falsch] : [];
  if (s.art === "richtig") S.fertig = true;
  qzMalen();
  const p = qzPunkteJetzt(S), r = 1 - S.t / QZ_SEK, b = $("qzBalken");
  $("qzPunkte").textContent = p;
  if (b) { b.style.width = s.art === "richtig" ? "0" : `${r * 100}%`; b.style.background = r > .5 ? "#2ecc71" : r > .2 ? "#f1c40f" : "#e74c3c"; }
  const t = $("qzTipps"), l = $("qzLoesung"), u = $("qzUnten");
  if (s.art === "tipps" || s.art === "falsch") {
    t.innerHTML = `<div class="qz-frage">Was ist auf dem Bild?</div><div class="qz-tipp-gitter">${B.tipps.map((a) => `<button type="button" class="qz-tipp${B.weg.includes(a) ? " falsch" : ""}" disabled>${esc(a)}</button>`).join("")}</div>`;
    t.classList.remove("versteckt");
  } else t.classList.add("versteckt");
  if (s.art === "richtig") {
    l.innerHTML = `<div class="qz-ergebnis gut">🎉 Richtig! +${p} Punkte</div><b>${esc(B.m.a)}</b>${B.m.info ? `<span>${esc(B.m.info)}</span>` : ""}<small>Foto: ${esc(B.m.autor)}${B.m.liz ? " · " + esc(B.m.liz) + " · Wikimedia Commons" : ""}</small>`;
    l.classList.remove("versteckt");
    u.innerHTML = `<button type="button" class="es-k es-haupt qz-weiter" disabled>▶ Nächstes Bild</button><button type="button" class="es-k" disabled>✖ Ende</button>`;
  } else {
    l.classList.add("versteckt");
    u.innerHTML = `<button type="button" class="qz-buzzer" id="qzBuzzer" aria-label="Buzzer – ich weiß es"${s.art ? " disabled" : ""}><span>BUZZ</span></button>`;
  }
}
const RG_RAETSEL = [
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, t: "👋 Wie gut kennst du Werne?",
    x: "In diesem Video zeige ich dir das Rätsel: Ein Foto wird nach und nach schärfer – wer es früh erkennt, bekommt viele Punkte. Ich spiele hier nur zum Zeigen, es wird nichts eingetragen." },
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, sel: ["#eselsohr"], mussSel: true, puls: ["#eselsohr"], video: "rueckseite", t: "📄 Über das Eselsohr",
    x: "Das Rätsel steht auf der Rückseite des grünen Kopfes. Tipp doppelt auf das Eselsohr unten rechts – dann dreht sich der Kopf um.",
    live: async (L) => { await L.warte(1500); await L.tipp("#eselsohr", "doppelt"); } },
  { v: "start", vor: () => rgQzWahl(), sel: ['#heroRueck [data-tab="raetsel"]'], mussSel: true, puls: ['#heroRueck [data-tab="raetsel"]'], t: "🧩 Der Reiter Rätsel",
    x: "Oben bei den Reitern tippst du auf Rätsel. Dann siehst du die Auswahl." },
  { v: "start", vor: () => rgQzWahl(), sel: ["#qzWahl .qz-reihe", "#qzWahl"], mussSel: true, puls: [rgOn("qzStart('werne')"), rgOn("qzStart('kueche')")], t: "🏛️ Werne oder Küche",
    x: "Zum Üben wählst du eine Gruppe: Werne üben – mit Bildern aus unserer Stadt – oder Küche üben. Eine Runde hat fünf Bilder. Üben kannst du, so oft du magst.",
    live: async (L) => { await L.warte(5500); await L.tipp(rgOn("qzStart('werne')")); } },
  { v: "start", vor: () => rgQzSpiel(0.5), sel: ["#hrFlaeche .qz-bildfeld"], mussSel: true, t: "🔍 Das Bild wird schärfer",
    x: "Los geht es: Das Foto ist erst grob verpixelt und wird Stufe für Stufe schärfer. Nach gut zwanzig Sekunden ist es ganz scharf.",
    live: async (L) => { for (const t of [2.5, 5, 7.5, 10.5, 13.5]) { await L.warte(1300); if (RG.qzSoll) { RG.qzSoll.sek = t; rgQzStellen(); } } } },
  { v: "start", vor: () => rgQzSpiel(7.5), sel: ["#hrFlaeche .qz-spiel"], mussSel: true, puls: ["#qzPunkte", "#hrFlaeche .qz-balken"], t: "⏱️ Punkte und Zeitbalken",
    x: "Oben in der Mitte stehen die Punkte: Sie beginnen bei tausend und werden mit der Zeit weniger, bis zweihundertfünfzig. Unten läuft der Zeitbalken – von Grün über Gelb nach Rot." },
  { v: "start", vor: () => rgQzSpiel(7.5), sel: ["#qzBuzzer"], mussSel: true, puls: ["#qzBuzzer"], t: "🔴 Der rote Buzzer",
    x: "Erkannt? Dann drück den roten Buzzer. Die Uhr bleibt sofort stehen.",
    live: async (L) => { await L.warte(2200); await L.tipp("#qzBuzzer"); if (RG.qzSoll) { RG.qzSoll.art = "tipps"; rgQzStellen(); } } },
  { v: "start", vor: () => rgQzSpiel(7.5, "tipps"), sel: ["#qzTipps"], mussSel: true, puls: ["#qzTipps .qz-tipp"], t: "🔢 Sechs Antworten",
    x: "Jetzt erscheinen sechs Antworten. Tipp auf die richtige." },
  { v: "start", vor: () => rgQzSpiel(7.5, "falsch"), sel: ["#hrFlaeche .qz-spiel"], mussSel: true, puls: ["#qzTipps .qz-tipp.falsch", "#qzPunkte"], t: "❌ Daneben getippt",
    x: "Ist die Antwort falsch, wird sie durchgestrichen und kostet hundertfünfzig Punkte. Dann läuft das Bild weiter – und du kannst nochmal buzzern." },
  { v: "start", vor: () => rgQzSpiel(7.5, "richtig"), sel: ["#qzLoesung"], mussSel: true, puls: ["#qzLoesung .qz-ergebnis", "#hrFlaeche .qz-weiter"], t: "🎉 Richtig erkannt",
    x: "Richtig! Dann bekommst du die Punkte, das Foto wird ganz scharf, und darunter steht ein Satz dazu. Mit Nächstes Bild geht es weiter. Nach fünf Bildern siehst du dein Ergebnis." },
  { v: "start", vor: () => rgQzWahl(), sel: [rgOn("qzStart('woche')"), "#qzWahl"], mussSel: true, puls: [rgOn("qzStart('woche')")], t: "🏆 Das Wochen-Rätsel",
    x: "Ganz oben steht das Wochen-Rätsel: Alle im Club bekommen in dieser Woche dieselben fünf Bilder. Nur dein erster Durchgang zählt für die Club-Bestenliste – danach kannst du zum Üben nochmal spielen." },
  { v: "start", tippVor: rgOn("qzBestenliste()"), vor: () => { rgQzWahl(); qzBestenliste(); }, sel: ["#hrFlaeche .qz-liste", "#hrFlaeche .qz-start"], mussSel: true, t: "🥇 Die Club-Bestenliste",
    x: "Unter Bestenliste siehst du, wer diese Woche vorn liegt, und darunter die Gesamtwertung über alle Wochen. Dein eigener Name ist farbig hinterlegt." },
  { v: "start", vor: () => rgQzWahl(), sel: [rgOn("qzNachweise()")], mussSel: true, puls: [rgOn("qzNachweise()")], t: "📜 Bildnachweise",
    x: "Unter Bildnachweise steht, wer die Fotos gemacht hat. Es sind freie Fotos von Wikimedia Commons." },
  { v: "start", nur: () => !ICH?.admin && QZ.eigene.length > 0, vor: () => rgQzWahl(), sel: [rgOn("qzStart('club')"), "#qzWahl"], mussSel: true, puls: [rgOn("qzStart('club')")], t: "📸 Fotos aus unserem Club",
    x: "Gibt es auch den Knopf Köcheclub, dann raten alle mit Fotos aus unserem eigenen Fotoalbum. Die stellt der Admin für das Rätsel zusammen." },
  { v: "start", nur: () => !!ICH?.admin, vor: () => rgQzWahl(), sel: [rgOn("qzEigeneVerwalten()")], mussSel: true, puls: [rgOn("qzEigeneVerwalten()")], t: "📸 Eigene Club-Fotos",
    x: "Nur du als Admin siehst Eigene Bilder: Dort tippst du ein Foto aus dem Club-Album an und schreibst die Lösung dazu, auf Wunsch auch einen Satz. Dann raten alle unter Köcheclub mit. Entfernen geht mit dem Mülleimer – das Foto im Album bleibt." },
  { v: "start", vor: () => rgQzWahl(), t: "✅ Fertig",
    x: "Das war das Rätsel: Foto wird schärfer, roten Buzzer drücken, aus sechs Antworten wählen – je früher, desto mehr Punkte. Viel Spaß beim Raten – und viel Glück in der Bestenliste!" },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-BUEHNE (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-BUEHNE (Wunsch Hansi „eigenes Video zur Bühne – Training, Regler, Musik, Club-Song, Einladung“). Vertieft das Video
// „Die Rückseite“ (RG_RUECKSEITE). Alles nur als Bild: keine Musik, keine Ansage von Twinkey, keine Uhr läuft (BW.lauf/BW.hoeren werden nur zum
// Zeichnen gesetzt und gleich wieder geleert); Einladung und Karaoke-Zeile sind nachgebildet, Knöpfe darin ohne Wirkung. Die Wahl auf der Bühne
// (Sitzen/Stehen, Dauer, Musik, Ansage) wird nicht verändert. Am Ende: Bühne gestoppt, Trainings-Modus aus, gemerkter Reiter wie vorher.
function rgBwAuf() {
  if (RG.bwZurueck) return;
  const tab = esLies("tab", null); RG.bwZurueck = true;
  RG.zurueck.push(() => { RG.bwZurueck = false; BW.vorher = null; BW.hoeren = null; BW.lauf = null; bwStopp(false); clearInterval(KS.uhr); KS.uhr = 0;
    if (tab === null) { try { localStorage.removeItem("kc_club_es_tab"); } catch {} } else esSchreib("tab", tab); });
}
function rgBwWahl() { rgBwAuf(); BW.vorher = null; BW.hoeren = null; BW.lauf = null; bwTrainingKnoepfe(false); rgRueck("buehne"); } // Bühnen-Auswahl
function rgBwBereit() { // „Lege dir bitte bereit“ – ohne Ansage (die kommt nur beim ersten Zeigen eines neuen Plans)
  rgBwWahl(); const w = bwWahl(); BW.vorher = bwPlan(w.modus, w.dauer); bwVorher();
}
function rgBwLauf() { // laufendes Training nur zeigen: Übung, Uhr, Regler, Leiste – nichts läuft
  rgBwAuf(); BW.hoeren = null; BW.vorher = null; rgRueck("buehne"); const plan = bwPlan("kueche", 10);
  BW.lauf = { plan, i: 2, phase: "uebung", rest: 18, pause: false, musik: true, ansage: true, sek: 0, zeit: 95, lob: 0, sprueche: 0, farbe: 2, warte: 0 };
  BW.blase = "Super machst du das!"; BW.sprechZeit = Date.now(); bwLaufZeigen(); BW.lauf = null;
}
function rgBwHoeren(id) { // „Nur Musik hören“ zeigen – ohne Musik; beim Club-Song eine Karaoke-Zeile aus dem echten Liedtext
  rgBwAuf(); BW.lauf = null; BW.vorher = null; rgRueck("buehne");
  const i = Math.max(0, BW_STUECKE.findIndex((s) => s.id === (id || "clubsong")));
  BW.hoeren = { i, pause: false, tanz: 0, farbe: 1 }; bwHoerZeigen(); BW.hoeren = null; clearInterval(KS.uhr); KS.uhr = 0;
  const k = $("bwKaraoke"), z = KS_TAKTE.filter((x) => x.zeile).map((x) => x.zeile.silben);
  if (k && z.length) { const s = z[0], g = Math.min(s.length - 1, Math.max(1, Math.floor(s.length / 2)));
    k.innerHTML = `<div class="bw-k-zeile">${s.map((x, n) => `<span class="${n < g ? "war" : n === g ? "jetzt" : ""}">${esc(x)}</span>`).join("")}</div>${z[1] ? `<div class="bw-k-naechste">${esc(z[1].join("").trim())}</div>` : ""}`; }
}
function rgBwEinladung() { // die Frage beim Öffnen der App nachgebildet (Knöpfe ohne Wirkung)
  rgBlatt("bwEinBlatt", () => { const name = ICH?.vorname || "";
    blattAuf("bwEinBlatt", `<div class="bw-ein"><div class="bw-ein-figur">${bwFigur("winken", 0, "", 0, .5, 0, new Date().getDate())}</div>
      <h3 style="margin:4px 0">Hallo${name ? " " + esc(name) : ""}! 👋</h3><p style="margin:0 0 10px">Heute Lust auf eine kleine <b>Bewegungseinheit</b> mit mir? Ein paar Minuten mit Musik – im Sitzen, im Stehen oder mit Küchenhelfern.</p>
      <div class="knoepfe" style="flex-direction:column;align-items:stretch"><button type="button" class="knopf haupt">💪 Ja, los geht's!</button>
      <button type="button" class="knopf">⏰ Später</button><button type="button" class="knopf">🙂 Heute nicht</button><button type="button" class="knopf klein">🔕 Nicht mehr fragen</button></div></div>`); });
}
function rgBwRkZu(id) { // Einstellungen als Rollkartei: beim ersten Öffnen springt die Kartei nach dem Aufbauen auf Karte 1 – dann zur richtigen Karte nachblättern
  for (const ms of [500, 1200]) setTimeout(() => { const e = $(id), z = RK.einst; if (RG.an && e && z?.an && z.karten[z.i] && !z.karten[z.i].contains(e)) rkZu(z, e); }, ms);
}
const RG_BUEHNE = [
  { v: "start", vor: () => { rgKopf("offen"); esEinsetzen(); }, t: "👋 Bühne frei!",
    x: "In diesem Video zeige ich dir die Bühne genauer: Twinkey turnt mit dir, du kannst nur Musik hören oder unseren Club-Song mitsingen. Keine Sorge – hier läuft keine Musik, und ich verstelle nichts." },
  { v: "start", vor: () => rgBwWahl(), sel: ['#heroRueck [data-tab="buehne"]'], mussSel: true, puls: ['#heroRueck [data-tab="buehne"]', "#heroRueck .eselsohr"], video: "rueckseite", t: "🎭 Der Reiter Bühne",
    x: "Die Bühne steht auf der Rückseite des grünen Kopfes: doppelt aufs Eselsohr tippen, dann oben auf den Reiter Bühne." },
  { v: "start", vor: () => rgBwWahl(), sel: ["#hrFlaeche .bw-wahl"], mussSel: true, puls: [() => [...document.querySelectorAll("#hrFlaeche .bw-wahl .bw-reihe")[0]?.children || []], () => $("hrFlaeche")?.querySelector(".bw-hinweis")], t: "🪑 Sitzen, Stehen oder Küchenhelfer",
    x: () => (document.querySelector("#hrFlaeche .bw-hinweis") ? "Beim ersten Mal steht oben ein Hinweis: Mach nur so viel, wie dir guttut – mit Verstanden geht es weiter. " : "")
      + "Dann wählst du: im Sitzen, im Stehen oder mit Küchenhelfern wie Schneebesen, Kochlöffel oder Pfanne." },
  { v: "start", vor: () => rgBwWahl(), sel: ["#hrFlaeche .bw-wahl"], mussSel: true, puls: [() => [...document.querySelectorAll("#hrFlaeche .bw-wahl .bw-reihe")[1]?.children || []]], t: "⏲️ Dauer, Musik und Ansage",
    x: "Darunter die Dauer – fünf, zehn oder fünfzehn Minuten – und ob Musik und Twinkeys Ansage dabei sein sollen. Die App merkt sich deine Wahl." },
  { v: "start", tippVor: "#hrFlaeche .bw-los", vor: () => rgBwBereit(), sel: ["#hrFlaeche .bw-bereit"], mussSel: true, puls: ["#hrFlaeche .bw-bereit-liste", "#hrFlaeche .bw-bereit .bw-los"], t: "🧺 Erst bereitlegen",
    x: "Mit Vorhang auf sagt Twinkey zuerst, was du bereitlegen sollst – zum Beispiel einen Stuhl. Fehlt etwas, überspringst du die Übung später einfach mit Weiter. Dann tippst du auf Alles bereit – los." },
  { v: "start", tippVor: "#hrFlaeche .bw-bereit .bw-los", vor: () => rgBwLauf(), sel: ["#bwLauf .bw-kopf", "#bwLauf"], mussSel: true, puls: ["#bwZahl", "#bwSprech"], t: "🕺 Twinkey turnt vor",
    x: "Jetzt turnt Twinkey vor. Oben steht die Übung, die große Zahl zählt die Sekunden herunter. Zwischendurch feuert er dich an – das steht dann in der Sprechblase." },
  { v: "start", vor: () => rgBwLauf(), sel: ["#bwLauf .bw-uhr"], mussSel: true, puls: ["#bwUhrAb", "#bwUhrNoch"], t: "⏱️ Die Trainingsuhr",
    x: "Neben Twinkey steht die Trainingsuhr: oben, wie lange du schon dabei bist, darunter, wie lange es noch geht. Lupe, Fragezeichen und Mikrofon sind während des Trainings ausgeblendet – damit nichts stört." },
  { v: "start", vor: () => rgBwLauf(), sel: ["#bwLaut_musik", "#bwLaut_stimme"], mussSel: true, puls: ["#bwLaut_musik", "#bwLaut_stimme"], t: "🎚️ Lauter und leiser",
    x: "Am Rand stehen zwei Regler: rechts die Musik, links Twinkeys Stimme. Nach oben ziehen wird lauter, der Keil wird dicker. Ein Tipp unten aufs Symbol macht sofort stumm, ein zweiter holt die Lautstärke zurück. Ist alles zu leise, prüf auch die Lautstärke am Handy." },
  { v: "start", vor: () => rgBwLauf(), sel: ["#bwLauf .es-leiste"], mussSel: true, puls: ["#bwLauf .es-leiste button"], t: "⏸️ Pause, Weiter und Ende",
    x: "Unten: Pause hält an. Weiter überspringt die Übung – praktisch, wenn ein Küchenhelfer fehlt. Mit der Note schaltest du die Musik ab, mit dem Lautsprecher die Ansage. Ende beendet das Training. Mach nur so viel, wie dir guttut – bei Schmerzen, Schwindel oder Atemnot sofort aufhören." },
  { v: "start", vor: () => rgBwWahl(), sel: [rgOn("bwHoeren()")], mussSel: true, puls: [rgOn("bwHoeren()")], t: "🎶 Nur Musik hören",
    x: "Lieber nur zuhören statt turnen? Dann tippst du auf Nur Musik hören. Twinkey tanzt dazu – ohne Übungen und ohne Ansage." },
  { v: "start", tippVor: rgOn("bwHoeren()"), vor: () => rgBwHoeren("disco"), sel: ["#bwHoer .bw-liste"], mussSel: true, puls: ["#bwHoer .bw-richtung"], t: "🪩 Musikrichtung wählen",
    x: "Oben wählst du per Kachel die Musikrichtung: den Club-Song, Disco, Reggae, Funky, Rock, Ballade, Latin oder Schlager und Polka. Darunter stehen die Lieder dieser Richtung." },
  { v: "start", vor: () => rgBwHoeren("disco"), sel: ["#bwHoer .es-leiste"], mussSel: true, puls: ["#bwHoer .es-leiste button", "#bwLaut_musik"], t: "⏭️ Blättern und Lautstärke",
    x: "Jedes Lied läuft etwa zweieinhalb Minuten, dann kommt das nächste derselben Richtung. Mit den Pfeilen blätterst du, Pause hält an, Ende hört auf. Rechts der Regler für die Lautstärke. Die Musik entsteht im Handy – Internet brauchst du dafür nicht." },
  { v: "start", vor: () => rgBwWahl(), sel: [rgOn("bwClubSong()")], mussSel: true, puls: [rgOn("bwClubSong()")], t: "🎤 Unser Club-Song",
    x: "Und dann gibt es noch unseren eigenen Club-Song zum Mitsingen. Dafür tippst du auf Club-Song." },
  { v: "start", tippVor: rgOn("bwClubSong()"), vor: () => rgBwHoeren("clubsong"), sel: ["#bwKaraoke", "#bwHoer"], mussSel: true, puls: ["#bwKaraoke .jetzt", "#bwHoer .bw-kopf"], t: "✨ Mitsingen",
    x: "Das Lied heißt Seit einundneunzig, Köcheclub Werne – ein Disco-Fox. Twinkey tanzt, der Text läuft mit, und die Silbe, die gerade gesungen wird, leuchtet golden. Darunter steht schon die nächste Zeile." },
  { v: "start", vor: () => { rgBwWahl(); rgBwEinladung(); }, nach: () => $("bwEinBlatt") && fensterZu($("bwEinBlatt")), sel: ["#bwEinBlatt .bw-ein .knoepfe", "#bwEinBlatt"], mussSel: true, puls: ["#bwEinBlatt .knopf"], t: "💪 Twinkey lädt dich ein",
    x: "Beim Öffnen der App fragt Twinkey höchstens einmal am Tag: Heute Lust auf eine Bewegungseinheit mit mir? Ja führt direkt zur Bühne. Später fragt in etwa zwei Stunden wieder, Heute nicht erst morgen – und Nicht mehr fragen schaltet es ab." },
  { v: "einstellungen", vor: () => { $("bwEinBlatt") && fensterZu($("bwEinBlatt")); rgAuf("startseite"); rgBwRkZu("setBwEinladung"); }, sel: [rgSchalter("setBwEinladung")], mussSel: true, puls: ["#setBwEinladung"], t: "⚙️ Einladung wieder einschalten",
    x: "Wieder einschalten kannst du die Einladung unter Mehr, im Bereich Startseite und Ansicht: Twinkey lädt zur Bewegung ein. Das gilt für dieses Gerät." },
  { v: "start", vor: () => rgBwWahl(), t: "✅ Fertig",
    x: "Das war die Bühne: bereitlegen, mit Twinkey turnen, Musik und Stimme regeln, nur Musik hören oder den Club-Song mitsingen. Viel Spaß – und mach nur so viel, wie dir guttut!" },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-BUERO (Wunsch Hansi „für alle Themen Videos – logisch aufgebaut, gut erklärt“) ----------
// 2.348.0 KC-CLUB-VIDEO-BUERO (Wunsch Hansi „Video Büro im Alltag – Eingangskorb, Bestätigungen per Knopf, einlesen, Mail mit Anhang, mehrere
// Ordner, Sprache, Schilder“). Vertieft das Video „Für die Clubleitung“ (RG_LEITUNG). Es wird NICHTS gesendet, abgelegt oder gespeichert:
// Gezeigt werden nur Fenster (Lesen vom Server ist erlaubt); die Video-Schicht fängt jedes Antippen ab. Die eingelesene Datei ist ein Beispiel
// im Speicher (nie hochgeladen). Am Ende: alle Fenster zu, EINL/EMAIL/Schilder-Stand leer, Büro-Ansicht (Raum/Liste) und -Sicht wie vorher.
const RG_BU_FENSTER = ["buEinBlatt", "ekDwBlatt", "ekAblageBlatt", "ekHinweisBlatt", "einlBlatt", "schBlatt", "buFuellerBlatt"];
function rgBueroSicht(id) { // Fenster während des Videos zeigen (sonst warten Fenster bis nach dem Video) – auch wenn es erst nach dem Lesen aufgeht
  let n = 0; const los = () => { $(id)?.classList.add("rg-zeigen"); if (RG.an && n++ < 40) setTimeout(los, 100); }; los(); // 4 s lang – manche Fenster werden nach dem Laden neu gezeichnet
}
function rgBueroZu(...ausser) { for (const id of RG_BU_FENSTER) if (!ausser.includes(id) && $(id)) fensterZu($(id)); }
function rgBueroAuf() {
  if (RG.buZurueck) return;
  const alt = { ansicht: lsLesen(BU_ANSICHT), sicht: BU.sicht, ordner: BU.ordner }; RG.buZurueck = true;
  RG.zurueck.push(() => {
    RG.buZurueck = false; RG.buDw = null; RG.buAblage = null; rgBueroZu(); EINL = null; EMAIL = null;
    Object.assign(SDR, { sicht: "start", d: null, id: null, name: "" });
    if (alt.ansicht === null) { try { localStorage.removeItem(BU_ANSICHT); } catch {} } else lsSetzen(BU_ANSICHT, alt.ansicht);
    BU.sicht = alt.sicht; BU.ordner = alt.ordner; if (aktuelleAnsicht === "buero") buZeigen();
  });
}
function rgBueroRaum() { rgBueroAuf(); rgBueroZu(); if (!buRaumAn()) lsSetzen(BU_ANSICHT, "raum"); if (BU.sicht !== "start") { BU.sicht = "start"; buZeigen(); } else if (!$("buInhalt")?.querySelector(".bu-raum") && BU.start) buZeigen(); }
function rgBueroEingang() { rgBueroAuf(); if (BU.sicht !== "eingang") { BU.sicht = "eingang"; buZeigen(); buEingangLaden(); } }
const rgBueroDw = () => (BU_EIN.korb?.dienstwuensche || [])[0] || null; // erste Dienstzeiten im Eingangskorb (Beispiel fürs Video)
function rgBueroVorab() { // Daten für die nächsten Fenster schon holen (nur lesen) – dann stehen sie sofort da
  const d = rgBueroDw(); if (!d) return;
  if (!RG.buDw || RG.buDw.id !== d.id) api("eingang_dienstwunsch", { id: d.id }).then((x) => { RG.buDw = x; }).catch(() => {});
  if (!RG.buAblage) api("eingang_ablage_ziele", { art: "dienstwunsch", id: d.id }).then((x) => { RG.buAblage = x; }).catch(() => {});
}
function rgBueroMitVorab(fn) { // Fenster mit den vorab geholten Daten öffnen (ohne erneutes Warten auf den Server)
  const a = api;
  api = (x, d, o) => x === "eingang_dienstwunsch" && RG.buDw ? Promise.resolve(RG.buDw) : x === "eingang_ablage_ziele" && RG.buAblage ? Promise.resolve(RG.buAblage) : a(x, d, o);
  try { fn(); } finally { api = a; }
}
function rgBueroPosten() { // Zeile „Dienstzeiten“ im Eingang antippen: das Auswahl-Fenster zeigen
  rgBueroEingang(); rgBueroZu("buEinBlatt"); rgBueroVorab();
  const d = rgBueroDw(), i = (BU_EIN.posten || []).findIndex((x) => d && x.auf === `ekDienstInfo('${d.id}')`);
  if (i >= 0 && !$("buEinBlatt")) buEinPosten(i);
  rgBueroSicht("buEinBlatt");
}
function rgBueroDwInfo() { rgBueroEingang(); rgBueroZu("ekDwBlatt"); const d = rgBueroDw(); if (d && !$("ekDwBlatt")) rgBueroMitVorab(() => ekDienstInfo(d.id)); rgBueroSicht("ekDwBlatt"); }
function rgBueroAblage() { rgBueroEingang(); rgBueroZu("ekAblageBlatt"); const d = rgBueroDw(); if (d && !$("ekAblageBlatt")) rgBueroMitVorab(() => ekAblage("dienstwunsch", d.id, "Erledigt – wo soll es abgelegt werden?")); rgBueroSicht("ekAblageBlatt"); }
function rgBueroHinweis() { // Hinweis beim Start nachgebildet – mit den Beispielzahlen aus der Hilfe; Knöpfe ohne Wirkung
  rgBueroAuf(); rgBueroZu("ekHinweisBlatt"); if ($("ekHinweisBlatt")) return;
  const l = [["📅", 5, "Dienstpläne"], ["💶", 1, "Kostenerstattung"], ["🙋", 1, "Hilfegesuch"]];
  blattAuf("ekHinweisBlatt", `<h3 style="margin:0">📥 Im Eingangskorb liegen 7 Sachen</h3>
    <p class="hinweis" style="margin:0">Für die Clubleitung. Antippen öffnet den Eingangskorb.</p>
    <div class="ekh-liste">${l.map(([sym, n, t]) => `<button type="button" class="ti-zeile">${sym} <span><b>${n}</b> ${t}</span><b>›</b></button>`).join("")}</div>
    <b>Möchtest du das jetzt bearbeiten?</b>
    <button class="knopf haupt">✅ Ja, jetzt bearbeiten</button><button class="knopf">⏰ Später</button><button class="knopf">🌙 Heute nicht mehr</button>`);
  rgBueroSicht("ekHinweisBlatt");
}
const rgBueroDatei = () => new File(["Beispiel"], "Spendenquittung.pdf", { type: "application/pdf" }); // nur im Speicher – wird nie hochgeladen
function rgBueroEinlesen() { rgBueroAuf(); rgBueroZu("einlBlatt"); if ($("einlBlatt")?.querySelector(".einl-wahl")) return; const s = spur; spur = () => {}; try { buEinlesen(); } finally { spur = s; } rgBueroSicht("einlBlatt"); }
function rgBueroWohin() { rgBueroAuf(); rgBueroZu("einlBlatt"); if (!$("einlBlatt")?.querySelector("[onclick='einlAblegen()']")) einlZiel([rgBueroDatei()], {}); rgBueroSicht("einlBlatt"); }
function rgBueroMail() { rgBueroAuf(); rgBueroZu("einlBlatt"); if ($("einlBlatt")?.querySelector(".em-mail")) return; if (!EINL) EINL = { dateien: [rgBueroDatei()], korbId: null, titel: "Spendenquittung" }; einlPerMail(); rgBueroSicht("einlBlatt"); }
function rgBueroSchilder(vorlage) {
  rgBueroAuf(); rgBueroZu("schBlatt");
  if (vorlage) { if (SDR.sicht !== "edit" || !$("schBlatt")) { if (!$("schBlatt")) schStart(); schVorlage(vorlage); } }
  else if (!$("schBlatt") || SDR.sicht !== "start") schStart();
  rgBueroSicht("schBlatt");
}
function rgBueroRkZu(id) { // Einstellungen als Rollkartei: nach dem Aufbauen zur richtigen Karte nachblättern
  for (const ms of [500, 1200]) setTimeout(() => { const e = $(id), z = RK.einst; if (RG.an && e && z?.an && z.karten[z.i] && !z.karten[z.i].contains(e)) rkZu(z, e); }, ms);
}
const rgBueroL = () => !!(ICH?.vorstand || ICH?.admin);
const RG_BUERO = [
  { v: "buero", vor: () => rgBueroRaum(), sel: ["#v-buero .bu-gruss", "#buInhalt"], video: "leitung", t: "🗂️ Büro im Alltag",
    x: "Dieses Video ist für die Clubleitung. Ich zeige dir, wie du im Büro den Alltag erledigst: den Eingangskorb, Bestätigungen für Dienstwünsche, Ablegen, Einlesen, E-Mail mit Anhang und die Schilder-Druckerei. Keine Sorge: Ich sende nichts und lege nichts ab." },
  { v: "buero", nur: () => BSPR.geht, vor: () => rgBueroRaum(), sel: ["#buInhalt .bu-mikro"], mussSel: true, puls: ["#buInhalt .bu-mikro"], t: "🎙️ Sag mir, was du brauchst",
    x: "Oben im Büro sitzt das Mikrofon: Sag mir, was du brauchst. Tipp darauf und sag zum Beispiel: Öffne Ordner Protokolle – oder Anrufen Erika. Das spart Tipperei, wenn es schnell gehen soll." },
  { v: "buero", nur: () => !!ICH?.vorstand, vor: () => rgBueroRaum(), sel: ["#buInhalt .bu-korb"], mussSel: true, puls: ["#buInhalt .bu-korb", "#buInhalt .bu-zettel.blau"], t: "📥 Der Eingangskorb",
    x: "Auf dem Schreibtisch steht der Eingangskorb. Daneben sagt dir der blaue Zettel Eingang, wie viele Sachen auf euch warten. Ein Tipp öffnet den Eingang." },
  { v: "buero", nur: rgBueroL, tippVor: "#buInhalt .bu-korb", vor: () => { rgBueroEingang(); rgBueroVorab(); }, sel: ["#buInhalt .bu-ein-zeile", "#buInhalt .ek-kopf"], puls: ["#buInhalt .bu-ein-zeile"], t: "📋 Was im Eingang liegt",
    x: "Im Eingang liegt alles, was für die Clubleitung neu hereinkommt: Erstattungen, Dienstzeiten, Vorschläge, Änderungsmeldungen, Ausleihen und mehr. Clubsprecher, Kassenwart und Admin bekommen dazu eine Meldung. Es bleibt hier, bis es erledigt ist." },
  { v: "buero", nur: rgBueroL, vor: () => { rgBueroEingang(); rgBueroVorab(); }, sel: ["#buInhalt .ek-kopf"], mussSel: true, puls: ["#buInhalt .ek-kopf .pr-filter-knopf"], t: "🔽 Filter und Übersicht",
    x: "Oben rechts zwei Knöpfe: Das Balkendiagramm zeigt alle Dienstzeiten als Übersicht – Name, Tage, Zeitbalken und Stunden –, zum Drucken und Ablegen. Mit dem Knopf daneben filterst du den Eingang nach Jahr, Monat, Art und Name." },
  { v: "buero", nur: () => rgBueroL() && !!rgBueroDw(), tippVor: () => [...document.querySelectorAll("#buInhalt .bu-ein-zeile")].find((b) => /Dienstzeiten/.test(b.textContent)) || null,
    vor: () => rgBueroPosten(), sel: ['#buEinBlatt .blatt-innen > div[style*="grid"]', "#buEinBlatt"], puls: ["#buEinBlatt .knopf"], t: "👆 Eine Sache antippen",
    x: "Tippst du eine Sache an – zum Beispiel neue Dienstzeiten –, siehst du, was du tun kannst: Öffnen und bearbeiten, Zur Kenntnis genommen, Ablegen – oder gleich zum passenden Ordner." },
  { v: "buero", nur: () => rgBueroL() && !!rgBueroDw(), tippVor: "#buEinBlatt .knopf.haupt", vor: () => rgBueroDwInfo(), sel: ['#ekDwBlatt [data-fn^="ekDwBestaetigung"]', "#ekDwBlatt .blatt-innen"],
    puls: ['#ekDwBlatt [data-fn^="ekDwBestaetigung"]'], t: "📧 Bestätigung per Knopf",
    x: "Mit Öffnen und bearbeiten siehst du die Dienstzeiten Tag für Tag. Darunter schickst du dem Mitglied mit einem Knopf die Bestätigung: Es bekommt alle Eingaben per E-Mail und App-Nachricht – mit dem Hinweis: Wunschplanung, noch nicht der fertige Dienstplan. In Kopie gehen Clubsprecher und Kassenwart, in Blindkopie du. Vorher fragt die App noch einmal nach." },
  { v: "buero", nur: () => rgBueroL() && !!rgBueroDw(), vor: () => rgBueroDwInfo(), sel: ['#ekDwBlatt [data-fn^="ekKenntnis"]', "#ekDwBlatt .blatt-innen"], puls: ['#ekDwBlatt [data-fn^="ekKenntnis"]', '#ekDwBlatt [data-fn^="ekAblage"]'], t: "👁️ Zur Kenntnis genommen",
    x: "Hast du alles gesehen, tippst du auf Zur Kenntnis genommen. Dann ist es erledigt. Ändert das Mitglied seine Zeiten, liegt es wieder im Eingang." },
  { v: "buero", nur: () => rgBueroL() && !!rgBueroDw(), vor: () => rgBueroAblage(), sel: ["#ekAblageBlatt .ek-ordner", "#ekAblageBlatt label.schalter", "#ekAblageBlatt"], puls: ["#ekAblageBlatt label.schalter", "#ekAblageBlatt .ek-ordner", "#ekAblegenKnopf"], t: "🗄️ In mehrere Ordner ablegen",
    x: "Danach fragt die App: Wo ablegen? Setz einfach Häkchen – mehrere gehen: im Ordner des Mitglieds, in unseren Club-Ordnern mit passendem Register oder in deinem eigenen Ordner. Die App merkt sich deine Wahl fürs nächste Mal. Ich lege hier nichts ab." },
  { v: "start", nur: rgBueroL, vor: () => rgBueroHinweis(), nach: () => $("ekHinweisBlatt") && fensterZu($("ekHinweisBlatt")), sel: ["#ekHinweisBlatt .ekh-liste", "#ekHinweisBlatt"], mussSel: true, puls: ["#ekHinweisBlatt .ti-zeile", "#ekHinweisBlatt .knopf"], t: "🔔 Viel im Eingang?",
    x: "Liegen mehr als fünf Sachen im Eingangskorb, zeigt dir die App beim Start eine kleine Liste – zum Beispiel fünf Dienstpläne, eine Kostenerstattung, ein Hilfegesuch. Eine Zeile öffnet den Eingangskorb gleich mit dieser Art. Darunter: Ja, jetzt bearbeiten, Später oder Heute nicht mehr." },
  { v: "einstellungen", nur: rgBueroL, vor: () => { rgAuf("leitung_start"); rgBueroRkZu("leitungStart"); }, sel: [rgKlappe("leitung_start")], mussSel: true, t: "⚙️ Hinweis ausschalten",
    x: "Ganz ausschalten – zusammen mit der Tages-Übersicht beim Start – kannst du das unter Mehr, im Bereich Clubleitung beim Start. Das gilt für dieses Gerät." },
  { v: "buero", nur: () => buSchreiben(), vor: () => { rgBueroRaum(); rgBueroEinlesen(); }, sel: ["#einlBlatt .einl-wahl", "#einlBlatt"], mussSel: true, puls: ["#einlBlatt .einl-wahl > *", "#einlZiehen"], t: "📥 Dokumente einlesen",
    x: "Mit Einlesen holst du Unterlagen ins Büro: Foto machen, Datei wählen, am PC einfach hineinziehen – oder unter Aus Eingangskorb oder Eingang etwas nehmen, zum Beispiel eine Erstattung oder eine Änderungsmeldung." },
  { v: "buero", nur: () => buSchreiben(), vor: () => rgBueroWohin(), sel: ["#einlBlatt .knoepfe", "#einlBlatt"], mussSel: true, puls: ["#einlBlatt .knoepfe .knopf:not(:last-child)"], t: "📄 Wohin damit?",
    x: "Danach fragt die App: Wohin damit? In einen Ordner ablegen – mit Vorschlag –, in den Eingangskorb, um es später zu erledigen, als Nachricht in der App oder per E-Mail mit Anhang." },
  { v: "buero", nur: () => buSchreiben(), tippVor: rgOn("einlPerMail()"), vor: () => rgBueroMail(), sel: ["#emListe", "#einlBlatt"], puls: ["#emSuche", "#emListe .chip"], t: "📧 Per E-Mail mit Anhang",
    x: "Bei Per E-Mail mit Anhang hängt die Datei schon dran. Bei jedem Namen tippst du An, CC – eine Kopie, die alle sehen – oder BCC – eine Blindkopie, die die anderen nicht sehen. Oben den Namen eintippen geht schneller." },
  { v: "buero", nur: () => buSchreiben(), vor: () => rgBueroMail(), sel: ["#emSenden", "#einlBlatt"], puls: ["#emBetreff", "#emText", "#emKopie", "#emSenden"], t: "✉️ Betreff, Text und senden",
    x: "Dann den Betreff prüfen, einen Text dazuschreiben – er kann auch leer bleiben –, Kopie an mich ankreuzen und auf Jetzt senden tippen. Ich sende hier nichts." },
  { v: "buero", nur: () => buSchreiben(), vor: () => rgBueroMail(), sel: [rgOn("einlPerMailExtern()"), "#einlBlatt"], puls: [rgOn("einlPerMailExtern()")], t: "📤 Adresse außerhalb des Clubs",
    x: "Soll die Mail an jemanden außerhalb des Clubs, nimmst du Anderes Mail-Programm – dann öffnet sich das Teilen-Menü deines Handys." },
  { v: "buero", nur: () => schDarf(), vor: () => { rgBueroRaum(); rgBueroSchilder(); }, sel: ["#schBlatt .sdr-anlaesse", "#schBlatt"], mussSel: true, puls: ["#schBlatt .sdr-anlaesse .knopf"], t: "🪧 Die Schilder-Druckerei",
    x: "Für Feste und Stände gibt es die Schilder-Druckerei – im Büro über den Füller bei Schild drucken. Zuerst wählst du den Anlass: Weihnachtsmarkt, Feste und Feiern, Kochabend und Kurs, Vereinsheim oder Allgemein." },
  { v: "buero", nur: () => schDarf(), vor: () => rgBueroSchilder(), sel: ['#schBlatt [onclick="schVorlage(\'bar\')"]', "#schBlatt .sdr-vorlagen"], mussSel: true,
    puls: ['#schBlatt [onclick="schVorlage(\'bar\')"]', '#schBlatt [onclick="schVorlage(\'parken\')"]', '#schBlatt [onclick="schVorlage(\'durchgang\')"]'], t: "📋 Eine Vorlage wählen",
    x: "Dann tippst du eine Vorlage an – zum Beispiel Nur Barzahlung, Bitte nicht parken oder Durchgang bitte freihalten. Je nach Anlass gibt es viele weitere." },
  { v: "buero", nur: () => schDarf(), tippVor: '#schBlatt [onclick="schVorlage(\'bar\')"]', vor: () => rgBueroSchilder("bar"), sel: ["#schBlatt .sdr-vorschau", "#schBlatt"], mussSel: true, t: "🪧 So sieht das Schild aus",
    x: "Oben siehst du das Schild so, wie es gedruckt wird. Jede Änderung siehst du hier sofort." },
  { v: "buero", nur: () => schDarf(), vor: () => rgBueroSchilder("bar"), sel: [() => $("schText")?.closest(".sdr-feld"), "#schBlatt"], mussSel: true, puls: ["#schTitel", "#schText", "#schBlatt .sdr-stil"], t: "✏️ Text ändern",
    x: "Darunter änderst du die Überschrift und den Text. F, K und U machen fett, kursiv oder unterstrichen." },
  { v: "buero", nur: () => schDarf(), vor: () => rgBueroSchilder("bar"), sel: ["#schBlatt .sdr-aussehen", "#schBlatt"], mussSel: true, puls: ["#schBlatt .sdr-aussehen > summary", "#schBlatt .sdr-aussehen > label"], t: "🎨 Das Aussehen",
    x: "Unter Aussehen wählst du Format, Schrift, Farbe, Rahmen und ein Symbol." },
  { v: "buero", nur: () => schDarf(), vor: () => rgBueroSchilder("bar"), sel: ["#schBlatt .sdr-leiste", "#schBlatt"], mussSel: true, puls: ["#schBlatt .sdr-leiste .knopf"], t: "🖨️ Drucken, Speichern, Senden",
    x: "Unten: Drucken. Speichern hebt das Schild auf – nächstes Jahr öffnest du es wieder. Und Senden und Ablegen schickt es an Mitglieder, die es zuhause drucken – praktisch am Stand ohne Drucker –, per E-Mail oder in den Büro-Ordner. Hier speichere und sende ich nichts." },
  { v: "buero", vor: () => rgBueroRaum(), t: "✅ Fertig",
    x: "Das war das Büro im Alltag: Eingang ansehen, Bestätigung schicken, zur Kenntnis nehmen und in mehrere Ordner ablegen, Dokumente einlesen und per E-Mail verschicken – und Schilder drucken. Angezeigt wird immer nur, was du darfst." },
];

// ---------- 2.348.0 KC-CLUB-VIDEO-ERGAENZUNGEN (Wunsch Hansi „für alle Themen Videos“): Dienst + Mitglieder ----------
// 2.348.0 KC-CLUB-VIDEO-ERGAENZUNGEN: zusätzliche Stationen für bestehende Videos. Je Objekt steht davor, NACH welcher vorhandenen
// Station (Titel t) es eingefügt wird. Stehen zwei Ergänzungen hinter derselben Station, kommen sie in der hier stehenden Reihenfolge.
// Nur gezeigt – es wird nichts gesendet, gespeichert oder bestätigt; alles wird am Ende zurückgestellt (RG.zurueck / nach()).

// ---------- (a) RG_DIENST: Dienstwünsche mit „Fertig“ abschließen, leeren Wunschbogen drucken oder mailen ----------
// 2.348.0 KC-CLUB-VIDEO-DIENST-2: Fenster „📝 Dienstwünsche“ nur als Rahmen zeigen – Twinkey (iframe) wird nicht geladen, damit nichts
// spricht oder fragt; die Fertig-Leiste ist nur zu sehen (der Overlay fängt jedes Tippen ab). Am Ende: Fenster zu, DWB wie vorher.
function rgDienstErgFenster() {
  if (!$("dwFenster")) {
    const alt = { ...DWB }; $("mdBlatt") && fensterZu($("mdBlatt"));
    dwOeffnen(); const f = $("dwFenster"); f.querySelector("iframe")?.remove(); f.querySelector(".warten")?.remove(); f.inert = true;
    RG.zurueck.push(() => { $("wbBlatt")?.remove(); dwSchliessen(); Object.assign(DWB, alt); });
  }
  return $("dwFenster");
}
function rgDienstErgZu() { if ($("dwFenster")) { $("wbBlatt")?.remove(); dwSchliessen(); } }
function rgDienstErgLeiste() { rgDienstErgFenster(); if (!$("dwFertigLeiste")) { const b = DWB.bestaetigt; DWB.bestaetigt = false; dwFertigLeiste(14); DWB.bestaetigt = b; } }
// 2.348.0 KC-CLUB-VIDEO-DIENST-2: Fenster „Dein leerer Wunschbogen“ zeigen (ohne echten Bogen – Vorschau-Hinweis statt PDF); WB wie vorher
function rgDienstErgBogen() {
  rgDienstErgFenster(); $("dwFertigLeiste")?.remove();
  if ($("wbBlatt")) return $("wbBlatt").classList.add("rg-zeigen");
  const alt = { pdf: WB.pdf, name: WB.name, bilder: WB.bilder, lauf: WB.lauf };
  const p = wbAntwort({ art: "wunschbogen-fertig", bytes: new Uint8Array([0]), name: "Wunschbogen.pdf" });
  const f = $("wbBlatt"); if (f) { f.classList.add("rg-zeigen"); f.inert = true; }
  const hinweis = () => { if ($("wbSeiten")) $("wbSeiten").innerHTML = '<p class="hinweis">Hier erscheint die Vorschau deines Bogens.</p>'; };
  hinweis(); Promise.resolve(p).catch(() => {}).finally(hinweis);
  RG.zurueck.push(() => { $("wbBlatt")?.remove(); Object.assign(WB, alt); });
}

const RG_DIENST_ERG = [
  // NACH: "📝 Wünsche eintragen"
  { v: "start", vor: () => rgDienstErgFenster(), nach: () => { if (RG.richtung < 0) rgDienstErgZu(); }, sel: ["#dwFenster .dw-kopf"], puls: ['#dwFenster [data-k="fertig"]'], t: "✅ Mit Fertig abschließen",
    x: "Bist du mit deinen Wünschen durch, tippst du oben rechts auf Fertig. Dann bekommst du eine Bestätigung mit der Zusammenfassung per E-Mail. Das ist deine Wunschplanung – noch nicht der fertige Dienstplan." },
  // NACH: "📝 Wünsche eintragen" (direkt nach der vorigen Ergänzung)
  { v: "start", vor: () => rgDienstErgLeiste(), sel: ["#dwFertigLeiste", "#dwFenster"], puls: ['#dwFertigLeiste [data-k="mail"]', '#dwFertigLeiste [data-k="spaeter"]'], t: "☝️ Fertig ist Pflicht",
    x: "Sind alle Tage eingetragen, erscheint unten Fertig – damit schließt du ab. Mit Abbrechen änderst du vorher noch etwas." },
  // NACH: "📝 Wünsche eintragen" (direkt nach der vorigen Ergänzung)
  { v: "start", vor: () => { rgDienstErgFenster(); $("dwFertigLeiste")?.remove(); }, sel: ['#dwFenster [data-k="zu"]'], t: "↩️ Zurück ohne Fertig?",
    x: "Gehst du mit Zurück hinaus, ohne abzuschließen, fragt die App nach: Fertig – oder Abbrechen, dann geht es zurück in die Eingabe. Klappt der Versand einmal nicht, zum Beispiel ohne Netz, kannst du trotzdem gehen." },
  // NACH: "📝 Wünsche eintragen" (direkt nach der vorigen Ergänzung)
  { v: "start", vor: () => { rgDienstErgFenster(); $("dwFertigLeiste")?.remove(); $("wbBlatt")?.remove(); }, sel: ['#dwFenster [data-k="bogen"]'], t: "🖨️ Leerer Wunschbogen",
    x: "Lieber auf Papier? Oben mit Bogen bekommst du deinen persönlichen, leeren Wunschbogen – mit deinem Namen und oben rechts einem QR-Code mit deiner Mitglieds-ID." },
  // NACH: "📝 Wünsche eintragen" (direkt nach der vorigen Ergänzung)
  { v: "start", tippVor: '#dwFenster [data-k="bogen"]', vor: () => rgDienstErgBogen(), nach: () => rgDienstErgZu(), sel: ["#wbBlatt .wb-knoepfe", "#wbBlatt .blatt-innen"], puls: ["#wbDrucken", '#wbBlatt [onclick^="wbMailen"]'], t: "✉️ Drucken oder mailen",
    x: "Mit Drucken druckst du ihn aus. Kein Drucker da? Dann tippst du auf Per E-Mail an mich – der Bogen kommt als PDF in dein Postfach. Danach von Hand ausfüllen und die Zeiten mit Twinkey eintragen. Ich schicke hier nichts." },
];

// ---------- (b) RG_MITGLIEDER: Wer ist online, Anwesenheitstafel, Geburtstagsgrüße ----------
// 2.348.0 KC-CLUB-VIDEO-MITGLIEDER-2: Ansicht nur vorführen (mgAnsichtSetzen würde sie merken und melden) – danach wie vorher
function rgMitgliederErgAnsicht(a) {
  if (RG.mgAnsichtAlt === undefined || RG.mgAnsichtAlt === null) { RG.mgAnsichtAlt = MG_ANSICHT; RG.zurueck.push(() => rgMitgliederErgAnsicht(null)); }
  const ziel = a || RG.mgAnsichtAlt; if (!a) RG.mgAnsichtAlt = null;
  if (MG_ANSICHT === ziel) return;
  MG_ANSICHT = ziel; mgAnsichtWahlZeigen(); if (MITGLIEDER && aktuelleAnsicht === "mitglieder") mitgliederZeichnen();
}
// 2.348.0 KC-CLUB-VIDEO-MITGLIEDER-2: Beispiel-Geburtstag – nur, wenn heute niemand Geburtstag hat; nur auf dem Bildschirm (INIT wird zurückgestellt).
// Die Startseite lädt beim Öffnen neu (neuLaden ersetzt INIT) – danach wird das Beispiel noch einmal eingesetzt.
function rgMitgliederErgGeburtstag() {
  if (!INIT) return;
  const s = RG.st[RG.i];
  const anwenden = () => {
    if (!RG.an || !INIT || RG.mgGb?.init === INIT) return;
    if ((INIT.geburtstageHeute || []).some((g) => g.person_id !== ICH?.person_id)) return; // echter Geburtstag → den zeigen
    const m = (MITGLIEDER || []).find((x) => x.person_id !== ICH?.person_id); if (!m) return;
    if (!RG.mgGb) RG.zurueck.push(rgMitgliederErgGeburtstagZu);
    RG.mgGb = { init: INIT, alt: INIT.geburtstageHeute };
    INIT.geburtstageHeute = [...(INIT.geburtstageHeute || []), { person_id: m.person_id, name: m.name, vorname: m.vorname || String(m.name || "").split(" ")[0] }];
    if (aktuelleAnsicht === "mitglieder") mitgliederZeichnen(); wichtigZeigen(); $("wichtig").inert = true;
  };
  anwenden();
  const lauf = NEU_LADEN_FOLGE || NEU_LADEN_LAUF;
  if (lauf) lauf.catch(() => {}).then(() => setTimeout(() => { if (!RG.an || RG.st[RG.i] !== s) return; anwenden(); RG.ziel = rgZiel(s) || RG.ziel; rgHin(); rgLage(); rgPulsStart(s); }, 80));
}
function rgMitgliederErgGeburtstagZu() { // Beispiel-Geburtstag wieder weg (nach der Station und beim Ende; doppelt schadet nicht)
  const a = RG.mgGb; if (!a) return; RG.mgGb = null;
  if (a.init === INIT) INIT.geburtstageHeute = a.alt;
  $("wichtig").inert = false; if (INIT) wichtigZeigen(); if (aktuelleAnsicht === "mitglieder" && MITGLIEDER) mitgliederZeichnen();
}
const rgMitgliederErgKerze = () => [...document.querySelectorAll("#mitgliederListe .gb-kerze")].find(rgSichtbar)?.closest(".mg-kachel, .zeile, button, .rk-karte") || null;
const rgMitgliederErgGratZeile = () => [...document.querySelectorAll("#wichtig .zeile")].find((z) => /gratulieren\(/.test(z.getAttribute("onclick") || "")) || null;

const RG_MITGLIEDER_ERG = [
  // NACH: "📞 Schreiben, anklopfen, anrufen"
  { v: "mitglieder", vor: () => rgMitgliederErgAnsicht("kacheln"), sel: ["#mgFilter"], puls: ["#mgFilter > .zk", '#mgFilter [data-f="online"]', '#mgFilter [data-f="alle"]'], t: "🟢 Wer ist gerade online?",
    x: "Oben bei Zeigen schaltest du zwischen Alle und Online um. Online zeigt nur, wer gerade in der App ist – die Zahl dahinter sagt, wie viele. Ein grüner Punkt heißt: gerade da – ein guter Moment für eine kurze Nachricht. Wer seine Online-Anzeige verbirgt, sieht auch die anderen nicht online." },
  // NACH: "📞 Schreiben, anklopfen, anrufen" (direkt nach der vorigen Ergänzung)
  { v: "mitglieder", tippVor: () => rgSichtbarer('#mgAnsichtOben [data-a="tafel"]')() || rgSichtbarer("#mgAnsichtOben > .zk")(), vor: () => rgMitgliederErgAnsicht("tafel"), nach: () => rgMitgliederErgAnsicht(null), sel: ["#mitgliederListe .mg-tafel", "#mitgliederListe"],
    puls: ["#mgAnsichtOben > .zk", '#mgAnsichtOben [data-a="tafel"]', "#mitgliederListe .mg-tafel .mg-led"], t: "📋 Die Anwesenheitstafel",
    x: "Oben bei Ansicht kannst du auch auf Anwesenheit umschalten. Die Anwesenheitstafel zeigt nur Namen und ein Lämpchen – wer online ist, steht oben. Einen Namen antippen öffnet das Mitglied; dort kannst du schreiben, anklopfen oder anrufen." },
  // NACH: "🍳 Gruppen"
  { v: "mitglieder", vor: () => { rgMitgliederErgAnsicht("kacheln"); rgMitgliederErgGeburtstag(); }, sel: [rgMitgliederErgKerze], mussSel: true, t: "🎂 Wer hat Geburtstag?",
    x: "Hat jemand Geburtstag, steht bei seinem Namen eine kleine Torte mit Kerze – so wie hier als Beispiel. Deinen eigenen Geburtstag sehen die anderen nur, wenn du es in den Einstellungen unter Privatsphäre erlaubst." },
  // NACH: "🍳 Gruppen" (direkt nach der vorigen Ergänzung)
  { v: "start", vor: () => rgMitgliederErgGeburtstag(), nach: () => rgMitgliederErgGeburtstagZu(), sel: [rgMitgliederErgGratZeile], mussSel: true, puls: [() => rgMitgliederErgGratZeile()?.querySelector("button")], t: "💬 Gratulieren mit einem Tipp",
    x: "Auf der Startseite steht es unter Heute wichtig. Ein Tipp auf Gratulieren öffnet den Chat mit dem Geburtstagskind – der Glückwunsch Alles Gute zum Geburtstag steht schon da, du musst nur noch senden." },
];
// Ergänzungen an der richtigen Stelle einsetzen (nach der Station mit diesem Titel; mehrere in der Reihenfolge der Liste)
function rgMitErg(basis, erg, nach) { // setzt direkt in die Liste ein (die Registry bleibt unverändert)
  const l = basis, gruppen = new Map();
  erg.forEach((x, i) => { if (!gruppen.has(nach[i])) gruppen.set(nach[i], []); gruppen.get(nach[i]).push(x); });
  for (const [titel, xs] of gruppen) { const j = l.findIndex((x) => x.t === titel); if (j >= 0) l.splice(j + 1, 0, ...xs); else l.push(...xs); }
  return l;
}
rgMitErg(RG_DIENST, RG_DIENST_ERG, ["📝 Wünsche eintragen", "📝 Wünsche eintragen", "📝 Wünsche eintragen", "📝 Wünsche eintragen", "📝 Wünsche eintragen"]);
rgMitErg(RG_MITGLIEDER, RG_MITGLIEDER_ERG, ["📞 Schreiben, anklopfen, anrufen", "📞 Schreiben, anklopfen, anrufen", "🍳 Gruppen", "🍳 Gruppen"]);
const RG_THEMEN_AB = 9; // ab so vielen sichtbaren Videos: Themen-Kacheln statt einer langen Liste
const RGL = { thema: null, wahl: new Set() };
const rgSichtbareVideos = () => RUNDGAENGE.filter((r) => !r.nur || r.nur());
function rgThemenListe() {
  const da = rgSichtbareVideos(), bekannt = new Set(RG_THEMEN.flatMap((t) => t.videos));
  const themen = RG_THEMEN.map((t) => ({ ...t, liste: t.videos.map((id) => da.find((r) => r.id === id)).filter(Boolean) }));
  themen.push({ id: "weitere", sym: "✨", t: "Weitere", liste: da.filter((r) => !bekannt.has(r.id)) });
  return themen.filter((t) => t.liste.length);
}
function erklaerVideos(thema) {
  RGL.thema = thema === undefined ? null : thema;
  if (!$("rgListeBlatt")) for (const id of rgvSpaeter()) RGL.wahl.add(id); // 2.346.0: „Später“ gemerkte Videos sind schon angehakt
  const f = $("rgListeBlatt") || blattAuf("rgListeBlatt", `<div id="rgListe"></div>`);
  f.classList.add("rgl-blatt"); rgListeZeigen();
}
function rgListeZeigen() {
  const z = $("rgListe"); if (!z) return;
  const da = rgSichtbareVideos(), themen = rgThemenListe(), mitKacheln = da.length >= RG_THEMEN_AB;
  for (const id of [...RGL.wahl]) if (!da.some((r) => r.id === id)) RGL.wahl.delete(id);
  const t = mitKacheln && RGL.thema ? themen.find((x) => x.id === RGL.thema) : null;
  if (mitKacheln && RGL.thema && !t) RGL.thema = null;
  const zeile = (r) => { const an = RGL.wahl.has(r.id);
    return `<div class="rgl-zeile${an ? " an" : ""}"><label class="rgl-haken"><input type="checkbox" ${an ? "checked" : ""} onchange="rgWahl('${r.id}', this.checked)" aria-label="${esc(r.t)} anhaken">
      <span class="rgl-sym" aria-hidden="true">${r.sym}</span><span><b>${rgvSpaeter().includes(r.id) ? `<span title="Später ansehen – gemerkt">📌 </span>` : ""}${esc(r.t)}</b><small>${esc(r.u)}</small></span></label>${rgGesehenHtml(r.id)}
      <button type="button" class="knopf klein" onclick="rgListeAbspielen(['${r.id}'])" aria-label="${esc(r.t)} jetzt abspielen">▶</button></div>`; };
  const n = RGL.wahl.size;
  let inhalt;
  if (mitKacheln && !t) {
    inhalt = `<p class="hinweis" style="margin:0 0 10px">Tippe ein Thema an. Hake die Videos an, die du sehen möchtest – sie laufen dann nacheinander.</p>
      <div class="rgl-kacheln">${themen.map((x) => { const gew = x.liste.filter((r) => RGL.wahl.has(r.id)).length;
        const ges = x.liste.filter((r) => rgGesehen()[r.id]?.n).length;
        return `<button type="button" class="rgl-kachel" onclick="erklaerVideos('${x.id}')"><span class="rgl-ksym" aria-hidden="true">${x.sym}</span><b>${esc(x.t)}</b>
          <small>${x.liste.length} ${x.liste.length === 1 ? "Video" : "Videos"}</small><small class="rgl-kgesehen${ges === x.liste.length ? " alle" : ""}">${ges ? `✓ ${ges} von ${x.liste.length} angesehen` : "👁 noch nicht angesehen"}</small>${gew ? `<span class="rgl-zahl" aria-label="${gew} angehakt">✓ ${gew}</span>` : ""}</button>`; }).join("")}</div>
      <button type="button" class="knopf klein" style="margin-top:10px" onclick="rgWahlAlle(${da.every((r) => RGL.wahl.has(r.id)) ? "false" : "true"})">${da.every((r) => RGL.wahl.has(r.id)) ? "☐ Alle abwählen" : `☑️ Alle ${da.length} Videos anhaken`}</button>`;
  } else {
    const liste = t ? t.liste : da, alleAn = liste.every((r) => RGL.wahl.has(r.id));
    inhalt = `${t ? `<button type="button" class="knopf klein" onclick="erklaerVideos(null)">‹ Alle Themen</button><h4 style="margin:10px 0 4px">${t.sym} ${esc(t.t)} · ${t.liste.length} ${t.liste.length === 1 ? "Video" : "Videos"}</h4>` : ""}
      ${liste.length > 1 ? `<button type="button" class="knopf klein" onclick="rgWahlAlle(${alleAn ? "false" : "true"})">${alleAn ? "☐ Alle abwählen" : "☑️ Alle anhaken"}</button>` : ""}
      <div class="rgl-liste">${liste.map(zeile).join("")}</div>`;
  }
  z.innerHTML = `<h3 style="margin-top:0">🎬 Erklär-Videos – mit Ton</h3>${inhalt}
    <div class="rgl-fuss"><button type="button" class="knopf haupt" ${n ? "" : "disabled"} onclick="rgListeAbspielen()">▶ ${n ? `${n} angehakte${n === 1 ? "s Video" : " Videos"} nacheinander abspielen` : "Erst Videos anhaken"}</button>
      ${n ? `<button type="button" class="knopf klein" onclick="RGL.wahl.clear();rgListeZeigen()">✕ Häkchen weg</button>` : ""}
      ${ICH?.admin ? `<button type="button" class="knopf klein" onclick="$('rgListeBlatt').remove();rgAuswertung()">📊 Auswertung der Videos</button>` : ""}
      <button type="button" class="knopf klein" onclick="stimmenWahl()">🗣️ Stimme &amp; Tempo</button>
      <button type="button" class="knopf klein" onclick="$('rgListeBlatt').remove()">Schließen</button></div>
    <label class="rgl-verweis"><input type="checkbox" ${rgvAus() ? "" : "checked"} onchange="rgvAn(this.checked)"> 🎬 In Videos fragen, wenn es zum Thema ein eigenes Video gibt</label>`;
}
function rgvAn(an) { try { if (an) localStorage.removeItem(RGV.AUS); else localStorage.setItem(RGV.AUS, "1"); } catch {} RGV.gefragt.clear(); melde(an ? "🎬 Ich frage wieder, wenn es ein eigenes Video gibt." : "🔕 Ich frage in den Videos nicht mehr nach."); }
function rgWahl(id, an) { if (an) RGL.wahl.add(id); else RGL.wahl.delete(id); rgListeZeigen(); }
function rgWahlAlle(an) {
  const t = RGL.thema ? rgThemenListe().find((x) => x.id === RGL.thema) : null;
  for (const r of t ? t.liste : rgSichtbareVideos()) if (an) RGL.wahl.add(r.id); else RGL.wahl.delete(r.id);
  rgListeZeigen();
}
// Reihenfolge wie in den Themen (Einstieg zuerst), nicht wie angetippt
function rgListeAbspielen(ids) {
  const reihe = rgThemenListe().flatMap((t) => t.liste.map((r) => r.id)), wahl = ids || reihe.filter((id) => RGL.wahl.has(id));
  if (!wahl.length) return;
  $("rgListeBlatt")?.remove(); if (!ids) RGL.wahl.clear();
  rundgangStart(false, wahl[0], wahl.slice(1));
}
// Vorführung (demo) einer Station: nur anzeigen, nie speichern; alles, was die Station nicht vorführt, wird zurückgestellt
function rgDemo(d = {}) {
  const w = document.documentElement;
  if (d.gross) w.dataset.rgGross = "1"; else delete w.dataset.rgGross;
  if (d.design || d.nacht) { const alt = window.__rgDsAlt = window.__rgDsAlt || DS; DS = { ...alt, design: d.design || alt.design, modus: d.nacht ? "nacht" : alt.modus }; anwendenDesign(); }
  else { if (window.__rgDsAlt) { DS = window.__rgDsAlt; window.__rgDsAlt = null; } anwendenDesign(); }
}
const rgZiel = (s) => (s.sel || []).flatMap((q) => { try { return typeof q === "function" ? [q()].filter(Boolean) : [...document.querySelectorAll(q)]; } catch { return []; } }).find(rgSichtbar) || null;
const rgText = (s) => (typeof s.x === "function" ? s.x() : s.x);
// ---------- KC-CLUB-VIDEO-LIVE (2.261.0, Wunsch Hansi „Aktionen live zeigen – Kachel umdrehen, Register verschieben usw. – bei allen Videos“) ----------
// Ein Zeigefinger macht vor, was erklärt wird: hinfahren, tippen (Kreis), doppelt tippen, lange drücken, ziehen (mit Abbild), wischen.
// Station: tippVor = Wähler/Funktion → der Finger tippt das Element in der alten Ansicht an, DANN baut sich die Station auf (Ursache → Wirkung);
// live = async (L) => { … } läuft während der Erzählung (L.tipp, L.ziehen, L.wischen, L.warte); das Weiterblättern wartet, bis sie fertig ist.
// Nur Vorführung: ausgelöst werden ausschließlich die Vorführ-Funktionen des Videos (nichts gespeichert). Abbruch bei jedem Stationswechsel.
const RG_ABBRUCH = Symbol("rg-abbruch");
const rgFwarte = (ms, tok) => new Promise((ok, nein) => setTimeout(() => (tok === RG.liveTok && RG.an ? ok() : nein(RG_ABBRUCH)), ms));
function rgFinger() {
  let f = $("rgFinger");
  if (!f) { document.body.insertAdjacentHTML("beforeend", '<div id="rgFinger" class="rg-finger" aria-hidden="true"><span>👆</span></div>'); f = $("rgFinger"); RGF.x = innerWidth * 0.7; RGF.y = innerHeight + 40; f.style.transform = `translate(${RGF.x}px,${RGF.y}px)`; }
  f.classList.add("an"); return f;
}
const RGF = { x: 0, y: 0 };
function rgFingerWeg() { $("rgFinger")?.classList.remove("an"); $("rgGeist")?.remove(); document.querySelectorAll(".rg-gedrueckt").forEach((e) => e.classList.remove("rg-gedrueckt")); }
async function rgFzu(x, y, ms, tok) {
  const f = rgFinger(), von = `translate(${RGF.x}px,${RGF.y}px)`, nach = `translate(${x}px,${y}px)`;
  RGF.x = x; RGF.y = y; f.style.transform = nach;
  try { f.animate([{ transform: von }, { transform: nach }], { duration: ms, easing: "cubic-bezier(.4,.1,.2,1)" }); } catch {}
  await rgFwarte(ms, tok);
}
async function rgFpunkt(el, tok) { // Element ins Bild holen und seine Mitte liefern
  if (!rgSichtbar(el)) throw RG_ABBRUCH;
  if (!rgImBild(el)) { el.scrollIntoView({ block: "center", behavior: "instant" }); await rgFwarte(250, tok); }
  rgLage(); // Tafel aus dem Weg (Ziel kann sich seit dem Hinblättern verschoben haben)
  const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
}
function rgFring(x, y, gross) {
  const k = document.createElement("div"); k.className = "rg-tippring"; k.style.left = x + "px"; k.style.top = y + "px"; document.body.appendChild(k);
  try { k.animate([{ transform: "translate(-50%,-50%) scale(.2)", opacity: .95 }, { transform: `translate(-50%,-50%) scale(${gross ? 3 : 2})`, opacity: 0 }], { duration: gross ? 900 : 520, easing: "ease-out" }); } catch {}
  setTimeout(() => k.remove(), gross ? 950 : 600);
}
function rgFdruck(an) { const f = $("rgFinger"); f?.classList.toggle("drueckt", !!an); }
// tippen: einfach, doppelt oder lang (Element zeigt sich gedrückt)
async function rgFtipp(el, tok, art = "") {
  const p = await rgFpunkt(el, tok); await rgFzu(p.x, p.y, 650, tok); await rgFwarte(150, tok);
  const mal = art === "doppelt" ? 2 : 1;
  for (let i = 0; i < mal; i++) {
    rgFdruck(true); el.classList.add("rg-gedrueckt"); rgFring(p.x, p.y, art === "lang");
    await rgFwarte(art === "lang" ? 800 : 140, tok); rgFdruck(false); el.classList.remove("rg-gedrueckt"); if (i < mal - 1) await rgFwarte(110, tok);
  }
  await rgFwarte(200, tok);
}
// ziehen: lange drücken, Abbild hängt am Finger, zum Ziel tragen, loslassen
async function rgFziehen(el, ziel, tok) {
  const a = await rgFpunkt(el, tok), b = ziel.getBoundingClientRect ? ziel.getBoundingClientRect() : ziel;
  await rgFzu(a.x, a.y, 650, tok); rgFdruck(true); rgFring(a.x, a.y, true); el.classList.add("rg-gedrueckt"); await rgFwarte(700, tok);
  const g = el.cloneNode(true); g.id = "rgGeist"; g.removeAttribute("onclick"); g.querySelectorAll("[id], svg").forEach((x) => (x.tagName.toLowerCase() === "svg" ? x.remove() : x.removeAttribute("id")));
  const cs = getComputedStyle(el); // Abbild sieht aus wie das Original, auch wo das Aussehen am Elternteil hängt (z. B. #register button)
  for (const k of ["background", "color", "font", "borderRadius", "border", "padding", "display", "flexDirection", "alignItems", "justifyContent", "gap", "boxSizing", "textAlign", "whiteSpace", "lineHeight"]) g.style[k] = cs[k];
  g.classList.remove("rg-gedrueckt", "rg-puls", "zieht", "rg-zieht-weg"); g.className += " rg-geist"; Object.assign(g.style, { left: a.r.left + "px", top: a.r.top + "px", width: a.r.width + "px", height: a.r.height + "px" }); document.body.appendChild(g);
  el.classList.remove("rg-gedrueckt"); el.classList.add("rg-zieht-weg");
  const bx = b.left + b.width / 2, by = b.top + b.height / 2, dx = bx - a.x, dy = by - a.y;
  try { g.animate([{ transform: "translate(0,0) scale(1.06) rotate(-2deg)" }, { transform: `translate(${dx}px,${dy}px) scale(1.06) rotate(2deg)` }], { duration: 1100, easing: "ease-in-out", fill: "forwards" }); } catch {}
  await rgFzu(bx, by, 1100, tok); rgFdruck(false); await rgFwarte(120, tok);
  g.remove(); el.classList.remove("rg-zieht-weg");
}
// wischen: über das Element von rechts nach links (richtung 1) oder umgekehrt
async function rgFwischen(el, tok, richtung = 1) {
  const p = await rgFpunkt(el, tok), w = Math.min(p.r.width, innerWidth) * 0.32, x0 = p.x + w * richtung, x1 = p.x - w * richtung, y = Math.min(p.y, innerHeight * 0.55);
  await rgFzu(x0, y, 600, tok); rgFdruck(true); await rgFwarte(120, tok);
  const spur = document.createElement("div"); spur.className = "rg-wischspur"; Object.assign(spur.style, { left: Math.min(x0, x1) + "px", top: y + "px", width: Math.abs(x1 - x0) + "px" }); document.body.appendChild(spur);
  try { spur.animate([{ transform: `scaleX(0)`, transformOrigin: richtung > 0 ? "right" : "left", opacity: .9 }, { transform: "scaleX(1)", transformOrigin: richtung > 0 ? "right" : "left", opacity: 0 }], { duration: 700, easing: "ease-out" }); } catch {}
  setTimeout(() => spur.remove(), 750);
  await rgFzu(x1, y, 550, tok); rgFdruck(false); await rgFwarte(150, tok);
}
const rgSichtbarer = (q) => () => [...document.querySelectorAll(q)].find(rgSichtbar) || null; // erstes sichtbares (z. B. Darstellung oder „Das Wichtigste“)
const rgFel = (q) => { try { const e = typeof q === "function" ? q() : document.querySelector(q); return e && rgSichtbar(e) ? e : null; } catch { return null; } };
// Werkzeugkasten für live-Stationen
const rgL = (tok) => ({
  tipp: async (q, art) => { const e = rgFel(q); if (e) await rgFtipp(e, tok, art); return e; },
  ziehen: async (q, z) => { const e = rgFel(q), t = typeof z === "string" || typeof z === "function" ? rgFel(z) : z; if (e && t) await rgFziehen(e, t, tok); return !!(e && t); },
  wischen: async (q, r) => { const e = rgFel(q); if (e) await rgFwischen(e, tok, r); return e; },
  warte: (ms) => rgFwarte(ms, tok),
  ziel: () => rgNeuZielen(),
});
// Ursache → Wirkung: in der alten Ansicht das Element antippen, dann die Station aufbauen
async function rgVorTippen(s, tok) {
  const q = typeof s.tippVor === "function" ? s.tippVor() : s.tippVor, e = q && (typeof q === "string" ? rgFel(q) : rgSichtbar(q) ? q : null);
  if (!e) return;
  RG.ziel = e; rgHin(); rgLage(); await rgFwarte(350, tok);
  await rgFtipp(e, tok, s.tippArt || "");
}
async function rgLiveStart(s, tok) {
  RG.liveLaeuft = true;
  try { await s.live(rgL(tok)); if (tok === RG.liveTok) rgNeuZielen(); }
  catch (e) { if (e !== RG_ABBRUCH) console.warn("rundgang live", e); }
  finally { if (tok === RG.liveTok) { RG.liveLaeuft = false; setTimeout(() => { if (tok === RG.liveTok) rgFingerWeg(); }, 900); const f = RG.nachLive; RG.nachLive = null; f?.(); } }
}
// ---------- 2.346.0 KC-CLUB-VIDEO-PASST (Fund Hansi „im zweiten Video stimmen Bild und Text nicht überein: die Stimme erklärt die drei Felder
// im Kopf, der ist aber eingerollt; der Text nennt SOS, Fotos, Termine, Nachrichten, das Bild zeigt die Kacheln aus Technik“) ----------
// Für jede Station automatisch: (1) liegt das Ziel im Kopf, wird der Kopf aufgerollt (und die Vorderseite gezeigt); (2) nennt eine Station
// Kacheln (kacheln: [ids]), kommt das Register nach vorn, in dem sie liegen. Alles wird am Ende zurückgestellt (RG.zurueck).
function rgAutoSicht(s) {
  if (s.v !== "start") return;
  const ids = s.kacheln || (s.live ? [] : [...s.sel || [], ...s.puls || []]) // Live-Vorführungen tippen das Register selbst an
   .flatMap((q) => typeof q === "string" ? [...q.matchAll(/#raster \.kachel\[data-id="([^"]+)"\]/g)].map((m) => m[1]) : []);
  if (ids.length && !einfach()) {
    const r = Object.entries(KACHELN).map(([k, l]) => [k, l.filter((x) => ids.includes(x.id)).length]).sort((a, b) => b[1] - a[1])[0];
    if (r && r[1] && REGISTER.some(([x]) => x === r[0])) rgRegister(r[0]);
  }
  const roh = (s.sel || []).flatMap((q) => { try { return typeof q === "function" ? [q()].filter(Boolean) : [...document.querySelectorAll(q)]; } catch { return []; } });
  const imKopf = roh.find((e) => e.closest?.("#v-start .hero") && !e.closest("#heroRueck"));
  if (imKopf) { if (ES.offen) esDrehen(false, true); if (kopfRolloStand() !== "offen") rgKopf("offen"); }
}
// ---------- 2.346.0 KC-CLUB-VIDEO-VERWEIS (Wunsch Hansi „Verweise in den Videos: zu Farbe einstellen oder den Besonderheiten gibt es ein eigenes
// Video – möchtest du es dir jetzt direkt ansehen? Ja, Nein, Später, Nicht mehr fragen“) ----------
// Station mit video: "id" → nach dem Sprechen die Frage (je Video einmal pro Sitzung; nicht, wenn es gerade läuft oder schon in der Reihe ist).
// Ja: das andere Video läuft sofort, danach geht es hier an der nächsten Station weiter. Später: unter Erklär-Videos angehakt und mit 📌 gemerkt.
const RGV = { gefragt: new Set(), AUS: "kc_club_video_verweis_aus", SPAETER: "kc_club_video_spaeter" };
const rgvAus = () => { try { return localStorage.getItem(RGV.AUS) === "1"; } catch { return false; } };
const rgvSpaeter = () => { try { return JSON.parse(localStorage.getItem(RGV.SPAETER) || "[]") || []; } catch { return []; } };
function rgvSpaeterSetzen(l) { try { localStorage.setItem(RGV.SPAETER, JSON.stringify([...new Set(l)])); } catch {} }
function rgVerweis(s) {
  const id = s?.video, v = id && RUNDGAENGE.find((x) => x.id === id && (!x.nur || x.nur()));
  if (!v || !RG.an || RG.frage || rgvAus() || RG.gefragtStation === RG.i || id === RG.tour || RGV.gefragt.has(id) || (RG.liste || []).includes(id)) return false;
  RGV.gefragt.add(id); RG.gefragtStation = RG.i; RG.pause = true; clearTimeout(RG.uhr); $("rgPause").textContent = "▶ Weiter";
  $("rgText").insertAdjacentHTML("afterend", `<div class="rg-verweis" id="rgVerweis"><b>🎬 Dazu gibt es ein eigenes Video: ${v.sym} „${esc(v.t)}“.</b><span>Möchtest du es dir jetzt direkt ansehen?</span>
    <div class="rg-verweis-knoepfe"><button type="button" class="knopf haupt klein" onclick="rgVerweisWahl('ja','${id}')">▶ Ja</button><button type="button" class="knopf klein" onclick="rgVerweisWahl('nein','${id}')">Nein</button>
    <button type="button" class="knopf klein" onclick="rgVerweisWahl('spaeter','${id}')">⏰ Später</button><button type="button" class="knopf klein" onclick="rgVerweisWahl('aus','${id}')">🔕 Nicht mehr fragen</button></div></div>`);
  const frageText = `Dazu gibt es ein eigenes Video: ${v.t}. Möchtest du es dir jetzt direkt ansehen?`;
  if (rgpAktiv()) rgpSprich(frageText).catch(() => {}); else if (RG.ton) try { speechSynthesis.speak(rgAusgabe(frageText)); } catch {}
  rgLage(); return true;
}
function rgVerweisWahl(w, id) {
  $("rgVerweis")?.remove(); try { speechSynthesis.cancel(); } catch {} rgpStopp();
  if (w === "ja") { RG.fortsetzen = { id: RG.tour, i: RG.i + 1, liste: (RG.liste || []).slice(), von: RG.von }; const f = RG.fortsetzen; rundgangStart(false, id, []); RG.fortsetzen = f; return; }
  if (w === "spaeter") { rgvSpaeterSetzen([...rgvSpaeter(), id]); RGL.wahl.add(id); melde("📌 Gemerkt – unter 🎬 Erklär-Videos ist es schon angehakt."); }
  if (w === "aus") { try { localStorage.setItem(RGV.AUS, "1"); } catch {} melde("🔕 Gut – ich frage in den Videos nicht mehr nach. Wieder einschalten: unten in der Liste der Erklär-Videos."); }
  RG.pause = false; rundgangSchritt(1, true);
}
function rundgangStart(mitKnopf, id = "ueberblick", liste = [], startI = 0) {
  rundgangEnde(true); einwKarteWeg(); vorlesenStopp();
  RG.liste = Array.isArray(liste) ? liste.slice() : []; // KC-CLUB-VIDEO-THEMEN: danach noch abzuspielen
  const tour = RUNDGAENGE.find((x) => x.id === id && (!x.nur || x.nur())) || RUNDGAENGE[0];
  RG.tour = tour.id; RG.st = tour.st(); RG.zurueck = []; RG.vorI = -1; RG.richtung = 1; RG.frage = false;
  RG.von = aktuelleAnsicht === "chat" ? "nachrichten" : aktuelleAnsicht; RG.an = true;
  rgRollenAnsicht(tour.ziel || "alle");
  rgHinweisZeigen(); // Hinweis-Karte auf der Startseite während eines Videos weg
  if ((tour.ziel || "alle") !== "admin" && reg === "admin") { register("verein"); RG.zurueck.push(() => register("admin")); }
  if (tour.id === "ueberblick" && !rgErledigt()) rgHinweisErledigt("angesehen"); // KC-CLUB-RUNDGANG-HINWEIS: wer ihn einmal gestartet hat, wird nicht mehr gefragt
  if (tour.id === "warum" && !rgErledigt()) rgHinweisErledigt("angesehen"); // 2.254.0: die Einleitung zählt genauso
  RG.i = Math.max(0, Math.min(RG.st.length - 1, startI | 0)); RG.pause = !!mitKnopf; RG.ton = "speechSynthesis" in window; document.body.classList.add("rg-an");
  document.body.insertAdjacentHTML("beforeend", `<div class="rg-schicht" id="rgSchicht" role="dialog" aria-modal="true" aria-label="${esc(tour.t)}"><div class="rg-loch" id="rgLoch"></div>
    <div class="rg-tafel" id="rgTafel"><div class="rg-oben"><b id="rgTitel"></b><span class="rg-oben-r"><button type="button" class="rg-stimme" onclick="stimmenWahl()" aria-label="Stimme und Tempo der Videos wählen" title="Stimme &amp; Tempo">🗣️</button><span class="rg-nr" id="rgNr"></span></span></div><p id="rgText"></p><div class="rg-balken"><i id="rgBalken"></i></div>
    <div class="rg-knoepfe"><button type="button" class="knopf klein" onclick="rundgangSchritt(-1)" aria-label="Zurück">◀</button><button type="button" class="knopf haupt klein" id="rgPause" onclick="rundgangPause()"></button><button type="button" class="knopf klein" onclick="rundgangSchritt(1)" aria-label="Weiter">▶</button><button type="button" class="knopf klein" onclick="rundgangEnde()">✕ Beenden</button></div></div></div>`);
  addEventListener("resize", rgLage); addEventListener("scroll", rgLage, true);
  rgWach();
  rgZeigen();
  rgpCtx(); { const pid = rgpId(); if (pid && RGP.bereit !== pid) rgpLaden(pid).catch(() => {}); } // gewählte Download-Stimme startklar machen (aus dem Speicher)
  if (!rgsGefragt() && (RG.ton || rgpKann())) stimmenWahl(true); // 2.348.0: beim ersten Video die Stimme aussuchen lassen
}
// Bildschirm bleibt an, solange der Rundgang läuft (sonst geht er nach 30 Sek. ohne Tippen aus); nach dem Zurückkehren in die App neu holen
async function rgWach() { if (!RG.an || document.hidden) return; try { RG.wach?.release?.(); RG.wach = await navigator.wakeLock?.request("screen"); } catch {} }
document.addEventListener("visibilitychange", () => { if (!RG.an) return; if (document.hidden) { RG.pause = true; rgStille(); } else { rgWach(); rgZeigen(); } });
// 2.358.0 KC-CLUB-AKKU-3 (Hansi „in kurzer Zeit 30 % Akku verloren“): Während eines Videos bleibt der Bildschirm an – auch in der Pause
// (Stimmen-Auswahl, Verweis-Frage, ⏸). Jetzt: nach 30 s Pause darf der Bildschirm wieder ausgehen, nach 10 Minuten Pause endet das Video von selbst.
setInterval(() => {
  if (!RG.an) { RG.pauseSek = 0; return; }
  if (!RG.pause) { RG.pauseSek = 0; if (!RG.wach && !document.hidden) rgWach(); return; }
  RG.pauseSek = (RG.pauseSek || 0) + 15;
  if (RG.pauseSek >= 30 && RG.wach) { try { RG.wach.release?.(); } catch {} RG.wach = null; }
  if (RG.pauseSek >= 600 && !$("rgsBlatt")) rundgangEnde(true);
}, 15000);
// ---------- 2.348.0 KC-CLUB-VIDEO-STIMMEN (Wunsch Hansi „am Anfang verschiedene Stimmen für das Erklär-Video anbieten – eine Auswahl, falls eine
// Stimme sich nicht gut anhört; in Supabase eine Tabelle mit Stimmen, die man bei Bedarf nachladen kann“) ----------
// Die Stimmen selbst stecken im Handy/Browser (Web Speech) und lassen sich nicht aus dem Netz laden. Die Tabelle kc_club_video_stimmen (Aktion „stimmen“)
// liefert Erkennungsmuster für gute Stimmen je Gerät (Güte, Tempo, Tonhöhe) und Anleitungen, wie man bessere Stimmen ins Gerät lädt.
// Geholt wird sie nur bei Bedarf (Auswahl öffnen) und 7 Tage gemerkt; ohne Netz gilt die eingebaute Grundliste.
// Gewählt wird je Gerät: eigene Video-Stimme + Tempo (unabhängig von der Vorlese-Stimme in den Einstellungen). Gespeichert: nur localStorage.
const RGS = { KEY: "kc_club_video_stimme", TEMPO: "kc_club_video_tempo", GEFRAGT: "kc_club_video_stimme_gefragt", TAB: "kc_club_stimmen_tab", tab: null, laedt: null, probe: 0 };
const RGS_GRUND = () => [ // Grundliste, falls die Tabelle (noch) nicht geladen ist – gleich wie die Startzeilen in der Migration
  { plattform: "alle", art: "stimme", muster: "(online|natural)", name: "Natürliche Online-Stimme", guete: 3, tempo: 1, hoehe: 1 },
  { plattform: "alle", art: "stimme", muster: "premium|erweitert|enhanced", name: "Premium/Erweitert", guete: 3, tempo: 1, hoehe: 1 },
  { plattform: "alle", art: "stimme", muster: "^google deutsch", name: "Google Deutsch", guete: 2, tempo: 1, hoehe: 1 },
  { plattform: "alle", art: "stimme", muster: STIMME_SCHLECHT.source, name: "Spaßstimme", guete: 0, tempo: 1, hoehe: 1 },
  { plattform: "alle", art: "download", datei: "de_DE-thorsten-medium", groesse_mb: 63, name: "Thorsten", geschlecht: "m", guete: 3, text: "Männerstimme, klar und natürlich", reihenfolge: 1 },
  { plattform: "alle", art: "download", datei: "de_DE-dii-medium", groesse_mb: 63, name: "Dii", geschlecht: "w", guete: 3, text: "Frauenstimme, freundlich und klar", reihenfolge: 2 }, // 2.353.0: nur noch Thorsten und Dii (Wunsch Hansi)
];
const RGS_TEMPI = [[0.8, "🐢 Langsamer"], [1, "Normal"], [1.15, "🐇 Schneller"]];
function rgsPlattform() {
  const u = navigator.userAgent || "";
  return /iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(u) ? "android" : /Mac/.test(u) ? "mac" : /Windows/.test(u) ? "windows" : "alle";
}
function rgsTabelle() { // gemerkte Tabelle (≤ 7 Tage) oder Grundliste
  if (RGS.tab) return RGS.tab;
  try { const g = JSON.parse(localStorage.getItem(RGS.TAB) || "null"); if (g?.l?.length && Date.now() - g.z < 7 * 864e5) return (RGS.tab = g.l); } catch {}
  return RGS_GRUND();
}
function rgsNachladen(neu) { // bei Bedarf vom Server holen
  if (RGS.laedt) return RGS.laedt;
  if (!neu && RGS.tab) return Promise.resolve(RGS.tab);
  RGS.laedt = api("stimmen", {}).then((r) => { const l = (r?.stimmen || []).filter((x) => x && x.name); if (l.length) { RGS.tab = l; try { localStorage.setItem(RGS.TAB, JSON.stringify({ z: Date.now(), l })); } catch {} } return rgsTabelle(); })
    .catch(() => rgsTabelle()).finally(() => { RGS.laedt = null; });
  return RGS.laedt;
}
function rgsTreffer(v) { // passende Tabellenzeile für eine Gerätestimme (eigene Plattform zuerst)
  const pf = rgsPlattform();
  return rgsTabelle().filter((x) => x.art === "stimme" && x.muster && (x.plattform === "alle" || x.plattform === pf))
    .sort((a, b) => (b.plattform === pf) - (a.plattform === pf) || (a.reihenfolge ?? 100) - (b.reihenfolge ?? 100))
    .find((x) => { try { return new RegExp(x.muster, "i").test(v.name); } catch { return false; } }) || null;
}
const rgsGuete = (v) => { const t = rgsTreffer(v); return t ? Number(t.guete) : stimmeWert(v) >= 6 ? 3 : STIMME_SCHLECHT.test(v.name) ? 0 : 1; };
const rgsWert = (v) => rgsGuete(v) * 10 + stimmeWert(v);
const rgsSterne = (g) => ["🤪 Spaßstimme", "Standard", "⭐ Gut", "⭐⭐ Sehr gut"][g] || "Standard";
const rgsName = (v) => String(v.name).replace(/^Microsoft\s+/i, "").replace(/\s+Online\s*\(Natural\)/i, " (natürlich)").replace(/\s*-\s*German.*$/i, "").replace(/\s*\(Deutsch[^)]*\)\)?$/i, "").trim() || v.name;
function rgsStimmen() { return [...deStimmen()].sort((a, b) => rgsWert(b) - rgsWert(a)); }
function rgsTempo() { try { const t = Number(localStorage.getItem(RGS.TEMPO)); return t >= 0.5 && t <= 1.5 ? t : 1; } catch { return 1; } }
function rgsStimme() { // gewählte Video-Stimme, sonst die beste – nie eine Spaßstimme automatisch
  const alle = rgsStimmen(); if (!alle.length) return null;
  let w = ""; try { w = localStorage.getItem(RGS.KEY) || ""; } catch {}
  return alle.find((v) => v.voiceURI === w) || alle.find((v) => rgsGuete(v) > 0) || deStimme();
}
function rgAusgabe(text) { // Satz für die Videos: eigene Stimme, Tempo und Tonhöhe
  const u = sprechAusgabe(text), v = rgsStimme(); if (!v) return u;
  const t = rgsTreffer(v); u.voice = v; u.lang = v.lang; u.rate = rgsTempo() * (Number(t?.tempo) || 1); u.pitch = Number(t?.hoehe) || 1;
  return u;
}
const rgsGefragt = () => { try { return localStorage.getItem(RGS.GEFRAGT) === "1"; } catch { return true; } };
function rgsProbe(uri) {
  try { speechSynthesis.cancel(); } catch {} rgpStopp();
  if (String(uri || rgsWahlWert()).startsWith("piper:")) return rgpProbe(String(uri || rgsWahlWert()).slice(6));
  const alt = (() => { try { return localStorage.getItem(RGS.KEY); } catch { return null; } })();
  try { if (uri) localStorage.setItem(RGS.KEY, uri); } catch {}
  try { speechSynthesis.speak(rgAusgabe(`Hallo ${ICH?.vorname || ""}! So klinge ich in den Erklär-Videos der Köcheclub-App.`)); } catch {}
  try { if (uri) { if (alt) localStorage.setItem(RGS.KEY, alt); else localStorage.removeItem(RGS.KEY); } } catch {}
}
const rgsWahlWert = () => { try { return localStorage.getItem(RGS.KEY) || ""; } catch { return ""; } };
function rgsWahl(uri) {
  try { uri ? localStorage.setItem(RGS.KEY, uri) : localStorage.removeItem(RGS.KEY); } catch {}
  const pid = String(uri || "").startsWith("piper:") ? uri.slice(6) : null;
  rgpCtx(); // Ton freischalten (iPhone: nur direkt nach einem Tipp)
  if (pid && RGP.bereit !== pid) { rgpLaden(pid).then(() => { if (rgsWahlWert() === uri) rgsProbe(); }).catch(() => {}); rgsZeigen(); return; } // erst holen, dann Probe
  rgsZeigen(); rgsProbe();
}
function rgsTempoWahl(t) { try { localStorage.setItem(RGS.TEMPO, String(t)); } catch {} rgsZeigen(); rgsProbe(); }
// ---------- 2.348.0 KC-CLUB-VIDEO-STIMMEN-DOWNLOAD (Wunsch Hansi „User sucht sich eine Stimme aus und klickt sie an – die App holt sie
// aus der DB und installiert sie je nach Browser“) ----------
// Freie Piper-Stimmen rechnen im Browser selbst (stimmen/piper-worker.js: ONNX Runtime + eSpeak-Aussprache) – auf jedem Gerät und in jedem
// Browser gleich. Welche angeboten werden, steht in der Tabelle (art „download“); die Dateien liegen neben der App unter stimmen/.
// Ein Tipp auf die Stimme lädt sie einmal (Fortschritt in %), danach liegt sie im Browser-Speicher und klappt auch ohne Netz.
// Probe vor dem Laden: kurze Hörprobe (stimmen/proben/…mp3). Gerechnet wird Satz für Satz – der nächste, während der vorige läuft.
const RGP = { w: null, da: new Set(), bereit: null, laedt: null, prozent: 0, nr: 0, lauf: 0, quelle: null, ctx: null, warte: new Map(), probe: null, ok: null, schief: null };
const RGP_ALT = /^de_DE-(kerstin-low|eva_k-x_low|ramona-low|karlsson-low)$/; // 2.353.0: herausgenommen (Hansi: „schrecklich, stottern“) – wer sie gewählt hatte, bekommt Thorsten
const rgpId = () => { const w = rgsWahlWert(); if (!w.startsWith("piper:")) return null; const id = w.slice(6);
  if (RGP_ALT.test(id)) { try { localStorage.setItem(RGS.KEY, "piper:de_DE-thorsten-medium"); } catch {} return "de_DE-thorsten-medium"; } return id; };
const rgpListe = () => rgsTabelle().filter((x) => x.art === "download" && /^[\w-]{3,80}$/.test(x.datei || "") && !RGP_ALT.test(x.datei)).sort((a, b) => (a.reihenfolge ?? 100) - (b.reihenfolge ?? 100));
const rgpKann = () => typeof Worker !== "undefined" && typeof WebAssembly !== "undefined" && "caches" in window && !!(window.AudioContext || window.webkitAudioContext);
const rgpAktiv = () => { const id = rgpId(); return !!id && RGP.bereit === id; };
function rgpWorker() {
  if (RGP.w) return RGP.w;
  RGP.w = new Worker("stimmen/piper-worker.js");
  RGP.w.onmessage = (e) => rgpNachricht(e.data || {});
  RGP.w.onerror = () => rgpNachricht({ typ: "fehler", text: "Die Stimme konnte nicht starten" });
  RGP.w.postMessage({ typ: "da" });
  return RGP.w;
}
function rgpNachricht(d) {
  if (d.typ === "da") { RGP.da = new Set(d.liste || []); for (const id of RGP.da) if (RGP_ALT.test(id)) RGP.w?.postMessage({ typ: "weg", id }); rgsZeigen(); } // alte Stimmen vom Gerät räumen
  else if (d.typ === "fortschritt") { RGP.prozent = d.gesamt ? Math.min(99, Math.round((d.geladen * 100) / d.gesamt)) : 0; const el = $("rgpProzent"); if (el) el.textContent = `⏳ ${RGP.prozent} %`; }
  else if (d.typ === "bereit") { RGP.bereit = d.id; RGP.laedt = null; RGP.da.add(d.id); const f = RGP.ok; RGP.ok = RGP.schief = null; f?.(); rgsZeigen(); }
  else if (d.typ === "audio") { const w = RGP.warte.get(d.nr); RGP.warte.delete(d.nr); w?.ok(d); }
  else if (d.typ === "fehler") {
    if (d.nr != null) { const w = RGP.warte.get(d.nr); RGP.warte.delete(d.nr); w?.weg(new Error(d.text)); return; }
    RGP.laedt = null; const f = RGP.schief; RGP.ok = RGP.schief = null; f?.(new Error(d.text));
    melde(navigator.onLine === false ? "📶 Ohne Netz kann die Stimme nicht geladen werden – bitte im WLAN nochmal versuchen." : "⚠️ Die Stimme ließ sich nicht laden: " + d.text, true); rgsZeigen();
  }
}
function rgpLaden(id) { // holen (oder aus dem Browser-Speicher) und startklar machen
  if (RGP.bereit === id) return Promise.resolve();
  if (RGP.laedt === id && RGP.ok) return new Promise((ok, schief) => { const a = RGP.ok, b = RGP.schief; RGP.ok = () => { a?.(); ok(); }; RGP.schief = (e) => { b?.(e); schief(e); }; });
  try { navigator.storage?.persist?.(); } catch {} // Browser soll die Stimme nicht von selbst wegräumen
  RGP.laedt = id; RGP.prozent = 0; RGP.bereit = null;
  return new Promise((ok, schief) => { RGP.ok = ok; RGP.schief = schief; rgpWorker().postMessage({ typ: "laden", id }); });
}
function rgpWeg(id) {
  rgpStopp(); if (RGP.bereit === id) RGP.bereit = null;
  if (rgpId() === id) try { localStorage.removeItem(RGS.KEY); } catch {}
  rgpWorker().postMessage({ typ: "weg", id }); melde("🗑️ Stimme entfernt – sie kann jederzeit wieder geladen werden.");
}
function rgpCtx() { // Ton-Ausgabe; auf dem iPhone nur nach einem Tipp freigeschaltet – deshalb bei jedem Tipp „wecken“
  try { if (!RGP.ctx) RGP.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (RGP.ctx.state === "suspended") RGP.ctx.resume(); } catch {}
  return RGP.ctx;
}
function rgpRechnen(text) { const nr = ++RGP.nr; return new Promise((ok, weg) => { RGP.warte.set(nr, { ok, weg }); rgpWorker().postMessage({ typ: "sprich", nr, text, tempo: rgsTempo() }); }); }
function rgpAbspielen(d) {
  return new Promise((ok) => {
    const ctx = rgpCtx(); if (!ctx || !d?.pcm?.length) return ok();
    const b = ctx.createBuffer(1, d.pcm.length, d.rate); b.getChannelData(0).set(d.pcm);
    const q = ctx.createBufferSource(); q.buffer = b; q.connect(ctx.destination); q.onended = () => { if (RGP.quelle === q) RGP.quelle = null; ok(); };
    RGP.quelle = q; q.start();
  });
}
async function rgpSprich(text) { // true = bis zum Ende gesprochen, false = unterbrochen
  const lauf = ++RGP.lauf, saetze = (String(text).match(/[^.!?]+[.!?]*/g) || [String(text)]).map((x) => x.trim()).filter(Boolean);
  if (!saetze.length) return true;
  let naechst = rgpRechnen(saetze[0]);
  for (let i = 0; i < saetze.length; i++) {
    const d = await naechst; if (lauf !== RGP.lauf) return false;
    naechst = i + 1 < saetze.length ? rgpRechnen(saetze[i + 1]) : null;
    await rgpAbspielen(d); if (lauf !== RGP.lauf) return false;
  }
  return true;
}
function rgpStopp() {
  RGP.lauf++; try { RGP.quelle?.stop(); } catch {} RGP.quelle = null;
  try { RGP.probe?.pause(); } catch {} RGP.probe = null;
  if (RGP.w) RGP.w.postMessage({ typ: "abbruch", bis: RGP.nr });
  for (const [, w] of RGP.warte) w.ok(null); RGP.warte.clear();
}
function rgpProbe(id) {
  rgpStopp();
  if (RGP.bereit === id) { rgpCtx(); rgpSprich(`Hallo ${ICH?.vorname || ""}! So klinge ich in den Erklär-Videos der Köcheclub-App.`).catch(() => {}); return; }
  try { RGP.probe = new Audio(`stimmen/proben/${id}.mp3`); RGP.probe.play().catch(() => melde("🔇 Die Hörprobe ließ sich nicht abspielen – ist der Ton an?")); } catch {}
}
function rgpZeilen() {
  if (!rgpKann()) return "";
  const l = rgpListe(); if (!l.length) return "";
  const wahl = rgpId();
  if (!RGP.w) rgpWorker(); // fragt, welche schon geladen sind
  return `<h4 style="margin:14px 0 4px">⬇️ Oder eine bessere Stimme herunterladen</h4>
    <p class="hinweis" style="margin:0 0 8px">Klingt dir die Stimme deines Geräts nicht gut? Diese zwei klingen auf jedem Handy und in jedem Browser gleich und sprechen nach dem Laden auch ohne Netz. Antippen lädt die Stimme einmal herunter – am besten im WLAN.</p>
    <div class="rgs-liste">${l.map((x) => { const id = x.datei, da = RGP.da.has(id), an = wahl === id, laedt = RGP.laedt === id, g = Number(x.guete) || 2;
      return `<div class="rgs-zeile${an ? " an" : ""}"><button type="button" class="rgs-wahl" onclick="rgsWahl('piper:${id}')" aria-pressed="${an}">
        <span aria-hidden="true">${an ? "🔘" : "⚪"}</span><span><b>${esc(x.name)}</b><small>${rgsSterne(g)}${x.geschlecht ? (x.geschlecht === "m" ? " · 👨" : " · 👩") : ""}${x.text ? " · " + esc(x.text) : ""}</small>
        <small>${laedt ? `<span id="rgpProzent">⏳ ${RGP.prozent} %</span> – wird geladen …` : da ? "✓ geladen – klappt auch ohne Netz" : `⬇️ antippen zum Laden (${Number(x.groesse_mb) || "?"} MB${[...RGP.da].some((i) => !RGP_ALT.test(i)) ? "" : " + einmalig 29 MB für die Sprach-Technik"})`}</small></span></button>
        <span class="rgs-knoepfe"><button type="button" class="knopf klein" onclick="rgpCtx();rgsProbe('piper:${id}')" aria-label="Probe hören: ${esc(x.name)}">▶ Probe</button>${da && !laedt ? `<button type="button" class="knopf klein" onclick="rgpWeg('${id}')" aria-label="${esc(x.name)} entfernen" title="Vom Gerät entfernen">🗑️</button>` : ""}</span></div>`; }).join("")}</div>
`;
}
// ---------- 2.354.0 KC-CLUB-VIDEO-STIMMEN-SUCHE (Wunsch Hansi „beim ersten Aufruf eine Suchfunktion einschalten, die die vorhandenen Stimmen
// des jeweiligen Geräts selber sucht und mit anzeigt“) ----------
// Handy, Tablet und PC melden ihre Stimmen oft erst nach einem Moment (Chrome/Android: erst nach dem ersten Sprechen). Die Suche weckt die
// Sprachausgabe mit einem stummen Satz, fragt bis zu 6 Sekunden lang nach und zeigt dann, was gefunden wurde – mit „🔍 Nochmal suchen“.
function rgsSuchen() {
  if (!("speechSynthesis" in window)) { RGS.suche = { fertig: true, de: 0, alle: 0, gut: 0 }; return rgsZeigen(); }
  const lauf = (RGS.sucheLauf = (RGS.sucheLauf || 0) + 1), start = Date.now(); let zuletzt = -1, gleichSeit = start;
  RGS.suche = { laeuft: true };
  try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = "de-DE"; speechSynthesis.speak(u); } catch {} // weckt die Stimmen-Liste
  rgsZeigen();
  const schauen = () => {
    if (lauf !== RGS.sucheLauf) return;
    let alle = []; try { alle = speechSynthesis.getVoices() || []; } catch {}
    if (alle.length !== zuletzt) { zuletzt = alle.length; gleichSeit = Date.now(); }
    const fertig = (alle.length && Date.now() - gleichSeit > 800) || Date.now() - start > 6000;
    if (!fertig) return void setTimeout(schauen, 250);
    const de = deStimmen();
    RGS.suche = { fertig: true, de: de.length, alle: alle.length, gut: de.filter((v) => rgsGuete(v) >= 2).length };
    rgsZeigen();
  };
  setTimeout(schauen, 250);
}
// Auswahl öffnen: beimStart = vor dem ersten Video (danach geht es los); sonst aus dem Video (🗣️) oder aus der Video-Liste
function stimmenWahl(beimStart) {
  RGS.beimStart = !!beimStart; RGS.alle = false;
  if (RG.an && !RG.pause) { RG.pause = true; rgStille(); RG.warteStimme = true; $("rgPause").textContent = "▶ Weiter"; } // Video hält an, solange gewählt wird
  const f = $("rgsBlatt") || blattAuf("rgsBlatt", `<div id="rgsInhalt"></div>`);
  f.classList.add("rgs-blatt", "rg-zeigen"); f.onclick = (e) => { if (e.target === f) rgsFertig(); }; rgsZeigen();
  rgsSuchen(); // 2.354.0: Stimmen des Geräts suchen
  rgsNachladen(true).then(() => rgsZeigen());
}
function rgsZeigen() {
  const z = $("rgsInhalt"); if (!z) return;
  const alle = rgsStimmen(), jetzt = rgsStimme(), tempo = rgsTempo(), pf = rgsPlattform();
  let w = ""; try { w = localStorage.getItem(RGS.KEY) || ""; } catch {}
  const gute = alle.filter((v) => rgsGuete(v) > 0), zeigen = RGS.alle ? alle : gute.slice(0, 6);
  const hinweise = rgsTabelle().filter((x) => x.art === "hinweis" && (x.plattform === pf || x.plattform === "alle"));
  const zeile = (v) => { const g = rgsGuete(v), t = rgsTreffer(v), an = !rgpId() && jetzt && v.voiceURI === jetzt.voiceURI, art = t?.geschlecht || stimmeArt(v);
    return `<div class="rgs-zeile${an ? " an" : ""}"><button type="button" class="rgs-wahl" onclick="rgsWahl('${esc(v.voiceURI).replace(/'/g, "&#39;")}')" aria-pressed="${an}">
      <span aria-hidden="true">${an ? "🔘" : "⚪"}</span><span><b>${esc(t && g > 1 && !/^Apple-Stimme|^Google-Sprach|^Samsung/.test(t.name) ? t.name : rgsName(v))}</b><small>${rgsSterne(g)}${art ? (art === "m" ? " · 👨" : " · 👩") : ""}${t?.text ? " · " + esc(t.text) : ""}</small></span></button>
      <button type="button" class="knopf klein" onclick="rgsProbe('${esc(v.voiceURI).replace(/'/g, "&#39;")}')" aria-label="Probe hören: ${esc(v.name)}">▶ Probe</button></div>`; };
  const su = RGS.suche || {}, sucht = !!su.laeuft;
  const kopfGeraet = `<h4 style="margin:12px 0 4px">📱 Stimmen auf deinem ${({ ios: "iPhone/iPad", android: "Handy", mac: "Mac", windows: "PC" })[pf] || "Gerät"}${sucht ? "" : ` – ${alle.length ? `${alle.length} gefunden` : "keine gefunden"}`}</h4>
    ${sucht ? `<p class="hinweis rgs-sucht" role="status">🔍 Ich suche die Stimmen auf deinem Gerät …</p>` : su.fertig ? `<p class="hinweis" style="margin:0 0 6px">${alle.length ? `🔍 Gefunden: <b>${alle.length} deutsche Stimme${alle.length === 1 ? "" : "n"}</b>${su.gut ? `, davon ${su.gut} mit guter Qualität` : ""}.` : `🔍 Auf diesem Gerät habe ich keine deutsche Stimme gefunden${su.alle ? ` (nur ${su.alle} in anderen Sprachen)` : ""}.${rgpKann() ? " Nimm am besten oben Thorsten oder Dii." : ""}`} <button type="button" class="knopf klein" onclick="rgsSuchen()">🔍 Nochmal suchen</button></p>` : ""}`;
  z.innerHTML = `<h3 style="margin-top:0">🗣️ Welche Stimme soll dir die Videos erklären?</h3>${kopfGeraet}
    ${sucht ? "" : alle.length ? `<p class="hinweis" style="margin:0 0 8px">Tippe auf <b>▶ Probe</b>, um eine Stimme zu hören. Gefällt sie dir, tippe auf ihren Namen.${w ? "" : " Ohne Auswahl spricht die beste Stimme deines Geräts."}</p>
      <div class="rgs-liste">${zeigen.map(zeile).join("")}</div>
      ${alle.length > zeigen.length || RGS.alle ? `<button type="button" class="knopf klein" onclick="RGS.alle=!RGS.alle;rgsZeigen()">${RGS.alle ? "Nur die guten Stimmen" : `Alle ${alle.length} Stimmen zeigen`}</button>` : ""}
      ${w ? `<button type="button" class="knopf klein" onclick="rgsWahl('')">↺ Automatisch (beste Gerätestimme)</button>` : ""}`
      : `<p class="hinweis">${"speechSynthesis" in window ? "" : "Dieser Browser hat keine Sprachausgabe. "}Die Videos laufen trotzdem – der Text steht zum Mitlesen da.</p>`}
    ${rgpZeilen()}
    <h4 style="margin:12px 0 6px">⏱️ Wie schnell soll sie sprechen?</h4>
    <div class="rgs-tempo">${RGS_TEMPI.map(([t, n]) => `<button type="button" class="chip${Math.abs(t - tempo) < 0.01 ? " an" : ""}" onclick="rgsTempoWahl(${t})">${n}</button>`).join("")}</div>
    ${hinweise.length ? `<details class="rgs-hinweis"><summary>💡 Klingt keine Stimme gut? So bekommst du bessere</summary>${hinweise.map((h) => `<p><b>${esc(h.name)}</b><br>${esc(h.text || "")}</p>`).join("")}</details>` : ""}
    <div class="rgl-fuss"><button type="button" class="knopf haupt" onclick="rgsFertig()">${RGS.beimStart ? "▶ Mit dieser Stimme starten" : "✅ Fertig"}</button></div>`;
}
function rgsFertig() {
  try { localStorage.setItem(RGS.GEFRAGT, "1"); speechSynthesis.cancel(); } catch {} rgpStopp();
  $("rgsBlatt")?.remove();
  RGS.beimStart = false;
  if (RG.an && RG.warteStimme) { RG.warteStimme = false; RG.pause = false; rgZeigen(); } // weiter, wo das Video stand
}
try { speechSynthesis.addEventListener?.("voiceschanged", () => { if ($("rgsInhalt")) rgsZeigen(); }); } catch {}
function rgStille() { rgPulsStop(); $("rgVerweis")?.remove(); clearTimeout(RG.uhr); RG.lauf++; RG.liveTok++; RG.liveLaeuft = false; RG.nachLive = null; RG.tippLaeuft = false; rgFingerWeg(); try { if (RG.ton) speechSynthesis.cancel(); } catch {} rgpStopp(); }
function rgZeigen() {
  if (!RG.an || RG.frage) return; // Bewertungs-Karte am Ende bleibt stehen
  rgStille();
  const s = RG.st[RG.i], n = RG.st.length;
  // KC-CLUB-VIDEO-LIVE: erst in der alten Ansicht antippen (Finger), dann die Station aufbauen – nur vorwärts und nicht im Pausen-Stand
  if (RG.vorI !== RG.i && s.tippVor && RG.tippI !== RG.i && !RG.pause && (RG.richtung || 1) > 0 && (!s.nur || s.nur())) {
    RG.tippI = RG.i; const tok = RG.liveTok; RG.tippLaeuft = true;
    $("rgTitel").textContent = s.t; $("rgNr").textContent = `${RG.i + 1} / ${n}`; $("rgText").textContent = "👆 …"; $("rgPause").textContent = "⏸ Pause";
    rgVorTippen(s, tok).catch((e) => { if (e !== RG_ABBRUCH) console.warn("rundgang tippen", e); }).finally(() => { if (tok === RG.liveTok && RG.an && RG.tippLaeuft) { RG.tippLaeuft = false; rgZeigen(); } });
    return;
  }
  if (RG.vorI !== RG.i) { // Station wechselt: vorige aufräumen, neue vorbereiten (nur einmal – nicht beim Fortsetzen nach Pause)
    const alt = RG.st[RG.vorI]; RG.vorI = RG.i; RG.liveI = -1; try { alt?.nach?.(); } catch {}
    if (s.v !== aktuelleAnsicht) zeige(s.v, true); // ohne neue Verlaufs-Einträge – „Zurück“ bleibt wie vorher
    if (!s.nur || s.nur()) try { s.vor?.(); } catch (e) { console.warn("rundgang vor", e); }
    if (!s.nur || s.nur()) try { rgAutoSicht(s); } catch (e) { console.warn("rundgang sicht", e); } // 2.346.0 KC-CLUB-VIDEO-PASST
    rgDemo(s.demo);
  }
  if ((s.nur && !s.nur()) || (s.mussSel && !rgZiel(s))) { RG.i += RG.richtung || 1; if (RG.i < 0 || RG.i >= n) return RG.i < 0 ? (RG.i = 0, rgZeigen()) : rundgangEnde(); return rgZeigen(); }
  RG.ziel = rgZiel(s); rgHin(); RG.seit = Date.now(); setTimeout(() => { if (RG.an && !RG.frage && RG.st[RG.i] === s) rgPulsStart(s); }, 250);
  $("rgTitel").textContent = s.t; $("rgText").textContent = rgText(s); $("rgNr").textContent = `${RG.i + 1} / ${n}`;
  $("rgBalken").style.width = `${((RG.i + 1) / n) * 100}%`;
  $("rgPause").textContent = RG.pause ? (RG.i === 0 ? "▶ Los geht's" : "▶ Weiter") : "⏸ Pause";
  for (const ms of [60, 450, 1000, 2000, 3500, 5500]) setTimeout(() => { // Kartei-Blättern und Laden verschieben das Ziel noch
    // 2.245.1 (Fund Hansi: Chats als Rollkartei scrollen beim Öffnen zur Kartei – „＋ Neu“ oben war nicht zu sehen): Ziel wieder ins Bild holen
    if (ms > 60 && RG.an && RG.st[RG.i] === s && RG.ziel && !rgImBild(RG.ziel)) rgHin();
    rgLage(); }, ms);
  setTimeout(() => { if (RG.an && RG.st[RG.i] === s && !rgSichtbar(RG.ziel)) { RG.ziel = rgZiel(s); rgHin(); rgLage(); } }, 350); // Inhalt kommt evtl. erst nach dem Laden
  if (!RG.pause) rgSprechen(rgText(s));
  if (s.live && !RG.pause && RG.liveI !== RG.i) { RG.liveI = RG.i; const tok = RG.liveTok; RG.liveLaeuft = true; setTimeout(() => { if (tok === RG.liveTok && RG.an) rgLiveStart(s, tok); }, 700); } // KC-CLUB-VIDEO-LIVE
}
const rgImBild = (e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && (r.bottom <= innerHeight || r.height > innerHeight * 0.45); };
// hohe Bereiche (z. B. aufgeklappte Einstellungen) oben anfangen, kleine in die Mitte holen
function rgHin() { const e = RG.ziel; if (!e) return scrollTo(0, 0);
  const z = RK.einst; if (z?.an && z.karten.some((k) => k.contains(e))) return rkZu(z, e); // Einstellungen als Rollkartei: zur richtigen Karte blättern
  e.scrollIntoView({ block: e.getBoundingClientRect().height > innerHeight * 0.45 ? "start" : "center", behavior: "instant" }); }
// Text satzweise vorlesen (lange Texte brechen auf manchen Handys sonst ab); danach kurz warten und weiterblättern.
// Ohne Sprachausgabe oder wenn das Handy kein „fertig“ meldet: Lesezeit nach Wortzahl.
function rgSprechen(text) {
  // Mindestzeit: Handys ohne deutsche Stimme melden „fertig“ oft sofort – dann bleibt der Text trotzdem lange genug zum Lesen stehen
  const lauf = RG.lauf, saetze = text.match(/[^.!?]+[.!?]*/g) || [text], lesezeit = 2500 + text.split(/\s+/).length * 420, frueh = Date.now() + lesezeit * 0.75;
  const weiter = () => { if (lauf === RG.lauf && RG.an && !RG.pause && RG.liveLaeuft) { RG.nachLive = weiter; return; } // erst die Live-Vorführung zu Ende
    if (lauf === RG.lauf && RG.an && !RG.pause) { clearTimeout(RG.uhr); RG.uhr = setTimeout(() => { if (!rgVerweis(RG.st[RG.i])) rundgangSchritt(1, true); }, Math.max(1200, frueh - Date.now())); } };
  if (rgpAktiv()) { // 2.348.0: heruntergeladene Stimme spricht
    RG.uhr = setTimeout(weiter, lesezeit * 3 + 8000); // Sicherheitsnetz (Rechnen dauert auf alten Handys etwas)
    rgpSprich(text).then((fertig) => { if (fertig && lauf === RG.lauf) weiter(); }).catch(() => { if (lauf === RG.lauf) weiter(); });
    return;
  }
  if (!RG.ton) return weiter();
  RG.uhr = setTimeout(weiter, lesezeit * 1.8); // Sicherheitsnetz
  try {
    saetze.forEach((x, n) => { const u = rgAusgabe(x.trim()); if (n === saetze.length - 1) { u.onend = weiter; u.onerror = (e) => { if (e?.error !== "interrupted" && e?.error !== "canceled") weiter(); }; } speechSynthesis.speak(u); });
  } catch { weiter(); }
}
function rgLage() {
  const l = $("rgLoch"), t = $("rgTafel"); if (!l || !t) return;
  let r = RG.ziel && rgSichtbar(RG.ziel) ? RG.ziel.getBoundingClientRect() : null;
  // 2.246.0 (Fund Hansi, Bildschirmfoto: Rahmen oben am Rand, „＋ Neu“ nicht zu sehen): Seite hat sich nachträglich verschoben (z. B. Daten
  // vom Server geladen) → Ziel in den ersten 6 Sekunden der Station zurückholen; liegt es trotzdem außerhalb, keinen Rahmen am Rand zeichnen
  if (r && !rgImBild(RG.ziel)) {
    if (Date.now() - (RG.seit || 0) < 6000 && Date.now() - (RG.holt || 0) > 400) { RG.holt = Date.now(); rgHin(); requestAnimationFrame(rgLage); return; }
    if (r.bottom < 8 || r.top > innerHeight - 8) r = null;
  }
  if (!r) { l.style.cssText = `left:50%;top:50%;width:0;height:0;outline-width:0`; t.classList.remove("rg-oben-an"); return; }
  const p = 6, x = Math.max(4, r.left - p), y = Math.max(4, r.top - p), w = Math.min(innerWidth - 4, r.right + p) - x, h = Math.min(innerHeight - 4, r.bottom + p) - y; // nur der sichtbare Teil
  l.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const unten = innerHeight - t.offsetHeight - 12; // 2.264.0: Oberkante der Tafel, wenn sie unten steht – nie das Ziel verdecken
  t.classList.toggle("rg-oben-an", r.height < innerHeight * 0.45 && (y + h / 2 > innerHeight * 0.55 || y + h > unten)); // kleines Ziel unten → Tafel oben
}
function rundgangSchritt(d, auto) {
  if (!RG.an) return;
  if (!auto) RG.pause = false;
  const n = RG.i + d; RG.richtung = d;
  if (n >= RG.st.length) return RG.frage ? null : rgFrage(); // KC-CLUB-VIDEO-BEWERTUNG: am Ende 👍/👎
  RG.i = Math.max(0, n); rgZeigen();
}
// ---------- KC-CLUB-VIDEO-BEWERTUNG (2.246.0, Wunsch Hansi): am Ende „Gefallen?“ und „Hilft es dir weiter?“ mit 👍/👎 ----------
// Bewertung je Mitglied, Video und Fassung (RUNDGAENGE[].stand) auf dem Server; Auswertung nur für den Admin (nur Zahlen).
const RG_BEW = { gefallen: null, hilft: null };
// KC-CLUB-VIDEO-GESEHEN (2.266.0, Wunsch Hansi „an jedes Video ein Auge mit der Zahl, wie oft schon angesehen, und einen grünen Haken, wenn schon angesehen“):
// gezählt wird, wenn ein Video bis zum Ende läuft (Bewertungs-Karte). Gespeichert beim Server (Einstellung „videos“, alle Geräte) und als
// Rückfall auf dem Gerät; zusammengeführt wird mit dem größeren Wert, damit nie eine Zahl verloren geht.
const RG_GESEHEN_LS = "kc_club_videos_gesehen";
function rgGesehen() {
  let lokal = {}; try { lokal = JSON.parse(localStorage.getItem(RG_GESEHEN_LS) || "{}") || {}; } catch {}
  const server = INIT?.einstellungen?.videos || {}, alle = {};
  for (const id of new Set([...Object.keys(lokal), ...Object.keys(server)])) {
    const a = lokal[id] || {}, b = server[id] || {}, n = Math.max(Number(a.n) || 0, Number(b.n) || 0);
    if (n) alle[id] = { n, z: [a.z, b.z].filter(Boolean).sort().pop() || null };
  }
  return alle;
}
async function rgGesehenZaehlen(id) {
  const g = rgGesehen(); g[id] = { n: (g[id]?.n || 0) + 1, z: new Date().toISOString() };
  if (rgvSpaeter().includes(id)) rgvSpaeterSetzen(rgvSpaeter().filter((x) => x !== id)); // 2.346.0: angesehen – nicht mehr „Später“
  try { localStorage.setItem(RG_GESEHEN_LS, JSON.stringify(g)); } catch {}
  if (INIT) INIT.einstellungen = { ...(INIT.einstellungen || {}), videos: g };
  try { await einstSpeichern("videos", g); } catch (e) { console.warn("videos gesehen", e); } // bleibt auf dem Gerät und geht beim nächsten Mal mit
}
const rgGesehenHtml = (id) => { const n = rgGesehen()[id]?.n || 0;
  return `<span class="rgl-gesehen${n ? " ja" : ""}" title="${n ? `${n}× angesehen` : "noch nicht angesehen"}" aria-label="${n ? `${n}-mal angesehen` : "noch nicht angesehen"}">👁 ${n}${n ? ' <b class="rgl-haken-gruen" aria-hidden="true">✓</b>' : ""}</span>`; };
function rgFrage() {
  if (!RG.frage && RG.tour) rgGesehenZaehlen(RG.tour); // bis zum Ende angesehen
  rgStille(); RG.frage = true; RG.pause = true; RG.ziel = null; rgLage(); RG_BEW.gefallen = RG_BEW.hilft = null;
  try { RG.st[RG.vorI]?.nach?.(); } catch {} RG.vorI = -1; // letzte Station aufräumen, Ansicht bleibt
  const zeile = (k, frage) => `<div class="rg-frage"><span>${frage}</span><span class="rg-daumen" data-k="${k}"><button type="button" data-w="1" onclick="rgDaumen('${k}', true)" aria-label="Daumen hoch">👍</button><button type="button" data-w="0" onclick="rgDaumen('${k}', false)" aria-label="Daumen runter">👎</button></span></div>`;
  $("rgTafel").innerHTML = `<div class="rg-oben"><b>🎬 Wie war das Video?</b></div>${zeile("gefallen", "Hat dir das Video gefallen?")}${zeile("hilft", "Hilft es dir weiter?")}
    ${rgNaechstesHtml()}<div class="rg-knoepfe rg-knoepfe2"><button type="button" class="knopf haupt klein" id="rgBewSenden" onclick="rgBewertungSenden(this)" disabled>✔ Abschicken</button><button type="button" class="knopf klein" onclick="rundgangEnde()">Überspringen</button></div>`;
  $("rgTafel").classList.remove("rg-oben-an");
  if (RG.ton) try { speechSynthesis.speak(sprechAusgabe("Hat dir das Video gefallen? Und hilft es dir weiter? Tippe auf Daumen hoch oder Daumen runter.")); } catch {}
}
function rgNaechstesHtml() { // KC-CLUB-VIDEO-THEMEN: in einer Reihe sagen, was danach kommt
  const da = (RG.liste || []).map((id) => RUNDGAENGE.find((x) => x.id === id && (!x.nur || x.nur()))).filter(Boolean);
  return da.length ? `<p class="hinweis rg-naechst">Danach: ${da[0].sym} <b>${esc(da[0].t)}</b>${da.length > 1 ? ` · noch ${da.length} Videos` : ""} – nach dem Abschicken oder Überspringen geht es weiter.</p>` : "";
}
function rgDaumen(k, wert) {
  RG_BEW[k] = RG_BEW[k] === wert ? null : wert; // nochmal antippen nimmt es zurück
  document.querySelectorAll(`#rgTafel .rg-daumen[data-k="${k}"] button`).forEach((b) => b.classList.toggle("an", RG_BEW[k] !== null && (b.dataset.w === "1") === RG_BEW[k]));
  $("rgBewSenden").disabled = RG_BEW.gefallen === null && RG_BEW.hilft === null;
}
async function rgBewertungSenden(knopf) {
  const tour = RUNDGAENGE.find((x) => x.id === RG.tour); if (!tour) return rundgangEnde();
  knopf.disabled = true;
  try { await api("video_bewerten", { video: tour.id, stand: tour.stand, gefallen: RG_BEW.gefallen, hilft: RG_BEW.hilft }); rundgangEnde(); melde("🎬 Danke für deine Bewertung!"); }
  catch (e) { knopf.disabled = false; meldeFehler(e); } // Regel 11: nicht still als „gespeichert“ melden
}
// Auswertung für den Admin: je Video (aktuelle Fassung) Anzahl, 👍-Anteil „gefallen“ und „hilft“; wenig Zustimmung → überarbeiten
const RG_MIN_STIMMEN = 3;
function rgUrteil(z) {
  const plus = z.gefallen_ja + z.hilft_ja, alle = plus + z.gefallen_nein + z.hilft_nein;
  if (!z.anzahl || z.anzahl < RG_MIN_STIMMEN || !alle) return ["grau", `⚪ zu wenig Stimmen (${z.anzahl || 0} von mind. ${RG_MIN_STIMMEN})`];
  const q = plus / alle; return q < 0.6 ? ["rot", "🔴 überarbeiten"] : q < 0.8 ? ["gelb", "🟡 beobachten"] : ["gruen", "🟢 gut"];
}
async function rgAuswertung() {
  const f = blattAuf("rgAuswBlatt", `<h3 style="margin-top:0">📊 Auswertung der Erklär-Videos</h3><p class="hinweis">Wird geladen …</p>`);
  let d; try { d = await api("video_auswertung", {}, { warten: true }); }
  catch (e) { f.querySelector(".blatt-innen").innerHTML = `<h3 style="margin-top:0">📊 Auswertung der Erklär-Videos</h3><p class="hinweis">⚠️ ${esc(fehlerText(e, "Gerade nicht abrufbar"))}</p><div class="knoepfe"><button class="knopf" onclick="$('rgAuswBlatt').remove()">Schließen</button></div>`; return; }
  const pz = (ja, nein) => ja + nein ? `${Math.round((ja / (ja + nein)) * 100)} % 👍 <small>(${ja}/${ja + nein})</small>` : "–";
  const zeilen = RUNDGAENGE.map((t) => {
    const z = (d.videos || []).find((x) => x.video === t.id && x.stand === t.stand) || { anzahl: 0, gefallen_ja: 0, gefallen_nein: 0, hilft_ja: 0, hilft_nein: 0 };
    const alt = (d.videos || []).filter((x) => x.video === t.id && x.stand !== t.stand).reduce((s, x) => s + x.anzahl, 0), [farbe, urteil] = rgUrteil(z);
    return `<div class="rg-ausw rg-${farbe}"><div class="rg-ausw-kopf"><b>${t.sym} ${esc(t.t)}</b><span>${urteil}</span></div>
      <div class="rg-ausw-zahlen"><span>Bewertungen: <b>${z.anzahl}</b></span><span>Gefallen: ${pz(z.gefallen_ja, z.gefallen_nein)}</span><span>Hilft weiter: ${pz(z.hilft_ja, z.hilft_nein)}</span></div>
      ${alt ? `<div class="hinweis">Fassung ${esc(t.stand)} · ${alt} Bewertung${alt === 1 ? "" : "en"} zu früheren Fassungen nicht mitgezählt</div>` : ""}</div>`; }).join("");
  f.querySelector(".blatt-innen").innerHTML = `<h3 style="margin-top:0">📊 Auswertung der Erklär-Videos</h3>
    <p class="hinweis" style="margin-top:0">Nur Zahlen, keine Namen. Ab ${RG_MIN_STIMMEN} Bewertungen: 🟢 gut (ab 80 % 👍) · 🟡 beobachten · 🔴 überarbeiten (unter 60 %). Wird ein Video überarbeitet, zählt es neu.</p>
    ${zeilen}<div class="knoepfe"><button class="knopf" onclick="$('rgAuswBlatt').remove()">Schließen</button></div>`;
}
function rundgangPause() {
  if (!RG.an) return;
  RG.pause = !RG.pause;
  if (RG.pause) { rgStille(); $("rgPause").textContent = "▶ Weiter"; } else rgZeigen();
}
function rundgangEnde(still) {
  if (!RG.an && !$("rgSchicht")) return;
  const bisEnde = !still && RG.frage, naechst = bisEnde ? (RG.liste || []).find((id) => RUNDGAENGE.some((x) => x.id === id && (!x.nur || x.nur()))) : null;
  const rest = naechst ? RG.liste.slice(RG.liste.indexOf(naechst) + 1) : [], von = RG.von; if (!bisEnde) RG.liste = []; // ✕ Beenden stoppt auch die Reihe
  const weiter = bisEnde && !naechst && RG.tour === "warum"; // 2.254.0: nach der Einleitung bis zum Ende → Rundgang anbieten
  const browserWahl = bisEnde && !naechst && RG.tour === "installieren"; // 2.276.0 KC-CLUB-VIDEO-INSTALL: danach den eigenen Browser wählen
  RG.frage = false; rgStille(); try { RG.st[RG.vorI]?.nach?.(); } catch {} // offene Beispiele schließen, Aufgeklapptes zuklappen, Vorführung zurück
  for (const f of RG.zurueck.splice(0).reverse()) try { f(); } catch {}
  if (RG.an) rgDemo({}); RG.vorI = -1;
  RG.an = false; RG.ziel = null; try { RG.wach?.release?.(); } catch {} RG.wach = null; $("rgSchicht")?.remove(); document.body.classList.remove("rg-an");
  rgRollenAnsicht(null);
  removeEventListener("resize", rgLage); removeEventListener("scroll", rgLage, true);
  if (!still) { zeige(RG.von, true); scrollTo(0, 0); } // zurück, wo der Rundgang gestartet wurde
  rgHinweisZeigen();
  if (weiter) setTimeout(rgUeberblickAnbieten, 400);
  if (browserWahl) setTimeout(rgInstWahl, 400);
  if (naechst) setTimeout(() => { if (RG.an) return; rundgangStart(false, naechst, rest); RG.von = von; }, 600); // KC-CLUB-VIDEO-THEMEN: nächstes angehaktes Video
  const fort = RG.fortsetzen; RG.fortsetzen = null; // 2.346.0: nach einem Verweis-Video („Ja, jetzt ansehen“) geht es im vorigen Video weiter
  if (fort && bisEnde && !naechst) setTimeout(() => { if (RG.an) return; rundgangStart(false, fort.id, fort.liste, fort.i); RG.von = fort.von; }, 300); // vor dem Angebot nach „Warum“ (400 ms) – das prüft RG.an
}
async function rgUeberblickAnbieten() {
  if (RG.an) return;
  if (await frage("🗺️ Möchtest du jetzt den Rundgang sehen?\nIn wenigen Minuten zeige ich dir, wie die App aufgebaut ist – mit Ton.", { ja: "▶ Ja, zeigen", nein: "Später" })) rundgangStart(false, "ueberblick");
  else melde("🎬 Den Rundgang findest du jederzeit unter Erklär-Videos");
}
