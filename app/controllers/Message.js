"use strict";
const Mensaje      = require('../models/Message');
const Conversacion = require('../models/Conversation');

// GET /mensajes/conversaciones
async function obtenerConversaciones(req, res) {
    try {
        const conversaciones = await Conversacion.find({ participantes: req.user.id })
            .populate('participantes', 'nombre nombreUsuario fotoPerfil')
            .sort({ ultimaActualizacion: -1 });
        res.status(200).json(conversaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener conversaciones' });
    }
}

// GET /mensajes/conversaciones/:id/mensajes
async function obtenerMensajes(req, res) {
    try {
        const conv = await Conversacion.findById(req.params.id);
        if (!conv) return res.status(404).json({ mensaje: 'Conversación no encontrada' });
        if (!conv.participantes.some(p => p.toString() === req.user.id))
            return res.status(403).json({ mensaje: 'Sin acceso a esta conversación' });

        
        await Mensaje.updateMany(
            { conversacion: req.params.id, destinatario: req.user.id, leido: false },
            { leido: true }
        );

        const mensajes = await Mensaje.find({ conversacion: req.params.id })
            .populate('remitente', 'nombre nombreUsuario fotoPerfil')
            .sort({ fecha: 1 });
        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener mensajes' });
    }
}

// POST /mensajes
async function crearMensaje(req, res) {
    try {
        const { destinatario, contenido } = req.body;
        const remitente = req.user.id;

        if (!destinatario || !contenido || !contenido.trim())
            return res.status(400).json({ mensaje: 'Destinatario y contenido requeridos' });
        if (remitente === destinatario)
            return res.status(400).json({ mensaje: 'No puedes enviarte mensajes a ti mismo' });

        
        let conversacion = await Conversacion.findOne({
            participantes: { $all: [remitente, destinatario], $size: 2 }
        });
        if (!conversacion) {
            conversacion = new Conversacion({ participantes: [remitente, destinatario] });
        }

        const nuevoMensaje = new Mensaje({
            conversacion: conversacion._id,
            remitente,
            destinatario,
            contenido: contenido.trim()
        });

        conversacion.ultimaActualizacion = new Date();
        conversacion.ultimoMensaje = contenido.trim().substring(0, 100);

        await Promise.all([nuevoMensaje.save(), conversacion.save()]);
        await nuevoMensaje.populate('remitente', 'nombre nombreUsuario fotoPerfil');

        res.status(201).json({ ...nuevoMensaje.toObject(), conversacion: conversacion._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al enviar mensaje' });
    }
}

// DELETE /mensajes/:id
async function eliminarMensaje(req, res) {
    try {
        const mensaje = await Mensaje.findById(req.params.id);
        if (!mensaje) return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        if (mensaje.remitente.toString() !== req.user.id && req.user.rol !== 'ADMIN')
            return res.status(403).json({ mensaje: 'Sin permiso' });
        await Mensaje.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: 'Mensaje eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar mensaje' });
    }
}

// GET /mensajes/no-leidos
async function noLeidos(req, res) {
    try {
        const count = await Mensaje.countDocuments({
            destinatario: req.user.id,
            leido: false
        });
        res.status(200).json({ noLeidos: count });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error' });
    }
}

module.exports = { obtenerConversaciones, obtenerMensajes, crearMensaje, eliminarMensaje, noLeidos };
