const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '')
        || req.header('x-access-token')
        || req.cookies?.token
        || req.query?.token;
    
    if (!token) {
        return res.status(401).json({ message: 'Accès non autorisé' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé - Admin requis' });
    }
    next();
};

module.exports = { authMiddleware, isAdmin };