const router = require('express').Router();
const userController = require('../controllers/User');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');

router.get('/', userController.obtenerUsuarios);
router.get('/:id', userController.obtenerUsuario);
router.post('/', userController.crearUsuario);
router.put('/:id', authMiddleware, userController.editarUsuario);
router.delete('/:id', authMiddleware, userController.eliminarUsuario);
router.put('/:id/rol', authMiddleware, userController.cambiarRol);
router.post('/:id/foto', authMiddleware, upload.single('imagen'), userController.subirFoto);
router.post('/:id/seguir', authMiddleware, userController.seguirUsuario)

module.exports = router;
