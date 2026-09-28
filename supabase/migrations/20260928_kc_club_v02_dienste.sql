-- KC Club-App – Version 0.2.0
-- Feature KC-CLUB-DIENSTE: Dienstzeiten aus dem Dienstplan (DP2/DP3) anzeigen – eigene immer, andere nur mit Freigabe.
-- Quelle (nur lesen): kc_dp_plan_published – wird vom Dienstplan über kc_dp_plan_publish („Sollplan veröffentlichen“) befüllt.
-- Die verschlüsselten Sync-Daten (kc_dp_sync_operations) werden bewusst NICHT gelesen.
-- kc_dp_plan_sharing (Kann/Wunsch/Bereitschaft) gehört dem Dienstplan und bleibt unverändert;
-- die Sichtbarkeit in der Club-App ist eine eigene Einwilligung des Mitglieds (Standard: aus).

create table if not exists kc_club_freigaben (
  person_id text not null references kc_core_people(person_id),
  bereich text not null check (bereich in ('dienstzeiten')),
  erlaubt boolean not null default false,
  geaendert_am timestamptz not null default now(),
  primary key (person_id, bereich)
);
alter table kc_club_freigaben enable row level security;
