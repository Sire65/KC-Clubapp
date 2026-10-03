import { chromium } from 'playwright';
import fs from 'fs';
const D = process.env.D, F = `${process.env.S}/anl/fonts`;
const muetze = fs.readFileSync('/home/user/kc-clubapp/kc-kochmuetze-weiss.webp').toString('base64');
const fall = (t, schritte) => `<div class="fall"><h4>${t}</h4><ol>${schritte.map((x) => `<li>${x}</li>`).join('')}</ol></div>`;
const dienst = [
  ['GitHub', 'Programm der App und die Internetseite (sire65.github.io)', 'Konto „Sire65“'],
  ['Supabase', 'Datenbank und Club-Server (alle Mitgliederdaten, Nachrichten, Termine)', ''],
  ['Neon', 'zweite Datenbank: Sicherungs-Spiegel und tägliches Backup', ''],
  ['Cloudflare', 'Ersatz-Server für den Notbetrieb', ''],
  ['web.de (Versand-Postfach)', 'Absender der Club-Mails', ''],
  ['Brevo / weitere Mail-Dienste', 'Ersatzweg für Mails, falls web.de streikt', ''],
  ['Claude (claude.ai)', 'Programmier-Hilfe, mit der die App gebaut und gepflegt wird', ''],
  ['Eigene Admin-App', 'Hansis persönlicher Link zur Club-App (nur für den Notfall)', ''],
];
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
@font-face { font-family: Lato; src: url(file://${F}/Lato-Regular.ttf); } @font-face { font-family: Lato; src: url(file://${F}/Lato-Bold.ttf); font-weight: 700; }
@page { size: A4; margin: 22mm 16mm 18mm 16mm; } body { font-family: Lato, sans-serif; font-size: 10.5pt; color: #222; line-height: 1.38; margin: 0; }
h1 { color: #1f3a5f; font-weight: 400; font-size: 22pt; margin: 0 0 1mm; } .unter { color: #666; font-style: italic; margin: 0 0 6mm; }
h2 { color: #2e7d32; font-size: 13.5pt; margin: 7mm 0 2mm; break-after: avoid; } h4 { color: #1f3a5f; margin: 0 0 1mm; font-size: 11pt; }
.kasten { border-left: 5px solid #2e7d32; background: #e8f5e9; padding: 3mm 5mm; margin: 3mm 0; } .warn { border-left-color: #c62828; background: #fdecea; }
.fall { border: 1px solid #d9d9d9; border-radius: 2mm; padding: 2.5mm 4mm; margin: 2.5mm 0; break-inside: avoid; } ol { margin: 1mm 0 0 5mm; padding: 0; } li { margin: .8mm 0; }
table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #999; padding: 2mm; vertical-align: top; font-size: 9.5pt; } th { background: #eef2f7; text-align: left; }
td.leer { height: 11mm; } .seite { page-break-before: always; } .klein { font-size: 9pt; color: #555; }
</style></head><body>
<h1>Vertretung des Admins</h1><p class="unter">Betriebsanleitung für die Köcheclub-App · Version 1 · Stand 03.10.2026 (App 2.2.0)</p>
<div class="kasten"><b>Wozu?</b> Der Admin (heute: Hansi) ist der einzige, der Links erzeugen, Rechte ändern und die Technik überblicken kann. Fällt er aus – Urlaub, Krankheit, verlorenes Handy –, übernimmt die <b>Vertretung</b>. Diese Anleitung erklärt in einfachen Schritten, was dann zu tun ist. Für die meisten Fälle reicht die App selbst; man muss nichts programmieren.</div>

<h2>1. Wie wird man Vertretung?</h2>
<ol><li>Der Admin öffnet <b>👥 Mitglieder</b> → das Mitglied antippen → <b>🎖️</b> (Amt &amp; Rechte).</li>
<li>Schalter <b>„🛡️ Admin (Vertretung)“</b> einschalten und die Rückfrage bestätigen.</li>
<li>Die Vertretung bekommt eine Mitteilung und sieht ab sofort die <b>Admin-Zentrale</b> und dieses Dokument unter 📚 Meine Dokumente.</li></ol>
<p class="klein">Empfehlung: eine Person aus der Clubleitung (z. B. der Clubsprecher), die die App regelmäßig nutzt. Zurücknehmen geht genauso (Schalter aus).</p>

<h2>2. Was die App schon allein erledigt</h2>
<ul><li><b>Updates</b> kommen von selbst zu allen Mitgliedern.</li><li>Fällt der Server aus, springt der <b>Notbetrieb</b> automatisch an (oranges Band) und schaltet sich wieder ab.</li>
<li>Jede Nacht läuft die <b>Datensicherung</b>; der Spiegel in die zweite Datenbank läuft laufend.</li><li>„<b>Link verloren?</b>“ – Mitglieder können sich selbst einen neuen Link per Mail schicken.</li>
<li>Ist länger als 10 Tage kein Admin in der App, bekommt die Clubleitung automatisch einen Hinweis.</li></ul>

<h2>3. Häufige Fälle – Schritt für Schritt</h2>
${fall('Ein Mitglied kommt nicht mehr in die App (Link verloren, neues Handy)', ['Erst fragen: „Link verloren?“ auf der Anmeldeseite antippen und die eigene Mail-Adresse eingeben – kommt meist von selbst.', 'Klappt das nicht: 👥 Mitglieder → Mitglied → <b>🔗 Neuer Link</b> → „🟢 Per WhatsApp schicken“ oder „📋 Kopieren“.', 'Oder am Clubabend: <b>🖨️ Einrichtungskarte</b> drucken – Kamera drauf, Link antippen, die App führt durch die Einrichtung.', 'Hinweis: Ein neuer Link macht den alten ungültig.'])}
${fall('Ein neues Mitglied', ['Das Mitglied wird zuerst in der <b>KC Verwaltung</b> (PC-Programm) angelegt – erst dann kennt es die App.', 'In der App: 👥 Mitglieder → Mitglied → <b>🖨️ Einrichtungskarte</b> drucken und übergeben (oder Link per WhatsApp).', 'Optional: Rechte und Ämter über 🎖️ setzen.'])}
${fall('Ein Mitglied tritt aus oder ist verstorben', ['In der <b>KC Verwaltung</b> auf „inaktiv“ setzen – damit endet auch der Zugang zur App.', 'Persönliche Daten und Ordner nicht sofort löschen; mit der Clubleitung klären, was ins Archiv kommt.'])}
${fall('Die App zeigt eine Störung (Lämpchen rot)', ['Kurz warten – meist ist es ein kurzer Aussetzer. Der Notbetrieb springt bei längeren Störungen allein an.', 'Admin-Zentrale öffnen: Dort steht, ob Server, Mails/Push oder Datenbank betroffen sind.', 'Hält es mehr als einen Tag an: den Notfall-Umschlag nutzen (Abschnitt 5) bzw. jemanden mit Technik-Kenntnis hinzuziehen.'])}
${fall('Ein Mitglied meldet „die App startet nicht“', ['Die App zeigt nach 12 Sekunden selbst Hilfe: „Nochmal versuchen“ und „🧹 Speicher der App leeren“ – die Anmeldung bleibt.', 'In der Admin-Zentrale unter <b>🩺 Fehlerprotokoll</b> steht, welches Gerät und welcher Browser betroffen sind.'])}
${fall('Rechte ändern (Büro, Termine anlegen, Protokolle)', ['Admin-Zentrale → <b>🔐 Freigaben</b> (Büro lesen/schreiben).', '👥 Mitglieder → Mitglied → <b>🎖️</b> für Ämter und Rechte.'])}

<h2>4. Wöchentlicher Blick (5 Minuten)</h2>
<ul><li>Admin-Zentrale: alle Lämpchen grün? Fehlerprotokoll ohne neue rote Einträge?</li><li>„Zuletzt in der App“ – kommen die Mitglieder gut zurecht? Wer noch nie drin war, braucht vielleicht eine Einrichtungskarte.</li>
<li>Speicher und Datenbank unter 70 % des kostenlosen Tarifs?</li></ul>

<h2>5. Der Notfall-Umschlag</h2>
<div class="kasten warn"><b>Nur öffnen, wenn der Admin für längere Zeit nicht erreichbar ist</b> und etwas Wichtiges nicht mit der App allein zu lösen ist. Beim Öffnen: Datum, Grund und wer dabei war notieren (letzte Seite). Danach müssen alle Passwörter geändert und der Umschlag neu angelegt werden.</div>
<p>Im Umschlag liegt das ausgefüllte Blatt „Zugänge“ (nächste Seite). <b>In dieser Datei stehen absichtlich keine Passwörter</b> – die werden nur von Hand auf das ausgedruckte Blatt geschrieben.</p>
<p><b>Was man mit den Zugängen tun kann:</b> Programm-Änderungen und schwierige Fehler erledigt man am besten zusammen mit der Programmier-Hilfe (Claude), die die App kennt – dort steht der ganze Aufbau beschrieben. Bitte nichts an der Datenbank „ausprobieren“: Es geht um die Daten aller Mitglieder.</p>

<section class="seite"><h1>Notfall-Umschlag – Zugänge</h1><p class="unter">Von Hand ausfüllen · ausdrucken · in einen Umschlag · versiegeln · beim Clubsprecher hinterlegen · jährlich prüfen</p>
<table><tr><th style="width:24%">Dienst</th><th style="width:30%">Wofür</th><th>Benutzer / Mail</th><th>Passwort</th><th style="width:15%">2-Faktor / Wiederherstellungscode</th></tr>
${dienst.map(([d, w, b]) => `<tr><td><b>${d}</b></td><td>${w}</td><td class="leer">${b}</td><td class="leer"></td><td class="leer"></td></tr>`).join('')}
<tr><td class="leer"></td><td></td><td></td><td></td><td></td></tr><tr><td class="leer"></td><td></td><td></td><td></td><td></td></tr></table>
<p class="klein">Tipp: Wo es geht, die 2-Faktor-Wiederherstellungscodes mit hineinlegen – sonst kommt man ohne Hansis Handy nicht hinein.</p>
<table style="margin-top:6mm"><tr><th>Angelegt am</th><th>von</th><th>hinterlegt bei</th><th>zuletzt geprüft</th></tr><tr><td class="leer"></td><td></td><td></td><td></td></tr></table></section>

<section class="seite"><h1>Protokoll beim Öffnen</h1><p class="unter">Jedes Öffnen eintragen – danach alle Passwörter ändern und den Umschlag neu anlegen</p>
<table><tr><th style="width:16%">Datum</th><th>Grund</th><th style="width:22%">Wer war dabei</th><th style="width:18%">Passwörter geändert am</th></tr>
${Array.from({ length: 8 }, () => '<tr><td class="leer"></td><td></td><td></td><td></td></tr>').join('')}</table></section>
</body></html>`;
fs.writeFileSync(`${D}/vertretung.html`, html);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await (await b.newContext()).newPage();
await p.goto(`file://${D}/vertretung.html`); await p.waitForTimeout(800);
await p.pdf({ path: `${D}/Vertretung_Admin_V1.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: true, preferCSSPageSize: true,
  headerTemplate: `<div style="width:100%;margin:0 16mm;font-family:Lato,sans-serif;font-size:9px;display:flex;justify-content:space-between;border-bottom:1.6px solid #1f3a5f;padding-bottom:4px"><span style="display:flex;align-items:center;gap:8px;color:#1f3a5f;font-weight:700;font-size:11px"><img src="data:image/webp;base64,${muetze}" style="height:16px;filter:brightness(0)">Köcheclub Werne</span><span style="color:#555">Vertretung des Admins · vertraulich</span></div>`,
  footerTemplate: `<div style="width:100%;text-align:center;font-family:Lato,sans-serif;font-size:9px;color:#666">Seite <span class="pageNumber"></span> von <span class="totalPages"></span></div>` });
await b.close(); console.log('fertig');
