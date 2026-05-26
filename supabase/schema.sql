-- Run this in the Supabase SQL editor to set up tables for trades + AI insights.

create table if not exists public.congress_trades (
  id uuid primary key default gen_random_uuid(),
  trade_key text not null unique,
  politician_id text not null,
  politician_name text,
  ticker text not null,
  trade_type text not null,
  amount_range text,
  trade_date date not null,
  filing_date date,
  sector text,
  excess_return numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_congress_trades_politician_date
  on public.congress_trades (politician_id, trade_date desc);

create table if not exists public.politician_insights (
  politician_id text primary key,
  politician_name text,
  analysis text not null,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  politician_name text not null,
  politician_id text,
  created_at timestamptz not null default now(),
  unique (email, politician_name)
);

create index if not exists idx_subscriptions_politician_name
  on public.subscriptions (politician_name);

alter table public.congress_trades enable row level security;
alter table public.politician_insights enable row level security;
alter table public.subscriptions enable row level security;

create policy "Allow public read on congress_trades"
  on public.congress_trades for select
  using (true);

create policy "Allow public read on politician_insights"
  on public.politician_insights for select
  using (true);

create policy "Allow public insert on subscriptions"
  on public.subscriptions for insert
  with check (true);

create policy "Allow public read on subscriptions"
  on public.subscriptions for select
  using (true);

create policy "Allow service writes on congress_trades"
  on public.congress_trades for all
  using (true)
  with check (true);

create policy "Allow service writes on politician_insights"
  on public.politician_insights for all
  using (true)
  with check (true);

create policy "Allow service writes on subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Migration for existing installs:
-- alter table public.congress_trades add column if not exists trade_key text unique;
-- update public.congress_trades set trade_key = politician_id || '|' || ticker || '|' || trade_date || '|' || trade_type || '|' || coalesce(amount_range, '') where trade_key is null;
-- alter table public.congress_trades alter column trade_key set not null;
