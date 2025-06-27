const Product = require("../models/Product");
const { cloudinary, storage } = require('../config/cloudinary');


// controllers/productController.js or wherever your add product logic is
exports.addProduct = async (req, res) => {
  try {
    const { name, description, quantity, price, ingredients, uses} = req.body;
    const imageFile = req.file;

    console.log('REQ BODY:', req.body);
    console.log('REQ FILE:', req.file);

    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const uploaded = await cloudinary.uploader.upload(imageFile.path);

    const product = new Product({
      name,
      description,
      quantity,
      price,
      ingredients,
      uses,
      image: uploaded.secure_url

    });

    await product.save();
    console.log("✅ Product saved:", product);
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error while adding product:", err.message);
    res.status(500).json({ error: err.message || 'Server error while adding product' });
  }
};




// controllers/productController.js or wherever your fetchProducts function is
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // newest first
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.quantity = req.body.quantity || product.quantity;
    product.price = req.body.price || product.price;
    product.ingredients = req.body.ingredients || product.ingredients,
    product.uses = req.body.uses || product.uses

    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path);
      product.image = uploaded.secure_url;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product' });
  }
};


// controllers/productController.js
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error getting product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
