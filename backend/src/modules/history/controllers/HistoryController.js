const GeneralHistoryController = require('./GeneralHistoryController');
const IChingHistoryController = require('../../iching/controllers/IChingHistoryController');
const BaziHistoryController = require('../../bazi/controllers/BaziHistoryController');
const ZiweiHistoryController = require('../../ziwei/controllers/ZiweiHistoryController');
const MarriageHistoryController = require('../../bazi/controllers/MarriageHistoryController');

class HistoryController {
    // General
    static getAllHistory = GeneralHistoryController.getAllHistory;
    static deleteCalculation = GeneralHistoryController.deleteCalculation;
    static pinCalculation = GeneralHistoryController.pinCalculation;
    static togglePublicCalculation = GeneralHistoryController.togglePublicCalculation;

    // IChing (Hexagrams)
    static getHexagramRecord = IChingHistoryController.getHexagramRecord;
    static getHexagramHistory = IChingHistoryController.getHexagramHistory;
    static rateHexagram = IChingHistoryController.rateHexagram;
    static linkHexagram = IChingHistoryController.linkHexagram;
    static getHexagramChatMessages = IChingHistoryController.getHexagramChatMessages;

    // Bazi
    static getBaziRecord = BaziHistoryController.getBaziRecord;
    static getBaziHistory = BaziHistoryController.getBaziHistory;
    static rateBazi = BaziHistoryController.rateBazi;
    static linkBazi = BaziHistoryController.linkBazi;
    static getBaziChatMessages = BaziHistoryController.getBaziChatMessages;

    // Ziwei
    static getZiweiRecord = ZiweiHistoryController.getZiweiRecord;
    static getZiweiHistory = ZiweiHistoryController.getZiweiHistory;
    static rateZiwei = ZiweiHistoryController.rateZiwei;
    static linkZiwei = ZiweiHistoryController.linkZiwei;
    static getZiweiChatMessages = ZiweiHistoryController.getZiweiChatMessages;

    // Marriage
    static getMarriageRecord = MarriageHistoryController.getMarriageRecord;
    static getMarriageHistory = MarriageHistoryController.getMarriageHistory;
    static rateMarriage = MarriageHistoryController.rateMarriage;
    static getMarriageChatMessages = MarriageHistoryController.getMarriageChatMessages;
}

module.exports = HistoryController;
