const { insertOrUpdateDeviceToken } = require("../models/deviceTokenModel");

const registerDeviceToken = async (req, res) => {
  try {
    const { user_id, token } = req.body;

    if (!user_id || !token) {
      return res
        .status(400)
        .json({ message: "user_id dan token wajib diisi." });
    }

    await insertOrUpdateDeviceToken(user_id, token);
    res
      .status(200)
      .json({ message: "Device token berhasil disimpan/diupdate." });
  } catch (error) {
    console.error("Error registerDeviceToken:", error);
    res.status(500).json({ message: "Gagal menyimpan device token." });
  }
};

module.exports = {
  registerDeviceToken,
};
