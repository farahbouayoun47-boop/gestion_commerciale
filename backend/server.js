const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const commandeRoutes = require('./routes/commandes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commandes', commandeRoutes);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ message: 'API fonctionnelle !' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Erreur serveur interne' });
});

// Sync database and start server
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('✅ Connexion à MySQL réussie');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('✅ Synchronisation de la base terminée');
        app.listen(PORT, () => {
            console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Erreur MySQL:', err);
    });