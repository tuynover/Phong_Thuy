const { Lunar, Solar } = require('lunar-javascript');

const date = new Date('2026-06-13T17:04:00+07:00');
const solar = Solar.fromDate(date);
const lunar = solar.getLunar();

console.log('Solar Date:', solar.toFullString());
console.log('Lunar Date:', lunar.toFullString());
console.log('Year Zhi (Branch):', lunar.getYearZhi());
console.log('Month:', lunar.getMonth());
console.log('Day:', lunar.getDay());
console.log('Time Zhi (Branch):', lunar.getTimeZhi());

const getHourBranchValue = (hour) => {
    if (hour === 23 || hour === 0) return 1; // Tý
    if (hour === 1 || hour === 2) return 2;   // Sửu
    if (hour === 3 || hour === 4) return 3;   // Dần
    if (hour === 5 || hour === 6) return 4;   // Mão
    if (hour === 7 || hour === 8) return 5;   // Thìn
    if (hour === 9 || hour === 10) return 6;  // Tị
    if (hour === 11 || hour === 12) return 7; // Ngọ
    if (hour === 13 || hour === 14) return 8; // Mùi
    if (hour === 15 || hour === 16) return 9; // Thân
    if (hour === 17 || hour === 18) return 10;// Dậu
    if (hour === 19 || hour === 20) return 11;// Tuất
    if (hour === 21 || hour === 22) return 12;// Hợi
    return 1;
};

const getYearBranchValue = (yearZhi) => {
    const mapping = {
        '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
        '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
    };
    return mapping[yearZhi] || 1;
};

const yVal = getYearBranchValue(lunar.getYearZhi());
const mVal = lunar.getMonth();
const dVal = lunar.getDay();
const hVal = getHourBranchValue(date.getHours());

console.log('Values:', { yVal, mVal, dVal, hVal });

const upperVal = (yVal + mVal + dVal) % 8 || 8;
const lowerVal = (yVal + mVal + dVal + hVal) % 8 || 8;
const movingVal = (yVal + mVal + dVal + hVal) % 6 || 6;

console.log('Mai Hoa Results:', { upperVal, lowerVal, movingVal });
