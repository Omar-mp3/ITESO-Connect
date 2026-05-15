const router = require('express').Router();
const projectController = require('../controllers/Project');

router.get('/', projectController.obtenerProyectos);
router.get('/:id', projectController.obtenerProyecto);
router.post('/', projectController.crearProyecto);
router.put('/:id', projectController.editarProyecto);
router.delete('/:id', projectController.eliminarProyecto);
router.post('/:id/apoyar', projectController.apoyarProyecto);
router.post('/:id/colaboradores', projectController.agregarColaborador);

module.exports = router;
