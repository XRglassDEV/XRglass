create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists public.addons (
  id text primary key,
  name text not null,
  tagline text not null,
  price_cents int not null,
  trial_days int not null default 7,
  icon text not null,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.user_addons (
  user_id uuid references auth.users(id) on delete cascade,
  addon_id text references public.addons(id) on delete cascade,
  status text not null check (status in ('active','trial','canceled','expired')),
  started_at timestamptz not null default now(),
  renewed_at timestamptz,
  primary key (user_id, addon_id)
);

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free','pro')),
  started_at timestamptz default now(),
  renews_at timestamptz
);

alter table public.addons enable row level security;
alter table public.user_addons enable row level security;
alter table public.subscriptions enable row level security;

create policy "read_addons_public" on public.addons for select using (true);
create policy "read_own_user_addons" on public.user_addons for select using (auth.uid() = user_id);
create policy "upsert_own_user_addons" on public.user_addons
for insert with check (auth.uid() = user_id)
, update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "read_own_sub" on public.subscriptions for select using (auth.uid() = user_id);
create policy "upsert_own_sub" on public.subscriptions
for insert with check (auth.uid() = user_id)
, update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.addons (id,name,tagline,price_cents,trial_days,icon,sort_order) values
('whalescope','WhaleScope™','Large transaction tracker',499,7,'🐋',10),
('vaultguard','VaultGuard AI™','Deep contract security scanner',699,7,'🛡️',20),
('xrintel','XRintel™','Off-chain social & web threat monitor',399,7,'🌐',30),
('trustradar','TrustRadar™','Global threat alert system',299,7,'⚡',40),
('crystalreports','CrystalReports™','Pro analytics & PDF exports',799,7,'📊',50)
on conflict (id) do nothing;
