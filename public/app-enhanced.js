import { authManager } from './auth.js';
import { galleryManager } from './gallery.js';
import { componentManager } from './components.js';
import { showNotification, debounce } from './utils.js';

class ImageGalleryApp {
  constructor() {
    this.isInitialized = false;
    this.currentView = 'gallery';
    this.init();
  }

  async init() {
    try {
      // Initialize auth manager
      await authManager.init();
      authManager.setupAuthListener();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Render initial UI
      this.renderUI();
      
      // Load initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      showNotification('Error al inicializar la aplicación', 'error');
    }
  }

  setupEventListeners() {
    // Auth state changes
    authManager.addAuthListener((user) => {
      this.renderAuthUI(user);
      this.renderUploadSection(user);
    });

    // Gallery refresh events
    window.addEventListener('galleryRefresh', () => {
      this.loadGallery();
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.loadGallery(1, { search: e.target.value });
      }, 300));
    }

    // Sort functionality
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.loadGallery(1, { sort: e.target.value });
      });
    }

    // Infinite scroll
    window.addEventListener('scroll', debounce(() => {
      this.handleInfiniteScroll();
    }, 100));

    // Global click handlers
    document.addEventListener('click', (e) => {
      this.handleGlobalClick(e);
    });
  }

  async loadInitialData() {
    try {
      await this.loadGallery();
      await this.loadCategories();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async loadGallery(page = 1, filters = {}) {
    try {
      const gallery = document.getElementById('gallery');
      if (page === 1) {
        gallery.innerHTML = '<div class="loading-spinner"></div>';
      }

      const images = await galleryManager.loadImages(page, filters);
      
      if (page === 1) {
        gallery.innerHTML = '';
      }

      if (images.length === 0 && page === 1) {
        gallery.innerHTML = `
          <div class="text-center text-muted">
            <p>No hay imágenes todavía</p>
            ${authManager.currentUser ? 
              '<p>¡Sé el primero en subir una imagen!</p>' : 
              '<p>Inicia sesión para subir imágenes</p>'}
          </div>
        `;
        return;
      }

      images.forEach(image => {
        const card = document.createElement('div');
        card.innerHTML = componentManager.imageCard(image);
        gallery.appendChild(card.firstElementChild);
      });

    } catch (error) {
      console.error('Error loading gallery:', error);
      showNotification('Error al cargar la galería', 'error');
    }
  }

  async loadCategories() {
    try {
      const categories = await galleryManager.getCategories();
      // Store categories for later use
      this.categories = categories;
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  handleInfiniteScroll() {
    if (this.isLoading || !galleryManager.hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isAtBottom) {
      this.loadGallery(galleryManager.currentPage + 1, galleryManager.filters);
    }
  }

  handleGlobalClick(e) {
    // Open auth modal
    if (e.target.matches('.auth-btn') || e.target.closest('.auth-btn')) {
      e.preventDefault();
      this.openAuthModal();
    }

    // Open profile modal
    if (e.target.matches('.profile-btn') || e.target.closest('.profile-btn')) {
      e.preventDefault();
      this.openProfileModal();
    }

    // Close modals
    if (e.target.matches('.close-modal') || e.target.matches('.modal-backdrop')) {
      componentManager.hideModal();
    }

    // Logout
    if (e.target.matches('.logout-btn') || e.target.closest('.logout-btn')) {
      e.preventDefault();
      authManager.logout();
    }
  }

  openAuthModal() {
    componentManager.showModal(componentManager.authModal());
  }

  openProfileModal() {
    if (!authManager.currentUser) {
      this.openAuthModal();
      return;
    }
    componentManager.showModal(componentManager.profileModal());
  }

  renderUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <header class="topbar">
        <h1 class="brand">🎨 Galería de Imágenes</h1>
        <div class="auth-area" id="auth-area"></div>
      </header>

      <main>
        <section id="upload-section" class="hidden"></section>
        
        <section class="filters">
          <div class="card">
            <div class="flex items-center justify-between gap-4">
              <input 
                type="text" 
                id="search-input" 
                placeholder="Buscar imágenes..." 
                class="form-input"
              />
              <select id="sort-select" class="form-input">
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="rating">Mejor valoradas</option>
                <option value="popular">Más populares</option>
              </select>
            </div>
          </div>
        </section>

        <section id="gallery" class="gallery-grid"></section>
      </main>

      <div id="global-modal" class="modal"></div>
    `;

    // Re-attach event listeners after render
    this.setupEventListeners();
  }

  renderAuthUI(user) {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;

    if (!user) {
      authArea.innerHTML = `
        <button class="btn auth-btn">Iniciar sesión</button>
      `;
    } else {
      authArea.innerHTML = `
        <div class="flex items-center gap-4">
          <span>Hola, ${user.email}</span>
          <button class="btn outline profile-btn">Perfil</button>
          <button class="btn logout-btn">Cerrar sesión</button>
        </div>
      `;
    }
  }

  renderUploadSection(user) {
    const uploadSection = document.getElementById('upload-section');
    if (!uploadSection) return;

    if (user) {
      uploadSection.classList.remove('hidden');
      uploadSection.innerHTML = componentManager.uploadForm();
    } else {
      uploadSection.classList.add('hidden');
      uploadSection.innerHTML = '';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ImageGalleryApp();
});

// Export for potential debugging
window.ImageGalleryApp = ImageGalleryApp;
