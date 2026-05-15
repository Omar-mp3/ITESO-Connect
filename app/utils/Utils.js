"use strict";
const mongoose = require('mongoose');

function validarObjectId(req, res, next) {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
    }
    next();
}

module.exports = { validarObjectId };
