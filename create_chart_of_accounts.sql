-- Create chart_of_accounts table for Vietnamese accounting system
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parent_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard Vietnamese chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_code, description) VALUES
-- ASSETS (Tài sản)
('111', 'Tiền mặt', 'ASSET', NULL, 'Cash on hand'),
('112', 'Tiền gửi ngân hàng', 'ASSET', NULL, 'Bank deposits'),
('131', 'Phải thu khách hàng', 'ASSET', NULL, 'Accounts receivable'),
('152', 'Hàng tồn kho', 'ASSET', NULL, 'Inventory'),
('211', 'Tài sản cố định hữu hình', 'ASSET', NULL, 'Fixed assets - tangible'),
('213', 'Tài sản cố định vô hình', 'ASSET', NULL, 'Fixed assets - intangible'),
('214', 'Hao mòn tài sản cố định', 'ASSET', NULL, 'Accumulated depreciation'),

-- LIABILITIES (Nợ phải trả)
('331', 'Phải trả nhà cung cấp', 'LIABILITY', NULL, 'Accounts payable'),
('333', 'Thuế và các khoản phải nộp nhà nước', 'LIABILITY', NULL, 'Taxes and government obligations'),
('341', 'Vay ngắn hạn', 'LIABILITY', NULL, 'Short-term loans'),
('342', 'Vay dài hạn', 'LIABILITY', NULL, 'Long-term loans'),

-- EQUITY (Vốn chủ sở hữu)
('411', 'Vốn đầu tư của chủ sở hữu', 'EQUITY', NULL, 'Owner capital'),
('421', 'Lợi nhuận chưa phân phối', 'EQUITY', NULL, 'Retained earnings'),

-- REVENUE (Doanh thu)
('511', 'Doanh thu bán hàng', 'REVENUE', NULL, 'Sales revenue'),
('512', 'Doanh thu cung cấp dịch vụ', 'REVENUE', NULL, 'Service revenue'),

-- EXPENSES (Chi phí)
('632', 'Giá vốn hàng bán', 'EXPENSE', NULL, 'Cost of goods sold'),
('641', 'Chi phí bán hàng', 'EXPENSE', NULL, 'Selling expenses'),
('642', 'Chi phí quản lý doanh nghiệp', 'EXPENSE', NULL, 'Administrative expenses');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent ON chart_of_accounts(parent_code);

-- Add comments
COMMENT ON TABLE chart_of_accounts IS 'Vietnamese Chart of Accounts for financial reporting';
COMMENT ON COLUMN chart_of_accounts.account_code IS 'Account code following Vietnamese accounting standards';
COMMENT ON COLUMN chart_of_accounts.account_type IS 'Account type: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE';
