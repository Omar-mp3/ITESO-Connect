"use strict";
const router = require('express').Router();
const ctrl   = require('../controllers/CollaborationRequest');

// Se solicita colaboración en un proyecto
router.post('/proyectos/:id/solicitudes', ctrl.crearSolicitud);
// Ver solicitudes de un proyecto
router.get('/proyectos/:id/solicitudes',  ctrl.obtenerSolicitudes);
// Ver mis solicitudes enviadas
router.get('/solicitudes/mias',  ctrl.misSolicitudes);
// Aceptar o rechazar una solicitud
router.put('/solicitudes/:id',  ctrl.responderSolicitud);

module.exports = router;
