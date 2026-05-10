const mongoose = require('mongoose');

let esquemaMensaje = mongoose.Schema({
    conversacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'conversacion',
        required: true
    },
    contenido: {
        type: String,
        required: true
    },
    remitente: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'usuario'
    },
    destinatario: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'usuario'
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    leido: {
        type: Boolean,
        default: false
    }
});

let Mensaje = mongoose.model('mensaje', esquemaMensaje);

module.exports = Mensaje;
