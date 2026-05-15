"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    populateNavbar();
    initLogoutButtons();
    populateSidebarProfile();
    await Promise.all([loadFeed(), loadUserProjectsSelect()]);

    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.addEventListener('click', handleNewPost);

    // Búsqueda en feed
    const searchInput = document.getElementById('feed-search-input');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => loadFeed(1, searchInput.value.trim()), 400);
        });
    }

    const searchBtn = document.getElementById('feed-search-btn');
    if (searchBtn) searchBtn.addEventListener('click', () => {
        const q = document.getElementById('feed-search-input')?.value.trim() || '';
        loadFeed(1, q);
    });

    // Previsualización de imagen
    document.getElementById('postImage')?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar 5MB'); this.value = ''; return; }
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('removeImage')?.addEventListener('click', () => {
        document.getElementById('postImage').value = '';
        document.getElementById('imagePreviewContainer').style.display = 'none';
    });
    document.querySelectorAll('[name="mediaType"]').forEach(r => {
        r.addEventListener('change', () => {
            document.getElementById('imageUploadArea').style.display = r.value === 'image' ? 'block' : 'none';
        });
    });
});

let currentPage = 1;

function populateSidebarProfile() {
    const user = getUser();
    if (!user) return;
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarName) sidebarName.textContent = user.nombre || user.nombreUsuario;
    if (sidebarUsername) sidebarUsername.textContent = '@' + user.nombreUsuario;
    if (sidebarAvatar) {
        sidebarAvatar.src = user.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nombre || user.nombreUsuario) + '&size=80';
        sidebarAvatar.alt = user.nombre || '';
    }
    const sidebarProfileLink = document.getElementById('sidebar-profile-link');
    if (sidebarProfileLink) sidebarProfileLink.href = 'profile.html?id=' + user.id;
}

async function loadFeed(page = 1, search = '') {
    currentPage = page;
    const container = document.getElementById('feed-container');
    if (!container) return;

    container.innerHTML = renderSkeletons(3);

    try {
        const res = await authFetch('/posts?page=' + page + '&limit=10&search=' + encodeURIComponent(search));
        if (!res.ok) throw new Error('Error al obtener publicaciones');
        const data = await res.json();
        const posts = data.publicaciones || [];

        if (!posts.length) {
            container.innerHTML = `<div class="text-center py-5 text-muted"><i class="fa fa-newspaper-o fa-3x mb-3 d-block"></i>Aún no hay publicaciones. ¡Sé el primero!</div>`;
            document.getElementById('feed-pagination')?.innerHTML && (document.getElementById('feed-pagination').innerHTML = '');
            return;
        }

        container.innerHTML = posts.map(post => postToHTML(post)).join('');
        renderFeedPagination(data.page, data.pages, search);
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="alert alert-danger">Error al cargar el feed. <a href="#" onclick="loadFeed()">Reintentar</a></div>`;
    }
}

function renderFeedPagination(page, pages, search) {
    const container = document.getElementById('feed-pagination');
    if (!container || pages <= 1) { if (container) container.innerHTML = ''; return; }
    let html = '<nav><ul class="pagination justify-content-center flex-wrap">';
    for (let i = 1; i <= pages; i++) {
        html += `<li class="page-item${i === page ? ' active' : ''}"><a class="page-link" href="#" onclick="event.preventDefault();loadFeed(${i},'${search}')">${i}</a></li>`;
    }
    html += '</ul></nav>';
    container.innerHTML = html;
}

function postToHTML(post) {
    const user = getUser();
    const autor = post.usuario || {};
    const avatarSrc = autor.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(autor.nombre || '?') + '&size=40';
    const nombre = autor.nombre || autor.nombreUsuario || 'Usuario';
    const fecha = post.fecha ? new Date(post.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const likes = Array.isArray(post.apoyos) ? post.apoyos.length : 0;
    const comments = Array.isArray(post.comentarios) ? post.comentarios.length : 0;
    const apoye = user && Array.isArray(post.apoyos) && post.apoyos.includes(user.id);
    const isOwner = user && (autor._id === user.id || user.rol === 'ADMIN');
    const tituloHTML = post.titulo ? `<h6 class="font-weight-bold mb-1">${escH(post.titulo)}</h6>` : '';

    let proyectoHTML = '';
    if (post.proyecto?.nombre) {
        proyectoHTML = `<small class="text-muted">Emprendimiento: <a href="#" class="post-project-name" style="color:inherit;" onclick="event.preventDefault();openProjectModal('${post.proyecto._id}')">${escH(post.proyecto.nombre)}</a></small> <span class="post-category-badge">${escH(post.proyecto.categoria || '')}</span><br>`;
    } else {
        proyectoHTML = `<span class="post-category-badge">Sin vincular</span><br>`;
    }
    const imagenHTML = post.imagen ? `<img src="${escH(post.imagen)}" class="img-fluid rounded mb-2 w-100" alt="imagen" style="max-height:300px;object-fit:cover;">` : '';

    const editBtn = isOwner ? `<button class="btn-comentar btn-sm ml-2" onclick="openEditPost('${post._id}','${escH(post.cuerpo.replace(/'/g, '&#39;'))}')"><i class="fa fa-pencil"></i></button>` : '';
    const deleteBtn = isOwner ? `<button class="btn-delete-small ml-1" onclick="deletePost('${post._id}')"><i class="fa fa-trash"></i></button>` : '';

    return `<div class="card mb-3" id="post-${post._id}">
  <div class="card-body">
    <div class="d-flex align-items-center mb-2">
      <img src="${avatarSrc}" class="rounded-circle mr-2" width="40" height="40" alt="foto" style="object-fit:cover;">
      <div class="flex-grow-1">
        <strong><a href="profile.html?id=${autor._id || ''}" style="color:inherit;">${escH(nombre)}</a></strong><br>
        <small class="text-muted">${fecha}</small>
      </div>
      ${editBtn}${deleteBtn}
    </div>
    ${proyectoHTML}
    ${imagenHTML}
    ${tituloHTML}
    <p class="card-text">${escH(post.cuerpo)}</p>
    <button class="btn-apoyo ${apoye ? 'active' : ''}" onclick="handleLike('${post._id}',this)">
      <i class="fa fa-heart"></i>
      <span id="likes-${post._id}">Apoyar ${likes}</span>
    </button>
    <button class="btn-comentar" onclick="loadPostDetails('${post._id}','${escH(nombre)}','${avatarSrc}','${fecha}')">
      <i class="fa fa-comment"></i> Comentar ${comments}
    </button>
  </div>
</div>`;
}

function renderSkeletons(n) {
    return `<div class="card mb-3"><div class="card-body">
      <div class="d-flex align-items-center mb-3">
        <div style="width:40px;height:40px;border-radius:50%;background:#eee;" class="mr-2"></div>
        <div><div style="height:14px;width:120px;background:#eee;border-radius:4px;"></div>
        <div style="height:10px;width:80px;background:#eee;border-radius:4px;margin-top:4px;"></div></div>
      </div>
      <div style="height:12px;background:#eee;border-radius:4px;margin-bottom:8px;"></div>
      <div style="height:12px;background:#eee;border-radius:4px;width:80%;"></div>
    </div></div>`.repeat(n);
}

async function handleLike(postId, btn) {
    try {
        const res = await authFetch('/posts/' + postId + '/like', { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        const span = document.getElementById('likes-' + postId);
        if (span) span.textContent = 'Apoyar ' + data.apoyos;
        btn.classList.toggle('active', data.apoye);
    } catch (e) { console.error('Error al apoyar:', e); }
}

async function loadPostDetails(postId, authorName, avatarSrc, fecha) {
    try {
        const res = await authFetch('/posts/' + postId);
        const post = await res.json();
        const me = getUser();

        document.getElementById('post-author-name').textContent = post.usuario?.nombre || authorName;
        document.getElementById('pm-date').textContent = ' - ' + fecha;
        document.getElementById('pm-text').innerHTML = '<p>' + escH(post.cuerpo) + '</p>';
        document.getElementById('pm-author-avatar').src = post.usuario?.fotoPerfil || avatarSrc;
        if (post.proyecto?.nombre) {
            document.getElementById('pm-project-name').textContent = post.proyecto.nombre;
            document.getElementById('pm-category').textContent = post.proyecto.categoria || '';
        } else {
            document.getElementById('pm-project-name').textContent = '';
            document.getElementById('pm-category').textContent = 'Sin vincular';
        }

        const img = document.getElementById('pm-media');
        if (img) { if (post.imagen) { img.src = post.imagen; img.classList.remove('d-none'); } else img.classList.add('d-none'); }

        // Actualizar botones de apoyo y comentar con datos reales
        const likes = Array.isArray(post.apoyos) ? post.apoyos.length : 0;
        const comments = Array.isArray(post.comentarios) ? post.comentarios.length : 0;
        const yaApoye = me && Array.isArray(post.apoyos) && post.apoyos.includes(me.id);
        const apoyoBtn = document.getElementById('pm-apoyo-btn');
        const apoyoCount = document.getElementById('pm-apoyo-count');
        const comentarCount = document.getElementById('pm-comentar-count');
        if (apoyoCount) apoyoCount.textContent = `Apoyar ${likes}`;
        if (comentarCount) comentarCount.textContent = `Comentarios ${comments}`;
        if (apoyoBtn) {
            apoyoBtn.classList.toggle('active', yaApoye);
            apoyoBtn.dataset.postId = postId;
        }

        const myAvatarImg = document.getElementById('pm-my-avatar');
        if (myAvatarImg) {
            const myName = me?.nombre || me?.nombreUsuario || '?';
            myAvatarImg.src = me?.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(myName) + '&size=36';
        }

        // Comentarios
        const commentsList = document.getElementById('pm-comments-list');
        if (commentsList) {
            commentsList.innerHTML = (post.comentarios || []).map(c => `
              <div class="d-flex mb-2">
                <img src="${c.usuario?.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.usuario?.nombre || '?') + '&size=32'}" class="rounded-circle mr-2" width="32" height="32" style="object-fit:cover;">
                <div>
                  <strong class="d-block" style="font-size:.85rem;">${escH(c.usuario?.nombre || 'Usuario')}</strong>
                  <p class="mb-0" style="font-size:.88rem;">${escH(c.contenido || c.cuerpo || '')}</p>
                </div>
              </div>`).join('');
        }

        // Input comentario
        const input = document.getElementById('pm-comment-input');
        const sendBtn = document.getElementById('pm-send-btn');
        if (input && sendBtn) {
            input.value = '';
            sendBtn.disabled = true;
            input.oninput = () => sendBtn.disabled = !input.value.trim();
            sendBtn.onclick = async () => {
                if (!input.value.trim()) return;
                try {
                    const r = await authFetch('/posts/' + postId + '/comentarios', { method: 'POST', body: JSON.stringify({ contenido: input.value.trim() }) });
                    if (r.ok) {
                        const c = await r.json();
                        const myName = me?.nombre || me?.nombreUsuario || 'Yo';
                        const myAvatar = me?.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(myName) + '&size=32';
                        commentsList.innerHTML += `<div class="d-flex mb-2">
                          <img src="${myAvatar}" class="rounded-circle mr-2" width="32" height="32" style="object-fit:cover;">
                          <div><strong class="d-block" style="font-size:.85rem;">${escH(myName)}</strong>
                          <p class="mb-0" style="font-size:.88rem;">${escH(c.contenido)}</p></div></div>`;
                        input.value = ''; sendBtn.disabled = true;
                        // Actualizar contador de comentarios
                        const newCount = commentsList.children.length;
                        const comentarCount = document.getElementById('pm-comentar-count');
                        if (comentarCount) comentarCount.textContent = `Comentarios ${newCount}`;
                    }
                } catch (e) { console.error(e); }
            };
        }

        $('#postModal').modal('show');
    } catch (e) { console.error('Error cargando detalle:', e); }
}



function openEditPost(postId, currentBody) {
    const newBody = prompt('Editar publicación:', currentBody);
    if (newBody === null || !newBody.trim()) return;
    authFetch('/posts/' + postId, { method: 'PUT', body: JSON.stringify({ cuerpo: newBody.trim() }) })
        .then(r => { if (r.ok) loadFeed(currentPage); else r.json().then(d => alert(d.mensaje || 'Error')); })
        .catch(() => alert('Error de conexión'));
}

async function deletePost(postId) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
        const res = await authFetch('/posts/' + postId, { method: 'DELETE' });
        if (res.ok) loadFeed(currentPage);
        else { const d = await res.json(); alert(d.mensaje || 'Error'); }
    } catch (e) { alert('Error de conexión'); }
}

// ── Apoyo en el modal de publicación ─────────────────────────────────────────
async function handleModalLike() {
    const apoyoBtn = document.getElementById('pm-apoyo-btn');
    if (!apoyoBtn?.dataset.postId) return;
    const postId = apoyoBtn.dataset.postId;
    try {
        const res = await authFetch('/posts/' + postId + '/like', { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        const apoyoCount = document.getElementById('pm-apoyo-count');
        if (apoyoCount) apoyoCount.textContent = `Apoyar ${data.apoyos}`;
        apoyoBtn.classList.toggle('active', data.apoye);
        // Actualizar botón en el feed
        const feedLikesSpan = document.getElementById('likes-' + postId);
        if (feedLikesSpan) feedLikesSpan.textContent = `Apoyar ${data.apoyos}`;
        const feedApoyoBtn = document.querySelector(`#post-${postId} .btn-apoyo`);
        if (feedApoyoBtn) feedApoyoBtn.classList.toggle('active', data.apoye);
    } catch (e) { console.error(e); }
}

// ── Proyecto: variables de estado ─────────────────────────────────────────────
let currentProjectId = null;
let currentProjectData = null;

// ── Apoyo en modal de proyecto ────────────────────────────────────────────────
async function handleProjectLike() {
    if (!currentProjectId) return;
    try {
        const res = await authFetch(`/proyectos/${currentProjectId}/apoyar`, { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        const apoyoCount = document.getElementById('proj-apoyo-count');
        const apoyoBtn = document.getElementById('proj-apoyo-btn');
        if (apoyoCount) apoyoCount.textContent = `Apoyar ${data.apoyos}`;
        if (apoyoBtn) apoyoBtn.classList.toggle('active', data.apoye);
        setTextByIdFeed('modal-apoyos', data.apoyos);
    } catch (e) { console.error('Error al apoyar proyecto:', e); }
}

// ── Colaborar en proyecto desde feed ─────────────────────────────────────────
async function handleProjectColab() {
    if (!currentProjectId) return;
    const mensaje = prompt('Cuéntale al dueño por qué quieres unirte (opcional):') || '';
    try {
        const res = await authFetch(`/proyectos/${currentProjectId}/solicitudes`, {
            method: 'POST',
            body: JSON.stringify({ mensaje })
        });
        const data = await res.json();
        if (res.ok) {
            alert('✅ Solicitud de colaboración enviada.');
            const colabBtn = document.getElementById('proj-colab-btn');
            if (colabBtn) { colabBtn.disabled = true; colabBtn.querySelector('span').textContent = 'Solicitud enviada'; }
        } else {
            alert('⚠️ ' + (data.mensaje || 'Error al enviar solicitud'));
        }
    } catch (e) { alert('Error de conexión'); }
}

function setTextByIdFeed(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ── Modal de detalle de proyecto (feed) ───────────────────────────────────────
async function openProjectModal(projectId) {
    try {
        const res = await authFetch('/proyectos/' + projectId);
        if (!res.ok) throw new Error();
        const p = await res.json();
        const me = getUser();

        currentProjectId = p._id;
        currentProjectData = p;

        const autor = p.dueno;
        const autorNombre = autor?.nombreUsuario || autor?.nombre || 'Desconocido';

        setTextByIdFeed('projectModalLabel', p.nombre);
        setTextByIdFeed('modal-category', p.categoria || 'General');
        setTextByIdFeed('modal-author-name', '@' + autorNombre);
        setTextByIdFeed('modal-apoyos', p.apoyos?.length || 0);
        setTextByIdFeed('modal-colaboradores', p.colaboradores?.length || 0);
        setTextByIdFeed('modal-descripcion', p.descripcion || '');
        setTextByIdFeed('modal-vision', p.vision || 'Sin visión definida.');
        setTextByIdFeed('modal-mision', p.mision || 'Sin misión definida.');

        // Publicaciones del proyecto
        try {
            const postsRes = await authFetch('/posts?limit=100');
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                const count = (postsData.publicaciones || []).filter(post => post.proyecto?._id === p._id || post.proyecto === p._id).length;
                setTextByIdFeed('modal-publicaciones', count);
            }
        } catch (e) { setTextByIdFeed('modal-publicaciones', 0); }

        const avatar = document.getElementById('modal-author-avatar');
        if (avatar) {
            avatar.src = autor?.fotoPerfil ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(autor?.nombre || '?')}`;
        }
        const dateEl = document.getElementById('modal-date');
        if (dateEl && p.fechaCreacion)
            dateEl.textContent = new Date(p.fechaCreacion).toLocaleDateString('es-MX');

        // Equipo
        const teamList = document.getElementById('modal-team-list');
        if (teamList) {
            teamList.innerHTML = (p.colaboradores || []).map(c => `
                <div class="card mb-2">
                  <div class="card-body py-2 d-flex align-items-center">
                    <img src="${c.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.nombre || '?')}" 
                         class="rounded-circle mr-2" width="35" height="35" style="object-fit:cover;">
                    <div>
                        <strong class="d-block" style="font-size:.9rem;">${escH(c.nombre || c.nombreUsuario)}</strong>
                        <small class="text-muted">Colaborador</small>
                    </div>
                  </div>
                </div>`).join('') || '<p class="text-muted small">No hay colaboradores adicionales aún.</p>';
        }

        // Botón apoyar
        const apoyoBtn = document.getElementById('proj-apoyo-btn');
        const apoyoCount = document.getElementById('proj-apoyo-count');
        if (apoyoBtn && apoyoCount) {
            const yaApoye = (p.apoyos || []).some(a => (a._id || a) === me.id);
            apoyoCount.textContent = `Apoyar ${p.apoyos?.length || 0}`;
            apoyoBtn.classList.toggle('active', yaApoye);
        }

        // Botón colaborar
        const colabBtn = document.getElementById('proj-colab-btn');
        if (colabBtn) {
            colabBtn.disabled = false;
            colabBtn.querySelector('span').textContent = 'Colaborar';
            const esOwner = (p.dueno?._id || p.dueno) === me.id;
            const esColab = (p.colaboradores || []).some(c => (c._id || c) === me.id);
            colabBtn.style.display = (esOwner || esColab) ? 'none' : '';
        }

        // Pestaña solicitudes (solo dueño/admin)
        const esOwner = (p.dueno?._id || p.dueno) === me.id || me.rol === 'ADMIN';
        const tabSol = document.getElementById('tab-solicitudes-link')?.parentElement;
        if (tabSol) tabSol.style.display = esOwner ? '' : 'none';
        if (esOwner) renderModalSolicitudesFeed(p._id);

        $('#projectModal').modal('show');
    } catch (e) {
        console.error(e);
        alert('No se pudo cargar el detalle del proyecto.');
    }
}

async function renderModalSolicitudesFeed(projectId) {
    const container = document.getElementById('modal-solicitudes-list');
    if (!container) return;
    container.innerHTML = '<p class="text-muted text-center"><i class="fa fa-spinner fa-spin"></i></p>';
    try {
        const res = await authFetch(`/proyectos/${projectId}/solicitudes`);
        if (!res.ok) { container.innerHTML = ''; return; }
        const solicitudes = await res.json();
        if (!solicitudes.length) {
            container.innerHTML = '<p class="text-muted text-center py-3">Sin solicitudes pendientes.</p>';
            return;
        }
        container.innerHTML = solicitudes.map(s => `
          <div class="card mb-2" id="msolicitud-${s._id}">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-center">
                  <img src="${s.solicitante?.fotoPerfil || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.solicitante?.nombre || '?')}" 
                       class="rounded-circle mr-2" width="35" height="35" style="object-fit:cover;">
                  <div>
                    <strong>${escH(s.solicitante?.nombre || s.solicitante?.nombreUsuario || 'Usuario')}</strong>
                    ${s.mensaje ? `<p class="mb-0 small text-muted">"${escH(s.mensaje)}"</p>` : ''}
                  </div>
                </div>
                <div class="d-flex">
                  <button class="btn btn-success btn-sm mr-1" onclick="responderSolicitudFeed('${s._id}','ACEPTADA')">✓ Aceptar</button>
                  <button class="btn btn-danger btn-sm" onclick="responderSolicitudFeed('${s._id}','RECHAZADA')">✗ Rechazar</button>
                </div>
              </div>
            </div>
          </div>`).join('');
    } catch (e) { container.innerHTML = ''; }
}

async function responderSolicitudFeed(solicitudId, accion) {
    try {
        const res = await authFetch('/solicitudes/' + solicitudId, { method: 'PUT', body: JSON.stringify({ accion }) });
        if (res.ok) document.getElementById('msolicitud-' + solicitudId)?.remove();
        else { const d = await res.json(); alert(d.mensaje || 'Error'); }
    } catch (e) { alert('Error de conexión'); }
}
