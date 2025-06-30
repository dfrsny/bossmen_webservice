const express = require("express");
const router = express.Router();
const karyawanController = require("../controllers/karyawanController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get(
  "/",
  authenticateToken,
  verifyOwner,
  karyawanController.getAllKaryawan
);
router.post(
  "/",
  authenticateToken,
  verifyOwner,
  karyawanController.createKaryawan
);
router.get("/tanpa-akun", karyawanController.getKaryawanTanpaAkun);

router.put(
  "/:id",
  authenticateToken,
  verifyOwner,
  karyawanController.updateKaryawan
);
router.delete(
  "/:id",
  authenticateToken,
  verifyOwner,
  karyawanController.deleteKaryawan
);

module.exports = router;
