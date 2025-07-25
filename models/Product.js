const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g., "250g"
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: { type: String }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, 
  productLogo: { type: String },
  description: { type: String },
  ingredients: { type: String, required: true },
  uses: { type: String },
  category: { type: String, required: true }, // 👈 New field added here
  variants: [variantSchema]
}, { timestamps: true });

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
