const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");
// Login untuk karyawan (mobile)
router.post("/login", authController.login);
router.post("/login-owner", authController.loginOwner);
router.post("/register-owner", authController.registerOwner);
router.post("/register-karyawan", authController.registerKaryawan);
// authRoutes.js
router.get(
  "/check-karyawan/:id_karyawan",
  authController.checkKaryawanHasAccount
);

module.exports = router;
