const db = require("../config/db");

exports.findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `
    SELECT
      u.user_id, u.email, u.password, u.role,
      k.id_karyawan, k.nama_karyawan, k.id_cabang,
      c.nama_cabang
    FROM user u                      
    JOIN karyawan k ON u.id_karyawan = k.id_karyawan 
    JOIN cabang c ON k.id_cabang = c.id_cabang     
    WHERE u.email = ?
  `,
    [email]
  );
  return rows[0];
};

exports.saveDeviceToken = async (user_id, token) => {
  await db.execute(
    `
    INSERT INTO device_token (user_id, token) 
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE token = VALUES(token)
  `,
    [user_id, token]
  );
};

exports.findOwnerByEmail = async (email) => {
  const [rows] = await db.execute(
    `
    SELECT
      user_id, email, password, role
    FROM user    
    WHERE email = ? AND role = 'owner'
  `,
    [email]
  );
  return rows[0];
};

exports.createUser = async ({ email, password, role, id_karyawan }) => {
  await db.execute(
    `INSERT INTO user (email, password, role, id_karyawan)
     VALUES (?, ?, ?, ?)`,
    [email, password, role, id_karyawan]
  );
};

exports.findUserByKaryawanId = async (id_karyawan) => {
  const [rows] = await db.execute(`SELECT * FROM user WHERE id_karyawan = ?`, [
    // Changed 'User' to 'user'
    id_karyawan,
  ]);
  return rows[0];
};
