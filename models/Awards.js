const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Award extends Model {}

Award.init({
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  awardedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  awardedByTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Award',
  tableName: 'awards',
  timestamps: true,
});

module.exports = Award;
