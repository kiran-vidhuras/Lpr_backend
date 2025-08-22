// controllers/paymentController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../config/database");
const { QueryTypes } = require("sequelize");
const FailedOrder = require("../models/FailedOrder");
const ConfirmedOrder = require("../models/ConfirmedOrder");
const Order = require("../models/Orders");
// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const order = await razorpay.orders.create({ amount, currency, receipt, payment_capture: 1 });
    res.json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

exports.validatePayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    cartItems = [],
    userId,
    address = {},
    totalAmount,
  } = req.body;

  const uid = Number(userId || 0);

  // 🔑 Verify signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = hmac.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const t = await db.transaction();
try {
  // ---- ADDRESS (insert or update)
  let addressId;
  const existing = await db.query(
    `SELECT id FROM addresses WHERE user_id = :userId LIMIT 1`,
    {
      replacements: { userId: uid },
      type: QueryTypes.SELECT,
      transaction: t,
    }
  );

  if (existing.length) {
    addressId = existing[0].id;
    await db.query(
      `UPDATE addresses
       SET first_name = :firstName, last_name = :lastName, email = :email, phone = :phone,
           street = :street, city = :city, state = :state, zip = :zip, country = :country
       WHERE id = :addressId`,
      {
        replacements: {
          addressId,
          firstName: address.firstName || null,
          lastName: address.lastName || null,
          email: address.email || null,
          phone: address.phone || null,
          street: address.street || null,
          city: address.city || null,
          state: address.state || null,
          zip: address.zip || null,
          country: address.country || null,
        },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );
  } else {
    await db.query(
      `INSERT INTO addresses
       (user_id, first_name, last_name, email, phone, street, city, state, zip, country)
       VALUES (:userId, :firstName, :lastName, :email, :phone, :street, :city, :state, :zip, :country)`,
      {
        replacements: {
          userId: uid,
          firstName: address.firstName || null,
          lastName: address.lastName || null,
          email: address.email || null,
          phone: address.phone || null,
          street: address.street || null,
          city: address.city || null,
          state: address.state || null,
          zip: address.zip || null,
          country: address.country || null,
        },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    const rows = await db.query(`SELECT LAST_INSERT_ID() AS id`, {
      type: QueryTypes.SELECT,
      transaction: t,
    });
    addressId = rows[0].id;
  }

  // ---- ORDER
  await db.query(
    `INSERT INTO orders (user_id, address_id, total_amount, status, payment_status, razorpay_order_id)
     VALUES (:userId, :addressId, :totalAmount, 'pending', 'pending', :rzpOrderId)`,
    {
      replacements: {
        userId: uid,
        addressId: Number(addressId || null),
        totalAmount: Number(totalAmount || 0),
        rzpOrderId: razorpay_order_id || "",
      },
      type: QueryTypes.INSERT,
      transaction: t,
    }
  );

  const orderRow = await db.query(`SELECT LAST_INSERT_ID() AS id`, {
    type: QueryTypes.SELECT,
    transaction: t,
  });
  const orderId = orderRow[0].id;

  // ---- PAYMENT
  await db.query(
    `INSERT INTO payments
     (order_id, payment_method, amount, transaction_id, phone, razorpay_payment_id, razorpay_signature)
     VALUES (:orderId, :paymentMethod, :amount, :transactionId, :phone, :razorpayPaymentId, :razorpaySignature)`,
    {
      replacements: {
        orderId,
        paymentMethod: 'Razorpay',
        amount: Number(totalAmount || 0),
        transactionId: null,
        phone: address.phone || null,
        razorpayPaymentId: razorpay_payment_id || null,
        razorpaySignature: razorpay_signature || null,
      },
      type: QueryTypes.INSERT,
      transaction: t,
    }
  );

  const paymentRow = await db.query(`SELECT LAST_INSERT_ID() AS id`, {
    type: QueryTypes.SELECT,
    transaction: t,
  });
  const paymentId = paymentRow[0].id;

  // ---- ORDER ITEMS
for (const item of cartItems || []) {
  await db.query(
    `INSERT INTO order_items
       (order_id, product_id, variantId, quantity, price, variant_label, payment_id, created_at)
     VALUES (:orderId, :productId, :variantId, :quantity, :price, :variantLabel, :paymentId, NOW())`,
    {
      replacements: {
        orderId,
        productId: item.product_id || null,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
        price: item.price || 0,
        variantLabel: item.variant_label || null,
        paymentId,
      },
      type: QueryTypes.INSERT,
      transaction: t,
    }
  );
}



  // ---- COMMIT
await t.commit();

// ---- LOG CONFIRMED ORDER
await ConfirmedOrder.create({
  user_id: uid,
  amount: totalAmount || null,
  address_json: JSON.stringify(address || {}),
  cart_json: JSON.stringify(cartItems || []),
  payment_id: razorpay_payment_id || null,
  order_payment_id: razorpay_order_id || null,
  signature: razorpay_signature || null,
});

res.json({
  success: true,
  message: "Order, payment, and order items created successfully.",
  orderId,
});

  // ---- COMMIT
  await t.commit();

  res.json({
    success: true,
    message: "Order, payment, and order items created. Awaiting Razorpay webhook confirmation.",
    orderId,
  });

} catch (err) {
  try {
    await t.rollback();
  } catch {}

  console.error("Error validating payment:", err);

  await FailedOrder.create({
    user_id: uid,
    amount: totalAmount || null,
    reason: err?.message || "Unknown error",
    address_json: JSON.stringify(address || {}),
    cart_json: JSON.stringify(cartItems || []),
    payment_id: razorpay_payment_id || null,
    order_payment_id: razorpay_order_id || null,
    signature: razorpay_signature || null,
  });

  res.status(500).json({ success: false, message: "Payment validation failed" });
}

};
