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

module.exports = { getCollegeReps, deleteCollegeRep };
