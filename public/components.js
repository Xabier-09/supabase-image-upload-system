import { authManager } from './auth.js';
import { galleryManager } from './gallery.js';
import { showNotification, formatDate, compressImage, validateFile } from './utils.js';

export class ComponentManager {
  constructor() {
    this.components = new Map();
  }

  registerComponent(name, component) {
    this.components.set(name, component);
  }

  getComponent(name) {
    return this.components.get(name);
  }

  renderComponent(name, container, data = {}) {
    const component = this.getComponent(name);
    if (component) {
      container.innerHTML = component(data);
      this.attachEventListeners(name, container);
    }
  }

  attachEventListeners(name, container) {
    switch (name) {
      case 'authModal':
        this.attachAuthModalListeners(container);
        break;
      case 'uploadForm':
        this.attachUploadFormListeners(container);
        break;
      case 'imageCard':
        this.attachImageCardListeners(container);
        break;
      case 'profileModal':
        this.attachProfileModalListeners(container);
        break;
    }
  }

  // Component Templates
  authModal() {
    return `
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modal-title">Iniciar sesión</h3>
          <button class="icon-btn close-modal">✕</button>
        </div>

        <div class="tabs">
          <button class="tab active" data-tab="login">Entrar</button>
          <button class="tab" data-tab="register">Registrar</button>
        </div>

        <form class="auth-form">
          <input type="email" placeholder="Correo electrónico" required />
          <input type="password" placeholder="Contraseña (6+ car.)" required minlength="6" />
          <div class="auth-feedback"></div>
          <button type="submit" class="btn block">Continuar</button>
        </form>
      </div>
    `;
  }

  uploadForm() {
    return `
      <div class="card">
        <h2>Subir imagen</h2>
        <form class="upload-form">
          <input type="text" placeholder="Título (opcional)" class="title-input" />
          <input type="file" accept="image/*" class="file-input" />
          <div class="category-selector">
            <label>Categorías:</label>
            <div class="categories-list"></div>
          </div>
          <button type="submit" class="btn">Subir</button>
        </form>
      </div>
    `;
  }

  imageCard(image) {
    const isOwner = authManager.currentUser && authManager.currentUser.id === image.owner;
    const imageUrl = supabase.storage.from('images').getPublicUrl(image.storage_path).publicUrl;
    
    return `
      <div class="item card" data-image-id="${image.id}">
        <img src="${imageUrl}" alt="${image.title || image.filename}" />
        <div class="meta">
          <div class="title">${image.title || image.filename}</div>
          <div class="small">Subido: ${formatDate(image.created_at)}</div>
          <div class="small">Dueño: ${image.owner}</div>
          <div class="stats">
            <span>⭐ ${image.avg_rating || 0}</span>
            <span>💬 ${image.comment_count || 0}</span>
            <span>❤️ ${image.favorite_count || 0}</span>
          </div>
        </div>
        
        <div class="controls">
          ${isOwner ? `
            <button class="btn small delete-btn">Eliminar</button>
          ` : ''}
          
          <div class="rating">
            ${[1,2,3,4,5].map(star => `
              <span class="star" data-rating="${star}">★</span>
            `).join('')}
          </div>
          
          <button class="btn small favorite-btn" data-favorited="${image.is_favorited || false}">
            ${image.is_favorited ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    `;
  }

  profileModal() {
    const user = authManager.currentUser;
    return `
      <div class="modal-card">
        <div class="modal-header">
          <h3>Mi Perfil</h3>
          <button class="icon-btn close-modal">✕</button>
        </div>
        
        <div class="profile-content">
          <div class="avatar-section">
            <img src="${user?.user_metadata?.avatar_url || '/default-avatar.png'}" 
                 class="avatar-large" />
            <input type="file" accept="image/*" class="avatar-input" />
          </div>
          
          <form class="profile-form">
            <input type="text" placeholder="Nombre de display" 
                   value="${user?.user_metadata?.display_name || user?.email}" />
            <textarea placeholder="Biografía"></textarea>
            <input type="text" placeholder="Sitio web" />
            <input type="text" placeholder="Ubicación" />
            <button type="submit" class="btn">Guardar</button>
          </form>
        </div>
      </div>
    `;
  }

  // Event Listeners
  attachAuthModalListeners(container) {
    // Tab switching
    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        container.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        
        const title = container.querySelector('#modal-title');
        title.textContent = tabName === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
      });
    });

    // Form submission
    container.querySelector('.auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;
      const isLogin = container.querySelector('[data-tab="login"]').classList.contains('active');

      try {
        if (isLogin) {
          await authManager.login(email, password);
        } else {
          await authManager.register(email, password);
        }
        this.hideModal();
      } catch (error) {
        // Error handled in authManager
      }
    });

    // Close modal
    container.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
  }

  attachUploadFormListeners(container) {
    container.querySelector('.upload-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const fileInput = form.querySelector('.file-input');
      const titleInput = form.querySelector('.title-input');
      
      if (!fileInput.files[0]) {
        showNotification('Selecciona una imagen', 'error');
        return;
      }

      try {
        validateFile(fileInput.files[0]);
        const compressedFile = await compressImage(fileInput.files[0]);
        
        await galleryManager.uploadImage(
          compressedFile,
          titleInput.value.trim(),
          [] // categories would be implemented here
        );

        form.reset();
        // Refresh gallery
        window.dispatchEvent(new CustomEvent('galleryRefresh'));
      } catch (error) {
        showNotification(error.message, 'error');
      }
    });
  }

  attachImageCardListeners(container) {
    const imageId = container.dataset.imageId;
    
    // Rating stars
    container.querySelectorAll('.star').forEach(star => {
      star.addEventListener('click', async () => {
        if (!authManager.currentUser) {
          showNotification('Inicia sesión para calificar', 'error');
          return;
        }
        
        const rating = parseInt(star.dataset.rating);
        try {
          await galleryManager.rateImage(imageId, rating);
          // Refresh this card
          window.dispatchEvent(new CustomEvent('galleryRefresh'));
        } catch (error) {
          showNotification(error.message, 'error');
        }
      });
    });

    // Favorite button
    container.querySelector('.favorite-btn').addEventListener('click', async () => {
      if (!authManager.currentUser) {
        showNotification('Inicia sesión para agregar favoritos', 'error');
        return;
      }
      
      try {
        await galleryManager.toggleFavorite(imageId);
        // Refresh this card
        window.dispatchEvent(new CustomEvent('galleryRefresh'));
      } catch (error) {
        showNotification(error.message, 'error');
      }
    });

    // Delete button (if owner)
    const deleteBtn = container.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
          try {
            await galleryManager.deleteImage(imageId, container.querySelector('img').src);
            container.remove();
          } catch (error) {
            showNotification(error.message, 'error');
          }
        }
      });
    }
  }

  attachProfileModalListeners(container) {
    // Close modal
    container.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
    
    // Avatar upload
    container.querySelector('.avatar-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          validateFile(file);
          const compressedFile = await compressImage(file, 200, 200);
          await authManager.uploadAvatar(compressedFile);
          // Refresh avatar display
          container.querySelector('.avatar-large').src = URL.createObjectURL(compressedFile);
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });

    // Profile form submission
    container.querySelector('.profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updates = {
        display_name: formData.get('display_name'),
        bio: formData.get('bio'),
        website: formData.get('website'),
        location: formData.get('location')
      };

      try {
        await authManager.updateProfile(updates);
        this.hideModal();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    });
  }

  showModal(content) {
    let modal = document.getElementById('global-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-modal';
      modal.className = 'modal';
      modal.innerHTML = '<div class="modal-backdrop"></div>';
      document.body.appendChild(modal);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'modal-content';
    contentDiv.innerHTML = content;
    modal.appendChild(contentDiv);
    
    modal.classList.remove('hidden');
  }

  hideModal() {
    const modal = document.getElementById('global-modal');
    if (modal) {
      modal.classList.add('hidden');
      setTimeout(() => {
        if (modal) modal.remove();
      }, 300);
    }
  }
}

export const componentManager = new ComponentManager();

// Register all components
componentManager.registerComponent('authModal', componentManager.authModal);
componentManager.registerComponent('uploadForm', componentManager.uploadForm);
componentManager.registerComponent('imageCard', componentManager.imageCard);
componentManager.registerComponent('profileModal', componentManager.profileModal);
