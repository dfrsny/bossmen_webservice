const db = require("../config/db");

// CRUD Makanan
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM makanan ORDER BY created_at DESC` // Perubahan di sini: Makanan -> makanan
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data game" });
  }
};

exports.getMenu = async (req, res) => {
  const { id_cabang } = req.query;
  let query = `SELECT id_makanan, nama_makanan, harga_jual FROM makanan WHERE 1=1`; // Perubahan di sini: Makanan -> makanan
  const params = [];

  if (id_cabang) {
    query += ` AND id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(query, params);
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nama_makanan, harga_jual, jumlah_stok, id_cabang } = req.body;
  await db.execute(
    `INSERT INTO makanan (nama_makanan, harga_jual, jumlah_stok, id_cabang) VALUES (?, ?, ?, ?)`, // Perubahan di sini: Makanan -> makanan
    [nama_makanan, harga_jual, jumlah_stok, id_cabang]
  );
  res.status(201).json({ message: "Makanan ditambahkan" });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_makanan, harga_jual, jumlah_stok } = req.body;
  await db.execute(
    `UPDATE makanan SET nama_makanan = ?, harga_jual = ?, jumlah_stok = ? WHERE id_makanan = ?`, // Perubahan di sini: Makanan -> makanan
    [nama_makanan, harga_jual, jumlah_stok, id]
  );
  res.json({ message: "Makanan diupdate" });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  await db.execute(`DELETE FROM makanan WHERE id_makanan = ?`, [id]); // Perubahan di sini: Makanan -> makanan
  res.json({ message: "Makanan dihapus" });
};

// Transaksi Makanan + Filter
exports.getTransaksiMakanan = async (req, res) => {
  const { id_cabang, tanggal_awal, tanggal_akhir } = req.query;

  let query = `SELECT * FROM transaksi_makanan WHERE 1=1`; // Perubahan di sini: Transaksi_Makanan -> transaksi_makanan
  const params = [];

  if (id_cabang) {
    query += ` AND id_cabang = ?`;
    params.push(id_cabang);
  }

  if (tanggal_awal && tanggal_akhir) {
    query += ` AND DATE(created_at) BETWEEN ? AND ?`;
    params.push(tanggal_awal, tanggal_akhir);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(query, params);
  res.json(rows);
};

exports.getDetailTransaksi = async (req, res) => {
  const { id } = req.params;
  const [details] = await db.execute(
    `SELECT dtm.*, m.nama_makanan 
     FROM detail_transaksi_makanan dtm 
     JOIN makanan m ON dtm.id_makanan = m.id_makanan 
     WHERE dtm.id_transaksi_makanan = ?`, // Perubahan di sini: Detail_Transaksi_Makanan -> detail_transaksi_makanan, Makanan -> makanan
    [id]
  );
  res.json(details);
};
