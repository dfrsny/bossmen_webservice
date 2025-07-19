const floorPlanModel = require("../models/floorPlanModel");
const mapConsoleStatus = require("../helpers/mapConsoleStatus");

const getConsoleDetail = async (req, res) => {
  try {
    const { id_ps } = req.params;

    const [consoleRows] = await floorPlanModel.getConsoleById(id_ps);
    if (!consoleRows.length) {
      return res.status(404).json({ message: "Console tidak ditemukan" });
    }

    const consoleData = consoleRows[0];
    const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(id_ps);
    const sewaAktif = rentalRows.length > 0;
    const mappedData = mapConsoleStatus(
      consoleData,
      sewaAktif,
      rental?.id_sewa_ditempat || null
    );

    if (!sewaAktif) {
      return res.json({
        status: "available",
        console: mappedData,
      });
    }

    const rental = rentalRows[0];
    const now = new Date();
    const estimasi = new Date(rental.waktu_selesai_estimasi);
    const sisa = Math.max(0, Math.floor((estimasi - now) / 60000)); // dalam menit

    return res.json({
      status: "in_use",
      console: mappedData,
      rental: {
        id_sewa: rental.id_sewa_ditempat,
        nama_penyewa: rental.nama_penyewa,
        sisa_waktu: `${String(Math.floor(sisa / 60)).padStart(2, "0")}:${String(
          sisa % 60
        ).padStart(2, "0")}`,
        waktu_mulai: rental.waktu_mulai,
        estimasi_selesai: rental.waktu_selesai_estimasi,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateConsoleStatus = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const { status_fisik } = req.body;

    const allowedStatuses = ["available", "maintenance"];

    if (!allowedStatuses.includes(status_fisik)) {
      return res.status(400).json({ message: "Status fisik tidak valid" });
    }

    // Update status di DB
    const [result] = await floorPlanModel.updateConsoleStatus(
      id_ps,
      status_fisik
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Console tidak ditemukan" });
    }

    // Ambil data console setelah update untuk keperluan emit
    const [consoleRows] = await floorPlanModel.getConsoleById(id_ps);
    const console = consoleRows[0];

    // Emit ke semua client di cabang ini
    const io = req.app.get("io");
    if (io && console?.id_cabang) {
      io.to(`branch_${console.id_cabang}`).emit("console_status_updated", {
        id_ps,
        status_fisik,
      });
    }

    res.json({
      message: "Status konsol berhasil diperbarui",
      id_ps,
      status_fisik,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConsolesByBranch = async (req, res) => {
  try {
    const { id_cabang } = req.params;
    const [rows] = await floorPlanModel.getConsolesByBranch(id_cabang);

    const consoles = await Promise.all(
      rows.map(async (ps) => {
        const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(
          ps.id_ps
        );
        const sewaAktif = rentalRows.length > 0;
        const idSewa = sewaAktif ? rentalRows[0].id_sewa_ditempat : null;
        const rentalData = sewaAktif ? rentalRows[0] : null;
        return mapConsoleStatus(ps, sewaAktif, idSewa, rentalData);
      })
    );

    res.json({ consoles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFloorPlanByBranch = async (req, res) => {
  try {
    const { id_cabang } = req.params;

    // Ambil semua PS di cabang
    const [consoleRows] = await floorPlanModel.getConsolesByBranch(id_cabang);

    // Untuk tiap PS, ambil status sewa aktif dan id_sewa
    const consolesWithStatus = await Promise.all(
      consoleRows.map(async (ps) => {
        const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(
          ps.id_ps
        );
        const sewaAktif = rentalRows.length > 0;
        const idSewa = sewaAktif ? rentalRows[0].id_sewa_ditempat : null;
        const rentalData = sewaAktif ? rentalRows[0] : null; // ⬅ tambahkan ini
        return mapConsoleStatus(ps, sewaAktif, idSewa, rentalData); // ⬅ kirim rentalData
      })
    );

    res.json(consolesWithStatus);
  } catch (err) {
    console.error("❌ Error floorPlan:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getConsoleDetail,
  updateConsoleStatus,
  getConsolesByBranch,
  getFloorPlanByBranch,
};
