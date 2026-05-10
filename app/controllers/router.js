"use strict";

const router = require('express').Router();
const userRouter = require('../routes/users');
const postRouter = require('../routes/posts');
const commentRouter = require('../routes/comments');
const messageRouter= require('../routes/messages');

// --- Usuarios ---
router.use('/usuarios', userRouter); // Centraliza todo lo que empiece con /usuarios

// --- Posts ---
router.use('/posts', postRouter);


// --- Comentarios ---
router.use('/comentarios', commentRouter);

// --- Mensajes / conversaciones ---
// Montamos messageRouter en la raíz o en un prefijo común ya que maneja /mensajes y /conversaciones
router.use('/', messageRouter);


// --- Login ---
/*
router.post('/login', (req, res) => {
    
});
*/
module.exports = router;