const express = require("express");
const router = express.Router();
const psController = require("../controllers/psController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get(
  "/jenis",
  authenticateToken,
  verifyOwner,
  psController.getAllJenisPS
);
router.get("/games", authenticateToken, verifyOwner, psController.getAllGames);

router.get("/", authenticateToken, verifyOwner, psController.getAllPS);
router.post("/", authenticateToken, verifyOwner, psController.createPS);
router.put("/:id_ps", authenticateToken, verifyOwner, psController.updatePS);

router.patch(
  "/:id_ps/status",
  authenticateToken,
  verifyOwner,
  psController.updateStatusPS
);
router.delete("/:id_ps", authenticateToken, verifyOwner, psController.deletePS);
router.get(
  "/:id_ps/games",
  authenticateToken,
  verifyOwner,
  psController.getGamesByPS
);
router.put(
  "/:id_ps/games",
  authenticateToken,
  verifyOwner,
  psController.updateGamesOfPS
);

router.get("/:id_ps/harga-per-jam", psController.getHargaPerJam);
module.exports = router;
