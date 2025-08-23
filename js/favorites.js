// Favorites Service
const FavoritesService = {
    // Initialize favorites service
    init: () => {
        FavoritesService.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Favorite button in image modal
        document.getElementById('favoriteBtn').addEventListener('click', async (e) => {
            const imageId = document.getElementById('modalImage').dataset.imageId;
            if (imageId) {
                await FavoritesService.toggleFavorite(imageId);
            }
        });
    },

    // Toggle favorite status for an image
    toggleFavorite: async (imageId) => {
        try {
            const { favorited, error } = await SupabaseService.toggleFavorite(imageId);
            
            if (error) {
                throw error;
            }

            // Update UI
            await FavoritesService.updateFavoriteUI(imageId, favorited);
            
            AuthService.showSuccess(favorited ? 'Añadido a favoritos' : 'Eliminado de favoritos');

        } catch (error) {
            AuthService.showError('Error al actualizar favoritos: ' + error.message);
        }
    },

    // Update favorite UI elements
    updateFavoriteUI: async (imageId, isFavorited) => {
        // Update modal favorite button
        const modalFavoriteBtn = document.getElementById('favoriteBtn');
        if (modalFavoriteBtn) {
            modalFavoriteBtn.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        }

        // Update gallery card favorite buttons
        const cardFavoriteBtns = document.querySelectorAll(`.image-card[data-image-id="${imageId}"] .favorite-btn`);
        cardFavoriteBtns.forEach(btn => {
            btn.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
        });

        // Update favorite count if displayed
        await FavoritesService.updateFavoriteCount(imageId);
    },

    // Get favorite count for an image
    getFavoriteCount: async (imageId) => {
        try {
            const { count, error } = await supabase
                .from('favorites')
                .select('*', { count: 'exact' })
                .eq('image_id', imageId);

            if (error) {
                throw error;
            }

            return count;
        } catch (error) {
            console.error('Error getting favorite count:', error);
            return 0;
        }
    },

    // Update favorite count display
    updateFavoriteCount: async (imageId) => {
        const count = await FavoritesService.getFavoriteCount(imageId);
        
        // Update modal if open
        const modal = document.getElementById('imageModal');
        if (!modal.classList.contains('hidden')) {
            const favoriteCountElement = document.getElementById('favoriteCount');
            if (favoriteCountElement) {
                favoriteCountElement.textContent = count + (count === 1 ? ' favorito' : ' favoritos');
            }
        }

        // Update gallery cards
        const favoriteCountElements = document.querySelectorAll(`.image-card[data-image-id="${imageId}"] .favorite-count`);
        favoriteCountElements.forEach(element => {
            element.textContent = count;
        });
    },

    // Get user's favorite images
    getUserFavorites: async (userId, page = 1, limit = 20) => {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data: favorites, error } = await supabase
                .from('favorites')
                .select(`
                    image:image_id (
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
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                throw error;
            }

            // Extract images from favorites
            const images = favorites.map(fav => fav.image).filter(image => image !== null);
            return images;

        } catch (error) {
            console.error('Error getting user favorites:', error);
            return [];
        }
    },

    // Check if image is favorited by current user
    isImageFavorited: async (imageId) => {
        try {
            const user = await AuthService.getCurrentUserData();
            if (!user) return false;

            const { data, error } = await supabase
                .from('favorites')
                .select()
                .eq('image_id', imageId)
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('Error checking favorite status:', error);
            return false;
        }
    },

    // Load user's favorite images
    loadUserFavorites: async (userId) => {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '<div class="loading">Cargando favoritos...</div>';

        try {
            const images = await FavoritesService.getUserFavorites(userId);
            
            if (images.length === 0) {
                galleryGrid.innerHTML = '<div class="no-images">No tienes imágenes favoritas</div>';
                return;
            }

            GalleryService.displayImages(images);

        } catch (error) {
            galleryGrid.innerHTML = '<div class="error">Error al cargar favoritos: ' + error.message + '</div>';
        }
    },

    // Initialize favorite buttons for gallery images
    initGalleryFavoriteButtons: async () => {
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        
        for (const button of favoriteButtons) {
            const imageCard = button.closest('.image-card');
            const imageId = imageCard?.dataset.imageId;
            
            if (imageId) {
                const isFavorited = await FavoritesService.isImageFavorited(imageId);
                button.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
                
                // Add click event if not already added
                if (!button.dataset.listenerAdded) {
                    button.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await FavoritesService.toggleFavorite(imageId);
                    });
                    button.dataset.listenerAdded = 'true';
                }
            }
        }
    },

    // Update all favorite buttons in the gallery
    updateAllFavoriteButtons: async () => {
        const imageCards = document.querySelectorAll('.image-card');
        
        for (const card of imageCards) {
            const imageId = card.dataset.imageId;
            if (imageId) {
                const isFavorited = await FavoritesService.isImageFavorited(imageId);
                const favoriteBtn = card.querySelector('.favorite-btn');
                if (favoriteBtn) {
                    favoriteBtn.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';
                }
            }
        }
    }
};

// Initialize favorites service when DOM is loaded
document.addEventListener('DOMContentLoaded', FavoritesService.init);

// Export favorites service
window.FavoritesService = FavoritesService;
