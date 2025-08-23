// Comments Service
const CommentsService = {
    // Current image ID for comments
    currentImageId: null,

    // Initialize comments service
    init: () => {
        CommentsService.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Comment form submission
        document.getElementById('commentForm').addEventListener('submit', CommentsService.handleCommentSubmit);
    },

    // Load comments for an image
    loadComments: async (imageId) => {
        CommentsService.currentImageId = imageId;
        const commentsList = document.getElementById('commentsList');
        commentsList.innerHTML = '<div class="loading-comments">Cargando comentarios...</div>';

        try {
            // Get image with comments
            const { data: image, error } = await supabase
                .from('images')
                .select(`
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
                .eq('id', imageId)
                .single();

            if (error) {
                throw error;
            }

            CommentsService.displayComments(image.comments || []);
        } catch (error) {
            commentsList.innerHTML = '<div class="error">Error al cargar comentarios: ' + error.message + '</div>';
        }
    },

    // Display comments
    displayComments: (comments) => {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">No hay comentarios todavía</div>';
            return;
        }

        commentsList.innerHTML = '';
        comments.forEach(comment => {
            const commentElement = CommentsService.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    },

    // Create comment element
    createCommentElement: (comment) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        const timeAgo = CommentsService.getTimeAgo(comment.created_at);
        
        commentDiv.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${comment.user?.full_name || comment.user?.email}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <div class="comment-content">${CommentsService.escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <button class="btn btn-link reply-btn" data-requires-auth>Responder</button>
                ${CommentsService.canDeleteComment(comment) ? 
                    `<button class="btn btn-link delete-btn" data-comment-id="${comment.id}">Eliminar</button>` : ''}
            </div>
        `;

        // Add delete event listener if applicable
        const deleteBtn = commentDiv.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                CommentsService.deleteComment(comment.id);
            });
        }

        return commentDiv;
    },

    // Handle comment form submission
    handleCommentSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            AuthService.showError('Por favor escribe un comentario');
            return;
        }

        if (!CommentsService.currentImageId) {
            AuthService.showError('No se ha seleccionado ninguna imagen');
            return;
        }

        try {
            const { data: comment, error } = await SupabaseService.addComment(CommentsService.currentImageId, content);
            
            if (error) {
                throw error;
            }

            // Add new comment to the list
            const commentsList = document.getElementById('commentsList');
            
            // Remove "no comments" message if present
            const noComments = commentsList.querySelector('.no-comments');
            if (noComments) {
                noComments.remove();
            }

            const commentElement = CommentsService.createCommentElement(comment);
            commentsList.insertBefore(commentElement, commentsList.firstChild);
            
            // Clear form
            textarea.value = '';
            
            AuthService.showSuccess('Comentario añadido');

        } catch (error) {
            AuthService.showError('Error al añadir comentario: ' + error.message);
        }
    },

    // Delete comment
    deleteComment: async (commentId) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) {
                throw error;
            }

            // Remove comment from DOM
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`)?.closest('.comment');
            if (commentElement) {
                commentElement.remove();
            }

            AuthService.showSuccess('Comentario eliminado');

            // Check if no comments left
            const commentsList = document.getElementById('commentsList');
            if (commentsList.children.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">No hay comentarios todavía</div>';
            }

        } catch (error) {
            AuthService.showError('Error al eliminar comentario: ' + error.message);
        }
    },

    // Check if current user can delete comment
    canDeleteComment: async (comment) => {
        try {
            const user = await AuthService.getCurrentUserData();
            return user && (user.id === comment.user_id || user.role === 'admin');
        } catch {
            return false;
        }
    },

    // Get time ago string
    getTimeAgo: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'ahora mismo';
        if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
        if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`;
        
        return date.toLocaleDateString();
    },

    // Escape HTML to prevent XSS
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Get comment count for an image
    getCommentCount: async (imageId) => {
        try {
            const { count, error } = await supabase
                .from('comments')
                .select('*', { count: 'exact' })
                .eq('image_id', imageId);

            if (error) {
                throw error;
            }

            return count;
        } catch (error) {
            console.error('Error getting comment count:', error);
            return 0;
        }
    },

    // Update comment count display
    updateCommentCount: async (imageId, element) => {
        const count = await CommentsService.getCommentCount(imageId);
        element.textContent = count + (count === 1 ? ' comentario' : ' comentarios');
    }
};

// Initialize comments service when DOM is loaded
document.addEventListener('DOMContentLoaded', CommentsService.init);

// Export comments service
window.CommentsService = CommentsService;
