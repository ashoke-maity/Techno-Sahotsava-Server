const express = require('express');
const router = express.Router();
const { adminLogin, getTeamLeads } = require('../controllers/adminController');
const { getRegistrationStatus, updateRegistrationStatus } = require('../controllers/settingsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin Login Route
router.post('/login', adminLogin);

// Fetches all team leads (Core only ideally, but protected by auth for now)
router.get('/team-leads', authMiddleware, getTeamLeads);

// Registration Settings Routes
router.get('/registration-status', getRegistrationStatus);
router.put('/update-registration-status', authMiddleware, updateRegistrationStatus);

module.exports = router;
