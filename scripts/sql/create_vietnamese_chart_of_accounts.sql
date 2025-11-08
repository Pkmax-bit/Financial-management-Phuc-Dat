-- Vietnamese Chart of Accounts (Hệ thống tài khoản kế toán Việt Nam)
-- Based on Circular 200/2014/TT-BTC and Decision 15/2006/QD-BTC

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    account_type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    account_class VARCHAR(50) NOT NULL, -- 'current_asset', 'fixed_asset', 'current_liability', etc.
    parent_code VARCHAR(20),
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Vietnamese Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_name_en, account_type, account_class, level, description) VALUES

-- 1. TÀI SẢN (ASSETS)
-- 1.1. Tài sản lưu động (Current Assets)
('111', 'Tiền mặt', 'Cash on Hand', 'asset', 'current_asset', 1, 'Tiền mặt tại quỹ'),
('112', 'Tiền gửi ngân hàng', 'Bank Deposits', 'asset', 'current_asset', 1, 'Tiền gửi tại các ngân hàng'),
('113', 'Tiền đang chuyển', 'Cash in Transit', 'asset', 'current_asset', 1, 'Tiền đang trong quá trình chuyển'),

-- 1.2. Đầu tư tài chính ngắn hạn (Short-term Financial Investments)
('121', 'Đầu tư tài chính ngắn hạn', 'Short-term Financial Investments', 'asset', 'current_asset', 1, 'Đầu tư tài chính có thời hạn dưới 1 năm'),
('128', 'Đầu tư tài chính dài hạn', 'Long-term Financial Investments', 'asset', 'current_asset', 1, 'Đầu tư tài chính có thời hạn trên 1 năm'),

-- 1.3. Các khoản phải thu (Receivables)
('131', 'Phải thu khách hàng', 'Accounts Receivable', 'asset', 'current_asset', 1, 'Phải thu từ khách hàng'),
('133', 'Phải thu nội bộ', 'Internal Receivables', 'asset', 'current_asset', 1, 'Phải thu từ các đơn vị nội bộ'),
('136', 'Phải thu khác', 'Other Receivables', 'asset', 'current_asset', 1, 'Các khoản phải thu khác'),
('138', 'Dự phòng phải thu khó đòi', 'Allowance for Doubtful Accounts', 'asset', 'current_asset', 1, 'Dự phòng cho các khoản phải thu khó đòi'),

-- 1.4. Hàng tồn kho (Inventory)
('152', 'Hàng tồn kho', 'Inventory', 'asset', 'current_asset', 1, 'Hàng hóa, nguyên vật liệu tồn kho'),
('153', 'Công cụ, dụng cụ', 'Tools and Equipment', 'asset', 'current_asset', 1, 'Công cụ, dụng cụ trong kho'),
('154', 'Chi phí sản xuất, kinh doanh dở dang', 'Work in Progress', 'asset', 'current_asset', 1, 'Chi phí sản xuất chưa hoàn thành'),

-- 1.5. Tài sản cố định (Fixed Assets)
('211', 'Tài sản cố định hữu hình', 'Tangible Fixed Assets', 'asset', 'fixed_asset', 1, 'Tài sản cố định có hình thái vật chất'),
('213', 'Tài sản cố định vô hình', 'Intangible Fixed Assets', 'asset', 'fixed_asset', 1, 'Tài sản cố định không có hình thái vật chất'),
('217', 'Tài sản cố định thuê tài chính', 'Finance Lease Assets', 'asset', 'fixed_asset', 1, 'Tài sản cố định thuê tài chính'),

-- 2. NỢ PHẢI TRẢ (LIABILITIES)
-- 2.1. Nợ ngắn hạn (Current Liabilities)
('331', 'Phải trả nhà cung cấp', 'Accounts Payable', 'liability', 'current_liability', 1, 'Phải trả cho nhà cung cấp'),
('333', 'Thuế và các khoản phải nộp nhà nước', 'Taxes and Government Payables', 'liability', 'current_liability', 1, 'Thuế và các khoản phải nộp cho nhà nước'),
('334', 'Phải trả người lao động', 'Employee Payables', 'liability', 'current_liability', 1, 'Phải trả lương, thưởng cho người lao động'),
('338', 'Phải trả, phải nộp khác', 'Other Payables', 'liability', 'current_liability', 1, 'Các khoản phải trả, phải nộp khác'),

-- 2.2. Nợ dài hạn (Long-term Liabilities)
('341', 'Vay dài hạn', 'Long-term Debt', 'liability', 'long_term_liability', 1, 'Vay dài hạn từ ngân hàng và tổ chức tín dụng'),
('342', 'Nợ dài hạn khác', 'Other Long-term Debt', 'liability', 'long_term_liability', 1, 'Các khoản nợ dài hạn khác'),

-- 3. VỐN CHỦ SỞ HỮU (EQUITY)
('411', 'Vốn đầu tư của chủ sở hữu', 'Owner Investment Capital', 'equity', 'equity', 1, 'Vốn đầu tư ban đầu của chủ sở hữu'),
('412', 'Thặng dư vốn cổ phần', 'Share Premium', 'equity', 'equity', 1, 'Thặng dư từ phát hành cổ phiếu'),
('413', 'Vốn khác của chủ sở hữu', 'Other Owner Capital', 'equity', 'equity', 1, 'Các loại vốn khác của chủ sở hữu'),
('421', 'Lợi nhuận chưa phân phối', 'Retained Earnings', 'equity', 'equity', 1, 'Lợi nhuận chưa được phân phối'),

-- 4. DOANH THU (REVENUE)
('511', 'Doanh thu bán hàng', 'Sales Revenue', 'revenue', 'revenue', 1, 'Doanh thu từ bán hàng hóa'),
('512', 'Doanh thu cung cấp dịch vụ', 'Service Revenue', 'revenue', 'revenue', 1, 'Doanh thu từ cung cấp dịch vụ'),
('515', 'Doanh thu hoạt động tài chính', 'Financial Revenue', 'revenue', 'revenue', 1, 'Doanh thu từ hoạt động tài chính'),

-- 5. CHI PHÍ (EXPENSES)
('632', 'Giá vốn hàng bán', 'Cost of Goods Sold', 'expense', 'expense', 1, 'Chi phí giá vốn hàng bán'),
('641', 'Chi phí bán hàng', 'Selling Expenses', 'expense', 'expense', 1, 'Chi phí liên quan đến bán hàng'),
('642', 'Chi phí quản lý doanh nghiệp', 'Administrative Expenses', 'expense', 'expense', 1, 'Chi phí quản lý chung của doanh nghiệp'),
('635', 'Chi phí tài chính', 'Financial Expenses', 'expense', 'expense', 1, 'Chi phí liên quan đến hoạt động tài chính');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_class ON chart_of_accounts(account_class);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_active ON chart_of_accounts(is_active);

-- Add comments
COMMENT ON TABLE chart_of_accounts IS 'Vietnamese Chart of Accounts - Hệ thống tài khoản kế toán Việt Nam';
COMMENT ON COLUMN chart_of_accounts.account_code IS 'Mã tài khoản theo chuẩn Việt Nam';
COMMENT ON COLUMN chart_of_accounts.account_name IS 'Tên tài khoản bằng tiếng Việt';
COMMENT ON COLUMN chart_of_accounts.account_name_en IS 'Tên tài khoản bằng tiếng Anh';
COMMENT ON COLUMN chart_of_accounts.account_type IS 'Loại tài khoản: asset, liability, equity, revenue, expense';
COMMENT ON COLUMN chart_of_accounts.account_class IS 'Phân loại chi tiết: current_asset, fixed_asset, current_liability, long_term_liability, equity, revenue, expense';
COMMENT ON COLUMN chart_of_accounts.level IS 'Cấp độ tài khoản (1: cấp 1, 2: cấp 2, 3: cấp 3)';

-- Create a view for easy reporting
CREATE OR REPLACE VIEW chart_of_accounts_view AS
SELECT 
    account_code,
    account_name,
    account_name_en,
    account_type,
    account_class,
    level,
    is_active,
    description,
    CASE 
        WHEN account_type = 'asset' THEN 'Tài sản'
        WHEN account_type = 'liability' THEN 'Nợ phải trả'
        WHEN account_type = 'equity' THEN 'Vốn chủ sở hữu'
        WHEN account_type = 'revenue' THEN 'Doanh thu'
        WHEN account_type = 'expense' THEN 'Chi phí'
        ELSE account_type
    END as account_type_vietnamese,
    CASE 
        WHEN account_class = 'current_asset' THEN 'Tài sản lưu động'
        WHEN account_class = 'fixed_asset' THEN 'Tài sản cố định'
        WHEN account_class = 'current_liability' THEN 'Nợ ngắn hạn'
        WHEN account_class = 'long_term_liability' THEN 'Nợ dài hạn'
        WHEN account_class = 'equity' THEN 'Vốn chủ sở hữu'
        WHEN account_class = 'revenue' THEN 'Doanh thu'
        WHEN account_class = 'expense' THEN 'Chi phí'
        ELSE account_class
    END as account_class_vietnamese
FROM chart_of_accounts
WHERE is_active = true
ORDER BY account_code;
