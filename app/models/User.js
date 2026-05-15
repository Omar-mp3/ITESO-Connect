const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    expediente: {
        type: String,
        required: true,
        unique: true
    },
    nombreUsuario: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    contrasena: {
        type: String,
        required: true
    },
    nombre: String,
    rol: {
        type: String,
        enum: ['USUARIO', 'ADMIN'],
        default: 'USUARIO'
    },
    fotoPerfil: String,
    biografia: String,
    sobreMi:   String,
    habilidades: [String],
    carrera:     String,
    universidad: String,
    ciudad:      String,
    fechaRegistro: Date,
    seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'usuario' }],
    siguiendo:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'usuario' }],
    proyectos:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'proyecto' }]
}, { timestamps: true });

module.exports = mongoose.model('usuario', userSchema);