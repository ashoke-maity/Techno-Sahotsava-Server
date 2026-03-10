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
            CREATE TABLE IF NOT EXISTS event_management.colleges (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            );
        `;

        await client`
            CREATE TABLE IF NOT EXISTS event_management.college_representatives (
                id SERIAL PRIMARY KEY,
                first_name TEXT,
                middle_name TEXT,
                last_name TEXT,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                whatsapp TEXT,
                college_name TEXT,
                password TEXT,
                role TEXT DEFAULT 'college_rep',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client`
            INSERT INTO event_management.site_settings (key, value)
            VALUES ('registration_open', 'false'::jsonb),
                   ('colleges_open', 'true'::jsonb)
            ON CONFLICT (key) DO NOTHING;
        `;

        const AdminData = await client`SELECT * FROM event_management.admins`;
        const CollegeRepData = await client`SELECT * FROM event_management.college_representatives`;
        const EventRegData = await client`SELECT * FROM event_management.event_registrations`;
        const EventsData = await client`SELECT * FROM event_management.events`;
        const ParticipantsData = await client`SELECT * FROM event_management.participants`;
    } catch (error) {
        console.error("Database Error:", error);
    }
};

module.exports = { connectDB, client };