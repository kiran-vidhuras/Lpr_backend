const Award = require('../models/Awards'); // Sequelize model

// GET all awards
exports.getAllAwards = async (req, res) => {
  try {
    const awards = await Award.findAll({ order: [['year', 'DESC']] });
    res.json(awards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE award
exports.createAward = async (req, res) => {
  try {
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
      description
    });

    res.status(201).json(award);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE award
// filepath: c:\Users\vsoft\Desktop\Lpr-deploy (3)\Lpr-deploy (2)\Lpr-deploy\backend\controllers\awardController.js
exports.updateAward = async (req, res) => {
  try {
    const award = await Award.findByPk(req.params.id);
    if (!award) return res.status(404).json({ message: "Award not found" });

    award.title = req.body.title;
    award.description = req.body.description;
    if (req.file) {
      award.image = req.file.path; // or cloudinary url
    }
    await award.save();
    res.json(award);
  } catch (err) {
    console.error("Error updating award:", err);
    res.status(500).json({ message: "Error updating award" });
  }
};

// DELETE award
exports.deleteAward = async (req, res) => {
  try {
    const award = await Award.findByPk(req.params.id);
    if (!award) return res.status(404).json({ message: 'Award not found' });

    await award.destroy();
    res.json({ message: 'Award deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
