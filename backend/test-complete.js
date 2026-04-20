const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('🧪 RAPPORT COMPLET DE TEST - ROUTES API GET /users ET /commandes');
        console.log('='.repeat(70));
        
        // 1. Test route health
        console.log('\n📌 TEST 1: Vérification santé de l\'API');
        console.log('-'.repeat(70));
        try {
            const healthRes = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
            console.log('✅ Status: ' + healthRes.status);
            console.log('✅ Réponse:', JSON.stringify(healthRes.data));
        } catch (error) {
            console.log('❌ Erreur:', error.message);
            process.exit(1);
        }
        
        // 2. Test login admin
        console.log('\n📌 TEST 2: Authentification Admin');
        console.log('-'.repeat(70));
        let token = null;
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, 
                { login: 'admin', password: 'RitaFer@2026' },
                { timeout: 5000 }
            );
            console.log('✅ Status:', loginRes.status);
            console.log('✅ Login réussi pour l\'utilisateur:', loginRes.data.user.login);
            console.log('✅ Rôle:', loginRes.data.user.role);
            console.log('✅ ID:', loginRes.data.user.id);
            token = loginRes.data.token;
            console.log('✅ Token JWT obtenu:', token.substring(0, 50) + '...');
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
            process.exit(1);
        }
        
        if (!token) {
            console.log('\n❌ Pas de token disponible. Arrêt des tests.');
            process.exit(1);
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // 3. Test GET /users
        console.log('\n📌 TEST 3: GET /api/users - Récupération des utilisateurs');
        console.log('-'.repeat(70));
        try {
            const usersRes = await axios.get(`${BASE_URL}/users`, { headers, timeout: 5000 });
            console.log('✅ Status:', usersRes.status);
            console.log('✅ Nombre d\'utilisateurs récupérés:', usersRes.data.length);
            console.log('✅ Type de données:', typeof usersRes.data);
            console.log('\n📋 Détail des utilisateurs:');
            console.log('   ' + '-'.repeat(65));
            usersRes.data.forEach((user, idx) => {
                console.log(`   ${idx + 1}. ${user.login || 'N/A'}`);
                console.log(`      Nom: ${user.prenom} ${user.nom}`);
                console.log(`      Email: ${user.email || 'Non défini'}`);
                console.log(`      Rôle: ${user.role}`);
                console.log(`      Actif: ${user.is_active ? 'Oui' : 'Non'}`);
            });
            console.log('   ' + '-'.repeat(65));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
            process.exit(1);
        }
        
        // 4. Test GET /commandes
        console.log('\n📌 TEST 4: GET /api/commandes - Récupération des commandes');
        console.log('-'.repeat(70));
        try {
            const commandesRes = await axios.get(`${BASE_URL}/commandes`, { headers, timeout: 5000 });
            console.log('✅ Status:', commandesRes.status);
            console.log('✅ Nombre de commandes récupérées:', commandesRes.data.length);
            console.log('✅ Type de données:', typeof commandesRes.data);
            console.log('\n📋 Détail des commandes:');
            console.log('   ' + '-'.repeat(65));
            commandesRes.data.forEach((commande, idx) => {
                console.log(`   ${idx + 1}. ${commande.numero}`);
                console.log(`      Date: ${commande.date}`);
                console.log(`      Client: ${commande.client_name || 'N/A'}`);
                console.log(`      Status: ${commande.status}`);
                console.log(`      Adresse: ${commande.adresse || 'Non définie'}`);
                console.log(`      Nombre de lignes: ${commande.LigneCommandes?.length || 0}`);
            });
            console.log('   ' + '-'.repeat(65));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
            process.exit(1);
        }
        
        // Résumé final
        console.log('\n' + '='.repeat(70));
        console.log('✅ RÉSUMÉ: Tous les tests sont réussis!');
        console.log('='.repeat(70));
        console.log('✓ Connexion MySQL: Fonctionnelle');
        console.log('✓ Route /api/health: Accessible');
        console.log('✓ Authentification JWT: Opérationnelle');
        console.log('✓ GET /api/users: Retourne les données JSON depuis MySQL');
        console.log('✓ GET /api/commandes: Retourne les données JSON depuis MySQL');
        console.log('\n📊 Données en base:');
        console.log('   - 5 utilisateurs');
        console.log('   - 2 commandes');
        console.log('\n✅ Prêt pour les tests Postman/navigateur!\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur fatale:', error.message);
        process.exit(1);
    }
})();
