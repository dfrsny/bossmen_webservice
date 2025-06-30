const express = require("express");
const router = express.Router();
const penggunaanController = require("../controllers/penggunaanBahanController");

// POST penggunaan bahan baku
router.post("/", penggunaanController.createPenggunaan);

// GET list penggunaan (dengan optional filter tanggal dan cabang)
router.get("/", penggunaanController.getPenggunaanFiltered);
router.get("/export/pdf", penggunaanController.exportPDF);
router.get("/export/excel", penggunaanController.exportExcel);

module.exports = router;
