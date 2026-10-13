-- KC-DATA-API-FREIGABEN-2 (13.10.2026, Gesamtprüfung, Freigabe Hansi „1 und 2 ja“): Bisher bekam jede NEUE Tabelle/Sequenz in public
-- automatisch Lese- und Schreibrecht für anon und authenticated (Standard von Supabase, in 20261012 festgeschrieben). Vergisst eine
-- künftige Migration die Zeilensicherheit (RLS), wäre die Tabelle über die Data API offen. Jetzt: nur service_role (Server-Funktionen)
-- bekommt die Standard-Freigabe; anon/authenticated nur noch ausdrücklich in derselben Migration, z. B. für DP2:
--   grant select, insert, update, delete on public.kc_dp_beispiel to authenticated;   (+ RLS-Policies)
-- Bestehende Tabellen und Sichten sind unverändert (geprüft 13.10.: keine offene Tabelle; die 4 Sichten mit anon-Recht sind security_invoker).
-- Bereits eingespielt am 13.10.2026; Recovery-Punkt (alter Stand) im Abschnitt Rückweg.
alter default privileges for role postgres in schema public revoke select, insert, update, delete, truncate, references, trigger, maintain on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke usage, select, update on sequences from anon, authenticated;
-- Rückweg (alter Stand):
--   alter default privileges for role postgres in schema public grant select, insert, update, delete, truncate, references, trigger, maintain on tables to anon, authenticated;
--   alter default privileges for role postgres in schema public grant usage, select, update on sequences to anon, authenticated;
