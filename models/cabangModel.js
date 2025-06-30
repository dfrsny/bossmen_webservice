const db = require("../config/db");

const getAll = async () => {
  const [rows] = await db.execute(
    `SELECT * FROM Cabang ORDER BY created_at DESC`
  );
  return rows;
};

const create = async ({ nama_cabang, alamat }) => {
  const [result] = await db.execute(
    `INSERT INTO Cabang (nama_cabang, alamat) VALUES (?, ?)`,
    [nama_cabang, alamat]
  );
  return result;
};

const update = async (id, { nama_cabang, alamat }) => {
  await db.execute(
    `UPDATE Cabang SET nama_cabang = ?, alamat = ? WHERE id_cabang = ?`,
    [nama_cabang, alamat, id]
  );
};

const deleteCabang = async (id) => {
  await db.execute(`DELETE FROM Cabang WHERE id_cabang = ?`, [id]);
};

// ✅ Perbaikan di bawah
module.exports = {
  getAll,
  create,
  update,
  delete: deleteCabang,
};
