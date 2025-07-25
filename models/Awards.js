// models/awardModel.js
const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, required: true },
  awardedBy: { type: String },
  category: { type: String, required: true },
  image: { type: String }, // optional image URL or base64
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Award', awardSchema);
