-- Subscriptions track the base plan for each user
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text not null check (plan in ('free','pro')),
  status text not null check (status in ('active','inactive')),
  renewal_date timestamptz,
  created_at timestamptz default now()
);

-- Add-ons extend the subscription with extra features
create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  addon_type text not null check (
    addon_type in (
      'trustshield',
      'whalescope',
      'vaultguard',
      'reportgen',
      'verifyapi',
      'communitynode'
    )
  ),
  status text not null check (status in ('active','inactive')),
  linked_subscription uuid references subscriptions(id),
  started_at timestamptz default now()
);

-- Watchlist of wallets/projects tied to each user
create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  address text not null,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;
alter table addons enable row level security;
alter table watchlist enable row level security;

create policy "Users read own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users manage own subscriptions"
  on subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own addons"
  on addons for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own watchlist"
  on watchlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
