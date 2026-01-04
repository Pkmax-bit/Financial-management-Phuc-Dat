-- Migration: Optimize Products, Quotes, and Invoices Structure
-- Date: 2025-01-02
-- Description: Restructures products, quotes, and invoices for better consistency and performance

-- =====================================================
-- 1. ENHANCE PRODUCTS TABLE
-- =====================================================

-- Add new columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'product' CHECK (type IN ('product', 'service'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost NUMERIC(18,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'VND';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_included BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB;

-- Add dimensions columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_m NUMERIC(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_m NUMERIC(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_m NUMERIC(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(15,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_cubicm NUMERIC(15,3);

-- Rename existing price column to unit_price for clarity
ALTER TABLE products RENAME COLUMN price TO unit_price;

-- =====================================================
-- 2. UPDATE QUOTES TABLE
-- =====================================================

-- Add new columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0.0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Rename columns for consistency
ALTER TABLE quotes RENAME COLUMN expiry_date TO valid_until;
ALTER TABLE quotes RENAME COLUMN employee_in_charge TO employee_in_charge;

-- =====================================================
-- 3. UPDATE QUOTE_ITEMS TABLE
-- =====================================================

-- Add new columns to quote_items table
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS product_service_id UUID REFERENCES products(id);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0.0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(12,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0.0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS total_with_tax NUMERIC(12,2);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add dimensions columns to quote_items table
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS length_m NUMERIC(10,3);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS width_m NUMERIC(10,3);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS height_m NUMERIC(10,3);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(15,3);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS volume_cubicm NUMERIC(15,3);

-- Rename existing columns for consistency
ALTER TABLE quote_items RENAME COLUMN subtotal TO line_total;

-- =====================================================
-- 4. UPDATE INVOICES TABLE
-- =====================================================

-- Add new columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'recurring', 'proforma', 'credit_note'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0.0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE invoices RENAME COLUMN paid_amount TO paid_amount_old;

-- Change paid_amount type to match new structure
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0.0;

-- Copy data from old column if it exists
UPDATE invoices SET paid_amount = paid_amount_old WHERE paid_amount_old IS NOT NULL;

-- Drop old column
ALTER TABLE invoices DROP COLUMN IF EXISTS paid_amount_old;

-- =====================================================
-- 5. UPDATE INVOICE_ITEMS TABLE
-- =====================================================

-- Add new columns to invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_service_id UUID REFERENCES products(id);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0.0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS line_total NUMERIC(12,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0.0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_with_tax NUMERIC(12,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add dimensions columns to invoice_items table
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS length_m NUMERIC(10,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS width_m NUMERIC(10,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS height_m NUMERIC(10,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(15,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS volume_cubicm NUMERIC(15,3);

-- Rename existing columns for consistency
ALTER TABLE invoice_items RENAME COLUMN subtotal TO line_total;

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON quotes(issue_date);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);

-- Quote items indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_service_id ON quote_items(product_service_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_sort_order ON quote_items(quote_id, sort_order);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Invoice items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_service_id ON invoice_items(product_service_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort_order ON invoice_items(invoice_id, sort_order);

-- =====================================================
-- 7. DATA MIGRATION
-- =====================================================

-- Migrate quote items from JSONB to relational (if data exists)
-- Note: This is a complex migration that may need to be done in application code
-- For now, we'll keep the JSONB column for backward compatibility

-- Migrate invoice items from JSONB to relational (if data exists)
-- Note: This is a complex migration that may need to be done in application code
-- For now, we'll keep the JSONB column for backward compatibility

-- =====================================================
-- 8. UPDATE TRIGGERS
-- =====================================================

-- Update updated_at triggers for all modified tables
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. UPDATE RLS POLICIES (if needed)
-- =====================================================

-- Note: RLS policies should be reviewed and updated if necessary
-- based on the new table structure and business requirements

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment to track migration
COMMENT ON DATABASE postgres IS 'Migration: optimize_products_quotes_invoices_structure applied on 2025-01-02';


