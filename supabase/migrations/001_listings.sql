-- Halal Roomies: Apartment listings + photo storage (run once in Supabase SQL Editor)

-- 1) Listings table (matches list-property form fields)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  title text not null,
  location text default '',
  type text default 'Apartment',
  beds text default '1',
  baths text default '1',
  rent numeric,
  start_date date,
  furn text default 'yes',
  lease text default '12 months',
  landlord text default '',
  lemail text default '',
  phone text default '',
  image_urls jsonb not null default '[]'::jsonb,
  landlord_avatar_seed text default '',
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

drop policy if exists "Anyone can read listings" on public.listings;
create policy "Anyone can read listings"
  on public.listings
  for select
  using (true);

drop policy if exists "Anyone can insert listings" on public.listings;
create policy "Anyone can insert listings"
  on public.listings
  for insert
  with check (true);

-- 2) Storage bucket for property photos (public read for MVP)
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read listing photos" on storage.objects;
create policy "Public read listing photos"
  on storage.objects
  for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Anyone can upload listing photos" on storage.objects;
create policy "Anyone can upload listing photos"
  on storage.objects
  for insert
  with check (bucket_id = 'listing-photos');
