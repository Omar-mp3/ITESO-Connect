const mongoose = require('mongoose');

let esquemaConversacion = mongoose.Schema({
    participantes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuario',
        required: true
    }],
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    },
    ultimoMensaje: String
});

let Conversacion = mongoose.model('conversacion', esquemaConversacion);

module.exports = Conversacion;