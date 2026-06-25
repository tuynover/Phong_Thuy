const express = require('express');
const router = express.Router();
const AiInterpretationController = require('../controllers/AiInterpretationController');
const creditCheck = require('../middleware/creditCheck');

// IChing (Kinh Dịch) endpoints
router.post('/iching/:id/interpret', creditCheck, AiInterpretationController.interpretHexagram);
router.post('/iching/:id/chat', AiInterpretationController.chatHexagram);
// Legacy aliases for Hexagrams
router.post('/hexagrams/:id/interpret', creditCheck, AiInterpretationController.interpretHexagram);
router.post('/hexagrams/:id/chat', AiInterpretationController.chatHexagram);

// Bazi (Bát Tự) endpoints
router.post('/bazi/:id/interpret', creditCheck, AiInterpretationController.interpretBazi);
router.post('/bazi/:id/chat', AiInterpretationController.chatBazi);

// Ziwei (Tử Vi) endpoints
router.post('/ziwei/:id/interpret', creditCheck, AiInterpretationController.interpretZiwei);
router.post('/ziwei/:id/chat', AiInterpretationController.chatZiwei);

module.exports = router;
