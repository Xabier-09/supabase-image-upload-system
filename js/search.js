// Search Service
const SearchService = {
    // Initialize search service
    init: () => {
        SearchService.setupEventListeners();
        SearchService.setupSearchIndex();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Search input
        const searchInput = document.getElementById('searchInput');
        
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                SearchService.performSearch(e.target.value);
            }, 300);
        });

        // Clear search on escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                SearchService.performSearch('');
            }
        });

        // Search icon click
        document.querySelector('.search-icon').addEventListener('click', () => {
            SearchService.performSearch(searchInput.value);
        });
    },

    // Setup search index (if needed for client-side search)
    setupSearchIndex: () => {
        // This could be extended for client-side search capabilities
        // Currently using Supabase's ilike search which is server-side
    },

    // Perform search
    performSearch: (query) => {
        // Update URL with search query for shareable links
        SearchService.updateUrlParams({ search: query });
        
        // Reload gallery with search filter
        GalleryService.loadImages();
    },

    // Update URL parameters
    updateUrlParams: (params) => {
        const url = new URL(window.location);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
        });
        
        window.history.replaceState({}, '', url);
    },

    // Get current search parameters from URL
    getSearchParams: () => {
        const params = new URLSearchParams(window.location.search);
        return {
            search: params.get('search') || '',
            category: params.get('category') || 'all',
            sort: params.get('sort') || 'newest'
        };
    },

    // Apply search parameters from URL on page load
    applyUrlSearchParams: () => {
        const params = SearchService.getSearchParams();
        
        // Set search input
        const searchInput = document.getElementById('searchInput');
        searchInput.value = params.search;
        
        // Set category filter
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.value = params.category;
        }
        
        // Set sort filter
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.value = params.sort;
        }
        
        // Perform search if there are parameters
        if (params.search || params.category !== 'all' || params.sort !== 'newest') {
            SearchService.performSearch(params.search);
        }
    },

    // Advanced search with multiple criteria
    advancedSearch: async (criteria) => {
        const {
            query = '',
            category = 'all',
            minRating = 0,
            maxRating = 5,
            dateFrom = null,
            dateTo = null,
            page = 1,
            limit = 20
        } = criteria;

        try {
            let queryBuilder = supabase
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
                `);

            // Text search
            if (query) {
                queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
            }

            // Category filter
            if (category && category !== 'all') {
                queryBuilder = queryBuilder.eq('category', category);
            }

            // Rating filter (this would need a subquery or view in Supabase)
            // For now, we'll filter client-side after fetching

            // Date range filter
            if (dateFrom) {
                queryBuilder = queryBuilder.gte('created_at', dateFrom);
            }
            if (dateTo) {
                queryBuilder = queryBuilder.lte('created_at', dateTo);
            }

            // Sorting
            switch (criteria.sort || 'newest') {
                case 'newest':
                    queryBuilder = queryBuilder.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    queryBuilder = queryBuilder.order('created_at', { ascending: true });
                    break;
                case 'popular':
                    // This would need a favorites count or view
                    queryBuilder = queryBuilder.order('created_at', { ascending: false });
                    break;
                case 'rating':
                    // This would need a average rating calculation
                    queryBuilder = queryBuilder.order('created_at', { ascending: false });
                    break;
            }

            // Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            queryBuilder = queryBuilder.range(from, to);

            const { data: images, error } = await queryBuilder;

            if (error) {
                throw error;
            }

            // Client-side rating filter (temporary solution)
            let filteredImages = images;
            if (minRating > 0 || maxRating < 5) {
                filteredImages = images.filter(image => {
                    const avgRating = GalleryService.calculateAverageRating(image.ratings);
                    return avgRating >= minRating && avgRating <= maxRating;
                });
            }

            return filteredImages;

        } catch (error) {
            console.error('Error performing advanced search:', error);
            return [];
        }
    },

    // Show search suggestions
    showSearchSuggestions: async (query) => {
        if (query.length < 2) {
            SearchService.hideSearchSuggestions();
            return;
        }

        try {
            // Get search suggestions from recent searches or popular terms
            const suggestions = await SearchService.getSearchSuggestions(query);
            SearchService.displaySearchSuggestions(suggestions);
        } catch (error) {
            console.error('Error getting search suggestions:', error);
        }
    },

    // Get search suggestions
    getSearchSuggestions: async (query) => {
        // This could be implemented with a dedicated search suggestions table
        // or by querying existing image titles and categories
        
        try {
            const { data: titles, error } = await supabase
                .from('images')
                .select('title')
                .ilike('title', `%${query}%`)
                .limit(5);

            if (error) {
                throw error;
            }

            const { data: categories } = await supabase
                .from('images')
                .select('category')
                .ilike('category', `%${query}%`)
                .limit(5);

            // Combine and deduplicate suggestions
            const suggestions = [
                ...new Set([
                    ...titles.map(t => t.title),
                    ...categories.map(c => c.category)
                ])
            ].slice(0, 8);

            return suggestions;

        } catch (error) {
            console.error('Error getting search suggestions:', error);
            return [];
        }
    },

    // Display search suggestions
    displaySearchSuggestions: (suggestions) => {
        // Create or update suggestions dropdown
        let suggestionsDropdown = document.getElementById('searchSuggestions');
        
        if (!suggestionsDropdown) {
            suggestionsDropdown = document.createElement('div');
            suggestionsDropdown.id = 'searchSuggestions';
            suggestionsDropdown.className = 'search-suggestions';
            document.querySelector('.search-container').appendChild(suggestionsDropdown);
        }

        if (suggestions.length === 0) {
            suggestionsDropdown.innerHTML = '<div class="no-suggestions">No se encontraron sugerencias</div>';
            return;
        }

        suggestionsDropdown.innerHTML = suggestions
            .map(suggestion => `<div class="suggestion">${suggestion}</div>`)
            .join('');

        // Add click handlers
        suggestionsDropdown.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                document.getElementById('searchInput').value = suggestion.textContent;
                SearchService.performSearch(suggestion.textContent);
                SearchService.hideSearchSuggestions();
            });
        });
    },

    // Hide search suggestions
    hideSearchSuggestions: () => {
        const suggestionsDropdown = document.getElementById('searchSuggestions');
        if (suggestionsDropdown) {
            suggestionsDropdown.remove();
        }
    },

    // Clear search
    clearSearch: () => {
        document.getElementById('searchInput').value = '';
        SearchService.performSearch('');
        SearchService.hideSearchSuggestions();
    }
};

// Initialize search service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    SearchService.init();
    SearchService.applyUrlSearchParams();
});

// Export search service
window.SearchService = SearchService;
