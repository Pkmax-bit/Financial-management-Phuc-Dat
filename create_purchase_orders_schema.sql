-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to allow recreation during development
DROP VIEW IF EXISTS purchase_order_summary;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    delivery_date DATE,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of items ordered
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'VND',
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected', 'closed'
    notes TEXT,
    terms TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_order_items table for detailed line items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_issue_date ON purchase_orders(issue_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_by ON purchase_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- Add comments for clarity
COMMENT ON TABLE purchase_orders IS 'Purchase orders for internal spending control and approval workflow';
COMMENT ON COLUMN purchase_orders.po_number IS 'Unique purchase order number (e.g., PO-20250101-001)';
COMMENT ON COLUMN purchase_orders.vendor_id IS 'Vendor/supplier for this purchase order';
COMMENT ON COLUMN purchase_orders.issue_date IS 'Date when the purchase order was issued';
COMMENT ON COLUMN purchase_orders.delivery_date IS 'Expected delivery date for the goods/services';
COMMENT ON COLUMN purchase_orders.line_items IS 'JSON array of items ordered (for quick access)';
COMMENT ON COLUMN purchase_orders.status IS 'Current status of the purchase order (draft, pending_approval, approved, rejected, closed)';
COMMENT ON COLUMN purchase_orders.approved_by IS 'User who approved this purchase order';
COMMENT ON COLUMN purchase_orders.approved_at IS 'Timestamp when the purchase order was approved';
COMMENT ON TABLE purchase_order_items IS 'Detailed line items for each purchase order';
COMMENT ON COLUMN purchase_order_items.product_name IS 'Name of the product/service being ordered';
COMMENT ON COLUMN purchase_order_items.line_total IS 'Total amount for this line item (quantity * unit_price - discount)';

-- Create a view to summarize purchase order information
CREATE OR REPLACE VIEW purchase_order_summary AS
SELECT
    po.id,
    po.po_number,
    po.vendor_id,
    v.name AS vendor_name,
    v.email AS vendor_email,
    po.issue_date,
    po.delivery_date,
    po.total_amount,
    po.currency,
    po.status,
    po.notes,
    po.created_by,
    u1.email AS created_by_email,
    po.approved_by,
    u2.email AS approved_by_email,
    po.approved_at,
    po.created_at,
    po.updated_at,
    COUNT(poi.id) AS item_count
FROM
    purchase_orders po
JOIN
    vendors v ON po.vendor_id = v.id
LEFT JOIN
    auth.users u1 ON po.created_by = u1.id
LEFT JOIN
    auth.users u2 ON po.approved_by = u2.id
LEFT JOIN
    purchase_order_items poi ON po.id = poi.po_id
GROUP BY
    po.id, v.name, v.email, u1.email, u2.email;

-- Create a function to generate PO numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 12) AS INTEGER)), 0) + 1
    INTO counter
    FROM purchase_orders
    WHERE po_number LIKE 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    -- Format: PO-YYYYMMDD-XXX
    new_number := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate PO numbers
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        NEW.po_number := generate_po_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_po_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_po_number();

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_order_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_order_updated_at();
