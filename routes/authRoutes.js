const express = require('express');
const router = express.Router();
const { userLogin } = require('../controllers/authController');
const { addParticipants, getRegistrationsByRep, getStudentRepository } = require('../controllers/participantController');
const { getAllEvents } = require('../controllers/eventsController');
const authMiddleware = require('../middlewares/authMiddleware');

// User / Representative Login Route
router.post('/login', userLogin);

// Participant & Registry Management (Authenticated via JWT Token)
// These routes now enforce Institutional Isolation based on the logged-in user's college.
router.post('/add-participants', authMiddleware, addParticipants);
router.get('/my-participants', authMiddleware, getRegistrationsByRep);
router.get('/my-repository', authMiddleware, getStudentRepository);

// Event Management
router.get('/events', getAllEvents);

module.exports = router;
