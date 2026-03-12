const { client } = require('../configs/db');
const admin = require('../configs/firebase-admin');

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

        const io = req.app.get('io');
        if (io) io.emit('repsUpdate');

        res.status(200).json({ message: "Representative deleted successfully" });
    } catch (error) {
        console.error("Delete Representative Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const createCollegeRep = async (req, res) => {
    const { college, reps, firebaseToken } = req.body;

    if (!college || !reps || !Array.isArray(reps) || reps.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // --- Firebase Token Verification ---
    if (!firebaseToken) {
        return res.status(401).json({ success: false, message: "Authentication required. Please verify your contact details." });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        const verifiedEmail = decodedToken.email;

        // Ensure the verified identity matches one of the representatives being registered
        const isVerifiedMatched = reps.some(r => 
            r.email.toLowerCase() === verifiedEmail?.toLowerCase()
        );

        if (!isVerifiedMatched) {
            return res.status(403).json({ success: false, message: "Verified email does not match the registration data." });
        }
    } catch (authError) {
        console.error("Firebase Auth Verification Failed:", authError);
        return res.status(401).json({ success: false, message: "Invalid or expired verification session." });
    }
    // -----------------------------------

    try {
        // 1. Check current rep count for this college
        const existingReps = await client`
            SELECT password FROM event_management.college_representatives 
            WHERE college_name = ${college}
        `;

        if (existingReps.length + reps.length > 2) {
            return res.status(400).json({ 
                success: false, 
                message: `This college already has ${existingReps.length} representative(s). A maximum of 2 representatives is allowed per institution.` 
            });
        }

        // 2. Determine password
        let password;
        if (existingReps.length > 0) {
            // Reuse existing password for the college
            password = existingReps[0].password;
        } else {
            // Generate a college-inspired random password for the first time
            const cleanCollege = college.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
            password = `S26-${cleanCollege}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        }

        // 3. Insert reps in a transaction-like manner (batch insert or sequential)
        for (const rep of reps) {
            const { firstName, middleName, lastName, email, phone, whatsapp } = rep;
            
            if (!firstName || !lastName || !email || !phone || !whatsapp) {
                return res.status(400).json({ success: false, message: "Missing required information for one or more representatives." });
            }

            await client`
                INSERT INTO event_management.college_representatives (
                    first_name, middle_name, last_name, email, phone, whatsapp, college_name, password
                ) VALUES (
                    ${firstName}, ${middleName || null}, ${lastName}, ${email}, ${phone}, ${whatsapp}, ${college}, ${password}
                )
            `;
        }

        const io = req.app.get('io');
        if (io) io.emit('repsUpdate');

        res.status(201).json({ 
            success: true, 
            message: "Representatives registered successfully!",
            password: password
        });
    } catch (error) {
        console.error("Register Representative Error:", error);
        if (error.code === '23505') { 
            return res.status(400).json({ success: false, message: "One or more email addresses are already registered." });
        }
        res.status(500).json({ success: false, message: "Internal server error. Registration could not be processed." });
    }
};

module.exports = { getCollegeReps, deleteCollegeRep, createCollegeRep };
