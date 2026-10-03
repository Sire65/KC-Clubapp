// Anleitung V2: Bilder für die neuen Funktionen (Demodaten) – ergänzt bild/ und marken.json
import { launch, seite, S } from './basis.mjs';
import fs from 'fs';
const B = `${S}/anl/bild`, marken = JSON.parse(fs.readFileSync(`${S}/anl/marken.json`, 'utf8')), fehler = [];
async function bild(p, name, ziele = []) {
  await p.waitForTimeout(600);
  await p.evaluate(() => { document.getElementById('updateBanner')?.remove(); document.querySelectorAll('.meldung').forEach((m) => m.remove()); });
  await p.screenshot({ path: `${B}/${name}.png` });
  marken[name] = [];
  for (const z of ziele) {
    const r = await p.evaluate((z) => { const e = z.sel ? document.querySelectorAll(z.sel)[z.i || 0] : [...document.querySelectorAll(z.in || 'button')].find((x) => x.offsetParent && x.textContent.includes(z.text));
      if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width * (z.fx ?? 0)) / innerWidth * 100, y: (r.top + r.height * (z.fy ?? 0)) / innerHeight * 100 }; }, z);
    if (!r) fehler.push(`${name}: Ziel fehlt ${JSON.stringify(z)}`);
    marken[name].push(r ? { ...r, dx: 0, dy: 0 } : null);
  }
}
async function stueck(p, name, sel, rand = 4) {
  const ok = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true; }, sel);
  if (!ok) { fehler.push('Ausschnitt fehlt: ' + name); return; }
  await p.waitForTimeout(250);
  const r = await p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  await p.screenshot({ path: `${B}/s-${name}.png`, clip: { x: Math.max(0, r.x - rand), y: Math.max(0, r.y - rand), width: r.w + 2 * rand, height: r.h + 2 * rand } });
}
const b = await launch();
// ---- Register mit Rahmen (nach dem Wechsel, ruhig)
let p = await seite(b, { ansicht: 'erweitert' });
await p.addInitScript(() => { window.SpeechRecognition = window.webkitSpeechRecognition = class { start() {} stop() {} abort() {} }; });
await p.reload(); await p.waitForTimeout(2500); await p.evaluate(() => { document.querySelectorAll('.blatt').forEach((x) => x.classList.add('versteckt')); document.getElementById('updateBanner')?.remove(); });
await p.evaluate(() => { register('mein'); register('verein'); }); await p.waitForTimeout(1800);
await stueck(p, 'register', '#register', 6);
// ---- Chat: Mikrofon-Auswahl, Rechtschreibung
await p.evaluate(() => chatOeffnen('C1')); await p.waitForTimeout(1200);
await p.evaluate(() => document.getElementById('mikroKnopf').click()); await p.waitForTimeout(400);
await stueck(p, 'mikro-wahl', '#mikroWahlBlatt .blatt-innen', 2);
await p.evaluate(() => document.getElementById('mikroWahlBlatt')?.remove());
await p.evaluate(() => rsBlatt()); await p.waitForTimeout(500);
await stueck(p, 'rechtschreibung', '#rsFenster .blatt-innen', 2);
await p.evaluate(() => document.getElementById('rsFenster')?.remove());
// ---- Einstellungen: Sprachansagen-Fenster, Farbschemen
await p.evaluate(() => { zeige('einstellungen'); ansBlatt(); }); await p.waitForTimeout(500);
await stueck(p, 'sprachansagen', '#ansFenster .blatt-innen', 2);
await p.evaluate(() => document.getElementById('ansFenster')?.remove());
await p.evaluate(() => { const d = document.querySelector('details[data-klappe="darstellung"]'); d.open = true; designWahlZeigen(); document.getElementById('designMehrKlappe').scrollIntoView({ block: 'center' }); window.scrollBy(0, -60); });
await bild(p, 'einst-farben', [{ sel: '#designWahl', fx: 0.05, fy: 0.05 }, { sel: '#designMehrKlappe', fx: 0.04, fy: 0.5 }, { sel: '#designBuntKlappe', fx: 0.04, fy: 0.5 }]);
await p.evaluate(() => { document.getElementById('designBuntKlappe').open = true; }); await p.waitForTimeout(300);
await stueck(p, 'farben-bunt', '#designBuntKlappe', 3);
await p.evaluate(() => { const r = document.querySelector('#setSprAnsZeile'); r.closest('details').open = true; });
await stueck(p, 'ansagen-zeilen', 'details[data-klappe="ansagen"]', 2);
await p.close();
// ---- Fotos & Alben
const bildUrl = (i) => `icon-192.png?${i}`;
const fotos = Array.from({ length: 9 }, (_, i) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, thema: i < 5 ? 'Weihnachtsmarkt' : 'Grillfest', datum: i < 5 ? '2026-12-0' + (i + 1) : '2026-07-1' + i, beschreibung: '', bezug_art: null, bezug_id: null, von: { person_id: 'P1', name: 'Max Mustermann' }, vorschau: bildUrl(i), darfAendern: true, meta: null, hochgeladen: '2026-12-01T10:00:00Z' }));
const alben = [{ id: 'a0000000-0000-4000-8000-000000000001', name: 'Weihnachtsmarkt 2026', jahr: 2026, sichtbar: 'alle', eigen: true, von: 'Max Mustermann', darfAendern: true, anzahl: 5, titelfoto: null, deckel: bildUrl(1) },
  { id: 'a0000000-0000-4000-8000-000000000002', name: 'Mein Grillabend', jahr: 2026, sichtbar: 'privat', eigen: true, von: 'Max Mustermann', darfAendern: true, anzahl: 4, titelfoto: null, deckel: bildUrl(6) }];
const fotoAntw = { fotos_liste: () => ({ fotos, themen: [{ thema: 'Weihnachtsmarkt', anzahl: 5 }, { thema: 'Grillfest', anzahl: 4 }], jahre: [{ jahr: '2026', anzahl: 9 }], anlaesse: [], speicher: { belegt: 50e6, grenze: 1073741824, prozent: 4.7, fotosMoeglich: 3000 }, papierkorb: 0, alben, albenKorb: 0, album: null }) };
p = await seite(b, { ansicht: 'erweitert', antworten: fotoAntw });
await p.evaluate(() => { faFilter = {}; zeige('fotos'); }); await p.waitForTimeout(900);
await p.evaluate(() => faWaehlen(true)); await p.waitForTimeout(300);
await p.evaluate(() => { const k = document.querySelectorAll('.fotokachel'); k[0].click(); k[2].click(); k[3].click(); }); await p.waitForTimeout(300);
await bild(p, 'fotos-auswahl', [{ text: 'Neues Album', in: 'button, div, b' }, { text: 'Weihnachtsmarkt', in: 'button, div, b' }, { text: 'Auswahl beenden' }, { text: 'Ins Album', in: '#faLeiste button' }]);
await p.evaluate(() => [...document.querySelectorAll('#faLeiste button')].find((x) => x.textContent.includes('Ins Album')).click()); await p.waitForTimeout(400);
await stueck(p, 'album-wahl', '#faAlbumBlatt .blatt-innen', 2);
await p.close();
// ---- Archiv & Chronik
const REG = ['Gründung', 'Presse', 'Rekorde & Höhepunkte', 'Feste & Jubiläen', 'Mitglieder im Wandel', 'In Gedenken', 'Ehrungen & Urkunden', 'Sonstiges'];
const chronik = { id: 'c1', art: 'chronik', jahr: 1995, titel: 'Clubchronik', farbe: 4, register: REG, nur_vorstand: false, einreichen: true, besitzer: null, eigen: false, anzahl: 3, pruefung: 0 };
const dok = (id, reg, titel, datum, mime, beschreibung = '') => ({ id, ordner_id: 'c1', register: reg, titel, datum, stichworte: [], status: 'ok', beschreibung, name: titel + '.jpg', mime, groesse: 200000, datei: 'a' + id, von: 'Erika Beispiel', vonIch: false, am: '2026-10-01' });
const archiv = { darf: false, vorstand: false, ich: 'P1', arten: { chronik: { sym: '📖', t: 'Chronik' } }, papierkorbTage: 30, speicher: { belegt: 0, grenze: 52428800 }, register: ['Sonstiges'], freigabeMaxTage: 30, personen: [], gruppen: [],
  ordner: [chronik, { id: 'o2', art: 'verein', jahr: 2026, titel: 'Max Mustermann', farbe: 6, register: ['Rechnungen', 'Dienstplan', 'Sonstiges'], besitzer: 'P1', eigen: true, anzahl: 2, pruefung: 0 }],
  dokumente: [dok('1', 'Gründung', 'Gründungsversammlung', '1995-03-14', 'image/jpeg', 'Die Köche gründen den Köcheclub Werne.'), dok('2', 'Rekorde & Höhepunkte', 'Weltrekord: längste Mettwurst', '2004-06-20', 'image/jpeg', 'Auf dem Marktplatz am Stück gegrillt.'), dok('3', 'Presse', 'Zeitungsartikel 2004', '2004-06-22', 'application/pdf')], auto: [], alben };
const blaettern = { ordner: { id: 'c1', titel: 'Clubchronik', jahr: 1995, art: 'chronik', register: REG }, seiten: [
  { id: '1', register: 'Gründung', titel: 'Gründungsversammlung', datum: '1995-03-14', beschreibung: 'Die Köche gründen den Köcheclub Werne.', mime: 'image/png', name: 'a.png', url: 'icon-512.png' },
  { id: '2', register: 'Rekorde & Höhepunkte', titel: 'Weltrekord: längste Mettwurst', datum: '2004-06-20', beschreibung: 'Auf dem Marktplatz am Stück gegrillt.', mime: 'image/png', name: 'b.png', url: 'icon-192.png' }] };
p = await seite(b, { ansicht: 'erweitert', antworten: { archiv_liste: archiv, archiv_blaettern: blaettern, fotos_liste: fotoAntw.fotos_liste } });
await p.evaluate(() => zeige('archiv')); await p.waitForTimeout(900);
await p.evaluate(() => { const h = [...document.querySelectorAll('h3, h2, b, div')].find((x) => x.offsetParent && x.textContent.trim().startsWith('👤 Mein Ordner')); h?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); });
await bild(p, 'archiv-regal', [{ sel: '.ordner', i: 0, fx: 0.5, fy: 0.08 }, { sel: '.ordner.album', i: 0, fx: 0.5, fy: 0.08 }, { text: 'Clubchronik', in: 'h3, h4, b', fx: 0.1, fy: 0.5 }]);
await p.evaluate(() => arOrdnerOeffnen('c1')); await p.waitForTimeout(600); await p.evaluate(() => window.scrollTo(0, 0));
await bild(p, 'chronik-ordner', [{ text: 'Blättern' }, { text: 'So füllen', in: 'button, summary, div' }, { text: 'Beitrag einreichen', in: 'button' }]);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.offsetParent && x.textContent.includes('Blättern')).click()); await p.waitForTimeout(1200);
await p.evaluate(() => blZeigen?.(1)); await p.waitForTimeout(900);
await bild(p, 'chronik-blaettern', [{ text: 'Schließen' }, { sel: '.bl-pfeil.rechts', fx: 0.5, fy: 0.5 }, { text: 'Rekorde', in: 'button' }]);
fehler.push(...p.fehler.map((x) => 'Seite: ' + x));
await p.close(); await b.close();
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken, null, 1));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden');
