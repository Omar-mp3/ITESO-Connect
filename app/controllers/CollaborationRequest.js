"use strict";
const Solicitud = require('../models/CollaborationRequest');
const Proyecto  = require('../models/Project');
const Usuario   = require('../models/User');

// POST /proyectos/:id/solicitudes
async function crearSolicitud(req, res) {
    try {
        const proyectoId  = req.params.id;
        const solicitante = req.user.id;

        const proyecto = await Proyecto.findById(proyectoId);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        if (proyecto.dueno.toString() === solicitante)
            return res.status(400).json({ mensaje: 'Eres el dueño de este proyecto' });
        if (proyecto.colaboradores.some(c => c.toString() === solicitante))
            return res.status(400).json({ mensaje: 'Ya eres colaborador de este proyecto' });

        const solicitud = new Solicitud({
            proyecto:    proyectoId,
            solicitante: solicitante,
            mensaje:     (req.body.mensaje || '').trim().substring(0, 500)
        });
        await solicitud.save();
        await solicitud.populate('solicitante', 'nombre nombreUsuario fotoPerfil');
        res.status(201).json(solicitud);
    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ mensaje: 'Ya enviaste una solicitud a este proyecto' });
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear solicitud' });
    }
}

// GET /proyectos/:id/solicitudes
async function obtenerSolicitudes(req, res) {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
        if (proyecto.dueno.toString() !== req.user.id && req.user.rol !== 'ADMIN')
            return res.status(403).json({ mensaje: 'Sin permiso' });

        const solicitudes = await Solicitud.find({
            proyecto: req.params.id,
            estado: 'PENDIENTE'
        }).populate('solicitante', 'nombre nombreUsuario fotoPerfil');
        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
    }
}

// GET /solicitudes/lasmias  
async function misSolicitudes(req, res) {
    try {
        const solicitudes = await Solicitud.find({ solicitante: req.user.id })
            .populate('proyecto', 'nombre categoria');
        res.status(200).json(solicitudes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener solicitudes' });
    }
}

// PUT /solicitudes/:id
async function responderSolicitud(req, res) {
    try {
        const { accion } = req.body; 
        if (!['ACEPTADA', 'RECHAZADA'].includes(accion))
            return res.status(400).json({ mensaje: 'Acción inválida' });

        const solicitud = await Solicitud.findById(req.params.id)
            .populate('proyecto');
        if (!solicitud) return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
        if (solicitud.estado !== 'PENDIENTE')
            return res.status(400).json({ mensaje: 'Solicitud ya procesada' });

        const proyecto = solicitud.proyecto;
        if (proyecto.dueno.toString() !== req.user.id && req.user.rol !== 'ADMIN')
            return res.status(403).json({ mensaje: 'Sin permiso' });

        solicitud.estado = accion;
        await solicitud.save();

        if (accion === 'ACEPTADA') {
            await Proyecto.findByIdAndUpdate(proyecto._id, {
                $addToSet: { colaboradores: solicitud.solicitante }
            });
            await Usuario.findByIdAndUpdate(solicitud.solicitante, {
                $addToSet: { proyectos: proyecto._id }
            });
        }
        res.status(200).json({ mensaje: `Solicitud ${accion.toLowerCase()}`, solicitud });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al responder solicitud' });
    }
}

module.exports = { crearSolicitud, obtenerSolicitudes, misSolicitudes, responderSolicitud };

