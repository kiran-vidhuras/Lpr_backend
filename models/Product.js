const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// Variant model
class Variant extends Model {}

Variant.init({
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT, // Or DECIMAL(10,2) for exact money precision
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  sequelize,
  modelName: 'Variant',
  tableName: 'variants',
  timestamps: false,
});

// Product model
class Product extends Model {}

Product.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productLogo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  uses: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Product',
  tableName: 'products',
  timestamps: true,
});

// Associations
Product.hasMany(Variant, {
  foreignKey: 'productId',
  as: 'variants',
  onDelete: 'CASCADE',
});
Variant.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

module.exports = { Product, Variant };





// const mongoose = require("mongoose");

// const variantSchema = new mongoose.Schema({
//   label: { type: String, required: true }, // e.g., "250g"
//   price: { type: Number, required: true },
//   quantity: { type: Number, required: true },
//   description: { type: String }
// });

// const productSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   image: { type: String, required: true },
//   productLogo: { type: String },
//   description: { type: String },
//   ingredients: { type: String, required: true },
//   uses: { type: String },
//   variants: [variantSchema]
// }, { timestamps: true });

// module.exports = mongoose.model("Product", productSchema);
