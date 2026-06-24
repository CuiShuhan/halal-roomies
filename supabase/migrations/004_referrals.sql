-- Roomdrop: Referrals (run once in Supabase SQL Editor)

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  note text default '',
  apartment_name text not null,
  apartment_location text not null default '',
  avatar_seed text default '',
  created_at timestamptz not null default now()
);

create index if not exists referrals_created_at_idx on public.referrals (created_at desc);

alter table public.referrals enable row level security;

drop policy if exists "Anyone can read referrals" on public.referrals;
create policy "Anyone can read referrals"
  on public.referrals
  for select
  using (true);

drop policy if exists "Authenticated users insert own referrals" on public.referrals;
create policy "Authenticated users insert own referrals"
  on public.referrals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own referrals" on public.referrals;
create policy "Users update own referrals"
  on public.referrals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own referrals" on public.referrals;
create policy "Users delete own referrals"
  on public.referrals
  for delete
  to authenticated
  using (auth.uid() = user_id);
