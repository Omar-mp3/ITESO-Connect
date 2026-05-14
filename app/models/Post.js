const mongoose = require('mongoose');

let esquemaPublicacion = mongoose.Schema({
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
    comentarios: [mongoose.Schema.Types.ObjectId],
    imagen: String,
});

let Publicacion = mongoose.model('publicacion', esquemaPublicacion);

module.exports = Publicacion;
