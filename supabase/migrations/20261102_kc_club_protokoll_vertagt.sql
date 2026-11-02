-- 2.802.0 KC-CLUB-PROTOKOLL-VERTAGT + KC-CLUB-VORSCHLAG-BEHANDELT (Wunsch #50 Hansi, 02.11.2026)
-- vertagt: Tagesordnungspunkte, die im Protokoll als „vertagt“ angehakt sind → kommen in der nächsten Sitzung als offene Punkte wieder.
-- behandelt_in: in welchem Protokoll ein Themen-Vorschlag behandelt wurde (beim Veröffentlichen gesetzt). Nur Ergänzungen, nichts wird gelöscht.
alter table public.kc_club_sitzungsprotokolle add column if not exists vertagt text[] not null default '{}';
alter table public.kc_club_vorschlaege add column if not exists behandelt_in uuid references public.kc_club_sitzungsprotokolle(id) on delete set null;
