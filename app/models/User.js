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
    habilidades: [String],
    seguidores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    siguiendo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    proyectos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
