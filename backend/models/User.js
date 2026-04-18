const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    prenom: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        unique: false
    },
    login: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
        validate: {}
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {}
    },
    role: {
        type: DataTypes.ENUM('admin', 'client'),
        defaultValue: 'client'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    telephone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    entreprise: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Hash password before create
User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

User.prototype.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = User;