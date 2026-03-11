const express = require('express');
const router = express.Router();
const { getColleges } = require('../controllers/publicController');
const { createCollegeRep } = require('../controllers/repController');

const { getResults } = require('../controllers/resultController');

router.get('/colleges', getColleges);
router.post('/register-rep', createCollegeRep);
router.get('/results', getResults);

module.exports = router;
