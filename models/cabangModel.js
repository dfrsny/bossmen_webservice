const db = require("../config/db");

const getAll = async () => {
  const [rows] = await db.execute(
    `SELECT * FROM cabang ORDER BY created_at DESC`
  );
  return rows;
};

const create = async ({ nama_cabang, alamat }) => {
  const [result] = await db.execute(
    `INSERT INTO cabang (nama_cabang, alamat) VALUES (?, ?)`,
    [nama_cabang, alamat]
  );
  return result;
};

const update = async (id, { nama_cabang, alamat }) => {
  await db.execute(
    `UPDATE cabang SET nama_cabang = ?, alamat = ? WHERE id_cabang = ?`,
    [nama_cabang, alamat, id]
  );
};

const deleteCabang = async (id) => {
  await db.execute(`DELETE FROM cabang WHERE id_cabang = ?`, [id]);
};

module.exports = {
  getAll,
  create,
  update,
  delete: deleteCabang,
};
