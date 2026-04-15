const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LigneCommande = sequelize.define('LigneCommande', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    commande_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    code_article: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    qte: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    prix_unitaire: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    prix_ttc: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    tva: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ligne_commandes',
    timestamps: false
});

module.exports = LigneCommande;