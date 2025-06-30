const db = require("../config/db");
exports.createRental = async (data) => {
  const {
    id_ps,
    id_karyawan,
    nama_penyewa,
    alamat_penyewa,
    no_telp_penyewa,
    foto_orang,
    foto_identitas_jaminan,
    total_harga_sewa,
    id_cabang,
    tanggal_kembali,
    status_sewa,
  } = data;

  const query = `
    INSERT INTO Sewa_Dibawa_Pulang 
    (
      id_ps, id_karyawan, nama_penyewa, alamat_penyewa, no_telp_penyewa, 
      foto_orang, foto_identitas_jaminan, total_harga_sewa, id_cabang, 
      tanggal_kembali, status_sewa
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_ps,
    id_karyawan,
    nama_penyewa,
    alamat_penyewa,
    no_telp_penyewa,
    foto_orang,
    foto_identitas_jaminan,
    total_harga_sewa,
    id_cabang,
    tanggal_kembali,
    status_sewa,
  ];

  const [result] = await db.execute(query, values);
  return result.insertId;
};

exports.updateStatus = async (id, status) => {
  const query = `
    UPDATE Sewa_Dibawa_Pulang
    SET status_sewa = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id_sewa_bawa_pulang = ?
  `;
  const [result] = await db.execute(query, [status, id]);
  return result;
};

exports.getActiveRentalByConsoleId = async (id_ps) => {
  const query = `
    SELECT * FROM Sewa_Dibawa_Pulang
    WHERE id_ps = ? AND status_sewa IN ('menunggu persetujuan admin', 'disetujui')
    ORDER BY created_at DESC LIMIT 1
  `;
  const [rows] = await db.execute(query, [id_ps]);
  return rows[0];
};

exports.getRentalById = async (id) => {
  const query = `
    SELECT * FROM Sewa_Dibawa_Pulang
    WHERE id_sewa_bawa_pulang = ?
  `;
  const [rows] = await db.execute(query, [id]);
  return rows[0];
};

exports.getRentalsByStatusAndBranch = async (status, id_cabang) => {
  let query = `
    SELECT s.*, ps.nama_ps, k.nama_karyawan, c.nama_cabang
    FROM Sewa_Dibawa_Pulang s
    JOIN PS ps ON s.id_ps = ps.id_ps
    JOIN Karyawan k ON s.id_karyawan = k.id_karyawan
    JOIN Cabang c ON s.id_cabang = c.id_cabang
    WHERE s.status_sewa = ?
  `;
  const params = [status];

  if (id_cabang) {
    query += ` AND s.id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY s.created_at DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};
