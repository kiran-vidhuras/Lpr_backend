// backend/models/ConfirmedOrder.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ConfirmedOrder = sequelize.define("ConfirmedOrder", {
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  address_json: { type: DataTypes.TEXT, allowNull: true },
  cart_json: { type: DataTypes.TEXT, allowNull: true },
  payment_id: { type: DataTypes.STRING, allowNull: true },
  order_payment_id: { type: DataTypes.STRING, allowNull: true },
  signature: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "confirmed_orders",   // 🔑 this table must exist in DB
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

module.exports = ConfirmedOrder;
