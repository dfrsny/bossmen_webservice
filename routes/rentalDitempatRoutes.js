const express = require("express");
const router = express.Router();
const rentalDitempatController = require("../controllers/rentalDitempatController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Buat sewa baru
router.post(
  "/",
  authenticateToken,
  rentalDitempatController.createSewaDitempat
);
// Ambil daftar sewa ditempat (dengan filter optional)
router.get(
  "/list",
  authenticateToken,
  rentalDitempatController.getSewaDitempatList
);

// Selesaikan sewa
router.patch(
  "/:id_sewa_ditempat/complete",
  authenticateToken,
  rentalDitempatController.completeSewaDitempat
);
// Ambil sewa aktif berdasarkan PS
router.get(
  "/active/:id_ps",
  authenticateToken,
  rentalDitempatController.getActiveSewaByPs
);

module.exports = router;
