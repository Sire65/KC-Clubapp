import { seite, launch } from './basis.mjs';
const B = process.env.S + "/anl/bild/"; // Bilder für Teil 20 (V8); danach mit klein.mjs-Verfahren auf 62 % als JPEG verkleinert
const b = await launch();
const zu = (p) => p.evaluate(() => document.querySelectorAll('.blatt:not(.versteckt)').forEach((x) => { try { fensterZu(x); } catch { x.remove(); } }));
// 1) Unterstützung wählen
let p = await seite(b, { ansicht: 'einfach' });
await p.evaluate(() => ustFragen(false)); await p.waitForTimeout(900);
await p.screenshot({ path: B + 'neu8-ust.png' }); await zu(p);
// 2) Schritt-Hilfe auf der Pinnwand
await p.evaluate(() => { lsSetzen('kc_club_schritt_hilfe', '1'); zeige('pinnwand'); }); await p.waitForTimeout(1800);
await p.screenshot({ path: B + 'neu8-sh.png' });
await p.evaluate(() => { lsSetzen('kc_club_schritt_hilfe', '0'); zeige('start'); }); await p.waitForTimeout(600);
// 3) Sprachsteuerung: Fenster „Ich höre zu …“ und Liste
await p.evaluate(() => { class FakeErk { start() {} abort() {} stop() {} } window.SpeechRecognition = FakeErk; window.webkitSpeechRecognition = FakeErk; lsSetzen('kc_club_sprachsteuerung', '1'); lsSetzen('kc_club_sprachsteuerung_ok', '1'); sbKnopfZeigen(); });
await p.waitForTimeout(400); await p.click('#sbKnopf'); await p.waitForTimeout(900);
await p.screenshot({ path: B + 'neu8-sb.png' });
await p.evaluate(() => { try { sbStopp(); } catch {} sbListe(); }); await p.waitForTimeout(900);
await p.screenshot({ path: B + 'neu8-sbliste.png' }); await zu(p);
// 4) 👆 Was kann ich antippen?
await p.evaluate(() => { zeige('start'); klickZeigen(true); }); await p.waitForTimeout(1200);
await p.screenshot({ path: B + 'neu8-klick.png' });
await p.evaluate(() => klickZeigen(false));
// 5) Spiele
await p.evaluate(() => zeige('spiele')); await p.waitForTimeout(1200); await zu(p);
await p.screenshot({ path: B + 'neu8-spiele.png' });
console.log(JSON.stringify(p.fehler)); await b.close();
