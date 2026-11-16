// Drehbuch „Deine App – so, wie du sie willst“ (KC-CLUB-ANSICHTFILM, neu aufgebaut 15.11.2026 für App 2.954.0): je Szene (id wie in texte.json) die Bilder aus der echten App.
// h.foto({ finger, tipp, ringe, zoom, bei }) – finger/ringe: CSS-Wahl oder {x,y} in % des Bildschirms; zoom: { um: Wahl | x,y, f: Faktor }.
const NACHHER = ["termine", "kommunikation", "fotos", "dienste"];
const start = async (h) => { await h.js(() => { if (aktuelleAnsicht !== "start") zeige("start", true); window.scrollTo(0, 0); }); await h.warte(400); };
const zuReitern = async (h, block = "start") => { await h.js((b) => { ($("kaKopfKnoepfe")?.closest(".abschnitt") || $("register")).scrollIntoView({ block: b }); }, block); await h.warte(400); };
const club = async (h) => { await h.js(() => { if (reg !== "verein") register("verein"); }); await h.warte(500); };
const aus = async (h, liste) => { await h.js((l) => { KA.aus = l; KA_NUR_AUS = false; kachelnZeigen(); registerZeigen(); }, liste); await h.warte(500); };
const ausAlle = (h) => h.js((n) => kaSortiert("verein").map((k) => k.id).filter((id) => !n.includes(id)), NACHHER);
const stufe = async (h, s) => { await h.js((s) => kopfRolloSetzen(s), s); await h.warte(900); };
const tippen = async (h) => { await h.js(() => kopfRollo("weiter")); await h.s.waitForFunction(() => !document.querySelector("#v-start .hero")?.dataset.rollt, null, { timeout: 8000 }).catch(() => {}); await h.warte(500); };
const einstellung = async (h, bereich, id) => {
  await h.js(([b, id]) => { zeige("einstellungen"); setTimeout(() => { euOeffnen(b); setTimeout(() => { const e = document.getElementById(id); (e?.closest(".schalter, label, .zeile") || e)?.scrollIntoView({ block: "center" }); }, 300); }, 300); }, [bereich, id]);
  await h.warte(1500);
};
const MEHR = "button[data-v='einstellungen']";
export default {
  einfach: async (h) => { await h.js(() => ansichtSetzen("einfach")); await h.warte(1800); await start(h);
    const a = await h.foto({}); const b = await h.foto({ vorher: () => h.js(() => window.scrollTo(0, 320)), ringe: ["#raster"] }); return [a, b]; },
  erweitert: async (h) => { await h.js(() => $("ansichtKnopf").scrollIntoView({ block: "center" })); await h.warte(500);
    const a = await h.foto({ finger: "#ansichtKnopf", tipp: true });
    await h.js(() => ansichtSetzen("erweitert")); await h.warte(1800); await start(h); await club(h); await zuReitern(h);
    const b = await h.foto({ ringe: ["#register"] });
    await h.js(() => $("ansichtKnopf").scrollIntoView({ block: "center" })); await h.warte(500);
    const c = await h.foto({ ringe: ["#ansichtKnopf"], bei: 0.78 }); return [a, b, c]; },
  reiter: async (h) => { await zuReitern(h); const r = []; for (const x of ["verein", "mein", "programme"]) { await h.js((x) => register(x), x); await h.warte(700);
      r.push(await h.foto({ ringe: [`#register button[data-r='${x}']`] })); } await club(h); return r; },
  reiterzug: async (h) => { await zuReitern(h); const a = await h.foto({ finger: "#register button[data-r='mein']", tipp: true });
    await h.js(() => { document.querySelector("#register button[data-r='mein']").classList.add("zieht"); }); const b = await h.foto({ finger: { x: 22, y: 9 } , warte: 100 });
    await h.js(() => { KA.register = ["mein", "verein", "programme"]; registerZeigen(); }); await h.warte(500); const c = await h.foto({ ringe: ["#register button[data-r='mein']"] });
    await h.js(() => { KA.register = []; registerZeigen(); }); await h.warte(300); return [a, b, c]; },
  lange: async (h) => { await club(h); await zuReitern(h); const a = await h.foto({ finger: "#raster .kachel[data-id='fotos']", tipp: true });
    await h.js(() => kaBearbeiten(true)); await h.warte(800); await zuReitern(h); return [a, await h.foto({ ringe: ["#raster .kachel[data-id='termine']"] })]; },
  ziehen: async (h) => { await zuReitern(h); await h.js(() => document.querySelector("#raster .kachel[data-id='fotos']").scrollIntoView({ block: "center" })); await h.warte(300);
    const a = await h.foto({ finger: "#raster .kachel[data-id='fotos'] .kstrg button:nth-child(2)", tipp: true });
    await h.js(() => kaSchieben("fotos", -kaSpalten())); await h.warte(600); const b = await h.foto({ ringe: ["#raster .kachel[data-id='fotos']"] });
    for (let i = 0; i < 3; i++) await h.js(() => kaSchieben("fotos", -kaSpalten())); await h.warte(600); await zuReitern(h);
    return [a, b, await h.foto({ ringe: ["#raster .kachel[data-id='fotos']"] })]; },
  ausblenden: async (h) => { await zuReitern(h); const a = await h.foto({ finger: "#raster .kachel[data-id='sos'] .kweg", tipp: true });
    await h.js(() => kaSichtbar("sos", false)); await h.warte(700); await zuReitern(h); const b = await h.foto({ ringe: ["#raster .kachel[data-id='sos']"] });
    await h.markiere("Fertig", "fertig"); const c = await h.foto({ finger: "#film-fertig", tipp: true, bei: 0.75 });
    return [a, b, c]; },
  nachher: async (h) => { await h.js(() => kaBearbeiten(false)); await aus(h, []); await h.js(() => { KA.reihe = null; }); await zuReitern(h);
    const a = await h.foto({}); await aus(h, await ausAlle(h)); await zuReitern(h); return [a, await h.foto({ ringe: ["#raster"], bei: 0.35 })]; },
  zahl: async (h) => { await zuReitern(h); return [await h.foto({ zoom: { x: 0, y: 0, f: 1.8 }, ringe: ["#register button[data-r='verein'] .anz"] }), await h.foto({ zoom: { x: 0, y: 0, f: 1.8 }, ringe: ["#register button[data-r='mein'] .anz"], bei: 0.75 })]; },
  auge: async (h) => { await h.js(() => window.scrollTo(0, 0)); await zuReitern(h, "center"); const a = await h.foto({ ringe: ["#kaKopfKnoepfe button"] });
    const b = await h.foto({ zoom: { um: "#kaKopfKnoepfe button", f: 2 }, ringe: ["#kaKopfKnoepfe button"] }); const b2 = await h.foto({ zoom: { um: "#kaKopfKnoepfe button", f: 2 }, finger: "#kaKopfKnoepfe button", tipp: true });
    await h.js(() => kaNurAus(true)); await h.warte(700); await h.js(() => window.scrollTo(0, 0)); await zuReitern(h, "start"); return [a, b, b2, await h.foto({ ringe: ["#raster"], bei: 0.75 })]; },
  affe: async (h) => { await h.js(() => window.scrollTo(0, 0)); await zuReitern(h, "center"); const a = await h.foto({ zoom: { um: "#kaKopfKnoepfe button", f: 2 }, ringe: ["#kaKopfKnoepfe button"] });
    const b = await h.foto({ finger: "#kaKopfKnoepfe button", tipp: true }); await h.js(() => kaNurAus(false)); await h.warte(600);
    await h.js(() => $("kaAusHinweis").scrollIntoView({ block: "center" })); await h.warte(400); return [a, b, await h.foto({ ringe: ["#kaAusHinweis"], bei: 0.7 })]; },
  einblenden: async (h) => { await h.js(() => kaBearbeiten(true)); await h.warte(800); await h.js(() => document.querySelector("#raster .kachel.aus").scrollIntoView({ block: "center" })); await h.warte(300);
    const a = await h.foto({ ringe: ["#raster .kachel.aus"] }); const b = await h.foto({ finger: "#raster .kachel.aus .ein", tipp: true });
    const id = await h.js(() => document.querySelector("#raster .kachel.aus").dataset.id); await h.js((id) => kaSichtbar(id, true), id); await h.warte(600);
    const c = await h.foto({ ringe: [`#raster .kachel[data-id='${id}']`], bei: 0.75 }); await h.js(() => kaBearbeiten(false)); await aus(h, await ausAlle(h)); return [a, b, c]; },
  groesse: async (h) => { await start(h); const a = await h.foto({ finger: MEHR, tipp: true }); await einstellung(h, "startseite", "kachelGroesseWahl");
    const b = await h.foto({ ringe: ["#kachelGroesseWahl"] }); await h.js(() => kachelGroesse("mini")); await h.warte(500);
    const c = await h.foto({ ringe: ["#kachelGroesseWahl"] });
    await aus(h, []); await start(h); await zuReitern(h); const d = await h.foto({ ringe: ["#raster"], bei: 0.72 }); await h.js(() => kachelGroesse("normal")); return [a, b, c, d]; },
  drehen: async (h) => { await zuReitern(h); const a = await h.foto({ finger: "#raster .kachel[data-id='kommunikation'] .kr-zeichen", tipp: true });
    await h.js(() => krUmdrehen(document.querySelector("#raster .kachel[data-id='kommunikation']"))); await h.warte(1300);
    const b = await h.foto({ ringe: ["#raster .kachel.kr-hinten, #raster .kr-hinten"] });
    await h.js(() => { try { krUmdrehen(document.querySelector("#raster .kr-hinten"), true); } catch {} }); await h.warte(1300); await aus(h, await ausAlle(h)); return [a, b]; },
  kopf: async (h) => { await start(h); await stufe(h, "offen"); const r = [await h.foto({ zoom: { x: 50, y: 0, f: 1.7 }, finger: "#kopfPfeil", tipp: true })];
    for (let i = 0; i < 3; i++) { await tippen(h); r.push(await h.foto({ ringe: ["#kopfPfeil"] })); } await tippen(h); r.push(await h.foto({ ringe: ["#kopfPfeil"], bei: 0.85 })); return r; },
  kopfneu: async (h) => { await stufe(h, "ganz"); await h.js(() => { KPN.an = true; kopfPfeilNeuZeigen("ganz"); }); await h.warte(700);
    const a = await h.foto({ zoom: { x: 50, y: 0, f: 1.8 }, ringe: ["#kopfPfeil"] }); await h.js(() => { KPN.an = false; kopfPfeilNeuZeigen("ganz"); });
    const b = await h.foto({ finger: "#kopfPfeil", tipp: true }); await stufe(h, "offen"); return [a, b, await h.foto({ bei: 0.7 })]; },
  startmeldungen: async (h) => { await start(h); const a = await h.foto({ finger: MEHR, tipp: true });
    await h.js(() => { zeige("einstellungen"); }); await h.warte(1200); await h.markiere("Ansagen, Töne", "ansagen", "#v-einstellungen"); const b = await h.foto({ finger: "#film-ansagen", tipp: true });
    await einstellung(h, "ansagen", "setTipps"); await h.js(() => document.getElementById("setTipps").closest(".schalter, label, .zeile, div").scrollIntoView({ block: "start" })); await h.js(() => window.scrollBy(0, -120)); await h.warte(400);
    const c = await h.foto({ ringe: ["#setTipps", "#setWasNeu"], bei: 0.55 }); await start(h); return [a, b, c]; },
};
