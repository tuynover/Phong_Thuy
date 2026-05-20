const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');

router.get('/hexagrams/:userId', HistoryController.getHexagramHistory);
router.get('/bazi/:userId', HistoryController.getBaziHistory);
router.put('/hexagrams/:id/rate', HistoryController.rateHexagram);
router.put('/bazi/:id/rate', HistoryController.rateBazi);
router.put('/hexagrams/:id/link', HistoryController.linkHexagram);
router.put('/bazi/:id/link', HistoryController.linkBazi);
router.post('/hexagrams/:id/interpret', HistoryController.interpretHexagram);

module.exports = router;
