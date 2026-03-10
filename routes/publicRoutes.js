const express = require('express');
const router = express.Router();
const { getColleges } = require('../controllers/publicController');
const { createCollegeRep } = require('../controllers/repController');

router.get('/colleges', getColleges);
router.post('/register-rep', createCollegeRep);

module.exports = router;
