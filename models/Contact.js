const { Sequelize, DataTypes, Model } = require('sequelize');

// Initialize Sequelize (adjust credentials)
const sequelize = new Sequelize('u586534363_LPR_Organics', 'u586534363_lpr_organics', 'Lprorganics@123', {
  host: 'localhost',
  dialect: 'mysql',
});


class Contact extends Model {}

Contact.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  sequelize,
  modelName: 'Contact',
  tableName: 'contacts',
  timestamps: true, // automatically adds and manages createdAt and updatedAt
});

module.exports = { Contact, sequelize };
