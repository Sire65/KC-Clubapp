-- KC Club-App – Version 0.52.0
-- KC-CLUB-TODO-MEHRERE: mehrere Zuständige je To-do (zustaendige text[]). Das bisherige Feld „zustaendig“ bleibt erhalten
-- und enthält weiterhin den ersten Zuständigen (Kompatibilität, nichts wird entfernt). Bestehende Zuweisungen übernommen.
alter table kc_club_todo add column if not exists zustaendige text[] not null default '{}';
update kc_club_todo set zustaendige = array[zustaendig] where zustaendig is not null and cardinality(zustaendige) = 0;
create index if not exists kc_club_todo_zustaendige_idx on kc_club_todo using gin (zustaendige);
