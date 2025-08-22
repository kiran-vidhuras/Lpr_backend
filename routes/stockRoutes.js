// routes/stockRoutes.js
const express = require("express");
const router = express.Router();
const sequelize = require("../config/database"); // your sequelize instance

// POST /api/stock/check
router.post("/check", async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty or invalid.",
      });
    }

    console.log("📦 Received cartItems:", { cartItems });

    for (let item of cartItems) {
      // Ensure productId is a number
      const productId = Number(item.productId);
      const variantLabel = item.variantLabel;
      const quantityRequested = Number(item.quantity);

      if (!productId || !variantLabel || !quantityRequested) {
        return res.status(400).json({
          success: false,
          message: `Invalid data for item: ${JSON.stringify(item)}`,
        });
      }

      console.log("Checking stock for item:", {
        productId,
        variantLabel,
        quantityRequested,
      });

      // Fetch variant quantity from DB
      const rows = await sequelize.query(
        "SELECT quantity FROM variants WHERE productId = ? AND label = ? LIMIT 1",
        {
          replacements: [productId, variantLabel],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!rows || rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Variant '${variantLabel}' not found for product ID ${productId}`,
        });
      }

      const availableQty = rows[0].quantity;

      if (availableQty < quantityRequested) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for variant '${variantLabel}'. Requested: ${quantityRequested}, Available: ${availableQty}`,
        });
      }
    }

    // If we reached here, all items are in stock
    return res.json({
      success: true,
      message: "All items in stock.",
    });
  } catch (err) {
    console.error("Stock check error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking stock.",
      error: err.message,
    });
  }
});

module.exports = router;
