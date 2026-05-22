const express = require('express');
const router = express.Router();
const AiInterpretationController = require('../controllers/AiInterpretationController');

router.post('/hexagrams/:id/interpret', AiInterpretationController.interpretHexagram);
router.post('/bazi/:id/interpret', AiInterpretationController.interpretBazi);
router.post('/hexagrams/:id/chat', AiInterpretationController.chatHexagram);
router.post('/bazi/:id/chat', AiInterpretationController.chatBazi);

module.exports = router;
