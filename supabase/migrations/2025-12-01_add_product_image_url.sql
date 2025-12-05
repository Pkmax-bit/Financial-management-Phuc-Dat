-- Thêm cột lưu URL hình ảnh sản phẩm
alter table if exists public.products
  add column if not exists image_url text;










