<<<<<<< HEAD
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
=======
// js/app.js
// Main application logic integrating Supabase and UI.
// IMPORTANT: replace SUPABASE_URL and SUPABASE_ANON_KEY in js/supabase.js first.

const state = {
  user: null,
  images: [],
  favorites: new Set(),
  filter: { q: '', minRating: 0, sort: 'newest' }
};

function setTheme(dark){
  document.body.className = dark ? 'dark' : 'light';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}
document.getElementById('themeToggle').addEventListener('click', () => {
  const dark = document.body.classList.contains('dark');
  setTheme(!dark);
});
setTheme(localStorage.getItem('theme') === 'dark');

async function showModal(html){
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');
  content.innerHTML = '';
  if(typeof html === 'string') content.innerHTML = html;
  else content.appendChild(html);
  modal.classList.remove('hidden');
  modal.addEventListener('click', (e)=>{ if(e.target === modal) modal.classList.add('hidden'); });
}

function closeModal(){
  document.getElementById('modal').classList.add('hidden');
}

// Auth UI
document.getElementById('authBtn').addEventListener('click', openAuth);

function authForm(){
  const wrap = create('div');
  wrap.innerHTML = `
    <h3>Welcome</h3>
    <form id="authForm">
      <label>Email <input type="email" name="email" required></label>
      <label>Password <input type="password" name="password" minlength="6" required></label>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button type="submit" class="primary">Login</button>
        <button type="button" id="toRegister" class="btn">Register</button>
      </div>
      <p id="authMsg" style="color:var(--muted)"></p>
    </form>
  `;
  wrap.querySelector('#toRegister').addEventListener('click', ()=> openAuth(true));
  wrap.querySelector('#authForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const pass = form.password.value;
    const mode = form.dataset.mode || 'login';
    const msg = wrap.querySelector('#authMsg');
    msg.textContent = 'Processing...';
    try {
      if(mode === 'login') {
        const res = await window.supabase.auth.signInWithPassword({ email, password: pass });
        if(res.error) throw res.error;
        state.user = res.data.user;
        msg.textContent = 'Signed in!';
        closeModal();
        loadAppState();
      } else {
        const res = await window.supabase.auth.signUp({ email, password: pass });
        if(res.error) throw res.error;
        msg.textContent = 'Registered! Check your email.';
      }
    } catch (err) {
      msg.textContent = err.message || JSON.stringify(err);
    }
  });
  return wrap;
}

function openAuth(register=false){
  const node = authForm();
  node.querySelector('form').dataset.mode = register ? 'register' : 'login';
  showModal(node);
}

// Upload UI
document.getElementById('uploadBtn').addEventListener('click', openUpload);

function uploadForm(){
  const wrap = create('div');
  wrap.innerHTML = `
    <h3>Upload image</h3>
    <form id="uploadForm">
      <label>Choose file <input name="file" type="file" accept="image/*" required></label>
      <label>Title <input name="title" maxlength="120"></label>
      <label>Tags (comma separated) <input name="tags"></label>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="primary" type="submit">Upload</button>
        <button type="button" id="cancelUpload" class="btn">Cancel</button>
      </div>
      <p id="uploadMsg" style="color:var(--muted)"></p>
    </form>
  `;
  wrap.querySelector('#cancelUpload').addEventListener('click', closeModal);
  wrap.querySelector('#uploadForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const f = e.target.file.files[0];
    if(!f) return;
    const title = e.target.title.value || '';
    const tags = e.target.tags.value || '';
    const msg = wrap.querySelector('#uploadMsg');
    msg.textContent = 'Compressing...';
    try {
      const compressed = await compressImageFile(f, 1400, 0.78);
      msg.textContent = 'Uploading...';
      const path = `${state.user ? state.user.id : 'anon'}/${Date.now()}_${compressed.name}`;
      const { data: up, error: upErr } = await window.supabase.storage.from('images').upload(path, compressed, { cacheControl: '3600', upsert: false });
      if(upErr) throw upErr;
      const { data: urlData } = window.supabase.storage.from('images').getPublicUrl(path);
      const publicURL = urlData?.publicUrl || '';
      const insert = {
        user_id: state.user ? state.user.id : null,
        title,
        description: tags,
        file_name: path,
        created_at: new Date().toISOString()
      };
      const { data: ins, error: insErr } = await window.supabase.from('images').insert(insert).select().single();
      if(insErr) throw insErr;
      msg.textContent = 'Uploaded!';
      closeModal();
      fetchImages();
    } catch (err) {
      msg.textContent = err.message || JSON.stringify(err);
    }
  });
  return wrap;
}

function openUpload(){ 
  if(!state.user) return openAuth(false);
  showModal(uploadForm());
}

// Load session and initial state
async function loadAppState(){
  try {
    const s = await window.supabase.auth.getSession();
    state.user = s?.data?.session?.user ?? null;
  } catch (err) { console.error(err); }
  await fetchFavorites();
  await fetchImages();
}

async function fetchImages(){
  try {
    const q = el('#searchInput').value.trim();
    const minR = parseInt(el('#minRating').value || '0', 10);
    const sort = el('#sortSelect').value;
    const { data, error } = await window.supabase
      .from('images')
      .select('id,title,description,file_name,created_at,user:profiles(id,username,avatar_url)')
      .order('created_at', { ascending: sort !== 'newest' });
    if(error){
      console.warn('Primary images select error, retrying simplified select:', error);
      const res = await window.supabase.from('images').select('id,title,description,file_name,created_at,user:profiles(id,username,avatar_url)').order('created_at', { ascending: sort !== 'newest' });
      if(res.error) throw res.error;
      renderImages(res.data || []);
      return;
    }
    renderImages(data || []);
  } catch (err) {
    console.error('fetchImages error', err);
  }
}

function renderImages(list){
  state.images = list;
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  list.forEach(item=>{
    const tpl = document.getElementById('cardTemplate');
    const node = tpl.content.cloneNode(true);
    const art = node.querySelector('article');
    const imgEl = node.querySelector('.card-img');
    const title = node.querySelector('.card-title');
    const meta = node.querySelector('.card-meta');
    const favBtn = node.querySelector('.favorite-btn');
    const commentBtn = node.querySelector('.comment-btn');
    const ratingWrap = node.querySelector('.rating');

    title.textContent = item.title || 'Untitled';
    meta.textContent = item.user ? item.user.username + ' · ' + timeAgo(item.created_at) : timeAgo(item.created_at);
    imgEl.src = (item.file_name && window.supabase.storage) ? window.supabase.storage.from('images').getPublicUrl(item.file_name).data.publicUrl : item.file_name || '';
    imgEl.alt = item.title || '';

    favBtn.addEventListener('click', ()=> toggleFavorite(item));
    commentBtn.addEventListener('click', ()=> openComments(item));
    ratingWrap.innerHTML = '';
    for(let i=1;i<=5;i++){
      const star = create('button',{innerText:'★',className:'btn',title:i+' stars'});
      star.style.opacity = '0.4';
      star.addEventListener('click', ()=> submitRating(item,i));
      ratingWrap.appendChild(star);
    }

    gallery.appendChild(node);
  });
}

async function submitRating(item, rating){
  if(!state.user) return openAuth(false);
  try {
    const payload = { image_id: item.id, user_id: state.user.id, rating, comment: '' };
    const { data, error } = await window.supabase.from('ratings').upsert(payload, { onConflict: ['image_id','user_id'] }).select();
    if(error) throw error;
    fetchImages();
  } catch (err) { console.error('submitRating', err); }
}

async function openComments(item){
  const wrap = create('div');
  wrap.innerHTML = `<h3>Comments for "${item.title || ''}"</h3>
    <div id="commentsList" style="max-height:300px;overflow:auto;margin-bottom:8px"></div>
    <form id="commentForm">
      <textarea name="text" placeholder="Write a comment..." required style="width:100%;min-height:80px"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="primary" type="submit">Post</button>
        <button type="button" class="btn" id="closeC">Close</button>
      </div>
    </form>`;
  showModal(wrap);
  wrap.querySelector('#closeC').addEventListener('click', closeModal);
  const list = wrap.querySelector('#commentsList');
  const { data, error } = await window.supabase.from('comments').select('id,user_id,body,created_at,user:profiles(id,username)').eq('image_id', item.id).order('created_at', { ascending: false });
  if(!error && data) {
    data.forEach(c => {
      const p = create('div'); p.innerHTML = `<strong>${c.user?.username||'Anon'}</strong> · ${timeAgo(c.created_at)}<div>${c.body}</div><hr/>`;
      list.appendChild(p);
    });
  }
  wrap.querySelector('#commentForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!state.user) return openAuth(false);
    const text = e.target.text.value.trim();
    if(!text) return;
    const payload = { image_id: item.id, user_id: state.user.id, body: text, created_at: new Date().toISOString() };
    const { data: ins, error: insErr } = await window.supabase.from('comments').insert(payload);
    if(insErr) return console.error(insErr);
    const p = create('div'); p.innerHTML = `<strong>${state.user?.email||'You'}</strong> · just now<div>${text}</div><hr/>`;
    list.prepend(p);
    e.target.text.value = '';
  });
}

async function toggleFavorite(item){
  if(!state.user) return openAuth(false);
  try {
    const pk = { user_id: state.user.id, image_id: item.id };
    const { data, error } = await window.supabase.from('favorites').upsert(pk, { onConflict: ['user_id','image_id'] }).select();
    if(error) throw error;
    await fetchFavorites();
  } catch (err) { console.error(err); }
}

async function fetchFavorites(){
  if(!state.user) {
    state.favorites = new Set();
    renderFavorites();
    return;
  }
  const { data, error } = await window.supabase.from('favorites').select('image_id').eq('user_id', state.user.id);
  if(!error && data) {
    state.favorites = new Set(data.map(r=>r.image_id));
    renderFavorites();
  }
}

function renderFavorites(){
  const elFav = document.getElementById('favoritesList');
  elFav.innerHTML = '';
  state.favorites.forEach(id=>{
    const p = create('div'); p.textContent = id;
    elFav.appendChild(p);
  });
}

document.getElementById('searchInput').addEventListener('input', ()=> { clearTimeout(window._q); window._q = setTimeout(fetchImages, 400); });
document.getElementById('minRating').addEventListener('change', fetchImages);
document.getElementById('sortSelect').addEventListener('change', fetchImages);

window.addEventListener('load', async ()=>{
  await loadAppState();
  if(window.supabase) {
    window.supabase.auth.onAuthStateChange((event, sess) => {
      loadAppState();
    });
  }
});
>>>>>>> d5cd62e (Actualizado)
