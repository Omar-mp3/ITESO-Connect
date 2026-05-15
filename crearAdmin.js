"use strict";
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./app/models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iteso-connect')
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión:', err));

async function crearAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = new Usuario({
            expediente: '000000',
            nombreUsuario: 'admin',
            correo: 'admin@iteso.mx',
            contrasena: hashedPassword,
            nombre: 'Administrador',
            rol: 'ADMIN'
        });
        await admin.save();
        console.log('Usuario admin creado con exito');
        console.log('Correo: admin@iteso.mx');
        console.log('Contrasena: admin123');
        mongoose.connection.close();
    } catch (error) {
        console.error('Error al crear admin:', error);
        mongoose.connection.close();
    }
}

crearAdmin();
