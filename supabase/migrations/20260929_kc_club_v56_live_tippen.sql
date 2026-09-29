-- Club-App 0.56.0 – KC-CLUB-LIVETIPPEN: andere sehen live, was ich tippe (freiwillig, Einstellung live_tippen, Standard aus)
-- Der Entwurf liegt nur in der flüchtigen Tabelle kc_club_tippen (Spiegel-Regel „nicht spiegeln/sichern“), höchstens 300 Zeichen.
-- Senden/Feld leeren/Chat verlassen löscht ihn sofort; Aufräumen jetzt alle 5 Minuten statt stündlich und ohne Nachlauf,
-- damit nicht gesendete Entwürfe nicht liegen bleiben (nur Supabase, keine Neon-Rechenzeit).
alter table public.kc_club_tippen add column if not exists text text;
select cron.schedule('kc-club-tippen-aufraeumen', '*/5 * * * *', $$delete from public.kc_club_tippen where bis < now()$$);
update public.kc_db_mirror_table_rules set note = 'KC-CLUB-TIPPT/LIVETIPPEN: flüchtige „schreibt …“-Anzeige inkl. freiwilligem Entwurfstext (6 s), nie spiegeln/sichern', updated_at = now()
 where table_name = 'kc_club_tippen';
