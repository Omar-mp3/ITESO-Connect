const mongoose = require('mongoose');

let esquemaComentario = mongoose.Schema({
    contenido: {
        type: String,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'usuario'
    },
    publicacion: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'publicacion'
    },
    respuestaA: mongoose.Schema.Types.ObjectId,
    fecha: Date,
    apoyos: [mongoose.Schema.Types.ObjectId]
});

let Comentario = mongoose.model('comentario', esquemaComentario);

module.exports = Comentario;
