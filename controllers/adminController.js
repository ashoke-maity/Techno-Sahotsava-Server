const { client } = require('../configs/db');
const jwt = require('jsonwebtoken');
const logSystemEvent = require('../services/loggingService');

const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Query the admin by email
        const admin = await client`
            SELECT * FROM event_management.admins 
            WHERE email = ${email}
            LIMIT 1
        `;

        if (admin.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = admin[0];

        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getTeamLeads = async (req, res) => {
    try {
        const teamLeads = await client`
            SELECT id, name, email, role, domain FROM event_management.admins 
            WHERE role ILIKE 'team_lead' OR role ILIKE 'team lead'
        `;

        res.status(200).json(teamLeads);
    } catch (error) {
        console.error("Fetch Team Leads Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getCoreMembers = async (req, res) => {
    try {
        const coreMembers = await client`
            SELECT id, name, email, role, domain FROM event_management.admins 
            WHERE role ILIKE 'core'
        `;

        res.status(200).json(coreMembers);
    } catch (error) {
        console.error("Fetch Core Members Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getSystemLogs = async (req, res) => {
    try {
        // Auto-migration to ensure the table absolutely exists without needing a server restart
        await client`
            CREATE TABLE IF NOT EXISTS event_management.system_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                action TEXT NOT NULL,
                category TEXT NOT NULL,
                user_name TEXT,
                details TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        const logs = await client`
            SELECT * FROM event_management.system_logs 
            ORDER BY timestamp DESC 
            LIMIT 50
        `;
        res.status(200).json(logs);
    } catch (error) {
        console.error("Fetch System Logs Error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const verifySystemPassword = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }

    try {
        await client`
            CREATE TABLE IF NOT EXISTS event_management.system_control_auth (
                id SERIAL PRIMARY KEY,
                password TEXT NOT NULL
            );
        `;

        const countRes = await client`SELECT COUNT(*) FROM event_management.system_control_auth`;
        if (parseInt(countRes[0].count) === 0) {
            const defaultPassword = process.env.SYSTEM_AUTH_PASSWORD;
            await client`INSERT INTO event_management.system_control_auth (password) VALUES (${defaultPassword})`;
        }

        const authRes = await client`
            SELECT * FROM event_management.system_control_auth LIMIT 1
        `;

        const correctPassword = authRes[0].password;
        const systemIo = req.app.get('io');

        if (password === correctPassword) {
            if (systemIo) {
                await logSystemEvent(systemIo, {
                    action: 'SYSTEM_CONTROL_ACCESS',
                    category: (req.admin?.role || 'ADMIN').toUpperCase(),
                    userName: req.admin?.name || 'Unknown User',
                    details: 'Successfully authenticated into System Control'
                });
            }
            return res.status(200).json({ success: true, message: "Access granted" });
        } else {
            if (systemIo) {
                await logSystemEvent(systemIo, {
                    action: 'SYSTEM_CONTROL_ACCESS_DENIED',
                    category: 'AUTH',
                    userName: req.admin?.name || 'Unknown User',
                    details: 'Failed attempt to unlock System Control'
                });
            }
            return res.status(401).json({ success: false, message: "Invalid system password" });
        }
    } catch (error) {
        console.error("Verify System Password Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { adminLogin, getTeamLeads, getCoreMembers, getSystemLogs, verifySystemPassword };