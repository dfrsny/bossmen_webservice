const db = require("../config/db");

exports.createReport = async (req, res) => {
  try {
    const { id_karyawan, deskripsi_report, id_cabang } = req.body;

    const fotoUrls = req.files.map(
      (file) => `/uploads/report/${file.filename}`
    );

    await db.query(
      `INSERT INTO report (id_karyawan, deskripsi_report, foto_report_urls, id_cabang)
       VALUES (?, ?, ?, ?)`, // Changed 'Report' to 'report'
      [id_karyawan, deskripsi_report, JSON.stringify(fotoUrls), id_cabang]
    );

    res.status(201).json({ message: "Laporan berhasil dikirim" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengirim laporan" });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.*, k.nama_karyawan, c.nama_cabang
      FROM report r                       -- Changed 'Report' to 'report'
      JOIN karyawan k ON r.id_karyawan = k.id_karyawan -- Changed 'Karyawan' to 'karyawan'
      JOIN cabang c ON r.id_cabang = c.id_cabang     -- Changed 'Cabang' to 'cabang'
      ORDER BY r.created_at DESC
    `);

    const result = rows.map((r) => ({
      ...r,
      foto_report_urls: JSON.parse(r.foto_report_urls || "[]"),
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data laporan" });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM report WHERE id_report = ?`, [
      // Changed 'Report' to 'report'
      req.params.id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Laporan tidak ditemukan" });

    const report = rows[0];
    report.foto_report_urls = JSON.parse(report.foto_report_urls || "[]");

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil laporan" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status_report } = req.body;
    if (!["unread", "read"].includes(status_report)) {
      return res.status(400).json({ error: "Status tidak valid" });
    }

    await db.query(`UPDATE report SET status_report = ? WHERE id_report = ?`, [
      // Changed 'Report' to 'report'
      status_report,
      req.params.id,
    ]);

    res.json({ message: "Status laporan berhasil diperbarui" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal memperbarui status laporan" });
  }
};
