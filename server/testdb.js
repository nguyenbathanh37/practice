const sequelize = require('./src/config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL RDS successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
})();