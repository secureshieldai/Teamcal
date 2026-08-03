const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getProducts, getFeaturedProducts, getCategories,
  getProduct, createProduct, updateProduct, deleteProduct, checkout, getOrders, refundOrder, getDisputes,
  searchProducts,
} = require("../controllers/marketplace.controller");

const router = express.Router();

router.use(protect);

// Specific paths before /:id
router.get("/products/featured", getFeaturedProducts);
router.get("/categories", getCategories);
router.get("/search", searchProducts);
router.get("/orders", getOrders);
router.post("/orders/:id/refund", refundOrder);
router.get("/disputes", getDisputes);
router.post("/checkout", checkout);
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

module.exports = router;
