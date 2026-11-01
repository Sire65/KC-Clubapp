// KC-CLUB-STROM-UEBERSICHT (2.799.0, 01.11.2026, Wunsch #55 Hansi „Ich glaube, die App ist ein Stromfresser. Andauernd ist mein Akku leer. –
// Alles bauen. Aber sparsam.“): Admin-Übersicht „🔋 Stromverbrauch“. Teil 1 dieses Gerät (Akku und Verbrauch je Stunde; iPhone: nicht messbar),
// Teil 2 was gerade läuft – mit Ampel und je einem Spar-Tipp mit Schalter, Teil 3 die Rangliste der Bereiche aller Android-Geräte (7 Tage, ohne Namen).
// Gemessen wird im Hauptprogramm (KC-CLUB-STROM-RUHE/-MESSUNG, nur im Speicher bzw. einmal am Tag gemeldet); dieser Teil zeigt nur an.
// Nach jeder Änderung: node tools/teile-pruefsumme.mjs
const STROM_BEREICH_NAME = { start: "🏠 Startseite", nachrichten: "💬 Nachrichten", termine: "📅 Termine", mitglieder: "👥 Mitglieder", einstellungen: "⚙️ Einstellungen",
  fotos: "📷 Fotos", pinnwand: "📌 Pinnwand", spiele: "🎲 Spiele", buero: "🏢 Büro", protokolle: "📄 Protokolle", archiv: "🗄️ Archiv", dienste: "🗓️ Dienste",
  rueckseite: "🎭 Rückseite (Bühne, Spiegel …)", erklaervideo: "🎬 Erklär-Videos", tisch_live: "🪑 Runder Tisch live", vorschlaege: "💡 Vorschläge" };
const stromName = (b) => STROM_BEREICH_NAME[b] || b.replace(/_/g, " ");
let STROM_UE = null;
async function stromBlatt() {
  blattAuf("stromBlatt", `<h3 style="margin:0">🔋 Stromverbrauch</h3><div id="stromInhalt"><p class="hinweis">Wird gemessen …</p></div>`);
  stromZeichnen();
  try { STROM_UE = await api("strom_uebersicht", {}, { still: true }); } catch (e) { STROM_UE = { fehler: fehlerText(e, "") }; }
  stromZeichnen();
}
function stromLaeuft() { // was gerade läuft – jeweils [Ampel, Name, Zustand, Spar-Tipp, Schalter-HTML]
  let anim = 0; try { anim = document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity).length; } catch {}
  let kopf = false; try { kopf = typeof JZB !== "undefined" && !!JZB.raf; } catch {}
  const ton = window.kcTonZahl?.() || 0, wach = STROM.wach.size;
  const medien = [...STROM.medien].flatMap((s) => s.getTracks()).filter((t) => t.readyState === "live"), cam = medien.filter((t) => t.kind === "video").length, mic = medien.filter((t) => t.kind === "audio").length;
  let standort = false; try { standort = typeof ST !== "undefined" && ST?.watch != null; } catch {}
  const proMin = STROM.anfragen.filter((t) => Date.now() - t < 60000).length;
  const k = (fn, t) => `<button class="knopf klein" onclick="${fn};setTimeout(stromZeichnen, 300)">${t}</button>`;
  return [
    [anim > 8 ? "rot" : anim > 2 ? "gelb" : "gruen", "✨ Dauer-Animationen", `${anim} laufen gerade${STROM.ruhe ? " (Ruhe: stehen still)" : ""}`,
      "Nach 3 Min. ohne Tippen stehen sie von selbst still. Ganz ohne: Knöpfe ruhig stellen.", einst("animiert", true) ? k("einstellung('animiert', false)", "✨ Ruhige Knöpfe") : "✔ ruhig"],
    [kopf ? "gelb" : "gruen", "🍂 Bewegtes Kopfbild", kopf ? "läuft" : "steht", "Das Jahreszeiten-Bild bewegt sich (nach 3 Min. steht es). Ohne Bild spart am meisten.",
      einst("jahreszeit", true) ? k("jahreszeitUmschalten(false)", "🍂 Bild aus") : "✔ aus"],
    ["gruen", "🎏 Deko an der Leiste", (() => { try { return jzDekoWahl() === "aus" ? "aus" : "an"; } catch { return "?"; } })(), "Die Lichterkette funkelt – in Ruhe steht sie still.",
      (() => { try { return jzDekoWahl() === "aus" ? "✔ aus" : k("jzDekoSetzen('aus')", "🎏 Deko aus"); } catch { return ""; } })()],
    [RT.ok ? "gruen" : "grau", "⚡ Direkte Leitung", RT.ok ? "verbunden (im Hintergrund nach 60 s zu)" : "nicht verbunden", "Sie bringt Nachrichten sofort – sie schließt sich im Hintergrund von selbst.", ""],
    [ton ? "gelb" : "gruen", "🔊 Tonausgabe", ton ? `${ton} wach` : "schläft", "Schläft 3 s nach dem letzten Ton von selbst ein.", ""],
    [cam || mic ? "rot" : "gruen", "🎥 Kamera / Mikrofon", cam || mic ? `${cam ? "Kamera" : ""}${cam && mic ? " + " : ""}${mic ? "Mikrofon" : ""} an` : "aus", "Kostet viel Strom – nach dem Gespräch bzw. am Tisch wieder ausschalten.", ""],
    [wach ? "gelb" : "gruen", "📱 Bildschirm bleibt an", wach ? "ja (Video, Bühne oder Tisch)" : "nein", "Nur während Videos, Bühne und Runder Tisch – danach geht er wieder aus.", ""],
    [standort ? "rot" : "gruen", "📍 Standort", standort ? "wird geteilt" : "aus", "Standort-Teilen braucht GPS – nach dem Treffen beenden.", ""],
    [proMin > 20 ? "rot" : proMin > 8 ? "gelb" : "gruen", "📡 Anfragen an den Server", `${proMin} in der letzten Minute`, SPAR.an ? "Sparmodus ist an: seltener nachsehen." : "Der Sparmodus fragt seltener nach.",
      SPAR.an ? "✔ Sparmodus an" : k("(()=>{try{localStorage.setItem(SPAR_KEY,'an')}catch{};melde('🔋 Sparmodus an – gilt ab dem nächsten Öffnen der App')})()", "🔋 Sparmodus")],
  ];
}
function stromZeichnen() {
  const el = $("stromInhalt"); if (!el) return;
  const a = STROM.akku, e = STROM.erst, ab = STROM.abschnitt;
  let akku = '<p class="hinweis" style="margin:0">📱 Dieses Gerät gibt den Akkustand nicht heraus (iPhone und manche Browser) – Verbrauch hier nicht messbar.</p>';
  if (a) {
    const lv = Math.round(a.level * 100), h = e ? (Date.now() - e.t) / 3600000 : 0, verbr = e && h >= .25 ? Math.max(0, (e.lv - a.level * 100) / h) : null;
    akku = `<div class="adisplay" style="margin:0">${adZeile(a.charging ? "gruen" : lv < 20 ? "rot" : lv < 40 ? "gelb" : "gruen", "🔋 Akku", `${lv} %${a.charging ? " · lädt" : ""}`)}
      ${adZeile(verbr == null ? "grau" : verbr > 15 ? "rot" : verbr > 8 ? "gelb" : "gruen", "⏱️ Verbrauch", a.charging ? "lädt gerade – keine Messung" : verbr == null ? "wird gemessen (mind. 15 Min. ohne Laden)" : `${verbr.toFixed(1).replace(".", ",")} % je Stunde (seit ${zeitKurz(new Date(e.t).toISOString())})`)}
      ${ab?.bereich ? adZeile("keine", "📍 Gerade", stromName(ab.bereich)) : ""}</div>`;
  }
  const l = stromLaeuft();
  const U = STROM_UE, max = Math.max(1, ...(U?.bereiche || []).map((b) => b.proStunde || 0));
  const rang = !U ? '<p class="hinweis">Wird geladen …</p>' : U.fehler ? `<p class="hinweis">⚠️ ${esc(U.fehler)}</p>` : !U.bereiche.length
    ? '<p class="hinweis">Noch keine Messwerte. Android-Geräte melden einmal am Tag (frühestens am Tag danach).</p>'
    : `<p class="hinweis" style="margin:0 0 6px">Seit ${esc(tagKurz(U.ab))} · ${U.geraete} Android-${U.geraete === 1 ? "Gerät" : "Geräte"} · % Akku je Stunde, in der der Bereich offen war</p>
      ${U.bereiche.map((b) => `<div class="strom-rang"><span>${esc(stromName(b.bereich))}</span><span class="strom-balken"><i style="width:${b.proStunde == null ? 0 : Math.round(b.proStunde / max * 100)}%"></i></span>
        <b>${b.proStunde == null ? "–" : String(b.proStunde).replace(".", ",") + " %/h"}</b><small>${String(b.stunden).replace(".", ",")} Std. · ${b.geraete} ${b.geraete === 1 ? "Gerät" : "Geräte"}</small></div>`).join("")}
      <p class="hinweis" style="margin:6px 0 0">„–“ = weniger als 30 Minuten gemessen. Nur Zahlen – keine Namen, keine Inhalte.</p>`;
  el.innerHTML = `<h4 style="margin:10px 0 4px">📱 Dieses Gerät</h4>${akku}
    <h4 style="margin:12px 0 4px">⚙️ Was gerade läuft</h4>
    ${l.map(([f, n, z, tipp, knopf]) => `<div class="strom-zeile">${lampe(f)}<div><b>${esc(n)}</b> <span class="hinweis">${esc(z)}</span><div class="hinweis" style="font-size:.85rem">💡 ${esc(tipp)}</div></div>${knopf ? `<div>${knopf}</div>` : ""}</div>`).join("")}
    <h4 style="margin:12px 0 4px">📊 Bereiche aller Mitglieder (7 Tage)</h4>${rang}
    <div class="knoepfe"><button class="knopf" onclick="stromBlatt()">↻ Neu messen</button><button class="knopf" onclick="$('stromBlatt').remove()">Schließen</button></div>`;
}
