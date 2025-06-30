const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "rahasia_super_aman";

// Middleware umum untuk semua pengguna (memastikan token valid)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🧾 Header Authorization:", authHeader); // Tambahkan ini

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Token tidak ditemukan atau format salah" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("✅ Token valid. Payload:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Gagal verifikasi token:", err.message);
    return res
      .status(403)
      .json({ message: "Token tidak sah atau sudah kedaluwarsa" });
  }
};

// Middleware khusus owner
const verifyOwner = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ message: "Akses ditolak, hanya untuk owner" });
    }
    next();
  });
};

// Middleware khusus karyawan
const verifyKaryawan = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== "karyawan") {
      return res
        .status(403)
        .json({ message: "Akses ditolak, hanya untuk karyawan" });
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  verifyOwner,
  verifyKaryawan,
};
