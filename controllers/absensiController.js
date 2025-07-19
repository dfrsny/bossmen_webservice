const db = require("../config/db");
const path = require("path");
const fs = require("fs");

const createAbsensi = async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    const id_karyawan = data.id_karyawan;
    const id_cabang = data.id_cabang;
    const tipe_absensi = data.tipe_absensi; // 'masuk' atau 'pulang'
    const foto = files?.foto_absensi?.[0]?.filename;

    if (!id_karyawan || !id_cabang || !tipe_absensi || !foto) {
      return res.status(400).json({ message: "Field tidak boleh kosong." });
    }

    // Validasi tipe_absensi
    if (!["masuk", "pulang"].includes(tipe_absensi)) {
      return res.status(400).json({ message: "Tipe absensi tidak valid." });
    }

    // Cek apakah sudah absen hari ini untuk tipe yang sama
    const [existing] = await db.execute(
      `SELECT * FROM absensi 
       WHERE id_karyawan = ? AND tipe_absensi = ? AND DATE(created_at) = CURDATE()`,
      [id_karyawan, tipe_absensi]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: `Karyawan sudah absen ${tipe_absensi} hari ini.` });
    }

    // Simpan ke database
    await db.execute(
      `INSERT INTO absensi (id_karyawan, foto_absensi, tipe_absensi, id_cabang) 
       VALUES (?, ?, ?, ?)`,
      [id_karyawan, foto, tipe_absensi, id_cabang]
    );

    res
      .status(201)
      .json({ message: `Absensi ${tipe_absensi} berhasil disimpan.` });
  } catch (err) {
    console.error("❌ Gagal menyimpan absensi:", err);
    res.status(500).json({
      message: "Gagal menyimpan absensi.",
      error: err.message,
    });
  }
};

// Ambil data absensi harian untuk karyawan
const getAbsensiHariIni = async (req, res) => {
  try {
    const { id_karyawan } = req.params;

    const [result] = await db.execute(
      `SELECT * FROM absensi 
       WHERE id_karyawan = ? AND DATE(created_at) = CURDATE()`,
      [id_karyawan]
    );

    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data absensi", error: err.message });
  }
};

module.exports = {
  createAbsensi,
  getAbsensiHariIni,
};
