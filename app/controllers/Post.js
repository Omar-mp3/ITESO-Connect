"use strict";

const Publicacion = require('../models/Post');
const Comentario = require('../models/Comment');
const Proyecto = require('../models/Project');
const Usuario = require('../models/User');


function validarPublicacion(body) {
    const errores = [];
    if (!body.cuerpo || body.cuerpo.trim().length < 1) errores.push('El cuerpo es obligatorio');
    if (body.cuerpo && body.cuerpo.length > 2000) errores.push('El cuerpo no puede exceder 2000 caracteres');
    return errores;
}
// /posts -GET
async function obtenerPublicaciones(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const search = req.query.search ? req.query.search.trim() : '';

        
        const usuarioId = (req.query.usuarioId && req.query.usuarioId !== 'undefined' && req.query.usuarioId !== 'null')
            ? req.query.usuarioId
            : null;

        const filtro = search ? { cuerpo: { $regex: search, $options: 'i' } } : {};
        if (usuarioId) filtro.usuario = usuarioId;

        const [publicaciones, total] = await Promise.all([
            Publicacion.find(filtro)
                .populate('usuario', '-contrasena')
                .populate('proyecto', 'nombre categoria')
                .sort({ fecha: -1 })
                .skip(skip)
                .limit(limit),
            Publicacion.countDocuments(filtro)
        ]);

        res.status(200).json({
            publicaciones,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener publicaciones' });
    }
}

// /posts/:id -GET
async function obtenerPublicacion(req, res) {
    try {
        let publicacion = await Publicacion.findById(req.params.id)
            .populate('usuario', '-contrasena')
            .populate('proyecto', 'nombre categoria')
            .populate({
                path: 'comentarios',
                populate: { path: 'usuario', select: 'nombre nombreUsuario fotoPerfil' }
            });
        if (!publicacion) return res.status(404).json({ mensaje: 'Publicación no encontrada' });
        res.status(200).json(publicacion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener publicación' });
    }
}

// /posts -POST
async function crearPublicacion(req, res) {
    try {
        const errores = validarPublicacion(req.body);
        if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });

        const datos = {
            titulo: (req.body.titulo || '').trim(),
            cuerpo: req.body.cuerpo.trim(),
            usuario: req.user.id,
            proyecto: req.body.proyecto || null,
            imagen: req.body.imagen || null,
            fecha: new Date()
        };

        let nuevaPublicacion = new Publicacion(datos);
        await nuevaPublicacion.save();
        await nuevaPublicacion.populate('usuario', '-contrasena');
        await nuevaPublicacion.populate('proyecto', 'nombre categoria');
        res.status(201).json(nuevaPublicacion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear publicación' });
    }
}

// /posts/:id -PUT
async function editarPublicacion(req, res) {
    try {
        const publicacion = await Publicacion.findById(req.params.id);
        if (!publicacion) return res.status(404).json({ mensaje: 'Publicación no encontrada' });

        
        if (publicacion.usuario.toString() !== req.user.id && req.user.rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'No tienes permiso para editar esta publicación' });
        }

        const errores = validarPublicacion({ cuerpo: req.body.cuerpo || publicacion.cuerpo });
        if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });

        const actualizado = await Publicacion.findByIdAndUpdate(
            req.params.id,
            { cuerpo: req.body.cuerpo || publicacion.cuerpo, titulo: req.body.titulo !== undefined ? req.body.titulo : publicacion.titulo, imagen: req.body.imagen },
            { new: true }
        ).populate('usuario', '-contrasena').populate('proyecto', 'nombre categoria');

        res.status(200).json(actualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar publicación' });
    }
}

// /posts/:id -DELETE

async function eliminarPublicacion(req, res) {
    try {
        const publicacion = await Publicacion.findById(req.params.id);
        if (!publicacion) return res.status(404).json({ mensaje: 'Publicación no encontrada' });

        if (publicacion.usuario.toString() !== req.user.id && req.user.rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta publicación' });
        }

        
        await Comentario.deleteMany({ publicacion: req.params.id });
        await Publicacion.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: 'Publicación eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar publicación' });
    }
}

// POST /posts/:id/like
async function apoyarPublicacion(req, res) {
    try {
        const publicacion = await Publicacion.findById(req.params.id);
        if (!publicacion) return res.status(404).json({ mensaje: 'Publicación no encontrada' });

        const userId = req.user.id;
        const idx = publicacion.apoyos.indexOf(userId);
        if (idx === -1) {
            publicacion.apoyos.push(userId);
        } else {
            publicacion.apoyos.splice(idx, 1);
        }
        await publicacion.save();
        res.status(200).json({ apoyos: publicacion.apoyos.length, apoye: idx === -1 });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al apoyar publicación' });
    }
}

// POST /posts/:id/comentarios
async function agregarComentario(req, res) {
    try {
        if (!req.body.contenido || !req.body.contenido.trim()) {
            return res.status(400).json({ mensaje: 'El comentario no puede estar vacío' });
        }
        const publicacion = await Publicacion.findById(req.params.id);
        if (!publicacion) return res.status(404).json({ mensaje: 'Publicación no encontrada' });

        const comentario = new (require('../models/Comment'))({
            contenido: req.body.contenido.trim(),
            usuario: req.user.id,
            publicacion: req.params.id,
            fecha: new Date()
        });
        await comentario.save();
        publicacion.comentarios.push(comentario._id);
        await publicacion.save();
        await comentario.populate('usuario', 'nombre nombreUsuario fotoPerfil');
        res.status(201).json(comentario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al agregar comentario' });
    }
}

module.exports = { obtenerPublicaciones, obtenerPublicacion, crearPublicacion, editarPublicacion, eliminarPublicacion, apoyarPublicacion, agregarComentario };
