const { client } = require('../configs/db');
const { logSystemEvent } = require('../services/loggingService');

const getAllEvents = async (req, res) => {
    try {
        const events = await client`
            SELECT * FROM event_management.events
            ORDER BY domain ASC, name ASC
        `;
        res.status(200).json(events);
    } catch (error) {
        console.error("Fetch Events Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateEventStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    try {
        // Attempting update with a safe cast for UUID if necessary
        // Most Neon/Postgres setups will handle the string-to-uuid conversion, 
        // but we'll use a robust query structure.
        const result = await client`
            UPDATE event_management.events 
            SET status = ${status}
            WHERE id::text = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: "Event protocol not found in registry" });
        }

        // Emit real-time update via WebSockets using the database verified ID
        const io = req.app.get('io');
        if (io) {
            io.emit('eventStatusUpdate', { id: result[0].id, status });
            io.emit('eventUpdate');

            // Log the event
            logSystemEvent(io, {
                action: status === 'ACTIVE' ? "EVENT_ACTIVATED" : "EVENT_DEACTIVATED",
                category: "ADMIN",
                userName: req.admin?.name || "System Admin",
                details: `Protocol [${result[0].name}] set to ${status}`
            });
        }

        res.status(200).json({
            message: "Event registration status updated successfully",
            event: result[0]
        });
    } catch (error) {
        console.error("Update Event Status Error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            hint: "Ensure 'status' column exists in event_management.events table"
        });
    }
};

const toggleAllEvents = async (req, res) => {
    const { status } = req.body;

    if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
        return res.status(400).json({ message: "Valid status (ACTIVE/INACTIVE) is required" });
    }

    try {
        await client`
            UPDATE event_management.events 
            SET status = ${status}
        `;

        // Emit real-time update via WebSockets
        const io = req.app.get('io');
        if (io) {
            io.emit('globalEventStatusUpdate', { status });
            io.emit('eventUpdate');

            // Log the event
            logSystemEvent(io, {
                action: status === 'ACTIVE' ? "MASS_ACTIVATION" : "MASS_SHUTDOWN",
                category: "CORE",
                userName: req.admin?.name || "Core Member",
                details: `All event protocols forced to ${status}`
            });
        }

        res.status(200).json({
            message: `All events set to ${status} successfully`
        });
    } catch (error) {
        console.error("Toggle All Events Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getAllEvents, updateEventStatus, toggleAllEvents };
