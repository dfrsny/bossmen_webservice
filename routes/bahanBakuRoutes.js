const express = require("express");
const router = express.Router();
const bahanBakuController = require("../controllers/bahanBakuController");

// GET semua bahan baku
router.get("/", bahanBakuController.getAll);

// POST tambah bahan baku
router.post("/", bahanBakuController.create);

// PUT update bahan baku
router.put("/:id", bahanBakuController.update);

// DELETE hapus bahan baku
router.delete("/:id", bahanBakuController.remove);

module.exports = router;
