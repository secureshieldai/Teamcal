const express = require("express");
const { protect } = require("../middleware/auth");
const { getPrevious, logSet, getRecords } = require("../controllers/exerciseperf.controller");

const router = express.Router();

router.use(protect);

router.get("/previous", getPrevious);
router.get("/records", getRecords);
router.post("/", logSet);

module.exports = router;
