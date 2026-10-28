// // KC-CLUB-TEILE Stufe 5 (2.746.0): Hilfe-Werkzeuge – Frag Twinkey, Ein Mitglied fragen, Lupe/Suche (Fenster, Treffer).
// // Wird beim ersten Antippen von Twinkey oder der Lupe nachgeladen (Platzhalter in app.js, TEILE_LISTE). Zustand TW/SU, Antwort-Prüfung beim Start und die Such-Grundbausteine (suNorm, suFiltern …) bleiben im Hauptprogramm.
// ---------- KC-CLUB-TWINKEY (2.23.49, Wunsch Hansi): „🧑‍🍳 Frag Twinkey“ – Fragen in eigenen Worten (tippen oder 🎤 sprechen) ----------
// Früher „Frag den Küchenchef“ (2.23.48) – Twinkey, weil auch viele Twinkeys früher Küchenchefs waren.
// Kostenlos und ohne fremde KI: sucht die passende Antwort in den Hilfen (Hilfe-Zentrum, Tipps, „Kurz erklärt“), in Twinkeys
// eigenen Fragen und Antworten (TW_FAQ) und in dem, was Twinkey vom Admin gelernt hat (Server: twinkey_daten → wissen).
// Versteht andere Wörter für dasselbe (Synonyme), Wortformen und kleine Tippfehler. „👉 Zeig es mir“ springt an die Stelle.
// KC-CLUB-TWINKEY-FRAGEN: Weiß Twinkey es nicht und tippt man auf „➤ Fragen“, sagt er „Das ist eine gute Frage …“ und gibt die
// Frage an den Admin weiter (nur auf ausdrückliches Fragen – nie beim bloßen Tippen). Der Admin antwortet per 🔔 Push, ✉️ E-Mail
// und/oder 📱 in der Club-App und kann Twinkey die Antwort merken lassen. Die eigene Frage + Antwort steht unter „📬 Deine Fragen“.
const TW_STOP = new Set("wie was wo wann warum wer welche welcher welches kann koennen konnte ich man mir mich mein meine meinen meiner meinem dein deine du ein eine einen einem einer der die das den dem des und oder in im an am auf aus zu zum zur mit von vom fuer bei ist sind wird werden wurde habe hat hast haben es sich nicht noch auch nur so mal bitte gibt geht gehen machen mache macht tun tut kann moechte moechten will wollen soll sollte muss da hier dort jetzt denn dann etwas einfach gerne gern ueber unter funktioniert klappt stellen stelle aendern aendere einstellen bekommen bekomme lade mache mach finde finden sehe sehen kriege leicht schnell hallo hi danke".split(" "));
const TW_SYN = [["termin", "verabredung", "treffen", "datum", "verabreden", "ausmachen", "kalender", "veranstaltung"], ["terminanfrage", "anfrage", "anfragen", "einladen", "einladung"],
  ["farbe", "farben", "design", "aussehen", "farbschema", "dunkel", "hell", "nachtmodus", "lieblingsfarbe"], ["nachricht", "schreiben", "chat", "mitteilung", "senden", "schicken", "whatsapp", "unterhaltung"],
  ["schrift", "groesser", "gross", "buchstaben", "zoom", "lesbar", "schriftgroesse", "lupe"], ["ton", "laut", "leise", "klingelton", "benachrichtigung", "push", "mitteilungen", "piept", "klingelt"],
  ["foto", "bild", "fotos", "bilder", "album", "hochladen", "galerie"], ["pinnwand", "zettel", "aushang", "postit", "brett"], ["helfen", "helfer", "hilfeaufruf", "gesucht", "angebot", "unterstuetzung"],
  ["mitglied", "mitglieder", "person", "kontakt", "telefonnummer", "anrufen", "nummer", "handynummer"], ["loeschen", "entfernen", "weg", "rueckgaengig", "wegmachen"], ["notfall", "sos", "unfall", "notruf", "krankenwagen"],
  ["dienst", "dienstplan", "dienstwunsch", "dienstwuensche", "wunsch", "wuensche", "dienstzeiten", "schicht", "weihnachtsmarkt", "einteilung"], ["spiel", "spiele", "schach", "skat", "bauernskat", "quiz", "kuechenterror", "spielen"], ["tictactoe", "tomaten", "tomate", "brokkoli"],
  ["anmelden", "login", "code", "zugang", "passwort", "tablet", "computer", "geraet", "link", "einloggen"], ["installieren", "startbildschirm", "symbol", "homebildschirm", "app"],
  ["archiv", "ordner", "dokument", "dokumente", "ablage", "ablegen", "unterlagen"], ["protokoll", "protokolle", "sitzung", "versammlung"], ["geburtstag", "gratulieren", "glueckwunsch", "geburtstage"],
  ["standort", "karte", "position", "teilen"], ["diktieren", "mikrofon", "sprechen", "sprachnachricht"], ["vorlesen", "ansage", "ansagen", "stimme"], ["gruppe", "gruppen", "gruppenchat"],
  ["status", "urlaub", "krank", "abwesend", "verfuegbar"], ["zusagen", "absagen", "komme", "teilnehmen", "dabei", "zusage", "absage"], ["mitfahren", "mitfahrt", "fahrt", "fahrgemeinschaft", "auto", "abholen"],
  ["erstattung", "geld", "fahrtkosten", "auslage", "kosten", "zurueck", "beleg", "quittung", "parken", "parkgebuehr", "kraftstoff", "tanken", "kaution"],
  ["gelesen", "zugestellt", "lesebestaetigung", "haken", "angekommen"], ["laufband", "infoband", "infofeld", "meldung", "meldungen"], ["kuckuck", "glocke", "glockenspiel", "stundenschlag", "bigben", "dom"], // 18.10.2026 KC-CLUB-HILFE-AKTUELL
  ["sonderstunden", "sondereinsatz", "einsatz", "stundenkonto"], ["zeitumstellung", "sommerzeit", "winterzeit"], ["ausleihen", "leihen", "borgen", "pavillon", "reservieren"], ["boerse", "verkaufen", "verschenken", "biete"], ["suche", "suchen", "finden"],
  ["tipp", "tipps", "hilfe", "erklaerung", "anleitung", "handbuch", "bedienungsanleitung"], ["stumm", "ruhe", "stoeren", "ruhezeit", "nachts"], ["vorschlag", "vorschlaege", "idee", "abstimmen", "abstimmung"],
  ["anschrift", "adresse", "umgezogen", "umzug", "wohnung"], ["version", "update", "aktualisieren", "neu", "neuigkeiten"], ["fehler", "problem", "kaputt", "geht", "haengt", "absturz"],
  ["daten", "datenschutz", "privat", "sicher", "sicherheit", "privatsphaere"], ["kosten", "kostet", "gratis", "kostenlos", "bezahlen"], ["profil", "meine", "angaben", "kleidung", "groesse", "kochjacke"],
  ["avatar", "kochbild", "profilbild", "profilfoto", "benutzerbild", "kochfigur", "figur", "figuren", "selfie", "baukasten"],
  // 2.300.0 KC-CLUB-RUECKSEITE-HILFE
  ["eselsohr", "rueckseite", "umdrehen", "umgeknickt", "ecke", "kopfseite"], ["diashow", "dia", "bilderschau", "fotoschau", "vollbild"],
  ["skizze", "skizzieren", "zeichnen", "malen", "tafel", "flipchart", "kreide", "aufmalen"], ["uhr", "uhrzeit", "bahnhofsuhr", "fallblatt", "digitaluhr"],
  ["buehne", "bewegung", "turnen", "gymnastik", "sport", "fitness", "trainieren", "bewegen"], ["lautstaerke", "lauter", "leiser", "regler", "musik"],
  // 2.396.0 KC-CLUB-HILFE-NEUHEITEN
  ["express", "eilig", "eilt", "dringend", "sofort", "rennwagen", "schnellste"], ["zurueckholen", "vertippt", "zuruecknehmen", "zurueckziehen", "korrigieren", "falsch"],
  ["favorit", "favoriten", "stern", "sternchen", "lieblings", "lieblingschat", "wichtigste"], ["spaeter", "zeitversetzt", "planen", "geplant", "morgen", "wecker"],
  // 2.533.0 KC-CLUB-HILFE-NACHTRAG-4
  ["verschluesseln", "verschluesselt", "verschluesselung", "geheim", "schluessel", "schloss", "kennwort", "codiert", "schluesselbund", "geheimagent", "agent"],
  ["ablagekorb", "dateimanager", "hochschicken"], ["versandleiste", "normal", "wichtig", "leiste"], ["schreibt", "tippt", "diktiert"],
  ["pdf", "drucken", "ausdrucken", "briefbogen", "papier"], ["cowboy", "indianer", "westen", "wildwest", "bueffel", "kutsche"], ["wueste", "pyramide", "pharao", "kamel", "karawane", "flaschengeist", "geist", "oase"], ["baustelle", "bagger", "radlader", "laster", "sprengung", "dynamit", "explosion", "bauarbeiter"], ["seifenblasen", "seifenblase", "blasen", "fensterputzer", "fischauge", "pusten"]]; // 2.252.0 Fund Hansi: Wilfried fragte „Kochbild“
// Twinkeys eigene Fragen und Antworten (Wunsch Hansi: „mehr Fragen und Antworten“) – kurz, mit Sprung an die richtige Stelle
const TW_FAQ = [
  { id: "chat-nur-hg", sym: "🖼️", t: "Wie sehe ich meinen Chat-Hintergrund ohne die Nachrichten?", x: "Im Chat in der kleinen Zeile über dem Schreibfeld dreimal auf <b>👥</b> tippen – dann steht dort <b>🖼️</b>, alle Nachrichten sind ausgeblendet und du siehst nur den Hintergrund. Noch einmal tippen (oder den gelben Hinweis oben) zeigt wieder alles.", los: () => hzZuEintrag("h:chat_filter") }, // 2.591.0
  { id: "einstellungen-erklaert", sym: "🧭", t: "Was bewirken die ganzen Einstellungen?", x: "Unter <b>Technik → 🧭 Einstellungen erklärt</b> siehst du alle Einstellungen wie Ordner im Explorer – antippen erklärt, was sie bewirken, und <b>👉 Hinbringen</b> führt dich zum Schalter. Mit 🖨️ auch zum Ausdrucken.", los: () => ewStart() }, // 2.534.0
  // 2.671.0 KC-CLUB-HILFE-NACHTRAG-5: Fragen zu den Neuheiten 2.534.0–2.668.0 (nur Mitglieder-Funktionen)
  { id: "wecker", sym: "⏰", t: "Kann die App mich wecken oder einen Timer stellen?", x: "Ja: doppelt aufs <b>Eselsohr</b> im Kopf tippen → <b>🕰️ Uhr</b> → oben <b>⏰ Wecker</b>, <b>⏱️ Stoppuhr</b> oder <b>⏲️ Timer</b>. Ist es so weit, klingelt die Stundenuhr – <b>🔕 Aus</b> und daneben <b>💤 Schlummern</b> (10 Min. später) bzw. beim Timer <b>+1 Min.</b>. Ist die App zu, kommt eine Benachrichtigung.", los: () => esOeffnen("uhr") },
  { id: "wecker-stumm", sym: "🔊", t: "Mein Wecker oder Timer ist stumm – warum?", x: "Hast du die App gerade erst geöffnet und noch nicht getippt, lässt das Handy keinen Ton zu. Dann steht im Klingel-Fenster <b>„🔊 Antippen für Ton“</b> – einmal tippen, und es klingelt hörbar. Sonst: Ist das Handy laut gestellt?", los: () => hzZuEintrag("h:wecker_ton") },
  { id: "kachel-effekt", sym: "🎬", t: "Können die Kacheln anders hereinkommen?", x: "Ja: ⚙️ → „✨ Effekte“ → <b>„🎬 Effekt beim Register-Wechsel“</b> – z. B. 🌀 Hereindrehen, 🎰 Spielautomat, 🫧 Seifenblasen, 🧲 Magnet, 🍳 Pfanne, 🕰️ Fallblatt-Uhr oder 🚂 Kachel-Zug, dazu 🔁 Abwechselnd und 🎲 Zufall. <b>▶ Vorschau</b> zeigt ihn sofort.", los: () => einstiegHin("effekte", "regEffektWahl") },
  { id: "wie-verschicken", sym: "📤", t: "Wie stelle ich ein, wie Nachrichten an mehrere rausgehen?", x: "Einmal festlegen unter ⚙️ → Benachrichtigungen → <b>„📤 Nachrichten an mehrere oder mit Anlage“</b> (Standard: ⚙️ Wie jeder es eingestellt hat) – dann fragt die App nicht mehr. Für eine einzelne Nachricht tippst du in der Versand-Leiste auf <b>📤 …</b>; mit <b>📌 Für diesen Chat merken</b> merkt sich der Chat seinen Weg. Wer das Fenster jedes Mal will, wählt <b>❓ Jedes Mal fragen</b>.", los: () => hzZuEintrag("h:wie_verschicken") },
  { id: "auch-an", sym: "➕", t: "Wie nehme ich weitere Empfänger dazu?", x: "Im Chat in der kleinen Zeile über der Tastatur auf <b>➕</b> tippen und Mitglieder wählen. Über dem Schreibfeld steht dann „➕ auch an: …“ – beim Senden wird daraus eine Runde mit allen, der alte Verlauf bleibt privat.", los: () => hzZuEintrag("h:weitere_empfaenger") },
  { id: "nachricht-aendern", sym: "✏️", t: "Kann ich eine Nachricht später noch ändern?", x: "Ja, jederzeit: eigene Nachricht antippen → <b>„✏️ Bearbeiten“</b>. Bei Fotos und Dateien heißt es <b>„✏️ Unterschrift hinzufügen“</b> oder <b>„… ändern“</b>. Die anderen sehen „bearbeitet“, ohne neue Benachrichtigung.", los: () => hzZuEintrag("h:nachricht_aendern") },
  { id: "sanduhr", sym: "⏳", t: "Was bedeutet die Sanduhr an meiner Nachricht?", x: "<b>⏳</b> heißt: Die Nachricht ist in der Warteschlange und geht gleich raus – du kannst schon weiterschreiben. Steht dort ⚠️, hat es nicht geklappt: <b>🔄 Nochmal</b> oder <b>🗑️ Löschen</b>. Ohne Netz wartet sie, bis wieder Verbindung da ist.", los: () => hzZuEintrag("h:sende_schlange") },
  { id: "vorher-abrufen", sym: "📩", t: "Was ist „📩 Jetzt abrufen“?", x: "Jemand hat dir eine Nachricht für später geplant und erlaubt, dass du sie schon vorher liest. Tippst du auf <b>„📩 Jetzt abrufen“</b>, kommt sie sofort. Planst du selbst eine Nachricht, fragt die App, ob der Empfänger das darf.", los: () => hzZuEintrag("h:geplant_vorab") },
  { id: "anklopfen-art", sym: "👋", t: "Was heißt „will mit dir sprechen“ beim Anklopfen?", x: "Wer anklopft, wählt <b>💬 Schreiben</b> oder <b>📞 Sprechen</b>. Bei „Sprechen“ verbindet dich <b>„📞 Annehmen – jetzt sprechen“</b> gleich in der App; bei „Schreiben“ öffnet sich euer Chat. Ist 👋 bei jemandem blass, geht Anklopfen gerade nicht – antippen sagt dir warum.", los: () => hzZuEintrag("h:anklopfen_wahl") },
  { id: "anklopfen-blass", sym: "🔕", t: "Warum kann ich bei manchen nicht anklopfen?", x: "Anklopfen geht nur, wenn das Mitglied gerade online ist (🟢) und Anklopfen erlaubt. Sonst ist <b>👋</b> blass oder es steht <b>🔕</b> da – antippen erklärt den Grund (nicht online, Anklopfen deaktiviert, Online-Status verborgen) und bietet <b>💬 Nachricht schreiben</b> an.", los: () => hzZuEintrag("h:anklopfen_wahl") },
  { id: "zettel-teil-ab", sym: "🧹", t: "Kann ich einen Zettel nur bei manchen abnehmen?", x: "Ja: beim Abnehmen deines Zettels <b>„🧹 Nur bei denen abnehmen, die ihn gelesen haben“</b> wählen. Wer ihn noch nicht gesehen hat, behält ihn, bis er ihn gelesen hat.", los: () => hzZuEintrag("h:pinnwand_teil_ab") },
  { id: "abstimmung-mehrere", sym: "📋", t: "Wie mache ich eine Abstimmung mit mehreren Fragen?", x: "<b>Vorschläge → ＋ Neu → 🗳️ Abstimmung</b> → <b>„📋 Mehrere Fragen mit Überschrift“</b>: Überschrift, Bereiche, Fragen mit eigenen Antworten – auch <b>„✍️ Freie Antwort“</b> zum Eintippen. Dazu gibt es einen <b>🖨️ Ankreuzbogen</b> zum Ausdrucken.", los: () => hzZuEintrag("h:abstimmung_mehrere") },
  { id: "pdf-senden", sym: "💬", t: "Wie schicke ich einen Ausdruck in der Club-App?", x: "In jeder Druckvorschau auf <b>„💬 In der Club-App senden“</b> tippen – die App macht ein PDF und öffnet „Neue Nachricht“ mit dem PDF als Anlage. Empfänger wählen, Text dazu, ➤.", los: () => hzZuEintrag("h:druck_pdf") },
  { id: "clubabend", sym: "🍽️", t: "Was ist „Clubabend Live“?", x: "Am Clubabend – ab zwei Stunden vorher bis zum Ende – erscheint die Kachel <b>🍽️ Clubabend Live</b>: Tagesordnung, wer da ist, Fotos vom Abend, Geburtstage seit dem letzten Treffen und offene Aufgaben – alle 20 Sekunden aktuell.", los: () => hzZuEintrag("h:clubabend_live") },
  { id: "clubmoment", sym: "📸", t: "Was ist „Mein Clubmoment“?", x: "Ab 1. November reichst du deinen schönsten Clubmoment des Jahres ein – ein Foto und ein, zwei Sätze, bis 15. Dezember – über die Kachel <b>📖 Unser Clubjahr</b>. Daraus wird das Clubjahr-Heft fürs Weihnachtsessen.", los: () => hzZuEintrag("h:clubmoment") },
  { id: "spassstimme", sym: "🎭", t: "Kann ich im Gespräch mit verstellter Stimme sprechen?", x: "Ja: im App-Gespräch auf <b>🎭</b> tippen und eine Spaßstimme wählen – z. B. 🐭 Maus, 🎈 Helium, 🤖 Roboter, 🐻 Brummbär oder 👻 Gespenst. Dein Gegenüber hört dich dann so.", los: () => hzZuEintrag("h:spassstimme") },
  { id: "glueckskeks", sym: "🥠", t: "Ich habe einen Glückskeks bekommen – was ist das?", x: "Ein kleines Dankeschön von Hansi: Bei deinem 10., 20., 25., 30. … Tag mit der Club-App kommt eine Nachricht mit drei Glückskeksen. Tipp einen an – er zerspringt, und ein Zettel mit Spruch und Glückszahlen kommt heraus.", los: () => zeige("nachrichten") },
  { id: "schatten-kopf", sym: "🎩", t: "Wie bekommen die Felder im Kopf einen Schatten?", x: "⚙️ → „✨ Effekte“ → <b>„🌗 Schatten“</b> einschalten → <b>„🌗 Schatten einstellen“</b> → <b>🎩 Schatten im Kopf</b>: Aus, leicht bis sehr kräftig. Im dunklen Bild hilft <b>🌙 Kontrast bei Nacht</b>.", los: () => einstiegHin("effekte", "setSchatten") },
  // 2.533.0 KC-CLUB-HILFE-NACHTRAG-4: Fragen zu Verschlüsseln, Schlüsselbund, Versand-Leiste, Teilen und den übrigen Neuheiten (nur Mitglieder-Funktionen)
  { id: "verschluesseln", sym: "🔒", t: "Wie schicke ich eine Nachricht verschlüsselt?", x: "Im Chat in der kleinen Zeile über dem Schreibfeld auf das Schloss <b>🔒</b> tippen (grün = an), schreiben, senden. Die App fragt nach – <b>„🔒 Ja, mit Schlüssel“</b> – dann einen Schlüssel festlegen (mindestens 6 Zeichen) und ihn dem Empfänger <b>persönlich, am Telefon oder per SMS</b> sagen. Ein Geheimagent bringt die Nachricht; lesen kann sie nur, wer den Schlüssel hat.", los: () => zeige("nachrichten") },
  { id: "schluessel-frage", sym: "✉️", t: "Ich soll einen Schlüssel eingeben – ich will aber gar nicht verschlüsseln!", x: "Dann ist das Schloss 🔒 über dem Schreibfeld aus Versehen an. Tippe in der Rückfrage auf <b>„✉️ Normal senden“</b> – das Schloss geht aus und die Nachricht geht ganz normal raus. Beim Wechsel in einen anderen Chat geht das Schloss ohnehin von selbst aus.", los: () => zeige("nachrichten") },
  { id: "schluessel-oeffnen", sym: "🔓", t: "Wie lese ich eine verschlüsselte Nachricht?", x: "Auf <b>„🔒 Verschlüsselte Nachricht – antippen und Schlüssel eingeben“</b> tippen und den Schlüssel eingeben, den dir der Absender gesagt hat. Das Handy merkt ihn sich für diesen Chat. Habt ihr einen Schlüsselbund, öffnet sie sich von selbst. <b>Schlüssel vergessen?</b> Dann frag den Absender – ohne Schlüssel kann sie niemand lesen.", los: () => zeige("nachrichten") },
  { id: "schluesselbund", sym: "🔑", t: "Was ist der Schlüsselbund?", x: "Damit schreibt ihr zu zweit verschlüsselt, <b>ohne Schlüssel einzutippen</b>: im Zweier-Chat oben <b>⋮ → „🔑 Schlüsselbund mit …“</b> → anlegen und die Datei per WhatsApp oder Signal schicken. Der Partner liest sie ein (Teilen → Club-App). Danach 🔒 an und senden – fertig.", los: () => zeige("nachrichten") },
  { id: "geheimagent", sym: "🕵️", t: "Warum läuft ein Mann mit Hut und Koffer über den Bildschirm?", x: "Das ist der <b>🕵️ Geheimagent</b> – er bringt verschlüsselte Nachrichten (🔒), egal welchen Boten du sonst gewählt hast. Vorher dreht sich kurz ein 🔑 Schlüssel. Nur bei 🏎️ Express kommt der Rennwagen. Ohne Bewegung: ⚙️ → „✨ Effekte“ → „✉️ Effekt beim Senden“ → Aus.", los: () => einstiegHin("effekte", "sendeEffektWahl") },
  { id: "versand-leiste", sym: "📝", t: "Wo sind Wichtig und Express geblieben?", x: "Über dem Schreibfeld: Sobald du etwas tippst, erscheint die Leiste <b>📝 Normal · ❗ Wichtig · 🏎️ Express</b>. Normal ist angehakt; Wichtig oder Express anhaken – auch beides. Immer zeigen: ⚙️ → „🔔 Benachrichtigungen“ → <b>„📝❗🏎️ Versand-Leiste immer zeigen“</b>.", los: () => einstiegHin("benachrichtigung", "setWichtigFrage") },
  { id: "teilen-ablagekorb", sym: "📥", t: "Wie schicke ich Fotos oder Dateien aus anderen Apps an den Club?", x: "In der Galerie, in WhatsApp, Mail oder im Dateimanager auf <b>Teilen → Köcheclub</b> tippen (die App muss installiert sein). Alles landet im <b>📥 Ablagekorb</b> – bis 10 Dateien, jeder Dateityp. Hansi bekommt Bescheid und legt es ins Fotoalbum, ins Archiv oder gibt es weiter. Gibt es die Datei schon, sagt dir die App das." },
  { id: "schreibt-dir", sym: "✍️", t: "Was heißt oben „… schreibt dir gerade“?", x: "Jemand schreibt dir im Zweier-Chat gerade eine Nachricht (oder <b>diktiert</b> sie, oder nimmt eine <b>Sprachnachricht</b> auf), während du woanders in der App bist. Gleich kommt also etwas. Antippen öffnet den Chat." },
  { id: "tippton-aus", sym: "🔇", t: "Wie schalte ich das Tippgeräusch schnell aus?", x: "Im Chat in der kleinen Zeile über dem Schreibfeld auf den Lautsprecher <b>🔊</b> tippen – dann steht dort 🔇. Nochmal tippen schaltet die zuletzt gewählte Art wieder ein (Tastatur oder Schreibmaschine).", los: () => zeige("nachrichten") },
  { id: "graue-haken", sym: "✔️", t: "Warum hat meine Nachricht erst nur einen Haken?", x: "<b>Ein grauer Haken</b> = gesendet. <b>Zwei graue</b> kommen, sobald die Mitteilung auf dem anderen Handy erscheint oder seine App die Nachricht lädt. Bleibt es lange bei einem, ist das Handy aus, ohne Netz oder hat die Benachrichtigungen abgeschaltet. <b>Blau</b> = gelesen.", los: () => zeige("nachrichten") },
  { id: "erstattung-pdf", sym: "📄", t: "Kann ich meinen Erstattungsantrag ausdrucken?", x: "Ja – nach dem Einreichen bietet die App den Antrag auf dem <b>Club-Briefbogen</b> an: <b>📄 PDF speichern / teilen</b> oder <b>🖨️ Drucken</b>, mit Feldern für die Unterschriften. Ein PDF gibt es in jeder Druckvorschau der App.", los: () => zeige("erstattung") },
  { id: "vorschlag-sitzung-offen", sym: "📅", t: "Die nächste Sitzung hat noch kein Datum – kann ich trotzdem etwas vorschlagen?", x: "Ja. Beim Vorschlag unter „Für welchen Termin?“ <b>„📅 Nächste/Übernächste Sitzung – Datum noch offen“</b> wählen. Sobald die Sitzung im Kalender steht, ordnet die App den Vorschlag selbst zu.", los: () => zeige("vorschlaege") },
  { id: "wildwest", sym: "🤠", t: "Gibt es ein Thema mit Cowboys und Indianern?", x: "Ja – das Thema <b>🤠 Wilder Westen</b>: Tipi mit Lagerfeuer, Indianer und Häuptling (aus seiner Friedenspfeife steigt dein Vorname in Rauchschrift auf), Kakteen, Steppenläufer, Cowboys, Postkutsche, ein Duell und zum Schluss die große Büffelherde. Unter ⚙️ → „✨ Effekte“ → 🤠 Wilder Westen gibt es eine Vorschau.", los: () => einstiegHin("effekte", "jzWahl") },
  { id: "seifenblasen", sym: "🫧", t: "Gibt es ein Thema mit Seifenblasen?", x: "Ja – das Thema <b>🫧 Seifenblasen</b>: Kinder pusten Seifenblasen, die platzen und die Scheibe verschmieren, dicke Blasen wirken kurz wie ein Fischauge – und der Fensterputzer putzt alles wieder sauber. Unter ⚙️ → „✨ Effekte“ → 🫧 Seifenblasen gibt es eine Vorschau.", los: () => einstiegHin("effekte", "jzWahl") },
  { id: "baustelle", sym: "🚧", t: "Gibt es ein Thema mit Bagger und Sprengung?", x: "Ja – das Thema <b>🚧 Baustelle</b>: Ein gelber Radlader schaufelt Erde auf einen Kipplaster, seine Abgase schreiben deinen Vornamen, Bauarbeiter laufen durch – und zum Schluss sprengt das Sprengkommando den ganzen Kopf in die Luft. Unter ⚙️ → „✨ Effekte“ → 🚧 Baustelle gibt es eine Vorschau.", los: () => einstiegHin("effekte", "jzWahl") },
  { id: "wueste", sym: "🐪", t: "Gibt es ein Thema mit Pyramiden und Pharao?", x: "Ja – das Thema <b>🐪 Wüste</b>: Pyramiden, Oase, Karawane, der Pharao auf seiner Sänfte und ein Flaschengeist aus der Lampe, der deinen Vornamen aus Goldstaub in den Himmel schreibt – zum Schluss ein Sonnenuntergang mit Sternen. Unter ⚙️ → „✨ Effekte“ → 🐪 Wüste gibt es eine Vorschau.", los: () => einstiegHin("effekte", "jzWahl") },
  // 2.508.0 KC-CLUB-HILFE-NACHTRAG-3: Fragen zu den neuen Möglichkeiten (nur Mitglieder-Funktionen)
  { id: "dienst-uebersicht", sym: "📊", t: "Wo sehe ich, wer wann beim Weihnachtsmarkt kann?", x: "Tippe in <b>🗓️ Dienstpläne</b>, in <b>„Mein Dienst“</b> oder in den Dienstwünschen auf <b>📊</b>. Die Übersicht zeigt deine Zeiten und die der Mitglieder, die ihre Zeiten freigegeben haben.", los: () => zeige("dienste") },
  { id: "tippgeraeusche", sym: "⌨️", t: "Kann ich hören, wenn jemand tippt?", x: "Ja – wenn die andere Person <b>„Andere sehen live, was ich tippe“</b> eingeschaltet hat. Unter ⚙️ → „🔔 Benachrichtigungen“ → <b>„⌨️ Tippgeräusche“</b> wählst du Tastatur oder Schreibmaschine.", los: () => einstiegHin("benachrichtigung", "setTippTon") },
  { id: "kachel-ecken", sym: "📐", t: "Können die Kacheln runder oder eckiger sein?", x: "Ja: ⚙️ → „✨ Effekte“ → <b>„📐 Ecken der Kacheln“</b> – den Regler nach links schieben macht sie eckig, nach rechts fast rund. <b>↺ Standard</b> stellt die normalen Ecken wieder her. Gilt für dieses Gerät.", los: () => einstiegHin("effekte", "setKachelEcken") },
  { id: "schatten", sym: "🌗", t: "Kann ich Knöpfe und Kacheln mit Schatten versehen?", x: "Ja: ⚙️ → „✨ Effekte“ → <b>„🌗 Schatten“</b> einschalten und unter <b>„🌗 Schatten einstellen“</b> Stärke (leicht bis sehr kräftig), Farbe (automatisch, Schwarz, Braun, Weinrot, Blau, Grün, Gold oder eine eigene) und Position (unten, unten rechts/links, oben oder rundum) wählen. Gilt für dieses Gerät.", los: () => einstiegHin("effekte", "setSchatten") },
  { id: "kopf-effekt", sym: "🎪", t: "Kann der Kopf anders zugehen als mit der Jalousie?", x: "Ja: ⚙️ → „✨ Effekte“ → <b>„🪟 Anderer Effekt beim Einrollen des Kopfes“</b> – Lamellenvorhang, Climber, Theatervorhang, Servierglocke, Marktbude, Automatisch oder passend zum Thema. <b>▶ Ausprobieren</b> zeigt ihn sofort.", los: () => einstiegHin("effekte", "setKopfEffekt") },
  { id: "geburtstag-vogel", sym: "🎁", t: "Warum fliegt oben ein Vogel mit einem Paket?", x: "Dann hat heute jemand aus dem Club Geburtstag! 🎂 Das Paket platzt, ein Blumenstrauß und „Happy Birthday“ erscheinen. Abschalten: ⚙️ → „✨ Effekte“ → <b>„🎁 Geburtstags-Vogel“</b>.", los: () => einstiegHin("effekte", "setGbVogel") },
  { id: "vorschlag-aendern", sym: "✏️", t: "Wie ändere ich meinen Vorschlag?", x: "Bei <b>🗳️ Vorschläge</b> an deinem offenen Vorschlag auf <b>„✏️ Bearbeiten“</b> tippen – Thema, Beschreibung, Termin und Anlagen lassen sich ändern.", los: () => zeige("vorschlaege") },
  { id: "protokoll-drucken", sym: "🖨️", t: "Wie drucke ich ein Protokoll?", x: "Protokoll öffnen und auf <b>„🖨️ Drucken / PDF“</b> tippen. Über das Teilen-Menü geht es auch als PDF.", los: () => zeige("protokolle") },
  { id: "link-vorschau", sym: "🔗", t: "Warum steht unter meinem Link eine Karte mit Bild?", x: "Das ist die <b>Link-Vorschau</b>: Die App holt zu einem Link Titel, kurzen Text und Bild der Seite – wie bei WhatsApp. Vor dem Senden kannst du sie mit <b>✖</b> an der Karte weglassen. Manche Seiten erlauben keine Vorschau, dann kommt nur der Link." },
  // 2.344.0 KC-CLUB-HILFE-NACHTRAG: häufige Fragen zu den neuen Möglichkeiten
  { id: "video-stimme", sym: "🗣️", t: "Die Stimme in den Videos klingt komisch – kann ich eine andere nehmen?", x: "Ja! Tippe im laufenden Video oben auf <b>🗣️</b> oder unten in der Liste der Erklär-Videos auf <b>🗣️ Stimme &amp; Tempo</b>. Mit <b>▶ Probe</b> hörst du jede Stimme, dann tippst du deine an. Besonders gut klingen die <b>⬇️ Stimmen zum Herunterladen</b> – ein Tipp lädt sie aufs Gerät. Auch das Tempo stellst du dort ein. Ist keine gut, steht dort, wie du eine bessere Stimme ins Handy lädst.", los: () => stimmenWahl() },
  { id: "video-verweis", sym: "🎬", t: "Das Video fragt nach einem anderen Video – was jetzt?", x: "Zu manchen Themen gibt es ein eigenes Erklär-Video, zum Beispiel zu Farben und Themen oder zum Eselsohr. Dann fragt das Video: <b>▶ Ja</b> spielt es sofort ab, danach geht es an derselben Stelle weiter. <b>Nein</b> läuft einfach weiter. <b>⏰ Später</b> merkt es dir mit 📌 – in der Liste der Erklär-Videos ist es schon angehakt. <b>🔕 Nicht mehr fragen</b> schaltet die Frage ab; wieder an geht es unten in der Liste der Erklär-Videos." },
  { id: "aussehen", sym: "🎨", t: "Wie passe ich das Aussehen der App an?", x: "Am schnellsten mit einem <b>🎭 Thema</b>: ⚙️ → „🎨 Darstellung“ → Themen – ein Tipp stellt Farben, Bild im Kopf, Sende-Effekt und Schrift passend ein. Einzeln geht es auch: Farbdesign, Tag/Nacht, große Schrift (Darstellung) sowie Jahreszeiten-Bild, Deko an der Leiste und Effekte (⚙️ → „✨ Effekte“). Das Erklär-Video „🎨 Meine App nach meinem Geschmack“ zeigt alles.", los: () => rgListeAbspielen(["anpassen"]) },
  { id: "kopf-ruhig", sym: "🍂", t: "Warum bewegt sich oben im Kopf nichts?", x: "Dann ist entweder <b>„🍂 Jahreszeiten im Kopf“</b> aus (⚙️ → „✨ Effekte“), <b>„✨ Animierte Knöpfe“</b> aus – oder der <b>🐢 Sparmodus</b> hat sich eingeschaltet (⚙️ → „🎨 Darstellung“). Tippst du in den Effekten eine Vorschau an, sagt die App dir den Grund und schaltet mit einem Tipp wieder ein.", los: () => einstiegHin("effekte", "jzWahl") },
  { id: "raetsel", sym: "🧩", t: "Wie spiele ich das Rätsel?", x: "Eselsohr unten rechts am Kopf doppelt antippen → Reiter <b>🧩 Rätsel</b>. Das Bild wird schärfer – erkannt? <b>Roten Buzzer</b> drücken und einen der 6 Tipps wählen. Das <b>🏆 Wochen-Rätsel</b> zählt für die Club-Bestenliste.", los: () => esOeffnen("raetsel") },
  { id: "nachricht", sym: "💬", t: "Wie schreibe ich jemandem eine Nachricht?", x: "Tippe auf <b>💬 Nachrichten</b> und dann auf <b>„＋ Neu“</b>. Wähle das Mitglied aus, schreib deinen Text und tippe auf Senden. Schneller geht es bei <b>👥 Mitglieder</b>: bei der Person auf die Sprechblase <b>💬</b> tippen.", los: () => zeige("nachrichten") },
  { id: "gruppen-admin", sym: "👑", t: "Was ist ein Gruppen-Admin?", x: "Der <b>👑 Gruppen-Admin</b> verwaltet eine Gruppe: Name und Symbol ändern, Mitglieder dazunehmen oder entfernen, die Gruppe löschen. Das ist, wer sie angelegt hat – und jeder, den er unter <b>✏️ Gruppe bearbeiten</b> mit <b>👑</b> dazu macht." },
  { id: "gruppe", sym: "👥", t: "Wie lege ich eine Gruppe an?", x: "Bei <b>💬 Nachrichten</b> auf <b>„👥 Gruppe“</b> tippen. <b>Name &amp; Symbol</b> wählen, bei <b>„Wer ist dabei?“</b> die Mitglieder anhaken und <b>„👥 Gruppe anlegen“</b> tippen.", los: () => zeige("gruppe") },
  { id: "foto-schicken", sym: "📷", t: "Wie schicke ich ein Foto im Chat?", x: "Im Chat unten auf die <b>Büroklammer 📎</b> bzw. das Kamera-Symbol tippen, Foto wählen oder aufnehmen und senden. Für alle sichtbar wird ein Foto im <b>📷 Fotoalbum</b> (dort <b>„＋ Neu“</b>).", los: () => zeige("nachrichten") },
  { id: "foto-album", sym: "📷", t: "Wie lade ich Fotos ins Fotoalbum?", x: "Tippe auf <b>📷 Fotoalbum</b> und dann auf <b>„＋ Neu“</b>. Bilder auswählen – fertig. Mit <b>„☑️ Auswählen“</b> legst du Bilder in ein eigenes Album, z. B. „Weihnachtsmarkt“.", los: () => zeige("fotos") },
  { id: "zusagen", sym: "✅", t: "Wie sage ich für einen Termin zu oder ab?", x: "Bei <b>📅 Termine</b> den Termin antippen und <b>✅ Ich komme</b>, <b>❓ Vielleicht</b> oder <b>❌ Kann nicht</b> wählen. Nochmal antippen nimmt die Antwort zurück.", los: () => zeige("termine") },
  { id: "termin-neu", sym: "📅", t: "Wie trage ich einen eigenen Termin ein?", x: "Bei <b>📅 Termine</b> auf <b>„＋ Neu“</b> tippen. Private Termine sieht nur du. Mit einer <b>Terminanfrage</b> fragst du andere Mitglieder, ob sie Zeit haben.", los: () => zeige("termine") },
  { id: "naechstes-treffen", sym: "📅", t: "Wann ist das nächste Treffen?", x: "Das nächste Treffen ist der erste Punkt im <b>📣 Info-Laufband</b> oben auf der Startseite – dort sagst du mit <b>✔ Zusagen</b> oder <b>✖</b> gleich zu oder ab. Alle Termine findest du unter <b>📅 Termine</b> – als Liste oder Kalender.", los: () => zeige("termine") },
  { id: "mitfahren", sym: "🚗", t: "Wie finde ich eine Mitfahrgelegenheit?", x: "Erst beim Termin <b>✅ Ich komme</b> tippen – danach kannst du eine <b>Mitfahrt suchen oder anbieten</b>.", los: () => zeige("termine") },
  { id: "anrufen", sym: "📞", t: "Wie rufe ich ein Mitglied an?", x: "Bei <b>👥 Mitglieder</b> die Person antippen. Hat sie ihre Nummer freigegeben, kannst du direkt anrufen. Sonst schreib ihr eine Nachricht mit <b>💬</b>.", los: () => zeige("mitglieder") },
  { id: "online", sym: "🟢", t: "Wer ist gerade in der App?", x: "Bei <b>👥 Mitglieder</b> zeigt ein <b>grüner Punkt</b>, wer gerade online ist. Mit der Hand <b>👋</b> kannst du dort anklopfen. Auf Wunsch sagt die App sogar an, wer gerade reinkommt (⚙️ → 🔔 Töne).", los: () => zeige("mitglieder") },
  // 2.396.0 KC-CLUB-HILFE-NEUHEITEN: Express, Zurückholen, Favoriten, Später senden
  { id: "express", sym: "🏎️", t: "Wie schicke ich eine Express-Nachricht – und wie viele darf ich?", x: "Im Chat über dem Schreibfeld <b>🏎️ Express</b> anhaken, dann senden. Sie kommt <b>sofort</b> an – auch nachts und bei stummem Chat – und beim Empfänger geht ein Fenster auf. Unter deiner Nachricht siehst du <b>„angekommen um …“</b> und <b>„gelesen um …“</b>. Pro Tag gehen <b>5 Express-Sendungen</b>; neben Express steht, wie viele du schon hattest (z. B. <b>2/5</b>).", los: () => zeige("nachrichten") },
  { id: "zurueckholen", sym: "↩️", t: "Ich habe mich vertippt – kann ich die Nachricht zurückholen?", x: "Ja, solange sie noch <b>niemand gelesen</b> hat: Nachricht antippen (am PC: rechte Maustaste) → <b>„↩️ Zurückholen und ändern“</b>. Sie verschwindet bei allen und steht wieder in deinem Schreibfeld – verbessern und neu senden. Ist sie schon gelesen, kannst du sie noch <b>✏️ bearbeiten</b>.", los: () => zeige("nachrichten") },
  { id: "favoriten", sym: "⭐", t: "Wie lege ich Favoriten an?", x: "Am einfachsten in <b>👥 Mitglieder</b>: beim Mitglied auf den Stern <b>☆</b> tippen – er wird gelb ⭐. Oder in <b>💬 Nachrichten</b> rechts am Chat auf <b>⋯</b> tippen → <b>„⭐ Als Favorit“</b>. Es ist <b>derselbe Stern</b>: Er erscheint in der Mitgliederliste und bei den Chats unter <b>⭐ Favoriten</b>. Nochmal tippen nimmt ihn weg.", los: () => { zeige("nachrichten"); uhFavAnsicht(true); } },
  { id: "ausweis", sym: "🪪", t: "Wo ist mein Ausweis-QR für Kasse und Stechuhr?", x: "Auf der Startseite neben <b>Schnellzugriff</b> auf <b>QR</b> tippen – oder <b>Meins → 🪪 Mein Ausweis-QR</b>. Darin steht deine <b>Mitgliedsnummer</b>, wie auf dem Plastik-Ausweis. Vor den Scanner an der Kasse oder Stechuhr halten, Bildschirm hell stellen.", los: () => ausweisZeigen() },
  { id: "spaeter", sym: "⏰", t: "Kann ich eine Nachricht später senden lassen?", x: "Ja: Nachricht schreiben, unten auf <b>⏰</b> tippen, Zeit wählen (z. B. morgen 8 Uhr) und wie oft (einmal, jeden Tag, jeden Montag …). Bis dahin steht sie blass im Chat – nur du siehst sie.", los: () => zeige("nachrichten") },
  { id: "zettel", sym: "📌", t: "Wie hänge ich einen Zettel an die Pinnwand?", x: "Tippe auf <b>📌 Pinnwand</b> und dann auf <b>„＋ Zettel“</b>. Text schreiben (oder 🎤 sprechen) und aufhängen. Auf Zettel anderer antwortest du mit Emojis.", los: () => zeige("pinnwand") },
  { id: "hilfe-suchen", sym: "🙋", t: "Ich brauche Hilfe von anderen – was tun?", x: "Unter <b>🤝 Helfen &amp; Leihen</b> → <b>🙋 Wer kann helfen?</b> mit <b>„＋ Neu“</b> einen Hilfe-Aufruf anlegen. Du wählst, ob er an die Pinnwand kommt, per Push oder per E-Mail rausgeht.", los: () => zeige("helfen") },
  { id: "leihen", sym: "📦", t: "Wie leihe ich etwas vom Club aus?", x: "Unter <b>🤝 Helfen &amp; Leihen</b> → <b>📦 Ausleihen</b> reservierst du Club-Sachen wie den Pavillon für deinen Tag.", los: () => zeige("helfen") },
  { id: "boerse", sym: "🛍️", t: "Wie biete ich privat etwas an oder suche etwas?", x: "Unter <b>🤝 Helfen &amp; Leihen</b> → <b>🛍️ Börse</b> mit <b>„＋ Neu“</b>: Biete oder Suche wählen, gern mit Foto. Ein Angebot bleibt 30 Tage stehen.", los: () => hlStart("boerse") },
  { id: "vorschlag", sym: "🗳️", t: "Wie mache ich einen Vorschlag für den Club?", x: "Bei <b>🗳️ Vorschläge</b> auf <b>„＋ Neu“</b> tippen und deine Idee beschreiben – die anderen können abstimmen.", los: () => zeige("vorschlaege") },
  { id: "dienstwunsch", sym: "📝", t: "Wie trage ich meine Dienstwünsche ein?", x: "Tippe auf <b>🗓️ Mein Dienst</b> → <b>„📝 Wünsche eintragen“</b> (in der einfachen und der erweiterten Ansicht gleich). Twinkey führt dich Tag für Tag durch: wann du kannst, wann lieber nicht. Gespeichert wird es für die Dienstplanung.", los: () => dwOeffnen() },
  { id: "dienstplan", sym: "🗓️", t: "Wo sehe ich den Dienstplan?", x: "Unter <b>🗓️ Dienstpläne</b> – Woche für Woche. Mit <b>‹ Woche</b> / <b>Woche ›</b> blätterst du, <b>„Heute“</b> springt zurück.", los: () => zeige("dienste") },
  { id: "protokoll", sym: "📄", t: "Wo finde ich die Protokolle?", x: "Unter <b>📄 Protokolle</b>. Neue sind markiert, bis du sie geöffnet hast. Ältere stehen auch im <b>🗄️ Archiv</b> nach Jahren.", los: () => zeige("protokolle") },
  { id: "archiv", sym: "🗄️", t: "Wo finde ich alte Sachen und meinen Ordner?", x: "Im <b>🗄️ Archiv</b>: Ordner nach Jahren mit Terminen, Protokollen und Fotos, die <b>Clubchronik</b> zum Blättern – und dein <b>eigener Ordner</b>, den nur du siehst.", los: () => zeige("archiv") },
  { id: "handbuch", sym: "📚", t: "Gibt es eine Anleitung zum Lesen oder Drucken?", x: "Ja – unter <b>📚 Meine Dokumente</b> liegt die <b>Bedienungsanleitung</b> der Club-App. Dort kannst du sie lesen, drucken oder teilen.", los: () => zeige("dokumente") },
  { id: "geld", sym: "💶", t: "Wie bekomme ich ausgelegtes Geld zurück?", x: "Über <b>💶 Erstattung</b>: Fahrtkosten (die Kilometer rechnet die App aus), Einkauf, Parkgebühren, Kraftstoff (nur Miet- oder Clubfahrzeug), Kaution oder sonstige Auslagen eintragen, je Position angeben, ob ein Bon da ist (Foto, Papier oder nein), abschicken. Der Kassenwart bekommt es, du eine Bestätigung.", los: () => zeige("erstattung") },
  { id: "adresse", sym: "✏️", t: "Ich bin umgezogen – wie melde ich die neue Adresse?", x: "Tippe auf <b>✏️ Meine Daten haben sich geändert</b> (Register „Meins“) und dann auf <b>Neue Anschrift</b>. Die Meldung geht von selbst an die Richtigen im Club.", los: () => aeStart() },
  { id: "status", sym: "🙂", t: "Wie zeige ich, dass ich im Urlaub oder krank bin?", x: "Mit <b>„Mein Status“</b> oben auf der Startseite: z. B. 🏖️ Urlaub oder 🤒 krank wählen – die anderen sehen es bei deinem Namen.", los: () => statusBlatt() },
  { id: "geburtstag", sym: "🎂", t: "Wie gratuliere ich zum Geburtstag?", x: "Hat jemand Geburtstag, steht es oben im <b>Info-Feld</b> der Startseite. Mit einem Tipp schickst du deinen Glückwunsch." },
  { id: "notfall", sym: "🆘", t: "Was mache ich im Notfall?", x: "Tippe auf <b>🆘 SOS</b>: oben stehen die <b>Notrufnummern</b> (112, 110) zum Anrufen, mit <b>📍 Wo bin ich?</b> siehst du deinen Standort zum Durchgeben. Bei Lebensgefahr immer zuerst <b>112</b> anrufen.", los: () => zeige("sos") },
  { id: "standort", sym: "📍", t: "Wie teile ich meinen Standort?", x: "Unter <b>📍 Standorte</b> oben auf <b>„📍 Teilen“</b> tippen und die Dauer wählen. Danach verschwindet dein Standort von selbst.", los: () => zeige("standort") },
  { id: "spielen", sym: "🎲", t: "Wie spiele ich gegen andere Mitglieder?", x: "Unter <b>🎲 Spiele</b> dein Spiel wählen und <b>👥 Gegen Mitglieder</b> tippen. Jemanden herausfordern – ihr zieht abwechselnd, du bekommst Bescheid, wenn du dran bist.", los: () => spStart() },
  { id: "diktieren", sym: "🎤", t: "Kann ich sprechen statt tippen?", x: "Ja – überall, wo ein <b>🎤</b> im Feld steht: antippen, sprechen, fertig. Im Chat gibt es dazu Sprachnachrichten." },
  { id: "kosten", sym: "💚", t: "Kostet die Club-App etwas?", x: "Nein. Die Köcheclub-App ist für alle Mitglieder <b>kostenlos</b> – ohne Werbung und ohne Abo." },
  { id: "daten", sym: "🔒", t: "Sind meine Daten sicher? Wer sieht was?", x: "Deine Daten sieht nur der Club. Was andere Mitglieder von dir sehen (z. B. Telefonnummer, „zuletzt da“), stellst du selbst unter <b>⚙️ Einstellungen</b> → Privatsphäre ein.", los: () => zeige("einstellungen") },
  { id: "update", sym: "🔄", t: "Wie bekomme ich die neueste Version?", x: "Die App holt Neuerungen von selbst. Steht oben ein Hinweis auf eine neue Version, einfach antippen. Hängt etwas, die App einmal ganz schließen und neu öffnen." },
  { id: "ruhe", sym: "🌙", t: "Wie stelle ich ein, dass mich nachts nichts stört?", x: "Unter <b>⚙️ Einstellungen</b> bei <b>„Nicht stören“</b> die Ruhezeit einschalten (z. B. 22–7 Uhr). In der Zeit kommt kein Push – was du verpasst, bekommst du danach gesammelt. Auch die Uhr zur vollen Stunde (Kuckuck, Big Ben …) bleibt dann still.", los: () => zeige("einstellungen") },
  { id: "feedback", sym: "💭", t: "Wie melde ich einen Fehler oder einen Wunsch?", x: "Unter <b>💭 Feedback</b> aufschreiben, was stört oder fehlt – es geht direkt an Hansi.", los: () => zeige("feedback") },
  { id: "mitglied-fragen", sym: "👥", t: "Kann ich auch andere Mitglieder etwas fragen?", x: "Ja – bei <b>🧑‍🍳 Frag Twinkey</b> auf <b>„👥 Lieber ein Mitglied fragen“</b> tippen. Frage schreiben (oder 🎤 sprechen), <b>alle</b> oder einzelne Mitglieder anhaken und wählen, wie die Frage ankommt: 📱 Club-App, 🔔 Push oder ✉️ E-Mail. Die Antworten siehst du bei Twinkey unter <b>„👥 Deine Fragen an Mitglieder“</b>. Wirst du selbst gefragt, antwortest du dort unter <b>„❓ Fragen an dich“</b> – oder tippst „🤷 Ich weiß es nicht“, „🔎 Ich recherchiere“ oder „🚫 Bitte nicht mehr fragen“.", los: () => mfFormular() },
  // 2.252.0 KC-CLUB-TWINKEY-BILD (Fund Hansi: Wilfried fragte „Kochbild“ – Twinkey kannte es nicht): eigenes Bild / Koch-Figur
  { id: "mein-bild", sym: "🧑‍🍳", t: "Wie bekomme ich ein Kochbild (Koch-Figur) statt meiner Buchstaben?", nur: () => frei("avatar"),
    x: "Im Register <b>Meins</b> auf <b>„🧑‍🍳 Mein Bild“</b> tippen. Unter <b>„🙂 Einfache Figuren“</b> (oder, sobald freigeschaltet, <b>„👑 Hochwertige Figuren“</b>) eine Koch-Figur antippen – oben siehst du sie groß – und <b>„✅ Übernehmen“</b>. Dein Bild erscheint bei den Mitgliedern, im Chat und bei „Wer ist online“. Mit <b>„Kein Bild“</b> hast du wieder deine Buchstaben.", los: () => avWahl() },
  // 2.415.0 KC-CLUB-AVATAR-HILFE: hochwertige Avatare, Schmuck, eigene Brille
  { id: "avatar-hochwertig", sym: "👑", t: "Was sind die hochwertigen Avatare?", nur: () => frei("avatar") && frei("avatar_premium"),
    x: "36 neue Koch-Figuren – 18 Köchinnen, 18 Köche – mit Licht und Schatten gezeichnet, jung und älter, mit Schmuck, Brillen, Mützen und vielen Kochjacken. Du findest sie in <b>„🧑‍🍳 Mein Bild“</b> unter <b>„👑 Hochwertige Figuren“</b>. Jede kannst du mit <b>„✏️ Bearbeiten“</b> anpassen. Deine bisherige Figur bleibt, bis du eine andere wählst.", los: () => avWahl() },
  { id: "avatar-schmuck", sym: "💎", t: "Kann meine Figur Ohrringe, Kette oder Piercing tragen?", nur: () => frei("avatar") && frei("avatar_baukasten"),
    x: "Ja: In <b>„🧑‍🍳 Mein Bild“</b> → <b>„🧩 Individuell anpassen“</b> auf <b>Ohrringe</b>, <b>Halskette</b> oder <b>Piercing</b> tippen – du landest direkt bei der Auswahl. Jede Möglichkeit siehst du als kleines Bild an deiner Figur. Zum Schluss <b>„💾 Speichern“</b>.", los: () => avBauen(undefined, "26") },
  { id: "avatar-brille", sym: "👓", t: "Kann ich meine eigene Brille verwenden?", nur: () => frei("avatar") && frei("avatar_baukasten"),
    x: "Im Baukasten gibt es viele Brillen – rund, eckig, randlos, Panto, Browline, Sonnenbrille und mehr, in vielen Farben. Ist deine nicht dabei, <b>mach ein Foto von deiner Brille und schick es an Hansi</b>: Sie wird als eigene Form nachgezeichnet – so ist „randlos“ nach Hansis Foto entstanden.", los: () => avBauen(undefined, "5") },
  { id: "figur-bauen", sym: "🧩", t: "Wie stelle ich meine Koch-Figur selbst zusammen oder ändere sie?", nur: () => frei("avatar") && frei("avatar_baukasten"),
    x: "In <b>„🧑‍🍳 Mein Bild“</b> auf <b>„🧩 Selbst zusammenstellen“</b> tippen – oder erst eine Figur antippen und dann <b>„✏️ Bearbeiten“</b>. Oben bringen dich die Kacheln direkt zur richtigen Stelle. Teil für Teil wählen: Koch oder Köchin, Haare, Kopfbedeckung (auch Nikolausmütze, Cowboyhut, Krone …), Bart, Gesicht, Brille, Schmuck, Kochjacke, Schürze, Hintergrund – und, sobald freigeschaltet, den Stil: klassisch oder hochwertig. Oben siehst du alles sofort. Zum Schluss <b>„💾 Speichern“</b>.", los: () => avBauen() },
  // 18.10.2026 KC-CLUB-HILFE-AKTUELL: Fragen zu den neuen Funktionen
  { id: "sonderstunden-melden", sym: "★", t: "Wie melde ich Sonderstunden von einem Einsatz?", x: "Unter <b>📝 Dienstwunsch</b> hilft dir Twinkey: <b>„Sonderstunden melden“</b> wählen, dann Einsatz, Tag, Zeit von zuhause bis zuhause, Tätigkeit und wer noch dabei war. Den Stand siehst du in <b>🗓️ Mein Dienst</b> → „★ Sonderstunden“.", los: () => mdStart() },
  { id: "wer-gelesen", sym: "✔️", t: "Wer hat meine Nachricht schon gelesen?", x: "Tipp im Chat auf die <b>Haken</b> an deiner Nachricht: Du siehst „Gelesen von“ (blaue ✓✓) und „Zugestellt an“ (graue ✓✓) mit Uhrzeit sowie „Noch nicht zugestellt“.", los: () => zeige("nachrichten") },
  { id: "kuckuck-still", sym: "🔊", t: "Warum höre ich den Kuckuck nicht?", x: "Das Handy gibt den Ton erst frei, wenn du in der App einmal getippt hast. Tipp zur vollen Stunde auf <b>„🔊 Antippen – der Kuckuck ruft …“</b>, dann ruft er hörbar. Während deiner Ruhezeit bei „Nicht stören“ (⚙️ Einstellungen) bleibt er absichtlich still – ohne Ruhezeit ruft er auch nachts. Ein- und ausschalten: ⚙️ → ✨ Effekte → „🕰️ Uhr zur vollen Stunde“.", los: () => einstiegHin("effekte", "setKuckuck") },
  // 2.300.0 KC-CLUB-RUECKSEITE-HILFE: Fragen zur Rückseite (Eselsohr)
  { id: "eselsohr", sym: "📄", t: "Was ist das Eselsohr am Kopf?", nur: () => esAn(), x: "Die umgeknickte Ecke unten rechts am grünen Kopf. <b>Doppelt tippen</b> – der Kopf dreht sich um: 🖼️ Diashow, 🖍️ Tafel, 📋 Flipchart, 🕰️ Uhr, 🎭 Bühne und 🪞 Spiegel. Nochmal doppelt tippen dreht zurück.", los: () => esOeffnen(null) },
  { id: "skizze", sym: "📋", t: "Wo kann ich etwas skizzieren oder aufmalen?", x: "Auf der Rückseite des Kopfes: <b>🖍️ Tafel</b> oder <b>📋 Flipchart</b> (umblättern, kariert oder liniert). Mit <b>„📤 Sichern“</b> ins Archiv oder als Nachricht.", los: () => esOeffnen("flip") },
  { id: "buehne", sym: "🎭", t: "Wie mache ich mit Twinkey Bewegung zu Musik?", x: "Kopf umdrehen (doppelt aufs Eselsohr) → <b>🎭 Bühne</b>: im Sitzen, im Stehen oder mit Küchenhelfern wählen, Dauer einstellen, <b>„▶️ Vorhang auf!“</b>. Twinkey turnt vor und feuert dich an.", los: () => esOeffnen("buehne") },
  { id: "buehne-laut", sym: "🎚️", t: "Die Musik oder Twinkeys Stimme ist zu laut oder zu leise", x: "Auf der Bühne: <b>rechts</b> der Regler für die Musik, <b>links</b> für die Stimme – hochziehen = lauter, runter = leiser. Unten aufs Symbol tippen = stumm, nochmal = wieder an.", los: () => esOeffnen("buehne") },
  { id: "grosse-uhr", sym: "🕰️", t: "Gibt es eine große Uhr?", x: "Ja – auf der Rückseite des Kopfes unter <b>🕰️ Uhr</b>: digital grün, Fallblatt mit Datum, Bahnhofsuhr oder groß &amp; klar.", los: () => esOeffnen("uhr") },
  { id: "diashow", sym: "🖼️", t: "Kann ich die Fotos als Diashow ansehen?", x: "Ja – am einfachsten im <b>📷 Fotoalbum</b> oben auf <b>„▶️ Diashow“</b>: 🎵 Musik an oder aus, Album antippen, los geht's. Oder Kopf umdrehen (doppelt aufs Eselsohr) → <b>🖼️ Diashow</b>. Aufs Foto tippen blendet alles andere aus; mit <b>🔇/🎵</b> läuft unser Club-Song dazu.", los: () => esOeffnen("dia") },
  { id: "spiegel", sym: "🪞", t: "Gibt es einen Spiegel mit Kamera?", x: "Ja – Kopf umdrehen (doppelt aufs Eselsohr) → <b>🪞 Spiegel</b> → <b>„📷 Kamera an“</b>. Mit „🐹 Pausbäckchen“ wird’s lustig. Nichts wird gespeichert oder verschickt.", los: () => esOeffnen("spiegel") }, // 2.314.0
  { id: "kachel_vorschlag_aus", sym: "💡", t: "Wie schalte ich die Vorschläge zur Startseite ab?", x: "Im Vorschlags-Fenster <b>„🔕 Keine Vorschläge mehr“</b> tippen – oder unter ⚙️ → „🧩 Startseite &amp; Ansicht“ den Schalter <b>„💡 Vorschläge zur Startseite“</b> ausschalten. Dort löscht <b>„🧹 Gemerktes löschen“</b> auch alles, was die App sich gemerkt hat.", los: () => suEinstellung("setKachelVorschlag") },
  { id: "einladung", sym: "🎭", t: "Wie schalte ich die Frage nach der Bewegungseinheit ab?", x: "Im Fenster <b>„🔕 Nicht mehr fragen“</b> tippen – oder unter ⚙️ → „🧩 Startseite &amp; Ansicht“ den Schalter <b>„🎭 Twinkey lädt zur Bewegung ein“</b> ausschalten.", los: () => suEinstellung("setBwEinladung") },
  { id: "ueber-twinkey", sym: "🧑‍🍳", t: "Wer ist Twinkey?", x: "Ich bin Twinkey, der Helfer der Köcheclub-App – früher waren auch viele von uns Küchenchefs. Frag mich in deinen Worten. Weiß ich etwas nicht, recherchiere ich und du bekommst die Antwort später." },
];
const twNorm = (t) => String(t || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9 ]+/g, " ");
const twStamm = (w) => (w.length > 4 ? w.replace(/(ungen|ung|en|er|es|e|n|s)$/, "") : w);
const twWoerter = (t) => twNorm(t).split(/\s+/).filter((w) => w.length > 1 && !TW_STOP.has(w));
const TW_GRUPPE = (() => { const m = new Map(); TW_SYN.forEach((g, i) => g.forEach((w) => m.set(twStamm(w), i))); return m; })();
function twAbstand(a, b) { // Tippfehler: höchstens 1 Buchstabe anders (ersetzt, fehlt, zu viel)
  if (Math.abs(a.length - b.length) > 1) return 2; let i = 0, j = 0, f = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++f > 1) return 2; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return f + (a.length - i) + (b.length - j);
}
function twEintraege() { // Hilfen + Twinkeys Fragen + Gelerntes (w:) – alles in einer Liste
  const gelernt = (TW.wissen || []).map((w) => ({ id: "w:" + w.id, thema: "twinkey", sym: "🧑‍🍳", t: w.frage, x: twTextHtml(w.antwort), los: null, gelernt: true }));
  return [...gelernt, ...TW_FAQ.filter((e) => !e.nur || e.nur()).map((e) => ({ id: "f:" + e.id, thema: "twinkey", sym: e.sym, t: e.t, x: e.x, los: e.los || null })), ...hzEintraege()];
}
function twIndex() {
  if (TW_INDEX) return TW_INDEX;
  const div = document.createElement("div"), roh = (h) => { div.innerHTML = h || ""; return div.textContent || ""; };
  TW_INDEX = twEintraege().map((e) => { const tw = twWoerter(e.t).map(twStamm), xw = twWoerter(roh(e.x)).map(twStamm);
    return { e, titel: new Set(tw), text: new Set(xw), gruppen: new Set([...tw, ...xw].map((w) => TW_GRUPPE.get(w)).filter((g) => g !== undefined)), tgruppen: new Set(tw.map((w) => TW_GRUPPE.get(w)).filter((g) => g !== undefined)) }; });
  return TW_INDEX;
}
// passt das Wort q (oder ein Wort derselben Bedeutungsgruppe, ein Tippfehler, ein Teilwort) zu diesem Eintrag?
const TW_SCHWACH = new Set(["gemacht", "macht", "mache", "machen", "tun", "tut", "geht", "gehen", "klappt", "funktioniert", "leicht", "einfach", "schnell", "richtig", "gut", "neu", "alle", "alles", "immer", "bitte", "danke", "hallo", "gibt", "geben", "sehen", "seh", "sieht", "erstellen", "erstelle", "erstellt", "anlegen", "lege", "neue", "neuen", "neuer", "neues", "moechte", "will", "wollen", "brauche", "kann", "koennen", "darf", "muss", "soll"].map((x) => twStamm(x)));
function twTrifft(x, q, g) {
  return x.titel.has(q) || x.text.has(q) || (g !== undefined && (x.tgruppen.has(g) || x.gruppen.has(g)))
    || (q.length >= 5 && [...x.titel, ...x.text].some((t) => t.length >= 5 && twAbstand(q, t) <= 1));
}
function twFinden(fr) {
  const w = [...new Set(twWoerter(fr).map(twStamm))]; if (!w.length) return [];
  // 2.54.0: Wörter, die nirgends in der App vorkommen („Pizza“, „Döner“) – ist das mindestens die Hälfte, geht es nicht um die App
  const fremd = w.filter((q) => !TW_SCHWACH.has(q) && !twIndex().some((x) => twTrifft(x, q, TW_GRUPPE.get(q))));
  if (fremd.length && fremd.length >= w.length - fremd.length) return [];
  const treffer = twIndex().map((x) => {
    let p = 0, n = 0;
    for (const q of w) {
      const g = TW_GRUPPE.get(q);
      if (x.titel.has(q)) p += 3; else if (x.text.has(q)) p += 1.2;
      else if (q.length >= 5 && [...x.titel].some((t) => t.length >= 5 && twAbstand(q, t) <= 1)) p += 2; // Tippfehler
      else if (q.length >= 5 && [...x.text].some((t) => t.length >= 5 && twAbstand(q, t) <= 1)) p += 0.6;
      if (g !== undefined) p += x.tgruppen.has(g) ? 2 : x.gruppen.has(g) ? 0.8 : 0; // anderes Wort für dasselbe
      if (q.length >= 6 && ![...x.titel].includes(q) && [...x.titel].some((t) => t.length >= 5 && ((q.includes(t) && t.length >= q.length * .55) || (t.includes(q) && q.length >= t.length * .55)))) p += 1.2; // zusammengesetzte Wörter („Terminanfrage“ ↔ „Termin“); 2.54.0: nicht „Weihnachten“ ↔ „nachts“
      if (twTrifft(x, q, g)) n++;
    }
    // KC-CLUB-TWINKEY-STRENGER (2.54.0, Fund Hansi „Wie wird Pizza gemacht?“ → „Weitersagen leicht gemacht“): mindestens die Hälfte
    // der wichtigen Wörter muss passen, und nie nur ein Allerweltswort – sonst lieber „Das weiß ich noch nicht“ (→ an den Admin)
    if (n < Math.ceil(w.length / 2) || !w.some((q) => !TW_SCHWACH.has(q) && twTrifft(x, q, TW_GRUPPE.get(q)))) return { e: x.e, p: 0 };
    if (x.e.gelernt) p += 0.6; else if (x.e.id.startsWith("f:")) p += 0.4; else if (x.e.id.startsWith("h:")) p += 0.3; // Gelerntes und Twinkeys Fragen zuerst
    return { e: x.e, p: p / Math.sqrt(w.length) };
  }).filter((t) => t.p >= 1.6).sort((a, b) => b.p - a.p);
  return treffer.slice(0, 4);
}
let TW_TAKT = null;
const TW_MF_KNOPF = `<p class="hinweis" style="margin:8px 0 4px">Vielleicht weiß es jemand aus dem Club?</p><button type="button" class="knopf klein" onclick="mfFormular(($('twFrage')?.value || '').trim())">👥 Ein Mitglied fragen</button>`;
async function twFrageStart(vorgabe = "") {
  const f = blattAuf("twBlatt", `<h3 style="margin:0">🧑‍🍳 Frag Twinkey</h3>
    <p class="hinweis" style="margin:0">Stell deine Frage in eigenen Worten – tippen oder 🎤 sprechen. Zum Beispiel: <i>„Wie ändere ich die Farben?“</i> oder <i>„Wie stelle ich eine Terminanfrage?“</i></p>
    <div class="tw-zeile"><input id="twFrage" data-diktat="einmal" class="hz-suche" type="search" enterkeyhint="send" autocomplete="off" placeholder="Deine Frage …" value="${esc(vorgabe)}" oninput="clearTimeout(TW_TAKT);TW_TAKT=setTimeout(twAntworten,450)" onkeydown="if(event.key==='Enter'){event.preventDefault();twAntworten(null,true)}"><button type="button" class="knopf haupt tw-fragen" onclick="twAntworten(null,true)">➤ Fragen</button></div>
    <button type="button" class="tw-nicht" onclick="mfFormular(($('twFrage')?.value || '').trim())">👥 Lieber ein Mitglied fragen</button>
    <div id="twAntwort"></div><div id="twMf"></div><div id="twMeine"></div><div id="twAdmin"></div>
    <button class="knopf" onclick="$('twBlatt').remove()">Schließen</button>`);
  f.classList.add("tw-blatt");
  if (vorgabe) twAntworten(); else setTimeout(() => $("twFrage")?.focus(), 120);
  await twLaden(); if (!$("twBlatt")) return;
  twMeineZeigen(); twAdminKnopf(); mfZeigen();
  if (($("twFrage")?.value || "").trim()) twAntworten();
}
const TW_HILFETEXT = { "f:mein-bild": "h:mein_bild", "f:figur-bauen": "h:mein_bild", "f:verschluesseln": "h:verschluesselt", "f:schluessel-frage": "h:verschluesselt", "f:schluessel-oeffnen": "h:verschluesselt", "f:schluesselbund": "h:schluesselbund", "f:geheimagent": "h:boten", "f:versand-leiste": "h:versand_leiste", "f:schreibt-dir": "h:schreibt_hinweis", "f:graue-haken": "h:haken" }; // 2.533.0: + Verschlüsseln & Co.
function twVideosHtml(e) {
  const v = (TW_VIDEOS[e.id] || []).map((id) => RUNDGAENGE.find((r) => r.id === id && (!r.nur || r.nur()))).filter(Boolean);
  const h = TW_HILFETEXT[e.id] && hzEintraege().some((x) => x.id === TW_HILFETEXT[e.id]) ? TW_HILFETEXT[e.id] : null;
  if (!v.length) return "";
  return `<div class="tw-videos"><p style="margin:8px 0 6px">📖 Du kannst es ${h ? "im Hilfetext" : "hier oben"} nachlesen. Es gibt aber auch ${v.length === 1 ? "ein Erklär-Video" : "Erklär-Videos"} mit Ton. <b>Was möchtest du dir ansehen?</b></p>
    <div class="tw-video-knoepfe">${h ? `<button type="button" class="knopf" onclick="twHilfetext('${h}')">📖 Hilfetext lesen</button>` : ""}${v.map((r) => `<button type="button" class="knopf" onclick="twVideo('${r.id}')">🎬 ${esc(r.t)}</button>`).join("")}</div></div>`;
}
function twVideo(id) { $("twBlatt")?.remove(); rundgangStart(false, id); }
function twHilfetext(id) { $("twBlatt")?.remove(); hzZuEintrag(id); }
function twAntworten(wahl, gefragt = false) {
  const fr = ($("twFrage")?.value || "").trim(), z = $("twAntwort"); if (!z) return;
  if (twNorm(fr).replace(/\s/g, "").length < 4) { z.innerHTML = gefragt ? '<p class="hinweis">✍️ Bitte erst deine Frage eintippen – oder auf 🎤 tippen und sprechen.</p>' : ""; return; } // 2.481.0 (TÜV B-11): „Fragen“ ohne Text tat nichts
  const t = twFinden(fr), best = (wahl && t.find((x) => x.e.id === wahl)) || t[0];
  if (!best) {
    z.innerHTML = gefragt ? `<div class="karte kc-antwort"><div class="kc-chef">🧑‍🍳 Das ist eine gute Frage.</div><p id="twWeiter" style="margin:4px 0 0">Ich werde recherchieren und dir bei Gelegenheit eine Antwort zukommen lassen.</p>${TW_MF_KNOPF}</div>`
      : `<p class="hinweis" style="margin:4px 0">🤔 Dazu weiß ich noch nichts. Tippe auf <b>➤ Fragen</b> – dann kümmere ich mich darum.</p>`;
    if (gefragt) twWeitergeben(fr);
    return;
  }
  const e = best.e, andere = t.filter((x) => x !== best).slice(0, 3), bew = /^[hte]:/.test(e.id) ? hzBewHtml(e.id) : "";
  z.innerHTML = `<div class="karte kc-antwort vorlese-karte"><div class="kc-chef">🧑‍🍳 ${e.gelernt ? "Das weiß ich inzwischen:" : "Das geht so:"}</div><h3 style="margin:4px 0">${e.sym || "💡"} ${esc(e.t)}</h3><p style="margin:0 0 8px">${e.x}</p>
      <div class="knoepfe">${e.los ? `<button class="knopf haupt" onclick="twZeig('${e.id}')">👉 Zeig es mir</button>` : ""}${VORLESE_KNOPF}</div>${twVideosHtml(e)}${bew}
      <button type="button" class="tw-nicht" onclick="twNichtGefunden()">🙋 Das beantwortet meine Frage nicht</button></div>
    ${andere.length ? `<div class="kc-andere"><b>Oder meintest du:</b>${andere.map((x) => `<button class="ti-zeile" onclick="twAntworten('${x.e.id}')">${x.e.sym || "💡"} <span>${esc(x.e.t)}</span><b>›</b></button>`).join("")}</div>` : ""}`;
}
function twNichtGefunden() {
  const fr = ($("twFrage")?.value || "").trim(), z = $("twAntwort"); if (!z || !fr) return;
  z.innerHTML = `<div class="karte kc-antwort"><div class="kc-chef">🧑‍🍳 Das ist eine gute Frage.</div><p id="twWeiter" style="margin:4px 0 0">Ich werde recherchieren und dir bei Gelegenheit eine Antwort zukommen lassen.</p>${TW_MF_KNOPF}</div>`;
  twWeitergeben(fr);
}
async function twWeitergeben(fr) { // erst nach ausdrücklichem „➤ Fragen“ – nie beim bloßen Tippen
  const p = $("twWeiter");
  try {
    const r = await api("twinkey_frage", { frage: fr });
    if (p && r?.schonDa) p.insertAdjacentHTML("beforeend", "<br><small class=\"hinweis\">Diese Frage hatte ich mir schon notiert.</small>");
    await twLaden(); twMeineZeigen();
  } catch (e) { if (p) p.innerHTML = `⚠️ ${esc(fehlerText(e, "Gerade keine Verbindung."))} Versuch es später noch einmal.`; }
}
function twZeig(id) {
  const e = twEintraege().find((x) => x.id === id); $("twBlatt")?.remove(); if (!e) return;
  if (e.los) { try { e.los(); } catch { if (/^[hte]:/.test(id)) hzZuEintrag(id); } } else if (/^[hte]:/.test(id)) hzZuEintrag(id);
}
function twMeineZeigen() { // „📬 Deine Fragen“ – offen oder mit Antwort
  const z = $("twMeine"); if (!z) return;
  const m = TW.meine || []; if (!m.length) { z.innerHTML = ""; return; }
  z.innerHTML = `<details class="tw-meine"${m.some((x) => x.status === "beantwortet" && !x.gelesen) ? " open" : ""}><summary>📬 Deine Fragen (${m.length})</summary>
    ${m.map((x) => `<div class="tw-frage-zeile"><b>${x.status === "beantwortet" ? (x.gelesen ? "✅" : "🆕") : "⏳"} ${esc(x.frage)}</b>
      ${x.status === "beantwortet" ? `<p style="margin:2px 0 0">${twTextHtml(x.antwort)}</p>` : `<small class="hinweis">Twinkey recherchiert noch …</small>`}</div>`).join("")}</details>`;
  if (m.some((x) => x.status === "beantwortet" && !x.gelesen)) api("twinkey_gelesen").catch(() => {});
}

// ---------- KC-CLUB-MITGLIEDER-FRAGEN (2.23.51, Wunsch Hansi): „👥 Ein Mitglied fragen“ ----------
// An alle, einzelne oder mehrere – per 📱 Club-App, 🔔 Push, ✉️ E-Mail. Die Gefragten antworten mit eigenem Text oder einem Tipp:
// „🤷 Ich weiß es nicht“, „🔎 Ich recherchiere und antworte dir“, „🚫 Bitte nicht mehr fragen“ (umkehrbar). Verschickt wird nur mit „Frage senden“.
const MF_STATUS = { offen: ["📨", "gefragt"], gelesen: ["👁️", "gelesen"], weiss_nicht: ["🤷", "weiß es nicht"], recherchiere: ["🔎", "recherchiert"], beantwortet: ["💡", "hat geantwortet"], nicht_fragen: ["🚫", "möchte nicht gefragt werden"] };
const MF = { alle: false, personen: [], wege: ["app", "push"] };
async function mfFormular(vorgabe = "") {
  try { await zeMitglieder(); } catch (e) { return meldeFehler(e); }
  MF.alle = false; MF.personen = [];
  $("twBlatt")?.remove();
  const f = blattAuf("mfBlatt", `<h3 style="margin:0">👥 Ein Mitglied fragen</h3>
    <p class="hinweis" style="margin:0">Deine Frage geht an die Mitglieder, die du auswählst. Sie können antworten – oder mit einem Tipp sagen, dass sie es nicht wissen.</p>
    <label class="hinweis">Deine Frage<textarea id="mfFrage" rows="3" maxlength="300" data-diktat placeholder="z. B. Wer hat ein gutes Rezept für Pizzateig?">${esc(vorgabe)}</textarea></label>
    <div class="hl-frage">👤 An wen?</div>
    <div class="hl-chips" id="mfSchnell"></div>
    <input id="mfSuche" type="search" placeholder="🔍 Name suchen …" oninput="mfListe()" style="margin:4px 0">
    <div class="ta-liste wahlliste" id="mfListe"></div><div class="hinweis" id="mfWer"></div>
    <div class="hl-frage">📣 Wie soll die Frage ankommen? <small class="hinweis">(mehrere möglich)</small></div>
    <div class="hl-chips" id="mfWege"></div>
    <button class="knopf haupt" id="mfSenden">📤 Frage senden</button><button class="knopf" onclick="$('mfBlatt').remove()">Abbrechen</button>`);
  f.querySelector("#mfSenden").onclick = function () { einmal(this, mfSenden); };
  mfListe(); setTimeout(() => (vorgabe ? $("mfSuche") : $("mfFrage"))?.focus(), 150);
}
function mfListe() {
  const q = ($("mfSuche")?.value || "").toLowerCase(), andere = MITGLIEDER.filter((m) => m.person_id !== ICH.person_id), frei = andere.filter((m) => sammelOk(m) && okFrei(m));
  $("mfSchnell").innerHTML = `<button type="button" class="chip${MF.alle ? " an" : ""}" onclick="MF.alle=!MF.alle;MF.personen=[];mfListe()">${MF.alle ? "☑️" : "⬜"} 👥 Alle Mitglieder</button>`
    + `<button type="button" class="chip" onclick="MF.alle=false;MF.personen=[];mfListe()">✖ Keiner</button>`;
  $("mfListe").innerHTML = andere.filter((m) => !q || m.name.toLowerCase().includes(q)).map((m) => `<label${okKl(m, MF.personen.includes(m.person_id))}>
    <input type="checkbox"${okAttr(m, MF.personen.includes(m.person_id))} ${(MF.alle && sammelOk(m) && okFrei(m)) || MF.personen.includes(m.person_id) ? "checked" : ""} onchange="mfPerson('${m.person_id}', this.checked)"><span style="flex:1">${esc(m.name)}${okZusatz(m)}</span></label>`).join("") || '<p class="hinweis">Niemand gefunden.</p>'; // KC-CLUB-RC-PRUEFUNG (20.10.2026): leere Suche sichtbar machen
  const n = MF.alle ? frei.length : MF.personen.length;
  $("mfWer").innerHTML = `An: <b>${MF.alle ? "alle Mitglieder" : !n ? "noch niemand gewählt" : n <= 3 ? esc(MF.personen.map(zeName).join(", ")) : n + " Mitglieder"}</b>`;
  $("mfWege").innerHTML = TW_WEGE.map(([k, t]) => `<button type="button" class="chip${MF.wege.includes(k) ? " an" : ""}" aria-pressed="${MF.wege.includes(k)}" onclick="MF.wege=MF.wege.includes('${k}')?MF.wege.filter((x)=>x!=='${k}'):[...MF.wege,'${k}'];mfListe()">${MF.wege.includes(k) ? "☑️" : "⬜"} ${t}</button>`).join("");
}
function mfPerson(pid, an) {
  if (MF.alle) { MF.alle = false; MF.personen = MITGLIEDER.filter((m) => m.person_id !== ICH.person_id && sammelOk(m) && okFrei(m)).map((m) => m.person_id); }
  MF.personen = an ? [...new Set([...MF.personen, pid])] : MF.personen.filter((x) => x !== pid); mfListe();
}
async function mfSenden() {
  const text = ($("mfFrage")?.value || "").trim();
  if (text.length < 3) { melde("✍️ Bitte erst die Frage schreiben."); return $("mfFrage")?.focus(); }
  if (!MF.alle && !MF.personen.length) return melde("👤 Bitte mindestens ein Mitglied wählen – oder „Alle Mitglieder“.");
  if (!MF.wege.length) return melde("📣 Bitte wählen, wie die Frage ankommen soll.");
  try {
    const r = await api("mf_senden", { frage: text, an_alle: MF.alle, personen: MF.alle ? [] : MF.personen, kanaele: MF.wege });
    $("mfBlatt")?.remove();
    melde(`📤 Frage an ${r.empfaenger} ${r.empfaenger === 1 ? "Mitglied" : "Mitglieder"} geschickt${r.ausgenommen ? ` (${r.ausgenommen} möchten nicht gefragt werden)` : ""}.`);
    twFrageStart();
  } catch (e) { meldeFehler(e); }
}
function mfZeigen() {
  const z = $("twMf"); if (!z) return;
  const an = TW.mf?.anMich || [], meine = (TW.mf?.meine || []).filter((f) => f.status === "offen");
  const offenAnMich = an.filter((x) => ["offen", "gelesen", "recherchiere"].includes(x.status));
  z.innerHTML = (an.length ? `<details class="tw-meine"${offenAnMich.length ? " open" : ""}><summary>❓ Fragen an dich (${offenAnMich.length})</summary>
      ${an.map((x) => `<div class="tw-frage-zeile mf-an" data-id="${esc(x.id)}"><b>${esc(x.von.vorname)} fragt: „${esc(x.frage)}“</b> <small class="hinweis">${esc(zeitKurz(x.erstellt_am))}</small>
        ${x.status === "beantwortet" ? `<p style="margin:2px 0 0">💡 Deine Antwort: ${twTextHtml(x.antwort)}</p>` : x.status === "weiss_nicht" || x.status === "nicht_fragen" ? `<p class="hinweis" style="margin:2px 0 0">${MF_STATUS[x.status].join(" ")}</p>` : ""}
        ${["offen", "gelesen", "recherchiere"].includes(x.status) ? `${x.status === "recherchiere" ? `<p class="hinweis" style="margin:2px 0">🔎 Du recherchierst – schreib die Antwort, wenn du sie hast.</p>` : ""}
          <div class="mf-knoepfe"><button type="button" class="knopf haupt klein" data-mf="antwort">✍️ Antworten</button>${x.status !== "recherchiere" ? `<button type="button" class="knopf klein" data-mf="recherchiere">🔎 Ich recherchiere und antworte dir</button>` : ""}<button type="button" class="knopf klein" data-mf="weiss_nicht">🤷 Ich weiß es nicht</button><button type="button" class="knopf klein" data-mf="nicht_fragen">🚫 Bitte nicht mehr fragen</button></div>` : ""}</div>`).join("")}</details>` : "")
    + (TW.mf?.aus ? `<p class="hinweis mf-aus">🚫 Du bekommst keine Fragen von Mitgliedern. <button type="button" class="tw-nicht" onclick="mfAus(false)">Wieder fragen lassen</button></p>` : "")
    + (meine.length ? `<details class="tw-meine" open><summary>👥 Deine Fragen an Mitglieder (${meine.length})</summary>
      ${meine.map((f) => `<div class="tw-frage-zeile"><b>„${esc(f.frage)}“</b> <small class="hinweis">${esc(zeitKurz(f.erstellt_am))}${f.an_alle ? " · an alle" : ""}</small>
        ${f.empfaenger.filter((e) => e.status === "beantwortet").map((e) => `<div class="mf-antw">💡 <b>${esc(e.name)}:</b> ${twTextHtml(e.antwort)}</div>`).join("")}
        <details class="mf-stand"><summary class="hinweis">${Object.entries(MF_STATUS).map(([k, [sym]]) => { const n = f.empfaenger.filter((e) => e.status === k).length; return n ? `${sym} ${n}` : ""; }).filter(Boolean).join(" · ")}</summary>
          ${f.empfaenger.map((e) => `<div>${MF_STATUS[e.status]?.[0] || "📨"} ${esc(e.name)} <small class="hinweis">${MF_STATUS[e.status]?.[1] || ""}</small></div>`).join("")}</details>
        <button type="button" class="tw-nicht" onclick="mfErledigt('${esc(f.id)}')">✅ Erledigt – Frage schließen</button></div>`).join("")}</details>` : "");
  z.querySelectorAll(".mf-an [data-mf]").forEach((b) => (b.onclick = () => mfAntwort(b.closest(".mf-an").dataset.id, b.dataset.mf)));
  const ungelesen = an.filter((x) => x.status === "offen").map((x) => x.id);
  if (ungelesen.length) api("mf_gelesen", { ids: ungelesen }).catch(() => {});
}
async function mfAntwort(id, art) {
  const x = (TW.mf?.anMich || []).find((y) => y.id === id); if (!x) return;
  let antwort = "";
  if (art === "antwort") {
    const r = await eingabe(`Deine Antwort an ${x.von.vorname}:\n„${x.frage}“`, "", { mehrzeilig: true }); if (r === null) return;
    antwort = r.trim(); if (!antwort) return melde("✍️ Bitte eine Antwort schreiben.");
  }
  if (art === "nicht_fragen" && !(await frage("Keine Fragen mehr bekommen?\nDu bekommst dann keine Fragen von Mitgliedern mehr. Unter „Frag Twinkey“ kannst du das jederzeit wieder einschalten.", { ja: "🚫 Nicht mehr fragen", gefahr: false }))) return;
  try {
    await api("mf_antwort", { id, art, antwort });
    melde({ antwort: `💡 Antwort an ${x.von.vorname} geschickt`, recherchiere: `🔎 ${x.von.vorname} weiß Bescheid, dass du recherchierst`, weiss_nicht: `🤷 ${x.von.vorname} weiß Bescheid`, nicht_fragen: "🚫 Du wirst nicht mehr gefragt" }[art]);
    await twLaden(); mfZeigen();
  } catch (e) { meldeFehler(e); }
}
async function mfAus(aus) { try { await api("mf_aus", { aus }); await twLaden(); mfZeigen(); melde(aus ? "🚫 Du wirst nicht mehr gefragt" : "👥 Mitglieder dürfen dich wieder fragen"); } catch (e) { meldeFehler(e); } }
async function mfErledigt(id) { try { await api("mf_erledigt", { id }); await twLaden(); mfZeigen(); melde("✅ Frage geschlossen"); } catch (e) { meldeFehler(e); } }

// Admin: offene Fragen beantworten (Push / E-Mail / Club-App) und Twinkey lernen lassen
function twAdminKnopf() {
  const z = $("twAdmin"); if (!z) return;
  const n = (TW.offen || []).length;
  z.innerHTML = ICH?.admin && TW.offen ? `<button type="button" class="knopf tw-admin-knopf" onclick="twOffenStart()">📥 Fragen an Twinkey beantworten${n ? ` (${n})` : " (keine offen)"}</button>` : "";
}
const TW_WEGE = [["app", "📱 In der Club-App"], ["push", "🔔 Push"], ["email", "✉️ E-Mail"]];
async function twOffenStart() {
  if (!ICH?.admin) return;
  $("twBlatt")?.remove(); await twLaden();
  const o = TW.offen || [];
  blattAuf("twOffenBlatt", `<h3 style="margin:0">📥 Fragen an Twinkey</h3>
    <p class="hinweis" style="margin:0">Diese Fragen konnte Twinkey nicht beantworten. Antwort schreiben (oder 🎤 sprechen), Weg wählen, senden. Verschickt wird erst mit <b>📤 Antwort senden</b>.</p>
    ${o.length ? o.map((x) => `<div class="karte tw-offen" data-id="${esc(x.id)}">
      <div><b>${esc(x.name)}</b> <small class="hinweis">${esc(zeitKurz(x.erstellt_am))}</small></div>
      <label class="hinweis">Frage <small>(für Twinkeys Wissen gern allgemein formulieren)</small><input class="tw-f" maxlength="300" value="${esc(x.frage)}"></label>
      <label class="hinweis">Antwort<textarea class="tw-a" data-diktat rows="4" maxlength="2000" placeholder="Deine Antwort …"></textarea></label>
      <div class="hl-chips">${TW_WEGE.map(([k, t]) => `<button type="button" class="chip${k !== "email" ? " an" : ""}" data-weg="${k}" aria-pressed="${k !== "email"}">${k !== "email" ? "☑️" : "⬜"} ${t}</button>`).join("")}</div>
      <button type="button" class="chip tw-wissen" aria-pressed="false">⬜ 🧠 Twinkey merkt sich das (für alle)</button><small class="hinweis" style="display:block;margin:2px 0 6px">Nur anhaken, wenn die Antwort für alle passt – nicht bei persönlichen Antworten wie „Hallo Wilfried …“.</small><!-- 2.257.0 KC-CLUB-TWINKEY-MERKEN-AUS (Wunsch Hansi): Standard aus -->
      <div class="knoepfe"><button type="button" class="knopf haupt" data-tw="senden">📤 Antwort senden</button><button type="button" class="knopf" data-tw="weg">🗑️ Verwerfen</button></div></div>`).join("")
      : `<p>🎉 Keine offenen Fragen.</p>`}
    <div id="twBeantwortet"></div><div id="twGelernt"></div>
    <button class="knopf" onclick="$('twOffenBlatt').remove()">Schließen</button>`);
  twBeantwortetZeigen(); twGelerntZeigen();
  document.querySelectorAll("#twOffenBlatt .chip").forEach((c) => (c.onclick = () => { const an = !c.classList.contains("an"); c.classList.toggle("an", an); c.setAttribute("aria-pressed", an); c.textContent = (an ? "☑️" : "⬜") + c.textContent.slice(c.textContent.indexOf(" ")); }));
  document.querySelectorAll("#twOffenBlatt [data-tw]").forEach((b) => (b.onclick = () => twOffenAktion(b.closest(".tw-offen"), b.dataset.tw, b)));
}
// KC-CLUB-TWINKEY-BEANTWORTET (2.255.0, Wunsch Hansi „hat Wilfried die Push bekommen? Wo sehe ich das?“): die letzten 30 Antworten –
// Text, Wege, Versandergebnis, in der App gelesen. Unbekannt bleibt unbekannt (Regel 11): ohne Versand-Eintrag „Ergebnis unbekannt“, nie ✅.
function twBeantwortetZeigen() {
  const z = $("twBeantwortet"); if (!z || !ICH?.admin) return;
  const b = TW.beantwortet || [];
  const wegTxt = (x) => {
    const v = x.versand, raus = (x.kanaele || []).filter((k) => k !== "app"), t = [];
    if (raus.length) t.push(`${raus.map((k) => k === "push" ? "🔔 Push" : "✉️ E-Mail").join(" + ")}: ${!v ? "❔ Ergebnis unbekannt" : v.fehler ? `⚠️ ${v.gesendet || 0} gesendet, ${v.fehler} Fehler` : v.gesendet ? "✅ gesendet" : "⚠️ nichts gesendet (kein Empfangsweg)"}`);
    if ((x.kanaele || []).includes("app")) t.push(`📱 Club-App: ${x.gelesen ? "👀 gelesen" : "⏳ noch nicht gelesen"}`);
    return t.join(" · ");
  };
  z.innerHTML = `<details class="karte tw-gelernt"><summary><b>📤 Beantwortet (${b.length})</b></summary>
    <p class="hinweis" style="margin:4px 0 8px">Deine letzten Antworten: wer gefragt hat, was du geschrieben hast, wie sie rausging und ob sie gelesen wurde. Eine Kopie bekommst du außerdem per E-Mail.</p>
    ${b.length ? b.map((x) => `<div class="tw-gelernt-eintrag"><div><b>${esc(x.name)}</b> <small class="hinweis">${esc(zeitKurz(x.beantwortet_am))}${x.wissen ? " · 🧠 gemerkt" : ""}</small></div>
      <div><small class="hinweis">Frage:</small> ${esc(x.frage)}</div><div class="tw-antwort-text">${twTextHtml(x.antwort || "")}</div><small>${wegTxt(x)}</small></div>`).join("") : '<p class="hinweis" style="margin:0">Noch keine Antworten.</p>'}</details>`;
}
// KC-CLUB-TWINKEY-VERGESSEN (2.253.0, Wunsch Hansi nach „Kochbild“ doppelt gemerkt): Liste „🧠 Was Twinkey gelernt hat“ mit „Vergessen“.
// Vergessen nimmt die Antwort nur aus Twinkeys Wissen – die fragende Person behält ihre Antwort unter „📬 Deine Fragen“.
function twGelerntZeigen() {
  const z = $("twGelernt"); if (!z || !ICH?.admin) return;
  const w = TW.wissen || [];
  z.innerHTML = `<details class="karte tw-gelernt"${w.length && w.length <= 5 ? " open" : ""}><summary><b>🧠 Was Twinkey gelernt hat (${w.length})</b></summary>
    <p class="hinweis" style="margin:4px 0 8px">Diese Antworten zeigt Twinkey allen – vor seinen eigenen. Doppelt, veraltet oder an eine Person gerichtet? Dann <b>🗑️ Vergessen</b>. Die fragende Person behält ihre Antwort.</p>
    ${w.length ? w.map((x) => `<div class="tw-gelernt-eintrag"><b>${esc(x.frage)}</b><div class="hinweis">${twTextHtml(String(x.antwort || "").slice(0, 220))}${String(x.antwort || "").length > 220 ? " …" : ""}</div>
      <button type="button" class="knopf klein" onclick="twVergessen('${esc(x.id)}', this)">🗑️ Vergessen</button></div>`).join("") : '<p class="hinweis" style="margin:0">Twinkey hat noch nichts gelernt.</p>'}</details>`;
}
async function twVergessen(id, knopf) {
  const x = (TW.wissen || []).find((w) => w.id === id); if (!x) return;
  if (!(await frage(`Twinkey soll das vergessen?

„${x.frage}“

Twinkey zeigt diese Antwort dann niemandem mehr. Die fragende Person behält ihre Antwort.`, { ja: "🗑️ Vergessen" }))) return;
  knopf.disabled = true;
  try { await api("twinkey_vergessen", { id }); TW.wissen = TW.wissen.filter((w) => w.id !== id); TW_INDEX = null; lsSetzen(TW_DATEN_KEY, JSON.stringify(TW.wissen)); twGelerntZeigen(); melde("🧠 Twinkey hat das vergessen."); }
  catch (e) { knopf.disabled = false; meldeFehler(e); } // Regel 11: nicht still als erledigt melden
}
async function twOffenAktion(k, was, knopf) {
  if (!k) return; const id = k.dataset.id;
  if (was === "weg") {
    if (!(await frage("Frage verwerfen?\nSie verschwindet aus der Liste. Die fragende Person bekommt keine Antwort.", { ja: "🗑️ Verwerfen" }))) return;
    try { await api("twinkey_verwerfen", { id }); k.remove(); melde("🗑️ Frage verworfen."); } catch (e) { melde("⚠️ " + (e?.message || "Ging nicht.")); }
    return;
  }
  const antwort = k.querySelector(".tw-a").value.trim(), kanaele = [...k.querySelectorAll("[data-weg].an")].map((c) => c.dataset.weg);
  if (antwort.length < 2) { melde("✍️ Bitte erst eine Antwort schreiben."); k.querySelector(".tw-a").focus(); return; }
  if (!kanaele.length && !(await frage("Keinen Weg gewählt?\nDie Antwort wird nur gespeichert – die Person bekommt keinen Hinweis.", { ja: "Trotzdem speichern" }))) return;
  knopf.disabled = true;
  try {
    await api("twinkey_antworten", { id, antwort, kanaele, frage: k.querySelector(".tw-f").value.trim(), wissen: k.querySelector(".tw-wissen").classList.contains("an") });
    k.remove(); TW_INDEX = null;
    melde(`📤 Antwort gesendet${kanaele.length ? " – " + kanaele.map((x) => TW_WEGE.find(([k2]) => k2 === x)[1]).join(" + ") : ""}.`);
  } catch (e) { knopf.disabled = false; melde("⚠️ " + (e?.message || "Ging nicht.")); }
}
const SU_ZEITRAUM = [["", "Jederzeit"], ["30", "Letzte 30 Tage"], ["jahr", "Dieses Jahr"], ["vorjahr", "Letztes Jahr"], ["eigen", "Von – bis …"]];
try { const f = JSON.parse(localStorage.getItem("kc_club_suche_filter") || "null"); if (f) Object.assign(SU, { bereiche: f.bereiche || SU.bereiche, sortierung: f.sortierung || "datum" }); } catch {}
const suMerken = () => { try { localStorage.setItem("kc_club_suche_filter", JSON.stringify({ bereiche: SU.bereiche, sortierung: SU.sortierung })); } catch {} };
const suLetzte = () => { try { return JSON.parse(localStorage.getItem("kc_club_suche_letzte") || "[]"); } catch { return []; } };
function suLetzteMerken(q) { try { const l = [q, ...suLetzte().filter((x) => x !== q)].slice(0, 5); localStorage.setItem("kc_club_suche_letzte", JSON.stringify(l)); } catch {} }
// App-Funktionen: ohne Server, aus den Kacheln + Einstellungen
// 2.23.94 (Wunsch Hansi): diese Admin-Werkzeuge erscheinen nie in der Suche – auch nicht beim Admin selbst
const SU_NIE = new Set(["ad-inkognito"]);
function suAppListe() {
  const ein = (id) => () => suEinstellung(id);
  const feste = [
    ["🔔", "Push-Benachrichtigungen", "push benachrichtigung mitteilung handy", ein("pushStatus")], ["🔊", "Ton", "ton klingel laut", ein("setTon")],
    ["🌙", "Nicht stören (Ruhezeit)", "nicht stören ruhezeit nacht stumm", ein("ruheAn")], ["🔠", "Schriftgröße", "schrift gross groß lesen", ein(einfach() ? "setGrossE" : "setGross")],
    ["🎨", "Farbe & Design", "farbe design aussehen", ein(einfach() ? "designWahlE" : "designWahl")], ["🌗", "Tag/Nacht umschalten", "dunkel hell nacht tag", () => dunkelUmschalten()],
    ["🎂", "Geburtstag anzeigen", "geburtstag", ein("setGeburtstag")], ["🎉", "Runde Geburtstage (Alter für die Clubleitung)", "runder geburtstag alter jubiläum", ein("setRundGeburtstag")], ["🟢", "Online sichtbar", "online sichtbar unsichtbar", ein("setOnline")], ["🗣️", "Stimme zum Vorlesen", "stimme vorlesen sprache ansage roboter klang", ein("setStimme")], ["🎲", "Spiele: herausfordern erlauben", "spiele spiel tic tac toe schach bauernskat skat karten küchenterror quiz herausfordern", ein("setSpiele")], ["🎲", "Spiel-Einladung beim Start", "spiel einladung start lust partie keine spiele", ein("setSpielEinl")], ["🎓", "Einweisung beim ersten Öffnen", "einweisung erklärung hilfe anleitung neu", ein("setEinw")], ["🕒", "Zuletzt da anzeigen", "zuletzt da online gesehen", ein("setZuletzt")],
    ["🆘", "Notfallkontakt", "notfall kontakt", ein("nfName")], ["📆", "Kalender verbinden (Handy-Kalender: iPhone, Google, Outlook)", "kalender abo handy ical verbinden webcal iphone ipad mac google outlook termine automatisch", () => kalVerbinden()],
    ["📱", "Meine Geräte", "geräte handy tablet abmelden", () => geraeteBlatt()], ["📡", "Verbindung prüfen", "verbindung internet led server", () => verbindungBlatt()],
    ["🔄", "Update prüfen", "update version neu", () => updateKachel()], ["🟢", "Mein Status", "status urlaub verfügbar krank", () => statusBlatt()],
    ["👨‍🍳", "Über die App (Entwickler)", "über app entwickler hansi koch info autor wer gebaut", () => entwicklerZeigen()], // KC-CLUB-ENTWICKLER (2.23.32)
    ["🖨️", "Leeren Wunschbogen drucken (Dienstwünsche)", "wunschbogen bogen drucken dienstwunsch matrix papier qr", () => wbStart()], // KC-CLUB-WUNSCHBOGEN (2.23.28)
    ["👀", "Ansicht wechseln (einfach/erweitert)", "ansicht einfach erweitert kacheln", () => ansichtWechseln()], ["🧪", "Test an mich", "test push mail ausprobieren", () => testAnMichStarten()],
    ["🆘", "Problem melden", "problem fehler hilfe melden", () => fpProblemMelden()], ["👥", "Wer ist online?", "online wer", () => onlineBlatt()],
    ["📍", "Standort teilen", "standort teilen wo bin ich", () => stBlatt()],
    // 2.508.0 KC-CLUB-HILFE-NACHTRAG-3: neue Möglichkeiten direkt über die Lupe
    ["📊", "Dienstzeiten-Übersicht (wer kann wann)", "dienstzeiten übersicht weihnachtsmarkt wer kann wann dienst plan balken", () => dvStart()],
    ["📐", "Ecken der Kacheln (eckig bis rund)", "ecken kacheln rund eckig abgerundet regler slider radius form", () => einstiegHin("effekte", "setKachelEcken")],
    ["🌗", "Schatten einstellen (Stärke, Farbe, Position)", "schatten schattenfarbe schattenstärke schattenposition knöpfe kacheln kopf tiefe 3d", () => einstiegHin("effekte", "setSchatten")],
    ["🎪", "Kopf-Effekt wählen (Jalousie, Vorhang, Glocke …)", "kopf effekt jalousie vorhang theater servierglocke marktbude climber einrollen", () => einstiegHin("effekte", "setKopfEffekt")],
    ["⌨️", "Tippgeräusche (Tastatur, Schreibmaschine)", "tippgeräusche tastatur schreibmaschine tippen hören live", () => einstiegHin("benachrichtigung", "setTippTon")],
    ["🎁", "Geburtstags-Vogel ansehen", "geburtstag vogel geschenk happy birthday blumenstrauß", () => gbvVorschau()],
    ["🍽️", "Clubabend (Tagesordnung, Anwesende)", "clubabend sitzung tagesordnung anwesend abhaken", () => caOeffnen(!!ICH?.vorstand)], // 2.569.0 KC-CLUB-CLUBABEND: Clubleitung auch vorher als Vorschau
    ["🖼️", "Chat: nur den Hintergrund zeigen (Nachrichten ausblenden)", "hintergrund chat nachrichten ausblenden verstecken nur meine nur andere filter bild ansehen", () => hzZuEintrag("h:chat_filter")], // 2.591.0
    ["🧭", "Einstellungen erklärt (alle Einstellungen wie im Explorer)", "einstellungen erklärt erklärung übersicht alle einstellungen explorer wegweiser anleitung voreinstellungen was bewirkt bedeutet schritt für schritt", () => ewStart()], // 2.534.0
    // 2.671.0 KC-CLUB-HILFE-NACHTRAG-5: Neuheiten 2.534.0–2.668.0 (nur Mitglieder-Funktionen) – auch per 🎤 Sprachsuche
    ["🧑‍🍳", "Twinkey hilft von selbst (Hilfe-Angebot an/aus)", "hilfe von selbst twinkey meldet sich hilfestellung angebot nervt abschalten video hilfe lesen nicht mehr anbieten", () => einstiegHin("ansagen", "setHs")], // 2.710.0
    ["🕰️", "Fallblatt-Uhr in der Termin-Kachel (Countdown wie am Bahnhof)", "fallblatt falluhr fallblattuhr blätteruhr klappuhr klappkarten bahnhof bahnhofsuhr countdown termin terminkachel kachel info feld rechts tage zähler darstellung normal", () => einstiegHin("startseite", "cdWahl")], // 2.701.0 (Hansi: Suche fand sie nicht)
    ["⏰", "Wecker, Stoppuhr, Timer (große Uhr)", "wecker wecken stoppuhr timer eieruhr kurzzeitwecker countdown alarm klingeln uhr runden", () => esOeffnen("uhr")],
    ["🔊", "Wecker/Timer ohne Ton („Antippen für Ton“)", "wecker timer stumm kein ton leise hört nichts antippen für ton klingelt nicht", () => hzZuEintrag("h:wecker_ton")],
    ["🎬", "Effekt beim Register-Wechsel (Kachel-Zug, Hereindrehen …)", "kachel effekt register wechsel hereindrehen kachelzug zug spielautomat seifenblasen magnet pfanne einfliegen fallblatt abwechselnd zufall", () => einstiegHin("effekte", "regEffektWahl")],
    ["📤", "„Wie verschicken?“ – Voreinstellung (E-Mail, Push, WhatsApp, nur App)", "wie verschicken versand wahl voreinstellung nicht mehr fragen nervt nur email nur push nur in der app whatsapp alles anhang mehrere empfänger chat merken", () => einstiegHin("benachrichtigung", "vwVorwahlWahl")],
    ["➕", "Weitere Empfänger dazunehmen (➕ auch an)", "weitere empfänger auch an plus hinzufügen dazu runde mehrere personen chat erweitern", () => hzZuEintrag("h:weitere_empfaenger")],
    ["✏️", "Nachricht oder Bildunterschrift ändern", "nachricht ändern bearbeiten bildunterschrift unterschrift foto text korrigieren vertippt", () => hzZuEintrag("h:nachricht_aendern")],
    ["⏳", "Sanduhr an der Nachricht (Warteschlange)", "sanduhr warteschlange wartet senden nochmal fehler ausrufezeichen hängt", () => hzZuEintrag("h:sende_schlange")],
    ["📩", "Geplante Nachricht vorher abrufen", "geplant vorher abrufen jetzt abrufen zeitgesteuert später senden wecker", () => hzZuEintrag("h:geplant_vorab")],
    ["👋", "Anklopfen: schreiben oder sprechen", "anklopfen schreiben sprechen klopfen blass deaktiviert nicht online verpasst zurück anklopfen", () => hzZuEintrag("h:anklopfen_wahl")],
    ["🧹", "Zettel nur bei Lesern abnehmen", "zettel abnehmen pinnwand gelesen leser nur bei manchen teilweise", () => hzZuEintrag("h:pinnwand_teil_ab")],
    ["📋", "Abstimmung mit mehreren Fragen / Ankreuzbogen", "abstimmung mehrere fragen überschrift umfrage freie antwort ankreuzbogen ergebnis drucken fragebogen", () => hzZuEintrag("h:abstimmung_mehrere")],
    ["💬", "Ausdruck in der Club-App senden (PDF)", "ausdruck pdf in der club-app senden druckvorschau anlage schicken", () => hzZuEintrag("h:druck_pdf")],
    ["🍽️", "Clubabend Live (am Abend)", "clubabend live heute abend tagesordnung wer ist da fotos", () => hzZuEintrag("h:clubabend_live")],
    ["📸", "Mein Clubmoment (Unser Clubjahr)", "clubmoment clubjahr heft foto einreichen schönster moment weihnachtsessen", () => hzZuEintrag("h:clubmoment")],
    ["✨", "Chats mit Neuem markiert (golden)", "golden markiert neue nachrichten übersicht rahmen pulsiert", () => hzZuEintrag("h:chat_neu_markiert")],
    // 2.533.0 KC-CLUB-HILFE-NACHTRAG-4: Verschlüsseln, Schlüsselbund, Versand-Leiste, Teilen, Diashow, PDF – auch per 🎤 Sprachsuche
    ["🔒", "Nachricht verschlüsselt senden (Schloss, Schlüssel)", "verschlüsseln verschlüsselt verschlüsselung geheim schloss schlüssel kennwort passwort code geheimnachricht sicher senden", () => hzZuEintrag("h:verschluesselt")],
    ["🔑", "Schlüsselbund (verschlüsselt ohne Eintippen)", "schlüsselbund schlüssel bund datei einlesen partner zweier chat verschlüsselt automatisch", () => hzZuEintrag("h:schluesselbund")],
    ["🕵️", "Erklär-Video: Geheim schreiben (verschlüsseln)", "video geheim verschlüsseln verschlüsselt schlüssel schlüsselbund geheimagent agent erklär", () => rgListeAbspielen(["geheim"])],
    ["✉️", "Ich will gar nicht verschlüsseln (Schloss aus)", "schloss aus versehen schlüssel eingeben nicht verschlüsseln normal senden ausschalten", () => hzZuEintrag("h:verschluesselt")],
    ["📝", "Normal, Wichtig, Express (Leiste über dem Schreibfeld)", "versand leiste versandleiste normal wichtig express immer zeigen ausrufezeichen dringend", () => einstiegHin("benachrichtigung", "setWichtigFrage")],
    ["🔇", "Tippgeräusch im Chat schnell aus (Lautsprecher)", "lautsprecher tippgeräusch tippton aus stumm klein zeile chat", () => hzZuEintrag("h:tippgeraeusche")],
    ["✍️", "„… schreibt dir gerade“ (Hinweis oben)", "schreibt dir gerade diktiert sprachnachricht hinweis oben tippt stift", () => hzZuEintrag("h:schreibt_hinweis")],
    ["📥", "Teilen → Köcheclub (Ablagekorb)", "teilen ablagekorb galerie whatsapp mail dateimanager datei foto schicken hochladen dublette", () => hzZuEintrag("h:ablagekorb")],
    ["▶️", "Diashow aus dem Fotoalbum (mit Musik)", "diashow fotoalbum album fotos musik club-song abspielen", () => { melde("▶️ Im Fotoalbum oben auf „▶️ Diashow“ tippen – Musik wählen, Album antippen"); zeige("fotos"); }],
    ["📄", "PDF aus der Druckvorschau (z. B. Erstattung)", "pdf drucken ausdrucken druckvorschau briefbogen erstattung antrag speichern teilen", () => hzZuEintrag("h:druck_pdf")],
    ["⭐", "Gemerkte Nachrichten", "gemerkt merken stern favorit", () => { zeige("nachrichten"); gemerktZeigen(); }],
    // 2.396.0 KC-CLUB-HILFE-NEUHEITEN
    ["⭐", "Favoriten (Lieblings-Chats)", "favoriten favorit stern sternchen lieblings chat wichtig oft", () => { zeige("nachrichten"); uhFavAnsicht(true); }],
    ["🏎️", "Express-Nachricht (5 am Tag)", "express eilig dringend sofort rennwagen schnell 5 tag zähler", () => { melde("🏎️ Im Chat über dem Schreibfeld „🏎️ Express“ anhaken – daneben steht, wie viele du heute schon hattest (z. B. 2/5)"); zeige("nachrichten"); }],
    ["↩️", "Nachricht zurückholen", "zurückholen zurueckholen vertippt zurücknehmen ändern korrigieren falsch", () => { melde("↩️ Nachricht antippen (PC: rechte Maustaste) → „Zurückholen und ändern“ – geht, solange sie noch niemand gelesen hat"); zeige("nachrichten"); }],
    ["⏰", "Nachricht später senden", "später senden planen zeit morgen montag wiederholen", () => { melde("⏰ Nachricht schreiben, unten auf ⏰ tippen und Zeit wählen"); zeige("nachrichten"); }],
    ["📨", "Offene Terminanfragen", "terminanfrage anfrage termin offen antworten einladung", () => zeige("termine")],
    ...(ICH?.admin ? [["📝", "Wünsche an Claude", "wunsch wünsche claude vorschlag idee fehler aufgabe liste entwickler", () => wuStart()]] : []), // 2.440.0
    ...(ICH?.admin ? [["📅", "Wer kommt wann? (Nutzung)", "wer kommt wann nutzung uhrzeit wochentag statistik öffnen", () => wannStatistik()]] : []),
    // 18.10.2026 KC-CLUB-HILFE-AKTUELL: neue Funktionen seit 2.416.0 auch über die Lupe
    ["📣", "Info-Laufband auf der Startseite", "info laufband infoband infofeld meldungen startseite wichtig erledigen zusagen gratulieren ausblenden", () => hzZuEintrag("h:info_laufband")],
    ["🕰️", "Uhr zur vollen Stunde (Kuckuck, Big Ben, Kölner Dom …)", "kuckuck kuckucksuhr uhr volle stunde stundenschlag glocke glockenspiel big ben dom michel schiffsglocke standuhr ton", ein("setKuckuck")],
    ["✌️", "Schrift mit zwei Fingern größer/kleiner (an/aus)", "zoom zoomen zwei finger schrift größer kleiner auseinanderziehen ziehen geste", () => einstiegHin("darstellung")],
    ["⌨️", "Tastatur im Chat ein- und ausblenden", "tastatur einblenden ausblenden wegnehmen mehr nachrichten sehen chat", () => hzZuEintrag("h:tastatur_knopf")],
    ["▾", "Schreibbereich im Chat einklappen", "schreibbereich einklappen wegklappen schreibfeld kleiner mehr nachrichten", () => hzZuEintrag("h:schreiben_klappen")],
    ["✔️", "Gelesen von / Zugestellt an (Haken)", "gelesen zugestellt haken lesebestätigung wer hat gelesen blau grau angekommen", () => hzZuEintrag("h:gelesen_von")],
    ["📎", "Anlage an Vorschlag, Spende oder Terminanfrage", "anlage anhang foto pdf datei flyer skizze vorschlag spende terminfindung terminanfrage", () => hzZuEintrag("h:anlage_mitschicken")],
    ["🌐", "Clubtermin mit Webseite und Prospekt", "termin link webseite prospekt flyer anlage veranstalter laufband ankündigen", () => hzZuEintrag("h:termin_link_prospekt")],
    ["👋", "Ansage, wer gerade da ist", "wer ist da online ansage reinkommen öffnen ansagen stimme", () => einstiegHin("ansagen")],
    ["★", "Sonderstunden melden und Stand sehen", "sonderstunden sondereinsatz stunden melden stundenkonto gutgeschrieben einsatz grünkohl", () => mdStart()],
    ["📥", "Eingangskorb (Dokument annehmen, Ordner wählen)", "eingangskorb eingang dokument annehmen ablehnen ordner register archiv urkunde", () => hzZuEintrag("h:eingangskorb_mitglied")],
    ["👪", "Hinweise an Eltern (was Eltern bekommen)", "eltern elternhandy eltern-handy kind kinder hinweis push eltern", () => einstiegHin("privat")],
    ["🔬", "Internet-Tiefentest (Leitung prüfen)", "internet langsam hängt sanduhr schnecke wlan router leitung aussetzer störung speedtest test tiefentest kabel", () => ttOeffnen()],
    ["🕐", "Erinnerung an die Zeitumstellung", "zeitumstellung sommerzeit winterzeit uhr umstellen vor zurück", () => hzZuEintrag("h:zeitumstellung")],
    ["🪪", "Mein Ausweis-QR", "ausweis qr code mitgliedsnummer kasse stechuhr scanner bediener anmelden mitgliedsausweis karte", () => ausweisZeigen()], // 2.443.0
    ["📊", "Abstimmung im Chat", "abstimmung umfrage chat wer kommt", () => { melde("Im Chat auf 📎 tippen → „📊 Abstimmung“"); zeige("nachrichten"); }],
    ["🛡️", "Sicherheits-Check", "sicherheit sicher datenschutz verschlüsselung sicherung prüfen test", () => sicherheitStart()],
    ["🔕", "Chat stummschalten", "stumm stummschalten leise chat gruppe", () => { melde("Im Chat oben auf ⋮ tippen → 🔕 Stummschalten"); zeige("nachrichten"); }],
    ["⚡", "Schnellstart-Symbole auswählen", "schnellstart symbole schnell kachel", ein("ssWahl")], ["👋", "Anklopfen erlauben / Anklopfton", "anklopfen klopfen ton klingel", ein("setAnklopfen")],
    ["🙋", "Hilfe suchen (Wer kann helfen?)", "hilfe helfen helfer aufruf aufbau abbau tische tragen kochen spülen einkauf fahrdienst verkauf stand", () => { hlStart("helfen"); hilfeNeu(); }],
    ["📦", "Etwas ausleihen", "ausleihen leihen verleih stehtisch bierzelt garnitur pavillon zapfanlage glühwein kühlbox bräter warmhalte kabeltrommel", () => { hlStart("leihen"); leihNeu(); }],
    ["💝", "Spendenprojekt vorschlagen", "spende spenden spendenprojekt kinderhospiz geld verein", () => { zeige("vorschlaege"); vorschlagForm("spende"); }],
    ...(ICH?.buero ? [["🗂️", "Büro – Sitzung vorbereiten, Einladung", "büro buero sitzung vorbereiten tagesordnung einladung protokoll vorlage drucken eingang", () => buStart()]] : []),
    ["📸", "Bildschirmfoto der App", "bildschirmfoto screenshot foto bildschirm aufnahme zeigen problem", () => bfStart()],
    ...(frei("avatar") ? [["🧑‍🍳", "Mein Bild (Kochbild, Koch-Figur)", "kochbild profilbild profilfoto benutzerbild avatar avatare kochfigur koch-figur figur bild foto selfie baukasten bisherige einfache hochwertige hochwertig premium neue figuren bearbeiten ändern zuletzt früheres bild zurück verlauf mütze foto rahmen", () => avWahl()]] : []),
    ...(frei("avatar") && frei("avatar_baukasten") ? [["🧩", "Figur anpassen (Baukasten: Frisur, Brille, Schmuck, Kochjacke)", "anpassen individuell zusammenstellen baukasten frisur haare haarfarbe bart brille eigene brille ohrringe ohrring kette halskette piercing schmuck mütze kopfbedeckung kochjacke jacke schürze muster hintergrund halstuch falten stil", () => avBauen()]] : []), // 2.415.0 KC-CLUB-AVATAR-HILFE // 2.260.0 KC-CLUB-SUCHE-KOCHBILD (Fund Hansi)
    // 2.300.0 KC-CLUB-RUECKSEITE-HILFE (Wunsch Hansi „Suchfunktion bei der Lupe anpassen“): die Rückseite des Kopfes
    ["📄", "Eselsohr: Kopf umdrehen (Rückseite)", "eselsohr rückseite rueckseite kopf umdrehen ecke umgeknickt", () => esOeffnen(null)],
    ["🖼️", "Diashow (Fotos groß zeigen)", "diashow dia fotos bilder vollbild schau album musik club-song lied", () => esOeffnen("dia")],
    ["🖍️", "Tafel zum Skizzieren", "tafel kreide skizze zeichnen malen schwamm", () => esOeffnen("tafel")],
    ["📋", "Flipchart (umblättern, kariert, liniert)", "flipchart flip skizze zeichnen malen marker umblättern kariert liniert blanko papier", () => esOeffnen("flip")],
    ["🕰️", "Große Uhr", "uhr uhrzeit große uhr bahnhofsuhr fallblatt digital datum", () => esOeffnen("uhr")],
    ["🎭", "Bühne: Bewegung mit Twinkey", "bühne buehne bewegung turnen gymnastik sport übungen musik twinkey küche sitzen stehen", () => esOeffnen("buehne")],
    ["🎤", "Club-Song „Seit einundneunzig“ (Karaoke)", "club song lied hymne singen karaoke seit einundneunzig 1991 köcheclub werne schlager", () => { esOeffnen("buehne"); setTimeout(() => { if (ES.offen) bwClubSong(); }, 900); }], // 2.316.0
    ["🧩", "Rätsel: Wie gut kennst du Werne? (Bilderrätsel, Bestenliste)", "rätsel raetsel spiel quiz bilderrätsel pixel buzzer werne rathaus küche gewürze bestenliste wochen-rätsel", () => esOeffnen("raetsel")], // 2.339.0
    ["🪞", "Spiegel (Kamera, Pausbäckchen)", "spiegel kamera selfie pausbäckchen pausbacken dick gesicht", () => esOeffnen("spiegel")], // 2.314.0
    ["🎭", "Einladung zur Bewegung beim Start", "einladung bewegung start fragen bewegungseinheit sport frage", () => suEinstellung("setBwEinladung")],
    ["☑️", "Kacheln auswählen (anhaken, was auf die Startseite soll)", "kacheln auswählen anhaken haken kästchen verbergen ausblenden einblenden startseite club meins technik auswahl", () => suEinstellung("kaAuswahl")], // 2.421.0
    ["💡", "Vorschläge zur Startseite (Kacheln ausblenden, Funktionen freischalten)", "vorschlag vorschläge kacheln ausblenden verbergen freischalten nutzung gemerkt adaptiv startseite löschen", () => suEinstellung("setKachelVorschlag")], // 2.418.0
    ["🎚️", "Bühne: Musik / Stimme lauter oder leiser", "lautstärke lauter leiser regler musik stimme stumm bühne", () => esOeffnen("buehne")],
    // 2.344.0 KC-CLUB-HILFE-NACHTRAG: alle Möglichkeiten, die App anzupassen, auch über die Lupe
    ["🎭", "Thema wählen (Weihnachten, Herbst, Oktoberfest …)", "thema themen weihnachten herbst indian summer oktoberfest sim-jü simjue karneval halloween ostern karibik unterwasser weltraum sterne planet rakete astronaut ufo bauernhof kuh schwein hahn traktor stall kegeln kegelabend kegel bowling alle neune wild west wilder westen cowboy büffel tipi lagerfeuer kutsche meer fische taucher silvester winter sommer frühling paket kalender club-thema", ein("themaWahl")],
    ["✍️", "Schrift des Themas (Begrüßung)", "schrift schriftart fraktur thema begrüßung", ein("themaSchriftAn")],
    ["🍂", "Jahreszeiten-Bild im Kopf (fest oder automatisch)", "jahreszeit jahreszeiten kopf bild herbst winter frühling sommer advent silvester laub schnee schneemann eichhörnchen iglu vorschau", ein("jzWahl")],
    ["🎏", "Deko an der Leiste (Wimpel, Lichterkette, Laternen)", "deko dekoration wimpel wimpelkette lichterkette lichter laternen lampions girlande leiste", ein("jzDekoWahl")],
    ["✨", "Ruhige oder lebendige Knöpfe (Animationen)", "animation animiert ruhig bewegung effekte knöpfe", ein("setAnimiert")],
    ["🪟", "Kachel- und Sende-Effekt (Jalousie, Papierflieger …)", "kachel effekt jalousie kartenstapel umdrehen hereindrehen wirbel drehen spielautomat walze seifenblasen magnet pfanne abwechselnd welle wackeln abschied senden papierflieger brieftaube uhu eule postauto", ein("regEffektWahl")],
    ["🐢", "Sparmodus / Akku sparen", "sparmodus sparen akku batterie strom langsam netz datensparen", ein("sparWahl")],
    ["🎨", "Erklär-Video: Meine App nach meinem Geschmack", "anpassen einstellen aussehen geschmack video themen farben jahreszeiten deko schrift", () => rgListeAbspielen(["anpassen"])],
    ["🗣️", "Videos: Stimme und Tempo wählen", "stimme video tempo langsam schneller vorlesen klingt komisch roboter sprecher erklär videos herunterladen thorsten dii", () => stimmenWahl()], // 2.348.0
    ["🎬", "Videos: Nachfrage nach eigenem Video (ein/aus, Später-Liste)", "video verweis nachfrage später gemerkt nicht mehr fragen erklär videos liste eigenes video", () => erklaerVideos()], // 2.346.0
    ["⏱", "Trainingsuhr auf der Bühne", "uhr training trainingsuhr zeit schon noch bühne twinkey", () => esOeffnen("buehne")],
    ["📧", "Dienstwünsche: Bestätigung per E-Mail", "dienstwunsch dienstwünsche bestätigung e-mail mail fertig zusammenfassung", () => dwOeffnen()],
    ["🆘", "Wo bin ich? (SOS)", "wo bin ich adresse standort notfall sos", () => sosStart()], ["🪪", "Mein Notfallpass", "notfallpass allergien medikamente blutgruppe notfall", () => { sosStart(); nfpBearbeiten(); }],
  ].map(([sym, t, w, fn]) => ({ sym, t, w, fn }));
  const kach = Object.values(KACHELN).flat().filter((k) => !k.bald && (!k.nur || k.nur()) && !SU_NIE.has(k.id))
    .map((k) => ({ sym: k.sym, t: k.t, w: typeof k.u === "string" ? k.u : "", fn: () => (k.aktion ? new Function(k.aktion)() : zeige(k.v)) }));
  return [...kach, ...feste];
}
function suWoerter() { return SU.genau ? [SU.q.trim()] : SU.q.trim().split(/\s+/).filter(Boolean); }
// Treffer im Text markieren (Umlaut-tolerant)
function suMuster() { return suMusterFuer(suWoerter()); }
// Ausschnitt rund um den ersten Treffer
function suAusschnitt(text, muster, n = 110) {
  const t = String(text || "").replace(/\s+/g, " ").trim(); if (!t) return "";
  muster && (muster.lastIndex = 0); const m = muster ? muster.exec(t) : null; muster && (muster.lastIndex = 0);
  if (!m || t.length <= n) return t.length > n ? t.slice(0, n) + " …" : t;
  const a = Math.max(0, m.index - 35); return (a ? "… " : "") + t.slice(a, a + n) + (a + n < t.length ? " …" : "");
}
function sucheAuf(start) {
  if (!$("suFenster")) {
    const f = document.createElement("div"); f.id = "suFenster"; f.className = "su-fenster versteckt"; f.setAttribute("role", "dialog"); f.setAttribute("aria-modal", "true"); f.setAttribute("aria-label", "Suche");
    f.innerHTML = `<div class="su-innen">
      <div class="su-kopf"><span class="su-lupe" aria-hidden="true">🔍</span><input id="suEingabe" data-diktat="einmal" type="search" enterkeyhint="search" autocomplete="off" placeholder="Suchen … (ab 2 Buchstaben)" oninput="suTippen(this.value)" onkeydown="if(event.key==='Escape')sucheZu();if(event.key==='Enter'){this.blur();suJetzt()}">
        <button type="button" class="knopf haupt such-knopf" onclick="suSucheKnopf()">🔍 Suchen</button><button class="su-filterknopf" id="suFilterKnopf" onclick="suFilterUmschalten()" title="Erweiterte Suche mit Filtern">⚙️<span>Filter</span></button><button class="su-zu" onclick="sucheZu()" aria-label="Suche schließen">✕</button></div>
      <div id="suFilter" class="su-filter versteckt"></div><div id="suErgebnis" class="su-ergebnis"></div></div>`;
    f.onclick = (e) => { if (e.target === f) sucheZu(); };
    document.body.appendChild(f);
  }
  if (!SU.offen) { SU.offen = true; history.pushState({ ...(history.state || {}), suche: true }, "", location.href); nzZaehlen("suche"); }
  $("suFenster").classList.remove("versteckt"); document.body.classList.add("su-auf");
  SU.q = start != null ? start : ""; SU.ergebnis = null; // neu öffnen = leeres Feld + „Zuletzt gesucht“
  $("suEingabe").value = SU.q; suFilterZeigen(); suZeigen();
  setTimeout(() => $("suEingabe").focus(), 50);
  if (SU.q.trim().length >= 2) suJetzt();
}
function suSucheKnopf() { // KC-CLUB-SUCHEN-KNOPF (2.23.56)
  const f = $("suEingabe"), q = (f?.value || "").trim();
  if (suNorm(q).replace(/\s/g, "").length < 2) { melde("✍️ Bitte mindestens 2 Buchstaben eintippen."); return f?.focus(); }
  SU.q = q; f.blur(); suJetzt();
}
function suTippen(v) { SU.q = v; clearTimeout(SU.timer); if (suNorm(v).replace(/\s/g, "").length < 2) { SU.ergebnis = null; return suZeigen(); } SU.timer = setTimeout(suJetzt, 300); }
async function suJetzt() {
  clearTimeout(SU.timer);
  const q = SU.q.trim(); if (suNorm(q).replace(/\s/g, "").length < 2) return;
  const nr = ++SU.nr; $("suErgebnis").classList.add("laedt");
  const z = suZeitraum(), server = SU.bereiche.filter((b) => b !== "app");
  try {
    const r = server.length ? await api("suche", { q, schnell: !SU.filter, bereiche: server, genau: SU.genau, anhang: SU.anhang, autor: SU.autor || undefined, von: z.von, bis: z.bis, sortierung: SU.sortierung }) : { bereiche: [] };
    if (nr !== SU.nr) return; // inzwischen weitergetippt
    SU.ergebnis = r.bereiche; SU.vorschlag = r.vorschlag || null; SU.fehler = null; suLetzteMerken(q);
  } catch (e) { if (nr !== SU.nr) return; SU.ergebnis = []; SU.fehler = e.message; }
  $("suErgebnis").classList.remove("laedt"); suZeigen();
}
function suZeitraum() {
  const heute = heuteIso(), j = heute.slice(0, 4);
  if (SU.zeitraum === "30") return { von: tagPlus(heute, -30), bis: heute };
  if (SU.zeitraum === "jahr") return { von: j + "-01-01", bis: j + "-12-31" };
  if (SU.zeitraum === "vorjahr") return { von: (j - 1) + "-01-01", bis: (j - 1) + "-12-31" };
  if (SU.zeitraum === "eigen") return { von: SU.von || undefined, bis: SU.bis || undefined };
  return {};
}
function suFilterAktiv() { return (SU.bereiche.length !== Object.keys(SU_BEREICHE).length ? 1 : 0) + (SU.zeitraum ? 1 : 0) + (SU.autor ? 1 : 0) + (SU.anhang ? 1 : 0) + (SU.genau ? 1 : 0); }
async function suFilterUmschalten() {
  SU.filter = !SU.filter;
  if (SU.filter && !MITGLIEDER) try { await mitgliederHolen(); } catch {}
  suFilterZeigen(); if (SU.q.trim().length >= 2) suJetzt();
}
function suFilterZeigen() {
  const n = suFilterAktiv();
  $("suFilterKnopf").classList.toggle("an", SU.filter);
  $("suFilterKnopf").innerHTML = `⚙️<span>Filter${n ? ` <b>${n}</b>` : ""}</span>`;
  $("suFilter").classList.toggle("versteckt", !SU.filter);
  if (!SU.filter) return;
  const alleAn = SU.bereiche.length === Object.keys(SU_BEREICHE).length;
  $("suFilter").innerHTML = `
    <div class="su-gruppe"><div class="su-titel"><b>Wo suchen?</b><button class="knopf klein" onclick="SU.bereiche=${alleAn ? "[]" : "Object.keys(SU_BEREICHE)"};suMerken();suFilterZeigen();suJetzt()">${alleAn ? "Keine" : "Alle"}</button></div>
      <div class="su-kaestchen">${Object.entries(SU_BEREICHE).filter(([b]) => b !== "protokolle" || ICH?.protokolle !== false).map(([b, [sym, t]]) => `<label><input type="checkbox" ${SU.bereiche.includes(b) ? "checked" : ""} onchange="suBereich('${b}', this.checked)"><span>${sym} ${esc(t)}</span></label>`).join("")}</div></div>
    <div class="su-gruppe su-zwei">
      <label class="feld">Zeitraum<select onchange="SU.zeitraum=this.value;suFilterZeigen();suJetzt()">${SU_ZEITRAUM.map(([w, t]) => `<option value="${w}" ${SU.zeitraum === w ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label class="feld">Von wem<select onchange="SU.autor=this.value;suFilterZeigen();suJetzt()"><option value="">Egal</option>${ICH ? `<option value="${ICH.person_id}" ${SU.autor === ICH.person_id ? "selected" : ""}>Von mir</option>` : ""}${(MITGLIEDER || []).filter((m) => m.person_id !== ICH?.person_id).map((m) => `<option value="${m.person_id}" ${SU.autor === m.person_id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></label>
      ${SU.zeitraum === "eigen" ? `<label class="feld">von<input type="date" value="${SU.von}" onchange="SU.von=this.value;suJetzt()"></label><label class="feld">bis<input type="date" value="${SU.bis}" onchange="SU.bis=this.value;suJetzt()"></label>` : ""}
    </div>
    <div class="su-gruppe su-schalter">
      <label><input type="checkbox" ${SU.anhang ? "checked" : ""} onchange="SU.anhang=this.checked;suFilterZeigen();suJetzt()"><span>📎 nur mit Datei/Anhang</span></label>
      <label><input type="checkbox" ${SU.genau ? "checked" : ""} onchange="SU.genau=this.checked;suFilterZeigen();suJetzt()"><span>„ “ genau diese Wortfolge</span></label>
      <label class="feld">Sortieren<select onchange="SU.sortierung=this.value;suMerken();suJetzt()"><option value="datum" ${SU.sortierung === "datum" ? "selected" : ""}>Neueste zuerst</option><option value="relevanz" ${SU.sortierung === "relevanz" ? "selected" : ""}>Beste Treffer zuerst</option></select></label>
      ${n ? `<button class="knopf klein" onclick="suZuruecksetzen()">↺ Filter zurücksetzen</button>` : ""}
    </div>`;
}
function suBereich(b, an) { SU.bereiche = an ? [...new Set([...SU.bereiche, b])] : SU.bereiche.filter((x) => x !== b); suMerken(); suFilterZeigen(); suJetzt(); }
function suZuruecksetzen() { Object.assign(SU, { bereiche: Object.keys(SU_BEREICHE), zeitraum: "", von: "", bis: "", autor: "", anhang: false, genau: false, sortierung: "datum", reiter: "" }); suMerken(); suFilterZeigen(); suJetzt(); }
function suAppTreffer() {
  if (!SU.bereiche.includes("app") || SU.anhang || SU.autor || SU.zeitraum) return [];
  const w = suWoerter().map(suNorm);
  const genau = suAppListe().filter((a) => { const n = suNorm(a.t + " " + a.w); return w.every((x) => n.includes(x)); });
  return genau.length || SU.genau ? genau : suAppListe().filter((a) => suUnscharf(SU.q, a.t + " " + a.w)); // KC-CLUB-SUCHE-UNSCHARF
}
let SU_APP = [];
function suZeigen() {
  const ziel = $("suErgebnis"), q = SU.q.trim();
  if (suNorm(q).replace(/\s/g, "").length < 2) {
    const l = suLetzte();
    ziel.innerHTML = `<p class="hinweis su-tipp">Tippe mindestens 2 Buchstaben. Gesucht wird in Mitgliedern, Nachrichten, Terminen, Pinnwand, Protokollen, Archiv und mehr – nur in dem, was du auch sonst sehen darfst.</p>
      ${l.length ? `<div class="su-titel"><b>Zuletzt gesucht</b></div><div class="chips">${l.map((x) => `<button class="chip" onclick='sucheAuf(${esc(JSON.stringify(x))})'>🕘 ${esc(x)}</button>`).join("")}</div>` : ""}`;
    return;
  }
  if (!SU.ergebnis) { ziel.innerHTML = '<p class="hinweis su-tipp">Suche …</p>'; return; }
  const muster = suMuster();
  SU_APP = suAppTreffer();
  const gruppen = [...SU.ergebnis, ...(SU_APP.length ? [{ bereich: "app", treffer: SU_APP.slice(0, SU.filter ? 30 : 4).map((a, i) => ({ id: String(i), titel: a.t, text: "", app: true, sym: a.sym })), mehr: !SU.filter && SU_APP.length > 4 }] : [])];
  if (SU.reiter && !gruppen.some((g) => g.bereich === SU.reiter)) SU.reiter = "";
  const summe = gruppen.reduce((s, g) => s + g.treffer.length, 0);
  if (!summe) { ziel.innerHTML = `<p class="hinweis su-tipp">${SU.fehler ? "⚠️ " + esc(SU.fehler) : `Nichts gefunden für „${esc(q)}“.${SU.vorschlag ? ` <button class="knopf klein" onclick='sucheAuf(${esc(JSON.stringify(SU.vorschlag))})'>🔎 Meintest du „${esc(SU.vorschlag)}“?</button>` : ""}${suFilterAktiv() ? " Vielleicht sind Filter gesetzt – <button class=\"knopf klein\" onclick=\"suZuruecksetzen()\">↺ zurücksetzen</button>" : " Tipp: weniger oder andere Wörter versuchen."}`}</p>`; return; }
  const reiter = SU.filter && gruppen.length > 1 ? `<div class="su-reiter">${[["", "Alle", summe], ...gruppen.map((g) => [g.bereich, SU_BEREICHE[g.bereich][0], g.treffer.length + (g.mehr ? "+" : "")])].map(([b, t, n]) => `<button class="${SU.reiter === b ? "an" : ""}" onclick="SU.reiter='${b}';suZeigen()">${t} <small>${n}</small></button>`).join("")}</div>` : "";
  ziel.innerHTML = reiter + gruppen.filter((g) => !SU.filter || !SU.reiter || g.bereich === SU.reiter).map((g) => {
    const [sym, t] = SU_BEREICHE[g.bereich];
    return `<div class="su-bereich"><div class="su-titel"><b>${sym} ${esc(t)}</b><small>${g.treffer.length}${g.mehr ? "+" : ""}</small></div>
      ${g.treffer.map((x) => suZeile(g.bereich, x, muster)).join("")}
      ${g.mehr && !SU.filter ? `<button class="su-mehr" onclick="suNurBereich('${g.bereich}')">Mehr in ${esc(t)} anzeigen ›</button>` : ""}</div>`;
  }).join("") + (SU.filter ? "" : `<button class="su-mehr su-erw" onclick="suFilterUmschalten()">⚙️ Erweiterte Suche mit Filtern ›</button>`);
}
function suNurBereich(b) { SU.bereiche = [b]; SU.reiter = ""; SU.filter = false; suFilterUmschalten(); }
function suZeile(b, x, muster) {
  const e = x.extra || {}, zusatz = [];
  if (x.datum) zusatz.push(String(x.datum).length === 10 ? fTagDe(x.datum) : zeitKurz(x.datum));
  if (x.von && b !== "mitglieder") zusatz.push(x.von);
  const marke = e.abgesagt ? "❌ abgesagt" : e.art === "privat" ? "🔒 privat" : e.art === "anfrage" ? "📨 Anfrage" : e.art === "aufgabe" ? (e.erledigt ? "✔ Aufgabe erledigt" : "📝 Aufgabe") : e.entwurf ? "✏️ Entwurf" : e.erledigt ? "✔ erledigt" : e.vorstand ? "🔒 Clubleitung" : e.unterhaltung ? "" : "";
  const text = b === "nachrichten" && !e.unterhaltung ? suAusschnitt(x.text, muster) : b === "mitglieder" ? x.text : suAusschnitt(x.text, muster, 90);
  const titel = b === "pinnwand" ? suAusschnitt(x.titel, muster, 70) : x.titel;
  return `<button class="su-zeile" onclick="suOeffnen('${b}', ${esc(JSON.stringify(x.id))})">${x.app ? `<span class="su-sym">${x.sym}</span>` : ""}
    <span class="su-text"><b>${suMarkiert(titel, muster)}</b>${marke ? ` <span class="marke">${marke}</span>` : ""}
    ${text && text !== titel ? `<span class="su-aus">${suMarkiert(text, muster)}</span>` : ""}${zusatz.length ? `<span class="su-zusatz">${esc(zusatz.join(" · "))}</span>` : ""}</span><span class="pfeil">›</span></button>`;
}
function suOeffnen(b, id) {
  const x = (SU.ergebnis || []).find((g) => g.bereich === b)?.treffer.find((t) => t.id === id), e = x?.extra || {};
  sucheZu(true); if (history.state?.suche) history.replaceState({ ...history.state, suche: false }, "", location.href);
  if (b === "app") { const a = SU_APP[Number(id)]; return a?.fn(); }
  if (!x) return;
  if (b === "mitglieder") return mitgliedOeffnen(id);
  if (b === "nachrichten") {
    return chatOeffnen(e.thread).then(() => { if (e.unterhaltung) return; const el = document.getElementById("msg-" + id);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("hervor"); setTimeout(() => el.classList.remove("hervor"), 2600); } });
  }
  if (b === "termine") { termineArt = "liste"; return zeige("termine"); }
  if (b === "pinnwand") return zeige("pinnwand");
  if (b === "protokolle") return e.art === "protokoll" ? protokollOeffnen(id) : e.protokoll ? protokollOeffnen(e.protokoll) : zeige("protokolle");
  if (b === "vorschlaege") return zeige("vorschlaege");
  if (b === "aktionen") return aktionOeffnen(id);
  if (b === "archiv") { AR.ziel = e.ordner; return arStart(); }
  if (b === "fotos") { faFilter = e.thema ? { thema: e.thema } : {}; faPapierkorb = false; return zeige("fotos"); }
  if (b === "dienste") return dpNurIch();
}
