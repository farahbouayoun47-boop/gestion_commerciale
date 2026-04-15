const User = require('./User');
const Commande = require('./Commande');
const LigneCommande = require('./LigneCommande');

// Relations
User.hasMany(Commande, { foreignKey: 'user_id' });
Commande.belongsTo(User, { foreignKey: 'user_id' });

Commande.hasMany(LigneCommande, { foreignKey: 'commande_id' });
LigneCommande.belongsTo(Commande, { foreignKey: 'commande_id' });

module.exports = { User, Commande, LigneCommande };