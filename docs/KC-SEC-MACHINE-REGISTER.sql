-- KC-SEC-MACHINE-REGISTER: per-Absender-Budget für neue Geräte.
-- Nur Metadaten, kein Klartext-IP, kein Token. RPC ausschließlich service_role.
create schema if not exists kc_machine_private;
revoke all on schema kc_machine_private from public,anon,authenticated;
grant usage on schema kc_machine_private to service_role;
create table if not exists kc_machine_private.registration_budget (
 scope_key text not null,
 sender_hash text not null check(sender_hash ~ '^[a-f0-9]{64}$'),
 window_start timestamptz not null,
 attempts integer not null check(attempts>0),
 primary key(scope_key,sender_hash,window_start)
);
alter table kc_machine_private.registration_budget enable row level security;
revoke all on kc_machine_private.registration_budget from public,anon,authenticated;
grant select,insert,update on kc_machine_private.registration_budget to service_role;
create or replace function public.kc_machine_registration_slot(p_scope text,p_sender_hash text,p_limit integer default 5)
returns jsonb language plpgsql security definer set search_path=pg_catalog,kc_machine_private as $body$
declare v_window timestamptz:=date_trunc('day',now(),'UTC');v_count integer;
begin
 if p_scope is null or p_scope !~ '^[A-Za-z0-9_-]{1,80}$' or p_sender_hash !~ '^[a-f0-9]{64}$' or p_sender_hash is null or p_limit is null or p_limit not between 1 and 20 then raise exception 'invalid registration budget'; end if;
 insert into kc_machine_private.registration_budget(scope_key,sender_hash,window_start,attempts)
 values(p_scope,p_sender_hash,v_window,1)
 on conflict(scope_key,sender_hash,window_start) do update
 set attempts=registration_budget.attempts+1
 where registration_budget.attempts<p_limit
 returning attempts into v_count;
 return jsonb_build_object('ok',v_count is not null,'remaining',greatest(0,p_limit-coalesce(v_count,p_limit)),'reset_at',v_window+interval '1 day');
end;
$body$;
revoke all on function public.kc_machine_registration_slot(text,text,integer) from public,anon,authenticated;
grant execute on function public.kc_machine_registration_slot(text,text,integer) to service_role;

