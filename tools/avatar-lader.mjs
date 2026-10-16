// KC-CLUB-AVATAR-LADER (2.414.0): lädt die EINE Avatar-Zeichnung aus app.js (keine Kopie) für Tests und den Datei-Generator.
// Genommen wird der Block von „const AV_HAUT“ bis vor „// KC-CLUB-FREIGABE (2.23.86“ und in einer abgeschotteten VM ausgeführt.
import fs from "node:fs";
import vm from "node:vm";
// jetzt (optional): feste Zeit für „Kochjacke des Tages“ (AV_JACKE_AUTO wechselt je Wochentag) – sonst wäre ein Vergleich nur an einem Wochentag gleich
export function avatarLaden(quelle, { jetzt } = {}) {
  const app = quelle ?? fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const a = app.indexOf("const AV_HAUT"), e = app.indexOf("// KC-CLUB-FREIGABE (2.23.86");
  if (a < 0 || e < a) throw new Error("Avatar-Block in app.js nicht gefunden");
  const speicher = {};
  const ctx = vm.createContext({ localStorage: { getItem: (k) => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = String(v); } }, INIT: null, ICH: null, console, Intl, Date: jetzt == null ? Date : festeZeit(jetzt), Math, JSON, BigInt });
  vm.runInContext(app.slice(a, e) + "\n;globalThis.__av = { avatarSvg, avTeile, avGueltig: typeof avGueltig === 'function' ? avGueltig : null, uid0: () => { AV_UID = 0; } };", ctx);
  const av = ctx.__av;
  const lese = (name) => vm.runInContext(`typeof ${name} === "undefined" ? undefined : ${name}`, ctx);
  // gleiches Bild bei jedem Aufruf: Muster-Kennungen (AV_UID) vor jedem Zeichnen zurücksetzen
  return { svg: (code, gr = 64, ini = "") => { av.uid0(); return av.avatarSvg(code, gr, ini); }, teile: av.avTeile, gueltig: av.avGueltig, lese };
}
function festeZeit(jetzt) {
  const fest = new Date(jetzt).getTime();
  return class extends Date { constructor(...a) { if (a.length) super(...a); else super(fest); } static now() { return fest; } };
}
