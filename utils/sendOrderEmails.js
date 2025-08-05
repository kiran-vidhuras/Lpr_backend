const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const logoPath = path.join(__dirname, "../assets/LPR-Organics-Logo.png");
const PDFDocument = require("pdfkit");

const generateInvoicePdf = (
  cartItems,
  totalAmount,
  address,
  paymentId,
  orderId
) => {
  const PDFDocument = require("pdfkit");
  const fs = require("fs");
  const path = require("path");

  const invoicesDir = path.join(__dirname, "../invoices");

  // ✅ Create 'invoices' folder if it doesn't exist
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }

  const fileName = `invoice-${paymentId}.pdf`;
  const filePath = path.join(invoicesDir, fileName);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, { fit: [120, 120], align: "center" });
    doc.moveDown(1);
  }

  doc.fontSize(20).text("LPR Organics - Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Order ID: ${orderId}`);
  doc.text(`Payment ID: ${paymentId}`);
  doc.moveDown();

  doc.text("Customer Details:");
  doc.text(`${address.firstName} ${address.lastName}`);
  doc.text(
    `${address.street}, ${address.city}, ${address.state} - ${address.zip}`
  );
  doc.text(`${address.country}`);
  doc.text(`Phone: ${address.phone}`);
  doc.text(`Email: ${address.email}`);
  doc.moveDown();

  doc.text("Items Purchased:");
  cartItems.forEach((item, idx) => {
    const price = item.selectedVariant?.price || item.price || 0;
    doc.text(`${idx + 1}. ${item.name} - x${item.quantity} @ Rs${price}/-`);
  });

  doc.moveDown();
  doc
    .fontSize(14)
    .text(`Total Amount Paid: Rs${totalAmount}/-`, { bold: true });

  doc.end();

  return new Promise((resolve) => {
    stream.on("finish", () => resolve(filePath));
  });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateItemsHtml = (cartItems) => {
  return cartItems
    .map(
      (item) =>
        `<li>${item.name} (x${item.quantity}) - ₹${item.selectedVariant.price} each</li>`
    )
    .join("");
};

// 👤 Email to customer
const sendUserEmail = async (
  to,
  cartItems,
  totalAmount,
  address,
  paymentId,
  orderId
) => {
  const itemsHtml = generateItemsHtml(cartItems);
  const invoicePath = await generateInvoicePdf(
    cartItems,
    totalAmount,
    address,
    paymentId,
    orderId
  );

  const mailOptions = {
    from: `"LPR Organics" <${process.env.EMAIL_USER}>`,
    to,
    subject: "✅ Order Confirmation - LPR Organics",
    html: `
      <h2>Thanks for your purchase!</h2>
      <p>We have received your order successfully.</p>
      <h3>🛍️ Items:</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>Total Paid:</strong> ₹${totalAmount.toFixed(2)}</p>
      <h3>📦 Delivery Address:</h3>
      <p>
        ${address.firstName} ${address.lastName}<br/>
        ${address.street}, ${address.city}, ${address.state}, ${
      address.zip
    }<br/>
        ${address.country}<br/>
        Phone: ${address.phone}
      </p>
      <hr/>
      <p>We’ll notify you when your order is shipped.</p>
    `,
    attachments: [
      {
        filename: `invoice-${paymentId}.pdf`,
        path: invoicePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

// 🧑‍💼 Email to admin
const sendAdminEmail = async (
  cartItems,
  totalAmount,
  address,
  paymentId,
  orderId
) => {
  const itemsHtml = generateItemsHtml(cartItems);
  const invoicePath = await generateInvoicePdf(
    cartItems,
    totalAmount,
    address,
    paymentId,
    orderId
  );

  const mailOptions = {
    from: `"LPR Organics" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "📥 New Order Received - LPR Organics",
    html: `
      <h2>New Order Received</h2>
      <p><strong>Amount Paid:</strong> ₹${totalAmount.toFixed(2)}</p>
      <h3>🛒 Items:</h3>
      <ul>${itemsHtml}</ul>
      <h3>📨 Customer Details:</h3>
      <p>
        ${address.firstName} ${address.lastName}<br/>
        ${address.email}<br/>
        ${address.street}, ${address.city}, ${address.state}, ${
      address.zip
    }<br/>
        ${address.country}<br/>
        Phone: ${address.phone}
      </p>
    `,
    attachments: [
      {
        filename: `invoice-${paymentId}.pdf`,
        path: invoicePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendUserEmail, sendAdminEmail };
