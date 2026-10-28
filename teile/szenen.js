// KC-CLUB-TEILE Stufe 3b (Prüfbericht C, Wunsch Hansi 28.10.2026 „lass die Szenen ruhig etwas später starten“): Kopf-Szenen –
// Jahreszeiten-Bühne (Herbst, Advent, Winter, Frühling, Sommer) und Themen-Szenen (Sim-Jü mit Karussell, Viehmarkt und Stier, Oktoberfest, Karibik,
// Karneval, Halloween, Unterwasser, Weltraum, Bauernhof, Kegeln, Wildwest, Wüste, Seifenblasen, Baustelle), Winter- und Herbst-Extras, Twinkey mit Besen.
// Wird kurz nach dem Start geladen (szenenSpaeter in app.js) – die Startseite ist sofort da, die Szene erscheint einen Augenblick später.
// Im Hauptprogramm bleiben: jahreszeitKopf (Deko, Eiszapfen), Zustand JZB, Liste JZB_ARTEN. Nach jeder Änderung hier: node tools/teile-pruefsumme.mjs
const JZB_BLUEHT = 150; // 2.250.0 (Fund Hansi „Sonnenblume nur kurz“): Blumen/Sonnenblume blühen 2½ Min., bevor der Wind kommt
const JZB_SP = 3, JZB_RAND = 22; // 2.259.0: 22 statt 16 – nichts in die runden Ecken (Radius 26) // Bodenspalten in px; nichts in den runden Ecken ablegen
const JZB_LAUB = ["#e0802a", "#c8432b", "#e8b23a", "#a85a2a", "#d96a1f", "#b33a2a", "#cf9a2b"];
const JZB_GRUEN = ["#5d9b35", "#6fae3e", "#4f8a2b", "#7cbd4a"];
const jzbZ = (a, b) => a + Math.random() * (b - a);
const jzbW = (l) => l[Math.floor(Math.random() * l.length)];
const jzbEase = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
const jzbHopp = (x) => x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2); // leicht überschwingend
const jzbBodenH = (x) => JZB.boden[Math.max(0, Math.min(JZB.boden.length - 1, Math.round(x / JZB_SP)))] || 0;
const jzbImFeld = (x) => x > JZB_RAND && x < JZB.w - JZB_RAND;
function jzbLaufLesen() { try { return +localStorage.getItem("kc_club_jzLauf") || 0; } catch { return 0; } }
function jzbAufhaeufen(x, menge, breite) {
  const i0 = Math.round(x / JZB_SP);
  for (let d = -breite; d <= breite; d++) { const i = i0 + d; if (i >= 0 && i < JZB.boden.length) JZB.boden[i] += menge * (1 - Math.abs(d) / (breite + 1)); }
}
function jzbStart(h, art) {
  const cv = document.createElement("canvas"), ctx = cv.getContext && cv.getContext("2d");
  if (!ctx || typeof ResizeObserver === "undefined") return false;
  const s = document.createElement("div"); s.className = `jz-schicht jz-buehne jz-${art}`; s.setAttribute("aria-hidden", "true");
  s.appendChild(cv); h.prepend(s);
  // 2.259.0 (Fund Hansi „Blätter bleiben nicht liegen“): unter dem Infofeld waren nur ~8–18 px Boden – liegendes Laub lag halb unter der Kante.
  // Jetzt eigener Bodenstreifen (CSS .jz-boden) und Sprechblase für Twinkey
  h.classList.add("jz-boden");
  const sb = document.createElement("div"); sb.className = "jz-sprech"; sb.setAttribute("aria-hidden", "true"); h.appendChild(sb);
  const saison = art === "advent" ? "winter" : art;
  Object.assign(JZB, { s, cv, ctx, art, saison, w: 0, h: 0, dpr: 0, k: 1, T: 0, pt: 0, letzt: 0, imBild: true, pruef: 0, spawn: 0,
    flug: [], liegt: [], fx: [], boden: [], wind: null, mann: null, halme: [], blumen: [], gaeste: [], welk: 0, phase: "anfang",
    blase: sb, besuch: null, gegossen: false, ext: {}, extraPruef: 0, eier: [], igel: null, igelUhr: undefined, schirm: null, schirmUhr: undefined, tropfen: [], pfuetzen: null, regenSpawn: 0, blaeser: null, eicheln: null, hoernchen: null, hoernchenUhr: undefined, nussName: null, nussErster: false, raupe: null, raupeUhr: undefined, ski: null, skiUhr: null, rillen: null, fest: null }); // 2.249.0 KC-CLUB-JAHRESZEIT-EXTRAS
  if (!h.dataset.jzKlick) { h.dataset.jzKlick = "1"; h.addEventListener("click", jzbEiAntippen); } // Ostereier antippen
  // Vorschau im Winter: gleich der Schneemann-Lauf, damit man ihn nicht erst nach zwei Windstößen sieht
  JZB.lauf = JZB.vorschau ? (JZB.extra === "twinkey" ? 1 : saison === "winter" ? 2 : 0) : jzbLaufLesen(); // Vorschau „🧹 Twinkey“: gleich sein Lauf
  JZB.ro = new ResizeObserver(jzbGroesse); JZB.ro.observe(s);
  if (typeof IntersectionObserver !== "undefined") { JZB.io = new IntersectionObserver((e) => { JZB.imBild = e[e.length - 1].isIntersecting; jzbWeiter(); }); JZB.io.observe(s); }
  if (!JZB.horcht) { JZB.horcht = true; document.addEventListener("visibilitychange", jzbWeiter); }
  jzbGroesse(); jzbWeiter();
  return true;
}
function jzbStop() { jzbSbAufraeumen(); /* 2.633.0: Scheibe und Fischauge weg */ if (JZB.raf) cancelAnimationFrame(JZB.raf); clearTimeout(JZB.warteUhr); JZB.raf = 0; JZB.ro?.disconnect(); JZB.io?.disconnect(); JZB.ro = JZB.io = JZB.cv = null; }
function jzbGroesse() {
  const { s, cv } = JZB; if (!cv) return;
  const w = s.clientWidth, h = s.clientHeight, dpr = Math.min(1.5, window.devicePixelRatio || 1); // 2.334.0: 1,5 statt 2 – knapp halb so viele Bildpunkte
  if (!w || !h || (w === JZB.w && h === JZB.h && dpr === JZB.dpr)) return;
  const breiter = JZB.w && Math.abs(w - JZB.w) > 8;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); JZB.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const alt = JZB.boden; JZB.boden = Array.from({ length: Math.ceil(w / JZB_SP) + 1 }, (_, i) => alt[i] || 0);
  Object.assign(JZB, { w, h, dpr, k: h >= 150 ? 1 : Math.max(.55, h / 150) });
  if (breiter && JZB.halme.length) jzbPflanzen(); // Handy gedreht: Beet neu verteilen (gleich weit gewachsen)
  if (breiter && JZB.eier.length) jzbEierVerstecken();
  if (!JZB.raf) jzbMalen();
}
function jzbWeiter() {
  if (JZB.raf || !JZB.cv) return;
  if (document.hidden || !JZB.imBild) { JZB.letzt = 0; return; }
  JZB.raf = requestAnimationFrame(jzbBild);
}
// 2.334.0 KC-CLUB-AKKU (Fund Hansi „Akku ruck, zuck leer – Handy meldet hohen Akkuverbrauch“): Das Jahreszeiten-Bild im Kopf wurde
// 60× je Sekunde in voller Auflösung neu gemalt – auch wenn niemand hinsah. Jetzt höchstens 30 Bilder je Sekunde, nach 45 s ohne
// Bedienung nur noch 12 (sieht gleich aus, die Bewegung rechnet mit der echten Zeit), Auflösung höchstens 1,5-fach.
const JZB_FPS = 30, JZB_FPS_RUHE = 12, JZB_RUHE_MS = 45000, JZB_STEHEN_MS = 180000; // 2.361.0: nach 3 Min. ohne Bedienung steht das Bild ganz still
["pointerdown", "keydown", "wheel"].forEach((t) => addEventListener(t, () => { jzbBedient = Date.now(); }, { passive: true, capture: true }));
try { navigator.getBattery?.().then((b) => { const f = () => { jzbAkkuKnapp = !b.charging && b.level < .3; }; f(); b.addEventListener("levelchange", f); b.addEventListener("chargingchange", f); }).catch(() => {}); } catch {}
// 2.337.0 KC-CLUB-AKKU-2 (Gesamtprüfung: Messung Startseite in Ruhe ≈ 8 % Rechenzeit, davon die Hälfte dauernd laufende Rahmen-„Ameisen“
// und atmende Lämpchen): nach derselben Ruhezeit (oder bei knappem Akku) halten diese Endlos-Animationen an – sichtbar bleiben sie,
// nur stehend. Beim ersten Antippen laufen sie sofort weiter.
setInterval(() => { try { document.documentElement.classList.toggle("kc-ruhe", jzbAkkuKnapp || Date.now() - jzbBedient > JZB_RUHE_MS); } catch {} }, 5000);
addEventListener("pointerdown", () => document.documentElement.classList.remove("kc-ruhe"), { passive: true, capture: true });
// 2.358.0 KC-CLUB-AKKU-3: eine Vorschau läuft nur noch 2 Minuten mit voller Bildrate (vorher dauerhaft), danach wie sonst sparsam;
// nach 15 Minuten endet sie von selbst (vorher blieb sie bis „beenden“ oder Neustart – auch der Grund für Hansis 30 % Akku in kurzer Zeit)
// 2.481.0 KC-CLUB-AKKU-TUEV (TÜV 18.10.: Startseite 59–79 % Rechenzeit bei Bedienung): in Bedienung 20 statt 30 Bilder/s (Bewegung rechnet mit der
// echten Zeit – sieht gleich aus), Ruhe schon nach 20 s; schwache Handys (≤ 4 Kerne oder ≤ 3 GB) und „weniger Bewegung“ immer sparsam. Vorschau bleibt flüssig.
const JZB_FPS_BEDIENT = 20, JZB_RUHE_BEDIENT_MS = 20000;
const jzbSchwach = (() => { try { return (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3 || matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })();
const jzbFps = () => ((JZB.vorschau && Date.now() - (JZB.vorschauSeit || 0) < 120000) ? JZB_FPS : !jzbSchwach && !jzbAkkuKnapp && Date.now() - jzbBedient < JZB_RUHE_BEDIENT_MS ? JZB_FPS_BEDIENT : JZB_FPS_RUHE);
// 2.361.0 KC-CLUB-AKKU-6 (Hansi „unsere App saugt das Handy leer“): Auch 6–12 Bilder/s halten Grafikchip und Bildschirm-Elektronik dauernd wach.
// Nach 3 Minuten ohne Bedienung bleibt das Kopfbild jetzt stehen (wie ein Foto); das erste Antippen/Wischen lässt es sofort weiterlaufen.
const jzbStehen = () => !(JZB.vorschau && Date.now() - (JZB.vorschauSeit || 0) < 120000) && !(JZB.saison === "kirmes" && jzbSimJueFeuerwerk()) && Date.now() - jzbBedient > JZB_STEHEN_MS; // 2.617.0: Sim-Jü-Feuerwerk läuft durch
["pointerdown", "keydown", "wheel"].forEach((t) => addEventListener(t, () => { if (JZB.steht) { JZB.steht = false; JZB.letzt = 0; jzbWeiter(); } }, { passive: true }));
setInterval(() => { try { if ((JZB.vorschau || JZB.extra) && JZB.vorschauSeit && Date.now() - JZB.vorschauSeit > 15 * 60000) { JZB.vorschauSeit = 0; // still beenden – ohne auf die Startseite zu springen
  JZB.vorschau = ""; JZB.extra = ""; JZB.eisName = null; JZB.eisStueck = null; JZB.nussName = null; if (aktuelleAnsicht === "start") jahreszeitKopf(); jzVorschauLeiste(); } } catch {} }, 30000);
function jzbBild(ts) {
  JZB.raf = 0;
  if (!JZB.cv?.isConnected) return jzbStop();
  const dt = JZB.letzt ? Math.min(.09, (ts - JZB.letzt) / 1000) : .016; JZB.letzt = ts;
  if ((JZB.pruef += dt) > 1) { JZB.pruef = 0; if (!jzbDarf()) return jahreszeitKopf(); }
  if (JZB.w) { if ((JZB.extraPruef -= dt) <= 0) { JZB.extraPruef = 30; jzbExtrasBestimmen(); } JZB.T += dt; JZB.pt += dt; jzbSchritt(dt); jzbMalen(); }
  if (jzbStehen()) { JZB.steht = true; return; } // 2.361.0: steht still bis zur nächsten Bedienung
  JZB.raf = -1; clearTimeout(JZB.warteUhr); JZB.warteUhr = setTimeout(() => { JZB.raf = 0; jzbWeiter(); }, Math.max(0, 1000 / jzbFps() - 10)); // schlafen – das nächste Bild kommt mit dem nächsten Bildwechsel danach
}
function jzbPhase(p) { JZB.phase = p; JZB.pt = 0; }
function jzbLaufEnde() {
  const J = JZB; J.lauf++; if (!J.vorschau) try { localStorage.setItem("kc_club_jzLauf", String(J.lauf)); } catch {}
  J.boden.fill(0); J.liegt = []; J.mann = null; J.iglu = null; J.sonne = null; J.wind = null; J.besuch = null; J.gegossen = false; J.welk = 0; J.halme = []; J.blumen = []; J.gaeste = J.gaeste.filter((g) => g.typ === "falter" || g.typ === "osterhase"); // 2.337.0: der Osterhase legt seine Eier zu Ende
  jzbPhase("anfang");
}
// Windstoß: abwechselnd von links (dir 1) und von rechts (dir -1); die Front zieht über den Kopf und nimmt mit, was liegt
function jzbWindStart(dauer = 4.2) {
  const J = JZB; J.wind = { dir: (J.lauf >> 1) % 2 ? -1 : 1, t: 0, dauer, st: 0, front: 0, striche: [], naechster: 0 };
  for (const f of J.flug) J.fx.push({ ...f, vx: 0, vy: f.vy || 20, a: 1 }); J.flug = [];
  jzbPhase("wind");
}
function jzbWindSchritt(dt) {
  const J = JZB, W = J.wind; if (!W) return;
  W.t += dt; W.st = Math.sin(Math.PI * Math.min(1, W.t / W.dauer));
  if (W.t < W.dauer * .85 && (W.naechster -= dt) <= 0) {
    W.naechster = jzbZ(.03, .09); // 2.250.0 (Fund Hansi „Windstoß nicht gesehen“): mehr, längere und kräftigere Striche
    W.striche.push({ x: W.dir > 0 ? -160 : J.w + 160, y: jzbZ(J.h * .08, J.h - 6), l: jzbZ(60, 160), v: jzbZ(420, 640), a: jzbZ(.4, .75), ph: jzbZ(0, 6) });
  }
  for (const s of W.striche) s.x += W.dir * s.v * dt;
  W.striche = W.striche.filter((s) => s.x > -220 && s.x < J.w + 220);
  const weg = Math.min(1.2, W.t / (W.dauer * .7)) * (J.w + 80) - 40; W.front = W.dir > 0 ? weg : J.w - weg;
}
const jzbHinterFront = (x) => { const W = JZB.wind; return !!W && (W.dir > 0 ? x < W.front : x > W.front); };
const jzbWindVorbei = () => { const W = JZB.wind; return !W || (W.t >= W.dauer && !W.striche.length); };

function jzbNeuesTeil(typ) {
  const J = JZB;
  if (typ === "blatt") return { typ, x: jzbZ(0, J.w), y: -12, vy: jzbZ(16, 28), s: jzbZ(6, 9.5) * (.75 + .25 * J.k), rot: jzbZ(0, 6.3), vr: jzbZ(-1.6, 1.6), ph: jzbZ(0, 6.3), fq: jzbZ(.9, 1.7), amp: jzbZ(14, 28), farbe: jzbW(themaWert("laub") || JZB_LAUB), form: Math.random() < .45 ? 1 : 0 }; // 2.323.0: Indian Summer leuchtet
  if (typ === "flocke") { const r = jzbZ(1, 2.6); return { typ, x: jzbZ(-10, J.w + 10), y: -4, r, vy: 12 + r * 9, ph: jzbZ(0, 6.3), fq: jzbZ(.8, 1.8), amp: jzbZ(5, 12) }; }
  return { typ: "bluete", x: jzbZ(0, J.w), y: -6, s: jzbZ(2.2, 3.4), vy: jzbZ(13, 20), rot: jzbZ(0, 6.3), vr: jzbZ(-2, 2), ph: jzbZ(0, 6.3), fq: jzbZ(.8, 1.4), amp: jzbZ(10, 20), farbe: jzbW(["#f9c6d6", "#ffe3ec", "#ffffff"]), a: 1 };
}
// Fallende Teile: Blätter bleiben liegen (stapeln sich), Flocken werden zur Schneedecke, Blüten vergehen im Gras
function jzbFallen(dt) {
  const J = JZB;
  for (const b of J.flug) {
    b.ph += dt * b.fq; b.x += Math.sin(b.ph) * b.amp * dt; if (b.vr) b.rot += b.vr * dt;
    b.y += b.vy * dt * (b.typ === "blatt" ? .65 + .35 * Math.abs(Math.cos(b.ph)) : 1);
    const boden = J.h - jzbBodenH(b.x);
    if (b.typ === "blatt" && b.y + b.s * .3 >= boden) {
      if (jzbImFeld(b.x)) { J.liegt.push({ x: b.x, yb: J.h - boden + b.s * .5, rot: jzbZ(-.5, .5) + (Math.random() < .5 ? 0 : Math.PI), s: b.s, farbe: b.farbe, form: b.form }); jzbAufhaeufen(b.x, b.s * .16, 3); }
      b.weg = true;
    } else if (b.typ === "flocke" && b.y + b.r >= boden) {
      if (jzbImFeld(b.x)) jzbAufhaeufen(b.x, b.r * 1.25, 2);
      b.weg = true;
    } else if (b.typ === "bluete" && b.y > J.h - 8 * J.k) { b.a -= dt * 1.2; if (b.a <= 0) b.weg = true; }
    if (b.y > J.h + 12) b.weg = true;
  }
  J.flug = J.flug.filter((b) => !b.weg);
}
// Fortgewehtes, Funken, abfallende Blütenblätter
function jzbFxSchritt(dt) {
  const J = JZB, W = J.wind, zug = W ? W.dir * 300 * W.st : 0;
  for (const p of J.fx) {
    if (p.liegt && !W) { p.y = J.h - 2; p.a = (p.a ?? 1) - dt * p.blass; if (p.a <= 0) p.weg = true; continue; }
    if (p.typ === "funke") { p.a -= dt * 1.1; p.x += p.vx * dt; p.y += p.vy * dt; if (p.a <= 0) p.weg = true; continue; }
    if (p.typ === "scherbe" || p.typ === "nuss" || p.typ === "pilz") { // 2.356.0: Eis-Scherben und Nüsse fliegen, hüpfen am Boden und verschwinden · 2.389.0: Pilze
      p.vy += (p.leicht ? 190 : 300) * dt; if (p.leicht) p.vx *= 1 - .35 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > J.h - 2) { p.y = J.h - 2; p.vy = -Math.abs(p.vy) * .3; p.vx *= .6; p.vr *= .6; p.a -= dt * 1.4; } else p.a -= dt * .2;
      if (p.a <= 0 || p.x < -40 || p.x > J.w + 40) p.weg = true; continue;
    }
    if (p.typ === "schmelz") { // rinnt am Schneemann herunter, wird schneller, wackelt leicht – unten läuft er in die Pfütze
      p.v = Math.min(70, p.v + 40 * dt); p.y += p.v * dt; p.spur = Math.min(10 * J.k, p.spur + p.v * dt * .5); p.x = p.x0 + Math.sin(p.y * .25 + p.ph) * .6 * J.k;
      if (p.y >= J.h - 2) { p.y = J.h - 2; p.a -= dt * 2.5; p.spur = Math.max(0, p.spur - 30 * dt); if (p.a <= 0) p.weg = true; }
      continue;
    }
    if (p.typ === "schal") { // liegt, bis die Windfront kommt – dann wirbelt er hoch, tanzt mit den Flocken und fliegt davon
      if (!W || (!p.los && !jzbHinterFront(p.x))) { if (!p.los) p.y = J.h - 3; else p.x += (p.vx || 60) * dt; if (p.x < -60 || p.x > J.w + 60) p.weg = true; continue; }
      if (!p.los) { p.los = true; p.vy = -jzbZ(150, 200); p.vx = W.dir * 40; // hochgewirbelt – mit einer Handvoll Schnee
        for (let i = 0; i < 14; i++) J.fx.push({ typ: "flocke", x: p.x + jzbZ(-14, 14), y: J.h - 4, r: jzbZ(.8, 2), vx: W.dir * jzbZ(40, 150), vy: -jzbZ(60, 170), a: 1 }); }
      p.t += dt; p.vx += W.dir * 90 * W.st * dt; p.vx *= 1 - .2 * dt;
      p.vx = W.dir * Math.min(110, Math.max(50, Math.abs(p.vx))); // nie stehen bleiben, nie zu schnell – er soll tanzen
      p.vy += (60 - 95 * W.st + Math.sin(p.t * 3.4) * 290) * dt; p.vy *= 1 - .35 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < 10 * J.k) { p.y = 10 * J.k; p.vy = Math.abs(p.vy) * .4; } else if (p.y > J.h - 3) { p.y = J.h - 3; p.vy = -Math.abs(p.vy) * .6 - 50; }
      p.rot += W.dir * (1.2 + 2.5 * W.st) * dt;
      if (p.x < -60 || p.x > J.w + 60) p.weg = true; continue;
    }
    p.vx = (p.vx || 0) + zug * dt; p.vx *= 1 - .35 * dt;
    p.vy = (p.vy || 0) + (W ? 70 - 90 * W.st : 40) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; if (p.vr) p.rot += p.vr * dt; if (p.ph !== undefined) p.ph += dt * (p.fq || 1) * 3;
    if (p.blass) p.a = (p.a ?? 1) - dt * p.blass;
    const boden = J.h - 2;
    if (p.y > boden && !W) { p.y = boden; p.vx = 0; p.vy = 0; p.liegt = true; p.blass = p.blass || .25; }
    if (p.x < -50 || p.x > J.w + 50 || p.y > J.h + 30 || (p.a ?? 1) <= 0) p.weg = true;
  }
  J.fx = J.fx.filter((p) => !p.weg);
}
function jzbSchritt(dt) {
  const J = JZB, S = J.saison;
  if (J.phase === "anfang" && JZB_FESTE.includes(S)) { jzbFestStart(); jzbPhase("fest"); } // 2.331.0 KC-CLUB-THEMEN-BUEHNE
  else if (J.phase === "anfang") { if (S === "fruehling" || S === "sommer") jzbPflanzen(); jzbPhase(S === "fruehling" || S === "sommer" ? "wachsen" : "fallen"); }
  jzbWindSchritt(dt);
  if (S === "herbst") jzbHerbst(dt);
  else if (S === "winter") jzbWinter(dt);
  else if (JZB_FESTE.includes(S)) jzbFest(dt);
  else jzbBeet(dt);
  jzbFallen(dt); jzbFxSchritt(dt); jzbGaeste(dt); jzbExtrasSchritt(dt); jzbBesuchSchritt(dt);
}
// 🍂 Herbst
function jzbHerbst(dt) {
  const J = JZB;
  if (J.phase === "fallen") {
    if ((J.spawn -= dt) <= 0 && J.flug.length < 12) { J.spawn = jzbZ(.45, 1.1); J.flug.push(jzbNeuesTeil("blatt")); }
    if (J.liegt.length >= Math.max(22, Math.round(J.w / 10))) { // 2.259.0: im Wechsel Wind / Twinkey mit Besen · 2.328.0: + Mann mit Laubbläser
      const w = J.extra === "blaeser" ? 2 : J.lauf % 3; if (w === 1) jzbBesuchStart("fegen"); else if (w === 2) jzbBlaeserStart(); else jzbWindStart(); }
  } else if (J.phase === "blasen") {
    if (!J.blaeser && J.liegt.length) jzbWindStart(); // falls doch noch etwas liegt: der Wind holt den Rest
    else if (!J.blaeser && !J.liegt.length && !J.fx.length) { if ((J.spawn -= dt) < -1.5) jzbLaufEnde(); }
  } else if (J.phase === "besuch") {
    if (!J.besuch && !J.liegt.length && !J.fx.length) { if ((J.spawn -= dt) < -1.5) jzbLaufEnde(); }
  } else if (J.phase === "wind") {
    const W = J.wind;
    for (const b of J.liegt) if (jzbHinterFront(b.x + W.dir * jzbZ(0, 30))) {
      J.fx.push({ typ: "blatt", x: b.x, y: J.h - b.yb, s: b.s, farbe: b.farbe, form: b.form, rot: b.rot, vr: jzbZ(-10, 10), vx: W.dir * jzbZ(150, 280), vy: -jzbZ(70, 190), ph: jzbZ(0, 6.3), fq: jzbZ(1, 2) });
      b.weg = true;
    }
    J.liegt = J.liegt.filter((b) => !b.weg);
    J.boden.forEach((v, i) => { if (v && jzbHinterFront(i * JZB_SP)) J.boden[i] = 0; });
    if (jzbWindVorbei() && !J.liegt.length && !J.fx.length) { if ((J.spawn -= dt) < -1.5) jzbLaufEnde(); }
  }
}
// ❄️ Winter: Schneedecke, Windstoß – oder jeder 3. Lauf ein Schneemann
function jzbWinter(dt) {
  const J = JZB, B = J.boden, n = B.length;
  const schneit = J.phase === "fallen" || J.phase === "bauen" || (J.phase === "stehen" && J.pt > 6);
  if (schneit && (J.spawn -= dt) <= 0 && J.flug.length < (J.phase === "fallen" ? 50 : 22)) { J.spawn = J.phase === "fallen" ? jzbZ(.07, .18) : jzbZ(.2, .45); J.flug.push(jzbNeuesTeil("flocke")); }
  if ((J.glatt = (J.glatt || 0) + dt) > .1) { // Schnee rutscht ein wenig – weiche Verwehungen statt Zacken
    J.glatt = 0;
    for (let i = 1; i < n - 1; i++) { const d = B[i] - (B[i - 1] + B[i + 1]) / 2; if (d > 1.2) { B[i] -= d * .3; B[i - 1] += d * .15; B[i + 1] += d * .15; } }
  }
  if (J.sonne) J.sonne.t += dt;
  const innen = B.slice(Math.ceil(JZB_RAND / JZB_SP), Math.floor((J.w - JZB_RAND) / JZB_SP)), schnitt = innen.reduce((a, b) => a + b, 0) / Math.max(1, innen.length);
  if (J.phase === "fallen" && schnitt >= 9 * J.k) {
    if (J.lauf % 3 === 2) (Math.floor(J.lauf / 3) % 2 ? jzbIgluStart : jzbSchneemannStart)(); else if (J.lauf % 2) jzbBesuchStart("schippen"); else jzbWindStart(); // 2.320.0: abwechselnd Schneemann / Iglu
  } else if (J.phase === "bauen" || J.phase === "stehen") {
    if (J.phase === "bauen") { for (let i = 0; i < n; i++) B[i] -= B[i] * .07 * dt; if (J.pt >= 8) { jzbPhase("stehen"); jzbFunken(); } } // Schnee wird zum Schneemann gerollt
    else { for (let i = 0; i < n; i++) B[i] = Math.min(B[i], 9 * J.k); if (J.pt >= 50) { jzbSonneStart(); jzbPhase("schmelzen"); } }
  } else if (J.phase === "besuch") {
    if (!J.besuch && B.every((v) => v < .3) && !J.fx.length) { if ((J.spawn -= dt) < -1.5) jzbLaufEnde(); }
  } else if (J.phase === "schmelzen") {
    jzbSchmelzTropfen(dt);
    if (J.pt >= JZB_SONNE + JZB_SCHMELZ && J.iglu) { const I = J.iglu; J.iglu = null; jzbWindStart(6); J.wind.dir = I.x < J.w / 2 ? 1 : -1; } // 2.320.0: Iglu ist geschmolzen
    else if (J.pt >= JZB_SONNE + JZB_SCHMELZ) { // nur der Schal bleibt liegen – der Wind nimmt ihn mit
      const m = J.mann; J.mann = null; if (m) J.fx.push({ typ: "schal", x: m.x, y: J.h - 3, vx: 0, vy: 0, rot: 0, t: 0, a: 1 });
      jzbWindStart(6); if (m) J.wind.dir = m.x < J.w / 2 ? 1 : -1; // Wind weht zur freien Seite – der Schal fliegt quer über den Kopf
    }
  } else if (J.phase === "wind") {
    const W = J.wind;
    for (let i = 0; i < n; i++) if (B[i] > .05 && jzbHinterFront(i * JZB_SP)) {
      const ab = Math.min(B[i], 70 * dt); B[i] -= ab;
      if (J.fx.length < 170 && Math.random() < ab * .45) J.fx.push({ typ: "flocke", x: i * JZB_SP, y: J.h - B[i] - 1, r: jzbZ(.8, 2.2), vx: W.dir * jzbZ(160, 320), vy: -jzbZ(15, 80), a: 1 });
    }
    if (jzbWindVorbei() && B.every((v) => v < .3) && !J.fx.length) { if ((J.spawn -= dt) < -1.5) jzbLaufEnde(); }
  }
}
// ☀️ 2.277.0 KC-CLUB-SCHNEEMANN-SONNE (Wunsch Hansi): nach einer Weile kommt von links eine strahlende Sonne und steigt ein Stück über den
// Schneemann – er schmilzt, nur sein weinroter Schal bleibt liegen; der Wind wirbelt ihn dann mit dem Schnee davon.
const JZB_SONNE = 2.6, JZB_SCHMELZ = 6.5; // Sekunden: Sonne geht auf, dann schmilzt der Schneemann
function jzbSonneStart() {
  const J = JZB, m = J.mann || J.iglu, k = J.k; if (!m) return; // 2.320.0: auch über dem Iglu
  J.sonne = { t: 0, zx: Math.max(18 * k, m.x - 26 * k), zy: Math.max(18 * k, J.h - 84 * k) };
}
function jzbSonneMalen(c) {
  const J = JZB, S = J.sonne; if (!S) return;
  const k = J.k, ein = jzbEase(S.t / JZB_SONNE), aus = J.phase === "wind" && J.wind ? Math.min(1, J.wind.t / 2.2) : 0; if (aus >= 1) return;
  const x = -30 * k + (S.zx + 30 * k) * ein, y = S.zy + 30 * k * (1 - ein), r = 12 * k;
  c.save(); c.globalAlpha = 1 - aus;
  const glut = c.createRadialGradient(x, y, r * .5, x, y, r * 3.4); glut.addColorStop(0, "rgba(255,222,100,.55)"); glut.addColorStop(1, "rgba(255,222,100,0)");
  c.fillStyle = glut; c.beginPath(); c.arc(x, y, r * 3.4, 0, 7); c.fill();
  c.strokeStyle = "#ffd54a"; c.lineCap = "round"; c.lineWidth = 2.2 * k;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + J.T * .5, l = r * (.5 + .22 * Math.sin(J.T * 4 + i * 1.7));
    c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25); c.lineTo(x + Math.cos(a) * (r * 1.25 + l), y + Math.sin(a) * (r * 1.25 + l)); c.stroke(); }
  const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, "#fff7b8"); g.addColorStop(.6, "#ffd23a"); g.addColorStop(1, "#f5a300");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = "#b86e00"; c.lineWidth = 1.2 * k; // freundliches Gesicht
  for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * r * .33, y - r * .12, r * .13, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.beginPath(); c.arc(x, y + r * .1, r * .42, Math.PI * .2, Math.PI * .8); c.stroke();
  c.restore();
}
// fliegender bzw. liegender Schal: weinrotes Band mit Goldstreifen und Fransen
function jzbTropfenMalen(c, p) { // blauer Wassertropfen mit heller Spur und Glanzpunkt
  const s = p.s;
  if (p.spur > .5) { const g = c.createLinearGradient(p.x, p.y - p.spur, p.x, p.y); g.addColorStop(0, "rgba(140,200,255,0)"); g.addColorStop(1, "rgba(120,190,255,.7)");
    c.strokeStyle = g; c.lineWidth = s * .9; c.lineCap = "round"; c.beginPath(); c.moveTo(p.x, p.y - p.spur); c.lineTo(p.x, p.y); c.stroke(); }
  c.fillStyle = "#4aa3f0"; c.beginPath(); c.moveTo(p.x, p.y - s * 2.2); c.quadraticCurveTo(p.x + s * 1.1, p.y - s * .2, p.x, p.y + s); c.quadraticCurveTo(p.x - s * 1.1, p.y - s * .2, p.x, p.y - s * 2.2); c.fill();
  c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(p.x - s * .3, p.y - s * .3, s * .3, 0, 7); c.fill();
}
function jzbSchalMalen(c, x, y, rot, t, flug) {
  const k = JZB.k, L = 42 * k, w = 3.1 * k, n = 14, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([(u - .5) * L, Math.sin(u * 6.5 + t * (flug ? 9 : 0)) * (flug ? 3.6 : .9) * k]); }
  c.save(); c.translate(x, y); c.rotate(rot); c.lineCap = "round"; c.lineJoin = "round";
  const band = () => { c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.stroke(); };
  c.strokeStyle = "rgba(255,244,228,.9)"; c.lineWidth = w * 2 + 2.4 * k; band(); // heller Rand – sonst verschwindet Weinrot auf dem weinroten Kopf
  c.strokeStyle = "#a31d33"; c.lineWidth = w * 2; band();
  c.strokeStyle = "#d4a017"; c.lineWidth = 1.2 * k; c.lineCap = "butt";
  for (const i of [2, 3, n - 3, n - 2]) { const [px, py] = pts[i]; c.beginPath(); c.moveTo(px, py - w); c.lineTo(px, py + w); c.stroke(); }
  c.strokeStyle = "#8e1b2b"; c.lineWidth = .8 * k;
  for (const e of [0, n]) { const [px, py] = pts[e], sg = e ? 1 : -1; for (let f = -1; f <= 1; f++) { c.beginPath(); c.moveTo(px, py + f * w * .6); c.lineTo(px + sg * 2.6 * k, py + f * w * .9); c.stroke(); } }
  c.restore();
}
// 💧 2.280.0 (Wunsch Hansi „beim Schmelzen ein paar blaue Wassertropfen fließen lassen“): Tropfen lösen sich am Rand der Kugeln,
// rinnen mit einer kurzen Wasserspur am Schneemann herunter und laufen in die Pfütze
function jzbSchmelzTropfen(dt) {
  const J = JZB, m = J.mann, k = J.k, s = jzbEase((J.pt - JZB_SONNE) / JZB_SCHMELZ); if (!m || s <= 0 || s > .95) return;
  if ((J.tropfUhr = (J.tropfUhr || 0) - dt) > 0) return; J.tropfUhr = jzbZ(.04, .11);
  const gy = J.h - 1, kug = [[15, .9 * 15], [11, .9 * 15 + .78 * 15 + .82 * 11], [8.5, .9 * 15 + .78 * 15 + .82 * 11 + .78 * 11 + .85 * 8.5]]; // Radius, Höhe der Mitte (wie beim Malen)
  const [r, h] = kug[Math.random() < .5 ? 0 : Math.random() < .65 ? 1 : 2], seite = Math.random() < .5 ? -1 : 1, a = jzbZ(-.5, .35);
  const x = m.x + seite * Math.cos(a) * r * k * (1 + .3 * s), y = gy - (h + Math.sin(a) * r) * k * (1 - .92 * s);
  J.fx.push({ typ: "schmelz", x, y, x0: x, v: jzbZ(8, 18), s: jzbZ(1.8, 2.7) * k, spur: 0, a: 1, ph: jzbZ(0, 6.3) });
}
function jzbSchneemannStart() {
  const J = JZB, links = Math.floor(J.lauf / 6) % 2 === 0, r = 24 * J.k; // 2.320.0: /6 – Schneemann und Iglu wechseln sich ab, die Seite wechselt trotzdem
  J.mann = { x: links ? JZB_RAND + r + 8 : J.w - JZB_RAND - r - 8, blick: links ? 1 : -1, muetze: J.art === "advent" ? "weihnacht" : "koch" };
  jzbPhase("bauen");
}
function jzbFunken() {
  const J = JZB, m = J.mann; if (!m) return;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; J.fx.push({ typ: "funke", x: m.x + Math.cos(a) * 10, y: J.h - 52 * J.k + Math.sin(a) * 10, vx: Math.cos(a) * jzbZ(25, 55), vy: Math.sin(a) * jzbZ(25, 55), s: jzbZ(2, 3.5), a: 1, farbe: i % 2 ? "#fff6c2" : "#ffffff" }); }
}
// 🌱 Frühling / 🌻 Sommer: Beet anlegen
function jzbPflanzen() {
  const J = JZB, k = J.k, sommer = J.saison === "sommer";
  J.halme = [];
  for (let x = JZB_RAND - 6; x < J.w - JZB_RAND + 6; x += jzbZ(2.6, 4.2))
    J.halme.push({ x, z: (sommer ? jzbZ(4, 10) : jzbZ(5, 14)) * k, v: jzbZ(0, 7), f: sommer ? jzbW(["#7aa83a", "#8db63c", "#a3b84a", "#6f9e35"]) : jzbW(JZB_GRUEN), n: jzbZ(-.25, .25), b: jzbZ(1.3, 2.1) });
  if (sommer) {
    const drei = J.lauf % 3 === 2, hoch = Math.max(28, Math.min(105, J.h * .52));
    const plaetze = drei ? [[.64, .78], [.78, 1], [.91, .62]] : [[.84, 1]];
    J.blumen = plaetze.map(([p, f], i) => ({ typ: "sonnenblume", x: Math.min(J.w - 30, J.w * p), H: hoch * f, s: (.8 + .2 * f) * k, t0: i * 1.5, ab: [] }));
  } else {
    const n = Math.max(4, Math.round(J.w / 48)), arten = ["gaensebluemchen", "tulpe", "krokus", "loewenzahn"];
    J.blumen = Array.from({ length: n }, (_, i) => ({ typ: arten[(i + J.lauf) % arten.length], x: JZB_RAND + 10 + (i + jzbZ(.15, .85)) * (J.w - 2 * JZB_RAND - 20) / n, z: jzbZ(12, 24) * k, t0: 7 + jzbZ(0, 12), farbe: jzbW(["#e63946", "#ff7aa2", "#f4a261", "#ffd166"]) }));
  }
}
function jzbBeet(dt) {
  const J = JZB, sommer = J.saison === "sommer";
  if (J.phase === "wachsen") {
    if (!sommer && (J.spawn -= dt) <= 0 && J.flug.length < 6) { J.spawn = jzbZ(1.2, 2.8); J.flug.push(jzbNeuesTeil("bluete")); }
    if (!J.gaeste.some((g) => g.typ === "falter") && J.pt > 10 && Math.random() < dt / 14) J.gaeste.push(jzbFalter());
    if (!sommer && J.lauf % 3 === 2 && J.pt > 16 && !J.hase) { J.hase = true; J.gaeste.push({ typ: "hase", x: J.w + 24, t: 0 }); }
    if (sommer && J.pt > 15 && !J.gaeste.some((g) => g.typ === "biene" || g.typ === "gluehwurm")) {
      if (typeof istNacht === "function" && istNacht()) for (let i = 0; i < 7; i++) J.gaeste.push({ typ: "gluehwurm", x: jzbZ(20, J.w - 20), y: jzbZ(J.h * .35, J.h - 12), vx: jzbZ(-12, 12), vy: jzbZ(-8, 8), ph: jzbZ(0, 6.3) });
      else J.gaeste.push({ typ: "biene", t: 0, b: 0 });
    }
    if (!J.gegossen && J.pt > (sommer ? 28 : 34)) { J.gegossen = true; jzbBesuchStart("giessen"); } // 2.259.0: Twinkey gießt
    if (sommer && J.pt > JZB_BLUEHT) for (const f of J.blumen) { // Spätsommer: die Blütenblätter fallen eins nach dem anderen
      const soll = Math.floor((J.pt - JZB_BLUEHT - f.t0 * .3) * 2.6);
      while (f.ab.length < Math.min(16, soll)) {
        const i = jzbBlattNr(f), kopf = jzbSonnenKopf(f), a = i / 16 * Math.PI * 2 + .1, rr = 12 * f.s;
        f.ab.push(i); J.fx.push({ typ: "bluetenblatt", x: kopf.x + Math.cos(a) * rr, y: kopf.y + Math.sin(a) * rr, s: 4.5 * f.s, rot: a, vr: jzbZ(-3, 3), vx: jzbZ(-10, 10), vy: jzbZ(5, 15), farbe: i % 2 ? "#f2b705" : "#f7c51e" });
      }
    }
    if (J.pt >= JZB_BLUEHT + (sommer ? 8 : 0)) {
      J.gaeste = J.gaeste.filter((g) => g.typ !== "biene" && g.typ !== "gluehwurm"); J.hase = false;
      if (!sommer) for (const f of J.blumen) for (let i = 0; i < 5; i++) J.fx.push({ typ: "bluetenblatt", x: f.x, y: J.h - f.z, s: 2.6 * J.k, rot: jzbZ(0, 6.3), vr: jzbZ(-6, 6), vx: 0, vy: -jzbZ(10, 40), farbe: f.typ === "tulpe" ? f.farbe : f.typ === "krokus" ? "#b58ae6" : f.typ === "loewenzahn" ? "#ffd23f" : "#ffffff" });
      jzbWindStart(3.6);
    }
  } else if (J.phase === "wind") {
    J.welk = jzbEase(J.wind.t / J.wind.dauer);
    if (jzbWindVorbei() && !J.fx.length) { if ((J.spawn -= dt) < -1.2) jzbLaufEnde(); }
  }
}
function jzbBlattNr(f) { for (;;) { const i = Math.floor(Math.random() * 16); if (!f.ab.includes(i)) return i; } }
function jzbFalter() {
  const J = JZB, dir = Math.random() < .5 ? 1 : -1;
  return { typ: "falter", dir, x: dir > 0 ? -16 : J.w + 16, y0: jzbZ(J.h * .25, J.h * .75), t: 0, v: jzbZ(26, 40), farbe: jzbW([["#f6c445", "#e09f1f"], ["#ff8fb1", "#e0577f"], ["#8ecae6", "#3a8fc0"], ["#ffffff", "#c9c9c9"]]) };
}
function jzbGaeste(dt) {
  const J = JZB;
  for (const g of J.gaeste) {
    g.t = (g.t || 0) + dt;
    if (g.typ === "falter") { g.x += g.dir * g.v * dt; g.y = g.y0 + Math.sin(g.t * 1.7) * 12 + Math.sin(g.t * 4.3) * 4; if (g.x < -30 || g.x > J.w + 30) g.weg = true; }
    else if (g.typ === "osterhase") { const z = g.t % 1; if (z < .55) g.x -= 42 * J.k * dt; g.y = J.h - 1 - (z < .55 ? Math.sin(z / .55 * Math.PI) * 11 * J.k : 0);
      for (const e of J.eier || []) if (e.da === false && g.x < e.x) e.da = true; if (g.x < -30) { g.weg = true; for (const e of J.eier || []) e.da = true; } }
    else if (g.typ === "hase") { const z = g.t % .8; if (z < .55) g.x -= 70 * J.k * dt; g.y = J.h - 1 - (z < .55 ? Math.sin(z / .55 * Math.PI) * 15 * J.k : 0); if (g.x < -30) g.weg = true; }
    else if (g.typ === "gluehwurm") { g.ph += dt; g.vx += jzbZ(-20, 20) * dt; g.vy += jzbZ(-20, 20) * dt; g.vx *= .98; g.vy *= .98; g.x = Math.max(8, Math.min(J.w - 8, g.x + g.vx * dt)); g.y = Math.max(J.h * .2, Math.min(J.h - 8, g.y + g.vy * dt)); }
  }
  J.gaeste = J.gaeste.filter((g) => !g.weg);
}

// ---------- Zeichnen ----------
function jzbMalen() {
  const J = JZB, c = J.ctx; if (!c || !J.w) return;
  c.clearRect(0, 0, J.w, J.h);
  jzbExtrasHinten(c); // Ostereier – das Gras wächst darüber
  if (J.fest) jzbFestMalen(c); // 2.331.0 KC-CLUB-THEMEN-BUEHNE
  if (J.saison === "winter") jzbSonneMalen(c); // 2.277.0: hinter Schnee und Schneemann
  if (J.saison === "fruehling" || J.saison === "sommer") jzbBeetMalen(c);
  if (J.saison === "winter") jzbSchneeMalen(c);
  for (const b of J.liegt) { const w = b.wackel ? Math.sin(J.T * 30) * .5 * b.wackel : 0; jzbBlatt(c, b.x, J.h - b.yb - Math.abs(w) * 3, b.s, b.rot + w, 1, .65, b.farbe, b.form); } // raschelt beim Igel
  if (J.iglu) jzbIgluMalen(c); // 2.320.0 KC-CLUB-WINTER-IGLU – vor den Figuren (die laufen davor)
  jzbExtrasBoden(c);
  if (J.mann) jzbSchneemannMalen(c);
  jzbTwinkeyMalen(c);
  for (const g of J.gaeste) jzbGastMalen(c, g);
  const flocken = [];
  for (const p of [...J.flug, ...J.fx]) {
    c.globalAlpha = Math.max(0, Math.min(1, p.a ?? 1));
    if (p.typ === "flocke") { if (p.a === undefined || p.a >= 1) flocken.push(p); else { c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); } }
    else if (p.typ === "blatt") jzbBlatt(c, p.x, p.y, p.s, p.rot, p.liegt ? 1 : Math.cos(p.ph * 1.3), p.liegt ? .55 : 1, p.farbe, p.form);
    else if (p.typ === "bluete" || p.typ === "bluetenblatt") { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.farbe; c.beginPath(); c.ellipse(0, 0, p.s, p.s * (p.typ === "bluete" ? .7 : .35), 0, 0, 7); c.fill(); c.restore(); }
    else if (p.typ === "funke") jzbStern(c, p.x, p.y, p.s, p.farbe);
    else if (p.typ === "scherbe") { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = "#e3f5ff"; c.strokeStyle = "rgba(60,140,210,.9)"; c.lineWidth = .8;
      c.beginPath(); c.moveTo(-p.s, -p.s * .35); c.lineTo(p.s * .85, -p.s * .7); c.lineTo(p.s * .3, p.s * .85); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    else if (p.typ === "nuss") jzbEichelMalen(c, p.x, p.y, p.nuss, p.rot, J.k, p.s);
    else if (p.typ === "pilz") jzbPilzMalen(c, p.x, p.y, p.art, p.rot, J.k, p.s, 1); // 2.389.0
    else if (p.typ === "schal") jzbSchalMalen(c, p.x, p.y, p.rot, p.t, !!p.los);
    else if (p.typ === "schmelz") jzbTropfenMalen(c, p);
    else if (p.typ === "wasser") { c.fillStyle = "rgba(120,190,255,.95)"; c.beginPath(); c.ellipse(p.x, p.y, 1.1, 1.8, 0, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1;
  if (flocken.length) { c.fillStyle = "rgba(255,255,255,.92)"; c.beginPath(); for (const f of flocken) { c.moveTo(f.x + f.r, f.y); c.arc(f.x, f.y, f.r, 0, 7); } c.fill(); }
  jzbRegenMalen(c);
  const W = J.wind;
  if (W) {
    c.lineCap = "round";
    for (const s of W.striche) { c.lineWidth = s.a > .6 ? 2.4 : 1.7;
      c.strokeStyle = `rgba(255,255,255,${s.a})`; c.beginPath(); c.moveTo(s.x, s.y);
      c.quadraticCurveTo(s.x - W.dir * s.l * .5, s.y - 7 * Math.sin(J.T * 6 + s.ph), s.x - W.dir * s.l, s.y + 2); c.stroke();
    }
  }
}
function jzbBlatt(c, x, y, s, rot, sx, sy, farbe, form) {
  c.save(); c.translate(x, y); c.scale(1, sy); c.rotate(rot); c.scale(Math.abs(sx) < .15 ? .15 * Math.sign(sx || 1) : sx, 1);
  c.fillStyle = farbe; c.beginPath();
  if (form) for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .5 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } // Ahorn
  else { c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * .8, s, 0); c.quadraticCurveTo(0, s * .8, -s, 0); }
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(90,40,10,.45)"; c.lineWidth = .8; c.beginPath();
  if (form) { c.moveTo(0, s * 1.05); c.lineTo(0, -s * .6); } else { c.moveTo(-s * 1.3, 0); c.lineTo(s * .7, 0); }
  c.stroke(); c.restore();
}
function jzbStern(c, x, y, s, farbe) {
  c.fillStyle = farbe; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * .35 : s; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  c.closePath(); c.fill();
}
function jzbSchneeMalen(c) {
  const J = JZB, B = J.boden; if (!B.some((v) => v > .3)) return;
  c.beginPath(); c.moveTo(0, J.h + 2);
  B.forEach((v, i) => c.lineTo(i * JZB_SP, J.h - v));
  c.lineTo(J.w, J.h + 2); c.closePath();
  const g = c.createLinearGradient(0, J.h - 16, 0, J.h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#d3e1f0");
  c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(190,210,235,.7)"; c.lineWidth = 1; c.stroke();
}
function jzbKugel(c, x, y, r) {
  if (r <= .3) return;
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, "#ffffff"); g.addColorStop(.7, "#f1f5fa"); g.addColorStop(1, "#c9d7e6");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}
// ⛄ Der Schneemann: drei Kugeln rollen sich zusammen, dann Gesicht (lachend), Karottennase, Knöpfe, Arme, weinroter Schal, Mütze
function jzbSchneemannMalen(c) {
  const J = JZB, m = J.mann, k = J.k, t = J.pt, ph = J.phase, x = m.x, gy = J.h - 1 - Math.min(jzbBodenH(x), 6 * k) * .5;
  const bau = ph === "bauen" ? t : 99, g1 = jzbEase(bau / 2.2), g2 = jzbEase((bau - 2.2) / 1.8), g3 = jzbEase((bau - 4) / 1.6);
  const teil = (i) => jzbHopp((bau - 5.6 - i * .3) / .5);
  const schmelz = ph === "schmelzen" ? jzbEase((t - JZB_SONNE) / JZB_SCHMELZ) : 0, lachen = ph === "stehen" && t % 4 < 1.3;
  const r1 = 15 * k * g1, r2 = 11 * k * g2, r3 = 8.5 * k * g3;
  const y1 = gy - r1 * .9, y2 = y1 - r1 * .78 - r2 * .82, hy = y2 - r2 * .78 - r3 * .85 + (lachen ? Math.sin(J.T * 18) * .8 : 0);
  c.save();
  if (schmelz) { // Pfütze und zusammensackender Schneemann
    c.fillStyle = `rgba(200,225,255,${.55 * (1 - schmelz * .6)})`; c.beginPath(); c.ellipse(x, gy, 15 * k * (1 + .7 * schmelz), 2.6 * k, 0, 0, 7); c.fill();
    c.translate(x, gy); c.scale(1 + .3 * schmelz, 1 - .92 * schmelz); c.translate(-x, -gy); c.globalAlpha = 1 - schmelz * .75;
  }
  c.lineCap = "round"; c.strokeStyle = "#6b4a2b";
  const arm = (seite, winkel, a) => { // Stockarme mit zwei Zweigen
    if (a <= 0) return; const sx = x + seite * r2 * .8, sy = y2 - r2 * .15, l = 15 * k * a, ex = sx + Math.cos(winkel) * l, ey = sy + Math.sin(winkel) * l;
    c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey);
    for (const d of [-.6, .6]) { c.moveTo(ex - Math.cos(winkel) * l * .2, ey - Math.sin(winkel) * l * .2); c.lineTo(ex + Math.cos(winkel + d) * l * .28, ey + Math.sin(winkel + d) * l * .28); }
    c.stroke();
  };
  if (g3 >= 1) { const winken = ph === "stehen" ? Math.sin(J.T * 5) * .35 : 0; arm(-m.blick, m.blick > 0 ? Math.PI + .45 : -.45, teil(4)); arm(m.blick, (m.blick > 0 ? -.55 : Math.PI + .55) + winken * m.blick, teil(4)); }
  jzbKugel(c, x, y1, r1); jzbKugel(c, x, y2, r2);
  c.fillStyle = "#2b2b2b"; const kn = teil(3);
  if (kn > 0) for (const [kx, ky] of [[x, y2 - r2 * .25], [x, y2 + r2 * .3], [x, y1 - r1 * .4]]) { c.beginPath(); c.arc(kx, ky, 1.6 * k * kn, 0, 7); c.fill(); }
  jzbKugel(c, x, hy, r3);
  if (g3 >= 1) {
    const sc = teil(5), hals = y2 - r2 * .8; // Schal in Clubfarbe Weinrot mit Goldstreifen
    if (sc > 0 && !schmelz) {
      c.fillStyle = "#8e1b2b"; c.beginPath(); c.ellipse(x, hals, r2 * .85 * sc, 3 * k * sc, 0, 0, 7); c.fill();
      const ex = x - m.blick * r2 * .35, wehen = (J.wind ? J.wind.dir * J.wind.st : Math.sin(J.T * 1.3) * .15) * .4;
      c.save(); c.translate(ex, hals); c.rotate(wehen); c.fillRect(-2.2 * k, 0, 4.4 * k, 11 * k * sc);
      c.fillStyle = "#d4a017"; for (const f of [.35, .65]) c.fillRect(-2.2 * k, 11 * k * sc * f, 4.4 * k, 1.2 * k); c.restore();
    }
    const au = teil(0);
    if (au > 0) { // lachende Augen (∩ ∩) und rote Bäckchen
      c.strokeStyle = "#2b2b2b"; c.lineWidth = 1.5 * k * au;
      for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * r3 * .36, hy - r3 * .15, r3 * .17, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.fillStyle = `rgba(255,110,130,${.45 * au})`; for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * r3 * .58, hy + r3 * .14, r3 * .16, 0, 7); c.fill(); }
    }
    const mu = teil(2);
    if (mu > 0) { // weit offener, lachender Mund mit Zunge
      const mw = r3 * .44 * mu, mh = r3 * .36 * mu * (lachen ? .7 + .3 * Math.abs(Math.sin(J.T * 14)) : .85), my = hy + r3 * .3;
      c.fillStyle = "#7a1426"; c.beginPath(); c.moveTo(x - mw, my); c.ellipse(x, my, mw, mh, 0, 0, Math.PI); c.closePath(); c.fill();
      c.save(); c.clip(); c.fillStyle = "#e8707e"; c.beginPath(); c.ellipse(x, my + mh * .95, mw * .55, mh * .5, 0, 0, 7); c.fill(); c.restore();
    }
    const na = teil(1);
    if (na > 0) { c.fillStyle = "#f08a24"; c.beginPath(); c.moveTo(x + m.blick * r3 * .05, hy - r3 * .08); c.lineTo(x + m.blick * (r3 * .1 + r3 * .95 * na), hy + r3 * .02); c.lineTo(x + m.blick * r3 * .05, hy + r3 * .14); c.closePath(); c.fill(); }
    const hu = teil(6);
    if (hu > 0) {
      c.save(); c.translate(x, hy - r3 * .82); c.scale(hu * k, hu * k);
      if (m.muetze === "weihnacht") { // Weihnachtsmütze
        c.fillStyle = "#c62828"; c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(-2, -14, 9 * m.blick, -11); c.quadraticCurveTo(4, -5, 8, 0); c.closePath(); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, 0, 9, 2.6, 0, 0, 7); c.fill(); c.beginPath(); c.arc(9 * m.blick, -11, 2.6, 0, 7); c.fill();
      } else { // Kochmütze – es ist ja der Köcheclub
        c.fillStyle = "#ffffff"; c.strokeStyle = "rgba(0,0,0,.14)"; c.lineWidth = .8;
        c.beginPath(); c.rect(-6, -5, 12, 5); c.fill(); c.stroke();
        for (const [px, py, pr] of [[-5, -8, 4.6], [5, -8, 4.6], [0, -11, 5.8]]) { c.beginPath(); c.arc(px, py, pr, 0, 7); c.fill(); c.stroke(); }
        c.fillRect(-5.4, -7, 10.8, 3);
      }
      c.restore();
    }
  }
  c.restore();
  if (schmelz) { // 2.277.0: der Schal schmilzt nicht – er sinkt mit und legt sich flach in die Pfütze
    const hals = y2 - r2 * .8, sy = Math.min(J.h - 3, gy + (hals - gy) * (1 - .92 * schmelz));
    if (schmelz < .85) {
      c.fillStyle = "#8e1b2b"; c.beginPath(); c.ellipse(x, sy, r2 * .85 * (1 + .5 * schmelz), 3 * k * (1 - .4 * schmelz), 0, 0, 7); c.fill();
      c.save(); c.translate(x - m.blick * r2 * .35, sy); c.rotate(-m.blick * schmelz * 1.5); c.fillRect(-2.2 * k, 0, 4.4 * k, 11 * k);
      c.fillStyle = "#d4a017"; for (const f of [.35, .65]) c.fillRect(-2.2 * k, 11 * k * f, 4.4 * k, 1.2 * k); c.restore();
    } else jzbSchalMalen(c, x, J.h - 3, 0, 0, false);
  }
}
function jzbHalmWinkel(x, n) { const W = JZB.wind; return n + Math.sin(JZB.T * 1.5 + x * .045) * .1 + (W ? W.dir * W.st * .7 : 0); }
function jzbBeetMalen(c) {
  const J = JZB, t = J.phase === "wachsen" ? J.pt : 99, welk = 1 - J.welk, k = J.k;
  c.lineCap = "round";
  for (const g of J.halme) {
    const hz = g.z * jzbEase((t - g.v) / 9) * welk; if (hz < .5) continue;
    const a = jzbHalmWinkel(g.x, g.n);
    c.strokeStyle = g.f; c.lineWidth = g.b; c.beginPath(); c.moveTo(g.x, J.h + 1);
    c.quadraticCurveTo(g.x + Math.sin(a) * hz * .2, J.h - hz * .55, g.x + Math.sin(a) * hz, J.h - Math.cos(a) * hz); c.stroke();
  }
  for (const f of J.blumen) {
    if (f.typ === "sonnenblume") { jzbSonnenblume(c, f, t, welk); continue; }
    const hz = f.z * jzbEase((t - f.t0) / 2.2) * welk; if (hz < .5) continue;
    const a = jzbHalmWinkel(f.x, 0) * .7, tx = f.x + Math.sin(a) * hz, ty = J.h - Math.cos(a) * hz;
    c.strokeStyle = "#4f8a2b"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(f.x, J.h + 1); c.quadraticCurveTo(f.x + Math.sin(a) * hz * .3, J.h - hz * .5, tx, ty); c.stroke();
    const bl = jzbHopp((t - f.t0 - 2) / 1.2) * welk; if (bl <= 0) continue;
    c.save(); c.translate(tx, ty); c.rotate(a * .6); c.scale(bl * k, bl * k);
    if (f.typ === "gaensebluemchen" || f.typ === "loewenzahn") {
      const lz = f.typ === "loewenzahn", n = lz ? 16 : 10;
      c.fillStyle = lz ? "#ffd23f" : "#ffffff";
      for (let i = 0; i < n; i++) { c.save(); c.translate(0, -2); c.rotate(i / n * Math.PI * 2); c.beginPath(); c.ellipse(lz ? 2.6 : 3, 0, lz ? 2.4 : 2.6, lz ? .7 : 1.1, 0, 0, 7); c.fill(); c.restore(); }
      c.fillStyle = lz ? "#f2a900" : "#ffcf33"; c.beginPath(); c.arc(0, -2, lz ? 1.8 : 1.6, 0, 7); c.fill();
    } else { // Tulpe / Krokus: Kelch
      const krokus = f.typ === "krokus", br = krokus ? 2.9 : 3.8;
      c.fillStyle = krokus ? "#9b6bd6" : f.farbe; c.beginPath(); c.moveTo(-br, -6); c.quadraticCurveTo(-br - .2, 0, 0, 0); c.quadraticCurveTo(br + .2, 0, br, -6);
      c.lineTo(br * .6, -3.6); c.lineTo(br * .32, -7.4); c.lineTo(0, -4.2); c.lineTo(-br * .32, -7.4); c.lineTo(-br * .6, -3.6); c.closePath(); c.fill();
      c.strokeStyle = krokus ? "rgba(255,255,255,.7)" : "rgba(0,0,0,.15)"; c.lineWidth = .6; c.beginPath(); c.moveTo(0, -.5); c.lineTo(0, -4); c.stroke();
    }
    c.restore();
  }
}
function jzbSonnenKopf(f) {
  const J = JZB, t = J.phase === "wachsen" ? J.pt : 99, hz = f.H * jzbEase((t - f.t0) / 9) * (1 - J.welk), a = jzbHalmWinkel(f.x, 0) * .35;
  return { x: f.x + Math.sin(a) * hz, y: J.h - Math.cos(a) * hz, hz, a };
}
// 🌻 Sonnenblume: Stiel wächst, zwei Blätter, Knospe – dann geht die Blüte auf und wiegt sich leicht
function jzbSonnenblume(c, f, t, welk) {
  const J = JZB, s = f.s, { x: kx, y: ky, hz, a } = jzbSonnenKopf(f); if (hz < .5) return;
  c.strokeStyle = "#4f8a2b"; c.lineWidth = 2.6 * s; c.beginPath(); c.moveTo(f.x, J.h + 1); c.quadraticCurveTo(f.x + Math.sin(a) * hz * .3 + 2, J.h - hz * .5, kx, ky); c.stroke();
  for (const [anteil, seite] of [[.35, -1], [.6, 1]]) {
    const gr = jzbEase((hz / f.H - anteil) * 6) * welk; if (gr <= 0) continue;
    const bx = f.x + (kx - f.x) * anteil, by = J.h - hz * anteil, L = 9 * s * gr;
    c.save(); c.translate(bx, by); c.rotate(seite * -.9 + a); c.fillStyle = "#5c9a33"; c.beginPath(); c.ellipse(seite * L * .85, 0, L, L * .42, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(30,70,20,.5)"; c.lineWidth = .7; c.beginPath(); c.moveTo(0, 0); c.lineTo(seite * L * 1.6, 0); c.stroke(); c.restore();
  }
  const auf = jzbHopp((t - f.t0 - 9) / 2.5) * welk, rk = 6 * s;
  c.save(); c.translate(kx, ky); c.scale(.86 + .14 * Math.cos(J.T * .35 + f.x), 1);
  if (auf <= 0) { c.fillStyle = "#5c9a33"; c.beginPath(); c.arc(0, 0, 3.2 * s * jzbEase((t - f.t0 - 6) / 3), 0, 7); c.fill(); c.restore(); return; }
  for (let i = 0; i < 16; i++) {
    if (f.ab.includes(i)) continue;
    const w = i / 16 * Math.PI * 2 + .1, pl = 9 * s * auf;
    c.save(); c.rotate(w); c.fillStyle = i % 2 ? "#f2b705" : "#f7c51e"; c.beginPath(); c.ellipse(rk + pl * .5, 0, pl * .5, pl * .19, 0, 0, 7); c.fill(); c.restore();
  }
  const g = c.createRadialGradient(-rk * .3, -rk * .3, rk * .1, 0, 0, rk); g.addColorStop(0, "#7a5230"); g.addColorStop(1, "#3b2412");
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rk * Math.max(.4, auf), 0, 7); c.fill();
  c.fillStyle = "rgba(200,150,80,.55)";
  for (let i = 0; i < 13; i++) { const w = i * 2.4, r = Math.sqrt(i / 13) * rk * .8 * auf; c.beginPath(); c.arc(Math.cos(w) * r, Math.sin(w) * r, .7 * s, 0, 7); c.fill(); }
  c.restore();
}
function jzbGastMalen(c, g) {
  const J = JZB, k = J.k;
  if (g.typ === "falter") {
    const f = .15 + .85 * Math.abs(Math.sin(g.t * 13));
    c.save(); c.translate(g.x, g.y); c.scale(k, k);
    for (const s of [-1, 1]) { c.save(); c.scale(s * f, 1); c.fillStyle = g.farbe[0]; c.beginPath(); c.ellipse(3.6, -2.4, 3.6, 3, -.4, 0, 7); c.fill(); c.fillStyle = g.farbe[1]; c.beginPath(); c.ellipse(2.6, 2.2, 2.4, 2, .4, 0, 7); c.fill(); c.restore(); }
    c.strokeStyle = "#3a2a1a"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, -4); c.lineTo(0, 4); c.stroke(); c.restore();
  } else if (g.typ === "hase" || g.typ === "biene" || g.typ === "osterhase") {
    let x = g.x, y = g.y, gr = 20 * k, spiegel = 1;
    if (g.typ === "biene") { // fliegt Achten um die (erste) Sonnenblume
      const f = J.blumen[0]; if (!f) return; const kopf = jzbSonnenKopf(f), r = 20 * f.s;
      x = kopf.x + Math.cos(g.t * 1.3) * r + Math.sin(g.t * 3.1) * 3; y = kopf.y + Math.sin(g.t * 2.6) * r * .55;
      spiegel = -Math.sin(g.t * 1.3) > 0 ? -1 : 1; gr = 12 * k;
    }
    c.save(); c.translate(x, y); c.scale(spiegel, 1); c.font = `${gr}px ${JZB_EMOJI}`; c.textAlign = "center"; c.textBaseline = g.typ !== "biene" ? "bottom" : "middle"; c.fillText(g.typ !== "biene" ? "🐇" : "🐝", 0, 0); if (g.typ === "osterhase") { c.font = `${11 * k}px ${JZB_EMOJI}`; c.fillText("🧺", 9 * k, -2 * k); } c.restore();
  } else if (g.typ === "gluehwurm") {
    const a = .35 + .65 * Math.abs(Math.sin(g.ph * 1.6)), r = 6 * k, gr = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
    gr.addColorStop(0, `rgba(240,255,150,${a})`); gr.addColorStop(1, "rgba(200,255,100,0)"); c.fillStyle = gr; c.beginPath(); c.arc(g.x, g.y, r, 0, 7); c.fill();
  }
}
// ---------- 2.331.0 KC-CLUB-THEMEN-BUEHNE (Wunsch Hansi „neue Bühnenbilder für die Themen: Sim-Jü, Oktoberfest, Karibik“) ----------
// Eigene Szenen der Kopf-Bühne für Themen (über ein Thema, „Nach Kalender“ oder die Vorschau – die Jahreszeiten-Automatik bleibt wie sie ist).
// Ein Lauf dauert rund zwei Minuten: Aufbau → Szene → Höhepunkt → Ausblenden → nächster Lauf.
// 🎡 Sim-Jü: Lichterkette, Riesenrad mit Gondeln, Luftballons, Lebkuchenherz mit dem eigenen Vornamen, zum Schluss Feuerwerk.
// 🥨 Oktoberfest: blau-weiße Wimpel, Brezn, Fass wird angezapft („O'zapft is!“), zwei Maßkrüge stoßen an („Prost!“), Lebkuchenherz mit Namen.
// 🌴 Karibik: Meer mit Wellen, Strand und Palme (ab und zu fällt eine Kokosnuss), Segelboot, Papagei oder springender Fisch, der Vorname
// wird in den Sand geschrieben – eine Welle holt ihn; zum Schluss Sonnenuntergang. Alles nur Bild, nichts wird gespeichert oder gesendet.
const JZB_FESTE = ["kirmes", "wiesn", "karibik", "karneval", "halloween", "unterwasser", "weltraum", "bauernhof", "kegeln", "wildwest", "wueste", "baustelle", "seifenblasen"]; // 2.633.0: + Seifenblasen · 2.617.0: + Baustelle · 2.548.0: + Wüste · 2.529.0: + Wilder Westen · 2.446.0: + Kegeln · 2.332.0: + Karneval, Halloween · 2.434.0: + Unterwasserwelt · 2.444.0: + Weltraum · 2.445.0: + Bauernhof
const JZB_FEST_DAUER = 120; // Sekunden je Lauf
// 2.617.0 KC-CLUB-SIMJUE-FEUERWERK (Wunsch Hansi „am Montag 21 Uhr Feuerwerk gleichzeitig mit dem echten Feuerwerk“): am Sim-Jü-Montag von 21:00 bis 21:20
// steigen in der Sim-Jü-Szene ununterbrochen Raketen (mehr, größer, auch Goldregen), der Himmel wird dunkel – und das Bild bleibt in der Zeit nicht stehen.
const jzbSimJueFeuerwerk = (d = new Date()) => d.getDay() === 1 && d.getHours() === 21 && d.getMinutes() < 20 && themaFestZeit(d) === "simjue";
const JZB_FEST_BUNT = ["#ff4d6d", "#ffd23f", "#3ec1ff", "#7bed6f", "#c77dff", "#ff9f1c", "#ffffff"];
let JZB_VM_ZAEHLER = 0; // 2.682.0 KC-CLUB-VIEHMARKT: am Sim-Jü-Dienstag abwechselnd Viehmarkt und Kirmes-Szene (der erste Lauf ist der Viehmarkt)
function jzbFestStart() {
  const vm = JZB.saison === "kirmes" && jzbViehmarktTag() && (JZB_VM_ZAEHLER++ % 2 === 0);
  JZB.fest = { vm, t: 0, a: 0, raketen: [], raketUhr: 0, ballons: [], ballonUhr: jzbZ(2, 5), spritzer: [], schild: -1, boot: null, bootUhr: jzbZ(2, 6),
    gast: null, gastUhr: jzbZ(8, 14), nuss: null, nussUhr: jzbZ(18, 30), welle: -1, prost: [],
    konfetti: [], liegt: [], kamelle: [], wagen: null, wagenUhr: jzbZ(3, 6), kanone: false, fleder: [], flederUhr: jzbZ(1, 4), geist: null, geistUhr: jzbZ(5, 9) }; // 2.332.0
}
function jzbFest(dt) {
  const J = JZB, k = J.k;
  if (J.phase === "anfang" || !J.fest) { jzbFestStart(); jzbPhase("fest"); }
  const F = J.fest; F.t += dt;
  if (J.saison === "kirmes" && F.vm) return jzbVmSchritt(F, dt); // 2.682.0 KC-CLUB-VIEHMARKT
  if (J.saison === "seifenblasen") return jzbSbSchritt(F, dt); // 2.633.0: Kinder pusten Seifenblasen, die Scheibe verschmiert, der Fensterputzer putzt
  if (J.saison === "baustelle") return jzbBsSchritt(F, dt); // 2.617.0: Radlader, Kipplaster, Abgas-Name, Arbeiter – zum Schluss wird der Kopf gesprengt
  if (J.saison === "wueste") return jzbWuSchritt(F, dt); // 2.548.0: Pyramiden, Karawane, Oase, Pharao, Flaschengeist – Name aus Goldstaub, Sonnenuntergang
  if (J.saison === "wildwest") return jzbWwSchritt(F, dt); // 2.529.0: Tipi, Lagerfeuer, Cowboys, Kutsche – zum Schluss die Büffelherde
  if (J.saison === "kegeln") return jzbKgSchritt(F, dt); // 2.446.0: 6 Würfe, zuletzt „Alle Neune“, Tafel wischen
  if (J.saison === "bauernhof") return jzbBhSchritt(F, dt); // 2.445.0: ein Tag auf dem Hof – Morgen bis Nacht, dann wieder Morgen
  if (J.saison === "weltraum") return jzbWrSchritt(F, dt); // 2.444.0: eigener Ablauf (Rakete, Astronaut, UFO)
  if (J.saison === "unterwasser") return jzbUwSchritt(F, dt); // 2.434.0: eigener Ablauf (Regen füllt, Stöpsel leert) – ohne Ein-/Ausblenden
  const fw = J.saison === "kirmes" && jzbSimJueFeuerwerk(); // 2.617.0: während des großen Feuerwerks kein Ausblenden und kein neuer Lauf
  F.a = fw ? 1 : Math.min(1, F.t / 2.5, Math.max(0, (JZB_FEST_DAUER - F.t) / 4));
  if (F.t >= JZB_FEST_DAUER && !fw) { J.fest = null; return jzbLaufEnde(); }
  for (const s of F.spritzer) { s.vy += 260 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a -= dt * 1.3; }
  F.spritzer = F.spritzer.filter((s) => s.a > 0 && s.y < J.h + 4);
  if (J.saison === "kirmes") {
    if ((F.ballonUhr -= dt) <= 0 && F.t < JZB_FEST_DAUER - 15) { F.ballonUhr = jzbZ(5, 11); F.ballons.push({ x: jzbZ(J.w * .1, J.w * .7), y: J.h + 20 * k, v: jzbZ(18, 28) * k, ph: jzbZ(0, 6), farbe: jzbW(JZB_FEST_BUNT.slice(0, 6)) }); }
    for (const b of F.ballons) { b.y -= b.v * dt; b.ph += dt; b.x += Math.sin(b.ph * 1.3) * 8 * dt; }
    F.ballons = F.ballons.filter((b) => b.y > -40 * k);
    jzbClownSchritt(F, dt); // 2.667.0 KC-CLUB-SIMJUE-CLOWN
    // 🎆 Feuerwerk zum Schluss (am Sim-Jü-Montag gibt es das echte) · 2.617.0: Montag 21:00–21:20 großes Feuerwerk gleichzeitig mit dem echten
    const gross = jzbSimJueFeuerwerk(), heute = new Date(), fwTag = themaFestZeit(heute) !== "simjue" || heute.getDay() === 1; // 2.620.0 KC-CLUB-SIMJUE-FEUERWERK-MONTAG: in der Sim-Jü-Woche nur am Montag
    if ((gross || (fwTag && F.t > JZB_FEST_DAUER - 30 && F.t < JZB_FEST_DAUER - 7)) && (F.raketUhr -= dt) <= 0) { F.raketUhr = gross ? jzbZ(.15, .45) : jzbZ(.45, 1.1);
      F.raketen.push({ x: jzbZ(J.w * (gross ? .08 : .3), J.w - 30), y: J.h, ziel: jzbZ(J.h * (gross ? .06 : .12), J.h * .42), v: jzbZ(120, 160) * Math.max(.7, k), farbe: jzbW(JZB_FEST_BUNT), gold: gross && Math.random() < .3 }); }
    for (const r of F.raketen) {
      r.y -= r.v * dt; r.x += Math.sin(r.y * .08) * 6 * dt;
      if (r.y <= r.ziel) { r.weg = true; const n = gross ? 34 : 22, zwei = Math.random() < .4 ? jzbW(JZB_FEST_BUNT) : r.farbe;
        for (let i = 0; i < n; i++) { const w = i / n * Math.PI * 2, v = jzbZ(35, 70) * Math.max(.7, k) * (gross ? 1.35 : 1);
          J.fx.push({ typ: "funke", x: r.x, y: r.y, vx: Math.cos(w) * v * (r.gold ? .6 : 1), vy: Math.sin(w) * v * (r.gold ? .6 : 1), s: jzbZ(1.8, 3.2), a: 1, farbe: r.gold ? (i % 2 ? "#ffd166" : "#fff1a8") : i % 2 ? r.farbe : zwei }); } }
    }
    F.raketen = F.raketen.filter((r) => !r.weg);
  } else if (J.saison === "wiesn") {
    if (F.schild < 0 && F.t > 24) F.schild = 0; if (F.schild >= 0) F.schild += dt;
    if (F.t > 19 && F.t < 25 && Math.random() < dt * 6) { const f = jzbWiesnFass(); F.spritzer.push({ x: f.kx + jzbZ(-6, 6) * k, y: f.ky - 22 * k, vx: jzbZ(-25, 25), vy: jzbZ(-40, -10), a: 1, r: jzbZ(1.2, 2.2) * k, schaum: true }); }
    for (const z of [[46, 60], [82, 96]]) if (F.t > z[0] && F.t < z[1] && !F.prost.includes(z[0])) { F.prost.push(z[0]); F.krug = { t: 0, klirr: false }; }
    if (F.krug) { const K = F.krug; K.t += dt;
      if (!K.klirr && K.t > 2.4) { K.klirr = true; const m = jzbWiesnKrugMitte();
        for (let i = 0; i < 14; i++) F.spritzer.push({ x: m + jzbZ(-4, 4), y: J.h - 26 * k, vx: jzbZ(-60, 60), vy: jzbZ(-120, -50), a: 1, r: jzbZ(1, 2.3) * k, schaum: i % 3 > 0 }); }
      if (K.t > 7) F.krug = null; }
  } else if (J.saison === "karneval") jzbKarnevalSchritt(F, dt);
  else if (J.saison === "halloween") jzbHalloweenSchritt(F, dt);
  else { // 🌴 Karibik
    if (!F.boot && (F.bootUhr -= dt) <= 0) { const dir = J.lauf % 2 ? -1 : 1; F.boot = { dir, x: dir > 0 ? -40 * k : J.w + 40 * k }; }
    if (F.boot) { F.boot.x += F.boot.dir * 13 * k * dt; if (F.boot.x < -60 * k || F.boot.x > J.w + 60 * k) { F.boot = null; F.bootUhr = jzbZ(15, 30); } }
    if (!F.gast && (F.gastUhr -= dt) <= 0 && F.t < JZB_FEST_DAUER - 10) {
      F.gast = Math.random() < .55 ? { typ: "papagei", dir: Math.random() < .5 ? 1 : -1, t: 0, y0: jzbZ(J.h * .25, J.h * .55) } : { typ: "fisch", x: jzbZ(J.w * .1, J.w * .5), t: 0, dir: Math.random() < .5 ? 1 : -1 }; }
    if (F.gast) { const g = F.gast; g.t += dt; if (g.typ === "papagei" ? g.t > (J.w + 80) / (55 * k) : g.t > 1.6) { F.gast = null; F.gastUhr = jzbZ(10, 20); } }
    if (!F.nuss && (F.nussUhr -= dt) <= 0) { const p = jzbPalme(); F.nuss = { x: p.kx + 4 * k, y: p.ky + 4 * k, vx: -jzbZ(8, 20) * k, vy: 0, lieg: 0 }; }
    if (F.nuss) { const n = F.nuss, boden = jzbKaribikSand(n.x) - 3.5 * k;
      if (n.lieg) { n.lieg += dt; n.x += n.vx * dt; n.vx *= 1 - 2 * dt; if (n.lieg > 7) { F.nuss = null; F.nussUhr = jzbZ(25, 45); } }
      else { n.vy += 300 * dt; n.x += n.vx * dt; n.y += n.vy * dt; if (n.y >= boden) { n.y = boden; if (n.vy > 60) n.vy = -n.vy * .35; else { n.lieg = .01; n.vx = -14 * k; } } }
      if (n.lieg) n.y = jzbKaribikSand(n.x) - 3.5 * k; }
    if (F.welle < 0 && F.t > 72) F.welle = 0; if (F.welle >= 0 && F.welle < 6) F.welle += dt;
  }
}
// ---- gemeinsame Teile ----
function jzbKetteY(x, y0, hang) { // Girlande in zwei Bögen über die Breite
  const J = JZB, a = JZB_RAND, b = J.w - JZB_RAND, m = (a + b) / 2, l = x < m ? a : m, r = x < m ? m : b, u = (x - l) / (r - l);
  return y0 + Math.sin(u * Math.PI) * hang;
}
function jzbHerzMalen(c, x, y0, k, t, gr = 1) { // 🧡 Lebkuchenherz mit Zuckerguss und dem eigenen Vornamen – hängt am Band und schaukelt · gr: Größe (2.617.0 Sim-Jü größer)
  const J = JZB, name = jzbEisNameText() || "Köcheclub", b = 16 * k * gr, w = Math.sin(J.T * 1.4 + 1) * (gr > 1 ? .04 : .07);
  c.save(); c.translate(x, y0); c.rotate(w);
  c.strokeStyle = "#c0392b"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 4 * k); c.stroke();
  c.translate(0, 4 * k + b * .2);
  const herz = () => { c.beginPath(); c.moveTo(0, b * .3); c.bezierCurveTo(-b * .1, b * .05, -b * 1.05, -b * .05, -b * .95, -b * .62);
    c.bezierCurveTo(-b * .85, -b * 1.12, -b * .15, -b * 1.05, 0, -b * .62); c.bezierCurveTo(b * .15, -b * 1.05, b * .85, -b * 1.12, b * .95, -b * .62);
    c.bezierCurveTo(b * 1.05, -b * .05, b * .1, b * .05, 0, b * .3); c.closePath(); };
  c.translate(0, b * .95); c.scale(1.18, 1.05);
  herz(); const g = c.createLinearGradient(0, -b, 0, b * .4); g.addColorStop(0, "#b8743a"); g.addColorStop(1, "#7a4319"); c.fillStyle = g; c.fill();
  c.setLineDash([1.6 * k, 2.2 * k]); c.lineCap = "round"; c.strokeStyle = "#fff"; c.lineWidth = 1.6 * k; c.save(); c.scale(.86, .86); c.translate(0, -b * .05); herz(); c.stroke(); c.restore(); c.setLineDash([]);
  c.fillStyle = "#ff8fb1"; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * b * .55, -b * .62, 1.8 * k, 0, 7); c.fill(); }
  const breit = gr > 1 ? 1.55 : 1.35; // 2.617.0: im großen Herz darf der Name breiter sein (besser lesbar)
  let fs = 8.5 * k * gr; c.font = `700 ${fs}px "Comic Sans MS","Segoe Print",cursive,sans-serif`; const tw = c.measureText(name).width;
  if (tw > b * breit) { fs *= b * breit / tw; c.font = `700 ${fs}px "Comic Sans MS","Segoe Print",cursive,sans-serif`; }
  c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 2 * k * Math.min(1.6, gr); c.strokeStyle = "rgba(122,67,25,.9)"; c.strokeText(name, 0, -b * .38); c.fillStyle = "#fffaf0"; c.fillText(name, 0, -b * .38);
  c.restore(); void t;
}
function jzbPfostenMalen(c, x, y, x1) { // Holzpfosten mit Querlatte unten links (dort ist unter dem Infofeld Platz) – daran hängen Herz und Brezn
  const J = JZB, k = J.k; c.fillStyle = "#7a4e26"; c.fillRect(x - 1.6 * k, y - 2 * k, 3.2 * k, J.h - y + 2 * k); c.fillRect(x - 1.6 * k, y - 2 * k, x1 - x, 2.6 * k);
  c.fillStyle = "#5a3818"; c.beginPath(); c.arc(x, y - 2 * k, 2 * k, 0, 7); c.fill();
}
const jzbStangeY = () => JZB.h - 37 * JZB.k;
function jzbBreznMalen(c, bx, by, k) {
  const bw = Math.sin(JZB.T * 1.6) * .1;
  c.save(); c.translate(bx, by); c.rotate(bw); c.strokeStyle = "#c0392b"; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 5 * k); c.stroke();
  c.translate(0, 15 * k); c.scale(.9, .9); c.strokeStyle = "#8a4a16"; c.lineWidth = 3.4 * k; c.lineCap = "round"; c.beginPath();
  c.moveTo(-3 * k, -9 * k); c.bezierCurveTo(-14 * k, -11 * k, -15 * k, 6 * k, -4 * k, 6 * k); c.bezierCurveTo(3 * k, 6 * k, 3 * k, -2 * k, 0, -2 * k);
  c.bezierCurveTo(-3 * k, -2 * k, -3 * k, 6 * k, 4 * k, 6 * k); c.bezierCurveTo(15 * k, 6 * k, 14 * k, -11 * k, 3 * k, -9 * k); c.stroke();
  c.fillStyle = "#fff"; for (let i = 0; i < 9; i++) c.fillRect(-11 * k + (i * 2.7 % 22) * k, -6 * k + (i * 5 % 11) * k, 1, 1); c.restore();
}
function jzbSpritzerMalen(c, F) {
  for (const s of F.spritzer) { c.globalAlpha = Math.max(0, s.a) * F.a; c.fillStyle = s.schaum ? "#fffdf2" : "#f2b632"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); }
  c.globalAlpha = F.a;
}
function jzbFestMalen(c) {
  const J = JZB, F = J.fest; if (!F) return;
  c.save(); c.globalAlpha = F.a;
  if (J.saison === "kirmes") jzbKirmesMalen(c, F); else if (J.saison === "wiesn") jzbWiesnMalen(c, F); else if (J.saison === "karneval") jzbKarnevalMalen(c, F); else if (J.saison === "halloween") jzbHalloweenMalen(c, F); else if (J.saison === "unterwasser") jzbUnterwasserMalen(c, F); else if (J.saison === "weltraum") jzbWeltraumMalen(c, F); else if (J.saison === "wildwest") jzbWildwestMalen(c, F); else if (J.saison === "wueste") jzbWuesteMalen(c, F); else if (J.saison === "baustelle") jzbBaustelleMalen(c, F); else if (J.saison === "seifenblasen") jzbSeifenblasenMalen(c, F); else if (J.saison === "bauernhof") jzbBauernhofMalen(c, F); else if (J.saison === "kegeln") jzbKegelnMalen(c, F); else jzbKaribikMalen(c, F);
  c.restore();
}
// ---------- KC-CLUB-ROSE (24.10.2026, Wunsch Hansi): einmalig eine rote Baccara-Rose aus der Sim-Jü-Schießbude – „Nur für dich“ ----------
// Wer sie bekommt, wählt der Admin per Häkchen in der Mitgliedskarte (rose_setzen) – die App kennt kein Geschlecht und rät nie nach Namen.
// Der Server sagt im Start nur „rose: true“ (Häkchen an, noch nicht bekommen). Sie kommt nach insgesamt 20 Sekunden sichtbarer Startseite (bis 2.652.0: 3 Minuten), nie über
// einem offenen Fenster oder beim Tippen. Läuft die Sim-Jü-Szene mit der Schießbude gerade sichtbar, fliegt sie aus der Schießbude; sonst (nach der Kirmes,
// „Sim-Jü aus“, Sparmodus) kommt sie von unten ins Bild mit „Ein Gruß aus der Schießbude – hab ich für dich auf der Sim-Jü geschossen“ (Änderung Hansi, 24.10. und 27.10.2026). Nach dem Zeigen merkt der Server es (rose_erhalten) – klappt das nicht, merkt es dieses Gerät und meldet es beim nächsten Start.
// Sparmodus oder „weniger Bewegung“: die Rose steht gleich da, ohne Flug. Nie zweimal auf demselben Gerät.
// KC-CLUB-ROSE-ANFANG
const ROSE_KEY = "kc_club_rose", ROSE_MS = 4500; // 2.714.0: ≈5 s (Takt 5 s – knapp darunter, sonst erst beim übernächsten Takt) // 2.653.0 KC-CLUB-ROSE-20S (Wunsch Hansi): 20 Sekunden statt 3 Minuten
// 2.714.0 KC-CLUB-ROSE-UEBERALL (Fund Hansi 27.10.2026 „sonst ist Sim-Jü vorbei und sie haben keine Rose“): Christina und Reinhilde öffnen die App
// über die Benachrichtigung direkt im Chat/Termin und kamen nie 20 s auf die Startseite. Jetzt: 5 s ruhiger Bildschirm auf JEDER Seite (kein offenes
// Fenster, in den letzten 4 s nicht getippt – ein Schreibfeld, das nur den Fokus hat, blockiert nicht mehr). Außerhalb der Startseite die Gruß-Variante.
const ROSE = { ms: 0, letzt: 0, gezeigt: false };
let ROSE_TIPP = 0; try { document.addEventListener("keydown", () => { ROSE_TIPP = Date.now(); }, true); document.addEventListener("input", () => { ROSE_TIPP = Date.now(); }, true); } catch {}
const roseLs = () => { try { return JSON.parse(localStorage.getItem(ROSE_KEY) || "null"); } catch { return null; } };
const roseLsSetzen = (w) => { try { localStorage.setItem(ROSE_KEY, JSON.stringify(w)); } catch {} };
const roseSzeneDa = () => !!(JZB.cv?.isConnected && JZB.saison === "kirmes" && JZB.imBild && JZB.w && jzSimJueZeit() && !SPAR?.an && jzbKirmesVariante() === "riesenrad"); // 2.654.0: nur wenn die Schießbude im Bild ist
function roseFrei() {
  const tippt = Date.now() - ROSE_TIPP < 4000; // 2.714.0: gerade getippt (nicht bloß Fokus im Schreibfeld)
  return !tippt && !document.querySelector(".blatt:not(.versteckt)") && !$("roseSchicht") && !RG?.an && !ES.offen;
}
function roseMelden() { // erst wenn sie gezeigt wurde; bei Fehler beim nächsten Start noch einmal
  const s = roseLs(); if (!s || s.gemeldet || !ICH || s.pid !== ICH.person_id) return;
  api("rose_erhalten").then(() => { roseLsSetzen({ ...s, gemeldet: true }); if (INIT) INIT.rose = false; }).catch(() => {});
}
function roseTakt() {
  const jetzt = Date.now(), d = ROSE.letzt ? Math.min(10000, jetzt - ROSE.letzt) : 0; ROSE.letzt = jetzt;
  if (!INIT?.rose || INIT._offline || !ICH || ROSE.gezeigt) return;
  const s = roseLs(); if (s && s.pid === ICH.person_id) { ROSE.gezeigt = true; return roseMelden(); } // auf diesem Gerät schon gezeigt
  if (document.hidden) return; // 2.714.0: jede sichtbare Seite zählt (vorher nur die Startseite)
  if ((ROSE.ms += d) < ROSE_MS || !roseFrei()) return; // nicht stören – warten, bis alles frei ist
  ROSE.gezeigt = true; roseLsSetzen({ pid: ICH.person_id, am: new Date().toISOString(), gemeldet: false });
  roseZeigen(ICH.vorname || String(ICH.name || "").split(" ")[0] || "", aktuelleAnsicht === "start" && roseSzeneDa() ? roseQuelle() : null); roseMelden(); // ohne Szene: Gruß-Variante
}
setInterval(() => { try { roseTakt(); } catch {} }, 5000);
function roseQuelle() { // Mitte der Schießbude im Kopfbild (siehe jzbSchiessbudeMalen)
  try { const r = JZB.cv.getBoundingClientRect(), k = JZB.k; return { x: r.left + JZB_RAND + 52 * k, y: r.top + JZB.h - 24 * k }; } catch { return null; }
}
function roseSvg() { // Baccara-Rose, halb geöffnet, leicht von der Seite; Stiel als sanft gebogene, nach oben dünner werdende Fläche
  const f = (n) => Math.round(n * 10) / 10;
  const S = [[100, 150], [116, 240], [80, 372], [97, 534]]; // Mittellinie des Stiels (sanftes S)
  const pkt = (t) => { const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * S[0][0] + b * S[1][0] + c * S[2][0] + d * S[3][0], a * S[0][1] + b * S[1][1] + c * S[2][1] + d * S[3][1]]; };
  const nor = (t) => { const p = pkt(Math.max(0, t - .01)), q = pkt(Math.min(1, t + .01)), dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l, dx / l, dy / l]; };
  const breite = (t) => 2 + 2.3 * t; // halbe Stielbreite: oben dünn, unten kräftig
  const links = [], rechts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, p = pkt(t), n = nor(t), w = breite(t); links.push(f(p[0] - n[0] * w) + " " + f(p[1] - n[1] * w)); rechts.unshift(f(p[0] + n[0] * w) + " " + f(p[1] + n[1] * w)); }
  const stiel = "M" + links.join("L") + "L" + rechts.join("L") + "Z";
  const kante = "M" + links.join("L");
  const dorn = (t, s) => { const p = pkt(t), n = nor(t), w = breite(t), bx = p[0] + s * n[0] * w * .8, by = p[1] + s * n[1] * w * .8;
    return `<path d="M${f(bx + n[2] * 3.5)} ${f(by + n[3] * 3.5)}Q${f(bx + s * n[0] * 4)} ${f(by + s * n[1] * 4 + 1)} ${f(bx + s * n[0] * 7.5 - n[2] * 4)} ${f(by + s * n[1] * 7.5 - n[3] * 4)}Q${f(bx + s * n[0] * 2)} ${f(by + s * n[1] * 2 - 2)} ${f(bx - n[2] * 3)} ${f(by - n[3] * 3)}Z" fill="url(#roDorn)"/>`; };
  const blatt = (x, y, w, dreh, id) => { // fein gesägter Rand, Mittelrippe, Seitenadern
    const z = []; for (let i = 1; i < 10; i++) { const q = i / 10; z.push([w * q, Math.sin(Math.PI * Math.pow(q, .75)) * w * .32]); }
    const oben = z.map((p) => `L${f(p[0] - w * .025)} ${f(-p[1] * .94)}L${f(p[0] + w * .01)} ${f(-p[1] - .6)}`).join(""), unten = z.slice().reverse().map((p) => `L${f(p[0] + w * .01)} ${f(p[1] + .6)}L${f(p[0] - w * .025)} ${f(p[1] * .94)}`).join("");
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${dreh})"><path d="M0 0${oben}L${w} 0${unten}Z" fill="url(#${id})" stroke="#173d14" stroke-width=".6" stroke-linejoin="round"/>`
      + `<path d="M0 0Q${f(w * .5)} ${f(-w * .04)} ${f(w * .95)} 0" fill="none" stroke="#b5e09a" stroke-width=".9" opacity=".6"/>${[.22, .42, .62, .8].map((q) => `<path d="M${f(w * q)} 0q${f(w * .08)} ${f(-w * .1)} ${f(w * .15)} ${f(-w * .2)}M${f(w * q)} 0q${f(w * .08)} ${f(w * .1)} ${f(w * .15)} ${f(w * .2)}" fill="none" stroke="#b5e09a" stroke-width=".55" opacity=".4"/>`).join("")}`
      + `<path d="M${f(w * .1)} ${f(-w * .08)}Q${f(w * .5)} ${f(-w * .3)} ${f(w * .85)} ${f(-w * .06)}" fill="none" stroke="#e6ffd0" stroke-width="1" opacity=".18"/></g>`; };
  const zweig = (t, s, lang, dreh) => { // Fiederblatt: Endblättchen und ein Paar Seitenblättchen am gebogenen Zweig
    const p = pkt(t), m = [p[0] + s * lang * .5, p[1] - 3], e = [p[0] + s * lang, p[1] + lang * .3], h = [(p[0] + 2 * m[0] + e[0]) / 4, (p[1] + 2 * m[1] + e[1]) / 4];
    return `<path d="M${f(p[0])} ${f(p[1])}Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}" fill="none" stroke="#2f6b28" stroke-width="1.8" stroke-linecap="round"/>`
      + blatt(h[0], h[1], 25, dreh - s * 55, "roBlatt2") + blatt(h[0], h[1], 24, dreh + s * 50, "roBlatt") + blatt(e[0], e[1], 38, dreh, "roBlatt"); };
  return `<svg class="rose-svg" viewBox="0 0 200 540" aria-hidden="true">
  <defs>
    <radialGradient id="roHinten" cx="50%" cy="85%" r="85%"><stop offset="0" stop-color="#1e0004"/><stop offset=".5" stop-color="#5e0313"/><stop offset="1" stop-color="#a3102a"/></radialGradient>
    <radialGradient id="roMitte" cx="50%" cy="90%" r="90%"><stop offset="0" stop-color="#2a0006"/><stop offset=".5" stop-color="#7a0619"/><stop offset="1" stop-color="#c0163a"/></radialGradient>
    <radialGradient id="roVorn" cx="50%" cy="100%" r="100%"><stop offset="0" stop-color="#2a0006"/><stop offset=".5" stop-color="#760518"/><stop offset=".85" stop-color="#a50d2a"/><stop offset="1" stop-color="#c01a38"/></radialGradient>
    <radialGradient id="roKern" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#c8183a"/><stop offset=".6" stop-color="#7e0619"/><stop offset="1" stop-color="#3a0009"/></radialGradient>
    <linearGradient id="roRand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5c76"/><stop offset=".4" stop-color="#d41f3f"/><stop offset="1" stop-color="#7a0519"/></linearGradient>
    <linearGradient id="roStiel" x1="0" x2="1"><stop offset="0" stop-color="#173f14"/><stop offset=".4" stop-color="#5aa443"/><stop offset=".6" stop-color="#3e8030"/><stop offset="1" stop-color="#143812"/></linearGradient>
    <linearGradient id="roKelch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a3c"/><stop offset="1" stop-color="#1c4d19"/></linearGradient>
    <linearGradient id="roDorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5a2a"/><stop offset="1" stop-color="#4a2410"/></linearGradient>
    <linearGradient id="roBlatt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f9a3c"/><stop offset="1" stop-color="#1f5a1f"/></linearGradient>
    <linearGradient id="roBlatt2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fae46"/><stop offset="1" stop-color="#245f22"/></linearGradient>
    <radialGradient id="roGlanz"><stop offset="0" stop-color="#ffb3c0" stop-opacity=".32"/><stop offset="1" stop-color="#ffb3c0" stop-opacity="0"/></radialGradient>
    <filter id="roSchatten" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2"/><feOffset dy="-2.5" result="b"/>
      <feFlood flood-color="#1a0004" flood-opacity=".85"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="roSamt" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .2 0" result="m"/><feComposite in="m" in2="SourceGraphic" operator="in" result="k"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="k"/></feMerge></filter>
  </defs>
  <path d="${stiel}" fill="url(#roStiel)"/>
  <path d="${kante}" fill="none" stroke="#9fd884" stroke-width=".7" opacity=".35"/>
  ${dorn(.2, 1)}${dorn(.3, -1)}${dorn(.44, 1)}${dorn(.6, -1)}${dorn(.74, 1)}${dorn(.88, -1)}
  ${zweig(.37, -1, 42, 200)}${zweig(.55, 1, 44, -20)}
  <g transform="rotate(-7 100 160)">
  <g filter="url(#roSamt)">
    <path d="M98 122C70 124 46 110 42 86C40 72 38 60 25 49C42 46 56 50 64 59C70 44 84 33 98 31Z" fill="url(#roHinten)"/>
    <path d="M101 122C129 124 152 108 156 84C158 70 162 59 175 50C159 47 145 50 137 58C131 43 117 32 101 30Z" fill="url(#roHinten)"/>
    <path d="M25 49C42 46 56 50 64 59C55 56 46 58 40 63C38 57 33 53 25 49Z M175 50C159 47 145 50 137 58C146 55 155 57 161 62C163 56 168 53 175 50Z" fill="url(#roRand)"/>
    <path d="M78 50C80 34 92 22 106 20C118 21 126 27 129 36C131 32 134 28 139 26C135 32 132 40 128 48C118 41 90 41 78 50Z" fill="url(#roHinten)"/>
    <path d="M129 36C131 32 134 28 139 26C135 32 133 37 131 42Z" fill="url(#roRand)"/>
    <path d="M80 45C86 31 96 23 106 22C116 23 124 29 128 38" fill="none" stroke="#ff6d85" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>
    <path d="M62 100C46 104 35 114 31 130C30 135 28 140 22 145C32 144 39 146 46 149C62 155 82 156 100 155C80 145 66 127 62 100Z" fill="url(#roHinten)"/>
    <path d="M139 100C155 104 166 114 170 130C171 135 173 140 179 144C169 144 162 146 155 149C139 155 119 156 101 155C121 145 135 127 139 100Z" fill="url(#roHinten)"/>
    <path d="M31 130C30 135 28 140 22 145C32 144 39 146 46 149C40 144 35 138 31 130Z M170 130C171 135 173 140 179 144C169 144 162 146 155 149C161 144 166 138 170 130Z" fill="url(#roRand)" opacity=".9"/>
    <path d="M36 124C38 114 48 106 60 102M165 124C163 114 153 106 141 102" fill="none" stroke="#ff6d85" stroke-width="1.1" opacity=".4"/>
    <path d="M76 54C76 80 88 100 102 106C116 100 128 80 128 54A26 10 0 0 0 76 54Z" fill="url(#roKern)"/>
    <ellipse cx="102" cy="53" rx="24" ry="8.5" fill="#2e0007"/>
    <path d="M79 54C81 45 95 41 109 43C120 45 126 49 126 55C118 49 104 47 92 51C86 53 82 55 79 54Z" fill="#b5122f"/>
    <path d="M85 57C89 49 103 47 114 51C108 51 100 53 95 59Z" fill="#d8264a"/>
    <path d="M118 56C118 50 110 47 103 49C109 51 112 54 112 58Z" fill="#8e0820"/>
    <path d="M89 57C91 50 99 47 108 48" fill="none" stroke="#ff7a90" stroke-width=".9" opacity=".6"/>
    <path d="M97 55C99 51 106 50 108 54C109 57 105 59 102 57C100 56 101 54 103 54" fill="none" stroke="#e0425f" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M76 55C82 63 94 66 104 66C116 66 124 62 128 55C122 59 112 61 102 61C92 61 82 59 76 55Z" fill="url(#roRand)"/>
    <path d="M75 60C73 80 82 98 100 105C92 92 88 76 90 62C86 60 80 59 75 60Z" fill="#6e0418" opacity=".8"/>
    <g filter="url(#roSchatten)">
      <path d="M101 124C78 124 61 107 61 85C61 72 64 62 57 53C68 52 77 56 82 63C84 79 90 95 101 106C104 112 104 118 101 124Z" fill="url(#roMitte)"/>
      <path d="M101 124C124 124 140 107 140 85C140 72 138 62 145 54C134 52 125 56 121 63C119 79 112 95 103 106C99 112 99 118 101 124Z" fill="url(#roMitte)"/>
      <path d="M57 53C68 52 77 56 82 63C76 60 69 60 63 63C62 59 60 56 57 53Z M145 54C134 52 125 56 121 63C127 60 134 60 140 63C141 59 142 57 145 54Z" fill="url(#roRand)"/>
    </g>
    <path d="M63 64C61 70 61 78 62 86M139 64C141 70 141 78 140 86" fill="none" stroke="#ff7088" stroke-width="1.2" stroke-linecap="round" opacity=".5"/>
    <g filter="url(#roSchatten)">
      <path d="M53 80C67 92 85 99 101 103C117 99 135 92 149 80C153 110 139 143 101 149C63 143 49 110 53 80Z" fill="url(#roVorn)"/>
      <path d="M53 80C67 92 85 99 101 103C117 99 135 92 149 80C152 76 156 74 161 73C154 80 149 89 143 96C132 105 118 109 110 110C106 111 103 113 101 116C99 113 96 111 92 110C84 109 70 105 59 96C53 89 47 80 40 73C45 74 50 76 53 80Z" fill="url(#roRand)"/>
    </g>
    <path d="M59 96C70 105 84 109 92 110C96 111 99 113 101 116C103 113 106 111 110 110C118 109 132 105 143 96" fill="none" stroke="#2a0006" stroke-width="1.2" opacity=".4"/>
    <path d="M60 86C72 95 88 101 101 103C114 101 130 95 142 86" fill="none" stroke="#ffa0b0" stroke-width="1.1" opacity=".6" stroke-linecap="round"/>
    <ellipse cx="88" cy="126" rx="36" ry="17" fill="url(#roGlanz)" opacity=".5"/>
    <path d="M68 114C72 130 84 141 98 145" fill="none" stroke="#ff7088" stroke-width="1" opacity=".25"/>
  </g>
  <path d="M98 148C84 151 68 160 55 180C68 167 84 159 100 155Z" fill="url(#roKelch)"/>
  <path d="M102 148C116 151 132 160 145 181C132 168 116 159 100 155Z" fill="url(#roKelch)"/>
  <path d="M99 150C91 160 85 175 82 194C89 178 95 166 102 156Z" fill="#2d6f27"/>
  <path d="M101 150C109 160 115 173 119 191C112 176 105 165 98 156Z" fill="#2a6a25"/>
  <path d="M98.5 151C96 166 97 183 101 202C104 183 104.5 166 101.5 151Z" fill="#3a8a30"/>
  <ellipse cx="100" cy="152" rx="7" ry="5" fill="url(#roKelch)"/>
  </g>
</svg>`;
}
function roseZeigen(name, quelle) { // quelle = Punkt der Schießbude; null = Gruß-Variante (Sim-Jü nicht sichtbar)
  $("roseSchicht")?.remove(); themaSchriftLaden("zart");
  const still = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })() || !!SPAR?.an || !document.body.animate;
  const s = document.createElement("div"); s.id = "roseSchicht"; s.className = "rose-schicht"; s.setAttribute("role", "dialog"); s.setAttribute("aria-label", "Eine Rose – nur für dich");
  const funken = still ? "" : Array.from({ length: 14 }, (_, i) => `<i class="rose-funke" style="--x:${(i * 37 + 11) % 100}%;--y:${(i * 53 + 7) % 70}%;--d:${1.6 + (i % 5) * .5}s;--v:${(i * .37) % 2.4}s"></i>`).join("")
    + Array.from({ length: 7 }, (_, i) => `<i class="rose-blatt" style="--x:${(i * 29 + 17) % 90 + 5}%;--d:${6 + (i % 3) * 2}s;--v:${2.2 + i * .9}s;--r:${(i % 2 ? 1 : -1) * (120 + i * 30)}deg"></i>`).join("");
  s.innerHTML = `<div class="rose-glanz"></div>${funken}<div class="rose-buehne"><div class="rose-flug">${roseSvg()}
    <div class="rose-schild"><span class="rose-faden"></span><div class="rose-karte"><b>Nur für dich</b>${name ? `<small>${esc(name)}</small>` : ""}</div></div></div></div>
    ${quelle ? "" : '<p class="rose-gruss">Ein Gruß aus der Schießbude –<br>hab ich für dich auf der Sim-Jü geschossen 🎯</p>'}<button type="button" class="knopf haupt rose-danke">💝 Danke</button>`;
  s.querySelector(".rose-danke").onclick = () => { if (still) return s.remove(); s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }).onfinish = () => s.remove(); };
  document.body.appendChild(s);
  if (!still) { // aus der Schießbude heraus wachsen und zur Mitte fliegen – ohne Schießbude von unten seitlich ins Bild
    const f = s.querySelector(".rose-flug"), r = f.getBoundingClientRect(), q = quelle || { x: innerWidth * .15, y: innerHeight * 1.5 };
    const dx = q.x - (r.left + r.width / 2), dy = q.y - (r.top + r.height * .85);
    f.animate(quelle ? [{ transform: `translate(${dx}px,${dy}px) scale(.06) rotate(-25deg)`, opacity: .2 }, { transform: `translate(${dx * .4}px,${dy * .55 - 60}px) scale(.45) rotate(10deg)`, opacity: 1, offset: .45 },
      { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 }] : [{ transform: `translate(${dx}px,${innerHeight}px) scale(.7) rotate(-30deg)`, opacity: .4 }, { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 }],
      { duration: 2600, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
    s.animate([{ background: "rgba(20,0,6,0)" }, { background: "rgba(20,0,6,.72)" }], { duration: 1200, fill: "backwards" });
  }
  setTimeout(() => { try { s.querySelector(".rose-danke").focus(); } catch {} }, still ? 50 : 2600);
  return s;
}
// KC-CLUB-ROSE-ENDE
// ---- 🎡 Sim-Jü ----
// 🎯 Schießbude: gestreiftes Dach, Schild, hinten laufen Enten und Sterne vorbei, vorn liegt ein Gewehr – ab und zu ein Treffer
function jzbSchiessbudeMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, x0 = JZB_RAND + 2 * k, bw = 100 * k, unten = J.h - 3 * k, oben = unten - 34 * k, theke = unten - 11 * k; // flach – bleibt unter dem Infofeld sichtbar
  c.save();
  c.fillStyle = "#3b2a5a"; c.fillRect(x0, oben, bw, theke - oben); // Rückwand
  c.fillStyle = "rgba(255,255,255,.08)"; for (let i = 0; i < 6; i++) c.fillRect(x0 + i * bw / 6, oben, bw / 12, theke - oben);
  // Enten und Sterne laufen auf einer Schiene von links nach rechts
  const schiene = theke - 9 * k; c.fillStyle = "#c9a227"; c.fillRect(x0 + 3 * k, schiene + 5.5 * k, bw - 6 * k, 1.4 * k);
  const tr = Math.floor(T / 4), trP = (T % 4) / 4; // alle 4 s ein Treffer – 2.620.0 (Wunsch Hansi): Figuren laufen langsamer, Treffer seltener
  for (let i = 0; i < 6; i++) {
    const p = ((T * 4.5 * k + i * bw / 6) % (bw - 10 * k)), x = x0 + 5 * k + p, ente = i % 2 === 0, getroffen = i === tr % 6 && trP < .55;
    c.save(); c.translate(x, schiene + 5 * k); if (getroffen) c.scale(1, Math.max(.15, 1 - trP * 3));
    if (ente) { c.fillStyle = "#ffd23f"; c.beginPath(); c.ellipse(0, -3.4 * k, 4.2 * k, 2.6 * k, 0, 0, 7); c.fill(); c.beginPath(); c.arc(3 * k, -6.4 * k, 1.9 * k, 0, 7); c.fill();
      c.fillStyle = "#ff8c00"; c.beginPath(); c.moveTo(4.6 * k, -6.6 * k); c.lineTo(6.8 * k, -6 * k); c.lineTo(4.6 * k, -5.6 * k); c.fill(); c.fillStyle = "#222"; c.fillRect(3.2 * k, -7.2 * k, .9 * k, .9 * k); }
    else { c.fillStyle = "#ffffff"; c.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 1.6 * k : 4 * k, a = -Math.PI / 2 + j * Math.PI / 5; c.lineTo(Math.cos(a) * r, -4 * k + Math.sin(a) * r); } c.closePath(); c.fill();
      c.fillStyle = "#e63946"; c.beginPath(); c.arc(0, -4 * k, 1.3 * k, 0, 7); c.fill(); }
    c.restore();
    if (getroffen && trP < .3) { c.fillStyle = `rgba(255,240,150,${1 - trP / .35})`; for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; c.beginPath(); c.arc(x + Math.cos(a) * (3 + trP * 22) * k, schiene + Math.sin(a) * (3 + trP * 22) * k, 1 * k, 0, 7); c.fill(); }
      c.font = `800 ${8 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.lineWidth = 2 * k; c.strokeStyle = "rgba(0,0,0,.6)"; c.strokeText("Treffer!", x, schiene - 12 * k - trP * 10 * k); c.fillStyle = "#fff"; c.fillText("Treffer!", x, schiene - 12 * k - trP * 10 * k); }
  }
  // Seitenpfosten, Theke, Gewehr mit Mündungsblitz
  c.fillStyle = "#8b5a2b"; c.fillRect(x0 - 2 * k, oben - 4 * k, 4 * k, unten - oben + 4 * k); c.fillRect(x0 + bw - 2 * k, oben - 4 * k, 4 * k, unten - oben + 4 * k);
  const tg = c.createLinearGradient(0, theke, 0, unten); tg.addColorStop(0, "#c0392b"); tg.addColorStop(1, "#7b1d14"); c.fillStyle = tg; c.fillRect(x0, theke, bw, unten - theke);
  c.fillStyle = "#ffd23f"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x0 + 6 * k + i * (bw - 12 * k) / 8, theke + 3 * k, 1.2 * k, 0, 7); c.fill(); } // Glühbirnen an der Theke
  c.fillStyle = "#5a3b1e"; c.fillRect(x0, theke - 1.6 * k, bw, 2.4 * k);
  const gx = x0 + bw * .62; c.save(); c.translate(gx, theke - 2 * k); c.rotate(-.06);
  c.fillStyle = "#6b4226"; c.fillRect(-14 * k, -2.4 * k, 12 * k, 3.4 * k); c.fillStyle = "#333"; c.fillRect(-3 * k, -1.8 * k, 18 * k, 1.6 * k); c.restore();
  if (trP < .08) { c.fillStyle = "rgba(255,220,100,.9)"; c.beginPath(); c.arc(gx + 16 * k, theke - 3 * k, 2.6 * k, 0, 7); c.fill(); }
  // Dach: rot-weiß gestreifte Markise mit Bögen, darüber das Schild
  const dy = oben - 4 * k, st = 9;
  for (let i = 0; i < st; i++) { const a = x0 - 4 * k + i * (bw + 8 * k) / st, b = (bw + 8 * k) / st; c.fillStyle = i % 2 ? "#ffffff" : "#e63946";
    c.beginPath(); c.moveTo(a, dy - 9 * k); c.lineTo(a + b, dy - 9 * k); c.lineTo(a + b, dy); c.quadraticCurveTo(a + b / 2, dy + 5 * k, a, dy); c.closePath(); c.fill(); }
  c.fillStyle = "#1d3557"; const sw = 70 * k, sx = x0 + bw / 2 - sw / 2, sh = 11 * k; c.fillRect(sx, dy - 9 * k - sh, sw, sh);
  c.strokeStyle = "#ffd23f"; c.lineWidth = 1 * k; c.strokeRect(sx + 1 * k, dy - 9 * k - sh + 1 * k, sw - 2 * k, sh - 2 * k);
  c.font = `800 ${7.5 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = Math.floor(T * 2) % 2 ? "#ffd23f" : "#fff3a0"; c.fillText("🎯 SCHIESSBUDE", x0 + bw / 2, dy - 9 * k - sh / 2 + .5 * k);
  c.restore(); void F;
}
// 2.654.0: die Szene bis 25.10.2026 (Schießbude, Herz, Riesenrad mit Lauflicht) – gespeichert für 2027 (JZB_KIRMES_JAHR)
function jzbKirmesRiesenradMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, R = Math.max(22, Math.min(50, J.h * .34)) * Math.max(.8, k), cx = J.w - R - 40, cy = J.h - R - 13 * k;
  if (jzbSimJueFeuerwerk()) { c.fillStyle = "rgba(8,12,40,.5)"; c.fillRect(0, 0, J.w, J.h); } // 2.617.0: Nachthimmel beim großen Feuerwerk
  // 2.336.0 (Wunsch Hansi „ganz oben nichts – keine Wimpel usw.“): die Lichterkette hängt jetzt als Deko an der Leiste (KC-CLUB-DEKO)
  const takt = Math.floor(T * 3.5);
  // Luftballons
  for (const b of F.ballons) {
    c.strokeStyle = "rgba(80,80,80,.6)"; c.lineWidth = .8; c.beginPath(); c.moveTo(b.x, b.y + 9 * k); c.quadraticCurveTo(b.x + Math.sin(b.ph * 2) * 4, b.y + 17 * k, b.x, b.y + 25 * k); c.stroke();
    c.fillStyle = b.farbe; c.beginPath(); c.ellipse(b.x, b.y, 6.5 * k, 8.5 * k, Math.sin(b.ph) * .1, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(b.x - 2.2 * k, b.y - 3 * k, 1.5 * k, 2.4 * k, -.4, 0, 7); c.fill();
    c.fillStyle = b.farbe; c.beginPath(); c.moveTo(b.x, b.y + 8 * k); c.lineTo(b.x - 1.6 * k, b.y + 10.5 * k); c.lineTo(b.x + 1.6 * k, b.y + 10.5 * k); c.fill();
  }
  // 2.617.0 KC-CLUB-SIMJUE-SCHIESSBUDE (Wunsch Hansi „Herz größer und mittig, Name lesbar, links eine Schießbude“): Schießbude links,
  // großes Lebkuchenherz in der Mitte – unten im Bodenstreifen, damit der Name nicht unter dem Infofeld liegt
  jzbSchiessbudeMalen(c, F);
  const hg = 1.8, hb = 16 * k * hg, hx = Math.max(JZB_RAND + 150 * k, J.w * .5), hy = J.h - 3 * k - 4 * k - 1.465 * hb;
  jzbPfostenMalen(c, hx - hb * 1.45, hy, hx + 1 * k); jzbHerzMalen(c, hx, hy, k, F.t, hg);
  // Riesenrad
  c.strokeStyle = "#5b6472"; c.lineWidth = 2.6 * k; c.lineCap = "round";
  c.beginPath(); c.moveTo(cx - R * .62, J.h - 2); c.lineTo(cx, cy); c.lineTo(cx + R * .62, J.h - 2); c.stroke();
  c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(cx - R * .34, cy + R * .55); c.lineTo(cx + R * .34, cy + R * .55); c.stroke();
  const th = T * .22, n = 8;
  c.strokeStyle = "rgba(235,235,245,.9)"; c.lineWidth = 1.1 * k;
  for (let i = 0; i < n * 2; i++) { const a = th + i / (n * 2) * Math.PI * 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke(); }
  c.strokeStyle = "#e9edf5"; c.lineWidth = 2.2 * k; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.lineWidth = 1 * k; c.beginPath(); c.arc(cx, cy, R * .82, 0, 7); c.stroke();
  // 2.618.0 KC-CLUB-SIMJUE-LAUFLICHT (Wunsch Hansi „Lauflichter an das Riesenrad“): bunte Lauflichter rund um den Kranz (Lichterpulk läuft im
  // Kreis, Farbe wechselt je Runde), Lichter auf den Speichen laufen von innen nach außen, an den Stützen läuft ein Licht hoch
  const LL = 36, lauf = T * 14, rund = Math.floor(lauf / LL), farben = ["#ffe066", "#ff4d6d", "#3ec1ff", "#7bed6f", "#c77dff"];
  for (let i = 0; i < LL; i++) {
    const a = th + i / LL * Math.PI * 2, d = ((lauf - i) % LL + LL) % LL, an = d < 6 || (i + takt) % 6 === 0, hell = d < 6 ? 1 - d / 6 : .55;
    const f = farben[(rund + (d < 6 ? 0 : i)) % farben.length], x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    if (an) { c.fillStyle = f; c.globalAlpha = hell; c.beginPath(); c.arc(x, y, (1.2 + hell) * k, 0, 7); c.fill();
      if (d < 3) { c.globalAlpha = hell * .35; c.beginPath(); c.arc(x, y, 4 * k, 0, 7); c.fill(); } c.globalAlpha = 1; }
    else { c.fillStyle = "rgba(255,220,160,.35)"; c.beginPath(); c.arc(x, y, 1 * k, 0, 7); c.fill(); }
  }
  for (let i = 0; i < 8; i++) { const a = th + i / 8 * Math.PI * 2, p = (T * 1.2 + i * .125) % 1; // Speichen: Licht läuft nach außen
    for (const q of [p, (p + .5) % 1]) { const r = R * (.15 + q * .78); c.fillStyle = farben[(i + Math.floor(T * 1.2)) % farben.length]; c.globalAlpha = .9 - q * .4;
      c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.1 * k, 0, 7); c.fill(); } }
  c.globalAlpha = 1;
  for (const sx of [-1, 1]) for (let j = 0; j < 6; j++) { const q = j / 6, an = Math.floor(T * 8) % 6 === (5 - j); // Stützen: Licht läuft hoch
    c.fillStyle = an ? "#fff3a0" : "rgba(255,210,140,.3)"; c.beginPath(); c.arc(cx + sx * R * .62 * (1 - q), J.h - 2 - (J.h - 2 - cy) * q, (an ? 1.5 : .9) * k, 0, 7); c.fill(); }
  for (let i = 0; i < n; i++) { // Gondeln hängen immer senkrecht und pendeln leicht
    const a = th + i / n * Math.PI * 2, gx = cx + Math.cos(a) * R, gy = cy + Math.sin(a) * R, p = Math.sin(T * 1.7 + i) * .08, gw = 9 * k, gh = 7 * k;
    c.save(); c.translate(gx, gy); c.rotate(p);
    c.strokeStyle = "#cfd5e0"; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 3 * k); c.stroke();
    c.fillStyle = JZB_FEST_BUNT[i % 6]; c.beginPath(); c.moveTo(-gw / 2, 3 * k); c.lineTo(gw / 2, 3 * k); c.lineTo(gw * .4, 3 * k + gh); c.lineTo(-gw * .4, 3 * k + gh); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(-gw * .3, 4 * k, gw * .6, 2 * k);
    c.restore();
  }
  c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(cx, cy, 3 * k, 0, 7); c.fill();
  // Raketen mit Leuchtspur (die Funken zeichnet die Bühne)
  for (const r of F.raketen) { c.strokeStyle = "rgba(255,230,160,.8)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x, r.y + 12 * k); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(r.x, r.y, 1.6, 0, 7); c.fill(); }
}
// ---- 2.654.0 KC-CLUB-SIMJUE-KARUSSELL (Wunsch Hansi 25.10.2026 „Rummelplatz umbauen: ein Kinderkarussell, das Herz bleibt in der Mitte, rechts eine
// Popcorn- und Zuckerwatte-Bude – alles schön mit Rummel-Beleuchtung, Lauflicht. Die jetzige Szene gespeichert für nächstes Jahr“) ----
// Links dreht sich ein Kinderkarussell (Pferdchen, Auto, Feuerwehr, Schwan – auf und ab, mit Kindern), Dach mit Zackenbehang und Lauflicht.
// In der Mitte das große Lebkuchenherz wie bisher. Rechts die Naschbude: Popcornmaschine mit hüpfenden Körnern, Zuckerwatte-Kessel, in dem die
// Watte am Stab wächst, Tüten und Watte auf der Theke, Schild mit umlaufendem Lauflicht. Die bisherige Szene (Schießbude + Riesenrad) bleibt als
// „riesenrad“ gespeichert und kommt 2027 wieder (JZB_KIRMES_JAHR). Alles nur Bild, aus der Zeit berechnet.
const JZB_KIRMES_JAHR = { 2027: "riesenrad" };
const jzbKirmesVariante = (d = new Date()) => JZB_KIRMES_JAHR[d.getFullYear()] || "karussell";
const JZB_LL_FARBEN = ["#ffe066", "#ff4d6d", "#3ec1ff", "#7bed6f", "#c77dff"];
function jzbLauflicht(c, punkte, k, T, schritt = 8, abstand = 4) { // Rummel-Lauflicht: jede 4. Birne hell, das Muster läuft weiter, Farbe wechselt je Runde
  const p = Math.floor(T * schritt), f = JZB_LL_FARBEN[Math.floor(p / punkte.length) % JZB_LL_FARBEN.length];
  punkte.forEach(([x, y], i) => { const an = (i + p) % abstand === 0;
    if (an) { c.fillStyle = f; c.globalAlpha = .35; c.beginPath(); c.arc(x, y, 3.2 * k, 0, 7); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(x, y, 1.6 * k, 0, 7); c.fill(); }
    else { c.fillStyle = "rgba(255,226,170,.55)"; c.beginPath(); c.arc(x, y, 1.05 * k, 0, 7); c.fill(); } });
}
function jzbKirmesBallons(c, F) {
  const k = JZB.k;
  for (const b of F.ballons) {
    c.strokeStyle = "rgba(80,80,80,.6)"; c.lineWidth = .8; c.beginPath(); c.moveTo(b.x, b.y + 9 * k); c.quadraticCurveTo(b.x + Math.sin(b.ph * 2) * 4, b.y + 17 * k, b.x, b.y + 25 * k); c.stroke();
    c.fillStyle = b.farbe; c.beginPath(); c.ellipse(b.x, b.y, 6.5 * k, 8.5 * k, Math.sin(b.ph) * .1, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(b.x - 2.2 * k, b.y - 3 * k, 1.5 * k, 2.4 * k, -.4, 0, 7); c.fill();
    c.fillStyle = b.farbe; c.beginPath(); c.moveTo(b.x, b.y + 8 * k); c.lineTo(b.x - 1.6 * k, b.y + 10.5 * k); c.lineTo(b.x + 1.6 * k, b.y + 10.5 * k); c.fill();
  }
}
function jzbKarussellFigur(c, typ, k, farbe) { // Figur im Ursprung (Füße/Boden bei y = 0), Blick nach rechts
  const kind = (x, y, mz) => { c.fillStyle = mz; c.fillRect(x - 2 * k, y - 5 * k, 4 * k, 5 * k); c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(x, y - 7.2 * k, 2.3 * k, 0, 7); c.fill();
    c.fillStyle = mz; c.beginPath(); c.arc(x, y - 8.2 * k, 2.4 * k, Math.PI, 0); c.fill(); };
  if (typ === "pferd") {
    c.fillStyle = farbe; c.beginPath(); c.ellipse(0, -6 * k, 7 * k, 3.4 * k, 0, 0, 7); c.fill(); // Rumpf
    c.beginPath(); c.moveTo(4.5 * k, -8 * k); c.lineTo(7.5 * k, -14 * k); c.lineTo(10 * k, -12.6 * k); c.lineTo(7 * k, -6 * k); c.closePath(); c.fill(); // Hals
    c.beginPath(); c.ellipse(9.6 * k, -13.4 * k, 2.8 * k, 1.6 * k, .4, 0, 7); c.fill(); // Kopf
    c.strokeStyle = farbe; c.lineWidth = 1.6 * k; c.lineCap = "round"; c.beginPath(); c.moveTo(-5 * k, -4 * k); c.lineTo(-7 * k, 0); c.moveTo(-3 * k, -4 * k); c.lineTo(-2 * k, 0); c.moveTo(3 * k, -4 * k); c.lineTo(5 * k, -1 * k); c.moveTo(5 * k, -4 * k); c.lineTo(7.5 * k, -2 * k); c.stroke();
    c.strokeStyle = "#e63946"; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(5.5 * k, -9 * k); c.lineTo(8 * k, -15 * k); c.stroke(); // Mähne/Zaum
    c.fillStyle = "#e63946"; c.fillRect(-2.6 * k, -10 * k, 5 * k, 1.6 * k); // Sattel
    c.strokeStyle = "#8b5a2b"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(-7 * k, -7 * k); c.quadraticCurveTo(-10 * k, -5 * k, -9 * k, -1 * k); c.stroke(); // Schweif
    kind(0, -9.6 * k, "#3a86ff");
  } else if (typ === "auto") {
    c.fillStyle = farbe; c.beginPath(); c.roundRect ? c.roundRect(-8 * k, -9 * k, 16 * k, 6 * k, 2 * k) : c.rect(-8 * k, -9 * k, 16 * k, 6 * k); c.fill();
    c.fillStyle = "#222"; for (const x of [-5 * k, 5 * k]) { c.beginPath(); c.arc(x, -2.6 * k, 2.4 * k, 0, 7); c.fill(); }
    c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(7.4 * k, -6.5 * k, 1 * k, 0, 7); c.fill();
    kind(-1 * k, -8 * k, "#ff9f1c"); c.strokeStyle = "#444"; c.lineWidth = 1 * k; c.beginPath(); c.arc(3 * k, -10 * k, 1.8 * k, 0, 7); c.stroke(); // Lenkrad
  } else if (typ === "feuerwehr") {
    c.fillStyle = "#d62828"; c.fillRect(-9 * k, -10 * k, 18 * k, 7 * k); c.fillRect(3 * k, -13 * k, 6 * k, 3 * k);
    c.fillStyle = "#cfd5e0"; c.fillRect(-8 * k, -12 * k, 9 * k, 1.2 * k); for (let i = 0; i < 4; i++) c.fillRect(-7.5 * k + i * 2.4 * k, -12.6 * k, .7 * k, 2 * k); // Leiter
    c.fillStyle = Math.floor(JZB.T * 4) % 2 ? "#3ec1ff" : "#1d3557"; c.fillRect(5 * k, -14.6 * k, 2.4 * k, 1.6 * k); // Blaulicht
    c.fillStyle = "#222"; for (const x of [-5.5 * k, 5.5 * k]) { c.beginPath(); c.arc(x, -2.6 * k, 2.4 * k, 0, 7); c.fill(); }
    kind(-1.5 * k, -10 * k, "#d62828");
  } else { // Schwan
    c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(-1 * k, -5.5 * k, 8 * k, 4 * k, 0, 0, 7); c.fill();
    c.strokeStyle = "#ffffff"; c.lineWidth = 2.4 * k; c.lineCap = "round"; c.beginPath(); c.moveTo(5 * k, -7 * k); c.quadraticCurveTo(10 * k, -10 * k, 7 * k, -15 * k); c.stroke();
    c.fillStyle = "#ff9f1c"; c.beginPath(); c.moveTo(7.5 * k, -15.5 * k); c.lineTo(10.5 * k, -14.6 * k); c.lineTo(7.5 * k, -14 * k); c.fill();
    c.fillStyle = "#e6e9f0"; c.beginPath(); c.ellipse(-3 * k, -7 * k, 4 * k, 2.2 * k, -.3, 0, 7); c.fill(); // Flügel
    kind(-2 * k, -8 * k, "#c77dff");
  }
}
const JZB_KARUSSELL_GROESSE = 1.35; // 2.654.0 (Wunsch Hansi „das Kinderkarussell etwas größer“)
function jzbKinderkarussellMalen(c, F) {
  const J = JZB, k = J.k * JZB_KARUSSELL_GROESSE, T = J.T, cx = JZB_RAND + 52 * k, unten = J.h - 3 * J.k, boden = unten - 10 * k, rx = 46 * k, ry = 7 * k;
  const krempe = unten - 33 * k, spitze = unten - 52 * k, dreh = T * .3; // eine Runde in gut 20 Sekunden (2.655.0 Wunsch Hansi „dreht sich zu schnell“, vorher gut 8 s)
  c.save();
  // Bodenplatte (Sockel, Holzdielen-Rand) – hinten zuerst
  c.fillStyle = "#7b4a2a"; c.beginPath(); c.ellipse(cx, boden + 2.5 * k, rx + 2 * k, ry + 1 * k, 0, 0, 7); c.fill();
  c.fillStyle = "#c98b4f"; c.beginPath(); c.ellipse(cx, boden, rx, ry, 0, 0, 7); c.fill();
  c.strokeStyle = "rgba(90,50,20,.35)"; c.lineWidth = .8; for (let i = 0; i < 12; i++) { const a = dreh + i / 12 * Math.PI * 2; c.beginPath(); c.moveTo(cx, boden); c.lineTo(cx + Math.cos(a) * rx, boden + Math.sin(a) * ry); c.stroke(); }
  // Figuren auf der Platte, je nach Tiefe sortiert (hinten = sin < 0 zuerst)
  const figuren = [["pferd", "#ffffff"], ["auto", "#3ec1ff"], ["pferd", "#8b5a2b"], ["feuerwehr", ""], ["pferd", "#f4d35e"], ["schwan", ""]].map(([typ, farbe], i) => {
    const a = dreh + i / 6 * Math.PI * 2, s = Math.sin(a); return { typ, farbe, i, x: cx + Math.cos(a) * rx * .72, y: boden + s * ry * .72, s, dir: Math.sin(a) >= 0 ? -1 : 1 }; }).sort((a, b) => a.s - b.s);
  const mitte = () => { // Mittelsäule mit Spiegelflächen
    const g = c.createLinearGradient(cx - 6 * k, 0, cx + 6 * k, 0); g.addColorStop(0, "#c9a227"); g.addColorStop(.5, "#fff3a0"); g.addColorStop(1, "#c9a227");
    c.fillStyle = g; c.fillRect(cx - 6 * k, krempe, 12 * k, boden - krempe);
    for (let j = 0; j < 4; j++) { c.fillStyle = j % 2 ? "#3ec1ff" : "#ff4d6d"; c.fillRect(cx - 4 * k, krempe + 3 * k + j * 6 * k, 8 * k, 4 * k); } };
  let saeule = false;
  for (const f of figuren) {
    if (!saeule && f.s >= 0) { mitte(); saeule = true; }
    const auf = Math.sin(T * 1.4 + f.i * 1.3) * (f.typ === "pferd" ? 3 : 1) * k, sc = .78 + .22 * (f.s + 1) / 2;
    c.strokeStyle = "#e9c46a"; c.lineWidth = 1.1 * k; c.beginPath(); c.moveTo(f.x, krempe + 4 * k); c.lineTo(f.x, f.y); c.stroke(); // Messingstange
    c.save(); c.translate(f.x, f.y - 3 * k + auf); c.scale(sc * f.dir, sc); c.globalAlpha = f.s < -.3 ? .85 : 1; jzbKarussellFigur(c, f.typ, k, f.farbe); c.restore();
  }
  if (!saeule) mitte();
  // Dach: Kegel mit bunten Bahnen, Krempe, Zackenbehang, Spitze mit Fähnchen
  const bahnen = 10;
  for (let i = 0; i < bahnen; i++) { const a0 = -Math.PI + i / bahnen * Math.PI, a1 = -Math.PI + (i + 1) / bahnen * Math.PI; // vordere Hälfte reicht für die Ansicht
    c.fillStyle = i % 2 ? "#ffffff" : "#e63946"; c.beginPath(); c.moveTo(cx, spitze); c.lineTo(cx + Math.cos(a0) * (rx + 3 * k), krempe - Math.sin(a0) * 0); c.lineTo(cx + Math.cos(a1) * (rx + 3 * k), krempe); c.closePath(); c.fill(); }
  c.fillStyle = "#1d3557"; c.beginPath(); c.ellipse(cx, krempe, rx + 4 * k, 3 * k, 0, 0, Math.PI); c.fill(); c.fillRect(cx - rx - 4 * k, krempe - 2.6 * k, (rx + 4 * k) * 2, 2.6 * k);
  const zacken = 14;
  for (let i = 0; i < zacken; i++) { const xa = cx - rx - 4 * k + i * (rx + 4 * k) * 2 / zacken, b = (rx + 4 * k) * 2 / zacken;
    c.fillStyle = i % 2 ? "#ffd23f" : "#e63946"; c.beginPath(); c.moveTo(xa, krempe + 1.5 * k); c.lineTo(xa + b, krempe + 1.5 * k); c.lineTo(xa + b / 2, krempe + 6.5 * k); c.closePath(); c.fill(); }
  c.strokeStyle = "#8b5a2b"; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(cx, spitze); c.lineTo(cx, spitze - 8 * k); c.stroke();
  c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(cx, spitze - 8 * k); c.lineTo(cx + 7 * k + Math.sin(T * 5) * 1.2 * k, spitze - 6.5 * k); c.lineTo(cx, spitze - 4.5 * k); c.closePath(); c.fill();
  // Lauflicht: an der Krempe, die Dachkanten hoch und unten um die Platte
  const ll = [];
  for (let i = 0; i <= 22; i++) ll.push([cx - rx - 3 * k + i * (rx + 3 * k) * 2 / 22, krempe - 1.3 * k]);
  jzbLauflicht(c, ll, k, T, 3, 4); // 2.658.0 Wunsch Hansi „Lauflicht am Karussell zu schnell“: 3 statt 9 Schritte je Sekunde
  const kante = []; for (let i = 1; i <= 7; i++) { const q = i / 8; kante.push([cx - (rx + 3 * k) * (1 - q), krempe - (krempe - spitze) * q]); } for (let i = 7; i >= 1; i--) { const q = i / 8; kante.push([cx + (rx + 3 * k) * (1 - q), krempe - (krempe - spitze) * q]); }
  jzbLauflicht(c, kante, k, T, 2.5, 3);
  const rand = []; for (let i = 0; i < 18; i++) { const a = i / 17 * Math.PI; rand.push([cx - Math.cos(a) * (rx + 1 * k), boden + Math.sin(a) * (ry + 1 * k) + 1.5 * k]); }
  jzbLauflicht(c, rand, k, T + .5, 3, 4);
  c.restore(); void F;
}
function jzbNaschbudeMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, bw = 108 * k, x1 = J.w - JZB_RAND - 2 * k, x0 = x1 - bw, unten = J.h - 3 * k, oben = unten - 36 * k, theke = unten - 12 * k;
  c.save();
  // Rückwand rosa mit Streifen
  c.fillStyle = "#ffd6e8"; c.fillRect(x0, oben, bw, theke - oben); c.fillStyle = "rgba(255,255,255,.45)"; for (let i = 0; i < 9; i++) c.fillRect(x0 + i * bw / 9, oben, bw / 18, theke - oben);
  // 🍿 Popcornmaschine links: rote Kiste mit Glas, Körner hüpfen, oben quillt es über
  const px = x0 + 8 * k, pw = 30 * k, py = oben + 3 * k, ph = theke - py - 1 * k;
  c.fillStyle = "#c1121f"; c.fillRect(px, py, pw, ph); c.fillStyle = "rgba(255,248,220,.85)"; c.fillRect(px + 2.5 * k, py + 4 * k, pw - 5 * k, ph - 9 * k);
  c.fillStyle = "#ffd23f"; c.fillRect(px - 1 * k, py - 1.5 * k, pw + 2 * k, 2.5 * k);
  c.fillStyle = "#fffbe6"; c.beginPath(); for (let i = 0; i < 9; i++) c.arc(px + 4 * k + i * (pw - 8 * k) / 8, py + ph - 6 * k - (i % 3) * .8 * k, 2.4 * k, 0, 7); c.fill(); // Popcornberg im Glas
  c.fillStyle = "#c9a227"; c.fillRect(px + pw / 2 - 4 * k, py + 4.5 * k, 8 * k, 3 * k); // Kessel
  for (let j = 0; j < 14; j++) { const p = (T * 1.25 + j * .137) % 1, sx = px + pw / 2 + Math.sin(j * 2.1) * (pw * .32) * p, sy = py + 7 * k - Math.sin(p * Math.PI) * 3 * k + p * (ph - 13 * k);
    c.fillStyle = j % 3 ? "#fffbe6" : "#ffe9a8"; c.beginPath(); c.arc(sx, sy, (1.1 + (j % 2) * .4) * k, 0, 7); c.fill(); }
  c.font = `800 ${4.6 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffd23f"; c.fillText("POPCORN", px + pw / 2, py + ph - 2.4 * k);
  // 🍭 Zuckerwatte rechts: silberner Kessel, darin dreht sich die Watte; am Stab wächst eine Wolke (alle 9 s neu)
  const zx = x1 - 20 * k, zy = theke - 2 * k, zr = 11 * k;
  c.fillStyle = "#aeb6c2"; c.beginPath(); c.ellipse(zx, zy - 5 * k, zr, 3.6 * k, 0, 0, 7); c.fill(); c.fillRect(zx - zr, zy - 5 * k, zr * 2, 5 * k);
  c.fillStyle = "#dfe4ea"; c.beginPath(); c.ellipse(zx, zy - 5 * k, zr - 1.5 * k, 2.6 * k, 0, 0, 7); c.fill();
  c.strokeStyle = "rgba(255,140,200,.75)"; c.lineWidth = .8 * k; for (let i = 0; i < 5; i++) { const a = T * 6 + i * 1.26; c.beginPath(); c.ellipse(zx, zy - 6 * k, (zr - 3 * k) * (.4 + i * .12), 1.6 * k, 0, a, a + 2.4); c.stroke(); }
  const w = (T % 9) / 9, wr = (2 + w * 7) * k, sx = zx + Math.sin(T * 1.3) * 1.5 * k;
  c.strokeStyle = "#f5f0e6"; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(sx, zy - 6 * k); c.lineTo(sx, zy - 6 * k - 11 * k); c.stroke();
  c.fillStyle = "rgba(255,150,205,.92)"; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + T; c.beginPath(); c.arc(sx + Math.cos(a) * wr * .45, zy - 6 * k - 9 * k + Math.sin(a) * wr * .4, wr * .62, 0, 7); c.fill(); }
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.arc(sx - wr * .3, zy - 16 * k - wr * .2, wr * .3, 0, 7); c.fill();
  c.font = `800 ${4.6 * k}px "Trebuchet MS",sans-serif`; c.fillStyle = "#c2185b"; c.fillText("ZUCKERWATTE", zx - 4 * k, oben + 4.5 * k);
  // Theke mit Glühbirnen, darauf Popcorn-Tüten und fertige Zuckerwatte
  const tg = c.createLinearGradient(0, theke, 0, unten); tg.addColorStop(0, "#ff4d8d"); tg.addColorStop(1, "#a3134f"); c.fillStyle = tg; c.fillRect(x0, theke, bw, unten - theke);
  c.fillStyle = "#5a3b1e"; c.fillRect(x0, theke - 1.6 * k, bw, 2.4 * k);
  for (let i = 0; i < 3; i++) { const tx = x0 + 44 * k + i * 7.5 * k, ty = theke - 1.6 * k; // Tüten rot-weiß gestreift
    c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(tx - 3 * k, ty - 9 * k); c.lineTo(tx + 3 * k, ty - 9 * k); c.lineTo(tx + 2.2 * k, ty); c.lineTo(tx - 2.2 * k, ty); c.closePath(); c.fill();
    c.fillStyle = "#e63946"; c.fillRect(tx - 1.6 * k, ty - 9 * k, 1.1 * k, 9 * k); c.fillRect(tx + .6 * k, ty - 9 * k, 1.1 * k, 9 * k);
    c.fillStyle = "#fffbe6"; for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(tx - 2 * k + j * 2 * k, ty - 10 * k - (j % 2) * k, 1.7 * k, 0, 7); c.fill(); } }
  for (const [vx, farbe] of [[x0 + 66 * k, "rgba(255,150,205,.95)"], [x0 + 74 * k, "rgba(150,205,255,.95)"]]) { // Watte im Ständer
    c.strokeStyle = "#f5f0e6"; c.lineWidth = .9 * k; c.beginPath(); c.moveTo(vx, theke - 1.6 * k); c.lineTo(vx, theke - 10 * k); c.stroke();
    c.fillStyle = farbe; c.beginPath(); c.arc(vx, theke - 13 * k, 4 * k, 0, 7); c.arc(vx - 2.4 * k, theke - 11 * k, 3 * k, 0, 7); c.arc(vx + 2.4 * k, theke - 11.4 * k, 3 * k, 0, 7); c.fill(); }
  jzbLauflicht(c, Array.from({ length: 13 }, (_, i) => [x0 + 5 * k + i * (bw - 10 * k) / 12, theke + 4 * k]), k, T, 3, 3); // Theke · 2.667.0 Wunsch Hansi: auch an der Bude langsamer (3 statt 8 Schritte je Sekunde)
  c.fillStyle = "#8b5a2b"; c.fillRect(x0 - 2 * k, oben - 4 * k, 4 * k, unten - oben + 4 * k); c.fillRect(x1 - 2 * k, oben - 4 * k, 4 * k, unten - oben + 4 * k);
  // Markise rosa-weiß mit Bögen, darüber das Schild mit umlaufendem Lauflicht
  const dy = oben - 4 * k, st = 10;
  for (let i = 0; i < st; i++) { const a = x0 - 4 * k + i * (bw + 8 * k) / st, b = (bw + 8 * k) / st; c.fillStyle = i % 2 ? "#ffffff" : "#ff5fa2";
    c.beginPath(); c.moveTo(a, dy - 9 * k); c.lineTo(a + b, dy - 9 * k); c.lineTo(a + b, dy); c.quadraticCurveTo(a + b / 2, dy + 5 * k, a, dy); c.closePath(); c.fill(); }
  const sw = 92 * k, sh = 13 * k, sx0 = x0 + bw / 2 - sw / 2, sy0 = dy - 9 * k - sh;
  c.fillStyle = "#3b1d5a"; c.fillRect(sx0, sy0, sw, sh);
  c.font = `800 ${7 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = Math.floor(T * 2) % 2 ? "#ffd23f" : "#fff3a0";
  c.fillText("🍿 POPCORN · ZUCKERWATTE 🍭", x0 + bw / 2, sy0 + sh / 2 + .5 * k);
  const rahmen = [], n = 16, m = 4; // Birnen rund um das Schild
  for (let i = 0; i < n; i++) rahmen.push([sx0 + i * sw / n, sy0 - 1 * k]); for (let i = 0; i < m; i++) rahmen.push([sx0 + sw + 1 * k, sy0 + i * sh / m]);
  for (let i = n; i > 0; i--) rahmen.push([sx0 + i * sw / n, sy0 + sh + 1 * k]); for (let i = m; i > 0; i--) rahmen.push([sx0 - 1 * k, sy0 + i * sh / m]);
  jzbLauflicht(c, rahmen, k, T, 4, 4); // 2.667.0: 4 statt 12
  c.restore(); void F;
}
// 2.667.0 KC-CLUB-SIMJUE-CLOWN (Wunsch Hansi „ab und an einen Luftballon-Verkäufer durch die Kirmes-Szene laufen lassen – ein Clown mit einem Strauß
// Luftballons; dann kommt ein kleines Mädchen und bekommt einen. Beim nächsten Mal ein Junge“): der Clown läuft von links bis vor das Herz und wartet,
// von rechts kommt das Kind, bekommt einen Ballon (er schwebt vom Strauß in die Hand) und hüpft damit davon; der Clown zieht weiter. Abwechselnd Mädchen/Junge.
// 2.670.0 KC-CLUB-CLOWN-PLATZEN (Wunsch Hansi): zwei kleine Geschichten im Wechsel mit dem normalen Lauf –
// 🎈 jedes 3. Mädchen: geht mit dem Ballon nach links weiter, bleibt stehen, lässt ihn los – er fliegt hoch und zerplatzt, das Mädchen weint,
//    der Clown kommt und schenkt ihr einen neuen; sie hüpft vor Freude und geht weiter.
// 😱 jeder 2. Junge: ruft „BUH!“ – der Clown lässt vor Schreck alle Ballons los, die fliegen hoch und zerplatzen nacheinander; der Clown weint,
//    geht nach links neue holen und kommt mit einem vollen Strauß zurück.
let JZB_CLOWN_N = 0, JZB_CLOWN_MAEDCHEN = 0, JZB_CLOWN_JUNGE = 0; const JZB_CLOWN_GR = 1.25; // Größe von Clown und Kind (Wunsch Hansi beim Karussell: „etwas größer“)
const JZB_CLOWN_FARBEN = ["#ff4d6d", "#ffd23f", "#3ec1ff", "#7bed6f", "#c77dff", "#ff9f1c"];
function jzbClownArt(n, maedchen, junge) { // → { kind, v }: abwechselnd Mädchen/Junge; jedes 3. Mädchen „platzen“, jeder 2. Junge „schreck“
  const kind = n % 2 ? "junge" : "maedchen";
  return { kind, v: kind === "maedchen" ? ((maedchen + 1) % 3 === 0 ? "platzen" : "normal") : ((junge + 1) % 2 === 0 ? "schreck" : "normal") };
}
function jzbPlopp() { // 🔊 kurzes „Peng“ beim Platzen (nur ⚙️ Ton an, nicht in der Ruhezeit)
  if (!einst("ton", true) || document.hidden) return;
  try { if (inRuheJetzt(INIT?.einstellungen?.ruhezeit)) return; } catch {}
  try {
    const A = audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.();
    const t0 = A.currentTime + .02, b = A.createBuffer(1, Math.floor(A.sampleRate * .12), A.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const q = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(); q.buffer = b; f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = .8;
    g.gain.setValueAtTime(.5, t0); q.connect(f); f.connect(g); g.connect(A.destination); q.start(t0);
  } catch { /* ohne Ton platzt es nur im Bild */ }
}
const JZB_CLOWN_TEMPO = 1.6; // 2.682.0 KC-CLUB-CLOWN-SCHNELLER (Wunsch Hansi „die Clown-Szene muss schneller ablaufen – dauert zu lange, bis was passiert“): alles 1,6-mal so schnell, kommt nach 1,5–3 s, danach alle 10–16 s
function jzbClownSchritt(F, dt) {
  const J = JZB, k = J.k * JZB_CLOWN_GR, boden = J.h - 3 * J.k;
  dt *= JZB_CLOWN_TEMPO;
  if (!F.clown) {
    if (F.clownUhr === undefined) F.clownUhr = jzbZ(1.5, 3);
    if ((F.clownUhr -= dt) <= 0 && F.t < JZB_FEST_DAUER - 28) {
      const a = jzbClownArt(JZB_CLOWN_N, JZB_CLOWN_MAEDCHEN, JZB_CLOWN_JUNGE);
      if (a.v !== "normal" && F.t > JZB_FEST_DAUER - 62) { F.clownUhr = Infinity; return; } // Geschichte passt nicht mehr in diesen Lauf → im nächsten
      JZB_CLOWN_N++; if (a.kind === "maedchen") JZB_CLOWN_MAEDCHEN++; else JZB_CLOWN_JUNGE++;
      F.clown = { x: -30 * k, ziel: J.w * .6, ph: "rein", uhr: 0, lauf: 0, kind: a.kind, v: a.v, kx: J.w + 16 * k, kRicht: -1, kLauf: 0, g: 0, hat: false, raus: 0, bi: 5, cRicht: 1,
        farben: JZB_CLOWN_FARBEN.slice(), frei: null, flug: [], pops: [] };
    }
    return;
  }
  const C = F.clown, v = 24 * k, kv = 30 * k, kZiel = C.ziel + 17 * k, ph = (p) => { C.ph = p; C.uhr = 0; };
  C.uhr += dt; C.cGeht = false; C.kGeht = false; C.kHuepf = false;
  const clownLauf = (r, f = 1) => { C.x += r * v * f * dt; C.lauf += dt; C.cGeht = true; C.cRicht = r; };
  const kindLauf = (r, f = 1, huepf) => { C.kx += r * kv * f * dt; C.kLauf += dt; C.kGeht = true; C.kRicht = r; C.kHuepf = !!huepf; };
  if (C.ph === "rein") { clownLauf(1); if (C.x >= C.ziel) { C.x = C.ziel; ph("warten"); } }
  if ((C.ph === "rein" || C.ph === "warten") && C.x > C.ziel - 70 * k) { // das Kind kommt, sobald der Clown fast da ist
    if (C.kx > kZiel) { C.kx = Math.max(kZiel, C.kx - kv * dt); C.kLauf += dt; C.kGeht = true; }
    else if (C.ph === "warten") { if (C.v === "schreck") ph("buh"); else { C.raus = 1; ph("geben"); } }
  }
  if (C.ph === "geben" && (C.g += dt / 1.6) >= 1) {
    C.g = 1; C.hat = true;
    if (C.v === "platzen" && C.bi === 5) ph("links"); else if (C.v === "platzen") ph("huepfen"); else { ph("weg"); C.kRicht = 1; }
  }
  if (C.ph === "weg") { clownLauf(1); C.kx += kv * 1.15 * dt; C.kLauf += dt; C.kGeht = true; C.kHuepf = C.hat; }
  // 🎈 Mädchen: nach links, stehen bleiben, loslassen, platzen, weinen, neuer Ballon, hüpfen, weiter
  if (C.ph === "links") { kindLauf(-1); if (C.kx <= J.w * .3) ph("stehen"); }
  if (C.ph === "stehen" && C.uhr > .9) { C.hat = false; C.frei = { x: C.kx - 2.5 * k, y: boden - 27 * k, t: 0, f: jzbClownStrauss(C, k)[5].f }; ph("loslassen"); }
  if (C.ph === "loslassen" && C.frei) {
    const b = C.frei; b.t += dt; b.y -= (14 + b.t * 22) * k * dt; b.x += Math.sin(b.t * 2) * 6 * k * dt;
    if (b.y < J.h * .16 || b.t > 3.5) { C.pops.push({ x: b.x, y: b.y, t: 0, f: b.f }); C.frei = null; jzbPlopp(); ph("weinen"); }
  }
  if (C.ph === "weinen") {
    if (C.x > C.kx + 22 * k) clownLauf(-1); else C.cRicht = -1;
    if (C.x <= C.kx + 22 * k && C.uhr >= 2) { C.kRicht = 1; C.raus = 2; C.bi = 4; C.g = 0; C.hat = false; ph("geben"); }
  }
  if (C.ph === "huepfen") { C.kHuepf = true; C.kLauf += dt; if (C.uhr > 1.4) ph("weiter"); }
  if (C.ph === "weiter") { kindLauf(-1, 1.15, true); clownLauf(1); if (C.kx < -24 * k && C.x > J.w + 40 * k) { F.clown = null; F.clownUhr = jzbZ(10, 16); } }
  // 😱 Junge: BUH! – alle Ballons fliegen weg und platzen nacheinander, der Clown weint und holt neue
  if (C.ph === "buh" && C.uhr > .9) { C.flug = jzbClownStrauss(C, k).map((b, i) => ({ x: C.x + 8 * k + b.dx, y: boden - 31 * k + b.dy, t: 0, f: b.f, i, weg: false })); C.raus = 6; ph("schreck"); }
  if (C.ph === "schreck" || C.ph === "clownweint" || C.ph === "holen") {
    for (const b of C.flug) if (!b.weg) { b.t += dt; b.y = Math.max(6 * k, b.y - (5 + b.t * 3) * k * dt); b.x += ((b.i - 2.5) * 5 + Math.sin(b.t * 2 + b.i) * 4) * k * dt; // auffächern, im Bild bleiben
      if (b.t >= 1.2 + b.i * .45) { b.weg = true; C.pops.push({ x: b.x, y: b.y, t: 0, f: b.f }); jzbPlopp(); } }
    if (C.uhr > .6 && C.kx < J.w + 24 * k) kindLauf(1, 1.5); // der Junge rennt kichernd davon
  }
  if (C.ph === "schreck" && C.flug.every((b) => b.weg) && C.uhr > 1.2 + 5 * .45 + .4) ph("clownweint");
  if (C.ph === "clownweint" && C.uhr > 2.4) ph("holen");
  if (C.ph === "holen") { clownLauf(-1, 1.1); if (C.x < -30 * k) ph("pause"); }
  if (C.ph === "pause" && C.uhr > 1.5) { C.raus = 0; C.flug = []; C.farben = JZB_CLOWN_FARBEN.slice().sort(() => Math.random() - .5); C.kx = J.w + 30 * k; ph("weg"); }
  for (const p of C.pops) p.t += dt;
  C.pops = C.pops.filter((p) => p.t < .6);
  if (C.ph === "weg" && C.x > J.w + 40 * k && C.kx > J.w + 20 * k) { F.clown = null; F.clownUhr = jzbZ(10, 16); }
}
function jzbBallonMalen(c, x, y, r, farbe) { // ein Luftballon (Mitte x/y), Faden nach unten zeichnet der Aufrufer
  c.fillStyle = farbe; c.beginPath(); c.ellipse(x, y, r * .78, r, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.ellipse(x - r * .28, y - r * .38, r * .18, r * .3, -.4, 0, 7); c.fill();
  c.fillStyle = farbe; c.beginPath(); c.moveTo(x, y + r * .95); c.lineTo(x - r * .2, y + r * 1.22); c.lineTo(x + r * .2, y + r * 1.22); c.fill();
}
function jzbClownStrauss(C, k) { // Lage der Ballons im Strauß relativ zur Hand
  return [[-7, -20], [0, -24], [7, -20], [-4, -15], [4, -15], [0, -19]].map(([dx, dy], i) => ({ dx: dx * k, dy: dy * k, f: C.farben[i % C.farben.length] }));
}
function jzbTraenen(c, augen, k, T) { // 💧 Tränen kullern (2.670.0)
  c.fillStyle = "#6ec6ff"; for (const [x, y] of augen) for (let i = 0; i < 2; i++) { const f = (T * 1.6 + i * .5) % 1; c.globalAlpha = 1 - f; c.beginPath(); c.ellipse(x + (i ? .6 : -.6) * k, y + f * 6 * k, .55 * k, .8 * k, 0, 0, 7); c.fill(); }
  c.globalAlpha = 1;
}
function jzbClownMalen(c, F) {
  const C = F?.clown; if (!C) return;
  const J = JZB, k = J.k * JZB_CLOWN_GR, T = J.T, boden = J.h - 3 * J.k, geht = !!C.cGeht, r = C.cRicht || 1;
  const weint = C.ph === "clownweint" || C.ph === "holen", schreck = C.ph === "schreck" && C.uhr < .7; // 2.670.0 KC-CLUB-CLOWN-PLATZEN
  const sw = geht ? Math.sin(C.lauf * 7) : 0, bob = geht ? Math.abs(Math.sin(C.lauf * 7)) * 1.2 * k : schreck ? Math.sin(C.uhr / .7 * Math.PI) * 6 * k : 0;
  if (C.x > -40 * k && C.x < J.w + 50 * k) {
  c.save(); c.translate(C.x, boden - bob); c.scale(r, 1); c.lineCap = "round";
  // Beine und große rote Schuhe
  c.strokeStyle = "#3a5bd9"; c.lineWidth = 3 * k;
  for (const s of [-1, 1]) { const fx = s * 3 * k + sw * s * 3 * k; c.beginPath(); c.moveTo(s * 2 * k, -10 * k); c.lineTo(fx, -1.5 * k); c.stroke();
    c.fillStyle = "#d62828"; c.beginPath(); c.ellipse(fx + 2.2 * k, -1.2 * k, 4.2 * k, 1.8 * k, 0, 0, 7); c.fill(); }
  // weiter Anzug, halb gelb, halb blau, mit Punkten
  c.fillStyle = "#ffd23f"; c.beginPath(); c.moveTo(-6.5 * k, -9 * k); c.lineTo(0, -9 * k); c.lineTo(0, -24 * k); c.lineTo(-4.5 * k, -24 * k); c.closePath(); c.fill();
  c.fillStyle = "#3ec1ff"; c.beginPath(); c.moveTo(6.5 * k, -9 * k); c.lineTo(0, -9 * k); c.lineTo(0, -24 * k); c.lineTo(4.5 * k, -24 * k); c.closePath(); c.fill();
  c.fillStyle = "#d62828"; for (const [px, py] of [[-3, -13], [-2, -19], [3, -16], [2.5, -21], [-4, -17], [4, -11.5]]) { c.beginPath(); c.arc(px * k, py * k, .9 * k, 0, 7); c.fill(); }
  c.fillStyle = "#fff"; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, -11.5 * k - i * 5 * k, .9 * k, 0, 7); c.fill(); } // Knöpfe
  // Halskrause
  c.fillStyle = "#ffffff"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 1.9 * k, -24.5 * k, 1.6 * k, 0, 7); c.fill(); }
  // linker Arm schwingt, rechter Arm hält den Strauß hoch
  c.strokeStyle = "#ffd23f"; c.lineWidth = 2.2 * k; c.beginPath(); c.moveTo(-4.5 * k, -22 * k); c.lineTo(-7.5 * k - sw * 1.5 * k, -14 * k); c.stroke();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(-7.5 * k - sw * 1.5 * k, -13.5 * k, 1.4 * k, 0, 7); c.fill();
  const hx = 8 * k, hy = -31 * k;
  c.strokeStyle = "#3ec1ff"; c.beginPath(); c.moveTo(4.5 * k, -22 * k); c.lineTo(hx, hy + 2 * k); c.stroke();
  // Kopf: weißes Gesicht, rote Nase, bunte Haare, kleiner Hut
  c.fillStyle = "#ff9f1c"; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 4.6 * k, -28.5 * k, 2.6 * k, 0, 7); c.fill(); }
  c.fillStyle = "#fdf3e7"; c.beginPath(); c.arc(0, -29 * k, 4.2 * k, 0, 7); c.fill();
  c.fillStyle = "#d62828"; c.beginPath(); c.arc(1.2 * k, -28.6 * k, 1.3 * k, 0, 7); c.fill();
  c.strokeStyle = "#d62828"; c.lineWidth = .9 * k; c.beginPath();
  if (weint || schreck) c.arc(1 * k, -24.6 * k, 2 * k, Math.PI + .5, -.5); else c.arc(1 * k, -27.4 * k, 2 * k, .25, Math.PI - .25); c.stroke(); // weint/erschrickt: Mund nach unten
  c.fillStyle = "#222"; c.beginPath(); c.arc(-.6 * k, -30.4 * k, schreck ? .8 * k : .5 * k, 0, 7); c.arc(2.6 * k, -30.4 * k, schreck ? .8 * k : .5 * k, 0, 7); c.fill();
  if (weint) jzbTraenen(c, [[-.6 * k, -29.6 * k], [2.6 * k, -29.6 * k]], k, T);
  c.fillStyle = "#2a9d8f"; c.beginPath(); c.moveTo(-3 * k, -32.4 * k); c.lineTo(3 * k, -32.4 * k); c.lineTo(.4 * k, -38 * k); c.closePath(); c.fill();
  c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(.4 * k, -38.3 * k, 1 * k, 0, 7); c.fill();
  // Strauß: Fäden von der Hand, Ballons wiegen sich
  const strauss = jzbClownStrauss(C, k).slice(0, 6 - (C.raus || 0)), wieg = Math.sin(T * 1.4) * 1.5 * k;
  c.strokeStyle = "rgba(80,80,80,.6)"; c.lineWidth = .7;
  for (const b of strauss) { c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + b.dx + wieg, hy + b.dy + 5 * k); c.stroke(); }
  for (const b of strauss) jzbBallonMalen(c, hx + b.dx + wieg, hy + b.dy, 4.6 * k, b.f);
  c.fillStyle = "#fff"; c.beginPath(); c.arc(hx, hy, 1.4 * k, 0, 7); c.fill();
  c.restore();
  if (schreck || (C.ph === "schreck" && C.uhr < 1.4)) { c.fillStyle = "#ffd23f"; c.font = `900 ${9 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.fillText("!", C.x - r * 9 * k, boden - bob - 34 * k); }
  }
  // Kind: kommt von rechts, bekommt den Ballon und hüpft davon
  const kGeht = !!C.kGeht, kHuepf = !!C.kHuepf, ksw = kGeht ? Math.sin(C.kLauf * 9) : 0;
  const kbob = kHuepf ? Math.abs(Math.sin(C.kLauf * (C.ph === "huepfen" ? 7 : 9))) * (C.ph === "huepfen" ? 5 : 2.6) * k : kGeht ? Math.abs(Math.sin(C.kLauf * 9)) * 1 * k : 0;
  const kHandX = C.kx - C.kRicht * -3.5 * k, kHandY = boden - kbob - 11 * k, ballon = jzbClownStrauss(C, k)[C.bi ?? 5];
  if (C.kx < J.w + 18 * k && C.kx > -20 * k) {
    c.save(); c.translate(C.kx, boden - kbob); c.scale(C.kRicht, 1); c.lineCap = "round";
    const m = C.kind === "maedchen";
    c.strokeStyle = "#f1c27d"; c.lineWidth = 1.6 * k; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 1.2 * k, -6 * k); c.lineTo(s * 1.2 * k + ksw * s * 1.6 * k, -.8 * k); c.stroke(); }
    c.fillStyle = m ? "#c1121f" : "#333"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 1.2 * k + ksw * s * 1.6 * k + .6 * k, -.6 * k, 1.5 * k, .8 * k, 0, 0, 7); c.fill(); }
    if (m) { c.fillStyle = "#ff8fc7"; c.beginPath(); c.moveTo(-4 * k, -5.5 * k); c.lineTo(4 * k, -5.5 * k); c.lineTo(2 * k, -13 * k); c.lineTo(-2 * k, -13 * k); c.closePath(); c.fill(); }
    else { c.fillStyle = "#1d3557"; c.fillRect(-2.6 * k, -8 * k, 5.2 * k, 3 * k); c.fillStyle = "#3a86ff"; c.fillRect(-2.8 * k, -13 * k, 5.6 * k, 5.4 * k); }
    const buh = C.ph === "buh", hoch = C.hat || C.ph === "geben" || C.ph === "stehen";
    c.strokeStyle = "#f1c27d"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(1.5 * k, -12 * k); c.lineTo(buh ? 3 * k : 3.5 * k, buh ? -19 * k : hoch ? -11 * k + (C.hat ? -2 * k : 0) : C.ph === "loslassen" && C.uhr < .8 ? -17 * k : -8 * k); c.stroke(); // Arm (Hand vorn)
    if (buh) { c.beginPath(); c.moveTo(-1.5 * k, -12 * k); c.lineTo(-3 * k, -19 * k); c.stroke(); } // „BUH!“ – beide Arme hoch
    c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(0, -15.5 * k, 2.6 * k, 0, 7); c.fill();
    if (m) { c.fillStyle = "#8d5524"; c.beginPath(); c.arc(0, -16.4 * k, 2.7 * k, Math.PI * .95, Math.PI * 2.05); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 3 * k, -14.6 * k, 1.2 * k, 0, 7); c.fill(); } }
    else { c.fillStyle = "#e63946"; c.beginPath(); c.arc(0, -16.3 * k, 2.7 * k, Math.PI, 0); c.fill(); c.fillRect(0, -16.6 * k, 4 * k, 1 * k); }
    c.fillStyle = "#222"; c.beginPath(); c.arc(1.2 * k, -15.8 * k, .4 * k, 0, 7); c.fill();
    if (C.ph === "weinen") { c.strokeStyle = "#7a3b1f"; c.lineWidth = .7 * k; c.beginPath(); c.arc(1.4 * k, -12.6 * k, 1 * k, Math.PI + .5, -.5); c.stroke(); jzbTraenen(c, [[1.4 * k, -15.4 * k]], k, T); }
    c.restore();
    if (C.ph === "buh") { // Sprechblase „BUH!“
      const bx = C.kx - 8 * k, by = boden - 30 * k; c.fillStyle = "#fff"; c.beginPath(); c.ellipse(bx, by, 9 * k, 5 * k, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(bx + 3 * k, by + 4 * k); c.lineTo(C.kx - 2 * k, boden - 21 * k); c.lineTo(bx + 6 * k, by + 3 * k); c.fill();
      c.fillStyle = "#c1121f"; c.font = `900 ${5.5 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("BUH!", bx, by + .3 * k);
    }
  }
  // der geschenkte Ballon: schwebt vom Strauß zur Hand des Kindes, dann mit dem Kind davon
  if (C.ph === "geben" || C.hat) {
    const cr = C.cRicht || 1, sx = C.x + cr * (8 * k + ballon.dx), sy = boden - 31 * k + ballon.dy, zx = kHandX + 1 * k, zy = kHandY - 16 * k, g = C.hat ? 1 : C.g, e = g * g * (3 - 2 * g);
    const bx = sx + (zx - sx) * e + (C.hat ? Math.sin(T * 2) * 1.5 * k : 0), by = sy + (zy - sy) * e - Math.sin(e * Math.PI) * 6 * k;
    const fx = C.hat ? kHandX : C.x + cr * 8 * k + (kHandX - C.x - cr * 8 * k) * e, fy = C.hat ? kHandY : boden - 31 * k + (kHandY - boden + 31 * k) * e;
    c.strokeStyle = "rgba(80,80,80,.6)"; c.lineWidth = .7; c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(bx + 2 * k, (fy + by) / 2, bx, by + 5.6 * k); c.stroke();
    jzbBallonMalen(c, bx, by, 4.6 * k, ballon.f);
  }
  // 2.670.0 KC-CLUB-CLOWN-PLATZEN: losgelassene Ballons steigen (Faden flattert), beim Platzen ein Stern mit „PENG!“
  for (const b of [C.frei, ...(C.flug || []).filter((x) => !x.weg)].filter(Boolean)) {
    c.strokeStyle = "rgba(80,80,80,.6)"; c.lineWidth = .7; c.beginPath(); c.moveTo(b.x, b.y + 5.6 * k); c.quadraticCurveTo(b.x + Math.sin(T * 6 + b.y) * 2 * k, b.y + 10 * k, b.x - 1 * k, b.y + 15 * k); c.stroke();
    jzbBallonMalen(c, b.x, b.y, 4.6 * k, b.f);
  }
  for (const p of C.pops || []) {
    const e = p.t / .6; c.save(); c.globalAlpha = 1 - e; c.strokeStyle = p.f; c.lineWidth = 1.4 * k;
    for (let i = 0; i < 8; i++) { const w = i / 8 * Math.PI * 2, r1 = (2 + e * 5) * k, r2 = (4 + e * 9) * k; c.beginPath(); c.moveTo(p.x + Math.cos(w) * r1, p.y + Math.sin(w) * r1); c.lineTo(p.x + Math.cos(w) * r2, p.y + Math.sin(w) * r2); c.stroke(); }
    c.fillStyle = "#fff"; c.font = `900 ${5 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PENG!", p.x, Math.max(4 * k, p.y - (8 + e * 4) * k)); c.restore();
  }
}
function jzbKirmesKarussellMalen(c, F) {
  const J = JZB, k = J.k;
  if (jzbSimJueFeuerwerk()) { c.fillStyle = "rgba(8,12,40,.5)"; c.fillRect(0, 0, J.w, J.h); }
  jzbKirmesBallons(c, F);
  jzbKinderkarussellMalen(c, F);
  const hg = 1.8, hb = 16 * k * hg, hx = Math.max(JZB_RAND + 150 * k, J.w * .5), hy = J.h - 3 * k - 4 * k - 1.465 * hb; // Herz bleibt in der Mitte
  jzbPfostenMalen(c, hx - hb * 1.45, hy, hx + 1 * k); jzbHerzMalen(c, hx, hy, k, F.t, hg);
  jzbNaschbudeMalen(c, F);
  jzbClownMalen(c, F); // 2.667.0 KC-CLUB-SIMJUE-CLOWN
  for (const r of F.raketen) { c.strokeStyle = "rgba(255,230,160,.8)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(r.x, r.y + 12 * k); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(r.x, r.y, 1.6, 0, 7); c.fill(); }
}
function jzbKirmesMalen(c, F) { if (F.vm) return jzbVmMalen(c, F); return jzbKirmesVariante() === "riesenrad" ? jzbKirmesRiesenradMalen(c, F) : jzbKirmesKarussellMalen(c, F); } // 2.682.0: Viehmarkt
// ---------- 2.682.0 KC-CLUB-VIEHMARKT (Wunsch Hansi „Morgen ist Vieh- und Krammarkt auf Sim-Jü – da sollten wir eine Szene bauen: links eine Kuh,
// ein Schwein und ein Käfig mit Hühnern, ein Bauer mit Kappe und Holzschuhen geht mit einem Pferd ab und an durchs Bild, andere Bauern begutachten
// die Tiere, um evtl. eins zu kaufen; rechts ein Marktstand mit Kurzwaren“). Nur am Sim-Jü-Dienstag (Vieh- und Krammarkt), im Wechsel mit der Kirmes-Szene.
// Ablauf (2 Min.): Händler und zwei Bauern feilschen um die Kuh – Handschlag, „Verkauft!“ –, danach um das Schwein; zwischendurch führt ein Bauer sein
// Pferd vorbei (klapp-klapp), am Kurzwarenstand ruft die Händlerin. Nur Bild, nichts wird gespeichert oder gesendet.
const jzbViehmarktTag = (d = new Date()) => themaFestZeit(d) === "simjue" && d.getDay() === 2;
// 2.682.0 (Hansi „ja, bau das so“): mit Ende – das Ferkel büxt aus (quer durch den Kurzwarenstand, Garn und Knöpfe fliegen, ein Holzschuh fliegt mit),
// die Händlerin fängt es mit einem Stoffband, ein Korn auf den Handel („Prost!“), dann werden Kuh und Schwein weggeführt, der Händler zählt sein Geld
// („Feierabend!“) und der Stand klappt zu. Schneller: es geht nach 2 s los, ein Lauf dauert 100 s.
const JZB_VM_DAUER = 115; // 2.717.0 KC-CLUB-VM-STIER: +15 s für den Stier (vorher 100)
// ---- 2.717.0 KC-CLUB-VM-STIER (Wunsch Hansi 27.10.2026 „in die Sim-Jü-Szene Krammarkt noch einen Stier mit großen Hörnern, der einen Ring durch die
// Nase hat und durchs Bild läuft mit schnaubenden Nasenlöchern – daraus wird wieder der Username“): nach dem Feierabend (Stand zu) trabt ab
// JZB_VM_STIER ein schwarzbrauner Stier von rechts herein, bleibt in der Mitte stehen und schnaubt; jede Dampfwolke aus den Nüstern schwebt nach oben
// und wird ein Buchstabe des Vornamens (ohne Namen: „Köcheclub“, wie bei der Friedenspfeife). Dann trabt er links hinaus, der Name verweht.
// Alles aus der Zeit im Lauf berechnet, nur Bild, nichts wird gespeichert oder gesendet.
const JZB_VM_STIER = 87, JZB_VM_ST_REIN = 6, JZB_VM_ST_STEHT = 20, JZB_VM_ST_RAUS = 7, JZB_VM_ST_WOLKE = 1.6;
const jzbVmStierTakt = () => Math.min(1.4, 8 / Math.max(1, jzbWwNameText().length));
const JZB_VM_REDEN = [ // [Sekunde, wer, Text] – wer: h = Händler, a = Bauer Anton, b = Bauer Bernd, f = Kurzwaren-Frau
  [2.5, "a", "Schöne Kuh!"], [5.5, "b", "Gibt die auch gut Milch?"], [8.5, "h", "Die beste vom Hof!"], [11.5, "a", "Wat soll se kosten?"], [14.5, "h", "900 Euro!"],
  [17.5, "a", "600 – mehr nicht!"], [20.5, "h", "Sagen wir 750?"], [23.5, "a", "Abgemacht!"], [27, "f", "Knöpfe, Garn, Gummiband!"],
  [31, "b", "Und dat Schwein?"], [34, "h", "Prima Ferkel, 200!"], [37, "b", "150 und 'nen Korn!"], [40, "h", "Na gut – Hand drauf!"],
  [47, "h", "Haltet dat Ferkel!"], [51, "f", "Huch – mein Garn!"], [57, "f", "Hab dich!"], [60, "b", "Danke, Frau!"],
  [66, "h", "Auf den Handel!"], [77, "f", "Feierabend für heute!"], [82, "h", "Feierabend!"],
];
const JZB_VM_HAND = [[26.5, "a"], [43.5, "b"]]; // Handschlag: Sekunde, wer mit dem Händler
const JZB_VM_AUS = 46, JZB_VM_GEFANGEN = 57, JZB_VM_PROST = 68, JZB_VM_ABGANG = 73, JZB_VM_ZU = 86; // Ferkel büxt aus · gefangen · Prost · Weggehen · Stand klappt zu
function jzbVmSchritt(F, dt) {
  const J = JZB, k = J.k, t = F.t;
  F.a = Math.min(1, t / 2, Math.max(0, (JZB_VM_DAUER - t) / 4));
  if (t >= JZB_VM_DAUER) { J.fest = null; return jzbLaufEnde(); }
  const P = jzbVmPlatz();
  const V = F.vmz || (F.vmz = { pferd: null, pferdUhr: jzbZ(4, 7), ax: -40 * k, bx: -50 * k, adir: 1, bdir: 1, sx: P.schwein, sdir: 1, sLauf: false, kx: P.kuh, kdir: 1, kLauf: false, teile: [], schuh: null, band: false });
  const hin = (x, ziel, v) => Math.abs(ziel - x) < v * dt ? ziel : x + Math.sign(ziel - x) * v * dt;
  // Ferkel: büxt aus → nach rechts durch den Stand → kehrt um → wird gefangen → folgt Bernd zurück → wird weggeführt
  const standL = P.stand - 42 * k, wende = Math.min(J.w - JZB_RAND - 6 * k, P.stand + 40 * k), fang = P.stand - 30 * k;
  let sZiel = P.schwein, sV = 0;
  if (t >= JZB_VM_AUS && t < JZB_VM_AUS + 6) { sZiel = wende; sV = 62 * k; }
  else if (t >= JZB_VM_AUS + 6 && t < JZB_VM_GEFANGEN) { sZiel = fang; sV = 46 * k; }
  else if (t >= JZB_VM_GEFANGEN + 3 && t < JZB_VM_ABGANG + 6) { sZiel = P.schwein; sV = 26 * k; }
  else if (t >= JZB_VM_ABGANG + 6) { sZiel = -80 * k; sV = 26 * k; }
  if (t >= JZB_VM_GEFANGEN) V.band = t < JZB_VM_GEFANGEN + 3; // die Händlerin hält es am Stoffband, bis Bernd es übernimmt
  const sAlt = V.sx; if (sV) V.sx = hin(V.sx, sZiel, sV); V.sLauf = Math.abs(V.sx - sAlt) > .01; if (V.sLauf) V.sdir = V.sx > sAlt ? 1 : -1;
  // 🧵 mitten durch den Stand: Garnrollen und Knöpfe fliegen
  if (t >= JZB_VM_AUS && t < JZB_VM_AUS + 6 && V.sx > standL && !V.krach) { V.krach = true; const farben = ["#c1121f", "#023e8a", "#2a9d8f", "#ffb703", "#6a4c93", "#f72585", "#fff"];
    for (let i = 0; i < 16; i++) V.teile.push({ x: P.stand + jzbZ(-20, 30) * k, y: J.h - 22 * k, vx: jzbZ(-60, 60) * k, vy: jzbZ(-110, -50) * k, r: jzbZ(.8, 1.6) * k, f: jzbW(farben), rund: Math.random() < .5, a: 1, liegt: 0 }); }
  const boden = J.h - 3 * k;
  for (const q of V.teile) { if (q.liegt) { q.liegt += dt; q.a = Math.max(0, 1 - (q.liegt - 6) / 2); continue; } q.vy += 260 * k * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.y >= boden - q.r) { q.y = boden - q.r; q.liegt = .01; } }
  V.teile = V.teile.filter((q) => q.a > 0);
  // Bauern: zuerst zum Handeln, bei der Jagd hinter dem Ferkel her, dann zurück, zum Schluss mit den Tieren nach links weg
  const ax0 = V.ax, bx0 = V.bx;
  if (t < JZB_VM_AUS + 1) { V.ax = hin(V.ax, P.anton, 40 * k); V.bx = hin(V.bx, P.bernd, 38 * k); }
  else if (t < JZB_VM_GEFANGEN) { V.ax = hin(V.ax, V.sx - 26 * k * V.sdir, 50 * k); V.bx = hin(V.bx, V.sx - 14 * k * V.sdir, 56 * k); }
  else if (t < JZB_VM_ABGANG) { V.ax = hin(V.ax, P.anton, 30 * k); V.bx = hin(V.bx, t < JZB_VM_GEFANGEN + 3 ? fang + 12 * k : P.bernd, 26 * k); }
  else { V.ax = hin(V.ax, -60 * k, 22 * k); if (t > JZB_VM_ABGANG + 6) V.bx = hin(V.bx, -60 * k, 24 * k); }
  V.aGeht = Math.abs(V.ax - ax0) > .01; V.bGeht = Math.abs(V.bx - bx0) > .01;
  V.adir = V.aGeht ? (V.ax > ax0 ? 1 : -1) : t >= JZB_VM_ABGANG ? -1 : -1; V.bdir = V.bGeht ? (V.bx > bx0 ? 1 : -1) : -1;
  if (t >= JZB_VM_GEFANGEN + 3 && t < JZB_VM_ABGANG + 6 && !V.bGeht) V.bdir = -1;
  // Kuh geht mit Anton weg (vor ihm, am Strick)
  if (t >= JZB_VM_ABGANG) { const k0 = V.kx; V.kx = Math.min(V.kx, V.ax - 22 * k); V.kLauf = V.kx < k0 - .01; V.kdir = -1; }
  // 👞 Bernd verliert bei der Jagd einen Holzschuh – hebt ihn auf, wenn er zurückkommt
  if (!V.schuh && t > JZB_VM_AUS + 3 && t < JZB_VM_AUS + 4) V.schuh = { x: V.bx, y: boden - 3 * k, vx: -40 * k, vy: -90 * k, dreh: 0, liegt: false };
  if (V.schuh && !V.schuh.liegt) { const q = V.schuh; q.vy += 260 * k * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.dreh += dt * 9; if (q.y >= boden - 1 * k) { q.y = boden - 1 * k; q.liegt = true; q.dreh = 0; } }
  if (V.schuh?.liegt && t > JZB_VM_GEFANGEN && Math.abs(V.bx - V.schuh.x) < 5 * k) V.schuh = null;
  // 🐴 Bauer mit Pferd: nur vor der Jagd (danach ist der Platz voll)
  if (!V.pferd && (V.pferdUhr -= dt) <= 0 && t < JZB_VM_AUS - 22) { const r = Math.random() < .5 ? 1 : -1; V.pferd = { x: r > 0 ? -60 * k : J.w + 60 * k, dir: r, ph: 0 }; }
  if (V.pferd) { const R = V.pferd; R.x += R.dir * 24 * k * dt; R.ph += dt; if ((R.dir > 0 && R.x > J.w + 70 * k) || (R.dir < 0 && R.x < -70 * k)) { V.pferd = null; V.pferdUhr = jzbZ(4, 8); } }
}
function jzbVmStierLage(t) { // Ort und Zustand des Stiers aus der Zeit: x, dir, geht, ph (Schritt), schnaubt (0…1)
  const J = JZB, k = J.k, s = t - JZB_VM_STIER, mitte = J.w * .68, rechts = J.w + 70 * k, links = -80 * k;
  if (s < 0 || s > JZB_VM_ST_STEHT + JZB_VM_ST_RAUS) return null;
  if (s < JZB_VM_ST_REIN) { const p = jzbEase(s / JZB_VM_ST_REIN); return { x: rechts + (mitte - rechts) * p, dir: -1, geht: p < .98, ph: s * 1.6, schnaubt: 0 }; }
  if (s < JZB_VM_ST_STEHT) { const z = (s - JZB_VM_ST_REIN) % 1.2; return { x: mitte, dir: -1, geht: false, ph: 0, schnaubt: z < .35 ? 1 - z / .35 : 0 }; }
  const p = (s - JZB_VM_ST_STEHT) / JZB_VM_ST_RAUS; return { x: mitte + (links - mitte) * p * p, dir: -1, geht: true, ph: s * 1.8, schnaubt: 0 };
}
function jzbVmStierMalen(c, x, y, k, dir, ph, schnaubt, T) { // 🐂 Stier: schwarzbraun, Buckel, große geschwungene Hörner, Messingring durch die Nase; Nüstern bei x + 29,5k
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = "round";
  const b = (i) => Math.sin(ph * 5 + i * Math.PI / 2) * 3;
  for (const [bx, i] of [[-13, 0], [-9, 2], [9, 1], [13, 3]]) { c.strokeStyle = "#2b160c"; c.lineWidth = 3.6; c.beginPath(); c.moveTo(bx, -17); c.lineTo(bx + b(i), -1.6); c.stroke();
    c.strokeStyle = "#111"; c.lineWidth = 3.8; c.beginPath(); c.moveTo(bx + b(i) - .8, -1.2); c.lineTo(bx + b(i) + 1.4, -1.2); c.stroke(); }
  const g = c.createLinearGradient(0, -32, 0, -12); g.addColorStop(0, "#5a3420"); g.addColorStop(1, "#2b160c");
  c.fillStyle = g; c.beginPath(); c.ellipse(0, -21, 18, 9.5, 0, 0, 7); c.fill(); // Rumpf
  c.beginPath(); c.ellipse(9, -27.5, 9, 6, -.2, 0, 7); c.fill(); // Buckel
  c.beginPath(); c.moveTo(12, -29); c.quadraticCurveTo(20, -30, 24, -27); c.lineTo(25, -18); c.quadraticCurveTo(18, -15, 13, -16); c.closePath(); c.fill(); // massiger Hals
  const nick = schnaubt * 1.2; // beim Schnauben senkt er kurz den Kopf
  c.save(); c.translate(0, nick);
  c.fillStyle = "#3d2214"; c.beginPath(); c.ellipse(24.5, -23.5, 6.6, 5.4, .35, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#7a5a4a"; c.beginPath(); c.ellipse(28.6, -20.4, 3.8, 3.1, .2, 0, 7); c.fill(); // Maul
  c.fillStyle = "#1a0d06"; const nr = .65 + schnaubt * .45; c.beginPath(); c.arc(30.4, -21.4, nr, 0, 7); c.arc(29.4, -19.6, nr * .9, 0, 7); c.fill(); // Nüstern (geweitet beim Schnauben)
  c.strokeStyle = "#e9c46a"; c.lineWidth = 1; c.beginPath(); c.arc(30.6, -17.9, 1.9, -1.2, 4.3); c.stroke(); c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = .4; c.beginPath(); c.arc(30.6, -17.9, 1.9, -.6, .4); c.stroke(); // Nasenring
  for (const [hx, cx, ex, w] of [[22, 13, 16, 2.6], [25.5, 33, 30, 2.2]]) { // zwei große Hörner, nach außen und oben geschwungen
    c.strokeStyle = "#efe3c2"; c.lineWidth = w; c.beginPath(); c.moveTo(hx, -27.5); c.quadraticCurveTo(cx, -31, ex, -39); c.stroke();
    c.strokeStyle = "#3b3226"; c.lineWidth = w * .8; c.beginPath(); c.moveTo(ex + (cx - ex) * .12, -38); c.lineTo(ex, -39.4); c.stroke(); }
  c.fillStyle = "#3d2214"; c.beginPath(); c.ellipse(19.5, -27, 2.6, 1.3, -.5, 0, 7); c.fill(); // Ohr
  c.fillStyle = "#fff"; c.beginPath(); c.arc(25.4, -25.6, 1.1, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(25.7, -25.6, .7, 0, 7); c.fill(); // grimmiges Auge
  c.strokeStyle = "#111"; c.lineWidth = .7; c.beginPath(); c.moveTo(23.8, -27.3); c.lineTo(26.8, -26.4); c.stroke(); // Braue
  c.restore();
  c.strokeStyle = "#2b160c"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-17.5, -24); c.quadraticCurveTo(-22, -18 + Math.sin((ph || T) * 3) * 2, -20, -8); c.stroke(); // Schwanz
  c.fillStyle = "#1a0d06"; c.beginPath(); c.ellipse(-20, -7, 1.6, 2.4, 0, 0, 7); c.fill(); // Quaste
  c.restore();
}
function jzbVmStierNameMalen(c, t, k, T, S, boden) { // Dampf aus den Nüstern → Buchstaben des Vornamens über der Bühne
  const J = JZB, z = jzbWwNameText(), takt = jzbVmStierTakt(), ab = JZB_VM_STIER + JZB_VM_ST_REIN + .6;
  const fs = Math.round(Math.max(11, Math.min(26 * k, (boden - 50 * k) * .7))), f = `700 ${fs}px Georgia, "Times New Roman", serif`;
  c.save(); c.font = f; const br = z.map((ch) => c.measureText(ch).width + 1.5 * k); const ges = br.reduce((a, v) => a + v, 0);
  let px = Math.max(JZB_RAND, Math.min(J.w - JZB_RAND - ges, J.w * .5 - ges / 2)); const pos = br.map((w) => { const m = px + w / 2; px += w; return m; });
  const ly = Math.max(fs * .9 + 2, boden - 58 * k), weht = Math.max(0, t - (JZB_VM_STIER + JZB_VM_ST_STEHT)), aus = Math.max(0, 1 - weht / 3);
  const nx = S ? S.x + S.dir * 30 * k * 1.25 : 0, ny = boden - 20.5 * k * 1.25;
  c.textAlign = "center"; c.textBaseline = "alphabetic";
  z.forEach((ch, i) => {
    const d = t - (ab + i * takt); if (d < 0) return;
    if (d < JZB_VM_ST_WOLKE + .1 && S) { // Dampfwolke aus den Nüstern schwebt an ihren Platz
      const p = jzbEase(Math.min(1, d / JZB_VM_ST_WOLKE)), x = nx + (pos[i] - nx) * p, y = ny + (ly - fs * .35 - ny) * p - Math.sin(p * Math.PI) * 10 * k, r = 2 * k + p * fs * .14;
      const a = (.6 - p * .25) * (d > JZB_VM_ST_WOLKE - .3 ? (JZB_VM_ST_WOLKE + .1 - d) / .4 : 1);
      for (const [ox, oy, rr] of [[0, 0, 1], [-.7, .3, .75], [.7, .35, .7], [0, -.6, .65]]) { c.fillStyle = `rgba(245,245,245,${a})`; c.beginPath(); c.arc(x + ox * r, y + oy * r, rr * r, 0, 7); c.fill(); }
    }
    const sicht = Math.min(1, Math.max(0, (d - (JZB_VM_ST_WOLKE - .3)) / 1)) * aus; if (sicht <= 0) return;
    c.shadowColor = "rgba(255,255,255,.9)"; c.shadowBlur = 6 * k; c.fillStyle = `rgba(250,250,250,${.9 * sicht})`;
    c.fillText(ch, pos[i] + Math.sin(T * 1.3 + i * 1.7) * .8 * k + weht * (14 + i * 2) * k, ly + Math.cos(T * 1.1 + i) * .6 * k - weht * (5 + i % 3 * 2) * k); c.shadowBlur = 0;
  });
  c.restore();
}
function jzbVmPlatz() { // Stellplätze (links Tiere, Mitte Händler und Bauern, rechts Stand) – passt sich der Breite an
  const J = JZB, k = J.k, l = JZB_RAND + 4 * k;
  const kuh = l + 20 * k, schwein = kuh + 52 * k, kaefig = schwein + 36 * k, haendler = kaefig + 32 * k;
  return { kuh, schwein, kaefig, haendler, anton: haendler + 17 * k, bernd: haendler + 31 * k, stand: Math.max(haendler + 95 * k, J.w - JZB_RAND - 62 * k) };
}
function jzbVmBauerMalen(c, x, y, k, dir, o = {}) { // 👨‍🌾 Bauer: Schirmmütze, blauer Kittel, Holzschuhe; o.geht, o.ph, o.arm ("zeigt"|"kinn"|"hand"|"seil"|"stock"), o.schuett (Handschlag)
  const sw = o.geht ? Math.sin(o.ph * 7) : 0, bob = o.geht ? Math.abs(Math.sin(o.ph * 7)) * .9 * k : 0;
  c.save(); c.translate(x, y - bob); c.scale(dir, 1); c.lineCap = "round";
  c.strokeStyle = "#4a3b2a"; c.lineWidth = 2.6 * k; // Hose
  for (const s of [-1, 1]) { const fx = s * 2.2 * k + sw * s * 3 * k; c.beginPath(); c.moveTo(s * 1.6 * k, -12 * k); c.lineTo(fx, -2.2 * k); c.stroke();
    c.fillStyle = "#d4a24c"; c.strokeStyle = "#8a5f22"; c.lineWidth = .7 * k; c.beginPath(); c.moveTo(fx - 2.4 * k, -.2 * k); c.lineTo(fx - 2.2 * k, -2.6 * k); c.lineTo(fx + 2 * k, -2.6 * k);
    c.quadraticCurveTo(fx + 4.6 * k, -2 * k, fx + 4.4 * k, -.2 * k); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = "#4a3b2a"; c.lineWidth = 2.6 * k; } // Holzschuhe
  c.fillStyle = o.farbe || "#2b4c7e"; c.beginPath(); c.moveTo(-5.4 * k, -10.5 * k); c.lineTo(5.4 * k, -10.5 * k); c.lineTo(4 * k, -25 * k); c.lineTo(-4 * k, -25 * k); c.closePath(); c.fill(); // Kittel
  c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = .6 * k; c.beginPath(); c.moveTo(0, -24 * k); c.lineTo(0, -11 * k); c.stroke();
  // Arme
  const arm = (x0, y0, x1, y1, hand = true) => { c.strokeStyle = o.farbe || "#2b4c7e"; c.lineWidth = 2.2 * k; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    if (hand) { c.fillStyle = "#e9b98f"; c.beginPath(); c.arc(x1, y1, 1.3 * k, 0, 7); c.fill(); } };
  arm(-3.6 * k, -23 * k, -5.5 * k - sw * 2 * k, -14 * k); // hinterer Arm hängt
  const sch = o.schuett ? Math.sin(o.schuett * 18) * 1.6 * k : 0;
  if (o.arm === "zeigt") arm(3.6 * k, -23 * k, 10 * k, -21 * k);
  else if (o.arm === "kinn") arm(3.6 * k, -23 * k, 3 * k, -28 * k);
  else if (o.arm === "hand") arm(3.6 * k, -22 * k, 9.5 * k, -17 * k + sch);
  else if (o.arm === "seil") arm(3.6 * k, -22 * k, 8 * k, -17 * k);
  else if (o.arm === "prost") { arm(3.6 * k, -23 * k, 7.5 * k, -29 * k); c.fillStyle = "rgba(230,240,245,.9)"; c.fillRect(6.4 * k, -33 * k, 2.4 * k, 3.6 * k); c.fillStyle = "rgba(255,250,220,.85)"; c.fillRect(6.7 * k, -31.6 * k, 1.8 * k, 1.8 * k); }
  else if (o.arm === "geld") { const w = Math.sin(JZB.T * 12) * 1.2 * k; arm(3.6 * k, -23 * k, 7 * k, -27 * k + w); c.fillStyle = "#8d6a3a"; c.beginPath(); c.ellipse(7.5 * k, -24.5 * k + w, 2.6 * k, 3 * k, 0, 0, 7); c.fill();
    c.fillStyle = "#ffd166"; c.font = `800 ${4.4 * k}px sans-serif`; c.textAlign = "center"; c.fillText("€", 7.5 * k, -23.2 * k + w); }
  else if (o.arm === "stock") { arm(3.6 * k, -22 * k, 7 * k, -16 * k); c.strokeStyle = "#7a5230"; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(7 * k, -22 * k); c.lineTo(8.5 * k, 0); c.stroke(); }
  else arm(3.6 * k, -23 * k, 5.5 * k + sw * 2 * k, -14 * k);
  // Kopf mit Schirmmütze
  c.fillStyle = "#e9b98f"; c.beginPath(); c.arc(.6 * k, -28.6 * k, 3.6 * k, 0, 7); c.fill();
  if (o.bart) { c.strokeStyle = "#6b5a45"; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(1.8 * k, -27 * k); c.quadraticCurveTo(3 * k, -26 * k, 4.2 * k, -27.2 * k); c.stroke(); }
  c.fillStyle = "#222"; c.beginPath(); c.arc(2.4 * k, -29.4 * k, .5 * k, 0, 7); c.fill();
  c.fillStyle = o.kappe || "#3d3d3d"; c.beginPath(); c.ellipse(.2 * k, -31.4 * k, 4.2 * k, 2.2 * k, 0, Math.PI, 0); c.fill(); c.fillRect(-4 * k, -31.6 * k, 8.4 * k, 1.2 * k);
  c.beginPath(); c.ellipse(5 * k, -31 * k, 3.2 * k, .9 * k, .1, 0, 7); c.fill(); // Schirm nach vorn
  if (o.pfeife) { c.strokeStyle = "#5a3818"; c.lineWidth = .9 * k; c.beginPath(); c.moveTo(3.6 * k, -27 * k); c.lineTo(6 * k, -26.4 * k); c.stroke(); c.fillStyle = "#5a3818"; c.fillRect(5.6 * k, -28.4 * k, 1.6 * k, 2.2 * k);
    const pf = (JZB.T * .6) % 1; c.fillStyle = `rgba(200,200,200,${.5 * (1 - pf)})`; c.beginPath(); c.arc(6.6 * k + pf * 2 * k, -30 * k - pf * 7 * k, (1 + pf * 1.6) * k, 0, 7); c.fill(); }
  c.restore();
}
function jzbVmPferdMalen(c, x, y, k, dir, ph) { // 🐴 Haflinger (goldbraun, helle Mähne) im Schritt, Blick in Laufrichtung; Kopf bei x + 24k
  c.save(); c.translate(x, y); c.scale(dir * k, k); c.lineCap = "round";
  const b = (i) => Math.sin(ph * 5 + i * Math.PI / 2) * 3;
  c.strokeStyle = "#a86f2c"; c.lineWidth = 2.6; for (const [bx, i] of [[-12, 0], [-9, 2], [9, 1], [12, 3]]) { c.beginPath(); c.moveTo(bx, -16); c.lineTo(bx + b(i), -1.5); c.stroke();
    c.strokeStyle = "#222"; c.lineWidth = 2.8; c.beginPath(); c.moveTo(bx + b(i) - .6, -1.2); c.lineTo(bx + b(i) + 1.4, -1.2); c.stroke(); c.strokeStyle = "#a86f2c"; c.lineWidth = 2.6; }
  const g = c.createLinearGradient(0, -28, 0, -12); g.addColorStop(0, "#d99a4e"); g.addColorStop(1, "#a86f2c");
  c.fillStyle = g; c.beginPath(); c.ellipse(0, -20, 15, 7, 0, 0, 7); c.fill(); // Rumpf
  c.beginPath(); c.moveTo(10, -24); c.quadraticCurveTo(16, -36, 21, -37); c.lineTo(25, -34); c.quadraticCurveTo(19, -30, 15, -18); c.closePath(); c.fill(); // Hals
  c.beginPath(); c.ellipse(24.5, -34, 5.4, 3, .5, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#f3e2b3"; c.beginPath(); c.moveTo(11, -26); c.quadraticCurveTo(15, -37, 21, -38.5); c.lineTo(20, -36); c.quadraticCurveTo(15, -33, 13, -24); c.fill(); // Mähne
  c.fillStyle = "#a86f2c"; c.beginPath(); c.moveTo(20.5, -38.5); c.lineTo(21.5, -42); c.lineTo(23, -38); c.fill(); // Ohr
  c.strokeStyle = "#f3e2b3"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-15, -22); c.quadraticCurveTo(-21, -18 + Math.sin(ph * 3) * 2, -19, -9); c.stroke(); // Schweif
  c.fillStyle = "#111"; c.beginPath(); c.arc(25, -35.6, .7, 0, 7); c.fill();
  c.strokeStyle = "#c1121f"; c.lineWidth = .9; c.beginPath(); c.moveTo(21, -36.5); c.lineTo(27.5, -32); c.moveTo(22.5, -32.5); c.lineTo(25, -37.5); c.stroke(); // Halfter
  c.restore();
}
function jzbVmKaefigMalen(c, x, y, k, T) { // 🐔 Holzkäfig mit zwei Hühnern
  const b = 30 * k, h = 17 * k, l = x - b / 2;
  c.fillStyle = "#c69c6d"; c.fillRect(l, y - h, b, h); c.fillStyle = "rgba(60,35,15,.35)"; c.fillRect(l, y - h, b, h);
  jzbBhHuhnMalen(c, x - 6 * k, y - 2 * k, k * 1.25, 1, T, Math.sin(T * 1.3) > .2, false);
  jzbBhHuhnMalen(c, x + 7 * k, y - 2 * k, k * 1.25, -1, T + 1.7, Math.sin(T * 1.1 + 2) > .3, false);
  c.fillStyle = "#8b5e34"; c.fillRect(l - 1 * k, y - h - 2.4 * k, b + 2 * k, 2.6 * k); c.fillRect(l - 1 * k, y - 2.2 * k, b + 2 * k, 2.4 * k); // Deckel, Boden
  c.fillStyle = "#a47448"; for (let i = 0; i <= 6; i++) c.fillRect(l + i * (b / 6) - .7 * k, y - h, 1.4 * k, h - 2 * k); // Stäbe
}
function jzbVmStandMalen(c, x, y, k, T, F, zu = 0, band = null) { // 🧵 Kurzwaren-Stand mit gestreiftem Dach, Garnrollen, Knöpfen, Stoffballen und Händlerin
  const b = 84 * k, l = x - b / 2, dach = y - 44 * k;
  c.fillStyle = "#7a5230"; c.fillRect(l + 2 * k, dach, 2.4 * k, 44 * k); c.fillRect(l + b - 4.4 * k, dach, 2.4 * k, 44 * k); // Pfosten
  // Händlerin hinter dem Tisch (Kopftuch, Schürze)
  const fx = x + 6 * k, fy = y - 10 * k, ruft = (F.vmRuf || 0) > 0 || !!band;
  c.fillStyle = "#8e3b46"; c.beginPath(); c.moveTo(fx - 5 * k, fy); c.lineTo(fx + 5 * k, fy); c.lineTo(fx + 3.6 * k, fy - 14 * k); c.lineTo(fx - 3.6 * k, fy - 14 * k); c.closePath(); c.fill();
  c.fillStyle = "#f1e3c8"; c.fillRect(fx - 2.6 * k, fy - 11 * k, 5.2 * k, 11 * k);
  c.strokeStyle = "#8e3b46"; c.lineWidth = 2 * k; c.lineCap = "round"; c.beginPath(); c.moveTo(fx - 3.2 * k, fy - 12 * k);
  if (band) { c.lineTo(fx - 9 * k, fy - 9 * k); c.stroke(); c.strokeStyle = "#e63946"; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(fx - 9 * k, fy - 9 * k); c.quadraticCurveTo((fx + band.x) / 2, Math.max(fy, band.y) + 4 * k, band.x, band.y); c.stroke(); } // Stoffband zum Ferkel
  else { c.lineTo(fx - (ruft ? 8 : 6) * k, fy - (ruft ? 20 : 6) * k); c.stroke(); } // winkt beim Rufen
  c.fillStyle = "#e9b98f"; c.beginPath(); c.arc(fx, fy - 17.5 * k, 3.4 * k, 0, 7); c.fill();
  c.fillStyle = "#2a9d8f"; c.beginPath(); c.arc(fx, fy - 18.5 * k, 3.8 * k, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(fx + 4 * k, fy - 15 * k); c.lineTo(fx - 4 * k, fy - 15 * k); c.closePath(); c.fill(); // Kopftuch
  c.fillStyle = "#222"; c.beginPath(); c.arc(fx - 1.2 * k, fy - 17.6 * k, .45 * k, 0, 7); c.arc(fx + 1.2 * k, fy - 17.6 * k, .45 * k, 0, 7); c.fill();
  // Tisch mit Decke
  c.fillStyle = "#3a6ea5"; c.fillRect(l, y - 13 * k, b, 13 * k); c.fillStyle = "#2d5784"; for (let i = 0; i < 8; i++) c.fillRect(l + i * b / 8, y - 13 * k, b / 16, 13 * k);
  c.fillStyle = "#e9d8a6"; c.fillRect(l - 1 * k, y - 14.5 * k, b + 2 * k, 2 * k);
  // Ware: Stoffballen, Garnrollen, Knopfkarten
  const stoff = ["#e63946", "#ffd166", "#8ecae6", "#b5e48c"]; stoff.forEach((f, i) => { c.fillStyle = f; c.fillRect(l + 4 * k + i * 7 * k, y - 21 * k, 6 * k, 6.5 * k); c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(l + 4 * k + i * 7 * k, y - 21 * k, 6 * k, 1.2 * k); });
  const garn = ["#c1121f", "#023e8a", "#2a9d8f", "#ffb703", "#6a4c93", "#f72585"]; garn.forEach((f, i) => { const gx = x + 16 * k + i * 4.2 * k; c.fillStyle = "#d9c2a0"; c.fillRect(gx - 1.6 * k, y - 20.6 * k, 3.2 * k, 6 * k); c.fillStyle = f; c.fillRect(gx - 1.3 * k, y - 19.8 * k, 2.6 * k, 4.4 * k); });
  for (let i = 0; i < 3; i++) { const kx = l + 34 * k + i * 6 * k; c.fillStyle = "#fff"; c.fillRect(kx, y - 20 * k, 5 * k, 5 * k); c.fillStyle = ["#264653", "#e76f51", "#8d5a2b"][i];
    for (const [dx, dy] of [[1.4, 1.4], [3.6, 1.4], [1.4, 3.6], [3.6, 3.6]]) { c.beginPath(); c.arc(kx + dx * k, y - 20 * k + dy * k, .8 * k, 0, 7); c.fill(); } }
  // gestreiftes Dach mit Bogenkante (klappt zum Feierabend hoch: zu 0 → 1)
  if (zu > 0) { c.save(); c.translate(0, dach - 9 * k); c.scale(1, Math.max(.15, 1 - zu * .85)); c.translate(0, -(dach - 9 * k)); }
  const n = 8, sb = (b + 8 * k) / n; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? "#fff" : "#d62828"; c.beginPath(); c.moveTo(l - 4 * k + i * sb, dach - 9 * k); c.lineTo(l - 4 * k + (i + 1) * sb, dach - 9 * k); c.lineTo(l - 4 * k + (i + 1) * sb, dach); c.arc(l - 4 * k + (i + .5) * sb, dach, sb / 2, 0, Math.PI); c.closePath(); c.fill(); }
  if (zu > 0) c.restore();
  if (zu > .6) { c.fillStyle = "#5a3818"; c.fillRect(l + 2 * k, y - 22 * k, b - 4 * k, 9 * k); c.fillStyle = "#fff4d6"; c.font = `800 ${6.4 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Geschlossen", x, y - 17.4 * k); } // Tuch über der Ware
  // Schild
  const fs = 7.4 * k; c.font = `700 ${fs}px Georgia,serif`; const tw = c.measureText("Kurzwaren").width + 8 * k;
  c.fillStyle = "#fff4d6"; c.strokeStyle = "#7a5230"; c.lineWidth = 1; c.beginPath(); c.roundRect ? c.roundRect(x - tw / 2, dach - 20 * k, tw, fs + 4 * k, 2 * k) : c.rect(x - tw / 2, dach - 20 * k, tw, fs + 4 * k); c.fill(); c.stroke();
  c.fillStyle = "#7a1f2b"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("Kurzwaren", x, dach - 20 * k + (fs + 4 * k) / 2 + .4 * k);
  return { fx, fy: fy - 23 * k };
}
function jzbVmBlase(c, x, y, text, k, a) { // 💬 Sprechblase über einem Kopf
  if (a <= 0) return; const fs = 7.6 * k; c.save(); c.globalAlpha *= a; c.font = `700 ${fs}px "Trebuchet MS",sans-serif`;
  const w = c.measureText(text).width + 9 * k, h = fs + 6 * k, bx = Math.max(JZB_RAND + 2, Math.min(JZB.w - JZB_RAND - w - 2, x - w / 2)), by = y - h;
  c.fillStyle = "rgba(255,255,255,.96)"; c.strokeStyle = "rgba(60,40,20,.55)"; c.lineWidth = 1; c.beginPath(); c.roundRect ? c.roundRect(bx, by, w, h, 4 * k) : c.rect(bx, by, w, h); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 2.5 * k, by + h - .5); c.lineTo(x, by + h + 4 * k); c.lineTo(x + 2.5 * k, by + h - .5); c.closePath(); c.fill();
  c.fillStyle = "#3b2412"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, bx + w / 2, by + h / 2 + .4 * k); c.restore();
}
function jzbVmSchildMalen(c, x, y, k, text, s) { // 🪧 „Verkauft!“ an einer Schnur
  if (s <= 0) return; c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(JZB.T * 2) * .06);
  const fs = 6.6 * k; c.font = `800 ${fs}px "Trebuchet MS",sans-serif`; const w = c.measureText(text).width + 6 * k;
  c.strokeStyle = "#5a3818"; c.lineWidth = .8; c.beginPath(); c.moveTo(-w / 3, 0); c.lineTo(0, -5 * k); c.lineTo(w / 3, 0); c.stroke();
  c.fillStyle = "#c1121f"; c.fillRect(-w / 2, 0, w, fs + 3.4 * k); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, 0, (fs + 3.4 * k) / 2 + .3 * k); c.restore();
}
function jzbVmMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, t = F.t, boden = J.h - 3 * k, P = jzbVmPlatz(), V = F.vmz; if (!V) return;
  // Pflaster vom Marktplatz
  c.fillStyle = "rgba(120,110,100,.55)"; c.fillRect(0, boden - 1 * k, J.w, J.h - boden + 1 * k);
  c.fillStyle = "rgba(255,255,255,.12)"; for (let x = 4; x < J.w; x += 9 * k) c.fillRect(x, boden + .6 * k, 6 * k, 1 * k);
  // 🪧 Schild „Viehmarkt“
  const sx = P.kuh - 8 * k; c.fillStyle = "#6b4423"; c.fillRect(sx, boden - 44 * k, 2 * k, 44 * k);
  { const fs = 7 * k; c.font = `700 ${fs}px Georgia,serif`; const w = c.measureText("Viehmarkt").width + 8 * k; c.fillStyle = "#c08a4e"; c.fillRect(sx - 2 * k, boden - 50 * k, w, fs + 4 * k);
    c.fillStyle = "#3b2412"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("Viehmarkt", sx + 2 * k, boden - 50 * k + (fs + 4 * k) / 2 + .3 * k); }
  // Kurzwaren-Stand (Dach klappt zum Feierabend zu; Stoffband, solange die Händlerin das Ferkel hält)
  F.vmRuf = JZB_VM_REDEN.some(([s0, w]) => w === "f" && t >= s0 && t < s0 + 3) ? 1 : 0;
  const zu = t > JZB_VM_ZU ? Math.min(1, (t - JZB_VM_ZU) / 2.5) : 0;
  const St = jzbVmStandMalen(c, P.stand, boden, k, T, F, zu, V.band ? { x: V.sx + 8 * k * V.sdir, y: boden - 10 * k } : null);
  // fliegende Garnrollen und Knöpfe
  for (const q of V.teile) { c.globalAlpha = F.a * q.a; c.fillStyle = q.f; c.beginPath(); if (q.rund) c.arc(q.x, q.y, q.r, 0, 7); else c.rect(q.x - q.r, q.y - q.r * 1.4, q.r * 2, q.r * 2.8); c.fill(); }
  c.globalAlpha = F.a;
  // Tiere: Kuh (geht am Schluss mit Anton), Schwein (büxt aus), Hühnerkäfig
  if (V.kx > -40 * k) { jzbBhKuhMalen(c, V.kx, boden, k * 1.6, V.kdir, T, V.kLauf); if (t >= JZB_VM_ABGANG && V.kLauf) { c.strokeStyle = "#7a5230"; c.lineWidth = .9; c.beginPath(); c.moveTo(V.kx + 4 * k, boden - 20 * k); c.quadraticCurveTo(V.kx + 14 * k, boden - 12 * k, V.ax - 6 * k, boden - 17 * k); c.stroke(); } }
  if (V.sx > -40 * k) { jzbBhSchweinMalen(c, V.sx, boden, k * 1.45, V.sdir, T * (V.sLauf ? 2.5 : 1), V.sLauf, false);
    if (t >= JZB_VM_GEFANGEN + 3 && V.sLauf) { c.strokeStyle = "#e63946"; c.lineWidth = 1.1 * k; c.beginPath(); c.moveTo(V.sx + 10 * k * V.sdir, boden - 12 * k); c.quadraticCurveTo(V.sx + 18 * k * V.sdir, boden - 6 * k, V.bx - 5 * k * V.sdir, boden - 17 * k); c.stroke(); } }
  jzbVmKaefigMalen(c, P.kaefig, boden, k, T);
  if (t < JZB_VM_ABGANG) { jzbVmSchildMalen(c, V.kx, boden - 27 * k, k, "Verkauft!", t > 29 ? jzbHopp((t - 29) / .7) : 0);
    if (!V.sLauf && t < JZB_VM_AUS) jzbVmSchildMalen(c, V.sx, boden - 19 * k, k, "Verkauft!", t > 45 ? jzbHopp((t - 45) / .7) : 0); }
  if (V.schuh) { const q = V.schuh; c.save(); c.translate(q.x, q.y); c.rotate(q.dreh); c.fillStyle = "#d4a24c"; c.strokeStyle = "#8a5f22"; c.lineWidth = .7 * k; c.beginPath(); c.moveTo(-3 * k, 0); c.lineTo(-3 * k, -2.4 * k); c.lineTo(1.4 * k, -2.4 * k); c.quadraticCurveTo(4 * k, -1.8 * k, 3.8 * k, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  // Händler und Bauern
  const hand = JZB_VM_HAND.find(([s0]) => t >= s0 - .8 && t < s0 + 2.6), hs = hand ? Math.max(0, t - hand[0]) : 0;
  const prost = t >= JZB_VM_PROST - .5 && t < JZB_VM_PROST + 3.5, geld = t >= JZB_VM_ABGANG + 2;
  const armH = hand ? "hand" : prost ? "prost" : geld ? "geld" : t >= JZB_VM_AUS && t < JZB_VM_GEFANGEN ? "zeigt" : "stock";
  jzbVmBauerMalen(c, P.haendler, boden, k, 1, { arm: armH, schuett: hand ? hs : 0, pfeife: armH === "stock", farbe: "#5a6b7a", kappe: "#2b2b2b" });
  const heranA = hand && hand[1] === "a", heranB = hand && hand[1] === "b";
  const armA = heranA ? "hand" : prost ? "prost" : t >= JZB_VM_ABGANG ? "seil" : t > 2 && t < 26 ? (Math.floor(t / 3) % 2 ? "zeigt" : "kinn") : null;
  const armB = heranB ? "hand" : prost ? "prost" : t >= JZB_VM_GEFANGEN + 3 && V.bGeht ? "seil" : t > 30 && t < 43 ? (Math.floor(t / 3) % 2 ? "kinn" : "zeigt") : null;
  const ax = V.ax + (heranA ? -3 * k : 0), bx = V.bx + (heranB ? -14 * k : 0);
  jzbVmBauerMalen(c, bx, boden, k, V.bdir, { geht: V.bGeht, ph: T * (t >= JZB_VM_AUS && t < JZB_VM_GEFANGEN ? 1.8 : 1), arm: armB, schuett: heranB ? hs : 0, bart: true, farbe: "#4f7cac" });
  jzbVmBauerMalen(c, ax, boden, k, V.adir, { geht: V.aGeht, ph: T * (t >= JZB_VM_AUS && t < JZB_VM_GEFANGEN ? 1.8 : 1) + .5, arm: armA, schuett: heranA ? hs : 0, farbe: "#3d6fb6", kappe: "#6b4f2a" });
  const ruf = (text, x, y, farbe = "#c1121f", gr = 9) => { c.save(); c.font = `900 ${gr * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.9)"; c.strokeText(text, x, y); c.fillStyle = farbe; c.fillText(text, x, y); c.restore(); };
  if (hand && hs > .2 && hs < 2.2) { c.save(); c.globalAlpha *= Math.min(1, (2.2 - hs) * 3); ruf("Patsch!", (P.haendler + (heranA ? ax : bx)) / 2, boden - 38 * k); c.restore(); }
  if (prost && t > JZB_VM_PROST) { c.save(); c.globalAlpha *= Math.min(1, (JZB_VM_PROST + 3.5 - t) * 2); ruf("Prost!", (P.haendler + bx) / 2, boden - 40 * k, "#b5651d", 10); c.restore(); }
  if (t >= JZB_VM_AUS && t < JZB_VM_AUS + 2.5) ruf("Quiiiek!", V.sx, boden - 24 * k, "#d6336c", 8);
  // Sprechblasen
  for (const [s0, w, text] of JZB_VM_REDEN) { if (t < s0 || t > s0 + 3) continue; const a = Math.min(1, (t - s0) * 4, (s0 + 3 - t) * 3);
    const x = w === "h" ? P.haendler + 2 * k : w === "a" ? ax : w === "b" ? bx : St.fx; jzbVmBlase(c, x, w === "f" ? St.fy - 22 * k : boden - 38 * k, text, k, a); }
  // 🐴 Bauer mit Pferd vorn quer durchs Bild
  if (V.pferd) { const R = V.pferd, kx = R.x + R.dir * 34 * k; jzbVmPferdMalen(c, R.x, boden + 1 * k, k * 1.05, R.dir, R.ph);
    c.strokeStyle = "#7a5230"; c.lineWidth = .9; c.beginPath(); c.moveTo(R.x + R.dir * 27 * k, boden - 33 * k); c.quadraticCurveTo(R.x + R.dir * 31 * k, boden - 20 * k, kx + R.dir * 7 * k, boden - 17 * k); c.stroke(); // Führstrick
    jzbVmBauerMalen(c, kx, boden + 1 * k, k, R.dir, { geht: true, ph: R.ph, arm: "seil", kappe: "#1b1b1b", farbe: "#2a7f8f" });
    if (Math.sin(R.ph * 5) > .97) jzbVmBlase(c, R.x, boden - 46 * k, "klapp, klapp", k * .8, .8); }
  // 🐂 2.717.0 KC-CLUB-VM-STIER: Stier trabt herein, schnaubt den Namen in den Himmel, trabt hinaus
  const S = jzbVmStierLage(t);
  if (S) { jzbVmStierMalen(c, S.x, boden + 1 * k, k * 1.25, S.dir, S.ph, S.schnaubt, T);
    if (S.schnaubt > .6) { const nx = S.x + S.dir * 30 * k * 1.25, ny = boden - 20.5 * k * 1.25; c.fillStyle = `rgba(240,240,240,${.5 * S.schnaubt})`; // kurze Dampfstöße beim Schnauben
      for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(nx + S.dir * (3 + j * 3) * k, ny + (1 + j) * k, (1.4 + j * .8) * k, 0, 7); c.fill(); } }
    const s = t - JZB_VM_STIER; if (s > JZB_VM_ST_REIN && s < JZB_VM_ST_REIN + 2.2) ruf("Schnauf!", S.x, boden - 52 * k, "#5a3420", 9); }
  if (t >= JZB_VM_STIER) jzbVmStierNameMalen(c, t, k, T, S, boden);
}

// ---- 🥨 Oktoberfest ----
function jzbWiesnFass() { const J = JZB, k = J.k, r = Math.max(13, Math.min(22, J.h * .15)) * Math.max(.8, k), fx = J.w - r * 1.6 - 46; return { fx, fy: J.h - 2 - 10 * k - r, r, kx: fx - r * 1.55, ky: J.h - 2 }; }
const jzbWiesnKrugMitte = () => JZB.w * .5;
function jzbKrugMalen(c, x, yb, k, fuell, kipp, spiegel) { // 🍺 Maßkrug aus Glas mit Henkel, Bier und Schaumkrone
  const w = 13 * k, h = 20 * k;
  c.save(); c.translate(x, yb); c.rotate(kipp); c.scale(spiegel, 1);
  c.strokeStyle = "rgba(230,240,245,.95)"; c.lineWidth = 2.4 * k; c.beginPath(); c.moveTo(w / 2, -h * .78); c.quadraticCurveTo(w / 2 + 8 * k, -h * .7, w / 2 + 6.5 * k, -h * .4); c.quadraticCurveTo(w / 2 + 5 * k, -h * .22, w / 2, -h * .22); c.stroke();
  if (fuell > 0) { const bh = (h - 2.5 * k) * fuell, g = c.createLinearGradient(0, -bh, 0, 0); g.addColorStop(0, "#f7c548"); g.addColorStop(1, "#d98a12");
    c.fillStyle = g; c.fillRect(-w / 2 + 1, -bh - 1.5 * k, w - 2, bh); c.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-w * .2 + i * 2.6 * k, -bh * (.3 + (i % 2) * .3) - 1.5 * k, .7 * k, 0, 7); c.fill(); }
    if (fuell > .55) { c.fillStyle = "#fffdf2"; c.beginPath(); const fy = -bh - 1.5 * k; c.moveTo(-w / 2 - 1, fy + 2 * k);
      for (let i = 0; i <= 4; i++) c.arc(-w / 2 + i * w / 4, fy - .5 * k, 2.4 * k, Math.PI, 0); c.lineTo(w / 2 + 1, fy + 2 * k); c.closePath(); c.fill(); } }
  c.fillStyle = "rgba(220,235,245,.28)"; c.strokeStyle = "rgba(235,245,250,.95)"; c.lineWidth = 1.3 * k; c.beginPath(); c.rect(-w / 2, -h, w, h - 1.5 * k); c.fill(); c.stroke();
  c.fillStyle = "rgba(235,245,250,.9)"; c.fillRect(-w / 2 - .5, -1.6 * k, w + 1, 1.8 * k);
  c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = .8; for (let r = 0; r < 3; r++) for (let s = 0; s < 3; s++) { c.beginPath(); c.arc(-w * .28 + s * w * .28, -h * .75 + r * h * .25, 1.6 * k, 0, 7); c.stroke(); }
  c.restore();
}
function jzbWiesnMalen(c, F) {
  const J = JZB, k = J.k, T = J.T;
  // 2.336.0 (Wunsch Hansi): keine Wimpelkette mehr oben – die blau-weißen Wimpel hängen als Deko an der Leiste (KC-CLUB-DEKO)
  // Lebkuchenherz und Brezn am Pfosten unten links
  const f = jzbWiesnFass(), sy = jzbStangeY(); jzbPfostenMalen(c, JZB_RAND + 3, sy, JZB_RAND + 72 * k); jzbHerzMalen(c, JZB_RAND + 25 * k, sy, k, F.t); jzbBreznMalen(c, JZB_RAND + 60 * k, sy, k);
  // Fass auf dem Bock, Zapfhahn, Krug füllt sich
  c.fillStyle = "#6b4423"; c.fillRect(f.fx - f.r * 1.1, f.fy + f.r * .7, 3 * k, J.h - f.fy - f.r * .7); c.fillRect(f.fx + f.r * 1.1 - 3 * k, f.fy + f.r * .7, 3 * k, J.h - f.fy - f.r * .7);
  const g = c.createLinearGradient(0, f.fy - f.r, 0, f.fy + f.r); g.addColorStop(0, "#c08a4e"); g.addColorStop(.5, "#9a6431"); g.addColorStop(1, "#6e4220");
  c.fillStyle = g; c.beginPath(); c.ellipse(f.fx, f.fy, f.r * 1.3, f.r, 0, 0, 7); c.fill();
  c.strokeStyle = "#3d3d3d"; c.lineWidth = 2 * k; for (const s of [-.75, .75]) { c.beginPath(); c.ellipse(f.fx + s * f.r * 1.3 * .82, f.fy, f.r * .16, f.r * .97, 0, 0, 7); c.stroke(); }
  c.fillStyle = "#a87240"; c.beginPath(); c.ellipse(f.fx - f.r * 1.3, f.fy, f.r * .28, f.r, 0, 0, 7); c.fill(); c.strokeStyle = "#3d3d3d"; c.lineWidth = 1.4 * k; c.stroke();
  c.fillStyle = "#c9c9c9"; c.fillRect(f.fx - f.r * 1.55, f.fy - 2 * k, f.r * .3, 3.4 * k); c.fillRect(f.kx - 1.5 * k, f.fy - 2 * k, 3 * k, 7 * k);
  const fuell = jzbEase((F.t - 4) / 16);
  if (F.t > 4 && F.t < 21) { c.strokeStyle = "rgba(242,182,50,.95)"; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(f.kx, f.fy + 5 * k); c.lineTo(f.kx + Math.sin(T * 20) * .4, f.ky - 20 * k * Math.max(.1, fuell)); c.stroke(); }
  jzbKrugMalen(c, f.kx, f.ky, k, fuell, 0, 1);
  if (F.schild >= 0 && F.schild < 10) { // Holzschild „O'zapft is!“
    const s = jzbHopp(F.schild / .7) * Math.min(1, (10 - F.schild) / .6), sx = f.fx - f.r * .2, sy = f.fy - f.r - 16 * k;
    c.save(); c.translate(sx, sy); c.scale(s, s); c.rotate(-.06); c.fillStyle = "#8b5a2b"; c.strokeStyle = "#5a3818"; c.lineWidth = 1.5; c.beginPath(); if (c.roundRect) c.roundRect(-34 * k, -9 * k, 68 * k, 18 * k, 4 * k); else c.rect(-34 * k, -9 * k, 68 * k, 18 * k); c.fill(); c.stroke();
    c.font = `700 ${10 * k}px Georgia,serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff4d6"; c.fillText("O'zapft is!", 0, .5 * k); c.restore();
  }
  if (F.krug) { // zwei Maßkrüge kommen von links und rechts und stoßen an
    const K = F.krug, m = jzbWiesnKrugMitte(), weg = K.t < 2.4 ? 1 - jzbEase(K.t / 2.4) : K.t < 4.6 ? 0 : jzbEase((K.t - 4.6) / 2.4), d = 9 * k + weg * (J.w * .3);
    const kipp = K.t > 2 && K.t < 3.2 ? Math.sin((K.t - 2) / 1.2 * Math.PI) * .22 : 0;
    jzbKrugMalen(c, m - d, J.h - 2, k, 1, kipp, 1); jzbKrugMalen(c, m + d, J.h - 2, k, 1, -kipp, -1);
    if (K.t > 2.4 && K.t < 4.8) { const a = Math.min(1, (K.t - 2.4) * 3, (4.8 - K.t) * 3); c.save(); c.globalAlpha *= a; c.font = `700 ${12 * k}px Georgia,serif`; c.textAlign = "center"; c.lineWidth = 3; c.strokeStyle = "rgba(0,0,0,.45)"; c.strokeText("Prost!", m, J.h - 32 * k); c.fillStyle = "#ffe08a"; c.fillText("Prost!", m, J.h - 32 * k); c.restore(); }
  }
  jzbSpritzerMalen(c, F);
}
// ---- 🌴 Karibik ----
const jzbKaribikHorizont = () => JZB.h - 30 * JZB.k;
function jzbKaribikSand(x) { const J = JZB, a = J.w * .55; if (x < a) return J.h + 20; const u = Math.min(1, (x - a) / (J.w * .2)); return J.h - 3 - jzbEase(u) * 16 * J.k; }
function jzbPalme() { const J = JZB, k = J.k, H = Math.max(36, Math.min(80, J.h * .5)) * Math.max(.8, k), px = J.w * .8, py = jzbKaribikSand(px) + 2, bieg = Math.sin(J.T * .7) * 3 * k; return { px, py, H, kx: px + H * .2 + bieg, ky: py - H }; }
function jzbKaribikMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, H0 = jzbKaribikHorizont(), abend = jzbEase((F.t - (JZB_FEST_DAUER - 28)) / 20);
  // Sonne – zum Schluss geht sie unter und färbt sich rot
  const sx = J.w * .5, sy = J.h * .355 + abend * (H0 - J.h * .355), sr = 13 * k * (1 + abend * .25);
  const gl = c.createRadialGradient(sx, sy, sr * .5, sx, sy, sr * 2.6); gl.addColorStop(0, abend > .3 ? "rgba(255,140,60,.55)" : "rgba(255,230,120,.5)"); gl.addColorStop(1, "rgba(255,200,80,0)");
  c.fillStyle = gl; c.beginPath(); c.arc(sx, sy, sr * 2.6, 0, 7); c.fill();
  c.save(); c.beginPath(); c.rect(0, 0, J.w, H0); c.clip(); c.fillStyle = abend > 0 ? `rgb(255,${Math.round(214 - 110 * abend)},${Math.round(80 - 40 * abend)})` : "#ffd650"; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill(); c.restore();
  if (abend > 0) { const g = c.createLinearGradient(0, H0 - J.h * .5, 0, H0); g.addColorStop(0, "rgba(255,120,60,0)"); g.addColorStop(1, `rgba(255,110,50,${.22 * abend})`); c.fillStyle = g; c.fillRect(0, H0 - J.h * .5, J.w, J.h * .5); }
  // Meer mit Wellen und Glitzer
  const mg = c.createLinearGradient(0, H0, 0, J.h); mg.addColorStop(0, "#1fb5c9"); mg.addColorStop(1, "#0e8aa8"); c.fillStyle = mg;
  c.beginPath(); c.moveTo(0, J.h); for (let x = 0; x <= J.w; x += 6) c.lineTo(x, H0 + Math.sin(x * .05 + T * 1.6) * 1.2 * k); c.lineTo(J.w, J.h); c.fill();
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.2;
  for (let r = 0; r < 2; r++) { c.beginPath(); for (let x = 0; x <= J.w * .62; x += 5) { const y = H0 + (6 + r * 6) * k + Math.sin(x * .06 - T * (2 + r) + r) * 1.6 * k; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  if (abend > 0) { c.fillStyle = `rgba(255,170,90,${.6 * abend})`; for (let i = 0; i < 5; i++) c.fillRect(sx - (10 - i * 1.5) * k, H0 + 2 * k + i * 3 * k, (20 - i * 3) * k, 1.3 * k); }
  // Segelboot
  if (F.boot) { const b = F.boot, by = H0 + 2 * k + Math.sin(T * 2) * 1.2 * k; c.save(); c.translate(b.x, by); c.scale(b.dir * k, k); c.rotate(Math.sin(T * 1.5) * .05);
    c.fillStyle = "#7a3e1d"; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(10, 5); c.lineTo(-11, 5); c.closePath(); c.fill();
    c.strokeStyle = "#5a3a20"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.stroke();
    c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(1, -25); c.lineTo(13, -3); c.lineTo(1, -3); c.fill(); c.fillStyle = "#ff6b4a"; c.beginPath(); c.moveTo(-1, -22); c.lineTo(-11, -3); c.lineTo(-1, -3); c.fill(); c.restore(); }
  // Strand mit Namen im Sand – die große Welle holt ihn
  const a = J.w * .55; c.fillStyle = "#f3d9a4"; c.beginPath(); c.moveTo(a, J.h + 1); for (let x = a; x <= J.w; x += 4) c.lineTo(x, jzbKaribikSand(x)); c.lineTo(J.w, J.h + 1); c.fill();
  const name = jzbEisNameText(), nx = J.w * .74, ny = J.h - 6 * k, buchst = Math.floor(Math.max(0, F.t - 8) / .7), weg = F.welle < 0 ? 0 : Math.min(1, F.welle / 2.5);
  if (name && buchst > 0 && weg < 1) { c.save(); c.globalAlpha *= 1 - weg; c.font = `italic 600 ${9.5 * k}px "Segoe Print","Comic Sans MS",cursive,sans-serif`; c.textAlign = "left"; c.textBaseline = "middle";
    const t = name.slice(0, buchst), w = c.measureText(name).width; c.fillStyle = "rgba(140,95,45,.75)"; c.fillText(t, nx - w / 2, ny); c.restore(); }
  if (F.welle >= 0 && F.welle < 6) { const p = F.welle < 2.5 ? jzbEase(F.welle / 2.5) : 1 - jzbEase((F.welle - 2.5) / 3.5), vx = a + p * (J.w * .32);
    c.fillStyle = "rgba(60,200,215,.75)"; c.beginPath(); c.moveTo(a - 4, J.h + 1); for (let x = a - 4; x <= vx; x += 4) c.lineTo(x, Math.max(jzbKaribikSand(x), J.h - 9 * k) - 2 * k + Math.sin(x * .2 + T * 4) * k); c.lineTo(vx, J.h + 1); c.fill();
    c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 1.6 * k; c.beginPath(); c.arc(vx, J.h - 6 * k, 3 * k, -1.6, 1.2); c.stroke(); }
  c.font = `${13 * k}px ${JZB_EMOJI}`; c.textAlign = "center"; c.textBaseline = "bottom"; c.fillText("🍹", J.w * .64, jzbKaribikSand(J.w * .64) + 2);
  // Palme
  const P = jzbPalme(); c.strokeStyle = "#8a6239"; c.lineCap = "round";
  for (let i = 0; i < 10; i++) { const u0 = i / 10, u1 = (i + 1) / 10, pt = (u) => [P.px + (P.kx - P.px) * u * u, P.py + (P.ky - P.py) * u]; const [x0, y0] = pt(u0), [x1, y1] = pt(u1);
    c.lineWidth = (5.5 - u0 * 2.5) * k; c.strokeStyle = i % 2 ? "#8a6239" : "#9c7246"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  const wedel = [[-2.6, 1], [-2.0, 1.1], [-1.3, .9], [-.4, .7], [.5, .9], [1.1, 1.05], [-3.0, .8]];
  for (const [w0, l0] of wedel) { const sw = Math.sin(T * 1.3 + w0) * .08, w = w0 + sw, L = 30 * k * l0, ex = P.kx + Math.cos(w) * L, ey = P.ky + Math.sin(w) * L * .55 + L * .35;
    const mx = P.kx + Math.cos(w) * L * .55, my = P.ky + Math.sin(w) * L * .55 - 6 * k;
    c.strokeStyle = "#2e8b3e"; c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(P.kx, P.ky); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = "#3fae4f"; c.lineWidth = 1.1 * k;
    for (let j = 1; j < 9; j++) { const u = j / 9, qx = (1 - u) * (1 - u) * P.kx + 2 * (1 - u) * u * mx + u * u * ex, qy = (1 - u) * (1 - u) * P.ky + 2 * (1 - u) * u * my + u * u * ey, ll = (1 - u * .6) * 6 * k;
      c.beginPath(); c.moveTo(qx, qy); c.lineTo(qx + Math.cos(w + 1.9) * ll, qy + Math.sin(w + 1.9) * ll + 2 * k); c.moveTo(qx, qy); c.lineTo(qx + Math.cos(w - 1.2) * ll, qy + Math.abs(Math.sin(w - 1.2)) * ll + 2 * k); c.stroke(); } }
  c.fillStyle = "#6b4423"; for (const [dx, dy] of [[-3, 3], [2.5, 4], [0, 6.5]]) { if (F.nuss && dx === 2.5) continue; c.beginPath(); c.arc(P.kx + dx * k, P.ky + dy * k, 3.4 * k, 0, 7); c.fill(); }
  if (F.nuss) { c.fillStyle = "#6b4423"; c.beginPath(); c.arc(F.nuss.x, F.nuss.y, 3.4 * k, 0, 7); c.fill(); }
  // Papagei oder springender Fisch
  const g = F.gast; if (g) { c.save(); c.font = `${(g.typ === "papagei" ? 17 : 13) * k}px ${JZB_EMOJI}`; c.textAlign = "center"; c.textBaseline = "middle";
    if (g.typ === "papagei") { const x = g.dir > 0 ? -30 + g.t * 55 * k : J.w + 30 - g.t * 55 * k, y = g.y0 + Math.sin(g.t * 3) * 6 * k; c.translate(x, y); c.scale(-g.dir, 1); c.fillText("🦜", 0, 0); }
    else { const u = g.t / 1.6, x = g.x + g.dir * u * 40 * k, y = H0 + 6 * k - Math.sin(u * Math.PI) * 24 * k; c.translate(x, y); c.scale(-g.dir, 1); c.rotate(-g.dir * (u - .5) * 1.6 * -1); c.fillText("🐠", 0, 0); }
    c.restore(); }
  void F;
}
// ---- 🎭 Karneval (2.332.0 KC-CLUB-THEMEN-BUEHNE-2): Luftschlangen, Konfetti-Regen (bleibt liegen), Karnevalswagen mit „Helau, <Vorname>!“,
// der Jeck wirft Kamelle; zum Schluss zwei Konfetti-Kanonen ----
const jzbKonfettiNeu = (x, y, vx, vy) => ({ x, y, vx, vy, rot: jzbZ(0, 6.3), vr: jzbZ(-6, 6), ph: jzbZ(0, 6.3), fq: jzbZ(5, 10), farbe: jzbW(JZB_FEST_BUNT.slice(0, 6)), w: jzbZ(2.2, 3.6) });
function jzbKarnevalSchritt(F, dt) {
  const J = JZB, k = J.k;
  if (F.t < JZB_FEST_DAUER - 6) { F.kSpawn = (F.kSpawn || 0) - dt; while (F.kSpawn < 0) { F.kSpawn += .17; F.konfetti.push(jzbKonfettiNeu(jzbZ(0, J.w), -6, 0, jzbZ(14, 26))); } }
  if (!F.kanone && F.t > JZB_FEST_DAUER - 18) { F.kanone = true; // Konfetti-Kanonen links und rechts
    for (const s of [1, -1]) for (let i = 0; i < 60; i++) F.konfetti.push(jzbKonfettiNeu(s > 0 ? JZB_RAND : J.w - JZB_RAND, J.h - 4, s * jzbZ(40, 170), -jzbZ(140, 260))); }
  for (const p of F.konfetti) {
    p.vy = Math.min(p.vy + 140 * dt, 30); p.vx *= 1 - 1.4 * dt; p.ph += dt * p.fq;
    p.x += p.vx * dt + Math.sin(p.ph * .4) * 9 * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y >= J.h - 2 && p.vy > 0) { p.weg = true; if (jzbImFeld(p.x)) { F.liegt.push({ x: p.x, y: J.h - jzbZ(1, 3), rot: p.rot, farbe: p.farbe, w: p.w }); if (F.liegt.length > 180) F.liegt.shift(); } }
  }
  F.konfetti = F.konfetti.filter((p) => !p.weg && p.x > -20 && p.x < J.w + 20);
  if (!F.wagen && (F.wagenUhr -= dt) <= 0 && F.t < JZB_FEST_DAUER - 25) { const dir = (J.lauf + F.prost.length) % 2 ? -1 : 1; F.prost.push(1); F.wagen = { dir, x: dir > 0 ? -70 * k : J.w + 70 * k, t: 0, wurf: 1 }; }
  if (F.wagen) { const W = F.wagen; W.t += dt; W.x += W.dir * 20 * k * dt;
    if ((W.wurf -= dt) <= 0 && W.x > 0 && W.x < J.w) { W.wurf = jzbZ(.9, 2); F.kamelle.push({ x: W.x - W.dir * 8 * k, y: J.h - 34 * k, vx: jzbZ(-50, 50), vy: -jzbZ(70, 120), rot: 0, farbe: jzbW(JZB_FEST_BUNT.slice(0, 6)), lieg: 0 }); }
    if (W.x < -80 * k || W.x > J.w + 80 * k) { F.wagen = null; F.wagenUhr = jzbZ(18, 30); } }
  for (const m of F.kamelle) { if (m.lieg) { m.lieg += dt; continue; } m.vy += 230 * dt; m.x += m.vx * dt; m.y += m.vy * dt; m.rot += 8 * dt; if (m.y >= J.h - 3) { m.y = J.h - 3; m.lieg = .01; } }
  F.kamelle = F.kamelle.filter((m) => m.lieg < 9);
}
function jzbKamelleMalen(c, m, k) {
  c.save(); c.translate(m.x, m.y); c.rotate(m.rot); c.globalAlpha *= Math.min(1, (9 - m.lieg) / 1.5); c.fillStyle = m.farbe;
  c.beginPath(); c.ellipse(0, 0, 2.6 * k, 1.8 * k, 0, 0, 7); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 2.2 * k, 0); c.lineTo(s * 4.6 * k, -1.8 * k); c.lineTo(s * 4.6 * k, 1.8 * k); c.closePath(); c.fill(); }
  c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(-.6 * k, -1.6 * k, 1.2 * k, 3.2 * k); c.restore();
}
function jzbKarnevalMalen(c, F) {
  const J = JZB, k = J.k, T = J.T;
  // 2.336.0 (Wunsch Hansi „ganz oben nichts“): keine Luftschlangen mehr vom oberen Rand – die bunten Wimpel hängen als Deko an der Leiste
  const blatt = (p) => { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(p.ph === undefined ? 1 : Math.max(.15, Math.abs(Math.cos(p.ph))), 1); c.fillStyle = p.farbe; c.fillRect(-p.w * k / 2, -p.w * k * .35, p.w * k, p.w * k * .7); c.restore(); };
  for (const p of F.liegt) blatt(p);
  for (const m of F.kamelle) jzbKamelleMalen(c, m, k);
  const W = F.wagen;
  if (W) { // Karnevalswagen mit Fransen, Banner und Jeck
    const b = 46 * k, yb = J.h - 2, hop = Math.abs(Math.sin(W.t * 6)) * .8 * k, name = jzbEisNameText();
    c.save(); c.translate(W.x, yb - hop);
    for (const s of [-1, 1]) { const rx = s * b * .62; c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(rx, -4.5 * k + hop, 4.5 * k, 0, 7); c.fill(); c.strokeStyle = "#bbb"; c.lineWidth = 1;
      for (let q = 0; q < 3; q++) { const a = W.t * 4 * W.dir + q * 2.1; c.beginPath(); c.moveTo(rx, -4.5 * k + hop); c.lineTo(rx + Math.cos(a) * 4 * k, -4.5 * k + hop + Math.sin(a) * 4 * k); c.stroke(); } }
    c.fillStyle = "#d62f6b"; c.fillRect(-b, -21 * k, 2 * b, 13 * k);
    for (let i = 0; i < 16; i++) { c.fillStyle = JZB_FEST_BUNT[i % 6]; c.beginPath(); const x0 = -b + i * b / 8; c.moveTo(x0, -8 * k); c.lineTo(x0 + b / 8, -8 * k); c.lineTo(x0 + b / 16, -4 * k + Math.sin(W.t * 8 + i) * .8 * k); c.fill(); }
    c.fillStyle = "#ffd23f"; c.fillRect(-b, -22.5 * k, 2 * b, 2 * k);
    let fs = 8.5 * k; const txt = name ? `Helau, ${name}!` : "Helau!"; c.font = `800 ${fs}px "Trebuchet MS",sans-serif`; const tw = c.measureText(txt).width; if (tw > b * 1.85) { fs *= b * 1.85 / tw; c.font = `800 ${fs}px "Trebuchet MS",sans-serif`; }
    c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff"; c.fillText(txt, 0, -14.5 * k);
    c.font = `${19 * k}px ${JZB_EMOJI}`; c.textBaseline = "bottom"; c.fillText("🤡", -b * .4, -21 * k); c.fillText("🥳", b * .35, -21 * k);
    if (W.t % 4 < 1.4) { c.font = `800 ${11 * k}px "Trebuchet MS",sans-serif`; c.lineWidth = 3; c.strokeStyle = "rgba(0,0,0,.45)"; c.strokeText("Helau!", -b * .4, -42 * k); c.fillStyle = "#ffe14d"; c.fillText("Helau!", -b * .4, -42 * k); }
    c.restore();
  }
  for (const p of F.konfetti) blatt(p);
}
// ---- 🎃 Halloween: Mond, Spinnennetz mit Spinne, leuchtende Kürbisse, Fledermäuse, ein Gespenst ruft „Buuuh, <Vorname>!“ ----
function jzbHalloweenSchritt(F, dt) {
  const J = JZB, k = J.k, schwarm = !F.kanone && F.t > JZB_FEST_DAUER - 20;
  if (schwarm) F.kanone = true;
  if ((F.flederUhr -= dt) <= 0 || schwarm) { F.flederUhr = jzbZ(6, 13); const dir = Math.random() < .5 ? 1 : -1, n = schwarm ? 12 : 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) F.fleder.push({ dir, x: dir > 0 ? -20 - i * jzbZ(10, 25) : J.w + 20 + i * jzbZ(10, 25), y0: jzbZ(J.h * .15, J.h * .6), v: jzbZ(45, 70) * k, ph: jzbZ(0, 6), s: jzbZ(.8, 1.2) }); }
  for (const f of F.fleder) { f.x += f.dir * f.v * dt; f.ph += dt; }
  F.fleder = F.fleder.filter((f) => (f.dir > 0 ? f.x < J.w + 80 : f.x > -80));
  if (!F.geist && (F.geistUhr -= dt) <= 0 && F.t < JZB_FEST_DAUER - 10) F.geist = { t: 0 };
  if (F.geist && (F.geist.t += dt) > 7) { F.geist = null; F.geistUhr = jzbZ(14, 24); }
  jzbHwSchritt(F, dt); // 2.435.0 KC-CLUB-HALLOWEEN-GEWITTER
}
function jzbKuerbis(c, x, yb, r, k, i) {
  const J = JZB, fl = .75 + .25 * Math.sin(J.T * 13 + i * 2) * Math.sin(J.T * 7.3 + i), cy = yb - r * .82;
  const gl = c.createRadialGradient(x, cy, r * .3, x, cy, r * 2.2); gl.addColorStop(0, `rgba(255,170,40,${.35 * fl})`); gl.addColorStop(1, "rgba(255,140,20,0)"); c.fillStyle = gl; c.beginPath(); c.arc(x, cy, r * 2.2, 0, 7); c.fill();
  const g = c.createRadialGradient(x - r * .3, cy - r * .3, r * .2, x, cy, r * 1.2); g.addColorStop(0, "#ffa23a"); g.addColorStop(1, "#c9530a"); c.fillStyle = g;
  for (const [dx, w] of [[-.45, .62], [.45, .62], [0, .7]]) { c.beginPath(); c.ellipse(x + dx * r, cy, r * w, r * .82, 0, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(120,50,0,.35)"; c.lineWidth = 1; for (const dx of [-.35, .35]) { c.beginPath(); c.ellipse(x + dx * r, cy, r * .3, r * .78, 0, 0, 7); c.stroke(); }
  c.fillStyle = "#4e6b2a"; c.fillRect(x - r * .1, cy - r * 1.02, r * .2, r * .3);
  c.fillStyle = `rgba(255,${Math.round(200 + 40 * fl)},70,${.8 + .2 * fl})`;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * r * .45, cy - r * .32); c.lineTo(x + s * r * .2, cy - r * .02); c.lineTo(x + s * r * .62, cy - r * .02); c.fill(); }
  c.beginPath(); c.moveTo(x - r * .6, cy + r * .22); for (let j = 0; j <= 6; j++) c.lineTo(x - r * .6 + j * r * .2, cy + r * (j % 2 ? .32 : .22)); c.lineTo(x + r * .5, cy + r * .5); c.lineTo(x - r * .5, cy + r * .5); c.closePath(); c.fill(); void k;
}
function jzbFlederMalen(c, f, k) {
  const y = f.y0 + Math.sin(f.ph * 2.3) * 9 * k, fl = Math.sin(f.ph * 16), s = 7 * k * f.s;
  c.save(); c.translate(f.x, y); c.scale(f.dir, 1); c.fillStyle = "#1d1222";
  c.beginPath(); c.ellipse(0, 0, s * .32, s * .45, 0, 0, 7); c.fill(); c.beginPath(); c.arc(s * .1, -s * .45, s * .22, 0, 7); c.fill();
  c.beginPath(); c.moveTo(s * .02, -s * .62); c.lineTo(s * .1, -s * .82); c.lineTo(s * .2, -s * .6); c.fill();
  for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, -s * .1); c.lineTo(sd * s * 1.5, -s * .4 - fl * s * .7); c.lineTo(sd * s * 1.25, s * .05 - fl * s * .3); c.lineTo(sd * s * .9, -s * .05); c.lineTo(sd * s * .6, s * .2); c.lineTo(sd * s * .3, s * .05); c.closePath(); c.fill(); }
  c.restore();
}
function jzbHalloweenMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, mx = J.w * .5, my = J.h * .355, mr = 12 * k, HW = F.hw;
  c.save(); if (HW?.donner > 0) c.translate((Math.random() - .5) * 5 * k * HW.donner, (Math.random() - .5) * 3 * k * HW.donner); // 2.435.0: Donner – das Bild wackelt
  const gl = c.createRadialGradient(mx, my, mr * .6, mx, my, mr * 3); gl.addColorStop(0, "rgba(220,235,255,.45)"); gl.addColorStop(1, "rgba(200,220,255,0)"); c.fillStyle = gl; c.beginPath(); c.arc(mx, my, mr * 3, 0, 7); c.fill();
  c.fillStyle = "#fff4cf"; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); c.fillStyle = "rgba(200,180,120,.45)";
  for (const [dx, dy, r] of [[-.35, -.2, .22], [.3, .25, .16], [.1, -.45, .12], [-.1, .4, .1]]) { c.beginPath(); c.arc(mx + dx * mr, my + dy * mr, r * mr, 0, 7); c.fill(); }
  const nx = J.w - JZB_RAND + 4, ny = 2, R = 34 * k; c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = .7; // Spinnennetz oben rechts
  const sp = 6, a0 = Math.PI / 2, a1 = Math.PI; for (let i = 0; i <= sp; i++) { const a = a0 + (a1 - a0) * i / sp; c.beginPath(); c.moveTo(nx, ny); c.lineTo(nx + Math.cos(a) * R, ny + Math.sin(a) * R); c.stroke(); }
  for (const f of [.3, .55, .8]) { c.beginPath(); for (let i = 0; i <= sp; i++) { const a = a0 + (a1 - a0) * i / sp, r = R * f * (i % 2 ? .93 : 1); i ? c.lineTo(nx + Math.cos(a) * r, ny + Math.sin(a) * r) : c.moveTo(nx + Math.cos(a) * r, ny + Math.sin(a) * r); } c.stroke(); }
  const sx = nx - R * .45, sy0 = ny + R * .45, lang = Math.max(0, Math.sin(F.t * Math.PI * 2 / 16)) * J.h * .32, sy = sy0 + lang; // Spinne seilt sich ab
  c.beginPath(); c.moveTo(sx, sy0); c.lineTo(sx, sy); c.stroke(); c.fillStyle = "#151015"; c.strokeStyle = "#151015"; c.lineWidth = 1;
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const w = Math.sin(T * 6 + i) * .6 * k; c.beginPath(); c.moveTo(sx, sy + 3 * k); c.lineTo(sx + s * 4.5 * k, sy + (i - 1) * 2 * k + w); c.lineTo(sx + s * 6 * k, sy + (i - .5) * 2.6 * k); c.stroke(); }
  c.beginPath(); c.arc(sx, sy + 3 * k, 3 * k, 0, 7); c.fill(); c.beginPath(); c.arc(sx, sy + .5 * k, 1.8 * k, 0, 7); c.fill();
  jzbHwMalenHinten(c, F); // 2.435.0: Gewitterwolken, Sarg mit Vampir
  const ks = [[JZB_RAND + 16 * k, 10], [JZB_RAND + 38 * k, 6.5], [J.w - 70 * k, 12.5], [J.w - 48 * k, 7]];
  ks.forEach(([x, r], i) => jzbKuerbis(c, x, J.h - 1, r * k, k, i));
  const G = F.geist;
  if (G) { // Gespenst steigt hinter dem großen Kürbis auf, schwebt, ruft und verblasst
    const name = jzbEisNameText(), auf = jzbEase(G.t / 1.5), a = Math.min(1, G.t * 2, Math.max(0, (7 - G.t) / 1)), gx = J.w - 70 * k - 22 * k * auf + Math.sin(G.t * 1.6) * 4 * k, gy = J.h - 14 * k - auf * 26 * k + Math.sin(G.t * 2.4) * 2 * k, s = 13 * k;
    c.save(); c.globalAlpha *= a; c.fillStyle = "rgba(250,250,255,.93)"; c.beginPath(); c.moveTo(gx - s * .7, gy + s * .9); c.lineTo(gx - s * .7, gy - s * .1); c.arc(gx, gy - s * .1, s * .7, Math.PI, 0); c.lineTo(gx + s * .7, gy + s * .9);
    for (let i = 0; i < 4; i++) { const x0 = gx + s * .7 - (i + .5) * s * .35; c.quadraticCurveTo(x0, gy + s * (i % 2 ? .65 : 1.15) + Math.sin(T * 6 + i) * 1.5, gx + s * .7 - (i + 1) * s * .35, gy + s * .9); } c.fill();
    c.fillStyle = "#1a1a2a"; for (const d of [-.25, .25]) { c.beginPath(); c.ellipse(gx + d * s, gy - s * .25, s * .1, s * .16, 0, 0, 7); c.fill(); } c.beginPath(); c.ellipse(gx, gy + s * .12, s * .12, s * .17, 0, 0, 7); c.fill();
    if (G.t > 1.8 && G.t < 5.8) { const txt = name ? `Buuuh, ${name}!` : "Buuuh!"; c.font = `800 ${11 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "right"; c.textBaseline = "middle"; c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.7)"; c.strokeText(txt, gx - s, gy - s * .9); c.fillStyle = "#fff"; c.fillText(txt, gx - s, gy - s * .9); }
    c.restore(); }
  for (const f of F.fleder) jzbFlederMalen(c, f, k);
  jzbHwMalenVorn(c, F); c.restore(); // 2.435.0: Geister, Hexe, Blitz, Zauberblitz
}
// ---- 🐠 Unterwasserwelt (2.434.0 KC-CLUB-UNTERWASSER, Wunsch Hansi „bunte Fische, Luftblasen, Taucher, Helmtaucher mit dickem Helm und
// Luftschlauch, grüne Pflanzen, Muscheln, ein Seepferdchen schreibt den Namen – zieht der Taucher den Stöpsel, läuft das ganze Wasser ab und
// alles ist verschwunden; dann kommt Regen und baut die Szene von vorne auf“) ----
// Ablauf je Lauf (≈ 1 Min. 50 s): Wolken und Regen füllen das Becken → Sand, Pflanzen wachsen, Muscheln und Seestern erscheinen, Fische
// schwimmen, Luftblasen steigen → der Helmtaucher stapft herein (Schlauch nach oben zur Pumpe) → das Seepferdchen schreibt den Vornamen →
// ein Taucher schwimmt vorbei → er kommt wieder, taucht zum Stöpsel und zieht („Plopp!“) → Strudel, das Wasser läuft ab und nimmt alles mit
// → leer → nächster Lauf beginnt wieder mit Regen. Nur Bild – nichts wird gespeichert oder gesendet.
const JZB_UW_ZIEHEN = 84, JZB_UW_ABLAUF = 9, JZB_UW_LEER = 3.5; // Sekunde, ab der der Taucher zum Stöpsel schwimmt; Ablaufen; leer
const JZB_UW_FISCHE = [
  { k: "#ff7a1a", f: "#ffa04a", s: "#ffffff", sx: [-3, 1.6] }, // Clownfisch
  { k: "#2f6fe0", f: "#ffd23f", s: null }, // Doktorfisch
  { k: "#ffd23f", f: "#ffb703", s: "#ff8c00", sx: [0] },
  { k: "#ff5d8f", f: "#c77dff", s: "#ffd6e8", sx: [-1] },
  { k: "#2ec4b6", f: "#cbf3f0", s: "#0b8a7f", sx: [-2.5, 1.5] },
];
const jzbUwStoepsel = () => { const J = JZB; return { x: Math.min(J.w - JZB_RAND - 14 * J.k, J.w * .86), y: J.h - 5 * J.k }; };
const jzbUwWasserY = (U) => JZB.h - U.pegel * (JZB.h - 3);
function jzbUwNeu() {
  const J = JZB, k = J.k, st = jzbUwStoepsel();
  const xs = [.05, .16, .29, .5, .73, .95].map((f) => Math.max(JZB_RAND + 4, Math.min(J.w - JZB_RAND - 4, J.w * f))).filter((x) => Math.abs(x - st.x) > 16 * k);
  return { pegel: 0, phase: "regen", at: 0, sog: 0, tropfen: [], ringe: [], blasen: [], blasUhr: 0, fische: [], fischUhr: jzbZ(.5, 2),
    pflanzen: xs.map((x, i) => ({ x, h: jzbZ(24, 42) * k, art: i % 2, farbe: jzbW(["#2f9e44", "#40c057", "#2b8a3e", "#69db7c"]), ph: jzbZ(0, 6) })),
    muscheln: [[.11, "faecher", "#f9a8c4"], [.41, "stern", "#ff8c42"], [.61, "schnecke", "#f3d6a8"], [.23, "faecher", "#ffe0b3"]].map(([f, typ, farbe], i) => ({ x: J.w * f, typ, farbe, t0: 9 + i * 1.1 })),
    helm: null, pferd: null, taucher: null, taucherDa: 0, plopp: -1, stoepsel: null };
}
function jzbUwSchritt(F, dt) {
  const J = JZB, k = J.k, U = F.uw || (F.uw = jzbUwNeu()), t = F.t, st = jzbUwStoepsel();
  F.a = 1;
  if (U.phase === "ablauf") {
    U.at += dt; U.sog = Math.min(1, U.at / JZB_UW_ABLAUF); const s = U.sog; U.pegel = 1 - s * s * (3 - 2 * s);
    if (U.at > JZB_UW_ABLAUF + JZB_UW_LEER) { J.fest = null; return jzbLaufEnde(); }
  } else {
    U.pegel = jzbEase((t - 1) / 8);
    if (t > 9) U.phase = "szene";
    if (t > JZB_UW_ZIEHEN + 25) { U.phase = "ablauf"; U.at = 0; } // falls der Taucher nicht ankommt (z. B. Bühne verkleinert)
  }
  const wy = jzbUwWasserY(U);
  // 🌧️ Regen füllt das Becken
  if (t < 8.5 && U.phase !== "ablauf") { const n = Math.random() < dt * J.w * .12 ? 1 + Math.floor(Math.random() * 2) : 0;
    for (let i = 0; i < n; i++) U.tropfen.push({ x: jzbZ(0, J.w), y: jzbZ(4, 14) * k, v: jzbZ(240, 320) }); }
  for (const d of U.tropfen) { d.y += d.v * dt; if (d.y >= wy - 1) { d.weg = true; if (Math.random() < .5) U.ringe.push({ x: d.x, y: wy, r: 1, a: .8 }); } }
  U.tropfen = U.tropfen.filter((d) => !d.weg && d.y < J.h + 6);
  for (const r of U.ringe) { r.r += 14 * dt; r.a -= dt * 1.4; } U.ringe = U.ringe.filter((r) => r.a > 0);
  // 🫧 Luftblasen
  if (U.pegel > .5 && U.sog < .6 && (U.blasUhr -= dt) <= 0) { U.blasUhr = jzbZ(.25, .8); U.blasen.push({ x: jzbZ(JZB_RAND, J.w - JZB_RAND), y: J.h - 6 * k, r: jzbZ(1, 2.6) * k, v: jzbZ(16, 30) * k, ph: jzbZ(0, 6) }); }
  for (const b of U.blasen) { b.y -= b.v * dt; b.ph += dt; b.x += Math.sin(b.ph * 3) * 7 * dt; if (b.y < wy + 2) { b.weg = true; if (U.pegel > .3) U.ringe.push({ x: b.x, y: wy, r: .5, a: .5 }); } }
  U.blasen = U.blasen.filter((b) => !b.weg);
  // 🐠 Fische
  if (U.phase === "szene" && t > 8 && U.fische.length < 8 && (U.fischUhr -= dt) <= 0) {
    U.fischUhr = jzbZ(1.6, 4.5); const dir = Math.random() < .5 ? 1 : -1, art = Math.floor(Math.random() * JZB_UW_FISCHE.length), y0 = jzbZ(wy + 16 * k, J.h - 22 * k);
    const schwarm = Math.random() < .2 ? 4 : 1;
    for (let i = 0; i < schwarm; i++) U.fische.push({ dir, x: (dir > 0 ? -20 : J.w + 20) - dir * i * 12 * k, y0: y0 + (i % 2 ? 6 : -4) * k * (schwarm > 1), v: (schwarm > 1 ? 30 : jzbZ(16, 32)) * k,
      s: (schwarm > 1 ? .7 : jzbZ(.85, 1.35)) * k, art, ph: jzbZ(0, 6) });
  }
  for (const f of U.fische) { f.x += f.dir * f.v * dt; f.ph += dt; }
  U.fische = U.fische.filter((f) => f.x > -40 && f.x < J.w + 40);
  // 🤿 Helmtaucher stapft herein und bleibt stehen
  if (!U.helm && t > 16 && U.phase === "szene") U.helm = { x: J.w + 30 * k, ziel: J.w * .64, schritt: 0, t: 0 };
  if (U.helm) { const H = U.helm; H.t += dt; if (H.x > H.ziel) { H.x = Math.max(H.ziel, H.x - 9 * k * dt); H.schritt += dt * 2.6; }
    if (U.sog < .5 && Math.random() < dt * 1.8) { const v = jzbUwHelmVentil(H); U.blasen.push({ x: v[0], y: v[1], r: jzbZ(1.2, 2.4) * k, v: jzbZ(22, 34) * k, ph: jzbZ(0, 6) }); } }
  // 🐴 Seepferdchen schreibt den Namen
  const name = jzbEisNameText();
  if (!U.pferd && name && t > 25 && U.phase === "szene") {
    const fs = Math.min(15 * k, (J.w * .42) / Math.max(3, name.length * .62)); J.ctx.font = `800 ${fs}px "Comic Sans MS","Trebuchet MS",sans-serif`;
    const breite = J.ctx.measureText(name).width, x0 = Math.max(JZB_RAND + 6, Math.min(J.w * .38 - breite / 2, J.w * .64 - breite - 34 * k)); let cx = x0;
    const buchst = [...name].map((z) => { const w = J.ctx.measureText(z).width, b = { z, x: cx + w / 2 }; cx += w; return b; });
    U.pferd = { x: x0 - 12 * k, ende: x0 + breite + 8 * k, y: J.h - 30 * k, fs, buchst, t: 0 };
  }
  if (U.pferd) { const P = U.pferd; P.t += dt; if (P.x < P.ende) P.x += (P.ende - P.buchst[0].x + 12 * k) / (P.buchst.length * .65 + .8) * dt; }
  // 🤿 Taucher: einmal vorbei – später zum Stöpsel
  if (!U.taucher && U.phase === "szene" && ((t > 44 && U.taucherDa === 0) || (t > JZB_UW_ZIEHEN && U.taucherDa === 1))) {
    U.taucherDa++; U.taucher = { modus: U.taucherDa === 1 ? "vorbei" : "hin", x: -46 * k, y: U.taucherDa === 1 ? J.h * .42 : J.h * .32, ang: 0, t: 0, zt: 0 }; }
  const T = U.taucher;
  if (T) { T.t += dt;
    if (T.modus === "vorbei") { T.x += 30 * k * dt; T.y += Math.sin(T.t * 1.2) * 3 * k * dt; if (T.x > J.w + 50 * k) U.taucher = null; }
    else if (T.modus === "hin") { const zx = st.x - 4.2 * k, zy = st.y - 31 * k, dx = zx - T.x, dy = zy - T.y, d = Math.hypot(dx, dy), v = 32 * k * dt; // Hand kommt an die Kette
      T.ang += ((d < 45 * k ? 1.05 : 0) - T.ang) * Math.min(1, dt * 2);
      if (d <= v) { T.x = zx; T.y = zy; T.y0 = zy; T.modus = "zieht"; } else { T.x += dx / d * v; T.y += dy / d * v; } }
    else if (T.modus === "zieht") { T.ang += (1.05 - T.ang) * Math.min(1, dt * 3); T.zt += dt; T.y = T.y0 + Math.sin(T.zt * 9) * 1.4 * k - Math.min(1, T.zt / 1.8) * 3 * k; // zerrt an der Kette
      if (T.zt > 1.8 && U.phase !== "ablauf") { U.phase = "ablauf"; U.at = 0; U.plopp = 0; T.modus = "weg"; } }
    else if (T.modus === "weg") { T.y -= 6 * k * dt; T.ang += (.3 - T.ang) * Math.min(1, dt); }
    if (U.sog < .5 && T.modus !== "zieht" && Math.random() < dt * 2.4) { const m = jzbUwTaucherMund(T); U.blasen.push({ x: m[0], y: m[1], r: jzbZ(1, 2.2) * k, v: jzbZ(24, 36) * k, ph: jzbZ(0, 6) }); }
  }
  if (U.plopp >= 0) U.plopp += dt;
}
// Sog beim Ablaufen: alles dreht sich spiralförmig zum Stöpsel und wird kleiner; nie über der sinkenden Wasseroberfläche
function jzbUwSog(U, x, y) {
  if (!U.sog) return [x, y, 1];
  const J = JZB, st = jzbUwStoepsel(), e = Math.min(1, U.sog * U.sog * 1.15), w = e * 4.2, dx = x - st.x, dy = y - st.y, r = 1 - e;
  const nx = st.x + (dx * Math.cos(w) - dy * Math.sin(w) * .4) * r, ny = st.y + (dx * Math.sin(w) * .25 + dy * Math.cos(w)) * r;
  return [nx, Math.max(ny, jzbUwWasserY(U) + 3 * J.k * r), Math.max(0, r)];
}
function jzbUwHelmVentil(H) { const J = JZB, k = J.k * 1.05; return [H.x + 4 * k, J.h - 7 * J.k - 47 * k]; }
function jzbUwTaucherMund(T) { const k = JZB.k * .95, c = Math.cos(T.ang), s = Math.sin(T.ang); return [T.x + (19 * c - 1 * s) * k, T.y + (19 * s + 1 * c) * k]; }
function jzbUwHand(T) { const k = JZB.k * .95, c = Math.cos(T.ang), s = Math.sin(T.ang); return [T.x + (21 * c - 7 * s) * k, T.y + (21 * s + 7 * c) * k]; }
function jzbUwFischMalen(c, f, x, y, sc) {
  const A = JZB_UW_FISCHE[f.art], sw = Math.sin(f.ph * 9) * .3;
  c.save(); c.translate(x, y); c.scale(f.dir * sc, sc);
  c.fillStyle = A.f; c.beginPath(); c.moveTo(-6, 0); c.lineTo(-11.5, -4.6 + sw * 3); c.lineTo(-10, 0); c.lineTo(-11.5, 4.6 + sw * 3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-3.5, -4); c.quadraticCurveTo(0, -8, 3.5, -4.2); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-1, 3.8); c.quadraticCurveTo(1, 6.6, 2.8, 4); c.closePath(); c.fill();
  c.fillStyle = A.k; c.beginPath(); c.ellipse(0, 0, 7.6, 4.7, 0, 0, 7); c.fill();
  if (A.s) { c.fillStyle = A.s; for (const sx of A.sx) { c.beginPath(); c.ellipse(sx, 0, 1.15, 4.5 * Math.sqrt(Math.max(0, 1 - (sx / 7.6) ** 2)), 0, 0, 7); c.fill(); } }
  c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(1, -2.2, 4, 1.2, -.1, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(4.4, -1.2, 1.5, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(4.8, -1.2, .8, 0, 7); c.fill();
  c.restore();
}
function jzbUwPferdMalen(c, x, y, sc, t) { // Seepferdchen von der Seite, Blick nach rechts, Rückenflosse flattert
  c.save(); c.translate(x, y); c.scale(sc, sc); c.lineCap = "round";
  c.strokeStyle = "#f08c00"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-.6, 4); c.quadraticCurveTo(-1.6, 9, .4, 11.2); c.arc(1.6, 10.6, 1.4, Math.PI * .85, Math.PI * 2.6); c.stroke(); // Ringelschwanz
  const fl = Math.sin(t * 22) * .35; c.fillStyle = "rgba(255,236,170,.9)"; c.beginPath(); c.moveTo(-2.6, -1.5); c.lineTo(-5.4, -2.6 + fl); c.lineTo(-5.6, 1 - fl); c.lineTo(-2.8, 2); c.closePath(); c.fill();
  c.fillStyle = "#ffb23f"; c.beginPath(); c.ellipse(0, 0, 3, 5.2, .18, 0, 7); c.fill();
  c.fillStyle = "#ffd77a"; c.beginPath(); c.ellipse(1.1, .6, 1.4, 3.6, .18, 0, 7); c.fill();
  c.fillStyle = "#ffb23f"; c.beginPath(); c.ellipse(1, -6, 2.6, 2.3, 0, 0, 7); c.fill(); // Kopf
  c.strokeStyle = "#ffb23f"; c.lineWidth = 1.9; c.beginPath(); c.moveTo(2.6, -6.3); c.lineTo(6.6, -5.7); c.stroke(); // Schnauze
  c.fillStyle = "#f08c00"; c.beginPath(); c.moveTo(-.4, -8); c.lineTo(.4, -9.8); c.lineTo(1.6, -8); c.closePath(); c.fill(); // Krönchen
  c.strokeStyle = "rgba(200,100,0,.5)"; c.lineWidth = .5; for (const yy of [-2.5, -.5, 1.5, 3.5]) { c.beginPath(); c.moveTo(-2.4, yy); c.lineTo(2.2, yy + .5); c.stroke(); }
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(1.8, -6.6, .65, 0, 7); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(2, -6.85, .25, 0, 7); c.fill();
  c.restore();
}
function jzbUwHelmMalen(c, H, x, yb, sc, U) { // Helmtaucher: dicker Kupferhelm mit runden Fenstern, Schulterplatte, Bleigürtel, schwere Stiefel
  const k = sc, g = H.x > H.ziel ? Math.sin(H.schritt * Math.PI) : 0, T = JZB.T;
  c.save(); c.translate(x, yb); c.scale(k, k); c.lineCap = "round"; c.lineJoin = "round";
  for (const s of [-1, 1]) { const sw = g * s * 3; // Beine mit Stiefeln (gehen langsam, nach links)
    c.fillStyle = "#8d7b5a"; c.fillRect(s * 2.6 - 2.1 - sw * .5, -16, 4.2, 12);
    c.fillStyle = "#2b2b2b"; c.beginPath(); c.roundRect ? c.roundRect(-6 + s * 2.6 - sw, -4.5, 6.4, 4.5, 1.2) : c.rect(-6 + s * 2.6 - sw, -4.5, 6.4, 4.5); c.fill(); }
  c.fillStyle = "#9c8a66"; c.beginPath(); c.roundRect ? c.roundRect(-8.5, -31, 17, 17, 4) : c.rect(-8.5, -31, 17, 17); c.fill(); // Anzug
  c.fillStyle = "#444"; c.fillRect(-8.8, -17.5, 17.6, 2.8); c.fillStyle = "#666"; for (const bx of [-6.5, -2, 2.5, 7]) c.fillRect(bx - 1.4, -18.2, 2.8, 4.2); // Bleigürtel
  const arm = (s) => { const sw = g * s * 2.5; c.strokeStyle = "#9c8a66"; c.lineWidth = 4.2; c.beginPath(); c.moveTo(s * 7.5, -28); c.lineTo(s * 9.5 - sw, -20); c.stroke();
    c.fillStyle = "#6b5b3e"; c.beginPath(); c.arc(s * 9.6 - sw, -19.2, 2.2, 0, 7); c.fill(); };
  arm(1);
  const hg = c.createLinearGradient(-10, -50, 10, -30); hg.addColorStop(0, "#f2c66d"); hg.addColorStop(.55, "#c98a2e"); hg.addColorStop(1, "#8a5a1a");
  c.fillStyle = hg; c.beginPath(); c.ellipse(0, -30, 11.5, 4.2, 0, Math.PI, 0); c.fill(); // Schulterplatte
  c.beginPath(); c.arc(0, -39.5, 9.4, 0, 7); c.fill(); // Helm
  c.fillStyle = "#7a4e14"; for (const a of [0, 1, 2, 3, 4, 5, 6, 7]) { const w = a / 8 * Math.PI * 2; c.beginPath(); c.arc(-4.2 + Math.cos(w) * 5.6, -39.5 + Math.sin(w) * 5.6, .55, 0, 7); c.fill(); } // Schrauben
  c.fillStyle = "#b07a2a"; c.beginPath(); c.arc(-4.2, -39.5, 5, 0, 7); c.fill(); // Fensterrahmen (Blick nach links)
  const gg = c.createRadialGradient(-5.4, -41, .5, -4.2, -39.5, 4.2); gg.addColorStop(0, "#9fd8ff"); gg.addColorStop(1, "#1f5d8a"); c.fillStyle = gg; c.beginPath(); c.arc(-4.2, -39.5, 3.9, 0, 7); c.fill();
  c.fillStyle = "rgba(255,220,190,.55)"; c.beginPath(); c.arc(-4.4, -39, 2.2, 0, 7); c.fill(); c.fillStyle = "#222"; for (const ex of [-5.4, -3.6]) { c.beginPath(); c.arc(ex, -39.6, .38, 0, 7); c.fill(); } // Gesicht
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = .7; c.beginPath(); c.arc(-4.6, -40.2, 2.6, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
  c.fillStyle = "#b07a2a"; c.beginPath(); c.arc(4.6, -42.5, 2.3, 0, 7); c.fill(); c.fillStyle = "#1f5d8a"; c.beginPath(); c.arc(4.6, -42.5, 1.4, 0, 7); c.fill(); // Seitenfenster
  c.fillStyle = "#8a5a1a"; c.fillRect(3.2, -50, 2.4, 3.4); c.fillRect(7.2, -41.5, 3.6, 2.8); // Ventil oben, Schlauchanschluss hinten
  arm(-1);
  c.restore(); void T; void U;
}
function jzbUwTaucherMalen(c, T, x, y, sc) { // Taucher mit Flossen, gelber Flasche, Maske und Atemregler (Blick in Schwimmrichtung nach rechts)
  const kick = Math.sin(T.t * (T.modus === "zieht" ? 4 : 7)) * .35;
  c.save(); c.translate(x, y); c.rotate(T.ang); c.scale(sc, sc); c.lineCap = "round"; c.lineJoin = "round";
  for (const s of [-1, 1]) { const w = kick * s; c.save(); c.translate(-9, s * 1.4); c.rotate(w * .5);
    c.strokeStyle = "#1f2a33"; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(-12, s * .6); c.stroke();
    c.fillStyle = s > 0 ? "#1e88e5" : "#1565c0"; c.beginPath(); c.moveTo(-11.5, s * .6 - 1.8); c.lineTo(-20, s * .6 - 3.6 + w * 3); c.lineTo(-20, s * .6 + 3.6 + w * 3); c.lineTo(-11.5, s * .6 + 1.8); c.closePath(); c.fill(); c.restore(); }
  c.fillStyle = "#f4c430"; c.beginPath(); c.roundRect ? c.roundRect(-9, -8.2, 15, 4.6, 2.2) : c.rect(-9, -8.2, 15, 4.6); c.fill(); // Flasche
  c.fillStyle = "#555"; c.fillRect(6, -7.4, 2.2, 3);
  c.fillStyle = "#1f2a33"; c.beginPath(); c.ellipse(0, 0, 11, 4.6, 0, 0, 7); c.fill(); // Körper im Neopren
  c.fillStyle = "#e63946"; c.fillRect(-5, -4.4, 2.2, 8.8);
  const greift = T.modus === "zieht"; c.strokeStyle = "#1f2a33"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(7, 1.5); greift ? c.lineTo(21, 7) : c.lineTo(1, 5); c.stroke(); // Arm
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(greift ? 21 : 1, greift ? 7 : 5, 1.4, 0, 7); c.fill();
  c.fillStyle = "#1f2a33"; c.beginPath(); c.arc(14, -.8, 4.2, 0, 7); c.fill(); // Kopf mit Haube
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(15.6, .2, 2.4, -1.2, 1.6); c.fill();
  c.fillStyle = "#6ec6ff"; c.strokeStyle = "#111"; c.lineWidth = .9; c.beginPath(); c.roundRect ? c.roundRect(15, -3.2, 3.6, 2.8, .9) : c.rect(15, -3.2, 3.6, 2.8); c.fill(); c.stroke(); // Maske
  c.strokeStyle = "#333"; c.lineWidth = 1; c.beginPath(); c.moveTo(7.5, -6); c.quadraticCurveTo(14, -7, 18.5, 1.2); c.stroke(); c.fillStyle = "#333"; c.beginPath(); c.arc(18.6, 1.3, 1, 0, 7); c.fill(); // Regler
  c.restore();
}
function jzbUwMuschelMalen(c, m, x, y, sc) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  if (m.typ === "faecher") { c.fillStyle = m.farbe; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 6, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fill();
    c.strokeStyle = "rgba(150,70,90,.45)"; c.lineWidth = .6; for (let i = 1; i < 6; i++) { const w = Math.PI * (1.05 + .9 * i / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(w) * 6, Math.sin(w) * 6); c.stroke(); }
    c.fillStyle = m.farbe; c.fillRect(-1.6, -.4, 3.2, 1.6); }
  else if (m.typ === "stern") { c.fillStyle = m.farbe; c.beginPath(); for (let i = 0; i < 10; i++) { const w = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.2 : 5.6; c.lineTo(Math.cos(w) * r, Math.sin(w) * r * .8 - 2.4); } c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 5; i++) { const w = -Math.PI / 2 + i * Math.PI * .4; c.beginPath(); c.arc(Math.cos(w) * 3, Math.sin(w) * 2.4 - 2.4, .45, 0, 7); c.fill(); } }
  else { c.fillStyle = m.farbe; c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-3, -6.5, 3, -4.5); c.quadraticCurveTo(6, -2, 5, 0); c.closePath(); c.fill();
    c.strokeStyle = "rgba(140,90,40,.55)"; c.lineWidth = .7; c.beginPath(); c.arc(1.5, -2.4, 1.6, 0, 6); c.arc(1.5, -2.4, 3, 0, 4.5); c.stroke(); }
  c.restore();
}
function jzbUnterwasserMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, U = F.uw; if (!U) return;
  const t = F.t, wy = jzbUwWasserY(U), st = jzbUwStoepsel(), wolke = Math.min(1, t / 1.5, Math.max(0, (9.5 - t) / 1.5));
  if (wolke > 0 && U.phase !== "ablauf") { c.save(); c.globalAlpha *= wolke; c.fillStyle = "rgba(120,130,150,.85)"; // Regenwolken
    for (const [fx, fy, r] of [[.18, 10, 9], [.27, 8, 12], [.36, 11, 8], [.62, 9, 10], [.72, 7, 13], [.82, 10, 9]]) { c.beginPath(); c.arc(J.w * fx, fy * k, r * k, 0, 7); c.fill(); } c.restore(); }
  c.strokeStyle = "rgba(170,210,255,.85)"; c.lineWidth = 1.1; c.lineCap = "round"; // Regentropfen
  for (const d of U.tropfen) { c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - .8, d.y + 6 * k); c.stroke(); }
  if (U.pegel <= 0.002) return;
  const welle = (x) => wy + Math.sin(x * .045 + T * 1.8) * 1.3 * k + (U.phase === "ablauf" ? Math.sin(x * .09 - T * 4) * .8 * k : 0);
  const wasser = () => { c.beginPath(); c.moveTo(0, J.h + 2); for (let x = 0; x <= J.w + 6; x += 6) c.lineTo(x, welle(x)); c.lineTo(J.w, J.h + 2); c.closePath(); };
  const g = c.createLinearGradient(0, wy, 0, J.h); g.addColorStop(0, "rgba(70,175,225,.5)"); g.addColorStop(1, "rgba(10,75,145,.72)");
  c.fillStyle = g; wasser(); c.fill();
  c.save(); wasser(); c.clip();
  c.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 3; i++) { const x0 = ((T * 9 + i * J.w * .37) % (J.w + 80)) - 40; c.beginPath(); c.moveTo(x0, wy); c.lineTo(x0 + 18 * k, wy); c.lineTo(x0 - 10 * k, J.h); c.lineTo(x0 - 34 * k, J.h); c.closePath(); c.fill(); } // Lichtstrahlen
  const wachs = jzbEase((t - 5) / 10);
  for (const p of U.pflanzen) { const [bx, by, sc] = jzbUwSog(U, p.x, J.h - 6 * k), h = p.h * wachs * sc; if (h < 1) continue; // grüne Pflanzen wiegen sich
    c.strokeStyle = p.farbe; c.fillStyle = p.farbe; c.lineCap = "round";
    if (p.art === 0) { c.lineWidth = 3.2 * k * sc; c.beginPath(); c.moveTo(bx, by); for (let i = 1; i <= 8; i++) { const f = i / 8; c.lineTo(bx + Math.sin(T * 1.3 + p.ph + f * 3) * 4 * k * f * sc, by - h * f); } c.stroke(); }
    else for (const d of [-2.2, 0, 2.2]) { c.lineWidth = 1.5 * k * sc; c.beginPath(); c.moveTo(bx + d * k * sc, by); c.quadraticCurveTo(bx + (d * 2 + Math.sin(T * 1.6 + p.ph + d) * 3) * k * sc, by - h * .55, bx + (d * 3 + Math.sin(T * 1.6 + p.ph + d) * 5) * k * sc, by - h * (.75 + Math.abs(d) * .05)); c.stroke(); } }
  const sandA = Math.min(1, U.pegel * 1.8); c.fillStyle = `rgba(233,210,154,${sandA})`; c.beginPath(); c.moveTo(0, J.h + 2); // Sand
  for (let x = 0; x <= J.w + 6; x += 6) c.lineTo(x, J.h - 6.5 * k + Math.sin(x * .07) * 1.1 * k); c.lineTo(J.w, J.h + 2); c.closePath(); c.fill();
  for (const m of U.muscheln) { const a = jzbHopp((t - m.t0) / .6); if (a <= 0) continue; const [mx, my, sc] = jzbUwSog(U, m.x, J.h - 3 * k); jzbUwMuschelMalen(c, m, mx, my, k * 1.5 * a * sc); }
  // Stöpsel mit Kette
  const T2 = U.taucher, gezogen = U.phase === "ablauf", hand = T2 && (T2.modus === "zieht" || T2.modus === "weg") ? jzbUwHand(T2) : null;
  c.fillStyle = "#7d8790"; c.beginPath(); c.ellipse(st.x, st.y, 6 * k, 2 * k, 0, 0, 7); c.fill(); c.fillStyle = "#2a2f35"; c.beginPath(); c.ellipse(st.x, st.y, 4.4 * k, 1.3 * k, 0, 0, 7); c.fill();
  const pz = gezogen && hand ? jzbUwSog(U, hand[0], hand[1] + 3 * k) : [st.x, st.y - 1.5 * k, 1];
  if (!gezogen || pz[2] > .05) { const [px, py, ps] = pz; c.fillStyle = "#6b2d1f"; c.beginPath(); c.moveTo(px - 4.6 * k * ps, py); c.lineTo(px + 4.6 * k * ps, py); c.lineTo(px + 3.4 * k * ps, py - 3.4 * k * ps); c.lineTo(px - 3.4 * k * ps, py - 3.4 * k * ps); c.closePath(); c.fill();
    const kx = hand && !gezogen ? hand[0] : px, ky = hand && !gezogen ? hand[1] : py - 10 * k * ps; c.strokeStyle = "#b0b8c0"; c.lineWidth = .9; c.setLineDash([1.6 * k, 1 * k]); c.beginPath(); c.moveTo(px, py - 3.4 * k * ps); c.lineTo(kx, ky); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(kx, ky - 1.2 * k * ps, 1.4 * k * ps, 0, 7); c.stroke(); }
  if (gezogen && U.sog < .97) { const a = Math.sin(Math.PI * U.sog); c.strokeStyle = `rgba(255,255,255,${.55 * a})`; c.lineWidth = 1.2; // Strudel
    for (let r = 0; r < 3; r++) { c.beginPath(); for (let i = 0; i <= 40; i++) { const w = i / 40 * Math.PI * 3 + T * 7 + r * 2.1, rr = (3 + i / 40 * (14 + r * 6)) * k; const x = st.x + Math.cos(w) * rr, y = st.y - 3 * k - i / 40 * (10 + r * 4) * k + Math.sin(w) * rr * .3; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } }
  // Name des Seepferdchens (Blasenschrift)
  const P = U.pferd;
  if (P) { c.font = `800 ${P.fs}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    for (const b of P.buchst) { if (b.x > P.x - 3 * k) break; const [bx, by, sc] = jzbUwSog(U, b.x, P.y + Math.sin(T * 1.5 + b.x * .05) * 1.2 * k); if (sc < .05) continue;
      c.save(); c.translate(bx, by); c.scale(sc, sc); c.lineWidth = 3; c.strokeStyle = "rgba(10,60,120,.75)"; c.strokeText(b.z, 0, 0); c.fillStyle = "#ffffff"; c.fillText(b.z, 0, 0);
      c.fillStyle = "rgba(200,240,255,.8)"; c.beginPath(); c.arc(-P.fs * .18, -P.fs * .22, P.fs * .07, 0, 7); c.fill(); c.restore(); } }
  // Helmtaucher mit Luftschlauch zur Pumpe oben
  if (U.helm) { const H = U.helm, [hx, hy, hs] = jzbUwSog(U, H.x, J.h - 7 * k), sc = k * 1.05 * hs;
    if (hs > .05) { const ax = hx + 9 * sc, ay = hy - 40 * sc; c.strokeStyle = "#3a3a3a"; c.lineWidth = 2.4 * k; c.beginPath(); c.moveTo(ax, ay);
      c.bezierCurveTo(ax + 22 * k, ay - 6 * k + Math.sin(T * .9) * 4 * k, ax + 4 * k, -10, ax + 30 * k, -4); c.stroke();
      c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = .8; c.stroke();
      jzbUwHelmMalen(c, H, hx, hy, sc, U); } }
  for (const f of U.fische) { const [fx, fy, sc] = jzbUwSog(U, f.x, f.y0 + Math.sin(f.ph * 1.7) * 3 * k); if (sc > .05) jzbUwFischMalen(c, f, fx, fy, f.s * sc); }
  if (P) { const [px, py, sc] = jzbUwSog(U, P.x + 6 * k, P.y - 6 * k + Math.sin(T * 2.2) * 2 * k); if (sc > .05) jzbUwPferdMalen(c, px, py, k * 1.05 * sc, T); }
  if (T2) { const [tx, ty, sc] = jzbUwSog(U, T2.x, T2.y); if (sc > .05) jzbUwTaucherMalen(c, { ...T2, ang: T2.ang + (U.sog ? U.sog * 5 : 0) }, tx, ty, k * .95 * sc); }
  for (const b of U.blasen) { c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = .9; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.stroke();
    c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(b.x - b.r * .35, b.y - b.r * .35, b.r * .3, 0, 7); c.fill(); }
  c.restore();
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.2; c.beginPath(); for (let x = 0; x <= J.w + 6; x += 6) { const y = welle(x); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); // Oberfläche
  for (const r of U.ringe) { c.strokeStyle = `rgba(255,255,255,${r.a})`; c.lineWidth = .8; c.beginPath(); c.ellipse(r.x, r.y, r.r * k, r.r * .3 * k, 0, 0, 7); c.stroke(); }
  if (U.plopp >= 0 && U.plopp < 1.6) { c.save(); c.globalAlpha *= Math.min(1, (1.6 - U.plopp) * 2); c.font = `800 ${12 * k}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 3; c.strokeStyle = "rgba(10,60,120,.8)"; c.strokeText("Plopp!", st.x - 14 * k, st.y - 34 * k - U.plopp * 8 * k); c.fillStyle = "#fff"; c.fillText("Plopp!", st.x - 14 * k, st.y - 34 * k - U.plopp * 8 * k); c.restore(); }
}
// ---- 2.444.0 KC-CLUB-WELTRAUM (Wunschliste #2, Wunsch Hansi „Weltraum-Szene … als neues Kopfthema“) ----
// Der Himmel wird dunkel, Sterne funkeln, ein Ringplanet schwebt herein, ein Mond mit Kratern steht oben links, ab und zu eine Sternschnuppe.
// Ein Astronaut schwebt herein und winkt, eine Rakete startet unten und fliegt mit Feuerschweif hinaus. Dann schreibt der Astronaut den
// Vornamen in Sternenschrift unten in den Kopf. Zum Schluss holt ein UFO ihn mit dem Lichtstrahl ab und saust davon – alles wird wieder hell,
// dann beginnt der Lauf von vorn. Nur Bild, nichts wird gespeichert oder gesendet.
const JZB_WR_DAUER = 92, JZB_WR_SCHREIBEN = 30, JZB_WR_UFO = 62; // Sekunden: Lauflänge, Name schreiben, UFO kommt
function jzbWrNeu() {
  const J = JZB, k = J.k, n = Math.min(160, Math.round(J.w * J.h / 900));
  return { sterne: Array.from({ length: n }, () => ({ x: jzbZ(0, J.w), y: jzbZ(0, J.h), r: jzbZ(.4, 1.3) * k, ph: jzbZ(0, 6), v: jzbZ(1.5, 4) })),
    schnuppen: [], schnuppUhr: jzbZ(3, 6), rakete: null, rauch: [], astro: null, schrift: null, ufo: null, funken: [] };
}
function jzbWrSchritt(F, dt) {
  const J = JZB, k = J.k, W = F.wr || (F.wr = jzbWrNeu()), t = F.t;
  F.a = Math.min(1, t / 3, Math.max(0, (JZB_WR_DAUER - t) / 4));
  if (t >= JZB_WR_DAUER) { J.fest = null; return jzbLaufEnde(); }
  for (const s of W.sterne) s.ph += dt * s.v;
  // 🌠 Sternschnuppen
  if ((W.schnuppUhr -= dt) <= 0 && t < JZB_WR_DAUER - 6) { W.schnuppUhr = jzbZ(4, 9); const dir = Math.random() < .5 ? 1 : -1;
    W.schnuppen.push({ x: dir > 0 ? jzbZ(0, J.w * .5) : jzbZ(J.w * .5, J.w), y: jzbZ(4, J.h * .35), vx: dir * jzbZ(170, 240) * k, vy: jzbZ(50, 90) * k, a: 1 }); }
  for (const s of W.schnuppen) { s.x += s.vx * dt; s.y += s.vy * dt; s.a -= dt * 1.1; }
  W.schnuppen = W.schnuppen.filter((s) => s.a > 0);
  // 🚀 Rakete startet unten und fliegt im Bogen hinaus
  if (!W.rakete && t > 16 && t < 18) W.rakete = { t: 0, p0: [J.w * .16, J.h + 24 * k], p1: [J.w * .5, J.h * .3], p2: [J.w + 50 * k, -40 * k] };
  const R = W.rakete;
  if (R && R.t < 1) { R.t += dt / 6.5; const [x, y] = jzbWrBahn(R, Math.min(1, R.t)), [dx, dy] = jzbWrBahn(R, Math.min(1, R.t) + .01);
    R.x = x; R.y = y; R.w = Math.atan2(dy - y, dx - x);
    for (let i = 0; i < 2; i++) W.rauch.push({ x: x - Math.cos(R.w) * 20 * k, y: y - Math.sin(R.w) * 20 * k, r: jzbZ(2.5, 4.5) * k, a: .7, vx: jzbZ(-8, 8) * k, vy: jzbZ(-8, 8) * k }); }
  for (const r of W.rauch) { r.x += r.vx * dt; r.y += r.vy * dt; r.r += 5 * k * dt; r.a -= dt * .55; }
  W.rauch = W.rauch.filter((r) => r.a > 0);
  // 👨‍🚀 Astronaut schwebt herein, winkt, schreibt den Namen, wird vom UFO abgeholt
  if (!W.astro && t > 7) W.astro = { x: -30 * k, y: J.h * .22, dreh: 0, modus: "rein", t: 0, sc: 1 };
  const A = W.astro;
  if (A) { A.t += dt;
    const ziel = (zx, zy, v) => { const dx = zx - A.x, dy = zy - A.y, d = Math.hypot(dx, dy); if (d <= v * dt) { A.x = zx; A.y = zy; return true; } A.x += dx / d * v * dt; A.y += dy / d * v * dt; return false; };
    if (A.modus === "rein") { A.dreh = Math.sin(A.t * .7) * .25; if (ziel(J.w * .68, J.h * .22 + Math.sin(A.t) * 4 * k, 26 * k) || t > JZB_WR_SCHREIBEN) A.modus = "schwebt"; }
    else if (A.modus === "schwebt") { A.dreh = Math.sin(A.t * .6) * .3; A.y = J.h * .22 + Math.sin(A.t) * 4 * k; if (t > JZB_WR_SCHREIBEN) A.modus = jzbEisNameText() ? "runter" : "warten"; }
    else if (A.modus === "runter") { A.dreh += (0 - A.dreh) * Math.min(1, dt * 2); A.sc += (.6 - A.sc) * Math.min(1, dt * 2);
      if (!W.schrift) W.schrift = jzbWrSchriftNeu();
      if (ziel(W.schrift.buchst[0].x - 14 * k, W.schrift.y - 8 * k, 46 * k)) { A.modus = "schreibt"; A.x0 = A.x; } }
    else if (A.modus === "schreibt") { const S = W.schrift, ende = S.buchst[S.buchst.length - 1].x + 12 * k; A.x = Math.min(ende, A.x + (ende - A.x0) / (S.buchst.length * 1.1 + 1.5) * dt); A.y = S.y - 8 * k + Math.sin(A.t * 3) * 1.5 * k;
      if (Math.random() < dt * 14) W.funken.push({ x: A.x + 13 * k * A.sc, y: A.y + 2 * k, vx: jzbZ(-14, 14) * k, vy: jzbZ(-18, 6) * k, a: 1 });
      if (A.x >= ende) A.modus = "hoch"; }
    else if (A.modus === "hoch" || A.modus === "warten") { if (A.modus === "hoch") { A.sc += (1 - A.sc) * Math.min(1, dt); ziel(J.w * .68, J.h * .24, 30 * k); } A.dreh = Math.sin(A.t * .6) * .3; }
    else if (A.modus === "strahl") { A.dreh += dt * 1.6; A.y -= 16 * k * dt; A.sc = Math.max(0, A.sc - dt * .22); A.x += (W.ufo.x - A.x) * Math.min(1, dt * 2); }
  }
  // 🛸 UFO kommt, Lichtstrahl, Astronaut schwebt hinein, weg
  if (!W.ufo && t > JZB_WR_UFO && A) W.ufo = { x: J.w + 40 * k, y: Math.max(14 * k, J.h * .24 - 46 * k), modus: "kommt", t: 0, strahl: 0 };
  const U = W.ufo;
  if (U) { U.t += dt;
    if (U.modus === "kommt") { const zx = A.x; U.x += (zx - U.x) * Math.min(1, dt * 1.4); if (Math.abs(U.x - zx) < 3 * k) { U.modus = "strahlt"; U.t = 0; A.modus = "strahl"; } }
    else if (U.modus === "strahlt") { U.strahl = Math.min(1, U.t / .6); if (A.sc <= .05 || A.y < U.y + 4 * k) { A.weg = true; U.modus = "weg"; U.t = 0; } }
    else { U.strahl = Math.max(0, U.strahl - dt * 3); U.x += (60 + U.t * 420) * k * dt; U.y -= U.t * 30 * k * dt; }
  }
  for (const f of W.funken) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 20 * k * dt; f.a -= dt * 1.4; }
  W.funken = W.funken.filter((f) => f.a > 0);
}
function jzbWrBahn(R, u) { const v = 1 - u; return [v * v * R.p0[0] + 2 * v * u * R.p1[0] + u * u * R.p2[0], v * v * R.p0[1] + 2 * v * u * R.p1[1] + u * u * R.p2[1]]; }
function jzbWrSchriftNeu() { // Vorname unten im freien Streifen (unter den Karten), mittig
  const J = JZB, k = J.k, name = jzbEisNameText(), fs = Math.min(17 * k, (J.w * .5) / Math.max(3, name.length * .62));
  J.ctx.font = `800 ${fs}px "Trebuchet MS","Segoe UI",sans-serif`;
  const breite = J.ctx.measureText(name).width, x0 = Math.max(JZB_RAND + 20 * k, J.w * .5 - breite / 2); let cx = x0;
  return { fs, y: J.h - 15 * k, buchst: [...name].map((z) => { const w = J.ctx.measureText(z).width, b = { z, x: cx + w / 2 }; cx += w; return b; }) };
}
function jzbWrPlanetMalen(c, x, y, r, T) {
  c.save(); c.translate(x, y); c.rotate(-.35);
  c.strokeStyle = "rgba(240,215,170,.75)"; c.lineWidth = r * .22; c.beginPath(); c.ellipse(0, 0, r * 1.9, r * .5, 0, Math.PI, 0); c.stroke(); // Ring hinten
  const g = c.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r); g.addColorStop(0, "#ffe2a8"); g.addColorStop(.6, "#e0a458"); g.addColorStop(1, "#9c5a24");
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.fillStyle = "rgba(150,80,30,.35)"; // Wolkenbänder ziehen
  for (const [by, bh] of [[-.45, .12], [-.1, .16], [.3, .1]]) { c.beginPath(); c.ellipse(Math.sin(T * .2 + by * 9) * r * .1, by * r, r * 1.2, bh * r, 0, 0, 7); c.fill(); } c.restore();
  c.strokeStyle = "rgba(255,235,195,.9)"; c.lineWidth = r * .22; c.beginPath(); c.ellipse(0, 0, r * 1.9, r * .5, 0, 0, Math.PI); c.stroke(); // Ring vorn
  c.restore();
}
function jzbWrMondMalen(c, x, y, r) {
  const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, "#f4f4f0"); g.addColorStop(1, "#a9adb5");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = "rgba(120,124,134,.55)"; for (const [cx, cy, cr] of [[-.35, -.2, .22], [.3, .25, .17], [.15, -.45, .12], [-.1, .45, .1]]) { c.beginPath(); c.arc(x + cx * r, y + cy * r, cr * r, 0, 7); c.fill(); }
}
function jzbWrRaketeMalen(c, R, k) { // Blick in Flugrichtung, Feuer flackert
  c.save(); c.translate(R.x, R.y); c.rotate(R.w); c.scale(k, k);
  const fl = 6 + Math.random() * 5; c.fillStyle = "#ffb703"; c.beginPath(); c.moveTo(-9, -3); c.lineTo(-9 - fl * 1.6, 0); c.lineTo(-9, 3); c.closePath(); c.fill();
  c.fillStyle = "#fff3b0"; c.beginPath(); c.moveTo(-9, -1.6); c.lineTo(-9 - fl * .8, 0); c.lineTo(-9, 1.6); c.closePath(); c.fill();
  c.fillStyle = "#d62828"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-9, s * 3.5); c.lineTo(-12, s * 8); c.lineTo(-4, s * 3.5); c.closePath(); c.fill(); } // Flossen
  c.fillStyle = "#f1f3f5"; c.beginPath(); c.moveTo(-9, -4.2); c.lineTo(6, -4.2); c.quadraticCurveTo(13, -2, 15, 0); c.quadraticCurveTo(13, 2, 6, 4.2); c.lineTo(-9, 4.2); c.closePath(); c.fill();
  c.fillStyle = "#d62828"; c.beginPath(); c.moveTo(8, -3.6); c.quadraticCurveTo(13, -2, 15, 0); c.quadraticCurveTo(13, 2, 8, 3.6); c.closePath(); c.fill(); // Spitze
  c.fillStyle = "#3a86ff"; c.strokeStyle = "#8d99ae"; c.lineWidth = .8; c.beginPath(); c.arc(1, 0, 2.2, 0, 7); c.fill(); c.stroke(); // Bullauge
  c.restore();
}
function jzbWrAstroMalen(c, A, k, T) { // weißer Anzug, Helm mit goldenem Visier, Rucksack; winkt mit dem rechten Arm
  c.save(); c.translate(A.x, A.y); c.rotate(A.dreh); c.scale(k * A.sc, k * A.sc); c.lineCap = "round"; c.lineJoin = "round";
  c.fillStyle = "#ced4da"; c.beginPath(); c.roundRect ? c.roundRect(-9, -6, 5, 13, 2) : c.rect(-9, -6, 5, 13); c.fill(); // Rucksack
  c.strokeStyle = "#f1f3f5"; c.lineWidth = 4.2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 2.2, 6); c.lineTo(s * 3.2 + Math.sin(T * 1.4 + s) * 1.2, 14); c.stroke(); } // Beine
  c.fillStyle = "#adb5bd"; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 3.2 + Math.sin(T * 1.4 + s) * 1.2, 15, 2.3, 0, 7); c.fill(); } // Stiefel
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.roundRect ? c.roundRect(-5.5, -7, 11, 14, 4) : c.rect(-5.5, -7, 11, 14); c.fill(); // Rumpf
  c.fillStyle = "#e63946"; c.fillRect(-2.5, -3, 5, 3); c.fillStyle = "#3a86ff"; c.fillRect(-1, -2.4, 1.2, 1.8); // Brustschild
  c.strokeStyle = "#f1f3f5"; c.lineWidth = 3.6; c.beginPath(); c.moveTo(-5, -4); c.lineTo(-8, 3); c.stroke(); // linker Arm
  const wink = A.modus === "schreibt" ? .2 : Math.sin(T * 5) * .5; c.beginPath(); c.moveTo(5, -4); c.lineTo(9, -9 - wink * 4); c.stroke(); // rechter Arm winkt
  c.fillStyle = "#dee2e6"; c.beginPath(); c.arc(9, -9.5 - wink * 4, 1.9, 0, 7); c.fill();
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.arc(0, -12, 6.5, 0, 7); c.fill(); // Helm
  const g = c.createLinearGradient(-4, -15, 4, -9); g.addColorStop(0, "#ffd166"); g.addColorStop(1, "#c77d0a"); c.fillStyle = g;
  c.beginPath(); c.ellipse(1, -12, 4.4, 3.4, 0, 0, 7); c.fill(); // Visier
  c.fillStyle = "rgba(255,255,255,.75)"; c.beginPath(); c.ellipse(-.4, -13.4, 1.6, .8, -.4, 0, 7); c.fill();
  c.restore();
}
function jzbWrUfoMalen(c, U, k, T, A) {
  if (U.strahl > 0 && A && !A.weg) { const by = A.y + 18 * k * A.sc, g = c.createLinearGradient(0, U.y, 0, by); g.addColorStop(0, `rgba(160,255,180,${.6 * U.strahl})`); g.addColorStop(1, `rgba(160,255,180,${.12 * U.strahl})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(U.x - 5 * k, U.y + 3 * k); c.lineTo(U.x + 5 * k, U.y + 3 * k); c.lineTo(U.x + 16 * k, by); c.lineTo(U.x - 16 * k, by); c.closePath(); c.fill(); }
  c.save(); c.translate(U.x, U.y + Math.sin(T * 2.5) * 1.5 * k); c.scale(k, k);
  c.fillStyle = "rgba(160,220,255,.85)"; c.beginPath(); c.ellipse(0, -3, 6, 5, 0, Math.PI, 0); c.fill(); // Kuppel
  c.fillStyle = "#7ddc8c"; c.beginPath(); c.arc(0, -4, 1.8, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(-.6, -4.3, .35, 0, 7); c.arc(.6, -4.3, .35, 0, 7); c.fill(); // kleines grünes Männchen
  const g = c.createLinearGradient(0, -4, 0, 4); g.addColorStop(0, "#e9ecef"); g.addColorStop(1, "#6c757d"); c.fillStyle = g;
  c.beginPath(); c.ellipse(0, 0, 15, 4.2, 0, 0, 7); c.fill();
  for (let i = 0; i < 5; i++) { c.fillStyle = (Math.floor(T * 6) + i) % 2 ? "#ffd166" : "#ff4d6d"; c.beginPath(); c.arc(-10 + i * 5, .6, 1.1, 0, 7); c.fill(); } // Lichter blinken
  c.restore();
}
function jzbWeltraumMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, W = F.wr; if (!W) return;
  const t = F.t;
  c.fillStyle = "rgba(4,8,30,.62)"; c.fillRect(0, 0, J.w, J.h); // Nachthimmel über der Kopffarbe
  for (const s of W.sterne) { c.globalAlpha = F.a * (.45 + .55 * Math.abs(Math.sin(s.ph))); c.fillStyle = "#fff"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); }
  c.globalAlpha = F.a;
  jzbWrMondMalen(c, J.w * .5, 17 * k, 10 * k); // oben in der Mitte (links das Logo, rechts der Planet)
  const px = J.w + 60 * k - (J.w + 60 * k - J.w * .84) * jzbEase((t - 1) / 9); jzbWrPlanetMalen(c, px, J.h * .14 + Math.sin(T * .3) * 3 * k, 19 * k, T);
  for (const s of W.schnuppen) { const g = c.createLinearGradient(s.x, s.y, s.x - s.vx * .18, s.y - s.vy * .18); g.addColorStop(0, `rgba(255,255,255,${s.a})`); g.addColorStop(1, "rgba(255,255,255,0)");
    c.strokeStyle = g; c.lineWidth = 1.4; c.lineCap = "round"; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * .18, s.y - s.vy * .18); c.stroke(); }
  for (const r of W.rauch) { c.fillStyle = `rgba(220,225,235,${r.a * .6})`; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.fill(); }
  if (W.rakete && W.rakete.t < 1 && W.rakete.x != null) jzbWrRaketeMalen(c, W.rakete, k * 1.5);
  const S = W.schrift, A = W.astro; // Name in Sternenschrift – leuchtet auf, wo der Astronaut vorbeikommt
  if (S) { c.font = `800 ${S.fs}px "Trebuchet MS","Segoe UI",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    for (const b of S.buchst) { if (A && !A.weg && A.modus === "schreibt" && b.x > A.x) break; if (A && (A.modus === "runter")) break;
      const fun = .75 + .25 * Math.sin(T * 3 + b.x * .1); c.shadowColor = "rgba(255,230,140,.9)"; c.shadowBlur = 8 * k * fun;
      c.lineWidth = 2.6; c.strokeStyle = "rgba(20,30,80,.8)"; c.strokeText(b.z, b.x, S.y); c.fillStyle = "#fff6c8"; c.fillText(b.z, b.x, S.y); c.shadowBlur = 0;
      const sx = b.x + S.fs * .28, sy = S.y - S.fs * .38, sr = S.fs * .1 * fun; c.fillStyle = "#fff"; c.beginPath(); // kleines Funkeln je Buchstabe
      c.moveTo(sx, sy - sr * 2); c.lineTo(sx + sr * .5, sy); c.lineTo(sx, sy + sr * 2); c.lineTo(sx - sr * .5, sy); c.closePath(); c.fill(); } }
  for (const f of W.funken) { c.fillStyle = `rgba(255,236,150,${f.a})`; c.beginPath(); c.arc(f.x, f.y, 1.2 * k, 0, 7); c.fill(); }
  if (W.ufo) jzbWrUfoMalen(c, W.ufo, k * 1.5, T, A);
  if (A && !A.weg && A.sc > .03) jzbWrAstroMalen(c, A, k * 1.6, T);
}
// ---- 2.445.0 KC-CLUB-BAUERNHOF (Wunschliste #3, Wunsch Hansi „Bauern-Szene mit Kuh, Schwein, Hahn, Stroh, Traktor“) ----
// Ein Tag auf dem Hof: Morgens geht die Sonne auf und der Hahn auf dem Zaunpfosten kräht. Kuh, Schwein und Hühner kommen auf die Wiese,
// das Schwein suhlt sich in der Pfütze. Der Traktor bringt Stroh und lädt einen Ballen ab, danach steht ein Holzschild mit dem Vornamen
// („Hof Max“). Abends wird der Himmel orange, alle Tiere gehen in den Stall, das Tor geht zu, im Fenster brennt Licht; nachts Mond und
// Sterne, der Hahn schläft. Danach wird es wieder Morgen – der Lauf beginnt von vorn, ohne Bruch. Nur Bild, nichts wird gespeichert.
const JZB_BH_DAUER = 104, JZB_BH_ABEND = 70, JZB_BH_NACHT = 86; // Sekunden: Lauflänge, Abend (Tiere in den Stall), Nacht
function jzbBhStall() { const J = JZB, k = J.k; return { x: J.w - JZB_RAND - 30 * k, b: 46 * k, h: 30 * k, tuer: J.w - JZB_RAND - 30 * k }; }
function jzbBhNeu() {
  const J = JZB, k = J.k, n = Math.min(80, Math.round(J.w * J.h / 1600));
  const tier = (art, x, v) => ({ art, x, ziel: jzbZ(J.w * .2, J.w * .62), dir: 1, v: v * k, ph: jzbZ(0, 6), pause: 0, drin: false, da: false });
  return { sterne: Array.from({ length: n }, () => ({ x: jzbZ(0, J.w), y: jzbZ(0, J.h * .5), r: jzbZ(.4, 1.1) * k, ph: jzbZ(0, 6) })),
    wolken: [0, 1, 2].map((i) => ({ x: jzbZ(0, J.w), y: jzbZ(14, 40) * k + i * 8 * k, s: jzbZ(.8, 1.3), v: jzbZ(4, 9) * k })),
    voegel: [], vogelUhr: jzbZ(8, 14), kraeht: -1, krahtZahl: 0,
    tiere: [tier("kuh", -40 * k, 9), tier("schwein", J.w + 30 * k, 11), tier("huhn", -20 * k, 14), tier("huhn", -34 * k, 13)],
    ballen: [{ x: JZB_RAND + 38 * k, s: 1 }], traktor: null, schild: null, tor: 1, pfuetze: J.w * .56 };
}
function jzbBhSchritt(F, dt) {
  const J = JZB, k = J.k, B = F.bh || (F.bh = jzbBhNeu()), t = F.t, st = jzbBhStall();
  F.a = 1;
  if (t >= JZB_BH_DAUER) { J.fest = null; return jzbLaufEnde(); }
  for (const s of B.sterne) s.ph += dt * 2;
  for (const w of B.wolken) { w.x += w.v * dt; if (w.x > J.w + 40 * k) w.x = -40 * k; }
  // 🐓 Hahn kräht morgens (zweimal) – bei Tagesanbruch
  if (B.krahtZahl < 2 && t > 3 + B.krahtZahl * 9) { B.kraeht = 0; B.krahtZahl++; }
  if (B.kraeht >= 0) { B.kraeht += dt; if (B.kraeht > 2.6) B.kraeht = -1; }
  // 🐦 Vögel ziehen tagsüber oben vorbei
  if (t > 10 && t < JZB_BH_ABEND && (B.vogelUhr -= dt) <= 0) { B.vogelUhr = jzbZ(10, 18); const y = jzbZ(20, 50) * k;
    for (let i = 0; i < 3; i++) B.voegel.push({ x: -20 * k - i * 14 * k, y: y + (i % 2) * 6 * k, ph: jzbZ(0, 6) }); }
  for (const v of B.voegel) { v.x += 34 * k * dt; v.ph += dt * 8; } B.voegel = B.voegel.filter((v) => v.x < J.w + 30 * k);
  // 🐄🐖🐔 Tiere: kommen herein, laufen hin und her; abends in den Stall
  const abend = t > JZB_BH_ABEND, links = JZB_RAND + 40 * k, rechts = st.x - st.b / 2 - 16 * k;
  B.tiere.forEach((T, i) => { if (T.drin) return;
    const start = [5, 9, 13, 14][i]; if (t < start) return; T.da = true; T.ph += dt;
    if (abend) { T.ziel = st.tuer; T.pause = 0; }
    if (T.pause > 0) { T.pause -= dt; return; }
    const d = T.ziel - T.x; if (Math.abs(d) < 2) { if (abend) { if (B.tor > .5) T.drin = true; return; }
      T.pause = T.art === "huhn" ? jzbZ(1, 3) : jzbZ(3, 8); T.ziel = T.art === "schwein" && Math.random() < .5 ? B.pfuetze : jzbZ(links, rechts); return; }
    T.dir = Math.sign(d); T.x += T.dir * Math.min(Math.abs(d), T.v * (abend ? 1.6 : 1) * dt); });
  // Stalltor: tagsüber offen, schließt, wenn alle Tiere drin sind (oder spätestens zur Nacht)
  const alleDrin = B.tiere.every((T) => T.drin || !T.da);
  if (abend && (alleDrin || t > JZB_BH_NACHT + 4)) { B.tor = Math.max(0, B.tor - dt * .8); if (t > JZB_BH_NACHT + 4) B.tiere.forEach((T) => { T.drin = true; }); }
  else if (!abend) B.tor = Math.min(1, B.tor + dt);
  // 🚜 Traktor mit Strohwagen: fährt durch und lädt einen Ballen ab
  if (!B.traktor && t > 20 && t < 22) B.traktor = { x: -70 * k, halt: 0, abgeladen: false };
  const R = B.traktor;
  if (R) { const ablage = J.w * .3;
    if (!R.abgeladen && R.x - 30 * k >= ablage) { R.halt += dt; if (R.halt > 1.4) { R.abgeladen = true; B.ballen.push({ x: ablage, s: 0 }); } }
    else R.x += 26 * k * dt;
    if (R.x > J.w + 80 * k) B.traktor = null; }
  for (const b of B.ballen) b.s = Math.min(1, b.s + dt * 2);
  // 🪧 Schild mit dem Vornamen
  const name = jzbEisNameText();
  if (!B.schild && name && t > 34) B.schild = { t: 0, text: "Hof " + name };
  if (B.schild) B.schild.t += dt;
}
// Himmel je Tageszeit: Morgenrot → Tag → Abendrot → Nacht → Morgen (der nächste Lauf beginnt in der Nacht und wird hell)
function jzbBhHimmel(t) {
  const m = (a, b, x) => a + (b - a) * Math.max(0, Math.min(1, x));
  if (t < 8) return { nacht: m(.6, 0, t / 6), rot: Math.sin(Math.min(1, t / 8) * Math.PI) * .3, sonne: m(0, 1, (t - 1) / 7) };
  if (t < JZB_BH_ABEND) return { nacht: 0, rot: 0, sonne: 1 };
  if (t < JZB_BH_NACHT) { const x = (t - JZB_BH_ABEND) / (JZB_BH_NACHT - JZB_BH_ABEND); return { nacht: m(0, .6, (x - .4) / .6), rot: Math.sin(x * Math.PI) * .35, sonne: m(1, 0, x * 1.2) }; }
  return { nacht: .6, rot: 0, sonne: 0 };
}
function jzbBhKuhMalen(c, x, y, sc, dir, ph, laeuft) {
  c.save(); c.translate(x, y); c.scale(dir * sc, sc); c.lineCap = "round";
  const sw = laeuft ? Math.sin(ph * 7) * 2 : 0;
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 2.2; for (const [bx, s] of [[-8, 1], [-5, -1], [6, -1], [9, 1]]) { c.beginPath(); c.moveTo(bx, -6); c.lineTo(bx + sw * s, 0); c.stroke(); } // Beine
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.roundRect ? c.roundRect(-11, -15, 23, 11, 5) : c.rect(-11, -15, 23, 11); c.fill(); // Rumpf
  c.fillStyle = "#2b2b2b"; for (const [fx, fy, fr] of [[-6, -11, 3.2], [3, -12, 2.6], [8, -8, 2]]) { c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fill(); } // Flecken
  c.fillStyle = "#f4a6b8"; c.beginPath(); c.ellipse(1, -4, 2.6, 1.6, 0, 0, 7); c.fill(); // Euter
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 1; c.beginPath(); c.moveTo(-11, -13); c.quadraticCurveTo(-15, -9 + Math.sin(ph * 3) * 2, -14, -5); c.stroke(); // Schwanz
  const kopfY = laeuft ? -15 : -9 + Math.sin(ph * 1.5) * 1.5; // grast mit gesenktem Kopf
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.ellipse(15, kopfY, 4.6, 4, .3, 0, 7); c.fill();
  c.fillStyle = "#f4a6b8"; c.beginPath(); c.ellipse(18, kopfY + 2, 2.6, 2, .3, 0, 7); c.fill(); // Maul
  c.fillStyle = "#e9c46a"; c.beginPath(); c.moveTo(13, kopfY - 3.5); c.lineTo(12, kopfY - 6.5); c.lineTo(14.5, kopfY - 4); c.fill(); // Horn
  c.fillStyle = "#111"; c.beginPath(); c.arc(15.6, kopfY - 1, .8, 0, 7); c.fill();
  c.restore();
}
function jzbBhSchweinMalen(c, x, y, sc, dir, ph, laeuft, dreckig) {
  c.save(); c.translate(x, y); c.scale(dir * sc, sc); c.lineCap = "round";
  const sw = laeuft ? Math.sin(ph * 9) * 1.6 : 0;
  c.strokeStyle = "#e5899c"; c.lineWidth = 2.2; for (const [bx, s] of [[-6, 1], [-3, -1], [4, -1], [7, 1]]) { c.beginPath(); c.moveTo(bx, -4); c.lineTo(bx + sw * s, 0); c.stroke(); }
  c.fillStyle = "#f7a8b8"; c.beginPath(); c.ellipse(0, -8, 10, 6.4, 0, 0, 7); c.fill(); // Rumpf
  if (dreckig) { c.fillStyle = "rgba(110,75,40,.75)"; for (const [fx, fy, fr] of [[-4, -5, 2.6], [3, -4, 2], [-1, -10, 1.6]]) { c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fill(); } }
  c.strokeStyle = "#e5899c"; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, -9); c.arc(-11.5, -9.5, 1.4, 0, Math.PI * 1.7); c.stroke(); // Ringelschwanz
  c.fillStyle = "#f7a8b8"; c.beginPath(); c.arc(10, -9, 4.4, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#ef8fa3"; c.beginPath(); c.moveTo(8, -12.5); c.lineTo(9.5, -15.5); c.lineTo(11, -12.5); c.fill(); // Ohr
  c.fillStyle = "#ef8fa3"; c.beginPath(); c.ellipse(14, -8.4, 1.8, 2.2, 0, 0, 7); c.fill(); c.fillStyle = "#b5546a"; c.beginPath(); c.arc(14.2, -9, .45, 0, 7); c.arc(14.2, -7.8, .45, 0, 7); c.fill(); // Rüssel
  c.fillStyle = "#111"; c.beginPath(); c.arc(11, -10.4, .7, 0, 7); c.fill();
  c.restore();
}
function jzbBhHuhnMalen(c, x, y, sc, dir, ph, pickt, hahn) {
  c.save(); c.translate(x, y); c.scale(dir * sc, sc); c.lineCap = "round";
  c.strokeStyle = "#f4a261"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1, -3); c.lineTo(-1.5, 0); c.moveTo(1.5, -3); c.lineTo(2, 0); c.stroke(); // Beine
  if (hahn) { const sf = ["#2a9d8f", "#264653", "#e76f51"]; sf.forEach((f, i) => { c.strokeStyle = f; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -7); c.quadraticCurveTo(-9 - i, -13 + i * 2, -8 + i, -5 + i); c.stroke(); }); } // Schwanzfedern
  c.fillStyle = hahn ? "#c1440e" : "#fff8e7"; c.beginPath(); c.ellipse(0, -6, 5, 3.6, 0, 0, 7); c.fill(); // Körper
  const kx = pickt ? 5 : 4, ky = pickt ? -3 + Math.abs(Math.sin(ph * 6)) * -2 : -10;
  c.beginPath(); c.arc(kx, ky, 2.4, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#e63946"; c.beginPath(); c.arc(kx - .4, ky - 2.4, 1.1, 0, 7); c.arc(kx + .8, ky - 2.2, 1, 0, 7); c.fill(); // Kamm
  c.beginPath(); c.ellipse(kx + 1.6, ky + 1.8, .7, 1.1, 0, 0, 7); c.fill(); // Kehllappen
  c.fillStyle = "#f4a261"; c.beginPath(); c.moveTo(kx + 2, ky - .6); c.lineTo(kx + 4.4, ky + .2); c.lineTo(kx + 2, ky + .8); c.fill(); // Schnabel
  c.fillStyle = "#111"; c.beginPath(); c.arc(kx + .6, ky - .4, .5, 0, 7); c.fill();
  c.restore();
}
function jzbBhTraktorMalen(c, R, y, k) {
  c.save(); c.translate(R.x, y); c.scale(k, k); const rad = R.halt > 0 && !R.abgeladen ? 0 : R.x * .25 / k;
  const reifen = (x, yy, r) => { c.fillStyle = "#222"; c.beginPath(); c.arc(x, yy, r, 0, 7); c.fill(); c.fillStyle = "#f4c430"; c.beginPath(); c.arc(x, yy, r * .45, 0, 7); c.fill();
    c.strokeStyle = "#444"; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const w = rad + i * Math.PI / 2; c.beginPath(); c.moveTo(x + Math.cos(w) * r * .5, yy + Math.sin(w) * r * .5); c.lineTo(x + Math.cos(w) * r * .9, yy + Math.sin(w) * r * .9); c.stroke(); } };
  // Anhänger mit Stroh (hinten, links vom Traktor)
  c.fillStyle = "#8d5a2b"; c.fillRect(-58, -12, 30, 5); c.strokeStyle = "#5c3a1a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-28, -9); c.lineTo(-20, -9); c.stroke();
  if (!R.abgeladen) { c.fillStyle = "#e9c46a"; c.fillRect(-56, -22, 13, 10); c.fillRect(-42, -22, 13, 10); c.fillStyle = "#e9c46a"; c.fillRect(-50, -31, 14, 9); }
  else { c.fillStyle = "#e9c46a"; c.fillRect(-56, -22, 13, 10); c.fillRect(-42, -22, 13, 10); }
  c.strokeStyle = "rgba(160,120,40,.6)"; c.lineWidth = .6; c.beginPath(); c.moveTo(-56, -17); c.lineTo(-29, -17); c.stroke();
  reifen(-50, -4, 4); reifen(-36, -4, 4);
  c.fillStyle = "#2d6a4f"; c.fillRect(-20, -18, 20, 9); c.fillRect(-2, -14, 12, 6); // Traktor grün
  c.fillStyle = "#1b4332"; c.fillRect(-18, -32, 14, 3); c.strokeStyle = "#1b4332"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-17, -30); c.lineTo(-17, -18); c.moveTo(-5, -30); c.lineTo(-5, -18); c.stroke(); // Kabine
  c.fillStyle = "rgba(180,220,255,.6)"; c.fillRect(-16, -29, 10, 10);
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(-11, -23, 2.2, 0, 7); c.fill(); c.fillStyle = "#c1121f"; c.fillRect(-13.5, -26.5, 5, 1.8); // Bauer mit Kappe
  c.fillStyle = "#555"; c.fillRect(4, -22, 1.8, 8); // Auspuff
  if (Math.sin(JZB.T * 8) > 0) { c.fillStyle = "rgba(120,120,120,.45)"; c.beginPath(); c.arc(5 - ((JZB.T * 20) % 6), -25 - ((JZB.T * 20) % 6), 2, 0, 7); c.fill(); }
  reifen(-12, -7, 8); reifen(6, -4, 4.4);
  c.restore();
}
function jzbBhStallMalen(c, S, y, k, tor, licht) {
  const l = S.x - S.b / 2;
  c.fillStyle = "#9b2226"; c.fillRect(l, y - S.h, S.b, S.h); // rote Scheune
  c.fillStyle = "#6d1a1d"; c.beginPath(); c.moveTo(l - 4 * k, y - S.h); c.lineTo(S.x, y - S.h - 18 * k); c.lineTo(l + S.b + 4 * k, y - S.h); c.closePath(); c.fill(); // Dach
  c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.2; c.strokeRect(l + 2 * k, y - S.h + 2 * k, S.b - 4 * k, S.h - 2 * k);
  c.fillStyle = licht ? `rgba(255,214,120,${.5 + .5 * licht})` : "#3a2a1a"; c.beginPath(); c.arc(S.x, y - S.h - 6 * k, 3.6 * k, 0, 7); c.fill(); // rundes Fenster oben
  const tb = 16 * k, th = 20 * k; c.fillStyle = "#2b1a10"; c.fillRect(S.x - tb / 2, y - th, tb, th); // Toröffnung (dunkel)
  const zu = 1 - tor; c.fillStyle = "#bc3d2f"; c.fillRect(S.x - tb / 2, y - th, tb / 2 * zu, th); c.fillRect(S.x + tb / 2 - tb / 2 * zu, y - th, tb / 2 * zu, th); // Torflügel
  if (zu > .05) { c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1; c.beginPath(); c.moveTo(S.x - tb / 2, y - th); c.lineTo(S.x - tb / 2 + tb / 2 * zu, y); c.moveTo(S.x + tb / 2, y - th); c.lineTo(S.x + tb / 2 - tb / 2 * zu, y); c.stroke(); }
}
function jzbBhSchildMalen(c, S, x, y, k) {
  const a = jzbHopp(S.t / .7); if (a <= 0) return;
  const fs = 10 * k; c.font = `700 ${fs}px ${THEMA_SCHRIFTEN.kirmes ? `"${THEMA_SCHRIFTEN.kirmes.familie}",` : ""}Georgia,serif`;
  const w = c.measureText(S.text).width + 12 * k, h = fs + 5 * k;
  c.save(); c.translate(x, y); c.scale(1, a);
  c.fillStyle = "#6b4423"; c.fillRect(-w / 2 + 4 * k, -h - 2 * k, 2.4 * k, h + 2 * k); c.fillRect(w / 2 - 6.4 * k, -h - 2 * k, 2.4 * k, h + 2 * k); // Pfosten
  c.fillStyle = "#c08a4e"; c.beginPath(); c.roundRect ? c.roundRect(-w / 2, -h - 3 * k, w, h, 2 * k) : c.rect(-w / 2, -h - 3 * k, w, h); c.fill();
  c.strokeStyle = "#7a4e26"; c.lineWidth = 1; c.stroke();
  c.fillStyle = "#3b2412"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(S.text, 0, -h / 2 - 3 * k + .5 * k);
  c.restore();
}
function jzbBauernhofMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, B = F.bh; if (!B) return;
  const t = F.t, H = jzbBhHimmel(t), boden = J.h - 5 * k, S = jzbBhStall();
  // Sonne geht auf (links) und unter (rechts); nachts Mond und Sterne
  if (H.sonne > 0) { const u = t < 8 ? .15 : t < JZB_BH_ABEND ? .15 + (t - 8) / (JZB_BH_ABEND - 8) * .55 : .7 + (t - JZB_BH_ABEND) / (JZB_BH_NACHT - JZB_BH_ABEND) * .2;
    const sx = J.w * (.3 + u * .6), sy = 18 * k + (1 - H.sonne) * 50 * k; c.save(); c.globalAlpha *= H.sonne;
    c.fillStyle = "rgba(255,210,80,.35)"; c.beginPath(); c.arc(sx, sy, 15 * k, 0, 7); c.fill(); c.fillStyle = "#ffd23f"; c.beginPath(); c.arc(sx, sy, 9 * k, 0, 7); c.fill(); c.restore(); }
  if (H.rot > 0) { c.fillStyle = `rgba(255,120,50,${H.rot})`; c.fillRect(0, 0, J.w, J.h); }
  if (H.nacht > 0) { c.fillStyle = `rgba(10,16,48,${H.nacht})`; c.fillRect(0, 0, J.w, J.h);
    const n = H.nacht / .6; for (const s of B.sterne) { c.fillStyle = `rgba(255,255,255,${n * (.4 + .6 * Math.abs(Math.sin(s.ph)))})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); }
    c.fillStyle = `rgba(245,243,206,${n})`; c.beginPath(); c.arc(J.w * .5, 18 * k, 8 * k, 0, Math.PI * 2); c.arc(J.w * .5 + 3.5 * k, 16 * k, 7 * k, 0, Math.PI * 2, true); c.fill("evenodd"); } // Mondsichel
  const tag = 1 - H.nacht / .6;
  for (const w of B.wolken) { c.fillStyle = `rgba(255,255,255,${.75 * tag})`; for (const [dx, dy, r] of [[0, 0, 7], [8, -3, 9], [17, 0, 7]]) { c.beginPath(); c.arc(w.x + dx * k * w.s, w.y + dy * k * w.s, r * k * w.s, 0, 7); c.fill(); } }
  c.strokeStyle = "#333"; c.lineWidth = 1.1; for (const v of B.voegel) { const f = Math.sin(v.ph) * 2.5 * k; c.beginPath(); c.moveTo(v.x - 4 * k, v.y - f); c.lineTo(v.x, v.y); c.lineTo(v.x + 4 * k, v.y - f); c.stroke(); }
  // Wiese, Zaun, Pfütze
  c.fillStyle = "#6a994e"; c.beginPath(); c.moveTo(0, J.h + 2); for (let x = 0; x <= J.w + 6; x += 6) c.lineTo(x, boden - 2 * k + Math.sin(x * .05) * 1.2 * k); c.lineTo(J.w, J.h + 2); c.closePath(); c.fill();
  c.fillStyle = "#7a5230"; const zaunEnde = S.x - S.b / 2 - 4 * k; for (let x = JZB_RAND + 4 * k; x < zaunEnde; x += 24 * k) c.fillRect(x, boden - 14 * k, 2.4 * k, 14 * k);
  c.fillRect(JZB_RAND + 4 * k, boden - 11 * k, zaunEnde - JZB_RAND - 4 * k, 1.6 * k); c.fillRect(JZB_RAND + 4 * k, boden - 6 * k, zaunEnde - JZB_RAND - 4 * k, 1.6 * k);
  c.fillStyle = "rgba(110,75,40,.85)"; c.beginPath(); c.ellipse(B.pfuetze, boden, 13 * k, 2.6 * k, 0, 0, 7); c.fill();
  jzbBhStallMalen(c, S, boden, k, B.tor, H.nacht > .2 && B.tor < .5 ? Math.abs(Math.sin(T * 2)) * .3 + .7 : 0);
  for (const b of B.ballen) { if (b.s <= 0) continue; c.save(); c.translate(b.x, boden); c.scale(b.s, b.s); c.fillStyle = "#e9c46a"; c.fillRect(-7 * k, -9 * k, 14 * k, 9 * k);
    c.strokeStyle = "rgba(150,110,30,.7)"; c.lineWidth = .8; c.beginPath(); c.moveTo(-7 * k, -4.5 * k); c.lineTo(7 * k, -4.5 * k); c.moveTo(-3 * k, -9 * k); c.lineTo(-3 * k, 0); c.moveTo(3 * k, -9 * k); c.lineTo(3 * k, 0); c.stroke(); c.restore(); }
  if (B.schild) jzbBhSchildMalen(c, B.schild, J.w * .5, boden, k);
  if (B.traktor) jzbBhTraktorMalen(c, B.traktor, boden, k * 1.15);
  for (const T2 of B.tiere) { if (T2.drin || !T2.da) continue; const lauf = Math.abs(T2.ziel - T2.x) > 2 && T2.pause <= 0;
    const imDreck = T2.art === "schwein" && Math.abs(T2.x - B.pfuetze) < 8 * k;
    if (T2.art === "kuh") jzbBhKuhMalen(c, T2.x, boden, k * 1.3, T2.dir, T2.ph, lauf);
    else if (T2.art === "schwein") jzbBhSchweinMalen(c, T2.x, boden, k * 1.3, T2.dir, T2.ph, lauf, imDreck || t > 40);
    else jzbBhHuhnMalen(c, T2.x, boden, k * 1.35, T2.dir, T2.ph, !lauf, false); }
  // 🐓 Hahn auf dem ersten Zaunpfosten: kräht morgens, schläft nachts
  const hx = JZB_RAND + 5 * k, hy = boden - 14 * k; jzbBhHuhnMalen(c, hx, hy, k * 1.5, 1, T, false, true);
  if (B.kraeht >= 0) { const a = Math.min(1, B.kraeht * 4, (2.6 - B.kraeht) * 2); c.save(); c.globalAlpha *= a; c.font = `800 ${10 * k}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "left"; c.textBaseline = "middle";
    c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.95)"; c.strokeText("Kikeriki!", hx + 13 * k, hy - 9 * k); c.fillStyle = "#9b2226"; c.fillText("Kikeriki!", hx + 13 * k, hy - 9 * k); c.restore(); }
  if (t > JZB_BH_NACHT) { c.font = `700 ${7 * k}px sans-serif`; c.fillStyle = "rgba(255,255,255,.85)"; c.textAlign = "left"; for (let i = 0; i < 3; i++) { const p = ((T * .5 + i / 3) % 1); c.globalAlpha = F.a * Math.sin(p * Math.PI); c.fillText("z", hx + 6 * k + p * 8 * k, hy - 14 * k - p * 12 * k); } c.globalAlpha = F.a; }
}
// ---- 2.446.0 KC-CLUB-KEGELN (Wunschliste #4, Wunsch Hansi „Kegel-Szene“) ----
// Kegelabend des Köcheclubs: Unten eine Holzbahn, rechts die 9 Kegel (König mit roter Krone). Ein Koch mit Kochmütze nimmt Anlauf,
// schwingt die Kugel und rollt – Kegel fliegen um, „5 Holz!“; danach stellen sich die Kegel wieder auf. Oben rechts hängt die
// Kreidetafel mit dem Vornamen: nach jedem Wurf Striche und die Summe. Der 6. Wurf ist immer „Alle Neune!“ mit Konfetti, der Koch jubelt.
// Zum Schluss wischt ein Schwamm die Tafel sauber – der nächste Lauf beginnt mit leerer Tafel und stehenden Kegeln (nahtlos).
const JZB_KG_WURF = 11, JZB_KG_WUERFE = 6, JZB_KG_DAUER = JZB_KG_WURF * JZB_KG_WUERFE + 9; // Sekunden je Wurf, Würfe, Lauflänge (Jubel + Wischen)
function jzbKgBahn() { const J = JZB, k = J.k; return { boden: J.h - 5 * k, start: JZB_RAND + 14 * k, kegel: J.w - JZB_RAND - 84 * k }; }
function jzbKgNeu() {
  const J = JZB, k = J.k, P = jzbKgBahn(), kegel = [];
  for (let r = 2; r >= 0; r--) for (let s = 0; s < 3; s++) kegel.push({ x: P.kegel + s * 14 * k + (2 - r) * 5 * k, r, koenig: r === 1 && s === 1, w: 0, vw: 0, dx: 0, a: 1, faellt: false });
  return { kegel, kugel: null, wurf: -1, ergebnisse: Array.from({ length: JZB_KG_WUERFE }, (_, i) => i === JZB_KG_WUERFE - 1 ? 9 : 3 + Math.floor(Math.random() * 6)),
    striche: 0, holz: null, konfetti: [], wisch: -1, kx: P.start };
}
function jzbKgSchritt(F, dt) {
  const J = JZB, k = J.k, K = F.kg || (F.kg = jzbKgNeu()), t = F.t, P = jzbKgBahn();
  F.a = 1;
  if (t >= JZB_KG_DAUER) { J.fest = null; return jzbLaufEnde(); }
  const w = Math.floor(t / JZB_KG_WURF), tw = t - w * JZB_KG_WURF;
  if (w < JZB_KG_WUERFE) {
    if (w !== K.wurf) { K.wurf = w; K.getroffen = false; K.gezaehlt = false; }
    // Anlauf (0–2 s), Kugel los (2 s), zurückgehen (8–10.5 s)
    K.kx = tw < 2 ? P.start + jzbEase(tw / 2) * 22 * k : tw < 8 ? P.start + 22 * k : P.start + 22 * k * (1 - jzbEase((tw - 8) / 2.5));
    if (tw >= 2 && !K.kugel && !K.getroffen) K.kugel = { x: P.start + 34 * k, dreh: 0 };
    if (K.kugel) { K.kugel.x += 58 * k * dt; K.kugel.dreh += 62 * dt / 4.5;
      if (!K.getroffen && K.kugel.x >= P.kegel - 4 * k) { K.getroffen = true; const n = K.ergebnisse[w]; // welche fallen: vorne zuerst, König bei „Alle Neune“
        const reihe = [...K.kegel].sort((a, b) => b.r - a.r || Math.random() - .5);
        reihe.slice(0, n).forEach((g, i) => { g.faellt = true; g.vw = (Math.random() < .7 ? 1 : -1) * jzbZ(5, 9); g.vx = jzbZ(10, 40) * k; g.verz = i * .04; });
        K.holz = { n, t: 0 }; if (n === 9) for (let i = 0; i < 40; i++) K.konfetti.push({ x: P.kegel + 14 * k, y: P.boden - 20 * k, vx: jzbZ(-90, 50) * k, vy: jzbZ(-120, -40) * k, w: jzbZ(0, 6), f: jzbW(JZB_FEST_BUNT), a: 1 }); }
      if (K.kugel.x > J.w + 20 * k) K.kugel = null; }
    for (const g of K.kegel) { if (!g.faellt) continue; if (g.verz > 0) { g.verz -= dt; continue; }
      g.w = Math.max(-1.57, Math.min(1.57, g.w + g.vw * dt)); g.dx += g.vx * dt; g.vx *= Math.pow(.05, dt); }
    if (K.holz) { K.holz.t += dt; if (K.holz.t > 2.6) K.holz = null; }
    if (tw > 6.5 && K.getroffen && !K.gezaehlt) { K.gezaehlt = true; K.striche += K.ergebnisse[w]; }
    // Kegel stellen sich wieder auf (8.5–10 s): ausblenden, aufrichten, einblenden
    if (tw > 8.5) for (const g of K.kegel) if (g.faellt) { if (tw < 9.2) g.a = Math.max(0, 1 - (tw - 8.5) / .7); else { g.faellt = false; g.w = 0; g.dx = 0; g.a = 0; } }
    for (const g of K.kegel) if (!g.faellt && g.a < 1) g.a = Math.min(1, g.a + dt * 2);
  } else { // Jubel, dann Tafel wischen
    const te = t - JZB_KG_WURF * JZB_KG_WUERFE; K.kx = P.start;
    if (te > 4.5 && K.wisch < 0) K.wisch = 0;
    if (K.wisch >= 0) K.wisch = Math.min(1, K.wisch + dt / 3);
  }
  for (const c of K.konfetti) { c.vy += 160 * k * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.w += dt * 8; if (c.y > P.boden) { c.y = P.boden; c.vx *= .3; c.vy = 0; c.a -= dt * .5; } }
  K.konfetti = K.konfetti.filter((c) => c.a > 0);
}
function jzbKgKegelMalen(c, x, y, sc, w, koenig, a) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(w); c.scale(sc, sc);
  c.fillStyle = "#fffdf7"; c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = .5;
  c.beginPath(); c.moveTo(-1.6, 0); c.bezierCurveTo(-3.6, -3, -3.4, -6.5, -1.2, -9); c.bezierCurveTo(-.9, -10, -1.8, -11.2, -1.4, -12.4); // Bauch, Hals
  c.arc(0, -12.6, 1.5, Math.PI, 0); c.bezierCurveTo(1.8, -11.2, .9, -10, 1.2, -9); c.bezierCurveTo(3.4, -6.5, 3.6, -3, 1.6, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#c1121f"; c.fillRect(-1.25, -9.6, 2.5, .7); c.fillRect(-1.15, -8.6, 2.3, .5); // rote Ringe am Hals
  if (koenig) { c.beginPath(); c.moveTo(-1.5, -13.4); c.lineTo(-1.5, -15.4); c.lineTo(-.7, -14.4); c.lineTo(0, -15.8); c.lineTo(.7, -14.4); c.lineTo(1.5, -15.4); c.lineTo(1.5, -13.4); c.closePath(); c.fill(); } // Krone
  c.restore();
}
function jzbKgKochMalen(c, x, y, sc, arm, jubel, T) { // Koch von der Seite (Blick nach rechts) mit Kochmütze, Schürze
  c.save(); c.translate(x, y); c.scale(sc, sc); c.lineCap = "round"; c.lineJoin = "round";
  const schritt = Math.sin(T * 9) * (arm.geht ? 2.4 : 0);
  c.strokeStyle = "#343a40"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-1, -9); c.lineTo(-2 - schritt, 0); c.moveTo(1, -9); c.lineTo(2 + schritt + (arm.wurf ? 3 : 0), 0); c.stroke(); // Beine
  c.fillStyle = "#212529"; c.fillRect(-4 - schritt, -1.2, 4, 1.6); c.fillRect(1 + schritt + (arm.wurf ? 3 : 0), -1.2, 4, 1.6); // Schuhe
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.roundRect ? c.roundRect(-4, -20, 8.4, 12, 3) : c.rect(-4, -20, 8.4, 12); c.fill(); // Kochjacke
  c.fillStyle = "#741521"; c.fillRect(-.4, -18, 1, 1); c.fillRect(-.4, -15, 1, 1); c.fillRect(-.4, -12, 1, 1); // Knöpfe weinrot
  c.fillStyle = "#e9ecef"; c.fillRect(1.2, -12, 3.6, 5); // Schürze
  c.strokeStyle = "#f8f9fa"; c.lineWidth = 2.4; const ax = Math.sin(arm.w) * 8, ay = Math.cos(arm.w) * 8; // Wurfarm schwingt
  c.beginPath(); c.moveTo(.5, -17); c.lineTo(.5 + ax, -17 + ay); c.stroke();
  if (jubel) { c.beginPath(); c.moveTo(-1, -17); c.lineTo(-3, -25 + Math.sin(T * 10) * 1.2); c.stroke(); c.beginPath(); c.moveTo(1.5, -17); c.lineTo(4, -25 + Math.cos(T * 10) * 1.2); c.stroke(); }
  if (arm.kugel) { c.fillStyle = "#6a040f"; c.beginPath(); c.arc(.5 + ax * 1.15, -17 + ay * 1.15, 3, 0, 7); c.fill(); }
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(1, -23, 3.2, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#111"; c.beginPath(); c.arc(2.6, -23.4, .45, 0, 7); c.fill();
  c.strokeStyle = "#8d5a3b"; c.lineWidth = .7; c.beginPath(); c.arc(2.3, -21.8, 1, .2, 1.6); c.stroke(); // Lächeln
  c.fillStyle = "#ffffff"; c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = .5; // Kochmütze
  c.beginPath(); c.rect(-2.2, -27.4, 6.4, 2.4); c.fill(); c.stroke();
  for (const [mx, my, mr] of [[-1.4, -29, 2.2], [1, -30.2, 2.6], [3.4, -29, 2.2]]) { c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill(); }
  c.restore();
}
function jzbKgTafelMalen(c, K, J, k, name) {
  const b = 74 * k, h = 40 * k, x = Math.min(J.w - JZB_RAND - b - 4 * k, J.w * .62), y = J.h * .15;
  c.fillStyle = "#7a4e26"; c.fillRect(x - 3 * k, y - 3 * k, b + 6 * k, h + 6 * k); c.fillStyle = "#2f4f3a"; c.fillRect(x, y, b, h); // Rahmen, Tafel
  c.strokeStyle = "#5c3a1a"; c.lineWidth = 1; c.beginPath(); c.moveTo(x + b * .3, y - 3 * k); c.lineTo(x + b / 2, y - 10 * k); c.lineTo(x + b * .7, y - 3 * k); c.stroke(); // Aufhängung
  const wisch = K.wisch < 0 ? 0 : K.wisch, frei = x + wisch * b; // alles links vom Schwamm ist weggewischt
  c.save(); c.beginPath(); c.rect(frei, y, b - (frei - x), h); c.clip();
  c.fillStyle = "rgba(255,255,255,.92)"; c.font = `700 ${9 * k}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "left"; c.textBaseline = "middle";
  c.fillText(name ? name + ":" : "Kegeln:", x + 4 * k, y + 8 * k);
  c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 1.1 * k; c.lineCap = "round"; // Strichliste (je 5 als Bündel)
  for (let i = 0; i < K.striche; i++) { const gruppe = Math.floor(i / 5), p = i % 5, zeile = Math.floor(gruppe / 4), gx = x + 5 * k + (gruppe % 4) * 17 * k, gy = y + 18 * k + zeile * 9 * k;
    if (gy > y + h - 10 * k) break;
    c.beginPath(); if (p < 4) { c.moveTo(gx + p * 3 * k, gy - 3.5 * k); c.lineTo(gx + p * 3 * k, gy + 3.5 * k); } else { c.moveTo(gx - 1.5 * k, gy + 3 * k); c.lineTo(gx + 10.5 * k, gy - 3 * k); } c.stroke(); }
  if (K.striche) { c.textAlign = "right"; c.fillText("= " + K.striche, x + b - 4 * k, y + 8 * k); }
  c.restore();
  if (K.wisch >= 0 && K.wisch < 1) { const sx = frei, sy = y + h / 2 + Math.sin(K.wisch * 30) * h * .3; c.fillStyle = "#ffd166"; c.beginPath(); c.roundRect ? c.roundRect(sx - 5 * k, sy - 4 * k, 10 * k, 8 * k, 2 * k) : c.rect(sx - 5 * k, sy - 4 * k, 10 * k, 8 * k); c.fill(); // Schwamm
    c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(x, y, Math.max(0, frei - x), h); }
}
function jzbKegelnMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, K = F.kg; if (!K) return;
  const P = jzbKgBahn(), t = F.t, w = Math.floor(t / JZB_KG_WURF), tw = t - w * JZB_KG_WURF, ende = w >= JZB_KG_WUERFE;
  // Holzbahn mit Rinne
  const g = c.createLinearGradient(0, P.boden - 6 * k, 0, J.h); g.addColorStop(0, "#d4a373"); g.addColorStop(1, "#a0703e"); c.fillStyle = g; c.fillRect(0, P.boden - 3 * k, J.w, J.h);
  c.strokeStyle = "rgba(90,55,25,.35)"; c.lineWidth = .8; for (let x = 0; x < J.w; x += 26 * k) { c.beginPath(); c.moveTo(x, P.boden - 3 * k); c.lineTo(x, J.h); c.stroke(); }
  c.fillStyle = "#5c3a1a"; c.fillRect(0, P.boden - 4 * k, J.w, 1.4 * k);
  c.fillStyle = "#3b2412"; c.fillRect(P.kegel + 50 * k, P.boden - 30 * k, 6 * k, 27 * k); // Rückwand hinter den Kegeln
  jzbKgTafelMalen(c, K, J, k, jzbEisNameText());
  for (const gk of K.kegel) jzbKgKegelMalen(c, gk.x + gk.dx, P.boden - gk.r * 1.8 * k, k * 1.6, gk.w, gk.koenig, gk.a);
  if (K.kugel) { const kx = K.kugel.x, ky = P.boden - 4 * k; c.fillStyle = "#6a040f"; c.beginPath(); c.arc(kx, ky, 4 * k, 0, 7); c.fill();
    c.fillStyle = "#111"; for (const d of [0, .7, 1.4]) { const a = K.kugel.dreh + d; c.beginPath(); c.arc(kx + Math.cos(a) * 1.8 * k, ky + Math.sin(a) * 1.8 * k, .55 * k, 0, 7); c.fill(); } } // Grifflöcher drehen
  const arm = { w: Math.PI, geht: false, kugel: false, wurf: false };
  if (!ende) { if (tw < 2) { arm.geht = true; arm.kugel = true; arm.w = Math.PI - Math.sin(tw / 2 * Math.PI) * 1.4 + (tw > 1.4 ? (tw - 1.4) * 2.2 : 0); }
    else if (tw < 2.5) { arm.w = Math.PI * .35; arm.wurf = true; } else if (tw > 8 && tw < 10.5) arm.geht = true; }
  const jubel = ende ? t - JZB_KG_WURF * JZB_KG_WUERFE < 4.5 : (K.holz?.n === 9);
  jzbKgKochMalen(c, K.kx, P.boden, k * 1.25, arm, jubel, T);
  for (const cf of K.konfetti) { c.save(); c.globalAlpha *= Math.max(0, cf.a); c.translate(cf.x, cf.y); c.rotate(cf.w); c.fillStyle = cf.f; c.fillRect(-1.6 * k, -.8 * k, 3.2 * k, 1.6 * k); c.restore(); }
  if (K.holz) { const H = K.holz, a = Math.min(1, H.t * 4, (2.6 - H.t) * 2), neun = H.n === 9, txt = neun ? "Alle Neune!" : H.n + " Holz!";
    c.save(); c.globalAlpha *= a; c.font = `800 ${(neun ? 13 : 11) * k}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    const tx = Math.min(J.w - JZB_RAND - 40 * k, P.kegel - 10 * k), ty = P.boden - 17 * k - H.t * 2 * k; c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.95)"; c.strokeText(txt, tx, ty); c.fillStyle = neun ? "#c1121f" : "#3b2412"; c.fillText(txt, tx, ty); c.restore(); }
}
// ---- 2.529.0 KC-CLUB-WILDWEST (Wunsch Hansi „neue Szene Wild West: links ein Indianerzelt, davor ein Lagerfeuer, am Horizont laufen Büffel,
// ab und an reiten 2 Cowboys vorbei, zwischendurch eine Kutsche – dann kommt eine riesige Büffelherde, trampelt alles nieder, Staubwolke,
// Szene fängt wieder von vorne an“) ----
// Unten im Kopf der Wilde Westen: links ein Tipi, davor knistert ein Lagerfeuer (Funken, Rauch). Am Horizont ziehen kleine Büffel vor Tafelbergen
// und Kakteen. Zweimal reiten zwei Cowboys vorbei (einer schwingt das Lasso), zweimal rumpelt die Postkutsche „Köcheclub-Express“ durch.
// Zum Schluss bebt der Boden: eine riesige Büffelherde donnert von rechts heran, trampelt Zelt und Feuer nieder, eine Staubwolke deckt alles zu –
// aus dem Staub heraus beginnt die Szene von vorn (nahtlos). Alles nur Bild, nichts wird gespeichert oder gesendet.
// ---------- 2.548.0 KC-CLUB-WUESTE (Wunsch Hansi „Szene Wüste: im Hintergrund Pyramiden, vorne zieht eine Karawane vorbei, links eine Oase, dann kommt
// der Pharao – auf einer Sänfte getragen –, rechts kommt ein Flaschengeist aus der Lampe“; Ende nach Wahl Hansi „1 + 3“): der Geist verbeugt sich vor dem
// Pharao und schnippt – aus der Lampe steigt Goldstaub und schreibt langsam Buchstabe für Buchstabe den Vornamen in den Himmel (ohne Namen „Köcheclub“);
// dann wirbelt der Geist zurück in die Lampe, die Lampe wackelt, der Pharao wird davongetragen. Zum Schluss Sonnenuntergang hinter den Pyramiden,
// Sterne und Halbmond, die Karawane rastet an der Oase – dann wird es wieder Tag. Alles aus der Zeit im Lauf berechnet, nur Bild, nichts gespeichert/gesendet.
const JZB_WU_KARAWANE = 5, JZB_WU_PHARAO = 26, JZB_WU_ANKUNFT = 36, JZB_WU_GEIST = 37, JZB_WU_NAME_AB = 47, JZB_WU_TAKT = 2.6, JZB_WU_KAMELE = 4;
const jzbWuName = () => [...(jzbEisNameText() || "Köcheclub")].slice(0, 12);
function jzbWuZeiten() { // der Ablauf richtet sich nach der Länge des Namens
  const n = jzbWuName().length, fertig = JZB_WU_NAME_AB + n * JZB_WU_TAKT + 2.2, zurueck = fertig + 6, abend = zurueck + 5;
  return { n, fertig, zurueck, abend, ende: abend + 22 };
}
function jzbWuOrt() { const J = JZB, k = J.k, boden = J.h - 5 * k; return { boden, horizont: boden - 22 * k, oase: JZB_RAND + 30 * k, lampe: J.w - JZB_RAND - 24 * k, mitte: J.w * .46 }; }
function jzbWuNeu() { return { glitzer: [], gUhr: 0, sterne: Array.from({ length: 28 }, () => ({ x: Math.random(), y: Math.random(), ph: jzbZ(0, 6) })) }; }
function jzbWuNameLage(O, k) {
  const J = JZB, z = jzbWuName(), fs = Math.round(Math.max(10, Math.min(24 * k, (O.horizont - 8 * k) * .75))), f = `700 ${fs}px Georgia, "Times New Roman", serif`;
  const c = J.ctx; c.save(); c.font = f; const b = z.map((ch) => c.measureText(ch).width + 1.5 * k); c.restore();
  const ges = b.reduce((a, v) => a + v, 0); let x = Math.max(JZB_RAND, Math.min(J.w - JZB_RAND - ges, J.w * .5 - ges / 2));
  return { z, fs, f, y: Math.max(fs * .85 + 2, O.horizont - 26 * k), pos: b.map((w) => { const m = x + w / 2; x += w; return m; }) };
}
function jzbWuGeistLage(t, Z, O, k) { // null = in der Lampe
  const sx = O.lampe + 7 * k, sy = O.boden - 9 * k, gx = O.mitte + 44 * k, gy = O.boden - 26 * k;
  if (t < JZB_WU_GEIST || t >= Z.zurueck + 2.6) return null;
  if (t < JZB_WU_GEIST + 3) { const p = jzbEase((t - JZB_WU_GEIST) / 3); return { x: sx, y: sy - p * 16 * k, sc: .15 + p * .65, verbeugt: 0, schnipp: 0, sx, sy }; }
  if (t < JZB_WU_GEIST + 6) { const p = jzbEase((t - JZB_WU_GEIST - 3) / 3); return { x: sx + (gx - sx) * p, y: sy - 16 * k + (gy - sy + 16 * k) * p, sc: .8 + p * .2, verbeugt: 0, schnipp: 0, sx, sy }; }
  if (t < Z.zurueck) {
    const vb = t - JZB_WU_GEIST - 6, verbeugt = vb < 3 ? Math.sin(Math.PI * Math.min(1, vb / 3)) : 0, sn = t - (JZB_WU_NAME_AB - 1.2);
    return { x: gx, y: gy + Math.sin(t * 1.6) * 1.5 * k, sc: 1, verbeugt, schnipp: sn >= 0 && sn < .8 ? 1 - sn / .8 : 0, sx, sy };
  }
  const p = jzbEase((t - Z.zurueck) / 2.6), w = p * Math.PI * 4; // Wirbel zurück in die Lampe
  return { x: gx + (sx - gx) * p + Math.cos(w) * (1 - p) * 10 * k, y: gy + (sy - gy) * p + Math.sin(w) * (1 - p) * 6 * k, sc: 1 - p * .9, verbeugt: 0, schnipp: 0, dreh: w, sx, sy };
}
function jzbWuSchritt(F, dt) {
  const J = JZB, k = J.k, t = F.t, Z = jzbWuZeiten(), O = jzbWuOrt(), W = F.wu || (F.wu = jzbWuNeu());
  if (t >= Z.ende) { J.fest = null; return jzbLaufEnde(); }
  F.a = Math.min(1, t / 2) * Math.min(1, Math.max(0, (Z.ende - t) / 1.5));
  // ✨ Goldstaub: nach dem Schnipsen steigt er aus der Lampe zu jedem neuen Buchstaben
  if (t >= JZB_WU_NAME_AB - .6 && t < Z.fertig && (W.gUhr -= dt) <= 0) {
    W.gUhr = .045; const L = jzbWuNameLage(O, k), i = Math.min(L.z.length - 1, Math.max(0, Math.floor((t - JZB_WU_NAME_AB + .6) / JZB_WU_TAKT)));
    W.glitzer.push({ x: O.lampe + 9 * k, y: O.boden - 9 * k, zx: L.pos[i] + jzbZ(-4, 4) * k, zy: L.y - L.fs * .35 + jzbZ(-5, 5) * k, p: 0, v: jzbZ(.45, .7), r: jzbZ(.7, 1.5) * k, ph: jzbZ(0, 6) });
  }
  for (const g of W.glitzer) g.p += dt * g.v;
  W.glitzer = W.glitzer.filter((g) => g.p < 1.35);
}
function jzbWuKamelMalen(c, x, y, sc, ph, o = {}) { // Dromedar nach links (Karawane zieht nach links), Füße bei y · o.liegt: rastet · o.decke/o.last/o.reiter
  c.save(); c.translate(x, y); c.scale(sc, sc);
  const fell = "#c19a6b", dunkel = "#9c7a50";
  if (o.liegt) {
    c.fillStyle = fell; c.beginPath(); c.ellipse(0, -5, 11, 4.5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(1, -9, 5, 4, 0, 0, 7); c.fill(); // Körper + Höcker
    c.strokeStyle = fell; c.lineWidth = 2.6; c.lineCap = "round"; c.beginPath(); c.moveTo(-9, -6); c.quadraticCurveTo(-14, -9, -13, -15); c.stroke(); // Hals
    c.fillStyle = fell; c.beginPath(); c.ellipse(-15, -15.5, 3.2, 1.8, -.2, 0, 7); c.fill();
    c.fillStyle = "#2b1a0e"; c.beginPath(); c.arc(-15.5, -16.2, .45, 0, 7); c.fill(); c.restore(); return;
  }
  const bein = (bx, w) => { c.strokeStyle = dunkel; c.lineWidth = 1.8; c.lineCap = "round"; c.beginPath(); c.moveTo(bx, -10); c.lineTo(bx + Math.sin(w) * 3, -4.5); c.lineTo(bx + Math.sin(w) * 3.6, 0); c.stroke(); };
  bein(6, ph + Math.PI); bein(-6, ph); // hintere Beine
  c.fillStyle = fell; c.beginPath(); c.ellipse(0, -13, 10, 4.6, 0, 0, 7); c.fill(); // Rumpf
  c.beginPath(); c.ellipse(1, -17, 5.5, 4.8, 0, 0, 7); c.fill(); // Höcker
  c.strokeStyle = fell; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(-8, -14); c.quadraticCurveTo(-15, -16 + Math.sin(ph) * .6, -14, -24); c.stroke(); // Hals
  c.fillStyle = fell; c.beginPath(); c.ellipse(-16, -24.5, 3.6, 2, -.15, 0, 7); c.fill(); c.beginPath(); c.arc(-13.6, -26, 1, 0, 7); c.fill(); // Kopf, Ohr
  c.fillStyle = "#2b1a0e"; c.beginPath(); c.arc(-16.4, -25.3, .5, 0, 7); c.fill();
  c.strokeStyle = fell; c.lineWidth = 1.2; c.beginPath(); c.moveTo(10, -14); c.quadraticCurveTo(13, -12, 12, -8); c.stroke(); // Schwanz
  bein(5, ph); bein(-7, ph + Math.PI); // vordere Beine
  if (o.decke) { c.fillStyle = o.decke; c.beginPath(); c.moveTo(-5, -20); c.quadraticCurveTo(1, -24, 7, -20); c.lineTo(8, -12); c.lineTo(-6, -12); c.closePath(); c.fill();
    c.fillStyle = "#ffd166"; for (let i = -5; i <= 7; i += 2.4) { c.beginPath(); c.arc(i, -11.6, .6, 0, 7); c.fill(); } }
  if (o.last) { c.fillStyle = "#8d6e63"; c.fillRect(-7, -21, 5, 6); c.fillRect(4, -21, 5, 6); c.strokeStyle = "#5d4037"; c.lineWidth = .7; c.strokeRect(-7, -21, 5, 6); c.strokeRect(4, -21, 5, 6); }
  if (o.reiter) { c.fillStyle = "#f1faee"; c.beginPath(); c.ellipse(1, -26, 3.2, 4.6, 0, 0, 7); c.fill(); // Gewand
    c.fillStyle = "#c68b59"; c.beginPath(); c.arc(0.5, -32.5, 2.3, 0, 7); c.fill(); c.fillStyle = o.reiter; c.beginPath(); c.ellipse(.8, -34.2, 2.9, 1.7, 0, 0, 7); c.fill(); } // Kopf + Turban
  c.restore();
}
function jzbWuTraegerMalen(c, x, y, ph) { // Träger (Lendenschurz, Stab auf der Schulter), Blick nach rechts
  const bein = (w) => { c.beginPath(); c.moveTo(0, -9); c.lineTo(Math.sin(w) * 3, 0); c.stroke(); };
  c.save(); c.translate(x, y); c.strokeStyle = "#a0673a"; c.lineWidth = 1.7; c.lineCap = "round"; bein(ph); bein(ph + Math.PI);
  c.fillStyle = "#f1faee"; c.fillRect(-2.2, -11, 4.4, 3); c.fillStyle = "#a0673a"; c.fillRect(-1.6, -17, 3.2, 6.5); // Schurz, Oberkörper
  c.beginPath(); c.arc(0, -19.2, 2.1, 0, 7); c.fill(); c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(-.3, -20, 2.1, Math.PI, 0); c.fill(); c.restore(); // Kopf, Haar
}
function jzbWuSaenfteMalen(c, x, y, k, ph, geht) { // Sänfte mit Pharao, vier Träger (vorn/hinten je zwei, versetzt)
  const s = k * 1.05, schw = geht ? Math.sin(ph * 2) * .8 * k : 0;
  c.save();
  for (const [dx, p] of [[-24, 0], [24, Math.PI]]) jzbWuTraegerMalen(c, x + dx * s - 2 * s, y, geht ? ph + p + 1 : 0); // hintere Reihe (versetzt)
  c.translate(0, schw);
  c.strokeStyle = "#7f5539"; c.lineWidth = 1.6 * s; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 30 * s, y - 17 * s); c.lineTo(x + 30 * s, y - 17 * s); c.stroke(); // Tragestangen
  c.fillStyle = "#b5892f"; c.fillRect(x - 13 * s, y - 21 * s, 26 * s, 5 * s); // Sitzkasten
  c.fillStyle = "#1d3557"; for (let i = 0; i < 5; i++) c.fillRect(x - 12 * s + i * 5.2 * s, y - 20 * s, 2.4 * s, 3 * s);
  // Pharao: weißes Gewand, Nemes-Kopftuch blau-gold gestreift, Bart, Krummstab
  c.fillStyle = "#f8f9fa"; c.beginPath(); c.ellipse(x, y - 25 * s, 4.6 * s, 5.5 * s, 0, 0, 7); c.fill();
  c.fillStyle = "#ffd166"; c.fillRect(x - 4.2 * s, y - 28 * s, 8.4 * s, 1.6 * s); // Kragen
  c.fillStyle = "#c68b59"; c.beginPath(); c.arc(x + .6 * s, y - 33 * s, 3 * s, 0, 7); c.fill();
  for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? "#ffd166" : "#1d4e89"; c.beginPath(); c.moveTo(x - 3.6 * s, y - 34 * s + i * 1.4 * s); c.lineTo(x - 5.6 * s, y - 28.5 * s + i * .4 * s); c.lineTo(x - 4.6 * s, y - 28.5 * s + i * .4 * s); c.lineTo(x - 2.8 * s, y - 34 * s + i * 1.4 * s); c.fill(); }
  c.fillStyle = "#1d4e89"; c.beginPath(); c.moveTo(x - 3.8 * s, y - 34 * s); c.quadraticCurveTo(x + .6 * s, y - 39 * s, x + 4 * s, y - 34 * s); c.lineTo(x + 3 * s, y - 33.5 * s); c.lineTo(x - 3 * s, y - 33.5 * s); c.fill();
  c.strokeStyle = "#ffd166"; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(x - 3.4 * s, y - 35 * s); c.quadraticCurveTo(x + .6 * s, y - 38.6 * s, x + 3.6 * s, y - 35 * s); c.stroke();
  c.fillStyle = "#1d4e89"; c.fillRect(x + 2.6 * s, y - 31 * s, 1 * s, 2.6 * s); // Bart
  c.strokeStyle = "#ffd166"; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(x + 5 * s, y - 22 * s); c.lineTo(x + 5 * s, y - 33 * s); c.arc(x + 6.6 * s, y - 33 * s, 1.6 * s, Math.PI, 0); c.stroke(); // Krummstab
  // Baldachin
  c.strokeStyle = "#b5892f"; c.lineWidth = 1 * s; c.beginPath(); c.moveTo(x - 12 * s, y - 21 * s); c.lineTo(x - 12 * s, y - 42 * s); c.moveTo(x + 12 * s, y - 21 * s); c.lineTo(x + 12 * s, y - 42 * s); c.stroke();
  c.fillStyle = "#9b2226"; c.beginPath(); c.moveTo(x - 15 * s, y - 42 * s); c.quadraticCurveTo(x, y - 49 * s, x + 15 * s, y - 42 * s); c.closePath(); c.fill();
  c.fillStyle = "#ffd166"; for (let i = -14; i <= 14; i += 3.5) { c.beginPath(); c.arc(x + i * s, y - 41.6 * s, .8 * s, 0, 7); c.fill(); }
  c.restore();
  for (const [dx, p] of [[-26, Math.PI], [22, 0]]) jzbWuTraegerMalen(c, x + dx * s, y, geht ? ph + p : 0); // vordere Reihe
}
function jzbWuLampeMalen(c, x, y, k, wackel) { // goldene Öllampe, Tülle nach links
  c.save(); c.translate(x, y); c.rotate(wackel); c.scale(k, k);
  const g = c.createLinearGradient(0, -8, 0, 0); g.addColorStop(0, "#ffe08a"); g.addColorStop(1, "#b8860b");
  c.fillStyle = g; c.beginPath(); c.ellipse(0, -3.5, 7, 3.4, 0, 0, 7); c.fill(); // Bauch
  c.beginPath(); c.moveTo(-5, -4.5); c.quadraticCurveTo(-10, -5.5, -13, -8.5); c.lineTo(-12, -6.6); c.quadraticCurveTo(-9, -3, -5, -2); c.fill(); // Tülle
  c.strokeStyle = "#b8860b"; c.lineWidth = 1.2; c.beginPath(); c.arc(8, -4, 2.6, -Math.PI / 2, Math.PI / 2); c.stroke(); // Henkel
  c.fillStyle = "#e9b949"; c.beginPath(); c.ellipse(0, -6.8, 3, 1.2, 0, 0, 7); c.fill(); c.beginPath(); c.arc(0, -8.2, 1, 0, 7); c.fill(); // Deckel + Knopf
  c.fillStyle = "#8a6d1d"; c.fillRect(-2.5, -.5, 5, 1); c.restore();
}
function jzbWuGeistMalen(c, G, k, T) { // blauer Flaschengeist mit Rauchschweif zur Lampe
  const s = k * G.sc; if (s <= 0) return;
  c.save();
  // Rauchschweif: von der Lampen-Tülle geschwungen bis unter den Oberkörper
  const n = 14; for (let i = 0; i < n; i++) { const p = i / (n - 1), bx = G.sx - 6 * k, by = G.sy - 1 * k;
    const x = bx + (G.x - bx) * p + Math.sin(p * 6 + T * 3) * 3 * k * (1 - p), y = by + (G.y + 6 * s - by) * p;
    c.fillStyle = `rgba(76,201,240,${.18 + p * .5})`; c.beginPath(); c.arc(x, y, (1 + p * 3.2) * s, 0, 7); c.fill(); }
  c.translate(G.x, G.y); if (G.dreh) c.rotate(G.dreh * .25); c.rotate(G.verbeugt * .45); c.scale(s, s);
  c.fillStyle = "#4cc9f0"; c.beginPath(); c.moveTo(-5, 4); c.quadraticCurveTo(-6, -6, 0, -8); c.quadraticCurveTo(6, -6, 5, 4); c.quadraticCurveTo(0, 8, -5, 4); c.fill(); // Oberkörper
  c.fillStyle = "#7b2cbf"; c.beginPath(); c.moveTo(-5, -5); c.lineTo(-2, 3); c.lineTo(-5, 4); c.closePath(); c.fill(); c.beginPath(); c.moveTo(5, -5); c.lineTo(2, 3); c.lineTo(5, 4); c.closePath(); c.fill(); // Weste
  // Arme: beim Schnipsen ein Arm hoch, sonst verschränkt
  c.strokeStyle = "#4cc9f0"; c.lineWidth = 2.2; c.lineCap = "round";
  if (G.schnipp > 0) { c.beginPath(); c.moveTo(4, -4); c.lineTo(9, -10); c.stroke(); c.fillStyle = `rgba(255,214,102,${G.schnipp})`;
    for (let i = 0; i < 6; i++) { const w = i * Math.PI / 3; c.beginPath(); c.arc(9 + Math.cos(w) * 3.5 * (1.4 - G.schnipp), -11 + Math.sin(w) * 3.5 * (1.4 - G.schnipp), .8, 0, 7); c.fill(); } }
  else { c.beginPath(); c.moveTo(-5, -3); c.quadraticCurveTo(0, 1, 5, -3); c.stroke(); }
  c.fillStyle = "#ffd166"; c.fillRect(-6, -2, 2, 1.2); c.fillRect(4, -2, 2, 1.2); // Armreifen
  c.fillStyle = "#4cc9f0"; c.beginPath(); c.arc(0, -11.5, 4, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(-1.4, -12, .55, 0, 7); c.arc(1.4, -12, .55, 0, 7); c.fill();
  c.strokeStyle = "#1b1b1b"; c.lineWidth = .6; c.beginPath(); c.arc(0, -10.6, 1.5, .2, Math.PI - .2); c.stroke(); // Lächeln
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.moveTo(0, -15.3); c.quadraticCurveTo(2.5, -19, .5, -21); c.quadraticCurveTo(1.2, -18, -1, -15.4); c.fill(); // Haarzopf
  c.fillStyle = "#ffd166"; c.beginPath(); c.arc(3.9, -11, .7, 0, 7); c.fill(); // Ohrring
  c.restore();
}
function jzbWuPalmeMalen(c, x, y, h, k, T, neig) {
  c.strokeStyle = "#7f5539"; c.lineWidth = 2.2 * k; c.lineCap = "round"; const tx = x + neig * k, ty = y - h * k;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + neig * .2 * k, y - h * .6 * k, tx, ty); c.stroke();
  c.strokeStyle = "#2d6a4f"; c.lineWidth = 1.8 * k;
  for (let i = 0; i < 6; i++) { const w = -Math.PI + i * Math.PI / 5 + Math.sin(T * 1.2 + i) * .06, l = 11 * k;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(w) * l * .6, ty + Math.sin(w) * l * .6 - 3 * k, tx + Math.cos(w) * l, ty + Math.sin(w) * l + 4 * k); c.stroke(); }
  c.fillStyle = "#6f4e37"; c.beginPath(); c.arc(tx - 1 * k, ty + 1.5 * k, 1.2 * k, 0, 7); c.arc(tx + 1.4 * k, ty + 1.8 * k, 1.2 * k, 0, 7); c.fill(); // Datteln
}
function jzbWuesteMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, W = F.wu, t = F.t; if (!W) return;
  const O = jzbWuOrt(), Z = jzbWuZeiten(), ab = t - Z.abend;
  // Tageszeit: 0 = Tag … 1 = Nacht (Sonnenuntergang 0–7 s, Nacht bis 15 s, Morgen bis 21 s)
  const nacht = ab < 0 ? 0 : ab < 7 ? jzbEase(ab / 7) : ab < 15 ? 1 : Math.max(0, 1 - (ab - 15) / 5), glut = ab < 0 ? 0 : ab < 7 ? Math.sin(Math.PI * ab / 7) : 0;
  // ☀️ Sonne: tagsüber hoch rechts über den Pyramiden – beim Sonnenuntergang sinkt sie glutrot hinter sie
  const sx = J.w * .68, sy0 = Math.max(10 * k, O.horizont - 44 * k), sy = ab < 0 ? sy0 : ab < 7 ? sy0 + (O.horizont + 6 * k - sy0) * jzbEase(ab / 7) : O.horizont + 30 * k;
  if (glut > 0) { const hg = c.createLinearGradient(0, 0, 0, O.horizont); hg.addColorStop(0, `rgba(255,120,60,${glut * .25})`); hg.addColorStop(1, `rgba(255,170,80,${glut * .55})`); c.fillStyle = hg; c.fillRect(0, 0, J.w, O.horizont); }
  if (sy < O.horizont + 8 * k) { const r = 9 * k, sg = c.createRadialGradient(sx, sy, 0, sx, sy, r * 2.4); sg.addColorStop(0, `rgba(255,${Math.round(220 - glut * 110)},90,.95)`); sg.addColorStop(.45, `rgba(255,${Math.round(190 - glut * 100)},70,.45)`); sg.addColorStop(1, "rgba(255,160,60,0)");
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, r * 2.4, 0, 7); c.fill(); }
  // 🔺 Pyramiden am Horizont (Lichtseite / Schattenseite)
  for (const [px, ph, pb] of [[J.w * .56, 34, 62], [J.w * .73, 26, 48], [J.w * .86, 18, 34]]) {
    const top = O.horizont - ph * k; c.fillStyle = "#e9c46a"; c.beginPath(); c.moveTo(px - pb / 2 * k, O.horizont); c.lineTo(px, top); c.lineTo(px + pb * .08 * k, O.horizont); c.closePath(); c.fill();
    c.fillStyle = "#c8963e"; c.beginPath(); c.moveTo(px + pb * .08 * k, O.horizont); c.lineTo(px, top); c.lineTo(px + pb / 2 * k, O.horizont); c.closePath(); c.fill();
    c.strokeStyle = "rgba(140,100,40,.35)"; c.lineWidth = .6 * k; for (let i = 1; i < 5; i++) { const yy = O.horizont - ph * k * i / 5, ww = pb / 2 * k * (1 - i / 5); c.beginPath(); c.moveTo(px - ww, yy); c.lineTo(px + ww, yy); c.stroke(); } }
  // 🏜️ Sand mit Dünen
  const g = c.createLinearGradient(0, O.horizont, 0, J.h); g.addColorStop(0, "rgba(240,200,120,.92)"); g.addColorStop(1, "rgba(214,164,92,.97)");
  c.fillStyle = g; c.beginPath(); c.moveTo(-4 * k, O.horizont + 2 * k);
  for (let x = 0; x <= J.w + 8 * k; x += 8 * k) c.lineTo(x, O.horizont + Math.sin(x / (34 * k)) * 1.6 * k); c.lineTo(J.w + 8 * k, J.h + 4 * k); c.lineTo(-4 * k, J.h + 4 * k); c.closePath(); c.fill();
  c.strokeStyle = "rgba(190,140,70,.45)"; c.lineWidth = 1 * k; for (const [x0, y0, b] of [[J.w * .3, 8, 50], [J.w * .62, 13, 60], [J.w * .15, 16, 40]]) { c.beginPath(); c.moveTo(x0 - b * k / 2, O.horizont + y0 * k); c.quadraticCurveTo(x0, O.horizont + (y0 - 4) * k, x0 + b * k / 2, O.horizont + y0 * k); c.stroke(); }
  // 🌴 Oase links: Wasser mit Glitzern, zwei Palmen, Gras
  c.fillStyle = "#3a86c8"; c.beginPath(); c.ellipse(O.oase, O.boden - 4 * k, 19 * k, 3.6 * k, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; for (let i = 0; i < 3; i++) { const gx = O.oase - 10 * k + i * 9 * k + Math.sin(T * 1.5 + i) * 1.5 * k; c.fillRect(gx, O.boden - 4.6 * k, 3.4 * k, .7 * k); }
  c.strokeStyle = "#52b788"; c.lineWidth = 1 * k; for (let i = -4; i <= 4; i++) { const gx = O.oase + i * 4.6 * k; c.beginPath(); c.moveTo(gx, O.boden - 1 * k); c.lineTo(gx - 1 * k, O.boden - 4.5 * k); c.moveTo(gx, O.boden - 1 * k); c.lineTo(gx + 1.2 * k, O.boden - 4 * k); c.stroke(); }
  jzbWuPalmeMalen(c, O.oase - 14 * k, O.boden - 3 * k, 30, k, T, -4); jzbWuPalmeMalen(c, O.oase + 13 * k, O.boden - 2 * k, 24, k, T + 1, 5);
  // 🐫 Karawane zieht vorne von rechts nach links
  const kt = t - JZB_WU_KARAWANE, kv = 24 * k;
  if (kt >= 0) for (let i = 0; i < JZB_WU_KAMELE; i++) { const x = J.w + 24 * k + i * 38 * k - kt * kv; if (x < -40 * k || x > J.w + 40 * k) continue;
    jzbWuKamelMalen(c, x, O.boden, k * 1.05, T * 5 + i * 1.3, { reiter: i === 0 ? "#e63946" : i === 2 ? "#f1faee" : null, decke: i % 2 ? "#1d3557" : "#9b2226", last: i === 3 }); }
  // 👑 der Pharao auf der Sänfte: von links bis zur Mitte, wartet auf den Geist, wird danach nach rechts davongetragen
  const pt = t - JZB_WU_PHARAO, xm = O.mitte - 8 * k, x0 = -60 * k;
  if (pt >= 0 && t < Z.abend + 1) { const geht = t < JZB_WU_ANKUNFT || t > Z.zurueck + 1.5;
    const px = t < JZB_WU_ANKUNFT ? x0 + (xm - x0) * Math.min(1, pt / (JZB_WU_ANKUNFT - JZB_WU_PHARAO)) : t <= Z.zurueck + 1.5 ? xm : xm + (t - Z.zurueck - 1.5) * 26 * k;
    if (px < J.w + 60 * k) jzbWuSaenfteMalen(c, px, O.boden, k, T * 5, geht); }
  // 🪔 Lampe rechts – wackelt, wenn der Geist herauskommt und wenn er zurückwirbelt
  const wa = t >= JZB_WU_GEIST - 1 && t < JZB_WU_GEIST + .8 ? Math.sin(t * 30) * .12 : t >= Z.zurueck + 2.4 && t < Z.zurueck + 4.2 ? Math.sin(t * 26) * .16 * (Z.zurueck + 4.2 - t) / 1.8 : 0;
  jzbWuLampeMalen(c, O.lampe, O.boden, k * 1.15, wa);
  const G = jzbWuGeistLage(t, Z, O, k); if (G) jzbWuGeistMalen(c, G, k, T);
  // ✨ Goldstaub und der Name in Goldschrift
  for (const s of W.glitzer) { const p = Math.min(1, s.p), e = jzbEase(p), x = s.x + (s.zx - s.x) * e + Math.sin(p * 9 + s.ph) * 4 * k * (1 - p), y = s.y + (s.zy - s.y) * e - Math.sin(p * Math.PI) * 14 * k;
    c.fillStyle = `rgba(255,${200 + Math.round(Math.sin(T * 8 + s.ph) * 40)},90,${Math.max(0, 1 - Math.max(0, s.p - 1) / .35)})`; c.beginPath(); c.arc(x, y, s.r, 0, 7); c.fill(); }
  if (t >= JZB_WU_NAME_AB) { const L = jzbWuNameLage(O, k), weg = Math.max(0, Math.min(1, (t - Z.zurueck - 1) / 2.5));
    c.save(); c.font = L.f; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.shadowColor = "rgba(255,200,60,.95)"; c.shadowBlur = 8 * k;
    L.z.forEach((ch, i) => { const d = t - JZB_WU_NAME_AB - i * JZB_WU_TAKT - 1.4; if (d < 0) return; const a = Math.min(1, d / 1) * (1 - weg); if (a <= 0) return;
      const fl = 1 + Math.max(0, 1 - d / .6) * .35; c.save(); c.translate(L.pos[i], L.y + Math.sin(T * 1.4 + i) * .8 * k - weg * 8 * k); c.scale(fl, fl);
      const gg = c.createLinearGradient(0, -L.fs, 0, 0); gg.addColorStop(0, `rgba(255,236,150,${a})`); gg.addColorStop(1, `rgba(214,160,40,${a})`); c.fillStyle = gg; c.fillText(ch, 0, 0); c.restore(); });
    c.restore(); }
  // 🌙 Nacht: dunkler Himmel, Sterne, Halbmond – die Karawane rastet an der Oase
  if (nacht > 0) {
    c.fillStyle = `rgba(12,20,58,${nacht * .62})`; c.fillRect(0, 0, J.w, J.h);
    for (const s of W.sterne) { const a = nacht * (.5 + .5 * Math.sin(T * 2 + s.ph)); c.fillStyle = `rgba(255,255,230,${a})`; c.fillRect(s.x * J.w, s.y * (O.horizont - 6 * k), 1.4 * k, 1.4 * k); }
    const mx = J.w * .22, my = Math.max(10 * k, O.horizont - 40 * k); c.fillStyle = `rgba(255,244,200,${nacht})`; c.beginPath(); c.arc(mx, my, 7 * k, 0, 7); c.fill();
    c.fillStyle = `rgba(12,20,58,${nacht})`; c.beginPath(); c.arc(mx + 3.2 * k, my - 1.6 * k, 6.4 * k, 0, 7); c.fill();
    c.save(); c.globalAlpha *= Math.min(1, nacht * 1.4); for (let i = 0; i < 3; i++) jzbWuKamelMalen(c, O.oase + 30 * k + i * 22 * k, O.boden, k * (1 - i * .06), 0, { liegt: true });
    c.fillStyle = "rgba(255,170,60,.9)"; c.beginPath(); c.arc(O.oase + 52 * k, O.boden - 2 * k, 2 * k + Math.sin(T * 12) * .5 * k, 0, 7); c.fill(); c.restore(); // kleines Lagerfeuer
  }
}
// ---- 🫧 Seifenblasen (2.633.0 KC-CLUB-SEIFENBLASEN, Wunschliste #33, Wunsch Hansi „erst kommt ein Kind ungefähr in die Mitte und macht Seifenblasen,
// dann kommen von rechts und links weitere Kinder … kleine, große, leicht bunte wie echte – die fliegen hoch, zerplatzen und machen den Bildschirm
// immer beschmierter; dann kommt ein Fensterputzer mit Eimer, Leiter, Putztuch und putzt die Scheibe wieder sauber; einige dicke Blasen machen im
// Kopfbereich einen Fischaugeneffekt für einen kurzen Moment“) ----
// Ablauf je Lauf (≈ 100 s): Kind 1 läuft zur Mitte und pustet → drei weitere Kinder kommen von links und rechts → die Blasen steigen, platzen und
// jede hinterlässt Schlieren auf der „Scheibe“ (eigene Schicht ÜBER dem Kopf, nur im Kopfbild, Tippen geht hindurch) → die Kinder gehen → der
// Fensterputzer bringt Leiter, Eimer und Tuch und wischt an drei Stellen die Scheibe frei → geht → von vorn. Drei dicke Blasen wölben den Kopf kurz
// wie ein Fischauge (SVG-Verschiebungsfilter, je ~1,6 s, nie bei „Animationen aus“). Nur Bild, nichts wird gespeichert oder gesendet.
const JZB_SB_KINDER = [{ ab: 0, von: -1, ziel: .47 }, { ab: 11, von: -1, ziel: .2 }, { ab: 13, von: 1, ziel: .74 }, { ab: 16, von: 1, ziel: .9 }];
const JZB_SB_PUSTEN_BIS = 56, JZB_SB_PUTZER = 62, JZB_SB_STATIONEN = [.8, .5, .2], JZB_SB_STATION = 9, JZB_SB_DICK = [22, 35, 47], JZB_SB_LINSE_DAUER = 1.6;
const JZB_SB_HAAR = ["#3b2416", "#c98b3a", "#f1d07a", "#7a3e1d", "#1d1d1d"];
const jzbSbS = () => JZB.k * 1.15; // Maßstab der Figuren
const jzbSbBoden = () => JZB.h - 4 * JZB.k;
const jzbSbAnkunft = () => JZB_SB_PUTZER + 3; // Putzer steht an der ersten Stelle
const jzbSbFertig = () => jzbSbAnkunft() + JZB_SB_STATIONEN.length * JZB_SB_STATION; // letzte Stelle geputzt
const jzbSbEnde = () => jzbSbFertig() + 6;
function jzbSbKindLage(i, t) { // x, dir, laeuft, steht (seit wann)
  const J = JZB, k = J.k, K = JZB_SB_KINDER[i], d = t - K.ab; if (d < 0) return null;
  const start = K.von < 0 ? -18 * k : J.w + 18 * k, ziel = J.w * K.ziel, v = 26 * k, hin = Math.sign(ziel - start), da = Math.abs(ziel - start) / v;
  const blick = K.ziel < .5 ? 1 : -1, weg = K.ziel < .5 ? -1 : 1, g = t - (JZB_SB_PUSTEN_BIS + i * .8);
  if (g >= 0) { const x = ziel + weg * g * v * 1.2; return x < -30 * k || x > J.w + 30 * k ? null : { x, dir: weg, laeuft: true }; }
  if (d < da) return { x: start + hin * d * v, dir: hin, laeuft: true };
  return { x: ziel, dir: blick, steht: d - da };
}
function jzbSbNeu() {
  const fa = jzbKindFarben(4);
  return { blasen: [], tropfen: [], kinder: JZB_SB_KINDER.map((_, i) => ({ uhr: jzbZ(.2, .6), f: fa[i % 4], haar: JZB_SB_HAAR[(i * 2 + Math.floor(jzbZ(0, 5))) % JZB_SB_HAAR.length], zopf: i % 2 === 1 })),
    dick: {}, linse: null, wisch: null, nass: [] };
}
function jzbSbBlase(x, y, dir, gross) {
  const k = JZB.k, z = Math.random(), r = gross ? jzbZ(17, 21) * k : z < .62 ? jzbZ(1.8, 3.6) * k : z < .93 ? jzbZ(4.5, 7.5) * k : jzbZ(8.5, 12) * k;
  return { x, y, r, vx: dir * jzbZ(gross ? 6 : 10, gross ? 12 : 34) * k, vy: -jzbZ(gross ? 42 : 14, gross ? 55 : 34) * k, ph: jzbZ(0, 6), hue: jzbZ(0, 360), alt: 0,
    leben: gross ? 99 : jzbZ(6, 13), oben: gross ? 0 : jzbZ(3 * k, JZB.h * .62), dick: !!gross };
}
function jzbSbSchritt(F, dt) {
  const J = JZB, k = J.k, t = F.t, W = F.sb || (F.sb = jzbSbNeu()), s = jzbSbS(), boden = jzbSbBoden();
  if (t >= jzbSbEnde()) { jzbSbAufraeumen(); J.fest = null; return jzbLaufEnde(); }
  F.a = Math.min(1, t / 2);
  const G = jzbSbGlas(true);
  // 🫧 Kinder pusten: kurz eintauchen, dann ein paar Sekunden Blasen
  JZB_SB_KINDER.forEach((_, i) => { const L = jzbSbKindLage(i, t), K = W.kinder[i]; K.pustet = false; K.taucht = false;
    if (!L || L.steht === undefined || L.steht < .6 || t > JZB_SB_PUSTEN_BIS - .5) return;
    const p = (L.steht + i * 1.3) % 4.2; if (p < .7) { K.taucht = true; return; } K.pustet = true;
    const ringX = L.x + L.dir * 11.5 * s, ringY = boden - 22.8 * s;
    if ((K.uhr -= dt) <= 0 && W.blasen.length < 70) { K.uhr = jzbZ(.1, .32); const n = Math.random() < .3 ? 2 : 1;
      for (let m = 0; m < n; m++) W.blasen.push(jzbSbBlase(ringX + L.dir * jzbZ(1, 4) * k, ringY + jzbZ(-2, 2) * k, L.dir, false)); }
    if (i === 0) for (const z of JZB_SB_DICK) if (t >= z && !W.dick[z]) { W.dick[z] = 1; W.blasen.push(jzbSbBlase(ringX + L.dir * 14 * k, ringY - 6 * k, L.dir, true)); } });
  // Blasen steigen und wackeln, platzen oben oder nach einer Weile → Schlieren auf der Scheibe
  for (const b of W.blasen) { b.alt += dt; b.ph += dt; b.vy -= 2 * k * dt; b.vx *= 1 - .25 * dt; b.vy *= 1 - .08 * dt;
    b.x += (b.vx + Math.sin(b.ph * 2.1) * 6 * k) * dt; b.y += b.vy * dt;
    if (b.dick && !b.linse && !W.linse && b.y < J.h * .5) { b.linse = 1; W.linse = { b, t: 0 }; } // oben im Kopf: Fischauge
    if (b.linse && W.linse?.b === b) { b.vy *= 1 - 2.5 * dt; b.vx *= 1 - 2 * dt; } // die dicke Blase schwebt dabei fast still
    if (b.y < b.oben || b.alt > b.leben || b.x < -b.r || b.x > J.w + b.r || (b.dick && b.linse && W.linse?.b !== b)) b.platzt = true; }
  if (W.linse) { W.linse.t += dt; if (W.linse.t > JZB_SB_LINSE_DAUER) { W.linse.b.platzt = true; W.linse = null; } }
  for (const b of W.blasen.filter((x) => x.platzt)) {
    for (let i = 0; i < Math.min(10, 3 + b.r / k); i++) { const a = jzbZ(0, 7), v = jzbZ(15, 45) * k; W.tropfen.push({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: 1 }); }
    if (G && b.x > 0 && b.x < J.w && b.y > 0) jzbSbFleck(G, b.x, b.y, b.r);
  }
  W.blasen = W.blasen.filter((b) => !b.platzt);
  for (const d of W.tropfen) { d.vy += 120 * k * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a -= dt * 2.5; }
  W.tropfen = W.tropfen.filter((d) => d.a > 0);
  // 🔍 Fischauge: die dicke Blase wölbt kurz den ganzen Kopf
  const h = J.s?.parentElement;
  if (W.linse && !jzbSbLinseAus()) { const L = W.linse, q = Math.min(1, L.t / .35, (JZB_SB_LINSE_DAUER - L.t) / .35); jzbSbLinseSetzen(h, L.b.x, L.b.y, L.b.r * 2.4, Math.max(0, q)); }
  else jzbSbLinseSetzen(h, 0, 0, 0);
  // 🧽 Fensterputzer: wischt in Bahnen – was er wischt, ist wieder klar
  const P = jzbSbPutzer(t);
  if (P?.wischt != null && G) { const ww = jzbSbWischPunkt(P);
    if (W.wisch) { const c = G.dctx; c.save(); c.globalCompositeOperation = "destination-out"; c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 34 * k; c.beginPath(); c.moveTo(W.wisch.x, W.wisch.y); c.lineTo(ww.x, ww.y); c.stroke();
      c.strokeStyle = "rgba(0,0,0,1)"; c.lineWidth = 26 * k; c.stroke(); c.restore();
      W.nass.push({ x0: W.wisch.x, y0: W.wisch.y, x1: ww.x, y1: ww.y, a: .5 }); }
    W.wisch = ww; } else W.wisch = null;
  for (const n of W.nass) n.a -= dt * .45; W.nass = W.nass.filter((n) => n.a > 0).slice(-120);
  if (G) G.blass = t > jzbSbFertig() ? Math.min(1, (t - jzbSbFertig()) / 1.5) : 0; // zum Schluss: Reste verschwinden – die Scheibe ist sauber
}
function jzbSbPutzer(t) { // x, dir, laeuft, traegt (Leiter auf der Schulter), klettern 0…1, wischt 0…1, cx (Stelle)
  const J = JZB, k = J.k, w = J.w, st = JZB_SB_STATIONEN.map((f) => w * f), A0 = jzbSbAnkunft(); if (t < JZB_SB_PUTZER) return null;
  if (t < A0) { const p = jzbEase((t - JZB_SB_PUTZER) / (A0 - JZB_SB_PUTZER)); return { x: w + 40 * k + (st[0] - w - 40 * k) * p, dir: -1, laeuft: p < 1, traegt: true }; }
  const i = Math.floor((t - A0) / JZB_SB_STATION);
  if (i >= st.length) { const x = st[st.length - 1] - (t - jzbSbFertig()) * 34 * k; return x < -60 * k ? null : { x, dir: -1, laeuft: true, traegt: true }; }
  const p = t - A0 - i * JZB_SB_STATION, cx = st[i];
  if (p < 1.2) return i ? { x: st[i - 1] + (cx - st[i - 1]) * jzbEase(p / 1.2), dir: -1, laeuft: true, traegt: true } : { x: cx, dir: -1, klettern: 0 };
  if (p < 1.8) return { x: cx, dir: -1, klettern: (p - 1.2) / .6 };
  if (p < 8.4) return { x: cx, dir: -1, klettern: 1, wischt: (p - 1.8) / 6.6, cx };
  return { x: cx, dir: -1, klettern: Math.max(0, 1 - (p - 8.4) / .6) };
}
function jzbSbWischPunkt(P) { // das Tuch fährt in 10 Bahnen hin und her von oben nach unten
  const J = JZB, k = J.k, halb = J.w * .18, oben = 4 * k, unten = J.h - 8 * k;
  return { x: P.cx + Math.sin(P.wischt * Math.PI * 10) * halb, y: oben + P.wischt * (unten - oben) };
}
const jzbSbLinseAus = () => document.documentElement.classList.contains("ohne-anim") || (typeof SPAR !== "undefined" && SPAR?.an) || matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
// ---- Scheibe (Schicht über dem Kopf): Schlieren sammeln sich in einem eigenen Bild, das Tuch radiert sie wieder weg ----
function jzbSbGlas(an) {
  const J = JZB, h = J.s?.parentElement; let g = h?.querySelector(":scope > .bb-glas");
  if (!an || !h) { document.querySelectorAll(".bb-glas").forEach((x) => x.remove()); J.sbGlas = null; return null; } // auch, wenn die Bühne schon weg ist
  if (!g || !J.sbGlas) { g?.remove(); g = document.createElement("canvas"); g.className = "jz-schicht bb-glas"; g.setAttribute("aria-hidden", "true"); h.appendChild(g);
    const dreck = document.createElement("canvas"); J.sbGlas = { cv: g, ctx: g.getContext("2d"), dreck, dctx: dreck.getContext("2d"), w: 0, h: 0, blass: 0 }; }
  const G = J.sbGlas, w = g.clientWidth, hh = g.clientHeight, dpr = J.dpr || 1;
  if (w && hh && (w !== G.w || hh !== G.h)) { for (const cv of [G.cv, G.dreck]) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
    G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); G.dctx.setTransform(dpr, 0, 0, dpr, 0, 0); G.w = w; G.h = hh; }
  return G;
}
function jzbSbFleck(G, x, y, r) { // geplatzte Blase: milchiger Fleck mit schillerndem Rand, Spritzer und – bei größeren – eine Laufspur nach unten
  const c = G.dctx, k = JZB.k, R = r * jzbZ(1.3, 2);
  const g = c.createRadialGradient(x, y, R * .15, x, y, R); g.addColorStop(0, "rgba(255,255,255,.08)"); g.addColorStop(.75, "rgba(255,255,255,.2)"); g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
  const a0 = jzbZ(0, 6); c.lineWidth = .8 * k; c.strokeStyle = `hsla(${jzbZ(0, 360)},80%,82%,.28)`; c.beginPath(); c.arc(x, y, R * .8, a0, a0 + jzbZ(2, 4.5)); c.stroke();
  for (let i = 0; i < Math.round(3 + r / k); i++) { const a = jzbZ(0, 7), d = R * jzbZ(.9, 1.9); c.fillStyle = "rgba(255,255,255,.38)"; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, jzbZ(.5, 1.4) * k, 0, 7); c.fill(); }
  if (r > 4 * k) { const l = jzbZ(8, 22) * k * Math.min(2.5, r / (6 * k)), lg = c.createLinearGradient(x, y, x, y + l);
    lg.addColorStop(0, "rgba(255,255,255,.18)"); lg.addColorStop(1, "rgba(255,255,255,.04)"); c.fillStyle = lg;
    c.beginPath(); c.moveTo(x - 1.3 * k, y); c.lineTo(x + 1.3 * k, y); c.lineTo(x + .5 * k, y + l); c.lineTo(x - .5 * k, y + l); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.arc(x, y + l, 1.4 * k, 0, 7); c.fill(); }
}
function jzbSbAufraeumen() { jzbSbGlas(false); jzbSbLinseSetzen(JZB.s?.parentElement || document.querySelector("#v-start .hero"), 0, 0, 0); }
// ---- 🔍 Fischauge: SVG-Filter auf dem Kopf; die Verschiebungskarte zieht Bildpunkte zur Mitte der Blase (= Vergrößerung, zum Rand hin weich) ----
let JZB_SB_KARTE = "";
function jzbSbLinseKarte() {
  if (JZB_SB_KARTE) return JZB_SB_KARTE;
  const n = 96, cv = document.createElement("canvas"); cv.width = cv.height = n; const c = cv.getContext("2d"), img = c.createImageData(n, n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const u = (i + .5) / n * 2 - 1, v = (j + .5) / n * 2 - 1, q = u * u + v * v, o = (j * n + i) * 4;
    if (q >= 1) continue; const f = (1 - q) * .45; img.data[o] = Math.round((.5 - u * f) * 255); img.data[o + 1] = Math.round((.5 - v * f) * 255); img.data[o + 2] = 128; img.data[o + 3] = 255; }
  c.putImageData(img, 0, 0); return (JZB_SB_KARTE = cv.toDataURL());
}
function jzbSbLinseSetzen(h, x, y, r, staerke = 1) { // r = 0 → aus
  if (!h) return;
  if (!r || staerke <= 0) { if (h.style.filter) h.style.filter = ""; return; }
  let s = document.getElementById("kcSbLinseSvg");
  if (!s) { const d = document.createElement("div");
    d.innerHTML = '<svg id="kcSbLinseSvg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><filter id="kcSbLinse" x="-0.05" y="-0.05" width="1.1" height="1.15" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
      + '<feFlood flood-color="rgb(128,128,128)" result="n"/><feImage id="kcSbLinseBild" preserveAspectRatio="none" result="k"/><feComposite in="k" in2="n" operator="over" result="m"/>'
      + '<feDisplacementMap id="kcSbLinseDm" in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
    s = d.firstElementChild; document.body.appendChild(s);
    const b = s.querySelector("#kcSbLinseBild"), u = jzbSbLinseKarte(); b.setAttribute("href", u); b.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", u); }
  const b = s.querySelector("#kcSbLinseBild");
  b.setAttribute("x", (x - r).toFixed(1)); b.setAttribute("y", (y - r).toFixed(1)); b.setAttribute("width", (2 * r).toFixed(1)); b.setAttribute("height", (2 * r).toFixed(1));
  s.querySelector("#kcSbLinseDm").setAttribute("scale", (r * staerke).toFixed(1));
  if (!h.style.filter) h.style.filter = "url(#kcSbLinse)";
}
// ---- Malen ----
function jzbSbBlaseMalen(c, b) { // echte Seifenblase: fast durchsichtig, schillernder Rand, Glanzlicht
  const r = b.r * (1 + Math.sin(b.ph * 3) * .04), x = b.x, y = b.y;
  const g = c.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,.03)"); g.addColorStop(.78, `hsla(${b.hue},90%,82%,.1)`); g.addColorStop(1, "rgba(255,255,255,.38)");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.lineWidth = Math.max(.6, r * .08);
  c.strokeStyle = `hsla(${b.hue},90%,74%,.6)`; c.beginPath(); c.arc(x, y, r * .93, b.ph, b.ph + 2.2); c.stroke();
  c.strokeStyle = `hsla(${(b.hue + 140) % 360},90%,72%,.5)`; c.beginPath(); c.arc(x, y, r * .93, b.ph + 2.7, b.ph + 4.7); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = .6; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  c.fillStyle = "rgba(255,255,255,.88)"; c.beginPath(); c.ellipse(x - r * .38, y - r * .42, Math.max(.6, r * .22), Math.max(.4, r * .12), -.6, 0, 7); c.fill();
  if (r > 3) { c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(x + r * .42, y + r * .4, r * .08, 0, 7); c.fill(); }
}
function jzbSbKindMalen(c, x, y, s, dir, K, opt) { // Sommerkind: T-Shirt, kurze Hose, Pustering am Stab
  const T = JZB.T, sw = opt.laeuft ? Math.sin(T * 12 + opt.ph) * 3 : 0, f = K.f, haut = "#f2c29b";
  c.save(); c.translate(x, y); c.scale(dir * s, s); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = haut; c.lineWidth = 2.3; c.beginPath(); c.moveTo(-1.5, -7); c.lineTo(-1.5 - sw, -.8); c.moveTo(1.5, -7); c.lineTo(1.5 + sw, -.8); c.stroke();
  c.fillStyle = "#2b2b2b"; for (const fx of [-1.5 - sw, 1.5 + sw]) { c.beginPath(); c.ellipse(fx + .8, -.5, 1.9, 1.1, 0, 0, 7); c.fill(); }
  c.fillStyle = f[1]; c.beginPath(); c.moveTo(-3.8, -10.5); c.lineTo(3.8, -10.5); c.lineTo(3.6, -6.5); c.lineTo(.3, -6.5); c.lineTo(0, -8); c.lineTo(-.3, -6.5); c.lineTo(-3.6, -6.5); c.closePath(); c.fill();
  const ky = -10;
  c.strokeStyle = haut; c.lineWidth = 2; c.beginPath(); c.moveTo(-1, ky - 7); c.lineTo(-3 - sw * .4, ky - 1); c.stroke(); // hinterer Arm
  c.fillStyle = f[0]; c.beginPath(); c.ellipse(0, ky - 4.5, 4.2, 5.4, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(0,0,0,.12)"; c.beginPath(); c.ellipse(-1.3, ky - 4, 2.2, 4.6, 0, 0, 7); c.fill();
  const hx = opt.pustet ? 6.5 : opt.taucht ? 5 : 3 + sw * .4, hy = opt.pustet ? ky - 11 : opt.taucht ? ky - 2 : ky - 1;
  c.strokeStyle = haut; c.lineWidth = 2; c.beginPath(); c.moveTo(1, ky - 7); c.quadraticCurveTo(hx - 1, (ky - 7 + hy) / 2 + 2, hx, hy); c.stroke();
  // Stab und Ring (mit Seifenhaut)
  const rx = hx + 2.6, ry = hy - 1.2; c.strokeStyle = "#e63946"; c.lineWidth = .9; c.beginPath(); c.moveTo(hx, hy); c.lineTo(rx, ry); c.stroke();
  c.fillStyle = "rgba(200,235,255,.35)"; c.strokeStyle = "#e63946"; c.lineWidth = .8; c.beginPath(); c.ellipse(rx + 1.9, ry - .6, 1.9, 2.3, 0, 0, 7); c.fill(); c.stroke();
  if (opt.taucht) { c.fillStyle = "#7fd3ff"; c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = .5; c.beginPath(); c.rect(rx - .5, ry + 1.5, 4.6, 5); c.fill(); c.stroke(); } // Fläschchen mit Seifenlauge
  const kh = ky - 13.5; // Kopf
  c.fillStyle = "#f6cba6"; c.beginPath(); c.arc(0, kh, 4.2, 0, 7); c.fill();
  c.fillStyle = K.haar; c.beginPath(); c.arc(-.4, kh - .8, 4.4, Math.PI * .92, Math.PI * 2.08); c.fill(); c.beginPath(); c.arc(-3, kh + .2, 2, 0, 7); c.fill();
  if (K.zopf) { c.beginPath(); c.ellipse(-5.6, kh + 1.6, 1.5, 3, .5, 0, 7); c.fill(); c.fillStyle = f[2]; c.beginPath(); c.arc(-4.6, kh - .2, .9, 0, 7); c.fill(); }
  c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(2.1, kh - .3, .6, 0, 7); c.fill();
  if (opt.pustet) { c.fillStyle = "rgba(255,130,130,.55)"; c.beginPath(); c.arc(2.4, kh + 1.5, 1.5, 0, 7); c.fill(); c.strokeStyle = "#a0523a"; c.lineWidth = .7; c.beginPath(); c.arc(3.7, kh + 1.4, .7, 0, 7); c.stroke(); }
  else { c.strokeStyle = "#a0523a"; c.lineWidth = .7; c.beginPath(); c.arc(2, kh + 1.3, 1.2, .2, Math.PI * .8); c.stroke(); }
  c.restore();
}
function jzbSbPutzerMalen(c, P, k, W) { // Fensterputzer: blaue Latzhose, Kappe, Leiter, Eimer, gelbes Tuch (weit weg: an der Teleskopstange)
  const s = jzbSbS(), boden = jzbSbBoden(), T = JZB.T, haut = "#f1c19a";
  const leiterH = 46 * s, steh = (P.klettern || 0) * leiterH * .42;
  if (!P.traegt) { // Eimer und angelehnte Leiter
    c.save(); c.translate(P.x + 15 * s, boden); c.fillStyle = "#9aa4ad"; c.strokeStyle = "#5c656d"; c.lineWidth = .8 * k;
    c.beginPath(); c.moveTo(-5 * s, -9 * s); c.lineTo(5 * s, -9 * s); c.lineTo(4 * s, 0); c.lineTo(-4 * s, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "rgba(190,230,255,.9)"; c.beginPath(); c.ellipse(0, -9 * s, 5 * s, 1.4 * s, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(0, -9 * s, 5 * s, Math.PI, 0); c.stroke(); c.restore();
    c.save(); c.translate(P.x, boden); c.strokeStyle = "#b8c0c8"; c.lineWidth = 1.6 * s; c.lineCap = "round";
    c.beginPath(); c.moveTo(-6 * s, 0); c.lineTo(-2 * s, -leiterH); c.moveTo(6 * s, 0); c.lineTo(2 * s, -leiterH); c.stroke();
    c.lineWidth = 1.1 * s; for (let i = 1; i < 9; i++) { const q = i / 9, y = -leiterH * q, b = 6 - 4 * q; c.beginPath(); c.moveTo(-b * s, y); c.lineTo(b * s, y); c.stroke(); }
    c.restore(); }
  // Figur
  const fy = boden - steh, sw = P.laeuft ? Math.sin(T * 11) * 3 : 0;
  c.save(); c.translate(P.x, fy); c.scale(P.dir * s, s); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = "#24476b"; c.lineWidth = 3; c.beginPath(); c.moveTo(-1.6, -10); c.lineTo(-1.6 - sw, -1); c.moveTo(1.6, -10); c.lineTo(1.6 + sw, -1); c.stroke();
  c.fillStyle = "#2b2b2b"; for (const fx of [-1.6 - sw, 1.6 + sw]) { c.beginPath(); c.ellipse(fx + .9, -.6, 2.2, 1.2, 0, 0, 7); c.fill(); }
  c.fillStyle = "#e9e3d6"; c.beginPath(); c.ellipse(0, -17, 4.6, 6.6, 0, 0, 7); c.fill(); // Hemd
  c.fillStyle = "#2f5d8c"; c.fillRect(-4, -18, 8, 9); c.fillRect(-3.4, -22, 1.2, 5); c.fillRect(2.2, -22, 1.2, 5); // Latzhose
  c.fillStyle = "#f6cba6"; c.beginPath(); c.arc(0, -27, 4.4, 0, 7); c.fill();
  c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(2.2, -27.4, .6, 0, 7); c.fill(); c.strokeStyle = "#a0523a"; c.lineWidth = .7; c.beginPath(); c.arc(2, -25.6, 1.2, .2, Math.PI * .8); c.stroke();
  c.fillStyle = "#d62828"; c.beginPath(); c.arc(0, -28.5, 4.6, Math.PI, 0); c.fill(); c.fillRect(0, -29, 7, 1.6); // Kappe mit Schirm
  c.restore();
  // Arm: trägt die Leiter, hält das Tuch oder wischt (die Stange verlängert, wenn das Tuch weit weg ist)
  const sx = P.x + P.dir * 1 * s, sy = fy - 21 * s;
  if (P.traegt) {
    c.save(); c.translate(P.x, fy - 23 * s); c.rotate(-.06); c.strokeStyle = "#b8c0c8"; c.lineWidth = 1.5 * s; c.lineCap = "round";
    c.beginPath(); c.moveTo(-26 * s, -1.5 * s); c.lineTo(22 * s, -1.5 * s); c.moveTo(-26 * s, 1.5 * s); c.lineTo(22 * s, 1.5 * s); c.stroke();
    for (let x = -24; x <= 20; x += 5) { c.beginPath(); c.moveTo(x * s, -1.5 * s); c.lineTo(x * s, 1.5 * s); c.stroke(); } c.restore();
    c.strokeStyle = haut; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + P.dir * 3 * s, sy - 3 * s); c.stroke();
    c.save(); c.translate(P.x - P.dir * 7 * s, boden); c.fillStyle = "#9aa4ad"; c.fillRect(-4 * s, -12 * s, 8 * s, 8 * s); c.restore(); // Eimer in der anderen Hand
    return; }
  const ziel = P.wischt != null ? jzbSbWischPunkt(P) : { x: sx + P.dir * 6 * s, y: sy + 6 * s }, arm = 9 * s, d = Math.hypot(ziel.x - sx, ziel.y - sy);
  const hx = d > arm ? sx + (ziel.x - sx) / d * arm : ziel.x, hy = d > arm ? sy + (ziel.y - sy) / d * arm : ziel.y;
  c.strokeStyle = haut; c.lineWidth = 2.1 * s; c.lineCap = "round"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(hx, hy); c.stroke();
  if (d > arm) { c.strokeStyle = "#8d99a6"; c.lineWidth = 1.1 * s; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ziel.x, ziel.y); c.stroke(); }
  c.save(); c.translate(ziel.x, ziel.y); c.rotate(Math.sin(T * 9) * .3); c.fillStyle = "#ffd23f"; c.strokeStyle = "#c79a00"; c.lineWidth = .6;
  c.beginPath(); c.moveTo(-5 * s, -3 * s); c.quadraticCurveTo(0, -5 * s, 5 * s, -3 * s); c.lineTo(4.4 * s, 3.4 * s); c.quadraticCurveTo(0, 5 * s, -4.6 * s, 3 * s); c.closePath(); c.fill(); c.stroke(); c.restore();
  void W;
}
function jzbSeifenblasenMalen(c, F) {
  const J = JZB, k = J.k, W = F.sb, t = F.t; if (!W) return;
  const boden = jzbSbBoden(), s = jzbSbS();
  // Wiese
  const g = c.createLinearGradient(0, boden - 6 * k, 0, J.h); g.addColorStop(0, "rgba(98,170,72,.92)"); g.addColorStop(1, "rgba(60,128,48,.97)");
  c.fillStyle = g; c.beginPath(); c.moveTo(0, J.h); for (let x = 0; x <= J.w; x += 6 * k) c.lineTo(x, boden - 3 * k - Math.sin(x * .09) * 1.4 * k); c.lineTo(J.w, J.h); c.closePath(); c.fill();
  for (let i = 0; i < 14; i++) { const x = (i * 71 % 100) / 100 * J.w, y = boden + (i * 37 % 4) * k; c.fillStyle = ["#fff", "#ffd23f", "#ff8fb1"][i % 3]; c.beginPath(); c.arc(x, y, 1.3 * k, 0, 7); c.fill(); }
  // Kinder
  JZB_SB_KINDER.forEach((_, i) => { const L = jzbSbKindLage(i, t); if (!L) return; const K = W.kinder[i];
    jzbSbKindMalen(c, L.x, boden, s, L.dir, K, { laeuft: L.laeuft, ph: i * 1.7, pustet: K.pustet, taucht: K.taucht }); });
  for (const b of W.blasen) jzbSbBlaseMalen(c, b);
  c.fillStyle = "rgba(255,255,255,.75)"; for (const d of W.tropfen) { c.globalAlpha = Math.max(0, d.a) * F.a; c.beginPath(); c.arc(d.x, d.y, .9 * k, 0, 7); c.fill(); } c.globalAlpha = F.a;
  // Scheibe: Schlieren, nasse Wischspur, Fensterputzer (vor dem Kopf)
  const G = J.sbGlas; if (!G?.cv?.isConnected) return;
  const gc = G.ctx; gc.clearRect(0, 0, G.w, G.h);
  gc.globalAlpha = 1 - (G.blass || 0); gc.drawImage(G.dreck, 0, 0, G.w, G.h); gc.globalAlpha = 1;
  gc.lineCap = "round"; for (const n of W.nass) { gc.strokeStyle = `rgba(255,255,255,${n.a * .25})`; gc.lineWidth = 3 * k; gc.beginPath(); gc.moveTo(n.x0, n.y0 + 10 * k); gc.lineTo(n.x1, n.y1 + 10 * k); gc.stroke(); }
  const P = jzbSbPutzer(t); if (P) jzbSbPutzerMalen(gc, P, k, W);
}
// ---- 🚧 Baustelle (2.617.0 KC-CLUB-BAUSTELLE, Wunsch Hansi „rechts ein Haufen Erde, ein Radlader in Baustellengelb schaufelt ihn auf einen
// Kipplaster, die Abgase schreiben den Namen, zwischendurch laufen Arbeiter mit gelben Helmen durch; dann kommt ein Sprengkommando, packt überall
// Dynamit hin, einer drückt den Auslöser – der ganze grüne Kopf fliegt in die Luft; Ton bei der Sprengung mit Glasklirren“) ----
// Ablauf je Lauf (≈ 77 s): Radlader fährt viermal Haufen → Laster (Haufen schrumpft, Ladefläche füllt sich), aus dem Auspuff steigen Rauchwolken
// und werden zu den Buchstaben des Vornamens → Laster fährt voll davon, Radlader fährt weg → Sprengkommando (rote Helme) verteilt Dynamit,
// Schild „Achtung Sprengung“, Kabel zum Zünder → 3 – 2 – 1 → Knall: der ganze Kopf zerfällt in Stücke und fliegt davon (Ton: Rumms + Glas
// klirrt, nur bei ⚙️ Ton an und außerhalb der Ruhezeit) → 6,5 s leer → der Kopf ist wieder da, nächster Lauf. Nur Bild, nichts wird gespeichert.
const JZB_BS_LADEN_AB = 3, JZB_BS_ZYKLUS = 9, JZB_BS_LADUNGEN = 4, JZB_BS_NAME_AB = 8, JZB_BS_ABFAHRT = 40, JZB_BS_SPRENG = 49, JZB_BS_ZURUECK = 61,
  JZB_BS_ZAEHLEN = 66.5, JZB_BS_KNALL = 70, JZB_BS_PAUSE = 6.5, JZB_BS_WOLKE = 2.4;
const JZB_BS_ARBEITER = [6, 21, 34]; // Sekunden: Arbeiter mit gelben Helmen laufen durch (mit Brett, Schubkarre, winkend)
const jzbBsName = () => [...(jzbEisNameText() || "Köcheclub")].slice(0, 12);
const jzbBsTakt = () => Math.min(2.4, 22 / Math.max(1, jzbBsName().length));
const jzbBsS = () => JZB.k * 1.15; // Maßstab der Fahrzeuge
function jzbBsOrt() {
  const J = JZB, k = J.k, boden = J.h - 5 * k;
  return { boden, horizont: boden - 22 * k, laster: JZB_RAND + 40 * k, haufen: J.w - JZB_RAND - 34 * k, zuender: JZB_RAND + 12 * k };
}
const jzbBsHaufen = (t) => { // Größe des Erdhaufens 1 … 0,32
  let n = 0; for (let i = 0; i < JZB_BS_LADUNGEN; i++) { const p = t - (JZB_BS_LADEN_AB + i * JZB_BS_ZYKLUS) - 2; n += Math.max(0, Math.min(1, p / 1.2)); }
  return 1 - n * .17;
};
const jzbBsFuellung = (t) => { let n = 0; for (let i = 0; i < JZB_BS_LADUNGEN; i++) n += Math.max(0, Math.min(1, (t - (JZB_BS_LADEN_AB + i * JZB_BS_ZYKLUS) - 6.4) / .6)); return n / JZB_BS_LADUNGEN; };
function jzbBsLader(t, O) { // Radlader: x, dir (1 = nach rechts), quetsch (Wenden), schaufel 0 (unten) … 1 (oben), kippt 0…1, voll
  const J = JZB, k = J.k, s = jzbBsS(), bett = O.laster + 7 * k, xL = bett + 22 * s;
  const xR = (z) => O.haufen - 34 * k * jzbBsHaufen(z) - 22 * s + 5 * k;
  const ende = JZB_BS_LADEN_AB + JZB_BS_LADUNGEN * JZB_BS_ZYKLUS;
  if (t < JZB_BS_LADEN_AB) { const p = jzbEase(t / JZB_BS_LADEN_AB); return { x: -40 * k + (xL + 10 * k + 40 * k) * p, dir: 1, quetsch: 1, schaufel: .35, kippt: 0, voll: false, faehrt: p < 1 }; }
  if (t >= ende) { const p = t - ende; return { x: xL + p * 40 * k, dir: 1, quetsch: 1, schaufel: .35, kippt: 0, voll: false, faehrt: true, weg: xL + p * 40 * k > J.w + 50 * k }; }
  const i = Math.floor((t - JZB_BS_LADEN_AB) / JZB_BS_ZYKLUS), z0 = JZB_BS_LADEN_AB + i * JZB_BS_ZYKLUS, p = t - z0, r = xR(z0);
  const wend = (a, von) => { const q = Math.min(1, Math.max(0, (p - a) / .5)); return { dir: q < .5 ? von : -von, quetsch: Math.abs(1 - 2 * q) * .85 + .15 }; };
  if (p < 2) { const q = jzbEase(p / 2); return { x: xL + 10 * k + (r - xL - 10 * k) * q, dir: 1, quetsch: 1, schaufel: .35 - q * .3, kippt: 0, voll: false, faehrt: true }; }
  if (p < 3.2) { const q = (p - 2) / 1.2; return { x: r + Math.sin(q * Math.PI) * 3 * k, dir: 1, quetsch: 1, schaufel: q < .4 ? .05 : .05 + (q - .4) / .6 * .45, kippt: 0, voll: q > .45, faehrt: false, graebt: q < .6 }; }
  if (p < 3.7) return { x: r, ...wend(3.2, 1), schaufel: .5, kippt: 0, voll: true, faehrt: false };
  if (p < 5.7) { const q = jzbEase((p - 3.7) / 2); return { x: r + (xL - r) * q, dir: -1, quetsch: 1, schaufel: .5, kippt: 0, voll: true, faehrt: true }; }
  if (p < 7) { const q = (p - 5.7) / 1.3; return { x: xL, dir: -1, quetsch: 1, schaufel: .5 + Math.min(1, q * 1.6) * .5, kippt: Math.max(0, (q - .55) / .45), voll: q < .8, faehrt: false, kipptJetzt: q > .6 }; }
  if (p < 7.5) { const q = (p - 7) / .5; return { x: xL, dir: -1, quetsch: 1, schaufel: 1 - q * .65, kippt: 1 - q, voll: false, faehrt: false }; }
  if (p < 8) return { x: xL, ...wend(7.5, -1), schaufel: .35, kippt: 0, voll: false, faehrt: false };
  return { x: xL + Math.min(1, (p - 8) / 1) * 10 * k, dir: 1, quetsch: 1, schaufel: .35, kippt: 0, voll: false, faehrt: true };
}
const jzbBsAuspuff = (L, O) => { const s = jzbBsS(); return { x: L.x - L.dir * L.quetsch * 15 * s, y: O.boden - 30 * s }; };
function jzbBsNameLage(O, k) {
  const J = JZB, z = jzbBsName(), fs = Math.round(Math.max(10, Math.min(24 * k, (O.horizont - 8 * k) * .75))), f = `800 ${fs}px "Trebuchet MS", Verdana, sans-serif`;
  const c = J.ctx; c.save(); c.font = f; const b = z.map((ch) => c.measureText(ch).width + 1.5 * k); c.restore();
  const ges = b.reduce((a, v) => a + v, 0); let x = Math.max(JZB_RAND, Math.min(J.w - JZB_RAND - ges, J.w * .5 - ges / 2));
  return { z, fs, f, y: Math.max(fs * .85 + 2, O.horizont - 30 * k), pos: b.map((w) => { const m = x + w / 2; x += w; return m; }) };
}
function jzbBsNeu() {
  const J = JZB, k = J.k, O = jzbBsOrt(), w = J.w;
  const dyn = [[.12, 0], [.3, .5], [.47, 0], [.62, .62], [.78, 0], [.9, .4], [.2, .82], [.72, .86]].map(([fx, fy]) => ({ x: JZB_RAND + 8 * k + (w - 2 * JZB_RAND - 16 * k) * fx, y: O.boden - 2 * k - fy * (O.boden - 16 * k), tp: -1 }));
  return { rauch: [], rUhr: 0, krumen: [], dyn, knall: false, blitz: 0, piep: {}, staub: [] };
}
function jzbBsSprengmeister(t, O) { // x, dir, ph (Schritte), kniet, drueckt
  const J = JZB, k = J.k, rechts = J.w - JZB_RAND - 30 * k;
  if (t < JZB_BS_SPRENG) return null;
  if (t < JZB_BS_ZURUECK) { const p = (t - JZB_BS_SPRENG) / (JZB_BS_ZURUECK - JZB_BS_SPRENG); return { x: -14 * k + (rechts + 14 * k) * p, dir: 1, ph: t * 9, geht: true }; }
  if (t < JZB_BS_ZAEHLEN - .6) { const p = jzbEase((t - JZB_BS_ZURUECK) / (JZB_BS_ZAEHLEN - .6 - JZB_BS_ZURUECK)); return { x: rechts + (O.zuender + 12 * k - rechts) * p, dir: -1, ph: t * 14, geht: p < 1 }; }
  return { x: O.zuender + 12 * k, dir: -1, ph: 0, kniet: true, drueckt: t > JZB_BS_KNALL - .35 ? 1 : 0 };
}
function jzbBsSchritt(F, dt) {
  const J = JZB, k = J.k, t = F.t, O = jzbBsOrt(), W = F.bs || (F.bs = jzbBsNeu());
  if (t >= JZB_BS_KNALL + JZB_BS_PAUSE) { J.fest = null; return jzbLaufEnde(); }
  F.a = Math.min(1, t / 2);
  const L = jzbBsLader(t, O), A = jzbBsAuspuff(L, O);
  // 💨 Abgase: kleine dunkle Wölkchen, solange der Radlader im Bild ist (beim Fahren mehr)
  if (!L.weg && t < JZB_BS_ABFAHRT + 6 && (W.rUhr -= dt) <= 0) { W.rUhr = L.faehrt || L.graebt ? jzbZ(.12, .22) : jzbZ(.35, .6);
    W.rauch.push({ x: A.x, y: A.y, r: 1.6 * k, a: .45, vx: -L.dir * jzbZ(2, 6) * k }); }
  for (const r of W.rauch) { r.y -= 11 * k * dt; r.x += r.vx * dt; r.r += 3 * k * dt; r.a -= dt * .32; }
  W.rauch = W.rauch.filter((r) => r.a > 0).slice(-60);
  // Erdbrocken fallen beim Abkippen auf die Ladefläche
  if (L.kipptJetzt && Math.random() < dt * 30) { const s = jzbBsS(); W.krumen.push({ x: L.x - 26 * s + jzbZ(-4, 4) * k, y: O.boden - 26 * s, vy: jzbZ(0, 20) * k, r: jzbZ(1, 2.2) * k }); }
  for (const b of W.krumen) { b.vy += 260 * k * dt; b.y += b.vy * dt; }
  W.krumen = W.krumen.filter((b) => b.y < O.boden - 14 * k);
  // 🧨 Dynamit: der Sprengmeister legt es beim Vorbeigehen (hoch oben wirft er es hin)
  const M = jzbBsSprengmeister(t, O);
  if (M && t < JZB_BS_ZURUECK) for (const d of W.dyn) if (d.tp < 0 && M.x >= d.x) d.tp = t;
  // 3 – 2 – 1 (Piepton bei Ton an)
  for (const n of [0, 1, 2]) { const z = JZB_BS_ZAEHLEN + n * 1.1; if (t >= z && !W.piep[n]) { W.piep[n] = 1; jzbBsTon("piep", n); } }
  // 💥 Knall
  if (t >= JZB_BS_KNALL && !W.knall) { W.knall = true; W.blitz = 1; jzbBsTon("knall"); setTimeout(jzbBsSprengen, 90); try { if (einst("ton", true)) navigator.vibrate?.([90, 40, 160]); } catch {} }
  W.blitz = Math.max(0, W.blitz - dt * 3);
}
// ---- Malen ----
function jzbBsLaderMalen(c, L, O, T) {
  const s = jzbBsS(); c.save(); c.translate(L.x, O.boden); c.scale(L.dir * L.quetsch * s, s);
  const ruck = L.faehrt ? Math.sin(T * 22) * .35 : 0;
  // Arm + Schaufel (hinter der Kabine beginnend)
  const by = -4 - L.schaufel * 26, bx = 22 - L.schaufel * 3;
  c.strokeStyle = "#d9a300"; c.lineWidth = 3.4; c.lineCap = "round"; c.beginPath(); c.moveTo(3, -17 + ruck); c.lineTo(bx, by); c.stroke();
  c.strokeStyle = "#6b6b6b"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(4, -12 + ruck); c.lineTo(bx - 4, by + 3); c.stroke(); // Hydraulik
  c.save(); c.translate(bx, by); c.rotate(L.kippt * 1.25 - (1 - L.schaufel) * .15);
  c.fillStyle = "#e0a800"; c.strokeStyle = "#7a5c00"; c.lineWidth = .8; c.beginPath(); c.moveTo(-1, -6); c.lineTo(9, -6); c.lineTo(11, 3); c.lineTo(-1, 5); c.closePath(); c.fill(); c.stroke();
  if (L.voll) { c.fillStyle = "#6b4423"; c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(5, -11, 10, -6); c.closePath(); c.fill(); }
  c.restore();
  // Räder
  for (const [wx, wr] of [[-12, 7.2], [11, 6.6]]) { c.fillStyle = "#1d1d1d"; c.beginPath(); c.arc(wx, -wr, wr, 0, 7); c.fill(); c.fillStyle = "#9a9a9a"; c.beginPath(); c.arc(wx, -wr, wr * .42, 0, 7); c.fill();
    c.strokeStyle = "#444"; c.lineWidth = .9; const d = T * (L.faehrt ? 9 : 0); for (let i = 0; i < 4; i++) { const a = d + i * Math.PI / 2; c.beginPath(); c.moveTo(wx + Math.cos(a) * wr * .45, -wr + Math.sin(a) * wr * .45); c.lineTo(wx + Math.cos(a) * wr * .95, -wr + Math.sin(a) * wr * .95); c.stroke(); } }
  // Körper (Baustellengelb), Kabine, Auspuff, Rundumleuchte
  c.translate(0, ruck);
  c.fillStyle = "#f2b705"; c.strokeStyle = "#8a6500"; c.lineWidth = .8;
  c.beginPath(); c.moveTo(-20, -9); c.lineTo(-20, -19); c.lineTo(-7, -20); c.lineTo(8, -17); c.lineTo(8, -9); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "#2b2b2b"; c.fillRect(-20, -11, 28, 2.2); // Stoßleiste
  c.fillStyle = "#f2b705"; c.beginPath(); c.moveTo(-7, -19); c.lineTo(-6, -32); c.lineTo(5, -32); c.lineTo(7, -18); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(170,215,240,.9)"; c.beginPath(); c.moveTo(-4.6, -21); c.lineTo(-4, -30); c.lineTo(3.8, -30); c.lineTo(5, -21); c.closePath(); c.fill();
  c.fillStyle = "#1d1d1d"; c.beginPath(); c.arc(-.5, -25, 1.6, 0, 7); c.fill(); c.fillRect(-1.6, -23.6, 2.4, 3); // Fahrer
  c.fillStyle = "#3a3a3a"; c.fillRect(-16, -29, 2.2, 10); c.fillRect(-16.6, -30, 3.4, 1.4); // Auspuff
  const an = Math.sin(T * 9) > 0; c.fillStyle = an ? "#ff8c00" : "#b35c00"; c.beginPath(); c.arc(-.5, -33.4, 1.7, 0, 7); c.fill();
  if (an) { c.fillStyle = "rgba(255,160,0,.35)"; c.beginPath(); c.arc(-.5, -33.4, 4.5, 0, 7); c.fill(); }
  c.fillStyle = "#1d1d1d"; c.font = "bold 3.6px sans-serif"; c.textAlign = "center"; c.fillText("KC", -13, -13.2);
  c.restore();
}
function jzbBsLasterMalen(c, x, O, fuell, T, faehrt) { // Kipplaster, Führerhaus links, Ladefläche rechts
  const s = jzbBsS(); c.save(); c.translate(x, O.boden); c.scale(s, s);
  for (const wx of [-22, 6, 17]) { c.fillStyle = "#1d1d1d"; c.beginPath(); c.arc(wx, -5.5, 5.5, 0, 7); c.fill(); c.fillStyle = "#b0b0b0"; c.beginPath(); c.arc(wx, -5.5, 2.2, 0, 7); c.fill(); }
  const r = faehrt ? Math.sin(T * 20) * .3 : 0; c.translate(0, r);
  c.fillStyle = "#3a3a3a"; c.fillRect(-32, -10, 59, 3.4);
  c.fillStyle = "#d62828"; c.strokeStyle = "#7a1010"; c.lineWidth = .8; c.beginPath(); c.moveTo(-33, -10); c.lineTo(-33, -21); c.lineTo(-27, -27); c.lineTo(-14, -27); c.lineTo(-14, -10); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = "rgba(170,215,240,.9)"; c.beginPath(); c.moveTo(-30, -20); c.lineTo(-26, -24.5); c.lineTo(-17, -24.5); c.lineTo(-17, -20); c.closePath(); c.fill();
  c.fillStyle = "#ffd166"; c.fillRect(-33.5, -14, 2, 2.4); // Scheinwerfer
  c.fillStyle = "#8d99ae"; c.strokeStyle = "#4a5568"; c.beginPath(); c.moveTo(-12, -10); c.lineTo(-13, -25); c.lineTo(27, -25); c.lineTo(26, -10); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "rgba(60,70,90,.6)"; for (const sx of [-3, 7, 17]) { c.beginPath(); c.moveTo(sx, -24); c.lineTo(sx, -11); c.stroke(); }
  if (fuell > 0) { const hh = 4 + fuell * 9; c.fillStyle = "#6b4423"; c.beginPath(); c.moveTo(-12.5, -25); c.quadraticCurveTo(7, -25 - hh * 1.4, 26.5, -25); c.closePath(); c.fill();
    c.fillStyle = "#8a5a2e"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-8 + i * 6, -25 - hh * .5 - (i % 2) * 1.5, 1.2, 0, 7); c.fill(); } }
  c.restore();
}
function jzbBsHaufenMalen(c, O, gr, k) {
  if (gr <= 0) return; const b = 34 * k * gr + 8 * k, h = 30 * k * gr + 4 * k, x = O.haufen;
  const g = c.createLinearGradient(0, O.boden - h, 0, O.boden); g.addColorStop(0, "#8a5a2e"); g.addColorStop(1, "#5c3a1a");
  c.fillStyle = g; c.beginPath(); c.moveTo(x - b, O.boden); c.bezierCurveTo(x - b * .55, O.boden - h * .9, x - b * .2, O.boden - h * 1.05, x + b * .1, O.boden - h);
  c.bezierCurveTo(x + b * .5, O.boden - h * .95, x + b * .75, O.boden - h * .5, x + b, O.boden); c.closePath(); c.fill();
  c.fillStyle = "rgba(40,25,10,.45)"; for (let i = 0; i < 9; i++) { const px = x - b * .7 + (i * 37 % 100) / 100 * b * 1.4, py = O.boden - (i * 53 % 100) / 100 * h * .7 - 2 * k; c.beginPath(); c.arc(px, py, (1 + i % 3 * .5) * k, 0, 7); c.fill(); }
}
function jzbBsArbeiterMalen(c, x, y, sc, dir, ph, o = {}) { // o: helm, karre, brett, winkt, kiste, kniet, drueckt
  c.save(); c.translate(x, y); c.scale(dir * sc, sc);
  const sw = o.kniet ? 0 : Math.sin(ph) * 3.2;
  c.strokeStyle = "#2b3a55"; c.lineWidth = 2.6; c.lineCap = "round";
  if (o.kniet) { c.beginPath(); c.moveTo(0, -9); c.lineTo(4, -3); c.lineTo(4, 0); c.moveTo(0, -9); c.lineTo(-4, -1); c.lineTo(-8, -1); c.stroke(); }
  else { c.beginPath(); c.moveTo(0, -11); c.lineTo(sw, 0); c.moveTo(0, -11); c.lineTo(-sw, 0); c.stroke(); }
  c.fillStyle = "#3d2b1f"; c.fillRect((o.kniet ? 3 : sw) - 1.5, -1.6, 3.6, 1.8); if (!o.kniet) c.fillRect(-sw - 1.5, -1.6, 3.6, 1.8); // Stiefel
  const ky = o.kniet ? 6 : 0; c.translate(0, ky);
  c.fillStyle = "#ff7b00"; c.beginPath(); c.roundRect ? c.roundRect(-3.6, -21, 7.2, 11, 1.6) : c.rect(-3.6, -21, 7.2, 11); c.fill(); // Warnweste
  c.fillStyle = "#e8e8e8"; c.fillRect(-3.6, -17, 7.2, 1.2); c.fillRect(-3.6, -13.5, 7.2, 1.2); // Reflexstreifen
  c.fillStyle = "#f1c8a0"; c.beginPath(); c.arc(0, -24.5, 3.2, 0, 7); c.fill();
  c.fillStyle = o.helm || "#ffd000"; c.beginPath(); c.arc(0, -25.4, 3.6, Math.PI, 0); c.fill(); c.fillRect(-4.6, -25.6, 9.2, 1.1); // Helm
  c.strokeStyle = "#f1c8a0"; c.lineWidth = 1.8;
  if (o.winkt) { const a = Math.sin(ph * 1.5) * .5; c.beginPath(); c.moveTo(2.5, -19); c.lineTo(6 + Math.cos(a) * 2, -28 + Math.sin(a) * 2); c.stroke(); }
  else if (o.drueckt !== undefined) { c.beginPath(); c.moveTo(2.4, -19); c.lineTo(8, -14 + o.drueckt * 4); c.stroke(); }
  else { c.beginPath(); c.moveTo(2.4, -19); c.lineTo(3 + Math.sin(ph) * -2.2, -11); c.stroke(); }
  if (o.brett) { c.fillStyle = "#c08a4a"; c.save(); c.rotate(-.12); c.fillRect(-12, -29, 26, 2.4); c.restore(); }
  if (o.kiste) { c.fillStyle = "#8b5a2b"; c.fillRect(3, -17, 8, 6); c.fillStyle = "#d62828"; c.font = "bold 3px sans-serif"; c.fillText("TNT", 4.2, -13); }
  c.restore();
  if (o.karre) { c.save(); c.translate(x + dir * 12 * sc, y); c.scale(dir * sc, sc); c.fillStyle = "#2a9d8f"; c.beginPath(); c.moveTo(-6, -9); c.lineTo(9, -10); c.lineTo(6, -4); c.lineTo(-4, -4); c.closePath(); c.fill();
    c.fillStyle = "#6b4423"; c.beginPath(); c.ellipse(1.5, -10, 6.5, 2.4, 0, 0, 7); c.fill(); c.fillStyle = "#1d1d1d"; c.beginPath(); c.arc(7, -3, 3, 0, 7); c.fill();
    c.strokeStyle = "#555"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-11, -12); c.stroke(); c.restore(); }
}
function jzbBsDynamitMalen(c, x, y, k, glimmt, T) {
  c.save(); c.translate(x, y); c.scale(k, k);
  for (const dx of [-3, 0, 3]) { c.fillStyle = "#c1121f"; c.fillRect(dx - 1.4, -10, 2.8, 10); c.fillStyle = "#7a0c14"; c.fillRect(dx - 1.4, -10, 2.8, 1); }
  c.fillStyle = "#3a3a3a"; c.fillRect(-4.6, -6.5, 9.2, 1.4);
  c.strokeStyle = "#5c4a32"; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -10); c.quadraticCurveTo(2, -14, 1, -16); c.stroke();
  if (glimmt) { const f = 1 + Math.sin(T * 40) * .4; c.fillStyle = "#ffdd55"; c.beginPath(); c.arc(1, -16, 1.6 * f, 0, 7); c.fill(); c.fillStyle = "rgba(255,120,0,.6)"; c.beginPath(); c.arc(1, -16, 3 * f, 0, 7); c.fill(); }
  c.restore();
}
function jzbBsZuenderMalen(c, x, y, k, drueckt) { // Zündkasten mit T-Griff
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = "#8b5a2b"; c.strokeStyle = "#4a2f12"; c.lineWidth = .8; c.fillRect(-6, -9, 12, 9); c.strokeRect(-6, -9, 12, 9);
  c.fillStyle = "#ffd000"; c.font = "bold 3px sans-serif"; c.textAlign = "center"; c.fillText("⚡", 0, -3);
  const sy = -9 - (1 - drueckt) * 7; c.fillStyle = "#555"; c.fillRect(-.8, sy, 1.6, -9 - sy + .2); c.fillStyle = "#222"; c.fillRect(-5, sy - 1.6, 10, 1.8);
  c.restore();
}
function jzbBaustelleMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, W = F.bs, t = F.t; if (!W) return;
  const O = jzbBsOrt();
  // Boden: Schotter und Erde
  const g = c.createLinearGradient(0, O.horizont, 0, J.h); g.addColorStop(0, "rgba(150,125,95,.9)"); g.addColorStop(1, "rgba(110,88,62,.97)");
  c.fillStyle = g; c.fillRect(0, O.horizont, J.w, J.h - O.horizont + 2);
  c.fillStyle = "rgba(70,55,40,.4)"; for (let i = 0; i < 40; i++) { const px = (i * 61 % 100) / 100 * J.w, py = O.horizont + 3 * k + (i * 37 % 100) / 100 * (J.h - O.horizont - 4 * k); c.fillRect(px, py, 1.6 * k, 1.1 * k); }
  // Bauzaun hinten
  c.strokeStyle = "rgba(200,205,210,.55)"; c.lineWidth = .7 * k;
  for (let x = JZB_RAND; x < J.w - JZB_RAND; x += 30 * k) { c.strokeRect(x, O.horizont - 16 * k, 30 * k, 16 * k); for (let m = 4 * k; m < 30 * k; m += 4 * k) { c.beginPath(); c.moveTo(x + m, O.horizont - 16 * k); c.lineTo(x + m, O.horizont); c.stroke(); } }
  c.fillStyle = "rgba(90,95,100,.8)"; for (let x = JZB_RAND; x <= J.w - JZB_RAND; x += 30 * k) c.fillRect(x - 1 * k, O.horizont - 17 * k, 2 * k, 18 * k);
  // Absperrbaken links und rechts (rot-weiß, Blinklicht)
  for (const bx of [JZB_RAND + 2 * k, J.w - JZB_RAND - 4 * k]) { c.fillStyle = "#333"; c.fillRect(bx - 4 * k, O.boden - 1.5 * k, 10 * k, 1.5 * k);
    for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? "#fff" : "#d62828"; c.fillRect(bx, O.boden - (i + 1) * 5 * k, 2.4 * k, 5 * k); }
    c.fillStyle = Math.sin(T * 6 + bx) > 0 ? "#ffcc00" : "#7a6200"; c.beginPath(); c.arc(bx + 1.2 * k, O.boden - 22 * k, 1.8 * k, 0, 7); c.fill(); }
  // Rauchschrift: der Name aus den Abgasen
  const n = jzbBsName().length, takt = jzbBsTakt(), Lg = jzbBsNameLage(O, k), weht = Math.max(0, t - (JZB_BS_SPRENG - 4)), aus = Math.max(0, 1 - weht / 3);
  if (t >= JZB_BS_NAME_AB && aus > 0) { c.save(); c.font = Lg.f; c.textAlign = "center"; c.textBaseline = "alphabetic";
    Lg.z.forEach((ch, i) => { const s = JZB_BS_NAME_AB + i * takt, d = t - s; if (d < 0) return;
      const A = jzbBsAuspuff(jzbBsLader(s, O), O), zx = Lg.pos[i], zy = Lg.y - Lg.fs * .35;
      if (d < JZB_BS_WOLKE + .1) { const p = jzbEase(Math.min(1, d / JZB_BS_WOLKE)), x = A.x + (zx - A.x) * p, y = A.y + (zy - A.y) * p - Math.sin(p * Math.PI) * 10 * k, r = 2 * k + p * Lg.fs * .15, a = (.55 - p * .2) * (d > JZB_BS_WOLKE - .3 ? (JZB_BS_WOLKE + .1 - d) / .4 : 1);
        for (const [ox, oy, rr] of [[0, 0, 1], [-.7, .3, .75], [.7, .35, .7], [0, -.6, .65]]) { c.fillStyle = `rgba(80,80,80,${a})`; c.beginPath(); c.arc(x + ox * r, y + oy * r, rr * r, 0, 7); c.fill(); } }
      const sicht = Math.min(1, Math.max(0, (d - (JZB_BS_WOLKE - .3)) / 1)) * aus; if (sicht <= 0) return;
      c.shadowColor = "rgba(255,255,255,.55)"; c.shadowBlur = 4 * k; c.fillStyle = `rgba(55,55,55,${.85 * sicht})`;
      c.fillText(ch, zx + Math.sin(T * 1.3 + i * 1.7) * .8 * k + weht * (12 + i * 2) * k, Lg.y + Math.cos(T * 1.1 + i) * .6 * k - weht * (5 + i % 3 * 2) * k); c.shadowBlur = 0; });
    c.restore(); void n; }
  for (const r of W.rauch) { c.fillStyle = `rgba(70,70,70,${r.a})`; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.fill(); }
  // Erdhaufen, Laster, Radlader
  jzbBsHaufenMalen(c, O, jzbBsHaufen(t), k);
  const ab = Math.max(0, t - JZB_BS_ABFAHRT), lx = O.laster - ab * ab * 6 * k - ab * 10 * k;
  if (lx > -80 * k) jzbBsLasterMalen(c, lx, O, jzbBsFuellung(t), T, ab > 0);
  c.fillStyle = "#6b4423"; for (const b of W.krumen) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); }
  const L = jzbBsLader(t, O); if (!L.weg) jzbBsLaderMalen(c, L, O, T);
  // 👷 Arbeiter mit gelben Helmen
  JZB_BS_ARBEITER.forEach((s, i) => { const d = t - s; if (d < 0) return; const dir = i % 2 ? -1 : 1, v = 20 * k, x = dir > 0 ? -16 * k + d * v : J.w + 16 * k - d * v;
    if (x < -30 * k || x > J.w + 30 * k) return;
    jzbBsArbeiterMalen(c, x, O.boden, k * 1.05, dir, d * 8, i === 0 ? { brett: true } : i === 1 ? { karre: true } : { winkt: true }); });
  // 🧨 Sprengkommando: Kabel, Dynamit, Schild, Zünder
  if (t >= JZB_BS_SPRENG) {
    const zx = O.zuender, zy = O.boden - 4 * k, M = jzbBsSprengmeister(t, O), funke = t >= JZB_BS_KNALL - .35 ? Math.min(1, (t - JZB_BS_KNALL + .35) / .35) : -1;
    for (const d of W.dyn) { if (d.tp < 0 || t - d.tp < .55) continue;
      c.strokeStyle = "rgba(25,25,25,.75)"; c.lineWidth = .8 * k; c.beginPath(); c.moveTo(zx, zy); c.quadraticCurveTo((zx + d.x) / 2, Math.max(d.y, O.boden - 1 * k), d.x, d.y - 2 * k); c.stroke();
      if (funke >= 0) { const p = funke, qx = (1 - p) * (1 - p) * zx + 2 * (1 - p) * p * (zx + d.x) / 2 + p * p * d.x, qy = (1 - p) * (1 - p) * zy + 2 * (1 - p) * p * Math.max(d.y, O.boden - 1 * k) + p * p * (d.y - 2 * k);
        c.fillStyle = "#ffe066"; c.beginPath(); c.arc(qx, qy, 1.8 * k, 0, 7); c.fill(); } }
    for (const d of W.dyn) { if (d.tp < 0) continue; const p = Math.min(1, (t - d.tp) / .55);
      const sx = d.x, sy = O.boden - 20 * k, x = sx + (d.x - sx) * p, y = sy + (d.y - sy) * p - Math.sin(p * Math.PI) * 18 * k;
      jzbBsDynamitMalen(c, x, y, k, t > JZB_BS_ZAEHLEN, T); }
    if (t > JZB_BS_SPRENG + 6) { const sx = J.w * .5, sy = Math.max(14 * k, O.horizont - 44 * k), a = Math.min(1, (t - JZB_BS_SPRENG - 6) / .6), w = 0.7 + .3 * a;
      c.save(); c.globalAlpha *= a; c.translate(sx, sy); c.scale(w, w); c.fillStyle = "#ffd000"; c.strokeStyle = "#1d1d1d"; c.lineWidth = 1.6 * k;
      c.beginPath(); c.moveTo(0, -13 * k); c.lineTo(13 * k, 10 * k); c.lineTo(-13 * k, 10 * k); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#1d1d1d"; c.font = `900 ${12 * k}px sans-serif`; c.textAlign = "center"; c.fillText("!", 0, 7 * k);
      c.font = `800 ${7.5 * k}px "Trebuchet MS",sans-serif`; c.lineWidth = 2.5 * k; c.strokeStyle = "rgba(0,0,0,.6)"; c.strokeText("ACHTUNG SPRENGUNG", 0, 19 * k); c.fillStyle = "#ffd000"; c.fillText("ACHTUNG SPRENGUNG", 0, 19 * k); c.restore(); }
    jzbBsZuenderMalen(c, zx, O.boden, k * 1.1, M?.drueckt || 0);
    if (M) jzbBsArbeiterMalen(c, M.x, O.boden, k * 1.05, M.dir, M.ph, { helm: "#d62828", kniet: M.kniet, ...(M.kniet ? { drueckt: M.drueckt } : {}) });
    if (t >= JZB_BS_SPRENG && t < JZB_BS_ZURUECK + 3) { const d = t - JZB_BS_SPRENG - 1.2; if (d > 0) jzbBsArbeiterMalen(c, -14 * k + d * 26 * k, O.boden, k * 1.05, 1, d * 9, { helm: "#d62828", kiste: true }); }
    // 3 – 2 – 1
    const zt = t - JZB_BS_ZAEHLEN; if (zt >= 0 && zt < 3.3) { const n = 3 - Math.floor(zt / 1.1), q = (zt % 1.1) / 1.1;
      c.save(); c.globalAlpha *= 1 - q * .6; c.font = `900 ${Math.round((26 + q * 10) * k)}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = 4 * k; c.strokeStyle = "rgba(0,0,0,.65)"; c.strokeText(String(n), J.w * .5, O.horizont - 18 * k); c.fillStyle = "#fff"; c.fillText(String(n), J.w * .5, O.horizont - 18 * k); c.restore(); }
  }
  if (W.blitz > 0) { c.fillStyle = `rgba(255,250,225,${W.blitz})`; c.fillRect(0, 0, J.w, J.h); }
}
// 💥 Der ganze Kopf zerfällt in Stücke (Bruchstücke mit seinem Hintergrund) und fliegt davon – nach JZB_BS_PAUSE ist er wieder da
function jzbBsSprengen() {
  const h = document.querySelector("#v-start .hero"); if (!h || h.dataset.gesprengt) return;
  const r = h.getBoundingClientRect(); if (r.width < 40 || r.bottom < 0 || r.top > innerHeight) return;
  const cs = getComputedStyle(h), box = document.createElement("div"); h.dataset.gesprengt = "1";
  box.className = "bs-truemmer"; box.setAttribute("aria-hidden", "true");
  box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:9000`;
  const sp = 6, ze = 3, bw = r.width / sp, bh = r.height / ze, z = (a, b) => a + Math.random() * (b - a);
  for (let j = 0; j < ze; j++) for (let i = 0; i < sp; i++) {
    const x = i * bw, y = j * bh, d = document.createElement("div");
    const pkt = [[z(0, 12), z(0, 12)], [z(88, 100), z(0, 14)], [z(86, 100), z(86, 100)], [z(0, 14), z(88, 100)]].map(([a, b]) => `${a}% ${b}%`).join(",");
    d.style.cssText = `position:absolute;left:${x - 2}px;top:${y - 2}px;width:${bw + 4}px;height:${bh + 4}px;background-color:${cs.backgroundColor};background-image:${cs.backgroundImage};`
      + `background-size:${r.width}px ${r.height}px;background-position:${-x + 2}px ${-y + 2}px;clip-path:polygon(${pkt});box-shadow:inset 0 0 6px rgba(0,0,0,.5)`;
    const gl = document.createElement("div"); gl.style.cssText = "position:absolute;inset:0;background:#fff7d6"; d.appendChild(gl); box.appendChild(d);
    gl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: "forwards" });
    const cx = x + bw / 2 - r.width / 2, cy = y + bh / 2 - r.height, l = Math.hypot(cx, cy) || 1, kraft = z(160, 320);
    const vx = cx / l * kraft + z(-40, 40), vy = cy / l * kraft - z(60, 160), rot = z(-260, 260);
    d.animate([{ transform: "none" }, { transform: `translate(${vx}px,${vy}px) rotate(${rot}deg)`, offset: .45 }, { transform: `translate(${vx * 1.5}px,${vy * .9 + 520}px) rotate(${rot * 1.9}deg)`, opacity: 0 }],
      { duration: z(1700, 2400), easing: "cubic-bezier(.12,.75,.45,1)", fill: "forwards" });
  }
  for (let i = 0; i < 9; i++) { // Feuerball und Rauch
    const f = document.createElement("div"), gr = z(40, 90);
    f.style.cssText = `position:absolute;left:${r.width / 2 + z(-r.width * .35, r.width * .35) - gr / 2}px;top:${r.height * z(.4, .9) - gr / 2}px;width:${gr}px;height:${gr}px;border-radius:50%;background:radial-gradient(circle,#fff6c2 0%,#ffb703 30%,#e85d04 55%,rgba(60,60,60,.85) 80%,rgba(60,60,60,0) 100%)`;
    box.appendChild(f); f.animate([{ transform: "scale(.2)", opacity: 1 }, { transform: `scale(${z(1.6, 2.6)}) translateY(-${z(10, 40)}px)`, opacity: .9, offset: .35 }, { transform: `scale(${z(2.8, 3.6)}) translateY(-${z(40, 90)}px)`, opacity: 0, filter: "grayscale(1)" }], { duration: z(1500, 2300), easing: "ease-out", fill: "forwards" });
  }
  document.body.appendChild(box);
  jzbBsGlasBruch(); // 2.622.0: danach sieht der ganze Bildschirm aus wie gesprungenes Handyglas
  h.style.visibility = "hidden";
  try { document.querySelector("#v-start")?.animate([0, 1, 2, 3, 4, 5, 6].map((i) => ({ transform: i === 6 ? "none" : `translate(${z(-7, 7)}px,${z(-5, 5)}px)` })), { duration: 600 }); } catch {}
  setTimeout(() => box.remove(), 2700);
  setTimeout(() => { h.style.visibility = ""; delete h.dataset.gesprengt; try { h.animate([{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 900, easing: "ease-out" }); } catch {} }, JZB_BS_PAUSE * 1000);
}
// 2.622.0 KC-CLUB-BAUSTELLE-GLASBRUCH (Wunsch Hansi „nach der Sprengung, als wenn der ganze Handy-Bildschirm kaputt ist – das ganze Glas gesprungen,
// Spider-App, wie wenn ein Handy runtergefallen ist“): über den ganzen Bildschirm legt sich ein Spinnennetz aus Sprüngen – vom Aufschlagpunkt
// Risse nach außen, Ringe dazwischen, kleine Splitter in der Mitte. Die Sprünge wachsen in einer Viertelsekunde, bleiben gut 4 s und verblassen dann.
// Nur Bild: Tippen geht hindurch (pointer-events: none), nichts wird gespeichert.
function jzbBsGlasBruch() {
  if (document.querySelector(".bs-glas")) return;
  const W = innerWidth, H = innerHeight, z = (a, b) => a + Math.random() * (b - a), ix = W * z(.35, .65), iy = H * z(.22, .45), n = Math.round(z(15, 19)), weit = Math.hypot(W, H);
  const strahl = [];
  for (let i = 0; i < n; i++) { // Risse vom Aufschlag nach außen, leicht zackig
    let a = (i / n) * Math.PI * 2 + z(-.12, .12), r = 0, x = ix, y = iy; const pk = [[x, y]];
    while (r < weit) { r += z(18, 46); a += z(-.09, .09); x = ix + Math.cos(a) * r; y = iy + Math.sin(a) * r; pk.push([x, y]); }
    strahl.push(pk);
  }
  const punktBei = (pk, rr) => { for (const p of pk) if (Math.hypot(p[0] - ix, p[1] - iy) >= rr) return p; return pk[pk.length - 1]; };
  const wege = [];
  for (const pk of strahl) wege.push({ d: "M" + pk.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), w: z(1, 1.8) });
  for (const rr of [22, 48, 85, 140, 215, 320, 470]) for (let i = 0; i < n; i++) { // Ringe zwischen den Rissen (nicht jeder Abschnitt)
    if (rr > 100 && Math.random() < .35) continue;
    const p = punktBei(strahl[i], rr * z(.85, 1.15)), q = punktBei(strahl[(i + 1) % n], rr * z(.85, 1.15)), mx = (p[0] + q[0]) / 2 + z(-6, 6), my = (p[1] + q[1]) / 2 + z(-6, 6);
    wege.push({ d: `M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`, w: z(.6, 1.2) });
  }
  for (let i = 0; i < 26; i++) { const a = z(0, 7), r1 = z(2, 10), r2 = r1 + z(6, 20); wege.push({ d: `M${(ix + Math.cos(a) * r1).toFixed(1)} ${(iy + Math.sin(a) * r1).toFixed(1)} L${(ix + Math.cos(a + z(-.4, .4)) * r2).toFixed(1)} ${(iy + Math.sin(a + z(-.4, .4)) * r2).toFixed(1)}`, w: z(.5, 1) }); }
  const splitter = Array.from({ length: 7 }, () => { const a = z(0, 7), r = z(6, 34), g = z(5, 14); const x = ix + Math.cos(a) * r, y = iy + Math.sin(a) * r;
    return `<polygon points="${x},${y} ${x + g},${y + z(-3, 4)} ${x + z(0, g)},${y + g}" fill="rgba(255,255,255,${z(.12, .3).toFixed(2)})"/>`; }).join("");
  const box = document.createElement("div"); box.className = "bs-glas"; box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9500";
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block">
    <radialGradient id="bsGlasLicht" cx="${(ix / W * 100).toFixed(1)}%" cy="${(iy / H * 100).toFixed(1)}%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <rect width="${W}" height="${H}" fill="url(#bsGlasLicht)"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      ${wege.map((w) => `<path d="${w.d}" pathLength="1" stroke="rgba(0,0,0,.35)" stroke-width="${(w.w + 1.2).toFixed(2)}" transform="translate(.8 .8)"/>`).join("")}
      ${wege.map((w) => `<path class="bs-riss" d="${w.d}" pathLength="1" stroke="rgba(255,255,255,.9)" stroke-width="${w.w.toFixed(2)}"/>`).join("")}
    </g>${splitter}<circle cx="${ix}" cy="${iy}" r="5" fill="rgba(255,255,255,.55)"/></svg>`;
  document.body.appendChild(box);
  try { box.querySelectorAll("path").forEach((p, i) => { p.style.strokeDasharray = "1"; p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 160 + (i % 9) * 22, easing: "ease-out", fill: "both" }); }); } catch {}
  setTimeout(() => { try { box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: "forwards" }).onfinish = () => box.remove(); } catch { box.remove(); } }, 4600);
  setTimeout(() => box.remove(), 6500);
}
// 🔊 Ton (nur ⚙️ Ton an, nicht in der Ruhezeit): Piepen beim Zählen, Rumms + klirrendes Glas beim Knall
function jzbBsTon(art, n = 0) {
  if (!einst("ton", true) || document.hidden) return;
  try { if (inRuheJetzt(INIT?.einstellungen?.ruhezeit)) return; } catch {}
  let A; try { A = audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch { return; }
  const t0 = A.currentTime + .02, sr = A.sampleRate, aus = A.destination;
  const rausch = (sek) => { const b = A.createBuffer(1, Math.max(1, Math.floor(sr * sek)), sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const huelle = (g, t, spitze, dauer) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(spitze, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dauer); };
  if (art === "piep") { const o = A.createOscillator(), g = A.createGain(); o.type = "square"; o.frequency.value = n === 2 ? 1320 : 880; huelle(g, t0, .08, .18); o.connect(g); g.connect(aus); o.start(t0); o.stop(t0 + .2); return; }
  // Rumms: tiefes Rauschen, das langsam ausklingt, und ein dumpfer Schlag
  const q = A.createBufferSource(), lp = A.createBiquadFilter(), g = A.createGain(); q.buffer = rausch(2.4); lp.type = "lowpass";
  lp.frequency.setValueAtTime(2200, t0); lp.frequency.exponentialRampToValueAtTime(90, t0 + 2); huelle(g, t0, .95, 2.3); q.connect(lp); lp.connect(g); g.connect(aus); q.start(t0); q.stop(t0 + 2.4);
  const o = A.createOscillator(), og = A.createGain(); o.type = "sine"; o.frequency.setValueAtTime(75, t0); o.frequency.exponentialRampToValueAtTime(26, t0 + .9); huelle(og, t0, .9, 1.1); o.connect(og); og.connect(aus); o.start(t0); o.stop(t0 + 1.2);
  // Glas klirrt: viele kurze, helle Splitter, verteilt über gut eine Sekunde
  for (let i = 0; i < 18; i++) {
    const ts = t0 + .18 + Math.random() * 1.2, f = 2400 + Math.random() * 4400;
    const s = A.createOscillator(), sg = A.createGain(); s.type = "triangle"; s.frequency.setValueAtTime(f, ts); s.frequency.exponentialRampToValueAtTime(f * .97, ts + .2);
    huelle(sg, ts, .07 + Math.random() * .08, .1 + Math.random() * .28); s.connect(sg); sg.connect(aus); s.start(ts); s.stop(ts + .45);
    const kq = A.createBufferSource(), bp = A.createBiquadFilter(), kg = A.createGain(); kq.buffer = rausch(.09); bp.type = "bandpass"; bp.frequency.value = Math.min(9000, f * 1.4); bp.Q.value = 6;
    huelle(kg, ts, .22, .08); kq.connect(bp); bp.connect(kg); kg.connect(aus); kq.start(ts);
  }
}
const JZB_WW_DAUER = 96, JZB_WW_REITER = [8, 56], JZB_WW_KUTSCHE = [13, 64], JZB_WW_DUELL = 29, JZB_WW_HERDE = 77, JZB_WW_STAUB = 84, JZB_WW_HERDE_N = 36; // Sekunden · Tiere (2.532.0: + Duell, Zeiten so, dass sich nichts überschneidet)
const JZB_WW_COWBOYS = [{ hemd: "#c1121f", hut: "#5c3a1a", pferd: "#8b4513" }, { hemd: "#1d3557", hut: "#2b2b2b", pferd: "#6b4226", lasso: true }];
function jzbWwOrt() { const J = JZB, k = J.k, boden = J.h - 5 * k; return { boden, horizont: boden - 22 * k, zelt: JZB_RAND + 22 * k, feuer: JZB_RAND + 56 * k }; }
function jzbWwNeu() {
  const J = JZB, ausStaub = !!J.wwStaub; J.wwStaub = false;
  return { ausStaub, horizont: [], hUhr: 0, reiter: null, kutsche: null, herde: [], staub: [], funken: [], rauch: [], fUhr: 0, rUhr: 0,
    zeltFall: 0, feuerAus: 0, beben: 0, schleier: ausStaub ? 1 : 0, gestartet: {}, ballen: [], windUhr: jzbZ(5, 9), wind: null }; // 2.532.0: Steppenläufer + Windstoß
}
function jzbWwSchritt(F, dt) {
  const J = JZB, k = J.k, t = F.t, O = jzbWwOrt(), W = F.ww || (F.ww = jzbWwNeu());
  if (t >= JZB_WW_DAUER) { J.fest = null; J.wwStaub = true; return jzbLaufEnde(); } // nächster Lauf beginnt in der Staubwolke
  F.a = W.ausStaub ? 1 : Math.min(1, t / 2.5);
  // Staubschleier: am Anfang lichtet er sich (nach der Herde), am Ende deckt er alles zu
  W.schleier = Math.max(W.ausStaub ? Math.max(0, 1 - t / 4) : 0, Math.max(0, Math.min(1, (t - JZB_WW_STAUB) / 6)));
  // 🐃 kleine Büffel am Horizont (bis die Herde kommt)
  if (t < JZB_WW_HERDE && (W.hUhr -= dt) <= 0) { W.hUhr = jzbZ(2.5, 6); W.horizont.push({ x: -12 * k, v: jzbZ(5, 9) * k, ph: jzbZ(0, 6), sc: jzbZ(.38, .5) }); }
  for (const b of W.horizont) { b.x += b.v * dt * (t > JZB_WW_HERDE - 3 ? 4 : 1); b.ph += dt * (t > JZB_WW_HERDE - 3 ? 9 : 3); }
  W.horizont = W.horizont.filter((b) => b.x < J.w + 14 * k);
  // 🤠 zwei Cowboys von rechts nach links · 🚌 Postkutsche von links nach rechts
  for (const s of JZB_WW_REITER) if (t >= s && !W.gestartet["r" + s]) { W.gestartet["r" + s] = 1; W.reiter = { x: J.w + 24 * k, v: 52 * k, ph: 0 }; }
  for (const s of JZB_WW_KUTSCHE) if (t >= s && !W.gestartet["k" + s]) { W.gestartet["k" + s] = 1; W.kutsche = { x: -100 * k, v: 44 * k, ph: 0 }; }
  if (W.reiter) { W.reiter.x -= W.reiter.v * dt; W.reiter.ph += dt * 11; if (W.reiter.x < -90 * k) W.reiter = null; }
  if (W.kutsche) { W.kutsche.x += W.kutsche.v * dt; W.kutsche.ph += dt * 9; if (W.kutsche.x > J.w + 110 * k) W.kutsche = null; }
  // 🌬️ 2.532.0: ab und zu ein Windstoß, der einen Steppenläufer-Ballen durchs Bild rollt (nicht mehr, wenn die Herde kommt)
  if (t < JZB_WW_HERDE - 4 && (W.windUhr -= dt) <= 0) { W.windUhr = jzbZ(14, 24); const dir = Math.random() < .5 ? 1 : -1;
    W.ballen.push({ x: dir > 0 ? -16 * k : J.w + 16 * k, dir, v: jzbZ(85, 120) * k, dreh: 0, ph: 0, sc: jzbZ(.9, 1.25) }); W.wind = { dir, t: 0 }; }
  for (const b of W.ballen) { b.x += b.dir * b.v * dt; b.dreh += b.dir * dt * 7; b.ph += dt * 5; }
  W.ballen = W.ballen.filter((b) => b.x > -30 * k && b.x < J.w + 30 * k);
  if (W.wind && (W.wind.t += dt) > 2.4) W.wind = null;
  // 🔥 Lagerfeuer: Funken und Rauch, solange es brennt
  if (W.feuerAus < 1) {
    if ((W.fUhr -= dt) <= 0) { W.fUhr = jzbZ(.08, .25); W.funken.push({ x: O.feuer + jzbZ(-3, 3) * k, y: O.boden - 7 * k, vx: jzbZ(-6, 6) * k, vy: -jzbZ(16, 32) * k, a: 1 }); }
    if ((W.rUhr -= dt) <= 0) { W.rUhr = jzbZ(.5, .9); W.rauch.push({ x: O.feuer, y: O.boden - 16 * k, r: 2.2 * k, a: .16 }); }
  }
  for (const f of W.funken) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 6 * k * dt; f.a -= dt * .9; }
  W.funken = W.funken.filter((f) => f.a > 0);
  for (const r of W.rauch) { r.y -= 9 * k * dt; r.x += 4 * k * dt; r.r += 2.6 * k * dt; r.a -= dt * .045; }
  W.rauch = W.rauch.filter((r) => r.a > 0);
  // 🐃🐃🐃 die große Herde: erst bebt der Boden, dann donnert sie von rechts heran
  W.beben = t > JZB_WW_HERDE - 3 && t < JZB_WW_STAUB + 5 ? Math.min(1, (t - JZB_WW_HERDE + 3) / 3) * Math.min(1, (JZB_WW_STAUB + 5 - t) / 2) : 0;
  if (t >= JZB_WW_HERDE && !W.gestartet.herde) { W.gestartet.herde = 1;
    for (let i = 0; i < JZB_WW_HERDE_N; i++) W.herde.push({ x: J.w + jzbZ(8, 560) * k, tiefe: jzbZ(0, 1), v: jzbZ(125, 170) * k, ph: jzbZ(0, 6), sc: jzbZ(1.05, 1.5), staubUhr: jzbZ(0, .2) });
    W.herde.sort((a, b) => b.tiefe - a.tiefe); } // hinten zuerst malen
  for (const b of W.herde) {
    b.x -= b.v * dt; b.ph += dt * 15;
    if ((b.staubUhr -= dt) <= 0 && b.x < J.w + 10 * k && b.x > -40 * k) { b.staubUhr = jzbZ(.08, .16);
      W.staub.push({ x: b.x + jzbZ(4, 14) * k, y: O.boden - b.tiefe * 10 * k - jzbZ(0, 4) * k, r: jzbZ(3, 6) * k, vx: jzbZ(-10, 20) * k, a: jzbZ(.35, .55) }); }
    if (b.x < O.zelt + 22 * k) W.zeltFall = Math.min(1, W.zeltFall + dt * 1.6); // Zelt wird niedergetrampelt
    if (b.x < O.feuer + 12 * k) W.feuerAus = Math.min(1, W.feuerAus + dt * 3); // Feuer aus
  }
  W.herde = W.herde.filter((b) => b.x > -60 * k);
  for (const s of W.staub) { s.x += s.vx * dt; s.y -= 5 * k * dt; s.r += 10 * k * dt; s.a -= dt * .085; }
  W.staub = W.staub.filter((s) => s.a > 0).slice(-240);
}
function jzbWwBueffelMalen(c, x, y, sc, dir, ph, laeuft) { // Büffel von der Seite, Kopf in Laufrichtung (dir 1 = rechts, -1 = links)
  c.save(); c.translate(x, y); c.scale(sc * dir, sc); c.lineCap = "round";
  const b = laeuft ? Math.sin(ph) : 0;
  c.strokeStyle = "#3b2414"; c.lineWidth = 2; c.beginPath(); // Beine
  c.moveTo(-6, -5); c.lineTo(-6 + b * 2.2, 0); c.moveTo(-3, -5); c.lineTo(-3 - b * 2.2, 0); c.moveTo(5, -5); c.lineTo(5 - b * 2.2, 0); c.moveTo(8, -5); c.lineTo(8 + b * 2.2, 0); c.stroke();
  c.fillStyle = "#5a3a22"; c.beginPath(); c.ellipse(-1, -8.5, 9, 4.8, 0, 0, 7); c.fill(); // Körper
  c.fillStyle = "#3d2616"; c.beginPath(); c.ellipse(5, -10.5, 6.2, 5.6, -.35, 0, 7); c.fill(); // zotteliger Buckel
  c.beginPath(); c.ellipse(11, -7.2, 3.2, 3.7, .35, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#2b1a0e"; c.beginPath(); c.moveTo(9.6, -4.6); c.lineTo(11.4, -1.4); c.lineTo(12.8, -4.4); c.closePath(); c.fill(); // Bart
  c.strokeStyle = "#ece4d0"; c.lineWidth = 1; c.beginPath(); c.moveTo(11.4, -10.2); c.quadraticCurveTo(13.4, -11.6, 12.8, -13.4); c.stroke(); // Horn
  c.fillStyle = "#111"; c.beginPath(); c.arc(12.2, -8, .55, 0, 7); c.fill(); // Auge
  c.strokeStyle = "#3b2414"; c.lineWidth = 1; c.beginPath(); c.moveTo(-9.6, -9.5); c.quadraticCurveTo(-11.6, -7.5 + b, -12, -5.2); c.stroke(); // Schwanz
  c.restore();
}
function jzbWwPferdMalen(c, ph, farbe) { // Pferd im Galopp (Blick nach +x), Füße bei y = 0 – im schon verschobenen Bild
  const g = Math.sin(ph), g2 = Math.cos(ph);
  c.strokeStyle = farbe; c.lineWidth = 1.8; c.lineCap = "round"; c.beginPath(); // Beine
  c.moveTo(-6, -8); c.lineTo(-7 + g * 3, 0); c.moveTo(-4, -8); c.lineTo(-3 - g * 3, 0); c.moveTo(6, -8); c.lineTo(5 + g2 * 3, 0); c.moveTo(8, -8); c.lineTo(9 - g2 * 3, 0); c.stroke();
  c.fillStyle = farbe; c.beginPath(); c.ellipse(1, -11 + g * .5, 9, 4.2, 0, 0, 7); c.fill(); // Rumpf
  c.beginPath(); c.moveTo(6.5, -13.5); c.lineTo(10.5, -20); c.lineTo(13.4, -19); c.lineTo(10.2, -10.5); c.closePath(); c.fill(); // Hals
  c.beginPath(); c.ellipse(14.4, -18.4, 3.4, 1.8, .5, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#111"; c.beginPath(); c.arc(14, -19.2, .45, 0, 7); c.fill();
  c.strokeStyle = "#2b1a0e"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(7.6, -14.5); c.lineTo(10.8, -20.4); c.stroke(); // Mähne
  c.beginPath(); c.moveTo(-8, -12); c.quadraticCurveTo(-12, -11 + g, -13, -6); c.stroke(); // Schweif
}
function jzbWwReiterMalen(c, x, y, sc, dir, ph, C, T) {
  c.save(); c.translate(x, y + Math.abs(Math.sin(ph)) * -1.2 * sc); c.scale(sc * dir, sc);
  jzbWwPferdMalen(c, ph, C.pferd);
  c.strokeStyle = "#264653"; c.lineWidth = 2; c.beginPath(); c.moveTo(.4, -14); c.lineTo(2.4, -8.6); c.stroke(); // Bein (Jeans)
  c.fillStyle = C.hemd; c.fillRect(-1.8, -22, 4.4, 8); // Hemd
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(.6, -24.6, 2.4, 0, 7); c.fill(); // Gesicht
  c.fillStyle = C.hut; c.beginPath(); c.ellipse(.6, -26.4, 5, 1.1, 0, 0, 7); c.fill(); c.fillRect(-1.6, -29.4, 4.6, 3.2); // Cowboyhut
  c.strokeStyle = C.hemd; c.lineWidth = 1.4; c.beginPath(); c.moveTo(1.4, -20); // Arm
  if (C.lasso) { c.lineTo(2, -28); c.stroke(); c.strokeStyle = "#d4a373"; c.lineWidth = .8; c.beginPath(); c.ellipse(2, -31, 5, 1.6 + Math.abs(Math.sin(T * 6)) * .8, Math.sin(T * 6) * .2, 0, 7); c.stroke(); }
  else { c.lineTo(6, -17); c.stroke(); c.strokeStyle = "#2b1a0e"; c.lineWidth = .5; c.beginPath(); c.moveTo(6, -17); c.lineTo(12.4, -17.6); c.stroke(); } // Zügel
  c.restore();
}
function jzbWwKutscheMalen(c, x, y, sc, ph) { // Postkutsche nach rechts, zwei Pferde vorn, Kutscher auf dem Bock
  c.save(); c.translate(x, y); c.scale(sc, sc);
  for (const [dx, f] of [[40, "#8b4513"], [30, "#a0522d"]]) { c.save(); c.translate(dx, 0); jzbWwPferdMalen(c, ph + dx, f); c.restore(); }
  c.strokeStyle = "#2b1a0e"; c.lineWidth = .6; c.beginPath(); c.moveTo(14, -16); c.lineTo(42, -18); c.stroke(); // Leinen
  const hb = Math.abs(Math.sin(ph * 1.3)) * 1.2; // die Kutsche schaukelt
  c.fillStyle = "#7f1d1d"; c.beginPath(); c.roundRect ? c.roundRect(-16, -27 - hb, 28, 16, 2) : c.rect(-16, -27 - hb, 28, 16); c.fill(); // Kasten
  c.fillStyle = "#ffd166"; c.fillRect(-16, -14 - hb, 28, 1.4); c.fillRect(-16, -27 - hb, 28, 1.2); // Zierleisten
  c.fillStyle = "#3b2412"; c.fillRect(-12, -24 - hb, 7, 6); c.fillRect(1, -24 - hb, 7, 6); // Fenster
  c.fillStyle = "#c9a227"; c.fillRect(-14, -31 - hb, 22, 4); // Gepäck auf dem Dach
  c.fillStyle = "#ffd166"; c.font = "700 3.1px sans-serif"; c.textAlign = "center"; c.fillText("KÖCHECLUB", -2, -15.6 - hb);
  c.fillStyle = "#5c3a1a"; c.fillRect(11, -22 - hb, 7, 2); // Kutschbock
  c.fillStyle = "#e9c46a"; c.fillRect(13, -28 - hb, 3.6, 6); c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(14.8, -30 - hb, 2, 0, 7); c.fill(); // Kutscher
  c.fillStyle = "#2b2b2b"; c.beginPath(); c.ellipse(14.8, -31.6 - hb, 3.6, .9, 0, 0, 7); c.fill(); c.fillRect(13.2, -34 - hb, 3.2, 2.4);
  for (const wx of [-10, 7]) { // Räder mit drehenden Speichen
    c.strokeStyle = "#3b2412"; c.lineWidth = 1.3; c.beginPath(); c.arc(wx, -6, 6, 0, 7); c.stroke(); c.lineWidth = .6;
    for (let s = 0; s < 6; s++) { const a = ph * .9 + s * Math.PI / 3; c.beginPath(); c.moveTo(wx, -6); c.lineTo(wx + Math.cos(a) * 6, -6 + Math.sin(a) * 6); c.stroke(); } }
  c.restore();
}
function jzbWwZeltMalen(c, x, y, k, fall) { // Tipi mit Stangen, Streifen und Eingang – „fall“ 0…1: niedergetrampelt
  const f = jzbEase(fall);
  c.save(); c.translate(x, y); c.rotate(-f * .1); c.scale(k * (1 + f * .45), k * (1 - f * .8));
  c.strokeStyle = "#5c3a1a"; c.lineWidth = 1.3; c.beginPath(); for (const s of [-5, -1.5, 2, 5.5]) { c.moveTo(s * .5, -33); c.lineTo(-s * .9, -40); } c.stroke(); // Stangen oben
  c.fillStyle = "#f1e3c6"; c.beginPath(); c.moveTo(-17, 0); c.lineTo(0, -33); c.lineTo(17, 0); c.closePath(); c.fill(); // Plane
  c.save(); c.clip();
  c.fillStyle = "#9b2226"; c.fillRect(-20, -9, 40, 3); c.fillStyle = "#264653"; c.fillRect(-20, -22, 40, 2.4);
  c.fillStyle = "#e9c46a"; c.beginPath(); for (let i = -18; i < 18; i += 4) { c.moveTo(i, -15); c.lineTo(i + 2, -18); c.lineTo(i + 4, -15); } c.fill(); // Zickzack-Muster
  c.restore();
  c.strokeStyle = "rgba(92,58,26,.45)"; c.lineWidth = .8; c.beginPath(); c.moveTo(-17, 0); c.lineTo(0, -33); c.lineTo(17, 0); c.stroke();
  c.fillStyle = "#3b2412"; c.beginPath(); c.moveTo(-5, 0); c.lineTo(0, -13); c.lineTo(5, 0); c.closePath(); c.fill(); // Eingang
  c.fillStyle = "#e3d2ad"; c.beginPath(); c.moveTo(0, -13); c.lineTo(5, 0); c.lineTo(8, 0); c.closePath(); c.fill(); // zurückgeschlagene Plane
  c.restore();
}
function jzbWwFeuerMalen(c, x, y, k, T, aus) {
  c.fillStyle = "#6c757d"; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(x + i * 3.4 * k, y - 1 * k, 1.6 * k, 0, 7); c.fill(); } // Steinkreis
  c.strokeStyle = aus >= 1 ? "#2b1a0e" : "#5c3a1a"; c.lineWidth = 2.2 * k; c.lineCap = "round";
  c.beginPath(); c.moveTo(x - 6 * k, y - 1.5 * k); c.lineTo(x + 5 * k, y - 4.5 * k); c.moveTo(x + 6 * k, y - 1.5 * k); c.lineTo(x - 5 * k, y - 4.5 * k); c.stroke(); // Holzscheite
  const s = 1 - aus; if (s <= 0) return;
  const gl = c.createRadialGradient(x, y - 6 * k, 0, x, y - 6 * k, 14 * k); gl.addColorStop(0, `rgba(255,170,60,${.28 * s})`); gl.addColorStop(1, "rgba(255,120,0,0)");
  c.fillStyle = gl; c.beginPath(); c.arc(x, y - 6 * k, 14 * k, 0, 7); c.fill(); // Glut-Schein
  for (const [farbe, hoehe, breite, ph] of [["#e85d04", 14, 6, 0], ["#f48c06", 10.5, 4.6, 1.7], ["#ffd166", 6.5, 2.8, 3.1]]) {
    const h = hoehe * k * s * (1 + .16 * Math.sin(T * 13 + ph)), b = breite * k * s, wob = Math.sin(T * 9 + ph) * 1.4 * k;
    c.fillStyle = farbe; c.beginPath(); c.moveTo(x - b, y - 3 * k); c.bezierCurveTo(x - b, y - 3 * k - h * .5, x + wob - b * .3, y - 3 * k - h * .8, x + wob, y - 3 * k - h);
    c.bezierCurveTo(x + wob + b * .3, y - 3 * k - h * .8, x + b, y - 3 * k - h * .5, x + b, y - 3 * k); c.closePath(); c.fill(); }
}
function jzbWildwestMalen(c, F) {
  const J = JZB, k = J.k, T = J.T, W = F.ww, t = F.t; if (!W) return;
  const O = jzbWwOrt();
  c.save(); if (W.beben > 0) c.translate(Math.sin(T * 47) * W.beben * 1.6 * k, Math.cos(T * 39) * W.beben * 1.1 * k); // der Boden bebt
  const g = c.createLinearGradient(0, O.horizont, 0, J.h); g.addColorStop(0, "rgba(233,196,106,.85)"); g.addColorStop(1, "rgba(204,149,92,.95)");
  c.fillStyle = g; c.fillRect(-4 * k, O.horizont, J.w + 8 * k, J.h - O.horizont + 4 * k); // Prärie
  c.fillStyle = "rgba(174,92,40,.8)"; // Tafelberge
  for (const [mx, mb, mh] of [[J.w * .42, 46, 15], [J.w * .76, 60, 20]]) { c.beginPath(); c.moveTo(mx - mb / 2 * k, O.horizont); c.lineTo(mx - mb / 2 * k + 7 * k, O.horizont - mh * k);
    c.lineTo(mx + mb / 2 * k - 7 * k, O.horizont - mh * k); c.lineTo(mx + mb / 2 * k, O.horizont); c.closePath(); c.fill(); }
  c.strokeStyle = "#2d6a4f"; c.lineCap = "round"; // Kakteen
  for (const [kx, kh] of [[J.w * .6, 14], [J.w * .9, 11]]) { c.lineWidth = 2.4 * k; c.beginPath(); c.moveTo(kx, O.horizont + 4 * k); c.lineTo(kx, O.horizont + 4 * k - kh * k); c.stroke();
    c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(kx, O.horizont - kh * .3 * k); c.lineTo(kx - 3.5 * k, O.horizont - kh * .3 * k); c.lineTo(kx - 3.5 * k, O.horizont - kh * .65 * k);
    c.moveTo(kx, O.horizont - kh * .45 * k); c.lineTo(kx + 3 * k, O.horizont - kh * .45 * k); c.lineTo(kx + 3 * k, O.horizont - kh * .8 * k); c.stroke(); }
  for (const b of W.horizont) jzbWwBueffelMalen(c, b.x, O.horizont + 2 * k, k * b.sc, 1, b.ph, true);
  if (W.wind) { const a = Math.sin(Math.PI * Math.min(1, W.wind.t / 2.4)) * .55; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1.1 * k; c.lineCap = "round"; // 🌬️ Windstriche
    for (let i = 0; i < 6; i++) { const yy = O.horizont - 14 * k + i * 6 * k, lx = ((W.wind.t * 260 * k + i * 73 * k) % (J.w + 120 * k)) - 60 * k, x0 = W.wind.dir > 0 ? lx : J.w - lx;
      c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 - W.wind.dir * (26 + i % 3 * 10) * k, yy); c.stroke(); } }
  if (W.kutsche) jzbWwKutscheMalen(c, W.kutsche.x, O.boden - 7 * k, k * 1.05, W.kutsche.ph);
  if (W.reiter) JZB_WW_COWBOYS.forEach((C, i) => jzbWwReiterMalen(c, W.reiter.x + i * 26 * k, O.boden - 6 * k - i * 2 * k, k * 1.1, -1, W.reiter.ph + i * 1.3, C, T));
  for (const r of W.rauch) { c.fillStyle = `rgba(120,120,120,${r.a})`; c.beginPath(); c.arc(r.x, r.y, r.r, 0, 7); c.fill(); }
  jzbWwZeltMalen(c, O.zelt, O.boden, k * 1.15, W.zeltFall);
  jzbWwFeuerMalen(c, O.feuer, O.boden, k, T, W.feuerAus);
  // 2.532.0: zwei Indianer sitzen am Feuer, der Häuptling steht daneben – wenn der Boden bebt, laufen sie davon (nächster Lauf: wieder da)
  const flucht = t > JZB_WW_HERDE - 3 ? (t - JZB_WW_HERDE + 3) * 62 * k : 0, lauf = flucht ? T * 11 : 0;
  if (O.feuer + 40 * k - flucht > -30 * k) {
    jzbWwIndianerMalen(c, O.feuer - 15 * k - flucht, O.boden, k * 1.05, { hemd: "#a1683a", sitzt: !flucht, lauf, dir: flucht ? -1 : 1 }, T);
    jzbWwIndianerMalen(c, O.feuer + 16 * k - flucht, O.boden, k * 1.12, { hemd: "#7f4f24", haube: true, lauf, dir: -1, pfeife: flucht ? 0 : jzbWwPfeifeGlut(t) }, T);
    jzbWwIndianerMalen(c, O.feuer + 32 * k - flucht, O.boden, k * 1.05, { hemd: "#9c6644", sitzt: !flucht, winkt: true, lauf, dir: -1 }, T); }
  // 🌵 2.532.0: rechts große Saguaro-Kakteen wie im Westen und ein kleiner Kugelkaktus
  jzbWwKaktusMalen(c, J.w - JZB_RAND - 12 * k, O.boden, 46, k, false); jzbWwKaktusMalen(c, J.w - JZB_RAND - 44 * k, O.boden + 1 * k, 32, k, true);
  c.fillStyle = "#2d6a4f"; c.beginPath(); c.ellipse(J.w - JZB_RAND - 28 * k, O.boden - 3 * k, 4.4 * k, 3.4 * k, 0, 0, 7); c.fill(); c.fillStyle = "#ff6b9a"; c.beginPath(); c.arc(J.w - JZB_RAND - 28 * k, O.boden - 6.4 * k, 1.2 * k, 0, 7); c.fill();
  jzbWwRauchNameMalen(c, t, O, k, T); // 2.533.0: aus der Friedenspfeife steigt Buchstabe für Buchstabe der Vorname auf
  const dd = t - JZB_WW_DUELL; if (dd >= 0 && dd < 27) jzbWwDuellMalen(c, dd, O, k, T); // 🤠🤠 Duell, dann holt der flache Wagen den Verwundeten
  for (const b of W.ballen) jzbWwBallenMalen(c, b, O.boden, k);
  for (const f of W.funken) { c.fillStyle = `rgba(255,200,80,${Math.max(0, f.a)})`; c.fillRect(f.x, f.y, 1.3 * k, 1.3 * k); }
  for (const s of W.staub) { c.fillStyle = `rgba(196,160,110,${s.a})`; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.fill(); } // Staub hinter der Herde
  for (const b of W.herde) jzbWwBueffelMalen(c, b.x, O.boden - b.tiefe * 9 * k, k * b.sc, -1, b.ph, true);
  c.restore();
  if (W.schleier > 0) { const v = c.createLinearGradient(0, 0, 0, J.h); v.addColorStop(0, `rgba(214,180,130,${W.schleier * .55})`); v.addColorStop(1, `rgba(196,160,110,${W.schleier * .97})`);
    c.fillStyle = v; c.fillRect(0, 0, J.w, J.h); } // die Staubwolke deckt alles zu – und lichtet sich zu Beginn des nächsten Laufs
}
// ---- 2.532.0 KC-CLUB-WILDWEST-2 (Wunsch Hansi „es fehlen noch 2 Indianer und ein Häuptling, rechts ein paar Kakteen so groß wie im Westen,
// ab und an ein Windstoß, der einen Ballen weht, und 2 Cowboys, die sich duellieren – dann kommt eine flache Kutsche und der Verwundete wird
// abtransportiert“): Figuren und Abläufe dazu. Duell ab JZB_WW_DUELL: beide kommen, stehen sich gegenüber, ziehen – „PENG!“, einer fällt um
// (der Hut fliegt), der Sieger geht davon; ein flacher Wagen holt den Verwundeten (Kopfverband) ab. Alles aus der Zeit im Lauf berechnet.
// ---- 2.533.0 KC-CLUB-FRIEDENSPFEIFE (Wunsch Hansi „Der Häuptling soll eine Friedenspfeife rauchen und daraus entsteht wieder Buchstabe für
// Buchstabe der Username“): ab 3 s raucht der Häuptling; je Buchstabe ein Zug (Glut leuchtet), eine Rauchwolke steigt auf, schwebt an ihren Platz
// am Himmel und wird zum Buchstaben des Vornamens (ohne Namen: „Köcheclub“). Fertig steht der Name in Rauchschrift, ab 26 s verweht ihn der Wind –
// rechtzeitig vor dem Duell (29 s). Alles aus der Zeit im Lauf berechnet, nur Bild, nichts wird gespeichert oder gesendet.
// 2.548.0 KC-CLUB-FRIEDENSPFEIFE-2 (Hansi: „der Name kommt zu schnell – das muss sich etwas hinziehen“): je Buchstabe bis 2,8 s statt 1,4 s (bei langen
// Namen so viel, dass er vor dem Verwehen fertig ist), die Rauchwolke schwebt 2,4 s statt 1,6 s an ihren Platz.
const JZB_WW_PFEIFE = [3, 26], JZB_WW_NAME_AB = 5, JZB_WW_NAME_WEHT = 26, JZB_WW_WOLKE = 2.4;
const jzbWwNameTakt = () => Math.min(2.8, 16 / Math.max(1, jzbWwNameText().length));
const jzbWwNameText = () => [...(jzbEisNameText() || "Köcheclub")].slice(0, 12);
const jzbWwNameStart = (i) => JZB_WW_NAME_AB + i * jzbWwNameTakt();
function jzbWwPfeifeGlut(t) { // 0 = Pfeife nicht in der Hand · sonst 0,15 (glimmt) bis 1 (kurz vor jeder Wolke wird gezogen)
  if (t < JZB_WW_PFEIFE[0] || t >= JZB_WW_PFEIFE[1]) return 0;
  const n = jzbWwNameText().length; let g = .15;
  for (let i = 0; i < n; i++) { const d = jzbWwNameStart(i) - t; if (d >= 0 && d < .6) g = Math.max(g, 1 - d / .6); }
  return g;
}
function jzbWwRauchNameLage(O, k) {
  const J = JZB, z = jzbWwNameText(), fs = Math.round(Math.max(10, Math.min(26 * k, (O.horizont - 8 * k) * .8))), f = `700 ${fs}px Georgia, "Times New Roman", serif`;
  const c = J.ctx; c.save(); c.font = f; const b = z.map((ch) => c.measureText(ch).width + 1.5 * k); c.restore();
  const ges = b.reduce((a, v) => a + v, 0); let x = Math.max(JZB_RAND, Math.min(J.w - JZB_RAND - ges, J.w * .56 - ges / 2));
  return { z, fs, f, y: Math.max(fs * .85 + 2, O.horizont - 24 * k), pos: b.map((w) => { const m = x + w / 2; x += w; return m; }) };
}
function jzbWwRauchNameMalen(c, t, O, k, T) {
  if (t < JZB_WW_PFEIFE[0] || t >= JZB_WW_DUELL) return;
  const sc = k * 1.12, bx = O.feuer + 16 * k - 10.5 * sc, by = O.boden - 21.4 * sc; // Pfeifenkopf (Häuptling schaut nach links)
  if (t < JZB_WW_PFEIFE[1]) for (let j = 0; j < 3; j++) { const p = (T * .5 + j / 3) % 1; // feiner Rauchfaden aus dem Pfeifenkopf
    c.fillStyle = `rgba(235,235,235,${.28 * (1 - p)})`; c.beginPath(); c.arc(bx + Math.sin(p * 6 + j) * 1.6 * k, by - p * 12 * k, (1 + p * 2.4) * k, 0, 7); c.fill(); }
  const L = jzbWwRauchNameLage(O, k), weht = Math.max(0, t - JZB_WW_NAME_WEHT), aus = Math.max(0, 1 - weht / 3);
  c.save(); c.font = L.f; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.shadowColor = "rgba(255,255,255,.9)"; c.shadowBlur = 6 * k;
  L.z.forEach((ch, i) => {
    const s = jzbWwNameStart(i), d = t - s; if (d < 0) return;
    const zx = L.pos[i], zy = L.y - L.fs * .35;
    if (d < JZB_WW_WOLKE + .1) { // die Rauchwolke steigt auf und schwebt langsam an ihren Platz
      const p = jzbEase(Math.min(1, d / JZB_WW_WOLKE)), x = bx + (zx - bx) * p, y = by + (zy - by) * p - Math.sin(p * Math.PI) * 12 * k, r = 2 * k + p * L.fs * .14, a = (.55 - p * .25) * (d > JZB_WW_WOLKE - .3 ? (JZB_WW_WOLKE + .1 - d) / .4 : 1);
      c.shadowBlur = 0; for (const [ox, oy, rr] of [[0, 0, 1], [-.7, .3, .75], [.7, .35, .7], [0, -.6, .65]]) { c.fillStyle = `rgba(240,240,240,${a})`; c.beginPath(); c.arc(x + ox * r, y + oy * r, rr * r, 0, 7); c.fill(); }
      c.shadowBlur = 6 * k;
    }
    const sichtbar = Math.min(1, Math.max(0, (d - (JZB_WW_WOLKE - .3)) / 1)) * aus; if (sichtbar <= 0) return; // Buchstabe erscheint langsam aus der Wolke
    const wob = Math.sin(T * 1.3 + i * 1.7) * .8 * k; // Rauch steht nie ganz still
    c.fillStyle = `rgba(248,248,248,${.88 * sichtbar})`; c.fillText(ch, zx + wob + weht * (14 + i * 2) * k, L.y + Math.cos(T * 1.1 + i) * .6 * k - weht * (5 + i % 3 * 2) * k);
  });
  c.restore();
}
function jzbWwIndianerMalen(c, x, y, sc, o, T) { // o: { hemd, sitzt, haube (Häuptling), winkt, lauf (Schrittphase beim Weglaufen), dir, pfeife (2.533.0: Glut 0…1) }
  c.save(); c.translate(x, y); c.scale(sc * (o.dir || 1), sc); c.lineCap = "round";
  const haut = "#b5764b"; let kopfY;
  if (o.sitzt) {
    c.fillStyle = "#7f5539"; c.beginPath(); c.ellipse(0, -2.2, 6, 2.4, 0, 0, 7); c.fill(); // gekreuzte Beine
    c.fillStyle = o.hemd; c.beginPath(); c.roundRect ? c.roundRect(-3, -12, 6, 9.5, 2) : c.rect(-3, -12, 6, 9.5); c.fill();
    const heb = o.winkt ? Math.max(0, Math.sin(T * 1.2)) : 0;
    c.strokeStyle = haut; c.lineWidth = 1.6; c.beginPath(); c.moveTo(2, -10); c.lineTo(5.6, -6.6 - heb * 6.5); c.moveTo(-2, -10); c.lineTo(-4.2, -6); c.stroke();
    kopfY = -14.6;
  } else {
    const s = o.lauf ? Math.sin(o.lauf) * 2.4 : 0;
    c.strokeStyle = "#7f5539"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-1.2, -9); c.lineTo(-1.6 + s, 0); c.moveTo(1.2, -9); c.lineTo(1.6 - s, 0); c.stroke();
    c.fillStyle = o.hemd; c.beginPath(); c.roundRect ? c.roundRect(-3.4, -19, 6.8, 11, 2) : c.rect(-3.4, -19, 6.8, 11); c.fill();
    c.fillStyle = "#e9c46a"; c.fillRect(-3.4, -12.2, 6.8, 1); // Gürtel
    c.strokeStyle = haut; c.lineWidth = 1.6; c.beginPath();
    if (o.lauf) { c.moveTo(-2, -17); c.lineTo(-4 - s, -11); c.moveTo(2, -17); c.lineTo(4 + s, -11); } else if (!o.pfeife) { c.moveTo(-3, -15.6); c.lineTo(3, -14.4); c.moveTo(3, -15.8); c.lineTo(-3, -14.2); } // verschränkte Arme
    c.stroke(); kopfY = -21.6;
  }
  if (o.pfeife) { // 2.533.0: Friedenspfeife – langer Holzstiel vom Mund nach vorn, roter Steinkopf, zwei Federn; die Glut leuchtet beim Ziehen
    c.strokeStyle = "#b5764b"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(2, -17); c.lineTo(5.6, kopfY + 2.6); c.moveTo(-2, -17); c.lineTo(3.4, kopfY + 2.2); c.stroke(); // Hände an der Pfeife
    c.strokeStyle = "#8b5a2b"; c.lineWidth = .9; c.beginPath(); c.moveTo(1.8, kopfY + 1.1); c.lineTo(10.2, kopfY + 2.8); c.stroke(); // Stiel
    c.fillStyle = "#9b2226"; c.fillRect(9.4, kopfY + .2, 2.2, 2.8); // Pfeifenkopf (roter Stein)
    c.fillStyle = `rgba(255,${120 + o.pfeife * 80 | 0},40,${.45 + o.pfeife * .55})`; c.beginPath(); c.arc(10.5, kopfY + .2, .9 + o.pfeife * .5, 0, 7); c.fill(); // Glut
    c.strokeStyle = "#fffaf0"; c.lineWidth = .7; c.beginPath(); c.moveTo(6, kopfY + 2.1); c.lineTo(6.4, kopfY + 6.4); c.moveTo(7.2, kopfY + 2.4); c.lineTo(7.8, kopfY + 6.2); c.stroke(); // Federn am Stiel
  }
  c.fillStyle = haut; c.beginPath(); c.arc(0, kopfY, 2.5, 0, 7); c.fill(); // Gesicht
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(0, kopfY - .5, 2.6, Math.PI, 0); c.fill(); c.fillRect(-2.6, kopfY - .5, 1.1, 4.4); c.fillRect(1.5, kopfY - .5, 1.1, 4.4); // Haare, Zöpfe
  c.fillStyle = "#c1121f"; c.fillRect(-2.7, kopfY - 1.7, 5.4, .9); // Stirnband
  if (o.haube) { // Federhaube des Häuptlings, Federband den Rücken hinab
    for (let i = -4; i <= 4; i++) { const a = i * .3 - Math.PI / 2, fx = Math.cos(a) * 6.4, fy = kopfY - 1.4 + Math.sin(a) * 6.4;
      c.strokeStyle = "#fffaf0"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Math.cos(a) * 2.4, kopfY - 1.4 + Math.sin(a) * 2.4); c.lineTo(fx, fy); c.stroke();
      c.fillStyle = "#3b2414"; c.beginPath(); c.arc(fx, fy, .7, 0, 7); c.fill(); }
    c.strokeStyle = "#fffaf0"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-2.4, kopfY); c.quadraticCurveTo(-4.6, kopfY + 6, -3.6, kopfY + 13); c.stroke();
  } else { c.strokeStyle = "#fffaf0"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-1.4, kopfY - 1.7); c.lineTo(-2.4, kopfY - 7.4); c.stroke(); c.fillStyle = "#3b2414"; c.beginPath(); c.arc(-2.4, kopfY - 7.4, .6, 0, 7); c.fill(); } // eine Feder
  c.restore();
}
function jzbWwCowboyMalen(c, x, y, sc, dir, C, o) { // zu Fuß, Blick nach +x: o.geh (Schrittphase), o.zieht 0…1 (Revolver hoch), o.liegt 0…1, o.hut, o.verband
  c.save(); c.translate(x, y); c.scale(sc * dir, sc); c.rotate(-(o.liegt || 0) * 1.5); c.lineCap = "round";
  const s = o.geh ? Math.sin(o.geh) * 2.4 : 0;
  c.strokeStyle = "#264653"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-1.2, -9); c.lineTo(-1.8 + s, 0); c.moveTo(1.2, -9); c.lineTo(1.8 - s, 0); c.stroke(); // Jeans
  c.fillStyle = "#3b2412"; c.fillRect(-3.2 + s, -1.3, 3, 1.5); c.fillRect(.6 - s, -1.3, 3, 1.5); // Stiefel
  c.fillStyle = C.hemd; c.beginPath(); c.roundRect ? c.roundRect(-3.2, -19.5, 6.4, 11, 2) : c.rect(-3.2, -19.5, 6.4, 11); c.fill(); // Hemd
  c.fillStyle = "#5c3a1a"; c.fillRect(-3.2, -10.2, 6.4, 1.3); c.fillRect(2.6, -10, 1.4, 3); // Gürtel mit Holster
  c.strokeStyle = C.hemd; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-1.6, -17.5); c.lineTo(-3 - s * .5, -11.5); c.stroke();
  const z = o.zieht || 0; c.beginPath(); c.moveTo(1.6, -17.5); c.lineTo(3.4 + z * 3.4, -11.5 - z * 5.2); c.stroke(); // Schussarm
  if (z > 0) { c.fillStyle = "#343a40"; c.fillRect(5.6 + z * 1.2, -17.6 - z * .2, 3.4, 1.2); } // Revolver
  c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(.3, -22.2, 2.4, 0, 7); c.fill(); // Gesicht
  if (o.verband) { c.fillStyle = "#ffffff"; c.fillRect(-2.2, -23.6, 4.8, 1.3); }
  if (o.hut) { c.fillStyle = C.hut; c.beginPath(); c.ellipse(.3, -24, 5, 1.1, 0, 0, 7); c.fill(); c.fillRect(-1.9, -27, 4.4, 3.2); }
  c.restore();
}
function jzbWwHutMalen(c, x, y, sc, w, farbe) { c.save(); c.translate(x, y); c.rotate(w); c.scale(sc, sc); c.fillStyle = farbe; c.beginPath(); c.ellipse(0, 0, 5, 1.1, 0, 0, 7); c.fill(); c.fillRect(-2.2, -3, 4.4, 3.2); c.restore(); }
function jzbWwWagenMalen(c, x, y, sc, ph, k) { // flacher Wagen nach rechts: ein Pferd, niedrige Ladefläche, Fahrer vorn
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.save(); c.translate(31, 0); jzbWwPferdMalen(c, ph, "#a0522d"); c.restore();
  c.strokeStyle = "#2b1a0e"; c.lineWidth = .9; c.beginPath(); c.moveTo(14, -10.5); c.lineTo(25, -11); c.stroke(); // Deichsel
  c.fillStyle = "#8d5a3b"; c.fillRect(-19, -11.5, 34, 3); c.fillStyle = "#6b4226"; c.fillRect(-19, -13, 34, 1.5); // Ladefläche, niedrige Bordwand
  for (const wx of [-12, 8]) { c.strokeStyle = "#3b2412"; c.lineWidth = 1.2; c.beginPath(); c.arc(wx, -5, 5, 0, 7); c.stroke(); c.lineWidth = .55;
    for (let s = 0; s < 6; s++) { const a = ph * .9 + s * Math.PI / 3; c.beginPath(); c.moveTo(wx, -5); c.lineTo(wx + Math.cos(a) * 5, -5 + Math.sin(a) * 5); c.stroke(); } }
  c.fillStyle = "#e9c46a"; c.fillRect(9.4, -21, 3.6, 7.6); c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(11.2, -23, 2, 0, 7); c.fill(); // Fahrer
  c.fillStyle = "#6c757d"; c.beginPath(); c.ellipse(11.2, -24.6, 3.6, .9, 0, 0, 7); c.fill(); c.fillRect(9.6, -27, 3.2, 2.4);
  c.restore();
}
function jzbWwKaktusMalen(c, x, y, h, k, spiegel) { // großer Saguaro mit zwei Armen
  c.save(); c.translate(x, y); c.scale(spiegel ? -k : k, k); c.lineCap = "round";
  for (const [farbe, b] of [["#1b4332", 6.4], ["#2d6a4f", 5]]) { c.strokeStyle = farbe; c.lineWidth = b; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -h);
    c.moveTo(0, -h * .45); c.lineTo(-7, -h * .45); c.lineTo(-7, -h * .72); c.moveTo(0, -h * .6); c.lineTo(6, -h * .6); c.lineTo(6, -h * .85); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = .6; c.beginPath(); c.moveTo(-1, -2); c.lineTo(-1, -h + 2); c.stroke(); // Rippe
  c.restore();
}
function jzbWwBallenMalen(c, b, boden, k) { // Steppenläufer: rollt und hüpft
  c.save(); c.translate(b.x, boden - 5 * k * b.sc - Math.abs(Math.sin(b.ph)) * 9 * k); c.rotate(b.dreh);
  c.strokeStyle = "rgba(150,110,60,.95)"; c.lineWidth = .9 * k; const r = 5.5 * k * b.sc;
  for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(0, 0, r, r * .55, i * .9, 0, 7); c.stroke(); }
  c.restore();
}
function jzbWwDuellMalen(c, d, O, k, T) { // d = Sekunden seit Duell-Beginn
  const J = JZB, y = O.boden - 2 * k, xA0 = J.w * .38, xB0 = J.w * .64, A = JZB_WW_COWBOYS[0], B = JZB_WW_COWBOYS[1], sc = k * 1.15;
  const rein = jzbEase(Math.min(1, d / 4)), zieht = d < 6.6 ? 0 : Math.min(1, (d - 6.6) / .5), liegt = d < 7.35 ? 0 : jzbEase(Math.min(1, (d - 7.35) / .6));
  // Sieger A: kommt (0–4 s), steht, zieht, schießt (7,2 s), dreht sich um und geht davon (9–13 s)
  const xA = d < 9 ? xA0 - (1 - rein) * 46 * k : xA0 - jzbEase((d - 9) / 4) * (xA0 + 30 * k);
  if (xA > -20 * k) jzbWwCowboyMalen(c, xA, y, sc, d < 9 ? 1 : -1, A, { geh: d < 4 || d >= 9 ? T * 8 : 0, zieht: d < 9 ? zieht : 0, hut: true });
  // flacher Wagen: kommt (10–16 s), hält (16–18 s, Verwundeter wird aufgeladen), fährt davon
  const halt = xB0 - 62 * k, wx = d < 10 ? null : d < 16 ? -70 * k + jzbEase((d - 10) / 6) * (halt + 70 * k) : d < 18 ? halt : halt + (d - 18) * 52 * k;
  const fahrt = wx !== null && (d < 16 || d >= 18), bett = O.boden - 1 * k - 13 * k * 1.05;
  if (wx !== null && wx < J.w + 80 * k) jzbWwWagenMalen(c, wx, O.boden - 1 * k, k * 1.05, fahrt ? T * 9 : 0, k);
  // Verwundeter B: steht, zieht zu spät, fällt rückwärts; ab 16 s auf den Wagen gehoben, dann mit Kopfverband abtransportiert
  const auf = d < 16 ? 0 : Math.min(1, (d - 16) / 1.4);
  if (auf < 1) { c.save(); c.globalAlpha *= 1 - auf; jzbWwCowboyMalen(c, d < 4 ? xB0 + (1 - rein) * 46 * k : xB0, y - auf * 10 * k, sc, -1, B, { geh: d < 4 ? T * 8 : 0, zieht: d < 7.35 ? zieht * .7 : 0, liegt, hut: d < 7.3, verband: d > 12 }); c.restore(); }
  if (auf > 0 && wx !== null && wx < J.w + 60 * k) { c.save(); c.globalAlpha *= auf; jzbWwCowboyMalen(c, wx + 9 * k, bett, sc * .95, 1, B, { liegt: 1, verband: true }); c.restore(); }
  // Hut fliegt davon und bleibt liegen (bis zum Aufladen)
  if (d >= 7.3 && d < 17.5) { const h = Math.min(1, (d - 7.3) / 1), hx = xB0 + h * 26 * k, hy = y - 26 * k - Math.sin(h * Math.PI) * 18 * k + h * 24 * k;
    c.save(); c.globalAlpha *= d > 16 ? Math.max(0, 1 - (d - 16) / 1.4) : 1; jzbWwHutMalen(c, hx, hy, k, h * 6, B.hut); c.restore(); }
  // Mündungsfeuer, Rauch und „PENG!“
  if (d >= 7.2 && d < 7.5) { const gx = xA + 10 * sc, gy = y - 17.6 * sc; c.fillStyle = "#ffd166"; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = (i % 2 ? 2 : 5) * k; c.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r); } c.fill(); }
  if (d >= 7.2 && d < 9) { const p = (d - 7.2) / 1.8; c.fillStyle = `rgba(200,200,200,${.5 * (1 - p)})`; c.beginPath(); c.arc(xA + 12 * sc + p * 6 * k, y - 18 * sc - p * 8 * k, (2 + p * 6) * k, 0, 7); c.fill(); }
  if (d >= 7.2 && d < 8.8) { const a = Math.min(1, (d - 7.2) * 5, (8.8 - d) * 2.5); c.save(); c.globalAlpha *= a; c.font = `800 ${13 * k}px "Comic Sans MS","Trebuchet MS",sans-serif`; c.textAlign = "center";
    c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.95)"; c.strokeText("PENG!", (xA + xB0) / 2, y - 34 * k); c.fillStyle = "#c1121f"; c.fillText("PENG!", (xA + xB0) / 2, y - 34 * k); c.restore(); }
}
// ---- 2.435.0 KC-CLUB-HALLOWEEN-GEWITTER (Wunsch Hansi „bei Halloween noch die Hexe auf ihrem Besen durchfliegen lassen, mehr Geister, Blitz und
// Donner wie bei Gewitter, auf seinem Sarg kommt ein Vampir mit Umhang – der setzt sich erst hin, dann steht er auf und geht weg – und die Hexe
// fuchtelt mit ihrem Zauberstab und die Szene ist vorbei“) ----
// Dunkle Wolken ziehen über den Mond; ab und zu ein Blitz (Lichtschein + Zickzack), kurz danach Donner (das Bild wackelt). Kleine Geister schweben
// vorbei. Die Hexe fliegt zweimal auf dem Besen durch („Hihihi!“). Nach gut 20 s geht der Sargdeckel auf: der Vampir richtet sich auf, sitzt,
// grüßt mit dem Vornamen, steigt heraus und geht mit wehendem Umhang davon; der Deckel schließt sich. Zum Schluss schwebt die Hexe in die Mitte,
// fuchtelt mit dem Zauberstab (Funken) – ein Zauberblitz, sie fliegt davon und die Szene ist vorbei.
const JZB_HW_ENDE = 15; // Sekunden vor Laufende: die Hexe kommt zum Schlusszauber (2.436.0: erst zum Kessel, dann zaubern)
const jzbHwSargX = () => Math.max(JZB_RAND + 70 * JZB.k, JZB.w * .37);
// 2.436.0 (Fund Hansi „die Hexe fliegt genau hinter dem Stück mit den LEDs – besser ein Stück tiefer“): Flughöhe unterhalb der Lämpchen-Leiste
// (Statusleiste) – deren Lage hängt davon ab, wie viel im Kopf steht, darum wird sie gemessen; reicht der Platz nicht, so tief wie möglich
function jzbHwLeisteUnten() {
  try { const s = JZB.s, l = s?.parentElement?.querySelector(".statusleiste"); if (!l) return 0; const a = l.getBoundingClientRect(), b = s.getBoundingClientRect(); return a.height ? Math.max(0, a.bottom - b.top) : 0; } catch { return 0; }
}
function jzbHwFlugY(oben, unten, f) { const J = JZB, lu = jzbHwLeisteUnten(), min = Math.max(J.h * .12, lu + oben * J.k), max = J.h - unten * J.k; return max <= min ? max : min + (max - min) * f; }
function jzbHwSchritt(F, dt) {
  const J = JZB, k = J.k, D = JZB_FEST_DAUER;
  const H = F.hw || (F.hw = { geister: [], geistUhr: jzbZ(2, 5), blitz: null, blitzUhr: jzbZ(3, 7), donnerIn: 0, donner: 0, knall: 0, hexe: null, hexeNr: 0, vamp: null, ende: false,
    wolken: Array.from({ length: 4 }, (_, i) => ({ x: (i + jzbZ(.1, .9)) * J.w / 4, y: jzbZ(5, 14) * k, r: jzbZ(10, 16) * k, v: jzbZ(3, 7) * k })) });
  for (const w of H.wolken) { w.x += w.v * dt; if (w.x - w.r * 2.5 > J.w) w.x = -w.r * 2.5; }
  // ⚡ Gewitter: Blitz, kurz danach Donner
  if ((H.blitzUhr -= dt) <= 0 && F.t < D - JZB_HW_ENDE - 2) {
    H.blitzUhr = jzbZ(7, 15); const x0 = jzbZ(J.w * .12, J.w * .88), yz = J.h * jzbZ(.45, .8), pfad = [[x0, 0]]; let x = x0, y = 0;
    while (y < yz) { y += jzbZ(6, 12) * k; x += jzbZ(-8, 8) * k; pfad.push([x, y]); }
    const ast = pfad[Math.floor(pfad.length * .45)], zweig = [ast]; let ax = ast[0], ay = ast[1]; for (let i = 0; i < 4; i++) { ay += jzbZ(5, 9) * k; ax += jzbZ(4, 9) * k * (x0 > J.w / 2 ? -1 : 1); zweig.push([ax, ay]); }
    H.blitz = { t: 0, pfad, zweig }; H.donnerIn = jzbZ(.45, 1.1);
  }
  if (H.blitz && (H.blitz.t += dt) > .6) H.blitz = null;
  if (H.donnerIn > 0 && (H.donnerIn -= dt) <= 0) H.donner = .9;
  if (H.donner > 0) H.donner -= dt;
  // 👻 kleine Geister schweben vorbei
  if ((H.geistUhr -= dt) <= 0 && F.t < D - 10 && H.geister.length < 3) {
    H.geistUhr = jzbZ(5, 10); const dir = Math.random() < .5 ? 1 : -1;
    H.geister.push({ dir, x: dir > 0 ? -20 * k : J.w + 20 * k, y0: jzbHwFlugY(14, 34, Math.random()), v: jzbZ(14, 24) * k, ph: jzbZ(0, 6), s: jzbZ(.6, .9) });
  }
  for (const g of H.geister) { g.x += g.dir * g.v * dt; g.ph += dt; }
  H.geister = H.geister.filter((g) => g.x > -40 * k && g.x < J.w + 40 * k);
  // 🧙 Hexe: zweimal vorbei, zum Schluss der Zauber
  if (!H.hexe && !H.ende && ((F.t > 9 && H.hexeNr === 0) || (F.t > 58 && H.hexeNr === 1))) {
    H.hexeNr++; const dir = H.hexeNr === 1 ? 1 : -1; H.hexe = { modus: "vorbei", dir, x: dir > 0 ? -45 * k : J.w + 45 * k, y0: jzbHwFlugY(32, 44, jzbZ(.1, .5)), t: 0 }; }
  if (!H.ende && F.t > D - JZB_HW_ENDE) { H.ende = true; const yy = jzbHwFlugY(36, 44, .35); H.hexe = { modus: "ende", dir: 1, x: -45 * k, sx: -45 * k, y0: yy, yStart: yy, yFlug: yy, t: 0 }; }
  const X = H.hexe;
  if (X) { X.t += dt;
    if (X.modus === "vorbei") { X.x += X.dir * 75 * k * dt; if (X.x < -70 * k || X.x > J.w + 70 * k) H.hexe = null; }
    else if (X.t < 6.4) { const kx = jzbHwKesselX() + 13 * k, ky = J.h - 31 * k, zx = J.w * .5; // 2.436.0: erst zum Kessel, kurz rühren, dann hoch zum Zaubern
      if (X.t < 2.6) { const p = jzbEase(X.t / 2.6); X.x = X.sx + (kx - X.sx) * p; X.y0 = X.yStart + (ky - X.yStart) * p; }
      else if (X.t < 4.8) { X.ruehrt = true; X.x = kx; X.y0 = ky; }
      else { X.ruehrt = false; const p = jzbEase((X.t - 4.8) / 1.6); X.x = kx + (zx - kx) * p; X.y0 = ky + (X.yFlug - ky) * p; } }
    else if (X.t < 9.8) { X.zaubert = true; if (Math.random() < dt * 28) { const [sx, sy] = jzbHwStab(X); J.fx.push({ typ: "funke", x: sx, y: sy, vx: jzbZ(-45, 45), vy: jzbZ(-45, 25), s: jzbZ(1.4, 2.6), a: 1, farbe: jzbW(["#c77dff", "#ffd23f", "#7bed6f", "#ffffff", "#ff9f1c"]) }); } }
    else if (!X.knall) { X.knall = true; X.zaubert = false; H.knall = 1; const [sx, sy] = jzbHwStab(X);
      for (let i = 0; i < 36; i++) { const w = i / 36 * Math.PI * 2, v = jzbZ(50, 110) * Math.max(.7, k); J.fx.push({ typ: "funke", x: sx, y: sy, vx: Math.cos(w) * v, vy: Math.sin(w) * v, s: jzbZ(1.8, 3.2), a: 1, farbe: jzbW(["#c77dff", "#ffd23f", "#ffffff", "#ff7a00"]) }); } }
    else { X.x += 90 * k * dt; X.y0 -= 55 * k * dt; if (X.y0 < -60 * k) H.hexe = null; } // fliegt davon – die Szene ist vorbei
  }
  if (H.knall > 0) H.knall -= dt * 1.1;
  // 🧛 Vampir im Sarg
  if (!H.vamp && F.t > 22) H.vamp = { t: 0 };
  if (H.vamp) H.vamp.t += dt;
  jzbHwUntenSchritt(F, H, dt); // 2.436.0: Kessel, Skelett, Katze, Süßes oder Saures
}
const jzbHwHexeY = (X) => X.y0 + Math.sin(X.t * 2.2) * 3 * JZB.k;
const jzbHwStabWinkel = (X) => X.ruehrt ? 2.35 + Math.sin(X.t * 6) * .35 : -1.1 + (X.zaubert ? Math.sin(X.t * 12) * .8 : 0) * .6; // rührt im Kessel / fuchtelt
function jzbHwStab(X) { // Spitze des Zauberstabs in Bildkoordinaten
  const sc = 1.15 * JZB.k, a = jzbHwStabWinkel(X), lx = Math.cos(a) * 10, ly = -6 + Math.sin(a) * 10;
  return [X.x + X.dir * lx * sc, jzbHwHexeY(X) + ly * sc];
}
function jzbHwHexeMalen(c, X) {
  const J = JZB, k = J.k, sc = 1.15 * k, fl = Math.sin(X.t * 9), y = jzbHwHexeY(X);
  c.save(); c.translate(X.x, y); c.scale(X.dir * sc, sc); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = "#e0b04a"; c.lineWidth = .9; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(-15, 3.4); c.lineTo(-26 + Math.abs(i) * .6, 3.4 + i * 1.1 + fl * .5); c.stroke(); } // Reisig
  c.strokeStyle = "#7a4e26"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-16, 3.6); c.lineTo(17, 1.6); c.stroke(); // Besenstiel
  c.fillStyle = "#3c1450"; c.beginPath(); c.moveTo(-2.5, -7); c.lineTo(-14 - fl * 2, -3 + fl); c.lineTo(-9, 2.5); c.closePath(); c.fill(); // Umhang weht
  c.strokeStyle = "#1b1b1b"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 2.5); c.lineTo(3, 8.5); c.moveTo(-1.6, 2.5); c.lineTo(.6, 8.8); c.stroke(); // Beine
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.ellipse(3.8, 8.8, 1.8, .9, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(1.4, 9.1, 1.8, .9, 0, 0, 7); c.fill();
  c.fillStyle = "#5b1f7a"; c.beginPath(); c.moveTo(-4.4, 3.4); c.lineTo(4.4, 3.4); c.lineTo(2.2, -8); c.lineTo(-2.8, -8); c.closePath(); c.fill(); // Kleid
  c.strokeStyle = "#5b1f7a"; c.lineWidth = 1.7; c.beginPath(); c.moveTo(1.4, -6); c.lineTo(7, 1.9); c.stroke(); c.fillStyle = "#8cc06a"; c.beginPath(); c.arc(7.2, 2, 1, 0, 7); c.fill(); // Hand am Besen
  c.strokeStyle = "#ff8c1a"; c.lineWidth = 1.2; for (const d of [0, 1.2, 2.4]) { c.beginPath(); c.moveTo(-1.5, -12); c.quadraticCurveTo(-5 - d, -10 + fl * .6, -7.5 - d, -6.5 + d * .6); c.stroke(); } // Haare
  c.fillStyle = "#8cc06a"; c.beginPath(); c.arc(.8, -11, 3.2, 0, 7); c.fill(); // Gesicht
  c.beginPath(); c.moveTo(3.6, -11.6); c.lineTo(7.4, -10.2); c.lineTo(3.6, -9.6); c.closePath(); c.fill(); // lange Nase
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(2.2, -11.8, .45, 0, 7); c.fill();
  c.fillStyle = "#1d1028"; c.beginPath(); c.ellipse(.6, -14, 5.4, 1.2, -.1, 0, 7); c.fill(); // Hut mit Krempe
  c.beginPath(); c.moveTo(-2.8, -14.2); c.lineTo(3.4, -14.6); c.quadraticCurveTo(0, -18, -5.5, -22.5); c.closePath(); c.fill();
  c.fillStyle = "#c77dff"; c.fillRect(-2.6, -15.6, 5.8, 1.1);
  const a = jzbHwStabWinkel(X), tx = Math.cos(a) * 10, ty = -6 + Math.sin(a) * 10; // Zauberstab
  c.strokeStyle = "#5b1f7a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -6); c.lineTo(Math.cos(a) * 5, -6 + Math.sin(a) * 5); c.stroke();
  c.strokeStyle = "#2b1a10"; c.lineWidth = 1; c.beginPath(); c.moveTo(Math.cos(a) * 5, -6 + Math.sin(a) * 5); c.lineTo(tx, ty); c.stroke();
  if (X.zaubert || X.modus === "ende") jzbStern(c, tx, ty, 1.8, "#ffd23f");
  c.restore();
  if (X.modus === "vorbei" && Math.abs(X.x - J.w / 2) < 50 * k) { c.save(); c.font = `800 ${10 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.7)"; c.strokeText("Hihihi!", X.x, y - 30 * k); c.fillStyle = "#d9b8ff"; c.fillText("Hihihi!", X.x, y - 30 * k); c.restore(); }
}
function jzbHwVampirMalen(c, x, yHuefte, rot, sc, schritt, umhang) { // stehend gezeichnet, Hüfte im Ursprung, Blick nach rechts
  c.save(); c.translate(x, yHuefte); c.rotate(rot); c.scale(sc, sc); c.lineCap = "round"; c.lineJoin = "round";
  const b = Math.sin(schritt) * 2.2;
  c.fillStyle = "#7a0f1f"; c.beginPath(); c.moveTo(-3.6, -11); c.lineTo(-8.5 - umhang, 7.5); c.lineTo(2, 8.2); c.closePath(); c.fill(); // Umhang innen rot
  c.fillStyle = "#111"; c.beginPath(); c.moveTo(-3.2, -11); c.lineTo(-9.6 - umhang * 1.2, 8.6); c.lineTo(-5.5 - umhang * .6, 9); c.lineTo(-1, -9); c.closePath(); c.fill();
  c.strokeStyle = "#151515"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-1.3, 0); c.lineTo(-1.3 + b, 9); c.moveTo(1.3, 0); c.lineTo(1.3 - b, 9); c.stroke(); // Beine
  c.fillStyle = "#000"; c.beginPath(); c.ellipse(-.6 + b, 9.4, 1.9, .9, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(2 - b, 9.4, 1.9, .9, 0, 0, 7); c.fill();
  c.fillStyle = "#1a1a1a"; c.fillRect(-3.2, -11, 6.4, 11.4); // Anzug
  c.fillStyle = "#f2f2f2"; c.beginPath(); c.moveTo(-1.2, -11); c.lineTo(0, -5.5); c.lineTo(1.2, -11); c.closePath(); c.fill();
  c.fillStyle = "#c1121f"; c.beginPath(); c.moveTo(-1.4, -10.4); c.lineTo(1.4, -9.4); c.lineTo(1.4, -10.4); c.lineTo(-1.4, -9.4); c.closePath(); c.fill(); // Fliege
  c.fillStyle = "#111"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 3.2, -11); c.lineTo(s * 5.4, -18.5); c.lineTo(s * 1.4, -12.2); c.closePath(); c.fill(); } // hoher Kragen
  c.fillStyle = "#7a0f1f"; c.beginPath(); c.moveTo(3, -11.4); c.lineTo(4.6, -17); c.lineTo(1.8, -12.2); c.closePath(); c.fill();
  c.fillStyle = "#ddd6ea"; c.beginPath(); c.ellipse(.4, -14.6, 2.8, 3.2, 0, 0, 7); c.fill(); // Gesicht
  c.fillStyle = "#111"; c.beginPath(); c.moveTo(-2.6, -15.4); c.quadraticCurveTo(-2.4, -18.6, .6, -18.2); c.quadraticCurveTo(3.4, -18, 3.2, -15.6); c.lineTo(1.2, -16.4); c.lineTo(.4, -15.2); c.lineTo(-.6, -16.4); c.closePath(); c.fill(); // Haare mit Spitze
  c.fillStyle = "#e01e37"; c.beginPath(); c.arc(1.6, -14.9, .45, 0, 7); c.fill(); // rotes Auge
  c.fillStyle = "#fff"; c.beginPath(); c.moveTo(1.6, -12.6); c.lineTo(2.1, -11.6); c.lineTo(2.4, -12.6); c.closePath(); c.fill(); // Eckzahn
  c.restore();
}
function jzbHwSargMalen(c, F, hinten) { // hinten: nur der Deckel (liegt hinter dem Vampir), sonst die Kiste davor
  const J = JZB, k = J.k, sx = jzbHwSargX(), yb = J.h - 1, V = F.hw?.vamp, t = V ? V.t : 0;
  const offen = t < 12 ? jzbEase(t / 1.2) : Math.max(0, 1 - jzbEase((t - 12) / 1.2));
  if (hinten) {
    c.save(); c.translate(sx - 23 * k, yb - 10 * k); c.rotate(-offen * 1.25);
    c.fillStyle = "#4a2a18"; c.beginPath(); c.moveTo(0, 0); c.lineTo(48 * k, 0); c.lineTo(46 * k, -5 * k); c.lineTo(3 * k, -5 * k); c.closePath(); c.fill();
    c.fillStyle = "#2e180d"; c.fillRect(2 * k, -1.2 * k, 45 * k, 1.2 * k);
    c.strokeStyle = "#d4a017"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(14 * k, -2.8 * k); c.lineTo(30 * k, -2.8 * k); c.moveTo(19 * k, -4.4 * k); c.lineTo(19 * k, -1.4 * k); c.stroke(); // goldenes Kreuz
    c.restore(); return;
  }
  c.fillStyle = "#3d2214"; c.beginPath(); c.moveTo(sx - 26 * k, yb); c.lineTo(sx + 26 * k, yb); c.lineTo(sx + 28 * k, yb - 5 * k); c.lineTo(sx + 25 * k, yb - 10 * k); c.lineTo(sx - 23 * k, yb - 10 * k); c.lineTo(sx - 28 * k, yb - 5 * k); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = .7; c.beginPath(); c.moveTo(sx - 26 * k, yb - 5 * k); c.lineTo(sx + 27 * k, yb - 5 * k); c.stroke();
  c.strokeStyle = "#b08d57"; c.lineWidth = 1.2 * k; c.beginPath(); c.moveTo(sx - 8 * k, yb - 3 * k); c.lineTo(sx + 8 * k, yb - 3 * k); c.stroke(); // Griff
  if (offen > .05) { c.fillStyle = "rgba(122,15,31,.85)"; c.fillRect(sx - 22 * k, yb - 10.6 * k, 46 * k, 1.2 * k); } // rotes Futter am Rand
}
// ---- 2.436.0 KC-CLUB-HALLOWEEN-UNTEN (Wunsch Hansi „unten muss noch mehr passieren“ – gewählt: Grab mit Skelett, schwarze Katze, Hexenkessel,
// Süßes oder Saures) ----
// 🪦 Grabstein „R.I.P.“: eine Knochenhand greift aus der Erde und winkt, ein Skelett klettert heraus, tanzt klappernd und zerfällt wieder.
// 🐈‍⬛ Schwarze Katze mit leuchtenden Augen schleicht über den Boden; auf ihrem ersten Weg kracht ein Blitz – sie macht einen Buckel: „Fauch!“
// 🧪 Hexenkessel über dem Feuer blubbert grün und dampft; zum Schluss rührt die Hexe darin, bevor sie zaubert.
// 🍬 Verkleidete Kinder (Gespenst, Kürbis, kleine Hexe) ziehen mit Laterne und Eimer vorbei: „Süßes oder Saures, <Vorname>!“
const jzbHwKesselX = () => { const J = JZB, k = J.k; return Math.min(JZB_RAND + 64 * k, jzbHwSargX() - 40 * k); };
const jzbHwGrabX = () => { const J = JZB, k = J.k; return Math.max(jzbHwSargX() + 52 * k, Math.min(J.w * .6, J.w - 105 * k)); };
function jzbHwUntenSchritt(F, H, dt) {
  const J = JZB, k = J.k, t = F.t, D = JZB_FEST_DAUER;
  // Kessel: Blasen steigen und platzen, beim Rühren der Hexe besonders viele
  const kx = jzbHwKesselX(), ky = J.h - 15 * k, wild = H.hexe?.modus === "ende" && H.hexe.ruehrt;
  H.kblasen = H.kblasen || []; if (Math.random() < dt * (wild ? 14 : 4)) H.kblasen.push({ x: kx + jzbZ(-6, 6) * k, y: ky, r: jzbZ(1, 2.2) * k, v: jzbZ(4, 9) * k, a: 1 });
  for (const b of H.kblasen) { b.y -= b.v * dt; b.r += dt * 1.2 * k; b.a -= dt * 1.4; } H.kblasen = H.kblasen.filter((b) => b.a > 0);
  // Skelett: einmal je Lauf
  if (!H.skelett && t > 40 && t < D - 25) H.skelett = { t: 0 };
  if (H.skelett) H.skelett.t += dt;
  // Katze: zweimal je Lauf; beim ersten Mal gibt es mitten auf dem Weg einen Blitz
  if (!H.katze && ((t > 14 && !H.katzeNr) || (t > 64 && H.katzeNr === 1))) { H.katzeNr = (H.katzeNr || 0) + 1; H.katze = { x: -20 * k, t: 0, fauch: 0, nr: H.katzeNr }; }
  const C = H.katze;
  if (C) { C.t += dt;
    if (C.nr === 1 && !C.blitzt && C.x > J.w * .45) { C.blitzt = true; H.blitzUhr = .05; }
    if (H.blitz && H.blitz.t < .1 && C.fauch <= 0 && C.x > 30 * k && C.x < J.w - 30 * k) C.fauch = 1.5;
    if (C.fauch > 0) C.fauch -= dt; else C.x += 26 * k * dt;
    if (C.x > J.w + 30 * k) H.katze = null; }
  // Süßes oder Saures: einmal je Lauf von rechts
  if (!H.kinderDa && t > 72 && t < D - 20) { H.kinderDa = true; H.kinder = { x: J.w + 30 * k, t: 0 }; }
  if (H.kinder) { H.kinder.t += dt; H.kinder.x -= 20 * k * dt; if (H.kinder.x < -90 * k) H.kinder = null; }
}
function jzbHwKesselMalen(c, F, H) {
  const J = JZB, k = J.k, T = J.T, kx = jzbHwKesselX(), yb = J.h - 1;
  for (let i = 0; i < 4; i++) { const fl = Math.sin(T * 17 + i * 1.7) * 1.4 * k, x = kx + (i - 1.5) * 3.2 * k; // Feuer
    c.fillStyle = i % 2 ? "#ff9f1c" : "#ff5d1c"; c.beginPath(); c.moveTo(x - 2.4 * k, yb); c.quadraticCurveTo(x, yb - 9 * k - fl, x + 2.4 * k, yb); c.closePath(); c.fill();
    c.fillStyle = "#ffe066"; c.beginPath(); c.moveTo(x - 1 * k, yb); c.quadraticCurveTo(x, yb - 4.5 * k - fl * .5, x + 1 * k, yb); c.closePath(); c.fill(); }
  const gl = c.createRadialGradient(kx, yb - 3 * k, 1, kx, yb - 3 * k, 20 * k); gl.addColorStop(0, "rgba(255,150,40,.35)"); gl.addColorStop(1, "rgba(255,120,20,0)"); c.fillStyle = gl; c.beginPath(); c.arc(kx, yb - 3 * k, 20 * k, 0, 7); c.fill();
  c.strokeStyle = "#222"; c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(kx - 7 * k, yb - 8 * k); c.lineTo(kx - 9 * k, yb); c.moveTo(kx + 7 * k, yb - 8 * k); c.lineTo(kx + 9 * k, yb); c.stroke(); // Beine
  c.fillStyle = "#1d1d22"; c.beginPath(); c.ellipse(kx, yb - 13 * k, 10 * k, 7.5 * k, 0, 0, 7); c.fill(); // Kessel
  c.fillStyle = "#33333b"; c.beginPath(); c.ellipse(kx, yb - 19.5 * k, 9.5 * k, 2.2 * k, 0, 0, 7); c.fill();
  c.fillStyle = "#62d84e"; c.beginPath(); c.ellipse(kx, yb - 19.6 * k, 8 * k, 1.5 * k, 0, 0, 7); c.fill(); // grünes Gebräu
  c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.ellipse(kx - 4 * k, yb - 15 * k, 2 * k, 3.5 * k, -.4, 0, 7); c.fill();
  for (const b of H.kblasen || []) { c.strokeStyle = `rgba(160,255,140,${b.a})`; c.lineWidth = .8; c.beginPath(); c.arc(b.x, b.y - 6 * k, b.r, 0, 7); c.stroke(); }
  for (let i = 0; i < 3; i++) { const p = (T * .35 + i / 3) % 1, x = kx + Math.sin(T * 1.3 + i * 2) * 4 * k, y = yb - 22 * k - p * 26 * k; // grüner Dampf
    c.fillStyle = `rgba(150,240,130,${.28 * (1 - p)})`; c.beginPath(); c.arc(x, y, (3 + p * 5) * k, 0, 7); c.fill(); }
}
function jzbHwSkelettFigur(c, x, yb, sc, t, tanz) { // Skelett stehend (Füße bei yb); tanz 0..1 bewegt Arme und Beine
  c.save(); c.translate(x, yb); c.scale(sc, sc); c.lineCap = "round"; c.strokeStyle = "#f1efe6"; c.lineWidth = 1.5;
  const a = Math.sin(t * 9) * tanz, b = Math.sin(t * 9 + Math.PI) * tanz, hop = Math.abs(Math.sin(t * 9)) * 1.5 * tanz;
  c.translate(0, -hop);
  for (const [s, w] of [[-1, a], [1, b]]) { c.beginPath(); c.moveTo(s * 1.2, -10); c.lineTo(s * (1.8 + w * 1.5), -5); c.lineTo(s * (1.6 + w * 2.6), 0); c.stroke(); } // Beine
  c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -19.5); c.stroke(); // Wirbelsäule
  c.lineWidth = 1.1; for (const y of [-18.2, -16.6, -15]) { c.beginPath(); c.moveTo(-2.6, y + .6); c.quadraticCurveTo(0, y - .8, 2.6, y + .6); c.stroke(); } // Rippen
  c.beginPath(); c.ellipse(0, -10.2, 2.2, 1, 0, 0, 7); c.stroke(); // Becken
  c.lineWidth = 1.4; for (const [s, w] of [[-1, a], [1, b]]) { c.beginPath(); c.moveTo(s * 2.6, -19); c.lineTo(s * (5 + w * .8), -15 - w * 4); c.lineTo(s * (6.4 + w), -20 - w * 5); c.stroke(); } // Arme winken
  c.fillStyle = "#f1efe6"; c.beginPath(); c.arc(0, -23, 3.3, 0, 7); c.fill(); c.fillRect(-1.8, -21, 3.6, 2.2); // Schädel
  c.fillStyle = "#1a1a1a"; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 1.2, -23.3, .85, 0, 7); c.fill(); } c.beginPath(); c.moveTo(0, -22.2); c.lineTo(-.5, -21.2); c.lineTo(.5, -21.2); c.closePath(); c.fill();
  c.strokeStyle = "#1a1a1a"; c.lineWidth = .4; for (const x2 of [-1.2, -.4, .4, 1.2]) { c.beginPath(); c.moveTo(x2, -19.6); c.lineTo(x2, -18.9); c.stroke(); }
  c.restore();
}
function jzbHwGrabMalen(c, F, H) {
  const J = JZB, k = J.k, T = J.T, gx = jzbHwGrabX(), yb = J.h - 1, ex = gx + 20 * k;
  // 2.437.0 KC-CLUB-GRABSTEIN-DEUTLICH (Fund Hansi „der Grabstein ist nicht gut zu erkennen, die Inschrift sieht man nicht“): größer, heller Stein
  // mit Mondlicht-Kante und dunklem Rand, eingemeißeltes Kreuz und große, helle „R.I.P.“-Inschrift mit Schattenkante, Gras am Fuß
  const b = 11 * k, hoch = 20 * k, oben = yb - hoch, stein = () => { c.beginPath(); c.moveTo(gx - b, yb); c.lineTo(gx - b, oben); c.arc(gx, oben, b, Math.PI, 0); c.lineTo(gx + b, yb); c.closePath(); };
  const gl = c.createRadialGradient(gx, oben, 2 * k, gx, oben, 30 * k); gl.addColorStop(0, "rgba(220,225,255,.22)"); gl.addColorStop(1, "rgba(220,225,255,0)"); c.fillStyle = gl; c.beginPath(); c.arc(gx, oben, 30 * k, 0, 7); c.fill(); // leiser Schein
  const g = c.createLinearGradient(gx - b, 0, gx + b, 0); g.addColorStop(0, "#d6d9e4"); g.addColorStop(.45, "#a9adbb"); g.addColorStop(1, "#6f7383"); c.fillStyle = g; stein(); c.fill();
  c.strokeStyle = "#2c2e38"; c.lineWidth = 1.3 * k; stein(); c.stroke(); // dunkler Rand
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1 * k; c.beginPath(); c.moveTo(gx - b + 1.3 * k, yb - 2 * k); c.lineTo(gx - b + 1.3 * k, oben); c.arc(gx, oben, b - 1.3 * k, Math.PI, Math.PI * 1.45); c.stroke(); // Mondlicht-Kante
  c.strokeStyle = "rgba(40,42,52,.55)"; c.lineWidth = .8; c.beginPath(); c.moveTo(gx + 6 * k, oben - 6 * k); c.lineTo(gx + 4 * k, oben - 2 * k); c.lineTo(gx + 6.4 * k, oben + 2 * k); c.stroke(); // Riss
  const kreuz = (dx, dy, f) => { c.fillStyle = f; c.fillRect(gx - .8 * k + dx, oben - 7 * k + dy, 1.6 * k, 6 * k); c.fillRect(gx - 2.6 * k + dx, oben - 5.4 * k + dy, 5.2 * k, 1.5 * k); };
  kreuz(.5, .5, "rgba(255,255,255,.65)"); kreuz(0, 0, "#3a3c48"); // eingemeißeltes Kreuz
  c.font = `900 ${7.6 * k}px Georgia,"Times New Roman",serif`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "#2c2e38"; c.fillText("R.I.P.", gx + .7 * k, oben + 5.2 * k); c.fillStyle = "#f4f5fa"; c.fillText("R.I.P.", gx, oben + 4.5 * k); // Inschrift hell mit Schattenkante
  c.strokeStyle = "#3f6b2a"; c.lineWidth = 1 * k; c.lineCap = "round"; for (let i = -5; i <= 5; i++) { const x = gx + i * 2.2 * k, h = (2 + (i * 7 + 11) % 3) * k; c.beginPath(); c.moveTo(x, yb); c.lineTo(x + Math.sin(T * 1.5 + i) * .6 * k, yb - h); c.stroke(); } // Gras
  c.fillStyle = "#3b2a1e"; c.beginPath(); c.ellipse(ex, yb, 11 * k, 3 * k, 0, Math.PI, 0); c.fill(); // Erdhügel
  const S = H.skelett; if (!S) return; const t = S.t, sc = 1.15 * k;
  c.save(); c.beginPath(); c.rect(0, 0, J.w, yb - 1.5 * k); c.clip(); // nur über der Erde sichtbar
  if (t < 3.5) { const p = jzbEase(t / 1.6), w = t > 1.6 ? Math.sin((t - 1.6) * 10) * .35 : 0; // Knochenhand greift heraus und winkt
    c.save(); c.translate(ex, yb + 8 * k - p * 13 * k); c.rotate(w); c.strokeStyle = "#f1efe6"; c.lineCap = "round"; c.lineWidth = 1.6 * k;
    c.beginPath(); c.moveTo(0, 8 * k); c.lineTo(0, 0); c.stroke(); c.lineWidth = 1 * k; for (const [dx, l] of [[-2, 4], [-.7, 5], [.7, 5], [2, 4.2]]) { c.beginPath(); c.moveTo(dx * .6 * k, 0); c.lineTo(dx * k, -l * k); c.stroke(); }
    c.beginPath(); c.moveTo(-1.5 * k, 1 * k); c.lineTo(-3.6 * k, -1.5 * k); c.stroke(); c.restore(); }
  else if (t < 5.5) jzbHwSkelettFigur(c, ex, yb + 27 * sc * (1 - jzbEase((t - 3.5) / 2)), sc, T, 0); // klettert heraus
  else if (t < 12) { jzbHwSkelettFigur(c, ex + Math.sin((t - 5.5) * 1.6) * 6 * k, yb, sc, T, 1); // tanzt
    if (Math.sin(t * 4) > 0) { c.save(); c.font = `800 ${8 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.7)"; c.strokeText("Klapper!", ex, yb - 36 * k); c.fillStyle = "#f1efe6"; c.fillText("Klapper!", ex, yb - 36 * k); c.restore(); } }
  else if (t < 15) { const p = Math.min(1, (t - 12) / 1), sink = Math.max(0, (t - 13) / 2); c.globalAlpha *= 1 - sink * .9; // zerfällt zu einem Knochenhaufen und versinkt
    c.strokeStyle = "#f1efe6"; c.lineCap = "round"; c.lineWidth = 1.4 * k; const by = yb - 2 * k + sink * 4 * k;
    for (let i = 0; i < 6; i++) { const r = (i * 1.3) % 3.1, x0 = ex + (i - 2.5) * 3 * k * p; c.beginPath(); c.moveTo(x0 - Math.cos(r) * 3 * k, by - (1 - p) * (20 - i * 3) * k - Math.sin(r) * 1.5 * k); c.lineTo(x0 + Math.cos(r) * 3 * k, by - (1 - p) * (20 - i * 3) * k + Math.sin(r) * 1.5 * k); c.stroke(); }
    c.fillStyle = "#f1efe6"; c.beginPath(); c.arc(ex + 4 * k * p, by - 2 * k - (1 - p) * 22 * k, 3 * k, 0, 7); c.fill(); }
  c.restore();
}
function jzbHwKatzeMalen(c, C) {
  const J = JZB, k = J.k, T = J.T, yb = J.h - 1, f = C.fauch > 0, sc = 1.1 * k, sp = f ? 0 : C.t * 10;
  c.save(); c.translate(C.x, yb); c.scale(sc, sc); c.lineCap = "round"; c.strokeStyle = "#111"; c.fillStyle = "#111";
  const buckel = f ? 1 : 0, sw = Math.sin(T * 3) * .25;
  c.lineWidth = 1.5; for (const [x, ph] of [[-5, 0], [-3.5, Math.PI], [4, Math.PI], [5.5, 0]]) { const s = Math.sin(sp + ph) * 1.6; c.beginPath(); c.moveTo(x, -5 - buckel * 2); c.lineTo(x + s, 0); c.stroke(); } // Beine
  c.beginPath(); c.moveTo(-7, -5 - buckel * 2); c.quadraticCurveTo(0, -11 - buckel * 7, 7, -5 - buckel * 2); c.quadraticCurveTo(0, -3 - buckel * 2, -7, -5 - buckel * 2); c.fill(); // Körper (Buckel beim Fauchen)
  c.lineWidth = f ? 2.6 : 1.6; c.beginPath(); c.moveTo(-6.5, -7 - buckel * 2); f ? c.lineTo(-8, -19) : c.quadraticCurveTo(-12, -9 + sw * 6, -10 + sw * 4, -16); c.stroke(); // Schwanz (gesträubt beim Fauchen)
  c.beginPath(); c.arc(8.4, -9 - buckel * 2, 3.2, 0, 7); c.fill(); // Kopf
  for (const dx of [6.6, 9.8]) { c.beginPath(); c.moveTo(dx - 1.2, -11.2 - buckel * 2); c.lineTo(dx, -14.2 - buckel * 2); c.lineTo(dx + 1.2, -11.2 - buckel * 2); c.fill(); } // Ohren
  c.fillStyle = "#ffe14d"; c.shadowColor = "#ffe14d"; c.shadowBlur = 4; c.beginPath(); c.ellipse(9.6, -9.6 - buckel * 2, .9, f ? 1.1 : .6, 0, 0, 7); c.fill(); c.shadowBlur = 0; // leuchtendes Auge
  if (f) { c.fillStyle = "#e01e37"; c.beginPath(); c.arc(10.8, -7.6 - buckel * 2, .8, 0, 7); c.fill(); }
  c.restore();
  if (f) { c.save(); c.font = `800 ${9 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.75)"; c.strokeText("Fauch!", C.x + 8 * k, yb - 28 * k); c.fillStyle = "#ffe14d"; c.fillText("Fauch!", C.x + 8 * k, yb - 28 * k); c.restore(); }
}
function jzbHwKindMalen(c, art, x, yb, sc, t) { // verkleidetes Kind, läuft nach links
  c.save(); c.translate(x, yb); c.scale(-sc, sc); c.lineCap = "round"; const s = Math.sin(t * 9) * 1.8;
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-1, -6); c.lineTo(-1 + s, 0); c.moveTo(1, -6); c.lineTo(1 - s, 0); c.stroke(); // Beine
  if (art === 0) { c.fillStyle = "#f6f6fb"; c.beginPath(); c.moveTo(-5, -4); c.lineTo(-4.4, -15); c.arc(0, -15, 4.4, Math.PI, 0); c.lineTo(5, -4); for (let i = 0; i < 4; i++) c.lineTo(5 - (i + 1) * 2.5, -4 + (i % 2 ? 0 : 1.4)); c.closePath(); c.fill(); // Gespenst
    c.fillStyle = "#1a1a2a"; c.beginPath(); c.ellipse(1.2, -15.5, .7, 1.1, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(3.4, -15.5, .7, 1.1, 0, 0, 7); c.fill(); }
  else if (art === 1) { c.fillStyle = "#ff8c1a"; c.beginPath(); c.ellipse(0, -10, 5.5, 5, 0, 0, 7); c.fill(); // Kürbis
    c.fillStyle = "#3b1a06"; c.beginPath(); c.moveTo(1, -12); c.lineTo(2.2, -10.5); c.lineTo(3.4, -12); c.closePath(); c.fill(); c.fillRect(.6, -8.6, 3.6, .9);
    c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(0, -17.2, 2.8, 0, 7); c.fill(); c.fillStyle = "#4e6b2a"; c.fillRect(-.6, -21.5, 1.2, 2.2); }
  else { c.fillStyle = "#7b2cbf"; c.beginPath(); c.moveTo(-4.5, -5); c.lineTo(4.5, -5); c.lineTo(1.8, -14); c.lineTo(-1.8, -14); c.closePath(); c.fill(); // kleine Hexe
    c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(0, -16.5, 2.7, 0, 7); c.fill(); c.fillStyle = "#1d1028"; c.beginPath(); c.ellipse(0, -18.6, 4.2, .9, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-2.2, -18.8); c.lineTo(2.4, -18.8); c.lineTo(-1.5, -25); c.closePath(); c.fill(); }
  c.restore();
}
function jzbHwKinderMalen(c, K) {
  const J = JZB, k = J.k, T = J.T, yb = J.h - 1, sc = 1.05 * k;
  [0, 1, 2].forEach((art, i) => { const x = K.x + i * 20 * k, hop = Math.abs(Math.sin(K.t * 9 + i)) * .8 * k; jzbHwKindMalen(c, art, x, yb - hop, sc, K.t + i);
    if (i === 0) { const lx = x - 6 * k, ly = yb - 14 * k; c.strokeStyle = "#5a3a20"; c.lineWidth = .9; c.beginPath(); c.moveTo(x - 2 * k, yb - 9 * k); c.lineTo(lx, ly); c.stroke(); // Laterne
      const fl = .8 + .2 * Math.sin(T * 12); const g = c.createRadialGradient(lx, ly + 2.5 * k, .5, lx, ly + 2.5 * k, 8 * k); g.addColorStop(0, `rgba(255,200,80,${.5 * fl})`); g.addColorStop(1, "rgba(255,160,40,0)"); c.fillStyle = g; c.beginPath(); c.arc(lx, ly + 2.5 * k, 8 * k, 0, 7); c.fill();
      c.fillStyle = "#ff9f1c"; c.beginPath(); c.arc(lx, ly + 2.5 * k, 2.2 * k, 0, 7); c.fill(); }
    if (i === 1) { c.fillStyle = "#ff7a00"; c.beginPath(); c.ellipse(x - 6 * k, yb - 7 * k, 2.8 * k, 2.4 * k, 0, 0, 7); c.fill(); c.strokeStyle = "#333"; c.lineWidth = .7; c.beginPath(); c.arc(x - 6 * k, yb - 9 * k, 2.6 * k, Math.PI, 0); c.stroke(); } }); // Eimer
  const mitte = K.x + 20 * k; if (mitte > J.w * .15 && mitte < J.w * .85) { const name = jzbEisNameText(), txt = name ? `Süßes oder Saures, ${name}!` : "Süßes oder Saures!";
    c.save(); c.font = `800 ${9.5 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "center"; c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.75)"; c.strokeText(txt, mitte, yb - 34 * k); c.fillStyle = "#ffd23f"; c.fillText(txt, mitte, yb - 34 * k); c.restore(); }
}
function jzbHwMalenHinten(c, F) {
  const J = JZB, k = J.k, H = F.hw; if (!H) return;
  c.fillStyle = "rgba(40,34,58,.78)"; for (const w of H.wolken) for (const [dx, dy, f] of [[0, 0, 1], [w.r * .9, w.r * .25, .8], [-w.r * .9, w.r * .25, .75], [w.r * 1.7, w.r * .4, .55]]) { c.beginPath(); c.arc(w.x + dx, w.y + dy, w.r * f, 0, 7); c.fill(); } // Gewitterwolken
  jzbHwKesselMalen(c, F, H); jzbHwGrabMalen(c, F, H); // 2.436.0
  jzbHwSargMalen(c, F, true);
  const V = H.vamp, sx = jzbHwSargX(), yb = J.h - 1, sc = 1.4 * k;
  if (V && V.t > 1.2) { const t = V.t, rand = yb - 3.5 * k, boden = yb - 9.6 * sc; // Hüfte tief im Sarg: beim Sitzen schauen nur Oberkörper und Kopf heraus
    let x = sx + 6 * k, y = rand, rot = 0, schritt = 0, umhang = 0, sichtbar = true;
    if (t < 3) rot = -Math.PI / 2 * (1 - jzbEase((t - 1.2) / 1.8)); // richtet sich auf
    else if (t < 6) { /* sitzt und grüßt */ }
    else if (t < 7.6) { const p = jzbEase((t - 6) / 1.6); x = sx + 6 * k + 26 * k * p; y = rand + (boden - rand) * p - Math.sin(Math.PI * p) * 10 * k; } // steht auf und steigt heraus
    else { x = sx + 32 * k + (t - 7.6) * 16 * k; y = boden; schritt = (t - 7.6) * 7; umhang = Math.sin(t * 5) * 1.6 + 1.5; sichtbar = x < J.w + 30 * k; }
    if (sichtbar) jzbHwVampirMalen(c, x, y, rot, sc, schritt, umhang);
    if (t > 3.3 && t < 5.9) { const name = jzbEisNameText(), txt = name ? `Guten Abend, ${name}!` : "Guten Abend!"; c.save(); c.font = `800 ${10 * k}px "Trebuchet MS",sans-serif`; c.textAlign = "left"; c.textBaseline = "middle";
      c.lineWidth = 3; c.strokeStyle = "rgba(20,10,30,.75)"; c.strokeText(txt, x + 8 * k, y - 24 * k); c.fillStyle = "#ffd6dc"; c.fillText(txt, x + 8 * k, y - 24 * k); c.restore(); }
  }
  jzbHwSargMalen(c, F, false);
}
function jzbHwMalenVorn(c, F) {
  const J = JZB, k = J.k, T = J.T, H = F.hw; if (!H) return;
  if (H.katze) jzbHwKatzeMalen(c, H.katze); if (H.kinder) jzbHwKinderMalen(c, H.kinder); // 2.436.0
  for (const g of H.geister) { const gx = g.x, gy = g.y0 + Math.sin(g.ph * 2) * 5 * k, s = 11 * k * g.s; // kleine Geister
    c.save(); c.globalAlpha *= .8; c.fillStyle = "rgba(245,245,255,.9)"; c.beginPath(); c.moveTo(gx - s * .7, gy + s * .9); c.lineTo(gx - s * .7, gy - s * .1); c.arc(gx, gy - s * .1, s * .7, Math.PI, 0); c.lineTo(gx + s * .7, gy + s * .9);
    for (let i = 0; i < 4; i++) { const x0 = gx + s * .7 - (i + .5) * s * .35; c.quadraticCurveTo(x0, gy + s * (i % 2 ? .65 : 1.15) + Math.sin(T * 6 + i + g.ph) * 1.5, gx + s * .7 - (i + 1) * s * .35, gy + s * .9); } c.fill();
    c.fillStyle = "#1a1a2a"; for (const d of [-.25, .25]) { c.beginPath(); c.ellipse(gx + d * s + g.dir * s * .1, gy - s * .25, s * .09, s * .14, 0, 0, 7); c.fill(); } c.beginPath(); c.ellipse(gx + g.dir * s * .1, gy + s * .1, s * .1, s * .14, 0, 0, 7); c.fill(); c.restore(); }
  if (H.hexe) jzbHwHexeMalen(c, H.hexe);
  const B = H.blitz;
  if (B) { const t = B.t, a = t < .08 ? .5 : t < .14 ? .08 : t < .22 ? .4 : Math.max(0, .4 * (1 - (t - .22) / .3));
    c.fillStyle = `rgba(225,232,255,${a})`; c.fillRect(0, 0, J.w, J.h); // Lichtschein
    if (t < .3 || (t > .14 && t < .4)) { for (const [w, f] of [[5 * k, "rgba(190,210,255,.35)"], [1.6 * k, "rgba(255,255,255,.95)"]]) { c.strokeStyle = f; c.lineWidth = w; c.lineJoin = "miter";
      for (const p of [B.pfad, B.zweig]) { c.beginPath(); p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); } } }
  }
  if (H.knall > 0) { c.fillStyle = `rgba(200,130,255,${.45 * H.knall})`; c.fillRect(0, 0, J.w, J.h); } // Zauberblitz am Schluss
}
// ---------- KC-CLUB-JAHRESZEIT-EXTRAS (2.249.0, Wunsch Hansi „baue noch die weiteren Ideen“): Besonderes auf der Kopf-Bühne ----------
// 🥾 Nikolaus (6.12.): ein gefüllter Stiefel steht unten. ☔ Regen – nur wenn die Wetterdaten frisch sind und es wirklich regnet (Regel 11:
// kein Regen aus alten Daten, kein zusätzlicher Wetter-Abruf): Tropfen, Pfützen mit Ringen, ab und zu läuft ein gelber Schirm vorbei.
// 🍲 Heute ist Treffen: ein dampfender Kochtopf (bis 5 Std. nach Beginn). 🥚 Ostern (Karfreitag bis Ostermontag): bunte Eier im Gras –
// antippen, dann schlüpft ein Küken. 🦔 Herbst: ab und zu raschelt ein Igel durchs Laub. Vorschau je Extra unter ⚙️ → ✨ Effekte.
// KC-CLUB-RC-PRUEFUNG (20.10.2026): JZB_EXTRAS entfernt – nirgends benutzt
function jzbExtrasBestimmen() {
  const J = JZB, heute = heuteIso(), x = { igel: J.saison === "herbst" };
  x.nikolaus = heute.slice(5) === "12-06" && J.saison === "winter";
  const kf = Object.entries(feiertageNRW(+heute.slice(0, 4))).find(([, n]) => n === "Karfreitag")?.[0];
  x.ostern = !!kf && heute >= kf && heute <= tagPlus(kf, 3) && J.saison === "fruehling";
  const tr = INIT?.naechstesTreffen, beginn = tr ? new Date(tr.beginn) : null;
  x.topf = !!beginn && isoBerlin(beginn) === heute && Date.now() < +beginn + 5 * 3600000;
  const r = WET.r, j = r?.daten?.jetzt;
  x.regen = !!j && !!r.stand && Date.now() - new Date(r.stand) <= WETTER_VERALTET_MIN * 60000 && ["regen", "niesel", "gewitter"].includes(wetterArt(j.code).szene);
  if (J.extra) x[J.extra] = true;
  const te = !J.vorschau && themaWert("extra"); if (te === "ostern" && J.saison === "fruehling") x.ostern = true; // 2.332.0: Thema 🐣 Ostern – Eier die ganze Zeit
  J.ext = x;
  if (x.ostern && !J.eier?.length) jzbEierVerstecken();
  if (x.igel && J.igelUhr === undefined) J.igelUhr = J.extra === "igel" ? 4 : jzbZ(25, 60);
}
function jzbEierVerstecken() { // 2.332.0 (Wunsch Hansi „Thema Ostern“): der Osterhase hoppelt mit dem Korb herein und legt die Eier
  const J = JZB, n = 5, farben = [["#e63946", "#ffd166"], ["#4cc9f0", "#ffffff"], ["#b5179e", "#f9c6d6"], ["#ffb703", "#2a9d8f"], ["#80b918", "#ffffff"], ["#7b2cbf", "#ffd166"]];
  J.eier = Array.from({ length: n }, (_, i) => ({ x: JZB_RAND + 14 + (i + jzbZ(.2, .8)) * (J.w - 2 * JZB_RAND - 28) / n, f: farben[(i + J.lauf) % farben.length], kipp: jzbZ(-.35, .35), muster: i % 3, gef: false, t: 0 }));
  if (!J.gaeste.some((g) => g.typ === "osterhase")) { for (const e of J.eier) e.da = false; J.gaeste.push({ typ: "osterhase", x: J.w + 24, t: 0 }); }
}
function jzbEiAntippen(e) { // Ostereier finden: Tippen auf den Kopf (nicht auf Knöpfe) prüft, ob ein Ei getroffen wurde
  const J = JZB; if (!J.ext?.ostern || !J.eier?.length || !J.cv || e.target.closest("button, a, input, select, textarea, [onclick], [role=button]")) return;
  const r = J.s.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, k = J.k;
  const ei = J.eier.find((v) => !v.gef && v.da !== false && Math.hypot(x - v.x, y - (J.h - 7 * k)) < 18); if (!ei) return;
  ei.gef = true; ei.t = 0;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; J.fx.push({ typ: "funke", x: ei.x + Math.cos(a) * 6, y: J.h - 10 * k + Math.sin(a) * 6, vx: Math.cos(a) * 45, vy: Math.sin(a) * 45 - 20, s: jzbZ(2, 3.4), a: 1, farbe: i % 2 ? ei.f[0] : "#fff6c2" }); }
  const rest = J.eier.filter((v) => !v.gef).length;
  melde(rest ? `🥚 Ei gefunden! Noch ${rest} versteckt.` : "🐣 Alle Ostereier gefunden – frohe Ostern!");
}
// ---------- KC-CLUB-WINTER-KINDER (2.282.0, Wunsch Hansi): Eistropfen bilden unten eine Pfütze · zwei Kinder auf dem Schlitten
// (Bommelmützen, Schals wehen nach hinten; abwechselnd von links und von rechts) · ein paar Kinder machen eine Schneeballschlacht ----------
// Nur Winter und nur, wenn Schnee liegt; Schlitten und Schneeballschlacht wechseln sich ab, nie beides zugleich.
// Jacke, Mütze, Schal – 2.283.0 (Wunsch Hansi „Mütze und Schal verschiedenfarbig, z. B. grüner Schal und gelbe Mütze – jedes Kind anders“):
// kräftige, gut unterscheidbare Kombinationen; in einer Gruppe trägt nie ein Kind dieselben Farben wie ein anderes
const JZB_KIND_FARBEN = [["#2f6fd6", "#ffd21f", "#1f9d4c"], ["#d83a3a", "#1fb5d6", "#ff8c1a"], ["#1f9d4c", "#ff4fa3", "#ffd21f"], ["#7a3fb5", "#ff8c1a", "#29c46a"],
  ["#f2c230", "#d83a3a", "#2f6fd6"], ["#e8732a", "#7a3fb5", "#38d1c0"], ["#2a9d8f", "#ffffff", "#e63946"], ["#5b4cc4", "#9be564", "#ff5c8a"]];
const jzbKindFarben = (n) => { const l = JZB_KIND_FARBEN.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l.slice(0, n); };
const jzbSchneeMittel = () => { const J = JZB, B = J.boden, a = Math.ceil(JZB_RAND / JZB_SP), e = Math.floor((J.w - JZB_RAND) / JZB_SP), t = B.slice(a, e); return t.reduce((s, v) => s + v, 0) / Math.max(1, t.length); };
const jzbGrund = (x) => JZB.h - jzbBodenH(x) - 1;
// 💧 Eistropfen aus der Leiste: fällt auf den Boden, dort wächst langsam eine Pfütze (und trocknet sehr langsam wieder)
function jzbEisTropfen(sx, sy) {
  const J = JZB; if (!J.cv || J.saison !== "winter") return false;
  const r = J.cv.getBoundingClientRect(); if (!r.width) return false;
  (J.eisTropfen = J.eisTropfen || []).push({ x: (sx - r.left) * J.w / r.width, y: (sy - r.top) * J.h / r.height, v: 0, s: 2.4 * J.k, spur: 0 });
  return true;
}
// ❄️ 2.319.0 KC-CLUB-EISNAME (Wunsch Hansi „ab und an fällt vom größeren Eiszapfen etwas taumelnd herunter – unten wird daraus der erste
// Buchstabe des angemeldeten Users aus Glitzer-Eis, und immer so weiter, bis der ganze Name fertig ist; bei der Sonne vom Schneemann schmilzt der Name“).
// Nur im Winter auf der Bühne, der Name bleibt nur auf diesem Gerät (nichts geht an den Server). Höchstens ein Stück gleichzeitig.
const jzbEisNameText = () => String(ICH?.vorname || String(ICH?.name || "").split(" ")[0] || "").trim().slice(0, 12);
function jzbEisNameWill() {
  const J = JZB, txt = jzbEisNameText(); if (!J.cv || J.saison !== "winter" || !txt || J.eisStueck || J.sonne || J.raupe) return false;
  const N = J.eisName; if (N && (N.schmelz > 0 || N.n >= [...N.text].length)) return false;
  if (!J.eisErster) return (J.eisErster = true); // 2.322.0: das erste Stück gleich beim ersten Mal – man soll es auch sehen
  return Math.random() < (J.vorschau ? .7 : .5); // „ab und an“ – etwa jedes zweite Mal statt eines Tropfens
}
function jzbEisStueck(sx, sy) {
  const J = JZB; if (!J.cv || J.saison !== "winter") return false;
  const r = J.cv.getBoundingClientRect(); if (!r.width) return false;
  if (!J.eisName || J.eisName.text !== jzbEisNameText()) J.eisName = { text: jzbEisNameText(), n: 0, gelandet: [], schmelz: 0, weg: [], fertig: null };
  const x = (sx - r.left) * J.w / r.width, y = (sy - r.top) * J.h / r.height;
  J.eisStueck = { x0: x, x, y, y0: y, v: 0, t: 0, rot: 0, vr: jzbZ(3, 6) * (Math.random() < .5 ? -1 : 1), ph: jzbZ(0, 6) };
  return true;
}
function jzbEisNameLage() { // Mitte jedes Buchstabens (zentriert), Schriftgröße passend zur Bühne
  const J = JZB, N = J.eisName, c = J.ctx, fs = Math.round(Math.min(20 * J.k, J.h * .32)), z = [...N.text];
  c.save(); c.font = `800 ${fs}px "Segoe UI", Roboto, Arial, sans-serif`; const b = z.map((ch) => c.measureText(ch).width + 1.5 * J.k); c.restore();
  const ges = b.reduce((a, v) => a + v, 0); let x = Math.max(JZB_RAND, (J.w - ges) / 2);
  const pos = b.map((w) => { const m = x + w / 2; x += w; return m; });
  return { fs, z, pos, y: pos.reduce((a, v) => a + jzbGrund(v), 0) / Math.max(1, pos.length) + 1 }; // gemeinsame Grundlinie (Mittel der Schneehöhe) – steht im Schnee
}
function jzbEisNameSchritt(dt) {
  if (JZB.saison !== "winter") { JZB.eisName = null; JZB.eisStueck = null; return; } // 2.356.0: nie neben dem Herbst-Namen stehen bleiben
  const J = JZB, N = J.eisName, S = J.eisStueck, k = J.k;
  if (S && N) {
    const L = jzbEisNameLage(), zx = L.pos[Math.min(N.n, L.pos.length - 1)], boden = L.y - L.fs * .45;
    S.t += dt; S.v = Math.min(95 * k, S.v + 140 * k * dt); S.y += S.v * dt; // langsamer als ein Tropfen: es taumelt
    const p = Math.min(1, (S.y - S.y0) / Math.max(1, boden - S.y0));
    S.x = S.x0 + (zx - S.x0) * jzbEase(p) + Math.sin(S.t * 5 + S.ph) * 7 * k * (1 - p); S.rot += (S.vr + Math.sin(S.t * 3) * 4) * dt;
    if (S.y >= boden) { // gelandet → der nächste Buchstabe entsteht mit Glitzer
      J.eisStueck = null; N.gelandet[N.n] = J.T; N.n++; if (N.n >= [...N.text].length) N.fertig = J.T;
      for (let i = 0; i < 10; i++) J.fx.push({ typ: "flocke", x: zx, y: boden, r: jzbZ(.6, 1.6), vx: jzbZ(-45, 45), vy: -jzbZ(20, 70), a: 1, blass: 1.6 });
    }
  }
  // 2.356.0 KC-CLUB-NAME-WEG (Wunsch Hansi „der Name soll weg sein, wenn die Schneeraupe ihn wegschiebt – dann zerspringt er in Stücke“):
  // das Schild der Raupe erreicht einen Buchstaben → er zerspringt in Eis-Scherben; sind alle weg, beginnt der Name später von vorn
  if (N && N.n && J.raupe) {
    const R = J.raupe, vorn = R.x + R.dir * 36 * k, L = jzbEisNameLage(); N.weg = N.weg || [];
    for (let i = 0; i < N.n; i++) {
      if (N.weg[i] || (R.dir > 0 ? vorn < L.pos[i] - L.fs * .3 : vorn > L.pos[i] + L.fs * .3)) continue;
      N.weg[i] = true;
      for (let q = 0; q < 16; q++) J.fx.push({ typ: "scherbe", x: L.pos[i] + jzbZ(-.35, .35) * L.fs, y: L.y - jzbZ(.1, .9) * L.fs, s: jzbZ(1.6, 3.6) * k, rot: jzbZ(0, 6.3), vr: jzbZ(-14, 14),
        vx: R.dir * jzbZ(40, 170) + jzbZ(-40, 40), vy: -jzbZ(60, 190), a: 1 });
      for (let q = 0; q < 8; q++) J.fx.push({ typ: "flocke", x: L.pos[i], y: L.y - L.fs * .3, r: jzbZ(.6, 1.6), vx: jzbZ(-60, 60), vy: -jzbZ(30, 90), a: 1, blass: 1.6 });
    }
    if (N.weg.filter(Boolean).length >= N.n) { J.eisName = null; J.eisStueck = null; }
  }
}
function jzbEisNameMalen(c) {
  const J = JZB, N = J.eisName, S = J.eisStueck, k = J.k; if (!N || J.saison !== "winter") return;
  if (N.n) {
    const L = jzbEisNameLage(), m = N.schmelz || 0;
    c.save(); c.font = `800 ${L.fs}px "Segoe UI", Roboto, Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.lineJoin = "round";
    for (let i = 0; i < N.n; i++) {
      if (N.weg?.[i]) continue; // 2.356.0: von der Raupe zersprungen
      const x = L.pos[i], y = L.y, neu = Math.min(1, (J.T - (N.gelandet[i] ?? -9)) / .35), sc = (.4 + .6 * jzbEase(neu)) * (1 + (neu < 1 ? .15 * Math.sin(neu * Math.PI) : 0));
      c.save(); c.translate(x, y); c.scale(sc * (1 + m * .35), sc * (1 - m * .85)); c.globalAlpha = 1 - m * .55;
      const g = c.createLinearGradient(0, -L.fs, 0, 0); g.addColorStop(0, "#ffffff"); g.addColorStop(.45, "#d9f1ff"); g.addColorStop(1, "#86c8f4");
      c.strokeStyle = "rgba(40,110,180,.75)"; c.lineWidth = 2 * k; c.strokeText(L.z[i], 0, 0);
      c.fillStyle = g; c.fillText(L.z[i], 0, 0);
      c.restore();
      if (m < .6) for (let f = 0; f < 2; f++) { // Glitzer: kleine funkelnde Sterne auf dem Eis
        const a = Math.max(0, Math.sin(J.T * 3.2 + i * 2.3 + f * 1.7)), sx = x + (f ? .22 : -.18) * L.fs, sy = y - (f ? .62 : .3) * L.fs, l = (1.2 + a * 2.2) * k;
        if (a < .15) continue; c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = .9 * k;
        c.beginPath(); c.moveTo(sx - l, sy); c.lineTo(sx + l, sy); c.moveTo(sx, sy - l); c.lineTo(sx, sy + l); c.stroke();
      }
    }
    c.restore();
  }
  if (S) { // das fallende, taumelnde Eisstück
    c.save(); c.translate(S.x, S.y); c.rotate(S.rot); c.scale(1.6 * k, 1.6 * k); // 2.322.0: größer, damit man es fallen sieht
    c.fillStyle = "#e6f6ff"; c.strokeStyle = "rgba(60,140,210,.9)"; c.lineWidth = .9;
    c.beginPath(); c.moveTo(0, -5); c.lineTo(3.2, -1); c.lineTo(2, 4); c.lineTo(-1.2, 5); c.lineTo(-3.2, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "rgba(255,255,255,.95)"; c.beginPath(); c.arc(-.8, -1.6, 1, 0, 7); c.fill();
    c.restore();
  }
}
// ---------- 2.320.0 KC-CLUB-WINTER-IGLU + KC-CLUB-WINTER-HUSKY (Wunsch Hansi): ab und an fährt ein Hundeschlitten mit Huskies vorbei.
// Abwechselnd mit dem Schneemann baut ein Eskimo Block für Block ein Iglu und geht hinein; dann kommt der Schlittenmann mit seinen Huskies
// heim – er wohnt dort – und geht auch hinein (Licht im Eingang). Kommt die Sonne, kommen beide heraus, fahren mit dem Gespann davon,
// und das Iglu schmilzt (wie der Schneemann und der Eis-Name). Nur Winter, nur auf der Bühne, nichts geht an den Server. ----------
const JZB_IGLU_R = 25, JZB_HUND_ABST = 15, JZB_HUNDE = 4;
function jzbIgluStart() {
  const J = JZB, k = J.k, links = Math.floor(J.lauf / 6) % 2 === 0, R = JZB_IGLU_R * k;
  const x = links ? JZB_RAND + R + 6 : J.w - JZB_RAND - R - 6, blick = links ? 1 : -1;
  J.iglu = { x, blick, R, eingang: x + blick * (R + 6 * k), drin: 0, licht: 0,
    bauer: { x: x + blick * (R + 14 * k), dir: -blick, geht: 0, sichtbar: true, farbe: ["#b5651d", "#e8d9b5"] } };
  jzbPhase("bauen");
}
function jzbHuskyStart(iglu) { // Gespann fährt quer durchs Bild – beim Iglu hält es an
  const J = JZB, k = J.k, I = J.iglu, dir = iglu && I ? -I.blick : (J.huskyDir = J.huskyDir === 1 ? -1 : 1);
  const vorne = (22 + (JZB_HUNDE - 1) * JZB_HUND_ABST + 8) * k; // Hunde liegen vor dem Schlitten
  J.husky = { dir, x: dir > 0 ? -vorne - 30 * k : J.w + vorne + 30 * k, v: 92 * k, t: 0, halt: iglu && I ? I.eingang - I.blick * 0 + (-dir) * (vorne + 6 * k) : null, steht: false,
    fahrer: { sichtbar: true, x: 0, geht: 0 }, gast: false, f: ["#2f6fd6", "#e8d9b5"] };
}
function jzbIgluSchritt(dt) {
  const J = JZB, I = J.iglu, k = J.k; if (!I) return;
  const B = I.bauer, ph = J.phase, t = J.pt, H = J.husky;
  const gehe = (p, ziel, v) => { const d = ziel - p.x; if (Math.abs(d) < 1) { p.x = ziel; p.geht = 0; return true; } p.dir = Math.sign(d); p.x += Math.sign(d) * Math.min(Math.abs(d), v * dt); p.geht += dt; return false; };
  if (ph === "stehen") {
    if (B.sichtbar && t > 1 && gehe(B, I.eingang, 34 * k)) { B.sichtbar = false; I.drin++; } // Eskimo geht ins Iglu
    if (!H && t > 5) jzbHuskyStart(true); // der Schlittenmann kommt heim
    if (H && H.steht && H.fahrer.sichtbar && (H.steht += dt) > .8 && gehe(H.fahrer, I.eingang, 34 * k)) { H.fahrer.sichtbar = false; I.drin++; }
  } else if (ph === "schmelzen") {
    if (t > .4 && I.drin) { I.drin = 0; B.sichtbar = true; B.x = I.eingang; if (H) { H.fahrer.sichtbar = true; H.fahrer.x = I.eingang; } } // die Sonne lockt beide heraus
    if (H && H.steht && !I.drin) {
      const ok1 = !B.sichtbar || gehe(B, H.x, 34 * k), ok2 = gehe(H.fahrer, H.x, 34 * k);
      if (ok1 && B.sichtbar) { B.sichtbar = false; H.gast = true; } // setzt sich in den Schlitten
      if (ok2 && !B.sichtbar && t > 1.5) { H.steht = false; H.halt = null; H.dir = I.blick; H.t = 0; } // und los – vom schmelzenden Iglu weg
    }
  }
  I.licht += ((I.drin ? 1 : 0) - I.licht) * Math.min(1, dt * 2);
}
function jzbHuskySchritt(dt) {
  const J = JZB, H = J.husky, k = J.k; if (!H) return;
  H.t += dt;
  if (H.halt !== null && !H.steht) { // abbremsen bis zum Halt
    const d = (H.halt - H.x) * H.dir; if (d <= 0) { H.x = H.halt; H.steht = .001; H.fahrer.x = H.x - H.dir * 11 * k; H.fahrer.dir = H.dir; } else H.x += H.dir * Math.min(d, Math.max(18 * k, Math.min(H.v, d * 1.6)) * dt);
  } else if (!H.steht) H.x += H.dir * H.v * dt;
  if (!H.steht && Math.random() < dt * 10) J.fx.push({ typ: "flocke", x: H.x - H.dir * 6 * k, y: jzbGrund(H.x) - 1, r: jzbZ(.7, 1.6), vx: -H.dir * jzbZ(15, 45), vy: -jzbZ(15, 40), a: 1, blass: 1.3 }); // Schneestaub
  const vorne = (22 + (JZB_HUNDE - 1) * JZB_HUND_ABST + 8) * k;
  if (!H.steht && (H.x < -vorne - 40 * k || H.x > J.w + vorne + 40 * k) && H.t > 1) { J.husky = null; J.kinderUhr = jzbZ(40, 80); }
}
function jzbFigurMalen(c, x, gy, dir, geht, f, k, arm) { // Eskimo / Schlittenmann im Pelz-Anorak mit Kapuze
  const s = Math.sin(geht * 12) * (geht ? 2.2 : 0) * k;
  c.save(); c.lineCap = "round";
  c.strokeStyle = "#3b2a1e"; c.lineWidth = 3 * k; // Stiefel
  c.beginPath(); c.moveTo(x - 2 * k, gy - 7 * k); c.lineTo(x - 2 * k + s, gy - 1); c.moveTo(x + 2 * k, gy - 7 * k); c.lineTo(x + 2 * k - s, gy - 1); c.stroke();
  c.fillStyle = f[0]; c.beginPath(); c.moveTo(x - 6 * k, gy - 6 * k); c.quadraticCurveTo(x - 6.5 * k, gy - 19 * k, x, gy - 20 * k); c.quadraticCurveTo(x + 6.5 * k, gy - 19 * k, x + 6 * k, gy - 6 * k); c.closePath(); c.fill(); // Anorak
  c.fillStyle = f[1]; c.fillRect(x - 6.2 * k, gy - 7.6 * k, 12.4 * k, 2.2 * k); // Pelzsaum
  const ax = x + dir * 5 * k, ay = gy - 15 * k, aw = arm ?? .9; c.strokeStyle = f[0]; c.lineWidth = 2.8 * k; // Arm
  c.beginPath(); c.moveTo(x + dir * 3 * k, ay); c.lineTo(ax + dir * Math.cos(aw) * 5 * k, ay + Math.sin(aw) * 5 * k); c.stroke();
  c.fillStyle = f[1]; c.beginPath(); c.arc(x, gy - 23 * k, 5.6 * k, 0, 7); c.fill(); // Kapuze mit Pelz
  c.fillStyle = "#e0a878"; c.beginPath(); c.arc(x + dir * .6 * k, gy - 23 * k, 3.6 * k, 0, 7); c.fill(); // Gesicht
  c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(x + dir * 1.8 * k, gy - 23.6 * k, .55 * k, 0, 7); c.fill(); c.beginPath(); c.arc(x - dir * .4 * k, gy - 23.6 * k, .55 * k, 0, 7); c.fill();
  c.strokeStyle = "#8a3b2b"; c.lineWidth = .7 * k; c.beginPath(); c.arc(x + dir * .7 * k, gy - 22.4 * k, 1.2 * k, .2, Math.PI - .2); c.stroke(); // Lächeln
  c.restore();
}
function jzbHundMalen(c, x, gy, dir, lauf, k, liegt) { // Husky von der Seite: grau mit weißem Bauch, Spitzohren, Ringelschwanz
  c.save(); c.translate(x, gy); c.scale(dir * k, k); c.lineCap = "round";
  const p = lauf * 14, b = liegt ? 0 : Math.sin(p) * 1.2;
  if (!liegt) { c.strokeStyle = "#5d6670"; c.lineWidth = 1.8; for (const [lx, o] of [[-4.5, 0], [-3, Math.PI], [3.5, Math.PI], [5, 0]]) { const w = Math.sin(p + o) * 2.6; c.beginPath(); c.moveTo(lx, -5 + b); c.lineTo(lx + w, -.5); c.stroke(); } }
  const y = liegt ? -2.6 : -6.5 + b;
  c.strokeStyle = "#5d6670"; c.lineWidth = 1.8; c.beginPath(); c.arc(-7.5, y - 2.5, 2.6, Math.PI * .4, Math.PI * 1.7 + (liegt ? Math.sin(JZB.T * 9) * .3 : 0)); c.stroke(); // Ringelschwanz
  c.fillStyle = "#7f8a95"; c.beginPath(); c.ellipse(0, y, 7.5, 3.6, 0, 0, 7); c.fill();
  c.fillStyle = "#f2f4f6"; c.beginPath(); c.ellipse(.5, y + 1.6, 5.2, 1.8, 0, 0, 7); c.fill();
  const hx = 7.2, hy = y - (liegt ? 1.5 : 3.2); c.fillStyle = "#7f8a95"; c.beginPath(); c.arc(hx, hy, 3, 0, 7); c.fill(); // Kopf
  c.beginPath(); c.moveTo(hx - 2, hy - 2); c.lineTo(hx - 1.2, hy - 5.4); c.lineTo(hx + .2, hy - 2.4); c.moveTo(hx + .4, hy - 2.4); c.lineTo(hx + 1.6, hy - 5.4); c.lineTo(hx + 2.4, hy - 1.8); c.fill(); // Ohren
  c.fillStyle = "#f2f4f6"; c.beginPath(); c.ellipse(hx + 2.2, hy + 1, 2.2, 1.4, 0, 0, 7); c.fill(); // Schnauze hell
  c.fillStyle = "#222"; c.beginPath(); c.arc(hx + 4.2, hy + .6, .7, 0, 7); c.fill(); c.beginPath(); c.arc(hx + 1, hy - .6, .55, 0, 7); c.fill(); // Nase, Auge
  c.strokeStyle = "#c62828"; c.lineWidth = 1; c.beginPath(); c.moveTo(4.5, y - 3); c.lineTo(5, y + 3); c.stroke(); // Geschirr
  c.restore();
}
function jzbGespannMalen(c, H) {
  const J = JZB, k = J.k, d = H.dir, gy = jzbGrund(H.x) + .5, lauf = H.steht ? 0 : J.T;
  const hund = (i) => H.x + d * (22 + i * JZB_HUND_ABST) * k;
  c.save(); c.strokeStyle = "#8b5a2b"; c.lineWidth = .9 * k; c.beginPath(); c.moveTo(H.x + d * 8 * k, gy - 5 * k); c.lineTo(hund(JZB_HUNDE - 1), gy - 6 * k); c.stroke(); c.restore(); // Zugleine
  for (let i = JZB_HUNDE - 1; i >= 0; i--) jzbHundMalen(c, hund(i), jzbGrund(hund(i)) + .5 + (i % 2 ? .8 : 0) * k, d, lauf + i * .37, k, !!H.steht);
  c.save(); c.lineCap = "round"; c.strokeStyle = "#5a3a1c"; c.lineWidth = 1.4 * k; // Kufen mit hochgebogener Spitze
  c.beginPath(); c.moveTo(H.x - d * 10 * k, gy - 1); c.lineTo(H.x + d * 8 * k, gy - 1); c.quadraticCurveTo(H.x + d * 12 * k, gy - 1, H.x + d * 11 * k, gy - 5 * k); c.stroke();
  c.fillStyle = "#a8743a"; c.fillRect(Math.min(H.x - d * 8 * k, H.x + d * 7 * k), gy - 7 * k, 15 * k, 3.4 * k); // Ladefläche
  c.strokeStyle = "#7a4f24"; c.beginPath(); c.moveTo(H.x - d * 9 * k, gy - 1); c.lineTo(H.x - d * 9 * k, gy - 15 * k); c.lineTo(H.x - d * 5 * k, gy - 15 * k); c.stroke(); // Haltebügel
  c.restore();
  if (H.gast) jzbFigurMalen(c, H.x + d * 2 * k, gy - 6 * k, d, 0, ["#b5651d", "#e8d9b5"], k * .85, -.4); // der Eskimo sitzt im Schlitten
  if (H.fahrer.sichtbar && !H.steht) jzbFigurMalen(c, H.x - d * 11 * k, gy - 2 * k, d, 0, H.f, k, -.9); // Schlittenmann steht hinten auf den Kufen
}
function jzbIgluMalen(c) {
  const J = JZB, I = J.iglu, k = J.k, x = I.x, gy = J.h - 1 - Math.min(jzbBodenH(x), 6 * k) * .5, R = I.R, Hh = 21 * k, reihen = 5;
  const bau = J.phase === "bauen" ? Math.min(1, J.pt / 7.5) : 1, schmelz = J.phase === "schmelzen" ? jzbEase((J.pt - JZB_SONNE) / JZB_SCHMELZ) : 0;
  c.save();
  if (schmelz) { c.fillStyle = `rgba(200,225,255,${.55 * (1 - schmelz * .6)})`; c.beginPath(); c.ellipse(x, gy, R * (1 + .5 * schmelz), 3 * k, 0, 0, 7); c.fill();
    c.translate(x, gy); c.scale(1 + .25 * schmelz, 1 - .9 * schmelz); c.translate(-x, -gy); c.globalAlpha = 1 - schmelz * .7; }
  const fertig = Math.floor(bau * reihen + 1e-6), teil = bau * reihen - fertig, hoehe = Hh * Math.min(1, (fertig + teil) / reihen);
  c.save(); c.beginPath(); c.rect(x - R - 20 * k, gy - hoehe, 2 * R + 40 * k, hoehe + 2); c.clip();
  const g = c.createLinearGradient(x - R, gy - Hh, x + R, gy); g.addColorStop(0, "#ffffff"); g.addColorStop(.6, "#e6f2fb"); g.addColorStop(1, "#b9d6ef");
  // Eingangstunnel
  const ex = x + I.blick * R * .78; c.fillStyle = g; c.beginPath(); c.ellipse(ex + I.blick * 3 * k, gy, 9 * k, 10 * k, 0, Math.PI, 0); c.fill();
  c.fillStyle = g; c.beginPath(); c.ellipse(x, gy, R, Hh, 0, Math.PI, 0); c.fill(); // Kuppel
  c.strokeStyle = "rgba(120,160,200,.75)"; c.lineWidth = .8 * k;
  for (let i = 1; i < reihen; i++) { const h = Hh * i / reihen, w = R * Math.sqrt(1 - (h / Hh) ** 2); c.beginPath(); c.moveTo(x - w, gy - h); c.lineTo(x + w, gy - h); c.stroke(); } // Blockreihen
  for (let i = 0; i < reihen; i++) { const h0 = Hh * i / reihen, h1 = Hh * (i + 1) / reihen, w = R * Math.sqrt(1 - (h0 / Hh) ** 2), n = Math.max(2, Math.round(w / (7 * k)));
    for (let j = 1; j < n * 2; j++) { const xx = x - w + (j + (i % 2 ? .5 : 0)) * w / n; if (Math.abs(xx - x) > R * Math.sqrt(1 - (h1 / Hh) ** 2) && i) continue; c.beginPath(); c.moveTo(xx, gy - h0); c.lineTo(xx, gy - h1); c.stroke(); } }
  c.fillStyle = `rgba(${Math.round(55 + 200 * I.licht)},${Math.round(70 + 130 * I.licht)},${Math.round(90 + 0 * I.licht)},.92)`; // Eingang – mit Licht, wenn jemand drin ist
  c.beginPath(); c.ellipse(ex + I.blick * 9 * k, gy, 4.2 * k, 6.5 * k, 0, Math.PI, 0); c.fill();
  if (I.licht > .05) { const gl = c.createRadialGradient(ex + I.blick * 10 * k, gy - 3 * k, 1, ex + I.blick * 10 * k, gy - 3 * k, 14 * k); gl.addColorStop(0, `rgba(255,200,90,${.45 * I.licht})`); gl.addColorStop(1, "rgba(255,200,90,0)"); c.fillStyle = gl; c.beginPath(); c.arc(ex + I.blick * 10 * k, gy - 3 * k, 14 * k, 0, 7); c.fill(); }
  c.restore();
  if (J.phase === "bauen" && bau < 1) { const bx = x + I.blick * (R * .5) * (1 - 2 * ((fertig + teil) % 1)), by = gy - hoehe; c.fillStyle = "#f4f9fd"; c.strokeStyle = "rgba(120,160,200,.9)"; c.lineWidth = .7 * k; c.fillRect(bx - 3.5 * k, by - 2.8 * k, 7 * k, 3.6 * k); c.strokeRect(bx - 3.5 * k, by - 2.8 * k, 7 * k, 3.6 * k); } // Block wird gesetzt
  c.restore();
}
function jzbIgluLeuteMalen(c) { // Eskimo am Iglu und das Gespann (vor dem Iglu)
  const J = JZB, I = J.iglu, H = J.husky, k = J.k;
  if (H) jzbGespannMalen(c, H);
  if (I && I.bauer.sichtbar) { const B = I.bauer, bauen = J.phase === "bauen"; jzbFigurMalen(c, B.x, jzbGrund(B.x) + .5, B.dir, B.geht, B.farbe, k, bauen ? -.6 + Math.sin(J.T * 4) * .8 : .9); }
  if (H && H.steht && H.fahrer.sichtbar) jzbFigurMalen(c, H.fahrer.x, jzbGrund(H.fahrer.x) + .5, H.fahrer.dir || H.dir, H.fahrer.geht, H.f, k);
}
function jzbWinterKinder(dt) {
  const J = JZB, k = J.k;
  jzbEisNameSchritt(dt); // 2.319.0 KC-CLUB-EISNAME
  for (const t of J.eisTropfen || []) {
    t.v = Math.min(260, t.v + 520 * dt); t.y += t.v * dt; t.spur = Math.min(12 * k, t.spur + t.v * dt * .4);
    if (t.y >= jzbGrund(t.x)) {
      t.weg = true; const P = (J.eisPfuetzen = J.eisPfuetzen || []), p = P.find((q) => Math.abs(q.x - t.x) < q.r + 6 * k);
      if (p) { p.r = Math.min(22 * k, p.r + 1.6 * k); p.ringe.push(0); } else P.push({ x: t.x, r: 4 * k, ringe: [0] });
      for (let i = 0; i < 4; i++) J.fx.push({ typ: "wasser", x: t.x, y: jzbGrund(t.x) - 1, vx: jzbZ(-30, 30), vy: -jzbZ(30, 60), a: 1, blass: 2.5 });
    }
  }
  if (J.eisTropfen) J.eisTropfen = J.eisTropfen.filter((t) => !t.weg);
  for (const p of J.eisPfuetzen || []) { p.r -= dt * .04 * k; p.ringe = p.ringe.map((g) => g + dt * 1.4).filter((g) => g < 1); } // trocknet ganz langsam
  if (J.eisPfuetzen) J.eisPfuetzen = J.eisPfuetzen.filter((p) => p.r > .5);
  if (J.saison !== "winter") return;
  // wann kommen die Kinder? – erst wenn Schnee liegt; abwechselnd Schlitten / Schneeballschlacht
  jzbPiste(dt); // 2.318.0 KC-CLUB-WINTER-PISTE
  jzbIgluSchritt(dt); jzbHuskySchritt(dt); // 2.320.0 KC-CLUB-WINTER-IGLU / -HUSKY
  if (!J.schlitten && !J.ballspiel && !J.raupe && !J.ski && !J.husky && !J.iglu && (J.kinderUhr = (J.kinderUhr ?? (J.vorschau ? 4 : jzbZ(15, 30))) - dt) <= 0) {
    if (jzbSchneeMittel() < 3 * k || J.phase === "wind" || J.phase === "schmelzen") J.kinderUhr = 5;
    else if ((J.kinderArt = J.kinderArt === "schlitten" ? "ball" : J.kinderArt === "ball" ? "husky" : "schlitten") === "husky") jzbHuskyStart(); // 2.320.0: ab und an ein Hundegespann
    else if (J.kinderArt === "schlitten") {
      const dir = J.schlittenDir = J.schlittenDir === 1 ? -1 : 1; // einmal von links, beim nächsten Mal von rechts
      J.schlitten = { dir, x: dir > 0 ? -40 * k : J.w + 40 * k, t: 0, f: jzbKindFarben(2) };
    } else jzbBallspielStart();
  }
  if (J.schlitten) {
    const s = J.schlitten; s.t += dt; s.x += s.dir * 78 * k * dt;
    if (Math.random() < dt * 14) J.fx.push({ typ: "flocke", x: s.x - s.dir * 18 * k, y: jzbGrund(s.x) - 2, r: jzbZ(.8, 1.8), vx: -s.dir * jzbZ(20, 60), vy: -jzbZ(20, 50), a: 1, blass: 1.2 }); // Schneestaub
    if (s.x < -60 * k || s.x > J.w + 60 * k) { J.schlitten = null; J.kinderUhr = jzbZ(45, 90); }
  }
  if (J.ballspiel) jzbBallspielSchritt(dt);
}
function jzbBallspielStart() {
  const J = JZB, k = J.k, m = J.mann, links = m && m.x < J.w / 2, rechts = m && m.x >= J.w / 2;
  const plaetze = [[links ? .3 : .16, 1], [links ? .42 : .3, 1], [rechts ? .7 : .84, -1]].concat(J.w > 520 ? [[rechts ? .58 : .7, -1]] : []);
  const farben = jzbKindFarben(plaetze.length);
  J.ballspiel = { t: 0, baelle: [], kinder: plaetze.map(([p, blick], i) => ({ ziel: J.w * p, x: blick > 0 ? -20 * k - i * 14 * k : J.w + 20 * k + i * 14 * k, blick, f: farben[i], uhr: jzbZ(.8, 2), wurf: 0, treffer: 0 })) };
}
function jzbBallspielSchritt(dt) {
  const J = JZB, k = J.k, S = J.ballspiel, g = 260 * k; S.t += dt;
  const geht = S.geht = S.t > 16;
  for (const c of S.kinder) {
    c.wurf = Math.max(0, c.wurf - dt); c.treffer = Math.max(0, c.treffer - dt);
    const soll = geht ? (c.blick > 0 ? -40 * k : J.w + 40 * k) : c.ziel, d = soll - c.x;
    c.laeuft = Math.abs(d) > 1; if (c.laeuft) c.x += Math.sign(d) * Math.min(Math.abs(d), (geht ? 95 : 55) * k * dt);
    if (!geht && !c.laeuft && (c.uhr -= dt) <= 0) { // werfen: im Bogen auf ein Kind der anderen Seite – nicht jeder Wurf trifft
      const geg = S.kinder.filter((o) => o.blick !== c.blick && !o.laeuft); c.uhr = jzbZ(1.3, 2.6); if (!geg.length) continue;
      const o = jzbW(geg), T = jzbZ(.8, 1.1), tx = o.x + (Math.random() < .6 ? 0 : jzbZ(-14, 14) * k), x0 = c.x + c.blick * 3 * k, y0 = jzbGrund(c.x) - 30 * k, ty = jzbGrund(tx) - 14 * k;
      c.wurf = .35; S.baelle.push({ x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0) / T - .5 * g * T, ziel: o, tx });
    }
  }
  for (const b of S.baelle) {
    b.vy += g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    const o = b.ziel, triff = Math.abs(b.x - o.x) < 5 * k && b.y > jzbGrund(o.x) - 26 * k && b.y < jzbGrund(o.x) - 4 * k;
    if (triff || b.y >= jzbGrund(b.x)) { b.weg = true; if (triff) o.treffer = .45;
      for (let i = 0; i < 9; i++) J.fx.push({ typ: "flocke", x: b.x, y: b.y, r: jzbZ(.7, 1.8), vx: jzbZ(-60, 60), vy: -jzbZ(10, 70), a: 1, blass: 1.6 }); } // Schnee stäubt
  }
  S.baelle = S.baelle.filter((b) => !b.weg);
  if (geht && S.kinder.every((c) => c.x < -30 * k || c.x > J.w + 30 * k)) { J.ballspiel = null; J.kinderUhr = jzbZ(45, 90); }
}
// Kind von der Seite: f = [Jacke, Mütze, Schal]; sitzt (Schlitten) oder steht; Schal weht nach hinten
function jzbKind(c, f, sitzt, opt = {}) {
  const T = JZB.T, wehen = opt.wehen ?? .3, ph = opt.ph || 0;
  c.lineCap = "round"; c.lineJoin = "round";
  if (sitzt) { c.strokeStyle = "#2b3550"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -6); c.lineTo(7, -5); c.lineTo(9, -2); c.stroke(); } // Beine nach vorn
  else { const s = opt.laeuft ? Math.sin(T * 14 + ph) * 3 : 0; c.strokeStyle = "#2b3550"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(-1.5, -8); c.lineTo(-1.5 - s, 0); c.moveTo(1.5, -8); c.lineTo(1.5 + s, 0); c.stroke(); }
  const ky = sitzt ? -6 : -8; // Jacke
  // 2.318.0 (Fund Hansi „die Kinder bei der Schneeballschlacht haben keine Arme“): die Arme lagen in Jackenfarbe auf der Jacke – jetzt
  // zwei richtige Arme mit dunklem Rand und Fäustlingen; beim Werfen holt der vordere Arm mit dem Schneeball weit nach hinten aus und schleudert nach vorn
  const arm = (a, vorn) => { const sx = vorn ? 1 : -1, sy = ky - 9.5, L = 7.2, ex = sx + Math.sin(a) * L, ey = sy + Math.cos(a) * L, mx = sx + Math.sin(a) * L * .5 + (vorn ? .6 : -.4), my = sy + Math.cos(a) * L * .5;
    c.strokeStyle = "rgba(20,25,40,.55)"; c.lineWidth = 3.6; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = f[0]; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.fillStyle = f[2]; c.beginPath(); c.arc(ex, ey, 1.6, 0, 7); c.fill(); return [ex, ey]; };
  const sw = opt.laeuft ? Math.sin(T * 14 + (opt.ph || 0)) * .6 : 0;
  let aV = opt.arm === "vor" ? 1.45 : .35 + sw, aH = opt.arm === "vor" ? 1.25 : -.2 - sw;
  if (opt.ausholen) { aV = .35 - opt.ausholen * 2.75; aH = -.2 + opt.ausholen * .9; } // Ball in der Hand, Arm weit nach hinten oben
  if (opt.wurf) { const p = jzbEase(opt.wurf); aV = -2.4 + p * 4.1; aH = .7 - p * 1.1; } // Wurf: von hinten oben schnell nach vorn
  arm(aH, false); // hinterer Arm (hinter der Jacke)
  c.fillStyle = f[0]; c.beginPath(); c.ellipse(0, ky - 6, 4.6, 6.4, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(0,0,0,.12)"; c.beginPath(); c.ellipse(-1.4, ky - 5, 2.4, 5.4, 0, 0, 7); c.fill(); // etwas Schatten, damit der vordere Arm sich abhebt
  const hand = arm(aV, true);
  if (opt.ausholen) { c.fillStyle = "#ffffff"; c.strokeStyle = "rgba(160,190,220,.9)"; c.lineWidth = .6; c.beginPath(); c.arc(hand[0], hand[1] - 1.2, 2, 0, 7); c.fill(); c.stroke(); }
  const hy = ky - 15; // Kopf
  c.fillStyle = "#f6cba6"; c.beginPath(); c.arc(0, hy, 4.4, 0, 7); c.fill();
  c.fillStyle = "#3a2a1a"; c.beginPath(); c.arc(2.2, hy - .4, .6, 0, 7); c.fill();
  c.strokeStyle = "#a0523a"; c.lineWidth = .7; c.beginPath(); c.arc(2, hy + 1.3, 1.2, .2, Math.PI * .8); c.stroke(); // Lächeln
  c.fillStyle = "rgba(255,120,120,.5)"; c.beginPath(); c.arc(2.6, hy + 1.2, 1, 0, 7); c.fill();
  // Bommelmütze: Kappe mit Bündchen, Bommel hüpft und neigt sich nach hinten
  c.fillStyle = f[1]; c.beginPath(); c.moveTo(-4.8, hy - .8); c.quadraticCurveTo(-4.6, hy - 7.2, .4, hy - 7.2); c.quadraticCurveTo(4.8, hy - 6.4, 4.8, hy - .8); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(-4.8, hy - 2.2, 9.6, 1.4);
  const bx = -2.6 - wehen * 2.4, by = hy - 8 + Math.sin(T * 9 + ph) * .5;
  c.fillStyle = f[1]; c.beginPath(); c.arc(bx, by, 2, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.arc(bx - .5, by - .6, .8, 0, 7); c.fill();
  // Schal: um den Hals, zwei Enden flattern nach hinten (je schneller, desto waagrechter)
  const sy = hy + 4.6; c.fillStyle = f[2]; c.beginPath(); c.ellipse(0, sy, 4, 1.6, 0, 0, 7); c.fill();
  c.strokeStyle = f[2]; c.lineWidth = 2;
  for (const [l, v] of [[9, 0], [7, 1.7]]) { c.beginPath(); c.moveTo(-2.6, sy);
    for (let i = 1; i <= 4; i++) { const u = i / 4; c.lineTo(-2.6 - u * l * (.35 + wehen), sy + u * l * (1 - wehen) * .9 + Math.sin(T * 12 + ph + v + u * 4) * wehen * 2.2 * u); }
    c.stroke(); }
}
function jzbSchlittenMalen(c, s, k) {
  const x = s.x, y = jzbGrund(x) + 1, hops = Math.abs(Math.sin(s.t * 7)) * .8;
  c.save(); c.translate(x, y - hops); c.scale(s.dir * k * 1.2, k * 1.2);
  c.strokeStyle = "#7a4a22"; c.lineWidth = 1.6; c.lineCap = "round"; // Kufen mit hochgebogener Spitze
  for (const z of [0, 1.2]) { c.beginPath(); c.moveTo(-20, -1 - z); c.lineTo(13, -1 - z); c.quadraticCurveTo(20, -1 - z, 19, -7 - z); c.stroke(); }
  c.strokeStyle = "#7a4a22"; c.lineWidth = 1.2; for (const sx of [-15, -3, 9]) { c.beginPath(); c.moveTo(sx, -1); c.lineTo(sx, -5); c.stroke(); }
  c.fillStyle = "#c08447"; c.fillRect(-19, -6.4, 30, 2.6); c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(-19, -6.4, 30, .8);
  c.strokeStyle = "#a3492f"; c.lineWidth = .8; c.beginPath(); c.moveTo(18, -7); c.quadraticCurveTo(14, -12, 9, -13); c.stroke(); // Zugseil
  c.save(); c.translate(-9, -5); jzbKind(c, s.f[1], true, { wehen: .85, ph: 1.3, arm: "vor" }); c.restore(); // hinten
  c.save(); c.translate(4, -5); jzbKind(c, s.f[0], true, { wehen: .85, arm: "vor" }); c.restore(); // vorn hält das Seil
  c.restore();
}
function jzbBallspielMalen(c, S, k) {
  for (const [i, ki] of S.kinder.entries()) {
    const zuck = ki.treffer ? Math.sin(ki.treffer * 40) * 1.5 : 0;
    c.save(); c.translate(ki.x + zuck, jzbGrund(ki.x) + 1); c.scale(ki.blick * k * 1.15, k * 1.15); c.rotate(ki.treffer ? -.15 : 0);
    jzbKind(c, ki.f, false, { wehen: ki.laeuft ? .55 : .2, ph: i * 1.7, wurf: ki.wurf > 0 ? 1 - ki.wurf / .35 : 0, laeuft: ki.laeuft,
      ausholen: !ki.wurf && !ki.laeuft && !S.geht && ki.uhr < .55 ? Math.min(1, (.55 - ki.uhr) / .3) : 0 });
    c.restore();
  }
  c.fillStyle = "#ffffff"; c.strokeStyle = "rgba(160,190,220,.8)"; c.lineWidth = .6;
  for (const b of S.baelle) { c.beginPath(); c.arc(b.x, b.y, 2.3 * k, 0, 7); c.fill(); c.stroke(); }
}
function jzbWinterKinderMalen(c) {
  const J = JZB, k = J.k;
  for (const p of J.eisPfuetzen || []) { // Pfütze auf dem Schnee bzw. Boden – blau schimmernd, mit Ringen, wenn ein Tropfen fällt
    const y = jzbGrund(p.x) + .5;
    c.fillStyle = "rgba(95,165,235,.55)"; c.beginPath(); c.ellipse(p.x, y, p.r, Math.max(1.4 * k, p.r * .22), 0, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.ellipse(p.x - p.r * .3, y - p.r * .06, p.r * .32, Math.max(.5, p.r * .05), 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = .8;
    for (const g of p.ringe) { c.globalAlpha = 1 - g; c.beginPath(); c.ellipse(p.x, y, 2 + g * p.r * .8, (2 + g * p.r * .8) * .22, 0, 0, 7); c.stroke(); }
    c.globalAlpha = 1;
  }
  for (const t of J.eisTropfen || []) jzbTropfenMalen(c, t);
  jzbEisNameMalen(c); // 2.319.0 KC-CLUB-EISNAME
  jzbIgluLeuteMalen(c); // 2.320.0
  if (J.schlitten) jzbSchlittenMalen(c, J.schlitten, k);
  if (J.ballspiel) jzbBallspielMalen(c, J.ballspiel, k);
  jzbPisteMalen(c);
}
// ---------- KC-CLUB-WINTER-PISTE (2.318.0, Wunsch Hansi): ab und an fährt eine Schneeraupe (Pistenraupe) vorbei und glättet die
// Schneehügel – vorn schiebt das Schild den Schnee glatt, hinten zieht die Fräse ein Rillenmuster. Ein paar Minuten später wedeln zwei
// Skifahrer in verschiedenfarbigen Anzügen über die frisch präparierte Piste. Nur Winter, nur wenn Schnee liegt, nie zugleich mit den Kindern.
const JZB_SKI_FARBEN = [["#e63946", "#ffffff"], ["#1d6fe0", "#ffd21f"], ["#2bb24c", "#ff4fa3"], ["#ffb703", "#1d3557"], ["#9b2fd6", "#38d1c0"], ["#ff6f1a", "#2f6fd6"], ["#ff4fa3", "#ffffff"], ["#14a3a3", "#ffd166"]];
const jzbPisteFrei = () => { const J = JZB; return !J.schlitten && !J.ballspiel && !J.besuch && !J.mann && !J.iglu && !J.husky && (J.phase === "fallen" || J.phase === "stehen") && jzbSchneeMittel() >= 3 * J.k; };
function jzbPiste(dt) {
  const J = JZB, k = J.k, B = J.boden;
  if (J.rillen) { J.rillen.t += dt; if (J.rillen.t > 120 || J.phase === "wind" || J.phase === "besuch") J.rillen = null; }
  if (!J.raupe && !J.ski) {
    const nameFertig = J.eisName?.fertig != null && J.T - J.eisName.fertig > (J.vorschau ? 15 : 75); // 2.356.0: dann kommt die Raupe und schiebt ihn weg
    if (nameFertig && J.raupeUhr > 3) J.raupeUhr = 3;
    if ((J.raupeUhr = (J.raupeUhr ?? (J.extra === "raupe" ? 2 : jzbZ(60, 150))) - dt) <= 0) {
      if (!jzbPisteFrei()) J.raupeUhr = 6;
      else { const dir = J.raupeDir = J.raupeDir === 1 ? -1 : 1; J.raupe = { dir, x: dir > 0 ? -70 * k : J.w + 70 * k, t: 0, eben: jzbSchneeMittel() }; J.rillen = null; }
    }
    if (J.skiUhr !== undefined && J.skiUhr !== null && (J.skiUhr -= dt) <= 0) {
      if (jzbSchneeMittel() < 3 * k || J.schlitten || J.ballspiel || J.besuch || J.husky || J.iglu || J.phase === "wind" || J.phase === "schmelzen") J.skiUhr = 8;
      else { const dir = Math.random() < .5 ? 1 : -1, f = JZB_SKI_FARBEN.slice().sort(() => Math.random() - .5).slice(0, 2); J.skiUhr = null;
        J.ski = { dir, t: 0, fahrer: f.map((farbe, i) => ({ x: dir > 0 ? -30 * k - i * 70 * k : J.w + 30 * k + i * 70 * k, f: farbe, ph: i * 1.9 })) }; }
    }
  }
  if (J.raupe) {
    const R = J.raupe; R.t += dt; R.x += R.dir * 42 * k * dt;
    const vorn = R.x + R.dir * 34 * k, hinten = R.x - R.dir * 30 * k, a = Math.min(vorn, hinten), b = Math.max(vorn, hinten);
    for (let i = Math.max(0, Math.floor(a / JZB_SP)); i <= Math.min(B.length - 1, Math.ceil(b / JZB_SP)); i++) {
      const d = B[i] - R.eben; if (Math.abs(d) < .05) continue; B[i] -= d * Math.min(1, dt * 6); // Hügel abtragen, Mulden auffüllen
      if (d > 1.5 * k && J.fx.length < 170 && Math.random() < dt * 8) J.fx.push({ typ: "flocke", x: i * JZB_SP, y: J.h - B[i] - 2, r: jzbZ(.8, 1.8), vx: R.dir * jzbZ(30, 80), vy: -jzbZ(20, 60), a: 1, blass: 1.4 }); // Schnee vor dem Schild
    }
    const rx = R.x - R.dir * 32 * k; if (jzbImFeld(rx)) { if (!J.rillen) J.rillen = { von: rx, bis: rx, t: 0 }; J.rillen.von = Math.min(J.rillen.von, rx); J.rillen.bis = Math.max(J.rillen.bis, rx); }
    if (R.x < -90 * k || R.x > J.w + 90 * k) { J.raupe = null; J.raupeUhr = jzbZ(300, 480); J.skiUhr = J.extra === "raupe" ? 4 : jzbZ(120, 200); } // „ein paar Minuten später“: die Skifahrer
  }
  if (J.ski) {
    const S = J.ski; S.t += dt;
    for (const f of S.fahrer) {
      f.x += S.dir * 105 * k * dt; f.dreh = Math.sin(S.t * 5.2 + f.ph); // wedeln: Schwung links, Schwung rechts
      if (Math.abs(f.dreh) > .85 && J.fx.length < 170 && Math.random() < dt * 30) J.fx.push({ typ: "flocke", x: f.x - S.dir * 6 * k, y: jzbGrund(f.x) - 1, r: jzbZ(.7, 1.6), vx: -S.dir * jzbZ(20, 60) + f.dreh * 25, vy: -jzbZ(25, 70), a: 1, blass: 1.6 }); // Schnee spritzt in der Kurve
    }
    if (S.fahrer.every((f) => f.x < -60 * k || f.x > J.w + 60 * k)) J.ski = null;
  }
}
function jzbRaupeMalen(c, R, k) {
  const J = JZB, y = J.h - R.eben, wipp = Math.sin(R.t * 9) * .3;
  c.save(); c.translate(R.x, y + 1 + wipp); c.scale(R.dir * k, k); c.lineJoin = "round"; c.lineCap = "round";
  // Kette mit Laufrollen
  c.fillStyle = "#2b2f38"; c.beginPath(); c.roundRect(-26, -9, 52, 9, 4.5); c.fill();
  c.fillStyle = "#59606e"; for (const rx of [-21, -12, -3, 6, 15, 21]) { c.beginPath(); c.arc(rx, -4.5, 2.6, 0, 7); c.fill(); }
  c.strokeStyle = "#454b57"; c.lineWidth = .8; const lauf = (R.t * 42) % 4;
  for (let gx = -24 + lauf; gx < 25; gx += 4) { c.beginPath(); c.moveTo(gx, -9); c.lineTo(gx, -8); c.moveTo(gx, -.8); c.lineTo(gx, 0); c.stroke(); }
  // Aufbau (rot) mit Motorhaube vorn
  c.fillStyle = "#d62828"; c.beginPath(); c.moveTo(-24, -9); c.lineTo(-24, -17); c.lineTo(10, -17); c.lineTo(22, -14); c.lineTo(24, -9); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(-24, -17, 46, 1.4);
  // Fahrerhaus mit Fenstern
  c.fillStyle = "#c01f1f"; c.beginPath(); c.moveTo(-14, -17); c.lineTo(-13, -30); c.lineTo(4, -30); c.lineTo(10, -17); c.closePath(); c.fill();
  c.fillStyle = "#bfe3ff"; c.beginPath(); c.moveTo(-11, -19); c.lineTo(-10.5, -28); c.lineTo(-3, -28); c.lineTo(-3, -19); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-1, -19); c.lineTo(-1, -28); c.lineTo(3, -28); c.lineTo(7.4, -19); c.closePath(); c.fill();
  c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(-9.5, -27, 1.2, 6);
  c.fillStyle = "#f6cba6"; c.beginPath(); c.arc(1.6, -24.5, 1.8, 0, 7); c.fill(); c.fillStyle = "#1d3557"; c.fillRect(-.2, -27, 3.6, 1.2); // Fahrer mit Mütze
  // Rundumleuchte (blinkt)
  const an = Math.sin(R.t * 12) > 0; c.fillStyle = an ? "#ffb000" : "#a86a00"; c.beginPath(); c.roundRect(-6, -33, 4, 3, 1); c.fill();
  if (an) { c.fillStyle = "rgba(255,176,0,.28)"; c.beginPath(); c.arc(-4, -31.5, 7, 0, 7); c.fill(); }
  // Schild vorn (gewölbt) und Fräse hinten
  c.fillStyle = "#e9edf2"; c.strokeStyle = "#8a96a8"; c.lineWidth = .8; c.beginPath(); c.moveTo(28, -13); c.quadraticCurveTo(33, -7, 30, 0); c.lineTo(34, 0); c.quadraticCurveTo(37, -7, 32, -14); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = "#5b6272"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(24, -11); c.lineTo(29, -10); c.stroke();
  c.fillStyle = "#3d4350"; c.beginPath(); c.roundRect(-36, -7, 9, 6, 2); c.fill(); c.strokeStyle = "#3d4350"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-27, -5); c.lineTo(-24, -6); c.stroke();
  c.strokeStyle = "#c9d2de"; c.lineWidth = .6; for (let fx = -35; fx < -28; fx += 1.6) { c.beginPath(); c.moveTo(fx, -1); c.lineTo(fx, .8); c.stroke(); }
  c.restore();
}
function jzbSkiMalen(c, f, dir, k) {
  const J = JZB, y = jzbGrund(f.x) + 1, d = f.dreh || 0, kipp = d * .22, hoch = Math.abs(d) * 1.2;
  c.save(); c.translate(f.x, y - hoch); c.scale(dir * k * 1.15, k * 1.15); c.lineCap = "round"; c.lineJoin = "round";
  // Skier (vorne hochgebogen), leicht schräg im Schwung
  c.save(); c.rotate(d * .06); c.strokeStyle = f.f[0]; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-13, 0); c.lineTo(11, 0); c.quadraticCurveTo(15, 0, 15, -3); c.stroke();
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = .6; c.beginPath(); c.moveTo(-13, .9); c.lineTo(12, .9); c.stroke(); c.restore();
  c.rotate(kipp); // ganzer Körper legt sich in die Kurve
  // Beine gebeugt (Hosen etwas dunkler), Skischuhe
  c.strokeStyle = "#20263a"; c.lineWidth = 3; c.beginPath(); c.moveTo(-1, -1); c.lineTo(3, -7); c.lineTo(-1, -13); c.stroke();
  c.strokeStyle = f.f[0]; c.lineWidth = 3.1; c.beginPath(); c.moveTo(1, -1); c.lineTo(5, -7); c.lineTo(1, -13); c.stroke();
  c.fillStyle = "#20263a"; c.fillRect(-2.5, -2.4, 5, 2.4);
  // Oberkörper nach vorn gebeugt im Anzug
  c.fillStyle = f.f[0]; c.beginPath(); c.ellipse(2, -18, 4.4, 6.8, .45, 0, 7); c.fill();
  c.fillStyle = f.f[1]; c.beginPath(); c.ellipse(3.2, -18.6, 1.1, 5, .45, 0, 7); c.fill(); // Streifen
  // Arme mit Stöcken – Stockeinsatz wechselt mit dem Schwung
  const st = d > 0 ? 1 : -1;
  for (const [vorn, sign] of [[false, -1], [true, 1]]) {
    const hx = 8 + (vorn ? 2 : 0) + (st === sign ? 2 : -1), hy = -16;
    c.strokeStyle = vorn ? f.f[0] : "rgba(0,0,0,.35)"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(3, -22); c.lineTo(hx, hy); c.stroke();
    c.strokeStyle = "#9aa3b0"; c.lineWidth = .8; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 6 - (st === sign ? -3 : 3), 1); c.stroke();
    c.fillStyle = "#20263a"; c.beginPath(); c.arc(hx, hy, 1.3, 0, 7); c.fill();
  }
  // Kopf mit Helm und Skibrille
  c.fillStyle = "#f6cba6"; c.beginPath(); c.arc(7, -27, 3.8, 0, 7); c.fill();
  c.fillStyle = f.f[1]; c.beginPath(); c.arc(6.6, -28, 4.2, Math.PI * 1.02, Math.PI * 2.05); c.fill();
  c.fillStyle = "#ff9f1c"; c.beginPath(); c.roundRect(7.2, -28.2, 3.8, 2, 1); c.fill(); c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(8, -27.9, 1.2, .7);
  c.restore();
}
function jzbPisteMalen(c) {
  const J = JZB, k = J.k;
  if (J.rillen) { // Rillenmuster der Fräse, verblasst langsam
    const R = J.rillen; c.strokeStyle = `rgba(150,180,215,${.55 * Math.max(0, 1 - R.t / 120)})`; c.lineWidth = .9;
    for (let x = Math.max(JZB_RAND, R.von); x < Math.min(J.w - JZB_RAND, R.bis); x += 3.2 * k) { const y = jzbGrund(x) + 1; c.beginPath(); c.moveTo(x, y + .5); c.lineTo(x, y + Math.min(4 * k, jzbBodenH(x) * .6)); c.stroke(); }
  }
  if (J.raupe) jzbRaupeMalen(c, J.raupe, k);
  if (J.ski) for (const f of J.ski.fahrer) jzbSkiMalen(c, f, J.ski.dir, k);
}
// ---------- 2.328.0 KC-CLUB-HERBST-BLAESER + KC-CLUB-HERBST-HOERNCHEN (Wunsch Hansi): Ist der Laubhaufen groß genug, kommt (im Wechsel mit
// Wind und Twinkeys Besen) ein Mann mit Laubbläser und pustet das Laub weg. Auf dem Boden liegen Eicheln und Haselnüsse; ab und an flitzt
// ein Eichhörnchen herbei, stopft sich eine dicke Nuss in die Backe und saust wieder davon. Nur Herbst, nur Anzeige auf diesem Gerät. ----------
function jzbBlaeserStart() {
  const J = JZB, k = J.k, dir = (J.lauf >> 1) % 2 ? -1 : 1;
  for (const f of J.flug) J.fx.push({ ...f, vx: dir * jzbZ(60, 140), vy: f.vy || 20, a: 1 }); J.flug = []; // was noch fällt, wird gleich mitgepustet
  J.blaeser = { dir, x: dir > 0 ? -30 * k : J.w + 30 * k, t: 0, luft: [] };
  jzbPhase("blasen");
}
function jzbBlaeserSchritt(dt) {
  const J = JZB, B = J.blaeser, k = J.k; if (!B) return;
  B.t += dt; const an = B.t > .6; B.x += B.dir * (an ? 34 : 50) * k * dt; // erst hereinlaufen, dann langsam pustend weiter
  const d0 = B.x + B.dir * 14 * k, d1 = B.x + B.dir * 72 * k, lo = Math.min(d0, d1), hi = Math.max(d0, d1);
  if (an) {
    for (const b of J.liegt) if (b.x > lo && b.x < hi && Math.random() < dt * 9) { // Blätter wirbeln in Blasrichtung davon
      J.fx.push({ typ: "blatt", x: b.x, y: J.h - b.yb, s: b.s, farbe: b.farbe, form: b.form, rot: b.rot, vr: jzbZ(-12, 12), vx: B.dir * jzbZ(190, 340), vy: -jzbZ(40, 170), ph: jzbZ(0, 6.3), fq: jzbZ(1, 2) });
      b.weg = true;
    }
    J.liegt = J.liegt.filter((b) => !b.weg);
    for (const p of J.fx) if (p.typ === "blatt" && p.liegt && p.x > lo && p.x < hi) { p.liegt = false; p.vx = B.dir * jzbZ(190, 300); p.vy = -jzbZ(40, 120); } // auch schon Hingefallenes
    // 2.356.0 KC-CLUB-NAME-WEG (Wunsch Hansi „beim Herbstlaub soll das der Laubbläser sein – dann werden die Blätter aufgewirbelt“)
    const N = J.saison === "herbst" ? J.nussName : null;
    if (N && N.n) {
      const L = jzbNussNameLage(); N.weg = N.weg || [];
      for (let i = 0; i < N.n; i++) {
        if (N.weg[i] || L.pos[i] < lo - L.fs * .3 || L.pos[i] > hi + L.fs * .3) continue;
        N.weg[i] = true; const laub = themaWert("laub") || JZB_LAUB;
        for (let q = 0; q < 14; q++) J.fx.push({ typ: "blatt", x: L.pos[i] + jzbZ(-.4, .4) * L.fs, y: L.y - jzbZ(.05, .9) * L.fs, s: jzbZ(5, 8.5) * (.75 + .25 * k), farbe: jzbW(laub), form: Math.random() < .45 ? 1 : 0,
          rot: jzbZ(0, 6.3), vr: jzbZ(-14, 14), vx: B.dir * jzbZ(170, 340), vy: -jzbZ(90, 230), ph: jzbZ(0, 6.3), fq: jzbZ(1, 2) });
        for (let q = 0; q < 6; q++) J.fx.push({ typ: "nuss", x: L.pos[i] + jzbZ(-.35, .35) * L.fs, y: L.y - jzbZ(.1, .7) * L.fs, s: jzbZ(.9, 1.3), nuss: q % 2 === 0, rot: jzbZ(0, 6.3), vr: jzbZ(-10, 10),
          vx: B.dir * jzbZ(80, 200), vy: -jzbZ(60, 160), a: 1 });
      }
      if (N.weg.filter(Boolean).length >= N.n) J.nussName = null;
    }
    for (const pz of J.pilze || []) if (!pz.weg && pz.wachs > .3 && pz.x > lo && pz.x < hi) { // 2.389.0 KC-CLUB-HERBST-PILZE: Pilze wirbeln davon
      pz.weg = true; J.fx.push({ typ: "pilz", x: pz.x, y: J.h - 2, art: pz.art, s: pz.s * pz.wachs, rot: pz.kipp, vr: B.dir * jzbZ(8, 18), vx: B.dir * jzbZ(170, 320), vy: -jzbZ(150, 280), a: 1, leicht: true });
    }
    if (Math.random() < dt * 22) B.luft.push({ x: B.x + B.dir * 16 * k, y: J.h - 4 * k - jzbZ(0, 6) * k, l: jzbZ(10, 22) * k, a: .8 });
  }
  for (const l of B.luft) { l.x += B.dir * 260 * k * dt; l.a -= dt * 1.6; }
  B.luft = B.luft.filter((l) => l.a > 0);
  if (B.x < -60 * k || B.x > J.w + 60 * k) J.blaeser = null;
}
function jzbBlaeserMalen(c, B, k) { // Gärtner in Warnjacke mit Gehörschutz und Rückentrage-Laubbläser
  const J = JZB, gy = J.h - 1, geht = B.t * 9, s = Math.sin(geht) * 2.4, brumm = Math.sin(B.t * 60) * .25;
  c.save(); c.translate(B.x, gy); c.scale(B.dir * k * 1.1, k * 1.1); c.lineCap = "round"; c.lineJoin = "round";
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1; // Luftstrom aus der Düse
  for (const l of B.luft) { c.globalAlpha = Math.max(0, l.a); const lx = (l.x - B.x) / (B.dir * k * 1.1), ly = (l.y - gy) / (k * 1.1); c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + l.l / (k * 1.1), ly + 1); c.stroke(); }
  c.globalAlpha = 1;
  c.strokeStyle = "#2d3a4a"; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-2, -12); c.lineTo(-2 + s, -1); c.moveTo(2, -12); c.lineTo(2 - s, -1); c.stroke(); // Hose
  c.fillStyle = "#2b1d14"; c.fillRect(-4 + s, -1.6, 4.2, 1.8); c.fillRect(-.2 - s, -1.6, 4.2, 1.8); // Schuhe
  c.fillStyle = "#4a4f57"; c.beginPath(); c.roundRect(-11, -26 + brumm, 7, 12, 2); c.fill(); // Bläser auf dem Rücken
  c.fillStyle = "#ff7a00"; c.fillRect(-11, -22 + brumm, 7, 3); c.fillStyle = "#222"; c.beginPath(); c.arc(-7.5, -16 + brumm, 1.6, 0, 7); c.fill();
  c.fillStyle = "#ff8c1a"; c.beginPath(); c.moveTo(-5, -12); c.quadraticCurveTo(-6, -26, 0, -27); c.quadraticCurveTo(6, -26, 5, -12); c.closePath(); c.fill(); // Warnjacke
  c.fillStyle = "#e9f2f5"; c.fillRect(-5.4, -17, 10.6, 1.3); c.fillRect(-5.2, -21.5, 10.2, 1.1); // Reflexstreifen
  c.strokeStyle = "#555b63"; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-6, -15); c.quadraticCurveTo(2, -10, 10, -9); c.lineTo(17, -4); c.stroke(); // Schlauch + Rohr
  c.strokeStyle = "#ff7a00"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(9, -9.5); c.lineTo(17, -4); c.stroke(); c.fillStyle = "#333"; c.beginPath(); c.arc(17.4, -3.8, 1.4, 0, 7); c.fill(); // Düse
  c.strokeStyle = "#ff8c1a"; c.lineWidth = 2.6; c.beginPath(); c.moveTo(2, -23); c.lineTo(9, -10); c.stroke(); // Arm am Rohr
  c.fillStyle = "#f2c49b"; c.beginPath(); c.arc(9, -10, 1.5, 0, 7); c.fill();
  c.fillStyle = "#f2c49b"; c.beginPath(); c.arc(1, -31, 4.4, 0, 7); c.fill(); // Kopf
  c.fillStyle = "#2f6f3a"; c.beginPath(); c.arc(1, -32.2, 4.6, Math.PI * 1.05, Math.PI * 2); c.fill(); c.fillRect(1, -33, 6.5, 1.6); // Schirmmütze
  c.fillStyle = "#e63946"; c.beginPath(); c.arc(-.4, -30.6, 2.2, 0, 7); c.fill(); c.strokeStyle = "#e63946"; c.lineWidth = 1; c.beginPath(); c.arc(1, -31, 5.2, Math.PI * 1.15, Math.PI * 1.75); c.stroke(); // Gehörschutz
  c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(3.6, -31.6, .6, 0, 7); c.fill();
  c.restore();
}
// 🌰 Eicheln und Haselnüsse – ein paar liegen immer da (unter dem Laub); ist eine weg, fällt später eine neue vom Baum
function jzbEichelnPruefen(dt) {
  const J = JZB, k = J.k;
  if (!J.eicheln) { const n = Math.max(4, Math.min(7, Math.round(J.w / 70))); J.eicheln = Array.from({ length: n }, (_, i) => jzbEichelNeu(jzbBodenX((i + jzbZ(.15, .85)) / n, 20 * k), i % 3 === 1, 0)); }
  const frei = J.eicheln.filter((e) => !e.weg).length;
  if (frei < 3 && (J.eichelUhr = (J.eichelUhr ?? jzbZ(20, 40)) - dt) <= 0) { J.eichelUhr = null; J.eicheln.push(jzbEichelNeu(jzbBodenX(Math.random(), 20 * k), Math.random() < .4, -J.h)); }
  for (const e of J.eicheln) if (e.dy < 0) { e.v = (e.v || 0) + 300 * dt; e.dy = Math.min(0, e.dy + e.v * dt); if (!e.dy) { e.hopp = .25; for (let i = 0; i < 4; i++) J.fx.push({ typ: "funke", x: e.x, y: J.h - 3, vx: jzbZ(-25, 25), vy: -jzbZ(10, 30), s: 1.4, a: .8, farbe: "#c9a36b" }); } }
  for (const e of J.eicheln) if (e.hopp) e.hopp = Math.max(0, e.hopp - dt);
  J.eicheln = J.eicheln.filter((e) => !e.weg);
}
// 🍄 2.389.0 KC-CLUB-HERBST-PILZE (Wunsch Hansi „unten ein paar Pilze wachsen lassen, auch Fliegenpilze – kommt der Laubbläser, pustet er sie
// weg und sie fliegen wirbelnd durch die Gegend“): 3–5 Pilze (Fliegenpilz, Steinpilz, kleine Braune) wachsen langsam aus dem Boden; der
// Laubbläser pustet sie wie das Laub davon. Später wächst an anderer Stelle ein neuer. Nur Herbst, nur Anzeige auf diesem Gerät.
const JZB_PILZ_ARTEN = ["fliegen", "stein", "braun"];
// 2.392.0 (Fund Hansi): etwas kleiner und höchstens 2 Fliegenpilze gleichzeitig
const jzbPilzNeu = (x, wachs = 0) => ({ x, art: JZB_PILZ_ARTEN[Math.random() < .45 && (JZB.pilze || []).filter((pz) => pz.art === "fliegen" && !pz.weg).length < 2 ? 0 : Math.random() < .5 ? 1 : 2], s: jzbZ(1.1, 1.4), kipp: jzbZ(-.12, .12), wachs, tempo: jzbZ(.12, .25) });
function jzbPilzePruefen(dt) {
  const J = JZB, k = J.k;
  if (!J.pilze) { const n = Math.max(3, Math.min(5, Math.round(J.w / 90))); J.pilze = []; for (let i = 0; i < n; i++) J.pilze.push(jzbPilzNeu(jzbBodenX((i + jzbZ(.2, .8)) / n, 30 * k), 1)); }
  for (const pz of J.pilze) if (pz.wachs < 1) pz.wachs = Math.min(1, pz.wachs + pz.tempo * dt);
  J.pilze = J.pilze.filter((pz) => !pz.weg);
  if (J.pilze.length < 3 && !J.blaeser && (J.pilzUhr = (J.pilzUhr ?? jzbZ(12, 30)) - dt) <= 0) { J.pilzUhr = null; J.pilze.push(jzbPilzNeu(jzbBodenX(Math.random(), 30 * k))); }
}
function jzbPilzeMalen(c) {
  const J = JZB; if (J.saison !== "herbst" || !J.pilze) return;
  for (const pz of J.pilze) jzbPilzMalen(c, pz.x, J.h - 1, pz.art, pz.kipp, J.k, pz.s, pz.wachs);
}
function jzbPilzMalen(c, x, y, art, kipp, k, gross = 1, wachs = 1) {
  if (wachs <= 0) return;
  c.save(); c.translate(x, y); c.rotate(kipp); c.scale(k * gross * (.35 + .65 * wachs), k * gross * wachs);
  const stiel = art === "stein" ? "#efe3c8" : art === "braun" ? "#e8d9b8" : "#fbf7ee", sb = art === "stein" ? 3.2 : art === "braun" ? 1.3 : 2;
  const sh = art === "braun" ? 7 : art === "stein" ? 7.5 : 10;
  c.fillStyle = stiel; c.beginPath(); c.moveTo(-sb, 0); c.quadraticCurveTo(-sb * 1.25, -sh * .5, -sb * .8, -sh); c.lineTo(sb * .8, -sh); c.quadraticCurveTo(sb * 1.25, -sh * .5, sb, 0); c.closePath(); c.fill();
  c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = .5; c.stroke();
  if (art === "fliegen") { c.fillStyle = "#fff"; c.beginPath(); c.ellipse(0, -sh * .62, sb * 1.6, .9, 0, 0, 7); c.fill(); } // Manschette
  const hw = art === "braun" ? 4.2 : art === "stein" ? 6.8 : 7.2, hh = art === "braun" ? 3.6 : art === "stein" ? 5 : 5.6;
  c.fillStyle = art === "fliegen" ? "#d62828" : art === "stein" ? "#7a4a22" : "#a8743e";
  c.beginPath(); c.ellipse(0, -sh, hw, hh, 0, Math.PI, 0); c.closePath(); c.fill();
  c.fillStyle = art === "fliegen" ? "#f3e7d3" : "#d9c39c"; c.fillRect(-hw * .92, -sh - .2, hw * 1.84, 1); // Unterseite (Lamellen/Röhren)
  if (art === "fliegen") { c.fillStyle = "#fff"; for (const [px, py, r] of [[-3.8, -2, .9], [-.8, -4.2, 1], [2.6, -2.6, .85], [4.6, -1.2, .6], [-5.6, -.8, .55], [.9, -1.6, .6]]) { c.beginPath(); c.arc(px, -sh + py, r, 0, 7); c.fill(); } }
  c.fillStyle = "rgba(255,255,255,.28)"; c.beginPath(); c.ellipse(-hw * .35, -sh - hh * .55, hw * .25, hh * .18, -.3, 0, 7); c.fill(); // Glanz
  c.restore();
}
// 2.392.0 KC-CLUB-HERBST-MITTE-FREI (Fund Hansi): in der Mitte legt das Eichhörnchen den Namen – dort liegen keine Eicheln und
// wachsen keine Pilze (nur Laub). jzbBodenX(u, rand) verteilt u (0…1) über den Boden OHNE den Namensbereich (+ Platz fürs Eichhörnchen).
function jzbMitteFrei() {
  const J = JZB, txt = J.nussName?.text || jzbEisNameText(); if (!txt || !J.ctx) return null;
  const L = jzbNussNameLage(txt); return [L.pos[0] - L.fs * .6 - 8 * J.k, L.pos[L.pos.length - 1] + L.fs * .6 + 40 * J.k];
}
function jzbBodenX(u, rand) {
  const J = JZB, lo = JZB_RAND + rand, hi = J.w - JZB_RAND - rand, z = jzbMitteFrei();
  const a = z ? Math.max(lo, z[0]) : lo, b = z ? Math.min(hi, z[1]) : lo, luecke = Math.max(0, b - a), frei = hi - lo - luecke;
  if (frei < 40 * J.k) return lo + u * (hi - lo);
  const x = lo + u * frei; return x > a ? x + luecke : x;
}
const jzbEichelNeu = (x, nuss, dy) => ({ x, nuss, dy, kipp: jzbZ(-.6, .6), v: 0, hopp: 0 });
function jzbEichelMalen(c, x, y, nuss, kipp, k, gross = 1) {
  c.save(); c.translate(x, y); c.rotate(kipp); c.scale(k * gross, k * gross);
  if (nuss) { // Haselnuss: rund, glänzend braun mit heller Kappe unten
    c.fillStyle = "#8a5a2b"; c.beginPath(); c.ellipse(0, -3.4, 3.4, 3.6, 0, 0, 7); c.fill();
    c.fillStyle = "#d9b98a"; c.beginPath(); c.ellipse(0, -.6, 2.6, 1.2, 0, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.ellipse(-1.2, -4.6, .9, 1.4, -.4, 0, 7); c.fill();
  } else { // Eichel: längliche Frucht mit genarbtem Hütchen und Stiel
    c.fillStyle = "#b8862f"; c.beginPath(); c.ellipse(0, -3.2, 2.5, 3.4, 0, 0, 7); c.fill();
    c.fillStyle = "#6b4a24"; c.beginPath(); c.ellipse(0, -5.6, 2.9, 1.7, 0, Math.PI, 0); c.fill(); c.fillRect(-2.9, -5.7, 5.8, 1);
    c.strokeStyle = "#6b4a24"; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -7); c.lineTo(.6, -8.4); c.stroke();
    c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(-.9, -3, .6, 1.4, 0, 0, 7); c.fill();
  }
  c.restore();
}
function jzbEichelnMalen(c) {
  const J = JZB; if (J.saison !== "herbst" || !J.eicheln) return;
  for (const e of J.eicheln) jzbEichelMalen(c, e.x, J.h - 1 + e.dy - Math.sin((e.hopp || 0) * 12) * (e.hopp || 0) * 8, e.nuss, e.kipp + e.dy * .02, J.k, 1.4);
}
// 🐿️ Eichhörnchen: hüpft zur nächsten Nuss, stopft sie sich in die Backe und flitzt zurück
// 2.329.0 KC-CLUB-NUSSNAME (Wunsch Hansi, Variante 2): wie im Winter der Name aus Eis – im Herbst bringt das Eichhörnchen ab und an eine Nuss
// in der Backe und legt daraus den nächsten Buchstaben des Vornamens (jeder Buchstabe aus vielen kleinen Eicheln und Haselnüssen). Ist der Name
// fertig, sitzt es stolz daneben. Nach einer Weile holt es sich die Nüsse Buchstabe für Buchstabe wieder (vom Ende her) – dann beginnt es von vorn.
// Dazwischen frisst es weiter Nüsse vom Boden. Nur Herbst, nur auf diesem Gerät (nichts geht an den Server).
function jzbNussNameLage(text = JZB.nussName.text) {
  // 2.398.0 KC-CLUB-NUSSNAME-LESBAR (Fund Hansi „Name etwas größer, Buchstaben besser erkennbar“): ein Drittel größer
  const J = JZB, c = J.ctx, fs = Math.round(Math.min(36 * J.k, J.h * .5)), z = [...text], f = `900 ${fs}px "Arial Black", "Segoe UI", Roboto, Arial, sans-serif`;
  c.save(); c.font = f; const b = z.map((ch) => c.measureText(ch).width + 3 * J.k); c.restore();
  const ges = b.reduce((a, v) => a + v, 0); let x = Math.max(JZB_RAND, (J.w - ges) / 2);
  return { fs, f, z, pos: b.map((w) => { const m = x + w / 2; x += w; return m; }), y: J.h - 2 };
}
function jzbNussPunkte(ch, fs, f) { // Rasterpunkte innerhalb des Buchstabens – dort liegt je eine kleine Nuss (zwischengespeichert)
  const J = JZB, key = `${ch}|${fs}`; J.nussPunkte = J.nussPunkte || new Map(); if (J.nussPunkte.has(key)) return J.nussPunkte.get(key);
  const cv = document.createElement("canvas"), w = Math.ceil(fs * 1.4), h = Math.ceil(fs * 1.25), c = cv.getContext("2d"); cv.width = w; cv.height = h;
  c.font = f; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#000"; c.fillText(ch, w / 2, h - fs * .12);
  const d = c.getImageData(0, 0, w, h).data, st = Math.max(2.4, fs / 10.5), pk = []; // 2.398.0: dichter → klarere Kanten
  for (let y = st / 2; y < h; y += st) for (let x = st / 2 + ((Math.round(y / st) % 2) ? st / 2 : 0); x < w; x += st)
    if (d[(Math.floor(y) * w + Math.floor(x)) * 4 + 3] > 120) pk.push([x - w / 2, y - (h - fs * .12), pk.length % 3 === 0, Math.sin(pk.length * 7.3) * .5]);
  const r = { pk, st }; J.nussPunkte.set(key, r); return r;
}
function jzbNussNameMalen(c) {
  const J = JZB, N = J.nussName; if (J.saison !== "herbst" || !N || !N.n) return;
  const L = jzbNussNameLage();
  for (let i = 0; i < N.n; i++) {
    if (N.weg?.[i]) continue; // 2.356.0: vom Laubbläser weggepustet
    const { pk, st } = jzbNussPunkte(L.z[i], L.fs, L.f), neu = Math.min(1, (J.T - (N.gelandet[i] ?? -9)) / .4);
    c.save(); c.font = L.f; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.globalAlpha = .75 * neu; c.fillStyle = "#3a1f0a"; // dunkler Untergrund – damit man den Buchstaben gut lesen kann
    c.lineJoin = "round"; c.lineWidth = Math.max(2, L.fs / 9); c.strokeStyle = "rgba(255,236,200,.55)"; // 2.398.0: heller Rand trennt den Buchstaben vom Hintergrund
    c.strokeText(L.z[i], L.pos[i], L.y - L.fs * .12 + st * .45); c.fillText(L.z[i], L.pos[i], L.y - L.fs * .12 + st * .45); c.restore();
    for (const [px, py, nuss, kipp] of pk) { const q = jzbEase(Math.min(1, neu * 1.6 - (py / -L.fs) * .6)); if (q <= 0) continue; // Nüsse purzeln von unten nach oben dazu
      jzbEichelMalen(c, L.pos[i] + px, L.y + py + st * .45 - (1 - q) * 6 * J.k, nuss, kipp, 1, st / 6.2 * (.6 + .4 * q)); }
  }
}
function jzbHerbstTiere(dt) {
  const J = JZB, k = J.k;
  if (J.saison !== "herbst") { J.eicheln = null; J.pilze = null; J.hoernchen = null; J.blaeser = null; J.nussName = null; J.hund = null; J.kuerbis = null; return; }
  jzbBlaeserSchritt(dt); jzbEichelnPruefen(dt); jzbKuerbisSchritt(dt); jzbPilzePruefen(dt); jzbStreunerSchritt(dt); // 2.369.0 KC-CLUB-HERBST-HUND · 2.389.0 Pilze · 2.434.0 Kürbis
  const txt = jzbEisNameText(); if (J.nussName && J.nussName.text !== txt) J.nussName = null;
  if (!J.nussName && txt) J.nussName = { text: txt, n: 0, gelandet: [], fertig: null };
  const N = J.nussName, laenge = N ? [...N.text].length : 0;
  if (N && N.fertig !== null && !J.blaeser && !J.hoernchen && J.T - N.fertig > (J.vorschau ? 15 : 75) && !N.weg?.some(Boolean)) jzbBlaeserStart(); // 2.356.0: Name eine Weile fertig → Laubbläser kommt
  if (!J.hoernchen && (J.hoernchenUhr = (J.hoernchenUhr ?? (J.extra === "hoernchen" ? 3 : jzbZ(15, 35))) - dt) <= 0) {
    let art = "essen";
    if (N && N.n < laenge && !N.fertig) art = !J.nussErster || Math.random() < .7 ? "bringen" : "essen";
    // 2.356.0 KC-CLUB-NAME-WEG: das Eichhörnchen holt die Nüsse nicht mehr – der Laubbläser pustet den Namen weg (siehe oben)
    const frei = J.eicheln.filter((e) => !e.dy && !e.reserviert);
    if (J.blaeser || (art === "essen" && !frei.length)) J.hoernchenUhr = 8;
    else {
      const dir = Math.random() < .5 ? 1 : -1, start = dir > 0 ? -24 * k : J.w + 24 * k;
      if (art === "essen") { const ziel = frei.sort((a, b) => Math.abs(a.x - start) - Math.abs(b.x - start))[Math.min(frei.length - 1, Math.floor(Math.random() * 2))];
        ziel.reserviert = true; J.hoernchen = { art, dir, x: start, t: 0, ziel, zx: ziel.x - dir * 9 * k, phase: "hin", backe: 0, nuss: ziel.nuss, halt: 0 }; }
      else { J.nussErster = true; const L = jzbNussNameLage(), i = art === "bringen" ? N.n : N.n - 1, zx = L.pos[i] - dir * (L.fs * .45 + 9 * k);
        J.hoernchen = { art, dir, x: start, t: 0, i, zx, phase: "hin", backe: art === "bringen" ? 1 : 0, nuss: Math.random() < .5, halt: 0 }; }
    }
  }
  const H = J.hoernchen; if (!H) return;
  H.t += dt;
  if (H.phase === "hin") {
    H.x += H.dir * 105 * k * dt;
    if ((H.zx - H.x) * H.dir <= 0) { H.x = H.zx; H.phase = "nehmen"; H.halt = 0; }
  } else if (H.phase === "nehmen") { // schnuppern, Nuss greifen/ablegen – kauen
    H.halt += dt;
    if (H.art === "essen") {
      if (H.halt > .7 && !H.ziel.weg) { H.ziel.weg = true; for (const b of J.liegt) if (Math.abs(b.x - H.x) < 14 * k) b.wackel = 1; }
      if (H.halt > .7) H.backe = Math.min(1, H.backe + dt * 3);
    } else if (H.art === "bringen") {
      if (H.halt > .3) H.backe = Math.max(0, H.backe - dt * 2.5);
      if (H.halt > .6 && !H.fertig && N && N.n === H.i) { H.fertig = true; N.gelandet[N.n] = J.T; N.n++; // der nächste Buchstabe liegt da
        const L = jzbNussNameLage(); for (let q = 0; q < 8; q++) J.fx.push({ typ: "funke", x: L.pos[H.i] + jzbZ(-8, 8) * k, y: L.y - jzbZ(0, L.fs), vx: jzbZ(-30, 30), vy: -jzbZ(10, 50), s: jzbZ(1.4, 2.4), a: 1, farbe: q % 2 ? "#ffd166" : "#fff6c2" });
        if (N.n >= laenge) N.fertig = J.T; }
    } else if (H.art === "holen") {
      if (H.halt > .6 && !H.fertig && N && N.n === H.i + 1) { H.fertig = true; N.n--; if (!N.n) J.nussName = null; } // Buchstabe weg – Nüsse in die Backe
      if (H.halt > .6) H.backe = Math.min(1, H.backe + dt * 3);
    }
    if (H.halt > 1.9) { if (H.art === "bringen" && N && N.fertig !== null && N.n >= laenge && !H.stolz) { const L = jzbNussNameLage(); H.phase = "zumEnde"; H.stolz = true; H.dir = 1; H.zx = L.pos[L.pos.length - 1] + L.fs * .5 + 16 * k; } else { H.phase = "weg"; H.dir = H.x < J.w / 2 ? -1 : 1; } } // zur näheren Seite davon
  } else if (H.phase === "zumEnde") { // hüpft ans Ende des Namens …
    H.x += H.dir * 70 * k * dt; if ((H.zx - H.x) * H.dir <= 0) { H.x = H.zx; H.dir = -1; H.phase = "stolz"; H.halt = 0; }
  } else if (H.phase === "stolz") { // … und sitzt stolz neben seinem fertigen Werk
    H.halt += dt; if (Math.random() < dt * 3) J.fx.push({ typ: "funke", x: H.x + jzbZ(-10, 10) * k, y: J.h - jzbZ(18, 30) * k, vx: 0, vy: -20, s: 2, a: 1, farbe: "#ffd166" });
    if (H.halt > 4.5) { H.phase = "weg"; H.dir = H.x < J.w / 2 ? -1 : 1; }
  } else { H.x += H.dir * 135 * k * dt; if (H.x < -40 * k || H.x > J.w + 40 * k) { const bau = J.nussName && !J.nussName.fertig; J.hoernchen = null; J.hoernchenUhr = bau ? jzbZ(12, 25) : jzbZ(35, 75); } }
  if (H.phase !== "nehmen" && H.phase !== "stolz") for (const b of J.liegt) if (Math.abs(b.x - H.x) < 8 * k) b.wackel = 1; // raschelt durchs Laub
}
// ---------- 2.369.0 KC-CLUB-HERBST-HUND (Wunsch Hansi „in der Herbst-Animation ab und an einen streunenden Hund mit wedelndem Schwanz durchs Bild laufen
// lassen; ca. in der Mitte bleibt er stehen, schnuppert ein bisschen rum und läuft dann weiter“) ----------
// Etwa alle 1½–4 Minuten (Vorschau „hund“: nach 3 s): trottet von einer Seite herein, bleibt um die Mitte stehen, senkt die Nase ins Laub (Blätter rascheln),
// hebt kurz den Kopf, schnuppert noch einmal und trottet zur anderen Seite hinaus. Der Schwanz wedelt die ganze Zeit – beim Schnuppern besonders schnell.
function jzbStreunerSchritt(dt) {
  const J = JZB, k = J.k;
  if (!J.hund) {
    if (J.blaeser) return; // nicht mitten durch den Laubbläser
    J.hundUhr = (J.hundUhr ?? (J.extra === "hund" ? 3 : jzbZ(30, 70))) - dt;
    if (J.hundUhr > 0) return;
    const dir = Math.random() < .5 ? 1 : -1;
    J.hund = { dir, x: dir > 0 ? -30 * k : J.w + 30 * k, zx: J.w * jzbZ(.42, .58), phase: "hin", t: 0, halt: 0, dauer: jzbZ(3.2, 4.8) };
    return;
  }
  const D = J.hund; D.t += dt;
  if (D.phase === "hin" && D.rollt) { // 2.434.0 KC-CLUB-HERBST-KUERBIS: schiebt den Kürbis mit der Nase vor sich her
    D.x += D.dir * 34 * k * dt; const K = J.kuerbis;
    if (K?.rollt) { const nx = D.x + D.dir * 34 * k; K.rot += (nx - K.x) / (K.reff || 9.5 * k); K.x = nx; if ((K.x - K.ziel) * D.dir >= 0) { K.x = K.ziel; K.rot = 0; K.rollt = false; D.zx = D.x; D.phase = "schnuppern"; D.halt = 0; } }
    else { D.zx = D.x; D.phase = "schnuppern"; D.halt = 0; }
  } else if (D.phase === "hin") { D.x += D.dir * 62 * k * dt; if ((D.zx - D.x) * D.dir <= 0) { D.x = D.zx; D.phase = "schnuppern"; D.halt = 0; } }
  else if (D.phase === "schnuppern") {
    D.halt += dt;
    if (D.halt > 1.4 && D.halt < 1.9) D.x += D.dir * 10 * k * dt; // zwei kleine Schritte weiter
    if (Math.random() < dt * 4) for (const b of J.liegt || []) if (Math.abs(b.x - (D.x + D.dir * 16 * k)) < 7 * k) b.wackel = 1; // die Nase raschelt im Laub
    if (D.halt > D.dauer) { D.phase = "weg"; if (D.rollt) D.dir = -D.dir; } // nach dem Kürbis: umdrehen und zurücktrotten
  } else { D.x += D.dir * 70 * k * dt; if (D.x < -40 * k || D.x > J.w + 40 * k) { J.hund = null; J.hundUhr = J.extra === "hund" ? 6 : jzbZ(90, 240); } }
  if (D.phase !== "schnuppern") for (const b of J.liegt || []) if (Math.abs(b.x - D.x) < 9 * k) b.wackel = 1; // trottet durchs Laub
}
// ---------- 2.434.0 KC-CLUB-HERBST-KUERBIS (Wunsch Hansi „im Herbst einen Halloween-Kürbis; wenn das Abend-Schema da ist, soll ein Licht wie eine
// flackernde Kerze aus dem Kürbis leuchten – der Hund soll den Kürbis kurz vor dem Wechsel von Tag auf Nacht hereinrollen“) ----------
// Etwa 20 Min. vor Sonnenuntergang (Tag/Nacht automatisch) schiebt der Hund mit der Nase einen geschnitzten Kürbis herein, schnuppert daran und
// trottet zurück. Sobald das Nacht-Schema da ist, flackert darin eine Kerze (Gesicht und Schein); am Morgen ist der Kürbis wieder weg.
// Wer die App erst abends öffnet, findet ihn schon da. Vorschau „🎃 Kürbis-Hund“: nach 3 s rollt er herein, 3 s später brennt die Kerze.
const JZB_KUERBIS_VORHER_MIN = 20;
function jzbKuerbisZeit() {
  if (JZB.extra === "kuerbis") return "vorschau";
  if (istNacht()) return "nacht";
  if (DS.modus === "auto" && LICHT_NACHT === null) { const bis = sonne().unter - Date.now(); if (bis > 0 && bis < JZB_KUERBIS_VORHER_MIN * 60000) return "vorher"; }
  return "tag";
}
function jzbKuerbisSchritt(dt) {
  const J = JZB, k = J.k, K = J.kuerbis;
  if (!J.kuerbisZ || (J.kuerbisZ.uhr -= dt) <= 0) J.kuerbisZ = { z: jzbKuerbisZeit(), uhr: 5 }; // alle 5 s nachsehen reicht
  const z = J.kuerbisZ.z, ziel = Math.max(JZB_RAND + 14 * k, J.w * .34); // rechts neben den Pilzen
  if (z === "tag") { if (K && !K.rollt) J.kuerbis = null; return; }
  if (!K) {
    if (z === "nacht") { J.kuerbis = { x: ziel, rot: 0, an: 0, rollt: false, ziel, liegt: 9 }; return; } // abends geöffnet: er steht schon da
    if (z === "vorschau" && (J.kuerbisUhr = (J.kuerbisUhr ?? 3) - dt) > 0) return;
    if (J.hund || J.blaeser) return; // erst wenn der Hund frei ist – nie mitten durch den Laubbläser
    const dir = -1; J.hund = { dir, x: J.w + 60 * k, zx: 0, phase: "hin", t: 0, halt: 0, dauer: jzbZ(2.6, 3.4), rollt: true };
    const x0 = J.hund.x + dir * 34 * k, n = Math.max(1, Math.round(Math.abs(x0 - ziel) / (2 * Math.PI * 9.5 * k))); // ganze Umdrehungen → kommt aufrecht an
    J.kuerbis = { x: x0, rot: 0, an: 0, rollt: true, ziel, liegt: 0, reff: Math.abs(x0 - ziel) / (2 * Math.PI * n) };
    return;
  }
  if (K.rollt) return;
  K.liegt += dt; const soll = z === "nacht" || (z === "vorschau" && K.liegt > 3) ? 1 : 0;
  K.an += (soll - K.an) * Math.min(1, dt * (soll ? .8 : 2));
}
function jzbHerbstKuerbisMalen(c, K, k) {
  const J = JZB, T = J.T, r = 9.5 * k, yb = J.h - 1, cx = K.x, cy = yb - r * .82;
  const fl = .74 + .18 * Math.sin(T * 13) * Math.sin(T * 7.3) + .08 * Math.sin(T * 31 + 1), an = Math.max(0, Math.min(1, K.an)) * fl; // flackernde Kerze
  if (an > .02) {
    const gl = c.createRadialGradient(cx, cy, r * .2, cx, cy, r * 3.4); gl.addColorStop(0, `rgba(255,190,70,${.5 * an})`); gl.addColorStop(1, "rgba(255,140,20,0)");
    c.fillStyle = gl; c.beginPath(); c.arc(cx, cy, r * 3.4, 0, 7); c.fill();
    c.fillStyle = `rgba(255,180,60,${.28 * an})`; c.beginPath(); c.ellipse(cx, yb, r * 2.6, r * .45, 0, 0, 7); c.fill(); // Lichtschein am Boden
  }
  c.save(); c.translate(cx, cy); c.rotate(K.rot);
  const g = c.createRadialGradient(-r * .3, -r * .3, r * .2, 0, 0, r * 1.2); g.addColorStop(0, an > .02 ? "#ffb24d" : "#ffa23a"); g.addColorStop(1, "#c9530a"); c.fillStyle = g;
  for (const [dx, w] of [[-.45, .62], [.45, .62], [0, .7]]) { c.beginPath(); c.ellipse(dx * r, 0, r * w, r * .82, 0, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(120,50,0,.35)"; c.lineWidth = 1; for (const dx of [-.35, .35]) { c.beginPath(); c.ellipse(dx * r, 0, r * .3, r * .78, 0, 0, 7); c.stroke(); }
  c.fillStyle = "#4e6b2a"; c.fillRect(-r * .1, -r * 1.02, r * .2, r * .3); c.strokeStyle = "#4e6b2a"; c.lineWidth = .8; c.beginPath(); c.moveTo(r * .1, -r * .95); c.quadraticCurveTo(r * .45, -r * 1.2, r * .4, -r * .85); c.stroke();
  const gesicht = () => { c.beginPath(); for (const s of [-1, 1]) { c.moveTo(s * r * .45, -r * .32); c.lineTo(s * r * .2, -r * .02); c.lineTo(s * r * .62, -r * .02); c.closePath(); }
    c.moveTo(-r * .6, r * .22); for (let j = 0; j <= 6; j++) c.lineTo(-r * .6 + j * r * .2, r * (j % 2 ? .32 : .22)); c.lineTo(r * .5, r * .5); c.lineTo(-r * .5, r * .5); c.closePath(); };
  c.fillStyle = "#3b1a06"; gesicht(); c.fill(); // geschnitzt, dunkel
  if (an > .02) { c.fillStyle = `rgba(255,${Math.round(200 + 40 * fl)},80,${Math.min(1, .25 + .85 * an)})`; gesicht(); c.fill(); }
  c.restore();
}
function jzbHundBein(c, x, ph, hinten, laeuft, farbe) {
  const L = 4.25, schw = laeuft ? Math.sin(ph) * .5 : 0, knick = laeuft ? Math.max(0, Math.cos(ph)) * .9 : 0;
  const a1 = hinten ? schw + .38 + knick * .25 : schw - .05 - knick * .2, a2 = hinten ? schw - .38 - knick * .7 : schw - .05 - knick;
  const kx = x + Math.sin(a1) * L, ky = -8 + Math.cos(a1) * L, fx = kx + Math.sin(a2) * L, fy = Math.min(0, ky + Math.cos(a2) * L);
  c.strokeStyle = farbe; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, -8.6); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = 1.7; c.beginPath(); c.moveTo(kx, ky); c.lineTo(fx, fy); c.stroke();
  c.fillStyle = farbe; c.beginPath(); c.ellipse(fx + .7, fy - .4, 1.3, .8, 0, 0, 7); c.fill(); // Pfote
}
function jzbStreunerMalen(c, D, k) {
  const J = JZB, laeuft = D.phase !== "schnuppern" || (D.halt > 1.4 && D.halt < 1.9), sp = laeuft ? (D.t * 9) % (Math.PI * 2) : 0;
  // Kopf: beim Schnuppern runter zur Erde (zwischendurch kurz hoch), die Nase zuckt
  let kopf = 0; if (D.phase === "schnuppern") { const h = D.halt; kopf = h < .4 ? h / .4 : h > 2.1 && h < 2.6 ? 1 - (h - 2.1) / .5 * .8 : h >= 2.6 && h < 3 ? .2 + (h - 2.6) / .4 * .8 : h > D.dauer - .4 ? Math.max(0, (D.dauer - h) / .4) : 1; kopf = Math.max(0, Math.min(1, kopf)); }
  if (D.rollt && D.phase === "hin") kopf = .4; // Nase am Kürbis
  const zuck = D.phase === "schnuppern" && kopf > .8 ? Math.sin(D.t * 26) * .5 : 0;
  const wedel = Math.sin(D.t * (D.phase === "schnuppern" ? 22 : 13)) * (D.phase === "schnuppern" ? .7 : .45), hopp = laeuft ? Math.abs(Math.sin(sp)) * 1.2 : 0;
  c.save(); c.translate(D.x, J.h - 1 - hopp * k); c.scale(D.dir * k * 1.4, k * 1.4); c.lineCap = "round"; c.lineJoin = "round";
  const fell = "#8a6a4a", dunkel = "#5e4630";
  // Schwanz (wedelt)
  c.save(); c.translate(-9, -11); c.rotate(-1.05 + wedel); c.strokeStyle = fell; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-1, -5, 2, -8.5); c.stroke();
  c.strokeStyle = "#c9a77f"; c.lineWidth = 1; c.beginPath(); c.moveTo(1.4, -7); c.lineTo(2.2, -8.6); c.stroke(); c.restore();
  // Beine (hinten dunkler, vorne heller), laufen über Kreuz – 2.393.0 KC-CLUB-HUND-GELENKE (Fund Hansi „läuft unnatürlich, keine Gelenke“):
  // je Bein Ober- und Unterschenkel mit Knie bzw. Sprunggelenk und Pfote; beim Vorschwingen knickt das Bein ein und die Pfote hebt sich
  jzbHundBein(c, -6, sp + Math.PI, true, laeuft, dunkel); jzbHundBein(c, 5, sp, false, laeuft, dunkel);
  jzbHundBein(c, -4, sp, true, laeuft, fell); jzbHundBein(c, 7, sp + Math.PI, false, laeuft, fell);
  // Körper mit Fleck und etwas struppigem Fell
  c.fillStyle = fell; c.beginPath(); c.ellipse(0, -10.5, 9.5, 4.6, 0, 0, 7); c.fill();
  c.fillStyle = dunkel; c.beginPath(); c.ellipse(-3, -12, 3.6, 2.5, -.2, 0, 7); c.fill();
  c.strokeStyle = "#6f5439"; c.lineWidth = .8; for (const x of [-6, -2, 2]) { c.beginPath(); c.moveTo(x, -14.6); c.lineTo(x + 1.2, -16); c.stroke(); }
  // Hals und Kopf (senkt sich zum Schnuppern) – 2.432.0 KC-CLUB-HUND-KOPF (Wunsch Hansi „naturgetreuer – der Kopf ist zu hoch und evtl. zu lang“):
  // kräftiger Hals schräg nach vorn, Kopf etwa auf Rückenhöhe, kleiner Schädel mit schmaler werdender Schnauze, Schlappohr hängt am Schädel
  c.save(); c.translate(7.5, -12); c.rotate(kopf * 1.2);
  c.fillStyle = fell; c.beginPath(); c.moveTo(-3, 2); c.bezierCurveTo(-1.4, -2.6, 2, -5.2, 4.8, -5.3); c.lineTo(6.4, -1); c.quadraticCurveTo(2.6, 2.8, -2.2, 2.4); c.closePath(); c.fill(); // Hals, oben glatt in den Rücken
  c.beginPath(); c.ellipse(5.6, -3.3, 3, 2.8, .15, 0, 7); c.fill(); // Schädel
  c.beginPath(); c.moveTo(6.6, -5); c.quadraticCurveTo(8.6, -4.4, 10 + zuck * .3, -3.5); c.quadraticCurveTo(10.6 + zuck * .3, -2.4, 9.8, -1.8); c.lineTo(7, -1); c.closePath(); c.fill(); // Schnauze, vorn schmaler
  c.strokeStyle = dunkel; c.lineWidth = .45; c.beginPath(); c.moveTo(9.4, -1.9); c.quadraticCurveTo(8.4, -1.6, 7.8, -1.9); c.stroke(); // Maul
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(10.1 + zuck * .4, -3.1, .85, 0, 7); c.fill(); // Nase
  c.beginPath(); c.arc(6.7, -4, .55, 0, 7); c.fill(); // Auge
  c.fillStyle = dunkel; c.beginPath(); c.moveTo(5.2, -5.5); c.quadraticCurveTo(3.4, -5, 3.7, -1.6); c.quadraticCurveTo(4.8, -2.4, 5.8, -4.6); c.closePath(); c.fill(); // Schlappohr
  c.restore();
  // Schnupper-Wölkchen an der Nase
  if (D.phase === "schnuppern" && kopf > .8 && Math.sin(D.t * 13) > .6) { c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.arc(15.4, -2.8, 1.1, 0, 7); c.arc(17.2, -3.6, .85, 0, 7); c.fill(); }
  c.restore();
}
function jzbHoernchenMalen(c, H, k) {
  const J = JZB, laeuft = H.phase !== "nehmen" && H.phase !== "stolz", sp = laeuft ? (H.t * 11) % (Math.PI * 2) : 0, hopp = laeuft ? Math.abs(Math.sin(sp)) * 4 : 0;
  const bueck = H.phase === "nehmen" && H.halt < .9 ? Math.sin(Math.min(1, H.halt / .45) * Math.PI / 2) * .35 : 0, kau = H.phase === "nehmen" && H.halt > .9 ? Math.sin(H.t * 22) * .35 : 0;
  c.save(); c.translate(H.x, J.h - 1 - hopp * k); c.scale(H.dir * k * 1.15, k * 1.15); c.lineCap = "round"; c.lineJoin = "round";
  // buschiger Schwanz: geschwungen nach oben, weht beim Laufen
  const sw = laeuft ? Math.sin(sp) * 2 : Math.sin(H.t * 3) * 1;
  c.fillStyle = "#a9461d"; c.beginPath(); c.moveTo(-6, -5); c.bezierCurveTo(-16, -6, -18, -18 + sw, -11, -22 + sw); c.bezierCurveTo(-6, -25 + sw, -2, -20 + sw, -6, -16 + sw);
  c.bezierCurveTo(-9, -13, -6, -9, -3, -8); c.closePath(); c.fill();
  c.strokeStyle = "#d9763f"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, -7); c.bezierCurveTo(-14, -9, -15, -17 + sw, -10, -20.5 + sw); c.stroke();
  // Hinterbein, Körper, Bauch
  const bein = laeuft ? Math.sin(sp) * 2.5 : 0;
  c.fillStyle = "#8f3a17"; c.beginPath(); c.ellipse(-3 - bein, -3, 3.2, 2.6, 0, 0, 7); c.fill();
  c.save(); c.rotate(bueck); c.fillStyle = "#b5562a"; c.beginPath(); c.ellipse(0, -7, 6.6, 4.4, -.25, 0, 7); c.fill();
  c.fillStyle = "#f3dfc0"; c.beginPath(); c.ellipse(2.6, -5.2, 3, 2.3, -.3, 0, 7); c.fill();
  c.strokeStyle = "#8f3a17"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(4, -6); c.lineTo(5 + bein, -1.2); c.stroke(); // Vorderbein
  // Kopf mit Ohr-Pinsel, Auge, Nase und (nach dem Fund) dicker Backe
  c.fillStyle = "#b5562a"; c.beginPath(); c.ellipse(7, -11.5, 3.6, 3.2, .2, 0, 7); c.fill();
  c.beginPath(); c.moveTo(5.2, -14); c.lineTo(5.6, -18); c.lineTo(7.2, -14.4); c.closePath(); c.fill();
  c.strokeStyle = "#7a2f12"; c.lineWidth = .8; c.beginPath(); c.moveTo(5.6, -18); c.lineTo(5.2, -19.2); c.stroke();
  if (H.backe > 0) { const r = 1 + H.backe * 3 + kau * .4; c.fillStyle = "#c86a3a"; c.beginPath(); c.arc(7.6, -10.2, r, 0, 7); c.fill(); c.fillStyle = "rgba(255,255,255,.25)"; c.beginPath(); c.arc(7, -11, r * .45, 0, 7); c.fill(); }
  c.fillStyle = "#1b1b1b"; c.beginPath(); c.arc(8.2, -12.6, .75, 0, 7); c.fill(); c.beginPath(); c.arc(10.5, -11.4, .6, 0, 7); c.fill();
  if (H.backe > 0 && H.backe < 1) jzbEichelMalen(c, 10.6, -9.6, H.nuss, .3, .55); // Nuss verschwindet im Mäulchen
  c.restore(); c.restore();
}
function jzbExtrasSchritt(dt) {
  const J = JZB, X = J.ext || {}, W = J.wind;
  jzbWinterKinder(dt); // 2.282.0 KC-CLUB-WINTER-KINDER
  if (X.regen) { // Tropfen fallen schräg, landen in Pfützen
    if (!J.pfuetzen) J.pfuetzen = [.18, .43, .7, .9].map((p) => ({ x: J.w * p + jzbZ(-12, 12), r: 0, ringe: [] }));
    J.regenSpawn = (J.regenSpawn || 0) - dt;
    while (J.regenSpawn < 0) { J.regenSpawn += .022; (J.tropfen = J.tropfen || []).push({ x: jzbZ(-20, J.w + 10), y: -10, v: jzbZ(260, 340) }); }
    for (const t of J.tropfen) {
      t.x += (W ? W.dir * 160 * W.st : 40) * dt; t.y += t.v * dt;
      if (t.y >= J.h - 2) { t.weg = true; const p = J.pfuetzen.find((q) => Math.abs(q.x - t.x) < q.r * .9 + 3); if (p && p.ringe.length < 6) p.ringe.push({ x: t.x, a: 0 }); }
    }
    J.tropfen = J.tropfen.filter((t) => !t.weg);
    for (const p of J.pfuetzen) { p.r = Math.min(18 * J.k, p.r + dt * .9); for (const g of p.ringe) g.a += dt * 1.6; p.ringe = p.ringe.filter((g) => g.a < 1); }
    if ((J.schirmUhr = (J.schirmUhr ?? (J.extra === "regen" ? 2 : jzbZ(8, 20))) - dt) <= 0 && !J.schirm) { const dir = Math.random() < .5 ? 1 : -1; J.schirm = { dir, x: dir > 0 ? -30 : J.w + 30, t: 0 }; }
  } else if (J.tropfen?.length || J.pfuetzen) { J.tropfen = []; J.pfuetzen = J.pfuetzen?.map((p) => ({ ...p, r: p.r - dt * 3 })).filter((p) => p.r > 0) || null; if (!J.pfuetzen?.length) J.pfuetzen = null; }
  if (J.schirm) { const s = J.schirm; s.t += dt; s.x += s.dir * 34 * J.k * dt; if (s.x < -40 || s.x > J.w + 40) { J.schirm = null; J.schirmUhr = jzbZ(25, 50); } }
  if (X.igel && !J.igel && (J.igelUhr -= dt) <= 0) { const dir = Math.random() < .5 ? 1 : -1; J.igel = { dir, x: dir > 0 ? -20 : J.w + 20, t: 0, halt: jzbZ(.35, .65) }; }
  if (J.igel) {
    const g = J.igel, mitte = g.dir > 0 ? g.x / J.w : 1 - g.x / J.w;
    g.t += dt; const steht = mitte > g.halt && mitte < g.halt + .02 && g.schnuff === undefined ? (g.schnuff = 1.8, true) : g.schnuff > 0;
    if (steht) g.schnuff -= dt; else g.x += g.dir * 16 * J.k * dt;
    for (const b of J.liegt) if (Math.abs(b.x - g.x) < 9 * J.k) b.wackel = 1; // es raschelt
    if (g.x < -30 || g.x > J.w + 30) { J.igel = null; J.igelUhr = jzbZ(35, 75); }
  }
  for (const b of J.liegt) if (b.wackel) b.wackel = Math.max(0, b.wackel - dt * 1.5);
  for (const e of J.eier || []) if (e.gef) e.t += dt;
  jzbHerbstTiere(dt); // 2.328.0 KC-CLUB-HERBST-BLAESER + KC-CLUB-HERBST-HOERNCHEN
}
function jzbExtrasHinten(c) { // vor dem Gras: Ostereier (das Gras wächst darüber)
  const J = JZB, k = J.k;
  jzbPilzeMalen(c); jzbEichelnMalen(c); // 2.328.0: Eicheln liegen unter dem Laub · 2.389.0: Pilze dahinter
  if (!J.ext?.ostern) return;
  const hase = J.gaeste.some((g) => g.typ === "osterhase");
  for (const e of J.eier || []) {
    if (e.da === false && hase) continue; // noch nicht gelegt
    const y = J.h - 7 * k - (e.gef ? Math.min(1, e.t * 3) * 6 * k : 0);
    c.save(); c.translate(e.x, y); c.rotate(e.kipp * (e.gef ? 0 : 1));
    if (e.gef && e.t > .35) { c.font = `${17 * k}px ${JZB_EMOJI}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("🐣", 0, 0); c.restore(); continue; }
    c.fillStyle = e.f[0]; c.beginPath(); c.ellipse(0, 0, 5.2 * k, 7 * k, 0, 0, 7); c.fill();
    c.save(); c.clip(); c.fillStyle = e.f[1];
    if (e.muster === 0) for (const yy of [-2.5, 1.5]) c.fillRect(-6 * k, yy * k, 12 * k, 1.6 * k);
    else if (e.muster === 1) for (const [xx, yy] of [[-2, -3], [2, -1], [-1.5, 2], [2.2, 3]]) { c.beginPath(); c.arc(xx * k, yy * k, 1.1 * k, 0, 7); c.fill(); }
    else { c.beginPath(); for (let i = -6; i <= 6; i += 3) c.lineTo(i * k, (i / 3) % 2 ? -1 * k : 1 * k); c.lineWidth = 1.3 * k; c.strokeStyle = e.f[1]; c.stroke(); }
    c.restore(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(-1.8 * k, -3 * k, 1.3 * k, 2 * k, -.4, 0, 7); c.fill(); c.restore();
  }
}
function jzbExtrasBoden(c) { // Pfützen, Stiefel, Kochtopf, Igel, Schirm
  const J = JZB, k = J.k, X = J.ext || {};
  for (const p of J.pfuetzen || []) {
    if (p.r <= 0) continue;
    c.fillStyle = "rgba(170,200,235,.42)"; c.beginPath(); c.ellipse(p.x, J.h - 1.5, p.r, p.r * .2, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = .8;
    for (const g of p.ringe) { c.globalAlpha = 1 - g.a; c.beginPath(); c.ellipse(g.x, J.h - 1.5, 2 + g.a * 8, (2 + g.a * 8) * .25, 0, 0, 7); c.stroke(); } c.globalAlpha = 1;
  }
  if (X.nikolaus) jzbStiefel(c, J.w * .6, J.h - 1, k);
  if (X.topf) jzbTopf(c, Math.max(J.w * .3, 90 * k), J.h - 1, k);
  if (J.igel) jzbIgel(c, J.igel, k);
  if (J.schirm) jzbSchirm(c, J.schirm, k);
  jzbNussNameMalen(c); // 2.329.0 KC-CLUB-NUSSNAME
  if (J.hoernchen) jzbHoernchenMalen(c, J.hoernchen, k); // 2.328.0
  if (J.kuerbis && J.saison === "herbst") jzbHerbstKuerbisMalen(c, J.kuerbis, k); // 2.434.0 KC-CLUB-HERBST-KUERBIS
  if (J.hund) jzbStreunerMalen(c, J.hund, k); // 2.369.0 KC-CLUB-HERBST-HUND
  if (J.blaeser) jzbBlaeserMalen(c, J.blaeser, k);
  jzbWinterKinderMalen(c); // 2.282.0
}
function jzbStiefel(c, x, y, k) { // 🥾 gefüllter Nikolaus-Stiefel
  c.save(); c.translate(x, y); c.scale(k, k);
  c.strokeStyle = "#c62828"; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(4, -26); c.lineTo(4, -34); c.arc(8, -34, 4, Math.PI, 0); c.stroke(); // Zuckerstange
  c.strokeStyle = "#fff"; c.lineWidth = .9; c.setLineDash([1.6, 2]); c.beginPath(); c.moveTo(4, -26); c.lineTo(4, -34); c.arc(8, -34, 4, Math.PI, 0); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#f28c28"; c.beginPath(); c.arc(-4, -28, 4.6, 0, 7); c.fill(); c.fillStyle = "#3a7d2c"; c.beginPath(); c.ellipse(-3, -32.4, 1.6, .8, -.5, 0, 7); c.fill(); // Mandarine
  c.fillStyle = "#c62828"; c.beginPath(); c.moveTo(-1, -24); c.lineTo(1.5, -36); c.lineTo(4, -24); c.closePath(); c.fill(); c.fillStyle = "#f6d7b0"; c.beginPath(); c.arc(1.5, -30, 1.3, 0, 7); c.fill(); // Schoko-Nikolaus
  c.fillStyle = "#8d5a2b"; c.beginPath(); c.arc(-8, -25, 2.4, 0, 7); c.arc(8.5, -25.5, 2.2, 0, 7); c.fill(); // Nüsse
  const g = c.createLinearGradient(-10, 0, 10, 0); g.addColorStop(0, "#3b2314"); g.addColorStop(.5, "#6d4126"); g.addColorStop(1, "#3b2314");
  c.fillStyle = g; c.beginPath(); c.moveTo(-9, -24); c.lineTo(-9, -6); c.quadraticCurveTo(-9, 0, -3, 0); c.lineTo(15, 0); c.quadraticCurveTo(18, 0, 17, -4); c.quadraticCurveTo(15, -8, 7, -9); c.lineTo(7, -24); c.closePath(); c.fill();
  c.fillStyle = "#1e120a"; c.fillRect(-9, -1.6, 26, 1.6); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(-6, -21, 2, 12); // Sohle, Glanz
  c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(-1, -24, 9.5, 2.8, 0, 0, 7); c.fill(); // Fellrand
  c.restore();
}
function jzbTopf(c, x, y, k) { // 🍲 dampfender Kochtopf – heute ist Treffen
  const T = JZB.T, blubb = Math.max(0, Math.sin(T * 7)) * (Math.sin(T * .9) > .3 ? 1 : 0);
  c.save(); c.translate(x, y); c.scale(k, k);
  for (let i = 0; i < 3; i++) { // Dampf
    const p = ((T * .35 + i / 3) % 1), yy = -24 - p * 30;
    c.strokeStyle = `rgba(255,255,255,${.55 * (1 - p)})`; c.lineWidth = 2.4 - p; c.lineCap = "round"; c.beginPath();
    for (let s = 0; s <= 8; s++) { const sy = yy + s * 1.6, sx = (i - 1) * 6 + Math.sin(T * 2 + s * .7 + i) * 2.5 * (1 + p); s ? c.lineTo(sx, sy) : c.moveTo(sx, sy); } c.stroke();
  }
  const g = c.createLinearGradient(-15, 0, 15, 0); g.addColorStop(0, "#8e959c"); g.addColorStop(.35, "#eef1f4"); g.addColorStop(1, "#7d848b");
  c.fillStyle = "#5f666d"; c.beginPath(); c.ellipse(-16, -12, 3, 2, 0, 0, 7); c.ellipse(16, -12, 3, 2, 0, 0, 7); c.fill(); // Griffe
  c.fillStyle = g; c.beginPath(); c.moveTo(-14, -18); c.lineTo(-14, -3); c.quadraticCurveTo(-14, 0, -10, 0); c.lineTo(10, 0); c.quadraticCurveTo(14, 0, 14, -3); c.lineTo(14, -18); c.closePath(); c.fill();
  c.fillStyle = "#8e1b2b"; c.fillRect(-14, -11, 28, 3.2); c.fillStyle = "#d4a017"; c.font = "bold 4px sans-serif"; c.textAlign = "center"; c.fillText("KC", 0, -4); // weinrotes Band, KC
  c.save(); c.translate(0, -18 - blubb * 1.6); c.rotate(blubb * .06);
  c.fillStyle = "#c9ced3"; c.beginPath(); c.ellipse(0, 0, 15.5, 3, 0, Math.PI, 0); c.fill(); c.fillStyle = "#5f666d"; c.beginPath(); c.ellipse(0, -3.2, 2.6, 1.6, 0, 0, 7); c.fill(); c.restore(); // Deckel klappert
  c.restore();
}
function jzbIgel(c, g, k) { // 🦔 Igel mit Stacheln, Schnäuzchen und trippelnden Füßen
  const y = JZB.h - 1, lauf = g.schnuff > 0 ? 0 : Math.sin(g.t * 14);
  c.save(); c.translate(g.x, y); c.scale(g.dir * k, k);
  c.fillStyle = "#2b1d14"; for (const fx of [-4, 4]) { c.beginPath(); c.ellipse(fx + (fx > 0 ? lauf : -lauf) * 1.5, -1, 2, 1.2, 0, 0, 7); c.fill(); }
  // 2.393.0 KC-CLUB-IGEL-STACHELN (Fund Hansi): feinere Stacheln, auch an den Seiten bis fast zum Boden
  c.fillStyle = "#4e342e"; c.beginPath();
  for (let i = 0; i <= 44; i++) { const a = Math.PI * .94 + i / 44 * Math.PI * .98, r = i % 2 ? 11 : 12.4; c.lineTo(Math.cos(a) * r * 1.15 - 1, -2 + Math.sin(a) * r); } c.lineTo(6, -1); c.closePath(); c.fill();
  // 2.394.0 (Fund Hansi „an den Seiten nur eine braune Fläche“): Rücken UND Seiten ganz mit Stacheln – drei Reihen, leicht nach hinten geneigt
  c.lineCap = "round";
  for (const [r0, r1, n, ab] of [[1.5, 7.5, 18, 0], [4.5, 10.5, 28, .5], [7, 13, 40, 0]]) for (let i = 0; i <= n; i++) {
    const a = Math.PI * .93 + (i + ab) / n * Math.PI * .95, r = r1 + (i % 3) * .6, at = a - .22;
    const x0 = Math.cos(a) * r0 * 1.15 - 1, y0 = -2 + Math.sin(a) * r0, x1 = Math.cos(at) * r * 1.15 - 1, y1 = -2 + Math.sin(at) * r;
    c.strokeStyle = i % 2 ? "#2e2018" : "#6b4a3a"; c.lineWidth = .95; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = "rgba(235,220,200,.8)"; c.lineWidth = .55; c.beginPath(); c.moveTo(x0 + (x1 - x0) * .78, y0 + (y1 - y0) * .78); c.lineTo(x1, y1); c.stroke(); // helle Spitzen
  }
  const schnupf = g.schnuff > 0 ? Math.sin(g.t * 22) * .6 : 0;
  c.fillStyle = "#d7b899"; c.beginPath(); c.moveTo(7, -9); c.quadraticCurveTo(13, -6, 16 + schnupf, -3.5); c.quadraticCurveTo(12, -1, 7, -2); c.closePath(); c.fill();
  c.fillStyle = "#111"; c.beginPath(); c.arc(16.2 + schnupf, -3.6, 1.2, 0, 7); c.fill(); c.beginPath(); c.arc(10.5, -6.2, .9, 0, 7); c.fill();
  c.restore();
}
function jzbSchirm(c, s, k) { // ☔ gelber Regenschirm läuft vorbei (mit Gummistiefeln)
  const y = JZB.h - 1, schritt = Math.sin(s.t * 9), wipp = Math.abs(schritt) * 1.2;
  c.save(); c.translate(s.x, y); c.scale(k, k);
  c.strokeStyle = "#2b2b2b"; c.lineWidth = 1.6; c.lineCap = "round";
  for (const [b, v] of [[-2, schritt], [2, -schritt]]) { c.beginPath(); c.moveTo(b, -12); c.lineTo(b + v * 2.5, -3); c.stroke(); c.fillStyle = "#f2c200"; c.beginPath(); c.ellipse(b + v * 2.5 + 1, -1.8, 2.4, 1.8, 0, 0, 7); c.fill(); }
  c.fillStyle = "#24476b"; c.beginPath(); c.ellipse(0, -16, 4.5, 6, 0, 0, 7); c.fill(); // Mantel
  c.translate(0, -wipp); c.strokeStyle = "#d4a017"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -17); c.lineTo(0, -34); c.stroke();
  c.fillStyle = "#f6c445"; c.beginPath(); c.moveTo(-17, -32); // gelb – Weinrot verschwände im Kopf
  c.quadraticCurveTo(0, -52, 17, -32); for (let i = 0; i < 5; i++) { const x1 = 17 - i * 6.8, x2 = x1 - 6.8; c.quadraticCurveTo((x1 + x2) / 2, -35.5, x2, -32); } // gewellter Rand
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.1; for (const xx of [-10, 0, 10]) { c.beginPath(); c.moveTo(0, -44); c.quadraticCurveTo(xx * .6, -40, xx, -33); c.stroke(); } // Speichen
  c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -44, 1.3, 0, 7); c.fill();
  c.restore();
}
function jzbRegenMalen(c) {
  const J = JZB; if (!J.tropfen?.length) return;
  const W = J.wind, sx = (W ? W.dir * 160 * W.st : 40) / 300;
  c.strokeStyle = "rgba(205,228,255,.7)"; c.lineWidth = 1.1; c.beginPath();
  for (const t of J.tropfen) { c.moveTo(t.x, t.y); c.lineTo(t.x - sx * 12, t.y - 12); } c.stroke();
}
// ---------- KC-CLUB-JAHRESZEIT-TWINKEY (2.259.0, Wunsch Hansi „Twinkey kommt kurz mit einem Besen vorbei und sagt einen Spruch“) ----------
// Herbst: Twinkey fegt das Laub weg · Winter: Twinkey schippt den Schnee beiseite (im Wechsel mit dem Windstoß; jeder 3. Winter-Lauf bleibt
// der Schneemann) · Frühling/Sommer: Twinkey gießt die Blumen bzw. die Sonnenblume. Twinkey = 🧑‍🍳 wie beim Schach, Beine und Werkzeug gezeichnet,
// Spruch als Sprechblase über dem Kopf (aria-hidden, Tippen geht durch).
const JZB_SPRUECHE = {
  fegen: ["Ja, ja – im Herbst gehört das Laubfegen wohl dazu!", "Einmal durchfegen – dann ist wieder Platz für neues Laub.", "Mise en place – auch vor der Tür!", "Sauber gefegt ist halb gekocht."],
  schippen: ["Schnee schippen hält fit – fast wie Teig kneten!", "So, der Weg ist frei!", "Ja, ja – im Winter gehört das Schneeschippen dazu.", "Brrr! Gleich gibt's einen heißen Tee."],
  giessenSommer: ["Die Sonnenblume hat Durst – ein Schluck Wasser für dich!", "Immer schön begießen – wie beim Braten!", "Wer groß werden will, braucht Sonne und Wasser."],
  giessenFruehling: ["Die ersten Blumen – die brauchen jetzt viel Liebe.", "Ein bisschen Wasser, dann blüht's noch schöner.", "Frühling! Da wächst alles fast von allein."],
};
function jzbBesuchStart(art) {
  const J = JZB, dir = (J.lauf >> 1) % 2 ? -1 : 1;
  const B = { art, dir, x: dir > 0 ? -34 : J.w + 34, t: 0, sagt: false, halt: 0, fertig: false };
  if (art === "giessen") {
    const f = J.saison === "sommer" ? J.blumen[0] : J.blumen[Math.floor(J.blumen.length / 2)];
    B.ziel = f ? f.x - dir * (J.saison === "sommer" ? 24 : 18) * J.k : J.w / 2;
  } else { for (const f of J.flug) J.fx.push({ ...f, vx: 0, vy: f.vy || 20, a: 1 }); J.flug = []; jzbPhase("besuch"); }
  J.besuch = B;
}
function jzbSagen(text) {
  const b = JZB.blase; if (!b) return;
  b.textContent = "🧑‍🍳 " + text; b.classList.add("an"); clearTimeout(JZB.blaseUhr);
  JZB.blaseUhr = setTimeout(() => b.classList.remove("an"), 4200);
}
function jzbBesuchSchritt(dt) {
  const J = JZB, B = J.besuch; if (!B) return;
  const k = J.k, geht = !(B.halt > 0);
  B.t += dt;
  if (geht) B.x += B.dir * 34 * k * dt; else B.halt -= dt;
  const spitze = B.x + B.dir * 17 * k, hinter = (x) => (B.dir > 0 ? x <= spitze : x >= spitze);
  if (B.art === "fegen") {
    for (const b of J.liegt) if (hinter(b.x)) { J.fx.push({ typ: "blatt", x: b.x, y: J.h - b.yb, s: b.s, farbe: b.farbe, form: b.form, rot: b.rot, vr: jzbZ(-8, 8), vx: B.dir * jzbZ(90, 170), vy: -jzbZ(25, 75), ph: jzbZ(0, 6.3), fq: jzbZ(1, 2) }); b.weg = true; }
    J.liegt = J.liegt.filter((b) => !b.weg);
    J.boden.forEach((v, i) => { if (v && hinter(i * JZB_SP)) J.boden[i] = 0; });
  } else if (B.art === "schippen") {
    J.boden.forEach((v, i) => { if (v > .05 && hinter(i * JZB_SP)) { if (J.fx.length < 170 && Math.random() < v * .35) J.fx.push({ typ: "flocke", x: i * JZB_SP, y: J.h - v, r: jzbZ(.9, 2.3), vx: B.dir * jzbZ(50, 130), vy: -jzbZ(70, 150), a: 1 }); J.boden[i] = 0; } });
  } else if (B.art === "giessen") {
    if (!B.gegossen && (B.dir > 0 ? B.x >= B.ziel : B.x <= B.ziel)) { B.gegossen = true; B.halt = 4.5; }
    if (B.halt > 0 && Math.random() < dt * 30) J.fx.push({ typ: "wasser", x: B.x + B.dir * 21 * k, y: J.h - 24 * k, vx: B.dir * jzbZ(18, 34), vy: jzbZ(10, 30), a: 1, blass: 1.2 });
  }
  if (!B.sagt && (B.art === "giessen" ? B.halt > 0 : (B.dir > 0 ? B.x > J.w * .38 : B.x < J.w * .62))) {
    B.sagt = true; jzbSagen(jzbW(JZB_SPRUECHE[B.art === "giessen" ? (J.saison === "sommer" ? "giessenSommer" : "giessenFruehling") : B.art]));
  }
  if (J.blase) { const halb = (J.blase.offsetWidth || 160) / 2 + 8; J.blase.style.left = `${Math.max(halb, Math.min(J.w - halb, B.x))}px`; } // ganz im Kopf
  if (B.x < -50 || B.x > J.w + 50) J.besuch = null;
}
function jzbTwinkeyMalen(c) {
  const J = JZB, B = J.besuch; if (!B) return;
  const k = J.k, y = J.h, geht = !(B.halt > 0), schritt = geht ? Math.sin(B.t * 10) : 0, x = B.x;
  c.save(); c.lineCap = "round";
  c.strokeStyle = "#2c3e50"; c.lineWidth = 2.6 * k; // Beine
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 2.5 * k, y - 11 * k); c.lineTo(x + s * 2.5 * k + schritt * s * 3.5 * k, y - 2 * k); c.stroke(); c.fillStyle = "#111"; c.beginPath(); c.ellipse(x + s * 2.5 * k + schritt * s * 3.5 * k + B.dir * 1.2 * k, y - 1.6 * k, 2.4 * k, 1.4 * k, 0, 0, 7); c.fill(); }
  const hx = x + B.dir * 8 * k, hy = y - 17 * k; // Hand
  if (B.art === "fegen" || B.art === "schippen") {
    const zug = Math.sin(B.t * 9), tx = x + B.dir * (17 + zug * 4) * k, ty = y - (B.art === "schippen" ? 3 + Math.max(0, -zug) * 5 : 2) * k;
    c.strokeStyle = "#8d5a2b"; c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(hx - B.dir * 3 * k, hy - 6 * k); c.lineTo(tx, ty); c.stroke();
    c.save(); c.translate(tx, ty); c.scale(B.dir, 1);
    if (B.art === "fegen") { c.fillStyle = "#d9a441"; c.beginPath(); c.moveTo(-2 * k, -3 * k); c.lineTo(3 * k, -3 * k); c.lineTo(6 * k, 2.4 * k); c.lineTo(-4 * k, 2.4 * k); c.closePath(); c.fill(); c.strokeStyle = "#a87a22"; c.lineWidth = .7; for (const b of [-2, 0, 2, 4]) { c.beginPath(); c.moveTo(b * .6 * k, -2.5 * k); c.lineTo(b * k, 2.2 * k); c.stroke(); } }
    else { c.fillStyle = "#9aa3ab"; c.beginPath(); c.moveTo(-2 * k, -3 * k); c.lineTo(6 * k, -1 * k); c.lineTo(6 * k, 2.5 * k); c.lineTo(-2 * k, 2.5 * k); c.closePath(); c.fill(); c.fillStyle = "#fff"; c.fillRect(-1 * k, -1 * k, 6 * k, 2 * k); }
    c.restore();
  } else { // Gießkanne
    const kipp = B.halt > 0 ? .55 : .1;
    c.save(); c.translate(hx + B.dir * 3 * k, hy + 1 * k); c.scale(B.dir, 1); c.rotate(kipp);
    c.fillStyle = "#2e8b57"; c.beginPath(); c.roundRect ? c.roundRect(-4 * k, -4 * k, 9 * k, 8 * k, 2 * k) : c.rect(-4 * k, -4 * k, 9 * k, 8 * k); c.fill();
    c.strokeStyle = "#2e8b57"; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(5 * k, 1 * k); c.lineTo(11 * k, -4 * k); c.stroke(); c.beginPath(); c.arc(0, -5 * k, 3 * k, Math.PI, 0); c.stroke();
    c.restore();
  }
  const kopfY = y - 8 * k + (geht ? -Math.abs(schritt) * 1.2 * k : 0);
  if (!KOCH.ok && KOCH.bild?.complete && KOCH.bild.naturalWidth) { const g = 26 * k; c.drawImage(KOCH.bild, x - g / 2, kopfY - g * 1.02, g, g); } // 2.355.0: Gerät ohne Koch-Emoji
  else { c.font = `${26 * k}px ${JZB_EMOJI}`; c.textAlign = "center"; c.textBaseline = "bottom"; c.fillText("🧑‍🍳", x, kopfY); }
  c.restore();
}
// Vorschau aus den Einstellungen: eine Jahreszeit sofort im Kopf zeigen (bis „Heute“ oder Neustart der App)
function jahreszeitVorschau(art, extra) { // extra (2.249.0): nikolaus, regen, topf, ostern, igel
  if (!fxAn()) return fxAusHinweis(() => jahreszeitVorschau(art, extra));
  if (!einst("jahreszeit", true)) return melde("„🍂 Jahreszeiten im Kopf“ ist aus – erst einschalten.", true);
  if (art === "heute") JZB.vorschau = ""; else if (art) JZB.vorschau = art;
  JZB.vorschauSeit = art === "heute" ? 0 : Date.now(); // 2.358.0 KC-CLUB-AKKU-3
  JZB.eisName = null; JZB.eisStueck = null; JZB.nussName = null; // 2.356.0 KC-CLUB-NAME-WEG: Vorschau gewechselt oder beendet → kein alter Name bleibt stehen
  JZB.extra = extra || "";
  JZB.kuerbis = null; JZB.kuerbisUhr = undefined; JZB.kuerbisZ = null; // 2.434.0: Vorschau „🎃 Kürbis-Hund“ beginnt von vorn
  zeige("start"); setTimeout(jahreszeitKopf, 350);
  jzVorschauLeiste(); // 2.355.0
}
