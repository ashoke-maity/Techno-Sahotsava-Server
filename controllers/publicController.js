const { client } = require('../configs/db');

const getColleges = async (req, res) => {
    try {
        const settings = await client`SELECT value FROM event_management.site_settings WHERE key = 'colleges_open' LIMIT 1`;
        const isOpen = settings.length > 0 ? (settings[0].value === true || settings[0].value === 'true') : false;

        if (!isOpen) {
            return res.status(200).json({ success: true, colleges: [], isOpen: false });
        }

        const collegesResult = await client`SELECT name FROM event_management.colleges ORDER BY name ASC`;
        return res.status(200).json({ success: true, colleges: collegesResult, isOpen: true });
    } catch (error) {
        console.error("Fetch Colleges Error:", error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = {
    getColleges
};
