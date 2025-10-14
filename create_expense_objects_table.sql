-- Tạo bảng expense_objects để lưu đối tượng chi phí
CREATE TABLE IF NOT EXISTS expense_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Tạo index cho tìm kiếm
CREATE INDEX IF NOT EXISTS idx_expense_objects_name ON expense_objects(name);
CREATE INDEX IF NOT EXISTS idx_expense_objects_active ON expense_objects(is_active);

-- Thêm RLS (Row Level Security)
ALTER TABLE expense_objects ENABLE ROW LEVEL SECURITY;

-- Policy cho phép tất cả authenticated users đọc
CREATE POLICY "Allow authenticated users to read expense_objects" ON expense_objects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy cho phép tất cả authenticated users tạo
CREATE POLICY "Allow authenticated users to insert expense_objects" ON expense_objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy cho phép tất cả authenticated users cập nhật
CREATE POLICY "Allow authenticated users to update expense_objects" ON expense_objects
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy cho phép tất cả authenticated users xóa
CREATE POLICY "Allow authenticated users to delete expense_objects" ON expense_objects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Thêm trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_expense_objects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_objects_updated_at
    BEFORE UPDATE ON expense_objects
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_objects_updated_at();

-- Thêm một số dữ liệu mẫu
INSERT INTO expense_objects (name, description) VALUES
('Vật liệu xây dựng', 'Các loại vật liệu sử dụng trong xây dựng như xi măng, gạch, sắt thép'),
('Nhân công', 'Chi phí nhân công thi công, lắp đặt'),
('Máy móc thiết bị', 'Chi phí thuê máy móc, thiết bị thi công'),
('Vận chuyển', 'Chi phí vận chuyển vật liệu, thiết bị'),
('Quản lý dự án', 'Chi phí quản lý, giám sát dự án'),
('Thiết kế', 'Chi phí thiết kế, tư vấn kỹ thuật'),
('Giấy phép', 'Chi phí xin giấy phép, thủ tục pháp lý'),
('Bảo hiểm', 'Chi phí bảo hiểm công trình'),
('Khác', 'Các chi phí khác không thuộc danh mục trên')
ON CONFLICT DO NOTHING;
