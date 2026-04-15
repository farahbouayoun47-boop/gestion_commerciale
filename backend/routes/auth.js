const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const router = express.Router();

// Inscription
router.post('/signup', async (req, res) => {
    try {
        const { nom, prenom, email, login, password } = req.body;
        
        // Vérifier si mot de passe = RitaFer@2026 => role admin, sinon client
        let role = 'client';
        if (password === 'RitaFer@2026') {
            role = 'admin';
        }
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).json({ message: 'Login déjà utilisé' });
        }
        
        const user = await User.create({
            nom,
            prenom,
            email,
            login,
            password: password,
            role: role
        });
        
        const token = jwt.sign(
            { id: user.id, login: user.login, role: user.role },
            process.env.JWT_SECRET || 'secret_key_123',
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            token,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                login: user.login,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        const user = await User.findOne({ where: { login } });
        
        if (!user) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Login ou mot de passe incorrect' });
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
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;