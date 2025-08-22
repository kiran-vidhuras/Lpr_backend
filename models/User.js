const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');  // Adjust this path to your database.js
const bcrypt = require('bcrypt');

class User extends Model {
  // You can add instance or class methods here if needed
}

User.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },

  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;
