const express = require('express');
const router = express.Router();
const DivinationController = require('../controllers/DivinationController');
const ConceptController = require('../controllers/ConceptController');
const BaziController = require('../controllers/BaziController');
const authRoutes = require('./auth');
const historyRoutes = require('./history');
const aiRoutes = require('./ai');

router.use('/auth', authRoutes);
router.use('/history', historyRoutes);
router.use('/ai', aiRoutes);

// Support both unified and legacy namespaces for calculate
router.post('/hexagrams/calculate', DivinationController.calculate);
router.post('/calculate', DivinationController.calculate);

router.get('/concept/:term', ConceptController.getConcept);
router.post('/bazi/analyze', BaziController.analyze);

module.exports = router;
