const Comentario = require('../models/Comment');

// /comentarios -GET
async function obtenerComentarios(req, res) {
    try {
        let comentarios = await Comentario.find();
        res.status(200).json(comentarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener comentarios' });
    }
}

// /comentarios/ -POST
async function crearComentario(req, res) {
    try {
        let nuevoComentario = new Comentario(req.body);
        await nuevoComentario.save();
        res.status(201).json({ mensaje: 'Comentario creado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear comentario' });
    }
}


// /comentarios/:id -DELETE

async function eliminarComentario(req, res) {
    try {
        let comentario = await Comentario.findByIdAndDelete(req.params.id);
        if (!comentario) {
            return res.status(404).json({ mensaje: 'Comentario no encontrado' });
        }
        res.status(200).json({ mensaje: 'Comentario eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar comentario' });
    }
}

module.exports = { obtenerComentarios, crearComentario, eliminarComentario };