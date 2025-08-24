// Main Application
const App = {
    // Initialize the application
    init: async () => {
        try {
            // Initialize all services
            await AuthService.init();
            await GalleryService.init();
            CommentsService.init();
            FavoritesService.init();
            SearchService.init();
            
            // Setup theme toggle
            App.setupThemeToggle();
            
            // Setup additional event listeners
            App.setupGlobalEventListeners();
            
            // Check if user is logged in and update UI accordingly
            await App.checkAuthState();
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            App.showError('Error al inicializar la aplicación');
        }
    },

    // Setup theme toggle functionality
    setupThemeToggle: () => {
        const themeToggle = document.getElementById('themeToggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Load saved theme or use system preference
        const savedTheme = localStorage.getItem('theme');
        const currentTheme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.querySelector('i').className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Toggle theme on button click
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            themeToggle.querySelector('i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    },

    // Setup global event listeners
    setupGlobalEventListeners: () => {
        // Close modals with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                App.closeAllModals();
            }
        });

        // Handle auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                AuthService.handleUserLoggedIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                AuthService.handleUserLoggedOut();
            }
        });

        // Responsive design adjustments
        window.addEventListener('resize', App.handleResize);
    },

    // Check authentication state
    checkAuthState: async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                AuthService.handleUserLoggedIn(user);
            } else {
                AuthService.handleUserLoggedOut();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    },

    // Close all modals
    closeAllModals: () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    },

    // Handle window resize for responsive design
    handleResize: () => {
        // Adjust gallery grid columns based on window size
        const galleryGrid = document.getElementById('galleryGrid');
        if (galleryGrid) {
            const width = window.innerWidth;
            let columns;
            
            if (width < 600) {
                columns = 2;
            } else if (width < 900) {
                columns = 3;
            } else if (width < 1200) {
                columns = 4;
            } else {
                columns = 5;
            }
            
            galleryGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${Math.floor(100/columns)}%, 1fr))`;
        }
    },

    // Show error message
    showError: (message) => {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    },

    // Show success message
    showSuccess: (message) => {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Get query parameter from URL
    getQueryParam: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // Set query parameter in URL
    setQueryParam: (name, value) => {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.replaceState({}, '', url);
    },

    // Debounce function for performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for performance
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate password strength
    isStrongPassword: (password) => {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    },

    // Get user's location (if permitted)
    getUserLocation: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    },

    // Share content
    shareContent: async (title, text, url) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url || window.location.href
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url || window.location.href);
                App.showSuccess('Enlace copiado al portapapeles');
            } catch (error) {
                console.log('Error copying to clipboard:', error);
            }
        }
    },

    // Export data (for user data export functionality)
    exportData: (data, filename, type = 'application/json') => {
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Import data
    importData: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid file format'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    },

    // Check if user is online
    isOnline: () => {
        return navigator.onLine;
    },

    // Setup offline/online detection
    setupConnectivityDetection: () => {
        window.addEventListener('online', () => {
            App.showSuccess('Conexión restaurada');
            // Sync any pending operations
            App.syncPendingOperations();
        });

        window.addEventListener('offline', () => {
            App.showError('Sin conexión a internet');
        });
    },

    // Sync pending operations when coming back online
    syncPendingOperations: () => {
        // This would sync any operations that were queued while offline
        console.log('Syncing pending operations...');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);

// Export app for global access
window.App = App;
