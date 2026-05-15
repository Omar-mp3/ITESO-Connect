const mongoose = require('mongoose');

let esquemaPublicacion = mongoose.Schema({
    titulo: {
        type: String,
        default: ''
    },
    cuerpo: {
        type: String,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'usuario'
    },
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'proyecto'
    },
    fecha: Date,
    apoyos: [mongoose.Schema.Types.ObjectId],
    comentarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comentario' }],
    imagen: String,
});

let Publicacion = mongoose.model('publicacion', esquemaPublicacion);

module.exports = Publicacion;
