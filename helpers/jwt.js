const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rahasia_super_aman";

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role,
      id_karyawan: user.id_karyawan || null,
    },
    SECRET_KEY,
    { expiresIn: "7d" }
  );
};

module.exports = { generateToken };
