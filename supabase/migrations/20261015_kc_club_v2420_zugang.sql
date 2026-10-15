-- 2.420.0 KC-CLUB-ZUGANG (Wunsch Hansi „den Zugang für Gäste und Aushilfen einschränken: Nachrichten schreiben, SOS, Clubtermine, Spiele“)
-- Zugang je Person: „mitglied“ (alles wie bisher), „aushilfe“, „gast“. Was Gäste/Aushilfen dürfen, steht im Server (ZUGANG_AKTIONEN in kc-club),
-- der Admin ist dort immer „mitglied“. Die Anmeldung (kc_club_anmeldung) liefert die ganze Rollenzeile – keine Änderung an der Funktion nötig.
-- Bisherige Aushilfen (Amt „Aushilfe“) bekommen den Zugang „aushilfe“ (sie hatten schon keine Protokolle und keine Kontaktdaten).
-- Rückweg: alter table public.kc_club_rollen drop column if exists zugang;  (der Server behandelt eine fehlende Spalte als „mitglied“)
alter table public.kc_club_rollen add column if not exists zugang text not null default 'mitglied';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kc_club_rollen_zugang_check') then
    alter table public.kc_club_rollen add constraint kc_club_rollen_zugang_check check (zugang in ('mitglied', 'aushilfe', 'gast'));
  end if;
end $$;
update public.kc_club_rollen set zugang = 'aushilfe' where 'Aushilfe' = any(aemter) and not ist_admin and zugang = 'mitglied';
