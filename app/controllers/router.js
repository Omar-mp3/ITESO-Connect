"use strict";

const router = require('express').Router();
const userRouter = require('../routes/users');
const postRouter = require('../routes/posts');
const authMiddleware = require('../middleware/auth'); // Importar el middleware de autenticación
const userController = require('./User'); // Para la función de login
const commentRouter = require('../routes/comments');
const messageRouter= require('../routes/messages');

// --- Usuarios ---
router.use('/usuarios', userRouter); 

// --- Posts ---
router.use('/posts', postRouter);
router.post('/posts', authMiddleware, postRouter); // Ejemplo: proteger la creación de posts

// --- Comentarios ---
router.use('/comentarios', commentRouter);

// --- Mensajes / conversaciones ---
router.use('/mensajes', authMiddleware, messageRouter); // Ejemplo: proteger rutas de mensajes

router.post('/login', userController.login); // Ruta para el login
module.exports = router;