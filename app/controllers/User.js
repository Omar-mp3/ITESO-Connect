"use strict";
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Usuario = require('../models/User');
// /usuarios -GET
async function obtenerUsuarios(req, res) {
    try {
        let usuarios = await Usuario.find().select('-contrasena');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
}

// /usuarios/:id -GET
async function obtenerUsuario(req, res) {
    try {
        let usuario = await Usuario.findById(req.params.id).select('-contrasena');
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuario' });
    }
}

// /usuarios -POST
async function crearUsuario(req, res) {
    try {
        // Filtrar datos sensibles y asignar rol por defecto
        const { expediente, nombreUsuario, correo, contrasena, nombre, rol } = req.body;
        const hashedPassword = await bcrypt.hash(contrasena, 10); // Hashear la contraseña
        let nuevoUsuario = new Usuario({ expediente, nombreUsuario, correo, contrasena: hashedPassword, nombre, rol: rol || 'USUARIO' }); // Asignar rol por defecto
        await nuevoUsuario.save();

        res.status(201).json({ mensaje: 'Usuario creado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
}

// /usuarios/:id -PUT
async function editarUsuario(req, res) {
    try {
        await Usuario.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).json({ mensaje: 'Usuario actualizado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
}

// /usuarios/:id -DELETE
// Sólo disponible para admin y dueño
async function eliminarUsuario(req, res) {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    }
}

// /usuarios/:id/rol -PUT
// Sólo disponible para admin
async function cambiarRol(req, res) {
    try {
        await Usuario.findByIdAndUpdate(req.params.id, { rol: 'ADMIN' });
        res.status(200).json({ mensaje: 'Rol actualizado a ADMIN' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar rol' });
    }
}

// Función de login
async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;
        const usuario = await Usuario.findOne({ correo });

        if (!usuario) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!isMatch) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, usuario: { id: usuario._id, nombreUsuario: usuario.nombreUsuario, rol: usuario.rol } });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}

module.exports = { obtenerUsuarios, obtenerUsuario, crearUsuario, editarUsuario, eliminarUsuario, cambiarRol, login };
