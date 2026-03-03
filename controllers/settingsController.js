const { client } = require('../configs/db');

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

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.status(200).json({
            registration_open: regResult.length > 0 ? (regResult[0].value === true || regResult[0].value === 'true') : false,
            maintenance_mode: maintResult.length > 0 ? (maintResult[0].value === true || maintResult[0].value === 'true') : false
        });
    } catch (error) {
        console.error("Fetch Site Settings Error:", error);
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

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('registrationStatusUpdate', { registration_open });
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
        }
    } catch (error) {
        console.error("Update Maintenance Mode Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getRegistrationStatus,
    updateRegistrationStatus,
    updateMaintenanceMode
};
