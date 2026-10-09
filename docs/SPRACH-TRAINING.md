# 🎓 Sprach-Training (KC-CLUB-SPRACH-TRAINING, ab 2.152.0)

Wunsch Hansi (09.10.2026): Die App zeigt Befehle als Text, jeder spricht sie nach – so merkt sich das Programm, wie jeder seine Befehle spricht.

## Was gelernt wird
Die Spracherkennung macht das Handy (Google/Apple); die App bekommt nur den erkannten Text. Gelernt wird also, **was das Handy hört**:
- **Satz-Variante**: gehört „zurücke bitte“ → gemeint „Zurück“ (gilt genau oder fast genau, Abstand ≤ 2).
- **Namens-Variante**: gehört „Erikah“ → Erika – gilt dann für alle Befehle mit Namen (Chat mit, Nachricht an, Ruf an, Brief an).
  Nur wenn ähnlich klingend (≥ 3 Buchstaben, kleiner Abstand, ≤ 2 Wörter) – sonst wird nur der ganze Satz gemerkt.
- Je Person (`kc_club_person_einstellung`, Schlüssel `sprache_training`), höchstens 300 Sätze / 200 Namen, keine Tonaufnahmen.

## Ablauf
⚙️ Einstellungen → 🎓 Sprach-Training, 🎙️ → 📋 Alle Befehle → 🎓 Trainieren, oder über den **Tipp des Tages** (für alle, mit Spracherkennung).
Vier Trainings: ⚡ Kurz (15), 👥 Namen (8 häufigste Chats), 👥 Alle Namen, 📚 Alles. Karte: „Sag: …“ → 🎙️ → ✅ verstanden / 🟡 gemerkt / ❌ nochmal.
**Beim Training wird nie etwas ausgeführt.** SOS/Notfall gibt es im Training nicht. Fortschritt wird gemerkt („Weiter, wo du aufgehört hast“).
🔄 „Training zurücksetzen“ löscht nur das Trainierte.

## Technik
- `SB_TRAINING` (Liste, erweiterbar; Test: jeder Satz wird erkannt), `sbtStart/sbtLos/sbtKarte/sbtPruefen`, `sbVorbereiten` (wendet Gelerntes vor der Erkennung an).
- Server: `sprache_training` (Satz/Name, geprüft, Protokoll nur Art), `sprache_training_reset`; `sprache_woerter` liefert das eigene Training mit.
- Neu erkannt: „Zettel für alle an die Pinnwand hängen“, „Schild drucken“, „Studio öffnen“ (Ziele `schilder`, `studio` mit Rechteprüfung).
