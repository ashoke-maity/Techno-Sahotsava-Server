const { client } = require('../configs/db');
const jwt = require('jsonwebtoken');

const userLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
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

    } catch (error) {
        console.error("User Login Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { userLogin };
