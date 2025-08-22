// const express = require("express");
// const router = express.Router();

// const upload = require("../middleware/multer");
// const { protect } = require("../middleware/authMiddleware");
// const {
//   addProduct,
//   getAllProducts,
//   deleteProduct,
//   updateProduct,
//   getProductById
// } = require("../controllers/productController");

// // router.post('/add', verifyToken, upload.single('image'), addProduct);

// router.post("/add", protect("admin"), upload.single("image"), addProduct);
// router.get("/", getAllProducts);
// router.delete("/:id", protect("admin"), deleteProduct);
// router.put("/:id", protect("admin"), upload.single("image"), updateProduct);
// router.get('/:id', getProductById);

// router.post(
//   "/add",
//   protect("admin"),
//   upload.fields([{ name: "image", maxCount: 1 }, { name: "productLogo", maxCount: 1 }]),
//   addProduct
// );

// router.put(
//   "/:id",
//   protect("admin"),
//   upload.fields([{ name: "image", maxCount: 1 }, { name: "productLogo", maxCount: 1 }]),
//   updateProduct
// );

// module.exports = router;


const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { protect } = require("../middleware/authMiddleware");
const {
  addProduct,
  getAllProducts,
  deleteProduct,
  updateProduct,
  getProductById,
} = require("../controllers/productController");

router.post(
  "/add",
  protect("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "productLogo", maxCount: 1 },
  ]),
  addProduct
);

router.put(
  "/:id",
  protect("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "productLogo", maxCount: 1 },
  ]),
  updateProduct
);

router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.delete("/:id", protect("admin"), deleteProduct);

module.exports = router;
