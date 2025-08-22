import { supabase } from './supabaseClient.js';
import { showNotification } from './utils.js';

export class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
  }

  async init() {
    const { data: { user } } = await supabase.auth.getUser();
    this.currentUser = user;
    this.notifyListeners();
    return this.currentUser;
  }

  addAuthListener(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
  }

  removeAuthListener(callback) {
    this.authListeners = this.authListeners.filter(cb => cb !== callback);
  }

  notifyListeners() {
    this.authListeners.forEach(callback => callback(this.currentUser));
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Track failed login attempt
        if (data?.user?.id) {
          await supabase.rpc('track_login_attempt', {
            p_user_id: data.user.id,
            p_success: false,
            p_failure_reason: error.message
          });
        }
        throw error;
      }

      // Track successful login
      if (data.user) {
        await supabase.rpc('track_login_attempt', {
          p_user_id: data.user.id,
          p_success: true
        });
      }

      this.currentUser = data.user;
      this.notifyListeners();
      showNotification('¡Bienvenido!', 'success');
      return data.user;
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  }

  async register(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;

      // Track registration
      if (data.user) {
        try {
          await supabase.rpc('track_user_registration', {
            p_user_id: data.user.id,
            p_registration_method: 'email'
          });
        } catch (trackError) {
          console.warn('Error tracking registration:', trackError.message);
        }
      }

      showNotification('¡Cuenta creada! Revisa tu correo si es necesario.', 'success');
      return data.user;
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  }

  async logout() {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.notifyListeners();
      showNotification('Sesión cerrada', 'info');
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  }

  async updateProfile(updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;
      
      showNotification('Perfil actualizado', 'success');
      return data;
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  }

  async uploadAvatar(file) {
    try {
      const path = `avatars/${this.currentUser.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      await this.updateProfile({ avatar_url: publicUrl });
      return publicUrl;
    } catch (error) {
      showNotification(error.message, 'error');
      throw error;
    }
  }

  // Listen for auth state changes
  setupAuthListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user ?? null;
      this.notifyListeners();
      
      if (event === 'SIGNED_IN') {
        showNotification('¡Bienvenido!', 'success');
      } else if (event === 'SIGNED_OUT') {
        showNotification('Sesión cerrada', 'info');
      }
    });
  }
}

export const authManager = new AuthManager();
