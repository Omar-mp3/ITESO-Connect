"use strict";

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
            logout(); return false;
        }
        return true;
    } catch (e) { return false; }
}

function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function logoutAndRedirect(redirectTo = 'home.html') {
    logout();
    window.location.href = redirectTo;
}

function requireAuth(redirectTo = 'home.html') {
    if (!isLoggedIn()) { window.location.href = redirectTo; return false; }
    return true;
}

function requireGuest(redirectTo = 'user-feed.html') {
    if (isLoggedIn()) { window.location.href = redirectTo; return false; }
    return true;
}

async function authFetch(url, options = {}) {
    const token = getToken();
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
        logoutAndRedirect('home.html');
        throw new Error('Sesión expirada');
    }
    return response;
}

function showError(msg, containerId) {
    const el = document.getElementById(containerId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideError(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.style.display = 'none';
}

function populateNavbar() {
    const user = getUser();
    if (!user) return;
    const navAvatar = document.getElementById('nav-avatar');
    if (navAvatar) {
        navAvatar.src = user.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nombre || user.nombreUsuario) + '&size=40';
        navAvatar.alt = user.nombre || '';
    }
    const navUsername = document.getElementById('nav-username');
    if (navUsername) navUsername.textContent = '@' + user.nombreUsuario;

    // Show admin link if admin
    const adminLink = document.getElementById('admin-link');
    if (adminLink && user.rol === 'ADMIN') adminLink.style.display = 'block';
}

function initLogoutButtons() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            logoutAndRedirect('home.html');
        });
    });
}

async function loadUserProjectsSelect() {
    const select = document.getElementById('projectSelect');
    if (!select) return;
    const user = getUser();
    if (!user) return;
    try {
        const res = await authFetch('/proyectos?limit=50');
        if (!res.ok) return;
        const data = await res.json();
        const myProjects = (data.proyectos || []).filter(p => p.dueno?._id === user.id || (p.colaboradores || []).some(c => c._id === user.id));
        select.innerHTML = `<option value="none">Sin proyecto (publicación personal)</option>`;
        myProjects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p._id;
            opt.textContent = p.nombre;
            select.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}


async function handleNewPost(event) {
    event.preventDefault();
    const user = getUser();
    if (!user) return;

    const cuerpoEl = document.getElementById('postDescription');
    const proyectoEl = document.getElementById('projectSelect');

    if (!cuerpoEl?.value?.trim()) {
        alert('Escribe algo antes de publicar');
        return;
    }

    let imageUrl = null;
    const imgFile = document.getElementById('postImage')?.files[0];
    if (imgFile) {
        imageUrl = await new Promise(res => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.readAsDataURL(imgFile);
        });
    }

    const formData = {
        titulo: document.getElementById('postTitle')?.value.trim() || '',
        cuerpo: cuerpoEl.value.trim(),
        usuario: user.id,
        proyecto: proyectoEl?.value && proyectoEl.value !== 'none' ? proyectoEl.value : null,
        fecha: new Date().toISOString(),
        imagen: imageUrl
    };

    const btn = document.getElementById('publishBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Publicando...'; }

    try {
        const res = await authFetch('/posts', { method: 'POST', body: JSON.stringify(formData) });
        if (res.ok) {
            if (cuerpoEl) cuerpoEl.value = '';
            if (proyectoEl) proyectoEl.value = 'none';
            // ← aquí estaba el crash: acceder sin verificar
            const postImage = document.getElementById('postImage');
            if (postImage) postImage.value = '';
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            $('#newPostModal').modal('hide');
            // Recargar según la página actual
            if (typeof loadFeed === 'function') await loadFeed(1);
            else if (typeof loadUserPosts === 'function') {
                const params = new URLSearchParams(window.location.search);
                const me = getUser();
                const profileId = params.get('id') || me.id || me._id;
                await loadUserPosts(profileId);
            }
        } else {
            const data = await res.json();
            alert(data.mensaje || 'Error al crear publicación');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Publicar'; }
    }
}

//escapar caracteres html
function escH(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

const Auth = { getToken, getUser, isLoggedIn, saveSession, logout, logoutAndRedirect, requireAuth, requireGuest, authFetch, populateNavbar, initLogoutButtons, loadUserProjectsSelect, handleNewPost, escH };