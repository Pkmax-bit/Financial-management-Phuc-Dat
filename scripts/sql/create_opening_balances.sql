-- Opening balances for cash/bank and related accounts

CREATE TABLE IF NOT EXISTS opening_balances (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	as_of_date DATE NOT NULL,
	account_code VARCHAR(20) NOT NULL,
	account_name VARCHAR(100) NOT NULL,
	debit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
	credit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opening_balances_date ON opening_balances(as_of_date);
CREATE INDEX IF NOT EXISTS idx_opening_balances_account ON opening_balances(account_code);

-- Sample entries (edit as needed)
-- Cash 111: beginning balance 50,000,000 VND on 2025-01-01
INSERT INTO opening_balances (as_of_date, account_code, account_name, debit_amount, credit_amount)
VALUES ('2025-01-01', '111', 'Tiền mặt', 50000000, 0)
ON CONFLICT DO NOTHING;

-- Bank 112: beginning balance 120,000,000 VND on 2025-01-01
INSERT INTO opening_balances (as_of_date, account_code, account_name, debit_amount, credit_amount)
VALUES ('2025-01-01', '112', 'Tiền gửi ngân hàng', 120000000, 0)
ON CONFLICT DO NOTHING;

