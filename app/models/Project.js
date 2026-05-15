const mongoose = require('mongoose');

let esquemaProyecto = mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    categoria: {
        type: String,
        required: true
    },
    vision: { type: String, default: '' },
    mision: { type: String, default: '' },
    dueno: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuario',
        required: true
    },
    colaboradores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'usuario'
    }],
    apoyos: [mongoose.Schema.Types.ObjectId],
    fechaCreacion: Date
});

let Proyecto = mongoose.model('proyecto', esquemaProyecto);

module.exports = Proyecto;