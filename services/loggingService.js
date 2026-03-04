const { client } = require('../configs/db');

/**
 * System Logger
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Log data
 */
async function logSystemEvent(io, { action, category, userName, details }) {
    try {
        const result = await client`
            INSERT INTO event_management.system_logs (action, category, user_name, details)
            VALUES (${action}, ${category}, ${userName}, ${details})
            RETURNING *
        `;

        const logEntry = result[0];

        // Emit to all connected admins in real-time
        if (io && typeof io.emit === 'function') {
            io.emit('systemLogUpdate', logEntry);
        }

        return logEntry;
    } catch (error) {
        console.error("Critical Logging Failure:", error);
    }
}

module.exports = { logSystemEvent };
