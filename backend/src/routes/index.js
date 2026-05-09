const express = require('express');
const router = express.Router();
const DivinationController = require('../controllers/DivinationController');
const ConceptController = require('../controllers/ConceptController');
const BaziController = require('../controllers/BaziController');

router.post('/calculate', DivinationController.calculate);
router.get('/concept/:term', ConceptController.getConcept);

router.post('/bazi/analyze', BaziController.analyze);

module.exports = router;
