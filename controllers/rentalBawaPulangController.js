const rentalModel = require("../models/rentalBawaPulangModel");
const db = require("../config/db");

const createRental = async (req, res) => {
  console.log("📥 req.body:", req.body);
  console.log("🖼️ req.files:", req.files);

  try {
    const data = req.body;
    const files = req.files;

    const fotoOrang = files?.foto_orang?.[0]?.filename || null;
    const fotoIdentitas = files?.foto_identitas_jaminan?.[0]?.filename || null;

    // Validasi input wajib
    if (
      !data.id_ps ||
      !data.id_karyawan ||
      !data.id_cabang ||
      !data.nama_penyewa ||
      !data.alamat_penyewa ||
      !data.no_telp_penyewa ||
      !data.total_harga_sewa ||
      !data.tanggal_kembali
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    // Cek status PS
    const [[psStatus]] = await db.execute(
      "SELECT status_fisik FROM PS WHERE id_ps = ?",
      [data.id_ps]
    );

    if (!psStatus) {
      return res.status(404).json({ message: "Data PS tidak ditemukan." });
    }

    if (psStatus.status_fisik !== "available") {
      return res.status(400).json({ message: "PS sedang tidak tersedia." });
    }

    // Siapkan data untuk insert
    const rentalData = {
      id_ps: data.id_ps,
      id_karyawan: data.id_karyawan,
      id_cabang: data.id_cabang,
      nama_penyewa: data.nama_penyewa,
      alamat_penyewa: data.alamat_penyewa,
      no_telp_penyewa: data.no_telp_penyewa,
      total_harga_sewa: data.total_harga_sewa,
      foto_orang: fotoOrang,
      foto_identitas_jaminan: fotoIdentitas,
      status_sewa: "menunggu persetujuan admin", // default
      tanggal_kembali: data.tanggal_kembali, // wajib diisi!
    };

    // Simpan ke DB
    const insertId = await rentalModel.createRental(rentalData);

    // Update status PS
    await db.execute(
      "UPDATE PS SET status_fisik = 'borrowed_out', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
      [data.id_ps]
    );

    // Emit socket ke cabang
    req.io.to(`branch_${data.id_cabang}`).emit("ps_status_updated", {
      id_ps: data.id_ps,
    });

    res.status(201).json({
      message: "Sewa dibawa pulang berhasil disimpan.",
      id: insertId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gagal menyimpan sewa.",
      error: error.message,
    });
  }
};

// PUT /api/rental-dibawa-pulang/:id/batal
const tolakSewa = async (req, res) => {
  try {
    const { id } = req.params;

    // Update status sewa
    await rentalModel.updateStatus(id, "ditolak");

    // Ambil id_ps dari sewa
    const rental = await rentalModel.getRentalById(id);
    if (rental) {
      await db.execute(
        "UPDATE PS SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
        [rental.id_ps]
      );
    }

    res.status(200).json({ message: "Sewa berhasil dibatalkan." });
  } catch (error) {
    res.status(500).json({
      message: "Gagal membatalkan sewa.",
      error: error.message,
    });
  }
};

// PUT /api/rental-dibawa-pulang/:id/kembali
const kembalikanSewa = async (req, res) => {
  try {
    const { id } = req.params;

    // Update status sewa
    await rentalModel.updateStatus(id, "dikembalikan");

    // Ambil id_ps dari sewa
    const rental = await rentalModel.getRentalById(id);
    if (rental) {
      await db.execute(
        "UPDATE PS SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
        [rental.id_ps]
      );
    }

    res
      .status(200)
      .json({ message: "Sewa berhasil ditandai sebagai dikembalikan." });
  } catch (error) {
    res.status(500).json({
      message: "Gagal memproses pengembalian.",
      error: error.message,
    });
  }
};

// PUT /api/rental-dibawa-pulang/:id/setujui
const setujuiSewa = async (req, res) => {
  try {
    const { id } = req.params;

    // Update status sewa ke 'disetujui'
    await rentalModel.updateStatus(id, "disetujui");

    // Ambil detail rental untuk update status PS
    const rental = await rentalModel.getRentalById(id);
    if (rental) {
      await db.execute(
        "UPDATE PS SET status_fisik = 'borrowed_out', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
        [rental.id_ps]
      );
    }

    res.status(200).json({ message: "Sewa berhasil disetujui." });
  } catch (error) {
    console.error("❌ Gagal menyetujui sewa:", error);
    res.status(500).json({
      message: "Gagal menyetujui sewa.",
      error: error.message,
    });
  }
};

// GET /api/rental-dibawa-pulang/active/:id_ps
const getActiveRentalByConsoleId = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const rental = await rentalModel.getActiveRentalByConsoleId(id_ps);

    if (!rental) {
      return res.status(404).json({
        message: "Tidak ada sewa aktif pada PS ini.",
      });
    }

    res.status(200).json(rental);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data sewa.",
      error: error.message,
    });
  }
};

// GET /api/rental-dibawa-pulang/list?status=xxx&id_cabang=yyy
const listRentalsByStatus = async (req, res) => {
  try {
    const { status, id_cabang } = req.query;

    const allowedStatuses = [
      "menunggu persetujuan admin",
      "disetujui",
      "dikembalikan",
      "ditolak",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    const rentals = await rentalModel.getRentalsByStatusAndBranch(
      status,
      id_cabang
    );

    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data sewa berdasarkan status.",
      error: error.message,
    });
  }
};

const getSewaList = async (req, res) => {
  try {
    const { status, tanggal, id_cabang } = req.query;

    let query = `SELECT * FROM Sewa_Dibawa_Pulang WHERE 1=1`;
    const params = [];

    if (status) {
      query += " AND status_sewa = ?";
      params.push(status);
    }

    if (tanggal) {
      query += " AND DATE(updated_at) = ?"; // GANTI DARI created_at
      params.push(tanggal);
    }

    if (id_cabang) {
      query += " AND id_cabang = ?";
      params.push(id_cabang);
    }

    const [result] = await db.execute(query, params);
    res.json(result);
  } catch (err) {
    console.error("🔥 ERROR getSewaList:", err);
    res.status(500).json({ message: "Gagal memuat data sewa dibawa pulang" });
  }
};

module.exports = {
  createRental,
  tolakSewa,
  kembalikanSewa,
  setujuiSewa,
  getActiveRentalByConsoleId,
  listRentalsByStatus,
  getSewaList,
};
