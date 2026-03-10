const express = require('express');
const router = express.Router();
const { adminLogin, getTeamLeads, getCoreMembers, getSystemLogs, verifySystemPassword, deleteAdmin, getHandlers } = require('../controllers/adminController');
const { getRegistrationStatus, updateRegistrationStatus, updateMaintenanceMode, updateCollegesStatus } = require('../controllers/settingsController');
const { getCollegeReps, deleteCollegeRep } = require('../controllers/repController');
const { getAllEvents, updateEventStatus, toggleAllEvents } = require('../controllers/eventsController');
const { getAllRegistrations } = require('../controllers/participantController');
const { getAdminColleges, addAdminCollege, deleteAdminCollege } = require('../controllers/institutionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin Login Route
router.post('/login', adminLogin);

// Personnel Routes
router.get('/team-leads', authMiddleware, getTeamLeads);
router.get('/core-members', authMiddleware, getCoreMembers);
router.get('/participant-handlers', authMiddleware, getHandlers);
router.delete('/members/:id', authMiddleware, deleteAdmin);

// System Settings Routes
router.get('/registration-status', getRegistrationStatus);
router.put('/update-registration-status', authMiddleware, updateRegistrationStatus);
router.put('/update-maintenance-mode', authMiddleware, updateMaintenanceMode);
router.put('/update-colleges-status', authMiddleware, updateCollegesStatus);
router.get('/system-logs', authMiddleware, getSystemLogs);
router.post('/verify-system-password', authMiddleware, verifySystemPassword);

// Event Management Routes
router.get('/events', authMiddleware, getAllEvents);
router.put('/events/toggle-all', authMiddleware, toggleAllEvents);
router.put('/events/:id/status', authMiddleware, updateEventStatus);

// Participant/Rep Management
router.get('/participants', authMiddleware, getCollegeReps);
router.delete('/participants/:id', authMiddleware, deleteCollegeRep);
router.get('/event-registrations', authMiddleware, getAllRegistrations);

// Institution Directory Management
router.get('/colleges', authMiddleware, getAdminColleges);
router.post('/colleges', authMiddleware, addAdminCollege);
router.delete('/colleges/:id', authMiddleware, deleteAdminCollege);

module.exports = router;
