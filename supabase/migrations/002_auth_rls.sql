-- Halal Roomies: Auth-required posting + own-listing updates (run in Supabase SQL Editor)
--
-- Also configure in Dashboard → Authentication → URL Configuration:
--   Site URL: https://cuishuhan.github.io/halal-roomies/
--   Redirect URLs: http://localhost:8080/** and https://cuishuhan.github.io/halal-roomies/**
--
-- Optional for faster local testing: Authentication → Providers → Email → disable "Confirm email"

-- Listings: drop open insert; require logged-in user and matching user_id
drop policy if exists "Anyone can insert listings" on public.listings;

drop policy if exists "Authenticated users insert own listings" on public.listings;
create policy "Authenticated users insert own listings"
  on public.listings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own listings" on public.listings;
create policy "Users update own listings"
  on public.listings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own listings" on public.listings;
create policy "Users delete own listings"
  on public.listings
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage: only authenticated users may upload to listing-photos
drop policy if exists "Anyone can upload listing photos" on storage.objects;

drop policy if exists "Authenticated upload listing photos" on storage.objects;
create policy "Authenticated upload listing photos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'listing-photos');
