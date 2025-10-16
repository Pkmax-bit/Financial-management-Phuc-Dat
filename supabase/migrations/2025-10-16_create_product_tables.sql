-- Create table: product_categories
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_product_categories_updated_at on public.product_categories;
create trigger trg_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

-- Create table: products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  name text not null,
  price numeric(18,2) not null default 0,
  unit text not null default 'cái',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Helpful indexes
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_name on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'')));

-- Row Level Security (optional - enable and add simple policies)
alter table public.product_categories enable row level security;
alter table public.products enable row level security;

-- Allow authenticated users to read
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'product_categories' and policyname = 'Allow select for authenticated'
  ) then
    create policy "Allow select for authenticated" on public.product_categories
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'products' and policyname = 'Allow select for authenticated'
  ) then
    create policy "Allow select for authenticated" on public.products
      for select to authenticated using (true);
  end if;
end $$;

-- Allow authenticated users to insert/update (adjust to your needs)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'product_categories' and policyname = 'Allow write for authenticated'
  ) then
    create policy "Allow write for authenticated" on public.product_categories
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'products' and policyname = 'Allow write for authenticated'
  ) then
    create policy "Allow write for authenticated" on public.products
      for all to authenticated using (true) with check (true);
  end if;
end $$;


