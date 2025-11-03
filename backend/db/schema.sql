-- PostgreSQL schema for Buy When Restocked

create table if not exists merchants (
  id uuid primary key default gen_random_uuid(),
  shop_domain text unique not null,
  stripe_account_id text,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  shopify_product_id text not null,
  shopify_variant_id text not null,
  title text,
  variant_title text,
  created_at timestamptz default now(),
  unique(merchant_id, shopify_variant_id)
);

create table if not exists waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  email text not null,
  wants_autopurchase boolean default false,
  stripe_customer_id text,
  stripe_pm_tokenized boolean default false,
  status text default 'queued',
  created_at timestamptz default now()
);

create table if not exists restock_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references merchants(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  shopify_inventory_item_id text,
  prev_qty integer,
  new_qty integer,
  created_at timestamptz default now()
);

create table if not exists purchase_attempts (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid references waitlist_entries(id) on delete set null,
  method text,
  external_id text,
  status text,
  created_at timestamptz default now(),
  metadata jsonb
);
