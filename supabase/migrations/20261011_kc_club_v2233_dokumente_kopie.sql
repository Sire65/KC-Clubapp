-- Club-App 2.233.0 – KC-CLUB-ARCHIV-KOPIE Stufe 2 (Wunsch Hansi 11.10.2026): auch die PDF-Handbücher (Club-App „dokumente/“)
-- und die Schulungsunterlagen der Kasse (alle PDFs im Kasse-Paket) kommen nachts in den Neon-Dateispeicher Frankfurt.
-- Verzeichnis je Datei (Quelle = „Besitzer/Paket:Pfad“, git_sha = Prüfsumme aus GitHub). Aus GitHub entfernte Dateien bleiben in der Kopie.
-- Nur über die Edge Function (service_role) – RLS an, keine Policies.
create table if not exists public.kc_club_dokument_kopie (
  quelle text primary key,
  git_sha text not null,
  schluessel text not null,
  groesse bigint,
  kopiert_am timestamptz not null default now()
);
alter table public.kc_club_dokument_kopie enable row level security;
revoke all on public.kc_club_dokument_kopie from anon, authenticated;

insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
values ('kc_club_dokument_kopie', 'Club-App', 'normal', false, false, false, 'KC-CLUB-ARCHIV-KOPIE: Verzeichnis der Handbuch-/Schulungs-PDFs in Neon Frankfurt, nicht spiegeln', now())
on conflict (table_name) do nothing;
