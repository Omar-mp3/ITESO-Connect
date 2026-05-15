"use strict";

// logni
async function handleLogin(){
    const correo    = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value;
    const errDiv    = document.getElementById('loginError');

    // Validación cliente
    if(!correo){
        showModalError(errDiv, 'El correo es obligatorio'); return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)){
        showModalError(errDiv, 'Formato de correo inválido'); return;
    }
    if(!contrasena || contrasena.length < 6){
        showModalError(errDiv, 'La contraseña debe tener al menos 6 caracteres'); return;
    }

    const btn = document.getElementById('loginBtn');
    if(btn){ btn.disabled=true; btn.textContent='Iniciando...'; }
    hideModalError(errDiv);

    try {
        const response = await fetch('/login', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({correo, contrasena})
        });
        const data = await response.json();
        if(response.ok){
            saveSession(data.token, data.usuario);
            window.location.href = 'user-feed.html';
        } else {
            showModalError(errDiv, data.mensaje || 'Credenciales incorrectas');
        }
    } catch(err){
        showModalError(errDiv, 'Error de conexión. Intenta de nuevo.');
    } finally {
        if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión →'; }
    }
}

// Registro
async function handleRegister(){
    const nombre = document.getElementById('regNombre').value.trim();
    const exp = document.getElementById('regExpediente').value.trim();
    const usuario = document.getElementById('regUser').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const errDiv = document.getElementById('regError');

    // Validaciones cliente
    if(!nombre) { showModalError(errDiv,'El nombre es obligatorio'); return; }
    if(!exp) { showModalError(errDiv,'El expediente es obligatorio'); return; }
    if(!usuario || usuario.length < 3) { showModalError(errDiv,'Nombre de usuario muy corto (mín. 3 caracteres)'); return; }
    if(!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { showModalError(errDiv,'Correo inválido'); return; }
    if(!pass || pass.length < 6) { showModalError(errDiv,'La contraseña debe tener al menos 6 caracteres'); return; }
    if(pass !== confirm) { showModalError(errDiv,'Las contraseñas no coinciden'); return; }

    hideModalError(errDiv);
    const btn = document.getElementById('registerBtn');
    if(btn){ btn.disabled=true; btn.textContent='Registrando...'; }

    try {
        const response = await fetch('/usuarios', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({nombre, expediente:exp, nombreUsuario:usuario, correo, contrasena:pass})
        });
        const data = await response.json();
        if(response.ok){
            alert('¡Cuenta creada! Ahora inicia sesión.');
            $('#regModal').modal('hide');
            $('#login').modal('show');
        } else {
            showModalError(errDiv, data.mensaje || 'Error en el registro');
        }
    } catch(err){
        showModalError(errDiv, 'Error de conexión');
    } finally {
        if(btn){ btn.disabled=false; btn.textContent='Registrar cuenta →'; }
    }
}

function showModalError(el, msg){
    if(!el) return;
    el.textContent = msg;
    el.style.display = 'block';
}
function hideModalError(el){
    if(!el) return;
    el.style.display = 'none';
}

// inicializar
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if(loginBtn) loginBtn.addEventListener('click', handleLogin);

    const registerBtn = document.getElementById('registerBtn');
    if(registerBtn) registerBtn.addEventListener('click', handleRegister);

    // Enter en inputs de login
    ['loginEmail','loginPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
    });

    // Redirigir a feed si ya hay sesión (en home)
    if(window.location.pathname.endsWith('home.html') || window.location.pathname === '/'){
        if(typeof isLoggedIn === 'function' && isLoggedIn()){
            window.location.href = 'user-feed.html';
        }
    }
});