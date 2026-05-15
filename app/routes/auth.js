"use strict";
const router = require('express').Router();
const userController = require('../controllers/User');

router.post('/login', userController.login);
router.post('/registro', userController.crearUsuario);

module.exports = router;
