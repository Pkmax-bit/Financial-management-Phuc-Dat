-- ============================================
-- SCHEMA DATABASE CHO CÁC BẢNG TRẠNG THÁI
-- Theo yêu cầu FIGMA_PROMPT_KANBAN.md
-- ============================================

-- 1. BẢNG TRẠNG THÁI KHÁCH HÀNG
CREATE TABLE IF NOT EXISTS customer_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- HEX color code
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- Không cho phép xóa nếu là system status
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes
CREATE INDEX idx_customer_statuses_code ON customer_statuses(code);
CREATE INDEX idx_customer_statuses_order ON customer_statuses(display_order);

-- 2. BẢNG TRẠNG THÁI DỰ ÁN
CREATE TABLE IF NOT EXISTS project_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_project_statuses_code ON project_statuses(code);
CREATE INDEX idx_project_statuses_order ON project_statuses(display_order);

-- 3. BẢNG TRẠNG THÁI BÁO GIÁ
CREATE TABLE IF NOT EXISTS quote_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_quote_statuses_code ON quote_statuses(code);
CREATE INDEX idx_quote_statuses_order ON quote_statuses(display_order);

-- 4. BẢNG TRẠNG THÁI HÓA ĐƠN
CREATE TABLE IF NOT EXISTS invoice_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_invoice_statuses_code ON invoice_statuses(code);
CREATE INDEX idx_invoice_statuses_order ON invoice_statuses(display_order);

-- ============================================
-- SEED DATA - Dữ liệu mặc định theo FIGMA spec
-- ============================================

-- Customer Statuses (Khách hàng)
INSERT INTO customer_statuses (code, name, color, display_order, is_default, is_system) VALUES
    ('prospect', 'Tiềm năng', '#2FC6F6', 1, FALSE, TRUE),
    ('active', 'Hoạt động', '#9ECF00', 2, TRUE, TRUE),
    ('inactive', 'Ngừng hoạt động', '#9CA3AF', 3, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Project Statuses (Dự án)
INSERT INTO project_statuses (code, name, color, display_order, is_default, is_system) VALUES
    ('planning', 'Lập kế hoạch', '#9CA3AF', 1, FALSE, TRUE),
    ('active', 'Đang hoạt động', '#9ECF00', 2, TRUE, TRUE),
    ('on_hold', 'Tạm dừng', '#FFA900', 3, FALSE, TRUE),
    ('completed', 'Hoàn thành', '#2066B0', 4, FALSE, TRUE),
    ('cancelled', 'Đã hủy', '#FF5752', 5, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Quote Statuses (Báo giá)
INSERT INTO quote_statuses (code, name, color, display_order, is_default, is_system) VALUES
    ('draft', 'Nháp', '#9CA3AF', 1, TRUE, TRUE),
    ('sent', 'Đã gửi', '#2FC6F6', 2, FALSE, TRUE),
    ('viewed', 'Đã xem', '#A855F7', 3, FALSE, TRUE),
    ('accepted', 'Đã chấp nhận', '#9ECF00', 4, FALSE, TRUE),
    ('declined', 'Từ chối', '#FF5752', 5, FALSE, TRUE),
    ('expired', 'Hết hạn', '#FFA900', 6, FALSE, TRUE),
    ('closed', 'Đã đóng', '#6B7280', 7, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Invoice Statuses (Hóa đơn)
INSERT INTO invoice_statuses (code, name, color, display_order, is_default, is_system) VALUES
    ('draft', 'Nháp', '#9CA3AF', 1, TRUE, TRUE),
    ('sent', 'Đã gửi', '#2FC6F6', 2, FALSE, TRUE),
    ('pending', 'Chờ thanh toán', '#FFA900', 3, FALSE, TRUE),
    ('paid', 'Đã thanh toán', '#9ECF00', 4, FALSE, TRUE),
    ('overdue', 'Quá hạn', '#FF5752', 5, FALSE, TRUE),
    ('cancelled', 'Đã hủy', '#6B7280', 6, FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- TRIGGERS - Tự động cập nhật updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_statuses_updated_at BEFORE UPDATE ON customer_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_statuses_updated_at BEFORE UPDATE ON project_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_statuses_updated_at BEFORE UPDATE ON quote_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_statuses_updated_at BEFORE UPDATE ON invoice_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTES:
-- 1. Các bảng customers, projects, quotes, invoices chỉ cần có cột status_id (FK) 
--    trỏ tới bảng tương ứng, không cần thay đổi schema khác
-- 2. Ví dụ: ALTER TABLE customers ADD COLUMN status_id UUID REFERENCES customer_statuses(id);
-- 3. Các bảng khác giữ nguyên như yêu cầu
-- ============================================

