// 2.829.0 KC-CLUB-NUTZUNG-ALLE (Wunsch #73 Hansi „Im Bereich Technik eine kleine Übersicht mit ein paar Grafiken: wann die App am meisten genutzt wird,
// an welchen Tagen, um welche Uhrzeit, wie viel Push, E-Mail und Nachrichten verschickt wurden … allen Mitgliedern zur Verfügung stellen, damit sie
// sehen, welche Bereiche der App wann und wie oft genutzt werden – nicht zu technisch, aber aussagekräftig“). Nur Summen vom Server (nutzung_alle →
// kc_club_app_statistik): nie Personen, nie Inhalte; „von wie vielen Mitgliedern“ erst ab 3. Grafiken mit CSS selbst gezeichnet (kein fremder Dienst).
// Antippen einer Säule/eines Feldes zeigt die genaue Zahl. Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const NU = { tage: 30, d: null };
const NU_WT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], NU_WT_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const nuName = (b) => String(NZ_NAMEN[b] || b).replace(/ \((Liste|geöffnet)\)$/, ""); // „💬 Nachrichten (Liste)“ → „💬 Nachrichten“
const nuZahl = (n) => Number(n || 0).toLocaleString("de-DE");
const nuTagKurz = (t) => `${t.slice(8)}.${t.slice(5, 7)}.`;
async function nuStart(tage) {
  if (tage) NU.tage = tage;
  blattAuf("nuBlatt", `<h3 style="margin:0">📈 So nutzen wir die App</h3><p class="hinweis" id="nuInhalt">Wird geladen …</p>`);
  try { NU.d = await api("nutzung_alle", { tage: NU.tage }, { warten: true }); } catch (e) { $("nuInhalt").textContent = "⚠️ " + fehlerText(e); return; }
  if (!$("nuBlatt")) return;
  $("nuBlatt").querySelector(".blatt-innen, .blatt-inhalt")?.scrollTo?.(0, 0);
  const box = $("nuInhalt"); box.outerHTML = `<div id="nuInhalt">${nuHtml(NU.d)}</div>`;
  $("nuInhalt").addEventListener("click", (e) => { const z = e.target.closest("[data-z]"); if (z) melde(z.dataset.z); });
}
// Pfeil im Vergleich zum Zeitraum davor – ohne Vergleichswert (wurde damals noch nicht gezählt) kein Pfeil
function nuPfeil(jetzt, vorher) {
  if (!vorher) return "";
  const p = Math.round((jetzt - vorher) / vorher * 100);
  return p === 0 ? '<span class="nu-pf gleich">→ gleich</span>' : `<span class="nu-pf ${p > 0 ? "hoch" : "runter"}">${p > 0 ? "↑" : "↓"} ${Math.abs(p)} %</span>`;
}
function nuHtml(d) {
  const tage = d.jeTag || [], v = d.vergleich || { jetzt: {}, vorher: {} }, j = v.jetzt || {}, vo = v.vorher || {};
  const knoepfe = `<div class="knoepfe">${[7, 30, 90].map((t) => `<button class="knopf klein${d.tage === t ? " haupt" : ""}" onclick="nuStart(${t})">${t} Tage</button>`).join("")}</div>`;
  const kachel = (sym, n, t, pf) => `<div class="nu-k"><span class="nu-k-sym" aria-hidden="true">${sym}</span><b>${nuZahl(n)}</b><small>${t}</small>${pf}</div>`;
  const blick = `<div class="nu-blick">${kachel("👆", j.oeffnungen, "mal Bereiche geöffnet", nuPfeil(j.oeffnungen, vo.oeffnungen))}
    ${kachel("👥", j.aktive, `von ${d.mitglieder || "?"} Mitgliedern dabei`, nuPfeil(j.aktive, vo.aktive))}
    ${kachel("💬", j.nachrichten, "Nachrichten geschrieben", nuPfeil(j.nachrichten, vo.nachrichten))}
    ${kachel("🔔", j.versand, "Benachrichtigungen (Push & E-Mail)", nuPfeil(j.versand, vo.versand))}</div>
    <p class="hinweis" style="margin:2px 0 0">Pfeile: Vergleich mit den ${d.tage} Tagen davor.</p>`;
  return knoepfe + `<p class="hinweis" style="margin:4px 0 8px">Die letzten <b>${d.tage} Tage</b> · nur Summen – niemand wird einzeln gezählt, keine Inhalte.</p>`
    + `<div class="karte nu-karte"><b>Auf einen Blick</b>${blick}</div>`
    + nuWannHtml(d) + nuTageHtml(tage) + nuVersandHtml(tage) + nuBereicheHtml(d) + nuGeraeteHtml(d.geraete || {});
}
// Wann ist am meisten los? Farbfeld Wochentag × Uhrzeit (6–24 Uhr, nachts zusammengefasst) und ein Satz zum Mitnehmen
function nuWannHtml(d) {
  const f = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const [w, h, n] of d.wochenStunden || []) if (w >= 1 && w <= 7 && h >= 0 && h < 24) f[w - 1][h] += n;
  const max = Math.max(1, ...f.flat()); let top = null;
  f.forEach((r, w) => r.forEach((n, h) => { if (!top || n > top[2]) top = [w, h, n]; }));
  const std = Array(24).fill(0), wt = Array(7).fill(0); f.forEach((r, w) => r.forEach((n, h) => { std[h] += n; wt[w] += n; }));
  if (!top || !top[2]) return `<div class="karte nu-karte"><b>🕐 Wann ist am meisten los?</b><p class="hinweis">Noch keine Zahlen in diesem Zeitraum.</p></div>`;
  const stdTop = std.indexOf(Math.max(...std)), wtTop = wt.indexOf(Math.max(...wt));
  const stunden = Array.from({ length: 18 }, (_, i) => i + 6); // 6–23 Uhr; die Nacht (0–5) als eine Spalte
  const zelle = (n, txt) => `<i style="--a:${n ? (0.15 + 0.85 * n / max).toFixed(2) : 0}" data-z="${esc(txt)}: ${nuZahl(n)}× geöffnet" title="${esc(txt)}: ${nuZahl(n)}"></i>`;
  return `<div class="karte nu-karte"><b>🕐 Wann ist am meisten los?</b>
    <p style="margin:4px 0 8px">Am meisten los: <b>${NU_WT_LANG[top[0]].toLowerCase()}s gegen ${top[1]} Uhr</b>. Insgesamt ist <b>${NU_WT_LANG[wtTop]}</b> der stärkste Tag und <b>${stdTop}–${stdTop + 1} Uhr</b> die beliebteste Stunde.</p>
    <div class="nu-feld" role="img" aria-label="Farbfeld: je dunkler, desto mehr wurde die App genutzt">
      <span></span><span class="nu-ach">🌙</span>${stunden.map((h) => `<span class="nu-ach">${h % 3 === 0 ? h : ""}</span>`).join("")}
      ${f.map((r, w) => `<span class="nu-wt">${NU_WT[w]}</span>${zelle(r.slice(0, 6).reduce((a, n) => a + n, 0), `${NU_WT_LANG[w]} nachts 0–6 Uhr`)}${stunden.map((h) => zelle(r[h], `${NU_WT_LANG[w]} ${h}–${h + 1} Uhr`)).join("")}`).join("")}
    </div><p class="hinweis" style="margin:4px 0 0">Je dunkler das Feld, desto mehr war los. Feld antippen = genaue Zahl.</p></div>`;
}
// Säulen je Tag (wer war wie oft da)
function nuSaeulen(tage, wert, text, klasse) {
  const max = Math.max(1, ...tage.map(wert));
  return `<div class="nu-tage ${klasse || ""}">${tage.map((t) => { const n = wert(t); return `<div data-z="${esc(nuTagKurz(t.tag))} ${esc(NU_WT_LANG[(new Date(t.tag + "T12:00:00Z").getUTCDay() + 6) % 7])}: ${esc(text(n))}"><i style="height:${Math.round(n / max * 100)}%"></i></div>`; }).join("")}</div>
    <div class="nu-achse"><span>${esc(nuTagKurz(tage[0]?.tag || ""))}</span><span>${esc(nuTagKurz(tage[tage.length - 1]?.tag || ""))}</span></div>`;
}
function nuTageHtml(tage) {
  if (!tage.length) return "";
  const mit = tage.filter((t) => t.aktive), schnitt = mit.length ? Math.round(mit.reduce((a, t) => a + t.aktive, 0) / mit.length) : 0, best = tage.reduce((a, t) => (t.aktive > a.aktive ? t : a), tage[0]);
  return `<div class="karte nu-karte"><b>👥 Wie viele Mitglieder waren da?</b>
    <p style="margin:4px 0 6px">Im Schnitt <b>${schnitt} Mitglieder</b> am Tag${best?.aktive ? ` · am meisten am ${esc(nuTagKurz(best.tag))} mit <b>${best.aktive}</b>` : ""}.</p>
    ${nuSaeulen(tage, (t) => t.aktive, (n) => `${n} Mitglied${n === 1 ? "" : "er"} in der App`)}</div>`;
}
// Nachrichten, Push und E-Mail je Tag als gestapelte Säulen
function nuVersandHtml(tage) {
  if (!tage.length) return "";
  const s = (k) => tage.reduce((a, t) => a + (t[k] || 0), 0), max = Math.max(1, ...tage.map((t) => t.nachrichten + t.push + t.email));
  return `<div class="karte nu-karte"><b>💬 Was wurde verschickt?</b>
    <div class="nu-leg"><span><i class="nu-n"></i> ${nuZahl(s("nachrichten"))} Nachrichten</span><span><i class="nu-p"></i> ${nuZahl(s("push"))} Push</span><span><i class="nu-m"></i> ${nuZahl(s("email"))} E-Mails</span></div>
    <div class="nu-tage nu-stapel">${tage.map((t) => `<div data-z="${esc(nuTagKurz(t.tag))}: ${t.nachrichten} Nachrichten · ${t.push} Push · ${t.email} E-Mails">${[["nu-m", t.email], ["nu-p", t.push], ["nu-n", t.nachrichten]].map(([c, n]) => n ? `<i class="${c}" style="height:${(n / max * 100).toFixed(1)}%"></i>` : "").join("")}</div>`).join("")}</div>
    <div class="nu-achse"><span>${esc(nuTagKurz(tage[0].tag))}</span><span>${esc(nuTagKurz(tage[tage.length - 1].tag))}</span></div>
    <p class="hinweis" style="margin:4px 0 0">Push = Benachrichtigung aufs Handy. Gezählt wird nur die Anzahl – nie, was drinsteht.</p></div>`;
}
// Beliebteste Bereiche (Hauptbereiche, Unterbereiche eingerechnet) und was noch zu entdecken ist
function nuBereicheHtml(d) {
  const roh = d.bereiche || {}, haupt = new Map();
  for (const [b, n] of Object.entries(roh)) { const o = (typeof nzOber === "function" && nzOber(b)) || b; if (!NZ_NAMEN[o]) continue; haupt.set(o, (haupt.get(o) || 0) + n); }
  const liste = [...haupt.entries()].sort((a, b) => b[1] - a[1]), top = liste.slice(0, 10), max = Math.max(1, ...top.map((x) => x[1])), summe = liste.reduce((a, x) => a + x[1], 0) || 1;
  const wer = d.wer || {};
  const entdecken = Object.keys(NZ_NAMEN).filter((b) => !(typeof nzOber === "function" && nzOber(b)) && !haupt.has(b) && !["gruppe", "sos", "sicherheit", "chat", "mitglied", "dokansicht", "protokoll", "aktion", "suche", "buero"].includes(b) && document.getElementById("v-" + b));
  return `<div class="karte nu-karte"><b>⭐ Die beliebtesten Bereiche</b>
    ${top.length ? top.map(([b, n], i) => `<div class="nu-zeile" data-z="${esc(nuName(b))}: ${nuZahl(n)}× geöffnet${wer[b] ? ` von ${wer[b]} Mitgliedern` : ""}"><span>${i + 1}. ${esc(nuName(b))}</span><div class="nz-balken"><i style="width:${Math.round(n / max * 100)}%"></i></div><b>${Math.round(n / summe * 100)} %</b></div>`).join("")
      : '<p class="hinweis">Noch keine Zahlen in diesem Zeitraum.</p>'}
    ${entdecken.length ? `<p style="margin:10px 0 4px"><b>🔎 Noch zu entdecken</b> <span class="hinweis">– in diesem Zeitraum kaum genutzt:</span></p><div>${entdecken.map((b) => `<button type="button" class="stmarke nu-entdecken" onclick="fensterZu($('nuBlatt'));zeige('${esc(b)}')">${esc(nuName(b))}</button>`).join(" ")}</div>` : ""}</div>`;
}
// Womit wird die App genutzt? (Anteil der Starts)
function nuGeraeteHtml(g) {
  const s = (k) => (g[k + "_app"] || 0) + (g[k + "_browser"] || 0), alle = Object.values(g).reduce((a, n) => a + n, 0);
  if (!alle) return "";
  const p = (n) => Math.round(n / alle * 100), app = Object.entries(g).filter(([k]) => k.endsWith("_app")).reduce((a, [, n]) => a + n, 0);
  const zeile = (sym, t, n) => n ? `<div class="nu-zeile" data-z="${esc(t)}: ${p(n)} % der Starts"><span>${sym} ${esc(t)}</span><div class="nz-balken"><i style="width:${p(n)}%"></i></div><b>${p(n)} %</b></div>` : "";
  return `<div class="karte nu-karte"><b>📱 Womit wird die App genutzt?</b>
    ${zeile("🤖", "Android", s("android"))}${zeile("🍏", "iPhone", s("iphone"))}${zeile("💻", "Computer", s("pc"))}${zeile("❔", "Sonstiges", s("sonst"))}
    <p style="margin:8px 0 0"><b>${p(app)} %</b> der Starts als installierte App, <b>${100 - p(app)} %</b> im Internet-Browser.${p(app) < 80 ? ' <span class="hinweis">Installiert startet die App schneller und meldet sich zuverlässiger – Hilfe unter „Hilfe & Tipps“.</span>' : ""}</p></div>`;
}
