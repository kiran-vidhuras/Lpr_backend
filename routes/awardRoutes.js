const express = require("express");
const router = express.Router();

const {
  getAllAwards,
  createAward,
  updateAward,
  deleteAward,
} = require("../controllers/awardController");

const { protect } = require("../middleware/authMiddleware");

const multer = require("multer");
const { storage } = require("../config/cloudinary");  // only this one, relative path

const upload = multer({ storage });

router.get("/", getAllAwards);

router.post("/", protect('admin'), upload.single("image"), createAward);

router.put("/:id", protect('admin'), upload.single("image"), updateAward);

router.delete("/:id", protect('admin'), deleteAward);

module.exports = router;
