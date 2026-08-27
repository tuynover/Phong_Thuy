const express = require('express');
const router = express.Router();
const AiInterpretationController = require('../controllers/AiInterpretationController');
const creditCheck = require('../middleware/creditCheck');
const optionalAuth = require('../middleware/optionalAuth');
const checkRecordOwnership = require('../middleware/checkRecordOwnership');
const chatCreditCheck = require('../middleware/chatCreditCheck');

const antiSpamLock = require('../middleware/antiSpamLock');

// IChing (Kinh Dịch) endpoints
router.post('/iching/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, AiInterpretationController.interpretHexagram);
router.post('/iching/:id/chat', chatCreditCheck, checkRecordOwnership, AiInterpretationController.chatHexagram);
// Legacy aliases for Hexagrams
router.post('/hexagrams/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, AiInterpretationController.interpretHexagram);
router.post('/hexagrams/:id/chat', chatCreditCheck, checkRecordOwnership, AiInterpretationController.chatHexagram);

// Bazi (Bát Tự) endpoints
router.post('/bazi/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, AiInterpretationController.interpretBazi);
router.post('/bazi/:id/chat', chatCreditCheck, checkRecordOwnership, AiInterpretationController.chatBazi);

// Ziwei (Tử Vi) endpoints
router.post('/ziwei/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, AiInterpretationController.interpretZiwei);
// Marriage (Hợp Hôn) endpoints
router.post('/marriage/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, AiInterpretationController.interpretMarriage);
router.post('/marriage/:id/chat', chatCreditCheck, checkRecordOwnership, AiInterpretationController.chatMarriage);

module.exports = router;
