const Publicacion = require('../models/Post');
const Comentario = require('../models/Comment');
const Proyecto = require('../models/Project');
const Usuario = require('../models/User');

// /posts -GET
async function obtenerPublicaciones(req, res) {
    try {
        // Poblamos el usuario pero excluimos la contraseña por seguridad
        let publicaciones = await Publicacion.find()
            .populate('usuario', '-contrasena')
            .populate('proyecto', 'nombre'); // También podemos traer el nombre del proyecto
            
        res.status(200).json(publicaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicaciones' });
    }
}

// /posts/:id -GET
async function obtenerPublicacion(req, res) {
    try {
        let publicacion = await Publicacion.findById(req.params.id);
        if (!publicacion) {
            return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }
        res.status(200).json(publicacion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicación' });
    }
}

// /posts -POST
async function crearPublicacion(req, res) {
    try {
        let nuevaPublicacion = new Publicacion(req.body);
        await nuevaPublicacion.save();
        res.status(201).json({ mensaje: 'Publicación creada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear publicación' });
    }
}

// /posts/:id -PUT
async function editarPublicacion(req, res) {
    try {
        let publicacion = await Publicacion.findByIdAndUpdate(req.params.id, req.body);
        if(!publicacion){
            res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }
        res.status(200).json({ mensaje: 'Publicación actualizada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar publicación' });
    }
}

// /posts/:id -DELETE
// Sólo pueden usarla admin y dueño
async function eliminarPublicacion(req, res) {
    try {
        let publicacion = await Publicacion.findByIdAndDelete(req.params.id);
        if(!publicacion){
            res.status(404).json({ mensaje: 'Publicación no encontrada' });
        }
        res.status(200).json({ mensaje: 'Publicación eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar publicación' }); 
        }
}

module.exports = { obtenerPublicaciones, obtenerPublicacion, crearPublicacion, editarPublicacion, eliminarPublicacion };