const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const upload = require("../middlewares/uploadMiddleware"); // gunakan upload yang sudah ada

router.post("/", upload.array("fotos", 5), reportController.createReport);
router.get("/", reportController.getAllReports);
router.get("/:id", reportController.getReportById);
router.put("/:id/status", reportController.updateStatus);

module.exports = router;
