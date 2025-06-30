const db = require("../config/db");

const createTransaksi = async ({ id_karyawan, id_cabang, total_harga }) => {
  const [result] = await db.execute(
    `INSERT INTO Transaksi_Makanan (id_karyawan, id_cabang, total_harga) VALUES (?, ?, ?)`,
    [id_karyawan, id_cabang, total_harga]
  );
  return result.insertId;
};

const createDetail = async (idTransaksi, items) => {
  for (const item of items) {
    const { id_makanan, jumlah, harga_satuan, subtotal } = item;
    await db.execute(
      `INSERT INTO Detail_Transaksi_Makanan 
      (id_transaksi_makanan, id_makanan, jumlah, harga_satuan, subtotal)
      VALUES (?, ?, ?, ?, ?)`,
      [idTransaksi, id_makanan, jumlah, harga_satuan, subtotal]
    );
  }
};

const getAll = async ({ tanggal_awal, tanggal_akhir, id_cabang }) => {
  let query = `SELECT * FROM Transaksi_Makanan WHERE 1`;
  const params = [];

  if (tanggal_awal) {
    query += ` AND DATE(created_at) >= ?`;
    params.push(tanggal_awal);
  }
  if (tanggal_akhir) {
    query += ` AND DATE(created_at) <= ?`;
    params.push(tanggal_akhir);
  }
  if (id_cabang) {
    query += ` AND id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};

const getDetail = async (idTransaksi) => {
  const [rows] = await db.execute(
    `SELECT dm.*, m.nama_makanan 
     FROM Detail_Transaksi_Makanan dm
     JOIN Makanan m ON dm.id_makanan = m.id_makanan
     WHERE dm.id_transaksi_makanan = ?`,
    [idTransaksi]
  );
  return rows;
};

module.exports = {
  createTransaksi,
  createDetail,
  getAll,
  getDetail,
};
