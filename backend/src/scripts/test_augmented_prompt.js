const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');

const testCases = [
    { name: 'Jack Ma (Mã Vân)', date: '10/09/1964', time: '09:15', gender: 1 },
    { name: 'Steve Jobs', date: '24/02/1955', time: '19:15', gender: 1 },
    { name: 'Trịnh Công Sơn', date: '28/02/1939', time: '15:30', gender: 1 },
    { name: 'Đặng Lệ Quân (Teresa Teng)', date: '29/01/1953', time: '06:15', gender: 0 }
];

console.log('=== VERIFYING AUGMENTED BAZI PROMPT GENERATION ===\n');

testCases.forEach(tc => {
    const baziData = BaziAnalyzer.analyze(tc.date, tc.time, tc.gender);
    const record = {
        inputInfo: { name: tc.name, date: tc.date, time: tc.time, gender: tc.gender },
        solarTimeline: `${tc.date} ${tc.time}:00`,
        tietKhiTimeline: 'Bạch Lộ',
        baziData: baziData
    };
    const prompt = BaziPrompts.getInterpretationPrompt(record);
    
    console.log(`--- TestCase: ${tc.name} ---`);
    console.log(`Tứ Trụ: ${baziData.canChi.year.canChi} | ${baziData.canChi.month.canChi} | ${baziData.canChi.day.canChi} | ${baziData.canChi.hour.canChi}`);
    console.log(`Thân: ${baziData.analysis?.thanDegree || baziData.analysis?.than} | Cách Cục: ${baziData.analysis?.cachCuc}`);
    
    // Check if new requirements are in prompt
    const hasMission = prompt.includes('Sứ mệnh cuộc đời & Bài học tâm tính cốt lõi');
    const hasStrengthsBlindspots = prompt.includes('Điểm mạnh trời sinh') && prompt.includes('Điểm mù bản năng');
    const hasCareerPeak = prompt.includes('Giai đoạn / Độ tuổi phát triển đỉnh cao rực rỡ nhất');
    const hasWealthCycles = prompt.includes('Chu kỳ Tài vận thịnh - suy');
    const hasSpousePersona = prompt.includes('Chân dung & tính cách mẫu bạn đời phù hợp');
    const hasHealthAges = prompt.includes('Các mốc độ tuổi có hạn sức khỏe/tật ách cần đặc biệt lưu tâm');
    const has3TurningPoints = prompt.includes('3 Bước Ngoặt Lớn Nhất Cuộc Đời');
    
    console.log(`Verification:`);
    console.log(`  - Điểm mạnh & Điểm mù: ${hasStrengthsBlindspots ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Sứ mệnh & Bài học tâm tính: ${hasMission ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Đỉnh cao sự nghiệp: ${hasCareerPeak ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Chu kỳ tài vận thịnh suy: ${hasWealthCycles ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Chân dung bạn đời & con cái hậu vận: ${hasSpousePersona ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Hạn sức khỏe theo độ tuổi: ${hasHealthAges ? '✅ YES' : '❌ NO'}`);
    console.log(`  - 3 Bước ngoặt lớn nhất cuộc đời: ${has3TurningPoints ? '✅ YES' : '❌ NO'}`);
    console.log(`Prompt length: ${prompt.length} chars\n`);
});
