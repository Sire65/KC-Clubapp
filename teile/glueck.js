// KC-CLUB-MARIENKAEFER + KC-CLUB-GLUECKSKLEE (Wunsch Hansi 06.11.2026): kleine Glücksbringer auf der Startseite.
// 🐞 bei jedem 50. Start krabbelt ein Marienkäfer über die ganze Startseite bis zur Mitte, bleibt stehen, dreht den Kopf zum Mitglied,
//    lächelt und krabbelt weiter. 🍀 bei jedem 25. Start pustet ein Windstoß ein vierblättriges Kleeblatt von oben ins Bild; es bleibt kurz
//    liegen, ein zweiter Windstoß weht es weg. Antippen = ein Glücksspruch (Sprüche: KAEFER_SPRUECHE / KLEE_SPRUECHE im Hauptprogramm,
//    damit die Wege-Ansicht sie übersetzen kann). Welcher Start was bringt, entscheidet der Server (start_melden: kaefer / klee / fee).
// Gespeichert wird nichts. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const GL = { kaefer: false, klee: false };
const GL_KAEFER_SVG = `<svg viewBox="0 0 60 70" aria-hidden="true">
  <g class="gl-beine" stroke="#1d1d1d" stroke-width="2.4" stroke-linecap="round" fill="none">
    <path class="gl-bein a" d="M14 30 L4 24"/><path class="gl-bein b" d="M13 40 L2 40"/><path class="gl-bein a" d="M15 50 L5 58"/>
    <path class="gl-bein b" d="M46 30 L56 24"/><path class="gl-bein a" d="M47 40 L58 40"/><path class="gl-bein b" d="M45 50 L55 58"/></g>
  <g class="gl-fuehler" stroke="#1d1d1d" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M25 10 Q20 2 15 3"/><path d="M35 10 Q40 2 45 3"/>
    <circle cx="15" cy="3" r="1.8" fill="#1d1d1d"/><circle cx="45" cy="3" r="1.8" fill="#1d1d1d"/></g>
  <ellipse cx="30" cy="15" rx="11" ry="8" fill="#1d1d1d"/>
  <circle cx="24.5" cy="13" r="2.6" fill="#fff"/><circle cx="35.5" cy="13" r="2.6" fill="#fff"/>
  <ellipse cx="30" cy="42" rx="20" ry="23" fill="#e53935"/>
  <path d="M30 19 L30 65" stroke="#1d1d1d" stroke-width="1.6"/>
  <g fill="#1d1d1d"><circle cx="30" cy="25" r="4"/><circle cx="20" cy="35" r="4"/><circle cx="40" cy="35" r="4"/><circle cx="18" cy="50" r="3.6"/><circle cx="42" cy="50" r="3.6"/><circle cx="25" cy="59" r="3"/><circle cx="35" cy="59" r="3"/></g>
  <ellipse cx="22" cy="30" rx="5" ry="3" fill="#fff" opacity=".35" transform="rotate(-30 22 30)"/>
</svg>`;
// Vorderansicht beim Stehenbleiben: Gesicht zum Mitglied, mit Lächeln und Bäckchen (der Panzer liegt dahinter)
const GL_KAEFER_VORN_SVG = `<svg viewBox="0 0 60 70" aria-hidden="true">
  <ellipse cx="30" cy="40" rx="24" ry="22" fill="#e53935"/>
  <g fill="#1d1d1d"><circle cx="12" cy="36" r="3.5"/><circle cx="48" cy="36" r="3.5"/><circle cx="16" cy="52" r="3"/><circle cx="44" cy="52" r="3"/></g>
  <g class="gl-fuehler" stroke="#1d1d1d" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M24 22 Q18 10 12 9"/><path d="M36 22 Q42 10 48 9"/>
    <circle cx="12" cy="9" r="2" fill="#1d1d1d"/><circle cx="48" cy="9" r="2" fill="#1d1d1d"/></g>
  <circle cx="30" cy="38" r="15" fill="#262626"/>
  <g class="gl-aug"><ellipse cx="24" cy="35" rx="4" ry="4.6" fill="#fff"/><ellipse cx="36" cy="35" rx="4" ry="4.6" fill="#fff"/>
    <circle cx="24.6" cy="36" r="2.2" fill="#1d1d1d"/><circle cx="36.6" cy="36" r="2.2" fill="#1d1d1d"/><circle cx="25.4" cy="34.8" r=".8" fill="#fff"/><circle cx="37.4" cy="34.8" r=".8" fill="#fff"/></g>
  <ellipse cx="19.5" cy="42.5" rx="2.6" ry="1.6" fill="#ff8a80" opacity=".8"/><ellipse cx="40.5" cy="42.5" rx="2.6" ry="1.6" fill="#ff8a80" opacity=".8"/>
  <path class="gl-mund" d="M24 43 Q30 49 36 43" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;
const GL_KLEE_SVG = `<svg viewBox="0 0 80 90" aria-hidden="true">
  <path d="M40 46 Q44 66 38 86" stroke="#2e7d32" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  ${[0, 90, 180, 270].map((w) => `<g transform="rotate(${w} 40 40)"><path d="M40 40 C34 30 22 26 22 17 C22 10 30 7 35 12 C37 14 39 17 40 20 C41 17 43 14 45 12 C50 7 58 10 58 17 C58 26 46 30 40 40Z" fill="#43a047" stroke="#2e7d32" stroke-width="1.4"/>
    <path d="M40 38 L40 21" stroke="#a5d6a7" stroke-width="1.2" opacity=".8"/></g>`).join("")}
  <circle cx="40" cy="40" r="3" fill="#2e7d32"/>
</svg>`;
const glAus = () => typeof document === "undefined" || !fxAn() || matchMedia?.("(prefers-reduced-motion: reduce)").matches;
// wie die Fee: erst, wenn die Startseite sichtbar und kein Fenster offen ist (höchstens 2 Min. warten); Vorschau („ansehen“) sofort
function glWarten(fn, vorschau, schluessel) {
  if (vorschau !== true && !einst(schluessel, true)) return false;
  if (vorschau === true && !fxAn()) { fxAusHinweis(() => fn(true)); return false; }
  if (vorschau !== true && (glAus() || document.hidden || aktuelleAnsicht !== "start" || document.querySelector(FENSTER_OFFEN))) { // offenes Fenster (z. B. Tipp des Tages, Dienstwünsche): erst danach
    const n = (fn.versuche = (fn.versuche || 0) + 1); if (n <= 24 && einst("animiert", true)) setTimeout(fn, 5000); return false;
  }
  fn.versuche = 0; return true;
}
function glSpruch(art) {
  const liste = art === "kaefer" ? KAEFER_SPRUECHE : KLEE_SPRUECHE, nr = Math.floor(Math.random() * liste.length), id = art === "kaefer" ? "kaeferBlatt" : "kleeBlatt";
  const b = blattAuf(id, `<h3 style="text-align:center">${art === "kaefer" ? "🐞 Der Marienkäfer sagt …" : "🍀 Ein Glücksklee für dich …"}</h3><div class="fee-spruch">${liste[nr]}</div>
    <button type="button" class="knopf haupt" style="width:100%" onclick="document.getElementById('${id}')?.remove()">${art === "kaefer" ? "🐞 Danke!" : "🍀 Danke!"}</button>`);
  b.style.zIndex = "9200"; b.dataset.spurSelbst = "1"; spur("fenster", `${id}:${nr}`); // nur die Nummer (der Server nimmt keinen freien Text)
}
// ---------- 🐞 Marienkäfer ----------
function kaeferKommt(vorschau) {
  if (GL.kaefer || !glWarten(kaeferKommt, vorschau, "kaefer")) return;
  GL.kaefer = true;
  const k = document.createElement("div"); k.className = "gl-kaefer"; k.setAttribute("role", "button"); k.setAttribute("aria-label", "Marienkäfer – antippen für einen Glücksspruch");
  k.innerHTML = `<div class="gl-k-dreh"><div class="gl-k-oben">${GL_KAEFER_SVG}</div><div class="gl-k-vorn">${GL_KAEFER_VORN_SVG}</div></div>`;
  document.body.appendChild(k);
  const W = 52, bw = innerWidth, bh = innerHeight, unten = Math.max(160, bh - 120);
  // Weg: von links unten schräg zur Mitte, dann nach rechts oben hinaus – mit kleinen Schlenkern
  const start = [-W, unten - 20], mitte = [bw / 2 - W / 2, Math.round(bh * 0.5)], ziel = [bw + W, Math.round(bh * 0.28)];
  const hin = 5200, steh = 3800, weg = 4200;
  let t0 = 0, ende = false, stufe = "", getippt = false, winkel = 0;
  k.onclick = (e) => { e.stopPropagation(); if (getippt) return; getippt = true; glSpruch("kaefer"); };
  const setze = (x, y, w) => { k.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; k.querySelector(".gl-k-dreh").style.transform = `rotate(${w.toFixed(1)}deg)`; };
  const schlenker = (t) => Math.sin(t / 380) * 6;
  const fertig = () => { ende = true; k.remove(); GL.kaefer = false; };
  const lauf = (jetzt) => {
    if (ende) return; if (!t0) t0 = jetzt; const t = jetzt - t0;
    if (t < hin) {
      const p = t / hin, e = p < .85 ? p / .85 * .92 : .92 + (p - .85) / .15 * .08; // läuft gleichmäßig, wird am Ende langsamer
      const x = start[0] + (mitte[0] - start[0]) * e, y = start[1] + (mitte[1] - start[1]) * e + schlenker(t);
      winkel = Math.atan2(mitte[1] - start[1], mitte[0] - start[0]) * 180 / Math.PI + 90 + Math.cos(t / 380) * 8; // Kopf zeigt in Laufrichtung
      k.classList.add("laeuft"); setze(x, y, winkel);
    } else if (t < hin + steh) {
      const s = t - hin; k.classList.remove("laeuft");
      if (!stufe) { stufe = "dreht"; k.classList.add("dreht"); setze(mitte[0], mitte[1], 0); } // Kopf zum Mitglied
      if (stufe === "dreht" && s > 500) { stufe = "lacht"; k.classList.add("vorn", "lacht"); }
      if (stufe === "lacht" && s > steh - 700) { stufe = "zurueck"; k.classList.remove("vorn", "lacht"); }
    } else if (t < hin + steh + weg) {
      const p = (t - hin - steh) / weg, e = p * p * (3 - 2 * p) * .2 + p * .8;
      const x = mitte[0] + (ziel[0] - mitte[0]) * e, y = mitte[1] + (ziel[1] - mitte[1]) * e + schlenker(t);
      winkel = Math.atan2(ziel[1] - mitte[1], ziel[0] - mitte[0]) * 180 / Math.PI + 90 + Math.cos(t / 380) * 8;
      k.classList.remove("dreht"); k.classList.add("laeuft"); setze(x, y, winkel);
    } else return fertig();
    requestAnimationFrame(lauf);
  };
  setze(start[0], start[1], 0); requestAnimationFrame(lauf);
  setTimeout(() => { if (!ende) fertig(); }, hin + steh + weg + 3000); // Sicherheitsnetz (Tab im Hintergrund)
}
// ---------- 🍀 Glücksklee im Wind ----------
function glWindTon() { // leises Rauschen, nur mit Ton
  if (!einst("ton", true)) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const c = glWindTon.c || (glWindTon.c = new C());
    const n = c.sampleRate * 1.2, puf = c.createBuffer(1, n, c.sampleRate), d = puf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const q = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); q.buffer = puf; f.type = "bandpass"; f.frequency.value = 700; g.gain.value = 0.06;
    q.connect(f).connect(g).connect(c.destination); q.start();
  } catch {}
}
function glWindstoss(y0, hoehe, nachRechts = true) {
  glWindTon();
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("div"); s.className = "gl-wind"; document.body.appendChild(s);
    const y = y0 + Math.random() * hoehe, l = 60 + Math.random() * 90, von = nachRechts ? -l : innerWidth + l, bis = nachRechts ? innerWidth + l : -l;
    s.style.width = l + "px";
    s.animate([{ transform: `translate(${von}px,${y}px)`, opacity: 0 }, { opacity: .85, offset: .2 }, { opacity: .7, offset: .8 }, { transform: `translate(${bis}px,${y - 18 + Math.random() * 36}px)`, opacity: 0 }],
      { duration: 900 + Math.random() * 500, delay: Math.random() * 350, easing: "ease-in-out", fill: "backwards" }).onfinish = () => s.remove();
  }
}
function kleeKommt(vorschau) {
  if (GL.klee || !glWarten(kleeKommt, vorschau, "klee")) return;
  GL.klee = true;
  const k = document.createElement("div"); k.className = "gl-klee"; k.setAttribute("role", "button"); k.setAttribute("aria-label", "Vierblättriges Kleeblatt – antippen für einen Glücksspruch");
  k.innerHTML = GL_KLEE_SVG; document.body.appendChild(k);
  const W = 64, bw = innerWidth, bh = innerHeight, landeX = Math.round(bw * (0.3 + Math.random() * 0.4) - W / 2), landeY = Math.round(bh * (0.42 + Math.random() * 0.12));
  const fall = 3600, liegen = 8000, weg = 2200, startX = landeX - bw * 0.35;
  let t0 = 0, ende = false, getippt = false;
  k.onclick = (e) => { e.stopPropagation(); if (getippt) return; getippt = true; glSpruch("klee"); };
  const setze = (x, y, w, s = 1) => { k.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${w.toFixed(1)}deg) scale(${s})`; };
  const fertig = () => { ende = true; k.remove(); GL.klee = false; };
  glWindstoss(0, bh * 0.4, true);
  let zweiter = false;
  const lauf = (jetzt) => {
    if (ende) return; if (!t0) t0 = jetzt; const t = jetzt - t0;
    if (t < fall) { // vom Wind hereingewirbelt, dann in Schlangenlinien herabschweben
      const p = t / fall, e = 1 - Math.pow(1 - p, 2);
      const x = startX + (landeX - startX) * e + Math.sin(p * Math.PI * 3) * 34 * (1 - p), y = -W - 20 + (landeY + W + 20) * p;
      setze(x, y, 540 * (1 - e) + Math.sin(p * 9) * 25 * (1 - p));
    } else if (t < fall + liegen) { // liegt und wiegt sich leicht
      const s = t - fall; setze(landeX, landeY + Math.sin(s / 700) * 2, Math.sin(s / 900) * 8); k.classList.add("liegt");
    } else if (t < fall + liegen + weg) { // zweiter Windstoß weht es weg
      if (!zweiter) { zweiter = true; k.classList.remove("liegt"); glWindstoss(landeY - 80, 160, true); }
      const p = (t - fall - liegen) / weg, e = p * p;
      setze(landeX + (bw + W - landeX) * e, landeY - Math.sin(p * Math.PI) * 90 - p * 40, 720 * e);
    } else return fertig();
    requestAnimationFrame(lauf);
  };
  setze(startX, -W - 20, 0); requestAnimationFrame(lauf);
  setTimeout(() => { if (!ende) fertig(); }, fall + liegen + weg + 3000);
}
