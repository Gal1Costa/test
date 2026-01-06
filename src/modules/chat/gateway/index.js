/* eslint-disable */
/**
 * Chat gateway registers Socket.IO event handlers.
 * Namespace/room pattern: chat:hike:{id}
 * Events in: joinRoom, leaveRoom, sendMessage, sendPhoto
 * Emits: message, photo, systemNotice
 */
function register(io) {
  const nsp = io.of('/'); // default namespace; could be io.of('/chat') later
  nsp.on('connection', (socket) => {
    socket.on('joinRoom', ({ hikeId }) => {
      const room = `chat:hike:${hikeId}`;
      socket.join(room);
      nsp.to(room).emit('systemNotice', { text: `user joined ${socket.id}` });
    });

    socket.on('leaveRoom', ({ hikeId }) => {
      const room = `chat:hike:${hikeId}`;
      socket.leave(room);
      nsp.to(room).emit('systemNotice', { text: `user left ${socket.id}` });
    });

    socket.on('sendMessage', ({ hikeId, text }) => {
      const room = `chat:hike:${hikeId}`;
      nsp.to(room).emit('message', { from: socket.id, text });
    });

    socket.on('sendPhoto', ({ hikeId, url }) => {
      const room = `chat:hike:${hikeId}`;
      nsp.to(room).emit('photo', { from: socket.id, url });
    });
  });
}

module.exports = { register };
