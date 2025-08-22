const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Register user
exports.register = async (req, res) => {
  const db = req.app.locals.db; // your MySQL pool or connection passed via app.locals
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    console.log("Registering user with email:", normalizedEmail);

    // Check if email already exists
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [name, normalizedEmail, hashedPassword, role || "user"]
    );

    // Get the inserted user info (exclude password)
    const [newUserRows] = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [result.insertId]
    );
    const newUser = newUserRows[0];

    // Generate JWT token
    const token = generateToken(newUser);

    res.json({
      token,
      user: newUser,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
exports.login = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (users.length === 0)
      return res.status(400).json({ message: "Invalid email or password" });

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Remove password before sending
    delete user.password;

    const token = generateToken(user);

    res.json({
      token,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot password - send reset link
exports.forgotPassword = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = users[0];

    // Create token for reset, expires in 15 minutes
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min from now

    // Save token and expiry to DB
    await db.query(
      "UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE id = ?",
      [token, expires, user.id]
    );

    // Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset/${token}`.replace(
      /([^:]\/)\/+/g,
      "$1"
    );

    // Send reset email
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Password",
      html: `
        <p>Click the link below to reset your password. This link will expire in 15 minutes:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    });

    res.json({ message: "Reset link sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id, token and check token expiry
    const [users] = await db.query(
      "SELECT * FROM users WHERE id = ? AND resetPasswordToken = ? AND resetPasswordExpires > NOW()",
      [decoded.id, token]
    );

    if (users.length === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token fields
    await db.query(
      "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?",
      [hashedPassword, decoded.id]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};
