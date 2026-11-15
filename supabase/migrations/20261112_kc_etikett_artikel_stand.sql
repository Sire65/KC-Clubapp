-- KC-CLUB-PREISETIKETTEN (12.11.2026, Wunsch Hansi „Preisetiketten in die Club-App – Formate 8x8/7x7/6x6/5x5, mit/ohne Foto, Allergene,
-- Preis …, nach Warengruppen, Anzahl und Vorschau“, „die Club-App muss auch die aktuellen Preise übernehmen“; Wahl: PC-Manager veröffentlicht
-- und im Dialog von Hand änderbar). Die aktuellen Preise pflegt allein der PC-Manager (lokal am Stand). Er veröffentlicht beim Stammdaten-Abgleich
-- und per Knopf den Artikelstand (Preis, Pfand, Warengruppe, Allergene, Zusatzstoffe, Alkohol, Foto-Pfad) – je Verein EINE Zeile, die jedes Mal
-- ersetzt wird (ca. 20 Artikel, wenige KB). Die Club-App liest ihn über den Club-Server (nur Clubleitung).
-- Schreiben nur über kc_etikett_artikel_veroeffentlichen (angemeldet im PC-Manager mit Manager-/Admin-Rechten), lesen nur service_role.
-- Rückweg: drop function public.kc_etikett_artikel_veroeffentlichen(text, jsonb); drop table public.kc_etikett_artikel_stand;
create table if not exists public.kc_etikett_artikel_stand (
  org_id text primary key,
  artikel jsonb not null check (jsonb_typeof(artikel) = 'array' and jsonb_array_length(artikel) <= 500),
  quelle text not null default 'KC_MANAGER',
  veroeffentlicht_am timestamptz not null default now(),
  veroeffentlicht_von uuid
);
alter table public.kc_etikett_artikel_stand enable row level security;
revoke all on public.kc_etikett_artikel_stand from public, anon, authenticated;
grant select, insert, update, delete on public.kc_etikett_artikel_stand to service_role;

create or replace function public.kc_etikett_artikel_veroeffentlichen(p_org_id text, p_artikel jsonb)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog', 'public' as $$
declare v_uid uuid := auth.uid(); v_n int;
begin
  if v_uid is null or not (kc_private.kc_core_is_admin(p_org_id) or kc_private.kc_core_has_app_access(p_org_id, 'KC_MANAGER', array['operator', 'manager', 'admin'])) then
    raise exception 'Keine Berechtigung für die Etiketten-Artikel' using errcode = '42501';
  end if;
  if p_artikel is null or jsonb_typeof(p_artikel) <> 'array' or jsonb_array_length(p_artikel) = 0 then
    return jsonb_build_object('ok', false, 'grund', 'keine_artikel');
  end if;
  if jsonb_array_length(p_artikel) > 500 or octet_length(p_artikel::text) > 300000 then
    return jsonb_build_object('ok', false, 'grund', 'zu_gross');
  end if;
  v_n := jsonb_array_length(p_artikel);
  insert into public.kc_etikett_artikel_stand (org_id, artikel, quelle, veroeffentlicht_am, veroeffentlicht_von)
  values (p_org_id, p_artikel, 'KC_MANAGER', now(), v_uid)
  on conflict (org_id) do update set artikel = excluded.artikel, quelle = excluded.quelle, veroeffentlicht_am = excluded.veroeffentlicht_am, veroeffentlicht_von = excluded.veroeffentlicht_von;
  return jsonb_build_object('ok', true, 'anzahl', v_n, 'am', now());
end $$;
revoke all on function public.kc_etikett_artikel_veroeffentlichen(text, jsonb) from public, anon;
grant execute on function public.kc_etikett_artikel_veroeffentlichen(text, jsonb) to authenticated;

-- KC-SECURITY-DEFINER-REGISTER: der PC-Manager ruft die Funktion direkt auf (angemeldet) → Prüfregister
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', 'kc_etikett_artikel_veroeffentlichen', 'function', 'security_definer_authenticated_execute', 'accepted_required',
       'KC-CLUB-PREISETIKETTEN 12.11.2026: verlangt auth.uid() und Admin oder KC_MANAGER-Rolle operator/manager/admin der Organisation; schreibt nur die eine Zeile kc_etikett_artikel_stand dieser Organisation (Liste höchstens 500 Artikel/300 KB). Kein anon.',
       now(), now() + interval '6 months', true
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = 'kc_etikett_artikel_veroeffentlichen' and r.finding_code = 'security_definer_authenticated_execute' and r.active);
