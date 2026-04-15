const sequelize = require('./config/db');
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected OK');
    const [results] = await sequelize.query('SHOW COLUMNS FROM commandes');
    console.log(results.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null })));
  } catch (error) {
    console.error('ERROR', error.message);
  } finally {
    await sequelize.close();
  }
})();
