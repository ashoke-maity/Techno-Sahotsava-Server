const { client } = require('../configs/db');

const getCollegeReps = async (req, res) => {
    try {
        // Query all college representatives - using column names from the actual database
        // Selecting * to be safe with dynamically added columns
        const reps = await client`
            SELECT * FROM event_management.college_representatives
            ORDER BY email DESC
        `;

        res.status(200).json(reps);
    } catch (error) {
        console.error("Fetch College Reps Error:", error);
        res.status(500).json({ message: "Internal server error", details: error.message });
    }
};

const deleteCollegeRep = async (req, res) => {
    const { id } = req.params;
    try {
        // Using email as identifier if id is not present, or checking for both
        await client`
            DELETE FROM event_management.college_representatives 
            WHERE id = ${id} OR email = ${id}
        `;
        res.status(200).json({ message: "Representative deleted successfully" });
    } catch (error) {
        console.error("Delete Representative Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const createCollegeRep = async (req, res) => {
    const { firstName, middleName, lastName, email, phone, whatsapp, college } = req.body;

    if (!email || !firstName || !lastName || !college) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Simple random password generation
        const password = 'REP' + Math.random().toString(36).substring(2, 8).toUpperCase();

        await client`
            INSERT INTO event_management.college_representatives (
                first_name, middle_name, last_name, email, phone, whatsapp, college_name, password
            ) VALUES (
                ${firstName}, ${middleName || null}, ${lastName}, ${email}, ${phone}, ${whatsapp}, ${college}, ${password}
            )
        `;

        res.status(201).json({ 
            success: true, 
            message: "Representative registered successfully!",
            password // Optionally returning it if the client needs to show it temporarily
        });
    } catch (error) {
        console.error("Register Representative Error:", error);
        if (error.code === '23505') { // Unique constraint violation (email)
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { getCollegeReps, deleteCollegeRep, createCollegeRep };
