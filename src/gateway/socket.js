/* eslint-disable */
/**
 * Socket.IO bootstrap for TrailHub.
 * Keep minimal; add namespaces and events as needed.
 */

/**
 * Attach Socket.IO handlers.
 * @param {import('socket.io').Server} io
 */
function attachSocketHandlers(io) {
  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log('socket connected', socket.id);

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('socket disconnected', socket.id);
    });
  });
}

module.exports = { attachSocketHandlers };
