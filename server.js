// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // sesuaikan jika butuh keamanan
  },
});

// Middleware untuk memasukkan io ke req (untuk dipakai di controller)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("📡 Client connected:", socket.id);

  // Join ke room berdasarkan id_cabang
  socket.on("join_branch", (id_cabang) => {
    socket.join(`branch_${id_cabang}`);
    console.log(`➡️ Socket ${socket.id} joined branch_${id_cabang}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));

// API Routes
const authRoutes = require("./routes/authRoutes");
const floorPlanRoutes = require("./routes/floorPlanRoutes");
const rentalDitempatRoutes = require("./routes/rentalDitempatRoutes");
const rentalDibawaPulangRoutes = require("./routes/rentalBawaPulangRoutes");
const deviceTokenRoutes = require("./routes/deviceTokenRoutes");
const psRoutes = require("./routes/psRoutes");
const cabangRoutes = require("./routes/cabangRoutes");
const karyawanRoutes = require("./routes/karyawanRoutes");
const jenisPsRoutes = require("./routes/jenisPsRoutes");
const gameRoutes = require("./routes/gameRoutes");
const makananRoutes = require("./routes/makananRoutes");
const transaksiMakananRoutes = require("./routes/transaksiMakananRoutes");
const bahanBakuRoutes = require("./routes/bahanBakuRoutes");
const penggunaanBahanRoutes = require("./routes/penggunaanBahanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes"); // 🚀 Tambahkan ini
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes); // ✅ Register dashboard route
app.use("/api/reports", reportRoutes);
app.use("/api/bahan-baku", bahanBakuRoutes);
app.use("/api/penggunaan-bahan", penggunaanBahanRoutes);
app.use("/api/transaksi-makanan", transaksiMakananRoutes);
app.use("/api/jenis-ps", jenisPsRoutes);
app.use("/api/makanan", makananRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/floorplan", floorPlanRoutes);
app.use("/api/rental-ditempat", rentalDitempatRoutes);
app.use("/api/rental-dibawa-pulang", rentalDibawaPulangRoutes);
app.use("/api/device-token", deviceTokenRoutes);
app.use("/api/ps", psRoutes);
app.use("/api/cabang", cabangRoutes);
app.use("/api/karyawan", karyawanRoutes);

// Health Check
app.get("/", (req, res) => {
  res.send("Bossmen PlayStation API is running...");
});

// Jalankan server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
