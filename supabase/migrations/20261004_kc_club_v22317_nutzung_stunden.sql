-- KC Club-App – Version 2.23.17
-- KC-CLUB-NUTZUNG-UHRZEIT (Wunsch Hansi: „zu welchen Uhrzeiten das Programm am meisten genutzt wird“).
--   Gezählt wird nur: Tag + Stunde (0–23, Berliner Zeit beim Antippen) + Anzahl Öffnungen. Keine Person, kein Gerät,
--   kein Bereich – die Stunde steht bewusst NICHT neben dem Bereich (sonst ließe sich bei wenigen Nutzern auf Personen schließen).
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies).
-- Rückweg: drop function kc_club_nutzung_stunden_zaehlen(date, integer[], integer[]); drop table kc_club_nutzung_stunden;
create table if not exists kc_club_nutzung_stunden (
  tag date not null,
  stunde smallint not null check (stunde between 0 and 23),
  anzahl integer not null default 0 check (anzahl >= 0),
  primary key (tag, stunde)
);
alter table kc_club_nutzung_stunden enable row level security;
create or replace function kc_club_nutzung_stunden_zaehlen(p_tag date, p_stunden integer[], p_anzahlen integer[])
returns void language sql security definer set search_path = public as $$
  insert into kc_club_nutzung_stunden (tag, stunde, anzahl)
  select p_tag, s::smallint, greatest(0, least(a, 200)) from unnest(p_stunden, p_anzahlen) as t(s, a) where s between 0 and 23
  on conflict (tag, stunde) do update set anzahl = kc_club_nutzung_stunden.anzahl + excluded.anzahl;
$$;
revoke all on function kc_club_nutzung_stunden_zaehlen(date, integer[], integer[]) from public, anon, authenticated;
