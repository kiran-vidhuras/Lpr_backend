const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const mysql = require("mysql2/promise");
const chalk = require("chalk").default;

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const addressRoutes = require("./routes/addressRoutes");
const stockRoutes = require("./routes/stockRoutes");
const orderRoutes = require("./routes/orderRoutes");
const updateRoutes = require("./routes/updateRoutes");
const awardRoutes = require("./routes/awardRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

let db;

// Enable CORS
app.use(cors());
console.log(`${chalk.blue("🌐 CORS enabled")}`);

// Webhook route BEFORE body parsers
app.use("/api/webhook", webhookRoutes);
console.log(chalk.blue("📡 Webhook route registered"));

// JSON & URL parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
console.log(chalk.green("✅ JSON & URL Encoded middleware set up"));

// ✅ Test Razorpay Route
app.get("/test-razorpay", async (req, res) => {
  console.log(chalk.yellow("⚡ Test Razorpay endpoint hit"));
  try {
    const Razorpay = require("razorpay");
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log(chalk.magenta("🔑 Razorpay instance created"));

    const order = await instance.orders.create({
      amount: 100, // ₹1 in paise
      currency: "INR",
      receipt: "test_1",
    });

    console.log(chalk.green("📦 Test Razorpay order created:"), order);
    res.json(order);
  } catch (err) {
    console.error(chalk.red("❌ Razorpay Test Error:"), err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Fetch all Razorpay payments
app.get("/api/payments/all", async (req, res) => {
  try {
    const Razorpay = require("razorpay");
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
      
    });

    let allPayments = [];
    let options = { count: 100, skip: 0 };

    while (true) {
      const payments = await instance.payments.all(options);
      allPayments = allPayments.concat(payments.items);

      if (payments.items.length < options.count) break;
      options.skip += options.count;
    }

    res.json(allPayments);
  } catch (err) {
    console.error(chalk.red("❌ Razorpay fetch error:"), err.message);
    res.status(500).json({ error: err.message });
  }
});

// Connect to MySQL
async function connectDB() {
  try {
    console.log(chalk.yellow("⏳ Connecting to MySQL..."));
    db = await mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await db.query("SELECT 1");
    console.log(chalk.green("✅ MySQL connected successfully"));

    app.locals.db = db;

    // Mount API routes
    console.log(chalk.blue("🚀 Registering API routes..."));
    app.use("/api/auth", authRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/contact", contactRoutes);
    app.use("/api/payments", paymentRoutes); // includes order & validate endpoints
    app.use("/api/stock", stockRoutes);
    app.use("/api/address", addressRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/updates", updateRoutes);
    app.use("/api/awards", awardRoutes);

    // Error handler
    app.use((err, req, res, next) => {
      console.error(chalk.red("💥 Internal Server Error:"), err.stack);
      res.status(500).json({ message: "Internal Server Error" });
    });

    app.listen(PORT, () => {
      console.log(chalk.greenBright(`🚀 Server running on: http://localhost:${PORT}`));
    });
  } catch (error) {
    console.error(chalk.red("❌ MySQL connection error:"), error);
    process.exit(1);
  }
}

connectDB();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log(chalk.yellow("⚠️ Shutting down gracefully..."));
  if (db) await db.end();
  console.log(chalk.green("✅ MySQL connection closed"));
  process.exit(0);
});
