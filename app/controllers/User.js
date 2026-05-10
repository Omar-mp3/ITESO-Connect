"use strict";

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
        const { expediente, nombreUsuario, correo, contrasena, nombre } = req.body;
        let nuevoUsuario = new Usuario({ expediente, nombreUsuario, correo, contrasena, nombre });
        
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

module.exports = { obtenerUsuarios, obtenerUsuario, crearUsuario, editarUsuario, eliminarUsuario, cambiarRol };
