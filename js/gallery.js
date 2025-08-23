// Gallery Service
const GalleryService = {
    // Initialize gallery
    init: async () => {
        GalleryService.setupEventListeners();
        await GalleryService.loadImages();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', GalleryService.showUploadModal);

        // Upload form submission
        document.getElementById('uploadForm').addEventListener('submit', GalleryService.handleUpload);

        // File input handling
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                GalleryService.handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                GalleryService.handleFileSelect(e.target.files[0]);
            }
        });

        // Filter changes
        document.getElementById('sortSelect').addEventListener('change', () => {
            GalleryService.loadImages();
        });

        document.getElementById('categorySelect').addEventListener('change', () => {
            GalleryService.loadImages();
        });

        // Load more button
        document.getElementById('loadMore').addEventListener('click', GalleryService.loadMoreImages);
    },

    // Load images with current filters
    loadImages: async (page = 1) => {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '<div class="loading">Cargando imágenes...</div>';

        const sortBy = document.getElementById('sortSelect').value;
        const category = document.getElementById('categorySelect').value;
        const search = document.getElementById('searchInput').value;

        const filters = {
            category: category,
            search: search
        };

        const { data: images, error } = await SupabaseService.getImages(page, 20, filters);

        if (error) {
            galleryGrid.innerHTML = '<div class="error">Error al cargar imágenes: ' + error.message + '</div>';
            return;
        }

        if (images.length === 0) {
            galleryGrid.innerHTML = '<div class="no-images">No se encontraron imágenes</div>';
            return;
        }

        GalleryService.displayImages(images);
        GalleryService.updateLoadMoreButton(images.length);
    },

    // Display images in gallery
    displayImages: (images) => {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (galleryGrid.querySelector('.loading') || galleryGrid.querySelector('.no-images')) {
            galleryGrid.innerHTML = '';
        }

        images.forEach(image => {
            const imageCard = GalleryService.createImageCard(image);
            galleryGrid.appendChild(imageCard);
        });
    },

    // Create image card element
    createImageCard: (image) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.imageId = image.id;

        const imageUrl = SupabaseService.getImageUrl(image.file_name);
        const averageRating = GalleryService.calculateAverageRating(image.ratings);

        card.innerHTML = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${image.title}" loading="lazy">
                <div class="image-overlay">
                    <div class="image-actions">
                        <button class="btn btn-icon favorite-btn" data-requires-auth>
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="btn btn-icon view-btn">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="image-info">
                <h4>${image.title}</h4>
                <div class="image-meta">
                    <span class="author">Por ${image.user?.full_name || image.user?.email}</span>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${averageRating.toFixed(1)}</span>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const viewBtn = card.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => {
            GalleryService.showImageDetail(image);
        });

        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await FavoritesService.toggleFavorite(image.id);
        });

        return card;
    },

    // Calculate average rating
    calculateAverageRating: (ratings) => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
        return sum / ratings.length;
    },

    // Show image detail modal
    showImageDetail: async (image) => {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const imageTitle = document.getElementById('imageTitle');
        const imageAuthor = document.getElementById('imageAuthor');
        const imageDate = document.getElementById('imageDate');
        const ratingScore = document.getElementById('ratingScore');

        // Set image data
        const imageUrl = SupabaseService.getImageUrl(image.file_name);
        modalImage.src = imageUrl;
        imageTitle.textContent = image.title;
        imageAuthor.textContent = `Por ${image.user?.full_name || image.user?.email}`;
        imageDate.textContent = new Date(image.created_at).toLocaleDateString();
        
        const averageRating = GalleryService.calculateAverageRating(image.ratings);
        ratingScore.textContent = averageRating.toFixed(1);

        // Update stars
        GalleryService.updateStars(averageRating);

        // Load comments
        CommentsService.loadComments(image.id);

        // Check if favorited
        const isFavorited = await SupabaseService.isFavorited(image.id);
        const favoriteBtn = document.getElementById('favoriteBtn');
        favoriteBtn.querySelector('i').className = isFavorited ? 'fas fa-heart' : 'far fa-heart';

        // Add event listeners
        favoriteBtn.onclick = () => FavoritesService.toggleFavorite(image.id);
        
        const stars = document.querySelectorAll('.stars i');
        stars.forEach(star => {
            star.onclick = () => RatingService.addRating(image.id, parseInt(star.dataset.rating));
        });

        // Show modal
        modal.classList.remove('hidden');
    },

    // Update stars display
    updateStars: (rating) => {
        const stars = document.querySelectorAll('.stars i');
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= Math.floor(rating)) {
                star.className = 'fas fa-star';
            } else if (starRating === Math.ceil(rating) && rating % 1 !== 0) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
        });
    },

    // Show upload modal
    showUploadModal: () => {
        const modal = document.getElementById('uploadModal');
        modal.classList.remove('hidden');
    },

    // Handle file selection
    handleFileSelect: (file) => {
        if (!file.type.startsWith('image/')) {
            AuthService.showError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            AuthService.showError('La imagen no puede ser mayor a 5MB');
            return;
        }

        // Show preview
        const preview = document.getElementById('imagePreview');
        preview.classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Vista previa">
                <p>${file.name} (${GalleryService.formatFileSize(file.size)})</p>
            `;
        };
        reader.readAsDataURL(file);
    },

    // Format file size
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Handle upload form submission
    handleUpload: async (e) => {
        e.preventDefault();
        const form = e.target;
        const fileInput = document.getElementById('fileInput');
        const titleInput = form.querySelector('input[type="text"]');
        const descriptionInput = form.querySelector('textarea');

        if (!fileInput.files.length) {
            AuthService.showError('Por favor selecciona una imagen');
            return;
        }

        const file = fileInput.files[0];
        const title = titleInput.value;
        const description = descriptionInput.value;

        try {
            // Compress image if needed
            const compressedFile = await GalleryService.compressImage(file);
            
            // Generate unique filename
            const fileName = `${Date.now()}_${compressedFile.name}`;
            
            // Upload to Supabase storage
            const { error: uploadError } = await SupabaseService.uploadImage(compressedFile, fileName);
            
            if (uploadError) {
                throw new Error(uploadError.message);
            }

            // Get current user
            const user = await AuthService.getCurrentUserData();
            
            // Insert metadata
            const imageData = {
                title: title,
                description: description,
                file_name: fileName,
                user_id: user.id,
                category: document.getElementById('categorySelect').value,
                size: compressedFile.size,
                mime_type: compressedFile.type
            };

            const { error: insertError } = await SupabaseService.insertImageMetadata(imageData);
            
            if (insertError) {
                throw new Error(insertError.message);
            }

            AuthService.showSuccess('Imagen subida exitosamente');
            GalleryService.hideModals();
            form.reset();
            document.getElementById('imagePreview').classList.add('hidden');
            
            // Reload gallery
            await GalleryService.loadImages();
            
        } catch (error) {
            AuthService.showError('Error al subir imagen: ' + error.message);
        }
    },

    // Compress image
    compressImage: async (file) => {
        return new Promise((resolve) => {
            if (file.size <= 2 * 1024 * 1024) { // 2MB threshold
                resolve(file);
                return;
            }

            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.src = e.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions (max 1200px on longest side)
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > 1200) {
                            height = Math.round((height * 1200) / width);
                            width = 1200;
                        }
                    } else {
                        if (height > 1200) {
                            width = Math.round((width * 1200) / height);
                            height = 1200;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.8);
                };
            };
            
            reader.readAsDataURL(file);
        });
    },

    // Load more images
    loadMoreImages: async () => {
        const currentPage = parseInt(document.getElementById('loadMore').dataset.page || 1);
        const nextPage = currentPage + 1;
        
        await GalleryService.loadImages(nextPage);
        document.getElementById('loadMore').dataset.page = nextPage;
    },

    // Update load more button
    updateLoadMoreButton: (currentCount) => {
        const loadMore = document.getElementById('loadMore');
        if (currentCount >= 20) {
            loadMore.classList.remove('hidden');
        } else {
            loadMore.classList.add('hidden');
        }
    },

    // Hide all modals
    hideModals: () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
};

// Initialize gallery service when DOM is loaded
document.addEventListener('DOMContentLoaded', GalleryService.init);

// Export gallery service
window.GalleryService = GalleryService;
