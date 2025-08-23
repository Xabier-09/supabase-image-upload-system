// Supabase Configuration
// Note: Create a config.js file with your actual Supabase credentials
// Use config.example.js as a template

try {
    // Try to load configuration
    if (typeof window.SUPABASE_CONFIG !== 'undefined') {
        // Use configuration from config.js
        const SUPABASE_URL = window.SUPABASE_CONFIG.URL;
        const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.ANON_KEY;
        
        // Initialize Supabase client with configuration
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabase;
        
        console.log('Supabase client initialized with configuration');
    } else {
        // Fallback to environment variables or default values
        const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jdtkgjunxdspmgbbmsdq.supabase.co';
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGtnanVueGRzcG1nYmJtc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODU0NjYsImV4cCI6MjA3MTQ2MTQ2Nn0.mIN1BHien_ldObRWmWSTqZztK6byhFAx9uxOJUnDgqo';
        
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabase;
        
        console.warn('Using default Supabase configuration. Please create config.js with your credentials.');
    }
} catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Create a mock supabase client for development
    window.supabaseClient = {
        auth: {
            getuser: () => ({ data: { user: null }, error: null }),
            signUp: () => ({ data: null, error: new Error('Supabase not configured') }),
            signIn: () => ({ data: null, error: new Error('Supabase not configured') }),
            signOut: () => ({ error: new Error('Supabase not configured') })
        },
        storage: {
            from: () => ({
                upload: () => ({ data: null, error: new Error('Supabase not configured') }),
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => ({
                        range: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
                    })
                }),
                insert: () => ({
                    select: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
                })
            })
        })
    };
}

// Utility functions for Supabase operations
const SupabaseService = {
    // Get current user
    getCurrentUser: () => {
        return supabase.auth.getUser();
    },

    // Sign up new user
    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        return { data, error };
    },

    // Sign in user
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // Sign out user
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Upload image to storage
    uploadImage: async (file, fileName) => {
        const { data, error } = await supabase.storage
            .from('images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        return { data, error };
    },

    // Get public URL for image
    getImageUrl: (fileName) => {
        return supabase.storage
            .from('images')
            .getPublicUrl(fileName).data.publicUrl;
    },

    // Insert image metadata to database
    insertImageMetadata: async (imageData) => {
        const { data, error } = await supabase
            .from('images')
            .insert([imageData])
            .select();
        return { data, error };
    },

    // Get all images with pagination
    getImages: async (page = 1, limit = 20, filters = {}) => {
        let query = supabase
            .from('images')
            .select(`
                *,
                user:user_id (
                    id,
                    email,
                    full_name
                ),
                ratings (
                    rating,
                    user_id
                ),
                comments (
                    id,
                    content,
                    created_at,
                    user:user_id (
                        id,
                        email,
                        full_name
                    )
                )
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

const { data, error } = await query;
if (error) {
    console.error('Error fetching images:', error);
    return { data: null, error };
}
        return { data, error };
    },

    // Add rating to image
    addRating: async (imageId, rating) => {
        const user = await SupabaseService.getCurrentUser();
        const { data, error } = await supabase
            .from('ratings')
            .upsert({
                image_id: imageId,
                user_id: user.data.user.id,
                rating: rating
            }, {
                onConflict: 'image_id,user_id'
            });
        return { data, error };
    },

    // Add comment to image
    addComment: async (imageId, content) => {
        const user = await SupabaseService.getCurrentUser();
        const { data, error } = await supabase
            .from('comments')
            .insert({
                image_id: imageId,
                user_id: user.data.user.id,
                content: content
            })
            .select(`
                *,
                user:user_id (
                    id,
                    email,
                    full_name
                )
            `);
        return { data, error };
    },

    // Toggle favorite
    toggleFavorite: async (imageId) => {
        const user = await SupabaseService.getCurrentUser();
        
        // Check if already favorited
        const { data: existing } = await supabase
            .from('favorites')
            .select()
            .eq('image_id', imageId)
            .eq('user_id', user.data.user.id)
            .single();

        if (existing) {
            // Remove from favorites
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('image_id', imageId)
                .eq('user_id', user.data.user.id);
            return { favorited: false, error };
        } else {
            // Add to favorites
            const { error } = await supabase
                .from('favorites')
                .insert({
                    image_id: imageId,
                    user_id: user.data.user.id
                });
            return { favorited: true, error };
        }
    },

    // Check if image is favorited by current user
    isFavorited: async (imageId) => {
        const user = await SupabaseService.getCurrentUser();
        const { data } = await supabase
            .from('favorites')
            .select()
            .eq('image_id', imageId)
            .eq('user_id', user.data.user.id)
            .single();
        return !!data;
    }
};

// Export the service
window.SupabaseService = SupabaseService;
