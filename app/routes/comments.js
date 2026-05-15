"use strict";

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/Comment');

router.get('/', commentController.obtenerComentarios);
router.post('/', commentController.crearComentario);
router.delete('/:id', commentController.eliminarComentario);

module.exports = router;