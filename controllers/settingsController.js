const { client } = require('../configs/db');
const { logSystemEvent } = require('../services/loggingService');

const getRegistrationStatus = async (req, res) => {
    try {
        const regResult = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'registration_open' LIMIT 1
        `;

        const maintResult = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'maintenance_mode' LIMIT 1
        `;

        const collegesResult = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'colleges_open' LIMIT 1
        `;

        const resultModeResult = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'result_mode' LIMIT 1
        `;

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.status(200).json({
            registration_open: regResult.length > 0 ? (regResult[0].value === true || regResult[0].value === 'true') : false,
            maintenance_mode: maintResult.length > 0 ? (maintResult[0].value === true || maintResult[0].value === 'true') : false,
            colleges_open: collegesResult.length > 0 ? (collegesResult[0].value === true || collegesResult[0].value === 'true') : false,
            result_mode: resultModeResult.length > 0 ? (resultModeResult[0].value === true || resultModeResult[0].value === 'true') : false
        });
    } catch (error) {
        console.error("Fetch Site Settings Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateResultMode = async (req, res) => {
    const { result_mode } = req.body;

    if (result_mode === undefined) {
        return res.status(400).json({ message: "Result mode status is required" });
    }

    try {
        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('result_mode', ${result_mode})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;

        res.status(200).json({
            message: "Result mode updated successfully",
            result_mode
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('resultModeUpdate', { result_mode });

            logSystemEvent(io, {
                action: result_mode ? "RESULT_MODE_ENABLED" : "RESULT_MODE_DISABLED",
                category: "ADMIN",
                userName: req.admin?.name || "System Admin",
                details: `Result announcement mode switched to ${result_mode ? 'ACTIVE' : 'LOCKED'}`
            });
        }
    } catch (error) {
        console.error("Update Result Mode Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateRegistrationStatus = async (req, res) => {
    const { registration_open } = req.body;

    if (registration_open === undefined) {
        return res.status(400).json({ message: "Registration status is required" });
    }

    try {
        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('registration_open', ${registration_open})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;

        res.status(200).json({
            message: "Registration status updated successfully",
            registration_open
        });

        // Emit real-time update as strictly typed boolean
        const io = req.app.get('io');
        if (io) {
            const statusBool = String(registration_open) === 'true';
            console.log(`[SYSTEM] Broadcasting Registration Gateway Status: ${statusBool ? 'OPEN' : 'CLOSED'}`);
            io.emit('registrationStatusUpdate', { registration_open: statusBool });

            // Log the event
            logSystemEvent(io, {
                action: statusBool ? "REGISTRATION_OPENED" : "REGISTRATION_CLOSED",
                category: "ADMIN",
                userName: req.admin?.name || "System Admin",
                details: `Gateway protocol switched to ${statusBool ? 'ACTIVE' : 'LOCKED'}`
            });
        }
    } catch (error) {
        console.error("Update Registration Status Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateMaintenanceMode = async (req, res) => {
    const { maintenance_mode } = req.body;

    if (maintenance_mode === undefined) {
        return res.status(400).json({ message: "Maintenance mode status is required" });
    }

    try {
        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('maintenance_mode', ${maintenance_mode})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;

        res.status(200).json({
            message: "Maintenance mode updated successfully",
            maintenance_mode
        });

        // Emit real-time update via WebSockets
        const io = req.app.get('io');
        if (io) {
            io.emit('maintenanceModeUpdate', { maintenance_mode });

            // Log the event
            logSystemEvent(io, {
                action: maintenance_mode ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
                category: "ADMIN",
                userName: req.admin?.name || "System Admin",
                details: `Maintenance protocol flipped to ${maintenance_mode ? 'CRITICAL' : 'STANDBY'}`
            });
        }
    } catch (error) {
        console.error("Update Maintenance Mode Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateCollegesStatus = async (req, res) => {
    const { colleges_open } = req.body;

    if (colleges_open === undefined) {
        return res.status(400).json({ message: "Colleges status is required" });
    }

    try {
        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('colleges_open', ${colleges_open})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;

        res.status(200).json({
            message: "Colleges status updated successfully",
            colleges_open
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('collegesStatusUpdate', { colleges_open });

            logSystemEvent(io, {
                action: colleges_open ? "COLLEGES_OPENED" : "COLLEGES_CLOSED",
                category: "ADMIN",
                userName: req.admin?.name || "System Admin",
                details: `Colleges public portal switched to ${colleges_open ? 'ACTIVE' : 'LOCKED'}`
            });
        }
    } catch (error) {
        console.error("Update Colleges Status Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getRegistrationStatus,
    updateRegistrationStatus,
    updateMaintenanceMode,
    updateCollegesStatus,
    updateResultMode
};
