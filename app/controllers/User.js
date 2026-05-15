"use strict";
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/User');

// /usuarios -GET
async function obtenerUsuarios(req, res) {
    try {
        const search = req.query.search || '';
        const limit  = Math.min(50, parseInt(req.query.limit) || 20);
        const filtro = search
            ? { $or: [
                { nombre:       { $regex: search, $options: 'i' } },
                { nombreUsuario:{ $regex: search, $options: 'i' } }
              ] }
            : {};
        let usuarios = await Usuario.find(filtro).select('-contrasena').limit(limit);
        res.status(200).json({ usuarios });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios' });
    }
}

// /usuarios/:id -GET
async function obtenerUsuario(req, res) {
    try {
        let usuario = await Usuario.findById(req.params.id)
            .select('-contrasena')
            .populate('proyectos');
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener usuario' });
    }
}

// /usuarios -POST
async function crearUsuario(req, res) {
    try {
        const { expediente, nombreUsuario, correo, contrasena, nombre, rol } = req.body;
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        let nuevoUsuario = new Usuario({
            expediente, nombreUsuario, correo,
            contrasena: hashedPassword, nombre,
            rol: rol || 'USUARIO'
        });
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Usuario creado' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'Expediente, usuario o correo ya en uso' });
        }
        res.status(500).json({ mensaje: 'Error al crear usuario' });
    }
}

// /usuarios/:id -PUT
async function editarUsuario(req, res) {
    try {
       
        delete req.body.contrasena;
        delete req.body.rol;
        const actualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .select('-contrasena')
            .populate('proyectos');
        if (!actualizado) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.status(200).json(actualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar usuario' });
    }
}

// /usuarios/:id -DELETE
async function eliminarUsuario(req, res) {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.status(200).json({ mensaje: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar usuario' });
    }
}

// /usuarios/:id/rol -PUT
async function cambiarRol(req, res) {
    try {
        await Usuario.findByIdAndUpdate(req.params.id, { rol: 'ADMIN' });
        res.status(200).json({ mensaje: 'Rol actualizado a ADMIN' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cambiar rol' });
    }
}

// /usuarios/:id/foto -POST
async function subirFoto(req, res) {
    try {
        if (!req.file) return res.status(400).json({ mensaje: 'No se subió ninguna imagen' });
        const rutaFoto = 'public/uploads/' + req.file.filename;
        await Usuario.findByIdAndUpdate(req.params.id, { fotoPerfil: rutaFoto });
        res.status(200).json({ mensaje: 'Foto actualizada', fotoPerfil: rutaFoto });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al subir foto' });
    }
}

// /usuarios/:id/seguir -POST
async function seguirUsuario(req, res) {
    try {
        const targetId = req.params.id;
        const meId = req.user.id;
        if (targetId === meId) return res.status(400).json({ mensaje: 'No puedes seguirte a ti mismo' });

        const target = await Usuario.findById(targetId);
        const me     = await Usuario.findById(meId);
        if (!target || !me) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const yaSigo = target.seguidores.some(s => s.toString() === meId);
        if (yaSigo) {
            
            target.seguidores.pull(meId);
            me.siguiendo.pull(targetId);
        } else {
            
            target.seguidores.addToSet(meId);
            me.siguiendo.addToSet(targetId);
        }
        await Promise.all([target.save(), me.save()]);
        res.status(200).json({
            siguiendo: !yaSigo,
            totalSeguidores: target.seguidores.length
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al seguir usuario' });
    }
}


async function login(req, res) {
    try {
        const { correo, contrasena } = req.body;
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!isMatch) return res.status(400).json({ mensaje: 'Credenciales inválidas' });
        const token = jwt.sign(
            { id: usuario._id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }   
        );
        res.status(200).json({
            token,
            usuario: {
                id: usuario._id,
                nombreUsuario: usuario.nombreUsuario,
                nombre: usuario.nombre,
                fotoPerfil: usuario.fotoPerfil,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
}

module.exports = {
    obtenerUsuarios, obtenerUsuario, crearUsuario, editarUsuario,
    eliminarUsuario, cambiarRol, subirFoto, seguirUsuario, login
};
