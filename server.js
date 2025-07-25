const express = require("express");
const dotenv = require('dotenv'); // ✅ Correct
dotenv.config();

const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const addressRoutes = require('./routes/addressRoutes'); 
const stockRoutes = require('./routes/stockRoutes');
const orderRoutes = require('./routes/orderRoutes');
const updateRoutes = require('./routes/updateRoutes');
const awardRoutes = require("./routes/awardRoutes")


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5001;

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use('/api/contact', contactRoutes);

app.use("/api/payments", paymentRoutes);

app.use('/api/stock', stockRoutes);

app.use('/api/address', addressRoutes); 

app.use('/api/orders' , orderRoutes);

app.use('/api/updates', updateRoutes);

app.use('/api/awards', awardRoutes);

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

connectDB();
