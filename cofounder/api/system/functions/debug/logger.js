/**
 * Logs a message to the server console.
 *
 * @param {object} context - The context object (not used in this simple logger).
 * @param {object} data - The data object containing the message and level.
 * @param {string} data.message - The message to log.
 * @param {string} [data.level='INFO'] - The log level (e.g., INFO, WARN, ERROR).
 * @returns {Promise<object>} A promise that resolves to a success object.
 */
async function logMessage({ context, data }) {
  const level = data.level || 'INFO';
  const message = data.message;

  if (message === undefined) {
    console.warn('[SYSTEM:DEBUG::LOG_MESSAGE] Warning: Message is undefined.');
    return { status: 'warning', message: 'Message was undefined' };
  }

  console.log(`[${level.toUpperCase()}] [SYSTEM:DEBUG::LOG_MESSAGE] ${message}`);
  
  return { status: 'success', message: 'Message logged successfully' };
}

export default {
  "SYSTEM:DEBUG::LOG_MESSAGE": logMessage,
};
