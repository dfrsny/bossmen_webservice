const rentalDitempatModel = require("../models/rentalDitempatModel");
const db = require("../config/db");

const createSewaDitempat = async (req, res) => {
  try {
    const { id_ps, id_karyawan, nama_penyewa, durasi_menit, id_cabang } =
      req.body;

    if (!id_ps || !id_karyawan || !durasi_menit || !id_cabang) {
      return res.status(400).json({ message: "Data wajib tidak lengkap" });
    }

    // Ambil harga_per_jam dari jenis_ps
    const [[hargaResult]] = await db.execute(
      `SELECT jp.harga_per_jam 
         FROM ps p 
         JOIN jenis_ps jp ON p.id_jenis_ps = jp.id_jenis_ps 
         WHERE p.id_ps = ?`, // Perubahan di sini: PS -> ps, Jenis_PS -> jenis_ps
      [id_ps]
    );

    if (!hargaResult) {
      return res
        .status(404)
        .json({ message: "Harga tidak ditemukan untuk PS ini." });
    }

    const hargaPerJam = hargaResult.harga_per_jam;
    const durasiJam = durasi_menit / 60;
    const total_harga = Math.round(hargaPerJam * durasiJam);

    // Cek status PS
    const [[psStatus]] = await db.execute(
      "SELECT status_fisik FROM ps WHERE id_ps = ?", // Perubahan di sini: PS -> ps
      [id_ps]
    );

    if (!psStatus) {
      return res.status(404).json({ message: "Data PS tidak ditemukan." });
    }

    if (psStatus.status_fisik !== "available") {
      return res.status(400).json({ message: "PS sedang tidak tersedia." });
    }

    const waktu_mulai = new Date();
    const waktu_selesai_estimasi = new Date(
      waktu_mulai.getTime() + durasi_menit * 60000
    );

    const result = await rentalDitempatModel.createSewaDitempat({
      id_ps,
      id_karyawan,
      nama_penyewa,
      waktu_mulai,
      durasi_menit,
      waktu_selesai_estimasi,
      total_harga,
      id_cabang,
    });

    // Update status PS
    await db.execute(
      "UPDATE ps SET status_fisik = 'in_use', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?", // Perubahan di sini: PS -> ps
      [id_ps]
    );

    // Emit ke socket jika ada
    if (req.io) {
      req.io.emit("ps_status_updated", {
        id_ps,
        status_fisik: "in_use",
        action: "sewa_ditempat_dimulai",
        id_sewa_ditempat: result.insertId,
      });
    }

    res.status(201).json({
      message: "Sewa berhasil dimulai",
      id_sewa_ditempat: result.insertId,
    });
  } catch (err) {
    console.error("Gagal buat sewa ditempat:", err);
    res.status(500).json({ message: "Gagal memulai sewa" });
  }
};

const completeSewaDitempat = async (req, res) => {
  try {
    const { id_sewa_ditempat } = req.params;

    const [[sewa]] = await db.execute(
      "SELECT id_ps FROM sewa_ditempat WHERE id_sewa_ditempat = ?", // Perubahan di sini: Sewa_Ditempat -> sewa_ditempat
      [id_sewa_ditempat]
    );

    if (!sewa) {
      return res.status(404).json({ message: "Sewa tidak ditemukan." });
    }

    const result = await rentalDitempatModel.completeSewaDitempat(
      id_sewa_ditempat
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Sewa tidak ditemukan atau sudah diselesaikan" });
    }

    await db.execute(
      "UPDATE ps SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?", // Perubahan di sini: PS -> ps
      [sewa.id_ps]
    );

    if (req.io) {
      req.io.emit("ps_status_updated", {
        id_ps: sewa.id_ps,
        status_fisik: "available",
        action: "sewa_ditempat_selesai",
        id_sewa_ditempat,
      });
    }

    res.json({ message: "Sewa berhasil diselesaikan" });
  } catch (err) {
    console.error("Gagal menyelesaikan sewa:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

const getActiveSewaByPs = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const sewa = await rentalDitempatModel.getActiveSewaByPs(id_ps);

    if (!sewa) {
      return res.status(404).json({ message: "Sewa aktif tidak ditemukan" });
    }

    res.json(sewa);
  } catch (err) {
    console.error("Gagal ambil sewa aktif:", err);
    res.status(500).json({ message: "Gagal ambil sewa aktif" });
  }
};

const getSewaDitempatList = async (req, res) => {
  try {
    const { tanggal, id_cabang, status } = req.query;

    let query = `
      SELECT s.*, p.nomor_ps 
      FROM sewa_ditempat s
      JOIN ps p ON s.id_ps = p.id_ps
      WHERE 1=1
    `; // Perubahan di sini: Sewa_Ditempat -> sewa_ditempat, PS -> ps
    const params = [];

    if (tanggal) {
      query += " AND DATE(s.waktu_mulai) = ?";
      params.push(tanggal);
    }

    if (id_cabang) {
      query += " AND s.id_cabang = ?";
      params.push(id_cabang);
    }

    if (status) {
      query += " AND s.status_sewa = ?";
      params.push(status);
    }

    const [result] = await db.execute(query, params);
    res.json(result);
  } catch (err) {
    console.error("Gagal ambil list sewa ditempat:", err);
    res.status(500).json({ message: "Gagal ambil data" });
  }
};

module.exports = {
  createSewaDitempat,
  completeSewaDitempat,
  getActiveSewaByPs,
  getSewaDitempatList,
};
