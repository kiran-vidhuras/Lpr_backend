const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { sendUserEmail, sendAdminEmail } = require("../utils/sendOrderEmails");

/* -------------------------------
   MODELS
-------------------------------- */
// User
const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
}, { tableName: "users", timestamps: false }); 

// Order
const Order = sequelize.define("Order", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: "total_amount" },
  status: { type: DataTypes.ENUM("pending", "paid", "shipped", "delivered", "cancelled"), defaultValue: "pending" },
  paymentStatus: { type: DataTypes.ENUM("unpaid", "paid", "pending"), defaultValue: "unpaid", field: "payment_status" },
  address: { type: DataTypes.JSON, allowNull: false },
  razorpayOrderId: { type: DataTypes.STRING, field: "razorpay_order_id" },
  razorpayPaymentId: { type: DataTypes.STRING, field: "razorpay_payment_id" },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { tableName: "orders", timestamps: false });

// Payment
const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false, field: "order_id" },
  paymentMethod: { type: DataTypes.STRING(50), defaultValue: "Razorpay", field: "payment_method" },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  transactionId: { type: DataTypes.STRING(255), unique: true, field: "transaction_id" },
  phone: { type: DataTypes.STRING(20) },
  razorpayPaymentId: { type: DataTypes.STRING(255), unique: true, field: "razorpay_payment_id" },
  razorpaySignature: { type: DataTypes.STRING(255), field: "razorpay_signature" },
  created_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
}, { tableName: "payments", timestamps: false });

// OrderItem
const OrderItem = sequelize.define("OrderItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false, field: "order_id" },
  productId: { type: DataTypes.INTEGER, allowNull: false, field: "product_id" },
  variantId: { type: DataTypes.INTEGER, field: "variant_id" },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  variantLabel: { type: DataTypes.STRING(100), field: "variant_label" },
  paymentId: { type: DataTypes.INTEGER, allowNull: false, field: "payment_id" }
}, { tableName: "order_items", timestamps: false });

/* -------------------------------
   ASSOCIATIONS
-------------------------------- */
Order.belongsTo(User, { foreignKey: "userId", as: "user" });
Payment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
Order.hasMany(Payment, { foreignKey: "orderId", as: "payments" });
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });

/* -------------------------------
   SAVE ORDER + PAYMENT
-------------------------------- */
async function savePaymentAndOrderMySQL({
  userId,
  cartItems,
  totalAmount,
  address,
  razorpayOrderId,
  razorpayPaymentId,
  paymentMethod = "Razorpay"
}) {
  const transaction = await sequelize.transaction();

  try {
    // ✅ Ensure user exists
    const user = await User.findByPk(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);

    // ✅ Validate cartItems
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Cart items cannot be empty");
    }

    // Validate each cart item
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || !item.price) {
        throw new Error(`Invalid cart item data for productId: ${item.productId}`);
      }
    }

    // ✅ Validate address
    if (!address || !address.street || !address.city || !address.state || !address.zip) {
      throw new Error("Address is incomplete. Street, City, State, and ZIP are required.");
    }

    // ✅ Create order
    const order = await Order.create({
      userId,
      totalAmount,
      status: "paid", // Update based on actual payment status later
      paymentStatus: "paid",
      address: JSON.stringify(address),
      razorpayOrderId,
      razorpayPaymentId
    }, { transaction });

    // ✅ Save payment
    const payment = await Payment.create({
      orderId: order.id,
      paymentMethod,
      amount: totalAmount,
      transactionId: razorpayPaymentId,
      razorpayPaymentId,
    }, { transaction });

    // ✅ Save order items
    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        variantLabel: item.variantLabel || null,
        quantity: item.quantity,
        price: item.price,
        paymentId: payment.id
      }, { transaction });
    }

    await transaction.commit();

    // ✅ Send emails (non-blocking)
    sendUserEmail(address.email, cartItems, totalAmount, address, razorpayPaymentId, razorpayOrderId)
      .catch(err => console.error("Email sending failed (user):", err));
    sendAdminEmail(cartItems, totalAmount, address, razorpayPaymentId, razorpayOrderId)
      .catch(err => console.error("Email sending failed (admin):", err));

    return { success: true, orderId: order.id };
  } catch (err) {
    await transaction.rollback();
    console.error("Error saving payment/order:", err);
    return { success: false, message: err.message };
  }
}

module.exports = { savePaymentAndOrderMySQL, User, Order, Payment, OrderItem };
