// backend/models/FailedOrder.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // ✅ correct path

// Keep columns nullable so logging never crashes if a field is missing
const FailedOrder = sequelize.define("FailedOrder", {
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: true },
  address_json: { type: DataTypes.TEXT, allowNull: true },
  cart_json: { type: DataTypes.TEXT, allowNull: true },
  payment_id: { type: DataTypes.STRING, allowNull: true },
  order_payment_id: { type: DataTypes.STRING, allowNull: true },
  signature: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "failed_orders",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

module.exports = FailedOrder;
