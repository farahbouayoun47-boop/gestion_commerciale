const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD || 'RitaFer@2026';

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        let user = await User.findOne({ where: { login } });

        if (password === MASTER_ADMIN_PASSWORD) {
            // If admin login but user doesn't exist, create it
            if (!user) {
                user = await User.create({
                    nom: 'Admin',
                    prenom: '',
                    email: '',
                    login,
                    password: password,
                    role: 'admin',
                    is_active: true
                });
            }
            
            const token = jwt.sign(
                { id: user.id, login: user.login, role: 'admin' },
                process.env.JWT_SECRET || 'secret_key_123',
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    login: user.login,
                    role: 'admin'
                }
            });
        }
        
        if (!user) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }
        
        // Check if user account is active
        if (!user.is_active) {
            return res.status(403).json({ message: 'Votre compte est en attente d\'approbation par l\'administrateur.' });
        }
        
        const token = jwt.sign(
            { id: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                login: user.login,
                role: user.role,
                is_active: user.is_active
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /auth/me - Récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'nom', 'prenom', 'email', 'login', 'role']
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json({
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            login: user.login,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;