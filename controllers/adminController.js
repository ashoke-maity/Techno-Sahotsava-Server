const { client } = require('../configs/db');
const jwt = require('jsonwebtoken');

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
            { id: user.id, email: user.email, role: user.role },
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
        // Use ILIKE or LOWER for case-insensitive role matching
        const teamLeads = await client`
            SELECT id, name, email, role FROM event_management.admins 
            WHERE role ILIKE 'team_lead' OR role ILIKE 'team lead'
        `;

        res.status(200).json(teamLeads);
    } catch (error) {
        console.error("Fetch Team Leads Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { adminLogin, getTeamLeads };