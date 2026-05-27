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
  sec_data jsonb,
  sec_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.congress_trades add column if not exists sec_data jsonb;
alter table public.congress_trades add column if not exists sec_synced_at timestamptz;

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

create table if not exists public.politician_alpha_briefs (
  politician_id text primary key,
  politician_name text,
  brief jsonb not null,
  trades_in_window integer not null default 0,
  window_days integer not null default 30,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.politician_alpha_briefs enable row level security;

drop policy if exists "Allow public read on politician_alpha_briefs" on public.politician_alpha_briefs;
create policy "Allow public read on politician_alpha_briefs"
  on public.politician_alpha_briefs for select
  using (true);

drop policy if exists "Allow service writes on politician_alpha_briefs" on public.politician_alpha_briefs;
create policy "Allow service writes on politician_alpha_briefs"
  on public.politician_alpha_briefs for all
  using (true)
  with check (true);

create table if not exists public.sec_filings (
  filing_key text primary key,
  politician_id text not null,
  politician_name text,
  form text not null,
  filed_at date not null,
  title text not null,
  entity_name text not null,
  ticker text,
  source text not null,
  document_url text not null,
  excerpt text,
  category text not null,
  category_label text not null,
  days_ago integer not null default 0,
  recency_label text not null default '',
  priority numeric not null default 0,
  is_featured boolean not null default false,
  trade_keys text[] not null default '{}',
  filing_data jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sec_filings_politician_date
  on public.sec_filings (politician_id, filed_at desc);

create index if not exists idx_sec_filings_ticker_date
  on public.sec_filings (ticker, filed_at desc);

alter table public.sec_filings enable row level security;

drop policy if exists "Allow public read on sec_filings" on public.sec_filings;
create policy "Allow public read on sec_filings"
  on public.sec_filings for select
  using (true);

drop policy if exists "Allow service writes on sec_filings" on public.sec_filings;
create policy "Allow service writes on sec_filings"
  on public.sec_filings for all
  using (true)
  with check (true);
