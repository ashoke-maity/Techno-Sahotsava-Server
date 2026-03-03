const { client } = require('../configs/db');

const getRegistrationStatus = async (req, res) => {
    try {
        const result = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'registration_open' LIMIT 1
        `;

        if (result.length === 0) {
            // Default value if not found
            return res.status(200).json({ registration_open: false });
        }

        res.status(200).json({
            registration_open: result[0].value
        });
    } catch (error) {
        console.error("Fetch Registration Status Error:", error);
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

module.exports = {
    getRegistrationStatus,
    updateRegistrationStatus
};
