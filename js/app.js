// Supabase Configuration - Replace with your actual Supabase URL and key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentImage = null;
let images = [];
let currentPage = 1;
const IMAGES_PER_PAGE = 12;

// DOM Elements
const elements = {
    // Auth elements
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userAvatar: document.getElementById('userAvatar'),
    
    // Modal elements
    authModal: document.getElementById('authModal'),
    uploadModal: document.getElementById('uploadModal'),
    imageModal: document.getElementById('imageModal'),
    closeButtons: document.querySelectorAll('.close'),
    
    // Form elements
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    uploadForm: document.getElementById('uploadForm'),
    commentForm: document.getElementById('commentForm'),
    
    // Tab elements
    tabButtons: document.querySelectorAll('.tab-btn'),
    
    // Gallery elements
    galleryGrid: document.getElementById('galleryGrid'),
    loadMore: document.getElementById('loadMore'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    categorySelect: document.getElementById('categorySelect'),
    
    // Upload elements
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    imagePreview: document.getElementById('imagePreview'),
    
    // Image modal elements
    modalImage: document.getElementById('modalImage'),
    imageTitle: document.getElementById('imageTitle'),
    imageAuthor: document.getElementById('imageAuthor'),
    imageDate: document.getElementById('imageDate'),
    ratingScore: document.getElementById('ratingScore'),
    commentsList: document.getElementById('commentsList'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    
    // Theme toggle
    themeToggle: document.getElementById('themeToggle')
};

// Initialize application
async function initApp() {
    await checkAuthState();
    await fetchImages();
    setupEventListeners();
    setupTheme();
}

// Check authentication state
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateAuthUI(true);
        await fetchUserProfile();
    } else {
        updateAuthUI(false);
    }
}

// Update authentication UI
function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        elements.authButtons.classList.add('hidden');
        elements.userMenu.classList.remove('hidden');
    } else {
        elements.authButtons.classList.remove('hidden');
        elements.userMenu.classList.add('hidden');
    }
}

// Fetch user profile
async function fetchUserProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (data && data.avatar_url) {
        elements.userAvatar.src = data.avatar_url;
    }
}

// Fetch images from Supabase
async function fetchImages() {
    try {
        let query = supabase
            .from('images')
            .select('*, profiles(username)')
            .order('created_at', { ascending: false });

        // Apply category filter
        const category = elements.categorySelect.value;
        if (category !== 'all') {
            query = query.eq('category', category);
        }

        const { data, error } = await query.range(
            (currentPage - 1) * IMAGES_PER_PAGE,
            currentPage * IMAGES_PER_PAGE - 1
        );

        if (error) throw error;

        if (currentPage === 1) {
            images = data;
        } else {
            images = [...images, ...data];
        }

        displayImages(images);
        updateLoadMoreButton(data.length === IMAGES_PER_PAGE);
    } catch (error) {
        console.error('Error fetching images:', error);
        showNotification('Error al cargar las imágenes', 'error');
    }
}

// Display images in gallery
function displayImages(imagesToDisplay) {
    if (imagesToDisplay.length === 0) {
        elements.galleryGrid.innerHTML = '<div class="loading">No se encontraron imágenes</div>';
        return;
    }

    elements.galleryGrid.innerHTML = imagesToDisplay.map(image => `
        <div class="gallery-item" data-image-id="${image.id}">
            <img src="${image.file_name}" alt="${image.title}" class="gallery-image">
            <div class="gallery-info">
                <h3 class="gallery-title">${image.title}</h3>
                <div class="gallery-meta">
                    <span>Por ${image.profiles?.username || 'Usuario'}</span>
                    <span>${formatDate(image.created_at)}</span>
                </div>
                <div class="gallery-actions">
                    <button class="btn btn-icon" onclick="viewImage('${image.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// View image details
async function viewImage(imageId) {
    try {
        const { data: image, error } = await supabase
            .from('images')
            .select('*, profiles(username)')
            .eq('id', imageId)
            .single();

        if (error) throw error;

        currentImage = image;
        
        // Update modal content
        elements.modalImage.src = image.file_name;
        elements.imageTitle.textContent = image.title;
        elements.imageAuthor.textContent = `Por ${image.profiles?.username || 'Usuario'}`;
        elements.imageDate.textContent = formatDate(image.created_at);
        
        // Fetch and display comments
        await fetchComments(imageId);
        
        // Check if image is favorited by current user
        if (currentUser) {
            await checkIfFavorited(imageId);
        }
        
        // Show modal
        elements.imageModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing image:', error);
        showNotification('Error al cargar la imagen', 'error');
    }
}

// Fetch comments for an image
async function fetchComments(imageId) {
    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*, profiles(username)')
            .eq('image_id', imageId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        elements.commentsList.innerHTML = comments.length > 0 ? 
            comments.map(comment => `
                <div class="comment">
                    <strong>${comment.profiles?.username || 'Usuario'}:</strong>
                    <p>${comment.content}</p>
                    <small>${formatDate(comment.created_at)}</small>
                </div>
            `).join('') : 
            '<p>No hay comentarios aún</p>';
    } catch (error) {
        console.error('Error fetching comments:', error);
    }
}

// Check if image is favorited by current user
async function checkIfFavorited(imageId) {
    try {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('image_id', imageId)
            .eq('user_id', currentUser.id)
            .single();

        elements.favoriteBtn.innerHTML = data ? 
            '<i class="fas fa-heart"></i>' : 
            '<i class="far fa-heart"></i>';
    } catch (error) {
        elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auth buttons
    elements.loginBtn.addEventListener('click', () => showModal(elements.authModal));
    elements.registerBtn.addEventListener('click', () => showModal(elements.authModal));
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Modal close buttons
    elements.closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });
    
    // Form submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.uploadForm.addEventListener('submit', handleUpload);
    elements.commentForm.addEventListener('submit', handleComment);
    
    // Tab switching
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Upload functionality
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Search and filters
    elements.searchInput.addEventListener('input', handleSearch);
    elements.sortSelect.addEventListener('change', () => {
        currentPage = 1;
        fetchImages();
    });
    elements.categorySelect.addEventListener('change', () => {
        currentPage = 1;
        fetchImages();
    });
    
    // Load more
    elements.loadMore.addEventListener('click', () => {
        currentPage++;
        fetchImages();
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Image actions
    elements.favoriteBtn.addEventListener('click', handleFavorite);
    elements.downloadBtn.addEventListener('click', handleDownload);
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
}

// Auth handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateAuthUI(true);
        elements.authModal.classList.add('hidden');
        showNotification('Sesión iniciada correctamente', 'success');
        await fetchUserProfile();
        fetchImages();
    } catch (error) {
        showNotification('Error al iniciar sesión: ' + error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const fullName = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) throw error;
        
        showNotification('Registro exitoso. Verifica tu email.', 'success');
        elements.authModal.classList.add('hidden');
    } catch (error) {
        showNotification('Error al registrarse: ' + error.message, 'error');
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        updateAuthUI(false);
        showNotification('Sesión cerrada', 'success');
        fetchImages();
    } catch (error) {
        showNotification('Error al cerrar sesión', 'error');
    }
}

// Upload handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecciona una imagen válida', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        elements.imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

async function handleUpload(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para subir imágenes', 'error');
        return;
    }
    
    const file = elements.fileInput.files[0];
    const title = e.target[2].value;
    const description = e.target[3].value;
    const category = elements.categorySelect.value;
    
    if (!file || !title) {
        showNotification('Por favor, completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
        
        // Insert image metadata
        const { error: insertError } = await supabase
            .from('images')
            .insert({
                user_id: currentUser.id,
                title,
                description,
                file_name: publicUrl,
                category,
                size: file.size,
                mime_type: file.type
            });
        
        if (insertError) throw insertError;
        
        // Reset form and close modal
        e.target.reset();
        elements.imagePreview.classList.add('hidden');
        elements.uploadModal.classList.add('hidden');
        showNotification('Imagen subida correctamente', 'success');
        
        // Refresh gallery
        currentPage = 1;
        await fetchImages();
    } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('Error al subir la imagen: ' + error.message, 'error');
    }
}

// Comment handler
async function handleComment(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para comentar', 'error');
        return;
    }
    
    const content = e.target[0].value.trim();
    
    if (!content) {
        showNotification('Por favor, escribe un comentario', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('comments')
            .insert({
                image_id: currentImage.id,
                user_id: currentUser.id,
                content
            });
        
        if (error) throw error;
        
        e.target.reset();
        await fetchComments(currentImage.id);
        showNotification('Comentario publicado', 'success');
    } catch (error) {
        showNotification('Error al publicar comentario', 'error');
    }
}

// Favorite handler
async function handleFavorite() {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para guardar favoritos', 'error');
        return;
    }
    
    try {
        const { data: existingFavorite } = await supabase
            .from('favorites')
            .select('*')
            .eq('image_id', currentImage.id)
            .eq('user_id', currentUser.id)
            .single();
        
        if (existingFavorite) {
            // Remove from favorites
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('image_id', currentImage.id)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            elements.favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
            showNotification('Eliminado de favoritos', 'success');
        } else {
            // Add to favorites
            const { error } = await supabase
                .from('favorites')
                .insert({
                    image_id: currentImage.id,
                    user_id: currentUser.id
                });
            
            if (error) throw error;
            
            elements.favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
            showNotification('Añadido a favoritos', 'success');
        }
    } catch (error) {
        showNotification('Error al gestionar favoritos', 'error');
    }
}

// Download handler
function handleDownload() {
    const link = document.createElement('a');
    link.href = currentImage.file_name;
    link.download = currentImage.title || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Search handler
function handleSearch() {
    const query = elements.searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        displayImages(images);
        return;
    }
    
    const filteredImages = images.filter(image => 
        image.title.toLowerCase().includes(query) ||
        image.description?.toLowerCase().includes(query) ||
        image.profiles?.username.toLowerCase().includes(query)
    );
    
    displayImages(filteredImages);
}

// Theme functionality
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    elements.themeToggle.innerHTML = theme === 'light' ? 
        '<i class="fas fa-moon"></i>' : 
        '<i class="fas fa-sun"></i>';
}

// Utility functions
function showModal(modal) {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    modal.classList.remove('hidden');
}

function switchTab(tabName) {
    // Update active tab
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Show/hide forms
    elements.loginForm.classList.toggle('hidden', tabName !== 'login');
    elements.registerForm.classList.toggle('hidden', tabName !== 'register');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateLoadMoreButton(hasMore) {
    elements.loadMore.classList.toggle('hidden', !hasMore);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 6px;
        color: white;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        notification.style.background = 'var(--accent-success)';
    } else if (type === 'error') {
        notification.style.background = 'var(--accent-danger)';
    } else {
        notification.style.background = 'var(--accent-primary)';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Global functions for HTML onclick
window.viewImage = viewImage;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
