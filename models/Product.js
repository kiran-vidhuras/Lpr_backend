const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g., "250g"
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true }, // URL or base64
    productLogo: { type: String }, // Optional — fine
    description: { type: String }, // Optional — may want required if shown in UI
    ingredients: { type: String, required: true },
    uses: { type: String }, // Optional
    category: { type: String, required: true },
    variants: [variantSchema], // ✅ Assuming variantSchema is defined
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

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
