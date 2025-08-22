const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function fetchAllPayments() {
  try {
    const response = await instance.payments.all({});
    return response.items;
  } catch (err) {
    console.error("Error in fetchAllPayments:", err);
    throw err;
  }
}

module.exports = { fetchAllPayments };
