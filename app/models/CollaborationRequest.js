const mongoose = require('mongoose');

const esquemaSolicitud = mongoose.Schema({
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'proyecto',
        required: true
    },
    solicitante: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuario',
        required: true
    },
    mensaje: {
        type: String,
        default: ''
    },
    estado: {
        type: String,
        enum: ['PENDIENTE', 'ACEPTADA', 'RECHAZADA'],
        default: 'PENDIENTE'
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});


esquemaSolicitud.index({ proyecto: 1, solicitante: 1 }, { unique: true });

module.exports = mongoose.model('solicitud', esquemaSolicitud);
