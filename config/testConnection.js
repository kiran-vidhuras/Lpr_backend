const sequelize = require('./database');

sequelize.authenticate()
  .then(() => console.log('MySQL connected successfully.'))
  .catch((err) => console.error('Unable to connect to MySQL:', err));
