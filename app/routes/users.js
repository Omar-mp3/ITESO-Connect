"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../controllers/User');

// Como el router se monta en '/usuarios' en router.js, aquí usamos '/'
router.route('/').get(userController.obtenerUsuarios); 
router.route('/').post(userController.crearUsuario);
router.route('/:id').get(userController.obtenerUsuario);
router.route('/:id').put(userController.editarUsuario);
router.route('/:id').delete(userController.eliminarUsuario);
router.route('/:id/rol').put(userController.cambiarRol);

module.exports = router;