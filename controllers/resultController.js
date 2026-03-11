const { client } = require('../configs/db');
const { logSystemEvent } = require('../services/loggingService');

const uploadResult = async (req, res) => {
    const { candidate_name, position, event_name } = req.body;

    if (!candidate_name || !position || !event_name) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Cloudinary Transformation Logic
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const publicId = "blank_certificate_vrn8cf";
        
        // Cloudinary Variables Method (Bypasses most 401/Security filters)
        // We use !...! to wrap text which handles spaces automatically
        const candidate = (candidate_name || '').replace(/[!,]/g, ' '); 
        const pos = (position || '').replace(/[!,]/g, ' '); 
        const event = (event_name || '').replace(/[!,]/g, ' '); 

        // Define variables first, then apply them to text layers with proper spacing
        const transformations = [
            `$c_name_!${candidate}!`,
            `$c_pos_!${pos}!`,
            `$c_event_!${event}!`,
            `l_text:Arial_80_bold:$(c_name)/co_rgb:111111,g_center,y_-60`,
            `l_text:Arial_45_bold:$(c_pos)/co_rgb:ffb464,g_center,y_80`,
            `l_text:Arial_35:$(c_event)/co_rgb:555555,g_center,y_180`
        ].join('/');

        const certificate_url = `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}.png`;

        const result = await client`
            INSERT INTO event_management.results (candidate_name, position, event_name, certificate_url)
            VALUES (${candidate_name}, ${position}, ${event_name}, ${certificate_url})
            RETURNING *
        `;

        res.status(201).json({
            message: "Result uploaded successfully",
            result: result[0]
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('newResultPublished', result[0]);

            logSystemEvent(io, {
                action: "RESULT_PUBLISHED",
                category: "ADMIN",
                userName: req.admin?.name,
                details: `Result for ${event_name} published: ${candidate_name} - ${position}`
            });
        }
    } catch (error) {
        console.error("Upload Result Error Details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ 
            message: "Internal server error", 
            details: error.message 
        });
    }
};

const getResults = async (req, res) => {
    try {
        const results = await client`
            SELECT * FROM event_management.results 
            ORDER BY created_at DESC
        `;
        res.status(200).json(results);
    } catch (error) {
        console.error("Fetch Results Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteResult = async (req, res) => {
    const { id } = req.params;

    try {
        await client`
            DELETE FROM event_management.results WHERE id = ${id}
        `;
        res.status(200).json({ message: "Result deleted successfully" });

        const io = req.app.get('io');
        if (io) {
            io.emit('resultDeleted', { id });
        }
    } catch (error) {
        console.error("Delete Result Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    uploadResult,
    getResults,
    deleteResult
};
