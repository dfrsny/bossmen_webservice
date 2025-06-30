const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, verifyOwner, gameController.getAll);
router.post("/", authenticateToken, verifyOwner, gameController.create);
router.put("/:id", authenticateToken, verifyOwner, gameController.update);
router.delete("/:id", authenticateToken, verifyOwner, gameController.remove);

module.exports = router;
