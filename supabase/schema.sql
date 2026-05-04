-- Wild AI Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor

-- businesses
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null,
  phone text,
  timezone text default 'America/New_York',
  industry text,
  created_at timestamptz default now()
);

-- contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  phone text,
  email text,
  address text,
  company text,
  notes text,
  business_id uuid references businesses(id) on delete cascade
);

-- bookings (created before calls so calls can reference it)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  contact_id uuid references contacts(id) on delete set null,
  contact_name text,
  service_type text,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'scheduled' check (status in ('scheduled','confirmed','cancelled','completed')),
  source text default 'ai_agent' check (source in ('ai_agent','manual')),
  notes text,
  business_id uuid references businesses(id) on delete cascade,
  call_id uuid -- FK added after calls table
);

-- calls
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  retell_call_id text unique,
  caller_name text,
  caller_phone text,
  caller_email text,
  caller_address text,
  call_duration_seconds int default 0,
  call_summary text,
  call_transcript text,
  call_status text default 'completed' check (call_status in ('completed','missed','voicemail')),
  intent text default 'inquiry' check (intent in ('booking','inquiry','reschedule','cancel','other')),
  sentiment text default 'neutral' check (sentiment in ('positive','neutral','negative')),
  booked boolean default false,
  booking_id uuid references bookings(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  business_id uuid references businesses(id) on delete cascade
);

-- Add FK from bookings to calls
alter table bookings add constraint bookings_call_id_fkey
  foreign key (call_id) references calls(id) on delete set null;

-- Indexes
create index if not exists idx_calls_business_id on calls(business_id);
create index if not exists idx_calls_created_at on calls(created_at desc);
create index if not exists idx_calls_caller_phone on calls(caller_phone);
create index if not exists idx_contacts_business_id on contacts(business_id);
create index if not exists idx_contacts_phone on contacts(phone);
create index if not exists idx_bookings_business_id on bookings(business_id);
create index if not exists idx_bookings_start_time on bookings(start_time);

-- Disable RLS for development (enable and configure policies for production)
alter table businesses disable row level security;
alter table contacts disable row level security;
alter table calls disable row level security;
alter table bookings disable row level security;

-- Seed a default business for demo
insert into businesses (id, name, owner_name, phone, timezone, industry)
values (
  '00000000-0000-0000-0000-000000000001',
  'Thompson Home Services',
  'Jake Thompson',
  '(555) 867-5309',
  'America/Chicago',
  'HVAC'
) on conflict (id) do nothing;
