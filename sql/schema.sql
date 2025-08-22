-- Habilitar extensión de generación de UUID (pgcrypto en Supabase)
create extension if not exists pgcrypto;

-- Tabla de perfiles de usuario (información adicional)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de registros de usuarios
create table if not exists public.user_registrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  registration_method text default 'email', -- email, google, github, etc.
  created_at timestamptz default now()
);

-- Tabla de historial de inicio de sesión
create table if not exists public.login_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  success boolean not null,
  failure_reason text,
  created_at timestamptz default now()
);

-- Tabla de imágenes
create table if not exists public.images (
  id uuid default gen_random_uuid() primary key,
  owner uuid references auth.users not null,
  filename text not null,
  storage_path text not null,
  title text,
  created_at timestamptz default now()
);

-- Tabla de valoraciones
create table if not exists public.ratings (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  user_id uuid references auth.users not null,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (image_id, user_id)
);

-- Vista con promedio y conteo de valoraciones por imagen
create or replace view public.image_stats as
select
  i.id,
  i.owner,
  i.filename,
  i.storage_path,
  i.title,
  i.created_at,
  coalesce(avg(r.rating),0)::numeric(3,2) as avg_rating,
  count(r.*) as rating_count
from public.images i
left join public.ratings r on r.image_id = i.id
group by i.id;

-- Row level security
alter table public.images enable row level security;
create policy "images_select" on public.images for select using (true);
create policy "images_insert" on public.images for insert with check (auth.uid() = owner);
create policy "images_update" on public.images for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "images_delete" on public.images for delete using (auth.uid() = owner);

alter table public.ratings enable row level security;
create policy "ratings_select" on public.ratings for select using (true);
create policy "ratings_insert" on public.ratings for insert with check (auth.uid() = user_id);
create policy "ratings_update" on public.ratings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ratings_delete" on public.ratings for delete using (auth.uid() = user_id);

-- Row level security para nuevas tablas
alter table public.user_profiles enable row level security;
create policy "user_profiles_select_own" on public.user_profiles for select using (auth.uid() = id);
create policy "user_profiles_select_public" on public.user_profiles for select using (true); -- Permitir ver perfiles públicos
create policy "user_profiles_insert_own" on public.user_profiles for insert with check (auth.uid() = id);
create policy "user_profiles_update_own" on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.user_registrations enable row level security;
create policy "user_registrations_select_own" on public.user_registrations for select using (auth.uid() = user_id);
create policy "user_registrations_select_admin" on public.user_registrations for select using (auth.jwt() ->> 'role' = 'service_role'); -- Solo admins
create policy "user_registrations_insert_own" on public.user_registrations for insert with check (auth.uid() = user_id); -- Usuarios pueden insertar sus propios registros

alter table public.login_history enable row level security;
create policy "login_history_select_own" on public.login_history for select using (auth.uid() = user_id);
create policy "login_history_select_admin" on public.login_history for select using (auth.jwt() ->> 'role' = 'service_role'); -- Solo admins
create policy "login_history_insert_own" on public.login_history for insert with check (auth.uid() = user_id); -- Usuarios pueden insertar sus propios historiales

-- Función para crear perfil automáticamente cuando se registra un usuario
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

-- Eliminar y recrear trigger de perfiles
drop trigger if exists on_auth_user_created_for_profile on auth.users;

create trigger on_auth_user_created_for_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

-- Función para registrar intentos de inicio de sesión (versión simplificada)
create or replace function public.track_login_attempt(
  p_user_id uuid,
  p_success boolean,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.login_history (user_id, success, failure_reason)
  values (p_user_id, p_success, p_failure_reason);
end;
$$;
