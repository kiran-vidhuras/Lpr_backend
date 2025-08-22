const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); // Your Sequelize instance

class Update extends Model {}

Update.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  awardByTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,  // For longer text content
    allowNull: false,
  },
  youtubeLink: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Update',
  tableName: 'updates',
  timestamps: true,  // Adds createdAt and updatedAt automatically
});

module.exports = { Update };
