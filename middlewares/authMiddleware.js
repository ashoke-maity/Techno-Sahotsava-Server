const jwt = require('jsonwebtoken');
const { client } = require('../configs/db');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Backward compatibility for tokens issued before 'name' was added to the payload
        if (!decoded.name && decoded.email) {
            const adminData = await client`
                SELECT name FROM event_management.admins 
                WHERE email = ${decoded.email} LIMIT 1
            `;
            if (adminData.length > 0 && adminData[0].name) {
                decoded.name = adminData[0].name;
            }
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
