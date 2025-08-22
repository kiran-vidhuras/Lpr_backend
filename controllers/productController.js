const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const { Product, Variant } = require("../models/Product");  // Adjust path if needed

// @desc    Add new product
exports.addProduct = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Files received:", req.files);
    const {
      name,
      description,
      awardByTitle,   // you had this but not in model? Double check
      ingredients,
      uses,
      variants,
      category,
    } = req.body;

    const files = req.files;

    const imageFile = files?.image?.[0];
    if (!imageFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imageUpload = await cloudinary.uploader.upload(imageFile.path);

    let logoUploadUrl = "";
    const logoFile = files?.productLogo?.[0];
    if (logoFile) {
      const logoUpload = await cloudinary.uploader.upload(logoFile.path);
      logoUploadUrl = logoUpload.secure_url;
    }

    const parsedVariants = variants ? JSON.parse(variants) : [];

    // Create product first
    const product = await Product.create({
      name,
      description,
      awardByTitle,   // If this exists in your model, otherwise remove it here
      ingredients,
      uses,
      category,
      image: imageUpload.secure_url,
      productLogo: logoUploadUrl || null,
    });

    // If variants exist, bulk create variants with productId
    if (parsedVariants.length > 0) {
      const variantsToCreate = parsedVariants.map(v => ({
        label: v.label,
        price: v.price,
        quantity: v.quantity,
        description: v.description,
        productId: product.id,
      }));
      await Variant.bulkCreate(variantsToCreate);
    }

    // Reload product with variants included (optional)
    const productWithVariants = await Product.findByPk(product.id, {
      include: [{ model: Variant, as: 'variants' }]
    });

    res.status(201).json(productWithVariants);
  } catch (err) {
    console.error("❌ Error while adding product:", err);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const products = await Product.findAll({
      where: filter,
      order: [['createdAt', 'DESC']],
      include: [{ model: Variant, as: 'variants' }]
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Variant, as: 'variants' }]
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error getting product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Variant, as: 'variants' }]
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, ingredients, uses, variants, category } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (uses !== undefined) product.uses = uses;
    if (category !== undefined) product.category = category;

    // Parse and update variants if provided
    if (variants) {
      let parsedVariants;
      try {
        parsedVariants = JSON.parse(variants);
      } catch {
        return res.status(400).json({ error: "Invalid variants format" });
      }

      // Delete old variants and add new ones (simple approach)
      await Variant.destroy({ where: { productId: product.id } });

      const variantsToCreate = parsedVariants.map(v => ({
        label: v.label,
        price: v.price,
        quantity: v.quantity,
        description: v.description,
        productId: product.id,
      }));

      await Variant.bulkCreate(variantsToCreate);
    }

    // Handle new file uploads
    const files = req.files;
    const imageFile = files?.image?.[0];
    const logoFile = files?.productLogo?.[0];

    if (imageFile) {
      const uploaded = await cloudinary.uploader.upload(imageFile.path);
      product.image = uploaded.secure_url;
    }

    if (logoFile) {
      try {
        const logoUpload = await cloudinary.uploader.upload(logoFile.path);
        product.productLogo = logoUpload.secure_url;
      } catch (err) {
        console.error("Logo upload failed:", err.message);
      }
    }

    await product.save();

    // Reload product with variants
    const updatedProduct = await Product.findByPk(product.id, {
      include: [{ model: Variant, as: 'variants' }]
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Error updating product" });
  }
};

// @desc    Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await Variant.destroy({ where: { productId: req.params.id } });
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// exports.deleteProduct = async (req, res) => {
//   try {
//     await Variant.destroy({ where: { productId: req.params.id } });
//     await Product.destroy({ where: { id: req.params.id } });
//     res.json({ message: "Product deleted" });
//   } catch (error) {
//     console.error("Delete failed:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// const Product = require("../models/Product");
// const { cloudinary } = require('../config/cloudinary');

// exports.addProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       ingredients,
//       uses,
//       variants
//     } = req.body;

//     const files = req.files;

//     const imageFile = files?.image?.[0];
//     if (!imageFile) {
//       return res.status(400).json({ error: "Image is required" });
//     }

//     const imageUpload = await cloudinary.uploader.upload(imageFile.path);

//     let logoUploadUrl = '';
//     const logoFile = files?.productLogo?.[0];
//     if (logoFile) {
//       const logoUpload = await cloudinary.uploader.upload(logoFile.path);
//       logoUploadUrl = logoUpload.secure_url;
//     }

//     const parsedVariants = variants ? JSON.parse(variants) : [];

//     const product = new Product({
//       name,
//       description,
//       ingredients,
//       uses,
//       image: imageUpload.secure_url,
//       productLogo: logoUploadUrl || null,
//       variants: parsedVariants
//     });

//     await product.save();
//     res.status(201).json(product);
//   } catch (err) {
//     console.error("❌ Error while adding product:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// };

// // @desc    Get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find().sort({ createdAt: -1 });
//     res.json(products);
//   } catch (err) {
//     console.error('Error fetching products:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // @desc    Get single product
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: 'Product not found' });
//     res.json(product);
//   } catch (err) {
//     console.error('Error getting product:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     const {
//       name,
//       description,
//       ingredients,
//       uses,
//       variants
//     } = req.body;

//     // Update text fields
//     if (name) product.name = name;
//     if (description) product.description = description;
//     if (ingredients) product.ingredients = ingredients;
//     if (uses) product.uses = uses;

//     // Parse and update variants
//     if (variants) {
//       try {
//         product.variants = JSON.parse(variants);
//       } catch (e) {
//         return res.status(400).json({ error: "Invalid variants format" });
//       }
//     }

//     const files = req.files;
//     const imageFile = files?.image?.[0];
//     const logoFile = files?.productLogo?.[0];

//     if (imageFile) {
//       const uploaded = await cloudinary.uploader.upload(imageFile.path);
//       product.image = uploaded.secure_url;
//     }
//     if (logoFile) {
//       try {
//         const logoUpload = await cloudinary.uploader.upload(logoFile.path);
//         product.productLogo = logoUpload.secure_url;
//       } catch (err) {
//         console.error("Logo upload failed:", err.message);
//       }
//     }

//     await product.save();
//     res.json(product);
//   } catch (err) {
//     console.error('Error updating product:', err);
//     res.status(500).json({ message: 'Error updating product' });
//   }
// };

// // @desc    Delete product
// exports.deleteProduct = async (req, res) => {
//   try {
//     await Product.findByIdAndDelete(req.params.id);
//     res.json({ message: "Product deleted" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
