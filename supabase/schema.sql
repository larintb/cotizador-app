-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  apellido text not null,
  username text unique not null,
  telefono text,
  codigo_postal text,
  role text default 'cliente' check (role in ('cliente', 'admin', 'superadmin')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive', -- 'active' | 'inactive' | 'past_due'
  subscription_plan text,                       -- 'mensual' | 'anual' | null
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

-- Políticas RLS para profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Service role can do anything" on public.profiles
  using (true) with check (true);

-- Cotizaciones table
create table public.cotizaciones (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  admin_id uuid references public.profiles(id) not null,
  status text default 'validacion' check (status in ('validacion','sellado','inspeccion','pedimento','modular','recoger')),
  vehicle_data jsonb not null,
  selected_process text not null,
  customs_value_usd numeric(10,2) not null,
  exchange_rate numeric(8,4) not null,
  agency_fees numeric(10,2) not null,
  result jsonb not null,
  stripe_invoice_id text,
  paid boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS para cotizaciones
alter table public.cotizaciones enable row level security;

create policy "Admins can see own cotizaciones" on public.cotizaciones
  for select using (admin_id = auth.uid());

create policy "Admins can insert cotizaciones" on public.cotizaciones
  for insert with check (admin_id = auth.uid());

create policy "Admins can update own cotizaciones" on public.cotizaciones
  for update using (admin_id = auth.uid());

create policy "Anyone can search by order_number" on public.cotizaciones
  for select using (true);

-- Trigger para crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellido, username, telefono, codigo_postal)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'codigo_postal'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función para updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_cotizaciones_updated_at before update on public.cotizaciones
  for each row execute procedure public.handle_updated_at();
