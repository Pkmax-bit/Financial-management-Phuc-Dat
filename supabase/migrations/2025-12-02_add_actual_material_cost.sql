-- Thêm cột chi phí vật tư thực tế vào bảng products
alter table if exists public.products
  add column if not exists actual_material_cost numeric(18,2) default 0,
  add column if not exists actual_material_components jsonb default '[]'::jsonb;

comment on column public.products.actual_material_cost is 'Tổng chi phí vật tư thực tế của sản phẩm';
comment on column public.products.actual_material_components is 'Danh sách chi tiết vật tư thực tế (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":""}';

-- Index cho actual_material_components
create index if not exists idx_products_actual_material_components_gin
  on public.products using gin (actual_material_components);

