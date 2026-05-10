const mongoose = require('mongoose');

let esquemaUsuario = mongoose.Schema({
    expediente: {
        type: Number,
        required: true
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
    token: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    fechaNacimiento: Date,
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    fotoPerfil: String,
    biografia: String,
    rol: {
        type: String,
        enum: ['ADMIN', 'USUARIO'],
        default: 'USUARIO'
    },
    seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'usuario' }],
    siguiendo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'usuario' }]
});

let Usuario = mongoose.model('usuario', esquemaUsuario);

module.exports = Usuario;
