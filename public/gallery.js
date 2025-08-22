import { supabase } from './supabaseClient.js';
import { authManager } from './auth.js';
import { showNotification, formatDate } from './utils.js';

export class GalleryManager {
  constructor() {
    this.images = [];
    this.currentPage = 1;
    this.hasMore = true;
    this.isLoading = false;
    this.filters = {
      category: null,
      sort: 'newest',
      search: ''
    };
  }

  async loadImages(page = 1, filters = {}) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.filters = { ...this.filters, ...filters };

    try {
      let query = supabase
        .from('image_stats')
        .select('*')
        .range((page - 1) * 20, page * 20 - 1);

      // Apply filters
      if (this.filters.category) {
        query = query.eq('category_id', this.filters.category);
      }

      if (this.filters.search) {
        query = query.ilike('title', `%${this.filters.search}%`);
      }

      // Apply sorting
      switch (this.filters.sort) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating':
          query = query.order('avg_rating', { ascending: false });
          break;
        case 'popular':
          query = query.order('favorite_count', { ascending: false });
          break;
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (page === 1) {
        this.images = data || [];
      } else {
        this.images = [...this.images, ...(data || [])];
      }

      this.currentPage = page;
      this.hasMore = data && data.length === 20;

      return data;
    } catch (error) {
      showNotification('Error al cargar imágenes: ' + error.message, 'error');
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async loadImageDetails(imageId) {
    try {
      const { data, error } = await supabase
        .from('image_stats')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      showNotification('Error al cargar detalles: ' + error.message, 'error');
      throw error;
    }
  }

  async uploadImage(file, title, categoryIds = []) {
    if (!authManager.currentUser) {
      throw new Error('Debes iniciar sesión para subir imágenes');
    }

    try {
      const path = `${authManager.currentUser.id}/${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Insert image record
      const { data: imageData, error: insertError } = await supabase
        .from('images')
        .insert([{
          owner: authManager.currentUser.id,
          filename: file.name,
          storage_path: path,
          title: title || file.name
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add categories if provided
      if (categoryIds.length > 0) {
        const categoryInserts = categoryIds.map(categoryId => ({
          image_id: imageData.id,
          category_id: categoryId
        }));

        const { error: categoryError } = await supabase
          .from('image_categories')
          .insert(categoryInserts);

        if (categoryError) {
          console.warn('Error adding categories:', categoryError.message);
        }
      }

      showNotification('Imagen subida correctamente', 'success');
      return imageData;
    } catch (error) {
      showNotification('Error al subir imagen: ' + error.message, 'error');
      throw error;
    }
  }

  async deleteImage(imageId, storagePath) {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('images')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Error deleting from storage:', storageError.message);
      }

      showNotification('Imagen eliminada', 'success');
    } catch (error) {
      showNotification('Error al eliminar imagen: ' + error.message, 'error');
      throw error;
    }
  }

  async rateImage(imageId, rating, comment = null) {
    if (!authManager.currentUser) {
      throw new Error('Debes iniciar sesión para calificar');
    }

    try {
      const payload = {
        image_id: imageId,
        user_id: authManager.currentUser.id,
        rating: rating,
        ...(comment && { comment: comment })
      };

      const { error } = await supabase
        .from('ratings')
        .upsert(payload, { onConflict: 'image_id,user_id' });

      if (error) throw error;

      showNotification('Valoración guardada', 'success');
    } catch (error) {
      showNotification('Error al calificar: ' + error.message, 'error');
      throw error;
    }
  }

  async toggleFavorite(imageId) {
    if (!authManager.currentUser) {
      throw new Error('Debes iniciar sesión para agregar favoritos');
    }

    try {
      const { data: existing } = await supabase
        .from('favorites')
        .select()
        .eq('image_id', imageId)
        .eq('user_id', authManager.currentUser.id)
        .single();

      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        showNotification('Eliminado de favoritos', 'info');
        return false;
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            image_id: imageId,
            user_id: authManager.currentUser.id
          });

        if (error) throw error;
        showNotification('Agregado a favoritos', 'success');
        return true;
      }
    } catch (error) {
      showNotification('Error al gestionar favoritos: ' + error.message, 'error');
      throw error;
    }
  }

  async addComment(imageId, content) {
    if (!authManager.currentUser) {
      throw new Error('Debes iniciar sesión para comentar');
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          image_id: imageId,
          user_id: authManager.currentUser.id,
          content: content
        });

      if (error) throw error;

      showNotification('Comentario publicado', 'success');
    } catch (error) {
      showNotification('Error al comentar: ' + error.message, 'error');
      throw error;
    }
  }

  async getComments(imageId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles:user_id (display_name, avatar_url)
        `)
        .eq('image_id', imageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      showNotification('Error al cargar comentarios: ' + error.message, 'error');
      throw error;
    }
  }

  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      showNotification('Error al cargar categorías: ' + error.message, 'error');
      throw error;
    }
  }
}

export const galleryManager = new GalleryManager();
