const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');

try {
    const baziData = BaziAnalyzer.analyze('15/12/1995', '10:30', 1);
    const baziRecord = {
        inputInfo: { name: 'Test User', date: '15/12/1995', time: '10:30', gender: 1 },
        solarTimeline: '15/12/1995 10:30:00',
        tietKhiTimeline: 'Đại Tuyết',
        baziData: baziData
    };
    const prompt = BaziPrompts.getInterpretationPrompt(baziRecord);
    console.log("=== GENERATED BAZI PROMPT ===");
    console.log(prompt);
} catch (error) {
    console.error("Test error:", error);
}
