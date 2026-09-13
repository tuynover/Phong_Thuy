const express = require('express');
const router = express.Router();
const IChingAiController = require('../modules/iching/controllers/IChingAiController');
const BaziAiController = require('../modules/bazi/controllers/BaziAiController');
const ZiweiAiController = require('../modules/ziwei/controllers/ZiweiAiController');
const MarriageAiController = require('../modules/bazi/controllers/MarriageAiController');
const creditCheck = require('../core/middleware/creditCheck');
const optionalAuth = require('../core/middleware/optionalAuth');
const checkRecordOwnership = require('../core/middleware/checkRecordOwnership');
const chatCreditCheck = require('../core/middleware/chatCreditCheck');
const antiSpamLock = require('../core/middleware/antiSpamLock');

// IChing (Kinh Dịch) endpoints
router.post('/iching/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, IChingAiController.interpretHexagram);
router.post('/iching/:id/chat', chatCreditCheck, checkRecordOwnership, IChingAiController.chatHexagram);
// Legacy aliases for Hexagrams
router.post('/hexagrams/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, IChingAiController.interpretHexagram);
router.post('/hexagrams/:id/chat', chatCreditCheck, checkRecordOwnership, IChingAiController.chatHexagram);

// Bazi (Bát Tự) endpoints
router.post('/bazi/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, BaziAiController.interpretBazi);
router.post('/bazi/:id/chat', chatCreditCheck, checkRecordOwnership, BaziAiController.chatBazi);

// Ziwei (Tử Vi) endpoints
router.post('/ziwei/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, ZiweiAiController.interpretZiwei);
router.post('/ziwei/:id/chat', chatCreditCheck, checkRecordOwnership, ZiweiAiController.chatZiwei);

// Marriage (Hợp Hôn) endpoints
router.post('/marriage/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, MarriageAiController.interpretMarriage);
router.post('/marriage/:id/chat', chatCreditCheck, checkRecordOwnership, MarriageAiController.chatMarriage);

module.exports = router;
