// 2.842.0 KC-CLUB-ANBIETER-NEUES (Wunschliste #78, Wunsch Hansi 03.11.2026 „Einen Knopf im Adminbereich, der bei allen unseren Anbietern wie Supabase,
// Neon, Cloudflare, B2, GitHub usw. nach Updates schaut und prüft, ob da Funktionen neu sind, die wir übernehmen könnten“ / „neue Version oder Changelog,
// oder Ankündigen von Wartungsarbeiten usw.“). Admin-Kachel „📰 Anbieter“ → ein Blatt: oben die Lage in einem Satz, darunter je Anbieter angekündigte
// Wartungen, Störungen (14 Tage) und Neuerungen (30 Tage). Daten nur beim Öffnen (Server „anbieter_neues“, dort 30 Min. gemerkt) – nichts im Hintergrund.
// Die Anbieter schreiben englisch: Überschriften und Art (🛠️ Wartung, ⚠️ Störung, 🆕 Neu) sind deutsch, der Titel bleibt im Original; antippen öffnet die Seite.
// „💡 Prüfen lassen“ legt eine Neuerung auf die Wunschliste – Claude schaut dann, ob wir sie übernehmen können. Neu seit dem letzten Blick: Marke „NEU“
// (je Gerät gemerkt). Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const ANB = { daten: null, laedt: false };
const ANB_GESEHEN = "kc_club_anb_gesehen";
const anbZeit = (iso) => (iso ? new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "");
const anbTag = (iso) => (iso ? new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(new Date(iso)) : "");
// Offene Störung = nicht „behoben“ und höchstens 2 Tage alt; ältere ohne „behoben“ → „Stand unklar“ (kein Fehlalarm, aber auch nie als OK – Regel 11)
const anbAktuell = (s, ab = Date.now() - 2 * 86400000) => s.art === "stoerung" && !s.erledigt && Date.parse(s.zeit) >= ab;
// Lage für die Kachel und den Kopf: offene Störung (2 Tage) > angekündigte Wartung > alles ruhig; ohne Daten nie „OK“ (AGENTS Regel 11)
function anbLage(d = ANB.daten) {
  if (!d) return ["keine", "Neues & Wartungen · antippen"];
  const A = d.anbieter || [], frisch = Date.now() - 2 * 86400000;
  const stoer = A.flatMap((a) => (a.status || []).filter((s) => anbAktuell(s, frisch)).map(() => a.name));
  const wart = A.filter((a) => (a.wartung || []).some((w) => !w.bis || Date.parse(w.bis) >= Date.now())).map((a) => a.name);
  const fehlt = A.filter((a) => a.fehler?.length).map((a) => a.name);
  if (stoer.length) return ["gelb", `⚠️ Störung bei ${[...new Set(stoer)].join(", ")}`];
  if (wart.length) return ["gelb", `🛠️ Wartung angekündigt: ${wart.join(", ")}`];
  if (fehlt.length) return ["grau", `❔ nicht alles abrufbar (${fehlt.join(", ")})`];
  return ["gruen", "Keine Störung, keine Wartung angekündigt"];
}
async function anbStart(frisch = false) {
  if (!ICH?.admin) return;
  if (!ANB.daten || frisch) blattAuf("anbBlatt", `<h3 style="margin:0">📰 Anbieter – Neues & Wartungen</h3><p class="hinweis">⏳ Die Seiten der Anbieter werden abgefragt …</p>`);
  else anbZeigen();
  if (ANB.laedt) return; ANB.laedt = true;
  try { ANB.daten = await api("anbieter_neues", { frisch }); anbZeigen(); }
  catch (e) { if (!ANB.daten) blattAuf("anbBlatt", `<h3 style="margin:0">📰 Anbieter</h3><p class="hinweis">⚠️ Gerade nicht abrufbar: ${esc(e?.message || String(e))}</p><div class="knoepfe"><button class="knopf haupt" onclick="anbStart(true)">↻ Nochmal</button></div>`); else meldeFehler(e); }
  finally { ANB.laedt = false; }
}
function anbZeigen() {
  const d = ANB.daten; if (!d) return;
  let gesehen = 0; try { gesehen = Number(localStorage.getItem(ANB_GESEHEN)) || 0; } catch {}
  const neuMarke = (iso) => (iso && gesehen && Date.parse(iso) > gesehen ? ' <span class="anb-neu">NEU</span>' : "");
  const [farbe, satz] = anbLage(d);
  const zeile = (sym, e, rechts = "") => `<li class="anb-zeile"><a href="${esc(e.link || "#")}" target="_blank" rel="noopener"><span class="anb-sym">${sym}</span><span class="anb-t">${esc(e.t)}${neuMarke(e.zeit || e.von)}</span>${rechts}</a></li>`;
  const block = (a) => {
    const w = (a.wartung || []).map((x) => zeile("🛠️", x, `<small class="anb-wann">${esc(anbZeit(x.von))}${x.bis ? " – " + esc(anbZeit(x.bis)) : ""}</small>`)).join("");
    const s = (a.status || []).map((x) => { const ak = anbAktuell(x); return zeile(x.art === "wartung" ? "🛠️" : x.erledigt ? "✅" : ak ? "⚠️" : "❔", x, `<small class="anb-wann">${esc(anbTag(x.zeit))}${x.erledigt ? " · behoben" : x.art === "stoerung" ? (ak ? " · offen" : " · Stand unklar") : ""}</small>`); }).join("");
    const n = (a.neu || []).map((x) => `<li class="anb-zeile anb-mit-knopf"><a href="${esc(x.link || "#")}" target="_blank" rel="noopener"><span class="anb-sym">🆕</span><span class="anb-t">${esc(x.t)}${neuMarke(x.zeit)}</span><small class="anb-wann">${esc(anbTag(x.zeit))}</small></a>
      <button type="button" class="knopf klein" title="Auf die Wunschliste: Claude prüft, ob wir das übernehmen können" onclick="einmal(this, () => anbPruefen('${esc(a.id)}', '${esc(String(x.link || ""))}'))">💡 Prüfen lassen</button></li>`).join("");
    const offen = (a.status || []).filter((x) => anbAktuell(x)).length, wa = (a.wartung || []).length;
    const marke = a.fehler?.length ? '<span class="marke anb-grau">❔ nicht abrufbar</span>' : offen ? `<span class="marke anb-gelb">⚠️ ${offen} offen</span>` : wa ? `<span class="marke anb-gelb">🛠️ ${wa} Wartung${wa === 1 ? "" : "en"}</span>` : a.feeds ? '<span class="marke anb-gruen">✔ ruhig</span>' : '<span class="marke">nur Link</span>';
    return `<details class="karte anb-block" data-klappe="anb_${esc(a.id)}"${offen || wa ? " open" : ""}><summary><b>${esc(a.name)}</b> ${marke}<small class="anb-wofuer">${esc(a.wofuer)}</small></summary>
      ${a.fehler?.length ? `<p class="hinweis">❔ ${esc(a.fehler.join(" · "))} – Stand unbekannt, bitte auf der Seite nachsehen.</p>` : ""}
      ${w ? `<h4>🛠️ Angekündigte Wartungen</h4><ul class="anb-liste">${w}</ul>` : ""}
      ${s ? `<h4>Störungen und Wartungen (letzte 14 Tage)</h4><ul class="anb-liste">${s}</ul>` : a.status ? "" : ""}
      ${n ? `<h4>🆕 Neuerungen (letzte 30 Tage)</h4><ul class="anb-liste">${n}</ul>` : ""}
      ${!w && !s && !n && !a.fehler?.length ? `<p class="hinweis">${a.feeds ? "Nichts Neues in den letzten Wochen." : "Dieser Anbieter hat keine abrufbare Neuigkeiten-Seite."}</p>` : ""}
      ${a.ausgeblendet ? `<p class="hinweis" style="margin:4px 0 0">${a.ausgeblendet} Meldung${a.ausgeblendet === 1 ? "" : "en"} aus anderen Regionen bzw. fernen Rechenzentren ausgeblendet (betrifft uns nicht).</p>` : ""}
      <p style="margin:6px 0 0"><a href="${esc(a.seite)}" target="_blank" rel="noopener">🔗 Seite von ${esc(a.name)} öffnen</a></p></details>`;
  };
  blattAuf("anbBlatt", `<h3 style="margin:0">📰 Anbieter – Neues & Wartungen</h3>
    <div class="anb-lage anb-${farbe}">${esc(satz)}</div>
    <p class="hinweis" style="margin:4px 0 8px">Stand ${esc(anbZeit(d.zeit))} Uhr · Die Anbieter schreiben englisch – antippen öffnet die Original-Seite. „💡 Prüfen lassen“ legt eine Neuerung auf die Wunschliste.</p>
    ${(d.anbieter || []).map(block).join("")}
    <div class="knoepfe"><button class="knopf" onclick="anbStart(true)">↻ Neu abfragen</button><button class="knopf haupt" onclick="fensterZu($('anbBlatt'))">Schließen</button></div>`);
  klappenMerken($("anbBlatt"));
  try { localStorage.setItem(ANB_GESEHEN, String(Date.now())); } catch {}
  if (typeof kachelnZeigen === "function" && aktuelleAnsicht === "start") kachelnZeigen(); // Lämpchen der Kachel nachziehen
}
async function anbPruefen(id, link) {
  const a = (ANB.daten?.anbieter || []).find((x) => x.id === id), e = a?.neu?.find((x) => String(x.link || "") === link); if (!a || !e) return;
  if (!(await frage(`💡 „${e.t}“ (${a.name}) auf die Wunschliste setzen?\n\nClaude prüft dann, ob wir das in der Club-App gebrauchen können.`, { ja: "Auf die Wunschliste", nein: "Abbrechen" }))) return;
  try {
    const r = await api("wl_speichern", { text: `Anbieter-Neuerung prüfen (${a.name}, ${anbTag(e.zeit)}): „${e.t}“ – können wir das für die Club-App übernehmen? Quelle: ${e.link}`, bereich: "Club-App", wichtig: false });
    melde(`💡 Auf der Wunschliste${r?.nr ? " als Nr. " + r.nr : ""}`);
  } catch (x) { meldeFehler(x); }
}
