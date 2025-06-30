const express = require("express");
const router = express.Router();
const jenisPsController = require("../controllers/jenisPsController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, verifyOwner, jenisPsController.getAll);
router.post("/", authenticateToken, verifyOwner, jenisPsController.create);
router.put("/:id", authenticateToken, verifyOwner, jenisPsController.update);
router.delete("/:id", authenticateToken, verifyOwner, jenisPsController.remove);

module.exports = router;
