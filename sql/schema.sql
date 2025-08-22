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

-- Tabla de valoraciones con comentarios
create table if not exists public.ratings (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  user_id uuid references auth.users not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (image_id, user_id)
);

-- Tabla de comentarios (para comentarios independientes de ratings)
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de favoritos
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  unique (image_id, user_id)
);

-- Tabla de categorías
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Tabla de relación imágenes-categorías
create table if not exists public.image_categories (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  category_id uuid references public.categories(id) not null,
  created_at timestamptz default now(),
  unique (image_id, category_id)
);

-- Tabla de reportes/moderation
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  image_id uuid references public.images(id) not null,
  user_id uuid references auth.users not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de seguidores
create table if not exists public.followers (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users not null,
  following_id uuid references auth.users not null,
  created_at timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

-- Vista con estadísticas completas de imágenes
create or replace view public.image_stats as
select
  i.id,
  i.owner,
  i.filename,
  i.storage_path,
  i.title,
  i.created_at,
  coalesce(avg(r.rating),0)::numeric(3,2) as avg_rating,
  count(r.*) as rating_count,
  count(distinct c.id) as comment_count,
  count(distinct f.id) as favorite_count,
  exists(
    select 1 from public.favorites fav 
    where fav.image_id = i.id and fav.user_id = auth.uid()
  ) as is_favorited
from public.images i
left join public.ratings r on r.image_id = i.id
left join public.comments c on c.image_id = i.id
left join public.favorites f on f.image_id = i.id
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

-- Row level security para todas las tablas
alter table public.user_profiles enable row level security;
create policy "user_profiles_select_own" on public.user_profiles for select using (auth.uid() = id);
create policy "user_profiles_select_public" on public.user_profiles for select using (true);
create policy "user_profiles_insert_own" on public.user_profiles for insert with check (auth.uid() = id);
create policy "user_profiles_update_own" on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);

alter table public.user_registrations enable row level security;
create policy "user_registrations_select_own" on public.user_registrations for select using (auth.uid() = user_id);
create policy "user_registrations_select_admin" on public.user_registrations for select using (auth.jwt() ->> 'role' = 'service_role');
create policy "user_registrations_insert_own" on public.user_registrations for insert with check (auth.uid() = user_id);

alter table public.login_history enable row level security;
create policy "login_history_select_own" on public.login_history for select using (auth.uid() = user_id);
create policy "login_history_select_admin" on public.login_history for select using (auth.jwt() ->> 'role' = 'service_role');
create policy "login_history_insert_own" on public.login_history for insert with check (auth.uid() = user_id);

-- RLS para nuevas tablas
alter table public.comments enable row level security;
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update" on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

alter table public.favorites enable row level security;
create policy "favorites_select" on public.favorites for select using (true);
create policy "favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete using (auth.uid() = user_id);

alter table public.followers enable row level security;
create policy "followers_select" on public.followers for select using (true);
create policy "followers_insert" on public.followers for insert with check (auth.uid() = follower_id);
create policy "followers_delete" on public.followers for delete using (auth.uid() = follower_id);

alter table public.reports enable row level security;
create policy "reports_select_own" on public.reports for select using (auth.uid() = user_id);
create policy "reports_select_admin" on public.reports for select using (auth.jwt() ->> 'role' = 'service_role');
create policy "reports_insert" on public.reports for insert with check (auth.uid() = user_id);

-- RLS para tablas de categorías (solo lectura pública)
alter table public.categories enable row level security;
create policy "categories_select" on public.categories for select using (true);

alter table public.image_categories enable row level security;
create policy "image_categories_select" on public.image_categories for select using (true);
create policy "image_categories_insert" on public.image_categories for insert with check (
  exists (select 1 from public.images where id = image_id and owner = auth.uid())
);

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

-- Función para registrar nuevos usuarios (bypass RLS issues)
create or replace function public.track_user_registration(
  p_user_id uuid,
  p_registration_method text default 'email'
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_registrations (user_id, registration_method)
  values (p_user_id, p_registration_method);
end;
$$;
