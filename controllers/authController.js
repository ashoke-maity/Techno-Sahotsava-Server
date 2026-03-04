const { client } = require('../configs/db');
const jwt = require('jsonwebtoken');
const { logSystemEvent } = require('../services/loggingService');

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // SECURITY: Check if registration gateway is open
        const regStatus = await client`
            SELECT value FROM event_management.site_settings 
            WHERE key = 'registration_open' LIMIT 1
        `;
        const isRegistrationOpen = regStatus.length > 0 ? (regStatus[0].value === true || regStatus[0].value === 'true') : false;

        // If registration is CLOSED, check if the email belongs to an ADMIN who can bypass
        if (!isRegistrationOpen) {
            const adminRes = await client`
                SELECT role FROM event_management.admins 
                WHERE email = ${email} LIMIT 1
            `;
            const isAdmin = adminRes.length > 0;

            if (!isAdmin) {
                return res.status(403).json({ message: "REGISTRATION CLOSED: Gateway is currently locked by administration." });
            }
        }

        // Query the college_representatives by email
        const reps = await client`
            SELECT * FROM event_management.college_representatives 
            WHERE email = ${email}
            LIMIT 1
        `;

        if (reps.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = reps[0];

        // Compare password (plain text as requested in previous patterns)
        if (password !== user.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id || user.email, email: user.email, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                college: user.college_name || user.college, // Supporting both column names
                college_name: user.college_name || user.college,
                role: user.role
            }
        });

        // Log the successful login
        const io = req.app.get('io');
        if (io) {
            logSystemEvent(io, {
                action: "REPRESENTATIVE_LOGIN",
                category: "AUTH",
                userName: user.name,
                details: `Auth successful for ${user.college_name || user.college} representative`
            });
        }

    } catch (error) {
        console.error("User Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { userLogin };
