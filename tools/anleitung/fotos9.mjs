import { seite, launch } from './basis.mjs';
const B = process.env.S + "/anl/bild-orig/"; // Bilder für Teil 21 (V9); danach mit klein.mjs auf 62 % als JPEG verkleinert
const b = await launch();
const zu = (p) => p.evaluate(() => document.querySelectorAll('.blatt:not(.versteckt)').forEach((x) => { try { fensterZu(x); } catch { x.remove(); } }));
let p = await seite(b, { ansicht: 'einfach' });
// 1) 🐌 Schnecke + „7/18 angemeldet“ auf der Startseite
await zu(p); await p.evaluate(() => { for (let i = 0; i < 3; i++) schneckeMessen(4000); }); await p.waitForTimeout(500);
await p.screenshot({ path: B + 'neu9-schnecke.png' });
// 2) Leiste „Laden dauert zu lange“
await p.evaluate(() => { zeige('termine'); }); await p.waitForTimeout(900); await zu(p);
await p.evaluate(() => { for (let i = 0; i < 3; i++) schneckeMessen(4000); const l = ladeBeginn('kalender'); clearTimeout(l.timer); l.langsam = true; ladeZeigen(); });
await p.waitForTimeout(400); await p.screenshot({ path: B + 'neu9-laden.png' });
await p.evaluate(() => { for (const l of [...LADE.laufe]) ladeEnde(l); });
// 3) Büro: Einlesen + Wohin
await p.evaluate(() => { zeige('buero'); }); await p.waitForTimeout(1500); await zu(p); await p.evaluate(() => document.querySelectorAll('#v-buero .karte.hinweis').forEach((x) => { x.style.visibility = 'hidden'; }));
await p.evaluate(() => buEinlesen()); await p.waitForTimeout(700);
await p.screenshot({ path: B + 'neu9-einlesen.png' });
await p.evaluate(() => einlDateien([new File([new Uint8Array([37,80,68,70,1,2,3])], 'Rechnung_Metzgerei.pdf', { type: 'application/pdf' })])); await p.waitForTimeout(1200);
await p.screenshot({ path: B + 'neu9-wohin.png' });
// 4) Mail mit An/CC/BCC
await p.evaluate(async () => { await mitgliederHolen(); EINL = { titel: 'Rechnung Metzgerei', dateien: [new File([new Uint8Array(180000)], 'Rechnung_Metzgerei.pdf', { type: 'application/pdf' })] }; await einlPerMail(); });
await p.waitForTimeout(600);
await p.evaluate(() => { const ids = (MITGLIEDER || []).filter((m) => m.wege?.mail).map((m) => m.person_id); emWahl(ids[0], 'an'); emWahl(ids[2], 'an'); emWahl(ids[1], 'cc'); emWahl(ids[4], 'bcc'); $('emText').value = 'Hallo zusammen, anbei die Rechnung zur Kontrolle.'; });
await p.waitForTimeout(300); await p.screenshot({ path: B + 'neu9-mail.png' }); await zu(p);
// 5) Mitglied sieht: jemand schaut zu
await p.evaluate(() => { zeige('start'); mlStart('demo', 'Hansi'); clearInterval(MSCH.uhr); }); await p.waitForTimeout(700); await zu(p);
await p.screenshot({ path: B + 'neu9-live.png' });
console.log(JSON.stringify(p.fehler)); await b.close();
