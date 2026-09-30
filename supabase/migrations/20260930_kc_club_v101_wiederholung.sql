-- KC Club-App – Version 1.1.0
-- KC-CLUB-WIEDERHOLUNG (Wunsch Hansi: „Wiederholen fehlt bei Terminen – täglich, wöchentlich, jährlich usw.“)
-- Private Termine: echte Wiederholung (eine Zeile, der Server rechnet die Termine im gefragten Zeitraum aus).
--   ausnahmen = einzelne gelöschte Tage der Reihe; erinnert_bis = bis zu welchem Termin schon erinnert wurde.
-- Club-Treffen: werden als Reihe einzelner Treffen angelegt (jedes mit eigenen Zu-/Absagen) – keine Änderung an kc_club_treffen.
-- Rückweg: alter table kc_club_privattermine drop column wiederholung, drop column wiederholung_bis, drop column ausnahmen, drop column erinnert_bis;
alter table kc_club_privattermine add column if not exists wiederholung text not null default 'keine'
  check (wiederholung in ('keine','taeglich','werktags','woechentlich','zweiwoechentlich','monatlich','monatlich_wochentag','jaehrlich'));
alter table kc_club_privattermine add column if not exists wiederholung_bis date;
alter table kc_club_privattermine add column if not exists ausnahmen date[] not null default '{}';
alter table kc_club_privattermine add column if not exists erinnert_bis timestamptz;
