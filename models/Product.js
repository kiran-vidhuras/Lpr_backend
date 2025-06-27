const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, // URL (Cloudinary or local)
  description: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  ingredients:{type:String, required:true},
  uses:{type:String},
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
