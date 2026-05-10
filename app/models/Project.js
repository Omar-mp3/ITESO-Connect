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
    dueno: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    colaboradores: [mongoose.Schema.Types.ObjectId],
    apoyos: [mongoose.Schema.Types.ObjectId],
    fechaCreacion: Date
});

let Proyecto = mongoose.model('proyecto', esquemaProyecto);

module.exports = Proyecto;
