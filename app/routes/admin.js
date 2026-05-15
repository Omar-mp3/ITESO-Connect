"use strict";

const router = require('express').Router();
const userController = require('../controllers/User');
const projectController = require('../controllers/Project');
const postController = require('../controllers/Post');
const commentController = require('../controllers/Comment');
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(authMiddleware);
router.use(isAdmin);

// Usuarios
router.get('/usuarios', userController.obtenerUsuarios);
router.delete('/usuarios/:id', userController.eliminarUsuario);
router.put('/usuarios/:id/rol', userController.cambiarRol);

// Proyectos
router.get('/proyectos', projectController.obtenerProyectos);
router.delete('/proyectos/:id', projectController.eliminarProyecto);

// Publicaciones
router.get('/posts', postController.obtenerPublicaciones);
router.delete('/posts/:id', postController.eliminarPublicacion);

// Comentarios
router.get('/comentarios', commentController.obtenerComentarios);
router.delete('/comentarios/:id', commentController.eliminarComentario);

module.exports = router;
