const { client } = require('../configs/db');

const addParticipants = async (req, res) => {
    // SECURITY: Use email from authenticated token, not client request body
    const repEmail = req.admin.email;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: "Participants data is required" });
    }

    try {
        // 1. Fetch Representative Details from DB to ensure they exist and get their college
        const repRes = await client`
            SELECT id, college_name 
            FROM event_management.college_representatives 
            WHERE email = ${repEmail} LIMIT 1
        `;

        if (repRes.length === 0) {
            return res.status(404).json({ message: "Representative session invalid" });
        }

        const repId = repRes[0].id;
        const collegeName = repRes[0].college_name;

        const results = [];
        for (const p of participants) {
            const regId = `TS-26-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const eventRes = await client`
                SELECT id 
                FROM event_management.events 
                WHERE name = ${p.event} LIMIT 1
            `;
            const eventId = eventRes.length > 0 ? eventRes[0].id : null;

            // 1. Primary Registry (Shared across the same college)
            await client`
                INSERT INTO event_management.event_registrations 
                (registration_id, name, phone, email, college_name, event_registration, rep_id, event_id, status)
                VALUES 
                (${regId}, ${p.name}, ${p.phone}, ${p.email}, ${collegeName}, ${p.event}, ${repId}, ${eventId}, 'CONFIRMED')
            `;

            // 2. Master Archive (Shared across the same college)
            try {
                await client`
                    INSERT INTO event_management.participants 
                    (registration_id, name, phone, email, college_name, event_registration)
                    VALUES 
                    (${regId}, ${p.name}, ${p.phone}, ${p.email}, ${collegeName}, ${p.event})
                    ON CONFLICT (email) DO UPDATE SET 
                        registration_id = EXCLUDED.registration_id,
                        name = EXCLUDED.name,
                        phone = EXCLUDED.phone,
                        college_name = EXCLUDED.college_name,
                        event_registration = EXCLUDED.event_registration
                `;
            } catch (archiveErr) {
                console.warn("Archive Sync Error:", archiveErr.message);
            }

            results.push({ ...p, registration_id: regId });
        }

        res.status(201).json({
            message: "Participants registered successfully",
            count: results.length
        });
    } catch (error) {
        console.error("Add Participants Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * ISOLATION LAYER: Fetches all registrations for THE SAME COLLEGE as the logged-in rep.
 * This ensures Rep A and Rep B from Southern University see each other's data,
 * but Techno India reps see nothing from Southern.
 */
const getRegistrationsByRep = async (req, res) => {
    // SECURITY: ID/Email is pulled from the verified JWT token
    const repEmail = req.admin.email;

    try {
        // Find the college of the currently logged-in representative
        const repRes = await client`
            SELECT college_name 
            FROM event_management.college_representatives 
            WHERE email = ${repEmail} LIMIT 1
        `;

        if (repRes.length === 0) return res.status(404).json({ message: "Session Invalid" });
        const college = repRes[0].college_name;

        // Fetch ALL registrations for this college (Multiple reps can see shared data)
        const registrations = await client`
            SELECT id, registration_id, name, phone, email, college_name, created_at, event_registration as event 
            FROM event_management.event_registrations
            WHERE college_name = ${college}
            ORDER BY created_at DESC
        `;
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Fetch registrations error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * ISOLATION LAYER: Fetches the student repository for the representative's parent college.
 */
const getStudentRepository = async (req, res) => {
    const repEmail = req.admin.email;

    try {
        const repRes = await client`
            SELECT college_name 
            FROM event_management.college_representatives 
            WHERE email = ${repEmail} LIMIT 1
        `;

        if (repRes.length === 0) return res.status(404).json({ message: "Session Invalid" });
        const college = repRes[0].college_name;

        // Fetch master list for the ENTIRE college
        const students = await client`
            SELECT * FROM event_management.participants
            WHERE college_name = ${college}
            ORDER BY name ASC
        `;
        res.status(200).json(students);
    } catch (error) {
        console.error("Fetch repository error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getAllRegistrations = async (req, res) => {
    try {
        const registrations = await client`
            SELECT 
                er.id,
                er.registration_id,
                er.name as participant_name,
                er.email as participant_email,
                er.phone as participant_phone,
                er.college_name,
                er.event_registration as event_name,
                er.created_at,
                cr.name as rep_name,
                cr.email as rep_email
            FROM event_management.event_registrations er
            LEFT JOIN event_management.college_representatives cr ON er.rep_id = cr.id
            ORDER BY er.created_at DESC
        `;
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Fetch All Registrations Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { addParticipants, getRegistrationsByRep, getStudentRepository, getAllRegistrations };
