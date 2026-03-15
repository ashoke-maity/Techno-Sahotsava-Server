const { client } = require('../configs/db');
const { logSystemEvent } = require('../services/loggingService');

const getAdminColleges = async (req, res) => {
    try {
        const colleges = await client`SELECT * FROM event_management.colleges ORDER BY name ASC`;
        res.status(200).json(colleges);
    } catch (error) {
        console.error("Fetch Admin Colleges Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const addAdminCollege = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "College name required" });
    try {
        await client`INSERT INTO event_management.colleges (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
        
        const io = req.app.get('io');
        if (io) {
            logSystemEvent(io, {
                action: 'COLLEGE_ADDED',
                category: 'DIRECTORY',
                userName: req.admin?.name || 'Admin',
                details: `Added "${name}" to the institutional registry`
            });
            // Broadcast update to all clients (Admin and Main Website)
            io.emit('collegesDirectoryUpdate');
        }

        res.status(201).json({ message: "College added successfully" });
    } catch (error) {
        console.error("Add Admin College Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteAdminCollege = async (req, res) => {
    const { id } = req.params;
    try {
        // Get name before deleting for logging
        const college = await client`SELECT name FROM event_management.colleges WHERE id = ${id}`;
        const collegeName = college[0]?.name || 'Unknown Institution';

        await client`DELETE FROM event_management.colleges WHERE id = ${id}`;
        
        const io = req.app.get('io');
        if (io) {
            logSystemEvent(io, {
                action: 'COLLEGE_REMOVED',
                category: 'DIRECTORY',
                userName: req.admin?.name || 'Admin',
                details: `Removed "${collegeName}" from the institutional registry`
            });
            // Broadcast update to all clients (Admin and Main Website)
            io.emit('collegesDirectoryUpdate');
        }

        res.status(200).json({ message: "College removed successfully" });
    } catch (error) {
        console.error("Delete Admin College Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateAdminCollege = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "College name required" });
    try {
        // Get old name for logging
        const oldCollege = await client`SELECT name FROM event_management.colleges WHERE id = ${id}`;
        const oldName = oldCollege[0]?.name;

        await client`UPDATE event_management.colleges SET name = ${name} WHERE id = ${id}`;
        
        const io = req.app.get('io');
        if (io) {
            logSystemEvent(io, {
                action: 'COLLEGE_UPDATED',
                category: 'DIRECTORY',
                userName: req.admin?.name || 'Admin',
                details: `Renamed "${oldName}" to "${name}"`
            });
            // Broadcast update to all clients
            io.emit('collegesDirectoryUpdate');
        }

        res.status(200).json({ message: "College updated successfully" });
    } catch (error) {
        console.error("Update Admin College Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getAdminColleges, addAdminCollege, deleteAdminCollege, updateAdminCollege };
