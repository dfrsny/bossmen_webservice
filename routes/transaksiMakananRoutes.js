const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaksiMakananController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, controller.getAll);
router.get("/:id", authenticateToken, controller.getDetail);
router.post("/", authenticateToken, controller.create);

module.exports = router;
