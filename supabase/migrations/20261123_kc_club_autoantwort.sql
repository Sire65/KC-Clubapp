-- KC-CLUB-AUTOANTWORT (Wunschliste #101, Wunsch Hansi 23.11.2026 „alle, Schalter + Zeitraum + Kombination, 1× in 12 Std., nur Einzelchats,
-- freier Text mit Vorlage“). Die Einstellung selbst steht in kc_club_person_einstellung (schluessel 'autoantwort') – dafür keine neue Tabelle.
--
--   kc_club_autoantwort          = Kennzeichen „🤖 Autoantwort“ je Nachricht (die App zeigt es an der Sprechblase). Ohne Fremdschlüssel: der Club-Server
--                                  legt das Kennzeichen VOR der Nachricht an (gleiche Kennung) – so ist es beim ersten Laden schon da. Gelöschte Nachrichten
--                                  lassen nur eine kleine Zeile ohne Inhalt zurück.
--   kc_club_autoantwort_gesendet = Sperre „höchstens 1× in 12 Std. je (Empfänger → Absender, Chat)“: eine Zeile je Paar und Chat, „am“ = letzte Autoantwort.
--                                  Der Club-Server trägt sie atomar ein (insert … on conflict do nothing bzw. update … where am < now() - 12 h).
-- Beide nur für den Club-Server (service_role), RLS an, keine Inhalte (kein Nachrichtentext).
-- Rückweg: drop table if exists public.kc_club_autoantwort_gesendet; drop table if exists public.kc_club_autoantwort;
--          delete from public.kc_club_person_einstellung where schluessel = 'autoantwort';
create table if not exists public.kc_club_autoantwort (
  message_id uuid primary key,
  thread_id uuid not null,
  person_id text not null,      -- wer automatisch geantwortet hat (Empfänger der auslösenden Nachricht)
  an_person_id text not null,   -- an wen (Absender der auslösenden Nachricht)
  am timestamptz not null default now()
);
create index if not exists kc_club_autoantwort_thread on public.kc_club_autoantwort (thread_id);
alter table public.kc_club_autoantwort enable row level security;
revoke all on public.kc_club_autoantwort from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_autoantwort to service_role;

create table if not exists public.kc_club_autoantwort_gesendet (
  person_id text not null,
  an_person_id text not null,
  thread_id uuid not null,
  am timestamptz not null default now(),
  primary key (person_id, an_person_id, thread_id)
);
alter table public.kc_club_autoantwort_gesendet enable row level security;
revoke all on public.kc_club_autoantwort_gesendet from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_autoantwort_gesendet to service_role;
