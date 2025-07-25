
const Award = require("../models/Awards.js");

exports.getAllAwards = async (req, res) => {
  const awards = await Award.find().sort({ year: -1 });
  res.json(awards);
};

exports.createAward = async (req, res) => {
  const { title, year, awardedBy, category, description } = req.body;

  if (!title || !year || !category || !description) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const imageUrl = req.file ? req.file.path : "";

  const award = await Award.create({
    title,
    year,
    awardedBy,
    category,
    image: imageUrl,
    description,
  });

  res.status(201).json(award);
};

exports.updateAward = async (req, res) => {
  const award = await Award.findById(req.params.id);
  if (!award) return res.status(404).json({ message: 'Award not found' });

  const { title, year, awardedBy, category, description } = req.body;

  award.title = title || award.title;
  award.year = year || award.year;
  award.awardedBy = awardedBy || award.awardedBy;
  award.category = category || award.category;
  award.description = description || award.description;

  // Optional: if new image uploaded
  if (req.file) {
    award.image = req.file.path;
  }

  await award.save();
  res.json(award);
};


exports.deleteAward = async (req, res) => {
  const award = await Award.findById(req.params.id);
  if (!award) return res.status(404).json({ message: 'Award not found' });

  await award.deleteOne();
  res.json({ message: 'Award deleted successfully' });
};