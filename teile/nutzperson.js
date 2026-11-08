// KC-CLUB-NUTZUNG-PERSON (Wunsch Hansi 07./08.11.2026: „Pro Person eine Nutzungsstatistik. Mit Filter am besten unter Meins oder Technik. Zeige dort wie viel
// Nachrichten versendet, Termine, Bildschirmzeit, Zeit im Hintergrund und was fehlt noch. Am besten auch mit Grafiken.“ – Antworten: alle 3 Stufen, Admin sieht alle,
// in der Nutzung steht, dass für die Statistik bestimmte Sachen aufgezeichnet werden).
// „📊 Meine Nutzung“ (Meins, jedes Mitglied: nur die eigenen Zahlen) und „📊 Nutzung je Mitglied“ (Technik, nur Admin: Rangliste, antippen = eine Person).
// Zahlen vom Server (nutzung_person → kc_club_nutzung_bericht): nur Anzahlen und Sekunden, nie Inhalte. Grafiken mit CSS selbst gezeichnet (wie „📈 So nutzen
// wir die App“, gleiche Bausteine nu-*), kein fremder Dienst. Antippen einer Säule/eines Feldes zeigt die genaue Zahl. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const NPS = { wahl: "30", von: null, bis: null, pid: null, sicht: "alles", sort: "sichtbar", d: null, alle: null };
const NP_WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], NP_WT_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const NP_HINWEIS = "Für die Statistik werden bestimmte Sachen aufgezeichnet: wie lange die App geöffnet ist, welche Bereiche geöffnet werden und die Anzahl von Nachrichten, Antworten und Starts – nie, was geschrieben wird.";
const npZ = (n) => Number(n || 0).toLocaleString("de-DE");
const npKurz = (t) => `${String(t).slice(8, 10)}.${String(t).slice(5, 7)}.`;
const npTagPlus = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const npWt = (iso) => (new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7;
function npDauer(s) {
  s = Math.round(Number(s) || 0); if (s < 60) return `${s} Sek.`;
  const m = Math.round(s / 60); if (m < 60) return `${m} Min.`;
  const h = Math.floor(m / 60), r = m % 60; return `${npZ(h)} Std.${r ? ` ${r} Min.` : ""}`;
}
// Zeitraum aus der Wahl: heute, 7, 30, Jahr, eigen
function npZeitraum() {
  const h = heuteIso();
  if (NPS.wahl === "heute") return [h, h];
  if (NPS.wahl === "7") return [npTagPlus(h, -6), h];
  if (NPS.wahl === "jahr") return [h.slice(0, 4) + "-01-01", h];
  if (NPS.wahl === "eigen" && NPS.von && NPS.bis) return NPS.von <= NPS.bis ? [NPS.von, NPS.bis] : [NPS.bis, NPS.von];
  return [npTagPlus(h, -29), h];
}
function npPfeil(j, v) {
  if (!v) return "";
  const p = Math.round((j - v) / v * 100);
  return p === 0 ? '<span class="nu-pf gleich">→ gleich</span>' : `<span class="nu-pf ${p > 0 ? "hoch" : "runter"}">${p > 0 ? "↑" : "↓"} ${npZ(Math.abs(p))} %</span>`;
}
function npFilterHtml(mitSicht) {
  const [von, bis] = npZeitraum(), h = heuteIso();
  const zr = [["heute", "Heute"], ["7", "7 Tage"], ["30", "30 Tage"], ["jahr", "Dieses Jahr"], ["eigen", "📅 Eigene Tage"]];
  const sicht = [["alles", "Alles"], ["zeit", "📱 Zeit"], ["nachrichten", "💬 Nachrichten"], ["termine", "📅 Termine"], ["bereiche", "🧭 Bereiche"], ["technik", "🛠️ Technik"]];
  return `<div class="np-filter" role="group" aria-label="Zeitraum">${zr.map(([w, t]) => `<button type="button" class="knopf klein${NPS.wahl === w ? " haupt" : ""}" onclick="npWahl('${w}')">${t}</button>`).join("")}</div>
    ${NPS.wahl === "eigen" ? `<div class="np-eigen"><label>von <input type="date" id="npVon" value="${esc(von)}" max="${esc(h)}"></label><label>bis <input type="date" id="npBis" value="${esc(bis)}" max="${esc(h)}"></label><button type="button" class="knopf klein haupt" onclick="npEigen()">Anzeigen</button></div>` : ""}
    ${mitSicht ? `<div class="np-filter" role="group" aria-label="Was zeigen">${sicht.map(([w, t]) => `<button type="button" class="knopf klein${NPS.sicht === w ? " haupt" : ""}" onclick="npSicht('${w}')">${t}</button>`).join("")}</div>` : ""}
    <p class="hinweis" style="margin:2px 0 6px">${esc(npKurz(von))}${von !== bis ? `–${esc(npKurz(bis))}${bis.slice(0, 4)}` : bis.slice(0, 4)} · Pfeile: Vergleich mit dem gleich langen Zeitraum davor.</p>`;
}
function npWahl(w) { NPS.wahl = w; if (w !== "eigen") { NPS.von = NPS.bis = null; npNeu(); } else { [NPS.von, NPS.bis] = npZeitraum(); npZeichnen(); } }
function npEigen() { NPS.von = $("npVon")?.value || null; NPS.bis = $("npBis")?.value || null; if (!NPS.von || !NPS.bis) return melde("Bitte beide Tage wählen"); npNeu(); }
function npSicht(w) { NPS.sicht = w; npZeichnen(); }
const npNeu = () => (NPS.alle && !NPS.pid ? npAlle() : npStart(NPS.pid));
function npBlattAuf() {
  if (!$("npBlatt")) {
    blattAuf("npBlatt", `<h3 style="margin:0" id="npTitel">📊 Nutzungsstatistik</h3><div id="npInhalt"><p class="hinweis">Wird geladen …</p></div>`);
    $("npBlatt").addEventListener("click", (e) => { const z = e.target.closest("[data-z]"); if (z) melde(z.dataset.z); });
  }
}
// ---------- eine Person ----------
async function npStart(pid) {
  NPS.pid = pid && pid !== ICH?.person_id ? pid : null;
  npBlattAuf(); if ($("npInhalt").dataset.fertig) $("npInhalt").insertAdjacentHTML("afterbegin", '<p class="hinweis" id="npLaedt">Wird geladen …</p>');
  const [von, bis] = npZeitraum();
  try { NPS.d = await api("nutzung_person", { von, bis, ...(NPS.pid ? { person: NPS.pid } : {}) }, { warten: true }); }
  catch (e) { if ($("npInhalt")) $("npInhalt").innerHTML = `<div class="karte ta-st-nein">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  NPS.alleOffen = false; npZeichnen();
}
function npZeichnen() {
  if (!$("npInhalt")) return;
  if (NPS.alleOffen && NPS.alle) return npAlleZeichnen();
  const r = NPS.d; if (!r) return;
  const fremd = r.person_id !== ICH?.person_id;
  $("npTitel").textContent = fremd ? `📊 Nutzung – ${r.name}` : "📊 Meine Nutzung";
  const d = r.daten || {}, v = r.vorher || {};
  const zurueck = ICH?.admin ? `<div class="knoepfe" style="margin:0 0 4px"><button type="button" class="knopf klein" onclick="npAlle()">👥 Alle Mitglieder vergleichen</button>${fremd ? '<button type="button" class="knopf klein" onclick="npStart()">📊 Meine eigenen</button>' : ""}</div>` : "";
  const teil = (s, html) => (NPS.sicht === "alles" || NPS.sicht === s ? html : "");
  $("npInhalt").dataset.fertig = "1";
  $("npInhalt").innerHTML = zurueck + npFilterHtml(true)
    + (fremd ? "" : `<p class="hinweis np-hinweis">ℹ️ ${esc(NP_HINWEIS)}</p>`)
    + teil("alles", npBlickHtml(d, v))
    + teil("zeit", npZeitHtml(d, r))
    + teil("nachrichten", npNachrichtenHtml(d, v))
    + teil("termine", npTermineHtml(d))
    + teil("bereiche", npBereicheHtml(d) + npRasterHtml(d))
    + teil("technik", npTechnikHtml(d))
    + `<div class="knoepfe" style="margin-top:10px"><button type="button" class="knopf" onclick="fensterZu($('npBlatt'))">Schließen</button></div>`;
}
const npKachel = (sym, wert, t, pf, z) => `<div class="nu-k"${z ? ` data-z="${esc(z)}"` : ""}><span class="nu-k-sym" aria-hidden="true">${sym}</span><b>${wert}</b><small>${t}</small>${pf}</div>`;
function npBlickHtml(d, v) {
  const s = d.zeit?.sichtbar || 0, vs = v.zeit?.sichtbar || 0, tage = d.aktiveTage || 0;
  return `<div class="karte nu-karte"><b>Auf einen Blick</b><div class="nu-blick">
    ${npKachel("📱", npDauer(s), "Bildschirmzeit", npPfeil(s, vs), tage ? `Im Schnitt ${npDauer(s / tage)} je aktivem Tag` : "")}
    ${npKachel("🌙", npDauer(d.zeit?.hintergrund), "im Hintergrund", npPfeil(d.zeit?.hintergrund || 0, v.zeit?.hintergrund || 0))}
    ${npKachel("💬", npZ(d.nachrichten?.n), "Nachrichten geschrieben", npPfeil(d.nachrichten?.n || 0, v.nachrichten?.n || 0))}
    ${npKachel("📅", `${npZ((d.termine?.ja || 0) + (d.termine?.nein || 0))}/${npZ(d.termine?.gesamt)}`, "Termine beantwortet", "")}
    ${npKachel("📆", npZ(tage), "Tage in der App", npPfeil(tage, v.aktiveTage || 0))}
    ${npKachel("🚀", npZ(d.starts), "mal gestartet", npPfeil(d.starts || 0, v.starts || 0))}
  </div><p class="hinweis" style="margin:4px 0 0">Bildschirmzeit = App offen und zu sehen · Hintergrund = App offen, aber weggelegt. Beides wird erst seit dem Update mit der Nutzungsstatistik gemessen.</p></div>`;
}
// Tage zu Wochen (ab 63 Tagen) bzw. Monaten (ab 200 Tagen) zusammenfassen, damit die Säulen lesbar bleiben
function npGruppen(tage) {
  if (tage.length <= 62) return tage.map((t) => ({ ...t, l: `${NP_WT[npWt(t.t)]} ${npKurz(t.t)}` }));
  const mon = tage.length > 200, m = new Map();
  for (const t of tage) {
    const k = mon ? t.t.slice(0, 7) : npTagPlus(t.t, -npWt(t.t));
    const x = m.get(k) || { t: k, s: 0, h: 0, m: 0, st: 0, l: mon ? `${t.t.slice(5, 7)}/${t.t.slice(0, 4)}` : `Woche ab ${npKurz(k)}` };
    x.s += t.s || 0; x.h += t.h || 0; x.m += t.m || 0; x.st += t.st || 0; m.set(k, x);
  }
  return [...m.values()];
}
function npZeitHtml(d) {
  const g = npGruppen(d.tage || []); if (!g.length) return "";
  const max = Math.max(1, ...g.map((x) => (x.s || 0) + (x.h || 0))), mitZeit = g.some((x) => x.s || x.h);
  const beste = g.reduce((a, x) => ((x.s || 0) > (a.s || 0) ? x : a), g[0]);
  return `<div class="karte nu-karte"><b>📱 Zeit in der App</b>
    <div class="nu-leg"><span><i class="nu-n"></i> sichtbar ${esc(npDauer(d.zeit?.sichtbar))}</span><span><i class="nu-p"></i> Hintergrund ${esc(npDauer(d.zeit?.hintergrund))}</span></div>
    ${mitZeit ? `<div class="nu-tage nu-stapel">${g.map((x) => `<div data-z="${esc(x.l)}: ${esc(npDauer(x.s))} sichtbar · ${esc(npDauer(x.h))} im Hintergrund">${[["nu-p", x.h], ["nu-n", x.s]].map(([c, n]) => n ? `<i class="${c}" style="height:${(n / max * 100).toFixed(1)}%"></i>` : "").join("")}</div>`).join("")}</div>
    <div class="nu-achse"><span>${esc(g[0].l)}</span><span>${esc(g[g.length - 1].l)}</span></div>
    ${beste?.s ? `<p style="margin:6px 0 0">Am längsten: <b>${esc(beste.l)}</b> – ${esc(npDauer(beste.s))}</p>` : ""}`
    : '<p class="hinweis">Für diesen Zeitraum gibt es noch keine Zeiten – sie werden erst seit dem Update mit der Nutzungsstatistik gemessen.</p>'}</div>`;
}
function npNachrichtenHtml(d, v) {
  const n = d.nachrichten || {}, g = npGruppen(d.tage || []), max = Math.max(1, ...g.map((x) => x.m || 0));
  const zeile = (sym, t, z) => `<div class="nu-zeile" data-z="${esc(t)}: ${npZ(z)}"><span>${sym} ${esc(t)}</span><div class="nz-balken"><i style="width:${Math.round((z || 0) / Math.max(1, n.n || 0) * 100)}%"></i></div><b>${npZ(z)}</b></div>`;
  const a = d.anrufe || {};
  return `<div class="karte nu-karte"><b>💬 Nachrichten & Anrufe</b>
    <p style="margin:4px 0 6px"><b>${npZ(n.n)}</b> Nachrichten geschrieben ${npPfeil(n.n || 0, v.nachrichten?.n || 0)}</p>
    ${zeile("👤", "Einzelchat", n.einzel)}${zeile("👥", "Gruppen", n.gruppe)}${zeile("📷", "Foto/Video", n.fotos)}${zeile("🎙️", "Sprache", n.sprache)}
    ${g.some((x) => x.m) ? `<div class="nu-tage">${g.map((x) => `<div data-z="${esc(x.l)}: ${npZ(x.m)} Nachrichten"><i style="height:${Math.round((x.m || 0) / max * 100)}%"></i></div>`).join("")}</div>
    <div class="nu-achse"><span>${esc(g[0].l)}</span><span>${esc(g[g.length - 1].l)}</span></div>` : ""}
    <p style="margin:8px 0 0">📞 <b>${npZ(a.gemacht)}</b> Anrufe gemacht · <b>${npZ(a.angenommen)}</b> angenommen · <b>${npZ(a.verpasst)}</b> verpasst · zusammen <b>${npZ(a.minuten)} Min.</b> telefoniert</p>
    <p class="hinweis" style="margin:4px 0 0">Gezählt wird nur die Anzahl – nie, was drinsteht.</p></div>`;
}
function npTermineHtml(d) {
  const t = d.termine || {}, ab = d.abstimmungen || {}, ges = Math.max(1, t.gesamt || 0);
  const teil = [["ja", "✅ zugesagt", "#2e8b57"], ["nein", "❌ abgesagt", "var(--rot)"], ["vielleicht", "🤔 vielleicht", "var(--gold, #c9a227)"], ["offen", "⏳ keine Antwort", "rgba(127,127,127,.35)"]];
  return `<div class="karte nu-karte"><b>📅 Termine & Abstimmungen</b>
    ${t.gesamt ? `<p style="margin:4px 0 6px">${npZ(t.gesamt)} Clubtermin${t.gesamt === 1 ? "" : "e"} im Zeitraum:</p>
    <div class="np-anteil" role="img" aria-label="Antworten auf Termine">${teil.map(([k, , f]) => t[k] ? `<i style="width:${(t[k] / ges * 100).toFixed(1)}%;background:${f}" data-z="${esc(teil.find((x) => x[0] === k)[1])}: ${npZ(t[k])}"></i>` : "").join("")}</div>
    <div class="nu-leg">${teil.map(([k, n, f]) => `<span><i style="background:${f}"></i> ${esc(n)} ${npZ(t[k])}</span>`).join("")}</div>` : '<p class="hinweis">Keine Clubtermine in diesem Zeitraum.</p>'}
    <p style="margin:8px 0 0">📝 <b>${npZ(t.angelegt)}</b> Termine selbst angelegt · 🗳️ bei <b>${npZ(ab.abgestimmt)}</b> von ${npZ(ab.moeglich)} Abstimmungen mitgemacht · 📅 <b>${npZ(d.umfragen)}</b> Terminumfragen beantwortet · 📌 <b>${npZ(d.zettel)}</b> Zettel an die Pinnwand</p></div>`;
}
const NP_FARBEN = ["#741521", "#c9a46a", "#2e8b57", "#3a6ea5", "#9b59b6", "#e67e22", "rgba(127,127,127,.45)"];
function npBereicheHtml(d) {
  const roh = d.bereiche || {}, haupt = new Map();
  for (const [b, n] of Object.entries(roh)) { const o = (typeof nzOber === "function" && nzOber(b)) || b; if (!NZ_NAMEN[o]) continue; haupt.set(o, (haupt.get(o) || 0) + n); }
  const liste = [...haupt.entries()].sort((a, b) => b[1] - a[1]), summe = liste.reduce((a, x) => a + x[1], 0);
  if (!summe) return `<div class="karte nu-karte"><b>🧭 Meistgenutzte Bereiche</b><p class="hinweis">Noch keine Zahlen – sie werden erst seit dem Update mit der Nutzungsstatistik gezählt.</p></div>`;
  const top = liste.slice(0, 6), rest = summe - top.reduce((a, x) => a + x[1], 0), stuecke = [...top, ...(rest ? [["_rest", rest]] : [])];
  let ab = 0; const verlauf = stuecke.map(([, n], i) => { const von = ab; ab += n / summe * 100; return `${NP_FARBEN[i]} ${von.toFixed(1)}% ${ab.toFixed(1)}%`; }).join(", ");
  const name = (b) => (b === "_rest" ? "Alles andere" : String(NZ_NAMEN[b] || b).replace(/ \((Liste|geöffnet)\)$/, ""));
  return `<div class="karte nu-karte"><b>🧭 Meistgenutzte Bereiche</b>
    <div class="np-ring-zeile"><div class="np-ring" style="background:conic-gradient(${verlauf})" role="img" aria-label="Anteile der Bereiche"><span>${npZ(summe)}<small>mal geöffnet</small></span></div>
    <div class="np-ring-leg">${stuecke.map(([b, n], i) => `<div data-z="${esc(name(b))}: ${npZ(n)}× (${Math.round(n / summe * 100)} %)"><i style="background:${NP_FARBEN[i]}"></i> ${esc(name(b))} <b>${Math.round(n / summe * 100)} %</b></div>`).join("")}</div></div></div>`;
}
function npRasterHtml(d) {
  const f = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const [k, n] of Object.entries(d.raster || {})) { const [w, h] = k.split("-").map(Number); if (w >= 1 && w <= 7 && h >= 0 && h < 24) f[w - 1][h] += Number(n) || 0; }
  const max = Math.max(...f.flat()); if (!max) return "";
  let top = [0, 0, 0]; f.forEach((r, w) => r.forEach((n, h) => { if (n > top[2]) top = [w, h, n]; }));
  const stunden = Array.from({ length: 18 }, (_, i) => i + 6);
  const zelle = (n, t) => `<i style="--a:${n ? (0.15 + 0.85 * n / max).toFixed(2) : 0}" data-z="${esc(t)}: ${npZ(n)}× geöffnet" title="${esc(t)}: ${npZ(n)}"></i>`;
  return `<div class="karte nu-karte"><b>🕐 Wann in der App?</b>
    <p style="margin:4px 0 8px">Am häufigsten <b>${NP_WT_LANG[top[0]].toLowerCase()}s gegen ${top[1]} Uhr</b>.</p>
    <div class="nu-feld" role="img" aria-label="Farbfeld Wochentag mal Uhrzeit: je dunkler, desto öfter">
      <span></span><span class="nu-ach">🌙</span>${stunden.map((h) => `<span class="nu-ach">${h % 3 === 0 ? h : ""}</span>`).join("")}
      ${f.map((r, w) => `<span class="nu-wt">${NP_WT[w]}</span>${zelle(r.slice(0, 6).reduce((a, n) => a + n, 0), `${NP_WT_LANG[w]} nachts 0–6 Uhr`)}${stunden.map((h) => zelle(r[h], `${NP_WT_LANG[w]} ${h}–${h + 1} Uhr`)).join("")}`).join("")}
    </div><p class="hinweis" style="margin:4px 0 0">Je dunkler das Feld, desto öfter. Feld antippen = genaue Zahl.</p></div>`;
}
function npTechnikHtml(d) {
  const g = d.geraete || {}, gn = { handy: "📱 Handy", tablet: "📲 Tablet", pc: "💻 Computer" }, p = d.push || {};
  const geraete = Object.keys(gn).filter((k) => g[k]).map((k) => `${gn[k]} (${npZ(g[k])} Tag${g[k] === 1 ? "" : "e"})`).join(" · ");
  const alt = d.version && typeof APP_VERSION !== "undefined" && d.version !== APP_VERSION;
  return `<div class="karte nu-karte"><b>🛠️ Technik</b><table class="vb-tabelle">
    <tr><td>Geräte</td><td>${geraete ? esc(geraete) : "–"}</td></tr>
    <tr><td>App-Version</td><td>${d.version ? esc(d.version) : "–"}${alt ? ' <span class="nu-pf runter">ältere Version</span>' : ""}</td></tr>
    <tr><td>Zuletzt in der App</td><td>${d.zuletzt ? esc(zeitDe(d.zuletzt)) : "–"}</td></tr>
    <tr><td>Push-Meldungen erhalten</td><td>${npZ(p.n)}${p.n ? ` · ${npZ(p.geoeffnet)} davon geöffnet` : ""}</td></tr>
    <tr><td>Fehler auf dem Gerät</td><td>${npZ(d.fehler)}${d.fehler ? ' <span class="hinweis">(Einzelheiten: Admin → Fehlerprotokoll)</span>' : ""}</td></tr>
  </table></div>`;
}
// ---------- alle Mitglieder (nur Admin) ----------
const NP_SORT = [["sichtbar", "📱 Zeit", (x) => x?.zeit?.sichtbar || 0, (n) => npDauer(n)], ["nachrichten", "💬 Nachrichten", (x) => x?.nachrichten?.n || 0, npZ],
  ["tage", "📆 Tage", (x) => x?.aktiveTage || 0, npZ], ["starts", "🚀 Starts", (x) => x?.starts || 0, npZ], ["termine", "📅 Antworten", (x) => (x?.termine?.ja || 0) + (x?.termine?.nein || 0), npZ],
  ["fehler", "⚠️ Fehler", (x) => x?.fehler || 0, npZ]];
async function npAlle() {
  if (!ICH?.admin) return npStart();
  NPS.pid = null; npBlattAuf();
  const [von, bis] = npZeitraum();
  try { NPS.alle = await api("nutzung_person", { von, bis, alle: true }, { warten: true }); }
  catch (e) { if ($("npInhalt")) $("npInhalt").innerHTML = `<div class="karte ta-st-nein">⚠️ ${esc(fehlerText(e, "Nicht geladen"))}</div>`; return; }
  NPS.alleOffen = true; npAlleZeichnen();
}
function npSort(k) { NPS.sort = k; npAlleZeichnen(); }
function npAlleZeichnen() {
  if (!$("npInhalt") || !NPS.alle) return;
  $("npTitel").textContent = "📊 Nutzung je Mitglied";
  const [k, , wert, fmt] = NP_SORT.find((x) => x[0] === NPS.sort) || NP_SORT[0];
  const liste = [...NPS.alle.alle].sort((a, b) => wert(b.daten) - wert(a.daten) || String(a.name).localeCompare(String(b.name), "de"));
  const max = Math.max(1, ...liste.map((x) => wert(x.daten))), aktiv = liste.filter((x) => (x.daten?.aktiveTage || 0) > 0).length;
  const summe = (f) => liste.reduce((a, x) => a + f(x.daten), 0);
  $("npInhalt").dataset.fertig = "1";
  $("npInhalt").innerHTML = `<div class="knoepfe" style="margin:0 0 4px"><button type="button" class="knopf klein" onclick="npStart()">📊 Meine eigenen</button></div>${npFilterHtml(false)}
    <div class="karte nu-karte"><b>Alle zusammen</b><div class="nu-blick">
      ${npKachel("👥", `${npZ(aktiv)}/${npZ(liste.length)}`, "Mitglieder waren in der App", "")}
      ${npKachel("📱", npDauer(summe((x) => x?.zeit?.sichtbar || 0)), "Bildschirmzeit zusammen", "")}
      ${npKachel("💬", npZ(summe((x) => x?.nachrichten?.n || 0)), "Nachrichten zusammen", "")}
      ${npKachel("🚀", npZ(summe((x) => x?.starts || 0)), "Starts zusammen", "")}
    </div></div>
    <div class="np-filter" role="group" aria-label="Sortieren nach">${NP_SORT.map(([s, t]) => `<button type="button" class="knopf klein${NPS.sort === s ? " haupt" : ""}" onclick="npSort('${s}')">${t}</button>`).join("")}</div>
    <div class="karte nu-karte"><b>Rangliste</b> <span class="hinweis">– Name antippen für alle Zahlen dieser Person</span>
    ${liste.map((x, i) => { const n = wert(x.daten), vor = wert(x.vorher);
      return `<button type="button" class="nu-zeile np-person" onclick="npStart('${esc(x.person_id)}')"><span>${i + 1}. ${esc(x.name)}${x.daten?.version && x.daten.version !== APP_VERSION ? ' <small class="nu-pf runter" title="ältere App-Version">⟳</small>' : ""}</span><div class="nz-balken"><i style="width:${Math.round(n / max * 100)}%"></i></div><b>${esc(fmt(n))} ${npPfeil(n, vor)}</b></button>`; }).join("")}
    </div>
    <p class="hinweis" style="margin:6px 0 0">${esc(k === "sichtbar" ? "Zeiten werden erst seit dem Update mit der Nutzungsstatistik gemessen. " : "")}⟳ = ältere App-Version. Nur Anzahlen und Zeiten, nie Inhalte.</p>
    <div class="knoepfe" style="margin-top:10px"><button type="button" class="knopf" onclick="fensterZu($('npBlatt'))">Schließen</button></div>`;
}
