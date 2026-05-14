const router = require('express').Router();
const userController = require('../controllers/User');

router.get('/', userController.obtenerUsuarios);
router.get('/:id', userController.obtenerUsuario);
router.post('/', userController.crearUsuario);
router.put('/:id', userController.editarUsuario);
router.delete('/:id', userController.eliminarUsuario);
router.put('/:id/rol', userController.cambiarRol);

module.exports = router;