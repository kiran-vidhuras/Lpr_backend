const { Sequelize, DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database"); // DB connection

class Payment extends Model {}
Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      defaultValue: "Razorpay",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    transaction_id: {
       type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
       type: DataTypes.STRING(20),
      allowNull: false,
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: true,
    },
    razorpay_signature: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
    timestamps: false,
  }
);

class PaymentItem extends Model {}
PaymentItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
      order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    variant_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "PaymentItem",
    tableName: "order_items",
    timestamps: false,
  }
);

// Associations
Payment.hasMany(PaymentItem, {
  foreignKey: "payment_id",
  as: "items",
  onDelete: "CASCADE",
});
PaymentItem.belongsTo(Payment, {
  foreignKey: "payment_id",
  as: "payment",
});

module.exports = { Payment, PaymentItem };
