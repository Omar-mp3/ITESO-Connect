"use strict";

const router = require('express').Router();
const path   = require('path');
const userRouter = require('../routes/users');
const postRouter = require('../routes/posts');
const projectRouter= require('../routes/projects');
const commentRouter= require('../routes/comments');
const messageRouter= require('../routes/messages');
const adminRouter= require('../routes/admin');
const collabRouter = require('../routes/collaborations');

const authMiddleware  = require('../middleware/auth');
const userController  = require('./User');

// Auth
router.post('/login', userController.login);

// Usuarios 
router.use('/usuarios', userRouter);

// Posts
router.use('/posts', authMiddleware, postRouter);

// Proyectos
router.use('/proyectos', authMiddleware, projectRouter);

// Comentarios
router.use('/comentarios', authMiddleware, commentRouter);

// Mensajes 
router.use('/mensajes', authMiddleware, messageRouter);

// Solicitudes
router.use('/', authMiddleware, collabRouter);   

// Admin
router.use('/admin', adminRouter);

// Vistas
const viewsPath = path.join(__dirname, '../views');
router.get('/',(req, res) => res.sendFile(path.join(viewsPath, 'home.html')));
router.get('/home.html', (req, res) => res.sendFile(path.join(viewsPath, 'home.html')));
router.get('/user-feed.html', (req, res) => res.sendFile(path.join(viewsPath, 'user-feed.html')));
router.get('/profile.html',(req, res) => res.sendFile(path.join(viewsPath, 'profile.html')));
router.get('/inbox.html', (req, res) => res.sendFile(path.join(viewsPath, 'inbox.html')));
router.get('/admin.html', (req, res) => res.sendFile(path.join(viewsPath, 'admin.html')));
router.get('/error.html',(req, res) => res.sendFile(path.join(viewsPath, 'error.html')));

module.exports = router;
