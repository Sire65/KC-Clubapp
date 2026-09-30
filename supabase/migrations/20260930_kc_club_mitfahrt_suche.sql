-- KC-CLUB-MITFAHRT-SUCHE (0.87.0, Wunsch Hansi): „Ich suche eine Mitfahrgelegenheit“ je Termin/Aktion.
-- Wie kc_club_mitfahrt: RLS an, keine Richtlinien → nur der Club-Server (Dienstrolle) liest/schreibt.
create table if not exists public.kc_club_mitfahrt_suche (
  bezug_art text not null check (bezug_art in ('treffen','aktion')),
  bezug_id text not null,
  person_id text not null references public.kc_core_people(person_id),
  notiz text check (notiz is null or char_length(notiz) <= 200),
  erstellt_am timestamptz not null default now(),
  primary key (bezug_art, bezug_id, person_id)
);
alter table public.kc_club_mitfahrt_suche enable row level security;
revoke all on public.kc_club_mitfahrt_suche from anon, authenticated;

-- Spiegel-/Sicherungsregel (Abdeckungsprüfung): Neon-Tabelle gibt es noch nicht → vorerst nicht spiegeln.
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_mitfahrt_suche', 'Club-App', 'sensitive', false, false, false,
        'KC-CLUB-MITFAHRT-SUCHE (30.09.2026): Neon-Tabelle fehlt noch – nach dem 01.10. zusammen mit den neuen kc_club_anruf-Spalten anlegen (Freigabe Hansi), dann spiegeln/sichern einschalten')
on conflict (table_name) do nothing;
