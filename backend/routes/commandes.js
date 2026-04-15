const express = require('express');
const { Commande, LigneCommande, User } = require('../models');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const router = express.Router();

// Configuration multer pour l'upload des fichiers Excel
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers Excel sont autorisés'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

router.use(authMiddleware);

// GET /commandes - Liste des commandes
router.get('/', async (req, res) => {
    try {
        let where = {};
        
        if (req.user.role !== 'admin') {
            where.user_id = req.user.id;
        }
        
        const commandes = await Commande.findAll({
            where,
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login'] },
                { model: LigneCommande }
            ]
        });
        
        res.json(commandes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /commandes/export - Exporter les commandes en Excel (Admin seulement)
router.get('/export', isAdmin, async (req, res) => {
    try {
        const commandes = await Commande.findAll({
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login'] },
                { model: LigneCommande }
            ],
            order: [['date', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Commandes');

        // En-têtes
        worksheet.columns = [
            { header: 'Numéro Commande', key: 'numero', width: 15 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Adresse', key: 'adresse', width: 30 },
            { header: 'Utilisateur', key: 'user', width: 20 },
            { header: 'Code Article', key: 'code_article', width: 15 },
            { header: 'Quantité', key: 'qte', width: 10 },
            { header: 'Prix Unitaire', key: 'prix_unitaire', width: 15 },
            { header: 'TVA (%)', key: 'tva', width: 10 },
            { header: 'Prix TTC', key: 'prix_ttc', width: 15 },
            { header: 'Détails', key: 'details', width: 30 }
        ];

        // Style des en-têtes
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
        };

        // Ajouter les données
        commandes.forEach(commande => {
            const userName = commande.User
                ? `${commande.User.prenom} ${commande.User.nom} (${commande.User.login})`
                : 'Utilisateur inconnu';
            
            commande.LigneCommandes.forEach(ligne => {
                worksheet.addRow({
                    numero: commande.numero,
                    date: commande.date,
                    adresse: commande.adresse || '',
                    user: userName,
                    code_article: ligne.code_article,
                    qte: ligne.qte,
                    prix_unitaire: parseFloat(ligne.prix_unitaire),
                    tva: parseFloat(ligne.tva),
                    prix_ttc: parseFloat(ligne.prix_ttc),
                    details: ligne.details || ''
                });
            });
        });

        // Configurer la réponse
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=commandes_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export Excel:', error);
        res.status(500).json({ message: 'Erreur lors de l\'export Excel' });
    }
});

// GET /commandes/lignes - Liste de toutes les lignes de commande avec infos de commande
router.get('/lignes', async (req, res) => {
    try {
        const where = {};
        if (req.user.role !== 'admin') {
            where['$Commande.user_id$'] = req.user.id;
        }

        const lignes = await LigneCommande.findAll({
            where,
            include: [
                { model: Commande, include: [{ model: User, attributes: ['nom', 'prenom', 'login'] }] }
            ]
        });

        const lignesFlat = lignes.map(ligne => ({
            id: ligne.id,
            commande_id: ligne.commande_id,
            commande_numero: ligne.Commande?.numero || null,
            commande_date: ligne.Commande?.date || null,
            adresse: ligne.Commande?.adresse || null,
            client: ligne.Commande?.User ? `${ligne.Commande.User.prenom} ${ligne.Commande.User.nom}` : null,
            code_article: ligne.code_article,
            qte: ligne.qte,
            prix_unitaire: parseFloat(ligne.prix_unitaire),
            tva: parseFloat(ligne.tva),
            prix_ttc: parseFloat(ligne.prix_ttc),
            details: ligne.details || null
        }));

        res.json(lignesFlat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id/lignes', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['nom', 'prenom', 'login'] }]
        });
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }

        const lignes = await LigneCommande.findAll({
            where: { commande_id: commande.id }
        });

        const lignesFlat = lignes.map(ligne => ({
            id: ligne.id,
            commande_id: ligne.commande_id,
            commande_numero: commande.numero,
            commande_date: commande.date,
            adresse: commande.adresse,
            client: commande.User ? `${commande.User.prenom} ${commande.User.nom}` : null,
            code_article: ligne.code_article,
            qte: ligne.qte,
            prix_unitaire: parseFloat(ligne.prix_unitaire),
            tva: parseFloat(ligne.tva),
            prix_ttc: parseFloat(ligne.prix_ttc),
            details: ligne.details || null
        }));

        res.json({ commande, lignes: lignesFlat });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /commandes/import - Importer des commandes depuis Excel (Admin seulement)
router.post('/import', isAdmin, upload.single('excelFile'), async (req, res) => {
    try {
        const { numero, date, user_id, adresse } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Fichier Excel requis' });
        }

        if (!numero || !date || !user_id) {
            return res.status(400).json({ message: 'Numéro, date et user_id requis' });
        }

        // Vérifier que l'utilisateur existe
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Parser le fichier Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            return res.status(400).json({ message: 'Feuille de calcul non trouvée' });
        }

        // Créer la commande
        const commande = await Commande.create({
            numero,
            date,
            adresse,
            user_id
        });

        // Traiter les lignes
        const lignes = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const code_article = row.getCell(1).value;
            const qte = row.getCell(2).value;
            const prix_unitaire = row.getCell(3).value;
            const prix_ttc = row.getCell(4).value;
            const tva = row.getCell(5).value;
            const details = row.getCell(6).value;

            if (code_article && qte && prix_unitaire) {
                lignes.push({
                    commande_id: commande.id,
                    code_article: String(code_article),
                    qte: parseInt(qte),
                    prix_unitaire: parseFloat(prix_unitaire),
                    prix_ttc: prix_ttc ? parseFloat(prix_ttc) : parseFloat((prix_unitaire * qte * (1 + (tva || 0) / 100)).toFixed(2)),
                    tva: tva ? parseFloat(tva) : 0,
                    details: details ? String(details) : null
                });
            }
        });

        if (lignes.length === 0) {
            await commande.destroy(); // Supprimer la commande vide
            return res.status(400).json({ message: 'Aucune ligne valide trouvée dans le fichier Excel' });
        }

        // Créer les lignes de commande
        await LigneCommande.bulkCreate(lignes);

        const commandeComplet = await Commande.findByPk(commande.id, {
            include: [LigneCommande, { model: User, attributes: ['nom', 'prenom', 'login'] }]
        });

        res.status(201).json({
            message: `${lignes.length} ligne(s) importée(s) avec succès`,
            commande: commandeComplet
        });
    } catch (error) {
        console.error('Erreur import Excel:', error);
        res.status(500).json({ message: 'Erreur lors de l\'import Excel: ' + error.message });
    }
});

// POST /commandes - Ajouter une commande
router.post('/', async (req, res) => {
    try {
        const { numero, date, adresse, user_id, lignes } = req.body;
        
        // Vérifier les droits
        if (req.user.role !== 'admin' && user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const commande = await Commande.create({
            numero,
            date,
            adresse,
            user_id
        });
        
        if (lignes && lignes.length > 0) {
            for (const ligne of lignes) {
                const prixTtc = ligne.prix_ttc !== undefined
                    ? ligne.prix_ttc
                    : parseFloat((ligne.prix_unitaire * ligne.qte * (1 + (ligne.tva || 0) / 100)).toFixed(2));

                await LigneCommande.create({
                    commande_id: commande.id,
                    code_article: ligne.code_article,
                    qte: ligne.qte,
                    prix_unitaire: ligne.prix_unitaire,
                    prix_ttc: prixTtc,
                    tva: ligne.tva,
                    details: ligne.details
                });
            }
        } else {
            // Créer automatiquement une ligne vide pour permettre l'édition
            await LigneCommande.create({
                commande_id: commande.id,
                code_article: '',
                qte: 1,
                prix_unitaire: 0.00,
                prix_ttc: 0.00,
                tva: 0.00,
                details: null
            });
        }
        
        const commandeComplet = await Commande.findByPk(commande.id, {
            include: [LigneCommande]
        });
        
        res.status(201).json(commandeComplet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /commandes/:id - Modifier une commande
router.put('/:id', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id);
        
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        
        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const { numero, date, adresse } = req.body;
        await commande.update({ numero, date, adresse });
        
        res.json(commande);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /commandes/:id - Obtenir une commande avec ses lignes
router.get('/:id', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login'] },
                { model: LigneCommande }
            ]
        });

        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }

        res.json(commande);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /commandes/:id/lignes - Ajouter une ligne à une commande
router.post('/:id/lignes', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id);
        
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        
        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const { code_article, qte, prix_unitaire, prix_ttc, tva, details } = req.body;
        
        const prixTtc = prix_ttc !== undefined
            ? prix_ttc
            : parseFloat((prix_unitaire * qte * (1 + (tva || 0) / 100)).toFixed(2));
        
        await LigneCommande.create({
            commande_id: commande.id,
            code_article,
            qte,
            prix_unitaire,
            prix_ttc: prixTtc,
            tva,
            details
        });

        const updatedCommande = await Commande.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login'] },
                { model: LigneCommande }
            ]
        });

        res.status(201).json(updatedCommande);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /commandes/:id/lignes/:ligneId - Modifier une ligne de commande
router.put('/:id/lignes/:ligneId', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id);
        
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        
        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const ligne = await LigneCommande.findOne({
            where: {
                id: req.params.ligneId,
                commande_id: commande.id
            }
        });
        
        if (!ligne) {
            return res.status(404).json({ message: 'Ligne de commande non trouvée' });
        }
        
        const { code_article, qte, prix_unitaire, prix_ttc, tva, details } = req.body;
        
        const prixTtc = prix_ttc !== undefined
            ? prix_ttc
            : parseFloat((prix_unitaire * qte * (1 + (tva || 0) / 100)).toFixed(2));
        
        await ligne.update({
            code_article,
            qte,
            prix_unitaire,
            prix_ttc: prixTtc,
            tva,
            details
        });
        
        res.json(ligne);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /commandes/:id/lignes/:ligneId - Supprimer une ligne de commande
router.delete('/:id/lignes/:ligneId', async (req, res) => {
    try {
        const commande = await Commande.findByPk(req.params.id);
        
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        
        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        const ligne = await LigneCommande.findOne({
            where: {
                id: req.params.ligneId,
                commande_id: commande.id
            }
        });
        
        if (!ligne) {
            return res.status(404).json({ message: 'Ligne de commande non trouvée' });
        }
        
        await ligne.destroy();
        
        const updatedCommande = await Commande.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login'] },
                { model: LigneCommande }
            ]
        });

        res.json(updatedCommande);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /commandes/:id - Supprimer une commande entière
router.delete('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`[DELETE] Tentative de suppression de la commande ID: ${orderId}`);
        
        const commande = await Commande.findByPk(orderId);
        
        if (!commande) {
            console.log(`[DELETE] Commande ID ${orderId} non trouvée dans la base de données`);
            return res.status(404).json({ message: `Commande ${orderId} non trouvée` });
        }
        
        if (req.user.role !== 'admin' && commande.user_id !== req.user.id) {
            console.log(`[DELETE] Permission refusée: user ${req.user.id} tentant de supprimer commande user ${commande.user_id}`);
            return res.status(403).json({ message: 'Action non autorisée' });
        }
        
        // Supprimer les lignes associées
        await LigneCommande.destroy({
            where: { commande_id: orderId }
        });
        
        // Supprimer la commande
        await commande.destroy();
        
        console.log(`[DELETE] Commande ${orderId} supprimée avec succès`);
        res.json({ message: 'Commande supprimée avec succès', id: commande.id });
    } catch (error) {
        console.error(`[DELETE] Erreur lors de la suppression:`, error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;