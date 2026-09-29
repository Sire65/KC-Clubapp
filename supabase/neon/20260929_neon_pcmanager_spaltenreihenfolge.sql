-- Neon „KC Core Mirror“: zwei PC-Manager-Spiegeltabellen in Supabase-Spaltenreihenfolge neu aufgebaut – 29.09.2026
-- Freigabe Hansi („Ja, beides machen“). Grund: Restore-Lesetest des Backups scheiterte an der Spaltenreihenfolge.
-- Ablauf: alt umbenannt (Rückfallpunkt) → neu angelegt → Daten aus alt nach Namen übernommen →
-- Prüfsummen (legacy + stable) identisch mit Supabase → alt gelöscht. Backup 083b456f…: 188/188 Restore-Lesetest ok.
alter table public.kc_manager_serving_materials rename to kc_manager_serving_materials_alt;
alter table public.kc_manager_serving_materials_alt rename constraint kc_manager_serving_materials_pkey to kc_manager_serving_materials_alt_pkey;
alter table public.kc_manager_recipe_serving_materials rename to kc_manager_recipe_serving_materials_alt;
alter table public.kc_manager_recipe_serving_materials_alt rename constraint kc_manager_recipe_serving_materials_pkey to kc_manager_recipe_serving_materials_alt_pkey;
create table public.kc_manager_serving_materials (material_id text, org_id text, name text, material_type text, usage_type text, kind text, material text, capacity_ml integer, pack_size numeric, pack_unit text, pack_price_net numeric(12,4), pack_price_gross numeric(12,4), unit_cost_gross numeric(12,6), currency text, tax_included boolean, color text, disposable boolean, reusable boolean, deposit_gross numeric(12,4), lid_included boolean, image_path text, source_note text, active boolean, updated_at timestamp with time zone, created_at timestamp with time zone, primary key (material_id));
create table public.kc_manager_recipe_serving_materials (org_id text, product_code text, material_id text, qty_per_portion numeric(12,4), role text, active boolean, updated_at timestamp with time zone, created_at timestamp with time zone, primary key (org_id, product_code, material_id));
insert into public.kc_manager_serving_materials (material_id, org_id, name, material_type, usage_type, kind, material, capacity_ml, pack_size, pack_unit, pack_price_net, pack_price_gross, unit_cost_gross, currency, tax_included, color, disposable, reusable, deposit_gross, lid_included, image_path, source_note, active, updated_at, created_at)
  select material_id, org_id, name, material_type, usage_type, kind, material, capacity_ml, pack_size, pack_unit, pack_price_net, pack_price_gross, unit_cost_gross, currency, tax_included, color, disposable, reusable, deposit_gross, lid_included, image_path, source_note, active, updated_at, created_at from public.kc_manager_serving_materials_alt;
insert into public.kc_manager_recipe_serving_materials (org_id, product_code, material_id, qty_per_portion, role, active, updated_at, created_at)
  select org_id, product_code, material_id, qty_per_portion, role, active, updated_at, created_at from public.kc_manager_recipe_serving_materials_alt;
drop table public.kc_manager_serving_materials_alt;
drop table public.kc_manager_recipe_serving_materials_alt;
