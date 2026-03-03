const { neon } = require('@neondatabase/serverless');
const client = neon(process.env.NEON_URI);

const connectDB = async () => {
    try {
        await client`
            CREATE TABLE IF NOT EXISTS event_management.site_settings (
                key TEXT PRIMARY KEY,
                value JSONB
            );
        `;
        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('registration_open', 'false'::jsonb)
            ON CONFLICT (key) DO NOTHING;
        `;

        const AdminData = await client`SELECT * FROM event_management.admins`;
        const CollegeRepData = await client`SELECT * FROM event_management.college_representatives`;
        const EventRegData = await client`SELECT * FROM event_management.event_registrations`;
        const EventsData = await client`SELECT * FROM event_management.events`;
        console.log("Successfully fetched admin data:", AdminData);
        console.log("Successfully fetched college representatives data:", CollegeRepData);
        console.log("Successfully fetched Event Registration data:", EventRegData);
        console.log("Successfully fetched Events data:", EventsData);
    } catch (error) {
        console.error("Database Error:", error);
    }
};

module.exports = { connectDB, client };