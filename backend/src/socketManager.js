const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config/auth');
let io;

function initSocketServer(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io'
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      const error = new Error('Socket authentication required');
      error.data = { code: 'UNAUTHORIZED' };
      return next(error);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.data.user = decoded;
      return next();
    } catch (err) {
      console.warn('🔒 Socket auth failed:', err.message || err);
      const error = new Error('Socket authentication failed');
      error.data = { code: 'INVALID_TOKEN' };
      return next(error);
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user || {};
    console.log(`🔌 Admin socket connected: ${socket.id} (${user.email || 'unknown'})`);
    socket.join('backoffice');

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Admin socket disconnected: ${socket.id} (${reason})`);
    });
  });

  io.on('error', (error) => {
    console.error('Socket.io error:', error);
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized.');
  }
  return io;
}

function emitToBackoffice(event, payload) {
  if (!io) {
    console.warn('Socket.io not initialized. Skipping emit for event:', event);
    return;
  }

  io.to('backoffice').emit(event, payload);
}

module.exports = {
  initSocketServer,
  getIO,
  emitToBackoffice
};
