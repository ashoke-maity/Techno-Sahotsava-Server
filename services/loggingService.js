const { client } = require('../configs/db');

/**
 * System Logger
 * @param {Object} io - Socket.io instance
 * @param {String} action - Description of the action
 * @param {String} category - Category (ADMIN, REP, SYSTEM, AUTH)
 * @param {String} userName - Name of the user performing the action
 * @param {String} details - Additional details string
 */
const logSystemEvent = async (io, { action, category, userName, details }) => {
    try {
        const result = await client`
            INSERT INTO event_management.system_logs (action, category, user_name, details)
            VALUES (${action}, ${category}, ${userName}, ${details})
            RETURNING *
        `;

        const logEntry = result[0];

        // Emit to all connected admins in real-time
        if (io) {
            io.emit('systemLogUpdate', logEntry);
        }

        return logEntry;
    } catch (error) {
        console.error("Critical Logging Failure:", error);
    }
};

// Export directly for maximum compatibility
module.exports = logSystemEvent;
