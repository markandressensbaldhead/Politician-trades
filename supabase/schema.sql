-- Run this in the Supabase SQL editor to set up tables for trades + AI insights.
-- Safe to re-run: uses IF NOT EXISTS and drops policies before recreating.

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

drop policy if exists "Allow public read on congress_trades" on public.congress_trades;
create policy "Allow public read on congress_trades"
  on public.congress_trades for select
  using (true);

drop policy if exists "Allow public read on politician_insights" on public.politician_insights;
create policy "Allow public read on politician_insights"
  on public.politician_insights for select
  using (true);

drop policy if exists "Allow public insert on subscriptions" on public.subscriptions;
create policy "Allow public insert on subscriptions"
  on public.subscriptions for insert
  with check (true);

drop policy if exists "Allow public read on subscriptions" on public.subscriptions;
create policy "Allow public read on subscriptions"
  on public.subscriptions for select
  using (true);

drop policy if exists "Allow service writes on congress_trades" on public.congress_trades;
create policy "Allow service writes on congress_trades"
  on public.congress_trades for all
  using (true)
  with check (true);

drop policy if exists "Allow service writes on politician_insights" on public.politician_insights;
create policy "Allow service writes on politician_insights"
  on public.politician_insights for all
  using (true)
  with check (true);

drop policy if exists "Allow service writes on subscriptions" on public.subscriptions;
create policy "Allow service writes on subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

create table if not exists public.politician_filing_insights (
  politician_id text primary key,
  politician_name text,
  analysis text not null,
  filings_reviewed integer not null default 0,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.politician_filing_insights enable row level security;

drop policy if exists "Allow public read on politician_filing_insights" on public.politician_filing_insights;
create policy "Allow public read on politician_filing_insights"
  on public.politician_filing_insights for select
  using (true);

drop policy if exists "Allow service writes on politician_filing_insights" on public.politician_filing_insights;
create policy "Allow service writes on politician_filing_insights"
  on public.politician_filing_insights for all
  using (true)
  with check (true);
