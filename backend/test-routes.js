const sequelize = require('./config/db');
const { User, Commande } = require('./models');

(async () => {
    try {
        console.log('\n🔍 === INSPECTION DE LA BASE DE DONNÉES ===\n');
        
        // Connexion
        await sequelize.authenticate();
        console.log('✅ Connexion à MySQL réussie\n');
        
        // Vérifier les utilisateurs
        console.log('👥 === UTILISATEURS ===');
        const users = await User.findAll();
        console.log(`Total: ${users.length} utilisateurs`);
        if (users.length > 0) {
            console.log('Utilisateurs:');
            users.forEach(u => {
                console.log(`  - ${u.login} (${u.nom} ${u.prenom}) - Role: ${u.role} - Actif: ${u.is_active}`);
            });
        } else {
            console.log('❌ Aucun utilisateur trouvé');
        }
        
        // Vérifier les commandes
        console.log('\n📦 === COMMANDES ===');
        const commandes = await Commande.findAll({
            include: [{ model: User, attributes: ['login', 'nom', 'prenom'] }]
        });
        console.log(`Total: ${commandes.length} commandes`);
        if (commandes.length > 0) {
            console.log('Commandes:');
            commandes.forEach(c => {
                const clientName = c.User ? `${c.User.prenom} ${c.User.nom}` : 'Inconnu';
                console.log(`  - ${c.numero} (${c.date}) - Client: ${clientName} - Status: ${c.status}`);
            });
        } else {
            console.log('❌ Aucune commande trouvée');
        }
        
        console.log('\n✅ Inspection terminée');
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
    } finally {
        await sequelize.close();
    }
})();
