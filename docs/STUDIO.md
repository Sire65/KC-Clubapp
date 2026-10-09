# 🎬 Studio (KC-CLUB-STUDIO, ab 2.136.0)

Foto, Mitschauen und Live zeigen an einem Platz: 🎬 in der Statusleiste oben.

## Bedienung
1. Mitglied suchen und antippen (wer gerade online ist, steht oben).
2. Pult: **📸 Foto** · **🔴 Mitschauen** · **📺 Live zeigen**.
3. Bühne zeigt Bild bzw. Live-Bild; darunter Uhr („läuft seit“ / „noch“), dann drei gleich große Knöpfe (Foto · Speichern · Beenden).
4. Fotos dieser Sitzung stehen unten – antippen = speichern (iPhone/iPad: „Bild sichern“ → Fotos).

## Rechte
| Wer | 📸 Foto / 🔴 Mitschauen | 📺 Live zeigen |
|---|---|---|
| Admin | ja | ja |
| Mitglied mit „📺 Live zeigen (dauerhaft)“ | nein | ja |
| Mitglied mit „⭐ Kurz alles“ (30 Min – 8 Std) | ja, bis Ablauf | ja, bis Ablauf |

Freischalten: nur der Admin, im Studio beim gewählten Mitglied unter „🔑 … freischalten“ (Server: `studio_recht_setzen`, gespeichert in `kc_club_person_einstellung` / `studio_recht`, Protokoll `studio_recht`).
Das andere Mitglied wird **immer** gefragt und kann jederzeit beenden. Höchstdauer 30 Minuten.

## Echtes Live (KC-CLUB-STUDIO-SPIEGEL)
- Übertragen wird der **sichtbare Inhalt** der Club-App (keine Fotos, keine Skripte), gepackt, nur bei Änderung, höchstens alle 0,7 s – etwa 1 s Versatz.
- Empfänger baut ihn in einem abgeschotteten Rahmen ohne Skripte nach (`sandbox="allow-same-origin"`), Skript-/`on…`-Teile werden beim Senden **und** Empfangen entfernt.
- Nie übertragen: Eingaben in PIN-/Passwort-/Code-Feldern.
- Beim **Zeigen** automatisch verdeckt (Registry `SPG_PRIVAT`, erweiterbar): Chats, Nachrichten, Gruppen, Büro, Erstattung, Admin-Fenster. Dazu **🙈 Vorhang** (verdeckt kurz alles).
- Grenze: Eine Web-App sieht nur sich selbst – nie das ganze Handy.
- Kosten: keine (vorhandene Server-Funktion, kein Fremddienst).
