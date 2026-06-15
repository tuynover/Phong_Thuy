const express = require('express');
const router = express.Router();
const AiInterpretationController = require('../controllers/AiInterpretationController');
const creditCheck = require('../middleware/creditCheck');

router.post('/hexagrams/:id/interpret', creditCheck, AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', creditCheck, AiInterpretationController.interpretBazi);
router.post('/hexagrams/:id/chat', AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', AiInterpretationController.chatBazi);

module.exports = router;
