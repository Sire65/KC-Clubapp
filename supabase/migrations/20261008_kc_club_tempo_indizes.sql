-- KC-CLUB-TEMPO (2.113.0, Wunsch Hansi „Tempo-Check … mit Indizes“, Weg B).
-- Tempo-Check 08.10.2026: Eine Abfrage braucht im Mittel ~10 ms – die Datenbank ist schnell. Aber kc_club_protokoll hatte nur den
-- Primärschlüssel: 15.100 Abfragen haben die ganze Tabelle gelesen (20,7 Mio. Zeilen), fast nie über ein Verzeichnis. Die Tabelle
-- wächst jeden Tag – genau hier wäre es mit mehr Daten langsamer geworden. Die Club-App fragt sie nach aktion + zeit (34×/29×)
-- und person_id + aktion + zeit (13×) ab → zwei passende Verzeichnisse.
-- kc_club_person_einstellung: Schlüssel (person_id, schluessel) – Abfragen nur nach schluessel (z. B. alle Avatare) lasen alles.
-- Dazu Verzeichnisse für Verknüpfungen, über die die App sucht (Supabase-Hinweis „unindexed foreign keys“).
-- Nur neue Verzeichnisse: keine Daten ändern sich, nichts wird gelöscht. Rückweg: die Verzeichnisse mit drop index wieder entfernen
-- (Namen unten; alle beginnen mit kc_club_tempo_).
create index if not exists kc_club_tempo_protokoll_aktion_zeit on public.kc_club_protokoll (aktion, zeit desc);
create index if not exists kc_club_tempo_protokoll_person_aktion_zeit on public.kc_club_protokoll (person_id, aktion, zeit desc);
create index if not exists kc_club_tempo_einstellung_schluessel on public.kc_club_person_einstellung (schluessel);
create index if not exists kc_club_tempo_teilnahme_person on public.kc_club_teilnahme (person_id);
create index if not exists kc_club_tempo_reaktionen_person on public.kc_club_reaktionen (person_id);
create index if not exists kc_club_tempo_stimmen_person on public.kc_club_stimmen (person_id);
create index if not exists kc_club_tempo_aufgaben_protokoll on public.kc_club_aufgaben (protokoll_id);
create index if not exists kc_club_tempo_einwaende_protokoll on public.kc_club_sitzungsprotokoll_einwaende (protokoll_id);
create index if not exists kc_club_tempo_gelesen_person on public.kc_club_sitzungsprotokoll_gelesen (person_id);
create index if not exists kc_club_tempo_umfrage_optionen on public.kc_club_terminumfrage_optionen (umfrage_id);
create index if not exists kc_club_tempo_umfrage_antworten_person on public.kc_club_terminumfrage_antworten (person_id);
create index if not exists kc_club_tempo_fotos_anlage on public.kc_club_fotos (attachment_id);
create index if not exists kc_club_tempo_fotos_vorschau on public.kc_club_fotos (vorschau_id);
create index if not exists kc_club_tempo_gemerkt_nachricht on public.kc_club_gemerkt (message_id);
create index if not exists kc_club_tempo_wichtig_person on public.kc_club_nachricht_wichtig (person_id);
create index if not exists kc_club_tempo_mitfahrt_platz_person on public.kc_club_mitfahrt_platz (person_id);
create index if not exists kc_club_tempo_hilfe_antworten_person on public.kc_club_hilfe_antworten (person_id);
create index if not exists kc_club_tempo_nachricht_anlage on public.kc_communication_message_attachments (attachment_id);
create index if not exists kc_club_tempo_nachricht_ausgeblendet on public.kc_communication_message_hidden (message_id);
create index if not exists kc_club_tempo_archiv_freigabe_dok on public.kc_club_archiv_freigaben (dokument_id);
create index if not exists kc_club_tempo_boerse_treffer_gegen on public.kc_club_boerse_treffer (gegen_id);
create index if not exists kc_club_tempo_chat_stimme_person on public.kc_club_chat_stimme (person_id);
create index if not exists kc_club_tempo_chat_kontakt_person on public.kc_club_chat_kontakt (person_id);
analyze public.kc_club_protokoll;
analyze public.kc_club_person_einstellung;
