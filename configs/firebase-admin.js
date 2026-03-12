const admin = require('firebase-admin');

// Ensure private key is handled correctly if it contains newlines in .env
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                })
            });
            console.log("Firebase Admin Initialized Successfully");
        }
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
} else {
    console.warn("Firebase Admin credentials missing in environment variables. Token verification will be skipped or fail.");
}

module.exports = admin;
