// Rating Service
const RatingService = {
    // Initialize rating service
    init: () => {
        RatingService.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Star rating click handlers are set up dynamically in GalleryService
    },

    // Add rating to an image
    addRating: async (imageId, rating) => {
        try {
            // Check if user is authenticated
            const user = await AuthService.getCurrentUserData();
            if (!user) {
                AuthService.showError('Debes iniciar sesión para calificar imágenes');
                AuthService.showAuthModal('login');
                return;
            }

            const { data, error } = await SupabaseService.addRating(imageId, rating);
            
            if (error) {
                throw error;
            }

            // Update UI with new rating
            await RatingService.updateRatingUI(imageId);
            
            AuthService.showSuccess('Calificación enviada');

        } catch (error) {
            AuthService.showError('Error al enviar calificación: ' + error.message);
        }
    },

    // Update rating UI for an image
    updateRatingUI: async (imageId) => {
        try {
            // Get updated image data with ratings
            const { data: image, error } = await supabase
                .from('images')
                .select(`
                    *,
                    ratings (
                        rating,
                        user_id
                    )
                `)
                .eq('id', imageId)
                .single();

            if (error) {
                throw error;
            }

            // Calculate average rating
            const averageRating = GalleryService.calculateAverageRating(image.ratings);
            
            // Update modal rating display
            const modal = document.getElementById('imageModal');
            if (!modal.classList.contains('hidden')) {
                const ratingScore = document.getElementById('ratingScore');
                if (ratingScore) {
                    ratingScore.textContent = averageRating.toFixed(1);
                }
                
                // Update stars
                GalleryService.updateStars(averageRating);
            }

            // Update gallery card ratings
            const ratingElements = document.querySelectorAll(`.image-card[data-image-id="${imageId}"] .rating span`);
            ratingElements.forEach(element => {
                element.textContent = averageRating.toFixed(1);
            });

            // Update rating count if displayed
            await RatingService.updateRatingCount(imageId);

        } catch (error) {
            console.error('Error updating rating UI:', error);
        }
    },

    // Get rating count for an image
    getRatingCount: async (imageId) => {
        try {
            const { count, error } = await supabase
                .from('ratings')
                .select('*', { count: 'exact' })
                .eq('image_id', imageId);

            if (error) {
                throw error;
            }

            return count;
        } catch (error) {
            console.error('Error getting rating count:', error);
            return 0;
        }
    },

    // Update rating count display
    updateRatingCount: async (imageId) => {
        const count = await RatingService.getRatingCount(imageId);
        
        // Update modal if open
        const modal = document.getElementById('imageModal');
        if (!modal.classList.contains('hidden')) {
            const ratingCountElement = document.getElementById('ratingCount');
            if (ratingCountElement) {
                ratingCountElement.textContent = count + (count === 1 ? ' calificación' : ' calificaciones');
            }
        }

        // Update gallery cards
        const ratingCountElements = document.querySelectorAll(`.image-card[data-image-id="${imageId}"] .rating-count`);
        ratingCountElements.forEach(element => {
            element.textContent = count;
        });
    },

    // Get user's rating for an image
    getUserRating: async (imageId) => {
        try {
            const user = await AuthService.getCurrentUserData();
            if (!user) return null;

            const { data: rating, error } = await supabase
                .from('ratings')
                .select('rating')
                .eq('image_id', imageId)
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
                throw error;
            }

            return rating ? rating.rating : null;

        } catch (error) {
            console.error('Error getting user rating:', error);
            return null;
        }
    },

    // Update stars based on user's rating
    updateUserRatingStars: async (imageId) => {
        try {
            const userRating = await RatingService.getUserRating(imageId);
            
            if (userRating !== null) {
                const stars = document.querySelectorAll('.stars i');
                stars.forEach((star, index) => {
                    const starRating = index + 1;
                    if (starRating <= userRating) {
                        star.className = 'fas fa-star';
                    } else {
                        star.className = 'far fa-star';
                    }
                });
            }

        } catch (error) {
            console.error('Error updating user rating stars:', error);
        }
    },

    // Calculate average rating from ratings array
    calculateAverageRating: (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
        return sum / ratings.length;
    },

    // Get rating distribution for an image
    getRatingDistribution: async (imageId) => {
        try {
            const { data: ratings, error } = await supabase
                .from('ratings')
                .select('rating')
                .eq('image_id', imageId);

            if (error) {
                throw error;
            }

            const distribution = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };

            ratings.forEach(rating => {
                distribution[rating.rating]++;
            });

            return distribution;

        } catch (error) {
            console.error('Error getting rating distribution:', error);
            return null;
        }
    },

    // Display rating distribution chart
    displayRatingDistribution: async (imageId) => {
        try {
            const distribution = await RatingService.getRatingDistribution(imageId);
            if (!distribution) return;

            // This would create a visual chart of the rating distribution
            // Implementation would depend on charting library used
            console.log('Rating distribution:', distribution);

        } catch (error) {
            console.error('Error displaying rating distribution:', error);
        }
    },

    // Check if user has rated an image
    hasUserRated: async (imageId) => {
        try {
            const user = await AuthService.getCurrentUserData();
            if (!user) return false;

            const { data, error } = await supabase
                .from('ratings')
                .select()
                .eq('image_id', imageId)
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return !!data;

        } catch (error) {
            console.error('Error checking if user has rated:', error);
            return false;
        }
    }
};

// Initialize rating service when DOM is loaded
document.addEventListener('DOMContentLoaded', RatingService.init);

// Export rating service
window.RatingService = RatingService;
