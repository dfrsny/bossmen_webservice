// websocket/sewaNotifier.js
let ioInstance = null;

function registerSocketIO(io) {
  ioInstance = io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO belum didaftarkan.");
  }
  return ioInstance;
}

module.exports = {
  registerSocketIO,
  getIO,
};
