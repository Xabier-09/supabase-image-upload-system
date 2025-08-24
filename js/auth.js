// Authentication Service
const AuthService = {
    // Initialize auth state
    init: async () => {
        await AuthService.checkAuthState();
        AuthService.setupEventListeners();
    },

    // Check current auth state
    checkAuthState: async () => {
        const { data: { user } } = await SupabaseService.getCurrentUser();
        if (user) {
            AuthService.handleUserLoggedIn(user);
        } else {
            AuthService.handleUserLoggedOut();
        }
    },

    // Setup event listeners for auth buttons
    setupEventListeners: () => {
        // Login/Register buttons
document.getElementById('loginBtn').addEventListener('click', () => {
    console.log('Login button clicked');
    AuthService.showAuthModal('login');
});

        document.getElementById('registerBtn').addEventListener('click', () => {
            AuthService.showAuthModal('register');
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', AuthService.logout);

        // Auth forms submission
        document.getElementById('loginForm').addEventListener('submit', AuthService.handleLogin);
        document.getElementById('registerForm').addEventListener('submit', AuthService.handleRegister);

        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', AuthService.hideModals);
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                AuthService.hideModals();
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                AuthService.switchAuthTab(tab);
            });
        });
    },

    // Show auth modal with specific tab
    showAuthModal: (tab = 'login') => {
        const modal = document.getElementById('authModal');
        modal.classList.remove('hidden');
        AuthService.switchAuthTab(tab);
    },

    // Hide all modals
    hideModals: () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    },

    // Switch between login and register tabs
    switchAuthTab: (tab) => {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            }
        });

        // Show/hide forms
        document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
        document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    },

    // Handle login form submission
    handleLogin: async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        const { data, error } = await SupabaseService.signIn(email, password);

        if (error) {
            AuthService.showError('Error al iniciar sesión: ' + error.message);
            return;
        }

        AuthService.handleUserLoggedIn(data.user);
        AuthService.hideModals();
        form.reset();
    },

    // Handle register form submission
    handleRegister: async (e) => {
        e.preventDefault();
        const form = e.target;
        const fullName = form.querySelector('input[type="text"]').value;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;

        // Validate email and password
        if (!email || !password || !fullName) {
            AuthService.showError('Por favor, completa todos los campos.');
            return;
        }

        const { data, error } = await SupabaseService.signUp(email, password, fullName);

        if (error) {
            AuthService.showError('Error al registrarse: ' + error.message);
            return;
        }

        AuthService.showSuccess('¡Registro exitoso! Por favor verifica tu email.');
        AuthService.switchAuthTab('login');
        form.reset();
    },

    // Handle user logout
    logout: async () => {
        const { error } = await SupabaseService.signOut();
        if (error) {
            AuthService.showError('Error al cerrar sesión: ' + error.message);
            return;
        }

        AuthService.handleUserLoggedOut();
    },

    // Handle user logged in state
    handleUserLoggedIn: (user) => {
        // Hide auth buttons, show user menu
        document.getElementById('authButtons').classList.add('hidden');
        document.getElementById('userMenu').classList.remove('hidden');

        // Update user avatar if available
        const userAvatar = document.getElementById('userAvatar');
        if (user.user_metadata?.avatar_url) {
            userAvatar.src = user.user_metadata.avatar_url;
        } else {
            userAvatar.src = 'https://via.placeholder.com/40x40/007bff/ffffff?text=' + 
                            (user.user_metadata?.full_name?.[0] || user.email[0]).toUpperCase();
        }

        // Enable upload functionality
        document.getElementById('uploadBtn').disabled = false;

        // Update UI state
        AuthService.updateUIForLoggedInUser();
    },

    // Handle user logged out state
    handleUserLoggedOut: () => {
        // Show auth buttons, hide user menu
        document.getElementById('authButtons').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');

        // Disable upload functionality
        document.getElementById('uploadBtn').disabled = true;

        // Update UI state
        AuthService.updateUIForLoggedOutUser();
    },

    // Update UI for logged in user
    updateUIForLoggedInUser: () => {
        // Enable interactive features
        const interactiveElements = document.querySelectorAll('[data-requires-auth]');
        interactiveElements.forEach(el => {
            el.disabled = false;
            el.style.opacity = '1';
        });
    },

    // Update UI for logged out user
    updateUIForLoggedOutUser: () => {
        // Disable interactive features
        const interactiveElements = document.querySelectorAll('[data-requires-auth]');
        interactiveElements.forEach(el => {
            el.disabled = true;
            el.style.opacity = '0.5';
        });
    },

    // Show error message
    showError: (message) => {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Show success message
    showSuccess: (message) => {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Get current user data
    getCurrentUserData: async () => {
        const { data: { user } } = await SupabaseService.getCurrentUser();
        return user;
    }
};

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', AuthService.init);

// Export auth service
window.AuthService = AuthService;
