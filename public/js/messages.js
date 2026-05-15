"use strict";

document.addEventListener('DOMContentLoaded', async () => {
    if(!requireAuth()) return;
    populateNavbar();
    initLogoutButtons();
    await loadConversaciones();

    // Detectar si venimos de un perfil para iniciar chat
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if(userId) {
        try {
            const res = await authFetch('/usuarios/' + userId);
            const u = await res.json();
            const avatar = u.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre||u.nombreUsuario)}&background=4F46E5&color=fff`;
            startConversacion(u._id, u.nombre || u.nombreUsuario, avatar);
        } catch(e) { console.error("Error al auto-iniciar chat", e); }
    }

    // Búsqueda de usuarios para nueva conversación
    const searchInput = document.getElementById('user-search');
    if(searchInput){
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            const q = searchInput.value.trim();
            if(!q){ loadConversaciones(); return; }
            timeout = setTimeout(() => searchUsers(q), 400);
        });
    }

    // Botón enviar
    const msgInput = document.getElementById('pm-comment-input');
    const sendBtn  = document.getElementById('pm-send-btn');
    if(msgInput && sendBtn){
        msgInput.addEventListener('input',   () => sendBtn.disabled = !msgInput.value.trim());
        msgInput.addEventListener('keydown', e => { if(e.key==='Enter' && !sendBtn.disabled) sendBtn.click(); });
        sendBtn.addEventListener('click', sendMessage);
    }
});

let currentConvId        = null;
let currentDestinatarioId = null;

// cargar lista conversaciones
async function loadConversaciones(){
    const container = document.querySelector('.contacts_body ul');
    if(!container) return;
    container.innerHTML = '<li class="text-center text-muted py-3"><i class="fa fa-spinner fa-spin"></i></li>';
    try {
        const res  = await authFetch('/mensajes/conversaciones');
        if(!res.ok) throw new Error();
        const convs = await res.json();
        if(!convs.length){
            container.innerHTML = '<li class="text-center text-muted py-3">Sin conversaciones aún. Busca un usuario para iniciar.</li>';
            return;
        }
        const me = getUser();
        container.innerHTML = convs.map(conv => {
            const other    = conv.participantes.find(p => (p._id||p) !== me.id) || conv.participantes[0];
            const nombre   = other?.nombre || other?.nombreUsuario || 'Usuario';
            const avatar   = other?.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=7C3AED&color=fff`;
            const lastMsg  = conv.ultimoMensaje ? conv.ultimoMensaje.substring(0,30)+'…' : 'Sin mensajes';
            return `<li onclick="openConversacion('${conv._id}','${other?._id}','${escH(nombre)}','${escH(avatar)}')" style="cursor:pointer;">
              <div class="d-flex bd-highlight align-items-center p-2">
                <div class="img-cont mr-2"><img src="${escH(avatar)}" alt="${escH(nombre)}" class="rounded-circle" width="40" height="40"></div>
                <div class="user-info">
                  <span class="font-weight-bold">${escH(nombre)}</span>
                  <p class="small text-muted mb-0">${escH(lastMsg)}</p>
                </div>
              </div>
            </li>`;
        }).join('');
    } catch(e){
        console.error(e);
        container.innerHTML = '<li class="text-muted text-center py-2">Error al cargar conversaciones</li>';
    }
}

// buscar usuarios para iniciar conversación
async function searchUsers(q){
    const container = document.querySelector('.contacts_body ul');
    if(!q){ loadConversaciones(); return; }
    try {
        const res  = await authFetch('/usuarios?search='+encodeURIComponent(q)+'&limit=10');
        const data = await res.json();
        const me   = getUser();
        const users = (data.usuarios||[]).filter(u => u._id !== me.id);
        if(!users.length){
            container.innerHTML = '<li class="text-muted text-center py-2">Sin resultados</li>';
            return;
        }
        container.innerHTML = users.map(u => {
            const avatar = u.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre||u.nombreUsuario)}&background=4F46E5&color=fff`;
            return `<li onclick="startConversacion('${u._id}','${escH(u.nombre||u.nombreUsuario)}','${escH(avatar)}')" style="cursor:pointer;">
              <div class="d-flex bd-highlight align-items-center p-2">
                <div class="img-cont mr-2"><img src="${escH(avatar)}" class="rounded-circle" width="40" height="40"></div>
                <div class="user-info">
                  <span class="font-weight-bold">${escH(u.nombre||u.nombreUsuario)}</span>
                  <p class="small text-muted mb-0">@${escH(u.nombreUsuario)}</p>
                </div>
              </div>
            </li>`;
        }).join('');
    } catch(e){ console.error(e);}
}
//Abrir conversación existente
async function openConversacion(convId, destinatarioId, nombre, avatar){
    currentConvId         = convId;
    currentDestinatarioId = destinatarioId;
    updateChatHeader(nombre, avatar);
    showChatLoading();
    try {
        const res  = await authFetch('/mensajes/conversaciones/'+convId+'/mensajes');
        if(!res.ok) throw new Error();
        const msgs = await res.json();
        renderMensajes(msgs);
    } catch(e){
        document.querySelector('.msg-card-body').innerHTML = '<p class="text-center text-danger py-4">Error al cargar mensajes.</p>';
    }
    document.getElementById('pm-comment-input')?.focus();
}

//iniciar conversación nueva 
function startConversacion(userId, nombre, avatar){
    currentDestinatarioId = userId;
    currentConvId         = null;
    updateChatHeader(nombre, avatar);
    document.querySelector('.msg-card-body').innerHTML =
        '<p class="text-center text-muted py-4">Escribe un mensaje para iniciar la conversación.</p>';
    document.getElementById('pm-comment-input')?.focus();
}

function updateChatHeader(nombre, avatar){
    const headerName = document.getElementById('chat-header-name') ||
                       document.querySelector('.card-header.msg-head .user-info span');
    const headerImg  = document.getElementById('chat-header-avatar') ||
                       document.querySelector('.card-header.msg-head .img-cont img');
    const headerSub  = document.getElementById('chat-header-sub');
    if(headerName) headerName.textContent = 'Chat con ' + nombre;
    if(headerImg)  headerImg.src = avatar;
    if(headerSub)  headerSub.textContent = '';
}

function showChatLoading(){
    const container = document.querySelector('.msg-card-body');
    if(container) container.innerHTML = '<p class="text-center text-muted py-4"><i class="fa fa-spinner fa-spin"></i></p>';
}

// Renderizar mensajes
function renderMensajes(msgs){
    const me        = getUser();
    const container = document.querySelector('.msg-card-body');
    if(!container) return;
    if(!msgs.length){
        container.innerHTML = '<p class="text-center text-muted py-4">Aún sin mensajes</p>';
        return;
    }
    container.innerHTML = msgs.map(m => {
        const isMine = (m.remitente?._id || m.remitente) === me.id;
        const hora   = m.fecha ? new Date(m.fecha).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}) : '';
        if(isMine){
            return `<div class="d-flex justify-content-end mb-4">
              <div class="msg-container-send bg-primary text-white p-2 rounded">
                ${escH(m.contenido)}
                <span class="msg-time-send d-block small text-white-50">${hora}</span>
              </div>
            </div>`;
        } else {
            const rAvatar = m.remitente?.fotoPerfil ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(m.remitente?.nombre||'?')}&size=35`;
            return `<div class="d-flex justify-content-start mb-4">
              <div class="img-cont-msg mr-2"><img src="${escH(rAvatar)}" class="rounded-circle" width="35"></div>
              <div class="msg-container bg-light p-2 rounded">
                ${escH(m.contenido)}
                <span class="msg-time d-block small text-muted">${hora}</span>
              </div>
            </div>`;
        }
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// Enviar mensaje
async function sendMessage(){
    const input   = document.getElementById('pm-comment-input');
    const sendBtn = document.getElementById('pm-send-btn');
    if(!input?.value.trim()) return;
    if(!currentDestinatarioId){ alert('Selecciona un usuario para enviar el mensaje'); return; }

    const contenido = input.value.trim();
    sendBtn.disabled = true;

    try {
        // POST /mensajes  
        const res = await authFetch('/mensajes', {
            method: 'POST',
            body:   JSON.stringify({ destinatario: currentDestinatarioId, contenido })
        });
        if(res.ok){
            const msg = await res.json();
            if(!currentConvId) currentConvId = msg.conversacion;
            const hora = new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
            const container = document.querySelector('.msg-card-body');
            // Quitar placeholder si lo hay
            const placeholder = container.querySelector('p.text-muted');
            if(placeholder) placeholder.remove();

            container.innerHTML += `<div class="d-flex justify-content-end mb-4">
              <div class="msg-container-send bg-primary text-white p-2 rounded">
                ${escH(contenido)}
                <span class="msg-time-send d-block small text-white-50">${hora}</span>
              </div>
            </div>`;
            container.scrollTop = container.scrollHeight;
            input.value = '';
            // Actualizar lista de conversaciones sin cerrar el chat activo
            loadConversaciones();
        } else {
            const d = await res.json();
            alert(d.mensaje || 'Error al enviar');
        }
    } catch(e){
        console.error(e);
        alert('Error de conexión');
    } finally {
        sendBtn.disabled = !input.value.trim();
    }
}

// refresca mensajes cada 5 segundos si hay conversación activa 
let pollingInterval = null;

function startPolling(){
    stopPolling();
    pollingInterval = setInterval(async () => {
        if(!currentConvId) return;
        try {
            const res = await authFetch('/mensajes/conversaciones/'+currentConvId+'/mensajes');
            if(res.ok){
                const msgs = await res.json();
                renderMensajes(msgs);
            }
        } catch(e){}
    }, 5000);
}

function stopPolling(){
    if(pollingInterval) clearInterval(pollingInterval);
    pollingInterval = null;
}

// Iniciar polling al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    startPolling();
});
