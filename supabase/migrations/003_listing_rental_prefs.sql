-- Halal Roomies: entire rental + roommate gender preference on listings

alter table public.listings
  add column if not exists entire_rent text default 'yes',
  add column if not exists roommate_gender text default 'any';
