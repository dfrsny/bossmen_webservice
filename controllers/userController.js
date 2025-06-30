const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

// Ambil semua akun
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("❌ Gagal ambil data user:", error);
    res.status(500).json({ message: "Gagal ambil data user" });
  }
};

// Hapus akun user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.deleteUser(id);
    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    console.error("❌ Gagal hapus user:", error);
    res.status(500).json({ message: "Gagal hapus user" });
  }
};

// Update akun user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    await userModel.updateUser(id, { email, password: hashedPassword });

    res.json({ message: "User berhasil diperbarui" });
  } catch (error) {
    console.error("❌ Gagal update user:", error);
    res.status(500).json({ message: "Gagal update user" });
  }
};
