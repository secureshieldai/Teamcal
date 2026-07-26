const express = require("express");
const { protect } = require("../middleware/auth");
const { getItems, addItem, bulkAdd, updateItem, deleteItem, clearChecked } = require("../controllers/shopping.controller");

const router = express.Router();

router.use(protect);

router.get("/", getItems);
router.post("/bulk", bulkAdd);
router.post("/", addItem);
// NOTE: DELETE /checked must be defined before DELETE /:id to avoid shadowing
router.delete("/checked", clearChecked);
router.patch("/:id", updateItem);
router.delete("/:id", deleteItem);

module.exports = router;
