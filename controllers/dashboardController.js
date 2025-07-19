const db = require("../config/db");
const PDFDocument = require("pdfkit");

const exportPDF = async (req, res) => {
  const { tanggal, id_cabang } = req.query;
  if (!tanggal || !id_cabang) {
    return res
      .status(400)
      .json({ message: "Tanggal dan id_cabang wajib diisi" });
  }

  try {
    // 🧠 Ambil data ringkasan dashboard
    const [summaryResult] = await db.execute(
      `SELECT
        (SELECT COUNT(*) FROM sewa_ditempat WHERE DATE(waktu_mulai) = ? AND id_cabang = ?) AS jumlahSewaDitempat,
        (SELECT COUNT(*) FROM sewa_dibawa_pulang WHERE DATE(created_at) = ? AND id_cabang = ?) AS jumlahSewaBawaPulang,
        (SELECT COUNT(*) FROM transaksi_makanan WHERE DATE(created_at) = ? AND id_cabang = ?) AS jumlahTransaksiMakanan,
        (SELECT COUNT(*) FROM penggunaan_bahan_baku WHERE DATE(created_at) = ? AND id_cabang = ?) AS jumlahPenggunaanBahan,
        (SELECT IFNULL(SUM(durasi_menit),0)/60 FROM sewa_ditempat WHERE DATE(waktu_mulai) = ? AND id_cabang = ?) AS totalJamSewa,
        (SELECT IFNULL(SUM(durasi_menit / 60 * jp.harga_per_jam),0)
          FROM sewa_ditempat sdt JOIN ps ON sdt.id_ps = ps.id_ps
          JOIN jenis_ps jp ON ps.id_jenis_ps = jp.id_jenis_ps
          WHERE DATE(sdt.waktu_mulai) = ? AND sdt.id_cabang = ?) AS pendapatanSewa,
        (SELECT IFNULL(SUM(total_harga),0) FROM transaksi_makanan WHERE DATE(created_at) = ? AND id_cabang = ?) AS pendapatanMakanan
      `,
      [
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
        tanggal,
        id_cabang,
      ]
    );

    const summary = summaryResult[0];
    summary.totalPendapatan =
      Number(summary.pendapatanSewa || 0) +
      Number(summary.pendapatanMakanan || 0);

    // 🧾 Ambil transaksi makanan
    const [transaksi] = await db.execute(
      `
      SELECT tm.id_transaksi_makanan, tm.total_harga, tm.created_at, k.nama_karyawan, 
        mm.nama_makanan, dtm.jumlah, dtm.harga_satuan
      FROM transaksi_makanan tm
      JOIN karyawan k ON tm.id_karyawan = k.id_karyawan
      JOIN detail_transaksi_makanan dtm ON tm.id_transaksi_makanan = dtm.id_transaksi_makanan
      JOIN makanan mm ON dtm.id_makanan = mm.id_makanan
      WHERE DATE(tm.created_at) = ? AND tm.id_cabang = ?
    `,
      [tanggal, id_cabang]
    );

    // 🍳 Ambil penggunaan bahan
    const [penggunaan] = await db.execute(
      `
      SELECT pb.created_at, pb.jumlah_digunakan, pb.keterangan, k.nama_karyawan, bb.nama_bahan_baku, bb.unit_satuan
      FROM penggunaan_bahan_baku pb
      JOIN karyawan k ON pb.id_karyawan = k.id_karyawan
      JOIN bahan_baku bb ON pb.id_bahan_baku = bb.id_bahan_baku
      WHERE DATE(pb.created_at) = ? AND pb.id_cabang = ?
    `,
      [tanggal, id_cabang]
    );

    // 🎮 Sewa harian
    const [ditempat] = await db.execute(
      `
      SELECT sdt.waktu_mulai, sdt.durasi_menit, sdt.status_sewa, k.nama_karyawan, ps.nomor_ps,
        (sdt.durasi_menit / 60 * jp.harga_per_jam) AS total_harga
      FROM sewa_ditempat sdt
      JOIN karyawan k ON sdt.id_karyawan = k.id_karyawan
      JOIN ps ON sdt.id_ps = ps.id_ps
      JOIN jenis_ps jp ON ps.id_jenis_ps = jp.id_jenis_ps
      WHERE DATE(sdt.waktu_mulai) = ? AND sdt.id_cabang = ?
    `,
      [tanggal, id_cabang]
    );

    const [dibawa] = await db.execute(
      `
      SELECT sdp.created_at, sdp.status_sewa, sdp.total_harga_sewa, sdp.nama_penyewa,
        k.nama_karyawan, ps.nomor_ps
      FROM sewa_dibawa_pulang sdp
      JOIN karyawan k ON sdp.id_karyawan = k.id_karyawan
      JOIN ps ON sdp.id_ps = ps.id_ps
      WHERE DATE(sdp.created_at) = ? AND sdp.id_cabang = ?
    `,
      [tanggal, id_cabang]
    );

    // ✨ Buat PDF
    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=dashboard_${tanggal}.pdf`
    );
    doc.pipe(res);

    const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`;

    doc.fontSize(18).text(`Laporan Harian Bossmen`, { align: "center" });
    doc.moveDown().fontSize(12).text(`Tanggal: ${tanggal}`);

    // Ringkasan
    doc.moveDown().fontSize(14).text("Ringkasan:", { underline: true });
    Object.entries(summary).forEach(([k, v]) => {
      const label = k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      doc.text(`${label}: ${typeof v === "number" ? formatCurrency(v) : v}`);
    });

    // Transaksi
    doc.addPage().fontSize(14).text("Transaksi Makanan:", { underline: true });
    transaksi.forEach((t, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${t.nama_karyawan} - ${t.nama_makanan} (${
            t.jumlah
          }x @${formatCurrency(t.harga_satuan)}), Total: ${formatCurrency(
            t.total_harga
          )}`
        );
    });

    // Penggunaan Bahan
    doc.addPage().fontSize(14).text("Penggunaan Bahan:", { underline: true });
    penggunaan.forEach((p, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${p.nama_karyawan} - ${p.nama_bahan_baku} (${
            p.jumlah_digunakan
          } ${p.unit_satuan}) - ${p.keterangan}`
        );
    });

    // Sewa Ditempat
    doc.addPage().fontSize(14).text("Sewa di Tempat:", { underline: true });
    ditempat.forEach((s, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${s.nama_karyawan} - ${s.nomor_ps} (${
            s.durasi_menit
          } menit) - ${s.status_sewa} - ${formatCurrency(s.total_harga)}`
        );
    });

    // Sewa Dibawa
    doc.addPage().fontSize(14).text("Sewa Dibawa Pulang:", { underline: true });
    dibawa.forEach((s, i) => {
      doc
        .fontSize(11)
        .text(
          `${i + 1}. ${s.nama_penyewa} - ${s.nomor_ps} - ${
            s.status_sewa
          } - ${formatCurrency(s.total_harga_sewa)}`
        );
    });

    doc.end();
  } catch (err) {
    console.error("❌ Export PDF error:", err);
    res.status(500).json({ message: "Server error saat export PDF" });
  }
};

// 📊 Summary harian dashboard
const getSummary = async (req, res) => {
  try {
    let { tanggal, id_cabang, id_karyawan } = req.query;

    if (!tanggal) {
      const today = new Date();
      tanggal = today.toISOString().slice(0, 10); // Format: YYYY-MM-DD
    }

    const params = [tanggal];
    let whereCabang = "";
    if (id_cabang) {
      whereCabang += " AND id_cabang = ?";
      params.push(id_cabang);
    }

    if (id_karyawan) {
      whereCabang += " AND id_karyawan = ?";
      params.push(id_karyawan);
    }

    const [sewaDitempat] = await db.execute(
      `SELECT 
        COUNT(*) AS jumlah,
        SUM(durasi_menit) AS total_durasi,
        SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS pendapatan
        FROM sewa_ditempat
        WHERE DATE(waktu_mulai) = ? ${whereCabang}`,
      params
    );

    const [sewaBawaPulang] = await db.execute(
      `SELECT COUNT(*) AS jumlah
        FROM sewa_dibawa_pulang
        WHERE DATE(created_at) = ? AND status_sewa = 'disetujui' ${whereCabang}`,
      params
    );

    const [transMakanan] = await db.execute(
      `SELECT COUNT(*) AS jumlah, SUM(total_harga) AS pendapatan
        FROM transaksi_makanan
        WHERE DATE(created_at) = ? ${whereCabang}`,
      params
    );

    const [penggunaanBahan] = await db.execute(
      `SELECT COUNT(*) AS jumlah 
        FROM penggunaan_bahan_baku 
        WHERE DATE(created_at) = ? ${whereCabang}`,
      params
    );

    // Final processing
    const jumlahSewaDitempat = Number(sewaDitempat[0].jumlah) || 0;
    const jumlahSewaBawaPulang = Number(sewaBawaPulang[0].jumlah) || 0;
    const totalDurasi = Number(sewaDitempat[0].total_durasi) || 0;
    const pendapatanSewa = Number(sewaDitempat[0].pendapatan) || 0;
    const jumlahTransMakanan = Number(transMakanan[0].jumlah) || 0;
    const pendapatanMakanan = Number(transMakanan[0].pendapatan) || 0;
    const jumlahPenggunaanBahan = Number(penggunaanBahan[0].jumlah) || 0;

    res.json({
      jumlah_sewa_ditempat: jumlahSewaDitempat,
      jumlah_sewa_bawa_pulang: jumlahSewaBawaPulang,
      total_jam_sewa: Math.floor(totalDurasi / 60),
      pendapatan_sewa_ditempat: pendapatanSewa,
      jumlah_transaksi_makanan: jumlahTransMakanan,
      pendapatan_makanan: pendapatanMakanan,
      total_pendapatan: pendapatanSewa + pendapatanMakanan,
      total_penggunaan_bahan: jumlahPenggunaanBahan,
    });
  } catch (err) {
    console.error("🔥 Error getSummary:", err);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

// 📆 Grafik pendapatan tahunan
const getPendapatanTahunan = async (req, res) => {
  const { id_cabang } = req.query;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        YEAR(created_at) AS tahun,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, created_at
        FROM sewa_ditempat
        WHERE status_sewa = 'completed' ${id_cabang ? "AND id_cabang = ?" : ""}

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at
        FROM transaksi_makanan
        ${id_cabang ? "WHERE id_cabang = ?" : ""}
      ) AS combined
      GROUP BY tahun
      ORDER BY tahun DESC
    `,
      id_cabang ? [id_cabang, id_cabang] : []
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanTahunan:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil data pendapatan tahunan" });
  }
};

// 📈 Grafik pendapatan harian (7 hari terakhir atau sesuai tanggal)
const getPendapatanHarian = async (req, res) => {
  try {
    const { id_cabang, tanggal } = req.query;

    const where = [];
    const params = [];

    if (tanggal) {
      where.push("DATE(waktu_mulai) = ?");
      params.push(tanggal);
    } else {
      where.push("waktu_mulai >= CURDATE() - INTERVAL 6 DAY");
    }

    if (id_cabang) {
      where.push("id_cabang = ?");
      params.push(id_cabang);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [sewa] = await db.execute(
      `SELECT DATE(waktu_mulai) AS tanggal, 
          SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS sewa
        FROM sewa_ditempat
        ${whereClause}
        GROUP BY DATE(waktu_mulai)`,
      params
    );

    const [makanan] = await db.execute(
      `SELECT DATE(created_at) AS tanggal, SUM(total_harga) AS makanan
        FROM transaksi_makanan
        ${whereClause}
        GROUP BY DATE(created_at)`,
      params
    );

    const map = {};
    sewa.forEach((row) => {
      map[row.tanggal] = { tanggal: row.tanggal, sewa: row.sewa, makanan: 0 };
    });

    makanan.forEach((row) => {
      if (!map[row.tanggal]) {
        map[row.tanggal] = {
          tanggal: row.tanggal,
          sewa: 0,
          makanan: row.makanan,
        };
      } else {
        map[row.tanggal].makanan = row.makanan;
      }
    });

    res.json(Object.values(map));
  } catch (err) {
    console.error("🔥 Error getPendapatanHarian:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil grafik pendapatan harian" });
  }
};

// 📅 Grafik pendapatan mingguan
const getPendapatanMingguan = async (req, res) => {
  const { id_cabang, tahun } = req.query;

  try {
    const where = [];
    const params = [];

    if (tahun) {
      where.push("YEAR(created_at) = ?");
      params.push(tahun);
    }

    if (id_cabang) {
      where.push("id_cabang = ?");
      params.push(id_cabang);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(DATE_SUB(created_at, INTERVAL (WEEKDAY(created_at)) DAY), '%Y-W%u') AS minggu,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, created_at, id_cabang
        FROM sewa_ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM transaksi_makanan
      ) AS combined
      ${whereClause}
      GROUP BY minggu
      ORDER BY minggu DESC
      LIMIT 8
    `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanMingguan:", err);
    res.status(500).json({ message: "Gagal ambil data pendapatan mingguan" });
  }
};

// 📆 Grafik pendapatan bulanan
const getPendapatanBulanan = async (req, res) => {
  const { id_cabang, tahun } = req.query;

  try {
    const where = [];
    const params = [];

    if (tahun) {
      where.push("YEAR(created_at) = ?");
      params.push(tahun);
    }

    if (id_cabang) {
      where.push("id_cabang = ?");
      params.push(id_cabang);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS bulan,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, created_at, id_cabang
        FROM sewa_ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM transaksi_makanan
      ) AS combined
      ${whereClause}
      GROUP BY bulan
      ORDER BY bulan DESC
      LIMIT 12
    `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanBulanan:", err);
    res.status(500).json({ message: "Gagal ambil data pendapatan bulanan" });
  }
};

// Ekspor
module.exports = {
  getSummary,
  getPendapatanHarian,
  getPendapatanMingguan,
  getPendapatanBulanan,
  getPendapatanTahunan,
  exportPDF,
};

// Ekspor
module.exports = {
  getSummary,
  getPendapatanHarian,
  getPendapatanMingguan,
  getPendapatanBulanan,
  getPendapatanTahunan,
  exportPDF,
};
