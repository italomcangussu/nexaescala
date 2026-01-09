-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  crm text,
  specialty text,
  avatar_url text,
  bio text,
  education text,
  academic_title text,
  company text,
  created_at timestamptz default now()
);

-- 2. GROUPS (Services like "UTI Adulto")
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  institution text not null,
  owner_id uuid references public.profiles(id),
  color text default '#059669',
  code text, -- Short code for the service if needed
  created_at timestamptz default now()
);

-- Enums for Roles
create type app_role as enum ('gestor', 'auxiliar', 'medico', 'observador');
create type service_role as enum ('STAFF', 'STAFF_AUX', 'PLANTONISTA', 'VISITANTE');

-- 3. GROUP MEMBERS
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role app_role default 'medico',
  service_role service_role default 'PLANTONISTA',
  joined_at timestamptz default now(),
  unique(group_id, profile_id)
);

-- 4. SHIFT PRESETS (Shift types like "Day 12h")
create table public.shift_presets (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  code text not null, -- 'DT', 'NT'
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- 5. SHIFTS (Actual calendar shifts)
create table public.shifts (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  quantity_needed int default 1,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- 6. SHIFT ASSIGNMENTS
create table public.shift_assignments (
  id uuid default uuid_generate_v4() primary key,
  shift_id uuid references public.shifts(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  is_confirmed boolean default false,
  created_at timestamptz default now(),
  unique(shift_id, profile_id)
);

-- Enums for Finance
create type contract_type as enum ('CLT_PUBLIC', 'PJ_PRIVATE');
create type payment_model as enum ('FIXED', 'PRODUCTION', 'MIXED');

-- 7. FINANCIAL CONFIGS
create table public.financial_configs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  contract_type contract_type default 'PJ_PRIVATE',
  payment_model payment_model default 'MIXED',
  fixed_value numeric default 0,
  production_value_unit numeric default 0,
  tax_percent numeric default 0,
  updated_at timestamptz default now(),
  unique(user_id, group_id)
);

-- 8. FINANCIAL RECORDS
create table public.financial_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  shift_id uuid references public.shifts(id) on delete cascade not null,
  fixed_earnings numeric default 0,
  production_quantity int default 0,
  production_earnings numeric default 0,
  extras_value numeric default 0,
  extras_description text,
  gross_total numeric generated always as (fixed_earnings + production_earnings + extras_value) stored,
  net_total numeric, -- Calculate in app or trigger, let's keep it manual updated for now
  is_paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, shift_id)
);

-- ROW LEVEL SECURITY (RLS)

-- PROFILES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Trigger to create profile
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GROUPS
alter table public.groups enable row level security;
create policy "Groups viewable by members" on public.groups for select using (
  exists (select 1 from public.group_members where group_id = groups.id and profile_id = auth.uid())
);
create policy "Groups editable by owner" on public.groups for update using (owner_id = auth.uid());
create policy "Public insert groups" on public.groups for insert with check (auth.uid() = owner_id);

-- GROUP MEMBERS
alter table public.group_members enable row level security;
create policy "View members of my groups" on public.group_members for select using (
  group_id in (select group_id from public.group_members where profile_id = auth.uid())
);
create policy "Self join or Owner add" on public.group_members for insert with check (
   profile_id = auth.uid() -- Simplification for now
);

-- SHIFTS
alter table public.shifts enable row level security;
create policy "Shifts viewable by group members" on public.shifts for select using (
  exists (select 1 from public.group_members where group_id = shifts.group_id and profile_id = auth.uid())
);
create policy "Shifts editable by admins/owners" on public.shifts for all using (
  exists (select 1 from public.groups where id = shifts.group_id and owner_id = auth.uid()) -- Simply owner for now
);

-- SHIFT ASSIGNMENTS
alter table public.shift_assignments enable row level security;
create policy "View assignments" on public.shift_assignments for select using (true);
create policy "Insert assignments" on public.shift_assignments for insert with check (true); 

-- FINANCIALS (Strict)
alter table public.financial_configs enable row level security;
create policy "Own configs" on public.financial_configs for all using (user_id = auth.uid());

alter table public.financial_records enable row level security;
create policy "Own records" on public.financial_records for all using (user_id = auth.uid());

