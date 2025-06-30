const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// 📊 Ringkasan statistik dashboard (jumlah sewa, pendapatan, dll)
router.get("/summary", dashboardController.getSummary);

// 📈 Grafik pendapatan harian (default: 7 hari terakhir atau filter tanggal)
router.get("/pendapatan-harian", dashboardController.getPendapatanHarian);

// 📅 Grafik pendapatan mingguan (default: 8 minggu atau filter tahun)
router.get("/pendapatan-mingguan", dashboardController.getPendapatanMingguan);

// 📆 Grafik pendapatan bulanan (default: 12 bulan atau filter tahun)
router.get("/pendapatan-bulanan", dashboardController.getPendapatanBulanan);

// 📆 Grafik pendapatan tahunan (berdasarkan tahun)
router.get("/pendapatan-tahunan", dashboardController.getPendapatanTahunan);

module.exports = router;
