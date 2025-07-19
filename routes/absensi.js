const express = require("express");
const router = express.Router();
const absensiController = require("../controllers/absensiController");
const uploadAbsensi = require("../middlewares/uploadAbsensi");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post(
  "/",
  authenticateToken,
  uploadAbsensi,
  absensiController.createAbsensi
);
router.get(
  "/hari-ini/:id_karyawan",
  authenticateToken,
  absensiController.getAbsensiHariIni
);

module.exports = router;
