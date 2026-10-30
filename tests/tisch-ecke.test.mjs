// 2.772.0 KC-CLUB-RUNDER-TISCH-ECKE (Wunsch #47, Hansi 30.10.2026 „Kassenprogramm im Seminar vorstellen, zwischen Kamera und Programm umschalten –
// ja, mich in der Ecke, aber umschaltbar, denn auf dem kleinen Handy-Bildschirm könnte das stören“)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const tl = lies("teile/tischlive.js"), html = lies("index.html"), app = lies("app.js");

// Sender: Kamera nur als Ecke, solange der Bildschirm gezeigt wird; eigener Kanal, sparsam
let TL = { schirm: null, cam: null };
const eckSpur = new Function("TL", tl.slice(tl.indexOf("const tlEckSpur = "), tl.indexOf("\n", tl.indexOf("const tlEckSpur = "))) + "\nreturn tlEckSpur;");
const kam = { getVideoTracks: () => ["KAMERA"] };
assert.equal(eckSpur(TL)(), null, "nichts an");
assert.equal(eckSpur({ schirm: {}, cam: null })(), null, "nur Bildschirm: keine Ecke");
assert.equal(eckSpur({ schirm: null, cam: kam })(), null, "nur Kamera: Kamera ist das große Bild, keine Ecke");
assert.equal(eckSpur({ schirm: {}, cam: kam })(), "KAMERA", "Bildschirm + Kamera: Kamera in die Ecke");
assert.match(tl, /v\.eck = pc\.addTransceiver\(tlEckSpur\(\) \|\| "video", \{ direction: "sendonly" \}\);/, "dritter Kanal beim Verbindungsaufbau");
assert.match(tl, /v\.eck\?\.sender\.replaceTrack\(eck\)/, "wird beim Ein-/Ausschalten mitgetauscht");
assert.match(tl, /e\.encodings\[0\]\.maxBitrate = Math\.min\(180, tlKbit\(raus\)\) \* 1000; e\.encodings\[0\]\.scaleResolutionDownBy = 2;/, "Ecke sparsam");

// Empfänger: zweiter Video-Kanal = Ecke (eigener Strom), nur bei Kamera an laut Leitung
assert.match(tl, /pc\.getTransceivers\(\)\.filter\(\(x\) => x\.receiver\.track\?\.kind === "video"\)\.indexOf\(e\.transceiver\) === 1\) \{\s+v\.eckStrom = new MediaStream\(\[e\.track\]\);/);
assert.match(tl, /const eckVon = \(v\) => \(v\.eckStrom && TL\.peers\.get\(v\.an\)\?\.cam &&/, "nur solange er die Kamera an hat");
assert.match(tl, /return \{ strom: v\.strom, pid: v\.an, eck: eckVon\(v\) \};/); assert.match(tl, /return \{ strom: TL\.schirm, pid: TL\.ich, selbst: true, eck: TL\.cam \|\| null \};/);

// Umschalter je Gerät: Standard an, auf schmalen Handys aus; Knopf nur, wenn es eine Kamera gibt
let speicher = {}, breite = 393;
const eckAn = new Function("lsLesen", "window", tl.slice(tl.indexOf('const TL_ECK = '), tl.indexOf("function tlEckUmschalten")) + "\nreturn tlEckAn;")((k) => speicher[k] ?? null, { get innerWidth() { return breite; } });
assert.equal(eckAn(), false, "Handy: anfangs aus"); breite = 1024; assert.equal(eckAn(), true, "PC: anfangs an");
speicher.kc_club_tl_ecke = "aus"; assert.equal(eckAn(), false, "gemerkt: aus"); breite = 393; speicher.kc_club_tl_ecke = "an"; assert.equal(eckAn(), true, "gemerkt: an");
assert.match(tl, /g\.eck \? `<button class="knopf klein tl-eck-knopf/); assert.match(tl, /eck\.hidden = !\(g\.eck && an\);/);
assert.match(tl, /"v:" \+ video\.pid \+ ":" \+ video\.strom\.id \+ ":" \+ \(video\.eck\?\.id \|\| ""\) \+ ":" \+ tlEckAn\(\)/, "Bühne zeichnet neu, wenn Ecke kommt/geht/umgeschaltet wird");
assert.match(html, /\.tl-eck \{ position: absolute; right: 8px; bottom: 8px;/); assert.match(app, /id: "tisch_ecke", thema: "club", sym: "🙂"/, "Hilfe");
console.log("OK – KC-CLUB-RUNDER-TISCH-ECKE (2.772.0)");
