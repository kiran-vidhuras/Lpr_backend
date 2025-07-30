const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// @desc    Add new product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      awardByTitle,
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

    const product = new Product({
      name,
      description,
      awardByTitle,
      ingredients,
      uses,
      category,
      image: imageUpload.secure_url,
      productLogo: logoUploadUrl || null,
      variants: parsedVariants,
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error while adding product:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, ingredients, uses, variants, category } =
      req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (uses !== undefined) product.uses = uses;
    if (category !== undefined) product.category = category;

    // Parse variants
    if (variants) {
      try {
        product.variants = JSON.parse(variants);
      } catch (e) {
        return res.status(400).json({ error: "Invalid variants format" });
      }
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
    res.json(product);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Error updating product" });
  }
};

// @desc    Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

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
