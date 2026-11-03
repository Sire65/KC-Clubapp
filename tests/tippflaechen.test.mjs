// 2.827.0 KC-CLUB-TIPPFLAECHEN + KC-CLUB-SCHRIFT-MIN (Wunsch #44 Etappe 2): größere Tippflächen, mindestens 13 Punkt Schrift – als ein Block am Ende.
// Aufruf: node tests/tippflaechen.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync("index.html", "utf8");
const i = html.indexOf("/* 2.827.0 KC-CLUB-TIPPFLAECHEN"), blk = html.slice(i, html.indexOf("</style>", i));
assert.ok(i > 0 && i > html.indexOf(".herz {") && i > html.indexOf(".ipunkt {"), "Block steht nach den alten Regeln (überschreibt sie)");
assert.ok(/\.herz \{ padding: 11px 6px; margin: -11px -4px; \}/.test(blk), "Herz: unsichtbar größer, Platz im Kopf gleich");
assert.ok(/\.ipunkt \{ height: 44px; margin: -13px 0; \}/.test(blk), "Info-Punkte 44 hoch, Abstand gleich");
assert.ok(/\.il-zu \{ width: 34px; height: 34px;/.test(blk) && /#v-chat \.kopf2 > \.rund \{ width: 40px; height: 40px;/.test(blk), "✕ und Chat-Knöpfe größer");
assert.ok(/\.zk-titel, \.wischhinweis, \.st-titel, \.eu-gruppe, \.pwStand, \.fa-album small \{ font-size: \.8125rem; \}/.test(blk), "13 Punkt");
assert.ok(!/\.mini|\.kl-k|\.zk-naechst|#v-archiv/.test(blk), "Start-Kacheln, Nachrichten-Reiter, Tippen-Zeile, Ordnerrücken bleiben (passten größer nicht)");
console.log("tippflaechen: alle Prüfungen bestanden");
// Archiv: Wort statt Jahreszahl auf dem Ordner-Schild passt (vorher ragte „Dienstplan“ über den Rücken)
{ const app = fs.readFileSync("app.js", "utf8");
  assert.ok(app.includes('<span class="jahr wort">Dienstplan</span>') && app.includes('<span class="jahr wort">Sprüche</span>'), "Wort-Schilder markiert");
  assert.ok(/\.ordner \.jahr\.wort \{ font-size: \.8rem; letter-spacing: -\.02em; white-space: nowrap; \}/.test(html), "kleiner, ohne Umbruch im Wort");
  console.log("archiv-schild: ok"); }
