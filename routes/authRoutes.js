// routes/authRoutes.js
const express = require("express");
const router = express.Router();

// Correct relative path to authController
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Forgot password route
router.post("/forgot", forgotPassword);

// Reset password route with token parameter
router.post("/reset/:token", resetPassword);

module.exports = router;
