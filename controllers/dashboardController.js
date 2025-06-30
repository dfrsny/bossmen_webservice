const db = require("../config/db");

// 📊 Summary harian dashboard
const getSummary = async (req, res) => {
  try {
    let { tanggal, id_cabang } = req.query;

    if (!tanggal) {
      const today = new Date();
      tanggal = today.toISOString().slice(0, 10); // Format: YYYY-MM-DD
    }

    const params = [tanggal];
    let whereCabang = "";
    if (id_cabang) {
      whereCabang = " AND id_cabang = ?";
      params.push(id_cabang);
    }

    const [sewaDitempat] = await db.execute(
      `SELECT 
        COUNT(*) AS jumlah,
        SUM(durasi_menit) AS total_durasi,
        SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS pendapatan
       FROM Sewa_Ditempat
       WHERE DATE(waktu_mulai) = ? ${whereCabang}`,
      params
    );

    const [sewaBawaPulang] = await db.execute(
      `SELECT COUNT(*) AS jumlah
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(created_at) = ? AND status_sewa = 'disetujui' ${whereCabang}`,
      params
    );

    const [transMakanan] = await db.execute(
      `SELECT COUNT(*) AS jumlah, SUM(total_harga) AS pendapatan
       FROM Transaksi_Makanan
       WHERE DATE(created_at) = ? ${whereCabang}`,
      params
    );

    const jumlahSewaDitempat = sewaDitempat[0].jumlah || 0;
    const jumlahSewaBawaPulang = sewaBawaPulang[0].jumlah || 0;
    const totalDurasi = sewaDitempat[0].total_durasi || 0;
    const pendapatanSewa = sewaDitempat[0].pendapatan || 0;
    const jumlahTransMakanan = transMakanan[0].jumlah || 0;
    const pendapatanMakanan = transMakanan[0].pendapatan || 0;

    res.json({
      jumlah_sewa_ditempat: jumlahSewaDitempat,
      jumlah_sewa_bawa_pulang: jumlahSewaBawaPulang,
      total_jam_sewa: Math.floor(totalDurasi / 60),
      pendapatan_sewa_ditempat: pendapatanSewa,
      jumlah_transaksi_makanan: jumlahTransMakanan,
      pendapatan_makanan: pendapatanMakanan,
      total_pendapatan: pendapatanSewa + pendapatanMakanan,
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
        FROM Sewa_Ditempat
        WHERE status_sewa = 'completed' ${id_cabang ? "AND id_cabang = ?" : ""}

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at
        FROM Transaksi_Makanan
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
       FROM Sewa_Ditempat
       ${whereClause}
       GROUP BY DATE(waktu_mulai)`,
      params
    );

    const [makanan] = await db.execute(
      `SELECT DATE(created_at) AS tanggal, SUM(total_harga) AS makanan
       FROM Transaksi_Makanan
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
        FROM Sewa_Ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM Transaksi_Makanan
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
        FROM Sewa_Ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM Transaksi_Makanan
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
};
