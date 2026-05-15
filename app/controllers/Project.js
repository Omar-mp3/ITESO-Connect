"use strict";
const Proyecto = require('../models/Project');
const Usuario = require('../models/User')

function validarProyecto(body) {
    const errores = [];
    if (!body.nombre || body.nombre.trim().length < 2) errores.push('Nombre obligatorio (mín. 2 chars)');
    if (!body.descripcion || body.descripcion.trim().length < 10) errores.push('Descripción obligatoria (mín. 10 chars)');
    if (!body.categoria) errores.push('Categoría obligatoria');
    return errores;
}

// GET /proyectos
async function obtenerProyectos(req, res) {
    try {
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 10);
        const skip  = (page - 1) * limit;
        const search = req.query.search || '';
        const categoria = req.query.categoria || '';

        const filtro = {};
        if (search) filtro.$or = [
            { nombre: { $regex: search, $options: 'i' } },
            { descripcion: { $regex: search, $options: 'i' } }
        ];
        if (categoria) filtro.categoria = categoria;

        const [proyectos, total] = await Promise.all([
            Proyecto.find(filtro)
                .populate('dueno', 'nombre nombreUsuario fotoPerfil')
                .populate('colaboradores', 'nombre nombreUsuario fotoPerfil')
                .sort({ fechaCreacion: -1 })
                .skip(skip).limit(limit),
            Proyecto.countDocuments(filtro)
        ]);
        res.status(200).json({ proyectos, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener proyectos' });
    }
}

// /proyectos/:id -GET
async function obtenerProyecto(req, res) {
    try {
        let proyecto = await Proyecto.findById(req.params.id)
            .populate('dueno', 'nombre nombreUsuario fotoPerfil')
            .populate('colaboradores', 'nombre nombreUsuario fotoPerfil');
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        res.status(200).json(proyecto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener proyecto' });
    }
}

// /proyectos -POST
async function crearProyecto(req, res) {
    try {
        const errores = validarProyecto(req.body);
        if (errores.length) return res.status(400).json({ mensaje: errores.join(', ') });

        const nuevoProyecto = new Proyecto({
            nombre: req.body.nombre.trim(),
            descripcion: req.body.descripcion.trim(),
            categoria: req.body.categoria,
            vision: (req.body.vision || '').trim(),
            mision: (req.body.mision || '').trim(),
            dueno: req.user.id,
            fechaCreacion: new Date()
        });
        await nuevoProyecto.save();

        
        await Usuario.findByIdAndUpdate(req.user.id, { $push: { proyectos: nuevoProyecto._id } });

        await nuevoProyecto.populate('dueno', 'nombre nombreUsuario fotoPerfil');
        res.status(201).json(nuevoProyecto);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear proyecto' });
    }
}

// /proyectos/:id -PUT
async function editarProyecto(req, res) {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });

        if (proyecto.dueno.toString() !== req.user.id && req.user.rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'Sin permiso' });
        }

        const updates = {};
        if (req.body.nombre) updates.nombre = req.body.nombre.trim();
        if (req.body.descripcion) updates.descripcion = req.body.descripcion.trim();
        if (req.body.categoria) updates.categoria = req.body.categoria;
        if (req.body.vision  !== undefined) updates.vision  = req.body.vision.trim();
        if (req.body.mision  !== undefined) updates.mision  = req.body.mision.trim();

        const actualizado = await Proyecto.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('dueno', '-contrasena').populate('colaboradores', '-contrasena');
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar proyecto' });
    }
}

// /proyectos/:id -DELETE

async function eliminarProyecto(req, res) {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });

        if (proyecto.dueno.toString() !== req.user.id && req.user.rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'Sin permiso' });
        }

        await Proyecto.findByIdAndDelete(req.params.id);
        await Usuario.updateMany({ proyectos: req.params.id }, { $pull: { proyectos: req.params.id } });
        res.status(200).json({ mensaje: 'Proyecto eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar proyecto' });
    }
}

// /proyectos/:id/apoyar -POST
async function apoyarProyecto(req, res) {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        const userId = req.user.id;
        const idx = proyecto.apoyos.indexOf(userId);
        if (idx === -1) proyecto.apoyos.push(userId);
        else proyecto.apoyos.splice(idx, 1);
        await proyecto.save();
        res.status(200).json({ apoyos: proyecto.apoyos.length, apoye: idx === -1 });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al apoyar proyecto' });
    }
}

// /proyectos/:id/colaboradores -POST
async function agregarColaborador(req, res) {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        const userId = req.user.id;
        if (!proyecto.colaboradores.includes(userId)) {
            proyecto.colaboradores.push(userId);
            await proyecto.save();
            await Usuario.findByIdAndUpdate(userId, { $addToSet: { proyectos: proyecto._id } });
        }
        res.status(200).json({ mensaje: 'Colaborador agregado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar colaborador' });
    }
}

module.exports = { obtenerProyectos, obtenerProyecto, crearProyecto, editarProyecto, eliminarProyecto, apoyarProyecto, agregarColaborador };
