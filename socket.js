// socket.js
let ioInstance;

function initSocket(server) {
  const { Server } = require("socket.io");
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    socket.on("join_branch", (idCabang) => {
      const roomName = `cabang_${idCabang}`;
      socket.join(roomName);
      console.log(`👥 Joined room: ${roomName}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO belum diinisialisasi.");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO };
