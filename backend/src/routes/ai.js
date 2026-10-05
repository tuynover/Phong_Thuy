const express = require('express');
const router = express.Router();
const IChingAiController = require('../modules/iching/controllers/IChingAiController');
const BaziAiController = require('../modules/bazi/controllers/BaziAiController');
const ZiweiAiController = require('../modules/ziwei/controllers/ZiweiAiController');
const MarriageAiController = require('../modules/bazi/controllers/MarriageAiController');
const FeiXingAiController = require('../modules/feixing/controllers/FeiXingAiController');
const NumerologyAiController = require('../modules/numerology/controllers/NumerologyAiController');
const creditCheck = require('../core/middleware/creditCheck');
const optionalAuth = require('../core/middleware/optionalAuth');
const checkRecordOwnership = require('../core/middleware/checkRecordOwnership');
const chatRateLimiter = require('../core/middleware/chatRateLimiter');
const chatCreditCheck = require('../core/middleware/chatCreditCheck');
const antiSpamLock = require('../core/middleware/antiSpamLock');

// IChing (Kinh Dịch) endpoints
router.post('/iching/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, IChingAiController.interpretHexagram);
router.post('/iching/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, IChingAiController.chatHexagram);
// Legacy aliases for Hexagrams
router.post('/hexagrams/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, IChingAiController.interpretHexagram);
router.post('/hexagrams/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, IChingAiController.chatHexagram);

// Bazi (Bát Tự) endpoints
router.post('/bazi/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, BaziAiController.interpretBazi);
router.post('/bazi/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, BaziAiController.chatBazi);

// Ziwei (Tử Vi) endpoints
router.post('/ziwei/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, ZiweiAiController.interpretZiwei);
router.post('/ziwei/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, ZiweiAiController.chatZiwei);

// Marriage (Hợp Hôn) endpoints
router.post('/marriage/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, MarriageAiController.interpretMarriage);
router.post('/marriage/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, MarriageAiController.chatMarriage);

// FeiXing (Huyền Không Phi Tinh) endpoints
router.post('/feixing/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, FeiXingAiController.interpretFeiXing);
router.post('/feixing/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, FeiXingAiController.chatFeiXing);
router.post('/huyen-khong/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, FeiXingAiController.interpretFeiXing);
router.post('/huyen-khong/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, FeiXingAiController.chatFeiXing);

// Numerology (Phong Thủy Số: Sim, Biển Số Xe, Tài Khoản Ngân Hàng) endpoints
router.post('/numerology/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, NumerologyAiController.interpretNumerology);
router.post('/numerology/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, NumerologyAiController.chatNumerology);
router.post('/phong-thuy-so/:id/interpret', optionalAuth, checkRecordOwnership, antiSpamLock(), creditCheck, NumerologyAiController.interpretNumerology);
router.post('/phong-thuy-so/:id/chat', optionalAuth, checkRecordOwnership, chatRateLimiter, chatCreditCheck, NumerologyAiController.chatNumerology);

module.exports = router;
