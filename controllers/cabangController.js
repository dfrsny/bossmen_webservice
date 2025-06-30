const cabangModel = require("../models/cabangModel");

exports.getAllCabang = async (req, res) => {
  try {
    const cabang = await cabangModel.getAll();
    res.json(cabang);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data cabang" });
  }
};

exports.createCabang = async (req, res) => {
  try {
    const { nama_cabang, alamat } = req.body;
    if (!nama_cabang)
      return res.status(400).json({ message: "Nama cabang wajib diisi" });

    const result = await cabangModel.create({ nama_cabang, alamat });
    res
      .status(201)
      .json({ message: "Cabang berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan cabang" });
  }
};

exports.updateCabang = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_cabang, alamat } = req.body;

    await cabangModel.update(id, { nama_cabang, alamat });
    res.json({ message: "Cabang berhasil diupdate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengupdate cabang" });
  }
};

exports.deleteCabang = async (req, res) => {
  try {
    const { id } = req.params;

    await cabangModel.delete(id);
    res.json({ message: "Cabang berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus cabang" });
  }
};
