const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Commande = sequelize.define('Commande', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    numero: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    client_email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    delivery: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    modified_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('En attente', 'En cours', 'Livrée', 'Annulée'),
        allowNull: false,
        defaultValue: 'En attente'
    }
}, {
    tableName: 'commandes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Commande;