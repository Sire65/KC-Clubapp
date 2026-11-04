import { seite, launch, lage } from './basis.mjs';
import { ANTWORTEN } from './demo.mjs';
import fs from 'fs';
// Bilder für Teil 22 (V10) nach bild-orig/; danach mit klein.mjs auf 62 % als JPEG verkleinern. Nur erfundene Demodaten (demo.mjs).
const B = process.env.S + "/anl/bild-orig/";
fs.mkdirSync(B, { recursive: true });
const b = await launch();
// Lage der Nummern je Bild (optional zum Einmischen in marken.json)
const MARKEN = {};
const marke = async (p, name, sels) => { MARKEN[name] = []; for (const s of sels) MARKEN[name].push(await lage(p, s)); };
// Meldungen, Startfenster und das Angebot „Warum diese App?“ wegräumen
const ruhe = (p) => p.evaluate(() => {
  document.querySelectorAll('body > .meldung, #hsBlase').forEach((x) => x.remove());
  document.querySelectorAll('.blatt:not(.versteckt)').forEach((x) => { try { fensterZu(x); } catch { x.remove(); } });
  try { INIT.einstellungen.rundgang = { erledigt: '2026-11-01T10:00:00Z', wie: 'ende' }; rgHinweisZeigen(); } catch {}
});
const nurMeldungWeg = (p) => p.evaluate(() => document.querySelectorAll('body > .meldung').forEach((x) => x.remove()));
// Demo-Ergänzungen: Lese-Stand in der Chat-Übersicht, Videos im Fotoalbum (Vorschaubilder als gezeichnete SVG)
const vorschau = (farbe, sym) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${farbe}"/><stop offset="1" stop-color="#3b2a20"/></linearGradient></defs><rect width="320" height="320" fill="url(#g)"/><text x="160" y="200" font-size="140" text-anchor="middle">${sym}</text></svg>`);
const U = ANTWORTEN.unterhaltungen.unterhaltungen;
const antworten = {
  unterhaltungen: { unterhaltungen: [
    { ...U[0], meinStand: { id: 'M5', empf: 1, angekommen: 0, gelesen: 0 } },
    { ...U[1], meinStand: { id: 'G9', empf: 3, angekommen: 3, gelesen: 2 } },
    { ...U[2], meinStand: { id: 'M8', empf: 1, angekommen: 1, gelesen: 1 } },
  ] },
  videos_liste: { platz: { belegt: 42e6, grenze: 500e6, moeglich: 45, maxSek: 60 }, videos: [
    { id: 'V1', thema: 'Clubabend', datum: '2026-10-29', beschreibung: 'Anstoßen beim Clubabend', dauer: 24, vorschau: vorschau('#b0413e', '🥂') },
    { id: 'V2', thema: 'Weihnachtsmarkt', datum: '2026-10-25', beschreibung: 'Aufbau der Bude', dauer: 48, vorschau: vorschau('#2e7d32', '🎄') },
    { id: 'V3', thema: 'Kochkurs', datum: '2026-10-18', beschreibung: 'Flammkuchen aus dem Ofen', dauer: 37, vorschau: vorschau('#c77d1a', '🍕') },
  ] },
};
const p = await seite(b, { ansicht: 'einfach', antworten });
// 1) Startseite: Info-Laufband, Namen im Kopf, Eselsohr, blinkender Knopf „Nachrichten“
await ruhe(p); await p.waitForTimeout(800); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-start.png' });
await marke(p, 'neu10-start', ['#infoLaufband', '.on-namen', '#eselsohr', 'button[data-v="nachrichten"]']);
// 2) Twinkey hilft von selbst (auf der Pinnwand)
await p.evaluate(() => zeige('pinnwand')); await p.waitForTimeout(1500); await ruhe(p);
await p.evaluate(() => hsZeigen('pinnwand', 'lange')); await p.waitForTimeout(600);
await p.screenshot({ path: B + 'neu10-twinkey.png' });
await ruhe(p);
// 3) Erklär-Videos mit Dauer
await p.evaluate(() => zeige('start')); await p.waitForTimeout(500);
await p.evaluate(() => erklaerVideos()); await p.waitForTimeout(1500); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-videos.png' });
await ruhe(p);
// 4) Nachrichten-Übersicht: gegliedert, Lese-Stand
await p.evaluate(() => zeige('nachrichten')); await p.waitForTimeout(1500); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-chats.png' });
// 5) Chat: Versand-Leiste, Formatier-Zeile, Grußformel
await p.evaluate(() => chatOeffnen('C1')); await p.waitForTimeout(1500); await ruhe(p);
await p.evaluate(() => { const t = $('text'); t.value = 'Hallo Erika, die Schürzen bringe ich am Donnerstag mit.'; t.dispatchEvent(new Event('input', { bubbles: true })); });
await p.waitForTimeout(400); await p.evaluate(() => grussUmschalten(true)); await p.waitForTimeout(400); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-chat.png' });
await p.evaluate(() => { grussUmschalten(false); const t = $('text'); t.value = ''; t.dispatchEvent(new Event('input', { bubbles: true })); });
// 6) Rückseite → Uhr → Timer läuft
await p.evaluate(() => { esSchreib('uhrmodus', 'timer'); esOeffnen('uhr'); }); await p.waitForTimeout(2500); await ruhe(p);
await p.evaluate(() => wkTimerStart(5)); await p.waitForTimeout(2600); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-uhr.png' });
await p.evaluate(() => { try { wkTimer('stopp'); } catch {} try { esDrehen(false, true); } catch {} });
await p.waitForTimeout(600);
// 7) Fotoalbum: Videos
await p.evaluate(() => zeige('fotos')); await p.waitForTimeout(1500); await ruhe(p);
await p.evaluate(() => faArt('videos')); await p.waitForTimeout(1200); await nurMeldungWeg(p);
await p.screenshot({ path: B + 'neu10-album.png' });
await p.evaluate(() => faArt('fotos'));
// 8) Einstellungen: Themen
await p.evaluate(() => einstiegHin('darstellung', 'themaWahl')); await p.waitForTimeout(1600); await nurMeldungWeg(p);
await p.evaluate(() => document.querySelectorAll('.hervor').forEach((x) => x.classList.remove('hervor')));
await p.evaluate(() => { const z = $('themaWahl'); z.scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); }); await p.waitForTimeout(500);
await p.screenshot({ path: B + 'neu10-themen.png' });
// 9) Einstellungen: Privatsphäre mit App-PIN
await p.evaluate(() => { document.querySelectorAll('#v-einstellungen details[open]').forEach((d) => { d.open = false; }); einstiegHin('privat'); }); await p.waitForTimeout(1600); await nurMeldungWeg(p);
await p.evaluate(() => { document.querySelectorAll('.hervor').forEach((x) => x.classList.remove('hervor')); const d = document.querySelector('#v-einstellungen details[data-klappe="privat"]'); d.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90);
  const g = $('gebHinweis'); if (g) g.textContent = 'Andere sehen dann nur Tag und Monat – im Kalender, in der Terminliste und unter „Heute wichtig“.'; }); await p.waitForTimeout(500);
await p.screenshot({ path: B + 'neu10-pin.png' });
fs.writeFileSync(process.env.S + '/anl/marken-neu10.json', JSON.stringify(MARKEN));
console.log(JSON.stringify(p.fehler)); await b.close();
