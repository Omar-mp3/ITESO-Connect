"use strict";

require('dotenv').config(); // Cargar variables de entorno al inicio
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const router = require('./app/controllers/router');

const app = express();
const port = process.env.PORT || 3000; // Usar puerto de .env o 3000

// Conexión a MongoDB (Cambiar)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/iteso-connect') // Usar URI de .env
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión:', err));

app.use(express.json());

// Servir archivos estáticos (CSS, JS frontal) y vistas
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app/views')));

app.use('/', router);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'app/views/error.html'));
});

// Manejador global de errores (500)
app.use((err, req, res, next) => {
    console.error('SERVER_ERROR_TRACE:', err.stack);
    res.status(500).json({ 
        mensaje: 'Ocurrió un error en el servidor al procesar la solicitud',
        error: err.message 
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});