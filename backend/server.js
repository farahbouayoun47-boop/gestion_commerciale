const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
    origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const commandeRoutes = require('./routes/commandes');
const clientRoutes = require('./routes/clients');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/clients', clientRoutes);

// Test route
app.get('/api/health', (req, res) => {
    res.json({ message: 'API fonctionnelle !' });
});

// Test route for clients
app.get('/api/test-clients', (req, res) => {
    res.json({ message: 'Test clients route works!' });
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
        // Disable foreign key checks during sync
        return sequelize.query('SET FOREIGN_KEY_CHECKS=0')
            .then(() => sequelize.sync({ alter: true }))
            .then(() => sequelize.query('SET FOREIGN_KEY_CHECKS=1'));
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