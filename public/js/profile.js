"use strict";

// Estado del proyecto actualmente abierto en el modal
let currentProjectId = null;
let currentProjectData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    populateNavbar();
    initLogoutButtons();

    const params = new URLSearchParams(window.location.search);
    const me = getUser();
    const profileId = params.get('id') || me.id || me._id;
    const isOwner = profileId === (me.id || me._id);

    if (me.rol === 'ADMIN') {
        const al = document.getElementById('admin-link');
        if (al) al.style.display = 'block';
    }

    await loadProfile(profileId, isOwner);
    await loadUserPosts(profileId);

    if (isOwner) {
        document.getElementById('saveBioBtn')?.addEventListener('click', () => handleSaveBio(profileId));
        document.getElementById('saveProjectBtn')?.addEventListener('click', () => handleCreateProject(profileId));
        await loadMisSolicitudesRecibidas(profileId);
    }

    // Pre-rellenar el modal de edición al abrirlo
    document.getElementById('btn-editar-perfil')?.addEventListener('click', () => {
        prefillEditModal();
    });

    await loadUserProjectsSelect();

    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) publishBtn.addEventListener('click', handleNewPost);

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

// cargar perfil
async function loadProfile(userId, isOwner) {
    try {
        const res = await authFetch('/usuarios/' + userId);
        if (!res.ok) throw new Error('No encontrado');
        const user = await res.json();
        renderProfile(user, isOwner);
    } catch (err) {
        const container = document.getElementById('profile-card');
        if (container) container.innerHTML = '<p class="text-danger py-3">No se pudo cargar el perfil.</p>';
    }
}

function renderProfile(user, isOwner) {
    // Guardar datos del usuario para pre-rellenar modal de edición
    window._currentProfileUser = user;

    const foto = document.getElementById('profile-foto');
    if (foto) foto.src = user.fotoPerfil ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || user.nombreUsuario)}&size=100`;

    setTextById('profile-nombre', user.nombre || user.nombreUsuario);
    setTextById('profile-username', '@' + (user.nombreUsuario || 'usuario'));
    setTextById('profile-bio', user.biografia || 'Sin biografía aún.');
    setTextById('profile-seguidores', (user.seguidores?.length || 0) + ' seguidores');
    setTextById('profile-siguiendo', (user.siguiendo?.length || 0) + ' siguiendo');
    setTextById('profile-info-carrera', user.carrera || 'No especificada');
    setTextById('profile-info-universidad', user.universidad || 'No especificada');
    setTextById('profile-info-ciudad', user.ciudad || 'No especificada');
    setTextById('profile-info-correo', user.correo || 'No disponible');
    setTextById('profile-bio-long', user.sobreMi || 'Sin información adicional.');

    if (user.fechaRegistro || user.createdAt) {
        const fecha = new Date(user.fechaRegistro || user.createdAt)
            .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
        setTextById('profile-info-fecha', fecha);
    }

    if (user.proyectos?.length) {
        const validProjs = user.proyectos.filter(p => typeof p === 'object');
        const top = [...validProjs].sort((a, b) => (b.apoyos?.length || 0) - (a.apoyos?.length || 0))[0];
        if (top?.nombre) setTextById('profile-top-project', `${top.nombre} - ${top.apoyos?.length || 0} apoyos`);
    }

    const bioHabilEl = document.getElementById('profile-bio-habil');
    if (bioHabilEl) bioHabilEl.textContent = user.habilidades?.length ? user.habilidades.join(', ') : 'Sin habilidades.';

    const habilEl = document.getElementById('profile-habilidades');
    if (habilEl) habilEl.innerHTML = user.habilidades?.length
        ? user.habilidades.map(h => `<span class="badge badge-pill badge-light border mr-1 mb-1">${escH(h)}</span>`).join('')
        : 'Sin habilidades.';

    const btnEditar = document.getElementById('btn-editar-perfil');
    const btnSeguir = document.getElementById('btn-seguir');
    const btnMensaje = document.getElementById('btn-mensaje');

    if (isOwner) {
        if (btnEditar) btnEditar.style.display = 'inline-block';
        if (btnSeguir) btnSeguir.style.display = 'none';
        if (btnMensaje) btnMensaje.style.display = 'none';
    } else {
        if (btnEditar) btnEditar.style.display = 'none';
        if (btnSeguir) btnSeguir.style.display = 'inline-block';
        if (btnMensaje) { btnMensaje.style.display = 'inline-block'; btnMensaje.href = `inbox.html?userId=${user._id}`; }

        if (btnSeguir) {
            const me = getUser();
            const yaSignue = user.seguidores?.some(s => (s._id || s) === me.id);
            btnSeguir.textContent = yaSignue ? 'Dejar de seguir' : 'Seguir';
            btnSeguir.onclick = () => handleFollow(user._id, btnSeguir);
        }
    }
    renderUserProjects(user.proyectos, isOwner);
}

// previsualizar edición
function prefillEditModal() {
    const user = window._currentProfileUser;
    if (!user) return;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('edit-profile-nombre', user.nombre || '');
    setVal('edit-profile-carrera', user.carrera || '');
    setVal('edit-profile-universidad', user.universidad || '');
    setVal('edit-profile-ciudad', user.ciudad || '');
    setVal('edit-profile-habil', user.habilidades?.join(', ') || '');
    setVal('edit-profile-bio-short', user.biografia || '');
    setVal('edit-profile-bio-long', user.sobreMi || '');
    setVal('edit-profile-foto-url', '');
}

// proyectos en perfil
function renderUserProjects(proyectos, isOwner) {
    const container = document.getElementById('profile-proyectos');
    if (!container) return;

    let html = '';
    if (isOwner) html = `<div class="mb-3 text-right">
      <a href="#" class="btn btn-outline-primary btn-sm btn-gradient"
         data-toggle="modal" data-target="#createProjectModal">+ Crear nuevo proyecto</a>
    </div>`;

    if (!proyectos?.length) {
        html += '<p class="text-muted text-center py-3">Sin proyectos registrados.</p>';
    } else {
        html += proyectos.map(p => {
            if (typeof p === 'string') {
                return `<div class="card mb-2 project-card-hover" style="cursor:pointer;" onclick="openProjectModal('${p}')">
                  <div class="card-body py-3">
                    <h6 class="mb-0 text-muted font-weight-bold">Proyecto (clic para cargar)</h6>
                    <small class="text-muted">ID: ${p.substring(0, 8)}…</small>
                  </div></div>`;
            }
            return `<div class="card mb-2 project-card-hover" style="cursor:pointer;" onclick="openProjectModal('${p._id}')">
              <div class="card-body py-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1 font-weight-bold">${escH(p.nombre || 'Sin nombre')}</h6>
                  ${p.categoria ? `<span class="post-category-badge">${escH(p.categoria)}</span>` : ''}
                  ${p.descripcion ? `<p class="mb-0 text-muted small mt-1 text-truncate" style="max-width:350px;">${escH(p.descripcion)}</p>` : ''}
                </div>
                <div class="text-right">

                </div>
              </div></div>`;
        }).join('');
    }
    container.innerHTML = html;
}

// detalle de proyecto
async function openProjectModal(projectId) {
    try {
        const res = await authFetch('/proyectos/' + projectId);
        if (!res.ok) throw new Error('Error al cargar');
        const p = await res.json();
        const me = getUser();

        currentProjectId = p._id;
        currentProjectData = p;

        const autor = p.dueno;
        const autorNombre = autor?.nombreUsuario || autor?.nombre ||
            (typeof autor === 'string' ? 'Usuario' : 'Desconocido');

        setTextById('projectModalLabel', p.nombre);
        setTextById('modal-category', p.categoria || 'General');
        setTextById('modal-author-name', '@' + autorNombre);
        setTextById('modal-apoyos', p.apoyos?.length || 0);
        setTextById('modal-colaboradores', p.colaboradores?.length || 0);
        setTextById('modal-descripcion', p.descripcion);
        setTextById('modal-vision', p.vision || 'Sin visión definida.');
        setTextById('modal-mision', p.mision || 'Sin misión definida.');

        // Publicaciones del proyecto en su pestaña específica
        const postsList = document.getElementById('modal-posts-list');
        if (postsList) postsList.innerHTML = '<div class="text-center py-4"><i class="fa fa-spinner fa-spin"></i></div>';

        try {
            const postsRes = await authFetch(`/posts?limit=100`);
            if (postsRes.ok) {
                const postsData = await postsRes.json();
                const projectPosts = (postsData.publicaciones || []).filter(post => (post.proyecto?._id || post.proyecto) === p._id);
                setTextById('modal-publicaciones', projectPosts.length);

                if (postsList) {
                    if (projectPosts.length === 0) {
                        postsList.innerHTML = '<p class="text-muted text-center py-4">Este proyecto aún no tiene publicaciones asociadas.</p>';
                    } else {
                        postsList.innerHTML = projectPosts.map(post => `
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h6 class="card-title font-weight-bold mb-1">${escH(post.titulo || 'Publicación')}</h6>
                                    <p class="card-text mb-2">${escH(post.cuerpo)}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">${post.fecha ? new Date(post.fecha).toLocaleDateString('es-MX') : ''}</small>
                                        <button class="btn btn-link btn-sm p-0" style="color:var(--purple);" onclick="$('#projectModal').modal('hide'); setTimeout(() => loadPostDetails('${post._id}','${escH(post.usuario?.nombre || '')}','','${post.fecha ? new Date(post.fecha).toLocaleDateString('es-MX') : ''}'), 400)">Ver detalle</button>
                                    </div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (e) { 
            setTextById('modal-publicaciones', 0);
            if (postsList) postsList.innerHTML = '<p class="text-danger text-center">Error al cargar publicaciones.</p>';
        }

        const avatar = document.getElementById('modal-author-avatar');
        if (avatar) {
            const nameForAvatar = autor?.nombre || autor?.nombreUsuario || '?';
            avatar.src = autor?.fotoPerfil ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(nameForAvatar)}`;
        }

        const dateEl = document.getElementById('modal-date');
        if (dateEl && p.fechaCreacion)
            dateEl.textContent = new Date(p.fechaCreacion).toLocaleDateString('es-MX');

        const btnVerDueno = document.getElementById('modal-ver-dueno');
        if (btnVerDueno && autor?._id)
            btnVerDueno.href = `profile.html?id=${autor._id}`;

        // Equipo
        const teamList = document.getElementById('modal-team-list');
        if (teamList) {
            const colaboradores = p.colaboradores || [];
            teamList.innerHTML = colaboradores.map(c => `
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

        // Botón Apoyar del footer — actualizar estado
        const apoyoBtn = document.getElementById('proj-apoyo-btn');
        const apoyoCount = document.getElementById('proj-apoyo-count');
        if (apoyoBtn && apoyoCount) {
            const yaApoye = (p.apoyos || []).some(a => (a._id || a) === me.id);
            apoyoCount.textContent = `Apoyar ${p.apoyos?.length || 0}`;
            apoyoBtn.classList.toggle('active', yaApoye);
        }

        // Botón Colaborar del footer
        const colabBtn = document.getElementById('proj-colab-btn');
        if (colabBtn) {
            const esOwner = (p.dueno?._id || p.dueno) === me.id;
            const esColab = (p.colaboradores || []).some(c => (c._id || c) === me.id);
            if (esOwner || esColab) {
                colabBtn.style.display = 'none';
            } else {
                colabBtn.style.display = '';
            }
        }

        // Solicitudes (pestaña solo para dueño)
        const esOwner = (p.dueno?._id || p.dueno) === me.id || me.rol === 'ADMIN';
        const tabSolicitudes = document.getElementById('tab-solicitudes-link')?.parentElement;
        if (tabSolicitudes) tabSolicitudes.style.display = esOwner ? '' : 'none';
        if (esOwner) renderModalSolicitudes(p._id);

        $('#projectModal').modal('show');
    } catch (e) {
        console.error(e);
        alert('No se pudo cargar el detalle del proyecto.');
    }
}

// apoyar proyecto desde el modal
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
        setTextById('modal-apoyos', data.apoyos);
        if (currentProjectData) currentProjectData.apoyos = data.apoyos;
    } catch (e) { console.error('Error al apoyar proyecto:', e); }
}

// ¿colaborar en proyecto desde fuera del modal
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

// solicitudes en modal
async function renderModalSolicitudes(projectId) {
    const container = document.getElementById('modal-solicitudes-list');
    if (!container) return;
    container.innerHTML = '<p class="text-muted text-center"><i class="fa fa-spinner fa-spin"></i></p>';
    try {
        const res = await authFetch(`/proyectos/${projectId}/solicitudes`);
        if (!res.ok) { container.innerHTML = '<p class="text-muted text-center">Sin acceso.</p>'; return; }
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
                  <button class="btn btn-success btn-sm mr-1" onclick="responderSolicitud('${s._id}','ACEPTADA')">✓ Aceptar</button>
                  <button class="btn btn-danger btn-sm" onclick="responderSolicitud('${s._id}','RECHAZADA')">✗ Rechazar</button>
                </div>
              </div>
            </div>
          </div>`).join('');
    } catch (e) { container.innerHTML = '<p class="text-danger text-center">Error al cargar solicitudes.</p>'; }
}

// solicitudes recibidas de colab
async function loadMisSolicitudesRecibidas(userId) {
    const containerEl = document.getElementById('profile-solicitudes');
    if (!containerEl) return;

    try {
        const resUser = await authFetch('/usuarios/' + userId);
        const user = await resUser.json();
        const proyIds = (user.proyectos || []).map(p => typeof p === 'object' ? p._id : p);

        const todasSolicitudes = [];
        await Promise.all(proyIds.map(async pid => {
            const r = await authFetch(`/proyectos/${pid}/solicitudes`);
            if (r.ok) {
                const arr = await r.json();
                const proj = user.proyectos.find(p => (p._id || p) === pid);
                arr.forEach(s => todasSolicitudes.push({ ...s, proyNombre: proj?.nombre || 'Proyecto' }));
            }
        }));

        if (!todasSolicitudes.length) {
            containerEl.innerHTML = '<p class="text-muted text-center py-3">Sin solicitudes pendientes.</p>';
            return;
        }
        containerEl.innerHTML = todasSolicitudes.map(s => `
          <div class="card mb-2" id="solicitud-${s._id}">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong>${escH(s.solicitante?.nombre || s.solicitante?.nombreUsuario || 'Usuario')}</strong>
                  <small class="text-muted ml-2">para <em>${escH(s.proyNombre)}</em></small><br>
                  ${s.mensaje ? `<small class="text-muted">"${escH(s.mensaje)}"</small>` : ''}
                </div>
                <div class="d-flex">
                  <button class="btn btn-success btn-sm mr-1" onclick="responderSolicitud('${s._id}','ACEPTADA')">✓ Aceptar</button>
                  <button class="btn btn-danger btn-sm" onclick="responderSolicitud('${s._id}','RECHAZADA')">✗ Rechazar</button>
                </div>
              </div>
            </div>
          </div>`).join('');
    } catch (e) { console.error(e); }
}

async function responderSolicitud(solicitudId, accion) {
    try {
        const res = await authFetch('/solicitudes/' + solicitudId, {
            method: 'PUT',
            body: JSON.stringify({ accion })
        });
        if (res.ok) {
            document.getElementById('solicitud-' + solicitudId)?.remove();
            document.getElementById('msolicitud-' + solicitudId)?.remove();
        } else {
            const d = await res.json();
            alert(d.mensaje || 'Error');
        }
    } catch (e) { alert('Error de conexión'); }
}

// post en perfil
async function loadUserPosts(userId) {
    const container = document.getElementById('profile-posts');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-3 text-muted"><i class="fa fa-spinner fa-spin"></i> Cargando...</div>';
    try {
        const res = await authFetch(`/posts?usuarioId=${userId}&limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        const posts = data.publicaciones || [];
        if (!posts.length) {
            container.innerHTML = '<p class="text-muted text-center py-3">Sin publicaciones aún.</p>';
            return;
        }
        const me = getUser();
        container.innerHTML = posts.map(p => {
            const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-MX') : '';
            const isOwner = p.usuario?._id === me.id || me.rol === 'ADMIN';
            return `<div class="card mb-2"><div class="card-body">
              <p class="mb-1">${escH(p.cuerpo)}</p>
              <small class="text-muted">${fecha}</small>
              <div class="mt-2">
                <button class="btn-apoyo btn-sm" onclick="likePost('${p._id}',this)">
                  <i class="fa fa-heart"></i> ${p.apoyos?.length || 0}
                </button>
                <button class="btn-comentar btn-sm ml-2" onclick="loadPostDetails('${p._id}','${escH(p.usuario?.nombre || '')}','','${fecha}')">
                  <i class="fa fa-comment"></i> ${p.comentarios?.length || 0}
                </button>
                ${isOwner ? `<button class="btn-delete-small ml-2" onclick="deletePostProfile('${p._id}')"><i class="fa fa-trash"></i></button>` : ''}
              </div>
            </div></div>`;
        }).join('');
    } catch (e) { console.error(e); }
}

async function likePost(postId, btn) {
    try {
        const res = await authFetch('/posts/' + postId + '/like', { method: 'POST' });
        if (res.ok) {
            const d = await res.json();
            btn.innerHTML = `<i class="fa fa-heart"></i> ${d.apoyos}`;
            btn.classList.toggle('active', d.apoye);
        }
    } catch (e) { console.error(e); }
}

async function deletePostProfile(postId) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
        const res = await authFetch('/posts/' + postId, { method: 'DELETE' });
        if (res.ok) {
            const userId = (new URLSearchParams(window.location.search).get('id'))
                || getUser().id || getUser()._id;
            loadUserPosts(userId);
        }
    } catch (e) { alert('Error'); }
}

// detalle publicación modal
async function loadPostDetails(postId, authorName, avatarSrc, fecha) {
    try {
        const res = await authFetch('/posts/' + postId);
        const post = await res.json();
        const me = getUser();

        document.getElementById('post-author-name').textContent = post.usuario?.nombre || authorName;
        document.getElementById('pm-date').textContent = ' - ' + fecha;
        document.getElementById('pm-text').innerHTML = '<p>' + escH(post.cuerpo) + '</p>';
        const av = post.usuario?.fotoPerfil || avatarSrc ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(post.usuario?.nombre || '?')}`;
        document.getElementById('pm-author-avatar').src = av;

        if (post.proyecto?.nombre) {
            document.getElementById('pm-project-name').textContent = post.proyecto.nombre;
            document.getElementById('pm-category').textContent = post.proyecto.categoria || '';
        } else {
            document.getElementById('pm-project-name').textContent = '';
            document.getElementById('pm-category').textContent = 'Sin vincular';
        }

        const img = document.getElementById('pm-media');
        if (img) { if (post.imagen) { img.src = post.imagen; img.classList.remove('d-none'); } else img.classList.add('d-none'); }

        // Botones de apoyo y comentar con datos reales
        const likes = Array.isArray(post.apoyos) ? post.apoyos.length : 0;
        const comments = Array.isArray(post.comentarios) ? post.comentarios.length : 0;
        const yaApoye = me && Array.isArray(post.apoyos) && post.apoyos.includes(me.id);
        const apoyoBtn = document.getElementById('pm-apoyo-btn');
        const apoyoCount = document.getElementById('pm-apoyo-count');
        const comentarCount = document.getElementById('pm-comentar-count');
        if (apoyoCount) apoyoCount.textContent = `Apoyar ${likes}`;
        if (comentarCount) comentarCount.textContent = `Comentarios ${comments}`;
        if (apoyoBtn) { apoyoBtn.classList.toggle('active', yaApoye); apoyoBtn.dataset.postId = postId; }

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
                        // Actualizar contador
                        const newCount = commentsList.children.length;
                        if (comentarCount) comentarCount.textContent = `Comentarios ${newCount}`;
                    }
                } catch (e) { console.error(e); }
            };
        }

        $('#postModal').modal('show');
    } catch (e) { console.error('Error cargando detalle:', e); }
}

// like en modal
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
    } catch (e) { console.error(e); }
}

//guardar cambios en el perfil
async function handleSaveBio(userId) {
    const fotoFile = document.getElementById('edit-profile-foto-file');
    let nuevaFoto = document.getElementById('edit-profile-foto-url')?.value.trim();

    if (fotoFile?.files.length > 0) {
        const fd = new FormData();
        fd.append('imagen', fotoFile.files[0]);
        try {
            const uploadRes = await fetch('/usuarios/' + userId + '/foto', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + getToken() },
                body: fd
            });
            if (uploadRes.ok) {
                const up = await uploadRes.json();
                nuevaFoto = up.fotoPerfil;
            }
        } catch (e) { console.error('Error subiendo imagen:', e); }
    }

    const updates = {};
    const f = id => document.getElementById(id)?.value.trim();
    if (f('edit-profile-nombre')) updates.nombre = f('edit-profile-nombre');
    if (f('edit-profile-bio-short')) updates.biografia = f('edit-profile-bio-short');
    if (f('edit-profile-bio-long')) updates.sobreMi = f('edit-profile-bio-long');
    if (f('edit-profile-habil')) updates.habilidades = f('edit-profile-habil').split(',').map(h => h.trim()).filter(Boolean);
    if (nuevaFoto) updates.fotoPerfil = nuevaFoto;
    if (f('edit-profile-carrera')) updates.carrera = f('edit-profile-carrera');
    if (f('edit-profile-universidad')) updates.universidad = f('edit-profile-universidad');
    if (f('edit-profile-ciudad')) updates.ciudad = f('edit-profile-ciudad');

    if (!Object.keys(updates).length) { alert('No hay cambios para guardar.'); return; }

    try {
        const res = await authFetch('/usuarios/' + userId, { method: 'PUT', body: JSON.stringify(updates) });
        if (res.ok) {
            await loadProfile(userId, true);
            const stored = getUser();
            if (stored && userId === stored.id) {
                const full = await (await authFetch('/usuarios/' + userId)).json();
                Object.assign(stored, { nombre: full.nombre, fotoPerfil: full.fotoPerfil });
                localStorage.setItem('user', JSON.stringify(stored));
                populateNavbar();
            }
            $('#editBioModal').modal('hide');
        } else {
            const d = await res.json();
            alert(d.mensaje || 'Error al guardar cambios');
        }
    } catch (e) { alert('Error de conexión'); }
}

// crear priyecto
async function handleCreateProject(userId) {
    const nombre = document.getElementById('create-proj-nombre')?.value.trim();
    const categoria = document.getElementById('create-proj-categoria')?.value;
    const descripcion = document.getElementById('create-proj-descripcion')?.value.trim();
    const vision = document.getElementById('create-proj-vision')?.value.trim() || '';
    const mision = document.getElementById('create-proj-mision')?.value.trim() || '';

    if (!nombre) { alert('El nombre del proyecto es obligatorio'); return; }
    if (!categoria) { alert('Selecciona una categoría'); return; }
    if (!descripcion || descripcion.length < 10) { alert('La descripción debe tener al menos 10 caracteres'); return; }

    try {
        const res = await authFetch('/proyectos', { method: 'POST', body: JSON.stringify({ nombre, categoria, descripcion, vision, mision }) });
        if (res.ok) {
            $('#createProjectModal').modal('hide');
            // Limpiar campos
            ['create-proj-nombre', 'create-proj-descripcion', 'create-proj-vision', 'create-proj-mision'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
            const cat = document.getElementById('create-proj-categoria'); if (cat) cat.value = '';
            await loadProfile(userId, true);
        } else {
            const d = await res.json();
            alert(d.mensaje || 'Error');
        }
    } catch (e) { alert('Error de conexión'); }
}

// follow/unfollow
async function handleFollow(targetUserId, btn) {
    try {
        const res = await authFetch('/usuarios/' + targetUserId + '/seguir', { method: 'POST' });
        if (!res.ok) return;
        const data = await res.json();
        btn.textContent = data.siguiendo ? 'Dejar de seguir' : 'Seguir';
        const segEl = document.getElementById('profile-seguidores');
        if (segEl && data.totalSeguidores !== undefined)
            segEl.textContent = data.totalSeguidores + ' seguidores';
    } catch (e) { console.error(e); }
}

// helpers
function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
