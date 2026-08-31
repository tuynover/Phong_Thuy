require('dotenv').config();
const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');
const AiService = require('../services/AiService');
const { Lunar } = require('lunar-javascript');

async function testUserCase() {
    const lunarObj = Lunar.fromYmd(1966, 8, 19);
    const solarObj = lunarObj.getSolar();
    const dateStr = `${String(solarObj.getDay()).padStart(2, '0')}/${String(solarObj.getMonth()).padStart(2, '0')}/${solarObj.getYear()}`;

    console.log('--- 1. NGÀY ÂM LỊCH QUY ĐỔI SANG DƯƠNG LỊCH ---');
    console.log('Âm lịch: 19/08/1966 21:10 (Giờ Hợi)');
    console.log('Dương lịch quy đổi:', dateStr);

    const baziData = BaziAnalyzer.analyze(dateStr, '21:10', 1);
    const record = {
      inputInfo: { gender: 1, name: 'cobatuoc@gmail.com', date: dateStr, time: '21:10' },
      baziData: baziData,
      tietKhiTimeline: baziData.tietKhiTimeline,
      solarTimeline: baziData.solarDateStr
    };

    console.log('\n--- 2. TỨ TRỤ TÍNH TOÁN BỞI RULE ENGINE ---');
    console.log('Trụ Năm:', baziData.canChi.year.gan, baziData.canChi.year.zhi);
    console.log('Trụ Tháng:', baziData.canChi.month.gan, baziData.canChi.month.zhi);
    console.log('Trụ Ngày (Nhật Chủ):', baziData.canChi.day.gan, baziData.canChi.day.zhi, '--> CAN NGÀY =', baziData.canChi.day.gan);
    console.log('Trụ Giờ:', baziData.canChi.hour.gan, baziData.canChi.hour.zhi);

    const prompt = BaziPrompts.getInterpretationPrompt(record);
    
    console.log('\n--- 3. GỌI GEMINI AI VÀ KẾT QUẢ ĐẦU BƯỚC 1 ---');
    try {
        const stream = await AiService.generateInterpretationStream(prompt);
        let fullText = "";
        for await (const chunk of stream.stream) {
            const t = chunk.text();
            fullText += t;
            process.stdout.write(t);
        }
    } catch (err) {
        console.error('AI Error:', err);
    }
}

testUserCase();
