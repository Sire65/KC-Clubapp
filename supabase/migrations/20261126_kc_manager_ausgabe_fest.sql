-- KC-AUSGABE-FEST (26.11.2026, Wunsch Hansi): „Die Ausgabegefäße müssen nun fest bestimmt werden. Alle Getränke in Glas,
-- Feuerzangenbowle zzgl. Feuerzange. Speisen in Einwegschale, oder außer Haus Thermobecher. Bei allen Speisen eine Serviette
-- in die Kalkulation. Diese Werte müssen in der Datenbank fest erhalten bleiben. Nicht mehr überschreiben.“
--
-- 1. Serviette als Verbrauchsmaterial (Preis je Stück noch offen → 0, bis Hansi ihn nennt).
-- 2. Zuordnungen fest:
--    Getränke (apfel, eier, grot, gweiss, roterfeger): Glas 0,2 l
--    Feuerzangenbowle (feuer): Glas 0,2 l + Feuerzange
--    Speisen (gruenkohl, gruenkohlmett, hering, knirpsecreme, mettwurst, sauerkraut, sauerkrautmett):
--      Einwegschale 500 ml + Serviette (je 1 je Portion); Thermobecher 750 ml als „Außer Haus (statt Einwegschale)“ mit 0 je Portion
--      (Kalkulation rechnet die Einwegschale; der Thermobecher ist die Alternative).
--    Mettendchen hatte zusätzlich das Glas – entfernt.
--    Schuss Rum/Amaretto: kein eigenes Gefäß (kommt ins Getränk).
-- 3. Schreibschutz: Tabelle kc_manager_ausgabe_fest + Auslöser. Feste Zuordnungen und Materialien werden beim Abgleich aus dem
--    PC-Manager still übersprungen (kein Fehler, keine Schleife); der PC-Manager holt danach den festen Stand zurück.
--    Ändern nur bewusst per Migration mit  set local kc.ausgabe_fest_aendern = 'ja';

-- 1. Serviette
insert into public.kc_manager_serving_materials (material_id, org_id, name, material_type, usage_type, kind, material, capacity_ml,
  pack_size, pack_unit, pack_price_net, pack_price_gross, unit_cost_gross, currency, tax_included, color, disposable, reusable,
  deposit_gross, lid_included, image_path, source_note, active, updated_at, created_at)
values ('CONSUMABLE-SERVIETTE-WM', 'KC_WERNE', 'Papierserviette', 'Verbrauchsmaterial', 'Beigabe', 'Serviette', 'Papier', null,
  null, 'Stück', null, null, 0, 'EUR', true, 'weiß', true, false,
  0, false, null, 'Handelshof Papierservietten (WM-HH-PAPIERSERVIETTEN); Packungsgröße/Preis noch offen – bis dahin 0 € je Stück.', true, now(), now())
on conflict (material_id) do update set active = true, usage_type = excluded.usage_type, kind = excluded.kind, updated_at = now();

-- 2. Zuordnungen
delete from public.kc_manager_recipe_serving_materials
 where org_id = 'KC_WERNE' and product_code = 'mettwurst' and material_id = 'SERVING-GLASS-020-WM';

insert into public.kc_manager_recipe_serving_materials (org_id, product_code, material_id, qty_per_portion, role, active, updated_at, created_at)
select 'KC_WERNE', z.product_code, z.material_id, z.qty, z.rolle, true, now(), now()
from (values
  ('apfel','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('eier','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('grot','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('gweiss','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('roterfeger','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('feuer','SERVING-GLASS-020-WM',1,'Ausgabegefäß'),
  ('feuer','SERVING-FEUERZANGE-WM',1,'Zubehör'),
  ('gruenkohl','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('gruenkohlmett','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('hering','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('knirpsecreme','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('mettwurst','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('sauerkraut','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('sauerkrautmett','CONSUMABLE-BOWL-BAGASSE-500-WM',1,'Ausgabegefäß'),
  ('gruenkohl','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('gruenkohlmett','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('hering','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('knirpsecreme','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('mettwurst','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('sauerkraut','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('sauerkrautmett','CONSUMABLE-SERVIETTE-WM',1,'Beigabe'),
  ('gruenkohl','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('gruenkohlmett','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('hering','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('knirpsecreme','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('mettwurst','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('sauerkraut','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)'),
  ('sauerkrautmett','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM',0,'Außer Haus (statt Einwegschale)')
) as z(product_code, material_id, qty, rolle)
on conflict (org_id, product_code, material_id) do update
  set qty_per_portion = excluded.qty_per_portion, role = excluded.role, active = true, updated_at = now();

-- Nichts anderes an den festen Artikeln
delete from public.kc_manager_recipe_serving_materials m
 where m.org_id = 'KC_WERNE'
   and m.product_code in ('apfel','eier','grot','gweiss','roterfeger','feuer','gruenkohl','gruenkohlmett','hering','knirpsecreme','mettwurst','sauerkraut','sauerkrautmett')
   and not (
     (m.product_code in ('apfel','eier','grot','gweiss','roterfeger') and m.material_id = 'SERVING-GLASS-020-WM')
     or (m.product_code = 'feuer' and m.material_id in ('SERVING-GLASS-020-WM','SERVING-FEUERZANGE-WM'))
     or (m.product_code in ('gruenkohl','gruenkohlmett','hering','knirpsecreme','mettwurst','sauerkraut','sauerkrautmett')
         and m.material_id in ('CONSUMABLE-BOWL-BAGASSE-500-WM','CONSUMABLE-SERVIETTE-WM','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM'))
   );

-- Die vorhandenen Rezeptzeilen „Serviette“ (Preis offen) gehören jetzt zur festen Serviette – der PC-Manager ersetzt sie beim
-- Speichern eines Rezepts durch die Zeile aus der Zuordnung (kein doppelter Ansatz).
update public.kc_manager_recipe_ingredients i
   set ingredient_code = 'CONSUMABLE-SERVIETTE-WM',
       preparation = '[AUSGABEGESCHIRR] Beigabe; Serviette',
       unit_cost = 0,
       notes = 'Feste Beigabe je Portion (KC-AUSGABE-FEST 26.11.2026); Preis je Stück noch offen.',
       updated_at = now()
  from public.kc_manager_recipes r
 where r.recipe_id = i.recipe_id and r.org_id = 'KC_WERNE'
   and lower(trim(i.name)) in ('serviette','servietten') and i.ingredient_code is null;

-- 3. Schreibschutz
create table if not exists public.kc_manager_ausgabe_fest (
  org_id text not null,
  objekt text not null check (objekt in ('zuordnung','material')),
  schluessel text not null,
  grund text,
  festgelegt_am timestamptz not null default now(),
  primary key (org_id, objekt, schluessel)
);
alter table public.kc_manager_ausgabe_fest enable row level security;
revoke all on public.kc_manager_ausgabe_fest from public, anon, authenticated;
grant select, insert, update, delete on public.kc_manager_ausgabe_fest to service_role;

insert into public.kc_manager_ausgabe_fest (org_id, objekt, schluessel, grund)
select 'KC_WERNE', 'zuordnung', p, 'Hansi 26.11.2026: Ausgabegefäße fest, nicht mehr überschreiben'
from unnest(array['apfel','eier','grot','gweiss','roterfeger','feuer','gruenkohl','gruenkohlmett','hering','knirpsecreme','mettwurst','sauerkraut','sauerkrautmett']) as p
on conflict do nothing;
insert into public.kc_manager_ausgabe_fest (org_id, objekt, schluessel, grund)
select 'KC_WERNE', 'material', m, 'Hansi 26.11.2026: Ausgabegefäße fest, nicht mehr überschreiben'
from unnest(array['SERVING-GLASS-020-WM','SERVING-FEUERZANGE-WM','CONSUMABLE-BOWL-BAGASSE-500-WM','CONSUMABLE-SOUP-CUP-PAPER-PE-750-WM','CONSUMABLE-SERVIETTE-WM']) as m
on conflict do nothing;

create or replace function public.kc_manager_ausgabe_fest_schutz()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zeile jsonb;
  v_objekt text := case when tg_table_name = 'kc_manager_serving_materials' then 'material' else 'zuordnung' end;
  v_schluessel text;
begin
  if coalesce(current_setting('kc.ausgabe_fest_aendern', true), '') = 'ja' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  v_zeile := case when tg_op = 'INSERT' then to_jsonb(new) else to_jsonb(old) end;
  v_schluessel := case when v_objekt = 'material' then v_zeile->>'material_id' else v_zeile->>'product_code' end;
  if exists (
    select 1 from public.kc_manager_ausgabe_fest f
     where f.objekt = v_objekt and f.schluessel = v_schluessel
       and (v_objekt = 'material' or f.org_id = coalesce(v_zeile->>'org_id', 'KC_WERNE'))
  ) then
    return null; -- fest: still überspringen
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
revoke all on function public.kc_manager_ausgabe_fest_schutz() from public, anon, authenticated;

drop trigger if exists kc_manager_ausgabe_fest_zuordnung on public.kc_manager_recipe_serving_materials;
create trigger kc_manager_ausgabe_fest_zuordnung
  before insert or update or delete on public.kc_manager_recipe_serving_materials
  for each row execute function public.kc_manager_ausgabe_fest_schutz();

drop trigger if exists kc_manager_ausgabe_fest_material on public.kc_manager_serving_materials;
create trigger kc_manager_ausgabe_fest_material
  before insert or update or delete on public.kc_manager_serving_materials
  for each row execute function public.kc_manager_ausgabe_fest_schutz();
