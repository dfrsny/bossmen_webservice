const express = require("express");
const router = express.Router();
const makananController = require("../controllers/makananController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, verifyOwner, makananController.getAll);
router.post("/", authenticateToken, verifyOwner, makananController.create);
router.put("/:id", authenticateToken, verifyOwner, makananController.update);
router.delete("/:id", authenticateToken, verifyOwner, makananController.remove);

router.get(
  "/transaksi",
  authenticateToken,
  verifyOwner,
  makananController.getTransaksiMakanan
);
router.get(
  "/transaksi/:id",
  authenticateToken,
  verifyOwner,
  makananController.getDetailTransaksi
);

module.exports = router;
