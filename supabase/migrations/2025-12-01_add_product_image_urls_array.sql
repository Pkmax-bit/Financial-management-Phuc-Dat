-- Thêm cột lưu danh sách URL hình ảnh sản phẩm (nhiều hình cho 1 sản phẩm)
alter table if exists public.products
  add column if not exists image_urls jsonb default '[]'::jsonb;





