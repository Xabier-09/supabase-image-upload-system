-- Supabase Setup Script for Image Gallery
-- Run this SQL in your Supabase SQL editor to create the necessary tables and policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create images table
CREATE TABLE images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'general',
    size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(image_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(image_id, user_id)
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Enable RLS on all tables
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Images policies
CREATE POLICY "Images are viewable by everyone" ON images
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert images" ON images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON images
    FOR DELETE USING (auth.uid() = user_id);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ratings" ON ratings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own ratings" ON ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Favorites are viewable by owner" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert favorites" ON favorites
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (bucket_id = 'images' AND auth.uid() = owner);

-- Create indexes for better performance
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at);
CREATE INDEX idx_ratings_image_id ON ratings(image_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_comments_image_id ON comments(image_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_image_id ON favorites(image_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display success message
SELECT 'Database setup completed successfully! Remember to:' AS message
UNION ALL
SELECT '1. Update supabase.js with your project URL and anon key'
UNION ALL
SELECT '2. Configure email templates in Supabase Auth settings'
UNION ALL
SELECT '3. Test the application thoroughly'
UNION ALL
SELECT '4. Sample data will be created automatically when users upload images';
