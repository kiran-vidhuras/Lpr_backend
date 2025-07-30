const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  awardByTitle: { type: String },
  content: { type: String, required: true },
  youtubeLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Update", updateSchema);
