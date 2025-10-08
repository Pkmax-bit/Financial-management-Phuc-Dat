-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name character varying(100) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expense_categories_pkey PRIMARY KEY (id),
  CONSTRAINT expense_categories_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- Create index for active categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_active 
ON public.expense_categories USING btree (is_active) 
TABLESPACE pg_default;

-- Create index for name search
CREATE INDEX IF NOT EXISTS idx_expense_categories_name 
ON public.expense_categories USING btree (name) 
TABLESPACE pg_default;

-- Insert some default expense categories
INSERT INTO public.expense_categories (name, description, is_active) VALUES
('Đi lại', 'Chi phí đi lại, xăng xe, taxi, vé máy bay, tàu hỏa', true),
('Ăn uống', 'Chi phí ăn uống, tiệc tùng, khách hàng', true),
('Lưu trú', 'Chi phí khách sạn, nhà nghỉ khi công tác', true),
('Văn phòng phẩm', 'Giấy, bút, dụng cụ văn phòng', true),
('Thiết bị', 'Mua sắm thiết bị, máy móc, công cụ', true),
('Marketing', 'Chi phí quảng cáo, marketing, PR', true),
('Điện thoại', 'Chi phí điện thoại, internet, viễn thông', true),
('Bảo hiểm', 'Chi phí bảo hiểm, an toàn lao động', true),
('Đào tạo', 'Chi phí đào tạo, học tập, phát triển kỹ năng', true),
('Khác', 'Các chi phí khác không thuộc danh mục trên', true)
ON CONFLICT (name) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.expense_categories IS 'Bảng quản lý các loại chi phí';
COMMENT ON COLUMN public.expense_categories.name IS 'Tên loại chi phí';
COMMENT ON COLUMN public.expense_categories.description IS 'Mô tả chi tiết về loại chi phí';
COMMENT ON COLUMN public.expense_categories.is_active IS 'Trạng thái hoạt động của loại chi phí';
