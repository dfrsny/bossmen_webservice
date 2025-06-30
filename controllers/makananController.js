const db = require("../config/db");

// CRUD Makanan
exports.getAll = async (req, res) => {
  const [rows] = await db.execute(
    `SELECT * FROM Makanan ORDER BY created_at DESC`
  );
  res.json(rows);
};

exports.create = async (req, res) => {
  const { nama_makanan, harga_jual, jumlah_stok, id_cabang } = req.body;
  await db.execute(
    `INSERT INTO Makanan (nama_makanan, harga_jual, jumlah_stok, id_cabang) VALUES (?, ?, ?, ?)`,
    [nama_makanan, harga_jual, jumlah_stok, id_cabang]
  );
  res.status(201).json({ message: "Makanan ditambahkan" });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_makanan, harga_jual, jumlah_stok } = req.body;
  await db.execute(
    `UPDATE Makanan SET nama_makanan = ?, harga_jual = ?, jumlah_stok = ? WHERE id_makanan = ?`,
    [nama_makanan, harga_jual, jumlah_stok, id]
  );
  res.json({ message: "Makanan diupdate" });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  await db.execute(`DELETE FROM Makanan WHERE id_makanan = ?`, [id]);
  res.json({ message: "Makanan dihapus" });
};

// Transaksi Makanan + Filter
exports.getTransaksiMakanan = async (req, res) => {
  const { id_cabang, tanggal_awal, tanggal_akhir } = req.query;

  let query = `SELECT * FROM Transaksi_Makanan WHERE 1=1`;
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
     FROM Detail_Transaksi_Makanan dtm 
     JOIN Makanan m ON dtm.id_makanan = m.id_makanan 
     WHERE dtm.id_transaksi_makanan = ?`,
    [id]
  );
  res.json(details);
};
