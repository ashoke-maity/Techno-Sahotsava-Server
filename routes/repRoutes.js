const express = require('express');
const router = express.Router();
const { getCollegeReps, deleteCollegeRep } = require('../controllers/repController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all reps (Admin access only)
router.get('/participants', authMiddleware, getCollegeReps);

// Delete a rep (Admin access only)
router.delete('/participants/:id', authMiddleware, deleteCollegeRep);

module.exports = router;
