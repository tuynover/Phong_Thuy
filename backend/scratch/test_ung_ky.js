const { parseUngKyBlock } = require('../src/shared/utils/ungKyParser');

const testText = `
Chào bạn, đây là luận giải quẻ Kinh Dịch.
Ý nghĩa tổng quan rất cát tường...

---UNG_KY_START---
- ngày Dần âm lịch
- tháng Thân âm lịch
- ngày 15 tháng 8 âm lịch
- tháng 10 âm lịch
---UNG_KY_END---

Lời khuyên là hãy cẩn trọng.
`;

const castDate = new Date('2026-06-15T12:00:00+07:00'); 
console.log('Testing parseUngKyBlock with ref date:', castDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

const result = parseUngKyBlock(testText, castDate);
console.log('\n--- Cleaned Text Output ---', result.cleanedText);
console.log('\n--- Parsed Ứng Kỳ List ---');
result.ungKyList.forEach((item, index) => {
    console.log(`\n[Item ${index + 1}]:`);
    console.log('  Original Text:', item.originalText);
    console.log('  Lunar Date:', `${item.lunarDay}/${item.lunarMonth}/${item.lunarYear}`);
    console.log('  Is Month Only:', item.isMonthOnly);
    console.log('  Solar Date:', item.solarDate.toLocaleDateString('vi-VN'));
});
