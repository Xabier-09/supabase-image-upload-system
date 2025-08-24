-- sql/setup.sql
-- Run in Supabase SQL Editor. This script creates tables and policies.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  description text,
  file_name text,
  category text DEFAULT 'general',
  size integer,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES public.images(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint CHECK (rating >=1 AND rating <=5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (image_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES public.images(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id uuid REFERENCES public.images(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, image_id)
);

-- Remove the foreign key constraint that references profiles
ALTER TABLE public.images
  DROP CONSTRAINT IF EXISTS images_user_id_fkey;

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY images_select ON public.images
  FOR SELECT USING ( true );
CREATE POLICY images_insert ON public.images
  FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY images_update ON public.images
  FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );
CREATE POLICY images_delete ON public.images
  FOR DELETE USING ( auth.uid() = user_id );

CREATE POLICY ratings_insert ON public.ratings
  FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY ratings_update ON public.ratings
  FOR UPDATE USING ( auth.uid() = user_id ) WITH CHECK ( auth.uid() = user_id );
CREATE POLICY ratings_select ON public.ratings
  FOR SELECT USING ( true );

CREATE POLICY comments_insert ON public.comments
  FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY comments_select ON public.comments
  FOR SELECT USING ( true );
CREATE POLICY comments_delete ON public.comments
  FOR DELETE USING ( auth.uid() = user_id );

CREATE POLICY favorites_insert ON public.favorites
  FOR INSERT WITH CHECK ( auth.uid() = user_id );
CREATE POLICY favorites_select ON public.favorites
  FOR SELECT USING ( auth.uid() = user_id );
CREATE POLICY favorites_delete ON public.favorites
  FOR DELETE USING ( auth.uid() = user_id );
