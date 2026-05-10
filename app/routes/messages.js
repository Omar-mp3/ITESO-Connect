"use strict";

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/Message');

router.get('/conversaciones', messageController.obtenerConversaciones);
router.get('/conversaciones/:id/mensajes', messageController.obtenerMensajes);
router.post('/mensajes', messageController.crearMensaje);
router.delete('/mensajes/:id', messageController.eliminarMensaje);

module.exports = router;