const router = require('express').Router();
const postController = require('../controllers/Post');

router.get('/', postController.obtenerPublicaciones);
router.get('/:id', postController.obtenerPublicacion);
router.post('/', postController.crearPublicacion);
router.put('/:id', postController.editarPublicacion);
router.delete('/:id', postController.eliminarPublicacion);

module.exports = router;