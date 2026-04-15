const express = require('express');
const { User } = require('../models');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Tous les routes nécessitent authentification
router.use(authMiddleware);

// GET /users - Liste des clients (admin seulement)
router.get('/', isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /users/profile - Profil de l'utilisateur connecté
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /users - Ajouter un client (admin seulement)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { nom, prenom, email, login, password } = req.body;
        const user = await User.create({
            nom, prenom, email, login, password,
            role: 'client'
        });
        
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /users/:id - Modifier un utilisateur
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, login } = req.body;
        
        // Vérifier les droits
        if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        await user.update({ nom, prenom, email, login });
        
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /users/:id/password - Changer mot de passe
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;
        
        if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const user = await User.findByPk(id);
        
        if (req.user.role !== 'admin') {
            if (!(await user.comparePassword(oldPassword))) {
                return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
            }
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /users/:id - Supprimer un utilisateur (admin seulement)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        await user.destroy();
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;