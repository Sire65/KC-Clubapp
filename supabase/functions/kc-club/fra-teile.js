// KICC-F-107 (Wunsch Hansi 18.10.2026 „nur geänderte Daten sichern“): Teilgrenzen der Frankfurt-Sicherung.
// Große Tabellen werden in Zeilenbereiche (ctid-Codes = Block × 65536 + Zeile) zerlegt. Bisher jeden Tag neu nach Größe –
// schon eine gelöschte alte Zeile verschob alle Grenzen, kein Teil blieb gleich. Jetzt: Grenzen vom letzten geprüften Lauf
// übernehmen; nur der letzte (offene) Bereich wird nach Größe neu geteilt. Die Bereiche decken immer lückenlos [0, ∞) ab.
// Passt ein übernommener Bereich nicht mehr (größer als 1,5 × Teilgröße, z. B. nach Umschichten der Tabelle), wird die
// ganze Tabelle neu geteilt wie bisher. Rein (ohne Datenbank) – getestet in tests/fra-teile.test.mjs.

// liste: [{ code, l }] nach code aufsteigend (Zeilenadresse, Textgröße); Ergebnis: [{ teil, block_von, block_bis }]
export function fraTeileNeu(liste, teilBytes, von = 0, teil = 0) {
  const aus = [];
  let summe = 0;
  for (const z of liste) {
    if (z.code < von) continue;
    if (summe > 0 && summe + z.l > teilBytes) { aus.push({ teil: teil++, block_von: von, block_bis: z.code }); von = z.code; summe = 0; }
    summe += z.l;
  }
  aus.push({ teil, block_von: von, block_bis: null });
  return aus;
}

// alteGrenzen: block_von der Teile des Vortags nach teil (erste = 0). Leer/ungültig → neu teilen.
export function fraTeileStabil(liste, alteGrenzen, teilBytes) {
  const g = (alteGrenzen || []).map(Number);
  const gueltig = g.length >= 2 && g[0] === 0 && g.every((x, i) => Number.isFinite(x) && (i === 0 || x > g[i - 1]));
  if (!gueltig) return { teile: fraTeileNeu(liste, teilBytes), uebernommen: 0 };
  const summen = new Array(g.length - 1).fill(0);
  let k = 0;
  for (const z of liste) {
    if (z.code >= g[g.length - 1]) break;
    while (z.code >= g[k + 1]) k++;
    summen[k] += z.l;
  }
  if (summen.some((s) => s > teilBytes * 1.5)) return { teile: fraTeileNeu(liste, teilBytes), uebernommen: 0 };
  const teile = summen.map((_, i) => ({ teil: i, block_von: g[i], block_bis: g[i + 1] }));
  return { teile: teile.concat(fraTeileNeu(liste, teilBytes, g[g.length - 1], teile.length)), uebernommen: teile.length };
}
