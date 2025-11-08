-- Create components detail tables for quote and invoice items

-- QUOTE ITEM COMPONENTS
create table if not exists public.quote_item_components (
  id uuid primary key default gen_random_uuid(),
  quote_item_id uuid not null references public.quote_items(id) on delete cascade,
  expense_object_id uuid null,
  name text null,
  unit text null,
  unit_price numeric(18,2) not null default 0,
  quantity numeric(18,3) not null default 0,
  total_price numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_quote_item_components_item on public.quote_item_components(quote_item_id);

-- INVOICE ITEM COMPONENTS
create table if not exists public.invoice_item_components (
  id uuid primary key default gen_random_uuid(),
  invoice_item_id uuid not null references public.invoice_items(id) on delete cascade,
  expense_object_id uuid null,
  name text null,
  unit text null,
  unit_price numeric(18,2) not null default 0,
  quantity numeric(18,3) not null default 0,
  total_price numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoice_item_components_item on public.invoice_item_components(invoice_item_id);

-- Add JSONB materials/components storage to quote and invoice line items
-- Purpose: allow each quote/invoice item to store detailed materials breakdown
-- Structure per element: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}

BEGIN;

-- QUOTE ITEMS
ALTER TABLE IF EXISTS quote_items
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';

COMMENT ON COLUMN quote_items.components IS 'Vật tư/chi tiết cho dòng báo giá (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}';

CREATE INDEX IF NOT EXISTS idx_quote_items_components_gin
  ON quote_items USING GIN (components);

-- INVOICE ITEMS
ALTER TABLE IF NOT EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';

COMMENT ON COLUMN invoice_items.components IS 'Vật tư/chi tiết cho dòng hóa đơn (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}';

CREATE INDEX IF NOT EXISTS idx_invoice_items_components_gin
  ON invoice_items USING GIN (components);

COMMIT;



