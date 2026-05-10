"use strict";

const express = require('express');
const router = express.Router();
const postController = require('../controllers/Post');

// Relativo a '/posts'
router.route('/').get(postController.obtenerPublicaciones);
router.route('/').post(postController.crearPublicacion);
router.route('/:id').get(postController.obtenerPublicacion);
router.route('/:id').put(postController.editarPublicacion);
router.route('/:id').delete(postController.eliminarPublicacion);

module.exports = router;