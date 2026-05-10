const Mensaje = require('../models/Message');
const Conversacion = require('../models/Conversation');

// /conversaciones -GET
async function obtenerConversaciones(req, res) {
    try {
        // En un caso real, usaríamos el ID del usuario en sesión (req.user._id)
        // Por ahora simularemos que recibimos el id del usuario por query o params
        const usuarioId = req.query.usuarioId; 
        
        let conversaciones = await Conversacion.find({
            participantes: usuarioId
        }).populate('participantes', 'nombre fotoPerfil');
        
        res.status(200).json(conversaciones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener conversaciones' });
    }
}

// /conversaciones/:id/mensajes -GET
async function obtenerMensajes(req, res) {
    try {
        let mensajes = await Mensaje.find({ conversacion: req.params.id })
            .sort({ fecha: 1 }); // Orden cronológico
        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener mensajes' });
    }
}

// /mensajes -POST
async function crearMensaje(req, res) {
    try {
        const { remitente, destinatario, contenido } = req.body;

        // 1. Buscar o crear la conversación
        let conversacion = await Conversacion.findOne({
            participantes: { $all: [remitente, destinatario] }
        });

        if (!conversacion) {
            conversacion = new Conversacion({ participantes: [remitente, destinatario] });
        }

        // 2. Crear el mensaje
        let nuevoMensaje = new Mensaje({
            conversacion: conversacion._id,
            remitente,
            destinatario,
            contenido
        });

        // 3. Actualizar metadatos de la conversación
        conversacion.ultimaActualizacion = Date.now();
        conversacion.ultimoMensaje = contenido;

        await Promise.all([nuevoMensaje.save(), conversacion.save()]);

        res.status(201).json(nuevoMensaje);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al enviar mensaje' });
    }
}

// /mensajes/:id -DELETE
// Sólo disponible para remitente 
async function eliminarMensaje(req, res) {
    try {
        let usuario = await Mensaje.findById(req.params.id);
        if (usuario.remitente.toString() !== req.user._id.toString()) {
            return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este mensaje' });
        }
        let mensaje = await Mensaje.findByIdAndDelete(req.params.id);
        if (!mensaje) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }
        res.status(200).json({ mensaje: 'Mensaje eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar mensaje' });
    }
}


module.exports = { 
    obtenerConversaciones, 
    obtenerMensajes, 
    crearMensaje,
    eliminarMensaje
};