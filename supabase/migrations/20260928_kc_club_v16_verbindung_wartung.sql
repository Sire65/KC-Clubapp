-- KC Club-App – Version 0.16.0
-- KC-CLUB-VERBINDUNG: Verbindungs-LEDs im Kopf (Status/Datenverkehr) + Verbindungstest.
-- Wartungsmodus über die zentrale Programm-Registry (kc_core_app_registry) statt eines eigenen Schalters:
--   neue, optionale Spalten (für alle Programme nutzbar); die Club-App wird als KC_CLUBAPP eingetragen.
alter table kc_core_app_registry add column if not exists wartung boolean not null default false;
alter table kc_core_app_registry add column if not exists wartung_hinweis text;
alter table kc_core_app_registry add column if not exists wartung_seit timestamptz;

insert into kc_core_app_registry (app_id, name, category, active, shared_auth, description, db_prefix, uses_shared_people, storage_strategy)
values ('KC_CLUBAPP', 'Köcheclub-App (Mitglieder)', 'communication', true, false, 'PWA für Clubmitglieder: Termine, Nachrichten, Protokolle, Aktionen, Fotoalbum', 'kc_club_', true, 'storage_when_needed')
on conflict (app_id) do nothing;
