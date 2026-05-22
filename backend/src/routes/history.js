const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');
const AiInterpretationController = require('../controllers/AiInterpretationController');

// History core endpoints
router.get('/hexagrams/:userId', HistoryController.getHexagramHistory);
router.get('/bazi/:userId', HistoryController.getBaziHistory);
router.put('/hexagrams/:id/rate', HistoryController.rateHexagram);
router.put('/bazi/:id/rate', HistoryController.rateBazi);
router.put('/hexagrams/:id/link', HistoryController.linkHexagram);
router.put('/bazi/:id/link', HistoryController.linkBazi);

// Backwards compatibility for legacy chat and stream endpoints
router.post('/hexagrams/:id/interpret', AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', AiInterpretationController.interpretBazi);
router.post('/hexagrams/:id/chat', AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', AiInterpretationController.chatBazi);

module.exports = router;
