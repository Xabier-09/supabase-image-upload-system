import { supabase } from './supabaseClient.js';

// Elementos básicos
const authArea = document.getElementById('auth-area');
const uploadSection = document.getElementById('upload-section');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file');
const titleInput = document.getElementById('title');
const gallery = document.getElementById('gallery');

// Modal y form
const authModal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const closeModal = document.getElementById('close-modal');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPass = document.getElementById('auth-pass');
const authFeedback = document.getElementById('auth-feedback');
const authSubmit = document.getElementById('auth-submit');

let currentUser = null;
let mode = 'login'; // or 'register'

// Render auth area on topbar
function renderAuth(user) {
  authArea.innerHTML = '';
  if (!user) {
    const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='Entrar / Registrar';
    openBtn.onclick = () => openAuthModal('login');
    authArea.append(openBtn);
  } else {
    const me = document.createElement('div'); me.textContent = user.email;
    const btnSignout = document.createElement('button'); btnSignout.textContent='Cerrar sesión'; btnSignout.className='btn';
    btnSignout.onclick = async () => { await supabase.auth.signOut(); };
    authArea.append(me, btnSignout);
  }
}

// Modal controls
function openAuthModal(initial='login'){
  mode = initial;
  tabLogin.classList.toggle('active', mode==='login');
  tabRegister.classList.toggle('active', mode==='register');
  modalTitle.textContent = mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
  authFeedback.textContent = '';
  authModal.classList.remove('hidden');
}
closeModal.onclick = () => authModal.classList.add('hidden');
tabLogin.onclick = () => openAuthModal('login');
tabRegister.onclick = () => openAuthModal('register');

// Auth form submit
authForm.onsubmit = async (e) => {
  e.preventDefault();
  authFeedback.textContent = '';
  const email = authEmail.value.trim();
  const password = authPass.value;
  if (!email || password.length < 6) { authFeedback.textContent = 'Correo válido y contraseña de 6+ caracteres'; return; }

  if (mode === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
      authFeedback.textContent = error.message; 
      // Registrar intento fallido de login
      if (data?.user?.id) {
        await supabase.rpc('track_login_attempt', {
          p_user_id: data.user.id,
          p_success: false,
          p_failure_reason: error.message
        });
      }
      return; 
    }
    
    // Registrar inicio de sesión exitoso
    if (data.user) {
      await supabase.rpc('track_login_attempt', {
        p_user_id: data.user.id,
        p_success: true
      });
    }
    
    authModal.classList.add('hidden');
  } else {
    // register
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { 
      authFeedback.textContent = error.message; 
      return; 
    }
    
    // Registrar el registro exitoso en nuestra tabla personalizada
    if (data.user) {
      await supabase.from('user_registrations').insert([
        {
          user_id: data.user.id,
          registration_method: 'email'
        }
      ]);
    }
    
    authFeedback.textContent = 'Registro enviado. Revisa tu correo si es necesario.';
  }
};

// --- Upload ---
uploadBtn && (uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert('Selecciona un archivo');
  if (!currentUser) return alert('Inicia sesión para subir');

  const path = `${currentUser.id}/${Date.now()}_${file.name}`;
  const { error: upErr } = await supabase.storage.from('images').upload(path, file);
  if (upErr) return alert('Error subida: '+upErr.message);

  const { error: insErr } = await supabase.from('images').insert([{ owner: currentUser.id, filename: file.name, storage_path: path, title: titleInput.value }]);
  if (insErr) return alert('Error DB: '+insErr.message);

  fileInput.value = '';
  titleInput.value = '';
  loadGallery();
});

// --- Load gallery ---
async function loadGallery(){
  gallery.innerHTML = 'Cargando...';
  const { data, error } = await supabase.from('image_stats').select('*').order('created_at', { ascending: false });
  if (error) { gallery.innerHTML = 'Error: '+error.message; return; }

  gallery.innerHTML = '';
  for (const img of data) {
    const url = supabase.storage.from('images').getPublicUrl(img.storage_path).publicUrl;
    const div = document.createElement('div'); div.className='item card';
    const imageEl = document.createElement('img'); imageEl.src = url;
    const meta = document.createElement('div'); meta.className='meta';
    const t = document.createElement('div'); t.textContent = img.title || img.filename;
    const owner = document.createElement('div'); owner.className='small'; owner.textContent = `Dueño: ${img.owner}`;
    const stats = document.createElement('div'); stats.className='small'; stats.textContent = `Valoración: ${img.avg_rating} (${img.rating_count})`;

    meta.append(t, owner, stats);

    const controls = document.createElement('div'); controls.className='controls';

    if (currentUser && currentUser.id === img.owner) {
      const del = document.createElement('button'); del.className='btn small'; del.textContent='Eliminar';
      del.onclick = async () => {
        if (!confirm('Eliminar imagen?')) return;
        const { error } = await supabase.from('images').delete().eq('id', img.id);
        if (error) return alert(error.message);
        await supabase.storage.from('images').remove([img.storage_path]);
        loadGallery();
      };
      controls.append(del);
    }

    const ratingDiv = document.createElement('div'); ratingDiv.className='rating';
    for (let s=1;s<=5;s++){
      const star = document.createElement('span'); star.className='star'; star.textContent = '★';
      star.onclick = async () => {
        if (!currentUser) return openAuthModal('login');
        const payload = { image_id: img.id, user_id: currentUser.id, rating: s };
        const { error } = await supabase.from('ratings').upsert(payload, { onConflict: ['image_id','user_id'] });
        if (error) return alert(error.message);
        loadGallery();
      };
      ratingDiv.append(star);
    }
    controls.append(ratingDiv);

    div.append(imageEl, meta, controls);
    gallery.append(div);
  }
}

// --- Auth state listener ---
supabase.auth.onAuthStateChange(async (event, session) => {
  currentUser = session?.user ?? null;
  renderAuth(currentUser);
  uploadSection.classList.toggle('hidden', !currentUser);
  await loadGallery();
});

// Inicio
(async ()=>{
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user ?? null;
  renderAuth(currentUser);
  uploadSection.classList.toggle('hidden', !currentUser);
  loadGallery();
})();
