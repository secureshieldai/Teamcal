const express = require("express");
const { protect } = require("../middleware/auth");
const { getAppointments, book, updateAppointment, cancelAppointment } = require("../controllers/appointment.controller");

const router = express.Router();

router.use(protect);

router.get("/", getAppointments);
router.post("/", book);
router.patch("/:id", updateAppointment);
router.delete("/:id", cancelAppointment);

module.exports = router;
