"use strict";

const express = require('express');
const router = express.Router();
const commentController = require('./Comment');

router.get('/comentarios', commentController.obtenerComentarios);
router.post('/comentarios', commentController.crearComentario);
router.delete('/comentarios/:id', commentController.eliminarComentario);

module.exports = router;