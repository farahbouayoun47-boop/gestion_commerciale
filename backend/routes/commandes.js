const express = require('express');
const { Commande, LigneCommande, User } = require('../models');
const { authMiddleware, isAdmin } = require('../middlewares/auth');
const ExcelJS = require('exceljs');
const multer = require('multer');
const router = express.Router();

const resolveUserIdFromClient = async (client) => {
    if (!client) return null;

    let clientValue = client;
    if (typeof client === 'object') {
        if (client.id) return client.id;
        if (client.user_id) return client.user_id;
        if (client.client_id) return client.client_id;
        if (client.value) clientValue = client.value;
        else if (client.login) clientValue = client.login;
        else if (client.email) clientValue = client.email;
        else if (client.label) clientValue = client.label;
        else if (client.name) clientValue = client.name;
        else {
            const name = `${client.prenom || ''} ${client.nom || ''}`.trim();
            if (name) clientValue = name;
        }
    }

    const trimmed = String(clientValue).trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);

    let user = await User.findOne({ where: { login: trimmed } });
    if (!user) {
        user = await User.findOne({ where: { email: trimmed } });
    }
    if (!user) {
        const parts = trimmed.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            const prenom = parts[0];
            const nom = parts.slice(1).join(' ');
            user = await User.findOne({ where: { prenom, nom } });
        }
    }

    return user ? user.id : null;
};

const formatCommandeWithClient = (commande) => {
    const data = commande.toJSON();
    const client = data.User ? {
        id: data.User.id,
        nom: data.User.nom,
        prenom: data.User.prenom,
        login: data.User.login,
        email: data.User.email
    } : null;

    const client_name = data.User
        ? [data.User.prenom, data.User.nom].filter(Boolean).join(' ') || data.User.login || data.User.email
        : null;

    return {
        ...data,
        client_id: data.user_id,
        client,
        client_name,
        clientEmail: data.client_email || data.User?.email || null,
        delivery: data.delivery || null,
        modified_by: data.modified_by || null
    };
};

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
                { model: User, attributes: ['id', 'nom', 'prenom', 'login', 'email'] },
                { model: LigneCommande }
            ]
        });
        
        res.json(commandes.map(formatCommandeWithClient));
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
        const { numero, date, adresse, user_id, client_id, client, lignes, status, clientEmail, delivery } = req.body;
        
        // Accept user_id, client_id, or client name/login/email/object from frontend
        let finalUserId = user_id || client_id;
        let foundUser = null;

        if (req.user.role !== 'admin') {
            finalUserId = req.user.id;
        }

        if (!finalUserId && client) {
            finalUserId = await resolveUserIdFromClient(client);
        }

        // Validate that we have a user_id
        if (!finalUserId) {
            return res.status(400).json({ message: 'user_id, client_id ou client est requis' });
        }

        const user = foundUser || await User.findByPk(finalUserId);
        if (!user) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        
        const commande = await Commande.create({
            numero,
            date,
            adresse,
            client_email: clientEmail || null,
            delivery: delivery || null,
            user_id: finalUserId,
            status: status || 'En attente'
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
        }
        
        const commandeComplet = await Commande.findByPk(commande.id, {
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login', 'email'] },
                LigneCommande
            ]
        });
        
        res.status(201).json(formatCommandeWithClient(commandeComplet));
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
        
        const oldCommande = { ...commande.dataValues };
        const { numero, date, adresse, status, user_id, client_id, client, lignes } = req.body;

        const updateData = {};
        if (numero !== undefined) updateData.numero = numero;
        if (date !== undefined) updateData.date = date;
        if (adresse !== undefined) updateData.adresse = adresse;
        if (status !== undefined) updateData.status = status;

        let finalUserId = user_id || client_id;
        if (finalUserId === undefined && client) {
            finalUserId = await resolveUserIdFromClient(client);
        }

        if (finalUserId !== undefined) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Seul un administrateur peut changer le client' });
            }
            const newUser = await User.findByPk(finalUserId);
            if (!newUser) {
                return res.status(404).json({ message: 'Client non trouvé' });
            }
            updateData.user_id = finalUserId;
        }

        await commande.update(updateData);

        // Recharger la commande avec les nouvelles valeurs
        await commande.reload();

        const changes = {};

        // Traiter les lignes d'abord
        if (lignes && lignes.length > 0) {
            const ligneData = lignes[0];
            const line = await LigneCommande.findOne({ where: { commande_id: commande.id } });
            const oldLigne = line ? { ...line.dataValues } : null;
            
            const prixTtc = ligneData.prix_ttc !== undefined
                ? ligneData.prix_ttc
                : parseFloat((ligneData.prix_unitaire * ligneData.qte * (1 + (ligneData.tva || 0) / 100)).toFixed(2));

            if (line) {
                await line.update({
                    code_article: ligneData.code_article,
                    qte: ligneData.qte,
                    prix_unitaire: ligneData.prix_unitaire,
                    prix_ttc: prixTtc,
                    tva: ligneData.tva,
                    details: ligneData.details
                });
                // Ajouter les changements de ligne
                if (oldLigne && oldLigne.code_article !== ligneData.code_article) changes.code_article = { old: oldLigne.code_article, new: ligneData.code_article };
                if (oldLigne && oldLigne.qte !== ligneData.qte) changes.qte = { old: oldLigne.qte, new: ligneData.qte };
                if (oldLigne && oldLigne.prix_unitaire !== ligneData.prix_unitaire) changes.prix_unitaire = { old: oldLigne.prix_unitaire, new: ligneData.prix_unitaire };
                if (oldLigne && oldLigne.prix_ttc !== prixTtc) changes.prix_ttc = { old: oldLigne.prix_ttc, new: prixTtc };
                if (oldLigne && oldLigne.tva !== ligneData.tva) changes.tva = { old: oldLigne.tva, new: ligneData.tva };
                if (oldLigne && (oldLigne.details || '') !== (ligneData.details || '')) changes.details = { old: oldLigne.details, new: ligneData.details };
            } else {
                await LigneCommande.create({
                    commande_id: commande.id,
                    code_article: ligneData.code_article,
                    qte: ligneData.qte,
                    prix_unitaire: ligneData.prix_unitaire,
                    prix_ttc: prixTtc,
                    tva: ligneData.tva,
                    details: ligneData.details
                });
                changes.ligne_created = { new: ligneData };
            }
        }

        // Détecter les changements de commande
        if (numero !== undefined && oldCommande.numero !== numero) changes.numero = { old: oldCommande.numero, new: numero };
        if (date !== undefined && oldCommande.date !== date) changes.date = { old: oldCommande.date, new: date };
        if (adresse !== undefined && oldCommande.adresse !== adresse) changes.adresse = { old: oldCommande.adresse, new: adresse };
        if (status !== undefined && oldCommande.status !== status) changes.status = { old: oldCommande.status, new: status };
        if (finalUserId !== undefined && oldCommande.user_id !== finalUserId) {
            changes.user_id = { old: oldCommande.user_id, new: finalUserId };
        }

        const commandeComplet = await Commande.findByPk(req.params.id, {
            include: [
                { model: User, attributes: ['nom', 'prenom', 'login', 'email'] },
                LigneCommande
            ]
        });

        // Vérifier que les modifications ont bien été sauvegardées
        if (Object.keys(changes).length > 0) {
            console.log('Modifications sauvegardées:', changes);
        }

        res.json({ commande: formatCommandeWithClient(commandeComplet), changes });
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

        res.json(formatCommandeWithClient(commande));
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
        
        const oldLigne = { ...ligne.dataValues };
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
        
        const changes = {};
        if (oldLigne.code_article !== code_article) changes.code_article = { old: oldLigne.code_article, new: code_article };
        if (oldLigne.qte !== qte) changes.qte = { old: oldLigne.qte, new: qte };
        if (oldLigne.prix_unitaire !== prix_unitaire) changes.prix_unitaire = { old: oldLigne.prix_unitaire, new: prix_unitaire };
        if (oldLigne.prix_ttc !== prixTtc) changes.prix_ttc = { old: oldLigne.prix_ttc, new: prixTtc };
        if (oldLigne.tva !== tva) changes.tva = { old: oldLigne.tva, new: tva };
        if (oldLigne.details !== details) changes.details = { old: oldLigne.details, new: details };
        
        res.json({ ligne, changes });
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