const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

// Ambil semua akun user (owner dan karyawan)
router.get("/", authenticateToken, verifyOwner, userController.getAllUsers);

// Hapus akun berdasarkan ID
router.delete(
  "/:id",
  authenticateToken,
  verifyOwner,
  userController.deleteUser
);

// Update akun berdasarkan ID
router.put("/:id", authenticateToken, verifyOwner, userController.updateUser);

module.exports = router;
