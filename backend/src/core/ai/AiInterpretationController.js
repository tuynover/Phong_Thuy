const IChingAiController = require('../../modules/iching/controllers/IChingAiController');
const BaziAiController = require('../../modules/bazi/controllers/BaziAiController');
const ZiweiAiController = require('../../modules/ziwei/controllers/ZiweiAiController');
const MarriageAiController = require('../../modules/bazi/controllers/MarriageAiController');
const FeiXingAiController = require('../../modules/feixing/controllers/FeiXingAiController');

class AiInterpretationController {
    static interpretHexagram = IChingAiController.interpretHexagram;
    static chatHexagram = IChingAiController.chatHexagram;
    static interpretBazi = BaziAiController.interpretBazi;
    static chatBazi = BaziAiController.chatBazi;
    static interpretZiwei = ZiweiAiController.interpretZiwei;
    static chatZiwei = ZiweiAiController.chatZiwei;
    static interpretMarriage = MarriageAiController.interpretMarriage;
    static chatMarriage = MarriageAiController.chatMarriage;
    static interpretFeiXing = FeiXingAiController.interpretFeiXing;
    static chatFeiXing = FeiXingAiController.chatFeiXing;
}

module.exports = AiInterpretationController;
