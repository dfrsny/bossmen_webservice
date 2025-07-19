const mysql = require("mysql2/promise"); // ✅ ganti ini
require("dotenv").config();

const connection = mysql.createPool({
  // ✅ pakai createPool lebih baik
  host: process.env.DB_HOST || "trolley.proxy.rlwy.net",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "yTbZWyTVMjPHusNoPngBXPLLohkNdXmY",
  database: process.env.DB_NAME || "railway",
  port: process.env.DB_PORT || 41816,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = connection;
