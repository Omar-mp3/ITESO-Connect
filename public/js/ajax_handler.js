"use strict";

function postToHTML(post){
    let projectSnippet = '';

    if(post.proyecto){
        projectSnippet = `
            <small class="text-muted">
                Emprendimiento: 
                <span class="post-project-name">
                  <a href="#" data-toggle="modal" data-target="#projectModal" style="color: inherit">
                    ${post.proyecto.nombre}
                  </a>
                </span>
            </small>
            <span class="post-category-badge">
                ${post.proyecto.categoria}
            </span>
        `
    } else {
        projectSnippet = `
            <small class="text-muted"><span class="post-project-name"></span></small>
            <span class="post-category-badge">Sin vincular</span>       
        `;
    }

    let postHTML = `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center mb-2">
              <img src="${post.usuario.fotoPerfil}" class="rounded-circle mr-2" width="40" height="40" alt="foto" style="object-fit:cover;">
              <div>
                <strong>
                  <a href="profile.html" style="color: inherit;">
                    ${post.usuario.nombre}
                  </a>
                </strong>
                <br>
                <small class="text-muted">${post.fecha}</small>
              </div>
            </div>
            ${projectSnippet}
            <p class="card-text">${post.cuerpo}</p>
                <button class="btn-apoyo" onclick="handleLike('${post._id}')">
                  <i class="fa fa-heart"></i>
                  <span>Apoyar ${post.apoyos ? post.apoyos.length : 0}</span>
                </button>
                <button class="btn-comentar" data-toggle="modal" data-target="#postModal" onclick="loadPostDetails('${post._id}')">
                  <i class="fa fa-comment"></i>
                    Comentar ${post.comentarios ? post.comentarios.length : 0}
                </button>
          </div>
        </div>
    `;
    return postHTML;
}

async function loadPosts(url){
    try {
        let response = await fetch(url);
        if(response.status != 200) return null;
        let posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error("Error cargando publicaciones:", error);
    }
}

function renderPosts(posts) {
    const feedContainer = document.getElementById('feed-container');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = posts.map(post => postToHTML(post)).join('');
}

// Gestión de Apoyos 
async function handleLike(postId) {
    const response = await fetch(`/posts/${postId}/like`, { method: 'POST' });
    if (response.ok) {
        // Recargar posts o actualizar el contador localmente
        loadPosts('/posts');
    }
}

// Cargar detalles en el modal de publicación
async function loadPostDetails(postId) {
    const response = await fetch(`/posts/${postId}`);
    const post = await response.json();
    
    document.getElementById('post-author-name').innerText = post.usuario.nombre;
    document.getElementById('pm-text').innerHTML = `<p>${post.cuerpo}</p>`;

    
    // Aquí cargarías los comentarios dinámicamente

}

// Manejo del formulario de nueva publicación
async function createPost(event) {
    event.preventDefault();
    const formData = {
        cuerpo: document.getElementById('postDescription').value,
        proyecto: document.getElementById('projectSelect').value !== 'none' ? 
                   document.getElementById('projectSelect').value : null,
        usuario: "ID_DEL_USUARIO_ACTUAL" // Esto debería venir del auth/session
    };

    const response = await fetch('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (response.ok) {
        $('#newPostModal').modal('hide');
        loadPosts('/posts');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('feed-container')) {
        loadPosts('/posts');
    }
    
    const postForm = document.getElementById('newPostForm');
    if (postForm) {
        document.getElementById('publishBtn').addEventListener('click', createPost);
    }
});