"use strict";

function isAdmin(req, res, next) {
    if (req.user && req.user.rol === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado, se requiere rol de administrador' });
    }
}

module.exports = isAdmin;
