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
        if (req.user.role === 'admin' && !req.user.id) {
            return res.json({
                id: null,
                nom: 'admin',
                prenom: '',
                email: '',
                login: req.user.login,
                role: 'admin'
            });
        }

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /users - Ajouter un utilisateur (admin seulement)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { nom, prenom, email, login, password, telephone, entreprise, adresse, role } = req.body;
        
        // Validation des champs requis
        if (!nom || !prenom || !login || !password) {
            return res.status(400).json({ message: 'Nom, prénom, login et mot de passe sont requis' });
        }
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).json({ message: 'Login déjà utilisé' });
        }
        
        // Déterminer le rôle et le statut actif
        const userRole = role || 'client';
        const isActive = false; // Tous les comptes créés par admin sont inactifs par défaut
        
        const user = await User.create({
            nom, 
            prenom, 
            email,
            login,
            password,
            telephone, 
            entreprise,
            adresse,
            role: userRole,
            is_active: isActive
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
        const { nom, prenom, email, telephone, entreprise, adresse } = req.body;
        
        // Vérifier les droits
        if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        await user.update({ nom, prenom, email, telephone, entreprise, adresse });
        
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

// GET /users/pending - Liste des utilisateurs en attente d'approbation (admin seulement)
router.get('/pending', isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.findAll({
            where: { is_active: false },
            attributes: { exclude: ['password'] }
        });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /users/:id/approve - Approuver ou rejeter un utilisateur (admin seulement)
router.put('/:id/approve', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { approved } = req.body; // boolean: true pour approuver, false pour rejeter
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        if (approved) {
            await user.update({ is_active: true });
            res.json({ message: 'Utilisateur approuvé avec succès' });
        } else {
            await user.destroy(); // Supprimer l'utilisateur si rejeté
            res.json({ message: 'Utilisateur rejeté et supprimé' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;