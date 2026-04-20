const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('\n🧪 === TESTS DES ROUTES API ===\n');
        
        // 1. Test route health
        console.log('1️⃣ Test /api/health (sans authentification):');
        try {
            const healthRes = await axios.get(`${BASE_URL}/health`);
            console.log('✅ Réponse:', JSON.stringify(healthRes.data, null, 2));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        // 2. Test login
        console.log('\n2️⃣ Test /api/auth/login:');
        let token = null;
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                login: 'admin',
                password: 'RitaFer@2026'
            });
            console.log('✅ Login réussi');
            console.log('   Utilisateur:', loginRes.data.user);
            token = loginRes.data.token;
            console.log('   Token récupéré:', token.substring(0, 30) + '...');
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        if (!token) {
            console.log('\n❌ Pas de token, impossible de continuer les tests');
            process.exit(1);
        }
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // 3. Test GET /users
        console.log('\n3️⃣ Test GET /api/users:');
        try {
            const usersRes = await axios.get(`${BASE_URL}/users`, { headers });
            console.log('✅ Utilisateurs récupérés:', usersRes.data.length, 'utilisateur(s)');
            if (usersRes.data.length > 0) {
                console.log('   Premiers utilisateurs:');
                usersRes.data.slice(0, 3).forEach(u => {
                    console.log(`   - ${u.login} (${u.nom} ${u.prenom})`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        // 4. Test GET /commandes
        console.log('\n4️⃣ Test GET /api/commandes:');
        try {
            const commandesRes = await axios.get(`${BASE_URL}/commandes`, { headers });
            console.log('✅ Commandes récupérées:', commandesRes.data.length, 'commande(s)');
            if (commandesRes.data.length > 0) {
                console.log('   Commandes:');
                commandesRes.data.forEach(c => {
                    console.log(`   - ${c.numero} (${c.date}) - Status: ${c.status} - Client: ${c.client_name}`);
                });
            }
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        console.log('\n✅ Tests terminés\n');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
})();
