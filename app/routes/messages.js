"use strict";

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/Message');

router.get('/conversaciones', messageController.obtenerConversaciones);
router.get('/conversaciones/:id/mensajes', messageController.obtenerMensajes);
router.get('/no-leidos', messageController.noLeidos);
router.post('/', messageController.crearMensaje);
router.delete('/:id', messageController.eliminarMensaje);

module.exports = router;