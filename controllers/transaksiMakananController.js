const model = require("../models/transaksiMakananModel");

const create = async (req, res) => {
  const { id_karyawan, id_cabang, total_harga, items } = req.body;

  if (!id_karyawan || !id_cabang || !total_harga || !Array.isArray(items)) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    const idTransaksi = await model.createTransaksi({
      id_karyawan,
      id_cabang,
      total_harga,
    });

    await model.createDetail(idTransaksi, items);
    res.status(201).json({ message: "Transaksi berhasil", id: idTransaksi });
  } catch (err) {
    console.error("Gagal membuat transaksi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAll = async (req, res) => {
  const { tanggal_awal, tanggal_akhir, id_cabang } = req.query;

  try {
    const data = await model.getAll({ tanggal_awal, tanggal_akhir, id_cabang });
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil transaksi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const detail = await model.getDetail(id);
    res.json(detail);
  } catch (err) {
    console.error("Gagal ambil detail:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  create,
  getAll,
  getDetail,
};
