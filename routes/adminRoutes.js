const express = require('express');
const router = express.Router();
const { adminLogin, getTeamLeads } = require('../controllers/adminController');
const { getRegistrationStatus, updateRegistrationStatus, updateMaintenanceMode } = require('../controllers/settingsController');
const { getCollegeReps, deleteCollegeRep } = require('../controllers/repController');
const { getAllEvents, updateEventStatus } = require('../controllers/eventsController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin Login Route
router.post('/login', adminLogin);

// Fetches all team leads (Core only ideally, but protected by auth for now)
router.get('/team-leads', authMiddleware, getTeamLeads);

// System Settings Routes
router.get('/registration-status', getRegistrationStatus);
router.put('/update-registration-status', authMiddleware, updateRegistrationStatus);
router.put('/update-maintenance-mode', authMiddleware, updateMaintenanceMode);

// Event Management Routes (Admin specific)
router.get('/events', authMiddleware, getAllEvents);
router.put('/events/:id/status', authMiddleware, updateEventStatus);

const { getAllRegistrations } = require('../controllers/participantController');

// Participant/Rep Management (Admin only)
router.get('/participants', authMiddleware, getCollegeReps);
router.delete('/participants/:id', authMiddleware, deleteCollegeRep);
router.get('/event-registrations', authMiddleware, getAllRegistrations);

module.exports = router;
