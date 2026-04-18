const express = require('express');
const { User } = require('../models');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Tous les routes nécessitent authentification
router.use(authMiddleware);

// GET /clients - Liste des clients (admin seulement)
router.get('/', isAdmin, async (req, res) => {
    try {
        const clients = await User.findAll({
            where: { role: 'client' },
            attributes: { exclude: ['password'] }
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /clients - Ajouter un client (admin seulement)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { nom, prenom, email, login, password, telephone, entreprise, adresse } = req.body;
        const generatedLogin = login || `client_${Date.now()}`;
        const generatedEmail = email || `${generatedLogin}@local.test`;
        const generatedPassword = password || Math.random().toString(36).slice(2) + 'A1';

        console.log('Creating client with:', { nom, prenom, email: generatedEmail, login: generatedLogin, telephone, entreprise, adresse });

        const client = await User.create({
            nom,
            prenom,
            email: generatedEmail,
            login: generatedLogin,
            password: generatedPassword,
            telephone: telephone || null,
            entreprise: entreprise || null,
            adresse: adresse || null,
            role: 'client'
        }, { validate: false });

        const { password: _, ...clientWithoutPassword } = client.toJSON();
        res.status(201).json(clientWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /clients/:id - Modifier un client
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, telephone, entreprise, adresse } = req.body;

        const client = await User.findByPk(id);
        if (!client || client.role !== 'client') {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        await client.update({ nom, prenom, email, telephone, entreprise, adresse });

        const { password: _, ...clientWithoutPassword } = client.toJSON();
        res.json(clientWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /clients/:id - Supprimer un client (admin seulement)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const client = await User.findByPk(id);

        if (!client || client.role !== 'client') {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        await client.destroy();
        res.json({ message: 'Client supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;