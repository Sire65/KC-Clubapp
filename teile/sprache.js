// KC-CLUB-SPRACHE (10.11.2026, Wunsch Hansi „Flagge im Kopf … Bedienelemente auf Englisch, nicht die Inhalte … Begrüßung Good morning Hans“).
// Nachladbares Teil: wird nur geladen, wenn jemand 🇬🇧 wählt. Übersetzt NUR Bedienelemente (Knöpfe, Leiste unten, Seitentitel, Klappen-Überschriften,
// Beschriftungen, Platzhalter/Hinweise an Knöpfen) – exakter Textvergleich über das Wörterbuch SP_EN. Inhalte (Nachrichten, Termine, Namen, Hilfe-Texte,
// Zeitschrift …) bleiben deutsch: was nicht im Wörterbuch steht, bleibt unverändert, und Inhaltsbereiche (SP_NIE) werden nie angefasst.
// Zurück auf Deutsch: jeder übersetzte Text kennt sein Original (Knoten.__spDe / Element.__spAttr) und wird wiederhergestellt.
// Nach und nach erweitern: einfach weitere Einträge in SP_EN (Deutsch → Englisch, genau wie in der App ohne Symbol davor/dahinter).
const SP_EN = {
  // Leiste unten („Start“ → „Home“ nur dort, siehe SP_FUSS)
  "Termine": "Events", "Nachrichten": "Messages", "Mitglieder": "Members", "Mehr": "More",
  // Startseite
  "Schnellzugriff": "Quick access", "> Einfache Ansicht <": "> Simple view <", "< Erweiterte Ansicht >": "< Advanced view >",
  "Erweiterte Ansicht": "Advanced view", "Einfache Ansicht": "Simple view", "Club": "Club", "Meins": "Mine", "Technik": "Tech", "Admin": "Admin",
  "App schließen": "Close app", "Übersicht": "Overview", "Heute wichtig": "Today", "Kacheln anordnen": "Arrange tiles", "Standard": "Default",
  // Seitentitel
  "Vorschläge": "Suggestions", "Büro": "Office", "Helfen & Leihen": "Help & lend", "Spiele": "Games", "Aktionen": "Activities", "Aktion": "Activity",
  "Fotoalbum": "Photo album", "Feedback": "Feedback", "Mitglied": "Member", "Protokolle": "Minutes", "Dienstpläne": "Duty rosters",
  "Erstattung beantragen": "Request reimbursement", "Meine Dokumente": "My documents", "Sicherheits-Check": "Security check",
  "Freigegebene Programme": "Approved programs", "Club-App auf einen Blick": "Club app at a glance", "Hilfe & Tipps": "Help & tips",
  "SOS – Notfall": "SOS – emergency", "Standorte": "Locations", "Pinnwand": "Notice board", "Neue Nachricht": "New message",
  "Aktive Mitglieder": "Active members", "Einstellungen": "Settings",
  // häufige Knöpfe
  "Schließen": "Close", "Abbrechen": "Cancel", "Später": "Later", "Löschen": "Delete", "Speichern": "Save", "Ändern": "Change", "Zurück": "Back",
  "Drucken": "Print", "Fertig": "Done", "Kopieren": "Copy", "Nein, danke": "No, thanks", "Zurück ins Büro": "Back to the office", "Drucken / PDF": "Print / PDF",
  "Neu": "New", "Nicht mehr fragen": "Don't ask again", "Teilen": "Share", "Alle": "All", "Verstanden": "Got it", "Keiner": "None", "Übernehmen": "Apply",
  "Probe": "Test", "Nochmal laden": "Reload", "Senden": "Send", "Nachricht schreiben": "Write message", "Ende": "End", "Bearbeiten": "Edit",
  "Erledigt": "Done", "Vorschau": "Preview", "Beenden": "Finish", "Weiter ›": "Next ›", "Weiter": "Next", "Nein": "No", "Ja": "Yes",
  "Test an mich": "Test to me", "Verwerfen": "Discard", "Entfernen": "Remove", "Vorlesen": "Read aloud", "Nochmal versuchen": "Try again",
  "Nochmal": "Again", "Jetzt aktualisieren": "Update now", "Kamera": "Camera", "Schreiben": "Write", "Für alle": "For everyone",
  "Zur Kenntnis genommen": "Noted", "Heute nicht mehr": "Not today", "Problem melden": "Report a problem", "Dazu": "Add",
  "Filter zurücksetzen": "Reset filter", "Antworten": "Reply", "Liste": "List", "Suchen": "Search", "Hinzufügen": "Add", "Öffnen": "Open",
  "Ansehen": "View", "Hochladen": "Upload", "Herunterladen": "Download", "Auswählen": "Select", "Absagen": "Cancel", "Zusagen": "Accept",
  "Vielleicht": "Maybe", "Mehr dazu": "More about this", "Kenne ich": "I know", "Keine Tipps mehr anzeigen": "Show no more tips",
  "Rückseite zeigen": "Show back", "Aktualisieren": "Refresh", "Anrufen": "Call", "Tag/Nacht umschalten": "Switch day/night",
  // Seite ⚙️ Mehr – Überschriften der Klappen
  "Weitere Farbschemen": "More colour schemes", "Ausgefallene Farbschemen": "Unusual colour schemes", "Effekt auswählen": "Choose effect",
  "Startseite & Ansicht": "Home page & view", "Admin-Einstellungen": "Admin settings", "Bundesländer wählen": "Choose federal states",
  "Ansagen, Töne & Tipps": "Announcements, sounds & tips", "Clubleitung beim Start": "Club management at start", "Zeiten & @Erwähnungen": "Times & @mentions",
  "Welche Uhr?": "Which clock?", "Benachrichtigungen": "Notifications", "Anklopfton": "Call-waiting tone", "Privatsphäre": "Privacy",
  "Schritte vorlesen": "Read steps aloud", "App-Installation": "App installation", "Nachrichten an mehrere oder mit Anlage": "Messages to several or with attachment",
  "Anrufe: Schnellantworten": "Calls: quick replies", "Pinnwand: Erinnerung an alte Zettel": "Notice board: reminder of old notes",
  "Sprachbefehle & Training": "Voice commands & training", "Termine im Handy-Kalender": "Events in the phone calendar", "Erstattung (km-Satz)": "Reimbursement (rate per km)",
  "Einstieg: Tipps nach und nach": "Getting started: tips step by step", "Wen anzeigen?": "Whom to show?", "Wer ist dabei?": "Who is in?",
  "Welche Spiele & Einladung": "Which games & invitation", "Darstellung": "Appearance", "Einweisungen wiederholen": "Repeat introductions",
  "Szenen: Jahreszeit wählen & Vorschau": "Scenes: choose season & preview", "Wetter (Ort & Wetter-App)": "Weather (place & weather app)",
  "Schatten einstellen": "Shadow settings", "Effekte": "Effects", "Blinken": "Blinking", "Name & Symbol": "Name & icon", "Symbole auswählen": "Choose icons",
  "Schnellstart": "Quick start", "Das Wichtigste": "The essentials", "Welche Fristen und wie?": "Which deadlines and how?", "Warte-Bild:": "Waiting image:",
  "App-Info": "App info",
};
// Wo übersetzt wird (Bedienelemente) – und wo nie (Inhalte)
const SP_FUSS = { "Start": "Home" }; // nur in der Leiste unten – „▶ Start“ in Spielen bleibt „Start“
const SP_BEDIEN = "button, label, summary, legend, th, option, .kopf2 h2, .fuss-leiste, .sz-link, .ansichtname, .register, [data-sp]";
const SP_NIE = "#chat, .chat, .nachricht, .na-text, .bl-buehne, .mag-seite, .magazin, [data-sp-nein], input, textarea, select, [contenteditable], script, style";
const SP_ATTR = ["placeholder", "title", "aria-label"];
const SPRACHE_LAUF = { an: false, beob: null };

function spUebersetzt(t, fuss) {
  if (!t || !t.trim()) return null;
  const m = String(t).match(/^([\s\P{L}]*?)(\p{L}[\s\S]*?\p{L}|\p{L})([\s\P{L}]*)$/u); // Symbol/Leerraum davor und dahinter bleiben
  if (!m) return null;
  const en = (fuss ? SP_FUSS[m[2]] : undefined) ?? SP_EN[m[2]] ?? SP_EN[m[2].replace(/\s+/g, " ")]; if (en == null) return null;
  return m[1] + en + m[3];
}
function spKnoten(n) {
  const p = n.parentElement; if (!p || !p.closest(SP_BEDIEN) || p.closest(SP_NIE)) return;
  if (n.__spDe != null && n.nodeValue === n.__spEn) return; // schon übersetzt
  const en = spUebersetzt(n.nodeValue, !!p.closest(".fuss-leiste")); if (en == null) return;
  n.__spDe = n.nodeValue; n.__spEn = en; n.nodeValue = en;
}
function spElement(e) {
  if (e.closest(SP_NIE) || !e.matches(SP_BEDIEN + ", [title], [placeholder], [aria-label]")) return;
  if (!e.closest(SP_BEDIEN) && !e.matches("button, a, [role=button]")) return;
  for (const a of SP_ATTR) { const v = e.getAttribute(a); if (!v) continue; const en = spUebersetzt(v); if (en == null) continue;
    if (!e.__spAttr) e.__spAttr = {}; e.__spAttr[a] = v; e.setAttribute(a, en); }
}
function spBaum(wurzel) {
  if (!wurzel) return;
  if (wurzel.nodeType === 3) return spKnoten(wurzel);
  if (wurzel.nodeType !== 1 || wurzel.closest?.(SP_NIE)) return;
  const w = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) spKnoten(n);
  spElement(wurzel); wurzel.querySelectorAll("[title], [placeholder], [aria-label]").forEach(spElement);
}
function spracheEnglisch() {
  SPRACHE_LAUF.an = true; document.documentElement.lang = "en";
  spBaum(document.body);
  if (!SPRACHE_LAUF.beob) SPRACHE_LAUF.beob = new MutationObserver((ms) => { if (!SPRACHE_LAUF.an) return; for (const m of ms) { if (m.type === "characterData") spKnoten(m.target); else m.addedNodes.forEach(spBaum); } });
  SPRACHE_LAUF.beob.observe(document.body, { childList: true, subtree: true, characterData: true });
  return true;
}
function spracheDeutsch() {
  SPRACHE_LAUF.an = false; SPRACHE_LAUF.beob?.disconnect(); document.documentElement.lang = "de";
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) if (n.__spDe != null) { if (n.nodeValue === n.__spEn) n.nodeValue = n.__spDe; delete n.__spDe; delete n.__spEn; }
  document.querySelectorAll("[title], [placeholder], [aria-label]").forEach((e) => { if (!e.__spAttr) return; for (const [a, v] of Object.entries(e.__spAttr)) e.setAttribute(a, v); delete e.__spAttr; });
  return true;
}
