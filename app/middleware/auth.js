const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET; 

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ mensaje: 'Token requerido' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ mensaje: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};