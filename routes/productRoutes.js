const express = require("express");
const router = express.Router();

const upload = require("../middleware/multer");
const { protect } = require("../middleware/authMiddleware");
const {
  addProduct,
  getAllProducts,
  deleteProduct,
  updateProduct,
  getProductById
} = require("../controllers/productController");



// router.post('/add', verifyToken, upload.single('image'), addProduct);


router.post("/add", protect("admin"), upload.single("image"), addProduct);
router.get("/", getAllProducts);
router.delete("/:id", protect("admin"), deleteProduct);
router.put("/:id", protect("admin"), upload.single("image"), updateProduct);
router.get('/:id', getProductById);

// router.get('/stock/:id', async (req, res) => {
//   const product = await Product.findById(req.params.id);
//   res.json(product);
// });


module.exports = router;
