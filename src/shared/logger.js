/* eslint-disable */
const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', msg, ...(meta||{}) })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', msg, ...(meta||{}) })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', msg, ...(meta||{}) })),
};

module.exports = { logger };
