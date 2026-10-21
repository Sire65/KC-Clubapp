-- 2.551.0 KC-CLUB-GEPLANT-VORAB (Wunsch Hansi): Empfänger darf eine einmalige geplante Nachricht schon vor der Zeit abrufen.
-- Rückweg: alter table public.kc_club_geplant drop column if exists vorab;
alter table public.kc_club_geplant add column if not exists vorab boolean not null default false;
comment on column public.kc_club_geplant.vorab is 'KC-CLUB-GEPLANT-VORAB: Empfänger dürfen die Nachricht vorher abrufen (nur einmalige).';
