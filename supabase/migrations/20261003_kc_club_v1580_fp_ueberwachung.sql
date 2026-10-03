-- KC Club-App – Version 1.58.0 (Wunsch Hansi 03.10.2026)
-- KC-CLUB-FP-UEBERWACHUNG  Schwerwiegende Einträge im Fehlerprotokoll → Push an den Admin (Zeitplaner „Wartung“, alle 15 Min.).
--   Neue Communicator-Regel club_fehler: nur Push (keine Mail). Ruhezeit regelt der Club-Server (Meldung kommt danach).
-- Rückweg: delete from kc_communication_event_rules where source_program = 'kc-club' and event_key = 'club_fehler';
insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select 'kc-club', 'club_fehler', 'Club-App – schwerwiegendes Problem im Fehlerprotokoll (nur Push, Admin)', array['push'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb
where not exists (select 1 from kc_communication_event_rules r where r.source_program = 'kc-club' and r.event_key = 'club_fehler');
