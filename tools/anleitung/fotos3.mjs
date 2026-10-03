// Anleitung V3: Bilder der Funktionen ab 1.87 (Demodaten) – ergänzt bild/ und marken.json
import { launch, seite, S } from './basis.mjs';
import fs from 'fs';
const B = `${S}/anl/bild`, marken = JSON.parse(fs.readFileSync(`${S}/anl/marken.json`, 'utf8')), fehler = [];
const sauber = (p) => p.evaluate(() => { document.getElementById('updateBanner')?.remove(); document.querySelectorAll('.meldung').forEach((m) => m.remove()); });
async function bild(p, name, ziele = []) {
  await p.waitForTimeout(600); await sauber(p);
  await p.screenshot({ path: `${B}/${name}.png` });
  marken[name] = [];
  for (const z of ziele) {
    const r = await p.evaluate((z) => { const e = z.sel ? document.querySelectorAll(z.sel)[z.i || 0] : [...document.querySelectorAll(z.in || 'button')].find((x) => x.offsetParent && x.textContent.includes(z.text));
      if (!e) return null; const r = e.getBoundingClientRect(); return { x: (r.left + r.width * (z.fx ?? 0)) / innerWidth * 100, y: (r.top + r.height * (z.fy ?? 0)) / innerHeight * 100 }; }, z);
    if (!r) fehler.push(`${name}: Ziel fehlt ${JSON.stringify(z)}`);
    marken[name].push(r ? { ...r, dx: 0, dy: 0 } : null);
  }
}
async function stueck(p, name, sel, rand = 4, holen) {
  const ok = await p.evaluate(([s, h]) => { const e = h ? document.querySelector(s)?.closest(h) : document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center' }); return true; }, [sel, holen]);
  if (!ok) { fehler.push('Ausschnitt fehlt: ' + name); return; }
  await p.waitForTimeout(300); await sauber(p);
  const r = await p.evaluate(([s, h]) => { const e = h ? document.querySelector(s).closest(h) : document.querySelector(s); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, [sel, holen]);
  await p.screenshot({ path: `${B}/s-${name}.png`, clip: { x: Math.max(0, r.x - rand), y: Math.max(0, r.y - rand), width: r.w + 2 * rand, height: r.h + 2 * rand } });
}
const zu = (p) => p.evaluate(() => document.querySelectorAll('.blatt:not(.versteckt)').forEach((b) => fensterZu(b)));
const arten = { aufbau: '🧱 Aufbauen', einkauf: '🛒 Einkauf', sonstiges: '🙋 Sonstiges' }, zf = { vormittag: '🌅 Vormittag', nachmittag: '☀️ Nachmittag', abend: '🌙 Abend' };
const aufruf = (x) => ({ id: 'h1', art: 'sonstiges', datum: '2026-11-02', slot: null, nachAbsprache: true, anzahl: null, ort: 'Vereinsheim', notiz: 'Wobei: Zelt reparieren\nDas große Zelt hat einen Riss. Bitte Werkzeug mitbringen – wir machen den Termin miteinander aus.', ziel: 'alle',
  von: { person_id: 'P2', name: 'Erika Beispiel' }, eigen: false, offen: true, komme: ['Otto Muster'], kannNicht: 0, meine: null, darfSchliessen: false, ...x });
const hilfe = (a) => ({ aufrufe: [a], angebote: [], arten, zeitfenster: zf, orte: ['Vereinsheim'] });
const pin = (a) => ({ max: 4, zeichen: 200, meine: 0, hilfe: { arten, zeitfenster: zf, aufrufe: [a] },
  zettel: [{ id: 'z1', text: 'Gute Besserung, Klaus! 🤒💐 Wir denken an dich.', wichtig: false, fuer: 'alle', erstellt_am: new Date().toISOString(), vonMir: false, farbe: 3, von: { person_id: 'P3', vorname: 'Otto' }, empfaenger: [], erledigt: null }] });
const b = await launch();
// ---- Pinnwand mit Hilfe-Aushang + Zettel mit Emojis
let a = aufruf();
let p = await seite(b, { antworten: { pinnwand: pin(a), pinnwand_neu: { neu: [] }, hilfe_liste: hilfe(a) } });
await p.reload(); await p.waitForTimeout(2500); await zu(p);
await p.evaluate(() => zeige('pinnwand')); await p.waitForTimeout(900); await zu(p);
await bild(p, 'pinnwand-hilfe', [{ sel: '.zettel.aushang .zwichtig' }, { sel: '.zettel.aushang .antw' }, { sel: '.zettel.f3 .ztext' }]);
await stueck(p, 'pw-aushang', '.zettel.aushang', 10);
// Zettel schreiben mit Emojis
await p.evaluate(() => { pwForm(true); $('pwText').value = 'Gute Besserung, Klaus! 🤒💐'; pwZaehlen(); });
await stueck(p, 'pw-emoji', '#pwEmoSchnell', 6);
await p.evaluate(() => pwForm(false));
// ---- Kurzansicht (Mitglied)
await p.evaluate(() => hilfeVonPinnwand('h1')); await p.waitForTimeout(1200);
await bild(p, 'hilfe-kurz', [{ sel: '.hk h3' }, { sel: '.hk-zeile', i: 0 }, { sel: '.hk-zeile', i: 1 }, { sel: '.hk-zeile', i: 3 }, { sel: '.hk-text' }, { sel: '.hk-knoepfe .knopf', i: 0 }, { sel: '.hk-knoepfe .knopf', i: 1 }, { sel: '.hk-knoepfe .knopf', i: 2 }]);
await p.context().close();
// ---- Eigener Aufruf: Kurzansicht mit Stand + Ändern
a = aufruf({ eigen: true, darfSchliessen: true, anzahl: 2, von: { person_id: 'P1', name: 'Max Mustermann' } });
p = await seite(b, { antworten: { pinnwand: pin(a), pinnwand_neu: { neu: [] }, hilfe_liste: hilfe(a) } });
await p.reload(); await p.waitForTimeout(2500); await zu(p);
await p.evaluate(() => hilfeDirekt('h1')); await p.waitForTimeout(1200);
await stueck(p, 'hilfe-eigen', '.hk', 6);
// ---- Formular „Hilfe suchen“: nach Absprache + egal wie viele
await zu(p); await p.evaluate(() => { hlStart('helfen'); }); await p.waitForTimeout(900);
await p.evaluate(() => { hilfeNeu(); hlSetze('art', 'sonstiges'); HL.form.artText = 'Zelt reparieren'; hlSetze('absprache', true); hlSetze('ohne', true); }); await p.waitForTimeout(400);
await p.evaluate(() => { const t = document.querySelector('textarea.hl-notiz'); if (t) { t.value = 'Das große Zelt hat einen Riss. Bitte Werkzeug mitbringen.'; } });
await bild(p, 'hilfe-form', [{ sel: '.hl-chips .chip.an' }, { text: 'Nach Absprache' }, { text: 'Egal wie viele' }]);
await stueck(p, 'hilfe-text', 'textarea.hl-notiz', 8, 'label');
await p.context().close();
// ---- Anmelde-Code (ohne Link)
p = await seite(b, { ohneKey: true }); await p.reload(); await p.waitForTimeout(2000);
await p.evaluate(() => { $('kcCode').value = '482 913'; });
await stueck(p, 'kurzcode', '#kcCode', 8, '.karte');
await p.context().close();
// ---- Mitglieder nur online (Kopf-Kachel) + einfache Verbindung + Offline-Nachricht + Rückfrage
p = await seite(b, {}); await p.reload(); await p.waitForTimeout(2500); await zu(p);
await p.evaluate(() => mgNurOnline()); await p.waitForTimeout(900);
await p.evaluate(() => window.scrollTo(0, 0));
await bild(p, 'online-seite', [{ sel: '#mgFilter button[data-f="online"]' }, { sel: '#mitgliederListe .mg-kachel, #mitgliederListe > *' }]);
await p.evaluate(() => zeige('start')); await p.waitForTimeout(500);
await p.evaluate(() => verbindungBlatt()); await p.waitForTimeout(400);
await stueck(p, 'verbindung-einfach', '#vbInhalt', 10);
await zu(p);
await p.evaluate(() => { chatId = 'demo-chat'; zeige('chat'); }); await p.waitForTimeout(500);
await p.context().setOffline(true);
await p.evaluate(() => { $('text').value = 'Bin gleich da – Stau auf der A1.'; senden(); }); await p.waitForTimeout(500);
await stueck(p, 'ow-blase', '.ow-warte', 10);
await p.context().setOffline(false); await p.evaluate(() => { localStorage.removeItem('kc_club_warteschlange'); document.querySelector('.ow-warte')?.remove(); });
await p.evaluate(() => { frage('Termin „Clubabend“ wirklich löschen?'); }); await p.waitForTimeout(400);
await stueck(p, 'rueckfrage', '.dlg-innen', 6);
await b.close();
fs.writeFileSync(`${S}/anl/marken.json`, JSON.stringify(marken, null, 1));
console.log(fehler.length ? fehler.join('\n') : 'alles gefunden');
