-- Wild AI Dashboard — Auth Migration
-- Run this in your Supabase SQL Editor AFTER running schema.sql

-- 1. Add auth columns to businesses
alter table businesses
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists is_active boolean default true;

-- 2. Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  full_name text,
  email text,
  role text default 'client' check (role in ('super_admin', 'client')),
  business_id uuid references businesses(id) on delete set null
);

-- Index for fast role lookups
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_business_id on profiles(business_id);

-- 3. Enable RLS on all tables
alter table businesses enable row level security;
alter table contacts enable row level security;
alter table calls enable row level security;
alter table bookings enable row level security;
alter table profiles enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper function: get current user's business_id
create or replace function get_my_business_id()
returns uuid
language sql
security definer
stable
as $$
  select business_id from profiles where id = auth.uid();
$$;

-- 4. Drop any existing policies (clean slate)
drop policy if exists "super_admin all businesses" on businesses;
drop policy if exists "client own business" on businesses;
drop policy if exists "super_admin all profiles" on profiles;
drop policy if exists "client own profile" on profiles;
drop policy if exists "super_admin all contacts" on contacts;
drop policy if exists "client own contacts" on contacts;
drop policy if exists "super_admin all calls" on calls;
drop policy if exists "client own calls" on calls;
drop policy if exists "super_admin all bookings" on bookings;
drop policy if exists "client own bookings" on bookings;

-- 5. BUSINESSES policies
create policy "super_admin all businesses"
  on businesses for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

create policy "client own business"
  on businesses for all
  using (id = get_my_business_id())
  with check (id = get_my_business_id());

-- 6. PROFILES policies
create policy "super_admin all profiles"
  on profiles for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

create policy "client own profile"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- 7. CONTACTS policies
create policy "super_admin all contacts"
  on contacts for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

create policy "client own contacts"
  on contacts for all
  using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

-- 8. CALLS policies
create policy "super_admin all calls"
  on calls for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

create policy "client own calls"
  on calls for all
  using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

-- 9. BOOKINGS policies
create policy "super_admin all bookings"
  on bookings for all
  using (get_my_role() = 'super_admin')
  with check (get_my_role() = 'super_admin');

create policy "client own bookings"
  on bookings for all
  using (business_id = get_my_business_id())
  with check (business_id = get_my_business_id());

-- 10. Create super admin profile for yourself
-- IMPORTANT: First sign up at /login with your email, then run this
-- to grant yourself super_admin access:
--
-- insert into profiles (id, full_name, email, role)
-- select id, email, email, 'super_admin'
-- from auth.users
-- where email = 'your-email@example.com'
-- on conflict (id) do update set role = 'super_admin';
